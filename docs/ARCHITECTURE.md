# PrecedentOS Architecture

**Status:** approved MVP architecture proposal (2026-10-12)  
**Target:** GenLayer stable Studionet, chain ID 61999  
**Scope:** planning only. This document records verified platform patterns and explicitly marks implementation details that still require verification against the selected SDK/runtime.

## Product boundary

PrecedentOS is a precedent-aware decision research protocol. Its MVP demonstrates an Intelligent Contract doing bounded, AI-assisted comparison and persisting a result accepted through GenLayer's validator consensus process. Consensus means the result passed the contract's configured equivalence/validation rule. It does **not** guarantee legal correctness, source authenticity, completeness, jurisdictional applicability, or binding force.

Use fictional, publicly shareable test cases only during MVP development and Studionet verification. Never place complete case documents, names, personal data, confidential material, or private evidence on chain. No interface or contract should describe the output as a court judgment or legally authoritative finding.

## System map

```text
Frontend
  ├─ record registration and transaction status
  ├─ choose two registered precedents and supply bounded evidence + criteria
  ├─ show evaluation, consensus/finality status, provenance, and limitations
  └─ off-chain search, analytics, graph, lineage, and counterfactual UI

Off-chain API / indexer
  ├─ validates and hashes fictional source documents and evidence packets
  ├─ submits/reconciles transactions through the verified Studionet client
  ├─ indexes finalized registry/evaluation records for corpus-wide retrieval
  └─ owns future retrieval, graph projections, analytics, and simulations

GenLayer Studionet
  ├─ PrecedentRegistry: append-only precedent commitments and evaluation references
  └─ PrecedentEvaluator: bounded AI comparison + Equivalence Principle validation
```

The frontend can call supported public contract methods directly through a compatible GenLayer client; a small API/indexer is useful for hashing, pagination/search projections, transaction reconciliation, and future extensibility. The index is rebuildable and never authoritative over finalized contract state.

## Logical on-chain components

### 1. PrecedentRegistry

One Python Intelligent Contract, with minimal bounded storage:

- Append-only registration of a unique precedent ID, content digest, schema/version, submitter, and small versioned metadata fields (for example fictional jurisdiction label, decision date, category, and tags).
- Bounded public views for record lookup and evaluator authorization/validation.
- Append-only references to evaluations that concern registered records, keyed or linked to the evaluation's stable identifier and contract address.
- No update/delete of an existing judgment record. Corrections or superseding versions are new records linked to the earlier ID.

Use no complete case texts, personal information, evidence, embeddings, model prompts, or source URLs on chain. Define canonical encoding and digest algorithm/version before code is written. A digest is an integrity check for supplied bytes, not proof of who authored them or whether they are true.

**Cross-contract reference strategy:** the evaluator stores its accepted evaluation result as the primary canonical result. After that evaluation is finalized and read back, a separate Registry write links its ID to the two precedent IDs. Registry should validate the evaluator address and/or read the evaluator's finalized public view if the confirmed API permits it. The UI reports the two transaction statuses independently and does not show a completed Registry link until it is confirmed. This avoids assuming synchronous writes across Intelligent Contracts. An asynchronous `emit` pattern is documented, but would create a child transaction and lifecycle of its own; use it only if verification proves it is preferable and its failure handling is designed.

### 2. PrecedentEvaluator

One Python Intelligent Contract for bounded, evidence-grounded comparisons:

- Accept two Registry record identifiers, a size-bounded evidence packet consisting of fictional/publicly shareable passages and their source/digest references, and explicit versioned evaluation criteria.
- Verify both records exist and are eligible for evaluation using the Registry's documented synchronous `view()` interface or another verified mechanism. Reject identical IDs unless product rules explicitly allow them.
- Run non-deterministic LLM analysis inside a documented Equivalence Principle path. Return a constrained structured result with categories such as `material_similarity`, `possible_contradiction`, `insufficient_evidence`, or `no_material_relation`, plus concise reasons and evidence-span references. Never ask for or store a binding legal conclusion.
- Have validators independently rerun the same bounded evaluation against the same supplied evidence and criteria, then compare decision-bearing fields using an appropriate comparative/custom validator pattern. The rule should require exact agreement on categorical outcome and relevant IDs/schema, with explicitly defined treatment for rationale variation. Validators must not merely check that leader output is valid JSON or inside allowed enums.
- Persist only the accepted structured result, pair of precedent IDs, evidence-packet digest, criteria/schema version, and bounded rationale/citation references. Keep source passages off chain unless a specific public-data need and limit are approved.

