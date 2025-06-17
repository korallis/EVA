#!/usr/bin/env node

// Direct database fix script to populate type_attributes table
const Database = require('sqlite3').Database;
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const userDataPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant';
const dbPath = path.join(userDataPath, 'eve-sde.db');
const sdeBasePath = path.join(userDataPath, 'sde');
const typeDogmaPath = path.join(sdeBasePath, 'fsd', 'typeDogma.yaml');

console.log('🔧 Starting direct database type_attributes fix...');

// Open database
const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err);
    process.exit(1);
  }
  
  console.log('✅ Database opened successfully');
  
  // Check if typeDogma.yaml exists
  if (!fs.existsSync(typeDogmaPath)) {
    console.error('❌ typeDogma.yaml not found at:', typeDogmaPath);
    db.close();
    process.exit(1);
  }
  
  console.log('📄 Found typeDogma.yaml, loading...');
  
  try {
    // Load and parse typeDogma.yaml
    const typeDogmaYaml = fs.readFileSync(typeDogmaPath, 'utf8');
    const typeDogmaData = yaml.load(typeDogmaYaml);
    
    console.log(`📊 Loaded dogma data for ${Object.keys(typeDogmaData).length} types`);
    
    // Clear existing type_attributes
    db.run('DELETE FROM type_attributes', (err) => {
      if (err) {
        console.error('❌ Failed to clear type_attributes:', err);
        db.close();
        return;
      }
      
      console.log('🗑️ Cleared existing type_attributes');
      
      // Prepare batch insert
      const attributeEntries = [];
      let processedTypes = 0;
      
      for (const [typeId, dogmaInfo] of Object.entries(typeDogmaData)) {
        const typeID = parseInt(typeId);
        
        // Import dogma attributes for this type
        if (dogmaInfo.dogmaAttributes && Array.isArray(dogmaInfo.dogmaAttributes)) {
          for (const attribute of dogmaInfo.dogmaAttributes) {
            const numericValue = parseFloat(attribute.value);
            // Skip null, undefined, or NaN values
            if (attribute.value !== null && attribute.value !== undefined && !isNaN(numericValue)) {
              attributeEntries.push({
                typeID,
                attributeID: parseInt(attribute.attributeID),
                value: numericValue
              });
            }
          }
          processedTypes++;
        }
      }
      
      console.log(`📋 Prepared ${attributeEntries.length} attribute entries for ${processedTypes} types`);
      
      if (attributeEntries.length === 0) {
        console.log('⚠️ No attributes to import');
        db.close();
        return;
      }
      
      // Insert in batches
      const batchSize = 500;
      let inserted = 0;
      
      function insertBatch(startIndex) {
        const endIndex = Math.min(startIndex + batchSize, attributeEntries.length);
        const batch = attributeEntries.slice(startIndex, endIndex);
        
        if (batch.length === 0) {
          console.log(`✅ Import completed: ${inserted} type attributes inserted`);
          
          // Verify with a test query
          db.get('SELECT COUNT(*) as count FROM type_attributes', (err, row) => {
            if (err) {
              console.error('❌ Failed to verify import:', err);
            } else {
              console.log(`🔍 Verification: ${row.count} total type_attributes in database`);
              
              // Test specific ship (Rifter, typeID 587)
              db.all(`
                SELECT ta.attributeID, ta.value, da.attributeName
                FROM type_attributes ta
                LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
                WHERE ta.typeID = 587
                AND ta.attributeID IN (12, 13, 14, 48, 49, 50)
                ORDER BY ta.attributeID
              `, (err, attrs) => {
                if (err) {
                  console.error('❌ Failed to test ship attributes:', err);
                } else {
                  console.log(`\\n🚢 Rifter (587) key attributes: ${attrs.length}`);
                  attrs.forEach(attr => {
                    console.log(`  ${attr.attributeID}: ${attr.attributeName} = ${attr.value}`);
                  });
                  
                  if (attrs.length > 0) {
                    console.log('\\n🎉 SUCCESS: Type attributes successfully imported!');
                    console.log('📝 The ship fitting display should now show proper slot counts.');
                  } else {
                    console.log('\\n⚠️ WARNING: No attributes found for test ship');
                  }
                }
                db.close();
              });
            }
          });
          return;
        }
        
        const placeholders = batch.map(() => '(?, ?, ?)').join(', ');
        const values = batch.flatMap(attr => [attr.typeID, attr.attributeID, attr.value]);
        
        db.run(
          `INSERT OR REPLACE INTO type_attributes (typeID, attributeID, value) VALUES ${placeholders}`,
          values,
          function(err) {
            if (err) {
              console.error('❌ Failed to insert batch:', err);
              db.close();
              return;
            }
            
            inserted += batch.length;
            console.log(`📈 Inserted ${inserted}/${attributeEntries.length} attributes...`);
            
            // Continue with next batch
            insertBatch(endIndex);
          }
        );
      }
      
      // Start inserting
      insertBatch(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to process typeDogma.yaml:', error);
    db.close();
    process.exit(1);
  }
});