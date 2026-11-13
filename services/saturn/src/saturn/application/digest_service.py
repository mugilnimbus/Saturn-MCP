"""Turns long text into a short, trustworthy digest: code first, a small model only when needed."""

from __future__ import annotations

from dataclasses import dataclass, field

from saturn.application.graphs.digest_graph import build_digest_graph
from saturn.application.limits import Limits
from saturn.application.ports import ModelGateway
from saturn.application.recorder import Recorder
from saturn.application.tunables import Tunables
from saturn.domain.digest import build_digest, render_digest
from saturn.domain.errors import ModelOutputInvalid, ModelUnavailable
from saturn.domain.tokens import estimate_tokens


@dataclass
class DigestOutcome:
    text: str
    route: str  # digest | digest+llm
    kind: str
    confidence: float
    warnings: list[str] = field(default_factory=list)


class DigestService:
    def __init__(self, recorder: Recorder, gateway: ModelGateway, tunables: Tunables, limits: Limits) -> None:
        self._recorder = recorder
        self._gateway = gateway
        self._tunables = tunables
        self._limits = limits
        self._graph = build_digest_graph(gateway)

    async def digest(self, text: str, *, exit_code: int | None, goal: str | None) -> DigestOutcome:
        with self._recorder.span("deterministic_digest", "step") as span:
            digest = build_digest(text, exit_code=exit_code)
            span.set(kind=digest.kind, confidence=digest.confidence, findings=len(digest.findings), lines=digest.lines)
        budget = self._tunables.digest_token_budget
        wants_model = self._tunables.llm_enabled and (bool(goal) or digest.confidence < self._limits.llm_digest_threshold)
        if not wants_model:
            return DigestOutcome(render_digest(digest, max_tokens=budget), "digest", digest.kind, digest.confidence)

        base = render_digest(digest, max_tokens=int(budget * 0.55))
        warnings: list[str] = []
        facts: list[tuple[int, int, str]] = []
        rejected = 0
        try:
            state = await self._graph.ainvoke(
                {
                    "lines": text.split("\n"),
                    "goal": goal or "",
                    "chunk_tokens": self._limits.map_chunk_tokens,
                    "max_chunks": self._limits.map_max_chunks,
                },
                config={**self._gateway.graph_config("digest"), "recursion_limit": 40},
            )
            result = state["result"]
            already_shown = {f.line for f in digest.findings}
            facts = [fact for fact in result["facts"] if fact[0] not in already_shown]
            warnings = result["warnings"]
            rejected = result["rejected"]
        except (ModelUnavailable, ModelOutputInvalid) as exc:
            warnings.append(exc.message)

        lines = [base]
        if facts:
            lines.append("model-read (line numbers checked; support reviewed by model)" + (f" for '{goal}'" if goal else "") + ":")
            used = estimate_tokens(base)
            for line, count, claim in facts:
                entry = f"- L{line}{f' ×{count}' if count > 1 else ''} {claim}"
                used += estimate_tokens(entry)
                if used > budget:
                    lines.append("- … more facts omitted for length")
                    break
                lines.append(entry)
        elif warnings:
            lines.append("(model unavailable or review failed; showing the code-only digest)")
        if rejected:
            lines.append(f"({rejected} model claim(s) omitted because support was not established)")
        return DigestOutcome("\n".join(lines), "digest+llm", digest.kind, digest.confidence, warnings)
