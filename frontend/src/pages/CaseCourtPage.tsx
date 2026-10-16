import { useState, type FormEvent, type ReactNode } from 'react';
import { isAddress } from '../config/chain';
import { Icon } from '../components/Icons';
import { SectionLabel, StatusTag } from '../components/StatusTag';
import { useApp } from '../state/AppContext';
import { sha256Utf8, validRecordId } from '../lib/commitments';
import { prepareAppealJudgmentTarget } from '../lib/genlayer/caseCourtAppeals';
import {
  createReadClient, readAppeal, readAppellateRuling, readCaseJudgment, readCase as readCaseSnapshot,
  readWebSource, trackTransactionLifecycle, writeContractMethod, type WalletSession,
} from '../lib/genlayer/client';
import type { TransactionTrace } from '../types/domain';

function Heading({ eyebrow, title, intro, side }: { eyebrow: string; title: ReactNode; intro?: string; side?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{side && <div className="page-heading-side">{side}</div>}</div>;
}

function DataNote({ children }: { children: ReactNode }) {
  return <div className="data-note"><span className="data-note-icon">i</span><span>{children}</span></div>;
}

function newActionId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function ReadbackCard({ title, value, empty }: { title: string; value: Record<string, string> | null; empty: string }) {
  if (!value || Object.keys(value).length === 0) return <div className="empty-state"><span>∅</span><b>{empty}</b></div>;
  return <div className="readback-card"><h4>{title}</h4><div className="readback-grid">
    {Object.entries(value).map(([key, val]) => <div key={key}><span>{key}</span><code>{val}</code></div>)}
  </div></div>;
}

type Runner = (label: string, action: () => Promise<`0x${string}`>, onFinalized?: () => void) => Promise<void>;

export function CaseCourtPage() {
  const { wallet, addresses, saveTransaction, updateTransaction } = useApp();
  const [caseId, setCaseId] = useState('');
  const [caseSnapshot, setCaseSnapshot] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Local-only memory of appended evidence text, keyed by evidence_id, so the
  // judgment packet can be reconstructed exactly. The raw text is never sent
  // anywhere by this memory itself; only its SHA-256 digest went on-chain at
  // append time, and the full text is sent once, explicitly, by the judgment
  // submission below.
  const [evidenceTexts, setEvidenceTexts] = useState<Record<string, string>>({});

  const configured = isAddress(addresses.caseCourt);
  const [pending, setPending] = useState<{ hash: `0x${string}`; label: string; onFinalized?: () => void } | null>(null);
  const [rechecking, setRechecking] = useState(false);

  function poll(hash: `0x${string}`, label: string, onFinalized?: () => void) {
    if (!wallet) return;
    setPending({ hash, label, onFinalized });
    void trackTransactionLifecycle(wallet.client, hash, (update) => {
      updateTransaction(hash, { ...update, storedLocally: false });
      if (update.status === 'failed') {
        setPending(null);
        setMessage(`${label} did not complete: ${update.detail}`);
      }
      if (update.status === 'unknown') setMessage(`${label} status is unresolved: ${update.detail}`);
      if (update.status === 'finalized') {
        setPending(null);
        setMessage(`${label} finalized with majority agreement and a successful return.`);
        onFinalized?.();
      }
    });
  }

  async function recheckPending() {
    if (!pending) return;
    setRechecking(true); setMessage(`Re-checking ${pending.label}…`);
    try { poll(pending.hash, pending.label, pending.onFinalized); }
    finally { setRechecking(false); }
  }

  const run: Runner = async (label, action, onFinalized) => {
    if (!wallet) { setMessage('Connect a Studionet wallet in Settings before submitting a transaction.'); return; }
    if (pending) { setMessage(`Wait for ${pending.label} to reach a known terminal status before submitting a dependent write.`); return; }
    if (busy) { setMessage('A transaction submission is already being prepared.'); return; }
    setMessage(''); setBusy(true);
    try {
      const hash = await action();
      const tx: TransactionTrace = { hash, action: label, status: 'submitted', submittedAtLocal: new Date().toISOString() };
      saveTransaction(tx);
      setMessage(`Submitted ${hash}.`);
      poll(hash, label, onFinalized);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${label} was not submitted.`);
    } finally {
      setBusy(false);
    }
  };

  async function loadCase() {
    if (!validRecordId(caseId)) { setMessage('Enter a valid case identifier first.'); return; }
    setMessage(''); setBusy(true);
    try {
      const client = await createReadClient();
      const value = await readCaseSnapshot(client, addresses.caseCourt, caseId);
      setCaseSnapshot(Object.keys(value).length ? value : null);
      setMessage(Object.keys(value).length ? `Loaded case ${caseId} at version ${value.version}.` : 'No case found at that identifier.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Case readback failed.');
    } finally { setBusy(false); }
  }

  if (!configured) {
    return <div className="page page--paper">
      <Heading eyebrow="CASE LIFECYCLE / 04" title={<>Open a<br/><em>fictional case.</em></>} intro="Configure the deployed CaseCourt address in Settings to enable case lifecycle reads and writes." side={<StatusTag tone="warn">NO CASECOURT ADDRESS</StatusTag>} />
      <div className="form-blocker">No CaseCourt address is configured. Add a verified deployed address in Settings.</div>
    </div>;
  }

  const version = caseSnapshot ? Number(caseSnapshot.version) : undefined;

  return <div className="page page--paper">
    <Heading eyebrow="CASE LIFECYCLE / 04" title={<>Open, evidence,<br/><em>and adjudicate.</em></>}
      intro="Every control below sends a real transaction to the configured CaseCourt contract. FINALIZED + MAJORITY_AGREE + FINISHED_WITH_RETURN is required before any result is treated as accepted; a transaction can still fail or roll back after submission."
      side={<StatusTag tone={wallet ? 'good' : 'warn'}>{wallet ? 'WALLET CONNECTED' : 'CONNECT WALLET IN SETTINGS'}</StatusTag>} />
    <DataNote>This fictional research prototype lets either named party submit and lock case evidence; it does not require respondent acknowledgement or define a response window. That is a bilateral fairness limitation, not a neutral court process. An accepted Equivalence Principle result is a protocol execution outcome, not a guarantee of legal correctness.</DataNote>

    <section className="settings-card">
      <SectionLabel index="A">CASE IDENTITY</SectionLabel>
      <div className="form-row">
        <label>Case ID<input value={caseId} maxLength={48} onChange={(e) => setCaseId(e.target.value.toUpperCase())} placeholder="FICT-CASE-STUDIO-003"/></label>
        <button type="button" className="button button--dark button--small" disabled={busy} onClick={() => void loadCase()}>Load case readback <Icon name="arrow" size={14}/></button>
      </div>
      <ReadbackCard title={`get_case("${caseId}")`} value={caseSnapshot} empty="No case loaded yet." />
    </section>

    <OpenCaseSection wallet={wallet} address={addresses.caseCourt} run={run} reload={loadCase} caseId={caseId} />
    <EvidenceSection wallet={wallet} address={addresses.caseCourt} run={run} reload={loadCase} caseId={caseId}
      version={version} phase={caseSnapshot?.phase} evidenceCount={caseSnapshot ? Number(caseSnapshot.evidence_count) : 0}
      evidenceTexts={evidenceTexts} setEvidenceTexts={setEvidenceTexts} />
    <JudgmentSection wallet={wallet} address={addresses.caseCourt} run={run} reload={loadCase} caseId={caseId}
      version={version} evidenceTexts={evidenceTexts} />
    <AppealSection wallet={wallet} address={addresses.caseCourt} run={run} reload={loadCase} caseId={caseId} version={version} evidenceTexts={evidenceTexts} />
    <WebRenderSection wallet={wallet} address={addresses.caseCourt} run={run} caseId={caseId} />

    {message && <div role="status" className="inline-message">{message}{pending && <button type="button" className="button button--dark button--small" disabled={rechecking} onClick={() => void recheckPending()} style={{ marginLeft: 12 }}>{rechecking ? 'Checking…' : 'Check again'}</button>}</div>}
  </div>;
}

function OpenCaseSection({ wallet, address, run, reload, caseId }: {
  wallet: WalletSession | null; address: string; run: Runner; reload: () => Promise<void>; caseId: string;
}) {
  const [respondent, setRespondent] = useState('');
  const [caseType, setCaseType] = useState('Fictional Permit Dispute');
  const [summary, setSummary] = useState('Fictional case opening summary for this record.');
  const ready = Boolean(wallet) && validRecordId(caseId) && isAddress(respondent) && caseType.trim().length > 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || !wallet) return;
    await run(`Open case ${caseId}`, async () => {
      const digest = await sha256Utf8(summary);
      const actionId = newActionId('OPEN');
      return writeContractMethod(wallet, address, 'open_case', [caseId, actionId, respondent, caseType, 1, digest]);
    }, reload);
  }
  return <section className="settings-card">
    <SectionLabel index="B">OPEN CASE</SectionLabel>
    <p>Opens a new case bound to the connected wallet (petitioner) and a distinct respondent address.</p>
    <form className="form-row" onSubmit={submit}>
      <label>Respondent address<input value={respondent} onChange={(e) => setRespondent(e.target.value)} placeholder="0x…"/></label>
      <label>Case type<input value={caseType} onChange={(e) => setCaseType(e.target.value)} maxLength={64}/></label>
      <label className="full-label">Opening summary (hashed locally)<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2}/></label>
      <button type="submit" className="button button--dark" disabled={!ready}>Submit open_case <Icon name="arrow" size={14}/></button>
      {!isAddress(respondent) && <small>Enter a valid, distinct respondent address.</small>}
    </form>
  </section>;
}

function EvidenceSection({ wallet, address, run, reload, caseId, version, phase, evidenceCount, evidenceTexts, setEvidenceTexts }: {
  wallet: WalletSession | null; address: string; run: Runner; reload: () => Promise<void>; caseId: string;
  version?: number; phase?: string; evidenceCount: number;
  evidenceTexts: Record<string, string>; setEvidenceTexts: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
}) {
  const [evidenceId, setEvidenceId] = useState('');
  const [text, setText] = useState('');
  const ready = Boolean(wallet) && validRecordId(caseId) && validRecordId(evidenceId) && text.trim().length > 0 && version !== undefined;
  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    if (!ready || !wallet || version === undefined) return;
    const digest = await sha256Utf8(text);
    const sourceRefDigest = await sha256Utf8(`SOURCE-REFERENCE: ${evidenceId}`);
    const actionId = newActionId('EV');
    const capturedId = evidenceId; const capturedText = text;
    await run(`Append evidence ${evidenceId} to ${caseId}`, () => writeContractMethod(
      wallet, address, 'append_evidence', [caseId, version, actionId, evidenceId, digest, 1, sourceRefDigest],
    ), () => { setEvidenceTexts((prev) => ({ ...prev, [capturedId]: capturedText })); void reload(); });
  }
  async function submitLock() {
    if (!wallet || version === undefined) return;
    const actionId = newActionId('LOCK');
    await run(`Lock evidence for ${caseId}`, () => writeContractMethod(wallet, address, 'lock_evidence', [caseId, version, actionId]), reload);
  }
  return <section className="settings-card">
    <SectionLabel index="C">EVIDENCE</SectionLabel>
    <p>Current phase: <b>{phase ?? 'unknown'}</b> · evidence count: <b>{evidenceCount}</b></p>
    <form className="form-row" onSubmit={submitEvidence}>
      <label>Evidence ID<input value={evidenceId} maxLength={48} onChange={(e) => setEvidenceId(e.target.value.toUpperCase())}/></label>
      <label className="full-label">Evidence text (hashed locally; exact bytes required for the judgment packet)<textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}/></label>
      <button type="submit" className="button button--dark" disabled={!ready}>Submit append_evidence <Icon name="arrow" size={14}/></button>
    </form>
    <button type="button" className="button button--dark button--small" disabled={!wallet || version === undefined} onClick={() => void submitLock()}>Submit lock_evidence</button>
    {Object.keys(evidenceTexts).length > 0 && <div className="readback-card"><h4>Locally remembered evidence text (for the judgment packet)</h4><div className="readback-grid">
      {Object.entries(evidenceTexts).map(([id, value]) => <div key={id}><span>{id}</span><code>{value.slice(0, 80)}{value.length > 80 ? '…' : ''}</code></div>)}
    </div></div>}
  </section>;
}

function JudgmentSection({ wallet, address, run, reload, caseId, version, evidenceTexts }: {
  wallet: WalletSession | null; address: string; run: Runner; reload: () => Promise<void>; caseId: string;
  version?: number; evidenceTexts: Record<string, string>;
}) {
  const [judgmentId, setJudgmentId] = useState('');
  const [judgment, setJudgment] = useState<Record<string, string> | null>(null);
  const ready = Boolean(wallet) && validRecordId(caseId) && validRecordId(judgmentId) && version !== undefined && Object.keys(evidenceTexts).length > 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || !wallet || version === undefined) return;
    const packet = JSON.stringify({ evidence: Object.entries(evidenceTexts).map(([id, text]) => ({ evidence_id: id, text })) });
    const actionId = newActionId('ADJ');
    await run(`Adjudicate case ${caseId}`, () => writeContractMethod(wallet, address, 'adjudicate_case', [caseId, version, actionId, judgmentId, packet]), reload);
  }
  async function loadJudgment() {
    if (!validRecordId(judgmentId)) return;
    const client = await createReadClient();
    const value = await readCaseJudgment(client, address, judgmentId);
    setJudgment(Object.keys(value).length ? value : null);
  }
  return <section className="settings-card">
    <SectionLabel index="D">AI JUDGMENT</SectionLabel>
    <p>The evidence packet is rebuilt automatically from the locally remembered evidence text appended above, in append order. It must match the locked on-chain digests exactly.</p>
    <form className="form-row" onSubmit={submit}>
      <label>Judgment ID<input value={judgmentId} maxLength={48} onChange={(e) => setJudgmentId(e.target.value.toUpperCase())}/></label>
      <button type="submit" className="button button--dark" disabled={!ready}>Submit adjudicate_case <Icon name="arrow" size={14}/></button>
    </form>
    <button type="button" className="button button--dark button--small" onClick={() => void loadJudgment()}>Load get_judgment readback</button>
    <ReadbackCard title={`get_judgment("${judgmentId}")`} value={judgment} empty="No judgment loaded yet." />
  </section>;
}

function AppealSection({ wallet, address, run, reload, caseId, version, evidenceTexts }: {
  wallet: WalletSession | null; address: string; run: Runner; reload: () => Promise<void>; caseId: string; version?: number;
  evidenceTexts: Record<string, string>;
}) {
  const [appealId, setAppealId] = useState('');
  const [groundsCode, setGroundsCode] = useState<'NEW_EVIDENCE' | 'MATERIAL_ERROR' | 'PROCEDURAL_CONCERN' | 'MISAPPLIED_CRITERIA'>('MATERIAL_ERROR');
  const [groundsText, setGroundsText] = useState('Fictional appeal grounds for review.');
  const [targetId, setTargetId] = useState('');
  const [appealEvidenceId, setAppealEvidenceId] = useState('');
  const [appealEvidenceText, setAppealEvidenceText] = useState('');
  const [appealEvidenceTexts, setAppealEvidenceTexts] = useState<Record<string, string>>({});
  const [appealMessage, setAppealMessage] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [proposalCommitment, setProposalCommitment] = useState('');
  const [appeal, setAppeal] = useState<Record<string, string> | null>(null);

  async function loadAppealReadback() {
    if (!validRecordId(appealId)) return;
    const client = await createReadClient();
    const value = await readAppeal(client, address, appealId);
    setAppeal(Object.keys(value).length ? value : null);
    if (value.reviewer_proposal_commitment) setProposalCommitment(value.reviewer_proposal_commitment);
  }
  async function fileAppeal(event: FormEvent) {
    event.preventDefault();
    if (!wallet || version === undefined || !validRecordId(targetId) || !validRecordId(appealId)) return;
    setAppealMessage('');
    try {
      const client = await createReadClient();
      const target = await readCaseJudgment(client, address, targetId);
      const groundsDigest = await sha256Utf8(groundsText);
      const preparedTarget = await prepareAppealJudgmentTarget(
        target, caseId, appealId, targetId, wallet.address, groundsCode, groundsDigest,
      );
      const actionId = newActionId('FILE');
      await run(`File appeal ${appealId}`, () => writeContractMethod(wallet, address, 'file_appeal', [
        caseId, version, actionId, appealId, 'JUDGMENT', targetId, preparedTarget.target_version, preparedTarget.target_commitment, '',
        groundsCode, groundsText, groundsDigest, preparedTarget.filing_commitment,
      ]), reload);
    } catch (error) {
      setAppealMessage(error instanceof Error ? `Appeal filing stopped: ${error.message}` : 'Appeal target readback failed. Appeal filing stopped.');
    }
  }
  async function appendAppealEvidence(event: FormEvent) {
    event.preventDefault();
    if (!wallet || version === undefined || !validRecordId(caseId) || !validRecordId(appealId)
      || !validRecordId(appealEvidenceId) || !appealEvidenceText.trim()) return;
    setAppealMessage('');
    const digest = await sha256Utf8(appealEvidenceText);
    const sourceDigest = await sha256Utf8(`APPEAL-SOURCE-REFERENCE: ${appealEvidenceId}`);
    const id = appealEvidenceId; const text = appealEvidenceText;
    await run(`Append appeal evidence ${id}`, () => writeContractMethod(wallet, address, 'append_appeal_evidence', [
      caseId, appealId, version, newActionId('APEVID'), id, digest, 1, sourceDigest,
    ]), () => { setAppealEvidenceTexts((prev) => ({ ...prev, [id]: text })); void reload(); void loadAppealReadback(); });
  }
  async function lockAppealEvidence() {
    if (!wallet || version === undefined) return;
    await run(`Lock appeal evidence ${appealId}`, () => writeContractMethod(wallet, address, 'lock_appeal_evidence', [caseId, appealId, version, newActionId('APLOCK')]), reload);
  }
  async function proposeReviewer() {
    if (!wallet || version === undefined || !isAddress(reviewer)) return;
    await run(`Propose reviewer for ${appealId}`, () => writeContractMethod(wallet, address, 'propose_appeal_reviewer', [caseId, appealId, version, newActionId('RVPROP'), reviewer]), () => { void reload(); void loadAppealReadback(); });
  }
  async function approveReviewer() {
    if (!wallet || version === undefined || !isAddress(reviewer) || !proposalCommitment) return;
    await run(`Approve reviewer for ${appealId}`, () => writeContractMethod(wallet, address, 'approve_appeal_reviewer', [caseId, appealId, version, newActionId('RVAPR'), reviewer, proposalCommitment]), reload);
  }
  async function beginReview() {
    if (!wallet || version === undefined) return;
    await run(`Begin review of ${appealId}`, () => writeContractMethod(wallet, address, 'begin_appeal_review', [caseId, appealId, version, newActionId('BEGIN')]), reload);
  }
  async function adjudicateAppeal() {
    if (!wallet || version === undefined) return;
    const originalEvidence = Object.entries(evidenceTexts).map(([evidence_id, text]) => ({ evidence_id, text }));
    const addedEvidence = Object.entries(appealEvidenceTexts).map(([evidence_id, text]) => ({ evidence_id, text }));
    if (!originalEvidence.length) { setAppealMessage('Original evidence text is unavailable. Reload/re-enter the exact committed evidence before adjudicating the appeal.'); return; }
    const packet = JSON.stringify({ original_evidence: originalEvidence, appeal_evidence: addedEvidence });
    await run(`Adjudicate appeal ${appealId}`, () => writeContractMethod(wallet, address, 'adjudicate_appeal', [
      caseId, appealId, version, newActionId('APADJ'), groundsText, packet,
    ]), () => { void reload(); void loadAppealReadback(); void loadRulingReadback(); });
  }
  const [ruling, setRuling] = useState<Record<string, string> | null>(null);
  async function loadRulingReadback() {
    if (!validRecordId(appealId)) return;
    const client = await createReadClient();
    const value = await readAppellateRuling(client, address, appealId);
    setRuling(Object.keys(value).length ? value : null);
  }
  async function resolveAppeal() {
    if (!wallet || version === undefined) return;
    const client = await createReadClient();
    const ruling = await readAppellateRuling(client, address, appealId);
    if (!ruling.ruling_commitment) return;
    await run(`Resolve appeal ${appealId}`, () => writeContractMethod(wallet, address, 'resolve_appeal', [caseId, appealId, version, newActionId('RESOLVE'), ruling.ruling_commitment]), reload);
  }

  return <section className="settings-card">
    <SectionLabel index="E">APPEAL &amp; MUTUALLY APPROVED REVIEWER</SectionLabel>
    <p>A reviewer must be a non-party, mutually proposed by one case party and approved by the other, before review can begin. Neither party can self-appoint, and only the bound reviewer may begin review or adjudicate.</p>
    {appealMessage && <div role="status" className="inline-message">{appealMessage}</div>}
    <form className="form-row" onSubmit={fileAppeal}>
      <label>Appeal ID<input value={appealId} maxLength={48} onChange={(e) => setAppealId(e.target.value.toUpperCase())}/></label>
      <label>Target judgment ID<input value={targetId} maxLength={48} onChange={(e) => setTargetId(e.target.value.toUpperCase())}/></label>
      <label>Grounds code<select value={groundsCode} onChange={(e) => setGroundsCode(e.target.value as typeof groundsCode)}>
        <option value="NEW_EVIDENCE">NEW_EVIDENCE</option><option value="MATERIAL_ERROR">MATERIAL_ERROR</option>
        <option value="PROCEDURAL_CONCERN">PROCEDURAL_CONCERN</option><option value="MISAPPLIED_CRITERIA">MISAPPLIED_CRITERIA</option>
      </select></label>
      <label className="full-label">Grounds text<textarea value={groundsText} onChange={(e) => setGroundsText(e.target.value)} rows={2}/></label>
      <button type="submit" className="button button--dark" disabled={!wallet || version === undefined || !validRecordId(caseId) || !validRecordId(targetId) || !validRecordId(appealId) || !groundsText.trim()}>Submit file_appeal <Icon name="arrow" size={14}/></button>
    </form>
    <form className="form-row" onSubmit={appendAppealEvidence}>
      <label>Appeal evidence ID<input value={appealEvidenceId} maxLength={48} onChange={(e) => setAppealEvidenceId(e.target.value.toUpperCase())}/></label>
      <label className="full-label">Appeal evidence text (exact bytes are committed)<textarea value={appealEvidenceText} onChange={(e) => setAppealEvidenceText(e.target.value)} rows={3}/></label>
      <button type="submit" className="button button--dark button--small" disabled={!wallet || version === undefined || !validRecordId(caseId) || !validRecordId(appealId) || !validRecordId(appealEvidenceId) || !appealEvidenceText.trim()}>append_appeal_evidence</button>
    </form>
    <div className="form-row">
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void lockAppealEvidence()}>lock_appeal_evidence</button>
      <label>Proposed reviewer address<input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="0x… (non-party)"/></label>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void proposeReviewer()}>propose_appeal_reviewer</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void approveReviewer()}>approve_appeal_reviewer (other party)</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void beginReview()}>begin_appeal_review (reviewer only)</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void adjudicateAppeal()}>adjudicate_appeal (bound reviewer)</button>
      <button type="button" className="button button--dark button--small" onClick={() => void loadRulingReadback()}>Load get_appellate_ruling</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void resolveAppeal()}>resolve_appeal</button>
      <button type="button" className="button button--dark button--small" onClick={() => void loadAppealReadback()}>Load get_appeal readback</button>
    </div>
    <ReadbackCard title={`get_appeal("${appealId}")`} value={appeal} empty="No appeal loaded yet." />
    <ReadbackCard title={`get_appellate_ruling("${appealId}")`} value={ruling} empty="No appellate ruling loaded yet." />
  </section>;
}

function WebRenderSection({ wallet, address, run, caseId }: {
  wallet: WalletSession | null; address: string; run: Runner; caseId: string;
}) {
  const [sourceId, setSourceId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('https://docs.genlayer.com/');
  const [evidenceId, setEvidenceId] = useState('');
  const [sourceVersion, setSourceVersion] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [source, setSource] = useState<Record<string, string> | null>(null);
  const [expectedVersion, setExpectedVersion] = useState<number | ''>('');

  async function loadSource() {
    if (!validRecordId(sourceId)) return;
    const client = await createReadClient();
    const value = await readWebSource(client, address, caseId, sourceId, sourceVersion);
    setSource(Object.keys(value).length ? value : null);
  }
  async function register() {
    if (!wallet || expectedVersion === '') return;
    await run(`Register web source ${sourceId}`, () => writeContractMethod(wallet, address, 'register_web_source', [
      caseId, expectedVersion, newActionId('WSREG'), sourceId, sourceUrl, evidenceId, 'CASE', '',
    ]), loadSource);
  }
  async function approve() {
    if (!wallet || expectedVersion === '') return;
    await run(`Approve web source ${sourceId}`, () => writeContractMethod(wallet, address, 'approve_web_source', [
      caseId, sourceId, sourceVersion, expectedVersion, newActionId('WSAPR'),
    ]), loadSource);
  }
  async function requestCapture() {
    if (!wallet || expectedVersion === '') return;
    const id = newActionId('WSREQ');
    setRequestId(id);
    await run(`Request capture for ${sourceId}`, () => writeContractMethod(wallet, address, 'request_web_source_capture', [
      caseId, sourceId, sourceVersion, expectedVersion, id,
    ]), loadSource);
  }
  async function capture() {
    if (!wallet || expectedVersion === '' || !requestId) return;
    await run(`Capture web source ${sourceId}`, () => writeContractMethod(wallet, address, 'capture_web_source', [
      caseId, sourceId, sourceVersion, requestId, expectedVersion, newActionId('WSCAP'),
    ]), loadSource);
  }

  return <section className="settings-card">
    <SectionLabel index="F">WEB RENDER</SectionLabel>
    <p>Only hosts on the deployed contract's curated allowlist (currently <code>genlayer.com</code>) may be registered. This does not independently verify the pinned GenVM runner's own redirect or egress handling — that remains unverified from this repository.</p>
    <div className="form-row">
      <label>Source ID<input value={sourceId} maxLength={48} onChange={(e) => setSourceId(e.target.value.toUpperCase())}/></label>
      <label>Evidence ID<input value={evidenceId} maxLength={48} onChange={(e) => setEvidenceId(e.target.value.toUpperCase())}/></label>
      <label>Source URL<input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}/></label>
      <label>Source version<input type="number" min={1} value={sourceVersion} onChange={(e) => setSourceVersion(Number(e.target.value) || 1)}/></label>
      <label>Current case version (for expected_version)<input type="number" min={1} value={expectedVersion} onChange={(e) => setExpectedVersion(e.target.value ? Number(e.target.value) : '')}/></label>
    </div>
    <div className="form-row">
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void register()}>register_web_source</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void approve()}>approve_web_source (other party)</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void requestCapture()}>request_web_source_capture</button>
      <button type="button" className="button button--dark button--small" disabled={!wallet} onClick={() => void capture()}>capture_web_source</button>
      <button type="button" className="button button--dark button--small" onClick={() => void loadSource()}>Load get_web_source readback</button>
    </div>
    <ReadbackCard title={`get_web_source("${sourceId}", v${sourceVersion})`} value={source} empty="No web source loaded yet." />
  </section>;
}
