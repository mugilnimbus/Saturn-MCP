"""Contracts for checkout setup, separate from runtime client installation."""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
from pathlib import Path

import pytest
from dotenv import dotenv_values

SPEC = importlib.util.spec_from_file_location('checkout_setup', Path(__file__).parents[1] / 'setup.py')
assert SPEC and SPEC.loader
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)


def test_checkout_preserves_existing_env_without_reading_it(tmp_path, monkeypatch):
    # saturn.cli.checkout.environment.keep_env: existing bytes remain private and unchanged.
    home = tmp_path / 'home with spaces'
    home.mkdir()
    env = home / '.env'
    original = b'# retained\r\nLOCAL_SERVER_API_KEY=synthetic-secret\r\n'
    env.write_bytes(original)
    monkeypatch.setattr(setup, 'read_example', lambda: pytest.fail('Existing environment must not be inspected'))
    setup.make_env(home, asking=False)
    assert env.read_bytes() == original


def test_checkout_new_secret_round_trips_without_printing(tmp_path, monkeypatch, capsys):
    # saturn.cli.checkout.environment.input.valid: quoted dotenv retains the exact secret.
    secret = 'synthetic # key "quoted" \\ path café'
    monkeypatch.setattr(setup.getpass, 'getpass', lambda _: secret)
    monkeypatch.setattr('builtins.input', lambda _: '')
    setup.make_env(tmp_path, asking=True)
    assert dotenv_values(tmp_path / '.env')['LOCAL_SERVER_API_KEY'] == secret
    assert secret not in capsys.readouterr().out
    if os.name != 'nt':
        assert (tmp_path / '.env').stat().st_mode & 0o777 == 0o600


def test_checkout_rejects_invalid_settings_before_creation(tmp_path, monkeypatch, capsys):
    # saturn.cli.checkout.environment.input.valid: invalid ports leave no partial configuration.
    monkeypatch.setattr(setup.getpass, 'getpass', lambda _: 'synthetic-secret')
    monkeypatch.setattr('builtins.input', lambda prompt: '0' if 'SATURN_PORT' in prompt else '')
    with pytest.raises(setup.SetupError, match='SATURN_PORT'):
        setup.make_env(tmp_path, asking=True)
    assert not (tmp_path / '.env').exists()
    assert 'synthetic-secret' not in capsys.readouterr().out


def test_checkout_rejects_dotenv_interpolation(tmp_path, monkeypatch):
    # saturn.cli.checkout.environment.input.valid: stored secrets must load without expansion.
    monkeypatch.setattr(setup.getpass, 'getpass', lambda _: '${SATURN_SETUP_MISSING_TEST_VALUE}')
    monkeypatch.delenv('SATURN_SETUP_MISSING_TEST_VALUE', raising=False)
    monkeypatch.setattr('builtins.input', lambda _: '')
    with pytest.raises(setup.SetupError, match='round-trip'):
        setup.make_env(tmp_path, asking=True)
    assert not (tmp_path / '.env').exists()


def test_checkout_exclusive_creation_keeps_a_concurrent_file(tmp_path):
    # saturn.cli.checkout.environment.create_outcome: a concurrent environment wins.
    assert setup.create_env(tmp_path / '.env', 'LOCAL_SERVER_API_KEY="first"\n')
    assert not setup.create_env(tmp_path / '.env', 'LOCAL_SERVER_API_KEY="second"\n')
    assert (tmp_path / '.env').read_text() == 'LOCAL_SERVER_API_KEY="first"\n'


def test_checkout_smoke_environment_removes_inherited_runtime_settings(tmp_path, monkeypatch):
    # saturn.cli.checkout.smoke.smoke_prepare: smoke cannot inherit real homes or credentials.
    for name in ('SATURN_TOKEN', 'SATURN_DATA_DIR', 'SATURN_URL', 'LOCAL_SERVER_API_KEY', 'PYTHONPATH'):
        monkeypatch.setenv(name, 'synthetic-inherited-value')
    env = setup.isolated_environment(tmp_path)
    assert not any(name in env for name in ('SATURN_TOKEN', 'SATURN_DATA_DIR', 'SATURN_URL', 'LOCAL_SERVER_API_KEY', 'PYTHONPATH'))
    assert all(Path(env[name]).is_relative_to(tmp_path) for name in ('SATURN_HOME', 'CLAUDE_CONFIG_DIR', 'CODEX_HOME'))
    assert env['PATH'] == os.environ['PATH']


def test_checkout_failed_command_names_the_step(tmp_path, monkeypatch):
    # saturn.cli.checkout.dependencies.python_ok: command failure exits with a repair action.
    monkeypatch.setattr(setup.subprocess, 'run', lambda *args, **kwargs: subprocess.CompletedProcess(args, 17))
    with pytest.raises(setup.SetupError, match='Install test dependencies.*17'):
        setup.run_step('Install test dependencies', ['unused'], tmp_path)


