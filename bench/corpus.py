"""Public interface for the shared, source-grounded golden corpus."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

TOOLS = ('saturn_run', 'saturn_read', 'saturn_search', 'saturn_ask', 'saturn_query')
METADATA = ('cases.json', 'captures.json', 'selection.json', 'scoring.json', 'schema.json')


class CorpusError(ValueError):
    """The corpus or its destination violates the preparation contract."""


class Record(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)


class Asset(Record):
    path: str
    sha256: str = Field(pattern=r'^[0-9a-f]{64}$')
    bytes: int = Field(ge=0)
    role: Literal['source', 'controlled', 'licence', 'capture', 'secret_fixture']
    family: str
    upstream_path: str | None = None
    upstream_url: str | None = None
    derived_from: str | None = None
    change: str | None = None
    workspace_path: str | None = None


class Source(Record):
    id: str
    repository: str
    revision: str = Field(pattern=r'^[0-9a-f]{40}$')
    archive_url: str
    archive_sha256: str = Field(pattern=r'^[0-9a-f]{64}$')
    family: str
    split: Literal['development', 'evaluation']
    ecosystem: str
    licence: str = Field(min_length=1)
    licence_assets: list[str] = Field(min_length=1)
    decision: Literal['included']
    selection_reason: str = Field(min_length=1)
    ancestry_notes: str = Field(min_length=1)


class Manifest(Record):
    schema_version: Literal[1]
    version: str
    state: Literal['candidate']
    sources: list[Source]
    assets: list[Asset]
    metadata_sha256: dict[str, str]
    coverage_floor: dict[str, int]
    duplicate_policy: dict[str, Any]


class Evidence(Record):
    asset: str
    start: int = Field(ge=1)
    end: int = Field(ge=1)
    quote: str


class Fact(Record):
    id: str
    text: str
    evidence: list[int]
    acceptable_alternatives: list[str] = Field(default_factory=list)


class Oracle(Record):
    expected_outcome: Literal['success', 'command_nonzero', 'no_matches', 'abstain', 'policy_refusal']
    facts: list[Fact]
    evidence: list[Evidence]
    reference_answer: str | None
    forbidden_claims: list[str]
    scoring: Literal['semantic-rubric-v1', 'exact-evidence-v1']
    abstention_required: bool


class Workflow(Record):
    producer: dict[str, Any] | None
    follow_ups: list[dict[str, Any]]
    termination: str
    max_calls: int = Field(ge=1)


class Review(Record):
    author: str
    method: str
    independent_human: Literal['pending', 'not_required_exact_oracle']
    reviewer: str | None
    resolution: str | None


class Case(Record):
    id: str
    family: str
    split: Literal['development', 'evaluation']
    primary_tool: Literal['saturn_run', 'saturn_read', 'saturn_search', 'saturn_ask', 'saturn_query']
    title: str
    coverage: dict[str, str]
    request: dict[str, Any]
    workflow: Workflow
    oracle: Oracle
    budgets: dict[str, Any]
    lifecycle: dict[str, Any]
    review: Review


class CorpusFormat(Record):
    """Published JSON schema for the manifest and case catalogue together."""

    manifest: Manifest
    cases: list[Case]


@dataclass(frozen=True)
class ValidationReport:
    errors: list[str]
    pending_reviews: list[str]
    coverage: dict[str, Any]
    duplicates: list[dict[str, Any]]
    corpus_sha256: str

    @property
    def valid(self) -> bool:
        return not self.errors

    @property
    def ready_to_freeze(self) -> bool:
        return self.valid and not self.pending_reviews

    def as_dict(self) -> dict[str, Any]:
        return {**asdict(self), 'valid': self.valid, 'ready_to_freeze': self.ready_to_freeze}


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()


def _read(root: Path, name: str) -> Any:
    try:
        return json.loads((root / name).read_text(encoding='utf-8'))
    except (OSError, ValueError) as error:
        raise CorpusError(f'Cannot read corpus JSON: {name}') from error


def _path(root: Path, relative: str) -> Path:
    path = PurePosixPath(relative)
    if not relative or path.is_absolute() or '..' in path.parts or '\\' in relative or ':' in relative:
        raise CorpusError(f'Invalid corpus path: {relative}')
    candidate = root.joinpath(*path.parts)
    if candidate.is_symlink() or not candidate.resolve().is_relative_to(root.resolve()):
        raise CorpusError(f'Escaping corpus path: {relative}')
    return candidate


def _tokens(text: str) -> set[tuple[str, ...]]:
    words = re.findall(r'\w+', text.lower())
    return {tuple(words[i:i + 5]) for i in range(max(0, len(words) - 4))}


def _duplicates(root: Path, assets: list[Asset], sources: dict[str, Source]) -> list[dict[str, Any]]:
    candidates = [(a, _tokens(_path(root, a.path).read_text(encoding='utf-8'))) for a in assets
                  if a.role in {'source', 'controlled'}]
    findings = []
    for i, (left, left_tokens) in enumerate(candidates):
        for right, right_tokens in candidates[i + 1:]:
            if sources[left.family].split == sources[right.family].split:
                continue
            union = left_tokens | right_tokens
            similarity = len(left_tokens & right_tokens) / len(union) if union else 1.0
            if similarity >= 0.8:
                findings.append({'left': left.path, 'right': right.path, 'jaccard': round(similarity, 4)})
    return findings


def validate(root: Path) -> ValidationReport:
    """Validate all inputs without model calls or writes. Pending review is explicit."""
    root = root.resolve()
    errors: list[str] = []
    coverage: dict[str, Any] = {}
    try:
        manifest = Manifest.model_validate(_read(root, 'manifest.json'))
        cases = [Case.model_validate(c) for c in _read(root, 'cases.json')]
    except ValidationError as error:
        locations = ['.'.join(map(str, item['loc'])) for item in error.errors()]
        return ValidationReport(['schema: ' + ', '.join(locations)], [], {}, [], '')
    except (CorpusError, TypeError) as error:
        return ValidationReport([str(error)], [], {}, [], '')
    sources = {s.family: s for s in manifest.sources}
    assets = {a.path: a for a in manifest.assets}
    if len(sources) != len(manifest.sources):
        errors.append('duplicate source family')
    if len(assets) != len(manifest.assets):
        errors.append('duplicate asset path')
    workspace_paths = [a.workspace_path or a.path for a in manifest.assets]
    if len(set(workspace_paths)) != len(workspace_paths):
        errors.append('duplicate materialized workspace path')
    for asset in manifest.assets:
        if asset.workspace_path is not None and (
            asset.role != 'secret_fixture' or asset.workspace_path != f'sources/{asset.family}/.env'
        ):
            errors.append(f'unapproved workspace alias: {asset.path}')
    for asset in manifest.assets:
        try:
            path = _path(root, asset.path)
            _path(root, asset.workspace_path or asset.path)
            data = path.read_bytes()
            data.decode('utf-8')
            if len(data) != asset.bytes or _sha(data) != asset.sha256:
                errors.append(f'asset digest or size mismatch: {asset.path}')
            if asset.family not in sources:
                errors.append(f'asset has unknown family: {asset.path}')
            if asset.role == 'controlled' and (asset.derived_from not in assets or not asset.change):
                errors.append(f'controlled asset lacks provenance: {asset.path}')
        except (CorpusError, OSError, UnicodeError) as error:
            errors.append(f'asset path/read error: {error}')
    for source in manifest.sources:
        for name in source.licence_assets:
            if name not in assets or assets[name].role != 'licence' or assets[name].family != source.family:
                errors.append(f'licence record missing or invalid: {source.family}')
    for name in METADATA:
        try:
            if _sha((root / name).read_bytes()) != manifest.metadata_sha256.get(name):
                errors.append(f'metadata digest mismatch: {name}')
        except OSError:
            errors.append(f'missing metadata: {name}')
    ids = Counter(c.id for c in cases)
    if any(count > 1 for count in ids.values()):
        errors.append('duplicate case ID')
    families: dict[str, set[str]] = defaultdict(set)
    tools = Counter(c.primary_tool for c in cases)
    splits = Counter(c.split for c in cases)
    counts: Counter[tuple[str, str]] = Counter((c.split, c.primary_tool) for c in cases)
    try:
        capture_rows = _read(root, 'captures.json')
        captures = {c['id']: c for c in capture_rows}
        for capture in capture_rows:
            if capture['asset'] not in assets or assets[capture['asset']].role != 'capture':
                errors.append('capture has no registered asset')
            if capture['family'] not in sources or not isinstance(capture['exit_code'], int):
                errors.append('capture has invalid family or exit status')
            if not re.fullmatch(r'[0-9a-f]{64}', capture['original_sha256']):
                errors.append('capture has invalid original digest')
    except (CorpusError, TypeError, KeyError):
        errors.append('schema: invalid capture metadata')
        captures = {}
    for case in cases:
        families[case.family].add(case.split)
        case_source = sources.get(case.family)
        if case_source is None or case_source.split != case.split:
            errors.append(f'split or family mismatch: {case.id}')
        if case.coverage.get('expected_outcome') != case.oracle.expected_outcome:
            errors.append(f'outcome disagreement: {case.id}')
        expected_calls = 1 + len(case.workflow.follow_ups) + int(case.workflow.producer is not None)
        if case.workflow.max_calls != expected_calls:
            errors.append(f'workflow call budget mismatch: {case.id}')
        for evidence in case.oracle.evidence:
            try:
                if evidence.asset not in assets or assets[evidence.asset].family != case.family:
                    raise CorpusError('unknown or cross-family evidence asset')
                lines = _path(root, evidence.asset).read_text(encoding='utf-8').splitlines()
                if evidence.end < evidence.start or evidence.end > len(lines):
                    raise CorpusError('invalid evidence range')
                if '\n'.join(lines[evidence.start - 1:evidence.end]) != evidence.quote:
                    raise CorpusError('evidence quote does not match its source')
            except (CorpusError, OSError, UnicodeError) as error:
                errors.append(f'evidence error {case.id}: {error}')
        for fact in case.oracle.facts:
            if any(i < 0 or i >= len(case.oracle.evidence) for i in fact.evidence):
                errors.append(f'evidence index out of bounds: {case.id}/{fact.id}')
            if fact.id == 'exit-status':
                capture = captures.get(case.request.get('capture_id'))
                if capture is None or fact.text != f"Command exit status is {capture['exit_code']}.":
                    errors.append(f'capture exit-status oracle mismatch: {case.id}')
        producer = case.workflow.producer
        if producer and (producer.get('capture_id') not in captures or not producer.get('save_artifact')):
            errors.append(f'invalid artifact producer: {case.id}')
    if any(len(values) > 1 for values in families.values()):
        errors.append('source-family split leakage')
    expected = {'development': 20, 'evaluation': 40}
    if dict(splits) != expected or len(cases) != 60 or len(families) < 6:
        errors.append('coverage: require 60 cases, a 20/40 split, and six families')
    if any(counts[(split, tool)] != count for split, count in [('development', 4), ('evaluation', 8)] for tool in TOOLS):
        errors.append('coverage: primary tools must have 4 development and 8 evaluation cases each')
    if len({s.ecosystem for s in manifest.sources}) < 3:
        errors.append('coverage: fewer than three ecosystems')
    if any(sum(s.split == split for s in manifest.sources) < count for split, count in [('development', 2), ('evaluation', 4)]):
        errors.append('coverage: insufficient independent families in a split')
    declared = set(assets) | set(METADATA) | {'manifest.json', 'reviews.json', 'frozen.json'}
    for path in root.rglob('*'):
        if path.is_file() and path.relative_to(root).as_posix() not in declared:
            errors.append(f'unregistered corpus asset: {path.relative_to(root)}')
    coverage = {'cases': len(cases), 'splits': dict(splits), 'tools': dict(sorted(tools.items())),
                'families': {k: sorted(v) for k, v in sorted(families.items())},
                'ecosystems': dict(Counter(s.ecosystem for s in manifest.sources)),
                'outcomes': dict(Counter(c.oracle.expected_outcome for c in cases)),
                'asset_bytes': sum(a.bytes for a in manifest.assets)}
    pending = [c.id for c in cases if c.oracle.scoring == 'semantic-rubric-v1']
    review_path = root / 'reviews.json'
    reviews = _read(root, 'reviews.json') if review_path.exists() else []
    if not isinstance(reviews, list) or not all(isinstance(r, dict) for r in reviews):
        errors.append('schema: reviews must be a list of records')
        reviews = []
    for review in reviews:
        reviewed_case = next((c for c in cases if c.id == review.get('case_id')), None)
        if reviewed_case is None:
            errors.append('review refers to unknown case')
            continue
        expected_hash = _sha(_canonical(reviewed_case.oracle.model_dump()))
        if review.get('oracle_sha256') != expected_hash:
            errors.append(f'review label digest mismatch: {reviewed_case.id}')
        elif review.get('case_sha256') != _sha(_canonical(reviewed_case.model_dump())):
            errors.append(f'review case context digest mismatch: {reviewed_case.id}')
        elif (review.get('decision') == 'accepted' and review.get('reviewer')
              and review.get('basis') == 'independent human source review' and reviewed_case.id in pending):
            pending.remove(reviewed_case.id)
    duplicates: list[dict[str, Any]] = []
    if not errors:
        duplicates = _duplicates(root, manifest.assets, sources)
        if duplicates:
            errors.append('cross-split near-duplicate source content')
    fingerprint = {'manifest': manifest.model_dump(), 'metadata': manifest.metadata_sha256,
                   'reviews_sha256': _sha(review_path.read_bytes()) if review_path.exists() else None}
    corpus_hash = _sha(_canonical(fingerprint))
    if (root / 'frozen.json').exists():
        frozen = _read(root, 'frozen.json')
        if frozen.get('corpus_sha256') != corpus_hash:
            errors.append('frozen corpus identity changed; a new version is required')
    return ValidationReport(errors, pending, coverage, duplicates, corpus_hash)


def freeze(root: Path) -> dict[str, str]:
    """Write a freeze marker only after integrity and independent-review checks pass."""
    report = validate(root)
    if not report.valid:
        raise CorpusError('Corpus invalid: ' + '; '.join(report.errors))
    if report.pending_reviews:
        raise CorpusError(f'Independent review pending for {len(report.pending_reviews)} semantic labels')
    marker = {'corpus_sha256': report.corpus_sha256, 'manifest_sha256': _sha((root / 'manifest.json').read_bytes())}
    path = root / 'frozen.json'
    if path.exists():
        if _read(root, 'frozen.json') != marker:
            raise CorpusError('Existing freeze marker differs; create a new dataset version')
        return marker
    with path.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(marker, indent=2) + '\n')
    return marker


def materialize(root: Path, destination: Path) -> list[str]:
    """Copy only input assets into a new workspace. Keep labels outside it."""
    report = validate(root)
    if not report.valid:
        raise CorpusError('Corpus invalid: ' + '; '.join(report.errors))
    root, destination = root.resolve(), destination.resolve()
    if destination.is_relative_to(root) or root.is_relative_to(destination):
        raise CorpusError('Workspace must be outside the dataset')
    if destination.exists() and any(destination.iterdir()):
        raise CorpusError('Workspace must be empty')
    manifest = Manifest.model_validate(_read(root, 'manifest.json'))
    destination.mkdir(parents=True, exist_ok=True)
    copied = []
    for asset in manifest.assets:
        relative = asset.workspace_path or asset.path
        output = _path(destination, relative)
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(_path(root, asset.path), output)
        copied.append(relative)
    return copied


def review_records(root: Path) -> list[dict[str, Any]]:
    """Return source-grounded review packets without claiming an independent reviewer."""
    report = validate(root)
    if not report.valid:
        raise CorpusError('Corpus invalid: ' + '; '.join(report.errors))
    cases = [Case.model_validate(c) for c in _read(root, 'cases.json')]
    return [{'case_id': c.id, 'question': c.request.get('task', c.request.get('question', c.title)),
             'input': c.request, 'producer': c.workflow.producer, 'case_sha256': _sha(_canonical(c.model_dump())),
             'oracle': c.oracle.model_dump(), 'oracle_sha256': _sha(_canonical(c.oracle.model_dump())),
             'reviewer': None, 'basis': 'independent human source review', 'decision': 'pending'}
            for c in cases if c.oracle.scoring == 'semantic-rubric-v1']
