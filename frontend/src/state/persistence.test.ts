import { describe, expect, it } from 'vitest';
import { loadAddresses, loadLocalTransactionNotes } from './persistence';

const defaults = { registry: '', evaluator: '' };
const finalNote = JSON.stringify([{ hash: `0x${'a'.repeat(64)}`, action: 'Register fictional record', status: 'finalized', submittedAtLocal: '2030-01-01T00:00:00.000Z', finalizedAtObserved: '2030-01-01T00:01:00.000Z' }]);

describe('browser-persisted settings and transaction notes', () => {
  it('loads only string contract settings and trims whitespace', () => {
    expect(loadAddresses(JSON.stringify({ registry: '  0xabc  ', evaluator: 5 }), defaults)).toEqual({ registry: '0xabc', evaluator: '' });
    expect(loadAddresses('{broken', defaults)).toEqual(defaults);
    expect(loadAddresses(JSON.stringify(['not', 'an', 'object']), defaults)).toEqual(defaults);
  });

  it('demotes a locally stored finalized status to an unverified local note on reload', () => {
    const [note] = loadLocalTransactionNotes(finalNote);
    expect(note.status).toBe('unknown');
    expect(note.lastObservedStatus).toBe('finalized');
    expect(note.storedLocally).toBe(true);
    expect(note.finalizedAtObserved).toBe('2030-01-01T00:01:00.000Z');
  });

  it('ignores malformed, incomplete, and non-hash transaction history entries', () => {
    expect(loadLocalTransactionNotes('{bad')).toEqual([]);
    expect(loadLocalTransactionNotes(JSON.stringify([{ hash: '0x123', action: 'x', status: 'finalized', submittedAtLocal: 'now' }]))).toEqual([]);
  });
});
