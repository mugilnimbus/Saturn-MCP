"""SQLite connection with versioned, repeatable migrations.

One connection guarded by a lock: Saturn is a single local process and its
writes are small. WAL mode lets the dashboard read while a run is writing.
"""

from __future__ import annotations

import sqlite3
import threading
from collections.abc import Iterable, Iterator, Sequence
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from saturn.domain.internal_timing import interval

# Schema versions start at 100 so a store from an earlier, incompatible layout is recognised and refused.
_BASE_VERSION = 100
_MIGRATIONS: tuple[str, ...] = (
    # 100: runs, traces, model calls, artifacts, harnesses, and the audit log
    """
    CREATE TABLE runs (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        tool TEXT NOT NULL,
        client TEXT,
        harness_id TEXT,
        workspace TEXT,
        summary TEXT NOT NULL DEFAULT '',
        started_at REAL NOT NULL,
        ended_at REAL,
        status TEXT NOT NULL DEFAULT 'running',
        route TEXT NOT NULL DEFAULT '',
        decision TEXT,
        raw_tokens INTEGER NOT NULL DEFAULT 0,
        returned_tokens INTEGER NOT NULL DEFAULT 0,
        artifact_id TEXT,
        error TEXT,
        exit_code INTEGER,
        redactions INTEGER NOT NULL DEFAULT 0,
        llm_calls INTEGER NOT NULL DEFAULT 0,
        llm_in INTEGER NOT NULL DEFAULT 0,
        llm_out INTEGER NOT NULL DEFAULT 0,
        llm_reasoning INTEGER NOT NULL DEFAULT 0,
        llm_cached INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX runs_started ON runs(started_at);
    CREATE INDEX runs_tool ON runs(tool, started_at);
    CREATE INDEX runs_harness ON runs(harness_id, started_at);
    CREATE TABLE spans (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        parent_id TEXT,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        started_at REAL NOT NULL,
        ended_at REAL,
        status TEXT NOT NULL DEFAULT 'ok',
        attrs TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX spans_run ON spans(run_id, started_at);
    CREATE TABLE llm_calls (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        span_id TEXT,
        model TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        started_at REAL NOT NULL,
        ended_at REAL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        reasoning_tokens INTEGER NOT NULL DEFAULT 0,
        cached_tokens INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'ok',
        error TEXT,
        prompt_preview TEXT NOT NULL DEFAULT '',
        output_preview TEXT NOT NULL DEFAULT '',
        purpose TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX llm_run ON llm_calls(run_id, started_at);
    CREATE INDEX llm_started ON llm_calls(started_at);
    CREATE TABLE artifacts (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at REAL NOT NULL,
        expires_at REAL NOT NULL,
        bytes INTEGER NOT NULL,
        lines INTEGER NOT NULL,
        tokens_est INTEGER NOT NULL,
        content BLOB NOT NULL
    );
    CREATE INDEX artifacts_created ON artifacts(created_at);
    CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE harnesses (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, handle TEXT NOT NULL, digest TEXT NOT NULL UNIQUE,
        tools TEXT NOT NULL, enabled INTEGER NOT NULL, created_at REAL NOT NULL,
        expires_at REAL, revoked_at REAL, last_used_at REAL,
        folders TEXT NOT NULL DEFAULT '[]', deny TEXT NOT NULL DEFAULT '[]', hooks INTEGER NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX harnesses_active_handle ON harnesses(handle) WHERE revoked_at IS NULL;
    CREATE TABLE audit_events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT, at REAL NOT NULL, kind TEXT NOT NULL, subject TEXT NOT NULL,
        action TEXT NOT NULL, actor TEXT NOT NULL, detail TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX audit_kind ON audit_events(kind, seq)
    """,
    # 101: where each request came from, and full request, response, and model bodies kept for a limited time
    """
    ALTER TABLE runs ADD COLUMN transport TEXT;
    ALTER TABLE runs ADD COLUMN client_info TEXT;
    ALTER TABLE runs ADD COLUMN session_id TEXT;
    ALTER TABLE runs ADD COLUMN request_id TEXT;
    CREATE TABLE payloads (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        owner_id TEXT,
        created_at REAL NOT NULL,
        expires_at REAL NOT NULL,
        bytes INTEGER NOT NULL,
        truncated INTEGER NOT NULL DEFAULT 0,
        content BLOB NOT NULL
    );
    CREATE INDEX payloads_run ON payloads(run_id);
    CREATE INDEX payloads_expiry ON payloads(expires_at)
    """,
)


class StoreVersionError(RuntimeError):
    """The data folder holds a store from an earlier, incompatible Saturn."""


class Database:
    def __init__(self, path: Path | str) -> None:
        self._lock = threading.RLock()
        self.path = str(path)
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(path), check_same_thread=False, isolation_level=None)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA synchronous=NORMAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._conn.execute("PRAGMA busy_timeout=5000")
        self._migrate()

    def _migrate(self) -> None:
        with self._lock:
            version = self._conn.execute("PRAGMA user_version").fetchone()[0]
            if 0 < version < _BASE_VERSION or version > _BASE_VERSION + len(_MIGRATIONS):
                raise StoreVersionError(
                    f"The store at {self.path} was made by an incompatible Saturn version. Move it away (or delete it) "
                    "and start again; a new store is created on start."
                )
            start = max(0, version - _BASE_VERSION) if version else 0
            for index in range(start, len(_MIGRATIONS)):
                self._conn.execute("BEGIN")
                try:
                    for statement in filter(None, (s.strip() for s in _MIGRATIONS[index].split(";"))):
                        self._conn.execute(statement)
                    self._conn.execute(f"PRAGMA user_version={_BASE_VERSION + index + 1}")
                    self._conn.execute("COMMIT")
                except Exception:
                    self._conn.execute("ROLLBACK")
                    raise

    @contextmanager
    def _guard(self) -> Iterator[None]:
        with interval("db_lock", "wait"):
            self._lock.acquire()
        try:
            yield
        finally:
            self._lock.release()

    def execute(self, sql: str, params: Sequence[Any] | dict[str, Any] = ()) -> int:
        with self._guard(), interval("sqlite", "storage"):
            cursor = self._conn.execute(sql, params)
            return cursor.rowcount

    def query(self, sql: str, params: Sequence[Any] | dict[str, Any] = ()) -> list[sqlite3.Row]:
        with self._guard(), interval("sqlite", "storage"):
            return self._conn.execute(sql, params).fetchall()

    def query_one(self, sql: str, params: Sequence[Any] | dict[str, Any] = ()) -> sqlite3.Row | None:
        with self._guard(), interval("sqlite", "storage"):
            row: sqlite3.Row | None = self._conn.execute(sql, params).fetchone()
            return row

    def query_row(self, sql: str, params: Sequence[Any] | dict[str, Any] = ()) -> sqlite3.Row:
        """For aggregate queries that always return exactly one row."""
        row = self.query_one(sql, params)
        if row is None:
            raise RuntimeError("aggregate query returned no row")
        return row

    def executemany(self, sql: str, rows: Iterable[Sequence[Any]]) -> None:
        with self._guard(), interval("sqlite", "storage"):
            self._conn.executemany(sql, rows)

    @contextmanager
    def transaction(self):  # type: ignore[no-untyped-def]
        with self._guard():
            with interval("sqlite", "storage"):
                self._conn.execute("BEGIN")
            try:
                yield
                with interval("sqlite", "storage"):
                    self._conn.execute("COMMIT")
            except Exception:
                with interval("sqlite", "storage"):
                    self._conn.execute("ROLLBACK")
                raise

    def close(self) -> None:
        with self._lock:
            self._conn.close()
