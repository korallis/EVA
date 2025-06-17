import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';
import { authService } from './services/AuthService';
import { esiService } from './services/EsiService';
import { settingsService } from './services/SettingsService';
import { notificationService } from './services/NotificationService';
import { cacheService } from './services/CacheService';
import { characterService } from './services/CharacterService';
import { skillQueueService } from './services/SkillQueueService';
import { SystemTrayService } from './services/SystemTrayService';
import { sdeService } from '../services/sdeService';
import * as path from 'path';
import { sdeImporter } from '../services/sdeImporter';
import { sdeDownloader } from '../services/sdeDownloader';
import { startupSDEManager } from '../services/startupSDEManager';
import { FittingCalculator } from '../services/fittingCalculator';
import { ImprovedFittingCalculator } from '../services/improvedFittingCalculator';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;
let systemTray: SystemTrayService | null = null;

const createWindow = (): void => {
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    try {
      const iconPath = path.join(__dirname, '../../src/assets/icons/icon.png');
      const dockIcon = nativeImage.createFromPath(iconPath);
      if (!dockIcon.isEmpty()) {
        app.dock.setIcon(dockIcon);
        console.log('✅ Dock icon set successfully');
      } else {
        console.warn('⚠️ Could not load dock icon from:', iconPath);
      }
    } catch (error) {
      console.error('❌ Failed to set dock icon:', error);
    }
  }

  // Get saved window state
  const windowState = settingsService.getWindowState();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minHeight: 700,
    minWidth: 1200,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: '', // Disable experimental features
      disableBlinkFeatures: 'Autofill' // Disable autofill to prevent console errors
    },
    icon: process.platform === 'darwin' 
      ? require('path').join(__dirname, '..', 'assets', 'icons', 'icon.icns')
      : require('path').join(__dirname, '..', 'assets', 'icons', 'icon.png'),
    show: false // Don't show until ready
  });

  // Load the app
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Initialize system tray after window is ready
    if (SystemTrayService.isSupported()) {
      systemTray = new SystemTrayService(mainWindow!);
    }
  });

  // Open DevTools in development with proper configuration
  if (settingsService.isDevelopmentMode()) {
    mainWindow.webContents.once('did-finish-load', () => {
      // Only open DevTools if explicitly requested, not automatically
      // This prevents the Autofill protocol errors
      if (process.env.OPEN_DEVTOOLS === 'true') {
        mainWindow?.webContents.openDevTools({ mode: 'detach' });
      }
    });
  }

  // Save window state on resize/move
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      settingsService.updateWindowState(bounds.width, bounds.height, bounds.x, bounds.y);
    }
  });

  mainWindow.on('move', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      settingsService.updateWindowState(bounds.width, bounds.height, bounds.x, bounds.y);
    }
  });

  // Setup URL scheme handling for authentication
  app.setAsDefaultProtocolClient('eva');
  app.setAsDefaultProtocolClient('evaapp');
};

// App event handlers
app.on('ready', () => {
  createWindow();
  
  // Initialize services
  initializeServices();
});

app.on('window-all-closed', () => {
  // Keep app running in system tray
  if (process.platform !== 'darwin' && !systemTray) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Cleanup services
  if (systemTray) {
    systemTray.destroy();
  }
  skillQueueService.stopMonitoring();
});

// Handle URL scheme callbacks (macOS)
app.on('open-url', async (event, url) => {
  event.preventDefault();
  console.log('📞 Received URL callback:', url);
  try {
    await authService.handleAuthCallback(url);
    
    // Notify renderer of successful auth
    if (mainWindow) {
      mainWindow.webContents.send('auth:success');
    }
  } catch (error) {
    console.error('❌ URL callback failed:', error);
  }
});

// Handle URL scheme callbacks (Windows)
app.on('second-instance', async (event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('eva://'));
  if (url) {
    console.log('📞 Received URL callback (Windows):', url);
    try {
      await authService.handleAuthCallback(url);
      
      // Notify renderer of successful auth
      if (mainWindow) {
        mainWindow.webContents.send('auth:success');
      }
    } catch (error) {
      console.error('❌ URL callback failed:', error);
    }
  }
});

