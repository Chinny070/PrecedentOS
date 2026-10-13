# PrecedentOS 2.0 Contract Architecture

**Status:** proposed architecture; no contract implementation in Stage 0.
**Target:** stable Studionet, expected chain ID `61999`.
**System constraint:** static browser frontend calls public GenLayer contracts directly through a compatible SDK and injected wallet; no custom backend or hosted indexer.

## 1. High-level topology

```text
Browser SPA (wallet, UX, local cache, client-side search/projections)
    │ GenLayerJS: keyed/paginated reads and signed state-changing calls
    ├──────────────► PrecedentRegistry v1 (existing, immutable interface)
    ├──────────────► PrecedentEvaluator v1 (existing, standalone pairwise evaluator)
    └──────────────► CaseCourt v1 (proposed case + evidence + appeal state machine)
                             ├─ deterministic append-only case actions
                             ├─ bounded in-contract AI/Equivalence Principle judgments
                             └─ bounded Web Render capture through GenVM, behind a proof gate
```

The browser is an untrusted convenience layer. Contract rules are authoritative for accepted contract state. Local caches, localStorage, UI filters, timestamps, and demo fixtures never establish chain provenance.

## 2. Existing on-chain contracts (preserve)

### PrecedentRegistry v1

Existing entry points:

- `register_precedent(record_id, evidence_digest, schema_version, jurisdiction, decision_date, category)` — unique append-only entry; captures `gl.message.sender_address`; validates bounded ID, lowercase 64-character hex digest, schema v1, and metadata; increments registration sequence.
- Views: `has_precedent(record_id)`, `get_precedent(record_id)`, `get_registration_count()`.

Current limits: no `get_precedent_id_by_sequence`, page/list view, case authorization, version replacement, evaluation linking, relation/authority graph, or transaction timestamp. Do not silently change the deployed or reviewed source.

**Future additive requirement:** a new Registry version may add sequence-to-ID lookup/page views and append-only relation records so a browser can enumerate records without a hosted indexer. This is a new deployment/schema version, not a mutation of an already deployed contract. Bound page size and profile read/storage cost before release.

### PrecedentEvaluator v1

Existing entry point:

- `evaluate_pair(evaluation_id, record_a_id, record_a_digest, record_b_id, record_b_digest, evidence_packet_json, evidence_schema_version, criteria_version, criteria)`.
- Views: `has_evaluation(evaluation_id)`, `get_evaluation(evaluation_id)`, `get_evaluation_count()`.

It verifies supplied passage SHA-256 values, binds IDs/digests/versions/criteria in an input commitment, asks `gl.nondet.exec_prompt` for structured output, validates decision coherence, independently reruns under `gl.vm.run_nondet_unsafe`, and compares `classification` plus five decision booleans. Its IDs are caller-supplied, not Registry-verified. It is a pairwise research service, not a case lifecycle engine or legal adjudicator.

Do not change it merely to support governance. Add case-specific behavior to CaseCourt only after its own interface and runtime are verified. The Evaluator remains useful for pairwise research and future similarity/contradiction candidate review.

## 3. Proposed CaseCourt v1

One deployable Python Intelligent Contract is proposed for the first governance increment. It owns the case state machine, append-only action journal, evidence commitments/versions, freeze enforcement, appeal rights, exceptional reconsideration, and the operative case decision. Keeping case-specific mutable state and every protected action in one contract avoids a freeze bypass across unverified cross-contract writes. It also avoids introducing a separate EvidenceVault whose writes could bypass case freeze rules.

### Contract storage model (conceptual; exact types await runner proof)

- `cases`: case ID → bounded `CaseSnapshot` with named parties, policy/schema versions, phase, version, evidence/action sequence pointers, decision reference, freeze state, appeal-level counters, and fixed deadlines.
- `actions`: global monotonic action sequence → immutable `CaseAction` with case ID, action kind, actor address, expected/new version, bounded input digest/reference, transaction-context timestamp, and linked decision/evidence IDs.
- `evidence`: case/evidence version key → immutable evidence reference with content digest, schema, submitter, source kind/reference commitment, and capture timestamp; raw documents are never stored.
- `decisions`: case/stage key → immutable structured AI output and digest, with explicit criteria/prompt/evaluation schema versions and evidence version set.
- `relations`: global sequence → typed authority edge (cites/distinguishes/questions/reverses/supersedes), related IDs and case decision digest, actor, and protocol status.
- `seen_action_ids`: replay guard keyed by unique client-supplied action ID; state transitions also bind an `expected_case_version` and prior decision digest.

Persistent dataclasses, mappings, counters, and nested values must be checked against the selected GenVM types, storage rules, and size/cost limits. Do not assume Python lists/dicts are persistent merely because ordinary Python supports them.

### Proposed public interface (product signatures, not asserted SDK schema)

Exact GenLayer type spelling/encodings must be generated and reviewed using the pinned compatible toolchain before coding.

