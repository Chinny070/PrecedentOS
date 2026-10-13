import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addresses as buildAddresses } from '../config/chain';
import { connectInjectedWallet, watchWalletSession, type WalletSession } from '../lib/genlayer/client';
import type { TransactionTrace } from '../types/domain';
import { loadAddresses, loadLocalTransactionNotes, type ContractAddresses } from './persistence';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [walletError, setWalletError] = useState('');
  const [addresses, setAddresses] = useState<ContractAddresses>(() => loadAddresses(localStorage.getItem(ADDRESS_KEY), buildAddresses));
  const [transactions, setTransactions] = useState<TransactionTrace[]>(() => loadLocalTransactionNotes(localStorage.getItem(TX_KEY)));

  async function connect() {
    setWalletError('');
    setWallet(null);
    try { setWallet(await connectInjectedWallet()); }
    catch (error) { setWalletError(error instanceof Error ? error.message : 'Wallet connection failed.'); }
  }
  function disconnect() { setWallet(null); setWalletError(''); }
  function saveAddresses(next: ContractAddresses) {
    const safe = { registry: typeof next.registry === 'string' ? next.registry.trim() : '', evaluator: typeof next.evaluator === 'string' ? next.evaluator.trim() : '' };
    setAddresses(safe);
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(safe));
  }
  function saveTransaction(tx: TransactionTrace) {
    setTransactions((current) => {
      const next = [{ ...tx, storedLocally: false }, ...current.filter((item) => item.hash !== tx.hash)].slice(0, 50);
      localStorage.setItem(TX_KEY, JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    if (!wallet) return;
    return watchWalletSession(wallet, (message) => {
      setWallet(null);
      setWalletError(message);
    });
  }, [wallet]);
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
