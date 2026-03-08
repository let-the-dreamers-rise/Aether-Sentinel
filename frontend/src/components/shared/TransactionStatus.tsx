'use client';

interface TransactionStatusProps {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
}

export function TransactionStatus({ hash, status, message }: TransactionStatusProps) {
  if (status === 'idle') return null;

  const config = {
    pending: {
      bg: 'bg-yellow-500/[0.06] border-yellow-500/15',
      text: 'text-yellow-300/80',
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
      label: 'Transaction Pending...',
    },
    success: {
      bg: 'bg-green-500/[0.06] border-green-500/15',
      text: 'text-green-300/80',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Transaction Confirmed',
    },
    error: {
      bg: 'bg-red-500/[0.06] border-red-500/15',
      text: 'text-red-300/80',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: message || 'Transaction Failed',
    },
  };

  const c = config[status];

  return (
    <div className={`rounded-xl border p-4 ${c.bg} animate-scale-in`}>
      <div className={`flex items-center gap-2.5 ${c.text}`}>
        {c.icon}
        <span className="text-sm font-medium">{c.label}</span>
      </div>
      {hash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View on Etherscan
        </a>
      )}
    </div>
  );
}
