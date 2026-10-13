# PrecedentOS 2.0 — Security Audit (Stage 7A history + Stage 7B re-evaluation)

**Date:** 2026-10-13  
**Scope:** `PrecedentRegistry`, `PrecedentEvaluator`, and `CaseCourt`, including Stage 6 contradiction/authority additions and Web Evidence paths.  
**Evidence boundary:** source review, protected pytest Direct Mode tests, cached GenVM lint, and frontend tests. No contract was deployed, no transaction was sent, and no live validator execution was observed. “Locally tested” below does not mean live verified.

## Executive result

Three Stage 6 CaseCourt defects were reproduced and fixed with narrow changes:

1. A closure request could remain valid after an appeal changed the operative decision. Requests now bind the exact decision ID, digest, and case version; stale approval rejects. `test_stale_closure_request_cannot_close_a_reversed_decision` demonstrates the former failure and the corrected flow.
2. Untrusted appeal and contradiction grounds were interpolated as raw multiline prompt text. The builders now JSON-encode these strings. `test_appeal_prompt_json_encodes_hostile_multiline_grounds` and `test_contradiction_prompt_treats_hostile_grounds_as_untrusted_data` cover hostile newlines/field-looking text.
3. Contradiction assessment and authority-edge writes could proceed while a linked case was frozen or under active appeal. Both now reject that state. `test_frozen_case_blocks_pending_contradiction_assessment_and_authority_edges` verifies rejection and state preservation.

The highest remaining release blockers are native transaction finality anchoring, the exact stable Studionet runner/fee profile, actual validator disagreement and rollback behavior, and Web Render network egress controls. These cannot be discharged by this test suite.

## Finding register

