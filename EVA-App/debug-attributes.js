#!/usr/bin/env node

// Debug script to check type attributes in database
const path = require('path');
const Database = require('sqlite3').Database;

const userDataPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant';
const dbPath = path.join(userDataPath, 'eve-sde.db');

console.log('🔍 Debugging ship attributes...');

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err);
    process.exit(1);
  }
  
  console.log('✅ Database opened successfully');
  
  // Check if type_attributes table exists and has data
  db.get('SELECT COUNT(*) as count FROM type_attributes', (err, row) => {
    if (err) {
      console.error('❌ type_attributes table error:', err);
      // Table might not exist - check table schema
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error('❌ Failed to get tables:', err);
          db.close();
          return;
        }
        console.log('📋 Available tables:', tables.map(t => t.name));
        
        // Check for attributes in other tables
        db.get('SELECT COUNT(*) as count FROM dogma_attributes', (err, dogmaRow) => {
          if (err) {
            console.error('❌ dogma_attributes table error:', err);
          } else {
            console.log(`📊 Dogma attributes: ${dogmaRow.count}`);
          }
          db.close();
        });
      });
      return;
    }
    
    console.log(`📊 Total type_attributes: ${row.count}`);
    
    if (row.count === 0) {
      console.log('⚠️ type_attributes table is empty!');
      db.close();
      return;
    }
    
    // Check for specific ship (Amarr Police Frigate ID: 3768)
    db.all(`
      SELECT ta.attributeID, ta.value, da.attributeName
      FROM type_attributes ta
      LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
      WHERE ta.typeID = 3768
      LIMIT 10
    `, (err, attrs) => {
      if (err) {
        console.error('❌ Failed to query ship attributes:', err);
        db.close();
        return;
      }
      
      console.log(`\n🚢 Amarr Police Frigate (3768) attributes: ${attrs.length}`);
      attrs.forEach(attr => {
        console.log(`  ${attr.attributeID}: ${attr.attributeName} = ${attr.value}`);
      });
      
      // Check a few random type_attributes
      db.all(`
        SELECT ta.typeID, ta.attributeID, ta.value, da.attributeName
        FROM type_attributes ta
        LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
        LIMIT 5
      `, (err, sample) => {
        if (err) {
          console.error('❌ Failed to query sample attributes:', err);
        } else {
          console.log(`\n📋 Sample type_attributes:`);
          sample.forEach(attr => {
            console.log(`  Type ${attr.typeID}: ${attr.attributeName} = ${attr.value}`);
          });
        }
        
        db.close();
      });
    });
  });
});