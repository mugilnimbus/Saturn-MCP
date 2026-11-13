"""Run Saturn's automated checks: python scripts/check.py.

Uses the installed project tools. Model and manual browser checks run separately.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import setup


def main() -> int:
    try:
        setup.check_tools()
    except (setup.SetupError, OSError) as error:
        print(f'Checks stopped: {error}', file=sys.stderr)
        return 1
    uv = setup.command('uv')
    npm = setup.command('npm')
    checks = [
        ('Python lint', [uv, 'run', '--no-sync', 'ruff', 'check', 'src', 'tests', 'evals', '../../scripts',
                          '../../bench/corpus.py', '../../bench/__main__.py', '../../bench/__init__.py', '../../bench/execution.py', '../../bench/runner.py', '../../bench/replay.py', '../../bench/savings.py', '../../bench/agent.py', '../../bench/tests'], setup.SERVICE),
        ('Python types', [uv, 'run', '--no-sync', 'mypy'], setup.SERVICE),
        ('Python Windows types', [uv, 'run', '--no-sync', 'mypy', '--platform', 'win32'], setup.SERVICE),
        ('Python and setup tests', [uv, 'run', '--no-sync', 'pytest', '-m', 'not live', 'tests', '../../scripts/tests',
                                    '--basetemp', str(setup.ROOT / 'var' / 'pytest')], setup.SERVICE),
        ('Golden corpus types', [str(setup.service_python()), '-m', 'mypy', '--strict', '--ignore-missing-imports',
                                 'bench/corpus.py', 'bench/__main__.py', 'bench/execution.py', 'bench/runner.py', 'bench/replay.py', 'bench/savings.py', 'bench/agent.py'], setup.ROOT),
        ('Benchmark Windows types', [str(setup.service_python()), '-m', 'mypy', '--strict', '--ignore-missing-imports',
                                     '--platform', 'win32', 'bench/corpus.py', 'bench/__main__.py', 'bench/execution.py', 'bench/runner.py', 'bench/replay.py', 'bench/savings.py', 'bench/agent.py'], setup.ROOT),
        ('Golden corpus contracts', [str(setup.service_python()), '-m', 'pytest', 'bench/tests', '-q',
                                     '--basetemp', str(setup.ROOT / 'var' / 'bench' / 'pytest')], setup.ROOT),
        ('Frontend types', [npm, 'run', 'check'], setup.WEB),
        ('Frontend tests', [npm, 'test'], setup.WEB),
        ('Frontend build', [npm, 'run', 'build'], setup.WEB),
        ('Architecture', [setup.command('node'), 'docs/architecture/check.mjs'], setup.ROOT),
    ]
    runtime = setup.ROOT / 'var' / 'guided-setup'
    runtime.mkdir(parents=True, exist_ok=True)
    (setup.ROOT / 'var' / 'bench').mkdir(parents=True, exist_ok=True)
    failed = []
    with tempfile.TemporaryDirectory(prefix='checks-', dir=runtime) as temporary:
        env = setup.isolated_environment(Path(temporary))
        env['UV_PROJECT_ENVIRONMENT'] = str(setup.SERVICE / '.venv')
        for label, argv, cwd in checks:
            try:
                setup.run_step(label, argv, cwd, env)
            except (setup.SetupError, OSError) as error:
                print(str(error), file=sys.stderr)
                failed.append(label)
        try:
            setup.smoke_check()
        except (setup.SetupError, OSError, subprocess.SubprocessError) as error:
            print(f'Isolated startup: {error}', file=sys.stderr)
            failed.append('Isolated startup')
    if failed:
        print(f'\nFailed checks: {", ".join(failed)}. Run python scripts/setup.py if dependencies are missing.', file=sys.stderr)
        return 1
    print(f'\nAll {len(checks) + 1} checks passed. Model and manual browser checks are separate.', flush=True)
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print('\nChecks stopped.', file=sys.stderr)
        raise SystemExit(130) from None
