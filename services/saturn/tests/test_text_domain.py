import re

from saturn.domain.condense import chunk, condense
from saturn.domain.outline import enclosing, outline
from saturn.domain.redaction import redact
from saturn.domain.text_ops import compile_pattern, grep_lines, render_matches, strip_ansi, template_of
from saturn.domain.tokens import estimate_tokens, truncate_to_tokens


def test_redaction_removes_common_secrets():
    text = (
        "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456\n"
        "api_key=supersecretvalue99\nsk-abcdefghijklmnopqrstu\nplain text"
    )
    out, n = redact(text)
    assert n >= 3 and "abcdefghijklmnopqrstuvwxyz123456" not in out and "supersecretvalue99" not in out
    assert "plain text" in out
    assert "[REDACTED]" in redact("x literalsecret1 y", ("literalsecret1",))[0]


def test_template_collapses_variable_parts():
    a = template_of("ERROR id=123 at 0xdeadbeef 2026-01-01T10:00:00Z")
    b = template_of("ERROR id=999 at 0x1f 2027-02-02T11:11:11Z")
    assert a == b


def test_strip_ansi():
    assert strip_ansi("\x1b[31mred\x1b[0m\r\nok") == "red\nok"


def test_grep_with_context_and_counts():
    lines = [f"line {i}" for i in range(20)] + ["needle"] + ["tail"] * 3
    matches, total = grep_lines(lines, compile_pattern("needle"), context=1, max_matches=5)
    rendered = render_matches(matches)
    assert total == 1 and matches[0].line == 21
    assert "20- line 19" in rendered and "21: needle" in rendered


def test_invalid_regex_falls_back_to_literal():
    assert compile_pattern("a(b").search("xa(b")


def test_phrase_search_loosens_until_it_finds_identifiers():
    from saturn.domain.text_ops import pattern_tiers

    tiers = pattern_tiers("inline token limit")
    assert [label for label, _ in tiers] == ["exact", "flexible separators", "all words on one line"]
    line = "    inline_token_limit: int = 700"
    assert not tiers[0][1].search(line) and tiers[1][1].search(line)
    assert tiers[2][1].search("limit for the inline digest, in token units")
    assert len(pattern_tiers(r"def \w+\(")) == 1  # a real regex is never rewritten


def test_token_helpers():
    assert estimate_tokens("") == 0 and estimate_tokens("abcd") == 2
    out = truncate_to_tokens("word " * 1000, 50)
    assert estimate_tokens(out) <= 55 and out.endswith("[truncated]")


def test_outline_and_enclosing_definition():
    src = ["def add(a, b):", "    return a + b", "", "", "class K:", "    def m(self):", "        return 1", ""]
    assert [t for _, t in outline(src, ".py")][:3] == ["def add(a, b):", "class K:", "    def m(self):"]
    assert enclosing(src, 2, ".py") == (1, "def add(a, b):")
    assert enclosing(src, 7, ".py")[0] == 6
    assert enclosing(src, 1, ".txt") is None


def test_condense_keeps_errors_and_collapses_repeats_within_budget():
    lines = ["heartbeat ok"] * 500 + ["ERROR disk full on /dev/sda1"] + ["heartbeat ok"] * 500
    kept = condense(lines, max_tokens=200)
    assert any("disk full" in c.text for c in kept)
    heartbeats = [c for c in kept if "heartbeat" in c.text]
    assert len(heartbeats) == 1 and heartbeats[0].count == 1000
    assert sum(estimate_tokens(c.render()) for c in kept) <= 220


def test_goal_keywords_raise_relevance():
    lines = [f"service-{i} started ok" for i in range(400)] + ["billing worker queue depth 9000"]
    kept = condense(lines, goal="why is billing slow", max_tokens=60)
    assert any("billing" in c.text for c in kept)


def test_chunking_respects_size():
    lines = [f"distinct line number {i} {'x' * (i % 40)}" for i in range(200)]
    chunks = chunk(condense(lines, max_tokens=4000), 300)
    assert len(chunks) > 1
    assert all(sum(estimate_tokens(c.render()) + 1 for c in ch) <= 330 for ch in chunks)
    assert re.match(r"L\d+", chunks[0][0].render())
