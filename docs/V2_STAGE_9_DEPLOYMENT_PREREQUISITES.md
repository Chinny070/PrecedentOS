# PrecedentOS 2.0 — Stage 9 Deployment Prerequisites

**Status:** **NO-GO for production deployment preparation.** The source is locally tested, but the exact stable runtime/runner and fee requirements are not established. No contract address exists in this evidence set.

## Open gates before any deployment

1. **Identity:** Verify the browser Studio is stable Studionet, chain ID `61999`, using the environment selector or network details. Studio-dev `61997` and local Studio `61127` are different environments.
2. **Runtime compatibility:** Obtain authoritative stable release evidence naming the GenVM/Python runner used by stable Studionet. Compare the runner with the contracts' `py-genlayer` pin. The cached linter's RC9 bundle and its newer runner warning do not satisfy this gate.
3. **Fee disclosure:** Read the current Studio deployment quote/fee units and confirm the supported fee model for stable. No fee estimate or balance is asserted by this project. The user must approve the specific deployment and cost before any signature.
4. **Source identity:** Review the exact commit and SHA-256 of the isolated diagnostic. Do not begin with Registry, Evaluator, or CaseCourt.
5. **Wallet:** Only use the user's normal Studio wallet flow. Never provide private keys or seed phrases. Connecting a wallet alone is not authorization to sign.
6. **Execution evidence:** The UI must expose the submitted hash, outcome/execution result, status/finality, and read-only state. Capture actual values; never substitute local fixtures.
7. **Governance policy:** Resolve reviewer authority and appeals liveness, freeze recovery, case deadlines, independent review, evidence authenticity, and user-facing failure handling before deploying production CaseCourt.
8. **Web Render:** Keep `WEB_RENDER_RUNTIME_ENABLED = False` until redirects, DNS/private address protections, response-size/timeout bounds, outbound access, cost caps, and validator comparison are verified on the exact runtime.

## First candidate: isolated `StudioRuntimeProbe`

This diagnostic is the only proposed first deployment. It has no constructor arguments according to cached schema validation, and it is isolated from production storage and contract behavior. A successful deployment would verify only the exact operation evidenced in the Studio receipt; it would not by itself prove Registry/Evaluator/CaseCourt correctness, stable fee sustainability, or legal correctness.

### What the user should do first

1. Open `https://studio.genlayer.com` in the ordinary browser. Do **not** connect a wallet yet.
2. Open the environment/network selector or its details panel. Select **Studionet** only if it is explicitly identified as stable and displays chain ID **61999**. Do not select Studio-dev or localnet.
3. Take the first screenshot showing the Studio page, selected environment label, and chain ID/network details together. Crop or redact account/personal details. The screenshot should not include any secret, seed phrase, private key, QR recovery code, or signing prompt.
4. Share that screenshot for review. If Studio does not visibly expose both the stable environment and `61999`, stop and report that exact limitation rather than guessing.

No Studio screenshot was available in this Stage 8 workspace, and this procedure does not imply the user has deployed or signed anything.

## After identity review: user-controlled probe flow

Proceed only after a separate, explicit approval that names the probe deployment and accepts the exact fee shown by Studio.

1. Open the approved `experiments/stage6/studio_runtime_probe.py` source in Studio.
2. Confirm Studio reports no constructor arguments and no compile/runner error.
3. Before signing, record the displayed fee/units. If absent or unclear, stop.
4. If the user chooses to approve the deployment, capture the actual deployment hash, address, status, execution outcome, and receipt.
5. Call only the read-only `get_probe_state()` first. Preserve the exact response.
6. Do not run transaction-context, AI/Equivalence, forced disagreement, expected failure, cross-contract, or Web Render calls until separately approved for their cost and effects.
7. Do not call a status finalized unless the source UI/receipt says so. For writes, distinguish finality from `FINISHED_WITH_RETURN` success and perform an authoritative readback.

## Later production ordering

Only after the isolated probe provides adequate runner/lifecycle evidence and stable fee compatibility is documented should the next separately approved scope consider Registry deployment, then Evaluator integration. Cross-contract reads require a dedicated two-contract runtime proof. CaseCourt remains **not approved for deployment** until appeal/freeze liveness and reviewer governance policy gates are resolved. Web Render remains disabled until its security/runtime gates pass.

## Reproducible local preflight

The local integration test now checks the exact GenLayer Test active configuration before its first deployment: network name must be `localnet`, RPC must be loopback HTTP, and a read-only `eth_chainId` call must return `61127`. The test exits before factory/deployment if any condition fails. Its deploy flag is not enabled by the standard test suite:

```powershell
# Read-only identity test only
$env:PRECEDENTOS_RUN_LOCALNET_SMOKE = '1'
python scripts/run_tests_safe.py -- tests/integration/test_localnet_identity.py

# Deployment-enabled local test: DO NOT run without separate approval
$env:PRECEDENTOS_RUN_LOCAL_INTEGRATION = '1'
python scripts/run_tests_safe.py -- tests/integration/test_registry_cross_contract_view.py -k registry_to_caller
```

The same file contains two additional deployment/transaction scenarios; each requires separate approval after the isolated runtime probe and stable cost requirements are reviewed:

```powershell
# Deploys Evaluator and a caller, sends an AI/Equivalence transaction, then tests digest mismatch/replay.
$env:PRECEDENTOS_RUN_LOCAL_EVALUATOR_INTEGRATION = '1'
$env:PRECEDENTOS_RUN_LOCAL_INTEGRATION = '0'
$env:PRECEDENTOS_RUN_LOCAL_CASECOURT_INTEGRATION = '0'
python scripts/run_tests_safe.py -- tests/integration/test_registry_cross_contract_view.py -k evaluator_read

# Deploys CaseCourt and a caller, then writes a fictional case/evidence, lock, and rejection/replay checks.
$env:PRECEDENTOS_RUN_LOCAL_CASECOURT_INTEGRATION = '1'
$env:PRECEDENTOS_RUN_LOCAL_INTEGRATION = '0'
$env:PRECEDENTOS_RUN_LOCAL_EVALUATOR_INTEGRATION = '0'
python scripts/run_tests_safe.py -- tests/integration/test_registry_cross_contract_view.py -k case_court_identity
```

These flags perform cost-bearing transactions on a real local runtime if enabled; do not set them without separate approval. All three paths perform the `localnet`/loopback/`61127` identity check before deploying. In this Stage 8 run the read-only local test observed connection refusal at `127.0.0.1:4000`; all deployment-enabled commands were left disabled.
