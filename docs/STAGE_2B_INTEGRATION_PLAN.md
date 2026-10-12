# Stage 2B — Registry Integration Environment Verification

**Date:** 2026-10-12  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Verdict:** **CONDITIONAL GO to start a local integration run after explicit approval and toolchain selection. No integration run has occurred.**

## Executive summary

- The production Registry has a passing Direct Mode suite (29 tests, Stage 2A-I). The contract and its simple append-only storage design are suitable for the planned local integration probe, subject to the unresolved runtime/version boundaries below.
- The correct cross-contract proof is a Studio Mode RPC integration test with two separately deployed contracts. A test has been prepared under `tests/integration/`, separate from production contracts.
- The local Docker service is stopped; Studio ports 4000, 8080, and 8545 are unreachable. I did not start Docker/Studio.
- Current tools are mixed: Python 3.12.10, `genlayer-test` 0.29.2, `genlayer-py` 0.16.3, CLI 0.40.0-rc.3, linter 0.11.1rc2, Docker client 27.5.1, Node 24.14.0. The test/client pair is package-compatible locally, but the CLI/linter are RCs and no full stable Studionet compatibility matrix is verified.
- The exact `py-genlayer` runner hash expected by stable Studionet remains unknown. The contract headers contain the documentation example hash; linter cache reports a newer hash but cannot reach the upstream manager. Neither is verified as the stable network's required pin.
- Current protocol docs say Accepted is a provisional decision, Finalized means the appeal path has completed, and both states still require checking execution success. The installed Python SDK has older status/receipt semantics (including a `READY_TO_FINALIZE` enum that current docs explicitly say is not a stored status). This mismatch must be resolved before treating its integration receipt assertions as stable-network evidence.

## Reports reviewed

- `docs/STAGE_1_VERIFICATION.md`
- `docs/STAGE_1B_RUNTIME_PROOF.md`
- `docs/STAGE_2A_REGISTRY_REPORT.md`
- `docs/STAGE_2A_RUNTIME_RECOVERY.md`
- `docs/STAGE_2A_IMPLEMENTATION_REPORT.md`

Their common boundaries remain in force: no Studionet transaction in this stage; Direct Mode tests are not live consensus; the runner hash is not pinned; cross-contract behavior must be tested through Studio Mode; full case documents/personal information must stay off-chain.

## Registry audit

The Registry uses one `TreeMap[str, PrecedentRecord]`, an `@allow_storage` dataclass, sized integers, deterministic write/views, and `gl.message.sender_address`. There are no update/delete methods or full-document fields. Direct Mode tests cover duplicate rejection and state preservation in the local harness. The existing `get_precedent` returns a flat `dict[str, str]`, uses `{}` for missing records, and `has_precedent` returns a boolean.

Risks/observations:

1. Cross-contract return serialization for the dict, `Address.as_hex`, and the empty-map missing case have not been exercised by a deployed caller. These are the exact behavior the new probe targets.
2. Direct Mode's revert/state tests do not prove Studio/GenVM rollback or chain finality.
3. Date validation enforces string shape only, not calendar validity.
4. A label allowlist reduces accidental disclosure, but it cannot detect every personal/confidential value. Fictional/public-only review remains mandatory.
5. Digest syntax is checked but document canonicalization/algorithm provenance remain an off-chain protocol decision.
6. The 64-character metadata bounds and one-million registration count guard are design caps, not measured Studionet limits or fee measurements.
7. Record IDs accept general bounded uppercase ASCII identifiers; fixture values are fictional. The contract cannot establish that a precedent is authentic or legally authoritative.

No production contract edits are proposed in this verification stage.

## Official Studio installation/startup guidance

Current GenLayer docs prescribe Python 3.12+, Node.js 18+, and Docker 26+ for a local Studio. Local Studio defaults to UI `http://localhost:8080`, RPC `http://localhost:4000/api`, and local chain ID 61127. The local environment is a test simulator, not stable Studionet (61999). The documented CLI flow is `genlayer init`, `genlayer up`, then select `localnet`; `genlayer stop` stops localnet services. Hosted Studio has no Docker setup, but a `gltest --network studionet` integration test would deploy and submit writes remotely, which is prohibited here.

References:

