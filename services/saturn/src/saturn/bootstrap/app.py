"""ASGI application: dashboard API, MCP endpoint (/mcp), and the built dashboard, in one process."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from saturn.application.recorder import Caller
from saturn.bootstrap.container import Container, build_container
from saturn.domain.models import RequestMeta
from saturn.transport.access_api import build_access_router
from saturn.transport.authentication import MCPBearerAuthMiddleware
from saturn.transport.hook_api import build_hook_router
from saturn.transport.http_api import build_router
from saturn.transport.internal_timing import InternalTimingMiddleware
from saturn.transport.mcp_server import build_mcp

log = logging.getLogger("saturn")


def _web_dist() -> Path | None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "apps" / "web" / "dist"
        if (candidate / "index.html").is_file():
            return candidate
    return None


def create_app(container: Container | None = None) -> FastAPI:
    container = container or build_container()
    if not container.access.configured:
        log.warning("MCP requests are disabled until a harness is created on Connections.")
    mcp = build_mcp(container)
    mcp_app = mcp.streamable_http_app()

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        async with mcp.session_manager.run():
            folders = [str(f) for f in container.config.policy.folders] or "any workspace"
            log.info("Saturn ready | model=%s | folders=%s | home=%s", container.tunables.model or "(none)", folders,
                     container.settings.home)
            container.access.record("service", "Saturn", "started", "service",
                                    f"port {container.settings.port}; model {container.tunables.model or 'none'}")
            yield
        container.access.record("service", "Saturn", "stopped", "service")
        await container.shutdown()

    app = FastAPI(title="Saturn", version="0.1.0", lifespan=lifespan, docs_url="/api/docs", openapi_url="/api/openapi.json")
    def rejected(reason: str, route: str, address: str) -> None:
        caller = Caller(client=f"unauthenticated client at {address}", meta=RequestMeta(transport=route))
        container.recorder.reject("mcp_request", caller, f"{reason} [unauthorized]", summary="MCP request refused before any tool ran")

    app.add_middleware(MCPBearerAuthMiddleware, access=container.access, on_reject=rejected)
    # Only answer requests addressed to this machine, so a web page cannot reach the API through DNS rebinding.
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=sorted({"127.0.0.1", "localhost", "[::1]", container.settings.host}))
    if container.settings.internal_timing:
        app.add_middleware(InternalTimingMiddleware, telemetry=container.telemetry)
    app.include_router(build_router(container))
    app.include_router(build_access_router(container))
    app.include_router(build_hook_router(container))
    app.router.routes.extend(mcp_app.routes)  # exposes /mcp beside /api without a path prefix

    @app.get("/logo.png", include_in_schema=False)
    def logo() -> FileResponse:
        return FileResponse(Path(__file__).parents[1] / "transport" / "assets" / "logo.png", media_type="image/png")

    dist = _web_dist()
    if dist is not None:
        app.mount("/", StaticFiles(directory=dist, html=True), name="web")
    else:
        @app.get("/")
        def no_dashboard() -> JSONResponse:
            return JSONResponse({"message": "Saturn is running. The dashboard has not been built yet.", "api": "/api/docs", "mcp": "/mcp"})

    app.state.container = container
    return app
