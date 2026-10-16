# PrecedentOS 2.0 Deployment Manifest

This manifest records only user-supplied deployment and transaction evidence. A blank or pending item is not inferred from another transaction. Addresses, hashes, status and results are not independently fetched unless explicitly stated.

## Target

- Intended network: stable GenLayer Studionet
- Expected chain ID: `61999`
- Studio network selector: user confirmed it shows **stable Studionet, chain ID `61999`** while performing the Registry follow-up reads. The original transaction detail excerpt itself did not contain a chain ID.

## PrecedentRegistry

- Status: **single-record registration and readback smoke test reported successful by the user; independent retrieval and source/bytecode verification remain unavailable**
- Address (`To` of the reported call): `0xd19FfF91FaB33932A70CB9e2927159a8F103945C`
- Deployment transaction: **not supplied**
- Deployed source/bytecode verification: **not supplied**
- Registration transaction: `0xc4775a389916cf1b5a13f233bfecbc9ddd7ed3f126b1e58ca98baa6c08de6497`
- Transaction evidence provenance: **user-provided Explorer details; independent retrieval attempt was inaccessible**
- Reported outcome: **FINALIZED; consensus Accepted; GenVM SUCCESS; result Return; return value `null`**
- Reported sender: `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`
- Reported call: `register_precedent`
- Reported arguments:

| Position | Name | Value |
|---:|---|---|
| 0 | `record_id` | `FICT-STUDIONET-001` |
| 1 | `evidence_digest` | `250aeca6a5a10722549b4aeb3fafb292d6531033dcc0bf5a5a612fdf893ffa04` |
| 2 | `schema_version` | `1` |
| 3 | `jurisdiction` | `Fictional North District` |
| 4 | `decision_date` | `2030-01-15` |
| 5 | `category` | `Fictional permit dispute` |

The digest is the SHA-256 of the fictional UTF-8 text previously supplied for this test. The Registry validates its lowercase 64-character hexadecimal format but does not independently retrieve or hash source evidence.

- Reported call value: `0 GEN` (not a network-fee measurement)
- Fee: **not supplied**
- User-supplied read-only results: `get_precedent("FICT-STUDIONET-001")` returned the full record shown above; `has_precedent("FICT-STUDIONET-001")` returned `true`; `get_registration_count()` returned `1`. The stored submitter matches the reported transaction sender.
- Reported `get_precedent` response:

```json
{
  "category": "Fictional permit dispute",
  "decision_date": "2030-01-15",
  "evidence_digest": "250aeca6a5a10722549b4aeb3fafb292d6531033dcc0bf5a5a612fdf893ffa04",
  "jurisdiction": "Fictional North District",
  "record_id": "FICT-STUDIONET-001",
  "registration_sequence": "1",
  "schema_version": "1",
  "submitter": "0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b"
}
```

- Other reported view results: `has_precedent(...)` → `true`; `get_registration_count()` → `1`.
- Registry smoke-test result: **PASS for the one reported registration/readback on the Studio environment the user confirmed as Studionet 61999.** Evidence remains user-provided; the independent Explorer/RPC retrieval attempt was inaccessible. Deployment transaction/hash, bytecode/source verification, and fee remain unprovided. Duplicate rejection and unchanged state after rejection are not tested live.

## PrecedentEvaluator first evaluation attempt

