import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { config } from '../config';
import { logger } from '../utils/logger';

// Contract ABIs (simplified - import full ABIs in production)
const TOKENIZED_VAULT_ABI = [
  'function getVaultState() view returns (tuple(uint256 reserveRatio, uint256 totalDeposits, uint256 totalLiabilities, bool paused, uint256 lastUpdate))',
  'function deposit(uint256 amount) returns (uint256)',
  'function withdraw(uint256 vaultTokenAmount) returns (uint256)',
  'event Deposit(address indexed user, uint256 amount, uint256 vaultTokens, uint256 reserveRatio, uint256 timestamp)',
  'event Withdrawal(address indexed user, uint256 vaultTokens, uint256 assetsReturned, uint256 reserveRatio, uint256 timestamp)',
];

const RISK_GUARDIAN_ABI = [
  'function executeRiskResponse(uint256 riskScore, string action, uint256 confidence, string reasoning)',
  'event RiskResponseExecuted(uint256 indexed riskScore, string action, uint256 confidence, address triggeredBy, uint256 timestamp)',
];

const PREDICTION_MARKET_ABI = [
  'function getMarket(uint256 marketId) view returns (tuple(uint256 marketId, address creator, string question, uint256 endTime, uint8 status, uint256 totalStake))',
  'event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime)',
  'event MarketSettled(uint256 indexed marketId, uint256 winningOutcome, string resolutionData, uint256 timestamp)',
];

const GOVERNANCE_MODULE_ABI = [
  'function getProposal(uint256 proposalId) view returns (tuple(uint256 proposalId, address proposer, string title, uint256 votingEndTime, uint8 status, uint256 votesFor, uint256 votesAgainst))',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 votingEndTime)',
  'event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 timestamp)',
];

let provider: JsonRpcProvider;
let wallet: Wallet;
let contracts: {
  tokenizedVault: Contract;
  riskGuardian: Contract;
  predictionMarket: Contract;
  governanceModule: Contract;
};

export function initializeBlockchain(): void {
  // Initialize provider
  provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
  logger.info('Blockchain provider initialized');

  // Initialize wallet
  if (config.blockchain.privateKey) {
    wallet = new ethers.Wallet(config.blockchain.privateKey, provider);
    logger.info(`Wallet initialized: ${wallet.address}`);
  }

  // Initialize contracts
  contracts = {
    tokenizedVault: new ethers.Contract(
      config.blockchain.contracts.tokenizedVault,
      TOKENIZED_VAULT_ABI,
      wallet || provider
    ),
    riskGuardian: new ethers.Contract(
      config.blockchain.contracts.riskGuardian,
      RISK_GUARDIAN_ABI,
      wallet || provider
    ),
    predictionMarket: new ethers.Contract(
      config.blockchain.contracts.predictionMarket,
      PREDICTION_MARKET_ABI,
      wallet || provider
    ),
    governanceModule: new ethers.Contract(
      config.blockchain.contracts.governanceModule,
      GOVERNANCE_MODULE_ABI,
      wallet || provider
    ),
  };

  logger.info('Smart contracts initialized');
}

export function getProvider(): JsonRpcProvider {
  if (!provider) {
    throw new Error('Blockchain provider not initialized');
  }
  return provider;
}

export function getWallet(): Wallet {
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  return wallet;
}

export function getContracts() {
  if (!contracts) {
    throw new Error('Contracts not initialized');
  }
  return contracts;
}

export async function getBlockNumber(): Promise<number> {
  return await provider.getBlockNumber();
}

export async function getGasPrice(): Promise<bigint> {
  const feeData = await provider.getFeeData();
  return feeData.gasPrice || 0n;
}

export async function estimateGas(tx: any): Promise<bigint> {
  return await provider.estimateGas(tx);
}
