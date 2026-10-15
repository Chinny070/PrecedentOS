# PrecedentOS 2.0 — Stage 9 Live Diagnostic Verification

**Date:** 2026-10-14
**Network:** stable Studionet, chain ID 61999
**Scope:** review of user-provided live diagnostic evidence, read-only receipt attempt, and frontend consensus/finality hardening. No transactions were submitted by this Stage 9 work.

## Evidence provenance

The four diagnostic transaction IDs and outcomes below were supplied by the user from GenLayer Studio Explorer and contract readbacks. The deployment screenshot independently visible in the original conversation showed the diagnostic contract `0xbD809d35095A8CC260b9Abd6e65F42d5348800B2` with one deployment transaction, **FINALIZED**, consensus **Accepted**, and GenVM **SUCCESS**. Later user-provided overlays in this file document Registry and Evaluator addresses and results. No receipt or consensus object was independently retrieved by this run; the RPC calls below failed before returning transaction data. No CaseCourt address was supplied or verified.

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
3. The nondeterministic-storage warning remains a known compatibility risk. Per the user's later instruction, do not investigate it further unless a concrete production failure demonstrates a related issue. Earlier source-level A/B work and its limits remain in the historical storage-compatibility section; no new deployment or transaction is required for this warning.
4. Production Registry, Evaluator and CaseCourt addresses are unverified/unavailable; no production contract was deployed or verified.
5. Stable Studionet runner/fee compatibility, actual production contract validation, cross-contract calls, successful and rejected production writes, and appeal/freeze behavior remain unverified.
6. Reviewer governance policy, appeal liveness and recovery policy remain open; Web Render egress, redirect, DNS/private-IP and pre-read resource protections remain unverified and disabled.

**Stage 9 verdict:** **CONDITIONAL GO** for continued read-only evidence review and local adapter validation. **NO-GO** for production contract deployment or governance writes until the storage warning, stable runtime compatibility, fees, contract addresses, and policy/security gates are resolved.

## Stage 9 storage-compatibility continuation

The continuation refactored every active production `run_nondet_unsafe` validation/prompt helper path to module-level pure functions. `PrecedentEvaluator`, CaseCourt's source comparison, judgment, contradiction and appeal paths, the disabled Web Render path, and `StudioRuntimeProbe` no longer access validation helpers through a bound `self` inside their nondeterministic callbacks. The source audit found no intended storage reads in these helpers before the refactor. Inputs are read/validated in deterministic code and persisted only after the EP call returns. Registry has no nondeterministic call.

An isolated `NondetStorageCaptureProbe` test contract exercises both a bound-self helper and an equivalent module-level function using Direct Mode. The local test passed for both, and an AST guard checks that production callback bodies and `_pure_*` helpers do not reference `self`. The installed linter rejected `@staticmethod` contract methods with `E022`, so the implementation uses module-level functions and retains simple instance wrappers. This is a verified local source change, not evidence that the warning is removed by GenVM.

Current official documentation states that persistent storage cannot be read inside nondeterministic blocks and documents `gl.storage.copy_to_memory` for storage values needed there. No relevant storage read was required in the audited validation helpers, so this change avoids rather than copies any storage-backed instance. The exact warning cause remains unproven because this host did not retrieve a live trace and the user-deployed probe still runs its pre-refactor bytecode. Do not redeploy or send the new A/B transactions without separate explicit approval.

Continuation verification: focused affected Python suites **128 passed**; full protected Python suite **234 passed, 4 skipped**; `genvm-lint 0.11.1rc2` passed lint/schema for Registry, Evaluator, CaseCourt, the original probe, and the new A/B diagnostic using cached artifacts; frontend lint/typecheck passed, Vitest **70 passed**, and production build passed. The linter's upstream lookup remains blocked by `WinError 10013` and reports a newer cached-runner warning; no stable Studionet runner compatibility is established. Full details are in [Stage 9 Storage Compatibility](V2_STAGE_9_STORAGE_COMPATIBILITY.md) and [Production Deployment Gate](V2_STAGE_9_PRODUCTION_DEPLOYMENT_GATE.md).

