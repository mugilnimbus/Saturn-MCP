<!-- One line saying whether the local model can be used, linking to the Model screen. Amber only when it cannot. -->
<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  const view = $derived(
    app.ready === null
      ? { tone: '', title: 'Local model', text: app.connection === 'offline' ? 'Saturn is not answering' : 'Checking…' }
      : app.noModel
        ? { tone: '', title: 'No worker model', text: 'Code digests only' }
        : app.modelDown
        ? { tone: 'warn', title: 'Local model unavailable', text: 'Digests by code still work' }
        : { tone: '', title: 'Local model ready', text: app.ready.local_server.latency_ms === null ? 'Answering' : `Answers in ${app.ready.local_server.latency_ms} ms` },
  );
</script>

<a class="model-status {view.tone}" href={app.noModel ? '#/settings/model' : '#/model'} title={app.ready?.local_server.error ?? undefined}>
  <Icon name={view.tone ? 'alert' : 'chip'} />
  <span class="lines"><b>{view.title}</b><small>{view.text}</small></span>
</a>

<style>
  .model-status { display: flex; align-items: center; gap: var(--space-3); min-height: var(--target-min); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border); color: var(--text-muted); text-decoration: none; min-width: 0; }
  .model-status:hover { border-color: var(--border-strong); color: var(--text); }
  .model-status:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .lines { display: grid; min-width: 0; line-height: 1.3; }
  b { color: var(--text); font-size: var(--text-caption); font-weight: var(--weight-semibold); }
  small { font-size: var(--text-caption); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .warn { border-color: var(--warning); color: var(--warning); background: color-mix(in srgb, var(--warning) 10%, transparent); }
  .warn b { color: var(--warning); }
</style>
