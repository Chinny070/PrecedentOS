# Stage 3B AI Judgment Schema

**Schema:** CaseCourt Judgment v1. **Status:** IMPLEMENTED; LOCALLY TESTED in mocked Direct Mode; LIVE VERIFIED: NO.

## Contract surface

`CaseCourt.adjudicate_case(case_id, expected_version, action_id, judgment_id, evidence_packet_json)` accepts one participant-authorized write only after `lock_evidence`. Criteria and policy versions are taken from the stored case snapshot, not caller-selected arguments. The method requires the exact current case version and refuses a frozen case, any phase other than `EVIDENCE_LOCKED`, a reused judgment/action ID, an incomplete evidence journal, or a changed evidence root.

The request JSON has exactly one top-level key, `evidence`, whose value is an ordered list with one object per locked reference. Each object has exactly `evidence_id` and `text`. IDs and order must equal the append-only case evidence journal. SHA-256 is computed over the exact UTF-8 bytes of each submitted text and must equal that evidence reference's digest. Maximum encoded packet size is 9,000 UTF-8 bytes, maximum evidence item size is 1,800 UTF-8 bytes, and evidence count is 1–32. The original full evidence text is not persisted.

## Stored judgment record

`get_judgment(judgment_id)` returns:

| Field | Source / limit |
|---|---|
| `judgment_id`, `case_id`, `case_version` | Validated request ID and immutable locked case state |
| `chain_id`, `court_address`, `submitter` | GenLayer transaction context |
| `evidence_commitment` | Recomputed from ordered append-only evidence references at lock and adjudication |
| `criteria_version`, `criteria_digest`, `policy_version` | Fixed values captured from the case snapshot |
| `judgment_schema_version` | Supported version 1 |
| `input_commitment` | Length-prefixed UTF-8 SHA-256 over chain, Court, case, judgment ID, current version, evidence root, policy/criteria and schema versions |
| `judgment_commitment` | Length-prefixed UTF-8 SHA-256 over input commitment and every normalized decision field/findings/reasoning digest |
| `authority_status` | `CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY`; receipt/finality remains separately observed |
| `recorded_at` | `gl.message_raw['datetime']` transaction context |
| `result_json` | Bounded normalized schema below |

## Bounded result

Exactly ten fields are accepted:

| Field | Type and allowed values |
|---|---|
| `outcome_classification` | `MERITS_SUPPORTED`, `MERITS_NOT_SUPPORTED`, `INSUFFICIENT_EVIDENCE`, `MATERIAL_CONFLICT` |
| `material_findings` | Up to four nonempty strings, each at most 180 characters |
| `evidence_sufficient` | Boolean |
| `material_issue_determined` | Boolean |
| `decision_eligible` | Boolean |
| `relevant_rule_application` | `SATISFIED`, `NOT_SATISFIED`, `CONFLICTING`, `UNDETERMINED` |
| `applicable_criteria` | Unique values from `NOTICE`, `TIMELINESS`, `DOCUMENTED_CONDUCT`, `CAUSATION`, `REMEDY` |
| `recommended_outcome` | `GRANT`, `DENY`, `REMAND`, `NO_RECOMMENDATION` |
| `reasoning_summary` | Nonempty string, at most 500 characters |
| `uncertainty_flags` | Unique values from `MISSING_EVIDENCE`, `CONFLICTING_EVIDENCE`, `AMBIGUOUS_RULE`, `LIMITED_RECORD`, at most four |

Consistency rules couple classification, sufficiency, eligibility, rule application, outcome, and required uncertainty flags. Unsupported keys, malformed JSON, invalid enums/types, overlong strings, contradictions, and inconsistent combinations reject before any judgment writes.

Evidence records contain public commitments and source references only. The model sees caller-supplied evidence bytes after digest verification. A digest verifies byte equality to the committed bytes; it does not prove source authenticity, admissibility, truth, or legal correctness. Production cases must use public, fictional or otherwise appropriately publishable evidence; private information must not be submitted.

## Lifecycle boundary

The persisted authority label means only that the contract returned from its configured Equivalence Principle call. It does not mean the transaction is finalized. The frontend remains write-disabled; it may call a future verified adapter only after exact stable runner, ABI, receipt and finality gates pass. `FINALIZED` additionally requires the actual supported receipt to report successful execution (`FINISHED_WITH_RETURN`).
