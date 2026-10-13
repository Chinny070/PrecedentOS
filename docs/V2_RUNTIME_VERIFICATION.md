# PrecedentOS 2.0 — Runtime and Toolchain Verification

**Reviewed:** 2026-10-13
**Deployment target:** stable GenLayer Studionet, chain ID 61999.
**Result:** documentation confirms the public API patterns below; this host could not make a read-only RPC request, and no local Studio, live contract call, runner mapping, fee quote or validator execution was verified.

## Toolchain observed locally

| Component | Observed value | What it proves |
|---|---|---|
| Node CLI package | `genlayer@0.40.0-rc.3` at the global npm install | Installed package metadata only. `genlayer --version` could not initialize because Node failed `chmod C:\Users\USERpc\.genlayer` with `EPERM`. No config or permission change was made. |
| Contract Direct Mode | Python 3.12.10; `genlayer-test==0.29.2`; `genlayer-py==0.16.3` | Locally executed Direct Mode tests, not a stable runner compatibility statement. |
| GenVM linter | `genvm-linter==0.11.1rc2` | Cached linter checks passed. It could not reach the runner catalog due WinError 10013. |
| Contract runner header | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` | Source pin only; no authoritative evidence that this is the runner currently selected by stable Studionet. |
| Cached linter runner | `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` | Linter says a newer cached runner is available. A cache message is not a network release mapping. |
| Frontend SDK | `genlayer-js==1.1.8` in `frontend/package.json` and lockfile | Pinned project dependency; it is not thereby shown compatible with the latest fee/lifecycle protocol docs or stable runner. |
| Fee profile | None present in the repository | No measured deployment/write profile or safe fee ceiling is available. |

The official Consensus v0.6 migration guide groups GenLayer CLI 0.40 RC, `genlayer-js` 2.0 RC, `genlayer-py` 0.19 RC, Studio 0.123 RC and matching fee tooling with Studio-dev (chain ID 61997). That is explicitly different from stable Studionet (61999). The installed CLI's `0.40.0-rc.3` version alone does not establish compatibility with either stable Studionet or this project's pinned GenLayerJS 1.1.8. Do not switch networks or upgrade packages based on inference.

## Findings by requested capability

| Capability | Documentation-confirmed | Local/live proof | Stage status |
|---|---|---|---|
| Stable Studionet identity | Official Networks page gives RPC `https://studio.genlayer.com/api`, chain ID `61999`, currency `GEN`. Studio-dev is `61997`; localnet defaults to `61127`. | The bounded read-only call below failed before receiving an HTTP/RPC response. User-provided prior Windows result was `0xf22f` (=61999); treated as prior user observation, not a result of this run. | Docs confirmed; host RPC blocked. |
| Python IC syntax and APIs | Current docs show `gl.get_contract_at(addr).view().method()`, `other.emit(on='finalized').method()`, `gl.message.sender_address`, `origin_address`, `gl.message_raw['datetime']`, `gl.nondet.web.render`, and `gl.vm.run_nondet_unsafe`. | Direct Mode compiles/tests these contracts; no exact current stable GenVM artifact was obtained. | API documented; runner compatibility blocked. |
| Cross-contract view call | Current official guide describes synchronous view reads from another IC at the current block. Registry exposes `has_precedent`/`get_precedent`; Evaluator exposes `has_evaluation`/`get_evaluation`. | No two-contract runtime result in this stage. Existing `tests/integration/test_registry_cross_contract_view.py` is an opt-in test and remains unexecuted; it only probes Registry, not Evaluator-to-CaseCourt decision semantics. | Documented syntax; required integration proof blocked. |
| Child transaction and authorization | Internal messages are asynchronous and execute as child transactions after the parent reaches `accepted` or `finalized`. Child `sender_address` is the calling IC; `origin_address` is preserved. `accepted` writes may survive an appeal and can be re-emitted on re-execution; use idempotent receivers or `finalized` for irreversible effects. | No child transaction executed. | Docs confirmed; runtime behavior/retries untested. |
| Deterministic transaction time | Transaction datetime is pinned across validators. Docs expose `gl.message_raw['datetime']` and deterministic `datetime.now(timezone.utc)`; this is transaction time, not host wall clock. Block number/hash are not in this context. | Direct Mode freeze boundary is tested; no on-network timestamp or delayed-finality check. | API documented; runtime ordering not tested. |
| Native transaction finality | Current docs distinguish `Accepted` from `Finalized`; Accepted may be recomputed after an appeal and can contain a user/VM error. The documented reads are `gen_getTransactionStatus`, `gen_getTransactionLifecycle`, and `gen_getTransactionReceipt`; check execution result separately from consensus status. | No network receipt or lifecycle result was read. | Docs confirmed; no live receipt/finality evidence. |
| Web Render | Current docs show `gl.nondet.web.render(url, mode='html'|'screenshot')` inside non-deterministic execution. Web content varies; validators need stable extracted fields or independent assessment. | No render call or network access from a contract. Docs page does not establish PrecedentOS's required URL/redirect/private-network defenses, response bounds or stable Studionet availability. | Method shape documented; security/runtime blocked; product remains disabled. |
| Equivalence Principle | Official docs describe `run_nondet_unsafe` custom validators and require independent verification of decision-bearing output, not JSON schema alone. | Existing Evaluator's six decision fields are Direct Mode-mocked; no real validator disagreement or accepted result. | Contract design present; validator consensus unverified. |
| Fees and deployment funding | Current fee guide describes a reserved protocol fee for consensus, execution/storage and child messages; recommends profiling representative tests, using a `fee-profile.json`, and estimating against current prices before submission. CLI, Python and JS APIs depend on the matching release family. | No profile, live quote, balance check, fee ceiling or deployment. Current v0.6 fee instructions are specifically tied to v0.6-compatible release tooling; stable network's applicable fee API was not confirmed. | Funding prerequisites unresolved. |
| Browser Studio | Official Studio docs list hosted stable Studionet and provide a contract editor/deployment UI. Studio detects constructor args and shows addresses/transactions. | Browser deployment was not opened and no contract was deployed. | Product path documented; stable runner/fee compatibility unresolved. |

