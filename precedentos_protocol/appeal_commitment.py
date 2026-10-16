"""Pure Python mirrors for the bounded CaseCourt appellate SHA-256 commitments."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Mapping, Sequence


def encode_length_prefixed_fields(fields: Sequence[str]) -> str:
    return "".join(f"{len(value.encode('utf-8'))}:{value}" for value in fields)


def sha256_fields(fields: Sequence[str]) -> str:
    return hashlib.sha256(encode_length_prefixed_fields(fields).encode("utf-8")).hexdigest()


def appeal_filing_commitment(
    *, appeal_id: str, case_id: str, target_kind: str, target_id: str, target_version: int,
    target_commitment: str, parent_appeal_id: str, appellant: str, grounds_code: str, grounds_digest: str,
) -> str:
    return sha256_fields([
        "PrecedentOS-APPEAL-COURT-FILING-v1", appeal_id, case_id, target_kind, target_id,
        str(target_version), target_commitment, parent_appeal_id, appellant.lower(), grounds_code, grounds_digest,
    ])


def appeal_evidence_commitment(*, case_id: str, appeal_id: str, references: Sequence[Mapping[str, Any]]) -> str:
    fields = ["PrecedentOS-APPEAL-EVIDENCE-v1", case_id, appeal_id, str(len(references))]
    for sequence, reference in enumerate(references, 1):
        fields.extend([
            str(sequence), str(reference["evidence_id"]), str(reference["digest"]),
            str(reference["schema_version"]), str(reference["source_reference_digest"]),
        ])
    return sha256_fields(fields)


def appellate_input_commitment(
    *, chain_id: int, court_address: str, case_id: str, appeal: Mapping[str, Any],
    original: Mapping[str, Any], case_version: int, original_root: str, appeal_root: str,
    ruling_schema_version: int,
) -> str:
    return sha256_fields([
        "PrecedentOS-APPELLATE-INPUT-v1", str(chain_id), court_address.lower(), case_id,
        str(appeal["appeal_id"]), str(appeal["target_kind"]), str(appeal["target_id"]),
        str(appeal["target_version"]), str(appeal["target_commitment"]), str(appeal["original_judgment_id"]),
        str(appeal["original_judgment_version"]), str(appeal["original_judgment_commitment"]),
        str(case_version), original_root, appeal_root, str(appeal["grounds_code"]), str(appeal["grounds_digest"]),
        str(appeal["criteria_version"]), str(appeal["criteria_digest"]), str(ruling_schema_version),
        str(appeal["level"]), str(appeal["parent_appeal_id"]), str(original["judgment_commitment"]),
    ])


def appellate_result_commitment(input_commitment: str, result: Mapping[str, Any], ruling_schema_version: int) -> str:
    reasoning_digest = hashlib.sha256(str(result["reasoning_summary"]).encode("utf-8")).hexdigest()
    compact = lambda value: json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return sha256_fields([
        "PrecedentOS-APPELLATE-RESULT-v2", input_commitment, str(ruling_schema_version), str(result["outcome"]),
        "true" if result["original_judgment_valid"] else "false",
        "true" if result["material_error_found"] else "false",
        "true" if result["evidence_sufficient"] else "false",
        "true" if result["reversal_justified"] else "false",
        "true" if result["remand_required"] else "false", str(result["case_state_change"]),
        compact(result["applicable_criteria"]), compact(result["material_findings"]), reasoning_digest,
    ])
