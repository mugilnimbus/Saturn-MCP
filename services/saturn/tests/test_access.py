"""Harness lifecycle, credential files, the audit log, the browser boundary, and real MCP tool dispatch."""

import json
import time

import pytest
from fastapi.testclient import TestClient

from saturn.application.access_service import AccessService
from saturn.bootstrap.app import create_app
from saturn.domain.errors import InvalidInput
from saturn.domain.redaction import redact
from saturn.infrastructure.access_store import SqliteAccessStore
from saturn.infrastructure.credential_files import CredentialFiles
from saturn.infrastructure.db import Database

HEADERS = {'X-Client': 'web', 'Origin': 'http://127.0.0.1:9000'}


def test_hash_only_storage_credential_files_rotation_revocation_and_restart(tmp_path):
    path = tmp_path / 'access.db'
    files = CredentialFiles(tmp_path / 'credentials')
    db = Database(path)
    access = AccessService(SqliteAccessStore(db), files)
    assert not access.configured
    harness, token = access.create('Harness A', ['saturn_read'], None, actor='terminal')
    assert harness.handle == 'harness-a' and files.read('harness-a') == token
    row = db.query_one('SELECT * FROM harnesses WHERE id=?', (harness.id,))
    assert token not in str(dict(row))
    assert access.authenticate(f'Bearer {token}').id == harness.id
    _, rotated = access.rotate(harness.id)
    assert access.authenticate(f'Bearer {token}') is None and files.read('harness-a') == rotated
    access.revoke(harness.id)
    assert files.read('harness-a') is None
    db.close()
    db = Database(path)
    restored = AccessService(SqliteAccessStore(db), files)
    assert restored.authenticate(f'Bearer {rotated}') is None
    assert len(restored.list_harnesses()) == 1
    events = restored.events()
    assert [e.action for e in events] == ['revoked', 'rotated', 'created']
    assert events[-1].actor == 'terminal' and events[0].actor == 'dashboard'
    assert token not in json.dumps([e.__dict__ for e in events])
    db.close()


def test_handles_are_unique_while_active_and_reusable_after_revocation(tmp_path):
    access = AccessService(SqliteAccessStore(Database(':memory:')), CredentialFiles(None))
    first, _ = access.create('Codex', ['saturn_read'])
    second, _ = access.create('Codex', ['saturn_read'])
    assert (first.handle, second.handle) == ('codex', 'codex-2')
    with pytest.raises(InvalidInput):
        access.create('Other', ['saturn_read'], handle='codex')
    with pytest.raises(InvalidInput):
        access.create('Other', ['saturn_read'], handle='Bad Handle')
    access.revoke(first.id)
    assert access.create('Again', ['saturn_read'], handle='codex')[0].handle == 'codex'
    assert access.get('codex').name == 'Again'


def test_limits_disabled_expired_and_invalid_permissions(tmp_path):
    access = AccessService(SqliteAccessStore(Database(':memory:')), CredentialFiles(None))
    h, token = access.create('A', ['saturn_read'], time.time() + 60, folders=[str(tmp_path)], deny=['cargo *'], hooks=False)
    assert h.folders == (str(tmp_path.resolve()),) and h.deny == ('cargo *',) and h.hooks is False
    access.edit(h.id, 'Renamed', ['saturn_search'], h.expires_at, False)
    assert access.authenticate(f'Bearer {token}') is None
    edited = access.edit(h.id, 'Renamed', ['saturn_search'], h.expires_at, True, deny=[], hooks=True)
    assert edited.deny == () and edited.hooks and edited.folders == h.folders
    assert access.authenticate(f'Bearer {token}').tools == ('saturn_search',)
    access.store.db.execute('UPDATE harnesses SET expires_at=? WHERE id=?', (time.time() - 1, h.id))
    assert access.authenticate(f'Bearer {token}') is None
    for tools, expiry, extra in [([], None, {}), (['unknown'], None, {}), (['saturn_read'], time.time() - 1, {}),
                                 (['saturn_read'], None, {'folders': ['relative/path']}),
                                 (['saturn_read'], None, {'deny': ['rm | sh']})]:
        with pytest.raises(InvalidInput):
            access.create('Invalid', tools, expiry, **extra)
    text, count = redact(f'raw {token} rotated {access.rotate(h.id)[1]}')
    assert token not in text and count == 2


