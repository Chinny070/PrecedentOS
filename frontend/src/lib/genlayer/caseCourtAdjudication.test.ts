import { describe, expect, it } from 'vitest';
import { decodeCaseCourtJudgmentResult, mayLabelJudgmentFinalized, type CaseJudgmentObservation } from './caseCourtAdjudication';

const record = {
  judgment_id: 'FICT-J-1', chain_id: '61999', court_address: `0x${'1'.repeat(40)}` as `0x${string}`,
  case_id: 'FICT-CASE-1', case_version: '4', evidence_commitment: 'a'.repeat(64), criteria_version: '1',
  criteria_digest: 'b'.repeat(64), policy_version: '1', judgment_schema_version: '2',
  input_commitment: 'c'.repeat(64), judgment_commitment: 'd'.repeat(64), submitter: `0x${'2'.repeat(40)}` as `0x${string}`,
  authority_status: 'CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY' as const, recorded_at: 'runtime-context-time', result_json: '{}',
};

describe('CaseCourt judgment finality presentation gate', () => {
  it('decodes only canonical evidence-linked findings', () => {
    const result = {
      outcome_classification: 'MERITS_SUPPORTED',
      material_findings: [{ code: 'FACT', sources: [{ scope: 'CASE', source_id: 'FICT-EVIDENCE-1', quote: 'Exact committed excerpt.' }] }],
      evidence_sufficient: true, material_issue_determined: true, decision_eligible: true,
      relevant_rule_application: 'SATISFIED', applicable_criteria: ['NOTICE'], recommended_outcome: 'GRANT',
      reasoning_summary: 'Non-authoritative explanation omitted.', uncertainty_flags: [],
    };
    expect(decodeCaseCourtJudgmentResult(JSON.stringify(result)).material_findings[0].sources[0].quote).toBe('Exact committed excerpt.');
    expect(() => decodeCaseCourtJudgmentResult(JSON.stringify({ ...result, material_findings: [{
      code: 'FACT', sources: [{ scope: 'CASE', source_id: 'FICT-EVIDENCE-1', quote: 'x'.repeat(181) }],
    }] }))).toThrow('invalid_material_finding_reference');
    expect(() => decodeCaseCourtJudgmentResult('{')).toThrow('malformed_case_judgment_result');
  });

  it.each(['UNVERIFIED', 'LOCALLY_SIMULATED', 'SUBMITTED', 'PENDING', 'ACCEPTED_PROVISIONAL', 'FAILED', 'UNKNOWN'] as const)(
    'does not label %s as finalized', (lifecycle) => {
      const observation: CaseJudgmentObservation = { lifecycle, record, executionResult: 'FINISHED_WITH_RETURN' };
      expect(mayLabelJudgmentFinalized(observation)).toBe(false);
    },
  );

  it('requires a successful finalized execution and the decoded record', () => {
    expect(mayLabelJudgmentFinalized({ lifecycle: 'FINALIZED', record, executionResult: 'UNKNOWN' })).toBe(false);
    expect(mayLabelJudgmentFinalized({ lifecycle: 'FINALIZED', record: null, executionResult: 'FINISHED_WITH_RETURN' })).toBe(false);
    expect(mayLabelJudgmentFinalized({ lifecycle: 'FINALIZED', record, executionResult: 'FINISHED_WITH_RETURN', consensusResult: 'NO_MAJORITY' })).toBe(false);
    expect(mayLabelJudgmentFinalized({ lifecycle: 'FINALIZED', record, executionResult: 'FINISHED_WITH_ERROR', consensusResult: 'MAJORITY_AGREE' })).toBe(false);
    expect(mayLabelJudgmentFinalized({ lifecycle: 'FINALIZED', record, executionResult: 'FINISHED_WITH_RETURN' })).toBe(false);
    expect(mayLabelJudgmentFinalized({ lifecycle: 'FINALIZED', record, executionResult: 'FINISHED_WITH_RETURN', consensusResult: 'MAJORITY_AGREE' })).toBe(true);
  });
});
