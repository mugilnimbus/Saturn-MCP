import { describe, expect, it } from 'vitest';
import { connectCommand, expiryError, handleFrom, HANDLE, lines, localDate, manualSetup, status, type Harness } from './access';
import { parseRoute, routeHref, sectionOf } from '../../lib/state/routes';

const python = 'C:\\Program Files\\saturn\\.venv\\Scripts\\python.exe';
const h: Harness = {
  id: 'a', name: 'A', handle: 'claude-code', tools: ['saturn_run', 'saturn_read'], enabled: true, created_at: 1, expires_at: null,
  revoked_at: null, last_used_at: null, folders: [], deny: [], hooks: true, credential_file: 'C:\\Users\\me\\.saturn\\credentials\\claude-code.token',
  credential_saved: true, stdio: [python, '-m', 'saturn.bootstrap.cli', 'stdio', '--harness', 'claude-code'],
  hook_commands: {
    claude: '"C:/Program Files/saturn/.venv/Scripts/python.exe" -m saturn.bootstrap.hook_relay claude {event} --harness claude-code',
    codex: '"C:/Program Files/saturn/.venv/Scripts/python.exe" -m saturn.bootstrap.hook_relay codex {event} --harness claude-code',
  },
  installs: [],
};
const endpoint = 'http://127.0.0.1:9000/mcp';

describe('Connections', () => {
  it('has its own sidebar route', () => {
    expect(parseRoute('#/connections')).toEqual({ name: 'connections' });
    expect(routeHref({ name: 'connections' })).toBe('#/connections');
    expect(sectionOf({ name: 'connections' })).toBe('connections');
  });

  it('shows revoked and expired credentials honestly', () => {
    expect(status(h)).toBe('Active');
    expect(status({ ...h, expires_at: 2 }, 3)).toBe('Expired');
    expect(status({ ...h, enabled: false })).toBe('Disabled');
    expect(status({ ...h, revoked_at: 2, enabled: false })).toBe('Revoked');
  });

  it('builds Claude Code setup that names the harness and holds no token', () => {
    const [server, hooks] = manualSetup(h, 'claude', endpoint);
    expect(JSON.parse(server.code)).toEqual({ mcpServers: { saturn: { type: 'stdio', command: python, args: h.stdio.slice(1), env: {} } } });
    const parsed = JSON.parse(hooks.code).hooks;
    expect(parsed.PreToolUse[0]).toEqual({ matcher: 'Bash|PowerShell', hooks: [{ type: 'command', timeout: 10, command: h.hook_commands.claude.replace('{event}', 'PreToolUse') }] });
    expect(parsed.PostToolUse[0].hooks[0].command).toContain('hook_relay claude PostToolUse --harness claude-code');
  });

  it('writes a Windows path into Codex TOML without escaping, with both timeouts and the harness tools', () => {
    const [block, hook] = manualSetup(h, 'codex', endpoint);
    expect(block.code).toContain(`command = '${python}'`);
    expect(block.code).toContain('args = ["-m", "saturn.bootstrap.cli", "stdio", "--harness", "claude-code"]');
    expect(block.code).toContain('startup_timeout_sec = 60');
    expect(block.code).toContain('tool_timeout_sec = 330');
    expect(block.code).toContain('enabled_tools = ["saturn_run", "saturn_read"]');
    expect(hook.code).toContain('hook_relay codex PreToolUse --harness claude-code');
    const quoted = manualSetup({ ...h, stdio: ["C:\\it's\\python.exe", ...h.stdio.slice(1)] }, 'codex', endpoint)[0].code;
    expect(quoted).toContain('command = "C:\\\\it\'s\\\\python.exe"');
  });

  it('never puts a token in any setup, and points other clients at the token file', () => {
    const all = (['claude', 'codex', 'other'] as const).flatMap((c) => manualSetup(h, c, endpoint));
    expect(all.some((b) => b.code.includes('stn_'))).toBe(false);
    const [command, http] = manualSetup(h, 'other', endpoint);
    expect(command.code).toBe(`"${python}" -m saturn.bootstrap.cli stdio --harness claude-code`);
    expect(http.code).toBe(`${endpoint}\nAuthorization: Bearer <token>`);
    expect(http.note).toContain(h.credential_file);
  });

  it('suggests valid handles and the matching terminal command', () => {
    expect(handleFrom('Claude Code (work)')).toBe('claude-code-work');
    expect(handleFrom('  !!  ')).toBe('harness');
    expect(HANDLE.test(handleFrom('x'.repeat(60)))).toBe(true);
    expect(connectCommand(h, 'codex', 'read-only', false)).toBe('saturn connect codex --harness claude-code --preset read-only --no-hooks');
    expect(lines(' C:\\a \n\n C:\\b\r\n')).toEqual(['C:\\a', 'C:\\b']);
  });

  it('handles local optional expiry', () => {
    expect(expiryError('')).toBeNull();
    expect(expiryError('invalid')).toBeTruthy();
    expect(expiryError('2000-01-01T01:00')).toBeTruthy();
    expect(expiryError(localDate(Date.now() / 1000 + 3600))).toBeNull();
    expect(localDate(null)).toBe('');
  });
});
