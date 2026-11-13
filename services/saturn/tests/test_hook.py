"""The result hook: long test, build, and lint output from the agent's own shell is replaced by a digest."""

import json

import pytest
from conftest import add_harness_with_token
from fastapi.testclient import TestClient

from saturn.bootstrap.app import create_app
from saturn.domain.hook_policy import is_marked_direct, is_noisy_command, is_single_command, leading_executables
from saturn.domain.tokens import estimate_tokens
from saturn.transport.hook_api import CODEX_PRE_HOOK_PATH, HOOK_PATH, PRE_HOOK_PATH

HOOK_CREDENTIAL = "test-only-hook-credential-0123456789abcdef"
AUTH = {"Authorization": f"Bearer {HOOK_CREDENTIAL}"}
PYTEST_OUT = "\n".join(
    ["============ test session starts ============"]
    + [f"tests/test_a.py::test_{i} PASSED" for i in range(400)]
    + ["short test summary info", "FAILED tests/test_a.py::test_bad - AssertionError: 7 != 6", "======= 1 failed, 400 passed in 1.0s ======="]
)
DIFF_OUT = "diff --git a/x.py b/x.py\n" + "\n".join(f"+line {i} of a long change" for i in range(600))


def event(command: str, stdout: str, *, tool: str = "Bash", stderr: str = "") -> dict:
    return {"hook_event_name": "PostToolUse", "session_id": "s", "cwd": "/work", "tool_name": tool, "tool_use_id": "toolu_1",
            "tool_input": {"command": command, "description": "run"},
            "tool_response": {"stdout": stdout, "stderr": stderr, "interrupted": False, "isImage": False}}


@pytest.fixture
def hook(make_container):
    def build(connected=True, hooks=True, **overrides):
        container = make_container(**overrides)
        add_harness_with_token(container, HOOK_CREDENTIAL, hooks=hooks)
        if connected:
            container.access.saw_mcp(container.access.list_harnesses()[0].id)
        client = TestClient(create_app(container), base_url="http://127.0.0.1:9000", client=("127.0.0.1", 1234))
        client.__enter__()
        opened.append(client)
        return client, container

    opened: list[TestClient] = []
    yield build
    for client in opened:
        client.__exit__(None, None, None)


@pytest.mark.parametrize("command", [
    "pytest -q", "python -m pytest tests", "uv run pytest", "npm test", "cd app && npm run build 2>&1", "FORCE_COLOR=0 npx vitest run",
    "cargo test --lib", "go test ./...", "C:\\tools\\dotnet.exe build", "time make all", "ruff check . | tee out.txt",
    "uv run --no-sync python -m pytest -q", "node --test", "python -m unittest", "docker build .", "uv pip install x", "py -m mypy src",
])
def test_test_build_and_lint_commands_are_noisy(command):
    assert is_noisy_command(command)


@pytest.mark.parametrize("command", [
    "git diff", "cat big.py", "rg TODO src", "ls -la", "git log -50 && git status", "echo pytest", "type notes.md", "",
    # A launcher running a script or one-liner prints whatever that prints; its text may be what the agent wants.
    "python report.py", "uv run python scripts/export.py", "curl -s http://x | python -c 'print(1)'", "node server.js", "docker ps",
])
def test_commands_whose_exact_text_matters_are_left_alone(command):
    assert not is_noisy_command(command)


@pytest.mark.parametrize(("command", "direct"), [
    ("SATURN_DIRECT=1 pytest -q", True), ("cd app && SATURN_DIRECT=1 pytest", True), ("$env:SATURN_DIRECT=1; pytest -q", True),
    ("pytest -q", False), ("NOT_SATURN_DIRECT=1 pytest", False), ("SATURN_DIRECT=0 pytest", False),
])
def test_a_command_can_be_marked_to_keep_its_output(command, direct):
    assert is_marked_direct(command) is direct


def test_a_marked_command_is_not_digested(hook):
    client, container = hook()
    assert client.post(HOOK_PATH, json=event("SATURN_DIRECT=1 pytest -q", PYTEST_OUT), headers=AUTH).status_code == 204
    assert container.telemetry.list_runs() == []


