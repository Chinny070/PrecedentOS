# Stage 2A-R — Cross-Contract Runtime Recovery

**Date:** 2026-10-12  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Recommendation:** **CONDITIONAL GO to resume Registry-only Stage 2A work; NO-GO to claim the cross-contract gate passed or begin Evaluator integration.**

## Executive finding

The failed proof used the wrong testing mode for an interaction between two separately deployed Intelligent Contracts. GenLayer documents Direct Mode as in-memory execution and Studio Mode as RPC-backed deployment/interaction. Direct Mode's `only one contract is allowed` error is therefore a limit of this harness execution arrangement, not evidence that `gl.get_contract_at(...).view()` is unsupported.

The correct integration test is to deploy both disposable contracts to a GenLayer Studio/localnet instance and invoke the caller's view through Studio RPC. `genlayer-test` Studio Mode is expressly documented for integration tests and multi-validator/network behavior. The local Studio endpoint is documented at `http://localhost:4000/api`; UI at `http://localhost:8080`. Hosted Studionet integration is also supported by `gltest --network studionet`, but it deploys contracts and performs transactions. It was not used because this task forbids deployment and live transactions.

The local Docker daemon is stopped, and ports 4000, 8080, and 8545 are unreachable. Starting Studio would start Docker services and create/update local runtime state. That is excluded without approval, so no supported local integration execution was possible here. No production contract code was written.

## 1. Root cause of Stage 2A failure

The disposable probe and test were:

- `experiments/stage2a/contracts/view_source_probe.py` — public source view returning a fictional marker.
- `experiments/stage2a/contracts/view_caller_probe.py` — calls `gl.get_contract_at(source_address).view().get_marker(record_id)`.
- `experiments/stage2a/tests/test_cross_contract_view_probe.py` — calls `direct_deploy` for both files in a single Direct Mode test.

Direct Mode implements an in-process contract VM harness. Its loader rejects a second contract class with `TypeError: only one contract is allowed`. The exception occurred while loading the second class, before the caller method or intercontract view call could execute. It only demonstrates that this one-VM test setup cannot host both classes; it says nothing about the GenVM runtime API's support.

Do not work around this by changing private `genlayer-test` globals, merging contract classes into a single production class, or treating two independent Direct Mode tests as shared state. None reproduces two separately deployed addresses and the IC-to-IC view boundary.

## 2. Supported testing approaches

Official GenLayer testing guidance distinguishes the following:

| Method | Multi-contract view proof? | What it can establish | Status here |
|---|---|---|---|
| Direct Mode (`pytest`) | Not with this installed harness arrangement; single in-memory contract class | Deterministic Registry unit behavior, input validation, storage/view logic; mocked nondeterminism | Installed and used, but the cross-contract probe failed during class loading |
| Studio Mode against local Studio | Yes: deploy source, deploy caller with source address, call caller view through RPC | Runtime interaction across two deployed contract addresses in local Studio; not identical to hosted stable Studionet | Supported/documented; runtime unavailable (Docker stopped; no listener) |
| `gltest --network studionet` | Yes, documented Studio Mode network target | Hosted target behavior and actual transaction lifecycle | Would create deployments/transactions; prohibited in this request and requires explicit authorization |
| Static `genvm-lint` | No | Syntax/schema/static validation against selected/cached runner artifacts | Both probe contracts passed, but cached runner warning remains |

Official references:

