"""Public contract for reproducible shared-corpus schedules and provisional scoring."""
from __future__ import annotations

import hashlib
import json
import random
import re
import statistics
from collections import defaultdict
from pathlib import Path
from typing import Any

from bench.corpus import validate

MODELS = ['ornith-1.0-9b', 'qwen3.8-27b', 'gemma-4-12b-it-qat', 'gemma-4-e4b-it', 'gemma-4-26b-a4b-it-qat']


def build_plan(dataset: Path, models: list[str], *, provisional: bool) -> dict[str, Any]:
    report = validate(dataset)
    if not report.valid:
        raise ValueError(f'Invalid corpus: {report.errors}')
    if not provisional and (report.pending_reviews or not (dataset / 'frozen.json').is_file()):
        raise ValueError('Pending independent review: use explicit --provisional for exploratory results.')
    if len(models) < 2 or len(set(models)) != len(models):
        raise ValueError('At least two distinct model identities are required.')
    cases = json.loads((dataset / 'cases.json').read_text())
    evaluation = [c for c in cases if c['split'] == 'evaluation']
    development = [c['id'] for c in cases if c['split'] == 'development']
    rng = random.Random(20261029)
    phases: list[dict[str, Any]] = []

    def add(kind: str, model: str, ids: list[str], start: int = 0, concurrency: int = 1) -> None:
        phases.append(dict(id=f'{kind}-{len(phases):03}', kind=kind, model=model,
                           case_ids=ids.copy(), clean_start=start, concurrency=concurrency))

    add('development', models[0], development)
    for model in models:
        add('warmup', model, [c['id'] for c in evaluation])
    for repeat in range(5):
        ids = [c['id'] for c in evaluation]
        rng.shuffle(ids)
        for offset in range(len(models)):
            add('primary', models[(repeat + offset) % len(models)], ids)
    for start in (1, 2):
        for offset in range(len(models)):
            model = models[(start + offset) % len(models)]
            ids = [c['id'] for c in evaluation]
            rng.shuffle(ids)
            add('warmup', model, ids, start)
            add('reproduce', model, ids, start)
    # Family order changes; within-family order stays independent from observed answers.
    families = sorted({c['family'] for c in evaluation})
    balanced = [next(c['id'] for c in evaluation if c['family'] == family and c['primary_tool'] == tool
                     and c['id'].endswith(f'-{number}'))
                for number in (1, 2)
                for tool in ('saturn_run', 'saturn_read', 'saturn_search', 'saturn_ask', 'saturn_query')
                for family in families]
    eligible = [c['id'] for c in evaluation if c['lifecycle']['cancel_eligible']]
    conditions = [('balanced-c1', 1), ('balanced-c2', 2), ('balanced-c4', 4),
                  ('busy-quiet', 2), ('burst', 4), ('cancel', 1)]
    for repeat in range(5):
        for kind, concurrency in conditions[repeat:] + conditions[:repeat]:
            add(kind, models[0], eligible if kind == 'cancel' else balanced, 2, concurrency)
    plan = dict(corpus_sha256=report.corpus_sha256, provisional=provisional,
                seed=20261029, models=models, phases=phases,
                limits=dict(call_seconds=90, workflow_seconds=180, suite_seconds=21600),
                scoring_version='1', schema_version=1,
                execution_settings=dict(context_tokens=32768, gpu_layer_offload_ratio=1.0,
                                        model_parallel=1, saturn_llm_concurrency=1, model_idle_unload_s=0))
    plan['identity'] = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    return plan


