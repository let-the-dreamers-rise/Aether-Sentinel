import { Router, Request, Response } from 'express';
import { register } from '../utils/metrics';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: 'demo',
    services: {
      database: 'in-memory',
      redis: 'in-memory',
    },
  });
});

router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
