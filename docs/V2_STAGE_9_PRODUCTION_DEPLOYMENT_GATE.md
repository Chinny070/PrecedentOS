# PrecedentOS 2.0 — Stage 9 Production Deployment Gate

**Date:** 2026-10-14
**Network target:** stable GenLayer Studionet, chain ID `61999`
**Current verdict:** **NO-GO for production contract deployment or governance writes.** Read-only review and approval of a separate disposable diagnostic may continue.

## Evidence boundary

At the time of the original gate, only the disposable `StudioRuntimeProbe` address was in evidence. Subsequent user-provided Studio results now report Registry and hardened Evaluator deployments and calls; their provenance is recorded in [Stage 9 Live Verification](V2_STAGE_9_LIVE_VERIFICATION.md) and [the deployment manifest](V2_DEPLOYMENT_MANIFEST.md). Those outcomes were not independently retrieved, deployed source equivalence is not established, and no CaseCourt address is in evidence. Independent GenLayerJS 1.1.8 transaction retrieval attempts previously returned `fetch failed`.

The deployed probe reportedly completed one genuine LLM/Equivalence Principle transaction, with a stored structured outcome, while emitting the storage warning. A separate forced disagreement reportedly ended Undetermined and left state unchanged. Those results show the user-reported diagnostic behavior only; they do not prove correctness, warning origin, production source compatibility, or legal correctness.

## Contract-by-contract readiness

| Contract | Source and local evidence | Runner/runtime and cost evidence | Security gates | Decision |
|---|---|---|---|---|
| **PrecedentRegistry** | Append-only implementation; 29 Direct Mode tests historically passed. User now reports one successful registration, exact record readback, `has_precedent=true`, and count 1 on Studio. | Cached lint/schema passes; stable runner exact identity, independent receipt/source comparison, and fees are unavailable. | Source authenticity is not established by a digest alone; cross-contract reads remain unverified. | **USER-REPORTED LIMITED LIVE SMOKE PASS**; not a complete security or source-verification pass. |
| **PrecedentEvaluator** | Bounded pair comparison, digest verification, explicit decision-field Equivalence Principle comparison. User reports a matching-case AI/EP transaction accepted and persisted, an Undetermined attempt with no persistence, and a bad-digest ERROR/Rollback with unchanged count. | Cached lint/schema passes; runtime evidence is user-provided and deployed source not bytecode-matched. No independent fee/receipt retrieval. | Caller-supplied Registry IDs remain unverified; no legal correctness. Frontend still requires `FINALIZED AND MAJORITY_AGREE AND FINISHED_WITH_RETURN`. | **USER-REPORTED LIMITED LIVE TESTS**; no Registry re-deployment is implied. |
| **CaseCourt** | 50 public methods; local lifecycle/security suites; reviewer guard regression added; module-level AI validators; Web Render hard-disabled. No CaseCourt deployment reported. | Cached lint/schema passes; upstream runner resolution blocked (`WinError 10013`) and lint reports newer runner. No live CaseCourt schema, fee, rollback, AI, or appeal behavior. | Opposing case party is reviewer (not independent); appeal freeze can become indefinite; production governance/policy, finality, privacy/source-authenticity, legal review and Web Render safeguards remain. | **CONDITIONAL GO for user-controlled fictional deterministic Phase A only; NO-GO for AI until separately fee-approved and NO-GO for appeal/production governance.** See [`V2_CASECOURT_READINESS.md`](V2_CASECOURT_READINESS.md). |

## What is established

