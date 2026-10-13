export type Provenance = 'demo' | 'local-draft' | 'submitted' | 'chain-observed' | 'finalized';
export type Classification = 'material_similarity' | 'possible_contradiction' | 'insufficient_evidence' | 'no_material_relation';

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
