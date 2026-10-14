# PrecedentOS 2.0 — Stage 9 Live Diagnostic Verification

**Date:** 2026-10-14
**Network:** stable Studionet, chain ID 61999
**Scope:** review of user-provided live diagnostic evidence, read-only receipt attempt, and frontend consensus/finality hardening. No transactions were submitted by this Stage 9 work.

## Evidence provenance

The four transaction IDs and outcomes below were supplied by the user from GenLayer Studio Explorer and contract readbacks. The deployment screenshot independently visible in this conversation shows the diagnostic contract `0xbD809d35095A8CC260b9Abd6e65F42d5348800B2` with one deployment transaction, **FINALIZED**, consensus **Accepted**, and GenVM **SUCCESS**. No receipt or consensus object was independently retrieved by this run; the RPC calls below failed before returning transaction data. No production Registry, Evaluator, or CaseCourt address was supplied or verified.

| User-provided diagnostic transaction | Reported explorer outcome | Reported readback / interpretation |
|---|---|---|
| `0x2ebf974b0ef4065321d27b5b4e043f9ca348163d4051d1ddaa5bc9a45bef2c24` | FINALIZED; consensus Accepted; GenVM SUCCESS | Context write readback: chain 61999, `probe_count=1`, sender/origin/contract address and transaction datetime matched. |
| `0x56654204c47ee4d75d339aa5a69925b8db6b3756edbbb848509628311aba3bda` | FINALIZED; consensus Accepted; GenVM SUCCESS | User reports AI/Equivalence Principle result `POTENTIAL_CONTRADICTION`, `probe_count=2`, input commitment `71c801a9d71ae550afea862827de530cdb85944e57f0a739c887e3f67035a79b`. The GenVM log also emitted the storage warning described below. |
| `0x08c8a6564af1e75de91c1fa315260ba4300971caeb76eae941b4aca2a1d0cda2` | FINALIZED; consensus Accepted; GenVM ERROR; result reported Rollback | User reports readback unchanged at `probe_count=2`. This is user-provided evidence of an error/rollback case for the probe only. |
| `0x137d55f0262ae4e5a966e954c405a5a0d700769ffdf0ee13ad2f49d541870b4e` | Explorer: FINALIZED; consensus Undetermined; rotation count 3; initial validators 5; GenVM SUCCESS/Return | User reports post-transaction `get_probe_state` unchanged (`probe_count=2`, prior AI probe ID/event/classification/commitment). A successful leader GenVM return is not proof of accepted consensus or an applied contract state transition. |

These reports establish meaningful live evidence for the isolated `StudioRuntimeProbe` to the extent of the user's explorer and readback observations. They do not establish a production-contract deployment, legal correctness, a stable runner identity, or any Registry/Evaluator/CaseCourt integration.

## Independent read-only receipt attempt

Executed GenLayerJS 1.1.8 `client.getTransaction({ hash })` for all four supplied transaction IDs against the SDK's installed `studionet` chain definition (chain RPC in the installed SDK: `https://studio.genlayer.com/api`). Command ran from `frontend/`:

```powershell
node --input-type=module -e "import { createClient } from 'genlayer-js'; import { studionet } from 'genlayer-js/chains'; const c = createClient({chain: studionet}); const hs = ['0x2ebf974b0ef4065321d27b5b4e043f9ca348163d4051d1ddaa5bc9a45bef2c24','0x56654204c47ee4d75d339aa5a69925b8db6b3756edbbb848509628311aba3bda','0x08c8a6564af1e75de91c1fa315260ba4300971caeb76eae941b4aca2a1d0cda2','0x137d55f0262ae4e5a966e954c405a5a0d700769ffdf0ee13ad2f49d541870b4e']; const task=Promise.allSettled(hs.map(async hash => { const tx=await c.getTransaction({hash}); return {hash,statusName:tx.statusName,resultName:tx.resultName,txExecutionResultName:tx.txExecutionResultName,lastRound:tx.lastRound}; })); const result=await Promise.race([task,new Promise(resolve=>setTimeout(()=>resolve('READ_TIMEOUT_15000MS'),15000))]); console.log(JSON.stringify(result)); if(result==='READ_TIMEOUT_15000MS') process.exit(2);"
```

