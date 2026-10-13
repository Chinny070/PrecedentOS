/** Local-only schema and commitment helpers for a future case-bound decision.
 * These checks do not prove a contract address, chain receipt, validator vote,
 * or finality. A runtime-backed adapter must supply those proofs separately.
 */
import { isAddress } from '../../config/chain';
import { sha256Utf8, validDigest, validRecordId } from '../commitments';

export const CASE_EVIDENCE_SCHEMA_VERSION = 1 as const;
export const CASE_DECISION_SCHEMA_VERSION = 1 as const;
export const SUPPORTED_CASE_POLICY_VERSION = 1 as const;
export const SUPPORTED_CASE_CRITERIA_VERSION = 1 as const;
export const TARGET_CASE_DECISION_CHAIN_ID = 61999 as const;
export const MAX_CASE_EVIDENCE_REFERENCES = 32;

const encoder = new TextEncoder();
const CLASSIFICATIONS = new Set(['SUPPORTED', 'NOT_SUPPORTED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE']);
const OUTCOMES = new Set(['GRANT', 'DENY', 'REMAND', 'NO_RECOMMENDATION']);

export type CaseDecisionAuthorityStatus =
  | 'UNSUBMITTED'
  | 'PENDING'
  | 'ACCEPTED_PROVISIONAL'
  | 'FINALIZED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'UNVERIFIED_LOCAL_SCHEMA';

export type CaseDecisionDeploymentIdentity = {
  chainId: number;
  caseCourtAddress: `0x${string}`;
  /** B architecture runs adjudication inside CaseCourt; this remains the same address. */
  recordingContractAddress: `0x${string}`;
  manifestStatus: 'UNVERIFIED' | 'OPERATOR_REVIEWED';
};

export type CaseEvidenceReference = {
  sequence: number;
  evidenceId: string;
  digest: string;
  schemaVersion: number;
  sourceReferenceDigest: string;
};

export type CaseDecisionContext = {
  chainId: number;
  caseId: string;
  caseVersion: number;
  caseEvidenceCommitment: string;
  policyVersion: number;
  criteriaVersion: number;
  criteriaDigest: string;
  courtAddress: `0x${string}`;
  petitioner: `0x${string}`;
  respondent: `0x${string}`;
};

export type CaseDecisionRecord = {
  decisionId: string;
  chainId: number;
  caseId: string;
  caseVersion: number;
  caseEvidenceCommitment: string;
  policyVersion: number;
  criteriaVersion: number;
  criteriaDigest: string;
  decisionSchemaVersion: number;
  courtAddress: `0x${string}`;
  inputCommitment: string;
  classification: string;
  recommendedOutcome: string;
  evidenceSufficient: boolean;
  reasonsDigest: string;
  resultDigest: string;
  recordingContractAddress: `0x${string}`;
};

export type CaseAppealTarget = {
  caseId: string;
  decisionId: string;
  decisionVersion: number;
  resultDigest: string;
};

export class CaseDecisionValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'CaseDecisionValidationError';
  }
}

export function validateDeploymentIdentity(identity: CaseDecisionDeploymentIdentity): void {
  if (identity.manifestStatus !== 'OPERATOR_REVIEWED') fail('deployment_manifest_not_reviewed');
  if (identity.chainId !== TARGET_CASE_DECISION_CHAIN_ID) fail('deployment_chain_id_mismatch');
  const courtAddress = requireAddress(identity.caseCourtAddress, 'case_court_address');
  if (requireAddress(identity.recordingContractAddress, 'recording_contract_address') !== courtAddress) {
    fail('deployment_contract_identity_mismatch');
  }
}

function fail(code: string): never {
  throw new CaseDecisionValidationError(code);
}

function requireId(value: string, field: string, max = 48): void {
  if (!validRecordId(value) || value.length > max) fail(`invalid_${field}`);
}

function requireDigest(value: string, field: string): void {
  if (!validDigest(value)) fail(`invalid_${field}`);
}

function requireAddress(value: string, field: string): string {
  if (!isAddress(value)) fail(`invalid_${field}`);
  return value.toLowerCase();
}

export function encodeLengthPrefixedFields(fields: readonly string[]): string {
  return fields.map((field) => `${encoder.encode(field).length}:${field}`).join('');
}

