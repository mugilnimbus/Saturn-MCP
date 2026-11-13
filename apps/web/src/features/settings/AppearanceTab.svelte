<script lang="ts">
  import { prefs } from '../../lib/state/prefs.svelte';
</script>

<h2 class="section-title">Theme</h2>
<div class="cols-auto" style="max-width:640px">
  <button class="theme-choice" aria-pressed={prefs.theme === 'black'} onclick={() => prefs.setTheme('black')}>
    <span class="swatch" style="background:#000;border-color:#463d5c"></span><b>Black</b><span class="caption">Default</span>
  </button>
  <button class="theme-choice" aria-pressed={prefs.theme === 'white'} onclick={() => prefs.setTheme('white')}>
    <span class="swatch" style="background:#fff;border-color:#d9d2e6"></span><b>White</b><span class="caption">Lavender panels, heavier text</span>
  </button>
</div>
<h2 class="section-title">Density</h2>
<div class="cols-auto" style="max-width:640px">
  <button class="theme-choice" aria-pressed={prefs.density === 'comfortable'} onclick={() => prefs.setDensity('comfortable')}><b>Comfortable</b><span class="caption">More space</span></button>
  <button class="theme-choice" aria-pressed={prefs.density === 'compact'} onclick={() => prefs.setDensity('compact')}><b>Compact</b><span class="caption">More on screen</span></button>
</div>
<p class="caption" style="margin:0">Saved in this browser only.</p>