def grade(case: dict[str, Any], calls: list[dict[str, Any]]) -> dict[str, Any]:
    """Conservative literal checks; semantic correctness always awaits blind review."""
    oracle = case['oracle']
    text = '\n'.join(c.get('text', '') for c in calls)
    expected = oracle['expected_outcome']
    error = any(c.get('is_error', False) for c in calls)
    exit_codes = [c.get('run', {}).get('exit_code') for c in calls]
    outcome: bool | None = bool(calls) and not error
    if expected == 'policy_refusal':
        outcome = error and bool(re.search(r'policy_violation|permission_denied|outside|secret', text, re.IGNORECASE))
    elif expected == 'command_nonzero':
        outcome = not error and any(isinstance(code, int) and code != 0 for code in exit_codes)
    elif expected == 'no_matches':
        outcome = not error and bool(re.search(r'(?:0|zero|no) match', text, re.IGNORECASE))
    elif expected == 'abstain':
        outcome = None  # Semantic abstention needs review, not a keyword score.
    hits: list[dict[str, Any]] = []
    semantic = oracle['scoring'] == 'semantic-rubric-v1'
    for fact in oracle['facts']:
        found: bool | None
        if semantic:
            found = None
        elif fact['id'] == 'exit-status':
            match = re.search(r'status is (\d+)', fact['text'])
            found = bool(match and int(match[1]) in exit_codes)
        elif fact['id'] == 'no-match':
            found = bool(outcome)
        else:
            alternatives = [fact['text'], *fact['acceptable_alternatives']]
            found = any(value.casefold() in text.casefold() for value in alternatives)
        hits.append(dict(id=fact['id'], literal_match=found))
    recall = None if semantic else (sum(h['literal_match'] is True for h in hits) / len(hits) if hits else None)
    forbidden = [s for s in oracle['forbidden_claims'] if s.casefold() in text.casefold()]
    return dict(outcome_matches=outcome, required_fact_recall=recall, facts=hits,
                literal_forbidden_matches=forbidden, factual_precision=None, evidence_support=None,
                completeness=None, correct_abstention=None, semantic_review='pending',
                response_budget_met=all(c.get('estimated_tokens', 0) <= case['budgets']['response_estimated_tokens']
                                        for c in calls),
                workflow_budget_met=sum(c.get('estimated_tokens', 0) for c in calls)
                <= case['budgets']['workflow_estimated_tokens'])


def _percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * quantile
    lower = int(position)
    return ordered[lower] + (ordered[min(lower + 1, len(ordered) - 1)] - ordered[lower]) * (position - lower)


def summarize(rows: list[dict[str, Any]]) -> dict[str, Any]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        if row.get('kind') not in {'warmup', 'development'}:
            grouped[(row['phase'], row['model'])].append(row)
            grouped[('aggregate:' + row.get('kind', 'unspecified'), row['model'])].append(row)
    groups = []
    for (phase, model), members in grouped.items():
        times = [r['wall_s'] for r in members if r['outcome'] != 'unexecuted']
        completed = [r for r in members if r['outcome'] == 'completed']
        grades = [r['grade']['required_fact_recall'] for r in members
                  if r.get('grade', {}).get('required_fact_recall') is not None]
        by_tool: dict[str, list[float]] = defaultdict(list)
        by_family: dict[str, list[float]] = defaultdict(list)
        for row in members:
            value = row.get('grade', {}).get('required_fact_recall')
            if value is not None:
                by_tool[row['tool']].append(value)
                by_family[row['family']].append(value)
        model_calls = [c for r in members for call in r['calls'] for c in call.get('trace', {}).get('llm_calls', [])]
        tool_means = {key: statistics.mean(values) for key, values in by_tool.items()}
        groups.append(dict(phase=phase, model=model, attempted=len(times), scheduled=len(members),
                           literal_fact_recall_by_tool=tool_means,
                           literal_fact_recall_by_family={key: statistics.mean(values) for key, values in by_family.items()},
                           literal_tool_macro_recall=statistics.mean(tool_means.values()) if tool_means else None,
                           tool_error_workflows=sum(any(c.get('is_error') for c in r['calls']) for r in members),
                           model_calls=sum(len(c.get('trace', {}).get('llm_calls', [])) for r in members for c in r['calls']),
                           completed=len(completed), infrastructure_errors=sum(r['outcome'] in {'timeout', 'error'} for r in members),
                           unexecuted=sum(r['outcome'] == 'unexecuted' for r in members),
                           cancelled=sum(r['outcome'] == 'cancelled' for r in members),
                           median_s=statistics.median(times) if times else None,
                           min_s=min(times) if times else None, max_s=max(times) if times else None,
                           p50_s=_percentile(times, .5) if times else None,
                           p95_s=_percentile(times, .95) if times else None,
                           p99_s=_percentile(times, .99) if len(times) >= 100 else None,
                           response_bytes=sum(r.get('response_bytes', 0) for r in members),
                           input_reference_bytes=sum(r.get('input_reference_bytes', 0) for r in members),
                           literal_fact_recall=statistics.mean(grades) if grades else None,
                           semantic_quality=None,
                           model_usage={key: sum(c.get(key, 0) or 0 for c in model_calls)
                                        for key in ('input_tokens', 'output_tokens', 'reasoning_tokens', 'cached_tokens')},
                           failed_model_calls=sum(c.get('status') != 'ok' for c in model_calls)))
    return dict(groups=groups, measured_workflows=sum(r['outcome'] != 'unexecuted' and r.get('kind') not in {'warmup', 'development'} for r in rows),
                unexecuted=sum(r['outcome'] == 'unexecuted' for r in rows), provisional=True,
                internal_queue_wait=None, billing_cost=None, final_quality_ranking=None)


