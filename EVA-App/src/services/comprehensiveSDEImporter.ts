import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { sdeService } from './sdeService';

interface SDETypeData {
  typeID: number;
  groupID: number;
  categoryID?: number; // Not always present, need to derive from groupID
  name?: any; // Multi-language object (newer format)
  typeName?: any; // Multi-language object (legacy format)
  description?: any;
  mass?: number;
  volume?: number;
  capacity?: number;
  published?: boolean;
  marketGroupID?: number;
  portionSize?: number;
  raceID?: number;
  basePrice?: number;
  dogmaAttributes?: { attributeID: number; value: number }[];
  dogmaEffects?: { effectID: number; isDefault?: boolean }[];
}

interface SDEGroupData {
  groupID: number;
  categoryID: number;
  name: any; // Multi-language name object
  groupName?: any; // Legacy field
  published?: boolean;
  anchorable?: boolean;
  anchored?: boolean;
  fittableNonSingleton?: boolean;
  useBasePrice?: boolean;
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
  iconID?: number;
  published?: boolean;
}

interface SDEEffectData {
  effectID: number;
  effectName?: string;
  description?: string;
  effectCategory?: number;
  preExpression?: number;
  postExpression?: number;
  published?: boolean;
  isOffensive?: boolean;
  isAssistance?: boolean;
  durationAttributeID?: number;
  rangeAttributeID?: number;
  dischargeAttributeID?: number;
}

interface SDEMarketGroupData {
  marketGroupID: number;
  marketGroupName: any;
  description?: any;
  parentGroupID?: number;
  hasTypes?: boolean;
  iconID?: number;
}

export interface SDEImportStats {
  ships: number;
  modules: number;
  attributes: number;
  effects: number;
  groups: number;
  categories: number;
  marketGroups: number;
}

export class ComprehensiveSDEImporter {
  private sdeBasePath: string;
  private batchSize = 500; // Process items in batches
  private groupToCategoryMap: Map<number, number> = new Map();

  // Ship categories and groups mapping
  private readonly SHIP_CATEGORIES = [6]; // Ship category
  private readonly SHIP_GROUPS = [
    25, 26, 27, 28, 29, 30, 31, // Frigates
    324, 830, 831, 832, 833, // T2 Frigates
    358, 894, 1022, // T3/Special Frigates
    419, 420, 380, 541, // Destroyers
    539, 540, // T2 Destroyers
    413, 414, 415, 416, 417, 418, // Cruisers
    446, 534, 538, 543, 830, // T2 Cruisers
    358, 894, 1022, // T3 Cruisers
    904, 905, 906, 900, 941, // Command Ships
    26, 419, 420, 463, 540, // Battlecruisers
    1201, 1202, 1876, // T2 Battlecruisers
    27, 28, 898, 900, 941, // Battleships
    898, 900, 941, // T2 Battleships
    1538, 1657, // Marauders
    386, 436, 435, 902, // Capitals
    659, 1538, 1657, // Supercarriers, Titans
    883, 1022, // Industrial Ships
    1302, 1944, // Jump Freighters
    237, 29, 31, // Shuttles, Pods
    1201, 1202, 1876 // Command Ships
  ];

  private readonly MODULE_CATEGORIES = [
    7,  // Module
    8,  // Charge
    18, // Drone
    32, // Subsystem
    20, // Implant
    23, // Skill
    16, // Skill Injector
    35  // Deployable
  ];

  constructor(sdeBasePath: string) {
    this.sdeBasePath = sdeBasePath;
  }

