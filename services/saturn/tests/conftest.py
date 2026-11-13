"""Shared fakes: a scripted model gateway and a canned command runner, plus isolated containers."""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import fields
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel

from saturn.application.ports import CommandResult
from saturn.application.tunables import Tunables
from saturn.bootstrap.container import Container, build_container
from saturn.domain.access import TOOLS
from saturn.domain.policy import Policy, Rule
from saturn.infrastructure.config import Settings

TUNABLE_KEYS = {f.name for f in fields(Tunables)}


class FakeGateway:
    """Answers model calls from a script: `script(tools, system, user, purpose)` returns a tool instance."""

    model_name = "fake-model"

    def __init__(self, script: Callable[..., BaseModel] | None = None) -> None:
        self.script = script
        self.calls: list[dict[str, Any]] = []

    async def call(
        self, tools: Sequence[type[BaseModel]], *, system: str, user: str, purpose: str, max_output_tokens: int = 400
    ) -> Any:
        self.calls.append({"tools": [t.__name__ for t in tools], "user": user, "purpose": purpose})
        if self.script is None:
            raise AssertionError("model was called but no script was set")
        return self.script(tools, system, user, purpose)

    def graph_config(self, purpose: str = "") -> dict[str, Any]:
        return {}


class FakeRunner:
    def __init__(self, output: str = "", exit_code: int = 0) -> None:
        self.output, self.exit_code = output, exit_code
        self.seen: list[tuple[list[str], Path]] = []

    async def run(self, argv: Sequence[str], cwd: Path, timeout_s: float) -> CommandResult:
        self.seen.append((list(argv), cwd))
        return CommandResult(self.exit_code, self.output, 0.25, False, False)


@pytest.fixture
def root(tmp_path: Path) -> Path:
    project = tmp_path / "project"
    (project / "pkg").mkdir(parents=True)
    (project / "pkg" / "calc.py").write_text(
        "def add(a, b):\n    return a + b\n\n\ndef total(values):\n    return sum(values) + 1  # bug\n", encoding="utf-8"
    )
    (project / ".env").write_text("SECRET=hunter2hunter2\n", encoding="utf-8")
    return project


@pytest.fixture
def home(tmp_path: Path) -> Path:
    folder = tmp_path / "saturn-home"
    folder.mkdir()
    return folder


def isolated_settings(home: Path, **overrides: Any) -> Settings:
    api_key = overrides.pop("local_server_api_key", "test-key-123456")
    settings = Settings(_env_file=None, home_raw=str(home), local_server_api_key=api_key, **overrides)  # type: ignore[call-arg]
    assert settings.home == home.resolve() and settings.data_dir == home.resolve() / "data"
    return settings


@pytest.fixture
def make_container(root: Path, home: Path):
    """Build an in-memory container. Keyword arguments go to settings, tunables, or the policy by name.

    Policy keys: preset, allow, deny (lists of patterns), folders (default: the test project), hook_scope.
    """
    opened: list[Container] = []

    def make(gateway: FakeGateway | None = None, runner: FakeRunner | None = None, **overrides: Any) -> Container:
        tunables = {k: overrides.pop(k) for k in list(overrides) if k in TUNABLE_KEYS}
        policy = Policy(
            preset=overrides.pop("preset", "standard"),
            allow=tuple(Rule.parse(p, "policy.toml") for p in overrides.pop("allow", [])),
            deny=tuple(Rule.parse(p, "policy.toml") for p in overrides.pop("deny", [])),
            folders=tuple(Path(f).resolve() for f in overrides.pop("folders", [root])),
            hook_scope=overrides.pop("hook_scope", "noisy"),
        )
        settings = isolated_settings(home, **overrides)
        container = build_container(settings, db_path=":memory:", gateway=gateway or FakeGateway(), runner=runner or FakeRunner(),
                                    files=False, policy=policy, tunables=tunables)
        opened.append(container)
        return container

    yield make
    for container in opened:
        container.close()


def add_harness(container: Container, *, tools: Sequence[str] = TOOLS, name: str = "Test harness", **options: Any) -> str:
    """Create a harness and return its token."""
    _, token = container.access.create(name, list(tools), **options)
    return token


def add_harness_with_token(container: Container, token: str, *, tools: Sequence[str] = TOOLS, name: str = "Hook harness",
                           hooks: bool = True) -> None:
    """Register a harness whose token the test already knows, as a client configuration would hold it."""
    import hashlib
    import time
    from uuid import uuid4

    from saturn.domain.access import Harness

    harness = Harness(uuid4().hex, name, "hook-harness", tuple(tools), True, time.time(), None, hooks=hooks)
    container.access.store.save(harness, digest=hashlib.sha256(token.encode()).hexdigest(), action="created",
                                actor="dashboard", create=True)
