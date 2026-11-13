"""Configuration files, client configuration writers, and the hook relay."""

import json
import threading
import tomllib
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

from saturn.application.ports import ClientSpec
from saturn.bootstrap import hook_relay
from saturn.domain.errors import InvalidInput
from saturn.domain.policy import Policy, Rule
from saturn.infrastructure.clients.claude import ClaudeCode
from saturn.infrastructure.clients.codex import BEGIN, Codex
from saturn.infrastructure.config_files import ConfigFiles, parse_policy, policy_text

SPEC = ClientSpec(handle="work", preset="standard", tools=("saturn_run", "saturn_read", "saturn_query"),
                  pre_approved=("saturn_read", "saturn_query"), hooks=True,
                  stdio=("C:/Py/python.exe", "-m", "saturn.bootstrap.cli", "stdio", "--harness", "work"),
                  hook_command='"C:/Py/python.exe" -m saturn.bootstrap.hook_relay codex {event} --harness work')


# ---- policy.toml and settings.toml ---------------------------------------------------------------


def test_policy_file_round_trips_with_comments(tmp_path):
    policy = Policy(preset="open", allow=(Rule.parse("make deploy", "policy.toml"),), deny=(Rule.parse("cargo *", "policy.toml"),),
                    folders=(tmp_path.resolve(),), hook_scope="all")
    text = policy_text(policy)
    assert text.startswith("# Saturn policy") and "saturn policy allow" in text
    assert parse_policy(tomllib.loads(text)) == policy


@pytest.mark.parametrize("text, message", [
    ('presett = "open"', "Unknown key"), ('[commands]\nalow = ["x"]', "commands.alow"), ('preset = "loose"', "preset"),
    ('[folders]\nallowed = ["relative"]', "absolute"), ('[commands]\nallow = "make test"', "list"),
    ('[commands]\ndeny = ["rm | sh"]', "shell operators"), ('[hooks]\nscope = "sometimes"', "hooks.scope"),
])
def test_policy_file_mistakes_are_errors_not_silent_weakening(text, message):
    with pytest.raises(InvalidInput, match=message):
        parse_policy(tomllib.loads(text))


def test_missing_files_mean_defaults_and_writes_are_atomic(tmp_path):
    files = ConfigFiles(tmp_path / "settings.toml", tmp_path / "policy.toml")
    assert files.load_settings() == {} and files.load_policy() == Policy() and files.settings_stamp() is None
    files.save_settings({"model": "a \"quoted\" name", "inline_token_limit": 700, "llm_enabled": True})
    assert tomllib.loads((tmp_path / "settings.toml").read_text())["model"] == 'a "quoted" name'
    assert files.settings_stamp() is not None and not list(tmp_path.glob("*.tmp"))


# ---- Claude Code ---------------------------------------------------------------------------------


@pytest.fixture
def claude_dir(tmp_path, monkeypatch):
    folder = tmp_path / "claude"
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(folder))
    return folder


def apply(changes):
    for change in changes:
        change.path.parent.mkdir(parents=True, exist_ok=True)
        change.path.write_text(change.after, encoding="utf-8")


def test_claude_entries_keep_every_other_setting_and_remove_cleanly(claude_dir):
    claude_dir.mkdir()
    (claude_dir / ".claude.json").write_text(json.dumps({"mcpServers": {"other": {"command": "x", "env": {"KEY": "keep"}}},
                                                         "projects": {"a": 1}}))
    (claude_dir / "settings.json").write_text(json.dumps({"permissions": {"allow": ["Bash(ls)"], "deny": ["Read(.env)"]},
                                                          "hooks": {"PreToolUse": [{"matcher": "Edit", "hooks": [
                                                              {"type": "command", "command": "lint.sh"}]}]}}))
    writer = ClaudeCode()
    apply(writer.plan_install(SPEC))
    config = json.loads((claude_dir / ".claude.json").read_text())
    settings = json.loads((claude_dir / "settings.json").read_text())
    assert config["mcpServers"]["other"]["env"] == {"KEY": "keep"} and config["projects"] == {"a": 1}
    assert config["mcpServers"]["saturn"]["args"][-1] == "work" and config["mcpServers"]["saturn"]["env"] == {}
    assert settings["permissions"] == {"allow": ["Bash(ls)", "mcp__saturn__saturn_read", "mcp__saturn__saturn_query"],
                                       "deny": ["Read(.env)"]}
    assert len(settings["hooks"]["PreToolUse"]) == 2 and settings["hooks"]["PostToolUse"][0]["matcher"] == "Bash|PowerShell"
    assert writer.plan_install(SPEC) == []  # applying twice changes nothing
    apply(writer.plan_remove())
    config = json.loads((claude_dir / ".claude.json").read_text())
    settings = json.loads((claude_dir / "settings.json").read_text())
    assert "saturn" not in config["mcpServers"] and settings["permissions"]["allow"] == ["Bash(ls)"]
    assert settings["hooks"] == {"PreToolUse": [{"matcher": "Edit", "hooks": [{"type": "command", "command": "lint.sh"}]}]}


def test_claude_refuses_a_file_it_cannot_read(claude_dir):
    claude_dir.mkdir()
    (claude_dir / ".claude.json").write_text("{ not json")
    with pytest.raises(InvalidInput, match="not valid JSON"):
        ClaudeCode().plan_install(SPEC)


@pytest.mark.parametrize("change_handle", [False, True])
def test_claude_ignores_json_formatting_but_repairs_changed_entries(claude_dir, change_handle):
    writer = ClaudeCode()
    apply(writer.plan_install(SPEC))
    for path in writer.files():
        data = json.loads(path.read_text())
        if change_handle and path.name == ".claude.json":
            data["mcpServers"]["saturn"]["args"][-1] = "another-harness"
        path.write_text(json.dumps(data, sort_keys=True, indent=4), encoding="utf-8")
    before = {path: path.read_text() for path in writer.files()}

    changes = writer.plan_install(SPEC)

    assert [change.path.name for change in changes] == ([".claude.json"] if change_handle else [])
    assert {path: path.read_text() for path in writer.files()} == before
    if change_handle:
        assert json.loads(changes[0].after)["mcpServers"]["saturn"]["args"][-1] == "work"


# ---- Codex ---------------------------------------------------------------------------------------


@pytest.fixture
def codex_dir(tmp_path, monkeypatch):
    folder = tmp_path / "codex"
    folder.mkdir()
    monkeypatch.setenv("CODEX_HOME", str(folder))
    return folder


def test_codex_block_is_added_replaced_and_removed_without_touching_the_rest(codex_dir):
    original = 'model = "gpt"\n\n[mcp_servers.other]\ncommand = "x"\n'
    (codex_dir / "config.toml").write_text(original)
    writer = Codex()
    apply(writer.plan_install(SPEC))
    text = (codex_dir / "config.toml").read_text()
    data = tomllib.loads(text)
    server = data["mcp_servers"]["saturn"]
    assert server["args"][-1] == "work" and server["tool_timeout_sec"] == 330 and server["default_tools_approval_mode"] == "writes"
    assert server["enabled_tools"] == ["saturn_run", "saturn_read", "saturn_query"] and "env" not in server
    assert data["hooks"]["PreToolUse"][0]["hooks"][0]["command"].endswith("codex PreToolUse --harness work")
    assert data["mcp_servers"]["other"] == {"command": "x"} and data["model"] == "gpt"
    hands_off = ClientSpec(**{**SPEC.__dict__, "pre_approved": SPEC.tools, "hooks": False})
    apply(writer.plan_install(hands_off))
    text = (codex_dir / "config.toml").read_text()
    assert text.count(BEGIN) == 1 and 'default_tools_approval_mode = "approve"' in text and "hooks" not in tomllib.loads(text)
    apply(writer.plan_remove())
    assert tomllib.loads((codex_dir / "config.toml").read_text()) == tomllib.loads(original)


def test_codex_refuses_a_saturn_entry_it_does_not_own(codex_dir):
    (codex_dir / "config.toml").write_text('[mcp_servers.saturn]\ncommand = "hand-written"\n')
    with pytest.raises(InvalidInput, match="outside Saturn's block"):
        Codex().plan_install(SPEC)


# ---- hook relay ----------------------------------------------------------------------------------


class _Saturn(BaseHTTPRequestHandler):
    seen: list[tuple[str, str, bytes]] = []
    answer: tuple[int, bytes] = (200, b'{"decision": "deny"}')

    def do_POST(self):  # noqa: N802 - the standard library's name
        body = self.rfile.read(int(self.headers["Content-Length"]))
        _Saturn.seen.append((self.path, self.headers["Authorization"], body))
        status, payload = _Saturn.answer
        self.send_response(status)
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass


@pytest.fixture
def fake_saturn(tmp_path, monkeypatch):
    server = HTTPServer(("127.0.0.1", 0), _Saturn)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    home = tmp_path / "home"
    (home / "credentials").mkdir(parents=True)
    (home / "credentials" / "work.token").write_text("stn_token\n")
    monkeypatch.setenv("SATURN_HOME", str(home))
    monkeypatch.setenv("SATURN_URL", f"http://127.0.0.1:{server.server_port}")
    monkeypatch.delenv("SATURN_TOKEN", raising=False)
    _Saturn.seen.clear()
    yield home
    server.shutdown()


def test_the_relay_posts_with_the_token_file_and_prints_the_answer(fake_saturn):
    answer = hook_relay.relay("codex", "PreToolUse", "work", b'{"tool_name": "Bash"}')
    assert answer == b'{"decision": "deny"}'
    assert _Saturn.seen == [("/api/hooks/codex/pre-tool-use", "Bearer stn_token", b'{"tool_name": "Bash"}')]


def test_the_relay_stays_out_of_the_way_on_every_failure(fake_saturn, monkeypatch):
    _Saturn.answer = (204, b"")
    assert hook_relay.relay("claude", "PostToolUse", "work", b"{}") == b""
    _Saturn.answer = (401, b"no")
    assert hook_relay.relay("claude", "PreToolUse", "work", b"{}") == b""
    assert hook_relay.relay("claude", "PreToolUse", "nobody", b"{}") == b""  # no token file: no request
    assert hook_relay.relay("codex", "PostToolUse", "work", b"{}") == b""  # Codex has no output hook
    monkeypatch.setenv("SATURN_URL", "http://127.0.0.1:9")  # nothing listens
    assert hook_relay.relay("claude", "PreToolUse", "work", b"{}") == b""
    assert len(_Saturn.seen) == 2
    _Saturn.answer = (200, b'{"decision": "deny"}')


def test_the_relay_reads_the_port_from_the_home_env_file(tmp_path, monkeypatch):
    home = tmp_path / "home"
    home.mkdir()
    (home / ".env").write_text("LOCAL_SERVER_API_KEY=secret\nSATURN_PORT=9123\n")
    monkeypatch.delenv("SATURN_URL", raising=False)
    assert hook_relay._base_url(Path(home)) == "http://127.0.0.1:9123"


# ---- Client file transactions --------------------------------------------------------------------


@pytest.mark.parametrize("original, replacement", [(b"old\r\n", "new"), (None, "new"), (b"old\r\n", None)])
def test_client_files_restore_completed_changes_after_later_write_failure(tmp_path, monkeypatch, original, replacement):
    # connect.recovery: restore changed bytes or remove newly created files.
    import os

    from saturn.application.ports import FileChange
    from saturn.infrastructure.clients.files import FileApplier

    first, second = tmp_path / "first.json", tmp_path / "second.json"
    if original is not None:
        first.write_bytes(original)
        first.chmod(0o600)
    second.write_text("second old")
    replace = os.replace

    def fail_second(source, target):
        if Path(target) == second:
            raise OSError("second replacement failed")
        return replace(source, target)

    monkeypatch.setattr(os, "replace", fail_second)
    changes = [FileChange(first, first.read_text() if first.exists() else None, replacement, "first"),
               FileChange(second, "second old", "second new", "second")]
    with pytest.raises(OSError, match="second replacement failed"):
        FileApplier(tmp_path / "backups").apply(changes)
    assert (first.read_bytes() if first.exists() else None) == original
    assert second.read_text() == "second old"
    assert not list(tmp_path.glob("*.saturn-tmp"))
    if original is not None and __import__("sys").platform != "win32":
        assert first.stat().st_mode & 0o777 == 0o600


