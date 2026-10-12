# Stage 2C-R — Evaluator Security Hardening and Verification

**Date:** 2026-10-12  
**Target:** Stable Studionet, chain ID 61999 (not contacted)  
**Recommendation:** **CONDITIONAL GO for a future isolated local integration test only.** Do not infer live validator consensus, stable Studionet compatibility, or legal correctness from this review.

## Scope and changes

The audit found that the Stage 2C evaluator only checked digest syntax. A valid-looking digest could refer to bytes other than the passage submitted for comparison. The evaluator now hashes each exact submitted passage and rejects a mismatch before any LLM call. It also persists an input commitment computed from the evaluation ID, both precedent IDs and verified digests, evidence schema version, criteria version, and exact criteria text.

Files changed for this review:

- `contracts/precedent_evaluator.py` — SHA-256 evidence verification and persisted input commitment.
- `tests/test_precedent_evaluator.py` — digest mismatch rejection and commitment-binding regressions.
- `docs/STAGE_2C_SECURITY_REVIEW.md` — this report.

The Registry was not modified. No dependencies, configuration, network state, or commits were changed.

## Commitment format

Evidence digest v1 is lowercase hexadecimal SHA-256 over the exact submitted passage encoded as UTF-8, with no Unicode normalization, whitespace trimming, JSON serialization, or domain prefix:

```text
hex( SHA-256( UTF8(exact_passage_string) ) )
```

The contract validates the 64-character lowercase hexadecimal representation and recomputes the digest for each parsed passage. A mismatch reverts before model execution. The approach uses the standard Python `hashlib.sha256(...).hexdigest()` interface documented by Python and shown in GenLayer's current Intelligent Contract documentation. [Python hashlib documentation](https://docs.python.org/3/library/hashlib.html), [GenLayer Random feature documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/random)

The input commitment uses SHA-256 over a deterministic, ordered, length-prefixed UTF-8 sequence. Its fields, in order, are:

1. `PrecedentOS-EVALUATION-INPUT-v1`
2. Evaluation ID
3. Record A ID
4. Verified record A passage digest
5. Record B ID
6. Verified record B passage digest
7. Evidence schema version
8. Criteria version
9. Evaluation result schema version
10. Exact criteria string

For each field, the encoding appends its UTF-8 byte length in decimal, `:`, then the field's UTF-8 text. The resulting bytes are SHA-256 hashed. This binds the evaluation identifier, precedent references, the exact evidence passages (through their verified digests), and the schema/criteria version and text to the persisted result. The contract stores this commitment beside the same immutable evaluation record and returns it from `get_evaluation`.

This is a commitment to the supplied passage strings, not proof of source authenticity, Registry inclusion, or identity as a complete source document. The Registry currently accepts a digest as an argument without receiving document bytes, so it cannot verify that its stored digest matches a source document. That Registry API remains a submitter assertion; no production Registry change was made in this review. If a Registry digest is intended to represent a complete document while the Evaluator receives an excerpt, a future integration must define and verify a separate excerpt/document relationship. Caller-supplied precedent IDs remain unverified because cross-contract reads are still out of scope.

## Security review

### Evaluation and schema binding

- Evaluation IDs are validated, checked for prior use, persisted as the record key and record field, and included in the input commitment.
- Evidence schema v1 and criteria version v1 are explicitly enforced, persisted, and included in the input commitment. Evaluation result schema v1 is persisted and included in that commitment.
- Exact criteria text is stored and committed, so changing criteria without changing its version still changes the commitment.
- Verified passage digests and their IDs are both stored and committed. The actual passage strings are not persisted.
- The Evaluator validates its own passage-level evidence commitments. The Registry's document-level digest is still caller-supplied and unverified because it does not receive the document bytes.
- A repeated evaluation ID is rejected before nondeterministic work; no update or delete method exists.
- The accepted output is persisted only after `run_nondet_unsafe` returns. Validation and execution errors occur before the state writes; Direct Mode tests verify that rejected calls do not change the count or existing records.

### Equivalence Principle and decision fields

The leader and validator run the bounded comparison using `gl.nondet.exec_prompt`. The validator validates both responses and compares the classification plus `same_material_issue`, `evidence_sufficient`, `outcomes_differ`, `material_similarity`, and `potential_contradiction`. Deterministic consistency checks reject impossible combinations before persistence. Correct JSON syntax alone cannot pass these checks; valid JSON with the wrong classification, inconsistent flags, or different validator decision fields is rejected by the test harness.

