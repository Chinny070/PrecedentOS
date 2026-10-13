# Stage 5 — Source Comparison Equivalence

## Two distinct operations

### Capture verification

Leader and validator independently render the same registered URL and extract structured claims. The custom validator validates exact schema, enum/bounds, excerpt membership and digest fields, then compares:

- case/source/version, URL digest and retrieval status;
- exact rendered body digest and prior body digest;
- source-change class and evidence sufficiency;
- excerpt commitment and a sorted signature of `(fact_kind, polarity, SHA256(exact excerpt))`.

Finding and reasoning prose need not be byte-identical. Exact body digest agreement intentionally makes page drift between leader and validator a failed equivalence result rather than accepting semantically similar summaries from different pages.

### Cross-source comparison

Only two committed sufficient observations with the same case or appeal binding can be compared. The custom result schema identifies relation (`SUPPORTS`, `CONFLICTS`, `NOT_COMPARABLE`, `INSUFFICIENT_EVIDENCE`), sufficiency, source-conflict bit, and bounded cited claim-pair indexes. `CONFLICTS` requires at least one in-range pair; the other classes prohibit conflict pairs. The custom validator compares these decision-bearing fields but does not require identical prose.

Input and result commitments bind both source identities, URL digests, source verification commitments, and distinct content digests. Similar model descriptions cannot collapse different page bodies into an “equivalent source.”

## Interpretation boundary

Validator agreement establishes only that the configured equivalence condition accepted the submitted output under the runtime. It does not establish source truth, authoritativeness, legal admissibility, unbiased model reasoning, or correctness of a legal conclusion. Actual consensus and transaction finality have not been observed.

## Status

| Property | Status |
|---|---|
| Bounded contract comparison / custom decision-field validation | **IMPLEMENTED** |
| Adversarial and conflict tests | **LOCALLY TESTED** with Direct Mode mocks |
| Real validators independently rendering the same page | **BLOCKED** |
| Semantic truth/correctness guarantee | **NOT PROVIDED BY DESIGN** |
| Stable Studionet finality and rollback | **BLOCKED** |
