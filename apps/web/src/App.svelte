<!-- The shell: side panel (wide) or tab bar (narrow), top bar, and the current screen. -->
<script lang="ts">
  import ArtifactsView from './features/artifacts/ArtifactsView.svelte';
  import ModelView from './features/model/ModelView.svelte';
  import ConnectionsView from './features/connections/ConnectionsView.svelte';
  import OverviewView from './features/overview/OverviewView.svelte';
  import ChangesView from './features/runs/ChangesView.svelte';
  import RunsView from './features/runs/RunsView.svelte';
  import SettingsView from './features/settings/SettingsView.svelte';
  import Question from './features/shell/Question.svelte';
  import Resizer from './features/shell/Resizer.svelte';
  import Sidebar from './features/shell/Sidebar.svelte';
  import TabBar from './features/shell/TabBar.svelte';
  import TopBar from './features/shell/TopBar.svelte';
  import { app } from './lib/state/app.svelte';
  import { prefs } from './lib/state/prefs.svelte';
  import { router } from './lib/state/router.svelte';
  import Icons from './lib/ui/Icons.svelte';
  import Toasts from './lib/ui/Toasts.svelte';

  let shell = $state<HTMLDivElement>();
  let viewport = $state<HTMLDivElement>();

  const route = $derived(router.route);
  const section = $derived(router.section);

  $effect(() => {
    void section; // a new section starts at the top; moving within a list keeps its scroll position
    if (viewport) viewport.scrollTop = 0;
  });
</script>

<Icons />
<div class="app">
  <div class="shell" bind:this={shell} style:--nav-w={prefs.navWidth ? `${prefs.navWidth}px` : undefined}>
    <Sidebar />
    <Resizer {shell} />
    <div class="main">
      <TopBar />
      <div class="viewport" bind:this={viewport}>
        {#if route.name === 'home'}
          <OverviewView />
        {:else if route.name === 'runs' || route.name === 'run'}
          <RunsView />
        {:else if route.name === 'changes'}
          <ChangesView />
        {:else if route.name === 'artifacts' || route.name === 'artifact'}
          <ArtifactsView />
        {:else if route.name === 'model'}
          <ModelView />
        {:else if route.name === 'connections'}
          <ConnectionsView />
        {:else}
          <SettingsView tab={route.tab} />
        {/if}
      </div>
      <TabBar />
    </div>
  </div>
  <Question />
  <Toasts />
  {#if app.connection === 'offline'}
    <div class="sr-only" role="status">Cannot reach Saturn. Retrying.</div>
  {/if}
</div>
