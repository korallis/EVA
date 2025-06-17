#!/usr/bin/env node

// Database schema validation and migration testing
const Database = require('sqlite3').Database;
const path = require('path');

const userDataPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant';
const dbPath = path.join(userDataPath, 'eve-sde.db');

console.log('🔍 DATABASE SCHEMA VALIDATION');
console.log('==============================\n');

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err);
    process.exit(1);
  }
  
  console.log('✅ Database connection established\n');
  performSchemaValidation();
});

async function performSchemaValidation() {
  try {
    // 1. Check table schemas
    await validateTableSchemas();
    
    // 2. Check indexes
    await validateIndexes();
    
    // 3. Check foreign key constraints
    await validateForeignKeys();
    
    // 4. Test complex query patterns
    await testComplexQueries();
    
    // 5. Validate data consistency
    await validateDataConsistency();
    
    console.log('\n✅ Schema validation completed');
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
  } finally {
    db.close();
  }
}

function validateTableSchemas() {
  return new Promise((resolve, reject) => {
    console.log('📊 1. TABLE SCHEMA VALIDATION');
    console.log('------------------------------');
    
    // Expected schemas for critical tables
    const expectedSchemas = {
      'inv_types': [
        'typeID INTEGER PRIMARY KEY',
        'groupID INTEGER',
        'categoryID INTEGER',
        'typeName TEXT NOT NULL',
        'description TEXT',
        'mass REAL DEFAULT 0',
        'volume REAL DEFAULT 0',
        'capacity REAL DEFAULT 0',
        'published INTEGER DEFAULT 1'
      ],
      'type_attributes': [
        'typeID INTEGER',
        'attributeID INTEGER',
        'value REAL NOT NULL',
        'PRIMARY KEY (typeID, attributeID)'
      ],
      'dogma_attributes': [
        'attributeID INTEGER PRIMARY KEY',
        'attributeName TEXT',
        'description TEXT',
        'defaultValue REAL DEFAULT 0'
      ]
    };
    
    const tableNames = Object.keys(expectedSchemas);
    let completed = 0;
    
    tableNames.forEach(tableName => {
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          console.log(`  ❌ ${tableName}: Schema check failed (${err.message})`);
        } else if (columns.length === 0) {
          console.log(`  ⚠️ ${tableName}: Table not found`);
        } else {
          console.log(`  ✅ ${tableName}: ${columns.length} columns`);
          
          // Check for critical columns
          const columnNames = columns.map(col => col.name);
          const criticalColumns = tableName === 'inv_types' ? ['typeID', 'typeName', 'groupID'] :
                                 tableName === 'type_attributes' ? ['typeID', 'attributeID', 'value'] :
                                 tableName === 'dogma_attributes' ? ['attributeID', 'attributeName'] : [];
          
          const missingColumns = criticalColumns.filter(col => !columnNames.includes(col));
          if (missingColumns.length > 0) {
            console.log(`    ⚠️ Missing critical columns: ${missingColumns.join(', ')}`);
          } else {
            console.log(`    ✅ All critical columns present`);
          }
        }
        
        completed++;
        if (completed === tableNames.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}

function validateIndexes() {
  return new Promise((resolve, reject) => {
    console.log('🔍 2. INDEX VALIDATION');
    console.log('----------------------');
    
    // Check for important indexes
    const expectedIndexes = [
      'idx_types_category',
      'idx_types_group',
      'idx_attributes_type',
      'idx_attributes_attribute'
    ];
    
    db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'", (err, indexes) => {
      if (err) {
        console.log('  ❌ Failed to check indexes:', err.message);
        resolve();
        return;
      }
      
      const indexNames = indexes.map(idx => idx.name);
      console.log(`  📊 Found ${indexNames.length} custom indexes`);
      
      expectedIndexes.forEach(expectedIndex => {
        if (indexNames.includes(expectedIndex)) {
          console.log(`  ✅ ${expectedIndex}: Present`);
        } else {
          console.log(`  ⚠️ ${expectedIndex}: Missing`);
        }
      });
      
      // Test index effectiveness
      console.log('\n  🚀 Testing index effectiveness:');
      
      const testQueries = [
        {
          name: 'Ship lookup by category',
          query: 'EXPLAIN QUERY PLAN SELECT * FROM inv_types WHERE categoryID = 6'
        },
        {
          name: 'Attribute lookup by type',
          query: 'EXPLAIN QUERY PLAN SELECT * FROM type_attributes WHERE typeID = 587'
        }
      ];
      
      let testCompleted = 0;
      
      testQueries.forEach(test => {
        db.all(test.query, (err, plan) => {
          if (err) {
            console.log(`    ❌ ${test.name}: Failed`);
          } else {
            const usesIndex = plan.some(step => step.detail && step.detail.includes('INDEX'));
            console.log(`    ${usesIndex ? '✅' : '⚠️'} ${test.name}: ${usesIndex ? 'Uses index' : 'Table scan'}`);
          }
          
          testCompleted++;
          if (testCompleted === testQueries.length) {
            console.log();
            resolve();
          }
        });
      });
    });
  });
}

function validateForeignKeys() {
  return new Promise((resolve, reject) => {
    console.log('🔗 3. FOREIGN KEY VALIDATION');
    console.log('-----------------------------');
    
    // Check foreign key constraints
    db.get('PRAGMA foreign_keys', (err, result) => {
      if (err) {
        console.log('  ❌ Failed to check foreign key setting:', err.message);
        resolve();
        return;
      }
      
      console.log(`  📊 Foreign keys enabled: ${result.foreign_keys ? 'Yes' : 'No'}`);
      
      // Test referential integrity manually since SQLite might not enforce it
      const integrityTests = [
        {
          name: 'Types → Groups relationship',
          query: `SELECT COUNT(*) as orphans FROM inv_types t 
                  LEFT JOIN groups g ON t.groupID = g.groupID 
                  WHERE g.groupID IS NULL AND t.groupID IS NOT NULL`
        },
        {
          name: 'Groups → Categories relationship',
          query: `SELECT COUNT(*) as orphans FROM groups g 
                  LEFT JOIN categories c ON g.categoryID = c.categoryID 
                  WHERE c.categoryID IS NULL AND g.categoryID IS NOT NULL`
        },
        {
          name: 'Type Attributes → Types relationship',
          query: `SELECT COUNT(*) as orphans FROM type_attributes ta 
                  LEFT JOIN inv_types t ON ta.typeID = t.typeID 
                  WHERE t.typeID IS NULL`
        }
      ];
      
      let testsCompleted = 0;
      
      integrityTests.forEach(test => {
        db.get(test.query, (err, result) => {
          if (err) {
            console.log(`  ❌ ${test.name}: Query failed`);
          } else {
            const orphans = result.orphans;
            if (orphans > 0) {
              console.log(`  ⚠️ ${test.name}: ${orphans.toLocaleString()} orphaned records`);
            } else {
              console.log(`  ✅ ${test.name}: No orphaned records`);
            }
          }
          
          testsCompleted++;
          if (testsCompleted === integrityTests.length) {
            console.log();
            resolve();
          }
        });
      });
    });
  });
}

function testComplexQueries() {
  return new Promise((resolve, reject) => {
    console.log('🎯 4. COMPLEX QUERY TESTING');
    console.log('----------------------------');
    
    const complexQueries = [
      {
        name: 'Ship with all attributes',
        query: `SELECT 
                  t.typeName,
                  COUNT(ta.attributeID) as attr_count,
                  GROUP_CONCAT(da.attributeName, ', ') as key_attributes
                FROM inv_types t
                LEFT JOIN type_attributes ta ON t.typeID = ta.typeID
                LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
                WHERE t.typeID = 587
                GROUP BY t.typeID`,
        validate: (result) => result.length > 0 && result[0].attr_count > 0
      },
      {
        name: 'Ships by category with stats',
        query: `SELECT 
                  c.categoryName,
                  g.groupName,
                  COUNT(t.typeID) as ship_count,
                  AVG(CAST(ta_mass.value AS REAL)) as avg_mass
                FROM categories c
                JOIN groups g ON c.categoryID = g.categoryID
                JOIN inv_types t ON g.groupID = t.groupID
                LEFT JOIN type_attributes ta_mass ON t.typeID = ta_mass.typeID AND ta_mass.attributeID = 4
                WHERE c.categoryID = 6 AND t.published = 1
                GROUP BY c.categoryID, g.groupID
                HAVING ship_count > 0
                ORDER BY ship_count DESC
                LIMIT 10`,
        validate: (result) => result.length > 0
      },
      {
        name: 'Attribute statistics',
        query: `SELECT 
                  da.attributeName,
                  COUNT(ta.typeID) as usage_count,
                  MIN(ta.value) as min_value,
                  MAX(ta.value) as max_value,
                  AVG(ta.value) as avg_value
                FROM dogma_attributes da
                JOIN type_attributes ta ON da.attributeID = ta.attributeID
                WHERE da.attributeName IN ('High Slots', 'Med Slots', 'Low Slots', 'CPU Output')
                GROUP BY da.attributeID
                ORDER BY usage_count DESC`,
        validate: (result) => result.length > 0
      }
    ];
    
    let completed = 0;
    
    complexQueries.forEach(test => {
      const startTime = Date.now();
      
      db.all(test.query, (err, results) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (err) {
          console.log(`  ❌ ${test.name}: Failed (${err.message})`);
        } else {
          const isValid = test.validate(results);
          console.log(`  ${isValid ? '✅' : '⚠️'} ${test.name}: ${duration}ms, ${results.length} results ${isValid ? '' : '(unexpected)'}`);
          
          if (results.length > 0 && results.length <= 3) {
            results.forEach(row => {
              console.log(`    📋 ${JSON.stringify(row)}`);
            });
          }
        }
        
        completed++;
        if (completed === complexQueries.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}

function validateDataConsistency() {
  return new Promise((resolve, reject) => {
    console.log('🔍 5. DATA CONSISTENCY VALIDATION');
    console.log('----------------------------------');
    
    const consistencyChecks = [
      {
        name: 'Ship slot count consistency',
        query: `SELECT 
                  t.typeName,
                  ta_high.value as high_slots,
                  ta_mid.value as mid_slots,
                  ta_low.value as low_slots
                FROM inv_types t
                LEFT JOIN type_attributes ta_high ON t.typeID = ta_high.typeID AND ta_high.attributeID = 14
                LEFT JOIN type_attributes ta_mid ON t.typeID = ta_mid.typeID AND ta_mid.attributeID = 13
                LEFT JOIN type_attributes ta_low ON t.typeID = ta_low.typeID AND ta_low.attributeID = 12
                WHERE t.categoryID = 6 AND t.published = 1
                AND (ta_high.value IS NULL OR ta_mid.value IS NULL OR ta_low.value IS NULL)
                LIMIT 5`,
        validate: (result) => {
          console.log(`    📊 Ships missing slot data: ${result.length}`);
          return true;
        }
      },
      {
        name: 'Attribute value ranges',
        query: `SELECT 
                  da.attributeName,
                  MIN(ta.value) as min_val,
                  MAX(ta.value) as max_val,
                  COUNT(CASE WHEN ta.value < 0 THEN 1 END) as negative_count,
                  COUNT(CASE WHEN ta.value = 0 THEN 1 END) as zero_count
                FROM dogma_attributes da
                JOIN type_attributes ta ON da.attributeID = ta.attributeID
                WHERE da.attributeName IN ('High Slots', 'Med Slots', 'Low Slots', 'CPU Output', 'Power Output')
                GROUP BY da.attributeID`,
        validate: (result) => {
          result.forEach(row => {
            console.log(`    📊 ${row.attributeName}: ${row.min_val}-${row.max_val} (${row.negative_count} negative, ${row.zero_count} zero)`);
          });
          return true;
        }
      },
      {
        name: 'Published vs unpublished ratio',
        query: `SELECT 
                  c.categoryName,
                  COUNT(CASE WHEN t.published = 1 THEN 1 END) as published,
                  COUNT(CASE WHEN t.published = 0 THEN 1 END) as unpublished,
                  COUNT(*) as total
                FROM categories c
                JOIN inv_types t ON c.categoryID = t.categoryID
                WHERE c.categoryID IN (6, 7, 8)
                GROUP BY c.categoryID`,
        validate: (result) => {
          result.forEach(row => {
            const pubPercent = (row.published / row.total * 100).toFixed(1);
            console.log(`    📊 ${row.categoryName}: ${row.published}/${row.total} published (${pubPercent}%)`);
          });
          return true;
        }
      }
    ];
    
    let completed = 0;
    
    consistencyChecks.forEach(check => {
      db.all(check.query, (err, results) => {
        if (err) {
          console.log(`  ❌ ${check.name}: Failed (${err.message})`);
        } else {
          console.log(`  ✅ ${check.name}:`);
          check.validate(results);
        }
        
        completed++;
        if (completed === consistencyChecks.length) {
          console.log();
          resolve();
        }
      });
    });
  });
}

performSchemaValidation();