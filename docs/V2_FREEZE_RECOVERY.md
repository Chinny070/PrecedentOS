# Stage 5 — Appeal Freeze Recovery

## Why the freeze exists

Once an eligible appeal is filed, CaseCourt freezes ordinary case changes until resolution. This protects the appealed record from unilateral modification while the review is pending. CaseCourt cannot freeze the Registry, Evaluator, other contracts, or protocol-native transactions.

## Recovery behavior

An appellant may request withdrawal only while an appeal is `PENDING_ADJUDICATION` or `REVIEW_READY`, before appellate adjudication has moved the appeal into its review/resolution phase and before any ruling record exists. The request records a bounded reason code and an append-only action but leaves the freeze active. The non-appellant case party must approve in another transaction. Only approval marks the appeal `WITHDRAWN`, appends the resolution action, preserves the filing/ruling history, clears the active appeal pointer and releases the appeal freeze.

The contract rejects a request or approval after adjudication begins or after a ruling is stored. Self-approval is rejected. Ordinary `unfreeze_case` cannot release an active appeal freeze. A withdrawn target cannot be re-filed as a replay of the same appeal target; withdrawal does not erase the appeal filing history.

## Execution failure, disagreement, and retries

There is no “failure was accepted” state. If model execution, validator equivalence, transaction validation, or inclusion fails, the caller must inspect the actual transaction lifecycle. Direct Mode confirms only that the tested harness does not mutate persistent state when the call reverts/validator callback rejects. It does not prove chain-level rollback. A retry can use the still-active appeal while authorized and before adjudication progresses; failed requests are not counted in contract state because no accepted write occurred. The bounded CaseCourt action log caps accepted state changes but does not bound fee spent on rejected transaction attempts.

Evidence-source failure can be represented as a participant-reported unavailable record, explicitly not as a verified network result, and capture requests are limited to three per source version. There is no unilateral escape when the other party refuses a withdrawal and the appeal cannot be resolved. This can leave a case frozen indefinitely and remains a due-process/liveness risk requiring policy review.

No automatic unfreeze is based on a client clock or an unverified timestamp. Exceptional recovery, dismissal for inactivity and finality-based deadlines remain unimplemented.

## Tests and status

Direct Mode tests cover bilateral withdrawal, non-appellant authorization, generic unfreeze bypass rejection, replayed target rejection, and inability to withdraw after a stored appellate ruling. **LOCALLY TESTED** does not mean consensus or rollback **LIVE VERIFIED**. No live recovery transaction has been sent.
