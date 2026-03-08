'use client';

import { useRiskStore } from '@/store/riskStore';

export function EmergencyBanner() {
  const { emergencyActive, currentRisk } = useRiskStore();

  if (!emergencyActive) return null;

  return (
    <div className="relative bg-red-950/60 border-b border-red-500/20 px-8 py-3.5 flex items-center gap-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20" />
      <div className="relative flex items-center gap-3">
        <div className="relative">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
        </div>
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <span className="relative text-red-200/90 text-sm font-semibold tracking-wide">
        EMERGENCY SAFEGUARD ACTIVE
      </span>
      <span className="relative text-red-300/60 text-sm">
        Risk Score: {currentRisk?.risk_score ?? 'N/A'} — Action: {currentRisk?.recommended_action ?? 'PAUSE'}
      </span>
    </div>
  );
}