**Updated Stage 9 verdict at that review point:** source-level storage capture risk reduced; Registry has no nondeterministic path; Evaluator and CaseCourt were not then live-verified. The warning is now retained as a known compatibility risk and is not an active test requirement absent a concrete related failure. CaseCourt still has reviewer-governance and appeal-liveness blockers; Web Render remains disabled. Later user-reported Registry/Evaluator results and the current CaseCourt gate are recorded in the dated overlays below.

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

The user subsequently supplied the `get_evaluation("EVAL-STUDIONET-MATCH-001")` result. It contains the expected evaluation ID, `material_similarity` classification, matching decision-bearing fields, versions `1`, the two input record IDs and digests, and input commitment `b32b5d2e0e9089a4685c0e30bce0b75779583b4f19d83a9967d5797f6ca37635`. This is user-reported persisted-state readback and is consistent with the transaction; it was not independently retrieved. The user also supplied `has_evaluation=true` and count `1`. The transaction detail itself does not show chain ID; the user's earlier Studio selector confirmation was for stable Studionet 61999, but this transaction's network context is not independently retrieved.

The user then reported `has_evaluation("EVAL-STUDIONET-MATCH-001")` → `true` and `get_evaluation_count()` → `1`.

### Controlled digest-rejection test — user-supplied

The user supplied transaction `0xd1d6205c107680e57fe18afafe22b98bf35594cb690a0a295c0d443ed51d465c` to the hardened Evaluator. The call used evaluation ID `EVAL-STUDIONET-REJECT-001`, fictional evidence, and a deliberately incorrect first evidence digest. Explorer details report **FINALIZED**, consensus **Accepted**, but GenVM **ERROR / Rollback**, with `first evidence digest does not match submitted passage`. This is a failed contract execution, not a successful evaluation; Accepted consensus did not make the call successful. The user supplied post-call reads `has_evaluation(...)` → `false` and count → `1`, unchanged from before. This demonstrates the reported deterministic digest guard and state preservation on this instance; the result remains user-supplied and independently unverified. It does not test model or validator disagreement. `0 GEN` is the transaction value shown, not a fee quote.

## CaseCourt readiness review — 2026-10-14

The current CaseCourt source was reviewed at starting commit `2742ab7e908abd59d8fc9187b16f6bfba57106bb`; SHA-256: `e9f4d73fe243eabd1e18decf2c16abbfa742ee692f04933ca578bf28d4f395de`. Cached GenVM lint/schema reported 50 public methods (28 writes, 22 views) and a zero-argument constructor. It passed source lint/schema, but latest-runner lookup failed with `WinError 10013`, and the cached artifact warns of a newer runner. This is not stable Studionet runtime proof.

Direct Mode review confirmed that the appeal reviewer guard rejects the appellant and non-participants. The only eligible reviewer is the opposing case party, who may initiate review; this is adverse-party review, not independent appellate review. Filing an appeal freezes the case. `unfreeze_case` cannot release an appeal freeze; the only pre-ruling exit is a bilateral withdrawal, and that closes when review begins or a ruling is recorded. An Undetermined/failed review, unavailable reviewer, or unresolved ruling can therefore leave the case frozen without a timeout or unilateral recovery. No reviewer or recovery policy was invented. CaseCourt production appeals remain blocked pending approval of reviewer selection, conflicts, deadline, and recovery authority.

A new Direct Mode regression covers appellant/outsider review rejection, unchanged state after rejection, and the named opposing-party prototype flow. It does not prove independent governance or runtime authorization. Focused CaseCourt suite: **148 passed**. Full protected Python suite: **244 passed, 4 skipped, 1 failed**; the failure is the old two-contract Direct Mode cross-contract probe (`only one contract is allowed`), and is unrelated to CaseCourt. Frontend lint, typecheck, **70 tests**, and production build pass. Full logs and exact arguments are in [`V2_CASECOURT_READINESS.md`](V2_CASECOURT_READINESS.md).

