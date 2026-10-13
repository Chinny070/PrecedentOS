# PrecedentOS 2.0 — Case Appeal Protocol

**Protocol status:** versioned Stage 2 filing schema implemented for a first-level challenge. Admission deadlines, merits decisions, higher appeals and case finality are design-only because decision authority and finality anchoring are unverified. A PrecedentOS case appeal is separate from GenLayer's native appeal of a transaction.

## Roles and terminology

- **Parties:** the petitioner and respondent addresses stored by CaseCourt. This proves control of keys only, not legal identity, service, capacity or representation.
- **Decision submitter:** the participant address that attached the current opaque decision reference. The existing first-level challenge rejects that same address; it does not prove the referenced decision is real.
- **Appeal filer:** the named party adverse to the decision. The initial implementation allows only the other named party to file the first challenge.
- **Review panel:** a future, separately configured and auditable authority. No appeal reviewer, DAO, judge identity, or AI merits method is currently configured or implemented.
- **Transaction appeal:** GenLayer protocol-level validator/leader appeal that challenges a transaction's consensus result. It does not decide the PrecedentOS case merits.

## Proposed end-to-end flow

| Stage | Proposed rule | Current implementation |
|---|---|---|
| 0. Decision binding | Bind a case-specific decision to the exact locked evidence root and trusted source contract. | Opaque ID/digest accepted from a participant and marked `UNVERIFIED_CALLER_ASSERTION`; no case-bound decision record exists. |
| 1. Appeal window | Start a policy-versioned window only after the source decision transaction is verified `Finalized`. Proposed default: 7 days, subject to legal/due-process review. | No case deadline. Stage 1 transaction datetime is recorded, but cannot prove a previous transaction's finality. |
| 2. Filing | One named opposing party may file; bind decision ID/digest, grounds code, grounds commitment, optional new-evidence commitment, parent appeal ID, policy version and unique appeal ID. | `challenge_decision` files the first-level entry using the existing compatible arguments; current file is `FILED_UNADJUDICATED`. |
| 3. Structural admission | Deterministically check party, exact active decision, supported ground, window, replay key and new-evidence requirements. Invalid filings reject with no state change. | Party, phase, expected version, replay ID, ground enum and digest syntax are checked. No deadline, Registry lookup or evidence-bytes validation occurs. |
| 4. Provisional protection | When an appeal is admitted, automatically freeze case-local mutations until the appeal resolves or the bounded emergency limit expires. Allow a separate discretionary short freeze where a party shows irreparable procedural risk. | Existing optional one-time 24-hour participant-requested freeze after a challenge. It is not automatic and does not gate Registry/Evaluator or external actions. |
| 5. Merits review | Independent review under a versioned standard; a reviewer must see the same locked evidence plus admissible new evidence. AI may assist only after independent Equivalence Principle checks and a real runtime proof. | No admission result, panel, AI review or merits method. |
| 6. Outcome | Append `UPHOLD`, `REVERSE`, `REMAND`, or `DISMISS` with reviewer identity/authority, reasons digest, evidence root, decision digest, schema/policy version and transaction time. | No appeal disposition is implemented. Filing remains `FILED_UNADJUDICATED`. |
| 7. Further review | Permit one ordinary second-level appeal from a finalized first-level disposition. Permit one exceptional reconsideration for fraud, dispositive newly discovered evidence, jurisdictional defect or manifest procedural denial; require a higher threshold and no duplicate ground/evidence. | Multi-level and exceptional transitions are not implemented. They must not be simulated by editing the appeal record. |
| 8. Closure | Close only after the final case decision and every transaction that supplies it are finalized and all case-level windows are closed. Preserve all prior decisions and relations. | No case-final state, closure method, or finality callback. |

## Appeal grounds and evidence policy

