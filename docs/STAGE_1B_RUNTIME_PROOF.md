# Stage 1B — Runtime Compatibility and Minimal Evaluation Proof

**Date:** 2026-10-12  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Verdict:** **CONDITIONAL GO for Stage 2** — proceed with contract implementation only after the runner/API selection gate below. The minimal AI/validator pattern passed isolated Direct Mode tests and the experimental contract passed the locally cached GenVM lint/SDK validation. No real validator consensus or Studionet contract execution was performed.

This is a disposable proof of concept. It does not alter the production architecture in `docs/ARCHITECTURE.md` and is not the production `PrecedentEvaluator`.

## Files created

- `experiments/stage1b/contracts/evaluator_poc.py` — isolated Python Intelligent Contract experiment.
- `experiments/stage1b/tests/test_evaluator_poc.py` — Direct Mode tests using mocked LLM responses.
- `docs/STAGE_1B_RUNTIME_PROOF.md` — this report.

The experiment stores only a bounded JSON result string and exists to exercise the public `gl.nondet.exec_prompt` / `gl.vm.run_nondet_unsafe` pattern. It does not call a Registry, write production schemas, or contain case documents/personal data. The runtime dependency header uses the official documentation example hash; that hash has **not** been confirmed as the appropriate current stable-Studionet runner for production.

## 1. CLI `EPERM` investigation

### Cause

Read-only inspection of the installed CLI bundle at `genlayer/dist/index.js` showed that its `ConfigFileManager` constructor calls `ensureFolderExists()` on every startup. That method does:

```js
fs.chmodSync(this.folderPath, 448);
```

`448` decimal is octal `0700`. On this machine `this.folderPath` resolves to `C:\Users\USERpc\.genlayer`. The sandbox permits writes only inside the project/workspace paths and denies metadata changes to that home directory, so Node receives `EPERM` on `chmodSync` before any command runs. This identifies the immediate cause in this execution environment; it does **not** prove the Windows ACL on the user's home directory is incorrect.

### Least-invasive workaround tested

For a single process, set `USERPROFILE` to a fresh temporary directory inside the workspace, then run the CLI. Node's Windows `os.homedir()` followed that process-local environment value. The CLI created its config only in the disposable directory; the directory was removed afterward. No permission, administrator, or original-config change was made.

Exact commands used, in PowerShell form:

```powershell
$env:USERPROFILE = $scratch
genlayer --version
genlayer network list
genlayer network set studionet
genlayer network info
```

Observed: CLI version `0.40.0-rc.3`; network selection succeeded; `network info` reported alias `studionet`, chain ID `61999`, and RPC `https://studio.genlayer.com/api`. Exit code was zero for each command. The process-local override was removed and the scratch config folder cleaned up.

This is a safe way to inspect built-in network resolution under the sandbox, but it intentionally uses a new empty profile. Do not mistake it for reading the user's actual wallet/account configuration. Outside this sandbox, the least invasive options are (a) the same process-local profile override if a fresh profile is acceptable, or (b) a CLI release that does not require the denied chmod operation. Do not weaken ACLs, run elevated, or delete/migrate the existing config as a first response.

## 2. Toolchain compatibility findings

### Versions observed locally

| Tool/package | Installed | Release/compatibility finding |
|---|---:|---|
| Python | 3.12.10 | Meets documented Python >=3.12 requirement for GenLayer Testing Suite. |
| `genlayer-test` | 0.29.2 | Stable release. Its installed package metadata requires `genlayer-py>=0.13,<0.17`; the installed Python client 0.16.3 satisfies this declared dependency. PyPI lists `0.30.0rc*` as prerelease; do not use that as the baseline. |
| `genlayer-py` | 0.16.3 | Stable and within `genlayer-test==0.29.2` requirements. The newest stable PyPI release visible during review is 0.18.0, but it does not satisfy this test-suite version's `<0.17` pin. Do not upgrade it alone. |
| GenLayer CLI (`genlayer`) | 0.40.0-rc.3 | RC, not a stable release. It can resolve the built-in stable Studionet preset correctly, but that does not make the CLI release stable. The official CLI changelog lists 0.38.7 as the last stable entry before 0.40 prereleases; pin/verify the published npm stable tag before selecting it. |
| `genvm-linter` (`genvm-lint`) | 0.11.1rc2 | RC. PyPI identifies 0.11.0 as the stable release, with 0.11.1rc1/rc2 as prereleases. The installed RC passed this POC against its cached SDK artifact, but use the stable linter for a pinned implementation environment unless a later stable version is verified. |
| pytest | 8.4.2 | Installed and executed successfully. |
| Node / npm | 24.14.0 / 11.9.0 | Meets documented Node >=18 prerequisite. |

