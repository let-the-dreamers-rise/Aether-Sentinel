'use client';

import { useEffect, useCallback } from 'react';
import { useRiskStore } from '@/store/riskStore';
import { useVaultStore } from '@/store/vaultStore';
import { api } from '@/lib/api';

export function useRiskPolling(intervalMs = 30000) {
  const { setCurrentRisk, addToHistory, setLoading, setError } = useRiskStore();
  const { setVaultState } = useVaultStore();

  const fetchRisk = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let riskInput: Record<string, unknown>;

      try {
        const vaultData = await api.getVaultState();
        setVaultState(vaultData);
        riskInput = {
          reserve_ratio: parseInt(vaultData.reserveRatio || '10000', 10) / 10000,
          total_deposits: parseFloat(vaultData.totalDeposits || '0'),
          total_liabilities: parseFloat(vaultData.totalLiabilities || '0'),
          recent_withdrawals: 0,
          timestamp: new Date().toISOString(),
        };
      } catch {
        setVaultState({
          reserveRatio: '8500',
          totalDeposits: '1000000',
          totalLiabilities: '850000',
          paused: false,
          lastUpdate: '0',
          totalUnderlyingAssets: '1000000',
          totalVaultTokens: '1000000',
        });
        riskInput = {
          reserve_ratio: 0.85,
          total_deposits: 1000000,
          total_liabilities: 850000,
          recent_withdrawals: 50000,
          timestamp: new Date().toISOString(),
        };
      }

      const risk = await api.getRiskAssessment(riskInput);
      setCurrentRisk(risk);
      addToHistory(risk);
    } catch {
      setError('Failed to fetch risk data');
      setCurrentRisk({
        risk_score: 35,
        recommended_action: 'MONITOR',
        confidence: 0.72,
        reasoning: 'Using local risk simulation — backend offline',
        timestamp: new Date().toISOString(),
        components: {
          reserve_ratio: 25,
          volatility: 40,
          liquidity: 35,
          withdrawal_anomaly: 30,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [setCurrentRisk, addToHistory, setLoading, setError, setVaultState]);

  useEffect(() => {
    fetchRisk();
    const interval = setInterval(fetchRisk, intervalMs);
    return () => clearInterval(interval);
  }, [fetchRisk, intervalMs]);
}
