'use client';

import { useState } from 'react';
import { MarketCard } from '@/components/markets/MarketCard';
import { CreateMarketForm } from '@/components/markets/CreateMarketForm';

const mockMarkets = [
  {
    id: 0,
    question: 'Will ETH hold above $3,000 by end of Q1 2026?',
    outcomes: ['Yes', 'No'],
    totalStake: '15,000',
    participants: 42,
    endTime: Date.now() + 7 * 86400000,
    status: 'Active' as const,
  },
  {
    id: 1,
    question: 'Will the vault reserve ratio stay above 20% this week?',
    outcomes: ['Above 20%', 'Below 20%'],
    totalStake: '8,500',
    participants: 28,
    endTime: Date.now() + 3 * 86400000,
    status: 'Active' as const,
  },
  {
    id: 2,
    question: 'Will a critical risk event (score>90) occur this month?',
    outcomes: ['Yes', 'No'],
    totalStake: '22,000',
    participants: 67,
    endTime: Date.now() - 86400000,
    status: 'Settled' as const,
    winningOutcome: 1,
  },
];

export default function MarketsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20">
                <svg className="w-3 h-3 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                </svg>
                <span className="text-[10px] font-bold text-accent-300 uppercase tracking-wider">On-Chain Settlement</span>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold gradient-text-hero tracking-tight">
              Prediction Markets
            </h1>
            <p className="text-[13px] text-white/25 mt-3 max-w-lg leading-relaxed">
              World ID verified risk prediction markets with autonomous CRE-powered resolution.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={showCreate ? 'btn-secondary self-start' : 'btn-primary self-start'}
          >
            <span className="flex items-center gap-2">
              {showCreate ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                  </svg>
                  View Markets
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Market
                </>
              )}
            </span>
          </button>
        </div>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-accent-500/20 to-transparent" />
      </div>

      {showCreate ? (
        <CreateMarketForm onClose={() => setShowCreate(false)} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/10">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">Active Markets</p>
                <p className="text-2xl font-bold text-white mt-1">2</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">Total Staked</p>
                <p className="text-2xl font-bold text-white mt-1">$45,500</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-500/10">
                <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">Participants</p>
                <p className="text-2xl font-bold text-white mt-1">137</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
