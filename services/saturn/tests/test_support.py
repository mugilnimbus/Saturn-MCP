"""Claim support contracts. Scripted replies test enforcement, not model quality."""

import pytest
from conftest import FakeGateway
from pydantic import ValidationError

from saturn.application.graphs.support import ReviewClaims, Verdict, review_claims
from saturn.domain.errors import ModelOutputInvalid, ModelUnavailable


@pytest.mark.parametrize("verdicts, accepted", [
    ([Verdict(candidate=0, supported=True, evidence_indexes=[0])], {0: [0]}),
    ([Verdict(candidate=0, supported=False, evidence_indexes=[0])], {}),
    ([Verdict(candidate=0, supported=True, evidence_indexes=[])], {}),
    ([Verdict(candidate=0, supported=True, evidence_indexes=[99])], {}),
    ([Verdict(candidate=99, supported=True, evidence_indexes=[0])], {}),
    ([], {}),
    ([Verdict(candidate=0, supported=True, evidence_indexes=[0]), Verdict(candidate=0, supported=True, evidence_indexes=[0])], {}),
])
async def test_support_keeps_only_unique_explicit_acceptances_with_known_citations(verdicts, accepted):
    # support.validation: reject missing, duplicate, unknown, or unsupported verdicts.
    gateway = FakeGateway(lambda *_: ReviewClaims(verdicts=verdicts))
    result = await review_claims(gateway, ["An original claim."], [["source:1 The source text."]], purpose="test-support")
    assert result.accepted == accepted and result.rejected == 1 - len(accepted)


@pytest.mark.parametrize("failure", [ModelUnavailable("offline"), ModelOutputInvalid("bad reply")])
async def test_support_omits_all_claims_when_review_fails(failure):
    # support.empty: no unreviewed claim escapes a failed review.
    def fail(*_):
        raise failure

    result = await review_claims(FakeGateway(fail), ["claim"], [["source"]], purpose="test-support")
    assert result.accepted == {} and result.rejected == 1 and result.warning


async def test_support_requires_evidence_before_calling_the_model():
    # support.ready: missing evidence cannot become a supported answer.
    gateway = FakeGateway()
    result = await review_claims(gateway, ["claim"], [[]], purpose="test-support")
    assert result.accepted == {} and result.rejected == 1 and gateway.calls == []


async def test_support_preserves_accepted_claim_indexes_and_bounds_source_text():
    # support.prepare: the reviewer receives bounded source text, not authority to rewrite claims.
    gateway = FakeGateway(lambda *_: ReviewClaims(verdicts=[Verdict(candidate=1, supported=True, evidence_indexes=[0])]))
    result = await review_claims(gateway, ["Rejected original.", "Accepted original."], [["source"], ["word " * 10000]],
                                purpose="test-support")
    assert result.accepted == {1: [0]} and result.rejected == 1
    assert len(gateway.calls[0]["user"]) < 10000


@pytest.mark.parametrize("arguments", [
    {"claims": []},
    {"verdicts": [], "claims": []},
    {"verdicts": [{"candidate": 0, "supported": True, "evidence_indexes": [0], "claim": "rewritten"}]},
])
def test_support_schema_refuses_copied_inputs_and_unknown_fields(arguments):
    # support.validation: malformed model calls must trigger gateway correction, not default to empty verdicts.
    with pytest.raises(ValidationError):
        ReviewClaims.model_validate(arguments)
