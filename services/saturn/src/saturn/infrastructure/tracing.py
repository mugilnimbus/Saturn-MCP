"""LangChain callback handler that turns graph nodes and model calls into trace records.

Token counts come from the model's own usage report (`usage_metadata`), not from
estimates. Each call keeps short previews on the call itself and its complete prompt (every message and
the tools offered) and complete reply (tool calls and text) as masked payloads. The handler never raises:
losing a trace must not fail a run.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any
from uuid import UUID

from langchain_core.callbacks import AsyncCallbackHandler

from saturn.application.ports import TelemetryWriter
from saturn.domain.models import LlmCallRecord, SpanRecord
from saturn.domain.redaction import redact

log = logging.getLogger("saturn.tracing")


class TelemetryCallbackHandler(AsyncCallbackHandler):
    raise_error = False
    run_inline = True

    def __init__(self, telemetry: TelemetryWriter, *, secrets: tuple[str, ...], preview_chars: int) -> None:
        self._telemetry = telemetry
        self._secrets = secrets
        self._preview = preview_chars
        self._calls: dict[UUID, LlmCallRecord] = {}
        self._spans: dict[UUID, str] = {}
        self._parents: dict[UUID, UUID | None] = {}

    # ---- helpers ------------------------------------------------------------------------------

    def _clean(self, text: str) -> str:
        return redact(text, self._secrets)[0][: self._preview]

    def _keep(self, run_id: str, kind: str, text: str, owner: str) -> None:
        try:
            self._telemetry.put_payload(run_id, kind, redact(text, self._secrets)[0], owner_id=owner)
        except Exception:  # noqa: BLE001 - a lost body must not fail the call
            log.exception("could not store a %s payload", kind)

    def _nearest_span(self, parent: UUID | None) -> str | None:
        hops = 0
        while parent is not None and hops < 32:
            if parent in self._spans:
                return self._spans[parent]
            parent = self._parents.get(parent)
            hops += 1
        return None

    # ---- graph nodes --------------------------------------------------------------------------

    async def on_chain_start(self, serialized: Any, inputs: Any, *, run_id: UUID, parent_run_id: UUID | None = None,
                             tags: list[str] | None = None, metadata: dict[str, Any] | None = None, **kwargs: Any) -> None:
        try:
            self._parents[run_id] = parent_run_id
            meta = metadata or {}
            run = meta.get("saturn_run_id")
            node = meta.get("langgraph_node")
            if not run or not node or kwargs.get("name") != node:
                return
            span = SpanRecord(
                id=uuid.uuid4().hex[:16], run_id=run, parent_id=self._nearest_span(parent_run_id),
                name=str(node), kind="graph_node", started_at=time.time(),
                attrs={"step": meta.get("langgraph_step")},
            )
            self._spans[run_id] = span.id
            self._telemetry.start_span(span)
        except Exception:  # noqa: BLE001 - tracing must never break a run
            log.exception("on_chain_start failed")

    async def _end_chain(self, run_id: UUID, status: str, attrs: dict[str, Any]) -> None:
        try:
            span_id = self._spans.pop(run_id, None)
            self._parents.pop(run_id, None)
            if span_id:
                self._telemetry.end_span(span_id, status, attrs)
        except Exception:  # noqa: BLE001
            log.exception("chain end failed")

    async def on_chain_end(self, outputs: Any, *, run_id: UUID, **kwargs: Any) -> None:
        await self._end_chain(run_id, "ok", {})

    async def on_chain_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any) -> None:
        await self._end_chain(run_id, "error", {"error": self._clean(f"{type(error).__name__}: {error}")})

    # ---- model calls --------------------------------------------------------------------------

    async def on_chat_model_start(self, serialized: Any, messages: list[list[Any]], *, run_id: UUID,
                                  parent_run_id: UUID | None = None, tags: list[str] | None = None,
                                  metadata: dict[str, Any] | None = None, **kwargs: Any) -> None:
        try:
            meta = metadata or {}
            run = meta.get("saturn_run_id")
            if not run:
                return
            prompt = "\n".join(f"[{getattr(m, 'type', '?')}] {getattr(m, 'content', '')}" for m in messages[0])
            call = LlmCallRecord(
                id=uuid.uuid4().hex[:16], run_id=run, span_id=self._nearest_span(parent_run_id),
                model=str(meta.get("ls_model_name") or "unknown"), endpoint="responses",
                started_at=time.time(), prompt_preview=self._clean(prompt), purpose=str(meta.get("saturn_purpose", "")),
            )
            self._calls[run_id] = call
            tools = (kwargs.get("invocation_params") or {}).get("tools") or []
            offered = [t.get("name") or (t.get("function") or {}).get("name") for t in tools if isinstance(t, dict)]
            full = prompt + (f"\n\n[tools offered] {', '.join(n for n in offered if n)}" if offered else "")
            self._keep(run, "llm_prompt", full, call.id)
        except Exception:  # noqa: BLE001
            log.exception("on_chat_model_start failed")

    async def on_llm_end(self, response: Any, *, run_id: UUID, **kwargs: Any) -> None:
        try:
            call = self._calls.pop(run_id, None)
            if call is None:
                return
            generation = response.generations[0][0]
            message = getattr(generation, "message", None)
            usage = getattr(message, "usage_metadata", None) or {}
            call.ended_at = time.time()
            call.input_tokens = int(usage.get("input_tokens") or 0)
            call.output_tokens = int(usage.get("output_tokens") or 0)
            call.reasoning_tokens = int((usage.get("output_token_details") or {}).get("reasoning") or 0)
            call.cached_tokens = int((usage.get("input_token_details") or {}).get("cache_read") or 0)
            tool_calls = getattr(message, "tool_calls", None)
            content = getattr(message, "content", "")
            call.output_preview = self._clean(str(tool_calls) if tool_calls else str(content))
            self._telemetry.record_llm_call(call)
            full = {"tool_calls": tool_calls or [], "content": content}
            self._keep(call.run_id, "llm_output", json.dumps(full, indent=2, ensure_ascii=False, default=str), call.id)
        except Exception:  # noqa: BLE001
            log.exception("on_llm_end failed")

    async def on_llm_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any) -> None:
        try:
            call = self._calls.pop(run_id, None)
            if call is None:
                return
            call.ended_at = time.time()
            call.status = "error"
            call.error = self._clean(f"{type(error).__name__}: {error}")
            self._telemetry.record_llm_call(call)
            self._keep(call.run_id, "llm_output", f"{type(error).__name__}: {error}", call.id)
        except Exception:  # noqa: BLE001
            log.exception("on_llm_error failed")
