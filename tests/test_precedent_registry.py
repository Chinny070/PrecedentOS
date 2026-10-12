import json
from pathlib import Path

import pytest


CONTRACT = Path(__file__).parents[1] / "contracts" / "precedent_registry.py"
FIXTURE = Path(__file__).parent / "fixtures" / "fictional_precedents.json"
RECORDS = json.loads(FIXTURE.read_text(encoding="utf-8"))["records"]


def register(contract, record):
    contract.register_precedent(
        record["record_id"],
        record["evidence_digest"],
        record["schema_version"],
        record["jurisdiction"],
        record["decision_date"],
        record["category"],
    )


def test_successful_registration_and_metadata(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(str(CONTRACT))
    direct_vm.sender = direct_alice

    register(contract, RECORDS[0])

    record = contract.get_precedent("FICT-A-0001")
    assert contract.has_precedent("FICT-A-0001") is True
    assert record["record_id"] == "FICT-A-0001"
    assert record["evidence_digest"] == RECORDS[0]["evidence_digest"]
    assert record["schema_version"] == "1"
    assert record["jurisdiction"] == "Fictional North District"
    assert record["decision_date"] == "2030-01-15"
    assert record["category"] == "Fictional permit dispute"
    expected_submitter = "0x" + bytes(direct_alice).hex()
    assert record["submitter"].lower() == expected_submitter.lower()
    assert record["registration_sequence"] == "1"
    assert contract.get_registration_count() == 1


def test_multiple_independent_registrations(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))

    register(contract, RECORDS[0])
    register(contract, RECORDS[1])

    assert contract.get_registration_count() == 2
    assert contract.get_precedent("FICT-A-0001")["registration_sequence"] == "1"
    assert contract.get_precedent("FICT-B-0002")["registration_sequence"] == "2"


def test_duplicate_registration_is_rejected_without_state_change(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))
    register(contract, RECORDS[0])
    before = contract.get_precedent("FICT-A-0001")
    count_before = contract.get_registration_count()

    with direct_vm.expect_revert("record identifier already registered"):
        register(contract, {**RECORDS[0], "evidence_digest": "c" * 64})

    assert contract.get_precedent("FICT-A-0001") == before
    assert contract.get_registration_count() == count_before


@pytest.mark.parametrize("record_id", ["", "AB", "-FICT-A-0001", "FICT-A-", "FICT--A-0001", "FICT-A-0001!", "fict-a-0001", "FICT-é-001"])
def test_invalid_record_identifiers_are_rejected(direct_vm, direct_deploy, record_id):
    contract = direct_deploy(str(CONTRACT))
    record = {**RECORDS[0], "record_id": record_id}

    with direct_vm.expect_revert("invalid record identifier"):
        register(contract, record)

    assert contract.get_registration_count() == 0


@pytest.mark.parametrize("digest", ["", "a" * 63, "a" * 65, "g" * 64, "A" * 64, "é" * 64])
def test_invalid_evidence_digests_are_rejected(direct_vm, direct_deploy, digest):
    contract = direct_deploy(str(CONTRACT))
    record = {**RECORDS[0], "evidence_digest": digest}

    with direct_vm.expect_revert("invalid evidence digest"):
        register(contract, record)

    assert contract.get_registration_count() == 0


@pytest.mark.parametrize("schema_version", [0, 2, 4294967295])
def test_unsupported_schema_versions_are_rejected(direct_vm, direct_deploy, schema_version):
    contract = direct_deploy(str(CONTRACT))
    record = {**RECORDS[0], "schema_version": schema_version}

    with direct_vm.expect_revert("unsupported schema version"):
        register(contract, record)

    assert contract.get_registration_count() == 0


@pytest.mark.parametrize(
    "field,value",
    [
        ("jurisdiction", "J" * 65),
        ("category", "C" * 65),
        ("decision_date", "2030/01/15"),
        ("decision_date", "203O-01-15"),
        ("jurisdiction", ""),
        ("category", "Confidential name: Test Person"),
    ],
)
def test_invalid_or_oversized_metadata_is_rejected(direct_vm, direct_deploy, field, value):
    contract = direct_deploy(str(CONTRACT))
    record = {**RECORDS[0], field: value}

    with direct_vm.expect_revert("invalid or oversized public metadata"):
        register(contract, record)

    assert contract.get_registration_count() == 0


def test_missing_record_behavior_is_deterministic(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))

    assert contract.has_precedent("FICT-Z-9999") is False
    assert contract.get_precedent("FICT-Z-9999") == {}


def test_append_only_record_cannot_be_overwritten(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))
    register(contract, RECORDS[0])
    original = contract.get_precedent("FICT-A-0001")

    with direct_vm.expect_revert("record identifier already registered"):
        register(contract, {**RECORDS[0], "category": "Changed category"})

    assert contract.get_precedent("FICT-A-0001") == original
    assert contract.get_registration_count() == 1


def test_rejected_registration_preserves_existing_and_new_record_state(direct_vm, direct_deploy):
    contract = direct_deploy(str(CONTRACT))
    register(contract, RECORDS[0])
    original = contract.get_precedent("FICT-A-0001")

    with direct_vm.expect_revert("invalid evidence digest"):
        register(contract, {**RECORDS[1], "evidence_digest": "not-a-digest"})

    assert contract.get_precedent("FICT-A-0001") == original
    assert contract.has_precedent("FICT-B-0002") is False
    assert contract.get_registration_count() == 1
