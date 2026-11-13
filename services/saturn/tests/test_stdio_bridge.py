"""The stdio bridge: a command-launching client reaches the real HTTP service through it."""

import asyncio
import contextlib
import os
import socket
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from mcp import Client, StdioServerParameters

from saturn.bootstrap import cli, launcher
from saturn.bootstrap.container import build_container
from saturn.infrastructure.config import Settings
from saturn.transport import stdio_bridge
from saturn.transport.stdio_bridge import BridgeError, ServiceGuard

SERVICE = Path(__file__).resolve().parents[1]


def free_port() -> int:
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        return int(reservation.getsockname()[1])


def prepare_home(tmp_path: Path) -> str:
    """A Saturn home with one harness (handle `bridge-test`), quick progress updates, and no model server."""
    home = tmp_path / "home"
    container = build_container(Settings(_env_file=None, home_raw=str(home)), service=False)
    container.config.save_settings({"progress_interval_s": 0.2, "base_url": "http://127.0.0.1:9/v1"}, actor="terminal")
    _, token = container.access.create("Bridge test", ["saturn_read", "saturn_run"], handle="bridge-test")
    container.close()
    return token


def server_environment(tmp_path: Path) -> dict[str, str]:
    return dict(os.environ, SATURN_HOME=str(tmp_path / "home"), LOCAL_SERVER_API_KEY="")


@contextlib.asynccontextmanager
async def running_server(tmp_path: Path, port: int):
    """A real Saturn HTTP service in its own process, as the launcher would run it."""
    control = tmp_path / "control"
    control.mkdir(exist_ok=True)
    with (tmp_path / "server.log").open("wb") as log:
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "saturn.bootstrap.cli", "serve", "--port", str(port), "--control-dir", str(control),
            cwd=SERVICE, env=server_environment(tmp_path), stdout=log, stderr=log,
        )
        try:
            async with asyncio.timeout(20):
                while not (control / "ready").exists():
                    assert process.returncode is None, (tmp_path / "server.log").read_text()
                    await asyncio.sleep(0.05)
            yield
        finally:
            (control / "stop").touch()
            with contextlib.suppress(TimeoutError):
                await asyncio.wait_for(process.wait(), timeout=15)
            if process.returncode is None:
                process.kill()
                await process.wait()


def bridge(port: int, token: str | None, cwd: Path, *, harness: str | None = None, home: Path | None = None) -> StdioServerParameters:
    environment = dict(os.environ, SATURN_URL=f"http://127.0.0.1:{port}")
    environment.pop("SATURN_TOKEN", None)
    if token is not None:
        environment["SATURN_TOKEN"] = token
    if home is not None:
        environment["SATURN_HOME"] = str(home)
    args = ["-m", "saturn.bootstrap.cli", "stdio"] + (["--harness", harness] if harness else [])
    # Started in the project folder, as a client does; that folder becomes the default workspace.
    return StdioServerParameters(command=sys.executable, args=args, env=environment, cwd=str(cwd))


async def test_a_stdio_client_uses_saturn_through_the_bridge(tmp_path):
    (tmp_path / "notes.txt").write_text("alpha\nbeta\ngamma\n", encoding="utf-8")
    (tmp_path / "test_slow.py").write_text("import time\n\n\ndef test_wait():\n    time.sleep(1.2)\n", encoding="utf-8")
    elsewhere = tmp_path / "elsewhere"
    elsewhere.mkdir()
    port = free_port()
    progress: list[str | None] = []

    async def on_progress(value: float, total: float | None, message: str | None) -> None:
        progress.append(message)

    prepare_home(tmp_path)
    home = tmp_path / "home"
    async with running_server(tmp_path, port), Client(bridge(port, None, tmp_path, harness="bridge-test", home=home)) as client:
        names = {tool.name for tool in (await client.list_tools()).tools}
        assert names == {"saturn_run", "saturn_read", "saturn_search", "saturn_ask", "saturn_query"}
        assert "long output" in (client.instructions or "")

        read = await client.call_tool("saturn_read", {"path": "notes.txt"})  # no workspace_root: the bridge's folder
        assert not read.is_error and "2 | beta" in read.content[0].text
        other = await client.call_tool("saturn_read", {"path": "x.txt", "workspace_root": str(elsewhere)})
        assert other.is_error and "x.txt" in other.content[0].text  # an explicit workspace wins

        refused = await client.call_tool("saturn_run", {"command": "curl http://example.com"})
        assert refused.is_error and "policy_violation" in refused.content[0].text

        slow = await client.call_tool("saturn_run", {"command": "python -m pytest test_slow.py -q -p no:cacheprovider"},
                                      progress_callback=on_progress)
        assert not slow.is_error and "1 passed" in slow.content[0].text
        assert progress and all(m and m.startswith("Still working") for m in progress)  # relayed over HTTP, then stdio


