import hashlib
import json
from pathlib import Path

import pytest


ROOT = Path(__file__).parents[1]
CONTRACT = ROOT / "contracts" / "precedent_evaluator.py"
FIXTURE_PATH = ROOT / "tests" / "fixtures" / "fictional_evaluations.json"
FIXTURE = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
COMMITMENT_VECTOR_PATH = ROOT / "frontend" / "src" / "lib" / "commitment_vectors.json"
COMMITMENT_VECTOR = json.loads(COMMITMENT_VECTOR_PATH.read_text(encoding="utf-8"))
PROMPT_MARKER = "Compare these two fictional precedent packets"
CASES = FIXTURE["cases"]
CRITERIA = FIXTURE["criteria"]
def answer_for(classification, *, similar, contradiction, enough=True, same_issue=True, outcomes_differ=False,
               similarities=None, differences=None, contradictions=None, reasoning="Fictional evidence supports this bounded assessment."):
    return {
        "classification": classification,
        "same_material_issue": same_issue,
        "evidence_sufficient": enough,
        "outcomes_differ": outcomes_differ,
        "material_similarity": similar,
        "potential_contradiction": contradiction,
        "similarities": similarities if similarities is not None else ["same stated issue"],
        "differences": differences if differences is not None else [],
        "contradictions": contradictions if contradictions is not None else [],
        "reasoning": reasoning,
    }


def answer_for_case(name):
    if name == "matching":
        return answer_for(
            "material_similarity", similar=True, contradiction=False,
            similarities=["same quiet-hours rule", "amplified music after 22:00"],
        )
    if name == "explained_outcome_difference":
        return answer_for(
            "material_similarity", similar=True, contradiction=False, outcomes_differ=True,
            similarities=["same quiet-hours rule", "work after 22:00"],
            differences=["an express emergency repair exception applies only in the second case"],
        )
    if name == "unexplained_conflict":
        return answer_for(
            "possible_contradiction", similar=True, contradiction=True, outcomes_differ=True,
            similarities=["same walkway issue", "same stated rule", "same permit condition"],
            contradictions=["the same placement is treated as compliant and violating without a stated distinction"],
        )
    if name == "insufficient":
        return answer_for(
            "insufficient_evidence", similar=False, contradiction=False, enough=False, same_issue=False,
            similarities=[], differences=[], contradictions=[],
            reasoning="The supplied excerpts omit the rule, facts, and outcomes needed to compare these cases.",
        )
    raise AssertionError(name)


def _digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _input_commitment(args):
    fields = (
        "PrecedentOS-EVALUATION-INPUT-v1",
        args[0], args[1], args[2], args[3], args[4],
        str(args[6]), str(args[7]), "1", args[8],
    )
    framed = "".join(str(len(value.encode("utf-8"))) + ":" + value for value in fields)
    return hashlib.sha256(framed.encode("utf-8")).hexdigest()


def arguments(name, evaluation_id=None):
    case = CASES[name]
    return [
        evaluation_id or "EVAL-" + name.upper().replace("_", "-"),
        case["record_a_id"],
        _digest(case["precedent_a"]),
        case["record_b_id"],
        _digest(case["precedent_b"]),
        json.dumps(
            {"precedent_a": case["precedent_a"], "precedent_b": case["precedent_b"]},
            sort_keys=True,
            separators=(",", ":"),
        ),
        FIXTURE["evidence_schema_version"],
        FIXTURE["criteria_version"],
        CRITERIA,
    ]


def deploy(direct_deploy):
    return direct_deploy(str(CONTRACT))


def mock_result(direct_vm, answer):
    direct_vm.clear_mocks()
    direct_vm.mock_llm(PROMPT_MARKER, json.dumps(answer, separators=(",", ":")))


def evaluate(contract, direct_vm, name, answer=None, evaluation_id=None):
    direct_vm.clear_validators()
    mock_result(direct_vm, answer if answer is not None else answer_for_case(name))
    contract.evaluate_pair(*arguments(name, evaluation_id=evaluation_id))


