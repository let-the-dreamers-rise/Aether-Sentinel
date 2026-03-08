import { Router, Request, Response } from 'express';
import { getContracts, getBlockNumber, getGasPrice } from '../blockchain/provider';
import { logger } from '../utils/logger';

const router = Router();

router.get('/vault-state', async (_req: Request, res: Response) => {
  try {
    const contracts = getContracts();
    const vaultState = await contracts.tokenizedVault.getVaultState();
    return res.json({
      reserveRatio: vaultState.reserveRatio.toString(),
      totalDeposits: vaultState.totalDeposits.toString(),
      totalLiabilities: vaultState.totalLiabilities.toString(),
      paused: vaultState.paused,
      lastUpdate: vaultState.lastUpdate.toString(),
    });
  } catch (error) {
    logger.error('Failed to get vault state:', error);
    return res.status(503).json({
      error: 'Blockchain unavailable',
      fallback: {
        reserveRatio: '10000',
        totalDeposits: '0',
        totalLiabilities: '0',
        paused: false,
        lastUpdate: '0',
      },
    });
  }
});

router.get('/block-number', async (_req: Request, res: Response) => {
  try {
    const blockNumber = await getBlockNumber();
    return res.json({ blockNumber });
  } catch (error) {
    logger.error('Failed to get block number:', error);
    return res.status(503).json({ error: 'Blockchain unavailable' });
  }
});

router.get('/gas-price', async (_req: Request, res: Response) => {
  try {
    const gasPrice = await getGasPrice();
    return res.json({ gasPrice: gasPrice.toString() });
  } catch (error) {
    logger.error('Failed to get gas price:', error);
    return res.status(503).json({ error: 'Blockchain unavailable' });
  }
});

router.get('/markets/:marketId', async (req: Request, res: Response) => {
  try {
    const contracts = getContracts();
    const market = await contracts.predictionMarket.getMarket(req.params.marketId);
    return res.json({
      marketId: market.marketId.toString(),
      creator: market.creator,
      question: market.question,
      endTime: market.endTime.toString(),
      status: market.status,
      totalStake: market.totalStake.toString(),
    });
  } catch (error) {
    logger.error('Failed to get market:', error);
    return res.status(503).json({ error: 'Blockchain unavailable' });
  }
});

router.get('/proposals/:proposalId', async (req: Request, res: Response) => {
  try {
    const contracts = getContracts();
    const proposal = await contracts.governanceModule.getProposal(req.params.proposalId);
    return res.json({
      proposalId: proposal.proposalId.toString(),
      proposer: proposal.proposer,
      title: proposal.title,
      votingEndTime: proposal.votingEndTime.toString(),
      status: proposal.status,
      votesFor: proposal.votesFor.toString(),
      votesAgainst: proposal.votesAgainst.toString(),
    });
  } catch (error) {
    logger.error('Failed to get proposal:', error);
    return res.status(503).json({ error: 'Blockchain unavailable' });
  }
});

export default router;
