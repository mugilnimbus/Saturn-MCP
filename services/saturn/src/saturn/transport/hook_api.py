"""Hook endpoints for an agent's own shell tool (Claude Code and Codex). Each answers 204 to stay out of the way.

The hook relay (`saturn.bootstrap.hook_relay`) posts here with the harness token, so no token sits in the
client's hook settings. A harness with hooks switched off is always answered with 204.

`PreToolUse`: before a noisy test, build, or lint command runs, decline it and point the agent at
`saturn_run`. This is the only way to keep a failing run small, because Claude Code lets a hook
replace the output of a command that succeeded but not of one that failed.

`PostToolUse`: after a command succeeded, replace long output with a digest. The reply keeps every
field of the original result and changes only the text, because Claude Code ignores a replacement
that does not match the tool's own result shape.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from saturn.application.recorder import Caller
from saturn.application.workspace_scope import choose_workspace
from saturn.bootstrap.container import Container
from saturn.domain.errors import SaturnError
from saturn.domain.models import RequestMeta

MAX_BODY_BYTES = 8_000_000
SHELL_TOOLS = frozenset({"Bash", "PowerShell"})
HOOK_PATH = "/api/hooks/claude/post-tool-use"
PRE_HOOK_PATH = "/api/hooks/claude/pre-tool-use"
CODEX_PRE_HOOK_PATH = "/api/hooks/codex/pre-tool-use"


class PostToolUse(BaseModel):
    model_config = ConfigDict(extra="ignore", hide_input_in_errors=True)
    tool_name: str = ""
    tool_input: dict[str, Any] = Field(default_factory=dict)
    tool_response: Any = None
    cwd: str | None = None


async def _event(request: Request, container: Container) -> tuple[PostToolUse, Any]:
    """Authenticate the caller and parse the hook input, within a size limit."""
    harness = container.access.authenticate(request.headers.get("authorization", ""), touch=True)
    if harness is None:
        raise HTTPException(401, "A valid harness token is required.", headers={"WWW-Authenticate": 'Bearer realm="saturn"',
                                                                              "Cache-Control": "no-store"})
    declared = request.headers.get("content-length", "")
    if declared.isdigit() and int(declared) > MAX_BODY_BYTES:
        raise HTTPException(413, "The tool result is too large for the hook.")
    raw = bytearray()
    async for chunk in request.stream():
        if len(raw) + len(chunk) > MAX_BODY_BYTES:
            raise HTTPException(413, "The tool result is too large for the hook.")
        raw.extend(chunk)
    try:
        return PostToolUse.model_validate_json(bytes(raw)), harness
    except ValueError as exc:
        raise HTTPException(422, "The hook input is not valid JSON for a tool call.") from exc


def _caller(harness: Any, event: PostToolUse, name: str, workspace: str | None, **extra: Any) -> Caller:
    """A hook's caller: the harness, the client and event, and what the hook was given (output sizes, not output)."""
    arguments = {"event": name, "tool_name": event.tool_name, "command": event.tool_input.get("command"), "cwd": event.cwd, **extra}
    return Caller(harness=harness, workspace=workspace, arguments=arguments,
                  meta=RequestMeta(transport="hook", client_info=name))


def _deny(reason: str) -> JSONResponse:
    body = {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}
    return JSONResponse(body, headers={"Cache-Control": "no-store"})


def build_hook_router(container: Container) -> APIRouter:
    router = APIRouter()

    @router.post(HOOK_PATH, include_in_schema=True)
    async def post_tool_use(request: Request) -> Response:
        """Shrink long test, build, or lint output from the agent's own shell tool. Requires a harness token."""
        event, harness = await _event(request, container)
        untouched = Response(status_code=204, headers={"Cache-Control": "no-store"})
        container.config.refresh()
        if (not harness.hooks or not {'saturn_run', 'saturn_query'}.issubset(harness.tools)
                or not container.access.uses_mcp(harness.id)):
            return untouched
        result = event.tool_response
        if event.tool_name not in SHELL_TOOLS or not isinstance(result, dict) or not isinstance(result.get("stdout"), str):
            return untouched
        command = event.tool_input.get("command")
        stderr = result.get("stderr")
        caller = _caller(harness, event, "claude PostToolUse", event.cwd, stdout_chars=len(result["stdout"]),
                         stderr_chars=len(stderr) if isinstance(stderr, str) else 0)
        try:
            text = await container.hooks.shell_output(
                command=command if isinstance(command, str) else "", stdout=result["stdout"],
                stderr=stderr if isinstance(stderr, str) else "", caller=caller,
            )
        except SaturnError:
            return untouched  # a hook must never turn a working tool call into a failure
        if text is None:
            return untouched
        container.recorder.respond(caller, text)
        replacement = {**result, "stdout": text}
        if "stderr" in result:
            replacement["stderr"] = ""
        body = {"hookSpecificOutput": {"hookEventName": "PostToolUse", "updatedToolOutput": replacement}}
        return JSONResponse(body, headers={"Cache-Control": "no-store"})

    async def redirect(request: Request, shells: frozenset[str], name: str) -> Response:
        event, harness = await _event(request, container)
        proceed = Response(status_code=204, headers={"Cache-Control": "no-store"})
        command = event.tool_input.get("command")
        if event.tool_name not in shells or not isinstance(command, str) or not harness.hooks:
            return proceed
        # Never send the agent to a tool it may not have: the harness must be allowed saturn_run, and must have
        # reached the MCP endpoint since Saturn started.
        if "saturn_run" not in harness.tools or not container.access.uses_mcp(harness.id) or not event.cwd:
            return proceed
        container.config.refresh()
        try:
            folders = choose_workspace(container.config.policy, harness, workspace_root=event.cwd)
        except SaturnError:
            return proceed
        scoped = container.for_call(folders)
        caller = _caller(harness, event, name, str(folders[0]))
        reason = await scoped.hooks.redirect(command=command, cwd=event.cwd, shell=event.tool_name, caller=caller)
        if reason is None:
            return proceed
        container.recorder.respond(caller, reason)
        return _deny(reason)

    @router.post(PRE_HOOK_PATH, include_in_schema=True)
    async def pre_tool_use(request: Request) -> Response:
        """Decline a noisy shell command in favour of saturn_run, when this harness's agent is known to have that tool."""
        return await redirect(request, SHELL_TOOLS, "claude PreToolUse")

    @router.post(CODEX_PRE_HOOK_PATH, include_in_schema=True)
    async def codex_pre_tool_use(request: Request) -> Response:
        """Codex's PreToolUse for its Bash tool: the same redirect. Codex cannot replace output afterwards."""
        return await redirect(request, frozenset({"Bash"}), "codex PreToolUse")

    return router
