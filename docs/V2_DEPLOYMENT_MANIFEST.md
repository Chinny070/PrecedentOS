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

## Next planned PrecedentEvaluator test (not yet deployed or executed)

- Production source to upload: `contracts/precedent_evaluator.py`; zero-argument constructor.
- First positive fictional test: `evaluate_pair` using evaluation ID `EVAL-STUDIONET-PERMIT-001`, record IDs `FICT-PERMIT-0001` and `FICT-PERMIT-0002`, evidence schema `1`, criteria version `1`, and the `unexplained_conflict` passages in `tests/fixtures/fictional_evaluations.json`.
- Exact passage SHA-256 digests (UTF-8): record A `d6e71d65d4bf32f69098c1274535e5d70ddc2ac10a1e214f4ec5ac7838483176`; record B `aef80225c38056e34445afb6f2505bcb3f23c8110aa34181b29c73db107e8079`.
- Evidence packet JSON string: `{"precedent_a":"A fictional panel held that a permit allowed a temporary sign on a public walkway and that this placement complied with the stated walkway rule. No exception or different fact was identified.","precedent_b":"A fictional panel held that a permit allowed a temporary sign on the same type of public walkway and that this placement violated the same stated walkway rule. No exception or different fact was identified."}`
- Criteria: `Compare the stated issue, rule, material facts, outcomes, and any expressly stated exception. Treat a difference as a possible contradiction only if it remains unexplained by the supplied facts. Use no outside assumptions.`
- Expected assessment to inspect: `possible_contradiction` with the decision fields semantically consistent and nonempty contradiction findings. The contract's Equivalence Principle must accept matching decision-bearing fields; a leader result, valid JSON, or finalized status alone is insufficient.
- Evaluator IDs/digests are caller-supplied and are **not** proof of Registry membership; cross-contract verification is not implemented or claimed. Await the user-operated deployment and any fee approval before submitting this AI transaction.
- After an accepted successful finalized execution, read back `get_evaluation("EVAL-STUDIONET-PERMIT-001")`, `has_evaluation(...)`, and `get_evaluation_count()`. Then use separate fictional negative checks (e.g. insufficient evidence, mismatched digest, and duplicate evaluation ID) only after reviewing each displayed fee.

## PrecedentEvaluator

- Status: **not reported deployed**
- Address: **none supplied**
- Required next proof: one fictional positive AI/Equivalence evaluation; negative classification/insufficient-evidence or malformed input behavior; finalized + accepted + successful execution; and exact persisted readback. Do not treat caller-supplied precedent IDs as verified Registry references.

## CaseCourt

- Status: **not approved for deployment**
- Address: **none supplied**
- Blocking policy/runtime gates: independent reviewer authority and conflict rules; appeal freeze liveness and safe recovery after failed/undetermined review; authorization boundaries; native transaction finality versus protocol case state; end-to-end rollback/readback evidence. `WEB_RENDER_RUNTIME_ENABLED` remains false.