**CaseCourt deployment gate:** conditional GO for a user-controlled fictional Phase A deterministic smoke only (deploy/open/read/append/lock/stale-version rejection) after Studio confirms stable Studionet 61999, source acceptance, and clearly disclosed fees. Separate approval is required before the AI judgment write. Appeal/production governance is NO-GO. No CaseCourt deployment or transaction was performed in this review. Web Render remains disabled.

### CaseCourt `open_case` input failure and source correction — user-reported

The user later supplied a CaseCourt deployment screenshot showing address `0xf1Ab9107180F0b467D03c72eeC8e3bA62757795b`, with a finalized/accepted/successful deployment row. The deployment transaction ID is abbreviated, and the uploaded source was not independently verified. The user then supplied call `0x207235f337d864fef04ea26e7b073447f1e324c75039b5ef559f5b21e9080793`: Explorer reports FINALIZED and Accepted, but GenVM ERROR / Contract Error (`'int' object has no attribute 'as_hex'`). The respondent argument was the valid user-provided address `0x1Af111b06E6f6A05Bd41572A016318f1356aF85c`, displayed as an integer in decoded call data. A subsequent user-provided `get_case_count()` read returned `0`, confirming no case was created on that deployment.

The source fix changes `open_case` to take a string, checks exactly 42 characters with `0x` prefix and hexadecimal content, constructs `Address` before state mutation, then uses the same existing party checks and persistence format. This is consistent with the official [GenLayer Address Type documentation](https://docs.genlayer.com/developers/intelligent-contracts/types/address). Corrected source SHA-256 is `d7270713e53108be58b1c6795ba492bdfb1f8d1bf0246b8df26b2efae51f60e9`. Direct Mode focused tests: **16 passed, 28 deselected**. Full protected Python suite: **247 passed, 4 skipped, 1 known failure** in the unrelated experimental cross-contract Direct Mode loader. Cached GenVM lint/schema passed for CaseCourt, but stable runner compatibility is still unverified. At that point, the existing deployed instance could not be updated in place, so a fresh deployment was required. No deployment or write was submitted by Codex.

### Corrected CaseCourt Phase A — user-reported Studio evidence

The user reports the corrected CaseCourt was freshly deployed at `0x3cD927B446265Bf2337A520a508fE963A3da9b72`; deployment screenshot showed FINALIZED, Accepted, and GenVM SUCCESS, with an abbreviated deploy hash. The user identifies the network as stable Studionet `61999`; neither chain ID nor source hash is independently retrieved from the supplied transaction evidence.

- `open_case` `0x9357befb5fb64048a8a8b192af6dcd6b9d994a45c5bda2088503155813ec54fd`: FINALIZED + Accepted + GenVM SUCCESS/Return. `get_case` returned the requested fictional case, expected petitioner/respondent, opening digest, `EVIDENCE_OPEN`, version 1.
- `append_evidence` `0x56c434e6348c6d87eda5e08adaf5336a06828c8b001e6dc8c7a7dbfbc1f9e80c`: FINALIZED + Accepted + GenVM SUCCESS/Return. `get_evidence` matched the evidence and source digests, schema 1, submitter, case version 2.
- `lock_evidence` `0x0b32f9e5e03ebaa9ece0d55fe86abc60cb08c6d3deff98c03b34e94baf05c1f8`: FINALIZED + Accepted + GenVM SUCCESS/Return. Readback: `EVIDENCE_LOCKED`, version 3, one evidence, action count 3, root `49b9695a4f295ab25580193c029231e73a9245144d456011188db4c23517be05`.
- Stale-version `lock_evidence` `0xe4b2792a1a619ab9bd79d63dd68814c46c5529d8d5fc42f7686f36ede076c3bf`: FINALIZED + Accepted consensus but GenVM ERROR/Rollback, `stale case version`. Subsequent `get_case` readback remained version 3, action count 3, and the same root.

These are user-provided transaction details and readbacks, not independent receipts. They support a **user-reported Phase A pass**, not a full CaseCourt lifecycle or production-governance pass. The prior deployment's failure and the user-reported `get_case_count() == 0` are retained above. Next is one fictional AI judgment only after separate fee approval; appeals remain gated by reviewer and freeze-recovery policy.

## First accepted and persisted CaseCourt AI judgment — user-reported, 2026-10-14

A second fictional case, `FICT-CASE-STUDIO-002`, was opened, evidenced, and locked on the same corrected CaseCourt deployment (`0x3cD927B446265Bf2337A520a508fE963A3da9b72`), separate from `FICT-CASE-STUDIO-001` so the latter's existing locked-but-unadjudicated state was left untouched. The evidence (a fictional permit applicant's notice and the fictional governing rule plus agency decision) and all digests, the evidence commitment, the judgment input commitment, and the evidence packet JSON were computed independently against the deployed contract's exact algorithms (`_pure_sha256_fields`, `_case_evidence_commitment`, `_validate_judgment_packet` in [`case_court.py`](../contracts/case_court.py)) and verified by running the real contract source in a local Direct Mode test before any live transaction, rather than trusting any previously proposed value.

