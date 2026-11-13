<!-- A number that eases to its new value, so a change is seen as a change. It runs only while the value is
     changing and is instant when the reader asked for reduced motion. -->
<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';

  let { value, format }: { value: number; format: (value: number) => string } = $props();

  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tween = new Tween(0, { duration: still ? 0 : 800, easing: cubicOut });
  $effect(() => {
    void tween.set(value);
  });
</script>

{format(tween.current)}
