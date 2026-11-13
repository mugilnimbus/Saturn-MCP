"""LangGraph playbook: a bounded, read-only research worker.

    decide (model picks one tool) ─▶ act (code runs it) ─▶ decide … ─▶ finalize (code checks locations, model reviews support)

The loop cannot run away: the last step offers only `Finish`, the graph has a
recursion limit, every observation is capped, and cited locations are checked in code. A separate model review checks support.
"""

from __future__ import annotations

import operator
import re
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from saturn.application.agent_tools import Toolbox
from saturn.application.graphs.support import review_claims
from saturn.application.ports import ModelGateway
from saturn.domain.errors import InvalidInput, ModelOutputInvalid, NotFound, PolicyViolation
from saturn.domain.text_ops import clip
from saturn.domain.tokens import estimate_tokens

_SYSTEM = (
    "You are a read-only research worker. You can look at files and stored command outputs; you cannot change anything. "
    "Use grep before reading whole ranges. Pick exactly one tool per step. "
    "When you can answer, call Finish with a short answer and the evidence (source and line number). "
    "Each evidence source must be the exact file path or artifact id, never a tool call such as read_lines(...). "
    "Finish as soon as the evidence answers the task; do not repeat a search or read you already did. "
    "If the answer is not in the sources, say so in Finish instead of guessing."
)


class ListDir(BaseModel):
    """List the entries of a directory."""

    path: str = Field(".", description="Directory path.")


class ReadLines(BaseModel):
    """Read a range of lines (at most 120) from a file or a stored output."""

    source: str = Field(description="File path or artifact id (art_...).")
    start: int = Field(1, ge=1)
    end: int = Field(60, ge=1)


class Grep(BaseModel):
    """Search a file, a directory, or a stored output for a regular expression."""

    pattern: str = Field(description="Regular expression, case-insensitive.")
    source: str = Field(".", description="File, directory, or artifact id (art_...).")
    glob: str | None = Field(None, description="Optional file name filter such as *.py")


class Evidence(BaseModel):
    source: str = Field(description="Exact file path or artifact id. Do not include a tool call, formatting, or a :line suffix.")
    line: int = Field(ge=1, description="The one-based line number in that source.")


class Finish(BaseModel):
    """Finish with the answer."""

    answer: str = Field(max_length=900, description="The answer, brief and specific.")
    evidence: list[Evidence] = Field(default_factory=list, max_length=5, description="Where the answer comes from.")


class AgentState(TypedDict, total=False):
    task: str
    sources: list[str]
    max_steps: int
    seeded: int
    steps: Annotated[list[dict[str, str]], operator.add]
    done_calls: Annotated[list[str], operator.add]
    force_finish: bool
    pending: BaseModel
    prompt_tokens: Annotated[int, operator.add]
    result: dict[str, Any]


SCRATCHPAD_TOKENS = 2600


def _scratchpad(steps: list[dict[str, str]], budget: int = SCRATCHPAD_TOKENS) -> str:
    """Render the steps so far. Results stay whole while they fit; only then do the oldest ones shrink."""
    if not steps:
        return "(no steps yet)"
    observations = [s["observation"] for s in steps]

    def render() -> str:
        return "\n".join(f"{i}. {s['call']} →\n{o}" for i, (s, o) in enumerate(zip(steps, observations, strict=True), start=1))

    for index in range(len(observations) - 1):  # the newest result is never shortened
        if estimate_tokens(render()) <= budget:
            break
        rows = observations[index].split("\n")
        if len(rows) > 3:
            observations[index] = "\n".join(rows[:3]) + "\n… (shortened; run it again if you need the rest)"
    return render()


