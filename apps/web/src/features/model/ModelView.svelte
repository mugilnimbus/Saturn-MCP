<!-- Model: someone opens this to check that the local server answers and what the worker model is costing.
     Server state first, then usage by model and by purpose for the chosen period. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import type { WindowKey } from '../../lib/api/types';
  import { WINDOW_LABEL, compact, duration, percent } from '../../lib/format';
  import { Resource } from '../../lib/live/resource.svelte';
  import Freshness from '../../lib/ui/Freshness.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import ValueTile from '../../lib/ui/ValueTile.svelte';

  const INTERVAL_MS = 10_000;
  const WINDOWS: { key: WindowKey; label: string }[] = [
    { key: '1h', label: '1 hour' },
    { key: '24h', label: '24 hours' },
    { key: '7d', label: '7 days' },
  ];

  let period = $state<WindowKey>('24h');
  const server = new Resource({ fetch: (signal) => api.localServer(signal), intervalMs: INTERVAL_MS });
  const usage = new Resource({ fetch: (signal) => api.overview(period, signal), intervalMs: INTERVAL_MS });
  $effect(() => server.start());
  $effect(() => usage.start());

  function choose(key: WindowKey) {
    if (key === period) return;
    period = key;
    usage.retry();
  }

  const s = $derived(server.data);
  const t = $derived(usage.data?.totals);
  const up = $derived(Boolean(s?.reachable && s.authorized));
  const loaded = $derived(s?.models.filter((m) => m.state === 'loaded') ?? []);
  const chosen = $derived(s?.models.find((m) => m.id === s.configured_model));
  let showAll = $state(false);
  /** Loaded models and the worker first; the rest of the server's catalog only on request. */
  const relevant = $derived(s?.models.filter((m) => m.state === 'loaded' || m.id === s.configured_model) ?? []);
  const listed = $derived(showAll ? (s?.models ?? []) : relevant);
  const lead = $derived(
    !s ? '' : !s.reachable ? 'The local server is not answering.' : !s.authorized ? 'The local server rejected the API key.' : 'The local server is answering',
  );
  const rest = $derived(
    !s || !up
      ? ' Code digests still work; the worker does not.'
      : ` in ${s.latency_ms} ms. Worker: ${s.configured_model}, ${chosen ? (chosen.state === 'loaded' ? 'loaded.' : 'loads on first use.') : 'not listed by this server.'}`,
  );
</script>

