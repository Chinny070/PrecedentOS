import type {
  CaseCourtAction,
  CaseCourtEvidenceReference,
  CaseCourtSnapshot,
} from '../../types/domain';

export type CaseCourtAddress = `0x${string}`;

/** Python public-write argument tuples for contracts/case_court.py. */
export interface CaseCourtWriteArguments {
  open_case: [
    caseId: string,
    actionId: string,
    respondent: CaseCourtAddress,
    caseType: string,
    policyVersion: 1,
    openingEvidenceDigest: string,
  ];
  append_evidence: [
    caseId: string,
    expectedVersion: number,
    actionId: string,
    evidenceId: string,
    evidenceDigest: string,
    evidenceSchemaVersion: 1,
    sourceReferenceDigest: string,
  ];
  lock_evidence: [caseId: string, expectedVersion: number, actionId: string];
  attach_decision_reference: [
    caseId: string,
    expectedVersion: number,
    actionId: string,
    decisionReferenceId: string,
    decisionDigest: string,
  ];
  challenge_decision: [
    caseId: string,
    expectedVersion: number,
    actionId: string,
    challengeId: string,
    decisionDigest: string,
    groundsCode: 'NEW_EVIDENCE' | 'MATERIAL_ERROR' | 'PROCEDURAL_CONCERN',
    groundsDigest: string,
  ];
  request_freeze: [
    caseId: string,
    expectedVersion: number,
    actionId: string,
    groundsDigest: string,
  ];
  unfreeze_case: [caseId: string, expectedVersion: number, actionId: string];
}

/** Read-only port shape; implementations require a verified deployment/ABI. */
export interface CaseCourtReadPort {
  has_case(caseId: string): Promise<boolean>;
  get_case(caseId: string): Promise<CaseCourtSnapshot | Record<string, never>>;
  get_evidence(caseId: string, evidenceId: string): Promise<CaseCourtEvidenceReference | Record<string, never>>;
  get_case_action(caseId: string, caseSequence: number): Promise<CaseCourtAction | Record<string, never>>;
  get_case_action_count(caseId: string): Promise<number | bigint>;
  get_case_count(): Promise<number | bigint>;
  get_action_count(): Promise<number | bigint>;
}

/**
 * Type-only integration boundary. The current UI intentionally has no live
 * CaseCourt write path and must not treat local or caller-supplied references
 * as verified chain records.
 */
export interface CaseCourtWritePort {
  write<Method extends keyof CaseCourtWriteArguments>(
    method: Method,
    args: CaseCourtWriteArguments[Method],
  ): Promise<`0x${string}`>;
}
