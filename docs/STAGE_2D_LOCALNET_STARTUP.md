# Stage 2D: Localnet Startup and Identity Attempt

**Target for this check:** GenLayer localnet, expected chain ID `61127`  
**Production target:** stable Studionet, chain ID `61999` (not contacted)  
**Outcome:** localnet did not start; the identity smoke failed because the local RPC refused the connection.

## Scope and safety

This run attempted only localnet startup and a read-only JSON-RPC chain identity check. No contracts were deployed, no transaction/write RPC was sent, and no Studionet URL was contacted. No dependencies were installed or upgraded, no production contract was edited, and no commit or push was made.

## CLI `.genlayer` EPERM workaround

The normal installed CLI invocation fails during configuration initialization because it calls `chmod` on `C:\Users\USERpc\.genlayer` and receives `EPERM`. Inspection of the installed CLI bundle showed its config directory is derived from Node's `os.homedir()`.

The temporary PowerShell process changed only its child-process `USERPROFILE` to a new directory under `%TEMP%`. A local Node check confirmed that `os.homedir()` resolved to that temporary directory. The original user profile and `.genlayer` directory were not modified, permissions were not changed, and no elevated CLI was run.

To avoid writes beside the globally installed CLI, the bundled CLI entry point, package manifest, Docker Compose file, and sanitized `.env.example` were copied to a unique `%TEMP%` directory. The temporary `.env` set `LOCALNETVERSION=v0.65.0`; a directory junction referenced the already installed CLI dependency tree. The copied CLI returned `0.40.0-rc.3`. This was a local copy of the existing release, not an install or upgrade. The global package's `.env` and compose override remained untouched.

The shell command used for the attempt was equivalent to:

```powershell
$env:USERPROFILE = '<unique temp profile>'
node '<temp CLI copy>\dist\index.js' up --headless
```

The `up` command is used instead of `init`: source inspection showed `init` deliberately resets GenLayer containers, images, and volumes before configuring localnet. Since the user prohibited deleting Docker resources, `init` was not invoked. The installed CLI's source defines `v0.65.0` as its minimum compatible localnet version, its `init --help` defaults to `v0.65.0`, and its compose file tags the `yeagerai/simulator-*` images from `LOCALNETVERSION`. This verifies the requested tag against the installed CLI's own compatibility setting. It does not establish stable Studionet runner equivalence.

## Startup result

The exact startup output stopped at:

```text
- Checking CLI version...
⚠ Localhost access enabled — GenVM can reach host services (Anvil, local APIs). Not for production use.
```

The command remained at the version-check step for over a minute. A read-only Docker inventory during that time showed no containers and no downloaded GenLayer images. The command was manually interrupted; it exited with code `1`. It had not reached the Docker Compose start phase, so no localnet service started. No more startup attempt was made.

The output did not provide a specific exception beyond remaining at `Checking CLI version...`; the cause of the stall is therefore unresolved. It may be a CLI version-check/network wait, but that is an inference, not a confirmed diagnosis.

## Versions and environment

- GenLayer CLI copied from installed global package: `0.40.0-rc.3`.
- CLI localnet compatibility floor/default: `v0.65.0` (verified in its bundled source and `init --help`).
- `genlayer-test==0.29.2`.
- `genlayer-py==0.16.3`.
- `genvm-linter==0.11.1rc2`.
- Node.js: `v24.14.0`.
- Docker client/server: `27.5.1` / `27.5.1` (read-only inventory).
- Existing Docker image: only `ghcr.io/unionlabs/union/mpc-client:v1.2`, digest `sha256:520f686604133f6b6b5ed88f6dd44398c1cda454ac02c818fa36102fe066c78d`.
- Containers: none. Volumes: none. Networks: default `bridge`, `host`, `none`.
- Expected localnet RPC: `http://127.0.0.1:4000/api`; localnet UI would be `http://127.0.0.1:8080/`.

No Docker resources were deleted. The unrelated MPC image was retained. No GenLayer image was downloaded. Docker inventory after the interrupted attempt remained unchanged.

## Identity smoke test

The existing `tests/integration/test_localnet_identity.py` was run with opt-in enabled and an explicit loopback RPC URL. It sends only `eth_chainId` and refuses non-loopback addresses. Command:

```powershell
$env:PRECEDENTOS_RUN_LOCALNET_SMOKE = '1'
$env:PRECEDENTOS_LOCALNET_RPC_URL = 'http://127.0.0.1:4000/api'
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD = '1'
$env:PYTHONDONTWRITEBYTECODE = '1'
$cacheDir = Join-Path $env:TEMP 'PrecedentOS-pytest-cache'
python -m pytest -p no:cacheprovider -o "cache_dir=$cacheDir" tests/integration/test_localnet_identity.py -q
```

Result: **failed, 1 test**. The exact connection error was:

```text
localnet RPC did not respond: <urlopen error [WinError 10061] No connection could be made because the target machine actively refused it>
```

Independent loopback checks also found ports `4000` and `8080` unreachable. Chain ID `61127` was not observed, so identity is unverified. The failed result is environmental and does not indicate a chain-ID mismatch.

## Commands and side effects

- Read-only inspection of Stage 2D readiness/recovery reports, test code, installed CLI bundle, package metadata, and compose image-tag configuration.
- Read-only Docker inventories before, during, and after the startup attempt.
- Process-local profile and CLI working copy created under `%TEMP%`; no writes to the normal user profile or global CLI package.
- One CLI `up --headless` startup attempt, pinned through the temporary `.env` to `v0.65.0`; manually interrupted before compose start.
- One opt-in identity smoke test against `127.0.0.1:4000`; connection refused.
- No `init`, reset flag, Docker cleanup, deployment, transaction, dependency install, commit, or push.

## Status and next step

**Localnet running:** No.  
**Identity smoke passed:** No; it ran and failed because RPC was unavailable.  
**Chain ID `61127` confirmed:** No.  
**Studionet touched:** No.

The approved process-local workaround clears the `.genlayer` permission obstacle, but the CLI's version check stalls before startup. The installed compose/image tag selection is supported by the installed CLI's local compatibility floor. The remaining blocker is CLI startup not reaching compose; this attempt must not be repeated with another version or by invoking `init`, since `init` includes resource deletion. A follow-up should first resolve the CLI version-check stall or provide an officially documented way to skip it without changing versions, then use the same isolated profile and re-inventory Docker before a single controlled `up` attempt.
