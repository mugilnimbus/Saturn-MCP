"""saturn_ask and saturn_query: delegated research and on-demand access to stored output."""

from __future__ import annotations

import re

from saturn.application.agent_tools import Toolbox
from saturn.application.graphs.agent_graph import build_agent_graph
from saturn.application.limits import Limits
from saturn.application.ports import ArtifactStore, LineMatcher, ModelGateway
from saturn.application.recorder import ANONYMOUS, Caller, Recorder
from saturn.application.tunables import Tunables
from saturn.domain.errors import InvalidInput
from saturn.domain.redaction import redact
from saturn.domain.text_ops import compile_pattern, grep_lines, number_lines, render_matches
from saturn.domain.tokens import estimate_tokens, truncate_to_tokens

_RANGE = re.compile(r"^\s*(\d+)\s*[-:]\s*(\d+)\s*$")


class AskService:
    def __init__(self, *, recorder: Recorder, gateway: ModelGateway, toolbox: Toolbox, artifacts: ArtifactStore,
                 tunables: Tunables, limits: Limits, matcher: LineMatcher | None = None,
                 secrets: tuple[str, ...] = ()) -> None:
        self._recorder = recorder
        self._gateway = gateway
        self._tools = toolbox
        self._artifacts = artifacts
        self._tunables = tunables
        self._limits = limits
        self._graph = build_agent_graph(gateway, toolbox)
        self._match = matcher.match if matcher is not None else grep_lines
        self._secrets = secrets

    async def _research(self, task: str, sources: list[str], run_summary_tool: str) -> tuple[str, int]:
        """Run the worker; return the rendered answer and the tokens a manual exploration would have cost."""
        if not self._tunables.llm_enabled:
            raise InvalidInput("The worker model is switched off in Saturn's settings.")
        seeds = self._tools.seed(sources)
        state = await self._graph.ainvoke(
            {"task": task, "sources": sources, "max_steps": self._limits.ask_max_steps, "steps": seeds, "seeded": len(seeds)},
            config={**self._gateway.graph_config(run_summary_tool), "recursion_limit": self._limits.ask_max_steps * 3 + 6},
        )
        result = state["result"]
        steps = state.get("steps") or []
        observed = sum(estimate_tokens(s["observation"]) for s in steps)
        if not result["finished"]:
            notes = "\n".join(f"- {s['call']}" for s in steps[-4:])
            text = ("The worker ran out of steps before it could answer. Last steps:\n" + notes +
                    "\nTry a narrower question or give paths.")
        else:
            lines = [result["answer"] or "No supported answer could be established from the cited sources."]
            if result["evidence"]:
                lines.append("evidence:")
                lines += [f"- {e['source']}:{e['line']}  {e['text']}" for e in result["evidence"]]
            if result["unverified"]:
                lines.append(f"({result['unverified']} cited location(s) could not be verified and were dropped)")
            if result.get("rejected_claims"):
                lines.append(f"({result['rejected_claims']} claim(s) omitted because support was not established)")
            if not result["answer"]:
                lines.append("Read the source directly: saturn_search or saturn_read for files, "
                             "saturn_query with pattern or lines for stored output.")
            if result.get("review_warning"):
                lines.append(result["review_warning"])
            if result["answer"]:
                lines.append("[support reviewed by model; review can be wrong]")
            lines.append(f"[worker {self._gateway.model_name} · {result['steps']} step(s)]")
            text = "\n".join(lines)
        return truncate_to_tokens(redact(text, self._secrets)[0], self._limits.ask_answer_tokens + 150), observed

    async def ask(self, task: str, *, paths: list[str] | None, caller: Caller = ANONYMOUS) -> str:
        if not task.strip():
            raise InvalidInput("Give the worker a task.")
        task = redact(task, self._secrets)[0]
        async with self._recorder.run("saturn_ask", caller=caller, summary=task) as run:
            text, observed = await self._research(task.strip(), paths or [], "ask")
            run.set(raw_tokens=observed, returned_tokens=estimate_tokens(text), route="agent")
            return text

    async def query(self, artifact_id: str, *, pattern: str | None, lines: str | None, question: str | None,
                    context: int, caller: Caller = ANONYMOUS) -> str:
        chosen = [x for x in (pattern, lines, question) if x]
        if len(chosen) != 1:
            raise InvalidInput("Give exactly one of: pattern, lines, question.")
        async with self._recorder.run("saturn_query", caller=caller, summary=f"{artifact_id} {pattern or lines or question}") as run:
            meta = self._artifacts.get_meta(artifact_id)
            run.set(artifact_id=artifact_id)
            limit = self._tunables.inline_token_limit + 300
            all_lines = self._artifacts.get_lines(artifact_id)
            if pattern:
                matches, total = self._match(all_lines, compile_pattern(pattern), context=max(0, min(context, 4)), max_matches=60)
                head = f"{total} matching line(s) in {artifact_id}" + (f"; showing {len(matches)}" if total > len(matches) else "")
                text = truncate_to_tokens(f"{head}\n{render_matches(matches)}" if matches else f"No lines match {pattern!r} in {artifact_id}.", limit)
                run.set(route="query")
            elif lines:
                m = _RANGE.match(lines)
                if not m:
                    raise InvalidInput("lines must look like '120-180'.")
                first, last = max(1, int(m[1])), min(len(all_lines), int(m[2]))
                if first > last:
                    raise InvalidInput(f"{artifact_id} has {len(all_lines)} lines; range is empty.")
                body = number_lines(all_lines[first - 1 : last], first)
                text = truncate_to_tokens(f"{artifact_id} lines {first}-{last} of {meta.lines}\n{body}", limit,
                                          marker="\n… [range cut; ask for the next lines]")
                run.set(route="query")
            else:
                assert question is not None
                text, _ = await self._research(redact(question, self._secrets)[0], [artifact_id], "query")
                run.set(route="agent")
            text = redact(text, self._secrets)[0]
            run.set(returned_tokens=estimate_tokens(text))
            return text
