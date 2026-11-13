"""Frees the model's memory when Saturn is idle.

The local server loads a model on first use. If a Saturn request caused that load,
Saturn unloads the model after a short idle period and at shutdown. A model
that was already loaded when Saturn first needed it belongs to someone else and
is never unloaded.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from typing import Protocol

log = logging.getLogger("saturn.model")


class LocalServer(Protocol):
    async def is_loaded(self, model: str) -> bool | None: ...
    async def unload(self, model: str) -> bool: ...


Event = Callable[[str, str], None]  # (action, model) for the audit log


class ModelLifecycle:
    def __init__(self, server: LocalServer, *, idle_unload_s: Callable[[], float] | float, on_event: Event | None = None) -> None:
        self._server = server
        self._idle_source = idle_unload_s if callable(idle_unload_s) else (lambda: float(idle_unload_s))
        self._on_event = on_event or (lambda action, model: None)
        self._ours: set[str] = set()
        self._active: dict[str, int] = {}
        self._timers: dict[str, asyncio.TimerHandle] = {}

    @property
    def _idle(self) -> float:
        return float(self._idle_source())

    @property
    def enabled(self) -> bool:
        return self._idle > 0

    async def before_call(self, model: str) -> None:
        if not self.enabled:
            return
        timer = self._timers.pop(model, None)
        if timer is not None:
            timer.cancel()
        if model not in self._ours and self._active.get(model, 0) == 0 and await self._server.is_loaded(model) is False:
            self._ours.add(model)  # this call is what loads it
            self._on_event("loaded", model)
        self._active[model] = self._active.get(model, 0) + 1

    def after_call(self, model: str) -> None:
        if not self.enabled:
            return
        self._active[model] = max(0, self._active.get(model, 0) - 1)
        if model in self._ours and self._active[model] == 0:
            loop = asyncio.get_running_loop()
            self._timers[model] = loop.call_later(self._idle, lambda: loop.create_task(self._unload_if_idle(model)))

    async def _unload_if_idle(self, model: str) -> None:
        self._timers.pop(model, None)
        if self._active.get(model, 0) > 0 or model not in self._ours:
            return
        if await self._server.unload(model):
            self._ours.discard(model)
            log.info("unloaded idle model %s", model)
            self._on_event("unloaded after idle time", model)
        else:
            loop = asyncio.get_running_loop()
            self._timers[model] = loop.call_later(self._idle, lambda: loop.create_task(self._unload_if_idle(model)))

    async def shutdown(self) -> None:
        for timer in self._timers.values():
            timer.cancel()
        self._timers.clear()
        for model in list(self._ours):
            if await self._server.unload(model):
                self._ours.discard(model)
                self._on_event("unloaded at shutdown", model)
