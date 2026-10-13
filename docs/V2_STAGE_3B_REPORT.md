# PrecedentOS 2.0 — Stage 3B Implementation Report

**Date:** 2026-10-13
**Target:** stable GenLayer Studionet, chain ID 61999
**Scope:** CaseCourt-owned bounded AI judgment, custom Equivalence Principle checks, input/result binding, appeal linkage, typed frontend boundary.
**Git:** Stage 3A commit `6609b63` was pushed normally to `origin/main` with GitHub acknowledging `9644d99..6609b63 main -> main`. The independent remote SHA query was not repeated; the previous host restriction blocked direct GitHub reads. Stage 3B changes are uncommitted and unpushed.

**Preservation update:** The Stage 3B source and report were subsequently verified and preserved on `main` in commit `37676fb9ad2cf7fee64dcf02fb8fe59e1a1a8abd`, with a normal `origin/main` push acknowledged as up to date. Stage 4 edits are separate and remain uncommitted/unpushed.

## Result summary

Stage 3B implementation is present and locally tested. It is **not** live verified. GenLayer official documentation confirms the API pattern used, but the host could not resolve the current runner mapping and the existing Direct Mode harness mocks AI/validator behavior. No Docker, Studio, deployment, wallet signature, Studionet read/write transaction, package installation, or dependency update was used. Existing Registry/Evaluator production contracts were not modified. The pre-existing `manual-deployment/` folder was not touched or staged.

## Files changed or created in Stage 3B

- Modified `contracts/case_court.py`.
- Modified `precedentos_protocol/case_decision.py` with a Stage 3B result commitment mirror.
- Created `tests/test_case_court_adjudication.py` and `tests/fixtures/fictional_case_judgments.json` (fictional-only inputs).
- Modified `frontend/src/types/domain.ts`.
- Created `frontend/src/lib/genlayer/caseCourtAdjudication.ts` and its test.
- Created `docs/V2_AI_JUDGMENT_SCHEMA.md`, `docs/V2_EQUIVALENCE_VALIDATION.md`, and `docs/V2_ADJUDICATION_SECURITY.md`.
- Updated `docs/V2_ACCEPTANCE_MATRIX.md`, `docs/V2_IMPLEMENTATION_MASTERPLAN.md`, and `docs/V2_RUNTIME_VERIFICATION.md`.
- Created this report.

No Registry/Evaluator source or tests, frontend page/route, `manual-deployment/`, Git history, or environment configuration changed during Stage 3B.

## Contract interface and state transitions

### `lock_evidence`

The existing public method signature is preserved. After existing party/version/phase checks, it walks the append-only case action sequence, loads each referenced evidence record, computes the ordered `PrecedentOS-CASE-EVIDENCE-v1` SHA-256 commitment, and stores the root/count in the case snapshot. The action payload digest now includes that root. Evidence records remain immutable.

### `adjudicate_case`

```text
adjudicate_case(case_id, expected_version, action_id, judgment_id, evidence_packet_json)
```

It authenticates the sender as a case participant; checks frozen state, exact version, `EVIDENCE_LOCKED`, unique judgment/action IDs and case/action capacity; reconstructs the ordered evidence references/root; validates packet shape/order and SHA-256 of exact UTF-8 evidence bytes; and checks the fixed criteria/policy version and digest. Maximum packet size is 9,000 UTF-8 bytes, each evidence item is capped at 1,800 UTF-8 bytes, and 1–32 evidence items are accepted. Full evidence text is not written to state.

The method calls `gl.nondet.exec_prompt(prompt, response_format="json")` through `gl.vm.run_nondet_unsafe(analyze, validator_fn)`. It validates the leader output and asks validators to independently run the same bounded assessment. After that call returns an accepted result, the contract computes commitments, appends the judgment record and case action, then updates the case snapshot to `DECISION_RECORDED`. It does not emit messages or claim transaction finality.

### `get_judgment`

Deterministic view returning the immutable structured judgment record by ID, or `{}` when absent. The record includes judgment/case IDs, pre-transition case version, chain ID, Court address, evidence root, criteria/policy/schema versions and criteria digest, input/judgment commitments, submitter, runtime transaction datetime, status label, and bounded result JSON.

### `challenge_decision`

The prior signature and transition are preserved. Appeal records now include the exact decision version, evidence commitment and an `PrecedentOS-APPEAL-FILING-v1` commitment covering appeal/case/judgment IDs, version, digest, evidence root, appellant and grounds. Legacy caller-supplied opaque references remain `UNVERIFIED_CALLER_ASSERTION` and use version 0/empty evidence root. Appeals remain `FILED_UNADJUDICATED`; no appeal merits assessment or automatic unfreeze was added.

## Judgment schema and security boundary

