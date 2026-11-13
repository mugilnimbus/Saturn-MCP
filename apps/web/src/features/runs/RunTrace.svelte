<!-- One run in detail, read top to bottom: what happened in a sentence, the request as it arrived, the path of
     steps with their times (each model call with its full prompt and reply on request), and the exact reply.
     Refreshes while the run is still going. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import { clock, compact, duration, routeLabel, toolName } from '../../lib/format';
  import { Resource } from '../../lib/live/resource.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import PayloadView from './PayloadView.svelte';
  import { kindLabel, summarize, waterfall } from './trace';

  let { runId }: { runId: string } = $props();

  const feed = new Resource({ fetch: (signal) => api.trace(runId, signal), intervalMs: 3000 });
  $effect(() => feed.start());

  const trace = $derived(feed.data);
  const run = $derived(trace?.run);
  const rows = $derived(trace ? waterfall(trace) : []);
  const s = $derived(run ? summarize(run) : null);
  let open = $state<string | null>(null);
  const body = (kind: string, owner: string | null = null) => trace?.payloads.find((p) => p.kind === kind && p.owner_id === owner);
  const ROUTE: Record<string, string> = { stdio: 'stdio (client-started command)', http: 'Streamable HTTP', hook: 'shell hook', 'in-process': 'in-process' };
</script>

