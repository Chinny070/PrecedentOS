# Stage 2D — Local GenLayer Studio Integration Readiness

**Date:** 2026-10-12  
**Production target:** Stable Studionet, chain ID 61999 (not contacted)  
**Local test target:** GenLayer Studio localnet, documented default chain ID 61127  
**Verdict:** **NO-GO for running local integration transactions yet.** Docker is available and non-GenLayer resources are inventoried, but no authoritative compatible local Studio/GenVM/client matrix is established, no Studio endpoint is running, and the existing integration assertions depend on a legacy transaction receipt shape.

## Executive findings

- Docker Desktop is running and the daemon is reachable with read-only elevated access. Inventory found **zero containers, zero volumes, one unrelated image, and only the three default Docker networks**. No GenLayer images or containers are present.
- Ports 4000, 8080, and 8545 on loopback do not respond. Local Studio is not running.
- The official network docs distinguish Studionet (61999), Studio-dev (61997), and localnet (61127). These are separate environments; localnet results cannot be called Studionet verification. [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- The installed CLI is `0.40.0-rc.3`. Its local `init --help` selects localnet version `v0.65.0` by default/minimum. The CLI release page marks 0.40.0-rc.3 as a pre-release; the latest published stable release there is 0.39.2. The installed default is not, by itself, proof that the selected localnet release matches the stable Studionet runner.
- The latest published stable Studio source release visible on GitHub is `v0.121.6`; the newer `v0.123.0-rc.7` release is explicitly for Studio Next / Studio Dev, chain 61997, and states it does not promote stable Studio or Docker `latest` tags. That RC says its bundle uses GenVM `v0.6.0-rc5`. The GenVM manager release page lists `v0.6.0-rc6` as a pre-release. These are useful release facts, but none supplies the required stable-Studionet-to-localnet runner mapping for the project contracts. [Studio releases](https://github.com/genlayerlabs/genlayer-studio/releases), [GenVM manager releases](https://github.com/genlayerlabs/genvm-manager/releases), [CLI releases](https://github.com/genlayerlabs/genlayer-cli/releases)
- Existing contracts declare `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. Earlier cached lint output mentioned `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` as newer. Neither hash is mapped by an authoritative source reviewed here to the selected localnet release or stable Studionet. Do not select between them by guesswork.
- The installed Python tuple is `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, and `genvm-linter==0.11.1rc2`; Python is 3.12.10. Direct Mode regression status remains 29 Registry and 30 Evaluator tests passed; cached lint is not runtime evidence. PyPI lists `genlayer-test==0.30.0rc2` and `genlayer-py==0.19.0rc2` as pre-releases associated in the current testing docs with the Studio-dev flow. Do not install or substitute these into a stable/localnet test without a verified support matrix. [genlayer-test releases](https://pypi.org/project/genlayer-test/), [genlayer-py releases](https://pypi.org/project/genlayer-py/)

## Docker and local endpoint checks

Read-only Docker commands executed:

```powershell
docker version
docker info --format 'ServerVersion={{.ServerVersion}} OSType={{.OSType}} Architecture={{.Architecture}}'
docker ps -a --no-trunc
docker image ls --digests --no-trunc
docker volume ls
docker network ls
```

The first sandboxed Docker request could not open the Docker Engine pipe because of access restrictions. The same read-only inventory was then run with elevated access, which succeeded. Docker client/server are both 27.5.1; Docker Desktop reports 4.38.0; server is Linux/amd64.

Observed inventory:

- Containers: none.
- Images: only `ghcr.io/unionlabs/union/mpc-client:v1.2`, digest `sha256:520f686604133f6b6b5ed88f6dd44398c1cda454ac02c818fa36102fe066c78d` (image ID `sha256:ebff5edda2dd9b55d9a7d567b606d6e376caf69a8c2c3d111e26d163c5d3be90`). It is unrelated to GenLayer.
- Volumes: none.
- Networks: `bridge`, `host`, `none` only.
- Loopback ports 4000 (Studio RPC), 8080 (Studio UI), and 8545 (optional Hardhat endpoint): not reachable.

No Docker resource was started, downloaded, stopped, removed, or modified. The inventory suggests no existing GenLayer project resources, but the unrelated MPC image must remain untouched.

## Repository and reports reviewed

Reviewed `docs/STAGE_2B_INTEGRATION_PLAN.md`, `docs/STAGE_2B_RUNTIME_DISCOVERY.md`, `docs/STAGE_2B_EXECUTION_REPORT.md`, and `docs/STAGE_2C_SECURITY_REVIEW.md`, plus the prepared caller and integration test. Prior conclusions still apply: no actual cross-contract test has passed, no real evaluator validator-consensus transaction has occurred, stable-network compatibility is not established, and the Evaluator must not claim Registry verification. The Registry still stores submitter-provided document digests; the Evaluator verifies only its exact supplied passage digests.

## Candidate toolchain: verified facts and unresolved fit

| Layer | Observed / authoritative release fact | Readiness |
|---|---|---|
| Docker | Desktop 4.38.0 / Engine 27.5.1, running and reachable | Meets documented Docker 26+ floor; not sufficient to establish Studio compatibility |
| GenLayer CLI | Installed `0.40.0-rc.3`; `init --help` says localnet `v0.65.0` is default/minimum. Official releases list stable `0.39.2`, with `0.40.0-rc.3` a pre-release | Do not treat RC CLI plus localnet default as a verified stable-compatible tuple |
| Studio | Published stable tag `v0.121.6`; current later tag `v0.123.0-rc.7` is explicitly Studio-dev/chain 61997, not a stable promotion | No official source reviewed ties the local image set selected by CLI `v0.65.0` to this stable release |
| GenVM | Studio-dev RC7 says it bundles `v0.6.0-rc5`; manager lists `v0.6.0-rc6` as a pre-release | RC identifiers do not identify the stable localnet runner; exact `py-genlayer` hash still unknown |
| Contract runner pin | Contracts use `1jb45aa8...`; old cached lint named `babwp9t...` as newer | Neither verified for localnet v0.65 or stable Studionet |
| Test SDK | Installed stable `genlayer-test==0.29.2` / `genlayer-py==0.16.3`; `genlayer-test==0.30.0rc2` and `genlayer-py==0.19.0rc2` are public prereleases | Local Direct Mode compatibility is demonstrated; local Studio RPC/lifecycle compatibility is not |
| Transaction lifecycle | Current GenLayer docs describe stored status separately from execution result; `Accepted`/`Finalized` alone do not prove successful execution. Current GenLayerPY docs include `wait_for_finalization`, transaction lifecycle, and execution results such as `FINISHED_WITH_RETURN` / `FINISHED_WITH_ERROR` | Installed client and prepared tests expose an older receipt/status model; must verify or replace assertions before treating a test result as lifecycle evidence |

The official Studio setup documents Docker 26+ and the `genlayer init` / `genlayer up` flow. The CLI claims to pick the latest compatible environment, but the reviewed release notes do not provide an immutable compatibility manifest mapping CLI, localnet image tag/digests, GenVM runner pin, and `genlayer-test`/`genlayer-py`. Therefore the exact requested compatible tuple is **not established**. [Studio setup](https://github.com/genlayerlabs/genlayer-studio), [CLI setup and compatibility behavior](https://github.com/genlayerlabs/genlayer-cli), [GenLayerPY transaction API](https://docs.genlayer.com/api-references/genlayer-py/api)

## Existing integration test audit

`tests/integration/test_registry_cross_contract_view.py` is opt-in and covers separate Registry and caller deployments, existing and missing-record views, duplicate rejection, and a final state/count read. The caller uses the documented `gl.get_contract_at(address).view().method(...)` interface. That interface is officially documented, but a deployed two-contract read has not been observed. [Cross-contract view API](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts)

Local checks performed:

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTEST_ADDOPTS = '-p no:cacheprovider'
python -m pytest tests/integration/test_registry_cross_contract_view.py --collect-only -q
python -m pytest tests/integration/test_registry_cross_contract_view.py -q
```

Results: **one test collected; one skipped** because `PRECEDENTOS_RUN_LOCAL_INTEGRATION` was not set to `1`. No RPC calls or transactions occurred. Imports for `TransactionHashVariant.LATEST_FINAL` and `TransactionStatus.FINALIZED` exist in the installed SDK, and the test module collects. This does not validate deployments, cross-contract serialization, wait semantics, or receipts.

The audit found a transaction-assertion blocker. In the installed `genlayer-py==0.16.3` helper, `tx_execution_succeeded` reads the legacy leader receipt's `execution_result == "SUCCESS"`; `tx_execution_failed` is simply its negation. That can treat a missing/unknown receipt as a transaction failure. Current official transaction docs instead require checking consensus status and execution result separately and describe result values such as `FINISHED_WITH_RETURN` / `FINISHED_WITH_ERROR`. Thus the prepared duplicate test's `tx_execution_failed(duplicate)` is not yet a trustworthy current-lifecycle assertion. The older `READY_TO_FINALIZE` enum is also not the same thing as a persisted finalized status. Do not run or accept the test unchanged as lifecycle proof. [Querying transactions](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction), [transaction statuses](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses)

The `gltest` command clears its configured artifacts directory at startup. The collection/skip command output reported `Clearing artifacts directory: artifacts`. The directory exists but was empty when checked afterward; its contents immediately before the command were not inventoried, so no claim is made that prior untracked/ignored data was preserved. No recovery was attempted. Future commands below direct artifacts to a dedicated temporary path outside the repository.

## Standalone Evaluator before Registry integration

The Evaluator can and should be integration-tested independently first: it does not call `PrecedentRegistry`, and its write method uses `gl.nondet.exec_prompt` inside the Equivalence Principle. A one-contract local Studio test can prove contract loading, actual LLM execution, validator decision-field agreement/disagreement behavior, accepted structured persistence, and the runtime's execution/finality receipt semantics without relying on cross-contract reads. GenLayer's test documentation distinguishes Direct Mode (in-memory and mocked nondeterminism) from Studio Mode (RPC deployment and multi-validator behavior). [Testing Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/testing)

There is **no standalone Evaluator Studio Mode test file yet**. The existing 30 Evaluator tests are Direct Mode; they do not prove real AI execution or validator consensus. Add a separate fictional-data test first, using external test fixtures, then run the existing Registry-to-caller test after the SDK/receipt assertion path is validated. A successful Evaluator run proves only the selected localnet, not Studionet and not legal correctness.

## Git working tree audit

Read-only commands executed:

```powershell
git rev-parse --show-toplevel
git status --short --branch --untracked-files=all
git ls-files
git diff --name-status
git diff --cached --name-status
git ls-files --deleted
```

Branch is `main`, tracking `origin/main`, with no staged changes, tracked modifications, or tracked deletions. **README.md is the only tracked file in this checkout.** The following project assets are untracked and would need to be included deliberately in a later commit if they are intended to become repository history:

- Contracts: `contracts/precedent_registry.py`; `contracts/precedent_evaluator.py`.
- Experiments: `experiments/stage1b/contracts/evaluator_poc.py`; `experiments/stage1b/tests/test_evaluator_poc.py`; `experiments/stage2a/contracts/view_caller_probe.py`; `experiments/stage2a/contracts/view_source_probe.py`; `experiments/stage2a/tests/test_cross_contract_view_probe.py`.
- Unit tests: `tests/test_precedent_registry.py`; `tests/test_precedent_evaluator.py`.
- Integration artifacts: `tests/integration/contracts/registry_view_caller.py`; `tests/integration/test_registry_cross_contract_view.py`.
- Fixtures: `tests/fixtures/fictional_precedents.json`; `tests/fixtures/fictional_evaluations.json`.
- Documentation: `docs/ARCHITECTURE.md`; `docs/BUILD_PLAN.md`; `docs/STAGE_1_VERIFICATION.md`; `docs/STAGE_1B_RUNTIME_PROOF.md`; `docs/STAGE_2A_REGISTRY_REPORT.md`; `docs/STAGE_2A_RUNTIME_RECOVERY.md`; `docs/STAGE_2A_IMPLEMENTATION_REPORT.md`; `docs/STAGE_2B_INTEGRATION_PLAN.md`; `docs/STAGE_2B_RUNTIME_DISCOVERY.md`; `docs/STAGE_2B_EXECUTION_REPORT.md`; `docs/STAGE_2C_EVALUATOR_REPORT.md`; `docs/STAGE_2C_SECURITY_REVIEW.md`; and this file.
- Generated Python bytecode is also untracked under `contracts/__pycache__/` and `tests/__pycache__/`; it should be excluded from any future commit.

The checkout's Git index does not provide a tracked baseline for these untracked assets. This report does not stage or commit them.

## Recommended execution order and exact commands

### Gate 0 — compatibility confirmation (not passed)

Before startup, obtain/verify an authoritative release mapping for the selected stable local Studio/localnet release, its component image tags and digests, the exact `py-genlayer` hash accepted by that runtime, and the corresponding Python SDK/test-runner lifecycle schema. Do not equate the localnet version `v0.65.0`, Studio release `v0.121.6`, GenVM manager `v0.6.0-rc6`, or a cached lint hash as a compatible set without such evidence. Do not use Studio-dev 61997 or Studionet 61999 for this local proof.

### Gate 1 — only after Gate 0 passes and local execution is authorized

The following is a template, not authorization to run now. It uses a disposable process-local profile (for the previously documented Windows CLI profile permission issue), explicit localnet selection, and no reset flags:

```powershell
$profile = Join-Path $env:TEMP 'precedentos-genlayer-stage2d'
$env:USERPROFILE = $profile

genlayer init --headless --numValidators 3 --localnet-version <verified-localnet-version>
genlayer up --headless --numValidators 3

$body = '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
$reply = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api' `
  -ContentType 'application/json' -Body $body
$chainId = [Convert]::ToInt64($reply.result.Substring(2), 16)
if ($chainId -ne 61127) { throw "Refusing test: expected localnet 61127, observed $chainId" }
```

Do not use `--reset-db`, `--reset-validators`, or any destructive cleanup. Re-run `docker ps -a`, image, volume, and network inventories before startup and compare them afterward. This checkout has no GenLayer resources now, but retain the unrelated existing image.

### Gate 2 — standalone Evaluator first

Create a dedicated integration test with fictional public evidence and computed SHA-256 passage digests. Deploy only `contracts/precedent_evaluator.py`, submit a bounded comparison, wait for the selected SDK's verified finalized state, separately assert its execution result, and read the stored evaluation/input commitment. Include a malformed or validator-disagreement case only if the selected local Studio documents and exposes that behavior. Keep the two Direct Mode suites as regression checks; they are not substitutes.

Command after that test exists and Gate 0/1 pass:

```powershell
$env:PRECEDENTOS_RUN_LOCAL_INTEGRATION = '1'
$artifact = Join-Path $env:TEMP 'precedentos-stage2d-evaluator-artifacts'
gltest tests/integration/test_precedent_evaluator_local.py `
  --rootdir C:\Users\USERpc\Documents\PrecedentOS `
  --network localnet `
  --rpc-url http://127.0.0.1:4000/api `
  --contracts-dir . `
  --artifacts-dir $artifact -vv
```

The test should be written only after selecting the compatible transaction API; this command has not been run.

### Gate 3 — Registry-to-caller proof

Only after lifecycle assertions are corrected and the Evaluator smoke test succeeds, run the existing two-contract probe with an isolated artifacts path:

```powershell
$env:PRECEDENTOS_RUN_LOCAL_INTEGRATION = '1'
$artifact = Join-Path $env:TEMP 'precedentos-stage2d-registry-artifacts'
gltest tests/integration/test_registry_cross_contract_view.py `
  --rootdir C:\Users\USERpc\Documents\PrecedentOS `
  --network localnet `
  --rpc-url http://127.0.0.1:4000/api `
  --contracts-dir . `
  --artifacts-dir $artifact -vv -s
```

Expected evidence: distinct Registry and caller addresses; finalized successful deployment and registration; correct existing and missing view results; duplicate transaction with an explicitly decoded failed execution result; and a finalized-state read proving original record/count unchanged. Record chain ID, image tags/digests, runner hash, SDK/tool versions, transaction IDs, statuses, execution results, receipts, and traces.

The `--artifacts-dir` paths above are outside the repository because `gltest` clears that directory. Never replace `--network localnet` or loopback RPC with Studionet during this local proof.

## Blockers and recommendation

1. No exact supported stable-localnet / GenVM runner / CLI / SDK compatibility mapping was established from the reviewed official release artifacts.
2. Local Studio is absent and ports are closed; local chain ID has not been observed.
3. The current prepared cross-contract test uses a legacy transaction helper that may mistake unknown/missing execution data for failure. Its transaction assertions need to be validated against an authoritative compatible client/API before execution.
4. No standalone Evaluator Studio test exists. Add it as the first actual runtime test, independent of Registry.
5. The localnet run cannot establish stable Studionet compatibility; a later target-network check remains separate and is not authorized here.

**Verdict: NO-GO for executing the isolated local integration transactions today.** Docker readiness is no longer a blocker; toolchain/runner and transaction-lifecycle compatibility are. Do not start Studio or deploy until Gate 0 is satisfied. Then proceed Evaluator-only first, followed by the Registry-to-caller test. No services were started, no image was downloaded, no contract deployed, and no Studionet transaction sent.