### Recommended baseline to pin before Stage 2

- Python 3.12.x.
- `genlayer-test==0.29.2` with `genlayer-py==0.16.3` (the pair is compatible under the test suite's declared dependency range and was used successfully in Direct Mode).
- Stable `genvm-linter==0.11.0` (the installed `0.11.1rc2` was used for this experiment, so the stable release still needs to be checked against the chosen runner header without installing it).
- Stable GenLayer CLI release, tentatively `0.38.7` based on the official CLI changelog's stable entries; verify the current npm `latest` tag before pinning. Installed `0.40.0-rc.3` is not the chosen stable baseline.
- A GenVM dependency hash verified for stable Studionet. The docs' example hash used in this POC is accepted by the local cached validator but the linter reports a newer runner hash. Do not freeze the example hash for production until its network/runtime compatibility is verified.

The pinned baseline is a candidate, not yet an end-to-end supported matrix. The official docs state that tool versions must match the target release family; package metadata gives a hard compatibility bound for `genlayer-test` and `genlayer-py`, but no official matrix was found here proving every CLI/linter/runtime combination against stable Studionet.

Sources: [GenLayer CLI changelog](https://github.com/genlayerlabs/genlayer-cli/blob/main/CHANGELOG.md), [genlayer-test on PyPI](https://pypi.org/project/genlayer-test/), [genlayer-py on PyPI](https://pypi.org/project/genlayer-py/), [genvm-linter on PyPI](https://pypi.org/project/genvm-linter/), [tooling setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup), [network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration).

## 3. Minimal evaluation experiment

The fictional evidence pair models potentially conflicting decisions:

- **P-ALPHA:** a fictional panel finds that a permit allowing construction after 22:00 violated a quiet-hours rule; no exception was established.
- **P-BRAVO:** a fictional panel finds that construction after 22:00 did not violate the same rule because an immediate water-main emergency triggered an express exception.

The test prompt asks for a structured category (`material_similarity`, `possible_contradiction`, `insufficient_evidence`, or `no_material_relation`) and decision-bearing fields (`same_material_issue`, `exception_changes_result`) plus a short rationale. It instructs the model to treat passages as quoted evidence, not instructions. The expected cautious classification is factual overlap with a potentially outcome-changing exception; this test does not claim a legal result.

The POC validates IDs, criteria, evidence JSON structure, missing passages, and conservative input-size bounds before the LLM call. The leader calls `gl.nondet.exec_prompt(..., response_format="json")`. The validator requires a `gl.vm.Return`, checks basic structure, independently reruns the same task against the same prompt/evidence, and compares the three decision-bearing fields. Rationale wording may differ. The state write occurs in deterministic code after `run_nondet_unsafe` returns.

The 6,000 / 1,800 / 1,200 / 500 character limits are experimental guardrails only. They are not claimed to be Studionet calldata, context-window, or storage limits.

## 4. Tests and observed results

### Exact commands executed

```powershell
pytest experiments/stage1b/tests -q
$env:PYTHONIOENCODING = 'utf-8'
genvm-lint check experiments/stage1b/contracts/evaluator_poc.py
pytest experiments/stage1b/tests -q
```

### Results

- `pytest experiments/stage1b/tests -q`: **8 passed** (1.55 seconds before the final fixture refinement; 8 passed again in 1.15 seconds after it). Cases cover matching decision fields, opposite classifications, schema-valid wrong leader outcome, differing rationale with matching decision fields, missing evidence, malformed JSON, invalid record ID, and a simulated failed leader result.
- `genvm-lint check experiments/stage1b/contracts/evaluator_poc.py`: **Lint passed (3 checks); Validation passed; Contract `PairEvaluationPOC`; 2 methods (1 view, 1 write).** The first invocation hit a Windows CP1252 stdout encoding exception after generating the linter result; rerun with process-local `PYTHONIOENCODING=utf-8` displayed the successful result.
- Linter attempted to resolve the latest runner via genlayerlabs/genvm-manager, but outbound socket access was blocked. It fell back to cached artifacts. It also reported that a newer runner hash exists than the example header hash. Therefore this is local cached semantic validation, not confirmation of current stable Studionet runner compatibility.
- Tests used Direct Mode's mocked LLM and `direct_vm.run_validator()`. Opposite valid JSON decision fields returned `False`; same decision fields with different rationale returned `True`; `leader_error` returned `False`; malformed/missing input failed before the mocked LLM call.
- The Direct Mode contract call runs the leader path locally; `run_validator()` invokes a separately captured validator function for assertions. This does **not** execute GenLayer multi-validator consensus, and this harness alone cannot prove on-chain rollback/state persistence after a real disagreement. The test intentionally makes no such claim.
- Test-generated `.pytest_cache`, `artifacts`, and `__pycache__` directories were removed after verification. The temporary CLI profile was removed. No GenLayer configuration file was changed.

## 5. Registry reads and finality for production Evaluator

### Documentation-confirmed

- An IC can synchronously read another IC's public view using `gl.get_contract_at(address).view().method(...)`; target state is read as of the current block. Contract calls must be outside nondeterministic blocks. `emit()` writes are asynchronous child transactions and cannot return a synchronous value. [Interacting with Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- GenLayer PY supports `read_contract`, `write_contract`, `wait_for_decision`, `wait_for_finalization`, and `get_transaction`. Reads can select final/nonfinal state; finalization is distinct from a materialized decision. [GenLayerPY API](https://docs.genlayer.com/api-references/genlayer-py/api) [GenLayerPY guide](https://docs.genlayer.com/api-references/genlayer-py)
- Current GenLayer JS transaction docs explain stored lifecycle states and warn that accepted/finalized status should be paired with an execution-success check; advanced lifecycle projection can be unavailable on older Studio backend deployments. [Querying a Transaction](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction)

### Recommended future flow, still requiring a proof

1. Registry exposes a bounded read for each precedent ID and its digest/schema status.
2. Evaluator calls those views synchronously in deterministic code and rejects unknown/invalid IDs.
3. Evaluator prepares bounded evidence and record facts in memory for its nondeterministic task; it does not read Registry during the LLM call.
4. Accepted result is stored by Evaluator only after the nondeterministic validation returns.
5. Client waits for evaluation finalization and checks transaction execution success, then submits a separate Registry link write. Registry verifies the evaluator address and that the referenced evaluation matches the exact record pair through a public evaluator view, if callable and affordable.
6. Client waits for the link write's finalization and reads it back. Show evaluation finality and Registry-link finality as separate states.

Still unverified: whether `gl.get_contract_at(...).view()` works in the current pinned Python runner from the selected Evaluator method and whether its returned value can be safely normalized/copied for a nondeterministic closure; the exact accepted and failed transaction fields on the current hosted Studionet RPC; and whether an Evaluator view can be called during Registry linking with the lifecycle semantics desired. No RPC read against Studionet was made here.

## 6. Security and runtime limitations

- The POC prompt embeds calldata evidence, so it is public to the transaction/validator execution path. Only fictional examples are used.
- XML-like evidence tags and instructions to ignore embedded commands are prompt hygiene, not a robust prompt-injection sandbox. Add adversarial synthetic passages and bounded parsing before production use.
- Independent LLM calls may classify ambiguous cases differently, causing disagreement/rotation or failure. The contract must not persist a leader result after disagreement.
- Matching classifications do not establish legal correctness. Model providers, validator model/prompt templates, and evidence quality can bias results.
- Input/output bound values are local experimental values; Studionet fees, transaction/calldata ceilings, LLM context, timeout, and rotation limits were not measured.
- No human publisher identity, authenticity proof, legal status, or jurisdictional applicability is established by a wallet or digest.
- The asynchronous Registry-link transaction has its own fee, failure, retry, and finality lifecycle.

## 7. Remaining blockers before Stage 2

1. Confirm a stable Studionet GenVM runner hash and pin it; the POC's example hash is not approved for production.
2. Pin a stable CLI release and stable linter version. Verify package metadata/release state and the complete dependency set before any environment changes.
3. Run a small direct-mode proof with the selected stable runner artifact and chosen linter, including the contract-to-contract Registry view pattern (a minimal mock Registry may be used if Direct Mode supports it).
4. Prove real transaction behavior on Studionet later, with explicit transaction authorization: validator disagreement/failure, persisted state behavior, and decision/finalization read-back. This was deliberately outside current scope because deployment/transactions were prohibited.
5. Measure safe evidence and criteria limits and fee/latency feasibility before freezing production interface bounds.

## Verdict

**CONDITIONAL GO for Stage 2.** The installed Direct Mode test suite and cached GenVM lint path can run the minimal evaluation pattern. The tests show that the validator function compares decision-bearing fields rather than just accepting valid JSON, within the mocked harness. The CLI `EPERM` is worked around safely through a process-local temporary profile, and the CLI's built-in Studionet configuration resolves to chain ID 61999.

The proof remains local and mocked. It does not establish real validator consensus, on-chain write rollback after disagreement, the production runner hash, cross-contract Registry reads in this flow, or Studionet lifecycle/fee behavior. Before implementing the full Registry/Evaluator contracts, complete blockers 1–3; reserve Studionet consensus and lifecycle confirmation for the expressly authorized integration stage. No dependency was installed or upgraded, no deployment or transaction was made, and no commit or push was made.
