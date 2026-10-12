# Stage 2B-R — Local Runtime Discovery and Compatibility Test

**Date:** 2026-10-12  
**Local test target:** GenLayer Studio localnet (documented default chain ID 61127)  
**Deployment target:** Studionet (chain ID 61999; not used)  
**Result:** Docker/Studio did not start. No integration transactions were sent.  
**Recommendation:** **NO-GO for PrecedentEvaluator implementation that depends on verified cross-contract Registry reads** until a two-contract Studio test passes.

## Summary

The revised compatibility procedure allowed startup to be attempted even though the exact local GenVM runner was not known in advance. The installed GenLayer CLI is `0.40.0-rc.3`; its source declares localnet image version `v0.65.0` as its minimum/default. Official GenLayer network documentation identifies localnet's default endpoint as `http://localhost:4000/api` and chain ID `61127`.

Docker was stopped and the engine pipe unavailable. Docker Desktop was launched without elevation; service start was then attempted normally and through the approved elevated execution path. The service could not be opened/started (`Cannot open 'com.docker.service' service`), and the engine remained unavailable. Thus existing resources could not be inspected, Studio could not be initialized, and local chain identity could not be observed. No image was downloaded, temporary GenLayer CLI profile initialized, or test transaction submitted.

No existing Docker resource, credential, or production contract was modified. No dependencies were installed/upgraded. No Studionet or other public network transaction was sent.

## Versions and compatibility

| Component | Observed value | Evidence / limitation |
|---|---|---|
| GenLayer CLI | `0.40.0-rc.3` | Installed npm package metadata. |
| CLI localnet candidate | `v0.65.0` | Installed CLI source/docs declare `localnetCompatibleVersion = "v0.65.0"`; CLI-selected candidate only. |
| Docker client | `27.5.1` | Recorded in prior Stage 2B plan; engine unavailable. |
| Node.js / Python | `v24.14.0` / `3.12.10` | Recorded in prior read-only checks. |
| `genlayer-test` / `genlayer-py` | `0.29.2` / `0.16.3` | Existing packages; declared package bound fits, node protocol compatibility unverified. |
| `genvm-linter` | `0.11.1rc2` | Prerelease; previous upstream runner lookup failed and used cache. |

No runner was loaded, so exact runtime runner hash/version, image tags and image digests are unavailable. Contract headers use `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` (documentation example); the prior linter cache reported `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` as newer after upstream lookup failed. Neither value is runtime-observed, tied to localnet `v0.65.0`, or established as the stable Studionet runner. Local runner/Studionet equivalence is not assumed.

The selected candidate version would have been `v0.65.0` because the installed CLI source labels it its minimum/default. This is not independent confirmation of a full cross-component compatibility matrix.

Authoritative references reviewed:

- [GenLayer CLI source and releases](https://github.com/genlayerlabs/genlayer-cli)
- [GenLayer network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- [GenLayer networks](https://docs.genlayer.com/developers/networks)
- [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- [Testing Suite Studio runner](https://github.com/genlayerlabs/genlayer-testing-suite/blob/main/docs/studio-runner.md)
- [GenVM Manager releases](https://github.com/genlayerlabs/genvm-manager/releases)

These sources distinguish localnet from hosted networks and document localnet defaults. They do not provide runtime runner evidence for this machine because the environment could not be started.

## Docker discovery and startup

Before startup, `com.docker.service` was `Stopped` with `Manual` start type; no Docker Desktop/backend process was running. Docker CLI resource queries (`docker ps -a`, `docker image ls --digests`, `docker volume ls`, `docker network ls`) could not connect to `//./pipe/docker_engine`. The Docker CLI also reported access denied reading `C:\Users\USERpc\.docker\config.json` and contexts. No config was changed. Existing containers/images/volumes/networks therefore could not be inventoried.

Actions attempted:

1. Launched `C:\Program Files\Docker\Docker\Docker Desktop.exe` without elevation. No persistent Desktop/backend process appeared; service stayed stopped.
2. `Start-Service -Name com.docker.service` without elevation failed because the service could not be opened.
3. Retried through the approved elevated execution path. It again failed with `Cannot open 'com.docker.service' service on computer '.'`.
4. Rechecked service, `docker info`, and engine pipe: service remained stopped; no engine pipe or server info.

No `docker pull`, `genlayer init`, `genlayer up`, `genlayer stop`, reset, removal, or prune command ran. No Docker image tags or digests were downloaded/observed. The CLI package's candidate tag is `v0.65.0`; actual localnet image tags/digests are unknown.

## Network isolation and integration results

The prepared test command pins `--network localnet` and `--rpc-url http://127.0.0.1:4000/api`, but was not run. Documentation lists chain ID `61127` as the localnet default, but this execution observed no responding endpoint or chain ID. The temporary CLI profile was not created or initialized; persistent GenLayer configuration was untouched.

- Observed local chain ID: **none**.
- Observed RPC endpoint: **none**; port 4000 unavailable.
- Studionet/public transactions: **none**.
- Deployments, transaction IDs, receipts, finality observations, or test logs: **none**.

Prepared artifacts remain unchanged:

- `tests/integration/contracts/registry_view_caller.py`
- `tests/integration/test_registry_cross_contract_view.py`

The opt-in test was not executed, so Registry deployment, caller deployment, fictional registration, cross-contract retrieval, missing-record handling, duplicate rejection, state preservation, validator behavior, and finality remain unverified. Previous cached-linter and Python-parse checks are static/local checks only.

## Commands and outcomes

```powershell
$pkg = Get-Content "$env:APPDATA\npm\node_modules\genlayer\package.json" -Raw | ConvertFrom-Json
$pkg.version
# 0.40.0-rc.3

rg -n -m 2 "localnetCompatibleVersion|v0\.65\.0" "$env:APPDATA\npm\node_modules\genlayer"
# CLI source/generated docs show v0.65.0 minimum/default

Get-Service -Name com.docker.service
# Stopped; Manual

docker ps -a
docker image ls --digests
docker volume ls
docker network ls
# Could not connect: //./pipe/docker_engine not found

Start-Process -FilePath 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden
# No persistent Desktop/backend process; service stayed stopped

Start-Service -Name com.docker.service
# Cannot open service

docker info --format '{{.ServerVersion}}'
# Engine pipe unavailable
```

No test command ran because the local runtime did not start and its chain identity could not be verified.

## Remaining steps

1. Resolve Docker Desktop service access on the host. No further service/config changes were made here.
2. Once Docker is available, inventory existing resources before initialization. Preserve all resources; stop if there is a collision or impact on other projects.
3. Use the installed CLI's candidate localnet version `v0.65.0` only after reviewing the actual image references and resource changes. Record every image tag and digest.
4. Capture the running GenVM/`py-genlayer` version/hash from Studio config or execution trace. Treat it as localnet evidence only.
5. Query the local RPC identity before enabling the test; proceed only if endpoint is loopback and chain ID is 61127.
6. Execute the prepared two-contract test and record addresses, transaction IDs/statuses, execution results, receipts, final Registry state, and stdout. Do not infer Studionet lifecycle compatibility.

## Recommendation

**NO-GO for beginning PrecedentEvaluator implementation that assumes cross-contract Registry reads.** The environment could not start, and no chain identity or two-contract behavior was demonstrated. The Registry itself is unaffected; the integration dependency remains unresolved. Do not substitute Studionet for this local proof.
