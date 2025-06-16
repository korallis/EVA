const path = require('path');
const Database = require('sqlite3').Database;
const { app } = require('electron');

// Mock app.getPath for testing
if (!app) {
  global.app = {
    getPath: (name) => {
      if (name === 'userData') {
        return '/Users/lee/Library/Application Support/eva-desktop';
      }
      return '/tmp';
    }
  };
}

async function testVexor() {
  try {
    // Try to find the SDE database
    const dbPath = '/Users/lee/Library/Application Support/EVA - EVE Virtual Assistant/eve-sde.db';
    
    console.log('Looking for database at:', dbPath);
    
    const db = new Database(dbPath);
    
    // Query for Vexor specifically
    const vexorQuery = `
      SELECT 
        t.typeID, 
        t.typeName, 
        t.groupID, 
        g.groupName,
        t.categoryID, 
        c.categoryName,
        t.raceID, 
        CASE 
          WHEN t.raceID = 1 THEN 'Caldari State'
          WHEN t.raceID = 2 THEN 'Minmatar Republic' 
          WHEN t.raceID = 4 THEN 'Amarr Empire'
          WHEN t.raceID = 8 THEN 'Gallente Federation'
          ELSE 'Unknown'
        END as raceName,
        t.published 
      FROM inv_types t
      LEFT JOIN groups g ON t.groupID = g.groupID
      LEFT JOIN categories c ON t.categoryID = c.categoryID
      WHERE t.categoryID = 6 AND t.typeName LIKE '%Vexor%'
      ORDER BY t.typeName
    `;
    
    db.all(vexorQuery, [], (err, rows) => {
      if (err) {
        console.error('Query error:', err);
        return;
      }
      
      console.log('Vexor ships found:');
      rows.forEach(ship => {
        console.log(`- ${ship.typeName} (Group: ${ship.groupName}, Race: ${ship.raceName})`);
      });
      
      if (rows.length === 0) {
        console.log('No Vexor ships found! Checking all cruisers...');
        
        const cruiserQuery = `
          SELECT 
            t.typeID, 
            t.typeName, 
            t.groupID, 
            g.groupName,
            t.raceID, 
            CASE 
              WHEN t.raceID = 1 THEN 'Caldari State'
              WHEN t.raceID = 2 THEN 'Minmatar Republic' 
              WHEN t.raceID = 4 THEN 'Amarr Empire'
              WHEN t.raceID = 8 THEN 'Gallente Federation'
              ELSE 'Unknown'
            END as raceName
          FROM inv_types t
          LEFT JOIN groups g ON t.groupID = g.groupID
          WHERE t.categoryID = 6 AND g.groupName = 'Cruiser'
          ORDER BY t.typeName
          LIMIT 20
        `;
        
        db.all(cruiserQuery, [], (err, cruisers) => {
          if (err) {
            console.error('Cruiser query error:', err);
            return;
          }
          
          console.log('Sample cruisers:');
          cruisers.forEach(ship => {
            console.log(`- ${ship.typeName} (Race: ${ship.raceName})`);
          });
          
          db.close();
        });
      } else {
        db.close();
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVexor();
