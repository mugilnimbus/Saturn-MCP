"""Keeps the running service on the current settings.toml and policy.toml without a restart.

`refresh()` runs at the start of every tool call, hook call, and settings or policy request. It compares
each file's modification time and size with what was last applied and re-reads only a changed file. An
invalid file is not applied: the last good version stays in force and the error is kept for the dashboard
and `saturn doctor`. Every applied change is written to the audit log with a short summary.
"""

from __future__ import annotations

import threading
from dataclasses import fields
from typing import Any

from saturn.application.ports import AuditLog, ConfigSource
from saturn.application.tunables import Tunables
from saturn.domain.errors import InvalidInput
from saturn.domain.internal_timing import timed
from saturn.domain.policy import Policy


def _short(value: Any) -> str:
    text = repr(value) if isinstance(value, str) else str(value)
    return text if len(text) <= 60 else text[:57] + "…"


def policy_summary(old: Policy, new: Policy) -> str:
    parts = []
    if old.preset != new.preset:
        parts.append(f"preset {old.preset} → {new.preset}")
    for name in ("allow", "deny"):
        before = {r.pattern for r in getattr(old, name)}
        after = {r.pattern for r in getattr(new, name)}
        parts += [f"{name} +{p!r}" for p in sorted(after - before)] + [f"{name} −{p!r}" for p in sorted(before - after)]
    if old.folders != new.folders:
        parts.append(f"folders: {', '.join(map(str, new.folders)) or 'any'}")
    if old.hook_scope != new.hook_scope:
        parts.append(f"hooks {old.hook_scope} → {new.hook_scope}")
    return "; ".join(parts) or "no effective change"


class LiveConfig:
    def __init__(self, source: ConfigSource, tunables: Tunables, audit: AuditLog, *, policy: Policy | None = None) -> None:
        self._source = source
        self.tunables = tunables
        self._audit = audit
        self.policy = policy or Policy()
        self.errors: dict[str, str] = {}
        self._lock = threading.Lock()
        self._settings_stamp: object = object()  # never equal to a real stamp: the first refresh loads
        self._policy_stamp: object = object()

    @timed('config')
    def refresh(self) -> None:
        with self._lock:
            stamp = self._source.settings_stamp()
            if stamp != self._settings_stamp:
                self._settings_stamp = stamp
                self._load_settings(initial=False)
            stamp = self._source.policy_stamp()
            if stamp != self._policy_stamp:
                self._policy_stamp = stamp
                self._load_policy()

    def load(self) -> None:
        """First load at start-up: apply both files without treating them as edits."""
        with self._lock:
            self._settings_stamp = self._source.settings_stamp()
            self._load_settings(initial=True)
            self._policy_stamp = self._source.policy_stamp()
            if self._policy_stamp is None:
                return  # no policy file: keep the policy this service was built with (the default)
            try:
                self.policy = self._source.load_policy()
                self.errors.pop("policy.toml", None)
            except InvalidInput as exc:
                self.errors["policy.toml"] = exc.message

    def _load_settings(self, *, initial: bool) -> None:
        try:
            values = self._source.load_settings()
            known = {f.name for f in fields(Tunables)}
            unknown = sorted(set(values) - known)
            if unknown:
                raise InvalidInput(f"Unknown key(s) in settings.toml: {', '.join(unknown)}.")
            staged = Tunables(**{**self.tunables.values(), **values})
            Tunables.validate(staged.values())
        except (InvalidInput, TypeError) as exc:
            self.errors["settings.toml"] = exc.message if isinstance(exc, InvalidInput) else str(exc)
            return
        diff = self.tunables.update(values)
        self.errors.pop("settings.toml", None)
        if diff and not initial:
            self._audit.record("settings", "settings.toml", "edited", "file",
                               "; ".join(f"{k}: {_short(a)} → {_short(b)}" for k, (a, b) in diff.items()))

    def _load_policy(self) -> None:
        try:
            policy = self._source.load_policy()
        except InvalidInput as exc:
            if self.errors.get("policy.toml") != exc.message:
                self._audit.record("policy", "policy.toml", "rejected", "file", exc.message)
            self.errors["policy.toml"] = exc.message
            return
        self.errors.pop("policy.toml", None)
        summary = policy_summary(self.policy, policy)
        changed = policy != self.policy
        self.policy = policy
        if changed:
            self._audit.record("policy", "policy.toml", "edited", "file", summary)

    def saved_settings(self) -> dict[str, Any]:
        """The values settings.toml sets explicitly (the rest are defaults); empty when the file is missing or invalid."""
        try:
            return self._source.load_settings()
        except InvalidInput:
            return {}

    def save_settings(self, changes: dict[str, Any], *, actor: str) -> dict[str, tuple[Any, Any]]:
        """Apply validated changes, write settings.toml, and record who changed what."""
        with self._lock:
            diff = self.tunables.update(changes)
            self._source.save_settings(self.tunables.values())
            self._settings_stamp = self._source.settings_stamp()
            self.errors.pop("settings.toml", None)
            if diff:
                self._audit.record("settings", "settings.toml", "updated", actor,
                                   "; ".join(f"{k}: {_short(a)} → {_short(b)}" for k, (a, b) in diff.items()))
            return diff

    def save_policy(self, policy: Policy, *, actor: str) -> str:
        with self._lock:
            summary = policy_summary(self.policy, policy)
            self._source.save_policy(policy)
            self._policy_stamp = self._source.policy_stamp()
            self.policy = policy
            self.errors.pop("policy.toml", None)
            self._audit.record("policy", "policy.toml", "updated", actor, summary)
            return summary
