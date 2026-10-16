import json
import hashlib
from pathlib import Path

import pytest

from precedentos_protocol.case_decision import (
    AppealTarget,
    CaseDecisionContext,
    CaseDecisionRecord,
    DecisionValidationError,
    EvidenceReference,
    append_decision_history,
    case_decision_input_commitment,
    case_decision_result_digest,
    case_judgment_commitment,
    case_evidence_commitment,
    normalize_authority_status,
    resolve_decision_reference,
    validate_appeal_target,
    validate_decision_candidate,
    verify_evidence_bytes,
)


VECTOR = json.loads((Path(__file__).parent / "fixtures" / "case_decision_vectors.json").read_text(encoding="utf-8"))
JUDGMENT_VECTOR = json.loads((Path(__file__).parents[1] / "frontend" / "src" / "lib" / "case_judgment_commitment_vectors.json").read_text(encoding="utf-8"))
ADDR_A = "0x" + "1" * 40
ADDR_B = "0x" + "2" * 40


def make_context(**changes):
    data = {
        "chain_id": VECTOR["chain_id"],
        "case_id": VECTOR["case_id"],
        "case_version": VECTOR["case_version"],
        "case_evidence_commitment": VECTOR["case_evidence_commitment"],
        "policy_version": VECTOR["policy_version"],
        "criteria_version": VECTOR["criteria_version"],
        "criteria_digest": VECTOR["criteria_digest"],
        "court_address": VECTOR["court_address"],
        "petitioner": ADDR_A,
        "respondent": ADDR_B,
    }
    data.update(changes)
    return CaseDecisionContext(**data)


def make_record(**changes):
    data = {
        "decision_id": VECTOR["decision_id"],
        "chain_id": VECTOR["chain_id"],
        "case_id": VECTOR["case_id"],
        "case_version": VECTOR["case_version"],
        "case_evidence_commitment": VECTOR["case_evidence_commitment"],
        "policy_version": VECTOR["policy_version"],
        "criteria_version": VECTOR["criteria_version"],
        "criteria_digest": VECTOR["criteria_digest"],
        "decision_schema_version": VECTOR["decision_schema_version"],
        "court_address": VECTOR["court_address"],
        "input_commitment": VECTOR["input_commitment"],
        "classification": VECTOR["classification"],
        "recommended_outcome": VECTOR["recommended_outcome"],
        "evidence_sufficient": VECTOR["evidence_sufficient"],
        "reasons_digest": VECTOR["reasons_digest"],
        "result_digest": VECTOR["result_digest"],
        "recording_contract_address": VECTOR["court_address"],
    }
    data.update(changes)
    return CaseDecisionRecord(**data)


def test_cross_language_case_evidence_input_and_result_vectors():
    references = [EvidenceReference(**{
        "sequence": item["sequence"],
        "evidence_id": item["evidence_id"],
        "digest": item["digest"],
        "schema_version": item["schema_version"],
        "source_reference_digest": item["source_reference_digest"],
    }) for item in VECTOR["references"]]
    assert case_evidence_commitment(VECTOR["case_id"], references) == VECTOR["case_evidence_commitment"]
    assert case_decision_input_commitment(
        decision_id=VECTOR["decision_id"], chain_id=VECTOR["chain_id"], case_id=VECTOR["case_id"],
        case_version=VECTOR["case_version"], case_evidence_commitment=VECTOR["case_evidence_commitment"],
        policy_version=VECTOR["policy_version"], criteria_version=VECTOR["criteria_version"],
        criteria_digest=VECTOR["criteria_digest"], decision_schema_version=VECTOR["decision_schema_version"],
        court_address=VECTOR["court_address"],
    ) == VECTOR["input_commitment"]
    assert case_decision_result_digest(
        input_commitment=VECTOR["input_commitment"], classification=VECTOR["classification"],
        recommended_outcome=VECTOR["recommended_outcome"], evidence_sufficient=VECTOR["evidence_sufficient"],
        reasons_digest=VECTOR["reasons_digest"],
    ) == VECTOR["result_digest"]


def test_cross_language_case_judgment_canonical_finding_commitment_vector():
    assert case_judgment_commitment(
        input_commitment=JUDGMENT_VECTOR["input_commitment"], result=JUDGMENT_VECTOR["result"]
    ) == JUDGMENT_VECTOR["result_commitment"]
    unsupported = json.loads(json.dumps(JUDGMENT_VECTOR["result"]))
    unsupported["material_findings"][0]["sources"][0]["source_id"] = []
    with pytest.raises(DecisionValidationError, match="invalid_case_judgment_findings"):
        case_judgment_commitment(input_commitment=JUDGMENT_VECTOR["input_commitment"], result=unsupported)


def test_candidate_with_matching_case_evidence_versions_and_contract_identity_is_structurally_valid():
    validate_decision_candidate(make_record(), make_context(), requester_address=ADDR_A)


def test_locked_evidence_digest_matches_exact_bytes_and_rejects_substitution():
    payload = "fictional public evidence\n".encode("utf-8")
    reference = EvidenceReference(1, "FICT-EVIDENCE-1", hashlib.sha256(payload).hexdigest(), 1, "c" * 64)
    verify_evidence_bytes(reference, payload)
    with pytest.raises(DecisionValidationError, match="evidence_bytes_digest_mismatch"):
        verify_evidence_bytes(reference, "fictional public evidence".encode("utf-8"))


