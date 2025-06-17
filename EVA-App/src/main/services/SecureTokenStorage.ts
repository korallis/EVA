import Store from 'electron-store';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { app } from 'electron';
import * as fs from 'fs';
import { AuthData } from './AuthService';

interface EncryptedTokenData {
  encryptedData: string;
  iv: string;
  timestamp: number;
}

/**
 * Secure token storage using electron-store with encryption
 * Replaces plaintext JSON file storage for better security
 */
export class SecureTokenStorage {
  private store: any;
  private encryptionKey: string;

  constructor() {
    // Initialize encrypted storage
    this.store = new Store({
      name: 'eva-secure-tokens',
      encryptionKey: this.getOrCreateEncryptionKey(),
      clearInvalidConfig: true
    });

    // Additional encryption layer for token data
    this.encryptionKey = this.getOrCreateMasterKey();
  }

  /**
   * Store authentication data securely with double encryption
   */
  async storeAuthData(authData: AuthData): Promise<void> {
    try {
      // Add timestamp for expiry checking
      const dataWithTimestamp = {
        ...authData,
        stored_at: Date.now()
      };

      // Encrypt the sensitive data with our additional layer
      const encryptedData = this.encryptData(JSON.stringify(dataWithTimestamp));
      
      // Store in electron-store (which adds another encryption layer)
      this.store.set('authData', encryptedData);
      
      console.log('✅ Auth data stored securely');
    } catch (error) {
      console.error('❌ Failed to store auth data securely:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Retrieve and decrypt authentication data
   */
  async loadAuthData(): Promise<AuthData | null> {
    try {
      const encryptedData = this.store.get('authData') as EncryptedTokenData;
      
      if (!encryptedData) {
        return null;
      }

      // Decrypt the data
      const decryptedString = this.decryptData(encryptedData);
      const authData = JSON.parse(decryptedString) as AuthData & { stored_at: number };

      // Check if token is expired
      const expiresOn = new Date(authData.expires_on);
      if (expiresOn <= new Date()) {
        console.log('🔄 Token expired, removing stored data');
        await this.clearAuthData();
        return null;
      }

      // Return auth data without internal timestamp
      const { stored_at, ...cleanAuthData } = authData;
      console.log('✅ Auth data loaded securely');
      return cleanAuthData;
      
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
      
      // Clear corrupted data
      await this.clearAuthData();
      return null;
    }
  }

  /**
   * Clear stored authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      this.store.delete('authData');
      console.log('✅ Auth data cleared securely');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  /**
   * Check if auth data exists without loading it
   */
  hasAuthData(): boolean {
    return this.store.has('authData');
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): { hasData: boolean; storePath: string; encrypted: boolean } {
    return {
      hasData: this.hasAuthData(),
      storePath: this.store.path,
      encrypted: true
    };
  }

  /**
   * Encrypt data with additional security layer
   */
  private encryptData(data: string): EncryptedTokenData {
    const iv = randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex').subarray(0, 32); // Ensure 32 bytes for AES-256
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt data with additional security layer
   */
  private decryptData(encryptedData: EncryptedTokenData): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const key = Buffer.from(this.encryptionKey, 'hex').subarray(0, 32); // Ensure 32 bytes for AES-256
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get or create encryption key for additional security layer
   */
  private getOrCreateMasterKey(): string {
    const keyStore = new Store({ name: 'eva-crypto-keys' }) as any;
    
    let masterKey = keyStore.get('masterKey') as string;
    
    if (!masterKey) {
      // Generate a new master key
      masterKey = randomBytes(32).toString('hex');
      keyStore.set('masterKey', masterKey);
      console.log('🔐 Generated new master encryption key');
    }
    
    return masterKey;
  }

  /**
   * Get or create encryption key for electron-store
   */
  private getOrCreateEncryptionKey(): string {
    // Use app version and machine-specific data for key derivation
    const appInfo = `${app.getName()}-${app.getVersion()}`;
    return randomBytes(32).toString('hex') + appInfo;
  }

  /**
   * Migrate from old plaintext storage (for backward compatibility)
   */
  async migrateFromPlaintextStorage(oldAuthFilePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(oldAuthFilePath)) {
        return false; // No old data to migrate
      }

      console.log('🔄 Migrating from plaintext auth storage...');
      
      // Read old plaintext data
      const oldDataString = await fs.promises.readFile(oldAuthFilePath, 'utf8');
      const oldAuthData = JSON.parse(oldDataString) as AuthData;
      
      // Store securely
      await this.storeAuthData(oldAuthData);
      
      // Remove old plaintext file
      await fs.promises.unlink(oldAuthFilePath);
      
      console.log('✅ Successfully migrated auth data to secure storage');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to migrate auth data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const secureTokenStorage = new SecureTokenStorage();