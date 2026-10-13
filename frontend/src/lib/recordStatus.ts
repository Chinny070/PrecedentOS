import type { TransactionTrace } from '../types/domain';

/** Keep a keyed contract read distinct from the lifecycle of its write transaction. */
export function evaluationRecordStatus(transaction?: TransactionTrace): { label: string; finalized: boolean } {
  if (!transaction) return { label: 'CONTRACT RECORD READ · FINALITY UNVERIFIED', finalized: false };
  if (transaction.storedLocally) {
    return { label: 'LOCAL NOTE · TRANSACTION STATUS UNVERIFIED', finalized: false };
  }
  if (transaction.status === 'finalized' && transaction.finalizedAtObserved) {
    return { label: 'FINALIZED TRANSACTION · RECORD READ BACK', finalized: true };
  }
  return { label: `TRANSACTION ${transaction.status.toUpperCase()} · RECORD READ`, finalized: false };
}
