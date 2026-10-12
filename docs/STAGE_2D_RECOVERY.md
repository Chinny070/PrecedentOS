# Stage 2D-R: Preserve Work and Prepare Local Runtime Smoke Test

**Project:** PrecedentOS  
**Production target:** GenLayer stable Studionet, chain ID `61999`  
**Local test target:** GenLayer localnet, expected chain ID `61127`  
**Scope:** repository preservation and opt-in, read-only local RPC identity check. No localnet startup, deployment, write transaction, package installation, or production contract edit was performed.

## Repository preservation

At review time, `main` pointed to `9fed94a` and tracked only `README.md`. The production Registry and Evaluator, 59 direct tests, fictional fixtures, experiments, and Stage 1–2D reports were present as untracked files. Python bytecode and `.pytest_cache` contents were also present. The root `artifacts/` directory was empty during this inventory. Because gltest may clear its artifacts directory, generated artifacts and caches are excluded from Git.

A filename inventory of the entire working tree (excluding `.git`) was reviewed. A content scan reported no matches for common private-key blocks, wallet/API token formats, AWS access-key formats, or quoted credential assignments. The scan is a screening aid, not proof that a file contains no secrets; the staged diff and exact staged file list must still be reviewed before committing. SHA-256 fixture digests are expected public fictional test data.

`.gitignore` excludes Python caches, pytest/tool caches, generated artifacts, local environment/configuration files, credential and wallet material, and build outputs. It preserves `.env.example`, `.env.template`, and `gltest.config.example.yaml` templates if added later. The test artifact path is intentionally kept outside the repository.

## Docker and local environment observations

Read-only inventory was run with the user's authorization:

- Docker client and server: `27.5.1` / `27.5.1`.
- Containers: none.
- Images: one unrelated image, `ghcr.io/unionlabs/union/mpc-client:v1.2`, digest `sha256:520f686604133f6b6b5ed88f6dd44398c1cda454ac02c818fa36102fe066c78d`.
- Volumes: none.
- Networks: only `bridge`, `host`, and `none`.
- Local Studio endpoints: `127.0.0.1:4000` and `127.0.0.1:8080` did not respond.

No Docker resources were started, downloaded, stopped, removed, or modified. Do not remove the unrelated image. Re-inventory immediately before any separately approved startup.

## Localnet version selection and compatibility limits

The GenLayer CLI documentation says it selects the latest compatible environment by default and supports pinning `--localnet-version`. Its published command interface includes `genlayer init --localnet-version <version>` and `genlayer up`. The CLI currently installed on this machine is reported by earlier local inspection as `0.40.0-rc.3`; its `init --help` selects localnet `v0.65.0` by default/minimum. Therefore **`v0.65.0` is the proposed localnet release for a local smoke-test attempt through this CLI**, not a claim that the CLI/Studio/GenVM/SDK tuple is stable or that it matches Studionet.

Current official GenLayer setup documentation gives the local Studio RPC as `http://localhost:4000/api`, the Studio UI as `http://localhost:8080/`, and localnet chain ID `61127`. It distinguishes this from stable Studionet chain ID `61999`. The CLI documentation says it uses the latest compatible environment and allows an explicit localnet pin. These are sufficient to prepare a localnet identity smoke attempt; **exact Studionet runner equivalence is not a prerequisite for that attempt**. A successful localnet response still proves only localnet behavior.

Known risks and checks still needed before contract integration:

