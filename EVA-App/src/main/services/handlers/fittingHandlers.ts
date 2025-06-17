import { ipcMain } from 'electron';
import { fittingCalculator } from '../../../services/fittingCalculator';
import { sdeService } from '../../../services/sdeService';
import { fittingCache, CACHE_CONFIGS } from '../../../services/cacheService';

class FittingHandlers {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    ipcMain.handle('fitting:calculate', async (event, shipData: any, modulesData: any[]) => {
      try {
        // Create a cache key based on ship and modules
        const cacheKey = `stats:${shipData.typeID}:${this.hashModules(modulesData)}`;
        
        return fittingCache.getOrSet(cacheKey, async () => {
          return await fittingCalculator.calculateFittingStats(shipData, modulesData);
        }, CACHE_CONFIGS.FITTING_STATS.ttl);
      } catch (error) {
        console.error('❌ Failed to calculate fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:validate', async (event, shipData: any, modulesData: any[]) => {
      try {
        const validation = await this.validateFitting(shipData, modulesData);
        return validation;
      } catch (error) {
        console.error('❌ Failed to validate fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:save', async (event, fitting: any) => {
      console.log('💾 Saving fitting...');
      try {
        const fittingId = await sdeService.saveFitting(fitting);
        console.log('✅ Fitting saved with ID:', fittingId);
        return fittingId;
      } catch (error) {
        console.error('❌ Failed to save fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:getFittings', async () => {
      console.log('📋 Getting saved fittings...');
      try {
        const fittings = await sdeService.getFittings();
        console.log('✅ Fittings retrieved:', fittings.length, 'fittings');
        return fittings;
      } catch (error) {
        console.error('❌ Failed to get fittings:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:deleteFitting', async (event, fittingId: number) => {
      console.log('🗑️ Deleting fitting:', fittingId);
      try {
        await sdeService.runQuery(
          'DELETE FROM saved_fittings WHERE id = ?',
          [fittingId]
        );
        console.log('✅ Fitting deleted');
        return true;
      } catch (error) {
        console.error('❌ Failed to delete fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:updateFitting', async (event, fittingId: number, fitting: any) => {
      console.log('📝 Updating fitting:', fittingId);
      try {
        await sdeService.runQuery(
          'UPDATE saved_fittings SET name = ?, fitting_data = ?, updated_at = ? WHERE id = ?',
          [fitting.name, JSON.stringify(fitting), new Date().toISOString(), fittingId]
        );
        console.log('✅ Fitting updated');
        return true;
      } catch (error) {
        console.error('❌ Failed to update fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:importEFT', async (event, eftString: string) => {
      console.log('📥 Importing EFT fitting...');
      try {
        const fitting = await this.parseEFTFitting(eftString);
        return fitting;
      } catch (error) {
        console.error('❌ Failed to import EFT fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:exportEFT', async (event, fitting: any) => {
      console.log('📤 Exporting fitting to EFT...');
      try {
        const eftString = await this.generateEFTFitting(fitting);
        return eftString;
      } catch (error) {
        console.error('❌ Failed to export EFT fitting:', error);
        throw error;
      }
    });

    ipcMain.handle('fitting:calculateDPS', async (event, weaponModules: any[], targetProfile: any) => {
      console.log('💥 Calculating DPS...');
      try {
        const { dpsCalculator } = await import('../../../services/dpsCalculator');
        const dpsResult = await dpsCalculator.calculateComprehensiveDPS(
          weaponModules.map(m => m.typeID),
          [], // Damage modules would be passed here
          0, // Ship type ID would be passed here
          targetProfile
        );
        return dpsResult;
      } catch (error) {
        console.error('❌ Failed to calculate DPS:', error);
        throw error;
      }
    });
  }

  private hashModules(modulesData: any[]): string {
    // Create a deterministic hash based on module types and quantities
    const moduleMap = new Map<number, number>();
    
    modulesData.forEach(module => {
      const count = moduleMap.get(module.typeID) || 0;
      moduleMap.set(module.typeID, count + 1);
    });
    
    const sortedEntries = Array.from(moduleMap.entries()).sort((a, b) => a[0] - b[0]);
    return sortedEntries.map(([typeID, count]) => `${typeID}:${count}`).join(',');
  }

  private async validateFitting(shipData: any, modulesData: any[]) {
    const validation = {
      valid: true,
      warnings: [] as string[],
      errors: [] as string[]
    };

    // Check CPU usage
    const cpuUsed = modulesData.reduce((sum, m) => sum + (m.attributes?.[50] || 0), 0);
    const cpuTotal = shipData.attributes?.[48] || 0;
    if (cpuUsed > cpuTotal) {
      validation.valid = false;
      validation.errors.push(`CPU overloaded: ${cpuUsed.toFixed(1)}/${cpuTotal.toFixed(1)} tf`);
    }

    // Check Powergrid usage
    const pgUsed = modulesData.reduce((sum, m) => sum + (m.attributes?.[30] || 0), 0);
    const pgTotal = shipData.attributes?.[11] || 0;
    if (pgUsed > pgTotal) {
      validation.valid = false;
      validation.errors.push(`Powergrid overloaded: ${pgUsed.toFixed(1)}/${pgTotal.toFixed(1)} MW`);
    }

    // Check slot usage
    const highSlots = modulesData.filter(m => m.slotType === 'high').length;
    const midSlots = modulesData.filter(m => m.slotType === 'mid').length;
    const lowSlots = modulesData.filter(m => m.slotType === 'low').length;
    const rigSlots = modulesData.filter(m => m.slotType === 'rig').length;

    if (highSlots > (shipData.highSlots || 0)) {
      validation.valid = false;
      validation.errors.push(`Too many high slot modules: ${highSlots}/${shipData.highSlots}`);
    }

    if (midSlots > (shipData.midSlots || 0)) {
      validation.valid = false;
      validation.errors.push(`Too many mid slot modules: ${midSlots}/${shipData.midSlots}`);
    }

    if (lowSlots > (shipData.lowSlots || 0)) {
      validation.valid = false;
      validation.errors.push(`Too many low slot modules: ${lowSlots}/${shipData.lowSlots}`);
    }

    if (rigSlots > (shipData.rigSlots || 0)) {
      validation.valid = false;
      validation.errors.push(`Too many rig modules: ${rigSlots}/${shipData.rigSlots}`);
    }

    // Check for duplicate unique modules
    const uniqueModules = new Set<number>();
    for (const module of modulesData) {
      if (module.isUnique && uniqueModules.has(module.typeID)) {
        validation.valid = false;
        validation.errors.push(`Duplicate unique module: ${module.typeName}`);
      }
      if (module.isUnique) {
        uniqueModules.add(module.typeID);
      }
    }

    return validation;
  }

  private async parseEFTFitting(eftString: string): Promise<any> {
    const lines = eftString.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('Empty EFT string');
    }

    // Parse ship and fitting name from first line
    const headerMatch = lines[0].match(/\[([^\]]+)\s*,\s*([^\]]+)\]/);
    if (!headerMatch) {
      throw new Error('Invalid EFT format - missing header');
    }

    const shipName = headerMatch[1].trim();
    const fittingName = headerMatch[2].trim();

    // Find ship type ID
    const shipData = await sdeService.runQuery(
      'SELECT typeID FROM inv_types WHERE typeName = ?',
      [shipName]
    );

    if (!shipData) {
      throw new Error(`Unknown ship: ${shipName}`);
    }

    const modules = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('[empty')) continue;

      // Parse module name and charge (if any)
      const parts = line.split(',');
      const moduleName = parts[0].trim();
      const chargeName = parts[1]?.trim();

      // Find module type ID
      const moduleData = await sdeService.runQuery(
        'SELECT typeID, groupID FROM inv_types WHERE typeName = ?',
        [moduleName]
      );

      if (moduleData) {
        modules.push({
          typeID: moduleData.typeID,
          typeName: moduleName,
          chargeTypeID: chargeName ? await this.findChargeTypeID(chargeName) : null
        });
      }
    }

    return {
      shipTypeID: shipData.typeID,
      shipName,
      name: fittingName,
      modules
    };
  }

  private async findChargeTypeID(chargeName: string): Promise<number | null> {
    const chargeData = await sdeService.runQuery(
      'SELECT typeID FROM inv_types WHERE typeName = ?',
      [chargeName]
    );
    return chargeData?.typeID || null;
  }

  private async generateEFTFitting(fitting: any): Promise<string> {
    const lines = [`[${fitting.shipName}, ${fitting.name}]`];
    
    // Group modules by slot
    const highSlots = fitting.modules.filter((m: any) => m.slotType === 'high');
    const midSlots = fitting.modules.filter((m: any) => m.slotType === 'mid');
    const lowSlots = fitting.modules.filter((m: any) => m.slotType === 'low');
    const rigSlots = fitting.modules.filter((m: any) => m.slotType === 'rig');
    const subsystems = fitting.modules.filter((m: any) => m.slotType === 'subsystem');

    // Add modules in order
    for (const module of lowSlots) {
      lines.push(module.typeName);
    }
    if (lowSlots.length > 0 && midSlots.length > 0) lines.push('');

    for (const module of midSlots) {
      lines.push(module.typeName);
    }
    if (midSlots.length > 0 && highSlots.length > 0) lines.push('');

    for (const module of highSlots) {
      if (module.chargeName) {
        lines.push(`${module.typeName}, ${module.chargeName}`);
      } else {
        lines.push(module.typeName);
      }
    }
    if (highSlots.length > 0 && rigSlots.length > 0) lines.push('');

    for (const module of rigSlots) {
      lines.push(module.typeName);
    }
    if (rigSlots.length > 0 && subsystems.length > 0) lines.push('');

    for (const module of subsystems) {
      lines.push(module.typeName);
    }

    return lines.join('\n');
  }
}

export const fittingHandlers = new FittingHandlers();