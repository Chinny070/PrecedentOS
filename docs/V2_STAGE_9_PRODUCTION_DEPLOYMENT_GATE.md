# PrecedentOS 2.0 — Stage 9 Production Deployment Gate

**Date:** 2026-10-14
**Network target:** stable GenLayer Studionet, chain ID `61999`
**Current verdict:** **NO-GO for production contract deployment or governance writes.** Read-only review and approval of a separate disposable diagnostic may continue.

## Evidence boundary

The only supplied deployed address is the disposable `StudioRuntimeProbe`, `0xbD809d35095A8CC260b9Abd6e65F42d5348800B2`. Its reported deployment and four transaction outcomes are user-provided Explorer/readback observations recorded in [Stage 9 Live Verification](V2_STAGE_9_LIVE_VERIFICATION.md). The independent GenLayerJS 1.1.8 `getTransaction` attempts previously recorded there returned `fetch failed`; this review does not claim independently retrieved receipts. No production Registry, Evaluator, or CaseCourt address is in evidence. The newer Stage 9 callback refactor has not been deployed.

The deployed probe reportedly completed one genuine LLM/Equivalence Principle transaction, with a stored structured outcome, while emitting the storage warning. A separate forced disagreement reportedly ended Undetermined and left state unchanged. Those results show the user-reported diagnostic behavior only; they do not prove correctness, warning origin, production source compatibility, or legal correctness.

## Contract-by-contract readiness

| Contract | Source and local evidence | Runner/runtime and cost evidence | Security gates | Decision |
|---|---|---|---|---|
| **PrecedentRegistry** | Existing source and append-only storage; full protected tests pass. It has no nondeterministic callback, so the specific storage warning does not apply. Cached GenVM lint/schema passes. | No production deployment/readback, exact stable runner mapping, fee quote or per-write cost measurement. Cross-contract reads are not proven and must not be assumed. | No full documents/private evidence intended; review source hash/schema and actual append/retrieval behavior before release. | **NO-GO now**. The warning alone is not a blocker; runner, fee and its own live functional proof are. It is the least entangled production candidate after those gates. |
| **PrecedentEvaluator** | Bounded pair evaluation, actual evidence digest checks, explicit six-field Equivalence Principle comparison and append-after-acceptance; Direct Mode regression passes. Caller-supplied precedent IDs remain unverified assertions. | Its user-deployed counterpart is absent. New source-level pure callback refactor passes Direct Mode and cached lint but has not run on GenVM. The bound-vs-free-function warning A/B has not run on an actual runner. No AI cost profile. | No cross-contract Registry trust; do not display a result as a verified registered precedent. Retain the frontend `FINALIZED AND MAJORITY_AGREE AND FINISHED_WITH_RETURN` gate and exact input readback binding. | **NO-GO** pending exact-runner A/B evidence, production Evaluator AI/EP test, transaction/readback evidence and fees. |
| **CaseCourt** | Lifecycle, evidence, appeal, contradiction, freeze, recovery and append-only mechanisms remain locally tested. AI callback helpers are now module-level. Web Render remains hard-disabled. No CaseCourt is deployed. | No CaseCourt execution or fee profile on the exact stable runner. Linter is cached and reports newer runner availability; no live schema/code proof. | **High unresolved blockers:** reviewer independence/governance, appeal liveness and frozen-case recovery under native disagreement, case/native finality anchoring, private evidence/source authenticity, runtime rollback, independent legal/due-process review. Web Render SSRF/redirect/DNS/private IP, egress, pre-read output/time/cost controls are unverified. | **NO-GO**. Do not deploy CaseCourt until each policy and runtime gate has explicit evidence and review. |

## What is established

