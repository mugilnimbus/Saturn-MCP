import pytest
from conftest import FakeGateway, FakeRunner
from fastapi.testclient import TestClient
from mcp import Client

from saturn.bootstrap.app import create_app
from saturn.transport.mcp_server import build_mcp

NOISY = "\n".join(f"line {i} ok" for i in range(900)) + "\nERROR something broke\n"


@pytest.fixture
def api(make_container):
    container = make_container(runner=FakeRunner("small output"), base_url="http://127.0.0.1:9/v1")
    with TestClient(create_app(container), base_url="http://127.0.0.1:9000") as client:
        client.container = container  # type: ignore[attr-defined]
        yield client


def test_ready_is_degraded_only_when_a_selected_model_cannot_be_reached(api):
    assert api.get("/api/health").json() == {"status": "ok"}
    ready = api.get("/api/ready").json()
    assert ready["status"] == "ok" and ready["worker_model"] == "" and ready["local_server"]["reachable"] is False
    api.container.config.save_settings({"model": "worker-1"}, actor="dashboard")  # type: ignore[attr-defined]
    ready = api.get("/api/ready").json()
    assert ready["status"] == "degraded" and ready["store"] == "ok" and ready["worker_model"] == "worker-1"


def test_overview_uses_etag_and_validates_window(api):
    first = api.get("/api/overview?window=1h")
    assert first.status_code == 200 and "etag" in first.headers
    assert api.get("/api/overview?window=1h", headers={"If-None-Match": first.headers["etag"]}).status_code == 304
    assert api.get("/api/overview?window=3y").status_code == 400


def test_runs_listing_and_trace_404(api):
    assert api.get("/api/runs?limit=5").json()["runs"] == []
    assert api.get("/api/runs/unknown").status_code == 404
    assert api.get("/api/runs?status=bogus").status_code == 422


def test_settings_validation_and_origin_check(api):
    ok = api.put("/api/settings", json={"inline_token_limit": 900}, headers={"Origin": "http://127.0.0.1:9000"})
    assert ok.status_code == 200 and ok.json()["tunables"]["inline_token_limit"] == 900
    assert api.put("/api/settings", json={"inline_token_limit": 5}).status_code == 422
    assert api.put("/api/settings", json={"reasoning_effort": "turbo"}).status_code == 422
    evil = api.put("/api/settings", json={"llm_enabled": False}, headers={"Origin": "http://evil.example"})
    assert evil.status_code == 403 and api.container.tunables.llm_enabled is True  # type: ignore[attr-defined]


def test_settings_are_saved_to_the_file_and_survive_a_restart(tmp_path):
    from saturn.bootstrap.container import build_container
    from saturn.infrastructure.config import Settings

    settings = Settings(_env_file=None, home_raw=str(tmp_path / "home"))
    first = build_container(settings, gateway=FakeGateway(), runner=FakeRunner())
    with TestClient(create_app(first), base_url="http://127.0.0.1:9000") as client:
        saved = client.put("/api/settings", json={"digest_token_budget": 600, "model": "worker-1"})
        assert saved.status_code == 200
    assert "digest_token_budget = 600" in settings.settings_path.read_text()
    second = build_container(settings, gateway=FakeGateway(), runner=FakeRunner())
    assert second.tunables.digest_token_budget == 600 and second.tunables.model == "worker-1"
    actions = [(e.kind, e.actor) for e in second.access.events()]
    assert ("settings", "dashboard") in actions and ("service", "service") in actions
    second.close()


def test_a_hand_edited_settings_file_applies_on_the_next_call_and_a_broken_one_does_not(tmp_path):
    import os
    import time

    from saturn.bootstrap.container import build_container
    from saturn.infrastructure.config import Settings

    settings = Settings(_env_file=None, home_raw=str(tmp_path / "home"))
    container = build_container(settings, gateway=FakeGateway(), runner=FakeRunner())
    container.config.save_settings({"inline_token_limit": 800}, actor="terminal")
    settings.settings_path.write_text("inline_token_limit = 1200\n", encoding="utf-8")
    os.utime(settings.settings_path, (time.time() + 5, time.time() + 5))
    container.config.refresh()
    assert container.tunables.inline_token_limit == 1200
    assert container.access.events(kind="settings")[0].actor == "file"
    settings.settings_path.write_text("inline_token_limit = 'lots'\n", encoding="utf-8")
    os.utime(settings.settings_path, (time.time() + 10, time.time() + 10))
    container.config.refresh()
    assert container.tunables.inline_token_limit == 1200 and "settings.toml" in container.config.errors
    settings.policy_path.write_text("preset = 'loose'\n", encoding="utf-8")
    container.config.refresh()
    assert container.config.policy.preset == "standard" and "policy.toml" in container.config.errors
    assert container.access.events(kind="policy")[0].action == "rejected"
    container.close()


def test_policy_view_and_test_endpoints_explain_decisions(api):
    view = api.get("/api/policy").json()
    assert view["preset"] == "standard" and view["error"] is None
    refused = api.post("/api/policy/test", json={"command": "npm run deploy"}).json()
    assert refused["allowed"] is False and refused["rule"] == "preset standard"
    allowed = api.post("/api/policy/test", json={"command": "pytest -q"}).json()
    assert allowed["allowed"] is True


def test_settings_never_expose_the_api_key(api):
    body = api.get("/api/settings").text
    assert "test-key-123456" not in body and '"api_key_configured":true' in body.replace(" ", "")


def test_requests_addressed_to_another_host_are_rejected(api):
    assert api.get("/api/runs", headers={"Host": "evil.example"}).status_code == 400
    assert api.get("/api/runs", headers={"Host": "localhost:9000"}).status_code == 200


async def test_mcp_tools_work_through_the_protocol(make_container):
    container = make_container(runner=FakeRunner(NOISY, exit_code=1), gateway=FakeGateway())
    async with Client(build_mcp(container)) as client:
        names = {t.name for t in (await client.list_tools()).tools}
        assert names == {"saturn_run", "saturn_read", "saturn_search", "saturn_ask", "saturn_query"}
        ran = await client.call_tool("saturn_run", {"command": "pytest -q"})
        assert not ran.is_error and "art_" in ran.content[0].text
        denied = await client.call_tool("saturn_run", {"command": "curl http://example.com"})
        assert denied.is_error and "policy_violation" in denied.content[0].text
        read = await client.call_tool("saturn_read", {"path": "pkg/calc.py"})
        assert "def add" in read.content[0].text


async def test_mcp_scopes_simultaneous_projects_without_changing_server_roots(make_container, tmp_path_factory):
    import asyncio
    a, b = tmp_path_factory.mktemp('workspace-a'), tmp_path_factory.mktemp('workspace-b')
    (a / 'source.txt').write_text('project alpha', encoding='utf-8')
    (b / 'source.txt').write_text('project beta', encoding='utf-8')
    container = make_container(folders=[])  # no allowed-folder list: each client names its own workspace
    async with Client(build_mcp(container)) as first, Client(build_mcp(container)) as second:
        results = await asyncio.gather(
            first.call_tool('saturn_read', {'path': 'source.txt', 'workspace_root': str(a)}),
            second.call_tool('saturn_read', {'path': 'source.txt', 'workspace_root': str(b)}),
        )
        assert 'project alpha' in results[0].content[0].text
        assert 'project beta' in results[1].content[0].text
        denied = await first.call_tool('saturn_read', {'path': str(b / 'source.txt'), 'workspace_root': str(a)})
        assert denied.is_error and 'outside the folders this call may use' in denied.content[0].text
        missing = await first.call_tool('saturn_read', {'path': 'pkg/calc.py'})
        assert missing.is_error and 'workspace_root' in missing.content[0].text


async def test_allowed_folders_limit_client_declared_workspaces(make_container, tmp_path_factory):
    other = tmp_path_factory.mktemp('restricted-workspace')
    (other / 'source.txt').write_text('outside', encoding='utf-8')
    async with Client(build_mcp(make_container())) as client:  # the policy allows only the test project
        result = await client.call_tool('saturn_read', {'path': str(other / 'source.txt'), 'workspace_root': str(other)})
        assert result.is_error and 'policy_violation' in result.content[0].text
