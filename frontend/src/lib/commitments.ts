const encoder = new TextEncoder();

export const MAX_RECORD_ID_LENGTH = 48;
export const MAX_METADATA_FIELD_LENGTH = 64;
export const MAX_PACKET_LENGTH = 4200;
export const MAX_PASSAGE_LENGTH = 1800;
export const MAX_CRITERIA_LENGTH = 600;
export const SUPPORTED_SCHEMA_VERSION = 1;
export const SUPPORTED_CRITERIA_VERSION = 1;

export function codePointLength(value: string): number {
  return [...value].length;
}

export function validRecordId(value: string): boolean {
  return value.length >= 3 && value.length <= MAX_RECORD_ID_LENGTH &&
    /^[A-Z0-9](?:[A-Z0-9]|-(?=[A-Z0-9]))*[A-Z0-9]$/.test(value);
}

export function validMetadataLabel(value: string): boolean {
  return value.length > 0 && codePointLength(value) <= MAX_METADATA_FIELD_LENGTH &&
    /^[A-Za-z0-9 .,_()\-/]+$/.test(value);
}

export function validDecisionDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function sha256Utf8(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function validDigest(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

export interface CommitmentInput {
  evaluationId: string;
  recordAId: string;
  recordADigest: string;
  recordBId: string;
  recordBDigest: string;
  evidenceSchemaVersion: number;
  criteriaVersion: number;
  criteria: string;
}

export function encodeEvaluationCommitmentFields(input: CommitmentInput): string {
  const fields = [
    'PrecedentOS-EVALUATION-INPUT-v1',
    input.evaluationId,
    input.recordAId,
    input.recordADigest,
    input.recordBId,
    input.recordBDigest,
    String(input.evidenceSchemaVersion),
    String(input.criteriaVersion),
    '1',
    input.criteria,
  ];
  return fields.map((field) => `${encoder.encode(field).length}:${field}`).join('');
}

export async function evaluationInputCommitment(input: CommitmentInput): Promise<string> {
  return sha256Utf8(encodeEvaluationCommitmentFields(input));
}

export function validateEvidencePacket(a: string, b: string, criteria: string): string[] {
  const errors: string[] = [];
  if (!a.trim() || !b.trim()) errors.push('Both evidence passages are required.');
  if (codePointLength(a) > MAX_PASSAGE_LENGTH || codePointLength(b) > MAX_PASSAGE_LENGTH) {
    errors.push(`Each passage must be at most ${MAX_PASSAGE_LENGTH} characters.`);
  }
  if (!criteria.trim() || codePointLength(criteria) > MAX_CRITERIA_LENGTH) {
    errors.push(`Criteria must contain 1–${MAX_CRITERIA_LENGTH} characters.`);
  }
  const packet = JSON.stringify({ precedent_a: a, precedent_b: b });
  if (codePointLength(packet) > MAX_PACKET_LENGTH) errors.push(`Encoded evidence packet exceeds ${MAX_PACKET_LENGTH} characters.`);
  return errors;
}

export function makeEvaluationPacket(a: string, b: string): string {
  return JSON.stringify({ precedent_a: a, precedent_b: b });
}