- Production source to upload: `contracts/precedent_evaluator.py`; zero-argument constructor.
- First positive fictional test: `evaluate_pair` using evaluation ID `EVAL-STUDIONET-PERMIT-001`, record IDs `FICT-PERMIT-0001` and `FICT-PERMIT-0002`, evidence schema `1`, criteria version `1`, and the `unexplained_conflict` passages in `tests/fixtures/fictional_evaluations.json`.
- Exact passage SHA-256 digests (UTF-8): record A `d6e71d65d4bf32f69098c1274535e5d70ddc2ac10a1e214f4ec5ac7838483176`; record B `aef80225c38056e34445afb6f2505bcb3f23c8110aa34181b29c73db107e8079`.
- Evidence packet JSON string: `{"precedent_a":"A fictional panel held that a permit allowed a temporary sign on a public walkway and that this placement complied with the stated walkway rule. No exception or different fact was identified.","precedent_b":"A fictional panel held that a permit allowed a temporary sign on the same type of public walkway and that this placement violated the same stated walkway rule. No exception or different fact was identified."}`
- Criteria: `Compare the stated issue, rule, material facts, outcomes, and any expressly stated exception. Treat a difference as a possible contradiction only if it remains unexplained by the supplied facts. Use no outside assumptions.`
- Reported transaction: `0x050d94e373687dc22a26e08d2c3f3561d37dd1dbba61d0b640913c6e57f940a7`.
- User-provided result: **FINALIZED; consensus Undetermined; rotation count 3; initial validators 5; GenVM SUCCESS/Return; return value `null`**. This is **not an accepted or successful evaluation**. The leader execution output does not prove Equivalence Principle acceptance.
- The Explorer-rendered Equivalence output includes `classification=possible_contradiction`, `same_material_issue=true`, `outcomes_differ=true`, `potential_contradiction=true`, but `material_similarity=false`, with nonempty contradictions. The output also includes reasoning that describes the facts as identical. This field combination is suspiciously inconsistent for this evidence; individual validator votes were not supplied, so it does not establish the reason consensus was Undetermined.
- User-supplied post-transaction readback: `has_evaluation("EVAL-STUDIONET-PERMIT-001")` returned `false`; `get_evaluation_count()` returned `0`. This confirms the reported Undetermined attempt did not persist that evaluation. `get_evaluation(...)` was not separately queried.
- **Source hardening made after this result:** the local validator now requires `material_similarity=true` when `potential_contradiction=true`, and a Direct Mode regression proves the inconsistent leader result reverts before persistence. This is not the bytecode at the already-deployed address; any runtime test of the hardened source requires a separate deployment and address.
- Evaluator IDs/digests are caller-supplied and are **not** proof of Registry membership; cross-contract verification is not implemented or claimed. Do not repeat this AI transaction on the existing deployment until its state is read back; any runtime check of the hardened source requires a new user-operated deployment and separate review of the displayed fee.
- After a future accepted successful finalized execution on a deployment of the hardened source, read back `get_evaluation(...)`, `has_evaluation(...)`, and `get_evaluation_count()`. Then use separate fictional negative checks (e.g. insufficient evidence, mismatched digest, and duplicate evaluation ID) only after reviewing each displayed fee.

## PrecedentEvaluator

- Status: **deployment shown in a user-provided Studio Explorer screenshot; screenshot first showed `ACCEPTED`, and the user subsequently reports it is now `FINALIZED`**
- Address shown: `0x6c1571C445D12ECeD90CAddE677bD0ee9694487D`
- Deployment transaction shown in abbreviated form only: `0x028b4d3a...2f1f8a96`; full hash not supplied
- Screenshot reports deployment method `constructor`, GenVM `SUCCESS`, consensus `Accepted`; the later finality update is user-reported without a new screenshot. The screenshot does not show the chain ID.
- Source/bytecode equivalence to `contracts/precedent_evaluator.py`: **not independently verified**
- First positive AI/Equivalence attempt ended Undetermined; user-reported state readback confirms no record persisted. A new deployment of the hardened source is now reported below. Do not treat caller-supplied precedent IDs as verified Registry references.

### Hardened Evaluator deployment

