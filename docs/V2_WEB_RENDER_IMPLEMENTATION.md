# Stage 5 — Web Render Implementation and Gate

## Documented call shape

Current GenLayer docs show `gl.nondet.web.render(url, mode='html')` and the FetchWebContent example explicitly shows `mode="text"` with optional `wait_after_loaded`. They place external access in nondeterministic execution and explain that leaders and validators independently fetch/render. Sources: [Web Access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access) and [FetchWebContent](https://docs.genlayer.com/developers/intelligent-contracts/examples/fetch-web-content).

`CaseCourt.capture_web_source` uses that documented `render(url, mode="text")` call, then extracts at most three bounded claims using JSON `gl.nondet.exec_prompt`. Its custom `run_nondet_unsafe` validator independently renders/extracts and compares source identity, content digest, status, sufficiency, change class, excerpt commitment, and normalized fact-kind/polarity/excerpt-digest tuples. Reasoning prose need not match.

## Activation gate

`WEB_RENDER_RUNTIME_ENABLED` is `False`. The public capture method fails before requesting a renderer call. Direct Mode tests temporarily patch the module flag and renderer to test downstream logic only. No production config or browser control overrides the flag.

This gate remains because documentation does not prove for the selected stable runner:

- redirect behavior and whether the final destination is visible to contract code;
- DNS resolution/rebinding policy or enforcement against private, loopback, link-local, or metadata IPs;
- a maximum response size applied before the complete rendered body reaches the contract;
- renderer time, token, memory, and transaction-fee bounds;
- identical render service semantics on validators or rollback behavior on disagreement;
- actual stable Studionet runner identity and compatibility with this contract.

Contract-side URL checks reject non-HTTPS, userinfo, ports, query/fragment, escapes, non-ASCII syntax, dotted IP-like hosts, reserved/local suffixes, ambiguous paths, and malformed DNS labels. They cannot prevent a public DNS name resolving privately or a renderer following an unsafe redirect. Both-party approval is an authorization step, not an SSRF control.

## Failure and output handling

Rendered text is strict UTF-8, non-empty and capped at 10,000 encoded bytes after `render` returns. Claims must be exact substrings of that text, each excerpt is capped at 400 bytes, finding at 180, summary at 300, with at most three claims. These limits constrain contract-visible data only; they do not cap renderer work before return. Exceptions or failed custom equivalence write no successful verification through the tested Direct Mode path. Actual transaction atomicity must still be verified on the target runtime.

Caller reports for timeout/HTTP/render failures are kept separately as `CALLER_REPORTED_UNAVAILABLE`, with provenance `PARTICIPANT_REPORT_NOT_WEB_RENDER_PROOF`. They do not claim the protocol observed an inaccessible source.

## Status

| Capability | Status |
|---|---|
| Documented API call pattern | **DOCUMENTATION-CONFIRMED** |
| Contract implementation behind feature gate | **IMPLEMENTED** |
| Mocked Direct Mode extraction and validator path | **LOCALLY TESTED** |
| Stable runner and network egress behavior | **BLOCKED** |
| Live page render / finalized verification | **NOT STARTED** |
