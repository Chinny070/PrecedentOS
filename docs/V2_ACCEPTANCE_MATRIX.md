# PrecedentOS 2.0 Feature Acceptance Matrix

This matrix carries every feature in the Stage 0 product brief across contract, frontend, automated testing, security review, and live stable Studionet verification. `Not implemented` is not an implicit future pass. Rows close only when evidence is linked in a later stage report.

## Status legend

Stage-specific evidence uses these explicit states: **IMPLEMENTED**, **LOCALLY TESTED**, **RUNTIME VERIFIED**, **LIVE STUDIONET VERIFIED**, **BLOCKED**, and **NOT STARTED**. A feature may have different states for source, local tests, an actual GenLayer runtime, and live deployment. “RUNTIME VERIFIED” requires executed behavior on an identified GenLayer runtime; static lint and mocks do not qualify. “LIVE STUDIONET VERIFIED” requires real stable Studionet evidence with transaction/read IDs. A prior user-reported read-only identity response remains attributed to the user and is not a Stage 8 runtime result.

- **Existing / local:** present in source and supported by local Direct Mode or frontend tests; not live proof.
- **Implemented / Stage 1 local:** deterministic CaseCourt source exists and passed Direct Mode plus cached GenVM lint; not local Studio or live proof.
- **Partial / demo:** some UI or helper exists but behavior is fixture-only or bounded to the loaded subset.
- **Proposed:** architecture is defined here; code is not implemented.
- **Blocked:** dependency or network/runtime proof is unresolved.
- **—:** no qualifying implementation/evidence yet.
- **Verified live:** requires actual stable Studionet evidence with transaction/read IDs; none of the v2 governance features currently qualify.

## Feature matrix

