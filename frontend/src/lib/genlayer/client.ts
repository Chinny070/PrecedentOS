import type { CalldataEncodable, TransactionHash } from 'genlayer-js/types';
import { studionet } from 'genlayer-js/chains';
import { TARGET_CHAIN_ID, isAddress } from '../../config/chain';
import {
  codePointLength, sha256Utf8, validDecisionDate, validDigest, validMetadataLabel, validRecordId,
  validateEvidencePacket,
} from '../commitments';

declare global {
  interface Window { ethereum?: InjectedProvider }
}

export interface InjectedProvider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export type GenLayerClient = ReturnType<typeof import('genlayer-js').createClient>;
export type WalletSession = {
  address: `0x${string}`;
  chainId: number;
  client: GenLayerClient;
  provider: InjectedProvider;
};

const loadSdk = async () => {
  const { createClient } = await import('genlayer-js');
  if (studionet.id !== TARGET_CHAIN_ID) {
    throw new Error(`Installed SDK Studionet definition is ${studionet.id}; expected ${TARGET_CHAIN_ID}.`);
  }
  return { createClient, studionet };
};

function parseChainId(value: unknown): number {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error('Wallet returned an invalid eth_chainId value.');
  }
  const chainId = Number(BigInt(value));
  if (!Number.isSafeInteger(chainId)) throw new Error('Wallet returned an unsupported chain ID.');
  return chainId;
}

function checkedAccount(value: unknown): `0x${string}` {
  if (typeof value !== 'string' || !isAddress(value)) throw new Error('The wallet did not return a valid account address.');
  return value as `0x${string}`;
}

async function assertConnectedWallet(provider: InjectedProvider, expectedAddress?: string): Promise<{ address: `0x${string}`; chainId: number }> {
  const [rawAccounts, rawChain] = await Promise.all([
    provider.request({ method: 'eth_accounts' }),
    provider.request({ method: 'eth_chainId' }),
  ]);
  const accounts = rawAccounts;
  if (!Array.isArray(accounts) || accounts.length === 0) throw new Error('No wallet account is currently exposed. Reconnect before continuing.');
  const address = checkedAccount(accounts[0]);
  const chainId = parseChainId(rawChain);
  if (expectedAddress && address.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error('The active wallet account changed. Reconnect before submitting a transaction.');
  }
  if (chainId !== TARGET_CHAIN_ID) throw new Error(`Wallet is on chain ${chainId}; PrecedentOS requires stable Studionet ${TARGET_CHAIN_ID}.`);
  return { address, chainId };
}

export async function createReadClient(): Promise<GenLayerClient> {
  const { createClient, studionet } = await loadSdk();
  return createClient({ chain: studionet });
}

