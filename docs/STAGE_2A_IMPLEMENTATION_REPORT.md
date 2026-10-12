# Stage 2A-I — PrecedentRegistry Implementation Report

**Date:** 2026-10-12  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Recommendation:** **CONDITIONAL GO for Stage 2B planning/implementation after runner pin review; NO-GO for deployment or Evaluator integration until the cross-contract and stable-runtime gates pass.**

## Summary

Implemented a small append-only `PrecedentRegistry` Intelligent Contract, fictional test fixtures, and Direct Mode tests. The contract stores a SHA-256-style lowercase hex digest, schema version 1, bounded fictional/public metadata labels, the transaction sender, and a monotonically increasing registration sequence. It provides deterministic existence, record, and count views. There are no update/delete methods, full case text fields, personal-data fields, evaluation linking, or cross-contract calls.

The installed Direct Mode suite ran **29 tests successfully**. GenVM lint and validation passed **3 checks**. These results support deterministic contract logic under the installed Direct Mode and static validation against locally cached SDK artifacts. They do not demonstrate stable Studionet runner compatibility, local Studio execution, cross-contract reads, or live transaction behavior.

## Files created

- `contracts/precedent_registry.py` — production Registry contract.
- `tests/test_precedent_registry.py` — Direct Mode unit tests.
- `tests/fixtures/fictional_precedents.json` — fictional-only records and fixed-format digests.
- `docs/STAGE_2A_IMPLEMENTATION_REPORT.md` — this report.

No existing architecture or Stage 1/2A documents were edited. No Evaluator, deploy script, UI, or integration test was added.

## Contract interface

### Write

```text
register_precedent(
    record_id: str,
    evidence_digest: str,
    schema_version: u32,
    jurisdiction: str,
    decision_date: str,
    category: str,
) -> None
```

Registration is deterministic. Input validation and duplicate/capacity checks complete before any state write. The sender is read from `gl.message.sender_address`. After validation, one `TreeMap[str, PrecedentRecord]` entry is added and a `u32` registration counter is incremented.

### Views

- `has_precedent(record_id: str) -> bool`
- `get_precedent(record_id: str) -> dict[str, str]` — bounded immutable fields; returns `{}` if missing. Numeric fields are string-encoded in the return map to keep the public result homogeneous and simple to consume.
- `get_registration_count() -> u32`

The bounded record view is a future integration seam only. This work does **not** claim that another contract can call it; the Stage 2A-R cross-contract test remains a gate.

## Storage and validation rules

- Uses documented GenLayer typed storage: `TreeMap[str, PrecedentRecord]`, `u32`, an `@allow_storage` dataclass, and `Address`.
- Record IDs: 3–48 uppercase ASCII letters/digits with optional single hyphen separators, no leading/trailing/repeated hyphens.
- Digest: exactly 64 lowercase hexadecimal characters. The contract validates canonical-looking digest syntax; it cannot verify bytes that are not supplied. Digest algorithm/canonical input encoding still needs to be pinned by the broader protocol before client integration.
- Schema: only version `1` is accepted.
- Metadata: jurisdiction and category are required, at most 64 characters, and limited to an ASCII public-label character set. Decision date must have `YYYY-MM-DD` shape and ASCII digits in date positions. Calendar validity (e.g. day-of-month/leap-year validation) is not enforced in this small registry contract.
- Registration capacity: a conservative hard limit of 1,000,000 entries is enforced to prevent counter overflow/unbounded assumptions. This is an application guardrail, not a verified Studionet storage limit.
- No interface exists to update/delete records. A correction must use a distinct ID.
- Character allowlists and bounded fields reduce accidental data exposure but do not detect every personal or confidential value. Operational policy and fictional/public-only review remain required.
- Submitter address is attribution only, not proof of publisher identity, source authenticity, or legal authority.
- Registration sequence is the only registration information recorded. No timestamp/block/transaction ID API was added because an implementation-ready, portable GenVM transaction metadata field was not verified for this contract path.

## Tests executed

Exact final commands:

```powershell
pytest tests/test_precedent_registry.py -q
$env:PYTHONIOENCODING='utf-8'
genvm-lint check contracts/precedent_registry.py
```

Final results:

