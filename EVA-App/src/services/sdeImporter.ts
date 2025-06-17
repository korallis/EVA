import { sdeService } from './sdeService';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface SDETypeData {
  typeID: number;
  groupID: number;
  typeName: any; // Multi-language object
  description?: any;
  mass?: number;
  volume?: number;
  capacity?: number;
  published?: boolean;
  marketGroupID?: number;
  portionSize?: number;
  raceID?: number;
}

interface SDEGroupData {
  groupID: number;
  categoryID: number;
  groupName: any;
  published?: boolean;
}

interface SDECategoryData {
  categoryID: number;
  categoryName: any;
  published?: boolean;
}

interface SDEAttributeData {
  attributeID: number;
  attributeName?: string;
  description?: string;
  defaultValue?: number;
  highIsGood?: boolean;
  stackable?: boolean;
  unitID?: number;
  displayName?: string;
}

interface SDETypeAttributeData {
  [typeID: string]: {
    [attributeID: string]: number;
  };
}

export class SDEImporter {
  private sdeDataPath: string;
  private batchSize = 1000;

  constructor() {
    // SDE data should be placed in the userData folder
    const userDataPath = app.getPath('userData');
    this.sdeDataPath = path.join(userDataPath, 'sde');
  }

  async importFullSDE(): Promise<void> {
    console.log('🚀 Starting comprehensive SDE import...');

    try {
      // Check if SDE data exists
      if (!fs.existsSync(this.sdeDataPath)) {
        console.error('❌ SDE data not found at:', this.sdeDataPath);
        console.log('ℹ️ Please download the latest SDE from https://developers.eveonline.com/resource/resources');
        console.log('ℹ️ Extract the YAML files to:', this.sdeDataPath);
        return;
      }

      // Import in order
      await this.importCategories();
      await this.importGroups();
      await this.importTypes();
      await this.importTypeAttributes();
      await this.importAdditionalAttributes();

      console.log('✅ SDE import completed successfully');
    } catch (error) {
      console.error('❌ SDE import failed:', error);
      throw error;
    }
  }

  private async importCategories(): Promise<void> {
    console.log('📦 Importing categories...');
    
    const categoriesPath = path.join(this.sdeDataPath, 'fsd', 'categoryIDs.yaml');
    if (!fs.existsSync(categoriesPath)) {
      console.warn('⚠️ Categories file not found, using defaults');
      await this.insertDefaultCategories();
      return;
    }

    // For now, we'll use default categories since YAML parsing requires additional dependencies
    await this.insertDefaultCategories();
  }

  private async insertDefaultCategories(): Promise<void> {
    const categories = [
      { categoryID: 6, categoryName: 'Ship', published: true },
      { categoryID: 7, categoryName: 'Module', published: true },
      { categoryID: 8, categoryName: 'Charge', published: true },
      { categoryID: 18, categoryName: 'Drone', published: true },
      { categoryID: 20, categoryName: 'Implant', published: true },
      { categoryID: 22, categoryName: 'Deployable', published: true },
      { categoryID: 23, categoryName: 'Starbase', published: true },
      { categoryID: 32, categoryName: 'Subsystem', published: true },
      { categoryID: 65, categoryName: 'Structure', published: true },
      { categoryID: 66, categoryName: 'Structure Module', published: true },
      { categoryID: 87, categoryName: 'Fighter', published: true },
    ];

    for (const category of categories) {
      await this.runQuery(
        `INSERT OR REPLACE INTO inv_categories (categoryID, categoryName, published) VALUES (?, ?, ?)`,
        [category.categoryID, category.categoryName, category.published ? 1 : 0]
      );
    }

    // Create categories table if it doesn't exist
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS inv_categories (
        categoryID INTEGER PRIMARY KEY,
        categoryName TEXT NOT NULL,
        published INTEGER DEFAULT 1
      )
    `);
  }

  private async importGroups(): Promise<void> {
    console.log('📦 Importing groups...');
    
    // Create groups table if it doesn't exist
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS inv_groups (
        groupID INTEGER PRIMARY KEY,
        categoryID INTEGER,
        groupName TEXT NOT NULL,
        published INTEGER DEFAULT 1
      )
    `);

    // Insert common ship groups
    const shipGroups = [
      // Frigates
      { groupID: 25, categoryID: 6, groupName: 'Frigate' },
      { groupID: 237, categoryID: 6, groupName: 'Rookie ship' },
      { groupID: 324, categoryID: 6, groupName: 'Assault Frigate' },
      { groupID: 830, categoryID: 6, groupName: 'Covert Ops' },
      { groupID: 831, categoryID: 6, groupName: 'Interceptor' },
      { groupID: 893, categoryID: 6, groupName: 'Electronic Attack Ship' },
      { groupID: 1283, categoryID: 6, groupName: 'Expedition Frigate' },
      { groupID: 1527, categoryID: 6, groupName: 'Logistics Frigate' },
      
      // Destroyers
      { groupID: 420, categoryID: 6, groupName: 'Destroyer' },
      { groupID: 541, categoryID: 6, groupName: 'Interdictor' },
      { groupID: 1534, categoryID: 6, groupName: 'Command Destroyer' },
      { groupID: 1305, categoryID: 6, groupName: 'Tactical Destroyer' },
      
      // Cruisers
      { groupID: 26, categoryID: 6, groupName: 'Cruiser' },
      { groupID: 358, categoryID: 6, groupName: 'Heavy Assault Cruiser' },
      { groupID: 833, categoryID: 6, groupName: 'Force Recon Ship' },
      { groupID: 832, categoryID: 6, groupName: 'Logistics' },
      { groupID: 906, categoryID: 6, groupName: 'Combat Recon Ship' },
      { groupID: 894, categoryID: 6, groupName: 'Heavy Interdiction Cruiser' },
      { groupID: 963, categoryID: 6, groupName: 'Strategic Cruiser' },
      
      // Battlecruisers
      { groupID: 419, categoryID: 6, groupName: 'Combat Battlecruiser' },
      { groupID: 540, categoryID: 6, groupName: 'Command Ship' },
      { groupID: 1201, categoryID: 6, groupName: 'Attack Battlecruiser' },
      
      // Battleships
      { groupID: 27, categoryID: 6, groupName: 'Battleship' },
      { groupID: 898, categoryID: 6, groupName: 'Black Ops' },
      { groupID: 900, categoryID: 6, groupName: 'Marauder' },
      
      // Capital Ships
      { groupID: 485, categoryID: 6, groupName: 'Dreadnought' },
      { groupID: 547, categoryID: 6, groupName: 'Carrier' },
      { groupID: 1538, categoryID: 6, groupName: 'Force Auxiliary' },
      { groupID: 659, categoryID: 6, groupName: 'Supercarrier' },
      { groupID: 30, categoryID: 6, groupName: 'Titan' },
      
      // Industrial
      { groupID: 28, categoryID: 6, groupName: 'Industrial' },
      { groupID: 463, categoryID: 6, groupName: 'Mining Barge' },
      { groupID: 543, categoryID: 6, groupName: 'Exhumer' },
      { groupID: 380, categoryID: 6, groupName: 'Transport Ship' },
      { groupID: 902, categoryID: 6, groupName: 'Jump Freighter' },
      { groupID: 513, categoryID: 6, groupName: 'Freighter' },
      { groupID: 941, categoryID: 6, groupName: 'Industrial Command Ship' },
      { groupID: 883, categoryID: 6, groupName: 'Capital Industrial Ship' },
    ];