| # | Feature | Contract implementation | Frontend implementation | Automated tests | Security review | Live Studionet verification |
|---:|---|---|---|---|---|---|
| 1 | Precedent registration and evidence commitments | Registry v1 implemented append-only; verifies digest syntax, not source bytes. | Registration/detail/addresses implemented; live addresses absent. | Registry Direct Mode coverage; cross-language digest vector. | Registry/evaluator security reports exist; source authenticity remains unresolved. | **—** No live deployment/registration; RPC identity request was blocked before HTTP. |
| 2 | AI precedent evaluation | Evaluator v1 uses LLM + custom EP decision-field comparison; IDs are caller assertions. A separate diagnostic probe received user-reported live AI/EP execution; production Evaluator remains undeployed. | Pair compare/result routes and adapter implemented. | Direct Mode tests mock LLM/validator; diagnostic live evidence is separate from production Evaluator. | Stage 2C review and existing bounds; no independent legal correctness. | **BLOCKED for production Evaluator**; diagnostic AI/EP evidence is user-provided only (Stage 9 report). |
| 3 | Case lifecycle and decision states | CaseCourt owns status, parties, version and append-only action journal; Stage 3B owns bounded AI judgment; Stage 4 adds appeal result transitions and application closure. | Typed status/read boundary; no active write control. | Stage 3B and Stage 4 Direct Mode; AI/EP mocks. | CaseCourt-local only; stable runner, actual consensus and rollback blocked. | **BLOCKED** No deployment or live reads. |
| 4 | Appeals and appeal eligibility | `file_appeal` binds exact current judgment or level-1 ruling, case/version/root, opposing party, grounds and filing commitment. Eligibility rejection reverts and is represented as a failed transaction, not an on-chain rejection record. Max two levels. | Typed appeal/ruling/read observations; writes disabled. | `test_case_court_appeals.py` Direct Mode, fictional fixtures, shared commitment vectors. | Due-process policy, deadlines, appeal liveness, source authenticity and live consensus remain blocked. | **BLOCKED** No Studio or Studionet appeal transaction. |
| 5 | Enforceable decision freezes | Appeal filing atomically freezes CaseCourt until `resolve_appeal`; generic unfreeze cannot release it. Existing one-time 24-hour discretionary challenge freeze remains separate. | Case-local phase/freeze types; no operational UI. | Automatic freeze, ordinary mutation rejection, unfreeze attacks and state preservation in Direct Mode. | Does not freeze Registry/Evaluator or other ICs; appeal consensus failure can leave a case frozen. | **BLOCKED** No deployment or freeze transaction. |
| 6 | AI-assisted appeal judgments | `adjudicate_appeal` uses bounded original/appeal evidence packets, strict outcome schema, `gl.nondet.exec_prompt` and custom decision-field Equivalence Principle checks. | Typed ruling observation and explicit `DISABLED_RUNTIME_UNVERIFIED` write gate. | Mocked Direct Mode; invalid/contradictory outputs and validator disagreement callback tested. | Real validator agreement/disagreement, rollback and legal correctness blocked. | **BLOCKED** No live AI or consensus evidence. |
| 7 | Genuine GenLayer Web Render evidence retrieval | Stage 5 adds `gl.nondet.web.render(url, mode="text")` behind `WEB_RENDER_RUNTIME_ENABLED = False`; source follows official documented API patterns. | `/web-evidence` explains the closed gate and shows no live or mock page content. | Capture and custom EP paths use patched Direct Mode renderer/model functions only. | URL syntax checks do not prevent DNS rebinding, private-IP resolution, or redirects. Runtime egress and pre-read bounds remain unresolved; production capture is fail-closed. | **BLOCKED / NOT STARTED** No render executed by GenVM or live node. |
| 8 | Evidence locking, versioning, provenance | Stage 5 adds append-only source versions, request/verification/comparison commitments, and case/appeal evidence binding; a URL alone proves no contents. | Typed source, verification, request, freshness, change, and comparison shapes; UI distinguishes reports from verified retrieval. | Direct Mode covers source/request identity, immutable references, drift, mocked retrieval, and shared Python/TS vectors. | Authenticity, admissibility, post-capture freshness, rollback, and finality remain unresolved. | **BLOCKED** No deployed source record or capture. |
| 9 | Contradiction challenges | Bounded CaseCourt-only filing binds two exact operative decisions and participant-supplied excerpts; bounded AI assessment uses a custom decision-field Equivalence Principle. Registry/Evaluator calls are excluded. | `/tribunal` is a read-only fictional fixture view; no live challenge/write connection. | `test_case_court_contradictions_authority.py` tests validation and mocked validator disagreement. | Excerpts are not verified source bytes; consensus is not legal correctness; finality is unverified. | **BLOCKED** No deployment or live challenge. |
| 10 | Precedent reversal and supersession | Only an exact resolved CaseCourt appellate ruling can append a matching uphold/reverse/supersede/remand edge; source judgment remains immutable. | Fictional relation/provenance disclosures only; no live authority claims. | Direct Mode fictional reversal, supersession, replay and bounded cycle checks. | CaseCourt's stored resolution is not proof of finalized transaction or legal correctness. | **BLOCKED** No live appeal or edge. |
| 11 | Precedent authority and decision lineage | CaseCourt-local append-only, versioned graph edges with provenance; exact IDs/commitments; bounded reads/cycle traversal. | Existing demo graph remains fixture-only; Tribunal disclosure classifies authority as unverified unless runtime evidence says otherwise. | Direct Mode relation, cap, self-link, provenance, mismatch and cycle tests. | No Registry/Evaluator cross-contract verification, corpus enumeration, or finality proof. | **BLOCKED** No deployed graph reads. |
| 12 | Multi-level appeals | Two levels: level 1 targets operative judgment; level 2 may target latest resolved level-1 ruling. Total appeal filings capped at two; exceptional reconsideration omitted. | Typed level/parent/ruling shapes only. | Two-level Direct Mode flow and depth overflow locally tested. | Native transaction appeals remain distinct; reviewer/due-process rules unresolved. | **BLOCKED** No live appeal. |
| 13 | Deadlines and protocol case finality | No appeal deadlines; closure is bilateral CaseCourt state only and is not GenLayer transaction finality. | Transaction lifecycle remains separate; finality helper refuses unverified observations. | Case closure and lifecycle labels locally tested. | Finality anchor/time origin not verified; no exception/recovery deadline. | **BLOCKED** No live finality evidence. |
| 14 | Equivalence Principle and consensus-aware validation | CaseCourt uses `gl.nondet.exec_prompt(..., response_format='json')` within custom `run_nondet_unsafe`; independently compares classification, sufficiency, material issue, eligibility, rule application, outcome, criteria and uncertainty. A separate probe exercised an AI/EP path per user-reported evidence; this does not verify production code. | Typed lifecycle/read/write interface only; no active adjudication UI. | Direct Mode mocked output and validator path; decision disagreement returns false when the harness validator is run. | Cached lint passes; production contracts' real consensus, disagreement rollback and legal correctness remain unverified. | **BLOCKED for production contracts**; probe accepted/disagreement observations are attributed to the user in the Stage 9 report. |
| 15 | Counterfactual analysis | No contract feature; correctly off-chain/hypothetical. | `/simulate` exists with fictional browser-only scenarios. | Limited frontend tests; no legal/model validation. | Needs explicit hypothetical labeling and no authoritative writes. | **—** Not intended as chain decision. |
| 16 | DAO and AI-agent integration | No DAO/agent role registry or adapter. | Wallet integration exists; no agent workflow. | No agent authorization tests. | Address≠identity; capability authorization threat model specified. | **—** |
| 17 | Security and abuse protections | Registry/Evaluator unchanged; CaseCourt adds bounded capture/comparison paths and mutual pre-review withdrawal. Web Render remains hard-disabled. | No governance write control; `/web-evidence` reports provenance and capability gates. | Stage 5 positive/adversarial Direct Mode tests with mocked retrieval/LLM and shared SHA vectors. | DNS/redirect egress, rollback, consensus, resource cost, due process, and independent audit unresolved. | **BLOCKED** Live behavior/security unverified. |
| 18 | Complete frontend workflows | Web Evidence and freeze states have typed read interfaces; no production write adapter. | Web Evidence page communicates source approval, observation, freshness and freeze recovery without live claims. | Vitest cross-language vector tests and full frontend checks. | Live data lifecycle, wallet-authorized actions, accessibility, and finality-aware controls remain open. | **NOT STARTED** No live governance UI. |
| 19 | Real Studionet deployment verification | Registry/Evaluator/CaseCourt production addresses remain unverified. Separate diagnostic probe deployed at `0xbD809d35095A8CC260b9Abd6e65F42d5348800B2` per screenshot; this is not a production address. | Existing wallet/network adapter; no CaseCourt write path. | Direct Mode and cached lint; user supplied probe transaction/readback outcomes. Independent transaction reads failed `fetch failed`. | Exact stable runner/toolchain and stable fee profile unresolved. | **PARTIAL DIAGNOSTIC ONLY**; production deployment and current independent RPC read remain blocked. |
| 20 | Submission-ready documentation and demonstration | Stage 3B judgment code/schema implemented locally; no runtime-verified authority/finality. | Fictional demo preserved; adjudication remains disabled. | Current counts in `V2_STAGE_3B_REPORT.md`; no live end-to-end demo. | Runtime, economic and legal-policy gates remain. | **—** No verified live deployment or demo. |

