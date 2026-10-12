import json
from pathlib import Path

import pytest


CONTRACT = Path(__file__).parents[1] / "contracts" / "evaluator_poc.py"
PASSAGES = json.dumps(
    {
        "precedent_a": "Fictional panel held a permit allowing construction after 22:00 violated the quiet-hours rule; no exception was established.",
        "precedent_b": "Fictional panel held construction after 22:00 did not violate the same rule because an immediate water-main emergency triggered its express exception.",
    }
)
CRITERIA = "Classify only the supplied rule and outcome; no external legal assumptions."


def model_result(outcome, rationale="The excerpts support this classification."):
    return json.dumps(
        {
            "outcome": outcome,
            "same_material_issue": True,
            "exception_changes_result": True,
            "rationale": rationale,
        }
    )


def deploy(direct_deploy):
    return direct_deploy(str(CONTRACT))


def submit(contract, direct_vm, leader_answer):
    direct_vm.clear_validators()
    direct_vm.clear_mocks()
    direct_vm.mock_llm("fictional precedent excerpts", leader_answer)
    contract.evaluate_pair("P-ALPHA", "P-BRAVO", PASSAGES, CRITERIA)


def test_matching_decision_fields_are_accepted(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    answer = model_result("possible_contradiction")
    submit(contract, direct_vm, answer)

    # Direct Mode runs the leader path locally; this separately invokes the
    # captured validator against the same mocked answer.
    assert direct_vm.run_validator() is True
    saved = json.loads(contract.get_result_json())
    assert saved["result"]["outcome"] == "possible_contradiction"


def test_semantically_conflicting_validator_classification_disagrees(
    direct_vm, direct_deploy
):
    contract = deploy(direct_deploy)
    submit(contract, direct_vm, model_result("possible_contradiction"))
    direct_vm.clear_mocks()
    direct_vm.mock_llm("fictional precedent excerpts", model_result("no_material_relation"))

    assert direct_vm.run_validator() is False


def test_valid_json_with_wrong_decision_is_rejected(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    submit(contract, direct_vm, model_result("possible_contradiction"))
    direct_vm.clear_mocks()
    direct_vm.mock_llm("fictional precedent excerpts", model_result("possible_contradiction"))

    # Keep valid schema and IDs but replace only the leader's outcome.
    wrong_but_valid = json.loads(model_result("no_material_relation"))
    assert direct_vm.run_validator(leader_result=wrong_but_valid) is False


def test_rationale_can_vary_when_decision_fields_match(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    submit(contract, direct_vm, model_result("possible_contradiction", "Leader wording."))
    direct_vm.clear_mocks()
    direct_vm.mock_llm(
        "fictional precedent excerpts",
        model_result("possible_contradiction", "Validator wording differs."),
    )

    assert direct_vm.run_validator() is True


@pytest.mark.parametrize(
    "record_a,record_b,packet,criteria,message",
    [
        ("P-ALPHA", "P-BRAVO", json.dumps({"precedent_a": " ", "precedent_b": "text"}), CRITERIA, "both precedent passages are required"),
        ("", "P-BRAVO", PASSAGES, CRITERIA, "invalid record IDs"),
        ("P-ALPHA", "P-BRAVO", "{not-json", CRITERIA, "malformed evidence packet JSON"),
    ],
)
def test_missing_or_malformed_inputs_fail_before_llm(
    direct_vm, direct_deploy, record_a, record_b, packet, criteria, message
):
    contract = deploy(direct_deploy)
    direct_vm.mock_llm("fictional precedent excerpts", model_result("possible_contradiction"))
    with direct_vm.expect_revert(message):
        contract.evaluate_pair(record_a, record_b, packet, criteria)
    assert contract.get_result_json() == ""


def test_validator_disagrees_when_leader_execution_failed(direct_vm, direct_deploy):
    contract = deploy(direct_deploy)
    submit(contract, direct_vm, model_result("possible_contradiction"))

    assert direct_vm.run_validator(leader_error=RuntimeError("simulated leader failure")) is False

