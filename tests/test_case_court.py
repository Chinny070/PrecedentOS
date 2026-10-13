import json
from pathlib import Path
import sys

import pytest


CONTRACT = Path(__file__).parents[1] / "contracts" / "case_court.py"
FIXTURE = Path(__file__).parent / "fixtures" / "fictional_cases.json"
CASES = json.loads(FIXTURE.read_text(encoding="utf-8"))["cases"]
DIGEST_A = "a" * 64
DIGEST_B = "b" * 64
DIGEST_C = "c" * 64


def open_case(contract, vm, petitioner, respondent, case=None, action_id="ACTION-OPEN-1"):
    case = case or CASES[0]
    vm.sender = petitioner
    contract.open_case(
        case["case_id"],
        action_id,
        address_for(contract, respondent),
        case["case_type"],
        case["policy_version"],
        case["opening_evidence_digest"],
    )


def address_for(contract, value):
    """Wrap direct-mode fixture bytes as the SDK Address method argument type."""
    module = sys.modules[contract.__class__.__module__]
    return module.Address(value)


def append_evidence(
    contract,
    vm,
    actor,
    *,
    case_id="FICT-CASE-0001",
    version=1,
    action_id="ACTION-EVIDENCE-1",
    evidence_id="FICT-EVIDENCE-1",
    digest=DIGEST_A,
    source_digest=DIGEST_B,
    schema=1,
):
    vm.sender = actor
    contract.append_evidence(
        case_id,
        version,
        action_id,
        evidence_id,
        digest,
        schema,
        source_digest,
    )


def prepare_decision(contract, vm, alice, bob):
    open_case(contract, vm, alice, bob)
    append_evidence(contract, vm, alice)
    vm.sender = alice
    contract.lock_evidence("FICT-CASE-0001", 2, "ACTION-LOCK-1")
    contract.attach_decision_reference(
        "FICT-CASE-0001", 3, "ACTION-DECISION-1", "FICT-RESULT-1", DIGEST_C
    )


def open_challenge(contract, vm, alice, bob):
    prepare_decision(contract, vm, alice, bob)
    vm.sender = bob
    contract.challenge_decision(
        "FICT-CASE-0001",
        4,
        "ACTION-CHALLENGE-1",
        "FICT-CHALLENGE-1",
        DIGEST_C,
        "MATERIAL_ERROR",
        DIGEST_B,
    )


def state_and_history(contract, case_id="FICT-CASE-0001"):
    state = contract.get_case(case_id)
    count = int(state["action_count"]) if state else 0
    history = [contract.get_case_action(case_id, index) for index in range(1, count + 1)]
    return state, history, contract.get_action_count()


def test_open_case_sets_parties_policy_version_and_initial_history(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(str(CONTRACT))
    direct_vm.check_pickling = True

    open_case(contract, direct_vm, direct_alice, direct_bob)

    case = contract.get_case("FICT-CASE-0001")
    assert contract.has_case("FICT-CASE-0001") is True
    assert case["phase"] == "EVIDENCE_OPEN"
    assert case["version"] == "1"
    assert case["case_type"] == CASES[0]["case_type"]
    assert case["policy_version"] == "1"
    assert case["opening_evidence_digest"] == CASES[0]["opening_evidence_digest"]
    assert case["petitioner"].lower() == ("0x" + bytes(direct_alice).hex()).lower()
    assert case["respondent"].lower() == ("0x" + bytes(direct_bob).hex()).lower()
    assert case["opened_at"]
    assert contract.get_case_action_count("FICT-CASE-0001") == 1
    assert contract.get_case_action("FICT-CASE-0001", 1)["action_kind"] == "CASE_OPENED"


def test_missing_case_queries_are_deterministic(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))
    assert contract.has_case("FICT-CASE-9999") is False
    assert contract.get_case("FICT-CASE-9999") == {}
    assert contract.get_evidence("FICT-CASE-9999", "FICT-EVIDENCE-1") == {}
    assert contract.get_case_action("FICT-CASE-9999", 1) == {}
    assert contract.get_case_action_count("FICT-CASE-9999") == 0
    assert contract.get_case_count() == 0
    assert contract.get_action_count() == 0


def test_public_views_reject_unbounded_or_malformed_identifiers(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))
    with direct_vm.expect_revert("invalid case identifier"):
        contract.get_case("X" * 1000)
    with direct_vm.expect_revert("invalid evidence identifier"):
        contract.get_evidence("FICT-CASE-0001", "X" * 1000)


