"""Interfaces the application layer depends on. Infrastructure implements them."""

from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol, TypeVar

from pydantic import BaseModel

from saturn.domain.access import AuditEvent, Harness
from saturn.domain.models import ArtifactMeta, LlmCallRecord, RequestMeta, RunOutcome, SpanRecord
from saturn.domain.policy import Policy
from saturn.domain.text_ops import Match

T = TypeVar("T", bound=BaseModel)


class LineMatcher(Protocol):
    def match(self, lines: list[str], pattern: re.Pattern[str], *, context: int = 0,
              max_matches: int = 50) -> tuple[list[Match], int]: ...


class AuditLog(Protocol):
    def record(self, kind: str, subject: str, action: str, actor: str, detail: str = "") -> None: ...
    def events(self, *, limit: int = 50, kind: str | None = None, before: int | None = None) -> list[AuditEvent]: ...


class AccessStore(AuditLog, Protocol):
    def configured(self) -> bool: ...
    def list_harnesses(self) -> list[Harness]: ...
    def find(self, digest: str, *, touch: bool) -> Harness | None: ...
    def get(self, harness_id: str) -> Harness | None: ...
    def handle_taken(self, handle: str) -> bool: ...
    def save(self, harness: Harness, *, digest: str | None, action: str, actor: str, detail: str = "",
             create: bool = False) -> None: ...


class CredentialStore(Protocol):
    """Per-harness token files, so a local client's configuration never holds a token."""

    def write(self, handle: str, token: str) -> Path: ...
    def read(self, handle: str) -> str | None: ...
    def delete(self, handle: str) -> None: ...
    def path(self, handle: str) -> Path: ...


class ConfigSource(Protocol):
    """settings.toml and policy.toml. A stamp changes whenever a file changes on disk."""

    def settings_stamp(self) -> object: ...
    def load_settings(self) -> dict[str, Any]: ...
    def save_settings(self, values: dict[str, Any]) -> None: ...
    def policy_stamp(self) -> object: ...
    def load_policy(self) -> Policy: ...
    def save_policy(self, policy: Policy) -> None: ...


@dataclass(frozen=True)
class FileChange:
    """One planned change to a client's configuration file."""

    path: Path
    before: str | None  # None: the file does not exist yet
    after: str | None  # None: delete the file
    summary: str


@dataclass(frozen=True)
class ClientSpec:
    """Everything a client writer needs to register one harness."""

    handle: str
    preset: str
    tools: tuple[str, ...]
    pre_approved: tuple[str, ...]
    hooks: bool
    stdio: tuple[str, ...]  # program and arguments that start `saturn stdio --harness <handle>`
    hook_command: str  # command line of the hook relay, with {event} where the event name goes


class ClientWriter(Protocol):
    name: str
    title: str

    def detected(self) -> bool: ...
    def files(self) -> list[Path]: ...
    def plan_install(self, spec: ClientSpec) -> list[FileChange]: ...
    def plan_remove(self) -> list[FileChange]: ...


class FileApplier(Protocol):
    def apply(self, changes: list[FileChange]) -> list[tuple[Path, Path | None]]: ...
    def restore(self, written: list[tuple[Path, Path | None]]) -> list[str]: ...


class InstallStore(Protocol):
    def records(self) -> list[dict[str, Any]]: ...
    def put(self, record: dict[str, Any]) -> None: ...
    def remove(self, client: str) -> dict[str, Any] | None: ...


@dataclass(frozen=True)
class CommandResult:
    exit_code: int | None  # None when the process was killed on timeout
    output: str
    duration_s: float
    timed_out: bool
    output_truncated: bool


class TelemetryWriter(Protocol):
    def start_run(self, tool: str, client: str | None, summary: str, *, harness_id: str | None = None,
                  workspace: str | None = None, request: RequestMeta | None = None) -> str: ...
    def put_payload(self, run_id: str, kind: str, text: str, *, owner_id: str | None = None) -> str: ...
    def finish_run(self, run_id: str, outcome: RunOutcome) -> None: ...
    def start_span(self, span: SpanRecord) -> None: ...
    def end_span(self, span_id: str, status: str, attrs: dict[str, Any]) -> None: ...
    def record_llm_call(self, call: LlmCallRecord) -> None: ...


class ArtifactStore(Protocol):
    def put(self, run_id: str, kind: str, title: str, text: str) -> ArtifactMeta: ...
    def get_text(self, artifact_id: str) -> str: ...
    def get_lines(self, artifact_id: str) -> list[str]: ...
    def get_meta(self, artifact_id: str) -> ArtifactMeta: ...


class CommandRunner(Protocol):
    async def run(self, argv: Sequence[str], cwd: Path, timeout_s: float) -> CommandResult: ...


class ModelGateway(Protocol):
    """Constrained model calls. The model must answer by calling exactly one of `tools`."""

    @property
    def model_name(self) -> str: ...

    async def call(
        self,
        tools: Sequence[type[T]],
        *,
        system: str,
        user: str,
        purpose: str,
        max_output_tokens: int = 400,
    ) -> T: ...

    def graph_config(self, purpose: str = "") -> dict[str, Any]:
        """LangChain/LangGraph run config (callbacks and metadata) that records spans and token usage."""
        ...
