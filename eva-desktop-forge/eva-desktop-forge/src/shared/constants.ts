// ESI OAuth2 Configuration (URL scheme based like EVE Online)
export const ESI_CONFIG = {
  CLIENT_ID: '3fe0363633d34abcb6bc0d50d9d2c9f8',
  CLIENT_SECRET: 'Sc5A6JfqljzPiYczdNDcJ5HETqeo01ORzgXHaELQ',
  CALLBACK_URL: 'http://localhost:5000/callback', // Use the configured callback URL
  REDIRECT_URL_LEGACY: 'eva://auth/callback', // URL scheme for future use
  SCOPES: [
    'esi-skills.read_skills.v1',
    'esi-skills.read_skillqueue.v1'
  ],
  ESI_BASE_URL: 'https://esi.evetech.net',
  LOGIN_URL: 'https://login.eveonline.com/v2/oauth/authorize',
  TOKEN_URL: 'https://login.eveonline.com/v2/oauth/token',
  USER_AGENT: 'EVA-Desktop/1.0.0 (https://github.com/eva-team/eva-desktop) contact@eva-team.com'
}

// API Endpoints
export const ESI_ENDPOINTS = {
  CHARACTER_INFO: '/latest/characters/{character_id}/',
  CHARACTER_SKILLS: '/latest/characters/{character_id}/skills/',
  CHARACTER_SKILL_QUEUE: '/latest/characters/{character_id}/skillqueue/',
  CHARACTER_ATTRIBUTES: '/latest/characters/{character_id}/attributes/',
  UNIVERSE_TYPES: '/latest/universe/types/{type_id}/',
  UNIVERSE_GROUPS: '/latest/universe/groups/{group_id}/'
}

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'esi_access_token',
  REFRESH_TOKEN: 'esi_refresh_token',
  TOKEN_EXPIRY: 'esi_token_expiry',
  CHARACTER_DATA: 'character_data',
  APP_SETTINGS: 'app_settings'
}