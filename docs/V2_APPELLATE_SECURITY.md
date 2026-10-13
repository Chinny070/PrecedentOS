# Stage 4 — Appellate Security Review

## Implemented controls

- Exact case-party and opposing-filer checks; a judgment submitter cannot appeal their own judgment.
- Exact current case phase/version; judgment ID, case ID, judgment case version, judgment commitment, current operative ID/digest, and evidence-root equality; for level 2, exact latest resolved parent/ruling, ruling version/digest, parent status and level.
- Length/format bounds on IDs/digests, ground enum/text/digest, evidence count/text/packet, schema version and output fields.
- Grounds UTF-8 SHA-256 and caller filing commitment recomputation; ordered evidence roots and exact supplied evidence-byte hashes.
- One active appeal, global appeal-ID reuse rejection through the persistent filing key, unique action IDs, at most two appeal entries and no third ordinary level; parent and target equality prevent arbitrary/circular references.
- Appeal-specific freeze guard and explicit prohibition on generic `unfreeze_case` releasing it.
- Appellant-only evidence append/lock, non-appellant party review/adjudication, participant-only resolution, ruling-commitment verification, and deterministic result schema revalidation at resolution.
- Structured/immutable filing, evidence-reference, judgment and appellate-ruling records; append-only case action history; no public deletion method.
- Prompt explicitly treats appeal grounds/evidence as untrusted instructions; only fictional public evidence fixtures are used.
- Resolution writes occur after the nondeterministic call returns. Failure/rejection rollback is not claimed without runtime proof.

## Threat boundaries and remaining risks

| Threat | Current control | Residual risk / required verification |
|---|---|---|
| Forged or stale judgment reference | On-contract `J:` lookup and exact case/version/commit/root checks. | A judgment from a different Court deployment is not accepted. No cross-contract proof path exists. |
| Appellant rewrites evidence | Immutable reference keys, order index and lock-time digest root. | Evidence source truth, authorship and admissibility remain unverified. |
| Prompt injection | Fixed criteria, bounded packets, untrusted-data prompt instruction, output schema. | No model security guarantee; live model behavior must be adversarially tested. |
| JSON-shaped wrong decision | Decision consistency checks and independent EP decision-field comparison. | Direct Mode mocks the validator; no real consensus proof. |
| Caller invents a ruling | Resolution accepts only an appeal ID and stored ruling digest; validates the stored object and result commitment. | Runtime storage semantics and execution receipts remain unverified. |
| Unauthorized unfreeze or ordinary write | All ordinary mutation helpers reject frozen/closed cases; `unfreeze_case` refuses appeal freezes. | A CaseCourt cannot freeze another IC or already submitted transaction. |
| Duplicate, replayed or circular appeal | Unique appeal/action IDs, current version, active parent and bounded level. | No Exceptional Review path exists. |
| Consensus outage/stuck appeal | Appeal remains frozen and may be retried. | Liveness/due-process risk: no authorized recovery/timeout path exists yet. |
| Overload/storage exhaustion | Evidence/prompt/array/ID/action limits and maximum two appeal filings. | Gas/fee and maximum aggregate storage must be profiled on the selected stable runner. |
| Party collusion or key compromise | Two distinct stored participant addresses and bilateral case closure. | Addresses do not prove identity, consent, service, legal capacity or representation. |
| Timestamp manipulation | No Stage 4 appeal deadline or time-based appeal exit. | Existing legacy 24-hour freeze clock remains runtime-unverified. |
| Partial write on failed EP | No state writes occur before `run_nondet_unsafe` returns; all later updates are in one call. | Only actual compatible runtime tests can establish execution rollback and persistent-state effects. |

## Checks covered locally

`tests/test_case_court_appeals.py` uses fictional data and the Direct Mode harness. It covers successful flow and all five outcomes, multi-level limit, exact binding, invalid filing/digest/packet, unauthorized parties, replay, forged ruling digest, attempted unfreeze, freeze/closed-state preservation, prompt-injection fixture and Python commitment parity. Leader/model responses and validator execution are mocked; tests demonstrate local method behavior only.

## Pre-production review required

Independent security review; domain/legal due-process review of reviewer selection and undefined appeal-time windows; stable-runner lint and Studio integration; actual disagreement and failed-execution/rollback test; storage/fee profiling; approved liveness rescue policy; and a dedicated contract upgrade/deployment review. No live deployment or transaction has been performed.
