# Case-Bound Decision Authority Design — Stage 3A

**Status:** selected design and deterministic local schema implemented; no authoritative adjudication contract method is enabled.
**Target:** stable Studionet, chain ID `61999`.
**Decision:** Architecture B for the first case-bound judgment, with Architecture C reserved for any side effect that must wait for protocol finality. No caller-selected contract or evaluation address may establish authority.

## Existing authority gap

`CaseCourt.attach_decision_reference` stores a participant-supplied opaque ID and digest. Its `decision_authority` is fixed to `UNVERIFIED_CALLER_ASSERTION`. The Registry authenticates only its own immutable precedent records. The Evaluator makes a pairwise comparison of two caller-supplied passages; it has no CaseCourt case ID, locked case evidence root, or case criteria binding. These three current interfaces cannot establish that an evaluation is a judgment for a particular case. Stage 2 did not change Registry or Evaluator and did not add a cross-contract call.

## Architecture comparison

| Option | Authority owner and mechanism | Strengths | Unverified or costly parts | Stage 3A decision |
|---|---|---|---|---|
| **A. Separate CaseDecisionEngine** | CaseCourt remains case-state owner; a new immutable engine reads CaseCourt views, checks locked evidence/policy, runs the assessment, and writes a decision. | Separates governance state from AI work; reusable engine; can pin a Court address. | Official docs show synchronous `gl.get_contract_at(addr).view().method()`; this repository has no executed two-IC proof. Current CaseCourt has no canonical locked evidence root. An engine address/ID supplied by a caller is not trusted. More deployment addresses, ABI/version coupling, and integration failure modes. | Do not select until a two-contract read and identity proof passes. |
| **B. CaseCourt-owned adjudication** | A new versioned CaseCourt method checks participant authorization and current locked snapshot; recomputes the ordered evidence commitment, verifies supplied bounded evidence bytes against stored digests, fixes policy/criteria versions, runs the AI/EP inside CaseCourt, then appends a case-bound decision atomically. | Single authoritative state owner; no Court-to-engine cross-call; input checks, AI result, and append share one transaction; no caller-supplied engine address or evaluation ID can inject a result. Fits current-case authority gap with fewer runtime dependencies. | Requires a carefully bounded evidence payload and a versioned CaseCourt upgrade/deployment; current CaseCourt does not store criteria digest or evidence root and is not modified here. `run_nondet_unsafe` is documented and used in Evaluator, but current stable runner and real validator behavior remain unverified. | **Recommended first case-bound decision architecture**, gated on target-runner lint, local/Studio EP behavior, fee profiling, and security review. |
| **C. Authenticated child transaction** | Parent CaseCourt emits a child call to an immutable decision contract on `on='finalized'`; the receiver checks `sender_address` against the configured Court, deduplicates the decision key, and records a finalized-only projection. | Official docs specify sender/origin on child calls and finalization-triggered messages. Useful for irreversible external effects and finality-anchored state. | Requires deployed cross-contract workflow, reserved message fees, idempotency, child receipt tracking, and runtime proof. Adds asynchronous pending states and does not by itself prove the decision’s evidence or legal merits. | Reserve for a later finality relay/projection; do not use as a substitute for B’s evidence and decision checks. |

## Selected flow (Architecture B)

1. **Open and freeze policy.** A CaseCourt v2 case snapshot fixes a policy version, criteria version and criteria digest at creation. Unsupported versions reject. Policy changes apply only to new cases.
2. **Append evidence references.** Existing bounded case actions remain append-only. A later CaseCourt version computes the locked evidence commitment from the ordered, stored reference tuple `(sequence, evidence_id, digest, schema_version, source_reference_digest)` at `lock_evidence`; the lock stores its reference count, root and case version. A digest is only a byte commitment, not proof of source truth.
3. **Submit evidence for adjudication.** The adjudication call supplies the exact bounded, fictional/public evidence payload required by the fixed schema. The contract recomputes SHA-256 for each item and compares it with the locked references before any nondeterministic call. Payload order and evidence IDs must match the locked sequence exactly. The payload is not persisted in full.
4. **Authorize and bind.** The contract derives `sender_address` and its own address from runtime context; it never accepts those identities as caller arguments. Only a participant allowed by the versioned policy may initiate adjudication. The record binds chain ID, Court address, case ID, locked case version, evidence root, policy/criteria versions, criteria digest, decision schema version and unique decision ID.
5. **Evaluate and validate.** The future CaseCourt method uses a documented non-deterministic API and a custom Equivalence Principle validator. Validators independently rerun/assess the decision-bearing fields (classification, recommended outcome, evidence sufficiency and other policy outputs). JSON validity or free-text equality alone cannot accept a result. No state write occurs before the runtime returns an accepted structured result; runtime failure or disagreement leaves prior case state unchanged.
6. **Append decision history.** CaseCourt writes an immutable `CaseDecisionRecord` with its input commitment, result digest, submitter and transaction-context datetime. A subsequent decision is a new record with an explicit parent/supersedes relation; no prior decision is edited or deleted.
7. **Appeal exact version.** An appeal targets `(case_id, decision_id, decision_version, result_digest)`. Any mismatch rejects. A review creates a new immutable decision and appeal disposition; reversal/supersession preserve the challenged record. A filing is `FILED_UNADJUDICATED` until a separately authorized review transition exists.
8. **Present lifecycle truthfully.** `ACCEPTED` is provisional. The client may label the decision `FINALIZED` only after the supported GenLayer transaction receipt confirms `FINALIZED` and `FINISHED_WITH_RETURN`. Missing result, timeout, error or unknown status never becomes success. Case procedural finality remains a separate status.

