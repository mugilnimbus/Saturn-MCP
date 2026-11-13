"""Structured error types shared by every layer. Each carries a stable, safe code."""

from __future__ import annotations


class SaturnError(Exception):
    """Base class. `code` is stable and safe to show to clients."""

    code = "internal_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidInput(SaturnError):
    code = "invalid_input"


class PolicyViolation(SaturnError):
    """A request was refused by the command or path policy."""

    code = "policy_violation"


class NotFound(SaturnError):
    code = "not_found"


class ModelUnavailable(SaturnError):
    """The language model endpoint could not be reached or timed out."""

    code = "model_unavailable"


class ModelOutputInvalid(SaturnError):
    """The model answered, but not in the shape the caller required."""

    code = "model_output_invalid"
