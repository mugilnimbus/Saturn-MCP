/* Visibility-aware polling (the design system's live.js rules, as a class).

   - One loop per resource; at most one request in flight; the next poll is scheduled after the
     current one finishes, never on a fixed clock.
   - Paused while the tab is hidden or the device is offline; the request in flight is cancelled and
     its late result ignored. On return it polls at once.
   - refresh() asks for a poll now (for example after the user changed something). If a request is
     already running, one more poll follows it, so the result always reflects the change.
   - Errors back off exponentially with jitter, capped at maxBackoffMs, and reset on success.

   Regression note: an earlier version let a hide/show during a slow request leave the loop without a
   next poll. pause() now clears the in-flight flag, and only the current generation may touch state. */

export interface PollOptions<T> {
  fetch: (signal: AbortSignal) => Promise<T>;
  onData: (data: T) => void;
  onError?: (error: unknown) => void;
  intervalMs: number;
  maxBackoffMs?: number;
}

export class Poller<T> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private controller: AbortController | null = null;
  private running = false;
  private inFlight = false;
  private again = false;
  private generation = 0;
  private failures = 0;
  private readonly onVisibility = () => (document.hidden ? this.pause() : this.refresh());
  private readonly onOnline = () => this.refresh();
  private readonly onOffline = () => this.pause();

  constructor(private readonly opts: PollOptions<T>) {}

  start(): () => void {
    this.running = true;
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    this.refresh();
    return () => this.stop();
  }

  stop(): void {
    this.running = false;
    this.pause();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }

  /** Poll now, then continue on the interval. */
  refresh(): void {
    if (!this.running || !this.active()) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.inFlight) this.again = true;
    else void this.tick();
  }

  private active(): boolean {
    return !document.hidden && navigator.onLine !== false;
  }

  private pause(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.generation += 1; // a result still on its way is for an old generation and is ignored
    this.controller?.abort();
    this.controller = null;
    this.inFlight = false;
    this.again = false;
  }

  private async tick(): Promise<void> {
    this.inFlight = true;
    const generation = ++this.generation;
    const controller = (this.controller = new AbortController());
    try {
      const data = await this.opts.fetch(controller.signal);
      if (generation !== this.generation) return;
      this.failures = 0;
      this.opts.onData(data);
    } catch (error) {
      if (generation !== this.generation) return;
      this.failures += 1;
      this.opts.onError?.(error);
    } finally {
      if (generation === this.generation) {
        this.inFlight = false;
        this.controller = null;
        if (this.running && this.active()) {
          if (this.again) {
            this.again = false;
            void this.tick();
          } else this.schedule();
        }
      }
    }
  }

  private schedule(): void {
    const backoff = this.failures
      ? Math.min(this.opts.maxBackoffMs ?? 60_000, this.opts.intervalMs * 2 ** this.failures)
      : this.opts.intervalMs;
    this.timer = setTimeout(() => void this.tick(), backoff * (0.9 + Math.random() * 0.2));
  }
}
