import asyncio

from saturn.infrastructure.model_lifecycle import ModelLifecycle


class FakeServer:
    def __init__(self, loaded: bool | None) -> None:
        self.loaded = loaded
        self.unloaded: list[str] = []

    async def is_loaded(self, model: str) -> bool | None:
        return self.loaded

    async def unload(self, model: str) -> bool:
        self.unloaded.append(model)
        self.loaded = False
        return True


async def test_a_model_saturn_loaded_is_unloaded_after_the_idle_period():
    server = FakeServer(loaded=False)
    life = ModelLifecycle(server, idle_unload_s=0.05)
    await life.before_call("m")
    server.loaded = True  # the call loaded it
    life.after_call("m")
    await asyncio.sleep(0.15)
    assert server.unloaded == ["m"]


async def test_a_model_that_was_already_loaded_is_never_unloaded():
    server = FakeServer(loaded=True)
    life = ModelLifecycle(server, idle_unload_s=0.02)
    await life.before_call("m")
    life.after_call("m")
    await asyncio.sleep(0.1)
    await life.shutdown()
    assert server.unloaded == []


async def test_unknown_state_is_treated_as_not_ours():
    server = FakeServer(loaded=None)
    life = ModelLifecycle(server, idle_unload_s=0.02)
    await life.before_call("m")
    life.after_call("m")
    await asyncio.sleep(0.1)
    assert server.unloaded == []


async def test_a_new_call_cancels_the_pending_unload():
    server = FakeServer(loaded=False)
    life = ModelLifecycle(server, idle_unload_s=0.08)
    await life.before_call("m")
    life.after_call("m")
    await asyncio.sleep(0.04)
    await life.before_call("m")  # busy again before the timer fires
    await asyncio.sleep(0.1)
    assert server.unloaded == []
    life.after_call("m")
    await asyncio.sleep(0.15)
    assert server.unloaded == ["m"]


async def test_shutdown_unloads_at_once_and_zero_disables_everything():
    server = FakeServer(loaded=False)
    life = ModelLifecycle(server, idle_unload_s=60)
    await life.before_call("m")
    life.after_call("m")
    await life.shutdown()
    assert server.unloaded == ["m"]

    off_server = FakeServer(loaded=False)
    off = ModelLifecycle(off_server, idle_unload_s=0)
    await off.before_call("m")
    off.after_call("m")
    await off.shutdown()
    assert off_server.unloaded == []


async def test_failed_idle_unload_keeps_ownership_for_shutdown_retry():
    class FailingServer:
        calls = 0
        async def is_loaded(self, model):
            return False
        async def unload(self, model):
            self.calls += 1
            return self.calls > 1
    server = FailingServer()
    life = ModelLifecycle(server, idle_unload_s=60)
    await life.before_call('owned')
    life.after_call('owned')
    await life._unload_if_idle('owned')
    await life.shutdown()
    assert server.calls == 2