Each call failed with `UnknownRpcError`, `details: "fetch failed"`, `shortMessage: "An unknown RPC error occurred."` No status, receipt, `resultName`, votes, or consensus metadata was independently returned. One bounded attempt was made; no retry loop was run.

## FINALIZED with Undetermined and a successful GenVM return

The states refer to different layers. `FINALIZED` is a terminal protocol lifecycle status; the user-reported **Undetermined** is the consensus result for the evaluated round; GenVM **SUCCESS/Return** describes the leader execution result. These fields do not imply one another. The unchanged state readback is consistent with the undetermined transaction not applying the leader's proposed state, but that is attributed to the user's readback, not independently verified here.

GenLayerJS 1.1.8's installed declarations expose these distinct fields on `GenLayerTransaction`:

- `statusName?: TransactionStatus`, including `UNDETERMINED` and `FINALIZED`.
- `resultName?: TransactionResult`, including `NO_MAJORITY`, `MAJORITY_AGREE`, and `MAJORITY_DISAGREE`.
- `txExecutionResultName?: ExecutionResult`, including `FINISHED_WITH_RETURN`, `FINISHED_WITH_ERROR`, and `NOT_VOTED`.
- `lastRound` validator vote/result fields; `consensus_data` is also declared but may be omitted depending on network response.

The installed 1.1.8 `getTransaction` decoder creates `resultName` from the transaction's numeric `result`; `waitForTransactionReceipt` returns the transaction data at the requested status. The package does not expose the newer documented `isSuccessful` helper, so this application does not call it. In light of the observed combination, the safe frontend success predicate is now explicit: both transaction and finalized receipt must report `resultName === MAJORITY_AGREE`, the receipt must report `statusName === FINALIZED`, and `txExecutionResultName === FINISHED_WITH_RETURN`. Missing consensus evidence stays `unknown`; a known non-majority/disagreement result is `failed`. No result is read back as an authoritative evaluation unless this gate passes.

This conservative predicate is tested locally against SDK-shaped objects. It has not yet been validated against a returned object from the live Studionet RPC because the independent lookup failed.

## Nondeterministic storage warning audit at the starting commit

Observed message, supplied by the user: `Detected pickling storage class. Reading storage in nondet mode is not supported`.

Official GenLayer storage/non-determinism documentation says persistent storage cannot be accessed directly inside a nondeterministic block and storage-backed objects must be copied to memory before being used there. In the isolated probe, `run_ai_equivalence_probe` passes closures that invoke `self._validate_result` from the leader and validator functions. These helpers validate the returned JSON and read no declared probe state fields. The AI transaction reportedly completed and its result was read back, so this warning did not prevent that particular reported probe result. The warning's precise emission point and whether it represents an actual storage dereference or a conservative warning caused by the closure's bound `self` require a GenVM trace/log and controlled reproduction; no independent trace is available.

Source audit:

- **PrecedentRegistry:** no nondeterministic API calls, so the warning path does not apply to Registry code.
- **PrecedentEvaluator:** its leader/validator closures call bound validation helpers through `self`; the comparison inputs are prepared before the nondeterministic call and no `self.evaluations` map access is intended inside those helpers. The closure pattern remains a runtime risk until it is proven harmless or refactored and tested.
- **CaseCourt:** its nondeterministic paths likewise call bound validators/equivalence helpers through `self`. Case/evidence/appeal storage is collected into deterministic local objects before those blocks; no storage map access is intended inside the cited validation helpers. Given the warning, this pattern is also a runtime risk pending trace/reproduction. Registry is unaffected by this specific risk.

At this report's starting commit, no production contract had yet been modified for the warning. The source-level changes and regression evidence from the continuation of Stage 9 are recorded below. Do not treat the change or Direct Mode results as proof that the live warning is gone.

## Frontend changes

- Transaction completion now requires `FINALIZED` + `MAJORITY_AGREE` + `FINISHED_WITH_RETURN`; it checks the consensus result on both `getTransaction` and the finalized receipt.
- `UNDETERMINED`, validator timeout, leader timeout, missing `resultName`, disagreements, and unknown future statuses cannot become a successful evaluation.
- The comparison page reads an evaluation only after the success gate and checks the returned evaluation ID, both record IDs/digests, and exact input commitment against the submitted request before displaying it.
- CaseCourt judgment and appellate finalization helpers now require explicit majority agreement in addition to successful execution, contract state and finality.
- Web Render remains hard-disabled (`WEB_RENDER_RUNTIME_ENABLED = False`). Reviewer governance remains unresolved and production governance writes remain disabled. Appeals retain the existing freeze and recovery rules; no unilateral unfreeze path was introduced.

