# AETHER SENTINEL - Testnet Deployment Guide

This guide covers the complete deployment process for AETHER SENTINEL on Sepolia testnet.

## Prerequisites

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```bash
# Sepolia RPC URL (get from Infura, Alchemy, or public RPC)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployer private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# World ID configuration (testnet)
WORLD_ID_APP_ID=your_world_id_app_id
WORLD_ID_ACTION=aether-sentinel

# Backend configuration
DATABASE_URL=postgresql://user:password@localhost:5432/aether_sentinel_staging
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_staging

# AI Risk Engine
AI_ENGINE_URL=https://staging-ai.aether-sentinel.io
AI_ENGINE_API_KEY=your_ai_engine_api_key_staging
```

### 3. Fund Deployer Account

Get Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

Minimum required: **0.5 ETH** (for deployment + gas)

---

## Deployment Steps

### Step 1: Deploy Smart Contracts to Sepolia

```bash
# Compile contracts
npx hardhat compile

# Run deployment script
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

**Expected Output:**
```
============================================================
AETHER SENTINEL - Sepolia Testnet Deployment
============================================================

Network: sepolia
Chain ID: 11155111
Deployer: 0x...
Balance: 1.5 ETH

📝 Step 1: Deploying MockWorldID...
✅ MockWorldID: 0x...

📝 Step 2: Deploying MockERC20 (USDC)...
✅ MockERC20 (USDC): 0x...

📝 Step 3: Deploying TokenizedVault...
✅ TokenizedVault: 0x...
   Initialized with 20% minimum reserve ratio

📝 Step 4: Deploying RiskGuardian...
✅ RiskGuardian: 0x...
   Initialized with vault and admin

📝 Step 5: Deploying PredictionMarket...
✅ PredictionMarket: 0x...
   Initialized with 0.01 ETH minimum stake, 2% platform fee

📝 Step 6: Deploying GovernanceModule...
✅ GovernanceModule: 0x...
   Initialized with 40% quorum, 7-day voting period

📝 Step 7: Configuring roles and permissions...
✅ Granted RISK_GUARDIAN_ROLE to RiskGuardian
✅ Whitelisted TokenizedVault in GovernanceModule
✅ Authorized deployer as PredictionMarket resolver
✅ Updated RiskGuardian governance address

📄 Deployment info saved to: deployments/sepolia.json

✅ Deployment completed successfully!
```

**Deployment addresses saved to:** `deployments/sepolia.json`

### Step 2: Verify Contracts on Etherscan

```bash
# Verify TokenizedVault
npx hardhat verify --network sepolia <VAULT_ADDRESS>

# Verify RiskGuardian
npx hardhat verify --network sepolia <RISK_GUARDIAN_ADDRESS>

# Verify PredictionMarket
npx hardhat verify --network sepolia <PREDICTION_MARKET_ADDRESS>

# Verify GovernanceModule
npx hardhat verify --network sepolia <GOVERNANCE_ADDRESS>
```

**Verification Script (automated):**
```bash
# Create verification script
node scripts/verify-sepolia.js
```

### Step 3: Configure CRE Workflows

Update CRE workflow configurations with deployed contract addresses:

```bash
# Edit workflow files
vim cre-workflows/workflow-a-risk-monitoring.yaml
vim cre-workflows/workflow-b-market-resolution.yaml
vim cre-workflows/workflow-c-emergency-governance.yaml
```

**Update contract addresses in workflows:**
```yaml
# workflow-a-risk-monitoring.yaml
steps:
  - name: fetch_vault_state
    type: blockchain_read
    config:
      contract_address: "<VAULT_ADDRESS_FROM_DEPLOYMENT>"  # Update this
      network: "sepolia"
```

### Step 4: Deploy AI Risk Engine to Staging

```bash
cd ai-risk-engine

# Build Docker image
docker build -t aether-sentinel-ai:staging .

# Push to container registry
docker tag aether-sentinel-ai:staging gcr.io/your-project/aether-sentinel-ai:staging
docker push gcr.io/your-project/aether-sentinel-ai:staging

# Deploy to staging environment (example: Google Cloud Run)
gcloud run deploy aether-sentinel-ai \
  --image gcr.io/your-project/aether-sentinel-ai:staging \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated=false \
  --set-env-vars="MODEL_PATH=/app/models,LOG_LEVEL=INFO"