export async function computeCaseEvidenceCommitment(
  caseId: string,
  references: readonly CaseEvidenceReference[],
): Promise<string> {
  requireId(caseId, 'case_id', 48);
  if (references.length < 1 || references.length > MAX_CASE_EVIDENCE_REFERENCES) fail('invalid_evidence_reference_count');
  const fields = ['PrecedentOS-CASE-EVIDENCE-v1', caseId, String(references.length)];
  const seen = new Set<string>();
  references.forEach((reference, index) => {
    if (reference.sequence !== index + 1) fail('noncanonical_evidence_sequence');
    requireId(reference.evidenceId, 'evidence_id');
    if (seen.has(reference.evidenceId)) fail('duplicate_evidence_id');
    seen.add(reference.evidenceId);
    requireDigest(reference.digest, 'evidence_digest');
    requireDigest(reference.sourceReferenceDigest, 'source_reference_digest');
    if (reference.schemaVersion !== CASE_EVIDENCE_SCHEMA_VERSION) fail('unsupported_evidence_schema_version');
    fields.push(String(reference.sequence), reference.evidenceId, reference.digest,
      String(reference.schemaVersion), reference.sourceReferenceDigest);
  });
  return sha256Utf8(encodeLengthPrefixedFields(fields));
}

/** Verify exact UTF-8 source text against the committed SHA-256 digest. */
export async function verifyCaseEvidenceText(reference: CaseEvidenceReference, text: string): Promise<void> {
  requireDigest(reference.digest, 'evidence_digest');
  if (await sha256Utf8(text) !== reference.digest) fail('evidence_bytes_digest_mismatch');
}

export async function computeCaseDecisionInputCommitment(input: {
  decisionId: string;
  chainId: number;
  caseId: string;
  caseVersion: number;
  caseEvidenceCommitment: string;
  policyVersion: number;
  criteriaVersion: number;
  criteriaDigest: string;
  decisionSchemaVersion: number;
  courtAddress: string;
}): Promise<string> {
  requireId(input.decisionId, 'decision_id');
  requireId(input.caseId, 'case_id', 48);
  requireDigest(input.caseEvidenceCommitment, 'case_evidence_commitment');
  requireDigest(input.criteriaDigest, 'criteria_digest');
  const court = requireAddress(input.courtAddress, 'court_address');
  if (!Number.isSafeInteger(input.chainId) || input.chainId <= 0) fail('invalid_chain_id');
  if (!Number.isSafeInteger(input.caseVersion) || input.caseVersion <= 0) fail('invalid_case_version');
  if (input.policyVersion !== SUPPORTED_CASE_POLICY_VERSION) fail('unsupported_policy_version');
  if (input.criteriaVersion !== SUPPORTED_CASE_CRITERIA_VERSION) fail('unsupported_criteria_version');
  if (input.decisionSchemaVersion !== CASE_DECISION_SCHEMA_VERSION) fail('unsupported_decision_schema_version');
  return sha256Utf8(encodeLengthPrefixedFields([
    'PrecedentOS-CASE-DECISION-INPUT-v1', String(input.chainId), court, input.caseId,
    input.decisionId, String(input.caseVersion), input.caseEvidenceCommitment,
    String(input.policyVersion), String(input.criteriaVersion), input.criteriaDigest,
    String(input.decisionSchemaVersion),
  ]));
}

export async function computeCaseDecisionResultDigest(input: {
  inputCommitment: string;
  classification: string;
  recommendedOutcome: string;
  evidenceSufficient: boolean;
  reasonsDigest: string;
}): Promise<string> {
  requireDigest(input.inputCommitment, 'input_commitment');
  requireDigest(input.reasonsDigest, 'reasons_digest');
  if (!CLASSIFICATIONS.has(input.classification)) fail('invalid_classification');
  if (!OUTCOMES.has(input.recommendedOutcome)) fail('invalid_recommended_outcome');
  if (typeof input.evidenceSufficient !== 'boolean') fail('invalid_evidence_sufficient');
  return sha256Utf8(encodeLengthPrefixedFields([
    'PrecedentOS-CASE-DECISION-RESULT-v1', input.inputCommitment,
    input.classification, input.recommendedOutcome,
    input.evidenceSufficient ? 'true' : 'false', input.reasonsDigest,
  ]));
}

