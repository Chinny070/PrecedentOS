import { describe, expect, it } from 'vitest';
import vector from '../../../../tests/fixtures/case_decision_vectors.json';
import { sha256Utf8 } from '../commitments';
import {
  computeCaseDecisionInputCommitment,
  computeCaseDecisionResultDigest,
  computeCaseEvidenceCommitment,
  normalizeCaseDecisionAuthorityStatus,
  resolveCaseDecisionReference,
  validateCaseAppealTarget,
  validateCaseDecisionCandidate,
  validateDeploymentIdentity,
  verifyCaseEvidenceText,
  type CaseAppealTarget,
  type CaseDecisionContext,
  type CaseDecisionRecord,
} from './caseDecision';

const addressA = `0x${'1'.repeat(40)}` as `0x${string}`;
const addressB = `0x${'2'.repeat(40)}` as `0x${string}`;

const context: CaseDecisionContext = {
  chainId: vector.chain_id,
  caseId: vector.case_id,
  caseVersion: vector.case_version,
  caseEvidenceCommitment: vector.case_evidence_commitment,
  policyVersion: vector.policy_version,
  criteriaVersion: vector.criteria_version,
  criteriaDigest: vector.criteria_digest,
  courtAddress: vector.court_address as `0x${string}`,
  petitioner: addressA,
  respondent: addressB,
};

const record: CaseDecisionRecord = {
  decisionId: vector.decision_id,
  chainId: vector.chain_id,
  caseId: vector.case_id,
  caseVersion: vector.case_version,
  caseEvidenceCommitment: vector.case_evidence_commitment,
  policyVersion: vector.policy_version,
  criteriaVersion: vector.criteria_version,
  criteriaDigest: vector.criteria_digest,
  decisionSchemaVersion: vector.decision_schema_version,
  courtAddress: vector.court_address as `0x${string}`,
  inputCommitment: vector.input_commitment,
  classification: vector.classification,
  recommendedOutcome: vector.recommended_outcome,
  evidenceSufficient: vector.evidence_sufficient,
  reasonsDigest: vector.reasons_digest,
  resultDigest: vector.result_digest,
  recordingContractAddress: vector.court_address as `0x${string}`,
};

describe('case-decision cross-language commitment vectors', () => {
  it('matches the Python evidence-root, input-commitment, and result-digest vector', async () => {
    const evidenceRefs = vector.references.map((ref) => ({
      sequence: ref.sequence,
      evidenceId: ref.evidence_id,
      digest: ref.digest,
      schemaVersion: ref.schema_version,
      sourceReferenceDigest: ref.source_reference_digest,
    }));
    expect(await computeCaseEvidenceCommitment(vector.case_id, evidenceRefs)).toBe(vector.case_evidence_commitment);
    expect(await computeCaseDecisionInputCommitment({
      decisionId: vector.decision_id,
      chainId: vector.chain_id,
      caseId: vector.case_id,
      caseVersion: vector.case_version,
      caseEvidenceCommitment: vector.case_evidence_commitment,
      policyVersion: vector.policy_version,
      criteriaVersion: vector.criteria_version,
      criteriaDigest: vector.criteria_digest,
      decisionSchemaVersion: vector.decision_schema_version,
      courtAddress: vector.court_address,
    })).toBe(vector.input_commitment);
    expect(await computeCaseDecisionResultDigest({
      inputCommitment: vector.input_commitment,
      classification: vector.classification,
      recommendedOutcome: vector.recommended_outcome,
      evidenceSufficient: vector.evidence_sufficient,
      reasonsDigest: vector.reasons_digest,
    })).toBe(vector.result_digest);
  });

  it('verifies exact evidence UTF-8 bytes and rejects changed whitespace', async () => {
    const text = 'fictional public evidence\n';
    const digest = await sha256Utf8(text);
    const reference = {
      sequence: 1,
      evidenceId: 'FICT-EVIDENCE-1',
      digest,
      schemaVersion: 1,
      sourceReferenceDigest: 'c'.repeat(64),
    };
    await expect(verifyCaseEvidenceText(reference, text)).resolves.toBeUndefined();
    await expect(verifyCaseEvidenceText(reference, text.trim())).rejects.toThrow('evidence_bytes_digest_mismatch');
  });
});

