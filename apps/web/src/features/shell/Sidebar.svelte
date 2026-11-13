<!-- Side panel on wide screens: brand and connection, the sections, and at the foot the local model's state
     and the theme switch. The foot uses space that was empty and frees the top of every page. -->
<script lang="ts">
  import { config } from '../../config';
  import { router } from '../../lib/state/router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import ConnectionBadge from './ConnectionBadge.svelte';
  import ModelStatus from './ModelStatus.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import { SECTIONS, goSection } from './sections';
</script>

<aside class="sidebar" aria-label="Primary">
  <div class="brand">
    <img class="brand-mark" src="/logo.png" alt="" width="28" height="28" />
    <strong>{config.appName}</strong>
    <span class="spacer"></span>
    <ConnectionBadge />
  </div>
  <nav class="nav" aria-label="Sections">
    {#each SECTIONS as s (s.id)}
      <button class="nav-item" aria-current={router.section === s.id ? 'page' : undefined} onclick={() => goSection(s.id)}><Icon name={s.icon} />{s.label}</button>
    {/each}
  </nav>
  <div class="side-foot">
    <ModelStatus />
    <ThemeToggle labelled />
  </div>
</aside>
