# Oasis Sapphire Development Environment

## Overview

This project uses Oasis Sapphire for confidential compute operations. Sapphire is an EVM-compatible confidential smart contract platform that provides privacy-preserving execution using Trusted Execution Environments (TEEs).

## Network Configuration

### Sapphire Testnet
- **RPC URL**: https://testnet.sapphire.oasis.io
- **Chain ID**: 0x5aff (23295)
- **Explorer**: https://testnet.explorer.sapphire.oasis.io
- **Faucet**: https://faucet.testnet.oasis.io

### Sapphire Mainnet
- **RPC URL**: https://sapphire.oasis.io
- **Chain ID**: 0x5afe (23294)
- **Explorer**: https://explorer.sapphire.oasis.io

## Getting Started

### 1. Install Dependencies

```bash
npm install --save-dev @oasisprotocol/sapphire-contracts @oasisprotocol/sapphire-hardhat
```

### 2. Configure Environment Variables

Create a `.env` file with:

```
PRIVATE_KEY=your_private_key_here
SAPPHIRE_TESTNET_RPC=https://testnet.sapphire.oasis.io
```

### 3. Get Testnet Tokens

Visit the faucet: https://faucet.testnet.oasis.io

### 4. Deploy to Sapphire Testnet

```bash
npx hardhat run scripts/deploy-sapphire.ts --network sapphireTestnet
```

## Confidential Contracts

The following contracts are deployed on Oasis Sapphire:

1. **PrivateLiquidationAuction.sol** - Private liquidation auctions with encrypted bids
2. **ConfidentialRiskThresholds.sol** - Hidden AI risk thresholds
3. **ConfidentialTreasuryManager.sol** - Private treasury operations

## Key Features

### Encrypted State
- Use `Sapphire.encrypt()` to encrypt data before storing
- Use `Sapphire.decrypt()` to decrypt data in TEE

### World ID Integration
- All confidential contracts support World ID verification
- Prevents sybil attacks while maintaining privacy

### Cross-Chain Bridge
- Sapphire contracts can communicate with Ethereum mainnet
- Settlement occurs on mainnet for transparency

## Testing

Run tests on local Hardhat network with Sapphire simulation:

```bash
npx hardhat test test/confidential/*.test.ts
```

## Security Considerations

1. **TEE Guarantees**: Code execution is protected from node operators
2. **Encrypted Storage**: Sensitive data encrypted at rest
3. **Privacy Leakage**: Be careful with event emissions and public state
4. **Gas Costs**: Confidential operations cost more gas than regular EVM

## Resources

- [Sapphire Documentation](https://docs.oasis.io/dapp/sapphire/)
- [Sapphire Contracts](https://github.com/oasisprotocol/sapphire-paratime/tree/main/contracts)
- [Example Projects](https://github.com/oasisprotocol/sapphire-paratime/tree/main/examples)
