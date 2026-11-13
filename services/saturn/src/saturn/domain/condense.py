"""Shrink long output to the lines worth a model's attention, with no model involved.

Repeated lines collapse into one entry with a count, then entries are ranked
(error-like, goal keywords, rare, near the start or end) and the best fit the
budget. The original line numbers survive so every claim can be checked.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from saturn.domain.text_ops import clip, template_of
from saturn.domain.tokens import estimate_tokens

_ERROR = re.compile(r"(?i)\b(error|fatal|exception|traceback|fail(?:ed|ure)?|panic|assert|denied|refused|timeout|timed out|unhandled|cannot|could not|abort)\b")
_WARN = re.compile(r"(?i)\bwarn(?:ing)?\b|\bdeprecat")
_WORD = re.compile(r"[A-Za-z_][A-Za-z0-9_./:-]{2,}")
_STOP = frozenset(["the", "and", "for", "with", "that", "this", "from", "what", "which", "why", "how", "are", "was", "were", "when", "where", "find", "show", "list", "tell", "about", "into", "does", "did"])


@dataclass(frozen=True)
class CLine:
    line: int  # 1-based line number of the first occurrence
    count: int  # how many lines share this template
    text: str

    def render(self) -> str:
        times = f" ×{self.count}" if self.count > 1 else ""
        return f"L{self.line}{times} {clip(self.text.strip(), 200)}"


def goal_terms(goal: str) -> set[str]:
    return {w.lower() for w in _WORD.findall(goal) if w.lower() not in _STOP}


def condense(lines: list[str], *, goal: str = "", max_tokens: int) -> list[CLine]:
    groups: dict[str, list[int]] = {}
    for index, text in enumerate(lines):
        if text.strip():
            groups.setdefault(template_of(text), []).append(index)
    terms = goal_terms(goal)
    total = len(lines)
    scored: list[tuple[float, CLine]] = []
    for members in groups.values():
        first = members[0]
        text = lines[first]
        lowered = text.lower()
        score = 0.0
        if _ERROR.search(text):
            score += 3
        if _WARN.search(text):
            score += 1
        if terms and any(t in lowered for t in terms):
            score += 4
        if len(members) == 1:
            score += 1
        if first < 15 or first >= total - 25:
            score += 2
        scored.append((score, CLine(first + 1, len(members), text)))
    scored.sort(key=lambda s: (-s[0], s[1].line))
    kept: list[CLine] = []
    used = 0
    for _score, cline in scored:
        cost = estimate_tokens(cline.render()) + 1
        if used + cost > max_tokens:
            continue
        kept.append(cline)
        used += cost
    kept.sort(key=lambda c: c.line)
    return kept


def chunk(lines: list[CLine], chunk_tokens: int) -> list[list[CLine]]:
    chunks: list[list[CLine]] = []
    current: list[CLine] = []
    used = 0
    for cline in lines:
        cost = estimate_tokens(cline.render()) + 1
        if current and used + cost > chunk_tokens:
            chunks.append(current)
            current, used = [], 0
        current.append(cline)
        used += cost
    if current:
        chunks.append(current)
    return chunks
