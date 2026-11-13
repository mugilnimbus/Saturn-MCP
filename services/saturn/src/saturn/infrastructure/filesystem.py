"""Bounded, read-only file access inside the allowed roots."""

from __future__ import annotations

import fnmatch
import os
from collections.abc import Iterator
from pathlib import Path

from saturn.domain.errors import InvalidInput
from saturn.domain.internal_timing import timed
from saturn.domain.policy import SKIP_DIRS, PathPolicy
from saturn.domain.redaction import redact_lines

MAX_FILE_BYTES = 5_000_000


class LocalFiles:
    def __init__(self, policy: PathPolicy, *, secrets: tuple[str, ...] = ()) -> None:
        self._policy = policy
        self._secrets = secrets

    @timed('file_read', 'backend')
    def read_lines(self, raw_path: str) -> tuple[Path, list[str]]:
        path = self._policy.readable(raw_path)
        if not path.is_file():
            raise InvalidInput(f"'{raw_path}' is not a file.")
        if path.stat().st_size > MAX_FILE_BYTES:
            raise InvalidInput(f"'{raw_path}' is larger than {MAX_FILE_BYTES // 1_000_000} MB; use saturn_search or a line range.")
        data = path.read_bytes()
        if b"\x00" in data[:4096]:
            raise InvalidInput(f"'{raw_path}' looks like a binary file.")
        lines = data.decode("utf-8", errors="replace").replace("\r\n", "\n").split("\n")
        return path, redact_lines(lines, self._secrets)

    @timed('file_search', 'backend')
    def list_dir(self, raw_path: str | None) -> list[str]:
        path = self._policy.resolve(raw_path)
        if not path.is_dir():
            raise InvalidInput(f"'{raw_path}' is not a directory.")
        entries = []
        for child in sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
            if child.name in SKIP_DIRS or self._policy.is_sensitive(child):
                continue
            entries.append(child.name + ("/" if child.is_dir() else ""))
        return entries

    @timed("file_search", "backend")
    def walk(self, raw_path: str | None, glob: str | None = None) -> Iterator[Path]:
        root = self._policy.resolve(raw_path)
        if root.is_file():
            yield root
            return
        for folder, dirs, files in os.walk(root):
            dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
            for name in sorted(files):
                full = Path(folder) / name
                if self._policy.is_sensitive(full):
                    continue
                if glob and not (fnmatch.fnmatch(name, glob) or fnmatch.fnmatch(str(full.relative_to(root)), glob)):
                    continue
                yield full

    def display(self, path: Path) -> str:
        for root in self._policy.roots:
            if path == root or path.is_relative_to(root):
                return path.relative_to(root).as_posix() or "."
        return path.as_posix()
