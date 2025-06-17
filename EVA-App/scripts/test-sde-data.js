// Test script to verify SDE data exposure
const { sdeService } = require('../src/services/sdeService');

async function testSDEData() {
  console.log('🔍 Testing SDE data exposure...');
  
  try {
    // Initialize service
    await sdeService.initialize();
    
    // Clear cache to force fresh data
    const { sdeCache } = require('../src/services/cacheService');
    sdeCache.clear();
    console.log('🧹 Cache cleared');
    
    // Test ships
    console.log('📊 Testing ships...');
    const ships = await sdeService.getShips();
    console.log(`✅ Ships loaded: ${ships.length} ships`);
    
    if (ships.length > 0) {
      console.log('📋 Sample ships:');
      ships.slice(0, 5).forEach(ship => {
        console.log(`  - ${ship.typeName} (${ship.groupName})`);
      });
    }
    
    // Test modules  
    console.log('📊 Testing modules...');
    const modules = await sdeService.getModules();
    console.log(`✅ Modules loaded: ${modules.length} modules`);
    
    if (modules.length > 0) {
      console.log('📋 Sample modules:');
      modules.slice(0, 5).forEach(module => {
        console.log(`  - ${module.typeName} (${module.groupName})`);
      });
    }
    
    // Test database stats
    console.log('📊 Database statistics:');
    const stats = await sdeService.getSDEStatistics();
    console.log(`  - Ships: ${stats.shipCount}`);
    console.log(`  - Modules: ${stats.moduleCount}`);
    console.log(`  - Types: ${stats.typeCount}`);
    console.log(`  - Attributes: ${stats.attributeCount}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSDEData();