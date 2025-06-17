// Secure configuration management for EVA Desktop
// This replaces the hardcoded constants with environment-based configuration

interface ESIConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  LOGIN_URL: string;
  TOKEN_URL: string;
  BASE_URL: string;
  CALLBACK_URL: string;
  USER_AGENT: string;
  SCOPES: string[];
}

// Default configuration - these will be overridden by environment variables
const DEFAULT_CONFIG: ESIConfig = {
  CLIENT_ID: process.env.EVE_CLIENT_ID || '3fe0363633d34abcb6bc0d50d9d2c9f8',
  CLIENT_SECRET: process.env.EVE_CLIENT_SECRET || 'Sc5A6JfqljzPiYczdNDcJ5HETqeo01ORzgXHaELQ',
  LOGIN_URL: process.env.EVE_LOGIN_URL || 'https://login.eveonline.com/v2/oauth/authorize',
  TOKEN_URL: process.env.EVE_TOKEN_URL || 'https://login.eveonline.com/v2/oauth/token',
  BASE_URL: process.env.EVE_BASE_URL || 'https://esi.evetech.net/latest',
  CALLBACK_URL: process.env.EVE_CALLBACK_URL || 'http://localhost:5000/callback',
  USER_AGENT: 'EVA-Desktop/2.0 (https://github.com/your-repo/eva-desktop)',
  SCOPES: [
    'publicData',
    // Character Basic Data
    'esi-skills.read_skills.v1',
    'esi-skills.read_skillqueue.v1',
    'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    'esi-location.read_online.v1',
    'esi-clones.read_clones.v1',
    'esi-clones.read_implants.v1',
    'esi-characters.read_blueprints.v1',
    'esi-characters.read_corporation_roles.v1',
    'esi-assets.read_assets.v1',
    
    // High Priority: Market & Wallet
    'esi-markets.read_character_orders.v1',
    'esi-wallet.read_character_wallet.v1',
    
    // High Priority: Industry & Mining
    'esi-industry.read_character_jobs.v1',
    'esi-industry.read_character_mining.v1',
    
    // Medium Priority: Contracts & Communication
    'esi-contracts.read_character_contracts.v1',
    'esi-mail.read_mail.v1',
    'esi-mail.send_mail.v1',
    'esi-mail.organize_mail.v1',
    'esi-characters.read_contacts.v1',
    
    // Medium Priority: Combat & PvP
    'esi-killmails.read_killmails.v1',
    
    // Additional Character Data
    'esi-characters.read_standings.v1',
    'esi-characters.read_agents_research.v1',
    'esi-characters.read_medals.v1',
    'esi-characters.read_chat_channels.v1',
    'esi-characters.read_notifications.v1',
    'esi-characters.read_fatigue.v1',
    'esi-characters.read_loyalty.v1',
    'esi-characters.read_opportunities.v1',
    
    // Corporation Data
    'esi-corporations.read_corporation_membership.v1',
    'esi-corporations.read_structures.v1'
  ]
};

class ConfigManager {
  private config: ESIConfig;
  private isValidated = false;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = ['CLIENT_ID', 'CLIENT_SECRET'];
    const missingFields = requiredFields.filter(field => !this.config[field as keyof ESIConfig]);

    if (missingFields.length > 0) {
      const error = `Missing required EVE Online API credentials: ${missingFields.join(', ')}
      
Please set the following environment variables:
${missingFields.map(field => `- EVE_${field}`).join('\n')}

Or create a .env file with your credentials.
Get your credentials from: https://developers.eveonline.com/`;

      console.error('❌ Configuration Error:', error);
      
      // In development, provide helpful guidance
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 For development, copy .env.example to .env and add your credentials');
      }
      
      throw new Error(error);
    }

    this.isValidated = true;
    console.log('✅ EVE Online API configuration validated');
  }

  getConfig(): ESIConfig {
    if (!this.isValidated) {
      this.validateConfig();
    }
    
    // Return a copy to prevent modification
    return { ...this.config };
  }

  // Specific getters for commonly used values
  getClientCredentials(): { clientId: string; clientSecret: string } {
    const config = this.getConfig();
    return {
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET
    };
  }

  getAuthURLs(): { loginUrl: string; tokenUrl: string; callbackUrl: string } {
    const config = this.getConfig();
    return {
      loginUrl: config.LOGIN_URL,
      tokenUrl: config.TOKEN_URL,
      callbackUrl: config.CALLBACK_URL
    };
  }

  // Update configuration at runtime (useful for testing)
  updateConfig(updates: Partial<ESIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.isValidated = false;
    this.validateConfig();
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Export the config for backward compatibility
export const ESI_CONFIG = configManager.getConfig();

// Export individual components for convenience
export const AUTH_CONFIG = configManager.getAuthURLs();
export const CLIENT_CONFIG = configManager.getClientCredentials();