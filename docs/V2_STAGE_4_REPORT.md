# PrecedentOS 2.0 — Stage 4 Implementation Report

**Date:** 2026-10-13
**Target:** stable GenLayer Studionet, chain ID 61999
**Stage 3B preserved baseline:** `37676fb9ad2cf7fee64dcf02fb8fe59e1a1a8abd` (`HEAD` and local `origin/main` matched at verification)
**Stage 4 Git state:** local only; not committed or pushed. The pre-existing untracked `manual-deployment/` directory was left untouched and unstaged.

## Result

Stage 4 implements a bounded CaseCourt appeal lifecycle, AI-assisted appellate ruling, custom Equivalence Principle field checks, deterministic ruling enforcement, case-local appeal freeze, two-level limit and application-level bilateral closure. Newly opened case snapshots use schema v2. A newly deployed CaseCourt source is required; an already deployed immutable Stage 3B contract does not gain these methods from this repository edit. It is **locally tested only**. No Studio/GenLayer node was started, no wallet signature or transaction was created, and no deployment occurred.

## Implemented contract interface

`contracts/case_court.py` adds:

- `file_appeal`: accepts only the opposing named participant and an exact operative CaseCourt judgment or eligible latest resolved level-1 appellate ruling; validates case/version/target/root/grounds/filer/filing commitment; stores an immutable filing snapshot and freezes CaseCourt.
- `append_appeal_evidence`, `lock_appeal_evidence`: appellant-only bounded references and deterministic ordered root; empty evidence list is supported.
- `begin_appeal_review`: requires the other named party and a locked packet.
- `adjudicate_appeal`: verifies exact original and appeal evidence bytes against stored SHA-256 references, binds all IDs/versions/roots/criteria/schema/chain/Court fields, executes `gl.nondet.exec_prompt(..., response_format="json")` in `gl.vm.run_nondet_unsafe`, compares decision-bearing fields, and appends the accepted result/ruling only after that call returns.
- `resolve_appeal`: takes an appeal ID and stored ruling commitment, revalidates the stored structured ruling/commitment, then enforces the stored outcome. It accepts no caller-supplied ruling object.
- `request_case_closure`, `approve_case_closure`, `is_case_closure_eligible`: a party requests; the other party approves. Closure is a CaseCourt application status, not native transaction finality.
- `get_appeal_filing`, `get_appeal_evidence`, `get_appellate_ruling`: deterministic read views.

### Outcome enforcement

- `UPHELD`: retains the existing operative decision.
- `REVERSED`: preserves the original `J:` judgment and marks it in `superseded_judgment_id`; the appellate ruling ID/digest becomes the explicit operative decision.
- `REMANDED`: sets `REMANDED_REVIEW` and clears the operative decision until a new CaseCourt judgment is recorded.
- `DISMISSED`: records the dismissal and leaves the original operative decision intact.
- `INSUFFICIENT_EVIDENCE`: makes no finding of material error, does not affirm the original, and reopens in `REMANDED_REVIEW` for a new evidence/review process.

Each outcome has a strict boolean/state-change consistency tuple. Invalid combinations reject. The AI does not make participant, case eligibility, deadline, evidence identity or transition decisions.

## Freeze and immutable history

An admitted appeal automatically sets the CaseCourt snapshot to `FROZEN`; `unfreeze_case` cannot release an appeal freeze. Only `resolve_appeal` clears it. Appeal evidence append/lock and opposing-party review are the only permitted in-flow operations. The existing one-time 24-hour discretionary challenge freeze remains a separate legacy path. Both are CaseCourt-local; neither affects the Registry, Evaluator, other ICs or already submitted transactions.

Filing `PF:`, appeal evidence `AE:`, judgment `J:`, ruling `AR:`, and action sequence `A:` are append-only. Mutable `P:` appeal and `C:` case entries are current-state projections. No public deletion/edit method was added for judgment or ruling history.

## Frontend preparation

`frontend/src/types/domain.ts` now models remand, appellate ruling, appeal status, evidence references, operative-decision identity and case closure. `frontend/src/lib/genlayer/caseCourtAppeals.ts` provides a typed, local commitment/status boundary and sets `APPEAL_WRITE_GATE = 'DISABLED_RUNTIME_UNVERIFIED'`. There is no appeal write route or active transaction adapter.

Python and TypeScript mirror length-prefixed UTF-8 SHA-256 commitments for filing, appeal evidence, appellate input and ruling result using `tests/fixtures/appellate_commitment_vectors.json`. The Direct Mode E2E additionally reconstructs input and ruling commitments from actual test contract records.

## Files changed or added

Modified:

- `contracts/case_court.py`
- `frontend/src/types/domain.ts`
- `docs/V2_ACCEPTANCE_MATRIX.md`
- `docs/V2_APPEAL_PROTOCOL.md`
- `docs/V2_IMPLEMENTATION_MASTERPLAN.md`
- `docs/V2_RUNTIME_VERIFICATION.md`
- `docs/V2_STATE_MACHINE.md`
- `docs/V2_STAGE_3B_REPORT.md` (a preservation note records that Stage 3B was later committed)