| Method | Access | Purpose / critical guards |
|---|---|---|
| `open_case(case_id, respondent, case_type, policy_version, opening_evidence_digest)` | write | Caller is recorded as petitioner; unique ID, nonzero distinct parties, supported frozen policy, bounded fictional/public payload commitment. |
| `append_evidence(case_id, expected_version, action_id, evidence_id, digest, evidence_schema, source_kind, source_ref_digest)` | write | Named party/authorized role only; open evidence phase; unique action/version; append-only and size bounded. |
| `capture_web_evidence(case_id, expected_version, action_id, evidence_id, url, evidence_schema)` | write + nondeterministic | Party authorization and HTTPS/source policy; renderer and consensus validation; rejected/mismatched capture is never stored as accepted evidence. Blocked until Web Render and finality behavior are verified. |
| `evaluate_case(case_id, expected_version, action_id)` | write + nondeterministic | Only after evidence cutoff; uses stored/pinned bounded inputs and locked criteria; no caller-supplied outcome. |
| `challenge_decision(case_id, expected_version, action_id, decision_digest, grounds_code, grounds_digest)` | write | Eligible party, challenge period, current decision version; one bounded challenge per decision/party. |
| `request_freeze(case_id, expected_version, action_id, grounds_code, grounds_digest)` | write | Named party, qualifying challenge/appeal window, one short time-bounded freeze; no indefinite freeze; guard every protected transition. |
| `file_case_appeal(case_id, expected_version, action_id, level, decision_digest, grounds_digest, evidence_refs)` | write | Named party, correct prior level, deadline, unique action, level cap, evidence refs pinned; prevents replay against a superseded ruling. |
| `decide_case_appeal(case_id, expected_version, level)` | write + nondeterministic | CaseCourt performs bounded independent AI assessment and EP check; appends a new level outcome, never overwrites the prior decision. |
| `petition_exceptional_review(case_id, expected_version, action_id, final_decision_digest, new_evidence_refs)` | write + nondeterministic | One request per party/decision; requires novel evidence commitment and policy-supported threshold; successful petition opens a new review stage without erasing final history. |
| `finalize_case(case_id, expected_version)` | permissionless write | Closes only if challenge/appeal deadlines are satisfied and no active freeze/eligible process remains; records a protocol case-final event. The finalize transaction itself still has GenLayer transaction finality. |
| `get_case(case_id)` / `get_evidence(case_id, evidence_id, version)` / `get_action(sequence)` / `get_relation(sequence)` | view | Deterministic bounded keyed reads. |
| `get_case_actions_page(case_id, cursor, limit)` / `get_global_action(sequence)` | view | Bounded direct-RPC history; no backend/indexer. Exact pagination and sequence mappings require storage/runtime proof. |
| `get_case_count()` / `get_case_id_by_sequence(sequence)` | view | Future browser enumeration and client-side discovery. |

Public write method names are draft interfaces only. No caller may directly write a decision, waive another party's right, or bypass a freeze with a different entry point.

## 4. Freeze design and boundary

`CaseSnapshot.frozen` and `freeze_until` are checked inside every CaseCourt operation that mutates evidence eligibility, the operative decision, appeal progression, relations, or closure. Freeze is not a cosmetic UI status. A party can request only one bounded hold for a decision/appeal phase, with allowed grounds and a digest reference; the state expires deterministically after a policy cap unless a qualifying appeal is filed. Since protocol-level escrow/bonds and current fee handling are not resolved, no bond is assumed in Stage 0. A later bond proposal requires fee/GEN transfer verification and anti-grief review.

The freeze does **not** stop native GenLayer finalization or change Registry/Evaluator methods. They are independent contracts and may still accept unrelated calls. No external asset, DAO, agent, or product action is frozen unless that integration makes CaseCourt's final freeze/status view a mandatory on-chain precondition. Do not advertise global enforceability.

## 5. Integration boundaries

### Registry reference verification

Current official Python documentation describes synchronous read-only IC view calls using `gl.get_contract_at(address).view().method(...)`. It also says a view reads the other contract state at the current block. Therefore an on-chain check of Registry membership appears API-supported at the documentation level. However, this repository's Stage 2A/2B reports record no executed two-contract proof; stable runner behavior is unverified.

Before trusting a Registry lookup, Stage 1 must prove it in an isolated two-contract integration test on a compatible runtime. CaseCourt must pin a Registry address/version or immutable deployment configuration; it must fail closed if the address/schema/record/digest does not validate. Until then, the UI labels IDs and digests supplied to Evaluator/CaseCourt as unverified references. Do not use a frontend Registry read as a contract-level authorization proof.

### Evaluator integration

