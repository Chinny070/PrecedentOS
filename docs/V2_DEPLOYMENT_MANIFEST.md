# PrecedentOS 2.0 Deployment Manifest

This manifest records only user-supplied deployment and transaction evidence. A blank or pending item is not inferred from another transaction. Addresses, hashes, status and results are not independently fetched unless explicitly stated.

## Target

- Intended network: stable GenLayer Studionet
- Expected chain ID: `61999`
- Chain ID observed on the Registry call detail: **not shown in the supplied excerpt; pending confirmation**

## PrecedentRegistry

- Status: **registration call reported successful; deployment identity and state readback pending**
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
- Required next evidence: Studio network label and chain ID for this transaction; read-only `get_precedent("FICT-STUDIONET-001")`, `has_precedent("FICT-STUDIONET-001")`, and `get_registration_count()` results. Confirm the returned submitter equals the reported sender. A duplicate-rejection test and post-failure state readback remain pending and may require an additional fee-bearing transaction.

## PrecedentEvaluator

- Status: **not reported deployed**
- Address: **none supplied**
- Required next proof: one fictional positive AI/Equivalence evaluation; negative classification/insufficient-evidence or malformed input behavior; finalized + accepted + successful execution; and exact persisted readback. Do not treat caller-supplied precedent IDs as verified Registry references.

## CaseCourt

- Status: **not approved for deployment**
- Address: **none supplied**
- Blocking policy/runtime gates: independent reviewer authority and conflict rules; appeal freeze liveness and safe recovery after failed/undetermined review; authorization boundaries; native transaction finality versus protocol case state; end-to-end rollback/readback evidence. `WEB_RENDER_RUNTIME_ENABLED` remains false.