def test_each_part_of_a_command_line_is_recognised():
    assert leading_executables("cd app && FOO=1 npm test | tail -5; ./scripts/build.sh") == ["cd", "npm", "tail", "build"]


def test_long_test_output_is_replaced_by_a_digest_that_keeps_the_result_shape(hook):
    client, container = hook()
    response = client.post(HOOK_PATH, json=event("pytest -q", PYTEST_OUT, stderr="warning: slow"), headers=AUTH)
    assert response.status_code == 200 and response.headers["cache-control"] == "no-store"
    output = response.json()["hookSpecificOutput"]
    assert output["hookEventName"] == "PostToolUse"
    replaced = output["updatedToolOutput"]
    assert set(replaced) == {"stdout", "stderr", "interrupted", "isImage"} and replaced["stderr"] == "" and replaced["interrupted"] is False
    assert "1 failed, 400 passed" in replaced["stdout"] and "test_bad" in replaced["stdout"] and "saturn_query" in replaced["stdout"]
    assert estimate_tokens(replaced["stdout"]) < estimate_tokens(PYTEST_OUT) / 10

    run = container.telemetry.list_runs(limit=1)[0]
    assert run["tool"] == "saturn_hook" and run["route"] == "digest" and run["summary"] == "pytest -q"
    assert run["client"] == "Hook harness (hook-harness)" and run["raw_tokens"] > run["returned_tokens"] > 0
    stored = container.artifacts.get_text(run["artifact_id"])
    assert "test_399 PASSED" in stored and "warning: slow" in stored  # stdout and stderr, in full


def test_short_output_and_other_tools_are_left_untouched_and_unrecorded(hook):
    client, container = hook()
    for body in (
        event("pytest -q", "2 passed in 0.1s"),
        event("git diff", DIFF_OUT),
        event("pytest -q", PYTEST_OUT, tool="Read"),
        {"tool_name": "Bash", "tool_input": {"command": "pytest"}, "tool_response": "plain text, not a shell result"},
        {"tool_name": "Bash", "tool_input": {}, "tool_response": {"stdout": 5}},
    ):
        response = client.post(HOOK_PATH, json=body, headers=AUTH)
        assert response.status_code == 204 and response.content == b""
    assert container.telemetry.list_runs() == []


def test_scope_all_covers_every_command_and_off_disables_the_hook(hook):
    client, container = hook(hook_scope="all")
    everything = client.post(HOOK_PATH, json=event("git diff", DIFF_OUT), headers=AUTH)
    assert everything.status_code == 200 and "diff:" in everything.json()["hookSpecificOutput"]["updatedToolOutput"]["stdout"]
    off, off_container = hook(hook_scope="off")
    assert off.post(HOOK_PATH, json=event("pytest -q", PYTEST_OUT), headers=AUTH).status_code == 204
    assert off_container.telemetry.list_runs() == []


def test_powershell_results_are_handled_like_bash(hook):
    client, _ = hook()
    response = client.post(HOOK_PATH, json=event("pytest -q", PYTEST_OUT, tool="PowerShell"), headers=AUTH)
    assert response.status_code == 200


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer wrong"}, {"Authorization": f"Basic {HOOK_CREDENTIAL}"}])
def test_the_hook_requires_a_harness_token(hook, headers):
    client, container = hook()
    response = client.post(HOOK_PATH, json=event("pytest -q", PYTEST_OUT), headers=headers)
    assert response.status_code == 401 and HOOK_CREDENTIAL not in response.text
    assert container.telemetry.list_runs() == []


def test_malformed_and_oversized_input_is_refused(hook):
    client, _ = hook()
    assert client.post(HOOK_PATH, content=b"not json", headers={**AUTH, "Content-Type": "application/json"}).status_code == 422
    huge = json.dumps(event("pytest -q", "x" * 8_100_000)).encode()
    assert client.post(HOOK_PATH, content=huge, headers={**AUTH, "Content-Type": "application/json"}).status_code == 413


def test_secrets_in_the_output_are_masked_before_storage(hook):
    client, container = hook()
    client.post(HOOK_PATH, json=event("pytest -q", "api_key=abcdef1234567890SECRET\n" + PYTEST_OUT), headers=AUTH)
    run = container.telemetry.list_runs(limit=1)[0]
    assert "abcdef1234567890SECRET" not in container.artifacts.get_text(run["artifact_id"]) and run["redactions"] >= 1


