import { ESI_CONFIG, ESI_ENDPOINTS } from '../../shared/constants';
import { authService } from './AuthService';
import { cacheService } from './CacheService';

export interface SkillData {
  skill_id: number;
  skillpoints_in_skill: number;
  trained_skill_level: number;
  active_skill_level: number;
}

export interface SkillQueueItem {
  skill_id: number;
  finished_level: number;
  queue_position: number;
  start_date?: string;
  finish_date?: string;
  training_start_sp?: number;
  level_start_sp?: number;
  level_end_sp?: number;
}

export interface SkillTypeInfo {
  type_id: number;
  name: string;
  description: string;
  group_id: number;
  published: boolean;
  attributes?: {
    primary_attribute?: number;
    secondary_attribute?: number;
    skill_time_constant?: number;
  };
}

export interface CharacterLocation {
  solar_system_id: number;
  station_id?: number;
  structure_id?: number;
}

export interface CharacterShip {
  ship_type_id: number;
  ship_item_id: number;
  ship_name: string;
}

export interface CharacterWallet {
  balance: number;
}

export interface CorporationInfo {
  alliance_id?: number;
  ceo_id: number;
  creator_id: number;
  date_founded?: string;
  description?: string;
  faction_id?: number;
  home_station_id?: number;
  member_count: number;
  name: string;
  shares?: number;
  tax_rate: number;
  ticker: string;
  url?: string;
  war_eligible?: boolean;
}

export interface CharacterClones {
  home_location?: {
    location_id: number;
    location_type: string;
  };
  jump_clones: Array<{
    clone_id: number;
    implants: number[];
    location_id: number;
    location_type: string;
    name?: string;
  }>;
  last_clone_jump_date?: string;
  last_station_change_date?: string;
}

export interface CharacterImplants {
  implants: number[];
}

export class EsiService {
  private baseUrl = ESI_CONFIG.ESI_BASE_URL;
  private userAgent = ESI_CONFIG.USER_AGENT;