The validator reruns the same prompt and task independently through the documented custom validation pattern. This is independent execution, but not independent ground truth: validators may share model/provider biases, rely on the same incomplete or adversarial evidence, or consistently produce a wrong result. Consensus is not legal correctness, factual authenticity, or proof of precedent registration. [GenLayer non-determinism documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism), [Equivalence Principle documentation](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)

### Bounds and failure handling

Existing limits remain: 4,200 characters for the packet, 1,800 per passage, 600 for criteria, four findings per output list, 160 characters per finding, and 400 characters for rationale. JSON must contain exactly the two expected evidence fields. The result must contain the exact expected fields, strict booleans, supported classification, bounded text, and internally consistent decision data.

Malformed evidence, digest mismatch, unsupported versions, oversized input, duplicate ID, malformed model output, or inconsistent results revert before storage. A validator disagreement/failure and transaction rollback are not simulated by Direct Mode. Limits have not been measured against Studionet calldata, model-context, storage, execution-cost, or fee constraints.

## Git and `artifacts/` investigation

Read-only checks executed:

```powershell
git status --short --untracked-files=all
git ls-files -- artifacts
git diff --name-status -- artifacts
git diff --cached --name-status -- artifacts
git ls-files --deleted
git ls-files
```

Git currently tracks only `README.md`; all project source, test, and report directories are untracked in this checkout. Git reported no tracked or staged changes/deletions under `artifacts/`, and `git ls-files --deleted` was empty. The `artifacts/` directory was absent at review time. Therefore no tracked artifacts are shown as affected. The repository has no tracked-file baseline for the other files, so this check cannot establish whether untracked or ignored generated files existed before an earlier cleanup. No recovery or destructive operation was attempted.

## Commands and results

Regression command, using a dedicated temporary artifacts path and disabling Python bytecode/cache writes in the working tree:

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTEST_ADDOPTS = '-p no:cacheprovider'
$artifact = Join-Path $env:TEMP 'precedentos-stage2cr-artifacts'
gltest tests/test_precedent_evaluator.py tests/test_precedent_registry.py `
  --rootdir C:\Users\USERpc\Documents\PrecedentOS `
  --artifacts-dir $artifact `
  --network localnet `
  --rpc-url http://127.0.0.1:4000/api `
  -q
```

Result: **59 passed in 7.82s.** The suite consists of 30 Evaluator test cases (including parameterized cases) and 29 Registry tests. Coverage includes successful classifications, validator field disagreement, well-formed but incorrect classifications, malformed model output, two correctly formatted but incorrect evidence digests, input commitment binding, invalid inputs and versions, size limits, duplicate prevention, and state preservation. These are mocked Direct Mode tests; they are not an RPC integration run and do not prove validator consensus or rollback after on-chain disagreement.

GenVM lint and validation:

```powershell
$env:PYTHONIOENCODING = 'utf-8'
genvm-lint check contracts/precedent_registry.py
genvm-lint check contracts/precedent_evaluator.py
```

Both contracts passed **3 lint checks and Validation**. The linter warned that it could not query `genlayerlabs/genvm-manager` because the sandbox denied the network socket, so it used cached artifacts. It reported a newer available runner hash `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`. Stable Studionet runner compatibility is therefore still unverified.

An initial run before correcting a test helper passed 58 cases and failed the new criteria-change assertion because the helper did not pass its modified criteria argument. The test was corrected to submit the intended input directly; the final full suite above passed.

## Remaining risks and recommendation

1. The local linter's cached GenVM artifact and Direct Mode do not establish compatibility with the current stable Studionet runner.
2. No local Studio runtime is available, so there is no actual two-contract integration, real LLM execution, validator vote, transaction finality, or rollback evidence.
3. Registry-to-Evaluator identity and digest verification remain unimplemented. Registry registration accepts a digest without the corresponding document bytes. The Evaluator verifies its own digest against the exact passage supplied; future Registry integration must reconcile this with any Registry digest representing a full document.
4. SHA-256 protects integrity of exact bytes relative to a supplied digest; it does not attest to who authored the evidence or whether its claims are true.
5. The consensus rule only checks agreement on six decision-bearing fields and deterministic structural consistency. It cannot establish legal correctness and may reject legitimate cases when validators disagree.
6. Resource and transaction cost limits remain estimates until measured on a compatible local runtime.

**Verdict: CONDITIONAL GO for an isolated local integration test after a compatible Studio/localnet runtime is available and its chain identity and runner are verified.** Keep the test restricted to fictional evidence. Do not begin cross-contract integration or claim live consensus, Studionet compatibility, or legal reliability based on the current evidence.
