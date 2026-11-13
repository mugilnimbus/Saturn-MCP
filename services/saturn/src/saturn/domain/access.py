"""Harness metadata, tool permissions, presets, and audit records; credentials never enter metadata."""

from __future__ import annotations

import re
from dataclasses import dataclass

TOOLS = ("saturn_run", "saturn_read", "saturn_search", "saturn_ask", "saturn_query")
READ_TOOLS = ("saturn_read", "saturn_search", "saturn_ask", "saturn_query")
# A preset decides which tools Saturn grants and which of them the client may call without asking.
PRESETS: dict[str, dict[str, tuple[str, ...]]] = {
    "standard": {"tools": TOOLS, "pre_approved": READ_TOOLS},
    "read-only": {"tools": READ_TOOLS, "pre_approved": READ_TOOLS},
    "hands-off": {"tools": TOOLS, "pre_approved": TOOLS},
}
HANDLE = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
AUDIT_KINDS = ("access", "settings", "policy", "install", "model", "service")
ACTORS = ("dashboard", "terminal", "file", "service")


@dataclass(frozen=True)
class Harness:
    id: str
    name: str
    handle: str
    tools: tuple[str, ...]
    enabled: bool
    created_at: float
    expires_at: float | None
    revoked_at: float | None = None
    last_used_at: float | None = None
    folders: tuple[str, ...] = ()  # empty: whatever the global policy allows
    deny: tuple[str, ...] = ()  # command patterns this harness may not run
    hooks: bool = True

    @property
    def label(self) -> str:
        return f"{self.name} ({self.handle})"


@dataclass(frozen=True)
class AuditEvent:
    seq: int
    at: float
    kind: str
    subject: str
    action: str
    actor: str
    detail: str = ""


def handle_from(name: str) -> str:
    """A handle suggestion for a display name: `Claude Code (work)` -> `claude-code-work`."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:40].strip("-")
    return slug or "harness"
