"""Check that dashboard responses do not trigger an immediate request loop.

Run from the project root: python3 apps/web/tests/polling.py --url http://127.0.0.1:19001
Requires Firefox and geckodriver. Reads dashboard data without changing configuration.
"""

import argparse
import time

from browser import Browser


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    args = parser.parse_args()
    with Browser() as b:
        for route, endpoint in [('runs', '/api/runs?'), ('changes', '/api/events?')]:
            b.url(args.url.rstrip('/') + '/#/' + route)
            b.request('POST', b.session + '/refresh', {})
            b.wait("return document.querySelector('h1')?.textContent==='Runs'")
            b.js("window.__requests=[];const original=window.fetch;window.fetch=(...args)=>{window.__requests.push(String(args[0]));return original(...args)}")
            time.sleep(1)
            count = b.js('return window.__requests.filter(x=>x.startsWith(arguments[0])).length', endpoint)
            # saturn.dashboard.polling: a response does not trigger a new refresh effect.
            assert count <= 2, f'{route}: expected at most two startup requests in one second; observed {count}'
            print(f'PASS: {route} made {count} requests in one second, within the startup allowance.')
            if route == 'runs':
                b.js('window.__requests=[]')
                b.click('Failed')
                b.wait("return window.__requests.some(x=>x.includes('status=error'))")
                print('PASS: changing the Runs filter refreshes the data immediately.')
                b.js('window.__requests=[]')
                time.sleep(6)
                count = b.js('return window.__requests.filter(x=>x.startsWith(arguments[0])).length', endpoint)
                assert 1 <= count <= 2, f'Runs must continue polling near its five-second interval; observed {count} requests in six seconds'
                print(f'PASS: Runs continued polling with {count} requests in six seconds.')
            else:
                b.js('window.__requests=[]')
                b.click('Access')
                b.wait("return window.__requests.some(x=>x.includes('kind=access'))")
                print('PASS: changing the Changes filter refreshes the data immediately.')


if __name__ == '__main__':
    main()
