// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication API
  auth: {
    start: () => ipcRenderer.invoke('auth:start'),
    check: () => ipcRenderer.invoke('auth:check'),
    getCharacter: () => ipcRenderer.invoke('auth:getCharacter'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    onSuccess: (callback: () => void) => {
      ipcRenderer.on('auth:success', callback);
    },
    onLogout: (callback: () => void) => {
      ipcRenderer.on('auth:logout', callback);
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('auth:success');
      ipcRenderer.removeAllListeners('auth:logout');
    }
  },
  
  // ESI API
  esi: {
    // Character Skills
    getCharacterSkills: (characterId: string) => 
      ipcRenderer.invoke('esi:getCharacterSkills', characterId),
    getCharacterSkillQueue: (characterId: string) => 
      ipcRenderer.invoke('esi:getCharacterSkillQueue', characterId),
    getSkillTypes: (skillIds: number[]) => 
      ipcRenderer.invoke('esi:getSkillTypes', skillIds),
    
    // Character Location & Ship
    getCharacterLocation: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterLocation', characterId),
    getCharacterShip: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterShip', characterId),
    
    // Character Wallet
    getCharacterWallet: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterWallet', characterId),
    
    // Corporation
    getCorporationInfo: (corporationId: number) => 
      ipcRenderer.invoke('esi:getCorporationInfo', corporationId),
    getCharacterCorporationHistory: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterCorporationHistory', characterId),
    
    // Character Clones & Implants
    getCharacterClones: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterClones', characterId),
    getCharacterImplants: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterImplants', characterId),
    getCharacterBlueprints: (characterId?: string) => 
      ipcRenderer.invoke('esi:getCharacterBlueprints', characterId),
    getEnhancedCharacterClones: (characterId?: string) => 
      ipcRenderer.invoke('esi:getEnhancedCharacterClones', characterId),
    
    // Universe Data
    getSystemInfo: (systemId: number) => 
      ipcRenderer.invoke('esi:getSystemInfo', systemId),
    getStationInfo: (stationId: number) => 
      ipcRenderer.invoke('esi:getStationInfo', stationId)
  },

  // SDE and Fitting API
  sde: {
    initialize: () => ipcRenderer.invoke('sde:initialize'),
    getShips: () => ipcRenderer.invoke('sde:getShips'),
    getModules: () => ipcRenderer.invoke('sde:getModules'),
    getTypeAttributes: (typeID: number) => ipcRenderer.invoke('sde:getTypeAttributes', typeID),
    getSkillRequirements: (typeID: number) => ipcRenderer.invoke('sde:getSkillRequirements', typeID),
    import: () => ipcRenderer.invoke('sde:import'),
    clearDatabase: () => ipcRenderer.invoke('sde:clearDatabase'),
    checkVersion: () => ipcRenderer.invoke('sde:checkVersion'),
    getInstalledVersion: () => ipcRenderer.invoke('sde:getInstalledVersion'),
    download: () => ipcRenderer.invoke('sde:download'),
    parse: () => ipcRenderer.invoke('sde:parse'),
    // Statistics methods
    getShipCountsByRace: () => ipcRenderer.invoke('sde:getShipCountsByRace'),
    getModuleCountsByCategory: () => ipcRenderer.invoke('sde:getModuleCountsByCategory'),
    getStatistics: () => ipcRenderer.invoke('sde:getStatistics'),
    getImplantNames: (implantIds: number[]) => ipcRenderer.invoke('sde:getImplantNames', implantIds),
    getBlueprintNames: (typeIds: number[]) => ipcRenderer.invoke('sde:getBlueprintNames', typeIds),
    getBlueprintStatistics: () => ipcRenderer.invoke('sde:getBlueprintStatistics'),
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('sde:downloadProgress', (_, progress) => callback(progress));
    },
    removeDownloadProgressListener: () => {
      ipcRenderer.removeAllListeners('sde:downloadProgress');
    }
  },

  fitting: {
    calculate: (shipData: any, modulesData: any[]) => 
      ipcRenderer.invoke('fitting:calculate', shipData, modulesData),
    calculateAdvanced: (shipData: any, weaponsData: any[], targetProfile?: any) =>
      ipcRenderer.invoke('fitting:calculateAdvanced', shipData, weaponsData, targetProfile),
    validate: (shipData: any, modulesData: any[]) => 
      ipcRenderer.invoke('fitting:validate', shipData, modulesData),
    save: (fitting: any) => ipcRenderer.invoke('fitting:save', fitting),
    getFittings: () => ipcRenderer.invoke('fitting:getFittings')
  },

  // Character management API
  characters: {
    getAll: () => ipcRenderer.invoke('characters:getAll'),
    getActive: () => ipcRenderer.invoke('characters:getActive'),
    setActive: (characterId: number) => ipcRenderer.invoke('characters:setActive', characterId),
    remove: (characterId: number) => ipcRenderer.invoke('characters:remove', characterId),
    reorder: (characterIds: number[]) => ipcRenderer.invoke('characters:reorder', characterIds),
    updateTraining: (characterId?: number) => ipcRenderer.invoke('characters:updateTraining', characterId),
    getStats: () => ipcRenderer.invoke('characters:getStats'),
    getTraining: () => ipcRenderer.invoke('characters:getTraining')
  },

  // Cache management API
  cache: {
    getStats: () => ipcRenderer.invoke('cache:getStats'),
    clear: () => ipcRenderer.invoke('cache:clear'),
    invalidateCharacter: (characterId: number) => ipcRenderer.invoke('cache:invalidateCharacter', characterId)
  },

  // Settings API
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
    reset: () => ipcRenderer.invoke('settings:reset')
  },

  // Notifications API
  notifications: {
    test: () => ipcRenderer.invoke('notifications:test'),
    getStats: () => ipcRenderer.invoke('notifications:getStats')
  },

  // Skill Queue monitoring API
  skillQueue: {
    getStats: () => ipcRenderer.invoke('skillQueue:getStats'),
    checkNow: (characterId?: number) => ipcRenderer.invoke('skillQueue:checkNow', characterId),
    getUpcoming: (hoursAhead?: number) => ipcRenderer.invoke('skillQueue:getUpcoming', hoursAhead),
    startMonitoring: () => ipcRenderer.invoke('skillQueue:startMonitoring'),
    stopMonitoring: () => ipcRenderer.invoke('skillQueue:stopMonitoring'),
    clearCache: () => ipcRenderer.invoke('skillQueue:clearCache')
  },

  // System Tray API
  systemTray: {
    isSupported: () => ipcRenderer.invoke('systemTray:isSupported'),
    forceUpdate: () => ipcRenderer.invoke('systemTray:forceUpdate'),
    showBalloon: (title: string, content: string) => ipcRenderer.invoke('systemTray:showBalloon', title, content)
  },

  // Startup SDE Management API
  startup: {
    checkSDE: () => ipcRenderer.invoke('startup:checkSDE'),
    forceSDERefresh: () => ipcRenderer.invoke('startup:forceSDERefresh'),
    getSDEStatus: () => ipcRenderer.invoke('startup:getSDEStatus'),
    onSDEProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('startup:sdeProgress', (_, progress) => callback(progress));
    },
    onSDEComplete: (callback: (result: any) => void) => {
      ipcRenderer.on('startup:sdeComplete', (_, result) => callback(result));
    },
    removeSDEListeners: () => {
      ipcRenderer.removeAllListeners('startup:sdeProgress');
      ipcRenderer.removeAllListeners('startup:sdeComplete');
    }
  },

  // Platform info
  platform: process.platform
});

