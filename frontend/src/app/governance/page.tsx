'use client';

import { useState } from 'react';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { CreateProposalForm } from '@/components/governance/CreateProposalForm';

const mockProposals = [
  {
    id: 0,
    title: 'Adjust minimum reserve ratio to 25%',
    description: 'Proposal to increase the minimum reserve ratio from 20% to 25% for better risk protection.',
    proposer: '0x1234...abcd',
    status: 'Active' as const,
    votesFor: 12,
    votesAgainst: 3,
    votingEndTime: Date.now() + 5 * 86400000,
    isEmergency: false,
    quorumReached: false,
  },
  {
    id: 1,
    title: 'EMERGENCY: Increase monitoring frequency',
    description: 'AI detected elevated risk patterns. Proposing to increase CRE monitoring from 15min to 5min intervals.',
    proposer: 'CRE Workflow',
    status: 'Active' as const,
    votesFor: 25,
    votesAgainst: 2,
    votingEndTime: Date.now() + 86400000,
    isEmergency: true,
    riskScore: 92,
    quorumReached: true,
  },
  {
    id: 2,
    title: 'Add new collateral asset type',
    description: 'Proposal to support DAI as an additional collateral asset in the vault.',
    proposer: '0x5678...efgh',
    status: 'Executed' as const,
    votesFor: 45,
    votesAgainst: 8,
    votingEndTime: Date.now() - 2 * 86400000,
    isEmergency: false,
    quorumReached: true,
  },
];

export default function GovernancePage() {
  const [showCreate, setShowCreate] = useState(false);
  const activeCount = mockProposals.filter((p) => p.status === 'Active').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">World ID Verified</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/15">
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">{activeCount} Active</span>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold gradient-text-hero tracking-tight">
              Governance
            </h1>
            <p className="text-[13px] text-white/25 mt-3 max-w-lg leading-relaxed">
              On-chain proposals and voting with AI-triggered emergency powers and World ID sybil resistance.
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                  View Proposals
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Proposal
                </>
              )}
            </span>
          </button>
        </div>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </div>

      {showCreate ? (
        <CreateProposalForm onClose={() => setShowCreate(false)} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">Active</p>
                <p className="text-2xl font-bold text-white mt-1">{activeCount}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-500/10">
                <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">Total Proposals</p>
                <p className="text-2xl font-bold text-white mt-1">{mockProposals.length}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/10">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">Emergency</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{mockProposals.filter((p) => p.isEmergency).length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {mockProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
