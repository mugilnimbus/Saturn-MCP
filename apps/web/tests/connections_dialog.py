"""Check harness draft and dialog focus behavior against an isolated dashboard.

Run from the project root: python3 apps/web/tests/connections_dialog.py --url http://127.0.0.1:19001
Requires Firefox and geckodriver. Creates and revokes one temporary harness.
"""

import argparse
import json
import urllib.request
import uuid

from browser import Browser


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    args = parser.parse_args()
    base = args.url.rstrip('/')
    # Refuse client-write checks against real user configuration.
    with urllib.request.urlopen(base + '/api/connections') as response:
        clients = json.load(response)['clients']
    assert all('/var/' in path.replace('\\', '/') for client in clients for path in client['files']), (
        'Use an isolated Saturn service with both client directories under var/.'
    )
    name = 'Browser regression ' + uuid.uuid4().hex[:8]
    harness_id = None
    try:
        with Browser() as b:
            b.url(base + '/#/connections')
            b.wait("return [...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='Create harness')")
            b.click('Create harness')
            b.wait("return !!document.querySelector('#h-name')")
            # saturn.dashboard.connections.ui_create: unchanged drafts close without discard confirmation.
            b.key('\ue00c')
            b.wait("return !document.querySelector('[role=dialog]')")
            print('PASS: Escape closes an untouched new harness without a discard question.')
            b.click('Create harness')
            b.wait("return !!document.querySelector('#h-name')")
            b.fill('#h-name', name)
            b.key('\ue00c')
            b.wait("return document.querySelectorAll('[role=dialog]').length===2")
            b.key('\ue00c')
            b.wait("return document.querySelectorAll('[role=dialog]').length===1")
            assert b.js("return document.querySelector('[role=dialog]').contains(document.activeElement)")
            assert b.js("return document.querySelector('#h-name').value") == name
            print('PASS: Escape dismisses only the discard question and retains the harness draft.')
            b.click('Create harness')
            b.wait("return !!document.querySelector('#h-token')")
            with urllib.request.urlopen(base + '/api/connections') as response:
                harness_id = next(h['id'] for h in json.load(response)['harnesses'] if h['name'] == name)
            b.click('Install in a client')
            b.wait("return [...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='Preview changes')")
            b.click('Preview changes')
            b.wait("return !!document.querySelector('.plan')")
            # saturn.dashboard.shell: updates retain focus inside the active dialog.
            assert b.js("return document.querySelector('[role=dialog]').contains(document.activeElement)"), (
                'Dialog must retain focus when the active preview button is disabled or removed.'
            )
            b.key('\ue00c')
            b.wait("return !document.querySelector('[role=dialog]')")
            print('PASS: Preview updates retain dialog focus, and Escape closes the dialog.')
    finally:
        if harness_id:
            request = urllib.request.Request(base + '/api/connections/' + harness_id, method='DELETE',
                                             headers={'X-Client': 'web'})
            with urllib.request.urlopen(request) as response:
                response.read()


if __name__ == '__main__':
    main()