async def test_a_wrong_or_missing_token_is_explained_to_the_agent(tmp_path):
    port = free_port()
    prepare_home(tmp_path)
    async with running_server(tmp_path, port):
        async with Client(bridge(port, "stn_wrong-token-wrong-token-wrong-token-wrong", tmp_path)) as client:
            denied = await client.call_tool("saturn_read", {"path": "notes.txt"})
            assert denied.is_error and "rejected the harness token" in denied.content[0].text
            assert "stn_wrong" not in denied.content[0].text
        async with Client(bridge(port, None, tmp_path)) as client:
            missing = await client.call_tool("saturn_read", {"path": "notes.txt"})
            assert missing.is_error and "No harness token" in missing.content[0].text
        async with Client(bridge(port, None, tmp_path, harness="nobody", home=tmp_path / "home")) as client:
            unknown = await client.call_tool("saturn_read", {"path": "notes.txt"})
            assert unknown.is_error and "No token for harness 'nobody'" in unknown.content[0].text


async def test_a_stopped_saturn_is_reported_not_hung_on(tmp_path):
    async with Client(bridge(free_port(), "stn_" + "x" * 43, tmp_path)) as client:  # nothing listens there, and SATURN_URL means "do not start it"
        down = await client.call_tool("saturn_read", {"path": "notes.txt"})
        assert down.is_error and "Saturn is not running" in down.content[0].text


# ---- starting Saturn when it is down ---------------------------------------------------------------


async def test_the_guard_starts_saturn_once_and_waits_for_it(tmp_path):
    port = free_port()
    starts: list[int] = []
    stack = contextlib.AsyncExitStack()
    loop = asyncio.get_running_loop()

    def start() -> None:  # runs in a worker thread, like the real launcher call
        starts.append(1)
        asyncio.run_coroutine_threadsafe(stack.enter_async_context(running_server(tmp_path, port)), loop).result(timeout=30)

    prepare_home(tmp_path)

    guard = ServiceGuard(f"http://127.0.0.1:{port}", start, wait_s=20)
    try:
        await asyncio.gather(guard.ensure(), guard.ensure(), guard.ensure())  # three first requests at once
        assert starts == [1]
        assert await stdio_bridge.is_healthy(f"http://127.0.0.1:{port}")
        await guard.ensure()  # already running: used directly
        assert starts == [1]
    finally:
        await stack.aclose()


async def test_the_guard_reports_a_start_that_fails_or_never_answers():
    def broken() -> None:
        raise ValueError("PowerShell 7 is required")

    with pytest.raises(BridgeError, match="could not be started: PowerShell 7 is required"):
        await ServiceGuard(f"http://127.0.0.1:{free_port()}", broken).ensure()
    with pytest.raises(BridgeError, match="did not answer"):
        await ServiceGuard(f"http://127.0.0.1:{free_port()}", lambda: None, wait_s=0.6).ensure()
    with pytest.raises(BridgeError, match="Start it with 'saturn start'"):
        await ServiceGuard(f"http://127.0.0.1:{free_port()}", None).ensure()


def test_the_quiet_start_keeps_the_callers_streams_and_runs_from_the_project_root(monkeypatch, tmp_path):
    seen: dict[str, object] = {}

    def fake_run(command, **options):
        seen.update(command=command, **options)
        options["stdout"].write(b'{"status": "error", "message": "The port is occupied."}')
        return subprocess.CompletedProcess(command, 1)

    monkeypatch.setattr(launcher, "_launcher_command", lambda action, **_: (["pwsh", action], tmp_path))
    monkeypatch.setattr(launcher.subprocess, "run", fake_run)
    with pytest.raises(ValueError, match="The port is occupied."):
        launcher.start_quietly()
    assert seen["command"] == ["pwsh", "start"] and seen["cwd"] == tmp_path
    assert seen["stdin"] == subprocess.DEVNULL and seen["stderr"] == subprocess.DEVNULL
    assert seen["stdout"] not in (None, subprocess.PIPE)  # a pipe would be held open by the started server

    monkeypatch.setattr(launcher.subprocess, "run", lambda command, **_: subprocess.CompletedProcess(command, 0))
    launcher.start_quietly()


@pytest.mark.parametrize("platform", ["nt", "posix"])
@pytest.mark.parametrize("url, starts", [("http://127.0.0.1:9123/", False), ("", True)])
def test_the_stdio_command_targets_this_checkout_unless_told_otherwise(monkeypatch, url, starts, platform):
    seen: dict[str, object] = {}

    async def fake_bridge(mcp_url, token, guard, **_):
        seen.update(mcp_url=mcp_url, token=token, starter=guard._starter)

    monkeypatch.setattr(stdio_bridge, "run_bridge", fake_bridge)
    monkeypatch.setattr(cli, "os", SimpleNamespace(name=platform, environ=os.environ))
    monkeypatch.setenv("SATURN_TOKEN", " stn_example ")
    monkeypatch.setenv("SATURN_URL", url)
    with pytest.raises(SystemExit) as result:
        cli.main(["stdio"])
    assert result.value.code == 0 and seen["token"] == "stn_example"
    if starts and platform == "nt":
        assert seen["starter"] is launcher.start_quietly and str(seen["mcp_url"]).endswith("/mcp")
    else:
        assert seen["starter"] is None
        assert str(seen["mcp_url"]).endswith("/mcp")
    if url:
        assert seen["mcp_url"] == "http://127.0.0.1:9123/mcp"
