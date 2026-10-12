# PrecedentOS Build Plan

**Status:** approved MVP plan (2026-10-12)  
**Target network:** GenLayer stable Studionet, chain ID 61999  
**Scope:** architecture and staged acceptance criteria only. No implementation or deployment has been performed.

## MVP outcome

Demonstrate two logical on-chain components: (1) an append-only `PrecedentRegistry`, and (2) a `PrecedentEvaluator` that compares two registered fictional precedents using supplied bounded evidence and explicit criteria, has validators independently verify the AI-assisted result through an appropriate Equivalence Principle, and persists the accepted structured result. The MVP also includes a minimal off-chain index/API and frontend to prepare inputs and display provenance and transaction status.

Use fictional, publicly shareable examples only. Never place complete case documents or personal information on chain. Validator consensus is not a guarantee of legal correctness.

## Stage 0 — Verify current APIs and freeze the design boundary

**Work:** inspect current official Studionet, Python SDK/runtime, Equivalence Principle, storage, inter-contract view, client transaction, and transaction lifecycle documentation. Confirm exact public API signatures with documentation or an isolated local/Studio example only after the user authorizes implementation. Compare candidate patterns (`prompt_comparative`, custom `run_nondet_unsafe`) for the structured comparison. Decide IDs, versioned schemas, digest canonicalization, evidence packet format/limits, accepted outcome fields, correction flow, and how Registry stores finalized evaluation references.

**Acceptance criteria:**

- Decision record pins stable Studionet (chain ID 61999), exact Python runner/SDK and client versions, with official source links and retrieval date.
- A capability matrix marks each planned call as confirmed for the selected version or explicitly blocked pending a proof-of-concept.
- A sequence diagram documents registration, evaluator Registry reads, validator work, accepted/finalized result read-back, and separate Registry link transaction; it names each independent failure state.
- The design specifies canonical digest bytes, algorithm/version, schema versioning, bounded fields, evidence packet structure, structured result enum, and rationale/citation limits.
- A data review confirms all test inputs/evidence are fictional and publicly shareable and that no complete documents or personal information enter contract calldata/storage.
- Product copy states that consensus is protocol agreement under a defined rule, not legal correctness or authority.

**Studionet gate 0:** confirm current network identity is the stable Studionet deployment (chain ID 61999) and not Studio-dev (61997). Document transaction finality, appeal/rotation, fee estimation, calldata/storage limits, and read APIs from current official sources. Do not assume a local simulation or different SDK version proves Studionet compatibility.

## Stage 1 — Minimal contract proof of capability

**Work:** after Stage 0 confirms APIs, create the smallest disposable proof-of-concept contract outside production schema work. It should demonstrate one bounded LLM-assisted task and the intended documented comparative/custom validator flow on a controlled fictional input. Use local tests/Studio tooling first if supported; then verify on Studionet only with an explicitly authorized test transaction. This stage is not a deployment of the final application.

**Acceptance criteria:**

- Leader produces the documented structured outcome using only supplied evidence and explicit criteria.
- Validator independently reruns or evaluates the task against the same evidence and criteria; a leader-only schema validator is rejected in design review.
- Matching decision-bearing fields are accepted; a deliberately conflicting validator result produces the documented disagreement/undetermined lifecycle.
- Storage writes occur only after the accepted nondeterministic result returns.
- Input/output and fees are measured for small and maximum planned evidence fixtures; measured limits inform Stage 2.
- No undocumented SDK imports, guessed return fields, or unsupported contract capabilities are used.

**Studionet gate 1:** with fictional public data, submit at least one successful evaluation transaction and one disagreement case on stable Studionet. Capture chain ID, SDK/runtime versions, transaction references, lifecycle statuses, fee estimates/final fees, and evaluator output. Confirm the intended accepted-versus-finalized read path. Do not continue to contract architecture assumptions if the pattern is unsupported or economically impractical; revise the proposal first.

## Stage 2 — Registry schema and append-only contract

**Work:** implement `PrecedentRegistry` after gates 0–1. Specify unique record IDs, content digest, metadata schema/version, submitter, correction links, and an append-only list/map of evaluation references. Use only storage types verified for the pinned Python runner.

**Acceptance criteria:**

- Valid fictional record registers once and reads back with the same ID, digest, metadata/version, and submitter.
- Duplicate ID, malformed input, and each over-limit field fail without altering existing state.
- Existing records cannot be changed/deleted; correction creates a distinct linked record.
- Evaluation references are appended only through the documented authorized flow and can be read by record ID.
- Public views are bounded; no whole-registry scan is required.
- Tests cover initialization, duplicate submissions, bounds, correction, and reference validation.
- Contract passes the pinned toolchain's documented lint/test workflow.

## Stage 3 — Evaluator contract and independent consensus

**Work:** implement `PrecedentEvaluator` with configured Registry address, existence checks, pairwise record IDs, bounded evidence, versioned criteria, structured outcome and provenance. Validators independently evaluate the evidence and compare decision-bearing fields. Store only the accepted bounded result and evidence digest. Do not silently downgrade validator disagreement to a leader result.

**Acceptance criteria:**