Added:

- `tests/test_case_court_appeals.py`
- `tests/fixtures/appellate_commitment_vectors.json`
- `precedentos_protocol/appeal_commitment.py`
- `frontend/src/lib/genlayer/caseCourtAppeals.ts`
- `frontend/src/lib/genlayer/caseCourtAppeals.test.ts`
- `docs/V2_APPEAL_COURT_IMPLEMENTATION.md`
- `docs/V2_APPELLATE_EQUIVALENCE.md`
- `docs/V2_FREEZE_ENFORCEMENT.md`
- `docs/V2_APPELLATE_SECURITY.md`
- `docs/V2_STAGE_4_REPORT.md`

Registry and Evaluator production contract files were not modified. Existing pre-existing `manual-deployment/` files were not read, changed or staged.

## Verification evidence

### Python Direct Mode

```powershell
python -m pytest tests/ -q --rootdir=. --artifacts-dir C:\Users\USERpc\AppData\Local\Temp\precedentos-stage4\artifacts-final
```

**Result:** `159 passed, 2 skipped in 21.38s`. The skipped cases are opt-in integration tests. All new appellate cases use fictional evidence and Direct Mode mocks. Tests cover the positive path and all five outcomes; two-level filing/depth/circular prevention; exact judgment and ruling binding; grounds/evidence digests and input/result parity; malformed/missing/oversized evidence; a thrown mocked model transport failure; unauthorized participants; replay; freeze bypass; forged ruling digest; deterministic state preservation after rejected methods; prompt-injection fixture; bilateral closure and closed-case writes. The validator-disagreement check demonstrates a false Direct Mode callback only. It does not demonstrate network rejection or rollback.

### GenVM lint

```powershell
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/case_court.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_registry.py
$env:PYTHONIOENCODING='utf-8'; genvm-lint check contracts/precedent_evaluator.py
```

**Result:** all three report `Lint passed (3 checks)` and `Validation passed`. CaseCourt reports 29 methods (13 view, 16 write). Each check reports upstream runner lookup blocked with Windows `WinError 10013` and falls back to cached artifacts; cache notes `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` is available. This is cached lint, not a verified stable Studionet runner.

### Frontend

```powershell
npm run lint
npm run typecheck
npm test
npm run build -- --outDir C:/Users/USERpc/AppData/Local/Temp/precedentos-stage4/frontend-dist-final
```

**Result:** lint passed; TypeScript passed; `7` Vitest files / `49` tests passed; production build passed (`486` modules). Build output stayed outside the repository. Vite warns that the temp output directory is outside project root and will not be emptied automatically.

`git diff --check` passed. `HEAD` and local `origin/main` both resolved to the Stage 3B baseline SHA above. Stage 4 remains only in the working tree.

## Runtime and protocol limitations

- Current official GenLayer documentation confirms the API pattern for JSON LLM calls, `run_nondet_unsafe`, independent validator evidence and state writes after the nondeterministic result. This source/documentation check is not runner compatibility proof.
- Stable GenVM runner mapping remains unresolved; linter upstream lookup fails with WinError 10013.
- No real validator consensus, disagreement, failed transaction receipt, transaction rollback, transaction finality, resource/fee profile, or live timestamp behavior was exercised.
- If consensus cannot resolve an admitted appeal, the appeal stays frozen and may be retried; there is no timeout or unilateral release. This is a fail-closed liveness/due-process risk requiring policy before production.
- Case appeal deadlines and exceptional reconsideration are not implemented. No cross-contract or network-wide freeze exists.
- `DISMISSED` is an AI-assessed merits result; structural ineligibility instead fails by transaction revert and creates no successful rejection record.

## Status and recommendation

| Requirement | Status |
|---|---|
| Appeal contract logic and bounded schema | **IMPLEMENTED** |
| Positive/adversarial Direct Mode suite | **LOCALLY TESTED** (mocked AI/validator) |
| Frontend types and commitment vectors | **IMPLEMENTED / LOCALLY TESTED**; writes disabled |
| GenVM checks | **LOCALLY TESTED** against cached artifacts only |
| Stable Studionet runner and actual validator consensus | **BLOCKED** |
| Failed-execution rollback, receipt/finality and fees | **BLOCKED / NOT STARTED** |
| Independent protocol/legal/due-process review | **NOT STARTED** |
| Live deployment or transaction | **NOT STARTED** |

**Verdict: CONDITIONAL GO for additional local implementation/review; NO-GO for enabling frontend writes, deploying CaseCourt, or claiming authoritative appeal outcomes.** Proceeding to Stage 5 should first resolve the stable runtime, failure/finality evidence, liveness/reviewer policy, and independent security/due-process review.
