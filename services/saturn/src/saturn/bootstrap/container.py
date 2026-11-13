"""Composition root: the only place that knows every concrete class."""

from __future__ import annotations

import logging
import sys
from dataclasses import dataclass, replace
from pathlib import Path

from saturn.application.access_service import AccessService
from saturn.application.agent_tools import Toolbox
from saturn.application.ask_service import AskService
from saturn.application.command_service import CommandService
from saturn.application.connect_service import ConnectService
from saturn.application.digest_service import DigestService
from saturn.application.hook_service import HookService
from saturn.application.limits import Limits
from saturn.application.live_config import LiveConfig
from saturn.application.ports import CommandRunner, ModelGateway
from saturn.application.recorder import Recorder
from saturn.application.tunables import Tunables
from saturn.application.workspace_service import WorkspaceService
from saturn.domain.policy import PathPolicy, Policy
from saturn.infrastructure.access_store import SqliteAccessStore
from saturn.infrastructure.artifact_repo import ArtifactRepository
from saturn.infrastructure.clients.claude import ClaudeCode
from saturn.infrastructure.clients.codex import Codex
from saturn.infrastructure.clients.files import FileApplier, InstallRecords
from saturn.infrastructure.command_runner import SubprocessRunner
from saturn.infrastructure.config import Settings, get_settings
from saturn.infrastructure.config_files import ConfigFiles
from saturn.infrastructure.credential_files import CredentialFiles
from saturn.infrastructure.db import Database
from saturn.infrastructure.filesystem import LocalFiles
from saturn.infrastructure.llm import ResponsesGateway
from saturn.infrastructure.local_server import LocalServerStatus
from saturn.infrastructure.metrics_queries import MetricsQueries
from saturn.infrastructure.model_lifecycle import ModelLifecycle
from saturn.infrastructure.regex_matcher import ProcessLineMatcher
from saturn.infrastructure.telemetry_repo import TelemetryRepository
from saturn.infrastructure.tracing import TelemetryCallbackHandler

log = logging.getLogger("saturn")


def stdio_command(handle: str) -> tuple[str, ...]:
    """How a client starts the stdio server for one harness: this installation's interpreter, so no PATH is needed."""
    return (sys.executable, "-m", "saturn.bootstrap.cli", "stdio", "--harness", handle)


def hook_command(client: str, handle: str) -> str:
    """The hook relay's command line, with {event} where the hook event name goes."""
    python = Path(sys.executable).as_posix()
    return f'"{python}" -m saturn.bootstrap.hook_relay {client} {{event}} --harness {handle}'


@dataclass
class Container:
    settings: Settings
    db: Database
    tunables: Tunables
    config: LiveConfig
    telemetry: TelemetryRepository
    artifacts: ArtifactRepository
    metrics: MetricsQueries
    local_server: LocalServerStatus
    lifecycle: ModelLifecycle
    gateway: ModelGateway
    runner: CommandRunner
    access: AccessService
    connect: ConnectService
    matcher: ProcessLineMatcher
    recorder: Recorder
    digests: DigestService
    limits: Limits
    commands: CommandService
    workspace: WorkspaceService
    ask: AskService
    hooks: HookService

    def policy(self) -> Policy:
        return self.config.policy

    def for_call(self, roots: tuple[Path, ...]) -> Container:
        """Operations scoped to one call's folders, without changing this container or another client's folders."""
        paths = PathPolicy(tuple(p.resolve() for p in roots))
        files = LocalFiles(paths, secrets=self.settings.secrets)
        tools = Toolbox(files, self.artifacts, observation_tokens=self.settings.observation_tokens, matcher=self.matcher)
        runner = (SubprocessRunner(max_bytes=self.settings.command_max_bytes, workspace_roots=paths.roots)
                  if isinstance(self.runner, SubprocessRunner) else self.runner)
        secrets = self.settings.secrets
        return replace(
            self,
            commands=CommandService(recorder=self.recorder, runner=runner, artifacts=self.artifacts, digests=self.digests,
                                    policy=self.policy, path_policy=paths, tunables=self.tunables, secrets=secrets),
            workspace=WorkspaceService(recorder=self.recorder, files=files, artifacts=self.artifacts, tunables=self.tunables,
                                       matcher=self.matcher, search_max_bytes=self.settings.artifact_max_bytes),
            ask=AskService(recorder=self.recorder, gateway=self.gateway, toolbox=tools, artifacts=self.artifacts,
                           tunables=self.tunables, limits=self.limits, matcher=self.matcher, secrets=secrets),
            hooks=HookService(recorder=self.recorder, artifacts=self.artifacts, digests=self.digests, tunables=self.tunables,
                              policy=self.policy, path_policy=paths, secrets=secrets),
        )

    async def shutdown(self) -> None:
        """Release what Saturn holds: any model it caused to load, then the store."""
        await self.lifecycle.shutdown()
        self.close()

    def close(self) -> None:
        self.matcher.close()
        self.db.close()