// Type definitions for the exposed API
export interface ElectronAPI {
  auth: {
    start: () => Promise<boolean>;
    check: () => Promise<boolean>;
    getCharacter: () => Promise<{
      character_id: number;
      character_name: string;
      expires_on: string;
      scopes: string;
      token_type: string;
    } | null>;
    logout: () => Promise<void>;
    onSuccess: (callback: () => void) => void;
    onLogout: (callback: () => void) => void;
    removeAllListeners: () => void;
  };
  esi: {
    getCharacterSkills: (characterId: string) => Promise<any>;
    getCharacterSkillQueue: (characterId: string) => Promise<any>;
    getSkillTypes: (skillIds: number[]) => Promise<Record<number, any>>;
    getCharacterLocation: (characterId?: string) => Promise<any>;
    getCharacterShip: (characterId?: string) => Promise<any>;
    getCharacterWallet: (characterId?: string) => Promise<number>;
    getCorporationInfo: (corporationId: number) => Promise<any>;
    getCharacterCorporationHistory: (characterId?: string) => Promise<any>;
    getCharacterClones: (characterId?: string) => Promise<any>;
    getCharacterImplants: (characterId?: string) => Promise<any>;
    getCharacterBlueprints: (characterId?: string) => Promise<any>;
    getEnhancedCharacterClones: (characterId?: string) => Promise<any>;
    getSystemInfo: (systemId: number) => Promise<any>;
    getStationInfo: (stationId: number) => Promise<any>;
  };
  sde: {
    initialize: () => Promise<boolean>;
    getShips: () => Promise<any[]>;
    getModules: () => Promise<any[]>;
    getTypeAttributes: (typeID: number) => Promise<any[]>;
    getSkillRequirements: (typeID: number) => Promise<any[]>;
    import: () => Promise<{ success: boolean; message?: string; error?: string }>;
    clearDatabase: () => Promise<{ success: boolean; message?: string; error?: string }>;
    checkVersion: () => Promise<any>;
    getInstalledVersion: () => Promise<any>;
    download: () => Promise<{ success: boolean; message?: string; error?: string }>;
    parse: () => Promise<{ ships: number; modules: number; attributes: number; version: string }>;
    getShipCountsByRace: () => Promise<Record<string, number>>;
    getModuleCountsByCategory: () => Promise<Record<string, number>>;
    getStatistics: () => Promise<{
      version: string;
      lastUpdated: string;
      totalShips: number;
      totalModules: number;
      totalItems: number;
      shipsByRace: Record<string, number>;
      modulesByCategory: Record<string, number>;
    }>;
    getImplantNames: (implantIds: number[]) => Promise<Record<number, string>>;
    getBlueprintNames: (typeIds: number[]) => Promise<Record<number, string>>;
    getBlueprintStatistics: () => Promise<{
      totalBlueprints: number;
      blueprintsByCategory: Record<string, number>;
    }>;
    onDownloadProgress: (callback: (progress: any) => void) => void;
    removeDownloadProgressListener: () => void;
  };
  fitting: {
    calculate: (shipData: any, modulesData: any[]) => Promise<any>;
    calculateAdvanced: (shipData: any, weaponsData: any[], targetProfile?: any) => Promise<any>;
    validate: (shipData: any, modulesData: any[]) => Promise<any>;
    save: (fitting: any) => Promise<number>;
    getFittings: () => Promise<any[]>;
  };
  characters: {
    getAll: () => Promise<any[]>;
    getActive: () => Promise<any>;
    setActive: (characterId: number) => Promise<boolean>;
    remove: (characterId: number) => Promise<boolean>;
    reorder: (characterIds: number[]) => Promise<boolean>;
    updateTraining: (characterId?: number) => Promise<boolean>;
    getStats: () => Promise<any>;
    getTraining: () => Promise<any[]>;
  };
  cache: {
    getStats: () => Promise<any>;
    clear: () => Promise<boolean>;
    invalidateCharacter: (characterId: number) => Promise<boolean>;
  };
  settings: {
    get: () => Promise<any>;
    update: (updates: any) => Promise<boolean>;
    reset: () => Promise<boolean>;
  };
  notifications: {
    test: () => Promise<boolean>;
    getStats: () => Promise<any>;
  };
  skillQueue: {
    getStats: () => Promise<any>;
    checkNow: (characterId?: number) => Promise<boolean>;
    getUpcoming: (hoursAhead?: number) => Promise<any[]>;
    startMonitoring: () => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    clearCache: () => Promise<boolean>;
  };
  systemTray: {
    isSupported: () => Promise<boolean>;
    forceUpdate: () => Promise<boolean>;
    showBalloon: (title: string, content: string) => Promise<boolean>;
  };
  startup: {
    checkSDE: () => Promise<{ success: boolean; error?: string }>;
    forceSDERefresh: () => Promise<{ success: boolean; error?: string }>;
    getSDEStatus: () => Promise<{
      hasData: boolean;
      version: string;
      shipCount: number;
      moduleCount: number;
      lastUpdated?: string;
    }>;
    onSDEProgress: (callback: (progress: any) => void) => void;
    onSDEComplete: (callback: (result: any) => void) => void;
    removeSDEListeners: () => void;
  };
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}