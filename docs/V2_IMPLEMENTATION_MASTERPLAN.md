# PrecedentOS 2.0 Implementation Masterplan

**Current stage:** Stage 0 architecture blueprint. This pass creates design documents only.
**Target:** stable GenLayer Studionet, expected chain ID `61999`.
**Constraints:** preserve v1 and Git history; browser + Intelligent Contracts only; no deployment, transaction, dependency install, or push without separate authorization.

## 1. Dependency graph

```text
Stage 0 blueprint ──► Stage 1 runtime/API gates ──► Stage 2 compatible interface/limits
                                                     ├─► Stage 3 CaseCourt lifecycle
                                                     ├─► Stage 4 AI case/appeal EP
                                                     └─► Stage 5 Web Render evidence
Stages 2–5 ──► Stage 6 browser workflows ──► Stage 7 security/economic review
Stages 3–7 ──► Stage 8 isolated local integration ──► Stage 9 controlled Studionet proof
All prior stages ──► Stage 10 demo/documentation release package
```

Do not implement dependent features around an unverified call path. Existing Registry/Evaluator remain preserved and individually useful throughout.

## 2. Stage plan and acceptance criteria

### Stage 0 — Repository audit and protocol blueprint (this assignment)

**Scope:** inventory baseline, define product/state/contract/security/Web Render/frontend design, record evidence and open gates, provide feature acceptance matrix.

**Measurable exit:** all eight required v2 docs exist; all 20 requested capabilities appear in the acceptance matrix; existing contract interfaces and frontend routes are recorded; verified documentation vs local/live claims are distinguished; no implementation/deployment/commit/push performed. Stage 0 does not claim Stage 1 runtime compatibility.

### Stage 1 — Stable runtime and API compatibility proof (recommended next stage)

**Scope:** no production feature code. Verify current official stable Studionet network identity, actual stable-compatible GenLayerJS/CLI/Python SDK/GenVM runner and fee model; prove current deployed docs against installed artifact; inspect Web Render, timestamp, cross-IC view, finalized-message semantics, transaction appeals/finality, schema/code/history read APIs. Attempt read-only RPC identity once from a permitted environment. Record exact package versions, runner hash, source links, limits, and errors.

**Exit criteria:** (1) stable RPC returns chain 61999, or blocker recorded without retry loops; (2) a release artifact maps the chosen GenVM runner to stable Studionet; (3) selected SDK can encode/decode required calls and transaction lifecycle; (4) no stable-vs-Studio-dev mix; (5) fee/appeal charge method and estimate path are version-verified; (6) cross-contract view returns existing/missing records in a two-contract integration probe; (7) a finalized callback to the owning case contract is demonstrated or replaced with another proofable design; (8) Web Render returns known fixture output under exact runner, with output/URL/timeout bounds. Any item unavailable stays blocked and dependent production features do not proceed.

### Stage 2 — Contract schema and bounded cost design

**Scope:** finalize Registry v2 pagination/relation requirements and CaseCourt state/action schemas; fix canonical encoding, evidence/URL bounds, policy versioning, IDs, counters, reading cursors, query cost and transaction fee profiles. Do not alter v1 Registry/Evaluator unless a reviewed additive version is needed.

**Exit criteria:** method schema table and generated schema match the code; all limits are supported by runner/network profiling; all case policy values have product/due-process review; every state transition has auth/precondition/effect; all case action writes are append-only and replay-bound; contract code size and maximum storage/output fit verified limits.

### Stage 3 — CaseCourt deterministic lifecycle core

**Scope:** implement case opening, parties, evidence commitments/versioning/locking, immutable action journal, expected version checks, deadline-safe state, challenges, bounded freeze and its expiry, appeal eligibility/counters, closure and relation recording. AI/Web Render methods remain gated until their stages pass.

**Exit criteria:** tests cover every allowed transition and every unauthorized/invalid/replay/stale/oversize path; before/after persistent state equality on rejection; frozen-state test enumerates every state-changing method; test all appeal levels, exceptional review and reversed/superseded history; no mutation/delete method; GenVM lint and selected runtime integration pass. Case clock begins only through the Stage 1-proven finality anchor.

### Stage 4 — AI case rulings, contradiction challenges, and appeal judgments

**Scope:** bounded `gl.nondet.exec_prompt` tasks and custom validator using `gl.vm.run_nondet_unsafe`; decision schema for first-instance and appellate assessment; evidence ID grounding; criteria/prompt version commitments; independent validator decision fields. Keep existing pairwise Evaluator unchanged unless a specific additive reason is approved.

**Exit criteria:** tests include correct/incorrect-but-valid JSON, classification mismatch, each decision field mismatch, rationale-only variation, prompt injection, malformed output, missing evidence, digest mismatch, model/validator exception, timeout, size caps, replay, and state unchanged on rejection. Real local integration must show validator-side disagreement rejects/no successful state write. Studionet later proves a real AI task and consensus lifecycle, not legal correctness.

### Stage 5 — GenLayer Web Render evidence

**Scope:** supported renderer API for public, safe, bounded URL capture; record exact render digest/version, timestamp and extracted claims; dynamic-page difference behavior; link immutable evidence to case version; UI remains disabled until runtime proof.

