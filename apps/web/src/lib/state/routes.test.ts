import { describe, expect, it } from 'vitest';
import { parseRoute, routeHref, sectionOf, type Route } from './routes';

describe('routes', () => {
  it('parses known hashes and falls back to home', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/runs')).toEqual({ name: 'runs' });
    expect(parseRoute('#/runs/ab12cd34ef56')).toEqual({ name: 'run', runId: 'ab12cd34ef56' });
    expect(parseRoute('#/artifacts/art_1a2b3c4d5e')).toEqual({ name: 'artifact', artifactId: 'art_1a2b3c4d5e' });
    expect(parseRoute('#/model')).toEqual({ name: 'model' });
    expect(parseRoute('#/settings/appearance')).toEqual({ name: 'settings', tab: 'appearance' });
    expect(parseRoute('#/nope')).toEqual({ name: 'home' });
  });

  it('keeps run filters in the link, and drops values it does not know', () => {
    expect(parseRoute('#/runs?status=error&tool=saturn_run')).toEqual({ name: 'runs', status: 'error', tool: 'saturn_run' });
    expect(parseRoute('#/runs/abc?status=error')).toEqual({ name: 'run', runId: 'abc', status: 'error' });
    expect(parseRoute('#/runs?status=exploded&tool=<script>&harness=../x')).toEqual({ name: 'runs' });
  });

  it('rejects ids that are not plain identifiers', () => {
    expect(parseRoute('#/runs/..%2Fetc')).toEqual({ name: 'runs' });
    expect(parseRoute('#/artifacts/<script>')).toEqual({ name: 'artifacts' });
    expect(parseRoute('#/runs/%E0%A4%A')).toEqual({ name: 'runs' });
  });

  it('defaults an unknown settings tab', () => {
    expect(parseRoute('#/settings/zzz')).toEqual({ name: 'settings', tab: 'model' });
    expect(parseRoute('#/settings/worker')).toEqual({ name: 'settings', tab: 'model' });
  });

  it('round-trips every route', () => {
    const routes: Route[] = [
      { name: 'home' },
      { name: 'runs' },
      { name: 'runs', status: 'error', tool: 'saturn_ask' },
      { name: 'run', runId: 'ab12', status: 'ok' },
      { name: 'artifacts' },
      { name: 'artifact', artifactId: 'art_ff00' },
      { name: 'model' },
      { name: 'settings', tab: 'model' },
      { name: 'settings', tab: 'commands' },
      { name: 'changes' },
      { name: 'runs', harness: 'ab'.repeat(16) },
    ];
    for (const route of routes) expect(parseRoute(routeHref(route))).toEqual(route);
  });

  it('maps each route to its section', () => {
    expect(sectionOf({ name: 'run', runId: 'x' })).toBe('runs');
    expect(sectionOf({ name: 'artifact', artifactId: 'x' })).toBe('artifacts');
    expect(sectionOf({ name: 'home' })).toBe('home');
    expect(sectionOf({ name: 'changes' })).toBe('runs');
  });
});
