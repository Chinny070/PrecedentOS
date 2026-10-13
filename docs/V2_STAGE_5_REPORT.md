# PrecedentOS 2.0 — Stage 5 Report

**Date:** 2026-10-13
**Network target:** stable GenLayer Studionet, chain ID 61999
**Preserved Stage 4 baseline:** `e18cd99af1aab8ccef2b2380967c57ff3e57c275` (pushed to `origin/main`). At report creation, Stage 5 was still uncommitted; the later preservation commit is recorded in `V2_STAGE_6_REPORT.md`.

## Scope delivered

Stage 5 adds the CaseCourt Web Evidence model and the first governed recovery from a stuck appeal freeze. `contracts/case_court.py` moves new case snapshots to schema 3. Existing Registry and Evaluator production contracts were not modified. The pre-existing `manual-deployment/` directory remains untracked and was not edited, staged, committed, or packaged.

### Contract behavior

- Public HTTPS URL candidates have bounded, canonical ASCII syntax checks. Candidate records are append-only, versioned, case- or appeal-bound, and committed to the contract/case/source/evidence identities. A counterparty approval is required before a capture request.
- Capture requests are bounded to three attempts per source version. Retrieval requests are checked against the stored registration and request identity before use or readback. The capture action verifies source identity, URL digest and source commitment. View results verify commitments before returning them.
- The documented `gl.nondet.web.render(url, mode="text")` + `gl.nondet.exec_prompt(..., response_format="json")` path is implemented with strict output bounds, exact-substring excerpt validation, content hashing, drift labels, and custom EP checks. A production constant, `WEB_RENDER_RUNTIME_ENABLED = False`, rejects this path before it makes a render call or mutates state.
- Successful capture records bind a content digest and excerpt commitment to the exact case or active appeal evidence slot. Caller-reported unavailable is stored with `PARTICIPANT_REPORT_NOT_WEB_RENDER_PROOF`; it is not represented as a failed runtime fetch.
- Source comparisons use committed sufficient observations with the same case/appeal binding. Custom Equivalence checks relation, conflict bit, sufficiency and conflict-pair indexes. Distinct content digests remain distinct even when model summaries sound alike.
- An appeal appellant can request withdrawal while appeal review has not started. The other party must approve in a separate action before the appeal freeze is released. Withdrawal cannot follow review/adjudication, cannot overwrite a ruling, and preserves appeal/filling/action history. Ordinary `unfreeze_case` remains unable to release an appeal freeze.

### Evidence and UI

Python helpers and TypeScript browser helpers mirror source registration, retrieval request, capture-input, excerpt, verification, comparison-input and comparison-result SHA-256 commitments. The shared vector fixture fixes these seven cross-language values. Retrieval, verification and comparison timestamps are included in their respective commitment chain. Frontend domain types cover the new read shapes; `/web-evidence` now explains source approval, provenance, capture-only freshness and mutual withdrawal while showing no fetched content or live result. No production write adapter or write button is enabled.

## Verification

Targeted Stage 5 test command:

```powershell
$tempArtifacts = Join-Path $env:TEMP 'precedentos-stage5-pytest-targeted'
python -m pytest -q --artifacts-dir $tempArtifacts tests/test_case_court_web_evidence.py tests/test_web_evidence_commitments.py
```

Result after fixes: **32 passed**. These tests use GenLayer Direct Mode; render/model/validator behavior is mocked. A mismatched source-comparison decision field returns `False` from the Direct Mode callback; this is not proof of chain rejection or rollback. The tests do not prove GenVM networking, real validator consensus, or Studionet execution.

Full contract/regression command:

```powershell
$tempArtifacts = Join-Path $env:TEMP 'precedentos-stage5-full-pytest'
python -m pytest -q --artifacts-dir $tempArtifacts tests
```