export async function connectInjectedWallet(provider = typeof window === 'undefined' ? undefined : window.ethereum): Promise<WalletSession> {
  if (!provider) throw new Error('No EIP-1193 wallet was detected. You can still use the fictional demo.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || accounts.length === 0) throw new Error('The wallet did not return an account address.');
  const address = checkedAccount(accounts[0]);
  const { createClient, studionet } = await loadSdk();
  const client = createClient({ chain: studionet, account: address, provider });
  // v1.1.8 client.connect reads window.ethereum directly and may add/switch the
  // network and request the GenLayer Snap. Skip that permission flow if already correct.
  const initialChainId = parseChainId(await provider.request({ method: 'eth_chainId' }));
  if (initialChainId !== TARGET_CHAIN_ID) {
    if (typeof window === 'undefined' || window.ethereum !== provider) {
      throw new Error('The pinned GenLayerJS network-switch helper requires this provider to be window.ethereum.');
    }
    await client.connect('studionet');
  }
  const active = await assertConnectedWallet(provider, address);
  return { ...active, client, provider };
}

export async function assertWalletSessionCurrent(session: WalletSession): Promise<void> {
  await assertConnectedWallet(session.provider, session.address);
}

export function watchWalletSession(session: WalletSession, onInvalid: (reason: string) => void): () => void {
  let invalidated = false;
  const invalidate = (reason: string) => {
    if (invalidated) return;
    invalidated = true;
    onInvalid(reason);
  };
  const onAccountsChanged = (...args: unknown[]) => {
    const accounts = args[0];
    const current = Array.isArray(accounts) ? accounts[0] : undefined;
    if (typeof current !== 'string' || current.toLowerCase() !== session.address.toLowerCase()) {
      invalidate('Wallet account changed. Reconnect before continuing.');
    }
  };
  const onChainChanged = (...args: unknown[]) => {
    try {
      const actual = parseChainId(args[0]);
      if (actual !== session.chainId) invalidate(`Wallet network changed to ${actual}. Reconnect before continuing.`);
    } catch {
      invalidate('Wallet reported an invalid network. Reconnect before continuing.');
    }
  };
  const onDisconnect = () => invalidate('Wallet provider disconnected. Reconnect before continuing.');
  session.provider.on?.('accountsChanged', onAccountsChanged);
  session.provider.on?.('chainChanged', onChainChanged);
  session.provider.on?.('disconnect', onDisconnect);
  return () => {
    session.provider.removeListener?.('accountsChanged', onAccountsChanged);
    session.provider.removeListener?.('chainChanged', onChainChanged);
    session.provider.removeListener?.('disconnect', onDisconnect);
  };
}

export async function probeStudionetRpc(rpcUrl: string): Promise<number> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}.`);
  const data = await response.json() as { result?: unknown; error?: { message?: string } };
  if (typeof data.result !== 'string') throw new Error(data.error?.message ?? 'RPC response did not include a chain ID.');
  return parseChainId(data.result);
}

function checkedContractAddress(address: string): `0x${string}` {
  if (!isAddress(address)) throw new Error('A valid 20-byte contract address is required.');
  return address;
}

export async function readPrecedent(client: GenLayerClient, address: string, recordId: string): Promise<Record<string, string>> {
  if (!validRecordId(recordId)) throw new Error('Invalid Registry record identifier.');
  const value: unknown = await client.readContract({ address: checkedContractAddress(address), functionName: 'get_precedent', args: [recordId] });
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Registry returned an unexpected record shape.');
  return value as Record<string, string>;
}

export async function readEvaluation(client: GenLayerClient, address: string, evaluationId: string): Promise<Record<string, string>> {
  if (!validRecordId(evaluationId)) throw new Error('Invalid Evaluator evaluation identifier.');
  const value: unknown = await client.readContract({ address: checkedContractAddress(address), functionName: 'get_evaluation', args: [evaluationId] });
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Evaluator returned an unexpected evaluation shape.');
  return value as Record<string, string>;
}

async function readRecordView(
  client: GenLayerClient, address: string, functionName: string, args: CalldataEncodable[], label: string,
): Promise<Record<string, string>> {
  const value: unknown = await client.readContract({ address: checkedContractAddress(address), functionName, args });
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} returned an unexpected shape.`);
  return value as Record<string, string>;
}

export async function readCase(client: GenLayerClient, address: string, caseId: string): Promise<Record<string, string>> {
  if (!validRecordId(caseId)) throw new Error('Invalid CaseCourt case identifier.');
  return readRecordView(client, address, 'get_case', [caseId], 'CaseCourt case');
}

export async function readCaseEvidence(client: GenLayerClient, address: string, caseId: string, evidenceId: string): Promise<Record<string, string>> {
  if (!validRecordId(caseId) || !validRecordId(evidenceId)) throw new Error('Invalid CaseCourt case or evidence identifier.');
  return readRecordView(client, address, 'get_evidence', [caseId, evidenceId], 'CaseCourt evidence reference');
}

export async function readCaseJudgment(client: GenLayerClient, address: string, judgmentId: string): Promise<Record<string, string>> {
  if (!validRecordId(judgmentId)) throw new Error('Invalid CaseCourt judgment identifier.');
  return readRecordView(client, address, 'get_judgment', [judgmentId], 'CaseCourt judgment');
}

export async function readAppeal(client: GenLayerClient, address: string, appealId: string): Promise<Record<string, string>> {
  if (!validRecordId(appealId)) throw new Error('Invalid CaseCourt appeal identifier.');
  return readRecordView(client, address, 'get_appeal', [appealId], 'CaseCourt appeal');
}

export async function readAppellateRuling(client: GenLayerClient, address: string, appealId: string): Promise<Record<string, string>> {
  if (!validRecordId(appealId)) throw new Error('Invalid CaseCourt appeal identifier.');
  return readRecordView(client, address, 'get_appellate_ruling', [appealId], 'CaseCourt appellate ruling');
}

