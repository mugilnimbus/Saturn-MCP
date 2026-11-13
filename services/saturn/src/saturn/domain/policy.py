"""What Saturn may run and read.

Saturn runs commands outside the calling agent's sandbox, so it must never be looser than the client the
owner configured. A command is decided in a fixed order, and the first step that applies decides:

1. Guards: one argv without a shell; every argument that names a path stays inside the call's folders
   and is not a credential file. Guards cannot be switched off.
2. Deny rules, from the policy file and then from the calling harness.
3. Allow rules from the policy file.
4. The preset: `standard` uses the built-in grammar; `open` allows anything not denied.

Every decision names the rule that made it, so a run can be traced back to its reason.
"""

from __future__ import annotations

import fnmatch
import os
import re
import shlex
from dataclasses import dataclass
from pathlib import Path

from saturn.domain.command_grammar import program_name, refusal
from saturn.domain.errors import InvalidInput, PolicyViolation
from saturn.domain.internal_timing import timed

PRESETS = ("standard", "open")
HOOK_SCOPES = ("noisy", "all", "off")
SENSITIVE_NAMES = (".env", ".pem", ".key", ".pfx", ".p12", "id_rsa", "id_ed25519", ".netrc", "credentials", ".mcp.json",
                   "settings.local.json", ".token")
SKIP_DIRS = frozenset(
    [".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", ".next", "target", ".mypy_cache", ".pytest_cache",
     ".ruff_cache", ".idea", ".vscode"]
)
# Programs whose first positional argument is a search pattern, not a path.
_PATTERN_FIRST = frozenset({"rg", "grep"})
_PATTERN_FLAGS = frozenset({"-e", "--regexp", "-g", "--glob", "--iglob", "-t", "--type", "-T", "--type-not", "-f", "--file",
                            "--grep", "--author", "--format", "--pretty", "-S", "-G"})
_DRIVE = re.compile(r"^[A-Za-z]:")


@timed('arguments')
def split_command(command: str) -> list[str]:
    """Split a command line into argv without invoking a shell."""
    if not command.strip():
        raise InvalidInput("The command is empty.")
    try:
        if os.name == "nt":
            tokens = [t[1:-1] if len(t) > 1 and t[0] == t[-1] and t[0] in "\"'" else t for t in shlex.split(command, posix=False)]
        else:
            tokens = shlex.split(command)
    except ValueError as exc:
        raise InvalidInput(f"Could not parse the command: {exc}") from exc
    if not tokens:
        raise InvalidInput("The command is empty.")
    return tokens


@dataclass(frozen=True)
class Rule:
    """A command pattern compared word by word: `npm run test:*`, `make deploy`, `cargo *`.

    The first word is compared as a program name. A final `*` on its own matches any further words;
    `*` inside a word matches any text in that word.
    """

    pattern: str
    words: tuple[str, ...]
    source: str

    @classmethod
    def parse(cls, pattern: str, source: str) -> Rule:
        if not isinstance(pattern, str) or not pattern.strip() or len(pattern) > 300:
            raise InvalidInput("A command rule must be 1–300 characters.")
        words = tuple(split_command(pattern))
        if any(c in pattern for c in "|;&<>`") or words[0] == "*":
            raise InvalidInput(f"Rule {pattern!r} must start with a program name and contain no shell operators.")
        return cls(pattern.strip(), words, source)

    def matches(self, argv: list[str]) -> bool:
        words = list(self.words)
        open_end = words[-1] == "*"
        if open_end:
            words = words[:-1]
        if len(argv) < len(words) or (not open_end and len(argv) != len(words)):
            return False
        if program_name(argv[0]) != program_name(words[0]):
            return False
        return all(fnmatch.fnmatchcase(arg, word) for arg, word in zip(argv[1:], words[1:], strict=False))


@dataclass(frozen=True)
class Policy:
    preset: str = "standard"
    allow: tuple[Rule, ...] = ()
    deny: tuple[Rule, ...] = ()
    folders: tuple[Path, ...] = ()  # empty: any folder an agent names as its workspace
    hook_scope: str = "noisy"

    def __post_init__(self) -> None:
        if self.preset not in PRESETS:
            raise InvalidInput(f"preset must be one of {', '.join(PRESETS)}.")
        if self.hook_scope not in HOOK_SCOPES:
            raise InvalidInput(f"hooks scope must be one of {', '.join(HOOK_SCOPES)}.")


@dataclass(frozen=True)
class Decision:
    allowed: bool
    rule: str  # what decided: "guard", "deny <pattern>", "allow <pattern>", "preset standard", "preset open"
    reason: str
    source: str = ""


