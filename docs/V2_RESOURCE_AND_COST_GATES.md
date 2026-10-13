# Stage 7B — Deterministic Resource Bounds and Cost Gates

This inventory is source-level only. Character/byte caps and loop bounds do not establish affordable execution. No GEN fees, gas prices, validator counts, latency, or live workload costs are estimated here.

## Deterministic source bounds

| Contract / method family | Input and stored bounds visible in source | Bounded work / notable limits | Web Render |
|---|---|---|---|
| Registry `register_precedent` | ID 48 chars; metadata fields 64 chars; digest 64 lowercase hex; one record per ID; 1,000,000 registration cap | Constant keyed checks and one append; Gregorian date validation is bounded | No |
| Evaluator `evaluate_pair` | Packet 4,200 characters; each passage 1,800 characters; criteria 600; findings 4 × 160; rationale 400; result schema fixed; 1,000,000 cap | Parses two passages; leader and validator execute bounded prompt twice per EP path; input string limits are character-based | No |
| CaseCourt open/evidence/action | Case ID/action/evidence IDs 48; case type 64; evidence item 1,800 UTF-8 bytes; 32 evidence per case; 100,000 cases; 1,000,000 actions; 128 actions per case | Append and keyed checks; committed evidence collection at most 32 | No |
| CaseCourt judgment | Packet 9,000 bytes; judgment evidence text/ref bounds and fixed findings/reasoning; criteria fixed | Evidence-root recomputation at most 32 refs; model plus validator prompt work is bounded by packet cap | No |
| CaseCourt appeal/review | Grounds 600 UTF-8 bytes; 8 appeal evidence items × 1,200 bytes; review packet 12,000 bytes; two appeal levels/filings per case; four findings | Original evidence ≤32 and appeal evidence ≤8; repeated AI validator work is not fee measured | No |
| Contradiction filing/assessment | Global 256 challenges; 8 per case; 800-char max challenge text fields; bounded findings/reasoning | Two exact decision reads; AI prompt/validator payload is bounded by record fields; output schema is bounded | No |
| Authority graph | 128 total edges | Supersession traversal scans at most 128 edges per step; exact algorithm's worst-case scan is finite but repeated scan work needs runtime profile | No |
| Web source registration/capture/compare | 12 sources/case; 4 versions/source; 8 comparisons/case; URL 512 chars; rendered text 10,000 bytes; 3 claims; 3 capture attempts | Post-render limits do not bound retrieval work before the renderer returns | **Method exists but globally hard-disabled** |
| Studio diagnostic probe | Probe-specific bounded IDs/input in source | Each write may invoke transaction or AI/EP work; no fee profile | No |

Limits above are maximum source constraints, not recommendations or proof that all maximum combinations fit the target runner. Lifetime storage is capped in several counters, but total deployment state and byte charges are not empirically known.

## Workload categories

- **DETERMINISTIC SOURCE BOUNDS:** table above; source/code review and local boundary tests only.
- **ESTIMATED WORKLOAD ONLY:** none. This report does not manufacture cost estimates.
- **MEASURED ON COMPATIBLE RUNNER:** none; stable runner identity is unresolved.
- **LIVE NETWORK VERIFIED:** none.

## Required profiling and release gates

On the exact approved stable runner, measure deployment and representative small/maximum calls for Registry, Evaluator, CaseCourt evidence, adjudication, appeal, graph append/traversal, and failure/retry paths. Record source/runner/SDK hashes, input sizes, fee units/amount as displayed, execution lifecycle, output bytes, and repeated validator behavior. Establish approved per-operation and cumulative storage budgets before production use. For AI paths measure actual prompt bytes and validator work. For Web Render, first demonstrate redirect handling, DNS/private/link-local destination denial, renderer egress restrictions, pre-return response cap, timeout, and fee bounds. Keep `WEB_RENDER_RUNTIME_ENABLED = False` until every control is verified. No deployment or transaction is authorized by this document.
