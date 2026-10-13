# Stage 5 — Evidence Provenance and Integrity

## Provenance states

Registering a URL creates a **candidate**, not evidence. The record commits to case ID, source ID/version, schema, case-or-appeal binding, evidence ID, canonical URL digest/host, previous content digest, chain/Court identity, proposer and protocol timestamp. A counterparty must approve the candidate before the request can proceed. The timestamp is a transaction-context observation; it is not proof of source publication time or current freshness.

The request record binds request ID, source version, URL digest, source commitment, attempt number, requester and request time. A caller can submit an unavailable report, but the provenance clearly labels it as a participant assertion. Only a future real Web Render execution accepted by the custom equivalence check can be recorded as `GENLAYER_WEB_RENDER_EP_ACCEPTED_REQUIRES_FINALITY`; even that label still requires a successful finalized transaction receipt before a client may call it finalized.

## Commitment chain

The contract uses UTF-8 SHA-256 and byte-length-framed field sequences (`<utf8-byte-length>:<field>` concatenation) for domain-separated records. The shared JSON fixture binds the Python and browser mirrors for:

1. source registration, including its protocol-observed registration time;
2. retrieval request, including requester, attempt and request time;
3. capture input, including the request commitment and criteria version/digest;
4. ordered claims and exact excerpts;
5. verification record, including page content digest, capture time, freshness/change labels, evidence references, status, and an opaque reasoning digest;
6. source-comparison input;
7. comparison result, including comparison time.

Page content digest is over the exact UTF-8 bytes returned by the renderer. Each accepted excerpt must be an exact substring of those bytes’ decoded text. The evidence item linked to a case/appeal is a deterministic join of accepted excerpts; its evidence digest and `source_reference_digest` point to the immutable verification commitment. Cross-case replay changes the committed case/court/source context and the storage key namespace.

Full documents are not persisted. The contract stores bounded URL and extracted finding/excerpt material only when capture is enabled and sufficient. Source versions cannot change URL identity or case/appeal binding. The previous observed page digest is kept to classify first, unchanged, changed or unknown. “Observed at capture” is not a freshness guarantee; no unverified wall-clock expiry is applied.

## Important limits

- A hash proves byte consistency against the committed representation, not who authored it or whether it is true.
- Counterparty approval is not institutional source authentication or legal admissibility.
- Current runtime has not demonstrated a live render, validator agreement, finality, or write rollback.
- Stage 5 direct tests use fictional data and monkeypatched renderer/model behavior.

See `tests/fixtures/web_evidence_commitment_vectors.json`, `precedentos_protocol/web_evidence.py`, and `frontend/src/lib/genlayer/webEvidenceCommitments.ts` for the common vectors and mirrors.
