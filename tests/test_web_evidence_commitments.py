import json
from pathlib import Path

from precedentos_protocol.web_evidence import (
    capture_input_commitment,
    comparison_commitment,
    comparison_input_commitment,
    excerpt_commitment,
    retrieval_request_commitment,
    source_registration_commitment,
    verification_commitment,
)


VECTORS = json.loads((Path(__file__).parent / "fixtures" / "web_evidence_commitment_vectors.json").read_text())


def test_python_web_evidence_commitments_match_shared_vector():
    assert source_registration_commitment(VECTORS["registration"]) == VECTORS["registration"]["source_commitment"]
    assert retrieval_request_commitment(VECTORS["request"]) == VECTORS["request"]["expected_commitment"]
    assert capture_input_commitment(
        VECTORS["registration"], **{key: VECTORS["capture"][key] for key in (
            "case_version", "request_id", "request_commitment", "verification_schema_version",
            "criteria_version", "criteria"
        )}
    ) == VECTORS["capture"]["input_commitment"]
    assert excerpt_commitment(VECTORS["claims"]) == VECTORS["excerpt_commitment"]
    assert verification_commitment(VECTORS["verification"]) == VECTORS["verification_commitment"]
    comparison_input = {key: value for key, value in VECTORS["comparison_input"].items() if key != "expected"}
    assert comparison_input_commitment(**comparison_input) == VECTORS["comparison_input"]["expected"]
    assert comparison_commitment(VECTORS["comparison"]) == VECTORS["comparison_commitment"]
