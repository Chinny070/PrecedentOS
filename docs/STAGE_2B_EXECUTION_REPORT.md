# Stage 2B — Controlled Local Integration Execution Report

**Date:** 2026-10-12  
**Target for this proof:** Disposable local GenLayer Studio only. No Studionet access permitted.  
**Verdict:** **NO-GO for execution** — stopped at the required runner compatibility gate.

## Summary

The prepared two-contract Studio Mode test was not executed. The available evidence does not establish that the installed prerelease CLI's default localnet image (`v0.65.0`) and a specific GenVM runner are the supported, compatible toolchain for the requested proof. The user's instruction explicitly requires stopping if this cannot be established. Docker/Studio startup, image pulls, profile initialization, deployment, and transactions were therefore not attempted.

No production contract behavior, persistent GenLayer configuration, Docker resource, or repository file other than this report was changed. No dependencies were installed or upgraded. No Studionet transaction was sent.

## Preflight review

Read `docs/STAGE_2B_INTEGRATION_PLAN.md`, including its prepared caller and integration-test description, acceptance criteria, and lifecycle caveats. The plan correctly calls for a separate Registry and caller deployment against localnet, explicit local RPC, fictional fixture data, and final-state checks after a rejected duplicate write.

The plan's local environment targets (documented defaults, not runtime observations) are:

- Local Studio RPC: `http://127.0.0.1:4000/api`
- Local Studio UI: `http://127.0.0.1:8080`
- Local Studio default chain ID: `61127`
- Stable Studionet chain ID, expressly excluded from this test: `61999`

These local values are documented defaults. Because Studio was not started, this run did **not** observe a chain ID or a responding RPC endpoint. The CLI's active network selection was also not queried or changed. The prepared command in the plan explicitly specifies `--network localnet` and the loopback RPC URL, but it was not run.

## Compatibility gate

### Locally observed

- Installed GenLayer CLI package: `0.40.0-rc.3`.
- The installed CLI source declares `localnetCompatibleVersion = "v0.65.0"` and describes that as the localnet minimum/default in its own `init` command.
- Previously recorded environment findings in `docs/STAGE_2B_INTEGRATION_PLAN.md`: `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, and `genvm-linter==0.11.1rc2`. The test package's declared dependency range includes the installed `genlayer-py`, but that only establishes package-level compatibility, not compatibility with a selected local node's protocol or transaction lifecycle.
- The contract runner hash is unresolved. The contract headers use the documentation example hash `1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`; the linter's cached lookup previously reported `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` as newer after upstream lookup failed. Neither has been tied to the chosen localnet image or authoritative stable Studionet compatibility data.

### Authoritative-source check and unresolved point

The official GenVM Manager release page available for review exposes the `v0.6.0` release candidates, including `rc6`; it did not provide a verified mapping from the installed CLI's `v0.65.0` localnet image to an exact `py-genlayer`/GenVM runner hash suitable for this run. A prerelease manager/release or a cached linter runner is not evidence of a stable-compatible exact runner. The CLI's own minimum version constant is product metadata for that CLI build, not by itself an authoritative cross-component compatibility matrix.

Relevant official material reviewed:

- [GenVM Manager releases](https://github.com/genlayerlabs/genvm-manager/releases)
- [GenLayer CLI releases](https://github.com/genlayerlabs/genlayer-cli/releases)
- [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- [Development setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup)
- [Testing Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/testing)
- [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)

The Studio/testing documentation distinguishes local Studio from hosted Studionet and describes local testing, but the reviewed material did not settle the required exact runner pin for the selected localnet release. The previous report also notes that current protocol lifecycle descriptions and the installed `genlayer-py` receipt/status helpers may differ. Thus even a local test result could not yet be interpreted safely as lifecycle evidence without checking the selected local runtime/client response schema.

**Compatibility conclusion:** Not established. Do not infer runner compatibility from the CLI's `v0.65.0` floor, a documentation sample hash, an RC release, or the linter cache.

## Docker and existing-resource impact

The pre-existing read-only environment checks recorded in `docs/STAGE_2B_INTEGRATION_PLAN.md` reported `com.docker.service` stopped, the Docker engine pipe unavailable, and ports 4000, 8080, and 8545 unreachable. A current CLI package/source check reconfirmed the installed version and `v0.65.0` constant. Docker could not be queried for containers, networks, or volumes while the daemon was unavailable; therefore an inventory of existing Docker resources was not possible.

Because the runner compatibility gate failed, Docker Desktop and Studio were not started. This avoided any possibility of affecting other Docker projects, downloading images, or creating Studio resources before the gate passed. No existing Docker resource was deleted or altered.

## Commands and outcomes

Commands previously executed and recorded in `docs/STAGE_2B_INTEGRATION_PLAN.md`:

```powershell
sc.exe query com.docker.service
# STOPPED

# TCP checks to 127.0.0.1 ports 4000, 8080, and 8545
# All unreachable

node --version
# v24.14.0

python --version
# Python 3.12.10

python -m pip show genlayer-test genlayer-py genvm-linter
# genlayer-test 0.29.2; genlayer-py 0.16.3; genvm-linter 0.11.1rc2
```

Read-only commands in this execution:

```powershell
$pkg = Get-Content "$env:APPDATA\npm\node_modules\genlayer\package.json" -Raw | ConvertFrom-Json
$pkg.version
# 0.40.0-rc.3

rg -n -m 2 "localnetCompatibleVersion|v0\.65\.0" "$env:APPDATA\npm\node_modules\genlayer"
# Installed CLI source/docs show localnetCompatibleVersion = "v0.65.0".
```

No `genlayer init`, `genlayer up`, `docker start`, image pull, `gltest`, deployment, or transaction command was executed. No integration transaction IDs, deployment addresses, receipts, or test logs exist for this attempt.

## Prepared test status

The files described in the plan remain test-only artifacts:

- `tests/integration/contracts/registry_view_caller.py`
- `tests/integration/test_registry_cross_contract_view.py`

The caller had previously passed cached GenVM lint, and the test source parsed. Those checks are not a two-contract runtime test and do not prove cross-contract calls, rollback, finality, or stable Studionet compatibility. This execution produced no additional test result.

## Remaining blockers and next action

1. Obtain an authoritative compatibility record for a local Studio/localnet image release and its exact GenVM runner hash (or a source-controlled release manifest that pins both), including confirmation the selected CLI can run it.
2. Confirm which installed client/test-runner versions understand that node's transaction status and execution-result schema. The test must distinguish submission, accepted, finalized, failed execution, and execution success as the chosen local runtime actually reports them.
3. After these are resolved, recheck Docker resources while the daemon is running **before** starting Studio. If pre-existing containers, networks, volumes, or projects could be affected, stop and obtain a scoped startup plan; do not reset or delete them.
4. Then run the already prepared integration test with explicit `--network localnet` and `http://127.0.0.1:4000/api`, verify the runtime's observed chain ID is 61127, and record transaction IDs, addresses, receipts, and final-state reads. Never use Studionet for this proof.

The user's prior authorization covers starting Docker/Studio, using a temporary process profile, fetching verified localnet images, and local test deployments; however it is conditional on passing the compatibility gate. That gate did not pass, so the authorized execution was not reached.

## Recommendation

**NO-GO for Stage 2B execution now.** The specific runner compatibility requirement is unverified. Registry-to-caller behavior, missing-record behavior, duplicate rejection in Studio, state preservation after failed transactions, and transaction finality remain unproven. Resume only after the pinned localnet/runner/client combination is verified from authoritative artifacts.
