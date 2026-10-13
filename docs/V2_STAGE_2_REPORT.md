# PrecedentOS 2.0 — Stage 2 Governance Integration, Appeals and Runtime Report

**Date:** 2026-10-13
**Stage 1 preservation:** pushed commit `c9e2b0ee0fee12f1337630141783f73507a92095`; `git ls-remote origin refs/heads/main` returned the same SHA.
**Stage 2 status:** safe appeal schema and authority labels implemented locally. Cross-contract authoritative verification, case deadlines/finality, native runtime integration and legal merits adjudication remain blocked. Stage 2 changes are uncommitted and unpushed, as requested.

## 1. Stage 1 preservation and baseline

The full `tests/` suite was rerun before the commit using a temporary artifacts directory: **95 passed, 2 skipped**. The two skips were opt-in local Studio/identity tests. The only untracked item outside the Stage 1 selection was the pre-existing `manual-deployment/`; it was not modified or staged. Stage 1 commit includes exactly seven intended files: CaseCourt, its tests/fictional fixture, type-only frontend definitions, Stage 1 report and acceptance-matrix update.

## 2. Stage 2 implementation

### Decision authenticity

- `CaseCourt.get_case` now exposes `decision_authority = UNVERIFIED_CALLER_ASSERTION` for every caller-bound reference. The contract assigns this label itself; callers cannot submit an authority label.
- Existing `attach_decision_reference` remains compatible, but it still only stores a participant-supplied ID/digest. Participant control and digest syntax do not prove an Evaluation exists or fits the case evidence.
- `challenge_decision` rejects a digest that differs from the stored reference; it does not establish the referenced contract or evidence.
- Added Direct Mode coverage for an arbitrary/missing evaluation reference remaining explicitly unverified, outsider binding rejection, stale/mismatched challenge digest rejection, replay protection and state preservation.
- `PrecedentRegistry` and `PrecedentEvaluator` were not changed.

### Appeal filing

- Kept the existing `challenge_decision` method signature for compatibility.
- An accepted first-level challenge now writes a separate immutable appeal record; `get_appeal(appeal_id)` returns the versioned record.
- Schema fields include appeal ID, case ID, schema version, level 1, parent ID, `FILED_UNADJUDICATED`, appellant, bound decision ID/digest, grounds code/digest, an optional new-evidence commitment, and deterministic transaction datetime.
- Existing guards enforce party eligibility, one challenge per decision state, expected case version, supported grounds, digest format, action ID replay protection and freeze handling.
- A `NEW_EVIDENCE` grounds digest is stored as a caller-supplied commitment only. The contract has no evidence bytes and cannot validate that commitment or its novelty.
- No appeal deadline, admission decision, reviewer, bond, AI adjudication, higher-level appeal, outcome or case-final state was implemented. No frontend route/write adapter was enabled.

### Full protocol design

`docs/V2_APPEAL_PROTOCOL.md` defines a proposed 7-day window measured from a verified finalized case decision (pending due-process review), three ordinary levels plus a narrow exceptional reconsideration, grounds, new evidence, optional emergency freezes, admission, outcomes (`UPHOLD`, `REVERSE`, `REMAND`, `DISMISS`), immutable lineage and closure. It separates case appeals from GenLayer's native protocol appeal and does not enable either an unverified bond or an unverified timer.

## 3. Cross-contract capability and blocker

Current official docs specify:

- synchronous `gl.get_contract_at(address).view().method()` calls to read another IC's state;
- asynchronous internal write messages through `.emit(on='accepted'|'finalized')`;
- `sender_address` on a child message is the calling contract and `origin_address` preserves the initiating account.

These official documented patterns support a future integration design, but no local Studio/runtime execution was available and no two-contract test passed in this stage. More importantly, the existing Evaluator is a pairwise precedent comparator and has no `case_id` or locked CaseCourt evidence-root field. A view call to `get_evaluation` alone cannot prove the evaluation decides this particular case. A case-bound decision record and immutable trusted Registry/Evaluator addresses are prerequisites. The exact current stable runner and contract identity check remain unresolved. The detailed authority model is in `docs/V2_DECISION_AUTHORITY.md`.

## 4. Runtime verification

Official current network docs list Studionet as `https://studio.genlayer.com/api`, chain ID `61999`, and distinguish Studio-dev `61997` and localnet `61127`.

One bounded, read-only Windows PowerShell `eth_chainId` request was attempted against the official Studionet URL with an 8-second timeout. It failed before receiving an HTTP response with:

`System.Net.Http.HttpRequestException: An attempt was made to access a socket in a way forbidden by its access permissions. (studio.genlayer.com:443)`

This is a local socket permission restriction, not evidence that the endpoint is down. The user's prior ordinary Windows result `0xf22f` is recorded only as a user-provided earlier observation. The exact reproducible command and a safe next step are in `docs/V2_RUNTIME_VERIFICATION.md`.