- [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- [Development Setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup)
- [Testing Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/testing)
- [Network Configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- [GenLayer CLI commands](https://github.com/genlayerlabs/genlayer-cli)

Resource requirements documented for local Studio: Docker 26+, Node 18+, Python 3.12+. This machine's Docker client is 27.5.1, Node is 24.14.0, and Python is 3.12.10. No local Studio resource sizing (RAM/disk) was established by the current Studio setup page; validator-node hardware requirements are not assumed to be identical to a local Studio requirement.

The installed CLI's `genlayer init --help` advertises `--localnet-version` and lists `v0.65.0` as the default/minimum in this build. This is an installed CLI observation, not confirmation that its localnet version is compatible with stable Studionet or the Registry runner hash.

## Environment readiness checks

Read-only checks executed:

```powershell
sc.exe query com.docker.service
# TCP connect probes to 127.0.0.1 ports 4000, 8080, 8545
node --version
npm --version
python --version
genlayer --version
python -m pip show genlayer-test genlayer-py genvm-linter
```

Observed:

- `com.docker.service`: `STOPPED`.
- Ports 4000, 8080, 8545: not reachable.
- Docker client binary reports 27.5.1, but `docker info` cannot connect to the missing `docker_engine` named pipe; the daemon is not available.
- Node v24.14.0; npm 11.9.0; Python 3.12.10.
- `genlayer-test==0.29.2`; `genlayer-py==0.16.3`; the test-suite metadata requires `genlayer-py>=0.13,<0.17`, so that pair is internally dependency-compatible. This does not prove compatibility with the current node protocol.
- `genlayer` CLI is 0.40.0-rc.3. A normal CLI startup still fails at `chmod C:\Users\USERpc\.genlayer` with EPERM in this sandbox. A prior process-local `USERPROFILE` workaround was demonstrated in Stage 1B; original configuration was not changed.
- `genvm-linter==0.11.1rc2`; it is a prerelease. On lint, upstream runner lookup is blocked, so local cache is used.

## Runner and SDK compatibility

### Facts verified

- Official current Studio docs distinguish stable hosted Studionet (61999), Studio-dev (61997), and local Studio (61127 default). The local integration proof must explicitly use localnet, not Studionet or Studio-dev.
- Official CLI changelog lists 0.39.1 as the latest stable release preceding the 0.40 prerelease series (0.40.0-rc1/rc2/clarke.1). Installed CLI is 0.40.0-rc.3. A stable 0.39.x CLI is a candidate to review for localnet, not a proven complete matrix.
- `genlayer-test==0.29.2` and `genlayer-py==0.16.3` fit the installed test package's declared dependency bound and previously passed Direct Mode tests.
- PyPI shows stable `genlayer-py==0.18.0`, but it does not meet `genlayer-test==0.29.2`'s declared `<0.17` requirement. Do not upgrade one package alone. `genlayer-py==0.19.0rc*` is prerelease and official docs associate the RC client with Studio-dev/Consensus v0.6; do not mix that chain/client with stable Studionet.
- Installed stable `genlayer-test` 0.29.2 is newer than no? PyPI shows 0.30.0rc2 as prerelease; 0.29.2 is the latest listed stable release in the observed PyPI page.
- Installed linter is 0.11.1rc2; Stage 1B identified 0.11.0 as stable. Use a stable linter candidate for a pinned environment, but verify its runner dependency.

### Not verified

- The complete version tuple that GenLayer currently supports for stable Studionet.
- The specific stable Studionet `py-genlayer` hash. The Registry and caller headers use `1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` from a docs example. The linter cache reports `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` as newer, after its upstream lookup failed. “Newer” is not equivalent to “the hash stable Studionet expects.”
- Whether a localnet runner selected by the installed CLI matches the runner or protocol compatibility needed for stable Studionet.
- Whether genlayer-py 0.16.3 correctly decodes current protocol lifecycle/execution-result fields. Its installed `TransactionStatus` includes `READY_TO_FINALIZE`; current protocol docs state finalization readiness is a resolution action, not a stored status. Its installed helper looks for legacy leader receipt `execution_result == "SUCCESS"`; current docs describe `statusName` and `txExecutionResultName` such as `FINISHED_WITH_RETURN`/`FINISHED_WITH_ERROR`.

Official references:

- [GenLayer CLI changelog](https://github.com/genlayerlabs/genlayer-cli/blob/main/CHANGELOG.md)
- [genlayer-test on PyPI](https://pypi.org/project/genlayer-test/)
- [genlayer-py on PyPI](https://pypi.org/project/genlayer-py/)
- [GenLayerPY API docs](https://docs.genlayer.com/api-references/genlayer-py)
- [Transaction statuses](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses)
- [Querying a transaction](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction)

## Prepared Studio Mode integration test

Test-only files created:

- `tests/integration/contracts/registry_view_caller.py` — independent read-only caller with `read_record` and `has_record` views using documented `gl.get_contract_at(...).view()` calls.
- `tests/integration/test_registry_cross_contract_view.py` — opt-in local Studio test. It deploys Registry, registers one fictional record, deploys caller with Registry address, reads all bounded record fields plus a missing record, submits a duplicate registration, expects transaction execution failure, then verifies final Registry state/count did not change.

The test checks `PRECEDENTOS_RUN_LOCAL_INTEGRATION=1` before any RPC/deployment. It is intended to be invoked only with an explicit localnet URL and network selection. It is not runnable safely until Docker/Studio is running and the runner/toolchain pin question is resolved. No integration test was executed.

The caller contract passed cached `genvm-lint` (3 checks, validation passed; 2 view methods, no writes). Linter could not query the upstream manager and reported a newer cached hash. The integration test Python source parsed successfully via `ast.parse`; no test collection, RPC call, deployment, or transaction was run.

### Exact local command after approval

Once the approved local Studio is running and listening on port 4000, with a reviewed compatible localnet runner selected, open PowerShell in the repository:

```powershell
$env:PRECEDENTOS_RUN_LOCAL_INTEGRATION = '1'
gltest tests/integration/test_registry_cross_contract_view.py `
  -v -s `
  --network localnet `
  --rpc-url http://127.0.0.1:4000/api `
  --contracts-dir . `
  --artifacts-dir .stage2b-artifacts
```

The artifacts directory is dedicated to this integration command because the installed `gltest` plugin clears its configured artifacts directory at session start. The opt-in variable is essential: without it, the test skips before making RPC calls. Do not replace `localnet` with `studionet`; that would send transactions to chain 61999.

Expected result when the cross-contract call works:

- Registry deployment and registration transactions reach `FINALIZED` and their execution receipts report success.
- Caller deployment finalizes.
- Caller view returns the registered record's exact ID, digest, schema version, fictional metadata and registration sequence.
- Caller reports `False` / `{}` for a missing ID.
- Duplicate registration ends with a failed execution receipt; subsequent **final-state** reads return the original record unchanged and count remains 1.

If returned map serialization or address conversion fails, capture the Studio transaction trace/log and adapt only after checking the supported schema/runtime API. Do not use a mock or merge the contracts to claim success.

## Local Studio startup steps requiring approval

Local startup runs Docker services, downloads/uses GenLayer images, creates local accounts/validator state, and writes a local CLI profile. I did not run it. The existing-user config should remain untouched; Stage 1B demonstrated that this CLI's `EPERM` can be avoided with a process-local `USERPROFILE` pointed at a temporary profile.

Before proceeding, approval is needed for:

1. Starting Docker Desktop / the Docker service.
2. Initializing a disposable local CLI/Studio profile and starting the local simulator.
3. Any disk/network use to download the selected localnet containers/images.
4. Local-only deploy/write transactions in the isolated test. They are not Studionet transactions, but they mutate the disposable local chain database.

Command sequence (requires an explicitly selected localnet release; **not executed**):

```powershell
# Use an isolated temporary profile so the existing C:\Users\USERpc\.genlayer is untouched.
$profile = Join-Path $env:TEMP 'precedentos-genlayer-local-profile'
$env:USERPROFILE = $profile

# First confirm the chosen local CLI and inspect supported version flags.
genlayer --version
genlayer init --help

# After choosing a localnet version compatible with the CLI/runtime:
genlayer init --headless --numValidators 3 --localnet-version <approved-localnet-version>
genlayer up --headless --numValidators 3

# Verify local-only endpoints before the opt-in integration test.
Test-NetConnection 127.0.0.1 -Port 4000
Test-NetConnection 127.0.0.1 -Port 8080

# Then run the exact gltest command above.
```

The currently installed CLI help lists `v0.65.0` as its localnet default, but since the CLI is 0.40.0-rc.3, do not assume that version is the right stable-compatible local runtime. Select a version only after checking the corresponding official release compatibility. Avoid `--reset-db` and `--reset-validators`; the prepared test needs a fresh local environment but should not destructively reset an existing one.

Afterward, stop only this local GenLayer environment with `genlayer stop` when approved. Remove only the disposable temporary CLI profile after confirming it contains no wanted keys/state. Never run `genlayer network set studionet`, `gltest --network studionet`, or any remote deploy/write command as part of this local proof.

## Transaction lifecycle interpretation

Current protocol docs distinguish the EVM submission transaction from the GenLayer Intelligent Contract transaction lifecycle:

- **Submitted/processing:** retain the returned GenLayer transaction ID and poll; do not blindly resubmit after a timeout.
- **Accepted:** validator committee has agreed on a receipt, but the appeal window remains and the decision is provisional. Accepted does not prove contract execution succeeded.
- **Finalized:** the appeal path has completed and finalization is recorded; this is the durable completion point for a final-state read.
- **Failed execution:** a transaction can be Accepted or Finalized while its agreed receipt represents a user/VM error. Always check execution result as well as consensus status.
- **Undetermined, timeout, canceled, appeal states:** not success. Inspect status, receipt, and available lifecycle projection; a passing leader result alone is not a successful operation.

For this prepared test, writes request `TransactionStatus.FINALIZED`, and reads use `TransactionHashVariant.LATEST_FINAL`; execution success/failure is checked separately with the installed `gltest.assertions` helper. Because the installed SDK's receipt schema may predate current docs, do not accept this integration test as protocol-lifecycle verification until the helper/output is confirmed against the selected localnet SDK/runtime. The local transaction proof is not a Studionet finality proof.

## Security considerations

- Use only fictional public fixture data and fake hex digests; never use case documents, personal details, real private keys in repo files, or confidential evidence.
- The caller contract is test-only and read-only; no Registry mutation or evaluator behavior is included.
- All deploy/write actions must be forced to `localnet` with the explicit `127.0.0.1` RPC URL. Avoid Studionet aliases/config. Treat chain ID 61127 local state as disposable.
- Do not reset any preexisting localnet database/validators without separate approval.
- Keep wallet keys and provider secrets out of the repository. The deterministic Registry/caller calls do not require LLM provider credentials, but local validators/network services must be healthy.
- Preserve transaction IDs and receipts on failure; distinguish execution error from consensus/finality state before retrying.
- A successful local integration proves this local Studio runtime only; it does not establish stable Studionet behavior or legal correctness.

## Acceptance criteria for Stage 2B execution

1. User approves Docker/Studio startup and local-only deployment/write test operations.
2. A localnet release and GenVM runner are selected from official compatibility sources; no RC/stable mixing is implicit.
3. Studio RPC is reachable at `127.0.0.1:4000/api`, UI at `127.0.0.1:8080`, and the observed network is localnet (default chain ID 61127), not Studionet.
4. Test deploys the Registry and caller as distinct contracts; no Direct Mode mocks are involved.
5. Registration and deployment receipts reach the agreed final state and execution success is checked with a client compatible with the response schema.
6. Cross-contract view returns exact existing-record fields and correct missing-record behavior.
7. Duplicate registration execution fails, final-state record contents remain identical, and count remains 1.
8. Test run, runner hash/version, Studio/localnet release, Python package versions, transaction IDs, receipts, and test stdout are recorded. The report clearly labels this as localnet-only evidence.
9. Separate approval is obtained before any Studionet transaction or PrecedentEvaluator implementation/integration.

## Recommendation

**CONDITIONAL GO for executing Stage 2B after approval.** The Studio Mode test is prepared and statically checked, but Docker/Studio is stopped and no test was run. The runner hash and installed SDK/lifecycle compatibility remain unresolved. Approval is required before starting Docker/Studio and before local deploy/write actions. No package/config change, service startup, deployment, transaction, commit, or push occurred in this stage.
