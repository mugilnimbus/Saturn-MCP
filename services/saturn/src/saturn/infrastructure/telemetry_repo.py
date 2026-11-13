"""Telemetry store: runs, spans, model calls, and full request, response, and model bodies. Owns writes and trace reads.

Run rows, spans, and model-call previews are kept. Full bodies (payloads) are compressed, capped at 2 MB each, and
expire after 48 hours by default; expired ones are deleted at start and whenever a new one is stored.
"""

from __future__ import annotations

import json
import time
import uuid
import zlib
from typing import Any

from saturn.domain.errors import NotFound
from saturn.domain.internal_timing import timed
from saturn.domain.models import PAYLOAD_KINDS, LlmCallRecord, RequestMeta, RunOutcome, SpanRecord
from saturn.infrastructure.db import Database

RUN_COLUMNS = (
    "seq, id, tool, client, harness_id, workspace, transport, client_info, session_id, request_id, summary, started_at, "
    "ended_at, status, route, decision, raw_tokens, returned_tokens, artifact_id, error, exit_code, redactions, llm_calls, "
    "llm_in, llm_out, llm_reasoning, llm_cached"
)
PAYLOAD_MAX_BYTES = 2_000_000
PREVIEW_CHARS = 300


class TelemetryRepository:
    def __init__(self, db: Database, *, payload_ttl_hours: float = 48.0) -> None:
        self._db = db
        self._payload_ttl = payload_ttl_hours * 3600

    # ---- writes -------------------------------------------------------------------------------

    def start_run(self, tool: str, client: str | None, summary: str, *, harness_id: str | None = None,
                  workspace: str | None = None, request: RequestMeta | None = None) -> str:
        run_id = uuid.uuid4().hex[:12]
        meta = request or RequestMeta()
        self._db.execute(
            "INSERT INTO runs(id, tool, client, harness_id, workspace, transport, client_info, session_id, request_id, summary, "
            "started_at, status) VALUES (?,?,?,?,?,?,?,?,?,?,?, 'running')",
            (run_id, tool, client, harness_id, workspace, meta.transport, meta.client_info, meta.session_id, meta.request_id,
             summary, time.time()),
        )
        return run_id

    def finish_run(self, run_id: str, outcome: RunOutcome) -> None:
        self._db.execute(
            "UPDATE runs SET ended_at=?, status=?, route=?, raw_tokens=?, returned_tokens=?, artifact_id=?, "
            "error=?, exit_code=?, redactions=?, decision=? WHERE id=?",
            (
                time.time(), outcome.status, outcome.route, outcome.raw_tokens, outcome.returned_tokens,
                outcome.artifact_id, outcome.error, outcome.exit_code, outcome.redactions, outcome.decision, run_id,
            ),
        )

    def start_span(self, span: SpanRecord) -> None:
        self._db.execute(
            "INSERT INTO spans(id, run_id, parent_id, name, kind, started_at, ended_at, status, attrs) VALUES (?,?,?,?,?,?,?,?,?)",
            (span.id, span.run_id, span.parent_id, span.name, span.kind, span.started_at, span.ended_at,
             span.status if span.ended_at is not None else "running", json.dumps(span.attrs, default=str)),
        )

    def end_span(self, span_id: str, status: str, attrs: dict[str, Any]) -> None:
        row = self._db.query_one("SELECT attrs FROM spans WHERE id=?", (span_id,))
        merged = {**(json.loads(row["attrs"]) if row else {}), **attrs}
        self._db.execute(
            "UPDATE spans SET ended_at=?, status=?, attrs=? WHERE id=?",
            (time.time(), status, json.dumps(merged, default=str), span_id),
        )

    def record_llm_call(self, call: LlmCallRecord) -> None:
        with self._db.transaction():
            self._db.execute(
                "INSERT OR REPLACE INTO llm_calls(id, run_id, span_id, model, endpoint, started_at, ended_at, input_tokens, "
                "output_tokens, reasoning_tokens, cached_tokens, status, error, prompt_preview, output_preview, purpose) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    call.id, call.run_id, call.span_id, call.model, call.endpoint, call.started_at, call.ended_at,
                    call.input_tokens, call.output_tokens, call.reasoning_tokens, call.cached_tokens, call.status,
                    call.error, call.prompt_preview, call.output_preview, call.purpose,
                ),
            )
            self._db.execute(
                "UPDATE runs SET llm_calls = llm_calls + 1, llm_in = llm_in + ?, llm_out = llm_out + ?, "
                "llm_reasoning = llm_reasoning + ?, llm_cached = llm_cached + ? WHERE id=?",
                (call.input_tokens, call.output_tokens, call.reasoning_tokens, call.cached_tokens, call.run_id),
            )

    @timed('payload', 'storage')
    def put_payload(self, run_id: str, kind: str, text: str, *, owner_id: str | None = None) -> str:
        """Store a full body (already masked by the caller). Returns its id."""
        if kind not in PAYLOAD_KINDS:
            raise ValueError(f"unknown payload kind {kind!r}")
        encoded = text.encode("utf-8", errors="replace")
        truncated = len(encoded) > PAYLOAD_MAX_BYTES
        if truncated:
            encoded = encoded[:PAYLOAD_MAX_BYTES].decode("utf-8", errors="ignore").encode("utf-8")
        payload_id = "pl_" + uuid.uuid4().hex[:12]
        now = time.time()
        with self._db.transaction():
            self._db.execute("DELETE FROM payloads WHERE expires_at < ?", (now,))
            self._db.execute(
                "INSERT INTO payloads(id, run_id, kind, owner_id, created_at, expires_at, bytes, truncated, content) "
                "VALUES (?,?,?,?,?,?,?,?,?)",
                (payload_id, run_id, kind, owner_id, now, now + self._payload_ttl, len(encoded), truncated, zlib.compress(encoded)),
            )
        return payload_id

    def evict_payloads(self) -> int:
        return self._db.execute("DELETE FROM payloads WHERE expires_at < ?", (time.time(),))

    def mark_orphans_failed(self) -> int:
        """Runs still `running` at startup belong to a previous process that died."""
        return self._db.execute(
            "UPDATE runs SET status='error', route='error', error='interrupted: Saturn restarted', ended_at=? WHERE status='running'",
            (time.time(),),
        )

    # ---- reads for the dashboard ----------------------------------------------------------------

    def list_runs(
        self, *, limit: int = 50, before_seq: int | None = None, tool: str | None = None,
        status: str | None = None, query: str | None = None, since: float | None = None, harness: str | None = None,
    ) -> list[dict[str, Any]]:
        where: list[str] = ["1=1"]
        params: list[Any] = []
        filters: list[tuple[bool, str, list[Any]]] = [
            (before_seq is not None, "seq < ?", [before_seq]),
            (bool(tool), "tool = ?", [tool]),
            (bool(status), "status = ?", [status]),
            (since is not None, "started_at >= ?", [since]),
            (bool(harness), "harness_id = ?", [harness]),
            (bool(query), "(summary LIKE ? OR error LIKE ? OR id = ?)", [f"%{query}%", f"%{query}%", query]),
        ]
        for active, clause, values in filters:
            if active:
                where.append(clause)
                params.extend(values)
        rows = self._db.query(
            f"SELECT {RUN_COLUMNS} FROM runs WHERE {' AND '.join(where)} ORDER BY seq DESC LIMIT ?", (*params, min(limit, 200))
        )
        return [dict(r) for r in rows]

    def latest_seq(self) -> int:
        row = self._db.query_one("SELECT COALESCE(MAX(seq), 0) AS s FROM runs")
        return int(row["s"]) if row else 0

    def get_run_trace(self, run_id: str) -> dict[str, Any]:
        run = self._db.query_one(f"SELECT {RUN_COLUMNS} FROM runs WHERE id=?", (run_id,))
        if run is None:
            raise NotFound(f"No run with id '{run_id}'.")
        spans = [
            {**dict(r), "attrs": json.loads(r["attrs"])}
            for r in self._db.query("SELECT * FROM spans WHERE run_id=? ORDER BY started_at", (run_id,))
        ]
        calls = [dict(r) for r in self._db.query("SELECT * FROM llm_calls WHERE run_id=? ORDER BY started_at", (run_id,))]
        payloads = []
        for row in self._db.query("SELECT * FROM payloads WHERE run_id=? AND expires_at >= ? ORDER BY created_at",
                                  (run_id, time.time())):
            text = zlib.decompress(row["content"]).decode("utf-8", errors="replace")
            payloads.append({"id": row["id"], "kind": row["kind"], "owner_id": row["owner_id"], "bytes": row["bytes"],
                             "truncated": bool(row["truncated"]), "expires_at": row["expires_at"],
                             "preview": text[:PREVIEW_CHARS], "complete": len(text) <= PREVIEW_CHARS})
        return {"run": dict(run), "spans": spans, "llm_calls": calls, "payloads": payloads}

    def get_payload(self, payload_id: str) -> dict[str, Any]:
        row = self._db.query_one("SELECT * FROM payloads WHERE id=?", (payload_id,))
        if row is None or row["expires_at"] < time.time():
            raise NotFound("That body is no longer kept (bodies are kept for 48 hours).")
        return {"id": row["id"], "run_id": row["run_id"], "kind": row["kind"], "owner_id": row["owner_id"],
                "bytes": row["bytes"], "truncated": bool(row["truncated"]), "expires_at": row["expires_at"],
                "text": zlib.decompress(row["content"]).decode("utf-8", errors="replace")}