This exact `tests/` command is the full production regression suite; localnet/Studio integration probes are intentionally outside it. The Stage 5 regression run reported **191 passed, 2 skipped in 54.63s**; the skips are opt-in integration tests. During subsequent Stage 6 preparation, six additional artifact-path guard tests were added and the same full suite reported **197 passed, 2 skipped in 43.93s**. Both runs used a unique `%TEMP%` artifact path. A separate exploratory repository-wide `pytest -q` discovered `experiments/stage2a/tests/test_cross_contract_view_probe.py`; it failed because GenLayer Direct Mode permits only one `Contract` subclass in the process. The other observed failure was a stale Stage 4 assertion expecting schema 2; it was corrected to expect the Stage 5 schema 3. No cross-contract runtime success is claimed.

Frontend commands:

```powershell
npm run lint
npm run typecheck
npm test
$outDir = Join-Path $env:TEMP 'precedentos-stage5-frontend-dist'
npm run build -- --outDir $outDir
```

Observed: lint and typecheck passed; **51 frontend tests passed** across 8 files; production build passed (486 modules, output outside the repository; Vite emitted its expected external-outDir warning).

GenVM cached-artifact checks:

```powershell
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/case_court.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_registry.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_evaluator.py
```

All three passed 3 lint checks and validation. CaseCourt reports 41 methods (17 view, 24 write). The linter could not query upstream due Windows `WinError 10013` and used cached artifacts; cached lint is not proof of stable-runner compatibility.

## API and runtime evidence

Official docs currently show `gl.nondet.web.render(url, mode='html')`, `mode='text'`, and the `wait_after_loaded` option in the FetchWebContent example; they also state that leaders and validators make independent requests and that changing web data can cause different results. The non-determinism and Equivalence Principle docs describe independent validator comparison. See [Web Access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access), [FetchWebContent](https://docs.genlayer.com/developers/intelligent-contracts/examples/fetch-web-content), [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism), and [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle).

Those sources verify the documented call patterns, not the installed stable Studionet runner’s egress, redirect, destination-IP restrictions, response-size cap before contract execution, cost, or compatibility. No Web Render request, network transaction, wallet signature, deployment, Docker start, or Studionet access was performed.

## State matrix

| Capability | Status | Evidence boundary |
|---|---|---|
| Source registration, versioning and candidate commitment | **IMPLEMENTED / LOCALLY TESTED** | Direct Mode only; no live state. |
| Case / appeal binding and counterparty approval | **IMPLEMENTED / LOCALLY TESTED** | Fictional tests and mocked Direct Mode. |
| Web Render API call and extraction path | **IMPLEMENTED / BLOCKED** | API pattern documented; production flag false; no actual renderer invocation. |
| Capture content/excerpt commitments and source drift | **IMPLEMENTED / LOCALLY TESTED** | Patched renderer fixture, not a network fetch. |
| Custom source comparison equivalence | **IMPLEMENTED / LOCALLY TESTED** | Mocked LLM and Direct Mode validator callback. |
| Mutual appeal withdrawal and freeze recovery | **IMPLEMENTED / LOCALLY TESTED** | Direct Mode checks unauthorized bypass and no post-ruling withdrawal. |
| Browser UI and read types | **IMPLEMENTED / LOCALLY TESTED** | No live reads or writes. |
| Stable runner / web egress / transaction rollback and finality | **BLOCKED** | Not established locally or on network. |
| Live Web Render, Studionet capture, real validator result | **NOT STARTED** | No deployment or transaction. |

## Test-runner side effect

An initial targeted test invocation passed an incorrect pytest environment option. GenLayer Test therefore used its default `artifacts/` path and cleared that ignored generated-artifact directory at session start. No tracked files were affected; no recovery or destructive cleanup was attempted. Subsequent Python commands use the plugin’s verified `--artifacts-dir` option pointing to `%TEMP%`. `manual-deployment/` was not affected.

## Verdict

**CONDITIONAL GO for Stage 6 work limited to offline/local review and runner/egress verification. NO-GO for enabling live Web Render, deploying these CaseCourt changes, or treating any record as a finalized source verification.** A live capture gate requires target-runner compatibility, destination and redirect policy, renderer-level output/cost bounds, consensus/failure behavior, and finalized receipt proof.
