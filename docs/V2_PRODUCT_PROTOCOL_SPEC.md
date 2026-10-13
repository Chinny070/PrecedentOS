# PrecedentOS 2.0 Product and Protocol Specification

**Stage:** 0 — architecture blueprint only; no v2 contract or UI implementation is authorized by this document.
**Repository baseline:** `71b0b67a5c434584e406c7dd7ab76e121f635a1a` on `main`.
**Network target:** GenLayer stable Studionet, expected chain ID `61999`.
**Product boundary:** browser frontend plus GenLayer Intelligent Contracts; no custom backend, hosted database, or hosted indexer.

**Document version boundary:** the pre-existing `docs/ARCHITECTURE.md` and `docs/BUILD_PLAN.md` preserve the earlier v1 MVP proposal, including a minimal off-chain API/indexer option. They remain unchanged as historical v1 documents. For PrecedentOS 2.0, this specification and the other `V2_*` documents supersede that option and enforce the newer browser-plus-Intelligent-Contracts-only requirement.

## 1. Product purpose and assurance language

PrecedentOS is a public, append-only research and dispute protocol for comparing precedent evidence, recording case-specific decisions, and preserving challenges, appeals, reversals, and authority relationships. It is not a court, legal representative, or source of legal truth. Its AI output is an advisory analysis accepted under a contract-defined GenLayer Equivalence Principle. Validator agreement establishes agreement under that rule and the protocol's transaction process; it does not establish that the evidence is true, the reasoning is legally correct, or the result is binding in a jurisdiction.

Every presentation must distinguish at least four independent claims:

1. **Evidence provenance:** which bytes, URL, version, and metadata were committed or rendered.
2. **AI assessment:** what the leader's and validators' contract logic concluded about the supplied evidence.
3. **GenLayer transaction status:** pending, decided/accepted, appealed, finalized, failed, or unresolved according to the selected SDK and network.
4. **PrecedentOS case status:** evidence open, decision challenged, appeal available, frozen, procedurally final, reversed, superseded, closed, or exceptional review.

No UI may collapse these into a single “approved” badge. GenLayer transaction finality is not PrecedentOS case finality.

## 2. Existing baseline to preserve

The current project is not a greenfield application:

- `contracts/precedent_registry.py`: append-only registration keyed by unique ID; lowercase SHA-256 syntax; schema v1; bounded public jurisdiction/date/category fields; submitter attribution from `gl.message.sender_address`; sequence number; keyed views and count. It has no corpus enumeration, case model, relation model, update, or delete method.
- `contracts/precedent_evaluator.py`: bounded pairwise fictional evidence comparison; computes SHA-256 over the exact UTF-8 passages, commits IDs/digests/schema versions/criteria; uses `gl.nondet.exec_prompt` and a `gl.vm.run_nondet_unsafe` validator that independently reruns the task and compares the classification plus five decision booleans; append-only evaluation results. It does not check Registry membership or provide case adjudication/appeals.
- `frontend/`: static Vite/React/TypeScript application using pinned `genlayer-js` 1.1.8 and direct injected-wallet integration. Routes include landing, lab, precedent list/register/detail, pair comparison, evaluation detail, graph, simulation, verification history, Web Evidence gate, and settings.
- Six fictional precedent fixtures and illustrative comparison fixtures support demo mode. Graph, simulation, and some dashboard elements use a local bundled subset; they are not a complete chain corpus.
- Frontend hardening includes wallet/account/network checks, guarded contract adapters, transaction status distinctions, locally stored address preferences and demoted local transaction notes, and cross-language commitment vectors.
- Existing reports record 60 Direct Mode contract tests and 25 frontend tests passing. These are local/mocked results, not live consensus or Studionet verification. Cached GenVM lint has passed but did not establish current stable runner compatibility.
- `manual-deployment/` is currently untracked user-requested material and must be preserved; Stage 0 must not commit or overwrite it.

## 3. Actors and protocol objects

### Actors

- **Petitioner / responding party:** wallet addresses named when a case is opened. Address control is proven by transaction authorization; legal identity, agency, capacity, or authority is not proven.
- **Evidence submitter:** a named party or another actor explicitly authorized by a versioned case policy.
- **Case participant:** named party permitted to challenge, request an in-protocol freeze, file an appeal, or petition exceptional review subject to phase and deadline rules.
- **Permissionless keeper:** any account may call a deterministic transition such as `close_case` once its encoded conditions are met. A caller cannot override a deadline or decision.
- **GenLayer leader and validators:** execute and assess non-deterministic tasks under the contract's Equivalence Principle. They are not appointed judges and their votes do not authenticate evidence.
- **DAO / AI agent:** a wallet or supported contract caller using the same permission checks. Its claimed role must come from an on-chain authorization rule; a frontend label or API key is not authority.
- **Public reader:** reads bounded on-chain state and can reproduce client-side views without receiving privileged access to private case data. MVP assumes no confidential case payloads.

