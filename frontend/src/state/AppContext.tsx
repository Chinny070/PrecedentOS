import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { addresses as buildAddresses } from '../config/chain';
import { connectInjectedWallet, type WalletSession } from '../lib/genlayer/client';
import type { TransactionTrace } from '../types/domain';

type ContractAddresses = { registry: string; evaluator: string };
type AppContextValue = {
  wallet: WalletSession | null;
  walletError: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  addresses: ContractAddresses;
  saveAddresses: (next: ContractAddresses) => void;
  transactions: TransactionTrace[];
  saveTransaction: (tx: TransactionTrace) => void;
  updateTransaction: (hash: string, patch: Partial<TransactionTrace>) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const ADDRESS_KEY = 'precedentos.public-contract-addresses.v1';
const TX_KEY = 'precedentos.public-transactions.v1';

function initialAddresses(): ContractAddresses {
  try {
    const stored = localStorage.getItem(ADDRESS_KEY);
    if (stored) return { ...buildAddresses, ...JSON.parse(stored) };
  } catch { /* Ignore corrupted local preferences; no chain state is stored here. */ }
  return buildAddresses;
}

function initialTransactions(): TransactionTrace[] {
  try { return JSON.parse(localStorage.getItem(TX_KEY) ?? '[]') as TransactionTrace[]; }
  catch { return []; }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [walletError, setWalletError] = useState('');
  const [addresses, setAddresses] = useState<ContractAddresses>(initialAddresses);
  const [transactions, setTransactions] = useState<TransactionTrace[]>(initialTransactions);

  async function connect() {
    setWalletError('');
    try { setWallet(await connectInjectedWallet()); }
    catch (error) { setWalletError(error instanceof Error ? error.message : 'Wallet connection failed.'); }
  }
  function disconnect() { setWallet(null); }
  function saveAddresses(next: ContractAddresses) {
    setAddresses(next);
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(next));
  }
  function saveTransaction(tx: TransactionTrace) {
    setTransactions((current) => {
      const next = [tx, ...current.filter((item) => item.hash !== tx.hash)].slice(0, 50);
      localStorage.setItem(TX_KEY, JSON.stringify(next));
      return next;
    });
  }
  function updateTransaction(hash: string, patch: Partial<TransactionTrace>) {
    setTransactions((current) => {
      const next = current.map((item) => item.hash === hash ? { ...item, ...patch } : item);
      localStorage.setItem(TX_KEY, JSON.stringify(next));
      return next;
    });
  }

  const value = useMemo(() => ({ wallet, walletError, connect, disconnect, addresses, saveAddresses, transactions, saveTransaction, updateTransaction }), [wallet, walletError, addresses, transactions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider.');
  return value;
}
