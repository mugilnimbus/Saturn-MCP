<!-- First-run checklist: what is still missing before agents can use Saturn, each step linked to the place that
     does it. It disappears once a model is chosen, a harness exists, and a client is connected. -->
<script lang="ts">
  import { api } from '../../lib/api/client';
  import type { Connections, Settings } from '../../lib/api/types';
  import Icon from '../../lib/ui/Icon.svelte';

  let settings = $state<Settings | null>(null);
  let connections = $state<Connections | null>(null);
  Promise.all([api.settings(), api.connections()])
    .then(([s, c]) => { settings = s; connections = c; })
    .catch(() => { settings = null; connections = null; });

  const steps = $derived.by(() => {
    if (!settings || !connections) return [];
    const active = connections.harnesses.filter((h) => h.revoked_at === null);
    return [
      { done: Boolean(settings.tunables.model), text: 'Choose a worker model', note: 'Optional: without one, digests are made by code only.', href: '#/settings/model' },
      { done: active.length > 0, text: 'Create a harness', note: 'One client’s access: its tools, folders, and token.', href: '#/connections' },
      { done: connections.clients.some((c) => c.install), text: 'Install it in Claude Code or Codex', note: 'One click on Connections, or saturn connect in a terminal.', href: '#/connections' },
    ];
  });
  const remaining = $derived(steps.filter((s) => !s.done).length);
</script>

{#if remaining > 0}
  <div class="card stack setup reveal">
    <div class="between"><h2>Finish setting up Saturn</h2><span class="caption">{steps.length - remaining} of {steps.length} done</span></div>
    <ol class="checklist">
      {#each steps as step (step.text)}
        <li class:done={step.done}>
          <span class="mark" aria-hidden="true">{#if step.done}<Icon name="check" size={14} />{/if}</span>
          <span class="text"><b>{step.text}</b><small class="caption">{step.note}</small></span>
          {#if !step.done}<a class="btn sm" href={step.href}>Open</a>{/if}
          <span class="sr-only">{step.done ? 'done' : 'to do'}</span>
        </li>
      {/each}
    </ol>
    <p class="caption">The same steps run in a terminal with <span class="mono">saturn setup</span>.</p>
  </div>
{/if}

<style>
  .setup { border-color: var(--accent); box-shadow: var(--neon); }
  h2 { margin: 0; }
  .checklist { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .checklist li { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: var(--space-3); align-items: center; min-height: var(--target-min); }
  .mark { width: 21px; height: 21px; border-radius: 50%; border: 2px solid var(--border-strong); display: grid; place-items: center; color: var(--bg); }
  .done .mark { border-color: var(--accent); background: var(--accent); }
  .done .text b { color: var(--text-muted); font-weight: var(--weight-medium); }
  .text small { display: block; }
  p { margin: 0; }
</style>
