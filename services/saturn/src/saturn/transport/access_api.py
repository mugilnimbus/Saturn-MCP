"""Local owner API for harnesses and their client installs; MCP bearer tokens cannot administer other harnesses."""

from __future__ import annotations

import ipaddress
from collections.abc import Callable, Coroutine
from dataclasses import asdict
from typing import Any
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import BaseModel, ConfigDict, Field

from saturn.bootstrap.container import Container, hook_command, stdio_command
from saturn.domain.access import PRESETS, TOOLS, Harness
from saturn.domain.errors import NotFound, SaturnError
from saturn.transport.hook_api import CODEX_PRE_HOOK_PATH, HOOK_PATH, PRE_HOOK_PATH


class HarnessInput(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    name: str = Field(min_length=1, max_length=80)
    handle: str | None = Field(None, max_length=40)
    tools: list[str] = Field(min_length=1, max_length=5)
    expires_at: float | None = None
    enabled: bool = True
    folders: list[str] = Field(default_factory=list, max_length=20)
    deny: list[str] = Field(default_factory=list, max_length=50)
    hooks: bool = True


class InstallInput(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    client: str = Field(pattern='^(claude|codex)$')
    preset: str = Field('standard', pattern='^(standard|read-only|hands-off)$')
    hooks: bool = True
    apply: bool = False  # false: return the plan only


class RemoveInput(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    client: str = Field(pattern='^(claude|codex)$')
    revoke: bool = False


class EnabledInput(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    enabled: bool


class AccessRoute(APIRoute):
    def get_route_handler(self) -> Callable[[Request], Coroutine[Any, Any, Response]]:
        handler = super().get_route_handler()

        async def no_store(request: Request) -> Response:
            try:
                response = await handler(request)
            except RequestValidationError:
                response = JSONResponse({'detail': 'Check the harness name, permissions, and expiry.'}, status_code=422)
            except HTTPException as exc:
                exc.headers = {**(exc.headers or {}), 'Cache-Control': 'no-store'}
                raise
            response.headers['Cache-Control'] = 'no-store'
            return response

        return no_store


def _owner(request: Request, response: Response) -> None:
    response.headers['Cache-Control'] = 'no-store'
    try:
        local = request.client is not None and ipaddress.ip_address(request.client.host).is_loopback
    except ValueError:
        local = False
    if not local:
        raise HTTPException(403, 'Access management is available only on this computer.')
    origin = request.headers.get('origin')
    if origin:
        try:
            parsed = urlsplit(origin)
        except ValueError as exc:
            raise HTTPException(403, 'Use the local Saturn dashboard to manage access.') from exc
        if parsed.scheme != request.url.scheme or parsed.netloc != request.headers.get('host'):
            raise HTTPException(403, 'Use the local Saturn dashboard to manage access.')
    if request.headers.get('sec-fetch-site') == 'cross-site':
        raise HTTPException(403, 'Cross-site access is not allowed.')
    if request.method != 'GET':
        if request.headers.get('x-client') != 'web':
            raise HTTPException(403, 'Use the local Saturn dashboard to manage access.')
        if request.method in {'POST', 'PUT', 'PATCH'} and request.headers.get('content-type', '').split(';')[0] != 'application/json':
            raise HTTPException(415, 'JSON is required.')


def _changes(changes: list[Any]) -> list[dict[str, Any]]:
    return [{"path": str(c.path), "summary": c.summary, "creates": c.before is None, "before": c.before, "after": c.after}
            for c in changes]


def build_access_router(container: Container) -> APIRouter:
    router = APIRouter(prefix='/api/connections', dependencies=[Depends(_owner)], route_class=AccessRoute)
    access = container.access
    connect = container.connect
    base = container.settings.base_url

    def operation(fn: Any) -> Any:
        try:
            return fn()
        except SaturnError as exc:
            raise HTTPException(404 if isinstance(exc, NotFound) else 400, exc.message) from exc

    def describe(harness: Harness, installs: list[dict[str, Any]]) -> dict[str, Any]:
        return {**asdict(harness), "credential_file": str(access.credential_path(harness)),
                "credential_saved": access.credentials.read(harness.handle) is not None,
                "stdio": list(stdio_command(harness.handle)),
                "hook_commands": {client: hook_command(client, harness.handle) for client in ("claude", "codex")},
                "installs": [i for i in installs if i.get("harness_id") == harness.id]}

    @router.get('')
    def list_connections() -> dict[str, Any]:
        installs = connect.installs()
        events = sorted([*access.events(kind="access", limit=20), *access.events(kind="install", limit=20)],
                        key=lambda e: -e.seq)[:20]
        return {'endpoint': f'{base}/mcp', 'hook_endpoints': {'claude_pre': f'{base}{PRE_HOOK_PATH}',
                                                               'claude_post': f'{base}{HOOK_PATH}',
                                                               'codex_pre': f'{base}{CODEX_PRE_HOOK_PATH}'},
                'tools': TOOLS, 'presets': {k: list(v['tools']) for k, v in PRESETS.items()},
                'clients': connect.clients(),
                'harnesses': [describe(h, installs) for h in access.list_harnesses()],
                'events': [asdict(e) for e in events]}

    @router.post('', status_code=201)
    def create(body: HarnessInput) -> dict[str, Any]:
        harness, token = operation(lambda: access.create(body.name, body.tools, body.expires_at, handle=body.handle,
                                                         folders=body.folders, deny=body.deny, hooks=body.hooks))
        return {'harness': describe(harness, []), 'token': token}

    @router.put('/{harness_id}')
    def edit(harness_id: str, body: HarnessInput) -> dict[str, Any]:
        harness = operation(lambda: access.edit(harness_id, body.name, body.tools, body.expires_at, body.enabled,
                                                folders=body.folders, deny=body.deny, hooks=body.hooks))
        return describe(harness, connect.installs())

    @router.post('/{harness_id}/rotate')
    def rotate(harness_id: str) -> dict[str, Any]:
        harness, token = operation(lambda: access.rotate(harness_id))
        return {'harness': describe(harness, connect.installs()), 'token': token}

    @router.patch('/{harness_id}')
    def set_enabled(harness_id: str, body: EnabledInput) -> dict[str, Any]:
        return describe(operation(lambda: access.set_enabled(harness_id, body.enabled)), connect.installs())

    @router.delete('/{harness_id}')
    def revoke(harness_id: str) -> dict[str, Any]:
        return describe(operation(lambda: access.revoke(harness_id)), connect.installs())

    @router.post('/{harness_id}/install')
    def install(harness_id: str, body: InstallInput) -> dict[str, Any]:
        """Plan (apply=false) or apply Saturn's entries for this harness in a client's configuration."""
        plan = operation(lambda: connect.plan(body.client, harness=harness_id, preset=body.preset, hooks=body.hooks))
        if plan.harness is None:
            raise HTTPException(404, 'Harness not found.')
        if not body.apply:
            return {'client': plan.client, 'changes': _changes(plan.changes)}
        record = operation(lambda: connect.apply(plan, actor='dashboard'))
        return {'client': plan.client, 'record': record, 'changes': _changes(plan.changes)}

    @router.post('/uninstall')
    def uninstall(body: RemoveInput) -> dict[str, Any]:
        return dict(operation(lambda: connect.remove(body.client, actor='dashboard', revoke=body.revoke)))

    return router
