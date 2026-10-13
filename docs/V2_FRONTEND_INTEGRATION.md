# PrecedentOS 2.0 Frontend Integration

**Status:** proposed frontend scope; preserve current Chromatic Jurisprudence app and its existing routes. No frontend code is changed by Stage 0.

## 1. Runtime boundary

- Keep the application as a static Vite/React/TypeScript SPA.
- Browser talks directly to GenLayer RPC/views through the pinned, verified-compatible GenLayerJS client and uses an injected EIP-1193 wallet for signed state-changing calls.
- No custom backend, Supabase/Firebase, API server, database, hosted indexer, cloud function, or remote model endpoint.
- Contract address configuration and transaction notes may be cached locally for convenience only. Revalidate network, account, address/schema, contract views, and transaction status when displaying authoritative state.
- Fictional local demo fixtures remain usable without wallet/deployment and are permanently tagged as demo-only.

## 2. Preserve and extend existing routes

Existing routes in the current app:

| Route | Current role | v2 extension |
|---|---|---|
| `/` | Editorial landing | Explain governance protocol, assurance limits, and live/demo network clearly. |
| `/lab` | Dashboard | Add actual chain observed counts only from direct paginated reads; preserve demo subset label. |
| `/precedents` | Registry / curated fictional records | Add cursor-paginated on-chain listing after Registry v2 enumeration is implemented; local filters cover loaded records only. |
| `/precedents/new` | Registration form | Show exact evidence bytes/digest/schema and public-only warning; never imply a Registry transaction before finalized successful result. |
| `/precedents/:id` | Fixture or keyed Registry detail | Show source commitment, submitter/sequence, transaction provenance and related finalized CaseCourt relations where fetched. |
| `/compare` | Pairwise evaluator | Keep explicit two-passage/criteria form; clearly label caller IDs as unverified unless the contract cross-check is proved. |
| `/evaluations/:id` | Evaluation detail | Show input commitment, criteria/version, result decision fields, evidence digests, finality result, and non-legal status. |
| `/graph` | Demo graph/lineage | Build from fetched relation/action pages; show coverage and cursor, label fixture graph as demo. |
| `/simulate` | Browser counterfactual demo | Keep hypothetical, ephemeral, not persisted/consensus-backed unless a separately specified protocol feature is approved. |
| `/verify` | Local transaction history | Re-fetch/prove chain transaction status; reloaded browser notes remain untrusted until checked. Show EVM submission vs GenLayer lifecycle vs case state separately. |
| `/web-evidence` | Disabled capability gate | Enable only after the Web Render gates in `V2_WEB_RENDER_DESIGN.md` pass. |
| `/settings` | Wallet and addresses | Add network identity and code/schema verification cues; never store credentials. |

Proposed additive routes:

| Route | Workflow |
|---|---|
| `/cases` | Direct paginated list of CaseCourt case IDs/status; filter loaded pages locally and show coverage. |
| `/cases/new` | Open fictional/public case, name parties, choose supported policy version, review opening evidence commitments. |
| `/cases/:caseId` | Case overview, current phase/version, parties, independent transaction status, operative decision reference, deadline source, notices. |
| `/cases/:caseId/evidence` | Append evidence version, view digest/source preview, invoke Web Render only if runtime enabled; show locked evidence root. |
| `/cases/:caseId/challenge` | Party challenge with typed grounds, evidence refs and current decision digest; display freeze eligibility and expiration. |
| `/cases/:caseId/appeals` | Multi-level appeal filing/status, eligibility/deadline/version checks, appeal decision timeline; separate native transaction appeal links/status. |
| `/cases/:caseId/lineage` | Typed citations/distinctions/questions/reversal/supersession relationships and immutable decision history. |
| `/authority` | Client-side authority graph over fetched page ranges; never imply complete corpus when pages are incomplete. |

Deep links must not bypass contract authorization. A user can view any public case; action buttons are convenience gates while the contract remains authoritative.

## 3. Chromatic Jurisprudence system preservation

Continue current editorial palette, asymmetric judicial-paper layouts, condensed display headings, mono provenance labels, deliberate color-coded states, responsive mobile composition, reduced-motion support, and keyboard-visible focus. Add case timeline/evidence actions in the same editorial visual language rather than a generic administrative dashboard. Every state label includes visible text and an icon/semantic indicator; color alone does not encode status. Test contrast, screen-reader names, keyboard navigation, zoom/reflow and reduced motion.

## 4. Direct GenLayer client adapters

Maintain a narrow adapter module (`frontend/src/lib/genlayer/`) with typed methods for:

