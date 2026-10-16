import { describe, expect, it } from 'vitest';
import vector from '../case_judgment_commitment_vectors.json';
import { computeCaseCourtJudgmentCommitment } from './caseCourtJudgment';
import type { CaseCourtJudgmentResult } from '../../types/domain';

describe('CaseCourt canonical judgment commitment', () => {
  it('matches the shared Python result vector, including canonical citations', async () => {
    expect(await computeCaseCourtJudgmentCommitment(vector.input_commitment, vector.result as CaseCourtJudgmentResult)).toBe(vector.result_commitment);
  });
});
