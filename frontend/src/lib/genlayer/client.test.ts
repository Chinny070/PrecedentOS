import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenLayerClient, InjectedProvider, WalletSession } from './client';

const hash = `0x${'1'.repeat(64)}` as const;
const account = `0x${'a'.repeat(40)}` as const;
const passageA = 'Fictional evidence A';
const passageB = 'Fictional evidence B';

const sdkClient = {
  connect: vi.fn(),
  writeContract: vi.fn(),
  readContract: vi.fn(),
  getTransaction: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
};

vi.mock('genlayer-js', () => ({ createClient: vi.fn(() => sdkClient) }));
vi.mock('genlayer-js/chains', () => ({ studionet: { id: 61999, rpcUrls: { default: { http: ['https://studio.genlayer.com/api'] } } } }));

const { assertEvaluationReadbackBinding, assertWalletSessionCurrent, connectInjectedWallet, probeStudionetRpc, readPrecedent, trackTransactionLifecycle, watchWalletSession, writeContractMethod } = await import('./client');

function providerFor(overrides: Record<string, unknown> = {}): InjectedProvider {
  return {
    request: vi.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') return [account];
      if (method === 'eth_accounts') return [account];
      if (method === 'eth_chainId') return '0xf22f';
      return undefined;
    }),
    ...overrides,
  };
}

function session(provider = providerFor()): WalletSession {
  return { address: account, chainId: 61999, client: sdkClient as unknown as GenLayerClient, provider };
}

function connectWith(provider: InjectedProvider) {
  vi.stubGlobal('window', { ethereum: provider });
  return connectInjectedWallet(provider);
}

function registryArgs() {
  return ['FICT-MUNI-001', 'a'.repeat(64), 1, 'Fictional North District', '2030-08-19', 'Fictional access dispute'];
}

function evaluatorArgs() {
  return ['EVAL-TEST-001', 'FICT-MUNI-001', 'a'.repeat(64), 'FICT-MUNI-002', 'b'.repeat(64), JSON.stringify({ precedent_a: passageA, precedent_b: passageB }), 1, 1, 'Compare the fictional rule and outcomes.'];
}

