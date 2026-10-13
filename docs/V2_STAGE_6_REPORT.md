# PrecedentOS 2.0 — Stage 6 Report

Date: 2026-10-13  
Stage 5 preserved baseline: `97b8a370953d37a843d63f791eec54f57f3eb628` (`origin/main` before Stage 6 work)  
Stage 6 changes: **uncommitted and unpushed by instruction**.

## Delivered

- CaseCourt-only bounded contradiction challenge filing, evidence excerpt commitments, decision-field AI assessment with custom Equivalence Principle, and append-only appeal-linked resolution.
- CaseCourt-only append-only authority relationships with exact record identity/version/commitment bindings, explicit source provenance, replay/cap/self-link checks, and bounded kind-aware supersession cycle detection. `CASE` targets are reserved for `REMANDS_TO`.
- A separate `experiments/stage6/studio_runtime_probe.py` diagnostic contract and browser guide. It is not a production contract, was not deployed, has no Web Render method, and has no claim of stable runner compatibility.
- A read-only, fictional `/tribunal` frontend fixture view with conservative authority labels. It is not a live CaseCourt adapter and does not treat browser storage or proposed relations as chain evidence.
- Root pytest artifact cleanup guard and `scripts/run_tests_safe.py`. The GenLayer Test plugin's cleanup path is redirected to a fresh, validated system-temp folder before the plugin hook can run.
- Focused design/security reports: `V2_CONTRADICTION_TRIBUNAL.md`, `V2_PRECEDENT_AUTHORITY_GRAPH.md`, `V2_REVERSAL_SUPERSESSION.md`, `V2_STUDIO_RUNTIME_PROBE.md`, and `V2_TEST_ARTIFACT_SAFETY.md`. Updated `V2_ACCEPTANCE_MATRIX.md`, `V2_IMPLEMENTATION_MASTERPLAN.md`, and this report/runtime record.

The original Registry and Evaluator source was not modified. `manual-deployment/` was observed in the working tree and deliberately left untouched. No existing generated artifacts were removed or restored.

## Stage 6 implementation boundary

Challenges accept two distinct, currently operative CaseCourt decisions from the same CaseCourt instance and chain. The contract verifies exact IDs, kinds, versions, commitments, case bindings, evidence roots, and participant permissions. Short text excerpts are supplied by the challenger and committed, but are labeled as unverified participant excerpts; they are not proven to be bytes from the stored evidence.

Scope is participant-asserted because the current case schema has no authenticated jurisdiction metadata. Different scope assertions or criteria versions deterministically distinguish and skip AI; equal assertions do not prove legal comparability. AI output can only append an assessment and a non-authoritative `AI_PROPOSED` edge. It cannot reverse or mutate a judgment. A separate resolved CaseCourt appeal is required to append an appellate reversal/supersession/remand relationship.

Registry/Evaluator cross-contract reads, whole-corpus retrieval, cross-contract graph edges, verified source provenance, stable validator consensus, actual rollback on rejected execution, transaction finality, legal correctness, Web Render execution, Studionet deployment and costs remain unverified or out of scope. `get_current_authority` explicitly reports `NOT_VERIFIED_BY_CASECOURT_VIEW` for finality.

## Test and lint evidence

Commands run:

```powershell
python scripts/run_tests_safe.py tests
```

Result: **217 passed, 2 skipped in 52.94s**. Both skips are the opt-in localnet identity/cross-contract integration tests. The full suite includes Registry/Evaluator regressions, Stage 6 CaseCourt tests, artifact-safety tests and commitment parity. Direct Mode nondeterministic calls and validator callbacks are mocked; no live consensus or chain rollback is demonstrated.

Focused Stage 6 command:

```powershell
python scripts/run_tests_safe.py tests/test_case_court_contradictions_authority.py tests/test_studio_runtime_probe.py tests/test_artifact_safety.py
```

Result: **26 passed in 8.39s**.

Cached GenVM lint commands all exited successfully with “Lint passed (3 checks)” and “Validation passed”:

```powershell
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_registry.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_evaluator.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/case_court.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check experiments/stage6/studio_runtime_probe.py
```

Registry/Evaluator each report 4 methods (3 view, 1 write); CaseCourt reports 49 methods (21 view, 28 write); the probe reports 5 methods (1 view, 4 write). The installed `genvm-linter==0.11.1rc2` could not query `genlayerlabs/genvm-manager` due Windows `WinError 10013` and used cached artifacts. Its displayed newer hash `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` is not verified as the stable Studionet runner. Lint is not runtime compatibility proof.

Frontend commands in `frontend/`:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

Results: lint passed; typecheck passed; **9 Vitest files / 56 tests passed**; production build passed (487 modules transformed). No dependency install or package change occurred.

## Artifact safety

`conftest.py` now sets a fresh, validated `%TEMP%\precedentos-gltest-*` directory before GenLayer Test's `pytest_sessionstart` cleanup hook. `scripts/run_tests_safe.py` owns the artifact path and rejects an override. The suite's six artifact-safety tests passed. Generated temp folders are intentionally preserved; do not delete them as cleanup. A historical Stage 5 report records accidental cleanup of the ignored repository `artifacts/` directory; no tracked file was affected and this Stage 6 work does not reconstruct those outputs.

## Files created or modified

Modified:

- `contracts/case_court.py`
- `frontend/src/components/RoutedWorkspace.tsx`
- `frontend/src/components/Workspace.tsx`
- `frontend/src/pages/Pages.tsx`
- `frontend/src/styles.css`
- `frontend/src/types/domain.ts`
- `docs/V2_ACCEPTANCE_MATRIX.md`
- `docs/V2_IMPLEMENTATION_MASTERPLAN.md`
- `docs/V2_RUNTIME_VERIFICATION.md`

Created:

- `conftest.py`
- `scripts/artifact_safety.py`
- `scripts/run_tests_safe.py`
- `tests/test_artifact_safety.py`
- `tests/test_case_court_contradictions_authority.py`
- `tests/test_studio_runtime_probe.py`
- `experiments/stage6/studio_runtime_probe.py`
- `frontend/src/lib/authorityStatus.ts`
- `frontend/src/lib/authorityStatus.test.ts`
- `docs/V2_CONTRADICTION_TRIBUNAL.md`
- `docs/V2_PRECEDENT_AUTHORITY_GRAPH.md`
- `docs/V2_REVERSAL_SUPERSESSION.md`
- `docs/V2_STUDIO_RUNTIME_PROBE.md`
- `docs/V2_TEST_ARTIFACT_SAFETY.md`
- `docs/V2_STAGE_6_REPORT.md`

No commit, push, deployment, wallet signature, write transaction, Docker startup, or network request was performed in Stage 6.

## Recommendation

**CONDITIONAL GO for Stage 7 security review.** The source and local regression gates pass, but Stage 7 should scrutinize the large CaseCourt addition, gas/complexity bounds, authorization/freeze interactions, and state-write behavior. Do not proceed to contract deployment or claim runtime-backed authority until the runner, integration, validator, rollback, finality, and fee gates are proven in a controlled environment.
