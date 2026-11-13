"""Hooks for an agent's own shell tool: redirect a noisy command before it runs, or shrink its output after.

Nothing is executed here. Before a command runs, Saturn may tell the agent to use `saturn_run` instead.
After a command has run, the agent's harness hands over output that already exists; Saturn stores it and
answers with a digest, or declines and leaves the output as it was. Both outcomes that change what the
agent sees are recorded as `saturn_hook` runs, so they can be traced like any other call.
"""

from __future__ import annotations

from collections.abc import Callable

from saturn.application.digest_service import DigestService
from saturn.application.ports import ArtifactStore
from saturn.application.recorder import ANONYMOUS, Caller, Recorder
from saturn.application.tunables import Tunables
from saturn.domain.hook_policy import is_marked_direct, is_noisy_command, is_single_command
from saturn.domain.policy import PathPolicy, Policy, Rule, decide, split_command
from saturn.domain.redaction import redact
from saturn.domain.text_ops import strip_ansi
from saturn.domain.tokens import estimate_tokens, truncate_to_tokens


class HookService:
    def __init__(self, *, recorder: Recorder, artifacts: ArtifactStore, digests: DigestService, tunables: Tunables,
                 policy: Callable[[], Policy], path_policy: PathPolicy, secrets: tuple[str, ...]) -> None:
        self._policy = policy
        self._paths = path_policy
        self._recorder = recorder
        self._artifacts = artifacts
        self._digests = digests
        self._tunables = tunables
        self._secrets = secrets

    async def redirect(self, *, command: str, cwd: str | None, shell: str = "Bash", caller: Caller = ANONYMOUS) -> str | None:
        """Return the reason to decline a shell command in favour of `saturn_run`, or None to let it run.

        A failing command's output cannot be replaced after the fact, so the only way to keep a failing
        test run small is to have Saturn run it. This declines only what `saturn_run` would accept as is:
        one plain test, build, or lint command, in a folder Saturn may use.

        One token can serve several sessions, and one of them may lack Saturn's tools. The message therefore
        says how to run the command directly: with a variable set in front, it is no longer a plain command.
        """
        policy = self._policy()
        if policy.hook_scope == "off" or not is_single_command(command) or not is_noisy_command(command):
            return None
        try:
            argv = split_command(command)
            folder = self._paths.resolve(cwd)
        except Exception:  # noqa: BLE001 - anything Saturn could not run itself is left to the shell
            return None
        harness_deny = tuple(Rule.parse(p, "harness") for p in caller.harness.deny) if caller.harness else ()
        decision = decide(policy, argv, workdir=folder, paths=self._paths, harness_deny=harness_deny)
        if not decision.allowed or not folder.is_dir():
            return None
        direct = f"$env:SATURN_DIRECT=1; {command}" if shell == "PowerShell" else f"SATURN_DIRECT=1 {command}"
        async with self._recorder.run("saturn_hook", caller=caller, summary=command) as run:
            run.set(route="redirect", decision=decision.rule)
        return (
            "Saturn runs this command for you and returns a short digest instead of the full output, including when it fails. "
            f"Call the saturn_run tool (mcp__saturn__saturn_run) with command={command!r} and cwd={str(folder)!r}. "
            f"If that tool is not available in this session, run it yourself as: {direct}"
        )

    async def shell_output(self, *, command: str, stdout: str, stderr: str, caller: Caller = ANONYMOUS) -> str | None:
        """Return the text to show instead of the output, or None to leave the output untouched."""
        scope = self._policy().hook_scope
        if scope == "off" or is_marked_direct(command):
            return None
        if scope == "noisy" and not is_noisy_command(command):
            return None
        combined = stdout if not stderr.strip() else f"{stdout.rstrip()}\n{stderr}"
        output, redactions = redact(strip_ansi(combined), self._secrets)
        raw_tokens = estimate_tokens(output)
        if raw_tokens <= self._tunables.inline_token_limit:
            return None

        async with self._recorder.run("saturn_hook", caller=caller, summary=command) as run:
            meta = self._artifacts.put(run.run_id, "hook", command, output)
            outcome = await self._digests.digest(output, exit_code=None, goal=None)
            text = (
                f"[Saturn digest of this command's output · {meta.lines:,} lines ≈{meta.tokens_est:,} tokens kept out of context "
                f"→ {meta.id}]\n{outcome.text}\n"
                f"Full output: saturn_query(artifact_id=\"{meta.id}\", pattern=… | lines=\"a-b\" | question=…)"
            )
            text = truncate_to_tokens(redact(text, self._secrets)[0], self._tunables.inline_token_limit)
            returned = estimate_tokens(text)
            run.set(raw_tokens=raw_tokens, artifact_id=meta.id, redactions=redactions)
            if returned >= raw_tokens:  # a digest that is not shorter helps nobody
                run.set(route="inline", returned_tokens=raw_tokens)
                return None
            run.set(route=outcome.route, returned_tokens=returned)
            return text
