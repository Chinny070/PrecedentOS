# Stage 6 — CaseCourt Contradiction Tribunal

## Scope

`CaseCourt.file_contradiction_challenge` accepts a bounded challenge only for two distinct, exact, currently operative CaseCourt judgments or appellate rulings on the same deployed CaseCourt. Registry v1 records and Evaluator outputs are not accepted: cross-contract reads remain unverified. A named party to the challenged case files the request; the target submitter cannot challenge its own decision. Frozen cases and cases with either target under active appeal are rejected. Challenge and evidence-reference counts are capped.

The filing binds both record kinds, IDs, versions, commitments, evidence roots, criteria versions/digests, cases, decision dates, scope assertions, grounds, propositions, excerpt digests, challenger, CaseCourt address, chain ID, and transaction-context time. The record stores short participant excerpts, which are explicitly labeled `PARTICIPANT_SUPPLIED_EXCERPTS_NOT_VERIFIED_SOURCE_BYTES`. Use fictional public text only. The excerpts are not asserted to be members of the underlying evidence bytes.

Scope strings are participant assertions because the current CaseCourt case schema has no authenticated jurisdiction field. Different asserted scopes are deterministically labeled `DISTINGUISHED_SCOPE_ASSERTION` and bypass AI assessment; equal strings do not prove equal jurisdiction. Different criteria version/digest pairs are deterministically labeled `DISTINGUISHED_CRITERIA_VERSION`. A later version must add verifiable scope metadata before these strings may be treated as authoritative.

## Bounded AI and Equivalence Principle

`evaluate_contradiction_challenge` runs only for filings whose scope/criteria metadata passes the deterministic gate. It calls documented `gl.nondet.exec_prompt(..., response_format="json")` through `gl.vm.run_nondet_unsafe`. Both leader and validator independently assess the same bounded, committed record metadata and participant excerpts. The custom callback compares classification, issue/fact/criteria comparability, inconsistency, materiality, distinguishability, further-review requirement, and material-conflict field codes. It does not compare the prose reasoning field.

The decision fields have coherence rules. `MATERIAL_CONTRADICTION` requires comparable issue/facts/criteria, inconsistent decisions, materiality, no distinction or further review, and at least one named conflict field. `DISTINGUISHED` must state a distinction and no material inconsistency. `INSUFFICIENT_EVIDENCE` and `FURTHER_REVIEW_REQUIRED` must request review. JSON shape alone cannot pass. Storage occurs after the nondeterministic API returns; Direct Mode does not prove validator consensus, transaction rollback, or finality.

Accepted assessment records have protocol provenance `AI_EP_ACCEPTED_REQUIRES_TRANSACTION_FINALITY_NOT_LEGAL_CORRECTNESS`. The AI output does not authorize case changes or reverse decisions. One evaluation is allowed per immutable challenge.

## Resolution boundary

`resolve_contradiction_challenge` appends a linked resolution only after a CaseCourt appeal record for the challenged judgment is already `RESOLVED` and the ruling binds that exact judgment commitment. It does not alter or erase the decision. The challenge page reports that finality still needs independent transaction evidence. A challenge alone cannot bypass or release an active appeal freeze.

## Status

| Capability | Status | Evidence boundary |
|---|---|---|
| CaseCourt-only challenge filing and exact record binding | **IMPLEMENTED / LOCALLY TESTED** | Direct Mode fictional tests; no Registry/Evaluator calls. |
| Scope/criteria distinction and authorization checks | **IMPLEMENTED / LOCALLY TESTED** | Scope is participant asserted; current criteria are fixed v1. |
| AI schema/coherence and material-field Equivalence Principle | **IMPLEMENTED / LOCALLY TESTED (mocked)** | Direct Mode callbacks and fake model outputs; no real validators. |
| Appeal-linked resolution | **IMPLEMENTED / LOCALLY TESTED** | Fictional reversal flow; finality remains unverified. |
| Registry precedent challenges | **BLOCKED** | Requires a separately proven cross-contract read and identity/version boundary. |
| Legal correctness or source truth | **NOT PROVIDED** | Consensus is not a legal correctness guarantee. |
