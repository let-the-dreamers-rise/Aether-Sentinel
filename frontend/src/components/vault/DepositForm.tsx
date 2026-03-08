'use client';

import { useState } from 'react';
import { TransactionStatus } from '@/components/shared/TransactionStatus';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setTxStatus('pending');

    try {
      await new Promise((r) => setTimeout(r, 2000));
      setTxHash('0x' + Math.random().toString(16).slice(2, 66));
      setTxStatus('success');
      setAmount('');
    } catch {
      setTxStatus('error');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">
          Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input-field text-lg font-mono pr-20"
          />
          <button
            onClick={() => setAmount('1000')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/[0.06] text-brand-400 hover:bg-white/[0.1] transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">You will receive</span>
          <span className="text-sm font-mono text-white/60">{amount ? `~${amount} vTokens` : '--'}</span>
        </div>
        <div className="border-t border-white/[0.04]" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Exchange Rate</span>
          <span className="text-sm font-mono text-white/60">1 USDC = 1 vToken</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Network Fee</span>
          <span className="text-sm font-mono text-white/40">~0.001 ETH</span>
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={!amount || txStatus === 'pending'}
        className="btn-primary w-full py-3.5"
      >
        {txStatus === 'pending' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Depositing...
          </span>
        ) : 'Deposit'}
      </button>

      <TransactionStatus hash={txHash} status={txStatus} message={txStatus === 'error' ? 'Deposit failed. Please try again.' : undefined} />
    </div>
  );
}
