'use client';

import { useState, useEffect } from 'react';
import { RiskScoreCard } from '@/components/dashboard/RiskScoreCard';
import { ReserveRatioCard } from '@/components/dashboard/ReserveRatioCard';
import { TVLCard } from '@/components/dashboard/TVLCard';
import { RiskHistoryChart } from '@/components/dashboard/RiskHistoryChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { useRiskPolling } from '@/hooks/useRiskPolling';
import { useRiskStore } from '@/store/riskStore';
import { cn, getRiskLevel } from '@/lib/utils';

export default function DashboardPage() {
  useRiskPolling();
  const { currentRisk, isLoading } = useRiskStore();
  const level = getRiskLevel(currentRisk?.risk_score ?? 0);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => setCurrentTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-glow-pulse" />
                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">Live Monitoring</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/15">
                <svg className="w-3 h-3 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span className="text-[10px] font-bold text-accent-300 uppercase tracking-wider">CRE Autonomous</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold gradient-text-hero tracking-tight leading-[1.1]">
              Risk Dashboard
            </h1>
            <p className="text-[13px] text-white/25 mt-3 max-w-xl leading-relaxed">
              Real-time AI risk intelligence with autonomous Chainlink CRE workflows,
              on-chain monitoring, and World ID verified governance.
            </p>
          </div>

          {/* System Status Pill */}
          <div className={cn(
            'flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-500 self-start',
            level === 'low' ? 'bg-emerald-500/[0.06] border-emerald-500/15' :
              level === 'moderate' ? 'bg-amber-500/[0.06] border-amber-500/15' :
                level === 'elevated' ? 'bg-orange-500/[0.06] border-orange-500/15' :
                  'bg-rose-500/[0.08] border-rose-500/20 animate-pulse-slow'
          )}>
            <div className="relative">
              <div className={cn('h-3 w-3 rounded-full',
                level === 'low' ? 'bg-emerald-400' :
                  level === 'moderate' ? 'bg-amber-400' :
                    level === 'elevated' ? 'bg-orange-400' : 'bg-rose-400'
              )} />
              <div className={cn('absolute inset-0 h-3 w-3 rounded-full animate-ping opacity-40',
                level === 'low' ? 'bg-emerald-400' :
                  level === 'moderate' ? 'bg-amber-400' :
                    level === 'elevated' ? 'bg-orange-400' : 'bg-rose-400'
              )} />
            </div>
            <div>
              <span className={cn('text-sm font-bold',
                level === 'low' ? 'text-emerald-300' :
                  level === 'moderate' ? 'text-amber-300' :
                    level === 'elevated' ? 'text-orange-300' : 'text-rose-300'
              )}>
                {isLoading ? 'Scanning...' : `System ${level === 'low' ? 'Nominal' : level === 'critical' ? 'Critical' : 'Active'}`}
              </span>
              <p className="text-[10px] text-white/20 mt-0.5 font-mono tabular-nums">
                {currentTime}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative gradient line */}
        <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="animate-slide-up">
          <RiskScoreCard />
        </div>
        <div className="animate-slide-up-delay-1">
          <ReserveRatioCard />
        </div>
        <div className="animate-slide-up-delay-2">
          <TVLCard />
        </div>
      </div>

      {/* Chart + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-slide-up-delay-1">
          <RiskHistoryChart />
        </div>
        <div className="animate-slide-up-delay-2">
          <SystemStatus />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="animate-slide-up-delay-3">
        <RecentActivity />
      </div>
    </div>
  );
}
