"""Which shell commands a result hook may shrink.

A hook replaces what the agent sees of a command it ran itself. That is safe for test, build, and lint
output, where a digest of the failures is what the agent wants. It is harmful for commands whose exact
text the agent goes on to use, such as `git diff` or `cat`. So the default is a list of tools known to
be noisy, and anything else is left alone.
"""

from __future__ import annotations

import re

NOISY_EXECUTABLES = frozenset(
    ["pytest", "tox", "nox", "python", "python3", "py", "uv", "pip", "poetry", "hatch", "npm", "pnpm", "yarn", "bun", "npx", "node", "deno", "jest", "vitest", "mocha", "playwright", "cypress", "tsc", "eslint", "prettier", "webpack", "vite", "rollup", "ruff", "mypy", "pyright", "pylint", "flake8", "black", "cargo", "rustc", "go", "dotnet", "msbuild", "make", "cmake", "ninja", "gradle", "gradlew", "mvn", "mvnw", "ant", "bazel", "rspec", "bundle", "rake", "phpunit", "composer", "swift", "xcodebuild", "docker", "terraform"]
)
# Programs that run other things. `python -m pytest` is a test run, but `python report.py` prints whatever
# the script prints, and its exact text may be what the agent wants. So one of these counts as noisy only
# when the same command also names a noisy tool or a test, build, or lint task.
LAUNCHERS = frozenset({"python", "python3", "py", "uv", "node", "deno", "bun", "npx", "poetry", "hatch", "bundle", "docker"})
_TASK_WORDS = frozenset({"test", "tests", "build", "lint", "check", "unittest", "compileall", "typecheck"})
_WRAPPERS = frozenset({"time", "env", "sudo", "nice", "command", "exec"})
_DIRECT = re.compile(r"(?:^|[\s;&|(])(?:\$env:)?SATURN_DIRECT\s*=\s*[\"']?1", re.IGNORECASE)
_SEPARATORS = re.compile(r"&&|\|\||[;|\n]")
_ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")


def _program(word: str) -> str:
    """A token as a program name: lower-cased, without path or extension."""
    name = word.replace("\\", "/").rsplit("/", 1)[-1].lower()
    for suffix in (".exe", ".cmd", ".bat", ".ps1", ".sh"):
        if name.endswith(suffix):
            name = name[: -len(suffix)]
    return name


def _parts(command: str) -> list[tuple[str, list[str]]]:
    """Each part of a shell command line as the program it starts with and the words after it."""
    found: list[tuple[str, list[str]]] = []
    for part in _SEPARATORS.split(command):
        words = [token.strip("\"'()") for token in part.split()]
        for index, word in enumerate(words):
            if not word or _ASSIGNMENT.match(word) or word.lower() in _WRAPPERS:
                continue
            found.append((_program(word), words[index + 1:]))
            break
    return found


def leading_executables(command: str) -> list[str]:
    """The program each part of a shell command line starts with, lower-cased and without path or extension."""
    return [name for name, _ in _parts(command)]


def is_marked_direct(command: str) -> bool:
    """True when the command sets SATURN_DIRECT=1: the caller asked for this output as it is."""
    return bool(_DIRECT.search(command))


_SHELL_SYNTAX = re.compile(r"[|&;<>`$(){}\n]|^\s*[A-Za-z_][A-Za-z0-9_]*=")


def is_single_command(command: str) -> bool:
    """True for one plain program invocation: no pipes, chains, redirects, substitutions, or variable assignments.

    Only such a command means the same thing when Saturn runs it without a shell.
    """
    return bool(command.strip()) and not _SHELL_SYNTAX.search(command)


def is_noisy_command(command: str) -> bool:
    """True when any part of the command line runs a tool whose long output is safe to digest.

    A launcher such as `python` or `uv` counts only when it is running such a tool or a test, build, or lint task.
    """
    for name, rest in _parts(command):
        if name not in NOISY_EXECUTABLES:
            continue
        if name not in LAUNCHERS:
            return True
        for word in rest:
            task = _program(word.lstrip("-"))
            if task in _TASK_WORDS or (task in NOISY_EXECUTABLES and task not in LAUNCHERS):
                return True
    return False
