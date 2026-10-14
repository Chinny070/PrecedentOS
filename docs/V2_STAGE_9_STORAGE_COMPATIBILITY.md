# PrecedentOS 2.0 — Stage 9 Nondeterministic Storage Compatibility

**Date:** 2026-10-14
**Starting commit:** `683a3ac665b4d6c84b226c885f755eef47fc1385`
**Target:** stable Studionet, chain ID `61999`
**Result:** source-level callback capture risk reduced; the live warning's cause and elimination remain unverified.

## Executive result

The user supplied GenLayer Studio Explorer and readback evidence for the isolated `StudioRuntimeProbe` AI/Equivalence Principle transaction `0x56654204c47ee4d75d339aa5a69925b8db6b3756edbbb848509628311aba3bda`. It reportedly finalized with accepted consensus and GenVM success, stored `POTENTIAL_CONTRADICTION`, and emitted:

```text
Detected pickling storage class. Reading storage in nondet mode is not supported
```

The transaction and warning were not independently retrieved in this run. The warning does not establish that contract storage was actually read. Source inspection found no intended reads of persistent maps or state in the affected validators, but the prior callbacks reached validation through bound `self` methods, which retained the storage-backed contract instance. That is a plausible source of the warning, not a proven root cause.

Production callbacks now call module-level validation/prompt/equivalence functions. Their state and evidence inputs are prepared in deterministic code before entering `run_nondet_unsafe`, except Web Render output, which necessarily originates inside the render operation and remains unreachable because `WEB_RENDER_RUNTIME_ENABLED = False`. Existing instance helper names remain as thin wrappers for local/internal compatibility. No public contract method, storage declaration, persisted schema, commitment encoding, authorization, evidence lock, replay rule, result field, or Equivalence Principle decision field was changed.

This is a source-level mitigation. Direct Mode and cached lint cannot establish that the Studionet warning disappeared. No deployment, signed call, transaction, or wallet operation was made.

## Verified GenLayer rule and local tool boundary

The current official storage guide says storage objects must be copied to memory before use in nondeterministic operations and that direct storage reads from a nondeterministic block are unsupported. The current non-determinism guide separately lists storage writes and contract calls as deterministic-context operations. These references confirm the restriction and the documented `gl.storage.copy_to_memory` pattern; they do **not** identify the source of the reported warning in this contract or diagnostic.