    // Insert common module groups
    const moduleGroups = [
      // Weapons
      { groupID: 55, categoryID: 7, groupName: 'Projectile Weapon' },
      { groupID: 74, categoryID: 7, groupName: 'Hybrid Weapon' },
      { groupID: 53, categoryID: 7, groupName: 'Energy Weapon' },
      { groupID: 507, categoryID: 7, groupName: 'Missile Launcher Light' },
      { groupID: 509, categoryID: 7, groupName: 'Missile Launcher Heavy' },
      { groupID: 510, categoryID: 7, groupName: 'Missile Launcher Cruise' },
      { groupID: 511, categoryID: 7, groupName: 'Missile Launcher Rocket' },
      { groupID: 512, categoryID: 7, groupName: 'Missile Launcher Torpedo' },
      { groupID: 771, categoryID: 7, groupName: 'Missile Launcher Heavy Assault' },
      { groupID: 524, categoryID: 7, groupName: 'Missile Launcher Citadel' },
      
      // Tank
      { groupID: 40, categoryID: 7, groupName: 'Shield Extender' },
      { groupID: 38, categoryID: 7, groupName: 'Shield Recharger' },
      { groupID: 295, categoryID: 7, groupName: 'Shield Resistance Amplifier' },
      { groupID: 77, categoryID: 7, groupName: 'Shield Booster' },
      { groupID: 329, categoryID: 7, groupName: 'Armor Reinforcer' },
      { groupID: 328, categoryID: 7, groupName: 'Armor Coating' },
      { groupID: 62, categoryID: 7, groupName: 'Armor Repair Unit' },
      { groupID: 60, categoryID: 7, groupName: 'Damage Control' },
      
      // Engineering
      { groupID: 302, categoryID: 7, groupName: 'Capacitor Recharger' },
      { groupID: 61, categoryID: 7, groupName: 'Capacitor Booster' },
      { groupID: 76, categoryID: 7, groupName: 'Capacitor Battery' },
      { groupID: 67, categoryID: 7, groupName: 'Energy Neutralizer' },
      
      // Propulsion
      { groupID: 46, categoryID: 7, groupName: 'Propulsion Module' },
      { groupID: 65, categoryID: 7, groupName: 'Warp Core Stabilizer' },
      
      // EWAR
      { groupID: 201, categoryID: 7, groupName: 'ECM' },
      { groupID: 208, categoryID: 7, groupName: 'Sensor Dampener' },
      { groupID: 207, categoryID: 7, groupName: 'Tracking Disruptor' },
      { groupID: 291, categoryID: 7, groupName: 'Target Painter' },
      { groupID: 52, categoryID: 7, groupName: 'Warp Scrambler' },
      { groupID: 290, categoryID: 7, groupName: 'Stasis Web' },
      
      // Utility
      { groupID: 39, categoryID: 7, groupName: 'Cloaking Device' },
      { groupID: 330, categoryID: 7, groupName: 'Tractor Beam' },
      { groupID: 41, categoryID: 7, groupName: 'Salvager' },
      { groupID: 325, categoryID: 7, groupName: 'Gang Coordinator' },
      
      // Rigs
      { groupID: 773, categoryID: 7, groupName: 'Rig Armor' },
      { groupID: 774, categoryID: 7, groupName: 'Rig Shield' },
      { groupID: 775, categoryID: 7, groupName: 'Rig Energy Weapon' },
      { groupID: 776, categoryID: 7, groupName: 'Rig Hybrid Weapon' },
      { groupID: 777, categoryID: 7, groupName: 'Rig Projectile Weapon' },
      { groupID: 778, categoryID: 7, groupName: 'Rig Missile Launcher' },
      { groupID: 779, categoryID: 7, groupName: 'Rig Drone' },
      { groupID: 782, categoryID: 7, groupName: 'Rig Navigation' },
    ];

    // Insert all groups
    const allGroups = [...shipGroups, ...moduleGroups];
    
