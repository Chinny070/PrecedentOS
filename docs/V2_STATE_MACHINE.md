# PrecedentOS 2.0 Case State Machine

> **Stage 4 implementation note:** The transitions below originally described the intended complete lifecycle. The locally implemented subset and its actual method names/statuses are captured in `V2_APPEAL_COURT_IMPLEMENTATION.md`. In particular, there are no time-based appeal windows, finalized callbacks, exceptional-review stage or network-wide freeze. Direct Mode coverage does not prove live validator consensus or rollback.

**Status:** proposed protocol behavior; transitions are not implemented or runtime-proven.
**Critical distinction:** a PrecedentOS case phase is application state. A GenLayer transaction has its own consensus, appeal, and finalization lifecycle. Both must be shown independently.

## 1. State model

The CaseCourt stores a current case snapshot for efficient guarded transitions and an immutable, sequence-numbered action journal as the history. Every accepted command appends a new action and increments a monotonic case version; it never edits or deletes a prior action. Existing record/evaluation views remain separate objects.

| Case phase | Meaning |
|---|---|
| `CASE_OPEN_PENDING_PROTOCOL_FINALITY` | Case creation transaction has an accepted result but remains natively appealable; the evidence deadline has not started. |
| `EVIDENCE_OPEN` | Case created; named parties may append allowed evidence versions until the evidence cutoff. |
| `EVIDENCE_LOCKED` | Evidence set is frozen for the initial assessment; only a valid challenge or appeal may add a separately versioned item. |
| `RULING_PENDING` | Bounded first-instance AI task is executing under GenLayer consensus; no outcome is operative yet. |
| `DECISION_PENDING_PROTOCOL_FINALITY` | A decision transaction has an accepted result, but its native appeal/finality process is still open; the case appeal clock has not started. |
| `CHALLENGE_OPEN` | The ruling's GenLayer transaction reached native finality and parties may challenge/freeze within the configured case challenge window. |
| `FROZEN` | A valid, bounded case hold blocks all protected CaseCourt changes until expiry or an eligible appeal progression. |
| `APPEAL_1_OPEN` | A qualifying appeal is eligible for first appellate review. |
| `APPEAL_1_PENDING` | First appellate AI task is executing; earlier decisions remain immutable. |
| `APPEAL_1_PENDING_PROTOCOL_FINALITY` | First appeal result's own transaction remains appealable; the level-two case appeal clock has not started. |
| `APPEAL_2_OPEN` | Second and last ordinary case appeal level is eligible. |
| `APPEAL_2_PENDING` | Final ordinary appellate AI task is executing. |
| `APPEAL_2_PENDING_PROTOCOL_FINALITY` | Final ordinary appeal result's native transaction remains appealable; the case is not yet finalizable. |
| `RECONSIDERATION_OPEN` | A final case has an eligible, single exceptional-review petition based on a novel material-evidence commitment. |
| `FINALIZABLE` | All configured case challenge/appeal windows have elapsed; no active freeze or accepted petition remains. This is a case procedure projection, not a GenLayer transaction status. |
| `CASE_CLOSE_PENDING_PROTOCOL_FINALITY` | A case-close action has been accepted but its own native appeal/finality process remains open. |
| `CASE_FINAL` | The case-close transaction reached native finality and the operative final decision digest is recorded. |
| `CLOSED` | Administrative terminal state after finality/record retention rules; history remains publicly readable and immutable. |

`REVERSED` and `SUPERSEDED` are authority relation types on a particular precedent/decision, not destructive replacements of the entire case phase. The old decision remains retrievable with an explicit subsequent relation.

## 2. Transition table and authorization

All IDs, enums, limits, and reason codes must be validated in the contract. “Party” means the caller address equals one of the addresses recorded in the case; that proves key control only, not legal identity or representative authority.

