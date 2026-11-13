<!-- Connect one harness to a client. Saturn can write the client's configuration itself: first it shows exactly which
     files change, and nothing is written until "Install" is pressed. The same result from a terminal, or by hand,
     is one disclosure away. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import { errorText } from '../../lib/api/errors';
  import type { ClientInfo, PlannedChange } from '../../lib/api/types';
  import { app } from '../../lib/state/app.svelte';
  import { ui } from '../../lib/state/ui.svelte';
  import Disclosure from '../../lib/ui/Disclosure.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import { CLIENT_TITLE, connectCommand, manualSetup, PRESET_HELP, type ClientName, type Harness, type Preset } from './access';

  let { harness, clients, endpoint, onchange }: {
    harness: Harness; clients: ClientInfo[]; endpoint: string; onchange: () => void;
  } = $props();

  let chosen = $state<ClientName | 'other'>('claude');
  const initialPreset = (): Preset => (harness.tools.includes('saturn_run') ? 'standard' : 'read-only');
  let preset = $state<Preset>(initialPreset());
  let hooks = $state(true);
  let plan = $state<PlannedChange[] | null>(null);
  let busy = $state(false);
  let error = $state('');

  const client = $derived(chosen === 'other' ? null : clients.find((c) => c.name === chosen) ?? null);
  const install = $derived(client?.install ?? null);
  const mine = $derived(install?.harness_id === harness.id);
  const blocks = $derived(manualSetup(harness, chosen, endpoint));
  const fitting = $derived((Object.keys(PRESET_HELP) as Preset[]).filter((p) => p !== 'standard' && p !== 'hands-off' || harness.tools.includes('saturn_run')));

  $effect(() => { void chosen; void preset; void hooks; plan = null; error = ''; });

  async function preview() {
    if (chosen === 'other' || busy) return;
    busy = true; error = '';
    try { plan = (await api.installHarness(harness.id, chosen, preset, hooks, false)).changes; }
    catch (e) { error = errorText(e); }
    finally { busy = false; }
  }
  async function apply() {
    if (chosen === 'other' || busy) return;
    busy = true; error = '';
    try {
      await api.installHarness(harness.id, chosen, preset, hooks, true);
      app.toast(`${CLIENT_TITLE[chosen]} is connected. ${chosen === 'claude' ? 'Start a new session' : 'Restart Codex'} to use Saturn.`, 'ok');
      plan = null; onchange();
    } catch (e) { error = errorText(e); }
    finally { busy = false; }
  }
  async function remove() {
    if (chosen === 'other' || busy || !install) return;
    const title = CLIENT_TITLE[chosen];
    if (!await ui.ask({ title: `Remove Saturn from ${title}?`, body: `Saturn's entries are taken out of ${title}'s configuration; everything else stays. The harness keeps working for other clients.`, action: 'Remove', danger: true })) return;
    busy = true; error = '';
    try { await api.uninstallClient(chosen, false); app.toast(`Removed from ${title}.`, 'ok'); onchange(); }
    catch (e) { error = errorText(e); }
    finally { busy = false; }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); app.toast('Copied.'); }
    catch { app.toast('Copy unavailable. Select the text and copy it.', 'bad'); }
  }
</script>