def build_container(
    settings: Settings | None = None,
    *,
    db_path: str | None = None,
    gateway: ModelGateway | None = None,
    runner: CommandRunner | None = None,
    files: bool = True,
    policy: Policy | None = None,
    tunables: dict[str, object] | None = None,
    service: bool = True,
) -> Container:
    """Wire Saturn. `files=False` keeps configuration, credentials, and installs in memory (tests).

    `service=False` is for command-line tools that open the same store while the service may be running:
    they leave run bookkeeping and artifact eviction to the service.
    """
    settings = settings or get_settings()
    db = Database(db_path or settings.data_dir / "saturn.db")
    store = SqliteAccessStore(db, settings.secrets)
    access = AccessService(store, CredentialFiles(settings.credentials_dir if files else None))
    values = Tunables()
    if tunables:
        values.update(dict(tunables))
    config = LiveConfig(ConfigFiles(settings.settings_path if files else None, settings.policy_path if files else None),
                        values, store, policy=policy)
    config.load()

    telemetry = TelemetryRepository(db, payload_ttl_hours=settings.payload_ttl_hours)
    artifacts = ArtifactRepository(db, ttl_hours=settings.artifact_ttl_hours, max_bytes=settings.artifact_max_bytes,
                                   max_total_bytes=settings.store_max_total_bytes, secrets=settings.secrets)
    if service:
        telemetry.mark_orphans_failed()
        telemetry.evict_payloads()
        artifacts.evict()
    handler = TelemetryCallbackHandler(telemetry, secrets=settings.secrets, preview_chars=settings.trace_payload_chars)
    local_server = LocalServerStatus(values, settings.local_server_api_key.get_secret_value())
    lifecycle = ModelLifecycle(local_server, idle_unload_s=lambda: values.model_idle_unload_s,
                               on_event=lambda action, model: store.record("model", model, action, "service"))
    gateway = gateway or ResponsesGateway(settings, values, handler, lifecycle)
    recorder = Recorder(telemetry, settings.secrets)
    limits = Limits(llm_digest_threshold=settings.llm_digest_threshold, map_chunk_tokens=settings.map_chunk_tokens,
                    map_max_chunks=settings.map_max_chunks, ask_max_steps=settings.ask_max_steps,
                    ask_answer_tokens=settings.ask_answer_tokens)
    digests = DigestService(recorder, gateway, values, limits)
    matcher = ProcessLineMatcher()
    connect = ConnectService(access=access, writers=[ClaudeCode(), Codex()], applier=FileApplier(settings.backups_dir),
                             installs=InstallRecords(settings.installs_path if files else None),
                             stdio=stdio_command, hook_command=hook_command)
    container = Container(
        settings=settings, db=db, tunables=values, config=config, telemetry=telemetry, artifacts=artifacts,
        metrics=MetricsQueries(db), local_server=local_server, lifecycle=lifecycle, gateway=gateway,
        runner=runner or SubprocessRunner(max_bytes=settings.command_max_bytes), access=access, connect=connect,
        matcher=matcher, recorder=recorder, digests=digests, limits=limits,
        commands=None, workspace=None, ask=None, hooks=None,  # type: ignore[arg-type]  # filled by for_call below
    )
    # Without a workspace the default operations use the policy's folders (none: every call must name one).
    return container.for_call(config.policy.folders)
