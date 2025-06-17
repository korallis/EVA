import { ipcMain } from 'electron';
import { sdeService } from '../../../services/sdeService';
import { sdeImporter } from '../../../services/sdeImporter';
import { sdeDownloader } from '../../../services/sdeDownloader';
import { startupSDEManager } from '../../../services/startupSDEManager';

class SDEHandlers {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    // SDE Core Operations
    ipcMain.handle('sde:initialize', async () => {
      console.log('🔄 Initializing SDE database...');
      try {
        await sdeService.initialize();
        console.log('✅ SDE database initialized');
        return true;
      } catch (error) {
        console.error('❌ Failed to initialize SDE:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:getShips', async () => {
      console.log('🚢 Getting ships data...');
      try {
        const ships = await sdeService.getShips();
        console.log('✅ Ships data retrieved:', ships.length, 'ships');
        return ships;
      } catch (error) {
        console.error('❌ Failed to get ships:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:getModules', async () => {
      console.log('⚙️ Getting modules data...');
      try {
        const modules = await sdeService.getModules();
        console.log('✅ Modules data retrieved:', modules.length, 'modules');
        return modules;
      } catch (error) {
        console.error('❌ Failed to get modules:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:getTypeAttributes', async (event, typeID: number) => {
      try {
        const attributes = await sdeService.getTypeAttributes(typeID);
        return attributes;
      } catch (error) {
        console.error('❌ Failed to get type attributes:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:getSkillRequirements', async (event, typeID: number) => {
      try {
        const requirements = await sdeService.getSkillRequirements(typeID);
        return requirements;
      } catch (error) {
        console.error('❌ Failed to get skill requirements:', error);
        throw error;
      }
    });

    // SDE Import Operations
    ipcMain.handle('sde:import', async () => {
      console.log('🚀 Starting SDE import...');
      try {
        await sdeImporter.importFullSDE();
        console.log('✅ SDE import completed');
        return { success: true, message: 'SDE data imported successfully' };
      } catch (error) {
        console.error('❌ SDE import failed:', error);
        return { success: false, error: error.message };
      }
    });

    // SDE Downloader Operations
    ipcMain.handle('sde:checkVersion', async () => {
      console.log('🔍 Checking latest SDE version...');
      try {
        const versionInfo = await sdeDownloader.checkLatestVersion();
        console.log('✅ SDE version checked:', versionInfo?.version || 'Unknown');
        return versionInfo;
      } catch (error) {
        console.error('❌ Failed to check SDE version:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:getInstalledVersion', async () => {
      console.log('📋 Getting installed SDE version...');
      try {
        const versionInfo = await sdeDownloader.getInstalledVersion();
        console.log('✅ Installed SDE version:', versionInfo?.version || 'None');
        return versionInfo;
      } catch (error) {
        console.error('❌ Failed to get installed SDE version:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:download', async (event) => {
      console.log('📦 Starting SDE download...');
      try {
        const success = await sdeDownloader.downloadAndInstallSDE((progress) => {
          // Send progress updates to renderer
          event.sender.send('sde:downloadProgress', progress);
        });
        console.log('✅ SDE download completed:', success);
        return { success, message: success ? 'SDE downloaded successfully' : 'SDE download failed' };
      } catch (error) {
        console.error('❌ SDE download failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('sde:parse', async () => {
      console.log('🔄 Parsing SDE data...');
      try {
        const stats = await sdeDownloader.parseSDE();
        console.log('✅ SDE parsing completed:', stats);
        return stats;
      } catch (error) {
        console.error('❌ SDE parsing failed:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:clearDatabase', async () => {
      console.log('🗑️ Clearing SDE database...');
      try {
        await sdeService.clearDatabase();
        console.log('✅ SDE database cleared');
        return { success: true, message: 'SDE database cleared successfully' };
      } catch (error) {
        console.error('❌ Failed to clear SDE database:', error);
        return { success: false, error: error.message };
      }
    });

    // Startup SDE Management
    ipcMain.handle('startup:checkSDE', async () => {
      console.log('🔍 Manual SDE check requested...');
      try {
        const sdeReady = await startupSDEManager.checkAndUpdateSDE();
        return { success: sdeReady };
      } catch (error) {
        console.error('❌ Manual SDE check failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('startup:forceSDERefresh', async () => {
      console.log('🔄 Force SDE refresh requested...');
      try {
        const sdeReady = await startupSDEManager.forceSDERefresh();
        return { success: sdeReady };
      } catch (error) {
        console.error('❌ Force SDE refresh failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('startup:getSDEStatus', async () => {
      console.log('📊 SDE status requested...');
      try {
        const status = await startupSDEManager.getSDEStatus();
        return status;
      } catch (error) {
        console.error('❌ Failed to get SDE status:', error);
        return {
          hasData: false,
          version: 'Error',
          shipCount: 0,
          moduleCount: 0
        };
      }
    });

    // Type-specific queries
    ipcMain.handle('sde:getType', async (event, typeID: number) => {
      try {
        const type = await sdeService.runQuery(
          'SELECT * FROM inv_types WHERE typeID = ?',
          [typeID]
        );
        return type;
      } catch (error) {
        console.error('❌ Failed to get type:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:getGroup', async (event, groupID: number) => {
      try {
        const group = await sdeService.runQuery(
          'SELECT * FROM groups WHERE groupID = ?',
          [groupID]
        );
        return group;
      } catch (error) {
        console.error('❌ Failed to get group:', error);
        throw error;
      }
    });

    ipcMain.handle('sde:searchTypes', async (event, searchTerm: string) => {
      try {
        const types = await sdeService.runQuery(
          'SELECT * FROM inv_types WHERE typeName LIKE ? LIMIT 100',
          [`%${searchTerm}%`]
        );
        return types;
      } catch (error) {
        console.error('❌ Failed to search types:', error);
        throw error;
      }
    });

    // Fix dogma attribute names
    ipcMain.handle('sde:fixDogmaAttributes', async () => {
      console.log('🔧 Starting dogma attribute name fix...');
      try {
        const { dogmaAttributeFixer } = await import('../../../services/dogmaAttributeFixer');
        const fixedCount = await dogmaAttributeFixer.fixDogmaAttributes();
        await dogmaAttributeFixer.verifyAttributeNames();
        
        return { 
          success: true, 
          message: `Fixed ${fixedCount} dogma attribute names`,
          fixedCount 
        };
      } catch (error) {
        console.error('❌ Failed to fix dogma attributes:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    });
  }

  // Utility method to get SDE service instance
  getSDEService() {
    return sdeService;
  }
}

export const sdeHandlers = new SDEHandlers();