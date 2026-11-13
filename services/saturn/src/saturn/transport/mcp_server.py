"""MCP transport: five tools over Streamable HTTP. Thin handlers; all behavior lives in services.

Tool descriptions are deliberately short: they are paid for in the calling
agent's context on every turn.
"""

from __future__ import annotations

import asyncio
import contextlib
import re
import time
from collections.abc import Awaitable
from dataclasses import replace
from pathlib import Path
from typing import Annotated, Any
from urllib.parse import unquote, urlsplit

from mcp.server import MCPServer
from mcp.server.mcpserver import Context
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import Icon, ToolAnnotations
from pydantic import Field

from saturn.application.recorder import Caller, Step
from saturn.application.workspace_scope import choose_workspace
from saturn.bootstrap.container import Container
from saturn.domain.access import Harness
from saturn.domain.errors import SaturnError
from saturn.domain.internal_timing import set_profile, timed
from saturn.domain.models import RequestMeta
from saturn.transport.internal_timing import STATE_KEY
from saturn.transport.server_info import INSTRUCTIONS


@timed("client_roots", "backend")
async def _client_roots(ctx: Context) -> tuple[Path, ...]:
    """Folders from the optional MCP roots/list request; never assume every client has that back-channel."""
    capabilities = ctx.session.client_capabilities
    if capabilities is None or capabilities.roots is None:
        return ()
    try:
        result = await asyncio.wait_for(ctx.session.list_roots(), timeout=2)
    except Exception:  # noqa: BLE001 - optional client capability may be unavailable
        return ()
    parsed = []
    for root in result.roots:
        url = urlsplit(str(root.uri))
        if url.scheme != "file" or url.netloc not in ("", "localhost"):
            continue
        path = unquote(url.path)
        if len(path) > 2 and path[0] == "/" and path[2] == ":":
            path = path[1:]
        parsed.append(Path(path))
    return tuple(parsed)


_PRINTABLE = re.compile(r"[^\x20-\x7e]")


def _origin(ctx: Context) -> RequestMeta:
    """Where the request came from: route, client name and version, MCP session and request ids."""
    headers = ctx.headers
    client = ""
    if headers is not None:
        client = _PRINTABLE.sub("", headers.get("x-saturn-client", ""))[:120]
    if not client:
        with contextlib.suppress(Exception):  # client info is optional metadata
            info = ctx.session.client_params.client_info
            client = f"{info.name} {info.version}".strip()
    transport = "in-process" if headers is None else (headers.get("x-saturn-transport", "") or "http")
    return RequestMeta(transport=_PRINTABLE.sub("", transport)[:20], client_info=client or None,
                       session_id=headers.get("mcp-session-id") if headers is not None else None,
                       request_id=str(ctx.request_id) if ctx.request_id is not None else None)


def _summary(arguments: dict[str, Any]) -> str:
    for key in ("command", "path", "pattern", "task", "artifact_id"):
        if arguments.get(key):
            return str(arguments[key])
    return ""


@timed("authenticate")
def _harness(ctx: Context, container: Container) -> Harness | None:
    """The calling harness for an HTTP request; None for an in-process client."""
    if ctx.headers is None:
        return None
    harness = container.access.authenticate(ctx.headers.get("authorization", ""))
    if harness is None:
        raise ToolError("A valid MCP bearer token is required. [unauthorized]")
    return harness


