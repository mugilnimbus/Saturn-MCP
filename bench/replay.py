"""Emit one registered capture inside an input-only benchmark workspace."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    root = Path.cwd().resolve()
    captures = json.loads((root / '_captures.json').read_text(encoding='utf-8'))
    name = sys.argv[1] if len(sys.argv) == 2 else ''
    if name not in captures:
        print('Unregistered capture.', file=sys.stderr)
        return 2
    entry = captures[name]
    asset = (root / entry['asset']).resolve()
    if not asset.is_relative_to(root) or not asset.is_file():
        print('Capture path is outside the workspace or absent.', file=sys.stderr)
        return 2
    sys.stdout.buffer.write(asset.read_bytes())
    return int(entry['exit_code'])


if __name__ == '__main__':
    raise SystemExit(main())
