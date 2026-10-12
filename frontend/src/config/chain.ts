import { studionet } from 'genlayer-js/chains';

export const TARGET_CHAIN_ID = 61999;
export const TARGET_CHAIN_NAME = 'GenLayer stable Studionet';
export const STUDIONET_RPC = studionet.rpcUrls.default.http[0];

if (studionet.id !== TARGET_CHAIN_ID) {
  console.error(`GenLayerJS studionet chain definition mismatch: expected ${TARGET_CHAIN_ID}, got ${studionet.id}`);
}

export const addresses = {
  registry: import.meta.env.VITE_GENLAYER_REGISTRY_ADDRESS?.trim() ?? '',
  evaluator: import.meta.env.VITE_GENLAYER_EVALUATOR_ADDRESS?.trim() ?? '',
};

export const hasConfiguredContracts = Boolean(addresses.registry && addresses.evaluator);
export const isAddress = (value: string): value is `0x${string}` => /^0x[0-9a-fA-F]{40}$/.test(value);
