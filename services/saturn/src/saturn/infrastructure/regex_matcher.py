"""Reusable process isolation for caller-selected regex matching; no pattern can hold the service indefinitely."""

from __future__ import annotations

import multiprocessing
import re
import threading
from typing import Any, Protocol

from saturn.domain.errors import InvalidInput
from saturn.domain.text_ops import Match, grep_lines


class _Channel(Protocol):
    def send(self, obj: Any) -> None: ...
    def recv(self) -> Any: ...
    def poll(self, timeout: float = 0.0) -> bool: ...
    def close(self) -> None: ...


def _worker(channel: _Channel) -> None:
    try:
        channel.send(None)  # startup is separate from the matching deadline
        while True:
            lines, pattern, flags, context, maximum = channel.recv()
            channel.send(grep_lines(lines, re.compile(pattern, flags), context=context, max_matches=maximum))
    except (EOFError, BrokenPipeError):
        pass
    finally:
        channel.close()


class ProcessLineMatcher:
    def __init__(self, *, timeout_s: float = 1.0) -> None:
        self._timeout = timeout_s
        self._lock = threading.RLock()
        self._process: Any = None
        self._channel: _Channel | None = None

    def _start(self) -> _Channel:
        if self._channel is not None and self._process.is_alive():
            return self._channel
        self.close()
        context = multiprocessing.get_context("spawn")
        parent, child = context.Pipe()
        process = context.Process(target=_worker, args=(child,), daemon=True)
        try:
            process.start()
        except OSError as exc:
            parent.close()
            child.close()
            raise InvalidInput("The isolated regex worker could not start.") from exc
        child.close()
        self._process, self._channel = process, parent
        if not parent.poll(10):
            self.close()
            raise InvalidInput("The isolated regex worker did not become ready.")
        parent.recv()
        return parent

    def match(self, lines: list[str], pattern: re.Pattern[str], *, context: int = 0,
              max_matches: int = 50) -> tuple[list[Match], int]:
        # A literal contains no regex operators and has no backtracking risk.
        if not any(c in pattern.pattern for c in r"\.^$*+?{}[]|()"):
            return grep_lines(lines, pattern, context=context, max_matches=max_matches)
        with self._lock:
            try:
                channel = self._start()
                channel.send((lines, pattern.pattern, pattern.flags, context, max_matches))
                if not channel.poll(self._timeout):
                    self.close()
                    raise InvalidInput("Regex matching exceeded its one-second deadline; simplify the pattern.")
                result: tuple[list[Match], int] = channel.recv()
                return result
            except (EOFError, BrokenPipeError, OSError) as exc:
                self.close()
                raise InvalidInput("The isolated regex worker stopped; retry with a simpler pattern.") from exc

    def close(self) -> None:
        with self._lock:
            if self._channel is not None:
                self._channel.close()
                self._channel = None
            if self._process is not None:
                if self._process.is_alive():
                    self._process.terminate()
                    self._process.join(timeout=1)
                    if self._process.is_alive():
                        self._process.kill()
                        self._process.join(timeout=1)
                self._process.close()
                self._process = None
