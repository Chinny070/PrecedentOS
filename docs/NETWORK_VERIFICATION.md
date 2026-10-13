# Network and provenance verification

## Intended target

The frontend pins `genlayer-js` **1.1.8** and uses its `studionet` chain object. A local runtime check of the installed package reported chain ID **61999** and RPC `https://studio.genlayer.com/api`. This verifies the SDK's bundled network definition only. A one-time read-only `eth_chainId` request was attempted on 2026-10-13, but Windows denied the outbound socket before an HTTP response; the endpoint's live identity therefore remains **unverified**.

Contract addresses are not bundled. Settings stores user-entered public addresses in browser local storage. The frontend rejects malformed and zero addresses, but a nonzero 20-byte address still does not prove code identity, deployment, ownership, or network provenance.

## What the application can claim

- **Demo:** bundled fictional fixtures; no chain operation took place.
- **Submitted:** the browser received a syntactically valid transaction hash from GenLayerJS. This is not acceptance or finality.
- **Pending / processing:** the pinned SDK reports a stored non-final status. These are browser observations and may change.
- **Accepted:** the SDK reports `ACCEPTED`; this is shown separately from finality.
- **Finalized (observed):** GenLayerJS 1.1.8 returned a `FINALIZED` receipt with `FINISHED_WITH_RETURN`. The observation time is local-device time.
- **Failed:** the pinned SDK reports `CANCELED` or a `FINALIZED` receipt with `FINISHED_WITH_ERROR`.
- **Unknown:** the RPC/lifecycle request timed out, returned an incomplete final receipt, or otherwise did not establish successful execution. No automatic resubmission occurs.
- **Chain observed:** a configured keyed view returned a record. This does not prove source authenticity or complete corpus coverage.

Transactions hydrated from browser storage are demoted to **local note / last seen**. A user can edit local storage; saved statuses, hashes, and device timestamps are not treated as current chain evidence until checked again.

## Timestamp model

`decision_date` is submitter-provided. `submittedAtLocal` and `finalizedAtObserved` are device-clock observations. Current contracts expose a registration sequence but no timestamp field; the app does not convert sequence numbers into time. Block timestamps and authoritative finality timestamps are not implemented.

## SDK compatibility boundary

The pinned package's README, declaration files, and runtime exports are the compatibility authority for the application. In 1.1.8, the supported client surface used here is `createClient`, `connect('studionet')`, `readContract`, `writeContract`, `getTransaction`, and `waitForTransactionReceipt({ status: TransactionStatus.FINALIZED })`; `GenLayerTransaction` exposes `statusName` and `txExecutionResultName`. The 1.1.8 runtime does not expose newer methods such as `waitForFinalization` or `isSuccessful` described by current online documentation. See [Studionet integration readiness](STUDIONET_INTEGRATION_READINESS.md) for the audited version-specific details.

Compile-time/runtime package checks do not prove live network or validator compatibility. Before any deployment or write, verify the RPC reports 61999, independently verify published contract addresses and code/schema, review the final calldata and wallet, then perform separately approved deployment and transaction checks. No wallet signature, deployment, write, AI execution, validator consensus, or live finality observation occurred in this pass.
