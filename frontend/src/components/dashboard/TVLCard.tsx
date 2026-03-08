'use client';

import { useVaultStore } from '@/store/vaultStore';
import { useRiskStore } from '@/store/riskStore';
import { formatNumber } from '@/lib/utils';

export function TVLCard() {
  const { vaultState } = useVaultStore();
  const { isLoading } = useRiskStore();
  const tvl = vaultState?.totalUnderlyingAssets ?? vaultState?.totalDeposits ?? '0';

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Total Value Locked</h3>
        </div>
        <span className="badge bg-brand-500/10 text-brand-400">TVL</span>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-white/30 font-medium">$</span>
          <span className="stat-value text-white">
            {isLoading ? '--' : formatNumber(tvl)}
          </span>
        </div>
      </div>

      {/* Mini chart placeholder */}
      <div className="mb-5 flex items-end gap-[3px] h-10">
        {[35, 50, 45, 60, 55, 70, 65, 80, 75, 85, 78, 90].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-brand-500/20 transition-all duration-500"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Vault Tokens</span>
          <span className="text-xs font-mono text-white/60">{vaultState?.totalVaultTokens ?? '0'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Last Update</span>
          <span className="text-xs font-mono text-white/60">
            {vaultState?.lastUpdate && vaultState.lastUpdate !== '0'
              ? new Date(parseInt(vaultState.lastUpdate, 10) * 1000).toLocaleTimeString()
              : 'Live'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Protocol</span>
          <span className="text-xs text-brand-400 font-medium">Aether Vault v1</span>
        </div>
      </div>
    </div>
  );
}
