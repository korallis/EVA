import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { sdeService } from './sdeService';

interface DogmaAttributeData {
  attributeID?: number;
  attributeName?: string;
  displayName?: string;
  description?: string;
  defaultValue?: number;
  highIsGood?: boolean;
  stackable?: boolean;
  unitID?: number;
  iconID?: number;
  published?: boolean;
}

export class DogmaAttributeFixer {
  private sdeBasePath: string;

  constructor() {
    // Try multiple common SDE locations
    const possiblePaths = [
      '/Users/lee/Downloads/sde',
      '/Users/lee/sde',
      '/Users/lee/EVA/sde',
      '/Users/lee/Desktop/sde'
    ];

    this.sdeBasePath = possiblePaths.find(p => fs.existsSync(p)) || '';
  }

  async fixDogmaAttributes(): Promise<number> {
    console.log('🔧 Fixing dogma attribute names...');

    if (!this.sdeBasePath) {
      console.warn('⚠️ SDE directory not found. Downloading SDE first...');
      // Try to trigger SDE download
      const { sdeDownloader } = await import('./sdeDownloader');
      await sdeDownloader.downloadAndInstallSDE();
      
      // Retry finding SDE path after download
      const possiblePaths = [
        '/Users/lee/Downloads/sde',
        '/Users/lee/sde',
        '/Users/lee/EVA/sde',
        '/Users/lee/Desktop/sde'
      ];
      this.sdeBasePath = possiblePaths.find(p => fs.existsSync(p)) || '';
      
      if (!this.sdeBasePath) {
        throw new Error('Could not find or download SDE data');
      }
    }

    const attributesPath = path.join(this.sdeBasePath, 'fsd', 'dogmaAttributes.yaml');
    
    if (!fs.existsSync(attributesPath)) {
      console.warn('⚠️ Dogma attributes YAML file not found at:', attributesPath);
      return await this.fixWithHardcodedNames();
    }

    try {
      console.log('📖 Reading dogma attributes from SDE...');
      const attributesYaml = fs.readFileSync(attributesPath, 'utf8');
      const attributesData = yaml.load(attributesYaml) as Record<string, DogmaAttributeData>;
      
      let fixedCount = 0;
      
      for (const [id, data] of Object.entries(attributesData)) {
        const attributeID = parseInt(id);
        const attributeName = data.displayName || data.attributeName || `Attribute ${id}`;
        const description = data.description || '';
        
        await sdeService.runQuery(
          'UPDATE dogma_attributes SET attributeName = ?, description = ? WHERE attributeID = ?',
          [attributeName, description, attributeID]
        );
        
        fixedCount++;
        
        if (fixedCount % 100 === 0) {
          console.log(`🔄 Fixed ${fixedCount} attribute names...`);
        }
      }
      
      console.log(`✅ Fixed ${fixedCount} dogma attribute names from SDE`);
      return fixedCount;
      
    } catch (error) {
      console.error('❌ Failed to fix dogma attributes from SDE:', error);
      return await this.fixWithHardcodedNames();
    }
  }

  private async fixWithHardcodedNames(): Promise<number> {
    console.log('🔧 Applying hardcoded attribute name fixes...');
    
    // Common EVE Online dogma attributes with their proper names
    const knownAttributes = [
      { id: 3, name: 'Armor HP' },
      { id: 4, name: 'Mass' },
      { id: 6, name: 'Capacitor Need' },
      { id: 9, name: 'Structure HP' },
      { id: 11, name: 'Power Output' },
      { id: 12, name: 'Low Slots' },
      { id: 13, name: 'Med Slots' },
      { id: 14, name: 'High Slots' },
      { id: 30, name: 'Power Need' },
      { id: 37, name: 'Max Velocity' },
      { id: 48, name: 'CPU Output' },
      { id: 49, name: 'CPU Need' },
      { id: 51, name: 'Rate of Fire' },
      { id: 54, name: 'Optimal Range' },
      { id: 55, name: 'Capacitor Recharge Time' },
      { id: 64, name: 'Damage Multiplier' },
      { id: 70, name: 'Inertia Modifier' },
      { id: 76, name: 'Max Target Range' },
      { id: 109, name: 'Kinetic Damage Resonance' },
      { id: 110, name: 'Thermal Damage Resonance' },
      { id: 111, name: 'Explosive Damage Resonance' },
      { id: 113, name: 'EM Damage Resonance' },
      { id: 114, name: 'EM Damage' },
      { id: 116, name: 'Explosive Damage' },
      { id: 117, name: 'Kinetic Damage' },
      { id: 118, name: 'Thermal Damage' },
      { id: 128, name: 'Charge Size' },
      { id: 158, name: 'Accuracy Falloff' },
      { id: 160, name: 'Tracking Speed' },
      { id: 161, name: 'Volume' },
      { id: 182, name: 'Required Skill 1' },
      { id: 183, name: 'Required Skill 1 Level' },
      { id: 184, name: 'Required Skill 2' },
      { id: 185, name: 'Required Skill 2 Level' },
      { id: 186, name: 'Required Skill 3' },
      { id: 187, name: 'Required Skill 3 Level' },
      { id: 192, name: 'Max Locked Targets' },
      { id: 208, name: 'Radar Sensor Strength' },
      { id: 209, name: 'Ladar Sensor Strength' },
      { id: 210, name: 'Magnetometric Sensor Strength' },
      { id: 211, name: 'Gravimetric Sensor Strength' },
      { id: 263, name: 'Shield HP' },
      { id: 265, name: 'Armor HP' },
      { id: 267, name: 'Armor EM Resistance' },
      { id: 268, name: 'Armor Thermal Resistance' },
      { id: 269, name: 'Armor Kinetic Resistance' },
      { id: 270, name: 'Armor Explosive Resistance' },
      { id: 271, name: 'Shield EM Resistance' },
      { id: 272, name: 'Shield Thermal Resistance' },
      { id: 273, name: 'Shield Kinetic Resistance' },
      { id: 274, name: 'Shield Explosive Resistance' },
      { id: 422, name: 'Tech Level' },
      { id: 482, name: 'Capacitor Capacity' },
      { id: 552, name: 'Signature Radius' },
      { id: 564, name: 'Scan Resolution' },
      { id: 633, name: 'Meta Level' },
      { id: 653, name: 'AOE Velocity' },
      { id: 654, name: 'AOE Cloud Size' },
      { id: 1137, name: 'Rig Slots' },
      { id: 1547, name: 'Subsystem Slot' }
    ];

    let fixedCount = 0;
    
    for (const attr of knownAttributes) {
      await sdeService.runQuery(
        'UPDATE dogma_attributes SET attributeName = ? WHERE attributeID = ?',
        [attr.name, attr.id]
      );
      fixedCount++;
    }
    
    console.log(`✅ Applied ${fixedCount} hardcoded attribute name fixes`);
    return fixedCount;
  }

  async verifyAttributeNames(): Promise<void> {
    console.log('🔍 Verifying attribute names...');
    
    const sampleAttributes = await sdeService.runQuery(
      'SELECT attributeID, attributeName FROM dogma_attributes WHERE attributeID IN (114, 116, 117, 118, 64, 51) ORDER BY attributeID'
    );
    
    console.log('📊 Sample attribute names:');
    sampleAttributes.forEach((attr: any) => {
      console.log(`  ${attr.attributeID}: ${attr.attributeName}`);
    });
  }
}

export const dogmaAttributeFixer = new DogmaAttributeFixer();