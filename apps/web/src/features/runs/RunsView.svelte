<!-- Runs: someone debugging opens this to find a specific call and see exactly what Saturn did with it.
     A filterable list (about 1 part) and the selected run's trace (about 1.618 parts). The filters live in
     the link, so a filtered view can be reached from the Overview and survives a reload. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import type { Harness, Run } from '../../lib/api/types';
  import { ago, compact, percent, toolName } from '../../lib/format';
  import { Resource } from '../../lib/live/resource.svelte';
  import { router } from '../../lib/state/router.svelte';
  import type { RunStatusFilter } from '../../lib/state/routes';
  import Freshness from '../../lib/ui/Freshness.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Stat from '../../lib/ui/Stat.svelte';
  import RunTrace from './RunTrace.svelte';
  import { cut, listStats } from './trace';

  const INTERVAL_MS = 5000;
  const LIMIT = 100;
  const TOOLS = ['saturn_run', 'saturn_read', 'saturn_search', 'saturn_ask', 'saturn_query', 'saturn_hook', 'model_check'];
  const STATUSES: { key: RunStatusFilter | undefined; label: string }[] = [
    { key: undefined, label: 'All' },
    { key: 'ok', label: 'Succeeded' },
    { key: 'error', label: 'Failed' },
    { key: 'running', label: 'Running' },
  ];

  const route = $derived(router.route);
  const status = $derived(route.name === 'runs' || route.name === 'run' ? route.status : undefined);
  const tool = $derived(route.name === 'runs' || route.name === 'run' ? route.tool : undefined);
  const harness = $derived(route.name === 'runs' || route.name === 'run' ? route.harness : undefined);
  let harnesses = $state<Harness[]>([]);
  api.connections().then((c) => (harnesses = c.harnesses)).catch(() => (harnesses = []));
  const selectedId = $derived(route.name === 'run' ? route.runId : null);

  let search = $state('');
  let applied = $state('');
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const feed = new Resource({
    fetch: (signal) => api.runs({ status, tool, harness, q: applied || undefined, limit: LIMIT }, signal),
    intervalMs: INTERVAL_MS,
  });
  $effect(() => feed.start());
  $effect(() => {
    void status, tool, harness, applied; // refetch at once when a filter changes
    feed.retry();
  });
  $effect(() => () => clearTimeout(debounce));

  function typed() {
    clearTimeout(debounce);
    debounce = setTimeout(() => (applied = search.trim()), 300);
  }

  function filter(next: { status?: RunStatusFilter; tool?: string; harness?: string }) {
    router.go(selectedId ? { name: 'run', runId: selectedId, ...next } : { name: 'runs', ...next }, true);
  }

  const runs = $derived(feed.data?.runs ?? []);
  const filtered = $derived(Boolean(status || tool || harness || applied));
  const now = $derived(feed.updatedAt ?? Date.now());
  const stats = $derived(listStats(runs));

  function label(run: Run): string {
    const share = cut(run);
    if (run.decision === 'refused') return 'refused';
    if (run.status === 'error') return 'failed';
    if (run.route === 'redirect') return 'redirected';
    if (run.status === 'running') return 'running';
    return share !== null && share > 0.005 ? `${percent(share)} less` : `${compact(run.returned_tokens)} tok`;
  }
</script>

