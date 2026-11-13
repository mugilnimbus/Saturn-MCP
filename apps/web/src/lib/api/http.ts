/* HTTP to the backend: same origin, JSON in and out, problem+json errors as ApiError.
   Identical GETs in flight are shared, every request has a timeout and can be cancelled, and
   state-changing calls carry the client header the backend may require from browsers. */

import { config } from '../../config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
  /** Status 0 means the request never got an answer (offline, timeout, cancelled). */
  get offline(): boolean {
    return this.status === 0;
  }
}

const TIMEOUT_MS = 20_000;
const inflight = new Map<string, Promise<unknown>>();

async function send<T>(method: string, path: string, body?: unknown, signal?: AbortSignal, timeoutMs = TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      signal: controller.signal,
      headers: {
        ...(method !== 'GET' ? { [config.clientHeader.name]: config.clientHeader.value } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    throw new ApiError(0, aborted ? 'timeout' : 'offline', aborted ? 'The request timed out.' : 'Cannot reach the server.');
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? safeJson(text) : undefined;
  if (!response.ok) {
    const problem = (data ?? {}) as { code?: string; detail?: unknown; title?: string };
    // The service answers with `detail` as a sentence, or as a list of field problems for invalid input.
    const first = Array.isArray(problem.detail) ? (problem.detail[0] as { msg?: string } | undefined)?.msg : problem.detail;
    throw new ApiError(response.status, problem.code ?? 'error', (typeof first === 'string' && first) || problem.title || response.statusText);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Identical GETs made at the same time share one request (not when a caller passes its own signal). */
export function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (signal) return send<T>('GET', path, undefined, signal);
  const existing = inflight.get(path);
  if (existing) return existing as Promise<T>;
  const request = send<T>('GET', path).finally(() => inflight.delete(path));
  inflight.set(path, request);
  return request;
}

export const post = <T>(path: string, body?: unknown) => send<T>('POST', path, body);
export const put = <T>(path: string, body: unknown) => send<T>('PUT', path, body);
export const patch = <T>(path: string, body: unknown) => send<T>('PATCH', path, body);
export const del = <T>(path: string) => send<T>('DELETE', path);

export function query(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}
