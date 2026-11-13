<!-- Modal dialog: focus moves in on open, Tab stays inside, Escape or the scrim closes it.
     `wide` gives room for content that must not wrap, such as setup code. -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, onclose, children, wide = false }: { title: string; onclose: () => void; children: Snippet; wide?: boolean } = $props();

  let dialog: HTMLDivElement;
  const id = `dlg-${Math.random().toString(36).slice(2, 8)}`;
  let previous: Element | null = null;

  function focusable() {
    return [...dialog.querySelectorAll<HTMLElement>('button, input, textarea, select, summary, [href], [tabindex]')]
      .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'));
  }

  function topmost() {
    return [...document.querySelectorAll('[role="dialog"]')].at(-1) === dialog;
  }

  $effect(() => {
    previous = document.activeElement;
    const focusFirst = () => (focusable()[0] ?? dialog).focus();
    focusFirst();
    const observer = new MutationObserver(() => {
      if (topmost() && (!dialog.contains(document.activeElement) || document.activeElement?.matches(':disabled'))) focusFirst();
    });
    observer.observe(dialog, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'open', 'inert', 'tabindex', 'class', 'style'] });
    return () => {
      observer.disconnect();
      if (previous?.isConnected) (previous as HTMLElement).focus?.();
    };
  });

  function onKey(event: KeyboardEvent) {
    if (!topmost()) return;
    if (event.key === 'Escape') { event.stopPropagation(); onclose(); }
    if (event.key !== 'Tab') return;
    const controls = focusable();
    const first = controls[0] ?? dialog;
    const last = controls.at(-1) ?? dialog;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="scrim open" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()} onkeydown={onKey}>
  <div bind:this={dialog} class="dialog" class:wide role="dialog" aria-modal="true" aria-labelledby={id} tabindex="-1">
    <h2 {id}>{title}</h2>
    {@render children()}
  </div>
</div>

<style>
  .wide { width: min(760px, 100%); }
</style>
