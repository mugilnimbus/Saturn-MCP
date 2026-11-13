"""The command line: lifecycle delegation, setup and configuration commands, and the observability views."""

import json
import os
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

from saturn.bootstrap import cli, launcher, terminal
from saturn.infrastructure import config


def test_evaluation_requires_environment_credential_before_contacting_a_server():
    script = Path(__file__).resolve().parents[1] / 'evals' / 'run_evals.py'
    result = subprocess.run([sys.executable, str(script), '--token-env', 'SATURN_TEST_MISSING_CREDENTIAL'],
                            env={k: v for k, v in os.environ.items() if k != 'SATURN_TEST_MISSING_CREDENTIAL'},
                            capture_output=True, text=True, timeout=15)
    assert result.returncode == 2 and 'evaluation harness token' in result.stderr


@pytest.mark.parametrize("argv, action", [([], "start"), (["start"], "start"), (["stop"], "stop"), (["status"], "status")])
def test_lifecycle_commands_delegate_without_loading_settings(monkeypatch, argv, action):
    seen = []
    monkeypatch.setattr(launcher, "run_launcher", lambda operation, **options: seen.append((operation, options)) or 0)
    monkeypatch.setattr(config, "get_settings", lambda: pytest.fail("lifecycle commands leave settings to the server"))
    with pytest.raises(SystemExit) as result:
        cli.main(argv)
    assert result.value.code == 0
    assert seen == [(action, {"port": None, "timeout": 30, "json_output": False})]


def test_lifecycle_options_and_failure_exit_are_preserved(monkeypatch):
    seen = []
    monkeypatch.setattr(launcher, "run_launcher", lambda operation, **options: seen.append((operation, options)) or 1)
    with pytest.raises(SystemExit) as result:
        cli.main(["status", "--port", "9001", "--timeout", "60", "--json"])
    assert result.value.code == 1
    assert seen == [("status", {"port": 9001, "timeout": 60, "json_output": True})]


@pytest.mark.parametrize("argv", [["start", "--port", "0"], ["start", "--port", "65536"], ["stop", "--timeout", "0"]])
def test_invalid_lifecycle_options_do_not_launch(monkeypatch, argv):
    monkeypatch.setattr(launcher, "run_launcher", lambda *a, **k: pytest.fail("invalid options must not execute"))
    with pytest.raises(SystemExit) as result:
        cli.main(argv)
    assert result.value.code == 2


@pytest.mark.skipif(os.name != "nt", reason="Windows launcher")
def test_start_status_and_stop_work_from_any_folder(monkeypatch, tmp_path):
    root = tmp_path / "checkout"
    root.mkdir()
    outside = tmp_path / "elsewhere"
    outside.mkdir()
    monkeypatch.setattr(launcher, "project_root", lambda: root)
    monkeypatch.chdir(outside)
    seen = []
    monkeypatch.setattr(launcher.shutil, "which", lambda name: "powershell.exe")
    monkeypatch.setattr(launcher.subprocess, "run",
                        lambda args, **kwargs: seen.append((args, kwargs.get("cwd"))) or SimpleNamespace(returncode=0))
    for action in ("status", "stop", "start"):
        assert launcher.run_launcher(action, port=None, timeout=30, json_output=False) == 0
    assert [command[4] for command, _ in seen] == ["status", "stop", "start"] and all(cwd == root for _, cwd in seen)


@pytest.mark.skipif(os.name != "nt", reason="Windows launcher")
def test_registered_powershell_is_used_when_not_on_path(monkeypatch, tmp_path):
    root = tmp_path / "checkout"
    root.mkdir()
    shell = tmp_path / "pwsh.exe"
    shell.touch()
    receipt = tmp_path / ".local" / "bin" / "saturn-registration.json"
    receipt.parent.mkdir(parents=True)
    receipt.write_text(json.dumps({"root": str(root), "shell": str(shell)}), encoding="utf-8-sig")
    monkeypatch.setattr(launcher.Path, "home", lambda: tmp_path)
    monkeypatch.setattr(launcher, "project_root", lambda: root)
    monkeypatch.setattr(launcher.shutil, "which", lambda name: None)
    seen = []
    monkeypatch.setattr(launcher.subprocess, "run", lambda args, **kwargs: seen.append(args) or SimpleNamespace(returncode=0))
    assert launcher.run_launcher("status", port=None, timeout=30, json_output=False) == 0
    assert seen[0][0] == str(shell)


# ---- configuration and observability commands -------------------------------------------------


@pytest.fixture
def saturn_home(tmp_path, monkeypatch):
    home = tmp_path / "home"
    monkeypatch.setenv("SATURN_HOME", str(home))
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(tmp_path / "claude"))
    monkeypatch.setenv("CODEX_HOME", str(tmp_path / "codex"))
    monkeypatch.delenv("SATURN_URL", raising=False)
    config.get_settings.cache_clear()
    yield home
    config.get_settings.cache_clear()


def run(argv, capsys):
    with pytest.raises(SystemExit) as result:
        cli.main(argv)
    out = capsys.readouterr()
    return result.value.code, out.out + out.err


