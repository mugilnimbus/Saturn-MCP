import pytest
from conftest import FakeGateway, FakeRunner
from pydantic import BaseModel

from saturn.application.graphs.agent_graph import Finish, Grep, ReadLines
from saturn.application.graphs.digest_graph import Fact, ReportFacts
from saturn.application.graphs.support import ReviewClaims, Verdict
from saturn.application.recorder import Caller
from saturn.domain.errors import InvalidInput, ModelUnavailable, NotFound, PolicyViolation
from saturn.domain.redaction import redact_lines
from saturn.domain.tokens import estimate_tokens

PYTEST_OUT = "\n".join(
    ["============ test session starts ============"]
    + [f"tests/test_a.py::test_{i} PASSED" for i in range(400)]
    + ["short test summary info", "FAILED tests/test_a.py::test_bad - AssertionError: 7 != 6", "======= 1 failed, 400 passed in 1.0s ======="]
)
QUIET_OUT = "\n".join(f"step {i} finished ok" for i in range(600)) + "\nL600 reached an unusual state: queue is stuck\n"


def last_run(c):
    return c.telemetry.list_runs(limit=1)[0]


# ---- saturn_run --------------------------------------------------------------------------------


async def test_small_output_is_returned_inline(make_container):
    c = make_container(runner=FakeRunner("hello\n"))
    text = await c.commands.run("git status", cwd=None, goal=None, caller=Caller(client="test", workspace="/w"))
    assert text == "[exit 0 · 0.2s]\nhello"
    run = last_run(c)
    assert run["route"] == "inline" and run["status"] == "ok" and run["client"] == "test"
    assert run["decision"] == "preset standard" and run["workspace"] == "/w"


async def test_long_output_becomes_a_digest_without_calling_the_model(make_container):
    gateway = FakeGateway()  # no script: any model call would raise
    c = make_container(gateway=gateway, runner=FakeRunner(PYTEST_OUT, exit_code=1))
    text = await c.commands.run("pytest", cwd=None, goal=None)
    assert "1 failed, 400 passed" in text and "test_bad" in text and "art_" in text
    assert estimate_tokens(text) < estimate_tokens(PYTEST_OUT) / 10
    run = last_run(c)
    assert run["route"] == "digest" and run["raw_tokens"] > 1000 and run["returned_tokens"] < 200
    assert gateway.calls == []
    meta = c.artifacts.get_meta(run["artifact_id"])
    assert meta.lines == 404 and "test_399" in c.artifacts.get_text(meta.id)


async def test_low_confidence_output_uses_model_and_drops_unverifiable_facts(make_container):
    def script(tools, system, user, purpose):
        if tools == [ReviewClaims]:
            return ReviewClaims(verdicts=[Verdict(candidate=0, supported=True, evidence_indexes=[0])])
        assert "L601" in user  # the unusual line survived condensation
        return ReportFacts(facts=[Fact(line=601, claim="queue is stuck"), Fact(line=99999, claim="invented")])

    c = make_container(gateway=FakeGateway(script), runner=FakeRunner(QUIET_OUT))
    text = await c.commands.run("pytest", cwd=None, goal=None)
    assert "queue is stuck" in text and "invented" not in text
    assert last_run(c)["route"] == "digest+llm"


async def test_goal_triggers_the_model_even_for_clear_output(make_container):
    gateway = FakeGateway(lambda *a: ReportFacts(facts=[]))
    c = make_container(gateway=gateway, runner=FakeRunner(PYTEST_OUT, exit_code=1))
    await c.commands.run("pytest", cwd=None, goal="why did test_bad fail")
    assert gateway.calls and gateway.calls[0]["purpose"] == "digest-chunk"


async def test_model_outage_degrades_to_the_code_digest(make_container):
    def down(*_a):
        raise ModelUnavailable("server down")

    c = make_container(gateway=FakeGateway(down), runner=FakeRunner(QUIET_OUT))
    text = await c.commands.run("pytest", cwd=None, goal=None)
    assert "model unavailable" in text
    assert last_run(c)["status"] == "ok"


async def test_policy_violation_is_refused_and_recorded(make_container):
    c = make_container()
    with pytest.raises(PolicyViolation):
        await c.commands.run("rm -rf /", cwd=None, goal=None)
    run = last_run(c)
    assert run["status"] == "error" and "policy_violation" in run["error"]


async def test_cwd_outside_roots_is_refused(make_container):
    with pytest.raises(PolicyViolation):
        await make_container().commands.run("git status", cwd="..", goal=None)


