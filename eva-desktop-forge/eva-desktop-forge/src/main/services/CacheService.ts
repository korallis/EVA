import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { settingsService } from './SettingsService';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
  tags?: string[]; // For bulk invalidation
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private diskCachePath: string;
  private stats = {
    hits: 0,
    misses: 0
  };
  
  // Cache TTL configurations (in milliseconds)
  private readonly TTL_CONFIG = {
    // Character data - changes infrequently
    CHARACTER_INFO: 6 * 60 * 60 * 1000, // 6 hours
    CHARACTER_PORTRAIT: 24 * 60 * 60 * 1000, // 24 hours
    CHARACTER_CORPORATION: 2 * 60 * 60 * 1000, // 2 hours
    
    // Skills - update when training completes
    CHARACTER_SKILLS: 5 * 60 * 1000, // 5 minutes (shorter for active training)
    CHARACTER_SKILL_QUEUE: 60 * 1000, // 1 minute (very dynamic)
    CHARACTER_ATTRIBUTES: 60 * 60 * 1000, // 1 hour
    
    // Static data - rarely changes
    SKILL_TYPES: 7 * 24 * 60 * 60 * 1000, // 7 days
    UNIVERSE_TYPES: 7 * 24 * 60 * 60 * 1000, // 7 days
    SDE_DATA: 30 * 24 * 60 * 60 * 1000, // 30 days
    
    // Market and dynamic data
    MARKET_PRICES: 60 * 60 * 1000, // 1 hour
    CORPORATION_INFO: 2 * 60 * 60 * 1000, // 2 hours
    
    // Default fallback
    DEFAULT: 15 * 60 * 1000 // 15 minutes
  };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.diskCachePath = path.join(userDataPath, 'cache');
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.diskCachePath)) {
      fs.mkdirSync(this.diskCachePath, { recursive: true });
    }
    
    // Load persistent cache from disk
    this.loadDiskCache();
    
    // Start cleanup timer (every 10 minutes)
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
    
    console.log('✅ Cache service initialized');
  }

  // Generate cache key
  private generateKey(namespace: string, identifier: string, params?: any): string {
    const baseKey = `${namespace}:${identifier}`;
    
    if (params) {
      const paramString = JSON.stringify(params, Object.keys(params).sort());
      const paramHash = this.simpleHash(paramString);
      return `${baseKey}:${paramHash}`;
    }
    
    return baseKey;
  }

  // Simple hash function for parameters
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Get TTL for a cache type
  private getTTL(cacheType: keyof typeof this.TTL_CONFIG): number {
    const settings = settingsService.getCachingSettings();
    const baseTTL = this.TTL_CONFIG[cacheType] || this.TTL_CONFIG.DEFAULT;
    
    // Apply user's max age setting
    const userMaxAge = settings.maxAge * 60 * 60 * 1000; // Convert hours to ms
    return Math.min(baseTTL, userMaxAge);
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  // Get from cache
  async get<T>(
    namespace: string, 
    identifier: string, 
    params?: any,
    cacheType: keyof typeof this.TTL_CONFIG = 'DEFAULT'
  ): Promise<T | null> {
    const settings = settingsService.getCachingSettings();
    
    if (!settings.enabled) {
      this.stats.misses++;
      return null;
    }

    const key = this.generateKey(namespace, identifier, params);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);      if (memoryEntry && this.isValid(memoryEntry)) {
        this.stats.hits++;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 Cache HIT (memory): ${key}`);
        }
        return memoryEntry.data as T;
      }

    // Check disk cache for persistent data
    if (this.shouldPersist(cacheType)) {
      const diskEntry = await this.getDiskEntry<T>(key);
      if (diskEntry && this.isValid(diskEntry)) {
        // Promote to memory cache
        this.memoryCache.set(key, diskEntry);
        this.stats.hits++;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎯 Cache HIT (disk): ${key}`);
        }
        return diskEntry.data;
      }
    }

    this.stats.misses++;
    // Only log cache misses in debug mode to reduce console noise
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ Cache MISS: ${key}`);
    }
    return null;
  }

  // Set cache entry
  async set<T>(
    namespace: string,
    identifier: string,
    data: T,
    params?: any,
    cacheType: keyof typeof this.TTL_CONFIG = 'DEFAULT',
    tags?: string[]
  ): Promise<void> {
    const settings = settingsService.getCachingSettings();
    
    if (!settings.enabled) {
      return;
    }

    const key = this.generateKey(namespace, identifier, params);
    const ttl = this.getTTL(cacheType);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      tags
    };

    // Always store in memory
    this.memoryCache.set(key, entry);
    
    // Store persistent data on disk
    if (this.shouldPersist(cacheType)) {
      await this.setDiskEntry(key, entry);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Cache SET: ${key} (TTL: ${Math.round(ttl / 1000 / 60)}min)`);
    }
  }

  // Determine if cache type should be persisted to disk
  private shouldPersist(cacheType: keyof typeof this.TTL_CONFIG): boolean {
    const persistentTypes: (keyof typeof this.TTL_CONFIG)[] = [
      'CHARACTER_INFO',
      'CHARACTER_PORTRAIT', 
      'SKILL_TYPES',
      'UNIVERSE_TYPES',
      'SDE_DATA',
      'CORPORATION_INFO'
    ];
    
    return persistentTypes.includes(cacheType);
  }

  // Get entry from disk
  private async getDiskEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = path.join(this.diskCachePath, `${this.simpleHash(key)}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const entry = JSON.parse(data) as CacheEntry<T>;
      
      // Verify key matches (collision protection)
      if (entry.key !== key) {
        return null;
      }
      
      return entry;
    } catch (error) {
      console.warn(`⚠️ Failed to read disk cache entry: ${key}`, error);
      return null;
    }
  }

  // Set entry on disk
  private async setDiskEntry<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const filePath = path.join(this.diskCachePath, `${this.simpleHash(key)}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entry));
    } catch (error) {
      console.warn(`⚠️ Failed to write disk cache entry: ${key}`, error);
    }
  }

  // Load persistent cache from disk on startup
  private async loadDiskCache(): Promise<void> {
    try {
      if (!fs.existsSync(this.diskCachePath)) {
        return;
      }

      const files = fs.readdirSync(this.diskCachePath);
      let loadedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.diskCachePath, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const entry = JSON.parse(data) as CacheEntry;
          
          // Only load valid entries
          if (this.isValid(entry)) {
            this.memoryCache.set(entry.key, entry);
            loadedCount++;
          } else {
            // Delete expired disk entries
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load cache entry from ${file}:`, error);
        }
      }

      console.log(`📂 Loaded ${loadedCount} cache entries from disk`);
    } catch (error) {
      console.warn('⚠️ Failed to load disk cache:', error);
    }
  }

  // Clear specific cache entry
  async invalidate(namespace: string, identifier: string, params?: any): Promise<void> {
    const key = this.generateKey(namespace, identifier, params);
    
    // Remove from memory
    this.memoryCache.delete(key);
    
    // Remove from disk
    try {
      const filePath = path.join(this.diskCachePath, `${this.simpleHash(key)}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to delete disk cache entry: ${key}`, error);
    }
    
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  // Clear cache entries by tag
  async invalidateByTag(tag: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    // Find entries with matching tag
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags?.includes(tag)) {
        keysToDelete.push(key);
      }
    }
    
    // Remove found entries
    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        await this.invalidate('', '', entry.key);
      }
    }
    
    console.log(`🗑️ Cache invalidated by tag "${tag}": ${keysToDelete.length} entries`);
  }

  // Clear cache for a character
  async invalidateCharacter(characterId: number): Promise<void> {
    await this.invalidateByTag(`character:${characterId}`);
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear disk cache
    try {
      if (fs.existsSync(this.diskCachePath)) {
        const files = fs.readdirSync(this.diskCachePath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.diskCachePath, file));
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear disk cache:', error);
    }
    
    // Reset stats
    this.stats.hits = 0;
    this.stats.misses = 0;
    
    console.log('🧹 All cache cleared');
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    // Find expired memory entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        toDelete.push(key);
      }
    }
    
    // Remove expired entries
    for (const key of toDelete) {
      this.memoryCache.delete(key);
    }
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${toDelete.length} expired entries`);
    }
  }

  // Get cache statistics
  getCacheStats(): CacheStats {
    const entries = Array.from(this.memoryCache.values());
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: entries.length,
      memoryUsage: this.calculateMemoryUsage(),
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : undefined,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : undefined
    };
  }

  // Calculate approximate memory usage
  private calculateMemoryUsage(): number {
    let usage = 0;
    
    for (const entry of this.memoryCache.values()) {
      // Rough estimate: JSON string length as proxy for memory usage
      usage += JSON.stringify(entry).length;
    }
    
    return usage;
  }

  // Cache wrapper for functions
  async cached<T>(
    namespace: string,
    identifier: string,
    fetchFunction: () => Promise<T>,
    params?: any,
    cacheType: keyof typeof this.TTL_CONFIG = 'DEFAULT',
    tags?: string[]
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(namespace, identifier, params, cacheType);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const data = await fetchFunction();
    
    // Store in cache  
    await this.set(namespace, identifier, data, params, cacheType, tags);
    
    return data;
  }

  // Improved preload with character-specific data
  async preloadData(): Promise<void> {
    const settings = settingsService.getCachingSettings();
    
    if (!settings.preloadData) {
      return;
    }
    
    console.log('🚀 Preloading common cache data...');
    
    try {
      // Import here to avoid circular dependency
      const { characterService } = await import('./CharacterService');
      
      // Preload active character's basic data
      const activeCharacter = await characterService.getActiveCharacter();
      if (activeCharacter) {
        // Pre-warm the cache for character skill queue
        const { esiService } = await import('./EsiService');
        try {
          await esiService.getCharacterSkillQueue(activeCharacter.character_id);
        } catch (error) {
          // Ignore preload errors - cache will be populated on first request
        }
      }
      
      console.log('✅ Cache preload completed');
    } catch (error) {
      // Preload failures shouldn't block app startup
      console.log('⚠️ Cache preload completed with some errors (non-critical)');
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();