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
| Web Render | **Implemented / locally tested with mocks; live blocked** | [Current Web Access docs](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access) plus [FetchWebContent example](https://docs.genlayer.com/developers/intelligent-contracts/examples/fetch-web-content) show `gl.nondet.web.render(url, mode='html'|'text')`; Stage 5 capture remains hard-gated. No actual stable runner call, redirect/private-IP control, response pre-cap or fee/runtime proof. |
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

## Stage 5 Web Evidence runtime status (2026-10-13)

| Capability | Status | Evidence boundary |
|---|---|---|
| `gl.nondet.web.render(url, mode="text")` signature | **DOCUMENTATION-CONFIRMED** | Official FetchWebContent example and Web Access page; this confirms API documentation only. |
| Production CaseCourt capture call | **IMPLEMENTED / BLOCKED** | `WEB_RENDER_RUNTIME_ENABLED = False` fails closed before renderer invocation. |

## Stage 6 runtime and frontend status (2026-10-13)

| Capability | Evidence | Status |
|---|---|---|
| CaseCourt contradiction challenge API | Bounded, exact-reference same-contract method and append-only record; Direct Mode tests cover authorization, commitments, caps, replay and rejection. | **IMPLEMENTED / LOCALLY TESTED** |
| Contradiction AI/Equivalence Principle | Documented `gl.nondet.exec_prompt(..., response_format="json")` inside `run_nondet_unsafe`; validators compare classification and decision-bearing fields. Tests inject fake model outputs and mocked validators. | **IMPLEMENTED / LOCALLY TESTED (MOCKED)**; no real consensus |
| Authority edge and supersession checks | Exact stored CaseCourt record binding, provenance classes, capacity bound, kind-aware traversal; fictional Direct Mode reversal flow tested. | **IMPLEMENTED / LOCALLY TESTED**; no node transaction |
| Cross-contract Registry/Evaluator authority | No contract-to-contract reads or claimed verification are used by these features. | **BLOCKED / NOT IMPLEMENTED** |
| Studio runtime probe | Separate diagnostic contract passes cached lint and Direct Mode tests; includes transaction context, optional AI EP, expected failure and forced-disagreement method. | **SOURCE READY / NOT DEPLOYED** |
| Frontend Tribunal surface | Fictional fixtures and read-only provenance disclosures; no live contract adapter or authoritative local-storage inference. | **IMPLEMENTED / LOCALLY TESTED** |
| Test artifact cleanup guard | Root pytest hook redirects GenLayer Test before cleanup; wrapper creates a unique external temp directory; six safety tests and full suite pass. | **IMPLEMENTED / LOCALLY TESTED** |
| Stage 6 regression | `python scripts/run_tests_safe.py tests`: 217 passed, 2 opt-in integration tests skipped. | **LOCALLY TESTED** |
| Cached GenVM lint | Registry, Evaluator, CaseCourt and probe pass 3 cached checks and validation. Upstream lookup failed Windows socket error 10013. | **CACHED LINT ONLY; stable runner BLOCKED** |
| Live consensus, rollback, finality, fees | No service start, deployment, signature, write, or RPC request. | **NOT VERIFIED** |

The Stage 6 sources use the documented storage, transaction-context, nondeterminism, Equivalence Principle and error APIs described in the linked official documentation above. This confirms the documented pattern; local lint and Direct Mode do not prove compatibility with the currently selected stable Studionet runner or any legal correctness. See `V2_STAGE_6_REPORT.md` and the focused Stage 6 documents.

## Stage 7A security and diagnostic readiness (2026-10-13)

| Capability | Evidence | Status |
|---|---|---|
| Closure request bound to current operative decision | Decision ID/digest/request version recorded; stale approval rejection and renewed closure covered by `test_stale_closure_request_cannot_close_a_reversed_decision`. | **FIXED / LOCALLY TESTED** |
| Untrusted grounds in appeal/contradiction prompts | Compact JSON string encoding and hostile multiline tests. | **FIXED / LOCALLY TESTED**; model prompt injection is not eliminated. |
| Freeze enforcement for Stage 6 overlays | Contradiction AI assessment and authority relationship check both linked cases for frozen/active appeal; shared adversarial test. | **FIXED / LOCALLY TESTED** |
| Full Python regression | `python scripts/run_tests_safe.py tests`: **220 passed, 2 skipped**. Two opt-in skips are localnet identity and cross-contract integration. | **LOCALLY TESTED (Direct Mode, mocked AI/EP)** |
| Focused Stage 7 regression | `python scripts/run_tests_safe.py tests/test_case_court_appeals.py tests/test_case_court_contradictions_authority.py`: **32 passed**. | **LOCALLY TESTED (Direct Mode)** |
| GenVM lint/validation | Registry, Evaluator, CaseCourt, and standalone Studio probe passed cached checks; upstream runner lookup failed with `WinError 10013`. | **CACHED LINT ONLY; stable runner BLOCKED** |
| Frontend verification | Lint, typecheck, Vitest (**56 passed**), production build. | **LOCALLY TESTED** |
| Stable chain identity / runner / fee quote | No RPC response this stage; runner catalog fetch remains socket-blocked; no authoritative fee profile. | **BLOCKED / NOT LIVE VERIFIED** |
| Probe browser deploy, transactions, rollback and finality | Probe source is `experiments/stage6/studio_runtime_probe.py`, class `StudioRuntimeProbe`, no constructor args. No deploy or transaction. | **PREPARED ONLY / NOT STARTED** |
| Web Render SSRF, redirects, DNS and pre-return caps | No runtime egress proof; production gate remains `WEB_RENDER_RUNTIME_ENABLED = False`. | **BLOCKED / DISABLED** |

Security detail is in `V2_SECURITY_AUDIT.md`; state guarantees and gaps are in `V2_PROTOCOL_INVARIANTS.md`; user-operated probe steps are in `V2_STUDIO_MANUAL_TEST_PLAN.md`. No contract deployment, transaction, wallet signature, Docker action, package installation, or Web Render activation occurred.
| Output/claim and custom EP logic | **LOCALLY TESTED** | Direct Mode replaces renderer and model with fixtures; not runtime or consensus proof. |
| Source identity, content/excerpt and verification commitments | **IMPLEMENTED / LOCALLY TESTED** | Shared Python/TS vectors; hashes establish byte binding only, not source truth. |
| Redirects, DNS rebinding/private-network egress, renderer pre-read bounds/cost | **BLOCKED** | Not established by the inspected docs or available runtime. A post-render contract length check cannot cap renderer work before return. |
| Actual validator agreement/disagreement, transaction rollback, receipt/finality | **BLOCKED** | No node or network execution. |
| Frontend live write controls | **NOT STARTED / DISABLED** | Web Evidence page is informational; no capture or comparison write adapter is enabled. |

Stage 5 code and limits are described in `V2_WEB_RENDER_IMPLEMENTATION.md`; source hashes and bindings are in `V2_EVIDENCE_PROVENANCE.md`; custom equivalence is in `V2_SOURCE_EQUIVALENCE.md`; freeze recovery is in `V2_FREEZE_RECOVERY.md`.
# Stage 7B runtime status addendum (2026-10-13)

Baseline commit `05fa708afa3d42ea17ba0408a107549963f6dc91` was verified locally. Protected Python baseline before Stage 7B was 220 passed / 2 skipped. New local code has not been run on a compatible live runner. The Stage 7B acceptance runs are recorded in `V2_STAGE_7B_REPORT.md`.

# Stage 8 runtime verification addendum (2026-10-14)

The Stage 8 installed toolchain, cached schema validation, RPC identity attempts, and exact evidence limits are recorded in `V2_GENVM_COMPATIBILITY_MATRIX.md`, `V2_RUNTIME_INTEGRATION_RESULTS.md`, and `V2_TRANSACTION_FINALITY_EVIDENCE.md`.

| Capability | Stage 8 result | Evidence class |
|---|---|---|
| Contract Python syntax/schema for Registry, Evaluator, CaseCourt, StudioRuntimeProbe and three test-only cross-contract callers | All seven passed `genvm-lint check` against the already cached `v0.6.0-rc9` bundle; all report `I200` that a newer runner hash exists. | **LOCALLY TESTED / CACHED SCHEMA ONLY** |
| Direct Mode, preflight, and fixture behavior | Full Python suite 232 passed, 4 skipped; Studio probe tests remain mocked and live deployment scenarios remain gated. | **LOCALLY TESTED** |
| Local Studio RPC | `127.0.0.1:4000` refused the read-only `eth_chainId` request (`WinError 10061`); no local chain ID. | **BLOCKED** |
| Public stable Studionet RPC | One bounded read-only request returned `TypeError: fetch failed`, no HTTP/JSON-RPC response. Prior user-reported identity is kept separate. | **BLOCKED in this execution environment** |
| Cross-contract reads / authorization | Opt-in Registry, Evaluator, and CaseCourt caller tests prepared with loopback/localnet/61127 preflight before deployment; not executed. | **BLOCKED / NOT RUNTIME VERIFIED** |
| Real AI and Equivalence Principle validators | No GenVM execution, model call, validator vote, or disagreement. | **BLOCKED** |
| Native transaction finality and rollback | SDK API locally inspected and frontend branch tests mocked; no transaction/receipt/state readback. | **BLOCKED** |
| Web Render | `WEB_RENDER_RUNTIME_ENABLED = False`; no renderer execution or egress security proof. | **BLOCKED / DISABLED** |

No contract code was modified. No runtime service was started. No deployment, wallet signature, write transaction, or fee was incurred. Stage 9 deployment remains blocked by the prerequisites listed in `V2_STAGE_9_DEPLOYMENT_PREREQUISITES.md`.

No deployment, RPC request, write transaction, wallet signature, or Web Render execution was performed. The four Stage 7B GenVM lint/validation commands passed against cached tooling; upstream runner resolution was blocked by `WinError 10013`, so cached success is not stable runner verification. Native transaction status/finality, validator disagreement/rollback, fee profile, redirect/DNS/private-destination handling, and runner compatibility remain **BLOCKED ON RUNTIME**. The manual Studio procedure remains a separately user-operated diagnostic; read-only review, deployment, write transaction, and fee decisions are distinct gates.

# Stage 9 live diagnostic addendum (2026-10-14)

The user reported four finalized Studionet transactions against the isolated diagnostic probe at `0xbD809d35095A8CC260b9Abd6e65F42d5348800B2`, including an accepted AI/Equivalence Principle result, a GenVM error with unchanged state, and a forced Undetermined/disagreement case where the explorer displayed a leader return while readback stayed unchanged. This is **user-provided explorer/readback evidence**; this run did not independently retrieve receipts. GenLayerJS 1.1.8 exposes distinct `statusName`, `resultName`, and `txExecutionResultName` fields. The frontend now requires explicit `MAJORITY_AGREE` from transaction and finalized receipt, `FINALIZED`, and `FINISHED_WITH_RETURN` before it treats an operation as successful. Read-only `getTransaction` calls for the four supplied hashes failed with `fetch failed`; live SDK field mapping remains to be independently checked.

The probe warning `Detected pickling storage class. Reading storage in nondet mode is not supported` is consistent with the documented prohibition on direct storage access in nondeterministic blocks. The probe and production Evaluator/CaseCourt used bound `self` validation helpers at the earlier Stage 9 starting commit, although source review found no intended direct persistent-map reads in those helpers. The warning's precise cause was unresolved at that point. Registry has no nondeterministic code path. See the continuation below for the source refactor and remaining proof boundary.

## Stage 9 storage-compatibility continuation (2026-10-14)

The previous paragraph records the starting source. Since then, the nondeterministic validation/prompt/equivalence helper logic used by PrecedentEvaluator, CaseCourt, and StudioRuntimeProbe was moved to ordinary module-level pure functions. Callbacks now use only those functions plus already-prepared prompt, evidence, and bounded decoded values; they do not reference `self`. Existing storage declarations and public methods are unchanged, and accepted results are still written only after `run_nondet_unsafe` returns. The CaseCourt Web Render gate remains false.

An isolated A/B callback-capture contract and Direct Mode regression test were added. Both variants execute and persist their expected local results, but Direct Mode does not expose the GenVM pickling warning or verify its absence. The live warning origin remains unresolved and needs a separately approved runtime A/B test using a newly deployed disposable address; the existing diagnostic's deployed bytecode is unchanged. Official current [storage](https://docs.genlayer.com/developers/intelligent-contracts/storage) and [non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism) docs confirm that storage is unavailable inside nondeterministic blocks and describe `gl.storage.copy_to_memory`; they do not identify the specific warning's source.

Updated local evidence: full protected Python **234 passed, 4 skipped**; focused evaluator/Court/probe/A-B suite **128 passed**; Registry, Evaluator, CaseCourt, original probe, and A/B probe cached GenVM lint/schema all pass with `genvm-lint 0.11.1rc2`. Each check reports `I200` for a newer runner hash and upstream resolution fails with `WinError 10013`; no exact stable runner is verified. Frontend lint, typecheck, **70 tests**, and build passed. No deployment, write transaction, signature, runtime trace, RPC query, or Web Render call occurred in this continuation.

The 20-feature acceptance matrix remains intact and is extended with Stage 9B evidence in `V2_ACCEPTANCE_MATRIX.md`. Production readiness is separately assessed in `V2_STAGE_9_PRODUCTION_DEPLOYMENT_GATE.md`: Registry has no storage warning path but is not yet deployment-ready; Evaluator remains blocked pending exact-runner A/B and production AI/EP proof; CaseCourt remains blocked by its additional reviewer, appeal/finality, evidence and Web Render gates.
