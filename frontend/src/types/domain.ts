export type Provenance = 'demo' | 'local-draft' | 'submitted' | 'chain-observed' | 'finalized';
export type Classification = 'material_similarity' | 'possible_contradiction' | 'insufficient_evidence' | 'no_material_relation';

/**
 * CaseCourt v1 state labels. These types describe the contract interface only;
 * no case-governance route or live adapter is enabled until deployment/runtime
 * compatibility and the v2 wallet/ABI integration gates are completed.
 */
export type CaseCourtPhase =
  | 'EVIDENCE_OPEN'
  | 'EVIDENCE_LOCKED'
  | 'DECISION_RECORDED'
  | 'CHALLENGE_OPEN'
  | 'FROZEN';

export interface CaseCourtSnapshot {
  case_id: string;
  petitioner: `0x${string}`;
  respondent: `0x${string}`;
  case_type: string;
  schema_version: string;
  policy_version: string;
  phase: CaseCourtPhase;
  version: string;
  evidence_count: string;
  action_count: string;
  opening_evidence_digest: string;
  decision_ref_id: string;
  decision_digest: string;
  decision_submitter: `0x${string}`;
  decision_authority: 'UNVERIFIED_CALLER_ASSERTION';
  challenge_id: string;
  frozen: 'true' | 'false';
  freeze_used: 'true' | 'false';
  frozen_by: `0x${string}`;
  freeze_until: string;
  opened_at: string;
}

/** First-level filing only; it has no adjudicated result or deadline status. */
export interface CaseCourtAppealFiling {
  appeal_id: string;
  case_id: string;
  schema_version: '1';
  level: '1';
  parent_appeal_id: '';
  status: 'FILED_UNADJUDICATED';
  appellant: `0x${string}`;
  decision_ref_id: string;
  decision_digest: string;
  grounds_code: string;
  grounds_digest: string;
  new_evidence_commitment: string;
  recorded_at: string;
}

export interface CaseCourtEvidenceReference {
  case_id: string;
  evidence_id: string;
  digest: string;
  schema_version: string;
  source_reference_digest: string;
  submitter: `0x${string}`;
  case_version: string;
  recorded_at: string;
}

export interface CaseCourtAction {
  global_sequence: string;
  case_sequence: string;
  case_id: string;
  action_id: string;
  action_kind: string;
  actor: `0x${string}`;
  expected_version: string;
  new_version: string;
  payload_digest: string;
  reference_id: string;
  recorded_at: string;
}

export type CaseJudgmentClassification =
  | 'MERITS_SUPPORTED'
  | 'MERITS_NOT_SUPPORTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'MATERIAL_CONFLICT';

export type CaseJudgmentOutcome = 'GRANT' | 'DENY' | 'REMAND' | 'NO_RECOMMENDATION';
export type CaseJudgmentRuleApplication = 'SATISFIED' | 'NOT_SATISFIED' | 'CONFLICTING' | 'UNDETERMINED';
export type CaseJudgmentLifecycle =
  | 'UNVERIFIED'
  | 'LOCALLY_SIMULATED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'ACCEPTED_PROVISIONAL'
  | 'FINALIZED'
  | 'FAILED'
  | 'UNKNOWN';

export interface CaseCourtJudgmentResult {
  outcome_classification: CaseJudgmentClassification;
  material_findings: string[];
  evidence_sufficient: boolean;
  material_issue_determined: boolean;
  decision_eligible: boolean;
  relevant_rule_application: CaseJudgmentRuleApplication;
  applicable_criteria: string[];
  recommended_outcome: CaseJudgmentOutcome;
  reasoning_summary: string;
  uncertainty_flags: string[];
}

/** Read shape for an append-only CaseCourt judgment record. */
export interface CaseCourtJudgment {
  judgment_id: string;
  chain_id: string;
  court_address: `0x${string}`;
  case_id: string;
  case_version: string;
  evidence_commitment: string;
  criteria_version: string;
  criteria_digest: string;
  policy_version: string;
  judgment_schema_version: string;
  input_commitment: string;
  judgment_commitment: string;
  submitter: `0x${string}`;
  authority_status: 'CASE_COURT_EP_ACCEPTED_REQUIRES_FINALITY';
  recorded_at: string;
  result_json: string;
}

export interface Precedent {
  id: string;
  title: string;
  jurisdiction: string;
  decisionDate: string;
  category: string;
  court: string;
  outcome: string;
  summary: string;
  passage: string;
  documentDigest: string;
  provenance: Provenance;
  citedIds: string[];
  accent: 'cyan' | 'coral' | 'citron' | 'violet';
}

export interface Evaluation {
  id: string;
  a: string;
  b: string;
  classification: Classification;
  same_material_issue: boolean;
  evidence_sufficient: boolean;
  outcomes_differ: boolean;
  material_similarity: boolean;
  potential_contradiction: boolean;
  similarities: string[];
  differences: string[];
  contradictions: string[];
  reasoning: string;
  inputCommitment: string;
  provenance: Provenance;
}

export interface TransactionTrace {
  hash: `0x${string}`;
  action: string;
  status: 'submitted' | 'pending' | 'processing' | 'accepted' | 'finalized' | 'failed' | 'unknown';
  submittedAtLocal: string;
  finalizedAtObserved?: string;
  detail?: string;
  /** Set after hydration: localStorage is editable and is not live chain evidence. */
  storedLocally?: boolean;
  lastObservedStatus?: TransactionTrace['status'];
}
