# PrecedentOS 2.0 — Stage 8 Report

**Date:** 2026-10-14
**Starting commit:** `05ada7f14f96a3f248d5aa8d102c8b6fc29cf9c4` on `main`
**Target:** stable Studionet `61999`
**Verdict:** **CONDITIONAL GO** for the user-operated isolated diagnostic after explicit fee/deployment approval; **NO-GO** for Stage 9 production deployment.

## Executive result

Stage 8 established meaningful local evidence: the repository remained on its verified baseline before edits; 232 protected Python tests passed with four environment/deployment checks skipped; the frontend verification passed with 66 tests after a lifecycle regression test; and all three production contracts, `StudioRuntimeProbe`, and three isolated caller test contracts passed GenVM lint/schema validation against an already cached RC9 artifact. The installed GenLayerJS source was inspected directly and its Studionet object reports chain ID `61999` and RPC `https://studio.genlayer.com/api`.

No GenLayer runtime was reachable. A read-only local identity test failed with `WinError 10061` at localnet `127.0.0.1:4000`; one bounded read-only public RPC request returned `TypeError: fetch failed`. The GenVM linter reports that a newer Python runner is available than the hash pinned by these contracts. These facts do not establish the stable Studionet runner, runtime compatibility, fee policy, validator execution, cross-contract behavior, finality, or rollback.

## Baseline audit and preservation

- `HEAD` was exactly `05ada7f14f96a3f248d5aa8d102c8b6fc29cf9c4`, branch `main`, tracking `origin/main`.
- The tracked worktree and index were clean before Stage 8. `manual-deployment/` was pre-existing untracked user work and was neither read for secrets nor staged, changed, or removed. Ignored artifacts/build outputs were preserved.
- The Registry, Evaluator, CaseCourt, Stage 6 `StudioRuntimeProbe`, Direct Mode tests, frontend, and historical reports were inspected. No production contract was modified.
- Protected test artifacts were allocated under `%LOCALAPPDATA%\Temp\precedentos-gltest-*`; the repository's existing `artifacts/` and ignored files were not cleaned.

## Installed tools and compatibility

| Item | Observed | Evidence boundary |
|---|---|---|
| GenLayer CLI | Global npm inventory `0.40.0-rc.3`; CLI network/version command did not produce output in the bounded attempt. | Package inventory only; no authenticated CLI runtime connection. |
| `genlayer-js` | Pinned/installed `1.1.8`; direct package import reports stable `studionet` chain ID `61999` and `https://studio.genlayer.com/api`. Installed declarations use `status` in `waitForTransactionReceipt`, plus `interval` and `retries`. | Source/type/config confirmed locally; public RPC unreachable. |
| `genlayer-py` | `0.16.3` | Installed distribution metadata. |
| `genlayer-test` | `0.29.2` | Installed distribution metadata; plugin defaults to localnet `http://127.0.0.1:4000/api`. |
| GenVM linter | `0.11.1rc2`; cached runner bundles `v0.6.0-rc9` and `v0.6.0-rc6`. | Local cache inventory. No runtime was launched. |
| Contract dependency header | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` on all three production contracts and the probe. | The linter validated these pinned dependencies using RC9's cached bundle but emitted `I200`: newer runner hash `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` is available. Neither is proven to match stable Studionet. |

Official current docs distinguish stable Studionet `61999` from Studio-dev `61997` and local Studio `61127`. The v0.6 migration guide associates CLI 0.40 RC with a release-candidate tool family that includes GenLayerJS 2.0 RC and Python SDK 0.19 RC. Those RC requirements must not be silently applied to stable, nor treated as evidence that installed GenLayerJS 1.1.8 and Python 0.16.3 are stable-compatible. Stable runner and fee compatibility remain unresolved. See `V2_GENVM_COMPATIBILITY_MATRIX.md`.

## Contract and schema audit

Cached `genvm-lint check` passed for:

| Contract | Schema result | Constructor |
|---|---|---|
| `PrecedentRegistry` | 4 public methods; 3 views, 1 write. Keyed reads and a six-argument nonpayable registration method were confirmed. | No arguments |
| `PrecedentEvaluator` | 4 public methods; 3 views, 1 write. The nine-argument `evaluate_pair` entry and keyed evaluation views were confirmed. | No arguments |
| `CaseCourt` | 50 public methods; 22 views, 28 writes. | No arguments |
| `StudioRuntimeProbe` | 5 public methods; 1 view, 4 writes. | No arguments |

These results establish source syntax and SDK-extracted schema only. They do not establish GenVM storage serialization, constructor behavior on Studio, contract-to-contract authorization, wire encoding on a node, transaction messages, or state semantics after a runtime failure. The isolated probe remains the only suitable first deployment candidate.

## Integration and runtime attempts

- `python scripts/run_tests_safe.py -- tests/integration/test_localnet_identity.py` with `PRECEDENTOS_RUN_LOCALNET_SMOKE=1`: failed before any transaction. Exact error: `[WinError 10061] No connection could be made because the target machine actively refused it` for `127.0.0.1:4000`. No chain ID was returned.
- One Node `fetch` JSON-RPC `eth_chainId` request to `https://studio.genlayer.com/api`, bounded with `AbortSignal.timeout(8000)`: returned exactly `TypeError: fetch failed`; no HTTP or JSON-RPC payload.
- No deployment-enabled integration test was run. `tests/integration/test_registry_cross_contract_view.py` now checks the test runner's active network name, loopback RPC URL, and actual chain ID `61127` before its first contract factory/deployment call.
- No Docker command, local service startup, deploy, wallet signature, or write transaction was issued.

