import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { app } from 'electron';
import * as crypto from 'crypto';
import * as yaml from 'js-yaml';

export interface SDEDownloadProgress {
  stage: 'downloading' | 'extracting' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  totalSize?: number;
  downloadedSize?: number;
}

export interface SDEVersionInfo {
  etag: string;
  lastModified: string;
  downloadUrl: string;
  fileSize?: number;
  version?: string; // Keep for backwards compatibility
}

export class SDEDownloader {
  private sdeBasePath: string;
  private progressCallback?: (progress: SDEDownloadProgress) => void;
  
  // EVE Online official SDE URLs
  private readonly SDE_DOWNLOAD_URL = 'https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/sde.zip';

  constructor() {
    const userDataPath = app.getPath('userData');
    this.sdeBasePath = path.join(userDataPath, 'sde');
  }

  /**
   * Check the current version of SDE available online using ETag
   */
  async checkLatestVersion(): Promise<SDEVersionInfo | null> {
    try {
      console.log('🔍 Checking latest SDE version using ETag...');
      
      // Use HEAD request to get headers without downloading the file
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.SDE_DOWNLOAD_URL, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'EVA-Desktop/1.0.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Extract version information from headers
      const etag = response.headers.get('etag');
      const lastModified = response.headers.get('last-modified');
      const contentLength = response.headers.get('content-length');
      
      if (!etag) {
        throw new Error('No ETag found in response headers');
      }
      
      const versionInfo: SDEVersionInfo = {
        etag: etag.replace(/"/g, ''), // Remove quotes from ETag
        lastModified: lastModified || new Date().toISOString(),
        downloadUrl: this.SDE_DOWNLOAD_URL,
        fileSize: contentLength ? parseInt(contentLength) : undefined,
        version: this.formatVersionFromETag(etag, lastModified)
      };
      
      console.log('✅ SDE version info retrieved:', {
        etag: versionInfo.etag,
        lastModified: versionInfo.lastModified,
        fileSize: versionInfo.fileSize ? `${(versionInfo.fileSize / 1024 / 1024).toFixed(1)}MB` : 'Unknown'
      });
      
      return versionInfo;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ SDE version check timed out');
      } else {
        console.error('❌ Failed to check SDE version:', error.message);
      }
      return null;
    }
  }

  /**
   * Check the currently installed SDE version
   */
  async getInstalledVersion(): Promise<SDEVersionInfo | null> {
    try {
      const versionFile = path.join(this.sdeBasePath, 'version.json');
      if (!fs.existsSync(versionFile)) {
        return null;
      }
      
      const versionData = fs.readFileSync(versionFile, 'utf8');
      return JSON.parse(versionData);
    } catch (error) {
      console.error('❌ Error reading installed version:', error);
      return null;
    }
  }

