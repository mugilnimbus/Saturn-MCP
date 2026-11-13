<!-- Commands and folders: which commands agents may run through Saturn, where, and why a given command would be
     allowed or refused. The rules live in policy.toml; this page shows them and tests them, it does not change them. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import { errorText } from '../../lib/api/errors';
  import type { Harness, Policy, PolicyDecision } from '../../lib/api/types';
  import { app } from '../../lib/state/app.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  const HOOKS: Record<Policy['hook_scope'], string> = {
    noisy: 'Test, build, and lint commands', all: 'Any long output from a command that succeeded', off: 'Off',
  };

  let policy = $state<Policy | null>(null);
  let harnesses = $state<Harness[]>([]);
  let loadError = $state<string | null>(null);
  let command = $state('');
  let folder = $state('');
  let harness = $state('');
  let checking = $state(false);
  let decision = $state<PolicyDecision | null>(null);
  let checkError = $state('');

  async function load() {
    loadError = null;
    try {
      const [loaded, connections] = await Promise.all([api.policy(), api.connections().catch(() => null)]);
      policy = loaded;
      harnesses = connections?.harnesses.filter((h) => h.revoked_at === null) ?? [];
    } catch (error) {
      loadError = errorText(error);
    }
  }
  void load();

  async function check() {
    if (!command.trim() || checking) return;
    checking = true; checkError = ''; decision = null;
    try {
      decision = await api.testPolicy(command.trim(), folder.trim() || null, harness || null);
    } catch (error) {
      checkError = errorText(error);
    } finally {
      checking = false;
    }
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); app.toast('Copied.'); }
    catch { app.toast('Copy unavailable. Select the text and copy it.', 'bad'); }
  }
</script>

{#if loadError}
  <div class="card stack" style="max-width:560px">
    <h2>Cannot load the command policy</h2>
    <p class="muted-text" style="margin:0">{loadError}</p>
    <div><button class="btn" onclick={load}>Retry now</button></div>
  </div>
{:else if !policy}
  <div class="card stack" aria-busy="true" style="max-width:560px"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>
{:else}
  {#if policy.error}
    <div class="banner warn" role="alert"><b>policy.toml is not applied.</b> {policy.error} Saturn keeps using the last valid rules shown below.</div>
  {/if}
  <p class="lede">
    Agents may run <b>{policy.preset === 'open' ? 'any command that is not denied' : 'standard test, build, lint, and read-only inspection commands'}</b>{policy.allow.length ? ` plus ${policy.allow.length} allowed pattern${policy.allow.length === 1 ? '' : 's'}` : ''},
    in <b>{policy.folders.length ? `${policy.folders.length} allowed folder${policy.folders.length === 1 ? '' : 's'}` : 'any folder they name as their workspace'}</b>.
  </p>

  <div class="two-col">
    <div class="card stack">
      <h2>Would this run?</h2>
      <form class="stack" onsubmit={(e) => { e.preventDefault(); void check(); }}>
        <div class="field"><label for="p-command">Command</label><input id="p-command" class="input mono" bind:value={command} placeholder="npm run deploy" spellcheck="false" /></div>
        <div class="row">
          <div class="field grow"><label for="p-folder">Folder <span class="caption">optional</span></label><input id="p-folder" class="input mono" bind:value={folder} placeholder={policy.folders[0] ?? 'C:\\path\\to\\project'} spellcheck="false" /></div>
          <div class="field"><label for="p-harness">As harness</label>
            <select id="p-harness" class="input" bind:value={harness}><option value="">Any</option>{#each harnesses as h (h.id)}<option value={h.id}>{h.name}</option>{/each}</select>
          </div>
        </div>
        <div><button class="btn primary" disabled={!command.trim() || checking}>{checking ? 'Checking…' : 'Check'}</button></div>
      </form>
      {#if checkError}<p class="error-text" role="alert">{checkError}</p>{/if}
      {#if decision}
        <div class="card decision reveal" class:refused={!decision.allowed} role="status">
          <div class="hstack"><Icon name={decision.allowed ? 'check' : 'x'} size={18} /><b>{decision.allowed ? 'Allowed' : 'Refused'}</b><span class="chip">{decision.rule}</span></div>
          <p>{decision.reason}</p>
          <p class="caption">Nothing was run. Folder checked: <span class="mono">{decision.folder}</span></p>
        </div>
      {/if}
    </div>

    <div class="card stack">
      <h2>Rules</h2>
      <dl class="kv">
        <dt>Preset</dt><dd>{policy.preset === 'open' ? 'Open: anything not denied' : 'Standard: built-in safe commands'}</dd>
        <dt>Folders</dt><dd class:mono={policy.folders.length > 0}>{policy.folders.length ? policy.folders.join('\n') : 'Any workspace folder'}</dd>
        <dt>Shell hooks act on</dt><dd>{HOOKS[policy.hook_scope]}</dd>
      </dl>
      {#if policy.allow.length || policy.deny.length}
        <ul class="rules">
          {#each policy.deny as r (r.source + r.pattern)}<li><span class="chip bad">deny</span><span class="mono">{r.pattern}</span><span class="caption">{r.source}</span></li>{/each}
          {#each policy.allow as r (r.source + r.pattern)}<li><span class="chip">allow</span><span class="mono">{r.pattern}</span><span class="caption">{r.source}</span></li>{/each}
        </ul>
      {:else}
        <p class="caption">No allow or deny rules: the preset decides.</p>
      {/if}
      <p class="caption">Deny wins over allow. Every argument that names a path must stay inside the folder, and credential files are never readable, whatever the rules say.</p>
      <h3>Change the rules</h3>
      <p class="caption">From a terminal (allowing more asks you to confirm), or by editing <span class="mono">{policy.file}</span>. Saturn applies a change on its next call.</p>
      {#each ['saturn policy allow "make deploy"', 'saturn policy deny "cargo *"', 'saturn policy folder add <path>'] as line (line)}
        <div class="hstack cmd"><code class="mono">{line}</code><button class="btn sm" onclick={() => copy(line)}><Icon name="copy" size={16} />Copy</button></div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .lede { margin: 0 0 var(--space-4); }
  .row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
  .grow { flex: 1; min-width: 200px; }
  .kv { grid-template-columns: minmax(0, max-content) minmax(0, 1fr); }
  .kv dd { white-space: pre-wrap; overflow-wrap: anywhere; }
  .rules { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .rules li { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-2); align-items: center; min-width: 0; }
  .rules .mono { overflow-wrap: anywhere; }
  .chip.bad { color: var(--danger); }
  .decision { gap: var(--space-2); display: grid; }
  .decision.refused { border-color: color-mix(in srgb, var(--danger) 45%, var(--border)); }
  .decision p { margin: 0; }
  .cmd { justify-content: space-between; gap: var(--space-2); flex-wrap: nowrap; min-width: 0; }
  .cmd code { overflow-wrap: anywhere; white-space: normal; min-width: 0; font-size: var(--text-caption); }
  .cmd .btn { flex: none; }
  .card { min-width: 0; }
  p .mono { overflow-wrap: anywhere; }
  h3 { margin: 0; font-size: var(--text-base); }
  p { margin: 0; }
  .error-text { color: var(--danger); font-size: var(--text-caption); }
</style>