| Command | From → To | Who may call | Preconditions / effect |
|---|---|---|---|
| `open_case` | none → `CASE_OPEN_PENDING_PROTOCOL_FINALITY` | Any account as petitioner | ID unused; petitioner is `msg.sender`; respondent is a different nonzero address; supported policy/criteria/schema versions selected and locked; initial opening commitment stored. |
| Accepted open-case transaction | `CASE_OPEN_PENDING_PROTOCOL_FINALITY` → `EVIDENCE_OPEN` | Native finalized callback or other runtime-proven handoff | Start evidence window from the deterministic activation timestamp only after the supported handoff. |
| `append_evidence` | `EVIDENCE_OPEN` → same | Either named party or explicitly authorized agent | Before evidence deadline; expected version matches; evidence ID/version unique; digest and schema valid; append only; all source material is public/fictional or approved. |
| `lock_evidence` | `EVIDENCE_OPEN` → `EVIDENCE_LOCKED` | Permissionless after deadline; either party may lock earlier only if policy permits | Evidence-set root/sequence and lock action appended. Once locked, no evidence rewrite; later evidence requires an allowed challenge/appeal stage. |
| `capture_web_evidence` | `EVIDENCE_OPEN` → same | Named party / allowed agent | Public safe URL and bounds; GenVM Web Render executed and validator acceptance established; version is appended. Blocked until URL safety, renderer output and failure behavior pass. |
| `evaluate_case` | `EVIDENCE_LOCKED` → `RULING_PENDING` | Either party or permissionless caller | One assessment per stage/version; case and evidence roots fixed; criteria version locked; no caller-provided classification. |
| Accepted initial assessment | `RULING_PENDING` → `DECISION_PENDING_PROTOCOL_FINALITY` | Consensus execution result | Structured decision is stored only after the Equivalence Principle returns. The transaction may still be appealed; no case appeal deadline runs yet. Failed, disagreed, timed-out, or malformed result does not produce an operative decision. |
| Ruling transaction reaches native finality | `DECISION_PENDING_PROTOCOL_FINALITY` → `CHALLENGE_OPEN` | Idempotent finalized callback or other runtime-proven handoff | Records the finality anchor and starts the case challenge window. This handoff is blocked until proven. |
| `challenge_decision` | `CHALLENGE_OPEN` → `APPEAL_1_OPEN` or challenge review | Opposing party; policy may allow either named party | During case challenge period; binds current decision digest/version, typed grounds and new evidence digest; duplicate/replay blocked. The challenge causes a new CaseCourt process, not a native transaction appeal. |
| `request_freeze` | `CHALLENGE_OPEN` / appeal-open → `FROZEN` | Named party | Only for a qualifying active challenge/appeal; one short hold per decision/level; reason/evidence digest; recorded expiry; it immediately gates all protected CaseCourt writes. An unqualified party cannot freeze indefinitely. |
| Freeze expiry | `FROZEN` → prior challenge/appeal-open state | Deterministic predicate / permissionless transition | Compare transaction-context time to stored freeze deadline. A keeper call may materialize the expiry event; it cannot choose the deadline. Deadline clock proof is a Stage 1 gate. |
| `file_case_appeal(level=1)` | `CHALLENGE_OPEN` → `APPEAL_1_OPEN` | Named party | Within configured appeal window and current ruling version; one appeal per party/level; new grounds and evidence references; case appeal limit checked. |
| `decide_case_appeal(level=1)` | `APPEAL_1_OPEN` → `APPEAL_1_PENDING` → `APPEAL_1_PENDING_PROTOCOL_FINALITY` | Permissionless trigger; contract selects evidence/criteria | Independent AI-assisted appeal assessment under same or explicitly versioned appeal rubric; validators compare decision-bearing fields. Earlier ruling remains in history. |
| First appeal result reaches native finality | `APPEAL_1_PENDING_PROTOCOL_FINALITY` → `APPEAL_2_OPEN` or final challenge window | Idempotent finalized callback or proved handoff | Only now starts the next case-level window. |
| `file_case_appeal(level=2)` | `APPEAL_2_OPEN` → same/pending | Named party | Within final ordinary appeal window; one appeal per party; unique action and current ruling digest. No third ordinary appeal level. |
| `decide_case_appeal(level=2)` | `APPEAL_2_OPEN` → `APPEAL_2_PENDING` → `APPEAL_2_PENDING_PROTOCOL_FINALITY` | Permissionless trigger; contract-selected task | Same independent consensus validation and append-only result rules. |
| Second appeal result reaches native finality | `APPEAL_2_PENDING_PROTOCOL_FINALITY` → `FINALIZABLE` | Idempotent finalized callback or proved handoff | Starts the case closure condition/window, if required by the frozen policy. |
| `finalize_case` | final challenge/appeal phase → `CASE_CLOSE_PENDING_PROTOCOL_FINALITY` | Anyone | All case windows elapsed; no active freeze or unresolved challenge/appeal; selected operative ruling digest matches current state; appends a pending closure action. |
| Case-close transaction reaches native finality | `CASE_CLOSE_PENDING_PROTOCOL_FINALITY` → `CASE_FINAL` | Idempotent finalized callback or proved handoff | Records the operative case-final state. The callback transaction itself has its own GenLayer lifecycle and must be observed. |
| `petition_exceptional_review` | `CASE_FINAL` → `RECONSIDERATION_OPEN` | Named party, at most once per party/decision | New evidence digest not present in prior action history; stated allowed ground; independent materiality assessment under a versioned exceptional policy; replay rejected. It does not delete or rewrite the original final record. |
| Accepted exceptional review | `RECONSIDERATION_OPEN` → new `EVIDENCE_OPEN`/appeal stage | Consensus execution result | New proceeding version references prior final decision; only new bounded evidence and decision are added. Maximum one successful reopening per case in proposed v1. |
| `record_relation` | any appropriate decision phase → same | CaseCourt only / permissionless trigger to derive | Append `cites`, `distinguishes`, `questions`, `reverses`, or `supersedes` relation tied to a decision digest. No caller may directly assert a relation without a validated case outcome/policy ground. |
| `close_case` | `CASE_FINAL` → `CLOSED` | Anyone | Retention policy satisfied; closed view still exposes append-only history, relation graph, and provenance. No storage deletion. |

### Invalid transition behavior

