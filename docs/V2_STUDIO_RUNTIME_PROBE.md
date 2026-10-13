# Stage 6 — GenLayer Studio Runtime Probe

## Purpose and evidence boundary

`experiments/stage6/studio_runtime_probe.py` is a small, separate diagnostic contract. It is not CaseCourt and is not part of production deployment. It has no constructor arguments. The source was checked with cached GenVM lint and Direct Mode tests, not deployed or submitted. The available runner cache could not resolve the latest runner over this host's restricted socket, so stable Studionet compatibility is still **BLOCKED**.

The contract separates these checks so a basic deployment/read does not require an AI or failure write:

1. Constructor initialization and read-only `get_probe_state`.
2. Optional `record_transaction_context(probe_id)` write: persists caller, origin, chain ID, contract address and `gl.message_raw["datetime"]`.
3. Optional `run_ai_equivalence_probe(probe_id, fictional_input)` write: bounded `gl.nondet.exec_prompt(..., response_format="json")`; validators independently rerun and compare classification, decision-bearing and sufficiency fields; reasoning text may differ.
4. Optional `run_forced_disagreement_probe(probe_id)` write: deliberately returns `False` from the validator. State is written only if `run_nondet_unsafe` unexpectedly returns; if this method succeeds and updates the unexpected-return marker, stop and preserve that evidence.
5. Optional `run_expected_failure_probe(probe_id)` write: deterministically raises `gl.vm.UserError` before any state write.

There is no Web Render method. The production Web Render gate remains closed because URL redirect/private-network controls, pre-return size limits, runner egress behavior and fees are unresolved.

## Browser procedure for the user

Use the browser GenLayer Studio only when you independently choose to execute this diagnostic. No Codex deployment, wallet signature or transaction has occurred.

1. Open `experiments/stage6/studio_runtime_probe.py` and copy its complete contents into Studio's contract editor/import flow. Do not paste CaseCourt or either v1 contract for this probe.
2. Confirm the environment label says **stable Studionet** and the chain ID is `61999`. Stop if it shows Studio-dev (`61997`), localnet (`61127`), or an unverified network.
3. Deploy this standalone contract only after reviewing the source and Studio's fee/transaction confirmation. It has no constructor arguments. Record the deployment transaction hash and displayed contract address, then independently inspect the receipt/lifecycle.
4. First call read-only `get_probe_state`. Confirm it returns the initial state (`probe_count` zero and `last_event` `DEPLOYED`). Save the screen and read response.
5. Only after you explicitly decide to submit a test write, call `record_transaction_context` with a fictional ID such as `PROBE-CONTEXT-01`. Record the transaction hash, status transitions, receipt and returned state. Compare stored chain ID to 61999; do not treat the timestamp as source publication time.
6. If you separately approve an AI test write, call `run_ai_equivalence_probe` with fictional, public text only. Record all validator/trace fields Studio exposes. A returned classification means the configured EP accepted under that run; it is not legal correctness or finality until the actual receipt says so.
7. Only after reviewing the expected-failure method and deciding to incur its fee, call `run_expected_failure_probe`. Record the failed execution status and verify `get_probe_state` did not change.
8. Only if you explicitly approve the deliberate disagreement test, call `run_forced_disagreement_probe`. Expected behavior is a failed/rejected execution and no state write. If it succeeds or remains pending, stop and preserve the transaction/trace; do not retry.
9. For every write, distinguish submitted, accepted/nonfinal, finalized, failed, and unknown using the actual Studio status/receipt fields. Acceptance alone is not finality. If Studio omits execution result or finality, record it as unknown rather than infer success.

Save screenshots of the selected network/chain ID, deployed address, read result, transaction hash, lifecycle/receipt, execution success/failure field, and resulting storage. Do not share wallet secrets or private keys. Do not send personal, confidential, or real case evidence.

## Documentation-confirmed APIs

- Persistent contract attributes and `@gl.public.view` / `@gl.public.write`: [Storage](https://docs.genlayer.com/developers/intelligent-contracts/features/storage).
- Caller/origin/chain/address and deterministic transaction datetime: [Transaction Context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context).
- Nondeterministic operations in `run_nondet_unsafe`, with storage writes after return: [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism).
- Independent validators comparing decision-bearing fields, and `gl.vm.Return`: [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle).
- Deterministic `gl.vm.UserError`: [Error Handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling).

These docs verify the documented API patterns. They do not verify the deployed Stable Studionet runner or this contract's behavior there.

## Status

| Capability | Status |
|---|---|
| Probe contract source and independent methods | **IMPLEMENTED** |
| Direct Mode and cached lint | **LOCALLY TESTED** |
| Browser deployment/read/write | **NOT STARTED** |
| Stable runner identity and compatibility | **BLOCKED** |
| Real validator disagreement, rollback, receipt/finality | **BLOCKED** |
| Web Render | **NOT STARTED / intentionally omitted** |
