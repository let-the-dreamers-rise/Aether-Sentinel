# AETHER SENTINEL

**Autonomous AI-powered DeFi risk intelligence with Chainlink CRE workflows, on-chain safeguards, and human-verified governance.**

> Built for [Convergence: A Chainlink Hackathon](https://hack.chain.link/)

---

## What It Is

AETHER SENTINEL is an institutional-grade DeFi risk management platform that combines AI-driven risk analysis with autonomous on-chain safeguards. It uses **Chainlink Runtime Environment (CRE)** workflows to bridge blockchain state, external AI risk engines, and smart contract actions — creating a fully autonomous risk monitoring and response system.

**The core loop:**
1. CRE workflow reads vault state from the blockchain (Sepolia)
2. Sends it to an external AI risk engine for real-time assessment
3. If risk exceeds thresholds, the workflow autonomously triggers on-chain safeguards (emergency pause, reserve ratio adjustment, or emergency governance proposals)

## Problem It Solves

DeFi protocols lose billions annually to risk events that could be prevented with faster, smarter responses. Human operators can't monitor 24/7, react in seconds, or process complex multi-signal risk data. AETHER SENTINEL replaces slow human-in-the-loop monitoring with autonomous AI risk intelligence executed through Chainlink's decentralized infrastructure — while preserving human governance oversight through World ID-verified voting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CHAINLINK CRE WORKFLOWS                   │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │ Risk Monitoring       │    │ Market Resolution         │   │
│  │ Workflow              │    │ Workflow                   │   │
│  │                       │    │                            │   │
│  │ 1. EVMClient: Read    │    │ 1. EVMClient: Read markets │   │
│  │    vault state        │    │ 2. HTTPClient: Fetch       │   │
│  │ 2. HTTPClient: Call   │    │    price data (CoinGecko)  │   │
│  │    AI Risk Engine     │    │ 3. EVMClient: Settle       │   │
│  │ 3. EVMClient: Write   │    │    expired markets         │   │
│  │    risk response      │    │                            │   │
│  └──────────┬───────────┘    └────────────┬───────────────┘   │
└─────────────┼─────────────────────────────┼─────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SMART CONTRACTS (Sepolia)                  │
│                                                              │
│  TokenizedVault ◄──── RiskGuardian ────► GovernanceModule    │
│  (Deposits/Withdraws)  (AI Risk Gate)    (World ID Voting)   │
│                              │                               │
│                     PredictionMarket                         │
│                     (CRE-settled markets)                    │
│                                                              │
│  Oasis Sapphire (Confidential):                             │
│  ConfidentialRiskThresholds | PrivateLiquidationAuction     │
│  ConfidentialTreasuryManager                                │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND + AI ENGINE                        │
│                                                              │
│  Express.js API          FastAPI AI Risk Engine              │
│  (REST + WebSocket)      (scikit-learn, TF models)          │
│  PostgreSQL + Redis      Risk calculators + Anomaly detect  │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                      │
│                                                              │
│  Dashboard │ Vault │ Prediction Markets │ Governance         │
│  RainbowKit wallet │ Real-time WebSocket │ World ID         │
└─────────────────────────────────────────────────────────────┘
```

---

## Chainlink Usage

### CRE Workflows (Primary Integration)

| File | Description |
|------|-------------|
| [`cre-workflows/risk-monitoring-workflow/main.ts`](cre-workflows/risk-monitoring-workflow/main.ts) | **Core CRE workflow** — reads vault state via EVMClient, calls AI risk engine via HTTPClient, writes risk response on-chain |
| [`cre-workflows/market-resolution-workflow/main.ts`](cre-workflows/market-resolution-workflow/main.ts) | **Market resolution CRE workflow** — reads market state, fetches price data from CoinGecko API, settles expired prediction markets |
| [`cre-workflows/project.yaml`](cre-workflows/project.yaml) | CRE project configuration with Sepolia target |
| [`cre-workflows/risk-monitoring-workflow/workflow.yaml`](cre-workflows/risk-monitoring-workflow/workflow.yaml) | Risk workflow config (staging + production) |
| [`cre-workflows/market-resolution-workflow/workflow.yaml`](cre-workflows/market-resolution-workflow/workflow.yaml) | Market workflow config (staging + production) |

### Smart Contracts with CRE Authorization

| File | Description |
|------|-------------|
| [`contracts/RiskGuardian.sol`](contracts/RiskGuardian.sol) | Receives risk signals from authorized CRE workflows, executes safeguards (pause, adjust reserve, emergency governance) |
| [`contracts/GovernanceModule.sol`](contracts/GovernanceModule.sol) | `CRE_ROLE` for emergency proposals triggered by AI risk detection |
| [`contracts/PredictionMarket.sol`](contracts/PredictionMarket.sol) | `CRE_ROLE` for automated market settlement via CRE workflows |

### How CRE Integrates Blockchain + External Systems

**Risk Monitoring Workflow** (`cre-workflows/risk-monitoring-workflow/main.ts`):
- **Blockchain Read**: `EVMClient.callContract()` reads `TokenizedVault.getVaultState()` on Sepolia
- **External AI API**: `HTTPClient.sendRequest()` calls the AI Risk Engine (`POST /api/v1/assess-risk`) via DON consensus
- **Blockchain Write**: `EVMClient.writeReport()` calls `RiskGuardian.executeRiskResponse()` when risk score exceeds threshold

**Market Resolution Workflow** (`cre-workflows/market-resolution-workflow/main.ts`):
- **Blockchain Read**: `EVMClient.callContract()` reads `PredictionMarket.getMarket()` and `marketCount()` on Sepolia
- **External Data Source**: `HTTPClient.sendRequest()` fetches ETH price from CoinGecko API via DON consensus
- **Blockchain Write**: `EVMClient.writeReport()` calls `PredictionMarket.settleMarket()` for expired markets

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **CRE Workflows** | Chainlink CRE SDK (TypeScript), EVMClient, HTTPClient, CronCapability |
| **Smart Contracts** | Solidity 0.8.24, OpenZeppelin 5.x, Oasis Sapphire (confidential compute) |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, RainbowKit, Wagmi, Recharts |
| **Backend** | Express.js, TypeScript, PostgreSQL, Redis, Socket.IO |
| **AI Risk Engine** | Python FastAPI, scikit-learn, TensorFlow, pandas |
| **Identity** | World ID (sybil-resistant governance) |
| **Payments** | x402 HTTP Payment Protocol (Base Sepolia, micropayments for premium API access) |
| **Testing** | Hardhat, Tenderly simulations (flash crash, liquidity drain, stablecoin depeg) |

---

## How to Run

### Prerequisites

- **Node.js** >= 18
- **Bun** >= 1.2.21 (for CRE workflows)
- **Python** >= 3.10 (for AI engine)
- **CRE CLI** ([installation guide](https://docs.chain.link/cre/getting-started/cli-installation/macos-linux))

### 1. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 2. Backend API (Express)

```bash
cd backend
npm install
# Copy .env.example to .env and fill in values
npm run dev
# Starts at http://localhost:3001
```

### 3. AI Risk Engine (FastAPI)

```bash
cd ai-risk-engine
pip install -r requirements.txt
python main.py
# Starts at http://localhost:8000
```

### 4. Smart Contracts (Hardhat)

```bash
# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

### 5. CRE Workflow Simulation

```bash
cd cre-workflows

# Install dependencies
cd risk-monitoring-workflow && bun install && cd ..
cd market-resolution-workflow && bun install && cd ..

# Simulate the risk monitoring workflow
cre workflow simulate risk-monitoring-workflow --target staging-settings

# Simulate the market resolution workflow
cre workflow simulate market-resolution-workflow --target staging-settings
```

### Environment Variables

Copy `.env.example` files in `frontend/`, `backend/`, and `cre-workflows/` directories and fill in your values:

- `SEPOLIA_RPC_URL` - Sepolia RPC endpoint
- `PRIVATE_KEY` - Funded Sepolia wallet
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `CRE_ETH_PRIVATE_KEY` - Key for CRE workflow transactions

---

## Project Structure

```
AETHER SENTINEL/
├── cre-workflows/                    # Chainlink CRE Workflows
│   ├── project.yaml                  # Global CRE config
│   ├── secrets.yaml                  # Secret references
│   ├── risk-monitoring-workflow/     # Workflow A: AI risk monitoring
│   │   ├── main.ts                   # CRE SDK TypeScript workflow
│   │   ├── workflow.yaml             # Workflow config
│   │   └── config.staging.json       # Staging parameters
│   └── market-resolution-workflow/   # Workflow B: Market settlement
│       ├── main.ts                   # CRE SDK TypeScript workflow
│       ├── workflow.yaml             # Workflow config
│       └── config.staging.json       # Staging parameters
├── contracts/                        # Solidity smart contracts
│   ├── RiskGuardian.sol              # CRE-authorized risk safeguards
│   ├── TokenizedVault.sol            # ERC20 vault with risk gates
│   ├── PredictionMarket.sol          # CRE-settled prediction markets
│   ├── GovernanceModule.sol          # World ID governance + CRE emergency
│   └── confidential/                 # Oasis Sapphire contracts
├── frontend/                         # Next.js 14 dashboard
├── backend/                          # Express.js API server
├── ai-risk-engine/                   # Python FastAPI AI risk engine
├── test/                             # Hardhat test suite
├── scripts/                          # Deployment scripts
└── tenderly/                         # Tenderly stress test simulations
```

---

## License

MIT
