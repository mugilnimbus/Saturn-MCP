import time
from types import SimpleNamespace

import pytest
from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel
from typing_extensions import TypedDict

from saturn.application.recorder import Recorder
from saturn.domain.errors import ModelOutputInvalid, NotFound
from saturn.domain.models import LlmCallRecord, RunOutcome
from saturn.infrastructure.artifact_repo import ArtifactRepository
from saturn.infrastructure.config import Settings
from saturn.infrastructure.db import Database
from saturn.infrastructure.llm import ResponsesGateway
from saturn.infrastructure.metrics_queries import MetricsQueries, bucket_size, percentile
from saturn.infrastructure.telemetry_repo import TelemetryRepository
from saturn.infrastructure.tracing import TelemetryCallbackHandler


def test_cached_artifact_cannot_survive_metadata_expiry(make_container):
    from saturn.domain.errors import NotFound
    c = make_container()
    meta = c.artifacts.put('run', 'test', 'title', 'stored evidence')
    assert c.artifacts.get_lines(meta.id) == ['stored evidence']
    c.db.execute('UPDATE artifacts SET expires_at=0 WHERE id=?', (meta.id,))
    with pytest.raises(NotFound):
        c.artifacts.get_lines(meta.id)


def test_regex_worker_times_out_and_can_match_again():
    from saturn.domain.errors import InvalidInput
    from saturn.domain.text_ops import compile_pattern
    from saturn.infrastructure.regex_matcher import ProcessLineMatcher
    matcher = ProcessLineMatcher(timeout_s=0.2)
    try:
        with pytest.raises(InvalidInput, match='deadline'):
            matcher.match(['a' * 32 + '!'], compile_pattern('(a+)+$'))
        matches, total = matcher.match(['match one', 'plain'], compile_pattern(r'match\s+one'))
        assert total == 1 and matches[0].line == 1
    finally:
        matcher.close()


@pytest.mark.parametrize('value', ['http://example.com/v1', 'https://192.0.2.1/v1'])
def test_provider_configuration_remains_local(value):
    from saturn.application.tunables import Tunables
    from saturn.domain.errors import InvalidInput

    with pytest.raises(InvalidInput, match='local-only'):
        Tunables().update({'base_url': value})


def test_service_cannot_bind_to_all_network_interfaces():
    with pytest.raises(ValueError, match='local-only'):
        Settings(_env_file=None, host='0.0.0.0')


def test_artifact_truncation_marker_fits_inside_the_byte_limit():
    repository = ArtifactRepository(Database(':memory:'), ttl_hours=1, max_bytes=50, max_total_bytes=1000)
    meta = repository.put('run', 'test', 'title', 'abc' * 100)
    text = repository.get_text(meta.id)
    assert len(text.encode()) <= 50 and 'artifact cut' in text


def test_migrations_are_idempotent(tmp_path):
    path = tmp_path / "s.db"
    Database(path).close()
    db = Database(path)  # second open must not re-run or fail
    assert db.query_one("PRAGMA user_version")[0] >= 1
    db.close()


def test_run_lifecycle_and_filters():
    db = Database(":memory:")
    repo = TelemetryRepository(db)
    a = repo.start_run("saturn_run", "claude 1", "pytest")
    b = repo.start_run("saturn_read", None, "file.py")
    repo.finish_run(a, RunOutcome(route="digest", raw_tokens=9000, returned_tokens=300, exit_code=1))
    repo.finish_run(b, RunOutcome(status="error", route="error", error="not_found: x"))
    assert [r["id"] for r in repo.list_runs(tool="saturn_run")] == [a]
    assert [r["id"] for r in repo.list_runs(status="error")] == [b]
    assert [r["id"] for r in repo.list_runs(query="pytest")] == [a]
    assert repo.list_runs(before_seq=repo.list_runs()[0]["seq"])[0]["id"] == a
    with pytest.raises(NotFound):
        repo.get_run_trace("nope")


def test_orphaned_runs_are_failed_on_startup():
    db = Database(":memory:")
    repo = TelemetryRepository(db)
    run = repo.start_run("saturn_run", None, "x")
    assert repo.mark_orphans_failed() == 1
    assert repo.get_run_trace(run)["run"]["status"] == "error"


