# PrecedentOS 2.0 — Decision Authority and Binding Gate

**Status (2026-10-13):** caller references are explicitly unverified. The current Registry/Evaluator interfaces cannot support a trustworthy case-bound ruling check by themselves. No cross-contract call has been added.

## What the current contracts establish

`PrecedentRegistry` stores an immutable record ID, SHA-256 evidence digest, schema version, public labels, submitter and registration sequence. `PrecedentEvaluator` stores a pairwise comparison keyed by an evaluation ID; it binds the two caller-provided precedent IDs/digests, evidence and criteria schema versions, criteria, an input commitment, decision-bearing fields and the accepted output. The evaluator does not call the Registry and explicitly treats precedent IDs as caller-supplied references.

`CaseCourt` stores a one-time decision reference ID, digest and submitting wallet. The record now exposes `decision_authority = UNVERIFIED_CALLER_ASSERTION`. This constant is assigned by the contract; a valid-looking ID, digest, evaluation result or appeal filing cannot turn it into verified authority. The related implementation is in `contracts/case_court.py`.

## Why the link cannot yet be trusted

1. The current Evaluator record has no `case_id` or CaseCourt evidence-root field. It describes a comparison between two precedents, not a decision for a specific CaseCourt.
2. The CaseCourt case evidence store has bounded lookup by caller-known evidence ID, but no evidence-root/version field that the current Evaluator consumes.
3. An ID supplied by a party is not proof that the Registry/Evaluator contains it. A caller can supply a forged-but-well-formed ID and digest.
4. Synchronous `gl.get_contract_at(address).view().method()` calls and asynchronous `.emit()` messages are documented GenLayer APIs. The project has no executed two-contract runtime proof using its pinned runner and schemas. Documentation alone does not satisfy this project's integration gate.
5. The project has no immutable Registry/Evaluator address allowlist in CaseCourt. Accepting arbitrary addresses per call would permit contract substitution. The current contracts do not expose a verified on-chain code-identity check that CaseCourt can use to distinguish the intended implementation at an address.

## Required production authority model

The first deployable authority design should use a new versioned case-decision record, not reinterpret an ordinary pairwise precedent evaluation as a case ruling.

### Trust anchors

- Pin the approved Registry and case-decision/evaluator addresses immutably in the Court deployment configuration. Never accept these addresses from an appeal or decision-binding caller.
- Record network chain ID, contract address, source hash, declared runner pin, schema versions and deployment transaction IDs in an operator-reviewed manifest. Confirm the address/code/schema through supported explorer or node reads before using it.
- If the selected GenLayer runtime cannot establish trusted contract identity or synchronous view semantics, the UI and Court must continue to show `UNVERIFIED`; do not accept a caller-selected substitute.

### Case-bound decision record

The future decision record must bind, at minimum:

| Field | Required binding |
|---|---|
| `case_id` | Exact immutable CaseCourt case identifier |
| `case_evidence_root` | Canonical commitment over the locked ordered evidence references and their schemas |
| `decision_id` | Unique, replay-protected decision identifier |
| `decision_schema_version` | Supported immutable result schema |
| `criteria_version` | Version of the explicit adjudication criteria |
| `result_digest` | Commitment to structured decision-bearing fields |
| `evaluation_id` | Existing or new evaluation reference, with its returned record checked |
| `decision_authority` | Contract-originated reference and resolved source address |

The current `PrecedentEvaluator.evaluate_pair` cannot populate this schema without an additive case-adjudication interface. Do not change the deployed Registry/Evaluator ABI as an incidental part of this gate; design and version an additive contract/interface separately.

### Verification algorithm

After an integration test establishes that a CaseCourt can synchronously read another IC's views at one consistent state:

1. Resolve the decision only through the immutable configured decision contract.
2. Require `has_decision(decision_id)` and load the complete record; missing returns reject.
3. Require the returned `case_id`, case evidence root, schema, criteria version and result digest to match the CaseCourt's locked case and accepted decision schema.
4. Resolve every precedent ID through the immutable configured Registry, require it exists, and compare the Registry's immutable digest/schema to the decision's record references.
5. Recompute the canonical case-evidence root from CaseCourt records and compare it to the decision record. Any absent, duplicate, malformed, or mismatched item rejects.
6. Apply caller authorization independently: only the named opposing party may file an appeal; only the configured decision contract can introduce a verified ruling. The applicant cannot substitute another evaluation after filing.
7. Check one-time decision binding and decision/evaluation replay keys before any state write. A rejected binding leaves the entire case snapshot, counters and action history unchanged.
8. Set an on-chain authority state to `VERIFIED_CASE_DECISION` only after all checks pass. Any call/read/schema failure is an error and cannot fall back to a caller assertion.

Use one append-only decision-binding record and preserve superseded/reversed decisions as history. A reversal creates a new relation/result; it must not overwrite the previous decision.

## Implemented safe behavior and limits

- CaseCourt still accepts a well-formed opaque reference to preserve its Stage 1 API, but labels it `UNVERIFIED_CALLER_ASSERTION` in the record.
- Case participants are the only callers who may attach a reference. A participant can still submit a forged reference; participant authorization is not a truth check.
- A challenge binds the digest already stored by CaseCourt and rejects a stale/different digest. This prevents substitution inside that challenge transition but does not establish that the stored decision exists or matches case evidence.
- Tests prove the explicit unverified label, outsider rejection, stale digest rejection, replay protection and state preservation under Direct Mode. No Registry/Evaluator record is read in those tests.

## Runtime gate

Official documentation currently describes synchronous IC view calls and deferred child writes, including `on='finalized'`. Before enabling the verification algorithm, run a separate two-contract Studio integration test with the exact candidate runner: deploy the Registry, evaluator/case-decision contract and Court; register fictional records; read existing and missing records from Court; test forged/mismatched/case-context references; verify accepted/finalized child-message behavior and idempotent retries. Record chain ID, package/runner identity, complete transaction receipts, execution result and finality. A mocked Direct Mode call or cached lint is not that proof.

Until this gate passes, no frontend feature or document may describe an opaque CaseCourt reference as an authoritative precedent, evaluator output, judgment, or validator-consensus result.
