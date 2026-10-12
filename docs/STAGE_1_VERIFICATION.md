# Stage 1 — Technical Feasibility and Runtime Verification

**Date:** 2026-10-12  
**Repository:** `Chinny070/PrecedentOS` (`main`)  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Recommendation:** **CONDITIONAL GO** for contract implementation planning; **do not begin contract implementation until the Studionet toolchain and Equivalence Principle proof gates below pass.**

This report records official-documentation findings and local read-only checks separately. It does not claim that contracts have been executed or tested. No contract code was written, no dependencies were installed, and no deployment was attempted.

## 1. Repository and environment inspected

### Repository

- The repository is a Git checkout of `Chinny070/PrecedentOS`, current branch `main`, with `origin` set to `https://github.com/Chinny070/PrecedentOS.git`.
- Present files are `README.md`, `docs/ARCHITECTURE.md`, and `docs/BUILD_PLAN.md`; there are no contract files, tests, dependency manifests, lockfiles, or project-specific setup instructions.
- The approved architecture specifies two on-chain logical components: append-only `PrecedentRegistry` and bounded, AI-assisted `PrecedentEvaluator`. Search/indexing, analytics, graph/lineage views, and exploratory counterfactuals remain off chain. Test inputs must be fictional and publicly shareable; no complete case text or personal information goes on chain.

### Local read-only checks

