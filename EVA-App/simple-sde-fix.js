#!/usr/bin/env node

// Simple script to check and fix the type_attributes issue
const Database = require('sqlite3').Database;
const path = require('path');
const userDataPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant';
const dbPath = path.join(userDataPath, 'eve-sde.db');

console.log('🔍 Checking type_attributes table...');

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err);
    process.exit(1);
  }
  
  // Check current count
  db.get('SELECT COUNT(*) as count FROM type_attributes', (err, row) => {
    if (err) {
      console.error('❌ Failed to check type_attributes:', err);
      db.close();
      return;
    }
    
    console.log(`📊 Current type_attributes count: ${row.count}`);
    
    if (row.count > 0) {
      console.log('✅ Type attributes already exist! Testing with a specific ship...');
      
      // Test specific ship (Rifter, typeID 587)
      db.all(`
        SELECT ta.attributeID, ta.value, da.attributeName
        FROM type_attributes ta
        LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
        WHERE ta.typeID = 587
        AND ta.attributeID IN (12, 13, 14, 48, 49, 50) -- CPU, powergrid, high/mid/low slots
        ORDER BY ta.attributeID
      `, (err, attrs) => {
        if (err) {
          console.error('❌ Failed to query ship attributes:', err);
        } else {
          console.log(`\\n🚢 Rifter (587) key attributes: ${attrs.length}`);
          attrs.forEach(attr => {
            console.log(`  ${attr.attributeID}: ${attr.attributeName} = ${attr.value}`);
          });
        }
        db.close();
      });
    } else {
      console.log('⚠️ No type attributes found - the comprehensive SDE import needs to be run.');
      console.log('🚀 The app should trigger this automatically, but you can also manually trigger it from the Ship Fitting settings.');
      db.close();
    }
  });
});