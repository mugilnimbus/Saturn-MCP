"""Token estimation for text that never went through a model.

Real token counts come from the model's own usage report. This estimate is only
used to size raw tool output and the text Saturn returns, so the dashboard can
show how much context was kept out of the calling agent. It is deliberately
simple and is always labelled as an estimate.
"""

from __future__ import annotations

import math

from saturn.domain.internal_timing import timed

CHARS_PER_TOKEN = 3.6


@timed('tokens')
def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, math.ceil(len(text) / CHARS_PER_TOKEN))


@timed('response')
def truncate_to_tokens(text: str, max_tokens: int, marker: str = "\n… [truncated]") -> str:
    """Cut `text` so its estimate fits `max_tokens`, preferring a line boundary."""
    if estimate_tokens(text) <= max_tokens:
        return text
    budget = max(0, int(max_tokens * CHARS_PER_TOKEN) - len(marker))
    cut = text[:budget]
    newline = cut.rfind("\n")
    if newline > budget * 0.6:
        cut = cut[:newline]
    return cut + marker