{#if feed.phase === 'loading'}
  <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:60%"></div><div class="skeleton" style="width:80%"></div></div>
{:else if feed.phase === 'error'}
  <div class="card stack">
    <h2>Cannot load this run</h2>
    <p class="muted-text" style="margin:0">{feed.error}</p>
    <div><button class="btn" onclick={() => feed.retry()}>Retry now</button></div>
  </div>
{:else if trace && run && s}
  <div class="card active stack" data-state={s.mood}>
    <div class="between">
      <span class="chip">{toolName(run.tool)}</span>
      <span class="caption num">{clock(run.started_at)}</span>
    </div>
    <p class="headline small" style="margin:0"><em>{s.lead}</em>{s.rest}</p>
    <pre class="mono request">{run.summary}</pre>
    <dl class="kv">
      <dt>Produced by</dt><dd>{routeLabel(run.route)}</dd>
      {#if run.client}<dt>Caller</dt><dd>{#if run.harness_id}<a href="#/runs?harness={run.harness_id}">{run.client}</a>{:else}{run.client}{/if}</dd>{/if}
      {#if run.workspace}<dt>Workspace</dt><dd class="mono">{run.workspace}</dd>{/if}
      {#if run.transport}<dt>Arrived by</dt><dd>{ROUTE[run.transport] ?? run.transport}{run.client_info ? ` from ${run.client_info}` : ''}</dd>{/if}
      {#if run.decision}<dt>Policy</dt><dd>{run.decision === 'refused' ? 'Refused' : `Allowed by ${run.decision}`}</dd>{/if}
      {#if run.exit_code !== null}<dt>Exit code</dt><dd class="num">{run.exit_code}</dd>{/if}
      {#if run.llm_calls}
        <dt>Model</dt>
        <dd class="num">{run.llm_calls} calls, {compact(run.llm_in)} in, {compact(run.llm_out)} out{run.llm_reasoning ? `, ${compact(run.llm_reasoning)} reasoning` : ''}, {compact(run.llm_cached)} cached</dd>
      {/if}
      {#if run.redactions}<dt>Masked</dt><dd class="num">{run.redactions} secret-looking values</dd>{/if}
      {#if run.artifact_id}<dt>Full output</dt><dd><a href="#/artifacts/{run.artifact_id}">{run.artifact_id}</a></dd>{/if}
    </dl>
  </div>

  <div class="stack">
    <h2 class="section-title">Request</h2>
    <div class="card stack">
      {#if run.session_id || run.request_id}
        <p class="caption ids">{#if run.session_id}MCP session <span class="mono">{run.session_id}</span>{/if}{#if run.session_id && run.request_id} · {/if}{#if run.request_id}Request <span class="mono">{run.request_id}</span>{/if}</p>
      {/if}
      <PayloadView label="Request arguments" payload={body('request')} fallback={run.summary} />
    </div>
  </div>

  <div class="stack">
    <h2 class="section-title">What happened, in order</h2>
    {#if rows.length === 0}
      <div class="card"><p class="muted-text" style="margin:0">This run finished without any recorded steps: it was answered or refused before any work started.</p></div>
    {:else}
      <ol class="waterfall card">
        {#each rows as row (row.id)}
          <li class="row" class:bad={row.status === 'error'}>
            <div class="what" style:padding-left="{row.depth * 14}px">
              {#if row.call}
                <button class="toggle" aria-expanded={open === row.id} aria-controls="call-{row.id}" onclick={() => (open = open === row.id ? null : row.id)}>
                  <Icon name="chev" size={14} class={open === row.id ? 'turned' : ''} /><span class="name">{row.label}</span>
                </button>
              {:else}
                <span class="name">{row.label}</span>
              {/if}
              <small>{kindLabel(row.kind)}{row.detail ? ` · ${row.detail}` : ''}{row.status === 'error' ? ' · failed' : ''}</small>
            </div>
            <div class="track" aria-hidden="true"><i class={row.kind} style:left="{row.offset * 100}%" style:width="{row.width * 100}%"></i></div>
            <span class="took num">{row.seconds === null ? 'running' : duration(row.seconds)}</span>
            {#if row.call && open === row.id}
              <div class="payload" id="call-{row.id}">
                <p class="caption">{row.call.model} · {compact(row.call.cached_tokens)} of {compact(row.call.input_tokens)} input tokens read from cache</p>
                {#if row.call.error}<p class="caption err">{row.call.error}</p>{/if}
                <h3 class="section-title">Sent to the model</h3>
                <PayloadView label="Model prompt" payload={body('llm_prompt', row.call.id)} fallback={row.call.prompt_preview} />
                <h3 class="section-title">Model reply</h3>
                <PayloadView label="Model reply" payload={body('llm_output', row.call.id)} fallback={row.call.output_preview} />
              </div>
            {/if}
          </li>
        {/each}
      </ol>
      <p class="caption" style="margin:0">Bars: when each step ran within {duration((run.ended_at ?? Date.now() / 1000) - run.started_at)}.</p>
    {/if}
  </div>

  {#if run.status !== 'running'}
    <div class="stack">
      <h2 class="section-title">{run.status === 'error' ? 'What the caller was told' : 'What the caller received'}</h2>
      <div class="card stack"><PayloadView label="Response" payload={body('response')} fallback={run.error ?? ''} /></div>
    </div>
  {/if}
{/if}

<style>
  .headline.small { font-size: var(--text-title); }
  .request { margin: 0; padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-sm); white-space: pre-wrap; overflow-wrap: anywhere; max-height: 7.5em; overflow: auto; }
  .kv a { color: var(--accent-bright); }
  .waterfall { list-style: none; margin: 0; padding: var(--space-2) var(--space-3); display: grid; }
  .row { display: grid; grid-template-columns: minmax(150px, 1.1fr) minmax(80px, 1.4fr) 64px; gap: var(--space-3); align-items: center; padding: 6px 0; border-top: 1px solid var(--border); }
  .row:first-child { border-top: 0; }
  .what { min-width: 0; display: grid; }
  .name { font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .what small { color: var(--text-muted); font-size: var(--text-caption); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .toggle { display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0; border: 0; background: none; color: var(--accent-bright); font: inherit; cursor: pointer; text-align: left; min-width: 0; }
  .toggle:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-sm); }
  .toggle :global(.icon) { transition: transform var(--dur) var(--ease); flex: none; }
  .toggle :global(.turned) { transform: rotate(90deg); }
  .track { position: relative; height: 10px; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--text-muted) 14%, transparent); overflow: hidden; }
  .track i { position: absolute; top: 0; bottom: 0; border-radius: var(--radius-pill); background: var(--hue-info); min-width: 3px; }
  .track i.llm { background: var(--hue-focus); }
  .track i.command { background: var(--hue-calm); }
  .bad .track i { background: var(--hue-alert); }
  .bad .name { color: var(--danger); }
  .took { text-align: right; font-size: var(--text-caption); color: var(--text-muted); }
  .payload { grid-column: 1 / -1; display: grid; gap: var(--space-2); padding: var(--space-2) 0 var(--space-3); min-width: 0; }
  .payload p { margin: 0; }
  .err { color: var(--danger); }
  .ids { margin: 0; overflow-wrap: anywhere; }
  @container (max-width: 560px) {
    .row { grid-template-columns: minmax(0, 1fr) 64px; }
    .track { grid-column: 1 / -1; order: 3; }
  }
</style>
