"""Model server adapters: status for the dashboard and setup, plus unloading an idle model.

Provider and address come from the live settings on every call, so a change in Settings or settings.toml
applies at once.

| Provider | Model list and loaded state | Unload |
|---|---|---|
| lmstudio | `/api/v0/models` (state per model) | `POST /api/v1/models/unload` |
| ollama | `/api/tags` (available) and `/api/ps` (loaded) | `POST /api/generate` with `keep_alive: 0` |
| openai | `/v1/models`; loaded state unknown | not supported; nothing is unloaded |
"""

from __future__ import annotations

import time
from typing import Any

import httpx

from saturn.application.tunables import Tunables
from saturn.domain.internal_timing import timed


class LocalServerStatus:
    def __init__(self, tunables: Tunables, api_key: str = "") -> None:
        self._tunables = tunables
        self._api_key = api_key
        self._cache: tuple[float, str, dict[str, Any]] | None = None

    @property
    def _base(self) -> str:
        return self._tunables.base_url.rstrip("/")

    @property
    def _root(self) -> str:
        return self._base[:-3] if self._base.endswith("/v1") else self._base

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}

    async def snapshot(self, *, max_age_s: float = 5.0) -> dict[str, Any]:
        now = time.monotonic()
        key = f"{self._tunables.provider} {self._base}"
        if self._cache and self._cache[1] == key and now - self._cache[0] < max_age_s:
            return self._cache[2]
        result = await self._fetch()
        result["provider"] = self._tunables.provider
        result["base_url"] = self._base
        self._cache = (now, key, result)
        return result

    async def is_loaded(self, model: str) -> bool | None:
        """Whether `model` is in memory; None when the server cannot say."""
        snapshot = await self.snapshot(max_age_s=2.0)
        if not snapshot["reachable"] or not snapshot["authorized"]:
            return None
        state = next((m["state"] for m in snapshot["models"] if m["id"] == model), None)
        return None if state in (None, "unknown") else state == "loaded"

    async def unload(self, model: str) -> bool:
        """Ask the server to free `model`. Failure is reported, never raised: it is housekeeping."""
        provider = self._tunables.provider
        try:
            async with httpx.AsyncClient(timeout=20.0, headers=self._headers) as client:
                if provider == "lmstudio":
                    response = await client.post(f"{self._root}/api/v1/models/unload", json={"instance_id": model})
                elif provider == "ollama":
                    response = await client.post(f"{self._root}/api/generate", json={"model": model, "keep_alive": 0})
                else:
                    return False
            self._cache = None
            return response.status_code < 300
        except httpx.HTTPError:
            return False

    @timed('model_prepare', 'backend')
    async def _fetch(self) -> dict[str, Any]:
        started = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self._headers) as client:
                provider = self._tunables.provider
                if provider == "ollama":
                    models, response = await self._ollama(client)
                elif provider == "lmstudio":
                    response = await client.get(f"{self._root}/api/v0/models")
                    if response.status_code == 404:  # an older server: fall back to the OpenAI list
                        response = await client.get(f"{self._base}/models")
                    models = self._listed(response)
                else:
                    response = await client.get(f"{self._base}/models")
                    models = self._listed(response)
            latency = round((time.monotonic() - started) * 1000)
            if response.status_code in (401, 403):
                return {"reachable": True, "authorized": False, "latency_ms": latency, "models": [],
                        "error": "The server rejected the API key (LOCAL_SERVER_API_KEY in the Saturn home .env)."}
            response.raise_for_status()
            return {"reachable": True, "authorized": True, "latency_ms": latency, "models": models, "error": None}
        except (httpx.HTTPError, ValueError) as exc:
            return {"reachable": False, "authorized": False, "latency_ms": None, "models": [],
                    "error": f"{type(exc).__name__}: could not reach {self._base}"}

    @staticmethod
    def _listed(response: httpx.Response) -> list[dict[str, Any]]:
        if response.status_code >= 400:
            return []
        return [
            {
                "id": m.get("id"),
                "type": m.get("type", "llm"),
                "state": m.get("state", "unknown"),
                "context": m.get("loaded_context_length") or m.get("max_context_length"),
                "quantization": m.get("quantization"),
            }
            for m in response.json().get("data", [])
        ]

    async def _ollama(self, client: httpx.AsyncClient) -> tuple[list[dict[str, Any]], httpx.Response]:
        tags = await client.get(f"{self._root}/api/tags")
        if tags.status_code >= 400:
            return [], tags
        running = await client.get(f"{self._root}/api/ps")
        loaded = {m.get("name") for m in running.json().get("models", [])} if running.status_code < 400 else set()
        models = [
            {
                "id": m.get("name"),
                "type": "embeddings" if "embed" in str(m.get("name", "")).lower() else "llm",
                "state": "loaded" if m.get("name") in loaded else "not-loaded",
                "context": None,
                "quantization": (m.get("details") or {}).get("quantization_level"),
            }
            for m in tags.json().get("models", [])
        ]
        return models, tags
