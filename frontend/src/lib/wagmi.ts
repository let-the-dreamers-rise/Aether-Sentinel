'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'AETHER SENTINEL',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [sepolia, mainnet],
  ssr: true,
});
