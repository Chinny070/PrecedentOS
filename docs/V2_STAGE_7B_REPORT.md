# PrecedentOS 2.0 — Stage 7B Security Hardening and Runtime Readiness

**Date:** 2026-10-13
**Verified starting HEAD:** `05fa708afa3d42ea17ba0408a107549963f6dc91` (exact match).
**Scope:** local implementation, source review, deterministic tests, cached GenVM lint/validation, and documentation.
**Git:** no commit, push, pull, reset, or history rewrite. The only pre-existing untracked path at start was `manual-deployment/`; it was preserved and not edited. Ignored test artifacts were protected by `scripts/run_tests_safe.py` and kept in fresh system-temp directories.

## Result

Stage 7B produced two contract security fixes, a read-only appeal diagnostic, a frontend lifecycle-label correction, focused adversarial tests, and five new reports. All work remains local/uncommitted. No deployment, RPC write, transaction, wallet signature, Web Render call, dependency installation, or modification under `manual-deployment/` occurred.

### Implementation and tests

- `file_contradiction_challenge` now requires the caller to be a named participant in both distinct referenced cases, in addition to existing challenged-target submitter restrictions. A regression tests rejection without challenge/action/counter mutation, shared-party acceptance, and conflicting-case-only rejection.
- Registry `_valid_metadata` now validates actual Gregorian month/day/leap-year semantics in addition to date shape. Invalid non-leap February 29, month 13, and April 31 reject; leap-year and month-end dates pass. No API or manual deployment snapshot changed.
- `get_appeal_recovery_status(case_id, appeal_id)` is a public read-only diagnostic. It reports application appeal status, phase/version/freeze, and ruling record presence/commitment; it explicitly labels native transaction status as unavailable, finality as not verified, and unilateral recovery as unavailable. It rejects absent/mismatched case records.
- Evaluation result UI distinguishes a read-only contract record from transaction lifecycle. A localStorage-hydrated trace cannot claim finality; only a locally observed finalized lifecycle with observed timestamp can label the transaction finalized. The existing Compare page shows its result only after the client lifecycle callback reports finalized and readback succeeds.
- New documents: `V2_STAGE_7B_REPORT.md`, `V2_APPEAL_LIVENESS_AND_RECOVERY.md`, `V2_AUTHORIZATION_REVIEW.md`, `V2_ADVERSARIAL_TEST_EVIDENCE.md`, `V2_RESOURCE_AND_COST_GATES.md`.
- Updated historical/security/protocol/runtime/acceptance/masterplan/Studio manual documents. The acceptance matrix retains all 20 original product requirements and assigns status per requirement.

## Baseline and verification

Before edits: `python scripts/run_tests_safe.py tests` → **220 passed, 2 skipped** (222 collected). Both skips are opt-in localnet identity and cross-contract view integration tests.

Stage 7B focused tests: `python scripts/run_tests_safe.py tests/test_case_court_appeals.py tests/test_case_court_contradictions_authority.py tests/test_precedent_registry.py` → **69 passed**. New regressions are deterministic. GenLayer AI and validator responses remain mocked Direct Mode.

Frontend after edits:

- `npm run lint` → passed.
- `npm run typecheck` → passed.
- `npm run test` → **65 passed** across 10 files, including 9 lifecycle-label tests.
- `npm run build` → passed.
- Final frontend checks: **4 commands passed, 0 failed**; Vitest has **65 passed, 0 failed, 0 skipped**.

GenVM:

- UTF-8 process-output invocations of `genvm-lint check` passed lint (3 checks) and validation for `precedent_registry.py`, `precedent_evaluator.py`, `case_court.py`, and `experiments/stage6/studio_runtime_probe.py`.
- Each command reported that upstream runner lookup failed with `WinError 10013` and used the local cache. A newer runner identifier was printed, but it was not downloaded or selected. These checks are **cached local validation**, not stable Studionet compatibility.
- Count: **4 cached lint/validation commands passed; 4 upstream runner-resolution checks blocked by the host network restriction**. The latter are runtime-readiness blockers, not failed source lint.

Final protected Python suite after the year-zero boundary fix: `python scripts/run_tests_safe.py tests` → **230 passed, 2 skipped, 232 collected**. The skips are opt-in localnet identity and cross-contract view integration tests; they are not runtime verification. Stage 7B focused appeal/contradiction/Registry suite: **69 passed** before the additional bounded Hypothesis batch was added. Final Registry-focused check after that addition: **37 passed** before the explicit year-zero example was added. The final full-suite run above includes the year-zero regression and the bounded Hypothesis batch.

## Stage 7A finding register re-evaluation