- [Testing Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/testing) — Direct Mode runs code in memory; Studio Mode deploys through RPC; Studio Mode is intended for multi-validator and full-network behavior.
- [Testing Suite API reference](https://docs.genlayer.com/api-references/genlayer-test) — Studio Mode supports deployment and contract interaction via RPC.
- [Development Setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup) — local integration tests use `genlayer up`, local RPC `http://localhost:4000/api`, and `gltest ... --network localnet`; hosted Studio is an alternative.
- [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio) — Local Studio defaults to chain ID 61127; stable hosted Studionet is 61999; Studio development preview is 61997.
- [Interacting with Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) — `gl.get_contract_at(address)` and synchronous `view()` reads are documented; the view reads state as of the current block.

Documentation confirms a supported API and test mode, not that this specific installed runner/network deployment has already executed the probe.

## 3. Environment and runner compatibility

### Installed tools observed

- Python 3.12.10.
- `genlayer-test` 0.29.2.
- `genlayer-py` 0.16.3; it is within the installed test suite's declared `genlayer-py>=0.13,<0.17` requirement.
- `pytest` 8.4.2.
- `genvm-linter` / `genvm-lint` 0.11.1rc2 (release candidate).
- GenLayer CLI 0.40.0-rc.3 (release candidate).
- Docker CLI/Desktop files installed; Docker client reports 27.5.1.

The Python host has `genlayer-py` (client SDK), not an importable host Python `genlayer` contract runtime. The `genlayer` module is loaded by GenVM/Studio when contract code is executed. Direct Mode uses its package's own loader/VM emulation, explaining why normal host import is not a useful runtime test.

### Runner hash

The probe files carry `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`, the example dependency hash from earlier documentation/Stage 1B work. The linter validates those files using locally cached SDK artifacts, but cannot resolve the latest runner because outbound access to `genlayerlabs/genvm-manager` is denied in this environment. It also announces a newer hash (`babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`).

No official source inspected here maps a particular `py-genlayer` hash to stable Studionet's currently selected validator/leader runtime. The latest hash announced by a linter cache lookup is **not** proof that stable Studionet expects that hash. The exact stable Studionet runner pin is therefore **unverified**. A contract's dependency header selects a runner artifact; pin selection must be confirmed from current official release/runtime metadata or a successful stable-network deployment/execution. Do not silently replace the current header with the linter's newer hash.

The installed CLI and linter are RCs; the Python test/client packages are stable versions but do not alone establish runner/network compatibility. No complete supported matrix connecting these installed versions and a particular runner hash to stable Studionet was verified.

## 4. Environment checks performed

Commands/checks executed without starting services or modifying persistent configuration:

```powershell
Get-Command docker,genlayer,gltest,pytest,genvm-lint
docker version --format '{{.Client.Version}}'
Get-Service -Name 'com.docker.service'
# TCP connection probes to 127.0.0.1 ports 4000, 8080, and 8545
```

Observed:

- Docker Desktop and CLI are installed; Docker client version is 27.5.1.
- Docker daemon connection fails: named pipe `docker_engine` is absent. Docker service `com.docker.service` is stopped and set to Manual.
- Ports 4000 (Studio RPC), 8080 (Studio UI), and 8545 (optional local EVM/Hardhat) are not reachable.
- `genlayer up --help` and `genlayer init --help` work under a process-local `USERPROFILE` override. The CLI reports that `up` starts its simulator. Its `init` options include `--localnet-version`, but invoking `init` or `up` would change local environment state and/or start Docker services, so neither was run.
- A temporary `.tmp-genlayer-profile/.genlayer` directory was created by CLI help inspection in the repository, and was removed after checks. Original `C:\Users\USERpc\.genlayer` and Docker config were not touched.
- A process query was denied by Windows access controls; it was not used to infer service state. The service and local port checks above provide the relevant observations.

No `docker compose`, `genlayer init`, `genlayer up`, `gltest --network studionet`, deployment, or write transaction was run.

## 5. Lint and Direct Mode commands/results

```powershell
$env:PYTHONIOENCODING='utf-8'
genvm-lint check experiments/stage2a/contracts/view_source_probe.py
genvm-lint check experiments/stage2a/contracts/view_caller_probe.py
```

Both passed 3 static checks and schema validation against cached artifacts. The linter could not resolve current GenVM artifacts due network restrictions and reported a newer runner hash. This is not runtime proof.

```powershell
pytest experiments/stage2a/tests -q
```

Failed at Direct Mode second-contract loading with `TypeError: only one contract is allowed`; the view call was never reached.

No cross-contract runtime proof, persistent state proof, or live validator/consensus behavior was demonstrated.

## 6. Commands and prerequisites for the next step

### Preferred: isolated local Studio integration

Prerequisites:

1. Explicit approval to start Docker/GenLayer local services and permit their local state/config changes.
2. Confirm/select a stable-compatible CLI/localnet version and `genvm` runtime. The installed CLI is `0.40.0-rc.3`, so do not treat it as a pinned stable baseline without review.
3. Ensure local validator LLM/provider configuration is present; do not add secrets to the repository. The probe itself is deterministic and does not need an LLM call.
4. Use only the disposable two-contract probes and a disposable local database; avoid `--reset-db` or `--reset-validators` unless separately approved.

After approval and environment selection, expected command sequence (not executed):

```powershell
# Optional: initialize only after reviewing the chosen localnet version and config location
genlayer init --headless --numValidators 3 --localnet-version <approved-localnet-version>

# Starts Docker-backed local simulator services
genlayer up --headless --numValidators 3

# Confirm Studio is reachable before running integration tests
Test-NetConnection 127.0.0.1 -Port 4000

# Deploy both disposable contracts in one Studio Mode integration test:
# 1) deploy view_source_probe.py;
# 2) pass its returned address to view_caller_probe.py constructor;
# 3) call read_source_marker("FICT-P-001") and assert the marker.
gltest experiments/stage2a/tests/integration -v -s --network localnet

# Stop only if the user wants the local services stopped after the run
genlayer stop
```

The existing test is Direct Mode and must not be relabeled as Studio Mode without adding an RPC integration test that uses verified `gltest` Studio fixtures/APIs. The test's deployment and read operations need to be exercised against localnet; no remote Studionet target should be configured for this proof. Exact fixture loading and contract-factory path settings must be checked against the installed 0.29.2 package/source before writing that test. Do not guess a `gltest` integration API from docs for another release.

### Alternative: hosted Studionet integration

`gltest <integration-test> -v --network studionet` is documented, but it performs deployments/write transactions and uses the stable hosted endpoint. This is outside the current authorization; do not run it unless the user explicitly approves the test transaction and the stable runner/API pin has been resolved.

## 7. Can Registry work proceed independently?

**Yes, with a scoped boundary.** The append-only Registry core can be implemented and tested in Direct Mode without making any contract-to-contract call itself. Deterministic unit tests can cover identifier/digest/metadata validation, duplicate rejection, views, submitter attribution, append-only behavior, and state consistency after rejected calls. This would be useful progress if treated as a Registry-only stage, with no claim that `PrecedentEvaluator` can call Registry.

Risks if proceeding before cross-contract proof:

- The Registry getter's return type/encoding could be unsuitable for `gl.get_contract_at(...).view()` across contract boundaries.
- `Address` constructor/storage behavior, cross-contract view snapshot semantics, and per-call return serialization would remain unverified.
- The evaluator's record-existence verification and any Registry evaluation-reference authorization could require interface changes after Registry deployment; an immutable deployed schema is costly to replace.
- Direct Mode success proves local deterministic business logic only. It does not prove GenVM storage persistence/serialization, RPC method schema, transaction rollback/finality, or Studionet runner compatibility.

Recommended dependency-aware order:

1. Keep the source/caller cross-read probe as an isolated integration test; resolve the local Studio/runtime gate before evaluator work.
2. If implementation is resumed now, implement only the Registry's standalone deterministic core behind a narrow, versioned view interface. Test it in Direct Mode and lint it, explicitly marking these as unit/static results only.
3. Before freezing/deploying Registry or beginning Evaluator integration, run the two-contract local Studio integration test using the exact planned Registry getter (including missing-record and bounded returned-value behavior).
4. Only after that proof, implement Evaluator Registry consumption. Stable Studionet transaction/finality verification remains a later separately authorized gate.

This is a dependency-based risk recommendation, not a claim that Stage 2A's cross-contract criterion has passed.

## 8. Blockers and recommended action

Remaining blockers:

1. Local Studio cannot run until Docker is available and user approves starting local services/config initialization.
2. Installed GenLayer CLI and linter are release candidates; no compatible stable Studionet toolchain/runtime matrix was verified.
3. Stable Studionet's exact expected GenVM `py-genlayer` hash is unknown from available official metadata. Linter's latest cached hash must not be assumed to be Studionet's pin.
4. Direct Mode's installed single-contract restriction means this cross-contract test must use Studio Mode (or a separately documented supported multi-contract integration mode).

Recommended next action: approve one of (a) starting a disposable local Studio using a reviewed CLI/localnet version, followed by a local `gltest` two-contract integration run, or (b) resuming Registry-only deterministic implementation while explicitly deferring and gating all Evaluator integration. Do not send Studionet transactions for this proof without separate authorization.

## Verdict

**CONDITIONAL GO to resume Stage 2A Registry-only implementation**, because Registry's core deterministic storage/validation can be developed independently using Direct Mode unit tests. **NO-GO for Stage 2B / Evaluator integration and for claiming cross-contract support** until a two-contract Studio Mode integration test passes and the runner/API selection is resolved. No production code was written in this recovery phase, no packages were installed/upgraded, no persistent GenLayer configuration was changed, no Docker service was started, no contract was deployed, and no transaction, commit, or push occurred.
