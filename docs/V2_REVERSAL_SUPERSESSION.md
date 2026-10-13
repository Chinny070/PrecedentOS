# Stage 6 — Reversal, Supersession, and Lineage

## No mutation of precedent records

The existing Registry and Evaluator contracts are unchanged. A CaseCourt judgment is not erased or rewritten by appeal or contradiction processing. The existing appeal lifecycle remains the only implemented transition that can replace a case’s operative decision. A filed contradiction challenge alone cannot change the current decision, reopen a closed case, or bypass an active appeal freeze.

After `resolve_appeal` stores a CaseCourt resolution, `record_authority_relationship` may append an appellate edge from that exact resolved ruling to its exact original judgment. `UPHELD` maps to `UPHOLDS`; `REVERSED` maps to `REVERSES` or `SUPERSEDES`; `REMANDED` and `INSUFFICIENT_EVIDENCE` map to `REMANDS_TO` the same CaseCourt case. The relation must match the stored outcome and ruling commitment. Ordinary callers cannot assert reversal, supersession, or remand.

The original judgment remains retrievable by its original ID and commitment. The current CaseCourt view reports the current operative record, its authority label, active appeal/frozen/closed flags, and the explicit `NOT_VERIFIED_BY_CASECOURT_VIEW` finality label. Historical relations remain available by sequence; this version does not claim complete pagination or whole-corpus lineage.

## Challenge resolution

A contradiction challenge can be linked to the resolved appellate ruling for its challenged judgment. That resolution is an append-only record containing the challenge commitment, appeal ID, ruling commitment and appeal outcome. It records a procedural link, not proof that an AI-proposed contradiction was legally correct. The challenge’s own evaluation remains a separate immutable result.

## Limits and status

| Capability | Status |
|---|---|
| Preserve prior judgment and append reversed/superseded edge | **IMPLEMENTED / LOCALLY TESTED** with a fictional Direct Mode appeal. |
| Require resolved CaseCourt ruling and exact target/outcome | **IMPLEMENTED / LOCALLY TESTED** |
| Keep contradiction challenge separate from appeal freeze and ruling | **IMPLEMENTED / LOCALLY TESTED** |
| Confirm transaction finality before UI authority claim | **BLOCKED**; no stable receipt has been read. |
| Reverse or supersede Registry v1 entries | **NOT IMPLEMENTED BY DESIGN**; Registry is immutable and cross-contract calls are unverified. |
| Case deadlines, native appeal integration, cross-contract atomicity | **BLOCKED / NOT STARTED** |