- Stable Studionet chain ID is the target `61999`; the supplied probe evidence reports that chain. It is not independently re-queried in this work.
- GenLayer documentation describes storage as inaccessible inside nondeterministic blocks, supports copying storage values to memory for such work, and describes custom validators that independently check decision-bearing fields. The source changes align callback validation with that documented boundary. See official [storage](https://docs.genlayer.com/developers/intelligent-contracts/storage), [non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism), and [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) references.
- Cached `genvm-lint 0.11.1rc2` passes the three production contracts and two diagnostics, with `I200` naming newer runner `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`. Upstream resolution failed with Windows `WinError 10013`; this is **not** evidence the cached runner is the stable Studionet runner.
- Full local Python suite: **234 passed, 4 skipped**. Frontend lint/typecheck passed; **70 frontend tests passed**; production build passed. These results are local.
- The frontend continues to refuse successful judgment/evaluation status without explicit finality, majority agreement and successful GenVM return. The focused existing frontend checks passed in this review; no CaseCourt writes were enabled.
- `WEB_RENDER_RUNTIME_ENABLED = False`; production governance write controls remain disabled. The existing appeal freeze/recovery and reviewer policy were not weakened or bypassed.

## Outstanding release gates

1. **Runner identity:** obtain authoritative stable Studionet evidence for the exact GenVM/Python dependency runner and compare it to each production source header. Do not infer compatibility from RC9/cache or from the one diagnostic result.
2. **Storage warning:** retain as a known compatibility risk. Per user direction, do not spend another cycle investigating it unless a concrete production failure demonstrates a related problem. Existing diagnostic evidence does not prove it harmless for every contract.
3. **Fee and limits:** record actual Studio quote/fee units and approved per-operation/cumulative budgets before any signed transaction. No estimates are asserted here.
4. **Registry proof:** deploy only after user approval; prove successful register, duplicate/invalid rejection, readback, sender and state preservation on the exact runtime. No Evaluator cross-contract integration is implied.
5. **Evaluator proof:** after Registry proof and separate approval, verify real model execution, independent validator decision fields, disagreement/error states, accepted persistence, and exact record/evidence commitment readback. Keep registry references marked unverified until a separately tested supported call path exists.
6. **Native transaction evidence:** independently retrieve transaction consensus, execution outcome, finality and state readback. `FINALIZED`, leader `SUCCESS/Return`, or an explorer label alone must not be conflated with accepted contract state.
7. **CaseCourt policy/security:** resolve reviewer selection/independence and conflicts; appeal liveness and recovery if the case remains frozen; a supported finality anchor; source/evidence integrity and privacy; independent threat/legal review; and verified failure atomicity.
8. **Web Render:** remain disabled until exact runner tests establish redirects, DNS rebinding and private/link-local destination restrictions, outbound policy, response/time limits before expensive work, model/validator comparison and fees.

## Current next action

Registry and the hardened Evaluator have since been user-deployed and functionally exercised in bounded fictional calls; see their evidence overlay below and the deployment manifest. Do not repeat the diagnostic probe transactions or redeploy those contracts for CaseCourt work. The next bounded step is the user-controlled deterministic CaseCourt Phase A smoke described in `V2_CASECOURT_READINESS.md`, after verifying stable Studionet `61999`, Studio's source/schema acceptance, and any displayed fee. It does not include AI or appeal transactions. The AI judgment requires separate approval; appeal lifecycle testing remains blocked on reviewer-selection/conflict and freeze-recovery policy.

**Stage 9 production governance readiness:** **NO-GO**. **CONDITIONAL GO** for CaseCourt Phase A fictional deterministic Studio testing only. The storage warning remains a known compatibility risk and will not be reinvestigated without a concrete related production failure.

## Superseding Registry status — 2026-10-14

The user has since supplied a finalized registration-call detail. This updates the Registry row and the earlier “next experiment” ordering above; it does not change Evaluator or CaseCourt gates.

- **Reported address:** `0xd19FfF91FaB33932A70CB9e2927159a8F103945C` (the `To` address of the supplied call). Deployment transaction/hash and deployed-source verification have not been supplied.
- **Reported functional call:** `0xc4775a389916cf1b5a13f233bfecbc9ddd7ed3f126b1e58ca98baa6c08de6497`, `register_precedent`, reported FINALIZED + Accepted + GenVM SUCCESS/Return. Full fictional arguments and evidence limits are recorded in [the deployment manifest](V2_DEPLOYMENT_MANIFEST.md).
- **Current Registry verdict: GO for the bounded registration/readback smoke test; that smoke test is now reported passed by the user.** The user supplied the finalized accepted registration call, matching record readback, `has_precedent == true`, `get_registration_count == 1`, and confirmation that Studio showed stable Studionet chain 61999 during the reads. Duplicate/invalid rejection and rollback preservation, independent receipt retrieval, deployment transaction provenance, bytecode/source matching and fees remain unverified. Do not overstate this as complete Registry security or source-verification coverage.
- The transaction detail reports `Value: 0 GEN`; this does not establish a zero network fee. No fee quote is in evidence.
- The independent RPC/explorer retrieval remains unavailable, so the call result above is not independently verified. Do not claim source-bytecode equivalence from the method name and ABI arguments alone.
- As instructed, the diagnostic storage warning is retained as a known compatibility risk and will not be investigated further unless production behavior reveals a concrete related issue. Registry contains no nondeterministic path; this does not prove the warning harmless for Evaluator or CaseCourt.

The first Evaluator deployment at `0x6c1571C445D12ECeD90CAddE677bD0ee9694487D` produced an Undetermined AI attempt; user readback `has_evaluation=false` and count `0` confirmed no persistence. The hardened Evaluator deployment is reported at `0x5DEeD1A620e9ecd70b1Ae4e6f0F130CF9D272666` (canonical address from the successful call's full `To` field). Its matching-case AI/Equivalence call is reported FINALIZED + Accepted + GenVM SUCCESS/Return, with a `material_similarity` result; user-supplied `get_evaluation`, `has_evaluation=true`, and count `1` readbacks support persisted state. A subsequent bad-digest call is reported FINALIZED with consensus Accepted but GenVM ERROR/Rollback; `has_evaluation=false` and count unchanged at `1` were read back by the user. This confirms the important distinction between consensus acceptance and successful contract execution and reports a deterministic validation rejection with state preservation. These results are user-supplied; chain identity and source/bytecode identity remain independently unverified. Caller-supplied Registry IDs remain unauthenticated because cross-contract integration has not been proven. CaseCourt remains NO-GO pending reviewer-governance, freeze-recovery, authorization and finality policy/runtime safeguards. Web Render remains disabled.

## CaseCourt review update — 2026-10-14

CaseCourt was audited from source and focused tests. It is conditionally suitable only for a user-operated fictional deterministic Phase A smoke; it is not ready for an AI write until separately approved and not ready for appeal/production governance. Its opposing-case-party reviewer is not independent, and an active appeal freeze has no timeout/recovery other than appellate resolution or bilateral pre-review withdrawal. A new reviewer-authorization regression passed. The full test results, source hash, exact manual inputs/readbacks, and required policy decisions are in [`V2_CASECOURT_READINESS.md`](V2_CASECOURT_READINESS.md). No CaseCourt deployment or transaction is reported. The production verdict remains **NO-GO**.
