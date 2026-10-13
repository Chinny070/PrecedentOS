# PrecedentOS 2.0 — Stage 7A Security Audit and Studio Diagnostic Readiness

**Date:** 2026-10-13  
**Target:** stable GenLayer Studionet, chain ID `61999`.  
**Stage result:** three confirmed Stage 6 CaseCourt defects fixed locally and regression-tested. Manual probe deployment is **CONDITIONAL GO for a user-operated, explicitly approved diagnostic only**. Production CaseCourt deployment is **NO-GO**. Stage 7A is uncommitted and unpushed.

## 1. Stage 6 preservation and Git state

- Starting local `HEAD`: `97b8a370953d37a843d63f791eec54f57f3eb628` (the Stage 5 baseline recorded in the Stage 6 report).
- Stage 6 report recorded its code as uncommitted/unpushed. The Stage 7A request then authorized committing only verified Stage 6 paths.
- The explicit Stage 6 `git add` failed because workspace access to `.git/index` returned `Permission denied`. An escalation request for the same explicit file set was **rejected by automatic review**: `contracts/case_court.py` now contains the Stage 7 closure-consent fix, so staging that file could mix Stage 7 work into the authorized Stage 6 set. The rejection expressly directed not to bypass it. No alternate staging or indirect Git-index path was attempted.
- **Stage 6 preservation commit SHA: none.** No commit was created, no push was attempted, and GitHub remote SHA equality is not verified. A prior read-only `git ls-remote origin refs/heads/main` attempt failed to connect to `github.com:443` (Windows socket restriction); this is not evidence of the current remote head.
- Stage 7A changes remain uncommitted/unpushed as required. The Stage 6 changes, Stage 7 fixes and new docs are visible in the local working tree. The production Registry and Evaluator sources were not modified. `manual-deployment/` was not modified. The ignored `artifacts/` directory was not cleaned, deleted or restored.

This is a preservation blocker, not a claim that Stage 6 is safely committed. The reviewed result is available in the working tree; a Git-writable environment and a clean, auditable selection of Stage 6-only changes are needed before preservation can be completed.

## 2. Audit scope and findings

Reviewed the Registry and Evaluator public methods, their validation/commitment/Equivalence Principle flows, and CaseCourt public writes/views, state transitions, append-only histories, freeze/appeal/closure logic, contradiction challenge and authority-graph paths, prompt builders, Web Evidence paths, Stage 6 probe, relevant threat/state-machine/security documents, and Stage 0–6 reports/specification materials present in the repository. `V2_STAGE_0_REPORT.md` is not present; Stage 0 requirements are captured in the product specification/masterplan and security/state design documents.

### Confirmed defects fixed

1. **Stale closure consent.** `request_case_closure` previously recorded only who requested closure. An appeal could change the operative decision before the other party approved. The request now binds the decision ID, digest and request case version; approval checks that binding. Regression: `test_stale_closure_request_cannot_close_a_reversed_decision` reproduces stale rejection, confirms unchanged state, then covers a fresh request/approval.
2. **Prompt structure injection through grounds.** Appeal and contradiction prompt builders previously inserted untrusted grounds text as raw multiline content. They now encode it as compact JSON string data. Regressions: `test_appeal_prompt_json_encodes_hostile_multiline_grounds` and `test_contradiction_prompt_treats_hostile_grounds_as_untrusted_data`.
3. **Frozen-case overlay mutation.** Contradiction assessment and authority-edge writes could proceed while linked cases were frozen or had active appeals. Both paths now reject if either linked case has that status. Regression: `test_frozen_case_blocks_pending_contradiction_assessment_and_authority_edges`.

### Remaining material risks