def test_settings_are_written_to_the_home_folder_and_audited(saturn_home, capsys):
    code, out = run(["settings", "set", "inline_token_limit", "900"], capsys)
    assert code == 0 and "inline_token_limit = 900" in out
    assert "inline_token_limit = 900" in (saturn_home / "settings.toml").read_text()
    code, out = run(["settings", "set", "inline_token_limit", "5"], capsys)
    assert code == 1 and "between 100" in out
    code, out = run(["settings", "show"], capsys)
    assert "900" in out and "file" in out
    code, out = run(["events", "--kind", "settings"], capsys)
    assert "terminal" in out and "inline_token_limit" in out


def allowed(home):
    import tomllib

    return tomllib.loads((home / "policy.toml").read_text())["commands"]["allow"]


def test_policy_changes_that_widen_access_need_a_terminal(saturn_home, capsys, monkeypatch):
    monkeypatch.setattr(terminal, "interactive", lambda: False)
    code, out = run(["policy", "deny", "cargo *"], capsys)
    assert code == 0 and "deny +'cargo *'" in out
    code, out = run(["policy", "allow", "make deploy"], capsys)
    assert code == 2 and "interactive terminal" in out
    assert allowed(saturn_home) == []
    code, out = run(["policy", "test", "cargo test"], capsys)
    assert code == 3 and "REFUSED by deny cargo *" in out
    code, out = run(["policy", "test", "git status"], capsys)
    assert code == 0 and "ALLOWED by preset standard" in out
    monkeypatch.setattr(terminal, "interactive", lambda: True)
    monkeypatch.setattr("builtins.input", lambda prompt: "y")
    code, out = run(["policy", "allow", "make deploy"], capsys)
    assert code == 0 and allowed(saturn_home) == ["make deploy"]
    code, out = run(["policy", "show"], capsys)
    assert "make deploy" in out and "cargo *" in out


def test_connect_prints_without_writing_and_refuses_without_a_terminal(saturn_home, tmp_path, capsys, monkeypatch):
    monkeypatch.setattr(terminal, "interactive", lambda: False)
    code, out = run(["connect", "codex", "--print"], capsys)
    assert code == 0 and "Nothing was written" in out and "mcp_servers.saturn" in out
    assert not (tmp_path / "codex" / "config.toml").exists()
    code, out = run(["connect", "codex", "--preset", "standard", "--no-hooks"], capsys)
    assert code == 2 and "interactive terminal" in out
    assert not (saturn_home / "credentials").exists()


def test_connect_applies_after_confirmation_and_doctor_checks_it(saturn_home, tmp_path, capsys, monkeypatch):
    monkeypatch.setattr(terminal, "interactive", lambda: True)
    monkeypatch.setattr("builtins.input", lambda prompt: "y")
    code, out = run(["connect", "codex", "--preset", "standard", "--hooks"], capsys)
    assert code == 0, out
    text = (tmp_path / "codex" / "config.toml").read_text()
    assert "--harness" in text and "codex" in text and "stn_" not in text
    assert (saturn_home / "credentials" / "codex.token").is_file()
    code, out = run(["doctor"], capsys)
    assert "Codex: harness 'codex' is active" in out and "token file is accepted" in out and "entries match" in out
    code, out = run(["events", "--kind", "install"], capsys)
    assert "installed" in out
    code, out = run(["disconnect", "codex", "--revoke"], capsys)
    assert code == 0 and "mcp_servers" not in (tmp_path / "codex" / "config.toml").read_text()
    assert not (saturn_home / "credentials" / "codex.token").exists()


def test_runs_lists_and_shows_a_trace(saturn_home, capsys):
    from saturn.bootstrap.container import build_container

    container = build_container(config.get_settings(), service=False)
    run_id = container.telemetry.start_run("saturn_run", "Codex (codex)", "pytest -q", workspace="/w")
    container.close()
    code, out = run(["runs"], capsys)
    assert code == 0 and run_id in out and "pytest -q" in out
    code, out = run(["runs", "show", run_id], capsys)
    assert code == 0 and "workspace" in out and "/w" in out
    code, out = run(["runs", "show", "missing"], capsys)
    assert code == 1 and "not_found" in out


def test_config_show_names_every_file_and_flags_unknown_env_keys(saturn_home, capsys):
    saturn_home.mkdir(parents=True, exist_ok=True)
    (saturn_home / ".env").write_text("SATURN_PORT=9100\nSATURN_MODEL=x\n", encoding="utf-8")
    config.get_settings.cache_clear()
    code, out = run(["config"], capsys)
    assert code == 0 and "settings.toml" in out and "Unknown key in .env: SATURN_MODEL" in out
    assert "http://127.0.0.1:9100" in out


def test_runs_show_full_prints_the_request_and_the_whole_reply(saturn_home, capsys):
    from saturn.bootstrap.container import build_container
    from saturn.domain.models import RequestMeta

    container = build_container(config.get_settings(), service=False)
    run_id = container.telemetry.start_run("saturn_run", "Codex (codex)", "pytest -q",
                                           request=RequestMeta(transport="stdio", client_info="codex 1.0", request_id="7"))
    container.telemetry.put_payload(run_id, "request", '{"tool": "saturn_run", "arguments": {"command": "pytest -q"}}')
    container.telemetry.put_payload(run_id, "response", "R" * 400 + "END")
    container.close()
    code, out = run(["runs", "show", run_id], capsys)
    assert code == 0 and "stdio" in out and "codex 1.0" in out and "add --full" in out and "END" not in out
    code, out = run(["runs", "show", run_id, "--full"], capsys)
    assert code == 0 and "R" * 400 + "END" in out and '"command": "pytest -q"' in out