## Deterministic schema delivered in Stage 3A

The local-only mirror is in `precedentos_protocol/case_decision.py` and `frontend/src/lib/genlayer/caseDecision.ts`. It defines:

- **Evidence schema v1:** ordered, bounded, unique evidence references and a SHA-256 root over UTF-8 byte-length-prefixed fields.
- **Decision input schema v1:** chain ID, Court address, case/decision IDs, locked case version, evidence root, policy/criteria versions, criteria digest and decision schema version.
- **Decision result digest v1:** input commitment, structured classification/outcome, sufficiency flag and a reasons digest.
- Deterministic candidate checks for case/evidence/criteria/version/contract binding, participant requester, duplicate IDs, result digests and exact appeal target.
- Conservative local transaction status mapping. A finalized status without `FINISHED_WITH_RETURN` is `UNKNOWN` or `FAILED`, never successful.
- A shared fictional cross-language vector in `tests/fixtures/case_decision_vectors.json`.

These helpers validate strings and hashes supplied to them. A browser object/map, JSON fixture, manually entered address, or operator annotation is not an on-chain trust anchor. The helpers are not imported by any production Intelligent Contract and do not implement AI, validator consensus, cross-contract reads or a production transaction adapter.

## Contract identity and replay rules required before production

- Court owns all authoritative case and decision state; the Court address is immutable for that deployment. Any network migration is a new manifest and explicit redeployment.
- A reviewed deployment manifest must bind chain ID, contract address, exact source hash, contract schema/version, deployment transaction ID and finalized successful receipt. The manifest is an operator verification artifact, not a substitute for on-chain runtime identity checks.
- Decision IDs are globally unique within the deployed Court. Action and decision IDs are checked before mutation. The full input/result commitment includes case ID, so replay into another case fails even if an ID is reused.
- The evidence root is recomputed from the contract's own append-only evidence records. Supplied adjudication bytes must hash to those references. A caller cannot replace a locked evidence root by submitting a new one.
- Criteria and policy versions are read from the Court snapshot, not supplied as an override during evaluation.
- The caller is authenticated by transaction context, not a payload field. The current local requester check only verifies against a supplied context and is not proof of a chain sender.
- Rejected/malformed/disagreed evaluation paths do not persist a decision. This failure atomicity must be proven on the exact selected runner, not inferred from the Direct Mode suite.

## Required gates before enabling authority

1. Resolve the stable Studionet GenVM runner and compatible CLI/SDK release from official release artifacts; current project pin compatibility is unresolved.
2. Compile the proposed new Court version with that runner and test its non-deterministic validator path with fictional evidence on the supported Studio runtime.
3. Verify evidence-root recomputation, input/result commitments, duplicate rejection, unauthorized calls, malformed output and rejected-state preservation.
4. If Architecture A or C is later selected, execute two-IC reads/messages locally and verify child `sender_address`, finality callback, replay handling and fees.
5. Measure fee profiles for deployment, worst-case bounded evidence, accepted evaluation, validator disagreement/failure, appeal filing and any emitted child transaction.
6. Verify successful finality using the GenLayer receipt and separately keep PrecedentOS case/appeal state nonfinal until its own policy says otherwise.

Until all required gates pass, `UNVERIFIED_CALLER_ASSERTION` remains the only authority label available in the existing CaseCourt.
