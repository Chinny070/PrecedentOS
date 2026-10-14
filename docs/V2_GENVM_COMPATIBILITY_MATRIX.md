# PrecedentOS 2.0 — GenVM and Toolchain Compatibility Matrix

**Verification date:** 2026-10-14
**Repository baseline:** `05ada7f14f96a3f248d5aa8d102c8b6fc29cf9c4`
**Target:** stable Studionet, chain ID `61999`
**Separate environments:** Studio-dev `61997`; local Studio `61127` by default.

## Findings

| Component | Installed or pinned evidence | Compatibility conclusion |
|---|---|---|
| GenLayer CLI | Global npm inventory reports `0.40.0-rc.3`. Its read-only `genlayer --version` / network-info invocation did not return output within the bounded attempt and was interrupted. | Version known from package inventory; no authenticated endpoint or runtime identity was obtained. CLI `0.40` belongs to the v0.6 release-candidate tooling family in current official migration guidance; that does not establish stable Studionet compatibility. |
| `genlayer-js` | Frontend lock/pin and installed package are `1.1.8`. Direct package import returned `{name: "Genlayer Studio Network", id: 61999, rpc: "https://studio.genlayer.com/api"}` for `studionet`. The package's own declarations expose `readContract`, `writeContract`, `getTransaction`, and `waitForTransactionReceipt({hash,status,interval,retries})`. | The app uses the actual pinned SDK surface and its chain definition agrees with the documented stable identity. The RPC itself did not return a response from this host. Current SDK documentation that uses newer lifecycle option names must not be copied into this pinned client without a version-specific change. |
| Python Intelligent Contract SDK | Installed distribution `genlayer-py 0.16.3`. | Installed API version is recorded; this inspection did not authenticate it against the stable Studionet runner. Current v0.6 migration documentation names `genlayer-py 0.19 RC` for Studio-dev, not as a stable Studionet requirement. |
| GenLayer test package | Installed `genlayer-test 0.29.2`; pytest plugin resolves the configured test network and reports default RPC `http://127.0.0.1:4000/api`, network `localnet`. | Direct Mode is locally available. Studio Mode is an opt-in RPC test and was not run with deployment enabled. Version compatibility with stable is unresolved. |
| GenVM linter | Installed `genvm-linter 0.11.1rc2`; cached bundles are `v0.6.0-rc9` and `v0.6.0-rc6`. | Cache permits local schema/SDK validation against RC9; this is not a stable Studionet runner attestation. No download or upgrade was performed. |
| Contract Python runner header | Registry, Evaluator, CaseCourt, and `StudioRuntimeProbe` all pin `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. | All four contracts validate against the pinned dependency from the cached lint bundle. Linter reports another runner hash, `babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0`, as newer. Neither hash was authoritatively tied to stable Studionet's selected runtime. |
| Stable fee model | No stable fee quote/profile or signed transaction was requested. The pinned JS `writeContract` declaration accepts `value`; the v0.6 RC documentation describes fee-aware tooling. | Stable deployment and execution fee fields, reservation rules, and required fee API remain unverified. Do not infer stable behavior from Studio-dev RC instructions. |

## Local schema and compile validation

The following command used only the already cached RC9 artifact. Setting these variables was process-local; no packages or artifacts were downloaded:

```powershell
$env:GENVM_VERSION = 'v0.6.0-rc9'
$env:GENVM_SOURCE_MODE = 'release'
genvm-lint check contracts/precedent_registry.py --json
genvm-lint check contracts/precedent_evaluator.py --json
genvm-lint check contracts/case_court.py --json
genvm-lint check experiments/stage6/studio_runtime_probe.py --json
```

All four returned `ok: true` for the linter and schema validator. Extracted public surfaces:

- **PrecedentRegistry:** zero constructor args; `register_precedent(record_id, evidence_digest, schema_version, jurisdiction, decision_date, category)` is one non-readonly, nonpayable method; `get_precedent(record_id)`, `has_precedent(record_id)`, and `get_registration_count()` are read-only.
- **PrecedentEvaluator:** zero constructor args; `evaluate_pair(evaluation_id, record_a_id, record_a_digest, record_b_id, record_b_digest, evidence_packet_json, evidence_schema_version, criteria_version, criteria)` is a write; `get_evaluation(evaluation_id)` and `has_evaluation(evaluation_id)` are read-only.
- **CaseCourt:** zero constructor args; schema validator reports 50 public methods (22 views, 28 writes). Cached schema validation passed; that does not exercise runtime storage or transactions.
- **StudioRuntimeProbe:** zero constructor args; schema validator reports 5 public methods (1 view, 4 writes). It remains the only proposed Studio deployment candidate.
- **Integration callers:** Registry caller schema has 2 views and 1 constructor argument; Evaluator caller schema has 2 views and 1 constructor argument; CaseCourt caller schema has 4 views and 1 constructor argument. All three test-only callers passed cached validation.

For each contract the validator emitted informational warning `I200`: a newer `py-genlayer` runner is available (`babwp9…`). This is a version comparison in the local cached lint bundle, not evidence that the newer hash is deployed on stable Studionet.

## Environment separation

Current official documentation identifies stable Studionet at `studio.genlayer.com` / chain `61999`, Studio-dev at `studio-dev.genlayer.com` / `61997`, and local Studio at `localhost:8080` / `61127` by default. The v0.6 migration guide describes an RC family (GenLayerJS 2.0 RC, Python SDK 0.19 RC, CLI 0.40 RC and matching fee tools) for Studio-dev. It explicitly distinguishes that preview from stable Studionet. Do not combine the RC chain definition with stable network identity.

## Evidence status

- **IMPLEMENTED:** contract and frontend source are present.
- **LOCALLY TESTED:** Direct Mode, frontend tests, static lint, and cached SDK schema extraction completed as listed in `V2_STAGE_8_REPORT.md`.
- **RUNTIME VERIFIED:** not established for any production contract in this stage.
- **LIVE STUDIONET VERIFIED:** not established in this stage.
- **BLOCKED:** exact stable runner, runtime execution, fee policy, cross-contract reads, real validator result, and finality.
- **NOT STARTED:** no Stage 8 local or live deployment and no signed transaction.

## Official references reviewed

- [GenLayer Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- [Consensus v0.6 migration and compatible release family](https://docs.genlayer.com/developers/consensus-v06-migration)
- [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [GenLayer CLI source and release history](https://github.com/genlayerlabs/genlayer-cli)
- [GenLayerJS source](https://github.com/genlayerlabs/genlayer-js)

**Conclusion:** local compilation/schema compatibility is established against an available RC9 artifact. Compatibility with the exact stable Studionet runner is **BLOCKED / unresolved**.