The opt-in test infrastructure is prepared but not executed. It covers Registry registration and caller reads, Evaluator missing/existing keyed lookup plus mismatched digest and replay failures, and CaseCourt identity/evidence reads plus locked-state rejection, duplicate case replay, wrong-target handling, and state preservation. Evaluator and CaseCourt tests have separate environment flags because they include AI or production contract writes. Every test checks network name/loopback/chain `61127` before deployment. There is no real evidence yet for any Registry/Evaluator/CaseCourt cross-contract read, address authorization, consensus, or runtime rollback.

## AI, Equivalence Principle, and transaction lifecycle

The three production contracts use source-level custom equivalence checks; their Direct Mode suites exercise validator callbacks with mocks. The isolated probe test likewise simulates model responses and validator outcomes. **No real model response, validator vote, agreement, disagreement, consensus acceptance, or runtime persistence was observed.** Consensus would not prove legal correctness even after a real accepted execution.

GenLayerJS 1.1.8 lifecycle signatures were compared to installed declarations and source. The adapter keeps `ACCEPTED` nonfinal; only reports finalized success after a `FINALIZED` receipt plus `FINISHED_WITH_RETURN`; treats `FINISHED_WITH_ERROR` as failure; and leaves missing/unknown execution outcomes unknown. A concrete bug was fixed so an unrecognized status name no longer displays as processing. Added test covers it. These behaviors are frontend mock tests, not actual receipt/finality or rollback proof. See `V2_TRANSACTION_FINALITY_EVIDENCE.md`.

## Appeal, freeze, Web Render, and costs

- Appeal eligibility, freeze-before-resolution, unauthorized unfreeze rejection, resolution, reversal/supersession, replay defenses, and state preservation have Direct Mode coverage. They are not runtime verified. Appeal-reviewer governance, due process, recovery if adjudication never finalizes, and deadline/finality policy remain decisions/blockers; no independent reviewer, automatic timeout, or unilateral recovery mechanism was added.
- `WEB_RENDER_RUNTIME_ENABLED` remains `False`. Runtime redirect/DNS/private-IP protections, pre-retrieval size limits, egress restrictions, timeouts, validator stability, and cost limits remain unverified.
- Source bounds and automated acceptance limits are available in code. No deployment, storage, AI, validator, failed transaction, cross-contract, appeal, or graph fees/performance were measured. No fee amount or estimate is asserted.

## Frontend readiness

- `genlayer-js@1.1.8` injected-wallet/account/network and contract method APIs match the adapter's installed type signatures. The package's Studionet chain ID matches `61999`.
- Wallet account/network event invalidation, wrong-chain rejection, address/argument validation, and lifecycle branches have automated client tests. Tests use a mocked wallet/provider/client.
- Registry and Evaluator parameters were compared with cached contract schemas. Local address settings and transaction history remain browser-local configuration/notes; after reload transaction status is demoted to an unverified local note. The UI separates fictional demo results from chain readbacks and explicitly labels device timestamps.
- CaseCourt live reads/writes and Web Render are closed behind runtime gates. No active governance write path is enabled.

