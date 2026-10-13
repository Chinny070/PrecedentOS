import type { TransactionTrace } from '../types/domain';

export type ContractAddresses = { registry: string; evaluator: string };

export function loadAddresses(serialized: string | null, defaults: ContractAddresses): ContractAddresses {
  if (!serialized) return defaults;
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
    const value = parsed as Record<string, unknown>;
    return {
      registry: typeof value.registry === 'string' ? value.registry.trim() : defaults.registry,
      evaluator: typeof value.evaluator === 'string' ? value.evaluator.trim() : defaults.evaluator,
    };
  } catch { return defaults; }
}

/** Hydrated browser entries are explicitly demoted to editable, unverified notes. */
export function loadLocalTransactionNotes(serialized: string | null): TransactionTrace[] {
  try {
    const parsed: unknown = JSON.parse(serialized ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): TransactionTrace[] => {
      if (!value || typeof value !== 'object') return [];
      const tx = value as Partial<TransactionTrace>;
      if (typeof tx.hash !== 'string' || !/^0x[0-9a-f]{64}$/i.test(tx.hash) || typeof tx.action !== 'string' || typeof tx.submittedAtLocal !== 'string') return [];
      const statuses: TransactionTrace['status'][] = ['submitted', 'pending', 'processing', 'accepted', 'finalized', 'failed', 'unknown'];
      if (!statuses.includes(tx.status as TransactionTrace['status'])) return [];
      return [{ ...tx, status: 'unknown', storedLocally: true, lastObservedStatus: tx.status } as TransactionTrace];
    }).slice(0, 50);
  } catch { return []; }
}
