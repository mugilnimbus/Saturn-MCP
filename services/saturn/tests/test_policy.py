import os
from pathlib import Path

import pytest

from saturn.domain.errors import InvalidInput, PolicyViolation
from saturn.domain.policy import PathPolicy, Policy, Rule, check, decide, split_command


@pytest.fixture
def project(tmp_path: Path) -> Path:
    folder = tmp_path / "project"
    (folder / "src").mkdir(parents=True)
    (folder / "src" / "app.py").write_text("x = 1\n")
    (folder / ".env").write_text("TOKEN=x\n")
    (tmp_path / "outside").mkdir()
    (tmp_path / "outside" / "data.txt").write_text("private\n")
    return folder


def decision(command: str, project: Path, policy: Policy | None = None, deny: tuple[Rule, ...] = ()):
    return decide(policy or Policy(), split_command(command), workdir=project, paths=PathPolicy((project,)), harness_deny=deny)


@pytest.mark.parametrize(
    "cmd",
    [
        "pytest -q", "python -m pytest tests", "git status", "git diff --stat", "git log -5 --oneline", "git --version",
        "uv run pytest", "uv run --no-sync python -m ruff check .", "npm test", "npm run build", "npm run test:unit",
        "ruff check .", "ruff format --check .", "cargo test", "go test ./...", "rg TODO src", "node --test",
        "npx tsc --noEmit", "git branch", "git branch -a", "git branch --list feat/*", "make", "make test", "pnpm lint",
        "dotnet test --no-restore", "npm audit", "rg \"\\bfoo\\b\" src", "git log --grep=/fix/ -3",
    ],
)
def test_standard_commands_are_allowed(cmd, project):
    assert decision(cmd, project).allowed, decision(cmd, project).reason


@pytest.mark.parametrize(
    "cmd",
    [
        "rm -rf /", "curl http://x", "git push", "git commit -m x", "git reset --hard", "git branch -D x",
        "git diff --output=x", "python -c 'print(1)'", "python evil.py", "npm install", "npm publish", "npx cowsay hi",
        "ruff check --fix .", "ruff format .", "cargo install x", "uv pip install x", "uv run rm -rf x", "powershell -c x",
        "git -c core.pager=x log", "node app.js", "rg --pre=evil x",
        # Each of these changes the project or installs something.
        "git branch audit-new-branch", "npm audit fix", "npx eslint --fix .", "uv run --with some-package pytest",
        "npx --yes jest", "npm run deploy", "make deploy", "cargo clippy --fix", "dotnet test",
    ],
)
def test_commands_that_change_or_install_are_refused(cmd, project):
    assert not decision(cmd, project).allowed


@pytest.mark.parametrize(
    "cmd",
    ["rg secret ../outside", "rg secret {outside}", "ls {outside}", "rg TOKEN .env", "git diff --no-index {outside}/data.txt x",
     pytest.param("dir ..\\outside", marks=pytest.mark.skipif(os.name != "nt", reason="Windows command path syntax"))],
)
def test_arguments_cannot_reach_outside_the_folder_or_credentials(cmd, project):
    outside = str(project.parent / "outside")
    result = decision(cmd.replace("{outside}", outside), project)
    assert not result.allowed and result.rule == "guard"


def test_guards_apply_even_to_allowed_and_open_commands(project):
    outside = project.parent / "outside"
    allowed = Policy(allow=(Rule.parse("ls *", "policy.toml"),))
    assert not decision(f"ls {outside}", project, allowed).allowed
    assert not decision(f"cat {outside}/data.txt", project, Policy(preset="open")).allowed
    assert decision("cat src/app.py", project, Policy(preset="open")).allowed


def test_rules_decide_in_order_deny_allow_preset(project):
    policy = Policy(allow=(Rule.parse("make deploy", "policy.toml"), Rule.parse("npm run e2e:*", "policy.toml")),
                    deny=(Rule.parse("cargo *", "policy.toml"),))
    assert decision("make deploy", project, policy).rule == "allow make deploy"
    assert decision("npm run e2e:chrome", project, policy).allowed
    assert not decision("npm run e2e", project, policy).allowed  # the pattern needs the e2e: prefix
    assert decision("cargo test", project, policy).rule == "deny cargo *"
    assert decision("pytest", project, policy).rule == "preset standard"
    both = Policy(allow=(Rule.parse("git status", "policy.toml"),), deny=(Rule.parse("git *", "policy.toml"),))
    assert not decision("git status", project, both).allowed


def test_a_harness_can_only_narrow(project):
    deny = (Rule.parse("pytest *", "harness ci"),)
    assert not decision("pytest -q", project, deny=deny).allowed
    assert decision("ruff check .", project, deny=deny).allowed


def test_rule_patterns_compare_words_and_program_names():
    rule = Rule.parse("npm run test:*", "x")
    assert rule.matches(["npm.cmd", "run", "test:unit"])
    assert not rule.matches(["npm", "run", "test:unit", "--watch"])
    assert Rule.parse("cargo *", "x").matches(["cargo"])
    with pytest.raises(InvalidInput):
        Rule.parse("rm -rf / | sh", "x")
    with pytest.raises(InvalidInput):
        Rule.parse("* anything", "x")


def test_check_explains_how_to_ask_for_an_allow_rule(project):
    with pytest.raises(PolicyViolation) as caught:
        check(Policy(), ["make", "deploy"], workdir=project, paths=PathPolicy((project,)))
    assert "saturn policy allow" in caught.value.message


def test_empty_command_is_invalid():
    with pytest.raises(InvalidInput):
        split_command("   ")


def test_quotes_are_parsed_without_a_shell():
    assert split_command('rg "a b" src') == ["rg", "a b", "src"]


def test_paths_stay_inside_roots(tmp_path):
    paths = PathPolicy((tmp_path,))
    (tmp_path / "ok.txt").write_text("x")
    assert paths.resolve("ok.txt") == (tmp_path / "ok.txt").resolve()
    for bad in ("..", "../outside", str(tmp_path.parent)):
        with pytest.raises(PolicyViolation):
            paths.resolve(bad)


def test_no_folder_asks_for_workspace_root():
    with pytest.raises(PolicyViolation, match="workspace_root"):
        PathPolicy(()).resolve(None)


def test_secret_files_are_not_readable(tmp_path):
    paths = PathPolicy((tmp_path,))
    for name in (".env", ".env.local", "server.pem", "id_rsa", ".mcp.json", "claude-code.token"):
        (tmp_path / name).write_text("x")
        with pytest.raises(PolicyViolation):
            paths.readable(name)
