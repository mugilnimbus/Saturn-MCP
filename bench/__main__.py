"""Inspect and validate the shared corpus: python -m bench --help."""

from __future__ import annotations

import argparse
import asyncio
import json
import time
from pathlib import Path
from typing import Any

from bench.corpus import CorpusError, freeze, materialize, review_records, validate


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate', 'review', 'materialize', 'freeze', 'run', 'internal', 'savings',
                                            'agent-prepare', 'agent-prompts', 'agent-grade'])
    parser.add_argument('--dataset', type=Path, default=Path(__file__).resolve().parent / 'dataset')
    parser.add_argument('--output', type=Path, help='Report path, or a new workspace for materialize')
    parser.add_argument('--provisional', action='store_true', help='Run a candidate without claiming reviewed golden quality')
    parser.add_argument('--model-env', type=Path, default=Path.home() / '.saturn' / '.env',
                        help='Ignored environment file supplying only the model-server credential')
    parser.add_argument('--baseline', type=Path, help='Earlier environment record for compatibility comparison')
    parser.add_argument('--phase-limit', type=int, help='Diagnostic prefix only; reports all omitted phases')
    parser.add_argument('--input', type=Path, help='Recorded case results for the savings analysis')
    parser.add_argument('--cap-bytes', type=int, default=32768, help='Truncation cap for the capped raw baseline')
    args = parser.parse_args()
    result: Any
    try:
        if args.command in ('run', 'internal'):
            from bench.runner import execute, execute_internal
            destination = args.output or Path(__file__).resolve().parents[1] / 'var' / 'bench' / time.strftime('%Y%m%d-%H%M%S')
            if args.phase_limit is not None and args.phase_limit < 1:
                parser.error('--phase-limit must be positive')
            if args.command == "internal":
                result = asyncio.run(execute_internal(args.dataset, destination, args.model_env, provisional=args.provisional,
                                                     phase_limit=args.phase_limit))
            else:
                result = asyncio.run(execute(args.dataset, destination, args.model_env, provisional=args.provisional,
                                             baseline=args.baseline, phase_limit=args.phase_limit))
            print(f'Results: {destination.resolve() / "summary.json"}')
            return 1 if result['failures'] or result['omitted_workflows'] else 0
        if args.command.startswith('agent-'):
            from bench import agent
            if args.command == 'agent-grade':
                if args.input is None:
                    parser.error('agent-grade requires --input with recorded runs')
                result = agent.grade(json.loads(args.input.read_text(encoding='utf-8')))
            elif args.output is None:
                parser.error(f'{args.command} requires --output with the task workspace')
            elif args.command == 'agent-prepare':
                result = agent.prepare(args.dataset, args.output)
            else:
                result = agent.prompts(args.output)
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return 0
        if args.command == 'savings':
            if args.input is None:
                parser.error('savings requires --input with recorded case results')
            from bench.savings import analyze
            result, code = analyze(json.loads(args.input.read_text(encoding='utf-8')), args.cap_bytes), 0
        elif args.command == 'validate':
            report = validate(args.dataset)
            result = report.as_dict()
            code = 0 if report.valid else 1
        elif args.command == 'review':
            result, code = review_records(args.dataset), 0
        elif args.command == 'freeze':
            result, code = freeze(args.dataset), 0
        else:
            if args.output is None:
                parser.error('materialize requires --output for a new input-only workspace')
            result = {'copied_assets': materialize(args.dataset, args.output)}
            print(json.dumps(result, indent=2))
            return 0
        text = json.dumps(result, indent=2, ensure_ascii=False) + '\n'
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(text, encoding='utf-8', newline='\n')
        else:
            print(text, end='')
        return code
    except (CorpusError, OSError, ValueError) as error:
        print(f'Corpus stopped: {error}')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
