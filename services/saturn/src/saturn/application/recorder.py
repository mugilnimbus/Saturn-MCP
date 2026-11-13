"""Run and span bookkeeping: every Saturn operation is a traced run.

A run records who asked (harness, client, route, MCP session and request ids), in which folder, with which arguments,
every step in order (including the authentication and workspace steps that happen before the run starts), each model
call, and the exact reply. Request and reply bodies are masked and kept for a limited time; the run itself is kept.
"""

from __future__ import annotations

import json
import time
import uuid
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager, contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

from saturn.application.ports import TelemetryWriter
from saturn.domain.access import Harness
from saturn.domain.errors import SaturnError
from saturn.domain.internal_timing import bind_run, interval, timed
from saturn.domain.models import RequestMeta, RunOutcome, SpanRecord
from saturn.domain.redaction import redact


@dataclass
class Ticket:
    """Filled in when the run starts, so the caller can attach the reply to it afterwards."""

    run_id: str | None = None


@dataclass(frozen=True)
class Step:
    """A step finished before the run started, such as authentication; written as one of its first spans."""

    name: str
    started_at: float
    ended_at: float
    status: str = "ok"
    attrs: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Caller:
    """Who asked for a run, for which workspace, and with what, so every run can be traced end to end."""

    harness: Harness | None = None
    client: str | None = None  # client name when no harness is known (in-process callers)
    workspace: str | None = None
    meta: RequestMeta = field(default_factory=RequestMeta)
    arguments: dict[str, Any] | None = None  # the full request, stored as a payload
    steps: tuple[Step, ...] = ()
    ticket: Ticket = field(default_factory=Ticket)

    @property
    def label(self) -> str | None:
        return self.harness.label if self.harness else self.client


ANONYMOUS = Caller()


@dataclass
class RunHandle:
    run_id: str
    outcome: RunOutcome = field(default_factory=RunOutcome)
    span_stack: list[str] = field(default_factory=list)

    def set(self, **fields: Any) -> None:
        for key, value in fields.items():
            setattr(self.outcome, key, value)


_current_run: ContextVar[RunHandle | None] = ContextVar("saturn_current_run", default=None)


def current_run() -> RunHandle | None:
    return _current_run.get()


class SpanHandle:
    def __init__(self) -> None:
        self.attrs: dict[str, Any] = {}

    def set(self, **attrs: Any) -> None:
        self.attrs.update(attrs)


class Recorder:
    def __init__(self, telemetry: TelemetryWriter, secrets: tuple[str, ...] = ()) -> None:
        self._telemetry = telemetry
        self._secrets = secrets

    @timed("redaction")
    def _mask(self, text: str) -> str:
        return redact(text, self._secrets)[0]

    @timed("recording", "storage")
    def _start(self, tool: str, caller: Caller, summary: str) -> str:
        run_id = self._telemetry.start_run(
            tool, caller.label, self._mask(summary)[:400], harness_id=caller.harness.id if caller.harness else None,
            workspace=caller.workspace, request=caller.meta)
        caller.ticket.run_id = run_id
        bind_run(run_id, caller.meta.request_id)
        if caller.arguments is not None:
            self._telemetry.put_payload(run_id, "request", self._mask(json.dumps({"tool": tool, "arguments": caller.arguments},
                                                                                  indent=2, ensure_ascii=False, default=str)))
        for step in caller.steps:
            attrs = {k: self._mask(v) if isinstance(v, str) else v for k, v in step.attrs.items()}
            self._telemetry.start_span(SpanRecord(uuid.uuid4().hex[:16], run_id, None, step.name, "step", step.started_at,
                                                  step.ended_at, step.status, attrs))
        return run_id

    @asynccontextmanager
    async def run(self, tool: str, *, caller: Caller = ANONYMOUS, summary: str) -> AsyncIterator[RunHandle]:
        handle = RunHandle(run_id=self._start(tool, caller, summary))
        token = _current_run.set(handle)
        try:
            yield handle
        except SaturnError as exc:
            handle.set(status="error", route="error", error=f"{exc.code}: {exc.message}")
            raise
        except Exception as exc:
            handle.set(status="error", route="error", error=f"{type(exc).__name__}: {exc}"[:500])
            raise
        finally:
            _current_run.reset(token)
            if handle.outcome.error:
                handle.outcome.error = self._mask(handle.outcome.error)
            self._telemetry.finish_run(handle.run_id, handle.outcome)

    @timed("response", "storage")
    def respond(self, caller: Caller, text: str) -> None:
        """Keep the exact text the caller received (masked), when its run exists."""
        if caller.ticket.run_id is not None:
            self._telemetry.put_payload(caller.ticket.run_id, "response", self._mask(text))

    def reject(self, tool: str, caller: Caller, reason: str, *, summary: str = "") -> str:
        """Record a request refused before its tool ran (permission, workspace, token) as a finished, rejected run."""
        run_id = self._start(tool, caller, summary or reason)
        self._telemetry.put_payload(run_id, "response", self._mask(reason))
        self._telemetry.finish_run(run_id, RunOutcome(status="error", route="rejected", error=self._mask(reason)[:500]))
        return run_id

    @contextmanager
    def span(self, name: str, kind: str = "step", **attrs: Any) -> Iterator[SpanHandle]:
        run = current_run()
        handle = SpanHandle()
        handle.attrs.update(attrs)
        if run is None:
            yield handle
            return
        span = SpanRecord(
            id=uuid.uuid4().hex[:16],
            run_id=run.run_id,
            parent_id=run.span_stack[-1] if run.span_stack else None,
            name=name,
            kind=kind,
            started_at=time.time(),
        )
        self._telemetry.start_span(span)
        run.span_stack.append(span.id)
        status = "ok"
        try:
            with interval(name, "backend" if name == "command" else "internal"):
                yield handle
        except BaseException:
            status = "error"
            raise
        finally:
            run.span_stack.pop()
            clean = {key: self._mask(value) if isinstance(value, str) else value for key, value in handle.attrs.items()}
            self._telemetry.end_span(span.id, status, clean)
