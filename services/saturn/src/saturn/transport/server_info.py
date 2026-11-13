"""What Saturn tells a connecting client about itself. Kept dependency-free so the stdio bridge starts fast."""

from __future__ import annotations

INSTRUCTIONS = (
    "Saturn keeps long output out of your context. Prefer saturn_run for test, build, lint, and read-only git commands, "
    "saturn_read and saturn_search for large files, and saturn_ask to delegate a research question. Long results come "
    "back as a digest plus an artifact id for saturn_query. Send workspace_root as your current project's absolute "
    "folder on each call; use cwd for command subfolders. Never send known secret values or request credential files. "
    "Retrieve specific evidence instead of dumping full artifacts."
)
