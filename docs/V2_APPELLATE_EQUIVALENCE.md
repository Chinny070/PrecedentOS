# Stage 4 — Appellate Equivalence Principle

## Source-verified API pattern

The current official GenLayer documentation describes `gl.nondet.exec_prompt(prompt, response_format="json")` inside a leader function, `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`, and a validator that checks `gl.vm.Return`, independently re-runs or otherwise evaluates the same source data, and compares stable decision-bearing fields. Storage mutation belongs after the nondeterministic call returns. Current official pages:

- [Calling LLMs](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms)
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/messages)

The installed Direct Mode harness accepts this source pattern. This does not establish that the selected runner is the current stable Studionet runner or that the code has succeeded in a live validator round.

## Appellate answer schema v1

Exactly ten fields are accepted:

```json
{
  "outcome": "UPHELD | REVERSED | REMANDED | DISMISSED | INSUFFICIENT_EVIDENCE",
  "original_judgment_valid": true,
  "material_error_found": false,
  "evidence_sufficient": true,
  "reversal_justified": false,
  "remand_required": false,
  "case_state_change": "NONE | SUPERSEDE | REOPEN_REVIEW | DISMISS_APPEAL | NONFINAL_REOPEN",
  "applicable_criteria": ["JUDGMENT_VALIDITY"],
  "material_findings": ["Short bounded finding"],
  "reasoning_summary": "At most 500 characters"
}
```

There are at most four findings of 180 characters each, unique criteria from `JUDGMENT_VALIDITY`, `MATERIAL_ERROR`, `PROCEDURAL_FAIRNESS`, `EVIDENCE_SUFFICIENCY`, `REMEDY`, and a 500-character reasoning summary. No free-form result keys are retained.

## Outcome consistency table

| Outcome | Judgment valid | Material error | Evidence sufficient | Reverse justified | Remand | Required state field | Meaning in this protocol |
|---|---:|---:|---:|---:|---:|---|---|
| `UPHELD` | true | false | true | false | false | `NONE` | Existing CaseCourt judgment remains operative. |
| `REVERSED` | false | true | true | true | false | `SUPERSEDE` | Appellate ruling becomes the operative CaseCourt reference; original remains historical and is marked superseded in the case snapshot. |
| `REMANDED` | false | true | true | false | true | `REOPEN_REVIEW` | Material error is identified but requires a new first-instance review; state returns to explicit `REMANDED_REVIEW`. |
| `DISMISSED` | true | false | true | false | false | `DISMISS_APPEAL` | Appeal is rejected on its assessed grounds; original judgment remains operative. Structural ineligibility instead reverts before a filing is stored. |
| `INSUFFICIENT_EVIDENCE` | false (not affirmed) | false | false | false | true | `NONFINAL_REOPEN` | Record cannot support an appellate merits conclusion; case reopens for more evidence and a new review, not as a finding that the original was legally wrong. |

Contradictory combinations are rejected deterministically before acceptance. `REVERSED` and `REMANDED` require material findings. The model does not decide parties, appeal permission, target identity, evidence admissibility, deadlines, or who may resolve the state; contract rules do.

## Independent validator comparison

The custom validator rejects non-`gl.vm.Return` leader results, validates the leader schema and consistency again, independently reruns the same bounded prompt using committed original/appeal evidence, grounds, original result and criteria, then requires exact agreement on:

- outcome;
- original-judgment validity;
- material-error determination;
- evidence sufficiency;
- reversal justification;
- remand requirement;
- case-state-change instruction;
- applicable criteria codes.

Material findings and reasoning are bounded and committed but are not compared byte-for-byte because different wording can express the same agreed decision fields. No tolerance is applied to the decision fields. If independent outputs differ, validation returns false. Direct Mode tests mock both sides and can demonstrate the callback result only.

## Commitments

Length-prefixed UTF-8 SHA-256 framing domain-separates:

- the filing: appeal/case/target kind/ID/version/commitment/parent/appellant/grounds code/digest;
- appeal evidence: case/appeal/count and ordered evidence ID/digest/schema/source-digest entries;
- AI input: chain, Court address, exact target and original judgment, case version, both evidence roots, grounds digest/code, criteria/schema versions, appeal level and parent;
- ruling result: input commitment, schema version, all decision fields, ordered criteria/findings, and a SHA-256 digest of bounded reasoning.

The TypeScript and pure-Python mirrors use shared fixture vectors; Direct Mode also reconstructs the input/result commitments from actual contract records. Commitments make a later change detectable when the verifier has the expected bytes. They do not authenticate facts or make the model correct.

## Required proof before enabling a live UI path

1. Execute under a stable-compatible runner and capture actual leader/validator traces.
2. Cause a valid-JSON decision-bearing disagreement and observe an unsuccessful execution, including its actual receipt.
3. Verify that a failed/rejected validator round did not persist the ruling or release the appeal freeze.
4. Verify successful provisional and finalized receipt semantics independently of CaseCourt's `authority_status` string.
5. Profile maximum evidence/prompt cost and contract storage limits.

Until then the frontend appeal write gate is `DISABLED_RUNTIME_UNVERIFIED`.
