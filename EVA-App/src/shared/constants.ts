// SECURITY UPDATE: ESI credentials moved to secure configuration
// This file now imports from the secure config module
import { ESI_CONFIG as SECURE_ESI_CONFIG } from './config';

// Re-export the secure configuration with additional legacy fields
export const ESI_CONFIG = {
  ...SECURE_ESI_CONFIG,
  REDIRECT_URL_LEGACY: 'eva://auth/callback', // URL scheme for future use
  ESI_BASE_URL: SECURE_ESI_CONFIG.BASE_URL, // Backward compatibility
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