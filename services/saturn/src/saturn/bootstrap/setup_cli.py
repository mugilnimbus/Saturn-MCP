"""`saturn setup`, `connect`, `disconnect`, `uninstall`, and `doctor`.

Setup runs a fixed sequence: requirements, model server, model, start, clients, verify. Every question has a
default, flags answer questions up front, and re-running shows the current values. Writing a client's
configuration needs a confirmation in an interactive terminal.
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import os
import platform
import shutil
import sys
from pathlib import Path
from typing import Any

import httpx

from saturn.application.model_check import check_model
from saturn.application.tunables import PROVIDERS
from saturn.bootstrap.container import Container, build_container
from saturn.bootstrap.terminal import Abort, ask, check, confirm, interactive, require_terminal, section, show_changes
from saturn.domain.access import PRESETS
from saturn.domain.errors import SaturnError
from saturn.infrastructure.config import Settings, get_settings, unknown_env_keys

ENV_TEMPLATE = """# Saturn startup settings. Only values needed before Saturn starts belong here.
# Model and output settings are in settings.toml; command rules and folders are in policy.toml.
# LOCAL_SERVER_API_KEY=
# SATURN_PORT=9000
"""
SERVER_HELP = {
    "lmstudio": ["Start LM Studio's server without the app window:", "  lms daemon up", "  lms get <model>",
                 "  lms server start", "It listens on http://127.0.0.1:1234/v1 and loads a model on first use."],
    "ollama": ["Start Ollama and pull a model:", "  ollama serve", "  ollama pull <model>",
               "It listens on http://127.0.0.1:11434/v1."],
    "openai": ["Start your OpenAI-compatible server on this computer and note its /v1 address."],
}


def _container(settings: Settings | None = None) -> Container:
    return build_container(settings or get_settings(), service=False)


def _write_env_value(path: Path, key: str, value: str) -> None:
    """Set one key in the home .env without touching other lines. The value is never printed."""
    lines = path.read_text(encoding="utf-8-sig").splitlines() if path.is_file() else ENV_TEMPLATE.splitlines()
    kept = [line for line in lines if line.split("=", 1)[0].strip().removeprefix("export ").strip() != key]
    kept.append(f"{key}={value}")
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(".env.tmp")
    temporary.write_text("\n".join(kept) + "\n", encoding="utf-8")
    os.replace(temporary, path)
    with contextlib.suppress(OSError):
        os.chmod(path, 0o600)


def _dashboard_built() -> bool:
    from saturn.bootstrap.app import _web_dist

    return _web_dist() is not None


def _healthy(settings: Settings) -> bool:
    try:
        return httpx.get(f"{settings.base_url}/api/health", timeout=2.0).status_code == 200
    except httpx.HTTPError:
        return False


# ---- setup ---------------------------------------------------------------------------------------


def setup(args: argparse.Namespace) -> int:
    settings = get_settings()
    asking = interactive()
    print(f"Saturn setup. Home folder: {settings.home}")
    if not asking:
        print("No interactive terminal: using flags and defaults; clients are not connected.")

    section("1. Requirements")
    ok = sys.version_info >= (3, 12)
    check(ok, f"Python {platform.python_version()}", "Saturn needs Python 3.12 or newer.")
    built = _dashboard_built()
    check(built if built else None, "Dashboard built" if built else "Dashboard not built",
          "Optional: cd apps/web && npm install && npm run build")
    if os.name == "nt":
        pwsh = shutil.which("pwsh") is not None
        check(pwsh if pwsh else None, "PowerShell 7 (background start)", "Install PowerShell 7, or run `saturn serve` in a terminal.")
    settings.home.mkdir(parents=True, exist_ok=True)
    if not settings.env_path.exists():
        settings.env_path.write_text(ENV_TEMPLATE, encoding="utf-8")
        check(True, f"Created {settings.env_path}")
    unknown = unknown_env_keys(settings.env_path)
    if unknown:
        check(None, f".env has keys Saturn does not read: {', '.join(unknown)}",
              "Model and output settings live in settings.toml; command rules in policy.toml.")
    try:
        container = _container(settings)
    except SaturnError as exc:
        check(False, exc.message)
        return 1
    except RuntimeError as exc:
        check(False, str(exc))
        return 1
    if not settings.policy_path.exists():
        container.config.save_policy(container.config.policy, actor="terminal")
        check(True, f"Created {settings.policy_path} (standard commands, any workspace folder)")

    try:
        _setup_model(args, container, asking)
        section("4. Start Saturn")
        if _healthy(settings):
            check(True, f"Saturn is running at {settings.base_url}")
        elif args.start or (asking and args.start is None and confirm("Start Saturn in the background now?", default=True)):
            from saturn.bootstrap.launcher import run_launcher

            run_launcher("start", port=None, timeout=60, json_output=False)
        else:
            print("  Start it later with: saturn start   (or `saturn serve` in a terminal)")

        section("5. Connect clients")
        if asking and args.clients != "none":
            for writer in [container.connect.writer(n) for n in ("claude", "codex")]:
                if args.clients and writer.name not in args.clients.split(","):
                    continue
                if not writer.detected():
                    check(None, f"{writer.title} not found on this computer; skipped.")
                    continue
                installed = next((c["install"] for c in container.connect.clients() if c["name"] == writer.name), None)
                note = f" (connected with harness {installed['handle']})" if installed else ""
                if confirm(f"Connect {writer.title}{note}?", default=not installed):
                    _connect(container, writer.name, harness=installed["handle"] if installed else None, name=None,
                             preset=args.preset, hooks=None if args.hooks is None else args.hooks, print_only=False, diff=False)
        else:
            print("  Connect a client from a terminal with: saturn connect claude   or   saturn connect codex")

        section("6. Check")
        return doctor(argparse.Namespace(deep=False), container=container)
    finally:
        container.close()


def _setup_model(args: argparse.Namespace, container: Container, asking: bool) -> None:
    tunables = container.tunables
    section("2. Model server")
    provider = args.provider or (ask("Model server: lmstudio, ollama, openai (any OpenAI-compatible), or skip",
                                     tunables.provider, (*PROVIDERS, "skip")) if asking else tunables.provider)
    if provider == "skip" or args.skip_model:
        print("  Skipped. Saturn makes digests by code until a model is chosen (saturn setup, or the dashboard).")
        return
    default_url = tunables.base_url if provider == tunables.provider else PROVIDERS[provider]
    url = args.model_url or (ask("Address", default_url) if asking else default_url)
    if asking and confirm("Does this server need an API key?", default=False):
        import getpass

        key = getpass.getpass("  API key (not shown): ").strip()
        if key:
            _write_env_value(container.settings.env_path, "LOCAL_SERVER_API_KEY", key)
            check(True, "API key saved in the home .env; restart Saturn if it is running.")
    container.config.save_settings({"provider": provider, "base_url": url}, actor="terminal")
    while True:
        snapshot = asyncio.run(container.local_server.snapshot(max_age_s=0))
        if snapshot["reachable"] and snapshot["authorized"]:
            check(True, f"Reached {url} in {snapshot['latency_ms']} ms")
            break
        check(False, snapshot.get("error") or f"Could not use {url}")
        for line in SERVER_HELP[provider]:
            print("  " + line)
        if not asking or not confirm("Try again?", default=True):
            print("  Skipped the model. Run `saturn setup` again when the server is up.")
            return

    section("3. Model")
    models = [m for m in snapshot["models"] if m.get("type", "llm") in ("llm", "vlm")]
    for index, model in enumerate(models, start=1):
        state = " (loaded)" if model.get("state") == "loaded" else ""
        print(f"  {index:>2}. {model['id']}{state}")
    current = tunables.model or (models[0]["id"] if len(models) == 1 else "")
    choice = args.model or (ask("Model (number or id)", current) if asking else current)
    if choice.isdigit() and 1 <= int(choice) <= len(models):
        choice = models[int(choice) - 1]["id"]
    if not choice:
        print("  No model chosen. Saturn makes digests by code until one is.")
        return
    container.config.save_settings({"model": choice}, actor="terminal")
    print(f"  Testing {choice} with one tool call (it may load first)…")
    result = asyncio.run(check_model(container.gateway, container.recorder, client="saturn setup"))
    check(bool(result["ok"]), f"{result['detail']} ({result['ms']} ms)",
          "Pick a model that supports tool calls, or check the server's log.")
    asyncio.run(container.lifecycle.shutdown())  # unload the model if this test loaded it


# ---- connect / disconnect ------------------------------------------------------------------------


def _connect(container: Container, client: str, *, harness: str | None, name: str | None, preset: str | None,
             hooks: bool | None, print_only: bool, diff: bool) -> int:
    writer = container.connect.writer(client)
    if preset is None:
        preset = ask("Preset: standard (Run asks first), read-only (no Run), hands-off (nothing asks)", "standard",
                     tuple(PRESETS)) if interactive() and not print_only else "standard"
    if hooks is None:
        hooks = confirm(f"Add {writer.title} shell hooks (redirect noisy test runs to Saturn)?", default=True) \
            if interactive() and not print_only else True
    plan = container.connect.plan(client, harness=harness, name=name, preset=preset, hooks=hooks)
    who = f"harness '{plan.handle}'" + ("" if plan.harness else " (created when applied)")
    print(f"\nConnect {writer.title} with {who}, preset {preset}, hooks {'on' if hooks else 'off'}:")
    show_changes(plan.changes, diff=diff or print_only)
    if print_only:
        print("\nNothing was written (--print).")
        return 0
    require_terminal("Connecting a client")
    if not confirm("Apply these changes?", default=False):
        raise Abort("Nothing was changed.")
    record = container.connect.apply(plan, actor="terminal")
    for item in record["files"]:
        print(f"  wrote {item['path']}" + (f" (backup: {item['backup']})" if item["backup"] else ""))
    restart = "Start a new Claude Code session" if client == "claude" else "Restart Codex"
    print(f"\nDone. {restart} to use Saturn's tools.")
    if client == "codex" and hooks:
        print("Codex runs a new hook only after you trust it: open Codex and run /hooks.")
    return 0


def connect(args: argparse.Namespace) -> int:
    container = _container()
    try:
        return _connect(container, args.client, harness=args.harness, name=args.name, preset=args.preset, hooks=args.hooks,
                        print_only=args.print, diff=args.diff)
    finally:
        container.close()


def disconnect(args: argparse.Namespace) -> int:
    container = _container()
    try:
        changes = container.connect.plan_remove(args.client)
        print(f"Remove Saturn from {container.connect.writer(args.client).title}:")
        show_changes(changes, diff=args.diff)
        require_terminal("Disconnecting a client")
        if not confirm("Apply these changes?", default=False):
            raise Abort("Nothing was changed.")
        result = container.connect.remove(args.client, actor="terminal", revoke=args.revoke)
        print("Done." + (" The harness was revoked." if result["revoked"] else ""))
        return 0
    finally:
        container.close()


def uninstall(args: argparse.Namespace) -> int:
    container = _container()
    try:
        installed = [c for c in container.connect.clients() if c["install"]]
        require_terminal("Uninstalling")
        for client in installed:
            print(f"Remove Saturn from {client['title']}:")
            show_changes(container.connect.plan_remove(client["name"]), diff=False)
        if installed and not confirm("Remove these entries and revoke their harnesses?", default=False):
            raise Abort("Nothing was changed.")
        for client in installed:
            container.connect.remove(client["name"], actor="terminal", revoke=True)
        home = container.settings.home
    finally:
        container.close()
    print("\nClient entries removed. To finish:")
    print("  1. saturn stop")
    if os.name == "nt":
        print("  2. In PowerShell 7, from the repository: .\\scripts\\register-saturn.ps1 -Remove")
    print(f"  {'3' if os.name == 'nt' else '2'}. Delete {home} (settings, policy, tokens, and stored data).")
    return 0


# ---- doctor --------------------------------------------------------------------------------------


def doctor(args: argparse.Namespace, *, container: Container | None = None) -> int:
    own = container is None
    settings = get_settings()
    failures = 0

    def report(ok: bool | None, text: str, hint: str = "") -> None:
        nonlocal failures
        failures += ok is False
        check(ok, text, hint)

    if own:
        print(f"Saturn home: {settings.home}")
    section("Configuration")
    unknown = unknown_env_keys(settings.env_path)
    report(None if unknown else True, ".env" + (f": unknown keys {', '.join(unknown)}" if unknown else " is valid"),
           "Model and output settings live in settings.toml; rules in policy.toml.")
    try:
        container = container or _container(settings)
    except (SaturnError, RuntimeError) as exc:
        report(False, getattr(exc, "message", str(exc)))
        return 1
    try:
        for name in ("settings.toml", "policy.toml"):
            error = container.config.errors.get(name)
            report(error is None, f"{name} " + ("is valid" if error is None else f"is not applied: {error}"))
        policy = container.config.policy
        print(f"         preset {policy.preset}; folders: {', '.join(map(str, policy.folders)) or 'any workspace'}; "
              f"hooks {policy.hook_scope}")
        missing = [f for f in policy.folders if not f.is_dir()]
        if missing:
            report(None, f"Allowed folders that do not exist: {', '.join(map(str, missing))}")

        section("Service")
        healthy = _healthy(settings)
        report(None if not healthy else True, f"Saturn at {settings.base_url} is " + ("running" if healthy else "not running"),
               "Start it with `saturn start`; a client's stdio command also starts it.")

        section("Model")
        tunables = container.tunables
        if not tunables.model:
            report(None, "No worker model selected; digests are made by code only.", "Run `saturn setup` to choose one.")
        else:
            snapshot = asyncio.run(container.local_server.snapshot(max_age_s=0))
            report(bool(snapshot["reachable"] and snapshot["authorized"]), f"{tunables.provider} at {tunables.base_url}",
                   snapshot.get("error") or "")
            listed = any(m["id"] == tunables.model for m in snapshot["models"])
            if snapshot["reachable"]:
                report(listed, f"Model {tunables.model} " + ("is listed" if listed else "is not listed by the server"))
            if getattr(args, "deep", False) and listed:
                result = asyncio.run(check_model(container.gateway, container.recorder, client="saturn doctor"))
                report(bool(result["ok"]), f"Tool call: {result['detail']} ({result['ms']} ms)")
                asyncio.run(container.lifecycle.shutdown())

        section("Clients")
        clients = container.connect.clients()
        if not any(c["install"] for c in clients):
            report(None, "No client connected.", "Run `saturn connect claude` or `saturn connect codex`.")
        for client in clients:
            record = client["install"]
            if not record:
                continue
            _check_install(container, client, record, report)
        return 1 if failures else 0
    finally:
        if own:
            container.close()


def _check_install(container: Container, client: dict[str, Any], record: dict[str, Any], report: Any) -> None:
    title = client["title"]
    try:
        harness = container.access.get(record["harness_id"])
    except SaturnError:
        report(False, f"{title}: its harness no longer exists", f"Run `saturn connect {client['name']}` again.")
        return
    usable = harness.enabled and harness.revoked_at is None
    report(usable, f"{title}: harness '{harness.handle}' is " + ("active" if usable else "disabled or revoked"))
    token = container.access.credentials.read(harness.handle)
    accepted = token is not None and container.access.authenticate(f"Bearer {token}") is not None
    report(accepted, f"{title}: token file " + ("is accepted" if accepted else "is missing or not accepted"),
           f"Rotate the token on Connections or run `saturn connect {client['name']}` again.")
    try:
        plan = container.connect.plan(client["name"], harness=harness.handle, preset=record.get("preset", "standard"),
                                      hooks=bool(record.get("hooks", True)))
        report(not plan.changes, f"{title}: configuration entries " + ("match" if not plan.changes else "differ from Saturn's"),
               f"Run `saturn connect {client['name']}` to rewrite them.")
    except SaturnError as exc:
        report(False, f"{title}: {exc.message}")
