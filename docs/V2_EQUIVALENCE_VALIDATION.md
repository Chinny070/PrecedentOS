# Stage 3B Equivalence Validation

**Status:** IMPLEMENTED as a custom `gl.vm.run_nondet_unsafe` validator; LOCALLY TESTED with mocked Direct Mode behavior; LIVE VERIFIED: NO.

## Execution

`CaseCourt.adjudicate_case` validates every deterministic input and evidence byte before entering the nondeterministic block. The leader function invokes the officially documented Python pattern `gl.nondet.exec_prompt(prompt, response_format="json")`, parses/validates the bounded judgment object, and returns only normalized fields. The custom validator requires a `gl.vm.Return`, independently calls the same analysis function against the fixed prompt/evidence, validates that result, then compares:

- outcome classification;
- evidence sufficiency;
- material issue determination;
- decision eligibility;
- relevant rule application;
- recommended outcome;
- applicable criteria list; and
- uncertainty flags.

Reasoning wording and material finding prose may vary, but their values are bounded, stored, and committed by the final judgment digest. Invalid/unsupported output or any disagreement in the decision-bearing fields returns `False`; validator exceptions are rejected. JSON well-formedness is only the first structural check and cannot by itself make an answer equivalent.

Only after `run_nondet_unsafe` returns an accepted normalized result does the method derive the result commitment and append the judgment/action and case snapshot transition. No caller-supplied model result parameter exists.

## Official API evidence

Current official GenLayer documentation confirms `gl.nondet.exec_prompt(..., response_format="json")` inside nondeterministic execution and custom `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` validation. It explains that validators execute independently and that deterministic state writes must occur after the nondeterministic block returns. References:

- [Calling LLMs](https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms)
- [Prompt and data techniques](https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts)
- [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [Error handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling)

These sources establish the documented API pattern, not compatibility with the unresolved stable Studionet runner or live consensus for this contract.

## Test boundary and unresolved semantics

Direct Mode tests mock LLM results. The harness allows a validator to be run separately and demonstrates a `False` result for a materially different classification/rule/outcome. It does **not** enforce validator disagreement as a real GenLayer transaction would, nor prove that disagreement or an unhandled runtime error rolls back on the deployed runner. Tests that show no persisted result after a leader/mock error prove only the harness execution path. Real leader/validator execution, appeal behavior, execution limits, cost and failure atomicity require a controlled local GenLayer runtime and then a separately authorized Studionet verification. No legal correctness claim follows from consensus acceptance.
