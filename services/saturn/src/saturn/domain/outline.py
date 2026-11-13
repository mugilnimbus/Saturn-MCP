"""Structural outline of a source or document file, used instead of reading it whole."""

from __future__ import annotations

import re

from saturn.domain.internal_timing import timed

_BY_SUFFIX: dict[str, re.Pattern[str]] = {}


def _compile(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern)


_PY = _compile(r"^\s*(?:async\s+def|def|class)\s+\w+")
_JS = _compile(r"^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|class|interface|type|enum|const|let)\s+\w+")
_MD = _compile(r"^#{1,4}\s+\S")
_GO = _compile(r"^(?:func|type|var|const)\s+")
_RS = _compile(r"^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:fn|struct|enum|impl|trait|mod)\b")
_JAVAISH = _compile(r"^\s*(?:public|private|protected|internal|static|abstract|final|sealed)?\s*(?:class|interface|enum|record|struct)\s+\w+")
_SVELTE = _compile(r"^\s*(?:<script|<style|export\s+(?:let|const|function)|function\s+\w+|\$:)")

_PATTERNS = {
    ".py": _PY,
    ".js": _JS, ".jsx": _JS, ".ts": _JS, ".tsx": _JS, ".mjs": _JS, ".cjs": _JS,
    ".svelte": _SVELTE, ".vue": _SVELTE,
    ".md": _MD, ".mdx": _MD, ".rst": _MD,
    ".go": _GO, ".rs": _RS,
    ".java": _JAVAISH, ".cs": _JAVAISH, ".kt": _JAVAISH,
}


@timed('deterministic_digest')
def outline(lines: list[str], suffix: str, *, limit: int = 80) -> list[tuple[int, str]]:
    """Return `(line_number, text)` for definitions/headings; empty if the type is unknown."""
    pattern = _PATTERNS.get(suffix.lower())
    if pattern is None:
        return []
    found: list[tuple[int, str]] = []
    for i, text in enumerate(lines):
        if pattern.match(text):
            found.append((i + 1, text.rstrip()[:140]))
            if len(found) >= limit:
                break
    return found


def enclosing(lines: list[str], line: int, suffix: str) -> tuple[int, str] | None:
    """The nearest definition above `line` (1-based) that encloses it, e.g. the `def` around a statement."""
    pattern = _PATTERNS.get(suffix.lower())
    if pattern is None or not 1 <= line <= len(lines):
        return None
    target = lines[line - 1]
    indent = len(target) - len(target.lstrip())
    is_heading = pattern is _MD
    for n in range(line - 1, 0, -1):  # n is 1-based line number of lines[n - 1]
        text = lines[n - 1]
        if not pattern.match(text):
            continue
        if is_heading or len(text) - len(text.lstrip()) < indent or (n == line):
            return n, text.strip()[:100]
    return None