@pytest.mark.parametrize(
    "case_id, action_id, case_type, policy, opening_digest, error",
    [
        ("", "ACTION-OPEN-1", "Fictional case", 1, DIGEST_A, "invalid case identifier"),
        ("AB", "ACTION-OPEN-1", "Fictional case", 1, DIGEST_A, "invalid case identifier"),
        ("-CASE-1", "ACTION-OPEN-1", "Fictional case", 1, DIGEST_A, "invalid case identifier"),
        ("FICT-CASE-1!", "ACTION-OPEN-1", "Fictional case", 1, DIGEST_A, "invalid case identifier"),
        ("FICT-CASE-0001", "bad id", "Fictional case", 1, DIGEST_A, "invalid action identifier"),
        ("FICT-CASE-0001", "ACTION-OPEN-1", "", 1, DIGEST_A, "invalid case type"),
        ("FICT-CASE-0001", "ACTION-OPEN-1", "x" * 65, 1, DIGEST_A, "invalid case type"),
        ("FICT-CASE-0001", "ACTION-OPEN-1", "Private\ncase", 1, DIGEST_A, "invalid case type"),
        ("FICT-CASE-0001", "ACTION-OPEN-1", "Fictional case", 2, DIGEST_A, "unsupported policy version"),
        ("FICT-CASE-0001", "ACTION-OPEN-1", "Fictional case", 1, "A" * 64, "invalid evidence commitment"),
    ],
)
def test_open_case_rejects_malformed_or_unsupported_inputs_without_mutation(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    case_id,
    action_id,
    case_type,
    policy,
    opening_digest,
    error,
):
    contract = direct_deploy(str(CONTRACT))
    before = (contract.get_case_count(), contract.get_action_count())
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert(error):
        contract.open_case(case_id, action_id, address_for(contract, direct_bob), case_type, policy, opening_digest)

    assert (contract.get_case_count(), contract.get_action_count()) == before