| ID / severity | Affected method or boundary | Scenario and evidence | Remediation / regression | Residual risk and status |
|---|---|---|---|---|
| S7-01 — **High, release blocker** | CaseCourt `adjudicate_case`, `adjudicate_appeal`, `resolve_appeal`, closure and subsequent case transitions | Accepted `run_nondet_unsafe` result is written to CaseCourt state in that transaction. The repository has no demonstrated callback that anchors the application appeal window/state to the actual native `FINALIZED` state. Stage 3/4/6 reports and state-machine design explicitly record this gap. | Before any production CaseCourt deployment, prove an idempotent supported finalized handoff or redesign the authority/finality boundary. No code change in this audit. | A locally accepted/executed application state may be mistaken for final authority while the native transaction remains appealable. **BLOCKED; no live finality proof.** |
| S7-02 — **High, release blocker** | All contract deployment/runtime behavior | `genvm-lint` used cached artifacts after upstream runner lookup failed with Windows `WinError 10013`; cached hash is not established as stable Studionet's runner. Stable fee and runtime compatibility are not established. | Obtain authoritative stable runner/toolchain mapping, rerun validation on that runner, and profile representative operations before deployment. | Direct Mode and cached lint cannot establish stable compatibility, actual rollback, consensus, or cost. **BLOCKED.** |
| S7-03 — **High, Web Render disabled** | CaseCourt `_validate_public_source_url`, `capture_web_source`, `compare_web_sources` | The URL policy is bounded syntax/scheme validation. It cannot prove DNS resolution, redirect destinations, private/link-local address exclusion, renderer egress policy, or a response-size/time cap before renderer work. Post-render checks occur too late to cap retrieval cost. | Keep `WEB_RENDER_RUNTIME_ENABLED = False`; require exact-runner tests for redirect/DNS/private IP, response/time limits, content provenance, and fees before activation. | SSRF/private-network exposure and unbounded pre-return work are runtime-level risks. No render invocation occurred. **BLOCKED; deliberately fail-closed.** |
| S7-04 — **Medium, fixed** | CaseCourt `request_case_closure`, `approve_case_closure` | A request recorded only the requester. The opposite party could approve it after an intervening appeal changed the operative judgment. Reproduced by `test_stale_closure_request_cannot_close_a_reversed_decision` before the fix. | Closure request now binds decision ID/digest and request case version; approval validates the same current decision/version. A new request is required after a decision transition. | Direct Mode confirms local guard behavior only; runtime transaction atomicity is unverified. **FIXED / LOCALLY TESTED.** |
| S7-05 — **Medium, fixed** | CaseCourt `_build_appeal_prompt`, `_build_contradiction_prompt` | A participant could put newlines and field-like instructions in grounds, causing those bytes to look like trusted prompt structure. | Encode grounds as compact JSON string data with ASCII escaping; preserve explicit untrusted-data framing. Covered by the two hostile-ground prompt tests. | JSON delimiting reduces structural injection but cannot guarantee model immunity or independent validator correctness. **FIXED / LOCALLY TESTED.** |
| S7-06 — **Medium, fixed** | CaseCourt `evaluate_contradiction_challenge`, `record_authority_relationship` | A challenge linked to a case that became frozen/appealed could still receive an AI assessment or appended graph edge, bypassing the case-level freeze expectation. | Both writes now inspect linked cases and reject frozen/active-appeal states. Covered by `test_frozen_case_blocks_pending_contradiction_assessment_and_authority_edges`. | Freeze is CaseCourt-local. Registry/Evaluator and other contract writes are outside it. No live atomicity evidence. **FIXED / LOCALLY TESTED.** |
| S7-07 — **Medium** | Appeal lifecycle `file_appeal`, `begin_appeal_review`, `adjudicate_appeal`, `resolve_appeal`, `request_appeal_withdrawal`, `approve_appeal_withdrawal` | Appeal review depends on the opposing named participant, while native failed/nonfinal executions do not provide a demonstrated independent recovery path. An admitted appeal can freeze the case while retries or participant cooperation are unavailable. | Specify bounded retry/recovery and independent-review policy, then validate under real transaction lifecycle. No silent policy redesign was made. | Liveness and reviewer impartiality remain unresolved; two named parties do not establish legal due process. **OPEN.** |
| S7-08 — **Medium** | `file_contradiction_challenge`, `_get_authority_record`, `record_authority_relationship` | Challenge excerpts and scope are caller supplied; exact decision records are bound to the same CaseCourt, but excerpts are not proven to originate in referenced evidence. Labels can be mistaken for source authenticity or legal authority. | Keep provenance labels explicit (`PARTICIPANT_SUPPLIED_EXCERPTS_NOT_VERIFIED_SOURCE_BYTES`, `AI_PROPOSED`, etc.); require source-byte proofs before stronger claims. | AI proposals and graph edges do not authenticate law, source, jurisdiction, or truth. **OPEN / DISCLOSED.** |
| S7-09 — **Medium** | All `gl.vm.run_nondet_unsafe` paths | Direct Mode injects model results and validator callbacks; it cannot show real validator independence, common-mode errors, deterministic rejection, transaction rollback, or what trace/receipt is exposed. | Exercise controlled probe and production paths in a verified environment; record actual disagreement and failed execution lifecycle separately. | Validator consensus is not legal correctness. **BLOCKED / NOT LIVE VERIFIED.** |
| S7-10 — **Medium** | Registry `_valid_metadata` | `decision_date` is shape-checked, not validated as a Gregorian calendar date; impossible month/day values may satisfy the format. This is descriptive metadata and does not alter record identity or digest verification. | Add calendar-semantic validation in a separately reviewed Registry revision and update the manual-deployment snapshot only with explicit scope approval. No production Registry edit in this stage. | Data quality issue; not a source-authenticity proof. **OPEN / LOW IMPACT.** |
| S7-11 — **Medium** | `record_authority_relationship`, `_supersession_cycle_exists` | Traversal is bounded by a fixed edge cap, but storage and traversal are cumulative and the current cap is not fee-profiled. A full graph scan per supersession can make late operations expensive. | Measure representative worst-case calls on the selected runner; revisit index/traversal design if cost exceeds policy. | Finite source caps do not equal affordable execution. **BLOCKED pending cost profile.** |
| S7-12 — **Low/Medium** | Registry/Evaluator/CaseCourt public storage | Fixed item/byte limits constrain individual calls and sequence traversal, but total lifetime storage and validator/model work are not network-cost profiled. | Add measured cost gates and operational caps before production rollout. | Capacity limits and fee exhaustion behavior are not empirically established. **OPEN.** |
| S7-13 — **Low, trust-boundary** | All contract timestamps and frontend status labels | Contract transaction-context datetime is not a source publication timestamp. Browser/localStorage history and case closure are not native transaction finality. | Keep provenance and lifecycle labels distinct; require direct chain readback and finalized successful receipt for authority labels. | No live receipt/finality observation in this stage. **OPEN / DOCUMENTED.** |

