"""Bounded request timing. No request data is accepted by the stage interface."""
from __future__ import annotations

import asyncio
import inspect
import json
import threading
import time
import uuid
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from functools import wraps
from typing import Any, Literal, TypeVar, cast

Category = Literal['internal', 'storage', 'wait', 'backend']
STAGES = frozenset({'config', 'authenticate', 'workspace', 'path', 'arguments', 'policy', 'redaction', 'tokens',
                    'deterministic_digest', 'response', 'recording', 'artifact', 'payload', 'sqlite', 'db_lock',
                    'model_slot', 'command', 'file_read', 'file_search', 'client_roots', 'model_prepare', 'provider',
                    'model_parse'})
_current: ContextVar[Profile | None] = ContextVar('saturn_timing', default=None)
_parents: ContextVar[tuple[int, ...]] = ContextVar('saturn_timing_parents', default=())
F = TypeVar('F', bound=Callable[..., Any])


class Profile:
    """One window; immutable task stacks refer to this bounded, synchronized buffer."""

    def __init__(self, instance_id: str, limit: int, *, leased: bool = True) -> None:
        self.instance_id = instance_id
        self.id = uuid.uuid4().hex
        self.start_ns = time.monotonic_ns()
        self.end_ns: int | None = None
        self.status = 'ok'
        self.run_id: str | None = None
        self.request_id: str | None = None
        self.reason: str | None = None if leased else 'collector_capacity'
        self.leased = leased
        self._limit = limit if leased else 0
        self._rows: list[dict[str, Any]] = []
        self._lock = threading.Lock()

    def bind(self, run_id: str, request_id: str | None) -> None:
        with self._lock:
            if self.run_id is not None and (self.run_id != run_id or self.request_id != request_id):
                self.reason = 'correlation'
            else:
                self.run_id, self.request_id = run_id[:128], request_id[:128] if request_id else None

    def begin(self, stage: str, category: Category, parent: int | None) -> dict[str, Any] | None:
        with self._lock:
            if self.end_ns is not None or not self.leased:
                return None
            if len(self._rows) >= self._limit:
                self.reason = 'interval_limit'
                return None
            row = dict(id=len(self._rows), parent_id=parent, stage=stage, category=category,
                       start_ns=time.monotonic_ns(), end_ns=None, status='running')
            self._rows.append(row)
            return row

    def finish(self, row: dict[str, Any], status: str) -> None:
        with self._lock:
            if self.end_ns is None:
                row.update(end_ns=time.monotonic_ns(), status=status)

    def seal(self, status: str, end_ns: int | None = None) -> None:
        with self._lock:
            if self.end_ns is None:
                self.end_ns = end_ns if end_ns is not None else time.monotonic_ns()
                self.status = status
                if any(r['end_ns'] is None or r['end_ns'] > self.end_ns for r in self._rows):
                    self.reason = self.reason or 'unfinished_interval'

    def encode(self, max_bytes: int = 2_000_000) -> str:
        with self._lock:
            body = dict(version=1, instance_id=self.instance_id, profile_id=self.id, run_id=self.run_id,
                        request_id=self.request_id, start_ns=self.start_ns, end_ns=self.end_ns,
                        status=self.status, incomplete=self.reason is not None, reason=self.reason, intervals=list(self._rows))
            text = json.dumps(body, separators=(',', ':'))
            if len(text.encode()) > max_bytes:
                body.update(incomplete=True, reason='encoded_limit', intervals=[])
                text = json.dumps(body, separators=(',', ':'))
            return text


class TimingPool:
    """Capacity applies only to full profiles, never to acceptance of requests."""

    def __init__(self, capacity: int = 64, interval_limit: int = 4096) -> None:
        self.instance_id = uuid.uuid4().hex
        self._capacity, self._limit = capacity, interval_limit
        self._active = 0
        self._lock = threading.Lock()

    @property
    def active(self) -> int:
        with self._lock:
            return self._active

    def begin(self) -> Profile:
        with self._lock:
            leased = self._active < self._capacity
            profile = Profile(self.instance_id, self._limit, leased=leased)
            if leased:
                self._active += 1
            return profile

    def release(self, profile: Profile) -> None:
        with self._lock:
            if profile.leased:
                self._active -= 1
                profile.leased = False


def set_profile(profile: Profile | None) -> None:
    """Bind the public MCP request's HTTP collector in the handler task."""
    _current.set(profile)
    _parents.set(())


@contextmanager
def activate(profile: Profile | None) -> Iterator[None]:
    token, parents = _current.set(profile), _parents.set(())
    try:
        yield
    finally:
        _parents.reset(parents)
        _current.reset(token)


def bind_run(run_id: str, request_id: str | None) -> None:
    profile = _current.get()
    if profile is not None:
        profile.bind(run_id, request_id)


@contextmanager
def interval(stage: str, category: Category = 'internal') -> Iterator[None]:
    profile = _current.get()
    if profile is None:
        yield
        return
    if stage not in STAGES or category not in ('internal', 'storage', 'wait', 'backend'):
        raise ValueError('Unknown internal timing stage or category')
    parents = _parents.get()
    row = profile.begin(stage, category, parents[-1] if parents else None)
    if row is None:
        yield
        return
    token = _parents.set((*parents, row['id']))
    status = 'ok'
    try:
        yield
    except BaseException as exc:
        status = 'cancelled' if isinstance(exc, asyncio.CancelledError) else 'error'
        raise
    finally:
        profile.finish(row, status)
        _parents.reset(token)


def timed(stage: str, category: Category = 'internal') -> Callable[[F], F]:
    """Time a complete owned sync/async function, preserving its signature."""
    def decorate(fn: F) -> F:
        if inspect.isgeneratorfunction(fn):
            @wraps(fn)
            def generator(*args: Any, **kwargs: Any) -> Iterator[Any]:
                source = fn(*args, **kwargs)
                try:
                    while True:
                        with interval(stage, category):
                            try:
                                value = next(source)
                            except StopIteration:
                                return
                        yield value
                finally:
                    source.close()
            return cast(F, generator)
        if inspect.iscoroutinefunction(fn):
            @wraps(fn)
            async def asynchronous(*args: Any, **kwargs: Any) -> Any:
                with interval(stage, category):
                    return await fn(*args, **kwargs)
            return cast(F, asynchronous)
        @wraps(fn)
        def synchronous(*args: Any, **kwargs: Any) -> Any:
            with interval(stage, category):
                return fn(*args, **kwargs)
        return cast(F, synchronous)
    return decorate
