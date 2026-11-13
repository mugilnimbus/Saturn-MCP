"""Read model for the dashboard: aggregates over runs and model calls."""

from __future__ import annotations

import json
import math
import time
from typing import Any

from saturn.infrastructure.db import Database

_BUCKETS = (60, 300, 900, 1800, 3600, 7200, 21600, 86400)


def bucket_size(window_s: float) -> int:
    for size in _BUCKETS:
        if window_s / size <= 96:
            return size
    return _BUCKETS[-1]


def percentile(values: list[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, max(0, math.ceil(q * len(ordered)) - 1))]


class MetricsQueries:
    def __init__(self, db: Database) -> None:
        self._db = db

    def overview(self, window_s: float, now: float | None = None) -> dict[str, Any]:
        now = now or time.time()
        size = bucket_size(window_s)
        since = math.floor((now - window_s) / size) * size
        params = {"since": since, "size": size}

        totals = self._db.query_row(
            "SELECT COUNT(*) runs, COALESCE(SUM(status='error'),0) errors, COALESCE(SUM(status='running'),0) running, "
            "COALESCE(SUM(CASE WHEN tool='saturn_query' THEN 0 ELSE raw_tokens END),0) raw, "
            "COALESCE(SUM(returned_tokens),0) ret, COALESCE(SUM(redactions),0) redactions, "
            "COALESCE(SUM(CASE WHEN tool='saturn_query' THEN returned_tokens ELSE 0 END),0) followup "
            "FROM runs WHERE started_at >= :since", params,
        )
        llm = self._db.query_row(
            "SELECT COUNT(*) calls, COALESCE(SUM(status='error'),0) errors, COALESCE(SUM(input_tokens),0) tin, "
            "COALESCE(SUM(output_tokens),0) tout, COALESCE(SUM(reasoning_tokens),0) treason, COALESCE(SUM(cached_tokens),0) tcached "
            "FROM llm_calls WHERE started_at >= :since", params,
        )
        durations = [r["d"] for r in self._db.query(
            "SELECT ended_at - started_at AS d FROM runs WHERE started_at >= :since AND ended_at IS NOT NULL LIMIT 50000", params)]
        llm_durations = [r["d"] for r in self._db.query(
            "SELECT ended_at - started_at AS d FROM llm_calls WHERE started_at >= :since AND ended_at IS NOT NULL LIMIT 50000", params)]

        run_buckets = {
            r["k"]: r for r in self._db.query(
                "SELECT CAST((started_at - :since) / :size AS INTEGER) k, COUNT(*) runs, SUM(status='error') errors, "
                "SUM(CASE WHEN tool='saturn_query' THEN 0 ELSE raw_tokens END) raw, SUM(returned_tokens) ret "
                "FROM runs WHERE started_at >= :since GROUP BY k", params)
        }
        llm_buckets = {
            r["k"]: r for r in self._db.query(
                "SELECT CAST((started_at - :since) / :size AS INTEGER) k, COUNT(*) calls, SUM(input_tokens) tin, "
                "SUM(output_tokens) tout, SUM(reasoning_tokens) treason FROM llm_calls WHERE started_at >= :since GROUP BY k", params)
        }
        count = int((now - since) // size) + 1
        series = []
        for k in range(count):
            r, m = run_buckets.get(k), llm_buckets.get(k)
            series.append({
                "t": since + k * size,
                "runs": int(r["runs"]) if r else 0,
                "errors": int(r["errors"] or 0) if r else 0,
                "raw_tokens": int(r["raw"] or 0) if r else 0,
                "returned_tokens": int(r["ret"] or 0) if r else 0,
                "llm_calls": int(m["calls"]) if m else 0,
                "llm_in": int(m["tin"] or 0) if m else 0,
                "llm_out": int(m["tout"] or 0) if m else 0,
                "llm_reasoning": int(m["treason"] or 0) if m else 0,
            })

        by_tool = [dict(r) for r in self._db.query(
            "SELECT tool, COUNT(*) runs, SUM(status='error') errors, "
            "SUM(CASE WHEN tool='saturn_query' THEN 0 ELSE raw_tokens END) raw, SUM(returned_tokens) ret, "
            "SUM(llm_calls) llm_calls FROM runs WHERE started_at >= :since GROUP BY tool ORDER BY runs DESC", params)]
        by_route = [dict(r) for r in self._db.query(
            "SELECT route, COUNT(*) runs, SUM(CASE WHEN tool='saturn_query' THEN 0 ELSE raw_tokens END) raw, "
            "SUM(returned_tokens) ret FROM runs "
            "WHERE started_at >= :since AND route != '' GROUP BY route ORDER BY runs DESC", params)]
        by_model = [dict(r) for r in self._db.query(
            "SELECT model, COUNT(*) calls, SUM(status='error') errors, SUM(input_tokens) tin, SUM(output_tokens) tout, "
            "SUM(reasoning_tokens) treason, SUM(cached_tokens) tcached, AVG(ended_at - started_at) avg_s "
            "FROM llm_calls WHERE started_at >= :since GROUP BY model ORDER BY calls DESC", params)]
        by_purpose = [dict(r) for r in self._db.query(
            "SELECT purpose, COUNT(*) calls, SUM(input_tokens) tin, SUM(output_tokens) tout, SUM(reasoning_tokens) treason "
            "FROM llm_calls WHERE started_at >= :since AND purpose != '' GROUP BY purpose ORDER BY calls DESC LIMIT 12", params)]

        raw, ret = int(totals["raw"]), int(totals["ret"])
        return {
            "window_s": window_s,
            "bucket_s": size,
            "generated_at": now,
            "totals": {
                "runs": int(totals["runs"]), "errors": int(totals["errors"]), "running": int(totals["running"]),
                "raw_tokens": raw, "returned_tokens": ret, "saved_tokens": raw - ret,
                "followup_tokens": int(totals['followup']),
                "reduction": (1 - ret / raw) if raw > 0 else None,
                "redactions": int(totals["redactions"]),
                "p50_s": percentile(durations, 0.5), "p95_s": percentile(durations, 0.95),
                "llm_calls": int(llm["calls"]), "llm_errors": int(llm["errors"]),
                "llm_in": int(llm["tin"]), "llm_out": int(llm["tout"]), "llm_reasoning": int(llm["treason"]),
                "llm_cached": int(llm["tcached"]),
                "llm_p50_s": percentile(llm_durations, 0.5), "llm_p95_s": percentile(llm_durations, 0.95),
            },
            "series": series,
            "by_tool": by_tool,
            "by_route": by_route,
            "by_model": by_model,
            "by_purpose": by_purpose,
        }

    def fingerprint(self) -> str:
        row = self._db.query_row(
            "SELECT (SELECT COALESCE(MAX(seq),0) FROM runs) a, (SELECT COUNT(*) FROM runs WHERE status != 'running') b, "
            "(SELECT COUNT(*) FROM llm_calls) c, (SELECT COUNT(*) FROM artifacts) d"
        )
        return ".".join(str(row[k]) for k in ("a", "b", "c", "d"))


class SqliteTunableStore:
    def __init__(self, db: Database) -> None:
        self._db = db

    def load(self) -> dict[str, Any]:
        row = self._db.query_one("SELECT value FROM kv WHERE key='tunables'")
        try:
            return json.loads(row["value"]) if row else {}
        except ValueError:
            return {}

    def save(self, values: dict[str, Any]) -> None:
        self._db.execute("INSERT OR REPLACE INTO kv(key, value) VALUES ('tunables', ?)", (json.dumps(values),))
