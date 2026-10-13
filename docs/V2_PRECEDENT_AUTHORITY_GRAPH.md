# Stage 6 — Precedent Authority Graph

## Record format and append-only behavior

CaseCourt now appends versioned graph records with exact source and target kinds, IDs, versions and commitments, relation type, source of authority, supporting commitment, optional challenge reference, submitter, chain/Court identity, transaction timestamp, deterministic edge ID and edge commitment. `get_authority_relationship(sequence)` and `get_authority_relationship_count()` are bounded keyed reads. Edges are never edited or deleted; a changed authority state adds another edge.

Supported relations are `CITES`, `SUPPORTS`, `DISTINGUISHES`, `CONFLICTS_WITH`, `CHALLENGES`, `UPHOLDS`, `REVERSES`, `SUPERSEDES`, and `REMANDS_TO`. Self-links are rejected. Supersession traversal is bounded by the 128-edge global cap and is keyed by record kind and ID so same-string IDs from different namespaces do not collide.

## Provenance classes

| Class | Contract handling | Display status |
|---|---|---|
| User asserted | Permitted for non-authority relations by a named participant in the source case. Cannot assert reversal/supersession/remand. | `USER_ASSERTED_UNVERIFIED` |
| AI proposed | Requires an existing accepted contradiction assessment for the exact same ordered record pair and matching classification. | `AI_PROPOSED_NOT_AUTHORITATIVE` |
| Locally validated | Not accepted as a contract authority source; browser/local checks cannot create on-chain authority. | Client-only label; never authority. |
| CaseCourt appellate record | For an already resolved CaseCourt ruling only; relation and target must match the ruling outcome and exact original judgment or remanded case. | `CASECOURT_APPELLATE_RECORD_REQUIRES_FINALITY_PROOF` |

The term “accepted” in the last row refers to the contract-recorded appellate transition, not stable Studionet transaction finality. No source is labeled legally authoritative or finalized by this feature.

## Deterministic edge IDs

Edge IDs use UTF-8 SHA-256 with byte-length-framed fields, domain `PrecedentOS-AUTHORITY-EDGE-ID-v1`, chain and CaseCourt addresses, and the complete ordered source/target identities, versions, commitments, relation, authority source, and supporting commitment. A repeated exact edge is rejected. The stored edge commitment also binds sequence, provenance status and challenge reference.

## Limits

- Maximum 128 edges per CaseCourt deployment, globally.
- Relation targets must be existing CaseCourt records; no external Registry/Evaluator IDs are resolved.
- `APPELLATE_RECORD` may only produce `UPHOLDS`, `REVERSES`, `SUPERSEDES`, or `REMANDS_TO` consistent with an already resolved ruling.
- `LOCAL_VALIDATED` requests are rejected on-chain.
- No corpus enumeration or graph indexer is introduced; the UI only renders fictional fixtures.

## Status

**IMPLEMENTED / LOCALLY TESTED** for exact reference validation, provenance labeling, duplicate/self-link rejection, bounded capacity, and cycle helper behavior. Tests use Direct Mode and an internal seeded graph fixture for the traversal helper; no graph transaction has run on a GenLayer node. Cross-contract authority, live history enumeration, and finality remain **BLOCKED**.
