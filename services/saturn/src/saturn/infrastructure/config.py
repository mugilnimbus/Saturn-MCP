"""Startup settings and the Saturn home folder. Secrets are read here and nowhere else.

Only values needed before the service starts live in `<home>/.env`: the model server's API key, where
Saturn listens, where its data goes, and a few process limits. Everything an operator tunes at runtime is
in settings.toml, and every safety rule is in policy.toml; both are next to `.env` in the home folder.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from saturn.domain.addresses import loopback_host

ENV_KEYS = ("LOCAL_SERVER_API_KEY", "SATURN_HOST", "SATURN_PORT", "SATURN_DATA_DIR", "SATURN_SHUTDOWN_GRACE_S",
            "SATURN_LLM_TIMEOUT_S", "SATURN_LLM_CONCURRENCY", "SATURN_INTERNAL_TIMING", "SATURN_HOME", "SATURN_URL", "SATURN_TOKEN")


def saturn_home() -> Path:
    """`SATURN_HOME`, or `~/.saturn`."""
    raw = os.environ.get("SATURN_HOME", "").strip()
    return Path(raw).expanduser().resolve() if raw else (Path.home() / ".saturn").resolve()


def unknown_env_keys(path: Path) -> list[str]:
    """Keys in an env file that Saturn does not read, usually typos or settings that moved to settings.toml."""
    if not path.is_file():
        return []
    found = []
    for line in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        key = line.split("=", 1)[0].strip().removeprefix("export ").strip()
        if key and not key.startswith("#") and "=" in line and key not in ENV_KEYS:
            found.append(key)
    return found


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
        hide_input_in_errors=True,
    )

    home_raw: str = Field("", validation_alias=AliasChoices("SATURN_HOME"))
    local_server_api_key: SecretStr = Field(SecretStr(""), validation_alias=AliasChoices("LOCAL_SERVER_API_KEY"))
    host: str = Field("127.0.0.1", validation_alias=AliasChoices("SATURN_HOST"))
    port: int = Field(9000, ge=1, le=65535, validation_alias=AliasChoices("SATURN_PORT"))
    data_dir_raw: str = Field("", validation_alias=AliasChoices("SATURN_DATA_DIR"))
    shutdown_grace_s: int = Field(5, ge=0, le=600, validation_alias=AliasChoices("SATURN_SHUTDOWN_GRACE_S"))
    llm_timeout_s: float = Field(180.0, gt=0, le=3600, validation_alias=AliasChoices("SATURN_LLM_TIMEOUT_S"))
    llm_concurrency: int = Field(1, ge=1, le=8, validation_alias=AliasChoices("SATURN_LLM_CONCURRENCY"))

    internal_timing: bool = Field(False, validation_alias=AliasChoices("SATURN_INTERNAL_TIMING"))

    # Fixed limits, not configuration.
    command_max_bytes: int = 30_000_000
    query_token_limit: int = 900
    llm_digest_threshold: float = 0.5
    map_chunk_tokens: int = 1800
    map_max_chunks: int = 10
    ask_max_steps: int = 6
    ask_token_budget: int = 24_000
    ask_answer_tokens: int = 450
    observation_tokens: int = 700
    artifact_ttl_hours: float = 48.0
    payload_ttl_hours: float = 48.0  # full request, response, and model bodies
    artifact_max_bytes: int = 25_000_000
    store_max_total_bytes: int = 512_000_000
    trace_payload_chars: int = 1500

    @field_validator("host")
    @classmethod
    def validate_host(cls, value: str) -> str:
        return loopback_host(value)

    @property
    def home(self) -> Path:
        return Path(self.home_raw).expanduser().resolve() if self.home_raw else saturn_home()

    @property
    def env_path(self) -> Path:
        return self.home / ".env"

    @property
    def settings_path(self) -> Path:
        return self.home / "settings.toml"

    @property
    def policy_path(self) -> Path:
        return self.home / "policy.toml"

    @property
    def credentials_dir(self) -> Path:
        return self.home / "credentials"

    @property
    def installs_path(self) -> Path:
        return self.home / "installs.json"

    @property
    def backups_dir(self) -> Path:
        return self.home / "backups"

    @property
    def data_dir(self) -> Path:
        return Path(self.data_dir_raw).expanduser().resolve() if self.data_dir_raw else self.home / "data"

    @property
    def base_url(self) -> str:
        host = "127.0.0.1" if self.host in {"0.0.0.0", "::"} else self.host
        return f"http://{f'[{host}]' if ':' in host else host}:{self.port}"

    @property
    def secrets(self) -> tuple[str, ...]:
        value = self.local_server_api_key.get_secret_value()
        return (value,) if value else ()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # The env file is resolved now, not at import, so SATURN_HOME set by the caller is honoured.
    return Settings(_env_file=str(saturn_home() / ".env"))  # type: ignore[call-arg]