def build_agent_graph(gateway: ModelGateway, tools: Toolbox) -> Any:
    async def decide(state: AgentState) -> dict[str, Any]:
        steps = state.get("steps") or []
        seeded = state.get("seeded", 0)
        remaining = state["max_steps"] + seeded - len(steps)
        sources = ", ".join(state.get("sources") or []) or "the allowed project folders"
        user = (
            f"Task: {state['task']}\nSources: {sources}\n\nSteps so far:\n{_scratchpad(steps)}\n\n"
            + ("This is your last step: call Finish with what you know." if remaining <= 1 else f"You have {remaining} steps left.")
        )
        shown = {s["shown_whole"] for s in steps if s.get("shown_whole")}
        given = state.get("sources") or []
        nothing_left = bool(given) and all(tools.name_of(s) in shown for s in given)
        only_finish = remaining <= 1 or state.get("force_finish", False) or nothing_left
        if only_finish and remaining > 1:
            user = user.rsplit("\n\n", 1)[0] + "\n\nEverything you need is shown above. Call Finish with the answer now."
        offered: list[type[BaseModel]] = [Finish] if only_finish else [ListDir, ReadLines, Grep, Finish]
        try:
            action = await gateway.call(offered, system=_SYSTEM, user=user, purpose=f"agent-step-{len(steps) - seeded + 1}",
                                        max_output_tokens=500)
        except ModelOutputInvalid as exc:
            return {"steps": [{"call": "invalid reply", "observation": exc.message}], "prompt_tokens": estimate_tokens(user)}
        return {"pending": action, "prompt_tokens": estimate_tokens(user)}

    def route(state: AgentState) -> str:
        pending = state.get("pending")
        if isinstance(pending, Finish):
            return "finalize"
        if len(state.get("steps") or []) >= state["max_steps"] + state.get("seeded", 0):
            return "finalize"
        return "act" if pending is not None else "decide"

    def act(state: AgentState) -> dict[str, Any]:
        action = state["pending"]
        signature = f"{type(action).__name__}:{action.model_dump_json()}"
        previous = state.get("steps") or []
        # A redundant action is not run; it means the worker has what it needs, so the next step may only finish.
        if signature in (state.get("done_calls") or []):
            earlier = next((i for i, s in enumerate(previous, start=1) if s.get("signature") == signature), None)
            where = f"step {earlier}" if earlier else "an earlier step"
            return {"steps": [{"call": type(action).__name__ + " (repeated)", "observation":
                    f"Identical to {where}; its result is still shown there. Answer from what is shown."}],
                    "pending": None, "done_calls": [], "force_finish": True}
        target = getattr(action, "source", None)
        if target is not None and tools.name_of(target) in {s["shown_whole"] for s in previous if s.get("shown_whole")}:
            return {"steps": [{"call": type(action).__name__ + " (not needed)", "observation":
                    f"All of {tools.name_of(target)} is already shown above. Answer from it."}],
                    "pending": None, "done_calls": [], "force_finish": True}
        try:
            if isinstance(action, ListDir):
                call, observation = f"list_dir({action.path!r})", tools.list_dir(action.path)
            elif isinstance(action, ReadLines):
                call, observation = f"read_lines({action.source!r}, {action.start}, {action.end})", tools.read_lines(action.source, action.start, action.end)
            elif isinstance(action, Grep):
                call, observation = f"grep({action.pattern!r}, {action.source!r})", tools.grep(action.pattern, action.source, action.glob)
            else:
                call, observation = "unknown", "Unknown tool."
        except (InvalidInput, NotFound, PolicyViolation) as exc:
            call, observation = type(action).__name__, f"Error: {exc.message}"
        step = {"call": call, "observation": observation, "signature": signature}
        if isinstance(action, ReadLines) and tools.shows_whole(action.source, action.start, action.end):
            step["shown_whole"] = tools.name_of(action.source)
        return {"steps": [step], "pending": None, "done_calls": [signature]}

    async def finalize(state: AgentState) -> dict[str, Any]:
        pending = state.get("pending")
        steps = (state.get("steps") or [])[state.get("seeded", 0):]
        if not isinstance(pending, Finish):
            return {"result": {"answer": "", "evidence": [], "unverified": 0, "steps": len(steps), "finished": False}}
        readable, unverified = [], 0
        sources = []
        for item in pending.evidence:
            text = tools.line_text(item.source, item.line)
            if text is None:
                unverified += 1
            else:
                readable.append({"source": item.source, "line": item.line, "text": clip(text.strip(), 110)})
                sources.append(f"{item.source}:{item.line} {text}")
        claims = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", pending.answer.strip()) if part.strip()]
        review = await review_claims(gateway, claims, [sources for _ in claims], purpose="research-support")
        cited = {i for indexes in review.accepted.values() for i in indexes}
        return {"result": {"answer": " ".join(claim for i, claim in enumerate(claims) if i in review.accepted),
                           "evidence": [item for i, item in enumerate(readable) if i in cited],
                           "unverified": unverified, "rejected_claims": review.rejected, "review_warning": review.warning,
                           "steps": len(steps), "finished": True}}

    graph = StateGraph(AgentState)
    graph.add_node("decide", decide)
    graph.add_node("act", act)
    graph.add_node("finalize", finalize)
    graph.add_edge(START, "decide")
    graph.add_conditional_edges("decide", route, {"act": "act", "finalize": "finalize", "decide": "decide"})
    graph.add_edge("act", "decide")
    graph.add_edge("finalize", END)
    return graph.compile()
