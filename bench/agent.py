"""Agent A/B test: the same agent does the same task with and without Saturn.

python -m bench agent-prepare --output var/bench/agent-<date>/workspace
python -m bench agent-prompts --output var/bench/agent-<date>/workspace
python -m bench agent-grade --input var/bench/agent-<date>/runs.json
"""
from __future__ import annotations

import json
import shutil
import statistics
from pathlib import Path
from typing import Any

from bench.corpus import materialize

ARMS = ('shell', 'saturn')

# Each task reuses facts from a reviewed corpus case. A fact counts when any of its texts is in the answer.
TASKS: list[dict[str, Any]] = [
    dict(id='click-tests', case='click-run-2',
         task='Run the click test suite with `python _replay.py click-tests-fail`. How many tests failed, and what are their names?',
         facts=[['2 failed', '2 tests failed', '2 failures', 'two tests failed', 'two failed'],
                ['test_range[type7-0-1]'], ['test_range[type8-5-4]']]),
    dict(id='requests-tests', case='requests-run-2',
         task='Run the requests test suite with `python _replay.py requests-tests-fail`. How many tests failed, and which ones?',
         facts=[['4 failed', '4 tests failed', '4 failures', 'four tests failed', 'four failed'],
                ['test_string'], ['test_super_len_with_tell']]),
    dict(id='requests-lint', case='requests-run-1',
         task='Run the linter with `python _replay.py requests-lint`. How many errors are there, which rule, and give one file location.',
         facts=[['10 errors', '10 diagnostics', 'ten errors'], ['E501'], ['models.py:13:89', 'models.py line 13']]),
    dict(id='commander-diff', case='commander-run-2',
         task='Show the pending change with `python _replay.py commander-diff`. Which option prefix does the new code check, and what was the old prefix?',
         facts=[['--disable-'], ['--no-']]),
    dict(id='requests-redirects', case='requests-query-1',
         task='List the project files with `python _replay.py requests-inventory`. What is the value of DEFAULT_REDIRECT_LIMIT?',
         facts=[['DEFAULT_REDIRECT_LIMIT'], ['30']]),
    dict(id='ripgrep-after-context', case='ripgrep-search-1',
         task='In sources/ripgrep, find where the AfterContext flag struct is defined. Give the file and the line number.',
         facts=[['defs.rs'], ['156']]),
    dict(id='chi-timeout', case='chi-ask-1',
         task='In sources/chi/middleware/timeout.go, what HTTP status does the Timeout middleware write when the deadline passes?',
         facts=[['504', 'StatusGatewayTimeout']]),
    dict(id='p-limit-concurrency', case='p-limit-read-1',
         task='In sources/p-limit/index.js, which concurrency values does validateConcurrency accept?',
         facts=[['validateConcurrency'], ['POSITIVE_INFINITY', 'Infinity'], ['integer']]),
]

RULES = {
    'shell': 'Use only your own Bash, Read, Grep, and Glob tools. Do not call any Saturn tool (mcp__saturn__*).',
    'saturn': ('Use only the Saturn tools (mcp__saturn__saturn_run, saturn_read, saturn_search, saturn_ask, saturn_query) '
               'to run commands and read files. Do not use Bash, Read, Grep, or Glob. Send workspace_root on every call.'),
}


def prepare(dataset: Path, workspace: Path) -> dict[str, Any]:
    """Copy the corpus inputs, the replay script, and the capture index into a new workspace."""
    copied = materialize(dataset, workspace)
    shutil.copyfile(Path(__file__).resolve().parent / 'replay.py', workspace / '_replay.py')
    captures = json.loads((dataset / 'captures.json').read_text(encoding='utf-8'))
    index = {c['id']: dict(asset=c['asset'], exit_code=c['exit_code']) for c in captures}
    (workspace / '_captures.json').write_text(json.dumps(index, indent=2) + '\n', encoding='utf-8')
    return {'workspace': str(workspace.resolve()), 'copied_assets': copied, 'tasks': len(TASKS)}


def prompts(workspace: Path) -> list[dict[str, str]]:
    """One prompt for each task and arm. The answer format is fixed so grading needs no judgment."""
    root = workspace.resolve()
    out = []
    for task in TASKS:
        for arm in ARMS:
            out.append(dict(task=task['id'], arm=arm, prompt=(
                f'You are testing tool use in the folder {root}. Work only inside it; run commands from it.\n'
                f'{RULES[arm]}\n\nTask: {task["task"]}\n\n'
                'Answer in at most five lines. Then add one last line: TOOLS: <tool name> x<count>, ... for every tool you called.')))
    return out


def grade(runs: list[dict[str, Any]]) -> dict[str, Any]:
    """Score each recorded run by literal facts, then compare the arms on the tasks both completed."""
    by_id = {t['id']: t for t in TASKS}
    rows = []
    for run in runs:
        answer = run['answer'].casefold()
        facts = by_id[run['task']]['facts']
        found = sum(any(text.casefold() in answer for text in options) for options in facts)
        rows.append(dict(task=run['task'], arm=run['arm'], facts_found=found, facts=len(facts), success=found == len(facts),
                         total_tokens=run['total_tokens'], tool_uses=run['tool_uses'], duration_ms=run['duration_ms'],
                         tools_reported=run.get('tools_reported', '')))

    def arm(name: str) -> dict[str, Any]:
        group = [r for r in rows if r['arm'] == name]
        return dict(runs=len(group), successes=sum(r['success'] for r in group),
                    total_tokens=sum(r['total_tokens'] for r in group),
                    median_tokens=statistics.median(r['total_tokens'] for r in group) if group else None,
                    median_tool_uses=statistics.median(r['tool_uses'] for r in group) if group else None,
                    median_seconds=statistics.median(r['duration_ms'] for r in group) / 1000 if group else None)

    pairs = []
    for task in TASKS:
        a = next((r for r in rows if r['task'] == task['id'] and r['arm'] == 'shell'), None)
        b = next((r for r in rows if r['task'] == task['id'] and r['arm'] == 'saturn'), None)
        if a and b and a['total_tokens'] > 0:
            pairs.append(dict(task=task['id'], shell_tokens=a['total_tokens'], saturn_tokens=b['total_tokens'],
                              saved=1 - b['total_tokens'] / a['total_tokens'], both_succeeded=a['success'] and b['success']))
    return {
        'method': 'One run per task and arm, by a Claude Code subagent. Tokens are the subagent total the harness reports.',
        'shell': arm('shell'), 'saturn': arm('saturn'), 'pairs': pairs,
        'median_saved': statistics.median(p['saved'] for p in pairs) if pairs else None,
        'runs': rows,
        'limits': [
            'One run per task and arm: no spread, so a single unusual run can move the result.',
            'Tool use is instructed, not enforced. The tools line is reported by the agent itself.',
            'Commands replay recorded output; they do not rebuild or retest the projects.',
            'Success is a literal fact match in a short answer, not a review of reasoning.',
        ],
    }
