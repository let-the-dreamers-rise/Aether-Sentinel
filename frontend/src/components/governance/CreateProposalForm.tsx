'use client';

import { useState } from 'react';
import { WorldIDVerify, WorldIDShield } from '@/components/shared/WorldIDVerify';
import type { ISuccessResult } from '@worldcoin/idkit';

interface CreateProposalFormProps {
  onClose: () => void;
}

export function CreateProposalForm({ onClose }: CreateProposalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetContract, setTargetContract] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleWorldIDSuccess = (proof: ISuccessResult) => {
    setVerified(true);
    console.log('World ID proof:', proof);
  };

  const handleSubmit = () => {
    if (!title || !description) return;
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div className="glass-card p-8 max-w-2xl animate-scale-in relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/10 ring-1 ring-brand-500/20">
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create Governance Proposal</h2>
            <p className="text-xs text-white/30 mt-0.5">Sybil-resistant on-chain governance</p>
          </div>
        </div>
        <WorldIDShield />
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Proposal title"
            className="input-field text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the proposal and its rationale..."
            rows={4}
            className="input-field text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">Target Contract Address</label>
          <input
            type="text"
            value={targetContract}
            onChange={(e) => setTargetContract(e.target.value)}
            placeholder="0x..."
            className="input-field text-sm font-mono"
          />
        </div>

        {verified && (
          <div className="rounded-xl bg-green-500/[0.06] border border-green-500/15 p-4 flex items-center gap-3 animate-slide-up">
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-300">Identity Verified</p>
              <p className="text-[11px] text-green-400/50">World ID proof of personhood confirmed</p>
            </div>
          </div>
        )}

        {!verified && (
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-brand-400/60 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-[12px] text-white/35 leading-relaxed">
              Click the button below to verify with World ID. This ensures one-person-one-vote governance.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <WorldIDVerify onVerified={handleWorldIDSuccess}>
            {({ open }) => (
              <button
                onClick={verified ? handleSubmit : open}
                disabled={isSubmitting || (verified && (!title || !description))}
                className="btn-primary flex-1 py-3.5"
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  )}
                  {verified ? (isSubmitting ? 'Submitting...' : 'Submit Proposal') : 'Verify & Create Proposal'}
                </span>
              </button>
            )}
          </WorldIDVerify>
          <button onClick={onClose} className="btn-secondary px-8">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