- Stable Studionet chain ID is the target `61999`; the supplied probe evidence reports that chain. It is not independently re-queried in this work.
- GenLayer documentation describes storage as inaccessible inside nondeterministic blocks, supports copying storage values to memory for such work, and describes custom validators that independently check decision-bearing fields. The source changes align callback validation with that documented boundary. See official [storage](https://docs.genlayer.com/developers/intelligent-contracts/storage), [non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism), and [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) references.
- Cached `genvm-lint 0.11.1rc2` passes the three production contracts and two diagnostics, with `I200` naming newer runner `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`. Upstream resolution failed with Windows `WinError 10013`; this is **not** evidence the cached runner is the stable Studionet runner.
- Full local Python suite: **234 passed, 4 skipped**. Frontend lint/typecheck passed; **70 frontend tests passed**; production build passed. These results are local.
- The frontend continues to refuse successful judgment/evaluation status without explicit finality, majority agreement and successful GenVM return. The front end was not changed in this work and its full tests passed.
- `WEB_RENDER_RUNTIME_ENABLED = False`; production governance write controls remain disabled. The existing appeal freeze/recovery and reviewer policy were not weakened or bypassed.

## Outstanding release gates

1. **Runner identity:** obtain authoritative stable Studionet evidence for the exact GenVM/Python dependency runner and compare it to each production source header. Do not infer compatibility from RC9/cache or from the one diagnostic result.
2. **Storage warning:** run the isolated Stage 9 A/B diagnostic only after separately approving the new diagnostic deployment, the two specific write transactions and any displayed fees. Capture logs/traces/readback. Warning resolution is not proven by this patch.
3. **Fee and limits:** record actual Studio quote/fee units and approved per-operation/cumulative budgets before any signed transaction. No estimates are asserted here.
4. **Registry proof:** deploy only after user approval; prove successful register, duplicate/invalid rejection, readback, sender and state preservation on the exact runtime. No Evaluator cross-contract integration is implied.
5. **Evaluator proof:** after Registry proof and separate approval, verify real model execution, independent validator decision fields, disagreement/error states, accepted persistence, and exact record/evidence commitment readback. Keep registry references marked unverified until a separately tested supported call path exists.
6. **Native transaction evidence:** independently retrieve transaction consensus, execution outcome, finality and state readback. `FINALIZED`, leader `SUCCESS/Return`, or an explorer label alone must not be conflated with accepted contract state.
7. **CaseCourt policy/security:** resolve reviewer selection/independence and conflicts; appeal liveness and recovery if the case remains frozen; a supported finality anchor; source/evidence integrity and privacy; independent threat/legal review; and verified failure atomicity.
8. **Web Render:** remain disabled until exact runner tests establish redirects, DNS rebinding and private/link-local destination restrictions, outbound policy, response/time limits before expensive work, model/validator comparison and fees.

## Next separately approved experiment

The least risky next runtime action is **not a production deployment**. First, review the isolated source `experiments/stage9/nondet_storage_capture_probe.py` and its hash, confirm Studio shows stable Studionet `61999` and a clear fee quote, then separately authorize (a) deploying this new disposable probe and (b) executing `run_bound_helper_case` and `run_pure_function_case`, including the specific displayed costs. Do not overwrite/redeploy the existing address. Save both transaction IDs, complete logs/traces and state reads. If the fee is unclear, the selected network is not explicitly stable `61999`, or Studio reports an unexpected runner/schema issue, stop before signing.

Only after the warning is understood should Registry be considered as the first production candidate. Evaluator requires an additional approved AI/Equivalence Principle run. CaseCourt remains gated even if the storage warning is resolved.

**Stage 9 deployment readiness:** **NO-GO** for production deployment at this time; **CONDITIONAL GO** only for reviewing and, after separate explicit approval, running the new isolated diagnostic experiment.

## Superseding Registry status — 2026-10-14

The user has since supplied a finalized registration-call detail. This updates the Registry row and the earlier “next experiment” ordering above; it does not change Evaluator or CaseCourt gates.

- **Reported address:** `0xd19FfF91FaB33932A70CB9e2927159a8F103945C` (the `To` address of the supplied call). Deployment transaction/hash and deployed-source verification have not been supplied.
- **Reported functional call:** `0xc4775a389916cf1b5a13f233bfecbc9ddd7ed3f126b1e58ca98baa6c08de6497`, `register_precedent`, reported FINALIZED + Accepted + GenVM SUCCESS/Return. Full fictional arguments and evidence limits are recorded in [the deployment manifest](V2_DEPLOYMENT_MANIFEST.md).
- **Current Registry verdict: GO for the bounded registration/readback smoke test; that smoke test is now reported passed by the user.** The user supplied the finalized accepted registration call, matching record readback, `has_precedent == true`, `get_registration_count == 1`, and confirmation that Studio showed stable Studionet chain 61999 during the reads. Duplicate/invalid rejection and rollback preservation, independent receipt retrieval, deployment transaction provenance, bytecode/source matching and fees remain unverified. Do not overstate this as complete Registry security or source-verification coverage.
- The transaction detail reports `Value: 0 GEN`; this does not establish a zero network fee. No fee quote is in evidence.
- The independent RPC/explorer retrieval remains unavailable, so the call result above is not independently verified. Do not claim source-bytecode equivalence from the method name and ABI arguments alone.
- As instructed, the diagnostic storage warning is retained as a known compatibility risk and will not be investigated further unless production behavior reveals a concrete related issue. Registry contains no nondeterministic path; this does not prove the warning harmless for Evaluator or CaseCourt.

Evaluator deployment is reported at `0x6c1571C445D12ECeD90CAddE677bD0ee9694487D`; the user says it finalized. Its first AI call finalized **Undetermined**, so it is not a successful evaluation. The user then read back `has_evaluation=false` and count `0`, confirming that attempt did not persist an evaluation. The Explorer output shows `same_material_issue=true` and `material_similarity=false` alongside a possible contradiction. Local source hardening now rejects that inconsistent decision combination, with a regression test; it does not change the deployed instance. Before another AI call, deploy the hardened source to a new contract address on confirmed Studionet 61999. Then require FINALIZED + Accepted + GenVM SUCCESS/Return and exact persisted readback. Caller-supplied Registry IDs remain unauthenticated because cross-contract integration has not been proven. CaseCourt remains NO-GO pending reviewer-governance, freeze-recovery, authorization and finality policy/runtime safeguards. Web Render remains disabled.
