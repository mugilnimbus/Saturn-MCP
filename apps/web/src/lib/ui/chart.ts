/* Geometry for the comparative chart: scales, ticks, and paths. Pure, so it is unit tested.
   The chart plots the samples it is given, one point per sample, with no smoothing; a null is a gap. */

export interface Series {
  id: string;
  label: string;
  /** One value per x position; null breaks the line. */
  values: (number | null)[];
}

export interface Box {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const DEFAULT_BOX: Box = { width: 720, height: 240, left: 52, right: 12, top: 12, bottom: 26 };

/** A "nice" upper bound and tick step so the axis reads 0, 2k, 4k rather than 0, 1873, 3746. */
export function niceScale(max: number, ticks = 4): { top: number; step: number } {
  if (!Number.isFinite(max) || max <= 0) return { top: 1, step: 1 };
  const rough = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
  return { top: Math.ceil(max / step) * step, step };
}

export function yTicks(top: number, step: number): number[] {
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Number(value.toPrecision(12)));
  return ticks;
}

export function xAt(index: number, count: number, box: Box): number {
  const inner = box.width - box.left - box.right;
  return count <= 1 ? box.left + inner / 2 : box.left + (index / (count - 1)) * inner;
}

export function yAt(value: number, top: number, box: Box): number {
  const inner = box.height - box.top - box.bottom;
  return box.top + inner - (Math.max(0, value) / top) * inner;
}

/** SVG path for one series. Each run of consecutive values is its own sub-path, so gaps stay gaps. */
export function linePath(values: (number | null)[], top: number, box: Box): string {
  let path = '';
  let open = false;
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      open = false;
      return;
    }
    path += `${open ? 'L' : 'M'}${xAt(index, values.length, box).toFixed(1)} ${yAt(value, top, box).toFixed(1)} `;
    open = true;
  });
  return path.trim();
}

/** The largest value across the visible series, ignoring gaps. */
export function maxOf(series: Series[]): number {
  let max = 0;
  for (const s of series) for (const v of s.values) if (v !== null && Number.isFinite(v) && v > max) max = v;
  return max;
}

/** Index of the sample nearest to an x pixel position inside the box. */
export function nearestIndex(x: number, count: number, box: Box): number {
  if (count <= 1) return 0;
  const inner = box.width - box.left - box.right;
  const ratio = (x - box.left) / inner;
  return Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1))));
}

/** Evenly spaced x label positions, at most `want` of them, always including the last sample. */
export function xLabelIndexes(count: number, want = 6): number[] {
  if (count <= 0) return [];
  if (count <= want) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (want - 1);
  return Array.from(new Set(Array.from({ length: want }, (_, i) => Math.round(i * step))));
}
