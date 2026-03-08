'use client';

import { useState } from 'react';

interface MarketProps {
  market: {
    id: number;
    question: string;
    outcomes: string[];
    totalStake: string;
    participants: number;
    endTime: number;
    status: 'Active' | 'Closed' | 'Settled' | 'Disputed';
    winningOutcome?: number;
  };
}

export function MarketCard({ market }: MarketProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');

  const isActive = market.status === 'Active' && market.endTime > Date.now();
  const timeLeft = market.endTime - Date.now();
  const daysLeft = Math.max(0, Math.floor(timeLeft / 86400000));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % 86400000) / 3600000));

  const statusColors = {
    Active: 'bg-green-500/10 text-green-400',
    Closed: 'bg-yellow-500/10 text-yellow-400',
    Settled: 'bg-blue-500/10 text-blue-400',
    Disputed: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="glass-card-hover p-6">
      <div className="flex items-start justify-between mb-4">
        <span className={`badge ${statusColors[market.status]}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${
            market.status === 'Active' ? 'bg-green-500 animate-glow-pulse' : 'bg-current opacity-50'
          }`} />
          {market.status}
        </span>
        {isActive && (
          <span className="text-[11px] font-mono text-white/30">
            {daysLeft}d {hoursLeft}h left
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold mb-5 leading-relaxed text-white/80">{market.question}</h3>

      <div className="space-y-2 mb-5">
        {market.outcomes.map((outcome, i) => (
          <button
            key={i}
            onClick={() => isActive && setSelectedOutcome(i)}
            disabled={!isActive}
            className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${
              selectedOutcome === i
                ? 'border-brand-500/40 bg-brand-500/[0.08] text-brand-300 shadow-glow-brand/50'
                : market.status === 'Settled' && market.winningOutcome === i
                ? 'border-green-500/30 bg-green-500/[0.06] text-green-300'
                : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:bg-white/[0.04]'
            } ${!isActive ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="font-medium">{outcome}</span>
            {market.status === 'Settled' && market.winningOutcome === i && (
              <span className="badge bg-green-500/10 text-green-400 text-[9px]">Winner</span>
            )}
          </button>
        ))}
      </div>

      {isActive && selectedOutcome !== null && (
        <div className="space-y-3 mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Stake amount (ETH)"
            className="input-field text-sm"
          />
          <button className="btn-primary w-full">Place Stake</button>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-white/25 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${market.totalStake}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span>{market.participants} participants</span>
        </div>
      </div>
    </div>
  );
}
