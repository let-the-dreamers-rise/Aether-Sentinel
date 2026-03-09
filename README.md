# ⚡ AETHER SENTINEL

**Autonomous AI-powered DeFi risk intelligence with Chainlink CRE workflows, x402 micropayments, and World ID governance.**

> Built for [Convergence: A Chainlink Hackathon](https://hack.chain.link/)

---

## 🔍 What It Is

AETHER SENTINEL is an institutional-grade DeFi risk management platform that combines AI-driven risk analysis with autonomous on-chain safeguards. It uses **Chainlink Runtime Environment (CRE)** workflows to bridge blockchain state, external AI risk engines, and smart contract actions — creating a fully autonomous risk monitoring and response system.

**The core loop:**
1. CRE workflow reads vault state from the blockchain (Sepolia)
2. Sends it to an external AI risk engine for real-time assessment via DON consensus
3. If risk exceeds thresholds, the workflow autonomously triggers on-chain safeguards (emergency pause, reserve ratio adjustment, or emergency governance proposals)

## 🚨 Problem It Solves

DeFi protocols lose **billions** annually to risk events that could be prevented with faster, smarter responses. Human operators can't monitor 24/7, react in seconds, or process complex multi-signal risk data. AETHER SENTINEL replaces slow human-in-the-loop monitoring with **autonomous AI risk intelligence** executed through Chainlink's decentralized infrastructure — while preserving human governance oversight through World ID-verified voting.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CHAINLINK CRE WORKFLOWS                  │
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ Risk Monitoring Workflow │  │ Market Resolution        │ │
│  │                          │  │ Workflow                  │ │
│  │ 1. EVMClient: Read       │  │ 1. EVMClient: Read       │ │
│  │    vault state           │  │    market state           │ │
│  │ 2. HTTPClient: Call      │  │ 2. HTTPClient: Fetch     │ │
│  │    AI Risk Engine (DON)  │  │    CoinGecko price (DON) │ │
│  │ 3. EVMClient: Write      │  │ 3. EVMClient: Settle     │ │
│  │    risk response         │  │    expired markets        │ │
│  └──────────┬───────────────┘  └────────────┬─────────────┘ │
└─────────────┼───────────────────────────────┼───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│              SMART CONTRACTS (Sepolia Testnet)               │
│                                                             │
│  TokenizedVault ◄──── RiskGuardian ────► GovernanceModule   │
│  (ERC20 Vault)        (CRE_ROLE)         (World ID + CRE)  │
│                            │                                │
│                     PredictionMarket                        │
│                     (CRE-settled markets)                   │
│                                                             │
│  Oasis Sapphire (Confidential Compute):                     │
│  ConfidentialRiskThresholds │ PrivateLiquidationAuction     │
│  ConfidentialTreasuryManager                                │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│            BACKEND API (Express.js + TypeScript)            │
│                                                             │
│  REST API + WebSocket    │  x402 Payment Middleware         │
│  Real-time risk updates  │  Premium endpoint paywall        │
│  Blockchain RPC bridge   │  $0.001 USDC on Base Sepolia     │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│               FRONTEND (Next.js 14 + React 18)              │
│                                                             │
│  Dashboard │ Vault │ Markets │ Governance │ Premium (x402)  │
│  RainbowKit │ Real-time WebSocket │ World ID verification   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Chainlink CRE Usage

### CRE Workflows (Primary Integration)

| File | Description |
|------|-------------|
| [`risk-monitoring-workflow/main.ts`](cre-workflows/risk-monitoring-workflow/main.ts) | **Core CRE workflow** — reads vault state via `EVMClient.callContract()`, calls AI risk engine via `HTTPClient.sendRequest()` through DON consensus, writes risk response on-chain via `EVMClient.writeReport()` to RiskGuardian |
| [`market-resolution-workflow/main.ts`](cre-workflows/market-resolution-workflow/main.ts) | **Market resolution CRE workflow** — reads market state via EVMClient, fetches ETH price from CoinGecko via HTTPClient through DON consensus, auto-settles expired prediction markets on-chain |
| [`project.yaml`](cre-workflows/project.yaml) | CRE project configuration targeting Sepolia |
| [`risk-monitoring-workflow/workflow.yaml`](cre-workflows/risk-monitoring-workflow/workflow.yaml) | Risk workflow config (staging + production) |
| [`market-resolution-workflow/workflow.yaml`](cre-workflows/market-resolution-workflow/workflow.yaml) | Market workflow config (staging + production) |

### How CRE Integrates Blockchain + External Systems

**Risk Monitoring Workflow** (238 lines):
```
EVMClient.callContract()      →  Reads TokenizedVault.getVaultState() on Sepolia
HTTPClient.sendRequest()      →  Calls AI Risk Engine POST /api/v1/assess-risk (DON consensus)
consensusMedianAggregation()  →  Multiple nodes agree on risk score
EVMClient.writeReport()       →  Calls RiskGuardian.executeRiskResponse() when score ≥ threshold
```

**Market Resolution Workflow** (252 lines):
```
EVMClient.callContract()      →  Reads PredictionMarket.getMarket() + marketCount()
HTTPClient.sendRequest()      →  Fetches CoinGecko ETH price (DON consensus)
EVMClient.writeReport()       →  Calls PredictionMarket.settleMarket() for expired markets
```

### CRE SDK Features Used

| Feature | Usage |
|---------|-------|
| `EVMClient` | Read vault state, market state; write risk responses, settle markets |
| `HTTPClient` | Call AI risk engine API, fetch CoinGecko price data |
| `CronCapability` | Scheduled workflow triggers |
| `consensusMedianAggregation` | DON consensus on AI risk scores and price data |
| `runtime.report()` | ECDSA-signed, keccak256-hashed reports for on-chain delivery |
| `encodeCallMsg` / `LAST_FINALIZED_BLOCK_NUMBER` | Safe blockchain reads from finalized blocks |

### Smart Contracts with CRE Authorization

| Contract | CRE Integration |
|----------|-----------------|
| [`RiskGuardian.sol`](contracts/RiskGuardian.sol) | Receives risk signals from CRE workflows, executes safeguards (pause, adjust reserve, emergency governance) |
| [`GovernanceModule.sol`](contracts/GovernanceModule.sol) | `CRE_ROLE` for emergency proposals triggered by AI risk detection |
| [`PredictionMarket.sol`](contracts/PredictionMarket.sol) | `CRE_ROLE` for automated market settlement via CRE workflows |

---

## 💎 x402 Payment Protocol

Premium AI risk intelligence is monetized via the **x402 HTTP payment standard** — crypto micropayments native to HTTP.

| Feature | Detail |
|---------|--------|
| **Network** | Base Sepolia (`eip155:84532`) |
| **Price** | $0.001 USDC per premium analysis |
| **Facilitator** | `x402.org` |
| **Implementation** | [`backend/src/middleware/x402.ts`](backend/src/middleware/x402.ts) |

**Paywalled Endpoints:**
- `POST /api/risk-assessment/premium` — Deep 4-factor risk analysis with scenario modeling ($0.001)
- `GET /api/risk-assessment/premium/history` — Trend analysis with predictive forecasts ($0.0005)

**What Premium Includes:**
- 4-factor composite risk score (reserve ratio, volatility, liquidity, withdrawal anomaly)
- 4 scenario analyses (Base Case, Stress Test, Optimistic, Black Swan)
- 3 mitigation strategies with priority levels and estimated impact
- Predictive forecasts (1h, 6h, 24h)

---

## 🛡️ World ID Integration

Sybil-resistant governance ensuring one-person-one-vote on risk proposals.

- **Verification**: World ID `app_523260fe09d4c837d1549b0093e239f8`
- **Action**: `verify-human`
- **Smart Contract**: GovernanceModule requires World ID verification before voting
- **AI + Human Loop**: CRE workflow detects risk → creates emergency proposal → World ID-verified humans vote

---

## 🔒 Oasis Sapphire (Confidential Compute)

Three confidential smart contracts deployed on Oasis Sapphire for encrypted on-chain computation:

| Contract | Purpose |
|----------|---------|
| [`ConfidentialRiskThresholds.sol`](contracts/confidential/ConfidentialRiskThresholds.sol) | Encrypted risk thresholds — prevents front-running of safeguard triggers |
| [`PrivateLiquidationAuction.sol`](contracts/confidential/PrivateLiquidationAuction.sol) | Sealed-bid liquidation auctions for MEV protection |
| [`ConfidentialTreasuryManager.sol`](contracts/confidential/ConfidentialTreasuryManager.sol) | Private treasury operations and fund allocation |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **CRE Workflows** | Chainlink CRE SDK (TypeScript), EVMClient, HTTPClient, CronCapability, DON consensus |
| **Smart Contracts** | Solidity 0.8.24, OpenZeppelin 5.x, Oasis Sapphire |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, RainbowKit, Wagmi, Zustand |
| **Backend** | Express.js, TypeScript, Socket.IO, ethers.js |
| **AI Risk Engine** | Python FastAPI, scikit-learn, TensorFlow, pandas |
| **Payments** | x402 HTTP Payment Protocol (@x402/express, @x402/evm, @x402/core) on Base Sepolia |
| **Identity** | World ID (sybil-resistant governance) |
| **Confidential** | Oasis Sapphire (encrypted risk thresholds, private auctions, treasury) |
| **Testing** | Hardhat, Tenderly simulations (flash crash, liquidity drain, stablecoin depeg) |

---

## 🚀 How to Run

### Prerequisites

- **Node.js** >= 18
- **Bun** >= 1.2.21 (for CRE workflows)
- **Python** >= 3.10 (for AI engine, optional)

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
npx tsx src/index.ts
# Starts at http://localhost:3001
```

### 3. AI Risk Engine (FastAPI) — Optional

```bash
cd ai-risk-engine
pip install -r requirements.txt
python main.py
# Starts at http://localhost:8000
# (Backend has local fallback if AI engine is unavailable)
```

### 4. Smart Contracts (Hardhat)

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

### 5. CRE Workflow Simulation

```bash
cd cre-workflows

# Install dependencies
cd risk-monitoring-workflow && bun install && cd ..
cd market-resolution-workflow && bun install && cd ..

# Simulate workflows
cre workflow simulate risk-monitoring-workflow --target staging-settings
cre workflow simulate market-resolution-workflow --target staging-settings
```

---

## 📁 Project Structure

```
AETHER SENTINEL/
├── cre-workflows/                        # Chainlink CRE Workflows
│   ├── project.yaml                      # Global CRE config (Sepolia)
│   ├── secrets.yaml                      # Secret references
│   ├── risk-monitoring-workflow/          # Workflow A: AI risk monitor
│   │   ├── main.ts                       # EVMClient → HTTPClient → EVMClient
│   │   ├── workflow.yaml                 # Workflow config
│   │   └── config.staging.json           # Staging parameters
│   └── market-resolution-workflow/        # Workflow B: Market settlement
│       ├── main.ts                       # EVMClient → HTTPClient → EVMClient
│       ├── workflow.yaml                 # Workflow config
│       └── config.staging.json           # Staging parameters
├── contracts/                            # Solidity smart contracts
│   ├── RiskGuardian.sol                  # CRE-authorized risk safeguards
│   ├── TokenizedVault.sol                # ERC20 vault with risk gates
│   ├── PredictionMarket.sol              # CRE-settled prediction markets
│   ├── GovernanceModule.sol              # World ID + CRE emergency governance
│   └── confidential/                     # Oasis Sapphire contracts
│       ├── ConfidentialRiskThresholds.sol
│       ├── PrivateLiquidationAuction.sol
│       └── ConfidentialTreasuryManager.sol
├── frontend/                             # Next.js 14 dashboard
│   └── src/
│       ├── app/                          # Pages: /, /vault, /markets, /governance, /premium
│       ├── components/                   # UI components (vault, markets, governance)
│       ├── hooks/                        # useRiskPolling (real-time data)
│       ├── store/                        # Zustand stores (risk, vault)
│       └── lib/                          # API, utils, wagmi config, socket
├── backend/                              # Express.js API server
│   └── src/
│       ├── middleware/x402.ts            # x402 payment middleware
│       ├── routes/                       # health, risk, worldId, blockchain
│       └── services/                     # blockchain, riskEngine
├── ai-risk-engine/                       # Python FastAPI risk engine
├── test/                                 # Hardhat test suite
├── scripts/                              # Deployment scripts
└── tenderly/                             # Tenderly stress test simulations
```

---

## 🏆 Hackathon Tracks

| Track | Integration |
|-------|-------------|
| **Chainlink CRE** | 2 CRE workflows with EVMClient + HTTPClient + DON consensus |
| **Coinbase / Base** | x402 HTTP Payment Protocol on Base Sepolia |
| **Worldcoin** | World ID sybil-resistant governance |
| **Oasis** | Sapphire confidential smart contracts |

---
