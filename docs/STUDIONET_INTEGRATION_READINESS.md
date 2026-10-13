# Studionet Integration Readiness and Hardening

**Target:** GenLayer stable Studionet, chain ID `61999` (`0xf22f`)
**Baseline:** `f09f1f82e76056f943cf21514e39a74d84ce3400`
**Scope:** frontend SDK, wallet, adapter, transaction, persistence, and bundle review; production contracts were not changed.

## Summary

The frontend now follows the installed `genlayer-js` **1.1.8** API and fails closed on invalid addresses, malformed contract arguments, account changes, and a wallet on the wrong chain. Transaction outcomes distinguish submission, pending/processing, accepted, finalized, failed, and unknown. Browser-restored transactions are explicitly demoted to editable local notes. Registry and Evaluator entry points are checked against the current Python contract signatures, and the evaluator's UTF-8 SHA-256 and input commitment are cross-checked using a shared vector in both TypeScript and a Direct Mode contract test.

The actual Studionet RPC identity could not be observed: the permitted, read-only `eth_chainId` request was denied by Windows socket permissions before HTTP. No wallet connection, signature, write, deployment, or Studionet contract call was made. The contracts retain their current implementation and validator design; Direct Mode still does not prove real validator consensus or on-chain rollback.

**Verdict: CONDITIONAL GO for deployment preparation only. Do not broadcast a deployment or write until the live RPC identity, stable fee model, compatible runner, and contract release/address verification gates below are closed.**

## GenLayerJS compatibility findings

### Verified installed SDK surface

The project pins `genlayer-js` `1.1.8` in `frontend/package.json` and its lockfile. Inspection of the installed package manifest, README, declaration files, built runtime, and a local no-network client construction confirmed:

- `studionet.id === 61999`; the bundled RPC is `https://studio.genlayer.com/api`.
- `createClient({ chain: studionet, account, provider })` is supported. The documented browser-wallet arrangement uses a separate account-free client for reads and an injected-provider client for writes.
- `connect('studionet')` is documented by this package for adding/switching the injected wallet's network.
- `readContract({ address, functionName, args })`, `writeContract({ address, functionName, args, value })`, `getTransaction({ hash })`, and `waitForTransactionReceipt({ hash, status, interval, retries })` are present in the installed 1.1.8 runtime and types.
- `TransactionStatus` includes `PENDING`, `PROPOSING`, `COMMITTING`, `REVEALING`, `ACCEPTED`, `UNDETERMINED`, `FINALIZED`, `CANCELED`, appeal states, `READY_TO_FINALIZE`, `VALIDATORS_TIMEOUT`, and `LEADER_TIMEOUT`.
- `GenLayerTransaction` declares `statusName` and `txExecutionResultName`. `ExecutionResult` includes `NOT_VOTED`, `FINISHED_WITH_RETURN`, and `FINISHED_WITH_ERROR`.
- The installed 1.1.8 runtime does **not** expose `waitForFinalization`, `isSuccessful`, `estimateTransactionFeesForWrite`, `estimateTransactionFees`, or a fee-policy API. These names occur in current documentation for a newer SDK line and are not safe to copy into this pinned app.