  async importFullSDE(): Promise<SDEImportStats> {
    console.log('🚀 Starting comprehensive SDE import...');
    
    const stats: SDEImportStats = {
      ships: 0,
      modules: 0,
      attributes: 0,
      effects: 0,
      groups: 0,
      categories: 0,
      marketGroups: 0
    };

    try {
      // Ensure SDE service is initialized before clearing
      console.log('🔄 Ensuring SDE service is initialized...');
      await sdeService.initialize();
      
      // Clear existing data
      console.log('🗑️ Clearing existing SDE data...');
      await sdeService.clearDatabase();

      // Import in dependency order
      console.log('📁 Importing categories...');
      stats.categories = await this.importCategories();

      console.log('📂 Importing groups...');
      stats.groups = await this.importGroups();

      console.log('🏪 Importing market groups...');
      stats.marketGroups = await this.importMarketGroups();

      console.log('⚡ Importing dogma attributes...');
      stats.attributes = await this.importDogmaAttributes();

      console.log('🎯 Importing dogma effects...');
      stats.effects = await this.importDogmaEffects();

      console.log('🚢 Importing types (ships and modules)...');
      const typeStats = await this.importTypes();
      stats.ships = typeStats.ships;
      stats.modules = typeStats.modules;

      console.log('🔗 Importing type dogma data...');
      await this.importTypeDogma();

      console.log('✅ Comprehensive SDE import completed!');
      console.log(`📊 Final stats:`, stats);

      return stats;

    } catch (error) {
      console.error('❌ Comprehensive SDE import failed:', error);
      throw error;
    }
  }

  private async importCategories(): Promise<number> {
    const categoriesPath = path.join(this.sdeBasePath, 'fsd', 'categories.yaml');
    
    if (!fs.existsSync(categoriesPath)) {
      console.warn('⚠️ Categories file not found, skipping');
      return 0;
    }

    try {
      const categoriesYaml = fs.readFileSync(categoriesPath, 'utf8');
      const categoriesData = yaml.load(categoriesYaml) as Record<string, SDECategoryData>;
      
      let count = 0;
      const categories = Object.entries(categoriesData).map(([id, data]) => ({
        categoryID: parseInt(id),
        categoryName: this.extractEnglishName(data.categoryName),
        published: data.published || false
      }));

      // Insert in batches
      for (let i = 0; i < categories.length; i += this.batchSize) {
        const batch = categories.slice(i, i + this.batchSize);
        await this.insertCategoriesBatch(batch);
        count += batch.length;
      }

      console.log(`✅ Imported ${count} categories`);
      return count;

    } catch (error) {
      console.error('❌ Failed to import categories:', error);
      return 0;
    }
  }

  private async importGroups(): Promise<number> {
    const groupsPath = path.join(this.sdeBasePath, 'fsd', 'groups.yaml');
    
    if (!fs.existsSync(groupsPath)) {
      console.warn('⚠️ Groups file not found, skipping');
      return 0;
    }

    try {
      const groupsYaml = fs.readFileSync(groupsPath, 'utf8');
      const groupsData = yaml.load(groupsYaml) as Record<string, SDEGroupData>;
      
      let count = 0;
      const groups = Object.entries(groupsData).map(([id, data]) => ({
        groupID: parseInt(id),
        categoryID: data.categoryID,
        groupName: this.extractEnglishName(data.name),
        published: data.published || false,
        anchorable: data.anchorable || false,
        anchored: data.anchored || false,
        fittableNonSingleton: data.fittableNonSingleton || false,
        useBasePrice: data.useBasePrice || false
      }));

      // Insert in batches
      for (let i = 0; i < groups.length; i += this.batchSize) {
        const batch = groups.slice(i, i + this.batchSize);
        await this.insertGroupsBatch(batch);
        count += batch.length;
      }

      console.log(`✅ Imported ${count} groups`);
      return count;

    } catch (error) {
      console.error('❌ Failed to import groups:', error);
      return 0;
    }
  }

  private async importMarketGroups(): Promise<number> {
    const marketGroupsPath = path.join(this.sdeBasePath, 'fsd', 'marketGroups.yaml');
    
    if (!fs.existsSync(marketGroupsPath)) {
      console.warn('⚠️ Market groups file not found, skipping');
      return 0;
    }

    try {
      const marketGroupsYaml = fs.readFileSync(marketGroupsPath, 'utf8');
      const marketGroupsData = yaml.load(marketGroupsYaml) as Record<string, SDEMarketGroupData>;
      
      let count = 0;
      const marketGroups = Object.entries(marketGroupsData).map(([id, data]) => ({
        marketGroupID: parseInt(id),
        marketGroupName: this.extractEnglishName(data.marketGroupName),
        description: this.extractEnglishName(data.description) || '',
        parentGroupID: data.parentGroupID || null,
        hasTypes: data.hasTypes || false,
        iconID: data.iconID || null
      }));

      // Insert in batches
      for (let i = 0; i < marketGroups.length; i += this.batchSize) {
        const batch = marketGroups.slice(i, i + this.batchSize);
        await this.insertMarketGroupsBatch(batch);
        count += batch.length;
      }

      console.log(`✅ Imported ${count} market groups`);
      return count;

    } catch (error) {
      console.error('❌ Failed to import market groups:', error);
      return 0;
    }
  }

