<!-- "Updated 3 s ago" with a live/stale/offline dot. The one-second clock only runs while the tab is visible. -->
<script lang="ts">
  import type { Phase } from '../live/resource.svelte';

  let { phase, stale, updatedAt, intervalMs }: { phase: Phase; stale: boolean; updatedAt: number | null; intervalMs: number } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) now = Date.now();
    }, 1000);
    return () => clearInterval(timer);
  });

  const age = $derived(updatedAt === null ? null : Math.max(0, Math.round((now - updatedAt) / 1000)));
  const status = $derived(phase === 'error' ? 'offline' : phase === 'loading' ? 'stale' : stale || (age ?? 0) * 1000 > intervalMs * 3 ? 'stale' : 'live');
  const text = $derived(phase === 'loading' ? 'Loading' : phase === 'error' ? 'Cannot load' : stale ? `Reconnecting · updated ${age} s ago` : `Updated ${age} s ago`);
</script>

<span class="live" data-status={status} role="status">{text}</span>