| Check | Observed locally | Interpretation |
|---|---|---|
| Python | Python 3.12.10 available | Meets the documented Python 3.12+ prerequisite for `genlayer-test`. |
| Python packages | `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, `pytest==8.4.2` | Installed globally; compatibility with current stable Studionet has not been demonstrated. |
| Node / npm | Node v24.14.0, npm 11.9.0 | Available. Official tooling page says Node 18+ for CLI/frontend; that minimum is met. |
| GenLayer CLI | `genlayer` launcher exists; package metadata says `0.40.0-rc.3` | This is a release-candidate CLI. Current docs direct `studio-dev` users to matching RC tooling and warn not to substitute stable `studionet` for studio-dev (or vice versa). Treat this installed CLI as **not verified for the stable target**. |
| Linter | `genvm-lint` launcher exists; `genvm-lint --version` reports `0.11.1rc2` | Linter is a release candidate; exact compatibility with stable Studionet/Python runtime is unverified. |
| Test runner | `gltest` launcher exists; Python package metadata is present | `gltest --version` printed `pytest 8.4.2`, so this invocation did not establish an independent `gltest` CLI version. |
| CLI network introspection | `genlayer --version`, `genlayer network list`, and `genlayer network info` could not complete | CLI startup attempted `chmod C:\Users\USERpc\.genlayer` and received `EPERM`. No configuration or permission change was attempted. The selected local network alias/RPC/chain ID therefore remains unverified. |
| Local Studio | No project-local `.venv`, `venv`, or `node_modules` directory found | Does not prove a local Studio/Docker stack is absent elsewhere; not checked or started. |

These are environment observations only. Package presence does not prove runtime compatibility, access to validators, an available LLM provider, network connectivity, or successful consensus execution.

## 2. Documentation-confirmed technical findings

Official GenLayer documentation was consulted on 2026-10-12. Links below are direct official references.

### Intelligent Contract syntax and imports

- A contract file begins with a GenVM dependency/version comment such as `# { "Depends": "py-genlayer:<runtime-hash>" }`, followed by `from genlayer import *` and a class extending `gl.Contract`. Public read methods use `@gl.public.view`; state-changing methods use `@gl.public.write`. [Your First Intelligent Contract](https://docs.genlayer.com/developers/intelligent-contracts/first-intelligent-contract) [Introduction](https://docs.genlayer.com/developers/intelligent-contracts/introduction)
- The runtime comment pins the GenVM Python runner by content hash. The example hash in docs is an example, not a version selection for this repository. Select and verify the correct stable Studionet runner hash before implementation.
- Persisted fields require supported types. Docs recommend `DynArray[T]` instead of `list[T]`, `TreeMap[K,V]` instead of `dict[K,V]`, and sized integers rather than built-in `int` for storage. Custom storage dataclasses require `@allow_storage` and `@dataclass`. [Storage quick reference](https://docs.genlayer.com/developers/intelligent-contracts/features/storage) [Dataclasses](https://docs.genlayer.com/developers/intelligent-contracts/types/dataclasses)

### State and nondeterministic execution

- Deterministic methods read and mutate contract fields. Persistent writes must occur in deterministic execution after the non-deterministic result has returned; storage cannot be directly read or written from a nondeterministic block. For values needed in a nondeterministic block, docs describe copying storage data to memory using `gl.storage.copy_to_memory`. [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism) [Storage](https://docs.genlayer.com/developers/intelligent-contracts/features/storage)
- For PrecedentEvaluator, retrieve/validate Registry record facts deterministically, combine only bounded inputs needed for comparison, run the LLM task through the Equivalence Principle, validate its result, and only then persist the accepted record. The exact contract-to-contract result and memory preparation pattern needs a focused proof because nondeterministic code cannot call another contract.

### Supported LLM and Equivalence Principle patterns

- `gl.nondet.exec_prompt(prompt, response_format="json")` is a documented LLM call. It must run inside a function invoked through the Equivalence Principle. JSON mode improves parseability but does not prove semantic correctness or guarantee the expected schema. `strict_eq` is inappropriate for open-ended LLM outputs. [Calling LLMs](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms) [Prompt and data techniques](https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts)
- `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` is documented for custom leader/validator logic. A validator can rerun the same task, inspect `leader_result.calldata`, and compare decision-bearing fields. Unhandled validator exceptions count as disagreement. [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- `gl.eq_principle.prompt_comparative(fn, principle=...)` is documented as a convenience pattern: leader and validators run the task and an LLM compares outputs against the stated principle. It can compare meaning, but comparison quality depends on the rule and model/provider configuration. For PrecedentEvaluator, a custom validator that reruns the task and programmatically compares decision fields is the clearer first pattern; avoid relying on unstable internal template imports.
- `prompt_non_comparative` lets validators assess a leader result against original evidence and explicit criteria without generating a second answer. It is acceptable only when validators actually inspect the evidence; a schema/enum check alone is not consensus validation.
- Consensus is agreement under the implemented equivalence rule. It does not prove that a legal analysis is correct, unbiased, complete, or binding.

### Failure and disagreement handling

- `gl.vm.run_nondet_unsafe` validator returning `False` or throwing an unhandled exception is treated as `Disagree`. `gl.vm.run_nondet` offers managed error comparison callbacks; docs generally recommend the unsafe variant when application-specific error handling is needed. [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- GenVM distinguishes successful returns, `UserError`, `VMError`, and `InternalError`; resource-limit errors can occur automatically. A malformed LLM result or disagreement should not fall through to persisting the leader's unverified result. Use deterministic input errors for invalid IDs/limits and explicitly classify LLM/provider errors and retries. [Error Handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling)
- At transaction level, SDK docs distinguish decision from finalization. `wait_for_decision` waits for a stored decision; `wait_for_finalization` also waits for fee settlement/refunds. Current Studionet may not expose every advanced lifecycle RPC, so rely on the status surface actually supported by its endpoint. [GenLayerPY](https://docs.genlayer.com/api-references/genlayer-py) [GenLayerPY API](https://docs.genlayer.com/api-references/genlayer-py/api) [Querying a Transaction](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction)

### Contract interaction and deployment

- Intelligent Contracts can synchronously read another IC's public view via `gl.get_contract_at(address).view().method(...)`. Cross-contract writes use `.emit(...)` and are asynchronous child transactions, not synchronous calls returning a result. [Interacting with Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages)
- Direct deployment is documented as `genlayer deploy --contract <path>` after choosing/verifying the network. SDKs expose deploy/write/read and fee estimation. Deployment and write calls create consensus transactions; read methods are non-mutating. [CLI deployment](https://docs.genlayer.com/developers/intelligent-contracts/deploying/cli-deployment) [GenLayer JS contract methods](https://docs.genlayer.com/api-references/genlayer-js/contracts) [GenLayerPY API](https://docs.genlayer.com/api-references/genlayer-py/api)
- For the approved two-contract model, suggested interface is Registry deployed first, then Evaluator configured with the Registry address. Evaluator can synchronously query Registry views in deterministic context. Store the accepted evaluation in Evaluator. After finalization, a separate Registry write can link the evaluation, as defined by the approved architecture. Do not substitute `emit` unless its child transaction/failure lifecycle has been tested.

### Studionet identity

- Official docs identify stable hosted Studionet as `studionet`, hosted at `studio.genlayer.com`, chain ID `61999`. `studio-dev` is a separate release-candidate environment with chain ID `61997`; the two presets and consensus deployments must not be mixed. [GenLayer Studio](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio) [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- CLI docs prescribe `genlayer network set studionet` and `genlayer network info` before funding/signing; deployment example uses `genlayer deploy --contract contracts/my_contract.py`. These are documented commands, but not run here because the local CLI fails before command execution. Setting a network changes local CLI configuration; deployment is explicitly state-changing.

### Testing tools and SDK versions

- `genlayer-test` is documented as a pytest-based suite. Direct Mode runs in process, can mock LLM calls, and exposes `direct_vm.run_validator()` to test validator agreement/disagreement. Studio Mode targets a running Studio/network for consensus integration. Docs state Python 3.12+; commands shown include `pytest tests/ -v`, `gltest tests/ -v`, `gltest --network studionet`, and `genvm-lint check <contract-file>`. [Testing Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/testing) [Tooling setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup) [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- Current documentation distinguishes stable Studionet tooling from Consensus v0.6 / Studio-dev prerelease tooling. It says `genlayer-py` v0.19 RC is needed for the Studio-dev preview and must not be confused with stable Studionet. Do not upgrade the current environment blindly; resolve the stable-compatible version set from official release notes and verify it as one compatible toolchain. [GenLayerPY](https://docs.genlayer.com/api-references/genlayer-py) [Consensus v0.6 migration](https://docs.genlayer.com/developers/consensus-v06-migration) [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- The `genlayer-test` docs list installation via `pip install genlayer-test`; the CLI tooling docs describe the GenLayer CLI and SDK setup. These are setup instructions only and were not run.

## 3. Recommended implementation pattern

### PrecedentRegistry interface proposal

Conceptual interface only; exact GenVM types, argument encoding, and storage types must be confirmed before code.

| Method | Intended behavior |
|---|---|
| `register_precedent(record_id, digest, schema_version, metadata)` | Deterministic write. Reject duplicate ID, malformed digest, unsupported schema, and fields above verified limits. Append record with `gl.message.sender_address`. |
| `get_precedent(record_id)` | Bounded view returning existence plus registered digest/version/metadata/submitter. Return encoding needs verification. |
| `link_evaluation(record_id, evaluator_address, evaluation_id)` | Deterministic append-only write after evaluation finalization. Verify caller authorization and preferably verify evaluator result/pair via its public view if the cross-contract interface supports this safely. Idempotent duplicate behavior must be specified. |
| `get_evaluation_refs(record_id, cursor_or_start, limit)` | Bounded view. Pagination types/limits must be chosen after SDK and storage verification. |

Registry data is public and append-only. A caller-supplied record ID needs a replay/uniqueness policy; sender address is not identity verification.

### PrecedentEvaluator interface proposal

| Method | Intended behavior |
|---|---|
| Constructor | Receive the Registry address and any immutable schema/criteria configuration. Confirm supported `Address` constructor argument and storage type. |
| `evaluate_pair(evaluation_id, record_a_id, record_b_id, evidence_packet, criteria_version)` | Deterministic validation and Registry existence reads; bound input lengths; perform one bounded LLM analysis and independent validator task through `run_nondet_unsafe`; persist only after the Equivalence Principle returns accepted output. |
| `get_evaluation(evaluation_id)` | Bounded view returning IDs, outcome, evidence digest, criteria/schema version, concise rationale/citation refs, and submitter. |
| `get_evaluation_pair(evaluation_id)` | View optimized for Registry verification of that evaluation's exact pair and result. |

Avoid nested/dynamic Python objects in storage until the current runner's typed storage and calldata support is demonstrated. A conservative candidate is a fixed record with strings, fixed outcome code, and bounded flat arrays/fields using documented storage types. Do not select this storage layout without testing serialization and size behavior.

### Validator pattern: compare decision fields, not JSON shape

Candidate `run_nondet_unsafe` flow, expressed without implementation code:

1. Leader prompt receives both supplied fictional excerpts and fixed criteria and returns JSON with `outcome`, `material_facts`, and `evidence_spans`.
2. Contract validates basic parse/type/enum/length constraints; these checks only reject malformed output and do not establish correctness.
3. Validator independently reruns the same evaluation from the same source evidence and criteria.
4. Validator rejects unless the leader result and independent result agree on the exact decision-bearing `outcome` and required record/evidence identifiers. Reasoning text may differ; evidence span agreement policy must be explicitly decided and tested. Optionally compare normalized fact labels if stable enough.
5. Only the accepted leader result is written to Evaluator storage after the nondeterministic call returns. A leader error, invalid output, or disagreement results in transaction failure/rotation according to protocol behavior; no fallback writes leader output.

Using a separate `prompt_comparative` wrapper is an alternative if direct comparison of rich outputs is preferred. The initial prototype should compare both approaches only if the exact wrapper and Studio support can be verified; the custom decision-field pattern is preferred for transparent test assertions.

## 4. Minimal fictional conflicting-precedent test

Use two invented, public test records with no real names, institutions, case numbers, or real jurisdiction claims. Example:

- **P-ALPHA / “Northbridge Night-Work Permit”**: a fictional panel finds that a municipal permit allowing construction after 22:00 violates a fictional quiet-hours rule; the permit contains no emergency exception.
- **P-BRAVO / “Rivermark Emergency Repair Permit”**: a fictional panel finds that after-22:00 work did not violate the same fictional rule because the record establishes an immediate water-main emergency and the ordinance has an express emergency exception.

Supply short synthetic excerpts for each record, a shared fictional rule excerpt, and explicit criteria: identify the material rule and exception; distinguish factual similarity from outcome conflict; return `material_similarity`, `possible_contradiction`, `insufficient_evidence`, or `no_material_relation`; explain which fact changes the result; cite only supplied excerpt labels. Correct cautious result should indicate factual overlap but explain that the emergency exception may distinguish the outcome, so the records are not necessarily contradictory. A second test removes the emergency fact/exception excerpt; the required result becomes `insufficient_evidence` or a possible conflict, according to frozen criteria.

This is an evaluation fixture, not a legal benchmark. Freeze the expected labels before running validators to avoid scoring after the fact.

## 5. Proving substantive validator evaluation

### Local/direct-mode proof (deterministic test)

Use `genlayer-test` Direct Mode with mocked LLM responses and its documented `direct_vm.run_validator()` facility:

1. Give leader and validator outputs the same valid JSON schema but the same `outcome`; expect validator acceptance.
2. Keep schema, IDs, and all formatting valid, but change only the validator's outcome from `possible_contradiction` to `no_material_relation`; expect validator disagreement (`False`).
3. Keep the outcome matching but alter only free-form rationale; assert the frozen policy (expected to allow wording variation) rather than accidentally requiring prose equality.
4. Test `insufficient_evidence`, missing/oversized fields, malformed response, and leader/validator error mismatch.
5. Inspect persisted state after accepted execution and confirm it contains only the accepted structured result; confirm disagreement/error does not persist a result.

This proves the contract validator logic consults decision-bearing data in the harness. It does **not** prove that real independent Studionet validators execute the task or that their semantic judgments are legally correct.

### Studionet integration proof

- Submit the frozen fictional fixture on stable Studionet and retain transaction hash, chain ID, SDK/runner version, final lifecycle receipt, evaluator state, and fee details.
- Confirm real transaction succeeds and result is persisted only on the accepted path. If Studio exposes validator/node logs, inspect them for independent task executions and record the evidence; docs describe Studio validator controls/logs but availability on hosted Studionet must be checked.
- Demonstrate real-validator disagreement only if current Studionet validator configuration can safely and deterministically induce it. Otherwise report that disagreement is proven in Direct Mode but not forced on the hosted network. Do not claim this test solely because different validators are configured.
- To establish the validation rule is not schema-only on Studionet, use two valid, same-schema outputs with opposite decision fields in a supported local validator test, and inspect any available Studionet execution traces. The network's consensus result alone does not reveal every internal validator computation.

## 6. Dependencies and environment setup (not performed)

### Required for planned implementation/testing

- Python 3.12+.
- A stable-Studionet-compatible GenVM Python runtime hash embedded in each contract's dependency comment.
- A compatible version set for `genlayer-test`, `genlayer-py` or GenLayer CLI/client, and `genvm-lint` selected from official stable-network documentation/release metadata.
- `pytest` and `genlayer-test` for direct-mode unit/validator tests.
- GenLayer CLI for network configuration/deployment if CLI is selected, plus a Studionet account with test funds for authorized integration transactions.
- Optional local GenLayer Studio/Docker only if using local Studio Mode. It is useful for controlled validators and fast testing, but local behavior is not proof of hosted Studionet behavior.

### Current environment caveats

- Installed versions: Python 3.12.10; `genlayer-test` 0.29.2; `genlayer-py` 0.16.3; `pytest` 8.4.2; GenLayer CLI npm package 0.40.0-rc.3; `genvm-lint` 0.11.1rc2; Node 24.14.0; npm 11.9.0.
- CLI and linter are RC versions. The target is stable Studionet. Their compatibility must be resolved before using them; do not point release-candidate tooling at stable Studionet by assumption.
- CLI startup could not read/inspect configured network because it failed while attempting to chmod `C:\Users\USERpc\.genlayer`. The directory/config was not modified. An approved way to run CLI introspection with a writable config home, or a supported read-only alternative, is needed before local network configuration is verified.
- No tests or linter checks were run: there is no contract source to check. Version probes were read-only. No network calls/deployments were made.

## 7. Exact commands documented by GenLayer

Commands below are copied from or directly reflect current official documentation. Commands that change configuration, install software, execute tests with external calls, or deploy were **not run** in this verification phase.

### Read-only probes (run here unless noted)

```powershell
python --version
python -m pip show genlayer-test genlayer-py pytest
node --version
npm --version
genlayer --version
genlayer network list
genlayer network info
gltest --version
genvm-lint --version
```

The first package/runtime checks succeeded. The GenLayer CLI commands failed on sandbox filesystem permissions before returning versions/network data. `gltest --version` printed pytest's version and did not establish its own CLI version.

### Documented setup and verification commands (not run)

```powershell
# Install only after selecting and pinning the stable-compatible versions.
pip install genlayer-test

# Direct Mode tests; no network consensus.
pytest tests/ -v

# GenLayer Studio test runner examples from the docs.
gltest tests/ -v
gltest --network studionet

# Static/safety and SDK semantic lint for a contract source file.
genvm-lint check contracts/my_contract.py

# Select and inspect stable Studionet. Setting the alias changes local CLI config.
genlayer network set studionet
genlayer network info

# Deployment example only; state-changing and deliberately not executed.
genlayer deploy --contract contracts/my_contract.py
```

The docs show the Studio test invocation and network option as examples; confirm the accepted combined argument form with the installed stable-compatible `gltest --help` before relying on one CI command. Similarly, `genlayer deploy` must wait for approval and Stage 1 acceptance. Never use `studio-dev`/61997 for the approved stable target.

## 8. Unverified assumptions, risks, and limitations

1. **Installed RC CLI/linter vs stable Studionet:** version compatibility is unverified and currently a blocker to reliable local network inspection.
2. **Python SDK version pairing:** installed `genlayer-py==0.16.3` and `genlayer-test==0.29.2` are present, but current docs do not in the pages consulted establish a stable-compatible version matrix for this exact pair.
3. **AI result shapes:** docs show JSON LLM output and custom validators, but our structured nested evaluation type and maximum prompt/result sizes need runtime proof.
4. **Storage copying/inter-contract reads:** docs confirm contract view calls and that contract calls must stay outside nondeterministic blocks. They do not demonstrate this exact flow: evaluator reads registry state, copies/normalizes it into a bounded nondeterministic prompt, and validates it.
5. **Studionet validator observability:** local Studio can configure validators and inspect logs. Whether hosted stable Studionet exposes equivalent controls/log detail is not confirmed.
6. **Dissent reproducibility:** a mocked direct-mode validator can be deliberately made to disagree. Real hosted model outputs are nondeterministic; forcing a specific dissent on stable Studionet may not be controllable.
7. **Transaction lifecycle coverage:** SDK exposes decision/finalization helpers, but current Studionet advanced lifecycle RPC availability is deployment-dependent. Application must use what the endpoint actually exposes.
8. **Fees and service availability:** no fee, latency, model-provider availability, or calldata/storage ceiling was measured. These are acceptance gates before contract sizing is frozen.
9. **Legal and data risks:** validators do not establish correctness; public calldata/state cannot protect sensitive evidence; wallet addresses do not authenticate legal publishers. Fictional-only fixtures remain required.
10. **Upgradeable code/admin policy:** docs provide an upgradability feature, but this MVP must explicitly choose freeze or controlled upgrade behavior and document privileged authority before deployment.

## 9. Acceptance criteria before implementation GO

Implementation may begin only when all of the following are true:

- [ ] Stable Studionet is confirmed as chain 61999 via official docs and a locally usable network introspection path; no Studio-dev configuration is selected.
- [ ] Stable-compatible CLI/client, GenVM runner hash, `genlayer-test`, and `genvm-lint` versions are pinned from official sources; the current RC CLI/linter are either replaced later with approved stable versions or verified compatible without misrouting transactions.
- [ ] A minimal Direct Mode proof demonstrates `run_nondet_unsafe` with independently rerun fictional evaluation, field-level comparison, schema-valid opposite-outcome rejection, rationale variation policy, and no persistence on disagreement.
- [ ] The selected contract signatures/types compile/lint in the pinned runner, including Registry view consumption by Evaluator and deterministic post-consensus storage writes.
- [ ] Evidence, criteria, and output size limits have a measured basis; public-only data handling is enforced in test fixtures and UI design.
- [ ] Transaction failure/disagreement and decision/finalization handling are defined from current SDK/Studionet lifecycle semantics.
- [ ] Fee/latency feasibility is reviewed using measured dry-run/direct or authorized test results; no final contract storage or input schema depends on unverified limits.
- [ ] The fictional conflicting-precedent fixture and expected outcomes are frozen before testing.

### Recommendation

**CONDITIONAL GO.** The official documentation supports the core concept: Python Intelligent Contracts, persistent state, `gl.nondet.exec_prompt`, custom independent validators via `gl.vm.run_nondet_unsafe`, comparative equivalence helpers, and stable Studionet at chain ID 61999. The repository also has Python 3.12 and test/lint packages available.

However, the local GenLayer CLI and linter are release candidates, and the CLI cannot currently report the configured network because startup hits a sandbox permission error on `C:\Users\USERpc\.genlayer`. No contract compilation, mocked validator proof, Studionet RPC read, transaction, or live validator behavior has been tested. Before implementation code, complete the version/API pinning and direct-mode substantive-validator proof, then obtain a permitted way to verify stable Studionet configuration. Deployment remains outside this stage and requires separate authorization.
