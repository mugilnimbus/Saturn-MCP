"""A connected or abruptly disconnected MCP stream must not prevent process exit."""

import asyncio
import contextlib
import os
import socket
import struct
import sys
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest
import uvicorn

from saturn.bootstrap import cli
from saturn.bootstrap.container import build_container
from saturn.infrastructure import config
from saturn.infrastructure.config import Settings

SERVICE = Path(__file__).resolve().parents[1]


def test_cli_shutdown_finishes_when_socket_cleanup_never_completes(monkeypatch):
    """Model a reset transport that never detaches from asyncio's TCP server."""
    settings = Settings(_env_file=None, shutdown_grace_s=1)
    monkeypatch.setattr(config, "get_settings", lambda: settings)
    actual_server = uvicorn.Server
    cleanup = []

    class StuckListener:
        def close(self):
            pass

        async def wait_closed(self):
            await asyncio.Event().wait()

    async def application_shutdown():
        cleanup.append("application")

    def server_factory(config):
        server = actual_server(config)
        server.servers = [StuckListener()]
        server.lifespan = SimpleNamespace(shutdown=application_shutdown)
        server.run = lambda: asyncio.run(asyncio.wait_for(server.shutdown(), timeout=3))
        return server

    monkeypatch.setattr(uvicorn, "Server", server_factory)
    cli.main(["serve"])
    assert cleanup == ["application"]


@pytest.mark.parametrize("reset_connection", [False, True])
async def test_managed_stop_exits_with_mcp_stream(tmp_path, reset_connection):
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    control = tmp_path / "control"
    control.mkdir()
    home = tmp_path / "home"
    prepared = build_container(Settings(_env_file=None, home_raw=str(home)), service=False)
    _, TOKEN = prepared.access.create("Shutdown test", ["saturn_read"])
    prepared.close()
    environment = dict(os.environ, SATURN_HOME=str(home), LOCAL_SERVER_API_KEY="")
    writer = None
    with (tmp_path / "server.log").open("wb") as log:
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "saturn.bootstrap.cli", "serve", "--port", str(port), "--control-dir", str(control),
            cwd=SERVICE, env=environment, stdout=log, stderr=log,
        )
        try:
            async with asyncio.timeout(10):
                while not (control / "ready").exists():
                    assert process.returncode is None, (tmp_path / "server.log").read_text()
                    await asyncio.sleep(0.05)
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://127.0.0.1:{port}/mcp",
                    headers={"Authorization": f"Bearer {TOKEN}", "Accept": "application/json, text/event-stream"},
                    json={"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
                        "protocolVersion": "2025-11-25", "capabilities": {},
                        "clientInfo": {"name": "shutdown-test", "version": "1"},
                    }},
                )
            assert response.status_code == 200
            session = response.headers["mcp-session-id"]
            reader, writer = await asyncio.open_connection("127.0.0.1", port)
            writer.write((f"GET /mcp HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nAccept: text/event-stream\r\n"
                          f"Authorization: Bearer {TOKEN}\r\nMcp-Session-Id: {session}\r\n"
                          "MCP-Protocol-Version: 2025-11-25\r\n\r\n").encode("ascii"))
            await writer.drain()
            headers = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout=5)
            assert b"200 OK" in headers
            if reset_connection:
                linger = struct.pack("HH" if os.name == "nt" else "ii", 1, 0)
                writer.get_extra_info("socket").setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, linger)
                writer.close()
                with contextlib.suppress(OSError):
                    await writer.wait_closed()
                await asyncio.sleep(0.1)
            (control / "stop").touch()
            assert await asyncio.wait_for(process.wait(), timeout=8) == 0
            output = (tmp_path / "server.log").read_text(encoding="utf-8")
            assert "Application shutdown complete" in output and "Finished server process" in output
            with socket.socket() as probe:
                assert probe.connect_ex(("127.0.0.1", port)) != 0
        finally:
            if writer is not None:
                writer.close()
                with contextlib.suppress(OSError):
                    await writer.wait_closed()
            if process.returncode is None:
                process.kill()  # Only the isolated process created by this test.
                await process.wait()
