<!-- Narrow screens only: the brand (or a back button and where you are, inside a detail view), a warning when the
     local model cannot be used, the connection badge, and the theme switch. On wide screens the side panel
     carries all of this, so no bar repeats the page title. -->
<script lang="ts">
  import { config } from '../../config';
  import { app } from '../../lib/state/app.svelte';
  import { router } from '../../lib/state/router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import ConnectionBadge from './ConnectionBadge.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  const detail = $derived.by(() => {
    const r = router.route;
    return r.name === 'run' ? `Run ${r.runId}` : r.name === 'artifact' ? `Stored output ${r.artifactId}` : null;
  });

  function back() {
    const r = router.route;
    if (r.name === 'run') router.go({ name: 'runs', status: r.status, tool: r.tool });
    if (r.name === 'artifact') router.go({ name: 'artifacts' });
  }
</script>

<header class="topbar">
  {#if detail}
    <button class="btn icon-btn" aria-label="Back to the list" onclick={back}><Icon name="back" /></button>
    <span class="crumb caption">{detail}</span>
  {:else}
    <img class="brand-mark" src="/logo.png" alt="" width="24" height="24" />
    <strong>{config.appName}</strong>
  {/if}
  <span class="spacer"></span>
  {#if app.modelDown}
    <a class="chip warn" href="#/model" title={app.ready?.local_server.error ?? ''}><Icon name="alert" size={14} />Model unavailable</a>
  {/if}
  <ConnectionBadge />
  <ThemeToggle />
</header>

<style>
  .warn { color: var(--warning); text-decoration: none; white-space: nowrap; }
  .brand-mark { width: 24px; height: 24px; }
</style>
