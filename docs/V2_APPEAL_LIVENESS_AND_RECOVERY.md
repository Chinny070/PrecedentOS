# Stage 7B — Appeal Liveness and Recovery

**Baseline:** `05fa708afa3d42ea17ba0408a107549963f6dc91`; historical review. The current source update below has local checks, but has not been deployed or independently live-verified.

**Current source update (2026-10-16):** timeout-lapsed appeals now remain in immutable history and may be refiled against the same still-eligible target only with a fresh appeal ID, action ID, and filing commitment. Any non-lapsed prior filing for that target blocks refiling. Total filing attempts are capped at four per case; substantive levels remain capped at two. Direct Mode tests cover successful lapse/refile, replayed action rejection, active freeze, preserved judgment, and attempt-cap rejection. This does not add an independent reviewer, prove a native deadline/finality anchor, or remove the risk of an appeal remaining frozen until timeout recovery is submitted.

## Three separate state layers

1. **CaseCourt application appeal status** is the contract field returned by `get_appeal` and `get_appeal_recovery_status`. Filing sets a CaseCourt freeze; resolution, bilateral pre-ruling withdrawal, or timeout lapse after the freeze deadline releases it.
2. **GenLayer native transaction status** is not stored by CaseCourt and is not available from its views. It may be submitted, pending, accepted, finalized, failed, or unknown according to the actual network interface.
3. **Verified successful finalized execution** requires external evidence of successful execution and finality, plus an authoritative exact readback. A CaseCourt `RESOLVED`, ruling record, local mock, frontend timer, or accepted transaction is not that proof.

The `get_appeal_recovery_status(case_id, appeal_id)` view reports application status, freeze flags, ruling presence/commitment, and explicitly returns `NOT_AVAILABLE_FROM_CASECOURT`, `NOT_VERIFIED`, and `CASE_PARTY_MAY_LAPSE_AFTER_FREEZE_EXPIRY` for native state/finality/recovery authority. It is read-only and cross-binds appeal to the requested case. Recovery requires a caller to submit the lapse transaction after the contract deadline; it is not automatic.

## Existing release paths and retry safety

- Repeated `adjudicate_appeal` calls are not an idempotent retry API: a successful execution changes application status and appends a ruling/action, so a repeat rejects on state. A failed native execution may be retried only after its actual lifecycle is known and the expected CaseCourt version/status still permits the same authorized caller and payload. No automatic retry is enabled.
- Duplicate action, appeal, ruling, evidence, and filing identifiers are rejected. Expected-version checks prevent applying a stale review to a changed CaseCourt state.
- Validator disagreement or deterministic failure should leave storage unchanged under transaction semantics; local Direct Mode covers contract-level failure behavior only. Network rollback is unverified.
- Pending native transactions must not be duplicated based on a frontend timeout. Wait for transaction lifecycle evidence or stop with status unknown.
- `resolve_appeal` applies an already recorded ruling using an authorized case participant and exact ruling commitment. CaseCourt does not prove that the transaction recording that ruling is finalized.
- The existing pre-adjudication withdrawal requires the appellant to request and the other party to approve. An expired `WITHDRAWAL_REQUESTED` appeal can instead be permissionlessly lapsed after the appeal freeze deadline; the original decision remains unchanged. This is a bounded liveness transition, not a merits decision or neutral review.
- A legacy `CHALLENGE_OPEN` transition has explicit exits: the appellant can withdraw it while the case is not frozen, or any caller can lapse it after its seven-day deadline. Both restore `DECISION_RECORDED` without changing the underlying decision. They reject when a freeze or inconsistent phase would strand or mutate the case.
- A timeout lapse is not a merits decision. Refiling creates a new appeal record with no inherited reviewer, evidence approvals, or action IDs; repeated lapsed attempts consume the fixed four-attempt case budget.
- The ordinary time-limited case freeze is separate; it cannot clear an appeal freeze.

## Stuck-state scenarios

| Scenario | Safe local action | What remains unresolved |
|---|---|---|
| Repeated AI/validator failures | Read appeal status, preserve transaction IDs and traces, retry only after authoritative failure and only while method preconditions still hold | Actual rollback and consensus lifecycle on the selected runner |
| Validators disagree | Do not append a ruling; preserve failed execution evidence | Demonstrated native disagreement semantics and rollback |
| Transaction remains pending | Do not duplicate or infer failure from elapsed time | Network-specific timeout/finality policy |
| Review transaction fails | Re-read CaseCourt status/version before any new authorized attempt | Whether failure was final and storage rolled back |
| Opposing participant unavailable | After the contract's freeze deadline, any caller may submit `lapse_stalled_appeal`; the prior decision is retained | Timeout recovery is source-level only until a matching deployment and live receipt are verified; no neutral reviewer is defined |
| Duplicate review request | Existing status/version/action checks reject repeats after transition | Native duplicate transaction handling remains runtime-dependent |
| Appeal appears stuck between permitted states | Read the diagnostic view; after freeze expiry, lapse only if status and phase satisfy the contract guards | No arbitrary privileged repair transition exists; timeout recovery is bounded and does not issue a ruling |
| New appeal targets outdated judgment | Exact current target/version/commitment checks reject it | External finality and canonical case state remain unverified |
| Native transaction appeal/re-execution | Observe and distinguish native transaction lifecycle from CaseCourt state; re-read exact record | No native finality anchor or callback is demonstrated |

## Release policy decision required

Product/legal governance must decide whether to permit (a) an independent reviewer or panel and how it is selected, (b) emergency participant replacement, and (c) which native finalized evidence authorizes each transition. The contract now has a fixed seven-day application deadline and bounded timeout recovery, but that deadline is based on the deterministic transaction clock and does not prove native transaction finality or notice delivery. The opposing named party is not an independent arbitrator. These paths are for a fictional prototype and have not been verified on the deployed address.
