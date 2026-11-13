"""Records that describe what Saturn did. Written by use cases, read by the dashboard."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ArtifactMeta:
    id: str
    run_id: str
    kind: str
    title: str
    created_at: float
    expires_at: float
    bytes: int
    lines: int
    tokens_est: int


@dataclass
class SpanRecord:
    id: str
    run_id: str
    parent_id: str | None
    name: str
    kind: str  # graph_node | command | tool | llm | step
    started_at: float
    ended_at: float | None = None
    status: str = "ok"  # ok | error
    attrs: dict[str, Any] = field(default_factory=dict)


@dataclass
class LlmCallRecord:
    id: str
    run_id: str
    span_id: str | None
    model: str
    endpoint: str
    started_at: float
    ended_at: float | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    reasoning_tokens: int = 0
    cached_tokens: int = 0
    status: str = "ok"
    error: str | None = None
    prompt_preview: str = ""
    output_preview: str = ""
    purpose: str = ""


@dataclass
class RunOutcome:
    """What a finished run reports back to the telemetry store."""

    status: str = "ok"  # ok | error
    route: str = ""  # inline | digest | digest+llm | agent | query | error
    raw_tokens: int = 0
    returned_tokens: int = 0
    artifact_id: str | None = None
    error: str | None = None
    exit_code: int | None = None
    redactions: int = 0
    decision: str | None = None  # the policy rule that allowed or refused a command


@dataclass(frozen=True)
class RequestMeta:
    """Where a request came from: route (stdio, http, hook, terminal), client name and version, MCP session and request ids."""

    transport: str | None = None
    client_info: str | None = None
    session_id: str | None = None
    request_id: str | None = None


PAYLOAD_KINDS = ("request", "response", "llm_prompt", "llm_output", "timing")
