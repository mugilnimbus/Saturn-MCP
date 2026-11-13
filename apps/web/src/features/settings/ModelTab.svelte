<!-- Model and limits: which model server and worker model Saturn uses, and how much text it returns.
     Saved to settings.toml in the Saturn home folder; the next call uses the new values. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { api } from '../../lib/api/client';
  import { errorText } from '../../lib/api/errors';
  import type { ModelTest, Provider, ServerModel, Settings, Tunables } from '../../lib/api/types';
  import { app } from '../../lib/state/app.svelte';
  import Disclosure from '../../lib/ui/Disclosure.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import type { SaveBar } from './savebar.svelte';

  let { bar }: { bar: SaveBar } = $props();

  const PROVIDER_LABEL: Record<Provider, string> = { lmstudio: 'LM Studio', ollama: 'Ollama', openai: 'Other (OpenAI-compatible)' };
  const NUMBERS = ['inline_token_limit', 'digest_token_budget', 'command_timeout_s', 'model_idle_unload_s', 'progress_interval_s'] as const;
  type NumberKey = (typeof NUMBERS)[number];

  let settings = $state<Settings | null>(null);
  let models = $state<ServerModel[]>([]);
  let serverError = $state<string | null>(null);
  let loadError = $state<string | null>(null);
  let draft = $state<Tunables | null>(null);
  let listing = $state(false);
  let testing = $state(false);
  let test = $state<ModelTest | null>(null);

  async function listModels() {
    listing = true;
    try {
      const server = await api.localServer();
      models = server.models.filter((m) => m.type !== 'embeddings');
      serverError = server.reachable && server.authorized ? null : server.error ?? 'The model server did not answer.';
    } catch (error) {
      models = [];
      serverError = errorText(error);
    } finally {
      listing = false;
    }
  }

  async function load() {
    loadError = null;
    try {
      settings = await api.settings();
      draft = { ...settings.tunables };
      await listModels();
    } catch (error) {
      loadError = errorText(error);
    }
  }
  void load();

  const limits = $derived(settings?.limits ?? {});
  function problem(key: NumberKey): string {
    const range = limits[key];
    const value = draft?.[key];
    if (!range || value === undefined) return '';
    const whole = key === 'progress_interval_s' ? Number.isFinite(value) : Number.isInteger(value);
    return whole && value >= range[0] && value <= range[1] ? '' : `Enter a ${key === 'progress_interval_s' ? 'number' : 'whole number'} from ${range[0].toLocaleString()} to ${range[1].toLocaleString()}.`;
  }
  const problems = $derived(Object.fromEntries(NUMBERS.map((k) => [k, problem(k)])) as Record<NumberKey, string>);
  const urlProblem = $derived(draft && !/^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|\[::1\])(:\d+)?(\/.*)?$/.test(draft.base_url.trim()) ? 'Use a local address such as http://127.0.0.1:1234/v1.' : '');
  const savedServer = $derived(settings ? `${settings.tunables.provider} ${settings.tunables.base_url}` : '');
  const draftServer = $derived(draft ? `${draft.provider} ${draft.base_url}` : '');

  $effect(() => {
    if (!settings || !draft) return;
    const saved = settings.tunables;
    const current = draft;
    bar.dirty = (Object.keys(saved) as (keyof Tunables)[]).some((key) => saved[key] !== current[key]);
    bar.invalid = Boolean(urlProblem || Object.values(problems).some(Boolean));
  });

  $effect(() => {
    untrack(() =>
      bar.bind({
        save: async () => {
          if (!draft) return;
          const serverChanged = savedServer !== draftServer;
          settings = await api.saveSettings({ ...draft, base_url: draft.base_url.trim() });
          draft = { ...settings.tunables };
          test = null;
          app.toast('Saved to settings.toml. The next call uses these settings.', 'ok');
          if (serverChanged) await listModels();
        },
        discard: () => {
          if (settings) draft = { ...settings.tunables };
        },
      }),
    );
  });

  function choose(provider: Provider) {
    if (!draft || !settings) return;
    const wasDefault = Object.values(settings.providers).includes(draft.base_url);
    draft.provider = provider;
    if (wasDefault || !draft.base_url) draft.base_url = settings.providers[provider];
  }

  async function runTest() {
    testing = true;
    test = null;
    try {
      test = await api.testModel();
    } catch (error) {
      test = { ok: false, detail: errorText(error), ms: 0, model: draft?.model ?? '' };
    } finally {
      testing = false;
    }
  }

  const modelChoices = $derived.by(() => {
    const ids = models.map((m) => m.id);
    return draft && draft.model && !ids.includes(draft.model) ? [draft.model, ...ids] : ids;
  });
  const stateOf = (id: string) => models.find((m) => m.id === id)?.state;
