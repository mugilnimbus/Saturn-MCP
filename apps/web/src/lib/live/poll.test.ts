import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Poller } from './poll';

/* A tiny document/window so the poller can run in a node test. */
function stubBrowser() {
  const listeners = new Map<string, Set<() => void>>();
  const target = {
    addEventListener: (type: string, fn: () => void) => (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn),
    removeEventListener: (type: string, fn: () => void) => listeners.get(type)?.delete(fn),
  };
  const doc = { ...target, hidden: false };
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', target);
  vi.stubGlobal('navigator', { onLine: true });
  return {
    setHidden(hidden: boolean) {
      doc.hidden = hidden;
      listeners.get('visibilitychange')?.forEach((fn) => fn());
    },
    fire: (type: string) => listeners.get(type)?.forEach((fn) => fn()),
  };
}

/** A fetch whose responses the test releases by hand. */
function controlledFetch() {
  const pending: { resolve: (v: number) => void; reject: (e: unknown) => void; signal: AbortSignal }[] = [];
  const fetch = (signal: AbortSignal) => new Promise<number>((resolve, reject) => pending.push({ resolve, reject, signal }));
  return { fetch, pending };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('Poller', () => {
  let browser: ReturnType<typeof stubBrowser>;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor 1.0
    browser = stubBrowser();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('schedules the next poll after the current one finishes, with one request at a time', async () => {
    const { fetch, pending } = controlledFetch();
    const got: number[] = [];
    const poller = new Poller({ fetch, onData: (d) => got.push(d), intervalMs: 1000 });
    poller.start();
    expect(pending).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(5000); // slow response: nothing else is requested
    expect(pending).toHaveLength(1);
    pending[0].resolve(1);
    await flush();
    expect(got).toEqual([1]);
    await vi.advanceTimersByTimeAsync(999);
    expect(pending).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(pending).toHaveLength(2);
    poller.stop();
  });

  it('keeps polling after the tab is hidden and shown while a request is slow (regression)', async () => {
    const { fetch, pending } = controlledFetch();
    const got: number[] = [];
    const poller = new Poller({ fetch, onData: (d) => got.push(d), intervalMs: 1000 });
    poller.start();
    browser.setHidden(true);
    expect(pending[0].signal.aborted).toBe(true);
    browser.setHidden(false);
    expect(pending).toHaveLength(2); // polled again on return, did not wait for the old request
    pending[0].resolve(111); // the old request finally answers: ignored
    pending[1].resolve(222);
    await flush();
    expect(got).toEqual([222]);
    await vi.advanceTimersByTimeAsync(1001);
    expect(pending).toHaveLength(3); // and the loop is still alive
    poller.stop();
  });

  it('does not poll while hidden and polls at once when visible again', async () => {
    const { fetch, pending } = controlledFetch();
    const poller = new Poller({ fetch, onData: () => undefined, intervalMs: 1000 });
    poller.start();
    pending[0].resolve(1);
    await flush();
    browser.setHidden(true);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(pending).toHaveLength(1);
    browser.setHidden(false);
    expect(pending).toHaveLength(2);
    poller.stop();
  });

  it('backs off after errors and resets after a success', async () => {
    const { fetch, pending } = controlledFetch();
    const errors: unknown[] = [];
    const poller = new Poller({ fetch, onData: () => undefined, onError: (e) => errors.push(e), intervalMs: 1000, maxBackoffMs: 8000 });
    poller.start();
    pending[0].reject(new Error('down'));
    await flush();
    await vi.advanceTimersByTimeAsync(1999);
    expect(pending).toHaveLength(1); // first retry waits 2 s
    await vi.advanceTimersByTimeAsync(2);
    expect(pending).toHaveLength(2);
    pending[1].reject(new Error('down'));
    await flush();
    await vi.advanceTimersByTimeAsync(4001); // then 4 s
    expect(pending).toHaveLength(3);
    pending[2].resolve(7);
    await flush();
    await vi.advanceTimersByTimeAsync(1001); // success: back to the normal interval
    expect(pending).toHaveLength(4);
    expect(errors).toHaveLength(2);
    poller.stop();
  });

  it('a refresh during a request is followed by exactly one more poll', async () => {
    const { fetch, pending } = controlledFetch();
    const got: number[] = [];
    const poller = new Poller({ fetch, onData: (d) => got.push(d), intervalMs: 1000 });
    poller.start();
    poller.refresh();
    poller.refresh();
    expect(pending).toHaveLength(1);
    pending[0].resolve(1);
    await flush();
    expect(pending).toHaveLength(2);
    pending[1].resolve(2);
    await flush();
    expect(got).toEqual([1, 2]);
    expect(pending).toHaveLength(2);
    poller.stop();
  });

  it('stops polling and cancels the request on stop()', async () => {
    const { fetch, pending } = controlledFetch();
    const poller = new Poller({ fetch, onData: () => undefined, intervalMs: 1000 });
    poller.start();
    poller.stop();
    expect(pending[0].signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(pending).toHaveLength(1);
  });

  it('pauses when offline and resumes when back online', async () => {
    const { fetch, pending } = controlledFetch();
    const poller = new Poller({ fetch, onData: () => undefined, intervalMs: 1000 });
    poller.start();
    pending[0].resolve(1);
    await flush();
    vi.stubGlobal('navigator', { onLine: false });
    browser.fire('offline');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(pending).toHaveLength(1);
    vi.stubGlobal('navigator', { onLine: true });
    browser.fire('online');
    expect(pending).toHaveLength(2);
    poller.stop();
  });
});
