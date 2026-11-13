<!-- Detail on request: a labelled toggle and the content it reveals. Closed content is not rendered, so it
     costs nothing until asked for. The content fades and rises in; nothing animates layout. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  let { title, hint = '', open = $bindable(false), children }: { title: string; hint?: string; open?: boolean; children: Snippet } = $props();
  const id = `dis-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="disclosure" class:open>
  <button type="button" class="toggle" aria-expanded={open} aria-controls={id} onclick={() => (open = !open)}>
    <Icon name="chev" size={16} /><span class="name">{title}</span>{#if hint}<span class="hint">{hint}</span>{/if}
  </button>
  {#if open}<div class="reveal body" {id}>{@render children()}</div>{/if}
</div>

<style>
  .disclosure { display: grid; gap: var(--space-3); min-width: 0; }
  .toggle { display: flex; align-items: center; gap: var(--space-2); width: 100%; min-height: var(--target-min); padding: 0 var(--space-2); border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text); font: var(--weight-semibold) var(--text-base) var(--font); text-align: left; cursor: pointer; }
  .toggle:hover { background: var(--accent-soft); }
  .toggle:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .toggle :global(.icon) { color: var(--text-muted); transition: transform var(--dur) var(--ease); }
  .open .toggle :global(.icon) { transform: rotate(90deg); }
  .name { min-width: 0; }
  .hint { margin-left: auto; color: var(--text-muted); font-size: var(--text-caption); font-weight: var(--weight-medium); white-space: nowrap; }
  .body { display: grid; gap: var(--space-3); min-width: 0; }
</style>