The evaluator's transaction caller supplies evidence, but caller identity and consensus do not make that evidence authoritative. The evaluation must record which evidence digest and criteria version were evaluated; the UI must preserve the evidence provenance and label the result as a consensus-backed research signal.

### Semantic comparison and consensus

The Equivalence Principle is a contract-defined acceptance rule for potentially varying outputs. Comparative patterns can ask validators to independently run a task and decide whether leader and validator outputs meet a stated principle. This is **semantic equivalence of outputs under that principle**, not GenLayer's built-in legal-similarity oracle or a universal semantic distance score. Precedent similarity/contradiction is the task being evaluated; validator consensus on that task is a separate step.

Use a structured outcome so consensus does not depend on free-form prose. A candidate pattern to validate during Stage 0 is `prompt_comparative` or `run_nondet_unsafe` with an independently rerun task and comparison rule. Exact callable signatures, supported nested result types, output limits, and cost must be verified against the current Studionet runner. Do not use undocumented internal APIs in the first implementation.

## Off-chain MVP components

- **Corpus-wide retrieval/indexing:** metadata and keyword search over finalized Registry records, with a rebuildable projection. Candidate ranking is outside contract execution.
- **Evidence preparation:** document parsing, passage selection, digest calculation, and size validation occur off chain/client-side. Evidence included in an evaluation transaction remains visible in calldata/validator execution; send only fictional public examples in MVP.
- **Analytics:** off-chain aggregation over confirmed registry and evaluation records.
- **PrecedentDependencyGraph / JudgmentLineage:** off-chain projection of explicit, sourced record/evaluation relationships, with typed edges and reviewer provenance.
- **CounterfactualSimulator:** off-chain exploratory scenarios, clearly labeled hypothetical and separate from persisted consensus-backed evaluations.
- **Future SimilarityCourt / ContradictionEngine:** candidate generation and corpus-level scoring stay off chain. They can submit selected, bounded candidate pairs to PrecedentEvaluator; this preserves a path to consensus-backed pairwise evaluation without unbounded on-chain retrieval.

No service is split into microservices for MVP. Keep modules behind interfaces so retrieval, storage, and model providers can change without changing contract state schemas.

## Frontend MVP

Provide wallet connection, fictional precedent registration, transaction status, metadata/keyword record list, pair selection, evidence and criteria entry, evaluation submission, and evaluation detail. Display:

- contract address, chain ID, transaction references, and accepted/finalized state as provided by verified APIs;
- precedent IDs and digests, evidence-packet digest, criteria version, and source references;
- the structured evaluator result and bounded rationale;
- Registry evaluation-link status separately from Evaluator result status;
- explicit notice that consensus is not a guarantee of legal correctness or authority.

## Security and data requirements

1. **Public-data-only gate:** all fixtures and evidence are fictional and approved for public sharing. Reject confidential or personal information. No full document uploads to contract inputs.
2. **Bounded inputs:** define and enforce limits for metadata fields, evidence bytes/passages, criteria length, number of citations, result rationale, and evaluations per record. Verify limits against actual Studionet/runtime/transaction constraints.
3. **Untrusted evidence and prompt injection:** treat supplied text as data, not instructions. Separate task/criteria from quoted evidence; test adversarial passages, malformed encodings, empty inputs, conflicting excerpts, and unsupported claims.
4. **Independent validator work:** validators must examine the same evidence and criteria and independently rerun or assess the evaluation. Reject leader-output-only schema checks. Define disagreement, timeout, error, and insufficient-evidence behavior.
5. **No correctness overclaim:** outcomes are advisory research signals. Preserve source references, digest, criteria version, and any human review. Do not claim validator agreement establishes legal truth.
6. **Identity and record quality:** submitter addresses are not verified court or publisher credentials. Keep source authenticity and publisher authorization as explicit unresolved governance questions.
7. **Append-only governance:** no hidden edits. Corrections are linked new records/results. Document deployer/admin rights and decide whether contracts are frozen or upgradeable before deployment; privileged code changes can alter behavior.
8. **Replay and duplicate handling:** use unique IDs and schema versions; protect against accidental duplicate registration/evaluation. Confirm whether a deterministic nonce or caller-supplied ID is the appropriate pattern; do not rely on undocumented transaction context.
9. **Consensus lifecycle:** distinguish pending, accepted/non-final, rejected/undetermined, and finalized states according to verified Studionet APIs. An accepted result can differ from final state if the lifecycle permits later appeal/rotation.
10. **No arbitrary external fetches in MVP:** validators evaluate supplied evidence; contract code does not fetch user URLs. This reduces source drift, SSRF-like content risks, and inconsistent external results.

