import type { CaseCourtJudgment, CaseCourtJudgmentResult, CaseJudgmentLifecycle } from '../../types/domain';

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
    && Boolean(observation.record)
    && observation.record?.authority_status === 'CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY';
}
