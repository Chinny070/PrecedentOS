import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DEMO_EVALUATIONS, DEMO_PRECEDENTS, DEMO_RELATIONSHIPS } from '../fixtures/demo';
import { isAddress, STUDIONET_RPC, TARGET_CHAIN_ID } from '../config/chain';
import { Icon } from '../components/Icons';
import { Mono, SectionLabel, StatusTag } from '../components/StatusTag';
import { useApp } from '../state/AppContext';
import {
  codePointLength, evaluationInputCommitment, makeEvaluationPacket, MAX_CRITERIA_LENGTH,
  MAX_METADATA_FIELD_LENGTH, MAX_PASSAGE_LENGTH, sha256Utf8, validDecisionDate,
  validMetadataLabel, validRecordId, validateEvidencePacket,
} from '../lib/commitments';
import {
  createReadClient, probeStudionetRpc, readEvaluation, readPrecedent,
  trackTransactionLifecycle, writeContractMethod,
} from '../lib/genlayer/client';
import type { Precedent, TransactionTrace } from '../types/domain';

function Heading({ eyebrow, title, intro, side }: { eyebrow: string; title: ReactNode; intro?: string; side?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{side && <div className="page-heading-side">{side}</div>}</div>;
}

function DataNote({ children = 'Fictional fixtures only. This view covers the curated sample, not a complete on-chain corpus.' }: { children?: ReactNode }) {
  return <div className="data-note"><span className="data-note-icon">i</span><span>{children}</span></div>;
}

function DigestLine({ label, digest }: { label: string; digest: string }) {
  return <div className="digest-line"><span>{label}</span><code>{digest || 'Calculated when selected'}</code></div>;
}

function RecordCard({ item }: { item: Precedent }) {
  const tone = item.accent === 'coral' ? 'coral' : item.accent === 'cyan' ? 'cyan' : item.accent === 'violet' ? 'violet' : 'citron';
  return <Link to={`/precedents/${encodeURIComponent(item.id)}`} className={`record-card record-card--${tone}`}>
    <div className="record-card-top"><Mono>{item.id}</Mono><StatusTag tone={item.provenance === 'demo' ? 'demo' : 'good'}>{item.provenance === 'demo' ? 'DEMO' : 'CHAIN OBSERVED'}</StatusTag></div>
    <h3>{item.title}</h3><p>{item.summary}</p>
    <div className="record-card-meta"><span>{item.category}</span><span>{item.decisionDate}</span></div>
    <div className="record-card-outcome"><span>OUTCOME</span><b>{item.outcome}</b><Icon name="arrow" size={16}/></div>
  </Link>;
}

export function LabPage() {
  const contradictions = DEMO_EVALUATIONS.filter((item) => item.potential_contradiction).length;
  return <div className="page page--dark">
    <Heading eyebrow="FIELD NOTES / 00" title={<>Consistency is<br/><em>not coincidence.</em></>} intro="A bounded research surface for fictional decisions. Every count below describes the local demonstration set." side={<StatusTag tone="demo">6 FICTIONAL RECORDS</StatusTag>} />
    <DataNote>DEMO DATA · 6 fictional precedents and 2 illustrative comparisons. No live chain records are currently loaded.</DataNote>
    <div className="metric-grid">
      <article className="metric-card metric-card--acid"><span>LOADED PRECEDENTS</span><strong>06</strong><small>CURATED / FICTIONAL</small></article>
      <article className="metric-card metric-card--cyan"><span>PAIR COMPARISONS</span><strong>02</strong><small>ILLUSTRATIVE OUTPUTS</small></article>
      <article className="metric-card metric-card--coral"><span>POTENTIAL CONTRADICTIONS</span><strong>{String(contradictions).padStart(2, '0')}</strong><small>IN THE DEMO SAMPLE</small></article>
      <article className="metric-card metric-card--violet"><span>ON-CHAIN FINALITY</span><strong>—</strong><small>NO DEPLOYMENTS CONFIGURED</small></article>
    </div>
    <div className="dashboard-grid">
      <section className="panel panel--paper feature-panel"><SectionLabel index="01">START WITH A QUESTION</SectionLabel><h2>Are these decisions<br/>actually alike?</h2><p>Compare two bounded passages against explicit criteria. The evaluator’s IDs are references supplied by the caller; Registry membership is not inferred.</p><Link to="/compare" className="button button--dark">Build a comparison <Icon name="arrow" size={16}/></Link><div className="panel-decoration">A / B</div></section>
      <section className="panel panel--ink activity-panel"><SectionLabel index="02">LATEST DEMO COMPARISONS</SectionLabel>{DEMO_EVALUATIONS.map((evaluation, index) => {
        const a = DEMO_PRECEDENTS.find((item) => item.id === evaluation.a)!;
        const b = DEMO_PRECEDENTS.find((item) => item.id === evaluation.b)!;
        return <Link className="activity-row" to={`/evaluations/${evaluation.id}`} key={evaluation.id}><span className={`activity-index index-${index}`}>0{index + 1}</span><span className="activity-pair"><b>{a.id}</b><i>×</i><b>{b.id}</b><small>{a.title} / {b.title}</small></span><span className="activity-classification">{evaluation.classification.replaceAll('_', ' ')}</span><Icon name="arrow" size={15}/></Link>;
      })}<Link to="/precedents" className="text-link text-link--light">Explore six fictional records <span>↗</span></Link></section>
    </div>
    <section className="bottom-disclaimer"><span>IMPORTANT / 01</span><p>PrecedentOS is a research interface, not a court or legal advice. GenLayer validator agreement enforces a contract-defined equivalence rule; it cannot guarantee legal correctness, source authenticity or completeness.</p><Link to="/web-evidence">Web Render remains disabled <Icon name="arrow" size={14}/></Link></section>
  </div>;
}

export function PrecedentsPage() {
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState('');
  const [found, setFound] = useState<Precedent | null>(null);
  const [message, setMessage] = useState('');
  const { addresses } = useApp();
  const filtered = DEMO_PRECEDENTS.filter((item) => `${item.id} ${item.title} ${item.category} ${item.jurisdiction}`.toLowerCase().includes(query.toLowerCase()));
  async function lookupRecord(event: FormEvent) {
    event.preventDefault(); setMessage(''); setFound(null);
    if (!isAddress(addresses.registry)) { setMessage('Add a Registry contract address in Settings before making a chain lookup.'); return; }
    if (!validRecordId(lookup)) { setMessage('Enter a valid uppercase record ID, for example FICT-MUNI-001.'); return; }
    try {
      const record = await readPrecedent(await createReadClient(), addresses.registry, lookup);
      if (!record.record_id) { setMessage('No record was returned for that ID at the configured Registry address.'); return; }
      setFound({ id: record.record_id, title: record.category, jurisdiction: record.jurisdiction, decisionDate: record.decision_date, category: record.category, court: 'Submitter supplied', outcome: 'Outcome not in Registry metadata', summary: 'Chain-observed Registry metadata only. The contract stores a digest, not the case passage.', passage: '', documentDigest: record.evidence_digest, provenance: 'chain-observed', citedIds: [], accent: 'cyan' });
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The Registry read failed.'); }
  }
  return <div className="page page--paper">
    <Heading eyebrow="COLLECTION / 01" title={<>Precedent<br/><em>registry.</em></>} intro="Browse the curated fictional corpus or retrieve a known record ID from a Registry address you have configured." side={<Link to="/precedents/new" className="button button--dark"><Icon name="plus"/> Register a record</Link>} />
    <DataNote>6 curated fictional records. The deployed Registry exposes keyed reads and a count, not corpus enumeration.</DataNote>
    <form className="lookup-bar" onSubmit={lookupRecord}><label htmlFor="registry-id">LOOK UP KNOWN ON-CHAIN ID</label><input id="registry-id" value={lookup} onChange={(event) => setLookup(event.target.value.toUpperCase())} placeholder="FICT-MUNI-001" maxLength={48}/><button className="button button--dark button--small" type="submit"><Icon name="search" size={15}/> Read Registry</button></form>
    {message && <div role="status" className="inline-message">{message}</div>}
    {found && <div className="chain-lookup-card"><StatusTag tone="good">CHAIN OBSERVED · METADATA ONLY</StatusTag><h3>{found.id}</h3><p>{found.jurisdiction} · {found.decisionDate} · {found.category}</p><DigestLine label="REGISTRY DOCUMENT DIGEST" digest={found.documentDigest}/></div>}
    <div className="filter-bar"><div><span className="filter-overline">LOCAL FILTER / 06 ITEMS</span><strong>Cases in the sample</strong></div><label className="search-input"><Icon name="search"/><input aria-label="Filter demo precedents" placeholder="Filter ID, jurisdiction, category" value={query} onChange={(event) => setQuery(event.target.value)}/></label></div>
    <div className="record-grid">{filtered.map((item) => <RecordCard item={item} key={item.id}/>)}</div>
    {filtered.length === 0 && <div className="empty-state"><span>∅</span><b>No fixture matches</b><p>Search applies only to the six curated examples.</p></div>}
  </div>;
}

export function RegisterPage() {
  const { wallet, addresses, saveTransaction, updateTransaction } = useApp();
  const [recordId, setRecordId] = useState('FICT-NEW-007');
  const [jurisdiction, setJurisdiction] = useState('Fictional North District');
  const [decisionDate, setDecisionDate] = useState('2030-08-19');
  const [category, setCategory] = useState('Fictional access dispute');
  const [documentText, setDocumentText] = useState('Fictional public precedent text. Replace this sample with a fictional passage only. Full case documents are not submitted by this form.');
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => { void sha256Utf8(documentText).then(setDigest); }, [documentText]);
  const errors = [
    !validRecordId(recordId) ? 'Use 3–48 uppercase letters, digits or single hyphens.' : '',
    !validMetadataLabel(jurisdiction) ? `Jurisdiction is required and limited to ${MAX_METADATA_FIELD_LENGTH} safe characters.` : '',
    !validMetadataLabel(category) ? `Category is required and limited to ${MAX_METADATA_FIELD_LENGTH} safe characters.` : '',
    !validDecisionDate(decisionDate) ? 'Use a real calendar date in YYYY-MM-DD format.' : '',
    !documentText.trim() ? 'A fictional source text is required to calculate its commitment.' : '',
  ].filter(Boolean);
  const ready = errors.length === 0 && Boolean(digest) && Boolean(wallet) && isAddress(addresses.registry) && !busy;
  async function submit(event: FormEvent) {
    event.preventDefault(); setStatus('');
    if (!ready || !wallet) { setStatus('Connect a Studionet wallet and configure the Registry address to submit.'); return; }
    setBusy(true);
    try {
      const hash = await writeContractMethod(wallet, addresses.registry, 'register_precedent', [recordId, digest, 1, jurisdiction, decisionDate, category]);
      const tx: TransactionTrace = { hash, action: `Register ${recordId}`, status: 'submitted', submittedAtLocal: new Date().toISOString() };
      saveTransaction(tx); setStatus(`Submitted ${hash}. The browser observed submission at ${tx.submittedAtLocal}; this is not a chain timestamp.`);
      void trackTransactionLifecycle(wallet.client, hash, (update) => updateTransaction(hash, { ...update, storedLocally: false }));
    } catch (error) { setStatus(error instanceof Error ? error.message : 'The write was not submitted.'); }
    finally { setBusy(false); }
  }
  return <div className="page page--paper"><Heading eyebrow="APPEND-ONLY / 02" title={<>Register a<br/><em>commitment.</em></>} intro="Anchor a digest and bounded metadata. The evidence text below is hashed in this browser and is not sent as Registry metadata." />
    <div className="form-layout"><form className="form-sheet" onSubmit={submit}>
      <SectionLabel index="A">FICTIONAL RECORD METADATA</SectionLabel>
      <div className="form-row"><label>Record ID<input value={recordId} maxLength={48} onChange={(e) => setRecordId(e.target.value.toUpperCase())}/><small>3–48 uppercase characters, digits, single hyphens.</small></label><label>Decision date<input type="date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)}/><small>Submitter-provided case date, not chain time.</small></label></div>
      <div className="form-row"><label>Fictional jurisdiction<input value={jurisdiction} maxLength={64} onChange={(e) => setJurisdiction(e.target.value)}/><small>{codePointLength(jurisdiction)} / 64</small></label><label>Category<input value={category} maxLength={64} onChange={(e) => setCategory(e.target.value)}/><small>{codePointLength(category)} / 64</small></label></div>
      <SectionLabel index="B">SOURCE TEXT / LOCAL ONLY</SectionLabel>
      <label className="full-label">Fictional evidence commitment<textarea value={documentText} onChange={(e) => setDocumentText(e.target.value)} rows={5} maxLength={1800}/><small>Demo uses fictional/public text only. This field is hashed locally; only the 64-character digest and metadata go to the contract.</small></label>
      <div className="digest-preview"><div><span>SHA-256 · EXACT UTF-8</span><StatusTag tone="demo">BROWSER-COMPUTED</StatusTag></div><code>{digest || 'Calculating…'}</code><p>Integrity commitment, not proof of authorship or truth.</p></div>
      {errors.length > 0 && <ul className="form-errors">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
      {status && <div role="status" className="inline-message">{status}</div>}
      <button className="button button--dark button--wide" disabled={!ready} type="submit">{busy ? 'Waiting for wallet…' : wallet ? 'Review and submit registration' : 'Connect wallet to submit'} <Icon name="arrow" size={16}/></button>
      {!isAddress(addresses.registry) && <p className="form-blocker">No deployed Registry address is configured. Add a verified address in Settings to enable writes.</p>}
    </form><aside className="form-aside"><div className="form-aside-number">01 <span>/ IMMUTABLE</span></div><h3>Nothing private<br/>belongs here.</h3><p>Never submit full case files, personal information, private evidence, or documents you cannot share publicly.</p><div className="field-list"><span><Icon name="check"/> Unique record ID</span><span><Icon name="check"/> Lowercase SHA-256 digest</span><span><Icon name="check"/> Schema version 1</span><span><Icon name="check"/> Fictional metadata</span></div><div className="warning-card"><b>NO TIMESTAMP FIELD</b><p>The current Registry stores a sequence number, not chain time. The date above is supplied by you.</p></div></aside></div>
  </div>;
}

export function ComparePage() {
  const { wallet, addresses, saveTransaction, updateTransaction } = useApp();
  const [idA, setIdA] = useState(DEMO_PRECEDENTS[0].id);
  const [idB, setIdB] = useState(DEMO_PRECEDENTS[1].id);
  const [passageA, setPassageA] = useState(DEMO_PRECEDENTS[0].passage);
  const [passageB, setPassageB] = useState(DEMO_PRECEDENTS[1].passage);
  const [criteria, setCriteria] = useState('Compare the material issue, controlling rule, relevant facts, stated outcomes, and any explicit exception in the supplied fictional passages. Flag a potential contradiction only if the same material issue has different outcomes and no stated distinction adequately explains them.');
  const [digestA, setDigestA] = useState(''); const [digestB, setDigestB] = useState('');
  const [commitment, setCommitment] = useState(''); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''); const [result, setResult] = useState<Record<string, string> | null>(null);
  const [evaluationId, setEvaluationId] = useState('');
  const recordA = DEMO_PRECEDENTS.find((item) => item.id === idA)!;
  const recordB = DEMO_PRECEDENTS.find((item) => item.id === idB)!;
  useEffect(() => { void sha256Utf8(passageA).then(setDigestA); }, [passageA]);
  useEffect(() => { void sha256Utf8(passageB).then(setDigestB); }, [passageB]);
  useEffect(() => {
    if (!digestA || !digestB || !evaluationId) { setCommitment(''); return; }
    void evaluationInputCommitment({ evaluationId, recordAId: idA, recordADigest: digestA, recordBId: idB, recordBDigest: digestB, evidenceSchemaVersion: 1, criteriaVersion: 1, criteria }).then(setCommitment);
  }, [digestA, digestB, evaluationId, idA, idB, criteria]);
  const errors = useMemo(() => [...validateEvidencePacket(passageA, passageB, criteria), idA === idB ? 'Choose two different record identifiers.' : ''], [passageA, passageB, criteria, idA, idB]).filter(Boolean);
  function changeA(value: string) { setIdA(value); const record = DEMO_PRECEDENTS.find((item) => item.id === value); if (record) setPassageA(record.passage); }
  function changeB(value: string) { setIdB(value); const record = DEMO_PRECEDENTS.find((item) => item.id === value); if (record) setPassageB(record.passage); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(''); setResult(null);
    if (errors.length) { setMessage('Resolve the evidence and criteria limits before submitting.'); return; }
    if (!wallet || !isAddress(addresses.evaluator)) { setMessage('A connected Studionet wallet and a configured Evaluator address are required.'); return; }
    const nextId = `EVAL-${crypto.randomUUID().toUpperCase()}`;
    setEvaluationId(nextId); setBusy(true);
    try {
      const packet = makeEvaluationPacket(passageA, passageB);
      const hash = await writeContractMethod(wallet, addresses.evaluator, 'evaluate_pair', [nextId, idA, digestA, idB, digestB, packet, 1, 1, criteria]);
      const tx: TransactionTrace = { hash, action: `Compare ${idA} × ${idB}`, status: 'submitted', submittedAtLocal: new Date().toISOString() };
      saveTransaction(tx); setMessage(`Submitted ${hash}. Waiting for the actual transaction lifecycle; no result is assumed from submission.`);
      void trackTransactionLifecycle(wallet.client, hash, (update) => {
        updateTransaction(hash, { ...update, storedLocally: false });
        if (update.status === 'failed') setMessage(`The transaction did not complete successfully: ${update.detail}`);
        if (update.status === 'unknown') setMessage(`Transaction status is unresolved: ${update.detail}`);
        if (update.status === 'finalized') {
          void readEvaluation(wallet.client, addresses.evaluator, nextId)
            .then((value) => { setResult(value); setMessage('Finalized and read back from the configured Evaluator. This does not establish legal correctness.'); })
            .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Finalized evaluation readback failed.'));
        }
      });
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The comparison was not submitted.'); }
    finally { setBusy(false); }
  }
  const canSubmit = Boolean(wallet && isAddress(addresses.evaluator) && !busy && !errors.length && digestA && digestB);
  return <div className="page page--paper"><Heading eyebrow="PAIRWISE REVIEW / 03" title={<>Compare the<br/><em>decision surface.</em></>} intro="Two bounded fictional passages enter a contract-defined comparison. Inputs are visible to validators and must be public." side={<StatusTag tone="warn">NO LEGAL CONCLUSION</StatusTag>} />
    <DataNote>IDs are caller-supplied labels. The current Evaluator does not verify Registry membership or authenticate the source document.</DataNote>
    <form onSubmit={submit} className="compare-form">
      <div className="comparison-cases">
        <section className="evidence-sheet evidence-sheet--a"><div className="evidence-top"><span>PASSAGE / A</span><select aria-label="Select first fictional record" value={idA} onChange={(e) => changeA(e.target.value)}>{DEMO_PRECEDENTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select></div><h2>{recordA.title}</h2><p className="evidence-meta">{recordA.jurisdiction} · {recordA.decisionDate} · DEMO</p><textarea aria-label="First comparison passage" value={passageA} onChange={(e) => setPassageA(e.target.value)} maxLength={2500} rows={8}/><div className="evidence-foot"><span>{codePointLength(passageA)} / {MAX_PASSAGE_LENGTH} CODE POINTS</span><DigestLine label="PASSAGE SHA-256" digest={digestA}/></div></section>
        <div className="compare-spine"><span>A</span><i/><b>VS</b><i/><span>B</span></div>
        <section className="evidence-sheet evidence-sheet--b"><div className="evidence-top"><span>PASSAGE / B</span><select aria-label="Select second fictional record" value={idB} onChange={(e) => changeB(e.target.value)}>{DEMO_PRECEDENTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select></div><h2>{recordB.title}</h2><p className="evidence-meta">{recordB.jurisdiction} · {recordB.decisionDate} · DEMO</p><textarea aria-label="Second comparison passage" value={passageB} onChange={(e) => setPassageB(e.target.value)} maxLength={2500} rows={8}/><div className="evidence-foot"><span>{codePointLength(passageB)} / {MAX_PASSAGE_LENGTH} CODE POINTS</span><DigestLine label="PASSAGE SHA-256" digest={digestB}/></div></section>
      </div>
      <section className="criteria-card"><div className="criteria-title"><SectionLabel index="C">EXPLICIT CRITERIA / VERSION 1</SectionLabel><span>{codePointLength(criteria)} / {MAX_CRITERIA_LENGTH}</span></div><label htmlFor="criteria-input" className="sr-only">Comparison criteria</label><textarea id="criteria-input" value={criteria} onChange={(e) => setCriteria(e.target.value)} maxLength={MAX_CRITERIA_LENGTH} rows={3}/><p>Criteria are part of the evaluation input commitment. Evidence is untrusted data, not instructions.</p></section>
      <div className="commitment-card"><div><span>INPUT COMMITMENT / PREVIEW</span><StatusTag tone="demo">BROWSER-COMPUTED</StatusTag></div><code>{commitment || 'Generated when evaluation ID is prepared'}</code><p>Length-framed SHA-256 matching the contract's v1 field order. The on-chain result must still be independently read back.</p></div>
      {errors.length > 0 && <ul className="form-errors">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
      {message && <div role="status" className="inline-message">{message}</div>}
      <div className="submit-strip"><div><b>NO PRIVATE DATA</b><span>Do not submit personal, confidential, or non-public passages.</span></div><button className="button button--dark" disabled={!canSubmit}>{busy ? 'Awaiting wallet…' : 'Submit to PrecedentEvaluator'} <Icon name="arrow" size={16}/></button></div>
      {!isAddress(addresses.evaluator) && <div className="form-blocker">The Evaluator address is not configured. Demo navigation stays available; no fallback or mock write will occur.</div>}
    </form>
    {result && <ResultPanel result={result} id={evaluationId} />}
  </div>;
}

function parseJsonField(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function ResultPanel({ result, id }: { result: Record<string, string>; id: string }) {
  const decision = parseJsonField(result.decision_fields_json) as Record<string, unknown> | string;
  const fields = typeof decision === 'object' && decision ? decision : {};
  const className = result.classification || String(fields.classification ?? 'unknown');
  return <section className={`result-panel result-panel--${className}`}><div className="result-panel-head"><StatusTag tone="good">FINALIZED · READ BACK</StatusTag><Mono>{id}</Mono></div><h2>{className.replaceAll('_', ' ')}</h2><p>{result.reasoning || 'No rationale was returned.'}</p><div className="decision-grid">{['same_material_issue','evidence_sufficient','outcomes_differ','material_similarity','potential_contradiction'].map((key) => <div key={key}><span>{key.replaceAll('_',' ')}</span><b>{String(fields[key] ?? 'unavailable')}</b></div>)}</div><DigestLine label="INPUT COMMITMENT" digest={result.input_commitment || 'Unavailable in returned schema'}/><p className="result-caveat">Consensus outcome is a research signal under the contract's rule, not a guarantee of legal correctness.</p></section>;
}

export function PrecedentDetailPage() {
  const { id = '' } = useParams(); const decoded = decodeURIComponent(id);
  const { addresses } = useApp();
  const fixture = DEMO_PRECEDENTS.find((item) => item.id === decoded);
  const [chainRecord, setChainRecord] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (fixture || !isAddress(addresses.registry)) return;
    void createReadClient().then((client) => readPrecedent(client, addresses.registry, decoded)).then(setChainRecord).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Chain read unavailable.'));
  }, [fixture, addresses.registry, decoded]);
  if (fixture) return <div className="page page--paper"><Link to="/precedents" className="back-link">← ALL SIX DEMO RECORDS</Link><Heading eyebrow="FICTIONAL CASE / READ ONLY" title={<>{fixture.title}</>} intro={fixture.summary} side={<StatusTag tone="demo">DEMO FIXTURE</StatusTag>} /><div className="detail-grid"><article className="detail-sheet"><SectionLabel index="01">RECORD SUMMARY</SectionLabel><div className="detail-facts"><div><span>RECORD ID</span><b>{fixture.id}</b></div><div><span>JURISDICTION</span><b>{fixture.jurisdiction}</b></div><div><span>DECISION DATE · SUBMITTER CLAIM</span><b>{fixture.decisionDate}</b></div><div><span>CATEGORY</span><b>{fixture.category}</b></div><div><span>ILLUSTRATIVE OUTCOME</span><b>{fixture.outcome}</b></div><div><span>SOURCE</span><b>{fixture.court}</b></div></div><SectionLabel index="02">PASSAGE SPECIMEN / PUBLIC FICTION</SectionLabel><blockquote>{fixture.passage}</blockquote><p className="detail-caution">This is a demo text specimen. Its digest is not registered on chain.</p><Link to={`/compare?${new URLSearchParams({ a: fixture.id })}`} className="button button--dark">Compare this precedent <Icon name="arrow" size={16}/></Link></article><aside className="detail-aside"><SectionLabel index="03">PROVENANCE</SectionLabel><StatusTag tone="demo">SOURCE: CURATED FIXTURE</StatusTag><div className="provenance-timeline"><div><span className="timeline-dot demo"/><b>Demo data loaded</b><small>Local browser bundle · not chain observed</small></div><div><span className="timeline-dot muted"/><b>Registration sequence</b><small>Unavailable in fixture</small></div><div><span className="timeline-dot muted"/><b>Block timestamp</b><small>Unknown · not fabricated</small></div></div><h4>FICTIONAL REFERENCES</h4>{fixture.citedIds.length ? fixture.citedIds.map((other) => <Link className="related-link" to={`/precedents/${other}`} key={other}>{other} <Icon name="arrow" size={14}/></Link>) : <p className="muted-copy">No explicit links in this example.</p>}<Link to="/verify" className="text-link">Open verification trail ↗</Link></aside></div></div>;
  const digest = chainRecord?.evidence_digest;
  return <div className="page page--paper"><Link to="/precedents" className="back-link">← REGISTRY</Link><Heading eyebrow="KNOWN ID LOOKUP" title={decoded} intro="A keyed lookup does not enumerate or establish corpus-wide coverage." side={<StatusTag tone={chainRecord?.record_id ? 'good' : 'warn'}>{chainRecord?.record_id ? 'CHAIN OBSERVED' : 'NOT LOADED'}</StatusTag>} />{chainRecord?.record_id ? <div className="detail-sheet"><DataNote>CHAIN OBSERVED · values below came from a Registry view response. Source authenticity is not established.</DataNote><div className="detail-facts"><div><span>JURISDICTION</span><b>{chainRecord.jurisdiction}</b></div><div><span>DECISION DATE · SUBMITTER CLAIM</span><b>{chainRecord.decision_date}</b></div><div><span>CATEGORY</span><b>{chainRecord.category}</b></div><div><span>SUBMITTER ADDRESS</span><b className="mono">{chainRecord.submitter}</b></div><div><span>REGISTRATION SEQUENCE · NOT TIME</span><b>{chainRecord.registration_sequence}</b></div><div><span>SCHEMA VERSION</span><b>{chainRecord.schema_version}</b></div></div><DigestLine label="REGISTRY DOCUMENT DIGEST" digest={digest || ''}/><p className="detail-caution">Registry digest commits to submitted document bytes as claimed at registration. Evaluator passage digests are separate commitments.</p></div> : <div className="empty-state"><span>?</span><b>{message || 'Record not loaded'}</b><p>Set a Registry address in Settings or return to curated fictional examples.</p><Link className="button button--dark" to="/settings">Configure address</Link></div>}</div>;
}

export function EvaluationDetailPage() {
  const { id = '' } = useParams(); const { addresses, transactions } = useApp();
  const demo = DEMO_EVALUATIONS.find((item) => item.id === decodeURIComponent(id));
  const tx = transactions.find((item) => item.action.includes(decodeURIComponent(id)));
  const [chainResult, setChainResult] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (demo || !isAddress(addresses.evaluator)) return;
    void createReadClient().then((client) => readEvaluation(client, addresses.evaluator, decodeURIComponent(id))).then(setChainResult).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Evaluator read unavailable.'));
  }, [demo, addresses.evaluator, id]);
  if (demo) {
    const a = DEMO_PRECEDENTS.find((item) => item.id === demo.a)!; const b = DEMO_PRECEDENTS.find((item) => item.id === demo.b)!;
    return <div className="page page--paper"><Link to="/lab" className="back-link">← RESEARCH LAB</Link><Heading eyebrow="PAIRWISE RESULT / EXAMPLE" title={<>The outcome<br/><em>has context.</em></>} intro="Illustrative comparison based only on the passages shown. No AI call or validator consensus occurred." side={<StatusTag tone="demo">DEMO · NOT ON-CHAIN</StatusTag>} />
      <DataNote>This sample teaches result structure. It is not an Intelligent Contract execution or consensus result.</DataNote><section className="result-panel result-panel--demo"><div className="result-panel-head"><StatusTag tone="demo">DEMO CLASSIFICATION</StatusTag><Mono>{demo.id}</Mono></div><h2>{demo.classification.replaceAll('_',' ')}</h2><p>{demo.reasoning}</p><div className="decision-grid">{(['same_material_issue','evidence_sufficient','outcomes_differ','material_similarity','potential_contradiction'] as const).map((key) => <div key={key}><span>{key.replaceAll('_',' ')}</span><b>{demo[key] ? 'YES' : 'NO'}</b></div>)}</div><DigestLine label="INPUT COMMITMENT" digest="Not a chain commitment · demo record"/><div className="result-findings"><div><h3>SIMILARITIES</h3>{demo.similarities.map((item) => <p key={item}>+ {item}</p>)}</div><div><h3>DIFFERENCES</h3>{demo.differences.map((item) => <p key={item}>↗ {item}</p>)}</div></div></section><div className="pair-result-links"><Link to={`/precedents/${a.id}`} className="related-link">A · {a.id} — {a.title}</Link><Link to={`/precedents/${b.id}`} className="related-link">B · {b.id} — {b.title}</Link></div>
    </div>;
  }
  return <div className="page page--paper"><Link to="/verify" className="back-link">← VERIFICATION TRAIL</Link><Heading eyebrow="EVALUATION LOOKUP" title={decodeURIComponent(id)} intro="A returned record is chain-observed. Lifecycle status is shown only when supported by a locally observed transaction." side={<StatusTag tone={tx?.status === 'finalized' ? 'good' : 'warn'}>{tx?.status ?? 'LIFECYCLE UNKNOWN'}</StatusTag>} />{chainResult?.evaluation_id ? <><DataNote>Evaluator view response. Record IDs and digests are caller-supplied references, not proof of Registry membership.</DataNote><ResultPanel result={chainResult} id={chainResult.evaluation_id}/></> : <div className="empty-state"><span>?</span><b>{message || 'Evaluation not loaded'}</b><p>{tx ? `Local transaction status: ${tx.status}.` : 'Configure an Evaluator address or open one of the fictional examples.'}</p><Link className="button button--dark" to="/settings">Configure address</Link></div>}</div>;
}

export function GraphPage() {
  const [showInferred, setShowInferred] = useState(false);
  const nodes = DEMO_PRECEDENTS.slice(0, 5);
  const positions: Record<string, [number, number]> = { 'FICT-MUNI-001': [180, 160], 'FICT-MUNI-002': [450, 115], 'FICT-MUNI-003': [690, 230], 'FICT-HOUS-004': [260, 365], 'FICT-HOUS-005': [560, 370] };
  const edges = showInferred ? [...DEMO_RELATIONSHIPS, { from: 'FICT-MUNI-002', to: 'FICT-MUNI-003', type: 'inferred', label: 'DEMO · inferred similarity' }] : DEMO_RELATIONSHIPS;
  return <div className="page page--cobalt"><Heading eyebrow="RELATIONSHIP MAP / 04" title={<>Judgments<br/><em>in relation.</em></>} intro="A small fictional sample. Each edge is explicitly labeled; dashed edges are exploratory and are never represented as on-chain fact." side={<StatusTag tone="demo">5 NODES · DEMO</StatusTag>} /><DataNote>Graph is a client-side view of the curated fixture set. No global enumeration or hidden indexer is used.</DataNote>
    <div className="graph-toolbar"><span><i className="legend-line legend-line--solid"/> Fixture relationship</span><span><i className="legend-line legend-line--dash"/> Client inference</span><button className={`switch ${showInferred ? 'on' : ''}`} type="button" role="switch" aria-checked={showInferred} onClick={() => setShowInferred(!showInferred)}>Show inferred edges <b>{showInferred ? 'ON' : 'OFF'}</b></button></div>
    <div className="graph-board"><svg viewBox="0 0 850 500" role="img" aria-label="Lineage graph with five fictional precedent nodes">
      {edges.map((edge) => { const start = positions[edge.from]; const end = positions[edge.to]; if (!start || !end) return null; return <g key={`${edge.from}-${edge.to}-${edge.type}`}><line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} className={`graph-edge graph-edge--${edge.type}`} /><text x={(start[0]+end[0])/2} y={(start[1]+end[1])/2-10} className="graph-edge-label">{edge.type.toUpperCase()}</text></g>; })}
      {nodes.map((node) => { const [x,y] = positions[node.id]; return <g key={node.id} className="graph-node" tabIndex={0} role="link" aria-label={`Open ${node.id}`} onClick={() => { window.location.href = `/precedents/${node.id}`; }} onKeyDown={(event) => { if (event.key === 'Enter') window.location.href = `/precedents/${node.id}`; }}><circle cx={x} cy={y} r="35"/><text x={x} y={y+4} textAnchor="middle">{node.id.slice(-3)}</text><text x={x} y={y+58} textAnchor="middle" className="graph-node-id">{node.id}</text></g>; })}
    </svg></div>
    <div className="graph-list"><SectionLabel index="LINKS">ACCESSIBLE RELATIONSHIP LIST</SectionLabel>{edges.map((edge) => <div key={`${edge.from}-${edge.to}-${edge.type}`} className="graph-list-row"><b>{edge.from}</b><span>→ {edge.label}</span><b>{edge.to}</b></div>)}</div>
  </div>;
}

export function SimulatePage() {
  const [sameIssue, setSameIssue] = useState(true); const [outcomesDiffer, setOutcomesDiffer] = useState(true);
  const [exception, setException] = useState(true); const [enough, setEnough] = useState(true);
  const classification = !enough ? 'insufficient evidence' : sameIssue && outcomesDiffer && !exception ? 'possible contradiction' : sameIssue ? 'material similarity' : 'no material relation';
  return <div className="page page--paper page--simulation"><Heading eyebrow="COUNTERFACTUAL / 05" title={<>Change one<br/><em>assumption.</em></>} intro="Explore a hypothetical rule variation in this browser-only sandbox. This logic is illustrative and is not an AI evaluation." side={<StatusTag tone="demo">SIMULATION · LOCAL ONLY</StatusTag>} /><DataNote>Changing these controls sends nothing to GenLayer and creates no persisted evaluation.</DataNote>
    <div className="simulation-layout"><section className="simulation-controls"><SectionLabel index="01">SCENARIO VARIABLES</SectionLabel><label className="toggle-row"><span><b>Same material issue?</b><small>Do the passages concern the same rule/question?</small></span><input type="checkbox" checked={sameIssue} onChange={(e) => setSameIssue(e.target.checked)}/></label><label className="toggle-row"><span><b>Different outcomes?</b><small>Are the stated decisions materially different?</small></span><input type="checkbox" checked={outcomesDiffer} onChange={(e) => setOutcomesDiffer(e.target.checked)}/></label><label className="toggle-row"><span><b>Explicit distinction present?</b><small>For example, a written emergency exception.</small></span><input type="checkbox" checked={exception} onChange={(e) => setException(e.target.checked)}/></label><label className="toggle-row"><span><b>Enough evidence?</b><small>Are rule, facts and outcomes actually supplied?</small></span><input type="checkbox" checked={enough} onChange={(e) => setEnough(e.target.checked)}/></label></section><section className="simulation-result"><div className="sim-stamp">HYPOTHETICAL<br/>NO CONSENSUS</div><span>ILLUSTRATIVE RULE OUTPUT</span><h2>{classification}</h2><p>{!enough ? 'Missing facts reduce the scenario to insufficient evidence.' : sameIssue && outcomesDiffer && !exception ? 'Same issue + divergent outcomes + no explicit distinction → possible contradiction signal.' : 'This simple browser rule does not detect legal nuance or independently evaluate evidence.'}</p><div className="sim-equation">{sameIssue ? 'SAME ISSUE' : 'DIFFERENT ISSUE'} <b>+</b> {outcomesDiffer ? 'DIFFERENT RESULT' : 'SAME RESULT'} <b>+</b> {exception ? 'EXCEPTION' : 'NO EXCEPTION'}</div></section></div>
  </div>;
}

export function VerifyPage() {
  const { transactions } = useApp(); const [query, setQuery] = useState('');
  const filtered = transactions.filter((tx) => `${tx.hash} ${tx.action}`.toLowerCase().includes(query.toLowerCase()));
  const tone = (status: TransactionTrace['status'], stored: boolean) => stored ? 'warn' as const : status === 'finalized' ? 'good' as const : status === 'failed' ? 'bad' as const : status === 'unknown' ? 'warn' as const : 'neutral' as const;
  return <div className="page page--paper"><Heading eyebrow="PROVENANCE / 06" title={<>Follow the<br/><em>transaction.</em></>} intro="This browser remembers only transaction hashes and local observations you initiated here. It is not an indexer or a source of complete chain history." side={<StatusTag tone="warn">NO EXPLORER URL VERIFIED</StatusTag>} /><DataNote>Browser history is editable local storage. Reloaded entries are shown as unverified local notes until freshly checked against the configured network.</DataNote>
    <label className="search-input verify-search"><Icon name="search"/><input aria-label="Filter observed transaction history" placeholder="Filter local hashes or action" value={query} onChange={(e) => setQuery(e.target.value)}/></label>
    {filtered.length ? <div className="transaction-list">{filtered.map((tx) => <article className="transaction-card" key={tx.hash}><div className="tx-card-head"><StatusTag tone={tone(tx.status, Boolean(tx.storedLocally))}>{tx.storedLocally ? `LOCAL NOTE · LAST SEEN ${tx.lastObservedStatus ?? 'UNKNOWN'}` : tx.status.toUpperCase()}</StatusTag><Mono>{tx.action}</Mono></div><code>{tx.hash}</code><div className="tx-meta"><span><b>SUBMITTED AT · DEVICE OBSERVATION</b>{new Date(tx.submittedAtLocal).toLocaleString()}</span><span><b>{tx.storedLocally ? 'FINALIZATION TIME · UNVERIFIED LOCAL NOTE' : 'FINALIZED AT · OBSERVED HERE'}</b>{tx.finalizedAtObserved ? new Date(tx.finalizedAtObserved).toLocaleString() : 'Not observed'}</span></div>{tx.detail && <p className="tx-detail">{tx.detail}</p>}</article>)}</div> : <div className="empty-state"><span>⌁</span><b>{transactions.length ? 'No local matches' : 'No locally observed writes'}</b><p>Writes remain disabled until a wallet and a real contract address are configured. Demo data creates no transaction history.</p><Link to="/settings" className="button button--dark">Review configuration</Link></div>}
    <div className="lifecycle-rail"><span>SUBMITTED</span><i/><span>PROCESSING</span><i/><span>ACCEPTED</span><i/><span>FINALIZED</span><p>A hash alone does not prove accepted execution or finality.</p></div>
  </div>;
}

export function WebEvidencePage() {
  return <div className="page page--paper"><Heading eyebrow="CAPABILITY GATE / 07" title={<>The page is<br/><em>not the proof.</em></>} intro="Web Render means a GenLayer-runtime retrieval/render capability with validator-visible behavior—not a browser fetch or iframe." side={<StatusTag tone="warn">DISABLED</StatusTag>} /><div className="web-specimen"><div className="browser-chrome"><span/><span/><span/><div>https://public-source.example/fictional-case <b>LOCKED / PREVIEW</b></div></div><div className="web-preview"><div className="web-preview-side"><span>WEB EVIDENCE</span><b>NOT ON-CHAIN ENABLED</b><p>No URL fetch, snapshot, source digest or validator response has been fabricated.</p></div><div className="web-page-sample"><span>DOCUMENT SPECIMEN / EMPTY BY DESIGN</span><div className="skeleton-line short"/><div className="skeleton-line"/><div className="skeleton-line medium"/><div className="skeleton-line short"/><div className="disabled-stamp">CAPABILITY<br/>UNVERIFIED</div></div></div></div><div className="web-gate-list"><div><b>01</b><span>Verify a public GenVM web API on stable Studionet.</span><StatusTag tone="warn">OPEN</StatusTag></div><div><b>02</b><span>Prove validator-visible retrieval and bounded output.</span><StatusTag tone="warn">OPEN</StatusTag></div><div><b>03</b><span>Test drift, redirects, prompt injection and failures.</span><StatusTag tone="warn">OPEN</StatusTag></div></div></div>;
}

export function SettingsPage() {
  const { wallet, connect, disconnect, walletError, addresses, saveAddresses } = useApp();
  const [registry, setRegistry] = useState(addresses.registry); const [evaluator, setEvaluator] = useState(addresses.evaluator);
  const [rpcStatus, setRpcStatus] = useState('Not checked in this browser session.'); const [rpcBusy, setRpcBusy] = useState(false); const [saved, setSaved] = useState(false);
  async function checkRpc() {
    setRpcBusy(true); setRpcStatus('Contacting the SDK-provided Studionet endpoint…');
    try { const id = await probeStudionetRpc(STUDIONET_RPC); setRpcStatus(id === TARGET_CHAIN_ID ? `Verified response: chain ${id}. This verifies RPC identity, not a contract deployment.` : `Wrong network response: chain ${id}; expected ${TARGET_CHAIN_ID}.`); }
    catch (error) { setRpcStatus(error instanceof Error ? error.message : 'RPC identity could not be verified.'); }
    finally { setRpcBusy(false); }
  }
  return <div className="page page--paper"><Heading eyebrow="LOCAL CONFIGURATION / 08" title={<>Set the<br/><em>coordinates.</em></>} intro="Wallet and contract addresses are configured in your browser only. No private key or secret is requested or stored." />
    <div className="settings-grid"><section className="settings-card"><SectionLabel index="01">NETWORK IDENTITY</SectionLabel><div className="setting-value"><span>NETWORK</span><b>GenLayer stable Studionet</b></div><div className="setting-value"><span>CHAIN ID</span><b>{TARGET_CHAIN_ID}</b></div><div className="setting-value"><span>RPC FROM GENLAYERJS {STUDIONET_RPC ? 'CHAIN CONFIG' : ''}</span><code>{STUDIONET_RPC || 'Unavailable in installed SDK definition'}</code></div><button className="button button--dark button--small" type="button" disabled={rpcBusy || !STUDIONET_RPC} onClick={() => void checkRpc()}>{rpcBusy ? 'Checking…' : 'Read-only chain identity check'} <Icon name="arrow" size={15}/></button><p role="status" className="rpc-status">{rpcStatus}</p><p className="detail-caution">This sends only eth_chainId over HTTP. It does not sign, submit a transaction, or touch contract state.</p></section>
      <section className="settings-card"><SectionLabel index="02">DEPLOYED CONTRACT ADDRESSES</SectionLabel><label className="full-label">PrecedentRegistry address<input value={registry} onChange={(e) => { setRegistry(e.target.value); setSaved(false); }} placeholder="0x…" spellCheck={false}/></label><label className="full-label">PrecedentEvaluator address<input value={evaluator} onChange={(e) => { setEvaluator(e.target.value); setSaved(false); }} placeholder="0x…" spellCheck={false}/></label><button className="button button--dark button--small" onClick={() => { saveAddresses({ registry, evaluator }); setSaved(true); }}>Save addresses locally</button>{saved && <p role="status" className="inline-message">Saved to this browser only. Addresses are public; verify them independently before interaction.</p>}<p className="form-blocker">{isAddress(registry) && isAddress(evaluator) ? 'Both address fields are syntactically valid; code identity and deployment are not verified.' : 'No verified deployment addresses are bundled. Writes stay disabled until real addresses are entered.'}</p></section>
      <section className="settings-card settings-card--wide"><SectionLabel index="03">INJECTED WALLET</SectionLabel>{wallet ? <><div className="setting-value"><span>ACCOUNT</span><b className="mono">{wallet.address}</b></div><div className="setting-value"><span>WALLET CHAIN</span><b>{wallet.chainId} · {wallet.chainId === TARGET_CHAIN_ID ? 'MATCH' : 'WRONG NETWORK'}</b></div><button className="button button--dark button--small" onClick={disconnect}>Disconnect this session</button></> : <><p>Writes require an EIP-1193 injected wallet connected to the same `studionet` chain definition used by GenLayerJS. Demo browsing works without one.</p><button className="button button--dark button--small" onClick={() => void connect()}><Icon name="wallet"/> Connect injected wallet</button>{walletError && <p role="alert" className="inline-message">{walletError}</p>}</>}</section></div>
    <div className="settings-footer"><StatusTag tone="warn">TIMESTAMP API NOT VERIFIED</StatusTag><span>Registration sequence is not a timestamp. This app will not infer block time until a supported API is verified.</span><Link to="/verify">View provenance rules <Icon name="arrow" size={14}/></Link></div>
  </div>;
}
