"""Contracts for bounded, request-local monotonic timing."""
import asyncio
import json

import pytest

from saturn.domain.internal_timing import TimingPool, activate, bind_run, interval


def test_timing_capacity_overflow_is_incomplete_and_releases():
    # timing.entry.capacity: full capacity never refuses the original operation.
    pool = TimingPool(capacity=1)
    first, overflow = pool.begin(), pool.begin()
    assert overflow.reason == 'collector_capacity'
    assert pool.active == 1
    pool.release(first)
    pool.release(overflow)
    assert pool.active == 0
    assert pool.begin().reason is None


async def test_timing_child_tasks_have_separate_parent_stacks():
    # timing.capture: child tasks inherit immutable stacks, not sibling stacks.
    pool = TimingPool()
    profile = pool.begin()
    async def child():
        with interval('policy'):
            await asyncio.sleep(0)
            with interval('redaction'):
                await asyncio.sleep(0)
    with activate(profile):
        bind_run('run-1', 'request-1')
        await asyncio.gather(child(), child())
    body = json.loads(profile.encode())
    parents = [r for r in body['intervals'] if r['stage'] == 'policy']
    assert len(parents) == 2 and all(r['parent_id'] is None for r in parents)
    assert {r['parent_id'] for r in body['intervals'] if r['stage'] == 'redaction'} == {r['id'] for r in parents}


def test_timing_interval_and_encoded_limits_create_incomplete_markers():
    # timing.capture.drop / finish.shorten: loss is explicit and JSON stays valid.
    profile = TimingPool(interval_limit=1).begin()
    with activate(profile), interval('policy'), interval('redaction'):
        pass
    body = json.loads(profile.encode())
    assert body['incomplete'] and body['reason'] == 'interval_limit'
    assert len(body['intervals']) == 1
    body = json.loads(profile.encode(max_bytes=len(profile.encode().encode()) - 1))
    assert body['incomplete'] and body['intervals'] == []


async def test_timing_cancellation_closes_interval_without_swallowing():
    # timing.safeend: cancellation propagates and interval status records it.
    profile = TimingPool().begin()
    with pytest.raises(asyncio.CancelledError), activate(profile), interval('provider', 'backend'):
        raise asyncio.CancelledError
    assert json.loads(profile.encode())['intervals'][0]['status'] == 'cancelled'


def test_timing_duplicate_binding_is_incomplete():
    # timing.finish.export.bind: a window binds exactly one run.
    profile = TimingPool().begin()
    with activate(profile):
        bind_run('run-1', 'request-1')
        bind_run('run-2', 'request-2')
    assert profile.reason == 'correlation'


def test_timing_closed_profile_ignores_late_work():
    # timing.finish.seal: export and late child work cannot extend the window.
    profile = TimingPool().begin()
    profile.seal('ok')
    with activate(profile), interval('policy'):
        pass
    assert json.loads(profile.encode())['intervals'] == []


@pytest.mark.parametrize('failure', ['none', 'export', 'cancel'])
async def test_timing_http_window_exports_after_send_and_always_releases(tmp_path, failure):
    # timing.finish/safeend: final send precedes export; failures preserve response/cancellation.
    import time

    from saturn.infrastructure.db import Database
    from saturn.infrastructure.telemetry_repo import TelemetryRepository
    from saturn.transport.internal_timing import STATE_KEY, InternalTimingMiddleware

    db = Database(tmp_path / 'trace.db')
    repo = TelemetryRepository(db)
    run_id = repo.start_run('saturn_read', None, 'timing test')
    pool = TimingPool()
    sent = []
    async def app(scope, receive, send):
        profile = scope['state'][STATE_KEY]
        with activate(profile):
            bind_run(run_id, 'request-1')
            with interval('policy'):
                pass
        if failure == 'export':
            db.close()
        if failure == 'cancel':
            raise asyncio.CancelledError
        await send({'type': 'http.response.body', 'body': b'original', 'more_body': False})
    async def send(message):
        sent.append((message['body'], time.monotonic_ns()))
    async def receive():
        return {'type': 'http.request', 'body': b''}
    middleware = InternalTimingMiddleware(app, repo, pool)
    try:
        if failure == 'cancel':
            with pytest.raises(asyncio.CancelledError):
                await middleware({'type': 'http', 'path': '/mcp', 'method': 'POST'}, receive, send)
        else:
            await middleware({'type': 'http', 'path': '/mcp', 'method': 'POST'}, receive, send)
            assert sent[0][0] == b'original'
        assert pool.active == 0
        if failure != 'export':
            metadata = repo.get_run_trace(run_id)['payloads']
            assert len(metadata) == 1 and metadata[0]['kind'] == 'timing'
            profile = json.loads(repo.get_payload(metadata[0]['id'])['text'])
            assert profile['run_id'] == run_id
            if failure == 'none':
                assert profile['end_ns'] >= sent[0][1]
            else:
                assert profile['status'] == 'cancelled'
    finally:
        if failure != 'export':
            db.close()


