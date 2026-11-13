"""Client connection: register a harness with Claude Code or Codex, and undo it.

The flow is always plan, show, apply. A plan lists every file and what changes in it, and nothing is written
until the caller applies that plan. Applying backs up each file, writes it, records the install, and adds an
audit event. Removing deletes only Saturn's own entries.
"""

from __future__ import annotations

import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from saturn.application.access_service import AccessService
from saturn.application.ports import ClientSpec, ClientWriter, FileApplier, FileChange, InstallStore
from saturn.domain.access import PRESETS, Harness
from saturn.domain.errors import InvalidInput, NotFound


@dataclass
class Plan:
    client: str
    title: str
    preset: str
    hooks: bool
    handle: str
    name: str
    harness: Harness | None  # None: the harness is created when the plan is applied
    changes: list[FileChange] = field(default_factory=list)


class ConnectService:
    def __init__(self, *, access: AccessService, writers: list[ClientWriter], applier: FileApplier, installs: InstallStore,
                 stdio: Callable[[str], tuple[str, ...]], hook_command: Callable[[str, str], str]) -> None:
        self._lock = threading.RLock()
        self._access = access
        self._writers = {w.name: w for w in writers}
        self._applier = applier
        self._installs = installs
        self._stdio = stdio
        self._hook_command = hook_command

    def writer(self, client: str) -> ClientWriter:
        if client not in self._writers:
            raise InvalidInput(f"Unknown client '{client}'. Supported: {', '.join(self._writers)}.")
        return self._writers[client]

    def clients(self) -> list[dict[str, Any]]:
        installed = {r["client"]: r for r in self._installs.records()}
        return [{"name": w.name, "title": w.title, "detected": w.detected(), "files": [str(p) for p in w.files()],
                 "install": installed.get(w.name)} for w in self._writers.values()]

    def installs(self) -> list[dict[str, Any]]:
        return self._installs.records()

    def plan(self, client: str, *, harness: str | None = None, name: str | None = None, preset: str = "standard",
             hooks: bool = True) -> Plan:
        writer = self.writer(client)
        if preset not in PRESETS:
            raise InvalidInput(f"preset must be one of {', '.join(PRESETS)}.")
        existing: Harness | None = None
        if harness:
            try:
                existing = self._access.get(harness)
            except NotFound:
                existing = None
            if existing is not None and (existing.revoked_at is not None or not existing.enabled):
                raise InvalidInput(f"Harness '{harness}' is revoked or disabled; choose another or create a new one.")
        display = existing.name if existing else (name or writer.title)
        handle = existing.handle if existing else (harness or self._access.suggest_handle(display))
        tools = existing.tools if existing else PRESETS[preset]["tools"]
        approved = tuple(t for t in PRESETS[preset]["pre_approved"] if t in tools)
        spec = ClientSpec(handle=handle, preset=preset, tools=tuple(tools), pre_approved=approved, hooks=hooks,
                          stdio=self._stdio(handle), hook_command=self._hook_command(client, handle))
        return Plan(client, writer.title, preset, hooks, handle, display, existing, writer.plan_install(spec))

    def apply(self, plan: Plan, *, actor: str) -> dict[str, Any]:
        with self._lock:
            return self._apply(plan, actor=actor)

    def _apply(self, plan: Plan, *, actor: str) -> dict[str, Any]:
        harness = plan.harness
        created = harness is None
        if harness is None:
            harness, _ = self._access.create(plan.name, list(PRESETS[plan.preset]["tools"]), handle=plan.handle,
                                             hooks=plan.hooks, actor=actor)
        written = []
        try:
            written = self._applier.apply(plan.changes)
            record = {"client": plan.client, "harness_id": harness.id, "handle": harness.handle, "preset": plan.preset,
                      "hooks": plan.hooks, "at": time.time(),
                      "files": [{"path": str(path), "backup": str(backup) if backup else None} for path, backup in written]}
            self._installs.put(record)
        except Exception as exc:
            failures = self._applier.restore(written)
            if created:
                try:
                    self._access.revoke(harness.id, actor=actor)
                except Exception as recovery_error:  # noqa: BLE001 -- retain both failures and report recovery failure
                    failures.append(f"harness {harness.handle}: {recovery_error}")
            if failures:
                raise OSError(f"{exc}; installation recovery incomplete: {'; '.join(failures)}") from exc
            raise
        try:
            self._access.record("install", plan.title, "installed", actor,
                                f"harness {harness.handle}{' (new)' if created else ''}; preset {plan.preset}; "
                                f"hooks {'on' if plan.hooks else 'off'}; files: {', '.join(str(p) for p, _ in written) or 'unchanged'}")
        except Exception as exc:
            raise OSError(f"Client registration and installation record were saved, but the audit event failed: {exc}") from exc
        return record

    def plan_remove(self, client: str) -> list[FileChange]:
        return self.writer(client).plan_remove()

    def remove(self, client: str, *, actor: str, revoke: bool = False) -> dict[str, Any]:
        with self._lock:
            return self._remove(client, actor=actor, revoke=revoke)

    def _remove(self, client: str, *, actor: str, revoke: bool = False) -> dict[str, Any]:
        writer = self.writer(client)
        written = self._applier.apply(writer.plan_remove())
        record = self._installs.remove(client)
        revoked = ""
        if revoke and record and record.get("harness_id"):
            try:
                self._access.revoke(record["harness_id"], actor=actor)
                revoked = f"; revoked harness {record.get('handle')}"
            except NotFound:
                pass
        self._access.record("install", writer.title, "removed", actor,
                            f"files: {', '.join(str(p) for p, _ in written) or 'nothing to remove'}{revoked}")
        return {"client": client, "files": [{"path": str(p), "backup": str(b) if b else None} for p, b in written],
                "revoked": bool(revoked)}