## Contract-by-contract review

### PrecedentRegistry

- Single append-only registration path; duplicate IDs reject; record identity/digest/schema/metadata and transaction-context submitter/time are recorded. Views are deterministic keyed reads/counts.
- Digest syntax validation does **not** authenticate the underlying document: only the digest is registered. Public metadata has finite per-field limits; it is public and not a place for personal/private information.
- No delete/update path was found. Date validation checks shape rather than calendar validity (S7-10).
- Registry-to-caller reads remain unproven in runtime; no evaluator/court feature may claim a record was registry-verified solely from caller-supplied ID/digest.

### PrecedentEvaluator

- `evaluate_pair` checks identifiers, schema/criteria versions, evidence lengths and digests against exact submitted UTF-8 passages before AI. Input commitment binds ordered identities, digests, versions and criteria.
- Model output schema/enum/boolean/list bounds and internal consistency are checked. Custom EP validates decision-bearing classification/flags separately from narrative. Persisted result is written after `run_nondet_unsafe` returns; duplicate evaluation IDs reject.
- Evaluator outputs are comparative assessments, not legal rulings or source authenticity. Direct Mode mocks model and validator behavior; actual consensus and rollback remain unverified.
- No corpus-wide retrieval or unverified cross-contract read is present.

### CaseCourt

- Public writes use caller context, participant checks, phase/version checks, action/replay keys and bounded data. Evidence packet bytes are hashed against stored digests before adjudication. Judgment/appeal/contradiction outputs use explicit schemas and decision-bearing checks before append.
- Appeal/closure and authority state are CaseCourt-local. Native transaction finality is not proven by `case_closed`; graph provenance values are protocol labels, not legal authority.
- Stage 6 overlays now reject frozen/appealed linked cases for contradiction assessment and authority-edge writes; stale closure requests are invalidated by exact-decision binding.
- Web Render remains disabled; its network security and resource cost are unresolved.

## Regression evidence

- Protected Python suite: `python scripts/run_tests_safe.py tests` — **220 passed, 2 skipped** (222 collected). The two skips are opt-in localnet identity/cross-contract checks. Direct Mode AI/EP behavior is mocked.
- Focused security tests: `python scripts/run_tests_safe.py tests/test_case_court_appeals.py tests/test_case_court_contradictions_authority.py` — **32 passed**.
- GenVM lint: Registry, Evaluator, CaseCourt, and Studio probe each passed cached lint/validation. Upstream runner lookup failed with `WinError 10013`; not stable runner proof.
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test` (**56 passed**), and `npm run build` passed. These checks do not verify live chain claims.

## Stage 7B re-evaluation (additive, 2026-10-13)

The working baseline is commit `05fa708afa3d42ea17ba0408a107549963f6dc91`; this confirms that Stage 6 and Stage 7A are preserved together. It does not change the historical fact that earlier Codex staging was blocked and an escalation was rejected. The detailed S7-01–S7-13 status register is now in `V2_ADVERSARIAL_TEST_EVIDENCE.md`.

Two additional locally fixable defects were confirmed and fixed: Registry accepted impossible calendar dates despite strict date shape; and `file_contradiction_challenge` authorized a participant from the challenged case without requiring participation in the conflicting case. Regression coverage now rejects invalid dates and cross-case callers without state mutation. The read-only appeal diagnostic reports app status separately from native transaction/finality, and the frontend evaluation panel no longer equates a read with finality. Focused contradiction and Registry suites passed **50 tests**.

Current S7 dispositions: S7-01/02/03/09/11/12 **BLOCKED ON RUNTIME**; S7-04/05/06/10/13 **FIXED AND LOCALLY TESTED**; S7-07 **BLOCKED ON POLICY**; S7-08 **OPEN**. Local tests remain mocked Direct Mode and do not establish live consensus, rollback, fees, native finality, or Web Render protections. Reviewer selection/recovery policy remains disabled pending governance approval.

