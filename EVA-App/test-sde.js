// Simple test script to verify SDE downloader functionality
const { sdeDownloader } = require('./src/services/sdeDownloader');

async function testSDE() {
  console.log('🧪 Testing SDE Downloader...');
  
  try {
    // Test version checking
    console.log('1. Checking latest SDE version...');
    const latestVersion = await sdeDownloader.checkLatestVersion();
    console.log('✅ Latest version:', latestVersion);
    
    // Test installed version
    console.log('2. Checking installed version...');
    const installedVersion = await sdeDownloader.getInstalledVersion();
    console.log('✅ Installed version:', installedVersion);
    
    // Test parsing (without download)
    console.log('3. Testing SDE parsing...');
    const parseStats = await sdeDownloader.parseSDE();
    console.log('✅ Parse stats:', parseStats);
    
    console.log('🎉 SDE Downloader tests completed successfully!');
    
  } catch (error) {
    console.error('❌ SDE test failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testSDE();
}

module.exports = { testSDE };