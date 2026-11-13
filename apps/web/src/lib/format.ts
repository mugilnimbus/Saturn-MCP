/* Number, duration, and time formatting used across screens. Pure, so it is unit tested. */

/** 1234 -> "1,234"; 12345 -> "12.3k"; 1234567 -> "1.23M". Token counts read better short. */
export function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs < 10_000) return Math.round(value).toLocaleString('en-US');
  if (abs < 1_000_000) return `${(value / 1000).toFixed(abs < 100_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(2)}M`;
}

export function percent(share: number | null, digits = 0): string {
  return share === null || !Number.isFinite(share) ? '–' : `${(share * 100).toFixed(digits)}%`;
}

/** Seconds as "340 ms", "2.4 s", or "1 min 12 s". */
export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '–';
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
}

export function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

/** A clock time for an epoch in seconds, 24-hour, with the date when it is not today. */
export function clock(epochSeconds: number, now = Date.now()): string {
  const date = new Date(epochSeconds * 1000);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const sameDay = new Date(now).toDateString() === date.toDateString();
  return sameDay ? time : `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${time}`;
}

export function ago(epochSeconds: number, now = Date.now()): string {
  const seconds = Math.max(0, now / 1000 - epochSeconds);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${Math.floor(seconds)} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86_400)} d ago`;
}

export const WINDOW_LABEL: Record<string, string> = {
  '15m': 'last 15 minutes',
  '1h': 'last hour',
  '6h': 'last 6 hours',
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
};

/** "saturn_run" -> "run". The prefix is noise once you are inside Saturn's own dashboard. */
export const toolName = (tool: string): string => tool.replace(/^saturn_/, '');

const ROUTE_LABEL: Record<string, string> = {
  inline: 'Returned as is',
  digest: 'Code digest',
  'digest+llm': 'Digest with model',
  outline: 'File outline',
  agent: 'Worker agent',
  query: 'Artifact lookup',
  error: 'Refused or failed',
  redirect: 'Sent to saturn_run',
  model_check: 'Model test',
};

export const routeLabel = (route: string): string => ROUTE_LABEL[route] ?? (route || 'In progress');
