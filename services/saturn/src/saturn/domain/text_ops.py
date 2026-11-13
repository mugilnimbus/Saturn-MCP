"""Pure text helpers: ANSI stripping, line templates, windows, and grep over lines."""

from __future__ import annotations

import re
from dataclasses import dataclass

MAX_RENDER_LINE = 240

_ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")
_TEMPLATE_RULES: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"), "<uuid>"),
    (re.compile(r"\b0x[0-9a-fA-F]+\b"), "<hex>"),
    (re.compile(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?"), "<ts>"),
    # Digits not glued to a preceding identifier, so "12ms" and "db-7" collapse but "TS2304" and "utf8" stay distinct.
    (re.compile(r"(?<![A-Za-z_])\d+(?:\.\d+)?"), "#"),
)


def strip_ansi(text: str) -> str:
    return _ANSI.sub("", text).replace("\r\n", "\n").replace("\r", "\n")


def template_of(line: str) -> str:
    """Collapse the variable parts of a line so repeats can be counted together."""
    out = line.strip()
    for pattern, token in _TEMPLATE_RULES:
        out = pattern.sub(token, out)
    return out[:300]


def clip(line: str, width: int = MAX_RENDER_LINE) -> str:
    return line if len(line) <= width else line[: width - 1] + "…"


def number_lines(lines: list[str], start: int = 1) -> str:
    """Render lines as `   12 | text`, clipping very long lines."""
    width = len(str(start + len(lines)))
    return "\n".join(f"{start + i:>{width}} | {clip(text)}" for i, text in enumerate(lines))


@dataclass(frozen=True)
class Match:
    line: int
    text: str
    before: tuple[tuple[int, str], ...] = ()
    after: tuple[tuple[int, str], ...] = ()


def grep_lines(
    lines: list[str], pattern: re.Pattern[str], *, context: int = 0, max_matches: int = 50
) -> tuple[list[Match], int]:
    """Return up to `max_matches` matches and the total number of matching lines."""
    matches: list[Match] = []
    total = 0
    for index, text in enumerate(lines):
        if not pattern.search(text):
            continue
        total += 1
        if len(matches) >= max_matches:
            continue
        lo, hi = max(0, index - context), min(len(lines), index + context + 1)
        matches.append(
            Match(
                line=index + 1,
                text=text,
                before=tuple((n + 1, lines[n]) for n in range(lo, index)),
                after=tuple((n + 1, lines[n]) for n in range(index + 1, hi)),
            )
        )
    return matches, total


def render_matches(matches: list[Match]) -> str:
    chunks: list[str] = []
    last_end = 0
    for m in matches:
        first = m.before[0][0] if m.before else m.line
        if chunks and first > last_end + 1:
            chunks.append("--")
        for n, t in m.before:
            if n > last_end:
                chunks.append(f"{n}- {clip(t)}")
        if m.line > last_end:
            chunks.append(f"{m.line}: {clip(m.text)}")
        for n, t in m.after:
            chunks.append(f"{n}- {clip(t)}")
        last_end = m.after[-1][0] if m.after else m.line
    return "\n".join(chunks)


_PLAIN_WORDS = re.compile(r"^[A-Za-z0-9_\- ]+$")


def pattern_tiers(pattern: str) -> list[tuple[str, re.Pattern[str]]]:
    """Progressively looser searches for a phrase: exact, flexible separators, then all words on one line.

    A phrase such as "inline token limit" should still find `inline_token_limit`.
    """
    tiers = [("exact", compile_pattern(pattern))]
    words = [w for w in re.split(r"[\s_\-]+", pattern.strip()) if w]
    if len(words) >= 2 and _PLAIN_WORDS.match(pattern.strip()):
        escaped = [re.escape(w) for w in words]
        tiers.append(("flexible separators", re.compile(r"[\W_]*".join(escaped), re.IGNORECASE)))
        tiers.append(("all words on one line", re.compile("".join(f"(?=.*{w})" for w in escaped), re.IGNORECASE)))
    return tiers


def compile_pattern(pattern: str, *, ignore_case: bool = True) -> re.Pattern[str]:
    """Compile a user pattern; fall back to a literal search when it is not valid regex."""
    flags = re.IGNORECASE if ignore_case else 0
    try:
        return re.compile(pattern, flags)
    except re.error:
        return re.compile(re.escape(pattern), flags)
