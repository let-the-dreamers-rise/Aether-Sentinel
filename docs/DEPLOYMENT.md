# AETHER SENTINEL Deployment Guide

## Prerequisites

1. Node.js and npm installed
2. Hardhat configured
3. Sepolia testnet RPC URL
4. Private key with Sepolia ETH
5. Etherscan API key for verification

## Environment Setup

Create a `.env` file in the project root:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Steps

### 1. Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

This will deploy all contracts in the following order:
- MockWorldID (for testing)
- MockERC20 (underlying asset)
- TokenizedVault
- RiskGuardian
- PredictionMarket
- GovernanceModule

### 2. Verify Contracts on Etherscan

After deployment, verify each contract:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example for TokenizedVault:
```bash
npx hardhat verify --network sepolia 0x... 0xUNDERLYING_ASSET 2000 0xADMIN_ADDRESS
```

### 3. Configure Contract Interactions

After deployment, configure the following:

1. **Grant Roles**:
   - Grant RISK_GUARDIAN_ROLE on TokenizedVault to RiskGuardian
   - Grant CRE_ROLE on GovernanceModule to CRE workflow addresses
   - Grant ORACLE_ROLE on GovernanceModule to World ID oracle

2. **Whitelist Targets**:
   - Whitelist TokenizedVault in GovernanceModule
   - Whitelist RiskGuardian in GovernanceModule
   - Whitelist PredictionMarket in GovernanceModule

3. **Authorize Resolvers**:
   - Authorize CRE workflow address as resolver in PredictionMarket

4. **Configure Parameters**:
   - Set totalVerifiedHumans in GovernanceModule
   - Configure risk thresholds in RiskGuardian
   - Set platform fees in PredictionMarket

## Post-Deployment Checklist

- [ ] All contracts deployed successfully
- [ ] All contracts verified on Etherscan
- [ ] Roles and permissions configured
- [ ] Target contracts whitelisted
- [ ] Parameters set correctly
- [ ] Test transactions executed successfully
- [ ] Documentation updated with contract addresses

## Contract Addresses (Sepolia)

Update this section after deployment:

```
MockWorldID: 0x...
MockERC20: 0x...
TokenizedVault: 0x...
RiskGuardian: 0x...
PredictionMarket: 0x...
GovernanceModule: 0x...
```

## Troubleshooting

### Deployment Fails

- Check account has sufficient Sepolia ETH
- Verify RPC URL is correct
- Check gas price settings

### Verification Fails

- Ensure constructor arguments match deployment
- Check Etherscan API key is valid
- Wait a few minutes after deployment before verifying

### Role Assignment Fails

- Verify deployer has ADMIN_ROLE
- Check contract addresses are correct
- Ensure contracts are initialized

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Multi-sig**: Use multi-sig wallet for guardian role in production
3. **Timelock**: Consider adding timelock for critical operations
4. **Audit**: Complete security audit before mainnet deployment
5. **Monitoring**: Set up monitoring and alerting for all contracts

## Mainnet Deployment

For mainnet deployment:

1. Replace MockWorldID with real World ID contract
2. Use real USDC or other stablecoin as underlying asset
3. Configure production guardian multi-sig
4. Set appropriate risk thresholds
5. Complete security audit
6. Set up monitoring and incident response
7. Prepare emergency procedures

## Support

For deployment issues, contact the development team or refer to the technical documentation.
