#!/usr/bin/env ts-node

// Direct SDE import trigger script in TypeScript
// This script runs the SDE import directly using the service modules

import * as path from 'path';
import * as fs from 'fs';
import { sdeService } from '../src/services/sdeService';
import { sdeDownloader } from '../src/services/sdeDownloader';
import { SDEImporter } from '../src/services/sdeImporter';

console.log('🚀 EVA SDE Import Trigger');
console.log('========================');

async function triggerSDEImport(): Promise<void> {
  try {
    console.log('📦 Loading SDE services...');
    console.log('✅ SDE services loaded');
    
    // Initialize SDE service  
    console.log('🔄 Initializing SDE service...');
    await sdeService.initialize();
    console.log('✅ SDE service initialized');
    
    // Check current data
    console.log('📊 Checking current data...');
    const currentShips = await sdeService.getShips();
    const currentModules = await sdeService.getModules();
    console.log(`Current: ${currentShips.length} ships, ${currentModules.length} modules`);
    
    if (currentShips.length > 500) {
      console.log('✅ Comprehensive SDE data already loaded!');
      return;
    }
    
    // Check latest SDE version
    console.log('🔍 Checking latest SDE version...');
    const latestVersion = await sdeDownloader.checkLatestVersion();
    console.log('Latest SDE version:', latestVersion);
    
    // Initialize and run SDE importer
    console.log('⚡ Starting comprehensive SDE import...');
    const importer = new SDEImporter();
    await importer.importFullSDE();
    console.log('✅ SDE import completed!');
    
    // Verify the import
    console.log('🔍 Verifying import...');
    const newShips = await sdeService.getShips();
    const newModules = await sdeService.getModules();
    
    console.log('\n🎉 IMPORT RESULTS:');
    console.log(`Ships: ${currentShips.length} → ${newShips.length}`);
    console.log(`Modules: ${currentModules.length} → ${newModules.length}`);
    
    if (newShips.length > 500 && newModules.length > 1000) {
      console.log('✅ SUCCESS: Comprehensive SDE import completed!');
      console.log('💡 The fitting page should now have full ship and module selection.');
    } else {
      console.log('⚠️ WARNING: Import may be incomplete. Check logs for errors.');
    }
    
  } catch (error) {
    console.error('❌ SDE import failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the import
triggerSDEImport().then(() => {
  console.log('🏁 SDE import process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});