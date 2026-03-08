import { logger } from '../utils/logger';

const store: Record<string, any[]> = {
  risk_assessments: [],
  world_id_verifications: [],
  transactions: [],
};

export async function initializeDatabase(): Promise<void> {
  logger.info('Using in-memory database (no PostgreSQL required)');
}

export function getPool(): any {
  return {
    connect: async () => ({
      query: async (text: string) => {
        logger.debug('In-memory query:', text.substring(0, 60));
        return { rows: [], rowCount: 0 };
      },
      release: () => {},
    }),
    query: async (text: string, params?: any[]) => {
      logger.debug('In-memory query:', text.substring(0, 60));
      return { rows: [], rowCount: 0 };
    },
  };
}

export async function query(text: string, params?: any[]): Promise<any> {
  logger.debug('In-memory query:', text.substring(0, 60));
  return { rows: [], rowCount: 0 };
}

export async function getClient(): Promise<any> {
  return {
    query: async (text: string) => ({ rows: [], rowCount: 0 }),
    release: () => {},
  };
}

export async function closeDatabase(): Promise<void> {
  logger.info('In-memory database closed');
}

export function getStore() {
  return store;
}
