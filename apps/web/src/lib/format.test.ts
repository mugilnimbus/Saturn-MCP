import { describe, expect, it } from 'vitest';
import { ago, bytes, compact, duration, percent, routeLabel, toolName } from './format';

describe('format', () => {
  it('shortens large counts and groups small ones', () => {
    expect(compact(0)).toBe('0');
    expect(compact(1234)).toBe('1,234');
    expect(compact(12_345)).toBe('12.3k');
    expect(compact(123_456)).toBe('123k');
    expect(compact(1_234_567)).toBe('1.23M');
    expect(compact(-12_345)).toBe('-12.3k');
  });

  it('formats shares, and shows a dash when there is nothing to divide', () => {
    expect(percent(0.953)).toBe('95%');
    expect(percent(0.953, 1)).toBe('95.3%');
    expect(percent(null)).toBe('–');
    expect(percent(Number.NaN)).toBe('–');
  });

  it('picks a readable unit for durations', () => {
    expect(duration(0.34)).toBe('340 ms');
    expect(duration(2.44)).toBe('2.4 s');
    expect(duration(42)).toBe('42 s');
    expect(duration(72)).toBe('1 min 12 s');
    expect(duration(null)).toBe('–');
  });

  it('formats sizes and relative times', () => {
    expect(bytes(900)).toBe('900 B');
    expect(bytes(29_318)).toBe('28.6 KB');
    expect(bytes(5_000_000)).toBe('4.8 MB');
    const now = 1_000_000_000_000;
    expect(ago(now / 1000 - 2, now)).toBe('just now');
    expect(ago(now / 1000 - 90, now)).toBe('1 min ago');
    expect(ago(now / 1000 - 7200, now)).toBe('2 h ago');
  });

  it('names tools and routes for people', () => {
    expect(toolName('saturn_run')).toBe('run');
    expect(routeLabel('digest+llm')).toBe('Digest with model');
    expect(routeLabel('')).toBe('In progress');
    expect(routeLabel('something-new')).toBe('something-new');
  });
});