async def test_secrets_are_redacted_before_return_and_storage(make_container):
    secret_line = "token=abcdef1234567890SECRET\n"
    c = make_container(runner=FakeRunner(secret_line + QUIET_OUT), gateway=FakeGateway(lambda *a: ReportFacts(facts=[])))
    text = await c.commands.run("pytest", cwd=None, goal=None)
    run = last_run(c)
    assert "abcdef1234567890SECRET" not in text
    assert "abcdef1234567890SECRET" not in c.artifacts.get_text(run["artifact_id"])
    assert run["redactions"] >= 1


# ---- saturn_read / saturn_search -----------------------------------------------------------------


async def test_read_small_file_returns_numbered_lines(make_container):
    text = await make_container().workspace.read("pkg/calc.py", start=None, end=None)
    assert "6 |     return sum(values) + 1" in text


async def test_read_large_file_returns_outline_then_exact_range(make_container, root):
    (root / "big.py").write_text("\n".join(f"def f{i}():\n    return {i}\n" for i in range(600)), encoding="utf-8")
    c = make_container()
    outline = await c.workspace.read("big.py", start=None, end=None)
    assert "too long to return whole" in outline and "def f0():" in outline
    assert estimate_tokens(outline) < 1500
    rng = await c.workspace.read("big.py", start=4, end=6)
    assert "lines 4-6" in rng and "def f1():" in rng


async def test_read_refuses_secrets_and_outside_paths(make_container):
    c = make_container()
    with pytest.raises(PolicyViolation):
        await c.workspace.read(".env", start=None, end=None)
    with pytest.raises(PolicyViolation):
        await c.workspace.read("../../etc/passwd", start=None, end=None)
    with pytest.raises(InvalidInput):
        await c.workspace.read("pkg", start=None, end=None)


async def test_unexpected_secrets_are_masked_in_reads_search_worker_and_evidence(make_container, root):
    canary = 'synthetic-provider-canary-987654321'
    (root / 'ordinary.txt').write_text(f'first\npassword={canary}\nthird\n', encoding='utf-8')
    gateway = FakeGateway(lambda *_: Finish(answer=f'answer {canary}', evidence=[]))
    c = make_container(gateway=gateway, local_server_api_key=canary)
    read = await c.workspace.read('ordinary.txt', start=1, end=3)
    search = await c.workspace.search('password', path='ordinary.txt', glob=None, context=0, max_matches=40)
    answer = await c.ask.ask(f'explain {canary}', paths=['ordinary.txt'])
    assert canary not in read + search + answer + str(gateway.calls)
    assert '2 | password=[REDACTED]' in read and '3 | third' in read
    marker = 'PRIVATE KEY'
    assert len(redact_lines([f'-----BEGIN {marker}-----', 'abc', f'-----END {marker}-----', 'last'])) == 4


async def test_command_and_hook_metadata_and_replies_are_masked_and_bounded(make_container):
    canary = 'synthetic-command-canary-123456789'
    c = make_container(runner=FakeRunner(PYTEST_OUT), allow=['echo *'])
    text = await c.commands.run(f'echo password={canary}', cwd=None, goal=None)
    assert estimate_tokens(text) <= c.tunables.inline_token_limit
    assert 'art_' in text and canary not in text + str(c.artifacts.list())
    hook = await c.hooks.shell_output(command=f'pytest -q password={canary}', stdout=PYTEST_OUT, stderr='')
    assert hook and estimate_tokens(hook) <= c.tunables.inline_token_limit
    assert canary not in str(c.artifacts.list())


async def test_search_artifact_retains_matches_after_200_and_unclipped_lines(make_container, root):
    tail = 'needle final ' + 'x' * 500
    (root / 'many.txt').write_text('\n'.join(['needle'] * 250 + [tail]), encoding='utf-8')
    c = make_container(inline_token_limit=150)
    text = await c.workspace.search('needle', path='many.txt', glob=None, context=0, max_matches=40)
    meta = c.artifacts.list()[0]
    assert meta.id in text and estimate_tokens(text) <= 150
    assert '251: ' + tail in c.artifacts.get_text(meta.id)


async def test_search_negative_result_discloses_unexamined_files(make_container, root, monkeypatch):
    from saturn.application import workspace_service
    monkeypatch.setattr(workspace_service, 'MAX_SEARCH_FILES', 2)
    for n in range(3):
        (root / f'{n}.txt').write_text('needle' if n == 2 else 'plain', encoding='utf-8')
    text = await make_container().workspace.search('needle', path=None, glob='*.txt', context=0, max_matches=40)
    assert '2 examined' in text and 'Partial search' in text and 'remaining files were not examined' in text


