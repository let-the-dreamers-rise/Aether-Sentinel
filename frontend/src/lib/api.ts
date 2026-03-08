const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface RiskAssessment {
  risk_score: number;
  recommended_action: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
  components: {
    reserve_ratio: number;
    volatility: number;
    liquidity: number;
    withdrawal_anomaly: number;
  };
}

export interface VaultState {
  reserveRatio: string;
  totalDeposits: string;
  totalLiabilities: string;
  paused: boolean;
  lastUpdate: string;
  totalUnderlyingAssets?: string;
  totalVaultTokens?: string;
}

export const api = {
  getRiskAssessment: (vaultState: Record<string, unknown>) =>
    fetchAPI<RiskAssessment>('/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({ vault_state: vaultState }),
    }),

  getRiskHistory: () => fetchAPI<RiskAssessment[]>('/api/risk-assessment/history'),

  getVaultState: () => fetchAPI<VaultState>('/api/blockchain/vault-state'),

  verifyWorldId: (proof: Record<string, unknown>) =>
    fetchAPI<{ verified: boolean; token: string }>('/api/verify-world-id', {
      method: 'POST',
      body: JSON.stringify(proof),
    }),

  getHealth: () => fetchAPI<{ status: string }>('/health'),
};
