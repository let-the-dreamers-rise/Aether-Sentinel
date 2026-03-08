# Tenderly Integration for AETHER SENTINEL

## Overview

This directory contains Tenderly integration scripts for simulating extreme market scenarios and validating system behavior before production deployment.

## Setup

### 1. Create Tenderly Account

1. Visit [https://tenderly.co](https://tenderly.co)
2. Sign up for a free account
3. Create a new project named "aether-sentinel"

### 2. Install Tenderly CLI

```bash
npm install -g @tenderly/cli
```

### 3. Login to Tenderly

```bash
tenderly login
```

### 4. Configure Project

```bash
tenderly init
# Select your project: aether-sentinel
```

### 5. Set Environment Variables

Create a `.env` file in this directory:

```
TENDERLY_ACCESS_TOKEN=your_access_token_here
TENDERLY_PROJECT_SLUG=aether-sentinel
TENDERLY_ACCOUNT_ID=your_account_id
TENDERLY_VIRTUAL_TESTNET_ID=your_testnet_id
```

## Virtual TestNet

Tenderly Virtual TestNets provide isolated blockchain forks for testing:

- **Unlimited transactions**: No gas costs
- **Time manipulation**: Fast-forward blockchain time
- **State manipulation**: Modify balances, storage, etc.
- **Transaction simulation**: Preview state changes
- **Debugging**: Step-through transaction execution

## Simulation Scenarios

### 1. Flash Crash Simulation
Tests system response to rapid 50% price drop over 5 minutes.

**Expected Behavior:**
- RiskGuardian detects elevated risk
- Emergency pause activated
- Reserve ratio maintained
- Response time < 60 seconds

**Run:**
```bash
npm run simulate:flash-crash
```

### 2. Liquidity Drain Attack
Tests system response to coordinated withdrawal attack.

**Expected Behavior:**
- AI engine detects abnormal pattern
- Withdrawal limits activated
- Reserve ratio maintained above minimum
- Attack mitigated without system failure

**Run:**
```bash
npm run simulate:liquidity-drain
```

### 3. Stablecoin Depeg Simulation
Tests system response to gradual stablecoin depeg ($1.00 → $0.85).

**Expected Behavior:**
- Reserve ratio recalculated correctly
- Liquidation auctions triggered
- System solvency maintained
- Collateral rebalanced

**Run:**
```bash
npm run simulate:stablecoin-depeg
```

## Monitoring and Alerts

Configure Tenderly alerts for:
- Failed transactions
- Gas usage spikes
- Contract state changes
- Event emissions

## Transaction Traces

All simulations generate detailed transaction traces:
- State changes
- Event logs
- Gas usage
- Call stack
- Storage modifications

Access traces at: `https://dashboard.tenderly.co/aether-sentinel/transactions`

## Deployment Validation

Before mainnet deployment:
1. Run all simulation scenarios
2. Verify all safeguards trigger correctly
3. Measure response times
4. Document results
5. Generate audit reports

## Resources

- [Tenderly Documentation](https://docs.tenderly.co/)
- [Virtual TestNets Guide](https://docs.tenderly.co/virtual-testnets)
- [Transaction Simulator](https://docs.tenderly.co/simulations-and-forks/simulation-api)
- [Web3 Actions](https://docs.tenderly.co/web3-actions)