def test_connection_details_include_hook_addresses_and_per_harness_commands(hook):
    client, _ = hook()
    details = client.get("/api/connections").json()
    assert details["endpoint"] == "http://127.0.0.1:9000/mcp"
    assert details["hook_endpoints"] == {"claude_pre": "http://127.0.0.1:9000" + PRE_HOOK_PATH,
                                         "claude_post": "http://127.0.0.1:9000" + HOOK_PATH,
                                         "codex_pre": "http://127.0.0.1:9000" + CODEX_PRE_HOOK_PATH}
    harness = details["harnesses"][0]
    assert harness["stdio"][1:] == ["-m", "saturn.bootstrap.cli", "stdio", "--harness", "hook-harness"]
    assert harness["stdio"][0].lower().endswith(("python.exe", "python", "python3"))
    assert "saturn.bootstrap.hook_relay codex {event} --harness hook-harness" in harness["hook_commands"]["codex"]


# ---- before a command runs: send noisy commands to saturn_run -----------------------------------------


def pre_event(command: str, cwd: str, *, tool: str = "Bash") -> dict:
    return {"hook_event_name": "PreToolUse", "session_id": "s", "cwd": cwd, "tool_name": tool, "tool_use_id": "toolu_1",
            "tool_input": {"command": command, "description": "run"}}


@pytest.mark.parametrize("command, single", [
    ("pytest -q", True), ("uv run pytest tests/test_a.py -k slow", True), ("npm test", True),
    ("cd app && npm test", False), ("pytest -q | tail -5", False), ("pytest > out.txt", False), ("FOO=1 pytest", False),
    ("pytest; echo done", False), ("echo $(pytest)", False), ("pytest\nruff check .", False), ("", False),
])
def test_only_one_plain_command_can_be_handed_to_saturn(command, single):
    assert is_single_command(command) is single


def test_a_noisy_command_is_declined_in_favour_of_saturn_run_once_the_agent_is_known_to_have_it(hook, root):
    client, container = hook(connected=False)
    harness = container.access.list_harnesses()[0]
    before = client.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root)), headers=AUTH)
    assert before.status_code == 204  # this harness has not used MCP yet: its agent may not have saturn_run

    seen = client.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "initialize",
                                     "params": {"protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}}},
                       headers={**AUTH, "Accept": "application/json, text/event-stream"})
    assert seen.status_code == 200 and container.access.uses_mcp(harness.id)

    after = client.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root / "pkg")), headers=AUTH)
    decision = after.json()["hookSpecificOutput"]
    assert decision["hookEventName"] == "PreToolUse" and decision["permissionDecision"] == "deny"
    reason = decision["permissionDecisionReason"]
    assert "mcp__saturn__saturn_run" in reason and "command='pytest -q'" in reason and "pkg" in reason
    assert reason.endswith("run it yourself as: SATURN_DIRECT=1 pytest -q")
    # The way out really is a way out: that form is not a plain command, so it is not declined again.
    assert client.post(PRE_HOOK_PATH, json=pre_event("SATURN_DIRECT=1 pytest -q", str(root)), headers=AUTH).status_code == 204
    windows = client.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root), tool="PowerShell"), headers=AUTH).json()
    direct = windows["hookSpecificOutput"]["permissionDecisionReason"].rsplit("as: ", 1)[1]
    assert direct == "$env:SATURN_DIRECT=1; pytest -q"
    assert client.post(PRE_HOOK_PATH, json=pre_event(direct, str(root), tool="PowerShell"), headers=AUTH).status_code == 204
    # Nothing ran, but each redirect is traced: which command, which rule allowed it, for which harness and folder.
    runs = container.telemetry.list_runs()
    assert [r["route"] for r in runs] == ["redirect", "redirect"] and all(r["tool"] == "saturn_hook" for r in runs)
    assert runs[0]["decision"] == "preset standard" and runs[0]["harness_id"] == harness.id and runs[0]["workspace"]


