# Stage 2C — Standalone PrecedentEvaluator Implementation Report

**Date:** 2026-10-12  
**Target deployment:** GenLayer stable Studionet, chain ID 61999 (not used)  
**Scope:** Standalone pairwise evaluator. No Registry calls, deployment, or network transactions.  
**Recommendation:** **CONDITIONAL GO for a future isolated integration test after the local runtime is available; NO-GO for Studionet deployment or any claim of live validator consensus.**

## Summary

Implemented `contracts/precedent_evaluator.py` as a separate Intelligent Contract. It accepts two caller-supplied precedent IDs, two digest strings, a bounded pair of fictional evidence passages, versioned schemas and explicit bounded criteria. It calls the documented GenLayer LLM API inside an Equivalence Principle custom validator path. Validators independently rerun the comparison and must agree on the classification and five decision-bearing boolean fields. Concise rationale and bounded lists of similarities, differences, and contradiction signals are persisted only after `gl.vm.run_nondet_unsafe` returns.

The evaluator does **not** call or read `PrecedentRegistry`. IDs and digests are caller assertions; they do not prove registration, source authenticity, or a match between the digest and passage bytes. This explicit unverified boundary is recorded in the contract docstring and this report. No production Registry file was modified.

## Files created or modified

- Created `contracts/precedent_evaluator.py`.
- Created `tests/test_precedent_evaluator.py`.
- Created `tests/fixtures/fictional_evaluations.json`.
- Created `docs/STAGE_2C_EVALUATOR_REPORT.md`.
- No Registry or approved architecture file was modified.

## Contract interface and behavior

### Write

`evaluate_pair(evaluation_id, record_a_id, record_a_digest, record_b_id, record_b_digest, evidence_packet_json, evidence_schema_version, criteria_version, criteria)`

- Requires unique, bounded uppercase ASCII identifiers; distinct precedent IDs; lowercase 64-character hexadecimal digests; supported schema/criteria versions; exactly two nonempty passages; bounded packet, passage, and criteria sizes.
- Supports evidence schema v1 and criteria version v1. Persists evaluation schema version v1 and the exact bounded criteria text so the evaluated rule remains visible with the result.
- Builds a JSON-escaped prompt that treats passages as untrusted quoted data, directs the model to ignore instructions inside evidence, and prohibits outside facts or unsupported authenticity claims.
- Requests a JSON result via `gl.nondet.exec_prompt(prompt, response_format="json")`.
- Validates exact output fields, classification enum, strict booleans, finding/rationale bounds, and deterministic consistency between classifications and decision flags. Invalid output raises before any storage write.
- Runs `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. The validator rejects leader errors, validates the proposed result, independently reexecutes the same bounded task, and compares `classification`, `same_material_issue`, `evidence_sufficient`, `outcomes_differ`, `material_similarity`, and `potential_contradiction`. Rationale and descriptive finding text may vary.
- Writes an append-only record keyed by evaluation ID only after the Equivalence Principle call returns. A repeated ID is rejected; no update/delete methods exist.
- Stores IDs, supplied digests, evidence/criteria/result schema versions, criteria text, classification, structured decision fields, and bounded explanations. It does not store passages.

### Views

- `has_evaluation(evaluation_id)`
- `get_evaluation(evaluation_id)` — returns a bounded flat string map; missing IDs return `{}`.
- `get_evaluation_count()`

## Fictional cases and security boundaries

`tests/fixtures/fictional_evaluations.json` contains only invented examples for (1) matching outcomes, (2) similar issues with a stated emergency exception explaining different outcomes, (3) same issue and opposite outcomes without a supplied distinction, and (4) insufficient evidence. The Direct Mode tests compute SHA-256 digest strings from the fictional passage bytes off chain to provide well-formed test inputs. The contract checks digest encoding and binds the supplied values into the prompt and stored evaluation, but **does not recompute or verify the digest against the passage**.

Evidence text is passed in transaction arguments to the nondeterministic task and therefore must remain fictional/public. Only bounded criteria and the accepted structured summary are stored. Validators can still be misled by false, incomplete, or adversarial evidence; prompt-injection instructions reduce but do not eliminate that risk. Validator agreement is not legal correctness or authenticity.

## API verification and runtime compatibility

Current official GenLayer documentation reviewed for this implementation confirms:

- `gl.nondet.exec_prompt` supports JSON response mode for LLM calls. [Calling LLMs](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms)
- `gl.vm.run_nondet_unsafe` accepts leader and custom validator functions; the documented custom pattern checks a `gl.vm.Return`, reruns the task independently, and compares decision fields. The Equivalence Principle page states that rejected proposals rotate and an undetermined transaction does not modify contract state. [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- Nondeterministic work must stay out of deterministic state mutation; state writes follow the equivalence call. [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- LLM errors/malformed outputs should cause validator disagreement/retry rather than accepting a broken leader result. [Error handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling)
- Direct Mode mocks the leader nondeterministic result and exposes captured validators separately; it intentionally does not run network consensus. [Direct Mode testing API](https://docs.genlayer.com/api-references/genlayer-test/direct)

Local installed versions: `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, `genvm-linter==0.11.1rc2`. The evaluator uses the same runner header hash as the existing Registry and Stage 1B POC: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. The installed linter validated against its local cache, reported a newer cached runner hash `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`, and could not query upstream due a socket permission error. Neither runner hash is established here as the hash required by stable Studionet. Local GenLayer Studio remains unavailable; no stable-network compatibility or live execution was demonstrated.

