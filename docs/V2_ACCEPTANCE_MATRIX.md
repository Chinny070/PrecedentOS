# PrecedentOS 2.0 Feature Acceptance Matrix

This matrix carries every feature in the Stage 0 product brief across contract, frontend, automated testing, security review, and live stable Studionet verification. `Not implemented` is not an implicit future pass. Rows close only when evidence is linked in a later stage report.

## Status legend

- **Existing / local:** present in source and supported by local Direct Mode or frontend tests; not live proof.
- **Implemented / Stage 1 local:** deterministic CaseCourt source exists and passed Direct Mode plus cached GenVM lint; not local Studio or live proof.
- **Partial / demo:** some UI or helper exists but behavior is fixture-only or bounded to the loaded subset.
- **Proposed:** architecture is defined here; code is not implemented.
- **Blocked:** dependency or network/runtime proof is unresolved.
- **—:** no qualifying implementation/evidence yet.
- **Verified live:** requires actual stable Studionet evidence with transaction/read IDs; none of the v2 governance features currently qualify.

## Feature matrix

| # | Feature | Contract implementation | Frontend implementation | Automated tests | Security review | Live Studionet verification |
|---:|---|---|---|---|---|---|
| 1 | Precedent registration and evidence commitments | Registry v1 implemented append-only; verifies digest syntax, not source bytes. | Registration/detail/addresses implemented; live addresses absent. | Registry Direct Mode coverage; cross-language digest vector. | Registry/evaluator security reports exist; source authenticity remains unresolved. | **—** No live deployment/registration; RPC identity request was blocked before HTTP. |
| 2 | AI precedent evaluation | Evaluator v1 uses LLM + custom EP decision-field comparison; IDs are caller assertions. | Pair compare/result routes and adapter implemented. | Direct Mode tests mock LLM/validator; no real consensus. | Stage 2C review and existing bounds; no independent legal correctness. | **—** No live AI/validator result. |
| 3 | Case lifecycle and decision states | **Implemented / Stage 1 local:** CaseCourt v1 owns status, participants, version and append-only case action journal; phases include evidence, decision, challenge and freeze. Decision references are opaque and unverified. | Type-only CaseCourt state/port definitions; no live route or write path. | 41 CaseCourt Direct Mode cases; invalid transitions, authorization, replay, capacity, appeal filing, history and state-preservation paths. | Source review plus cached GenVM validation; finality and cross-contract authority unresolved. | **—** No CaseCourt deployment or chain read. |
| 4 | Appeals and appeal eligibility | CaseCourt first-level `challenge_decision` writes an immutable schema-v1 filing with level, appellant, decision ref/digest, grounds and `FILED_UNADJUDICATED`; no appeal outcome. | Type-only appeal view shape; no appeal UI/write route. | Full suite: 101 passed, 2 opt-in integration skips; eligibility, unverified reference, digest, grounds, replay and state-preservation paths covered in Direct Mode. | Appeal protocol documented; case deadline, admission, reviewer, new-evidence authenticity, higher levels and finality blocked/not started. | **—** No Studio or Studionet appeal transaction. |
| 5 | Enforceable decision freezes | **Implemented / Stage 1 local:** one 24-hour transaction-context-time freeze per case after a challenge; all other CaseCourt case mutations reject while frozen. It does not gate Registry/Evaluator or external systems. | No freeze UI; not shown as operational. | Frozen write matrix, requester/participant authorization, permissionless expiry materialization, and state preservation are covered in CaseCourt Direct Mode tests. | Case-local enforcement only; freeze transaction finality and real clock behavior remain runtime-unverified. | **—** No deployment or freeze transaction. |
| 6 | AI-assisted appeal judgments | No case appeal adjudicator. | No appeal judgment page. | No test. | Proposed independent EP and failure atomicity. | **—** |
| 7 | Genuine GenLayer Web Render evidence retrieval | No production render call; current Python contracts do not use Web Render. Official API is documented. | `/web-evidence` route intentionally disabled. | No render/validator runtime test. | URL, SSRF, page mutation and prompt-injection threats specified; controls unverified. | **—** |
| 8 | Evidence locking, versioning, provenance | **Implemented / Stage 1 local:** CaseCourt stores append-only evidence/source-reference digest references, schema version, submitter, case version, and transaction datetime; explicit lock transition. It does not verify digest against bytes or validate the external source. | Existing evidence UI unchanged; type-only CaseCourt reference shape added. | CaseCourt evidence schema, digest format, bounds, versioning, lock, retrieval, and rejected-state preservation tests. | No documents/PII stored in fixtures; digest authenticity and external source provenance remain caller assertions. | **—** No deployment or chain read. |
| 9 | Contradiction challenges | CaseCourt accepts bounded challenge grounds, checks participant/opposing submitter and exact stored decision digest, then appends a level-1 unadjudicated appeal. It does not verify the referenced evaluator output. | Existing comparison UI preserved; no challenge UI. | Direct Mode covers supported grounds, stale reference, replay and rejected-state preservation. | Caller-supplied decision remains `UNVERIFIED_CALLER_ASSERTION`; reviewer and challenge outcome are not implemented. | **—** No live challenge. |
| 10 | Precedent reversal and supersession | No on-chain relation or reversal method. | Demo graph may contain illustrative links only. | No relation/reversal test. | Append-only relation/no overwrite rules proposed. | **—** |
| 11 | Precedent authority and decision lineage | Registry v1 lacks relations; CaseCourt relation journal proposed. | `/graph` is a demo projection over fixtures. | No authoritative lineage tests. | Misleading-authority risk identified. | **—** |
| 12 | Multi-level appeals | First-level filing schema only. Proposed two ordinary review levels plus one exceptional reconsideration; no disposition/parent transition exists. Native transaction appeals are distinct. | No multi-level workflow. | First-level schema/replay tests locally; no level-2 or exceptional transition tests because those transitions do not exist. | Reviewer authority, prior-level outcome, windows and policy are unresolved. | **—** |
| 13 | Deadlines and protocol case finality | No case appeal deadlines, case-final state, or finalized callback. CaseCourt uses deterministic transaction datetime only for the one-day local freeze. | Transaction lifecycle remains separate; no case deadlines. | Direct Mode freeze-time boundary only; no finality callback integration test. | Current docs describe finality and `on='finalized'` messages; project runtime semantics and stable runner remain unproven. | **—** |
| 14 | Equivalence Principle and consensus-aware validation | Evaluator has custom `run_nondet_unsafe` independent comparison over decision-bearing fields; no appeal merits AI. | App displays observed lifecycle states; no actual EP result. | Mocked Direct Mode tests; not live consensus. | Official EP pattern documented; runtime consensus and legal correctness remain unverified. | **—** No live validator consensus evidence. |
| 15 | Counterfactual analysis | No contract feature; correctly off-chain/hypothetical. | `/simulate` exists with fictional browser-only scenarios. | Limited frontend tests; no legal/model validation. | Needs explicit hypothetical labeling and no authoritative writes. | **—** Not intended as chain decision. |
| 16 | DAO and AI-agent integration | No DAO/agent role registry or adapter. | Wallet integration exists; no agent workflow. | No agent authorization tests. | Address≠identity; capability authorization threat model specified. | **—** |
| 17 | Security and abuse protections | Registry/Evaluator unchanged; deterministic CaseCourt authorization, replay, capacity, append-only history and freeze checks. Opaque decisions explicitly stay unverified. | Existing wallet/network/write hardening; CaseCourt type-only port, no runtime writes. | 101 passed, 2 opt-in integration tests skipped across `tests/`; includes 41 CaseCourt cases. | Cached lint/tests are not a full audit; trusted contract identity, finality, due process and costs remain open. | **—** Live behavior/security unverified. |
| 18 | Complete frontend workflows | CaseCourt deterministic core exists; AI rulings, appeals, Web Render, relations, and deadlines are absent. | Current pages preserved; added types/interfaces only. Governance workflow routes remain missing and disabled. | Existing 25 frontend tests passed; lint/typecheck/build passed after the type additions. | UX/a11y review of future governance routes remains open. | **—** No live workflows. |
| 19 | Real Studionet deployment verification | Existing Registry/Evaluator and CaseCourt source exist; no deployed addresses. Official network docs specify RPC and chain 61999. | Existing wallet/network adapter; no CaseCourt write path. | Direct Mode and cached lint only. One PowerShell `eth_chainId` attempt failed locally before HTTP; prior user result `0xf22f` is user-observed. | Exact stable runner/toolchain and stable fee profile unresolved. | **—** No current RPC response or deployment. |
| 20 | Submission-ready documentation and demonstration | Stage 2 authority and appeal protocol docs exist; no authoritative case outcome contract/verified integration. | Fictional demo and visual design preserved; no appeal workflow enabled. | 101 passed, 2 opt-in skips; no end-to-end live demo. | Policy review, runtime proof, fee profiling and deployment remain pending. | **—** No verified live deployment or demo. |

