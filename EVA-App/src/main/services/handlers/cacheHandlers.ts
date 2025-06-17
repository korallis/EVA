import { ipcMain } from 'electron';
import { globalCache, sdeCache, esiCache, fittingCache, authCache } from '../../../services/cacheService';

class CacheHandlers {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    // Get cache statistics
    ipcMain.handle('cache:getStats', async () => {
      return {
        global: globalCache.getStats(),
        namespaces: {
          sde: {
            keys: sdeCache.getKeys(),
            size: sdeCache.getKeys().length
          },
          esi: {
            keys: esiCache.getKeys(),
            size: esiCache.getKeys().length
          },
          fitting: {
            keys: fittingCache.getKeys(),
            size: fittingCache.getKeys().length
          },
          auth: {
            keys: authCache.getKeys(),
            size: authCache.getKeys().length
          }
        }
      };
    });

    // Clear all caches
    ipcMain.handle('cache:clearAll', async () => {
      globalCache.clear();
      console.log('🧹 All caches cleared');
      return true;
    });

    // Clear specific namespace
    ipcMain.handle('cache:clearNamespace', async (event, namespace: string) => {
      let cleared = 0;
      
      switch (namespace) {
        case 'sde':
          cleared = sdeCache.clear();
          break;
        case 'esi':
          cleared = esiCache.clear();
          break;
        case 'fitting':
          cleared = fittingCache.clear();
          break;
        case 'auth':
          cleared = authCache.clear();
          break;
        default:
          throw new Error(`Unknown cache namespace: ${namespace}`);
      }
      
      console.log(`🧹 Cleared ${cleared} entries from ${namespace} cache`);
      return cleared;
    });

    // Manual cache cleanup
    ipcMain.handle('cache:cleanup', async () => {
      const removed = globalCache.cleanup();
      console.log(`🧹 Manual cleanup: removed ${removed} expired entries`);
      return removed;
    });

    // Get specific cache entry
    ipcMain.handle('cache:get', async (event, namespace: string, key: string) => {
      let cache;
      
      switch (namespace) {
        case 'sde':
          cache = sdeCache;
          break;
        case 'esi':
          cache = esiCache;
          break;
        case 'fitting':
          cache = fittingCache;
          break;
        case 'auth':
          cache = authCache;
          break;
        default:
          throw new Error(`Unknown cache namespace: ${namespace}`);
      }
      
      return cache.get(key);
    });

    // Delete specific cache entry
    ipcMain.handle('cache:delete', async (event, namespace: string, key: string) => {
      let cache;
      
      switch (namespace) {
        case 'sde':
          cache = sdeCache;
          break;
        case 'esi':
          cache = esiCache;
          break;
        case 'fitting':
          cache = fittingCache;
          break;
        case 'auth':
          cache = authCache;
          break;
        default:
          throw new Error(`Unknown cache namespace: ${namespace}`);
      }
      
      const deleted = cache.delete(key);
      console.log(`🗑️ ${deleted ? 'Deleted' : 'Could not delete'} cache entry: ${namespace}:${key}`);
      return deleted;
    });

    // Invalidate cache by pattern
    ipcMain.handle('cache:invalidatePattern', async (event, pattern: string) => {
      const regex = new RegExp(pattern);
      const invalidated = globalCache.invalidateByPattern(regex);
      console.log(`🧹 Invalidated ${invalidated} cache entries matching pattern: ${pattern}`);
      return invalidated;
    });

    // Preload critical data
    ipcMain.handle('cache:preload', async () => {
      console.log('🚀 Preloading critical cache data...');
      
      try {
        // Import services here to avoid circular dependencies
        const { sdeService } = await import('../../../services/sdeService');
        
        // Preload ships and modules if not already cached
        const shipsPromise = sdeService.getShips();
        const modulesPromise = sdeService.getModules();
        
        await Promise.all([shipsPromise, modulesPromise]);
        
        console.log('✅ Critical cache data preloaded');
        return true;
      } catch (error) {
        console.error('❌ Failed to preload cache data:', error);
        return false;
      }
    });
  }
}

export const cacheHandlers = new CacheHandlers();