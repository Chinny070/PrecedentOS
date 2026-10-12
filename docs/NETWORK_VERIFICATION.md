# Network and provenance verification

## Intended target

The frontend uses the GenLayerJS 1.1.8 `studionet` chain definition and expects chain ID 61999. A local Node import of the installed package returned chain ID `61999` and RPC `https://studio.genlayer.com/api`; this inspected the SDK definition only, and did not call that endpoint. The SDK-supplied RPC is used for the optional read-only identity check. Contract addresses are not bundled; the user may enter public addresses in Settings, where they are stored only in browser local storage and are not checked against a deployment registry.

## What the application can claim

- Demo: bundled fictional fixtures; no chain operation took place.
- Submitted: the browser received a transaction hash from GenLayerJS. This is not acceptance or finality.
- Finalized (observed): GenLayerJS 1.1.8 `waitForTransactionReceipt` returned for `TransactionStatus.FINALIZED` and the receipt contained `ExecutionResult.FINISHED_WITH_RETURN`; the observation time is local-device time. Finalized execution errors are not labeled successful.
- Chain observed: a configured keyed view returned a record. It does not prove source authenticity or complete corpus coverage.
- Unknown: an RPC/lifecycle request did not establish an outcome. Do not treat unknown as failed and do not resubmit automatically.

## Read-only network identity

Settings can send `eth_chainId` to the HTTP URL from `studionet.rpcUrls.default.http[0]`. It has an 8-second browser timeout and makes no wallet request. A response matching 61999 verifies only that endpoint's reported identity; it is not evidence of deployed PrecedentOS contracts. The check is implemented but has not been run.

## Timestamp model

`decision_date` is submitter-provided. `submittedAtLocal` and `finalizedAtObserved` are device-clock observations, explicitly labeled as such. Current contracts expose a registration sequence but no timestamp field; the app does not convert sequence numbers into time. Block timestamps and authoritative finality timestamps are not implemented.

## SDK compatibility boundary

The checked-in frontend pins `genlayer-js` 1.1.8. Installed package declarations and strict TypeScript checking confirm the chain definition's ID and the adapter's declared API usage. The v1.1.8 package API differs from the current online GenLayerJS API page, which documents newer fee-estimation and finalization names. The adapter follows the pinned package README/types; do not copy newer names without upgrading and retesting the SDK.

Compile-time compatibility does not prove current network compatibility. Before enabling writes, verify chain identity against the live endpoint, inspect independently verified deployment addresses/schema, then perform approved read and write lifecycle checks. No endpoint probe, wallet action, contract interaction, AI call, validator consensus, or live finality observation occurred in this pass.
