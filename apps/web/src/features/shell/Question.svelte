<!-- The app's own yes/no dialog, used before discarding unsaved changes. -->
<script lang="ts">
  import { ui } from '../../lib/state/ui.svelte';
  import Dialog from '../../lib/ui/Dialog.svelte';
</script>

{#if ui.question}
  <Dialog title={ui.question.title} onclose={() => ui.answer(false)}>
    <p class="caption" style="margin:0">{ui.question.body}</p>
    <div class="hstack" style="justify-content:flex-end">
      <button class="btn plain" onclick={() => ui.answer(false)}>Keep editing</button>
      <button class="btn" class:danger={ui.question.danger} class:primary={!ui.question.danger} onclick={() => ui.answer(true)}>{ui.question.action}</button>
    </div>
  </Dialog>
{/if}