## Stage 8 evidence overlay for the 20 original product requirements

This overlay preserves the original twenty rows above while recording the distinct Stage 8 evidence classes requested for implementation, local tests, runtime, and live Studionet. “Mocked local test” is explicitly not runtime verification. `RUNTIME VERIFIED` and `LIVE STUDIONET VERIFIED` are empty for all twenty requirements in this stage.

| # | Requirement | Implementation | Local test evidence | Runtime evidence | Live Studionet evidence |
|---:|---|---|---|---|---|
| 1 | Precedent registration and evidence commitments | IMPLEMENTED | LOCALLY TESTED | BLOCKED | NOT STARTED |
| 2 | AI precedent evaluation | IMPLEMENTED | LOCALLY TESTED (LLM/validator mocked) | BLOCKED | NOT STARTED |
| 3 | Case lifecycle and decision states | IMPLEMENTED | LOCALLY TESTED (Direct Mode) | BLOCKED | NOT STARTED |
| 4 | Appeals and appeal eligibility | IMPLEMENTED | LOCALLY TESTED (Direct Mode) | BLOCKED | NOT STARTED |
| 5 | Enforceable decision freezes | IMPLEMENTED | LOCALLY TESTED (Direct Mode) | BLOCKED | NOT STARTED |
| 6 | AI-assisted appeal judgments | IMPLEMENTED | LOCALLY TESTED (LLM/validator mocked) | BLOCKED | NOT STARTED |
| 7 | Genuine GenLayer Web Render retrieval | IMPLEMENTED behind `WEB_RENDER_RUNTIME_ENABLED = False` | LOCALLY TESTED with mocked retrieval | BLOCKED; security/runtime protections unproven | NOT STARTED |
| 8 | Evidence locking, versioning, provenance | IMPLEMENTED | LOCALLY TESTED (Direct Mode/mocked retrieval and commitment vectors) | BLOCKED | NOT STARTED |
| 9 | Contradiction challenges | IMPLEMENTED | LOCALLY TESTED (Direct Mode/mocked assessment) | BLOCKED | NOT STARTED |
| 10 | Reversal and supersession | IMPLEMENTED | LOCALLY TESTED (Direct Mode) | BLOCKED | NOT STARTED |
| 11 | Authority graph and lineage | IMPLEMENTED | LOCALLY TESTED (Direct Mode) | BLOCKED | NOT STARTED |
| 12 | Multi-level appeals | IMPLEMENTED | LOCALLY TESTED (Direct Mode) | BLOCKED | NOT STARTED |
| 13 | Deadlines and protocol case finality | Partial: bilateral application closure exists; appeal deadlines and a native-finality anchor are absent | LOCALLY TESTED for application closure only | BLOCKED for native finality; deadlines NOT STARTED | NOT STARTED |
| 14 | Equivalence Principle and consensus-aware validation | IMPLEMENTED with decision-bearing field checks | LOCALLY TESTED (validator path mocked) | BLOCKED; no real validator consensus | NOT STARTED |
| 15 | Counterfactual analysis | IMPLEMENTED as browser-only hypothetical UI | LOCALLY TESTED (frontend fixtures) | Not an on-chain runtime feature | Not intended as a live decision |
| 16 | DAO and AI-agent integration | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| 17 | Security and abuse protections | IMPLEMENTED in bounded source paths; important runtime controls remain unresolved | LOCALLY TESTED (adversarial Direct Mode and frontend tests) | BLOCKED | NOT STARTED |
| 18 | Complete frontend workflows | IMPLEMENTED as demo/read UI; governance writes remain disabled | LOCALLY TESTED (frontend suite) | BLOCKED for live provider/contract behavior | NOT STARTED |
| 19 | Real Studionet deployment verification | Source and chain config implemented | LOCALLY TESTED (SDK source/type checks only) | BLOCKED; public RPC returned no response in this host | NOT STARTED |
| 20 | Submission-ready documentation and demonstration | IMPLEMENTED as fictional demo/docs; runtime claims withheld | LOCALLY TESTED (automated suites) | BLOCKED for actual runtime demo | NOT STARTED |

