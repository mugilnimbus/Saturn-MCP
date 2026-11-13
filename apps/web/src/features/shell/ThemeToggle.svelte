<!-- Quick switch between the Black and White themes. The same choice lives under Settings, Appearance. -->
<script lang="ts">
  import { prefs } from '../../lib/state/prefs.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  let { labelled = false }: { labelled?: boolean } = $props();
  const next = $derived(prefs.theme === 'black' ? 'white' : 'black');
  const label = $derived(`Switch to the ${next === 'white' ? 'White' : 'Black'} theme`);
</script>

{#if labelled}
  <button class="nav-item" onclick={() => prefs.setTheme(next)}><Icon name={next === 'white' ? 'sun' : 'moon'} />{next === 'white' ? 'White theme' : 'Black theme'}</button>
{:else}
  <button class="btn icon-btn" aria-label={label} title={label} onclick={() => prefs.setTheme(next)}><Icon name={next === 'white' ? 'sun' : 'moon'} /></button>
{/if}
