"""Local launcher control through per-run files, without an HTTP shutdown endpoint."""

from __future__ import annotations

import asyncio
import contextlib
from pathlib import Path

import uvicorn


async def serve_managed(server: uvicorn.Server, control_dir: Path) -> None:
    """Publish readiness after binding, and translate a stop request into graceful shutdown."""
    async def watch() -> None:
        announced = False
        while True:
            if server.started:
                if not announced:
                    (control_dir / "ready").touch()
                    announced = True
                if (control_dir / "stop").exists():
                    server.should_exit = True
                    return
            await asyncio.sleep(0.2)

    watcher = asyncio.create_task(watch())
    try:
        await server.serve()
    finally:
        watcher.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await watcher