  private async importDogmaAttributes(): Promise<number> {
    const attributesPath = path.join(this.sdeBasePath, 'fsd', 'dogmaAttributes.yaml');
    
    if (!fs.existsSync(attributesPath)) {
      console.warn('⚠️ Dogma attributes file not found, skipping');
      return 0;
    }

    try {
      const attributesYaml = fs.readFileSync(attributesPath, 'utf8');
      const attributesData = yaml.load(attributesYaml) as Record<string, SDEAttributeData>;
      
      let count = 0;
      const attributes = Object.entries(attributesData).map(([id, data]) => ({
        attributeID: parseInt(id),
        attributeName: data.attributeName || `Attribute ${id}`,
        description: data.description || '',
        defaultValue: data.defaultValue || 0,
        highIsGood: data.highIsGood || false,
        stackable: data.stackable || false,
        unitID: data.unitID || null,
        displayName: data.displayName || data.attributeName || `Attribute ${id}`,
        iconID: data.iconID || null,
        published: data.published || false
      }));

      // Insert in batches
      for (let i = 0; i < attributes.length; i += this.batchSize) {
        const batch = attributes.slice(i, i + this.batchSize);
        await this.insertAttributesBatch(batch);
        count += batch.length;
      }

      console.log(`✅ Imported ${count} dogma attributes`);
      return count;

    } catch (error) {
      console.error('❌ Failed to import dogma attributes:', error);
      return 0;
    }
  }

  private async importDogmaEffects(): Promise<number> {
    const effectsPath = path.join(this.sdeBasePath, 'fsd', 'dogmaEffects.yaml');
    
    if (!fs.existsSync(effectsPath)) {
      console.warn('⚠️ Dogma effects file not found, skipping');
      return 0;
    }

    try {
      const effectsYaml = fs.readFileSync(effectsPath, 'utf8');
      const effectsData = yaml.load(effectsYaml) as Record<string, SDEEffectData>;
      
      let count = 0;
      const effects = Object.entries(effectsData).map(([id, data]) => ({
        effectID: parseInt(id),
        effectName: data.effectName || `Effect ${id}`,
        description: data.description || '',
        effectCategory: data.effectCategory || 0,
        preExpression: data.preExpression || null,
        postExpression: data.postExpression || null,
        published: data.published || false,
        isOffensive: data.isOffensive || false,
        isAssistance: data.isAssistance || false,
        durationAttributeID: data.durationAttributeID || null,
        rangeAttributeID: data.rangeAttributeID || null,
        dischargeAttributeID: data.dischargeAttributeID || null
      }));

      // Insert in batches
      for (let i = 0; i < effects.length; i += this.batchSize) {
        const batch = effects.slice(i, i + this.batchSize);
        await this.insertEffectsBatch(batch);
        count += batch.length;
      }

      console.log(`✅ Imported ${count} dogma effects`);
      return count;

    } catch (error) {
      console.error('❌ Failed to import dogma effects:', error);
      return 0;
    }
  }

