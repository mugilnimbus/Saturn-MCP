"""saturn_run: execute an approved command and return only what the caller needs."""

from __future__ import annotations

from collections.abc import Callable

from saturn.application.digest_service import DigestService
from saturn.application.ports import ArtifactStore, CommandRunner
from saturn.application.recorder import ANONYMOUS, Caller, Recorder
from saturn.application.tunables import Tunables
from saturn.domain.errors import InvalidInput
from saturn.domain.policy import PathPolicy, Policy, Rule, check, split_command
from saturn.domain.redaction import redact
from saturn.domain.text_ops import strip_ansi
from saturn.domain.tokens import estimate_tokens, truncate_to_tokens


class CommandService:
    def __init__(self, *, recorder: Recorder, runner: CommandRunner, artifacts: ArtifactStore, digests: DigestService,
                 policy: Callable[[], Policy], path_policy: PathPolicy, tunables: Tunables, secrets: tuple[str, ...]) -> None:
        self._recorder = recorder
        self._runner = runner
        self._artifacts = artifacts
        self._digests = digests
        self._policy = policy
        self._paths = path_policy
        self._tunables = tunables
        self._secrets = secrets

    @property
    def runner(self) -> CommandRunner:
        return self._runner

    async def run(self, command: str, *, cwd: str | None, goal: str | None, caller: Caller = ANONYMOUS) -> str:
        async with self._recorder.run("saturn_run", caller=caller, summary=command) as run:
            argv = split_command(command)
            workdir = self._paths.resolve(cwd)
            if not workdir.is_dir():
                raise InvalidInput(f"'{cwd}' is not a directory.")
            harness_deny = tuple(Rule.parse(p, f"harness {caller.harness.handle}") for p in caller.harness.deny) if caller.harness else ()
            with self._recorder.span("policy", "step", command=command, cwd=str(workdir)) as span:
                try:
                    decision = check(self._policy(), argv, workdir=workdir, paths=self._paths, harness_deny=harness_deny)
                except Exception as exc:
                    span.set(allowed=False, reason=getattr(exc, "message", str(exc)))
                    run.set(decision="refused")
                    raise
                span.set(allowed=True, rule=decision.rule, source=decision.source)
                run.set(decision=decision.rule)

            timeout = float(self._tunables.command_timeout_s)
            with self._recorder.span("command", "command", argv0=argv[0], cwd=str(workdir)) as span:
                result = await self._runner.run(argv, workdir, timeout)
                span.set(exit_code=result.exit_code, duration_s=round(result.duration_s, 2), timed_out=result.timed_out,
                         bytes=len(result.output))

            output, redactions = redact(strip_ansi(result.output), self._secrets)
            raw_tokens = estimate_tokens(output)
            status = (
                f"timed out after {timeout:.0f}s and was stopped" if result.timed_out
                else f"exit {result.exit_code}"
            ) + f" · {result.duration_s:.1f}s"
            if result.output_truncated:
                status += " · output cut at the size limit"
            run.set(raw_tokens=raw_tokens, exit_code=result.exit_code, redactions=redactions)

            inline = f"[{status}]\n{output.rstrip()}" if output.strip() else f"[{status}] (no output)"
            if estimate_tokens(inline) <= self._tunables.inline_token_limit:
                text = inline
                run.set(route="inline", returned_tokens=estimate_tokens(text))
                return text

            meta = self._artifacts.put(run.run_id, "command", command, output)
            outcome = await self._digests.digest(output, exit_code=result.exit_code, goal=goal)
            text = (
                f"[{status} · {meta.lines:,} lines ≈{meta.tokens_est:,} tokens kept out of context → {meta.id}]\n"
                f"{outcome.text}\n"
                f"More: saturn_query(artifact_id=\"{meta.id}\", pattern=… | lines=\"a-b\" | question=…)"
            )
            text = truncate_to_tokens(redact(text, self._secrets)[0], self._tunables.inline_token_limit)
            run.set(route=outcome.route, artifact_id=meta.id, returned_tokens=estimate_tokens(text))
            return text
