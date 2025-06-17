#!/usr/bin/env node

// Comprehensive database analysis script
const Database = require('sqlite3').Database;
const path = require('path');

const userDataPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant';
const dbPath = path.join(userDataPath, 'eve-sde.db');

console.log('🔍 Comprehensive Database Analysis for EVA Desktop');
console.log('===============================================\n');

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err);
    process.exit(1);
  }
  
  console.log('✅ Database connection established\n');
  
  // Run comprehensive analysis
  performAnalysis();
});

async function performAnalysis() {
  try {
    // 1. Database schema analysis
    await analyzeSchema();
    
    // 2. Data integrity checks
    await checkDataIntegrity();
    
    // 3. Query performance tests
    await testQueryPerformance();
    
    // 4. Common data validation
    await validateCommonData();
    
    // 5. Error handling tests
    await testErrorHandling();
    
    console.log('\n✅ Database analysis completed successfully');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    db.close();
  }
}

function analyzeSchema() {
  return new Promise((resolve, reject) => {
    console.log('📊 1. DATABASE SCHEMA ANALYSIS');
    console.log('--------------------------------');
    
    // Get all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`📋 Found ${tables.length} tables:`);
      tables.forEach(table => console.log(`  - ${table.name}`));
      
      // Check table sizes
      const tablePromises = tables.map(table => {
        return new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
            if (err) {
              console.log(`  ⚠️ ${table.name}: Error reading (${err.message})`);
              resolve({ name: table.name, count: 0, error: err.message });
            } else {
              console.log(`  📊 ${table.name}: ${row.count.toLocaleString()} rows`);
              resolve({ name: table.name, count: row.count });
            }
          });
        });
      });
      
      Promise.all(tablePromises).then(() => {
        console.log();
        resolve();
      });
    });
  });
}

