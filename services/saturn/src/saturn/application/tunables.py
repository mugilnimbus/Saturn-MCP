"""Settings an operator may change while Saturn runs: from the dashboard, `saturn settings set`, or settings.toml."""

from __future__ import annotations

from dataclasses import asdict, dataclass, fields
from typing import Any, ClassVar

from saturn.domain.addresses import local_http_url
from saturn.domain.errors import InvalidInput

PROVIDERS = {
    "lmstudio": "http://127.0.0.1:1234/v1",
    "ollama": "http://127.0.0.1:11434/v1",
    "openai": "http://127.0.0.1:8000/v1",
}


@dataclass
class Tunables:
    provider: str = "lmstudio"
    base_url: str = PROVIDERS["lmstudio"]
    model: str = ""  # empty: no worker model selected; digests are made by code only
    reasoning_effort: str = "none"
    llm_enabled: bool = True
    inline_token_limit: int = 700
    digest_token_budget: int = 450
    command_timeout_s: int = 300
    model_idle_unload_s: int = 120
    progress_interval_s: float = 15

    LIMITS: ClassVar[dict[str, tuple[int, int]]] = {
        "inline_token_limit": (100, 20_000), "digest_token_budget": (100, 4_000), "command_timeout_s": (5, 3_600),
        "model_idle_unload_s": (0, 86_400), "progress_interval_s": (0, 300),
    }
    FRACTIONAL: ClassVar[frozenset[str]] = frozenset({"progress_interval_s"})
    EFFORTS: ClassVar[tuple[str, ...]] = ("none", "minimal", "low", "medium", "high", "")
    HELP: ClassVar[dict[str, str]] = {
        "provider": "Model server kind: lmstudio, ollama, or openai (any other OpenAI-compatible server).",
        "base_url": "Model server address on this computer, ending in /v1.",
        "model": "Worker model id as the model server lists it. Empty: no model; digests are made by code only.",
        "reasoning_effort": "Reasoning effort sent to the model: none, minimal, low, medium, high, or empty to omit it.",
        "llm_enabled": "Use the worker model at all (true or false).",
        "inline_token_limit": "Output up to this many estimated tokens is returned unchanged (100-20000).",
        "digest_token_budget": "Largest digest in estimated tokens (100-4000).",
        "command_timeout_s": "A command running longer than this many seconds is stopped (5-3600).",
        "model_idle_unload_s": "Unload a model Saturn loaded after this many idle seconds; 0 keeps it loaded (0-86400).",
        "progress_interval_s": "Seconds between progress updates on a running tool call; 0 turns them off (0-300).",
    }

    def values(self) -> dict[str, Any]:
        return asdict(self)

    def update(self, changes: dict[str, Any]) -> dict[str, tuple[Any, Any]]:
        """Validate and apply `changes`; unknown keys are rejected. Returns what changed as (old, new)."""
        known = {f.name for f in fields(self)}
        unknown = set(changes) - known
        if unknown:
            raise InvalidInput(f"Unknown setting(s): {', '.join(sorted(unknown))}.")
        staged = {**asdict(self), **changes}
        self.validate(staged)
        staged["base_url"] = local_http_url(staged["base_url"])
        staged["model"] = staged["model"].strip()
        diff = {k: (getattr(self, k), staged[k]) for k in changes if getattr(self, k) != staged[k]}
        for key in changes:
            setattr(self, key, staged[key])
        return diff

    @classmethod
    def validate(cls, staged: dict[str, Any]) -> None:
        if staged["provider"] not in PROVIDERS:
            raise InvalidInput(f"provider must be one of {', '.join(PROVIDERS)}.")
        if not isinstance(staged["base_url"], str):
            raise InvalidInput("base_url must be text.")
        try:
            local_http_url(staged["base_url"])
        except ValueError as exc:
            raise InvalidInput(f"base_url: {exc}") from exc
        if not isinstance(staged["model"], str) or len(staged["model"]) > 200:
            raise InvalidInput("model must be text of at most 200 characters (empty for none).")
        if staged["reasoning_effort"] not in cls.EFFORTS:
            raise InvalidInput(f"reasoning_effort must be one of {', '.join(repr(e) for e in cls.EFFORTS)}.")
        if not isinstance(staged["llm_enabled"], bool):
            raise InvalidInput("llm_enabled must be true or false.")
        for key, (lo, hi) in cls.LIMITS.items():
            value = staged[key]
            kinds = (int, float) if key in cls.FRACTIONAL else (int,)
            if isinstance(value, bool) or not isinstance(value, kinds) or not lo <= value <= hi:
                kind = "a number" if key in cls.FRACTIONAL else "a whole number"
                raise InvalidInput(f"{key} must be {kind} between {lo} and {hi}.")

    @staticmethod
    def parse(key: str, text: str) -> Any:
        """Turn a command-line value into the setting's type."""
        kinds = {f.name: f.type for f in fields(Tunables)}
        if key not in kinds:
            raise InvalidInput(f"Unknown setting '{key}'. Known: {', '.join(kinds)}.")
        kind = str(kinds[key])
        if kind == "bool":
            if text.lower() not in ("true", "false"):
                raise InvalidInput(f"{key} must be true or false.")
            return text.lower() == "true"
        if kind in ("int", "float"):
            try:
                return float(text) if kind == "float" else int(text)
            except ValueError as exc:
                raise InvalidInput(f"{key} must be a number.") from exc
        return text
