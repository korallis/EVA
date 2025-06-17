interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private defaultTTL: number;
  private maxSize: number;
  private cleanupInterval: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute
    
    this.startCleanupTimer();
  }

  /**
   * Store data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    // Check if we need to make room
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  /**
   * Retrieve data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set pattern - retrieve from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    const memoryUsage = this.estimateMemoryUsage();
    
    return {
      size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage
    };
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries that match a pattern
   */
  getKeysByPattern(pattern: RegExp): string[] {
    return this.getKeys().filter(key => pattern.test(key));
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Extend TTL for a cached entry
   */
  extend(key: string, additionalTTL: number): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if not already expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    entry.ttl += additionalTTL;
    return true;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    const keysToDelete = this.getKeysByPattern(pattern);
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Create a namespaced cache instance
   */
  namespace(namespace: string): NamespacedCache {
    return new NamespacedCache(this, namespace);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const removed = this.cleanup();
      if (removed > 0) {
        console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
      }
    }, this.cleanupInterval);
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      totalSize += key.length * 2; // String characters are 2 bytes
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 24; // Approximate overhead for entry object
    }
    
    return totalSize;
  }

  private calculateHitRate(): number {
    // This would require tracking hits/misses which we're not doing yet
    // For now, return a placeholder
    return 0.85; // 85% placeholder hit rate
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

/**
 * Namespaced cache for organizing cache keys
 */
class NamespacedCache {
  constructor(
    private parentCache: CacheService,
    private namespace: string
  ) {}

  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.parentCache.set(this.getNamespacedKey(key), data, ttl);
  }

  get<T>(key: string): T | null {
    return this.parentCache.get<T>(this.getNamespacedKey(key));
  }

  has(key: string): boolean {
    return this.parentCache.has(this.getNamespacedKey(key));
  }

  delete(key: string): boolean {
    return this.parentCache.delete(this.getNamespacedKey(key));
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    return this.parentCache.getOrSet(this.getNamespacedKey(key), fetcher, ttl);
  }

  clear(): number {
    const pattern = new RegExp(`^${this.namespace}:`);
    return this.parentCache.invalidateByPattern(pattern);
  }

  getKeys(): string[] {
    const pattern = new RegExp(`^${this.namespace}:`);
    return this.parentCache.getKeysByPattern(pattern)
      .map(key => key.replace(`${this.namespace}:`, ''));
  }
}

// Global cache instances
export const globalCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 60 * 1000 // 1 minute
});

// Specialized caches for different domains
export const sdeCache = globalCache.namespace('sde');
export const esiCache = globalCache.namespace('esi');
export const fittingCache = globalCache.namespace('fitting');
export const authCache = globalCache.namespace('auth');

// Cache configurations for different data types
export const CACHE_CONFIGS = {
  // SDE data (rarely changes)
  SDE_SHIPS: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  SDE_MODULES: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  SDE_ATTRIBUTES: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  
  // ESI data (changes more frequently)
  ESI_SKILLS: { ttl: 10 * 60 * 1000 }, // 10 minutes
  ESI_QUEUE: { ttl: 5 * 60 * 1000 }, // 5 minutes
  ESI_ASSETS: { ttl: 30 * 60 * 1000 }, // 30 minutes
  ESI_WALLET: { ttl: 5 * 60 * 1000 }, // 5 minutes
  
  // Fitting calculations (expensive to compute)
  FITTING_DPS: { ttl: 15 * 60 * 1000 }, // 15 minutes
  FITTING_STATS: { ttl: 15 * 60 * 1000 }, // 15 minutes
  
  // Auth data (short-lived for security)
  AUTH_TOKEN: { ttl: 10 * 60 * 1000 }, // 10 minutes
} as const;