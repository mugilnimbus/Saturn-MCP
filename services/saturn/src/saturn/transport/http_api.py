"""Dashboard HTTP API. Read endpoints are bounded and cache-friendly; writes are origin-checked."""

from __future__ import annotations

import hashlib
import time
from dataclasses import asdict
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field

from saturn.application.model_check import check_model
from saturn.application.tunables import PROVIDERS, Tunables
from saturn.bootstrap.container import Container
from saturn.domain.access import AUDIT_KINDS
from saturn.domain.errors import InvalidInput, NotFound, SaturnError
from saturn.domain.policy import PathPolicy, Rule, decide, split_command
from saturn.domain.text_ops import number_lines
from saturn.infrastructure.config import unknown_env_keys

WINDOWS = {"15m": 900, "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800}


class SettingsPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider: str | None = None
    base_url: str | None = Field(None, max_length=300)
    model: str | None = Field(None, max_length=200)
    reasoning_effort: str | None = None
    llm_enabled: bool | None = None
    inline_token_limit: int | None = None
    digest_token_budget: int | None = None
    command_timeout_s: int | None = None
    model_idle_unload_s: int | None = None
    progress_interval_s: int | None = None


class PolicyTest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    command: str = Field(min_length=1, max_length=2000)
    folder: str | None = Field(None, max_length=1000)
    harness: str | None = Field(None, max_length=64)


def _same_origin(origin: str | None, host: str | None) -> None:
    # A browser page on another origin must not be able to change settings.
    if origin is not None and origin.split("://", 1)[-1] != host:
        raise HTTPException(403, "Cross-origin changes are not allowed.")


def _window(raw: str) -> float:
    if raw not in WINDOWS:
        raise HTTPException(400, f"window must be one of {', '.join(WINDOWS)}")
    return float(WINDOWS[raw])


def build_router(container: Container) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.get("/health")
    def health() -> dict[str, str]:
        """Liveness: the process is up."""
        return {"status": "ok"}

    @router.get("/ready")
    async def ready() -> dict[str, Any]:
        """Readiness: the store works; the local server is reported separately and never blocks."""
        container.db.query_one("SELECT 1")
        container.config.refresh()
        model = await container.local_server.snapshot()
        selected = container.tunables.model if container.tunables.llm_enabled else ""
        usable = model["reachable"] and model["authorized"]
        return {
            "status": "ok" if usable or not selected else "degraded",
            "store": "ok",
            "worker_model": selected,
            "local_server": {k: model[k] for k in ("reachable", "authorized", "latency_ms", "error")},
        }

    @router.get("/overview")
    def overview(request: Request, response: Response, window: str = "1h") -> Any:
        seconds = _window(window)
        etag = 'W/"' + hashlib.sha1(f"{container.metrics.fingerprint()}:{window}:{int(time.time() // 30)}".encode()).hexdigest()[:16] + '"'
        if request.headers.get("if-none-match") == etag:
            return Response(status_code=304, headers={"ETag": etag})
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = "no-cache"
        data = container.metrics.overview(seconds)
        data["artifacts"] = container.artifacts.totals()
        return data

    @router.get("/runs")
    def runs(limit: int = Query(50, ge=1, le=200), before: int | None = None, tool: str | None = None,
             status: str | None = Query(None, pattern="^(ok|error|running)$"), q: str | None = Query(None, max_length=200),
             window: str | None = None, harness: str | None = Query(None, max_length=64)) -> dict[str, Any]:
        since = time.time() - _window(window) if window else None
        rows = container.telemetry.list_runs(limit=limit, before_seq=before, tool=tool, status=status, query=q, since=since,
                                             harness=harness)
        return {"runs": rows, "next_before": rows[-1]["seq"] if len(rows) == limit else None,
                "latest_seq": container.telemetry.latest_seq()}

    @router.get("/runs/{run_id}")
    def run_trace(run_id: str) -> dict[str, Any]:
        try:
            return container.telemetry.get_run_trace(run_id)
        except NotFound as exc:
            raise HTTPException(404, exc.message) from exc

    @router.get("/payloads/{payload_id}")
    def payload(payload_id: str) -> dict[str, Any]:
        """One full request, response, or model prompt or reply; kept for 48 hours."""
        try:
            return container.telemetry.get_payload(payload_id)
        except NotFound as exc:
            raise HTTPException(404, exc.message) from exc

    @router.get("/artifacts")
    def artifacts(limit: int = Query(100, ge=1, le=500)) -> dict[str, Any]:
        items = [m.__dict__ for m in container.artifacts.list(limit=limit)]
        return {"artifacts": items, **container.artifacts.totals()}

    @router.get("/artifacts/{artifact_id}")
    def artifact(artifact_id: str, start: int = Query(1, ge=1), count: int = Query(120, ge=1, le=400)) -> dict[str, Any]:
        try:
            meta = container.artifacts.get_meta(artifact_id)
            lines = container.artifacts.get_lines(artifact_id)
        except NotFound as exc:
            raise HTTPException(404, exc.message) from exc
        chunk = lines[start - 1 : start - 1 + count]
        return {"meta": meta.__dict__, "start": start, "text": number_lines(chunk, start), "total_lines": len(lines)}

    @router.get("/local-server")
    async def local_server() -> dict[str, Any]:
        container.config.refresh()
        snapshot = await container.local_server.snapshot()
        return {**snapshot, "configured_model": container.tunables.model}

    def settings_view() -> dict[str, Any]:
        s = container.settings
        container.config.refresh()
        policy = container.config.policy
        return {
            "tunables": container.tunables.values(),
            "limits": {k: list(v) for k, v in Tunables.LIMITS.items()},
            "reasoning_efforts": [e for e in Tunables.EFFORTS if e],
            "providers": PROVIDERS,
            "help": Tunables.HELP,
            "environment": {
                "home": str(s.home),
                "settings_file": str(s.settings_path),
                "policy_file": str(s.policy_path),
                "env_file": str(s.env_path),
                "data_dir": str(s.data_dir),
                "api_key_configured": bool(s.local_server_api_key.get_secret_value()),
                "unknown_env_keys": unknown_env_keys(s.env_path),
                "file_errors": dict(container.config.errors),
                "artifact_ttl_hours": s.artifact_ttl_hours,
                "folders": [str(f) for f in policy.folders],
                "any_folder": not policy.folders,
                "preset": policy.preset,
                "hook_scope": policy.hook_scope,
            },
        }

    @router.get("/settings")
    def get_settings() -> dict[str, Any]:
        return settings_view()

    @router.put("/settings")
    def put_settings(patch: SettingsPatch, host: str | None = Header(None), origin: str | None = Header(None)) -> dict[str, Any]:
        _same_origin(origin, host)
        try:
            container.config.save_settings(patch.model_dump(exclude_none=True), actor="dashboard")
        except InvalidInput as exc:
            raise HTTPException(422, exc.message) from exc
        return settings_view()

    @router.post("/settings/test-model")
    async def test_model(host: str | None = Header(None), origin: str | None = Header(None)) -> dict[str, Any]:
        """One constrained tool call to the configured model: can it be Saturn's worker?"""
        _same_origin(origin, host)
        container.config.refresh()
        reset = getattr(container.gateway, "reset", None)
        if callable(reset):
            reset()
        result = await check_model(container.gateway, container.recorder, client="dashboard")
        container.access.record("model", container.tunables.model or "(none)", "tested", "dashboard",
                                "passed" if result["ok"] else str(result["detail"]))
        return {**result, "model": container.tunables.model}

    @router.get("/policy")
    def policy_view() -> dict[str, Any]:
        container.config.refresh()
        policy = container.config.policy
        harness_deny = [{"pattern": d, "source": f"harness {h.handle}"} for h in container.access.list_harnesses()
                        if h.revoked_at is None for d in h.deny]
        return {
            "file": str(container.settings.policy_path),
            "error": container.config.errors.get("policy.toml"),
            "preset": policy.preset,
            "folders": [str(f) for f in policy.folders],
            "hook_scope": policy.hook_scope,
            "allow": [{"pattern": r.pattern, "source": r.source} for r in policy.allow],
            "deny": [{"pattern": r.pattern, "source": r.source} for r in policy.deny] + harness_deny,
        }

    @router.post("/policy/test")
    def policy_test(body: PolicyTest) -> dict[str, Any]:
        """Would this command run? Nothing is executed."""
        container.config.refresh()
        policy = container.config.policy
        try:
            argv = split_command(body.command)
            harness = container.access.get(body.harness) if body.harness else None
            if body.folder:
                folder = Path(body.folder).expanduser().resolve()
            else:
                folder = policy.folders[0] if policy.folders else Path.home().resolve()
            deny = tuple(Rule.parse(d, f"harness {harness.handle}") for d in harness.deny) if harness else ()
        except SaturnError as exc:
            raise HTTPException(422, exc.message) from exc
        decision = decide(policy, argv, workdir=folder, paths=PathPolicy((folder,)), harness_deny=deny)
        return {**asdict(decision), "folder": str(folder)}

    @router.get("/events")
    def events(limit: int = Query(50, ge=1, le=200), kind: str | None = None, before: int | None = None) -> dict[str, Any]:
        if kind is not None and kind not in AUDIT_KINDS:
            raise HTTPException(400, f"kind must be one of {', '.join(AUDIT_KINDS)}")
        rows = container.access.events(limit=limit, kind=kind, before=before)
        return {"events": [asdict(e) for e in rows], "next_before": rows[-1].seq if len(rows) == limit else None}

    return router
