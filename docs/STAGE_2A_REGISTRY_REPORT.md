# Stage 2A — PrecedentRegistry Implementation Report

**Date:** 2026-10-12  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Status:** **BLOCKED before production implementation**

## Outcome

No production Registry contract or Registry tests were written. The required pre-implementation proof of a contract calling another contract's view could not be completed using the available local runner: Direct Mode rejects loading a second contract class in one process, and no local GenLayer node was listening on `127.0.0.1:4000`. The two-contract view-call mechanism is documented by GenLayer and passes static validation, but runtime support for this repository's selected runner remains unproven. Because the next-stage Evaluator design is meant to rely on Registry reads, implementing against that unresolved boundary would violate the Stage 2A gate.

This report records the blocker rather than treating a mocked/static check as proof. Once a supported multi-contract runtime is available, rerun the isolated probe below. No workaround was applied to the test harness or GenLayer configuration.

## Inputs reviewed

- `docs/ARCHITECTURE.md`
- `docs/BUILD_PLAN.md`
- `docs/STAGE_1_VERIFICATION.md`
- `docs/STAGE_1B_RUNTIME_PROOF.md`

The approved design remains two logical Intelligent Contracts: append-only `PrecedentRegistry` and bounded, AI-assisted `PrecedentEvaluator`. Registry records contain digests and bounded public metadata, never full case documents or personal information. Corpus retrieval and analytics remain off chain. Validator consensus is not legal correctness.

## Capability and environment evidence

| Item | Finding | Evidence level |
|---|---|---|
| Stable Studionet | Chain ID 61999; separate from Studio-dev (61997) | Official docs and Stage 1 CLI preset inspection; no network call this stage |
| Cross-contract view syntax | `gl.get_contract_at(address).view().get_marker(...)` | Official docs confirm pattern; local caller/source contract files pass linter static validation |
| Cross-contract read execution | Not demonstrated | Direct Mode attempt failed at loading second class (`TypeError: only one contract is allowed`); local node port 4000 was unreachable |
| Python GenVM import in host process | Not importable as `genlayer` | `python` import check raised `ModuleNotFoundError`; expected package/runtime separation, but confirms host Python alone is not a GenVM execution environment |
| Local Python test tooling | Python 3.12.10, `genlayer-test` 0.29.2, `genlayer-py` 0.16.3, pytest 8.4.2 | Installed package metadata; Stage 1B Direct Mode used this test-suite/client pair |
| GenVM linter | Installed `genvm-linter` 0.11.1rc2; both probe files pass its cached validation | Executed locally; it could not reach genvm-manager and reported a newer runner hash, so this does not prove selected Studionet runner compatibility |
| CLI | Installed GenLayer CLI 0.40.0-rc.3 | Stage 1B finding; RC, not selected stable toolchain |

The runtime header hash in the disposable probe is the documentation example hash carried over from Stage 1B. It is not confirmed as the correct stable Studionet runner hash and must not be used as production pinning evidence.

Official API references consulted:

- [Interacting with Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) — documented `gl.get_contract_at(...).view()` call.
- [Storage](https://docs.genlayer.com/developers/intelligent-contracts/features/storage) and [Collections](https://docs.genlayer.com/developers/intelligent-contracts/types/collections) — typed persistent fields, `TreeMap`, `DynArray`, and storage patterns.
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context) — `gl.message.sender_address` source for submitter attribution.
- [Testing Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/testing) — Direct Mode and Studio Mode distinction; Direct Mode is local harness behavior and does not establish live consensus.
- [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration) — stable Studionet identity and chain ID.

Documentation confirms the intended API shapes but does not establish successful execution with the installed/cached runtime, transaction finality, or Studionet compatibility.

## Disposable cross-contract view probe

Files created:

- `experiments/stage2a/contracts/view_source_probe.py` — returns a bounded fictional marker from a public view.
- `experiments/stage2a/contracts/view_caller_probe.py` — calls the source using the documented `gl.get_contract_at(...).view()` form.
- `experiments/stage2a/tests/test_cross_contract_view_probe.py` — attempts to load both contracts in Direct Mode and assert the returned marker.

