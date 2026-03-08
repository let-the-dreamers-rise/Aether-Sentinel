'use client';

import { useState } from 'react';
import { useVaultStore } from '@/store/vaultStore';
import { cn, getRiskLevel, getRiskColor } from '@/lib/utils';

interface PremiumRiskData {
    premium: boolean;
    x402_payment: string;
    risk_score: number;
    recommended_action: string;
    confidence: number;
    reasoning: string;
    timestamp: string;
    components: {
        reserve_ratio: number;
        volatility: number;
        liquidity: number;
        withdrawal_anomaly: number;
    };
    scenarios: Array<{
        name: string;
        probability: number;
        projected_score: number;
        description: string;
        timeframe: string;
    }>;
    mitigations: Array<{
        strategy: string;
        priority: string;
        estimated_impact: string;
        description: string;
    }>;
    analysis_duration_ms: number;
    model_version: string;
}

export default function PremiumPage() {
    const { vaultState } = useVaultStore();
    const [premiumData, setPremiumData] = useState<PremiumRiskData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'requesting' | 'paid' | 'error'>('idle');
    const [demoMode, setDemoMode] = useState(false);

    const fetchPremiumAssessment = async () => {
        setIsLoading(true);
        setError(null);
        setPaymentStatus('requesting');

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const vaultInput = {
                reserve_ratio: vaultState ? parseInt(vaultState.reserveRatio || '10000', 10) / 10000 : 0.85,
                total_deposits: vaultState ? parseFloat(vaultState.totalDeposits || '1000000') : 1000000,
                total_liabilities: vaultState ? parseFloat(vaultState.totalLiabilities || '850000') : 850000,
                timestamp: new Date().toISOString(),
            };

            const endpoint = demoMode
                ? `${backendUrl}/api/risk-assessment/premium/demo`
                : `${backendUrl}/api/risk-assessment/premium`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vault_state: vaultInput }),
            });

            if (res.status === 402) {
                // x402 payment required — show payment flow
                setPaymentStatus('idle');
                setError('Payment required — x402 payment gate active. Use an x402-compatible client to pay $0.001 USDC on Base Sepolia.');
                setIsLoading(false);
                return;
            }

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const data = await res.json();
            setPremiumData(data);
            setPaymentStatus('paid');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch premium assessment');
            setPaymentStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const level = premiumData ? getRiskLevel(premiumData.risk_score) : 'low';
    const color = premiumData ? getRiskColor(premiumData.risk_score) : '#10b981';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="relative py-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Premium</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">x402 Paywall</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold gradient-text-hero tracking-tight leading-[1.1]">
                            Premium Analysis
                        </h1>
                        <p className="text-[13px] text-white/25 mt-3 max-w-xl leading-relaxed">
                            Deep AI risk assessment with scenario modeling, mitigation strategies,
                            and predictive forecasts — powered by x402 micropayments on Base Sepolia.
                        </p>
                    </div>

                    {/* Price & Payment */}
                    <div className="flex flex-col items-start md:items-end gap-3">
                        <div className="px-5 py-3.5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.06]">
                            <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Price per analysis</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-amber-300">$0.001</span>
                                <span className="text-xs text-white/30">USDC</span>
                            </div>
                            <p className="text-[10px] text-white/15 mt-1">Base Sepolia • x402 Protocol</p>
                        </div>
                        <button
                            onClick={fetchPremiumAssessment}
                            disabled={isLoading}
                            className={cn(
                                'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300',
                                isLoading
                                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                    : demoMode
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                            )}
                        >
                            {isLoading ? 'Analyzing...' : demoMode ? 'Run Demo Analysis' : paymentStatus === 'paid' ? 'Run Again' : 'Run Premium Analysis'}
                        </button>
                        <button
                            onClick={() => { setDemoMode(!demoMode); setError(null); setPremiumData(null); setPaymentStatus('idle'); }}
                            className={cn(
                                'px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border',
                                demoMode
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/50'
                            )}
                        >
                            {demoMode ? '✓ Demo Mode ON' : 'Demo Mode'}
                        </button>
                    </div>
                </div>
                <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            </div>

            {/* Error / Payment Status */}
            {error && (
                <div className={cn(
                    'glass-card p-5 border',
                    paymentStatus === 'idle'
                        ? 'border-amber-500/20 bg-amber-500/[0.05]'
                        : 'border-rose-500/20 bg-rose-500/[0.05]'
                )}>
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-300">x402 Payment Required</p>
                            <p className="text-xs text-white/40 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Results */}
            {premiumData && (
                <div className="space-y-4">
                    {/* Top Row — Score + Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Risk Score */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Premium Risk Score</h3>
                                <span className="badge" style={{ backgroundColor: `${color}15`, color }}>{level}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold" style={{ color }}>{premiumData.risk_score}</span>
                                <span className="text-lg text-white/20">/100</span>
                            </div>
                            <p className="text-xs text-white/30 mt-2">Action: <span className="font-semibold text-white/60">{premiumData.recommended_action}</span></p>
                            <p className="text-xs text-white/30 mt-1">Confidence: <span className="font-mono text-white/50">{(premiumData.confidence * 100).toFixed(1)}%</span></p>
                        </div>

                        {/* Components */}
                        <div className="glass-card p-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Risk Components</h3>
                            <div className="space-y-3">
                                {Object.entries(premiumData.components).map(([key, value]) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs text-white/40 capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-xs font-mono text-white/60">{value}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${value}%`,
                                                    background: `linear-gradient(90deg, ${getRiskColor(value)}, ${getRiskColor(value)}88)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="glass-card p-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Analysis Metadata</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between"><span className="text-xs text-white/30">Model</span><span className="text-xs font-mono text-brand-400">{premiumData.model_version}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-white/30">Duration</span><span className="text-xs font-mono text-white/50">{premiumData.analysis_duration_ms}ms</span></div>
                                <div className="flex justify-between"><span className="text-xs text-white/30">Payment</span><span className="text-xs font-mono text-emerald-400">{premiumData.x402_payment}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-white/30">Premium</span><span className="text-xs font-mono text-amber-400">{premiumData.premium ? 'Yes' : 'No'}</span></div>
                                <div className="flex justify-between"><span className="text-xs text-white/30">Timestamp</span><span className="text-xs font-mono text-white/40">{new Date(premiumData.timestamp).toLocaleTimeString()}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Reasoning */}
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">AI Reasoning</h3>
                        <p className="text-sm text-white/60 leading-relaxed">{premiumData.reasoning}</p>
                    </div>

                    {/* Scenario Modeling */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                            </svg>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Scenario Analysis</h3>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 uppercase">Premium Only</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {premiumData.scenarios.map((scenario, i) => {
                                const sColor = getRiskColor(scenario.projected_score);
                                return (
                                    <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-white/70">{scenario.name}</span>
                                            <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sColor}15`, color: sColor }}>
                                                {scenario.projected_score}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/35 mb-2">{scenario.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-white/20">Probability: {(scenario.probability * 100).toFixed(0)}%</span>
                                            <span className="text-[10px] text-white/20">Timeframe: {scenario.timeframe}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mitigation Strategies */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Risk Mitigation Strategies</h3>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 uppercase">Premium Only</span>
                        </div>
                        <div className="space-y-3">
                            {premiumData.mitigations.map((m, i) => (
                                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-white/70">{m.strategy}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                                                m.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' :
                                                    m.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' :
                                                        'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                                            )}>
                                                {m.priority}
                                            </span>
                                            <span className="text-xs font-mono text-emerald-400">{m.estimated_impact}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/35">{m.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!premiumData && !error && (
                <div className="glass-card p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/15 mb-5">
                        <svg className="w-8 h-8 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white/60 mb-2">Premium AI Risk Analysis</h3>
                    <p className="text-sm text-white/25 max-w-md mx-auto mb-6">
                        Get deep scenario modeling, risk mitigation strategies, and predictive forecasts.
                        Powered by x402 micropayments — pay $0.001 USDC per analysis on Base Sepolia.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-white/20 uppercase tracking-wider">
                        <span>4 Risk Scenarios</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>3 Mitigation Strategies</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>Predictive Forecasts</span>
                    </div>
                </div>
            )}

            {/* x402 Protocol Info */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/25">About x402</h3>
                </div>
                <p className="text-xs text-white/20 leading-relaxed">
                    x402 is an open, internet-native payment standard built on HTTP 402.
                    It enables AI agents and humans to pay for API access with crypto micropayments —
                    zero accounts, zero friction, zero protocol fees. Payments settle instantly on Base Sepolia.
                </p>
                <div className="flex items-center gap-4 mt-3">
                    <span className="text-[10px] font-mono text-brand-400/50">Network: Base Sepolia (eip155:84532)</span>
                    <span className="text-[10px] font-mono text-white/15">|</span>
                    <span className="text-[10px] font-mono text-white/15">Facilitator: x402.org</span>
                </div>
            </div>
        </div>
    );
}
