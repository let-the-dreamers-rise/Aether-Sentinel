'use client';

interface ProposalProps {
  proposal: {
    id: number;
    title: string;
    description: string;
    proposer: string;
    status: 'Active' | 'Succeeded' | 'Defeated' | 'Executed' | 'Cancelled';
    votesFor: number;
    votesAgainst: number;
    votingEndTime: number;
    isEmergency: boolean;
    riskScore?: number;
    quorumReached: boolean;
  };
}

export function ProposalCard({ proposal }: ProposalProps) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;

  const timeLeft = proposal.votingEndTime - Date.now();
  const daysLeft = Math.max(0, Math.floor(timeLeft / 86400000));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % 86400000) / 3600000));
  const isActive = proposal.status === 'Active' && timeLeft > 0;

  const statusColors = {
    Active: 'bg-green-500/10 text-green-400',
    Succeeded: 'bg-blue-500/10 text-blue-400',
    Defeated: 'bg-red-500/10 text-red-400',
    Executed: 'bg-purple-500/10 text-purple-400',
    Cancelled: 'bg-white/[0.04] text-white/30',
  };

  return (
    <div className={`glass-card-hover p-6 ${proposal.isEmergency ? 'border-red-500/20' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${statusColors[proposal.status]}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${
              proposal.status === 'Active' ? 'bg-green-500 animate-glow-pulse' : 'bg-current opacity-50'
            }`} />
            {proposal.status}
          </span>
          {proposal.isEmergency && (
            <span className="badge bg-red-500/10 text-red-400 animate-pulse">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              EMERGENCY
            </span>
          )}
          {proposal.quorumReached && (
            <span className="badge bg-brand-500/10 text-brand-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Quorum Met
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-white/20">#{proposal.id}</span>
      </div>

      <h3 className="text-[15px] font-semibold mb-2 text-white/85">{proposal.title}</h3>
      <p className="text-sm text-white/35 mb-5 leading-relaxed">{proposal.description}</p>

      {proposal.riskScore && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/[0.05] border border-red-500/10 flex items-center gap-3">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span className="text-xs text-red-300/80 font-medium">
            AI Risk Score: <span className="font-bold">{proposal.riskScore}/100</span> — triggered this emergency proposal
          </span>
        </div>
      )}

      {/* Voting bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-green-400/70 font-medium">For: {proposal.votesFor}</span>
          <span className="text-xs text-white/20 font-mono">{forPercentage.toFixed(0)}% / {(100 - forPercentage).toFixed(0)}%</span>
          <span className="text-red-400/70 font-medium">Against: {proposal.votesAgainst}</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 rounded-l-full"
            style={{ width: `${forPercentage}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 rounded-r-full"
            style={{ width: `${100 - forPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <span className="text-xs text-white/20 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          {proposal.proposer}
        </span>
        {isActive ? (
          <div className="flex gap-2">
            <button className="px-5 py-2 rounded-xl bg-green-500/10 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all duration-300 border border-green-500/10">
              Vote For
            </button>
            <button className="px-5 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all duration-300 border border-red-500/10">
              Vote Against
            </button>
          </div>
        ) : (
          <span className="text-xs text-white/20 font-mono">
            {timeLeft > 0 ? `${daysLeft}d ${hoursLeft}h remaining` : 'Voting ended'}
          </span>
        )}
      </div>
    </div>
  );
}