describe('GenLayerJS 1.1.8 wallet and transaction adapter', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    sdkClient.connect.mockResolvedValue(undefined);
    sdkClient.writeContract.mockResolvedValue(hash);
  });

  it('surfaces wallet request rejection without creating a session', async () => {
    const provider = providerFor({ request: vi.fn().mockRejectedValue(new Error('User rejected request')) });
    await expect(connectWith(provider)).rejects.toThrow('User rejected request');
  });

  it('rejects a changed account during the documented connect flow', async () => {
    const provider = providerFor({ request: vi.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') return [account];
      if (method === 'eth_accounts') return [`0x${'b'.repeat(40)}`];
      return '0xf22f';
    }) });
    await expect(connectWith(provider)).rejects.toThrow('active wallet account changed');
  });

  it('rejects an incorrect wallet chain after connect', async () => {
    const provider = providerFor({ request: vi.fn(async ({ method }: { method: string }) => method === 'eth_requestAccounts' || method === 'eth_accounts' ? [account] : '0x1') });
    await expect(connectWith(provider)).rejects.toThrow('requires stable Studionet 61999');
    expect(sdkClient.connect).toHaveBeenCalledWith('studionet');
  });

  it('invokes the SDK network switch only when initially off Studionet and rechecks identity', async () => {
    let chain = '0x1';
    const provider = providerFor({ request: vi.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [account];
      return chain;
    }) });
    sdkClient.connect.mockImplementation(async () => { chain = '0xf22f'; });
    const connected = await connectWith(provider);
    expect(connected.chainId).toBe(61999);
    expect(sdkClient.connect).toHaveBeenCalledWith('studionet');
  });

  it('blocks writes when the account or chain changed since connection', async () => {
    const changedAccount = providerFor({ request: vi.fn(async ({ method }: { method: string }) => method === 'eth_accounts' ? [`0x${'b'.repeat(40)}`] : '0xf27f') });
    await expect(writeContractMethod(session(changedAccount), `0x${'c'.repeat(40)}`, 'register_precedent', registryArgs())).rejects.toThrow('account changed');
    const wrongChain = providerFor({ request: vi.fn(async ({ method }: { method: string }) => method === 'eth_accounts' ? [account] : '0x1') });
    await expect(assertWalletSessionCurrent(session(wrongChain))).rejects.toThrow('requires stable Studionet 61999');
    expect(sdkClient.writeContract).not.toHaveBeenCalled();
  });

  it('invalidates sessions on account, chain, and provider disconnect events and removes listeners', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    const provider = providerFor({
      on: (event: string, listener: (...args: unknown[]) => void) => { handlers.set(event, listener); },
      removeListener: (event: string) => { handlers.delete(event); },
    });
    const invalid = vi.fn();
    const stop = watchWalletSession(session(provider), invalid);
    handlers.get('accountsChanged')?.([`0x${'b'.repeat(40)}`]);
    expect(invalid).toHaveBeenCalledWith('Wallet account changed. Reconnect before continuing.');
    stop();
    expect(handlers.size).toBe(0);

    for (const [event, args, expected] of [
      ['chainChanged', ['0x1'], 'Wallet network changed to 1. Reconnect before continuing.'],
      ['disconnect', [], 'Wallet provider disconnected. Reconnect before continuing.'],
    ] as const) {
      const eventHandlers = new Map<string, (...values: unknown[]) => void>();
      const eventProvider = providerFor({ on: (name: string, listener: (...values: unknown[]) => void) => { eventHandlers.set(name, listener); } });
      const callback = vi.fn();
      watchWalletSession(session(eventProvider), callback);
      eventHandlers.get(event)?.(...args);
      expect(callback).toHaveBeenCalledWith(expected);
    }
  });

  it('rejects invalid contract addresses before any wallet write', async () => {
    await expect(writeContractMethod(session(), 'not-an-address', 'register_precedent', registryArgs())).rejects.toThrow('valid 20-byte contract address');
    await expect(writeContractMethod(session(), `0x${'0'.repeat(40)}`, 'register_precedent', registryArgs())).rejects.toThrow('valid 20-byte contract address');
    expect(sdkClient.writeContract).not.toHaveBeenCalled();
  });

  it('rejects invalid Registry arguments and mismatched Evaluator evidence digests', async () => {
    await expect(writeContractMethod(session(), `0x${'c'.repeat(40)}`, 'register_precedent', ['lowercase', ...registryArgs().slice(1)])).rejects.toThrow('record identifier');
    const args = evaluatorArgs();
    args[2] = 'f'.repeat(64);
    await expect(writeContractMethod(session(), `0x${'c'.repeat(40)}`, 'evaluate_pair', args)).rejects.toThrow('does not match');
    expect(sdkClient.writeContract).not.toHaveBeenCalled();
  });

  it('accepts only the exact bounded Registry and Evaluator entry-point argument lists', async () => {
    const wallet = session();
    expect(await writeContractMethod(wallet, `0x${'c'.repeat(40)}`, 'register_precedent', registryArgs())).toBe(hash);
    // SHA-256 values for the test passages are intentionally calculated below from WebCrypto.
    const { sha256Utf8 } = await import('../commitments');
    const [a, b] = await Promise.all([sha256Utf8(passageA), sha256Utf8(passageB)]);
    const args = evaluatorArgs(); args[2] = a; args[4] = b;
    expect(await writeContractMethod(wallet, `0x${'c'.repeat(40)}`, 'evaluate_pair', args)).toBe(hash);
    expect(sdkClient.writeContract).toHaveBeenCalledTimes(2);
  });

  it('validates keyed read addresses and arguments before using the SDK readContract API', async () => {
    await expect(readPrecedent(sdkClient as unknown as GenLayerClient, 'bad', 'FICT-MUNI-001')).rejects.toThrow('valid 20-byte contract address');
    await expect(readPrecedent(sdkClient as unknown as GenLayerClient, `0x${'c'.repeat(40)}`, 'bad')).rejects.toThrow('record identifier');
    expect(sdkClient.readContract).not.toHaveBeenCalled();
  });

  it('requires evaluation readback to match the finalized submission binding', () => {
    const expected = {
      evaluationId: 'EVAL-TEST-001', recordAId: 'FICT-MUNI-001', recordADigest: 'a'.repeat(64),
      recordBId: 'FICT-MUNI-002', recordBDigest: 'b'.repeat(64), inputCommitment: 'c'.repeat(64),
    };
    const response = {
      evaluation_id: expected.evaluationId, record_a_id: expected.recordAId, record_a_digest: expected.recordADigest,
      record_b_id: expected.recordBId, record_b_digest: expected.recordBDigest, input_commitment: expected.inputCommitment,
    };
    expect(() => assertEvaluationReadbackBinding(response, expected)).not.toThrow();
    expect(() => assertEvaluationReadbackBinding({ ...response, evaluation_id: 'OTHER-EVALUATION' }, expected)).toThrow('binding mismatch');
    expect(() => assertEvaluationReadbackBinding({ ...response, input_commitment: 'bad' }, expected)).toThrow('binding mismatch');
  });

  it('returns unknown on RPC errors and bounded polling timeouts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    await expect(probeStudionetRpc('https://studio.genlayer.com/api')).rejects.toThrow('network unavailable');
    vi.unstubAllGlobals();
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'PENDING' });
    const onUpdate = vi.fn();
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, onUpdate, { attempts: 2, intervalMs: 0, sleep: async () => undefined });
    expect(outcome.status).toBe('unknown');
    expect(onUpdate).toHaveBeenCalledWith({ status: 'pending', detail: 'PENDING' });
  });

  it('keeps unrecognized SDK lifecycle states unknown instead of labeling them as processing', async () => {
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'FUTURE_STATUS' });
    const onUpdate = vi.fn();
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, onUpdate, { attempts: 1 });
    expect(onUpdate).toHaveBeenCalledWith({ status: 'unknown', detail: 'FUTURE_STATUS' });
    expect(outcome.status).toBe('unknown');
    expect(outcome.detail).toBe('No finalized result was observed after 1 status checks.');
  });

  it('reports accepted as nonfinal and does not treat finalized-with-error as success', async () => {
    sdkClient.getTransaction.mockResolvedValueOnce({ statusName: 'ACCEPTED', resultName: 'MAJORITY_AGREE' }).mockResolvedValueOnce({ statusName: 'FINALIZED', resultName: 'MAJORITY_AGREE' });
    sdkClient.waitForTransactionReceipt.mockResolvedValue({ statusName: 'FINALIZED', resultName: 'MAJORITY_AGREE', txExecutionResultName: 'FINISHED_WITH_ERROR' });
    const updates: string[] = [];
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, (update) => updates.push(update.status), { attempts: 3, intervalMs: 0, sleep: async () => undefined });
    expect(updates).toContain('accepted');
    expect(updates).not.toContain('finalized');
    expect(outcome.status).toBe('failed');
  });

  it('reports finality only when the SDK receipt is FINALIZED with FINISHED_WITH_RETURN', async () => {
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'FINALIZED', resultName: 'MAJORITY_AGREE' });
    sdkClient.waitForTransactionReceipt.mockResolvedValue({ statusName: 'FINALIZED', resultName: 'MAJORITY_AGREE', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, undefined, { attempts: 1 });
    expect(outcome.status).toBe('finalized');
    expect(outcome.detail).toContain('MAJORITY_AGREE');
    expect(outcome.finalizedAtObserved).toBeTruthy();
  });

  it('never reports a finalized leader return as successful without majority agreement', async () => {
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'FINALIZED', resultName: 'NO_MAJORITY' });
    sdkClient.waitForTransactionReceipt.mockResolvedValue({ statusName: 'FINALIZED', resultName: 'NO_MAJORITY', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    const updates: string[] = [];
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, (update) => updates.push(update.status), { attempts: 1 });
    expect(outcome.status).toBe('failed');
    expect(outcome.detail).toContain('NO_MAJORITY');
    expect(updates).not.toContain('finalized');
  });

  it('keeps finalized responses with missing consensus evidence unknown', async () => {
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'FINALIZED' });
    sdkClient.waitForTransactionReceipt.mockResolvedValue({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    const updates: string[] = [];
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, (update) => updates.push(update.status), { attempts: 1 });
    expect(outcome.status).toBe('unknown');
    expect(outcome.detail).toContain('missing explicit majority-agreement evidence');
    expect(updates).toContain('unknown');
    expect(updates).not.toContain('finalized');
  });

  it('stops on an Undetermined consensus state instead of polling or claiming success', async () => {
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'UNDETERMINED', resultName: 'NO_MAJORITY', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, undefined, { attempts: 5, intervalMs: 0, sleep: async () => undefined });
    expect(outcome.status).toBe('unknown');
    expect(outcome.detail).toContain('without an accepted decision');
    expect(sdkClient.getTransaction).toHaveBeenCalledTimes(1);
    expect(sdkClient.waitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it('keeps finalized receipts with NOT_VOTED execution unknown and visible in the UI trace', async () => {
    sdkClient.getTransaction.mockResolvedValue({ statusName: 'FINALIZED' });
    sdkClient.waitForTransactionReceipt.mockResolvedValue({ statusName: 'FINALIZED', txExecutionResultName: 'NOT_VOTED' });
    const updates: string[] = [];
    const outcome = await trackTransactionLifecycle(sdkClient as unknown as GenLayerClient, hash, (update) => updates.push(update.status), { attempts: 1 });
    expect(outcome.status).toBe('unknown');
    expect(updates).toContain('unknown');
    expect(updates).not.toContain('finalized');
  });
});
