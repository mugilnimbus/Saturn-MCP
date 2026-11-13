"""`saturn config`, `settings`, `policy`, `runs`, `events`, and `logs`: configuration and observability from a terminal.

These read the store and the configuration files directly, so they work while the service is stopped.
Policy changes that widen what agents may do need a confirmation in an interactive terminal.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, replace
from pathlib import Path

from saturn.bootstrap.container import Container, build_container
from saturn.bootstrap.launcher import project_root
from saturn.bootstrap.terminal import Abort, check, confirm, require_terminal, section, table, when
from saturn.domain.errors import InvalidInput
from saturn.domain.policy import HOOK_SCOPES, PRESETS, PathPolicy, Rule, decide, split_command
from saturn.infrastructure.config import ENV_KEYS, get_settings, unknown_env_keys
from saturn.infrastructure.config_files import POLICY_SOURCE


def _container() -> Container:
    return build_container(get_settings(), service=False)


# ---- config / settings ---------------------------------------------------------------------------


def config_show(_args: argparse.Namespace) -> int:
    settings = get_settings()
    container = _container()
    try:
        section("Files")
        table([("home", settings.home), (".env", settings.env_path), ("settings", settings.settings_path),
               ("policy", settings.policy_path), ("credentials", settings.credentials_dir),
               ("installs", settings.installs_path), ("data", settings.data_dir)], ("item", "path"))
        section("Startup (.env and environment)")
        present = []
        if settings.env_path.is_file():
            for line in settings.env_path.read_text(encoding="utf-8-sig").splitlines():
                key = line.split("=", 1)[0].strip().removeprefix("export ").strip()
                if "=" in line and key and not key.startswith("#"):
                    present.append(key)
        rows = [(k, "set" if k in present else "", "secret" if k == "LOCAL_SERVER_API_KEY" else "") for k in ENV_KEYS]
        table(rows, ("key", "in .env", "note"))
        for key in unknown_env_keys(settings.env_path):
            check(None, f"Unknown key in .env: {key}")
        print(f"  listening on {settings.base_url}")
        _settings_table(container)
        _policy_summary(container)
        for name, error in container.config.errors.items():
            check(False, f"{name} is not applied: {error}")
        return 0
    finally:
        container.close()


def _settings_table(container: Container) -> None:
    section("Settings (settings.toml)")
    saved = container.config.saved_settings()
    table([(k, json.dumps(v), "file" if k in saved else "default") for k, v in container.tunables.values().items()],
          ("key", "value", "from"))


def settings_cmd(args: argparse.Namespace) -> int:
    container = _container()
    try:
        if args.action == "show":
            _settings_table(container)
            return 0
        from saturn.application.tunables import Tunables

        value = Tunables.parse(args.key, args.value)
        diff = container.config.save_settings({args.key: value}, actor="terminal")
        print(f"{args.key} = {json.dumps(value)}" + ("" if diff else " (unchanged)"))
        print("A running Saturn applies it on its next call.")
        return 0
    finally:
        container.close()


# ---- policy --------------------------------------------------------------------------------------


def _policy_summary(container: Container) -> None:
    policy = container.config.policy
    section(f"Policy ({container.settings.policy_path})")
    print(f"  preset {policy.preset}; hooks {policy.hook_scope}; folders: {', '.join(map(str, policy.folders)) or 'any workspace'}")
    rows = [("allow", r.pattern, r.source) for r in policy.allow] + [("deny", r.pattern, r.source) for r in policy.deny]
    rows += [("deny", d, f"harness {h.handle}") for h in container.access.list_harnesses() if h.revoked_at is None for d in h.deny]
    if rows:
        table(rows, ("rule", "pattern", "source"))
    else:
        print("  No allow or deny rules: the preset decides.")


def policy_cmd(args: argparse.Namespace) -> int:
    container = _container()
    try:
        policy = container.config.policy
        if "policy.toml" in container.config.errors:
            raise Abort(f"policy.toml is not applied: {container.config.errors['policy.toml']} Fix the file first.")
        action = args.action
        if action == "show":
            _policy_summary(container)
            return 0
        if action == "test":
            return _policy_test(container, args)
        widening = False
        if action in ("allow", "deny"):
            rule = Rule.parse(args.pattern, POLICY_SOURCE)
            current = getattr(policy, action)
            if any(r.pattern == rule.pattern for r in current):
                print(f"'{rule.pattern}' is already in {action}.")
                return 0
            new = replace(policy, allow=(*current, rule)) if action == "allow" else replace(policy, deny=(*current, rule))
            widening = action == "allow"
        elif action == "remove":
            pattern = " ".join(split_command(args.pattern))
            found = [name for name in ("allow", "deny") if any(" ".join(r.words) == pattern for r in getattr(policy, name))]
            if not found:
                raise Abort(f"No rule '{args.pattern}' in policy.toml.")
            new = replace(policy, allow=tuple(r for r in policy.allow if " ".join(r.words) != pattern),
                          deny=tuple(r for r in policy.deny if " ".join(r.words) != pattern))
            widening = "deny" in found
        elif action == "preset":
            if args.value not in PRESETS:
                raise InvalidInput(f"preset must be one of {', '.join(PRESETS)}.")
            new = replace(policy, preset=args.value)
            widening = args.value == "open"
        elif action == "hooks":
            if args.value not in HOOK_SCOPES:
                raise InvalidInput(f"hooks must be one of {', '.join(HOOK_SCOPES)}.")
            new = replace(policy, hook_scope=args.value)
        elif action == "folder":
            path = Path(args.path).expanduser().resolve()
            if args.change == "add":
                if not path.is_dir():
                    raise InvalidInput(f"'{path}' is not a folder.")
                new = replace(policy, folders=tuple(dict.fromkeys((*policy.folders, path))))
                widening = bool(policy.folders)
            else:
                new = replace(policy, folders=tuple(f for f in policy.folders if f != path))
                widening = not new.folders and bool(policy.folders)
        else:
            raise Abort(f"Unknown policy action '{action}'.")
        if widening:
            require_terminal("Widening the policy")
            if not confirm("This lets agents do more. Apply it?", default=False):
                raise Abort("Nothing was changed.")
        summary = container.config.save_policy(new, actor="terminal")
        print(f"policy.toml updated: {summary}")
        print("A running Saturn applies it on its next call. Comments added by hand to policy.toml are not kept.")
        return 0
    finally:
        container.close()


def _policy_test(container: Container, args: argparse.Namespace) -> int:
    argv = split_command(args.pattern)
    folder = Path(args.folder).expanduser().resolve() if args.folder else Path.cwd().resolve()
    deny: tuple[Rule, ...] = ()
    if args.harness:
        harness = container.access.get(args.harness)
        deny = tuple(Rule.parse(d, f"harness {harness.handle}") for d in harness.deny)
    decision = decide(container.config.policy, argv, workdir=folder, paths=PathPolicy((folder,)), harness_deny=deny)
    print(("ALLOWED" if decision.allowed else "REFUSED") + f" by {decision.rule}")
    print(f"  {decision.reason}")
    print(f"  folder: {folder}")
    return 0 if decision.allowed else 3


# ---- runs / events / logs -----------------------------------------------------------------------


def runs_cmd(args: argparse.Namespace) -> int:
    container = _container()
    try:
        if args.run_id:
            return _run_detail(container, args.run_id, as_json=args.json, full=args.full)
        harness = container.access.get(args.harness).id if args.harness else None
        rows = container.telemetry.list_runs(limit=args.limit, tool=args.tool, status=args.status, harness=harness,
                                             query=args.query)
        if args.json:
            print(json.dumps(rows, indent=2, default=str))
            return 0
        table([(r["id"], when(r["started_at"]), r["tool"].removeprefix("saturn_"), r["status"], r["route"],
                f"{r['raw_tokens']}→{r['returned_tokens']}", (r["client"] or "")[:28], (r["summary"] or "")[:50])
               for r in rows], ("run", "started", "tool", "status", "route", "tokens", "harness", "summary"))
        print(f"\n{len(rows)} run(s). Details: saturn runs show <run>")
        return 0
    finally:
        container.close()


def _body(container: Container, payload: dict[str, object] | None, full: bool) -> str:
    """A payload's text: in full when asked (and still kept), otherwise its preview."""
    if payload is None:
        return "(not kept: bodies are kept for 48 hours)"
    if full and not payload["complete"]:
        return str(container.telemetry.get_payload(str(payload["id"]))["text"])
    return str(payload["preview"]) + ("" if payload["complete"] else "\n… (add --full for all of it)")


