# PrecedentOS 2.0 — GenLayer Studio Manual Diagnostic Test Plan

## Stage 7B approval separation

- **READ-ONLY CHECKS:** inspect the diagnostic source, verify Studio network label and chain ID, inspect constructor/method recognition, and review the current displayed status/fee information. A view/read has no write approval implication.
- **DEPLOYMENT REQUIRES APPROVAL:** deployment creates a contract and may incur a fee. The user must independently review the exact source, network, and displayed cost before confirming.
- **WRITE TRANSACTION REQUIRES APPROVAL:** each optional method call is a separate transaction decision. Do not treat a prior deployment decision as approval for writes.
- **FEE REQUIRES REVIEW:** review each currently displayed deployment/write fee and acceptable amount. This repository does not estimate GEN or network costs.

Do not send a transaction, sign a wallet message, deploy, or share keys as part of reading this procedure. The rest of this document remains the manual workflow; no Studio operation has been performed by Stage 7B.

**Purpose:** a user-operated, isolated diagnostic of browser deployment and runtime behavior. This is not a production deployment guide and does not authorize Codex to deploy or send transactions. The probe has not been deployed. Stable runner compatibility and current fees remain unresolved.

## Artifact and preflight

- **File:** `experiments/stage6/studio_runtime_probe.py`
- **Class:** `StudioRuntimeProbe`
- **Constructor arguments:** none (`__init__(self)` only)
- **Expected network:** stable GenLayer Studionet, chain ID `61999` (`0xf22f`). Verify the Studio network label and chain ID in the interface immediately before any deployment or write. Stop for Studio-dev `61997`, localnet `61127`, an unknown network, or inconsistent chain ID.
- **Known compatibility limit:** cached GenVM lint passed, but upstream runner lookup was blocked by Windows `WinError 10013`; its cached hash is not proof of the current stable runner. Do not interpret the lint result as browser deployment compatibility.
- Use fictional public text and identifiers only. Do not enter personal, confidential, legal-client, privileged, credential, or private evidence. Never enter or share a private key or seed phrase.

## Public methods

| Method | Kind | Arguments | Intended observation |
|---|---|---|---|
| `get_probe_state()` | View | none | Initial count/status; safe first read after deployment. |
| `record_transaction_context(probe_id)` | Write | fictional bounded ID, e.g. `PROBE-CONTEXT-01` | Caller, origin, chain ID, contract address, transaction-context datetime. Optional transaction only. |
| `run_ai_equivalence_probe(probe_id, fictional_input)` | Write / AI + custom EP | fictional unique ID and bounded public fictional text | AI result plus validator decision-bearing comparison; optional cost-bearing test. |
| `run_forced_disagreement_probe(probe_id)` | Write / expected EP failure | fictional unique ID | Validator deliberately returns disagreement. Expected transaction failure; no successful state append. Optional cost-bearing test. |
| `run_expected_failure_probe(probe_id)` | Write / deterministic error | fictional unique ID | Deterministic `UserError`; state should remain unchanged. Optional cost-bearing test. |

## Manual procedure and evidence to collect

### A. Source and network review

1. Open the exact probe file above in the repository and review the complete source. Confirm class name, no constructor parameters, bounded inputs, and no Web Render method.
2. Open GenLayer Studio using the user's normal browser/wallet workflow. Do not change wallet settings. Confirm the selected environment is explicitly stable Studionet and chain ID is `61999` before proceeding. Stop if the network/fee display is missing or ambiguous.
3. Review any deployment fee/quote and the transaction lifecycle labels shown. Fees and stable runner requirements are not pre-verified here; do not proceed if the cost or network is unclear.

### B. Deployment and read-only baseline

4. Paste/upload only `experiments/stage6/studio_runtime_probe.py` into the Studio contract editor. Do not deploy Registry, Evaluator, or CaseCourt as part of this probe.
5. Check Studio's detected constructor arguments: expected **none**. Stop if Studio requests unsupported/unexpected values or reports compile/runner incompatibility.
6. If the user independently chooses to approve the deployment fee, deploy this isolated diagnostic. Record screenshot of network/chain ID, deployment transaction identifier, displayed address, status and receipt fields. Do not describe a deployment as finalized unless Studio explicitly exposes that result.
7. Call read-only `get_probe_state()`. Expected fresh state has `probe_count == 0` and `last_event == "DEPLOYED"` (inspect exact returned object). Save the response. If it differs, stop and retain transaction/trace evidence.

