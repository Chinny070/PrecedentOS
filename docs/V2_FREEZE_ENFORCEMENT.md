# Stage 4 — CaseCourt Freeze and Resolution Rules

## Two distinct freeze paths

### Automatically admitted case appeal

`file_appeal` atomically sets `frozen=true`, `appeal_freeze=true`, `active_appeal_id`, the grounds reason/digest and `phase=FROZEN`. The freeze has no timer and lasts until a stored, accepted appellate ruling is resolved through `resolve_appeal`. `unfreeze_case` explicitly rejects an active AppealCourt freeze. Failed eligibility, invalid AI output, or a failed execution must not be treated as a release. Direct Mode can verify deterministic reverts and local state behavior, but it cannot establish network rollback.

The appeal path still permits appellant-only appeal-evidence append and lock, and permits the opposing party to begin review/adjudicate. These are defined appeal operations, not bypasses of the case freeze. Ordinary case writes, challenges, closure requests, and ordinary judgment adjudication are blocked while the appeal is active.

### Existing discretionary challenge freeze

The existing `request_freeze` remains available to a case participant while `CHALLENGE_OPEN`, once per case, for at most the existing 24-hour transaction-context interval. Its grounds digest is recorded in the snapshot and action payload. Before expiry the requester can release it; after expiry any caller may materialize expiry. It cannot clear an AppealCourt freeze. The clock uses the existing transaction context implementation but still lacks live runtime verification.

## State and history

Every freeze/unfreeze or appeal transition appends a bounded per-case action with unique action ID, expected/new versions, actor and payload digest. Appeal filings have an immutable `PF:` snapshot, each appeal evidence reference is immutable, each accepted ruling is immutable `AR:`, and the current `P:`/`C:` projections are mutable. No API deletes or rewrites the historical judgment or ruling.

`REVERSED` sets `superseded_judgment_id`, sets the appellate ruling as operative, and clears only the active appeal freeze. `REMANDED` and `INSUFFICIENT_EVIDENCE` transition to `REMANDED_REVIEW`; only the normal evidence/adjudication workflow may proceed after resolution. `UPHELD` and `DISMISSED` retain the original decision reference. All branches preserve the original `J:` record.

The case-close process requires no active freeze and a locally accepted case or appellate decision; one party requests and the other party approves. Closure is application-level policy, not `FINALIZED` on GenLayer.

## What the freeze does not enforce

This is a guard in one CaseCourt contract. It cannot stop Registry/Evaluator activity, other CaseCourt deployments, previously submitted transactions, independent contracts, wallet activity, off-chain use of documents, or outside proceedings. The UI and protocol must use “CaseCourt actions frozen” and never claim a network-wide/legal injunction.

## Liveness and failure

The automatic appeal freeze intentionally fails closed. If no validator consensus can accept appellate review, the filing remains active/frozen and the parties may retry under a new action ID. There is no timer-based escape or unilateral cancellation. This prevents unverified time semantics from releasing an admitted appeal, but can leave a case stuck. Before production, a stable runtime test and a due-process-approved, authorized failure-resolution path are necessary. No emergency override is implemented.
