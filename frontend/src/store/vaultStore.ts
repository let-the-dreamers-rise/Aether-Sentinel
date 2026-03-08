import { create } from 'zustand';
import type { VaultState } from '@/lib/api';

interface VaultStoreState {
  vaultState: VaultState | null;
  userBalance: string;
  isLoading: boolean;
  error: string | null;
  setVaultState: (state: VaultState) => void;
  setUserBalance: (balance: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVaultStore = create<VaultStoreState>((set) => ({
  vaultState: null,
  userBalance: '0',
  isLoading: false,
  error: null,
  setVaultState: (state) => set({ vaultState: state }),
  setUserBalance: (balance) => set({ userBalance: balance }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
