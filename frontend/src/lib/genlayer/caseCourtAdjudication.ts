import type { CaseCourtJudgment, CaseCourtJudgmentResult, CaseJudgmentLifecycle } from '../../types/domain';
import { parseMaterialFindingsJson } from './materialFindings';

export function decodeCaseCourtJudgmentResult(raw: string): CaseCourtJudgmentResult {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('malformed_case_judgment_result'); }
  const required = ['outcome_classification', 'material_findings', 'evidence_sufficient', 'material_issue_determined',
    'decision_eligible', 'relevant_rule_application', 'applicable_criteria', 'recommended_outcome',
    'reasoning_summary', 'uncertainty_flags'];
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== [...required].sort().join(',')) throw new Error('invalid_case_judgment_result');
  const result = value as Record<string, unknown>;
  if (typeof result.outcome_classification !== 'string' || !['MERITS_SUPPORTED', 'MERITS_NOT_SUPPORTED', 'INELIGIBLE', 'UNDETERMINED'].includes(result.outcome_classification)
    || typeof result.recommended_outcome !== 'string' || !['GRANT', 'DENY', 'REMAND', 'NO_RECOMMENDATION'].includes(result.recommended_outcome)
    || typeof result.relevant_rule_application !== 'string' || !['SATISFIED', 'NOT_SATISFIED', 'CONFLICTING', 'UNDETERMINED'].includes(result.relevant_rule_application)
    || typeof result.evidence_sufficient !== 'boolean'
    || typeof result.material_issue_determined !== 'boolean' || typeof result.decision_eligible !== 'boolean'
    || typeof result.reasoning_summary !== 'string' || !Array.isArray(result.applicable_criteria)
    || !result.applicable_criteria.every((item) => typeof item === 'string') || !Array.isArray(result.uncertainty_flags)
    || !result.uncertainty_flags.every((item) => typeof item === 'string')) throw new Error('invalid_case_judgment_result');
  return {
    outcome_classification: result.outcome_classification as CaseCourtJudgmentResult['outcome_classification'],
    material_findings: parseMaterialFindingsJson(JSON.stringify(result.material_findings), ['CASE']),
    evidence_sufficient: result.evidence_sufficient,
    material_issue_determined: result.material_issue_determined,
    decision_eligible: result.decision_eligible,
    relevant_rule_application: result.relevant_rule_application as CaseCourtJudgmentResult['relevant_rule_application'],
    applicable_criteria: result.applicable_criteria as string[],
    recommended_outcome: result.recommended_outcome as CaseCourtJudgmentResult['recommended_outcome'],
    reasoning_summary: result.reasoning_summary,
    uncertainty_flags: result.uncertainty_flags as string[],
  };
}

export interface AdjudicateCaseRequest {
  caseId: string;
  expectedVersion: bigint;
  actionId: string;
  judgmentId: string;
  evidencePacketJson: string;
}

export interface CaseJudgmentObservation {
  lifecycle: CaseJudgmentLifecycle;
  transactionHash?: `0x${string}`;
  record?: CaseCourtJudgment | null;
  result?: CaseCourtJudgmentResult;
  executionResult?: 'FINISHED_WITH_RETURN' | 'FINISHED_WITH_ERROR' | 'UNKNOWN';
  consensusResult?: string;
  detail?: string;
  observedAt?: string;
}

/**
 * Typed boundary for a future GenLayerJS adapter. This is deliberately an
 * interface only: it does not claim the pinned SDK can call the new ABI, and
 * no frontend write path is enabled until Studionet/runtime gates pass.
 */
export interface CaseCourtAdjudicationAdapter {
  getJudgment(judgmentId: string): Promise<CaseCourtJudgment | null>;
  adjudicateCase(request: AdjudicateCaseRequest): Promise<CaseJudgmentObservation>;
  observeTransaction(transactionHash: `0x${string}`): Promise<CaseJudgmentObservation>;
}

export function mayLabelJudgmentFinalized(observation: CaseJudgmentObservation): boolean {
  return observation.lifecycle === 'FINALIZED'
    && observation.executionResult === 'FINISHED_WITH_RETURN'
    && observation.consensusResult === 'MAJORITY_AGREE'
    && Boolean(observation.record)
    && observation.record?.authority_status === 'CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY';
}
