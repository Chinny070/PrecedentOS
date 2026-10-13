# PrecedentOS 2.0 Stage 1 Report — Case Lifecycle and Governance Foundation

**Status:** deterministic CaseCourt v1 implemented and locally validated. No contract is deployed.
**Target network:** stable GenLayer Studionet (expected chain ID `61999`); live identity remains unverified.
**Preservation:** Stage 0 commit `258549db81024468159cc45fcf329f109ce70de5` was pushed before Stage 1 edits. Stage 1 was later preserved in commit `c9e2b0ee0fee12f1337630141783f73507a92095`; Stage 2 was subsequently committed as `9644d9915f1c122f326c81690a1b8959c65ae9dd` and the normal push was acknowledged. An independent remote SHA read after that push was blocked by this host's GitHub socket restriction.

## 1. Scope and architecture conflicts found before implementation

The Stage 0 documents intentionally described CaseCourt signatures and storage as conceptual. The Stage 0 masterplan recommended resolving runtime/API gates before production feature code. This task explicitly directed implementation of the deterministic governance foundation, so Stage 1 implements that bounded scope while retaining runtime-dependent work as a gate.

Two dependencies in the approved lifecycle remain unresolved:

1. `V2_STATE_MACHINE.md` requires an accepted case-open transaction to reach GenLayer native finality before the evidence clock starts. The current contract documentation describes asynchronous finalized messages, but the project has no executed proof that a same-contract finality handoff is idempotent or can safely activate a case. CaseCourt therefore has **no case-level appeal/evidence deadlines, finality callback, appeal window, or case-final state**. `EVIDENCE_OPEN` means the contract's open operation executed; it is not a claim that the opening transaction is finalized. A future client must wait for verified finality before relying on that operation; the contract cannot independently prove its own prior transaction's finality.
2. Registry membership and Evaluator output verification are not used. `attach_decision_reference` records a caller-supplied ID and digest only. It does not prove a Registry record, Evaluation record, or validator result. Cross-contract interaction remains behind the explicit unverified boundary.

These omissions are intentional and prevent Stage 1 from fabricating finality or adjudication behavior. Native GenLayer transaction appeal/finality remains separate from the case phases.

## 2. Contract implementation

Created [contracts/case_court.py](../contracts/case_court.py). The contract is deterministic and contains no LLM/Web Render calls or calls to the existing Registry/Evaluator.

It uses the installed GenLayer storage model with a single `TreeMap[str, str]` for bounded JSON-encoded case, evidence, action, and replay records, plus `u32` global case/action counters. Namespaced keys separate record kinds. This also avoids relying on multiple differently parameterized `TreeMap` storage descriptors, which the installed Direct Mode harness rejected during initial testing. All record values and encoded payloads are bounded by the public method input caps.

### Official API verification

