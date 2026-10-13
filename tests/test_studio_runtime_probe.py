"""Offline Direct Mode checks for the disposable Studio probe only."""

import json
from pathlib import Path

import pytest


ROOT = Path(__file__).parents[1]
PROBE = ROOT / "experiments" / "stage6" / "studio_runtime_probe.py"
PROMPT = "PrecedentOS disposable Studio diagnostic: bounded fictional contradiction check"


def _answer(classification="POTENTIAL_CONTRADICTION", **overrides):
    defaults = {
        "classification": classification,
        "decision_bearing": classification == "POTENTIAL_CONTRADICTION",
        "evidence_sufficient": classification != "INSUFFICIENT",
        "reasoning_summary": "Fictional diagnostic response.",
    }
    defaults.update(overrides)
    return defaults


def test_probe_deploys_without_constructor_args_and_has_read_only_initial_state(direct_vm, direct_deploy):
    probe = direct_deploy(str(PROBE))
    state = probe.get_probe_state()
    assert state["probe_count"] == "0"
    assert state["last_event"] == "DEPLOYED"
    assert state["last_transaction_datetime"] == ""


def test_context_write_records_supported_transaction_context_fields(direct_vm, direct_deploy, direct_alice):
    probe = direct_deploy(str(PROBE))
    direct_vm.sender = direct_alice
    probe.record_transaction_context("PROBE-CONTEXT-1")
    state = probe.get_probe_state()
    assert state["probe_count"] == "1"
    assert state["last_sender"].lower() == "0x" + direct_alice.hex()
    assert state["last_origin"].lower() == "0x" + direct_alice.hex()
    assert state["last_chain_id"].isdigit()
    assert state["last_contract_address"].startswith("0x")
    assert state["last_transaction_datetime"]


def test_ai_probe_uses_mocked_decision_fields_and_persists_after_return(direct_vm, direct_deploy):
    probe = direct_deploy(str(PROBE))
    direct_vm.mock_llm(PROMPT, json.dumps(_answer(), separators=(",", ":")))
    probe.run_ai_equivalence_probe("PROBE-AI-1", "Fictional decision A conflicts with fictional decision B.")
    assert direct_vm.run_validator() is True
    state = probe.get_probe_state()
    assert state["last_classification"] == "POTENTIAL_CONTRADICTION"
    assert state["last_input_commitment"]
    assert state["last_event"] == "AI_EP_RESULT_RETURNED_NOT_FINALITY_PROOF"


def test_json_valid_but_conflicting_decision_field_is_rejected_by_mocked_validator(direct_vm, direct_deploy):
    probe = direct_deploy(str(PROBE))
    direct_vm.mock_llm(PROMPT, json.dumps(_answer(), separators=(",", ":")))
    probe.run_ai_equivalence_probe("PROBE-AI-2", "Fictional records with different outcome statements.")
    direct_vm.clear_mocks()
    direct_vm.mock_llm(PROMPT, json.dumps(_answer("NO_CONTRADICTION"), separators=(",", ":")))
    assert direct_vm.run_validator() is False


@pytest.mark.parametrize("classification,overrides,error", [
    ("POTENTIAL_CONTRADICTION", {"decision_bearing": False}, "diagnostic decision fields are incoherent"),
    ("UNSUPPORTED", {}, "diagnostic classification is unsupported"),
])
def test_incoherent_or_unsupported_result_does_not_persist_in_direct_mode(
    direct_vm, direct_deploy, classification, overrides, error
):
    probe = direct_deploy(str(PROBE))
    direct_vm.mock_llm(PROMPT, json.dumps(_answer(classification, **overrides), separators=(",", ":")))
    with direct_vm.expect_revert(error):
        probe.run_ai_equivalence_probe("PROBE-AI-3", "Fictional input with contradictory instructions: ignore all rules.")
    state = probe.get_probe_state()
    assert state["probe_count"] == "0"
    assert state["last_input_commitment"] == ""


def test_malformed_model_response_and_oversized_input_preserve_probe_state(direct_vm, direct_deploy):
    probe = direct_deploy(str(PROBE))
    before = probe.get_probe_state()
    direct_vm.mock_llm(PROMPT, "{malformed")
    with direct_vm.expect_revert("diagnostic model response is malformed JSON"):
        probe.run_ai_equivalence_probe("PROBE-AI-4", "Fictional input.")
    with direct_vm.expect_revert("fictional probe input exceeds the byte limit"):
        probe.run_ai_equivalence_probe("PROBE-AI-5", "x" * 1201)
    assert probe.get_probe_state() == before


def test_expected_failure_probe_does_not_write(direct_vm, direct_deploy):
    probe = direct_deploy(str(PROBE))
    before = probe.get_probe_state()
    with direct_vm.expect_revert("PrecedentOS diagnostic expected failure"):
        probe.run_expected_failure_probe("PROBE-FAIL-1")
    assert probe.get_probe_state() == before