Do not call Evaluator from CaseCourt until its synchronous read and write path, failure propagation, transaction lifecycle, and async message semantics pass runtime tests. The current Evaluator's public write method cannot be trusted for case state because its output is not registered in CaseCourt and it does not verify Registry membership. For the first CaseCourt, implement the case/appeal bounded AI task and validator comparison in the same contract that owns the protected state; do not depend on asynchronous child messages to atomically authorize a ruling.

### Case/ruling references and authority

CaseCourt is the append-only authority source for its case status and typed lineage relations. Registry v1 remains a source commitment catalog and does not become reversible/editable. A reversal or supersession is a new CaseCourt relation tied to a finalized case decision digest. UI derives current authority labels by reading relations and does not mutate the original Registry record. Whether to add a Registry v2 reverse-link/read API is a later additive compatibility decision.

## 6. Frontend data discovery without backend/indexer

Current v1 `TreeMap`s do not provide a corpus list; their counts alone are not enough to enumerate records. To meet browser search/graph requirements without hosted services, the future on-chain contracts need bounded sequence-to-ID and paginated read views. The browser reads pages directly over the approved GenLayer RPC, verifies each returned schema/address/network, then filters/joins records locally. Cache is a convenience only; users can refresh from chain. Contract event/log retrieval is not the primary history strategy until a stable RPC filter API is verified and practical for the browser.

Do not scan every transaction or claim full corpus coverage from a localStorage cache. Large deployments may require an officially supported public indexer, but that would conflict with the current no-hosted-indexer requirement and would need explicit scope approval. Pagination cost, limits, rate limits, and stable RPC availability are Stage 1 gates.

## 7. Web Render integration boundary

Official docs currently document `gl.nondet.web.render(url, mode='html')` and screenshot mode. CaseCourt may capture bounded public web evidence using this GenVM API, not browser `fetch`/iframe. Store an immutable commitment to the rendered output, capture timestamp, sanitized public source reference, and bounded extracted facts. Do not store entire pages/screenshots. Validators must independently render or otherwise assess the same source and compare material claims; exact HTML equality is likely too brittle for dynamic pages and must be validated with controlled fixtures. No accepted evidence is written if the rendered content is unavailable, over bounds, unsafe, or materially disputed.

This documented API pattern is not a stable Studionet execution proof. Web Render stays disabled in product until the target runner, output types/limits, URL/redirect/private-network protections, validator agreement and failure handling are proven.

## 8. Transaction, deadline, and case finality boundary

Current official GenLayer docs state that accepted transaction decisions remain appealable, and execution success must be read separately from status. The chain exposes a transaction-context datetime (`gl.message_raw['datetime']`) pinned consistently across validators; it does not expose block number/hash through that context. These capabilities can provide deterministic protocol time, but do not automatically provide a “case clock starts after parent transaction finalization” callback to application state.

Case deadlines must not start from a browser clock. Before coding, test a documented finalized-message/callback pattern or select a different verified design to anchor case appeal windows after the relevant ruling transaction actually finalizes. Do not trust a caller-supplied transaction hash/status as proof inside a contract unless it can be verified on chain. Until resolved, deadline-sensitive case finality is blocked.

## 9. Extensibility mapping

| Product module | v2 placement |
|---|---|
| `PrecedentRegistry` | Existing on-chain Registry; additive v2 sequence/pagination/typed relation support only after compatibility review. |
| `PrecedentEvaluator` | Existing on-chain pairwise comparison; never claimed to be a registry-verifying court. |
| `SimilarityCourt` | Browser-side candidate retrieval/ranking from paginated reads; selected pairs can use Evaluator. No corpus loop in a contract. |
| `ContradictionEngine` | Browser-side candidate detection/work queue; a party challenge and final case outcome live in CaseCourt. |
| `CounterfactualSimulator` | Local browser scenario engine; hypothetical outputs, no contract writes and no authority. |
| `PrecedentDependencyGraph` | Client-side graph from verified registry page data and CaseCourt relation pages. |
| `JudgmentLineage` | CaseCourt append-only relations and client-side graph/timeline projection. |
| DAO/AI agent | Wallet/contract caller following the same CaseCourt authorization interface; optional DAO authorization adapter is deferred until cross-layer calls are tested. |

## 10. Official documentation references

- [GenLayer Intelligent Contract interactions](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) — `gl.get_contract_at`, synchronous `view()`, asynchronous `emit()`.
- [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) — child transaction scheduling and sender context.
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context) — `gl.message_raw['datetime']`, pinned transaction timestamp, no block number/hash in context.
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) — leader/validator patterns and decision-bearing comparisons.
- [Web Access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access) — `gl.nondet.web.render` HTML/screenshot API.
- [GenLayer storage](https://docs.genlayer.com/developers/intelligent-contracts/storage) — persistent state declaration constraints.
- [GenLayer transaction appeals](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/appeal-process) and [finality](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality).

Documentation reviewed 2026-10-13. The method shapes above are not certified against the unresolved current stable Studionet runner or a live deployment.
