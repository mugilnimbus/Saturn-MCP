"""Golden-corpus contract tests; mutations are unit inputs, never benchmark cases."""

import json
import shutil
from pathlib import Path

import pytest

from bench.corpus import CorpusError, freeze, materialize, review_records, validate

DATASET = Path(__file__).resolve().parents[1] / 'dataset'


@pytest.fixture
def candidate(tmp_path):
    shutil.copytree(DATASET, tmp_path / 'dataset')
    return tmp_path / 'dataset'


def edit(path, transform):
    value = json.loads(path.read_text(encoding='utf-8'))
    transform(value)
    path.write_text(json.dumps(value, indent=2) + '\n')


def test_corpus_has_one_complete_balanced_candidate():
    # benchmark.curation.labels.coverage: 60 cases, 20/40, six families, five tools.
    report = validate(DATASET)
    assert report.valid, report.errors
    assert report.coverage['cases'] == 60
    assert report.coverage['splits'] == {'development': 20, 'evaluation': 40}
    assert len(report.coverage['families']) == 6
    assert set(report.coverage['tools'].values()) == {12}


def test_corpus_rejects_changed_source_bytes(candidate):
    # benchmark.curation.sources.assets_valid: asset content must match its digest.
    asset = json.loads((candidate / 'manifest.json').read_text(encoding='utf-8'))['assets'][0]
    (candidate / asset['path']).write_bytes(b'changed source\n')
    assert any('digest' in e for e in validate(candidate).errors)


def test_corpus_rejects_escaping_asset_path(candidate):
    # benchmark.curation.sources.assets_valid: corpus paths stay under the dataset.
    edit(candidate / 'manifest.json', lambda m: m['assets'][0].update(path='../outside'))
    assert any('path' in e for e in validate(candidate).errors)


def test_corpus_rejects_missing_licence(candidate):
    # benchmark.curation.sources.licence: every source retains redistribution evidence.
    edit(candidate / 'manifest.json', lambda m: m['sources'][0].update(licence=''))
    assert any('licence' in e for e in validate(candidate).errors)


def test_corpus_rejects_cross_split_source_family(candidate):
    # benchmark.curation.labels.separated: source families cannot cross the split.
    edit(candidate / 'cases.json', lambda cases: cases[0].update(split='evaluation'))
    assert any('split' in e for e in validate(candidate).errors)


def test_corpus_rejects_duplicate_case_id(candidate):
    # benchmark.curation.freeze.valid: case identities are unique.
    edit(candidate / 'cases.json', lambda cases: cases[1].update(id=cases[0]['id']))
    assert any('duplicate case' in e for e in validate(candidate).errors)


def test_corpus_rejects_invalid_evidence(candidate):
    # benchmark.curation.labels.review: evidence must match its source lines.
    edit(candidate / 'cases.json', lambda cases: cases[0]['oracle']['evidence'][0].update(quote='not present'))
    assert any('evidence' in e for e in validate(candidate).errors)


def test_corpus_rejects_incomplete_coverage(candidate):
    # benchmark.curation.labels.coverage: a partial corpus cannot pass validation.
    edit(candidate / 'cases.json', lambda cases: cases.pop())
    assert any('coverage' in e for e in validate(candidate).errors)


def test_corpus_freeze_refuses_unreviewed_semantic_labels(candidate):
    # benchmark.curation.labels.reviewed: pending human review blocks freezing.
    assert validate(candidate).pending_reviews
    with pytest.raises(CorpusError, match='review'):
        freeze(candidate)
    assert not (candidate / 'frozen.json').exists()


def test_corpus_materialization_excludes_labels_and_case_catalogue(candidate, tmp_path):
    # benchmark.curation.labels.oracle: the worker sees inputs, never scoring labels.
    workspace = tmp_path / 'workspace'
    materialize(candidate, workspace)
    assert (workspace / 'sources').is_dir()
    assert (workspace / 'captures').is_dir()
    assert not (workspace / 'cases.json').exists()
    assert not (workspace / 'manifest.json').exists()
    assert not (workspace / 'reviews.json').exists()
    assert not (workspace / 'schema.json').exists()


