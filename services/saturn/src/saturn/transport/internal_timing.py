"""Optional HTTP window capture; export follows final application send."""
from __future__ import annotations

import asyncio
import logging
import time

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from saturn.application.ports import TelemetryWriter
from saturn.domain.internal_timing import TimingPool, activate

log = logging.getLogger('saturn')
STATE_KEY = 'saturn_internal_timing'


class InternalTimingMiddleware:
    def __init__(self, app: ASGIApp, telemetry: TelemetryWriter, pool: TimingPool | None = None) -> None:
        self.app, self.telemetry, self.pool = app, telemetry, pool or TimingPool()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope['type'] != 'http' or scope.get('path') != '/mcp' or scope.get('method') != 'POST':
            await self.app(scope, receive, send)
            return
        entered = time.monotonic_ns()
        profile = self.pool.begin()
        profile.start_ns = entered
        scope.setdefault('state', {})[STATE_KEY] = profile
        status = 'ok'
        async def capture(message: Message) -> None:
            await send(message)
            if message['type'] == 'http.response.body' and not message.get('more_body', False):
                profile.seal(status)
        try:
            with activate(profile):
                await self.app(scope, receive, capture)
        except BaseException as exc:
            status = 'cancelled' if isinstance(exc, asyncio.CancelledError) else 'error'
            raise
        finally:
            profile.seal(status)
            try:
                # SDK handler tasks can retain their own context; sealing also disables late writes.
                with activate(None):
                    if profile.run_id is not None:
                        self.telemetry.put_payload(profile.run_id, 'timing', profile.encode())
            except Exception as exc:  # noqa: BLE001 - diagnostics must preserve the original response
                log.warning('Internal timing export failed: %s', type(exc).__name__)
            finally:
                self.pool.release(profile)