## Stage 9 diagnostic evidence overlay

This overlay records live diagnostic evidence supplied by the user, not production product acceptance. The diagnostic address is `0xbD809d35095A8CC260b9Abd6e65F42d5348800B2`. The four transaction IDs, explorer outcomes, and state readbacks are transcribed in [V2_STAGE_9_LIVE_VERIFICATION.md](V2_STAGE_9_LIVE_VERIFICATION.md); this run could not independently retrieve receipts (`fetch failed`).

| Capability under observation | User-provided Studionet evidence | Acceptance effect |
|---|---|---|
| Probe deployment and transaction context | Explorer screenshot: deployment finalized/accepted/GenVM success; context write finalized/accepted/success; readback reports chain 61999 and matching context fields. | **RUNTIME VERIFIED for isolated diagnostic only**; Registry/Evaluator/CaseCourt deployment is not established. |
| Real diagnostic AI and Equivalence Principle | Probe AI call reported finalized/accepted/GenVM success; stored `POTENTIAL_CONTRADICTION`, count 2, and input commitment recorded. | **RUNTIME VERIFIED for isolated diagnostic only**, attributed to user; production Evaluator/Court validators remain unverified. |
| Diagnostic deterministic failure/rollback | Probe transaction reported finalized/accepted with GenVM error and rollback; user reports unchanged count. | **RUNTIME VERIFIED for isolated diagnostic only**, attributed to user; production rollback remains blocked. |
| Forced validator disagreement | Probe reported Undetermined after rotations; explorer showed leader GenVM return, and user reports state unchanged. | Demonstrates why a leader return cannot stand for consensus acceptance; this application's independent consensus metadata read remains blocked. |
| Production CaseCourt, appeals and freezes | No CaseCourt address or transaction evidence supplied. | **NOT LIVE VERIFIED**; no CaseCourt deployment or operational behavior is claimed. |

The frontend now requires explicit `MAJORITY_AGREE` plus `FINALIZED` plus `FINISHED_WITH_RETURN` before labeling an evaluation successful. Missing or conflicting consensus evidence remains unknown/failed. This is locally tested against SDK-shaped values; live parsing of the supplied transactions could not be independently checked in this host.

## Stage 9 storage-compatibility continuation

The 20 original feature rows above are retained. The following evidence overlay updates only what the Stage 9 continuation established; it does not upgrade any production row to live or stable-runner verification.

