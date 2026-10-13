"""Pure Python mirrors for bounded CaseCourt web-evidence commitments."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Mapping, Sequence


def sha256_fields(fields: Sequence[str]) -> str:
    framed = "".join(f"{len(value.encode('utf-8'))}:{value}" for value in fields)
    return hashlib.sha256(framed.encode("utf-8")).hexdigest()


def _json(value: Any, *, sort_keys: bool = False) -> str:
    return json.dumps(value, sort_keys=sort_keys, ensure_ascii=True, separators=(",", ":"))


def retrieval_request_commitment(value: Mapping[str, Any]) -> str:
    return sha256_fields([
        "PrecedentOS-WEB-RETRIEVAL-REQUEST-v1", str(value["case_id"]), str(value["source_id"]),
        str(value["source_version"]), str(value["request_id"]), str(value["url_digest"]),
        str(value["source_commitment"]), str(value["attempt"]), str(value["requester"]).lower(),
        str(value["status"]), str(value["requested_at"]),
    ])


def source_registration_commitment(value: Mapping[str, Any]) -> str:
    return sha256_fields([
        "PrecedentOS-WEB-SOURCE-REGISTRATION-v1", str(value["chain_id"]),
        str(value["court_address"]).lower(), str(value["case_id"]), str(value["source_id"]),
        str(value["source_version"]), str(value["source_schema_version"]), str(value["binding_kind"]),
        str(value["appeal_id"]), str(value["evidence_id"]), str(value["url_digest"]),
        str(value["url_host"]), str(value["previous_content_digest"]), str(value["proposer"]).lower(),
        str(value["registered_at"]),
    ])


def capture_input_commitment(
    registration: Mapping[str, Any], *, case_version: int, request_id: str, request_commitment: str,
    verification_schema_version: int, criteria_version: int, criteria: str,
) -> str:
    return sha256_fields([
        "PrecedentOS-WEB-CAPTURE-INPUT-v1", str(registration["chain_id"]),
        str(registration["court_address"]).lower(), str(registration["case_id"]), str(case_version),
        str(registration["binding_kind"]), str(registration["appeal_id"]), str(registration["source_id"]),
        str(registration["source_version"]), str(registration["evidence_id"]), request_id,
        str(registration["source_commitment"]), str(registration["url_digest"]),
        str(registration["previous_content_digest"]), request_commitment, str(verification_schema_version),
        str(criteria_version), hashlib.sha256(criteria.encode("utf-8")).hexdigest(),
    ])


def excerpt_commitment(claims: Sequence[Mapping[str, Any]]) -> str:
    fields = ["PrecedentOS-WEB-EXCERPTS-v1", str(len(claims))]
    for claim in claims:
        fields.extend([str(claim["fact_kind"]), str(claim["polarity"]),
                       str(claim["finding"]), str(claim["excerpt"])])
    return sha256_fields(fields)


def verification_commitment(value: Mapping[str, Any]) -> str:
    claims_json = _json(value.get("claims", []), sort_keys=True)
    reasoning_digest = hashlib.sha256(str(value["reasoning_summary"]).encode("utf-8")).hexdigest()
    return sha256_fields([
        "PrecedentOS-WEB-VERIFICATION-v1", str(value["verification_id"]), str(value["chain_id"]),
        str(value["court_address"]).lower(), str(value["case_id"]), str(value["case_version"]),
        str(value["binding_kind"]), str(value["appeal_id"]), str(value["evidence_id"]),
        str(value["source_commitment"]), str(value["source_id"]), str(value["source_version"]),
        str(value["request_id"]), str(value["verification_schema_version"]),
        str(value["retrieval_status"]), str(value["reason_code"]), str(value["provenance"]),
        str(value["url_digest"]), str(value["input_commitment"]), str(value["freshness_status"]),
        str(value["source_content_digest"]), str(value["excerpt_commitment"]),
        str(value["source_change"]), str(value.get("previous_content_digest", "")),
        "true" if value["evidence_sufficient"] else "false", claims_json, reasoning_digest,
        str(value["recorded_at"]),
    ])


def comparison_input_commitment(
    *, chain_id: int, court_address: str, case_id: str, case_version: int,
    comparison_id: str, comparison_schema_version: int, criteria_version: int, criteria: str,
    left: Mapping[str, Any], right: Mapping[str, Any],
) -> str:
    return sha256_fields([
        "PrecedentOS-WEB-SOURCE-COMPARISON-INPUT-v1", str(chain_id), court_address.lower(),
        case_id, str(case_version), comparison_id, str(comparison_schema_version), str(criteria_version),
        hashlib.sha256(criteria.encode("utf-8")).hexdigest(),
        str(left["source_id"]), str(left["version"]), str(left["verification_id"]), str(left["url_digest"]),
        str(left["content_digest"]), str(left["verification_commitment"]),
        str(right["source_id"]), str(right["version"]), str(right["verification_id"]), str(right["url_digest"]),
        str(right["content_digest"]), str(right["verification_commitment"]),
    ])


def comparison_commitment(value: Mapping[str, Any]) -> str:
    reasoning_digest = hashlib.sha256(str(value["reasoning_summary"]).encode("utf-8")).hexdigest()
    return sha256_fields([
        "PrecedentOS-WEB-SOURCE-COMPARISON-v1", str(value["case_id"]), str(value["chain_id"]),
        str(value["court_address"]).lower(), str(value["case_version"]), str(value["comparison_id"]),
        str(value["comparison_schema_version"]), str(value["input_commitment"]),
        str(value["left_source_id"]), str(value["left_source_version"]), str(value["left_verification_id"]),
        str(value["left_url_digest"]), str(value["left_verification_commitment"]), str(value["left_content_digest"]),
        str(value["right_source_id"]), str(value["right_source_version"]), str(value["right_verification_id"]),
        str(value["right_url_digest"]), str(value["right_verification_commitment"]),
        str(value["right_content_digest"]), str(value["relation"]),
        "true" if value["source_conflict"] else "false",
        "true" if value["evidence_sufficient"] else "false", _json(value["conflict_pairs"]), reasoning_digest,
        str(value["recorded_at"]),
    ])
