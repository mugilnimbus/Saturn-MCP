<!-- Connections: someone opens this to let a coding agent reach Saturn, limit what it may do, or take access away,
     and leaves knowing which clients use which harness, with which tools and folders. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import { errorText } from '../../lib/api/errors';
  import type { AuditEvent } from '../../lib/api/types';
  import { Resource } from '../../lib/live/resource.svelte';
  import { app } from '../../lib/state/app.svelte';
  import { router } from '../../lib/state/router.svelte';
  import { routeHref } from '../../lib/state/routes';
  import { ui } from '../../lib/state/ui.svelte';
  import Dialog from '../../lib/ui/Dialog.svelte';
  import Disclosure from '../../lib/ui/Disclosure.svelte';
  import Freshness from '../../lib/ui/Freshness.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import { ago } from '../../lib/format';
  import { CLIENT_TITLE, expiryError, HANDLE, handleFrom, lines, localDate, PRESET_HELP, status, TOOL_HELP, type Credential, type Harness, type Preset } from './access';
  import ClientSetup from './ClientSetup.svelte';

  const intervalMs = 10_000;
  const connections = new Resource({ fetch: (signal) => api.connections(signal), intervalMs });
  $effect(() => connections.start());

  let editing = $state<Harness | 'new' | null>(null);
  let name = $state('');
  let handle = $state('');
  let handleTouched = $state(false);
  let tools = $state<string[]>([]);
  let expiry = $state('');
  let enabled = $state(true);
  let folders = $state('');
  let deny = $state('');
  let hooks = $state(true);
  let original = $state('');
  let busy = $state(false);
  let error = $state('');
  let credential = $state<Credential | null>(null);
  let reveal = $state(false);
  let setupFor = $state<string | null>(null);
  let action = $state<{ kind: 'rotate' | 'revoke'; harness: Harness } | null>(null);
  let confirmation = $state('');
  let showRevoked = $state(false);
  let more = $state<string | null>(null);

  const fingerprint = $derived(JSON.stringify({ name, handle, tools, expiry, enabled, folders, deny, hooks }));
  const dirty = $derived(editing !== null && fingerprint !== original);
  const handleProblem = $derived(editing === 'new' && !HANDLE.test(handle) ? 'Use lower-case letters, digits, and hyphens.' : '');
  const invalid = $derived(!name.trim() || tools.length === 0 || !!expiryError(expiry) || !!handleProblem);
  const all = $derived(connections.data?.harnesses ?? []);
  const current = $derived(all.filter((h) => h.revoked_at === null));
  const revoked = $derived(all.filter((h) => h.revoked_at !== null));
  const shown = $derived(showRevoked ? [...current, ...revoked] : current);
  const now = $derived(connections.updatedAt ?? Date.now());
  const live = $derived(current.filter((h) => status(h, now / 1000) === 'Active'));
  const setupHarness = $derived(all.find((h) => h.id === setupFor) ?? null);
  const connected = $derived((connections.data?.clients ?? []).filter((c) => c.install));
  const step = $derived(current.length === 0 ? 0 : connected.length === 0 ? 1 : 2);

  $effect(() => {
    if (editing === 'new' && !handleTouched) handle = handleFrom(name);
  });
  $effect(() => {
    router.beforeLeave = async () => {
      if (busy) { app.toast('Wait for the access update to finish.', 'warn'); return false; }
      if (credential) return ui.ask({ title: 'Leave the token screen?', body: 'The token is saved for clients on this computer. You only need to copy it for an HTTP client.', action: 'Leave' });
      if (dirty) return ui.ask({ title: 'Discard changes?', body: 'Your harness changes have not been saved.', action: 'Discard' });
      return true;
    };
    return () => { router.beforeLeave = null; };
  });
  const date = (seconds: number | null, fallback: string) => seconds === null ? fallback : new Date(seconds * 1000).toLocaleString();

  function edit(h: Harness | 'new', preset: Preset = 'standard') {
    name = h === 'new' ? '' : h.name;
    handle = h === 'new' ? handleFrom('') : h.handle;
    handleTouched = false;
    tools = h === 'new' ? [...(connections.data?.presets[preset] ?? [])] : [...h.tools];
    expiry = h === 'new' ? '' : localDate(h.expires_at);
    enabled = h === 'new' ? true : h.enabled;
    folders = h === 'new' ? '' : h.folders.join('\n');
    deny = h === 'new' ? '' : h.deny.join('\n');
    hooks = h === 'new' ? true : h.hooks;
    original = JSON.stringify({ name, handle, tools, expiry, enabled, folders, deny, hooks });
    error = ''; editing = h;
  }
  async function closeEditor() {
    if (busy) return;
    if (dirty && !await ui.ask({ title: 'Discard changes?', body: 'Your harness changes have not been saved.', action: 'Discard' })) return;
    editing = null; error = '';
  }
  function toggle(tool: string, checked: boolean) {
    tools = checked ? [...tools, tool] : tools.filter((t) => t !== tool);
  }
  async function save() {
    if (!editing || invalid || busy) return;
    busy = true; error = '';
    try {
      const input = { name: name.trim(), handle: editing === 'new' ? handle : null, tools, enabled, hooks,
                      expires_at: expiry ? new Date(expiry).getTime() / 1000 : null, folders: lines(folders), deny: lines(deny) };
      if (editing === 'new') { credential = await api.createHarness(input); reveal = false; }
      else await api.editHarness(editing.id, input);
      editing = null; connections.retry();
      app.toast('Harness saved.');
    } catch (e) { error = errorText(e); }
    finally { busy = false; }
  }
  function confirm(kind: 'rotate' | 'revoke', harness: Harness) {
    action = { kind, harness }; confirmation = ''; error = '';
  }
  async function runAction() {
    if (!action || confirmation !== action.kind.toUpperCase() || busy) return;
    busy = true; error = '';
    try {
      if (action.kind === 'rotate') { credential = await api.rotateHarness(action.harness.id); reveal = false; }
      else await api.revokeHarness(action.harness.id);
      action = null; connections.retry(); app.toast('Access updated.');
    } catch (e) { error = errorText(e); }
    finally { busy = false; }
  }
  async function enable(h: Harness) {
    if (busy || !await ui.ask({ title: h.enabled ? 'Disable access?' : 'Enable access?', body: `${h.name}: ${h.enabled ? 'future requests will be refused until you enable it again.' : 'the current token will work again if it has not expired.'}`, action: h.enabled ? 'Disable' : 'Enable' })) return;
    busy = true;
    try { await api.enableHarness(h.id, !h.enabled); connections.retry(); app.toast('Access updated.'); }
    catch (e) { app.toast(errorText(e), 'bad'); }
    finally { busy = false; }
  }
  function closeCredential(next: 'setup' | null = null) {
    const id = credential?.harness.id ?? null;
    credential = null; reveal = false;
    if (next === 'setup') setupFor = id;
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); app.toast('Copied.'); }
    catch { app.toast('Copy unavailable. Select the text and copy it.', 'bad'); }
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (dirty || busy) { event.preventDefault(); event.returnValue = ''; }
  }
  function eventText(e: AuditEvent): string {
    const by = e.actor === 'dashboard' ? '' : e.actor === 'terminal' ? ' from a terminal' : '';
    if (e.kind === 'install') return `${e.subject} ${e.action === 'installed' ? 'was connected' : 'was disconnected'}${by}`;
    return `${e.subject.replace(/ \([a-z0-9-]+\)$/, '')} ${({ created: 'was created', updated: 'was edited', rotated: 'got a new token', revoked: 'was revoked', enabled: 'was enabled', disabled: 'was disabled' } as Record<string, string>)[e.action] ?? e.action}${by}`;
  }