The current supported codes are `NEW_EVIDENCE`, `MATERIAL_ERROR`, and `PROCEDURAL_CONCERN`. A later reviewed policy may add `JURISDICTIONAL_ERROR` and `BINDING_AUTHORITY_CONFLICT`; codes must be versioned, bounded, and explicitly validated. Free-form grounds text is not stored. A public SHA-256 grounds commitment may point to an off-chain public document; no private case file or personal data belongs on chain.

For `NEW_EVIDENCE`, the future API should require a new evidence reference/digest, source and schema commitment, and a short statement why it was unavailable earlier. The source and full material remain off chain. The present `challenge_decision` accepts only `grounds_digest`; when the ground is `NEW_EVIDENCE`, Stage 2 stores that same digest in `new_evidence_commitment`. This is merely a caller-supplied commitment: it does not prove that new bytes exist, that they hash to the digest, or that they are admissible. Do not present it as verified evidence.

## Admission, spam controls, bonds and access

The proposed case-level appeal is limited to the opposing named party, one active appeal per level, globally unique appeal IDs, per-case action caps and append-only history. The initial implementation uses the existing CaseCourt participant and replay guards. It has no external case fee or appeal bond.

Do not hardcode a case-level bond. GenLayer native transaction appeals have a separate protocol bond and induced-work funding quote; current official docs instruct clients to query the live charge. Applying that native charge to case-level appeals would be incorrect. Any separate case bond needs an approved due-process/anti-exclusion policy, fee-profile evidence, a verified refund path and a supported funding API. For this stage, quota/replay controls are the only spam control.

## Freeze rules

Current deterministic CaseCourt behavior:

- a named party may request one freeze after the first challenge is open;
- the request lasts at most 24 hours from the deterministic transaction timestamp;
- before expiry, only the requesting party may unfreeze it;
- after expiry, any caller may materialize the expired unfreeze;
- all other CaseCourt mutation methods reject while frozen;
- the challenge remains open when unfrozen.

This freeze does not undo or block an already-submitted transaction and cannot freeze other contracts, transactions, browser state, or an outside legal process. Because the challenge transaction itself is not linked to a verified/finalized decision, the freeze is not represented as an admitted appeal. Future automatic freeze should occur only after structural admission of a properly bound case appeal; emergency freezes require reviewable criteria, a short maximum duration, a reason commitment and a non-requester review/release path.

## Outcome and lineage rules for a later stage

- `UPHOLD`: retain current decision as the operative decision, append an upheld relation.
- `REVERSE`: append a new decision superseding the old one; never overwrite or delete.
- `REMAND`: return to a bounded earlier procedural stage with a new decision version and preserve all old decisions.
- `DISMISS`: close that appeal without deciding merits; distinguish procedural inadmissibility from merits rejection.
- `EXCEPTIONAL_RECONSIDERATION`: once-only, narrowly grounded, with a higher threshold and immutable link to the final decision it reopens.

An AI-generated report is advisory evidence. The reviewer/panel must be authorized by a verifiable policy; validator consensus means only that validators accepted the contract's equivalence rule, not that a legal outcome is correct or fair.

## Implemented schema

The `get_appeal(appeal_id)` view returns the immutable first-level filing written during `challenge_decision`: appeal/schema ID, level `1`, empty parent ID, status `FILED_UNADJUDICATED`, appellant, original decision reference/digest, ground code/digest, optional new-evidence commitment and transaction datetime. There is no method to alter or delete it. The schema does not include deadlines, admission, reviewer, bond, outcome, or finality because those semantics are not yet supportable.

## Stage gates

1. Prove Court-to-decision and Court-to-Registry view reads with two independently deployed ICs and existing/missing/mismatch cases.
2. Add an immutable case-decision schema that binds the locked case evidence root; current Evaluator pair comparisons do not do this.
3. Prove a finality-triggered state update via documented child messages, including appeal/re-execution and idempotency tests.
4. Complete jurisdiction-specific policy review for window lengths, accepted grounds, panels, evidence access and due process.
5. Profile storage, transaction/finality operations and any bond/refund path on the selected runner before enabling production writes.

Until these gates pass, first-level entries are challenge filings only and remain visibly unadjudicated.
