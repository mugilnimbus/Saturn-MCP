"""Bearer protection at the real ASGI boundary, including session follow-up requests."""

import pytest
from conftest import FakeRunner, add_harness
from fastapi.testclient import TestClient

from saturn.bootstrap.app import create_app

INITIALIZE = {
    "jsonrpc": "2.0", "id": 1, "method": "initialize",
    "params": {"protocolVersion": "2025-11-25", "capabilities": {},
               "clientInfo": {"name": "auth-test", "version": "1"}},
}
ACCEPT = {"Accept": "application/json, text/event-stream"}


@pytest.fixture
def secured(make_container):
    container = make_container()
    token = add_harness(container)
    with TestClient(create_app(container), base_url="http://127.0.0.1:9000") as client:
        yield client, container, token


@pytest.mark.parametrize("method", ["GET", "POST", "DELETE", "OPTIONS"])
@pytest.mark.parametrize("path", ["/mcp", "/mcp/"])
def test_every_mcp_method_requires_authentication(secured, method, path):
    client, container, _ = secured
    response = client.request(method, path, follow_redirects=False)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == 'Bearer realm="saturn"'
    assert response.headers["cache-control"] == "no-store"
    assert [r for r in container.telemetry.list_runs() if r["tool"].startswith("saturn_")] == []


@pytest.mark.parametrize("shape", ["Basic abc", "Bearer wrong", "Bearer", "Bearer  {token}", "Bearer {token} "])
def test_invalid_headers_do_not_leak_credentials(secured, shape):
    client, _, token = secured
    value = shape.format(token=token)
    response = client.post("/mcp", headers={"Authorization": value}, json=INITIALIZE)
    assert response.status_code == 401
    assert 'error="invalid_token"' in response.headers["www-authenticate"]
    assert token not in response.text and value not in response.text


def test_query_credentials_and_duplicate_headers_are_rejected(secured):
    client, _, token = secured
    assert client.post(f"/mcp?access_token={token}", json=INITIALIZE).status_code == 401
    response = client.post("/mcp", headers=[("Authorization", f"Bearer {token}"),
                                           ("Authorization", "Bearer wrong")], json=INITIALIZE)
    assert response.status_code == 401


def test_authenticated_initialize_and_follow_up(secured):
    client, _, token = secured
    headers = {**ACCEPT, "Authorization": f"bearer {token}"}
    initialized = client.post("/mcp", headers=headers, json=INITIALIZE)
    assert initialized.status_code == 200
    assert "saturn" in initialized.text
    headers["MCP-Protocol-Version"] = "2025-11-25"
    if session_id := initialized.headers.get("mcp-session-id"):
        headers["Mcp-Session-Id"] = session_id
    listed = client.post("/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
    assert listed.status_code == 200 and "saturn_read" in listed.text
    del headers["Authorization"]
    assert client.post("/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 3, "method": "tools/list"}).status_code == 401
    assert client.delete("/mcp", headers=headers).status_code == 401


def test_no_harness_fails_closed_but_local_api_is_available(make_container):
    with TestClient(create_app(make_container()), base_url="http://127.0.0.1:9000") as client:
        assert client.post("/mcp", json=INITIALIZE).status_code == 503
        assert client.get("/api/health").status_code == 200


def test_local_dashboard_api_and_logo_remain_accessible_and_hide_secrets(secured):
    client, container, token = secured
    assert client.get("/api/health").status_code == 200
    settings = client.get("/api/settings").text
    assert token not in settings and "test-key-123456" not in settings
    assert client.get("/api/settings").json()["environment"]["api_key_configured"] is True
    response = client.get("/logo.png")
    assert response.status_code == 200 and response.headers["content-type"] == "image/png"
    assert response.content.startswith(b"\x89PNG\r\n\x1a\n")


async def test_harness_tokens_are_masked_from_command_results(make_container):
    container = make_container(runner=FakeRunner("placeholder"))
    token = add_harness(container)
    container.runner.output = f"output: {token}"
    try:
        result = await container.commands.run("pytest -q", cwd=None, goal=None)
        assert token not in result and "REDACTED" in result
    finally:
        await container.shutdown()
