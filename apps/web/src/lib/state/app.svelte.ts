/* App-wide state: whether the service and its local server answer, and toasts.
   Screen data lives in each screen's own Resource. */

import { api } from '../api/client';
import type { Ready } from '../api/types';
import { Poller } from '../live/poll';

export type ConnectionState = 'connecting' | 'live' | 'offline';

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'ok' | 'warn' | 'bad';
  action?: { label: string; run: () => void };
}

class AppState {
  ready = $state<Ready | null>(null);
  connection = $state<ConnectionState>('connecting');
  toasts = $state<Toast[]>([]);
  private toastId = 0;

  private readyPoll = new Poller<Ready>({
    fetch: (signal) => api.ready(signal),
    intervalMs: 10_000,
    onData: (ready) => {
      this.ready = ready;
      this.connection = 'live';
    },
    onError: () => (this.connection = 'offline'),
  });

  start(): void {
    this.readyPoll.start();
  }

  /** True when Saturn answers but its local server does not: digests still work, the worker does not. */
  /** No worker model is selected: digests are made by code, which is a choice, not a fault. */
  get noModel(): boolean {
    return this.ready !== null && !this.ready.worker_model;
  }

  get modelDown(): boolean {
    return this.ready !== null && Boolean(this.ready.worker_model) && !(this.ready.local_server.reachable && this.ready.local_server.authorized);
  }

  toast(text: string, tone: Toast['tone'] = 'info', action?: Toast['action']): void {
    const toast = { id: ++this.toastId, text, tone, action };
    this.toasts = [...this.toasts.slice(-3), toast];
    setTimeout(() => this.dismiss(toast.id), action ? 12_000 : 5_000);
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}

export const app = new AppState();