The exact ten-field v1 output schema, bounds, allowed enums and consistency rules are in `V2_AI_JUDGMENT_SCHEMA.md`. The output includes classification, material findings, evidence sufficiency, issue determination, eligibility, relevant rule application, criteria codes, recommended outcome, bounded reasoning and uncertainty flags. The validator compares all outcome-critical fields, not JSON syntax or prose. The full `V2_EQUIVALENCE_VALIDATION.md` and `V2_ADJUDICATION_SECURITY.md` distinguish source/API evidence from mocked local results.

Evidence SHA-256 proves only that supplied bytes match the prior commitment. It does not authenticate a source or establish truth, completeness, admissibility or legal correctness. Case participants can commit misleading material before lock. Evidence is sent to execution/validator nodes and must never contain private or privileged information. The explicit prompt-injection framing is tested as prompt construction only; no model robustness claim is made.

The authority string `CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY` represents a method result returned after the contract's EP call; it is not a user-facing FINALIZED claim. A final label still requires an actual supported receipt showing successful execution (`FINISHED_WITH_RETURN`) and finalized lifecycle. The frontend has typed status/adapter boundaries and no active adjudication button or contract write call.

## API and runtime verification

Official documentation consulted:

- [Calling LLMs](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms) — `gl.nondet.exec_prompt`, JSON response handling, custom validator pattern.
- [Prompt and data techniques](https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts) — structured outputs and decision-field validation.
- [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism) — `run_nondet_unsafe` and storage writes after nondeterministic execution.
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) — custom validator guidance.
- [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) — transaction context properties including sender, chain ID and contract address.
- [Error handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling) — nondeterministic error behavior.

The installed host Python cannot import `genlayer` directly (`ModuleNotFoundError`); Direct Mode loads the contract using its extracted runtime. This is not itself a blocker to Direct Mode tests, but it prevents inspecting an installed host SDK module. `genvm-lint` used cached artifacts because current runner lookup failed with Windows `WinError 10013`. It reports cached `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`; the contract source pin is `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. Neither has been authoritatively mapped to the current stable Studionet runner. Real model execution, validator consensus/disagreement enforcement, rollback, VM/cost limits and receipt/finality remain BLOCKED.

## Tests and commands

Final full Python run, with isolated artifacts outside the repository:

```powershell
python -m pytest tests/ -q --rootdir=. --artifacts-dir C:\Users\USERpc\AppData\Local\Temp\precedentos-stage3b\artifacts-final2
```

**Result:** `142 passed, 2 skipped in 41.42s`. The two skipped tests are opt-in local integration tests. Stage 3B tests include successful mocked judgment, authorization, lock/state/version checks, wrong and reordered evidence, oversized packet/evidence, unsupported stored criteria, modified locked root, malformed/invalid/contradictory JSON, duplicate/replay across cases, failure with no record, freeze, appeal binding, prompt construction and Python/contract evidence/input/result commitment parity. Storage-corruption tests modify Direct Mode's test state directly to exercise defensive guards; this is not a public chain operation. The mocked validator-disagreement callback returns `False`, but Direct Mode does not prove that the real execution will reject/rollback the write in this branch.

```powershell
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/case_court.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_registry.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_evaluator.py
```

**Results:** all three reported `Lint passed (3 checks)` and `Validation passed`. Every run warned that upstream runner resolution failed with WinError 10013 and used cached artifacts. This is cached lint only.

Frontend commands:

```powershell
npm run lint
npm run typecheck
npm test
npm run build -- --outDir C:/Users/USERpc/AppData/Local/Temp/precedentos-stage3b/frontend-dist-final
```

**Results:** lint passed; typecheck passed; `6` Vitest files / `47` tests passed; production build passed (486 modules transformed). Build output was directed outside the repository. The first frontend test invocation accidentally duplicated `--configLoader native` and failed on the CLI option; plain `npm test` then passed. The first typecheck/build caught `record: null` typing mismatch; type was corrected and both passed on rerun.

`git diff --check` passed before preservation. Stage 3B changes were subsequently verified and preserved in the Stage 3B commit noted in the Stage 4 report; no Stage 4 changes are included in that commit.

## Remaining blockers and recommendation

Before any manual/browser deployment, controlled local integration or frontend adjudication enablement: verify the exact stable Studionet GenVM runner and fee profile; run the new contract under the supported Studio runtime; demonstrate actual independent validator disagreement and failed-execution state behavior; inspect successful and failed transaction lifecycle/receipt; profile maximum evidence/model execution; and complete independent protocol/legal review. No deployment should be represented as legal correctness.

**Verdict: CONDITIONAL GO for Stage 4 work that remains locally tested, non-deployed and clearly non-authoritative. NO-GO for production adjudication enablement or deployment preparation that relies on live EP acceptance, transaction rollback, finality or unprofiled costs.**
