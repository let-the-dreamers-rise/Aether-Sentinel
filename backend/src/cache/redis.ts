import { logger } from '../utils/logger';

const memoryCache = new Map<string, { value: string; expiresAt?: number }>();

export async function initializeRedis(): Promise<void> {
  logger.info('Using in-memory cache (no Redis required)');
}

export function getRedisClient(): any {
  return {
    isOpen: true,
    ping: async () => 'PONG',
    get: async (key: string) => {
      const entry = memoryCache.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        return null;
      }
      return entry.value;
    },
    set: async (key: string, value: string) => {
      memoryCache.set(key, { value });
    },
    setEx: async (key: string, ttl: number, value: string) => {
      memoryCache.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    },
    del: async (key: string) => { memoryCache.delete(key); },
    exists: async (key: string) => memoryCache.has(key) ? 1 : 0,
    incrBy: async (key: string, amount: number) => {
      const entry = memoryCache.get(key);
      const current = entry ? parseInt(entry.value, 10) : 0;
      const newVal = current + amount;
      memoryCache.set(key, { value: String(newVal) });
      return newVal;
    },
    expire: async (key: string, ttl: number) => {
      const entry = memoryCache.get(key);
      if (entry) entry.expiresAt = Date.now() + ttl * 1000;
    },
    mGet: async (keys: string[]) => keys.map(k => memoryCache.get(k)?.value ?? null),
    multi: () => {
      const ops: (() => Promise<void>)[] = [];
      const pipeline = {
        setEx: (key: string, ttl: number, value: string) => {
          ops.push(async () => { memoryCache.set(key, { value, expiresAt: Date.now() + ttl * 1000 }); });
          return pipeline;
        },
        set: (key: string, value: string) => {
          ops.push(async () => { memoryCache.set(key, { value }); });
          return pipeline;
        },
        exec: async () => { for (const op of ops) await op(); },
      };
      return pipeline;
    },
    quit: async () => { memoryCache.clear(); },
  };
}

export async function setCache(
  key: string,
  value: string | object,
  ttlSeconds?: number
): Promise<void> {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds) {
    memoryCache.set(key, { value: stringValue, expiresAt: Date.now() + ttlSeconds * 1000 });
  } else {
    memoryCache.set(key, { value: stringValue });
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return entry.value as T;
  }
}

export async function deleteCache(key: string): Promise<void> {
  memoryCache.delete(key);
}

export async function existsCache(key: string): Promise<boolean> {
  return memoryCache.has(key);
}

export async function setMultipleCache(
  entries: Array<{ key: string; value: string | object; ttl?: number }>
): Promise<void> {
  for (const entry of entries) {
    const stringValue = typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value);
    if (entry.ttl) {
      memoryCache.set(entry.key, { value: stringValue, expiresAt: Date.now() + entry.ttl * 1000 });
    } else {
      memoryCache.set(entry.key, { value: stringValue });
    }
  }
}

export async function getMultipleCache<T = any>(keys: string[]): Promise<(T | null)[]> {
  return keys.map(key => {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    try { return JSON.parse(entry.value) as T; } catch { return entry.value as T; }
  });
}

export async function incrementCounter(key: string, amount: number = 1): Promise<number> {
  const entry = memoryCache.get(key);
  const current = entry ? parseInt(entry.value, 10) : 0;
  const newVal = current + amount;
  memoryCache.set(key, { value: String(newVal) });
  return newVal;
}

export async function setExpiration(key: string, ttlSeconds: number): Promise<void> {
  const entry = memoryCache.get(key);
  if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
}

export async function closeRedis(): Promise<void> {
  memoryCache.clear();
  logger.info('In-memory cache cleared');
}
