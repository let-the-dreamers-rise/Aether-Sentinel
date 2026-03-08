'use client';

import { useState } from 'react';
import { TransactionStatus } from '@/components/shared/TransactionStatus';

export function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');

  const handleWithdraw = async () => {
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
          Vault Tokens to Burn
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
            onClick={() => setAmount('500')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/[0.06] text-orange-400 hover:bg-white/[0.1] transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">You will receive</span>
          <span className="text-sm font-mono text-white/60">{amount ? `~${amount} USDC` : '--'}</span>
        </div>
        <div className="border-t border-white/[0.04]" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Reserve impact</span>
          <span className="text-sm font-mono text-yellow-400/60">May reduce reserve</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">Network Fee</span>
          <span className="text-sm font-mono text-white/40">~0.001 ETH</span>
        </div>
      </div>

      <div className="rounded-xl bg-yellow-500/[0.04] border border-yellow-500/10 p-3">
        <p className="text-[11px] text-yellow-300/60 leading-relaxed">
          Large withdrawals may trigger an AI risk assessment. If the reserve ratio drops below 20%, withdrawals may be temporarily paused.
        </p>
      </div>

      <button
        onClick={handleWithdraw}
        disabled={!amount || txStatus === 'pending'}
        className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {txStatus === 'pending' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Withdrawing...
          </span>
        ) : 'Withdraw'}
      </button>

      <TransactionStatus hash={txHash} status={txStatus} message={txStatus === 'error' ? 'Withdrawal failed. Please try again.' : undefined} />
    </div>
  );
}