function checkDataIntegrity() {
  return new Promise((resolve, reject) => {
    console.log('🔍 2. DATA INTEGRITY CHECKS');
    console.log('----------------------------');
    
    const checks = [
      // Check for orphaned foreign keys
      {
        name: 'Type attributes without valid types',
        query: `SELECT COUNT(*) as count FROM type_attributes ta 
                LEFT JOIN inv_types t ON ta.typeID = t.typeID 
                WHERE t.typeID IS NULL`
      },
      {
        name: 'Type attributes without valid attributes',
        query: `SELECT COUNT(*) as count FROM type_attributes ta 
                LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID 
                WHERE da.attributeID IS NULL`
      },
      {
        name: 'Groups without valid categories',
        query: `SELECT COUNT(*) as count FROM groups g 
                LEFT JOIN categories c ON g.categoryID = c.categoryID 
                WHERE c.categoryID IS NULL`
      },
      {
        name: 'Types without valid groups',
        query: `SELECT COUNT(*) as count FROM inv_types t 
                LEFT JOIN groups g ON t.groupID = g.groupID 
                WHERE g.groupID IS NULL`
      },
      // Check for missing critical attributes
      {
        name: 'Ships missing slot attributes',
        query: `SELECT COUNT(DISTINCT t.typeID) as count FROM inv_types t 
                WHERE t.categoryID = 6 AND t.published = 1
                AND NOT EXISTS (
                  SELECT 1 FROM type_attributes ta 
                  WHERE ta.typeID = t.typeID AND ta.attributeID IN (12, 13, 14)
                )`
      },
      // Check for null/invalid values
      {
        name: 'Type attributes with NULL values',
        query: `SELECT COUNT(*) as count FROM type_attributes WHERE value IS NULL`
      },
      {
        name: 'Types with missing names',
        query: `SELECT COUNT(*) as count FROM inv_types WHERE typeName IS NULL OR typeName = ''`
      }
    ];
    
    let completed = 0;
    
    checks.forEach(check => {
      db.get(check.query, (err, row) => {
        if (err) {
          console.log(`  ❌ ${check.name}: Query failed (${err.message})`);
        } else {
          const count = row.count;
          if (count > 0) {
            console.log(`  ⚠️ ${check.name}: ${count.toLocaleString()} issues found`);
          } else {
            console.log(`  ✅ ${check.name}: No issues`);
          }
        }
        
        completed++;
        if (completed === checks.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}

function testQueryPerformance() {
  return new Promise((resolve, reject) => {
    console.log('⚡ 3. QUERY PERFORMANCE TESTS');
    console.log('-----------------------------');
    
    const queries = [
      {
        name: 'Get all ships',
        query: `SELECT COUNT(*) as count FROM inv_types WHERE categoryID = 6`
      },
      {
        name: 'Get ship with attributes',
        query: `SELECT t.typeName, COUNT(ta.attributeID) as attr_count
                FROM inv_types t
                LEFT JOIN type_attributes ta ON t.typeID = ta.typeID
                WHERE t.typeID = 587
                GROUP BY t.typeID`
      },
      {
        name: 'Complex ship query with joins',
        query: `SELECT t.typeName, g.groupName, c.categoryName, COUNT(ta.attributeID) as attrs
                FROM inv_types t
                LEFT JOIN groups g ON t.groupID = g.groupID
                LEFT JOIN categories c ON t.categoryID = c.categoryID
                LEFT JOIN type_attributes ta ON t.typeID = ta.typeID
                WHERE t.categoryID = 6 AND t.published = 1
                GROUP BY t.typeID
                LIMIT 10`
      },
      {
        name: 'Attribute search by name',
        query: `SELECT da.attributeName, COUNT(ta.typeID) as type_count
                FROM dogma_attributes da
                LEFT JOIN type_attributes ta ON da.attributeID = ta.attributeID
                WHERE da.attributeName LIKE '%Slot%'
                GROUP BY da.attributeID`
      }
    ];
    
    let completed = 0;
    
    queries.forEach(query => {
      const startTime = Date.now();
      
      db.all(query.query, (err, rows) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (err) {
          console.log(`  ❌ ${query.name}: Failed (${err.message})`);
        } else {
          console.log(`  ⚡ ${query.name}: ${duration}ms (${rows.length} results)`);
        }
        
        completed++;
        if (completed === queries.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}

function validateCommonData() {
  return new Promise((resolve, reject) => {
    console.log('🎯 4. COMMON DATA VALIDATION');
    console.log('-----------------------------');
    
    // Test specific important ships and modules
    const testCases = [
      {
        name: 'Rifter (Minmatar Frigate)',
        query: `SELECT t.typeName, ta.attributeID, ta.value, da.attributeName
                FROM inv_types t
                LEFT JOIN type_attributes ta ON t.typeID = ta.typeID
                LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
                WHERE t.typeID = 587 AND ta.attributeID IN (12, 13, 14, 48, 11)
                ORDER BY ta.attributeID`
      },
      {
        name: 'Popular Cruiser Check',
        query: `SELECT t.typeName, g.groupName
                FROM inv_types t
                LEFT JOIN groups g ON t.groupID = g.groupID
                WHERE t.typeName IN ('Caracal', 'Vexor', 'Thorax', 'Stabber')
                AND t.categoryID = 6`
      },
      {
        name: 'Module Categories',
        query: `SELECT c.categoryName, COUNT(*) as count
                FROM inv_types t
                LEFT JOIN categories c ON t.categoryID = c.categoryID
                WHERE t.categoryID IN (7, 8, 18, 32)
                GROUP BY c.categoryID`
      },
      {
        name: 'Attribute Name Coverage',
        query: `SELECT 
                  COUNT(CASE WHEN da.attributeName IS NOT NULL THEN 1 END) as named,
                  COUNT(*) as total
                FROM type_attributes ta
                LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
                LIMIT 1`
      }
    ];
    
    let completed = 0;
    
    testCases.forEach(test => {
      db.all(test.query, (err, rows) => {
        if (err) {
          console.log(`  ❌ ${test.name}: Query failed (${err.message})`);
        } else {
          console.log(`  📋 ${test.name}: ${rows.length} results`);
          if (rows.length > 0 && rows.length <= 5) {
            rows.forEach(row => {
              console.log(`    ${JSON.stringify(row)}`);
            });
          }
        }
        
        completed++;
        if (completed === testCases.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}

function testErrorHandling() {
  return new Promise((resolve, reject) => {
    console.log('🛡️ 5. ERROR HANDLING TESTS');
    console.log('---------------------------');
    
    const errorTests = [
      {
        name: 'Invalid table query',
        query: 'SELECT * FROM nonexistent_table'
      },
      {
        name: 'Invalid column query',
        query: 'SELECT nonexistent_column FROM inv_types'
      },
      {
        name: 'Malformed SQL',
        query: 'SELECT * FROM inv_types WHERE'
      }
    ];
    
    let completed = 0;
    
    errorTests.forEach(test => {
      db.get(test.query, (err, row) => {
        if (err) {
          console.log(`  ✅ ${test.name}: Properly handled error (${err.message.substring(0, 50)}...)`);
        } else {
          console.log(`  ⚠️ ${test.name}: Should have failed but didn't`);
        }
        
        completed++;
        if (completed === errorTests.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}