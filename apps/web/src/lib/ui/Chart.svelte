<!-- A comparative chart: several series on one time axis and one y axis that starts at zero.
     It plots one point per sample with no smoothing. The legend shows and hides series, the pointer or
     the arrow keys move a crosshair with a readout of every visible series, and the same numbers are
     available as a table. Drawn 1:1 in pixels from its own width, so labels stay readable on a phone. -->
<script lang="ts">
  import { DEFAULT_BOX, linePath, maxOf, nearestIndex, niceScale, xAt, xLabelIndexes, yAt, yTicks, type Series } from './chart';

  let {
    title,
    note,
    series,
    times,
    formatValue,
    formatTime,
    emptyText = 'No activity in this period.',
  }: {
    title: string;
    /** Units, sampling resolution, and what is compared; shown under the title. */
    note: string;
    series: Series[];
    /** Epoch seconds, one per sample. */
    times: number[];
    formatValue: (value: number) => string;
    formatTime: (epochSeconds: number) => string;
    emptyText?: string;
  } = $props();

  let width = $state(DEFAULT_BOX.width);
  let hidden = $state<string[]>([]);
  let hover = $state<number | null>(null);
  let asTable = $state(false);

  const box = $derived({ ...DEFAULT_BOX, width: Math.max(280, width), height: width < 480 ? 200 : 240 });
  const visible = $derived(series.filter((s) => !hidden.includes(s.id)));
  const scale = $derived(niceScale(maxOf(visible)));
  const count = $derived(times.length);
  const empty = $derived(maxOf(series) === 0);
  const showDots = $derived(count <= 90);

  function toggle(id: string) {
    if (hidden.includes(id)) hidden = hidden.filter((h) => h !== id);
    else if (visible.length > 1) hidden = [...hidden, id]; // never hide the last series
  }

  function move(event: PointerEvent) {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    hover = nearestIndex(event.clientX - rect.left, count, box);
  }

  function key(event: KeyboardEvent) {
    if (!count) return;
    const current = hover ?? count - 1;
    if (event.key === 'ArrowLeft') hover = Math.max(0, current - 1);
    else if (event.key === 'ArrowRight') hover = Math.min(count - 1, current + 1);
    else if (event.key === 'Home') hover = 0;
    else if (event.key === 'End') hover = count - 1;
    else if (event.key === 'Escape') hover = null;
    else return;
    event.preventDefault();
  }
</script>

