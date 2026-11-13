"""Small WebDriver fixture for optional Firefox checks against a running dashboard."""

import json
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path


class Browser:
    def request(self, method, path, value=None):
        data = None if value is None else json.dumps(value).encode()
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)['value']

    def __enter__(self):
        output = Path('var/ui-review')
        output.mkdir(parents=True, exist_ok=True)
        self.profiles = tempfile.TemporaryDirectory(dir=output)
        self.log = (output / 'keyboard-driver.log').open('w')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        self.base = f'http://127.0.0.1:{port}'
        self.driver = subprocess.Popen(['geckodriver', '--port', str(port), '--profile-root', self.profiles.name],
                                       stdout=self.log, stderr=subprocess.STDOUT)
        self.session = None
        try:
            for attempt in range(100):
                try:
                    self.request('GET', '/status')
                    break
                except OSError:
                    if attempt == 99:
                        raise
                    time.sleep(.1)
            self.session = '/session/' + self.request('POST', '/session', {'capabilities': {'alwaysMatch': {
                'browserName': 'firefox', 'moz:firefoxOptions': {'args': ['-headless']},
            }}})['sessionId']
            return self
        except BaseException:
            self.__exit__(None, None, None)
            raise

    def __exit__(self, *_):
        try:
            if self.session:
                self.request('DELETE', self.session)
        finally:
            self.driver.terminate()
            self.driver.wait(timeout=10)
            self.log.close()
            self.profiles.cleanup()

    def url(self, url):
        self.request('POST', self.session + '/url', {'url': url})

    def js(self, script, *args):
        return self.request('POST', self.session + '/execute/sync', {'script': script, 'args': list(args)})

    def wait(self, script):
        for _ in range(200):
            value = self.js(script)
            if value:
                return value
            time.sleep(.05)
        raise AssertionError('Dashboard did not reach the expected state: ' + script)

    def key(self, key):
        self.request('POST', self.session + '/actions', {'actions': [{
            'type': 'key', 'id': 'keyboard', 'actions': [
                {'type': 'keyDown', 'value': key}, {'type': 'keyUp', 'value': key},
            ],
        }]})

    def click(self, text):
        element = self.js("const root=[...document.querySelectorAll('[role=dialog]')].at(-1) ?? document; return [...root.querySelectorAll('button')].find(x => x.textContent.trim() === arguments[0] && x.getClientRects().length)", text)
        assert element, f'No visible button: {text}'
        self.request('POST', self.session + '/element/' + element['element-6066-11e4-a52e-4f735466cecf'] + '/click', {})

    def fill(self, selector, value):
        self.js("const input=document.querySelector(arguments[0]); input.value=arguments[1]; input.dispatchEvent(new Event('input',{bubbles:true}));", selector, value)
