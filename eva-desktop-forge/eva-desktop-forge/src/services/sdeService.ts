import Database from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface ShipType {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  categoryID: number;
  categoryName: string;
  raceID?: number;
  raceName?: string;
  description: string;
  mass: number;
  volume: number;
  capacity: number;
  published: boolean;
}

export interface ModuleType {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  categoryID: number;
  categoryName: string;
  description: string;
  mass: number;
  volume: number;
  published: boolean;
  metaLevel: number;
  techLevel: number;
}

export interface TypeAttribute {
  typeID: number;
  attributeID: number;
  attributeName: string;
  value: number;
  unit?: string;
}

export interface SkillRequirement {
  typeID: number;
  skillTypeID: number;
  skillName: string;
  level: number;
}

export interface FittingSlot {
  slotType: 'high' | 'mid' | 'low' | 'rig' | 'subsystem' | 'service';
  index: number;
  moduleTypeID?: number;
  moduleName?: string;
  online: boolean;
}

export interface ShipFitting {
  shipTypeID: number;
  shipName: string;
  fittingName: string;
  slots: FittingSlot[];
  created: Date;
  modified: Date;
}

class SDEService {
  private db: Database.Database | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'eve-sde.db');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      this.db = new Database.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Failed to open SDE database:', err);
          reject(err);
          return;
        }

        console.log('✅ SDE database connected');
        this.createTables()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Categories
      `CREATE TABLE IF NOT EXISTS categories (
        categoryID INTEGER PRIMARY KEY,
        categoryName TEXT NOT NULL,
        published INTEGER DEFAULT 1
      )`,

      // Groups
      `CREATE TABLE IF NOT EXISTS groups (
        groupID INTEGER PRIMARY KEY,
        categoryID INTEGER,
        groupName TEXT NOT NULL,
        published INTEGER DEFAULT 1,
        anchorable INTEGER DEFAULT 0,
        anchored INTEGER DEFAULT 0,
        fittableNonSingleton INTEGER DEFAULT 0,
        useBasePrice INTEGER DEFAULT 0,
        FOREIGN KEY (categoryID) REFERENCES categories(categoryID)
      )`,

      // Market Groups
      `CREATE TABLE IF NOT EXISTS market_groups (
        marketGroupID INTEGER PRIMARY KEY,
        marketGroupName TEXT NOT NULL,
        description TEXT,
        parentGroupID INTEGER,
        hasTypes INTEGER DEFAULT 0,
        iconID INTEGER,
        FOREIGN KEY (parentGroupID) REFERENCES market_groups(marketGroupID)
      )`,

      // Ship and module types
      `CREATE TABLE IF NOT EXISTS inv_types (
        typeID INTEGER PRIMARY KEY,
        groupID INTEGER,
        categoryID INTEGER,
        typeName TEXT NOT NULL,
        description TEXT,
        mass REAL DEFAULT 0,
        volume REAL DEFAULT 0,
        capacity REAL DEFAULT 0,
        published INTEGER DEFAULT 1,
        marketGroupID INTEGER,
        portionSize INTEGER DEFAULT 1,
        raceID INTEGER,
        basePrice REAL DEFAULT 0,
        FOREIGN KEY (groupID) REFERENCES groups(groupID),
        FOREIGN KEY (categoryID) REFERENCES categories(categoryID),
        FOREIGN KEY (marketGroupID) REFERENCES market_groups(marketGroupID)
      )`,

      // Dogma Attributes
      `CREATE TABLE IF NOT EXISTS dogma_attributes (
        attributeID INTEGER PRIMARY KEY,
        attributeName TEXT,
        description TEXT,
        defaultValue REAL DEFAULT 0,
        highIsGood INTEGER DEFAULT 0,
        stackable INTEGER DEFAULT 0,
        unitID INTEGER,
        displayName TEXT,
        iconID INTEGER,
        published INTEGER DEFAULT 1
      )`,

      // Dogma Effects
      `CREATE TABLE IF NOT EXISTS dogma_effects (
        effectID INTEGER PRIMARY KEY,
        effectName TEXT,
        description TEXT,
        effectCategory INTEGER DEFAULT 0,
        preExpression INTEGER,
        postExpression INTEGER,
        published INTEGER DEFAULT 1,
        isOffensive INTEGER DEFAULT 0,
        isAssistance INTEGER DEFAULT 0,
        durationAttributeID INTEGER,
        rangeAttributeID INTEGER,
        dischargeAttributeID INTEGER,
        FOREIGN KEY (durationAttributeID) REFERENCES dogma_attributes(attributeID),
        FOREIGN KEY (rangeAttributeID) REFERENCES dogma_attributes(attributeID),
        FOREIGN KEY (dischargeAttributeID) REFERENCES dogma_attributes(attributeID)
      )`,

      // Type Attributes
      `CREATE TABLE IF NOT EXISTS type_attributes (
        typeID INTEGER,
        attributeID INTEGER,
        value REAL NOT NULL,
        PRIMARY KEY (typeID, attributeID),
        FOREIGN KEY (typeID) REFERENCES inv_types(typeID),
        FOREIGN KEY (attributeID) REFERENCES dogma_attributes(attributeID)
      )`,

      // Type Effects
      `CREATE TABLE IF NOT EXISTS type_effects (
        typeID INTEGER,
        effectID INTEGER,
        isDefault INTEGER DEFAULT 0,
        PRIMARY KEY (typeID, effectID),
        FOREIGN KEY (typeID) REFERENCES inv_types(typeID),
        FOREIGN KEY (effectID) REFERENCES dogma_effects(effectID)
      )`,

      // Skill requirements
      `CREATE TABLE IF NOT EXISTS skill_requirements (
        typeID INTEGER,
        skillTypeID INTEGER,
        skillLevel INTEGER,
        PRIMARY KEY (typeID, skillTypeID),
        FOREIGN KEY (typeID) REFERENCES inv_types(typeID),
        FOREIGN KEY (skillTypeID) REFERENCES inv_types(typeID)
      )`,

      // User fittings
      `CREATE TABLE IF NOT EXISTS fittings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipTypeID INTEGER,
        shipName TEXT,
        fittingName TEXT,
        fittingData TEXT, -- JSON
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shipTypeID) REFERENCES inv_types(typeID)
      )`,

      // SDE metadata
      `CREATE TABLE IF NOT EXISTS sde_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await this.runQuery(sql);
    }

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_categories_published ON categories(published)',
      'CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(categoryID)',
      'CREATE INDEX IF NOT EXISTS idx_groups_published ON groups(published)',
      'CREATE INDEX IF NOT EXISTS idx_market_groups_parent ON market_groups(parentGroupID)',
      'CREATE INDEX IF NOT EXISTS idx_types_category ON inv_types(categoryID)',
      'CREATE INDEX IF NOT EXISTS idx_types_group ON inv_types(groupID)',
      'CREATE INDEX IF NOT EXISTS idx_types_published ON inv_types(published)',
      'CREATE INDEX IF NOT EXISTS idx_types_market_group ON inv_types(marketGroupID)',
      'CREATE INDEX IF NOT EXISTS idx_types_race ON inv_types(raceID)',
      'CREATE INDEX IF NOT EXISTS idx_attributes_type ON type_attributes(typeID)',
      'CREATE INDEX IF NOT EXISTS idx_attributes_attribute ON type_attributes(attributeID)',
      'CREATE INDEX IF NOT EXISTS idx_effects_type ON type_effects(typeID)',
      'CREATE INDEX IF NOT EXISTS idx_effects_effect ON type_effects(effectID)',
      'CREATE INDEX IF NOT EXISTS idx_skills_type ON skill_requirements(typeID)',
      'CREATE INDEX IF NOT EXISTS idx_skills_skill ON skill_requirements(skillTypeID)',
      'CREATE INDEX IF NOT EXISTS idx_fittings_ship ON fittings(shipTypeID)'
    ];

    for (const sql of indexes) {
      await this.runQuery(sql);
    }

    // Initialize with basic data if empty
    await this.initializeBasicData();
  }

  private async initializeBasicData(): Promise<void> {
    try {
      const shipCount = await this.getQuery('SELECT COUNT(*) as count FROM inv_types WHERE categoryID = 6');
      
      if (shipCount.count === 0) {
        console.log('⚠️ No SDE data found - loading demo data for testing');
        await this.loadDemoData();
      } else if (shipCount.count <= 20) {
        console.log('⚠️ Only demo data found (', shipCount.count, 'ships) - comprehensive import needed');
        console.log('💡 To load full SDE data, use: startupSDEManager.checkAndUpdateSDE()');
      } else {
        console.log('✅ SDE data already loaded:', shipCount.count, 'ships found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize basic data:', error);
    }
  }

  private async loadDemoData(): Promise<void> {
    console.log('📦 Loading demo ship and module data...');
    
    try {
      // Insert basic categories
      await this.runQuery(`INSERT OR IGNORE INTO categories (categoryID, categoryName, published) VALUES 
        (6, 'Ship', 1),
        (7, 'Module', 1),
        (8, 'Charge', 1)`);

      // Insert basic groups  
      await this.runQuery(`INSERT OR IGNORE INTO groups (groupID, categoryID, groupName, published) VALUES
        (25, 6, 'Frigate', 1),
        (26, 6, 'Cruiser', 1),
        (27, 6, 'Battleship', 1),
        (53, 7, 'Energy Weapon', 1),
        (55, 7, 'Projectile Weapon', 1),
        (56, 7, 'Missile Launcher', 1),
        (40, 7, 'Shield Booster', 1),
        (77, 7, 'Armor Repair Unit', 1)`);

      // Insert demo ships
      await this.runQuery(`INSERT OR IGNORE INTO inv_types (typeID, groupID, categoryID, typeName, description, mass, volume, capacity, published) VALUES
        (588, 25, 6, 'Rifter', 'Minmatar Frigate', 1067000, 27289, 140, 1),
        (593, 25, 6, 'Punisher', 'Amarr Frigate', 1185000, 27289, 185, 1),
        (608, 25, 6, 'Tristan', 'Gallente Frigate', 1045000, 27289, 200, 1),
        (621, 25, 6, 'Merlin', 'Caldari Frigate', 1078000, 27289, 155, 1),
        (622, 26, 6, 'Thorax', 'Gallente Cruiser', 10400000, 116000, 400, 1),
        (627, 26, 6, 'Caracal', 'Caldari Cruiser', 10790000, 116000, 470, 1),
        (630, 26, 6, 'Stabber', 'Minmatar Cruiser', 9560000, 116000, 420, 1),
        (633, 26, 6, 'Arbitrator', 'Amarr Cruiser', 10560000, 116000, 450, 1),
        (638, 27, 6, 'Megathron', 'Gallente Battleship', 100200000, 468000, 725, 1),
        (639, 27, 6, 'Raven', 'Caldari Battleship', 108400000, 468000, 780, 1)`);

      // Insert demo modules
      await this.runQuery(`INSERT OR IGNORE INTO inv_types (typeID, groupID, categoryID, typeName, description, mass, volume, capacity, published) VALUES
        (2046, 53, 7, 'Dual Light Pulse Laser I', 'Basic energy weapon', 1000, 5, 0, 1),
        (3057, 53, 7, 'Heavy Pulse Laser I', 'Medium energy weapon', 4000, 25, 0, 1),
        (2488, 55, 7, '125mm Railgun I', 'Basic hybrid weapon', 1500, 5, 0, 1),
        (2969, 55, 7, '200mm Railgun I', 'Medium hybrid weapon', 5000, 25, 0, 1),
        (2410, 56, 7, 'Light Missile Launcher I', 'Basic missile launcher', 1200, 5, 0, 1),
        (2547, 56, 7, 'Assault Missile Launcher I', 'Advanced missile launcher', 1800, 5, 0, 1),
        (2281, 40, 7, 'Small Shield Booster I', 'Basic shield booster', 500, 5, 0, 1),
        (2282, 40, 7, 'Medium Shield Booster I', 'Medium shield booster', 2000, 25, 0, 1),
        (519, 77, 7, 'Small Armor Repairer I', 'Basic armor repairer', 800, 5, 0, 1),
        (1352, 77, 7, 'Medium Armor Repairer I', 'Medium armor repairer', 3200, 25, 0, 1)`);

      console.log('✅ Demo data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load demo data:', error);
    }
  }

  // This method is no longer used - all data comes from comprehensive SDE import
  private async loadBasicEVEData(): Promise<void> {
    console.log('⚠️ loadBasicEVEData() is deprecated - use comprehensive SDE import instead');
    // All ship and module data now comes from the comprehensive SDE importer
    // This method is kept for backwards compatibility but does nothing
  }

  async getShips(): Promise<ShipType[]> {
    const ships = await this.allQuery(`
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
        t.description, 
        t.mass, 
        t.volume, 
        t.capacity, 
        t.published 
      FROM inv_types t
      LEFT JOIN groups g ON t.groupID = g.groupID
      LEFT JOIN categories c ON t.categoryID = c.categoryID
      WHERE t.categoryID = 6
      ORDER BY t.groupID, t.typeName
    `);

    return ships.map(ship => ({
      ...ship,
      published: Boolean(ship.published)
    }));
  }

  async getModules(): Promise<ModuleType[]> {
    const modules = await this.allQuery(`
      SELECT 
        t.typeID, 
        t.typeName, 
        t.groupID, 
        g.groupName,
        t.categoryID, 
        c.categoryName,
        t.description, 
        t.mass, 
        t.volume, 
        t.published,
        COALESCE(ta_meta.value, 0) as metaLevel,
        COALESCE(ta_tech.value, 1) as techLevel
      FROM inv_types t
      LEFT JOIN groups g ON t.groupID = g.groupID
      LEFT JOIN categories c ON t.categoryID = c.categoryID
      LEFT JOIN type_attributes ta_meta ON t.typeID = ta_meta.typeID AND ta_meta.attributeID = 633
      LEFT JOIN type_attributes ta_tech ON t.typeID = ta_tech.typeID AND ta_tech.attributeID = 422
      WHERE t.categoryID IN (7, 8, 18, 32)
      ORDER BY t.groupID, t.typeName
    `);

    return modules.map(module => ({
      ...module,
      published: Boolean(module.published),
      metaLevel: Number(module.metaLevel) || 0,
      techLevel: Number(module.techLevel) || 1
    }));
  }

  async getTypeAttributes(typeID: number): Promise<TypeAttribute[]> {
    return this.allQuery(`
      SELECT 
        ta.typeID, 
        ta.attributeID, 
        da.attributeName, 
        ta.value,
        da.unitID as unit
      FROM type_attributes ta
      LEFT JOIN dogma_attributes da ON ta.attributeID = da.attributeID
      WHERE ta.typeID = ?
      ORDER BY da.attributeName
    `, [typeID]);
  }

  async getSkillRequirements(typeID: number): Promise<SkillRequirement[]> {
    return this.allQuery(`
      SELECT typeID, skillTypeID, skillName, level
      FROM skill_requirements 
      WHERE typeID = ?
    `, [typeID]);
  }

  async saveFitting(fitting: Omit<ShipFitting, 'created' | 'modified'>): Promise<number> {
    const result = await this.runQuery(`
      INSERT INTO fittings (shipTypeID, shipName, fittingName, fittingData)
      VALUES (?, ?, ?, ?)
    `, [fitting.shipTypeID, fitting.shipName, fitting.fittingName, JSON.stringify(fitting.slots)]);

    return result.lastID as number;
  }

  async getFittings(): Promise<ShipFitting[]> {
    const fittings = await this.allQuery(`
      SELECT id, shipTypeID, shipName, fittingName, fittingData, created, modified
      FROM fittings
      ORDER BY modified DESC
    `);

    return fittings.map(fit => ({
      shipTypeID: fit.shipTypeID,
      shipName: fit.shipName,
      fittingName: fit.fittingName,
      slots: JSON.parse(fit.fittingData),
      created: new Date(fit.created),
      modified: new Date(fit.modified)
    }));
  }

  // Helper methods
  runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Helper method for getting categoryID from groupID
  async getCategoryIDFromGroupID(groupID: number): Promise<number | null> {
    const result = await this.getQuery('SELECT categoryID FROM groups WHERE groupID = ?', [groupID]);
    return result ? result.categoryID : null;
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tables = [
      'type_effects',
      'type_attributes', 
      'inv_types',
      'dogma_effects',
      'dogma_attributes',
      'market_groups',
      'groups',
      'categories',
      'skill_requirements', 
      'fittings', 
      'sde_metadata'
    ];
    
    for (const table of tables) {
      await this.runQuery(`DELETE FROM ${table}`);
    }
    
    console.log('🗑️ Database cleared for fresh SDE import');
  }
}

export const sdeService = new SDEService();

// Public method for comprehensive SDE importer to use
export { SDEService };