def test_llm_calls_roll_up_into_the_run():
    repo = TelemetryRepository(Database(":memory:"))
    run = repo.start_run("saturn_ask", None, "q")
    for tokens in (100, 250):
        repo.record_llm_call(LlmCallRecord(id=f"c{tokens}", run_id=run, span_id=None, model="m", endpoint="responses",
                                           started_at=time.time(), ended_at=time.time(), input_tokens=tokens,
                                           output_tokens=10, reasoning_tokens=2, cached_tokens=50))
    row = repo.get_run_trace(run)["run"]
    assert (row["llm_calls"], row["llm_in"], row["llm_out"], row["llm_reasoning"], row["llm_cached"]) == (2, 350, 20, 4, 100)


def test_overview_buckets_sum_to_totals_and_percentiles_are_sane():
    db = Database(":memory:")
    repo, metrics = TelemetryRepository(db), MetricsQueries(db)
    for i in range(30):
        run = repo.start_run("saturn_run" if i % 2 else "saturn_read", None, "x")
        repo.finish_run(run, RunOutcome(status="error" if i == 3 else "ok", route="digest", raw_tokens=1000, returned_tokens=100))
    data = metrics.overview(3600)
    assert data["totals"]["runs"] == 30 and data["totals"]["errors"] == 1
    assert data["totals"]["saved_tokens"] == 27_000 and round(data["totals"]["reduction"], 2) == 0.9
    assert sum(b["runs"] for b in data["series"]) == 30
    assert sum(t["runs"] for t in data["by_tool"]) == 30
    assert bucket_size(3600) == 60 and bucket_size(7 * 86400) == 7200
    assert percentile([1, 2, 3, 4, 100], 0.95) == 100 and percentile([], 0.5) is None


def test_empty_window_has_no_division_by_zero():
    data = MetricsQueries(Database(":memory:")).overview(900)
    assert data["totals"]["reduction"] is None and data["totals"]["p95_s"] is None


def test_artifacts_expire_and_evict_oldest_first():
    db = Database(":memory:")
    repo = ArtifactRepository(db, ttl_hours=1, max_bytes=10_000, max_total_bytes=3_000)
    old = repo.put("r", "command", "old", "a" * 1500)
    time.sleep(0.01)
    mid = repo.put("r", "command", "mid", "b" * 1500)
    new = repo.put("r", "command", "new", "c" * 1500)  # over budget: the oldest goes
    with pytest.raises(NotFound):
        repo.get_meta(old.id)
    assert repo.get_meta(mid.id) and repo.get_meta(new.id)
    db.execute("UPDATE artifacts SET expires_at = 0 WHERE id = ?", (mid.id,))
    with pytest.raises(NotFound):
        repo.get_text(mid.id)


def test_artifact_size_cap_truncates_visibly():
    repo = ArtifactRepository(Database(":memory:"), ttl_hours=1, max_bytes=1000, max_total_bytes=10**6)
    meta = repo.put("r", "command", "big", "x" * 5000)
    assert meta.bytes < 1100 and "cut at the size limit" in repo.get_text(meta.id)


# ---- tracing ---------------------------------------------------------------------------------


class _State(TypedDict, total=False):
    value: int