describe('local-only case decision boundary checks', () => {
  it('accepts a structurally consistent candidate only for the exact case context', async () => {
    await expect(validateCaseDecisionCandidate(record, context, addressA)).resolves.toBeUndefined();
  });

  it.each([
    ['mismatched case', { ...record, caseId: 'FICT-CASE-0002' }, context, addressA, 'case_id_mismatch'],
    ['replay into another case', record, { ...context, caseId: 'FICT-CASE-0002' }, addressA, 'case_id_mismatch'],
    ['mismatched evidence root', { ...record, caseEvidenceCommitment: '0'.repeat(64) }, context, addressA, 'case_evidence_commitment_mismatch'],
    ['unauthorized requester', record, context, `0x${'3'.repeat(40)}`, 'unauthorized_adjudication_requester'],
    ['forged recording contract', { ...record, recordingContractAddress: addressB }, context, addressA, 'forged_recording_contract_identity'],
    ['criteria version mismatch', { ...record, criteriaVersion: 2 }, context, addressA, 'criteria_version_mismatch'],
    ['replayed decision id', record, context, addressA, 'duplicate_decision_id'],
  ])('rejects %s', async (_label, candidate, expectedContext, requester, code) => {
    const used = code === 'duplicate_decision_id' ? [record.decisionId] : [];
    await expect(validateCaseDecisionCandidate(
      candidate as CaseDecisionRecord,
      expectedContext as CaseDecisionContext,
      requester as string,
      used,
    )).rejects.toMatchObject({ code });
  });

  it('does not resolve a forged id that is absent from the trusted read result set', () => {
    expect(() => resolveCaseDecisionReference('FICT-DECISION-FORGED', new Map())).toThrow('unknown_decision_id');
    expect(resolveCaseDecisionReference(record.decisionId, new Map([[record.decisionId, record]]))).toBe(record);
  });

  it('requires exact appeal case, decision, version, and result digest', () => {
    const target: CaseAppealTarget = {
      caseId: record.caseId,
      decisionId: record.decisionId,
      decisionVersion: record.caseVersion,
      resultDigest: record.resultDigest,
    };
    expect(() => validateCaseAppealTarget(target, target)).not.toThrow();
    expect(() => validateCaseAppealTarget({ ...target, decisionVersion: target.decisionVersion + 1 }, target))
      .toThrow('appeal_decision_version_mismatch');
    expect(() => validateCaseAppealTarget({ ...target, decisionId: 'FICT-DECISION-OTHER' }, target))
      .toThrow('appeal_decision_id_mismatch');
  });

  it('keeps deployment identity unverified until a reviewed manifest matches target network and address', () => {
    expect(() => validateDeploymentIdentity({
      chainId: 61999,
      caseCourtAddress: record.courtAddress,
      recordingContractAddress: record.courtAddress,
      manifestStatus: 'UNVERIFIED',
    })).toThrow('deployment_manifest_not_reviewed');
    expect(() => validateDeploymentIdentity({
      chainId: 61997,
      caseCourtAddress: record.courtAddress,
      recordingContractAddress: record.courtAddress,
      manifestStatus: 'OPERATOR_REVIEWED',
    })).toThrow('deployment_chain_id_mismatch');
  });

  it('never promotes pending or accepted transactions to finality and checks execution result', () => {
    expect(normalizeCaseDecisionAuthorityStatus('PENDING')).toBe('PENDING');
    expect(normalizeCaseDecisionAuthorityStatus('ACCEPTED', 'FINISHED_WITH_RETURN')).toBe('ACCEPTED_PROVISIONAL');
    expect(normalizeCaseDecisionAuthorityStatus('ACCEPTED', 'FINISHED_WITH_ERROR')).toBe('FAILED');
    expect(normalizeCaseDecisionAuthorityStatus('ACCEPTED')).toBe('UNKNOWN');
    expect(normalizeCaseDecisionAuthorityStatus('FINALIZED')).toBe('UNKNOWN');
    expect(normalizeCaseDecisionAuthorityStatus('FINALIZED', 'FINISHED_WITH_ERROR')).toBe('FAILED');
    expect(normalizeCaseDecisionAuthorityStatus('FINALIZED', 'FINISHED_WITH_RETURN')).toBe('FINALIZED');
  });
});