<section class="view page on" aria-label="Model">
  <div class="page-head">
    <h1 class="display">Model</h1>
    <Freshness phase={server.phase} stale={server.stale} updatedAt={server.updatedAt} intervalMs={INTERVAL_MS} />
  </div>

  {#if server.phase === 'loading'}
    <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:60%"></div></div>
  {:else if server.phase === 'error'}
    <div class="card stack" style="max-width:560px">
      <h2>Cannot load the model status</h2>
      <p class="muted-text" style="margin:0">{server.error} Retrying automatically.</p>
      <div><button class="btn" onclick={() => server.retry()}>Retry now</button></div>
    </div>
  {:else if s}
    <div class="card raised" data-state={up && chosen ? 'focus' : up ? 'warm' : 'alert'}>
      <p class="headline" style="margin:0"><em>{lead}</em>{rest}</p>
      {#if s.error}<p class="caption" style="margin:var(--space-2) 0 0">{s.error}</p>{/if}
    </div>

    <div class="page-head">
      <h2 class="section-title">What the model cost in the {WINDOW_LABEL[period]}</h2>
      <div class="seg" role="group" aria-label="Time range">
        {#each WINDOWS as w (w.key)}<button aria-pressed={period === w.key} onclick={() => choose(w.key)}>{w.label}</button>{/each}
      </div>
    </div>

    {#if usage.phase === 'loading'}
      <div class="tile-grid" aria-hidden="true">{#each [0, 1, 2, 3] as n (n)}<div class="tile tile-skeleton"><div class="skeleton" style="width:50%"></div></div>{/each}</div>
    {:else if usage.phase === 'error'}
      <div class="card stack"><p class="muted-text" style="margin:0">Cannot load usage. {usage.error}</p><div><button class="btn" onclick={() => usage.retry()}>Retry now</button></div></div>
    {:else if t && usage.data}
      {#if t.llm_calls === 0}
        <div class="card note-card">
          <Icon name="chip" />
          <p><b>Not used.</b> <span class="muted-text">Code digested everything in this period.</span></p>
        </div>
      {:else}
        <div class="tile-grid">
          <ValueTile label="Model calls" value={compact(t.llm_calls)} caption={t.llm_errors ? `${t.llm_errors} failed` : 'none failed'} state={t.llm_errors ? 'warm' : 'focus'} />
          <ValueTile label="Input tokens" value={compact(t.llm_in)} caption="{percent(t.llm_in ? t.llm_cached / t.llm_in : null)} read from the prompt cache" />
          <ValueTile label="Output tokens" value={compact(t.llm_out)} caption={t.llm_reasoning ? `${compact(t.llm_reasoning)} of them reasoning` : 'no hidden reasoning'} state={t.llm_out && t.llm_reasoning / t.llm_out > 0.5 ? 'warm' : 'focus'} />
          <ValueTile label="Typical call" value={duration(t.llm_p50_s)} caption="95% finish within {duration(t.llm_p95_s)}" />
        </div>

        <div class="cols">
          <div class="stack">
            <h2 class="section-title">By model</h2>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Model</th><th class="num">Calls</th><th class="num">Failed</th><th class="num">In</th><th class="num">Out</th><th class="num">Reasoning</th><th class="num">Average</th></tr></thead>
                <tbody>
                  {#each usage.data.by_model as row (row.model)}
                    <tr><td class="mono">{row.model}</td><td class="num">{row.calls}</td><td class="num">{row.errors}</td><td class="num">{compact(row.tin)}</td><td class="num">{compact(row.tout)}</td><td class="num">{compact(row.treason)}</td><td class="num">{duration(row.avg_s)}</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
          <div class="stack">
            <h2 class="section-title">By purpose</h2>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Purpose</th><th class="num">Calls</th><th class="num">In</th><th class="num">Out</th></tr></thead>
                <tbody>
                  {#each usage.data.by_purpose as row (row.purpose)}
                    <tr><td>{row.purpose}</td><td class="num">{row.calls}</td><td class="num">{compact(row.tin)}</td><td class="num">{compact(row.tout)}</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/if}
    {/if}

    {#if up}
      <div class="stack">
        <div class="page-head">
          <h2 class="section-title">{showAll ? 'Every model on the server' : 'The worker and loaded models'} <span>{loaded.length} loaded of {s.models.length}</span></h2>
          {#if s.models.length > relevant.length}
            <button class="btn sm" aria-expanded={showAll} onclick={() => (showAll = !showAll)}>{showAll ? 'Show only the worker and loaded models' : `Show all ${s.models.length} models`}</button>
          {/if}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Model</th><th>Type</th><th>State</th><th class="num">Context</th><th>Quantization</th></tr></thead>
            <tbody>
              {#each listed as m (m.id)}
                <tr>
                  <td class="mono">{m.id}{#if m.id === s.configured_model}<span class="chip used">worker</span>{/if}</td>
                  <td>{m.type}</td>
                  <td>{#if m.state === 'loaded'}<span class="chip info"><Icon name="check" size={14} />Loaded</span>{:else}<span class="muted-text">{m.state === 'not-loaded' ? 'Not loaded' : m.state}</span>{/if}</td>
                  <td class="num">{m.context ? m.context.toLocaleString() : '–'}</td>
                  <td>{m.quantization ?? '–'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="caption" style="margin:0">A model Saturn loaded is unloaded when idle. <a href="#/settings/worker">Change the worker model</a></p>
      </div>
    {/if}
  {/if}
</section>

<style>
  .section-title span { text-transform: none; letter-spacing: 0; font-weight: var(--weight-medium); margin-left: var(--space-2); }
  .note-card b { font-weight: var(--weight-semibold); }
  .cols { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); align-items: start; }
  .used { margin-left: var(--space-2); color: var(--accent-bright); }
  .caption a { color: var(--accent-bright); }
</style>
