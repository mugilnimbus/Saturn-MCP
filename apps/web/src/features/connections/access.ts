import type { ClientName, Harness, Preset } from '../../lib/api/types';
export type { ClientName, Connections, Credential, Harness, HarnessInput, Preset } from '../../lib/api/types';

export const TOOL_HELP: Record<string, string> = {
  saturn_run: 'Run allowed commands', saturn_read: 'Read workspace files', saturn_search: 'Search workspace files',
  saturn_ask: 'Ask the worker to explore files', saturn_query: 'Read stored results',
};
export const PRESET_HELP: Record<Preset, { label: string; text: string }> = {
  standard: { label: 'Standard', text: 'All five tools. Reads run without asking; the client asks before Saturn runs a command.' },
  'read-only': { label: 'Read-only', text: 'No command running: read, search, ask, and query only.' },
  'hands-off': { label: 'Hands-off', text: 'All five tools, and the client never asks. For trusted machines.' },
};
export const CLIENT_TITLE: Record<ClientName, string> = { claude: 'Claude Code', codex: 'Codex' };

export interface SetupBlock { title: string; code: string; note?: string }

const json = (value: unknown) => JSON.stringify(value, null, 2);
/** A TOML string. Windows paths go in a literal string so their backslashes need no escaping. */
export const toml = (value: string): string => (value.includes("'") ? JSON.stringify(value) : `'${value}'`);
const shellWord = (value: string): string => (/[\s"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value);

/** Manual setup for one harness and client. None of it holds a token: the commands read the harness's token file. */
export function manualSetup(h: Harness, client: ClientName | 'other', endpoint: string): SetupBlock[] {
  const [command, ...args] = h.stdio;
  if (client === 'claude') {
    const hook = (event: string, timeout: number) => [{ matcher: 'Bash|PowerShell', hooks: [{ type: 'command', timeout, command: h.hook_commands.claude.replace('{event}', event) }] }];
    return [
      { title: 'Add to ~/.claude.json (servers for every project)', code: json({ mcpServers: { saturn: { type: 'stdio', command, args, env: {} } } }),
        note: 'Merge into the existing mcpServers. Saturn starts on demand. Start a new session afterwards.' },
      { title: 'Optional: shell hooks in ~/.claude/settings.json', code: json({ hooks: { PreToolUse: hook('PreToolUse', 10), PostToolUse: hook('PostToolUse', 120) } }),
        note: 'Plain test, build, and lint commands go to saturn_run; nothing changes when Saturn is not running.' },
    ];
  }
  if (client === 'codex') {
    const block = [
      '[mcp_servers.saturn]', `command = ${toml(command)}`, `args = [${args.map((a) => JSON.stringify(a)).join(', ')}]`,
      'startup_timeout_sec = 60', 'tool_timeout_sec = 330', `enabled_tools = [${h.tools.map((t) => JSON.stringify(t)).join(', ')}]`,
      'default_tools_approval_mode = "writes"',
    ].join('\n');
    const hook = ['[[hooks.PreToolUse]]', 'matcher = "^Bash$"', '', '[[hooks.PreToolUse.hooks]]', 'type = "command"',
      `command = ${toml(h.hook_commands.codex.replace('{event}', 'PreToolUse'))}`, 'timeout = 10'].join('\n');
    return [
      { title: 'Add to ~/.codex/config.toml', code: block, note: 'Restart Codex afterwards. The timeouts let a long test run finish.' },
      { title: 'Optional: a shell hook in the same file', code: hook, note: 'Codex runs a new hook only after you trust it with /hooks.' },
    ];
  }
  return [
    { title: 'Command (stdio)', code: h.stdio.map(shellWord).join(' '), note: 'Reads the token from the harness’s token file and starts Saturn if needed.' },
    { title: 'Or Streamable HTTP', code: `${endpoint}\nAuthorization: Bearer <token>`,
      note: `Saturn must be running. The token is in ${h.credential_file}.` },
  ];
}

export function connectCommand(h: Harness, client: ClientName, preset: Preset, hooks: boolean): string {
  return `saturn connect ${client} --harness ${h.handle} --preset ${preset} ${hooks ? '--hooks' : '--no-hooks'}`;
}

export function status(h: Harness, now = Date.now() / 1000): string {
  if (h.revoked_at !== null) return 'Revoked';
  if (!h.enabled) return 'Disabled';
  if (h.expires_at !== null && h.expires_at <= now) return 'Expired';
  return 'Active';
}
export function localDate(seconds: number | null): string {
  if (seconds === null) return '';
  const d = new Date(seconds * 1000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
export function expiryError(value: string): string | null {
  if (!value) return null;
  const seconds = new Date(value).getTime() / 1000;
  return !Number.isFinite(seconds) || seconds <= Date.now() / 1000 ? 'Choose a future expiry date.' : null;
}
/** One entry per non-empty line. */
export function lines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
/** A handle suggestion for a name, matching the service's rule. */
export function handleFrom(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '') || 'harness';
}
export const HANDLE = /^[a-z0-9][a-z0-9-]{0,39}$/;
