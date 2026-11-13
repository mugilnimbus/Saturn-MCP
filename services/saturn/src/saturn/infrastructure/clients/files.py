"""Applying planned client configuration changes: back up first, write atomically, keep a record."""

from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any

from saturn.application.ports import FileChange
from saturn.domain.errors import InvalidInput


class FileApplier:
    def __init__(self, backups: Path) -> None:
        self._backups = backups

    @staticmethod
    def _write(path: Path, content: bytes, mode: int | None = None) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix=path.name + ".", suffix=".saturn-tmp", delete=False) as stream:
            temporary = Path(stream.name)
            try:
                stream.write(content)
                stream.flush()
                if mode is not None:
                    temporary.chmod(mode)
            except BaseException:
                stream.close()
                temporary.unlink(missing_ok=True)
                raise
        try:
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)

    def restore(self, written: list[tuple[Path, Path | None]]) -> list[str]:
        """Restore completed writes in reverse order. Return every recovery error and retain backups."""
        failures = []
        for path, backup in reversed(written):
            try:
                if backup is None:
                    path.unlink(missing_ok=True)
                else:
                    self._write(path, backup.read_bytes(), backup.stat().st_mode & 0o777)
            except OSError as exc:
                failures.append(f"{path} (backup: {backup}): {exc}")
        return failures

    def apply(self, changes: list[FileChange]) -> list[tuple[Path, Path | None]]:
        """Validate the preview, retain backups, and restore completed writes after a failure."""
        for change in changes:
            current = change.path.read_text(encoding="utf-8") if change.path.exists() else None
            if current != change.before:
                raise InvalidInput(f"Client file changed after preview: {change.path}. Preview the installation again.")
        done: list[tuple[Path, Path | None]] = []
        if not changes:
            return done
        self._backups.mkdir(parents=True, exist_ok=True)
        folder = Path(tempfile.mkdtemp(prefix=time.strftime("%Y%m%d-%H%M%S-"), dir=self._backups))
        backups: list[tuple[Path, Path | None]] = []
        for index, change in enumerate(changes):
            backup = None
            if change.path.is_file():
                name = re.sub(r"[^A-Za-z0-9._-]+", "_", str(change.path).strip("/\\"))
                backup = folder / f"{index}-{name}"
                shutil.copy2(change.path, backup)
            backups.append((change.path, backup))
        try:
            for change, (path, backup) in zip(changes, backups, strict=True):
                if change.after is None:
                    path.unlink(missing_ok=True)
                else:
                    mode = backup.stat().st_mode & 0o777 if backup else None
                    self._write(path, change.after.encode("utf-8"), mode)
                done.append((path, backup))
        except Exception as exc:
            failures = self.restore(done)
            if failures:
                raise OSError(f"{exc}; file recovery incomplete: {'; '.join(failures)}") from exc
            raise
        return done


class InstallRecords:
    """installs.json: one record per client describing what Saturn wrote there."""

    def __init__(self, path: Path | None) -> None:
        self._path = path
        self._memory: list[dict[str, Any]] = []

    def records(self) -> list[dict[str, Any]]:
        if self._path is None:
            return list(self._memory)
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            return [r for r in data if isinstance(r, dict)] if isinstance(data, list) else []
        except (OSError, ValueError):
            return []

    def _save(self, records: list[dict[str, Any]]) -> None:
        if self._path is None:
            self._memory = records
            return
        self._path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._path.with_name(self._path.name + ".tmp")
        try:
            temporary.write_text(json.dumps(records, indent=2), encoding="utf-8")
            os.replace(temporary, self._path)
        finally:
            temporary.unlink(missing_ok=True)

    def put(self, record: dict[str, Any]) -> None:
        self._save([r for r in self.records() if r.get("client") != record["client"]] + [record])

    def remove(self, client: str) -> dict[str, Any] | None:
        records = self.records()
        found = next((r for r in records if r.get("client") == client), None)
        self._save([r for r in records if r.get("client") != client])
        return found
