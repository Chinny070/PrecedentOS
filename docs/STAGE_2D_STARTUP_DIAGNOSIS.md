# Stage 2D: Localnet Startup Blocker Diagnosis

**Scope:** diagnose the prior GenLayer CLI `up --headless` stall. No services were started in this investigation.  
**Target localnet:** `v0.65.0`, expected chain ID `61127`.  
**Studionet:** chain ID `61999`; not contacted.

## Findings

### The CLI version check is an npm registry lookup

The installed CLI is `0.40.0-rc.3`. Its bundled source performs:

1. `StartAction.execute()` prints/sets `Checking CLI version...`.
2. `SimulatorService.checkCliVersion()` awaits `updateCheck(package_default)`.
3. `update-check==1.5.4` checks a one-hour cache under the OS temp directory. If stale/missing, it requests the `genlayer` package metadata from the configured npm registry and compares `dist-tags.latest` with the installed CLI version.

It is an external HTTPS request when the cache requires refresh; it does **not** spawn a subprocess during this stage. The installed `update-check` source sets a 2,000 ms request timeout, but its timeout is a Node HTTP request timeout; it is not an end-to-end hard deadline around every possible DNS/proxy/TLS setup phase. The source does not catch a failed `updateCheck()` in `checkCliVersion()`.

The resolved registry origin in this environment was `https://registry.npmjs.org` (any local registry credentials/path were suppressed). A bounded request to `https://registry.npmjs.org/genlayer` using normal certificate validation returned **HTTP 200 within the five-second request bound**. The current update-check cache contains latest version `0.39.2`. This establishes current registry reachability, not the status of every network path during the earlier attempt.

### The previous command had passed the version check

The prior report inferred that the process remained in `Checking CLI version...`, but its captured output also contained:

```text
⚠ Localhost access enabled — GenVM can reach host services (Anvil, local APIs). Not for production use.
```

In the installed source, that warning is emitted from `setupLocalhostAccess()` inside `StartAction`, **after** `checkCliVersion()`, Docker availability checks, and localnet-running checks. The warning precedes `runSimulator()`. Therefore the previous process had completed the CLI version check and progressed to localnet startup. The spinner text seen in the captured non-interactive output was stale; the earlier report's “stalled at version check” diagnosis was incorrect.

### The process then waits on a child Docker Compose command

The installed CLI's Windows launch command is:

```text
cd /d "<CLI package directory>" && docker compose build && docker compose -p genlayer <profiles> up -d
```

`runSimulator()` passes this command to a helper implemented with `util.promisify(child_process.exec)`. The CLI waits for that child command to exit before it begins its own RPC readiness loop. Because `exec` captures output, Compose progress/errors may not be visible until the child finishes; the CLI's spinner can remain visually unchanged in the terminal capture.

**Established:** the prior attempt reached `runSimulator()` and was waiting in the CLI's child-process path when it was interrupted.  
**Not established:** whether it stalled specifically in `docker compose build`, image resolution/pull during `up`, Docker Desktop/WSL communication, or another child-process step. The prior run did not preserve child stdout/stderr or a process trace. No Docker containers/images appeared during the observed interval, which narrows the evidence but does not identify the exact Compose subcommand.

## Independent corroboration

GenLayer CLI upstream has an open issue titled [“genlayer up --headless stalls indefinitely at Checking CLI version...” (#418)](https://github.com/genlayerlabs/genlayer-cli/issues/418). Its reported symptom is similar: the command advances to a Docker Compose child but remains idle with no containers or project visible. The issue report says npm registry connectivity was working in that reporter's environment and speculates about a local JSON-RPC/image startup issue; it does not establish a root cause or offer a confirmed fix. This corroborates a known symptom, not the diagnosis for this machine.

## Official startup/documentation status

Official GenLayer documentation currently directs local Studio setup through:

```text
genlayer init
genlayer up
```

It documents Docker 26+, the `--localnet-version` option on `init`, local RPC `http://localhost:4000/api`, and localnet chain ID `61127`. The CLI's published README documents the same `init`/`up` lifecycle and says it chooses a compatible environment or accepts a pinned localnet version. The official Studio repository includes a Compose file, and the installed CLI invokes Docker Compose internally.

However, the reviewed official documentation does **not** document direct `docker compose` as a supported standalone startup interface that bypasses the CLI check. Directly running the CLI-bundled Compose file would bypass CLI checks, localhost-access configuration, readiness polling, and environment/validator setup; it is therefore an implementation-detail workaround, not a verified supported alternative. The README's official `genlayer up` route still passes through the same unconditional version check.

`genlayer init` is not a safe bypass here: the installed CLI implementation intentionally removes GenLayer-prefixed containers/images/volumes while initializing. It was not run. There is no `--skip-version-check` option or documented environment variable in the installed CLI interface/source.

References: [official tooling setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup), [official network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [official CLI repository and README](https://github.com/genlayerlabs/genlayer-cli), [official Studio repository](https://github.com/genlayerlabs/genlayer-studio).

## Bounded network check and local environment

- Effective npm registry origin: `https://registry.npmjs.org`.
- Request checked: `GET https://registry.npmjs.org/genlayer`.
- Timeout: 5 seconds at the HTTP client level; TLS certificate validation left enabled.
- Result: HTTP `200`.
- No credentials, custom TLS handlers, or verification bypasses were used.
- Read-only Docker inspection after the prior attempt found no containers and no GenLayer images; the pre-existing unrelated MPC image remained. This investigation started no services and performed no Docker mutation.
- Repository production contracts and tests were not changed. Only this diagnostic report is new; no commit or push was made.

## Verified facts vs hypotheses

| Claim | Status |
|---|---|
| CLI version check calls `update-check` and queries npm package metadata on cache miss/expiry | Verified from installed source |
| The earlier attempt remained inside the version check | Refuted by later `Localhost access enabled` output and source call order |
| Registry connectivity works now | Verified with a bounded HTTPS request, HTTP 200 |
| Earlier attempt reached `runSimulator()` / child-process startup | Verified by the same later warning and source order |
| The child stalled specifically in `docker compose build` or `up` | Unverified |
| Raw Compose is a documented supported bypass | Not found in official setup docs; CLI source uses Compose internally |
| The upstream #418 report has the same visible symptom | Verified; its root cause remains unresolved |
| Localnet chain ID `61127` | Not verified; no RPC was running |

## Safest next action

Do not retry the same command or switch CLI/localnet versions based on this evidence. First obtain the child-process output/exit status for the installed CLI's Compose invocation, or wait for an upstream resolution to issue #418. If a further attempt is authorized, instrument only the already-installed CLI/Compose process with bounded logs and re-inventory Docker first; do not run `init`, clear resources, or bypass TLS. The RPC identity test remains the next gate after startup, and no contract deployment should occur before it reports chain ID `61127`.

**Recommendation: NO-GO for another startup attempt until the Compose child-process stall is diagnosed or an upstream fix/workaround is documented.** The `EPERM` profile problem and npm registry reachability are not the current blocker. The current blocker is the CLI's Compose subprocess not completing or making observable progress.