```

**Verify AI Engine:**
```bash
curl -X GET https://staging-ai.aether-sentinel.io/health
# Expected: {"status": "healthy", "version": "1.0.0"}
```

### Step 5: Deploy Backend to Staging

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run database migrations
npm run migrate:staging

# Deploy to staging (example: Heroku)
git push heroku-staging main

# Or deploy to Cloud Run
gcloud run deploy aether-sentinel-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated=false \
  --set-env-vars="NODE_ENV=staging,DATABASE_URL=$DATABASE_URL,REDIS_URL=$REDIS_URL"
```

**Update backend environment with contract addresses:**
```bash
# Set environment variables
heroku config:set VAULT_ADDRESS=<VAULT_ADDRESS> --app aether-sentinel-staging
heroku config:set RISK_GUARDIAN_ADDRESS=<RISK_GUARDIAN_ADDRESS> --app aether-sentinel-staging
heroku config:set PREDICTION_MARKET_ADDRESS=<PREDICTION_MARKET_ADDRESS> --app aether-sentinel-staging
heroku config:set GOVERNANCE_ADDRESS=<GOVERNANCE_ADDRESS> --app aether-sentinel-staging
heroku config:set SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL --app aether-sentinel-staging
```

**Verify Backend:**
```bash
curl -X GET https://staging-api.aether-sentinel.io/health
# Expected: {"status": "ok", "timestamp": "..."}
```

### Step 6: Deploy Frontend to Staging

```bash
cd frontend

# Install dependencies
npm install

# Create staging environment file
cat > .env.staging <<EOF
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_VAULT_ADDRESS=<VAULT_ADDRESS>
NEXT_PUBLIC_RISK_GUARDIAN_ADDRESS=<RISK_GUARDIAN_ADDRESS>
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=<PREDICTION_MARKET_ADDRESS>
NEXT_PUBLIC_GOVERNANCE_ADDRESS=<GOVERNANCE_ADDRESS>
NEXT_PUBLIC_BACKEND_URL=https://staging-api.aether-sentinel.io
NEXT_PUBLIC_WORLD_ID_APP_ID=$WORLD_ID_APP_ID
NEXT_PUBLIC_WORLD_ID_ACTION=aether-sentinel
EOF

# Build for staging
npm run build

# Deploy to Vercel (staging)
vercel --prod --env-file .env.staging

# Or deploy to Netlify
netlify deploy --prod --dir=.next
```

**Verify Frontend:**
- Visit: https://staging.aether-sentinel.io
- Check wallet connection
- Verify contract addresses in browser console

### Step 7: Run Integration Test Suite

```bash
# Update test configuration with deployed addresses
export VAULT_ADDRESS=<VAULT_ADDRESS>
export RISK_GUARDIAN_ADDRESS=<RISK_GUARDIAN_ADDRESS>
export PREDICTION_MARKET_ADDRESS=<PREDICTION_MARKET_ADDRESS>
export GOVERNANCE_ADDRESS=<GOVERNANCE_ADDRESS>
export SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL

# Run integration tests
npm run test:integration:sepolia

# Run end-to-end tests
npm run test:e2e:sepolia
```

**Test Checklist:**
- [ ] TokenizedVault deposit/withdraw
- [ ] RiskGuardian risk response execution
- [ ] PredictionMarket creation and participation
- [ ] GovernanceModule proposal and voting
- [ ] World ID verification flow
- [ ] Backend API endpoints
- [ ] Frontend wallet connection
- [ ] Real-time dashboard updates

### Step 8: User Acceptance Testing (UAT)

**UAT Test Plan:**

1. **Vault Operations**
   - [ ] Connect wallet to staging frontend
   - [ ] Deposit mock USDC into vault
   - [ ] View vault balance and reserve ratio
   - [ ] Withdraw from vault
   - [ ] Verify transaction history

2. **Prediction Markets**
   - [ ] Create a new prediction market
   - [ ] Participate in market with World ID verification
   - [ ] View market details and odds
   - [ ] Settle market (as resolver)
   - [ ] Claim winnings

3. **Governance**
   - [ ] Create a governance proposal
   - [ ] Vote on proposal with World ID verification
   - [ ] View proposal status and vote count
   - [ ] Execute passed proposal

