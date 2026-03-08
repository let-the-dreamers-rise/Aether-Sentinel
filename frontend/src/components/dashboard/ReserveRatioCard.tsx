'use client';

import { useVaultStore } from '@/store/vaultStore';
import { useRiskStore } from '@/store/riskStore';
import { formatBasisPoints, formatNumber } from '@/lib/utils';

export function ReserveRatioCard() {
  const { vaultState } = useVaultStore();
  const { isLoading } = useRiskStore();
  const ratio = vaultState?.reserveRatio ?? '10000';
  const percentage = parseInt(ratio, 10) / 100;
  const isHealthy = percentage >= 20;

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Reserve Ratio</h3>
        </div>
        <span className={`badge ${isHealthy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {isHealthy ? 'Healthy' : 'Low'}
        </span>
      </div>

      <div className="mb-5">
        <span className={`stat-value ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
          {isLoading ? '--' : formatBasisPoints(ratio)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              background: isHealthy
                ? 'linear-gradient(90deg, #10b981, #0ea5e9)'
                : 'linear-gradient(90deg, #f43f5e, #f97316)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-white/20">0%</span>
          <span className="text-[10px] text-white/20">Min 20%</span>
          <span className="text-[10px] text-white/20">100%</span>
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Total Deposits</span>
          <span className="text-xs font-mono text-white/60">
            ${vaultState ? formatNumber(vaultState.totalDeposits || '0') : '--'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Total Liabilities</span>
          <span className="text-xs font-mono text-white/60">
            ${vaultState ? formatNumber(vaultState.totalLiabilities || '0') : '--'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Vault Status</span>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${vaultState?.paused ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className={`text-xs font-medium ${vaultState?.paused ? 'text-red-400' : 'text-green-400'}`}>
              {vaultState?.paused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
