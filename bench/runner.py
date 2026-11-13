"""Run the shared-corpus execution contract through public Saturn interfaces."""
from __future__ import annotations

import asyncio
import contextlib
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from collections.abc import Iterator
from contextlib import AsyncExitStack, contextmanager
from pathlib import Path
from typing import Any

import httpx2
from dotenv import dotenv_values, set_key
from mcp import Client
from mcp.client.streamable_http import streamable_http_client

from bench.corpus import materialize
from bench.execution import (
    MODELS,
    analyze_profile,
    build_internal_plan,
    build_plan,
    compare_baseline,
    grade,
    summarize,
    summarize_internal,
)

ROOT = Path(__file__).resolve().parents[1]


def memory_bytes() -> int | None:
    if sys.platform != 'linux':
        return None
    return int(os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES'))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def api(base: str, path: str, *, method: str = 'GET', body: Any = None, timeout: float = 30) -> Any:
    request = urllib.request.Request(base + path, method=method,
                                    data=json.dumps(body).encode() if body is not None else None,
                                    headers={'Content-Type': 'application/json', 'X-Client': 'web'})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.load(response)


def lms_json(*args: str, strict: bool = False) -> list[dict[str, Any]]:
    if not shutil.which('lms'):
        if strict:
            raise RuntimeError('LM Studio CLI unavailable')
        return []
    result = subprocess.run(['lms', *args, '--json'], capture_output=True, text=True, check=False, timeout=30)
    if strict and result.returncode:
        raise RuntimeError('LM Studio inventory failed; model ownership is unknown')
    value = json.loads(result.stdout) if result.returncode == 0 else []
    if not isinstance(value, list):
        raise ValueError('LM Studio inventory must be a list')
    return value


def prepare_model(model: str, log_path: Path) -> None:
    """Load a benchmark-owned GGUF model; a failed load cannot become a JIT measurement."""
    with log_path.open('w') as log:
        result = subprocess.run(['lms', 'load', model, '--context-length', '32768', '--parallel', '1', '--gpu', 'max', '--yes'],
                                stdout=log, stderr=subprocess.STDOUT, timeout=180, check=False)
    if result.returncode:
        raise RuntimeError(f'Model preparation failed with exit code {result.returncode}; see the private load log.')


def switch_model(model: str, original_ids: set[str], log_path: Path) -> None:
    """Release only benchmark-owned workers before loading the next worker."""
    loaded = lms_json('ps')
    for entry in loaded:
        identifier = entry.get('identifier', '')
        if identifier in MODELS and identifier != model and identifier not in original_ids:
            result = subprocess.run(['lms', 'unload', identifier], capture_output=True, timeout=30, check=False)
            if result.returncode:
                raise RuntimeError('Could not release the previous benchmark-owned model.')
    if model not in {entry.get('identifier') for entry in loaded}:
        prepare_model(model, log_path)


def _process_sample(pid: int, *, include_children: bool = True) -> dict[str, Any]:
    """Linux public OS counters. Other systems report unavailable, never zero."""
    if sys.platform != 'linux':
        return {'available': False}
    table = {}
    for entry in Path('/proc').iterdir():
        if not entry.name.isdigit():
            continue
        try:
            fields = (entry / 'stat').read_text().rsplit(')', 1)[1].split()
            table[int(entry.name)] = (int(fields[1]), int(fields[11]) + int(fields[12]), int(fields[21]))
        except (OSError, ValueError, IndexError):
            continue
    selected = {pid}
    previous = 0
    while include_children and len(selected) != previous:
        previous = len(selected)
        selected.update(p for p, (parent, _, _) in table.items() if parent in selected)
    ticks = os.sysconf('SC_CLK_TCK')
    page = os.sysconf('SC_PAGE_SIZE')
    return dict(available=True, processes={str(p): table[p][1] / ticks for p in selected if p in table},
                rss_bytes=sum(table[p][2] * page for p in selected if p in table),
                load_average=list(os.getloadavg()))


@contextmanager
def service(run_dir: Path, workspace: Path, model_env: Path, index: int, *, timing: bool = False) -> Iterator[tuple[str, int]]:
    home = run_dir / f'home-{index}'
    home.mkdir(mode=0o700)
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    env = {k: v for k, v in os.environ.items() if not k.startswith(('SATURN_', 'LOCAL_SERVER_'))}
    env.update(SATURN_HOME=str(home), SATURN_LLM_TIMEOUT_S='85', SATURN_LLM_CONCURRENCY='1',
               CLAUDE_CONFIG_DIR=str(home / 'claude'), CODEX_HOME=str(home / 'codex'),
               SATURN_INTERNAL_TIMING=str(timing).lower())
    # Read only the requested credential; never serialize the source environment or its other keys.
    key = dotenv_values(model_env).get('LOCAL_SERVER_API_KEY') if model_env.is_file() else ''
    secret_path = home / '.env'
    secret_path.touch(mode=0o600)
    set_key(secret_path, 'LOCAL_SERVER_API_KEY', key or '')
    policy = ('preset = "standard"\n[folders]\nallowed = ' + json.dumps([str(workspace)])
              + '\n[commands]\nallow = ["python _replay.py *"]\ndeny = []\n[hooks]\nscope = "off"\n')
    (home / 'policy.toml').write_text(policy, encoding='utf-8')
    base = f'http://127.0.0.1:{port}'
    with (run_dir / f'service-{index}.log').open('w', encoding='utf-8') as log:
        child = subprocess.Popen([sys.executable, '-m', 'saturn.bootstrap.cli', 'serve', '--host', '127.0.0.1',
                                  '--port', str(port)], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
        try:
            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                try:
                    if api(base, '/api/health')['status'] == 'ok':
                        break
                except (OSError, ValueError):
                    if child.poll() is not None:
                        raise RuntimeError('Owned benchmark service stopped during startup; see its private runtime log.') from None
                    time.sleep(.1)
            else:
                raise TimeoutError('Owned service did not become healthy within 30 seconds.')
            yield base, child.pid
        finally:
            child.terminate()
            try:
                child.wait(timeout=15)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait(timeout=5)


class Session:
    """One temporary harness with one outstanding request and exact trace correlation."""

    def __init__(self, base: str, workspace: Path, client: Any, harness: str) -> None:
        self.base, self.workspace, self.client, self.harness = base, workspace, client, harness
        self.internal_timing: bool | None = None

    async def call(self, tool: str, arguments: dict[str, Any], *, cancel: bool = False) -> dict[str, Any]:
        arguments = {**arguments, 'workspace_root': str(self.workspace)}
        route = '/api/runs?harness=' + urllib.parse.quote(self.harness) + '&limit=1'
        prior = await asyncio.to_thread(api, self.base, route)
        before = {r['id'] for r in prior['runs']}
        submitted = time.monotonic()
        wall_submitted = time.time()
        outcome, reply, error, cancellation = 'completed', '', False, None
        task = asyncio.create_task(self.client.call_tool(tool, arguments, read_timeout_seconds=90))
        try:
            if cancel:
                done, _ = await asyncio.wait({task}, timeout=.1)
                if not done:
                    requested = time.monotonic()
                    task.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await asyncio.wait_for(task, timeout=5)
                    outcome = 'cancelled'
                    cancellation = dict(requested_at=requested, client_task_cancelled=True,
                                        server_acknowledgement=None, late_completion=None)
                else:
                    cancellation = dict(early_completion=True, server_acknowledgement=None)
            if outcome != 'cancelled':
                result = await asyncio.wait_for(task, timeout=90)
                reply = ''.join(getattr(c, 'text', '') for c in result.content)
                error = bool(result.is_error)
        except TimeoutError:
            outcome, error = 'timeout', True
        except Exception as exc:  # noqa: BLE001 - transport exceptions are retained observations.
            outcome, error, reply = 'error', True, type(exc).__name__
        completed = time.monotonic()
        collection_cpu = time.process_time()
        run: dict[str, Any] = {}
        trace: dict[str, Any] = {}
        profile: dict[str, Any] | None = None
        diagnostic_deadline = completed + 5
        async def diagnostic(path: str) -> Any:
            if self.internal_timing is None:
                return await asyncio.to_thread(api, self.base, path)
            remaining = diagnostic_deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError('Timing collection deadline')
            return await asyncio.to_thread(api, self.base, path, timeout=remaining)
        try:
            runs = await diagnostic(route)
            matches = [r for r in runs['runs'] if r['id'] not in before and r['tool'] == tool]
            run = matches[0] if len(matches) == 1 else {}
            trace = await diagnostic('/api/runs/' + run['id']) if run else {}
            if self.internal_timing is not None and run:
                while True:
                    timing = [p for p in trace.get('payloads', []) if p['kind'] == 'timing']
                    if timing:
                        if len(timing) == 1:
                            payload = await diagnostic('/api/payloads/' + timing[0]['id'])
                            profile = json.loads(payload['text'])
                        break
                    if not self.internal_timing or time.monotonic() >= diagnostic_deadline:
                        break
                    await asyncio.sleep(min(.02, max(0, diagnostic_deadline - time.monotonic())))
                    trace = await diagnostic('/api/runs/' + run['id'])
        except (OSError, ValueError, TimeoutError):
            pass  # Retain the tool response; absent diagnostics are explicit below.
        analysis = analyze_profile(profile, run.get('id', ''), run.get('request_id'))
        if self.internal_timing is False:
            analysis = dict(valid=False, reason='unexpected_profile' if profile else 'disabled_expected')
        if cancellation is not None:
            cancellation['late_completion'] = run.get('status') if run else None
        return dict(tool=tool, arguments=arguments, text=reply, is_error=error, outcome=outcome,
                    submitted_at=submitted, completed_at=completed, wall_submitted_at=wall_submitted,
                    latency_s=completed - submitted, estimated_tokens=max(1, round(len(reply) / 3.6)),
                    response_bytes=len(reply.encode()), run=run, trace=trace, cancellation=cancellation,
                    internal_queue_wait_s=None, timing_profile=profile, timing_analysis=analysis,
                    collection_s=time.monotonic() - completed,
                    collection_observer_cpu_s=time.process_time() - collection_cpu)


async def connect_sessions(stack: AsyncExitStack, base: str, workspace: Path) -> tuple[list[Session], list[str]]:
    sessions, harnesses = [], []
    for number in range(4):
        connection = await asyncio.to_thread(api, base, '/api/connections', method='POST',
                                             body=dict(name=f'Benchmark {number}', tools=['saturn_run', 'saturn_read',
                                                       'saturn_search', 'saturn_ask', 'saturn_query'],
                                                       folders=[str(workspace)], hooks=False))
        harness = connection['harness']['id']
        harnesses.append(harness)
        # Register cleanup before opening the transport so failed connection setup also revokes access.
        async def revoke(harness_id: str = harness) -> None:
            await asyncio.to_thread(api, base, '/api/connections/' + harness_id, method='DELETE')
        stack.push_async_callback(revoke)
        http = await stack.enter_async_context(httpx2.AsyncClient(
            headers={'Authorization': 'Bearer ' + connection['token'], 'X-Saturn-Client': f'benchmark-{number}'},
            timeout=httpx2.Timeout(30, read=100)))
        client = await stack.enter_async_context(Client(streamable_http_client(base + '/mcp', http_client=http)))
        await client.list_tools()  # Avoid schema discovery inside the measured call.
        sessions.append(Session(base, workspace, client, harness))
    return sessions, harnesses


def request_args(request: dict[str, Any]) -> dict[str, Any]:
    if request.get('mode') == 'capture_replay':
        args = {'command': 'python _replay.py ' + request['capture_id']}
        if request.get('goal'):
            args['goal'] = request['goal']
        return args
    return {k: v for k, v in request.items() if k != 'save_artifact'}


async def workflow(session: Session, case: dict[str, Any], phase: dict[str, Any],
                   captures: dict[str, Any], reference_bytes: int, scheduled: float) -> dict[str, Any]:
    started = time.monotonic()
    calls: list[dict[str, Any]] = []
    outcome = 'completed'
    try:
        async with asyncio.timeout(180):
            producer = case['workflow']['producer']
            arguments = request_args(case['request'])
            if producer:
                calls.append(await session.call('saturn_run', request_args(producer)))
                match = re.search(r'art_[0-9a-f]+', calls[-1]['text'])
                if not match:
                    raise ValueError('Producer did not return an artifact identity.')
                arguments['artifact_id'] = match[0]
            calls.append(await session.call(case['primary_tool'], arguments, cancel=phase['kind'] == 'cancel'))
            for follow_up in case['workflow']['follow_ups']:
                calls.append(await session.call(follow_up['tool'], follow_up['arguments']))
            outcomes = [c['outcome'] for c in calls]
            outcome = next((v for v in ('timeout', 'error', 'cancelled') if v in outcomes), 'completed')
    except TimeoutError:
        outcome = 'timeout'
    except ValueError:
        outcome = 'error'
    result = dict(phase=phase['id'], kind=phase['kind'], model=phase['model'], case_id=case['id'],
                  tool=case['primary_tool'], family=case['family'], clean_start=phase['clean_start'],
                  harness_id=session.harness, scheduled_at=scheduled, started_at=started,
                  completed_at=time.monotonic(), wall_s=time.monotonic() - started,
                  observer_dispatch_wait_s=started - scheduled, outcome=outcome, calls=calls,
                  input_reference_bytes=reference_bytes, response_bytes=sum(c['response_bytes'] for c in calls),
                  grade=grade(case, calls))
    if phase['kind'] == 'cancel':
        # An ordinary exact-range case from the same family checks the surviving session.
        result['recovery'] = await session.call('saturn_read', dict(path='sources/' + case['family'] + '/'
                                                                  + ('middleware/timeout.go' if case['family'] == 'chi'
                                                                     else 'index.js' if case['family'] == 'p-limit'
                                                                     else 'GUIDE.md' if case['family'] == 'ripgrep'
                                                                     else 'src/requests/models.py'), start=1, end=2))
    return result


def input_size(case: dict[str, Any], dataset: Path, captures: dict[str, Any]) -> int:
    descriptor = case['workflow']['producer'] or case['request']
    if descriptor.get('capture_id'):
        return int((dataset / captures[descriptor['capture_id']]['asset']).stat().st_size)
    request = case['request']
    paths = request.get('paths', [request.get('path', '')])
    size = 0
    for relative in paths:
        path = (dataset / relative).resolve()
        if not path.is_relative_to(dataset.resolve()):
            continue
        if path.is_file():
            if 'start' in request:
                lines = path.read_bytes().splitlines(keepends=True)
                size += len(b''.join(lines[request['start'] - 1:request.get('end')]))
            else:
                size += path.stat().st_size
        elif path.is_dir():
            size += sum(p.stat().st_size for p in path.rglob('*') if p.is_file())
    return size


async def run_phase(phase: dict[str, Any], sessions: list[Session], cases: dict[str, Any], captures: dict[str, Any],
                    dataset: Path, deadline: float, output: Path, pid: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    start = time.monotonic()
    observer_cpu = time.process_time()
    resource_samples: list[dict[str, Any]] = []
    stop = asyncio.Event()

    async def sample() -> None:
        while not stop.is_set():
            resource_samples.append(await asyncio.to_thread(_process_sample, pid, include_children='condition' not in phase))
            with contextlib.suppress(TimeoutError):
                await asyncio.wait_for(stop.wait(), .1)

    sampler = asyncio.create_task(sample())
    rows: list[dict[str, Any]] = []
    assignments: dict[int, list[str]] = defaultdict(list)
    rotation = int(phase['id'].rsplit('-', 1)[1])
    for i, case_id in enumerate(phase['case_ids']):
        lane = (1 if (i + rotation + i // 4) % 4 == 3 else 0) if phase['kind'] == 'busy-quiet' else (i + rotation) % phase['concurrency']
        assignments[lane].append(case_id)

    async def one(session: Session, case_id: str, scheduled: float) -> dict[str, Any]:
        if time.monotonic() >= deadline:
            return dict(phase=phase['id'], kind=phase['kind'], model=phase['model'], case_id=case_id,
                        family=cases[case_id]['family'], tool=cases[case_id]['primary_tool'], outcome='unexecuted',
                        wall_s=0, response_bytes=0, input_reference_bytes=0, calls=[], grade={})
        row = await workflow(session, cases[case_id], phase, captures,
                             input_size(cases[case_id], dataset, captures), scheduled)
        if 'condition' in phase:
            row.update(condition=phase['condition'], measured=phase['measured'], timing=phase['timing'], repeat=phase['repeat'])
            row['contamination'] = 'uncontrolled_interactive_desktop; verification jobs excluded'
        with (output / 'observations.jsonl').open('a', encoding='utf-8') as file:
            file.write(json.dumps(row, ensure_ascii=False) + '\n')
        return row

    async def lane_run(lane: int, ids: list[str]) -> None:
        for case_id in ids:
            rows.append(await one(sessions[lane], case_id, time.monotonic()))

    try:
        if phase['kind'] == 'burst':
            for offset in range(0, len(phase['case_ids']), 4):
                scheduled = time.monotonic()
                rows.extend(await asyncio.gather(*(one(sessions[i], case_id, scheduled)
                                                  for i, case_id in enumerate(phase['case_ids'][offset:offset + 4]))))
        else:
            await asyncio.gather(*(lane_run(lane, ids) for lane, ids in assignments.items()))
    finally:
        stop.set()
        await sampler
    duration = time.monotonic() - start
    cpu: dict[str, float] = {}
    for sample_row in resource_samples:
        for process_id, value in sample_row.get('processes', {}).items():
            cpu[process_id] = max(cpu.get(process_id, 0), value)
    first = resource_samples[0].get('processes', {}) if resource_samples else {}
    resource = dict(phase=phase['id'], wall_s=duration,
                    completed_workflows_per_s=sum(r['outcome'] == 'completed' for r in rows) / duration,
                    service_cpu_seconds=sum(cpu.values()) - sum(first.values()) if cpu else None,
                    service_peak_rss_bytes=max((s['rss_bytes'] for s in resource_samples if s.get('available')), default=None),
                    observer_cpu_seconds=time.process_time() - observer_cpu, sample_interval_s=.1,
                    samples=len(resource_samples), load_average=resource_samples[-1].get('load_average') if resource_samples else None,
                    model_server_cpu_seconds=None, model_server_peak_rss_bytes=None)
    return rows, resource


async def execute(dataset: Path, output: Path, model_env: Path, *, provisional: bool,
                  baseline: Path | None = None, phase_limit: int | None = None) -> dict[str, Any]:
    plan = build_plan(dataset, MODELS, provisional=provisional)
    if output.exists():
        raise ValueError('The run destination must be new; preserve earlier evidence.')
    output = output.resolve()
    if not output.is_relative_to(ROOT / 'var' / 'bench'):
        raise ValueError('Raw benchmark output must remain under var/bench/.')
    output.mkdir(parents=True)
    workspace = output / 'workspace'
    materialize(dataset, workspace)
    shutil.copyfile(ROOT / 'bench' / 'replay.py', workspace / '_replay.py')
    captures = {c['id']: c for c in json.loads((dataset / 'captures.json').read_text())}
    write_json(workspace / '_captures.json', {k: dict(asset=c['asset'], exit_code=c['exit_code']) for k, c in captures.items()})
    cases = {c['id']: c for c in json.loads((dataset / 'cases.json').read_text())}
    # Read the documented configuration file without starting or editing the regular service.
    import tomllib
    settings_path = model_env.parent / 'settings.toml'
    original = tomllib.loads(settings_path.read_text()) if settings_path.is_file() else {}
    inventory = lms_json('ls', '--llm')
    before_models = lms_json('ps')
    environment = dict(platform=platform.platform(), machine=platform.machine(), processor=platform.processor(),
                       cpu_count=os.cpu_count(), python=sys.version,
                       memory_bytes=memory_bytes())
    metadata = dict(identity=plan['identity'], hardware=environment, settings={**original, 'benchmark_execution': plan['execution_settings']}, model_inventory=inventory,
                    loaded_models_before=before_models, observer_pid=os.getpid(),
                    commit=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                    working_tree=subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True),
                    corpus_sha256=plan['corpus_sha256'], provisional=provisional)
    write_json(output / 'plan.json', plan)
    write_json(output / 'environment.json', metadata)
    rows: list[dict[str, Any]] = []
    resources: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    deadline = time.monotonic() + plan['limits']['suite_seconds']
    original_model_ids = {str(x['identifier']) for x in before_models if x.get('identifier')}
    current_model = ''
    blocked_models: set[str] = set()
    model_preparation: list[dict[str, Any]] = []
    phases = plan['phases'][:phase_limit] if phase_limit else plan['phases']
    try:
        for start in sorted({p['clean_start'] for p in phases}):
            with service(output, workspace, model_env, start) as (base, pid):
                async with AsyncExitStack() as stack:
                    sessions, _ = await connect_sessions(stack, base, workspace)
                    await asyncio.to_thread(api, base, '/api/settings', method='PUT',
                                             body={**original, 'model_idle_unload_s': 0})
                    write_json(output / f'settings-{start}.json', await asyncio.to_thread(api, base, '/api/settings'))
                    for phase in (p for p in phases if p['clean_start'] == start):
                        if time.monotonic() >= deadline:
                            for case_id in phase['case_ids']:
                                rows.append(dict(phase=phase['id'], kind=phase['kind'], model=phase['model'],
                                                 case_id=case_id, outcome='unexecuted', wall_s=0, calls=[], grade={}))
                            continue
                        if phase['model'] != current_model and phase['model'] not in blocked_models:
                            load_started = time.monotonic()
                            load_code = 0
                            try:
                                if not shutil.which('lms'):
                                    raise RuntimeError('The LM Studio CLI is unavailable.')
                                await asyncio.to_thread(switch_model, phase['model'], original_model_ids,
                                                        output / f'model-load-{len(model_preparation)}.log')
                            except (RuntimeError, OSError, subprocess.TimeoutExpired) as exc:
                                blocked_models.add(phase['model'])
                                load_code = 1
                                failures.append(dict(type='model_preparation', model=phase['model'], error=type(exc).__name__))
                            model_preparation.append(dict(model=phase['model'], seconds=time.monotonic() - load_started,
                                                          exit_code=load_code, originally_loaded=phase['model'] in original_model_ids,
                                                          gpu_offload_ratio=1.0, requested_context=32768))
                            current_model = phase['model']
                            write_json(output / 'model-preparation.json', model_preparation)
                        if phase['model'] in blocked_models:
                            for case_id in phase['case_ids']:
                                rows.append(dict(phase=phase['id'], kind=phase['kind'], model=phase['model'],
                                                 case_id=case_id, outcome='unexecuted', reason='model_preparation_failed',
                                                 wall_s=0, calls=[], grade={}))
                            continue
                        await asyncio.to_thread(api, base, '/api/settings', method='PUT', body={'model': phase['model']})
                        print(f"START {phase['id']} {phase['model']} {len(phase['case_ids'])} workflows", flush=True)
                        phase_rows, resource = await asyncio.wait_for(
                            run_phase(phase, sessions, cases, captures, dataset, deadline, output, pid),
                            timeout=max(.001, deadline - time.monotonic()))
                        rows.extend(phase_rows)
                        resources.append(resource)
                        resource['loaded_models'] = await asyncio.to_thread(lms_json, 'ps')
                        write_json(output / 'resources.json', resources)
                        write_json(output / 'summary.json', summarize(rows))
                        print(f"DONE {phase['id']} wall={resource['wall_s']:.2f}s errors="
                              f"{sum(r['outcome'] in {'error', 'timeout'} for r in phase_rows)}", flush=True)
    except Exception as exc:  # noqa: BLE001 - retain partial run and report the failed phase.
        failures.append(dict(type=type(exc).__name__, detail='Execution stopped; inspect owned service logs.'))
        print(f'Execution stopped: {type(exc).__name__}', flush=True)
    finally:
        cleanup: list[dict[str, Any]] = []
        for loaded_model in lms_json('ps'):
            identifier = loaded_model.get('identifier', '')
            if identifier in plan['models'] and identifier not in original_model_ids and shutil.which('lms'):
                try:
                    unloaded = subprocess.run(['lms', 'unload', identifier], capture_output=True, check=False, timeout=30)
                    cleanup.append(dict(model=identifier, unloaded=unloaded.returncode == 0))
                except (OSError, subprocess.TimeoutExpired) as exc:
                    cleanup.append(dict(model=identifier, unloaded=False, error=type(exc).__name__))
        summary = summarize(rows)
        attempted = {(r['phase'], r['case_id']) for r in rows}
        summary.update(planned_workflows=sum(len(p['case_ids']) for p in plan['phases']),
                       recorded_workflows=len(rows),
                       omitted_workflows=[dict(phase=p['id'], case_id=c) for p in plan['phases'] for c in p['case_ids']
                                          if (p['id'], c) not in attempted],
                       resources=resources, failures=failures, metadata=metadata,
                       baseline=compare_baseline(metadata, json.loads(baseline.read_text()) if baseline else None),
                       loaded_models_after=lms_json('ps'), model_preparation=model_preparation,
                       cleanup=cleanup, phase_limit=phase_limit)
        write_json(output / 'summary.json', summary)
        write_json(output / 'rows.json', rows)
        # Blind review identity mapping remains outside the packet.
        identities = {model: f'worker-{n + 1}' for n, model in enumerate(plan['models'])}
        write_json(output / 'review-identities.json', identities)
        write_json(output / 'blind-output-review.json', [dict(case_id=r['case_id'], worker=identities[r['model']],
                   phase=r['phase'], answer='\n'.join(c['text'] for c in r['calls']), rubric=cases[r['case_id']]['oracle'])
                   for r in rows if r.get('kind') == 'primary'])
    return summary


def internal_hardware(path: Path) -> dict[str, Any]:
    """Read unprivileged host counters, with absence explicit; no host tuning."""
    import importlib.metadata
    def read(name: str) -> str | None:
        try:
            return Path(name).read_text().strip()
        except OSError:
            return None
    def command(argv: list[str]) -> str | None:
        try:
            result = subprocess.run(argv, capture_output=True, text=True, timeout=5, check=False)
            return result.stdout.strip() if result.returncode == 0 else None
        except (OSError, subprocess.TimeoutExpired):
            return None
    clock = time.get_clock_info('monotonic')
    cpuinfo = read('/proc/cpuinfo') or ''
    cpu_model = next((line.split(':', 1)[1].strip() for line in cpuinfo.splitlines() if line.startswith('model name')), None)
    physical = {(block.split('physical id\t: ')[-1].splitlines()[0], block.split('core id\t\t: ')[-1].splitlines()[0])
                for block in cpuinfo.strip().split('\n\n') if 'physical id' in block and 'core id' in block}
    thermals = {p.parent.name + ':' + str(read(str(p.parent / 'type'))): read(str(p))
                for p in Path('/sys/class/thermal').glob('thermal_zone*/temp')}
    power = {p.name: dict(governor=read(str(p / 'cpufreq/scaling_governor')),
                         frequency_khz=read(str(p / 'cpufreq/scaling_cur_freq')))
             for p in Path('/sys/devices/system/cpu').glob('cpu[0-9]*')}
    return dict(platform=platform.platform(), kernel=platform.release(), python=sys.version,
        cpu_model=cpu_model, physical_cores=len(physical) or None, logical_cores=os.cpu_count(),
        affinity=sorted(os.sched_getaffinity(0)) if hasattr(os, 'sched_getaffinity') else None,
        cgroup_cpu_max=read('/sys/fs/cgroup/cpu.max'), cgroup_memory_max=read('/sys/fs/cgroup/memory.max'),
        memory_bytes=memory_bytes(), meminfo=read('/proc/meminfo'), load_average=list(os.getloadavg()) if hasattr(os, 'getloadavg') else None,
        storage=command(['findmnt', '--json', '--target', str(path), '--output', 'SOURCE,FSTYPE,TARGET,OPTIONS']),
        cpu_power=power, temperatures_millidegrees=thermals or None,
        gpu=command(['nvidia-smi', '--query-gpu=name,driver_version,memory.total,temperature.gpu,pstate,power.draw', '--format=csv,noheader']),
        monotonic=dict(implementation=clock.implementation, resolution_s=clock.resolution, monotonic=clock.monotonic),
        libraries={name: importlib.metadata.version(name) for name in ('mcp', 'fastapi', 'uvicorn', 'pydantic', 'langchain-openai')},
        model_server_cli_version=command(['lms', '--version']), model_server_version=None, loaded_models=lms_json('ps'),
        unavailable='Null counters are unavailable; model-server CPU and memory are not measured.')


async def execute_internal(dataset: Path, output: Path, model_env: Path, *, provisional: bool,
                           phase_limit: int | None = None) -> dict[str, Any]:
    """Run the approved internal schedules through public MCP and administration APIs."""
    plan = build_internal_plan(dataset, provisional=provisional)
    output = output.resolve()
    if output.exists() or not output.is_relative_to(ROOT / 'var' / 'bench'):
        raise ValueError('Use a new raw-output folder under var/bench/.')
    output.mkdir(parents=True)
    workspace = output / 'workspace'
    materialize(dataset, workspace)
    shutil.copyfile(ROOT / 'bench/replay.py', workspace / '_replay.py')
    captures = {c['id']: c for c in json.loads((dataset / 'captures.json').read_text())}
    write_json(workspace / '_captures.json', {k: dict(asset=c['asset'], exit_code=c['exit_code']) for k, c in captures.items()})
    cases = {c['id']: c for c in json.loads((dataset / 'cases.json').read_text())}
    # Read the documented configuration file without starting or editing the regular service.
    import tomllib
    settings_path = model_env.parent / 'settings.toml'
    original = tomllib.loads(settings_path.read_text()) if settings_path.is_file() else {}
    inventory_known = True
    try:
        loaded_before = lms_json('ps', strict=True)
    except (RuntimeError, ValueError, OSError, subprocess.TimeoutExpired):
        inventory_known, loaded_before = False, []
    original_ids = {str(entry['identifier']) for entry in loaded_before if entry.get('identifier')}
    commit = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True, check=True).stdout.strip()
    metadata = dict(commit=commit, plan_identity=plan['identity'], hardware=internal_hardware(output),
                    model_inventory=lms_json('ls', '--llm'), loaded_before=loaded_before, inventory_known=inventory_known, settings=original,
                    started_at=time.time(), condition_limits=plan['execution_settings'], phase_limit=phase_limit)
    write_json(output / 'plan.json', plan)
    write_json(output / 'environment.json', metadata)
    rows: list[dict[str, Any]] = []
    resources: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    deadline = time.monotonic() + plan['limits']['suite_seconds']
    phases = plan['phases'][:phase_limit] if phase_limit else plan['phases']
    blocked_model = False
    model_checked = False
    try:
        async with AsyncExitStack() as owned:
            # Homes persist across their scheduled phases; clean-start homes never share a store.
            services: dict[int, tuple[str, int, list[Session]]] = {}
            home_stacks: dict[int, AsyncExitStack] = {}
            for phase in phases:
                if time.monotonic() >= deadline:
                    break
                if phase['condition'] == 'model' and not model_checked:
                    model_checked = True
                    try:
                        if not inventory_known:
                            raise RuntimeError('Model ownership is unknown; preserve all models')
                        await asyncio.to_thread(switch_model, MODELS[0], original_ids, output / 'model-load.log')
                        current = lms_json('ps')
                        match = next((m for m in current if m.get('identifier') == MODELS[0]), None)
                        if match is None:
                            raise RuntimeError('Required worker is absent after preparation')
                        # Loading settings are retained verbatim for compatibility inspection.
                        write_json(output / 'model-preparation.json', dict(requested=plan['execution_settings'], observed=match))
                        config = match.get('config', {})
                        context = match.get('contextLength', config.get('contextLength'))
                        if context != 32768 or match.get('parallel') != 1 or original.get('provider') != 'lmstudio':
                            raise RuntimeError('Resident worker settings differ from the approved condition')
                    except (RuntimeError, OSError, ValueError, subprocess.TimeoutExpired) as exc:
                        blocked_model = True
                        failures.append(dict(condition='model', reason='worker_unavailable_or_incompatible', error=type(exc).__name__))
                if phase['condition'] == 'model' and blocked_model:
                    continue
                index = phase['clean_start']
                if index not in services:
                    if phase['condition'] != 'overhead' or index == 6:
                        for previous in list(home_stacks):
                            await home_stacks.pop(previous).aclose()
                            del services[previous]
                    home_stack = await owned.enter_async_context(AsyncExitStack())
                    home_stacks[index] = home_stack
                    base, pid = home_stack.enter_context(service(output, workspace, model_env, index, timing=phase['timing']))
                    sessions, _ = await connect_sessions(home_stack, base, workspace)
                    for session in sessions:
                        session.internal_timing = phase['timing']
                    await asyncio.to_thread(api, base, '/api/settings', method='PUT',
                        body={**original, 'model': phase['model'], 'model_idle_unload_s': 0})
                    write_json(output / f'settings-{index}.json', await asyncio.to_thread(api, base, '/api/settings'))
                    services[index] = base, pid, sessions
                base, pid, sessions = services[index]
                before = await asyncio.to_thread(internal_hardware, output / f'home-{index}' / 'data')
                print(f"START {phase['id']} {len(phase['case_ids'])} workflows timing={phase['timing']}", flush=True)
                phase_rows, resource = await asyncio.wait_for(
                    run_phase(phase, sessions, cases, captures, dataset, deadline, output, pid),
                    timeout=max(.001, deadline - time.monotonic()))
                for row in phase_rows:
                    row.update(condition=phase['condition'], measured=phase['measured'], timing=phase['timing'], repeat=phase['repeat'])
                    row['contamination'] = 'uncontrolled_interactive_desktop; verification jobs excluded'
                    if phase['condition'] in ('core', 'overhead') and any(c['trace'].get('llm_calls') for c in row['calls']):
                        failures.append(dict(type='unexpected_provider_call', phase=phase['id'], case_id=row['case_id']))
                rows.extend(phase_rows)
                resource.update(condition=phase['condition'], kind=phase['kind'], measured=phase['measured'],
                                timing=phase['timing'], repeat=phase['repeat'], hardware_before=before,
                                hardware_after=await asyncio.to_thread(internal_hardware, output / f'home-{index}' / 'data'),
                                cpu_scope='Service process only, including export and diagnostic reads. Command children excluded. Observer CPU can overlap.')
                resources.append(resource)
                write_json(output / 'rows.json', rows)
                write_json(output / 'resources.json', resources)
                write_json(output / 'summary.json', summarize_internal(rows))
                print(f"DONE {phase['id']} wall={resource['wall_s']:.2f}s profiles="
                      f"{sum(c['timing_analysis']['valid'] for r in phase_rows for c in r['calls'])}", flush=True)
    except Exception as exc:  # noqa: BLE001 - retain partial evidence and explicitly report omissions.
        failures.append(dict(type=type(exc).__name__, detail='Stopped; inspect benchmark-owned logs.'))
        print(f'Internal suite stopped: {type(exc).__name__}', flush=True)
    finally:
        cleanup = []
        for loaded in lms_json('ps'):
            identifier = loaded.get('identifier')
            if inventory_known and identifier == MODELS[0] and identifier not in original_ids:
                try:
                    result = subprocess.run(['lms', 'unload', identifier], capture_output=True, timeout=30, check=False)
                    cleanup.append(dict(model=identifier, unloaded=result.returncode == 0))
                except (OSError, subprocess.TimeoutExpired) as exc:
                    cleanup.append(dict(model=identifier, unloaded=False, error=type(exc).__name__))
        recorded = {(r['phase'], r['case_id']) for r in rows}
        summary = summarize_internal(rows)
        summary.update(planned_workflows=2280, failures=failures, resources=resources, metadata=metadata,
            completed_at=time.time(), cleanup=cleanup, loaded_after=lms_json('ps'),
            omitted_workflows=[dict(phase=p['id'], case_id=c, reason='blocked' if blocked_model and p['condition'] == 'model' else 'not_executed')
                               for p in plan['phases'] for c in p['case_ids'] if (p['id'], c) not in recorded])
        write_json(output / 'rows.json', rows)
        write_json(output / 'summary.json', summary)
    return summary
