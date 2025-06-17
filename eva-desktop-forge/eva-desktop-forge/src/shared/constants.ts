// ESI OAuth2 Configuration (URL scheme based like EVE Online)
export const ESI_CONFIG = {
  CLIENT_ID: '3fe0363633d34abcb6bc0d50d9d2c9f8',
  CLIENT_SECRET: 'Sc5A6JfqljzPiYczdNDcJ5HETqeo01ORzgXHaELQ',
  CALLBACK_URL: 'http://localhost:5000/callback', // Use the configured callback URL
  REDIRECT_URL_LEGACY: 'eva://auth/callback', // URL scheme for future use
  SCOPES: [
    // Character Info & Skills
    'esi-skills.read_skills.v1',
    'esi-skills.read_skillqueue.v1',
    'esi-characters.read_blueprints.v1',
    'esi-characters.read_corporation_roles.v1',
    'esi-characters.read_titles.v1',
    
    // Location & Ship
    'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    'esi-location.read_online.v1',
    
    // Wallet & Assets
    'esi-wallet.read_character_wallet.v1',
    'esi-assets.read_assets.v1',
    'esi-assets.read_corporation_assets.v1',
    
    // Corporation
    'esi-corporations.read_corporation_membership.v1',
    'esi-corporations.track_members.v1',
    'esi-corporations.read_titles.v1',
    'esi-corporations.read_structures.v1',
    
    // Fittings
    'esi-fittings.read_fittings.v1',
    'esi-fittings.write_fittings.v1',
    
    // Clones & Implants
    'esi-clones.read_clones.v1',
    'esi-clones.read_implants.v1',
    
    // Contacts & Calendar
    'esi-characters.read_contacts.v1',
    'esi-calendar.read_calendar_events.v1',
    
    // Market & Contracts
    'esi-markets.read_character_orders.v1',
    'esi-contracts.read_character_contracts.v1',
    
    // Industry & Research
    'esi-industry.read_character_jobs.v1',
    
    // Killmails & Fleet
    'esi-killmails.read_killmails.v1',
    'esi-fleets.read_fleet.v1',
    
    // Universe Data
    'esi-universe.read_structures.v1',
    'esi-search.search_structures.v1'
  ],
  ESI_BASE_URL: 'https://esi.evetech.net',
  LOGIN_URL: 'https://login.eveonline.com/v2/oauth/authorize',
  TOKEN_URL: 'https://login.eveonline.com/v2/oauth/token',
  USER_AGENT: 'EVA-Desktop/1.0.0 (https://github.com/eva-team/eva-desktop) contact@eva-team.com'
}

// API Endpoints
export const ESI_ENDPOINTS = {
  // Character Basic Info
  CHARACTER_INFO: '/latest/characters/{character_id}/',
  CHARACTER_SKILLS: '/latest/characters/{character_id}/skills/',
  CHARACTER_SKILL_QUEUE: '/latest/characters/{character_id}/skillqueue/',
  CHARACTER_ATTRIBUTES: '/latest/characters/{character_id}/attributes/',
  
  // Character Location & Ship
  CHARACTER_LOCATION: '/latest/characters/{character_id}/location/',
  CHARACTER_SHIP: '/latest/characters/{character_id}/ship/',
  CHARACTER_ONLINE: '/latest/characters/{character_id}/online/',
  
  // Character Wallet & Assets
  CHARACTER_WALLET: '/latest/characters/{character_id}/wallet/',
  CHARACTER_ASSETS: '/latest/characters/{character_id}/assets/',
  
  // Character Corporation
  CHARACTER_CORPORATION_HISTORY: '/latest/characters/{character_id}/corporationhistory/',
  CHARACTER_TITLES: '/latest/characters/{character_id}/titles/',
  CHARACTER_ROLES: '/latest/characters/{character_id}/roles/',
  
  // Character Clones & Implants
  CHARACTER_CLONES: '/latest/characters/{character_id}/clones/',
  CHARACTER_IMPLANTS: '/latest/characters/{character_id}/implants/',
  
  // Character Fittings
  CHARACTER_FITTINGS: '/latest/characters/{character_id}/fittings/',
  
  // Character Blueprints
  CHARACTER_BLUEPRINTS: '/latest/characters/{character_id}/blueprints/',
  
  // Corporation Info
  CORPORATION_INFO: '/latest/corporations/{corporation_id}/',
  CORPORATION_MEMBERS: '/latest/corporations/{corporation_id}/members/',
  
  // Universe Data
  UNIVERSE_TYPES: '/latest/universe/types/{type_id}/',
  UNIVERSE_GROUPS: '/latest/universe/groups/{group_id}/',
  UNIVERSE_SYSTEMS: '/latest/universe/systems/{system_id}/',
  UNIVERSE_STATIONS: '/latest/universe/stations/{station_id}/',
  UNIVERSE_STRUCTURES: '/latest/universe/structures/{structure_id}/'
}

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'esi_access_token',
  REFRESH_TOKEN: 'esi_refresh_token',
  TOKEN_EXPIRY: 'esi_token_expiry',
  CHARACTER_DATA: 'character_data',
  APP_SETTINGS: 'app_settings'
}