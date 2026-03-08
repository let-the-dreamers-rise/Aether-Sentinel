'use client';

import { IDKitWidget, VerificationLevel, type ISuccessResult } from '@worldcoin/idkit';
import { useState, type ReactNode } from 'react';

interface WorldIDVerifyProps {
  onVerified: (proof: ISuccessResult) => void;
  children: (props: { open: () => void; isVerified: boolean }) => ReactNode;
  actionDescription?: string;
}

export function WorldIDVerify({ onVerified, children, actionDescription }: WorldIDVerifyProps) {
  const [isVerified, setIsVerified] = useState(false);

  const handleSuccess = (result: ISuccessResult) => {
    setIsVerified(true);
    onVerified(result);
  };

  const appId = process.env.NEXT_PUBLIC_WORLD_ID_APP_ID as `app_${string}`;
  const actionId = process.env.NEXT_PUBLIC_WORLD_ID_ACTION_ID!;

  if (!appId || appId === 'app_staging_demo') {
    return children({ open: () => setIsVerified(true), isVerified });
  }

  return (
    <IDKitWidget
      app_id={appId}
      action={actionId}
      onSuccess={handleSuccess}
      verification_level={VerificationLevel.Device}
    >
      {({ open }: { open: () => void }) => children({ open, isVerified })}
    </IDKitWidget>
  );
}

export function WorldIDShield({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-black to-zinc-800 flex items-center justify-center ring-1 ring-white/10">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-2h-2v2zm1-10c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 .88-.58 1.27-1.29 1.8C12.08 12.67 12 13.64 12 14h2c0-.55.36-.98.97-1.4C15.65 12.12 16 11.63 16 10c0-2.21-1.79-4-4-4z" />
          </svg>
        </div>
        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-surface-1" />
      </div>
      <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">World ID Protected</span>
    </div>
  );
}