<section class="view page on" class:reading={selectedId !== null} aria-label="Runs">
  <div class="page-head">
    <h1 class="display">Runs</h1>
    <Freshness phase={feed.phase} stale={feed.stale} updatedAt={feed.updatedAt} intervalMs={INTERVAL_MS} />
  </div>
  <nav class="tabs" aria-label="Activity">
    <a class="tab" href="#/runs" aria-current="page">What agents ran</a>
    <a class="tab" href="#/changes">What changed in Saturn</a>
  </nav>
  {#if runs.length}
    <div class="stats lede-stats">
      <Stat label={runs.length === LIMIT ? 'latest runs' : 'runs'} number={stats.runs} />
      <Stat label="shrunk" number={stats.shrunk} />
      <Stat label="tokens kept out" number={stats.saved} format={compact} />
      <Stat label="failed or refused" number={stats.failed} tone={stats.failed ? 'bad' : ''} href={stats.failed ? '#/runs?status=error' : undefined} />
    </div>
  {/if}

  <div class="filters">
    <div class="seg" role="group" aria-label="Outcome">
      {#each STATUSES as option (option.label)}
        <button aria-pressed={status === option.key} onclick={() => filter({ status: option.key, tool, harness })}>{option.label}</button>
      {/each}
    </div>
    <label class="sr-only" for="run-tool">Tool</label>
    <select id="run-tool" class="input" value={tool ?? ''} onchange={(e) => filter({ status, harness, tool: e.currentTarget.value || undefined })}>
      <option value="">All tools</option>
      {#each TOOLS as name (name)}<option value={name}>{toolName(name)}</option>{/each}
    </select>
    <label class="sr-only" for="run-harness">Harness</label>
    <select id="run-harness" class="input" value={harness ?? ''} onchange={(e) => filter({ status, tool, harness: e.currentTarget.value || undefined })}>
      <option value="">All harnesses</option>
      {#each harnesses as h (h.id)}<option value={h.id}>{h.name}{h.revoked_at !== null ? ' (revoked)' : ''}</option>{/each}
    </select>
    <input class="input grow" type="search" placeholder="Search commands, questions, errors" aria-label="Search runs" bind:value={search} oninput={typed} />
  </div>

  {#if feed.phase === 'loading'}
    <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:40%"></div></div>
  {:else if feed.phase === 'error'}
    <div class="card stack" style="max-width:560px">
      <h2>Cannot load runs</h2>
      <p class="muted-text" style="margin:0">{feed.error} Retrying automatically.</p>
      <div><button class="btn" onclick={() => feed.retry()}>Retry now</button></div>
    </div>
  {:else if runs.length === 0}
    <div class="card empty">
      <Icon name="runs" size={34} />
      {#if filtered}
        <div class="title">No runs match these filters</div>
        <button class="btn" onclick={() => ((search = ''), (applied = ''), router.go({ name: 'runs' }, true))}>Clear filters</button>
      {:else}
        <div class="title">No runs yet</div>
        <p class="muted-text" style="margin:0">Each call a coding agent makes to Saturn appears here with its trace.</p>
        <a class="btn" href="#/connections">Connect a coding agent</a>
      {/if}
    </div>
  {:else}
    {#if feed.stale}<div class="banner" role="status">Showing the last list received. Reconnecting…</div>{/if}
    <div class="master-detail" class:picked={selectedId !== null}>
      <div class="stack master">
        <div class="list" role="listbox" aria-label="Runs, newest first">
          {#each runs as run (run.id)}
            <button
              class="list-row"
              role="option"
              aria-selected={selectedId === run.id}
              aria-current={selectedId === run.id ? 'true' : undefined}
              onclick={() => router.go({ name: 'run', runId: run.id, status, tool, harness })}
            >
              <span class="tag">{toolName(run.tool)}</span>
              <span class="main-text">
                <span class="mono">{run.summary || '(no input)'}</span>
                <small>{ago(run.started_at, now)}{run.client && !harness ? ` · ${run.client.replace(/ \([a-z0-9-]+\)$/, '')}` : ''}{run.raw_tokens > run.returned_tokens && run.status === 'ok' ? ` · ${compact(run.raw_tokens)} tokens became ${compact(run.returned_tokens)}` : ''}{run.llm_calls ? ` · ${run.llm_calls} model ${run.llm_calls === 1 ? 'call' : 'calls'}` : ''}</small>
              </span>
              <span class="end">
                <span class="chip" class:bad={run.status === 'error'} class:live={run.status === 'running'}>
                  {#if run.status === 'error'}<Icon name="alert" size={14} />{:else if run.status === 'running'}<Icon name="clock" size={14} />{/if}{label(run)}
                </span>
              </span>
            </button>
          {/each}
        </div>
        {#if runs.length === LIMIT}<p class="caption" style="margin:0">Latest {LIMIT} shown. Filter to reach older runs.</p>{/if}
      </div>

      <div class="stack detail">
        {#if selectedId}
          <div class="back"><button class="btn sm plain" onclick={() => router.go({ name: 'runs', status, tool, harness })}><Icon name="back" size={16} />Back to all runs</button></div>
          {#key selectedId}<RunTrace runId={selectedId} />{/key}
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
  .filters select { width: auto; min-width: 140px; }
  .tabs { margin-bottom: var(--space-2); }
  .tabs a { text-decoration: none; display: inline-flex; align-items: center; }
  .tabs a[aria-current='page'] { color: var(--text); border-bottom-color: var(--accent); }
  .filters input { min-width: 200px; }
  .list-row { padding-block: var(--space-2); }
  .detail { container-type: inline-size; min-width: 0; }
  .chip { color: var(--text-muted); white-space: nowrap; }
  .chip.bad { color: var(--danger); }
  .chip.live { color: var(--accent-bright); }
  @media (max-width: 900px) {
    .picked .master { display: none; }
    .reading .filters, .reading .lede-stats { display: none; }
  }
</style>