async def test_query_followups_are_linked_and_counted_as_returned_context(make_container):
    c = make_container(runner=FakeRunner(PYTEST_OUT))
    await c.commands.run('pytest -q', cwd=None, goal=None)
    before = c.metrics.overview(3600)['totals']
    meta = c.artifacts.list()[0]
    queried = await c.ask.query(meta.id, pattern=None, lines='1-3', question=None, context=0)
    after = c.metrics.overview(3600)['totals']
    assert after['raw_tokens'] == before['raw_tokens']
    assert after['returned_tokens'] == before['returned_tokens'] + estimate_tokens(queried)
    assert after['followup_tokens'] == estimate_tokens(queried)
    assert c.telemetry.list_runs()[0]['artifact_id'] == meta.id


async def test_line_number_overhead_cannot_turn_small_text_into_a_context_dump(make_container, root):
    (root / 'blank.txt').write_text('\n' * 1000, encoding='utf-8')
    c = make_container(inline_token_limit=100)
    text = await c.workspace.read('blank.txt', start=None, end=None)
    assert estimate_tokens(text) <= 200 and 'too long to return whole' in text


async def test_search_groups_matches_and_never_reads_secret_files(make_container, root):
    (root / "pkg" / "other.py").write_text("sum(x)\nsum(y)\n", encoding="utf-8")
    text = await make_container().workspace.search("sum", path=None, glob="*.py", context=0, max_matches=40)
    assert "3 match(es) in 2 file(s)" in text and "pkg/calc.py (1)" in text
    nothing = await make_container().workspace.search("hunter2", path=None, glob=None, context=0, max_matches=5)
    assert nothing.startswith("No matches")


async def test_search_overflow_is_stored_for_followup(make_container, root):
    for i in range(30):
        (root / "pkg" / f"m{i}.py").write_text("\n".join(f"value = {j}  # needle {i}" for j in range(40)), encoding="utf-8")
    c = make_container(inline_token_limit=300)
    text = await c.workspace.search("needle", path="pkg", glob=None, context=0, max_matches=40)
    assert "stored as art_" in text and estimate_tokens(text) < 600
    assert last_run(c)["artifact_id"]


# ---- saturn_query / saturn_ask -------------------------------------------------------------------


async def test_query_by_pattern_and_by_lines(make_container):
    c = make_container(runner=FakeRunner(PYTEST_OUT, 1))
    await c.commands.run("pytest", cwd=None, goal=None)
    art = last_run(c)["artifact_id"]
    found = await c.ask.query(art, pattern="test_bad", lines=None, question=None, context=0)
    assert "FAILED tests/test_a.py::test_bad" in found
    window = await c.ask.query(art, pattern=None, lines="1-3", question=None, context=0)
    assert "lines 1-3" in window and "test session starts" in window


async def test_query_validates_arguments(make_container):
    c = make_container()
    with pytest.raises(InvalidInput):
        await c.ask.query("art_x", pattern="a", lines="1-2", question=None, context=0)
    with pytest.raises(NotFound):
        await c.ask.query("art_missing", pattern="a", lines=None, question=None, context=0)


def scripted(*steps: BaseModel):
    queue = list(steps)

    def script(tools, system, user, purpose):
        if tools == [ReviewClaims]:
            return next(s for s in queue if isinstance(s, ReviewClaims))
        if [t.__name__ for t in tools] == ["Finish"]:
            return next((s for s in queue if isinstance(s, Finish)), Finish(answer="out of steps", evidence=[]))
        return queue.pop(0)

    return script


async def test_worker_answers_with_readable_and_model_reviewed_evidence_only(make_container):
    gateway = FakeGateway(scripted(
        Grep(pattern="bug", source="."),
        Finish(answer="total() has the bug", evidence=[{"source": "pkg/calc.py", "line": 6}, {"source": "pkg/calc.py", "line": 99}]),
        ReviewClaims(verdicts=[Verdict(candidate=0, supported=True, evidence_indexes=[0])]),
    ))
    c = make_container(gateway=gateway)
    text = await c.ask.ask("which function is buggy?", paths=None)
    assert "total() has the bug" in text and "pkg/calc.py:6" in text and "sum(values) + 1" in text
    assert "1 cited location(s) could not be verified" in text
    run = last_run(c)
    assert run["route"] == "agent" and run["raw_tokens"] > 0


