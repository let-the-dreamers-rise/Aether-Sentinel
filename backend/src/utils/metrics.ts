import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
export function initializeMetrics(): void {
  collectDefaultMetrics({ register });
}

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Risk assessment metrics
export const riskAssessmentTotal = new Counter({
  name: 'risk_assessments_total',
  help: 'Total number of risk assessments',
  labelNames: ['action'],
  registers: [register],
});

export const riskAssessmentDuration = new Histogram({
  name: 'risk_assessment_duration_seconds',
  help: 'Duration of risk assessments',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const currentRiskScore = new Gauge({
  name: 'current_risk_score',
  help: 'Current risk score (0-100)',
  registers: [register],
});

// World ID verification metrics
export const worldIdVerificationTotal = new Counter({
  name: 'world_id_verifications_total',
  help: 'Total number of World ID verifications',
  labelNames: ['status'],
  registers: [register],
});

export const worldIdVerificationDuration = new Histogram({
  name: 'world_id_verification_duration_seconds',
  help: 'Duration of World ID verifications',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Blockchain metrics
export const blockchainRequestTotal = new Counter({
  name: 'blockchain_requests_total',
  help: 'Total number of blockchain requests',
  labelNames: ['contract', 'method', 'status'],
  registers: [register],
});

export const blockchainRequestDuration = new Histogram({
  name: 'blockchain_request_duration_seconds',
  help: 'Duration of blockchain requests',
  labelNames: ['contract', 'method'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Cache metrics
export const cacheHitTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// Database metrics
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const databaseConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// WebSocket metrics
export const websocketConnectionsActive = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const websocketMessagesTotal = new Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type'],
  registers: [register],
});
