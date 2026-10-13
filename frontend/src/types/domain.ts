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
  challenge_id: string;
  frozen: 'true' | 'false';
  freeze_used: 'true' | 'false';
  frozen_by: `0x${string}`;
  freeze_until: string;
  opened_at: string;
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
