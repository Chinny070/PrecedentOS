"""Deterministic case-decision schema checks for local preparation.

This module deliberately has no GenLayer imports and performs no network calls.
Passing these checks proves schema/commitment consistency only; it does not prove
that a contract exists, a transaction finalized, or validators accepted a result.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import re
from typing import Iterable, Mapping, Sequence


CASE_EVIDENCE_SCHEMA_VERSION = 1
CASE_DECISION_SCHEMA_VERSION = 1
SUPPORTED_POLICY_VERSION = 1
SUPPORTED_CRITERIA_VERSION = 1
MAX_EVIDENCE_REFERENCES = 32
MAX_CASE_ID_LENGTH = 48
MAX_ACTION_ID_LENGTH = 48
ID_PATTERN = re.compile(r"^[A-Z0-9](?:[A-Z0-9]|-(?=[A-Z0-9]))*[A-Z0-9]$")
DIGEST_PATTERN = re.compile(r"^[0-9a-f]{64}$")
ADDRESS_PATTERN = re.compile(r"^0x[0-9a-fA-F]{40}$")
CLASSIFICATIONS = {
    "SUPPORTED",
    "NOT_SUPPORTED",
    "CONTRADICTED",
    "INSUFFICIENT_EVIDENCE",
}
OUTCOMES = {"GRANT", "DENY", "REMAND", "NO_RECOMMENDATION"}


class DecisionValidationError(ValueError):
    """Stable error type for deterministic local schema checks."""


def _require_id(value: str, field: str, maximum: int = MAX_ACTION_ID_LENGTH) -> None:
    if not isinstance(value, str) or not 3 <= len(value) <= maximum or not ID_PATTERN.fullmatch(value):
        raise DecisionValidationError(f"invalid_{field}")


def _require_digest(value: str, field: str) -> None:
    if not isinstance(value, str) or not DIGEST_PATTERN.fullmatch(value):
        raise DecisionValidationError(f"invalid_{field}")


def _require_address(value: str, field: str) -> str:
    if not isinstance(value, str) or not ADDRESS_PATTERN.fullmatch(value):
        raise DecisionValidationError(f"invalid_{field}")
    return value.lower()


def _encode_fields(fields: Iterable[str]) -> bytes:
    """Encode fields as UTF-8 byte-length-prefixed strings (no normalization)."""
    encoded: list[str] = []
    for field in fields:
        if not isinstance(field, str):
            raise DecisionValidationError("non_string_commitment_field")
        encoded.append(f"{len(field.encode('utf-8'))}:{field}")
    return "".join(encoded).encode("utf-8")


def _sha256_fields(fields: Iterable[str]) -> str:
    return hashlib.sha256(_encode_fields(fields)).hexdigest()


@dataclass(frozen=True)
class EvidenceReference:
    sequence: int
    evidence_id: str
    digest: str
    schema_version: int
    source_reference_digest: str


def case_evidence_commitment(case_id: str, references: Sequence[EvidenceReference]) -> str:
    """Commit to an ordered bounded evidence-reference list, not its source truth."""
    _require_id(case_id, "case_id", MAX_CASE_ID_LENGTH)
    if not isinstance(references, (tuple, list)) or not 1 <= len(references) <= MAX_EVIDENCE_REFERENCES:
        raise DecisionValidationError("invalid_evidence_reference_count")
    fields = ["PrecedentOS-CASE-EVIDENCE-v1", case_id, str(len(references))]
    seen: set[str] = set()
    for expected_sequence, reference in enumerate(references, start=1):
        if not isinstance(reference, EvidenceReference):
            raise DecisionValidationError("invalid_evidence_reference")
        if reference.sequence != expected_sequence:
            raise DecisionValidationError("noncanonical_evidence_sequence")
        _require_id(reference.evidence_id, "evidence_id")
        if reference.evidence_id in seen:
            raise DecisionValidationError("duplicate_evidence_id")
        seen.add(reference.evidence_id)
        _require_digest(reference.digest, "evidence_digest")
        _require_digest(reference.source_reference_digest, "source_reference_digest")
        if reference.schema_version != 1:
            raise DecisionValidationError("unsupported_evidence_schema_version")
        fields.extend(
            [
                str(reference.sequence),
                reference.evidence_id,
                reference.digest,
                str(reference.schema_version),
                reference.source_reference_digest,
            ]
        )
    return _sha256_fields(fields)


def verify_evidence_bytes(reference: EvidenceReference, payload: bytes) -> None:
    """Require exact source bytes to match the reference digest (truth not implied)."""
    if not isinstance(payload, bytes):
        raise DecisionValidationError("evidence_payload_must_be_bytes")
    _require_digest(reference.digest, "evidence_digest")
    if hashlib.sha256(payload).hexdigest() != reference.digest:
        raise DecisionValidationError("evidence_bytes_digest_mismatch")


@dataclass(frozen=True)
class CaseDecisionContext:
    chain_id: int
    case_id: str
    case_version: int
    case_evidence_commitment: str
    policy_version: int
    criteria_version: int
    criteria_digest: str
    court_address: str
    petitioner: str
    respondent: str


@dataclass(frozen=True)
class CaseDecisionRecord:
    decision_id: str
    chain_id: int
    case_id: str
    case_version: int
    case_evidence_commitment: str
    policy_version: int
    criteria_version: int
    criteria_digest: str
    decision_schema_version: int
    court_address: str
    input_commitment: str
    classification: str
    recommended_outcome: str
    evidence_sufficient: bool
    reasons_digest: str
    result_digest: str
    recording_contract_address: str


def resolve_decision_reference(
    decision_id: str, records: Mapping[str, CaseDecisionRecord]
) -> CaseDecisionRecord:
    """Resolve only an exact record supplied by a future trusted read adapter.

    A local mapping or browser cache is not a trusted source. Production callers
    must pass only records returned by a verified contract read and still verify
    chain, address, receipt and finality independently.
    """
    _require_id(decision_id, "decision_id")
    record = records.get(decision_id)
    if record is None:
        raise DecisionValidationError("unknown_decision_id")
    if record.decision_id != decision_id:
        raise DecisionValidationError("decision_id_record_mismatch")
    return record


def case_decision_input_commitment(
    *,
    decision_id: str,
    chain_id: int,
    case_id: str,
    case_version: int,
    case_evidence_commitment: str,
    policy_version: int,
    criteria_version: int,
    criteria_digest: str,
    decision_schema_version: int,
    court_address: str,
) -> str:
    """Hash all immutable case, policy, criteria, schema, and contract bindings."""
    _require_id(decision_id, "decision_id")
    _require_id(case_id, "case_id", MAX_CASE_ID_LENGTH)
    _require_digest(case_evidence_commitment, "case_evidence_commitment")
    _require_digest(criteria_digest, "criteria_digest")
    normalized_court = _require_address(court_address, "court_address")
    if not isinstance(chain_id, int) or chain_id <= 0:
        raise DecisionValidationError("invalid_chain_id")
    if not isinstance(case_version, int) or case_version <= 0:
        raise DecisionValidationError("invalid_case_version")
    if policy_version != SUPPORTED_POLICY_VERSION:
        raise DecisionValidationError("unsupported_policy_version")
    if criteria_version != SUPPORTED_CRITERIA_VERSION:
        raise DecisionValidationError("unsupported_criteria_version")
    if decision_schema_version != CASE_DECISION_SCHEMA_VERSION:
        raise DecisionValidationError("unsupported_decision_schema_version")
    return _sha256_fields(
        [
            "PrecedentOS-CASE-DECISION-INPUT-v1",
            str(chain_id),
            normalized_court,
            case_id,
            decision_id,
            str(case_version),
            case_evidence_commitment,
            str(policy_version),
            str(criteria_version),
            criteria_digest,
            str(decision_schema_version),
        ]
    )


def case_decision_result_digest(
    *,
    input_commitment: str,
    classification: str,
    recommended_outcome: str,
    evidence_sufficient: bool,
    reasons_digest: str,
) -> str:
    """Commit decision-bearing fields; free prose is committed by reasons_digest."""
    _require_digest(input_commitment, "input_commitment")
    _require_digest(reasons_digest, "reasons_digest")
    if classification not in CLASSIFICATIONS:
        raise DecisionValidationError("invalid_classification")
    if recommended_outcome not in OUTCOMES:
        raise DecisionValidationError("invalid_recommended_outcome")
    if not isinstance(evidence_sufficient, bool):
        raise DecisionValidationError("invalid_evidence_sufficient")
    return _sha256_fields(
        [
            "PrecedentOS-CASE-DECISION-RESULT-v1",
            input_commitment,
            classification,
            recommended_outcome,
            "true" if evidence_sufficient else "false",
            reasons_digest,
        ]
    )


def case_judgment_commitment(*, input_commitment: str, result: Mapping[str, object]) -> str:
    """Mirror the Stage 3B CaseCourt digest over every persisted judgment field."""
    _require_digest(input_commitment, "input_commitment")
    required = (
        "outcome_classification", "material_findings", "evidence_sufficient",
        "material_issue_determined", "decision_eligible", "relevant_rule_application",
        "applicable_criteria", "recommended_outcome", "reasoning_summary", "uncertainty_flags",
    )
    if set(result) != set(required):
        raise DecisionValidationError("invalid_case_judgment_result")
    if not _valid_canonical_findings(result["material_findings"]):
        raise DecisionValidationError("invalid_case_judgment_findings")
    for name in ("applicable_criteria", "uncertainty_flags"):
        if not isinstance(result[name], list) or any(not isinstance(item, str) for item in result[name]):
            raise DecisionValidationError("invalid_case_judgment_list")
    for name in ("evidence_sufficient", "material_issue_determined", "decision_eligible"):
        if type(result[name]) is not bool:
            raise DecisionValidationError("invalid_case_judgment_boolean")
    if not isinstance(result["reasoning_summary"], str):
        raise DecisionValidationError("invalid_case_judgment_reasoning")
    reasons_digest = hashlib.sha256(str(result["reasoning_summary"]).encode("utf-8")).hexdigest()
    return _sha256_fields(
        [
            "PrecedentOS-CASE-DECISION-RESULT-v2",
            input_commitment,
            str(result["outcome_classification"]),
            str(result["recommended_outcome"]),
            "true" if result["evidence_sufficient"] else "false",
            "true" if result["material_issue_determined"] else "false",
            "true" if result["decision_eligible"] else "false",
            str(result["relevant_rule_application"]),
            json.dumps(result["material_findings"], sort_keys=True, separators=(",", ":")),
            json.dumps(result["applicable_criteria"], sort_keys=True, separators=(",", ":")),
            json.dumps(result["uncertainty_flags"], sort_keys=True, separators=(",", ":")),
            reasons_digest,
        ]
    )


def _valid_canonical_findings(value: object) -> bool:
    allowed_codes = {"FACT", "RULE", "PROCEDURE", "OUTCOME", "REMEDY", "CONFLICT"}
    allowed_scopes = {"CASE", "ORIGINAL", "APPEAL", "PRECEDENT_A", "PRECEDENT_B"}
    if not isinstance(value, list) or len(value) > 4:
        return False
    seen = set()
    for item in value:
        if (not isinstance(item, dict) or set(item) != {"code", "sources"}
                or not isinstance(item["code"], str) or item["code"] not in allowed_codes):
            return False
        sources = item["sources"]
        if not isinstance(sources, list) or not 1 <= len(sources) <= 2:
            return False
        refs = set()
        for ref in sources:
            if not isinstance(ref, dict) or set(ref) != {"scope", "source_id", "quote"}:
                return False
            scope, source_id, quote = ref["scope"], ref["source_id"], ref["quote"]
            if (not isinstance(scope, str) or scope not in allowed_scopes or not isinstance(source_id, str) or not source_id
                    or not isinstance(quote, str) or not quote.strip() or len(quote) > 180):
                return False
            key = (scope, source_id)
            if key in refs:
                return False
            refs.add(key)
        canonical_refs = sorted(sources, key=lambda ref: (ref["scope"], ref["source_id"], ref["quote"]))
        if sources != canonical_refs:
            return False
        marker = json.dumps(item, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        if marker in seen:
            return False
        seen.add(marker)
    return True


def validate_decision_candidate(
    record: CaseDecisionRecord,
    context: CaseDecisionContext,
    *,
    requester_address: str,
    used_decision_ids: Iterable[str] = (),
) -> None:
    """Validate local bindings; this does not authenticate a chain caller or address."""
    if record.case_id != context.case_id:
        raise DecisionValidationError("case_id_mismatch")
    if record.chain_id != context.chain_id:
        raise DecisionValidationError("chain_id_mismatch")
    if record.case_version != context.case_version:
        raise DecisionValidationError("case_version_mismatch")
    if record.case_evidence_commitment != context.case_evidence_commitment:
        raise DecisionValidationError("case_evidence_commitment_mismatch")
    if record.policy_version != context.policy_version:
        raise DecisionValidationError("policy_version_mismatch")
    if record.criteria_version != context.criteria_version:
        raise DecisionValidationError("criteria_version_mismatch")
    if record.criteria_digest != context.criteria_digest:
        raise DecisionValidationError("criteria_digest_mismatch")
    if record.decision_schema_version != CASE_DECISION_SCHEMA_VERSION:
        raise DecisionValidationError("unsupported_decision_schema_version")
    _require_id(record.decision_id, "decision_id")
    court_address = _require_address(context.court_address, "court_address")
    if _require_address(record.court_address, "record_court_address") != court_address:
        raise DecisionValidationError("forged_court_identity")
    if _require_address(record.recording_contract_address, "recording_contract_address") != court_address:
        raise DecisionValidationError("forged_recording_contract_identity")
    requester = _require_address(requester_address, "requester_address")
    parties = {
        _require_address(context.petitioner, "petitioner"),
        _require_address(context.respondent, "respondent"),
    }
    if requester not in parties:
        raise DecisionValidationError("unauthorized_adjudication_requester")
    if record.decision_id in set(used_decision_ids):
        raise DecisionValidationError("duplicate_decision_id")
    expected_input = case_decision_input_commitment(
        decision_id=record.decision_id,
        chain_id=record.chain_id,
        case_id=record.case_id,
        case_version=record.case_version,
        case_evidence_commitment=record.case_evidence_commitment,
        policy_version=record.policy_version,
        criteria_version=record.criteria_version,
        criteria_digest=record.criteria_digest,
        decision_schema_version=record.decision_schema_version,
        court_address=record.court_address,
    )
    if record.input_commitment != expected_input:
        raise DecisionValidationError("input_commitment_mismatch")
    expected_result = case_decision_result_digest(
        input_commitment=record.input_commitment,
        classification=record.classification,
        recommended_outcome=record.recommended_outcome,
        evidence_sufficient=record.evidence_sufficient,
        reasons_digest=record.reasons_digest,
    )
    if record.result_digest != expected_result:
        raise DecisionValidationError("result_digest_mismatch")


@dataclass(frozen=True)
class AppealTarget:
    case_id: str
    decision_id: str
    decision_version: int
    result_digest: str


def validate_appeal_target(target: AppealTarget, operative: AppealTarget) -> None:
    """Reject appeals that target a different case or decision revision."""
    if target.case_id != operative.case_id:
        raise DecisionValidationError("appeal_case_id_mismatch")
    if target.decision_id != operative.decision_id:
        raise DecisionValidationError("appeal_decision_id_mismatch")
    if target.decision_version != operative.decision_version:
        raise DecisionValidationError("appeal_decision_version_mismatch")
    if target.result_digest != operative.result_digest:
        raise DecisionValidationError("appeal_result_digest_mismatch")
    _require_digest(target.result_digest, "appeal_result_digest")


def append_decision_history(
    previous: Sequence[CaseDecisionRecord], new_record: CaseDecisionRecord
) -> tuple[CaseDecisionRecord, ...]:
    """Return a new history preserving every prior decision object unchanged."""
    if any(item.decision_id == new_record.decision_id for item in previous):
        raise DecisionValidationError("duplicate_decision_id")
    if previous and new_record.case_id != previous[0].case_id:
        raise DecisionValidationError("replay_across_cases")
    return (*previous, new_record)


TransactionAuthorityStatus = str
TRANSACTION_AUTHORITY_STATUSES = {
    "UNSUBMITTED",
    "PENDING",
    "ACCEPTED_PROVISIONAL",
    "FINALIZED",
    "FAILED",
    "UNKNOWN",
    "UNVERIFIED_LOCAL_SCHEMA",
}


def normalize_authority_status(status: str, execution_result: str | None = None) -> TransactionAuthorityStatus:
    """Conservative status mapping; finality alone is not execution success."""
    if status in {"ACCEPTED", "FINALIZED"}:
        if execution_result == "FINISHED_WITH_ERROR":
            return "FAILED"
        if execution_result != "FINISHED_WITH_RETURN":
            return "UNKNOWN"
        return "ACCEPTED_PROVISIONAL" if status == "ACCEPTED" else "FINALIZED"
    if status in {"PENDING", "UNINITIALIZED", "PROCESSING"}:
        return "PENDING"
    if status in {"CANCELED", "FAILED"}:
        return "FAILED"
    return "UNKNOWN"
