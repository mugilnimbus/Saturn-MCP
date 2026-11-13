"""Deterministic digest of command output.

This is the first line of defence against long output: format-aware extraction
with no model involved. A model is only asked for help when `confidence` is low
or the caller supplied a goal that code cannot answer.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass

from saturn.domain.text_ops import clip, template_of
from saturn.domain.tokens import estimate_tokens

_ERROR = re.compile(
    r"(?i)\b(error|errors|fatal|exception|traceback|failed|failure|failures|panic|assertion|"
    r"segmentation fault|denied|refused|timed out|timeout|unhandled|cannot|can't|could not|"
    r"undefined|not found|abort(?:ed)?)\b|^E\s{2,}\S"
)
_WARN = re.compile(r"(?i)\bwarn(?:ing)?s?\b|\bdeprecat")
_ZERO = re.compile(r"(?i)\b0\s+(errors?|failed|failures?|warnings?)\b|\bno\s+(errors?|failures?)\b")
_SUMMARY = re.compile(
    r"(?i)(\b\d+\s+(failed|passed|errors?|warnings?|skipped|tests?|problems?)\b.*"
    r"|^\s*tests?:\s+.*|test result:.*|^ran \d+ tests?.*|build (succeeded|failed).*"
    r"|found \d+ errors?.*|error: could not compile.*|finished in .*|^summary.*)"
)
_PYTEST_FAIL = re.compile(r"^(FAILED|ERROR)\s+(\S+)(?:\s+-\s+(.*))?$")
_PYTEST_HEAD = re.compile(r"^_{3,}\s+(.+?)\s+_{3,}$")
_DIAG = re.compile(
    r"^(?P<loc>(?:[A-Za-z]:)?[^\s:()]+(?::\d+(?::\d+)?|\(\d+(?:,\d+)?\))):?\s*(?P<rest>.*)$"
)
_DIAG_REST = re.compile(r"(?i)\b(error|warning)\b|\b[A-Z]{1,4}\d{2,5}\b")
_CODED = re.compile(r"^(?P<code>[A-Z]{1,4}\d{2,4})\s+(?:\[\*\]\s+)?(?P<msg>\S.*)$")
_ARROW = re.compile(r"^\s*-->\s*(\S+)")
_FRAME = re.compile(r'^\s*File "(?P<file>.+?)", line (?P<line>\d+), in (?P<fn>.+)$')
_LEVEL = re.compile(r"(?i)\b(trace|debug|info|warn(?:ing)?|error|fatal|critical)\b")
_DIFF_FILE = re.compile(r"^diff --git a/(\S+) b/(\S+)")

SEVERITY_ORDER = {"error": 0, "warn": 1, "info": 2}


@dataclass(frozen=True)
class Finding:
    line: int
    text: str
    count: int = 1
    last_line: int = 0
    severity: str = "error"


@dataclass(frozen=True)
class Digest:
    kind: str
    headline: str
    findings: tuple[Finding, ...]
    tail: tuple[tuple[int, str], ...]
    lines: int
    chars: int
    tokens_est: int
    confidence: float
    omitted_findings: int = 0


def _last_summary(lines: list[str]) -> str | None:
    for text in reversed(lines[-80:]):
        stripped = text.strip().strip("=").strip()
        if stripped and _SUMMARY.search(stripped) and not _ZERO.search(stripped):
            return clip(stripped, 200)
    # A zero-failure summary line is still a summary.
    for text in reversed(lines[-80:]):
        stripped = text.strip().strip("=").strip()
        if stripped and _SUMMARY.search(stripped):
            return clip(stripped, 200)
    return None


def _rank(findings: list[Finding], limit: int) -> tuple[tuple[Finding, ...], int]:
    ordered = sorted(findings, key=lambda f: (SEVERITY_ORDER.get(f.severity, 3), -f.count, f.line))
    return tuple(ordered[:limit]), max(0, len(ordered) - limit)


def _clusters(lines: list[str], indexes: list[int], severity: str) -> list[Finding]:
    groups: dict[str, list[int]] = {}
    for i in indexes:
        groups.setdefault(template_of(lines[i]), []).append(i)
    return [
        Finding(line=idx[0] + 1, text=clip(lines[idx[0]].strip()), count=len(idx), last_line=idx[-1] + 1, severity=severity)
        for idx in groups.values()
    ]


def _coded_findings(lines: list[str]) -> list[Finding]:
    """Linters that print `CODE message` and the location on a following `--> path:line:col` line (ruff)."""
    groups: dict[str, list[tuple[int, str, str]]] = {}
    for i, text in enumerate(lines):
        m = _CODED.match(text)
        if not m:
            continue
        location = next((loc.group(1) for ln in lines[i + 1 : i + 4] if (loc := _ARROW.match(ln))), "")
        groups.setdefault(m["code"], []).append((i + 1, m["msg"], location))
    return [
        Finding(v[0][0], f"{code} {clip(v[0][1], 110)}" + (f"  (first at {v[0][2]})" if v[0][2] else ""), len(v), v[-1][0])
        for code, v in groups.items()
    ]


def _pytest_findings(lines: list[str]) -> list[Finding]:
    # One entry per test function and reason: parametrized cases that fail the same way collapse together.
    groups: dict[tuple[str, str, str], list[tuple[int, str, str]]] = {}
    for i, text in enumerate(lines):
        m = _PYTEST_FAIL.match(text.strip())
        if m:
            base, _, param = m.group(2).partition("[")
            reason = m.group(3) or ""
            groups.setdefault((m.group(1), base, template_of(reason)), []).append((i + 1, param.rstrip("]"), reason))
    found: list[Finding] = []
    for (kind, base, _), members in groups.items():
        params = [p for _, p, _ in members if p]
        shown = ", ".join(params[:6]) + (", …" if len(params) > 6 else "")
        reason = f" - {clip(members[0][2], 140)}" if members[0][2] else ""
        found.append(Finding(members[0][0], f"{kind} {base}{f'[{shown}]' if shown else ''}{reason}", len(members), members[-1][0]))
    if found:
        return found
    # `-q`/no short summary: use the failure section headers and their first E line.
    for i, text in enumerate(lines):
        head = _PYTEST_HEAD.match(text.strip())
        if not head:
            continue
        reason = next((ln.strip() for ln in lines[i + 1 : i + 60] if ln.startswith("E ")), "")
        found.append(Finding(i + 1, f"FAILED {head.group(1)}" + (f" - {clip(reason, 140)}" if reason else ""), 1, i + 1))
    return found


def _traceback_findings(lines: list[str]) -> list[Finding]:
    groups: dict[str, list[tuple[int, str]]] = {}
    i = 0
    while i < len(lines):
        if not lines[i].startswith("Traceback (most recent call last)"):
            i += 1
            continue
        start, frame = i, ""
        j = i + 1
        while j < len(lines) and (lines[j].startswith((" ", "\t")) or not lines[j].strip()):
            match = _FRAME.match(lines[j])
            if match:
                frame = f"{match['file']}:{match['line']} in {match['fn']}"
            j += 1
        exc = clip(lines[j].strip()) if j < len(lines) else "(traceback cut off)"
        text = f"{exc}  @ {frame}" if frame else exc
        groups.setdefault(template_of(exc), []).append((start + 1, text))
        i = j + 1
    return [Finding(v[0][0], v[0][1], len(v), v[-1][0], "error") for v in groups.values()]


def _diagnostic_findings(lines: list[str]) -> tuple[list[Finding], int]:
    groups: dict[str, list[tuple[int, str, str]]] = {}
    total = 0
    for i, text in enumerate(lines):
        m = _DIAG.match(text.strip())
        if not m or not _DIAG_REST.search(m["rest"]):
            continue
        total += 1
        severity = "warn" if re.search(r"(?i)\bwarning\b", m["rest"]) else "error"
        groups.setdefault(template_of(m["rest"]), []).append((i + 1, f"{m['loc']} {clip(m['rest'], 160)}", severity))
    findings = [Finding(v[0][0], v[0][1], len(v), v[-1][0], v[0][2]) for v in groups.values()]
    return findings, total


def _diff_digest(lines: list[str]) -> tuple[str, list[Finding]]:
    files: dict[str, list[int]] = {}
    current: str | None = None
    first_line: dict[str, int] = {}
    for i, text in enumerate(lines):
        m = _DIFF_FILE.match(text)
        if m:
            current = m.group(2)
            files[current] = [0, 0]
            first_line[current] = i + 1
        elif current and text.startswith("+") and not text.startswith("+++"):
            files[current][0] += 1
        elif current and text.startswith("-") and not text.startswith("---"):
            files[current][1] += 1
    added = sum(v[0] for v in files.values())
    removed = sum(v[1] for v in files.values())
    findings = [
        Finding(first_line[p], f"{p}  +{a} −{d}", 1, first_line[p], "info")
        for p, (a, d) in sorted(files.items(), key=lambda kv: -(kv[1][0] + kv[1][1]))
    ]
    return f"diff: {len(files)} files changed, +{added} −{removed}", findings


def _json_digest(text: str) -> str | None:
    stripped = text.strip()
    if not stripped or stripped[0] not in "[{" or len(stripped) > 5_000_000:
        return None
    try:
        data = json.loads(stripped)
    except ValueError:
        return None
    if isinstance(data, list):
        kinds = Counter(type(x).__name__ for x in data[:200])
        return f"JSON array of {len(data)} items ({', '.join(f'{k}×{v}' for k, v in kinds.items())})"
    if isinstance(data, dict):
        parts = []
        for key, value in list(data.items())[:12]:
            size = f"[{len(value)}]" if isinstance(value, (list, dict)) else ""
            parts.append(f"{key}:{type(value).__name__}{size}")
        more = f", +{len(data) - 12} more keys" if len(data) > 12 else ""
        return "JSON object: " + ", ".join(parts) + more
    return None


def _detect_kind(text: str, lines: list[str]) -> str:
    head = "\n".join(lines[:40])
    if "test session starts" in head or any(_PYTEST_FAIL.match(x.strip()) for x in lines[-200:]):
        return "pytest"
    if lines and (lines[0].startswith("diff --git") or any(x.startswith("diff --git") for x in lines[:5])):
        return "diff"
    if any(x.startswith("Traceback (most recent call last)") for x in lines):
        return "traceback"
    sample = lines[:3000]
    if sum(1 for x in sample if _CODED.match(x)) >= 3 and any(_ARROW.match(x) for x in sample):
        return "lint"
    hits = sum(1 for x in sample if (m := _DIAG.match(x.strip())) and _DIAG_REST.search(m["rest"]))
    if hits >= 3 and hits >= len(sample) * 0.02:
        return "diagnostics"
    if _json_digest(text) is not None:
        return "json"
    levelled = sum(1 for x in sample if _LEVEL.search(x))
    if sample and levelled / len(sample) >= 0.3:
        return "log"
    return "generic"


def build_digest(text: str, *, exit_code: int | None = None, max_findings: int = 10) -> Digest:
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    kind = _detect_kind(text, lines)
    summary = _last_summary(lines)
    findings: list[Finding] = []
    headline = ""
    confidence = 0.2

    if kind == "pytest":
        findings = _pytest_findings(lines)
        headline = summary or f"pytest: {len(findings)} failing"
        confidence = 0.95
    elif kind == "diff":
        headline, findings = _diff_digest(lines)
        confidence = 0.9
    elif kind == "traceback":
        findings = _traceback_findings(lines)
        headline = f"{sum(f.count for f in findings)} traceback(s), {len(findings)} distinct"
        confidence = 0.85
    elif kind == "lint":
        findings = _coded_findings(lines)
        headline = summary or f"{sum(f.count for f in findings)} findings across {len(findings)} rules"
        confidence = 0.9
    elif kind == "diagnostics":
        findings, total = _diagnostic_findings(lines)
        headline = summary or f"{total} diagnostics across {len(findings)} distinct messages"
        confidence = 0.9
    elif kind == "json":
        headline = _json_digest(text) or "JSON"
        confidence = 0.7
    else:
        errors = [i for i, x in enumerate(lines) if _ERROR.search(x) and not _ZERO.search(x)]
        warns = [i for i, x in enumerate(lines) if _WARN.search(x) and i not in set(errors)]
        findings = _clusters(lines, errors, "error") + _clusters(lines, warns, "warn")
        headline = summary or (
            f"{len(errors)} error-like and {len(warns)} warning-like lines in {len(lines)} lines"
            if (errors or warns)
            else f"{len(lines)} lines, no error-like lines found"
        )
        confidence = 0.75 if summary else (0.6 if errors else (0.5 if kind == "log" else 0.2))
        if kind == "log":
            levels = Counter(m.group(1).lower() for x in lines if (m := _LEVEL.search(x)))
            headline += "  [" + ", ".join(f"{k}:{v}" for k, v in levels.most_common(5)) + "]"

    # A finding that only repeats the headline adds nothing.
    findings = [f for f in findings if f.text.strip("= ").strip() != headline.strip()]
    ranked, omitted = _rank(findings, max_findings)
    shown = {f.line for f in ranked}
    # The last lines matter when no summary line was recognised; otherwise the headline already is the tail.
    tail = () if summary else tuple(
        (len(lines) - k + 1, clip(lines[-k].strip()))
        for k in range(min(3, len(lines)), 0, -1)
        if lines[-k].strip() and (len(lines) - k + 1) not in shown
    )
    if exit_code not in (None, 0) and kind != "pytest" and not ranked:
        confidence = min(confidence, 0.3)
    return Digest(
        kind=kind,
        headline=headline,
        findings=ranked,
        tail=tail,
        lines=len(lines),
        chars=len(text),
        tokens_est=estimate_tokens(text),
        confidence=confidence,
        omitted_findings=omitted,
    )


def render_digest(digest: Digest, *, max_tokens: int) -> str:
    """Render a digest to text that fits `max_tokens`, dropping findings from the end first."""
    def build(count: int) -> str:
        out = [digest.headline]
        for f in digest.findings[:count]:
            span = f"L{f.line}" if f.last_line in (0, f.line) else f"L{f.line}–{f.last_line}"
            times = f" ×{f.count}" if f.count > 1 else ""
            out.append(f"- {span}{times} {f.text}")
        hidden = digest.omitted_findings + (len(digest.findings) - count)
        if hidden:
            out.append(f"- … {hidden} more distinct finding(s)")
        if digest.tail:
            out.append("tail:")
            out.extend(f"  {n}: {t}" for n, t in digest.tail)
        return "\n".join(out)

    count = len(digest.findings)
    text = build(count)
    while count > 1 and estimate_tokens(text) > max_tokens:
        count -= 1
        text = build(count)
    return text
