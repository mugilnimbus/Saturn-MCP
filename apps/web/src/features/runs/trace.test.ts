import { describe, expect, it } from 'vitest';
import type { LlmCall, Run, Span, Trace } from '../../lib/api/types';
import { cut, listStats, summarize, waterfall } from './trace';

const run = (over: Partial<Run> = {}): Run => ({
  seq: 1, id: 'r1', tool: 'saturn_ask', client: null, harness_id: null, workspace: null, transport: null, client_info: null, session_id: null, request_id: null, decision: null, summary: 'q', started_at: 100, ended_at: 110, status: 'ok', route: 'agent',
  raw_tokens: 8000, returned_tokens: 200, artifact_id: null, error: null, exit_code: null, redactions: 0,
  llm_calls: 1, llm_in: 500, llm_out: 40, llm_reasoning: 0, llm_cached: 0, ...over,
});
const span = (id: string, started: number, ended: number | null, over: Partial<Span> = {}): Span => ({
  id, run_id: 'r1', parent_id: null, name: 'decide', kind: 'graph_node', started_at: started, ended_at: ended, status: 'ok', attrs: {}, ...over,
});
const call = (id: string, spanId: string | null, started: number, ended: number): LlmCall => ({
  id, run_id: 'r1', span_id: spanId, model: 'm', endpoint: 'responses', started_at: started, ended_at: ended, input_tokens: 500,
  output_tokens: 40, reasoning_tokens: 0, cached_tokens: 0, status: 'ok', error: null, prompt_preview: '', output_preview: '', purpose: 'agent-step-1',
});

describe('waterfall', () => {
  const trace: Trace = {
    run: run(),
    spans: [span('a', 100, 104), span('b', 104, 105, { name: 'act' }), span('c', 101, 103, { parent_id: 'a', name: 'inner', kind: 'step' })],
    llm_calls: [call('l1', 'a', 100.5, 103.5)],
    payloads: [],
  };

  it('orders rows by start time and places them along the run', () => {
    const rows = waterfall(trace);
    expect(rows.map((r) => r.id)).toEqual(['a', 'l1', 'c', 'b']);
    const first = rows[0];
    expect(first.offset).toBe(0);
    expect(first.width).toBeCloseTo(0.4);
    expect(rows[3].offset).toBeCloseTo(0.4);
  });

  it('nests children and model calls under the step that issued them', () => {
    const rows = waterfall(trace);
    expect(rows.find((r) => r.id === 'a')?.depth).toBe(0);
    expect(rows.find((r) => r.id === 'c')?.depth).toBe(1);
    expect(rows.find((r) => r.id === 'l1')).toMatchObject({ depth: 1, kind: 'llm', detail: '500 in, 40 out' });
  });

  it('extends an unfinished step to the end and keeps tiny steps visible', () => {
    const live: Trace = { run: run({ ended_at: null, status: 'running' }), spans: [span('a', 100, null), span('b', 100, 100.0001)], llm_calls: [], payloads: [] };
    const rows = waterfall(live, 120);
    expect(rows[0].seconds).toBeNull();
    expect(rows[0].offset + rows[0].width).toBeCloseTo(1);
    expect(rows[1].width).toBeGreaterThan(0);
  });

  it('does not loop on a span that names itself as parent', () => {
    const odd: Trace = { run: run(), spans: [span('a', 100, 101, { parent_id: 'a' })], llm_calls: [], payloads: [] };
    expect(waterfall(odd)[0].depth).toBe(0);
  });
});

describe('run summary', () => {
  it('states the saving', () => {
    expect(summarize(run())).toEqual({ mood: 'focus', lead: 'Returned 200 tokens instead of 8,000', rest: ' (98% less) in 10 s.' });
  });

  it('separates a policy refusal from a failure', () => {
    expect(summarize(run({ status: 'error', error: "policy_violation: 'rm' is not allowed." }))).toMatchObject({ mood: 'warm', lead: 'Refused by policy.', rest: " 'rm' is not allowed." });
    expect(summarize(run({ status: 'error', error: 'model_unavailable: no answer' })).mood).toBe('alert');
  });

  it('describes pass-through and running runs', () => {
    expect(summarize(run({ raw_tokens: 50, returned_tokens: 55 })).rest).toContain('pass through unchanged');
    expect(summarize(run({ status: 'running', ended_at: null })).lead).toBe('Still running.');
  });

  it('computes the cut only where it means something', () => {
    expect(cut(run())).toBeCloseTo(0.975);
    expect(cut(run({ raw_tokens: 0 }))).toBeNull();
    expect(cut(run({ status: 'error' }))).toBeNull();
  });
});

describe('listStats', () => {
  it('counts what a list shrank, kept out, and failed', () => {
    const list = [run({ raw_tokens: 8000, returned_tokens: 200 }), run({ id: 'r2', status: 'error', raw_tokens: 900, returned_tokens: 0 }), run({ id: 'r3', raw_tokens: 20, returned_tokens: 20 })];
    expect(listStats(list)).toEqual({ runs: 3, shrunk: 1, saved: 7800, failed: 1 });
  });
  it('is all zeros for an empty list', () => {
    expect(listStats([])).toEqual({ runs: 0, shrunk: 0, saved: 0, failed: 0 });
  });
});

describe('the path of a request', () => {
  it('starts the timeline at authentication, which happens just before the run', () => {
    const steps: Trace = {
      run: run({ started_at: 100, ended_at: 104 }),
      spans: [span('auth', 99.9, 99.95, { name: 'authenticate', attrs: { caller: 'Codex (codex)', route: 'stdio' } }),
              span('ws', 99.95, 100, { name: 'workspace', attrs: { folder: 'C:\p', from: 'workspace_root' } }),
              span('pol', 100, 100.01, { name: 'policy', attrs: { rule: 'preset standard' } })],
      llm_calls: [], payloads: [],
    };
    const rows = waterfall(steps, 200);
    expect(rows[0].offset).toBe(0);
    expect(rows.map((r) => r.detail)).toEqual(['Codex (codex) · stdio', 'C:\p (from workspace_root)', 'allowed by preset standard']);
  });
});
