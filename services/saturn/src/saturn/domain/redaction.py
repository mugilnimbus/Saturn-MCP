"""Secret redaction applied before text is stored, traced, or sent to a model."""

from __future__ import annotations

import re
from collections.abc import Iterable

from saturn.domain.internal_timing import timed

_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r'\bstn_[A-Za-z0-9_-]{43}\b'), '[REDACTED:saturn-token]'),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S), "[REDACTED:private-key]"),
    (re.compile(r"(?i)\b(bearer)\s+[A-Za-z0-9._~+/=-]{16,}"), r"\1 [REDACTED]"),
    (re.compile(r"\b(sk|pk|rk)-[A-Za-z0-9_-]{16,}"), "[REDACTED:key]"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "[REDACTED:aws-key]"),
    (re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"), "[REDACTED:github-token]"),
    (re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}"), "[REDACTED:slack-token]"),
    (
        re.compile(
            r"(?i)\b([A-Za-z0-9_.-]*(?:password|passwd|secret|token|api[_-]?key|access[_-]?key)[A-Za-z0-9_.-]*)"
            r"(\s*[=:]\s*)(['\"]?)[^\s'\"]{6,}\3"
        ),
        r"\1\2[REDACTED]",
    ),
)


@timed('redaction')
def redact(text: str, extra_secrets: Iterable[str] = ()) -> tuple[str, int]:
    """Return `text` with secrets replaced, and how many replacements were made."""
    count = 0
    for secret in extra_secrets:
        if secret and len(secret) >= 8 and secret in text:
            count += text.count(secret)
            text = text.replace(secret, "[REDACTED]" + "\n" * secret.count("\n"))
    for pattern, replacement in _PATTERNS:
        # Keep source line positions stable, including a multiline private key.
        def replace_match(match: re.Match[str], value: str = replacement) -> str:
            return match.expand(value) + "\n" * match.group().count("\n")
        text, n = pattern.subn(replace_match, text)
        count += n
    return text, count


def redact_lines(lines: list[str], extra_secrets: Iterable[str] = ()) -> list[str]:
    return redact("\n".join(lines), extra_secrets)[0].split("\n")