def test_matching_precedents_persist_bounded_provenance(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = answer_for_case("matching")
    evaluate(contract, direct_vm, "matching", answer)

    assert direct_vm.run_validator() is True
    stored = contract.get_evaluation("EVAL-MATCHING")
    assert stored["classification"] == "material_similarity"
    assert stored["record_a_id"] == CASES["matching"]["record_a_id"]
    assert stored["record_a_digest"] == _digest(CASES["matching"]["precedent_a"])
    assert stored["record_b_digest"] == _digest(CASES["matching"]["precedent_b"])
    assert stored["evidence_schema_version"] == "1"
    assert stored["criteria_version"] == "1"
    assert stored["criteria"] == CRITERIA
    assert stored["evaluation_schema_version"] == "1"
    assert stored["input_commitment"] == _input_commitment(arguments("matching"))
    assert json.loads(stored["similarities_json"])
    assert contract.get_evaluation_count() == 1


def test_frontend_sha256_and_commitment_vector_matches_python_contract(direct_vm, direct_deploy):
    vector = COMMITMENT_VECTOR
    contract = deploy(direct_deploy)
    packet = json.dumps(
        {"precedent_a": vector["passageA"], "precedent_b": vector["passageB"]},
        sort_keys=True,
        separators=(",", ":"),
    )
    args = [
        vector["evaluationId"], vector["recordAId"], vector["recordADigest"],
        vector["recordBId"], vector["recordBDigest"], packet,
        vector["evidenceSchemaVersion"], vector["criteriaVersion"], vector["criteria"],
    ]
    assert _digest(vector["passageA"]) == vector["recordADigest"]
    assert _digest(vector["passageB"]) == vector["recordBDigest"]
    assert _input_commitment(args) == vector["inputCommitment"]

    mock_result(direct_vm, answer_for_case("matching"))
    contract.evaluate_pair(*args)
    assert direct_vm.run_validator() is True
    assert contract.get_evaluation(vector["evaluationId"])["input_commitment"] == vector["inputCommitment"]


def test_similar_issue_with_explained_outcome_difference_is_not_labeled_contradiction(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = answer_for_case("explained_outcome_difference")
    evaluate(contract, direct_vm, "explained_outcome_difference", answer)

    assert direct_vm.run_validator() is True
    stored = contract.get_evaluation("EVAL-EXPLAINED-OUTCOME-DIFFERENCE")
    assert stored["classification"] == "material_similarity"
    assert json.loads(stored["differences_json"])[0].startswith("an express emergency")
    assert json.loads(stored["decision_fields_json"])["outcomes_differ"] is True
    assert json.loads(stored["decision_fields_json"])["potential_contradiction"] is False


def test_unexplained_conflicting_outcomes_are_classified_as_possible_contradiction(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = answer_for_case("unexplained_conflict")
    evaluate(contract, direct_vm, "unexplained_conflict", answer)

    assert direct_vm.run_validator() is True
    stored = contract.get_evaluation("EVAL-UNEXPLAINED-CONFLICT")
    assert stored["classification"] == "possible_contradiction"
    assert json.loads(stored["contradictions_json"])


def test_insufficient_evidence_is_a_persistable_advisory_classification(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    evaluate(contract, direct_vm, "insufficient")

    assert direct_vm.run_validator() is True
    stored = contract.get_evaluation("EVAL-INSUFFICIENT")
    assert stored["classification"] == "insufficient_evidence"
    assert json.loads(stored["decision_fields_json"])["evidence_sufficient"] is False


def test_valid_json_with_wrong_classification_fails_independent_validator_check(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    leader = answer_for_case("unexplained_conflict")
    evaluate(contract, direct_vm, "unexplained_conflict", leader)
    validator = answer_for_case("explained_outcome_difference")
    mock_result(direct_vm, validator)

    assert direct_vm.run_validator() is False


def test_validator_rejects_conflicting_decision_bearing_fields(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = answer_for_case("unexplained_conflict")
    evaluate(contract, direct_vm, "unexplained_conflict", answer)
    inconsistent_leader = {**answer, "potential_contradiction": False}

    # This injected leader result remains valid JSON with all required keys.
    assert direct_vm.run_validator(leader_result=inconsistent_leader) is False


def test_validator_rejects_disagreement_on_decision_boolean_with_same_classification(
    direct_vm, direct_deploy
):
    contract = deploy(direct_deploy)
    leader = answer_for_case("explained_outcome_difference")
    evaluate(contract, direct_vm, "explained_outcome_difference", leader)
    validator = answer_for_case("matching")
    mock_result(direct_vm, validator)

    # Both answers are internally valid and share a class, but differ on whether
    # outcomes diverge. The validator compares that decision-bearing field too.
    assert direct_vm.run_validator() is False


def test_validator_rejects_malicious_narrative_disagreement(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = answer_for_case("matching")
    evaluate(contract, direct_vm, "matching", answer)
    validator_answer = {**answer, "reasoning": "A separately worded short explanation."}
    mock_result(direct_vm, validator_answer)

    assert direct_vm.run_validator() is False


def test_validator_rejects_unsupported_finding_in_leader_narrative(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = answer_for_case("matching")
    evaluate(contract, direct_vm, "matching", answer)
    malicious_leader = {**answer, "similarities": ["The evidence proves the agency acted unlawfully."]}
    assert direct_vm.run_validator(leader_result=malicious_leader) is False


def test_malformed_model_result_fails_without_persisting_evaluation(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    malformed = {"classification": "material_similarity"}
    mock_result(direct_vm, malformed)

    with direct_vm.expect_revert("model result has unexpected fields"):
        contract.evaluate_pair(*arguments("matching"))

    assert contract.has_evaluation("EVAL-MATCHING") is False
    assert contract.get_evaluation_count() == 0


def test_inconsistent_model_decision_fails_without_persisting(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    inconsistent = {
        **answer_for_case("unexplained_conflict"),
        "outcomes_differ": False,
    }
    mock_result(direct_vm, inconsistent)

    with direct_vm.expect_revert("inconsistent model decision fields"):
        contract.evaluate_pair(*arguments("unexplained_conflict"))

    assert contract.get_evaluation_count() == 0


def test_possible_contradiction_requires_material_similarity_and_preserves_state(
    direct_vm, direct_deploy
):
    contract = deploy(direct_deploy)
    inconsistent = {
        **answer_for_case("unexplained_conflict"),
        "material_similarity": False,
    }
    mock_result(direct_vm, inconsistent)

    with direct_vm.expect_revert("inconsistent model decision fields"):
        contract.evaluate_pair(*arguments("unexplained_conflict"))

    assert contract.has_evaluation("EVAL-UNEXPLAINED-CONFLICT") is False
    assert contract.get_evaluation_count() == 0


def test_non_json_model_response_fails_without_persisting(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    direct_vm.clear_mocks()
    direct_vm.mock_llm(PROMPT_MARKER, "not a JSON response")

    with direct_vm.expect_revert():
        contract.evaluate_pair(*arguments("matching"))

    assert contract.get_evaluation_count() == 0
    assert contract.has_evaluation("EVAL-MATCHING") is False


@pytest.mark.parametrize(
    "packet,error",
    [
        ("{bad-json", "malformed evidence packet JSON"),
        (json.dumps({"precedent_a": " ", "precedent_b": "text"}), "both precedent passages are required"),
        (json.dumps({"precedent_a": "only one passage"}), "evidence packet must contain exactly two passages"),
    ],
)
def test_malformed_or_missing_evidence_fails_before_model_call(
    direct_vm, direct_deploy, packet, error
):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    args[5] = packet
    mock_result(direct_vm, answer_for_case("matching"))

    with direct_vm.expect_revert(error):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0


@pytest.mark.parametrize("digest_position", [2, 4])
def test_well_formed_digest_must_commit_to_exact_submitted_passage(
    direct_vm, direct_deploy, digest_position
):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    args[digest_position] = "0" * 64
    mock_result(direct_vm, answer_for_case("matching"))

    with direct_vm.expect_revert(
        "first evidence digest does not match submitted passage"
        if digest_position == 2
        else "second evidence digest does not match submitted passage"
    ):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0
    assert contract.has_evaluation(args[0]) is False


def test_input_commitment_binds_ids_versions_and_criteria(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    evaluate(contract, direct_vm, "matching")
    stored = contract.get_evaluation(args[0])
    assert stored["input_commitment"] == _input_commitment(args)

    changed = arguments("matching", evaluation_id="EVAL-OTHER-INPUT")
    changed[8] = CRITERIA + " Apply only to the stated fictional rule."
    direct_vm.clear_validators()
    mock_result(direct_vm, answer_for_case("matching"))
    contract.evaluate_pair(*changed)
    changed_stored = contract.get_evaluation(changed[0])
    assert changed_stored["criteria"] == changed[8]
    assert changed_stored["input_commitment"] == _input_commitment(changed)
    assert changed_stored["input_commitment"] != stored["input_commitment"]


@pytest.mark.parametrize(
    "field,value,error",
    [
        ("record_a_digest", "x" * 64, "invalid evidence digest"),
        ("record_b_digest", "A" * 64, "invalid evidence digest"),
        ("evidence_schema_version", 2, "unsupported evidence schema version"),
        ("criteria_version", 9, "unsupported criteria version"),
        ("record_a_id", "bad id", "invalid first record identifier"),
        ("evaluation_id", "bad id", "invalid evaluation identifier"),
    ],
)
def test_invalid_digests_identifiers_and_versions_revert_without_state_change(
    direct_vm, direct_deploy, field, value, error
):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    positions = {"evaluation_id": 0, "record_a_id": 1, "record_a_digest": 2, "record_b_digest": 4, "evidence_schema_version": 6, "criteria_version": 7}
    args[positions[field]] = value
    mock_result(direct_vm, answer_for_case("matching"))

    with direct_vm.expect_revert(error):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0


def test_oversized_evidence_is_rejected_before_model_execution(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    args[5] = json.dumps({"precedent_a": "A" * 1801, "precedent_b": "B"})
    mock_result(direct_vm, answer_for_case("matching"))

    with direct_vm.expect_revert("evidence passage exceeds size limit"):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0


def test_oversized_total_evidence_packet_is_rejected(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    args[5] = "{" + " " * 4200 + "}"
    mock_result(direct_vm, answer_for_case("matching"))

    with direct_vm.expect_revert("evidence packet exceeds size limit"):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0


def test_oversized_criteria_is_rejected(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    args[8] = "C" * 601
    mock_result(direct_vm, answer_for_case("matching"))

    with direct_vm.expect_revert("invalid criteria"):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0


def test_duplicate_evaluation_id_rejected_and_original_record_unchanged(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    evaluate(contract, direct_vm, "matching")
    before = contract.get_evaluation("EVAL-MATCHING")
    count_before = contract.get_evaluation_count()

    with direct_vm.expect_revert("evaluation identifier already used"):
        contract.evaluate_pair(*arguments("matching"))

    assert contract.get_evaluation("EVAL-MATCHING") == before
    assert contract.get_evaluation_count() == count_before


def test_failed_second_attempt_preserves_prior_evaluation(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    evaluate(contract, direct_vm, "matching")
    before = contract.get_evaluation("EVAL-MATCHING")
    args = arguments("unexplained_conflict")
    args[2] = "bad-digest"

    with direct_vm.expect_revert("invalid evidence digest"):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation("EVAL-MATCHING") == before
    assert contract.has_evaluation("EVAL-UNEXPLAINED-CONFLICT") is False
    assert contract.get_evaluation_count() == 1


def test_missing_evaluation_views_are_deterministic(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    assert contract.has_evaluation("EVAL-MISSING") is False
    assert contract.get_evaluation("EVAL-MISSING") == {}
    assert contract.get_evaluation_count() == 0


def test_same_precedent_cannot_be_compared_to_itself(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    args = arguments("matching")
    args[3] = args[1]

    with direct_vm.expect_revert("precedent identifiers must differ"):
        contract.evaluate_pair(*args)

    assert contract.get_evaluation_count() == 0