### Objects

- **Precedent record:** immutable ID, digest, schema version, bounded public labels, submitter, and registration sequence.
- **Evidence reference:** evidence ID, exact content digest, schema/version, source kind, optional safe public source reference or source-reference digest, submitter, and transaction-context timestamp. Full source documents remain off chain.
- **Case:** unique ID, parties, locked policy/criteria versions, current phase/version, bounded references to precedents/evidence/evaluations, freeze/appeal bookkeeping, and current operative decision reference.
- **Case action:** append-only, sequential record of each valid transition, expected case version, actor, bounded payload digest, and transaction-context timestamp.
- **AI assessment:** bounded structured comparison/ruling generated from explicitly supplied evidence and criteria, with decision-bearing fields checked independently by validators.
- **Authority relation:** append-only `cites`, `distinguishes`, `questions`, `reverses`, or `supersedes` relation, bound to a case decision/evaluation and its evidence digest. A relation records a protocol assertion, not a universal statement of legal authority.

## 4. Product feature inventory

The canonical feature-by-feature implementation status is in [V2_ACCEPTANCE_MATRIX.md](V2_ACCEPTANCE_MATRIX.md). In brief:

| Capability | Baseline classification |
|---|---|
| Precedent registration and evidence commitments | Implemented in Registry v1; no live deployment; no complete listing |
| AI precedent evaluation | Implemented in Evaluator v1; Direct Mode uses mocked non-determinism; no live validator result |
| Case lifecycle / decision states | Missing; proposed in a new CaseCourt contract |
| Case appeals and enforceable freeze | Missing; native GenLayer transaction appeal is a separate existing protocol function |
| AI-assisted appeal judgments | Missing; proposed bounded independent evaluation in CaseCourt |
| Genuine Web Render evidence | UI gate only; official API documented; not integrated or runtime-tested here |
| Evidence locking/versioning/provenance | Initial passage commitments exist; case-level version history missing |
| Contradiction challenges | Evaluator can classify potential contradiction; challenge procedure missing |
| Reversal/supersession | Missing on chain; demo lineage does not establish authority |
| Authority and decision lineage | Demo projection only; no authoritative protocol relation record |
| Multi-level appeals and case deadlines/finality | Missing; require a distinct case state machine and verified time/finality handoff |
| Counterfactual analysis | Fictional, browser-only demo; no authoritative persisted outcome |
| DAO/AI-agent integration | Missing; no privileged agent identity or governance module |
| Security | Existing Registry/Evaluator and frontend hardening; governance/Web Render threat surface unimplemented |
| Complete frontend | Existing research workbench; proposed dispute and appeal workflows missing |
| Live Studionet verification | Missing; the recorded `eth_chainId` request was denied before HTTP by Windows socket error 10013 |
| Submission-ready demo/docs | Existing project docs and demo exist; v2 design documents are created by Stage 0 only |

## 5. Protocol invariants

1. Every record, evidence revision, case action, evaluation, and authority relation is append-only. A correction is a new version/action linked to the old one.
2. A state-changing case call names an expected case version and, where meaningful, the digest of the current decision. A mismatch rejects the call; it cannot silently apply to a newer state.
3. Evidence is committed by deterministic SHA-256 of an explicitly versioned byte encoding. The exact source bytes/text are verified against the digest before AI evaluation. A digest proves byte equality to supplied bytes only, not truth or authorship.
4. Case criteria, appeal policy, bounds, and schema version are locked when the case is opened. New policy applies only to new cases unless a protocol-approved migration is implemented.
5. Decision-bearing output fields are independently reproduced or assessed by validators. JSON schema validity alone is never an acceptance rule.
6. No state mutation follows a failed/malformed/non-equivalent AI result. Rejected state-changing calls preserve the prior accepted state under tested runtime semantics.
7. Freeze state is enforced inside every CaseCourt method that can alter the protected case decision, evidence set, appeal stage, or case closure. A badge or frontend disablement is insufficient.
8. A freeze is scoped: it cannot stop the GenLayer network from finalizing a transaction, prevent activity in independent Registry/Evaluator contracts, or reverse an external action. Any external consumer must query the final CaseCourt state and enforce its own guard.
9. GenLayer accepted state is provisional during the protocol appeal window. The UI labels it provisional and observes protocol finality separately from the case procedure.
10. Only fictional/public material is used until privacy, data handling, and jurisdiction-specific legal review are approved.