- `pytest`: **29 passed** in 5.79 seconds.
- `genvm-lint`: **Lint passed (3 checks); Validation passed; Contract `PrecedentRegistry`; Methods 4 (3 view, 1 write).**
- Covered successful and multiple registrations, duplicate rejection, invalid identifiers/digests, unsupported schema versions, oversized/invalid metadata, missing record, record retrieval, submitter attribution, immutable overwrite rejection, and preservation of existing/new-record state after rejected writes.
- First test/lint iteration caught a Direct Mode fixture address representation mismatch and linter restriction on `@staticmethod` contract helpers. Both were corrected; final results above are from the corrected version.

The `gltest` pytest plugin printed its default localnet RPC config during Direct Mode; this does not mean a connection was made. No Studio service was running, and these tests used Direct Mode fixtures. No deployment or transaction occurred.

## GenLayer API evidence

The contract uses API shapes documented by GenLayer:

- Python `gl.Contract`, `@gl.public.write`, `@gl.public.view`, typed persistent state, and storage collection guidance: [Intelligent Contract introduction](https://docs.genlayer.com/developers/intelligent-contracts/introduction), [Storage](https://docs.genlayer.com/developers/intelligent-contracts/features/storage), and [Collections](https://docs.genlayer.com/developers/intelligent-contracts/types/collections).
- Persistent dataclasses require `@allow_storage` and `@dataclass`: [Dataclasses](https://docs.genlayer.com/developers/intelligent-contracts/types/dataclasses).
- Transaction sender context: [`gl.message.sender_address`](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context).

The installed Direct Mode tests exercised `gl.message.sender_address`, address hex output, TreeMap behavior, dataclass persistence, registration count updates, and rejected-operation behavior in that harness. This is local test behavior, not stable Studionet runtime evidence.

## Lint and runner limitations

The installed linter is `genvm-linter 0.11.1rc2` (release candidate). It could not query `genlayerlabs/genvm-manager` because outbound network access was blocked, so it used cached SDK artifacts and reported a newer runner hash: `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`.

The contract header currently retains the documentation example hash `1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. Neither that hash nor the linter-reported latest hash is confirmed here as the stable Studionet expected runner. Do not deploy this header until the stable runner compatibility gate is resolved. The CLI is also `0.40.0-rc.3`; Stage 2A-R documented Docker/Studio was unavailable and was not started.

## Unverified assumptions and integration blockers

1. **Stable runtime/hash:** expected stable Studionet `py-genlayer` hash and compatibility with the installed/selected CLI, linter, Direct Mode, and SDK versions remain unverified.
2. **Cross-contract reads:** `get_precedent` and `has_precedent` have not been called from a second deployed contract. No claim is made that their return encoding is usable by PrecedentEvaluator.
3. **Storage limits:** 64-character metadata fields and the 1,000,000 registration count guard are application choices, not measured network limits or fee-safe deployment bounds.
4. **Date validation:** checks shape only, not calendar validity.
5. **Digest semantics:** syntax is checked, but canonical document encoding and digest production remain an off-chain protocol decision; no document is passed to the contract.
6. **Transaction rollback/finality:** Direct Mode confirms the harness's post-revert state for the tested calls; real GenVM/Studionet rejection persistence, transaction result fields, and finality are not tested.
7. **Evaluation references:** intentionally deferred. No authorization/linking path is present because Evaluator integration and intercontract behavior are unverified.

## Next gates

Before Stage 2B Evaluator integration:

- Resolve/pin the stable Studionet runner hash from authoritative current GenLayer runtime metadata, and validate the contract with a compatible stable toolchain.
- Run a local Studio Mode integration test deploying the Registry and a separate caller contract, then read existing/missing Registry records via the actual planned cross-contract interface. Local Studio needs Docker and explicit approval to start services; it was not started in Stage 2A-R/I.
- Confirm return shape, missing-record semantics, bounded payloads, and read snapshot behavior for the exact caller method.
- Keep a separately authorized Studionet verification step for real target transaction lifecycle, execution result, finality, fees, and validator behavior. No such verification occurred here.

## Recommendation

**CONDITIONAL GO for Stage 2B planning, subject to the runner compatibility review.** The Registry-only deterministic contract and unit tests are implemented and pass locally. **Do not begin Evaluator integration or deploy** until the stable runtime pin and cross-contract read gates pass. This work does not establish live-network compatibility or legal correctness. No dependencies were installed/upgraded, no GenLayer configuration changed, no Docker/Studio service started, no contract deployed, and no commit or push made.
