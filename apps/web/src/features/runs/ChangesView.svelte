<!-- Changes: someone opens this to find out who changed Saturn and when — access, settings, the command policy,
     client installs, model loads, and restarts — and leaves knowing what is different now and why. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import type { AuditEvent, AuditKind } from '../../lib/api/types';
  import { ago } from '../../lib/format';
  import { Resource } from '../../lib/live/resource.svelte';
  import Freshness from '../../lib/ui/Freshness.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Stat from '../../lib/ui/Stat.svelte';

  const INTERVAL_MS = 10_000;
  const KINDS: { key: AuditKind | null; label: string }[] = [
    { key: null, label: 'All' }, { key: 'access', label: 'Access' }, { key: 'install', label: 'Clients' },
    { key: 'policy', label: 'Policy' }, { key: 'settings', label: 'Settings' }, { key: 'model', label: 'Model' },
    { key: 'service', label: 'Service' },
  ];
  const ACTOR: Record<string, string> = { dashboard: 'Dashboard', terminal: 'Terminal', file: 'File edit', service: 'Saturn' };

  let kind = $state<AuditKind | null>(null);
  let openSeq = $state<number | null>(null);
  const feed = new Resource({ fetch: (signal) => api.events(kind, signal), intervalMs: INTERVAL_MS });
  $effect(() => feed.start());
  $effect(() => {
    void kind;
    feed.retry();
  });

  const events = $derived(feed.data?.events ?? []);
  const now = $derived(feed.updatedAt ?? Date.now());
  const today = $derived(events.filter((e) => now / 1000 - e.at < 86_400));
  const rejected = $derived(events.filter((e) => e.action === 'rejected').length);

  function sentence(e: AuditEvent): string {
    const subject = e.subject.replace(/ \(([a-z0-9-]+)\)$/, '');
    switch (e.kind) {
      case 'access': return `${subject} ${({ created: 'was created', updated: 'was edited', rotated: 'got a new token', revoked: 'was revoked', enabled: 'was enabled', disabled: 'was disabled' } as Record<string, string>)[e.action] ?? e.action}`;
      case 'install': return `${subject} ${e.action === 'installed' ? 'was connected' : 'was disconnected'}`;
      case 'policy': return e.action === 'rejected' ? 'An edit to policy.toml was not applied' : 'The command policy changed';
      case 'settings': return 'Settings changed';
      case 'model': return `${subject} ${e.action}`;
      default: return `Saturn ${e.action}`;
    }
  }
</script>

<section class="view page on" aria-label="Changes">
  <div class="page-head">
    <h1 class="display">Runs</h1>
    <Freshness phase={feed.phase} stale={feed.stale} updatedAt={feed.updatedAt} intervalMs={INTERVAL_MS} />
  </div>
  <nav class="tabs" aria-label="Activity">
    <a class="tab" href="#/runs">What agents ran</a>
    <a class="tab" href="#/changes" aria-current="page">What changed in Saturn</a>
  </nav>

  {#if events.length}
    <div class="stats">
      <Stat label="changes shown" number={events.length} />
      <Stat label="in the last day" number={today.length} />
      <Stat label="edits not applied" number={rejected} tone={rejected ? 'warn' : ''} />
    </div>
  {/if}

  <div class="seg" role="group" aria-label="Kind of change">
    {#each KINDS as option (option.label)}
      <button aria-pressed={kind === option.key} onclick={() => (kind = option.key)}>{option.label}</button>
    {/each}
  </div>

  {#if feed.phase === 'loading'}
    <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>
  {:else if feed.phase === 'error'}
    <div class="card stack" style="max-width:560px">
      <h2>Cannot load changes</h2>
      <p class="muted-text" style="margin:0">{feed.error} Retrying automatically.</p>
      <div><button class="btn" onclick={() => feed.retry()}>Retry now</button></div>
    </div>
  {:else if events.length === 0}
    <div class="card empty">
      <Icon name="history" size={34} />
      <div class="title">{kind ? 'No changes of this kind yet' : 'No changes yet'}</div>
      <p class="muted-text" style="margin:0">Creating a harness, connecting a client, or editing settings or the policy appears here, with who did it.</p>
    </div>
  {:else}
    {#if feed.stale}<div class="banner" role="status">Showing the last list received. Reconnecting…</div>{/if}
    <ol class="card log">
      {#each events as e (e.seq)}
        <li class:warn={e.action === 'rejected'}>
          <button class="row" aria-expanded={openSeq === e.seq} disabled={!e.detail} onclick={() => (openSeq = openSeq === e.seq ? null : e.seq)}>
            <span class="tag">{e.kind}</span>
            <span class="what">{sentence(e)}</span>
            <span class="chip">{ACTOR[e.actor] ?? e.actor}</span>
            <time class="caption" title={new Date(e.at * 1000).toLocaleString()}>{ago(e.at, now)}</time>
          </button>
          {#if openSeq === e.seq && e.detail}<p class="detail mono reveal">{e.detail}</p>{/if}
        </li>
      {/each}
    </ol>
    {#if events.length === 200}<p class="caption">Latest 200 shown. <span class="mono">saturn events --limit 200 --kind …</span> reads the same log from a terminal.</p>{/if}
  {/if}
</section>

<style>
  .tabs { margin-bottom: var(--space-2); }
  .tabs a { text-decoration: none; display: inline-flex; align-items: center; }
  .tabs a[aria-current='page'] { color: var(--text); border-bottom-color: var(--accent); }
  .seg { flex-wrap: wrap; align-self: start; }
  .log { list-style: none; margin: 0; padding: 0; }
  .log li { border-top: 1px solid var(--border); }
  .log li:first-child { border-top: 0; }
  .row { width: 100%; display: grid; grid-template-columns: 76px minmax(0, 1fr) auto auto; gap: var(--space-3); align-items: center; min-height: var(--target-min);
         padding: var(--space-2) var(--space-3); background: none; border: 0; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .row:disabled { cursor: default; }
  .row:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .what { overflow-wrap: anywhere; }
  .warn .what { color: var(--warning); }
  .chip { color: var(--text-muted); white-space: nowrap; }
  time { white-space: nowrap; }
  .detail { margin: 0; padding: 0 var(--space-3) var(--space-3) calc(76px + 2 * var(--space-3)); font-size: var(--text-caption); color: var(--text-muted); overflow-wrap: anywhere; white-space: pre-wrap; }
  @container app (max-width: 760px) {
    .row { grid-template-columns: minmax(0, 1fr) auto; }
    .row .tag, .row .chip { display: none; }
    .detail { padding-left: var(--space-3); }
  }
</style>
