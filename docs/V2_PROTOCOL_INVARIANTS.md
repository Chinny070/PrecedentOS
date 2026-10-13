# PrecedentOS 2.0 — Stage 7A Protocol Invariant Matrix

**Evidence status:** verified from current source plus Direct Mode tests where named below. Runtime finality, live consensus, rollback and legal correctness are not verified. “Invariant holds locally” is not an on-chain proof.

| Invariant | Enforcing state/methods | Adversarial evidence | Result / unresolved condition |
|---|---|---|---|
| Only the case petitioner and named respondent may act as case participants | Case snapshot, `_require_party`, each participant write | CaseCourt lifecycle/appeal tests cover outsider attempts and sender attribution | **Locally enforced.** Address proves key control only, not legal identity/authority. |
| Opening cannot impersonate petitioner | `open_case` derives petitioner from transaction sender | Existing CaseCourt tests | **Locally enforced.** Respondent is named, not independently authenticated. |
| Evidence references are immutable and evidence bytes match commitments before AI | Append-only evidence keys, `lock_evidence`, ordered root, packet validation in `adjudicate_case`/appeal | Digest mismatch, ordering and locked evidence coverage across Stage 3–5 tests | **Locally tested.** Digest proves byte equality to a supplied commitment, not source truth. |
| One immutable initial judgment per ID; state changes append actions | `adjudicate_case`, judgment replay key, action journal | Replay and state-preservation tests | **Locally enforced.** Native transaction finality of accepted result remains unverified. |
| Judgment history is not overwritten by appeal | `resolve_appeal`, separate appellate ruling key and relation | Reversal/remand/supersession tests | **Locally enforced.** `operative_decision_*` is a mutable projection; old judgment/ruling remains. |
| Appeal targets exact current eligible decision and bounded level | `file_appeal`, parent ruling/judgment ID, digest, version, level cap | Stage 4 appeal tests for wrong target, replay, party, level cap | **Locally tested.** No case deadlines/native-finality anchor. |
| Active appeal freeze blocks protected writes and generic unfreeze | `_require_not_frozen`, `resolve_appeal`; withdrawal request/approval policy | Freeze enforcement and withdrawal tests | **Locally enforced for covered CaseCourt writes.** Does not freeze other contracts; failed/nonfinal liveness recovery unresolved. |
| Appeal review cannot be silently withdrawn after review starts | `request_appeal_withdrawal`, `approve_appeal_withdrawal`, review status | Stage 5 freeze recovery tests | **Locally tested.** Opposing participant review model may be biased; policy unresolved. |
| Closure approval must refer to the currently operative decision | Closure request stores decision ID/digest/version; approval rechecks exact match | `test_stale_closure_request_cannot_close_a_reversed_decision` reproduces stale attempt, checks reject, then fresh request/approval | **Fixed; locally tested.** Bilateral closure is application state, not native finality. |
| A contradiction challenge cannot rewrite a judgment | Filing/evaluation/resolution records are separate from judgment records | Stage 6 challenge tests and source review | **Locally enforced.** A challenge resolution is not an appeal outcome. |
| Challenge assessment is allowed only while linked cases are not frozen/appealed | `evaluate_contradiction_challenge` checks both case snapshots | `test_frozen_case_blocks_pending_contradiction_assessment_and_authority_edges` | **Fixed; locally tested.** Atomic state behavior under actual runtime not proven. |
| Challenge source references bind exact current CaseCourt records | `_get_authority_record`, operative ID/kind/digest/version checks | Forged/stale/mismatch tests in contradiction suite | **Locally enforced for same-deployment records.** Supplied excerpts remain unauthenticated. |
| Authority relationship is append-only, uniquely identified and bounded | `record_authority_relationship`, edge IDs, count/cap, sequence views | Authority graph tests for duplicate, self-link, mismatch, capacity and supersession cycles | **Locally tested.** Traversal/fees not profiled; relation provenance does not prove law. |
| Supersession cannot create a cycle within the bounded graph | `_supersession_cycle_exists` traverses only `SUPERSEDES` edges | Cycle tests in Stage 6 authority suite | **Locally tested.** Runtime cost at cap remains unknown. |
| Frozen or appealed linked cases cannot receive a new authority edge | `record_authority_relationship` checks linked source/target case status | Shared frozen-case regression test | **Fixed; locally tested.** CaseCourt-local boundary only. |
| AI result is not accepted on JSON shape alone | Judgment, appeal, web/source, contradiction custom EP validators compare decision-bearing fields | Tests include valid JSON with wrong fields, inconsistent fields, malformed output and mocked disagreement | **Locally tested with mocked validators.** Real validator consensus/independence is **BLOCKED**. |
| No intended application state write occurs before EP returns accepted result | AI methods stage local result then append after `run_nondet_unsafe` return | Source inspection and Direct Mode failure/disagreement snapshots | **Implemented / locally tested.** Native rollback semantics are not established. |
| Untrusted text remains data in AI prompts | Evidence is framed/JSON-encoded; Stage 7 grounds now JSON-escaped | Hostile multiline appeal/contradiction prompt regressions | **Locally tested.** Prompt injection cannot be eliminated by encoding alone. |
| Timestamp provenance is not fabricated | Contract context datetime used; frontend separates prepared/local timestamps from chain observations | Source review, types and runtime docs | **Implemented.** No live timestamp source comparison was made. Transaction time is not publication time. |
| Local history/address data is not authoritative | Frontend transaction cache and configured address are advisory; live readback needed | Frontend integration tests and source review | **Implemented / locally tested.** No live deployment address exists. |
| Web Render never runs while gate is closed | `WEB_RENDER_RUNTIME_ENABLED = False`; capture fails before render | Stage 5 Web Evidence tests assert disabled path | **Locally tested.** Never enable until runtime network controls/caps are proved. |

## Impossible, ambiguous, or deadlock states

1. **Accepted but nonfinal judgment:** CaseCourt can persist an accepted execution before a demonstrated native-finality callback. Application state must therefore not be called a legally final or protocol-final decision. This is a **release blocker**.
2. **Appeal freeze with unavailable progress:** after an appeal begins, no unilateral timeout/escape is implemented. A failed or indefinitely pending execution can leave the case frozen. Retry/recovery policy is not runtime-proven; liveness is **open**.
3. **Bilateral closure is a local terminal flag:** it does not close native transaction appeals, prove finality, or create legal res judicata. UI/documentation must keep these meanings distinct.
4. **Participant assertions:** scope, excerpts, and some source claims are user supplied. Matching commitments establish who supplied bytes and whether bytes later match; they do not establish source provenance or jurisdiction.
5. **CaseCourt-only freeze:** the freeze does not constrain Registry, Evaluator, or unrelated contracts. Do not present it as a network-wide or system-wide freeze.

# Stage 7B additive invariants (2026-10-13)

- A contradiction challenge spans two distinct cases; the caller must be a named participant in both and must not be the challenged decision submitter. A failed deterministic authorization check appends no challenge/action and changes no counter.
- Registry decision dates must be valid Gregorian dates, including leap-year rules; date metadata remains caller-supplied and is not an authenticity claim.
- Appeal application status, native transaction status, and verified successful finalized execution are separate. The CaseCourt recovery view exposes only application state and labels native lifecycle unavailable/finality unverified.
- A contract record read or a localStorage transaction note cannot establish finality. Frontend finality labels require an observed finalized lifecycle signal; even this is transaction observation, not legal correctness.
- Authority graph edges are append-only historical records. Their presence alone does not prove current operative authority, authenticity, legal correctness, or transaction finality.

