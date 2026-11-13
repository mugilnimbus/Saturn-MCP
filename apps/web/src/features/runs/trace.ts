/* Turns a run's spans and model calls into waterfall rows and a one-sentence summary.
   Pure, so it is unit tested. */

import type { LlmCall, Run, Span, Trace } from '../../lib/api/types';
import { compact, duration, percent } from '../../lib/format';

export interface Row {
  id: string;
  label: string;
  kind: 'step' | 'command' | 'graph_node' | 'llm';
  depth: number;
  /** Position and size along the run, both 0..1. */
  offset: number;
  width: number;
  seconds: number | null;
  status: string;
  detail: string;
  call?: LlmCall;
}

const KIND_LABEL: Record<string, string> = { command: 'Command', graph_node: 'Graph step', llm: 'Model call', step: 'Step' };
export const kindLabel = (kind: string): string => KIND_LABEL[kind] ?? kind;

function spanDetail(span: Span): string {
  const a = span.attrs;
  if (span.kind === 'command') {
    const parts = [a.timed_out ? 'timed out' : a.exit_code !== undefined ? `exit ${a.exit_code}` : '', typeof a.bytes === 'number' ? `${compact(a.bytes)} bytes` : ''];
    return parts.filter(Boolean).join(', ');
  }
  if (span.name === 'deterministic_digest') return [a.kind, typeof a.findings === 'number' ? `${a.findings} findings` : ''].filter(Boolean).join(', ');
  if (span.name === 'authenticate') return [a.caller, a.route, a.protocol ? `MCP ${a.protocol}` : ''].filter((v) => typeof v === 'string' && v).join(' · ');
  if (span.name === 'workspace') return typeof a.folder === 'string' ? `${a.folder}${typeof a.from === 'string' ? ` (from ${a.from})` : ''}` : '';
  if (span.name === 'policy') return typeof a.rule === 'string' ? `allowed by ${a.rule}` : typeof a.reason === 'string' ? a.reason : '';
  return typeof a.error === 'string' ? a.error : '';
}

export function waterfall(trace: Trace, now = Date.now() / 1000): Row[] {
  // Authentication and workspace selection happen just before the run starts; the timeline begins with them.
  const start = Math.min(trace.run.started_at, ...trace.spans.map((s) => s.started_at));
  const end = Math.max(trace.run.ended_at ?? now, start + 0.001);
  const total = end - start;
  const depthOf = new Map<string, number>();
  const byId = new Map(trace.spans.map((s) => [s.id, s]));
  const depth = (span: Span): number => {
    const known = depthOf.get(span.id);
    if (known !== undefined) return known;
    const parent = span.parent_id ? byId.get(span.parent_id) : undefined;
    const value = parent && parent.id !== span.id ? Math.min(6, depth(parent) + 1) : 0;
    depthOf.set(span.id, value);
    return value;
  };
  const place = (from: number, to: number | null) => {
    const offset = Math.min(1, Math.max(0, (from - start) / total));
    const width = to === null ? 1 - offset : Math.min(1 - offset, Math.max(0, (to - from) / total));
    return { offset, width: Math.max(width, 0.004), seconds: to === null ? null : to - from };
  };
  const rows: (Row & { at: number })[] = trace.spans.map((span) => ({
    id: span.id,
    label: span.name.replace(/_/g, ' '),
    kind: (['command', 'graph_node', 'step'].includes(span.kind) ? span.kind : 'step') as Row['kind'],
    depth: depth(span),
    status: span.status,
    detail: spanDetail(span),
    at: span.started_at,
    ...place(span.started_at, span.ended_at),
  }));
  for (const call of trace.llm_calls) {
    const parent = call.span_id ? byId.get(call.span_id) : undefined;
    rows.push({
      id: call.id,
      label: call.purpose || 'model call',
      kind: 'llm',
      depth: parent ? depth(parent) + 1 : 0,
      status: call.status,
      detail: `${compact(call.input_tokens)} in, ${compact(call.output_tokens)} out${call.reasoning_tokens ? `, ${compact(call.reasoning_tokens)} reasoning` : ''}`,
      call,
      at: call.started_at + 1e-6, // after the step that issued it
      ...place(call.started_at, call.ended_at),
    });
  }
  return rows.sort((a, b) => a.at - b.at).map(({ at: _at, ...row }) => row);
}

export interface Summary {
  mood: 'focus' | 'warm' | 'alert';
  lead: string;
  rest: string;
}

export function summarize(run: Run): Summary {
  const took = run.ended_at ? ` in ${duration(run.ended_at - run.started_at)}` : '';
  if (run.status === 'running') return { mood: 'focus', lead: 'Still running.', rest: ' The trace fills in as steps finish.' };
  if (run.status === 'error') {
    const refused = (run.error ?? '').startsWith('policy_violation');
    return { mood: refused ? 'warm' : 'alert', lead: refused ? 'Refused by policy.' : 'Failed.', rest: ` ${(run.error ?? 'No reason was recorded.').replace(/^[a-z_]+: /, '')}` };
  }
  const { raw_tokens: raw, returned_tokens: ret } = run;
  if (raw > ret && raw > 0) {
    return { mood: 'focus', lead: `Returned ${compact(ret)} tokens instead of ${compact(raw)}`, rest: ` (${percent(1 - ret / raw)} less)${took}.` };
  }
  return { mood: 'focus', lead: `Returned ${compact(ret)} tokens`, rest: `${took}; short enough to pass through unchanged.` };
}

/** Share cut for a list row, or null when there was nothing to cut. */
export function cut(run: Run): number | null {
  return run.raw_tokens > 0 && run.status === 'ok' ? 1 - run.returned_tokens / run.raw_tokens : null;
}

/** The figures above a list of runs: how many, how many were shrunk, what that kept out, and how many failed. */
export function listStats(runs: Run[]): { runs: number; shrunk: number; saved: number; failed: number } {
  const ok = runs.filter((r) => r.status === 'ok' && r.raw_tokens > r.returned_tokens);
  return {
    runs: runs.length,
    shrunk: ok.length,
    saved: ok.reduce((sum, r) => sum + r.raw_tokens - r.returned_tokens, 0),
    failed: runs.filter((r) => r.status === 'error').length,
  };
}
