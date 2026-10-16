# PrecedentOS 2.0 Security Model

**Status:** threat model for the implemented fictional-case prototype; specific controls are identified in the matrix below, while live-runtime assurance remains incomplete.
**Data rule:** all present development/Studionet fixtures are fictional and public. Assume all contract calldata, storage, prompts, votes/results, source links, and addresses are public or reconstructable.

## 1. Assets and trust boundaries

### Assets

- integrity and immutability of precedent/evidence/evaluation/case IDs and digests;
- correctness of state transitions, parties, versions, deadlines, freeze guards, appeal caps, and authority edges;
- availability and cost of GenLayer execution under bounded LLM/Web Render work;
- provenance of public source/evidence snapshots and timestamps;
- accurate presentation of consensus, transaction finality, and case finality;
- user wallet authority, account, chain, and submitted arguments;
- user privacy: no personal, confidential, privileged, or credential-bearing material on public chain.

### Trust boundaries

- **Contract inputs are hostile**, including valid JSON with false decisions and evidence text containing prompt injection.
- **LLM output is non-deterministic and untrusted.** Parsing/enum validity is only a structural gate. Validators must independently reproduce or check decision-bearing values.
- **Validator consensus is an execution acceptance mechanism, not legal correctness or truth.** Validators can share data/model/provider biases, rely on the same inaccurate evidence, or fail/time out.
- **Wallet address is not identity.** It proves key control for a transaction, not party status outside the protocol or authority to represent another person.
- **Browser is untrusted.** LocalStorage, fixture data, manual addresses, transaction cache, client timestamps, and UI controls can be edited.
- **Web source is hostile and mutable.** Rendering may expose validators to prompt injection, malicious content, redirects, unavailable pages, and differing content.
- **Stable network/runtime is unresolved.** The pinned SDK and cached GenVM lint do not prove compatibility with the current stable Studionet runner, fees, or live RPC.

## 2. Threat register

