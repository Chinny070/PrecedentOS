import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { ExecutionResult, TransactionStatus, type CalldataEncodable, type TransactionHash } from 'genlayer-js/types';
import { TARGET_CHAIN_ID } from '../../config/chain';

export interface InjectedProvider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}

export type GenLayerClient = ReturnType<typeof createClient>;
export type WalletSession = { address: `0x${string}`; chainId: number; client: GenLayerClient };

export function createReadClient(): GenLayerClient {
  return createClient({ chain: studionet });
}

export async function connectInjectedWallet(provider = window.ethereum): Promise<WalletSession> {
  if (!provider) throw new Error('No EIP-1193 wallet was detected. You can still use the fictional demo.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
  if (!Array.isArray(accounts) || !accounts[0] || !/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) {
    throw new Error('The wallet did not return a valid account address.');
  }
  const address = accounts[0] as `0x${string}`;
  const client = createClient({ chain: studionet, account: address, provider });
  await client.connect('studionet');
  const actualChain = await provider.request({ method: 'eth_chainId' }) as string;
  const chainId = Number(BigInt(actualChain));
  if (chainId !== TARGET_CHAIN_ID) {
    throw new Error(`Wallet is on chain ${chainId}; PrecedentOS requires stable Studionet ${TARGET_CHAIN_ID}.`);
  }
  return { address, chainId, client };
}

export async function probeStudionetRpc(rpcUrl: string): Promise<number> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}.`);
  const data = await response.json() as { result?: string; error?: { message?: string } };
  if (!data.result) throw new Error(data.error?.message ?? 'RPC response did not include a chain ID.');
  return Number(BigInt(data.result));
}

export async function readPrecedent(client: GenLayerClient, address: string, recordId: string): Promise<Record<string, string>> {
  return await client.readContract({
    address: address as `0x${string}`,
    functionName: 'get_precedent',
    args: [recordId],
  }) as Record<string, string>;
}

export async function readEvaluation(client: GenLayerClient, address: string, evaluationId: string): Promise<Record<string, string>> {
  return await client.readContract({
    address: address as `0x${string}`,
    functionName: 'get_evaluation',
    args: [evaluationId],
  }) as Record<string, string>;
}

export async function writeContractMethod(
  client: GenLayerClient,
  address: string,
  functionName: string,
  args: CalldataEncodable[],
): Promise<`0x${string}`> {
  const write = { address: address as `0x${string}`, functionName, args };
  return await client.writeContract({
    ...write,
    value: 0n,
  }) as `0x${string}`;
}

export async function waitForFinalizedResult(client: GenLayerClient, hash: `0x${string}`): Promise<{ successful: boolean; status: string; detail: string }> {
  const receipt = await client.waitForTransactionReceipt({ hash: hash as TransactionHash, status: TransactionStatus.FINALIZED });
  return {
    successful: receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN,
    status: String(receipt.statusName ?? 'unknown'),
    detail: String(receipt.txExecutionResultName ?? ''),
  };
}
