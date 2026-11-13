/* Hash routes. Deep links work on reload (for example #/runs/<id> or #/runs?status=error).
   Pure parse and format, so they are unit tested. */

export const SETTINGS_TABS = ['model', 'commands', 'appearance'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const RUN_STATUSES = ['ok', 'error', 'running'] as const;
export type RunStatusFilter = (typeof RUN_STATUSES)[number];

export interface RunQuery {
  status?: RunStatusFilter;
  tool?: string;
  /** Harness id. */
  harness?: string;
}

export type Route =
  | { name: 'home' }
  | ({ name: 'runs' } & RunQuery)
  | ({ name: 'run'; runId: string } & RunQuery)
  | { name: 'changes' }
  | { name: 'artifacts' }
  | { name: 'artifact'; artifactId: string }
  | { name: 'model' }
  | { name: 'connections' }
  | { name: 'settings'; tab: SettingsTab };

export type Section = 'home' | 'runs' | 'artifacts' | 'model' | 'connections' | 'settings';

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const TOOL = /^(saturn_[a-z]{2,20}|model_check)$/;
const HARNESS = /^[a-f0-9]{32}$/;

function runQuery(search: string): RunQuery {
  const params = new URLSearchParams(search);
  const status = params.get('status');
  const tool = params.get('tool');
  const harness = params.get('harness');
  return {
    ...((RUN_STATUSES as readonly string[]).includes(status ?? '') ? { status: status as RunStatusFilter } : {}),
    ...(tool && TOOL.test(tool) ? { tool } : {}),
    ...(harness && HARNESS.test(harness) ? { harness } : {}),
  };
}

function queryString(q: RunQuery): string {
  const params = new URLSearchParams();
  if (q.status) params.set('status', q.status);
  if (q.tool) params.set('tool', q.tool);
  if (q.harness) params.set('harness', q.harness);
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function parseRoute(hash: string): Route {
  const [path = '', search = ''] = hash.replace(/^#\/?/, '').split('?');
  const [name = '', arg = ''] = path.split('/').map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return '';
    }
  });
  switch (name) {
    case 'runs':
      return ID.test(arg) ? { name: 'run', runId: arg, ...runQuery(search) } : { name: 'runs', ...runQuery(search) };
    case 'changes':
      return { name: 'changes' };
    case 'artifacts':
      return ID.test(arg) ? { name: 'artifact', artifactId: arg } : { name: 'artifacts' };
    case 'model':
      return { name: 'model' };
    case 'connections':
      return { name: 'connections' };
    case 'settings':
      return { name: 'settings', tab: (SETTINGS_TABS as readonly string[]).includes(arg) ? (arg as SettingsTab) : 'model' };
    default:
      return { name: 'home' };
  }
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'runs':
      return `#/runs${queryString(route)}`;
    case 'run':
      return `#/runs/${route.runId}${queryString(route)}`;
    case 'artifact':
      return `#/artifacts/${route.artifactId}`;
    case 'settings':
      return `#/settings/${route.tab}`;
    default:
      return `#/${route.name}`;
  }
}

export function sectionOf(route: Route): Section {
  switch (route.name) {
    case 'runs':
    case 'run':
    case 'changes':
      return 'runs';
    case 'artifacts':
    case 'artifact':
      return 'artifacts';
    case 'model':
      return 'model';
    case 'connections':
      return 'connections';
    case 'settings':
      return 'settings';
    default:
      return 'home';
  }
}