def compare_baseline(current: dict[str, Any], previous: dict[str, Any] | None) -> dict[str, Any]:
    if previous is None:
        return dict(status='unavailable', reason='This suite establishes the initial service baseline.')
    keys = ('identity', 'hardware', 'settings', 'model_inventory')
    if any(current.get(k) != previous.get(k) for k in keys):
        return dict(status='incompatible', reason='Workload, environment, or settings differ.')
    return dict(status='compatible', tolerances=dict(p95_relative=.20, throughput_relative=.10, quality_points=2))


def build_internal_plan(dataset: Path, *, provisional: bool) -> dict[str, Any]:
    """Freeze the approved internal schedule against the unchanged shared corpus."""
    identity = build_plan(dataset, MODELS, provisional=provisional)
    cases = json.loads((dataset / 'cases.json').read_text())
    dev = [c['id'] for c in cases if c['split'] == 'development']
    evaluation = [c['id'] for c in cases if c['split'] == 'evaluation']
    rng = random.Random(20261029)
    phases: list[dict[str, Any]] = []
    def add(condition: str, kind: str, ids: list[str], home: int, concurrency: int = 1,
            measured: bool = False, timing: bool = True, repeat: int = 0) -> None:
        phases.append(dict(id=f'{condition}-{kind}-{len(phases):03}', condition=condition, kind=kind,
                           model=MODELS[0] if condition == 'model' else '', case_ids=ids.copy(), clean_start=home,
                           concurrency=concurrency, measured=measured, timing=timing, repeat=repeat))
    for condition, home in [('core', 0), ('model', 3)]:
        add(condition, 'development', dev, home)
        add(condition, 'warmup', evaluation, home)
        loads = [('c1', 1), ('c2', 2), ('c4', 4), ('burst', 4)]
        for repeat in range(5):
            ids = evaluation.copy()
            rng.shuffle(ids)
            offset = repeat % 4
            for kind, concurrency in loads[offset:] + loads[:offset]:
                add(condition, kind, ids, home, concurrency, True, repeat=repeat)
        for start in (1, 2):
            ids = evaluation.copy()
            rng.shuffle(ids)
            add(condition, 'warmup', ids, home + start, repeat=start)
            add(condition, 'reproduce', ids, home + start, measured=True, repeat=start)
    add('overhead', 'warmup', dev, 6)
    add('overhead', 'warmup', dev, 7, timing=False)
    for repeat in range(5):
        for timing in ([True, False] if repeat % 2 == 0 else [False, True]):
            add('overhead', 'overhead', dev, 6 if timing else 7, measured=True, timing=timing, repeat=repeat)
    plan = dict(schema_version=1, scoring_version='internal-1', provisional=provisional,
                corpus_sha256=identity['corpus_sha256'], seed=20261029, phases=phases,
                limits=identity['limits'], execution_settings=identity['execution_settings'],
                collector_limits=dict(active=64, intervals=4096, payload_bytes=2_000_000),
                timer='monotonic_ns', provider='LM Studio', models=[MODELS[0]],
                comparison='profiling on/off; no pre-instrumentation baseline',
                known_overlap='Interactive desktop; no concurrent verification jobs scheduled')
    plan['identity'] = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    return plan


def interval_union(intervals: list[tuple[int, int]]) -> int:
    """Length of a union; overlapping or nested intervals count once."""
    end = total = 0
    for left, right in sorted(intervals):
        total += max(0, right - max(left, end))
        end = max(end, right)
    return total


