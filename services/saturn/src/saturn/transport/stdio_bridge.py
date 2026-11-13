"""Stdio bridge: lets a client that can only launch a local command use the running Saturn service.

The client starts this process and speaks MCP over stdin and stdout. Every request is forwarded to
Saturn's HTTP endpoint with the harness token, so permissions, traces, and the dashboard work exactly
as they do for an HTTP client. A call without workspace_root gets this process's working folder, which
is the project the client was started in. The bridge holds no state: each request opens its own short connection,
which means a restarted Saturn is picked up on the next call with no reconnect logic.

Nothing but MCP messages may be written to stdout. Diagnostics go to stderr.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

import httpx
import httpx2  # the HTTP client type the MCP SDK's transport takes
import mcp.types as types
from mcp import Client, MCPError
from mcp.client.streamable_http import streamable_http_client
from mcp.server import Server, ServerRequestContext
from mcp.server.stdio import stdio_server

from saturn.transport.server_info import INSTRUCTIONS

log = logging.getLogger("saturn.stdio")

Starter = Callable[[], None]


class BridgeError(Exception):
    """A problem the calling agent can act on; its message is shown to the agent as is."""


async def is_healthy(base_url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{base_url}/api/health")
        return response.status_code == 200
    except httpx.HTTPError:
        return False


class ServiceGuard:
    """Makes sure the Saturn service answers before a request is forwarded, starting it once if it is down."""

    def __init__(self, base_url: str, starter: Starter | None, *, wait_s: float = 45.0) -> None:
        self._base_url = base_url
        self._starter = starter
        self._wait_s = wait_s
        self._lock = asyncio.Lock()

    async def ensure(self) -> None:
        if await is_healthy(self._base_url):
            return
        if self._starter is None:
            raise BridgeError(f"Saturn is not running at {self._base_url}. Start it with 'saturn start', then try again.")
        async with self._lock:  # several first requests must not start several servers
            if await is_healthy(self._base_url):
                return
            log.info("Saturn is not running; starting it in the background")
            try:
                await asyncio.to_thread(self._starter)
            except Exception as exc:  # noqa: BLE001 - whatever stopped the start is the message the agent needs
                raise BridgeError(f"Saturn is not running and could not be started: {exc}") from exc
            deadline = asyncio.get_running_loop().time() + self._wait_s
            while asyncio.get_running_loop().time() < deadline:
                if await is_healthy(self._base_url):
                    return
                await asyncio.sleep(0.5)
            raise BridgeError(f"Saturn was started but did not answer at {self._base_url} within {self._wait_s:.0f} s.")


def _bridge_error(exc: BaseException) -> BridgeError | None:
    """Find our own error inside whatever the transport's task groups wrapped it in."""
    seen: list[BaseException] = [exc]
    for item in seen:
        if isinstance(item, BridgeError):
            return item
        if len(seen) < 40:
            seen.extend(getattr(item, "exceptions", ()))
            seen.extend(e for e in (item.__cause__, item.__context__) if e is not None and e not in seen)
    return None