- CLI `0.40.0-rc.3` is a release candidate, not a stable CLI release.
- `genlayer` invocation in this environment fails during config initialization with `EPERM` on `C:\Users\USERpc\.genlayer`; no permission/configuration changes were made.
- Docker daemon connectivity works only in the elevated read-only invocation used for the inventory. No service startup was attempted.
- Installed Python packages are `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, and `genvm-linter==0.11.1rc2`. The localnet JSON-RPC identity smoke below uses Python stdlib plus pytest; it does not validate those SDKs or the contract runner.
- The contract `py-genlayer` header hashes and cached lint hashes have not been authoritatively mapped to `v0.65.0` or to stable Studionet. This does not block a chain-ID-only RPC smoke, but it remains a gate before interpreting contract execution results.
- Official documentation/release references reviewed: [GenLayer tooling setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup), [GenLayer CLI](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-cli), [network configuration and chain IDs](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [CLI source and release interface](https://github.com/genlayerlabs/genlayer-cli).

## Opt-in read-only smoke test

Added `tests/integration/test_localnet_identity.py`. It defaults to skipped. When explicitly enabled, it accepts only a loopback HTTP URL, sends one JSON-RPC `eth_chainId` read request, validates the JSON-RPC response, and requires chain ID `61127`. It contains no deployment/write call and exits before testing any contract. A wrong chain ID or non-loopback URL fails before any later step can be considered.

PowerShell command after a separately authorized localnet startup:

```powershell
$env:PRECEDENTOS_RUN_LOCALNET_SMOKE = '1'
$env:PRECEDENTOS_LOCALNET_RPC_URL = 'http://127.0.0.1:4000/api'
$artifactDir = Join-Path $env:TEMP 'PrecedentOS-gltest-artifacts'
gltest tests/integration/test_localnet_identity.py `
  --network localnet `
  --rpc-url $env:PRECEDENTOS_LOCALNET_RPC_URL `
  --artifacts-dir $artifactDir `
  -q
Remove-Item Env:PRECEDENTOS_RUN_LOCALNET_SMOKE
Remove-Item Env:PRECEDENTOS_LOCALNET_RPC_URL
```

The artifact directory is outside the checkout because the testing harness may clean its artifact directory. A safe, no-network opt-in check is:

```powershell
Remove-Item Env:PRECEDENTOS_RUN_LOCALNET_SMOKE -ErrorAction SilentlyContinue
$artifactDir = Join-Path $env:TEMP 'PrecedentOS-gltest-artifacts'
gltest tests/integration/test_localnet_identity.py --network localnet --artifacts-dir $artifactDir -q
```

Expected result is one skipped test. This does not demonstrate a running localnet.

## Controlled startup and rollback notes

Startup is deliberately not included in this stage. If separately authorized, use the official CLI's documented flow, pinning the proposed environment and avoiding reset flags:

```powershell
genlayer init --headless --numValidators 3 --localnet-version v0.65.0
genlayer up --headless --numValidators 3
```

Before startup, inspect the CLI's resolved config path and the CLI profile failure. Do not overwrite the existing `C:\Users\USERpc\.genlayer` configuration or weaken its permissions. If an isolated process-local profile cannot be established safely, stop and request a different approved setup. Re-run read-only Docker inventory and verify no unexpected GenLayer services are already running. After startup, run only the identity smoke. Do not deploy contracts or send writes in that step.

Rollback means stopping only the GenLayer localnet services started for this isolated attempt using the supported `genlayer stop` command after verifying the selected process/profile. Do not use `--reset-db`, `--reset-validators`, `docker compose down`, volume deletion, image pruning, or broad Docker cleanup. Preserve all Docker resources and the temporary CLI profile unless their exact ownership is clear and separately authorized.

## Test and Git record

- Prior project regression result reported by Stage 2C-R: **59 Direct Mode tests passed** (29 Registry, 30 Evaluator); cached GenVM lint passed for both. This is not live consensus, localnet integration, or Studionet evidence.
- The new smoke's default/disabled path is expected to skip; it must not contact RPC. The active path has not been run because localnet is not running and service startup was prohibited.
- Docker inventory was read-only and completed. CLI invocation reproduced the existing `.genlayer` `EPERM` error. No dependency versions were changed.
- The initial read-only `git ls-remote` check could not reach `github.com:443` in this execution environment. The repository remote is configured as `https://github.com/Chinny070/PrecedentOS.git`. A push must remain conditional on a successful fresh remote-tip check and normal fast-forward push.

## Recommendation

**CONDITIONAL GO for a future localnet identity smoke only**, once localnet startup is separately authorized and can be isolated without changing persistent GenLayer configuration. The proposed CLI-managed localnet version is `v0.65.0`; exact Studionet runner equivalence is intentionally not required for this narrow smoke. The contract-integration gate remains closed until the local endpoint reports chain ID `61127`, SDK/runner compatibility is reviewed, and the tests' transaction lifecycle assertions are checked against that runtime. No localnet services, deployments, or write transactions occurred here.
