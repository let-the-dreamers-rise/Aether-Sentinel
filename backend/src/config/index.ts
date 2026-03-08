import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'aether_sentinel',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  blockchain: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || '',
    privateKey: process.env.PRIVATE_KEY || '',
    contracts: {
      tokenizedVault: process.env.TOKENIZED_VAULT_ADDRESS || '',
      riskGuardian: process.env.RISK_GUARDIAN_ADDRESS || '',
      predictionMarket: process.env.PREDICTION_MARKET_ADDRESS || '',
      governanceModule: process.env.GOVERNANCE_MODULE_ADDRESS || '',
    },
  },
  aiRiskEngine: {
    url: process.env.AI_RISK_ENGINE_URL || 'http://localhost:8000',
    apiKey: process.env.AI_RISK_ENGINE_API_KEY || '',
  },
  worldId: {
    appId: process.env.WORLD_ID_APP_ID || '',
    actionId: process.env.WORLD_ID_ACTION_ID || '',
    apiUrl: process.env.WORLD_ID_API_URL || 'https://developer.worldcoin.org/api/v1',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cache: {
    riskAssessmentTTL: parseInt(process.env.RISK_ASSESSMENT_CACHE_TTL || '60', 10),
    worldIdTTL: parseInt(process.env.WORLD_ID_CACHE_TTL || '300', 10),
  },
};

export default config;