## Local verification

Focused frontend checks after the changes:

- `npm test -- --run src/lib/genlayer/client.test.ts src/lib/genlayer/caseCourtAdjudication.test.ts src/lib/genlayer/caseCourtAppeals.test.ts` — **29 passed**.
- `npm run typecheck` — **passed**.

Full Stage 9 checks:

- `python scripts/run_tests_safe.py tests` — **232 passed, 4 skipped (236 collected)**; artifacts were redirected to `C:\Users\USERpc\AppData\Local\Temp\precedentos-gltest-q8jjtlkh`. Skips are opt-in localnet identity/cross-contract checks.
- `npm run lint` — **passed**.
- `npm run typecheck` — **passed**.
- `npm test` — **70 passed across 10 files**.
- `npm run build` — **passed**, Vite built 488 modules.
- `genvm-lint check ... --json` for Registry, Evaluator, CaseCourt, and the probe — **all four passed lint and schema validation**. Linter could not contact upstream `genvm-manager` (`WinError 10013`) and used its cache; it emitted `I200` newer runner warning (`babwp9…`). This is not stable-runner verification.

Existing Direct Mode tests remain mocks and cached GenVM lint is not a live runner test.

## Remaining blockers

1. Independent stable Studionet transaction/consensus reads failed with `fetch failed` in this host.
2. The installed SDK's `resultName` field semantics need one independently retrieved live `GenLayerTransaction` object to confirm the current explorer's Undetermined label maps to `NO_MAJORITY` (or another explicit non-agreement result).
3. The storage warning's origin and elimination remain unverified. The production Evaluator, CaseCourt and diagnostic now call module-level pure helpers from nondeterministic callbacks, and a new A/B diagnostic compares a bound-helper callback with a module-level pure function in Direct Mode. A GenVM/Studionet A/B execution with complete logs/trace is still required; the deployed diagnostic uses the prior source.
4. Production Registry, Evaluator and CaseCourt addresses are unverified/unavailable; no production contract was deployed or verified.
5. Stable Studionet runner/fee compatibility, actual production contract validation, cross-contract calls, successful and rejected production writes, and appeal/freeze behavior remain unverified.
6. Reviewer governance policy, appeal liveness and recovery policy remain open; Web Render egress, redirect, DNS/private-IP and pre-read resource protections remain unverified and disabled.

**Stage 9 verdict:** **CONDITIONAL GO** for continued read-only evidence review and local adapter validation. **NO-GO** for production contract deployment or governance writes until the storage warning, stable runtime compatibility, fees, contract addresses, and policy/security gates are resolved.

## Stage 9 storage-compatibility continuation

The continuation refactored every active production `run_nondet_unsafe` validation/prompt helper path to module-level pure functions. `PrecedentEvaluator`, CaseCourt's source comparison, judgment, contradiction and appeal paths, the disabled Web Render path, and `StudioRuntimeProbe` no longer access validation helpers through a bound `self` inside their nondeterministic callbacks. The source audit found no intended storage reads in these helpers before the refactor. Inputs are read/validated in deterministic code and persisted only after the EP call returns. Registry has no nondeterministic call.

An isolated `NondetStorageCaptureProbe` test contract exercises both a bound-self helper and an equivalent module-level function using Direct Mode. The local test passed for both, and an AST guard checks that production callback bodies and `_pure_*` helpers do not reference `self`. The installed linter rejected `@staticmethod` contract methods with `E022`, so the implementation uses module-level functions and retains simple instance wrappers. This is a verified local source change, not evidence that the warning is removed by GenVM.

Current official documentation states that persistent storage cannot be read inside nondeterministic blocks and documents `gl.storage.copy_to_memory` for storage values needed there. No relevant storage read was required in the audited validation helpers, so this change avoids rather than copies any storage-backed instance. The exact warning cause remains unproven because this host did not retrieve a live trace and the user-deployed probe still runs its pre-refactor bytecode. Do not redeploy or send the new A/B transactions without separate explicit approval.