## Verified platform facts and documentation checks

Consulted official GenLayer docs on 2026-10-12:

- **Verified:** stable hosted Studionet is chain ID 61999; `studio-dev` is a separate release-candidate network (61997). [Studio environments](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio) [Network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- **Verified:** Intelligent Contracts are Python `gl.Contract` classes with typed state and public view/write methods. [Introduction](https://docs.genlayer.com/developers/intelligent-contracts/introduction)
- **Verified:** non-deterministic LLM work uses the Equivalence Principle; storage writes happen after the nondeterministic result returns; nondeterministic execution cannot directly read storage. [First contract](https://docs.genlayer.com/developers/intelligent-contracts/first-intelligent-contract) [Non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- **Verified:** comparative and custom validator patterns exist. Validators must independently verify the answer using evidence, not merely validate the leader's structure. [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- **Verified:** contract-to-contract synchronous view calls and asynchronous emitted write messages are documented. Emitted messages queue child transactions; they do not synchronously return a result. [Interacting with Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/features/interacting-with-intelligent-contracts) [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages)
- **Verified:** GenLayer's SDK exposes write calls through consensus and read-only views; a read/simulation is not itself a finalized transaction. Specific client methods differ by SDK language/version. [GenLayer JS contract methods](https://docs.genlayer.com/api-references/genlayer-js/contracts) [Reading data](https://docs.genlayer.com/developers/decentralized-applications/reading-data)
- **Verified:** Studio behavior has fee and live-network parity limitations; validate fee and lifecycle assumptions using the correct current Studionet configuration. [Studio limitations](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/limitations)

**Must verify before any implementation code is written:**

- Exact current GenLayer Python SDK/runtime version and the supported method signatures for `prompt_comparative` or `run_nondet_unsafe` on stable Studionet. Prefer documented public APIs; the docs show some internal template imports as unstable.
- Whether evaluator can call Registry views in the proposed method context, what return values can cross that boundary, and how to prepare/copy bounded values for nondeterministic execution.
- Which structured value types are supported as call arguments, closure returns, consensus outputs, and persistent storage values; determine safe serialization and storage schema.
- Current Studionet limits for transaction calldata, persistent storage, nondeterministic input/output, model context, compute, fees, rotations, and transaction lifecycle/finality/appeals.
- Exact SDK/RPC fields and status transitions needed by the frontend/indexer to determine accepted versus finalized results.
- Whether contract/interface patterns used for Registry-to-Evaluator references are supported and efficient. Avoid relying on async `emit` until its child-transaction fee and failure lifecycle are explicitly tested.

No SDK method name, transaction state name, maximum size, or cost is treated as implementation-ready merely because an analogous API appears in another SDK/version.

## Future extension seams

- `SimilarityCourt` can create candidate lists off chain and request bounded pairwise evaluation from PrecedentEvaluator.
- `ContradictionEngine` can prepare sourced, narrow comparisons and consume evaluator outputs; its corpus search and reviewer queue remain off chain.
- `CounterfactualSimulator` remains an off-chain scenario module with an explicit hypothetical label.
- `PrecedentDependencyGraph` and `JudgmentLineage` can project registry references, explicit citations, evaluation outcomes, and reviewed relationships into graph views.
- Analytics can aggregate confirmed evaluation outcomes and reviewer dispositions, subject to public-data, access, and re-identification controls.

These names are extension modules, not commitments to create one contract or service per feature.
