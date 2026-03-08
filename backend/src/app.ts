import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { initializeX402, x402Gate, getX402Status } from './middleware/x402';

// Import routes
import healthRoutes from './routes/health';
import riskRoutes from './routes/risk';
import worldIdRoutes from './routes/worldId';
import blockchainRoutes from './routes/blockchain';

export async function createApp(): Promise<Application> {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  app.use(rateLimiter);

  // Initialize x402 payment protocol
  await initializeX402();

  // x402 payment gate — intercepts premium endpoints
  app.use(x402Gate);

  // x402 status endpoint (shows payment configuration)
  app.get('/api/x402/status', getX402Status);

  // Health check (no rate limiting)
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/risk-assessment', riskRoutes);
  app.use('/api/verify-world-id', worldIdRoutes);
  app.use('/api/blockchain', blockchainRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