Continuation verification: focused affected Python suites **128 passed**; full protected Python suite **234 passed, 4 skipped**; `genvm-lint 0.11.1rc2` passed lint/schema for Registry, Evaluator, CaseCourt, the original probe, and the new A/B diagnostic using cached artifacts; frontend lint/typecheck passed, Vitest **70 passed**, and production build passed. The linter's upstream lookup remains blocked by `WinError 10013` and reports a newer cached-runner warning; no stable Studionet runner compatibility is established. Full details are in [Stage 9 Storage Compatibility](V2_STAGE_9_STORAGE_COMPATIBILITY.md) and [Production Deployment Gate](V2_STAGE_9_PRODUCTION_DEPLOYMENT_GATE.md).

**Updated Stage 9 verdict:** source-level storage capture risk reduced; warning origin/elimination **BLOCKED** on an approved runtime A/B test. Registry is separately unaffected by this warning but not deployment-ready. Evaluator and CaseCourt remain **NO-GO** for production deployment; CaseCourt also retains independent governance, appeal/finality and Web Render security blockers. Overall production deployment remains **NO-GO**.

## References

- Installed pinned SDK metadata: `frontend/node_modules/genlayer-js/package.json` (`1.1.8`); exposed transaction declarations: `frontend/node_modules/genlayer-js/dist/index-C3Ul1Rte.d.ts`; transaction decoder and receipt implementation: `frontend/node_modules/genlayer-js/dist/index.js`.
- Official storage model and copying storage objects to memory: [Persisting data on blockchain](https://docs.genlayer.com/developers/intelligent-contracts/storage).
- Official nondeterministic execution restrictions: [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism).
- Current protocol status semantics: [Transaction statuses](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses).
- Current transaction and execution success distinctions: [Fee outcomes and debugging](https://docs.genlayer.com/developers/decentralized-applications/fee-outcomes-and-debugging). These current pages explain protocol distinctions; the installed GenLayerJS 1.1.8 types and implementation were used for the application adapter rather than newer SDK-only helpers.

## Registry registration addendum — user-supplied Explorer details

The user supplied an Explorer transaction detail for `0xc4775a389916cf1b5a13f233bfecbc9ddd7ed3f126b1e58ca98baa6c08de6497`, dated Oct 14, 2026. It reports a **FINALIZED** call, consensus **Accepted**, GenVM **SUCCESS**, result code **Return**, return value `null`, and empty stdout/stderr. The call is `register_precedent` to `0xd19FfF91FaB33932A70CB9e2927159a8F103945C`, from `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`, with the fictional record ID, digest, schema version, jurisdiction, date and category listed in [the deployment manifest](V2_DEPLOYMENT_MANIFEST.md).

**Evidence provenance:** all transaction details in this addendum were transcribed from the user-provided Explorer text. An independent browser retrieval was attempted, but the Explorer transaction URL was inaccessible to the retrieval tool; no independent receipt or consensus object was obtained. The supplied transaction excerpt does not show chain ID, deployment transaction/hash, source bytecode verification, fee, or a subsequent Registry state readback. Thus the evidence supports a user-reported successful call to the address, but Registry persistence/readback and stable Studionet identity for this specific transaction remain pending. `Value: 0 GEN` is the call value and is not treated as evidence that the network fee was zero.

The known diagnostic storage warning remains a compatibility risk as directed by the user; this Registry call does not exercise a nondeterministic path and does not establish that the warning is harmless for other contracts.

## Registry readback and network confirmation addendum — user-supplied

After the transaction detail above, the user reported that `get_precedent("FICT-STUDIONET-001")` returned the expected full record: digest `250aeca6a5a10722549b4aeb3fafb292d6531033dcc0bf5a5a612fdf893ffa04`, schema version `1`, jurisdiction `Fictional North District`, date `2030-01-15`, category `Fictional permit dispute`, registration sequence `1`, and submitter `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`. The user also reported `has_precedent(...) == true`, `get_registration_count() == 1`, and confirmed that the Studio selector showed stable Studionet, chain ID `61999` during these reads.

This is a **user-reported Registry functional smoke-test pass** for one accepted registration and its readback. It is not an independent RPC/receipt retrieval: the transaction excerpt omitted chain ID, the deployment transaction and source/bytecode verification were not provided, and this host's Explorer retrieval attempt was inaccessible. Live duplicate/invalid rejection and rollback-preservation checks remain pending. The Registry's diagnostic warning exposure is not applicable because it has no nondeterministic execution path.

## Evaluator deployment screenshot addendum — user-supplied

A user-provided Studio Explorer screenshot shows a contract at `0x6c1571C445D12ECeD90CAddE677bD0ee9694487D`, with one deployment transaction. The transaction row shows deployment/constructor, GenVM **SUCCESS**, consensus **Accepted**, and status **ACCEPTED**. The displayed transaction hash is truncated to `0x028b4d3a...2f1f8a96`. The screenshot does not show the selected chain ID, full hash, or deployed source/bytecode. The user subsequently reports that the status is now **FINALIZED**; no updated screenshot or full hash was supplied for that change. No Evaluator method call or AI/Equivalence result is claimed yet.

### Evaluator transaction attempt — user-supplied

The user supplied details for call `0x050d94e373687dc22a26e08d2c3f3561d37dd1dbba61d0b640913c6e57f940a7` to `0x6c1571C445D12ECeD90CAddE677bD0ee9694487D`. It reports **FINALIZED**, consensus **Undetermined**, rotation count `3`, initial validators `5`, and GenVM **SUCCESS/Return** with `null`. The arguments match the planned fictional `evaluate_pair` test in the manifest. This is not a successful accepted evaluation; no per-validator votes or post-call readback were supplied.

The Explorer-rendered Equivalence output reports a possible contradiction, same material issue, differing outcomes and a nonempty contradiction finding, but also `material_similarity=false`; its reasoning says the material facts are identical. This appears internally inconsistent for the supplied passages. It does not by itself establish why validators did not reach consensus. The live deployment source is not bytecode-verified.

In response, local `contracts/precedent_evaluator.py` now rejects a potential-contradiction result unless `material_similarity` is true. A regression test confirms rejection and no persistence in Direct Mode. This local fix does not alter the already-deployed address and requires a new deployment for runtime verification. The user then reported `has_evaluation(...) == false` and `get_evaluation_count() == 0`, confirming this attempted ID was not persisted; `get_evaluation(...)` was not separately queried.

### Hardened Evaluator redeployment — user-supplied screenshot

The user supplied a second deployment screenshot showing a contract address and deployment **FINALIZED**, consensus **Accepted**, and GenVM **SUCCESS**. The deployment hash is abbreviated (`0x69e2775a...a72d42d3`), and neither chain ID nor source/bytecode appears in the screenshot. The following successful call's full `To` field gives the canonical address `0x5DEeD1A620e9ecd70b1Ae4e6f0F130CF9D272666`; this corrects an earlier one-character-short screenshot transcription. Source equivalence remains unverified.

### Matching-case AI/Equivalence call — user-supplied

The user supplied transaction `0x8f7a58bf3de0cbb9c6a1578eae9dcf7967825b50babd02dd00d930e2e4941631` to the canonical Evaluator address above. It reports **FINALIZED**, consensus **Accepted**, GenVM **SUCCESS/Return**, rotation count `0`, and initial validators `5`. The method is `evaluate_pair` with the matching fictional case in the manifest. The Equivalence output reports `material_similarity`, sufficient evidence, same material issue, no outcome difference, no potential contradiction, and four similarity findings. This is a positive user-reported runtime AI/EP result, not legal correctness or independent receipt retrieval.

The user subsequently supplied the `get_evaluation("EVAL-STUDIONET-MATCH-001")` result. It contains the expected evaluation ID, `material_similarity` classification, matching decision-bearing fields, versions `1`, the two input record IDs and digests, and input commitment `b32b5d2e0e9089a4685c0e30bce0b75779583b4f19d83a9967d5797f6ca37635`. This is user-reported persisted-state readback and is consistent with the transaction; it was not independently retrieved. `has_evaluation` and count readbacks remain outstanding. The transaction detail itself does not show chain ID; the user's earlier Studio selector confirmation was for stable Studionet 61999, but this transaction's network context is not independently retrieved.
