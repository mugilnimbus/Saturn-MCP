<!-- Overview: someone running Saturn opens this to see whether it is keeping output out of their agent's
     context and whether anything is failing, and leaves knowing how much was saved, how, and at what cost.
     The page reads as a story, top to bottom: the conclusion, the path from raw output to what the agent
     received, the supporting numbers, the same thing over time, the runs that explain it, then the breakdown.
     Skeleton while loading, an error with Retry when nothing loaded, the last data marked when a refresh fails. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import type { WindowKey } from '../../lib/api/types';
  import { WINDOW_LABEL, ago, bytes, compact, duration, percent, routeLabel, toolName } from '../../lib/format';
  import { Resource } from '../../lib/live/resource.svelte';
  import { app } from '../../lib/state/app.svelte';
  import Chart from '../../lib/ui/Chart.svelte';
  import Disclosure from '../../lib/ui/Disclosure.svelte';
  import Freshness from '../../lib/ui/Freshness.svelte';
  import Gauge from '../../lib/ui/Gauge.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import ValueTile from '../../lib/ui/ValueTile.svelte';
  import SetupChecklist from './SetupChecklist.svelte';
  import { bucketLabel, bucketTime, contextSeries, failureMood, highlights, journey, modelSeries, story } from './overview';

  const WINDOWS: { key: WindowKey; label: string }[] = [
    { key: '15m', label: '15 min' },
    { key: '1h', label: '1 hour' },
    { key: '6h', label: '6 hours' },
    { key: '24h', label: '24 hours' },
    { key: '7d', label: '7 days' },
  ];
  const INTERVAL_MS = 5000;

  let period = $state<WindowKey>('1h');
  const feed = new Resource({ fetch: (signal) => api.overview(period, signal), intervalMs: INTERVAL_MS });
  const recent = new Resource({ fetch: (signal) => api.runs({ window: period, limit: 200 }, signal), intervalMs: 15_000 });
  $effect(() => feed.start());
  $effect(() => recent.start());

  function choose(key: WindowKey) {
    if (key === period) return;
    period = key;
    feed.retry();
    recent.retry();
  }

  const data = $derived(feed.data);
  const t = $derived(data?.totals);
  const s = $derived(t ? story(t, WINDOW_LABEL[period], app.modelDown) : null);
  const stages = $derived(data && t ? journey(t, data.by_route) : []);
  const notable = $derived(highlights(recent.data?.runs ?? []));
  const times = $derived(data?.series.map((b) => b.t) ?? []);
  const sample = $derived(data ? bucketLabel(data.bucket_s) : '');
  const axisTime = (epoch: number) => bucketTime(epoch, data?.bucket_s ?? 60);
  const now = $derived(recent.updatedAt ?? Date.now());
</script>

