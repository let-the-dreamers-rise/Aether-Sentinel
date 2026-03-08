'use client';

import { useRiskStore } from '@/store/riskStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getRiskColor } from '@/lib/utils';

export function RiskHistoryChart() {
  const { riskHistory } = useRiskStore();

  const chartData = riskHistory
    .slice(0, 48)
    .reverse()
    .map((r, i) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: r.risk_score,
      confidence: Math.round(r.confidence * 100),
      index: i,
    }));

  if (chartData.length === 0) {
    chartData.push(
      { time: '-20m', score: 36, confidence: 78, index: 0 },
      { time: '-15m', score: 42, confidence: 68, index: 1 },
      { time: '-10m', score: 38, confidence: 72, index: 2 },
      { time: '-5m', score: 32, confidence: 80, index: 3 },
      { time: 'Now', score: 35, confidence: 75, index: 4 },
    );
  }

  const latestScore = chartData[chartData.length - 1]?.score ?? 0;
  const latestColor = getRiskColor(latestScore);

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-white/[0.04]">
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Risk Score History</h3>
          </div>
          <p className="text-[11px] text-white/20 ml-9">24-hour rolling window</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full" style={{ backgroundColor: latestColor, opacity: 0.6 }} />
            <span className="text-[11px] text-white/30">Risk Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full bg-brand-400/40" />
            <span className="text-[11px] text-white/30">Confidence</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={latestColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={latestColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,10,16,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                padding: '10px 14px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
              itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="confidence"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              strokeOpacity={0.4}
              fillOpacity={1}
              fill="url(#confidenceGradient)"
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={latestColor}
              fillOpacity={1}
              fill="url(#riskGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: latestColor, fill: '#050508' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
