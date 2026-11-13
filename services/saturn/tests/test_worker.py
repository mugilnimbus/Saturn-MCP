"""The work code does for the worker model: seeding, forgiving search, and a scratchpad that keeps results."""

from conftest import FakeGateway

from saturn.application.graphs.agent_graph import Finish, Grep, ReadLines, _scratchpad
from saturn.domain.tokens import estimate_tokens


def finish_now(*_args):
    return Finish(answer="done", evidence=[])


async def test_a_given_small_file_is_read_before_the_model_is_asked(make_container):
    gateway = FakeGateway(finish_now)
    c = make_container(gateway=gateway)
    text = await c.ask.ask("what does total do?", paths=["pkg/calc.py"])
    first_prompt = gateway.calls[0]["user"]
    assert "(done for you)" in first_prompt and "return sum(values) + 1" in first_prompt
    assert "0 step(s)" in text and len(gateway.calls) == 1


async def test_a_given_folder_is_listed_and_a_large_file_is_outlined(make_container, root):
    (root / "big.py").write_text("\n".join(f"def f{i}():\n    return {i}\n" for i in range(900)), encoding="utf-8")
    gateway = FakeGateway(finish_now)
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=["pkg", "big.py"])
    prompt = gateway.calls[0]["user"]
    assert "calc.py" in prompt and "outline of 'big.py'" in prompt and "def f0():" in prompt
    assert estimate_tokens(prompt) < 2500


async def test_seeded_steps_do_not_use_up_the_step_budget(make_container):
    counter = iter(range(100))

    def keep_searching(tools, *_):
        if [t.__name__ for t in tools] == ["Finish"]:
            return Finish(answer="forced", evidence=[])
        return Grep(pattern=f"needle{next(counter)}", source="pkg")

    gateway = FakeGateway(keep_searching)
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=["pkg"])  # the folder listing is seeded and costs no step
    assert len(gateway.calls) == c.settings.ask_max_steps


async def test_a_fully_shown_file_leaves_only_finish_on_offer(make_container):
    gateway = FakeGateway(finish_now)
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=["pkg/calc.py"])
    assert gateway.calls[0]["tools"] == ["Finish"] and "Call Finish with the answer now" in gateway.calls[0]["user"]


async def test_rereading_a_fully_shown_file_is_skipped_and_forces_finish(make_container):
    replies = [ReadLines(source="pkg/calc.py", start=1, end=60), Grep(pattern="sum", source="pkg/calc.py")]
    gateway = FakeGateway(lambda tools, *_: Finish(answer="ok", evidence=[]) if [t.__name__ for t in tools] == ["Finish"]
                          else replies.pop(0))
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=["pkg"])
    assert [call["tools"] == ["Finish"] for call in gateway.calls] == [False, False, True]
    assert "(not needed)" in gateway.calls[2]["user"]


async def test_phrase_search_finds_an_identifier(make_container, root):
    (root / "pkg" / "settings.py").write_text("inline_token_limit = 700\n", encoding="utf-8")
    c = make_container()
    out = c.ask._tools.grep("inline token limit", ".", None)
    assert "matched with flexible separators" in out and "settings.py:1" in out
    assert c.ask._tools.grep("nothing like this anywhere", ".", None).startswith("0 matches")


async def test_wrong_path_suggests_the_real_file(make_container):
    gateway = FakeGateway(lambda tools, *_: Finish(answer="x", evidence=[]) if len(gateway.calls) > 1
                          else ReadLines(source="calc.py", start=1, end=5))
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=None)
    assert "Did you mean: pkg/calc.py?" in gateway.calls[1]["user"]


async def test_repeat_points_at_the_step_that_still_holds_the_result(make_container):
    same = Grep(pattern="bug", source=".")
    replies = [same, same, Finish(answer="done", evidence=[])]
    gateway = FakeGateway(lambda *_: replies.pop(0))
    c = make_container(gateway=gateway)
    await c.ask.ask("x", paths=None)
    last = gateway.calls[2]["user"]
    assert "Identical to step 1" in last and "sum(values) + 1" in last  # the first result is still there


def test_scratchpad_keeps_results_whole_until_the_budget_is_hit():
    small = [{"call": f"c{i}", "observation": "\n".join(f"row {i}.{j}" for j in range(10))} for i in range(4)]
    assert "row 0.9" in _scratchpad(small)
    big = [{"call": f"c{i}", "observation": "\n".join("x" * 60 for _ in range(60))} for i in range(6)]
    shrunk = _scratchpad(big, budget=1500)
    assert "(shortened" in shrunk.split("6. c5")[0] and "(shortened" not in shrunk.split("6. c5")[1]