class Bridge:
    def __init__(self, mcp_url: str, token: str, guard: ServiceGuard, *, workspace: str | None = None,
                 missing_token: str = "") -> None:
        self._url = mcp_url
        self._token = token
        self._guard = guard
        self._workspace = workspace
        self._missing = missing_token or ("No harness token. Run `saturn connect` for this client, or set SATURN_TOKEN "
                                          "in this server's env block. [unauthorized]")

    @contextlib.asynccontextmanager
    async def _upstream(self, client: str = "") -> AsyncIterator[Client]:
        if not self._token:
            raise BridgeError(self._missing)
        await self._guard.ensure()
        # The route and the real client's name travel with each request, so Saturn's traces show who called.
        headers = {"Authorization": f"Bearer {self._token}", "X-Saturn-Transport": "stdio"}
        if client:
            headers["X-Saturn-Client"] = client
        # The read timeout must outlast the longest command; progress messages keep the stream active meanwhile.
        timeout = httpx2.Timeout(30.0, read=360.0)
        async with httpx2.AsyncClient(headers=headers, timeout=timeout) as http:
            transport = streamable_http_client(self._url, http_client=http)
            async with Client(transport, client_info=types.Implementation(name="saturn-stdio", version="1")) as upstream:
                yield upstream

    async def _explain(self, exc: BaseException) -> str:
        """A short sentence the agent can act on. The MCP client hides HTTP status codes, so ask Saturn directly.

        The token is never part of the message.
        """
        own = _bridge_error(exc)
        if own is not None:
            return str(own)
        status: int | None = None
        try:
            async with httpx.AsyncClient(timeout=5.0) as probe:
                answer = await probe.post(self._url, json={}, headers={"Authorization": f"Bearer {self._token}",
                                                                      "Accept": "application/json, text/event-stream"})
                status = answer.status_code
        except httpx.HTTPError:
            return "Saturn stopped answering during the request. Try again; it is started on demand."
        if status == 401:
            return ("Saturn rejected the harness token (wrong, revoked, disabled, or expired). Check the harness on "
                    "Saturn's Connections page or run `saturn doctor`. [unauthorized]")
        if status == 503:
            return "Saturn has no harness yet. Create one on its Connections page. [not_configured]"
        return f"Saturn could not complete the request ({type(exc).__name__}). Its log has the details."

    async def list_tools(self, _ctx: ServerRequestContext[Any], _params: types.PaginatedRequestParams | None) -> types.ListToolsResult:
        try:
            async with self._upstream() as client:
                return await client.list_tools()
        except Exception as exc:  # noqa: BLE001 - reported to the client as a protocol error it can show
            raise MCPError(types.INTERNAL_ERROR, await self._explain(exc)) from exc

    async def call_tool(self, ctx: ServerRequestContext[Any], params: types.CallToolRequestParams) -> types.CallToolResult:
        async def forward_progress(progress: float, total: float | None, message: str | None) -> None:
            with contextlib.suppress(Exception):  # progress is a courtesy; it must never fail the call
                await ctx.session.report_progress(progress, total, message)

        arguments = dict(params.arguments or {})
        client = ""
        with contextlib.suppress(Exception):  # client info is optional metadata
            info = ctx.session.client_params.client_info  # type: ignore[union-attr]  # absent params are suppressed
            client = "".join(ch for ch in f"{info.name} {info.version}".strip() if 32 <= ord(ch) < 127)[:120]
        if self._workspace and not arguments.get("workspace_root"):
            arguments["workspace_root"] = self._workspace
        try:
            async with self._upstream(client) as upstream:
                return await upstream.call_tool(params.name, arguments, progress_callback=forward_progress)
        except Exception as exc:  # noqa: BLE001 - the agent gets a readable tool error instead of a dead connection
            return types.CallToolResult(content=[types.TextContent(type="text", text=await self._explain(exc))], is_error=True)

    def server(self) -> Server[Any]:
        return Server("saturn", title="Saturn", instructions=INSTRUCTIONS, on_list_tools=self.list_tools,
                      on_call_tool=self.call_tool)


async def run_bridge(mcp_url: str, token: str, guard: ServiceGuard, *, warm_up: Callable[[], Awaitable[None]] | None = None,
                     workspace: str | None = None, missing_token: str = "") -> None:
    """Serve MCP on stdin and stdout until the client closes the stream."""
    server = Bridge(mcp_url, token, guard, workspace=workspace, missing_token=missing_token).server()
    # Start Saturn while the client is still initializing, so its first real request does not wait for it.
    warm = asyncio.create_task(_quietly(warm_up or guard.ensure))
    try:
        async with stdio_server() as (read, write):
            await server.run(read, write, server.create_initialization_options())
    finally:
        warm.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await warm


async def _quietly(action: Callable[[], Awaitable[None]]) -> None:
    try:
        await action()
    except Exception as exc:  # noqa: BLE001 - the same failure is reported properly on the first request
        log.warning("warm-up failed: %s", exc)