def _run_detail(container: Container, run_id: str, *, as_json: bool, full: bool = False) -> int:
    trace = container.telemetry.get_run_trace(run_id)
    if as_json:
        if full:
            trace["payloads"] = [container.telemetry.get_payload(p["id"]) for p in trace["payloads"]]
        print(json.dumps(trace, indent=2, default=str))
        return 0
    run = trace["run"]
    payloads = {(p["kind"], p["owner_id"]): p for p in trace["payloads"]}
    section(f"Run {run['id']} · {run['tool']} · {run['status']}")
    duration = f"{run['ended_at'] - run['started_at']:.2f} s" if run["ended_at"] else "running"
    for label, value in (("started", when(run["started_at"])), ("duration", duration), ("caller", run["client"]),
                         ("route", run["transport"]), ("client", run["client_info"]), ("session", run["session_id"]),
                         ("request id", run["request_id"]),
                         ("workspace", run["workspace"]), ("summary", run["summary"]), ("produced by", run["route"]),
                         ("policy", run["decision"]), ("exit", run["exit_code"]),
                         ("tokens", f"{run['raw_tokens']} produced → {run['returned_tokens']} returned"),
                         ("artifact", run["artifact_id"]), ("error", run["error"])):
        if value not in (None, ""):
            print(f"  {label:<10} {value}")
    if ("request", None) in payloads:
        section("Request")
        print(_body(container, payloads[("request", None)], full))
    if trace["spans"]:
        section("Path")
        depth: dict[str, int] = {}
        for span in trace["spans"]:
            level = depth[span["id"]] = depth.get(span["parent_id"] or "", -1) + 1
            took = f"{(span['ended_at'] - span['started_at']) * 1000:.0f} ms" if span["ended_at"] else "…"
            attrs = ", ".join(f"{k}={v}" for k, v in span["attrs"].items() if k not in ("cwd",))[:110]
            print(f"  {'  ' * level}{span['name']} [{span['status']}, {took}] {attrs}")
    if trace["llm_calls"]:
        section("Model calls")
        table([(c["model"], c["purpose"], c["status"], c["input_tokens"], c["output_tokens"],
                f"{(c['ended_at'] or c['started_at']) - c['started_at']:.1f} s") for c in trace["llm_calls"]],
              ("model", "purpose", "status", "in", "out", "time"))
        for index, call in enumerate(trace["llm_calls"], start=1):
            print(f"\n  --- call {index}: {call['purpose']} prompt")
            print(_body(container, payloads.get(("llm_prompt", call["id"])), full))
            print(f"  --- call {index}: reply")
            print(_body(container, payloads.get(("llm_output", call["id"])), full))
    section("Response")
    print(_body(container, payloads.get(("response", None)), full))
    return 0


