import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

export function formatBasisPoints(bp: number | string): string {
  const num = typeof bp === 'string' ? parseInt(bp, 10) : bp;
  return `${(num / 100).toFixed(1)}%`;
}

export function getRiskLevel(score: number): 'low' | 'moderate' | 'elevated' | 'critical' {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'elevated';
  if (score >= 40) return 'moderate';
  return 'low';
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  const colors = {
    low: '#10b981',
    moderate: '#f59e0b',
    elevated: '#f97316',
    critical: '#f43f5e',
  };
  return colors[level];
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function timeAgo(timestamp: string | number): string {
  const now = Date.now();
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp * 1000;
  const diff = now - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
