import { describe, expect, it } from 'vitest';
import { evaluationRecordStatus } from './recordStatus';
import type { TransactionTrace } from '../types/domain';

const transaction = (status: TransactionTrace['status'], extra: Partial<TransactionTrace> = {}): TransactionTrace => ({
  hash: '0x1234', action: 'Evaluate EVAL-001', status, submittedAtLocal: '2026-10-13T00:00:00.000Z', ...extra,
});

describe('evaluation record lifecycle labels', () => {
  it('does not infer transaction finality from a read-only contract record', () => {
    expect(evaluationRecordStatus()).toEqual({ label: 'CONTRACT RECORD READ · FINALITY UNVERIFIED', finalized: false });
  });

  it.each(['submitted', 'pending', 'processing', 'accepted', 'failed', 'unknown'] as const)(
    'keeps %s transaction records distinct from finalized readback', (status) => {
      expect(evaluationRecordStatus(transaction(status)).finalized).toBe(false);
    },
  );

  it('requires a non-local observed finalization timestamp', () => {
    expect(evaluationRecordStatus(transaction('finalized'))).toEqual({
      label: 'TRANSACTION FINALIZED · RECORD READ', finalized: false,
    });
    expect(evaluationRecordStatus(transaction('finalized', { finalizedAtObserved: '2026-10-13T00:01:00.000Z' }))).toEqual({
      label: 'FINALIZED TRANSACTION · RECORD READ BACK', finalized: true,
    });
  });

  it('does not trust a hydrated localStorage note that claims finalization', () => {
    expect(evaluationRecordStatus(transaction('finalized', {
      finalizedAtObserved: '2026-10-13T00:01:00.000Z', storedLocally: true,
    }))).toEqual({ label: 'LOCAL NOTE · TRANSACTION STATUS UNVERIFIED', finalized: false });
  });
});
