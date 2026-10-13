# Read-Only Studionet Verification Checklist

**Purpose:** operator-run verification before any Stage 3B runtime test or contract deployment.
**Stable target:** `https://studio.genlayer.com/api`, chain ID `61999` (`0xf22f`). Do not use Studio-dev `61997` or localnet `61127` as if they were stable Studionet.
**Stage 3A performed no wallet signatures, deployment, writes, Docker actions, or live transaction.**

## 1. Read-only RPC identity check (Windows PowerShell)

Run once in the user's ordinary PowerShell environment. This makes only an `eth_chainId` JSON-RPC request. It does not connect a wallet or sign anything.

```powershell
$body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
$response = Invoke-RestMethod -Uri 'https://studio.genlayer.com/api' `
  -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 10
$response | ConvertTo-Json -Depth 5
if ($response.result -ne '0xf22f') {
  throw "Expected stable Studionet chain ID 0xf22f (61999); got $($response.result)"
}
```

Expected: `result: "0xf22f"`. The user previously reported this exact result. Codex's own PowerShell attempt failed before HTTP with Windows socket error 10013, so do not interpret that local restriction as Studionet unavailability and do not repeat a blocked retry loop. Record date, exact response and shell host if the user runs it again. Stop on any other chain ID.

## 2. Read-only installed toolchain inventory

From the project root, these commands read package metadata only and do not install or modify packages:

```powershell
node --version
python --version
npm ls genlayer-js --depth=0
python -m pip show genlayer-test genlayer-py genvm-linter
Get-Content .\contracts\case_court.py -TotalCount 1
```

Current local observations: Node CLI package `genlayer@0.40.0-rc.3` (the CLI command itself could not initialize because of the pre-existing `.genlayer` EPERM); Python 3.12.10; `genlayer-test==0.29.2`; `genlayer-py==0.16.3`; `genvm-linter==0.11.1rc2`; frontend `genlayer-js==1.1.8`; contract source pin `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. Cached lint reports another runner hash but failed to reach the authoritative catalog. Preserve this output; do not upgrade or change configuration as part of verification.

## 3. GenLayer Studio browser identity

1. Navigate directly to `https://studio.genlayer.com` and confirm the page is the stable hosted Studio URL. Do not switch to `studio-dev.genlayer.com` or its chain preset.
2. In the account/network selector, confirm stable Studionet. If Studio shows a chain ID, it must be `61999` / `0xf22f`.
3. If the UI does not display an ID, the read-only RPC command above is the identity check. Do not use a wallet network switch or sign a message for this check.
4. Before any future deployment, record the Studio's displayed environment/version and find an official release artifact that states its GenVM runner identity. If no authoritative mapping is visible, mark runner compatibility **BLOCKED**; do not infer it from the browser URL or cached lint.

## 4. Safe contract interaction proof required later

No live write is authorized by this checklist. A separately approved local integration stage must use fictional data and prove:

- Registry, Court and any decision component deploy in the correct order with constructor arguments as documented by the selected code.
- Cross-contract `view()` reads return exact existing records and a defined missing-record result.
- Court recomputes the evidence root from its immutable ordered evidence records and checks supplied evidence bytes against those digests.
- Candidate judgments with a forged ID, different case ID, evidence root, Court address, criteria version or result digest reject without state change.
- Unauthorized requester, duplicate decision ID and replay across cases reject without state change.
- Appeals bind the exact decision ID/version/result digest; wrong-version appeals reject.
- Earlier case decisions remain retrievable after a later appeal disposition or superseding result.
- A pending transaction remains pending; an accepted result remains provisional; only a finalized receipt with `FINISHED_WITH_RETURN` can be called successful. `FINISHED_WITH_ERROR`, missing result, timeout and disagreement are not success.
- If a child transaction is used, prove `sender_address` is the calling IC, test duplicate/replayed messages, and wait for the parent-finalized condition as applicable.
- Save parent and child transaction IDs, addresses, schemas, full receipts, status/lifecycle reads, execution result, and fee values. Do not call an address deployed until the deployment transaction finalized successfully.

The official docs show these APIs and lifecycle distinctions, but no repository local two-contract test passed. Document evidence from a real runtime separately from Direct Mode/mocks.

## 5. Runner, fee, and deployment gates

Before controlled deployment:

- Obtain an official stable Studionet release note/runtime artifact mapping the exact selected runner hash to chain 61999. Confirm the contract `Depends` hash and available GenVM linter target match; cache presence is insufficient.
- Confirm whether GenLayerJS 1.1.8 is supported against stable Studionet. Current official fee/deploy examples emphasize genlayer-js v2 and the matching Consensus v0.6 release-candidate environment is Studio-dev, not stable Studionet. Do not use Studio-dev instructions as stable proof and do not upgrade speculatively.
- Establish stable's current fee model, protocol parameters and deployment method from stable-compatible official docs/Studio. Profile deployment and each expensive method against a compatible fee-reporting environment. A fee profile is a measured suggestion, not a guaranteed quote.
- Prepare a deployment manifest before submission: target chain ID, source SHA-256 for each contract, schema/version, reviewed constructor args, operator-controlled deployer address (never private key), exact fee estimate, and blank fields for transaction IDs, addresses and final receipts.
- Use Studio's own environment and constructor UI only after the user explicitly approves deployment. Wait for `FINALIZED` and `FINISHED_WITH_RETURN`, then record address/schema/code and independently read the deployed state. Never reuse a pending/failed deployment address.

## 6. Verification command references

Current official docs describe `gen_getTransactionStatus`, `gen_getTransactionLifecycle`, and `gen_getTransactionReceipt`; an EVM submission receipt is distinct from the GenLayer protocol receipt. On the pinned GenLayerJS 1.1.8 source, re-check exact method names/types before implementing a production adapter. Do not infer compatibility from current docs' v2 code samples.
