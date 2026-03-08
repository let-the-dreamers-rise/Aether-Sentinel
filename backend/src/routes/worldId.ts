import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getCache, setCache } from '../cache/redis';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { merkle_root, nullifier_hash, proof, action_id, signal } = req.body;

    if (!merkle_root || !nullifier_hash || !proof) {
      return res.status(400).json({ error: 'Missing required World ID proof fields' });
    }

    const cacheKey = `worldid:${nullifier_hash}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const verifyResponse = await axios.post(
      `${config.worldId.apiUrl}/verify/${config.worldId.appId}`,
      {
        merkle_root,
        nullifier_hash,
        proof,
        action: action_id || config.worldId.actionId,
        signal: signal || '',
      },
      { timeout: 10000 }
    );

    if (verifyResponse.status === 200) {
      const token = jwt.sign(
        {
          nullifier_hash,
          verified: true,
          action: action_id || config.worldId.actionId,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const result = {
        verified: true,
        token,
        nullifier_hash,
      };

      await setCache(cacheKey, JSON.stringify(result), config.cache.worldIdTTL);
      return res.json(result);
    }

    return res.status(400).json({ verified: false, error: 'Verification failed' });
  } catch (error: unknown) {
    logger.error('World ID verification failed:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return res.status(400).json({ verified: false, error: message });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ verified: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    return res.json({ verified: true, data: decoded });
  } catch {
    return res.status(401).json({ verified: false, error: 'Invalid or expired token' });
  }
});

export default router;