// Initialize all services
async function initializeServices(): Promise<void> {
  try {
    console.log('🚀 Initializing EVA services...');
    
    // Set up startup SDE manager with main window
    if (mainWindow) {
      startupSDEManager.setMainWindow(mainWindow);
    }
    
    // Check and update SDE database (this will trigger comprehensive import if needed)
    console.log('📦 Checking SDE database status...');
    const sdeReady = await startupSDEManager.checkAndUpdateSDE();
    
    if (!sdeReady) {
      console.warn('⚠️ SDE initialization failed, falling back to basic service');
      await sdeService.initialize();
    }
    
    // Preload cache data if enabled
    await cacheService.preloadData();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    // Fallback to basic SDE service if startup manager fails
    try {
      await sdeService.initialize();
      console.log('✅ Fallback SDE service initialized');
    } catch (fallbackError) {
      console.error('❌ Even fallback SDE initialization failed:', fallbackError);
    }
  }
}

// ===== IPC HANDLERS =====

// Authentication handlers
ipcMain.handle('auth:check', async () => {
  try {
    return await authService.isAuthenticated();
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return false;
  }
});

ipcMain.handle('auth:start', async () => {
  try {
    console.log('🔄 Main process: Starting authentication...');
    const success = await authService.startAuthentication();
    console.log('🔄 Main process: Authentication completed, success:', success);
    
    if (success && mainWindow) {
      console.log('📤 Main process: Sending auth:success event to renderer');
      // Notify renderer of successful auth
      mainWindow.webContents.send('auth:success');
    } else {
      console.log('❌ Main process: Not sending auth:success event - success:', success, 'mainWindow:', !!mainWindow);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
});

ipcMain.handle('auth:logout', async () => {
  try {
    await authService.logout();
    console.log('✅ Logout successful');
    
    // Notify renderer of logout
    if (mainWindow) {
      mainWindow.webContents.send('auth:logout');
    }
  } catch (error) {
    console.error('❌ Logout failed:', error);
    throw error;
  }
});

ipcMain.handle('auth:getCharacter', async () => {
  try {
    return await authService.getCharacterData();
  } catch (error) {
    console.error('❌ Failed to get character data:', error);
    return null;
  }
});

// ESI handlers
ipcMain.handle('esi:getCharacterSkills', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterSkills(id);
  } catch (error) {
    console.error('❌ Failed to fetch character skills:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterSkillQueue', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterSkillQueue(id);
  } catch (error) {
    console.error('❌ Failed to fetch skill queue:', error);
    throw error;
  }
});

ipcMain.handle('esi:getSkillTypes', async (event, skillIds: number[]) => {
  try {
    return await esiService.getSkillTypes(skillIds);
  } catch (error) {
    console.error('❌ Failed to fetch skill types:', error);
    throw error;
  }
});

ipcMain.handle('esi:refreshCharacterData', async (event, characterId?: number) => {
  try {
    return await esiService.refreshCharacterData(characterId);
  } catch (error) {
    console.error('❌ Failed to refresh character data:', error);
    throw error;
  }
});

// New ESI Character Overview handlers
ipcMain.handle('esi:getCharacterLocation', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterLocation(id);
  } catch (error) {
    console.error('❌ Failed to fetch character location:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterShip', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterShip(id);
  } catch (error) {
    console.error('❌ Failed to fetch character ship:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterWallet', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterWallet(id);
  } catch (error) {
    console.error('❌ Failed to fetch character wallet:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCorporationInfo', async (event, corporationId: number) => {
  try {
    return await esiService.getCorporationInfo(corporationId);
  } catch (error) {
    console.error('❌ Failed to fetch corporation info:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterCorporationHistory', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterCorporationHistory(id);
  } catch (error) {
    console.error('❌ Failed to fetch corporation history:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterClones', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterClones(id);
  } catch (error) {
    console.error('❌ Failed to fetch character clones:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterImplants', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterImplants(id);
  } catch (error) {
    console.error('❌ Failed to fetch character implants:', error);
    throw error;
  }
});

ipcMain.handle('esi:getSystemInfo', async (event, systemId: number) => {
  try {
    return await esiService.getSystemInfo(systemId);
  } catch (error) {
    console.error('❌ Failed to fetch system info:', error);
    throw error;
  }
});

ipcMain.handle('esi:getStationInfo', async (event, stationId: number) => {
  try {
    return await esiService.getStationInfo(stationId);
  } catch (error) {
    console.error('❌ Failed to fetch station info:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterBlueprints', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getCharacterBlueprints(id);
  } catch (error) {
    console.error('❌ Failed to fetch character blueprints:', error);
    throw error;
  }
});

ipcMain.handle('esi:getEnhancedCharacterClones', async (event, characterId?: string) => {
  try {
    const id = characterId ? parseInt(characterId) : undefined;
    return await esiService.getEnhancedCharacterClones(id);
  } catch (error) {
    console.error('❌ Failed to fetch enhanced character clones:', error);
    throw error;
  }
});

// Settings handlers
ipcMain.handle('settings:get', async () => {
  try {
    return settingsService.getSettings();
  } catch (error) {
    console.error('❌ Failed to get settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:update', async (event, updates: any) => {
  try {
    settingsService.updateSettings(updates);
    return true;
  } catch (error) {
    console.error('❌ Failed to update settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:reset', async () => {
  try {
    settingsService.resetToDefaults();
    return true;
  } catch (error) {
    console.error('❌ Failed to reset settings:', error);
    throw error;
  }
});

// Notification handlers
ipcMain.handle('notifications:test', async () => {
  try {
    await notificationService.sendTestNotification();
    return true;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    throw error;
  }
});

ipcMain.handle('notifications:getStats', async () => {
  try {
    return notificationService.getNotificationStats();
  } catch (error) {
    console.error('❌ Failed to get notification stats:', error);
    throw error;
  }
});

// SDE handlers (existing)
ipcMain.handle('sde:initialize', async () => {
  try {
    await sdeService.initialize();
    return true;
  } catch (error) {
    console.error('❌ SDE initialization failed:', error);
    return false;
  }
});

ipcMain.handle('sde:getShips', async () => {
  try {
    return await sdeService.getShips();
  } catch (error) {
    console.error('❌ Failed to get ships:', error);
    throw error;
  }
});

ipcMain.handle('sde:getModules', async () => {
  try {
    return await sdeService.getModules();
  } catch (error) {
    console.error('❌ Failed to get modules:', error);
    throw error;
  }
});

ipcMain.handle('sde:getTypeAttributes', async (event, typeID: number) => {
  try {
    return await sdeService.getTypeAttributes(typeID);
  } catch (error) {
    console.error('❌ Failed to get type attributes:', error);
    throw error;
  }
});

ipcMain.handle('sde:getSkillRequirements', async (event, typeID: number) => {
  try {
    return await sdeService.getSkillRequirements(typeID);
  } catch (error) {
    console.error('❌ Failed to get skill requirements:', error);
    throw error;
  }
});

ipcMain.handle('sde:import', async () => {
  try {
    await sdeImporter.importFullSDE();
    return { success: true, message: 'SDE data imported successfully' };
  } catch (error) {
    console.error('❌ SDE import failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sde:clearDatabase', async () => {
  try {
    await sdeService.clearDatabase();
    return { success: true, message: 'Database cleared and reinitialized successfully' };
  } catch (error) {
    console.error('❌ SDE database clear failed:', error);
    return { success: false, error: error.message };
  }
});

// SDE Downloader handlers
ipcMain.handle('sde:checkVersion', async () => {
  try {
    const versionInfo = await sdeDownloader.checkLatestVersion();
    return versionInfo;
  } catch (error) {
    console.error('❌ Failed to check SDE version:', error);
    throw error;
  }
});

ipcMain.handle('sde:getInstalledVersion', async () => {
  try {
    const versionInfo = await sdeDownloader.getInstalledVersion();
    return versionInfo;
  } catch (error) {
    console.error('❌ Failed to get installed SDE version:', error);
    throw error;
  }
});

ipcMain.handle('sde:download', async (event) => {
  try {
    const success = await sdeDownloader.downloadAndInstallSDE((progress) => {
      // Send progress updates to renderer
      event.sender.send('sde:downloadProgress', progress);
    });
    return { success, message: success ? 'SDE downloaded successfully' : 'SDE download failed' };
  } catch (error) {
    console.error('❌ SDE download failed:', error);
    return { success: false, error: error.message };
  }
});

// SDE Statistics handlers
ipcMain.handle('sde:getShipCountsByRace', async () => {
  try {
    return await sdeService.getShipCountsByRace();
  } catch (error) {
    console.error('❌ Failed to get ship counts by race:', error);
    throw error;
  }
});

ipcMain.handle('sde:getModuleCountsByCategory', async () => {
  try {
    return await sdeService.getModuleCountsByCategory();
  } catch (error) {
    console.error('❌ Failed to get module counts by category:', error);
    throw error;
  }
});

ipcMain.handle('sde:getStatistics', async () => {
  try {
    return await sdeService.getSDEStatistics();
  } catch (error) {
    console.error('❌ Failed to get SDE statistics:', error);
    throw error;
  }
});

ipcMain.handle('sde:getImplantNames', async (event, implantIds: number[]) => {
  try {
    return await sdeService.getImplantNames(implantIds);
  } catch (error) {
    console.error('❌ Failed to get implant names:', error);
    throw error;
  }
});

ipcMain.handle('sde:getBlueprintNames', async (event, typeIds: number[]) => {
  try {
    return await sdeService.getBlueprintNames(typeIds);
  } catch (error) {
    console.error('❌ Failed to get blueprint names:', error);
    throw error;
  }
});

ipcMain.handle('sde:getBlueprintStatistics', async () => {
  try {
    return await sdeService.getBlueprintStatistics();
  } catch (error) {
    console.error('❌ Failed to get blueprint statistics:', error);
    throw error;
  }
});

// Startup SDE Management handlers
ipcMain.handle('startup:checkSDE', async () => {
  try {
    const sdeReady = await startupSDEManager.checkAndUpdateSDE();
    return { success: sdeReady };
  } catch (error) {
    console.error('❌ Manual SDE check failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('startup:forceSDERefresh', async () => {
  try {
    const sdeReady = await startupSDEManager.forceSDERefresh();
    return { success: sdeReady };
  } catch (error) {
    console.error('❌ Force SDE refresh failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('startup:getSDEStatus', async () => {
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

// Fitting handlers (existing)
ipcMain.handle('fitting:calculate', async (event, shipData: any, modulesData: any[]) => {
  try {
    const { fittingCalculator } = await import('../services/fittingCalculator');
    const stats = await fittingCalculator.calculateFittingStats(shipData, modulesData);
    return stats;
  } catch (error) {
    console.error('❌ Failed to calculate fitting:', error);
    throw error;
  }
});

ipcMain.handle('fitting:calculateAdvanced', async (event, shipData: any, weaponsData: any[], targetProfile?: any) => {
  try {
    const stats = ImprovedFittingCalculator.calculateAdvancedFittingStats(shipData, weaponsData, targetProfile);
    return stats;
  } catch (error) {
    console.error('❌ Failed to calculate advanced fitting:', error);
    throw error;
  }
});

ipcMain.handle('fitting:validate', async (event, shipData: any, modulesData: any[]) => {
  try {
    // For now, return a simple validation - this would be implemented later
    return { valid: true, warnings: [], errors: [] };
  } catch (error) {
    console.error('❌ Failed to validate fitting:', error);
    throw error;
  }
});

ipcMain.handle('fitting:save', async (event, fitting: any) => {
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
  try {
    const fittings = await sdeService.getFittings();
    console.log('✅ Fittings retrieved:', fittings.length, 'fittings');
    return fittings;
  } catch (error) {
    console.error('❌ Failed to get fittings:', error);
    throw error;
  }
});

// Cache handlers
ipcMain.handle('cache:getStats', async () => {
  try {
    return cacheService.getCacheStats();
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    throw error;
  }
});

ipcMain.handle('cache:clear', async () => {
  try {
    await cacheService.clearAll();
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    throw error;
  }
});

ipcMain.handle('cache:invalidateCharacter', async (event, characterId: number) => {
  try {
    await cacheService.invalidateCharacter(characterId);
    return true;
  } catch (error) {
    console.error('❌ Failed to invalidate character cache:', error);
    throw error;
  }
});

// Character management handlers
ipcMain.handle('characters:getAll', async () => {
  try {
    return characterService.getAllCharacters();
  } catch (error) {
    console.error('❌ Failed to get all characters:', error);
    throw error;
  }
});

ipcMain.handle('characters:getActive', async () => {
  try {
    return characterService.getActiveCharacter();
  } catch (error) {
    console.error('❌ Failed to get active character:', error);
    throw error;
  }
});

ipcMain.handle('characters:setActive', async (event, characterId: number) => {
  try {
    const success = characterService.setActiveCharacter(characterId);
    return success;
  } catch (error) {
    console.error('❌ Failed to set active character:', error);
    throw error;
  }
});

ipcMain.handle('characters:remove', async (event, characterId: number) => {
  try {
    const success = characterService.removeCharacter(characterId);
    return success;
  } catch (error) {
    console.error('❌ Failed to remove character:', error);
    throw error;
  }
});

ipcMain.handle('characters:reorder', async (event, characterIds: number[]) => {
  try {
    characterService.reorderCharacters(characterIds);
    return true;
  } catch (error) {
    console.error('❌ Failed to reorder characters:', error);
    throw error;
  }
});

ipcMain.handle('characters:updateTraining', async (event, characterId?: number) => {
  try {
    if (characterId) {
      const character = characterService.getCharacter(characterId);
      if (character) {
        await characterService.updateCharacterTrainingStatus(character);
      }
    } else {
      await characterService.updateAllCharacterTrainingStatus();
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to update character training:', error);
    throw error;
  }
});

ipcMain.handle('characters:getStats', async () => {
  try {
    return characterService.getCharacterStats();
  } catch (error) {
    console.error('❌ Failed to get character stats:', error);
    throw error;
  }
});

ipcMain.handle('characters:getTraining', async () => {
  try {
    return characterService.getTrainingCharacters();
  } catch (error) {
    console.error('❌ Failed to get training characters:', error);
    throw error;
  }
});

// Skill Queue monitoring handlers
ipcMain.handle('skillQueue:getStats', async () => {
  try {
    return skillQueueService.getQueueStats();
  } catch (error) {
    console.error('❌ Failed to get skill queue stats:', error);
    throw error;
  }
});

ipcMain.handle('skillQueue:checkNow', async (event, characterId?: number) => {
  try {
    if (characterId) {
      await skillQueueService.checkCharacterNow(characterId);
    } else {
      await skillQueueService.checkAllCharacterQueues();
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to check skill queue:', error);
    throw error;
  }
});

ipcMain.handle('skillQueue:getUpcoming', async (event, hoursAhead: number = 24) => {
  try {
    return await skillQueueService.getUpcomingCompletions(hoursAhead);
  } catch (error) {
    console.error('❌ Failed to get upcoming completions:', error);
    throw error;
  }
});

ipcMain.handle('skillQueue:startMonitoring', async () => {
  try {
    skillQueueService.startMonitoring();
    return true;
  } catch (error) {
    console.error('❌ Failed to start skill queue monitoring:', error);
    throw error;
  }
});

ipcMain.handle('skillQueue:stopMonitoring', async () => {
  try {
    skillQueueService.stopMonitoring();
    return true;
  } catch (error) {
    console.error('❌ Failed to stop skill queue monitoring:', error);
    throw error;
  }
});

ipcMain.handle('skillQueue:clearCache', async () => {
  try {
    skillQueueService.clearCompletedSkillsCache();
    return true;
  } catch (error) {
    console.error('❌ Failed to clear skill queue cache:', error);
    throw error;
  }
});

// System Tray handlers
ipcMain.handle('systemTray:isSupported', async () => {
  try {
    return SystemTrayService.isSupported();
  } catch (error) {
    console.error('❌ Failed to check system tray support:', error);
    return false;
  }
});

ipcMain.handle('systemTray:forceUpdate', async () => {
  try {
    if (systemTray) {
      systemTray.forceUpdate();
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to update system tray:', error);
    throw error;
  }
});

ipcMain.handle('systemTray:showBalloon', async (event, title: string, content: string) => {
  try {
    if (systemTray) {
      systemTray.displayBalloon(title, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to show tray balloon:', error);
    throw error;
  }
});

console.log('✅ EVA Main Process Started Successfully with Service Architecture');