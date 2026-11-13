import { describe, expect, it } from 'vitest';
import type { Run, Totals } from '../../lib/api/types';
import { bucketLabel, contextSeries, failureMood, highlights, journey, modelSeries, story } from './overview';

const totals = (over: Partial<Totals>): Totals => ({
  runs: 0, errors: 0, running: 0, raw_tokens: 0, returned_tokens: 0, saved_tokens: 0, reduction: null, redactions: 0,
  p50_s: null, p95_s: null, llm_calls: 0, llm_errors: 0, llm_in: 0, llm_out: 0, llm_reasoning: 0, llm_cached: 0,
  llm_p50_s: null, llm_p95_s: null, ...over,
});

describe('overview story', () => {
  it('says what was saved, in plain numbers', () => {
    const s = story(totals({ runs: 23, saved_tokens: 41_200, reduction: 0.94 }), 'last hour', false);
    expect(s.mood).toBe('focus');
    expect(s.lead).toBe("41.2k tokens kept out of your agent's context");
    expect(s.rest).toBe(' in the last hour, across 23 runs.');
  });

  it('explains an empty period instead of showing zeros', () => {
    const s = story(totals({}), 'last 15 minutes', false);
    expect(s.lead).toBe('Nothing has run');
    expect(s.rest).toContain('last 15 minutes');
  });

  it('mentions failures and raises the mood only when they are a real share', () => {
    expect(story(totals({ runs: 100, errors: 1, saved_tokens: 10, reduction: 0.5 }), 'last hour', false).mood).toBe('focus');
    const warm = story(totals({ runs: 10, errors: 3, saved_tokens: 10, reduction: 0.5 }), 'last hour', false);
    expect(warm.mood).toBe('warm');
    expect(warm.rest).toContain('3 of 10 runs failed or were refused.');
    expect(story(totals({ runs: 10, errors: 6, saved_tokens: 10, reduction: 0.5 }), 'last hour', false).mood).toBe('alert');
  });

  it('does not raise an alert from a tiny sample', () => {
    expect(failureMood(2, 2)).toBe('warm');
    expect(failureMood(0, 0)).toBe('focus');
  });

  it('says when the local server is down', () => {
    const s = story(totals({ runs: 4, saved_tokens: 100, reduction: 0.5 }), 'last hour', true);
    expect(s.mood).toBe('warm');
    expect(s.rest).toContain('local server is not answering');
  });

  it('handles periods where nothing shrank, or lookups dominated', () => {
    expect(story(totals({ runs: 1, saved_tokens: 0 }), 'last hour', false).rest).toContain('1 run, all short enough');
    const net = story(totals({ runs: 3, saved_tokens: -500 }), 'last hour', false);
    expect(net.lead).toContain('returned more than was withheld');
    expect(net.rest).toContain('500 tokens more');
  });
});

describe('chart series', () => {
  const buckets = [
    { t: 0, runs: 1, errors: 0, raw_tokens: 900, returned_tokens: 90, llm_calls: 1, llm_in: 300, llm_out: 30, llm_reasoning: 0 },
    { t: 60, runs: 0, errors: 0, raw_tokens: 0, returned_tokens: 0, llm_calls: 0, llm_in: 0, llm_out: 0, llm_reasoning: 0 },
  ];

  it('keeps one value per bucket, including real zeros', () => {
    expect(contextSeries(buckets).map((s) => s.values)).toEqual([[900, 0], [90, 0]]);
    expect(modelSeries(buckets).map((s) => s.id)).toEqual(['in', 'out', 'reasoning']);
  });

  it('names the sample size', () => {
    expect(bucketLabel(60)).toBe('1 min');
    expect(bucketLabel(900)).toBe('15 min');
    expect(bucketLabel(7200)).toBe('2 h');
    expect(bucketLabel(86_400)).toBe('1 day');
  });
});

const run = (over: Partial<Run>): Run => ({
  seq: 1, id: 'r', tool: 'saturn_run', client: null, harness_id: null, workspace: null, transport: null, client_info: null, session_id: null, request_id: null, decision: null, summary: 'pytest -q', started_at: 100, ended_at: 101, status: 'ok', route: 'digest',
  raw_tokens: 0, returned_tokens: 0, artifact_id: null, error: null, exit_code: 0, redactions: 0,
  llm_calls: 0, llm_in: 0, llm_out: 0, llm_reasoning: 0, llm_cached: 0, ...over,
});

describe('journey', () => {
  const routes = [
    { route: 'digest', runs: 2, raw: 9287, ret: 279 }, { route: 'inline', runs: 2, raw: 28, ret: 42 },
    { route: 'agent', runs: 1, raw: 400, ret: 90 }, { route: 'error', runs: 1, raw: 0, ret: 0 },
  ];
  it('tells the period as produced, shrunk, and reached the agent', () => {
    const [produced, shrunk, reached] = journey(totals({ runs: 6, raw_tokens: 9715, returned_tokens: 411 }), routes);
    expect(produced).toMatchObject({ value: '9,715', unit: 'tokens', caption: 'raw output of 6 runs' });
    expect(shrunk).toMatchObject({ value: '3', unit: 'runs', caption: '2 by code, 1 with the model; 2 short enough to pass through' });
    expect(reached).toMatchObject({ value: '411', caption: '4.2% of the raw output' });
  });
  it('says so when nothing needed shrinking or nothing was measured', () => {
    const [, shrunk, reached] = journey(totals({ runs: 1 }), [{ route: 'inline', runs: 1, raw: 0, ret: 0 }]);
    expect(shrunk.caption).toBe('nothing was long enough; 1 short enough to pass through');
    expect(reached.caption).toBe('nothing was measured');
  });
});

describe('highlights', () => {
  it('lists the largest savings first, then the latest failures, each with what happened', () => {
    const list = highlights([
      run({ id: 'small', raw_tokens: 1000, returned_tokens: 100 }),
      run({ id: 'big', raw_tokens: 8144, returned_tokens: 219 }),
      run({ id: 'plain', raw_tokens: 30, returned_tokens: 30 }),
      run({ id: 'old-fail', status: 'error', error: 'policy_violation: git push is not allowed', started_at: 50 }),
      run({ id: 'new-fail', status: 'error', error: null, started_at: 90 }),
    ]);
    expect(list.map((h) => h.id)).toEqual(['big', 'small', 'new-fail', 'old-fail']);
    expect(list[0]).toMatchObject({ kind: 'saved', text: '8,144 tokens became 219, 97% less' });
    expect(list[3]).toMatchObject({ kind: 'failed', text: 'git push is not allowed' });
    expect(list[2].text).toBe('No reason was recorded.');
  });
  it('keeps to the limit and is empty when nothing stands out', () => {
    expect(highlights([run({ raw_tokens: 5, returned_tokens: 5 })])).toEqual([]);
    expect(highlights([1, 2, 3, 4].map((n) => run({ id: `r${n}`, raw_tokens: n * 100, returned_tokens: 1 })), 2)).toHaveLength(2);
  });
});
