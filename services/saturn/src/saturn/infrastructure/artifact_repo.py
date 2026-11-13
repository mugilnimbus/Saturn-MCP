"""Artifact store: full command output kept out of the agent's context, queryable on demand."""

from __future__ import annotations

import time
import uuid
import zlib
from collections import OrderedDict
from typing import Any

from saturn.domain.errors import NotFound
from saturn.domain.internal_timing import timed
from saturn.domain.models import ArtifactMeta
from saturn.domain.redaction import redact
from saturn.domain.tokens import estimate_tokens
from saturn.infrastructure.db import Database

_META = "id, run_id, kind, title, created_at, expires_at, bytes, lines, tokens_est"


def _meta(row: Any, secrets: tuple[str, ...] = ()) -> ArtifactMeta:
    values = dict(row)
    values['title'] = redact(values['title'], secrets)[0]
    return ArtifactMeta(**values)


class ArtifactRepository:
    def __init__(self, db: Database, *, ttl_hours: float, max_bytes: int, max_total_bytes: int,
                 secrets: tuple[str, ...] = ()) -> None:
        self._db = db
        self._ttl = ttl_hours * 3600
        self._max_bytes = max_bytes
        self._max_total = max_total_bytes
        self._cache: OrderedDict[str, list[str]] = OrderedDict()
        self._secrets = secrets

    @timed('artifact', 'storage')
    def put(self, run_id: str, kind: str, title: str, text: str) -> ArtifactMeta:
        title = redact(title, self._secrets)[0]
        text = redact(text, self._secrets)[0]
        encoded = text.encode("utf-8", errors="replace")
        if len(encoded) > self._max_bytes:
            marker = "\n… [artifact cut at the size limit]".encode()[:self._max_bytes]
            encoded = encoded[:max(0, self._max_bytes - len(marker))]
            text = encoded.decode("utf-8", errors="ignore") + marker.decode('utf-8', errors='ignore')
            encoded = text.encode("utf-8", errors="replace")
        now = time.time()
        meta = ArtifactMeta(
            id="art_" + uuid.uuid4().hex[:10],
            run_id=run_id,
            kind=kind,
            title=title[:200],
            created_at=now,
            expires_at=now + self._ttl,
            bytes=len(encoded),
            lines=text.count("\n") + 1,
            tokens_est=estimate_tokens(text),
        )
        self._db.execute(
            "INSERT INTO artifacts(id, run_id, kind, title, created_at, expires_at, bytes, lines, tokens_est, content) "
            "VALUES (?,?,?,?,?,?,?,?,?,?)",
            (meta.id, meta.run_id, meta.kind, meta.title, meta.created_at, meta.expires_at, meta.bytes, meta.lines,
             meta.tokens_est, zlib.compress(encoded, 3)),
        )
        self.evict()
        return meta

    def get_meta(self, artifact_id: str) -> ArtifactMeta:
        row = self._db.query_one(f"SELECT {_META} FROM artifacts WHERE id=? AND expires_at > ?", (artifact_id, time.time()))
        if row is None:
            raise NotFound(f"Artifact '{artifact_id}' does not exist or has expired.")
        return _meta(row, self._secrets)

    def get_text(self, artifact_id: str) -> str:
        return "\n".join(self.get_lines(artifact_id))

    @timed('artifact', 'storage')
    def get_lines(self, artifact_id: str) -> list[str]:
        try:
            self.get_meta(artifact_id)
        except NotFound:
            self._cache.pop(artifact_id, None)
            raise
        cached = self._cache.get(artifact_id)
        if cached is not None:
            self._cache.move_to_end(artifact_id)
            return cached
        row = self._db.query_one("SELECT content FROM artifacts WHERE id=? AND expires_at > ?", (artifact_id, time.time()))
        if row is None:
            raise NotFound(f"Artifact '{artifact_id}' does not exist or has expired.")
        text = zlib.decompress(row["content"]).decode("utf-8", errors="replace")
        lines = redact(text, self._secrets)[0].split("\n")
        self._cache[artifact_id] = lines
        while len(self._cache) > 4:
            self._cache.popitem(last=False)
        return lines

    def list(self, *, limit: int = 100) -> list[ArtifactMeta]:
        rows = self._db.query(
            f"SELECT {_META} FROM artifacts WHERE expires_at > ? ORDER BY created_at DESC LIMIT ?", (time.time(), min(limit, 500))
        )
        return [_meta(r, self._secrets) for r in rows]

    def totals(self) -> dict[str, int]:
        row = self._db.query_one("SELECT COUNT(*) AS n, COALESCE(SUM(bytes),0) AS b FROM artifacts WHERE expires_at > ?", (time.time(),))
        return {"count": int(row["n"]), "bytes": int(row["b"])} if row else {"count": 0, "bytes": 0}

    def evict(self) -> int:
        """Delete expired artifacts, then the oldest ones until the store fits its size budget."""
        removed = self._db.execute("DELETE FROM artifacts WHERE expires_at <= ?", (time.time(),))
        while True:
            row = self._db.query_one("SELECT COALESCE(SUM(bytes),0) AS b FROM artifacts")
            if row is None or int(row["b"]) <= self._max_total:
                break
            removed += self._db.execute(
                "DELETE FROM artifacts WHERE id = (SELECT id FROM artifacts ORDER BY created_at ASC LIMIT 1)"
            )
        self._cache.clear()
        return removed