The version-specific artifact references are the [official GenLayerJS 1.1.8 release](https://github.com/genlayerlabs/genlayer-js/releases/tag/v1.1.8), its tagged [package README](https://github.com/genlayerlabs/genlayer-js/blob/v1.1.8/README.md), and the installed declarations at `frontend/node_modules/genlayer-js/dist/index-C3Ul1Rte.d.ts`. Current [transaction documentation](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction) describes newer helpers; treat it as current protocol guidance, not an exact 1.1.8 API reference.

The runtime API/version check was performed locally without network access:

```powershell
node --input-type=module -e "import {createClient} from 'genlayer-js'; import {studionet} from 'genlayer-js/chains'; import {ExecutionResult,TransactionStatus} from 'genlayer-js/types'; const c=createClient({chain:studionet}); console.log(JSON.stringify({chainId:studionet.id,rpc:studionet.rpcUrls.default.http[0],version:JSON.parse((await import('node:fs')).readFileSync('./node_modules/genlayer-js/package.json','utf8')).version,methods:{readContract:typeof c.readContract,writeContract:typeof c.writeContract,getTransaction:typeof c.getTransaction,waitForTransactionReceipt:typeof c.waitForTransactionReceipt,waitForFinalization:typeof c.waitForFinalization},statuses:Object.keys(TransactionStatus),executionResults:Object.keys(ExecutionResult)}));"
```

Observed: `version=1.1.8`, `chainId=61999`, configured RPC `https://studio.genlayer.com/api`; `readContract`, `writeContract`, `getTransaction`, and `waitForTransactionReceipt` are functions, while `waitForFinalization` is `undefined`.

### Wallet helper behavior

Inspection of the installed `dist/index.js` showed `client.connect('studionet')` reads **`window.ethereum` directly** (rather than the provider passed to `createClient`), may call `wallet_addEthereumChain` and `wallet_switchEthereumChain`, and checks/requests the GenLayer Snap using `wallet_getSnaps` / `wallet_requestSnaps`. The existing app passed an arbitrary provider and called this helper on every connection, even when already on the right network.

The connection flow now requests accounts, checks the target chain, constructs the 1.1.8 client, and invokes `connect('studionet')` only when the chain is initially wrong and the provider is the same object as `window.ethereum`. It then re-reads `eth_accounts` and `eth_chainId` and refuses the session if either differs from the requested account or chain 61999. When the wallet is already on 61999, the helper skips the network/Snap permission path.

The app subscribes to EIP-1193 `accountsChanged`, `chainChanged`, and `disconnect` events and removes those listeners when the session ends. It invalidates the app session on a changed selected account, changed chain, malformed chain event, or provider disconnect. The write adapter repeats read-only `eth_accounts` and `eth_chainId` checks immediately before each transaction. The Settings “Disconnect this session” action forgets the app session; EIP-1193 defines no generic permission-revocation method, so it does not revoke the wallet's site authorization.

These are code and mocked-provider checks. No real wallet was opened or prompted in this task.

## Contract adapter audit

### PrecedentRegistry

The current production write interface is:

```text
register_precedent(record_id: str, evidence_digest: str, schema_version: u32,
                   jurisdiction: str, decision_date: str, category: str)
```

The frontend now requires exactly six positional arguments, uppercase ASCII record-ID rules, lowercase 64-character SHA-256 encoding, schema version `1`, bounded safe jurisdiction/category strings, and a real `YYYY-MM-DD` date. The date check is deliberately stricter than the contract's format-only date check.

Read calls are restricted to `get_precedent(record_id)` and require a syntactically valid contract address and record ID. An empty object remains valid as the contract's documented missing-record result. Address syntax does not prove the target address actually contains this Registry.

### PrecedentEvaluator

The current production write interface is:

```text
evaluate_pair(evaluation_id: str, record_a_id: str, record_a_digest: str,
              record_b_id: str, record_b_digest: str, evidence_packet_json: str,
              evidence_schema_version: u32, criteria_version: u32, criteria: str)
```

The frontend now requires exactly nine arguments; valid distinct IDs; lowercase SHA-256 digests; schema/criteria versions `1`; a canonical packet containing only `precedent_a` and `precedent_b`; the same packet, passage, and criteria bounds as the Python contract; and digests recomputed over the exact UTF-8 passage bytes. The read adapter targets `get_evaluation(evaluation_id)` only.

The Evaluator still treats IDs as caller-supplied references. It does not prove Registry membership, document authorship, or evidence truth. No cross-contract behavior was added.

### Hash and commitment compatibility

`frontend/src/lib/commitment_vectors.json` is shared by the TypeScript test and a new Python Direct Mode regression. It contains fictional Unicode passages, their UTF-8 SHA-256 digests, schema/criteria inputs, and the expected length-framed `PrecedentOS-EVALUATION-INPUT-v1` commitment. The frontend test recomputes the values with WebCrypto. The Python test recomputes them with `hashlib`, calls the actual Evaluator contract under the existing mocked Direct Mode boundary, and checks the persisted commitment against the same expected value. This proves cross-language byte agreement and the contract's local stored value for this test vector, not an on-chain evaluation.

## Transaction lifecycle audit

The previous frontend waited only for `FINALIZED`, surfaced no intermediate statuses, and treated any non-`FINISHED_WITH_RETURN` receipt as a failed execution. The adapter now:

1. Records `submitted` only after `writeContract` returns a valid hash.
2. Polls the pinned SDK's `getTransaction` and reports `pending`, `processing`, and `accepted` distinctly; `ACCEPTED` remains nonfinal.
3. When stored status reaches `FINALIZED`, calls the 1.1.8 `waitForTransactionReceipt` with `TransactionStatus.FINALIZED` and checks the returned receipt.
4. Reports `finalized` only for a `FINALIZED` receipt with `FINISHED_WITH_RETURN`.
5. Reports `failed` for `CANCELED` or `FINALIZED` plus `FINISHED_WITH_ERROR`; `NOT_VOTED`, incomplete receipts, poll timeout, or RPC errors remain `unknown`.
6. Never automatically resubmits a write after a hash exists.

The lifecycle is based on methods and fields declared by the installed 1.1.8 package. It is unit-tested with mocked transaction snapshots/receipts; no real transaction lifecycle was observed. Current official docs now describe richer `waitForFinalization`, `isSuccessful`, lifecycle projection, and fee APIs, none of which are exposed by this pinned client.

## Fee and network-version gate

This is the main unresolved compatibility item for a controlled Studionet deployment. The current write adapter passes `value: 0n`, which is the v1.1.8 write shape and means **zero application value**; it is not a fee estimate or a fee budget. The installed v1.1.8 types/runtime have no `fees` object or fee-estimation method.

Current official documentation identifies the fee-funded Consensus v0.6 / Studio v0.123 stack as a **separate release-candidate environment** (`studio-dev`, chain ID 61997), with a matching `genlayer-js` v2 RC. It also lists stable Studionet at 61999 as a distinct hosted environment. The local evidence therefore does not establish that stable Studionet requires the v0.6 fee API, nor does the SDK's bundled chain ID prove the currently hosted endpoint's active fee policy. The permitted RPC identity probe could not connect. Before a write, confirm the stable chain's actual fee model from current stable-specific official release guidance or a read-only network query; if that model requires `fees`, do not use this v1.1.8 adapter until a separately approved, matching stable SDK/toolchain is verified.

Official references: [Networks](https://docs.genlayer.com/developers/networks), [Network Configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [Consensus v0.6 Migration](https://docs.genlayer.com/developers/consensus-v06-migration), [Writing to Intelligent Contracts](https://docs.genlayer.com/developers/decentralized-applications/writing-data), and [Fees and Transaction Policy](https://docs.genlayer.com/developers/decentralized-applications/fees-and-transaction-kit). They distinguish stable Studionet from Studio-dev, but do not replace a live check of the endpoint and actual stable fee policy.

## Read-only RPC identity result

Attempted once on 2026-10-13:

```powershell
$body = '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
Invoke-RestMethod -Method Post -Uri 'https://studio.genlayer.com/api' `
  -ContentType 'application/json' -Body $body -TimeoutSec 8
```

**Result:** Windows returned `An attempt was made to access a socket in a way forbidden by its access permissions. (studio.genlayer.com:443)` with `SocketException (10013)`. The request did not produce an HTTP/JSON-RPC response. Therefore the RPC result is **not observed**; `61999` remains the expected SDK/configuration value, not a live verified value. No retry, proxy, TLS bypass, or alternate network was used.

The single request in the current preservation/readiness pass failed the same way. No supported alternate raw-RPC execution environment was available among the configured local tools; the documentation browser can verify documentation but is not an RPC execution client. No additional environment or infrastructure was introduced.

## Storage and local trust boundaries

- Contract addresses remain browser-local preferences, are trimmed, and must match a nonzero 20-byte hex shape before interaction. This is not deployment/code verification.
- Transaction history remains browser-local and is editable. On reload, prior statuses are demoted to `unknown`, marked `storedLocally`, and shown as “LOCAL NOTE · LAST SEEN …”; no local value is treated as chain evidence.
- No wallet credentials, private keys, documents, or evidence passages were added to persistent settings.
- The app still stores only device-observed times. It does not fabricate block timestamps or finality timestamps.

## Bundle result

GenLayerJS client loading was changed to a dynamic import. Landing and workspace routes now load as separate chunks with a small reduced-motion-aware loading indicator. The final build no longer emits the previous >500 kB chunk warning. Largest generated files after splitting: `index` 472.50 kB (101.56 kB gzip), dynamic SDK chunk 316.25 kB (94.03 kB gzip), workspace routes 54.87 kB (14.73 kB gzip). Feature routes and design remain unchanged.

The test script uses Vitest's installed `--configLoader native` mode because the default esbuild config loader was denied access while traversing above the Windows workspace during test startup. Native config loading is supported by the installed Vitest 4.0.13 and passed the suite.

## Tests and verification

Frontend commands:

```powershell
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

Results:

- ESLint: **passed**.
- TypeScript typecheck: **passed**.
- Vitest: **25 passed** across four files. Coverage includes wallet rejection, account and chain changes, injected-provider events and listener cleanup, wrong chain, malformed contract addresses, Registry/Evaluator argument validation, evidence digest mismatch, RPC errors, lifecycle timeout, accepted nonfinal state, finalized failure, missing execution result, successful finality, localStorage demotion, and commitments.
- Production build: **passed**. No chunk-size warning after code splitting.
- GenLayer Direct Mode: **60 passed** (the previous 59 contract regressions plus the new shared cross-language commitment test). Exact command, with an isolated artifacts directory:

```powershell
$artifact = Join-Path $env:TEMP 'precedentos-readiness-final-artifacts-20261013'
gltest tests/test_precedent_evaluator.py tests/test_precedent_registry.py `
  --rootdir C:\Users\USERpc\Documents\PrecedentOS `
  --artifacts-dir $artifact `
  --network localnet `
  --rpc-url http://127.0.0.1:4000/api `
  -q --tb=short
```

Direct Mode uses mocked LLM responses and does not contact localnet. It proves no live validator consensus, Studionet finality, failure rollback, or stable runner compatibility. Production Python contracts were unchanged. The RPC outcome and lint rerun are recorded below.

Preservation-pass rerun on 2026-10-13:

- Frontend lint: **passed** (`npm run lint`).
- Frontend typecheck: **passed** (`npm run typecheck`).
- Frontend tests: **25 passed**, 4 files (`npm test`).
- Production build: **passed** (`npm run build`); largest emitted JS chunk 472.55 kB, no chunk-size warning.
- Registry and Evaluator Direct Mode tests: **60 passed** (`gltest tests/test_precedent_evaluator.py tests/test_precedent_registry.py --rootdir C:\Users\USERpc\Documents\PrecedentOS --artifacts-dir $artifact --network localnet --rpc-url http://127.0.0.1:4000/api -q --tb=short`, where `$artifact` was a unique temp directory).
- GenVM lint: both contracts passed 3 lint checks and validation using cached artifacts. `genvm-lint` could not contact `genlayerlabs/genvm-manager` because Windows denied the outbound socket; its reported cached/latest candidate hash is not verified as stable Studionet's runner. UTF-8 console mode was needed to print the checkmarks in PowerShell.

No production contract or test failure was found. Git history still contains the pushed baseline and its predecessor; all contract files and the existing Registry/Evaluator test suites remain tracked and unchanged by this integration hardening. The only contract-test change adds a cross-language commitment regression.

## Remaining blockers and first controlled deployment requirements

Before the first controlled Studionet deployment or write:

1. From an environment with authorized network access, call only `eth_chainId` at the configured RPC and record an actual `0xf22f` / decimal `61999` response. Stop if it differs or cannot be identified.
2. Verify current stable Studionet's active consensus/runtime and fee policy from official stable-specific release information. If it requires fee distribution, establish and approve a matching SDK/toolchain; installed 1.1.8 cannot express that fee flow.
3. Verify the exact stable-compatible GenVM runner and re-run lint against that artifact. Prior local/cached runner checks are not proof of current Studionet compatibility.
4. Review and approve an immutable release of both Python contracts and the exact constructor/schema inputs; verify the intended deployment account and a funded test wallet through official wallet/network tools.
5. Prepare a no-secret deployment manifest template for contract source hashes, chain/RPC identity, deployer address, transaction hashes, resulting addresses, schema checks, and successful finalized execution results. Keep actual values empty until observed.
6. Only after separate explicit deployment approval, deploy Registry and Evaluator to Studionet, record the returned transaction IDs immediately, track each to `FINALIZED` and `FINISHED_WITH_RETURN`, verify resulting addresses and code/schema, then set the frontend address configuration. Do not retry a deployment merely because tracking timed out.
7. Perform the first controlled fictional registration and evaluation only after the deployment and fee gates pass. Confirm each stored record by keyed reads and each transaction's actual execution result. Do not claim live Equivalence Principle consensus or legal correctness from Direct Mode tests.

No deployment, wallet signature, or contract write is authorized by this readiness task.

## Deployment preparation checklist (commands not executed)

The current official deployment guide documents the CLI sequence below for stable Studionet. These are **prepared commands only**, not evidence that this repository's installed CLI `0.40.0-rc.3`, pinned `genlayer-js` 1.1.8, contract runner, or fee path is compatible. Before executing any deploy command, close the gates immediately below and obtain explicit deployment approval.

### Preflight gates

1. In an authorized network environment, issue one read-only `eth_chainId` request to `https://studio.genlayer.com/api`; proceed only if the RPC returns `0xf22f` (61999). The request in this task was denied before HTTP, so this remains open.
2. Verify the active **stable Studionet** GenVM/consensus runner and the required Python SDK/CLI versions from a stable release artifact or network metadata. Do not substitute a cached lint runner hash or the Studio-dev/Consensus v0.6 RC runner.
3. Verify the active stable fee model from stable-specific authoritative release notes or read-only network policy. Current general fee docs describe the v0.6 fee profile flow and SDK v2/CLI tooling, but do not demonstrate that those requirements apply to stable chain 61999. Do not guess a fee value/profile. The installed `genlayer-js` 1.1.8 adapter has no fee estimator/fee-policy API.
4. Review the exact Registry and Evaluator source hashes, current contract schemas, constructor arguments (both constructors take no arguments), deployer account, and the fictional-only test plan. Record actual values only after observed.
5. Run the compatible stable GenVM lint and regression tests against the selected runner. Current cached-artifact lint is not a stable runner compatibility proof.
6. Confirm enough approved test funds for the verified stable fee model. Do not treat the SDK's `value: 0n` as a protocol fee.

### Reproducible CLI workflow (for a later, separately approved deployment)

In PowerShell, from the repository root, the documented CLI network selection and deployment syntax is:

```powershell
genlayer network list
genlayer network set studionet
genlayer network info
```

Review the printed RPC and chain ID before any deploy. If the selected CLI version can issue the read-only check, verify `eth_chainId` directly at `https://studio.genlayer.com/api` as well. Stop on any mismatch, missing stable runner, or unresolved fee requirement. Only after every gate passes and deployment is explicitly approved would the deployment commands be:

```powershell
genlayer deploy --contract contracts/precedent_registry.py
genlayer deploy --contract contracts/precedent_evaluator.py
```

These deploy two independent contracts with no constructor arguments. Capture each returned transaction hash immediately; do not treat submission or finalization alone as success. Track each transaction using the selected compatible toolchain until it is finalized **and** its execution result indicates success. Save the actual contract address only after that verified outcome. If tracking times out, resume tracking the same hash; do not redeploy automatically. Do not enable frontend writes until addresses and code/schema/network provenance are independently checked.

The CLI deployment guide documents `genlayer deploy --contract <path>` and network selection; the network configuration guide documents `studionet` and the distinct `studio-dev` alias. General deployment docs explain that v0.6 deployments use fee distribution, while the fee guide identifies `genlayer-js` v2 and fee profiles. Those fee instructions are explicitly version/environment-sensitive and are **not** evidence that stable Studionet 61999 requires that RC flow. Sources: [Network Configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [CLI Deployment](https://docs.genlayer.com/developers/intelligent-contracts/deploying/cli-deployment), [Deploying Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/deploying), [Fees and Transaction Policy](https://docs.genlayer.com/developers/decentralized-applications/fees-and-transaction-kit), [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio).
