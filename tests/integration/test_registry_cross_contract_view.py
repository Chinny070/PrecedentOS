import json
import hashlib
import os
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

import pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_failed, tx_execution_succeeded
from gltest_cli.config.general import get_general_config
from gltest.types import TransactionHashVariant, TransactionStatus


ROOT = Path(__file__).parents[2]
REGISTRY_PATH = "contracts/precedent_registry.py"
CALLER_PATH = "tests/integration/contracts/registry_view_caller.py"
FIXTURE = ROOT / "tests" / "fixtures" / "fictional_precedents.json"
RECORD = json.loads(FIXTURE.read_text(encoding="utf-8"))["records"][0]
EVALUATION_FIXTURE = json.loads((ROOT / "tests" / "fixtures" / "fictional_evaluations.json").read_text(encoding="utf-8"))
CASE_FIXTURE = json.loads((ROOT / "tests" / "fixtures" / "fictional_cases.json").read_text(encoding="utf-8"))["cases"][0]


class _RejectRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        return None


def _read(contract, method, *args):
    return getattr(contract, method)(args=list(args)).call(
        transaction_hash_variant=TransactionHashVariant.LATEST_FINAL
    )


def _require_loopback_localnet_identity(config=None):
    """Fail closed before deployment unless gltest itself targets localnet 61127."""
    config = config or get_general_config()
    if config.get_network_name() != "localnet":
        pytest.fail("refusing integration deployment: genlayer-test network must be localnet")
    rpc_url = config.get_rpc_url()
    parsed = urlparse(rpc_url)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        pytest.fail("refusing integration deployment: configured RPC must be loopback HTTP")

    request = Request(
        rpc_url,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": []}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with build_opener(_RejectRedirect).open(request, timeout=5) as response:
            if response.status != 200:
                pytest.fail(f"refusing integration deployment: RPC returned HTTP {response.status}")
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, TimeoutError) as exc:
        pytest.fail(f"refusing integration deployment: local RPC identity check failed: {exc}")
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        pytest.fail(f"refusing integration deployment: local RPC returned invalid JSON: {exc}")

    if payload.get("id") != 1 or payload.get("jsonrpc") != "2.0" or "error" in payload:
        pytest.fail("refusing integration deployment: malformed JSON-RPC identity response")
    result = payload.get("result")
    if not isinstance(result, str) or not result.startswith("0x"):
        pytest.fail("refusing integration deployment: eth_chainId result is missing")
    actual_chain_id = int(result, 16)
    if actual_chain_id != 61127:
        pytest.fail(f"refusing integration deployment: expected localnet 61127, observed {actual_chain_id}")


def test_local_deployment_preflight_rejects_nonlocal_network_without_rpc():
    class Config:
        def get_network_name(self):
            return "studionet"

        def get_rpc_url(self):
            return "https://studio.genlayer.com/api"

    with pytest.raises(pytest.fail.Exception, match="network must be localnet"):
        _require_loopback_localnet_identity(Config())


def test_local_deployment_preflight_rejects_nonloopback_rpc_without_request():
    class Config:
        def get_network_name(self):
            return "localnet"

        def get_rpc_url(self):
            return "https://studio.genlayer.com/api"

    with pytest.raises(pytest.fail.Exception, match="loopback HTTP"):
        _require_loopback_localnet_identity(Config())


def test_registry_to_caller_view_on_local_studio():
    if os.environ.get("PRECEDENTOS_RUN_LOCAL_INTEGRATION") != "1":
        pytest.skip("set PRECEDENTOS_RUN_LOCAL_INTEGRATION=1 to allow local RPC deployments")

    _require_loopback_localnet_identity()

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


def test_evaluator_read_through_separate_caller_on_local_studio():
    if os.environ.get("PRECEDENTOS_RUN_LOCAL_EVALUATOR_INTEGRATION") != "1":
        pytest.skip("set PRECEDENTOS_RUN_LOCAL_EVALUATOR_INTEGRATION=1 after approving local deployments and AI execution")

    _require_loopback_localnet_identity()
    case = EVALUATION_FIXTURE["cases"]["unexplained_conflict"]
    passage_a = case["precedent_a"]
    passage_b = case["precedent_b"]
    digest_a = hashlib.sha256(passage_a.encode("utf-8")).hexdigest()
    digest_b = hashlib.sha256(passage_b.encode("utf-8")).hexdigest()
    packet = json.dumps({"precedent_a": passage_a, "precedent_b": passage_b}, sort_keys=True, separators=(",", ":"))
    evaluation_id = "STAGE8-CONFLICT-01"

    evaluator = get_contract_factory(contract_file_path="contracts/precedent_evaluator.py").deploy(
        args=[], wait_transaction_status=TransactionStatus.FINALIZED,
    )
    caller = get_contract_factory(contract_file_path="tests/integration/contracts/evaluator_view_caller.py").deploy(
        args=[evaluator.address], wait_transaction_status=TransactionStatus.FINALIZED,
    )
    assert _read(caller, "has_evaluation", evaluation_id) is False
    assert _read(caller, "read_evaluation", evaluation_id) == {}

    args = [
        evaluation_id, case["record_a_id"], digest_a, case["record_b_id"], digest_b,
        packet, EVALUATION_FIXTURE["evidence_schema_version"],
        EVALUATION_FIXTURE["criteria_version"], EVALUATION_FIXTURE["criteria"],
    ]
    mismatch = list(args)
    mismatch[2] = "0" * 64 if digest_a != "0" * 64 else "1" * 64
    rejected_digest = evaluator.evaluate_pair(args=mismatch).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_failed(rejected_digest)
    assert _read(caller, "has_evaluation", evaluation_id) is False

    accepted = evaluator.evaluate_pair(args=args).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(accepted)
    stored = _read(caller, "read_evaluation", evaluation_id)
    assert _read(caller, "has_evaluation", evaluation_id) is True
    assert stored["evaluation_id"] == evaluation_id
    assert stored["record_a_digest"] == digest_a
    assert stored["record_b_digest"] == digest_b
    assert stored["input_commitment"]

    replay = evaluator.evaluate_pair(args=args).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_failed(replay)
    assert _read(caller, "read_evaluation", evaluation_id) == stored


