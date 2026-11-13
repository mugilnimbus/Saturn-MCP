"""Fixed operating limits the use cases need. Built once from settings at the composition root."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Limits:
    # Below this digest confidence, a model is asked to read the output.
    llm_digest_threshold: float = 0.5
    map_chunk_tokens: int = 1800
    map_max_chunks: int = 10
    ask_max_steps: int = 6
    ask_answer_tokens: int = 450
