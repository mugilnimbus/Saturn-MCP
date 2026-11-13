"""settings.toml and policy.toml: read with the standard TOML parser, written as plain commented TOML.

Both files are meant to be read and edited by people. Writes are atomic (a temporary file, then a
replace), so the service never reads half a file. A missing file means the defaults.
"""

from __future__ import annotations

import json
import os
import tomllib
from pathlib import Path
from typing import Any

from saturn.application.tunables import Tunables
from saturn.domain.errors import InvalidInput
from saturn.domain.policy import HOOK_SCOPES, PRESETS, Policy, Rule

POLICY_SOURCE = "policy.toml"


def _value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int | float):
        return str(value)
    if isinstance(value, list | tuple):
        if not value:
            return "[]"
        return "[\n" + "".join(f"  {_value(v)},\n" for v in value) + "]"
    return json.dumps(str(value), ensure_ascii=False)  # a JSON string is a valid TOML basic string


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    os.replace(temporary, path)


def _stamp(path: Path | None) -> object:
    if path is None:
        return None
    try:
        info = path.stat()
        return (info.st_mtime_ns, info.st_size)
    except OSError:
        return None


def settings_text(values: dict[str, Any]) -> str:
    lines = ["# Saturn settings. Edit here, in the dashboard (Settings), or with: saturn settings set <key> <value>",
             "# Saturn applies changes on its next tool call; no restart is needed.", ""]
    for key, value in values.items():
        lines.append(f"# {Tunables.HELP.get(key, '')}")
        lines.append(f"{key} = {_value(value)}")
        lines.append("")
    return "\n".join(lines)


def policy_text(policy: Policy) -> str:
    folders = [str(p) for p in policy.folders]
    return "\n".join([
        "# Saturn policy: which commands agents may run through Saturn, and in which folders.",
        "# Edit by hand or with: saturn policy allow|deny|remove \"<command pattern>\". Saturn applies changes on its",
        "# next call; an invalid file is not applied and the error shows in the dashboard and in `saturn doctor`.",
        "# Note: `saturn policy` rewrites this file, so comments you add are not kept.",
        "",
        "# standard: built-in test, build, lint, and read-only inspection commands.",
        "# open: any command that is not denied. Path guards apply either way.",
        f"preset = {_value(policy.preset)}",
        "",
        "[folders]",
        "# Folders agents may work in (absolute paths). Empty: any folder an agent names as its workspace.",
        f"allowed = {_value(folders)}",
        "",
        "[commands]",
        "# Patterns are compared word by word. A final * matches any further words; * inside a word matches any text.",
        "# Deny wins over allow. Examples: \"make deploy\", \"npm run e2e:*\", \"cargo *\".",
        f"allow = {_value([r.pattern for r in policy.allow])}",
        f"deny = {_value([r.pattern for r in policy.deny])}",
        "",
        "[hooks]",
        "# What the shell hooks act on: \"noisy\" (test, build, lint), \"all\", or \"off\".",
        f"scope = {_value(policy.hook_scope)}",
        "",
    ])


def parse_policy(data: dict[str, Any]) -> Policy:
    """A Policy from parsed TOML. Unknown keys are errors, so a typo cannot silently weaken a rule."""
    allowed_top = {"preset", "folders", "commands", "hooks"}
    sections = {"folders": {"allowed"}, "commands": {"allow", "deny"}, "hooks": {"scope"}}
    unknown = [k for k in data if k not in allowed_top]
    for name, keys in sections.items():
        section = data.get(name, {})
        if not isinstance(section, dict):
            raise InvalidInput(f"[{name}] must be a table.")
        unknown += [f"{name}.{k}" for k in section if k not in keys]
    if unknown:
        raise InvalidInput(f"Unknown key(s) in policy.toml: {', '.join(unknown)}.")
    preset = data.get("preset", "standard")
    if preset not in PRESETS:
        raise InvalidInput(f"preset must be one of {', '.join(PRESETS)}.")
    scope = data.get("hooks", {}).get("scope", "noisy")
    if scope not in HOOK_SCOPES:
        raise InvalidInput(f"hooks.scope must be one of {', '.join(HOOK_SCOPES)}.")

    def strings(section: str, key: str) -> list[str]:
        value = data.get(section, {}).get(key, [])
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            raise InvalidInput(f"{section}.{key} must be a list of text values.")
        return value

    folders = []
    for raw in strings("folders", "allowed"):
        path = Path(raw).expanduser()
        if not path.is_absolute():
            raise InvalidInput(f"folders.allowed: '{raw}' must be an absolute path.")
        folders.append(path.resolve())
    return Policy(
        preset=preset,
        allow=tuple(Rule.parse(p, POLICY_SOURCE) for p in strings("commands", "allow")),
        deny=tuple(Rule.parse(p, POLICY_SOURCE) for p in strings("commands", "deny")),
        folders=tuple(folders),
        hook_scope=scope,
    )


class ConfigFiles:
    """Reads and writes settings.toml and policy.toml; `None` paths keep everything in memory (tests)."""

    def __init__(self, settings_path: Path | None, policy_path: Path | None) -> None:
        self.settings_path = settings_path
        self.policy_path = policy_path

    def settings_stamp(self) -> object:
        return _stamp(self.settings_path)

    def policy_stamp(self) -> object:
        return _stamp(self.policy_path)

    def load_settings(self) -> dict[str, Any]:
        if self.settings_path is None or not self.settings_path.is_file():
            return {}
        try:
            return tomllib.loads(self.settings_path.read_text(encoding="utf-8-sig"))
        except tomllib.TOMLDecodeError as exc:
            raise InvalidInput(f"settings.toml is not valid TOML: {exc}") from exc

    def save_settings(self, values: dict[str, Any]) -> None:
        if self.settings_path is not None:
            _write(self.settings_path, settings_text(values))

    def load_policy(self) -> Policy:
        if self.policy_path is None or not self.policy_path.is_file():
            return Policy()
        try:
            data = tomllib.loads(self.policy_path.read_text(encoding="utf-8-sig"))
        except tomllib.TOMLDecodeError as exc:
            raise InvalidInput(f"policy.toml is not valid TOML: {exc}") from exc
        return parse_policy(data)

    def save_policy(self, policy: Policy) -> None:
        if self.policy_path is not None:
            _write(self.policy_path, policy_text(policy))
