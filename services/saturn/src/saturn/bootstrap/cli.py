"""Command-line entry for the whole product.

| Group | Commands |
|---|---|
| Process | start, stop, status, serve |
| Client-launched | stdio, hook |
| Setup | setup, connect, disconnect, uninstall, doctor |
| Configuration | config, settings, policy |
| Observability | runs, events, logs |

Modules are imported inside each command, so the commands a client starts (stdio, hook) stay fast.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any


def _run_stdio(harness: str | None) -> int:
    """Bridge a command-launching client to the HTTP service, starting this checkout's server when it is down.

    The token comes from the harness's credential file (`--harness <handle>`) or SATURN_TOKEN, never from
    Saturn's `.env`. SATURN_URL points the bridge at a Saturn it should not try to start.
    """
    from saturn.bootstrap.launcher import start_quietly
    from saturn.infrastructure.config import get_settings
    from saturn.infrastructure.credential_files import CredentialFiles
    from saturn.transport.stdio_bridge import ServiceGuard, run_bridge

    logging.basicConfig(level=logging.WARNING, stream=sys.stderr, format="saturn stdio: %(message)s")
    logging.getLogger("saturn.stdio").setLevel(logging.INFO)  # our own notes; not every HTTP request underneath
    settings = get_settings()
    token = os.environ.get("SATURN_TOKEN", "").strip()
    missing = ""
    if not token and harness:
        token = CredentialFiles(settings.credentials_dir).read(harness) or ""
        missing = (f"No token for harness '{harness}' at {settings.credentials_dir}. Rotate it on Saturn's Connections page "
                   f"or run `saturn connect` again. [unauthorized]")
    base = os.environ.get("SATURN_URL", "").strip().rstrip("/")
    starter = None
    if not base:
        base = settings.base_url
        starter = start_quietly if os.name == "nt" else None
    asyncio.run(run_bridge(f"{base}/mcp", token, ServiceGuard(base, starter), workspace=str(Path.cwd()), missing_token=missing))
    return 0


def _serve(args: argparse.Namespace, parser: argparse.ArgumentParser) -> None:
    import uvicorn

    from saturn.bootstrap.managed_server import serve_managed
    from saturn.domain.addresses import loopback_host
    from saturn.infrastructure.config import get_settings

    settings = get_settings()
    # Keep advertised MCP metadata aligned with command-line listen overrides.
    try:
        settings.host = loopback_host(args.host or settings.host)
    except ValueError as exc:
        parser.error(str(exc))
    settings.port = args.port or settings.port
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    config = uvicorn.Config(
        "saturn.bootstrap.app:create_app",
        factory=True,
        host=settings.host,
        port=settings.port,
        log_level="info",
        access_log=False,  # Request URLs can contain credentials supplied by a client.
        timeout_graceful_shutdown=settings.shutdown_grace_s,
    )
    if args.control_dir is not None:
        if not args.control_dir.is_dir():
            parser.error("The launcher control directory does not exist.")
        asyncio.run(serve_managed(uvicorn.Server(config), args.control_dir))
    else:
        uvicorn.Server(config).run()


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="saturn", description="Saturn: keep long tool output out of a coding agent's context.")
    sub = parser.add_subparsers(dest="command", metavar="<command>")
    parser.set_defaults(command="start", port=None, timeout=30, json=False)

    for action in ("start", "stop", "status"):
        operation = sub.add_parser(action, help=f"{action.capitalize()} the local background server.")
        operation.add_argument("--port", type=int)
        operation.add_argument("--timeout", type=int, default=30, help="Seconds to wait (default: 30).")
        operation.add_argument("--json", action="store_true", help="Print machine-readable status.")
    serve = sub.add_parser("serve", help="Run the MCP endpoint, API, and dashboard in this terminal.")
    serve.add_argument("--host")
    serve.add_argument("--port", type=int)
    serve.add_argument("--control-dir", type=Path, help=argparse.SUPPRESS)

    stdio = sub.add_parser("stdio", help="MCP on stdin/stdout for a client that starts a command; starts Saturn if needed.")
    stdio.add_argument("--harness", help="Harness handle whose token file to use.")
    hook = sub.add_parser("hook", help="Relay a shell hook event from a client to Saturn.")
    hook.add_argument("client", choices=("claude", "codex"))
    hook.add_argument("event", choices=("PreToolUse", "PostToolUse"))
    hook.add_argument("--harness", required=True)

    setup = sub.add_parser("setup", help="Guided setup: model server, model, start, clients, check.")
    setup.add_argument("--provider", choices=("lmstudio", "ollama", "openai"))
    setup.add_argument("--model-url", help="Model server address, e.g. http://127.0.0.1:1234/v1")
    setup.add_argument("--model", help="Worker model id as the server lists it.")
    setup.add_argument("--skip-model", action="store_true", help="Do not configure a model (code-only digests).")
    setup.add_argument("--start", action=argparse.BooleanOptionalAction, default=None, help="Start Saturn in the background.")
    setup.add_argument("--clients", help="Which clients to offer: claude,codex or none.")
    setup.add_argument("--preset", choices=("standard", "read-only", "hands-off"))
    setup.add_argument("--hooks", action=argparse.BooleanOptionalAction, default=None)

    connect = sub.add_parser("connect", help="Register Saturn with Claude Code or Codex for every project.")
    connect.add_argument("client", choices=("claude", "codex"))
    connect.add_argument("--harness", help="Existing harness handle or id to use (default: create one).")
    connect.add_argument("--name", help="Name for a new harness (default: the client's name).")
    connect.add_argument("--preset", choices=("standard", "read-only", "hands-off"))
    connect.add_argument("--hooks", action=argparse.BooleanOptionalAction, default=None)
    connect.add_argument("--print", action="store_true", help="Show the change and write nothing.")
    connect.add_argument("--diff", action="store_true", help="Show Saturn's changed lines.")
    disconnect = sub.add_parser("disconnect", help="Remove Saturn's entries from a client's configuration.")
    disconnect.add_argument("client", choices=("claude", "codex"))
    disconnect.add_argument("--revoke", action="store_true", help="Also revoke the harness it used.")
    disconnect.add_argument("--diff", action="store_true")
    sub.add_parser("uninstall", help="Remove Saturn from every client and list the remaining steps.")
    doctor = sub.add_parser("doctor", help="Check configuration, service, model, and every connected client.")
    doctor.add_argument("--deep", action="store_true", help="Also make one test call to the model.")

    sub.add_parser("config", help="Show every file, setting, and rule with where it comes from.")
    settings = sub.add_parser("settings", help="Show or change runtime settings (settings.toml).")
    settings_sub = settings.add_subparsers(dest="action", required=True)
    settings_sub.add_parser("show")
    setter = settings_sub.add_parser("set")
    setter.add_argument("key")
    setter.add_argument("value")

    policy = sub.add_parser("policy", help="Show, test, or change command rules and folders (policy.toml).")
    policy_sub = policy.add_subparsers(dest="action", required=True)
    policy_sub.add_parser("show")
    tester = policy_sub.add_parser("test", help="Would this command run? Nothing is executed.")
    tester.add_argument("pattern", metavar="command")
    tester.add_argument("--folder")
    tester.add_argument("--harness")
    for name, text in (("allow", "Allow a command pattern."), ("deny", "Deny a command pattern."), ("remove", "Remove a rule.")):
        rule = policy_sub.add_parser(name, help=text)
        rule.add_argument("pattern")
    preset = policy_sub.add_parser("preset", help="standard or open.")
    preset.add_argument("value")
    hooks = policy_sub.add_parser("hooks", help="noisy, all, or off.")
    hooks.add_argument("value")
    folder = policy_sub.add_parser("folder", help="Add or remove an allowed folder.")
    folder.add_argument("change", choices=("add", "remove"))
    folder.add_argument("path")

    runs = sub.add_parser("runs", help="List recent runs, or show one: saturn runs show <id>.")
    runs.add_argument("show", nargs="?", choices=("show",), help=argparse.SUPPRESS)
    runs.add_argument("run_id", nargs="?")
    runs.add_argument("--limit", type=int, default=20)
    runs.add_argument("--tool")
    runs.add_argument("--status", choices=("ok", "error", "running"))
    runs.add_argument("--harness")
    runs.add_argument("--query")
    runs.add_argument("--json", action="store_true")
    runs.add_argument("--full", action="store_true", help="With show: print the full request, model calls, and response.")
    events = sub.add_parser("events", help="The audit log: access, settings, policy, installs, model, service.")
    events.add_argument("--limit", type=int, default=30)
    events.add_argument("--kind", choices=("access", "settings", "policy", "install", "model", "service"))
    events.add_argument("--json", action="store_true")
    logs = sub.add_parser("logs", help="The background server's log.")
    logs.add_argument("--lines", type=int, default=60)
    logs.add_argument("--stdout", action="store_true", help="Show standard output instead of the error log.")
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = _parser()
    args = parser.parse_args(argv)
    command = args.command or "start"

    if command == "stdio":
        raise SystemExit(_run_stdio(args.harness))
    if command == "hook":
        from saturn.bootstrap.hook_relay import main as relay

        raise SystemExit(relay([args.client, args.event, "--harness", args.harness]))
    if command == "serve":
        _serve(args, parser)
        return
    if command in ("start", "stop", "status"):
        from saturn.bootstrap.launcher import run_launcher

        if args.port is not None and not 1 <= args.port <= 65535:
            parser.error("--port must be between 1 and 65535.")
        if not 1 <= args.timeout <= 600:
            parser.error("--timeout must be between 1 and 600.")
        try:
            code = run_launcher(command, port=args.port, timeout=args.timeout, json_output=args.json)
        except ValueError as exc:
            parser.error(str(exc))
        raise SystemExit(code)
    raise SystemExit(_dispatch(command, args))


def _dispatch(command: str, args: Any) -> int:
    from saturn.bootstrap import admin_cli, setup_cli
    from saturn.bootstrap.terminal import Abort
    from saturn.domain.errors import SaturnError

    handlers = {
        "setup": setup_cli.setup, "connect": setup_cli.connect, "disconnect": setup_cli.disconnect,
        "uninstall": setup_cli.uninstall, "doctor": setup_cli.doctor, "config": admin_cli.config_show,
        "settings": admin_cli.settings_cmd, "policy": admin_cli.policy_cmd, "runs": admin_cli.runs_cmd,
        "events": admin_cli.events_cmd, "logs": admin_cli.logs_cmd,
    }
    try:
        result: int = handlers[command](args)
        return result
    except Abort as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except SaturnError as exc:
        print(f"{exc.message} [{exc.code}]", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nStopped; nothing more was changed.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    main()
