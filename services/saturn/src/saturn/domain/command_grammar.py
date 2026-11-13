"""The standard preset: which test, build, lint, and inspection commands Saturn runs without an allow rule.

Each rule answers one question for one program: does this argument list stay a test, build, lint, or
read-only inspection? A command that would change source files, install or fetch dependencies, or run an
arbitrary project script is refused here; the owner can still allow it explicitly in the policy file.
"""

from __future__ import annotations

import re

PROGRAMS = frozenset(
    ["git", "python", "python3", "py", "uv", "pytest", "ruff", "mypy", "npm", "npx", "pnpm", "yarn", "node", "tsc",
     "eslint", "vitest", "jest", "cargo", "go", "dotnet", "make", "rg", "ls", "dir"]
)
_GIT_READ = frozenset(
    ["status", "diff", "log", "show", "ls-files", "blame", "rev-parse", "rev-list", "shortlog", "grep", "describe", "branch"]
)
_GIT_FORBIDDEN_FLAGS = ("--output", "-o", "--exec", "--ext-diff", "--textconv")
_BRANCH_LIST_FLAGS = frozenset(
    ["-a", "--all", "-r", "--remotes", "-l", "--list", "-v", "-vv", "--verbose", "--show-current", "--column", "--no-column",
     "--color", "--no-color", "-i", "--ignore-case", "--omit-empty"]
)
_BRANCH_VALUE_FLAGS = frozenset(["--contains", "--no-contains", "--merged", "--no-merged", "--points-at", "--sort", "--format"])
_PY_MODULES = frozenset({"pytest", "unittest", "ruff", "mypy"})
_PKG_SUBCOMMANDS = frozenset(["test", "t", "ls", "list", "outdated", "audit", "view", "info", "why", "explain"])
_RUNNERS = frozenset(["run", "run-script"])
_NPX_TOOLS = frozenset({"tsc", "eslint", "vitest", "jest", "prettier"})
_NPX_FORBIDDEN = frozenset(["-y", "--yes", "-p", "--package", "-c", "--call"])
_UV_PROVISIONING = ("--with", "--with-requirements", "--with-editable", "--isolated")
_CARGO = frozenset(["test", "build", "check", "clippy", "doc", "tree", "metadata"])
_GO = frozenset(["test", "build", "vet", "list", "version"])
_DOTNET = frozenset({"test", "build"})
_WRITE_FLAGS = frozenset(["--fix", "--write", "-w", "--unsafe-fixes", "--fix-only", "--pre", "--pre-glob"])
# Script and target names that mean a test, build, lint, or check task, with any suffix such as test:unit.
TASK_NAME = re.compile(r"^(test|tests|build|lint|check|typecheck|type-check|tsc|coverage|ci|verify|validate|all)([:._-].*)?$")


def program_name(token: str) -> str:
    """A token as a program name: lower-cased, without path or extension."""
    base = token.replace("\\", "/").rsplit("/", 1)[-1].lower()
    for suffix in (".exe", ".cmd", ".bat", ".ps1"):
        if base.endswith(suffix):
            return base[: -len(suffix)]
    return base


def refusal(argv: list[str]) -> str | None:
    """The reason the standard preset refuses `argv`, or None when it is a standard command."""
    exe = program_name(argv[0])
    if exe not in PROGRAMS:
        return f"'{argv[0]}' is not one of Saturn's standard commands ({', '.join(sorted(PROGRAMS))})."
    args = argv[1:]
    if args in (["--version"], ["-V"], ["version"]) and exe != "make":
        return None
    rule = _RULES.get(exe)
    reason = rule(args) if rule is not None else None
    if reason is None and exe in {"ruff", "eslint", "mypy", "tsc", "rg", "pytest", "vitest", "jest"}:
        reason = _write_flags(exe, args)
    return reason


def _write_flags(exe: str, args: list[str]) -> str | None:
    for arg in args:
        if arg in _WRITE_FLAGS or arg.startswith(("--pre=", "--fix=")):
            return f"'{exe} {arg}' can change files or run helpers; Saturn runs checks, not fixes."
    if exe == "ruff" and args[:1] == ["format"] and "--check" not in args and "--diff" not in args:
        return "'ruff format' changes files; use 'ruff format --check'."
    return None


def _git(args: list[str]) -> str | None:
    rest = [a for a in args if a != "--no-pager"]
    if not rest or rest[0].startswith("-"):
        return "Use a git subcommand directly (status, diff, log, show, ls-files, blame, grep …); run it in the folder with cwd."
    sub = rest[0]
    if sub not in _GIT_READ:
        return f"'git {sub}' is not read-only. Allowed: {', '.join(sorted(_GIT_READ))}."
    if any(a.startswith(_GIT_FORBIDDEN_FLAGS) for a in rest[1:]):
        return "That git option can write files or run helpers."
    return _git_branch(rest[1:]) if sub == "branch" else None