<figure class="chart card">
  <figcaption class="between">
    <div>
      <h2>{title}</h2>
      <p class="caption">{note}</p>
    </div>
    <button class="btn sm plain" aria-pressed={asTable} onclick={() => (asTable = !asTable)}>{asTable ? 'Show as chart' : 'Show as table'}</button>
  </figcaption>

  <div class="legend" role="group" aria-label="Series shown">
    {#each series as s, i (s.id)}
      <button class="key s{i}" aria-pressed={!hidden.includes(s.id)} onclick={() => toggle(s.id)} title={hidden.includes(s.id) ? `Show ${s.label}` : `Hide ${s.label}`}>
        <i aria-hidden="true"></i>{s.label}
      </button>
    {/each}
  </div>

  {#if asTable}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Time</th>{#each visible as s (s.id)}<th class="num">{s.label}</th>{/each}</tr></thead>
        <tbody>
          {#each times.slice(-60) as t, row (t)}
            {@const index = Math.max(0, count - 60) + row}
            <tr><td>{formatTime(t)}</td>{#each visible as s (s.id)}<td class="num">{s.values[index] === null ? 'no data' : formatValue(s.values[index] ?? 0)}</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if count > 60}<p class="caption">Showing the latest 60 of {count} samples.</p>{/if}
  {:else}
    <div class="plot" bind:clientWidth={width}>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <svg
        width={box.width}
        height={box.height}
        role="img"
        tabindex="0"
        aria-label="{title}. {note} Use the left and right arrow keys to read values, or switch to the table."
        onpointermove={move}
        onpointerleave={() => (hover = null)}
        onkeydown={key}
        onblur={() => (hover = null)}
      >
        {#each yTicks(scale.top, scale.step) as tick (tick)}
          <line class="grid" x1={box.left} x2={box.width - box.right} y1={yAt(tick, scale.top, box)} y2={yAt(tick, scale.top, box)} />
          <text class="axis" x={box.left - 8} y={yAt(tick, scale.top, box) + 4} text-anchor="end">{formatValue(tick)}</text>
        {/each}
        {#each xLabelIndexes(count, box.width < 480 ? 3 : 6) as index (index)}
          <text class="axis" x={xAt(index, count, box)} y={box.height - 6} text-anchor={index === 0 ? 'start' : index === count - 1 ? 'end' : 'middle'}>{formatTime(times[index])}</text>
        {/each}
        {#each series as s, i (s.id)}
          {#if !hidden.includes(s.id)}
            <path class="line s{i}" d={linePath(s.values, scale.top, box)} />
            {#if showDots}
              {#each s.values as value, index (index)}
                {#if value !== null && value > 0}<circle class="dot s{i}" cx={xAt(index, count, box)} cy={yAt(value, scale.top, box)} r="2.2" />{/if}
              {/each}
            {/if}
          {/if}
        {/each}
        {#if hover !== null && !empty}
          <line class="cross" x1={xAt(hover, count, box)} x2={xAt(hover, count, box)} y1={box.top} y2={box.height - box.bottom} />
        {/if}
        {#if empty}<text class="none" x={box.width / 2} y={box.height / 2} text-anchor="middle">{emptyText}</text>{/if}
      </svg>
    </div>
    {#if count > 0 && !empty}
      <p class="readout num" aria-live="off">
        {#if hover === null}
          <span>Point at the chart to read a sample.</span>
        {:else}
          <span class="when">At {formatTime(times[hover])}</span>
          {#each series as s, i (s.id)}
            {#if !hidden.includes(s.id)}<span class="val s{i}"><i aria-hidden="true"></i>{s.label} <b>{s.values[hover] === null ? 'no data' : formatValue(s.values[hover] ?? 0)}</b></span>{/if}
          {/each}
        {/if}
      </p>
    {/if}
  {/if}
</figure>

<style>
  .chart { margin: 0; display: grid; gap: var(--space-3); min-width: 0; }
  figcaption p { margin: 2px 0 0; }
  .plot { min-width: 0; overflow: hidden; }
  svg { display: block; max-width: 100%; border-radius: var(--radius-sm); touch-action: pan-y; }
  svg:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .grid { stroke: var(--border); stroke-width: 1; }
  .axis { fill: var(--text-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
  .none { fill: var(--text-muted); font-size: 14px; }
  .line { fill: none; stroke: var(--c); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .dot { fill: var(--c); }
  .cross { stroke: var(--text-muted); stroke-width: 1; stroke-dasharray: 3 3; }
  .readout { min-height: 1.5em; }
  .s0 { --c: var(--hue-focus); }
  .s1 { --c: var(--hue-info); }
  .s2 { --c: var(--hue-calm); }
  .s3 { --c: var(--hue-growth); }
  .line.s1 { stroke-dasharray: 6 3; }
  .line.s2 { stroke-dasharray: 2 3; }
  .line.s3 { stroke-dasharray: 8 3 2 3; }
  .legend { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .key { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 var(--space-3); border-radius: var(--radius-pill);
    border: 1px solid var(--border-strong); background: transparent; color: var(--text); font: var(--weight-medium) var(--text-caption) var(--font); cursor: pointer; }
  .key[aria-pressed='false'] { color: var(--text-muted); text-decoration: line-through; opacity: 0.7; }
  .key:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  .key i, .val i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); flex: none; }
  .readout { margin: 0; display: flex; flex-wrap: wrap; gap: 4px var(--space-4); font-size: var(--text-caption); color: var(--text-muted); }
  .readout .val { display: inline-flex; align-items: center; gap: 6px; }
  .readout b { color: var(--text); font-weight: var(--weight-semibold); }
  .when { font-weight: var(--weight-semibold); }
</style>
