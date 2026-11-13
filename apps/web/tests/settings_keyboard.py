"""Check Settings tab focus in Firefox against a running dashboard.

Run from the project root: python3 apps/web/tests/settings_keyboard.py --url http://127.0.0.1:19001
Requires Firefox and geckodriver. Uses only the Python standard library.
"""

import argparse
import time

from browser import Browser


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    args = parser.parse_args()
    with Browser() as b:
        js = b.js
        b.url(args.url.rstrip('/') + '/#/settings/appearance')
        b.wait("return !!document.querySelector('#tab-appearance')")
        js("document.querySelector('#tab-appearance').focus()")
        # saturn.dashboard.settings.ui_render: arrow navigation keeps focus on the selected tab.
        for key, expected in [('\ue014', 'model'), ('\ue014', 'commands'),
                              ('\ue012', 'model'), ('\ue012', 'appearance')]:
            b.key(key)
            for _ in range(100):
                selected = js("return document.querySelector('[role=tab][aria-selected=true]')?.id")
                if selected == 'tab-' + expected:
                    break
                time.sleep(.05)
            actual = js("return {focus:document.activeElement.id, selected:document.querySelector('[role=tab][aria-selected=true]')?.id}")
            assert actual == {'focus': 'tab-' + expected, 'selected': 'tab-' + expected}, (
                f'Settings must focus the selected tab after an arrow key: expected {expected}, got {actual}'
            )
        print('PASS: Settings arrow keys move focus and selection together, including wraparound.')

        js("location.hash='/settings/model'")
        b.wait("return !!document.querySelector('#base-url')")
        js("const input=document.querySelector('#base-url'); input.value='http://127.0.0.1:12345/v1'; input.dispatchEvent(new Event('input',{bubbles:true}));")
        b.wait("return !!document.querySelector('.savebar')")
        for discard in (False, True):
            js("document.querySelector('#tab-model').focus()")
            b.key('\ue014')
            b.wait("return !!document.querySelector('[role=dialog]')")
            b.click('Discard changes' if discard else 'Keep editing')
            expected = 'commands' if discard else 'model'
            b.wait("return document.activeElement.id === 'tab-" + expected + "'")
            assert js("return document.querySelector('[role=tab][aria-selected=true]').id") == 'tab-' + expected
            if not discard:
                assert js("return document.querySelector('#base-url').value") == 'http://127.0.0.1:12345/v1'
        print('PASS: Keeping a draft retains focus and edits; discarding moves focus to the selected tab.')


if __name__ == '__main__':
    main()
