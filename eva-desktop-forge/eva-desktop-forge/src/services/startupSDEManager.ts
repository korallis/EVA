import { sdeDownloader, SDEDownloadProgress } from './sdeDownloader';
import { sdeService } from './sdeService';
import { BrowserWindow } from 'electron';

export interface StartupSDEProgress {
  stage: 'checking' | 'downloading' | 'parsing' | 'initializing' | 'complete' | 'error';
  progress: number;
  message: string;
  isRequired: boolean;
  canSkip: boolean;
  error?: string;
}

export class StartupSDEManager {
  private mainWindow: BrowserWindow | null = null;
  private progressCallback?: (progress: StartupSDEProgress) => void;

  constructor() {}

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  setProgressCallback(callback: (progress: StartupSDEProgress) => void) {
    this.progressCallback = callback;
  }

  private reportProgress(
    stage: StartupSDEProgress['stage'],
    progress: number,
    message: string,
    isRequired: boolean = true,
    canSkip: boolean = false,
    error?: string
  ) {
    const progressData: StartupSDEProgress = {
      stage,
      progress,
      message,
      isRequired,
      canSkip,
      error
    };

    if (this.progressCallback) {
      this.progressCallback(progressData);
    }

    // Also send to renderer if window is ready
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('startup:sdeProgress', progressData);
    }