def test_duplicate_case_id_and_action_replay_are_rejected_without_state_change(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    before = state_and_history(contract)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("case identifier already used"):
        open_case(
            contract,
            direct_vm,
            direct_charlie,
            direct_bob,
            CASES[0],
            action_id="ACTION-OPEN-2",
        )
    assert state_and_history(contract) == before

    with direct_vm.expect_revert("action identifier already used"):
        contract.open_case(
            "FICT-CASE-0002", "ACTION-OPEN-1", address_for(contract, direct_bob),
            CASES[1]["case_type"], 1, CASES[1]["opening_evidence_digest"]
        )
    assert contract.has_case("FICT-CASE-0002") is False
    assert state_and_history(contract) == before


@pytest.mark.parametrize("respondent_kind", ["same", "zero"])
def test_open_case_rejects_invalid_parties(
    direct_vm, direct_deploy, direct_alice, direct_bob, respondent_kind
):
    contract = direct_deploy(str(CONTRACT))
    respondent = direct_alice if respondent_kind == "same" else b"\x00" * 20
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("case parties must be distinct nonzero addresses"):
        contract.open_case("FICT-CASE-0001", "ACTION-OPEN-1", address_for(contract, respondent), "Fictional case", 1, DIGEST_A)
    assert contract.get_case_count() == 0


def test_only_named_parties_can_append_evidence(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    before = state_and_history(contract)

    with direct_vm.expect_revert("caller is not a case participant"):
        append_evidence(contract, direct_vm, direct_charlie, version=1)

    assert state_and_history(contract) == before
    assert contract.get_evidence("FICT-CASE-0001", "FICT-EVIDENCE-1") == {}


@pytest.mark.parametrize(
    "evidence_id,digest,schema,source_digest,error",
    [
        ("bad id", DIGEST_A, 1, DIGEST_B, "invalid evidence identifier"),
        ("FICT-EVIDENCE-1", "x" * 64, 1, DIGEST_B, "invalid evidence commitment"),
        ("FICT-EVIDENCE-1", DIGEST_A, 2, DIGEST_B, "unsupported evidence schema version"),
        ("FICT-EVIDENCE-1", DIGEST_A, 1, "e" * 63, "invalid source reference commitment"),
    ],
)
def test_evidence_commitments_schema_and_identifiers_are_validated(
    direct_vm, direct_deploy, direct_alice, direct_bob, evidence_id, digest, schema, source_digest, error
):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    before = state_and_history(contract)

    with direct_vm.expect_revert(error):
        append_evidence(
            contract,
            direct_vm,
            direct_alice,
            evidence_id=evidence_id,
            digest=digest,
            schema=schema,
            source_digest=source_digest,
        )

    assert state_and_history(contract) == before


def test_evidence_is_append_only_versioned_and_retrievable(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    append_evidence(contract, direct_vm, direct_bob)

    evidence = contract.get_evidence("FICT-CASE-0001", "FICT-EVIDENCE-1")
    assert evidence["digest"] == DIGEST_A
    assert evidence["source_reference_digest"] == DIGEST_B
    assert evidence["case_version"] == "2"
    assert evidence["schema_version"] == "1"
    assert evidence["submitter"].lower() == ("0x" + bytes(direct_bob).hex()).lower()
    assert contract.get_case("FICT-CASE-0001")["version"] == "2"
    assert contract.get_case_action("FICT-CASE-0001", 2)["payload_digest"]

    before = state_and_history(contract)
    with direct_vm.expect_revert("evidence identifier already used"):
        append_evidence(contract, direct_vm, direct_alice, version=2)
    assert state_and_history(contract) == before
    assert contract.get_evidence("FICT-CASE-0001", "FICT-EVIDENCE-1") == evidence


def test_stale_case_version_and_invalid_transition_are_rejected(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    before = state_and_history(contract)

    with direct_vm.expect_revert("case requires at least one evidence reference"):
        contract.lock_evidence("FICT-CASE-0001", 1, "ACTION-LOCK-1")
    assert state_and_history(contract) == before

    append_evidence(contract, direct_vm, direct_alice)
    after_append = state_and_history(contract)
    with direct_vm.expect_revert("stale case version"):
        contract.lock_evidence("FICT-CASE-0001", 1, "ACTION-LOCK-2")
    assert state_and_history(contract) == after_append


def test_lock_and_decision_reference_are_authorized_and_immutable(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    append_evidence(contract, direct_vm, direct_alice)
    before = state_and_history(contract)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("caller is not a case participant"):
        contract.lock_evidence("FICT-CASE-0001", 2, "ACTION-LOCK-1")
    assert state_and_history(contract) == before

    direct_vm.sender = direct_alice
    contract.lock_evidence("FICT-CASE-0001", 2, "ACTION-LOCK-1")
    locked = state_and_history(contract)
    with direct_vm.expect_revert("evidence is not open"):
        append_evidence(contract, direct_vm, direct_alice, version=3, action_id="ACTION-EVIDENCE-2", evidence_id="FICT-EVIDENCE-2")
    assert state_and_history(contract) == locked

    contract.attach_decision_reference("FICT-CASE-0001", 3, "ACTION-DECISION-1", "FICT-RESULT-1", DIGEST_C)
    decided = contract.get_case("FICT-CASE-0001")
    assert decided["phase"] == "DECISION_RECORDED"
    assert decided["decision_ref_id"] == "FICT-RESULT-1"
    assert decided["decision_digest"] == DIGEST_C
    assert decided["decision_authority"] == "UNVERIFIED_CALLER_ASSERTION"
    with direct_vm.expect_revert("decision reference cannot be attached from this state"):
        contract.attach_decision_reference("FICT-CASE-0001", 4, "ACTION-DECISION-2", "FICT-RESULT-2", DIGEST_B)
    assert contract.get_case("FICT-CASE-0001") == decided


def test_caller_supplied_decision_reference_is_never_reported_as_authoritative(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    append_evidence(contract, direct_vm, direct_alice)
    contract.lock_evidence("FICT-CASE-0001", 2, "ACTION-LOCK-1")

    # No Registry/Evaluator view call occurs in this contract. A well-formed
    # fake ID and digest therefore remain explicitly marked as an assertion.
    contract.attach_decision_reference(
        "FICT-CASE-0001", 3, "ACTION-DECISION-1", "FAKE-MISSING-EVALUATION", DIGEST_C
    )
    case = contract.get_case("FICT-CASE-0001")
    assert case["decision_ref_id"] == "FAKE-MISSING-EVALUATION"
    assert case["decision_digest"] == DIGEST_C
    assert contract.get_evidence("FICT-CASE-0001", "FICT-EVIDENCE-1")["digest"] == DIGEST_A
    assert case["decision_authority"] == "UNVERIFIED_CALLER_ASSERTION"
    assert contract.get_appeal("FAKE-MISSING-EVALUATION") == {}


def test_nonparticipant_cannot_bind_decision_and_rejection_preserves_state(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    append_evidence(contract, direct_vm, direct_alice)
    contract.lock_evidence("FICT-CASE-0001", 2, "ACTION-LOCK-1")
    before = state_and_history(contract)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("caller is not a case participant"):
        contract.attach_decision_reference(
            "FICT-CASE-0001", 3, "ACTION-DECISION-1", "FICT-RESULT-1", DIGEST_C
        )
    assert state_and_history(contract) == before


def test_only_other_named_party_can_challenge_exact_decision_once(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(str(CONTRACT))
    prepare_decision(contract, direct_vm, direct_alice, direct_bob)
    before = state_and_history(contract)

    with direct_vm.expect_revert("decision submitter cannot challenge its own reference"):
        contract.challenge_decision(
            "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
            DIGEST_C, "MATERIAL_ERROR", DIGEST_B
        )
    assert state_and_history(contract) == before

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("caller is not a case participant"):
        contract.challenge_decision(
            "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
            DIGEST_C, "MATERIAL_ERROR", DIGEST_B
        )
    assert state_and_history(contract) == before

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("stale decision commitment"):
        contract.challenge_decision(
            "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
            DIGEST_A, "MATERIAL_ERROR", DIGEST_B
        )
    assert state_and_history(contract) == before

    contract.challenge_decision(
        "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
        DIGEST_C, "MATERIAL_ERROR", DIGEST_B
    )
    challenged = contract.get_case("FICT-CASE-0001")
    assert challenged["phase"] == "CHALLENGE_OPEN"
    assert challenged["challenge_id"] == "FICT-CHALLENGE-1"
    appeal = contract.get_appeal("FICT-CHALLENGE-1")
    assert appeal["appeal_id"] == "FICT-CHALLENGE-1"
    assert appeal["schema_version"] == "1"
    assert appeal["level"] == "1"
    assert appeal["parent_appeal_id"] == ""
    assert appeal["status"] == "FILED_UNADJUDICATED"
    assert appeal["appellant"].lower() == ("0x" + bytes(direct_bob).hex()).lower()
    assert appeal["decision_ref_id"] == "FICT-RESULT-1"
    assert appeal["grounds_code"] == "MATERIAL_ERROR"
    assert appeal["new_evidence_commitment"] == ""
    before_duplicate = state_and_history(contract)
    with direct_vm.expect_revert("decision cannot be challenged from this state"):
        contract.challenge_decision(
            "FICT-CASE-0001", 5, "ACTION-CHALLENGE-2", "FICT-CHALLENGE-2",
            DIGEST_C, "MATERIAL_ERROR", DIGEST_A
        )
    assert state_and_history(contract) == before_duplicate
    assert contract.get_appeal("FICT-CHALLENGE-2") == {}


def test_new_evidence_appeal_stores_only_the_supplied_commitment(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(str(CONTRACT))
    prepare_decision(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    contract.challenge_decision(
        "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
        DIGEST_C, "NEW_EVIDENCE", DIGEST_B,
    )
    appeal = contract.get_appeal("FICT-CHALLENGE-1")
    assert appeal["grounds_digest"] == DIGEST_B
    assert appeal["new_evidence_commitment"] == DIGEST_B
    # This field is a party-supplied digest, not verified evidence bytes.
    assert appeal["status"] == "FILED_UNADJUDICATED"


@pytest.mark.parametrize(
    "grounds_code,grounds_digest,error",
    [
        ("FORGED_GROUND", DIGEST_B, "unsupported challenge grounds"),
        ("NEW_EVIDENCE", "not-a-sha256-digest", "invalid challenge grounds commitment"),
    ],
)
def test_malformed_appeal_grounds_reject_without_state_change(
    direct_vm, direct_deploy, direct_alice, direct_bob, grounds_code, grounds_digest, error
):
    contract = direct_deploy(str(CONTRACT))
    prepare_decision(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    before = state_and_history(contract)

    with direct_vm.expect_revert(error):
        contract.challenge_decision(
            "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
            DIGEST_C, grounds_code, grounds_digest,
        )

    assert state_and_history(contract) == before
    assert contract.get_appeal("FICT-CHALLENGE-1") == {}


def test_appeal_read_rejects_malformed_identifier_and_missing_appeal_is_empty(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))
    assert contract.get_appeal("FICT-APPEAL-404") == {}
    with direct_vm.expect_revert("invalid appeal identifier"):
        contract.get_appeal("bad/id")


def test_freeze_requires_challenge_is_bounded_and_unfreeze_is_authorized(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(str(CONTRACT))
    prepare_decision(contract, direct_vm, direct_alice, direct_bob)
    before = state_and_history(contract)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("freeze requires an open challenge"):
        contract.request_freeze("FICT-CASE-0001", 4, "ACTION-FREEZE-1", DIGEST_A)
    assert state_and_history(contract) == before

    direct_vm.sender = direct_bob
    contract.challenge_decision(
        "FICT-CASE-0001", 4, "ACTION-CHALLENGE-1", "FICT-CHALLENGE-1",
        DIGEST_C, "MATERIAL_ERROR", DIGEST_B
    )
    direct_vm.warp("2030-01-01T00:00:00Z")
    direct_vm.sender = direct_bob
    contract.request_freeze("FICT-CASE-0001", 5, "ACTION-FREEZE-1", DIGEST_A)
    frozen = contract.get_case("FICT-CASE-0001")
    assert frozen["phase"] == "FROZEN"
    assert frozen["frozen"] == "true"
    assert int(frozen["freeze_until"]) == 1893456000 + 86400

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("caller is not a case participant"):
        contract.unfreeze_case("FICT-CASE-0001", 6, "ACTION-UNFREEZE-1")
    assert contract.get_case("FICT-CASE-0001") == frozen

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("only freeze requester may unfreeze before expiry"):
        contract.unfreeze_case("FICT-CASE-0001", 6, "ACTION-UNFREEZE-1")
    assert contract.get_case("FICT-CASE-0001") == frozen

    direct_vm.sender = direct_bob
    contract.unfreeze_case("FICT-CASE-0001", 6, "ACTION-UNFREEZE-1")
    unfrozen = contract.get_case("FICT-CASE-0001")
    assert unfrozen["phase"] == "CHALLENGE_OPEN"
    assert unfrozen["frozen"] == "false"
    assert unfrozen["freeze_used"] == "true"
    with direct_vm.expect_revert("case freeze already used"):
        contract.request_freeze("FICT-CASE-0001", 7, "ACTION-FREEZE-2", DIGEST_B)


def test_expired_freeze_can_be_materialized_by_permissionless_keeper(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(str(CONTRACT))
    open_challenge(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.warp("2030-01-01T00:00:00Z")
    direct_vm.sender = direct_alice
    contract.request_freeze("FICT-CASE-0001", 5, "ACTION-FREEZE-1", DIGEST_A)
    direct_vm.warp("2030-01-02T00:00:01Z")
    direct_vm.sender = direct_charlie

    contract.unfreeze_case("FICT-CASE-0001", 6, "ACTION-UNFREEZE-1")
    assert contract.get_case("FICT-CASE-0001")["frozen"] == "false"


def test_every_other_case_mutation_is_rejected_while_frozen(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    open_challenge(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = direct_alice
    contract.request_freeze("FICT-CASE-0001", 5, "ACTION-FREEZE-1", DIGEST_A)
    before = state_and_history(contract)
    direct_vm.sender = direct_bob

    frozen_calls = [
        ("append", lambda: append_evidence(contract, direct_vm, direct_bob, version=6, action_id="ACTION-EVIDENCE-2", evidence_id="FICT-EVIDENCE-2")),
        ("lock", lambda: contract.lock_evidence("FICT-CASE-0001", 6, "ACTION-LOCK-2")),
        ("decision", lambda: contract.attach_decision_reference("FICT-CASE-0001", 6, "ACTION-DECISION-2", "FICT-RESULT-2", DIGEST_C)),
        ("challenge", lambda: contract.challenge_decision("FICT-CASE-0001", 6, "ACTION-CHALLENGE-2", "FICT-CHALLENGE-2", DIGEST_C, "NEW_EVIDENCE", DIGEST_A)),
        ("freeze", lambda: contract.request_freeze("FICT-CASE-0001", 6, "ACTION-FREEZE-2", DIGEST_B)),
    ]
    for _name, call in frozen_calls:
        with direct_vm.expect_revert("case is frozen"):
            call()
        assert state_and_history(contract) == before


def test_global_challenge_replay_is_rejected_across_cases(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(str(CONTRACT))
    open_challenge(contract, direct_vm, direct_alice, direct_bob)
    open_case(contract, direct_vm, direct_alice, direct_charlie, CASES[1], "ACTION-OPEN-2")
    append_evidence(
        contract, direct_vm, direct_alice, case_id="FICT-CASE-0002", version=1,
        action_id="ACTION-EVIDENCE-2", evidence_id="FICT-EVIDENCE-2", digest=DIGEST_B,
        source_digest=DIGEST_C,
    )
    direct_vm.sender = direct_alice
    contract.lock_evidence("FICT-CASE-0002", 2, "ACTION-LOCK-2")
    contract.attach_decision_reference("FICT-CASE-0002", 3, "ACTION-DECISION-2", "FICT-RESULT-2", DIGEST_A)
    before = state_and_history(contract, "FICT-CASE-0002")

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("challenge identifier already used"):
        contract.challenge_decision(
            "FICT-CASE-0002", 4, "ACTION-CHALLENGE-2", "FICT-CHALLENGE-1",
            DIGEST_A, "PROCEDURAL_CONCERN", DIGEST_B
        )
    assert state_and_history(contract, "FICT-CASE-0002") == before


def test_rejected_calls_preserve_full_accepted_history(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    append_evidence(contract, direct_vm, direct_alice)
    before = state_and_history(contract)

    with direct_vm.expect_revert("invalid source reference commitment"):
        append_evidence(
            contract, direct_vm, direct_bob, version=2, action_id="ACTION-EVIDENCE-2",
            evidence_id="FICT-EVIDENCE-2", source_digest="invalid",
        )
    assert state_and_history(contract) == before
    assert contract.get_evidence("FICT-CASE-0001", "FICT-EVIDENCE-2") == {}


def test_per_case_evidence_capacity_boundary(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)

    for index in range(1, 33):
        append_evidence(
            contract,
            direct_vm,
            direct_alice,
            version=index,
            action_id=f"ACTION-EVIDENCE-{index}",
            evidence_id=f"FICT-EVIDENCE-{index}",
        )

    before = state_and_history(contract)
    with direct_vm.expect_revert("case evidence capacity reached"):
        append_evidence(
            contract,
            direct_vm,
            direct_alice,
            version=33,
            action_id="ACTION-EVIDENCE-33",
            evidence_id="FICT-EVIDENCE-33",
        )
    assert state_and_history(contract) == before
    assert contract.get_case("FICT-CASE-0001")["evidence_count"] == "32"


def test_case_count_capacity_boundary(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    module = sys.modules[contract.__class__.__module__]
    module.MAX_CASES = module.u32(1)
    before = state_and_history(contract)

    with direct_vm.expect_revert("case capacity reached"):
        open_case(
            contract,
            direct_vm,
            direct_alice,
            direct_bob,
            CASES[1],
            action_id="ACTION-OPEN-2",
        )

    assert contract.get_case_count() == 1
    assert contract.has_case("FICT-CASE-0002") is False
    assert state_and_history(contract) == before


@pytest.mark.parametrize(
    "capacity_name, expected_error",
    [
        ("MAX_ACTIONS", "action capacity reached"),
        ("MAX_ACTIONS_PER_CASE", "case action capacity reached"),
    ],
)
def test_action_capacity_boundaries_preserve_state(
    direct_vm, direct_deploy, direct_alice, direct_bob, capacity_name, expected_error
):
    contract = direct_deploy(str(CONTRACT))
    open_case(contract, direct_vm, direct_alice, direct_bob)
    module = sys.modules[contract.__class__.__module__]
    setattr(module, capacity_name, module.u32(1))
    before = state_and_history(contract)

    with direct_vm.expect_revert(expected_error):
        append_evidence(contract, direct_vm, direct_alice)

    assert state_and_history(contract) == before
    assert contract.get_evidence("FICT-CASE-0001", "FICT-EVIDENCE-1") == {}


def test_history_is_sequential_append_only_and_rejection_does_not_erase_it(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(str(CONTRACT))
    prepare_decision(contract, direct_vm, direct_alice, direct_bob)
    accepted = [contract.get_case_action("FICT-CASE-0001", i) for i in range(1, 5)]
    assert [item["case_sequence"] for item in accepted] == ["1", "2", "3", "4"]
    assert [item["new_version"] for item in accepted] == ["1", "2", "3", "4"]

    with direct_vm.expect_revert("stale case version"):
        contract.lock_evidence("FICT-CASE-0001", 2, "ACTION-LOCK-2")
    assert [contract.get_case_action("FICT-CASE-0001", i) for i in range(1, 5)] == accepted
    assert contract.get_case_action_count("FICT-CASE-0001") == 4