</script>

<svelte:window onbeforeunload={beforeUnload} />
<section class="view page on" aria-label="Connections">
  <div class="page-head"><h1 class="display">Connections</h1><Freshness phase={connections.phase} stale={connections.stale} updatedAt={connections.updatedAt} {intervalMs} /></div>
  {#if connections.phase === 'loading'}
    <div class="card stack" aria-busy="true"><div class="skeleton"></div><div class="skeleton" style="width:70%"></div></div>
  {:else if connections.phase === 'error'}
    <div class="card stack" style="max-width:560px"><h2>Cannot load connections</h2><p class="muted-text">{connections.error} Retrying automatically.</p><div><button class="btn" onclick={() => connections.retry()}>Retry now</button></div></div>
  {:else if connections.data}
    {#if connections.stale}<div class="banner" role="status">Connection details may be out of date. {connections.error}</div>{/if}

    <ol class="steps journey" aria-label="Connecting a client">
      <li class="step" class:done={step > 0} class:current={step === 0}>Create a harness</li>
      <li class="step" class:done={step > 1} class:current={step === 1}>Install it in Claude Code or Codex</li>
      <li class="step" class:current={step === 2}>Open a new session</li>
    </ol>

    <div class="chapter">
      <div class="page-head">
        <h2 class="section-title">Harnesses <span>{live.length} active{revoked.length ? `, ${revoked.length} revoked` : ''}</span></h2>
        <button class="btn primary" onclick={() => edit('new')}>Create harness</button>
      </div>
      {#if current.length === 0}
        <div class="card empty">
          <Icon name="link" size={34} />
          <div class="title">Connect your first client</div>
          <p class="muted-text">A harness is one client’s access: its tools, folders, and token. Create one, then install it in Claude Code or Codex with one click.</p>
          <button class="btn primary" onclick={() => edit('new')}>Create harness</button>
        </div>
      {/if}
      <div class="harnesses">
        {#each shown as h (h.id)}
          <article class="card harness" class:off={status(h) !== 'Active'}>
            <div class="between">
              <div class="title-block"><h3>{h.name}</h3><span class="caption mono">{h.handle}</span></div>
              <span class="chip" class:active={status(h) === 'Active'} class:warn={status(h) === 'Expired' || status(h) === 'Disabled'}>{#if status(h) === 'Active'}<Icon name="check" size={14} />{/if}{status(h)}</span>
            </div>
            <div class="chips">{#each h.tools as tool (tool)}<span class="chip" title={TOOL_HELP[tool]}>{tool.replace('saturn_', '')}</span>{/each}</div>
            <p class="caption used">
              {h.installs.length ? `In ${h.installs.map((i) => CLIENT_TITLE[i.client]).join(' and ')}` : 'Not installed in a client'}
              · {h.last_used_at === null ? 'not used yet' : `used ${ago(h.last_used_at, now)}`}
              {#if h.folders.length || h.deny.length}· limited{/if}
            </p>
            {#if h.revoked_at === null}
              <div class="actions">
                <button class="btn sm primary" disabled={busy} onclick={() => (setupFor = h.id)}>{h.installs.length ? 'Clients' : 'Install in a client'}</button>
                <button class="btn sm" disabled={busy} onclick={() => edit(h)}>Edit access</button>
                <span class="spacer"></span>
                <button class="btn sm plain" aria-expanded={more === h.id} onclick={() => (more = more === h.id ? null : h.id)}>{more === h.id ? 'Less' : 'More'}</button>
              </div>
            {/if}
            {#if more === h.id || h.revoked_at !== null}
              <div class="reveal extra">
                <dl>
                  <div><dt>Folders</dt><dd class="mono">{h.folders.length ? h.folders.join('\n') : 'As the policy allows'}</dd></div>
                  <div><dt>Denied commands</dt><dd class="mono">{h.deny.length ? h.deny.join('\n') : 'None'}</dd></div>
                  <div><dt>Shell hooks</dt><dd>{h.hooks ? 'On' : 'Off'}</dd></div>
                  <div><dt>Token file</dt><dd class="mono">{h.credential_saved ? h.credential_file : 'Missing: rotate to recreate it'}</dd></div>
                  <div><dt>Created</dt><dd>{date(h.created_at, '')}</dd></div>
                  <div><dt>Expires</dt><dd>{date(h.expires_at, 'Never')}</dd></div>
                </dl>
                {#if h.revoked_at === null}
                  <div class="actions">
                    <a class="btn sm plain" href={routeHref({ name: 'runs', harness: h.id })}>See its runs</a>
                    <button class="btn sm" disabled={busy} onclick={() => confirm('rotate', h)}>Rotate token</button>
                    <button class="btn sm" disabled={busy} onclick={() => void enable(h)}>{h.enabled ? 'Disable' : 'Enable'}</button>
                    <span class="spacer"></span>
                    <button class="btn sm danger" disabled={busy} onclick={() => confirm('revoke', h)}>Revoke</button>
                  </div>
                {/if}
              </div>
            {/if}
          </article>
        {/each}
      </div>
      {#if revoked.length}
        <div><button class="btn sm plain" aria-expanded={showRevoked} onclick={() => (showRevoked = !showRevoked)}>{showRevoked ? 'Hide' : 'Show'} {revoked.length} revoked</button></div>
      {/if}
    </div>

    <div class="card stack">
      <div class="between"><h2>Recent changes</h2><a class="link" href={routeHref({ name: 'changes' })}>All changes <Icon name="arrow" size={14} /></a></div>
      {#if connections.data.events.length === 0}<p class="muted-text">Nothing has changed yet.</p>{/if}
      <ul class="events">
        {#each connections.data.events.slice(0, 6) as e (e.seq)}
          <li><span>{eventText(e)}</span><time class="caption" title={date(e.at, '')}>{ago(e.at, now)}</time></li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

{#if editing}
  <Dialog title={editing === 'new' ? 'Create harness' : `Edit ${editing.name}`} onclose={() => void closeEditor()}>
    <form class="stack" onsubmit={(e) => { e.preventDefault(); void save(); }}>
      <div class="field"><label for="h-name">Name</label><input id="h-name" class="input" bind:value={name} maxlength="80" placeholder="For example: Claude Code on this laptop" disabled={busy} /></div>
      {#if editing === 'new'}
        <div class="field" class:invalid={!!handleProblem}>
          <label for="h-handle">Handle</label>
          <input id="h-handle" class="input mono" bind:value={handle} oninput={() => (handleTouched = true)} maxlength="40" disabled={busy} aria-invalid={!!handleProblem} aria-describedby="h-handle-help" />
          <span class="help" id="h-handle-help">{handleProblem || 'Client configuration names the harness by this. It cannot change later.'}</span>
        </div>
        <div class="field">
          <span class="label" id="h-preset">Start from</span>
          <div class="seg" role="group" aria-labelledby="h-preset">
            {#each ['standard', 'read-only'] as const as p (p)}<button type="button" aria-pressed={JSON.stringify(tools) === JSON.stringify(connections.data?.presets[p])} onclick={() => (tools = [...(connections.data?.presets[p] ?? [])])}>{PRESET_HELP[p].label}</button>{/each}
          </div>
        </div>
      {/if}
      <fieldset disabled={busy}><legend>Allowed tools</legend>{#each connections.data?.tools ?? [] as tool (tool)}<label class="tool"><input type="checkbox" checked={tools.includes(tool)} onchange={(e) => toggle(tool, e.currentTarget.checked)} /><span>{tool}<small class="caption">{TOOL_HELP[tool]}</small></span></label>{/each}</fieldset>
      <Disclosure title="Limits" hint="folders, denied commands, hooks, expiry">
        <div class="field"><label for="h-folders">Folders <span class="caption">one absolute path per line; empty means whatever the policy allows</span></label><textarea id="h-folders" class="input mono" rows="3" bind:value={folders} disabled={busy}></textarea></div>
        <div class="field"><label for="h-deny">Denied commands <span class="caption">one pattern per line, such as <span class="mono">cargo *</span></span></label><textarea id="h-deny" class="input mono" rows="3" bind:value={deny} disabled={busy}></textarea></div>
        <label class="tool"><input type="checkbox" bind:checked={hooks} disabled={busy} /><span>Shell hooks<small class="caption">Let this harness’s shell hooks send noisy commands to Saturn.</small></span></label>
        <div class="field">
          <label for="h-expiry">Expires <span class="caption">optional, in your local time</span></label>
          <div class="hstack"><input id="h-expiry" class="input" type="datetime-local" bind:value={expiry} disabled={busy} /><button type="button" class="btn sm" disabled={busy || !expiry} onclick={() => expiry = ''}>Never</button></div>
        </div>
      </Disclosure>
      {#if editing !== 'new'}<label class="tool"><input type="checkbox" bind:checked={enabled} disabled={busy} />Enabled. Clear this to pause access without losing the token.</label>{/if}
      {#if tools.length === 0}<p class="error-text">Select at least one tool.</p>{/if}
      {#if expiryError(expiry)}<p class="error-text">{expiryError(expiry)}</p>{/if}
      {#if error}<p class="error-text" role="alert">{error}</p>{/if}
      <div class="actions end"><button class="btn plain" type="button" disabled={busy} onclick={() => void closeEditor()}>Cancel</button><button class="btn primary" disabled={!!invalid || busy} type="submit">{busy ? 'Saving…' : editing === 'new' ? 'Create harness' : 'Save changes'}</button></div>
    </form>
  </Dialog>
{/if}
{#if action}
  <Dialog title={action.kind === 'rotate' ? `Rotate the token for ${action.harness.name}?` : `Revoke ${action.harness.name}?`} onclose={() => { if (!busy) action = null; }}>
    <p>{action.kind === 'rotate' ? 'The old token stops working at once. Clients on this computer pick up the new one from its token file; an HTTP client needs the new token.' : 'Its token stops working at once and its token file is deleted. This cannot be undone; create a new harness to connect that client again.'}</p>
    <div class="field"><label for="h-confirm">Type {action.kind.toUpperCase()} to confirm</label><input id="h-confirm" class="input" bind:value={confirmation} autocomplete="off" disabled={busy} /></div>
    {#if error}<p class="error-text" role="alert">{error}</p>{/if}
    <div class="actions end"><button class="btn plain" disabled={busy} onclick={() => action = null}>Cancel</button><button class="btn danger" disabled={busy || confirmation !== action.kind.toUpperCase()} onclick={() => void runAction()}>{busy ? 'Updating…' : action.kind === 'rotate' ? 'Rotate token' : 'Revoke access'}</button></div>
  </Dialog>
{/if}
{#if credential}
  <Dialog wide title="Token for {credential.harness.name}" onclose={() => closeCredential()}>
    <p>Saved for clients on this computer in <span class="mono">{credential.harness.credential_file}</span>, so you don’t need to copy it. Copy it only for a client that connects over HTTP; it is shown once.</p>
    <div class="field">
      <label for="h-token">Token</label>
      <div class="hstack"><input id="h-token" class="input token" type={reveal ? 'text' : 'password'} readonly value={credential.token} autocomplete="off" spellcheck="false" /><button class="btn" onclick={() => reveal = !reveal}>{reveal ? 'Hide' : 'Reveal'}</button><button class="btn" onclick={() => credential && copy(credential.token)}>Copy token</button></div>
    </div>
    <div class="actions end"><button class="btn plain" onclick={() => closeCredential()}>Done</button><button class="btn primary" onclick={() => closeCredential('setup')}>Install in a client</button></div>
  </Dialog>
{/if}
{#if setupHarness && connections.data}
  <Dialog wide title="Clients for {setupHarness.name}" onclose={() => (setupFor = null)}>
    <ClientSetup harness={setupHarness} clients={connections.data.clients} endpoint={connections.data.endpoint} onchange={() => connections.retry()} />
  </Dialog>
{/if}

<style>
  .actions { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
  .actions.end { justify-content: flex-end; }
  .journey { margin-bottom: var(--space-4); }
  .harnesses { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: var(--space-3); align-items: start; }
  .harness { display: flex; flex-direction: column; gap: var(--space-3); }
  .title-block { display: grid; gap: 2px; min-width: 0; }
  .harness h3 { font-size: var(--text-title); overflow-wrap: anywhere; margin: 0; }
  .harness .between { flex-wrap: nowrap; align-items: start; }
  .harness .actions { margin-top: auto; }
  .harness.off { opacity: 0.75; }
  .used { margin: 0; }
  .extra { display: grid; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border); }
  .section-title span { text-transform: none; letter-spacing: 0; font-weight: var(--weight-medium); margin-left: var(--space-2); }
  .chip { color: var(--text-muted); white-space: nowrap; }
  .chip.active { color: var(--accent-bright); }
  .chip.warn { color: var(--warning); }
  .label { font-weight: var(--weight-semibold); font-size: var(--text-caption); }
  .seg { flex-wrap: wrap; align-self: start; }
  dl { margin: 0; display: grid; gap: var(--space-2); font-size: var(--text-caption); }
  dl > div { display: flex; justify-content: space-between; gap: var(--space-3); }
  dt { color: var(--text-muted); flex: none; } dd { margin: 0; text-align: right; white-space: pre-wrap; overflow-wrap: anywhere; min-width: 0; }
  fieldset { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); margin: 0; }
  legend { font-size: var(--text-caption); font-weight: var(--weight-semibold); color: var(--text-muted); padding: 0 var(--space-1); }
  .tool { display: flex; gap: var(--space-3); align-items: center; min-height: var(--target-min); cursor: pointer; }
  .tool input { width: 18px; height: 18px; accent-color: var(--accent); flex: none; }
  .tool small { display: block; }
  textarea { resize: vertical; min-height: 64px; }
  .token { font-family: var(--font-mono); min-width: 0; }
  .events { list-style: none; padding: 0; margin: 0; }
  .events li { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); padding: var(--space-2) 0; border-top: 1px solid var(--border); font-size: var(--text-caption); }
  .events li:first-child { border-top: 0; }
  .events time { white-space: nowrap; }
  .error-text { margin: 0; color: var(--danger); font-size: var(--text-caption); font-weight: var(--weight-medium); }
  p { margin: 0; }
</style>