  // Make authenticated ESI request with retry logic
  private async makeEsiRequest(endpoint: string, characterId?: number, retryCount = 0): Promise<any> {
    const accessToken = await authService.getAccessToken();
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    // Replace character_id placeholder in endpoint
    let url = endpoint;
    if (characterId) {
      url = endpoint.replace('{character_id}', characterId.toString());
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${this.baseUrl}${url}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions for this operation.');
        }
        if (response.status === 404) {
          throw new Error('Character or resource not found.');
        }
        if (response.status === 420) {
          throw new Error('ESI rate limit exceeded. Please try again later.');
        }
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          // Server errors - retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`⚠️ ESI server error ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeEsiRequest(endpoint, characterId, retryCount + 1);
          }
          throw new Error(`ESI servers are experiencing issues (${response.status}). Please try again later.`);
        }
        
        const errorText = await response.text();
        throw new Error(`ESI request failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retryCount < 2) {
          console.log(`⚠️ ESI request timeout, retrying (attempt ${retryCount + 1}/3)`);
          return this.makeEsiRequest(endpoint, characterId, retryCount + 1);
        }
        throw new Error('ESI request timed out. The servers may be overloaded.');
      }
      throw error;
    }
  }

  // Make public ESI request (no authentication) with retry logic
  private async makePublicEsiRequest(endpoint: string, retryCount = 0): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`⚠️ ESI server error ${response.status}, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makePublicEsiRequest(endpoint, retryCount + 1);
          }
        }
        const errorText = await response.text();
        throw new Error(`ESI request failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retryCount < 2) {
          console.log(`⚠️ ESI request timeout, retrying (attempt ${retryCount + 1}/3)`);
          return this.makePublicEsiRequest(endpoint, retryCount + 1);
        }
        throw new Error('ESI request timed out. Please try again later.');
      }
      throw error;
    }
  }

  // Get character skills with graceful fallback
  async getCharacterSkills(characterId?: number): Promise<{
    skills: SkillData[];
    total_sp: number;
    unallocated_sp?: number;
  }> {
    try {
      // Use current character if no ID provided
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`🎯 Fetching skills for character ${characterId}...`);
      
      // Try to get from cache first
      const cachedSkills = await cacheService.get<{
        skills: SkillData[];
        total_sp: number;
        unallocated_sp?: number;
      }>(
        'character_skills',
        characterId.toString(),
        undefined,
        'CHARACTER_SKILLS'
      );

      if (cachedSkills) {
        console.log(`🎯 Using cached skills data for character ${characterId}`);
        return cachedSkills;
      }
      
      // Use cache wrapper with retry logic
      const skillsData = await cacheService.cached(
        'character_skills',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_SKILLS, characterId),
        undefined,
        'CHARACTER_SKILLS',
        [`character:${characterId}`, 'skills']
      );
      
      console.log(`✅ Skills fetched: ${skillsData.skills.length} skills, ${skillsData.total_sp.toLocaleString()} SP`);
      
      return skillsData;
    } catch (error: any) {
      console.error('❌ Failed to fetch character skills:', error);
      
      // Try to return stale cache data if available
      if (characterId) {
        const staleData = await cacheService.get<{
          skills: SkillData[];
          total_sp: number;
          unallocated_sp?: number;
        }>(
          'character_skills',
          characterId.toString(),
          true, // Allow stale
          'CHARACTER_SKILLS'
        );
        
        if (staleData) {
          console.log(`⚠️ Using stale skills data due to ESI error`);
          return staleData;
        }
      }
      
      // Return empty skills data as fallback
      console.log(`⚠️ Returning empty skills data due to ESI unavailability`);
      return {
        skills: [],
        total_sp: 0,
        unallocated_sp: 0
      };
    }
  }

  // Get character skill queue with graceful fallback
  async getCharacterSkillQueue(characterId?: number): Promise<SkillQueueItem[]> {
    try {
      // Use current character if no ID provided
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`📚 Fetching skill queue for character ${characterId}...`);
      
      // Use cache wrapper with retry logic - this prevents duplicate fetches
      const queueData = await cacheService.cached(
        'character_skill_queue',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_SKILL_QUEUE, characterId),
        undefined,
        'CHARACTER_SKILL_QUEUE',
        [`character:${characterId}`, 'skillqueue']
      );
      
      console.log(`✅ Skill queue fetched: ${queueData.length} items`);
      
      return queueData;
    } catch (error: any) {
      console.error('❌ Failed to fetch skill queue:', error);
      
      // Try to return stale cache data if available
      if (characterId) {
        const staleData = await cacheService.get<SkillQueueItem[]>(
          'character_skill_queue',
          characterId.toString(),
          true, // Allow stale
          'CHARACTER_SKILL_QUEUE'
        );
        
        if (staleData) {
          console.log(`⚠️ Using stale skill queue data due to ESI error`);
          return staleData;
        }
      }
      
      // Return empty queue as fallback
      console.log(`⚠️ Returning empty skill queue due to ESI unavailability`);
      return [];
    }
  }

  // Get skill type information (batch)
  async getSkillTypes(skillIds: number[]): Promise<Record<number, SkillTypeInfo>> {
    try {
      console.log(`📖 Fetching skill type info for ${skillIds.length} skills...`);
      
      const skillTypes: Record<number, SkillTypeInfo> = {};
      
      // Check cache for each skill type first
      const uncachedIds: number[] = [];
      for (const skillId of skillIds) {
        const cached = await cacheService.get<SkillTypeInfo>(
          'skill_type',
          skillId.toString(),
          undefined,
          'SKILL_TYPES'
        );
        
        if (cached) {
          skillTypes[skillId] = cached;
        } else {
          uncachedIds.push(skillId);
        }
      }
      
      console.log(`💾 Found ${skillIds.length - uncachedIds.length} cached skill types, fetching ${uncachedIds.length} new ones`);
      
      // Batch requests for uncached skills
      const batchSize = 10;
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (skillId) => {
          try {
            const endpoint = ESI_ENDPOINTS.UNIVERSE_TYPES.replace('{type_id}', skillId.toString());
            const typeData = await this.makePublicEsiRequest(endpoint);
            
            const skillTypeInfo: SkillTypeInfo = {
              type_id: typeData.type_id,
              name: typeData.name,
              description: typeData.description || '',
              group_id: typeData.group_id,
              published: typeData.published || false,
              attributes: {
                primary_attribute: typeData.dogma_attributes?.find((attr: any) => attr.attribute_id === 180)?.value,
                secondary_attribute: typeData.dogma_attributes?.find((attr: any) => attr.attribute_id === 181)?.value,
                skill_time_constant: typeData.dogma_attributes?.find((attr: any) => attr.attribute_id === 275)?.value
              }
            };
            
            // Cache the result
            await cacheService.set(
              'skill_type',
              skillId.toString(),
              skillTypeInfo,
              undefined,
              'SKILL_TYPES',
              ['skill_types', 'universe_types']
            );
            
            return { skillId, typeData: skillTypeInfo };
          } catch (error) {
            console.warn(`⚠️ Failed to fetch skill type ${skillId}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
          if (result) {
            skillTypes[result.skillId] = result.typeData;
          }
        });
        
        // Small delay between batches to be respectful to ESI
        if (i + batchSize < uncachedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`✅ Skill types fetched: ${Object.keys(skillTypes).length} types`);
      
      return skillTypes;
    } catch (error) {
      console.error('❌ Failed to fetch skill types:', error);
      throw error;
    }
  }

  // Get character information
  async getCharacterInfo(characterId: number): Promise<any> {
    try {
      console.log(`👤 Fetching character info for ${characterId}...`);
      
      // Use cache wrapper for character info
      const characterData = await cacheService.cached(
        'character_info',
        characterId.toString(),
        async () => {
          const endpoint = ESI_ENDPOINTS.CHARACTER_INFO.replace('{character_id}', characterId.toString());
          return this.makePublicEsiRequest(endpoint);
        },
        undefined,
        'CHARACTER_INFO',
        [`character:${characterId}`, 'character_info']
      );
      
      console.log(`✅ Character info fetched: ${characterData.name}`);
      
      return characterData;
    } catch (error) {
      console.error('❌ Failed to fetch character info:', error);
      throw error;
    }
  }

  // Get character attributes
  async getCharacterAttributes(characterId?: number): Promise<any> {
    try {
      // Use current character if no ID provided
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`🧠 Fetching attributes for character ${characterId}...`);
      
      // Use cache wrapper for character attributes
      const attributesData = await cacheService.cached(
        'character_attributes',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_ATTRIBUTES, characterId),
        undefined,
        'CHARACTER_ATTRIBUTES',
        [`character:${characterId}`, 'attributes']
      );
      
      console.log(`✅ Character attributes fetched`);
      
      return attributesData;
    } catch (error) {
      console.error('❌ Failed to fetch character attributes:', error);
      throw error;
    }
  }

  // Calculate training time for a skill level
  calculateTrainingTime(
    currentSP: number, 
    targetSP: number, 
    primaryAttribute: number, 
    secondaryAttribute: number, 
    skillTimeConstant: number = 250
  ): number {
    if (currentSP >= targetSP) {
      return 0;
    }
    
    const spToTrain = targetSP - currentSP;
    const attributeSum = primaryAttribute + (secondaryAttribute / 2);
    const trainingTimeMinutes = (spToTrain / attributeSum) * skillTimeConstant;
    
    return Math.ceil(trainingTimeMinutes * 60 * 1000); // Return milliseconds
  }

  // Get skill point requirements for a level
  getSkillPointsForLevel(rank: number, level: number): number {
    if (level <= 0) return 0;
    if (level > 5) return 0;
    
    const basePoints = 250;
    const multiplier = rank;
    
    let totalSP = 0;
    for (let i = 1; i <= level; i++) {
      totalSP += basePoints * multiplier * Math.pow(2, i - 1);
    }
    
    return totalSP;
  }

  // Batch update all character data
  async refreshCharacterData(characterId?: number): Promise<{
    skills: any;
    queue: SkillQueueItem[];
    attributes?: any;
  }> {
    try {
      console.log('🔄 Refreshing all character data...');
      
      // Fetch all data in parallel
      const [skills, queue, attributes] = await Promise.allSettled([
        this.getCharacterSkills(characterId),
        this.getCharacterSkillQueue(characterId),
        this.getCharacterAttributes(characterId).catch((): null => null) // Attributes are optional
      ]);

      const result: any = {};

      if (skills.status === 'fulfilled') {
        result.skills = skills.value;
      } else {
        console.error('Failed to fetch skills:', skills.reason);
        throw skills.reason;
      }

      if (queue.status === 'fulfilled') {
        result.queue = queue.value;
      } else {
        console.error('Failed to fetch skill queue:', queue.reason);
        throw queue.reason;
      }

      if (attributes.status === 'fulfilled' && attributes.value) {
        result.attributes = attributes.value;
      }

      console.log('✅ Character data refresh completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to refresh character data:', error);
      throw error;
    }
  }

  // Get character location
  async getCharacterLocation(characterId?: number): Promise<CharacterLocation> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`📍 Fetching location for character ${characterId}...`);
      
      const locationData = await cacheService.cached(
        'character_location',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_LOCATION, characterId),
        60000, // Cache for 1 minute (location changes frequently)
        'CHARACTER_LOCATION',
        [`character:${characterId}`, 'location']
      );
      
      console.log(`✅ Location fetched: system ${locationData.solar_system_id}`);
      return locationData;
    } catch (error) {
      console.error('❌ Failed to fetch character location:', error);
      throw error;
    }
  }

  // Get character current ship
  async getCharacterShip(characterId?: number): Promise<CharacterShip> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`🚀 Fetching ship for character ${characterId}...`);
      
      const shipData = await cacheService.cached(
        'character_ship',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_SHIP, characterId),
        300000, // Cache for 5 minutes
        'CHARACTER_SHIP',
        [`character:${characterId}`, 'ship']
      );
      
      console.log(`✅ Ship fetched: ${shipData.ship_name} (type ${shipData.ship_type_id})`);
      return shipData;
    } catch (error) {
      console.error('❌ Failed to fetch character ship:', error);
      throw error;
    }
  }

  // Get character wallet balance
  async getCharacterWallet(characterId?: number): Promise<number> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`💰 Fetching wallet for character ${characterId}...`);
      
      const walletBalance = await cacheService.cached(
        'character_wallet',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_WALLET, characterId),
        300000, // Cache for 5 minutes
        'CHARACTER_WALLET',
        [`character:${characterId}`, 'wallet']
      );
      
      console.log(`✅ Wallet balance: ${walletBalance.toLocaleString()} ISK`);
      return walletBalance;
    } catch (error) {
      console.error('❌ Failed to fetch character wallet:', error);
      throw error;
    }
  }

  // Get corporation information
  async getCorporationInfo(corporationId: number): Promise<CorporationInfo> {
    try {
      console.log(`🏢 Fetching corporation info for ${corporationId}...`);
      
      const corpData = await cacheService.cached(
        'corporation_info',
        corporationId.toString(),
        async () => {
          const endpoint = ESI_ENDPOINTS.CORPORATION_INFO.replace('{corporation_id}', corporationId.toString());
          return this.makePublicEsiRequest(endpoint);
        },
        3600000, // Cache for 1 hour
        'CORPORATION_INFO',
        [`corporation:${corporationId}`, 'corp_info']
      );
      
      console.log(`✅ Corporation info fetched: ${corpData.name} [${corpData.ticker}]`);
      return corpData;
    } catch (error) {
      console.error('❌ Failed to fetch corporation info:', error);
      throw error;
    }
  }

  // Get character corporation history
  async getCharacterCorporationHistory(characterId?: number): Promise<any[]> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`📜 Fetching corporation history for character ${characterId}...`);
      
      const corpHistory = await cacheService.cached(
        'character_corp_history',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_CORPORATION_HISTORY, characterId),
        3600000, // Cache for 1 hour
        'CHARACTER_CORPORATION_HISTORY',
        [`character:${characterId}`, 'corp_history']
      );
      
      console.log(`✅ Corporation history fetched: ${corpHistory.length} entries`);
      return corpHistory;
    } catch (error) {
      console.error('❌ Failed to fetch corporation history:', error);
      throw error;
    }
  }

  // Get character clones
  async getCharacterClones(characterId?: number): Promise<CharacterClones> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`🧬 Fetching clones for character ${characterId}...`);
      
      const clonesData = await cacheService.cached(
        'character_clones',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_CLONES, characterId),
        3600000, // Cache for 1 hour
        'CHARACTER_CLONES',
        [`character:${characterId}`, 'clones']
      );
      
      console.log(`✅ Clones fetched: ${clonesData.jump_clones?.length || 0} jump clones`);
      return clonesData;
    } catch (error) {
      console.error('❌ Failed to fetch character clones:', error);
      throw error;
    }
  }

  // Get character implants
  async getCharacterImplants(characterId?: number): Promise<number[]> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`🧠 Fetching implants for character ${characterId}...`);
      
      const implants = await cacheService.cached(
        'character_implants',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_IMPLANTS, characterId),
        3600000, // Cache for 1 hour
        'CHARACTER_IMPLANTS',
        [`character:${characterId}`, 'implants']
      );
      
      console.log(`✅ Implants fetched: ${implants.length} implants`);
      return implants;
    } catch (error) {
      console.error('❌ Failed to fetch character implants:', error);
      throw error;
    }
  }

  // Get universe system info
  async getSystemInfo(systemId: number): Promise<any> {
    try {
      console.log(`🌌 Fetching system info for ${systemId}...`);
      
      const systemData = await cacheService.cached(
        'universe_system',
        systemId.toString(),
        async () => {
          const endpoint = ESI_ENDPOINTS.UNIVERSE_SYSTEMS.replace('{system_id}', systemId.toString());
          return this.makePublicEsiRequest(endpoint);
        },
        86400000, // Cache for 24 hours
        'UNIVERSE_SYSTEMS',
        [`system:${systemId}`, 'universe_data']
      );
      
      console.log(`✅ System info fetched: ${systemData.name}`);
      return systemData;
    } catch (error) {
      console.error('❌ Failed to fetch system info:', error);
      throw error;
    }
  }

  // Get universe station info
  async getStationInfo(stationId: number): Promise<any> {
    try {
      console.log(`🏢 Fetching station info for ${stationId}...`);
      
      const stationData = await cacheService.cached(
        'universe_station',
        stationId.toString(),
        async () => {
          const endpoint = ESI_ENDPOINTS.UNIVERSE_STATIONS.replace('{station_id}', stationId.toString());
          return this.makePublicEsiRequest(endpoint);
        },
        86400000, // Cache for 24 hours
        'UNIVERSE_STATIONS',
        [`station:${stationId}`, 'universe_data']
      );
      
      console.log(`✅ Station info fetched: ${stationData.name}`);
      return stationData;
    } catch (error) {
      console.error('❌ Failed to fetch station info:', error);
      throw error;
    }
  }

  // Get implant slot from type ID (basic mapping)
  private getImplantSlot(typeId: number): number {
    // Basic implant slot mapping based on type ID ranges
    // This is a simplified version - in production you'd use SDE data
    if (typeId >= 9899 && typeId <= 9906) return typeId - 9898; // Basic implants slots 1-8
    if (typeId >= 10207 && typeId <= 10214) return typeId - 10206; // +3 implants slots 1-8
    if (typeId >= 10215 && typeId <= 10222) return typeId - 10214; // +4 implants slots 1-8
    if (typeId >= 10223 && typeId <= 10230) return typeId - 10222; // +5 implants slots 1-8
    return 0; // Unknown slot
  }

  // Get character blueprints
  async getCharacterBlueprints(characterId?: number): Promise<CharacterBlueprint[]> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`📜 Fetching blueprints for character ${characterId}...`);
      
      const blueprints = await cacheService.cached(
        'character_blueprints',
        characterId.toString(),
        () => this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_BLUEPRINTS, characterId),
        3600000, // Cache for 1 hour
        'DEFAULT',
        [`character:${characterId}`, 'blueprints']
      );
      
      // Process blueprints to add derived fields
      const processedBlueprints: CharacterBlueprint[] = blueprints.map((bp: any) => ({
        item_id: bp.item_id,
        type_id: bp.type_id,
        location_id: bp.location_id,
        location_flag: bp.location_flag || 'Hangar',
        quantity: bp.quantity,
        time_efficiency: bp.time_efficiency,
        material_efficiency: bp.material_efficiency,
        runs: bp.runs > 0 ? bp.runs : undefined,
        is_copy: bp.quantity > 0, // BPCs have positive quantity, BPOs have -1
        type_name: `Blueprint ${bp.type_id}` // Will be resolved from SDE
      }));
      
      console.log(`✅ Blueprints fetched: ${processedBlueprints.length} blueprints (${processedBlueprints.filter(bp => !bp.is_copy).length} BPOs, ${processedBlueprints.filter(bp => bp.is_copy).length} BPCs)`);
      return processedBlueprints;
    } catch (error) {
      console.error('❌ Failed to fetch character blueprints:', error);
      return [];
    }
  }

  // Get enhanced character clones with location resolution
  async getEnhancedCharacterClones(characterId?: number): Promise<EnhancedCharacterClones> {
    try {
      if (!characterId) {
        const authData = await authService.getCharacterData();
        if (!authData) {
          throw new Error('No authenticated character available');
        }
        characterId = authData.character_id;
      }

      console.log(`🧬 Fetching enhanced clones for character ${characterId}...`);
      
      const clonesData = await cacheService.cached(
        'character_clones_enhanced',
        characterId.toString(),
        async () => {
          const clones = await this.makeEsiRequest(ESI_ENDPOINTS.CHARACTER_CLONES, characterId);
          
          // Enhance with location names
          const enhanced: EnhancedCharacterClones = {
            ...clones,
            neural_remaps: {
              // Note: Neural remaps data is not available in current ESI
              // This would need to be fetched from character sheet or estimated
            },
            jump_clones: []
          };
          
          // Resolve home location name
          if (clones.home_location) {
            try {
              let locationName = 'Unknown Location';
              if (clones.home_location.location_type === 'station') {
                const stationInfo = await this.getStationInfo(clones.home_location.location_id);
                locationName = stationInfo.name;
              } else if (clones.home_location.location_type === 'structure') {
                // Structure names require special permissions
                locationName = `Structure ${clones.home_location.location_id}`;
              }
              enhanced.home_location = {
                ...clones.home_location,
                location_name: locationName
              };
            } catch (error) {
              console.warn('Failed to resolve home location name:', error);
              enhanced.home_location = clones.home_location;
            }
          }
          
          // Resolve jump clone locations and implant names
          if (clones.jump_clones && clones.jump_clones.length > 0) {
            enhanced.jump_clones = await Promise.all(
              clones.jump_clones.map(async (clone: any) => {
                let locationName = 'Unknown Location';
                try {
                  if (clone.location_type === 'station') {
                    const stationInfo = await this.getStationInfo(clone.location_id);
                    locationName = stationInfo.name;
                  } else if (clone.location_type === 'structure') {
                    locationName = `Structure ${clone.location_id}`;
                  }
                } catch (error) {
                  console.warn(`Failed to resolve location ${clone.location_id}:`, error);
                }
                
                return {
                  ...clone,
                  location_name: locationName,
                  implant_names: clone.implants.map((id: number) => `Implant ${id}`)
                };
              })
            );
          }
          
          return enhanced;
        },
        3600000, // Cache for 1 hour
        'DEFAULT',
        [`character:${characterId}`, 'clones_enhanced']
      );
      
      console.log(`✅ Enhanced clones fetched: ${clonesData.jump_clones?.length || 0} jump clones`);
      return clonesData;
    } catch (error) {
      console.error('❌ Failed to fetch enhanced character clones:', error);
      return {
        jump_clones: [],
        neural_remaps: {}
      };
    }
  }
}

// Singleton instance
export const esiService = new EsiService();