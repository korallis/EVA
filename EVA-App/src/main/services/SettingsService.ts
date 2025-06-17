import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface UserSettings {
  // UI Preferences
  theme: 'dark' | 'light' | 'auto';
  windowSize: {
    width: number;
    height: number;
  };
  windowPosition?: {
    x: number;
    y: number;
  };
  splitterPositions: {
    main: number;
    secondary: number;
  };
  
  // Character Management
  defaultCharacter?: number;
  recentCharacters: number[];
  maxRecentCharacters: number;
  
  // Notifications
  notifications: {
    enabled: boolean;
    skillCompletion: boolean;
    queueWarnings: boolean;
    soundEnabled: boolean;
    showInTray: boolean;
  };
  
  // Skill Queue Settings
  skillQueue: {
    warningHours: number; // Hours before queue end to warn
    autoRefresh: boolean;
    refreshInterval: number; // Minutes
  };
  
  // Data & Caching
  caching: {
    enabled: boolean;
    maxAge: number; // Hours
    preloadData: boolean;
  };
  
  // Advanced Settings
  advanced: {
    debugMode: boolean;
    apiCallLogging: boolean;
    offlineMode: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  windowSize: {
    width: 1400,
    height: 900
  },
  splitterPositions: {
    main: 300,
    secondary: 350
  },
  recentCharacters: [],
  maxRecentCharacters: 10,
  notifications: {
    enabled: true,
    skillCompletion: true,
    queueWarnings: true,
    soundEnabled: true,
    showInTray: true
  },
  skillQueue: {
    warningHours: 24,
    autoRefresh: true,
    refreshInterval: 5
  },
  caching: {
    enabled: true,
    maxAge: 24,
    preloadData: true
  },
  advanced: {
    debugMode: false,
    apiCallLogging: false,
    offlineMode: false
  }
};

export class SettingsService {
  private settings: UserSettings;
  private settingsPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = this.loadSettings();
  }

  // Load settings from disk
  private loadSettings(): UserSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loaded = JSON.parse(data);
        
        // Merge with defaults to ensure all properties exist
        const merged = this.mergeWithDefaults(loaded);
        
        console.log('✅ Settings loaded from disk');
        return merged;
      }
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
    
    console.log('📝 Using default settings');
    return { ...DEFAULT_SETTINGS };
  }

  // Merge loaded settings with defaults
  private mergeWithDefaults(loaded: Partial<UserSettings>): UserSettings {
    const merge = (target: any, source: any): any => {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = merge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    };
    
    return merge(DEFAULT_SETTINGS, loaded);
  }

  // Save settings to disk (debounced)
  private saveSettings(): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce saves to avoid excessive disk writes
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        console.log('✅ Settings saved to disk');
      } catch (error) {
        console.error('❌ Failed to save settings:', error);
      }
    }, 500);
  }

  // Get all settings
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  // Get specific setting
  getSetting<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return this.settings[key];
  }

  // Update settings
  updateSettings(updates: Partial<UserSettings>): void {
    this.settings = this.mergeWithDefaults(updates);
    this.saveSettings();
  }

  // Update specific setting
  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  // Character management helpers
  addRecentCharacter(characterId: number): void {
    const recent = this.settings.recentCharacters.filter(id => id !== characterId);
    recent.unshift(characterId);
    
    // Limit to max recent characters
    if (recent.length > this.settings.maxRecentCharacters) {
      recent.splice(this.settings.maxRecentCharacters);
    }
    
    this.updateSetting('recentCharacters', recent);
  }

  getRecentCharacters(): number[] {
    return [...this.settings.recentCharacters];
  }

  setDefaultCharacter(characterId: number): void {
    this.updateSetting('defaultCharacter', characterId);
    this.addRecentCharacter(characterId);
  }

  getDefaultCharacter(): number | undefined {
    return this.settings.defaultCharacter;
  }

  // Window state management
  updateWindowState(width: number, height: number, x?: number, y?: number): void {
    const updates: Partial<UserSettings> = {
      windowSize: { width, height }
    };
    
    if (x !== undefined && y !== undefined) {
      updates.windowPosition = { x, y };
    }
    
    this.updateSettings(updates);
  }

  getWindowState(): { 
    width: number; 
    height: number; 
    x?: number; 
    y?: number; 
  } {
    const { windowSize, windowPosition } = this.settings;
    return {
      width: windowSize.width,
      height: windowSize.height,
      x: windowPosition?.x,
      y: windowPosition?.y
    };
  }

  updateSplitterPositions(main: number, secondary: number): void {
    this.updateSetting('splitterPositions', { main, secondary });
  }

  getSplitterPositions(): { main: number; secondary: number } {
    return { ...this.settings.splitterPositions };
  }

  // Notification settings
  updateNotificationSettings(notifications: Partial<UserSettings['notifications']>): void {
    this.updateSetting('notifications', {
      ...this.settings.notifications,
      ...notifications
    });
  }

  getNotificationSettings(): UserSettings['notifications'] {
    return { ...this.settings.notifications };
  }

  // Skill queue settings
  updateSkillQueueSettings(skillQueue: Partial<UserSettings['skillQueue']>): void {
    this.updateSetting('skillQueue', {
      ...this.settings.skillQueue,
      ...skillQueue
    });
  }

  getSkillQueueSettings(): UserSettings['skillQueue'] {
    return { ...this.settings.skillQueue };
  }

  // Caching settings
  updateCachingSettings(caching: Partial<UserSettings['caching']>): void {
    this.updateSetting('caching', {
      ...this.settings.caching,
      ...caching
    });
  }

  getCachingSettings(): UserSettings['caching'] {
    return { ...this.settings.caching };
  }

  // Theme management
  setTheme(theme: 'dark' | 'light' | 'auto'): void {
    this.updateSetting('theme', theme);
  }

  getTheme(): 'dark' | 'light' | 'auto' {
    return this.settings.theme;
  }

  // Debug and development helpers
  isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || this.settings.advanced.debugMode;
  }

  enableDebugMode(enabled: boolean): void {
    this.updateSettings({
      advanced: {
        ...this.settings.advanced,
        debugMode: enabled
      }
    });
  }

  // Export/import settings
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      const merged = this.mergeWithDefaults(imported);
      this.settings = merged;
      this.saveSettings();
      console.log('✅ Settings imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      return false;
    }
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    console.log('🔄 Settings reset to defaults');
  }
}

// Singleton instance
export const settingsService = new SettingsService();