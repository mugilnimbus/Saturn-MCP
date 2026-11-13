"""Runs an already-approved argv without a shell, with a scrubbed environment and hard limits."""

from __future__ import annotations

import asyncio
import contextlib
import os
import re
import shutil
import subprocess
import sys
import time
from collections.abc import Sequence
from pathlib import Path

from saturn.application.ports import CommandResult
from saturn.domain.errors import InvalidInput, PolicyViolation

_SECRET_ENV = re.compile(r"(?i)(key|token|secret|password|passwd|credential|auth)")
_SAFE_CMD_ARG = re.compile(r"^[\w\s\-./\\:=@,+~\[\]{}]*$")
_FORCED_ENV = {
    "CI": "1",
    "NO_COLOR": "1",
    "FORCE_COLOR": "0",
    "TERM": "dumb",
    "PYTHONUTF8": "1",
    "PYTHONIOENCODING": "utf-8",
    "PAGER": "cat",
    "GIT_PAGER": "cat",
    "GIT_TERMINAL_PROMPT": "0",
    # Saturn runs checks, not installs: uv does not sync the environment, and cargo and go use only what is present.
    "UV_NO_SYNC": "1",
    "CARGO_NET_OFFLINE": "true",
    "GOFLAGS": "-mod=readonly",
    "GOPROXY": "off",
}


def scrubbed_env() -> dict[str, str]:
    env = {k: v for k, v in os.environ.items() if not _SECRET_ENV.search(k)}
    env.update(_FORCED_ENV)
    return env


def _kill_tree(pid: int) -> None:
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True, check=False)
    else:
        with contextlib.suppress(OSError):
            os.killpg(pid, 9)


class SubprocessRunner:
    def __init__(self, *, max_bytes: int, workspace_roots: tuple[Path, ...] = ()) -> None:
        self._max_bytes = max_bytes
        self._roots = workspace_roots

    async def run(self, argv: Sequence[str], cwd: Path, timeout_s: float) -> CommandResult:
        env = scrubbed_env()
        # Choose a project venv without changing the user's global PATH.
        folders = [cwd, *(p for p in cwd.parents if any(p == r or p.is_relative_to(r) for r in self._roots))]
        scripts = next((p / '.venv' / ('Scripts' if os.name == 'nt' else 'bin') for p in folders
                        if (p / '.venv' / ('Scripts' if os.name == 'nt' else 'bin')).is_dir()), None)
        path_key = next((key for key in env if key.upper() == 'PATH'), 'PATH')
        if scripts is not None:
            env[path_key] = str(scripts) + os.pathsep + env.get(path_key, '')
        bare_python = argv[0].lower() in {'python', 'python.exe', 'python3', 'python3.exe'}
        local_python = scripts / ('python.exe' if os.name == 'nt' else 'python') if scripts else None
        resolved: str | None
        if bare_python:
            resolved = str(local_python) if local_python and local_python.is_file() else sys.executable
        else:
            resolved = shutil.which(argv[0], path=env.get(path_key))
        if resolved is None:
            raise InvalidInput(f"Command '{argv[0]}' was not found on PATH.")
        if resolved.lower().endswith((".cmd", ".bat")):
            # cmd.exe interprets metacharacters in arguments even without a shell flag.
            for arg in argv[1:]:
                if not _SAFE_CMD_ARG.match(arg):
                    raise PolicyViolation(f"Argument {arg!r} contains characters that are unsafe for a .cmd launcher.")
        command = [resolved, *argv[1:]]
        started = time.monotonic()
        proc = await asyncio.create_subprocess_exec(
            *command,
            cwd=str(cwd),
            env=env,
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            start_new_session=(os.name != "nt"),
        )
        chunks: list[bytes] = []
        size = 0
        truncated = False

        async def drain() -> None:
            nonlocal size, truncated
            assert proc.stdout is not None
            while True:
                chunk = await proc.stdout.read(65536)
                if not chunk:
                    return
                if size < self._max_bytes:
                    keep = chunk[: self._max_bytes - size]
                    chunks.append(keep)
                    size += len(keep)
                    truncated = truncated or len(keep) < len(chunk)
                else:
                    truncated = True

        timed_out = False
        reader = asyncio.create_task(drain())
        try:
            await asyncio.wait_for(proc.wait(), timeout=timeout_s)
            await asyncio.wait_for(reader, timeout=5)
        except TimeoutError:
            timed_out = True
            _kill_tree(proc.pid)
            await proc.wait()
            reader.cancel()
        except asyncio.CancelledError:
            _kill_tree(proc.pid)
            reader.cancel()
            raise
        output = b"".join(chunks).decode("utf-8", errors="replace")
        return CommandResult(
            exit_code=None if timed_out else proc.returncode,
            output=output,
            duration_s=time.monotonic() - started,
            timed_out=timed_out,
            output_truncated=truncated,
        )