async def test_timing_absent_context_is_noop_and_records_no_payload(make_container, root):
    # timing.entry.off: in-process calls retain responses without creating HTTP profiles.
    from mcp import Client

    from saturn.transport.mcp_server import build_mcp

    container = make_container()
    async with Client(build_mcp(container)) as client:
        result = await client.call_tool('saturn_read', {'path': 'pkg/calc.py', 'workspace_root': str(root)})
    assert not result.is_error
    run = container.telemetry.list_runs()[0]
    assert all(p['kind'] != 'timing' for p in container.telemetry.get_run_trace(run['id'])['payloads'])


@pytest.mark.parametrize('enabled', [None, False, True])
def test_timing_http_rejection_obeys_startup_flag_and_captures_authentication(make_container, enabled, monkeypatch):
    # timing.entry.enabled: request headers cannot enable profiling; refusals retain their HTTP result.
    from conftest import add_harness
    from fastapi.testclient import TestClient

    from saturn.bootstrap.app import create_app

    monkeypatch.delenv('SATURN_INTERNAL_TIMING', raising=False)
    container = make_container(**({} if enabled is None else {'internal_timing': enabled}))
    add_harness(container)
    with TestClient(create_app(container), base_url='http://127.0.0.1:9000') as client:
        reply = client.post('/mcp', json={}, headers={'Authorization': 'Bearer invalid', 'SATURN_INTERNAL_TIMING': 'true'})
        assert reply.status_code == 401
        run = container.telemetry.list_runs()[0]
        profiles = [p for p in container.telemetry.get_run_trace(run['id'])['payloads'] if p['kind'] == 'timing']
        assert len(profiles) == int(bool(enabled))
        if enabled:
            profile = json.loads(container.telemetry.get_payload(profiles[0]['id'])['text'])
            assert any(row['stage'] == 'authenticate' for row in profile['intervals'])
            assert 'invalid' not in container.telemetry.get_payload(profiles[0]['id'])['text']


def test_timing_default_capacity_admits_only_64_full_collectors():
    # timing.entry.capacity: the production default bounds full collectors, not requests.
    pool = TimingPool()
    profiles = [pool.begin() for _ in range(65)]
    assert pool.active == 64
    assert sum(p.reason is None for p in profiles) == 64
    assert profiles[-1].reason == 'collector_capacity'
    for profile in profiles:
        pool.release(profile)
    assert pool.active == 0


def test_timing_default_interval_limit_retains_4096_and_marks_loss():
    # timing.capture.bounded: the production default caps retained intervals and encoded bytes.
    profile = TimingPool().begin()
    with activate(profile):
        for _ in range(4097):
            with interval('policy'):
                pass
    profile.seal('ok')
    text = profile.encode()
    body = json.loads(text)
    assert len(body['intervals']) == 4096
    assert body['incomplete'] and body['reason'] == 'interval_limit'
    assert len(text.encode()) <= 2_000_000