| ID | Status | Stage 7B disposition |
|---|---|---|
| S7-01 | **BLOCKED ON RUNTIME** | No CaseCourt native finality anchor/callback demonstrated. |
| S7-02 | **BLOCKED ON RUNTIME** | Stable runner identity/fee profile unresolved; cached lint only. |
| S7-03 | **BLOCKED ON RUNTIME** | Web Render remains `False`; renderer egress, redirects, DNS/private IP, pre-return bounds/time/fees unverified. |
| S7-04 | **FIXED AND LOCALLY TESTED** | Exact decision/version closure request binding regression remains. |
| S7-05 | **FIXED AND LOCALLY TESTED** | Grounds JSON-encoded as data; does not guarantee prompt immunity. |
| S7-06 | **FIXED AND LOCALLY TESTED** | Linked-case freeze/appeal checks retained and covered. |
| S7-07 | **BLOCKED ON POLICY** | Recovery/reviewer selection changes authority; no neutral reviewer, timeout, or unilateral release enabled. |
| S7-08 | **OPEN** | Participant excerpts/scope are not authenticated against source bytes. |
| S7-09 | **BLOCKED ON RUNTIME** | Live validator independence, disagreement, rollback and transaction lifecycle absent. |
| S7-10 | **FIXED AND LOCALLY TESTED** | Gregorian date semantics added with boundary tests. |
| S7-11 | **BLOCKED ON RUNTIME** | 128-edge traversal bound is source deterministic; runner cost is unmeasured. |
| S7-12 | **BLOCKED ON RUNTIME** | Lifetime state, LLM/validator and failure/retry cost profiles absent. |
| S7-13 | **FIXED AND LOCALLY TESTED** | A contract view alone no longer displays `FINALIZED · READ BACK`; localStorage notes are untrusted. |

The authorization review found no administrative superuser. Named party addresses control writes, but addresses are not real-world identity proof. The newly found both-cases challenge authorization defect is fixed and tested. Independent reviewer governance remains **BLOCKED ON POLICY**. Cross-contract authority based on caller assertions remains prohibited.

## Appeal liveness and recovery

The appeal freeze is a CaseCourt application state and can persist indefinitely if no valid review transaction completes. Application status, native transaction status, and verified finalized successful execution are explicitly separate in the new diagnostic and docs. Existing release paths are successful appeal resolution or bilateral pre-ruling withdrawal. Duplicate/replay/version guards prevent repeated state transitions, but do not make a pending native transaction safe to duplicate. A timer, UI timeout, or local mock cannot release a freeze. Any independent reviewer, timeout, emergency withdrawal, or third-party release needs legal/governance policy and a finality anchor; the privileged transition remains disabled.

## Adversarial graph, prompt, and evidence review

Challenge identity/version/commitment checks, freeze guards, append-only records, self-link prevention and bounded supersession traversal remain. The new both-case participant guard closes the confirmed cross-case authorization gap. Existing graph edges remain historical append-only facts about a recorded relation and must not be represented as current authority or legal correctness. Their temporal currentness after later appeals needs protocol semantics before stronger status is introduced.

Prompt builders JSON-encode untrusted strings and strict validators/commitment checks remain; JSON encoding does not eliminate model prompt injection. Evidence excerpts and caller scope are still assertions, not authenticated source bytes. Web Render is disabled.

## Resource/cost status

`V2_RESOURCE_AND_COST_GATES.md` inventories source input/stored-output counts and byte/character limits, review levels, graph traversal, prompt work and Web Render gates. These are **DETERMINISTIC SOURCE BOUNDS**. No **ESTIMATED WORKLOAD ONLY**, **MEASURED ON COMPATIBLE RUNNER**, or **LIVE NETWORK VERIFIED** fee number is claimed. Runner-compatible maximum-path profiling is a release gate.

## Studio diagnostic readiness

`experiments/stage6/studio_runtime_probe.py` remains a standalone, non-production artifact; it does not mutate Registry, Evaluator, or CaseCourt. The existing probe tests and cached lint/validation are local source checks only. No browser deployment or transaction was executed. `V2_STUDIO_MANUAL_TEST_PLAN.md` explicitly separates READ-ONLY CHECKS, DEPLOYMENT REQUIRES APPROVAL, WRITE TRANSACTION REQUIRES APPROVAL, and FEE REQUIRES REVIEW. Exact stable runner, Studio compatibility, real EP/disagreement, rollback, receipt/finality and cost remain unverified.

## Release verdict

**Stage 8 integration readiness: NO-GO.** Although local code/tests improved, Stage 8 requires an approved compatible isolated runner/runtime. The runner identity and integration runtime are not established; native finality, transaction rollback, and policy for appeal recovery/reviewer independence remain blockers. Production CaseCourt deployment, real consensus claims, Web Render, unilateral recovery, live governance writes, legal authority claims, and unprofiled fee estimates remain gated. No Stage 7B work was committed or pushed.