Exact commands and results:

```powershell
pytest experiments/stage2a/tests -q
```

**Result:** failed before exercising the view call. Direct Mode raised `TypeError: only one contract is allowed; first: ViewSourceProbe second: ViewCallerProbe` while loading the second contract class. This establishes a harness limitation for this test arrangement, not that the GenLayer API is unsupported.

```powershell
$env:PYTHONIOENCODING='utf-8'
genvm-lint check experiments/stage2a/contracts/view_source_probe.py
genvm-lint check experiments/stage2a/contracts/view_caller_probe.py
```

**Result:** both passed 3 static checks and validation. The linter could not resolve the current runner because network access was denied and fell back to local cached artifacts; it announced a newer runner hash. This verifies syntax against that cache only.

Local node check:

```powershell
# TCP connect probe to 127.0.0.1:4000, one-second timeout
```

**Result:** not reachable. No node was started and no deployment or transaction was sent.

No production Registry-specific behavior was tested because production implementation did not begin. The Stage 1B mocked Evaluator tests do not substitute for Registry integration tests.

## Intended Registry interface after the proof gate

The following is a design boundary, not an implemented API. Exact storage and return types must still pass the selected stable runner's checks.

- `register_precedent(record_id, evidence_digest, schema_version, metadata_fields)` — deterministic append-only write; validate canonical ID/digest/version and all bounded metadata; record `gl.message.sender_address`; reject duplicates before mutation.
- `has_precedent(record_id)` — deterministic bounded boolean view for future Evaluator checks.
- `get_precedent(record_id)` — deterministic bounded view of ID, digest, schema version, approved public metadata, submitter, and existence behavior; do not return full source/evidence.

No update/delete API. Corrections become a new identifier. Evaluation-reference linking is deferred until authorization and cross-contract result verification are proven. Canonical digest encoding/algorithm and metadata field limits must be frozen before implementation, not inferred from arbitrary size limits.

## Security requirements to carry into implementation

- Reject malformed and oversized inputs before storage writes; validate digest encoding deterministically.
- Keep test fixtures fictional and public; store no complete case text, personal data, secrets, or private evidence.
- Treat submitter address only as transaction attribution, not proof of court identity or record authenticity.
- Ensure rejected writes leave all record maps/indexes unchanged under the selected runtime's transaction semantics.
- Expose bounded, deterministic views only; avoid unbounded iteration or unbounded return values.
- Keep registry records immutable and append-only; do not expose owner/admin mutation that contradicts the approved model.
- Do not imply consensus or registration establishes legal correctness, source truth, or legal authority.

## Unresolved gates

1. Obtain a supported local multi-contract/Studio runtime for the selected stable toolchain, or another documented test method that actually executes two distinct deployed contract classes. Do not bypass Direct Mode's one-contract restriction by mutating its internals.
2. Pin a stable GenVM runner hash and verify both the Registry candidate and cross-view caller against it. Installed linter is a prerelease and uses cached artifacts here.
3. Pass the cross-contract read probe, including typed arguments/return behavior and missing-source behavior, before relying on it in `PrecedentEvaluator`.
4. Confirm the runtime behavior of persistent storage types, `gl.message.sender_address`, rejected-write rollback, and public view encoding with the selected runner. Docs and linter alone are not runtime proof.
5. Studionet execution, transaction success/finality, and live validator/consensus behavior remain unverified and require the separately authorized network verification stage.

## Recommendation

**NO-GO for Stage 2B at this point.** Registry production implementation was intentionally stopped because the required cross-contract read proof and stable runner selection are still unresolved. The current evidence supports the documented API shape and static syntax only. Continue after providing/starting an approved local multi-contract GenLayer runtime (without changing the user's GenLayer config) and confirming a stable runner pin; rerun the probe, then implement Registry with regression tests. No dependencies were installed or upgraded, no config was modified, no contract was deployed, and no commit or push was made.
