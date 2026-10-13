# PrecedentOS 2.0 — Stage 3A Runtime Compatibility and Case-Bound Decision Report

**Date:** 2026-10-13
**Target:** stable GenLayer Studionet, chain ID `61999`.
**Stage result:** deterministic schema preparation is implemented and locally tested. Production case adjudication, live cross-contract calls, validator consensus, and deployment remain blocked.

## 1. Stage 2 preservation

- The Stage 2 diff was reviewed before staging. Exactly 11 Stage 2 paths were staged: CaseCourt, its tests, type-only frontend interfaces, and Stage 2 documentation. The user-requested `manual-deployment/` directory was excluded and left untouched. No credential-like patterns were found in the selected Stage 2 paths.
- Before Stage 3A edits, the full contract suite passed: **101 passed, 2 skipped**. Skips are opt-in Studio/localnet checks; no runtime integration was performed.
- Frontend checks passed: lint; typecheck; **25 tests**; production build (486 modules transformed).
- GenVM lint passed for CaseCourt, PrecedentRegistry, and PrecedentEvaluator using cached artifacts. Each invocation warned that upstream runner lookup failed with Windows `WinError 10013`; this does not verify the current stable runner.
- Stage 2 changes did not modify or weaken the Registry or Evaluator source/tests. CaseCourt only adds an explicitly `UNVERIFIED_CALLER_ASSERTION` authority label and an immutable first-level `FILED_UNADJUDICATED` appeal record with adversarial tests. Rejected calls preserve state in Direct Mode tests.
- Stage 2 commit: `9644d9915f1c122f326c81690a1b8959c65ae9dd` (`Document PrecedentOS case appeals and decision authority`). GitHub acknowledged a normal push `main -> main`. The immediate independent `git ls-remote` SHA read failed because this host could not connect to `github.com:443`; therefore a separate post-push SHA read is **blocked**, not claimed. The local commit SHA and successful push acknowledgement are known.
- No ignored artifacts were deleted, enumerated for cleanup, or restored. No deployment, Docker action, wallet signature, write transaction, package installation, or production Registry/Evaluator edit occurred.

## 2. Recommended authority architecture

**Recommend B: CaseCourt-owned adjudication for the first authoritative case decision.** The Court owns the case snapshot and decision history, validates the caller against transaction context, recomputes the ordered locked-evidence commitment, checks supplied bounded evidence bytes against the immutable digests, reads case-fixed policy/criteria versions, runs the future AI/Equivalence Principle path, and appends a decision record in one transaction. This avoids making an unproven cross-contract read or a caller-selected evaluator address the authority boundary.

Architecture A (separate CaseDecisionEngine) is documented as a future option, but requires proven Court-to-engine view calls, immutable address identity, case evidence-root reads, and extra transaction/configuration surfaces. Architecture C (authenticated child message on `on='finalized'`) is appropriate later for finality-dependent projections or side effects; it does not itself validate evidence or legal merits and adds asynchronous retry/fee/idempotency concerns.

This is an architecture recommendation only. Existing CaseCourt is unchanged in Stage 3A. The new local schema helper is not a production contract, and current CaseCourt continues to treat references as unverified.

## 3. GenLayer capability and status register

Statuses mean: **Implemented** = source exists; **Locally tested** = code exercised in the local environment; **Verified on Studionet** = direct stable-chain evidence; **Blocked** = a required proof is unavailable; **Not started** = no project implementation/proof exists. Documentation confirmation is stated separately from live execution.

