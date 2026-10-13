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
| 3 | Case lifecycle and decision states | **Implemented / Stage 1 local:** CaseCourt v1 owns status, participant addresses, version, and append-only case action journal; phases are EVIDENCE_OPEN, EVIDENCE_LOCKED, DECISION_RECORDED, CHALLENGE_OPEN, FROZEN. Decision references are opaque and not cross-contract verified. | Type-only CaseCourt state/port definitions added; no live route, address, or write path. | 35 CaseCourt Direct Mode tests; malformed, authorization, phase, replay, capacity, history, and state-preservation paths. | Source review plus cached GenVM validation; finality-dependent state activation and external contract boundaries unresolved. | **—** No CaseCourt deployment or chain read. |
| 4 | Appeals and appeal eligibility | GenLayer native transaction appeal is protocol-level; PrecedentOS case appeal not implemented. | Existing transaction status only; no case appeals. | No case eligibility/deadline tests. | Layer distinction specified; implementation review pending. | **—** |
| 5 | Enforceable decision freezes | **Implemented / Stage 1 local:** one 24-hour transaction-context-time freeze per case after a challenge; all other CaseCourt case mutations reject while frozen. It does not gate Registry/Evaluator or external systems. | No freeze UI; not shown as operational. | Frozen write matrix, requester/participant authorization, permissionless expiry materialization, and state preservation are covered in CaseCourt Direct Mode tests. | Case-local enforcement only; freeze transaction finality and real clock behavior remain runtime-unverified. | **—** No deployment or freeze transaction. |
| 6 | AI-assisted appeal judgments | No case appeal adjudicator. | No appeal judgment page. | No test. | Proposed independent EP and failure atomicity. | **—** |
| 7 | Genuine GenLayer Web Render evidence retrieval | No production render call; current Python contracts do not use Web Render. Official API is documented. | `/web-evidence` route intentionally disabled. | No render/validator runtime test. | URL, SSRF, page mutation and prompt-injection threats specified; controls unverified. | **—** |
| 8 | Evidence locking, versioning, provenance | **Implemented / Stage 1 local:** CaseCourt stores append-only evidence/source-reference digest references, schema version, submitter, case version, and transaction datetime; explicit lock transition. It does not verify digest against bytes or validate the external source. | Existing evidence UI unchanged; type-only CaseCourt reference shape added. | CaseCourt evidence schema, digest format, bounds, versioning, lock, retrieval, and rejected-state preservation tests. | No documents/PII stored in fixtures; digest authenticity and external source provenance remain caller assertions. | **—** No deployment or chain read. |
| 9 | Contradiction challenges | Evaluator can classify `possible_contradiction`; no challenge state or case action. | Comparison result can display contradiction; no challenge workflow. | Classification/validator mismatch tests exist locally; challenge tests missing. | Prompt/decision field risk reviewed for Evaluator; challenge abuse pending. | **—** |
| 10 | Precedent reversal and supersession | No on-chain relation or reversal method. | Demo graph may contain illustrative links only. | No relation/reversal test. | Append-only relation/no overwrite rules proposed. | **—** |
| 11 | Precedent authority and decision lineage | Registry v1 lacks relations; CaseCourt relation journal proposed. | `/graph` is a demo projection over fixtures. | No authoritative lineage tests. | Misleading-authority risk identified. | **—** |
| 12 | Multi-level appeals | No case-level levels. Native GenLayer appeals are not this feature. | No multi-level case workflow. | No transition or replay tests. | Proposed two ordinary levels plus limited exceptional review; policy needs review. | **—** |
| 13 | Deadlines and protocol case finality | No case appeal deadlines, case-final state, or finalized callback. CaseCourt only uses transaction-context datetime for its bounded freeze expiry; Stage 0 finality anchoring remains blocked. | Transaction lifecycle remains separate; no case deadlines. | Direct Mode freeze-time boundary only; no finality callback integration test. | Runtime ordering/finality semantics must be proven before deadline-dependent features. | **—** |
| 14 | Equivalence Principle and consensus-aware validation | Evaluator has custom `run_nondet_unsafe` independent comparison over decision-bearing fields. | App displays observed lifecycle states; no actual EP result. | Mocked Direct Mode comparison tests; not live consensus. | Existing Evaluator review; runtime consensus behavior remains open. | **—** No live validator consensus evidence. |
| 15 | Counterfactual analysis | No contract feature; correctly off-chain/hypothetical. | `/simulate` exists with fictional browser-only scenarios. | Limited frontend tests; no legal/model validation. | Needs explicit hypothetical labeling and no authoritative writes. | **—** Not intended as chain decision. |
| 16 | DAO and AI-agent integration | No DAO/agent role registry or adapter. | Wallet integration exists; no agent workflow. | No agent authorization tests. | Address≠identity; capability authorization threat model specified. | **—** |
| 17 | Security and abuse protections | Registry/Evaluator unchanged; deterministic CaseCourt authorization, replay, capacity, append-only history, and freeze checks implemented locally. | Existing wallet/network/write hardening; CaseCourt type-only port, no runtime writes. | 95 passed, 2 opt-in integration tests skipped across `tests/`; includes 35 CaseCourt tests. | Lint and tests are not a full security audit; external freezes, finality, due process, and on-chain costs remain open. | **—** Live behavior/security unverified. |
| 18 | Complete frontend workflows | CaseCourt deterministic core exists; AI rulings, appeals, Web Render, relations, and deadlines are absent. | Current pages preserved; added types/interfaces only. Governance workflow routes remain missing and disabled. | Existing 25 frontend tests passed; lint/typecheck/build passed after the type additions. | UX/a11y review of future governance routes remains open. | **—** No live workflows. |
| 19 | Real Studionet deployment verification | Both production contracts exist locally; deployed addresses absent/unverified. | Network identity probe exists but did not receive RPC response. | Local lint/Direct Mode only. | Runner, stable fee, addresses and deployment controls unresolved. | **—** No deployment; no successful `eth_chainId` RPC result. |
| 20 | Submission-ready documentation and demonstration | Existing v1 implementation/deployment docs; no v2 governance contract package. | Fictional demo and Chromatic Jurisprudence design exist. | Existing reported checks; no end-to-end live demo test. | V2 docs authored in Stage 0; independent policy/security review pending. | **—** No verified live deployment or demo. |

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

## Matrix closure rules

1. Replace `Proposed` with `Implemented` only when code exists and method/schema links are recorded.
2. Replace `—` in automated tests only when named tests cover both success and relevant adversarial/failure behavior; identify whether they are mocked, Direct Mode, local integration, or live.
3. Mark security review complete only with review report, unresolved findings and mitigations; a linter is not a security review.
4. Mark live verification complete only with stable chain ID, runner/SDK versions, deployed address, transaction IDs, finalized successful execution results, and direct readback. Do not use Studio-dev, localnet, or mocked data as Studionet evidence.
5. For features intentionally client-only (counterfactuals, graph rendering), contract column must say “not applicable by design” rather than silently omitting the requirement; frontend/security/automated/live status still must be tracked.
6. A live consensus result demonstrates protocol execution under its equivalence rule, not legal correctness.
