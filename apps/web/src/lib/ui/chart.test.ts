import { describe, expect, it } from 'vitest';
import { DEFAULT_BOX, linePath, maxOf, nearestIndex, niceScale, xAt, xLabelIndexes, yAt, yTicks } from './chart';

const box = DEFAULT_BOX;

describe('chart geometry', () => {
  it('rounds the axis up to a readable step', () => {
    expect(niceScale(7400)).toEqual({ top: 8000, step: 2000 });
    expect(niceScale(93)).toEqual({ top: 100, step: 50 });
    expect(niceScale(3)).toEqual({ top: 3, step: 1 });
    expect(niceScale(0)).toEqual({ top: 1, step: 1 });
    expect(yTicks(8000, 2000)).toEqual([0, 2000, 4000, 6000, 8000]);
  });

  it('starts the y axis at zero and puts the top value at the top', () => {
    expect(yAt(0, 100, box)).toBe(box.height - box.bottom);
    expect(yAt(100, 100, box)).toBe(box.top);
    expect(yAt(-5, 100, box)).toBe(box.height - box.bottom);
  });

  it('spreads samples edge to edge, and centers a single one', () => {
    expect(xAt(0, 5, box)).toBe(box.left);
    expect(xAt(4, 5, box)).toBe(box.width - box.right);
    expect(xAt(0, 1, box)).toBe(box.left + (box.width - box.left - box.right) / 2);
  });

  it('draws one point per sample and never joins across a gap', () => {
    const path = linePath([1, 2, null, 4, 5], 10, box);
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.match(/L/g)).toHaveLength(2);
    expect(linePath([null, null], 10, box)).toBe('');
  });

  it('finds the maximum ignoring gaps', () => {
    expect(maxOf([{ id: 'a', label: 'a', values: [1, null, 9] }, { id: 'b', label: 'b', values: [4] }])).toBe(9);
    expect(maxOf([])).toBe(0);
  });

  it('maps a pointer position to the nearest sample', () => {
    expect(nearestIndex(box.left, 10, box)).toBe(0);
    expect(nearestIndex(box.width - box.right, 10, box)).toBe(9);
    expect(nearestIndex(-500, 10, box)).toBe(0);
    expect(nearestIndex(9999, 10, box)).toBe(9);
  });

  it('picks a few evenly spaced x labels that include both ends', () => {
    expect(xLabelIndexes(3)).toEqual([0, 1, 2]);
    const labels = xLabelIndexes(61);
    expect(labels[0]).toBe(0);
    expect(labels.at(-1)).toBe(60);
    expect(labels.length).toBeLessThanOrEqual(6);
  });
});
