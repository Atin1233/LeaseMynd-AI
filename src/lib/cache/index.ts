/**
 * Caching Utility
 * 
 * Provides a unified caching interface that supports:
 * - Upstash Redis (serverless Redis for production)
 * - In-memory cache (fallback for development)
 * 
 * Features:
 * - TTL-based expiration
 * - Automatic JSON serialization
 * - Cache key namespacing
 * - Stale-while-revalidate pattern
 */

export interface CacheConfig {
  /** Cache provider type */
  provider: 'redis' | 'memory';
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Key prefix for namespacing */
  keyPrefix: string;
  /** Upstash Redis URL (for redis provider) */
  redisUrl?: string;
  /** Upstash Redis Token (for redis provider) */
  redisToken?: string;
  /** Max entries for memory cache */
  maxMemoryEntries?: number;
}

export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Expiration timestamp (ms since epoch) */
  expiresAt: number;
  /** When the entry was created */
  createdAt: number;
  /** Whether this entry is stale but still usable */
  isStale?: boolean;
}

export interface CacheOptions {
  /** TTL in seconds (overrides default) */
  ttl?: number;
  /** Tags for grouped invalidation */
  tags?: string[];
  /** Stale-while-revalidate window in seconds */
  staleWhileRevalidate?: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  provider: 'memory',
  defaultTtl: 3600, // 1 hour
  keyPrefix: 'leaseai:',
  maxMemoryEntries: 1000,
};

/**
 * In-memory cache store
 */
class MemoryCache {
  private store: Map<string, string> = new Map();
  private maxEntries: number;
  
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }
  
  async get(key: string): Promise<string | null> {
    const value = this.store.get(key);
    return value ?? null;
  }
  
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }
    
    this.store.set(key, value);
    
    // Auto-delete after TTL
    if (ttlSeconds && ttlSeconds > 0) {
      setTimeout(() => {
        this.store.delete(key);
      }, ttlSeconds * 1000);
    }
  }
  
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }
  
  async flush(): Promise<void> {
    this.store.clear();
  }
  
  get size(): number {
    return this.store.size;
  }
}

/**
 * Upstash Redis client wrapper
 */
class UpstashRedis {
  private baseUrl: string;
  private token: string;
  
  constructor(url: string, token: string) {
    this.baseUrl = url;
    this.token = token;
  }
  