- [GenLayer storage](https://docs.genlayer.com/developers/intelligent-contracts/storage)
- [GenLayer non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- [GenLayer Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)

The installed `genvm-lint` is `0.11.1rc2`. It passes the local lint/schema checks below using the locally cached runner artifact. Every check reports `I200` for a newer runner hash, `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`; lookup of the current upstream artifact fails with Windows `WinError 10013`. The hash shown by the linter is not evidence of the exact stable Studionet runner. Lint is therefore cached source/schema validation only.

An attempted Python `@staticmethod` refactor was rejected by this installed linter (`E022`: contract methods must have `self` first). It was discarded. The implemented alternative uses ordinary module-level pure functions in each contract source file; this pattern passes the installed linter and the existing Direct Mode suites. No new GenLayer APIs or imports were introduced.

## Callback audit

| Contract/path | Deterministic preparation before nondeterministic call | Callback-side work after refactor | State write ordering | Status |
|---|---|---|---|---|
| `PrecedentRegistry` | N/A | No `run_nondet_unsafe` or AI path | Deterministic append-only registration | This warning path does not apply; runner/fee/functional deployment gates remain. |
| `PrecedentEvaluator.evaluate_pair` | IDs, exact evidence digest checks, bounded JSON passages, schema/criteria versions, commitment and prompt | LLM call; module-level pure response normalization; independent validator rerun; comparison of all six `DECISION_FIELDS` | Persist only after `run_nondet_unsafe` returns | Locally tested; no production live AI execution. |
| `CaseCourt.capture_web_source` | Authorization, case/source/request storage reads, URL/commitments and bounds | Renderer call; module-level prompt/validation/equivalence helpers; local output digest and excerpt check | Writes follow accepted result | Method still fails closed because `WEB_RENDER_RUNTIME_ENABLED = False`; no render invoked. |
| `CaseCourt.compare_web_sources` | Case/source/verification records, claims, bounded pair dictionaries, commitment and prompt | LLM call; module-level pure validation/equivalence functions | Writes follow accepted result | Direct Mode only; Web Render production path remains disabled. |
| `CaseCourt.adjudicate_case` | Locked case snapshot, evidence references and supplied packet verification, roots, criteria, commitment and prompt | LLM call; module-level judgment schema/decision validation; validator rerun and same decision-field comparison | Writes follow accepted result | Locally tested with Direct Mode mocks only. |
| `CaseCourt.evaluate_contradiction_challenge` | Challenge and both linked case records, frozen/appeal checks, commitment and prompt | LLM call; module-level pure validation and decision-field comparison | Writes follow accepted result | Locally tested with Direct Mode mocks only. |
| `CaseCourt.adjudicate_appeal` | Case, appeal, original judgment, evidence roots/bytes, grounds, criteria, commitment and prompt | LLM call; module-level pure appellate validation and decision-field comparison | Writes follow accepted result | Locally tested with Direct Mode mocks only. |
| `StudioRuntimeProbe.run_ai_equivalence_probe` | Probe ID, bounded fictional text, commitment and prompt | LLM call; module-level pure result validator and decision-field comparison | Probe state is updated after the EP returns | User reports live accepted run on the previously deployed probe; that deployed bytecode predates this refactor. |

The forced-disagreement probe has no storage/helper access in either callback. All production contracts keep their existing deterministic authorization, state snapshot, write-after-EP ordering, and replay/state checks. The module-level helper functions operate only on ordinary arguments and module constants; no helper reads a `TreeMap`, storage record, contract field, or transaction message.

## Isolated comparison diagnostic

Added `experiments/stage9/nondet_storage_capture_probe.py`, a disposable contract that contrasts:

- **A — bound helper:** leader and validator callbacks invoke a pure method through `self`.
- **B — free function:** leader and validator callbacks invoke an equivalent module-level pure function.

Both return the same deterministic boolean. The associated Direct Mode test ran both calls and observed the expected state results. `tests/test_nondet_storage_capture_probe.py` also parses each production nondeterministic callback and guards against a `self` reference, and checks that top-level `_pure_*` helpers do not refer to `self`.

**This is not a GenVM warning reproduction.** Direct Mode does not expose this warning's storage-pickling instrumentation or prove that GenVM handles callback closures the same way. The A/B contract has not been deployed or sent transactions. The old diagnostic address must not be treated as running this new source.

To determine whether the warning tracks callback capture, a separately approved user-operated Studio experiment must deploy this isolated diagnostic as a new contract, execute A and B in separate transactions, collect each complete execution log/trace and compare state after each. Record the exact source hash, selected network/chain ID, runner evidence, fees, transaction IDs, consensus, execution status and readbacks. Do not test on Studionet without explicit approval of the specific deployment and both writes/fees. If both cases warn, or neither does, obtain the trace/runtime team interpretation rather than asserting a cause.

## Tests and validation

Commands executed:

```powershell
python scripts/run_tests_safe.py tests/test_precedent_evaluator.py tests/test_case_court_adjudication.py tests/test_case_court_appeals.py tests/test_case_court_contradictions_authority.py tests/test_case_court_web_evidence.py tests/test_studio_runtime_probe.py tests/test_nondet_storage_capture_probe.py
python scripts/run_tests_safe.py tests
genvm-lint check contracts/precedent_registry.py --json
genvm-lint check contracts/precedent_evaluator.py --json
genvm-lint check contracts/case_court.py --json
genvm-lint check experiments/stage6/studio_runtime_probe.py --json
genvm-lint check experiments/stage9/nondet_storage_capture_probe.py --json
```

Results:

- Focused affected suites: **128 passed**.
- Full protected Python suite: **234 passed, 4 skipped (238 collected)**. Skips are gated localnet identity/cross-contract checks; no integration deployment ran.
- All five GenVM lint/schema commands: **passed** with 3 lint checks each and constructor/signature schema validation. All used the cache and reported `I200`; none establishes stable runner compatibility.
- `genvm-lint --version`: **0.11.1rc2**.
- Frontend: lint passed; typecheck passed; Vitest **70 passed across 10 files**; production build passed (488 modules).

Direct Mode tests mock model and Equivalence Principle runtime paths. The new callback A/B calls are locally executed against that harness only. No validator consensus, warning elimination, Studionet rollback, or stable runner behavior is claimed.

## Remaining proof required

1. A Studio/GenVM A/B runtime log and trace showing whether the warning occurs for the bound and pure callback variants.
2. Exact stable Studionet GenVM runner identity and match to the contract `py-genlayer` dependency pin. Current cached lint is insufficient.
3. Actual production Evaluator and CaseCourt executions on the exact runner, with accepted and rejected/undetermined outcomes plus state readback.
4. Production fees/cost ceilings and current SDK-decoded receipt/consensus evidence.
5. CaseCourt governance/liveness/security gates and all separate deployment gates in `V2_STAGE_9_PRODUCTION_DEPLOYMENT_GATE.md`.

**Storage compatibility verdict:** source-level risk reduced; runtime warning root cause **unproven**; production deployment remains **NO-GO** pending the runtime and product-security gates.