- `readPrecedent(recordId)`, `readEvaluation(evaluationId)`, `readCase(caseId)`, `readEvidence(caseId,evidenceId,version)`, `readAction(sequence)`, `readRelation(sequence)`;
- bounded paginated methods if the contracts expose sequence/page views;
- `registerPrecedent`, `evaluatePair`, `openCase`, `appendEvidence`, `captureWebEvidence`, `evaluateCase`, `challenge`, `requestFreeze`, `fileCaseAppeal`, `decideAppeal`, `petitionExceptionalReview`, `finalizeCase` only after exact deployed schema verification;
- transaction lifecycle polling with explicit unknown/error/timeout states and success judged from verified execution result, not submission hash alone;
- read-only chain identity probe.

These are product adapter names, not new SDK method claims. Before implementation, verify the pinned GenLayerJS version's source/types for any new account/provider, fee, deploy, transaction status, appeal, finalize, schema/code, pagination or transaction lifecycle API. Existing v1.1.8 supports the already audited subset; newer docs show methods not in the pin. No speculative upgrade or API copying.

Every write validates exact argument count/types, public address shape, chain ID `61999`, selected account, schema versions, evidence digests, size limits, expected case version, current decision digest, and action IDs immediately before wallet submission. Account/chain/disconnect events invalidate session; no call occurs on wrong/unknown chain. Display the transaction payload and fee quote before wallet approval once a verified fee flow exists.

## 5. User experience for statuses

### Transaction lifecycle

Display EVM submission receipt (if exposed) separately from GenLayer IC transaction. Show stored/protocol status and execution result independently. Accepted is provisional and may be appealed; finalized can still contain an execution error. Unknown/timeouts remain unknown and never trigger automatic resubmission. Use only status/finality semantics exposed by the verified SDK/RPC and network.

### Case lifecycle

Show `EVIDENCE_OPEN`, `EVIDENCE_LOCKED`, `RULING_PENDING`, `CHALLENGE_OPEN`, `FROZEN`, `APPEAL_n_OPEN/PENDING`, `FINALIZABLE`, `CASE_FINAL`, and `CLOSED` as PrecedentOS state. Put current case transaction status beside each transition. `CASE_FINAL` is the case procedure's protocol result; a case-close transaction itself may remain nonfinal under GenLayer.

### Evidence provenance

Show content digest algorithm/schema, exact evidence version, source reference, capture timestamp and who submitted. Distinguish submitter-supplied decision date, GenLayer transaction context timestamp, chain transaction metadata, and browser-local observation time. Never infer a timestamp from a sequence ID.

## 6. Data retrieval without an indexer

Current Registry/Evaluator count methods do not enumerate IDs. v2 contracts should expose bounded sequence-to-ID and paginated action/relation views. The browser calls the official RPC directly, reads only limited pages, joins them in memory, and offers local search. It must display the requested range and last verified cursor. Avoid unbounded `Promise.all`, background full-chain scans, or endpoint scraping.

LocalStorage may store:

- user-entered public contract addresses;
- user display preferences;
- observed transaction hashes and local timestamps explicitly tagged as editable/unverified notes;
- optional locally prepared fictional evidence drafts if the user enables that behavior.

Never use it as source of truth, contract membership proof, authority status, wallet credentials, private key storage, or validator result. Re-hydrated transaction statuses are demoted until RPC-confirmed, preserving the current hardening.

## 7. Wallet, DAO, and agent UX

- Provide connect/disconnect-session controls and show active account/network.
- Request the wallet only when an explicit user action requires it. Do not prompt on page load.
- For agents, the agent signs as its own allowed account or invokes the contract via supported IC/EVM calling pattern; UI never grants an admin role implicitly.
- DAO policy is read from verified deployed contract state only if a DAO integration is actually implemented. Until then, any `DAO`, `agent`, `court`, or `authorized` badge is clearly demo data.
- Wallet signing never implies the user's real-world identity, legal role, or authority.

## 8. Frontend test requirements

Retain current wallet/adapter/persistence/domain/commitment tests. Add route and state tests for all case phases; party-vs-nonparty write controls; frozen writes hidden/disabled but also contract-tested; outdated version/digest; deadline boundary display; native-vs-case appeal labels; queued/finalized callback delays; stale wallet sessions; malformed RPC/contract responses; localStorage tampering; incomplete pagination; web evidence source preview/private URL rejection; dynamic web evidence disagreement; and responsive/accessibility basics. UI mocks are not contract/runtime proof.

## 9. Implementation gates

1. Resolve compatible SDK and stable runner/fee model before exposing write buttons for new methods.
2. Generate typed contract interfaces from actual deployed schema and compare them with reviewed Python signatures.
3. Require finality-aware public reads before showing authoritative relations, appeal clocks, freezes, or case finality.
4. Keep Web Evidence hidden/disabled until a real GenVM render test passes.
5. Keep all users on fictional data until the demo and provenance claims pass security review.
