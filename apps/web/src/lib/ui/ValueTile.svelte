<!-- A value tile: a label, one large number with its unit, and one short caption that says what it means.
     No chart inside; the comparison lives in the chart below. With `href` the whole tile is a link to
     the view that explains the number. Strong state color appears only for `warm` and `alert`.
     Pass `number` with `format` to have the figure ease to new values; `value` is for text that is not a number. -->
<script lang="ts">
  import Num from './Num.svelte';

  let {
    label, value = '', number, format = (n: number) => String(Math.round(n)), unit = '', caption = '', state = 'focus', href,
  }: { label: string; value?: string; number?: number | null; format?: (value: number) => string; unit?: string; caption?: string; state?: string; href?: string } = $props();
</script>

{#snippet body()}
  <div class="label">{label}</div>
  <div class="value">{#if number !== undefined && number !== null}<Num value={number} {format} />{:else}{value}{/if}{#if unit}<small>{unit}</small>{/if}</div>
  <div class="caption">{caption}</div>
{/snippet}

{#if href}
  <a class="tile link" data-state={state} {href}>{@render body()}</a>
{:else}
  <div class="tile" data-state={state}>{@render body()}</div>
{/if}

<style>
  .tile { min-height: 124px; }
  .link { text-decoration: none; color: inherit; cursor: pointer; transition: transform var(--dur) var(--ease), border-color var(--dur) var(--ease); }
  .link:hover { border-color: var(--accent); transform: translateY(-2px); }
  .link:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .caption { min-height: 1.5em; }
</style>