- Address shown: `0x5DEeD1A620e9ecd70b1Ae4e6f0F130CF9D272666` (canonical address transcribed from the successful call's full `To` field; this corrects the earlier screenshot transcription)
- User-provided Studio Explorer screenshot: constructor deployment **FINALIZED**, consensus **Accepted**, GenVM **SUCCESS**; transaction hash shown abbreviated as `0x69e2775a...a72d42d3`. Its address text was transcribed one character short earlier; the full call `To` address above is used here.
- Screenshot does not show the chain ID or source/bytecode. The user was asked to deploy the hardened source, but deployed source equivalence remains **unverified**.

### Matching-case AI evaluation — user-supplied transaction

- Transaction: `0x8f7a58bf3de0cbb9c6a1578eae9dcf7967825b50babd02dd00d930e2e4941631`
- `To`: `0x5DEeD1A620e9ecd70b1Ae4e6f0F130CF9D272666`; `From`: `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`
- Reported result: **FINALIZED; consensus Accepted; GenVM SUCCESS/Return; rotation count 0; initial validators 5; return `null`**.
- Method and inputs match `evaluate_pair` for `EVAL-STUDIONET-MATCH-001` recorded above.
- Explorer-rendered Equivalence output reports `classification=material_similarity`, `same_material_issue=true`, `evidence_sufficient=true`, `outcomes_differ=false`, `material_similarity=true`, `potential_contradiction=false`, empty differences/contradictions, and four similarity findings. This is a user-reported accepted positive AI/Equivalence result, not a legal correctness claim.
- User-supplied `get_evaluation("EVAL-STUDIONET-MATCH-001")` readback returns the matching evaluation ID, `material_similarity`, `evidence_sufficient=true`, the expected decision fields, schema and criteria versions `1`, both submitted record IDs/digests, and input commitment `b32b5d2e0e9089a4685c0e30bce0b75779583b4f19d83a9967d5797f6ca37635`. This confirms persisted record content as reported by the user; the readback is not independently retrieved, and chain identity for this call remains unshown.
- User-supplied readbacks: `has_evaluation("EVAL-STUDIONET-MATCH-001")` → `true`; `get_evaluation_count()` → `1`.

### Controlled rejected digest test — user-supplied

- Transaction: `0xd1d6205c107680e57fe18afafe22b98bf35594cb690a0a295c0d443ed51d465c`
- Method: `evaluate_pair`; evaluation ID `EVAL-STUDIONET-REJECT-001`; fictional insufficient-information passages; first digest deliberately set to 64 zeroes.
- Reported transaction metadata: **FINALIZED; consensus Accepted; GenVM ERROR; result Rollback**. Error: `first evidence digest does not match submitted passage`.
- Post-call user-supplied readbacks: `has_evaluation("EVAL-STUDIONET-REJECT-001")` → `false`; `get_evaluation_count()` → `1`, unchanged from before the call.
- Result: **deterministic input-validation rejection and unchanged state reported by user**. It is not a successful evaluation, does not exercise validator disagreement, and is not an independently retrieved receipt. The transaction's `0 GEN` value is not a fee measurement.

### Matching fictional evaluation — completed, user-reported

This was submitted on the hardened deployment to avoid the ambiguous conflict case that previously produced Undetermined. The call details and persisted readbacks above are user-reported; they are not independent retrieval. The inputs below match fixture `matching` from `tests/fixtures/fictional_evaluations.json`.

- `evaluation_id`: `EVAL-STUDIONET-MATCH-001`
- `record_a_id`: `FICT-NOISE-0001`
- `record_a_digest`: `1acaca2198b27b5e4512535b6b931448d1138a820c031b781d093537b621599e`
- `record_b_id`: `FICT-NOISE-0002`
- `record_b_digest`: `6049593e171a2a0b4e618cd23c154a6ae988e48513276e4964bef0cb80c89888`
- `evidence_packet_json`: `{"precedent_a":"A fictional panel found that a shop violated a quiet-hours rule by playing amplified music after 22:00. No exception applied.","precedent_b":"A fictional panel found a shop breached the same quiet-hours rule by playing amplified music after 22:00. The record states that no exception applied."}`
- `evidence_schema_version`: `1`
- `criteria_version`: `1`
- `criteria`: `Compare the stated issue, rule, material facts, outcomes, and any expressly stated exception. Treat a difference as a possible contradiction only if it remains unexplained by the supplied facts. Use no outside assumptions.`
- Expected classification to inspect: `material_similarity`. This is a test expectation, not a promised model response or consensus result.
- After execution, count success only with FINALIZED + Accepted + GenVM SUCCESS/Return, then verify `get_evaluation`, `has_evaluation`, and count. These IDs are synthetic caller-supplied references, not authenticated Registry entries.

## CaseCourt

- Status: **user-reported deployment and fictional deterministic Phase A smoke passed on a fresh deployment; conditional GO for the separately approved AI judgment; NO-GO for production governance and appeals**
- Exact source: `contracts/case_court.py`
- Corrected source SHA-256: `d7270713e53108be58b1c6795ba492bdfb1f8d1bf0246b8df26b2efae51f60e9`
- Constructor arguments: **none**. Cached schema validation reports 50 public methods (28 writes, 22 views); the runner/header and cached-lint limitation are documented in `V2_CASECOURT_READINESS.md`.
- User-reported address: `0x3cD927B446265Bf2337A520a508fE963A3da9b72`. Deployment screenshot shows FINALIZED, Accepted, GenVM SUCCESS; deployment hash is abbreviated (`0xab4413e6...6979b20d`). The user identifies the target as stable Studionet `61999`; these screenshots do not themselves show chain ID or prove the uploaded source hash.
- Phase A: user reports `get_case_count()` initially returned `0`; `open_case` transaction `0x9357befb5fb64048a8a8b192af6dcd6b9d994a45c5bda2088503155813ec54fd` was FINALIZED + Accepted + GenVM SUCCESS/Return; `get_case` returned the expected parties, case ID, opening digest, `EVIDENCE_OPEN`, version 1, and zero evidence. `append_evidence` transaction `0x56c434e6348c6d87eda5e08adaf5336a06828c8b001e6dc8c7a7dbfbc1f9e80c` was FINALIZED + Accepted + GenVM SUCCESS/Return; `get_evidence` matched digest/schema/source digest/submitter at case version 2. `lock_evidence` transaction `0x0b32f9e5e03ebaa9ece0d55fe86abc60cb08c6d3deff98c03b34e94baf05c1f8` was FINALIZED + Accepted + GenVM SUCCESS/Return; readback showed `EVIDENCE_LOCKED`, version 3, evidence count 1, and root `49b9695a4f295ab25580193c029231e73a9245144d456011188db4c23517be05`.
- Phase A rejection: stale `lock_evidence` transaction `0xe4b2792a1a619ab9bd79d63dd68814c46c5529d8d5fc42f7686f36ede076c3bf` was FINALIZED + Accepted consensus but GenVM ERROR/Rollback with `stale case version`; subsequent user readback remained version 3, action count 3, and the same evidence root. This is a failed execution with reported unchanged state, not a successful call.
- Evidence provenance: all deployment/call/readback outcomes above are user-supplied Studio/Explorer observations, not independently retrieved. `Value: 0 GEN` does not establish zero fees; no fee quote is recorded.
- The next proposed operation is the fictional AI judgment in `V2_CASECOURT_READINESS.md`, only after the user reviews and separately approves the fee shown in Studio.
- Required test signers: two controlled, distinct wallet addresses (petitioner and respondent); never share keys or seed phrases. A second identity does not establish legal identity or independent reviewer qualifications.
- Production governance blocker: appeal review is performed by the opposing case party, not an independent reviewer. There is no approved reviewer-selection/conflict policy, and appeal freezes can persist indefinitely after failure/disagreement/unavailability. Do not execute Phase C pending policy approval.
- `WEB_RENDER_RUNTIME_ENABLED` remains false.

### CaseCourt Studio deployment and failed first call — user-reported

- Deployment address shown: `0xf1Ab9107180F0b467D03c72eeC8e3bA62757795b`. The screenshot shows FINALIZED, Accepted consensus, and GenVM SUCCESS for deployment. The deployment transaction hash is abbreviated in the screenshot (`0x34e0d140...5c4150fb`), so the full hash and exact uploaded-source identity are not established here. The user has stated the target is stable Studionet `61999`; the screenshot itself does not display chain ID.
- First `open_case` attempt: `0x207235f337d864fef04ea26e7b073447f1e324c75039b5ef559f5b21e9080793`, to the address above. Explorer reports FINALIZED and consensus Accepted, but GenVM ERROR / Contract Error: `AttributeError: 'int' object has no attribute 'as_hex'`. It is a failed execution, not a successful case creation. User readback after the call: `get_case_count()` → `0`.
- The respondent input was the user's valid second-wallet address `0x1Af111b06E6f6A05Bd41572A016318f1356aF85c`; Studio decoded it as an integer. The public parameter in the source was typed `Address`, and the method accessed `.as_hex` directly. The corrected source now accepts a validated hex string and converts it to `Address` at the boundary. See `V2_CASECOURT_READINESS.md` for its SHA-256 and test evidence.
- The current deployed address still runs the prior source and cannot be upgraded by editing. Do not retry `open_case` there. A fresh deployment of the corrected source is required; no new deployment or transaction has been performed by Codex. All transaction/deployment evidence here is user supplied, not independently retrieved.

## Coordinated CLI release — 2026-10-15

All three contracts above were previously deployed one at a time through GenLayer Studio, with evidence transcribed from screenshots. This release instead used the local GenLayer CLI (v0.39.2, `scripts/deploy_studionet.py`), targeting the already-active `studionet` network (chain `61999`), signed by the existing, previously used wallet `my-studionet-wallet` (`0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b`, balance 214.9 GEN before this run). The prior addresses above remain live and historical; the frontend now points at the addresses below.

Every deployment transaction was independently decoded with the pinned GenLayer SDK's own numeric status/result tables (`status=7` FINALIZED, `result=6` MAJORITY_AGREE, leader `execution_result='SUCCESS'`), not a loose text search, after an earlier version of the deploy script's naive `"ERROR"` substring check produced a false positive on the harmless `error_code: null` field for the Registry deployment; this was caught and fixed before the Evaluator/CaseCourt deploys, and the Registry result was independently re-verified against the correct decoded fields.

| Contract | Address | Deployment tx | Source SHA-256 |
|---|---|---|---|
| PrecedentRegistry | `0xbEbfe1087C3395316feCCa1AE7E1Ba48CcCbAF8D` | `0x3c972b8fc51b292c7a186544cb5fd5e3df28c650039d968f52d31cf6577c7280` | `b9905ab567139ab4428960807293a95969908d052ffe794146ff9ab75fb69b6f` |
| PrecedentEvaluator | `0xA712Cdad9834fCBe63f64013e61d8d089f34D6EC` | `0xbfc3bc77a2ca3a8999790215cdcd28b552d8ca313b201e2ee7ec77924e68f358` | `167d9710de4a602fea6f123a0187c61514e4e7e6b0323363d70e169a14441a9f` |
| CaseCourt | `0xE084a96fbF8B42c7A9885fFABBa3b6C4076772C8` | `0x3b80293d146fc265fee2ac5e26fb4b062dd6cb1b7cf60700fe0613ef03c43809` | `fd6b43bb643daab20953edc2e42b5495ae648704fe564e9834f3830a33c01e8d` |

All three were FINALIZED with MAJORITY_AGREE and a successful leader execution. Source identity was independently verified, not merely assumed from a successful deploy command: `genlayer code <address>` was fetched for every contract and diffed line-for-line against the exact local reviewed file; all three are byte-identical.

Read-only post-deploy smoke tests: `get_registration_count()` → `0`, `get_evaluation_count()` → `0`, `get_case_count()` → `0`, consistent with fresh deployments with no prior state.

Fee cost: `genlayer account` reported the identical balance (`214.945289999999999977 GEN`) before and after this three-contract deployment batch. This is reported exactly as observed; it is not independently explained here (it may reflect a Studio fee-accounting model not deducted from this balance view, or a display that does not refresh fee burn), and should not be read as proof that deployment was free. The installed CLI's `genlayer estimate-fees` could not produce a prior estimate (`client.estimateTransactionFees is not a function`).

Full raw deployment/receipt output and manifest: `docs/V2_DEPLOYMENT_MANIFEST_STUDIONET_RUN.json` (git-tracked). `frontend/.env` (local, gitignored) was generated with these three addresses by the deploy script.

### CLI `write`/`call` argument-encoding limitation — discovered during live demo, 2026-10-15

Two live `genlayer write` attempts against the new deployments failed, both FINALIZED with consensus **MAJORITY_AGREE** but GenVM **execution_result: ERROR** on every validator (a deterministic rejection, not model disagreement):

- `evaluate_pair` on the new Evaluator (`0xA712Cdad9834fCBe63f64013e61d8d089f34D6EC`), tx `0x077df3a3e054132655ea043cf712ee4382c2389c4ef332b90930736787f6c430`. `get_evaluation("EVAL-CLI-DEMO-001")` confirmed empty afterward — no state mutated.
- `open_case` on the new CaseCourt (`0xE084a96fbF8B42c7A9885fFABBa3b6C4076772C8`), tx `0x8bd067d2e1f187227a9cbf975f3d38244c3e32bfcf64efbe91b33a4daff63493`. `get_case_count()` confirmed `0` afterward — no state mutated.

Root cause, confirmed by reading the installed CLI's own source (`genlayer/dist/index.js`, function `parseArg`): any `--args` value is first run through `JSON.parse`; if it parses as an object or array, the CLI silently re-encodes it as a structured calldata value instead of the plain string the contract parameter declares. This fires on two common shapes:
1. Any JSON-looking argument (e.g. `evaluate_pair`'s or `adjudicate_case`'s `evidence_packet_json`, which is deliberately `{"precedent_a": ..., "precedent_b": ...}`) gets coerced to a structured dict instead of staying a `str`.
2. Any `0x`-prefixed 40-hex-character argument (e.g. a respondent address passed to a `str`-typed parameter, by design, per the `open_case` address-input fix earlier in this document) gets coerced to a structured `Address` instead of staying a `str`.

No string-escaping workaround exists within the CLI's own `--args` parser: the non-object fallback path (`parseScalar`) returns the original, unprocessed argument text rather than the JSON-unescaped value, so there is no way to submit a value that both looks like valid JSON/an address and arrives as a plain string. This is a genuine CLI tooling limitation, not a contract defect — both failed transactions are consistent with the contract's own `isinstance(..., str)` / exact-length validation correctly and deterministically rejecting a wrongly-typed argument.

**Workaround used for this release's live demo:** GenLayer Studio's UI does not have this bug (it composes calldata directly from typed form fields, not a JSON-sniffing string parser), so any CaseCourt write that needs a JSON evidence packet or a `str`-typed address argument should go through Studio, exactly as the original Phase A/judgment work earlier in this document did. Plain-scalar-only CLI writes (no address or JSON-shaped argument) are unaffected and were not retried blindly to avoid spending further fees on a known-bad path.

## CaseCourt redeployment — appeal freeze timeout, 2026-10-16

The previous CaseCourt address (`0xE084a96fbF8B42c7A9885fFABBa3b6C4076772C8`) remains live and historical, including its persisted `FICT-CASE-STUDIO-CLI-001` case and judgment. It does **not** have the appeal-freeze timeout fix below; contract code cannot be patched in place, only superseded by a fresh deployment.

**New CaseCourt address:** `0xE1BA9dEf39A970d5dd3F73035Ac80a9e9314a5C9`
**Deployment tx:** `0xb1e02c9adae1da1e6e82b8d28ed245babbe5352ac960b9160a9d01a35bcd076f` — FINALIZED, `result_name=MAJORITY_AGREE` (3 real `AGREE` votes, 2 validators correctly idled once quorum was reached — the `CONSENSUS_VALIDATOR_QUORUM_REACHED` entries in the raw receipt are that benign idle marker, not execution failures).
**Source SHA-256:** `5aebbf1753e04d3c6bdde34b39a9377a3aba23fabee95bb989ddc0cba55ffd33`
**Source identity:** independently verified — `genlayer code` fetched from the deployed address and diffed line-for-line against the local `contracts/case_court.py`; byte-identical (4029/4029 lines).
**Smoke test:** `get_case_count()` → `0`, consistent with a fresh deployment.

What changed versus the prior CaseCourt source: `lapse_stalled_appeal` (a bounded, non-decisional timeout for a stalled appeal freeze) and the mutual-reviewer-approval appeal governance from the earlier commit on this branch. No other behavior changed. The frontend's `VITE_GENLAYER_CASECOURT_ADDRESS` (local `.env` and the Vercel production environment variable) now points at this new address; Registry and Evaluator are unchanged and still point at their existing addresses.

## Later user-reported CaseCourt deployment — 2026-10-16

This later Studio deployment supersedes earlier CaseCourt candidates for the user's manual demonstration, but is **not** a deployment of the current working tree after the release changes in progress here.

- Address: `0x7B6DA3Fe9CF8D4a7F81Ad760ADb45c37D99211EC`.
- Deployment receipt: user screenshot showed a finalized accepted deployment with GenVM success; the transaction was abbreviated as `0x548b6613...78d4e088`, so the full deployment hash is not recorded here.
- User-reported `open_case` on `FICT-CASE-STUDIO-004`: `0x8e38c30ebfa33bd17cbbd97006887b96b202d0cd51ec833f499983cc03ed04a4`.
- Two later CLI `append_evidence` attempts were finalized with `NO_MAJORITY`, zero rounds/votes, and no GenVM execution. They are failed attempts, not evidence submissions or lifecycle success: `0x6b7901f040b5d2705162da0486076a52cc351b76220e846e2e035d37b95fc75d` and `0xb29f1daaefbe3bbbd522418d99b675f465e81f93aa3b9bbeafd3e29f82ec8ffb`.
- The deployment address and open-case hash are user-reported Studio evidence. Deployed source bytes, the full deployment receipt, and parity with the current working tree remain unverified. Do not use the failed append attempts as a basis for expected versions without a fresh authoritative `get_case` read.
