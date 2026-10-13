# Stage 7B — Adversarial Test Evidence

## Baseline and delta

- Baseline HEAD: `05fa708afa3d42ea17ba0408a107549963f6dc91`.
- Baseline protected Python suite before edits: **220 passed, 2 skipped, 222 collected**. Skips are opt-in localnet identity and cross-contract view integration tests.
- Stage 7B focused contradiction/authority and Registry suites: **50 passed** after new regressions and calendar validation.
- Tests use GenLayer Direct Mode. LLM answers and validator behavior are mocked; these results do not establish actual AI output, validator independence, transaction rollback, network behavior, or finality.

## New local regressions

1. `test_cross_case_challenge_requires_caller_to_belong_to_both_cases`: outsider to the conflicting case is rejected before append/counters; a shared participant can challenge where not the challenged judgment submitter; conflicting-case-only participant cannot act for the challenged case.
2. Registry date tests reject year `0000`, non-leap February 29, invalid month, and April 31; accept leap-year February 29 and ordinary month-end boundaries. A bounded Hypothesis batch compares generated dates against Python's Gregorian date oracle. Existing record digest/schema APIs are unchanged.
3. Appeal diagnostic test checks application status/freeze, rejects mismatched case lookup, and explicitly distinguishes unavailable native transaction status and unverified finality.
4. Frontend `recordStatus.test.ts` checks a contract-only read, submitted/pending/processing/accepted/failed/unknown states, finalized timestamp requirement, and untrusted hydrated localStorage notes.

## Existing adversarial coverage retained

The baseline tests cover malformed model JSON and inconsistent fields; hostile multiline grounds; evidence digest/order/version binding; stale IDs and commitments; duplicate/replay actions; frozen state; unauthorized caller; stale closure request; graph self-link/cycle/cap; and shared commitment vectors. Not every requested Unicode-control/prompt edge combination had a dedicated test at baseline; the Stage 7B register records the remaining coverage limitation rather than claiming exhaustive fuzzing.

## Stage 7A finding dispositions

| Finding | Stage 7B status | Evidence / residual |
|---|---|---|
| S7-01 native transaction finality anchor | **BLOCKED ON RUNTIME** | CaseCourt has no demonstrated finalized callback/read proof. |
| S7-02 stable runner and fee behavior | **BLOCKED ON RUNTIME** | Cached lint is not an identified stable runner; no fee profile. |
| S7-03 Web Render redirect/DNS/private-IP/output/time controls | **BLOCKED ON RUNTIME** | `WEB_RENDER_RUNTIME_ENABLED = False`; no render invoked. |
| S7-04 stale closure approval binding | **FIXED AND LOCALLY TESTED** | Existing exact decision/version binding and regression retained. |
| S7-05 prompt structure injection through grounds | **FIXED AND LOCALLY TESTED** | JSON string encoding plus hostile-ground tests; not prompt-injection immunity. |
| S7-06 frozen linked-case overlay writes | **FIXED AND LOCALLY TESTED** | Freeze checks and state-preservation test retained. |
| S7-07 appeal liveness/reviewer independence | **BLOCKED ON POLICY** | Read-only diagnostic added; no unilateral recovery or neutral reviewer authority. |
| S7-08 participant-supplied excerpts/source authenticity | **OPEN** | Exact record commitments are checked; excerpts/scope are not verified against source bytes. |
| S7-09 real consensus/disagreement/rollback | **BLOCKED ON RUNTIME** | Direct Mode mocks only. |
| S7-10 Registry calendar date semantics | **FIXED AND LOCALLY TESTED** | Gregorian month/day/leap-year validation with boundary tests. |
| S7-11 graph traversal economic profile | **BLOCKED ON RUNTIME** | Fixed 128-edge maximum is deterministic; fee/work profile absent. |
| S7-12 lifetime storage/model/validator cost | **BLOCKED ON RUNTIME** | Source caps documented; no measured costs. |
| S7-13 transaction/localStorage status honesty | **FIXED AND LOCALLY TESTED** | Evaluation read label now distinguishes contract record read from observed finalized lifecycle; local notes remain untrusted. |

Additional confirmed defect fixed: cross-case challenge authorization now requires participation in both referenced cases. It has focused state-preservation tests. Historical authority edges remain append-only and must not be interpreted as the current operative authority; temporal graph semantics need policy/schema review before stronger claims.