| Capability | Status | Evidence and limit |
|---|---|---|
| Stable Studionet identity | **Verified on Studionet (user-reported read-only check only)** | User reports prior `eth_chainId = 0xf22f` (`61999`). Current official Networks docs specify `https://studio.genlayer.com/api`, ID `61999`, and distinguish Studio-dev `61997`. Codex did not repeat the blocked socket request. No write was sent. |
| Supported GenVM runner | **Blocked** | Contract header pins `py-genlayer:1jb45...`; local linter reports cached newer `babwp9...`, while upstream lookup failed `WinError 10013`. No authoritative artifact maps either hash to the current stable Studionet runner. |
| Contract-to-contract view calls | **Blocked for project integration** | Current official docs show synchronous `gl.get_contract_at(addr).view().method()` and state as-of-current-block semantics. No two-IC test passed in the available environment. |
| Child-transaction semantics | **Blocked for project integration** | Official docs define asynchronous `emit(on='accepted'|'finalized')`, child `sender_address` as calling IC, and original `origin_address`. Accepted work can be emitted more than once or survive an appeal; finalized is the safe documented timing. No project child transaction executed. |
| AI nondeterministic execution | **Locally tested (mocked)** | Evaluator implements bounded `gl.nondet.exec_prompt`; Direct Mode tests mock nondeterministic execution. Current docs show AI/LLM contract APIs. No live model execution occurred. |
| Custom Equivalence Principle | **Locally tested (mocked)** | Evaluator uses `gl.vm.run_nondet_unsafe` and compares decision-bearing fields; tests mock this path. Docs support the custom validator pattern. No live validator disagreement or accepted consensus was proven. |
| Transaction timestamp behavior | **Locally tested / documentation-confirmed** | CaseCourt Direct Mode tests deterministic freeze-time behavior; current docs state transaction-pinned `datetime.now()` / `gl.message_raw['datetime']` and no block number/hash. No live timestamp was recorded. |
| Receipt and finality behavior | **Blocked for project runtime** | Current docs distinguish `ACCEPTED` from `FINALIZED`, and success requires an appropriate execution result as well as lifecycle status; node APIs include status, lifecycle and receipt methods. No live receipt or finalization was observed. |
| Web Render | **Not started / blocked** | Official docs show `gl.nondet.web.render(url, mode='html'|'screenshot')`. Project UI remains disabled; URL/redirect/private-network controls and stable runner behavior are unverified. |
| Deployment and fees | **Blocked** | Official docs describe Studio and fee-profile/estimate flows. Current pages emphasize v2 SDK/fee tooling and identify v0.6 RC as Studio-dev-specific. Applicable stable fee model and compatible command/API for pinned GenLayerJS 1.1.8 are unresolved. No profile or deployment was run. |
| GenLayer Studio browser workflow | **Documentation-confirmed / not started locally** | Official Studio docs describe loading a contract, constructor detection and deployment. Browser flow was not opened or executed. No address is available. |

## 4. Runtime verification details

Current official sources reviewed on 2026-10-13:

