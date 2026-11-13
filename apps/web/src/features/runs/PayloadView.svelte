<!-- One kept body (request, reply, model prompt or reply): its preview, and the full text on request. Bodies are
     kept for 48 hours; after that only the run's summary and previews remain. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import { errorText } from '../../lib/api/errors';
  import type { PayloadMeta } from '../../lib/api/types';
  import { app } from '../../lib/state/app.svelte';
  import { bytes } from '../../lib/format';
  import Icon from '../../lib/ui/Icon.svelte';

  let { payload, fallback = '', label }: { payload: PayloadMeta | undefined; fallback?: string; label: string } = $props();

  let full = $state<string | null>(null);
  let loading = $state(false);
  let error = $state('');
  const pretty = (text: string) => {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
  };
  const shown = $derived(full ?? (payload ? payload.preview : fallback));

  async function load() {
    if (!payload || loading) return;
    loading = true; error = '';
    try { full = pretty((await api.payload(payload.id)).text); }
    catch (e) { error = errorText(e); }
    finally { loading = false; }
  }
  async function copy() {
    let text = shown;
    if (payload && !payload.complete && full === null) {
      try { text = (await api.payload(payload.id)).text; } catch { /* copy what is shown */ }
    }
    try { await navigator.clipboard.writeText(text); app.toast('Copied.'); }
    catch { app.toast('Copy unavailable. Select the text and copy it.', 'bad'); }
  }
</script>

<div class="payload-view">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre class="mono" tabindex="0" aria-label={label}>{(payload?.complete && full === null ? pretty(shown) : shown) || '(empty)'}{#if payload && !payload.complete && full === null}…{/if}</pre>
  <div class="bar">
    <span class="caption">
      {#if !payload}{fallback ? 'Preview only; the full text is no longer kept.' : 'Not kept: bodies are kept for 48 hours.'}{:else}{bytes(payload.bytes)}{payload.truncated ? ', cut at 2 MB' : ''}{/if}
    </span>
    {#if payload && !payload.complete && full === null}
      <button class="btn sm" disabled={loading} onclick={load}>{loading ? 'Loading…' : 'Show full'}</button>
    {/if}
    {#if shown}<button class="btn sm plain" onclick={copy}><Icon name="copy" size={14} />Copy</button>{/if}
  </div>
  {#if error}<p class="caption err" role="alert">{error}</p>{/if}
</div>

<style>
  .payload-view { display: grid; gap: var(--space-2); min-width: 0; }
  pre { margin: 0; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-sm); white-space: pre-wrap; overflow-wrap: anywhere; max-height: 360px; overflow: auto; font-size: var(--text-caption); }
  pre:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .bar { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
  .bar .caption { margin-right: auto; }
  .err { color: var(--danger); margin: 0; }
</style>