## Stage 0 evidence snapshot

- Repository `main` was at `71b0b67a5c434584e406c7dd7ab76e121f635a1a`; current `git status` showed only the pre-existing user-requested `manual-deployment/` directory untracked before these Stage 0 documents were added.
- Existing reports record 60 Direct Mode contract tests and 25 frontend tests passing; Stage 0 did not rerun tests because this is architecture-only.
- Production contract paths were unchanged by the Stage 0 blueprint. The Stage 0 blueprint itself involved no install, deploy, wallet signature, or write transaction; the separate documentation-only preservation commit `258549db81024468159cc45fcf329f109ce70de5` was authorized and pushed at the start of Stage 1.
- Current official documentation confirms API patterns for web rendering, transaction timestamps, IC view calls, custom Equivalence Principle validation, and native appeals. Local/stable runtime behavior remains unverified.

## Stage 1 evidence snapshot

- Stage 0 was preserved in commit `258549db81024468159cc45fcf329f109ce70de5` and verified on `origin/main` before Stage 1 edits.
- `contracts/case_court.py` and its 35 Direct Mode tests are local implementation evidence only. The full `tests/` run completed with 95 passed and 2 opt-in local integration checks skipped.
- Frontend lint, typecheck, 25 Vitest tests, and production build passed; governance additions are type-only and no UI write route was enabled.
- Cached GenVM lint/validation passed for all three production contracts. The installed linter could not check upstream for a newer runner due the previously observed Windows socket restriction.
- No Docker service, local chain, Studionet deployment, wallet signature, or transaction was used. Existing `manual-deployment/` remains untracked and untouched.

