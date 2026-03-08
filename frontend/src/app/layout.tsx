import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmergencyBanner } from '@/components/shared/EmergencyBanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AETHER SENTINEL | AI-Powered DeFi Risk Intelligence',
  description: 'Institutional-grade AI-powered DeFi risk management with human-verified governance and autonomous safeguards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <Providers>
          {/* Aurora Background */}
          <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="aurora-orb-1" />
            <div className="aurora-orb-2" />
            <div className="aurora-orb-3" />
            <div className="grid-overlay" />
          </div>

          {/* App Shell */}
          <div className="relative z-10 min-h-screen">
            <Sidebar />
            <EmergencyBanner />
            <main className="pt-[92px] px-4 sm:px-6 lg:px-8 pb-16">
              <div className="max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