def events_cmd(args: argparse.Namespace) -> int:
    container = _container()
    try:
        rows = container.access.events(limit=args.limit, kind=args.kind)
        if args.json:
            print(json.dumps([asdict(e) for e in rows], indent=2))
            return 0
        table([(when(e.at), e.kind, e.actor, e.subject[:30], e.action, e.detail[:70]) for e in rows],
              ("time", "kind", "by", "subject", "action", "detail"))
        return 0
    finally:
        container.close()


def logs_cmd(args: argparse.Namespace) -> int:
    """The managed server's log: the current run's, or the newest."""
    try:
        runtime = project_root() / ".artifacts" / "server"
    except ValueError as exc:
        raise Abort(str(exc)) from exc
    folder: Path | None = None
    state = runtime / "state.json"
    if state.is_file():
        try:
            folder = runtime / str(json.loads(state.read_text(encoding="utf-8-sig"))["run_id"])
        except (ValueError, KeyError, TypeError):
            folder = None
    if folder is None or not folder.is_dir():
        candidates = [p for p in runtime.glob("*") if p.is_dir()] if runtime.is_dir() else []
        if not candidates:
            raise Abort("No server log yet. Start Saturn with `saturn start`.")
        folder = max(candidates, key=lambda p: p.stat().st_mtime)
    path = folder / ("stdout.log" if args.stdout else "stderr.log")
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines() if path.is_file() else []
    print(f"{path} (last {min(args.lines, len(lines))} of {len(lines)} lines, modified {when(path.stat().st_mtime) if path.is_file() else '-'})")
    for line in lines[-args.lines:]:
        print(line)
    return 0
