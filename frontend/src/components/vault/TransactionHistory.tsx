'use client';

const mockHistory = [
  { type: 'Deposit', amount: '1,000 USDC', tokens: '1,000 vTokens', time: '2h ago', hash: '0x1a2b...3c4d' },
  { type: 'Withdraw', amount: '500 USDC', tokens: '500 vTokens', time: '5h ago', hash: '0x5e6f...7g8h' },
  { type: 'Deposit', amount: '2,500 USDC', tokens: '2,500 vTokens', time: '1d ago', hash: '0x9i0j...1k2l' },
];

export function TransactionHistory() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded-lg bg-white/[0.04]">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Transaction History</h3>
      </div>
      <div className="space-y-2">
        {mockHistory.map((tx, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                tx.type === 'Deposit' ? 'bg-green-500/10' : 'bg-orange-500/10'
              }`}>
                {tx.type === 'Deposit' ? (
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-[13px] font-semibold text-white/80">{tx.type}</span>
                <p className="text-[11px] font-mono text-white/20 mt-0.5">{tx.hash}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[13px] font-mono font-semibold text-white/70">{tx.amount}</span>
              <p className="text-[11px] text-white/20 mt-0.5">{tx.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
