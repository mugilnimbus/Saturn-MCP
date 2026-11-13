<!-- One figure in a strip of figures: a number with a few words under it. Used where a row of numbers says
     more than a sentence would. With `href` it links to the view that explains the number. -->
<script lang="ts">
  import Num from './Num.svelte';

  let {
    label, number, format = (n: number) => Math.round(n).toLocaleString('en-US'), unit = '', tone = '', href,
  }: { label: string; number: number; format?: (value: number) => string; unit?: string; tone?: '' | 'bad' | 'warn'; href?: string } = $props();
</script>

{#snippet body()}
  <span class="figure num"><Num value={number} {format} />{#if unit}<small>{unit}</small>{/if}</span>
  <span class="caption">{label}</span>
{/snippet}

{#if href}
  <a class="stat link {tone}" {href}>{@render body()}</a>
{:else}
  <div class="stat {tone}">{@render body()}</div>
{/if}

<style>
  .stat { display: grid; gap: 2px; min-width: 0; padding: var(--space-2) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--panel-fill); box-shadow: var(--edge); text-decoration: none; color: inherit; }
  .figure { font-size: var(--text-title); font-weight: var(--weight-semibold); line-height: 1.2; }
  .figure small { margin-left: 4px; font-size: var(--text-caption); font-weight: var(--weight-medium); color: var(--text-muted); }
  .caption { white-space: nowrap; }
  .link { transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease); }
  .link:hover { border-color: var(--accent); transform: translateY(-2px); }
  .link:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .bad { border-color: var(--danger); }
  .bad .figure { color: var(--danger); }
  .warn { border-color: var(--warning); }
  .warn .figure { color: var(--warning); }
</style>
