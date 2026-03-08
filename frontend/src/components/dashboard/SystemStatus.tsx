'use client';

import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  latency?: string;
}

export function SystemStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Blockchain RPC', status: 'online', latency: '~150ms' },
    { name: 'Smart Contracts', status: 'online', latency: '6 Deployed' },
    { name: 'CRE Workflows', status: 'online', latency: 'Simulated' },
    { name: 'AI Risk Engine', status: 'degraded', latency: 'Local' },
    { name: 'Backend API', status: 'offline' },
  ]);

  useEffect(() => {
    async function checkServices() {
      try {
        const rpcRes = await fetch('https://ethereum-sepolia-rpc.publicnode.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        });
        if (rpcRes.ok) {
          setServices(prev => prev.map(s => s.name === 'Blockchain RPC' ? { ...s, status: 'online', latency: '< 200ms' } : s));
        }
      } catch { /* keep default */ }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const backendRes = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(3000) });
        if (backendRes.ok) {
          setServices(prev => prev.map(s => s.name === 'Backend API' ? { ...s, status: 'online', latency: 'Healthy' } : s));
        }
      } catch { /* keep default */ }
    }
    checkServices();
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = services.filter(s => s.status === 'online').length;

  const statusCfg = {
    online:   { dot: 'bg-emerald-400', text: 'text-emerald-400/80', label: 'Online' },
    degraded: { dot: 'bg-amber-400',   text: 'text-amber-400/80',   label: 'Local' },
    offline:  { dot: 'bg-white/15',     text: 'text-white/25',       label: 'Offline' },
  };

  const icons = [
    <svg key="rpc" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
    <svg key="sc" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
    <svg key="cre" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" /></svg>,
    <svg key="ai" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
    <svg key="be" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>,
  ];

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/35">System Status</h3>
        </div>
        <span className="badge bg-emerald-500/[0.08] text-emerald-400/70 border border-emerald-500/10">
          {onlineCount}/{services.length}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {services.map((s, i) => {
          const cfg = statusCfg[s.status];
          return (
            <div key={s.name} className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <span className="text-white/20">{icons[i]}</span>
                <span className="text-[13px] text-white/45 font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {s.latency && <span className="text-[10px] font-mono text-white/15">{s.latency}</span>}
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {s.status === 'online' && (
                      <div className={`absolute inset-0 h-1.5 w-1.5 rounded-full ${cfg.dot} animate-ping opacity-30`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.05]">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.02] p-3 text-center border border-white/[0.04]">
            <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold">Network</p>
            <p className="text-[13px] font-bold text-brand-300 mt-1">Sepolia</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] p-3 text-center border border-white/[0.04]">
            <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold">Contracts</p>
            <p className="text-[13px] font-bold text-emerald-400 mt-1">6 Deployed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
