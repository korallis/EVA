#!/usr/bin/env node

// Script to trigger comprehensive SDE import to fix empty type_attributes table
const path = require('path');

// Set up the path to the project
const projectRoot = '/Users/lee/EVA/eva-desktop-forge/eva-desktop-forge';
process.chdir(projectRoot);

// Import the comprehensive SDE importer
async function triggerImport() {
  try {
    console.log('🚀 Starting comprehensive SDE re-import...');
    
    // Import the TypeScript module - we need to compile first
    const { execSync } = require('child_process');
    
    // Run TypeScript compilation for the service files
    console.log('🔨 Compiling TypeScript...');
    execSync('npx tsc --outDir ./dist --target es2018 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck src/services/comprehensiveSDEImporter.ts src/services/sdeService.ts', { 
      stdio: 'inherit',
      cwd: projectRoot 
    });
    
    // Now import the compiled module
    const { ComprehensiveSDEImporter } = require('./dist/src/services/comprehensiveSDEImporter');
    
    const sdeBasePath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant/sde';
    const importer = new ComprehensiveSDEImporter(sdeBasePath);
    
    console.log('📦 Triggering full SDE import...');
    const stats = await importer.importFullSDE();
    
    console.log('✅ SDE import completed successfully!');
    console.log('📊 Import statistics:', stats);
    
    // Verify type_attributes were imported
    const Database = require('sqlite3').Database;
    const userDataPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant';
    const dbPath = path.join(userDataPath, 'eve-sde.db');
    
    const db = new Database(dbPath);
    db.get('SELECT COUNT(*) as count FROM type_attributes', (err, row) => {
      if (err) {
        console.error('❌ Failed to check type_attributes:', err);
      } else {
        console.log(`✅ Type attributes now in database: ${row.count}`);
      }
      db.close();
    });
    
  } catch (error) {
    console.error('❌ SDE import failed:', error);
    process.exit(1);
  }
}

triggerImport();