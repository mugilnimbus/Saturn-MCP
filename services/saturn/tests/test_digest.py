from saturn.domain.digest import build_digest, render_digest
from saturn.domain.tokens import estimate_tokens

PYTEST = "\n".join(
    ["============ test session starts ============"]
    + [f"tests/test_a.py::test_{i} PASSED" for i in range(300)]
    + ["=========== FAILURES ===========", "___ test_bad ___", "E   AssertionError: 7 != 6"]
    + [
        "=========== short test summary info ===========",
        "FAILED tests/test_a.py::test_bad - AssertionError: 7 != 6",
        "FAILED tests/test_a.py::test_worse - KeyError: 'x'",
        "======= 2 failed, 300 passed in 1.20s =======",
    ]
)


def test_pytest_failures_are_extracted_with_reasons():
    d = build_digest(PYTEST, exit_code=1)
    assert d.kind == "pytest" and d.confidence > 0.9
    assert "2 failed, 300 passed" in d.headline
    texts = [f.text for f in d.findings]
    assert any("test_bad" in t and "AssertionError" in t for t in texts)
    assert any("test_worse" in t for t in texts)


def test_parametrized_failures_with_one_cause_collapse_into_one_finding():
    text = "\n".join(
        ["test session starts"]
        + [f"FAILED t.py::test_batch[{n}] - AssertionError: batch {n} crossed the boundary" for n in (0, 13, 26)]
        + ["FAILED t.py::test_other - KeyError: 'x'", "==== 4 failed, 9 passed in 0.1s ===="]
    )
    findings = build_digest(text, exit_code=1).findings
    batch = next(f for f in findings if "test_batch" in f.text)
    assert batch.count == 3 and "[0, 13, 26]" in batch.text and len(findings) == 2


def test_ruff_multiline_output_is_grouped_by_rule():
    block = []
    for i in range(40):
        block += ["E701 Multiple statements on one line (colon)", f" --> pkg/m.py:{i + 1}:17", "  |", ""]
    block += ["F401 [*] `os` imported but unused", " --> pkg/m.py:1:8", "", "Found 41 errors."]
    d = build_digest("\n".join(block), exit_code=1)
    assert d.kind == "lint" and "Found 41 errors" in d.headline
    top = d.findings[0]
    assert top.count == 40 and top.text.startswith("E701") and "pkg/m.py:1:17" in top.text
    assert any(f.text.startswith("F401") for f in d.findings)


def test_headline_is_not_repeated_as_a_finding_or_tail():
    d = build_digest(PYTEST, exit_code=1)
    rendered = render_digest(d, max_tokens=450)
    assert rendered.count("2 failed, 300 passed") == 1 and "tail:" not in rendered


def test_tail_is_shown_with_correct_line_numbers_when_there_is_no_summary():
    d = build_digest("\n".join(f"step {i}" for i in range(1, 51)))
    assert d.tail[-1] == (50, "step 50")


def test_digest_is_much_smaller_than_the_output():
    d = build_digest(PYTEST, exit_code=1)
    assert estimate_tokens(render_digest(d, max_tokens=450)) < estimate_tokens(PYTEST) / 5


def test_traceback_reports_final_exception_and_innermost_frame():
    text = (
        "Traceback (most recent call last):\n"
        '  File "a.py", line 3, in main\n    run()\n'
        '  File "b.py", line 9, in run\n    1/0\n'
        "ZeroDivisionError: division by zero\n"
    )
    d = build_digest(text, exit_code=1)
    assert d.kind == "traceback"
    assert "ZeroDivisionError" in d.findings[0].text and "b.py:9" in d.findings[0].text


def test_repeated_errors_are_clustered_with_counts():
    text = "\n".join(f"2026-01-01 12:00:{i % 60:02d} ERROR db timeout after {i}ms host=db-{i}" for i in range(80)) + "\nINFO done\n"
    top = build_digest(text).findings[0]
    assert top.count == 80 and top.line == 1 and top.last_line == 80


def test_diagnostics_group_by_message():
    text = "\n".join(f"src/f{i}.ts({i + 1},5): error TS2304: Cannot find name 'x{i}'." for i in range(6)) + "\nFound 6 errors.\n"
    d = build_digest(text, exit_code=2)
    assert d.kind == "diagnostics" and "Found 6 errors" in d.headline


def test_diff_summarises_files_changed():
    text = "diff --git a/x.py b/x.py\n--- a/x.py\n+++ b/x.py\n@@ -1 +1,2 @@\n-old\n+new\n+newer\n"
    d = build_digest(text)
    assert d.kind == "diff" and "1 files changed, +2 −1" in d.headline


def test_json_is_summarised_by_structure():
    d = build_digest('{"items": [1,2,3], "name": "x"}')
    assert d.kind == "json" and "items:list[3]" in d.headline


def test_clean_output_has_low_confidence_so_a_model_may_help():
    d = build_digest("\n".join(f"step {i} ok" for i in range(200)), exit_code=0)
    assert d.confidence < 0.5 and not d.findings


def test_zero_errors_line_is_not_a_finding():
    d = build_digest("build complete\n0 errors, 0 warnings\n" * 3)
    assert not any("0 errors" in f.text for f in d.findings if f.severity == "error")


def test_render_respects_token_budget():
    text = "\n".join(f"ERROR unique failure number {i} with distinct words {'w' * i}" for i in range(60))
    out = render_digest(build_digest(text), max_tokens=120)
    assert estimate_tokens(out) <= 160  # budget plus the fixed headline/tail