## Stage 2 evidence snapshot

- Stage 1 implementation is preserved on `origin/main` at `c9e2b0ee0fee12f1337630141783f73507a92095`.
- CaseCourt labels opaque caller-bound decisions `UNVERIFIED_CALLER_ASSERTION` and records accepted first challenges as immutable `FILED_UNADJUDICATED` filings. The full Direct Mode suite reports 101 passed and 2 opt-in integration skips.
- Cached GenVM lint passed for all three contracts. The PowerShell read-only RPC attempt failed locally before receiving an RPC response; no Studio or live contract call was made.
- Detailed authority, appeal and runtime status is in `V2_DECISION_AUTHORITY.md`, `V2_APPEAL_PROTOCOL.md`, `V2_RUNTIME_VERIFICATION.md`, and `V2_STAGE_2_REPORT.md`.

## Matrix closure rules

1. Replace `Proposed` with `Implemented` only when code exists and method/schema links are recorded.
2. Replace `—` in automated tests only when named tests cover both success and relevant adversarial/failure behavior; identify whether they are mocked, Direct Mode, local integration, or live.
3. Mark security review complete only with review report, unresolved findings and mitigations; a linter is not a security review.
4. Mark live verification complete only with stable chain ID, runner/SDK versions, deployed address, transaction IDs, finalized successful execution results, and direct readback. Do not use Studio-dev, localnet, or mocked data as Studionet evidence.
5. For features intentionally client-only (counterfactuals, graph rendering), contract column must say “not applicable by design” rather than silently omitting the requirement; frontend/security/automated/live status still must be tracked.
6. A live consensus result demonstrates protocol execution under its equivalence rule, not legal correctness.