## Read-only identity probe

Command executed in Windows PowerShell (8-second request timeout):

```powershell
$body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
Invoke-RestMethod -Uri 'https://studio.genlayer.com/api' -Method Post `
  -ContentType 'application/json' -Body $body -TimeoutSec 8
```

Observed exact failure: `System.Net.Http.HttpRequestException: An attempt was made to access a socket in a way forbidden by its access permissions. (studio.genlayer.com:443)`. There was no JSON-RPC response; this is a local socket-permission failure, not evidence that Studionet is unavailable. No repeated networking troubleshooting was done.

For the user to repeat once in their ordinary PowerShell session:

```powershell
$body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
Invoke-RestMethod -Uri 'https://studio.genlayer.com/api' -Method Post `
  -ContentType 'application/json' -Body $body -TimeoutSec 10
```

Expected documentation value: `result = "0xf22f"` (61999). Stop if the response differs; do not sign or submit a transaction during this identity check.

## Official sources reviewed

- [Networks and chain IDs](https://docs.genlayer.com/developers/networks) — Studionet 61999, Studio-dev 61997, localnet 61127.
- [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio) — hosted Studio environment distinction.
- [Interacting with Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) — typed contract references, synchronous `view()`, deferred `.emit()`.
- [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) — child transaction timing, sender/origin, accepted/finalized risks.
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context) — deterministic datetime and unavailable block/time fields.
- [Finality](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality) and [transaction receipt](https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionReceipt) — stored status, finalization and execution success are distinct.
- [Web Access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access) — Web Render and HTTP methods.
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) — independent decision verification patterns.
- [Consensus v0.6 migration](https://docs.genlayer.com/developers/consensus-v06-migration) — the release-candidate family and Studio-dev distinction.
- [Fees and transaction policy](https://docs.genlayer.com/developers/decentralized-applications/fees-and-transaction-kit) — profiling and fee reservation concepts.
- [Deploying Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/deploying) and [Studio deployment](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/deploying-contract) — supported deployment approaches.
- [Native appeal process](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/appeal-process) — protocol appeal charges differ from PrecedentOS case appeals.

Documentation establishes intended method/API patterns, not the deployed Studionet runner version, actual fee policy, node support window or successful execution for this repository.

## Safe next verification steps

1. In the browser, open `https://studio.genlayer.com`, confirm the selected environment is **Studionet** and UI/network identity is chain ID `61999`; do not confuse it with Studio-dev `61997`.
2. Establish the exact supported stable CLI/SDK/GenVM release family from official stable deployment/release artifacts. Compare it with CLI `0.40.0-rc.3`, `genlayer-js 1.1.8`, Python test packages and contract header pins. Resolve the `.genlayer` EPERM in a process-local profile before invoking the CLI; do not modify the existing profile or permissions.
3. Produce a fee profile on a compatible fee-reporting environment and verify that the same fee policy applies to stable Studionet. Confirm the deployer has GEN and inspect required limits before any user-authorized deployment.
4. Run a two-contract integration proof for Registry reads plus a separate case-bound decision schema. Exercise missing IDs, forged/mismatched digests, correct and wrong contract addresses, child-message retry behavior, and failed state preservation.
5. Test finality callbacks and case deadlines separately from local wall time. Do not enable deadline enforcement until the real finalization anchor is proven.
6. Verify Web Render URL controls, redirects, private-network protections, output caps and validator behavior on the exact target runtime before enabling it.

No deployment, wallet signature, write transaction, Docker service or configuration change occurred during this verification.

## Stage 3A refresh (2026-10-13)

The user's new instruction reports that their ordinary PowerShell previously returned `0xf22f` from `eth_chainId`. This is a user-observed read-only Studionet result and is recorded separately from the Codex PowerShell failure above; Codex did not retry the same blocked socket operation. Current [Networks documentation](https://docs.genlayer.com/developers/networks) still lists stable Studionet as `https://studio.genlayer.com/api`, chain ID `61999`, while Studio development preview is a separate `61997` network.

| Runtime item | Stage 3A status | Evidence boundary |
|---|---|---|
| Stable Studionet identity | **Verified on Studionet (user-reported read-only RPC)** | User-reported `0xf22f`; Codex host cannot independently query. No write or wallet signature. |
| Supported stable GenVM runner | **Blocked** | Existing contract pin and cached lint runner do not map authoritatively to stable's selected runner. Upstream lookup fails Windows socket error 10013. |
| Cross-contract views | **Blocked for this project** | [Official API pattern](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) is synchronous `gl.get_contract_at(addr).view().method()`; no two-IC runtime proof. |
| Child transactions | **Blocked for this project** | [Official message docs](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) confirm asynchronous `emit`, `sender_address`/`origin_address`, and `on='finalized'`; no local/live child execution. |
| AI nondeterministic execution | **Locally tested (mocked)** | Existing Evaluator Direct Mode mocks; current docs and installed source show the API pattern. No real model/validator run. |
| Custom Equivalence Principle | **Locally tested (mocked)** | Existing custom decision-field comparison under `run_nondet_unsafe`; no live disagreement/acceptance proof. [Official EP reference](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle). |
| Transaction timestamp | **Locally tested / documentation-confirmed** | CaseCourt Direct Mode only; [current transaction-context docs](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context) describe pinned transaction time, not block metadata. |
| Receipt/finality | **Blocked for project runtime** | [Current finality docs](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality) distinguish Accepted from Finalized; no actual project receipt checked. |
| Web Render | **Not started / blocked** | [Current Web Access docs](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access) show `gl.nondet.web.render(url, mode='html'|'screenshot')`; safety controls/runtime availability not verified. |
| Deployment and fees | **Blocked** | Current [fee](https://docs.genlayer.com/developers/decentralized-applications/fees-and-transaction-kit) and [deployment](https://docs.genlayer.com/developers/intelligent-contracts/deploying) docs describe profiling/estimation and v2 workflows. Stable fee API compatibility with pinned GenLayerJS 1.1.8 remains unresolved. |
| Studio browser deployment | **Documentation-confirmed / not started** | [Studio deploy docs](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/deploying-contract) describe constructor detection and deploy UI; no UI interaction/deployment was performed. |

The current docs' v2 GenLayerJS fee/deploy examples and matching Studio-dev release-candidate guidance do not establish compatibility or incompatibility for the installed GenLayerJS 1.1.8 on stable Studionet. No speculative SDK upgrade was performed. Exact manual checks are in `V2_LIVE_VERIFICATION_CHECKLIST.md`.

## Stage 3B additions (2026-10-13)

| Capability | Stage 3B status | Evidence boundary |
|---|---|---|
| `gl.nondet.exec_prompt(prompt, response_format="json")` | **Documentation-confirmed / LOCALLY TESTED with mocks** | Official [Calling LLMs](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms) and [prompt techniques](https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts) show this call shape. Direct Mode uses injected fake output only. |
| `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` | **Documentation-confirmed / LOCALLY TESTED with mocks** | Official [non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism) and [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) describe independent validation and post-return state writes. No real validator consensus. |
| `gl.message.chain_id`, `gl.message.contract_address`, `gl.message.sender_address` | **Documentation-confirmed / LOCALLY TESTED in Direct Mode** | Current [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) documents transaction context (and shows `contract_address` in an IC interface example); Direct Mode record commitments parity passes. Exact stable runner behavior is unresolved. |
| SHA-256 evidence bytes and ordered root | **IMPLEMENTED / LOCALLY TESTED** | UTF-8 bytes, SHA-256, Stage 3A Python helper parity tests. Digest integrity is not source authenticity. |
| CaseCourt append after EP returns | **IMPLEMENTED / LOCALLY TESTED (mocked path)** | Source writes only after `run_nondet_unsafe` returns. Direct Mode cannot establish deployed transaction rollback or validator disagreement semantics. |
| CaseCourt judgment state, stable finality, cost | **BLOCKED** | No deployment, local Studio test, live receipt, current stable runner mapping or fee profile. |

The installed GenLayer Python SDK package was not importable as a normal host Python module (`ModuleNotFoundError: genlayer`); Direct Mode loads the contract under its extracted test runtime. Cached GenVM lint passed CaseCourt and reported the cached runner hash `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`; upstream runner resolution was blocked by Windows socket error 10013. These checks do not prove current stable Studionet compatibility. See `V2_STAGE_3B_REPORT.md` for exact commands and test counts.

## Stage 4 appellate runtime status (2026-10-13)

Current official [LLM](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms), [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle), and [non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism) pages were rechecked for Stage 4. They describe JSON `gl.nondet.exec_prompt`, `gl.vm.run_nondet_unsafe`, a `gl.vm.Return` leader result, validators independently checking decision fields, and keeping storage writes outside nondeterministic functions until the result returns.

| Stage 4 property | Evidence | Status |
|---|---|---|
| Appellate nondeterministic API pattern | Current official docs plus source; test harness accepts the shape. | **IMPLEMENTED / LOCALLY TESTED (mocked)** |
| Decision-field custom EP | Validator compares outcome, validity/error, evidence sufficiency, reversal/remand/state and criteria. | **IMPLEMENTED / LOCALLY TESTED (mocked)** |
| Stable runner compatibility | Existing `genvm-lint` upstream lookup remains blocked by WinError 10013; cached artifacts do not establish stable runner identity. | **BLOCKED** |
| Actual validator disagreement and failed execution | No local GenLayer Studio/node available; Direct Mode callback tests are mocks. | **BLOCKED** |
| Rollback of stored state on rejected EP | Not established by Direct Mode. | **BLOCKED** |
| Transaction receipt/finality or timestamp-based appeal deadlines | No transaction submitted; Stage 4 adds no appeal deadlines. | **NOT STARTED / BLOCKED** |
| Studionet deployment or appeal transaction | None performed. | **NOT STARTED** |

The verified documentation API pattern is not proof that this specific CaseCourt source passes the current stable runner or its resource limits. See `V2_STAGE_4_REPORT.md` and `V2_APPELLATE_EQUIVALENCE.md`.