  private async request(command: string[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.statusText}`);
    }
    
    const data = await response.json() as { result?: unknown };
    return data.result;
  }
  
  async get(key: string): Promise<string | null> {
    const result = await this.request(['GET', key]);
    return result as string | null;
  }
  
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.request(['SET', key, value, 'EX', ttlSeconds.toString()]);
    } else {
      await this.request(['SET', key, value]);
    }
  }
  
  async del(key: string): Promise<void> {
    await this.request(['DEL', key]);
  }
  
  async keys(pattern: string): Promise<string[]> {
    const result = await this.request(['KEYS', pattern]);
    return (result as string[]) || [];
  }
  
  async flush(): Promise<void> {
    await this.request(['FLUSHDB']);
  }
}

/**
 * Cache store interface
 */
interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;
}

/**
 * Main Cache class
 */
class Cache {
  private store: CacheStore;
  private config: CacheConfig;
  private tagStore: Map<string, Set<string>> = new Map();
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize store based on provider
    if (this.config.provider === 'redis' && this.config.redisUrl && this.config.redisToken) {
      this.store = new UpstashRedis(this.config.redisUrl, this.config.redisToken);
      console.log('[Cache] Using Upstash Redis');
    } else {
      this.store = new MemoryCache(this.config.maxMemoryEntries);
      console.log('[Cache] Using in-memory cache');
    }
  }
  
  /**
   * Build a full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }
  
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const raw = await this.store.get(fullKey);
      
      if (!raw) {
        return null;
      }
      
      const entry = JSON.parse(raw) as CacheEntry<T>;
      const now = Date.now();
      
      // Check if expired
      if (entry.expiresAt < now) {
        // Delete expired entry
        await this.store.del(fullKey);
        return null;
      }
      
      return entry.value;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Get a value with stale-while-revalidate support
   */
  async getWithSWR<T>(
    key: string,
    options?: CacheOptions
  ): Promise<{ value: T | null; isStale: boolean }> {
    try {
      const fullKey = this.buildKey(key);
      const raw = await this.store.get(fullKey);
      
      if (!raw) {
        return { value: null, isStale: false };
      }
      
      const entry = JSON.parse(raw) as CacheEntry<T>;
      const now = Date.now();
      const swrWindow = (options?.staleWhileRevalidate || 0) * 1000;
      
      // Fresh
      if (entry.expiresAt >= now) {
        return { value: entry.value, isStale: false };
      }
      
      // Stale but within SWR window
      if (entry.expiresAt + swrWindow >= now) {
        return { value: entry.value, isStale: true };
      }
      
      // Expired beyond SWR window
      await this.store.del(fullKey);
      return { value: null, isStale: false };
    } catch (error) {
      console.error(`[Cache] Error getting key ${key} with SWR:`, error);
      return { value: null, isStale: false };
    }
  }
  
  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const ttl = options.ttl ?? this.config.defaultTtl;
      const now = Date.now();
      
      const entry: CacheEntry<T> = {
        value,
        expiresAt: now + ttl * 1000,
        createdAt: now,
      };
      
      await this.store.set(fullKey, JSON.stringify(entry), ttl);
      
      // Track tags
      if (options.tags) {
        for (const tag of options.tags) {
          if (!this.tagStore.has(tag)) {
            this.tagStore.set(tag, new Set());
          }
          this.tagStore.get(tag)!.add(fullKey);
        }
      }
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  }
  
  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.store.del(fullKey);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
    }
  }
  
  /**
   * Delete all values with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagStore.get(tag);
    if (!keys || keys.size === 0) {
      return 0;
    }
    
    let deleted = 0;
    for (const key of keys) {
      try {
        await this.store.del(key);
        deleted++;
      } catch {
        // Ignore individual key errors
      }
    }
    
    this.tagStore.delete(tag);
    return deleted;
  }
  
  /**
   * Delete all values matching a pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.store.keys(fullPattern);
      
      for (const key of keys) {
        await this.store.del(key);
      }
      
      return keys.length;
    } catch (error) {
      console.error(`[Cache] Error invalidating by pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  /**
   * Get or set - returns cached value or computes and caches new value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Compute new value
    const value = await factory();
    
    // Cache it
    await this.set(key, value, options);
    
    return value;
  }
  
  /**
   * Get or set with SWR - returns cached value (even if stale) and revalidates in background
   */
  async getOrSetSWR<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ value: T; fromCache: boolean; wasStale: boolean }> {
    // Try to get from cache with SWR
    const { value: cached, isStale } = await this.getWithSWR<T>(key, options);
    
    if (cached !== null) {
      // If stale, revalidate in background
      if (isStale) {
        // Don't await - run in background
        factory().then(newValue => {
          this.set(key, newValue, options);
        }).catch(error => {
          console.error(`[Cache] SWR revalidation failed for ${key}:`, error);
        });
      }
      
      return { value: cached, fromCache: true, wasStale: isStale };
    }
    
    // Compute new value
    const value = await factory();
    await this.set(key, value, options);
    
    return { value, fromCache: false, wasStale: false };
  }
  
  /**
   * Flush entire cache
   */
  async flush(): Promise<void> {
    await this.store.flush();
    this.tagStore.clear();
  }
  
  /**
   * Create a cache key from multiple parts
   */
  static createKey(...parts: (string | number | undefined)[]): string {
    return parts
      .filter(p => p !== undefined)
      .map(p => String(p).replace(/[^a-zA-Z0-9-_]/g, '_'))
      .join(':');
  }
  
  /**
   * Create a hash from content for cache key
   */
  static hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Singleton cache instance
let cacheInstance: Cache | null = null;

/**
 * Get the cache instance
 */
export function getCache(): Cache {
  if (!cacheInstance) {
    cacheInstance = new Cache({
      provider: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
      redisUrl: process.env.UPSTASH_REDIS_REST_URL,
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      defaultTtl: 3600, // 1 hour
      keyPrefix: 'leaseai:',
    });
  }
  return cacheInstance;
}

/**
 * Create a new cache instance with custom config
 */
export function createCache(config: Partial<CacheConfig>): Cache {
  return new Cache(config);
}

// Cache key builders for common use cases
export const CacheKeys = {
  /** Analysis cache key */
  analysis: (leaseId: string) => Cache.createKey('analysis', leaseId),
  
  /** Market benchmark cache key */
  benchmark: (region: string, propertyType: string) => 
    Cache.createKey('benchmark', region, propertyType),
  
  /** User session cache key */
  session: (userId: string) => Cache.createKey('session', userId),
  
  /** Document content hash cache key */
  document: (contentHash: string) => Cache.createKey('doc', contentHash),
  
  /** Rate limit cache key */
  rateLimit: (userId: string, endpoint: string) => 
    Cache.createKey('ratelimit', userId, endpoint),
};

// Cache TTL presets in seconds
export const CacheTTL = {
  /** Short-lived cache (5 minutes) */
  SHORT: 300,
  /** Medium cache (1 hour) */
  MEDIUM: 3600,
  /** Long cache (24 hours) */
  LONG: 86400,
  /** Very long cache (7 days) */
  WEEK: 604800,
  /** Rate limit window (15 minutes) */
  RATE_LIMIT: 900,
};

export { Cache };
export default Cache;