  private async importTypes(): Promise<{ ships: number; modules: number }> {
    const typesPath = path.join(this.sdeBasePath, 'fsd', 'types.yaml');
    
    if (!fs.existsSync(typesPath)) {
      console.warn('⚠️ Types file not found, skipping');
      return { ships: 0, modules: 0 };
    }

    try {
      console.log('📊 Loading complete typeIDs.yaml...');
      const typesYaml = fs.readFileSync(typesPath, 'utf8');
      const typesData = yaml.load(typesYaml) as Record<string, SDETypeData>;
      
      console.log(`📋 Processing ${Object.keys(typesData).length} total types...`);
      
      let shipCount = 0;
      let moduleCount = 0;
      let processedCount = 0;

      const typeEntries = Object.entries(typesData);
      
      // Process in batches to avoid memory issues
      for (let i = 0; i < typeEntries.length; i += this.batchSize) {
        const batch = typeEntries.slice(i, i + this.batchSize);
        const batchTypes = [];

        for (const [id, data] of batch) {
          const typeID = parseInt(id);
          
          // Get categoryID from groupID (types don't have categoryID directly)
          const categoryID = await this.getCategoryIDFromGroupID(data.groupID);
          if (!categoryID) continue;
          
          const isShip = this.SHIP_CATEGORIES.includes(categoryID);
          const isModule = this.MODULE_CATEGORIES.includes(categoryID);

          // Skip types that aren't ships or modules
          if (!isShip && !isModule) continue;
          
          // For now, import all ships/modules regardless of published status
          // The published field in SDE doesn't accurately reflect what should be available

          const typeData = {
            typeID,
            groupID: data.groupID,
            categoryID: categoryID, // Use the looked-up categoryID
            typeName: this.extractEnglishName(data.name || data.typeName),
            description: this.extractEnglishName(data.description) || '',
            mass: data.mass || 0,
            volume: data.volume || 0,
            capacity: data.capacity || 0,
            published: data.published !== false, // Default to true if not explicitly false
            marketGroupID: data.marketGroupID || null,
            portionSize: data.portionSize || 1,
            raceID: data.raceID || null,
            basePrice: data.basePrice || 0
          };

          batchTypes.push(typeData);

          if (isShip) shipCount++;
          if (isModule) moduleCount++;
        }

        // Insert batch
        if (batchTypes.length > 0) {
          await this.insertTypesBatch(batchTypes);
          processedCount += batchTypes.length;
          
          if (processedCount % 1000 === 0) {
            console.log(`📈 Processed ${processedCount} types (${shipCount} ships, ${moduleCount} modules)...`);
          }
        }
      }

      console.log(`✅ Imported ${processedCount} types: ${shipCount} ships, ${moduleCount} modules`);
      return { ships: shipCount, modules: moduleCount };

    } catch (error) {
      console.error('❌ Failed to import types:', error);
      return { ships: 0, modules: 0 };
    }
  }

  private async importTypeDogma(): Promise<number> {
    const typeDogmaPath = path.join(this.sdeBasePath, 'fsd', 'typeDogma.yaml');
    
    if (!fs.existsSync(typeDogmaPath)) {
      console.warn('⚠️ Type dogma file not found, skipping');
      return 0;
    }

    try {
      console.log('🔗 Loading type dogma data...');
      const typeDogmaYaml = fs.readFileSync(typeDogmaPath, 'utf8');
      const typeDogmaData = yaml.load(typeDogmaYaml) as Record<string, any>;
      
      let count = 0;
      const attributeEntries = [];

      for (const [typeId, dogmaInfo] of Object.entries(typeDogmaData)) {
        const typeID = parseInt(typeId);

        // Import dogma attributes for this type
        if (dogmaInfo.dogmaAttributes) {
          for (const [attrId, value] of Object.entries(dogmaInfo.dogmaAttributes)) {
            attributeEntries.push({
              typeID,
              attributeID: parseInt(attrId),
              value: parseFloat(value as string)
            });
          }
        }
      }

      // Insert attributes in batches
      for (let i = 0; i < attributeEntries.length; i += this.batchSize) {
        const batch = attributeEntries.slice(i, i + this.batchSize);
        await this.insertTypeAttributesBatch(batch);
        count += batch.length;
        
        if (count % 5000 === 0) {
          console.log(`📈 Processed ${count} type attributes...`);
        }
      }

      console.log(`✅ Imported ${count} type dogma attributes`);
      return count;

    } catch (error) {
      console.error('❌ Failed to import type dogma:', error);
      return 0;
    }
  }

  // Helper methods for database insertion
  private async insertCategoriesBatch(categories: any[]): Promise<void> {
    const placeholders = categories.map(() => '(?, ?, ?)').join(', ');
    const values = categories.flatMap(cat => [cat.categoryID, cat.categoryName, cat.published ? 1 : 0]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO categories (categoryID, categoryName, published) VALUES ${placeholders}`,
      values
    );
  }

  private async insertGroupsBatch(groups: any[]): Promise<void> {
    const placeholders = groups.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = groups.flatMap(group => [
      group.groupID, group.categoryID, group.groupName, group.published ? 1 : 0,
      group.anchorable ? 1 : 0, group.anchored ? 1 : 0, 
      group.fittableNonSingleton ? 1 : 0, group.useBasePrice ? 1 : 0
    ]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO groups (groupID, categoryID, groupName, published, anchorable, anchored, fittableNonSingleton, useBasePrice) VALUES ${placeholders}`,
      values
    );
  }