## Exact verification results

| Check | Command | Result |
|---|---|---|
| Protected full Python regression | `python scripts/run_tests_safe.py -- tests` | **232 passed, 4 skipped**, 236 collected; 58.02s. Skips are opt-in localnet identity, Registry/caller deployment, Evaluator AI interaction, and CaseCourt write/caller integration. |
| Frontend lint | `npm run lint` in `frontend/` | Passed, exit 0. |
| Frontend typecheck | `npm run typecheck` in `frontend/` | Passed, exit 0. |
| Frontend tests | `npm test -- --reporter=dot` in `frontend/` | Final run: **66 passed** across 10 files. |
| Frontend production build | `npm run build` in `frontend/` | Passed; Vite produced chunks; generated `dist/` remains ignored. |
| GenVM lint and schema | Seven `genvm-lint check <path> --json` commands with process-local `GENVM_VERSION=v0.6.0-rc9`, `GENVM_SOURCE_MODE=release` | All seven `ok: true`; cached artifact only; informational newer-runner warning for each. |
| Local identity smoke | `PRECEDENTOS_RUN_LOCALNET_SMOKE=1 python scripts/run_tests_safe.py -- tests/integration/test_localnet_identity.py` | Failed safely before transaction with local TCP connection refusal; no `61127` identity observed. |
| Integration preflight guard | `python scripts/run_tests_safe.py -- tests/integration/test_registry_cross_contract_view.py` | **2 passed, 3 skipped** in the full suite; remote network/RPC rejection cases passed, Registry/Evaluator/CaseCourt deployment scenarios remained skipped. |
| Stable RPC identity | One 8-second read-only `eth_chainId` POST via Node | `TypeError: fetch failed`; no response. |

## Files created or modified

Created:

- `docs/V2_STAGE_8_REPORT.md`
- `docs/V2_RUNTIME_INTEGRATION_RESULTS.md`
- `docs/V2_GENVM_COMPATIBILITY_MATRIX.md`
- `docs/V2_TRANSACTION_FINALITY_EVIDENCE.md`
- `docs/V2_STAGE_9_DEPLOYMENT_PREREQUISITES.md`
- `tests/integration/contracts/evaluator_view_caller.py`
- `tests/integration/contracts/case_court_view_caller.py`

Updated:

- `docs/V2_ACCEPTANCE_MATRIX.md` — preserves all original 20 requirements and adds the explicit Stage 8 six-state evidence overlay.
- `docs/V2_IMPLEMENTATION_MASTERPLAN.md`
- `docs/V2_RUNTIME_VERIFICATION.md`
- `docs/V2_STUDIO_MANUAL_TEST_PLAN.md`
- `frontend/src/lib/genlayer/client.ts` — unknown status mapping fails closed to `unknown`.
- `frontend/src/lib/genlayer/client.test.ts` — regression test for unrecognized status.
- `tests/integration/test_registry_cross_contract_view.py` — loopback/chain-ID preflight plus separately gated Registry, Evaluator, and CaseCourt integration scenarios.

No production contract, dependency, lockfile, global CLI profile, address, wallet setting, or backend was changed. `manual-deployment/` and ignored artifacts were excluded from Git changes.

## Readiness decision and next action

**Stage 8:** CONDITIONAL GO for the isolated `StudioRuntimeProbe` only after the user confirms the Studio screenshot/identity and separately approves the displayed deployment fee. The real local integration remains blocked because no local runtime accepts RPC at the configured endpoint.

**Stage 9 production deployment:** **NO-GO.** Before production: obtain authoritative stable runner/fee evidence, execute an approved isolated runtime probe, establish real cross-contract read behavior, verify transaction outcomes/finality and failed-write state preservation, make appeal/freeze liveness and reviewer policy decisions, and pass Web Render security gates if that feature is in scope. CaseCourt is not approved for deployment.

**First user action:** provide the network-details screenshot specified in `V2_STAGE_9_DEPLOYMENT_PREREQUISITES.md`. It must show the official Studio environment labeled Studionet and chain ID `61999`, with personal details redacted and before wallet connection. No wallet signature or deployment is implied.
