'use client';

import { useState } from 'react';
import { DepositForm } from '@/components/vault/DepositForm';
import { WithdrawForm } from '@/components/vault/WithdrawForm';
import { VaultInfo } from '@/components/vault/VaultInfo';
import { TransactionHistory } from '@/components/vault/TransactionHistory';

export default function VaultPage() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
            <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9" />
            </svg>
            <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">Risk-Gated</span>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold gradient-text-hero tracking-tight">
          Vault Operations
        </h1>
        <p className="text-[13px] text-white/25 mt-3 max-w-lg leading-relaxed">
          Deposit and withdraw assets with World ID verification and AI risk-gated safeguards.
        </p>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card overflow-hidden">
            <div className="flex border-b border-white/[0.06]">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`relative flex-1 px-5 py-4 text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'deposit' ? 'text-brand-300' : 'text-white/30 hover:text-white/50'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
                  </svg>
                  Deposit
                </span>
                {activeTab === 'deposit' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-400 to-accent-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`relative flex-1 px-5 py-4 text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'withdraw' ? 'text-orange-300' : 'text-white/30 hover:text-white/50'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
                  </svg>
                  Withdraw
                </span>
                {activeTab === 'withdraw' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-rose-500" />
                )}
              </button>
            </div>
            <div className="p-6">
              {activeTab === 'deposit' ? <DepositForm /> : <WithdrawForm />}
            </div>
          </div>
          <TransactionHistory />
        </div>
        <VaultInfo />
      </div>
    </div>
  );
}