| Threat | Impact | Required mitigation / evidence |
|---|---|---|
| Caller supplies an unregistered, wrong, or stolen precedent ID/digest | False provenance or evaluation claim | CaseCourt must verify Registry address/schema, keyed record existence, and digest via a proved cross-contract view. Until then, label IDs caller-supplied/unverified; do not imply registration. Runtime two-contract proof is a hard gate. |
| Hash supplied does not commit to evaluated bytes | Result bound to a misleading evidence label | Deterministically compute SHA-256 over canonical exact UTF-8 bytes in the contract or verify against submitted bytes; version canonicalization; cross-language vectors; reject mismatch before AI execution. Existing Evaluator does this for its two passages. |
| Valid JSON with incorrect classification | Incorrect decision persists | Revalidate leader output and have validators independently rerun the same task, compare classification/status plus all decision-bearing booleans/fields. Test individual field disagreement and inconsistent combinations. Existing Evaluator is a pattern, not proof of CaseCourt consensus. |
| Model disagreement / validator timeout / malformed answer | State partial write or stuck case | Perform all validation and Equivalence Principle call before state mutation. Invalid/disagreeing result is not persisted as an accepted decision; transaction and application states distinguish retry/failed/undetermined. Test actual runtime rollback and retries. |
| Prompt injection in passage or rendered page | Model follows attacker instructions | Delimit/JSON-escape evidence, treat as data, strict criteria outside content, no tool instructions from evidence, no dynamic code or URL action derived from model output, bounded output. Adversarial test corpus; residual model risk remains. |
| One party freezes indefinitely to censor outcome | Case liveness loss | Strict party authorization, qualifying grounds + evidence digest, bounded expiry, and a permissionless party-triggered timeout lapse. Refiling after `LAPSED_TIMEOUT` uses fresh IDs and is capped at four total attempts; merits depth remains two. Direct Mode tests cover timeout/refile. The opposing-party reviewer is not independent, a stalled freeze can last through its timeout, and native finality/deadline anchoring remains unverified. |
| Freeze UI only / alternate method bypass | Protected state changes while “frozen” | Every state-changing entry in the same CaseCourt checks freeze + version + phase. Test every public write while frozen. External integrations must independently check CaseCourt; no global guarantee. |
| Replay old decision, appeal, or evidence action | Duplicate/reopened stale transition | Caller-supplied unique action ID, monotonic case version, bound prior decision digest, per-party/per-level counters, evidence version key, idempotent finalized callbacks. Fuzz duplicate calls and concurrent same-version submissions. |
| Deadline manipulation via local clock or pending native appeal | Premature closure or unfair loss of appeal right | Use transaction-context time only; do not trust browser time or sender time. Determine activation at parent GenLayer `FINALIZED`; prove any `emit(on='finalized')` callback end-to-end. Until then deadline implementation is blocked. |
| Conflating protocol appeal with case appeal | Misleading due process / status and incorrect deadline handling | Separate identifiers, screens, APIs, and tests. Native appeal rechecks protocol transaction outcome; case appeal reviews case grounds under CaseCourt policy. Both may occur at different times. |
| Reversal overwrites history or falsely claims legal authority | Hidden rewrite or unjustified status | Append only typed relation tied to final CaseCourt decision digest; never mutate old precedent; display scope, status, source and protocol chain; legal authority remains an external question. |
| Web Render SSRF/private network access/credential URL/redirect | Internal-service access, secret leakage, validator compromise | Use only documented GenVM rendering, reject non-HTTPS, userinfo, secret-like query parameters, localhost/private/reserved literal IPs; test redirect/DNS/private-IP behavior; require runtime egress restrictions. Do not assume renderer provides these mitigations. Fail closed. |
| Dynamic website differences between validators | False accepted proof or perpetual disagreement | Capture bounded canonical output; evaluate material fields, not raw unstable HTML unless exact byte identity is required. If material output differs or source unavailable, return no evidence/insufficient; test stable and mutable pages. |
| Public chain stores sensitive evidence, URL tokens, or personal data | Permanent privacy/legal harm | Fictional/public-only policy, client redaction and explicit preview, no full documents, no PII, reject credentials and sensitive URL parameters. On-chain public data is not deletable. |
| Unbounded storage, loops, model prompts, or repeat evaluations | Cost/liveness grief | Fixed max bytes/items, no corpus-wide loops in contract, bounded page sizes, one evaluation per stage/version, explicit prompt/output limits, storage/failure-cost profile tests. Do not claim caps until measured on selected network/runtime. |
| Fee exhaustion / appeal grief / gasless assumption | Case write failures or financial loss | Verify stable fee model, profile each representative branch and appeal path, show explicit cost before wallet signature, read current appeal quote if native appeal; do not hardcode fee/appeal bond. SDK v1.1.8 has no verified current fee API in this project. |
| Unauthorized DAO/agent or confused deputy | Agent acts as party/admin or escalates permissions | Same on-chain role checks for wallets/contracts; no API-key trust; explicit per-case capabilities and expiry; no agent may override freeze/finality; verify `sender_address`/`origin_address` behavior for contract callers. |
| Reentrant/cross-contract async callback duplication | Duplicate transitions or bypass | Keep protected writes local to CaseCourt. If using messages, bind case version/decision digest, idempotency key, correct `on='finalized'`, and prove callbacks cannot be forged/replayed. Do not depend on unverified cross-contract writes. |
| Frontend stale account/chain or fake contract address | Wrong account/network write | Retain existing account/chain-event invalidation, chain ID 61999 guard, pre-write recheck, strict address parsing, verified code/schema/network confirmation, and no write when wrong/unknown. |
| Demo fixture mistaken for chain result | False public claim | Explicit demo labels and separate fixture paths; no fake addresses, timestamps, validator results or receipts; transaction status from pinned SDK only; loaded local traces demoted to unverified notes. |
| Stored address/transaction history altered in localStorage | False source or status | Treat localStorage as non-authoritative, re-read keyed chain data and transaction lifecycle; validate response schema; never use cache as authorization. Existing frontend does this for restored transaction traces. |
| No corpus discovery without indexer | Incomplete or expensive graph/search | Add bounded on-chain sequence pagination and direct browser reads; include coverage/cursor indicator; compute graph/search client-side only over fetched pages. No full coverage claim from partial cache. |

