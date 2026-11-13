"""SQLite ownership of hashed credentials, harness metadata, and the audit log."""

from __future__ import annotations

import json
import sqlite3
import time

from saturn.domain.access import AuditEvent, Harness
from saturn.domain.errors import InvalidInput
from saturn.domain.redaction import redact
from saturn.infrastructure.db import Database


def _harness(row: sqlite3.Row) -> Harness:
    return Harness(row["id"], row["name"], row["handle"], tuple(json.loads(row["tools"])), bool(row["enabled"]),
                   row["created_at"], row["expires_at"], row["revoked_at"], row["last_used_at"],
                   tuple(json.loads(row["folders"])), tuple(json.loads(row["deny"])), bool(row["hooks"]))


class SqliteAccessStore:
    def __init__(self, db: Database, secrets: tuple[str, ...] = ()) -> None:
        self.db = db
        self._secrets = secrets

    def configured(self) -> bool:
        return self.db.query_one("SELECT 1 FROM harnesses LIMIT 1") is not None

    def list_harnesses(self) -> list[Harness]:
        return [_harness(r) for r in self.db.query("SELECT * FROM harnesses ORDER BY created_at DESC")]

    def get(self, harness_id: str) -> Harness | None:
        row = self.db.query_one("SELECT * FROM harnesses WHERE id=? OR (handle=? AND revoked_at IS NULL)", (harness_id, harness_id))
        return _harness(row) if row else None

    def find(self, digest: str, *, touch: bool) -> Harness | None:
        with self.db.transaction():
            row = self.db.query_one("SELECT * FROM harnesses WHERE digest=?", (digest,))
            if not row:
                return None
            harness = _harness(row)
            now = time.time()
            if not harness.enabled or harness.revoked_at is not None or (
                harness.expires_at is not None and harness.expires_at <= now
            ):
                return None
            if touch:
                self.db.execute("UPDATE harnesses SET last_used_at=? WHERE id=?", (now, harness.id))
            return harness

    def handle_taken(self, handle: str) -> bool:
        return self.db.query_one("SELECT 1 FROM harnesses WHERE handle=? AND revoked_at IS NULL", (handle,)) is not None

    def save(self, harness: Harness, *, digest: str | None, action: str, actor: str, detail: str = "",
             create: bool = False) -> None:
        values = (harness.name, json.dumps(harness.tools), harness.enabled, harness.expires_at, harness.revoked_at,
                  json.dumps(harness.folders), json.dumps(harness.deny), harness.hooks)
        with self.db.transaction():
            try:
                if create:
                    self.db.execute(
                        "INSERT INTO harnesses (name,tools,enabled,expires_at,revoked_at,folders,deny,hooks,id,handle,digest,created_at) "
                        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", (*values, harness.id, harness.handle, digest, harness.created_at))
                else:
                    self.db.execute("UPDATE harnesses SET name=?,tools=?,enabled=?,expires_at=?,revoked_at=?,folders=?,deny=?,hooks=? "
                                    "WHERE id=?", (*values, harness.id))
                    if digest is not None:
                        self.db.execute("UPDATE harnesses SET digest=? WHERE id=?", (digest, harness.id))
            except sqlite3.IntegrityError as exc:
                raise InvalidInput(f"The handle '{harness.handle}' is already in use.") from exc
            self._record("access", harness.label, action, actor, detail)

    # ---- audit log ---------------------------------------------------------------------------

    def record(self, kind: str, subject: str, action: str, actor: str, detail: str = "") -> None:
        with self.db.transaction():
            self._record(kind, subject, action, actor, detail)

    def _record(self, kind: str, subject: str, action: str, actor: str, detail: str) -> None:
        self.db.execute("INSERT INTO audit_events (at,kind,subject,action,actor,detail) VALUES (?,?,?,?,?,?)",
                        (time.time(), kind, redact(subject, self._secrets)[0][:200], action, actor,
                         redact(detail, self._secrets)[0][:1000]))

    def events(self, *, limit: int = 50, kind: str | None = None, before: int | None = None) -> list[AuditEvent]:
        where: list[str] = ["1=1"]
        params: list[object] = []
        if kind:
            where.append("kind=?")
            params.append(kind)
        if before is not None:
            where.append("seq<?")
            params.append(before)
        rows = self.db.query(f"SELECT * FROM audit_events WHERE {' AND '.join(where)} ORDER BY seq DESC LIMIT ?",
                             (*params, max(1, min(limit, 200))))
        return [AuditEvent(r["seq"], r["at"], r["kind"], r["subject"], r["action"], r["actor"], r["detail"]) for r in rows]