### C. Optional transaction-context write

8. Only after the user explicitly decides to incur a write fee, call `record_transaction_context("PROBE-CONTEXT-01")`. Record transaction ID, every exposed status transition, receipt/execution result, and subsequent `get_probe_state()` response.
9. Confirm the stored chain ID matches `61999`. Record the datetime exactly as returned and label it transaction-context time, not source publication time. If sender/origin or contract address is unavailable, record it as unavailable; do not infer it.

### D. Optional AI / Equivalence Principle write

10. Only with separate user approval of the shown fee, call `run_ai_equivalence_probe` once with a new fictional ID and a short, non-sensitive fictional packet. Record the complete exposed transaction ID, execution status, receipt/trace, result, and validator information.
11. Check that the validator comparison covers the classification and decision-bearing fields described in source, not JSON validity alone. An accepted result means the runtime accepted that equivalence execution; it does not prove legal correctness, source truth, or transaction finality.

### E. Optional failure-path writes

12. After reviewing cost and only with user approval, call `run_expected_failure_probe` once. Expected: failed execution and unchanged probe state. Record the exact failure label/text and a post-failure read. Do not retry if the lifecycle/result is ambiguous.
13. If separately approved, call `run_forced_disagreement_probe` once. Expected: rejection/failure and unchanged state. If it succeeds, remains pending beyond the displayed lifecycle, or Studio does not expose the execution outcome, stop; preserve the transaction and trace. Do not retry automatically.

### F. Lifecycle, cost and collected evidence

For every transaction, preserve screenshots or exported UI evidence (redact account details as desired, never expose secrets) of:

- selected network label and chain ID;
- fee quote/fee paid and currency/units as shown;
- deployment address and deployment transaction ID;
- method/fictional arguments (no sensitive values);
- submitted/pending/accepted/nonfinal/finalized/failed labels and timestamps exactly as Studio presents them;
- execution success/failure field, receipt, trace and validator fields if available;
- readback before and after success/failure.

Do not collapse **accepted** into **finalized**. If a field is absent or status is ambiguous, report it as unknown. A failed execution's UI label alone does not prove rollback; compare authoritative readback and retain the trace.

## Stop conditions

- Chain ID is not exactly `61999`, network name is ambiguous, or Studio indicates an unverified environment.
- Studio requests a private key outside the normal wallet signing UI, unusual permissions, or wallet configuration change.
- Fee/quote is missing, unexpected, or not acceptable to the user.
- Contract needs unexpected constructor values, runner/API incompatibility is reported, or transaction result/finality is unclear.
- An expected-rejection path succeeds or state changes after failure.
- Any transaction remains unknown/pending; preserve evidence and do not automatically retry.

## Readiness boundary

The source is **prepared for manual inspection**, not proven browser-deployable. It has passed Direct Mode and cached GenVM lint. There has been no deployment, transaction, live AI call, real validator disagreement, rollback proof, finality observation, or fee measurement. This plan is a diagnostic only; CaseCourt production deployment remains **NO-GO** until stable runner/finality/cost gates are satisfied.

## Stage 8 readiness update (2026-10-14)

Installed toolchain versions, cached runner findings, read-only RPC results, and remaining evidence gaps are recorded in `V2_GENVM_COMPATIBILITY_MATRIX.md` and `V2_RUNTIME_INTEGRATION_RESULTS.md`. The local identity smoke test reached the default endpoint `http://127.0.0.1:4000/api` and got connection refused; the public read-only identity request had no response. No contract was deployed.

### First user screenshot for any Studio follow-up

Before wallet connection, the user should open `https://studio.genlayer.com`, expand the environment/network details, select only the stable **Studionet** environment if it explicitly shows chain ID `61999`, and provide a screenshot containing that environment label and chain ID together. Redact account/personal details. Do not include secrets or signing prompts. If the UI does not show both values, stop and report that; do not infer the network from the URL alone.

The next deployment candidate, only after separate approval of the exact deployment fee, is the isolated `StudioRuntimeProbe` in `experiments/stage6/studio_runtime_probe.py`. Start with its read-only `get_probe_state()` call. Each subsequent transaction-context, AI/Equivalence, forced disagreement, or expected-failure write requires its own cost approval. The Registry, Evaluator, and CaseCourt are not first-probe candidates. Local cross-contract tests likewise remain disabled unless the active RPC is loopback localnet and a read-only preflight returns exactly `61127`.