## Tests and exact results

Final command (temporary artifacts path avoids the plugin clearing the repository's default `artifacts/` directory):

```powershell
$artifact = Join-Path $env:TEMP 'precedentos-stage2c-artifacts'
gltest tests/test_precedent_evaluator.py tests/test_precedent_registry.py `
  --rootdir C:\Users\USERpc\Documents\PrecedentOS `
  --artifacts-dir $artifact `
  --network localnet `
  --rpc-url http://127.0.0.1:4000/api `
  -vv --tb=short
```

Result: **56 passed in 5.78s** — 27 Evaluator cases (including parameterized cases) and 29 existing Registry regression cases. Tests use mocked LLM responses and Direct Mode. The `--network localnet` flag selects the local test configuration, but these Direct Mode tests do not contact the RPC endpoint or deploy contracts.

GenVM lint and semantic validation:

```powershell
$env:PYTHONIOENCODING = 'utf-8'
genvm-lint check contracts/precedent_evaluator.py
```

Result: **Lint passed (3 checks); Validation passed.** The command warned it could not resolve the latest GenVM version from the upstream manager and used cached artifacts; it also reported a newer runner is available. This does not establish Studionet runner compatibility.

Coverage includes matching cases; explained divergent outcomes; potential contradiction; insufficient evidence; valid JSON with wrong classification; conflicting leader/validator decision fields; rationale variation; malformed model output; internally inconsistent result; malformed/missing evidence; oversized evidence/criteria; invalid IDs/digests/versions; duplicate evaluation ID; failed second operation preserving existing evaluation; missing-view behavior; and same-ID pair rejection.

### Direct Mode limitations

Direct Mode executes the leader function locally and captures the validator for a separate explicit `run_validator()` call. It does not apply validator votes to the already-completed local state mutation or emulate consensus rollback. Tests demonstrate that a mocked validator returns `False` for differing decision fields, and separately demonstrate that input/model-output failures leave state unchanged. They **do not** prove that a real validator rejection/undetermined transaction preserves on-chain state; that behavior is documented by GenLayer but remains untested in Studio or Studionet.

## Test-runner artifact note

The first evaluator-only command used the default test configuration. Its output explicitly reported `Clearing artifacts directory: artifacts`; the directory's contents were not inventoried before that run, so any ignored/generated contents there may have been cleared. The directory was observed empty afterward. Subsequent complete runs used the dedicated temporary path shown above. This was the only known test-tool side effect; no tracked file was removed by the test command.

## Unverified risks and limits

1. No real leader/validator executions, validator diversity, consensus acceptance, rotation, failure, or finality were observed. The existing Studio unavailability remains a blocker for integration testing.
2. The current CLI/linter/runtime compatibility tuple for stable Studionet is not pinned by this stage; lint used a cached artifact with an unresolved runner update notice.
3. Direct Mode's mocked JSON path and separate validator invocation are not equivalent to GenVM's deployed transaction pipeline. In particular, rollback after rejected validation is not tested.
4. Caller-supplied IDs/digests are not checked against PrecedentRegistry or recomputed from the evidence. Do not label results as verified registered precedents. Future integration must add a verified cross-contract capability or another approved proof mechanism.
5. This version accepts only evidence schema 1 and criteria version 1. The digest algorithm/canonical source-document encoding is not enforced on chain.
6. Input bounds (packet 4,200 characters; each passage 1,800; criteria 600; four findings per list of 160 characters; rationale 400) are engineering caps, not measured Studionet calldata, context, storage, or fee limits. Validators may incur multiple model calls; cost and availability were not measured.
7. A digest's valid hex format is not evidence that its source is genuine. A model's structured result and validator agreement can both be wrong.
8. No exact on-chain time/transaction metadata, source identity verification, persistence cost, or public data retention guarantees were tested.

## Recommendation

**CONDITIONAL GO for isolated integration testing only after a usable local GenLayer Studio runtime is available and its observed chain ID is confirmed as localnet 61127.** The standalone contract can proceed to that test without any Registry call. Do not begin Registry integration, claim verified precedent identity, deploy to Studionet, or claim consensus/finality based on these Direct Mode results. Before Studionet deployment, pin the compatible runner/toolchain and measure size/fee behavior.
