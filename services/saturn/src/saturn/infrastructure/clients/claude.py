"""Claude Code: user-scope MCP registration, tool approvals, and shell hooks.

| File | Saturn's entry |
|---|---|
| `~/.claude.json` | `mcpServers.saturn`: the stdio command with `--harness <handle>` |
| `~/.claude/settings.json` | `permissions.allow`: `mcp__saturn__…` per preset; `hooks`: PreToolUse and PostToolUse for Bash and PowerShell |

`CLAUDE_CONFIG_DIR` moves both files into that folder, as Claude Code itself does. Every other key in
these files is left exactly as it was; Saturn's entries are found again by their server name, the
`mcp__saturn__` prefix, and the hook relay's module name.
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from typing import Any

from saturn.application.ports import ClientSpec, FileChange
from saturn.domain.errors import InvalidInput

RELAY_MARK = "saturn.bootstrap.hook_relay"
SHELL_MATCHER = "Bash|PowerShell"


def _paths() -> tuple[Path, Path]:
    custom = os.environ.get("CLAUDE_CONFIG_DIR", "").strip()
    if custom:
        folder = Path(custom).expanduser()
        return folder / ".claude.json", folder / "settings.json"
    return Path.home() / ".claude.json", Path.home() / ".claude" / "settings.json"


def _load(path: Path) -> tuple[str | None, dict[str, Any]]:
    if not path.is_file():
        return None, {}
    text = path.read_text(encoding="utf-8-sig")
    try:
        data = json.loads(text) if text.strip() else {}
    except ValueError as exc:
        raise InvalidInput(f"{path} is not valid JSON ({exc}); Saturn will not change it.") from exc
    if not isinstance(data, dict):
        raise InvalidInput(f"{path} does not hold a JSON object; Saturn will not change it.")
    return text, data


def _dump(data: dict[str, Any]) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def _without_saturn_hooks(hooks: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for event, groups in hooks.items():
        if not isinstance(groups, list):
            cleaned[event] = groups
            continue
        kept = []
        for group in groups:
            inner = group.get("hooks") if isinstance(group, dict) else None
            if isinstance(inner, list):
                inner = [h for h in inner if not (isinstance(h, dict) and RELAY_MARK in str(h.get("command", "")))]
                if not inner:
                    continue
                group = {**group, "hooks": inner}
            kept.append(group)
        if kept:
            cleaned[event] = kept
    return cleaned


class ClaudeCode:
    name = "claude"
    title = "Claude Code"

    def detected(self) -> bool:
        config, settings = _paths()
        return config.exists() or settings.parent.is_dir() or shutil.which("claude") is not None

    def files(self) -> list[Path]:
        return list(_paths())

    def plan_install(self, spec: ClientSpec) -> list[FileChange]:
        config_path, settings_path = _paths()
        before, config = _load(config_path)
        raw_servers = config.get("mcpServers")
        servers: dict[str, Any] = raw_servers if isinstance(raw_servers, dict) else {}
        config["mcpServers"] = {**servers, "saturn": {"type": "stdio", "command": spec.stdio[0], "args": list(spec.stdio[1:]),
                                                       "env": {}}}
        changes = [FileChange(config_path, before, _dump(config), f"register MCP server 'saturn' for harness {spec.handle}")]

        settings_before, settings = _load(settings_path)
        raw_permissions = settings.get("permissions")
        permissions: dict[str, Any] = raw_permissions if isinstance(raw_permissions, dict) else {}
        allow = [a for a in permissions.get("allow", []) if not str(a).startswith("mcp__saturn__")]
        approved = ["mcp__saturn__*"] if set(spec.pre_approved) >= set(spec.tools) else [f"mcp__saturn__{t}" for t in spec.pre_approved]
        settings["permissions"] = {**permissions, "allow": allow + approved}
        raw_hooks = settings.get("hooks")
        hooks = _without_saturn_hooks(raw_hooks if isinstance(raw_hooks, dict) else {})
        if spec.hooks:
            for event, timeout in (("PreToolUse", 10), ("PostToolUse", 120)):
                entry = {"matcher": SHELL_MATCHER, "hooks": [{"type": "command", "timeout": timeout,
                                                              "command": spec.hook_command.replace("{event}", event)}]}
                hooks[event] = [*hooks.get(event, []), entry]
        if hooks:
            settings["hooks"] = hooks
        else:
            settings.pop("hooks", None)
        summary = f"pre-approve {', '.join(approved)}" + ("; add shell hooks" if spec.hooks else "")
        changes.append(FileChange(settings_path, settings_before, _dump(settings), summary))
        return [
            c for c in changes
            if c.before is None or (json.loads(c.before) if c.before.strip() else {}) != json.loads(c.after or "{}")
        ]

    def plan_remove(self) -> list[FileChange]:
        config_path, settings_path = _paths()
        changes = []
        before, config = _load(config_path)
        servers = config.get("mcpServers")
        if isinstance(servers, dict) and "saturn" in servers:
            config["mcpServers"] = {k: v for k, v in servers.items() if k != "saturn"}
            changes.append(FileChange(config_path, before, _dump(config), "remove MCP server 'saturn'"))
        settings_before, settings = _load(settings_path)
        original = json.dumps(settings, sort_keys=True)
        permissions = settings.get("permissions")
        if isinstance(permissions, dict) and isinstance(permissions.get("allow"), list):
            settings["permissions"] = {**permissions,
                                       "allow": [a for a in permissions["allow"] if not str(a).startswith("mcp__saturn__")]}
        if isinstance(settings.get("hooks"), dict):
            hooks = _without_saturn_hooks(settings["hooks"])
            if hooks:
                settings["hooks"] = hooks
            else:
                settings.pop("hooks")
        if settings_before is not None and json.dumps(settings, sort_keys=True) != original:
            changes.append(FileChange(settings_path, settings_before, _dump(settings), "remove Saturn tool approvals and hooks"))
        return changes
