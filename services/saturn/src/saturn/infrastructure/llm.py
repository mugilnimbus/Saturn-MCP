"""Model gateway: LangChain `ChatOpenAI` on the OpenAI Responses API, pointed at a local model server.

Provider address and model come from the live settings on every call. With no model selected, every call
fails fast with model_unavailable and callers fall back to code-only results.

Why a forced tool call instead of `text.format` structured output: the local server's
`/v1/responses` does not enforce `text.format`, and it rejects a named
`tool_choice`. Saturn requests `tool_choice="required"` and validates the returned
tool arguments with Pydantic. Compatible servers can ignore the tool choice.
Missing or invalid tool calls receive one correction attempt, then fail explicitly.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Mapping, Sequence
from typing import Any

import openai
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ValidationError

from saturn.application.ports import T
from saturn.application.recorder import current_run
from saturn.application.tunables import Tunables
from saturn.domain.errors import ModelOutputInvalid, ModelUnavailable
from saturn.domain.internal_timing import interval, timed
from saturn.domain.redaction import redact
from saturn.infrastructure.config import Settings
from saturn.infrastructure.model_lifecycle import ModelLifecycle
from saturn.infrastructure.tracing import TelemetryCallbackHandler


class ResponsesGateway:
    def __init__(self, settings: Settings, tunables: Tunables, handler: TelemetryCallbackHandler,
                 lifecycle: ModelLifecycle | None = None) -> None:
        self._settings = settings
        self._tunables = tunables
        self._handler = handler
        self._lifecycle = lifecycle
        self._gate = asyncio.Semaphore(settings.llm_concurrency)
        self._clients: dict[tuple[str, str, str, int], ChatOpenAI] = {}
        self._down_until = 0.0  # circuit breaker: skip calls briefly after the server failed

    @property
    def model_name(self) -> str:
        return self._tunables.model

    def graph_config(self, purpose: str = "") -> dict[str, Any]:
        run = current_run()
        metadata: dict[str, Any] = {"saturn_purpose": purpose}
        if run is not None:
            metadata["saturn_run_id"] = run.run_id
        return {"callbacks": [self._handler], "metadata": metadata}

    def _client(self, max_output_tokens: int) -> ChatOpenAI:
        key = (self._tunables.base_url, self._tunables.model, self._tunables.reasoning_effort, max_output_tokens)
        client = self._clients.get(key)
        if client is None:
            kwargs: dict[str, Any] = {}
            if self._tunables.reasoning_effort:
                kwargs["reasoning"] = {"effort": self._tunables.reasoning_effort}
            client = ChatOpenAI(
                model=self._tunables.model,
                base_url=self._tunables.base_url,
                api_key=self._settings.local_server_api_key,
                use_responses_api=True,
                temperature=0,
                store=False,
                max_completion_tokens=max_output_tokens,
                timeout=self._settings.llm_timeout_s,
                max_retries=0,
                **kwargs,
            )
            self._clients[key] = client
        return client

    async def call(
        self,
        tools: Sequence[type[T]],
        *,
        system: str,
        user: str,
        purpose: str,
        max_output_tokens: int = 400,
    ) -> T:
        system, user = redact(system, self._settings.secrets)[0], redact(user, self._settings.secrets)[0]
        by_name = {tool.__name__: tool for tool in tools}
        bound = self._client(max_output_tokens).bind_tools(list(tools), tool_choice="required")
        problem = ""
        for _attempt in range(2):
            prompt = user if not problem else f"{user}\n\nYour previous reply was rejected ({problem}). Call exactly one tool with valid arguments."
            message = await self._invoke(bound, [SystemMessage(system), HumanMessage(prompt)], purpose)
            parsed, problem = self._parse(message, by_name)
            if parsed is not None:
                return parsed  # type: ignore[no-any-return]
        raise ModelOutputInvalid(f"The model did not return a valid tool call for '{purpose}': {problem}")

    async def _invoke(self, bound: Any, messages: list[Any], purpose: str) -> AIMessage:
        model = self._tunables.model
        if not model:
            raise ModelUnavailable("No worker model is selected. Choose one with `saturn setup`, in the dashboard's Settings, "
                                   "or with `saturn settings set model <id>`.")
        if time.monotonic() < self._down_until:
            raise ModelUnavailable("The model server failed a moment ago; Saturn is not retrying yet.")
        with interval("model_slot", "wait"):
            await self._gate.acquire()
        try:
            if self._lifecycle is not None:
                await self._lifecycle.before_call(model)
            try:
                with interval("provider", "backend"):
                    reply: AIMessage = await bound.ainvoke(messages, config=self.graph_config(purpose))
                return reply
            except openai.AuthenticationError as exc:
                self._trip(30)
                raise ModelUnavailable("The model server rejected the API key (LOCAL_SERVER_API_KEY in the Saturn home .env).") from exc
            except openai.APITimeoutError as exc:
                self._trip(10)
                raise ModelUnavailable(f"The model did not answer within {self._settings.llm_timeout_s:.0f}s.") from exc
            except openai.APIConnectionError as exc:
                self._trip(10)
                raise ModelUnavailable(f"Could not reach the model server at {self._tunables.base_url}.") from exc
            except openai.APIStatusError as exc:
                detail = getattr(exc, "message", "") or ""
                raise ModelUnavailable(f"The model server returned HTTP {exc.status_code}: {detail[:200]}") from exc
            finally:
                if self._lifecycle is not None:
                    self._lifecycle.after_call(model)

        finally:
            self._gate.release()

    def reset(self) -> None:
        """Forget a recent failure, for an explicit test after the owner changed something."""
        self._down_until = 0.0

    def _trip(self, seconds: float) -> None:
        self._down_until = time.monotonic() + seconds

    @staticmethod
    @timed("model_parse")
    def _parse(message: AIMessage, by_name: Mapping[str, type[BaseModel]]) -> tuple[Any, str]:
        calls = getattr(message, "tool_calls", None) or []
        if not calls:
            return None, "no tool was called"
        call = calls[0]
        schema = by_name.get(call["name"])
        if schema is None:
            return None, f"unknown tool '{call['name']}'"
        try:
            return schema.model_validate(call["args"]), ""
        except ValidationError as exc:
            first = exc.errors()[0]
            return None, f"invalid '{'.'.join(str(p) for p in first['loc'])}': {first['msg']}"
