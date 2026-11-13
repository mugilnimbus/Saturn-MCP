"""Codex: one managed block in `~/.codex/config.toml` (or `$CODEX_HOME/config.toml`).

The block sits between two marker comments and holds the MCP server entry and, optionally, a PreToolUse
hook for Bash. Codex cannot replace a tool's output, so there is no after-the-command hook. Codex runs a
new or changed hook only after it is trusted in Codex (`/hooks`).

Everything outside the markers is left as it was. If the file already defines `mcp_servers.saturn`
outside the block, Saturn refuses rather than guessing which entry should win.
"""

from __future__ import annotations

import json
import os
import shutil
import tomllib
from pathlib import Path

from saturn.application.ports import ClientSpec, FileChange
from saturn.domain.errors import InvalidInput

BEGIN = "# >>> saturn (managed by `saturn connect`; remove with `saturn disconnect codex`)"
END = "# <<< saturn"


def _path() -> Path:
    custom = os.environ.get("CODEX_HOME", "").strip()
    return (Path(custom).expanduser() if custom else Path.home() / ".codex") / "config.toml"


def _string(value: str) -> str:
    return f"'{value}'" if "'" not in value and "\n" not in value else json.dumps(value)


def _strip_block(text: str) -> str:
    start = text.find(BEGIN)
    if start < 0:
        return text
    end = text.find(END, start)
    if end < 0:
        raise InvalidInput(f"{_path()} has Saturn's start marker but not its end marker; fix the file by hand first.")
    end = text.find("\n", end)
    head = text[:start].rstrip("\n")
    tail = "" if end < 0 else text[end + 1:].lstrip("\n")
    if head and tail:
        return head + "\n\n" + tail
    return head + "\n" if head else tail


def _parse(text: str, path: Path) -> dict[str, object]:
    try:
        return tomllib.loads(text)
    except tomllib.TOMLDecodeError as exc:
        raise InvalidInput(f"{path} is not valid TOML ({exc}); Saturn will not change it.") from exc


class Codex:
    name = "codex"
    title = "Codex"

    def detected(self) -> bool:
        return _path().parent.is_dir() or shutil.which("codex") is not None

    def files(self) -> list[Path]:
        return [_path()]

    def block(self, spec: ClientSpec) -> str:
        mode = "approve" if set(spec.pre_approved) >= set(spec.tools) else "writes"
        lines = [
            BEGIN,
            "[mcp_servers.saturn]",
            f"command = {_string(spec.stdio[0])}",
            "args = [" + ", ".join(_string(a) for a in spec.stdio[1:]) + "]",
            "startup_timeout_sec = 60",
            "tool_timeout_sec = 330",
            "enabled_tools = [" + ", ".join(json.dumps(t) for t in spec.tools) + "]",
            f"default_tools_approval_mode = \"{mode}\"",
        ]
        if spec.hooks:
            lines += [
                "",
                "[[hooks.PreToolUse]]",
                "matcher = \"^Bash$\"",
                "",
                "[[hooks.PreToolUse.hooks]]",
                "type = \"command\"",
                f"command = {_string(spec.hook_command.replace("{event}", "PreToolUse"))}",
                "timeout = 10",
                "statusMessage = \"Checking with Saturn\"",
            ]
        lines.append(END)
        return "\n".join(lines) + "\n"

    def plan_install(self, spec: ClientSpec) -> list[FileChange]:
        path = _path()
        before = path.read_text(encoding="utf-8-sig") if path.is_file() else None
        rest = _strip_block(before or "")
        servers = _parse(rest, path).get("mcp_servers")
        if isinstance(servers, dict) and "saturn" in servers:
            raise InvalidInput(f"{path} already defines [mcp_servers.saturn] outside Saturn's block. Remove that entry, then "
                               "connect again.")
        after = (rest.rstrip("\n") + "\n\n" if rest.strip() else "") + self.block(spec)
        _parse(after, path)  # the result must still be a valid Codex configuration
        summary = f"register MCP server 'saturn' for harness {spec.handle}" + ("; add a Bash hook" if spec.hooks else "")
        return [] if after == before else [FileChange(path, before, after, summary)]

    def plan_remove(self) -> list[FileChange]:
        path = _path()
        if not path.is_file():
            return []
        before = path.read_text(encoding="utf-8-sig")
        if BEGIN not in before:
            return []
        after = _strip_block(before)
        _parse(after, path)
        return [FileChange(path, before, after, "remove Saturn's block")]