def _git_branch(args: list[str]) -> str | None:
    listing = any(a in ("-l", "--list") for a in args)
    expect_value = False
    for arg in args:
        if expect_value:
            expect_value = False
            continue
        name = arg.split("=", 1)[0]
        if name in _BRANCH_VALUE_FLAGS:
            expect_value = "=" not in arg
            continue
        if arg in _BRANCH_LIST_FLAGS or (arg.startswith("-") and name in _BRANCH_LIST_FLAGS):
            continue
        if arg.startswith("-") or not listing:
            return "'git branch' may only list branches (a name without --list would create one)."
    return None


def _python(args: list[str]) -> str | None:
    if len(args) >= 2 and args[0] == "-m" and args[1] in _PY_MODULES:
        return _write_flags(args[1], args[2:])
    return "Python is limited to 'python -m pytest|unittest|ruff|mypy' (no scripts or -c)."


def _uv(args: list[str]) -> str | None:
    if args[:1] == ["run"]:
        inner = list(args[1:])
        while inner and inner[0].startswith("-"):
            flag = inner.pop(0)
            if flag.split("=", 1)[0] in _UV_PROVISIONING:
                return f"'uv run {flag}' installs packages for the run; Saturn does not install dependencies."
            if flag in ("--project", "--directory", "--package", "--python", "--group", "--extra") and inner:
                inner.pop(0)
        if not inner:
            return "'uv run' needs a command."
        return refusal(inner)
    if args[:1] == ["tree"] or args[:2] in (["pip", "list"], ["pip", "show"], ["pip", "freeze"]):
        return None
    return "uv is limited to 'uv run <standard command>', 'uv tree', and 'uv pip list|show|freeze'."


def _package_manager(args: list[str], *, scripts_direct: bool) -> str | None:
    words = [a for a in args if not a.startswith("-")]
    sub = words[0] if words else ""
    if sub in _RUNNERS:
        script = words[1] if len(words) > 1 else ""
        if script and not TASK_NAME.match(script):
            return (f"Script '{script}' is not a test, build, lint, or check task. "
                    "The owner can allow it with an allow rule in Saturn's policy.")
        return None
    if sub == "audit" and len(words) > 1 and words[1] == "fix":
        return "'audit fix' changes dependencies; Saturn does not install or update packages."
    if sub in _PKG_SUBCOMMANDS:
        return None
    if scripts_direct and sub and TASK_NAME.match(sub):
        return None  # yarn and pnpm run a script named like a task directly: `yarn test:unit`
    return f"Package manager subcommand '{sub or '(none)'}' is not allowed. Allowed: {', '.join(sorted(_PKG_SUBCOMMANDS | _RUNNERS))}."


def _npm(args: list[str]) -> str | None:
    return _package_manager(args, scripts_direct=False)


def _pnpm(args: list[str]) -> str | None:
    return _package_manager(args, scripts_direct=True)


def _npx(args: list[str]) -> str | None:
    if any(a.split("=", 1)[0] in _NPX_FORBIDDEN for a in args):
        return "npx may not install or fetch packages (--yes, --package, --call)."
    words = [a for a in args if not a.startswith("-")]
    tool = words[0] if words else ""
    if tool not in _NPX_TOOLS:
        return f"npx is limited to locally installed: {', '.join(sorted(_NPX_TOOLS))}."
    return _write_flags(tool, args[args.index(tool) + 1:])


def _node(args: list[str]) -> str | None:
    return None if args[:1] in (["--test"], ["--version"], ["-v"]) else "node is limited to 'node --test' and 'node --version'."


def _make(args: list[str]) -> str | None:
    expect_value = False
    for arg in args:
        if expect_value:
            expect_value = False
            continue
        if arg in ("-C", "-f", "--file", "--directory", "-j", "--jobs", "-I", "--include-dir"):
            expect_value = True
            continue
        if arg.startswith("-") or "=" in arg:
            continue
        if not TASK_NAME.match(arg):
            return f"make target '{arg}' is not a test, build, lint, or check task. The owner can allow it in Saturn's policy."
    return None


def _cargo(args: list[str]) -> str | None:
    if not args or args[0] not in _CARGO:
        return f"cargo is limited to: {', '.join(sorted(_CARGO))}."
    if args[0] == "clippy" and any(a in ("--fix", "--allow-dirty") for a in args):
        return "'cargo clippy --fix' changes files."
    return None


def _go(args: list[str]) -> str | None:
    return None if args and args[0] in _GO else f"go is limited to: {', '.join(sorted(_GO))}."


def _dotnet(args: list[str]) -> str | None:
    if args[:1] in (["--info"],):
        return None
    if not args or args[0] not in _DOTNET:
        return f"dotnet is limited to: {', '.join(sorted(_DOTNET))}."
    if "--no-restore" not in args:
        return f"'dotnet {args[0]}' restores packages from the network; add --no-restore."
    return None


_RULES = {
    "git": _git, "python": _python, "python3": _python, "py": _python, "uv": _uv, "npm": _npm, "pnpm": _pnpm,
    "yarn": _pnpm, "npx": _npx, "node": _node, "make": _make, "cargo": _cargo, "go": _go, "dotnet": _dotnet,
}