| Area | Implementation status | Local test evidence | Runtime/live status |
|---|---|---|---|
| Evaluator nondeterministic callback storage boundary | IMPLEMENTED: decision validation moved to module-level pure functions; public method, stored record schema, input commitments and six compared decision fields preserved. | LOCALLY TESTED: Evaluator Direct Mode suite passes; callback AST guard confirms the callback does not reference `self`. | BLOCKED: exact stable runner and whether the reported warning is eliminated are unverified; production Evaluator not deployed. |
| CaseCourt nondeterministic callback storage boundary | IMPLEMENTED: prompt/schema/equivalence helpers for judgment, appeal, contradiction and source comparison paths moved to module-level functions. Authorization, state reads before the callback, fields compared and write ordering are preserved. | LOCALLY TESTED: all CaseCourt Direct Mode suites pass; callback/helper source guard passes. | BLOCKED: no production CaseCourt execution; warning source and runner behavior unverified. |
| Isolated bound-versus-pure capture diagnostic | IMPLEMENTED: a separate disposable two-method probe compares a bound pure helper against an equivalent free function. | LOCALLY TESTED with Direct Mode; both methods return and store expected booleans. | NOT RUNTIME VERIFIED: harness does not emit/measure GenVM storage-pickling warnings. New deployment/two writes need separate approval. |
| Registry warning exposure | NO nondeterministic path exists in Registry. | LOCALLY TESTED: Registry suite passes; cached lint/schema passes. | Warning does not apply to its source path; Registry still BLOCKED from deployment by exact runner, fee and live functional proof requirements. |
| Web Render safety | `WEB_RENDER_RUNTIME_ENABLED = False`; callback helper refactor does not change the gate. | LOCALLY TESTED: disabled-path and existing mocked Web Evidence tests pass. | BLOCKED / DISABLED: no runtime egress, redirect, DNS/private-IP, pre-read bound or fee proof. |
| Stage 9 local regression snapshot | IMPLEMENTED and locally verified. | `python scripts/run_tests_safe.py tests`: **234 passed, 4 skipped**; frontend lint/typecheck passed, **70 passed**, production build passed; five cached GenVM lint/schema checks passed. | All GenVM checks report `I200`; upstream runner lookup fails with `WinError 10013`. No new live transaction or receipt was obtained. |

For exact provenance and contract-specific deployment gates see [Stage 9 Storage Compatibility](V2_STAGE_9_STORAGE_COMPATIBILITY.md) and [Stage 9 Production Deployment Gate](V2_STAGE_9_PRODUCTION_DEPLOYMENT_GATE.md). The earlier live probe/transaction rows remain user-reported evidence only and still do not imply a deployed production contract.

## Stage 0 evidence snapshot

- Repository `main` was at `71b0b67a5c434584e406c7dd7ab76e121f635a1a`; current `git status` showed only the pre-existing user-requested `manual-deployment/` directory untracked before these Stage 0 documents were added.
- Existing reports record 60 Direct Mode contract tests and 25 frontend tests passing; Stage 0 did not rerun tests because this is architecture-only.
- Production contract paths were unchanged by the Stage 0 blueprint. The Stage 0 blueprint itself involved no install, deploy, wallet signature, or write transaction; the separate documentation-only preservation commit `258549db81024468159cc45fcf329f109ce70de5` was authorized and pushed at the start of Stage 1.
- Current official documentation confirms API patterns for web rendering, transaction timestamps, IC view calls, custom Equivalence Principle validation, and native appeals. Local/stable runtime behavior remains unverified.

## Stage 1 evidence snapshot

- Stage 0 was preserved in commit `258549db81024468159cc45fcf329f109ce70de5` and verified on `origin/main` before Stage 1 edits.
- `contracts/case_court.py` and its 35 Direct Mode tests are local implementation evidence only. The full `tests/` run completed with 95 passed and 2 opt-in local integration checks skipped.
- Frontend lint, typecheck, 25 Vitest tests, and production build passed; governance additions are type-only and no UI write route was enabled.
- Cached GenVM lint/validation passed for all three production contracts. The installed linter could not check upstream for a newer runner due the previously observed Windows socket restriction.
- No Docker service, local chain, Studionet deployment, wallet signature, or transaction was used. Existing `manual-deployment/` remains untracked and untouched.

## Stage 2 evidence snapshot

- Stage 1 implementation is preserved on `origin/main` at `c9e2b0ee0fee12f1337630141783f73507a92095`.
- CaseCourt labels opaque caller-bound decisions `UNVERIFIED_CALLER_ASSERTION` and records accepted first challenges as immutable `FILED_UNADJUDICATED` filings. The full Direct Mode suite reports 101 passed and 2 opt-in integration skips.
- Cached GenVM lint passed for all three contracts. The PowerShell read-only RPC attempt failed locally before receiving an RPC response; no Studio or live contract call was made.
- Detailed authority, appeal and runtime status is in `V2_DECISION_AUTHORITY.md`, `V2_APPEAL_PROTOCOL.md`, `V2_RUNTIME_VERIFICATION.md`, and `V2_STAGE_2_REPORT.md`.

## Stage 3A evidence snapshot

