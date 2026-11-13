"""Terminal helpers for Saturn's commands: questions with defaults, confirmations, tables, and change previews.

Anything that grants access asks for confirmation in an interactive terminal. An agent's shell tool does not
provide one, so an agent cannot connect itself or widen its own permissions through these commands.
"""

from __future__ import annotations

import difflib
import sys
from collections.abc import Sequence
from datetime import datetime

from saturn.application.ports import FileChange
from saturn.domain.redaction import redact


class Abort(Exception):
    """The user declined, or the command needs a terminal it does not have."""


def interactive() -> bool:
    return sys.stdin.isatty() and sys.stdout.isatty()


def require_terminal(action: str) -> None:
    if not interactive():
        raise Abort(f"{action} needs an interactive terminal so you can confirm it. Run it in your own terminal, "
                    "or add --print to see the change without making it.")


def ask(question: str, default: str = "", choices: Sequence[str] = ()) -> str:
    hint = f" [{'/'.join(choices) if choices else default}]" if (choices or default) else ""
    while True:
        try:
            answer = input(f"{question}{hint}: ").strip()
        except EOFError as exc:
            raise Abort("No answer.") from exc
        answer = answer or default
        if not choices or answer in choices:
            return answer
        print(f"  Choose one of: {', '.join(choices)}")


def confirm(question: str, *, default: bool = False) -> bool:
    answer = ask(question + (" (Y/n)" if default else " (y/N)")).lower()
    return default if not answer else answer in ("y", "yes")


def section(title: str) -> None:
    print(f"\n{title}\n{'-' * len(title)}")


def check(ok: bool | None, text: str, hint: str = "") -> None:
    mark = {True: "ok  ", False: "FAIL", None: "warn"}[ok]
    print(f"  [{mark}] {text}")
    if hint and ok is not True:
        print(f"         {hint}")


def table(rows: Sequence[Sequence[object]], headers: Sequence[str]) -> None:
    cells = [[str(c) for c in headers]] + [["" if c is None else str(c) for c in row] for row in rows]
    widths = [min(60, max(len(r[i]) for r in cells)) for i in range(len(headers))]
    for index, row in enumerate(cells):
        print("  ".join(cell[: widths[i]].ljust(widths[i]) for i, cell in enumerate(row)).rstrip())
        if index == 0:
            print("  ".join("-" * w for w in widths))


def when(epoch: float | None) -> str:
    return datetime.fromtimestamp(epoch).strftime("%Y-%m-%d %H:%M:%S") if epoch else ""


def show_changes(changes: list[FileChange], *, diff: bool) -> None:
    if not changes:
        print("  Nothing to change: the configuration already matches.")
        return
    for change in changes:
        verb = "create" if change.before is None else ("delete" if change.after is None else "change")
        print(f"  {verb} {change.path}: {change.summary}")
        if diff:
            # Only Saturn's own lines: these files can hold other servers' secrets, which must not be echoed.
            lines = difflib.unified_diff((change.before or "").splitlines(), (change.after or "").splitlines(), lineterm="", n=0)
            for line in lines:
                if line[:1] in "+-" and not line.startswith(("+++", "---")) and "saturn" in line.lower():
                    print("      " + redact(line)[0])
