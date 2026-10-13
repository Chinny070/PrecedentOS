import { describe, expect, it } from 'vitest';
import vectors from '../../../../tests/fixtures/web_evidence_commitment_vectors.json';
import {
  captureInputCommitment,
  comparisonCommitment,
  comparisonInputCommitment,
  excerptCommitment,
  retrievalRequestCommitment,
  sourceRegistrationCommitment,
  verificationCommitment,
} from './webEvidenceCommitments';

describe('Python and browser web evidence commitment vectors', () => {
  it('matches the source, request, excerpt, verification, and comparison hashes', async () => {
    expect(await sourceRegistrationCommitment(vectors.registration)).toBe(vectors.registration.source_commitment);
    expect(await retrievalRequestCommitment(vectors.request)).toBe(vectors.request.expected_commitment);
    expect(await captureInputCommitment(vectors.registration, vectors.capture)).toBe(vectors.capture.input_commitment);
    expect(await excerptCommitment(vectors.claims)).toBe(vectors.excerpt_commitment);
    expect(await verificationCommitment(vectors.verification)).toBe(vectors.verification_commitment);
    expect(await comparisonInputCommitment(vectors.comparison_input)).toBe(vectors.comparison_input.expected);
    expect(await comparisonCommitment(vectors.comparison)).toBe(vectors.comparison_commitment);
  });

  it('frames UTF-8 bytes rather than JavaScript character count', async () => {
    const { sha256Fields } = await import('./webEvidenceCommitments');
    expect(await sha256Fields(['é', 'case'])).toBe('ba5f80120e27220ef31a60c291a833ce8b58233d1b8d410a4b3fb203f956b1f9');
  });
});
