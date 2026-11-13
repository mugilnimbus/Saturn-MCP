"""Launcher signals must preserve server startup and graceful cleanup."""

import asyncio

import pytest

from saturn.bootstrap.managed_server import serve_managed


class Server:
    started = False
    should_exit = False
    cleaned_up = False

    async def serve(self):
        while not self.started:
            await asyncio.sleep(0.01)
        while not self.should_exit:
            await asyncio.sleep(0.01)
        self.cleaned_up = True


@pytest.mark.parametrize("stop_before_startup", [False, True])
async def test_ready_only_after_binding_and_stop_runs_cleanup(tmp_path, stop_before_startup):
    server = Server()
    if stop_before_startup:
        (tmp_path / "stop").touch()
    task = asyncio.create_task(serve_managed(server, tmp_path))
    try:
        await asyncio.sleep(0.03)
        assert not (tmp_path / "ready").exists()
        assert not server.should_exit
        server.started = True
        # The watcher polls every 0.2 s, and a loaded Windows runner can run late; allow 5 s.
        for _ in range(500):
            if (tmp_path / "ready").exists():
                break
            await asyncio.sleep(0.01)
        assert (tmp_path / "ready").exists()
        (tmp_path / "stop").touch()
        await asyncio.wait_for(task, timeout=2)
        assert server.should_exit and server.cleaned_up
    finally:
        if not task.done():
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task


async def test_failed_startup_does_not_leave_a_watcher(tmp_path):
    class FailingServer:
        started = False

        async def serve(self):
            raise RuntimeError("cannot bind")

    before = asyncio.all_tasks()
    with pytest.raises(RuntimeError, match="cannot bind"):
        await serve_managed(FailingServer(), tmp_path)
    assert asyncio.all_tasks() == before
    assert not (tmp_path / "ready").exists()
