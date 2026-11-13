"""credentials/<handle>.token: the token for each harness, so a local client's configuration never holds one."""

from __future__ import annotations

import contextlib
import os
from pathlib import Path

from saturn.domain.access import HANDLE


class CredentialFiles:
    def __init__(self, folder: Path | None) -> None:
        self._folder = folder  # None keeps tokens only in memory, for tests
        self._memory: dict[str, str] = {}

    def path(self, handle: str) -> Path:
        if not HANDLE.match(handle):
            raise ValueError("invalid handle")
        return (self._folder or Path("credentials")) / f"{handle}.token"

    def write(self, handle: str, token: str) -> Path:
        path = self.path(handle)
        if self._folder is None:
            self._memory[handle] = token
            return path
        self._folder.mkdir(parents=True, exist_ok=True)
        with contextlib.suppress(OSError):
            os.chmod(self._folder, 0o700)
        temporary = path.with_suffix(".tmp")
        # Create with owner-only permissions where the platform honours them, then move into place.
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle_file:
            handle_file.write(token + "\n")
        os.replace(temporary, path)
        return path

    def read(self, handle: str) -> str | None:
        if self._folder is None:
            return self._memory.get(handle)
        try:
            return self.path(handle).read_text(encoding="utf-8").strip() or None
        except (OSError, ValueError):
            return None

    def delete(self, handle: str) -> None:
        if self._folder is None:
            self._memory.pop(handle, None)
            return
        with contextlib.suppress(OSError, ValueError):
            self.path(handle).unlink()