def test_client_files_refuse_changed_preview_before_any_write(tmp_path):
    # connect.recovery: refuse a stale preview before the first write.
    from saturn.application.ports import FileChange
    from saturn.infrastructure.clients.files import FileApplier

    first, second = tmp_path / "first", tmp_path / "second"
    first.write_text("first old")
    second.write_text("changed outside Saturn")
    changes = [FileChange(first, "first old", "first new", "first"), FileChange(second, "second old", "second new", "second")]
    with pytest.raises(InvalidInput, match="changed"):
        FileApplier(tmp_path / "backups").apply(changes)
    assert first.read_text() == "first old"
    assert second.read_text() == "changed outside Saturn"


def connection_service(container, tmp_path):
    from saturn.application.connect_service import ConnectService
    from saturn.infrastructure.clients.files import FileApplier, InstallRecords

    records = InstallRecords(tmp_path / "installs.json")
    return ConnectService(access=container.access, writers=[ClaudeCode()], applier=FileApplier(tmp_path / "backups"),
                          installs=records, stdio=lambda handle: ("python", "-m", "saturn", handle),
                          hook_command=lambda client, handle: f"hook {client} {handle}"), records


@pytest.mark.parametrize("existing", [False, True])
def test_connection_record_failure_restores_files_and_revokes_only_new_access(make_container, claude_dir, tmp_path,
                                                                            monkeypatch, existing):
    # connect.recovery: record failure restores files and preserves existing harness access.
    import os

    c = make_container()
    service, records = connection_service(c, tmp_path)
    old = {"client": "claude", "handle": "previous"}
    records.put(old)
    harness = c.access.create("Existing", ["saturn_read"])[0] if existing else None
    plan = service.plan("claude", harness=harness.id if harness else None)
    replace = os.replace

    def fail_record(source, target):
        if Path(target) == tmp_path / "installs.json":
            raise OSError("installation record failed")
        return replace(source, target)

    monkeypatch.setattr(os, "replace", fail_record)
    with pytest.raises(OSError, match="installation record failed"):
        service.apply(plan, actor="test")
    assert all(not change.path.exists() for change in plan.changes)
    assert records.records() == [old]
    result = c.access.list_harnesses()[0]
    assert (result.revoked_at is not None) is not existing
    assert (c.access.credentials.read(result.handle) is not None) is existing


def test_connection_write_failure_revokes_new_access(make_container, claude_dir, tmp_path, monkeypatch):
    # connect.recovery: revoke a new harness when writing its client registration fails.
    import os

    c = make_container()
    service, records = connection_service(c, tmp_path)
    plan = service.plan("claude")
    replace = os.replace

    def fail_registration(source, target):
        if Path(target) == plan.changes[-1].path:
            raise OSError("registration failed")
        return replace(source, target)

    monkeypatch.setattr(os, "replace", fail_registration)
    with pytest.raises(OSError, match="registration failed"):
        service.apply(plan, actor="test")
    assert all(not change.path.exists() for change in plan.changes)
    assert records.records() == []
    harness = c.access.list_harnesses()[0]
    assert harness.revoked_at is not None and c.access.credentials.read(harness.handle) is None


def test_client_file_recovery_reports_failed_paths_and_continues(tmp_path, monkeypatch):
    # connect.recovery: attempt every restoration and retain backups when one restoration fails.
    import os

    from saturn.application.ports import FileChange
    from saturn.infrastructure.clients.files import FileApplier

    paths = [tmp_path / str(i) for i in range(3)]
    for path in paths:
        path.write_text("old")
    replace = os.replace
    counts = {path: 0 for path in paths}

    def fail_write_and_one_restore(source, target):
        target = Path(target)
        counts[target] += 1
        if target == paths[2] or (target == paths[1] and counts[target] == 2):
            raise OSError("disk failure")
        return replace(source, target)

    monkeypatch.setattr(os, "replace", fail_write_and_one_restore)
    with pytest.raises(OSError, match="recovery incomplete") as error:
        FileApplier(tmp_path / "backups").apply([FileChange(path, "old", "new", "test") for path in paths])
    assert str(paths[1]) in str(error.value) and "backup:" in str(error.value)
    assert paths[0].read_text() == "old" and paths[1].read_text() == "new" and paths[2].read_text() == "old"
    assert len(list((tmp_path / "backups").glob("*/*"))) == 3
    assert not list(tmp_path.glob("*.saturn-tmp"))