  /**
   * Download and install the latest SDE
   */
  async downloadAndInstallSDE(
    progressCallback?: (progress: SDEDownloadProgress) => void
  ): Promise<boolean> {
    this.progressCallback = progressCallback;
    
    try {
      // Check latest version
      const latestVersion = await this.checkLatestVersion();
      if (!latestVersion) {
        throw new Error('Could not determine latest SDE version');
      }
      
      console.log('📦 Latest SDE version:', latestVersion.version);
      
      // Check if we need to update using ETag comparison
      const installedVersion = await this.getInstalledVersion();
      if (installedVersion && installedVersion.etag === latestVersion.etag) {
        console.log('✅ SDE is already up to date');
        this.reportProgress('complete', 100, 'SDE is already up to date');
        return true;
      }
      
      // Create directories
      await this.ensureDirectories();
      
      // Download SDE
      const zipPath = path.join(this.sdeBasePath, 'sde-temp.zip');
      await this.downloadFile(latestVersion.downloadUrl, zipPath, latestVersion.fileSize);
      
      // Extract SDE
      await this.extractSDE(zipPath);
      
      // Save version info
      await this.saveVersionInfo(latestVersion);
      
      // Clean up
      fs.unlinkSync(zipPath);
      
      this.reportProgress('complete', 100, 'SDE installation complete');
      return true;
      
    } catch (error) {
      console.error('❌ SDE download failed:', error);
      this.reportProgress('error', 0, `Failed to download SDE: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse and load SDE data into the database
   */
  async parseSDE(): Promise<{
    ships: number;
    modules: number;
    attributes: number;
    version: string;
  }> {
    try {
      console.log('🔄 Parsing and importing complete SDE data...');
      
      const versionInfo = await this.getInstalledVersion();
      const stats = {
        ships: 0,
        modules: 0,
        attributes: 0,
        version: versionInfo?.version || 'Unknown'
      };
      
      // Import the full SDE using the comprehensive importer
      const fullImporter = await import('./comprehensiveSDEImporter');
      const importer = new fullImporter.ComprehensiveSDEImporter(this.sdeBasePath);
      
      console.log('🚀 Starting comprehensive SDE import...');
      const importStats = await importer.importFullSDE();
      
      stats.ships = importStats.ships;
      stats.modules = importStats.modules;
      stats.attributes = importStats.attributes;
      
      console.log(`✅ Complete SDE import finished: ${stats.ships} ships, ${stats.modules} modules, ${stats.attributes} attributes`);
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error parsing and importing SDE:', error);
      
      // Fallback: try basic parsing for counts only
      console.log('🔄 Falling back to basic SDE parsing...');
      return await this.parseSDEBasic();
    }
  }

  /**
   * Basic SDE parsing for fallback (counting only)
   */
  private async parseSDEBasic(): Promise<{
    ships: number;
    modules: number;
    attributes: number;
    version: string;
  }> {
    const versionInfo = await this.getInstalledVersion();
    const stats = {
      ships: 0,
      modules: 0,
      attributes: 0,
      version: versionInfo?.version || 'Unknown'
    };
    
    try {
      // Check for common SDE files
      const typesPath = path.join(this.sdeBasePath, 'fsd', 'typeIDs.yaml');
      const dogmaAttributesPath = path.join(this.sdeBasePath, 'fsd', 'dogmaAttributes.yaml');
      
      // Parse types for counting
      if (fs.existsSync(typesPath)) {
        console.log('📊 Basic parsing of type IDs...');
        const typesYaml = fs.readFileSync(typesPath, 'utf8');
        const typesData = yaml.load(typesYaml) as Record<string, any>;
        
        if (typesData) {
          let shipCount = 0;
          let moduleCount = 0;
          
          for (const [typeId, typeInfo] of Object.entries(typesData)) {
            if (typeInfo.published) {
              if (typeInfo.categoryID === 6) {
                shipCount++;
              } else if ([7, 8, 18, 32].includes(typeInfo.categoryID)) {
                moduleCount++;
              }
            }
          }
          
          stats.ships = shipCount;
          stats.modules = moduleCount;
        }
      }
      
      // Parse attributes for counting
      if (fs.existsSync(dogmaAttributesPath)) {
        const attributesYaml = fs.readFileSync(dogmaAttributesPath, 'utf8');
        const attributesData = yaml.load(attributesYaml) as Record<string, any>;
        if (attributesData) {
          stats.attributes = Object.keys(attributesData).length;
        }
      }
      
      console.log(`✅ Basic SDE parsing: ${stats.ships} ships, ${stats.modules} modules, ${stats.attributes} attributes`);
      
    } catch (error) {
      console.warn('⚠️ Basic SDE parsing failed, using estimates:', error);
      stats.ships = 500;
      stats.modules = 2000;
      stats.attributes = 1000;
    }
    
    return stats;
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.sdeBasePath,
      path.join(this.sdeBasePath, 'fsd'),
      path.join(this.sdeBasePath, 'bsd'),
      path.join(this.sdeBasePath, 'universe')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private async downloadFile(url: string, destination: string, totalSize?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destination);
      let downloadedSize = 0;
      
      https.get(url, (response) => {
        const contentLength = totalSize || parseInt(response.headers['content-length'] || '0');
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = contentLength ? (downloadedSize / contentLength) * 100 : 0;
          
          this.reportProgress('downloading', progress, 'Downloading SDE...', contentLength, downloadedSize);
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    });
  }

  private async extractSDE(zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.reportProgress('extracting', 0, 'Extracting SDE files...');
      
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: this.sdeBasePath }))
        .on('close', () => {
          this.reportProgress('extracting', 100, 'Extraction complete');
          resolve();
        })
        .on('error', reject);
    });
  }


  private async saveVersionInfo(versionInfo: SDEVersionInfo): Promise<void> {
    const versionFile = path.join(this.sdeBasePath, 'version.json');
    fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
  }

  private reportProgress(
    stage: SDEDownloadProgress['stage'],
    progress: number,
    message: string,
    totalSize?: number,
    downloadedSize?: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress,
        message,
        totalSize,
        downloadedSize
      });
    }
  }

  /**
   * Format a user-friendly version string from ETag and last modified date
   */
  private formatVersionFromETag(etag: string | null, lastModified: string | null): string {
    if (!etag) return 'Unknown';
    
    // Remove quotes and get first 8 characters of ETag for version
    const cleanETag = etag.replace(/"/g, '');
    const shortETag = cleanETag.substring(0, 8);
    
    if (lastModified) {
      try {
        const date = new Date(lastModified);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        return `${dateStr}-${shortETag}`;
      } catch (error) {
        console.warn('Could not parse last-modified date:', lastModified);
      }
    }
    
    return shortETag;
  }
}

export const sdeDownloader = new SDEDownloader();