- Stage 2 was committed as `9644d9915f1c122f326c81690a1b8959c65ae9dd`; GitHub acknowledged the normal push to `main`. An independent post-push remote SHA read was blocked by this host's GitHub socket restriction; no independent SHA match is claimed.
- The selected design is CaseCourt-owned adjudication (Architecture B) with finalized child messages reserved for later finality-dependent effects. This is a design recommendation, not an enabled production method.
- Pure Python and TypeScript case-bound schema/commitment helpers plus a shared fictional vector are **implemented and locally tested**. The Stage 3A full suite reports 119 passed/2 opt-in skips; frontend reports 39 tests passed. They are not contracts and cannot authenticate data from a chain.
- User-reported historical `eth_chainId=0xf22f` is recorded as user-provided Studionet evidence. Codex did not retry its prior blocked socket call.
- Runner mapping, two-contract runtime behavior, real validator consensus, finality, stable fee profile and Web Render remain blocked/not started. Full per-capability state is in `V2_STAGE_3A_REPORT.md` and `V2_RUNTIME_VERIFICATION.md`.

## Stage 3B evidence snapshot

- `contracts/case_court.py` now computes/stores a lock-time evidence root and provides `adjudicate_case`/`get_judgment` with bounded case-bound input, digest checks, fixed criteria, custom EP comparison, immutable record/action append and exact appeal filing commitments.
- Python helper vectors are compared to contract evidence/input/result commitments in Direct Mode. Mocked validator disagreement, LLM failures, invalid outputs, replay, freeze and appeal binding are locally exercised; this does not prove live consensus or runtime rollback.
- Frontend adds only schema and an adapter interface; no active write path. Cached GenVM lint and a documented API pattern do not resolve the stable runner mapping.
- Detailed state labels and evidence boundaries are in `V2_STAGE_3B_REPORT.md`, `V2_AI_JUDGMENT_SCHEMA.md`, `V2_EQUIVALENCE_VALIDATION.md`, and `V2_ADJUDICATION_SECURITY.md`.

## Stage 4 evidence snapshot

- **IMPLEMENTED:** bounded appeal filing/evidence/review/adjudication/resolution, exact judgment and parent-ruling binding, auto-freeze, five strict appellate outcomes, immutable filing/evidence/ruling/action records, reversal/remand/closure state transitions and two-level cap.
- **LOCALLY TESTED:** `tests/test_case_court_appeals.py` and shared Python/TypeScript commitment vectors in Direct Mode/Vitest. Results are mocked and are not real validator consensus or failed-execution rollback.
- **BLOCKED:** stable runner compatibility, actual validator disagreement and transaction rollback, Studionet network/fee/finality, cost profile, due-process policy, and liveness recovery for an indefinitely frozen appeal.
- **NOT STARTED:** live CaseCourt deployment, appeal writes, frontend appeal UX, exceptional reconsideration, case deadlines/finality anchoring, and cross-contract Registry integration.
- **LIVE VERIFIED:** no Stage 4 feature.

See `V2_STAGE_4_REPORT.md`, `V2_APPEAL_COURT_IMPLEMENTATION.md`, `V2_APPELLATE_EQUIVALENCE.md`, `V2_FREEZE_ENFORCEMENT.md`, and `V2_APPELLATE_SECURITY.md`.

## Stage 5 evidence snapshot

- **IMPLEMENTED:** append-only public source candidate versions, counterparty approval, bounded request attempts, case/appeal binding, capture verification records, source comparison, immutable commitments, and consensual withdrawal before appellate review. The Web Render method exists but is hard-disabled by a production constant.
- **LOCALLY TESTED:** Direct Mode tests patch renderer/model outputs and use mocked validator callbacks. They test contract-path logic and do not demonstrate network retrieval, consensus, or transaction rollback.
- **LOCALLY TESTED:** Python and TypeScript match seven web evidence commitment vectors, including request/verification/comparison timestamps and UTF-8 length framing.
- **BLOCKED:** stable runner identity; redirect, DNS/private-network egress and pre-read output/cost controls; actual Web Render EP; successful receipt/finality and rollback. Frontend remains read-only.
- **NOT STARTED:** live source retrieval, comparison, evidence insertion, or appeal recovery transaction.

See `V2_STAGE_5_REPORT.md`, `V2_WEB_RENDER_IMPLEMENTATION.md`, `V2_EVIDENCE_PROVENANCE.md`, `V2_SOURCE_EQUIVALENCE.md`, and `V2_FREEZE_RECOVERY.md`.

## Stage 6 evidence snapshot (2026-10-13)

