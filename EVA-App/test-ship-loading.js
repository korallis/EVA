const { sdeService } = require('./src/services/sdeService');

async function testSdeService() {
  try {
    console.log('🚀 Testing SDE Service...');
    
    await sdeService.initialize();
    console.log('✅ SDE Service initialized');
    
    const ships = await sdeService.getShips();
    console.log(`📦 Ships loaded: ${ships.length}`);
    console.log('Sample ships:', ships.slice(0, 5).map(s => ({ id: s.typeID, name: s.typeName, group: s.groupName, race: s.raceName })));
    
    const modules = await sdeService.getModules();
    console.log(`🔧 Modules loaded: ${modules.length}`);
    console.log('Sample modules:', modules.slice(0, 5).map(m => ({ id: m.typeID, name: m.typeName, group: m.groupName })));
    
    // Test ship categories
    const shipCategories = [...new Set(ships.map(ship => ship.groupName))].filter(Boolean).sort();
    console.log('Ship categories:', shipCategories);
    
    // Test a specific category
    const frigates = ships.filter(ship => ship.groupName && ship.groupName.toLowerCase().includes('frigate'));
    console.log(`Frigate-like ships: ${frigates.length}`);
    frigates.slice(0, 5).forEach(ship => {
      console.log(`  - ${ship.typeName} (${ship.groupName}) - Race: ${ship.raceName}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing SDE service:', error);
  }
}

testSdeService();
