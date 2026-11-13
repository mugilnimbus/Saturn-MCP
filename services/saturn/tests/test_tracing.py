"""Full request traceability: origin, arguments, the path of steps, model prompts and replies, the reply, refusals."""

import json
import time

import pytest
from conftest import FakeGateway, FakeRunner, add_harness
from fastapi.testclient import TestClient
from mcp import Client

from saturn.application.graphs.digest_graph import ReportFacts
from saturn.bootstrap.app import create_app
from saturn.domain.errors import NotFound
from saturn.infrastructure.db import Database
from saturn.infrastructure.telemetry_repo import PAYLOAD_MAX_BYTES, TelemetryRepository
from saturn.transport.mcp_server import build_mcp

NOISY = "\n".join(f"line {i} ok" for i in range(900)) + "\nERROR something broke\n"


def payloads(container, run_id):
    trace = container.telemetry.get_run_trace(run_id)
    return trace, {(p["kind"], p["owner_id"]): container.telemetry.get_payload(p["id"])["text"] for p in trace["payloads"]}


async def test_a_tool_call_keeps_its_request_path_and_exact_reply(make_container, root):
    container = make_container(runner=FakeRunner("2 passed\n"))
    async with Client(build_mcp(container)) as client:
        reply = await client.call_tool("saturn_run", {"command": "pytest -q", "workspace_root": str(root)})
    text = reply.content[0].text
    run = container.telemetry.list_runs()[0]
    assert run["transport"] == "in-process" and run["request_id"]
    trace, bodies = payloads(container, run["id"])
    request = json.loads(bodies[("request", None)])
    assert request == {"tool": "saturn_run", "arguments": {"command": "pytest -q", "cwd": None, "goal": None,
                                                           "workspace_root": str(root)}}
    assert bodies[("response", None)] == text
    names = [s["name"] for s in trace["spans"]]
    assert names[:2] == ["authenticate", "workspace"] and "policy" in names and "command" in names
    assert trace["spans"][1]["attrs"]["folder"] == str(root.resolve())


async def test_a_refusal_keeps_the_error_the_agent_saw(make_container, root):
    container = make_container()
    async with Client(build_mcp(container)) as client:
        reply = await client.call_tool("saturn_run", {"command": "npm run deploy", "workspace_root": str(root)})
    assert reply.is_error
    run = container.telemetry.list_runs()[0]
    _, bodies = payloads(container, run["id"])
    assert "policy_violation" in bodies[("response", None)] and run["decision"] == "refused"


async def test_a_workspace_refusal_is_a_rejected_run(make_container, tmp_path):
    container = make_container()
    elsewhere = tmp_path / "elsewhere"
    elsewhere.mkdir()
    async with Client(build_mcp(container)) as client:
        reply = await client.call_tool("saturn_read", {"path": "x", "workspace_root": str(elsewhere)})
    assert reply.is_error
    run = container.telemetry.list_runs()[0]
    assert run["route"] == "rejected" and run["status"] == "error" and "not inside the folders" in run["error"]
    trace, bodies = payloads(container, run["id"])
    assert [s["name"] for s in trace["spans"]] == ["authenticate"]
    assert json.loads(bodies[("request", None)])["arguments"]["workspace_root"] == str(elsewhere)


async def test_model_calls_keep_the_complete_prompt_and_reply(make_container, root):
    """The real tracing callback stores full bodies; a scripted model stands in for the server."""
    from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
    from langchain_core.messages import AIMessage

    from saturn.application.recorder import Caller
    from saturn.infrastructure.tracing import TelemetryCallbackHandler

    container = make_container()
    handler = TelemetryCallbackHandler(container.telemetry, secrets=(), preview_chars=40)
    model = FakeMessagesListChatModel(responses=[AIMessage(content="", tool_calls=[{"name": "ReportFacts", "args": {"facts": []},
                                                                                    "id": "c1"}])])
    long_prompt = "explain " + "x" * 500
    async with container.recorder.run("saturn_ask", caller=Caller(client="test"), summary="q") as run:
        await model.ainvoke(long_prompt, config={"callbacks": [handler], "metadata": {"saturn_run_id": run.run_id,
                                                                                      "saturn_purpose": "test"}})
    trace, bodies = payloads(container, run.run_id)
    call = trace["llm_calls"][0]
    assert len(call["prompt_preview"]) == 40
    assert long_prompt in bodies[("llm_prompt", call["id"])]
    assert json.loads(bodies[("llm_output", call["id"])])["tool_calls"][0]["name"] == "ReportFacts"
    assert ReportFacts  # the tool shape used by digests


def test_bodies_expire_are_capped_and_masked_by_the_recorder(make_container):
    repo = TelemetryRepository(Database(":memory:"), payload_ttl_hours=1)
    run_id = repo.start_run("saturn_run", None, "x")
    big = repo.put_payload(run_id, "response", "y" * (PAYLOAD_MAX_BYTES + 10))
    assert repo.get_payload(big)["truncated"] and len(repo.get_payload(big)["text"]) == PAYLOAD_MAX_BYTES
    old = repo.put_payload(run_id, "request", "{}")
    repo._db.execute("UPDATE payloads SET expires_at=? WHERE id=?", (time.time() - 1, old))
    with pytest.raises(NotFound, match="48 hours"):
        repo.get_payload(old)
    assert repo.evict_payloads() == 1 and [p["id"] for p in repo.get_run_trace(run_id)["payloads"]] == [big]
    with pytest.raises(ValueError):
        repo.put_payload(run_id, "other", "x")


async def test_secrets_in_arguments_and_replies_are_masked(make_container, root):
    container = make_container(runner=FakeRunner("token=supersecretvalue123\n"))
    async with Client(build_mcp(container)) as client:
        await client.call_tool("saturn_run", {"command": "pytest -q", "goal": "api_key=abcdef1234567890", "workspace_root": str(root)})
    _, bodies = payloads(container, container.telemetry.list_runs()[0]["id"])
    assert "abcdef1234567890" not in bodies[("request", None)] and "supersecretvalue123" not in bodies[("response", None)]


def test_requests_without_a_valid_token_are_recorded_but_stream_housekeeping_is_not(make_container):
    container = make_container()
    add_harness(container)
    with TestClient(create_app(container), base_url="http://127.0.0.1:9000") as client:
        assert client.post("/mcp", json={}, headers={"Authorization": "Bearer wrong", "X-Saturn-Transport": "stdio"}).status_code == 401
        assert client.get("/mcp").status_code == 401
        runs = container.telemetry.list_runs()
        assert len([r for r in runs if r["tool"] == "mcp_request"]) == 1
        refused = runs[0]
        assert refused["route"] == "rejected" and refused["transport"] == "stdio" and "wrong" in refused["error"]
        assert "unauthenticated client at" in refused["client"]
        assert client.get(f"/api/runs/{refused['id']}").json()["payloads"][0]["kind"] == "response"


def test_the_trace_api_serves_payload_previews_and_full_bodies(make_container, root):
    container = make_container(runner=FakeRunner(NOISY, exit_code=1), gateway=FakeGateway())
    with TestClient(create_app(container), base_url="http://127.0.0.1:9000") as client:
        run_id = container.telemetry.start_run("saturn_run", None, "x")
        payload_id = container.telemetry.put_payload(run_id, "response", "z" * 1000)
        trace = client.get(f"/api/runs/{run_id}").json()
        assert trace["payloads"][0]["complete"] is False and len(trace["payloads"][0]["preview"]) == 300
        assert client.get(f"/api/payloads/{payload_id}").json()["text"] == "z" * 1000
        assert client.get("/api/payloads/pl_missing").status_code == 404
