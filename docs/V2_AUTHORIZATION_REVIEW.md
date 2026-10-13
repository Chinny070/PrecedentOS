# Stage 7B — Authorization Review

Authorization below reflects current public method guards in source. Contract methods do not authenticate real-world identity; an address is a protocol participant key. Views are public. `gl.message.sender_address` is the transaction caller. Direct Mode tests do not prove runtime identity behavior.

| Contract / public method(s) | Caller permitted by code | Principal checks / limits |
|---|---|---|
| Registry `register_precedent` | Any address | Valid schema/ID/digest/metadata, unique ID, global capacity; no admin role |
| Registry views | Anyone | Keyed reads/count only |
| Evaluator `evaluate_pair` | Any address | Valid IDs/ordered packet/digests/schema/criteria, unique ID/capacity; references are caller assertions |
| Evaluator views | Anyone | Keyed read/count |
| CaseCourt `open_case` | Any address as petitioner | Respondent must be distinct nonzero address; unique case/action; capacity |
| `append_evidence`, `lock_evidence`, `register_web_source` | Either named case party | Phase, expected version, replay and capacity checks; appeal-source operations additionally bind appellant/state |
| Web source approval / capture request / unavailable report / capture / compare | Named party according to source binding and transition | Exact case/source/version/request identities; capture is hard-disabled; model/render work remains mocked locally |
| `adjudicate_case` | Named party when evidence is locked | Case/version/evidence commitments, phase and replay checks; AI result schema/EP checks |
| `attach_decision_reference` | Named case party | Versioned, exact target fields; unverified caller references do not gain appeal authority |
| `challenge_decision` | Named case party other than decision submitter, subject to active challenge rules | Current decision identity/version and freeze/phase checks |
| `file_appeal` | Named party other than judgment submitter; consecutive appeal must be filed by the other party than parent appellant | Exact current target, case/Court/chain/version/commitment, filing commitment, max two levels |
| Appeal evidence append/lock and withdrawal request | Appeal appellant | Active appeal ID, version/status, evidence cap, unique IDs; withdrawal is pre-ruling only |
| `begin_appeal_review`, `adjudicate_appeal` | Named party other than appellant | Active appeal, exact version/status/locked evidence, original judgment/evidence bindings, strict schema/EP |
| `resolve_appeal`, withdrawal approval | Either named case party (not appellant for approval) | Exact active appeal/ruling commitment or pending bilateral withdrawal; replay/version checks |
| `request_case_closure`, `approve_case_closure` | Either named party; approval by the other party | Exact current decision binding and request version; bilateral closure |
| `file_contradiction_challenge` | **After Stage 7B: caller must belong to both distinct cases and cannot be the challenged decision submitter** | Both targets exact/current/operative; case freeze and per-case/global quotas; excerpts remain caller assertions |
| Contradiction assessment | Public call once filed and while both linked cases are unfrozen/unappealed | Bounded strict output and EP; no legal authority from assessment |
| Contradiction resolution | Named participant in challenged case | Exact resolved appeal/ruling binding; append-only resolution |
| `record_authority_relationship` | Named participant in the source record's case for `USER_ASSERTED`, `AI_PROPOSED`, and `APPELLATE_RECORD` paths | Target may be another case; source-specific exact records/commitments, linked-case freeze checks, relation/status, edge ID/replay, cycle/cap guards apply. The target case does not co-authorize an edge. Edge status is not finality. |
| `request_freeze`, `unfreeze_case` | Named participant | One-time bounded ordinary freeze; appeal freeze cannot be cleared by this route |
| All CaseCourt getters including recovery diagnostic | Anyone | Deterministic bounded keyed reads; no transaction finality oracle |

There is no administrative superuser or DAO role. Reviewer role is the opposing participant selected by case-party protocol, which does not provide independence from conflict of interest or legal arbitration. Independent reviewer governance is **BLOCKED ON POLICY**. No unilateral appeal recovery, privileged third-party review, live frontend governance write, or cross-contract authority based on caller assertion is enabled.

## Adversarial authorization outcomes

- Cross-case contradiction challenge: reproduced defect was that only the challenged-case party guard ran. Fixed by requiring the sender also to match petitioner/respondent of the conflicting case. Regression proves rejection with no challenge/action counter mutation, shared-party acceptance, and conflicting-case-only rejection.
- Mismatched case/appeal diagnostic lookup rejects. Appeal targets, judgments, sources and graph edges bind case/Court/chain/version/commitment in existing code and focused tests.
- Participant impersonation is not meaningfully simulated by supplying arbitrary string identities; Direct Mode uses sender context. Live `msg.sender` semantics remain runtime verification work.
- Duplicate/replay checks and stale version rejection are local contract tests; native reorg, pending transaction and replay costs are not established.