async def _scope(ctx: Context, container: Container, tool: str, arguments: dict[str, Any], workspace_root: str | None,
                 cwd: str | None = None, *, workspace_optional: bool = False) -> tuple[Container, Caller]:
    """Refresh configuration, identify the caller, and pick the folders this call may use.

    Both steps are timed and become the run's first spans; a refusal at either step is recorded as a rejected run.
    """
    request = ctx.request_context.request
    set_profile(request.scope.get("state", {}).get(STATE_KEY) if request is not None else None)
    container.config.refresh()
    meta = _origin(ctx)
    base = Caller(client=meta.client_info, meta=meta, arguments=arguments)
    started = time.time()
    try:
        harness = _harness(ctx, container)
    except ToolError as exc:
        container.recorder.reject(tool, base, str(exc), summary=_summary(arguments))
        raise
    base = replace(base, harness=harness, client=None if harness else meta.client_info)
    if harness is not None and tool not in harness.tools:
        reason = "This harness does not have permission to use this tool. [permission_denied]"
        container.recorder.reject(tool, base, reason, summary=_summary(arguments))
        raise ToolError(reason)
    who = harness.label if harness else (meta.client_info or "in-process client")
    attrs = {"caller": who, "tool": tool, "route": meta.transport}
    with contextlib.suppress(Exception):  # the negotiated version; newer protocol versions have no session id
        attrs["protocol"] = ctx.protocol_version or ""
    authenticated = Step("authenticate", started, time.time(), attrs=attrs)
    started = time.time()
    roots = () if workspace_root else await _client_roots(ctx)
    try:
        folders = choose_workspace(container.config.policy, harness, workspace_root=workspace_root, client_roots=roots, cwd=cwd)
    except SaturnError as exc:
        if workspace_optional and not workspace_root:
            return container, replace(base, steps=(authenticated,))
        reason = f"{exc.message} [{exc.code}]"
        container.recorder.reject(tool, replace(base, steps=(authenticated,)), reason, summary=_summary(arguments))
        raise ToolError(reason) from exc
    chosen = Step("workspace", started, time.time(),
                  attrs={"folder": str(folders[0]), "from": "workspace_root" if workspace_root else "client roots" if roots else "default"})
    return container.for_call(folders), replace(base, workspace=str(folders[0]), steps=(authenticated, chosen))


async def _heartbeat(ctx: Context, interval: float) -> None:
    """Report progress while a call runs, so a client's idle timer does not end a long command early.

    Sending is a no-op when the client did not ask for progress on this call.
    """
    started = time.monotonic()
    while True:
        await asyncio.sleep(interval)
        elapsed = time.monotonic() - started
        try:
            await ctx.report_progress(elapsed, None, f"Still working ({elapsed:.0f} s)")
        except Exception:  # noqa: BLE001 - a client that went away must not fail the call it abandoned
            return


async def _guarded(ctx: Context, interval: float, scoped: Container, caller: Caller, coro: Awaitable[str]) -> str:
    """Run the operation with progress updates, and keep the exact reply (or error text) on the run."""
    beat = asyncio.create_task(_heartbeat(ctx, interval)) if interval > 0 else None
    try:
        text: str = await coro
        scoped.recorder.respond(caller, text)
        return text
    except SaturnError as exc:
        reply = f"{exc.message} [{exc.code}]"
        scoped.recorder.respond(caller, reply)
        raise ToolError(reply) from exc
    finally:
        if beat is not None:
            beat.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await beat


