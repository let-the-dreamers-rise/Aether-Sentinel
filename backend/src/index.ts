import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase } from './database';
import { initializeRedis } from './cache/redis';
import { initializeMetrics } from './utils/metrics';
import { initializeBlockchain } from './blockchain/provider';
import { Server } from 'socket.io';
import http from 'http';

async function startServer() {
  try {
    // Initialize database (non-fatal for demo mode)
    try {
      logger.info('Initializing database connection...');
      await initializeDatabase();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.warn('Database unavailable — running in demo mode without persistence');
    }

    // Initialize Redis (non-fatal for demo mode)
    try {
      logger.info('Initializing Redis connection...');
      await initializeRedis();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis unavailable — running in demo mode without caching');
    }

    // Initialize blockchain provider
    if (config.blockchain.rpcUrl) {
      logger.info('Initializing blockchain provider...');
      initializeBlockchain();
      logger.info('Blockchain provider connected');
    } else {
      logger.warn('No RPC URL configured - blockchain features disabled');
    }

    // Initialize Prometheus metrics
    initializeMetrics();
    logger.info('Metrics initialized');

    // Create Express app
    const app = await createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO for real-time updates
    const io = new Server(server, {
      cors: {
        origin: config.server.corsOrigin,
        credentials: true,
      },
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      socket.on('subscribe:risk-updates', () => {
        socket.join('risk-updates');
        logger.info(`Client ${socket.id} subscribed to risk updates`);
      });

      socket.on('subscribe:vault-updates', () => {
        socket.join('vault-updates');
        logger.info(`Client ${socket.id} subscribed to vault updates`);
      });
    });

    // Make io available to routes
    app.set('io', io);

    // Start server
    server.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`CORS origin: ${config.server.corsOrigin}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
