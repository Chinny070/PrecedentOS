# PrecedentOS 2.0 Feature Acceptance Matrix

This matrix carries every feature in the Stage 0 product brief across contract, frontend, automated testing, security review, and live stable Studionet verification. `Not implemented` is not an implicit future pass. Rows close only when evidence is linked in a later stage report.

## Status legend

Stage-specific evidence uses these explicit states: **IMPLEMENTED**, **LOCALLY TESTED**, **LIVE VERIFIED**, **BLOCKED**, and **NOT STARTED**. A single feature can have different states for source implementation, automated tests, runtime proof, and deployment.

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
| 2 | AI precedent evaluation | Evaluator v1 uses LLM + custom EP decision-field comparison; IDs are caller assertions. | Pair compare/result routes and adapter implemented. | Direct Mode tests mock LLM/validator; no real consensus. | Stage 2C review and existing bounds; no independent legal correctness. | **—** No live AI/validator result. |
| 3 | Case lifecycle and decision states | CaseCourt owns status, parties, version and append-only action journal; Stage 3B owns bounded AI judgment; Stage 4 adds appeal result transitions and application closure. | Typed status/read boundary; no active write control. | Stage 3B and Stage 4 Direct Mode; AI/EP mocks. | CaseCourt-local only; stable runner, actual consensus and rollback blocked. | **BLOCKED** No deployment or live reads. |
| 4 | Appeals and appeal eligibility | `file_appeal` binds exact current judgment or level-1 ruling, case/version/root, opposing party, grounds and filing commitment. Eligibility rejection reverts and is represented as a failed transaction, not an on-chain rejection record. Max two levels. | Typed appeal/ruling/read observations; writes disabled. | `test_case_court_appeals.py` Direct Mode, fictional fixtures, shared commitment vectors. | Due-process policy, deadlines, appeal liveness, source authenticity and live consensus remain blocked. | **BLOCKED** No Studio or Studionet appeal transaction. |
| 5 | Enforceable decision freezes | Appeal filing atomically freezes CaseCourt until `resolve_appeal`; generic unfreeze cannot release it. Existing one-time 24-hour discretionary challenge freeze remains separate. | Case-local phase/freeze types; no operational UI. | Automatic freeze, ordinary mutation rejection, unfreeze attacks and state preservation in Direct Mode. | Does not freeze Registry/Evaluator or other ICs; appeal consensus failure can leave a case frozen. | **BLOCKED** No deployment or freeze transaction. |
| 6 | AI-assisted appeal judgments | `adjudicate_appeal` uses bounded original/appeal evidence packets, strict outcome schema, `gl.nondet.exec_prompt` and custom decision-field Equivalence Principle checks. | Typed ruling observation and explicit `DISABLED_RUNTIME_UNVERIFIED` write gate. | Mocked Direct Mode; invalid/contradictory outputs and validator disagreement callback tested. | Real validator agreement/disagreement, rollback and legal correctness blocked. | **BLOCKED** No live AI or consensus evidence. |
| 7 | Genuine GenLayer Web Render evidence retrieval | No production render call; current Python contracts do not use Web Render. Official API is documented. | `/web-evidence` route intentionally disabled. | No render/validator runtime test. | URL, SSRF, page mutation and prompt-injection threats specified; controls unverified. | **—** |
| 8 | Evidence locking, versioning, provenance | CaseCourt lock computes an ordered evidence-reference commitment; adjudication recomputes it and hashes each supplied UTF-8 evidence item against the committed digest. Authenticity/admissibility remain unverified. | Existing evidence UI unchanged; typed judgment adapter boundary only. | Stage 3B shared Python/contract hash check plus reordered/forged evidence tests in Direct Mode. | Full text is not persisted; source truth/privacy and worst-case cost remain open. | **—** No deployment or chain read. |
| 9 | Contradiction challenges | CaseCourt accepts bounded challenge grounds, checks participant/opposing submitter and exact stored decision digest, then appends a level-1 unadjudicated appeal. It does not verify the referenced evaluator output. | Existing comparison UI preserved; no challenge UI. | Direct Mode covers supported grounds, stale reference, replay and rejected-state preservation. | Caller-supplied decision remains `UNVERIFIED_CALLER_ASSERTION`; reviewer and challenge outcome are not implemented. | **—** No live challenge. |
| 10 | Precedent reversal and supersession | No on-chain relation or reversal method. | Demo graph may contain illustrative links only. | No relation/reversal test. | Append-only relation/no overwrite rules proposed. | **—** |
| 11 | Precedent authority and decision lineage | Registry v1 lacks relations; CaseCourt relation journal proposed. | `/graph` is a demo projection over fixtures. | No authoritative lineage tests. | Misleading-authority risk identified. | **—** |
| 12 | Multi-level appeals | Two levels: level 1 targets operative judgment; level 2 may target latest resolved level-1 ruling. Total appeal filings capped at two; exceptional reconsideration omitted. | Typed level/parent/ruling shapes only. | Two-level Direct Mode flow and depth overflow locally tested. | Native transaction appeals remain distinct; reviewer/due-process rules unresolved. | **BLOCKED** No live appeal. |
| 13 | Deadlines and protocol case finality | No appeal deadlines; closure is bilateral CaseCourt state only and is not GenLayer transaction finality. | Transaction lifecycle remains separate; finality helper refuses unverified observations. | Case closure and lifecycle labels locally tested. | Finality anchor/time origin not verified; no exception/recovery deadline. | **BLOCKED** No live finality evidence. |
| 14 | Equivalence Principle and consensus-aware validation | CaseCourt uses `gl.nondet.exec_prompt(..., response_format='json')` within custom `run_nondet_unsafe`; independently compares classification, sufficiency, material issue, eligibility, rule application, outcome, criteria and uncertainty. | Typed lifecycle/read/write interface only; no active adjudication UI. | Direct Mode mocked output and validator path; decision disagreement returns false when the harness validator is run. | Cached lint passes; real consensus, disagreement rollback and legal correctness remain unverified. | **—** No live validator consensus evidence. |
| 15 | Counterfactual analysis | No contract feature; correctly off-chain/hypothetical. | `/simulate` exists with fictional browser-only scenarios. | Limited frontend tests; no legal/model validation. | Needs explicit hypothetical labeling and no authoritative writes. | **—** Not intended as chain decision. |
| 16 | DAO and AI-agent integration | No DAO/agent role registry or adapter. | Wallet integration exists; no agent workflow. | No agent authorization tests. | Address≠identity; capability authorization threat model specified. | **—** |
| 17 | Security and abuse protections | Registry/Evaluator unchanged; CaseCourt includes bounded judgment/appeal schema, root checks, participant controls, replay guards and appeal freeze. | No active governance write control. | Existing suite plus Stage 4 adversarial Direct Mode. | Stage 4 threat review; runtime rollback, cost, independent audit and fair process unresolved. | **BLOCKED** Live behavior/security unverified. |
| 18 | Complete frontend workflows | CaseCourt appeal/case closure interfaces and commitment mirrors are present; no production appeal workflow. | Type-only interfaces/helpers; `APPEAL_WRITE_GATE` keeps writes disabled. Existing visual pages preserved. | Vitest tests include cross-language vectors and finality-label gate. | UX/a11y of a future workflow remains open. | **NOT STARTED** No live governance UI. |
| 19 | Real Studionet deployment verification | Existing Registry/Evaluator and CaseCourt source exist; no deployed addresses. Official network docs specify RPC and chain 61999. | Existing wallet/network adapter; no CaseCourt write path. | Direct Mode and cached lint only. One PowerShell `eth_chainId` attempt failed locally before HTTP; prior user result `0xf22f` is user-observed. | Exact stable runner/toolchain and stable fee profile unresolved. | **—** No current RPC response or deployment. |
| 20 | Submission-ready documentation and demonstration | Stage 3B judgment code/schema implemented locally; no runtime-verified authority/finality. | Fictional demo preserved; adjudication remains disabled. | Current counts in `V2_STAGE_3B_REPORT.md`; no live end-to-end demo. | Runtime, economic and legal-policy gates remain. | **—** No verified live deployment or demo. |

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

## Matrix closure rules

1. Replace `Proposed` with `Implemented` only when code exists and method/schema links are recorded.
2. Replace `—` in automated tests only when named tests cover both success and relevant adversarial/failure behavior; identify whether they are mocked, Direct Mode, local integration, or live.
3. Mark security review complete only with review report, unresolved findings and mitigations; a linter is not a security review.
4. Mark live verification complete only with stable chain ID, runner/SDK versions, deployed address, transaction IDs, finalized successful execution results, and direct readback. Do not use Studio-dev, localnet, or mocked data as Studionet evidence.
5. For features intentionally client-only (counterfactuals, graph rendering), contract column must say “not applicable by design” rather than silently omitting the requirement; frontend/security/automated/live status still must be tracked.
6. A live consensus result demonstrates protocol execution under its equivalence rule, not legal correctness.
7. A locally valid case-decision schema/helper is not an authoritative decision. Only a runtime-verified immutable Court record plus the correct successful finalized transaction can support that label.
