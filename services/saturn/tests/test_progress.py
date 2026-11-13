"""A long tool call tells the client it is still alive, so the client's idle timer does not end it."""

import asyncio
from collections.abc import Sequence
from pathlib import Path

from conftest import FakeRunner
from mcp import Client

from saturn.application.ports import CommandResult
from saturn.transport.mcp_server import build_mcp


class SlowRunner(FakeRunner):
    def __init__(self, seconds: float) -> None:
        super().__init__("done\n")
        self.seconds = seconds

    async def run(self, argv: Sequence[str], cwd: Path, timeout_s: float) -> CommandResult:
        await asyncio.sleep(self.seconds)
        return await super().run(argv, cwd, timeout_s)


async def test_a_slow_command_reports_progress_until_it_finishes(make_container):
    container = make_container(runner=SlowRunner(0.35), progress_interval_s=0.05)
    seen: list[tuple[float, str | None]] = []

    async def on_progress(progress: float, total: float | None, message: str | None) -> None:
        seen.append((progress, message))

    async with Client(build_mcp(container)) as client:
        result = await client.call_tool("saturn_run", {"command": "pytest -q"}, progress_callback=on_progress)

    assert not result.is_error and "done" in result.content[0].text
    assert len(seen) >= 3
    assert [p for p, _ in seen] == sorted(p for p, _ in seen)  # elapsed time only grows
    assert all(message and message.startswith("Still working") for _, message in seen)


async def test_a_fast_call_sends_no_progress_and_zero_turns_it_off(make_container):
    seen: list[float] = []

    async def on_progress(progress: float, total: float | None, message: str | None) -> None:
        seen.append(progress)

    fast = make_container(runner=FakeRunner("ok\n"), progress_interval_s=5)
    async with Client(build_mcp(fast)) as client:
        await client.call_tool("saturn_run", {"command": "pytest -q"}, progress_callback=on_progress)
    off = make_container(runner=SlowRunner(0.2), progress_interval_s=0)
    async with Client(build_mcp(off)) as client:
        await client.call_tool("saturn_run", {"command": "pytest -q"}, progress_callback=on_progress)
    assert seen == []


async def test_a_refused_call_still_stops_its_heartbeat(make_container):
    container = make_container(runner=SlowRunner(0.0), progress_interval_s=0.01)
    async with Client(build_mcp(container)) as client:
        denied = await client.call_tool("saturn_run", {"command": "curl http://example.com"})
        assert denied.is_error
    await asyncio.sleep(0.05)
    leftover = [t for t in asyncio.all_tasks() if getattr(t.get_coro(), "__name__", "") == "_heartbeat"]
    assert leftover == []