**Exit criteria:** static fixture matches; dynamic source update/disagreement rejects or yields insufficient evidence; URL policy and real runner egress controls verified; oversized/private/redirect/authenticated/malformed pages reject; evidence version can be fetched and digest checked; no write before accepted render validation; maximum fee/cost profiled and displayed.

### Stage 6 — Frontend governance workflows

**Scope:** preserve visual identity and existing research pages; add case open/detail/evidence/challenge/freeze/appeal/relation/authority routes; direct contract reads and writes; local browser pagination; Web Evidence live workflow after Stage 5 only; status and provenance distinctions.

**Exit criteria:** each method connects to actual schema; wallet/account/chain events invalidate stale sessions; no write to unverified/malformed address or wrong chain; all routes, keyboard/mobile/reduced motion, and failure states tested; no demo output shown as live; no localStorage values used as authoritative evidence; browser reads display coverage and cursor.

### Stage 7 — Security, abuse, privacy, and economics review

**Scope:** review contract authorization, replays, freeze abuse, evidence privacy, prompt/web injection, URL egress, native/case appeal interactions, roles/DAO agents, fee/bond policy, state consistency and user-facing legal claims.

**Exit criteria:** threat register closed or explicitly accepted; all critical/high findings fixed and regression-tested; fuzz/boundary tests pass; cost profiles for normal/max/appeal/web path within approved policy; independent reviewer signs off; no PII/private case data in source/tests/fixtures; source and generated schema hashes recorded.

### Stage 8 — Isolated local multi-contract integration

**Scope:** use supported local Studio or official integration environment only with explicit service-start authorization. Exercise Registry and CaseCourt/Evaluator interfaces, view reads, finality callbacks, replays and state preservation. Do not interpret Direct Mode mocks as runtime proof.

**Exit criteria:** separately deployed local contracts pass existing and new integration suite; exact runtime/runner and RPC chain ID recorded; transaction receipt/status/execution success/finality verified; cross-contract existing/missing reads and callback retries pass; no destructive resource cleanup; report clearly says localnet only.

### Stage 9 — Controlled stable Studionet verification

**Scope:** only after a separate explicit deployment/write approval. Immutable reviewed source hashes; stable chain 61999 verified; stable-compatible fee and runner confirmed; test wallet/deployer and fictional test plan approved; deploy contracts, follow each actual transaction, record verified addresses/code/schema, then run narrowly bounded test flows.

**Exit criteria:** every deployment and write transaction hash recorded; actual `FINALIZED` plus successful execution result separately verified; real validator-side AI/EP result visible in receipt/trace; Registry check and Web Render tests recorded if enabled; case appeal and case finality tested; no asserted data fabricated; source/address/network and cost evidence published. A live validator agreement is still not legal correctness.

### Stage 10 — Submission-ready demo and documentation

**Scope:** reproducible fictional demo, presentation, source/evidence timeline, protocol transaction timeline, state/appeal explainer, verified deployment manifest, reproducible commands, screenshot/video capture using only actual observed values.

**Exit criteria:** a fresh user can reproduce demo without credentials; every live label maps to an actual recorded transaction/read; every feature in acceptance matrix has evidence or marked blocker; security and network warnings are visible; no backend/indexer secret dependency; accessibility and responsive checklist passes; final docs identify exact release/runner/address/commit evidence.

## 3. Cross-stage stop rules

- If official docs, pinned package/source, runtime, or live network disagree, stop affected implementation and preserve the blocker.
- No guessed SDK methods, runner hashes, fees, timestamps, contract addresses, transaction receipts, validator result, or case deadline origin.
- A static lint or mocked test may support source-level confidence only; it cannot satisfy runtime or live columns.
- A missing cross-contract or finalized callback proof blocks dependent case integration; continue independent UI or deterministic tests only if they remain honest and safe.
- Any contract change to Registry/Evaluator must be additive, justified, independently reviewed, and regression-tested; preserve v1 deployable artifacts and Git history.
- No deploy, write, or wallet signature during Stage 0–8. Stage 9 requires separate user authorization.

## 4. Recommended Stage 1 scope

Start with a **time-bounded runtime verification report**, not new CaseCourt implementation:

1. Reconcile official stable Studionet docs, stable release tags and versioned SDK/CLI/Python/GenVM artifacts; prove chain 61999 vs Studio-dev 61997.
2. Run one permitted read-only chain ID probe from an authorized execution environment; record exact result/error.
3. Verify exact pinned SDK `1.1.8` APIs and installed CLI/runtime; determine whether their release artifacts explicitly support the intended stable chain.
4. Resolve runner hash and stable fee transaction policy; do not import Studio-dev v0.6 RC guidance as stable fact.
5. Prepare and execute only locally authorized probes for cross-contract `view()` reads and a same-contract `emit(on='finalized')` callback with idempotent retry/rollback semantics; if services are unavailable, keep these blocked and provide prerequisites.
6. Verify transaction context timestamp and Web Render response/limits on a compatible isolated runtime; no deployment to Studionet.
7. Return GO/CONDITIONAL/NO-GO per capability and update acceptance matrix without changing production contracts.

This narrow stage removes the key architecture risks before investing in a large governance contract.