## 6. Case decision policy (proposed, not legal policy)

The protocol provides a transparent process, not substantive law. A case creator chooses a published, versioned criteria policy from the contract's supported set. AI may only return bounded statuses such as `SUPPORTED`, `NOT_SUPPORTED`, `CONTRADICTED`, or `INSUFFICIENT_EVIDENCE`, reasons tied to evidence IDs, and an advisory outcome. The policy must specify which output fields are compared by validators and which decision follows each field combination. It must not ask validators to decide whether an outcome is “legally correct.”

Initial proposal: two case appeal levels (`APPEAL_1`, `APPEAL_2`) after a first-instance ruling, one appeal per party per level, plus at most one exceptional-review petition per party on a new, non-replayed evidence digest. These are protocol limits to review with legal/product stakeholders before code. They do not limit GenLayer's native appeals on any transaction.

Proposed deadlines are policy data, not hard-coded facts: evidence window 7 days; post-decision challenge window 72 hours; each case appeal window 7 days; maximum in-protocol freeze 24 hours before an appeal must be filed to extend a hold. These values require due-process review and runtime timing verification. Deadlines use deterministic GenVM transaction context time, never a browser clock. Deadline anchoring to the finalized case-stage transaction is a blocker until a supported, tested finality callback/activation design is selected (see state machine and master plan).

## 7. Evidence and AI workflow

1. Browser prepares fictional/public source bytes, canonicalizes using a documented schema, computes SHA-256, and displays the exact committed bytes and metadata.
2. A party opens a case, naming parties, case type, policy versions, and initial commitments. The contract captures the authenticated caller and deterministic transaction context timestamp.
3. Parties append immutable evidence versions before the evidence cutoff. Evidence may include an explicit precedent ID/digest and an optional public web source reference.
4. For controlled Web Render, a CaseCourt method invokes the documented GenVM renderer inside non-deterministic execution. The output is normalized/bounded, committed, assigned an evidence version, and independently validated under a defined Equivalence Principle. If validators cannot agree on material rendered facts, it is not used as accepted evidence.
5. A bounded case/appeal assessment consumes only evidence references/bytes explicitly supplied or pinned by the contract and a criteria version. Evidence is treated as hostile quoted data; prompt instructions in evidence are ignored.
6. Validators compare classification, material fact flags, evidence sufficiency, and proposed action/outcome. Free prose may vary but must be bounded and linked to evidence references.
7. A successful accepted result is persisted append-only. It is labeled provisional until its GenLayer transaction is finalized. Failed or undetermined assessments do not become operative case decisions.

## 8. Non-goals and product language

- No backend, cloud database, hosted indexer, external identity provider, or server-side model service.
- No confidential case data, full documents, personal data, wallet secrets, or private evidence on chain.
- No claim that Web Render archives the Internet or that a source remains available later.
- No claim of official case docketing, legal service, jurisdiction, enforceability in a court, or legal correctness.
- No hidden state edits, admin override, unbounded model output, or silent off-chain authority inference.

## 9. Official capability references and evidence boundary

Official documentation currently describes Python Intelligent Contracts, `gl.nondet.exec_prompt`, `gl.vm.run_nondet_unsafe`, custom Equivalence Principle validation, `gl.nondet.web.render`, synchronous IC view calls, asynchronous `emit(on='finalized')` messages, `gl.message_raw['datetime']`, GenLayer transaction appeals, and explicit transaction finality. The relevant sources are linked in [V2_CONTRACT_ARCHITECTURE.md](V2_CONTRACT_ARCHITECTURE.md) and [V2_WEB_RENDER_DESIGN.md](V2_WEB_RENDER_DESIGN.md).

These are documentation-confirmed APIs/patterns as checked 2026-10-13. They are **not** a claim that the project has deployed or tested them on current stable Studionet. Exact runner hash, pinned CLI/SDK/runtime compatibility, fee requirements, transaction-phase callbacks, Web Render behavior, event/history APIs, and live chain identity remain verification gates.
