import { sha256Utf8, validDigest } from '../commitments';
import type {
  CaseCourtAppealOutcome,
  CaseCourtAppealStatus,
  CaseCourtAppellateRuling,
  CaseJudgmentLifecycle,
} from '../../types/domain';

const encoder = new TextEncoder();
export const APPEAL_WRITE_GATE = 'DISABLED_RUNTIME_UNVERIFIED' as const;
export const APPEAL_SCHEMA_VERSION = 1 as const;
export const APPELLATE_RULING_SCHEMA_VERSION = 1 as const;

export interface AppealEvidenceReferenceInput {
  evidence_id: string;
  digest: string;
  schema_version: number;
  source_reference_digest: string;
}

export interface AppealFilingCommitmentInput {
  appeal_id: string;
  case_id: string;
  target_kind: 'JUDGMENT' | 'APPELLATE_RULING';
  target_id: string;
  target_version: number;
  target_commitment: string;
  parent_appeal_id: string;
  appellant: string;
  grounds_code: string;
  grounds_digest: string;
}

export interface AppellateInputCommitmentInput {
  chain_id: number;
  court_address: string;
  case_id: string;
  appeal: {
    appeal_id: string; target_kind: string; target_id: string; target_version: number;
    target_commitment: string; original_judgment_id: string; original_judgment_version: number;
    original_judgment_commitment: string; grounds_code: string; grounds_digest: string;
    criteria_version: number; criteria_digest: string; level: number; parent_appeal_id: string;
  };
  original_judgment_commitment: string;
  case_version: number;
  original_evidence_commitment: string;
  appeal_evidence_commitment: string;
}

export interface AppellateDecisionFields {
  outcome: CaseCourtAppealOutcome;
  original_judgment_valid: boolean;
  material_error_found: boolean;
  evidence_sufficient: boolean;
  reversal_justified: boolean;
  remand_required: boolean;
  case_state_change: 'NONE' | 'SUPERSEDE' | 'REOPEN_REVIEW' | 'DISMISS_APPEAL' | 'NONFINAL_REOPEN';
  applicable_criteria: string[];
  material_findings: string[];
  reasoning_summary: string;
}

export function encodeLengthPrefixedFields(fields: readonly string[]): string {
  return fields.map((field) => `${encoder.encode(field).length}:${field}`).join('');
}

async function digestFields(fields: readonly string[]): Promise<string> {
  return sha256Utf8(encodeLengthPrefixedFields(fields));
}

export async function computeAppealFilingCommitment(input: AppealFilingCommitmentInput): Promise<string> {
  for (const digest of [input.target_commitment, input.grounds_digest]) {
    if (!validDigest(digest)) throw new Error('invalid_appeal_digest');
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.appellant)) throw new Error('invalid_appellant');
  return digestFields([
    'PrecedentOS-APPEAL-COURT-FILING-v1', input.appeal_id, input.case_id, input.target_kind,
    input.target_id, String(input.target_version), input.target_commitment, input.parent_appeal_id,
    input.appellant.toLowerCase(), input.grounds_code, input.grounds_digest,
  ]);
}

export async function computeAppealEvidenceCommitment(
  caseId: string,
  appealId: string,
  references: readonly AppealEvidenceReferenceInput[],
): Promise<string> {
  if (references.length > 8) throw new Error('appeal_evidence_capacity_exceeded');
  const fields = ['PrecedentOS-APPEAL-EVIDENCE-v1', caseId, appealId, String(references.length)];
  for (const [index, reference] of references.entries()) {
    if (!validDigest(reference.digest) || !validDigest(reference.source_reference_digest)) {
      throw new Error('invalid_appeal_evidence_digest');
    }
    if (reference.schema_version !== 1) throw new Error('unsupported_appeal_evidence_schema');
    fields.push(String(index + 1), reference.evidence_id, reference.digest,
      String(reference.schema_version), reference.source_reference_digest);
  }
  return digestFields(fields);
}

export async function computeAppellateInputCommitment(input: AppellateInputCommitmentInput): Promise<string> {
  if (!validDigest(input.appeal.target_commitment) || !validDigest(input.appeal.grounds_digest)
    || !validDigest(input.appeal.original_judgment_commitment)
    || !validDigest(input.appeal.criteria_digest) || !validDigest(input.original_judgment_commitment)
    || !validDigest(input.original_evidence_commitment) || !validDigest(input.appeal_evidence_commitment)) {
    throw new Error('invalid_appellate_input_digest');
  }
  if (input.appeal.original_judgment_commitment !== input.original_judgment_commitment) {
    throw new Error('original_judgment_commitment_mismatch');
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.court_address)) throw new Error('invalid_case_court_address');
  const appeal = input.appeal;
  return digestFields([
    'PrecedentOS-APPELLATE-INPUT-v1', String(input.chain_id), input.court_address.toLowerCase(), input.case_id,
    appeal.appeal_id, appeal.target_kind, appeal.target_id, String(appeal.target_version), appeal.target_commitment,
    appeal.original_judgment_id, String(appeal.original_judgment_version), appeal.original_judgment_commitment,
    String(input.case_version), input.original_evidence_commitment, input.appeal_evidence_commitment,
    appeal.grounds_code, appeal.grounds_digest, String(appeal.criteria_version), appeal.criteria_digest,
    String(APPELLATE_RULING_SCHEMA_VERSION), String(appeal.level), appeal.parent_appeal_id,
    input.original_judgment_commitment,
  ]);
}

export async function computeAppellateRulingCommitment(
  inputCommitment: string,
  result: AppellateDecisionFields,
): Promise<string> {
  if (!validDigest(inputCommitment)) throw new Error('invalid_appellate_input_commitment');
  const reasonsDigest = await sha256Utf8(result.reasoning_summary);
  return digestFields([
    'PrecedentOS-APPELLATE-RESULT-v1', inputCommitment, String(APPELLATE_RULING_SCHEMA_VERSION),
    result.outcome, String(result.original_judgment_valid), String(result.material_error_found),
    String(result.evidence_sufficient), String(result.reversal_justified), String(result.remand_required),
    result.case_state_change, JSON.stringify(result.applicable_criteria), JSON.stringify(result.material_findings),
    reasonsDigest,
  ]);
}

export type CaseCourtAppealObservation = {
  appealStatus: CaseCourtAppealStatus;
  transactionLifecycle: CaseJudgmentLifecycle;
  transactionHash?: `0x${string}`;
  ruling?: Pick<CaseCourtAppellateRuling, 'authority_status'> | null;
  executionResult?: 'FINISHED_WITH_RETURN' | 'FINISHED_WITH_ERROR' | 'UNKNOWN';
  consensusResult?: string;
  detail?: string;
};

/** No appeal transaction adapter is enabled until the runtime gate is independently cleared. */
export function mayLabelAppellateRulingFinalized(observation: CaseCourtAppealObservation): boolean {
  return observation.transactionLifecycle === 'FINALIZED'
    && observation.executionResult === 'FINISHED_WITH_RETURN'
    && observation.consensusResult === 'MAJORITY_AGREE'
    && observation.ruling?.authority_status === 'APPELLATE_EP_ACCEPTED_REQUIRES_FINALITY';
}