@pytest.fixture
def local(make_container, tmp_path, monkeypatch):
    monkeypatch.setenv('CLAUDE_CONFIG_DIR', str(tmp_path / 'claude'))
    monkeypatch.setenv('CODEX_HOME', str(tmp_path / 'codex'))
    container = make_container()
    with TestClient(create_app(container), base_url='http://127.0.0.1:9000', client=('127.0.0.1', 1234)) as client:
        yield client, container


def test_owner_api_secrets_and_destructive_controls(local):
    client, container = local
    response = client.post('/api/connections', headers=HEADERS, json={'name': 'Codex', 'tools': ['saturn_read'],
                                                                      'deny': ['npm run e2e'], 'hooks': False})
    assert response.status_code == 201 and response.headers['cache-control'] == 'no-store'
    issued = response.json()
    token, harness_id = issued['token'], issued['harness']['id']
    assert issued['harness']['stdio'][-2:] == ['--harness', 'codex'] and issued['harness']['credential_saved']
    listed = client.get('/api/connections')
    assert token not in listed.text and listed.headers['cache-control'] == 'no-store'
    assert {c['name'] for c in listed.json()['clients']} == {'claude', 'codex'}
    proxied = client.get('/api/connections', headers={'Host': '127.0.0.1:5173'})
    assert proxied.json()['endpoint'] == 'http://127.0.0.1:9000/mcp'
    proxy_headers = {'Host': '127.0.0.1:5173', 'Origin': 'http://127.0.0.1:5173', 'X-Client': 'web'}
    assert client.post('/api/connections', headers=proxy_headers,
                       json={'name': 'Dev proxy harness', 'tools': ['saturn_read']}).status_code == 201
    assert container.access.authenticate(f'Bearer {token}')
    assert client.patch(f'/api/connections/{harness_id}', headers=HEADERS, json={'enabled': False}).status_code == 200
    assert container.access.authenticate(f'Bearer {token}') is None
    assert client.patch(f'/api/connections/{harness_id}', headers=HEADERS, json={'enabled': True}).status_code == 200
    rotated = client.post(f'/api/connections/{harness_id}/rotate', headers=HEADERS, json={})
    assert rotated.status_code == 200 and container.access.authenticate(f'Bearer {token}') is None
    assert client.delete(f'/api/connections/{harness_id}', headers=HEADERS).status_code == 200
    assert container.access.authenticate(f'Bearer {rotated.json()["token"]}') is None
    assert client.put(f'/api/connections/{harness_id}', headers=HEADERS,
                      json={'name': 'Revived', 'tools': ['saturn_run']}).status_code == 400
    events = client.get('/api/events?kind=access').json()['events']
    assert [e['action'] for e in events][:4] == ['revoked', 'rotated', 'enabled', 'disabled']
    assert all(e['actor'] == 'dashboard' for e in events)


def test_install_plans_then_applies_and_removes_for_both_clients(local, tmp_path):
    client, container = local
    harness = client.post('/api/connections', headers=HEADERS, json={'name': 'Claude Code', 'tools': ['saturn_read',
                          'saturn_run', 'saturn_query']}).json()['harness']
    plan = client.post(f"/api/connections/{harness['id']}/install", headers=HEADERS, json={'client': 'claude'}).json()
    assert len(plan['changes']) == 2 and not (tmp_path / 'claude' / 'settings.json').exists()
    applied = client.post(f"/api/connections/{harness['id']}/install", headers=HEADERS,
                          json={'client': 'claude', 'apply': True, 'preset': 'standard'}).json()
    config = json.loads((tmp_path / 'claude' / '.claude.json').read_text())
    assert config['mcpServers']['saturn']['args'][-2:] == ['--harness', 'claude-code'] and 'env' in config['mcpServers']['saturn']
    settings = json.loads((tmp_path / 'claude' / 'settings.json').read_text())
    assert settings['permissions']['allow'] == ['mcp__saturn__saturn_read', 'mcp__saturn__saturn_query']
    assert 'saturn.bootstrap.hook_relay claude PreToolUse --harness claude-code' in json.dumps(settings['hooks'])
    assert applied['record']['handle'] == 'claude-code'
    listed = client.get('/api/connections').json()
    assert listed['harnesses'][0]['installs'][0]['client'] == 'claude'
    codex = client.post(f"/api/connections/{harness['id']}/install", headers=HEADERS,
                        json={'client': 'codex', 'apply': True, 'preset': 'hands-off', 'hooks': False}).json()
    assert codex['record']['client'] == 'codex'
    text = (tmp_path / 'codex' / 'config.toml').read_text()
    assert 'default_tools_approval_mode = "approve"' in text and 'hooks.PreToolUse' not in text
    removed = client.post('/api/connections/uninstall', headers=HEADERS, json={'client': 'claude', 'revoke': True}).json()
    assert removed['revoked'] and 'saturn' not in json.loads((tmp_path / 'claude' / '.claude.json').read_text())['mcpServers']
    kinds = [(e['kind'], e['action']) for e in client.get('/api/events').json()['events']]
    assert ('install', 'removed') in kinds and ('install', 'installed') in kinds


