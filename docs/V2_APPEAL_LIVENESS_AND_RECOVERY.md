# Stage 7B — Appeal Liveness and Recovery

**Baseline:** `05fa708afa3d42ea17ba0408a107549963f6dc91`; local checks only. No runtime transaction, deployment, or finality observation.

## Three separate state layers

1. **CaseCourt application appeal status** is the contract field returned by `get_appeal` and `get_appeal_recovery_status`. Filing sets a CaseCourt freeze; application resolution or the existing bilateral pre-ruling withdrawal path releases it.
2. **GenLayer native transaction status** is not stored by CaseCourt and is not available from its views. It may be submitted, pending, accepted, finalized, failed, or unknown according to the actual network interface.
3. **Verified successful finalized execution** requires external evidence of successful execution and finality, plus an authoritative exact readback. A CaseCourt `RESOLVED`, ruling record, local mock, frontend timer, or accepted transaction is not that proof.

The new `get_appeal_recovery_status(case_id, appeal_id)` view reports application status, freeze flags, ruling presence/commitment, and explicitly returns `NOT_AVAILABLE_FROM_CASECOURT`, `NOT_VERIFIED`, and `NO_UNILATERAL_RECOVERY_TRANSITION` for native state/finality/recovery authority. It is read-only and cross-binds appeal to the requested case.

## Existing release paths and retry safety

- Repeated `adjudicate_appeal` calls are not an idempotent retry API: a successful execution changes application status and appends a ruling/action, so a repeat rejects on state. A failed native execution may be retried only after its actual lifecycle is known and the expected CaseCourt version/status still permits the same authorized caller and payload. No automatic retry is enabled.
- Duplicate action, appeal, ruling, evidence, and filing identifiers are rejected. Expected-version checks prevent applying a stale review to a changed CaseCourt state.
- Validator disagreement or deterministic failure should leave storage unchanged under transaction semantics; local Direct Mode covers contract-level failure behavior only. Network rollback is unverified.
- Pending native transactions must not be duplicated based on a frontend timeout. Wait for transaction lifecycle evidence or stop with status unknown.
- `resolve_appeal` applies an already recorded ruling using an authorized case participant and exact ruling commitment. CaseCourt does not prove that the transaction recording that ruling is finalized.
- The existing pre-adjudication withdrawal requires the appellant to request and the other party to approve. It cannot withdraw after a ruling exists and cannot be repurposed as unilateral recovery.
- The ordinary time-limited case freeze is separate; it cannot clear an appeal freeze.

## Stuck-state scenarios

| Scenario | Safe local action | What remains unresolved |
|---|---|---|
| Repeated AI/validator failures | Read appeal status, preserve transaction IDs and traces, retry only after authoritative failure and only while method preconditions still hold | Actual rollback and consensus lifecycle on the selected runner |
| Validators disagree | Do not append a ruling; preserve failed execution evidence | Demonstrated native disagreement semantics and rollback |
| Transaction remains pending | Do not duplicate or infer failure from elapsed time | Network-specific timeout/finality policy |
| Review transaction fails | Re-read CaseCourt status/version before any new authorized attempt | Whether failure was final and storage rolled back |
| Opposing participant unavailable | Read and report the frozen application state | A governed neutral reviewer, service deadline, or release authority is not defined |
| Duplicate review request | Existing status/version/action checks reject repeats after transition | Native duplicate transaction handling remains runtime-dependent |
| Appeal appears stuck between permitted states | Use the diagnostic view and preserve exact state | No privileged repair transition is available |
| New appeal targets outdated judgment | Exact current target/version/commitment checks reject it | External finality and canonical case state remain unverified |
| Native transaction appeal/re-execution | Observe and distinguish native transaction lifecycle from CaseCourt state; re-read exact record | No native finality anchor or callback is demonstrated |

## Release policy decision required

Product/legal governance must decide whether to permit (a) a time-bounded review obligation, (b) an independent reviewer or panel and how it is selected, (c) emergency participant replacement, (d) unilateral withdrawal after a defined condition, and (e) which native finalized evidence authorizes each transition. This repository has no approved neutral reviewer registry, timeout/finality anchor, or appeal-fee and notice policy. The opposing named party is not an independent arbitrator. **Privileged recovery remains disabled; Stage 8 is blocked on this policy and runtime evidence.**
