export type WebClaim = {
  fact_kind: string;
  polarity: string;
  finding: string;
  excerpt: string;
};

export type WebSourceRegistration = {
  chain_id: number;
  court_address: string;
  case_id: string;
  source_id: string;
  source_version: number;
  source_schema_version: number;
  binding_kind: string;
  appeal_id: string;
  evidence_id: string;
  url_digest: string;
  url_host: string;
  previous_content_digest: string;
  proposer: string;
  registered_at: string;
  source_commitment: string;
};

export type WebVerification = {
  verification_id: string;
  chain_id: number;
  court_address: string;
  case_id: string;
  case_version: number;
  binding_kind: string;
  appeal_id: string;
  evidence_id: string;
  source_commitment: string;
  source_id: string;
  source_version: number;
  request_id: string;
  verification_schema_version: number;
  retrieval_status: string;
  reason_code: string;
  provenance: string;
  url_digest: string;
  input_commitment: string;
  freshness_status: string;
  source_content_digest: string;
  excerpt_commitment: string;
  source_change: string;
  previous_content_digest?: string;
  evidence_sufficient: boolean;
  claims: WebClaim[];
  reasoning_summary: string;
  recorded_at: string;
};

export type WebRetrievalRequest = {
  request_id: string;
  case_id: string;
  source_id: string;
  source_version: number;
  url_digest: string;
  source_commitment: string;
  attempt: number;
  requester: string;
  status: string;
  requested_at: string;
};

export type WebComparison = {
  comparison_id: string;
  case_id: string;
  chain_id: number;
  court_address: string;
  case_version: number;
  comparison_schema_version: number;
  input_commitment: string;
  left_source_id: string;
  left_source_version: number;
  left_verification_id: string;
  left_url_digest: string;
  left_verification_commitment: string;
  left_content_digest: string;
  right_source_id: string;
  right_source_version: number;
  right_verification_id: string;
  right_url_digest: string;
  right_verification_commitment: string;
  right_content_digest: string;
  relation: string;
  source_conflict: boolean;
  evidence_sufficient: boolean;
  conflict_pairs: string[];
  reasoning_summary: string;
  recorded_at: string;
};

function pythonJson(value: unknown, sortKeys = false): string {
  if (typeof value === 'string') {
    return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) =>
      `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );
  }
  if (Array.isArray(value)) return `[${value.map((item) => pythonJson(item, sortKeys)).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (sortKeys) keys.sort();
    return `{${keys.map((key) => `${pythonJson(key)}:${pythonJson(record[key], sortKeys)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Fields(fields: string[]): Promise<string> {
  const encoder = new TextEncoder();
  const framed = fields.map((field) => `${encoder.encode(field).length}:${field}`).join('');
  return sha256(framed);
}

export async function sourceRegistrationCommitment(value: WebSourceRegistration): Promise<string> {
  return sha256Fields([
    'PrecedentOS-WEB-SOURCE-REGISTRATION-v1', String(value.chain_id), value.court_address.toLowerCase(),
    value.case_id, value.source_id, String(value.source_version), String(value.source_schema_version),
    value.binding_kind, value.appeal_id, value.evidence_id, value.url_digest, value.url_host,
    value.previous_content_digest, value.proposer.toLowerCase(), value.registered_at,
  ]);
}

export async function retrievalRequestCommitment(value: WebRetrievalRequest): Promise<string> {
  return sha256Fields([
    'PrecedentOS-WEB-RETRIEVAL-REQUEST-v1', value.case_id, value.source_id, String(value.source_version),
    value.request_id, value.url_digest, value.source_commitment, String(value.attempt),
    value.requester.toLowerCase(), value.status, value.requested_at,
  ]);
}

export async function captureInputCommitment(
  registration: WebSourceRegistration,
  input: { case_version: number; request_id: string; request_commitment: string; verification_schema_version: number; criteria_version: number; criteria: string },
): Promise<string> {
  return sha256Fields([
    'PrecedentOS-WEB-CAPTURE-INPUT-v1', String(registration.chain_id), registration.court_address.toLowerCase(),
    registration.case_id, String(input.case_version), registration.binding_kind, registration.appeal_id,
    registration.source_id, String(registration.source_version), registration.evidence_id, input.request_id,
    registration.source_commitment, registration.url_digest, registration.previous_content_digest, input.request_commitment,
    String(input.verification_schema_version), String(input.criteria_version), await sha256(input.criteria),
  ]);
}

export async function excerptCommitment(claims: WebClaim[]): Promise<string> {
  return sha256Fields([
    'PrecedentOS-WEB-EXCERPTS-v1', String(claims.length),
    ...claims.flatMap((claim) => [claim.fact_kind, claim.polarity, claim.finding, claim.excerpt]),
  ]);
}

export async function verificationCommitment(value: WebVerification): Promise<string> {
  const claimsJson = pythonJson(value.claims, true);
  return sha256Fields([
    'PrecedentOS-WEB-VERIFICATION-v1', value.verification_id, String(value.chain_id),
    value.court_address.toLowerCase(), value.case_id, String(value.case_version), value.binding_kind,
    value.appeal_id, value.evidence_id, value.source_commitment, value.source_id, String(value.source_version),
    value.request_id, String(value.verification_schema_version), value.retrieval_status, value.reason_code,
    value.provenance, value.url_digest, value.input_commitment, value.freshness_status,
    value.source_content_digest, value.excerpt_commitment, value.source_change,
    value.previous_content_digest ?? '', value.evidence_sufficient ? 'true' : 'false', claimsJson,
    await sha256(value.reasoning_summary), value.recorded_at,
  ]);
}

export async function comparisonInputCommitment(input: {
  chain_id: number; court_address: string; case_id: string; case_version: number; comparison_id: string;
  comparison_schema_version: number; criteria_version: number; criteria: string;
  left: { source_id: string; version: number; verification_id: string; url_digest: string; content_digest: string; verification_commitment: string };
  right: { source_id: string; version: number; verification_id: string; url_digest: string; content_digest: string; verification_commitment: string };
}): Promise<string> {
  return sha256Fields([
    'PrecedentOS-WEB-SOURCE-COMPARISON-INPUT-v1', String(input.chain_id), input.court_address.toLowerCase(),
    input.case_id, String(input.case_version), input.comparison_id, String(input.comparison_schema_version),
    String(input.criteria_version), await sha256(input.criteria),
    input.left.source_id, String(input.left.version), input.left.verification_id, input.left.url_digest,
    input.left.content_digest, input.left.verification_commitment,
    input.right.source_id, String(input.right.version), input.right.verification_id, input.right.url_digest,
    input.right.content_digest, input.right.verification_commitment,
  ]);
}

export async function comparisonCommitment(value: WebComparison): Promise<string> {
  return sha256Fields([
    'PrecedentOS-WEB-SOURCE-COMPARISON-v1', value.case_id, String(value.chain_id),
    value.court_address.toLowerCase(), String(value.case_version), value.comparison_id,
    String(value.comparison_schema_version), value.input_commitment,
    value.left_source_id, String(value.left_source_version), value.left_verification_id, value.left_url_digest,
    value.left_verification_commitment, value.left_content_digest,
    value.right_source_id, String(value.right_source_version), value.right_verification_id, value.right_url_digest,
    value.right_verification_commitment, value.right_content_digest, value.relation,
    value.source_conflict ? 'true' : 'false', value.evidence_sufficient ? 'true' : 'false',
    pythonJson(value.conflict_pairs), await sha256(value.reasoning_summary), value.recorded_at,
  ]);
}