<section class="view page on" aria-label="Overview">
  <div class="page-head">
    <h1 class="display">Overview</h1>
    <Freshness phase={feed.phase} stale={feed.stale} updatedAt={feed.updatedAt} intervalMs={INTERVAL_MS} />
  </div>
  <SetupChecklist />
  <div class="seg" role="group" aria-label="Time range">
    {#each WINDOWS as w (w.key)}
      <button aria-pressed={period === w.key} onclick={() => choose(w.key)}>{w.label}</button>
    {/each}
  </div>

  {#if feed.phase === 'loading'}
    <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>
    <div class="tile-grid" aria-hidden="true">
      {#each [0, 1, 2, 3] as n (n)}<div class="tile tile-skeleton"><div class="skeleton" style="width:50%"></div></div>{/each}
    </div>
  {:else if feed.phase === 'error'}
    <div class="card stack" style="max-width:560px">
      <h2>Cannot load the overview</h2>
      <p class="muted-text" style="margin:0">{feed.error} Saturn may not be running. Retrying automatically.</p>
      <div><button class="btn" onclick={() => feed.retry()}>Retry now</button></div>
    </div>
  {:else if data && t && s}
    {#if feed.stale}<div class="banner" role="status">Showing the last numbers received. Reconnecting…</div>{/if}

    <div class="card raised story" data-state={s.mood}>
      <p class="headline"><em>{s.lead}</em>{s.rest}</p>
      {#if t.reduction !== null && t.reduction > 0}<Gauge value={t.reduction} label="% kept out" state={s.mood} />{/if}
    </div>

    {#if t.runs === 0}
      <div class="card stack">
        <h2>Connect a coding agent</h2>
        <p class="muted-text">Create a harness, then install it in Claude Code or Codex with one click.</p>
        <div><a class="btn primary" href="#/connections">Open Connections</a></div>
      </div>
    {:else}
      <div class="chapter">
        <h2 class="section-title">How it got there</h2>
        <ol class="journey">
          {#each stages as stage, i (stage.id)}
            {#if i > 0}<li class="then" aria-hidden="true"><Icon name="arrow" /></li>{/if}
            <li class="card stage" class:active={stage.id === 'reached'}>
              <span class="caption">{stage.label}</span>
              <span class="figure num">{stage.value}<small>{stage.unit}</small></span>
              <span class="caption">{stage.caption}</span>
            </li>
          {/each}
        </ol>
      </div>

      <div class="tile-grid">
        <ValueTile
          label="Runs"
          number={t.runs}
          format={compact}
          caption={t.errors ? `${t.errors} failed or refused` : 'none failed'}
          state={failureMood(t.runs, t.errors)}
          href={t.errors ? '#/runs?status=error' : '#/runs'}
        />
        <ValueTile label="Stored outputs" number={data.artifacts.count} format={compact} caption="{bytes(data.artifacts.bytes)} the agent can query" href="#/artifacts" />
        <ValueTile
          label="Model tokens"
          number={t.llm_in + t.llm_out}
          format={compact}
          caption={t.llm_calls ? `${t.llm_calls} calls` : 'code did all the work'}
          state={t.llm_errors ? 'warm' : 'focus'}
          href="#/model"
        />
        <ValueTile label="Typical run" number={t.p50_s} format={duration} value={duration(t.p50_s)} caption="95% within {duration(t.p95_s)}" />
      </div>

      <div class="chapter">
        <h2 class="section-title">Over time</h2>
        <Chart
          title="Raw output against what reached the agent"
          note="Estimated tokens, one point per {sample}. The gap is what Saturn withheld."
          series={contextSeries(data.series)}
          {times}
          formatValue={compact}
          formatTime={axisTime}
        />
        {#if t.llm_calls > 0}
          <Chart
            title="Local model usage"
            note="Exact tokens, one point per {sample}."
            series={modelSeries(data.series)}
            {times}
            formatValue={compact}
            formatTime={axisTime}
          />
        {:else}
          <div class="card note-card">
            <Icon name="chip" />
            <p>The model was not needed: code produced every digest. <a class="link" href="#/model">Model</a></p>
          </div>
        {/if}
      </div>

      {#if notable.length}
        <div class="chapter">
          <h2 class="section-title">What stood out</h2>
          <div class="list notable">
            {#each notable as item (item.kind + item.id)}
              <a class="list-row" href="#/runs/{item.id}">
                <span class="tag" class:bad={item.kind === 'failed'}>{item.kind === 'failed' ? 'failed' : 'saved'}</span>
                <span class="main-text">
                  <span class="mono">{item.title}</span>
                  <small>{item.text}</small>
                </span>
                <span class="end caption">{ago(item.at, now)}<Icon name="chev" size={16} /></span>
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <Disclosure title="Breakdown" hint="by tool and by path">
      <div class="cols">
        <div class="chapter">
          <h2 class="section-title">By tool</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tool</th><th class="num">Runs</th><th class="num">Failed</th><th class="num">Raw</th><th class="num">Returned</th><th>Cut</th></tr></thead>
              <tbody>
                {#each data.by_tool as row (row.tool)}
                  {@const share = row.raw > 0 ? Math.max(0, 1 - row.ret / row.raw) : null}
                  <tr>
                    <td><a class="link" href="#/runs?tool={row.tool}">{toolName(row.tool)}</a></td>
                    <td class="num">{row.runs}</td>
                    <td class="num">{row.errors}</td>
                    <td class="num">{compact(row.raw)}</td>
                    <td class="num">{compact(row.ret)}</td>
                    <td><div class="cut"><span class="bar" aria-hidden="true"><i style:width="{(share ?? 0) * 100}%"></i></span><span class="num">{percent(share)}</span></div></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        <div class="chapter">
          <h2 class="section-title">How results were produced</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Path</th><th class="num">Runs</th><th class="num">Raw</th><th class="num">Returned</th></tr></thead>
              <tbody>
                {#each data.by_route as row (row.route)}
                  <tr><td>{routeLabel(row.route)}</td><td class="num">{row.runs}</td><td class="num">{compact(row.raw)}</td><td class="num">{compact(row.ret)}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p class="caption" style="margin:0">
        Token counts for output are estimates (about 3.6 characters per token). Model tokens are exact.
        {#if t.redactions}{t.redactions} secret-looking values were masked before storage.{/if}
      </p>
      </Disclosure>
    {/if}
  {/if}
</section>

<style>
  .seg { justify-self: start; flex-wrap: wrap; }
  .story .headline { margin: 0; }
  .tile-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); }
  .journey { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr); gap: var(--space-2); align-items: stretch; }
  .stage { display: grid; gap: var(--space-1); align-content: start; padding: var(--space-3) var(--space-4); }
  .figure { font-size: var(--text-large); font-weight: var(--weight-semibold); line-height: 1.15; }
  .figure small { margin-left: 6px; font-size: var(--text-base); font-weight: var(--weight-medium); color: var(--text-muted); }
  .stage.active .figure { color: var(--accent-bright); }
  .then { display: grid; place-items: center; color: var(--text-muted); }
  .notable { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); }
  .notable .list-row { text-decoration: none; border-top: 0; border-bottom: 1px solid var(--border); padding-block: var(--space-2); }
  .notable .list-row:hover { background: var(--accent-soft); }
  .tag.bad { color: var(--danger); border-color: var(--danger); }
  .cols { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); align-items: start; }
  .cut { display: flex; align-items: center; gap: var(--space-2); min-width: 110px; }
  .bar { flex: 1; min-width: 40px; height: 8px; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--text-muted) 16%, transparent); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--accent); }
  .cut .num { min-width: 3.5ch; text-align: right; }
  @container app (max-width: 900px) {
    .story { grid-template-columns: minmax(0, 1fr) auto; }
  }
  @container app (max-width: 760px) {
    .journey { grid-template-columns: 1fr; gap: 2px; }
    .then { transform: rotate(90deg); height: 21px; }
    .tile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .story :global(.gauge) { width: 92px; }
    .story :global(.gauge .center .large) { font-size: var(--text-title); }
    .story :global(.gauge .center small) { font-size: 11px; }
  }
</style>