## 3. Authorization requirements by action

| Action | Minimum contract authorization |
|---|---|
| Open case | Caller becomes petitioner; respondent is explicitly named; duplicate case IDs blocked. Naming a party does not authenticate identity. |
| Append evidence | Named party or explicit case-scoped agent/DAO capability; evidence window and schema valid. |
| Request/execute AI assessment | Permissionless trigger after a locked evidence phase is acceptable because contract controls task/criteria; one call per stage/version and bounded inputs. Economic policy still needs review. |
| Challenge / freeze request | Named party only, within correct window, correct current decision digest, bounded grounds. Freeze cannot be requested by arbitrary readers. |
| File ordinary appeal | Named party only, correct level, one appeal per party/level, not expired, prior decision digest matches. |
| Decide appeal | Permissionless execution trigger; contract deterministically selects pinned evidence/criteria; validators compare decision fields. |
| Finalize/close case | Permissionless after state/deadline conditions; caller cannot select or rewrite outcome. |
| Exceptional review | Named party; one attempt per party/final decision; new evidence digest plus allowed grounds; no erase or silent reset. |
| Record reversal/supersession | Only as a derived append-only action after eligible CaseCourt decision validation; never arbitrary UI/agent write. |
| DAO/AI agent invocation | No special role by label. Must use an explicitly stored case capability set by the documented authorization path; key rotation/revocation requires a new append-only authorization action. |

If a DAO adapter, dispute arbitrator, guardian, deployer admin, or emergency override is added, define address, powers, quorum, timelock, revocation, and compromised-key process before implementation. Stage 0 proposes no superuser override.

## 4. Secure AI evaluation rules

- Run one bounded leader task and an independently executed validator task against identical bytes, criteria, schema and version inputs.
- Define a canonical decision schema and total deterministic rules for consistency among classification and flags. Required fields, types, enums and bounds are validated in both paths.
- Validators compare the fields that determine a case action (status, issue match, evidence sufficiency, outcome bucket, contradictions/material differences); narrative can differ but remains bounded.
- Validator failures, exceptions, timeouts, malformed responses, and field disagreement reject the proposed execution or produce the documented no-decision path. Never write state before accepted result is returned.
- Preserve exact prompt version, criteria version, evidence root, and commitment so later assessments can be compared.
- Test prompt injection, conflicting passages, incomplete records, hallucination-sensitive claims, inconsistent flags, model output overflow, leader/validator disagreement, and repeated failures.
- UI calls results “AI-assisted protocol assessment,” not “court ruling,” unless the product explicitly labels a case-process output; even then it is not legal authority.

## 5. Release security gates

No Studionet write/deployment until all are true:

1. Live read-only `eth_chainId` returns `0xf22f`; endpoint and environment are stable Studionet, not Studio-dev 61997.
2. Exact stable GenVM runner hash/runtime, Python SDK, CLI, pinned GenLayerJS and fee flow are verified from authoritative sources and compatible artifacts.
3. Both existing contracts pass regression tests and lint using that verified runner; all new contracts pass same.
4. Cross-contract Registry read and finalized callback probes pass a real supported local integration environment; no mock-only evidence is counted.
5. Every public write has bounded input/cost profile and passes authorization, replay, failure-atomicity, freeze, deadline, and state-machine adversarial tests.
6. Source hash, schema, deployer address, and fictional demo calldata are independently reviewed; deployment and writes receive separate explicit user approval.

## 6. Security review ownership and outputs

Each implementation stage produces: method authorization table, state invariants, abuse cases, test evidence, remaining trust assumptions, byte/cost bounds, and a testnet/live evidence label. A product/legal reviewer approves due-process policy and user-facing claims separately from code reviewers. A passing linter, mocked Direct Mode test, or successful validator agreement must not be represented as a security audit or legal review.