    for (const group of allGroups) {
      await this.runQuery(
        `INSERT OR REPLACE INTO inv_groups (groupID, categoryID, groupName, published) VALUES (?, ?, ?, 1)`,
        [group.groupID, group.categoryID, group.groupName]
      );
    }
  }

  private async importTypes(): Promise<void> {
    console.log('📦 Importing types (ships and modules)...');
    
    // For demonstration, let's add a more comprehensive list of ships
    await this.importCommonShips();
    await this.importCommonModules();
  }

  private async importCommonShips(): Promise<void> {
    const ships = [
      // T1 Frigates
      { typeID: 588, typeName: 'Rifter', groupID: 25, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 589, typeName: 'Breacher', groupID: 25, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 590, typeName: 'Slasher', groupID: 25, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 591, typeName: 'Burst', groupID: 25, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 592, typeName: 'Tormentor', groupID: 25, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 593, typeName: 'Punisher', groupID: 25, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 594, typeName: 'Executioner', groupID: 25, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 595, typeName: 'Inquisitor', groupID: 25, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 596, typeName: 'Merlin', groupID: 25, raceID: 1, raceName: 'Caldari State' },
      { typeID: 597, typeName: 'Condor', groupID: 25, raceID: 1, raceName: 'Caldari State' },
      { typeID: 598, typeName: 'Kestrel', groupID: 25, raceID: 1, raceName: 'Caldari State' },
      { typeID: 599, typeName: 'Bantam', groupID: 25, raceID: 1, raceName: 'Caldari State' },
      { typeID: 600, typeName: 'Incursus', groupID: 25, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 601, typeName: 'Tristan', groupID: 25, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 602, typeName: 'Atron', groupID: 25, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 603, typeName: 'Navitas', groupID: 25, raceID: 8, raceName: 'Gallente Federation' },
      
      // T1 Destroyers
      { typeID: 16236, typeName: 'Thrasher', groupID: 420, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 16238, typeName: 'Talwar', groupID: 420, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 16240, typeName: 'Coercer', groupID: 420, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 16242, typeName: 'Dragoon', groupID: 420, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 16244, typeName: 'Cormorant', groupID: 420, raceID: 1, raceName: 'Caldari State' },
      { typeID: 16246, typeName: 'Corax', groupID: 420, raceID: 1, raceName: 'Caldari State' },
      { typeID: 16248, typeName: 'Catalyst', groupID: 420, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 16250, typeName: 'Algos', groupID: 420, raceID: 8, raceName: 'Gallente Federation' },
      
      // T1 Cruisers
      { typeID: 620, typeName: 'Stabber', groupID: 26, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 621, typeName: 'Rupture', groupID: 26, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 622, typeName: 'Bellicose', groupID: 26, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 623, typeName: 'Scythe', groupID: 26, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 624, typeName: 'Omen', groupID: 26, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 625, typeName: 'Maller', groupID: 26, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 626, typeName: 'Arbitrator', groupID: 26, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 627, typeName: 'Augoror', groupID: 26, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 628, typeName: 'Caracal', groupID: 26, raceID: 1, raceName: 'Caldari State' },
      { typeID: 629, typeName: 'Moa', groupID: 26, raceID: 1, raceName: 'Caldari State' },
      { typeID: 630, typeName: 'Blackbird', groupID: 26, raceID: 1, raceName: 'Caldari State' },
      { typeID: 631, typeName: 'Osprey', groupID: 26, raceID: 1, raceName: 'Caldari State' },
      { typeID: 632, typeName: 'Thorax', groupID: 26, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 633, typeName: 'Vexor', groupID: 26, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 634, typeName: 'Celestis', groupID: 26, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 635, typeName: 'Exequror', groupID: 26, raceID: 8, raceName: 'Gallente Federation' },
      
      // T1 Battlecruisers
      { typeID: 16227, typeName: 'Hurricane', groupID: 419, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 16229, typeName: 'Cyclone', groupID: 419, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 16231, typeName: 'Harbinger', groupID: 419, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 16233, typeName: 'Prophecy', groupID: 419, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 16235, typeName: 'Drake', groupID: 419, raceID: 1, raceName: 'Caldari State' },
      { typeID: 16237, typeName: 'Ferox', groupID: 419, raceID: 1, raceName: 'Caldari State' },
      { typeID: 16239, typeName: 'Brutix', groupID: 419, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 16241, typeName: 'Myrmidon', groupID: 419, raceID: 8, raceName: 'Gallente Federation' },
      
      // T1 Battleships
      { typeID: 639, typeName: 'Tempest', groupID: 27, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 640, typeName: 'Maelstrom', groupID: 27, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 641, typeName: 'Typhoon', groupID: 27, raceID: 2, raceName: 'Minmatar Republic' },
      { typeID: 642, typeName: 'Apocalypse', groupID: 27, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 643, typeName: 'Armageddon', groupID: 27, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 644, typeName: 'Abaddon', groupID: 27, raceID: 4, raceName: 'Amarr Empire' },
      { typeID: 645, typeName: 'Raven', groupID: 27, raceID: 1, raceName: 'Caldari State' },
      { typeID: 646, typeName: 'Rokh', groupID: 27, raceID: 1, raceName: 'Caldari State' },
      { typeID: 647, typeName: 'Scorpion', groupID: 27, raceID: 1, raceName: 'Caldari State' },
      { typeID: 648, typeName: 'Megathron', groupID: 27, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 649, typeName: 'Hyperion', groupID: 27, raceID: 8, raceName: 'Gallente Federation' },
      { typeID: 650, typeName: 'Dominix', groupID: 27, raceID: 8, raceName: 'Gallente Federation' },
    ];

    for (const ship of ships) {
      await this.runQuery(
        `INSERT OR REPLACE INTO inv_types 
         (typeID, typeName, groupID, groupName, categoryID, categoryName, raceID, raceName, published) 
         VALUES (?, ?, ?, (SELECT groupName FROM inv_groups WHERE groupID = ?), 6, 'Ship', ?, ?, 1)`,
        [ship.typeID, ship.typeName, ship.groupID, ship.groupID, ship.raceID, ship.raceName]
      );
    }
  }

  private async importCommonModules(): Promise<void> {
    const modules = [
      // Small Projectile Weapons
      { typeID: 2873, typeName: '125mm Gatling AutoCannon I', groupID: 55 },
      { typeID: 2881, typeName: '150mm Light AutoCannon I', groupID: 55 },
      { typeID: 2889, typeName: '200mm AutoCannon I', groupID: 55 },
      { typeID: 2897, typeName: '250mm Light Artillery Cannon I', groupID: 55 },
      { typeID: 2905, typeName: '280mm Howitzer Artillery I', groupID: 55 },
      
      // Medium Projectile Weapons
      { typeID: 2913, typeName: '220mm Vulcan AutoCannon I', groupID: 55 },
      { typeID: 2921, typeName: '425mm AutoCannon I', groupID: 55 },
      { typeID: 2929, typeName: '650mm Artillery Cannon I', groupID: 55 },
      { typeID: 2937, typeName: '720mm Howitzer Artillery I', groupID: 55 },
      
      // Large Projectile Weapons
      { typeID: 2945, typeName: '650mm Repeating Cannon I', groupID: 55 },
      { typeID: 2953, typeName: '800mm Repeating Cannon I', groupID: 55 },
      { typeID: 2961, typeName: '1200mm Artillery Cannon I', groupID: 55 },
      { typeID: 2969, typeName: '1400mm Howitzer Artillery I', groupID: 55 },
      
      // Small Hybrid Weapons
      { typeID: 2977, typeName: '75mm Gatling Rail I', groupID: 74 },
      { typeID: 2985, typeName: '125mm Railgun I', groupID: 74 },
      { typeID: 2993, typeName: '150mm Railgun I', groupID: 74 },
      { typeID: 3001, typeName: 'Light Electron Blaster I', groupID: 74 },
      { typeID: 3009, typeName: 'Light Ion Blaster I', groupID: 74 },
      { typeID: 3017, typeName: 'Light Neutron Blaster I', groupID: 74 },
      
      // Medium Hybrid Weapons
      { typeID: 3025, typeName: '200mm Railgun I', groupID: 74 },
      { typeID: 3033, typeName: '250mm Railgun I', groupID: 74 },
      { typeID: 3041, typeName: 'Heavy Electron Blaster I', groupID: 74 },
      { typeID: 3049, typeName: 'Heavy Ion Blaster I', groupID: 74 },
      { typeID: 3057, typeName: 'Heavy Neutron Blaster I', groupID: 74 },
      
      // Large Hybrid Weapons
      { typeID: 3065, typeName: '350mm Railgun I', groupID: 74 },
      { typeID: 3073, typeName: '425mm Railgun I', groupID: 74 },
      { typeID: 3081, typeName: 'Electron Blaster Cannon I', groupID: 74 },
      { typeID: 3089, typeName: 'Ion Blaster Cannon I', groupID: 74 },
      { typeID: 3097, typeName: 'Neutron Blaster Cannon I', groupID: 74 },
      
      // Small Energy Weapons
      { typeID: 3105, typeName: 'Small Focused Pulse Laser I', groupID: 53 },
      { typeID: 3113, typeName: 'Small Focused Beam Laser I', groupID: 53 },
      { typeID: 3121, typeName: 'Gatling Pulse Laser I', groupID: 53 },
      { typeID: 3129, typeName: 'Dual Light Pulse Laser I', groupID: 53 },
      { typeID: 3137, typeName: 'Dual Light Beam Laser I', groupID: 53 },
      
      // Medium Energy Weapons
      { typeID: 3145, typeName: 'Medium Pulse Laser I', groupID: 53 },
      { typeID: 3153, typeName: 'Medium Beam Laser I', groupID: 53 },
      { typeID: 3161, typeName: 'Focused Medium Pulse Laser I', groupID: 53 },
      { typeID: 3169, typeName: 'Focused Medium Beam Laser I', groupID: 53 },
      { typeID: 3177, typeName: 'Heavy Pulse Laser I', groupID: 53 },
      { typeID: 3185, typeName: 'Heavy Beam Laser I', groupID: 53 },
      
      // Large Energy Weapons
      { typeID: 3193, typeName: 'Dual Heavy Pulse Laser I', groupID: 53 },
      { typeID: 3201, typeName: 'Dual Heavy Beam Laser I', groupID: 53 },
      { typeID: 3209, typeName: 'Mega Pulse Laser I', groupID: 53 },
      { typeID: 3217, typeName: 'Mega Beam Laser I', groupID: 53 },
      { typeID: 3225, typeName: 'Tachyon Beam Laser I', groupID: 53 },
      
      // Missile Launchers
      { typeID: 486, typeName: 'Rocket Launcher I', groupID: 511 },
      { typeID: 456, typeName: 'Light Missile Launcher I', groupID: 507 },
      { typeID: 506, typeName: 'Heavy Missile Launcher I', groupID: 509 },
      { typeID: 508, typeName: 'Heavy Assault Missile Launcher I', groupID: 771 },
      { typeID: 503, typeName: 'Cruise Missile Launcher I', groupID: 510 },
      { typeID: 501, typeName: 'Torpedo Launcher I', groupID: 512 },
      
      // Shield Modules
      { typeID: 2281, typeName: 'Small Shield Extender I', groupID: 40 },
      { typeID: 3831, typeName: 'Medium Shield Extender I', groupID: 40 },
      { typeID: 3841, typeName: 'Large Shield Extender I', groupID: 40 },
      { typeID: 519, typeName: 'Small Shield Booster I', groupID: 77 },
      { typeID: 10190, typeName: 'Medium Shield Booster I', groupID: 77 },
      { typeID: 10192, typeName: 'Large Shield Booster I', groupID: 77 },
      { typeID: 1422, typeName: 'EM Ward Amplifier I', groupID: 295 },
      { typeID: 2301, typeName: 'Thermal Dissipation Amplifier I', groupID: 295 },
      { typeID: 2303, typeName: 'Kinetic Deflection Amplifier I', groupID: 295 },
      { typeID: 2305, typeName: 'Explosive Deflection Amplifier I', groupID: 295 },
      
      // Armor Modules
      { typeID: 2046, typeName: '100mm Reinforced Steel Plates I', groupID: 329 },
      { typeID: 2048, typeName: '200mm Reinforced Steel Plates I', groupID: 329 },
      { typeID: 11265, typeName: '400mm Reinforced Steel Plates I', groupID: 329 },
      { typeID: 11267, typeName: '800mm Reinforced Steel Plates I', groupID: 329 },
      { typeID: 11269, typeName: '1600mm Reinforced Steel Plates I', groupID: 329 },
      { typeID: 3529, typeName: 'Small Armor Repairer I', groupID: 62 },
      { typeID: 3531, typeName: 'Medium Armor Repairer I', groupID: 62 },
      { typeID: 3533, typeName: 'Large Armor Repairer I', groupID: 62 },
      { typeID: 11299, typeName: 'Armor EM Hardener I', groupID: 328 },
      { typeID: 11301, typeName: 'Armor Thermal Hardener I', groupID: 328 },
      { typeID: 11295, typeName: 'Armor Kinetic Hardener I', groupID: 328 },
      { typeID: 11297, typeName: 'Armor Explosive Hardener I', groupID: 328 },
      { typeID: 1405, typeName: 'Damage Control I', groupID: 60 },
      
      // Propulsion Modules
      { typeID: 438, typeName: '1MN Afterburner I', groupID: 46 },
      { typeID: 12056, typeName: '10MN Afterburner I', groupID: 46 },
      { typeID: 12058, typeName: '100MN Afterburner I', groupID: 46 },
      { typeID: 440, typeName: '1MN Microwarpdrive I', groupID: 46 },
      { typeID: 12066, typeName: '10MN Microwarpdrive I', groupID: 46 },
      { typeID: 12068, typeName: '100MN Microwarpdrive I', groupID: 46 },
      
      // Engineering Modules
      { typeID: 2032, typeName: 'Cap Recharger I', groupID: 302 },
      { typeID: 1185, typeName: 'Capacitor Power Relay I', groupID: 57 },
      { typeID: 1183, typeName: 'Capacitor Flux Coil I', groupID: 1154 },
      { typeID: 399, typeName: 'Small Capacitor Battery I', groupID: 76 },
      { typeID: 8517, typeName: 'Medium Capacitor Battery I', groupID: 76 },
      { typeID: 8519, typeName: 'Large Capacitor Battery I', groupID: 76 },
      { typeID: 5443, typeName: 'Small Cap Booster I', groupID: 61 },
      { typeID: 5445, typeName: 'Medium Cap Booster I', groupID: 61 },
      { typeID: 5447, typeName: 'Heavy Cap Booster I', groupID: 61 },
      
      // EWAR Modules
      { typeID: 3766, typeName: 'Warp Disruptor I', groupID: 52 },
      { typeID: 447, typeName: 'Warp Scrambler I', groupID: 52 },
      { typeID: 527, typeName: 'Stasis Webifier I', groupID: 290 },
      { typeID: 1964, typeName: 'Target Painter I', groupID: 291 },
      { typeID: 1952, typeName: 'Sensor Dampener I', groupID: 208 },
      { typeID: 1978, typeName: 'Tracking Disruptor I', groupID: 207 },
      { typeID: 1956, typeName: 'ECM - Multispectral Jammer I', groupID: 201 },
      
      // Utility Modules
      { typeID: 11577, typeName: 'Prototype Cloaking Device I', groupID: 39 },
      { typeID: 11578, typeName: 'Covert Ops Cloaking Device II', groupID: 39 },
      { typeID: 4027, typeName: 'Small Tractor Beam I', groupID: 330 },
      { typeID: 25861, typeName: 'Salvager I', groupID: 41 },
      { typeID: 1877, typeName: 'Capacitor Power Relay I', groupID: 57 },
      { typeID: 1879, typeName: 'Power Diagnostic System I', groupID: 1573 },
      { typeID: 2048, typeName: 'Reactor Control Unit I', groupID: 645 },
      { typeID: 2410, typeName: 'Co-Processor I', groupID: 870 },
      
      // Rigs
      { typeID: 31718, typeName: 'Small Anti-EM Screen Reinforcer I', groupID: 774 },
      { typeID: 31742, typeName: 'Small Anti-Thermal Screen Reinforcer I', groupID: 774 },
      { typeID: 31754, typeName: 'Small Anti-Kinetic Screen Reinforcer I', groupID: 774 },
      { typeID: 31766, typeName: 'Small Anti-Explosive Screen Reinforcer I', groupID: 774 },
      { typeID: 31055, typeName: 'Small Armor Repairer I', groupID: 773 },
      { typeID: 31105, typeName: 'Small Trimark Armor Pump I', groupID: 773 },
      { typeID: 31155, typeName: 'Small Auxiliary Nano Pump I', groupID: 773 },
      { typeID: 31360, typeName: 'Small Auxiliary Thrusters I', groupID: 782 },
      { typeID: 31366, typeName: 'Small Cargohold Optimization I', groupID: 782 },
      { typeID: 31372, typeName: 'Small Low Friction Nozzle Joints I', groupID: 782 },
      { typeID: 31378, typeName: 'Small Polycarbon Engine Housing I', groupID: 782 },
    ];

    for (const module of modules) {
      await this.runQuery(
        `INSERT OR REPLACE INTO inv_types 
         (typeID, typeName, groupID, groupName, categoryID, categoryName, published) 
         VALUES (?, ?, ?, (SELECT groupName FROM inv_groups WHERE groupID = ?), 7, 'Module', 1)`,
        [module.typeID, module.typeName, module.groupID, module.groupID]
      );
    }
  }

  private async importTypeAttributes(): Promise<void> {
    console.log('📦 Importing type attributes...');
    
    // Common attribute IDs in EVE
    const ATTR_CPU_OUTPUT = 48;
    const ATTR_POWER_OUTPUT = 11;
    const ATTR_HIGH_SLOTS = 14;
    const ATTR_MED_SLOTS = 13;
    const ATTR_LOW_SLOTS = 12;
    const ATTR_RIG_SLOTS = 1137;
    const ATTR_TURRET_SLOTS = 102;
    const ATTR_LAUNCHER_SLOTS = 101;
    const ATTR_SHIELD_HP = 263;
    const ATTR_ARMOR_HP = 265;
    const ATTR_STRUCTURE_HP = 9;
    const ATTR_SHIELD_EM_RESIST = 271;
    const ATTR_SHIELD_THERMAL_RESIST = 272;
    const ATTR_SHIELD_KINETIC_RESIST = 273;
    const ATTR_SHIELD_EXPLOSIVE_RESIST = 274;
    const ATTR_ARMOR_EM_RESIST = 267;
    const ATTR_ARMOR_THERMAL_RESIST = 268;
    const ATTR_ARMOR_KINETIC_RESIST = 269;
    const ATTR_ARMOR_EXPLOSIVE_RESIST = 270;
    const ATTR_MAX_VELOCITY = 37;
    const ATTR_MASS = 4;
    const ATTR_VOLUME = 161;
    const ATTR_CAPACITY = 38;
    const ATTR_SIGNATURE_RADIUS = 552;
    const ATTR_CAPACITOR_CAPACITY = 482;
    const ATTR_CAPACITOR_RECHARGE_TIME = 55;
    const ATTR_CPU_USAGE = 50;
    const ATTR_POWER_USAGE = 30;
    const ATTR_CALIBRATION = 1153;
    const ATTR_CALIBRATION_COST = 1154;
    const ATTR_DRONE_CAPACITY = 283;
    const ATTR_DRONE_BANDWIDTH = 1271;
    const ATTR_MAX_TARGETING_RANGE = 76;
    const ATTR_MAX_LOCKED_TARGETS = 192;
    const ATTR_SCAN_RESOLUTION = 564;
    const ATTR_WARP_SPEED = 1281;
    
    // Ship attributes
    const shipAttributes = [
      // Rifter
      { typeID: 588, attributeID: ATTR_CPU_OUTPUT, attributeName: 'CPU Output', value: 125 },
      { typeID: 588, attributeID: ATTR_POWER_OUTPUT, attributeName: 'Powergrid Output', value: 37 },
      { typeID: 588, attributeID: ATTR_HIGH_SLOTS, attributeName: 'High Slots', value: 4 },
      { typeID: 588, attributeID: ATTR_MED_SLOTS, attributeName: 'Med Slots', value: 3 },
      { typeID: 588, attributeID: ATTR_LOW_SLOTS, attributeName: 'Low Slots', value: 3 },
      { typeID: 588, attributeID: ATTR_RIG_SLOTS, attributeName: 'Rig Slots', value: 3 },
      { typeID: 588, attributeID: ATTR_CALIBRATION, attributeName: 'Calibration', value: 400 },
      { typeID: 588, attributeID: ATTR_TURRET_SLOTS, attributeName: 'Turret Hardpoints', value: 3 },
      { typeID: 588, attributeID: ATTR_LAUNCHER_SLOTS, attributeName: 'Launcher Hardpoints', value: 2 },
      { typeID: 588, attributeID: ATTR_SHIELD_HP, attributeName: 'Shield HP', value: 391 },
      { typeID: 588, attributeID: ATTR_ARMOR_HP, attributeName: 'Armor HP', value: 351 },
      { typeID: 588, attributeID: ATTR_STRUCTURE_HP, attributeName: 'Structure HP', value: 336 },
      { typeID: 588, attributeID: ATTR_MAX_VELOCITY, attributeName: 'Max Velocity', value: 365 },
      { typeID: 588, attributeID: ATTR_SIGNATURE_RADIUS, attributeName: 'Signature Radius', value: 35 },
      { typeID: 588, attributeID: ATTR_CAPACITOR_CAPACITY, attributeName: 'Capacitor Capacity', value: 250 },
      { typeID: 588, attributeID: ATTR_CAPACITOR_RECHARGE_TIME, attributeName: 'Capacitor Recharge Time', value: 125000 },
      
      // Merlin
      { typeID: 596, attributeID: ATTR_CPU_OUTPUT, attributeName: 'CPU Output', value: 150 },
      { typeID: 596, attributeID: ATTR_POWER_OUTPUT, attributeName: 'Powergrid Output', value: 32 },
      { typeID: 596, attributeID: ATTR_HIGH_SLOTS, attributeName: 'High Slots', value: 3 },
      { typeID: 596, attributeID: ATTR_MED_SLOTS, attributeName: 'Med Slots', value: 4 },
      { typeID: 596, attributeID: ATTR_LOW_SLOTS, attributeName: 'Low Slots', value: 2 },
      { typeID: 596, attributeID: ATTR_RIG_SLOTS, attributeName: 'Rig Slots', value: 3 },
      { typeID: 596, attributeID: ATTR_CALIBRATION, attributeName: 'Calibration', value: 400 },
      { typeID: 596, attributeID: ATTR_TURRET_SLOTS, attributeName: 'Turret Hardpoints', value: 2 },
      { typeID: 596, attributeID: ATTR_LAUNCHER_SLOTS, attributeName: 'Launcher Hardpoints', value: 2 },
      { typeID: 596, attributeID: ATTR_SHIELD_HP, attributeName: 'Shield HP', value: 493 },
      { typeID: 596, attributeID: ATTR_ARMOR_HP, attributeName: 'Armor HP', value: 293 },
      { typeID: 596, attributeID: ATTR_STRUCTURE_HP, attributeName: 'Structure HP', value: 263 },
      { typeID: 596, attributeID: ATTR_MAX_VELOCITY, attributeName: 'Max Velocity', value: 310 },
      { typeID: 596, attributeID: ATTR_SIGNATURE_RADIUS, attributeName: 'Signature Radius', value: 39 },
      { typeID: 596, attributeID: ATTR_CAPACITOR_CAPACITY, attributeName: 'Capacitor Capacity', value: 281.25 },
      { typeID: 596, attributeID: ATTR_CAPACITOR_RECHARGE_TIME, attributeName: 'Capacitor Recharge Time', value: 140625 },
      
      // Incursus
      { typeID: 600, attributeID: ATTR_CPU_OUTPUT, attributeName: 'CPU Output', value: 135 },
      { typeID: 600, attributeID: ATTR_POWER_OUTPUT, attributeName: 'Powergrid Output', value: 30 },
      { typeID: 600, attributeID: ATTR_HIGH_SLOTS, attributeName: 'High Slots', value: 3 },
      { typeID: 600, attributeID: ATTR_MED_SLOTS, attributeName: 'Med Slots', value: 3 },
      { typeID: 600, attributeID: ATTR_LOW_SLOTS, attributeName: 'Low Slots', value: 3 },
      { typeID: 600, attributeID: ATTR_RIG_SLOTS, attributeName: 'Rig Slots', value: 3 },
      { typeID: 600, attributeID: ATTR_CALIBRATION, attributeName: 'Calibration', value: 400 },
      { typeID: 600, attributeID: ATTR_TURRET_SLOTS, attributeName: 'Turret Hardpoints', value: 3 },
      { typeID: 600, attributeID: ATTR_LAUNCHER_SLOTS, attributeName: 'Launcher Hardpoints', value: 0 },
      { typeID: 600, attributeID: ATTR_SHIELD_HP, attributeName: 'Shield HP', value: 325 },
      { typeID: 600, attributeID: ATTR_ARMOR_HP, attributeName: 'Armor HP', value: 422 },
      { typeID: 600, attributeID: ATTR_STRUCTURE_HP, attributeName: 'Structure HP', value: 391 },
      { typeID: 600, attributeID: ATTR_MAX_VELOCITY, attributeName: 'Max Velocity', value: 325 },
      { typeID: 600, attributeID: ATTR_SIGNATURE_RADIUS, attributeName: 'Signature Radius', value: 36 },
      { typeID: 600, attributeID: ATTR_CAPACITOR_CAPACITY, attributeName: 'Capacitor Capacity', value: 250 },
      { typeID: 600, attributeID: ATTR_CAPACITOR_RECHARGE_TIME, attributeName: 'Capacitor Recharge Time', value: 125000 },
      { typeID: 600, attributeID: ATTR_DRONE_CAPACITY, attributeName: 'Drone Capacity', value: 5 },
      { typeID: 600, attributeID: ATTR_DRONE_BANDWIDTH, attributeName: 'Drone Bandwidth', value: 5 },
      
      // Punisher
      { typeID: 593, attributeID: ATTR_CPU_OUTPUT, attributeName: 'CPU Output', value: 100 },
      { typeID: 593, attributeID: ATTR_POWER_OUTPUT, attributeName: 'Powergrid Output', value: 40 },
      { typeID: 593, attributeID: ATTR_HIGH_SLOTS, attributeName: 'High Slots', value: 4 },
      { typeID: 593, attributeID: ATTR_MED_SLOTS, attributeName: 'Med Slots', value: 2 },
      { typeID: 593, attributeID: ATTR_LOW_SLOTS, attributeName: 'Low Slots', value: 4 },
      { typeID: 593, attributeID: ATTR_RIG_SLOTS, attributeName: 'Rig Slots', value: 3 },
      { typeID: 593, attributeID: ATTR_CALIBRATION, attributeName: 'Calibration', value: 400 },
      { typeID: 593, attributeID: ATTR_TURRET_SLOTS, attributeName: 'Turret Hardpoints', value: 3 },
      { typeID: 593, attributeID: ATTR_LAUNCHER_SLOTS, attributeName: 'Launcher Hardpoints', value: 0 },
      { typeID: 593, attributeID: ATTR_SHIELD_HP, attributeName: 'Shield HP', value: 350 },
      { typeID: 593, attributeID: ATTR_ARMOR_HP, attributeName: 'Armor HP', value: 450 },
      { typeID: 593, attributeID: ATTR_STRUCTURE_HP, attributeName: 'Structure HP', value: 450 },
      { typeID: 593, attributeID: ATTR_MAX_VELOCITY, attributeName: 'Max Velocity', value: 285 },
      { typeID: 593, attributeID: ATTR_SIGNATURE_RADIUS, attributeName: 'Signature Radius', value: 37 },
      { typeID: 593, attributeID: ATTR_CAPACITOR_CAPACITY, attributeName: 'Capacitor Capacity', value: 312.5 },
      { typeID: 593, attributeID: ATTR_CAPACITOR_RECHARGE_TIME, attributeName: 'Capacitor Recharge Time', value: 156250 },
    ];
    
    // Module attributes
    const moduleAttributes = [
      // 125mm Gatling AutoCannon I
      { typeID: 2873, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 5 },
      { typeID: 2873, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 2 },
      { typeID: 2873, attributeID: 64, attributeName: 'Damage Multiplier', value: 2.1 },
      { typeID: 2873, attributeID: 51, attributeName: 'Rate of Fire', value: 2475 },
      { typeID: 2873, attributeID: 54, attributeName: 'Optimal Range', value: 1200 },
      { typeID: 2873, attributeID: 158, attributeName: 'Falloff', value: 3500 },
      { typeID: 2873, attributeID: 160, attributeName: 'Tracking Speed', value: 0.483 },
      
      // Small Shield Extender I
      { typeID: 2281, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 18 },
      { typeID: 2281, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 1 },
      { typeID: 2281, attributeID: 72, attributeName: 'Shield Bonus', value: 300 },
      { typeID: 2281, attributeID: 554, attributeName: 'Signature Radius Bonus', value: 0 },
      
      // 1MN Afterburner I
      { typeID: 438, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 10 },
      { typeID: 438, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 10 },
      { typeID: 438, attributeID: 6, attributeName: 'Velocity Bonus', value: 125 },
      { typeID: 438, attributeID: 6, attributeName: 'Duration', value: 10000 },
      { typeID: 438, attributeID: 6, attributeName: 'Capacitor Usage', value: 10 },
      
      // Damage Control I
      { typeID: 1405, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 25 },
      { typeID: 1405, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 1 },
      { typeID: 1405, attributeID: 983, attributeName: 'Shield EM Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 984, attributeName: 'Shield Thermal Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 985, attributeName: 'Shield Kinetic Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 986, attributeName: 'Shield Explosive Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 987, attributeName: 'Armor EM Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 988, attributeName: 'Armor Thermal Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 989, attributeName: 'Armor Kinetic Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 990, attributeName: 'Armor Explosive Resist Bonus', value: 12.5 },
      { typeID: 1405, attributeID: 109, attributeName: 'Structure EM Resist Bonus', value: 50 },
      { typeID: 1405, attributeID: 110, attributeName: 'Structure Thermal Resist Bonus', value: 50 },
      { typeID: 1405, attributeID: 111, attributeName: 'Structure Kinetic Resist Bonus', value: 50 },
      { typeID: 1405, attributeID: 112, attributeName: 'Structure Explosive Resist Bonus', value: 50 },
      
      // Warp Scrambler I
      { typeID: 447, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 5 },
      { typeID: 447, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 1 },
      { typeID: 447, attributeID: 103, attributeName: 'Warp Scramble Strength', value: 2 },
      { typeID: 447, attributeID: 54, attributeName: 'Optimal Range', value: 7500 },
      { typeID: 447, attributeID: 6, attributeName: 'Capacitor Usage', value: 5 },
      { typeID: 447, attributeID: 73, attributeName: 'Duration', value: 5000 },
      
      // Small Armor Repairer I
      { typeID: 3529, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 20 },
      { typeID: 3529, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 20 },
      { typeID: 3529, attributeID: 84, attributeName: 'Armor Damage Amount', value: 32 },
      { typeID: 3529, attributeID: 73, attributeName: 'Duration', value: 12500 },
      { typeID: 3529, attributeID: 6, attributeName: 'Capacitor Usage', value: 25 },
      
      // Light Ion Blaster I
      { typeID: 3009, attributeID: ATTR_CPU_USAGE, attributeName: 'CPU Usage', value: 8 },
      { typeID: 3009, attributeID: ATTR_POWER_USAGE, attributeName: 'Power Usage', value: 5 },
      { typeID: 3009, attributeID: 64, attributeName: 'Damage Multiplier', value: 2.4 },
      { typeID: 3009, attributeID: 51, attributeName: 'Rate of Fire', value: 3000 },
      { typeID: 3009, attributeID: 54, attributeName: 'Optimal Range', value: 1925 },
      { typeID: 3009, attributeID: 158, attributeName: 'Falloff', value: 2250 },
      { typeID: 3009, attributeID: 160, attributeName: 'Tracking Speed', value: 0.4 },
      
      // Small Anti-EM Screen Reinforcer I (Rig)
      { typeID: 31718, attributeID: ATTR_CALIBRATION_COST, attributeName: 'Calibration Cost', value: 50 },
      { typeID: 31718, attributeID: 983, attributeName: 'Shield EM Resist Bonus', value: 30 },
      { typeID: 31718, attributeID: 424, attributeName: 'Rig Drawback', value: -10 }, // Signature Radius penalty
    ];
    
    // Insert all attributes
    const allAttributes = [...shipAttributes, ...moduleAttributes];
    
    for (const attr of allAttributes) {
      await this.runQuery(
        `INSERT OR REPLACE INTO type_attributes 
         (typeID, attributeID, attributeName, value) 
         VALUES (?, ?, ?, ?)`,
        [attr.typeID, attr.attributeID, attr.attributeName, attr.value]
      );
    }
  }

  private async importAdditionalAttributes(): Promise<void> {
    console.log('📦 Adding resistance profiles and skill requirements...');
    
    // Base resistance values for all ships (EVE default: 0% to all damage types)
    const baseResistances = [
      { attributeID: 271, attributeName: 'Shield EM Resistance', value: 0 },
      { attributeID: 272, attributeName: 'Shield Thermal Resistance', value: 0 },
      { attributeID: 273, attributeName: 'Shield Kinetic Resistance', value: 0 },
      { attributeID: 274, attributeName: 'Shield Explosive Resistance', value: 0 },
      { attributeID: 267, attributeName: 'Armor EM Resistance', value: 0 },
      { attributeID: 268, attributeName: 'Armor Thermal Resistance', value: 0 },
      { attributeID: 269, attributeName: 'Armor Kinetic Resistance', value: 0 },
      { attributeID: 270, attributeName: 'Armor Explosive Resistance', value: 0 },
      { attributeID: 113, attributeName: 'Structure EM Resistance', value: 0 },
      { attributeID: 109, attributeName: 'Structure Thermal Resistance', value: 0 },
      { attributeID: 110, attributeName: 'Structure Kinetic Resistance', value: 0 },
      { attributeID: 111, attributeName: 'Structure Explosive Resistance', value: 0 },
    ];
    
    // Get all ships
    const ships = await this.allQuery(
      `SELECT typeID FROM inv_types WHERE categoryID = 6`
    );
    
    // Add base resistances to all ships
    for (const ship of ships) {
      for (const resist of baseResistances) {
        await this.runQuery(
          `INSERT OR IGNORE INTO type_attributes 
           (typeID, attributeID, attributeName, value) 
           VALUES (?, ?, ?, ?)`,
          [ship.typeID, resist.attributeID, resist.attributeName, resist.value]
        );
      }
    }
    
    // Add skill requirements for some modules
    const skillRequirements = [
      // Damage Control I requires Hull Upgrades I
      { typeID: 1405, skillTypeID: 3392, skillName: 'Hull Upgrades', level: 1 },
      // Small Shield Extender I requires Shield Upgrades I
      { typeID: 2281, skillTypeID: 3425, skillName: 'Shield Upgrades', level: 1 },
      // 1MN Afterburner I requires Navigation I
      { typeID: 438, skillTypeID: 3449, skillName: 'Navigation', level: 1 },
      // Warp Scrambler I requires Propulsion Jamming I
      { typeID: 447, skillTypeID: 3435, skillName: 'Propulsion Jamming', level: 1 },
      // Small Armor Repairer I requires Repair Systems I
      { typeID: 3529, skillTypeID: 3393, skillName: 'Repair Systems', level: 1 },
      // 125mm Gatling AutoCannon I requires Small Projectile Turret I
      { typeID: 2873, skillTypeID: 3300, skillName: 'Small Projectile Turret', level: 1 },
      // Light Ion Blaster I requires Small Hybrid Turret I
      { typeID: 3009, skillTypeID: 3301, skillName: 'Small Hybrid Turret', level: 1 },
      // Small Focused Pulse Laser I requires Small Energy Turret I
      { typeID: 3105, skillTypeID: 3303, skillName: 'Small Energy Turret', level: 1 },
      // Light Missile Launcher I requires Light Missiles I
      { typeID: 456, skillTypeID: 3319, skillName: 'Light Missiles', level: 1 },
    ];
    
    for (const req of skillRequirements) {
      await this.runQuery(
        `INSERT OR REPLACE INTO skill_requirements 
         (typeID, skillTypeID, skillName, level) 
         VALUES (?, ?, ?, ?)`,
        [req.typeID, req.skillTypeID, req.skillName, req.level]
      );
    }
    
    // Update metadata
    await this.runQuery(
      `INSERT OR REPLACE INTO sde_metadata (key, value) VALUES (?, ?)`,
      ['last_import', new Date().toISOString()]
    );
    
    await this.runQuery(
      `INSERT OR REPLACE INTO sde_metadata (key, value) VALUES (?, ?)`,
      ['sde_version', 'Demo Data v1.0']
    );
  }

  // Helper methods
  private async runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      sdeService['db'].run(sql, params, function(err: any) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  private async allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      sdeService['db'].all(sql, params, (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}

export const sdeImporter = new SDEImporter();