Unknown case, wrong actor, stale version/digest, unsupported policy, invalid phase, duplicate action/evidence/appeal ID, expired deadline, excessive count/size, frozen case, replay, malformed evidence, or failed AI validation must reject before any persistent mutation. Direct Mode proves only local contract/harness behavior; each relevant path also needs runtime integration tests.

## 3. Deadline policy and the finality-anchor blocker

Proposed policy defaults for review: evidence open **7 days**; decision challenge **72 hours**; each ordinary case appeal **7 days**; temporary freeze maximum **24 hours** unless a qualifying appeal is filed; ordinary appeal levels **2**; exceptional petition **once per party per final ruling** and at most one successful reopening per case. These are reviewable protocol policy values, not rules of any court. Each case stores a policy version at opening; it cannot be shortened retroactively.

The clock source is a transaction-context datetime, not the browser clock. Current official docs describe `gl.message_raw['datetime']` and deterministic time shared across validators. They also describe `emit(on='finalized')` as a way to create a dependent write after a transaction finalizes. However, the project has not runtime-proven that a same-contract finalized callback is supported/reliable in the target environment or that it can safely anchor the case challenge clock.

**Implementation blocker:** a case appeal deadline must not begin while the ruling's GenLayer transaction is still natively appealable. Before implementation, demonstrate a reliable on-chain transition from a ruling transaction's actual native `FINALIZED` state to the case's appeal-open state. The likely probe is an idempotent `emit(on='finalized')` callback, with duplicate/retry/rollback tests. If unsupported, redesign the finality handoff; do not use a browser receipt or a user-asserted transaction status as on-chain proof. Until this gate passes, all case deadline transitions and case finality remain proposed.

Time source guarantees transaction-relative determinism, not accurate real-world wall-clock deadlines. The study must verify the network's transaction timestamp behavior and define maximum queue/appeal delays and a generous review window. Store the raw ISO timestamp and normalized integer value only if both conversions are validated against the selected runtime.

## 4. Freeze invariants

When frozen, the contract must reject all transitions that could:

- change the current operative ruling or decision digest;
- append an evidence item into the locked adjudication set;
- trigger or complete an assessment based on stale or changed inputs;
- move, waive, shorten, or close an appeal/challenge stage;
- append an operative reversal/supersession relation;
- finalize or close the case.

Views and permissionless reads remain available. Native GenLayer consensus actions, unrelated cases, Registry registrations, and standalone Evaluator comparisons are outside this freeze. The UI must say “CaseCourt actions frozen” rather than imply a network-wide freeze.

## 5. Native GenLayer appeals vs case appeals

| Layer | What is challenged | Who/when | Result |
|---|---|---|---|
| **GenLayer native transaction appeal** | Whether the leader's proposed execution receipt should stand, or whether a new leader round should run after an undetermined/timeout result | Protocol-eligible caller, during the network appeal window, with live quoted protocol charge | The transaction can be recomputed/re-decided; same-contract provisional state and dependent queue work may be re-executed. This does not hear a party's substantive case grounds. |
| **PrecedentOS case appeal** | CaseCourt's AI-assisted case decision under the locked case criteria and a party's newly filed grounds/evidence | Named party, under CaseCourt's versioned appeal levels/windows | A new append-only case decision and case state transition. Its own GenLayer transaction is independently subject to native consensus/appeals/finality. |

Application messages, UI labels, deadline logic, and tests must carry the layer identifier. Never call a native appeal a case appeal, or case-finality “transaction finalized.”

## 6. Reversal, supersession, and exceptional review

- A final appellate or exceptional-review decision may append `REVERSES` or `SUPERSEDES` against an earlier precedent/decision digest. The old record never changes.
- `REVERSES` means the later CaseCourt decision explicitly sets a prior decision aside within this protocol's graph. It does not erase the original, establish legal precedent, or bind external courts.
- `SUPERSEDES` means a later version is treated as the current PrecedentOS reference under the case's stated scope; scope, reason, source evidence, and effective case decision are recorded.
- `CITES`, `DISTINGUISHES`, and `QUESTIONS` capture non-operative relationships and can be shown without asserting authority.
- The UI computes “currently superseded” from finalized relation actions in the selected chain view; a locally saved edge or accepted-but-nonfinal transaction cannot alter authority labels.
- Exceptional review is a bounded new proceeding linked to the final case. Novelty is checked against prior evidence digests; materiality and allowed grounds require a separately validated AI comparison and policy. The original final decision remains visible.

## 7. State-machine verification tests required

Test every transition success and every forbidden transition with state snapshots before/after. Include unauthorized senders for every write, stale case version and decision digest, action/evidence/appeal replay, duplicate appeal levels, each deadline boundary (`now <`, `now ==`, `now >`), expired and active freezes, all protected methods during freeze, invalid unfreeze attempts, native transaction appeal and case appeal separation, first/second appellate branches, failed LLM/validator execution, reversal/supersession append-only behavior, novelty replay, maximum counts/payload sizes, transaction-context timestamp determinism, and finality-callback retries. A mocked callback or Direct Mode validator is not live consensus evidence.