Locally observed packages remain Python 3.12.10, `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, `genvm-linter==0.11.1rc2`, global CLI package `0.40.0-rc.3`, and frontend `genlayer-js==1.1.8`. The contracts pin `py-genlayer:1jb45...`. The linter's cached newer runner is `babwp9...`; upstream version resolution failed with WinError 10013. No official stable Studionet release mapping was found for either runner hash. Official current migration docs associate CLI 0.40 RC / JS 2.0 RC / Python 0.19 RC with the Consensus v0.6 Studio-dev release candidate; that does not establish compatibility with this project's JS 1.1.8 or stable Studionet.

The protocol docs describe deterministic transaction timestamps, native appeals, finalization, Web Render and fee profiling. No current transaction receipt, live fee quote, validator consensus, Web Render result, deployment, or finality callback was observed. Web Render stays disabled.

## 5. Tests and verification

### Contract tests

Command:

```powershell
python -m pytest tests/ -q --rootdir=. --artifacts-dir C:\Users\USERpc\AppData\Local\Temp\precedentos-stage2-check\artifacts
```

Final result after Stage 2 code: **101 passed, 2 skipped**. `tests/test_case_court.py` collected 41 cases. Skips are opt-in local Studio/identity checks; neither cross-contract execution nor real validator behavior was exercised.

### GenVM lint

The linter CLI accepts one contract path per invocation. An initial multi-path call was rejected as invalid usage. Single-file invocations initially hit a Windows cp1252 Unicode-output exception after linting because the process could not print the check mark. With process-local `PYTHONIOENCODING=utf-8`, these commands completed:

```powershell
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_registry.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_evaluator.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/case_court.py
```

All three reported `Lint passed (3 checks)` and `Validation passed`. Every invocation warned that upstream runner resolution failed (`WinError 10013`) and used the local cache. This is cached-artifact lint, not proof of the current Studionet runner.

### Frontend checks

The Stage 2 frontend changes are type-only; no UI page, runtime adapter, or write path was introduced.

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — 4 test files, **25 passed**.
- `npm run build -- --outDir C:/Users/USERpc/AppData/Local/Temp/precedentos-stage2/frontend-dist` — passed; 486 modules transformed. Build output was written outside the repository.

## 6. Security review

- No Registry or Evaluator source/interface was modified.
- Decision records cannot be misreported as verified by these code paths; the authority label is contract-generated and explicit.
- Forged reference IDs can still be stored as assertions by case participants. That limitation is visible, tested and addressed by the gated algorithm in `V2_DECISION_AUTHORITY.md`.
- Appeal IDs and action IDs are replay-protected. Appeal history has no update/delete method.
- A grounds digest is not evidence authentication. Full documents, private evidence and personal information remain outside contract state.
- CaseCourt's existing optional freeze is case-local, does not gate other contracts, and is not linked to case appeal admission or native transaction finality.
- Direct Mode tests/lint do not prove live validator agreement, legal correctness, runtime economics, trusted contract code, or finality.

## 7. Files changed in Stage 2

- Modified: `contracts/case_court.py`, `tests/test_case_court.py`, `frontend/src/types/domain.ts`, `frontend/src/lib/genlayer/caseCourtTypes.ts`, `docs/V2_ACCEPTANCE_MATRIX.md`, `docs/V2_IMPLEMENTATION_MASTERPLAN.md`, and `docs/V2_STAGE_1_REPORT.md` (preservation status only).
- Created: `docs/V2_APPEAL_PROTOCOL.md`, `docs/V2_DECISION_AUTHORITY.md`, `docs/V2_RUNTIME_VERIFICATION.md`, `docs/V2_STAGE_2_REPORT.md`.
- Not modified: `contracts/precedent_registry.py`, `contracts/precedent_evaluator.py`, existing Registry/Evaluator tests and fixtures, existing frontend page behavior, `manual-deployment/`, or Stage 0/Stage 1 Git history.
- Stage 2 work remains local, uncommitted and unpushed.

## 8. Acceptance/status summary

| Requirement group | Status |
|---|---|
| Preserve/push Stage 1 and verify SHA | **Implemented / locally verified / remotely verified** — SHA `c9e2b0ee0fee12f1337630141783f73507a92095`. |
| Decision caller reference labeling and replay guards | **Implemented / tested locally** — still not authoritative. |
| Registry/Evaluator cross-contract reads | **Documented / blocked** — no two-contract runtime execution; Evaluator is not case-bound. |
| First-level appeal schema/history | **Implemented / tested locally** — filed and unadjudicated only. |
| Complete appeal workflow, finality, deadlines, multi-level outcomes | **Designed / blocked or not started** — requires policy and runtime gates. |
| Stable network/toolchain/runner/fee verification | **Partially documentation-verified / blocked** — no RPC response or authoritative runner mapping. |
| Web Render and live EP consensus | **Documented / not started** — disabled; no runtime result. |

Detailed row-level states are updated in `docs/V2_ACCEPTANCE_MATRIX.md`.

## 9. Recommendation

**CONDITIONAL GO for Stage 3 only if its scope stays limited to deterministic, non-authoritative schema/UX or a supported local integration environment. NO-GO for trusted decision linking, deadline enforcement, appeal merits, Web Render, or production governance until the runner, two-contract views, case-bound decision schema, and finality callback are demonstrated.** No deployment, write transaction, Docker startup, wallet signature, package installation, commit or push occurred for Stage 2.
