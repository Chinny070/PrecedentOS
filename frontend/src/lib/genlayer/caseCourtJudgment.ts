import { sha256Utf8, validDigest } from '../commitments';
import type { CaseCourtJudgmentResult } from '../../types/domain';
import { pythonCompactJson } from './materialFindings';

const encoder = new TextEncoder();
export const CASE_COURT_JUDGMENT_SCHEMA_VERSION = 2 as const;

export function encodeLengthPrefixedFields(fields: readonly string[]): string {
  return fields.map((field) => `${encoder.encode(field).length}:${field}`).join('');
}

export async function computeCaseCourtJudgmentCommitment(
  inputCommitment: string,
  result: CaseCourtJudgmentResult,
): Promise<string> {
  if (!validDigest(inputCommitment)) throw new Error('invalid_case_judgment_input_commitment');
  const reasonsDigest = await sha256Utf8(result.reasoning_summary);
  const fields = [
    'PrecedentOS-CASE-DECISION-RESULT-v2', inputCommitment,
    result.outcome_classification, result.recommended_outcome,
    String(result.evidence_sufficient), String(result.material_issue_determined), String(result.decision_eligible),
    result.relevant_rule_application, pythonCompactJson(result.material_findings),
    pythonCompactJson(result.applicable_criteria), pythonCompactJson(result.uncertainty_flags), reasonsDigest,
  ];
  return sha256Utf8(encodeLengthPrefixedFields(fields));
}
