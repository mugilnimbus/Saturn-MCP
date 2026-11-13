"""One small, constrained call that shows whether the configured worker model can be used.

It is recorded as a `model_check` run, so the test and its model call appear in the trace like any other work.
"""

from __future__ import annotations

import time

from pydantic import BaseModel, Field

from saturn.application.ports import ModelGateway
from saturn.application.recorder import Caller, Recorder
from saturn.domain.errors import SaturnError


class Echo(BaseModel):
    """Repeat the requested word."""

    word: str = Field(description="The word you were asked to repeat.")


async def check_model(gateway: ModelGateway, recorder: Recorder, *, client: str) -> dict[str, object]:
    """Ask the model to call a tool. A model that answers in prose cannot be Saturn's worker."""
    started = time.monotonic()
    result: dict[str, object]
    async with recorder.run("model_check", caller=Caller(client=client), summary=f"test {gateway.model_name or '(none)'}") as run:
        try:
            reply = await gateway.call([Echo], system="You answer only by calling the given tool.",
                                       user="Call the tool with the word 'saturn'.", purpose="model_check", max_output_tokens=60)
        except SaturnError as exc:
            result = {"ok": False, "detail": exc.message}
        else:
            if reply.word.strip().lower().strip(".'\"") == "saturn":
                result = {"ok": True, "detail": "The model answered with a valid tool call."}
            else:
                result = {"ok": False, "detail": f"The model called the tool but answered {reply.word[:40]!r}."}
        run.set(route="model_check", status="ok" if result["ok"] else "error",
                error=None if result["ok"] else str(result["detail"]))
    return {**result, "ms": round((time.monotonic() - started) * 1000)}
