# PrecedentOS 2.0 — Stage 8 Runtime and Integration Results

**Date:** 2026-10-14
**Baseline:** `05ada7f14f96a3f248d5aa8d102c8b6fc29cf9c4`
**Outcome:** isolated runtime integration is **BLOCKED**; local tests and schema checks passed.

## Environment checks

- The GenLayer test plugin's configured default was `localnet`, RPC `http://127.0.0.1:4000/api`. A bounded read-only local identity check was run using:

  ```powershell
  $env:PRECEDENTOS_RUN_LOCALNET_SMOKE = '1'
  python scripts/run_tests_safe.py -- tests/integration/test_localnet_identity.py
  ```

  Result: **failed before any transaction**. The exact socket error was `[WinError 10061] No connection could be made because the target machine actively refused it` at `127.0.0.1:4000`. The expected chain ID `61127` was not returned. No runtime service was started.
- One bounded read-only public Studionet `eth_chainId` request to `https://studio.genlayer.com/api` was attempted with an 8-second abort timeout. Node returned exactly `TypeError: fetch failed`; there was no HTTP or JSON-RPC response. No repeat probe was made. This is a local request failure, not evidence about Studionet availability or chain identity.
- A bounded read-only GenLayer CLI version/network-info command produced no output and was interrupted. The globally installed package inventory independently reports CLI `0.40.0-rc.3`. No CLI profile or persistent configuration was changed.
- The read-only process/port inventory command returned no matching output and exit code `1`; that command alone is inconclusive. The explicit RPC identity test's connection refusal establishes that the configured local RPC endpoint was not accepting connections at the time. Docker was not queried or started.

## Cross-contract test preparation

The opt-in test module `tests/integration/test_registry_cross_contract_view.py` contains isolated Registry, Evaluator, and CaseCourt scenarios. It covers Registry registration/read/missing/duplicate behavior; Evaluator missing/existing lookup, digest mismatch, and replay; and CaseCourt case/evidence binding, missing records, locked-state rejection, replay, wrong-target behavior, and readback. The Evaluator AI and CaseCourt write scenarios have independent opt-in flags. Their `.transact()` paths are cost-bearing and were not enabled.

Stage 8 added a fail-closed preflight immediately before the first deployment in that test. When the opt-in flag `PRECEDENTOS_RUN_LOCAL_INTEGRATION=1` is supplied, it now requires the GenLayer Test active network name `localnet`, a loopback HTTP RPC URL, and a successful `eth_chainId == 61127` response before creating a contract factory or deploying. This prevents an altered test profile from silently directing the integration test at Studionet or another remote chain. The test was **not** run in deploy-enabled mode.

Isolated caller contracts invoke `gl.get_contract_at(target).view()` for Registry, Evaluator, and CaseCourt view methods. This is a prepared test path, not proof that contract-to-contract reads execute on GenVM. Production contracts do not currently treat caller-supplied IDs as Registry-authenticated.

## What was actually tested

- 232 Python tests passed; 4 opt-in environment/deployment tests skipped in the protected full suite. The two localnet preflight rejection tests passed as part of that run.
- Two `StudioRuntimeProbe` tests passed under Direct Mode. LLM output, validator response, transaction context, and rollback behavior are harness-simulated; none is runtime evidence.
- Cached GenVM lint/schema validation passed for Registry, Evaluator, CaseCourt, StudioRuntimeProbe, and the three isolated caller test contracts. This inspects code/schema using a cached SDK bundle and does not deploy or execute them.
- Frontend tests validate SDK adapter behavior with a mocked GenLayerJS client and provider. No wallet signature or network write was made.

## Not verified

No local or hosted contract deployment; cross-contract read or authorization; real model request; validator vote/disagreement; accepted transaction; finalized receipt; failed execution rollback; transaction-context timestamp; child transaction; fee; or Studionet write occurred. The exact stable runner and native chain lifecycle remain unknown. See `V2_GENVM_COMPATIBILITY_MATRIX.md` and `V2_TRANSACTION_FINALITY_EVIDENCE.md`.

## Next controlled proof

1. User opens official stable Studio and provides the first screenshot described in `V2_STAGE_9_DEPLOYMENT_PREREQUISITES.md` showing the selected Studionet environment and chain ID `61999`, before connecting a wallet.
2. Verify that the UI and current official release evidence identify stable Studionet, not Studio-dev. Resolve stable runner and displayed fee requirements.
3. With separate explicit approval for the diagnostic deployment and its displayed fee, user may deploy **only** `StudioRuntimeProbe`. The isolated probe is not production CaseCourt and must not be described as a production deployment.
4. Capture deploy status/address and perform read-only `get_probe_state()` first. A later write/AI/forced-disagreement probe requires a separate explicit approval for each cost-bearing call.
5. Cross-contract deployment and view proof remains a separate, explicit localnet operation after local services exist and the guarded test reports chain `61127`.

No manual Studio action is assumed to have occurred. This report contains no fabricated chain identity, receipt, address, fee, timestamp, or validator result.