export async function readWebSource(
  client: GenLayerClient, address: string, caseId: string, sourceId: string, version: number,
): Promise<Record<string, string>> {
  if (!validRecordId(caseId) || !validRecordId(sourceId)) throw new Error('Invalid CaseCourt case or source identifier.');
  return readRecordView(client, address, 'get_web_source', [caseId, sourceId, version], 'CaseCourt web source');
}

export async function readCaseAction(
  client: GenLayerClient, address: string, caseId: string, sequence: number,
): Promise<Record<string, string>> {
  if (!validRecordId(caseId)) throw new Error('Invalid CaseCourt case identifier.');
  return readRecordView(client, address, 'get_case_action', [caseId, sequence], 'CaseCourt case action');
}

export type EvaluationReadbackBinding = {
  evaluationId: string;
  recordAId: string;
  recordADigest: string;
  recordBId: string;
  recordBDigest: string;
  inputCommitment: string;
};

export function assertEvaluationReadbackBinding(
  value: Record<string, string>,
  expected: EvaluationReadbackBinding,
): void {
  const fields: Array<[keyof EvaluationReadbackBinding, string]> = [
    ['evaluationId', 'evaluation_id'],
    ['recordAId', 'record_a_id'],
    ['recordADigest', 'record_a_digest'],
    ['recordBId', 'record_b_id'],
    ['recordBDigest', 'record_b_digest'],
    ['inputCommitment', 'input_commitment'],
  ];
  for (const [expectedField, responseField] of fields) {
    if (value[responseField] !== expected[expectedField]) {
      throw new Error(`Evaluator readback binding mismatch for ${responseField}.`);
    }
  }
  if (!validDigest(value.input_commitment)) throw new Error('Evaluator readback has an invalid input commitment.');
}

async function validateWrite(functionName: string, args: CalldataEncodable[]): Promise<void> {
  if (functionName === 'register_precedent') {
    if (args.length !== 6) throw new Error('register_precedent requires exactly six arguments.');
    const [recordId, digest, schemaVersion, jurisdiction, decisionDate, category] = args;
    if (typeof recordId !== 'string' || !validRecordId(recordId)) throw new Error('Invalid Registry record identifier.');
    if (typeof digest !== 'string' || !validDigest(digest)) throw new Error('Evidence digest must be 64 lowercase hexadecimal characters.');
    if (schemaVersion !== 1) throw new Error('Registry schema version 1 is required.');
    if (typeof jurisdiction !== 'string' || !validMetadataLabel(jurisdiction) || codePointLength(jurisdiction) > 64) throw new Error('Invalid Registry jurisdiction metadata.');
    if (typeof decisionDate !== 'string' || !validDecisionDate(decisionDate)) throw new Error('Registry decision date must be a real YYYY-MM-DD date.');
    if (typeof category !== 'string' || !validMetadataLabel(category) || codePointLength(category) > 64) throw new Error('Invalid Registry category metadata.');
    return;
  }

  if (functionName === 'evaluate_pair') {
    if (args.length !== 9) throw new Error('evaluate_pair requires exactly nine arguments.');
    const [evaluationId, idA, digestA, idB, digestB, packet, evidenceVersion, criteriaVersion, criteria] = args;
    if (typeof evaluationId !== 'string' || !validRecordId(evaluationId)) throw new Error('Invalid Evaluator evaluation identifier.');
    if (typeof idA !== 'string' || !validRecordId(idA) || typeof idB !== 'string' || !validRecordId(idB) || idA === idB) throw new Error('Evaluator requires two distinct valid record identifiers.');
    if (typeof digestA !== 'string' || !validDigest(digestA) || typeof digestB !== 'string' || !validDigest(digestB)) throw new Error('Evidence digests must be 64 lowercase hexadecimal characters.');
    if (typeof packet !== 'string' || typeof criteria !== 'string' || evidenceVersion !== 1 || criteriaVersion !== 1) throw new Error('Unsupported Evaluator packet, schema, or criteria version.');
    let parsed: unknown;
    try { parsed = JSON.parse(packet); } catch { throw new Error('Evaluator evidence packet must be valid JSON.'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Evaluator evidence packet must be an object.');
    const evidence = parsed as Record<string, unknown>;
    if (typeof evidence.precedent_a !== 'string' || typeof evidence.precedent_b !== 'string') throw new Error('Evaluator packet must contain precedent_a and precedent_b text.');
    if (JSON.stringify({ precedent_a: evidence.precedent_a, precedent_b: evidence.precedent_b }) !== packet) throw new Error('Evaluator packet must contain only the two canonical evidence fields.');
    const packetErrors = validateEvidencePacket(evidence.precedent_a, evidence.precedent_b, criteria);
    if (packetErrors.length) throw new Error(packetErrors.join(' '));
    if (await sha256Utf8(evidence.precedent_a) !== digestA || await sha256Utf8(evidence.precedent_b) !== digestB) throw new Error('Evidence digest does not match the exact submitted UTF-8 passage.');
    return;
  }

  if (CASE_COURT_WRITE_METHODS.has(functionName)) {
    await validateCaseCourtWrite(functionName, args);
    return;
  }
  throw new Error(`Unsupported PrecedentOS write method: ${functionName}.`);
}

const CASE_COURT_WRITE_METHODS = new Set([
  'open_case', 'append_evidence', 'lock_evidence', 'adjudicate_case',
  'file_appeal', 'append_appeal_evidence', 'lock_appeal_evidence',
  'propose_appeal_reviewer', 'approve_appeal_reviewer', 'begin_appeal_review',
  'adjudicate_appeal', 'resolve_appeal', 'request_appeal_withdrawal', 'approve_appeal_withdrawal',
  'register_web_source', 'approve_web_source', 'request_web_source_capture',
  'capture_web_source', 'report_web_source_unavailable',
]);

function checkedId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !validRecordId(value)) throw new Error(`Invalid ${label} identifier.`);
  return value;
}

