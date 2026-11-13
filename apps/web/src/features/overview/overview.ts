/* The story behind the Overview numbers: totals become a headline sentence and a mood.
   Pure, so it is unit tested. Strong moods are reserved for things that need attention. */

import type { Bucket, RouteRow, Run, Totals } from '../../lib/api/types';
import { compact, percent } from '../../lib/format';
import type { Series } from '../../lib/ui/chart';

export type Mood = 'focus' | 'warm' | 'alert';

export interface Story {
  mood: Mood;
  /** The emphasized opening of the headline, then the rest of the sentence. */
  lead: string;
  rest: string;
}

export function failureMood(runs: number, errors: number): Mood {
  if (runs >= 5 && errors / runs >= 0.5) return 'alert';
  if (errors > 0 && errors / Math.max(1, runs) >= 0.2) return 'warm';
  return 'focus';
}

export function story(totals: Totals, period: string, modelDown: boolean): Story {
  const { runs, errors, saved_tokens: saved } = totals;
  const outage = modelDown ? ' The local server is not answering, so only code digests are available.' : '';
  if (runs === 0) {
    return {
      mood: modelDown ? 'warm' : 'focus',
      lead: 'Nothing has run',
      rest: ` in the ${period}. Results appear here as soon as a coding agent calls Saturn.${outage}`,
    };
  }
  const failed = errors > 0 ? ` ${errors} of ${runs} runs failed or were refused.` : '';
  const mood = modelDown && failureMood(runs, errors) === 'focus' ? 'warm' : failureMood(runs, errors);
  const many = runs === 1 ? '1 run' : `${runs} runs`;
  if (saved > 0) {
    return {
      mood,
      lead: `${compact(saved)} tokens kept out of your agent's context`,
      rest: ` in the ${period}, across ${many}.${failed}${outage}`,
    };
  }
  if (saved === 0) {
    return { mood, lead: 'Nothing needed shrinking', rest: ` in the ${period}: ${many}, all short enough to return as they were.${failed}${outage}` };
  }
  return {
    mood,
    lead: 'Follow-up lookups returned more than was withheld',
    rest: ` in the ${period} (${compact(-saved)} tokens more, across ${many}). That is expected when earlier output is being queried.${failed}${outage}`,
  };
}

export function contextSeries(buckets: Bucket[]): Series[] {
  return [
    { id: 'raw', label: 'Raw output', values: buckets.map((b) => b.raw_tokens) },
    { id: 'returned', label: 'Returned to the agent', values: buckets.map((b) => b.returned_tokens) },
  ];
}

export function modelSeries(buckets: Bucket[]): Series[] {
  return [
    { id: 'in', label: 'Input', values: buckets.map((b) => b.llm_in) },
    { id: 'out', label: 'Output', values: buckets.map((b) => b.llm_out) },
    { id: 'reasoning', label: 'Reasoning', values: buckets.map((b) => b.llm_reasoning) },
  ];
}

/** "1 min", "15 min", "2 h", "1 day": the size of one chart sample. */
export function bucketLabel(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86_400)} day`;
}

/** Axis time for a bucket start: a clock time for short buckets, a date for day-sized ones. */
export function bucketTime(epochSeconds: number, bucketSeconds: number): string {
  const date = new Date(epochSeconds * 1000);
  if (bucketSeconds >= 86_400) return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return bucketSeconds >= 7200 ? `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${time}` : time;
}

/** One stage of the path from raw output to what the agent received. */
export interface Stage {
  id: 'produced' | 'shrunk' | 'reached';
  label: string;
  value: string;
  unit: string;
  caption: string;
}

const CODE_ROUTES = ['digest', 'outline'];
const MODEL_ROUTES = ['digest+llm', 'agent'];

/** The period as three stages: what was produced, how it was shrunk, and what reached the agent. */
export function journey(totals: Totals, routes: RouteRow[]): Stage[] {
  const count = (names: string[]) => routes.filter((r) => names.includes(r.route)).reduce((sum, r) => sum + r.runs, 0);
  const code = count(CODE_ROUTES);
  const model = count(MODEL_ROUTES);
  const passed = count(['inline']);
  const how = [code ? `${code} by code` : '', model ? `${model} with the model` : ''].filter(Boolean).join(', ') || 'nothing was long enough';
  const share = totals.raw_tokens > 0 ? totals.returned_tokens / totals.raw_tokens : null;
  return [
    { id: 'produced', label: 'Produced', value: compact(totals.raw_tokens), unit: 'tokens', caption: `raw output of ${plural(totals.runs, 'run')}` },
    { id: 'shrunk', label: 'Shrunk', value: compact(code + model), unit: code + model === 1 ? 'run' : 'runs', caption: `${how}${passed ? `; ${passed} short enough to pass through` : ''}` },
    { id: 'reached', label: 'Reached the agent', value: compact(totals.returned_tokens), unit: 'tokens', caption: share === null ? 'nothing was measured' : `${percent(share, share < 0.1 ? 1 : 0)} of the raw output` },
  ];
}

const plural = (n: number, word: string): string => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

/** A run worth a second look: one of the largest savings, or a failure. */
export interface Highlight {
  id: string;
  kind: 'saved' | 'failed';
  title: string;
  text: string;
  at: number;
}

/** The largest savings first, then the most recent failures: the runs that explain the period's numbers. */
export function highlights(runs: Run[], limit = 3): Highlight[] {
  const saved = runs
    .filter((r) => r.status === 'ok' && r.raw_tokens - r.returned_tokens > 0)
    .sort((a, b) => b.raw_tokens - b.returned_tokens - (a.raw_tokens - a.returned_tokens))
    .slice(0, limit)
    .map((r): Highlight => ({
      id: r.id, kind: 'saved', title: r.summary || '(no input)', at: r.started_at,
      text: `${compact(r.raw_tokens)} tokens became ${compact(r.returned_tokens)}, ${percent(1 - r.returned_tokens / r.raw_tokens)} less`,
    }));
  const failed = runs
    .filter((r) => r.status === 'error')
    .sort((a, b) => b.started_at - a.started_at)
    .slice(0, limit)
    .map((r): Highlight => ({
      id: r.id, kind: 'failed', title: r.summary || '(no input)', at: r.started_at,
      text: (r.error ?? 'No reason was recorded.').replace(/^[a-z_]+: /, ''),
    }));
  return [...saved, ...failed];
}