- [Networks](https://docs.genlayer.com/developers/networks): stable Studionet RPC and chain ID; separate Studio-dev and localnet identity.
- [IC interaction](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts): `get_contract_at`, synchronous views and asynchronous emitted writes.
- [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages): child transaction timing, sender/origin, replay and accepted-vs-finalized risks.
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context): deterministic transaction time and missing block metadata.
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle): `run_nondet_unsafe` error handling and custom validators.
- [Web Access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access): documented render modes only; project security/runtime controls remain unverified.
- [Finality](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality) and [fee outcomes](https://docs.genlayer.com/developers/decentralized-applications/fee-outcomes-and-debugging): finality and execution success are separate checks.
- [Fees and transaction policy](https://docs.genlayer.com/developers/decentralized-applications/fees-and-transaction-kit), [fee profiling](https://docs.genlayer.com/developers/decentralized-applications/fee-profiling-and-estimation), and [Studio deployment](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/deploying-contract): current guidance, not evidence of stable-vs-pinned-SDK compatibility.

Installed project inventory from prior local inspection: Python 3.12.10; `genlayer-test==0.29.2`; `genlayer-py==0.16.3`; `genvm-linter==0.11.1rc2`; CLI package `0.40.0-rc.3`; frontend `genlayer-js==1.1.8`. The CLI executable previously failed while accessing the existing `.genlayer` directory; no permission/configuration changes were made. The current official docs' GenLayerJS fee/deployment snippets use the v2 API family and reserve RC tooling for Studio-dev. This does **not** prove v1.1.8 incompatible with stable; it leaves compatibility unresolved.

Read-only identity commands and manual Studio checks are in `docs/V2_LIVE_VERIFICATION_CHECKLIST.md`. The user's historical `0xf22f` is accepted as user-provided observation, not re-described as a Codex RPC result.

## 5. Safe Stage 3A implementation

Created a pure Python local package and TypeScript mirror for bounded case evidence roots, case-bound input commitments, structured result digests, candidate binding checks, exact appeal targets, duplicate/replay checks and conservative authority-status mapping. A shared fictional vector is tested in both languages. No helper is imported by production contracts or used by the frontend to infer chain authority.

The deterministic checks intentionally require an expected case context and a trusted record mapping. In production, these values must come from a verified Court state read and an operator-reviewed deployment manifest; a browser map or caller payload alone is not trustworthy. The `OPERATOR_REVIEWED` marker is descriptive local configuration, not cryptographic attestation.

## 6. Files added or modified

Stage 3A files (all remain uncommitted and unpushed):

- Added `precedentos_protocol/__init__.py` and `precedentos_protocol/case_decision.py`.
- Added `frontend/src/lib/genlayer/caseDecision.ts` and `frontend/src/lib/genlayer/caseDecision.test.ts`.
- Added `tests/test_case_decision_schema.py` and `tests/fixtures/case_decision_vectors.json`.
- Added `docs/V2_STAGE_3A_REPORT.md`, `docs/V2_CASE_BOUND_DECISION_DESIGN.md`, and `docs/V2_LIVE_VERIFICATION_CHECKLIST.md`.
- Updated `docs/V2_ACCEPTANCE_MATRIX.md`, `docs/V2_IMPLEMENTATION_MASTERPLAN.md`, `docs/V2_RUNTIME_VERIFICATION.md`, `docs/V2_STAGE_1_REPORT.md`, and `docs/V2_STAGE_2_REPORT.md` with Stage 3A status and preservation corrections.
- No production contract file changed during Stage 3A. Stage 2's `contracts/case_court.py` change is already part of commit `9644d99`; Registry/Evaluator files remain byte-identical to that commit.

Stage 2's 11-file committed inventory is recorded in the commit and in `V2_STAGE_2_REPORT.md`. `manual-deployment/` remains untracked and untouched.

## 7. Security review

- **Forged decision IDs:** unresolved IDs fail lookup against an explicitly supplied record set. A forged ID alone cannot establish existence. Production lookup source remains unverified.
- **Case/evidence substitution:** local candidate validation checks exact case ID, version and evidence commitment; these fields are bound into input SHA-256. This does not authenticate the caller's context.
- **Unauthorized adjudication:** local helper checks participant membership. Production must enforce `gl.message.sender_address` in the CaseCourt method; the helper is not an authorization substitute.
- **Duplicates/replay:** unique decision IDs and case binding are checked locally. Production must persist replay keys before any other accepted state mutation.
- **Criteria mismatch:** schema and criteria versions/digest are included and checked. Current CaseCourt v1 does not yet store this complete criteria tuple.
- **Forged contract identity:** local candidate checks the Court address against expected context. Address equality from a caller-controlled config is insufficient; only fixed contract context and verified deployment manifest can anchor it.
- **Pending/finality confusion:** status mapping never treats `PENDING` or `ACCEPTED` as finalized. `FINALIZED` without `FINISHED_WITH_RETURN` maps to `UNKNOWN`; a finalized error maps to `FAILED`.
- **Appeal substitution:** appeal target checks exact case, decision ID, decision version and result digest.
- **History preservation:** the local append helper returns prior records unchanged; production must keep CaseCourt append-only and reject overwrite/delete.
- **Digest limitations:** SHA-256 commitments bind supplied UTF-8 bytes and fields but do not prove truth, admissibility, identity or source authenticity.
- No private keys, seed phrases, credentials, full case documents or personal data were introduced.

## 8. Test evidence

Final commands and observed results:

```powershell
python -m pytest tests/ -q --rootdir=. --artifacts-dir C:\Users\USERpc\AppData\Local\Temp\precedentos-stage3a-final2\artifacts
# 119 passed, 2 skipped in 58.26s

Set-Location frontend
npm run lint
# passed
npm run typecheck
# passed
npm test
# 5 files passed, 39 tests passed
npm run build -- --outDir C:/Users/USERpc/AppData/Local/Temp/precedentos-stage3a-final2/frontend-dist
# passed; 486 modules transformed; output outside the repository
```

Focused Stage 3A schema runs also passed: **18 Python cases** after the final exact-byte/replay additions (included in the full suite) and **14 TypeScript cases** (included in the full frontend suite). The final full-run Python log reports 119 total and 2 opt-in runtime skips. The final Vitest log reports 39 total across 5 files.

GenVM lint, each as a separate invocation with process-local UTF-8 output, passed `contracts/case_court.py`, `contracts/precedent_registry.py`, and `contracts/precedent_evaluator.py` (3 checks each). Each invocation could not query the upstream runner catalog (WinError 10013) and used cached artifacts; these are lint results only, not stable Studionet runner validation.

Stage 3A test/build outputs were directed to isolated temporary paths. No ignored project artifacts were deleted or cleaned.

## 9. Manual verification steps

1. In ordinary Windows PowerShell, run the read-only `eth_chainId` check in `V2_LIVE_VERIFICATION_CHECKLIST.md`; expect `0xf22f` and stop on mismatch. Do not repeat if Windows blocks the socket.
2. Open `https://studio.genlayer.com` and ensure stable Studionet, not Studio-dev. Do not connect/sign or submit a write during this Stage 3A verification.
3. Record the displayed Studio environment/version and obtain an official stable runner hash mapping. If Studio/docs do not expose it, keep the runner gate blocked.
4. Review the matrix snapshot and the architecture document. The user-facing UI must continue to label Stage 2 decision references unverified.

## 10. Verdict

**CONDITIONAL GO for Stage 3B only as a non-deploying local/runtime discovery and case-bound contract prototype behind the documented runner, integration, and fee gates. NO-GO for enabling authoritative decision writes or deploying to Studionet.** The next stage must prove the selected current runner, the exact GenLayerJS/receipt lifecycle path, and the CaseCourt evidence-root + EP behavior before any case result is presented as authoritative.
