'use client';

import { useRiskStore } from '@/store/riskStore';
import { getRiskColor, getRiskLevel, timeAgo } from '@/lib/utils';

export function RecentActivity() {
  const { riskHistory } = useRiskStore();

  const activities = riskHistory.slice(0, 8).map((r, i) => ({
    id: i,
    type: r.recommended_action,
    score: r.risk_score,
    reasoning: r.reasoning,
    timestamp: r.timestamp,
    confidence: r.confidence,
  }));

  if (activities.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Recent Activity</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.02] mb-4">
            <svg className="w-8 h-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-white/20 mb-1">No activity yet</p>
          <p className="text-xs text-white/10">Risk assessments will appear here as they stream in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Recent Activity</h3>
        </div>
        <span className="text-[11px] text-white/20">{activities.length} events</span>
      </div>

      <div className="space-y-2">
        {activities.map((a, idx) => (
          <div
            key={a.id}
            className="group flex items-center gap-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-all duration-300"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getRiskColor(a.score) }}
              />
              <div
                className="absolute inset-0 h-2.5 w-2.5 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: getRiskColor(a.score) }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white/80">{a.type}</span>
                <span
                  className="badge text-[9px]"
                  style={{
                    backgroundColor: `${getRiskColor(a.score)}10`,
                    color: getRiskColor(a.score),
                  }}
                >
                  {getRiskLevel(a.score)}
                </span>
              </div>
              <p className="text-[11px] text-white/25 truncate mt-0.5 max-w-md">{a.reasoning}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-mono font-bold" style={{ color: getRiskColor(a.score) }}>
                {a.score}
              </span>
              <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(a.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
