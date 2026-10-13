# Stage 3B Adjudication Security Review

**Status:** implementation review and mocked Direct Mode tests complete; no independent audit or live runtime proof. Every row uses the labels required by the stage.

| Requirement | Status | Evidence / limitation |
|---|---|---|
| Case participant authorization | IMPLEMENTED / LOCALLY TESTED | `gl.message.sender_address` must match petitioner or respondent; nonparticipant test preserves state. |
| Exact case, current version and locked phase | IMPLEMENTED / LOCALLY TESTED | Request has case ID and expected version; exact `EVIDENCE_LOCKED` phase required; stale/unlocked/frozen cases reject. |
| Evidence order/root and byte verification | IMPLEMENTED / LOCALLY TESTED | Lock derives ordered root from existing action/evidence records; adjudication recomputes root and SHA-256 of exact UTF-8 evidence text. Python helper comparison test matches the on-chain implementation in Direct Mode. Source truth remains unverified. |
| Criteria/policy binding | IMPLEMENTED / LOCALLY TESTED | Fixed policy/criteria versions and criteria digest are captured at open; adjudication checks supported values and commits them. No caller criteria override. |
| Prompt injection | IMPLEMENTED / LOCALLY TESTED (prompt construction only) | Evidence is JSON-encoded as untrusted data and prompt says to ignore embedded instructions. Mocked tests do not measure model robustness. |
| Decision validation/equivalence | IMPLEMENTED / LOCALLY TESTED (mocked) | Strict fields, enums, bounds, consistency rules and decision-bearing comparison. Live validators not exercised. |
| Duplicate/replay/replacement | IMPLEMENTED / LOCALLY TESTED | Global decision ID replay key; input digest includes chain/Court/case/version; case phase prevents second judgment or replacement. Direct tests check duplicate ID and cross-case replay. |
| Write ordering and failure path | IMPLEMENTED / LOCALLY TESTED (harness only) | State writes occur after `run_nondet_unsafe` returns. Direct Mode leader failure leaves state unchanged; live rollback and validator disagreement behavior BLOCKED pending runtime proof. |
| Appeal binding | IMPLEMENTED / LOCALLY TESTED | Existing first-level appeal now records the exact judgment ID, digest, judgment version, evidence commitment, appellant and filing commitment. Review outcome remains unimplemented. |
| Frozen cases | IMPLEMENTED / LOCALLY TESTED | Freeze guard runs before adjudication; existing frozen state blocks the method. |
| Input/storage/execution bounds | IMPLEMENTED / LOCALLY TESTED | 9,000-byte packet; 1,800-byte evidence items; 32 references; bounded result strings/lists; one judgment per case. Worst-case fees/VM limits are not measured. |
| Privacy/data minimization | IMPLEMENTED by schema | Full evidence text is not persisted. On-chain prompt evidence is still disclosed to execution/validator nodes and can be public; never submit confidential/private evidence. |
| Stable runner and consensus | BLOCKED | Linter uses cached `py-genlayer` artifact after upstream lookup failed with Windows socket error 10013. No current stable runner mapping, actual validator consensus, finality or fee profile. |
| Frontend write enablement | NOT STARTED | Only typed adapter boundary and lifecycle gate are added. No adjudication button, SDK call or write transaction. |

## Principal risks

1. **Legal error:** model outputs can be wrong; validator agreement is not legal correctness. Protocol labels remain advisory and due-process policy is not implemented.
2. **Adversarial/equivocal evidence:** SHA-256 checks supplied bytes against a prior commitment, not authenticity, completeness, authorship or admissibility. A participant can commit misleading content before lock.
3. **Prompt injection:** explicit untrusted-data framing helps but does not establish model immunity. Scope and evidence must be bounded and the custom validator must assess the same submitted packet.
4. **Appeal/finality:** this contract creates a stored EP-accepted execution result; its underlying transaction may still be appealed/re-executed. CaseCourt appeal filing stays unadjudicated; no early external effect is emitted.
5. **Runtime/atomicity:** Direct Mode and cached lint are not the selected stable GenVM runtime. Confirm serialization, storage commit ordering, validator disagreement/failure and receipt lifecycle before deployment or reliance.
6. **Denial of service/cost:** maximum input still requires model work from validators. Fee and execution profiling is a hard gate before enabling production requests.
7. **Data disclosure:** supplied bytes are part of execution input; do not use personal data, secrets or privileged case materials.

## Required verification gates

- Confirm exact stable Studionet GenVM runner and supported fee/SDK toolchain from authoritative release sources.
- Execute a two-party fictional case flow on the supported local runtime and demonstrate evidence-root equality, accepted judgment, validator decision-field disagreement, malformed output and failed-state preservation.
- Inspect actual transaction statuses, failed execution results and finalized successful receipt; keep case authority and transaction finality separate.
- Profile maximum bounded packet and deployment; establish a reviewed GEN cost ceiling.
- Complete independent contract/security and legal-policy review before enabling any production-facing write adapter.
- Keep frontend adjudication disabled until these gates pass and a specific deployment manifest is verified.