async def test_callback_handler_records_node_spans_and_exact_token_usage():
    db = Database(":memory:")
    repo = TelemetryRepository(db)
    handler = TelemetryCallbackHandler(repo, secrets=("topsecret-value",), preview_chars=200)
    run_id = repo.start_run("saturn_ask", None, "q")
    reply = AIMessage(content="", tool_calls=[{"name": "Finish", "args": {"answer": "topsecret-value"}, "id": "1"}],
                      usage_metadata={"input_tokens": 120, "output_tokens": 15, "total_tokens": 135,
                                      "input_token_details": {"cache_read": 100}, "output_token_details": {"reasoning": 4}})
    model = FakeMessagesListChatModel(responses=[reply])

    async def node(state: _State) -> _State:
        await model.ainvoke("hello topsecret-value", config={})
        return {"value": 1}

    graph = StateGraph(_State)
    graph.add_node("work", node)
    graph.add_edge(START, "work")
    graph.add_edge("work", END)
    await graph.compile().ainvoke({}, config={"callbacks": [handler], "metadata": {"saturn_run_id": run_id, "saturn_purpose": "t"}})

    trace = repo.get_run_trace(run_id)
    assert [(s["kind"], s["name"], s["status"]) for s in trace["spans"]] == [("graph_node", "work", "ok")]
    (call,) = trace["llm_calls"]
    assert (call["input_tokens"], call["output_tokens"], call["reasoning_tokens"], call["cached_tokens"]) == (120, 15, 4, 100)
    assert call["span_id"] == trace["spans"][0]["id"] and call["purpose"] == "t"
    assert "topsecret-value" not in call["prompt_preview"] + call["output_preview"]


async def test_handler_ignores_untracked_calls():
    repo = TelemetryRepository(Database(":memory:"))
    handler = TelemetryCallbackHandler(repo, secrets=(), preview_chars=100)
    model = FakeMessagesListChatModel(responses=[AIMessage(content="x")])
    await model.ainvoke("hi", config={"callbacks": [handler]})  # no saturn_run_id: nothing recorded, nothing raised
    assert repo.list_runs() == []


def test_recorder_nests_spans_and_marks_errors():
    repo = TelemetryRepository(Database(":memory:"))
    rec = Recorder(repo)
    import asyncio

    async def go():
        with pytest.raises(ValueError):
            async with rec.run("saturn_run", summary="x"):
                with rec.span("outer", "step"), rec.span("inner", "step"):
                    raise ValueError("boom")

    asyncio.run(go())
    run = repo.list_runs()[0]
    trace = repo.get_run_trace(run["id"])
    outer, inner = trace["spans"]
    assert inner["parent_id"] == outer["id"] and inner["status"] == "error" and run["status"] == "error"


# ---- model gateway ----------------------------------------------------------------------------


class Answer(BaseModel):
    value: int


class _Bound:
    def __init__(self, replies):
        self.replies, self.seen = list(replies), []

    def bind_tools(self, *_a, **_k):
        return self

    async def ainvoke(self, messages, config=None):
        self.seen.append(messages[-1].content)
        return self.replies.pop(0)


def _gateway(bound):
    settings = Settings(_env_file=None, local_server_api_key="k")  # type: ignore[call-arg]
    tunables = SimpleNamespace(model="m", reasoning_effort="none")
    gw = ResponsesGateway(settings, tunables, handler=None)  # type: ignore[arg-type]
    gw._client = lambda _n: bound  # type: ignore[method-assign]
    return gw


async def test_gateway_retries_once_with_feedback_then_succeeds():
    bound = _Bound([AIMessage(content="no tool"), AIMessage(content="", tool_calls=[{"name": "Answer", "args": {"value": 7}, "id": "1"}])])
    result = await _gateway(bound).call([Answer], system="s", user="u", purpose="t")
    assert result.value == 7 and "rejected" in bound.seen[1]


async def test_gateway_gives_up_after_two_invalid_replies():
    bad = AIMessage(content="", tool_calls=[{"name": "Answer", "args": {"value": "x"}, "id": "1"}])
    with pytest.raises(ModelOutputInvalid):
        await _gateway(_Bound([bad, bad])).call([Answer], system="s", user="u", purpose="t")


def test_commands_run_without_installing_or_fetching(monkeypatch):
    from saturn.infrastructure.command_runner import scrubbed_env

    monkeypatch.setenv("MY_API_TOKEN", "x")
    env = scrubbed_env()
    assert env["UV_NO_SYNC"] == "1" and env["CARGO_NET_OFFLINE"] == "true" and env["GOPROXY"] == "off"
    assert "MY_API_TOKEN" not in env


def test_an_older_store_is_refused_with_a_message(tmp_path):
    import sqlite3

    from saturn.infrastructure.db import StoreVersionError

    path = tmp_path / "old.db"
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA user_version=2")
    connection.close()
    with pytest.raises(StoreVersionError, match="incompatible"):
        Database(path)
