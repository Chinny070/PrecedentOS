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
- `has_evaluation(...)` and `get_evaluation_count()` have not yet been supplied for this deployed instance.

### Next positive Evaluator test — matching fictional precedents

Use the fixture `matching` from `tests/fixtures/fictional_evaluations.json` on the hardened deployment. This avoids the ambiguous conflict case that produced Undetermined. It remains a cost-bearing AI call; check the Studio fee before submitting.

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

- Status: **not approved for deployment**
- Address: **none supplied**
- Blocking policy/runtime gates: independent reviewer authority and conflict rules; appeal freeze liveness and safe recovery after failed/undetermined review; authorization boundaries; native transaction finality versus protocol case state; end-to-end rollback/readback evidence. `WEB_RENDER_RUNTIME_ENABLED` remains false.
