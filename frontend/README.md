# AETHER SENTINEL Frontend

Next.js 14 frontend application for AETHER SENTINEL with App Router, RainbowKit, World ID, and real-time updates.

## Features

- Risk Dashboard with real-time monitoring
- Vault Operations (Deposit/Withdraw)
- Prediction Markets
- Governance Voting
- World ID Integration
- Wallet Connection (RainbowKit)
- Real-time WebSocket Updates

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3001](http://localhost:3001) with your browser.

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_WORLD_ID_APP_ID=your_app_id
NEXT_PUBLIC_WORLD_ID_ACTION_ID=your_action_id
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Risk dashboard
│   ├── vault/             # Vault operations
│   ├── markets/           # Prediction markets
│   ├── governance/        # Governance voting
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── vault/             # Vault components
│   ├── markets/           # Market components
│   ├── governance/        # Governance components
│   └── shared/            # Shared components
├── lib/                   # Utilities
│   ├── wagmi.ts          # Wagmi configuration
│   ├── api.ts            # API client
│   └── socket.ts         # WebSocket client
└── store/                 # Zustand stores
```

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- RainbowKit + Wagmi (Wallet Connection)
- World ID SDK (Identity Verification)
- Socket.IO (Real-time Updates)
- Zustand (State Management)
- React Query (Data Fetching)
- Recharts (Data Visualization)
