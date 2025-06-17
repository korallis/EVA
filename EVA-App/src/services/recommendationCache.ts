/**
 * Recommendation Cache Service
 * Intelligent caching for recommendation system to optimize performance
 * Implements LRU cache with TTL and smart invalidation strategies
 */

import { EVALogger } from '../utils/logger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../utils/errorHandler';

const logger = EVALogger.getLogger('RecommendationCache');

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  dependencies?: string[];
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  maxEntries: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableMetrics: boolean;
}

/**
 * High-performance LRU cache with TTL and dependency tracking
 */
export class RecommendationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    cleanups: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxEntries: config.maxEntries || 1000,
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
      enableMetrics: config.enableMetrics ?? true
    };

    this.startCleanupTimer();
    logger.info(`🚀 Recommendation cache initialized with ${this.config.maxEntries} max entries`);
  }

  /**
   * Store data in cache with optional TTL and dependencies
   */
  set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    dependencies?: string[]
  ): void {
    try {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        ttl: ttl || this.config.defaultTTL,
        accessCount: 0,
        lastAccessed: now,
        dependencies
      };

      // Evict oldest entries if cache is full
      if (this.cache.size >= this.config.maxEntries) {
        this.evictLRU();
      }

      this.cache.set(key, entry);
      
      if (this.config.enableMetrics) {
        logger.debug(`📦 Cached entry: ${key} (TTL: ${ttl || this.config.defaultTTL}ms)`);
      }
    } catch (error) {
      ErrorHandler.handleError(
        'RecommendationCache',
        `Failed to cache entry: ${key}`,
        ErrorCategory.CALCULATION,
        ErrorSeverity.LOW,
        error as Error
      );
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      const now = Date.now();
      
      // Check if entry has expired
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = now;
      this.stats.hits++;

      if (this.config.enableMetrics) {
        logger.debug(`🎯 Cache hit: ${key} (access count: ${entry.accessCount})`);
      }

      return entry.data as T;
    } catch (error) {
      ErrorHandler.handleError(
        'RecommendationCache',
        `Failed to retrieve cache entry: ${key}`,
        ErrorCategory.CALCULATION,
        ErrorSeverity.LOW,
        error as Error
      );
      return null;
    }
  }

  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      logger.info(`🧹 Invalidated ${invalidated} cache entries for dependency: ${dependency}`);
    }

    return invalidated;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, cleanups: 0 };
    
    logger.info(`🧹 Cleared cache (removed ${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      missRate: this.stats.misses / (this.stats.hits + this.stats.misses) || 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : now,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : now
    };
  }

  /**
   * Generate cache key for recommendation requests
   */
  static generateRecommendationKey(
    activityID: string,
    skillsHash: string,
    budget?: number,
    options?: any
  ): string {
    const parts = [
      'rec',
      activityID,
      skillsHash,
      budget?.toString() || 'nobud',
      options ? JSON.stringify(options).slice(0, 50) : 'noopt'
    ];
    return parts.join(':');
  }

  /**
   * Generate cache key for fitting calculations
   */
  static generateFittingKey(
    shipTypeID: number,
    modulesHash: string,
    skillsHash: string
  ): string {
    return `fit:${shipTypeID}:${modulesHash}:${skillsHash}`;
  }

  /**
   * Generate cache key for ship analysis
   */
  static generateShipAnalysisKey(
    shipTypeID: number,
    activityID: string,
    skillsHash: string
  ): string {
    return `ship:${shipTypeID}:${activityID}:${skillsHash}`;
  }

  /**
   * Hash skills object for consistent cache keys
   */
  static hashSkills(skills: any): string {
    try {
      const skillsStr = JSON.stringify(skills, Object.keys(skills).sort());
      return this.simpleHash(skillsStr);
    } catch {
      return 'invalid';
    }
  }

  /**
   * Simple hash function for cache keys
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.cleanups++;
      logger.debug(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    logger.info('🛑 Recommendation cache destroyed');
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Overhead for entry metadata
    }
    return size;
  }
}

// Export singleton instance
export const recommendationCache = new RecommendationCache({
  maxEntries: 2000,
  defaultTTL: 600000, // 10 minutes
  cleanupInterval: 120000, // 2 minutes
  enableMetrics: true
});

// Cache invalidation helpers
export const CacheInvalidation = {
  /**
   * Invalidate all recommendation caches
   */
  recommendations(): void {
    recommendationCache.invalidateByDependency('recommendations');
  },

  /**
   * Invalidate fitting calculation caches
   */
  fittings(): void {
    recommendationCache.invalidateByDependency('fittings');
  },

  /**
   * Invalidate ship analysis caches
   */
  shipAnalysis(): void {
    recommendationCache.invalidateByDependency('ships');
  },

  /**
   * Invalidate caches when skills change
   */
  skillsChanged(): void {
    recommendationCache.invalidateByDependency('skills');
  },

  /**
   * Invalidate caches when market data changes
   */
  marketData(): void {
    recommendationCache.invalidateByDependency('market');
  }
}; 