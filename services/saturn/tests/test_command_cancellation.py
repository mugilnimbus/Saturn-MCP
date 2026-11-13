"""Shutdown cancellation must terminate owned command subprocesses, including descendants."""

import asyncio
import csv
import io
import json
import os
import subprocess
import sys

import pytest

from saturn.infrastructure.command_runner import SubprocessRunner


async def test_bare_python_uses_service_interpreter_when_project_has_no_venv(tmp_path, monkeypatch):
    import sys
    monkeypatch.setenv('PATH', '')
    result = await SubprocessRunner(max_bytes=1000).run(['python', '-c', 'import sys; print(sys.executable)'], tmp_path, 10)
    assert result.exit_code == 0 and sys.executable.lower() in result.output.lower()


@pytest.mark.skipif(os.name != "nt", reason="Windows command-tree cleanup")
async def test_cancelled_command_does_not_leave_child_processes(tmp_path):
    marker = tmp_path / "pids.json"
    script = (
        "import json,os,subprocess,sys,time; from pathlib import Path; "
        "child=subprocess.Popen([sys.executable,'-c','import time; time.sleep(60)']); "
        "Path(sys.argv[1]).write_text(json.dumps([os.getpid(),child.pid])); time.sleep(60)"
    )
    task = asyncio.create_task(SubprocessRunner(max_bytes=1000).run(
        [sys.executable, "-c", script, str(marker)], tmp_path, timeout_s=60,
    ))
    try:
        async with asyncio.timeout(5):
            while not marker.exists():
                await asyncio.sleep(0.05)
        pids = json.loads(marker.read_text())
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        for pid in pids:
            listing = await asyncio.to_thread(subprocess.run,
                ["tasklist.exe", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
                capture_output=True, text=True, check=True,
            )
            rows = csv.reader(io.StringIO(listing.stdout))
            assert not any(len(row) > 1 and row[1] == str(pid) for row in rows)
    finally:
        if not task.done():
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