</script>

{#if loadError}
  <div class="card stack" style="max-width:560px">
    <h2>Cannot load settings</h2>
    <p class="muted-text" style="margin:0">{loadError}</p>
    <div><button class="btn" onclick={load}>Retry now</button></div>
  </div>
{:else if !settings || !draft}
  <div class="card stack" aria-busy="true" style="max-width:560px"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:40%"></div></div>
{:else}
  {#each Object.entries(settings.environment.file_errors) as [file, reason] (file)}
    <div class="banner warn" role="alert"><b>{file} is not applied.</b> {reason} Saturn keeps using the last valid version.</div>
  {/each}
  <div class="two-col">
    <div class="form card">
      <h2>Worker model</h2>
      <div class="field">
        <span class="label" id="provider-label">Model server</span>
        <div class="seg" role="group" aria-labelledby="provider-label">
          {#each Object.keys(settings.providers) as Provider[] as p (p)}
            <button type="button" aria-pressed={draft.provider === p} onclick={() => choose(p)}>{PROVIDER_LABEL[p]}</button>
          {/each}
        </div>
      </div>
      <div class="field" class:invalid={!!urlProblem}>
        <label for="base-url">Address</label>
        <input id="base-url" class="input mono" bind:value={draft.base_url} spellcheck="false" aria-invalid={!!urlProblem} aria-describedby="url-help" />
        <span class="help" id="url-help">{urlProblem || 'On this computer, ending in /v1. Save to list the models it has.'}</span>
      </div>
      <div class="field">
        <label for="model">Model</label>
        <div class="hstack">
          <select id="model" class="input" bind:value={draft.model}>
            <option value="">None (digests by code only)</option>
            {#each modelChoices as id (id)}
              <option value={id}>{id}{stateOf(id) === 'loaded' ? ' (loaded)' : stateOf(id) === undefined ? ' (not listed by the server)' : ''}</option>
            {/each}
          </select>
          <button type="button" class="btn sm" disabled={listing} onclick={listModels}>{listing ? 'Listing…' : 'Refresh list'}</button>
        </div>
        <span class="help">{serverError ? `Cannot list models: ${serverError}` : `${models.length} model${models.length === 1 ? '' : 's'} on the server. One that is not loaded starts on first use.`}</span>
      </div>
      <div class="test">
        <button type="button" class="btn" disabled={testing || bar.dirty || !settings.tunables.model} onclick={runTest}>
          <Icon name="play" size={16} />{testing ? 'Testing…' : 'Test the model'}
        </button>
        <span class="caption" role="status">
          {#if bar.dirty}Save first, then test.{:else if !settings.tunables.model}Choose and save a model to test it.{:else if test}
            <span class:ok={test.ok} class:bad={!test.ok}>{test.ok ? 'Works:' : 'Failed:'}</span> {test.detail}{test.ms ? ` (${test.ms.toLocaleString()} ms)` : ''}
          {:else}One small tool call; it appears under Runs.{/if}
        </span>
      </div>
      <div class="switch-row">
        <label for="llm-on"><b>Use the model</b><br /><span class="caption">Off: digests by code only, and Ask is unavailable.</span></label>
        <input id="llm-on" class="switch" type="checkbox" role="switch" bind:checked={draft.llm_enabled} />
      </div>
      <Disclosure title="Reasoning effort and unloading" hint={`${draft.reasoning_effort || 'not sent'}, unload after ${draft.model_idle_unload_s} s`}>
        <div class="field">
          <span class="label" id="effort-label">Reasoning effort</span>
          <div class="seg" role="group" aria-labelledby="effort-label">
            {#each settings.reasoning_efforts as effort (effort)}
              <button type="button" aria-pressed={draft.reasoning_effort === effort} onclick={() => draft && (draft.reasoning_effort = effort)}>{effort}</button>
            {/each}
          </div>
          <span class="help">“none” skips hidden reasoning; it is the fastest and usually enough.</span>
        </div>
        {@render number('model_idle_unload_s', 'Unload a model Saturn loaded after', 's', 'Frees memory when Saturn is idle; 0 keeps it loaded. A model you loaded yourself is never unloaded.')}
      </Disclosure>
    </div>

    <div class="form card">
      <h2>Limits</h2>
      {@render number('inline_token_limit', 'Return output unchanged up to', 'tokens', 'Longer output is stored and replaced by a digest.')}
      {@render number('digest_token_budget', 'Digest size', 'tokens', 'The most a digest may take in the agent’s context.')}
      {@render number('command_timeout_s', 'Stop a command after', 's', 'A test or build running longer is stopped and reported.')}
      {@render number('progress_interval_s', 'Progress update every', 's', 'Keeps a client’s idle timer from ending a long call; 0 turns it off.')}
      <Disclosure title="Files" hint="settings.toml and .env">
        <dl class="kv">
          <dt>Settings</dt><dd class="mono">{settings.environment.settings_file}</dd>
          <dt>Startup values</dt><dd class="mono">{settings.environment.env_file}</dd>
          <dt>API key</dt><dd>{settings.environment.api_key_configured ? 'Set in .env' : 'Not set'}</dd>
          <dt>Stored data</dt><dd class="mono">{settings.environment.data_dir}</dd>
          <dt>Outputs kept for</dt><dd class="num">{settings.environment.artifact_ttl_hours} hours</dd>
        </dl>
        <p class="caption" style="margin:0">Edit settings.toml by hand or with <span class="mono">saturn settings set &lt;key&gt; &lt;value&gt;</span>; Saturn applies it on its next call. Values in .env need a restart.</p>
        {#if settings.environment.unknown_env_keys.length}
          <p class="caption warn-text" style="margin:0">.env has keys Saturn does not read: {settings.environment.unknown_env_keys.join(', ')}.</p>
        {/if}
      </Disclosure>
    </div>
  </div>
{/if}

{#snippet number(key: NumberKey, label: string, unit: string, help: string)}
  {#if draft}
    <div class="field" class:invalid={!!problems[key]}>
      <label for={key}>{label}</label>
      <div class="hstack"><input id={key} class="input num narrow" type="number" inputmode="decimal" bind:value={draft[key]} aria-invalid={!!problems[key]} aria-describedby="{key}-help" /><span class="caption">{unit}</span></div>
      <span class="help" id="{key}-help">{problems[key] || help}</span>
    </div>
  {/if}
{/snippet}

<style>
  .narrow { max-width: 140px; }
  .label { font-weight: var(--weight-semibold); font-size: var(--text-caption); }
  .seg { flex-wrap: wrap; align-self: start; }
  .kv { grid-template-columns: minmax(0, max-content) minmax(0, 1fr); }
  .kv dd { white-space: pre-wrap; overflow-wrap: anywhere; }
  .form { align-content: start; gap: var(--space-4); }
  .switch-row label { cursor: pointer; }
  .hstack select { flex: 1; min-width: 0; }
  .test { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
  .ok { color: var(--accent-bright); font-weight: var(--weight-semibold); }
  .bad { color: var(--danger); font-weight: var(--weight-semibold); }
  .warn-text { color: var(--warning); }
  .banner { margin-bottom: var(--space-3); }
</style>