def test_everything_saturn_could_not_run_the_same_way_is_left_to_the_shell(hook, root):
    client, container = hook()
    container.access.saw_mcp(container.access.list_harnesses()[0].id)
    for command, cwd, tool in (
        ("git diff", str(root), "Bash"),                 # exact text matters
        ("cd pkg && pytest -q", str(root), "Bash"),      # needs a shell
        ("python build.py", str(root), "Bash"),          # not on Saturn's allow list
        ("ruff check --fix .", str(root), "Bash"),       # would change files
        ("pytest -q", str(root.parent), "Bash"),         # outside the allowed folders
        ("pytest -q", str(root / "missing"), "Bash"),    # not a folder
        ("pytest -q", str(root), "Read"),                # not a shell tool
    ):
        response = client.post(PRE_HOOK_PATH, json=pre_event(command, cwd, tool=tool), headers=AUTH)
        assert response.status_code == 204, command
    assert client.post(PRE_HOOK_PATH, json={"tool_name": "Bash", "tool_input": {}}, headers=AUTH).status_code == 204


def test_the_redirect_respects_permissions_the_off_switch_and_the_token(hook, root):
    client, container = hook()
    harness = container.access.list_harnesses()[0]
    container.access.saw_mcp(harness.id)
    container.access.edit(harness.id, harness.name, ["saturn_read"], None, True)  # no longer allowed saturn_run
    assert client.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root)), headers=AUTH).status_code == 204
    assert client.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root))).status_code == 401

    off, off_container = hook(hook_scope="off")
    off_container.access.saw_mcp(off_container.access.list_harnesses()[0].id)
    assert off.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root)), headers=AUTH).status_code == 204


def test_post_replacement_requires_query_and_mcp_contact(hook):
    client, container = hook(connected=False)
    assert client.post(HOOK_PATH, json=event('pytest -q', PYTEST_OUT), headers=AUTH).status_code == 204
    harness = container.access.list_harnesses()[0]
    container.access.saw_mcp(harness.id)
    container.access.edit(harness.id, harness.name, ['saturn_run'], None, True)
    assert client.post(HOOK_PATH, json=event('pytest -q', PYTEST_OUT), headers=AUTH).status_code == 204
    assert not container.artifacts.list()


async def test_hook_rejects_stream_before_consuming_the_oversized_chunk(make_container, monkeypatch):
    from fastapi import HTTPException
    from starlette.requests import Request

    from saturn.transport import hook_api
    monkeypatch.setattr(hook_api, 'MAX_BODY_BYTES', 100)
    container = make_container()
    add_harness_with_token(container, HOOK_CREDENTIAL)
    received = []
    async def receive():
        received.append(1)
        return {'type': 'http.request', 'body': b' ' * 101, 'more_body': True}
    request = Request({'type': 'http', 'headers': [(b'authorization', AUTH['Authorization'].encode())]}, receive)
    with pytest.raises(HTTPException) as error:
        await hook_api._event(request, container)
    assert error.value.status_code == 413 and len(received) == 1


def test_pre_hook_uses_declared_workspace_without_manual_registration(hook, root):
    client, _ = hook(folders=[])  # no allowed-folder list: any workspace the agent names
    response = client.post(PRE_HOOK_PATH, json=pre_event('pytest -q', str(root.parent)), headers=AUTH)
    assert response.status_code == 200


def test_codex_gets_the_same_redirect_and_a_harness_can_switch_hooks_off(hook, root):
    client, container = hook()
    decision = client.post(CODEX_PRE_HOOK_PATH, json=pre_event("pytest -q", str(root)), headers=AUTH).json()
    assert decision["hookSpecificOutput"]["permissionDecision"] == "deny"
    assert client.post(CODEX_PRE_HOOK_PATH, json=pre_event("pytest -q", str(root), tool="PowerShell"), headers=AUTH).status_code == 204
    quiet, quiet_container = hook(hooks=False)
    assert quiet.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root)), headers=AUTH).status_code == 204
    assert quiet.post(HOOK_PATH, json=event("pytest -q", PYTEST_OUT), headers=AUTH).status_code == 204
    assert quiet_container.telemetry.list_runs() == []


def test_a_harness_deny_rule_keeps_its_command_with_the_shell(hook, root):
    client, container = hook(deny=["pytest *"])
    assert client.post(PRE_HOOK_PATH, json=pre_event("pytest -q", str(root)), headers=AUTH).status_code == 204
