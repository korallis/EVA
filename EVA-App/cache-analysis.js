#!/usr/bin/env node

// Cache service analysis
console.log('🔄 CACHE SERVICE ANALYSIS');
console.log('=========================\n');

// Simulate cache service behavior
class MockCacheService {
  constructor() {
    this.cache = new Map();
    this.hitCount = 0;
    this.missCount = 0;
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.data;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0
    };
  }

  async getOrSet(key, fetcher, ttl) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Test cache behavior
async function testCachePerformance() {
  console.log('🚀 Testing Cache Performance');
  console.log('-----------------------------');

  const cache = new MockCacheService();
  
  // Test 1: Basic set/get operations
  console.log('📊 Test 1: Basic Operations');
  cache.set('test1', { value: 'data1' });
  cache.set('test2', { value: 'data2' }, 1000); // 1 second TTL
  
  console.log('  ✅ Set operations completed');
  console.log('  📋 Get test1:', cache.get('test1') ? 'HIT' : 'MISS');
  console.log('  📋 Get test2:', cache.get('test2') ? 'HIT' : 'MISS');
  console.log('  📋 Get nonexistent:', cache.get('nonexistent') ? 'HIT' : 'MISS');
  
  // Test 2: TTL expiration
  console.log('\n📊 Test 2: TTL Expiration');
  await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for test2 to expire
  console.log('  📋 Get test1 (should hit):', cache.get('test1') ? 'HIT' : 'MISS');
  console.log('  📋 Get test2 (should miss):', cache.get('test2') ? 'HIT' : 'MISS');
  
  // Test 3: getOrSet pattern
  console.log('\n📊 Test 3: GetOrSet Pattern');
  let fetchCount = 0;
  
  const mockFetcher = async () => {
    fetchCount++;
    console.log(`    🔄 Fetcher called (${fetchCount})`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate database query
    return { ships: ['Rifter', 'Punisher', 'Merlin'] };
  };
  
  // First call should fetch
  const result1 = await cache.getOrSet('ships', mockFetcher, 10000);
  console.log('  📋 First call result:', result1.ships.length, 'ships');
  
  // Second call should use cache
  const result2 = await cache.getOrSet('ships', mockFetcher, 10000);
  console.log('  📋 Second call result:', result2.ships.length, 'ships');
  
  console.log('  📊 Total fetcher calls:', fetchCount);
  
  // Test 4: Cache statistics
  console.log('\n📊 Test 4: Cache Statistics');
  const stats = cache.getStats();
  console.log('  📋 Cache size:', stats.size);
  console.log('  📋 Hits:', stats.hits);
  console.log('  📋 Misses:', stats.misses);
  console.log('  📋 Hit rate:', stats.hitRate.toFixed(1) + '%');
}

// Test memory usage patterns
function testMemoryUsage() {
  console.log('\n🧠 MEMORY USAGE SIMULATION');
  console.log('---------------------------');
  
  const cache = new MockCacheService();
  
  // Simulate large data sets
  const largeMockData = {
    ships: Array(500).fill().map((_, i) => ({
      typeID: i,
      typeName: `Ship ${i}`,
      attributes: Array(50).fill().map((_, j) => ({ id: j, value: Math.random() * 1000 }))
    })),
    modules: Array(2000).fill().map((_, i) => ({
      typeID: i + 1000,
      typeName: `Module ${i}`,
      attributes: Array(20).fill().map((_, j) => ({ id: j, value: Math.random() * 100 }))
    }))
  };
  
  console.log('📊 Large data set created:');
  console.log('  🚢 Ships:', largeMockData.ships.length);
  console.log('  ⚙️ Modules:', largeMockData.modules.length);
  
  // Estimate memory usage
  const jsonSize = JSON.stringify(largeMockData).length;
  console.log('  💾 Estimated JSON size:', (jsonSize / 1024 / 1024).toFixed(2), 'MB');
  
  // Test cache with large data
  cache.set('large-dataset', largeMockData);
  const retrieved = cache.get('large-dataset');
  
  console.log('  ✅ Large data cached and retrieved successfully');
  console.log('  📋 Retrieved ships:', retrieved.ships.length);
  console.log('  📋 Retrieved modules:', retrieved.modules.length);
}

// Test edge cases
function testEdgeCases() {
  console.log('\n🔍 EDGE CASE TESTING');
  console.log('---------------------');
  
  const cache = new MockCacheService();
  
  // Test 1: Null/undefined values
  console.log('📊 Test 1: Null/Undefined Handling');
  cache.set('null-test', null);
  cache.set('undefined-test', undefined);
  cache.set('empty-test', {});
  cache.set('empty-array-test', []);
  
  console.log('  📋 Null value:', cache.get('null-test') === null ? 'PRESERVED' : 'CORRUPTED');
  console.log('  📋 Undefined value:', cache.get('undefined-test') === undefined ? 'PRESERVED' : 'CORRUPTED');
  console.log('  📋 Empty object:', JSON.stringify(cache.get('empty-test')) === '{}' ? 'PRESERVED' : 'CORRUPTED');
  console.log('  📋 Empty array:', JSON.stringify(cache.get('empty-array-test')) === '[]' ? 'PRESERVED' : 'CORRUPTED');
  
  // Test 2: Very short TTL
  console.log('\n📊 Test 2: Very Short TTL');
  cache.set('short-ttl', { value: 'quick-expiry' }, 1); // 1ms TTL
  
  setTimeout(() => {
    console.log('  📋 Quick expiry test:', cache.get('short-ttl') ? 'STILL_CACHED' : 'EXPIRED');
  }, 10);
  
  // Test 3: Zero TTL
  console.log('\n📊 Test 3: Zero TTL');
  cache.set('zero-ttl', { value: 'instant-expiry' }, 0);
  console.log('  📋 Zero TTL test:', cache.get('zero-ttl') ? 'CACHED' : 'EXPIRED');
}

// Run all tests
async function runAllTests() {
  try {
    await testCachePerformance();
    testMemoryUsage();
    testEdgeCases();
    
    console.log('\n✅ All cache tests completed successfully');
    
  } catch (error) {
    console.error('❌ Cache testing failed:', error);
  }
}

runAllTests();