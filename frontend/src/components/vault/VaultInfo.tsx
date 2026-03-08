'use client';

import { useVaultStore } from '@/store/vaultStore';
import { formatBasisPoints, formatNumber } from '@/lib/utils';

export function VaultInfo() {
  const { vaultState, userBalance } = useVaultStore();

  return (
    <div className="space-y-5">
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Your Position</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/30">Vault Tokens</span>
            <span className="text-sm font-mono font-semibold text-white">{userBalance || '0'}</span>
          </div>
          <div className="border-t border-white/[0.04]" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/30">Est. Value</span>
            <span className="text-sm font-mono font-semibold text-white">${userBalance || '0'}</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Vault Stats</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/30">Reserve Ratio</span>
            <span className="text-sm font-mono font-semibold text-green-400">
              {vaultState ? formatBasisPoints(vaultState.reserveRatio) : '--'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/30">Total Deposits</span>
            <span className="text-sm font-mono text-white/60">
              ${vaultState ? formatNumber(vaultState.totalDeposits || '0') : '--'}
            </span>
          </div>
          <div className="border-t border-white/[0.04]" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/30">Status</span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${vaultState?.paused ? 'bg-red-500' : 'bg-green-500 animate-glow-pulse'}`} />
              <span className={`text-sm font-medium ${vaultState?.paused ? 'text-red-400' : 'text-green-400'}`}>
                {vaultState?.paused ? 'Paused' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Security</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>AI risk-gated deposits</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>World ID sybil resistance</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Autonomous emergency pause</span>
          </div>
        </div>
      </div>
    </div>
  );
}