@dataclass(frozen=True)
class PathPolicy:
    roots: tuple[Path, ...]

    @timed('path')
    def resolve(self, raw: str | None) -> Path:
        """Resolve `raw` (relative paths are relative to the first root) and require it inside a root."""
        if not self.roots:
            raise PolicyViolation("No workspace folder for this call. Send workspace_root as the project's absolute folder.")
        base = self.roots[0]
        try:
            path = (base / raw if raw else base).resolve()
        except (OSError, ValueError) as exc:
            raise InvalidInput(f"Invalid path: {exc}") from exc
        if not self.contains(path):
            roots = ", ".join(str(r) for r in self.roots)
            raise PolicyViolation(f"'{raw}' is outside the folders this call may use: {roots}")
        return path

    def contains(self, path: Path) -> bool:
        return any(path == r or path.is_relative_to(r) for r in self.roots)

    @staticmethod
    def is_sensitive(path: Path) -> bool:
        name = path.name.lower()
        return any(name == s or name.startswith(s + ".") or name.endswith(s) for s in SENSITIVE_NAMES)

    @timed('path')
    def readable(self, raw: str | None) -> Path:
        path = self.resolve(raw)
        if self.is_sensitive(path):
            raise PolicyViolation(f"'{path.name}' looks like a secrets file; Saturn does not read it.")
        return path


def _named_path(arg: str, workdir: Path, *, value: bool) -> Path | None:
    """The path `arg` names when it could reach outside the folder or a credential file, else None.

    A relative argument without `..` stays inside the working folder unless it already exists (a link can
    point anywhere), so only absolute arguments, arguments with `..`, and existing entries are checked.
    A flag's value is checked only when it is unmistakably a path, since values are often formats or text.
    """
    if not arg or "://" in arg:
        return None
    text = os.path.expanduser(arg)
    absolute = bool(_DRIVE.match(text)) or text.startswith("~") or (not value and text[:1] in ("/", "\\"))
    dotted = ".." in re.split(r"[\\/]", text)
    try:
        candidate = Path(text) if absolute else workdir / text
        exists = candidate.exists()
        if not (absolute or dotted or exists):
            return None
        return candidate.resolve()
    except (OSError, ValueError):
        return None


def _guard(argv: list[str], workdir: Path, paths: PathPolicy) -> str | None:
    exe = program_name(argv[0])
    pattern_pending = exe in _PATTERN_FIRST or (exe == "git" and len(argv) > 1 and argv[1] == "grep")
    skip_next = False
    for index, arg in enumerate(argv[1:], start=1):
        if skip_next:
            skip_next = False
            continue
        if exe == "git" and index == 1:
            continue
        if arg in _PATTERN_FLAGS:
            skip_next = True
            if arg in ("-e", "--regexp", "-f", "--file"):
                pattern_pending = False
            continue
        if arg.startswith("-"):
            if "=" in arg:
                name, val = arg.split("=", 1)
                if name not in _PATTERN_FLAGS:
                    found = _named_path(val, workdir, value=True)
                    if found is not None and (not paths.contains(found) or PathPolicy.is_sensitive(found)):
                        return f"Option {name} names '{val}', outside the folders this call may use or a credential file."
            continue
        if pattern_pending:
            pattern_pending = False
            continue
        found = _named_path(arg, workdir, value=False)
        if found is None:
            continue
        if not paths.contains(found):
            return f"Argument '{arg}' points outside the folders this call may use."
        if PathPolicy.is_sensitive(found):
            return f"Argument '{arg}' names a credential file; Saturn does not read those."
    return None


def decide(policy: Policy, argv: list[str], *, workdir: Path, paths: PathPolicy,
           harness_deny: tuple[Rule, ...] = ()) -> Decision:
    """Decide whether `argv` may run in `workdir` for a call limited to `paths`."""
    guard = _guard(argv, workdir, paths)
    if guard is not None:
        return Decision(False, "guard", guard, "built in")
    for rule in (*policy.deny, *harness_deny):
        if rule.matches(argv):
            return Decision(False, f"deny {rule.pattern}", f"Denied by the rule '{rule.pattern}' in {rule.source}.", rule.source)
    for rule in policy.allow:
        if rule.matches(argv):
            return Decision(True, f"allow {rule.pattern}", f"Allowed by the rule '{rule.pattern}' in {rule.source}.", rule.source)
    if policy.preset == "open":
        return Decision(True, "preset open", "Allowed: the policy preset is open.", "policy.toml")
    reason = refusal(argv)
    if reason is not None:
        return Decision(False, "preset standard", reason, "built in")
    return Decision(True, "preset standard", "Allowed: a standard test, build, lint, or inspection command.", "built in")


def check(policy: Policy, argv: list[str], *, workdir: Path, paths: PathPolicy,
          harness_deny: tuple[Rule, ...] = ()) -> Decision:
    """Like `decide`, but raise PolicyViolation for a refusal, with a message the agent can act on."""
    decision = decide(policy, argv, workdir=workdir, paths=paths, harness_deny=harness_deny)
    if not decision.allowed:
        if decision.rule.startswith("deny "):
            hint = " Ask the user whether that rule should be removed."
        elif decision.rule == "guard":
            hint = ""
        else:
            hint = (" Ask the user to allow it with: saturn policy allow \"" + " ".join(argv[:3])
                    + (" *" if len(argv) > 3 else "") + "\"")
        raise PolicyViolation(decision.reason + hint)
    return decision
