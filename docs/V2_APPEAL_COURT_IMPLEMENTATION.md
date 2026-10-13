# Stage 4 — CaseCourt Appeal Lifecycle

## Scope and authority boundary

Stage 4 extends the existing CaseCourt-owned judgment model. It does not read or write the Registry/Evaluator, invoke other contracts, set legal deadlines, or claim native transaction finality. An appeal is an application-level case process. Every write remains subject to GenLayer's separate transaction lifecycle.

New cases use CaseCourt snapshot schema version 2 to add operative-decision, appeal-freeze and closure fields. CaseCourt is not upgradeable through this repository change; a previously deployed Stage 3B contract will not gain these methods or fields without a separately reviewed deployment/migration decision.

CaseCourt deterministically admits only the opposing named participant against the current exact CaseCourt judgment (level 1) or the latest resolved level-1 appellate ruling (level 2). Eligibility failures revert before state changes; they are represented by the failed transaction, not by a successful on-chain “rejection record.” There is at most one active appeal and no more than two appeal filings in total per case. IDs, target versions and commitments, grounds bytes, appellant, case identity and filing commitment are checked.

## Public write interface

| Method | Purpose and gates |
|---|---|
| `file_appeal(case_id, expected_version, action_id, appeal_id, target_kind, target_id, target_version, target_commitment, parent_appeal_id, grounds_code, grounds_text, grounds_digest, expected_filing_commitment)` | Validates participant/opponent, exact target and its bound evidence root, supported grounds, exact UTF-8 grounds digest, filing commitment, replay/depth/case state; appends the filing, freezes this CaseCourt case, and records the active appeal. |
| `append_appeal_evidence(...)` | Only the appellant can add up to eight bounded digest references while the admitted appeal is open. Full evidence stays off chain. |
| `lock_appeal_evidence(...)` | Only appellant; freezes the ordered reference list into an `PrecedentOS-APPEAL-EVIDENCE-v1` commitment. Empty appeal evidence is allowed and has a deterministic empty-list root. |
| `begin_appeal_review(...)` | Only the other named case participant; requires locked evidence and moves the appeal to review. |
| `adjudicate_appeal(...)` | Only non-appellant participant; validates both committed text packets, then runs bounded AI analysis under the custom Equivalence Principle and appends a pending-resolution ruling. |
| `resolve_appeal(...)` | A named participant supplies only the appeal ID and the already stored ruling commitment. CaseCourt revalidates the immutable ruling and applies its stored accepted outcome; no caller-supplied ruling object is accepted. |
| `request_case_closure(...)` / `approve_case_closure(...)` | Any party may request closure only after a locally accepted case decision/ruling and with no active freeze. The other party must approve. This is a CaseCourt policy state, not GenLayer transaction finality. |

Read methods include `get_appeal`, `get_appeal_filing`, `get_appeal_evidence`, `get_appellate_ruling`, `get_case`, `get_judgment`, and the append-only `get_case_action` sequence.

## Historical evidence selection

Original locked evidence is reconstructed from CaseCourt's append-only action sequence and filtered to the original judgment's recorded case version. Each provided UTF-8 evidence text must match the exact reference digest and order. Appeal evidence uses explicit bounded sequence IDs and the same byte-level SHA-256 check. The packet must contain exactly `original_evidence` and `appeal_evidence` arrays; both arrays must match their committed references exactly. Maximum packet size is 12,000 UTF-8 bytes; each appeal evidence text is capped at 1,200 bytes; grounds text is capped at 600 bytes.

These checks prove byte equality with prior commitments, not source authenticity, truth, admissibility, completeness, or legal correctness. Submitted text is prompt-injection-capable untrusted data and is not stored on chain.

## Immutable history and mutable projection

`PF:<appeal_id>` is an immutable filing snapshot. `AE:<appeal_id>:<evidence_id>` records are immutable. `AR:<appeal_id>` is an immutable structured ruling and is never rewritten during resolution. `A:<case_id>:<sequence>` records every state transition and is append-only/replay-protected. The `P:<appeal_id>` appeal object and `C:<case_id>` case object are mutable current-state projections; they are not themselves immutable history. Action and filing/ruling records preserve the historical trail.

The current API has no delete or edit method for a judgment or ruling. On reversal the case snapshot identifies `superseded_judgment_id` and makes the appellate ruling the operative reference; the original `J:` judgment remains unchanged. The status is authoritative only inside this CaseCourt instance and only after the network transaction is separately observed successful/finalized.

## Limitations

- No deadline is applied. The project has not verified a supported finality anchor or stable transaction timestamp behavior.
- If appellate execution cannot reach consensus, the active appeal remains frozen and can be retried. There is no timeout/unfreeze bypass; this preserves safety but creates a liveness risk.
- CaseCourt freeze blocks CaseCourt mutation methods only. It cannot freeze Registry/Evaluator, other contracts, pending external transactions, user wallets, or outside legal processes.
- Appeal review is performed by the same participant set model as CaseCourt (the non-appellant case party triggers review); no independent judicial panel, identity proof, DAO, external counsel, or legal appeal rights are implemented.
- Two total levels are supported; exceptional reconsideration is not.
- Direct Mode mocks the model and validator. It proves neither live validator disagreement rejection nor storage rollback/finality semantics.
