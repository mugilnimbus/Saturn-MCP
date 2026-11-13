"""Execution contracts against the one shared corpus."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from bench.execution import build_plan, compare_baseline, grade, summarize

DATASET = Path(__file__).parents[1] / 'dataset'


def test_execution_plan_uses_only_shared_evaluation_cases():
    # benchmark.execution.workload.schedule: all schedules reference immutable corpus case IDs.
    plan = build_plan(DATASET, ['a', 'b', 'c'], provisional=True)
    cases = json.loads((DATASET / 'cases.json').read_text())
    allowed = {c['id'] for c in cases if c['split'] == 'evaluation'}
    assert len(allowed) == 40
    assert all(set(p['case_ids']) <= allowed for p in plan['phases'] if p['kind'] != 'development')
    primary = [p for p in plan['phases'] if p['kind'] == 'primary']
    assert len(primary) == 15
    assert all(set(p['case_ids']) == allowed for p in primary)


def test_execution_requires_explicit_provisional_mode():
    # benchmark.execution.prepare.reviewed: pending review cannot become accepted ground truth.
    with pytest.raises(ValueError, match='provisional'):
        build_plan(DATASET, ['a', 'b', 'c'], provisional=False)


def test_execution_balances_model_order_and_reproduces_schedules():
    # benchmark.execution.workload.schedule: model order rotates, with repeatable input order.
    left = build_plan(DATASET, ['a', 'b', 'c'], provisional=True)
    right = build_plan(DATASET, ['a', 'b', 'c'], provisional=True)
    assert left == right
    primary = [p for p in left['phases'] if p['kind'] == 'primary']
    assert [p['model'] for p in primary[:6]] == ['a', 'b', 'c', 'b', 'c', 'a']
    assert len({tuple(p['case_ids']) for p in primary[:3]}) == 1


def test_execution_quality_never_accepts_empty_answer():
    # benchmark.execution.observe.score: absent assertions cannot receive perfect precision.
    case = json.loads((DATASET / 'cases.json').read_text())[0]
    result = grade(case, [])
    assert result['required_fact_recall'] == 0
    assert result['factual_precision'] is None
    assert result['semantic_review'] == 'pending'


def test_execution_command_failure_is_not_protocol_failure():
    # benchmark.execution.observe.score: exit status and tool errors have separate meanings.
    case = next(c for c in json.loads((DATASET / 'cases.json').read_text()) if c['id'] == 'requests-run-2')
    result = grade(case, [{'text': '4 failed; test_string -; test_super_len_with_tell -', 'is_error': False,
                           'run': {'exit_code': 1}}])
    assert result['outcome_matches'] is True
    assert result['required_fact_recall'] == 1
    assert result['semantic_review'] == 'pending'


def test_execution_errors_remain_in_summary_denominators():
    # benchmark.execution.finish.compare: never suppress failed observations.
    rows = [dict(phase='primary-0', model='a', case_id='x', tool='saturn_read', family='f',
                 wall_s=1, outcome=outcome, response_bytes=20, input_reference_bytes=100,
                 calls=[], grade={'required_fact_recall': None, 'outcome_matches': False})
            for outcome in ['completed', 'timeout']]
    result = summarize(rows)
    group = result['groups'][0]
    assert group['attempted'] == 2 and group['infrastructure_errors'] == 1
    assert group['p99_s'] is None


def test_execution_incompatible_baseline_refuses_regression_claim():
    # benchmark.execution.finish.compare: compare only equal workload identities.
    assert compare_baseline({'identity': 'a'}, {'identity': 'b'})['status'] == 'incompatible'
    assert compare_baseline({'identity': 'a'}, None)['status'] == 'unavailable'


def test_execution_replay_refuses_unregistered_capture(tmp_path):
    # benchmark.execution.workload.replay: capture text is data, never a command.
    (tmp_path / '_captures.json').write_text('{}')
    command = [sys.executable, str(Path(__file__).parents[1] / 'replay.py'), '../escape']
    result = subprocess.run(command, cwd=tmp_path, capture_output=True, text=True, check=False)
    assert result.returncode != 0 and 'unregistered capture' in result.stderr.lower()


def test_execution_replay_preserves_bytes_and_exit_status(tmp_path):
    # benchmark.execution.workload.replay: emit exact registered output and recorded status.
    data = 'real capture\nШерлок\n'.encode()
    (tmp_path / 'capture.txt').write_bytes(data)
    (tmp_path / '_captures.json').write_text(json.dumps({'capture': {'asset': 'capture.txt', 'exit_code': 7}}))
    result = subprocess.run([sys.executable, str(Path(__file__).parents[1] / 'replay.py'), 'capture'],
                            cwd=tmp_path, capture_output=True, check=False)
    assert result.stdout == data and result.returncode == 7


def test_execution_correlates_public_trace_to_its_harness(monkeypatch, tmp_path):
    # benchmark.execution.observe.collect: never select the latest global concurrent run.
    import asyncio
    from types import SimpleNamespace

    from bench.runner import Session

    seen = []
    responses = iter([{'runs': [{'id': 'old', 'tool': 'saturn_read'}]},
                      {'runs': [{'id': 'owned', 'tool': 'saturn_read', 'request_id': '9'}]},
                      {'run': {'id': 'owned'}, 'spans': [], 'llm_calls': []}])

    def public_api(base, path):
        seen.append(path)
        return next(responses)

    class NetworkClient:
        async def call_tool(self, *args, **kwargs):
            return SimpleNamespace(content=[SimpleNamespace(text='source')], is_error=False)

    monkeypatch.setattr('bench.runner.api', public_api)
    row = asyncio.run(Session('http://localhost', tmp_path, NetworkClient(), 'harness-owned').call('saturn_read', {}))
    assert row['run']['id'] == 'owned' and row['trace']['run']['id'] == 'owned'
    assert all('harness=harness-owned' in path for path in seen[:2])
    assert row['internal_queue_wait_s'] is None


def test_execution_cancellation_never_invents_server_acknowledgement(monkeypatch, tmp_path):
    # benchmark.execution.workload.cancel_call: client cancellation alone is not server acknowledgement.
    import asyncio

    from bench.runner import Session

    class NetworkClient:
        async def call_tool(self, *args, **kwargs):
            await asyncio.sleep(5)

    monkeypatch.setattr('bench.runner.api', lambda *args, **kwargs: {'runs': []})
    row = asyncio.run(Session('http://localhost', tmp_path, NetworkClient(), 'owned').call('saturn_read', {}, cancel=True))
    assert row['outcome'] == 'cancelled'
    assert row['cancellation']['server_acknowledgement'] is None
    assert row['cancellation']['client_task_cancelled'] is True


def test_execution_failed_model_preparation_cannot_fall_back_silently(tmp_path, monkeypatch):
    # benchmark.execution.prepare.ready: failed explicit loading blocks measured calls for that model.
    from bench.runner import prepare_model

    monkeypatch.setattr('bench.runner.subprocess.run', lambda *args, **kwargs: subprocess.CompletedProcess(args, 17))
    with pytest.raises(RuntimeError, match='preparation failed'):
        prepare_model('worker', tmp_path / 'load.log')


def test_execution_model_preparation_supports_gguf_cli(tmp_path, monkeypatch):
    # benchmark.execution.prepare.ready: GGUF loading must not require vLLM-only engine configuration controls.
    from bench.runner import prepare_model

    def load(argv, **kwargs):
        assert '--no-engine-config-file' not in argv, 'This option is rejected for the installed GGUF backend.'
        assert argv[argv.index('--context-length') + 1] == '32768'
        return subprocess.CompletedProcess(argv, 0)

    monkeypatch.setattr('bench.runner.subprocess.run', load)
    prepare_model('worker', tmp_path / 'load.log')


def test_execution_worker_switch_releases_only_benchmark_models(tmp_path, monkeypatch):
    # benchmark.execution.finish.cleanup: preserve pre-existing models while bounding benchmark residency.
    from bench.runner import switch_model

    loaded = [{'identifier': 'original'}, {'identifier': 'ornith-1.0-9b'}]
    commands = []

    def cli(argv, **kwargs):
        commands.append(argv)
        if argv[1] == 'ps':
            return subprocess.CompletedProcess(argv, 0, stdout=json.dumps(loaded))
        if argv[1] == 'unload':
            loaded[:] = [m for m in loaded if m['identifier'] != argv[2]]
        elif argv[1] == 'load':
            assert '--gpu' in argv and argv[argv.index('--gpu') + 1] == 'max'
            loaded.append({'identifier': argv[2]})
        return subprocess.CompletedProcess(argv, 0, stdout='')

    monkeypatch.setattr('bench.runner.subprocess.run', cli)
    monkeypatch.setattr('bench.runner.shutil.which', lambda _: 'lms')
    switch_model('qwen/qwen3-vl-8b', {'original'}, tmp_path / 'load.log')
    assert {m['identifier'] for m in loaded} == {'original', 'qwen/qwen3-vl-8b'}
    assert not any(c[:3] == ['lms', 'unload', 'original'] for c in commands)


def test_execution_rotates_load_conditions_across_passes():
    # benchmark.execution.workload.schedule: avoid confounding load condition with elapsed machine time.
    plan = build_plan(DATASET, ['a', 'b', 'c'], provisional=True)
    kinds = ['balanced-c1', 'balanced-c2', 'balanced-c4', 'busy-quiet', 'burst', 'cancel']
    load = [p for p in plan['phases'] if p['kind'] in kinds]
    for repeat in range(5):
        assert [p['kind'] for p in load[repeat * 6:(repeat + 1) * 6]] == kinds[repeat:] + kinds[:repeat]
    assert sum(len(p['case_ids']) for p in plan['phases']) == 2300


def test_internal_schedule_uses_the_same_corpus_and_exact_counts():
    from bench.execution import build_internal_plan
    plan = build_internal_plan(DATASET, provisional=True)
    phases = plan['phases']
    assert sum(len(p['case_ids']) for p in phases) == 2280
    assert sum(len(p['case_ids']) for p in phases if p['measured'] and p['condition'] != 'overhead') == 1760
    assert sum(len(p['case_ids']) for p in phases if p['kind'] == 'overhead') == 200
    assert len({p['id'] for p in phases}) == len(phases)
    assert plan == build_internal_plan(DATASET, provisional=True)


def test_internal_profile_uses_unions_and_preserves_unattributed_time():
    from bench.execution import analyze_profile
    profile = dict(version=1, instance_id='instance', run_id='run', request_id='1',
                   start_ns=0, end_ns=1000, incomplete=False, intervals=[
                       dict(id=0, parent_id=None, stage='response', category='internal', start_ns=100, end_ns=800, status='ok'),
                       dict(id=1, parent_id=0, stage='provider', category='backend', start_ns=200, end_ns=600, status='ok'),
                       dict(id=2, parent_id=0, stage='model_slot', category='wait', start_ns=500, end_ns=700, status='ok')])
    result = analyze_profile(profile, 'run', '1')
    assert result['valid']
    assert result['window_ns'] == 1000 and result['covered_ns'] == 700 and result['unattributed_ns'] == 300
    assert result['exclusive_stage_ns']['response'] == 200
    assert result['internal_exclusive_union_ns'] == 200
    assert result['exclusive_category_union_ns']['internal'] == 200
    assert result['category_union_ns']['backend'] == 400
    assert result['category_overlap_ns'] > 0


def test_internal_profile_rejects_missing_incomplete_or_wrong_identity():
    from bench.execution import analyze_profile
    assert not analyze_profile(None, 'run', '1')['valid']
    assert not analyze_profile(dict(incomplete=True), 'run', '1')['valid']
    assert not analyze_profile(dict(run_id='other'), 'run', '1')['valid']


def test_internal_inventory_failure_does_not_mean_empty_ownership(monkeypatch):
    # benchmark.internal_latency.measure.ready: unknown ownership blocks model preparation.
    from types import SimpleNamespace

    from bench.runner import lms_json

    monkeypatch.setattr('bench.runner.shutil.which', lambda _: '/local/lms')
    monkeypatch.setattr('bench.runner.subprocess.run', lambda *a, **kw: SimpleNamespace(returncode=1, stdout=''))
    with pytest.raises(RuntimeError, match='ownership is unknown'):
        lms_json('ps', strict=True)


def test_savings_compares_returned_bytes_with_raw_and_capped_baselines():
    # benchmark.execution.savings: savings use primary completed workflows and keep zero-reference cases out of ratios.
    from bench.savings import analyze

    def row(case, saturn, raw, kind='primary', tool='saturn_run'):
        return {'kind': kind, 'outcome': 'completed', 'model': 'm', 'case_id': case, 'tool': tool,
                'response_bytes': saturn, 'input_reference_bytes': raw, 'grade': {'required_fact_recall': 1.0}}

    rows = [row('a', 100, 1000), row('a', 300, 1000), row('b', 50, 100000), row('c', 5, 0),
            row('d', 1, 1, kind='warmup')]
    report = analyze(rows, cap_bytes=2000)
    assert report['excluded_without_raw_reference'] == 1
    assert report['overall']['cases'] == 2
    assert report['overall']['saturn_bytes'] == 250
    assert report['overall']['raw_bytes'] == 101000
    assert report['overall']['capped_bytes'] == 3000
    assert report['overall']['saved_vs_capped'] == pytest.approx(1 - 250 / 3000)
    assert analyze(rows, cap_bytes=2000) == report
    with pytest.raises(ValueError, match='cap_bytes'):
        analyze(rows, cap_bytes=0)


def test_agent_grade_counts_facts_and_compares_arms_on_shared_tasks(tmp_path):
    # benchmark.agent: a run succeeds only when every fact appears; savings compare the two arms per task.
    from bench.agent import TASKS, grade, prepare, prompts

    workspace = tmp_path / 'workspace'
    prepare(DATASET, workspace)
    assert (workspace / '_replay.py').is_file() and (workspace / '_captures.json').is_file()
    assert len(prompts(workspace)) == 2 * len(TASKS)
    runs = [dict(task='chi-timeout', arm='shell', answer='It writes 504.', total_tokens=1000, tool_uses=2, duration_ms=4000),
            dict(task='chi-timeout', arm='saturn', answer='Status 200.', total_tokens=400, tool_uses=1, duration_ms=3000)]
    report = grade(runs)
    assert [r['success'] for r in report['runs']] == [True, False]
    assert report['pairs'][0]['saved'] == pytest.approx(0.6) and report['pairs'][0]['both_succeeded'] is False
