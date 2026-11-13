<!-- Artifacts: someone opens this to read the full output Saturn withheld from the agent.
     A list of stored outputs and a paged, line-numbered view of the selected one. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import type { ArtifactPage } from '../../lib/api/types';
  import { errorText } from '../../lib/api/errors';
  import { ago, bytes, compact } from '../../lib/format';
  import { Resource } from '../../lib/live/resource.svelte';
  import { router } from '../../lib/state/router.svelte';
  import Freshness from '../../lib/ui/Freshness.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Stat from '../../lib/ui/Stat.svelte';

  const INTERVAL_MS = 15_000;
  const PAGE = 200;

  const feed = new Resource({ fetch: (signal) => api.artifacts(signal), intervalMs: INTERVAL_MS });
  $effect(() => feed.start());

  const selectedId = $derived(router.route.name === 'artifact' ? router.route.artifactId : null);
  const items = $derived(feed.data?.artifacts ?? []);
  const now = $derived(feed.updatedAt ?? Date.now());

  let page = $state<ArtifactPage | null>(null);
  let pageError = $state<string | null>(null);
  let loading = $state(false);
  let start = $state(1);
  let request = 0;

  async function load(id: string, from: number) {
    const mine = ++request;
    loading = true;
    pageError = null;
    try {
      const result = await api.artifact(id, from, PAGE);
      if (mine !== request) return; // a newer selection or page won
      page = result;
      start = from;
    } catch (error) {
      if (mine === request) pageError = errorText(error);
    } finally {
      if (mine === request) loading = false;
    }
  }

  $effect(() => {
    if (selectedId) {
      page = null;
      void load(selectedId, 1);
    }
  });

  const last = $derived(page ? Math.min(page.total_lines, start + PAGE - 1) : 0);
  const held = $derived(items.reduce((sum, item) => sum + item.tokens_est, 0));
  function left(expires: number): string {
    const hours = (expires - now / 1000) / 3600;
    return hours < 1 ? 'under 1 h left' : `${Math.round(hours)} h left`;
  }
</script>

<section class="view page on" aria-label="Artifacts">
  <div class="page-head">
    <h1 class="display">Artifacts</h1>
    <Freshness phase={feed.phase} stale={feed.stale} updatedAt={feed.updatedAt} intervalMs={INTERVAL_MS} />
  </div>

  {#if feed.phase === 'loading'}
    <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>
  {:else if feed.phase === 'error'}
    <div class="card stack" style="max-width:560px">
      <h2>Cannot load artifacts</h2>
      <p class="muted-text" style="margin:0">{feed.error} Retrying automatically.</p>
      <div><button class="btn" onclick={() => feed.retry()}>Retry now</button></div>
    </div>
  {:else if items.length === 0}
    <div class="card empty">
      <Icon name="box" size={34} />
      <div class="title">Nothing is stored</div>
      <p class="muted-text" style="margin:0">When a result is too long to return, Saturn keeps the full text here and gives the agent a digest.</p>
    </div>
  {:else}
    <div class="stats">
      <Stat label="full outputs stored" number={feed.data?.count ?? 0} />
      <Stat label="tokens the agent did not read" number={held} format={compact} />
      <Stat label="on disk" number={feed.data?.bytes ?? 0} format={bytes} />
    </div>
    <div class="master-detail" class:picked={selectedId !== null}>
      <div class="list master" role="listbox" aria-label="Stored outputs, newest first">
        {#each items as item (item.id)}
          <button class="list-row" role="option" aria-selected={selectedId === item.id} aria-current={selectedId === item.id ? 'true' : undefined} onclick={() => router.go({ name: 'artifact', artifactId: item.id })}>
            <span class="main-text">
              <span class="mono">{item.title}</span>
              <small>{item.lines.toLocaleString()} lines · about {compact(item.tokens_est)} tokens · {ago(item.created_at, now)}</small>
            </span>
            <span class="end caption num">{left(item.expires_at)}</span>
          </button>
        {/each}
      </div>

      <div class="stack detail">
        {#if selectedId}<div class="back"><a class="btn sm plain" href="#/artifacts"><Icon name="back" size={16} />Back to all stored outputs</a></div>{/if}
        {#if !selectedId}
          <span></span>
        {:else if pageError}
          <div class="card stack">
            <h2>Cannot open this output</h2>
            <p class="muted-text" style="margin:0">{pageError}</p>
            <div class="hstack"><button class="btn" onclick={() => load(selectedId, start)}>Retry now</button><a class="btn plain" href="#/artifacts">Back to the list</a></div>
          </div>
        {:else if !page}
          <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:80%"></div><div class="skeleton" style="width:55%"></div></div>
        {:else}
          <div class="card active stack">
            <div class="between wrap">
              <h2 class="mono title-line">{page.meta.title}</h2>
              <a class="btn sm plain" href="#/runs/{page.meta.run_id}">See the run that produced it</a>
            </div>
            <dl class="kv">
              <dt>Id</dt><dd class="mono">{page.meta.id}</dd>
              <dt>Size</dt><dd class="num">{page.total_lines.toLocaleString()} lines, {bytes(page.meta.bytes)}, about {compact(page.meta.tokens_est)} tokens</dd>
            </dl>
            <div class="pager">
              <span class="caption num grow" role="status">{loading ? 'Loading…' : `Lines ${start.toLocaleString()} to ${last.toLocaleString()} of ${page.total_lines.toLocaleString()}`}</span>
              <button class="btn sm" disabled={loading || start <= 1} onclick={() => load(selectedId, Math.max(1, start - PAGE))}>Previous lines</button>
              <button class="btn sm" disabled={loading || last >= page.total_lines} onclick={() => load(selectedId, start + PAGE)}>Next lines</button>
            </div>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <pre class="mono output" tabindex="0" aria-label="Stored output, lines {start} to {last}">{page.text}</pre>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .wrap { flex-wrap: wrap; gap: var(--space-2); }
  .list-row { padding-block: var(--space-2); }
  .detail { min-width: 0; }
  .title-line { overflow-wrap: anywhere; font-size: var(--text-base); }
  .output { margin: 0; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-sm); max-height: max(320px, calc(100dvh - 420px)); overflow: auto; white-space: pre; tab-size: 4; }
  .output:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  @media (max-width: 900px) {
    .picked .master { display: none; }
  }
</style>