async def test_grep_observation_names_the_enclosing_function(make_container):
    gateway = FakeGateway(scripted(Grep(pattern="bug", source="."), Finish(answer="ok", evidence=[])))
    c = make_container(gateway=gateway)
    await c.ask.ask("find the bug", paths=None)
    seen = [call["user"] for call in gateway.calls][1]
    assert "[in L5: def total(values):]" in seen


async def test_worker_stops_at_the_step_limit_and_forces_a_finish(make_container):
    counter = iter(range(100))
    gateway = FakeGateway(lambda tools, *_: Finish(answer="forced", evidence=[]) if [t.__name__ for t in tools] == ["Finish"]
                          else ReadLines(source="pkg/calc.py", start=1, end=next(counter) + 2))
    c = make_container(gateway=gateway)
    text = await c.ask.ask("loop forever", paths=None)
    assert "forced" not in text and "support was not established" in text
    assert "Read the source directly" in text
    assert len(gateway.calls) <= c.settings.ask_max_steps


async def test_repeated_call_is_short_circuited(make_container):
    same = Grep(pattern="bug", source=".")
    gateway = FakeGateway(scripted(same, same, Finish(answer="done", evidence=[])))
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=None)
    third_prompt = gateway.calls[2]["user"]
    assert "(repeated)" in third_prompt


async def test_worker_can_be_switched_off(make_container):
    c = make_container()
    c.tunables.update({"llm_enabled": False})
    with pytest.raises(InvalidInput):
        await c.ask.ask("anything", paths=None)


async def test_research_omits_claim_not_supported_by_existing_citation(make_container):
    # research.answer: an existing line must not validate an unrelated claim.
    claim = "The calculator encrypts every password with AES-256."
    gateway = FakeGateway(lambda tools, *_: ReviewClaims(verdicts=[Verdict(candidate=0, supported=False, evidence_indexes=[0])])
                          if tools == [ReviewClaims] else Finish(answer=claim, evidence=[{"source": "pkg/calc.py", "line": 6}]))
    c = make_container(gateway=gateway)
    text = await c.ask.ask("How are passwords encrypted?", paths=["pkg/calc.py"])
    assert claim not in text


async def test_research_keeps_original_supported_claim_and_omits_rejected_claim(make_container):
    # support.result: keep original words and citations only for accepted candidates.
    def script(tools, *_):
        if tools == [ReviewClaims]:
            return ReviewClaims(verdicts=[Verdict(candidate=0, supported=True, evidence_indexes=[0]),
                                          Verdict(candidate=1, supported=False, evidence_indexes=[])])
        return Finish(answer="The function adds one. It encrypts passwords.", evidence=[{"source": "pkg/calc.py", "line": 6}])

    c = make_container(gateway=FakeGateway(script))
    text = await c.ask.ask("What does total do?", paths=["pkg/calc.py"])
    assert "The function adds one." in text and "encrypts passwords" not in text
    assert "pkg/calc.py:6" in text and "1 claim(s) omitted" in text and "reviewed by model" in text


async def test_artifact_research_omits_unreviewed_claims_when_review_is_unavailable(make_container):
    # support.empty: artifact question follows the same review contract as project research.
    artifact_id = ""

    def script(tools, *_):
        if tools == [ReviewClaims]:
            raise ModelUnavailable("review server down")
        return Finish(answer="The service encrypted passwords.", evidence=[{"source": artifact_id, "line": 1}])

    c = make_container(gateway=FakeGateway(script))
    artifact_id = c.artifacts.put("test", "test", "output", "The calculator adds one.").id
    text = await c.ask.query(artifact_id, pattern=None, lines=None, question="What happened?", context=0)
    assert "encrypted passwords" not in text and "Support review failed" in text


async def test_digest_omits_rejected_model_fact_and_keeps_deterministic_findings(make_container):
    # support.empty: rejected model facts do not remove deterministic digest findings.
    def script(tools, *_):
        if tools == [ReviewClaims]:
            return ReviewClaims(verdicts=[Verdict(candidate=0, supported=False, evidence_indexes=[])])
        return ReportFacts(facts=[Fact(line=1, claim="Passwords are encrypted with AES-256.")])

    c = make_container(gateway=FakeGateway(script), runner=FakeRunner(PYTEST_OUT, exit_code=1))
    text = await c.commands.run("pytest", cwd=None, goal="What failed?")
    assert "AES-256" not in text and "test_bad" in text