<div class="stack">
  <div class="seg" role="group" aria-label="Client">
    {#each clients as c (c.name)}
      <button type="button" aria-pressed={chosen === c.name} onclick={() => (chosen = c.name)}>{c.title}{#if c.install}<span class="dot" title="Connected"></span>{/if}</button>
    {/each}
    <button type="button" aria-pressed={chosen === 'other'} onclick={() => (chosen = 'other')}>Other clients</button>
  </div>

  {#if client}
    {#if install}
      <div class="state" class:mine>
        <Icon name="check" size={16} />
        <span>{mine ? `Connected with this harness (${install.preset}, hooks ${install.hooks ? 'on' : 'off'}).` : `Connected with another harness, “${install.handle}”. Installing replaces it.`}</span>
        {#if mine}<button class="btn sm danger" disabled={busy} onclick={remove}>Remove from {client.title}</button>{/if}
      </div>
    {:else if !client.detected}
      <p class="caption">{client.title} was not found on this computer. You can still install; the files are created.</p>
    {/if}

    <div class="field">
      <span class="label" id="preset-label">Permissions in {client.title}</span>
      <div class="seg" role="group" aria-labelledby="preset-label">
        {#each fitting as p (p)}<button type="button" aria-pressed={preset === p} onclick={() => (preset = p)}>{PRESET_HELP[p].label}</button>{/each}
      </div>
      <span class="help">{PRESET_HELP[preset].text} Saturn’s own limits on this harness still apply.</span>
    </div>
    <div class="switch-row">
      <label for="hooks-{harness.id}"><b>Shell hooks</b><br /><span class="caption">{chosen === 'claude' ? 'Send noisy test runs to Saturn and shrink long shell output.' : 'Send noisy test runs to Saturn (Codex cannot shrink output afterwards).'}</span></label>
      <input id="hooks-{harness.id}" class="switch" type="checkbox" role="switch" bind:checked={hooks} />
    </div>

    {#if plan}
      <div class="plan reveal" role="status">
        {#if plan.length === 0}<p class="caption">Nothing to change: {client.title} already has exactly this setup.</p>{/if}
        {#each plan as change (change.path)}
          <div class="change"><span class="chip">{change.creates ? 'create' : 'change'}</span><div><div class="mono">{change.path}</div><div class="caption">{change.summary}</div></div></div>
        {/each}
        <p class="caption">A backup of each file is kept in the Saturn home folder.</p>
      </div>
    {/if}
    {#if error}<p class="error-text" role="alert">{error}</p>{/if}
    <div class="actions">
      {#if plan && plan.length}
        <button class="btn plain" disabled={busy} onclick={() => (plan = null)}>Back</button>
        <button class="btn primary" disabled={busy} onclick={apply}>{busy ? 'Installing…' : `Install for ${client.title}`}</button>
      {:else}
        <button class="btn primary" disabled={busy} onclick={preview}>{busy ? 'Checking…' : 'Preview changes'}</button>
      {/if}
    </div>

    <Disclosure title="Or from a terminal" hint="saturn connect">
      <div class="hstack cmd"><code class="mono">{connectCommand(harness, client.name, preset, hooks)}</code><button class="btn sm" onclick={() => copy(connectCommand(harness, client.name, preset, hooks))}><Icon name="copy" size={16} />Copy</button></div>
      <p class="caption">It shows the same changes and asks before writing. Add <span class="mono">--print</span> to only show them.</p>
    </Disclosure>
    <Disclosure title="Or set it up by hand" hint="no token needed">
      {@render manual()}
    </Disclosure>
  {:else}
    {@render manual()}
  {/if}
</div>

{#snippet manual()}
  {#each blocks as block (block.title)}
    <div class="block">
      <h3>{block.title}</h3>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="mono" tabindex="0">{block.code}</pre>
      <div class="between"><p class="caption">{block.note ?? ''}</p><button type="button" class="btn sm" onclick={() => copy(block.code)}><Icon name="copy" size={16} />Copy</button></div>
    </div>
  {/each}
{/snippet}

<style>
  .seg { flex-wrap: wrap; align-self: start; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-bright); margin-left: var(--space-2); display: inline-block; vertical-align: middle; }
  .label { font-weight: var(--weight-semibold); font-size: var(--text-caption); }
  .state { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; font-size: var(--text-caption); color: var(--text-muted); }
  .state.mine { color: var(--accent-bright); }
  .state span { flex: 1; min-width: 200px; }
  .plan { display: grid; gap: var(--space-2); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); }
  .change { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-2); align-items: start; }
  .change .mono { overflow-wrap: anywhere; font-size: var(--text-caption); }
  .actions { display: flex; gap: var(--space-2); justify-content: flex-end; flex-wrap: wrap; }
  .cmd { justify-content: space-between; gap: var(--space-2); }
  .cmd code { overflow-wrap: anywhere; font-size: var(--text-caption); }
  .block { display: grid; gap: var(--space-2); min-width: 0; }
  .between { gap: var(--space-2); align-items: start; flex-wrap: nowrap; }
  .between .btn { flex: none; }
  h3 { margin: 0; font-size: var(--text-base); font-weight: var(--weight-semibold); }
  p { margin: 0; }
  pre { margin: 0; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-sm); white-space: pre-wrap; overflow-wrap: anywhere; overflow: auto; max-height: 240px; background: color-mix(in srgb, var(--text-muted) 6%, transparent); }
  pre:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .error-text { color: var(--danger); font-size: var(--text-caption); font-weight: var(--weight-medium); }
</style>
