"""Prepare a Saturn checkout: python scripts/setup.py [--yes].

Uses Python's standard library. Installs project dependencies, builds the dashboard,
creates only a missing Saturn-home .env, and tests an isolated foreground service.
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVICE = ROOT / 'services' / 'saturn'
WEB = ROOT / 'apps' / 'web'
REQUIREMENTS = {
    'uv': 'https://docs.astral.sh/uv/getting-started/installation/',
    'node': 'https://nodejs.org/en/download',
    'npm': 'https://nodejs.org/en/download',
}
SECRET = re.compile(r'KEY|TOKEN|SECRET|PASSWORD', re.I)


class SetupError(RuntimeError):
    """A failed preparation step with an actionable message."""


def command(name: str) -> str:
    executable = shutil.which(name)
    if not executable:
        raise SetupError(f'{name} is missing. Install it from {REQUIREMENTS.get(name, "the tool vendor")}. Open a new terminal and retry.')
    return executable


def service_python() -> Path:
    return SERVICE / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')


def check_tools() -> None:
    if sys.version_info < (3, 12):  # noqa: UP036 -- bootstrap must reject older interpreters before installing.
        raise SetupError('Python 3.12 or newer is required. Install it from https://www.python.org/downloads/.')
    print(f'Python {sys.version.split()[0]}', flush=True)
    for name in REQUIREMENTS:
        try:
            result = subprocess.run([command(name), '--version'], capture_output=True, text=True, timeout=30, check=False)
        except (OSError, subprocess.TimeoutExpired) as error:
            raise SetupError(f'Cannot run {name}. Reinstall it from {REQUIREMENTS[name]}.') from error
        version = re.search(r'\d+\.\d+\.\d+', result.stdout)
        if result.returncode or not version:
            raise SetupError(f'Cannot read the {name} version. Reinstall it from {REQUIREMENTS[name]}.')
        if name == 'node':
            parts = tuple(int(x) for x in version.group().split('.'))
            if not ((parts[0] == 20 and parts >= (20, 19, 0)) or parts >= (22, 12, 0)):
                raise SetupError(f'Node {version.group()} is unsupported. Use Node {(ROOT / ".nvmrc").read_text().strip()} from {REQUIREMENTS[name]}.')
        print(f'{name} {version.group()}', flush=True)


def run_step(label: str, argv: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
    print(f'\n{label}: {subprocess.list2cmdline(argv)}', flush=True)
    try:
        result = subprocess.run(argv, cwd=cwd, env=env, check=False)
    except OSError as error:
        raise SetupError(f'{label} could not start. Check the installed tools and retry.') from error
    if result.returncode:
        raise SetupError(f'{label} failed with exit code {result.returncode}. Read the output above and the README Troubleshooting section.')


def read_example() -> list[tuple[str, str, str]]:
    rows = []
    for line in (ROOT / '.env.example').read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        key, rest = line.split('=', 1)
        value, _, description = rest.partition('#')
        rows.append((key.strip(), value.strip(), description.strip()))
    return rows


def validate_env(values: dict[str, str], text: str) -> None:
    # Validate with the installed service contract. Neither arguments nor errors contain values.
    validator = '''import json, sys
from io import StringIO
from dotenv import dotenv_values
from pydantic import ValidationError
from saturn.infrastructure.config import Settings
values, text = json.load(sys.stdin)
if dict(dotenv_values(stream=StringIO(text))) != values:
    print("Settings cannot round-trip through dotenv. Remove variable expansion expressions from the entered values.")
    sys.exit(1)
try:
    Settings(_env_file=None, **values)
except ValidationError as error:
    print("Invalid startup settings: " + ", ".join(str(item["loc"][0]) for item in error.errors()))
    sys.exit(1)
'''
    try:
        text.encode('utf-8')
    except UnicodeError as error:
        raise SetupError('Startup settings must use valid UTF-8 text.') from error
    result = subprocess.run([str(service_python()), '-c', validator], input=json.dumps([values, text]),
                            capture_output=True, text=True, cwd=SERVICE, check=False)
    if result.returncode:
        # Only the validator's fixed diagnostic is safe to display; unexpected tracebacks stay private.
        message = result.stdout.strip()
        if not message.startswith(('Invalid startup settings:', 'Settings cannot round-trip')):
            message = 'Startup validation could not run. Run setup again to repair the service dependencies.'
        raise SetupError(message)


def create_env(path: Path, text: str) -> bool:
    try:
        descriptor = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        return False
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8', newline='\n') as output:
            output.write(text)
    except OSError:
        path.unlink(missing_ok=True)
        raise
    return True


def make_env(home: Path, *, asking: bool) -> None:
    path = home / '.env'
    if os.path.lexists(path):
        if not path.is_file():
            raise SetupError(f'{path} is not a regular environment file. Repair the path and rerun setup.')
        print(f'\nKeep existing startup environment: {path}', flush=True)
        return
    values = {}
    print(f'\nStartup environment: {path}', flush=True)
    for key, default, description in read_example():
        answer = ''
        if asking:
            print(f'\n{key}: {description}', flush=True)
            prompt = f'{key}' + (f' [{default}]' if default else ' [optional]') + ': '
            answer = getpass.getpass(prompt) if SECRET.search(key) else input(prompt)
        values[key] = answer if answer else default
    text = ''.join(f'{key}={json.dumps(value, ensure_ascii=False)}\n' for key, value in values.items())
    validate_env(values, text)
    home.mkdir(parents=True, exist_ok=True)
    created = create_env(path, text)
    print('Created startup environment.' if created else 'Kept the startup environment created by another process.', flush=True)


def isolated_environment(folder: Path) -> dict[str, str]:
    env = {key: value for key, value in os.environ.items()
           if not key.upper().startswith(('SATURN_', 'LOCAL_SERVER_')) and key.upper() not in ('PYTHONPATH', 'VIRTUAL_ENV')}
    for key, name in [('SATURN_HOME', 'home'), ('CLAUDE_CONFIG_DIR', 'claude'), ('CODEX_HOME', 'codex')]:
        env[key] = str(folder / name)
    return env


def stop_owned_process(process: subprocess.Popen[bytes]) -> None:
    """Stop the smoke child and, on Windows, the interpreter that the venv launcher started for it."""
    if sys.platform == 'win32':
        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], capture_output=True, check=False, timeout=30)
    else:
        process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


def smoke_check() -> None:
    runtime = ROOT / 'var' / 'guided-setup'
    runtime.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='smoke-', dir=runtime, ignore_cleanup_errors=True) as temporary:
        folder = Path(temporary)
        env = isolated_environment(folder)
        for key in ('SATURN_HOME', 'CLAUDE_CONFIG_DIR', 'CODEX_HOME'):
            Path(env[key]).mkdir(parents=True, exist_ok=True)
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with tempfile.NamedTemporaryFile(prefix='smoke-', suffix='.log', dir=runtime, delete=False) as log:
            log_path = Path(log.name)
            process = None
            try:
                process = subprocess.Popen([str(service_python()), '-m', 'saturn.bootstrap.cli', 'serve',
                                            '--host', '127.0.0.1', '--port', str(port)], cwd=ROOT, env=env,
                                           stdout=log, stderr=subprocess.STDOUT)
                deadline = time.monotonic() + 60
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        break
                    try:
                        with opener.open(f'http://127.0.0.1:{port}/api/health', timeout=1) as response:
                            healthy = response.status == 200 and json.load(response).get('status') == 'ok'
                        with opener.open(f'http://127.0.0.1:{port}/', timeout=1) as response:
                            dashboard = response.status == 200 and '/assets/' in response.read().decode('utf-8')
                        if healthy and dashboard:
                            print('Isolated service health and dashboard: passed.', flush=True)
                            return
                    except (OSError, urllib.error.URLError, ValueError):
                        pass
                    time.sleep(.2)
                raise SetupError(f'Isolated startup failed. Read {log_path}. Repair the reported error and rerun setup.')
            finally:
                if process is not None and process.poll() is None:
                    stop_owned_process(process)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--yes', action='store_true', help='Use defaults without questions; preserve an existing home .env.')
    args = parser.parse_args()
    try:
        print('Saturn checkout setup. No clients are connected and no models are downloaded.', flush=True)
        check_tools()
        pin = (SERVICE / '.python-version').read_text().strip()
        install_env = os.environ.copy()
        install_env['UV_PROJECT_ENVIRONMENT'] = str(SERVICE / '.venv')
        run_step('Install locked Python dependencies', [command('uv'), 'sync', '--locked', '--python', pin], SERVICE, install_env)
        run_step('Install locked dashboard dependencies', [command('npm'), 'ci', '--no-audit', '--no-fund'], WEB)
        run_step('Build the dashboard', [command('npm'), 'run', 'build'], WEB)
        if not (WEB / 'dist' / 'index.html').is_file():
            raise SetupError('Dashboard build produced no dist/index.html. Read the build output and retry.')
        home = Path(os.environ.get('SATURN_HOME') or Path.home() / '.saturn').expanduser().resolve()
        make_env(home, asking=not args.yes and not os.environ.get('CI') and sys.stdin.isatty())
        smoke_check()
    except (SetupError, OSError) as error:
        print(f'\nSetup stopped: {error}', file=sys.stderr)
        return 1
    except (KeyboardInterrupt, EOFError):
        print('\nSetup stopped. Existing configuration was kept.', file=sys.stderr)
        return 130
    print('\nSetup complete. Start Saturn from the project root:', flush=True)
    print('  uv run --project services/saturn --no-sync saturn serve')
    print('Open the address printed by Saturn (default http://127.0.0.1:9000/). Use Settings or Connections to finish configuration.')
    print('Run all checks: python scripts/check.py')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