- **High / release blocker:** no demonstrated native transaction finality anchor for CaseCourt judgments, appeal rulings or application closure. Accepted/nonfinal contract execution is not finality.
- **High / release blocker:** exact stable Studionet GenVM runner, pinned source compatibility, fee behavior, actual validator disagreement and failed-execution rollback remain unverified. Upstream runner resolution failed with `WinError 10013`; lint used cached artifacts.
- **High / Web Render disabled:** URL checks are syntax-level; real DNS/redirect/private-network restrictions, pre-return response/time bounds, renderer egress and fee are not established. `WEB_RENDER_RUNTIME_ENABLED` remains `False`.
- **Medium:** an admitted appeal can freeze a case without a proven unilateral recovery route if review/transactions stall. The opposing named party is the reviewer; fairness policy needs review.
- **Medium:** contradiction excerpts/scope are participant supplied and not authenticated against source evidence. Graph and AI labels do not establish law or source truth.
- **Medium/low:** Registry date metadata checks format but not actual calendar validity; a follow-up Registry change would need its own review and must not silently diverge from the manual-deployment snapshot.
- **Medium:** graph traversal and total storage are finitely bounded in source but not cost-profiled on the selected stable runtime.

The full severity/fix/test/residual register is in `V2_SECURITY_AUDIT.md`; invariants and impossible/ambiguous states are in `V2_PROTOCOL_INVARIANTS.md`.

## 3. Contract and protocol invariant outcome

- **Registry:** unique append-only IDs, digest/schema/metadata checks and transaction-context submitter capture are source-enforced; stored digest syntax does not authenticate the referenced document. No edit/delete path found. Cross-contract verification remains blocked.
- **Evaluator:** exact UTF-8 passage SHA-256 checks, ordered/versioned input commitments, bounded structured result validation, decision-field Equivalence Principle checks and duplicate prevention are implemented. The write follows accepted mocked EP return in Direct Mode. This does not establish real consensus or rollback.
- **CaseCourt:** participant/phase/version/replay guards, evidence byte checks before assessment, append-only judgments/rulings/actions, two-level appeal cap, freeze enforcement, reversal/supersession history and bounded graph are locally tested. Stage 7 fixed the closure, prompt and overlay-freeze gaps named above.
- **Unresolved state constraints:** native transaction finality is separate from the application projection; appeals may strand a freeze; CaseCourt freeze is not global; source/scope assertions are not authenticated; bilateral `case_closed` is not native finality or legal res judicata.
- Existing security tests and full test suite pass locally. No claim of a complete audit or legal correctness is made; independent protocol/legal review and live-runtime evidence remain necessary.

## 4. Diagnostic probe readiness

- **File:** `experiments/stage6/studio_runtime_probe.py`
- **Class:** `StudioRuntimeProbe`
- **Constructor:** no arguments.
- **Methods:** `get_probe_state()` view; `record_transaction_context(probe_id)`; `run_ai_equivalence_probe(probe_id, fictional_input)`; `run_forced_disagreement_probe(probe_id)`; and `run_expected_failure_probe(probe_id)` writes.
- **Source checks:** Direct Mode probe tests and cached GenVM lint/validation passed. The class is separate from production CaseCourt and has no Web Render method.
- **Studio browser compatibility:** not demonstrated. Stable runner selection was not resolved; no UI deployment/read/write occurred.

The beginner procedure is in `V2_STUDIO_MANUAL_TEST_PLAN.md`. It requires the user to confirm stable Studionet `61999`, inspect fees and constructor detection, deploy only the diagnostic if they independently approve the displayed cost, begin with a read-only view, and separately decide whether to run each optional write. It instructs the user to record transaction IDs, addresses, lifecycle/receipt/validator fields and post-failure readbacks, and to stop rather than retry on ambiguous lifecycle or unexpected state changes. No private key or signature should be shared.

## 5. Exact verification evidence

Commands executed using the protected test wrapper and a fresh system-temp artifacts directory:

```powershell
python scripts/run_tests_safe.py tests/test_case_court_appeals.py tests/test_case_court_contradictions_authority.py
```

Result: **32 passed**.

