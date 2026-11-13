<!-- Settings: someone opens this to choose Saturn's worker model and limits, check which commands agents may run,
     or change how the dashboard looks, and leaves knowing what applies to the next call. -->
<script lang="ts">
  import { tick } from 'svelte';
  import { errorText } from '../../lib/api/errors';
  import { router } from '../../lib/state/router.svelte';
  import { SETTINGS_TABS, type SettingsTab } from '../../lib/state/routes';
  import { ui } from '../../lib/state/ui.svelte';
  import AppearanceTab from './AppearanceTab.svelte';
  import CommandsTab from './CommandsTab.svelte';
  import ModelTab from './ModelTab.svelte';
  import { SaveBar } from './savebar.svelte';

  let { tab }: { tab: SettingsTab } = $props();

  const bar = new SaveBar();
  const LABEL: Record<SettingsTab, string> = { model: 'Model and limits', commands: 'Commands and folders', appearance: 'Appearance' };

  async function pick(next: SettingsTab) {
    if (next === tab) return;
    if (bar.dirty && !(await ui.ask({ title: 'Discard changes?', body: 'You have unsaved changes on this tab.', action: 'Discard changes', danger: true }))) return;
    bar.discard();
    router.go({ name: 'settings', tab: next }, true);
  }

  async function key(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const tabs = event.currentTarget as HTMLElement;
    const at = SETTINGS_TABS.indexOf(tab);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    await pick(SETTINGS_TABS[(at + direction + SETTINGS_TABS.length) % SETTINGS_TABS.length]);
    await tick();
    tabs.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
  }

  async function save() {
    bar.saving = true;
    bar.error = '';
    try {
      await bar.save();
    } catch (e) {
      bar.error = `Not saved. ${errorText(e)}`;
    } finally {
      bar.saving = false;
    }
  }
</script>

<svelte:window onbeforeunload={(e) => bar.dirty && e.preventDefault()} />

<section class="view page on" aria-label="Settings">
  <div class="page-head"><h1 class="display">Settings</h1></div>
  <div class="tabs" role="tablist" tabindex="-1" onkeydown={key}>
    {#each SETTINGS_TABS as t (t)}
      <button class="tab" role="tab" id="tab-{t}" aria-selected={tab === t} aria-controls="panel-{t}" tabindex={tab === t ? 0 : -1} onclick={() => pick(t)}>{LABEL[t]}</button>
    {/each}
  </div>
  <div class="tabpanel on" role="tabpanel" id="panel-{tab}" aria-labelledby="tab-{tab}">
    {#key tab}
      {#if tab === 'model'}<ModelTab {bar} />{:else if tab === 'commands'}<CommandsTab />{:else}<AppearanceTab />{/if}
    {/key}
  </div>
</section>
{#if bar.dirty}
  <div class="savebar">
    <span class="grow caption" role="status">{bar.error || (bar.invalid ? 'Fix the highlighted field to save.' : 'You have unsaved changes.')}</span>
    <button class="btn plain" disabled={bar.saving} onclick={() => bar.discard()}>Discard</button>
    <button class="btn primary" disabled={bar.saving || bar.invalid} onclick={save}>{bar.saving ? 'Saving…' : 'Save changes'}</button>
  </div>
{/if}