/** Structural checks only. `context` and addresses are not authenticated here. */
export async function validateCaseDecisionCandidate(
  record: CaseDecisionRecord,
  context: CaseDecisionContext,
  requesterAddress: string,
  usedDecisionIds: readonly string[] = [],
): Promise<void> {
  if (record.caseId !== context.caseId) fail('case_id_mismatch');
  if (record.chainId !== context.chainId) fail('chain_id_mismatch');
  if (record.caseVersion !== context.caseVersion) fail('case_version_mismatch');
  if (record.caseEvidenceCommitment !== context.caseEvidenceCommitment) fail('case_evidence_commitment_mismatch');
  if (record.policyVersion !== context.policyVersion) fail('policy_version_mismatch');
  if (record.criteriaVersion !== context.criteriaVersion) fail('criteria_version_mismatch');
  if (record.criteriaDigest !== context.criteriaDigest) fail('criteria_digest_mismatch');
  if (record.decisionSchemaVersion !== CASE_DECISION_SCHEMA_VERSION) fail('unsupported_decision_schema_version');
  requireId(record.decisionId, 'decision_id');
  const expectedCourt = requireAddress(context.courtAddress, 'court_address');
  if (requireAddress(record.courtAddress, 'record_court_address') !== expectedCourt) fail('forged_court_identity');
  if (requireAddress(record.recordingContractAddress, 'recording_contract_address') !== expectedCourt) fail('forged_recording_contract_identity');
  const requester = requireAddress(requesterAddress, 'requester_address');
  if (![context.petitioner, context.respondent].some((party) => requireAddress(party, 'case_party') === requester)) {
    fail('unauthorized_adjudication_requester');
  }
  if (usedDecisionIds.includes(record.decisionId)) fail('duplicate_decision_id');
  const expectedInput = await computeCaseDecisionInputCommitment({
    decisionId: record.decisionId, chainId: record.chainId, caseId: record.caseId,
    caseVersion: record.caseVersion, caseEvidenceCommitment: record.caseEvidenceCommitment,
    policyVersion: record.policyVersion, criteriaVersion: record.criteriaVersion,
    criteriaDigest: record.criteriaDigest, decisionSchemaVersion: record.decisionSchemaVersion,
    courtAddress: record.courtAddress,
  });
  if (record.inputCommitment !== expectedInput) fail('input_commitment_mismatch');
  const expectedResult = await computeCaseDecisionResultDigest({
    inputCommitment: record.inputCommitment, classification: record.classification,
    recommendedOutcome: record.recommendedOutcome, evidenceSufficient: record.evidenceSufficient,
    reasonsDigest: record.reasonsDigest,
  });
  if (record.resultDigest !== expectedResult) fail('result_digest_mismatch');
}

/** Resolves a decision only from an injected trusted read result set.
 * A local mapping/browser cache is not such a source.
 */
export function resolveCaseDecisionReference(
  decisionId: string,
  records: ReadonlyMap<string, CaseDecisionRecord>,
): CaseDecisionRecord {
  requireId(decisionId, 'decision_id');
  const record = records.get(decisionId);
  if (!record) fail('unknown_decision_id');
  if (record.decisionId !== decisionId) fail('decision_id_record_mismatch');
  return record;
}

export function validateCaseAppealTarget(target: CaseAppealTarget, operative: CaseAppealTarget): void {
  if (target.caseId !== operative.caseId) fail('appeal_case_id_mismatch');
  if (target.decisionId !== operative.decisionId) fail('appeal_decision_id_mismatch');
  if (target.decisionVersion !== operative.decisionVersion) fail('appeal_decision_version_mismatch');
  if (target.resultDigest !== operative.resultDigest) fail('appeal_result_digest_mismatch');
  requireDigest(target.resultDigest, 'appeal_result_digest');
}

export function normalizeCaseDecisionAuthorityStatus(
  status: string,
  executionResult?: string,
): CaseDecisionAuthorityStatus {
  if (status === 'ACCEPTED' || status === 'FINALIZED') {
    if (executionResult === 'FINISHED_WITH_ERROR') return 'FAILED';
    if (executionResult !== 'FINISHED_WITH_RETURN') return 'UNKNOWN';
    return status === 'ACCEPTED' ? 'ACCEPTED_PROVISIONAL' : 'FINALIZED';
  }
  if (['PENDING', 'UNINITIALIZED', 'PROCESSING'].includes(status)) return 'PENDING';
  if (['CANCELED', 'FAILED'].includes(status)) return 'FAILED';
  return 'UNKNOWN';
}
