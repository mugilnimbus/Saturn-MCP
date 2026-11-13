/* A polled value with an honest loading state.

   phase: 'loading' (no answer yet), 'ready' (have data; `error` is set when the latest refresh failed,
   so the data is stale), 'error' (nothing to show, and the request failed).
   Screens must show a skeleton while loading and an error with a retry on 'error'. "No data" belongs
   only to a successful answer that is really empty. */

import { untrack } from 'svelte';
import { errorText } from '../api/errors';
import { Poller } from './poll';

export type Phase = 'loading' | 'ready' | 'error';

export class Resource<T> {
  data = $state.raw<T | null>(null);
  error = $state<string | null>(null);
  phase = $state<Phase>('loading');
  /** When the last successful answer arrived (ms since epoch). */
  updatedAt = $state<number | null>(null);
  readonly stale = $derived(this.phase === 'ready' && this.error !== null);

  private readonly poller: Poller<T>;

  constructor(opts: { fetch: (signal: AbortSignal) => Promise<T>; intervalMs: number; maxBackoffMs?: number }) {
    this.poller = new Poller<T>({
      ...opts,
      onData: (data) => {
        this.data = data;
        this.error = null;
        this.phase = 'ready';
        this.updatedAt = Date.now();
      },
      onError: (error) => {
        this.error = errorText(error);
        if (this.data === null) this.phase = 'error';
      },
    });
  }

  /** Begin polling; returns the function that stops it (call it when the screen goes away). */
  start(): () => void {
    return untrack(() => this.poller.start());
  }

  /** Try again now; shows the loading state again if there is no data yet. */
  retry(): void {
    // A calling effect tracks its filters, not the response or incidental reads in fetch.
    untrack(() => {
      if (this.data === null) this.phase = 'loading';
      this.poller.refresh();
    });
  }
}
