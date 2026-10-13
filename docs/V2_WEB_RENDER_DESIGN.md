# PrecedentOS 2.0 Web Render Evidence Design

**Status:** capability is documented by GenLayer; not integrated into the production contracts or verified against stable Studionet. The existing `/web-evidence` frontend route must remain disabled until the gates below pass.

## 1. Intended use

Web Render supplies a reproducible public-source observation to a fictional/public PrecedentOS case or evidence packet. It is not a truth oracle, a durable archive, legal authentication, or proof that a website's publisher is authoritative. All fetched content is untrusted data and can contain false claims or prompt injection.

For JavaScript-rendered pages, GenLayer's official Web Access documentation currently describes:

```python
gl.nondet.web.render(url, mode="html")
gl.nondet.web.render(url, mode="screenshot")
```

The HTML mode returns rendered page content; screenshot mode captures an image. The docs also show `gl.nondet.web.get` for simpler text access and `gl.eq_principle.strict_eq` around a render result. This verifies that the API/pattern is documented today, not that it is supported by the runner pinned in this project or stable Studionet. Source: [GenLayer Web Access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access) and [Fetch Web Content example](https://docs.genlayer.com/developers/intelligent-contracts/examples/fetch-web-content).

## 2. Proposed evidence flow

1. A case party chooses **Capture public web evidence** from a case evidence workflow. The browser previews the normalized URL and warns that request, URL, page content, prompt inputs, and contract outcome are public.
2. The contract validates an explicit URL policy before rendering. Initial policy proposal: HTTPS only; no embedded user/password; no local, private, link-local, loopback, reserved or literal-IP hosts; no URL fragments; reject sensitive credential-like query keys; bounded URL length; allow redirects only if every final target also passes policy. These checks are not a replacement for GenVM/network-layer egress restrictions.
3. A versioned CaseCourt write invokes `gl.nondet.web.render` within a bounded leader function. The renderer returns a bounded body/snapshot result. The contract normalizes only with an explicit, versioned rule; it computes a cryptographic digest over exact returned bytes and extracts only bounded, task-relevant factual propositions/quotes.
4. The validator independently renders the same canonical source and checks that the proposed material fields/extracts are supported by its own result under a custom Equivalence Principle. Raw full-page HTML equality is acceptable only for known static test sources; dynamic pages can legitimately differ. A material mismatch, URL redirect mismatch, fetch error, timeout, or invalid output returns no accepted evidence / `INSUFFICIENT_EVIDENCE`; it does not save an assertion as verified.
5. After the equivalence call returns, the contract appends a `WebEvidenceCaptured` reference to the case evidence version. The record includes safe public URL or source reference, capture transaction-context datetime, normalized content digest, evidence schema/normalizer version, bounded extract/fact references, submitter, and case version. The full page and full screenshot remain off chain.
6. Later AI evaluation consumes the pinned captured extract/digest, not a fresh read of an unpinned URL. Re-capture creates a new evidence version; it never changes old content. The UI displays source and capture time for each version and warns that a URL may now serve different content.

## 3. What should be committed on chain

Minimal, public evidence reference:

- case ID, evidence ID, monotonically increasing version;
- canonical URL or carefully sanitized public source reference (or a digest plus user-visible source reference if the contract size/privacy policy requires it);
- SHA-256 of exact normalized/rendered bytes and normalization schema/version;
- bounded, public extracted passage/claim references only when needed for later audit; do not put whole page content or screenshot bytes on chain;
- submitter address, transaction-context timestamp, and linked case action/version;
- validator decision-bearing summary/evidence status and its result schema version.

The exact URL may contain personal or secret identifiers; reject unsafe URL forms. Hashing a URL does not make a secret URL safe if the URL is also sent to validators or written in transaction calldata. Query strings containing credentials/session tokens must not be submitted.

## 4. Trust and security limitations

- A stable URL does not guarantee stable content. An honest current capture is not a cryptographic proof of historic content at later retrieval.
- DNS/redirect/private network protections are not established by the API signature. Verify the deployed renderer's egress behavior. Do not assume sandboxing prevents SSRF or metadata access.
- A rendered page can contain adversarial instructions; model prompts must quote and delimit it as evidence and prohibit following page instructions.
- Independent validators may see differing page versions due to cache, geography, A/B content, geoblocking, bot defenses, language preferences, cookies, or rendering delay. A validator may fail or disagree even when both executions are honest.
- `strict_eq` on raw HTML is not an appropriate generic rule for dynamic sources. Compare well-defined decision-bearing facts or reject unstable snapshots; never loosen equivalence until it accepts incorrect material facts.
- Screenshots are large, costly, potentially sensitive, and not readable as ground truth in every supported model path. Start with bounded HTML/text extraction; screenshot capture remains a later controlled experiment.
- Web evidence is publicly inspectable. Never fetch private dockets, logged-in user content, personal data, privileged communications, paywalled private documents, or sources whose use is unauthorized.
- Web Render consensus does not prove source credibility, authorship, or legal admissibility.

## 5. Proofs and acceptance gates

Keep Web Render disabled in the UI until all of the following are evidenced:

1. Official stable-version runner/toolchain documents the callable render API and output type/limits; cached lint alone is insufficient.
2. A fictional/static public fixture render succeeds in the intended stable-compatible local runtime and produces the expected content/digest.
3. A separately executed validator render can compare the pinned content; tests show agreement, material disagreement, malformed result, HTTP failure, timeout, and page update behavior.
4. URL tests cover invalid scheme, userinfo, fragments, sensitive query parameters, private/loopback/reserved hosts, redirect to blocked host, oversize URL/body, and unavailable renderer. Verify the real runtime's network restrictions, not just Python URL parsing.
5. The CaseCourt writes the evidence record only after accepted equivalence; state remains unchanged after every reject/error path.
6. A later case evaluation explicitly binds the web-evidence version/root and cannot read a changed URL implicitly.
7. Data/privacy, cost/fee profiling, and safe UI disclosure are reviewed.
8. Only after separately approved live Studionet testing can the route be enabled for actual chain use; the first live test must use a public fictional or controlled static URL.

## 6. UI state taxonomy

- **Prepared locally:** user entered a URL; no GenLayer fetch happened.
- **Capture submitted:** transaction hash observed; no accepted source claim yet.
- **Accepted / nonfinal:** network accepted an execution proposal; native appeal window remains.
- **Evidence captured (finalized):** transaction is actually finalized with a successful execution result and the contract view returns the specific evidence record.
- **Capture failed / disputed / unavailable:** no evidence is presented as accepted; show a concise reason and preserve no successful evidence record.
- **Old version:** immutable prior capture; never replaced by current page content.

Never label browser fetches, screenshots loaded in an iframe, or AI summaries alone as “GenLayer Web Render evidence.”

## 7. Unresolved questions

- Which exact `py-genlayer` runner hash and Studio release stable Studionet currently accepts.
- Render output types, maximum HTML/screenshot size, timeout, redirects and network isolation on that runner.
- Whether stable Studionet fee policy makes an HTML render + validator rerender economically feasible.
- How a captured web-evidence action is anchored after its GenLayer transaction's own native appeal window and finality.
- Whether direct contract pagination and a browser-only retention policy can support enough cases without an indexer.

Resolve these in the runtime verification stage before implementing production Web Render code.