```powershell
python scripts/run_tests_safe.py tests
```

Result: **220 passed, 2 skipped** (222 collected). The skips are opt-in localnet identity and cross-contract integration checks. The Direct Mode AI and Equivalence Principle paths use mocked model/validator behavior.

Cached GenVM lint/validation was run for:

```powershell
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_registry.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_evaluator.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/case_court.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check experiments/stage6/studio_runtime_probe.py
```

All four exited successfully with cached lint/validation. Upstream runner lookup failed with Windows `WinError 10013`; the cached runner hash does not establish stable Studionet runner identity.

Frontend commands in `frontend/`:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

All passed; Vitest reported **56 passed**. Production build succeeded. These are local checks only. Cross-language SHA-256/commitment vector tests are included in the Python and frontend suites.

No RPC request, deployment, transaction, wallet signature, Docker action, install/upgrade, or Web Render invocation occurred in Stage 7A.

## 6. Acceptance matrix update

`V2_ACCEPTANCE_MATRIX.md` now records Stage 7A as:

- **IMPLEMENTED / LOCALLY TESTED:** three narrow security fixes.
- **LOCALLY TESTED:** 220 Python pass / 2 opt-in integration skips, 32 focused security tests, frontend lint/typecheck/build and 56 tests, cached lint/validation.
- **BLOCKED:** stable runner/fees, live validator behavior, rollback, finality, RPC, Web Render runtime security and cost.
- **OPEN:** Registry calendar date semantics, appeal liveness/reviewer policy, participant-supplied source provenance and unprofiled resource cost.
- **Stage 6 commit/push:** no commit SHA; staging was blocked, remote head not verified.
- **Stage 7A:** uncommitted/unpushed.

`V2_IMPLEMENTATION_MASTERPLAN.md` and `V2_RUNTIME_VERIFICATION.md` include the same status and evidence boundary.

## 7. Release gates

| Gate | Pass evidence | Current status |
|---|---|---|
| 1. Diagnostic deployment compatibility | Studio accepts exact probe source on verified stable network/runner; no unexpected constructor/API mismatch | **BLOCKED / NOT STARTED** |
| 2. Persistent storage | deploy + write + readback on selected environment; repeatability recorded | **NOT STARTED** |
| 3. Caller identity | context write readback matches actual caller/origin/chain/contract fields exposed by runtime | **NOT STARTED** |
| 4. AI execution | actual runtime result from approved fictional input, with trace/lifecycle evidence | **NOT STARTED** |
| 5. Custom Equivalence Principle | actual decision-field comparison accepted with documented trace | **NOT STARTED** |
| 6. Validator disagreement | forced disagreement fails and authoritative readback proves no successful state append | **NOT STARTED** |
| 7. Transaction rollback | supported failed result and direct readback demonstrate state preservation | **NOT STARTED** |
| 8. Transaction finality | receipt/status explicitly reaches successful `FINALIZED`, distinguished from Accepted | **NOT STARTED** |
| 9. Web Render safety | real runner redirect/DNS/private-IP/size/time/egress protections verified | **BLOCKED; feature remains disabled** |
| 10. Execution costs | measured deployment and representative transaction costs within user-approved limits | **NOT STARTED** |
| 11. CaseCourt eligibility | gates 1–10 relevant to Court passed; finality anchor/recovery/security review approved | **NO-GO** |

## Verdict

**CONDITIONAL GO** for the user to consider the isolated `StudioRuntimeProbe` manual diagnostic only, after independently confirming stable Studionet `61999`, reviewing source and Studio's current fee/transaction UI, and explicitly approving each transaction. This verdict does not claim the probe is compatible before Studio accepts it, and no Codex action or transaction is authorized by this report.

**NO-GO** for production CaseCourt deployment, Web Render activation, or any claim of stable validator consensus/finality. Runner identity, fees, real EP/disagreement, rollback and finality anchoring remain blockers.