  private async insertMarketGroupsBatch(marketGroups: any[]): Promise<void> {
    const placeholders = marketGroups.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const values = marketGroups.flatMap(mg => [
      mg.marketGroupID, mg.marketGroupName, mg.description, 
      mg.parentGroupID, mg.hasTypes ? 1 : 0, mg.iconID
    ]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO market_groups (marketGroupID, marketGroupName, description, parentGroupID, hasTypes, iconID) VALUES ${placeholders}`,
      values
    );
  }

  private async insertAttributesBatch(attributes: any[]): Promise<void> {
    const placeholders = attributes.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = attributes.flatMap(attr => [
      attr.attributeID, attr.attributeName, attr.description, attr.defaultValue,
      attr.highIsGood ? 1 : 0, attr.stackable ? 1 : 0, attr.unitID, 
      attr.displayName, attr.iconID, attr.published ? 1 : 0
    ]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO dogma_attributes (attributeID, attributeName, description, defaultValue, highIsGood, stackable, unitID, displayName, iconID, published) VALUES ${placeholders}`,
      values
    );
  }

  private async insertEffectsBatch(effects: any[]): Promise<void> {
    const placeholders = effects.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = effects.flatMap(effect => [
      effect.effectID, effect.effectName, effect.description, effect.effectCategory,
      effect.preExpression, effect.postExpression, effect.published ? 1 : 0,
      effect.isOffensive ? 1 : 0, effect.isAssistance ? 1 : 0,
      effect.durationAttributeID, effect.rangeAttributeID, effect.dischargeAttributeID
    ]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO dogma_effects (effectID, effectName, description, effectCategory, preExpression, postExpression, published, isOffensive, isAssistance, durationAttributeID, rangeAttributeID, dischargeAttributeID) VALUES ${placeholders}`,
      values
    );
  }

  private async insertTypesBatch(types: any[]): Promise<void> {
    const placeholders = types.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = types.flatMap(type => [
      type.typeID, type.groupID, type.categoryID, type.typeName, type.description,
      type.mass, type.volume, type.capacity, type.published ? 1 : 0,
      type.marketGroupID, type.portionSize, type.raceID, type.basePrice
    ]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO inv_types (typeID, groupID, categoryID, typeName, description, mass, volume, capacity, published, marketGroupID, portionSize, raceID, basePrice) VALUES ${placeholders}`,
      values
    );
  }

  private async insertTypeAttributesBatch(attributes: any[]): Promise<void> {
    const placeholders = attributes.map(() => '(?, ?, ?)').join(', ');
    const values = attributes.flatMap(attr => [attr.typeID, attr.attributeID, attr.value]);
    
    await sdeService.runQuery(
      `INSERT OR REPLACE INTO type_attributes (typeID, attributeID, value) VALUES ${placeholders}`,
      values
    );
  }

  private extractEnglishName(nameObj: any): string {
    if (typeof nameObj === 'string') return nameObj;
    if (typeof nameObj === 'object' && nameObj !== null) {
      return nameObj.en || nameObj.english || Object.values(nameObj)[0] || 'Unknown';
    }
    return 'Unknown';
  }

  private async getCategoryIDFromGroupID(groupID: number): Promise<number | null> {
    // Check cache first
    if (this.groupToCategoryMap.has(groupID)) {
      return this.groupToCategoryMap.get(groupID)!;
    }

    // Query database for categoryID
    try {
      const categoryID = await sdeService.getCategoryIDFromGroupID(groupID);
      if (categoryID) {
        this.groupToCategoryMap.set(groupID, categoryID);
        return categoryID;
      }
    } catch (error) {
      console.warn(`⚠️ Could not find categoryID for groupID ${groupID}:`, error);
    }

    return null;
  }
}