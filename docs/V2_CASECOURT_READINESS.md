# CaseCourt Readiness Review

**Review date:** 2026-10-14
**Target:** stable GenLayer Studionet, chain ID `61999`
**Starting repository commit:** `2742ab7e908abd59d8fc9187b16f6bfba57106bb`
**Contract source:** [`contracts/case_court.py`](../contracts/case_court.py)
**Source SHA-256 at review:** `e9f4d73fe243eabd1e18decf2c16abbfa742ee692f04933ca578bf28d4f395de`

## Decision

- **GO, with user-controlled deployment and cost review, for a bounded fictional Phase A deterministic Studio smoke test only.** It covers deployment, case creation, evidence commitment, lock/readback, and a deterministic stale-version rejection. It does not test AI, appeals, or legal authority.
- **CONDITIONAL GO for one fictional AI judgment only after a separate user approval of the displayed fee and the test arguments.** The judgment is an AI-assisted protocol assessment, not legal advice or a legally authoritative judgment.
- **NO-GO for appeal/reviewer lifecycle testing and production governance.** The current reviewer is the opposing case party, not an independent reviewer, and an active appeal can leave the case frozen indefinitely. Do not file an appeal in Studio until reviewer selection and freeze-recovery policy are approved and implemented.
- **No deployment, signature, wallet action, transaction, or Web Render retrieval occurred in this review.**

This is a readiness review of source and local tests; the deployed Registry/Evaluator and Studio outcomes remain user-reported evidence. There is no CaseCourt address or runtime transaction evidence.

## Contract inventory