Lifecycle, all user-supplied Explorer transactions, FINALIZED + Accepted + GenVM SUCCESS/Return for each:

- `open_case` `0x3fb9d796b0922d6df46bb337f0a022072fff6790eaa8d81cb8152d51d6a70f8c`.
- `append_evidence` (evidence 1, `EV-STUDIO-002-1`) `0x5532fff875600e5d110e06d32dba9571183960ac5aac8132cdf5d5167ac3e7df`.
- `append_evidence` (evidence 2, `EV-STUDIO-002-2`) `0xceb85efe8df1b82f40ce5615a834f0d3ad26f167d86cb89131e2267b2c81eb78`.
- `lock_evidence` `0x380697219c9b1ed2742e4c3114a4402050d17b366cea73cde11d3c2cc5653971`. User-supplied `get_case` readback confirmed `phase=EVIDENCE_LOCKED`, `version=4`, `evidence_count=2`, and `evidence_root=c4376117dc3c1aed6d3fc0d9914b829f70ac087a194a9f587d944656677504d1`, matching the independently precomputed value exactly before any judgment attempt.

**First `adjudicate_case` attempt** `0x94fc3b13028c9d1bbc7ed99f34373d1ad969e3f1ea3f4f071fc6828b8d52b664` (judgment ID `JUDG-STUDIO-002-1`): Explorer reported consensus **Undetermined**, rotation count 3, GenVM **ERROR/Rollback**, error `inconsistent supported-merits judgment` — the model's EP output selected classification `MERITS_SUPPORTED` without satisfying the contract's required correlated fields (`evidence_sufficient`, `material_issue_determined`, `decision_eligible` all true, `relevant_rule_application=SATISFIED`, `recommended_outcome=GRANT`) enforced in `_pure_validate_judgment_result`. This is model-response non-compliance against an intentionally strict validator, not an evidence or digest defect; the rollback left case state unchanged at version 4. No contract validator was loosened to work around this.

**Second `adjudicate_case` attempt** `0x233a613973a2c539aa974cb59122ea7a6fc056f5ac721d1408710f9f3e16db38` (judgment ID `JUDG-STUDIO-002-2`, same evidence packet, fresh action/judgment IDs, same `expected_version=4`): Explorer reported **FINALIZED**, consensus **Accepted**, GenVM **SUCCESS/Return**, rotation count 1. The returned Equivalence Principle output is internally consistent: `outcome_classification=MERITS_SUPPORTED`, `evidence_sufficient=true`, `material_issue_determined=true`, `decision_eligible=true`, `relevant_rule_application=SATISFIED`, `recommended_outcome=GRANT`, non-empty `material_findings` and `applicable_criteria`, `uncertainty_flags=[]`.

