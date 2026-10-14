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

## Nondeterministic storage warning audit

Observed message, supplied by the user: `Detected pickling storage class. Reading storage in nondet mode is not supported`.

Official GenLayer storage/non-determinism documentation says persistent storage cannot be accessed directly inside a nondeterministic block and storage-backed objects must be copied to memory before being used there. In the isolated probe, `run_ai_equivalence_probe` passes closures that invoke `self._validate_result` from the leader and validator functions. These helpers validate the returned JSON and read no declared probe state fields. The AI transaction reportedly completed and its result was read back, so this warning did not prevent that particular reported probe result. The warning's precise emission point and whether it represents an actual storage dereference or a conservative warning caused by the closure's bound `self` require a GenVM trace/log and controlled reproduction; no independent trace is available.

Source audit:

- **PrecedentRegistry:** no nondeterministic API calls, so the warning path does not apply to Registry code.
- **PrecedentEvaluator:** its leader/validator closures call bound validation helpers through `self`; the comparison inputs are prepared before the nondeterministic call and no `self.evaluations` map access is intended inside those helpers. The closure pattern remains a runtime risk until it is proven harmless or refactored and tested.
- **CaseCourt:** its nondeterministic paths likewise call bound validators/equivalence helpers through `self`. Case/evidence/appeal storage is collected into deterministic local objects before those blocks; no storage map access is intended inside the cited validation helpers. Given the warning, this pattern is also a runtime risk pending trace/reproduction. Registry is unaffected by this specific risk.

No production contract was modified in this stage. Before deploying Evaluator or CaseCourt, obtain a transaction trace for the probe warning and test a minimal refactor that makes pure model-validation/equivalence helpers independent of the storage-backed contract instance, or explicitly copies any required storage objects into memory using the documented API. Preserve the current write-after-equivalence ordering and test rejection/state rollback again. Do not treat a successful probe evaluation as proof that all production paths are safe.

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
3. The storage warning needs the probe `debugTraceTransaction` / node logs and a controlled source-level reproduction; Evaluator/CaseCourt remain at risk until that gate is closed.
4. Production Registry, Evaluator and CaseCourt addresses are unverified/unavailable; no production contract was deployed or verified.
5. Stable Studionet runner/fee compatibility, actual production contract validation, cross-contract calls, successful and rejected production writes, and appeal/freeze behavior remain unverified.
6. Reviewer governance policy, appeal liveness and recovery policy remain open; Web Render egress, redirect, DNS/private-IP and pre-read resource protections remain unverified and disabled.

**Stage 9 verdict:** **CONDITIONAL GO** for continued read-only evidence review and local adapter validation. **NO-GO** for production contract deployment or governance writes until the storage warning, stable runtime compatibility, fees, contract addresses, and policy/security gates are resolved.

## References

- Installed pinned SDK metadata: `frontend/node_modules/genlayer-js/package.json` (`1.1.8`); exposed transaction declarations: `frontend/node_modules/genlayer-js/dist/index-C3Ul1Rte.d.ts`; transaction decoder and receipt implementation: `frontend/node_modules/genlayer-js/dist/index.js`.
- Official storage model and copying storage objects to memory: [Persisting data on blockchain](https://docs.genlayer.com/developers/intelligent-contracts/storage).
- Official nondeterministic execution restrictions: [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism).
- Current protocol status semantics: [Transaction statuses](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses).
- Current transaction and execution success distinctions: [Fee outcomes and debugging](https://docs.genlayer.com/developers/decentralized-applications/fee-outcomes-and-debugging). These current pages explain protocol distinctions; the installed GenLayerJS 1.1.8 types and implementation were used for the application adapter rather than newer SDK-only helpers.
