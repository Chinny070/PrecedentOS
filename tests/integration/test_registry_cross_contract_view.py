import json
import os
from pathlib import Path

import pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_failed, tx_execution_succeeded
from gltest.types import TransactionHashVariant, TransactionStatus


ROOT = Path(__file__).parents[2]
REGISTRY_PATH = "contracts/precedent_registry.py"
CALLER_PATH = "tests/integration/contracts/registry_view_caller.py"
FIXTURE = ROOT / "tests" / "fixtures" / "fictional_precedents.json"
RECORD = json.loads(FIXTURE.read_text(encoding="utf-8"))["records"][0]


def _read(contract, method, *args):
    return getattr(contract, method)(args=list(args)).call(
        transaction_hash_variant=TransactionHashVariant.LATEST_FINAL
    )


def test_registry_to_caller_view_on_local_studio():
    if os.environ.get("PRECEDENTOS_RUN_LOCAL_INTEGRATION") != "1":
        pytest.skip("set PRECEDENTOS_RUN_LOCAL_INTEGRATION=1 to allow local RPC deployments")

    registry_factory = get_contract_factory(contract_file_path=REGISTRY_PATH)
    registry = registry_factory.deploy(
        args=[],
        wait_transaction_status=TransactionStatus.FINALIZED,
    )

    registration = registry.register_precedent(
        args=[
            RECORD["record_id"],
            RECORD["evidence_digest"],
            RECORD["schema_version"],
            RECORD["jurisdiction"],
            RECORD["decision_date"],
            RECORD["category"],
        ]
    ).transact(wait_transaction_status=TransactionStatus.FINALIZED)
    assert tx_execution_succeeded(registration)

    caller_factory = get_contract_factory(contract_file_path=CALLER_PATH)
    caller = caller_factory.deploy(
        args=[registry.address],
        wait_transaction_status=TransactionStatus.FINALIZED,
    )

    assert _read(caller, "has_record", RECORD["record_id"]) is True
    returned = _read(caller, "read_record", RECORD["record_id"])
    assert returned["record_id"] == RECORD["record_id"]
    assert returned["evidence_digest"] == RECORD["evidence_digest"]
    assert returned["schema_version"] == str(RECORD["schema_version"])
    assert returned["jurisdiction"] == RECORD["jurisdiction"]
    assert returned["decision_date"] == RECORD["decision_date"]
    assert returned["category"] == RECORD["category"]
    assert returned["registration_sequence"] == "1"

    assert _read(caller, "has_record", "FICT-Z-9999") is False
    assert _read(caller, "read_record", "FICT-Z-9999") == {}

    duplicate = registry.register_precedent(
        args=[
            RECORD["record_id"],
            "c" * 64,
            RECORD["schema_version"],
            RECORD["jurisdiction"],
            RECORD["decision_date"],
            RECORD["category"],
        ]
    ).transact(wait_transaction_status=TransactionStatus.FINALIZED)
    assert tx_execution_failed(duplicate)

    assert _read(caller, "read_record", RECORD["record_id"]) == returned
    assert _read(registry, "get_registration_count") == 1