def test_case_court_identity_and_evidence_are_read_through_separate_caller():
    if os.environ.get("PRECEDENTOS_RUN_LOCAL_CASECOURT_INTEGRATION") != "1":
        pytest.skip("set PRECEDENTOS_RUN_LOCAL_CASECOURT_INTEGRATION=1 after approving local deployments and writes")

    _require_loopback_localnet_identity()
    case_id = "FICT-STAGE8-CASE-01"
    evidence_id = "FICT-STAGE8-EVIDENCE-01"
    evidence_text = "Fictional Stage 8 public evidence packet for local runtime verification only."
    evidence_digest = hashlib.sha256(evidence_text.encode("utf-8")).hexdigest()
    source_digest = hashlib.sha256(b"fictional-stage8-source-reference").hexdigest()
    respondent = "0x000000000000000000000000000000000000dEaD"

    court = get_contract_factory(contract_file_path="contracts/case_court.py").deploy(
        args=[], wait_transaction_status=TransactionStatus.FINALIZED,
    )
    caller_factory = get_contract_factory(contract_file_path="tests/integration/contracts/case_court_view_caller.py")
    caller = caller_factory.deploy(args=[court.address], wait_transaction_status=TransactionStatus.FINALIZED)
    assert _read(caller, "has_case", case_id) is False
    assert _read(caller, "read_case", case_id) == {}

    opened = court.open_case(args=[
        case_id, "STAGE8-OPEN-01", respondent, CASE_FIXTURE["case_type"],
        CASE_FIXTURE["policy_version"], CASE_FIXTURE["opening_evidence_digest"],
    ]).transact(wait_transaction_status=TransactionStatus.FINALIZED)
    assert tx_execution_succeeded(opened)
    case_record = _read(caller, "read_case", case_id)
    assert _read(caller, "has_case", case_id) is True
    assert case_record["case_id"] == case_id
    assert case_record["opening_evidence_digest"] == CASE_FIXTURE["opening_evidence_digest"]
    assert _read(caller, "read_evidence", case_id, evidence_id) == {}

    appended = court.append_evidence(args=[
        case_id, 1, "STAGE8-EVIDENCE-ACTION-01", evidence_id,
        evidence_digest, 1, source_digest,
    ]).transact(wait_transaction_status=TransactionStatus.FINALIZED)
    assert tx_execution_succeeded(appended)
    evidence_record = _read(caller, "read_evidence", case_id, evidence_id)
    assert evidence_record["case_id"] == case_id
    assert evidence_record["evidence_id"] == evidence_id
    assert evidence_record["digest"] == evidence_digest
    action = _read(caller, "read_action", case_id, 2)
    assert action["action_kind"] == "EVIDENCE_APPENDED"

    locked = court.lock_evidence(args=[case_id, 2, "STAGE8-LOCK-01"]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(locked)
    before_rejection = _read(caller, "read_case", case_id)
    before_evidence = _read(caller, "read_evidence", case_id, evidence_id)
    rejected_transition = court.append_evidence(args=[
        case_id, 3, "STAGE8-EVIDENCE-ACTION-02", "FICT-STAGE8-EVIDENCE-02",
        "b" * 64, 1, "c" * 64,
    ]).transact(wait_transaction_status=TransactionStatus.FINALIZED)
    assert tx_execution_failed(rejected_transition)
    replayed_open = court.open_case(args=[
        case_id, "STAGE8-OPEN-REPLAY", respondent, CASE_FIXTURE["case_type"],
        CASE_FIXTURE["policy_version"], CASE_FIXTURE["opening_evidence_digest"],
    ]).transact(wait_transaction_status=TransactionStatus.FINALIZED)
    assert tx_execution_failed(replayed_open)
    assert _read(caller, "read_case", case_id) == before_rejection
    assert _read(caller, "read_evidence", case_id, evidence_id) == before_evidence

    wrong_target = caller_factory.deploy(
        args=["0x0000000000000000000000000000000000000001"],
        wait_transaction_status=TransactionStatus.FINALIZED,
    )
    with pytest.raises(Exception):
        _read(wrong_target, "read_case", case_id)