The implementation uses documented GenLayer Python patterns: persistent `TreeMap` storage and string values ([storage](https://docs.genlayer.com/developers/intelligent-contracts/storage)); typed `Address` arguments and `Address.as_hex` ([Address type](https://docs.genlayer.com/developers/intelligent-contracts/types/address)); caller attribution via `gl.message.sender_address` and deterministic transaction datetime via `gl.message_raw["datetime"]` ([transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context)); and rejected writes via `raise gl.vm.UserError(...)` ([error handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling)). Direct Mode uses the installed GenLayer pytest fixtures/pattern ([testing docs](https://docs.genlayer.com/developers/intelligent-contracts/testing), [Direct Mode API](https://docs.genlayer.com/api-references/genlayer-test/direct)).

Installed packages were verified locally as Python 3.12.10, `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, and `genvm-linter==0.11.1rc2`. This is a locally usable Direct Mode toolchain, not an authoritative stable Studionet version matrix. The current official test docs distinguish in-process Direct Mode from Studio Mode RPC integration; therefore the results below do not prove localnet, stable runner, or validator consensus behavior.

### Public write methods

| Method | Effect and guards |
|---|---|
| `open_case(case_id, action_id, respondent, case_type, policy_version, opening_evidence_digest)` | Opens a unique case as the authenticated petitioner, records the distinct respondent, locks schema/policy v1 and opening commitment, starts at case version 1, and appends the first action. Creation is permissionless: any caller may create a case naming themself as petitioner; no one may create one on another account's behalf. |
| `append_evidence(case_id, expected_version, action_id, evidence_id, digest, evidence_schema_version, source_reference_digest)` | Either named party appends a unique immutable reference while evidence is open. Digests are format-checked; the evidence/source bytes are not available here and are not verified. |
| `lock_evidence(case_id, expected_version, action_id)` | Either named party locks a nonempty evidence set. No deadline or permissionless deadline keeper is implemented. |
| `attach_decision_reference(case_id, expected_version, action_id, decision_ref_id, decision_digest)` | Either party can attach one opaque decision pointer after evidence lock. This does not fetch or validate the referenced result. |
| `challenge_decision(case_id, expected_version, action_id, challenge_id, decision_digest, grounds_code, grounds_digest)` | The other named participant may challenge the exact attached decision using one supported grounds code and a digest commitment. Only one challenge can open in this Stage 1 state machine. |
| `request_freeze(case_id, expected_version, action_id, grounds_digest)` | Either case party may use the one available 24-hour freeze after a challenge is open. A freeze is recorded with the deterministic transaction-context timestamp. |
| `unfreeze_case(case_id, expected_version, action_id)` | Before expiry, only the freeze requester may unfreeze. At or after the fixed expiry, any account may materialize the expiry transition. The challenge remains open. |

### Public read methods

- `has_case(case_id)` and `get_case(case_id)` return the authoritative CaseCourt status projection.
- `get_evidence(case_id, evidence_id)` returns an immutable digest reference.
- `get_case_action(case_id, case_sequence)` returns one append-only action by per-case sequence.
- `get_case_action_count(case_id)`, `get_case_count()`, and `get_action_count()` expose bounded counters. Case enumeration/pagination is not implemented.

All reads validate identifier length/format; missing valid IDs have deterministic empty/false/zero results.

## 3. State machine and invariants

Implemented phases are `EVIDENCE_OPEN → EVIDENCE_LOCKED → DECISION_RECORDED → CHALLENGE_OPEN → FROZEN`; the authorized unfreeze/expiry transition returns to `CHALLENGE_OPEN`. The contract does not close or adjudicate a challenged case.

- Every state-changing call after opening binds the expected case version. Each accepted case action increments the version and appends a sequential action record with actor, action ID, input commitment, reference, versions, and `gl.message_raw["datetime"]`.
- Action IDs are globally one-use; challenge IDs are globally one-use. Evidence and decision references are unique/one-time within their supported scope.
- The append-only action/evidence records have no update or delete entry point. The case snapshot is a current projection; prior action records remain addressable by sequence.
- All CaseCourt methods that could alter an existing case except `unfreeze_case` reject while that case is frozen. A new unrelated case may still be opened.
- Freeze enforcement ends at the CaseCourt boundary. It cannot stop Registry/Evaluator calls, GenLayer transaction finality, another contract, or an off-chain product action.
- Every user-controlled digest is checked for lowercase 64-character SHA-256 syntax, but this contract does not receive the committed evidence bytes and cannot prove that the digest matches a document or web source.
- Wallet addresses prove control of those keys only; they do not establish real-world identity, legal capacity, service, or representative authority.

## 4. Frontend boundary

Added Stage 1 domain/view types in `frontend/src/types/domain.ts` and type-only `CaseCourtReadPort`, `CaseCourtWriteArguments`, and `CaseCourtWritePort` declarations in `frontend/src/lib/genlayer/caseCourtTypes.ts`. No routes, buttons, deployed addresses, GenLayerJS calls, transaction status labels, or live governance claims were added. The existing UI and wallet behavior remain unchanged.

## 5. Security tests and results

Created fictional public fixture `tests/fixtures/fictional_cases.json` and `tests/test_case_court.py` with 35 Direct Mode cases/parameterized scenarios covering:

- opening attribution, distinct/nonzero participants, duplicate case/action IDs, malformed and oversized IDs/labels, supported schema/policy, and invalid commitments;
- nonparticipant writes, stale versions, invalid transitions, unauthorized/self challenges, stale decision digests, unsupported grounds, duplicate challenge IDs across cases, and action replay;
- evidence append/retrieval/version/submitter, evidence/schema/source-reference validation, 32-item evidence cap, case/action capacity boundaries, and rejected-state preservation;
- case lock and one-time decision reference behavior;
- freeze eligibility, 24-hour transaction-time bound, pre-expiry authorization, permissionless expiry materialization, one-freeze limit, and rejection of all other case mutations while frozen;
- sequential immutable history and bounded read identifiers.

The Direct Mode harness's capacities for cases/actions are lowered inside the respective tests to hit boundary branches without creating 100,000 cases or 1,000,000 actions. These are logic-branch tests, not production-scale cost profiles.

### Final test commands and observed results

- `pytest tests/ -q --rootdir=. --artifacts-dir C:\Users\USERpc\AppData\Local\Temp\precedentos-stage1-tests\artifacts` — **95 passed, 2 skipped** (final run). The 2 skips are opt-in local Studio/identity checks.
- The full test folder includes an opt-in local Studio test and localnet identity smoke test. Both remained skipped because their opt-in environment variables were unset. No network call/deployment was initiated by these tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — 4 files, 25 tests passed.
- `npm run build -- --outDir C:/Users/USERpc/AppData/Local/Temp/precedentos-stage1-tests/frontend-dist` — passed, 486 modules transformed. Build output was sent outside the repository.

### GenVM lint

Installed `genvm-linter==0.11.1rc2` ran `genvm-lint check` successfully on `precedent_registry.py`, `precedent_evaluator.py`, and `case_court.py`: each reported “Lint passed (3 checks)” and “Validation passed.” The linter could not query the upstream runner catalog (`WinError 10013`) and used its local cache; it reported cached runner `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` as newer. The contract headers reference `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. Neither hash is thereby proven to be the exact current stable Studionet runner.

The test/lint tuple observed locally is `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, `genvm-linter==0.11.1rc2`, Python 3.12.10. Official docs describe Direct Mode as in-process and Studio Mode as RPC integration; this does not establish live consensus.

## 6. Preservation and side effects

- `contracts/precedent_registry.py`, `contracts/precedent_evaluator.py`, all prior tests/fixtures/reports, frontend behavior, and `manual-deployment/` were not edited during Stage 1. Stage 0 and Stage 1 are preserved on `origin/main`; Stage 1 SHA is `c9e2b0ee0fee12f1337630141783f73507a92095`.
- The existing `artifacts/` directory was present before testing. The first pytest invocation used the runner default and its startup hook cleared that directory. `artifacts/` is ignored by Git and no tracked files are under it. I did not attempt destructive recovery. All later pytest commands explicitly redirected artifacts to the isolated temporary directory.
- No Docker/Studio service was started; no contract was deployed; no wallet was used and no transaction was sent.

## 7. Known limits and Stage 2 prerequisites

1. Verify the current stable Studionet-compatible GenVM hash/tooling and chain 61999 from an allowed environment.
2. Prove case-open/finality activation and transaction-time behavior in an isolated supported runtime before adding appeal deadlines. The Stage 1 code currently has no callback/deadline feature.
3. Profile storage, JSON serialization, action count, evidence cap, return size, and worst-case fees on the selected runner. Current caps are code-level limits, not economically calibrated limits.
4. Prove Registry `view()` reads and Evaluator result reads across contract boundaries in a two-contract runtime. Keep references explicitly unverified until then.
5. Add outcome verification, challenge resolution, case-level appeals, finality-aware state transitions, case close/reconsideration, and authority relations only with policy review and verified lifecycle semantics.
6. Keep Web Render disabled and add no AI adjudication until the runner/API, independent decision validation, privacy/cost bounds, and failure atomicity are runtime-tested.
7. Implement a frontend workflow only after a verified deployment schema/address and finality-aware adapter are available. Current additions are types only.

## 8. Recommendation

**CONDITIONAL GO for Stage 2 schema/cost design and runtime integration preparation.** The deterministic CaseCourt core is implemented, locally tested, and linted. Do not proceed to AI appeal adjudication, deadline enforcement, cross-contract decision verification, Web Render, or public live governance workflows until the runtime and finality prerequisites above are demonstrated.
