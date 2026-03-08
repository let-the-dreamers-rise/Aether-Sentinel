import { create } from 'zustand';
import type { RiskAssessment } from '@/lib/api';

interface RiskState {
  currentRisk: RiskAssessment | null;
  riskHistory: RiskAssessment[];
  isLoading: boolean;
  error: string | null;
  emergencyActive: boolean;
  setCurrentRisk: (risk: RiskAssessment) => void;
  addToHistory: (risk: RiskAssessment) => void;
  setRiskHistory: (history: RiskAssessment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setEmergencyActive: (active: boolean) => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  currentRisk: null,
  riskHistory: [],
  isLoading: false,
  error: null,
  emergencyActive: false,
  setCurrentRisk: (risk) =>
    set({
      currentRisk: risk,
      emergencyActive: risk.risk_score >= 90,
    }),
  addToHistory: (risk) =>
    set((state) => ({
      riskHistory: [risk, ...state.riskHistory].slice(0, 100),
    })),
  setRiskHistory: (history) => set({ riskHistory: history }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setEmergencyActive: (active) => set({ emergencyActive: active }),
}));