User-supplied `get_case("FICT-CASE-STUDIO-002")` readback after this transaction confirms persistence, not just a successful call: `phase=DECISION_RECORDED`, `version=5`, `decision_ref_id=JUDG-STUDIO-002-2`, `decision_authority=CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY`, `decision_evidence_root=c4376117dc3c1aed6d3fc0d9914b829f70ac087a194a9f587d944656677504d1` (equal to the case's locked `evidence_root`), `operative_decision_kind=JUDGMENT`, `operative_decision_id=JUDG-STUDIO-002-2`, and the full consistent `decision_result_json`.

This satisfies the project's own success gate (FINALIZED + Accepted/majority consensus + GenVM SUCCESS with a Return, plus confirmed state-mutating readback) and is the first successfully accepted **and persisted** real CaseCourt AI judgment on stable Studionet. It is user-reported Explorer and readback evidence, not an independently retrieved receipt from this host. `FICT-CASE-STUDIO-001` remains separately `EVIDENCE_LOCKED` at version 3 with no judgment, unaffected by this work. Appeal, freeze, Web Render, and production-governance items remain open as recorded above.

## Live demo on the newly deployed contracts — 2026-10-15

Following the coordinated CLI deployment in `V2_DEPLOYMENT_MANIFEST.md`, a short live demo exercised the new addresses end to end.

**Registry** (`0xbEbfe1087C3395316feCCa1AE7E1Ba48CcCbAF8D`): `register_precedent("FICT-CLI-DEMO-001", ...)` via CLI `genlayer write`, tx `0x96ad669db543d92fe4f9e28cb3305da2418324157aaaa0de3b9f082a918ad604`, independently confirmed FINALIZED with `result_name: MAJORITY_AGREE` via `genlayer receipt`. Independently read back via `genlayer call get_precedent` and `get_registration_count` (returned `1`): both match the submitted record exactly.

**Evaluator and the first CaseCourt `open_case` attempt failed via the CLI** due to the argument-encoding limitation recorded in `V2_DEPLOYMENT_MANIFEST.md` (JSON-shaped and address-shaped `--args` silently coerced to the wrong calldata type); both were independently confirmed to have mutated no state (`get_evaluation` empty, `get_case_count() == 0`) before switching to Studio for the remainder.

**CaseCourt** (`0xE084a96fbF8B42c7A9885fFABBa3b6C4076772C8`), case `FICT-CASE-STUDIO-CLI-001`, via Studio (reusing the exact evidence text already verified in the `FICT-CASE-STUDIO-002` run above, with `evidence_root` recomputed for the new case ID):

- `open_case` `0x48074968285054e1e9eaf3247eaf17b125748fd3cbb7809dc42a217ec2973ae2`, `append_evidence` ×2 (`0xf6396ab4a72945b9cb7eea516644aeea4e71870d8584074d01d2d89dcb486ac5`, `0x0d165bac22c018b10829e567c8b3751f746cd15e913926e69b8b7ed8ec03788a`), `lock_evidence` `0xac07770d4dad16001b8e269af9f29cd7febc2ad03b230f33ea1f90994bf6b36b` — all FINALIZED + Accepted + GenVM SUCCESS/Return. User-supplied `get_case` readback confirmed `evidence_root=255b5725b142176b9b85ec77551fee3cc71163610d52b1c334d0b711839967c1`, matching the independently precomputed value exactly.
- `adjudicate_case` `0x899ca70f2c44cf1636ba3e409adfc2d019282124ab9e0fd07afe305e79bcfec5` (judgment ID `JUDG-CLI-001`): **FINALIZED, Accepted, GenVM SUCCESS/Return on the first attempt** (rotation count 2), consistent `MERITS_SUPPORTED`/`GRANT` output.
- User-supplied `get_case` and separate `get_judgment("JUDG-CLI-001")` readbacks cross-verify every commitment field (`judgment_commitment == decision_digest == operative_decision_digest`, `input_commitment` matches, `evidence_commitment == evidence_root`, `chain_id=61999`, `court_address` matching the new deployment lowercase): `phase=DECISION_RECORDED`, `version=5`, `decision_authority=CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY`.

This is a second independently persisted, accepted CaseCourt AI judgment, now demonstrated on the freshly deployed production-candidate address rather than the earlier manually-deployed one. Appeal, freeze, and Web Render workflows on this new deployment remain unexercised in this demo; the frontend's own live read of this exact case is recorded in `V2_DEPLOYMENT_MANIFEST.md`'s CaseCourt frontend-wiring commit.