    console.log(`🚀 Startup SDE: [${stage}] ${progress.toFixed(1)}% - ${message}`);
  }

  /**
   * Main startup SDE check and management
   */
  async checkAndUpdateSDE(): Promise<boolean> {
    try {
      this.reportProgress('checking', 0, 'Checking SDE version status...');

      // Check if we have any SDE data at all
      const installedVersion = await sdeDownloader.getInstalledVersion();
      
      if (!installedVersion) {
        console.log('🔍 No SDE data found - first run setup required');
        this.reportProgress('checking', 10, 'No SDE data found - downloading required...');
        return await this.performInitialSDESetup();
      }

      // Check if we only have demo data (even if version file exists)
      await sdeService.initialize();
      const ships = await sdeService.getShips();
      if (ships.length < 50) {
        console.log(`🔍 Only demo data found (${ships.length} ships) - comprehensive download required`);
        this.reportProgress('checking', 10, 'Demo data only - downloading comprehensive SDE...');
        return await this.performInitialSDESetup();
      }

      // Check for updates
      this.reportProgress('checking', 25, 'Checking for SDE updates...');
      const latestVersion = await sdeDownloader.checkLatestVersion();
      
      if (!latestVersion) {
        console.warn('⚠️ Cannot check for SDE updates - using existing data');
        this.reportProgress('checking', 100, 'Using existing SDE data (update check failed)', false, true);
        return await this.validateExistingSDE();
      }

      // Compare versions
      const needsUpdate = this.compareVersions(installedVersion, latestVersion);
      
      if (needsUpdate) {
        console.log(`🔄 SDE update available: ${installedVersion.version || 'Unknown'} → ${latestVersion.version || 'Latest'}`);
        this.reportProgress('checking', 50, `SDE update available: ${latestVersion.version || 'Latest'}`);
        return await this.performSDEUpdate(latestVersion);
      } else {
        console.log('✅ SDE is up to date:', installedVersion.version || installedVersion.etag);
        this.reportProgress('checking', 100, `SDE is up to date (${installedVersion.version || 'Latest'})`, false);
        return await this.validateExistingSDE();
      }

    } catch (error) {
      console.error('❌ Startup SDE check failed:', error);
      this.reportProgress('error', 0, `SDE check failed: ${error.message}`, false, true, error.message);
      
      // Try to use existing data if available
      const installedVersion = await sdeDownloader.getInstalledVersion();
      if (installedVersion) {
        console.log('⚠️ Using existing SDE data despite check failure');
        return await this.validateExistingSDE();
      }
      
      return false;
    }
  }

  /**
   * First-time SDE setup
   */
  private async performInitialSDESetup(): Promise<boolean> {
    try {
      this.reportProgress('downloading', 0, 'Downloading EVE Online Static Data Export...');
      
      // Set up download progress tracking
      const downloadSuccess = await sdeDownloader.downloadAndInstallSDE((progress: SDEDownloadProgress) => {
        let message = progress.message;
        if (progress.stage === 'downloading' && progress.downloadedSize && progress.totalSize) {
          const downloadedMB = (progress.downloadedSize / 1024 / 1024).toFixed(1);
          const totalMB = (progress.totalSize / 1024 / 1024).toFixed(1);
          message = `Downloading SDE: ${downloadedMB}MB / ${totalMB}MB`;
        }
        
        this.reportProgress('downloading', progress.progress, message);
      });

      if (!downloadSuccess) {
        throw new Error('SDE download failed');
      }

      // Parse the downloaded SDE
      this.reportProgress('parsing', 0, 'Parsing SDE data files...');
      const parseStats = await sdeDownloader.parseSDE();
      
      this.reportProgress('parsing', 50, `Found ${parseStats.ships} ships, ${parseStats.modules} modules`);

      // Initialize the database with SDE data
      this.reportProgress('initializing', 0, 'Initializing ship and module database...');
      await sdeService.initialize();
      
      this.reportProgress('complete', 100, `SDE setup complete! Ready with ${parseStats.ships} ships and ${parseStats.modules} modules.`, false);
      
      return true;

    } catch (error) {
      console.error('❌ Initial SDE setup failed:', error);
      this.reportProgress('error', 0, `SDE setup failed: ${error.message}`, true, false, error.message);
      return false;
    }
  }

  /**
   * Update existing SDE to newer version
   */
  private async performSDEUpdate(latestVersion: any): Promise<boolean> {
    try {
      this.reportProgress('downloading', 0, `Downloading SDE update (${latestVersion.version})...`);
      
      const downloadSuccess = await sdeDownloader.downloadAndInstallSDE((progress: SDEDownloadProgress) => {
        let message = `Updating to ${latestVersion.version}: ${progress.message}`;
        if (progress.stage === 'downloading' && progress.downloadedSize && progress.totalSize) {
          const downloadedMB = (progress.downloadedSize / 1024 / 1024).toFixed(1);
          const totalMB = (progress.totalSize / 1024 / 1024).toFixed(1);
          message = `Downloading update: ${downloadedMB}MB / ${totalMB}MB`;
        }
        
        this.reportProgress('downloading', progress.progress, message);
      });

      if (!downloadSuccess) {
        console.warn('⚠️ SDE update failed, continuing with existing data');
        this.reportProgress('checking', 100, 'Update failed - using existing SDE data', false, true);
        return await this.validateExistingSDE();
      }

      // Parse updated SDE
      this.reportProgress('parsing', 0, 'Processing updated SDE data...');
      const parseStats = await sdeDownloader.parseSDE();
      
      // Refresh database with new data
      this.reportProgress('initializing', 50, 'Updating database with new data...');
      await sdeService.clearDatabase();
      await sdeService.initialize();
      
      this.reportProgress('complete', 100, `SDE updated to ${latestVersion.version}! ${parseStats.ships} ships, ${parseStats.modules} modules.`, false);
      
      return true;

    } catch (error) {
      console.error('❌ SDE update failed:', error);
      this.reportProgress('error', 0, `SDE update failed: ${error.message}`, false, true, error.message);
      
      // Fall back to existing data
      return await this.validateExistingSDE();
    }
  }

  /**
   * Validate that existing SDE data is usable
   */
  private async validateExistingSDE(): Promise<boolean> {
    try {
      this.reportProgress('initializing', 0, 'Validating existing SDE data...');
      
      await sdeService.initialize();
      const [ships, modules] = await Promise.all([
        sdeService.getShips(),
        sdeService.getModules()
      ]);

      if (ships.length === 0 || modules.length === 0) {
        console.warn('⚠️ Existing SDE data appears incomplete');
        this.reportProgress('error', 0, 'Existing SDE data is incomplete - please download fresh data', true, false);
        return false;
      }

      // Check if we only have demo data (less than 50 ships means demo)
      if (ships.length < 50) {
        console.warn(`⚠️ Only demo SDE data found (${ships.length} ships) - need comprehensive import`);
        this.reportProgress('checking', 50, `Only demo data (${ships.length} ships) - downloading comprehensive SDE...`);
        return await this.performInitialSDESetup();
      }

      this.reportProgress('complete', 100, `SDE ready: ${ships.length} ships, ${modules.length} modules`, false);
      return true;

    } catch (error) {
      console.error('❌ SDE validation failed:', error);
      this.reportProgress('error', 0, `SDE validation failed: ${error.message}`, true, false, error.message);
      return false;
    }
  }

  /**
   * Compare SDE versions to determine if update is needed using ETag
   */
  private compareVersions(installed: any, latest: any): boolean {
    // Primary method: ETag comparison (most reliable)
    if (installed.etag && latest.etag) {
      const needsUpdate = installed.etag !== latest.etag;
      console.log(`🔍 ETag comparison: ${installed.etag} vs ${latest.etag} -> ${needsUpdate ? 'UPDATE NEEDED' : 'UP TO DATE'}`);
      return needsUpdate;
    }

    // Fallback: Last-Modified date comparison
    if (installed.lastModified && latest.lastModified) {
      const installedDate = new Date(installed.lastModified);
      const latestDate = new Date(latest.lastModified);
      const needsUpdate = latestDate > installedDate;
      console.log(`📅 Date comparison: ${installedDate.toISOString()} vs ${latestDate.toISOString()} -> ${needsUpdate ? 'UPDATE NEEDED' : 'UP TO DATE'}`);
      return needsUpdate;
    }

    // Legacy fallback for old checksum-based data
    if (installed.checksum && latest.etag) {
      console.warn('⚠️ Comparing legacy checksum to new ETag - assuming update needed');
      return true;
    }

    // If no reliable comparison method, assume update needed
    console.warn('⚠️ Cannot reliably compare SDE versions - assuming update needed');
    return true;
  }

  /**
   * Force a complete SDE refresh (for manual triggers)
   */
  async forceSDERefresh(): Promise<boolean> {
    console.log('🔄 Forcing complete SDE refresh...');
    
    try {
      const latestVersion = await sdeDownloader.checkLatestVersion();
      if (!latestVersion) {
        throw new Error('Cannot check latest SDE version');
      }

      return await this.performSDEUpdate(latestVersion);
    } catch (error) {
      console.error('❌ Force SDE refresh failed:', error);
      this.reportProgress('error', 0, `SDE refresh failed: ${error.message}`, false, true, error.message);
      return false;
    }
  }

  /**
   * Get current SDE status for UI display
   */
  async getSDEStatus(): Promise<{
    hasData: boolean;
    version: string;
    shipCount: number;
    moduleCount: number;
    lastUpdated?: string;
  }> {
    try {
      const installedVersion = await sdeDownloader.getInstalledVersion();
      
      if (!installedVersion) {
        return {
          hasData: false,
          version: 'None',
          shipCount: 0,
          moduleCount: 0
        };
      }

      // Try to get current data counts
      let shipCount = 0;
      let moduleCount = 0;
      
      try {
        const [ships, modules] = await Promise.all([
          sdeService.getShips(),
          sdeService.getModules()
        ]);
        shipCount = ships.length;
        moduleCount = modules.length;
      } catch (error) {
        console.warn('Could not get current data counts:', error);
      }

      return {
        hasData: true,
        version: installedVersion.version,
        shipCount,
        moduleCount,
        lastUpdated: installedVersion.lastModified
      };

    } catch (error) {
      console.error('❌ Failed to get SDE status:', error);
      return {
        hasData: false,
        version: 'Unknown',
        shipCount: 0,
        moduleCount: 0
      };
    }
  }
}

// Singleton instance
export const startupSDEManager = new StartupSDEManager();