function checkedVersion(value: unknown, label: string): void {
  if (typeof value !== 'bigint' && typeof value !== 'number') throw new Error(`${label} must be a case version integer.`);
}

function checkedCaseDigest(value: unknown, label: string): void {
  if (typeof value !== 'string' || !validDigest(value)) throw new Error(`${label} must be 64 lowercase hexadecimal characters.`);
}

async function validateCaseCourtWrite(functionName: string, args: CalldataEncodable[]): Promise<void> {
  switch (functionName) {
    case 'open_case': {
      if (args.length !== 6) throw new Error('open_case requires exactly six arguments.');
      const [caseId, actionId, respondent, caseType, policyVersion, openingDigest] = args;
      checkedId(caseId, 'case'); checkedId(actionId, 'action');
      if (typeof respondent !== 'string' || !isAddress(respondent)) throw new Error('A valid, distinct respondent address is required.');
      if (typeof caseType !== 'string' || !caseType.trim() || caseType.length > 64) throw new Error('Invalid case type label.');
      if (policyVersion !== 1) throw new Error('Unsupported case policy version.');
      checkedCaseDigest(openingDigest, 'Opening evidence digest');
      return;
    }
    case 'append_evidence':
    case 'append_appeal_evidence': {
      const isAppeal = functionName === 'append_appeal_evidence';
      if (args.length !== (isAppeal ? 7 : 6)) throw new Error(`${functionName} requires exactly ${isAppeal ? 7 : 6} arguments.`);
      const [caseId, ...rest] = args;
      checkedId(caseId, 'case');
      const [appealOrVersion, ...rest2] = rest;
      if (isAppeal) checkedId(appealOrVersion, 'appeal');
      const [expectedVersion, actionId, evidenceId, digest, schemaVersion, sourceRefDigest] = isAppeal
        ? rest2 : [appealOrVersion, ...rest2];
      checkedVersion(expectedVersion, 'Expected version'); checkedId(actionId, 'action'); checkedId(evidenceId, 'evidence');
      checkedCaseDigest(digest, 'Evidence digest');
      if (schemaVersion !== 1) throw new Error('Unsupported evidence schema version.');
      checkedCaseDigest(sourceRefDigest, 'Source reference digest');
      return;
    }
    case 'lock_evidence': {
      if (args.length !== 3) throw new Error('lock_evidence requires exactly three arguments.');
      checkedId(args[0], 'case'); checkedVersion(args[1], 'Expected version'); checkedId(args[2], 'action');
      return;
    }
    case 'lock_appeal_evidence':
    case 'begin_appeal_review': {
      if (args.length !== 4) throw new Error(`${functionName} requires exactly four arguments.`);
      checkedId(args[0], 'case'); checkedId(args[1], 'appeal'); checkedVersion(args[2], 'Expected version'); checkedId(args[3], 'action');
      return;
    }
    case 'adjudicate_case': {
      if (args.length !== 5) throw new Error('adjudicate_case requires exactly five arguments.');
      const [caseId, expectedVersion, actionId, judgmentId, packet] = args;
      checkedId(caseId, 'case'); checkedVersion(expectedVersion, 'Expected version'); checkedId(actionId, 'action'); checkedId(judgmentId, 'judgment');
      if (typeof packet !== 'string') throw new Error('Evidence packet must be a JSON string.');
      let parsed: unknown;
      try { parsed = JSON.parse(packet); } catch { throw new Error('Judgment evidence packet must be valid JSON.'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray((parsed as Record<string, unknown>).evidence)) {
        throw new Error('Judgment evidence packet must contain an evidence array.');
      }
      return;
    }
    case 'file_appeal': {
      if (args.length !== 12) throw new Error('file_appeal requires exactly twelve arguments.');
      const [caseId, expectedVersion, actionId, appealId, targetKind, targetId, targetVersion,
        targetCommitment, parentAppealId, groundsCode, groundsText, groundsDigest] = args;
      checkedId(caseId, 'case'); checkedVersion(expectedVersion, 'Expected version'); checkedId(actionId, 'action'); checkedId(appealId, 'appeal');
      if (targetKind !== 'JUDGMENT' && targetKind !== 'APPELLATE_RULING') throw new Error('Unsupported appeal target kind.');
      checkedId(targetId, 'appeal target');
      checkedVersion(targetVersion, 'Target version');
      checkedCaseDigest(targetCommitment, 'Target commitment');
      if (parentAppealId !== '' && (typeof parentAppealId !== 'string' || !validRecordId(parentAppealId))) throw new Error('Invalid parent appeal identifier.');
      if (!['NEW_EVIDENCE', 'MATERIAL_ERROR', 'PROCEDURAL_CONCERN', 'MISAPPLIED_CRITERIA'].includes(groundsCode as string)) throw new Error('Unsupported appeal grounds code.');
      if (typeof groundsText !== 'string' || !groundsText.trim() || groundsText.length > 600) throw new Error('Invalid appeal grounds text.');
      checkedCaseDigest(groundsDigest, 'Grounds commitment');
      return;
    }
    case 'propose_appeal_reviewer': {
      if (args.length !== 5) throw new Error('propose_appeal_reviewer requires exactly five arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'appeal'); checkedVersion(args[2], 'Expected version'); checkedId(args[3], 'action');
      if (typeof args[4] !== 'string' || !isAddress(args[4])) throw new Error('A valid non-party reviewer address is required.');
      return;
    }
    case 'approve_appeal_reviewer': {
      if (args.length !== 6) throw new Error('approve_appeal_reviewer requires exactly six arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'appeal'); checkedVersion(args[2], 'Expected version'); checkedId(args[3], 'action');
      if (typeof args[4] !== 'string' || !isAddress(args[4])) throw new Error('A valid reviewer address is required.');
      checkedCaseDigest(args[5], 'Reviewer proposal commitment');
      return;
    }
    case 'adjudicate_appeal': {
      if (args.length !== 6) throw new Error('adjudicate_appeal requires exactly six arguments.');
      const [caseId, appealId, expectedVersion, actionId, groundsText, packet] = args;
      checkedId(caseId, 'case'); checkedId(appealId, 'appeal'); checkedVersion(expectedVersion, 'Expected version'); checkedId(actionId, 'action');
      if (typeof groundsText !== 'string' || !groundsText.trim()) throw new Error('Appeal grounds text is required.');
      if (typeof packet !== 'string') throw new Error('Appeal review packet must be a JSON string.');
      try { JSON.parse(packet); } catch { throw new Error('Appeal review packet must be valid JSON.'); }
      return;
    }
    case 'resolve_appeal': {
      if (args.length !== 5) throw new Error('resolve_appeal requires exactly five arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'appeal'); checkedVersion(args[2], 'Expected version'); checkedId(args[3], 'action');
      checkedCaseDigest(args[4], 'Ruling commitment');
      return;
    }
    case 'request_appeal_withdrawal': {
      if (args.length !== 5) throw new Error('request_appeal_withdrawal requires exactly five arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'appeal'); checkedVersion(args[2], 'Expected version'); checkedId(args[3], 'action');
      if (!['CONSENSUAL_EXIT', 'UNABLE_TO_PROCEED', 'EVIDENCE_UNAVAILABLE'].includes(args[4] as string)) throw new Error('Unsupported withdrawal reason code.');
      return;
    }
    case 'approve_appeal_withdrawal': {
      if (args.length !== 4) throw new Error('approve_appeal_withdrawal requires exactly four arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'appeal'); checkedVersion(args[2], 'Expected version'); checkedId(args[3], 'action');
      return;
    }
    case 'register_web_source': {
      if (args.length !== 8) throw new Error('register_web_source requires exactly eight arguments.');
      const [caseId, expectedVersion, actionId, sourceId, sourceUrl, evidenceId, bindingKind, appealId] = args;
      checkedId(caseId, 'case'); checkedVersion(expectedVersion, 'Expected version'); checkedId(actionId, 'action'); checkedId(sourceId, 'web source');
      if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('https://')) throw new Error('Web source URL must be a canonical HTTPS URL.');
      checkedId(evidenceId, 'evidence');
      if (bindingKind !== 'CASE' && bindingKind !== 'APPEAL') throw new Error('Unsupported source binding kind.');
      if (appealId !== '' && (typeof appealId !== 'string' || !validRecordId(appealId))) throw new Error('Invalid appeal identifier for source binding.');
      return;
    }
    case 'approve_web_source': {
      if (args.length !== 5) throw new Error('approve_web_source requires exactly five arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'web source'); checkedVersion(args[2], 'Source version'); checkedVersion(args[3], 'Expected version'); checkedId(args[4], 'action');
      return;
    }
    case 'request_web_source_capture':
    case 'capture_web_source': {
      // request_web_source_capture(case, source, version, expected, action)
      // capture_web_source(case, source, version, request, expected, action)
      const isCapture = functionName === 'capture_web_source';
      if (args.length !== (isCapture ? 6 : 5)) throw new Error(`${functionName} requires exactly ${isCapture ? 6 : 5} arguments.`);
      checkedId(args[0], 'case'); checkedId(args[1], 'web source'); checkedVersion(args[2], 'Source version');
      if (isCapture) checkedId(args[3], 'retrieval request');
      checkedVersion(args[isCapture ? 4 : 3], 'Expected version');
      checkedId(args[isCapture ? 5 : 4], 'action');
      return;
    }
    case 'report_web_source_unavailable': {
      if (args.length !== 7) throw new Error('report_web_source_unavailable requires exactly seven arguments.');
      checkedId(args[0], 'case'); checkedId(args[1], 'web source'); checkedVersion(args[2], 'Source version');
      checkedId(args[3], 'retrieval request'); checkedVersion(args[4], 'Expected version'); checkedId(args[5], 'action');
      if (!['TIMEOUT', 'HTTP_ERROR', 'RENDER_ERROR', 'UNKNOWN'].includes(args[6] as string)) throw new Error('Unsupported unavailable report code.');
      return;
    }
    default:
      throw new Error(`Unsupported CaseCourt write method: ${functionName}.`);
  }
}

export async function writeContractMethod(
  session: WalletSession,
  address: string,
  functionName: string,
  args: CalldataEncodable[],
): Promise<`0x${string}`> {
  const target = checkedContractAddress(address);
  await validateWrite(functionName, args);
  await assertWalletSessionCurrent(session);
  const hash = await session.client.writeContract({ address: target, functionName, args, value: 0n });
  if (typeof hash !== 'string' || !/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error('GenLayerJS returned an invalid transaction hash.');
  return hash as `0x${string}`;
}

export type LifecycleUpdate = { status: 'pending' | 'processing' | 'accepted' | 'finalized' | 'failed' | 'unknown'; detail: string; finalizedAtObserved?: string };
export type LifecycleOptions = { intervalMs?: number; attempts?: number; sleep?: (ms: number) => Promise<void> };
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function statusUpdate(statusName: string | undefined): LifecycleUpdate['status'] {
  if (statusName === 'ACCEPTED') return 'accepted';
  if (statusName === 'FINALIZED') return 'finalized';
  if (statusName === 'CANCELED') return 'failed';
  if (statusName === 'PENDING' || statusName === 'UNINITIALIZED') return 'pending';
  if (statusName === 'UNDETERMINED' || statusName === 'VALIDATORS_TIMEOUT' || statusName === 'LEADER_TIMEOUT') return 'unknown';
  if (statusName && [
    'PROPOSING', 'COMMITTING', 'REVEALING', 'APPEAL_REVEALING',
    'APPEAL_COMMITTING', 'READY_TO_FINALIZE',
  ].includes(statusName)) return 'processing';
  return 'unknown';
}

export async function trackTransactionLifecycle(
  client: GenLayerClient,
  hash: `0x${string}`,
  onUpdate: (update: LifecycleUpdate) => void = () => undefined,
  options: LifecycleOptions = {},
): Promise<LifecycleUpdate> {
  const intervalMs = options.intervalMs ?? 3000;
  const attempts = options.attempts ?? 40;
  const sleep = options.sleep ?? defaultSleep;
  let lastStatus = '';
  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const transaction = await client.getTransaction({ hash: hash as TransactionHash });
      const name = transaction.statusName;
      const mapped = name === 'FINALIZED' ? 'processing' : statusUpdate(name);
      if (name !== lastStatus) {
        onUpdate({ status: mapped, detail: name === 'FINALIZED' ? 'FINALIZED observed; checking consensus and execution results.' : name ?? 'Transaction status was not provided by GenLayerJS.' });
        lastStatus = name ?? '';
      }
      if (name === 'CANCELED') return { status: 'failed', detail: 'Transaction was canceled.' };
      if (name === 'UNDETERMINED' || name === 'VALIDATORS_TIMEOUT' || name === 'LEADER_TIMEOUT') {
        const result = { status: 'unknown' as const, detail: `Consensus ended without an accepted decision (${name}).` };
        onUpdate(result);
        return result;
      }
      if (name === 'FINALIZED') {
        const { TransactionStatus, ExecutionResult } = await import('genlayer-js/types');
        const receipt = await client.waitForTransactionReceipt({ hash: hash as TransactionHash, status: TransactionStatus.FINALIZED, interval: 0, retries: 0 });
        if (receipt.statusName !== 'FINALIZED') {
          const result = { status: 'unknown' as const, detail: `Final receipt did not confirm FINALIZED (${receipt.statusName ?? 'unknown'}).` };
          onUpdate(result);
          return result;
        }
        // GenLayerJS 1.1.8 exposes resultName on both getTransaction and the
        // receipt. A leader's successful GenVM return is not accepted consensus.
        // Require an explicit majority agreement in both reads before promoting
        // the result to finalized success. Missing or disagreeing metadata fails
        // closed because older/studio responses may not include this field.
        if (transaction.resultName !== 'MAJORITY_AGREE' || receipt.resultName !== 'MAJORITY_AGREE') {
          const result = transaction.resultName === undefined || receipt.resultName === undefined
            ? { status: 'unknown' as const, detail: 'Finalized transaction is missing explicit majority-agreement evidence.' }
            : { status: 'failed' as const, detail: `Transaction did not finalize with majority agreement (transaction=${transaction.resultName}, receipt=${receipt.resultName}).` };
          onUpdate(result);
          return result;
        }
        if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN) {
          const result = { status: 'finalized' as const, detail: `MAJORITY_AGREE · ${receipt.txExecutionResultName}`, finalizedAtObserved: new Date().toISOString() };
          onUpdate(result);
          return result;
        }
        if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
          const result = { status: 'failed' as const, detail: 'Finalized execution returned FINISHED_WITH_ERROR.', finalizedAtObserved: new Date().toISOString() };
          onUpdate(result);
          return result;
        }
        const result = { status: 'unknown' as const, detail: `Finalized receipt has no successful execution result (${receipt.txExecutionResultName ?? 'missing'}).` };
        onUpdate(result);
        return result;
      }
      if (attempt + 1 < attempts) await sleep(intervalMs);
    }
    const result = { status: 'unknown' as const, detail: `No finalized result was observed after ${attempts} status checks.` };
    onUpdate(result);
    return result;
  } catch (error) {
    const result = { status: 'unknown' as const, detail: error instanceof Error ? error.message : 'Transaction lifecycle could not be read.' };
    onUpdate(result);
    return result;
  }
}