def test_checkout_validation_does_not_expose_secret_in_an_error(monkeypatch):
    # saturn.cli.checkout.environment.input.valid: service validation errors expose key names only.
    values = {'SATURN_PORT': '0', 'LOCAL_SERVER_API_KEY': 'synthetic-do-not-print'}
    with pytest.raises(setup.SetupError) as error:
        setup.validate_env(values, ''.join(f'{k}={json.dumps(v)}\n' for k, v in values.items()))
    assert 'SATURN_PORT' in str(error.value)
    assert 'synthetic-do-not-print' not in str(error.value)


@pytest.mark.parametrize('version', ['20.18.0', '21.7.0', '22.11.0'])
def test_checkout_refuses_node_versions_outside_the_dashboard_contract(version, monkeypatch):
    # saturn.cli.checkout.tools.tools: unsupported Node versions stop before installation.
    monkeypatch.setattr(setup.shutil, 'which', lambda name: f'/test/{name}')
    versions = {'uv': '0.13.4', 'node': version, 'npm': '11.19.1'}
    monkeypatch.setattr(setup.subprocess, 'run', lambda argv, **kwargs: subprocess.CompletedProcess(
        argv, 0, stdout=versions[Path(argv[0]).name]))
    with pytest.raises(setup.SetupError, match='unsupported'):
        setup.check_tools()


def test_checkout_stops_only_the_owned_child_after_startup_timeout(tmp_path, monkeypatch):
    # saturn.cli.checkout.smoke.smoke_fail_stop: timeout terminates and then kills only its child.
    from types import SimpleNamespace

    operations = []

    class Child:
        pid = 4242

        def poll(self):
            return None

        def terminate(self):
            operations.append('terminate')

        def kill(self):
            operations.append('kill')

        def wait(self, timeout):
            operations.append(('wait', timeout))
            if operations.count(('wait', timeout)) == 1:
                raise subprocess.TimeoutExpired('owned smoke child', timeout)
            return 0

    clock = iter([0, 61])
    monkeypatch.setattr(setup, 'ROOT', tmp_path)
    monkeypatch.setattr(setup, 'time', SimpleNamespace(monotonic=lambda: next(clock)))
    monkeypatch.setattr(setup.subprocess, 'Popen', lambda *args, **kwargs: Child())
    monkeypatch.setattr(setup.subprocess, 'run', lambda argv, **kwargs: operations.append('taskkill'))
    with pytest.raises(setup.SetupError, match='Isolated startup failed'):
        setup.smoke_check()
    stop = 'taskkill' if setup.sys.platform == 'win32' else 'terminate'
    assert operations == [stop, ('wait', 10), 'kill', ('wait', 10)]
    assert list((tmp_path / 'var' / 'guided-setup').glob('smoke-*.log'))
    assert not list((tmp_path / 'var' / 'guided-setup').glob('smoke-*/'))


def test_checkout_checks_prepare_pytest_parent_folders(tmp_path, monkeypatch):
    # saturn.cli.checkout.verification.run_checks: a fresh checkout needs no pre-existing runtime folders.
    import sys

    monkeypatch.setitem(sys.modules, 'setup', setup)
    spec = importlib.util.spec_from_file_location('checkout_checks', Path(__file__).parents[1] / 'check.py')
    assert spec and spec.loader
    checks = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(checks)
    monkeypatch.setattr(setup, 'ROOT', tmp_path)
    monkeypatch.setattr(setup, 'check_tools', lambda: None)
    monkeypatch.setattr(setup, 'command', lambda name: name)
    monkeypatch.setattr(setup, 'smoke_check', lambda: None)
    temporary_roots = []

    def external_command(label, argv, cwd, env=None):
        if '--basetemp' in argv:
            destination = Path(argv[argv.index('--basetemp') + 1])
            # pytest creates this final directory, but requires its parent to exist.
            destination.mkdir()
            temporary_roots.append(destination)

    monkeypatch.setattr(setup, 'run_step', external_command)
    assert checks.main() == 0
    assert temporary_roots == [tmp_path / 'var' / 'pytest', tmp_path / 'var' / 'bench' / 'pytest']


def test_checkout_stops_the_whole_windows_process_tree(monkeypatch):
    # saturn.cli.checkout.smoke.smoke_fail_stop: on Windows the launcher's child interpreter stops with its parent.
    calls = []

    class Child:
        pid = 4242

        def terminate(self):
            calls.append('terminate')

        def kill(self):
            calls.append('kill')

        def wait(self, timeout):
            calls.append(('wait', timeout))
            return 0

    monkeypatch.setattr(setup.sys, 'platform', 'win32')
    monkeypatch.setattr(setup.subprocess, 'run', lambda argv, **kwargs: calls.append(argv))
    setup.stop_owned_process(Child())
    assert calls == [['taskkill', '/PID', '4242', '/T', '/F'], ('wait', 10)]