def test_corpus_materialization_refuses_existing_data(candidate, tmp_path):
    # benchmark.curation.sources.capture: never overwrite an existing workspace.
    workspace = tmp_path / 'workspace'
    workspace.mkdir()
    (workspace / 'keep.txt').write_text('keep')
    with pytest.raises(CorpusError, match='empty'):
        materialize(candidate, workspace)
    assert (workspace / 'keep.txt').read_text(encoding='utf-8') == 'keep'


def test_corpus_rejects_invalid_schema_shape(candidate):
    # benchmark.curation.freeze.valid: malformed case records are invalid.
    edit(candidate / 'cases.json', lambda cases: cases[0].update(workflow='invalid'))
    assert any('schema' in e for e in validate(candidate).errors)


def test_corpus_rejects_cross_split_near_duplicate_content(candidate):
    # benchmark.curation.labels.separated: recomputed hashes do not excuse copied holdout inputs.
    import hashlib

    source = candidate / 'sources/commander/lib/error.js'
    target = candidate / 'sources/requests/src/requests/adapters.py'
    target.write_bytes(source.read_bytes())
    def update(manifest):
        item = next(a for a in manifest['assets'] if a['path'] == target.relative_to(candidate).as_posix())
        item.update(sha256=hashlib.sha256(target.read_bytes()).hexdigest(), bytes=target.stat().st_size)
    edit(candidate / 'manifest.json', update)
    report = validate(candidate)
    assert report.duplicates
    assert any('near-duplicate' in e for e in report.errors)


def test_corpus_freezes_after_matching_independent_review_attestations(candidate):
    # benchmark.curation.freeze.publish: each acceptance is bound to its oracle digest.
    records = review_records(candidate)
    for record in records:
        record.update(reviewer='unit-test reviewer; no production attestation', decision='accepted')
    (candidate / 'reviews.json').write_text(json.dumps(records))
    marker = freeze(candidate)
    assert validate(candidate).ready_to_freeze
    assert marker['corpus_sha256'] == validate(candidate).corpus_sha256
    assert freeze(candidate) == marker


def test_corpus_rejects_review_changes_after_freezing(candidate):
    # benchmark.curation.freeze.publish: a changed frozen identity requires another version.
    records = review_records(candidate)
    for record in records:
        record.update(reviewer='unit-test reviewer; no production attestation', decision='accepted')
    (candidate / 'reviews.json').write_text(json.dumps(records))
    freeze(candidate)
    records[0]['reviewer'] = 'changed unit-test reviewer'
    (candidate / 'reviews.json').write_text(json.dumps(records))
    assert any('frozen corpus identity changed' in e for e in validate(candidate).errors)


def test_corpus_rejects_colliding_workspace_alias(candidate):
    # benchmark.access.workspace.copy: input aliases cannot overwrite another asset.
    def change(manifest):
        fixture = next(a for a in manifest['assets'] if a['role'] == 'secret_fixture')
        fixture['workspace_path'] = 'sources/commander/lib/option.js'
    edit(candidate / 'manifest.json', change)
    assert any('workspace' in e for e in validate(candidate).errors)


def test_corpus_rejects_a_review_of_different_expected_facts(candidate):
    # benchmark.curation.labels.reviewed: reviewer acceptance must match the exact oracle.
    record = review_records(candidate)[0]
    record.update(oracle_sha256='0' * 64, reviewer='unit-test reviewer', decision='accepted')
    (candidate / 'reviews.json').write_text(json.dumps([record]))
    assert any('review label digest mismatch' in e for e in validate(candidate).errors)


def test_corpus_rejects_broken_capture_metadata(candidate):
    # benchmark.curation.sources.assets_valid: malformed capture records are rejected.
    (candidate / 'captures.json').write_text('[{}]')
    assert any('capture metadata' in e for e in validate(candidate).errors)


def test_corpus_rejects_review_of_a_different_case_context(candidate):
    # benchmark.curation.labels.reviewed: an oracle approval cannot be reused for another input.
    record = review_records(candidate)[0]
    record.update(case_sha256='0' * 64, reviewer='unit-test reviewer', decision='accepted')
    (candidate / 'reviews.json').write_text(json.dumps([record]))
    assert any('review case context digest mismatch' in e for e in validate(candidate).errors)