@pytest.mark.parametrize('headers', [{}, {'X-Client': 'web', 'Origin': 'https://evil.example'},
                                     {'X-Client': 'web', 'Sec-Fetch-Site': 'cross-site'}, {'X-Client': 'evil'}])
def test_browser_cross_site_writes_refused(local, headers):
    client, container = local
    assert client.post('/api/connections', headers=headers, json={'name': 'A', 'tools': ['saturn_read']}).status_code == 403
    assert container.access.list_harnesses() == []


def test_remote_management_refused(make_container):
    container = make_container()
    with TestClient(create_app(container), base_url='http://127.0.0.1:9000', client=('192.0.2.1', 1234)) as client:
        assert client.get('/api/connections').status_code == 403
        assert client.post('/api/connections', headers={'X-Client': 'web'}, json={'name': 'A', 'tools': ['saturn_read']}).status_code == 403


def test_real_mcp_dispatch_permissions_folders_and_identity(local, root, tmp_path):
    client, container = local
    (root / 'hello.txt').write_text('Hello Saturn')
    h, token = container.access.create('Verified harness', ['saturn_read'], None)
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json, text/event-stream'}
    initialized = client.post('/mcp', headers=headers, json={
        'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {'protocolVersion': '2025-11-25', 'capabilities': {},
                                                                    'clientInfo': {'name': 'Spoofed client', 'version': '1'}}})
    assert initialized.status_code == 200
    headers.update({'Mcp-Session-Id': initialized.headers['mcp-session-id'], 'MCP-Protocol-Version': '2025-11-25'})

    def call(tool, arguments):
        return client.post('/mcp', headers=headers, json={'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call',
                                                          'params': {'name': tool, 'arguments': arguments}})
    denied = call('saturn_run', {'command': 'git status'})
    assert 'permission_denied' in denied.text
    rejected = container.telemetry.list_runs()[0]
    assert rejected['route'] == 'rejected' and rejected['client'] == h.label and rejected['summary'] == 'git status'
    read = call('saturn_read', {'path': str(root / 'hello.txt'), 'workspace_root': str(root)})
    assert 'Hello Saturn' in read.text, read.text
    run = container.telemetry.list_runs()[0]
    assert run['transport'] == 'http' and run['client_info'] == 'Spoofed client 1' and run['session_id']
    assert run['client'] == h.label and run['harness_id'] == h.id and run['workspace'] == str(root.resolve())
    assert container.access.list_harnesses()[0].last_used_at is not None
    elsewhere = tmp_path / 'elsewhere'
    elsewhere.mkdir()
    assert 'not inside the folders' in call('saturn_read', {'path': 'x', 'workspace_root': str(elsewhere)}).text
    container.access.edit(h.id, h.name, ['saturn_read'], None, True, folders=[str(root / 'pkg')])
    assert "not one of this harness's folders" in call('saturn_read', {'path': 'hello.txt', 'workspace_root': str(root)}).text
    container.access.edit(h.id, h.name, ['saturn_search'], None, True)
    assert 'permission_denied' in call('saturn_read', {'path': str(root / 'hello.txt')}).text
    container.access.revoke(h.id)
    assert call('saturn_read', {'path': str(root / 'hello.txt')}).status_code == 401
