# PrecedentOS frontend architecture

## Scope

The browser application is a static Vite + React + TypeScript SPA under frontend/. It has no application server, API routes, database, hosted indexer, or account service. The browser talks directly to a user-configured GenLayer contract through GenLayerJS and an injected EIP-1193 wallet. Public fictional fixtures support browse-only use without a wallet.

## Boundaries

- src/config/chain.ts imports the SDK's studionet chain object and checks its ID against 61999. The stable network object, not a hand-written RPC override, supplies the RPC endpoint.
- src/lib/genlayer/client.ts isolates read-only views, wallet connection, contract writes and finalization observation.
- src/lib/commitments.ts implements exact UTF-8 SHA-256, code-point length validation, and the evaluator's v1 length-framed input commitment.
- src/fixtures/demo.ts contains fictional examples only. Fixture labels and relationships are explicitly DEMO; they never imply a live consensus result.
- Local storage contains only public contract addresses, observed transaction hashes/action labels/status and device-observed times. It is not authoritative chain history.

## Contract surface used

Registry reads: get_precedent(record_id). Registry write: register_precedent(record_id, evidence_digest, schema_version, jurisdiction, decision_date, category).

Evaluator read: get_evaluation(evaluation_id). Evaluator write: evaluate_pair(evaluation_id, record_a_id, record_a_digest, record_b_id, record_b_digest, evidence_packet_json, evidence_schema_version, criteria_version, criteria).

The Registry's document digest and Evaluator's passage digests are separate values. The evaluator does not verify Registry membership, so its IDs are presented as caller references. Registry count is not used to claim corpus enumeration.

## GenLayerJS verification boundary

The frontend pins GenLayerJS 1.1.8. Its installed package declarations, package README and typecheck confirm the used API surface: `createClient`, `studionet`, injected `provider`, `connect('studionet')`, `readContract`, `writeContract({ value: 0n })`, `waitForTransactionReceipt({ status: TransactionStatus.FINALIZED })`, and `ExecutionResult.FINISHED_WITH_RETURN`. Reads use the official `studionet` chain object; the chain definition is checked against 61999 at module load.

The current online GenLayerJS API page describes a newer API with fee estimation and `waitForFinalization`/`isSuccessful`; those names are not in the installed 1.1.8 declarations. The adapter therefore follows the pinned version's own README and declarations, not newer names. This establishes compile-time compatibility with the package, not compatibility with current Studionet transaction policy or a live endpoint. No wallet, RPC, contract address, or transaction was used. Verify live read and write behavior with a known deployment before enabling production writes.

References:

- [GenLayerJS API](https://docs.genlayer.com/api-references/genlayer-js)
- [GenLayerJS 1.1.8 package README](https://github.com/genlayerlabs/genlayer-js/blob/v1.1.8/README.md)
- [GenLayerJS contract methods](https://docs.genlayer.com/api-references/genlayer-js/contracts)
- [Writing to Intelligent Contracts](https://docs.genlayer.com/developers/decentralized-applications/writing-data)
- [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- [GenLayerJS 1.1.8 release](https://github.com/genlayerlabs/genlayer-js/releases/tag/v1.1.8)

## Capability gates

- Contract addresses are absent until verified deployment addresses are supplied. Writes remain disabled otherwise.
- RPC identity check is a user-triggered read-only eth_chainId probe against the SDK's Studionet endpoint. A successful identity response does not prove a deployment or contract behavior.
- Transaction submitted time and finalization-observed time use the browser clock and are labeled as local observations. No block timestamp API is implemented.
- Web Render is a disabled capability page. Browser fetch/iframe behavior is not substituted for GenLayer runtime retrieval.
- Search, analytics, graph and counterfactuals cover only the small loaded demo set. They do not claim a complete corpus or consensus.

## Design and accessibility

The UI implements the Chromatic Jurisprudence palette, editorial asymmetry, condensed poster-scale headings, mono provenance labels, contrast-coded evidence/result cards, reduced-motion support, keyboard focus rings, descriptive labels, responsive stacked forms, and a graph list alternative. Fonts use system fallbacks; no font service is required.
