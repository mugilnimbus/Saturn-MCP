"""LangGraph playbook: digest long output with a small model, map-reduce style.

    condense (code) ─▶ map_chunk × N (model, parallel via Send) ─▶ reduce (code)

The model only reads short, pre-ranked excerpts and may only cite line numbers
that exist in the excerpt it was given; a separate model review drops facts whose support it cannot establish.
"""

from __future__ import annotations

import operator
from typing import Annotated, Any, TypedDict, cast

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from pydantic import BaseModel, Field

from saturn.application.graphs.support import review_claims
from saturn.application.ports import ModelGateway
from saturn.domain.condense import CLine, chunk, condense
from saturn.domain.errors import ModelOutputInvalid, ModelUnavailable
from saturn.domain.text_ops import clip

_SYSTEM = (
    "You read one excerpt of command output. Lines look like 'L123 ×4 text' (L = line number, ×N = repeats). "
    "Report only facts visible in the excerpt: failures, errors, results, anomalies. "
    "Cite the L number each fact comes from. Never invent lines or numbers. Be brief."
)


class Fact(BaseModel):
    line: int = Field(description="The L number of the line this fact comes from.")
    claim: str = Field(max_length=180, description="What that line shows, in a short sentence.")


class ReportFacts(BaseModel):
    """Report the important facts in the excerpt. Use an empty list when nothing matters."""

    facts: list[Fact] = Field(default_factory=list, max_length=6)


class DigestState(TypedDict, total=False):
    lines: list[str]
    goal: str
    chunk_tokens: int
    max_chunks: int
    chunks: list[list[CLine]]
    facts: Annotated[list[tuple[int, int, str]], operator.add]
    rejected: Annotated[int, operator.add]
    warnings: Annotated[list[str], operator.add]
    result: dict[str, Any]


def build_digest_graph(gateway: ModelGateway) -> Any:
    def condense_node(state: DigestState) -> dict[str, Any]:
        budget = state["chunk_tokens"] * state["max_chunks"]
        kept = condense(state["lines"], goal=state.get("goal", ""), max_tokens=budget)
        return {"chunks": chunk(kept, state["chunk_tokens"])[: state["max_chunks"]]}

    def dispatch(state: DigestState) -> list[Send] | str:
        chunks = state.get("chunks") or []
        if not chunks:
            return "reduce"
        return [Send("map_chunk", {"goal": state.get("goal", ""), "chunk": c}) for c in chunks]

    async def map_chunk(payload: dict[str, Any]) -> dict[str, Any]:
        clines: list[CLine] = payload["chunk"]
        known = {c.line: c for c in clines}
        goal = payload.get("goal") or ""
        user = ("Goal: " + goal + "\n\n" if goal else "") + "Excerpt:\n" + "\n".join(c.render() for c in clines)
        try:
            report = await gateway.call([ReportFacts], system=_SYSTEM, user=user, purpose="digest-chunk", max_output_tokens=500)
        except (ModelUnavailable, ModelOutputInvalid) as exc:
            return {"warnings": [f"{type(exc).__name__}: {exc.message}"]}
        accepted, rejected = [], 0
        for fact in report.facts:
            source = known.get(fact.line)
            if source is None or not fact.claim.strip():
                rejected += 1
                continue
            accepted.append((fact.line, source.count, clip(fact.claim.strip(), 180)))
        review = await review_claims(gateway, [claim for _, _, claim in accepted],
                                     [[known[line].render()] for line, _, _ in accepted], purpose="digest-support")
        facts = [fact for i, fact in enumerate(accepted) if i in review.accepted]
        warnings = [review.warning] if review.warning else []
        return {"facts": facts, "rejected": rejected + review.rejected, "warnings": warnings}

    def reduce_node(state: DigestState) -> dict[str, Any]:
        seen: set[int] = set()
        facts: list[tuple[int, int, str]] = []
        for line, count, claim in sorted(state.get("facts") or []):
            if line not in seen:
                seen.add(line)
                facts.append((line, count, claim))
        return {"result": {"facts": facts, "rejected": state.get("rejected", 0), "warnings": state.get("warnings", [])}}

    graph = StateGraph(DigestState)
    graph.add_node("condense", condense_node)
    graph.add_node("map_chunk", cast(Any, map_chunk))  # receives a Send payload, not the full state
    graph.add_node("reduce", reduce_node)
    graph.add_edge(START, "condense")
    graph.add_conditional_edges("condense", dispatch, ["map_chunk", "reduce"])
    graph.add_edge("map_chunk", "reduce")
    graph.add_edge("reduce", END)
    return graph.compile()