def interval_difference(start: int, end: int, children: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """Remaining pieces after removing a union of contained children."""
    pieces = []
    cursor = start
    for left, right in sorted(children):
        if left > cursor:
            pieces.append((cursor, left))
        cursor = max(cursor, right)
    if cursor < end:
        pieces.append((cursor, end))
    return pieces


def analyze_profile(profile: dict[str, Any] | None, run_id: str, request_id: str | None) -> dict[str, Any]:
    """Validate correlation and calculate unions without subtracting percentiles."""
    if profile is None:
        return dict(valid=False, reason='missing')
    if profile.get('incomplete'):
        return dict(valid=False, reason=profile.get('reason', 'incomplete'))
    if profile.get('run_id') != run_id or profile.get('request_id') != request_id:
        return dict(valid=False, reason='correlation')
    try:
        start, end = profile['start_ns'], profile['end_ns']
        rows = profile['intervals']
        assert isinstance(start, int) and isinstance(end, int) and end >= start
        assert isinstance(profile['instance_id'], str) and profile['instance_id']
        by_id = {r['id']: r for r in rows}
        assert len(by_id) == len(rows)
        for row in rows:
            a, b = row['start_ns'], row['end_ns']
            assert isinstance(a, int) and isinstance(b, int) and start <= a <= b <= end
            assert row['category'] in ('internal', 'storage', 'wait', 'backend')
            assert row['status'] in ('ok', 'error', 'cancelled')
            if row['parent_id'] is not None:
                parent = by_id[row['parent_id']]
                assert parent['start_ns'] <= a <= b <= parent['end_ns'] and parent['id'] < row['id']
        intervals = [(r['start_ns'], r['end_ns']) for r in rows]
        covered = interval_union(intervals)
        categories = {category: interval_union([(r['start_ns'], r['end_ns']) for r in rows if r['category'] == category])
                      for category in ('internal', 'storage', 'wait', 'backend')}
        inclusive: dict[str, list[tuple[int, int]]] = defaultdict(list)
        exclusive: dict[str, int] = defaultdict(int)
        # Direct child intervals already cover their descendants; use their union once.
        children: dict[int, list[tuple[int, int]]] = defaultdict(list)
        for row in rows:
            if row['parent_id'] is not None:
                children[row['parent_id']].append((row['start_ns'], row['end_ns']))
        exclusive_categories: dict[str, list[tuple[int, int]]] = defaultdict(list)
        for row in rows:
            exclusive_categories[row['category']].extend(interval_difference(row['start_ns'], row['end_ns'], children[row['id']]))
            inclusive[row['stage']].append((row['start_ns'], row['end_ns']))
            exclusive[row['stage']] += row['end_ns'] - row['start_ns'] - interval_union(children[row['id']])
        return dict(valid=True, window_ns=end - start, covered_ns=covered, unattributed_ns=end - start - covered,
                    category_union_ns=categories, category_overlap_ns=sum(categories.values()) - covered,
                    exclusive_category_union_ns={c: interval_union(exclusive_categories[c]) for c in categories},
                    internal_exclusive_union_ns=interval_union(exclusive_categories['internal'] + exclusive_categories['storage']),
                    inclusive_stage_ns={k: interval_union(v) for k, v in inclusive.items()}, exclusive_stage_ns=dict(exclusive),
                    interval_count=len(rows), instance_id=profile['instance_id'])
    except (KeyError, TypeError, AssertionError, ValueError):
        return dict(valid=False, reason='invalid_or_clipped')


def latency_distribution(values: list[float]) -> dict[str, Any]:
    if not values:
        return dict(n=0, min=None, max=None, median=None, p50=None, p95=None, p99=None)
    ordered = sorted(values)
    def percentile(fraction: float) -> float:
        index = (len(ordered) - 1) * fraction
        low = int(index)
        return ordered[low] + (ordered[min(low + 1, len(ordered) - 1)] - ordered[low]) * (index - low)
    return dict(n=len(values), min=min(values), max=max(values), median=statistics.median(values),
                p50=percentile(.5), p95=percentile(.95), p99=percentile(.99) if len(values) >= 100 else None)


def summarize_internal(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Keep missing profiles in denominators; stage distributions use valid profiles only."""
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for workflow in rows:
        if not workflow.get('measured'):
            continue
        for call in workflow['calls']:
            sample = dict(call=call, workflow=workflow)
            for dimension, value in [('all', 'all'), ('workload', workflow['kind']), ('tool', call['tool']),
                                     ('family', workflow['family']), ('pass', str(workflow['repeat']))]:
                key = f"{workflow['condition']}|{dimension}:{value}|timing:{workflow['timing']}"
                groups[key].append(sample)
    summaries = {}
    for key, samples in groups.items():
        valid = [s['call']['timing_analysis'] for s in samples if s['call']['timing_analysis']['valid']]
        stages = sorted({k for p in valid for k in p['inclusive_stage_ns']})
        categories = ('internal', 'storage', 'wait', 'backend')
        reasons: dict[str, int] = defaultdict(int)
        for sample in samples:
            analysis = sample['call']['timing_analysis']
            if not analysis['valid']:
                reasons[analysis['reason']] += 1
        summaries[key] = dict(requests=len(samples), valid_profiles=len(valid), invalid_reasons=dict(reasons),
            tool_errors=sum(s['call']['is_error'] for s in samples),
            expected_model_unavailable=sum('model_unavailable' in s['call']['text'] for s in samples),
            provider_intervals=sum(sum(r['stage'] == 'provider' for r in (s['call'].get('timing_profile') or {}).get('intervals', [])) for s in samples),
            llm_calls=sum(len(s['call']['trace'].get('llm_calls', [])) for s in samples),
            round_trip_s=latency_distribution([s['call']['latency_s'] for s in samples]),
            collection_s=latency_distribution([s['call'].get('collection_s', 0) for s in samples]),
            window_ms=latency_distribution([p['window_ns'] / 1e6 for p in valid]),
            covered_ms=latency_distribution([p['covered_ns'] / 1e6 for p in valid]),
            unattributed_ms=latency_distribution([p['unattributed_ns'] / 1e6 for p in valid]),
            category_overlap_ms=latency_distribution([p['category_overlap_ns'] / 1e6 for p in valid]),
            internal_exclusive_ms=latency_distribution([p['internal_exclusive_union_ns'] / 1e6 for p in valid]),
            exclusive_category_union_ms={c: latency_distribution([p['exclusive_category_union_ns'][c] / 1e6 for p in valid]) for c in categories},
            category_union_ms={c: latency_distribution([p['category_union_ns'][c] / 1e6 for p in valid]) for c in categories},
            stages={stage: dict(observed_profiles=sum(stage in p['inclusive_stage_ns'] for p in valid),
                inclusive_ms=latency_distribution([p['inclusive_stage_ns'][stage] / 1e6 for p in valid if stage in p['inclusive_stage_ns']]),
                exclusive_ms=latency_distribution([p['exclusive_stage_ns'][stage] / 1e6 for p in valid if stage in p['exclusive_stage_ns']]))
                    for stage in stages})
    overhead: list[dict[str, Any]] = []
    for repeat in range(5):
        pairs: dict[str, dict[bool, float]] = defaultdict(dict)
        for row in rows:
            if row.get('kind') == 'overhead' and row.get('repeat') == repeat:
                pairs[row['case_id']][row['timing']] = sum(c['latency_s'] for c in row['calls'])
        for case_id, pair in pairs.items():
            if set(pair) == {True, False}:
                overhead.append(dict(case_id=case_id, repeat=repeat, enabled_s=pair[True], disabled_s=pair[False],
                                     delta_s=pair[True] - pair[False]))
    reproductions = []
    for condition in ('core', 'model'):
        primary = [r for r in rows if r.get('condition') == condition and r.get('kind') == 'c1']
        for repeat in (1, 2):
            reproduction = [r for r in rows if r.get('condition') == condition and r.get('kind') == 'reproduce' and r['repeat'] == repeat]
            def stage_p95(source: list[dict[str, Any]]) -> dict[str, float]:
                values: dict[str, list[float]] = defaultdict(list)
                for row in source:
                    for call in row['calls']:
                        analysis = call['timing_analysis']
                        if analysis['valid']:
                            for stage, duration in analysis['inclusive_stage_ns'].items():
                                values[stage].append(duration / 1e6)
                return {s: float(latency_distribution(v)['p95']) for s, v in values.items()}
            baseline, reproduced = stage_p95(primary), stage_p95(reproduction)
            for stage in sorted(set(baseline) | set(reproduced)):
                ratio = reproduced[stage] / baseline[stage] - 1 if stage in reproduced and baseline.get(stage) else None
                reproductions.append(dict(condition=condition, repeat=repeat, stage=stage, primary_p95_ms=baseline.get(stage),
                    reproduced_p95_ms=reproduced.get(stage), relative_change=ratio,
                    within_20_percent=abs(ratio) <= .2 if ratio is not None else None))
    return dict(groups=summaries, overhead_pairs=overhead,
                overhead_delta_ms=latency_distribution([p['delta_s'] * 1000 for p in overhead]),
                reproductions=reproductions, recorded_workflows=len(rows),
                provisional=True, metric='Elapsed internal intervals, not CPU time. Category unions can overlap.')