- Evaluation rejects unknown IDs, identical IDs (unless explicitly allowed), empty or over-limit evidence, malformed criteria, and unsupported schema versions deterministically.
- Valid comparisons can return material similarity, possible contradiction, insufficient evidence, or no material relation with bounded cited-span references.
- Validator independently sees/evaluates the supplied evidence and criteria; tests prove that changing only the leader's conclusion causes rejection/disagreement.
- Acceptance requires the agreed categorical outcome and required identifiers/schema; rationale variation follows documented equivalence rules and is bounded.
- Persisted evaluation includes stable evaluation ID, both record IDs, evidence digest, criteria/schema version, structured outcome, and concise rationale/citation references.
- Tests cover consensus, dissent, ambiguous/insufficient inputs, malformed model output, nondeterministic provider errors, prompt injection, and write-after-consensus behavior.
- UI/API language labels result as a consensus-backed research signal and displays that this is not a legal correctness guarantee.

## Stage 4 — Cross-contract linking and lifecycle reconciliation

**Work:** finalize/read the evaluator result, then append its reference in Registry as a separate write. Verify caller/evaluator authorization and result details using confirmed contract-view behavior. Keep evaluation storage canonical in Evaluator. Treat asynchronous messages as optional only if separately verified and failure-managed.

**Acceptance criteria:**

- Registry refuses references to nonexistent or non-finalized evaluations, wrong record pairs, unauthorized evaluator addresses, and duplicate links, according to the verified lifecycle interface.
- A successful finalized evaluation can be linked to each relevant Registry record with stable IDs.
- If evaluation finalizes but link transaction fails, the system exposes `evaluation finalized / registry link pending-or-failed` and can safely retry without duplicate references.
- If evaluation is pending, rejected, or undetermined, Registry does not present it as a finalized accepted evaluation reference.
- Integration tests cover successful linking, stale/non-final state, wrong pair, retry, and duplicate submission.
- Studionet gate confirms the separate write lifecycle and read-back behavior using fictional records.

## Stage 5 — Minimal index/API and frontend

**Work:** provide transaction submission and status tracking; metadata/keyword list over indexed confirmed records; pair selection; evidence/criteria input; evaluation submission; result/provenance page; digest verification. No corpus-wide semantic ranker is needed for MVP.

**Acceptance criteria:**

- Frontend validates evidence size and rejects prohibited personal/confidential test input according to the chosen policy.
- Record registration and evaluation pages show chain ID, contract addresses, transaction refs, and verified lifecycle state.
- Evaluation page shows IDs, digests, criteria version, outcome, citations, and Registry link status separately.
- Indexer reconciles against contract views/transaction records; stale index state is visible and rebuildable.
- UI distinguishes on-chain fields, source/evidence references, and off-chain annotations.
- Manual security/accessibility review verifies wallet permissions, error handling, no leaked secrets, and clear non-authoritative output labeling.

## Stage 6 — Studionet MVP acceptance

**Work:** exercise the integrated workflow on stable Studionet with fictional public fixtures only. Measure fees, latency, validator agreement/disagreement, and limits. Record contract code hashes/addresses, chain ID, toolchain versions, and criteria versions. No mainnet/production claim follows from this stage.

**Acceptance criteria:**

- At least three fictional precedents register successfully and are read back with matching digests.
- At least one pair produces a validator-accepted material-similarity result, one produces possible contradiction or no material relation, and one produces insufficient evidence.
- At least one intentionally divergent validator result is observed with correct lifecycle handling and no accepted result written as final.
- Finalized evaluation references can be linked back to both Registry records and independently read back.
- Maximum accepted evidence fixture remains below verified calldata/input/storage limits and its fee/latency are documented.
- Retry, disagreement, pending, link failure, and stale index states are visible and recoverable.
- No personal information or complete documents are sent on chain; public calldata/storage review confirms this.
- Remaining security findings and limitations are documented; all critical issues are resolved before any broader release.

## Security requirements across all stages

- Use fictional, publicly shareable test records and adversarial synthetic documents only.
- Never store full texts, personal data, confidential content, API keys, or private URLs on chain.
- Bound all strings, arrays, nested values, and model inputs using measured Studionet constraints.
- Treat passages as untrusted data; separate them from instruction text and test prompt injection.
- Validators must independently verify substance. Shape checks alone do not qualify.
- Persist provenance and schema/criteria versions; do not present an evaluation as verified truth.
- Document admin/deployer privileges and upgrade/freeze policy before deploying final contracts.
- Use unique record/evaluation IDs; define replay, duplicates, corrections, and retry idempotency.
- Handle model/provider errors and validator disagreement explicitly; never write a leader answer as accepted by default.
- Report protocol status from the current supported lifecycle API; do not infer finality from a transaction hash or local simulation.

## Deferred extension stages

After MVP acceptance, consider these as separate reviewed modules:

- `SimilarityCourt`: off-chain corpus candidate retrieval/ranking; submit selected pairs to Evaluator for bounded consensus comparison.
- `ContradictionEngine`: off-chain candidate detection and reviewer queue; selected evidence-backed pairs can use Evaluator.
- `PrecedentDependencyGraph` and `JudgmentLineage`: off-chain graph projection from explicit citations, Registry links, and reviewed relationships.
- `CounterfactualSimulator`: off-chain exploratory scenario runner; hypothetical, never a binding or consensus-backed result by default.
- Analytics dashboard: off-chain aggregates with privacy and re-identification controls.

Each extension needs its own evaluation dataset, provenance policy, user-facing label, and security acceptance criteria. No corpus-wide search or simulation moves on chain by default.
