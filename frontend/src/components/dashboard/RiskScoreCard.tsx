'use client';

import { useRiskStore } from '@/store/riskStore';
import { getRiskLevel, getRiskColor } from '@/lib/utils';

export function RiskScoreCard() {
  const { currentRisk, isLoading } = useRiskStore();
  const score = currentRisk?.risk_score ?? 0;
  const level = getRiskLevel(score);
  const color = getRiskColor(score);

  const glowClass = {
    low: 'risk-glow-low',
    moderate: 'risk-glow-moderate',
    elevated: 'risk-glow-elevated',
    critical: 'risk-glow-critical',
  }[level];

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`glass-card p-6 ${glowClass} h-full`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Risk Score</h3>
        </div>
        <span
          className="badge"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {level}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg className="w-[130px] h-[130px] -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isLoading ? circumference : strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tracking-tight" style={{ color }}>
              {isLoading ? '--' : score}
            </span>
            <span className="text-[10px] text-white/25 font-medium">/100</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Action</p>
            <p className="text-sm font-semibold text-white/80">
              {currentRisk?.recommended_action ?? 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${currentRisk ? currentRisk.confidence * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #0ea5e9, #a855f7)',
                  }}
                />
              </div>
              <span className="text-xs font-mono text-white/40">
                {currentRisk ? `${(currentRisk.confidence * 100).toFixed(0)}%` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
