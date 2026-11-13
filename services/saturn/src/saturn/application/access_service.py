"""Harness lifecycle: identity, permissions, per-harness limits, and credentials, independent of HTTP and storage."""

from __future__ import annotations

import hashlib
import math
import secrets
import threading
import time
from dataclasses import replace
from pathlib import Path
from uuid import uuid4

from saturn.application.ports import AccessStore, CredentialStore
from saturn.domain.access import HANDLE, TOOLS, AuditEvent, Harness, handle_from
from saturn.domain.errors import InvalidInput, NotFound
from saturn.domain.policy import Rule


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AccessService:
    def __init__(self, store: AccessStore, credentials: CredentialStore) -> None:
        self.store = store
        self.credentials = credentials
        self._lock = threading.RLock()
        self._mcp_seen: set[str] = set()

    @property
    def configured(self) -> bool:
        return self.store.configured()

    def list_harnesses(self) -> list[Harness]:
        return self.store.list_harnesses()

    def get(self, harness_id: str) -> Harness:
        harness = self.store.get(harness_id)
        if harness is None:
            raise NotFound(f"No harness '{harness_id}'.")
        return harness

    def events(self, *, limit: int = 50, kind: str | None = None, before: int | None = None) -> list[AuditEvent]:
        return self.store.events(limit=limit, kind=kind, before=before)

    def saw_mcp(self, harness_id: str) -> None:
        """Remember that this harness reached the MCP endpoint since Saturn started, so its agent has the tools."""
        self._mcp_seen.add(harness_id)

    def uses_mcp(self, harness_id: str) -> bool:
        return harness_id in self._mcp_seen

    def authenticate(self, authorization: str, *, touch: bool = False) -> Harness | None:
        scheme, separator, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not separator or not token or len(token) > 512 or any(c.isspace() for c in token):
            return None
        return self.store.find(_digest(token), touch=touch)

    def credential_path(self, harness: Harness) -> Path:
        return self.credentials.path(harness.handle)

    def suggest_handle(self, name: str) -> str:
        base = handle_from(name)
        handle, n = base, 2
        while self.store.handle_taken(handle):
            handle = f"{base[:36]}-{n}"
            n += 1
        return handle

    def _validate(self, name: str, tools: list[str], expires_at: float | None, folders: list[str],
                  deny: list[str]) -> tuple[str, tuple[str, ...], tuple[str, ...], tuple[str, ...]]:
        name = name.strip()
        if not name or len(name) > 80 or any(ord(c) < 32 for c in name) or "stn_" in name:
            raise InvalidInput("Use a name of 1–80 characters without credentials or control characters.")
        if not tools or any(t not in TOOLS for t in tools):
            raise InvalidInput("Select at least one of the five Saturn tools.")
        if expires_at is not None and (not math.isfinite(expires_at) or expires_at <= time.time()):
            raise InvalidInput("Expiry must be a future date.")
        if len(folders) > 20 or len(deny) > 50:
            raise InvalidInput("Use at most 20 folders and 50 denied commands.")
        resolved = []
        for raw in folders:
            path = Path(raw.strip()).expanduser()
            if not raw.strip() or not path.is_absolute():
                raise InvalidInput(f"Folder '{raw}' must be an absolute path.")
            resolved.append(str(path.resolve()))
        patterns = tuple(Rule.parse(p, "harness").pattern for p in deny if p.strip())
        return name, tuple(t for t in TOOLS if t in tools), tuple(dict.fromkeys(resolved)), patterns

    def create(self, name: str, tools: list[str], expires_at: float | None = None, *, handle: str | None = None,
               folders: list[str] | None = None, deny: list[str] | None = None, hooks: bool = True,
               actor: str = "dashboard") -> tuple[Harness, str]:
        with self._lock:
            name, allowed, folder_list, patterns = self._validate(name, tools, expires_at, folders or [], deny or [])
            handle = (handle or "").strip() or self.suggest_handle(name)
            if not HANDLE.match(handle):
                raise InvalidInput("A handle is 1–40 lower-case letters, digits, or hyphens, starting with a letter or digit.")
            if self.store.handle_taken(handle):
                raise InvalidInput(f"The handle '{handle}' is already in use.")
            harness = Harness(uuid4().hex, name, handle, allowed, True, time.time(), expires_at,
                              folders=folder_list, deny=patterns, hooks=hooks)
            token = "stn_" + secrets.token_urlsafe(32)
            self.store.save(harness, digest=_digest(token), action="created", actor=actor, create=True,
                            detail=f"tools: {', '.join(t.removeprefix('saturn_') for t in allowed)}")
            self.credentials.write(handle, token)
            return harness, token

    def _active(self, harness_id: str) -> Harness:
        harness = self.get(harness_id)
        if harness.revoked_at is not None:
            raise InvalidInput("Revoked access cannot be restored. Create a new harness.")
        return harness

    def edit(self, harness_id: str, name: str, tools: list[str], expires_at: float | None, enabled: bool, *,
             folders: list[str] | None = None, deny: list[str] | None = None, hooks: bool | None = None,
             actor: str = "dashboard") -> Harness:
        with self._lock:
            old = self._active(harness_id)
            name, allowed, folder_list, patterns = self._validate(
                name, tools, expires_at, list(old.folders) if folders is None else folders, list(old.deny) if deny is None else deny)
            harness = replace(old, name=name, tools=allowed, expires_at=expires_at, enabled=enabled, folders=folder_list,
                              deny=patterns, hooks=old.hooks if hooks is None else hooks)
            changed = [field for field in ("name", "tools", "expires_at", "enabled", "folders", "deny", "hooks")
                       if getattr(old, field) != getattr(harness, field)]
            self.store.save(harness, digest=None, action="updated", actor=actor, detail=", ".join(changed) or "no change")
            return harness

    def rotate(self, harness_id: str, *, actor: str = "dashboard") -> tuple[Harness, str]:
        with self._lock:
            harness = self._active(harness_id)
            token = "stn_" + secrets.token_urlsafe(32)
            self.store.save(harness, digest=_digest(token), action="rotated", actor=actor)
            self.credentials.write(harness.handle, token)
            return harness, token

    def set_enabled(self, harness_id: str, enabled: bool, *, actor: str = "dashboard") -> Harness:
        with self._lock:
            harness = replace(self._active(harness_id), enabled=enabled)
            self.store.save(harness, digest=None, action="enabled" if enabled else "disabled", actor=actor)
            return harness

    def revoke(self, harness_id: str, *, actor: str = "dashboard") -> Harness:
        with self._lock:
            harness = self.get(harness_id)
            if harness.revoked_at is None:
                harness = replace(harness, revoked_at=time.time(), enabled=False)
                self.store.save(harness, digest=None, action="revoked", actor=actor)
                self.credentials.delete(harness.handle)
            return harness

    def record(self, kind: str, subject: str, action: str, actor: str, detail: str = "") -> None:
        self.store.record(kind, subject, action, actor, detail)