- CaseCourt now has bounded contradiction challenge filing/evaluation/resolution and append-only authority relationships. The feature accepts only exact decisions stored by the same CaseCourt deployment; Registry/Evaluator cross-contract reads remain unverified and are not used.
- Direct Mode regression completed with **217 passed, 2 skipped**. The skipped cases are opt-in localnet integration tests. New contradiction/authority and diagnostic probe tests use mocked LLM/validator behavior and do not prove live consensus, transaction rollback, finality, or legal correctness.
- Cached GenVM lint/validation passed for Registry, Evaluator, CaseCourt, and the standalone Studio runtime probe. Upstream runner resolution failed with Windows `WinError 10013`; the cached runner does not establish stable Studionet compatibility.
- Frontend lint, typecheck, Vitest (**56 passed**), and production build passed. The new `/tribunal` view is fictional and read-only; locally stored/proposed relations are not chain evidence.
- No deployment, wallet signature, write transaction, Docker service, dependency installation, commit, or push occurred in Stage 6. The pre-existing `manual-deployment/` directory was left untouched.

## Stage 7A security and runtime snapshot (2026-10-13)

- **IMPLEMENTED / LOCALLY TESTED:** stale bilateral case-closure requests now bind the exact current decision ID/digest and request version; prompt builders JSON-encode untrusted appeal/contradiction grounds; pending contradiction assessment and authority-edge writes reject while either linked case is frozen or appealed.
- **LOCALLY TESTED:** full protected Python suite **220 passed, 2 skipped**; focused Stage 7 security suite **32 passed**. The two skips are opt-in localnet identity and Registry cross-contract integration. AI/Equivalence behavior remains mocked Direct Mode.
- **LOCALLY TESTED:** frontend lint, typecheck, **56 Vitest tests**, and production build passed. Cached GenVM lint/validation passed for Registry, Evaluator, CaseCourt, and the Studio probe; upstream runner lookup failed `WinError 10013`.
- **BLOCKED:** stable runner/fee compatibility, real validator disagreement/consensus, transaction rollback, transaction finality, live RPC verification, and Web Render egress/redirect/private-network/response-cap behavior. Web Render remains hard-disabled.
- **OPEN:** Registry date metadata validates shape but not calendar semantics; appeal freeze liveness/recovery and reviewer impartiality need policy/runtime review; source excerpts/scope are participant assertions; worst-case graph and storage costs are unprofiled.
- Stage 7A is **uncommitted and unpushed**. Stage 6 could not be staged or committed because the workspace Git index is read-only and the approved Stage 6 staging attempt was rejected by automatic review to prevent mixing the new CaseCourt security fix into Stage 6. No Stage 6 commit SHA or remote verification exists. The existing `manual-deployment/` tree and ignored artifacts were not modified.

See `V2_SECURITY_AUDIT.md`, `V2_PROTOCOL_INVARIANTS.md`, `V2_STUDIO_MANUAL_TEST_PLAN.md`, and `V2_STAGE_7A_REPORT.md`.

## Stage 7B acceptance state addendum (2026-10-13)

Local baseline HEAD was verified as `05fa708afa3d42ea17ba0408a107549963f6dc91`, preserving Stage 6 and 7A together. The earlier Stage 7A record that Codex staging was blocked and an escalation rejected remains historically accurate. No commit/push/deploy/transaction occurred in Stage 7B.

| # | Requirement | Stage 7B state | Evidence boundary |
|---:|---|---|---|
| 1 | Precedent registration and evidence commitments | **IMPLEMENTED; LOCALLY TESTED** | Gregorian date check added; digest still does not prove source authenticity. No live registration. |
| 2 | AI precedent evaluation | **IMPLEMENTED; LOCALLY TESTED** | Existing Direct Mode mocks; runtime/consensus blocked. |
| 3 | Case lifecycle and decision states | **IMPLEMENTED; LOCALLY TESTED** | Existing contract tests; finality anchoring blocked. |
| 4 | Appeals and appeal eligibility | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Read-only recovery diagnostic; policy and runtime liveness unresolved. |
| 5 | Enforceable decision freezes | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Appeal freeze intentionally has no unilateral recovery path. |
| 6 | AI-assisted appeal judgments | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Mocked model/validator; live result and rollback unverified. |
| 7 | Genuine GenLayer Web Render evidence retrieval | **IMPLEMENTED; BLOCKED** | Method remains disabled; runtime URL/egress/cost controls unverified. |
| 8 | Evidence locking, versioning, provenance | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Commitments tested; source authenticity/finality/runtime remain blocked. |
| 9 | Contradiction challenges | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Both-case authorization fixed/tested; evidence excerpts remain assertions; no live writes. |
| 10 | Precedent reversal and supersession | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Local graph test only; current authority/finality claims remain gated. |
| 11 | Precedent authority and decision lineage | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Bounded append-only graph; historical edge semantics and cost are not legal proof. |
| 12 | Multi-level appeals | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Two levels locally tested; independent review and native finality unresolved. |
| 13 | Deadlines and protocol case finality | **BLOCKED** | No appeal deadline or native finality anchor; app closure is not native finality. |
| 14 | Equivalence Principle and consensus-aware validation | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | Direct Mode mocks; no live validator consensus evidence. |
| 15 | Counterfactual analysis | **IMPLEMENTED; LOCALLY TESTED** | Fictional client-side hypothetical only; no contract authority. |
| 16 | DAO and AI-agent integration | **NOT STARTED** | No authorization/governance adapter or role registry. |
| 17 | Security and abuse protections | **IMPLEMENTED; LOCALLY TESTED; BLOCKED** | New fixes and tests; runtime, policy, independent review gates remain. |
| 18 | Complete frontend workflows | **PARTIAL; LOCALLY TESTED; NOT STARTED** | Read status made more honest; production case/governance UI remains disabled. |
| 19 | Real Studionet deployment verification | **BLOCKED** | No live RPC/deployment/runtime verification in Stage 7B. |
| 20 | Submission-ready documentation and demonstration | **PARTIAL; LOCALLY TESTED; BLOCKED** | Stage 7B reports added; live demonstration and finality evidence absent. |