4. **Risk Monitoring**
   - [ ] View risk dashboard
   - [ ] Monitor risk score updates
   - [ ] Verify real-time WebSocket updates
   - [ ] Test emergency banner display

5. **World ID Integration**
   - [ ] Complete World ID verification
   - [ ] Verify nullifier tracking
   - [ ] Test double-participation prevention

**UAT Participants:**
- Internal team members
- Beta testers (5-10 users)
- Security reviewers

**UAT Duration:** 1-2 weeks

**UAT Feedback Collection:**
- Google Form: https://forms.gle/...
- Discord channel: #uat-feedback
- GitHub Issues: Label "UAT"

---

## Post-Deployment Checklist

### Monitoring Setup

- [ ] Configure Grafana dashboards for metrics
- [ ] Setup Sentry for error tracking
- [ ] Configure log aggregation (Datadog/CloudWatch)
- [ ] Setup uptime monitoring (UptimeRobot/Pingdom)
- [ ] Configure alerting (PagerDuty/Opsgenie)

### Security Verification

- [ ] Verify all contract roles assigned correctly
- [ ] Test emergency pause functionality
- [ ] Verify rate limiting on backend
- [ ] Test World ID nullifier tracking
- [ ] Review Etherscan contract code

### Documentation

- [ ] Update README with testnet addresses
- [ ] Document known issues and limitations
- [ ] Create user guide for testnet
- [ ] Prepare incident response runbook

---

## Troubleshooting

### Deployment Fails

**Error: Insufficient funds**
```
Solution: Fund deployer account with more Sepolia ETH
```

**Error: Contract already deployed**
```
Solution: Use a different deployer account or redeploy with --reset flag
```

**Error: Nonce too low**
```
Solution: Reset nonce in MetaMask or wait for pending transactions
```

### Verification Fails

**Error: Contract source code already verified**
```
Solution: Skip verification, contract is already verified
```

**Error: Bytecode mismatch**
```
Solution: Ensure compiler settings match deployment (check hardhat.config.ts)
```

### Backend Connection Issues

**Error: Cannot connect to database**
```
Solution: Verify DATABASE_URL and ensure PostgreSQL is running
```

**Error: Redis connection refused**
```
Solution: Verify REDIS_URL and ensure Redis is running
```

### Frontend Issues

**Error: Wrong network**
```
Solution: Switch MetaMask to Sepolia testnet (Chain ID: 11155111)
```

**Error: Contract not found**
```
Solution: Verify contract addresses in .env.staging match deployment
```

---

## Rollback Procedure

If deployment fails or critical issues are discovered:

1. **Stop all services**
   ```bash
   # Stop backend
   heroku ps:scale web=0 --app aether-sentinel-staging
   
   # Stop frontend (Vercel)
   vercel rollback
   ```

2. **Revert to previous deployment**
   ```bash
   # Use previous deployment addresses
   cp deployments/sepolia-backup.json deployments/sepolia.json
   ```

3. **Notify users**
   - Post status update on Discord/Twitter
   - Update status page

4. **Investigate and fix issues**
   - Review logs and error reports
   - Fix identified issues
   - Test fixes locally

5. **Redeploy**
   - Follow deployment steps again
   - Run full test suite before UAT

---

## Support

For deployment issues:
- **Discord**: #deployment-support
- **Email**: devops@aether-sentinel.io
- **On-call**: +1-XXX-XXX-XXXX

---

## Appendix

### Useful Commands

```bash
# Check contract balance
cast balance <CONTRACT_ADDRESS> --rpc-url $SEPOLIA_RPC_URL

# Call contract function
cast call <CONTRACT_ADDRESS> "getVaultState()" --rpc-url $SEPOLIA_RPC_URL

# Send transaction
cast send <CONTRACT_ADDRESS> "deposit(uint256)" 1000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

# Get transaction receipt
cast receipt <TX_HASH> --rpc-url $SEPOLIA_RPC_URL

# Monitor contract events
cast logs --address <CONTRACT_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
```

### Network Information

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/...
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucets**: 
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia

### Contract ABIs

Contract ABIs are available in:
- `artifacts/contracts/` (after compilation)
- `deployments/sepolia.json` (deployment info)
- Frontend: `frontend/src/abis/`

---

**Last Updated**: 2024
**Version**: 1.0.0
