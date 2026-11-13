"""Require a configured bearer credential before dispatching any MCP HTTP request."""

from __future__ import annotations

import contextlib
from collections.abc import Callable

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from saturn.application.access_service import AccessService
from saturn.domain.internal_timing import interval

Rejection = Callable[[str, str, str], None]  # (reason, route, client address) for a refused tool request


class MCPBearerAuthMiddleware:
    def __init__(self, app: ASGIApp, *, access: AccessService, on_reject: Rejection | None = None) -> None:
        self.app = app
        self.access = access
        self.on_reject = on_reject

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get("path", "")
        if scope["type"] != "http" or not (path == "/mcp" or path.startswith("/mcp/")):
            await self.app(scope, receive, send)
            return
        if not self.access.configured:
            response = JSONResponse(
                {"error": "MCP authentication is not configured. Create a harness on the Connections page."},
                status_code=503, headers={"Cache-Control": "no-store"},
            )
            await response(scope, receive, send)
            return
        values = [value for name, value in scope["headers"] if name.lower() == b"authorization"]
        valid = False
        if len(values) == 1:
            with interval('authenticate'):
                harness = self.access.authenticate(values[0].decode('latin-1'), touch=True)
            valid = harness is not None
            if harness is not None:
                self.access.saw_mcp(harness.id)
        if not valid and scope.get("method") == "POST" and self.on_reject is not None:
            # GET and DELETE are stream housekeeping; only a refused request that could carry a tool call is recorded.
            headers = {name.decode("latin-1").lower(): value.decode("latin-1") for name, value in scope["headers"]}
            client = scope.get("client")
            address = f"{client[0]}:{client[1]}" if client else "unknown"
            reason = "No bearer token was sent." if not values else "The bearer token is wrong, disabled, expired, or revoked."
            with contextlib.suppress(Exception):  # recording a refusal must never change the answer
                self.on_reject(reason, headers.get("x-saturn-transport", "http")[:20], address)
        if not valid:
            challenge = 'Bearer realm="saturn"'
            if values:
                challenge += ', error="invalid_token"'
            response = JSONResponse(
                {"error": "A valid MCP bearer token is required."}, status_code=401,
                headers={"WWW-Authenticate": challenge, "Cache-Control": "no-store"},
            )
            await response(scope, receive, send)
            return
        await self.app(scope, receive, send)
