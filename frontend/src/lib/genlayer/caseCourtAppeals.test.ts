import { describe, expect, it } from 'vitest';
import vector from '../../../../tests/fixtures/appellate_commitment_vectors.json';
import { computeAppealEvidenceCommitment, computeAppealFilingCommitment, computeAppellateInputCommitment, computeAppellateRulingCommitment, mayLabelAppellateRulingFinalized, type AppellateDecisionFields } from './caseCourtAppeals';

describe('CaseCourt appellate Python/TypeScript commitment vectors', () => {
  it('matches filing, appeal-evidence, input, and ruling SHA-256 vectors', async () => {
    expect(await computeAppealFilingCommitment({ appeal_id: vector.appeal_id, case_id: vector.case_id, target_kind: 'JUDGMENT', target_id: vector.target_id, target_version: vector.target_version, target_commitment: vector.target_commitment, parent_appeal_id: '', appellant: vector.appellant, grounds_code: vector.grounds_code, grounds_digest: vector.grounds_digest })).toBe(vector.filing_commitment);
    expect(await computeAppealEvidenceCommitment(vector.case_id, vector.appeal_id, vector.appeal_evidence)).toBe(vector.appeal_evidence_commitment);
    const input = await computeAppellateInputCommitment({ chain_id: vector.chain_id, court_address: vector.court_address, case_id: vector.case_id, appeal: { appeal_id: vector.appeal_id, target_kind: 'JUDGMENT', target_id: vector.target_id, target_version: vector.target_version, target_commitment: vector.target_commitment, original_judgment_id: vector.target_id, original_judgment_version: vector.target_version, original_judgment_commitment: vector.target_commitment, grounds_code: vector.grounds_code, grounds_digest: vector.grounds_digest, criteria_version: 1, criteria_digest: vector.criteria_digest, level: 1, parent_appeal_id: '' }, original_judgment_commitment: vector.target_commitment, case_version: vector.case_version, original_evidence_commitment: vector.original_evidence_commitment, appeal_evidence_commitment: vector.appeal_evidence_commitment });
    expect(input).toBe(vector.appeal_input_commitment);
    expect(await computeAppellateRulingCommitment(input, vector.result as AppellateDecisionFields)).toBe(vector.ruling_commitment);
  });
  it('does not promote local, accepted-provisional, or failed observations to finality', () => {
    const ruling = { authority_status: 'APPELLATE_EP_ACCEPTED_REQUIRES_FINALITY' } as const;
    expect(mayLabelAppellateRulingFinalized({ appealStatus: 'PENDING_RESOLUTION', transactionLifecycle: 'LOCALLY_SIMULATED', ruling })).toBe(false);
    expect(mayLabelAppellateRulingFinalized({ appealStatus: 'PENDING_RESOLUTION', transactionLifecycle: 'ACCEPTED_PROVISIONAL', executionResult: 'FINISHED_WITH_RETURN', ruling })).toBe(false);
    expect(mayLabelAppellateRulingFinalized({ appealStatus: 'RESOLVED', transactionLifecycle: 'FINALIZED', executionResult: 'FINISHED_WITH_ERROR', ruling })).toBe(false);
    expect(mayLabelAppellateRulingFinalized({ appealStatus: 'RESOLVED', transactionLifecycle: 'FINALIZED', executionResult: 'FINISHED_WITH_RETURN', ruling })).toBe(true);
  });
});
