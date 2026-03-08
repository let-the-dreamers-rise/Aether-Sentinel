import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        risk: {
          low: '#10b981',
          moderate: '#f59e0b',
          elevated: '#f97316',
          critical: '#f43f5e',
        },
        surface: {
          0: '#050A18',
          1: '#0B1228',
          2: '#111B36',
          3: '#1A2744',
          4: '#243352',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 20s ease-in-out infinite',
        'float-delay': 'float 25s ease-in-out 5s infinite reverse',
        'float-slow': 'float 30s ease-in-out 10s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up-delay-1': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        'slide-up-delay-2': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
        'slide-up-delay-3': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        'fade-in': 'fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='20' cy='20' r='0.8'/%3E%3C/g%3E%3C/svg%3E")`,
      },
      boxShadow: {
        'glow-cyan': '0 0 60px -12px rgba(14, 165, 233, 0.3)',
        'glow-purple': '0 0 60px -12px rgba(168, 85, 247, 0.3)',
        'glow-green': '0 0 60px -12px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 60px -12px rgba(244, 63, 94, 0.3)',
        'glow-amber': '0 0 60px -12px rgba(245, 158, 11, 0.3)',
        'card': '0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 4px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.15)',
        'card-hover': '0 0 0 1px rgba(255,255,255,0.08) inset, 0 8px 40px rgba(0,0,0,0.3), 0 0 80px -20px rgba(14,165,233,0.08)',
        'nav': '0 0 0 1px rgba(255,255,255,0.05) inset, 0 4px 30px rgba(0,0,0,0.4)',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
    },
  },
  plugins: [],
};

export default config;
