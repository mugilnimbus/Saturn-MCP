"""Shell hook relay: `python -m saturn.bootstrap.hook_relay <client> <event> --harness <handle>`.

A harness runs this before (and, for Claude Code, after) each shell command. It passes the hook event from
standard input to Saturn with the harness token read from Saturn's credential file, and prints Saturn's
answer. Hook settings therefore hold no token.

It imports only the standard library, because it delays every shell command the agent runs. Whatever goes
wrong (Saturn not running, a timeout, a refusal), it prints nothing and exits 0, so the command goes ahead
unchanged: a hook is a convenience, never a gate.
"""

from __future__ import annotations

import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

MAX_BYTES = 8_000_000
EVENTS = {
    ("claude", "PreToolUse"): ("/api/hooks/claude/pre-tool-use", 9),
    ("claude", "PostToolUse"): ("/api/hooks/claude/post-tool-use", 115),
    ("codex", "PreToolUse"): ("/api/hooks/codex/pre-tool-use", 9),
}


def _home() -> Path:
    raw = os.environ.get("SATURN_HOME", "").strip()
    return Path(raw).expanduser() if raw else Path.home() / ".saturn"


def _base_url(home: Path) -> str:
    explicit = os.environ.get("SATURN_URL", "").strip().rstrip("/")
    if explicit:
        return explicit
    values = {"SATURN_HOST": "127.0.0.1", "SATURN_PORT": "9000"}
    try:
        for line in (home / ".env").read_text(encoding="utf-8-sig").splitlines():
            key, _, value = line.partition("=")
            key = key.strip().removeprefix("export ").strip()
            if key in values and value.strip():
                values[key] = value.strip().strip("\"'")
    except OSError:
        pass
    for key in values:  # the environment wins over the file, as it does for the service
        if os.environ.get(key, "").strip():
            values[key] = os.environ[key].strip()
    host = values["SATURN_HOST"]
    host = "127.0.0.1" if host in ("0.0.0.0", "::") else host
    return f"http://{f'[{host}]' if ':' in host and not host.startswith('[') else host}:{values['SATURN_PORT']}"


def _token(home: Path, handle: str) -> str:
    explicit = os.environ.get("SATURN_TOKEN", "").strip()
    if explicit:
        return explicit
    try:
        return (home / "credentials" / f"{handle}.token").read_text(encoding="utf-8").strip()
    except OSError:
        return ""


def relay(client: str, event: str, handle: str, body: bytes) -> bytes:
    """Saturn's answer to one hook event, or b'' to leave the tool call alone."""
    route = EVENTS.get((client, event))
    if route is None or not body or len(body) > MAX_BYTES:
        return b""
    home = _home()
    token = _token(home, handle)
    if not token:
        return b""
    path, timeout = route
    request = urllib.request.Request(_base_url(home) + path, data=body, method="POST",
                                     headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 - fixed local address
            return response.read() if response.status == 200 else b""
    except (urllib.error.URLError, OSError, ValueError):
        return b""


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    handle = ""
    if "--harness" in args:
        index = args.index("--harness")
        handle = args[index + 1] if index + 1 < len(args) else ""
        del args[index:index + 2]
    if len(args) != 2 or not handle:
        print("usage: saturn hook <claude|codex> <PreToolUse|PostToolUse> --harness <handle>", file=sys.stderr)
        return 0
    answer = relay(args[0], args[1], handle, sys.stdin.buffer.read(MAX_BYTES + 1))
    if answer:
        sys.stdout.buffer.write(answer)
        sys.stdout.flush()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