def build_mcp(container: Container) -> MCPServer:
    host = container.settings.host
    if host in {"0.0.0.0", "::"}:
        host = "127.0.0.1"
    if ":" in host:
        host = f"[{host}]"
    mcp = MCPServer("saturn", title="Saturn", instructions=INSTRUCTIONS,
                    icons=[Icon(src=f"http://{host}:{container.settings.port}/logo.png", mime_type="image/png")])
    read_only = ToolAnnotations(read_only_hint=True, open_world_hint=False)

    def interval() -> float:
        return float(container.tunables.progress_interval_s)

    @mcp.tool(
        annotations=ToolAnnotations(read_only_hint=False, destructive_hint=False, open_world_hint=False),
        structured_output=False,
    )
    async def saturn_run(
        command: Annotated[str, Field(description="One command, no shell operators, e.g. 'pytest -q'.")],
        ctx: Context,
        cwd: str | None = None,
        goal: Annotated[str | None, Field(description="What you want to learn, if the output may be long.")] = None,
        workspace_root: Annotated[str | None, Field(description="Current project folder (absolute); send it on every call.")] = None,
    ) -> str:
        """Run a test, build, lint, or read-only git command. Long output comes back as a digest plus an artifact id."""
        arguments = {"command": command, "cwd": cwd, "goal": goal, "workspace_root": workspace_root}
        scoped, caller = await _scope(ctx, container, "saturn_run", arguments, workspace_root, cwd)
        return await _guarded(ctx, interval(), scoped, caller, scoped.commands.run(command, cwd=cwd, goal=goal, caller=caller))

    @mcp.tool(annotations=read_only, structured_output=False)
    async def saturn_read(
        path: str,
        ctx: Context,
        start: Annotated[int | None, Field(ge=1)] = None,
        end: Annotated[int | None, Field(ge=1)] = None,
        workspace_root: Annotated[str | None, Field(description="Current project folder (absolute); send it on every call.")] = None,
    ) -> str:
        """Read a file with line numbers. A long file returns an outline; then ask for lines start to end."""
        arguments = {"path": path, "start": start, "end": end, "workspace_root": workspace_root}
        scoped, caller = await _scope(ctx, container, "saturn_read", arguments, workspace_root)
        return await _guarded(ctx, interval(), scoped, caller, scoped.workspace.read(path, start=start, end=end, caller=caller))

    @mcp.tool(annotations=read_only, structured_output=False)
    async def saturn_search(
        pattern: Annotated[str, Field(description="Regex, case-insensitive.")],
        ctx: Context,
        path: str | None = None,
        glob: Annotated[str | None, Field(description="e.g. '*.py'")] = None,
        context: Annotated[int, Field(ge=0, le=3)] = 0,
        workspace_root: Annotated[str | None, Field(description="Current project folder (absolute); send it on every call.")] = None,
    ) -> str:
        """Search files. Returns the first matches within a size budget and counts for the rest."""
        arguments = {"pattern": pattern, "path": path, "glob": glob, "context": context, "workspace_root": workspace_root}
        scoped, caller = await _scope(ctx, container, "saturn_search", arguments, workspace_root)
        return await _guarded(ctx, interval(), scoped, caller, scoped.workspace.search(
            pattern, path=path, glob=glob, context=context, max_matches=40, caller=caller))

    @mcp.tool(annotations=read_only, structured_output=False)
    async def saturn_ask(
        task: Annotated[str, Field(description="A specific question about the code.")],
        ctx: Context,
        paths: Annotated[list[str] | None, Field(description="Files or folders to look in.")] = None,
        workspace_root: Annotated[str | None, Field(description="Current project folder (absolute); send it on every call.")] = None,
    ) -> str:
        """Delegate a question: a read-only worker explores files and answers briefly with verified line references."""
        arguments = {"task": task, "paths": paths, "workspace_root": workspace_root}
        scoped, caller = await _scope(ctx, container, "saturn_ask", arguments, workspace_root)
        return await _guarded(ctx, interval(), scoped, caller, scoped.ask.ask(task, paths=paths, caller=caller))

    @mcp.tool(annotations=read_only, structured_output=False)
    async def saturn_query(
        artifact_id: str,
        ctx: Context,
        pattern: str | None = None,
        lines: Annotated[str | None, Field(description="e.g. '120-180'")] = None,
        question: str | None = None,
        workspace_root: Annotated[str | None, Field(description="Current project folder (absolute); send it for file-backed research.")] = None,
    ) -> str:
        """Read part of a stored output (art_...). Give exactly one of: pattern (regex), lines, or question."""
        arguments = {"artifact_id": artifact_id, "pattern": pattern, "lines": lines, "question": question,
                     "workspace_root": workspace_root}
        scoped, caller = await _scope(ctx, container, "saturn_query", arguments, workspace_root, workspace_optional=True)
        return await _guarded(ctx, interval(), scoped, caller, scoped.ask.query(
            artifact_id, pattern=pattern, lines=lines, question=question, context=1, caller=caller))

    return mcp