No requirement is **LIVE VERIFIED** by Stage 7B. `V2_STAGE_7B_REPORT.md` gives the precise Python/frontend/GenVM check results and skipped/blocked distinction.

## Matrix closure rules

1. Replace `Proposed` with `Implemented` only when code exists and method/schema links are recorded.
2. Replace `—` in automated tests only when named tests cover both success and relevant adversarial/failure behavior; identify whether they are mocked, Direct Mode, local integration, or live.
3. Mark security review complete only with review report, unresolved findings and mitigations; a linter is not a security review.
4. Mark live verification complete only with stable chain ID, runner/SDK versions, deployed address, transaction IDs, finalized successful execution results, and direct readback. Do not use Studio-dev, localnet, or mocked data as Studionet evidence.
5. For features intentionally client-only (counterfactuals, graph rendering), contract column must say “not applicable by design” rather than silently omitting the requirement; frontend/security/automated/live status still must be tracked.
6. A live consensus result demonstrates protocol execution under its equivalence rule, not legal correctness.
7. A locally valid case-decision schema/helper is not an authoritative decision. Only a runtime-verified immutable Court record plus the correct successful finalized transaction can support that label.

## Stage 9 Registry call evidence overlay (2026-10-14)

This addendum supersedes earlier statements that no Registry production call or readback evidence had been supplied. Status is based on user-provided Explorer details and Studio view responses, not an independently retrieved receipt.

| Capability | Evidence | Status |
|---|---|---|
| Registry address called | User-provided Explorer page reports `To: 0xd19FfF91FaB33932A70CB9e2927159a8F103945C`; deployment transaction and source verification not supplied. | **USER-REPORTED ADDRESS; deployment provenance pending** |
| Fictional precedent registration | User-provided transaction `0xc4775a389916cf1b5a13f233bfecbc9ddd7ed3f126b1e58ca98baa6c08de6497`: FINALIZED, Accepted, GenVM SUCCESS/Return; exact call arguments in `V2_DEPLOYMENT_MANIFEST.md`. | **RUNTIME EVIDENCE REPORTED BY USER; not independently retrieved** |
| Registry persistence, keyed read, submitter and count | User reports `get_precedent` returned the expected record including sender; `has_precedent` returned `true`; `get_registration_count` returned `1`. | **RUNTIME SMOKE TEST PASSED (user-provided Studio readback)** |
| Stable Studionet identity | User confirms Studio selector showed stable Studionet, chain ID `61999` during the follow-up reads; original transaction details did not show chain ID. | **USER-CONFIRMED NETWORK; independent RPC/receipt unavailable** |
| Registry negative/rejection invariants | Duplicate/invalid write and post-rejection state readback not supplied. | **PENDING** |
| Registry deployed source/fee provenance | Deployment tx, source/bytecode match, and fee not supplied. | **PENDING** |

| Capability | Evidence | Status |
|---|---|---|
| Evaluator deployment | User-provided Studio Explorer screenshot shows address `0x6c1571C445D12ECeD90CAddE677bD0ee9694487D`; screenshot showed Accepted consensus and GenVM SUCCESS; user subsequently reports the deployment is FINALIZED. Hash remains abbreviated. | **FINALITY REPORTED BY USER; full hash/chain identity pending** |
| Evaluator AI/Equivalence behavior | No evaluation transaction or result supplied. | **NOT YET TESTED** |