@pytest.mark.parametrize("changes,code", [
    ({"case_id": "FICT-CASE-0002"}, "case_id_mismatch"),
    ({"case_evidence_commitment": "0" * 64}, "case_evidence_commitment_mismatch"),
    ({"criteria_version": 2}, "criteria_version_mismatch"),
    ({"criteria_digest": "0" * 64}, "criteria_digest_mismatch"),
    ({"case_version": 8}, "case_version_mismatch"),
])
def test_case_evidence_and_criteria_substitution_are_rejected(changes, code):
    with pytest.raises(DecisionValidationError, match=code):
        validate_decision_candidate(make_record(), make_context(**changes), requester_address=ADDR_A)


def test_forged_unresolved_decision_id_cannot_be_resolved_from_trusted_record_set():
    with pytest.raises(DecisionValidationError, match="unknown_decision_id"):
        resolve_decision_reference("FICT-DECISION-FORGED", {})
    record = make_record()
    assert resolve_decision_reference(record.decision_id, {record.decision_id: record}) is record


def test_unauthorized_adjudication_requester_is_rejected():
    with pytest.raises(DecisionValidationError, match="unauthorized_adjudication_requester"):
        validate_decision_candidate(make_record(), make_context(), requester_address="0x" + "3" * 40)


def test_duplicate_decision_id_and_replay_across_cases_are_rejected():
    record = make_record()
    with pytest.raises(DecisionValidationError, match="duplicate_decision_id"):
        validate_decision_candidate(record, make_context(), requester_address=ADDR_A, used_decision_ids=[record.decision_id])
    with pytest.raises(DecisionValidationError, match="case_id_mismatch"):
        validate_decision_candidate(record, make_context(case_id="FICT-CASE-0002"), requester_address=ADDR_A)
    with pytest.raises(DecisionValidationError, match="replay_across_cases"):
        append_decision_history([record], make_record(decision_id="FICT-DECISION-0002", case_id="FICT-CASE-0002"))


def test_forged_recording_contract_identity_and_tampered_commitment_are_rejected():
    with pytest.raises(DecisionValidationError, match="forged_recording_contract_identity"):
        validate_decision_candidate(make_record(recording_contract_address=ADDR_B), make_context(), requester_address=ADDR_A)
    with pytest.raises(DecisionValidationError, match="input_commitment_mismatch"):
        validate_decision_candidate(make_record(input_commitment="0" * 64), make_context(), requester_address=ADDR_A)
    with pytest.raises(DecisionValidationError, match="result_digest_mismatch"):
        validate_decision_candidate(make_record(recommended_outcome="DENY"), make_context(), requester_address=ADDR_A)


def test_appeal_must_target_exact_case_decision_revision_and_result():
    operative = AppealTarget("FICT-CASE-0001", "FICT-DECISION-0001", 7, VECTOR["result_digest"])
    validate_appeal_target(operative, operative)
    for target, code in [
        (AppealTarget("FICT-CASE-0002", operative.decision_id, 7, operative.result_digest), "appeal_case_id_mismatch"),
        (AppealTarget(operative.case_id, "FICT-DECISION-0002", 7, operative.result_digest), "appeal_decision_id_mismatch"),
        (AppealTarget(operative.case_id, operative.decision_id, 8, operative.result_digest), "appeal_decision_version_mismatch"),
        (AppealTarget(operative.case_id, operative.decision_id, 7, "0" * 64), "appeal_result_digest_mismatch"),
    ]:
        with pytest.raises(DecisionValidationError, match=code):
            validate_appeal_target(target, operative)


def test_pending_and_accepted_execution_never_map_to_finalized_authority():
    assert normalize_authority_status("PENDING") == "PENDING"
    assert normalize_authority_status("ACCEPTED", "FINISHED_WITH_RETURN") == "ACCEPTED_PROVISIONAL"
    assert normalize_authority_status("ACCEPTED", "FINISHED_WITH_ERROR") == "FAILED"
    assert normalize_authority_status("ACCEPTED") == "UNKNOWN"
    assert normalize_authority_status("FINALIZED", "FINISHED_WITH_ERROR") == "FAILED"
    assert normalize_authority_status("FINALIZED") == "UNKNOWN"
    assert normalize_authority_status("FINALIZED", "FINISHED_WITH_RETURN") == "FINALIZED"


def test_new_history_appends_without_mutating_or_losing_earlier_decision():
    first = make_record()
    second = make_record(decision_id="FICT-DECISION-0002", case_version=8)
    before = (first,)
    after = append_decision_history(before, second)
    assert before == (first,)
    assert after == (first, second)


@pytest.mark.parametrize("references,code", [
    ([EvidenceReference(2, "FICT-EVIDENCE-1", "a" * 64, 1, "c" * 64)], "noncanonical_evidence_sequence"),
    ([EvidenceReference(1, "FICT-EVIDENCE-1", "z" * 64, 1, "c" * 64)], "invalid_evidence_digest"),
    ([EvidenceReference(1, "FICT-EVIDENCE-1", "a" * 64, 2, "c" * 64)], "unsupported_evidence_schema_version"),
])
def test_evidence_root_rejects_invalid_or_reordered_references(references, code):
    with pytest.raises(DecisionValidationError, match=code):
        case_evidence_commitment("FICT-CASE-0001", references)
