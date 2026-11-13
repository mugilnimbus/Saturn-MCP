"""Context-savings analysis from recorded case results: python -m bench savings --input case-results.json."""
from __future__ import annotations

import random
import statistics
from collections import defaultdict
from typing import Any

SEED = 20261029
RESAMPLES = 2000
DEFAULT_CAP_BYTES = 32768
TOKEN_BYTES = 3.6


def _saved(saturn: float, baseline: float) -> float | None:
    return None if baseline <= 0 else 1 - saturn / baseline


def _interval(rows: list[tuple[float, float, float]], index: int, rng: random.Random) -> list[float | None]:
    """95% percentile bootstrap over cases of aggregate saved fraction; columns are saturn, raw, capped."""
    if not rows:
        return [None, None]
    values = []
    for _ in range(RESAMPLES):
        sample = [rows[rng.randrange(len(rows))] for _ in rows]
        saved = _saved(sum(r[0] for r in sample), sum(r[index] for r in sample))
        if saved is not None:
            values.append(saved)
    values.sort()
    if not values:
        return [None, None]
    return [values[int(0.025 * (len(values) - 1))], values[int(0.975 * (len(values) - 1))]]


def analyze(results: list[dict[str, Any]], cap_bytes: int = DEFAULT_CAP_BYTES) -> dict[str, Any]:
    """Compare Saturn's returned bytes with the raw bytes an agent would otherwise receive.

    Uses only primary evaluation workflows. Each case-model pair is the median over passes.
    The capped baseline models a client that truncates raw output at cap_bytes.
    It is a declared assumption, not a measured client behavior.
    """
    if cap_bytes < 1:
        raise ValueError('cap_bytes must be positive')
    pairs: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in results:
        if row['kind'] == 'primary' and row['outcome'] == 'completed':
            pairs[(row['model'], row['case_id'])].append(row)
    cases = []
    for (model, case_id), rows in sorted(pairs.items()):
        raw = rows[0]['input_reference_bytes']
        cases.append({'model': model, 'case_id': case_id, 'tool': rows[0]['tool'], 'passes': len(rows),
                      'saturn_bytes': statistics.median(r['response_bytes'] for r in rows),
                      'raw_bytes': raw, 'capped_bytes': min(raw, cap_bytes),
                      'recall': statistics.median(r['grade']['required_fact_recall'] for r in rows
                                                  if r['grade']['required_fact_recall'] is not None)
                      if any(r['grade']['required_fact_recall'] is not None for r in rows) else None})
    usable = [c for c in cases if c['raw_bytes'] > 0]
    rng = random.Random(SEED)

    def summary(group: list[dict[str, Any]]) -> dict[str, Any]:
        rows = [(c['saturn_bytes'], c['raw_bytes'], c['capped_bytes']) for c in group]
        saturn, raw, capped = (sum(r[i] for r in rows) for i in range(3))
        return {'cases': len(group), 'saturn_bytes': saturn, 'raw_bytes': raw, 'capped_bytes': capped,
                'saturn_tokens_estimate': round(saturn / TOKEN_BYTES), 'raw_tokens_estimate': round(raw / TOKEN_BYTES),
                'saved_vs_raw': _saved(saturn, raw), 'saved_vs_raw_ci95': _interval(rows, 1, rng),
                'median_case_saved_vs_raw': statistics.median(1 - c['saturn_bytes'] / c['raw_bytes'] for c in group),
                'saved_vs_capped': _saved(saturn, capped), 'saved_vs_capped_ci95': _interval(rows, 2, rng),
                'cases_where_saturn_is_larger': sum(1 for c in group if c['saturn_bytes'] > c['raw_bytes'])}

    by_tool: dict[str, list[dict[str, Any]]] = defaultdict(list)
    by_model: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for case in usable:
        by_tool[case['tool']].append(case)
        by_model[case['model']].append(case)
    return {
        'method': 'Offline analysis of recorded primary evaluation workflows; median over passes per case and model.',
        'cap_bytes': cap_bytes, 'seed': SEED, 'resamples': RESAMPLES,
        'excluded_without_raw_reference': len(cases) - len(usable),
        'overall': summary(usable),
        'by_tool': {k: summary(v) for k, v in sorted(by_tool.items())},
        'by_model': {k: summary(v) for k, v in sorted(by_model.items())},
        'limits': [
            'Raw bytes are the declared source or captured output size, not a measured agent workflow.',
            'The capped baseline assumes a client that truncates raw output; the cap is a stated parameter.',
            'Aggregate savings are dominated by large inputs; the per-case median shows the typical case.',
            'Saved bytes do not show preserved meaning. Read them beside literal recall and the pending semantic review.',
            'Intervals resample cases, not passes. They exclude model-server variation across clean starts.',
            'Tokens use the benchmark estimate of 3.6 bytes per token, not provider usage.',
        ],
    }
