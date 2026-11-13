"""CLI bridge to this checkout's Windows process launcher."""

from __future__ import annotations

import contextlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path


def project_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "scripts" / "saturn.ps1").is_file() and (parent / "services" / "saturn" / "pyproject.toml").is_file():
            return parent
    raise ValueError("The Windows launcher requires the Saturn checkout; its scripts could not be found.")


def _launcher_command(action: str, *, port: int | None, timeout: int, json_output: bool) -> tuple[list[str], Path]:
    if os.name != "nt":
        raise ValueError("Background process control supports Windows; use 'saturn serve' on other platforms.")
    root = project_root()
    shell = shutil.which("pwsh")
    receipt = Path.home() / ".local" / "bin" / "saturn-registration.json"
    if shell is None and receipt.is_file():
        try:
            registration = json.loads(receipt.read_text(encoding="utf-8-sig"))
            candidate = Path(registration.get("shell", ""))
            if Path(registration.get("root", "")).resolve() == root and candidate.name.lower() == "pwsh.exe" and candidate.is_file():
                shell = str(candidate)
        except (OSError, ValueError, TypeError, AttributeError):
            raise ValueError("Invalid command registration; run scripts/register-saturn.ps1 again.") from None
    if shell is None:
        raise ValueError("PowerShell 7 is required; register the command from PowerShell 7 first.")
    command = [shell, "-NoProfile", "-File", str(root / "scripts" / "saturn.ps1"), action, "-TimeoutSeconds", str(timeout)]
    if port is not None:
        command.extend(["-Port", str(port)])
    if json_output:
        command.append("-Json")
    return command, root


def run_launcher(action: str, *, port: int | None, timeout: int, json_output: bool) -> int:
    command, root = _launcher_command(action, port=port, timeout=timeout, json_output=json_output)
    return subprocess.run(command, check=False, cwd=root).returncode


def start_quietly(*, port: int | None = None, timeout: int = 30) -> None:
    """Start this checkout's server on behalf of a caller whose own stdin and stdout must stay untouched.

    The stdio bridge speaks MCP on its standard streams, so the launcher and the server it starts get none
    of them. It runs from the project root, exactly as if `saturn start` had been typed there.
    """
    command, root = _launcher_command("start", port=port, timeout=timeout, json_output=True)
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    # The launcher's output goes to a file, not a pipe: the server it starts inherits the handle and
    # would keep a pipe open for as long as it runs, so waiting for the pipe to close would never end.
    with tempfile.TemporaryFile() as output:
        done = subprocess.run(command, check=False, cwd=root, stdin=subprocess.DEVNULL, stdout=output,
                              stderr=subprocess.DEVNULL, creationflags=flags, timeout=timeout + 30)
        if done.returncode == 0:
            return
        output.seek(0)
        detail = ""
        with contextlib.suppress(ValueError, AttributeError):
            detail = str(json.loads(output.read().decode("utf-8", errors="replace")).get("message", ""))
    raise ValueError(detail or f"the launcher exited with code {done.returncode}")
