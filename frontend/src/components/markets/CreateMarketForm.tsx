'use client';

import { useState } from 'react';
import { WorldIDVerify, WorldIDShield } from '@/components/shared/WorldIDVerify';
import type { ISuccessResult } from '@worldcoin/idkit';

interface CreateMarketFormProps {
  onClose: () => void;
}

export function CreateMarketForm({ onClose }: CreateMarketFormProps) {
  const [question, setQuestion] = useState('');
  const [outcomes, setOutcomes] = useState(['', '']);
  const [duration, setDuration] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  const addOutcome = () => {
    if (outcomes.length < 10) setOutcomes([...outcomes, '']);
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length > 2) setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const updateOutcome = (index: number, value: string) => {
    const updated = [...outcomes];
    updated[index] = value;
    setOutcomes(updated);
  };

  const handleWorldIDSuccess = (proof: ISuccessResult) => {
    setVerified(true);
    console.log('World ID proof:', proof);
  };

  const handleSubmit = () => {
    if (!question || outcomes.some(o => !o)) return;
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
            <h2 className="text-lg font-bold text-white">Create Prediction Market</h2>
            <p className="text-xs text-white/30 mt-0.5">Decentralized risk prediction</p>
          </div>
        </div>
        <WorldIDShield />
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Will ETH reach $5,000 by end of Q2?"
            className="input-field text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">Outcomes</label>
          <div className="space-y-2">
            {outcomes.map((outcome, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex items-center justify-center w-8 h-10 rounded-lg bg-white/[0.03] text-[11px] font-mono text-white/20 flex-shrink-0">
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  placeholder={`Outcome ${i + 1}`}
                  className="input-field text-sm flex-1"
                />
                {outcomes.length > 2 && (
                  <button
                    onClick={() => removeOutcome(i)}
                    className="px-3 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors border border-red-500/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {outcomes.length < 10 && (
              <button
                onClick={addOutcome}
                className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1.5 mt-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Outcome
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">Duration (days)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="30"
            className="input-field text-sm w-32"
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

        <div className="flex gap-3 pt-4">
          <WorldIDVerify onVerified={handleWorldIDSuccess}>
            {({ open }) => (
              <button
                onClick={verified ? handleSubmit : open}
                disabled={isSubmitting || (verified && (!question || outcomes.some(o => !o)))}
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
                  {verified ? (isSubmitting ? 'Creating...' : 'Create Market') : 'Verify & Create Market'}
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
