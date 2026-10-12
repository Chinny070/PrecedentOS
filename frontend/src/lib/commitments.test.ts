import { describe, expect, it } from 'vitest';
import {
  codePointLength, encodeEvaluationCommitmentFields, evaluationInputCommitment,
  sha256Utf8, validDecisionDate, validMetadataLabel, validRecordId, validateEvidencePacket,
} from './commitments';

describe('browser commitment compatibility', () => {
  it('hashes exact UTF-8 bytes without trimming or Unicode normalization', async () => {
    expect(await sha256Utf8('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await sha256Utf8('é')).not.toBe(await sha256Utf8('e\u0301'));
    expect(await sha256Utf8('fiction\n')).not.toBe(await sha256Utf8('fiction'));
  });

  it('length-frames each field using UTF-8 byte lengths and preserves the v1 order', () => {
    const input = { evaluationId: 'EVAL-1', recordAId: 'A-001', recordADigest: 'a'.repeat(64), recordBId: 'B-002', recordBDigest: 'b'.repeat(64), evidenceSchemaVersion: 1, criteriaVersion: 1, criteria: 'é' };
    const encoded = encodeEvaluationCommitmentFields(input);
    expect(encoded).toContain('2:é');
    expect(encoded.startsWith('31:PrecedentOS-EVALUATION-INPUT-v1')).toBe(true);
  });

  it('matches the checked-in cross-language v1 input-commitment vector', async () => {
    const input = { evaluationId: 'EVAL-1', recordAId: 'A-001', recordADigest: 'a'.repeat(64), recordBId: 'B-002', recordBDigest: 'b'.repeat(64), evidenceSchemaVersion: 1, criteriaVersion: 1, criteria: 'Compare the stated rule.' };
    expect(await evaluationInputCommitment(input)).toBe('5f1b211920a4d2b67dff569c337ae00e56fa3e1642721e1b42def9742b0bedf2');
  });
});

describe('front-end validation mirrors the production contract bounds', () => {
  it('accepts uppercase IDs and rejects lowercase, consecutive hyphens and invalid dates', () => {
    expect(validRecordId('FICT-MUNI-001')).toBe(true);
    expect(validRecordId('fict-muni-001')).toBe(false);
    expect(validRecordId('FICT--001')).toBe(false);
    expect(validDecisionDate('2030-02-29')).toBe(false);
    expect(validDecisionDate('2030-02-28')).toBe(true);
  });

  it('enforces safe metadata labels and exact code-point passage limits', () => {
    expect(validMetadataLabel('Fictional North District')).toBe(true);
    expect(validMetadataLabel('Personal <script>')).toBe(false);
    expect(codePointLength('A😀')).toBe(2);
    expect(validateEvidencePacket(' ', 'text', 'Compare rule and outcomes.')).toContain('Both evidence passages are required.');
    expect(validateEvidencePacket('a'.repeat(1801), 'b', 'Compare rule and outcomes.')).toContain('Each passage must be at most 1800 characters.');
  });
});