Cached GenVM lint/schema reports `CaseCourt`, **50 public methods: 28 writes and 22 views**, with **zero constructor arguments**. The contract header pins `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. The cached linter passed but could not fetch the latest runner metadata (`WinError 10013`) and reports a newer runner hash; this is not a stable Studionet runner compatibility proof.

The public write surface covers:

- Case/evidence lifecycle: `open_case`, `append_evidence`, `lock_evidence`, `adjudicate_case`, `attach_decision_reference`, `challenge_decision`.
- Web-source metadata and gated retrieval: `register_web_source`, `approve_web_source`, `request_web_source_capture`, `report_web_source_unavailable`, `capture_web_source`, `compare_web_sources`. `WEB_RENDER_RUNTIME_ENABLED = False`; capture fails closed.
- Contradiction/authority graph: `file_contradiction_challenge`, `evaluate_contradiction_challenge`, `resolve_contradiction_challenge`, `record_authority_relationship`.
- Appeals: `file_appeal`, `append_appeal_evidence`, `lock_appeal_evidence`, `begin_appeal_review`, `adjudicate_appeal`, `resolve_appeal`, `request_appeal_withdrawal`, `approve_appeal_withdrawal`.
- Closure and ordinary challenge freeze: `request_case_closure`, `approve_case_closure`, `request_freeze`, `unfreeze_case`.

Read views include `get_case`, `get_case_count`, `has_case`, `get_evidence`, `get_judgment`, `get_appeal`, `get_appeal_filing`, `get_appellate_ruling`, `get_appeal_evidence`, `get_appeal_recovery_status`, `get_case_action`, `get_case_action_count`, `get_action_count`, `get_current_authority`, `get_authority_relationship`, `get_authority_relationship_count`, `get_contradiction_challenge`, `get_web_source`, `get_web_verification`, `get_web_retrieval_request`, `get_web_source_comparison`, and `is_case_closure_eligible`.

### State, integrity, and authorization findings

- Case state uses versioned snapshots and an append-only action journal. Methods validate action replay IDs, expected versions, phase, identity bindings, fixed schema versions, capacities, and bounded values before writes.
- Evidence is represented by SHA-256 commitments. `append_evidence` stores identifiers and digests, not full evidence. `adjudicate_case` requires the supplied UTF-8 evidence bytes to hash to the locked references and reconstruct the locked ordered evidence root before invoking the model.
- Case judgment and appellate assessment use bounded JSON, fixed criteria, strict result schemas, cross-field consistency rules, and custom Equivalence Principle callbacks that compare decision-bearing fields. Writes follow the nondeterministic call. Direct Mode mocks these calls; it does not prove real validator agreement or failure rollback.
- Appeal target, case, chain, Court, version, judgment/ruling commitment, criteria, and evidence roots are bound. Records are append-only; no deletion or judgment rewrite route was found.
- `gl.message.sender_address` is used for participant checks. A case address is only a protocol key; it does not prove a person's identity, representation, impartiality, or informed consent.
- Current client finality code continues to require lifecycle `FINALIZED`, consensus `MAJORITY_AGREE`, and execution `FINISHED_WITH_RETURN` before a result can be labeled finalized. CaseCourt views themselves explicitly do not prove native transaction finality.
- `datetime.now(timezone.utc)` is used to compute the ordinary 24-hour challenge-freeze deadline. Current official GenLayer Transaction Context documentation states the Python clock is pinned to transaction datetime and is deterministic across validators. This clock is therefore not an observed nondeterminism defect. It is not a present-time oracle, block timestamp, or appeal deadline. See [GenLayer Transaction Context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context).

## Reviewer governance: unresolved policy gate

`_require_not_appellant` enforces two conditions: caller is not the appellant, and caller is one of the two named case parties. This prevents appellant self-review and outsider review. With exactly two case parties, the only eligible reviewer is the opposing party. In a common case, this is also the original judgment submitter. `begin_appeal_review` lets that party initiate the review; there is no separately agreed reviewer address, reviewer authorization registry, conflict declaration, or independent-panel selection mechanism.

That is an **adversarial opposing-party review prototype**, not neutral appellate review. Direct Mode does not establish participant identity on Studionet. The source, UI, and deployment must not call this reviewer independent or describe the AI output as a legally authoritative appellate judgment.

No code change can safely create independent reviewer governance without a protocol rule. Minimal policy choices for approval are:

1. **Fictional prototype only:** keep the opposing-party reviewer for fictional tests, label it non-independent, prohibit real cases, and accept that the existing freeze may persist indefinitely if review fails or stalls. Do not enable a production appeal UI.
2. **Mutually approved named reviewer:** require both case parties to approve a non-party reviewer address in auditable transactions before review. This proves address-level agreement only, not reviewer qualifications or real-world independence; decide conflict disclosure and what happens if the reviewer becomes unavailable.
3. **Governed reviewer set/panel:** approve an explicit authority for reviewer admission, selection, replacement, conflicts, and quorum. This requires a governance policy and implementation; no DAO, multisig, or identity system is presumed here.

For any production appeal path, separately define a fair deadline and recovery authority. Current code deliberately has no unilateral escape: `unfreeze_case` rejects an active appeal freeze; pre-ruling withdrawal requires appellant request plus the other party's approval; withdrawal closes after appellate review begins or a ruling is recorded. If validators return Undetermined or the AI call fails, no ruling write should persist, but the filing freeze remains. If the reviewer disappears or the ruling remains pending resolution, the case can stay frozen. A second-level appeal is available only after a resolved first-level appeal and targets that exact ruling; it can freeze the case again. These safeguards block unilateral erasure but do not provide liveness.

## Test and runtime evidence

The existing appeal tests exercise the successful first-level path, all supported outcomes, remand/reopened evidence, the second-level bound, exact target/commitment binding, bilateral withdrawal, closure, frozen mutation rejection, replay/stale versions, malformed inputs, and mocked model/validator errors. The new focused regression asserts that the appellant and a non-party cannot begin or adjudicate review, that both rejections preserve state, and that the named opposing party is the only allowed prototype reviewer. It explicitly does **not** claim independent review.

The full regression run includes one pre-existing Direct Mode cross-contract probe failure: the test harness permits only one `gl.Contract` subclass per loaded module/process, so its attempt to deploy two classes in one process fails before the view assertion. It is not a CaseCourt failure and does not constitute evidence for or against real cross-contract calls. Four opt-in integration tests are skipped because no approved local runtime is running. Focused CaseCourt and frontend results are recorded below.

All local AI and Equivalence Principle test behavior is mocked Direct Mode. No live CaseCourt consensus, failure rollback, runtime cost, bytecode, or appeal transition has been measured. Keep the separate reported Registry/Evaluator evidence and their deployed addresses; neither requires redeployment for this CaseCourt work.

## Controlled Studio plan

### Phase A — deterministic fictional smoke (deployment and writes are user-operated)

Use exactly this source only after reviewing its SHA-256 above. Upload `contracts/case_court.py` in GenLayer Studio; constructor arguments: **none**. Confirm Studio identifies stable Studionet chain `61999`, accepts the source/schema, and clearly displays any deployment or transaction cost before the user signs. Stop for a runner/schema error, different chain, or unclear fee. No source equivalence or runner compatibility may be inferred from cached lint.

Use two controlled, distinct test addresses: wallet A as petitioner and wallet B as respondent. Do not share keys or seed phrases. Fixture values below are fictional and public.

1. Read `get_case_count()`; on a new deployment expect `0`.
2. Call `open_case` with these arguments in order:
   - `case_id`: `FICT-CASE-STUDIO-001`
   - `action_id`: `STUDIO-OPEN-001`
   - `respondent`: wallet B's `0x` address
   - `case_type`: `Fictional permit dispute`
   - `policy_version`: `1`
   - `opening_evidence_digest`: `f62dfd0b962a9302371819505a3298045177487cd3cd55d128fb19f590e3bf36`
3. Require a genuinely successful lifecycle: FINALIZED + accepted/majority consensus + GenVM successful return. Then read `get_case("FICT-CASE-STUDIO-001")`: expected `phase=EVIDENCE_OPEN`, `version=1`, petitioner wallet A, respondent wallet B, evidence count `0`, not frozen, and the same opening digest. `get_case_count()` should be `1`.
4. Call `append_evidence` at expected version `1`, action `STUDIO-EVID-001`, evidence ID `FICT-EVID-001`, evidence digest `4f04de3ab804739f303d0ffcdfc509dc8da3134e2223a9a20e8c88874fafa15f`, schema `1`, source-reference digest `7b8aa3edc1ca35994730ceebdef4d782eb7dfe9d1470a255a9084bb8faaa6949`. These digests are SHA-256 of the exact fictional UTF-8 strings below. Read `get_evidence(case_id, evidence_id)` and require the stored values and submitter to match.
5. Call `lock_evidence(case_id, expected_version=2, action_id="STUDIO-LOCK-001")`. Read `get_case`: expected `phase=EVIDENCE_LOCKED`, version `3`, count `1`, locked root `49b9695a4f295ab25580193c029231e73a9245144d456011188db4c23517be05`.
6. One safe deterministic rejection: call `lock_evidence` again using stale expected version `2` and fresh action ID `STUDIO-STALE-001`. Expect `stale case version`; verify the case remains byte-for-byte equivalent at version `3`, same locked root, and same action count. Inspect the transaction result, not only its finalized status.

Exact text committed by the hashes:

- Opening note: `Fictional permit applicant submitted a notice requesting a temporary sign on a public walkway.`
- Evidence: `Fictional notice dated 2030-01-15 states that the petitioner requested a temporary permit for one sign on the public walkway.`
- Source-reference note: `Fictional source description: public test exhibit PS-CASE-001, generated solely for PrecedentOS testing.`

### Phase B — AI judgment (separate approval required)

Do not submit until the user separately approves the displayed AI transaction fee. Use `adjudicate_case` only after exact evidence lock readback. Supply expected version `3`, fresh action/judgment IDs, and an `evidence_packet_json` whose evidence array contains the exact item ID and evidence text above. Capture Explorer status, consensus, GenVM outcome, and full readbacks. Treat `UNDETERMINED`, missing consensus data, GenVM error, timeout, or unknown lifecycle as not successful. Require `get_judgment` to bind chain, CaseCourt, case/version, evidence root, input commitment, result commitment, and submitter to the intended request. An accepted result is not legally binding.

### Phase C — appeals

**Do not execute yet.** Wait for reviewer-governance and freeze-recovery policy approval, corresponding source changes/tests, and a separate transaction/cost authorization. In particular do not file an appeal on a case whose indefinite freeze is unacceptable.

## Local verification (2026-10-14)

- New reviewer authorization regression: **1 passed**.
- Focused CaseCourt suite: **148 passed** (Direct Mode; AI/EP mocked).
- Full protected Python suite: **244 passed, 4 skipped, 1 failed**. The only failure is the known experimental two-contract Direct Mode probe, which tries to load two `gl.Contract` classes into one process; the harness raises `only one contract is allowed` before the call. The opt-in localnet identity and three local integration tests are skipped. This does not establish cross-contract runtime support.
- Frontend: lint, typecheck, Vitest, and production build are run against existing source; the transaction gate remains FINALIZED + MAJORITY_AGREE + FINISHED_WITH_RETURN.
- GenVM lint/schema for CaseCourt, Registry, and Evaluator: cached lint and schema validation pass; upstream runner lookup is blocked by Windows socket permission (`WinError 10013`) and the cached linter reports a newer runner hash. No stable-runner compatibility is established.

## Next approval needed

Before implementing or enabling appellate governance, choose the reviewer model and the stuck-appeal deadline/recovery policy. Until then, only the fictional deterministic Phase A smoke test is proposed; keep governance writes disabled and Web Render disabled. CaseCourt production/legal readiness remains **NO-GO**.
