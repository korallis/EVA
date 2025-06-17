import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { authService, AuthData } from './AuthService';
import { esiService } from './EsiService';
import { settingsService } from './SettingsService';

export interface CharacterData {
  character_id: number;
  character_name: string;
  corporation_id?: number;
  corporation_name?: string;
  alliance_id?: number;
  alliance_name?: string;
  security_status?: number;
  birthday?: string;
  gender?: string;
  race_id?: number;
  bloodline_id?: number;
  
  // Training information
  training_active?: boolean;
  training_skill_id?: number;
  training_skill_name?: string;
  training_end_time?: string;
  queue_length?: number;
  
  // Authentication
  auth_data?: AuthData;
  last_updated?: string;
  
  // UI state
  tab_order?: number;
  is_pinned?: boolean;
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

export class CharacterService {
  private characters = new Map<number, CharacterData>();
  private charactersFilePath: string;
  private activeCharacterId: number | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.charactersFilePath = path.join(userDataPath, 'characters.json');
    
    this.loadCharacters();
    
    console.log('✅ Character service initialized');
  }

  // Load characters from disk
  private loadCharacters(): void {
    try {
      if (fs.existsSync(this.charactersFilePath)) {
        const data = fs.readFileSync(this.charactersFilePath, 'utf8');
        const charactersArray = JSON.parse(data) as CharacterData[];
        
        charactersArray.forEach(character => {
          this.characters.set(character.character_id, character);
        });
        
        // Set active character from settings
        const defaultCharacterId = settingsService.getDefaultCharacter();
        if (defaultCharacterId && this.characters.has(defaultCharacterId)) {
          this.activeCharacterId = defaultCharacterId;
        } else if (this.characters.size > 0) {
          // Set first character as active if no default
          this.activeCharacterId = Array.from(this.characters.keys())[0];
        }
        
        console.log(`📂 Loaded ${this.characters.size} characters from disk`);
      }
    } catch (error) {
      console.error('❌ Failed to load characters:', error);
    }
  }

  // Save characters to disk
  private saveCharacters(): void {
    try {
      const charactersArray = Array.from(this.characters.values())
        .sort((a, b) => (a.tab_order || 0) - (b.tab_order || 0));
      
      fs.writeFileSync(this.charactersFilePath, JSON.stringify(charactersArray, null, 2));
      console.log(`💾 Saved ${this.characters.size} characters to disk`);
    } catch (error) {
      console.error('❌ Failed to save characters:', error);
    }
  }

  // Add a new character
  async addCharacter(authData: AuthData): Promise<CharacterData> {
    try {
      console.log(`👤 Adding new character: ${authData.character_name}`);
      
      // Fetch character info from ESI
      const characterInfo = await esiService.getCharacterInfo(authData.character_id);
      
      const character: CharacterData = {
        character_id: authData.character_id,
        character_name: authData.character_name,
        corporation_id: characterInfo.corporation_id,
        security_status: characterInfo.security_status,
        birthday: characterInfo.birthday,
        gender: characterInfo.gender,
        race_id: characterInfo.race_id,
        bloodline_id: characterInfo.bloodline_id,
        auth_data: authData,
        last_updated: new Date().toISOString(),
        tab_order: this.characters.size,
        is_pinned: false
      };

      // Fetch corporation info if available
      if (characterInfo.corporation_id) {
        try {
          // This would be implemented with ESI corporation endpoint
          character.corporation_name = 'Corporation Name'; // Placeholder
        } catch (error) {
          console.warn('Failed to fetch corporation info:', error);
        }
      }

      // Update training status
      await this.updateCharacterTrainingStatus(character);

      this.characters.set(character.character_id, character);
      this.saveCharacters();
      
      // Set as active character if first or no active character
      if (!this.activeCharacterId || this.characters.size === 1) {
        this.setActiveCharacter(character.character_id);
      }

      console.log(`✅ Character ${authData.character_name} added successfully`);
      return character;
    } catch (error) {
      console.error('❌ Failed to add character:', error);
      throw error;
    }
  }

  // Remove a character
  removeCharacter(characterId: number): boolean {
    try {
      const character = this.characters.get(characterId);
      if (!character) return false;

      console.log(`🗑️ Removing character: ${character.character_name}`);
      
      this.characters.delete(characterId);
      
      // Update tab orders
      this.reorderTabs();
      
      // Switch active character if this was active
      if (this.activeCharacterId === characterId) {
        const remainingCharacters = Array.from(this.characters.keys());
        this.activeCharacterId = remainingCharacters.length > 0 ? remainingCharacters[0] : null;
        
        if (this.activeCharacterId) {
          settingsService.setDefaultCharacter(this.activeCharacterId);
        }
      }

      this.saveCharacters();
      console.log(`✅ Character removed successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove character:', error);
      return false;
    }
  }

  // Set active character
  setActiveCharacter(characterId: number): boolean {
    if (!this.characters.has(characterId)) return false;
    
    this.activeCharacterId = characterId;
    settingsService.setDefaultCharacter(characterId);
    settingsService.addRecentCharacter(characterId);
    
    console.log(`🎯 Active character set to: ${this.characters.get(characterId)?.character_name}`);
    return true;
  }

  // Get active character
  getActiveCharacter(): CharacterData | null {
    return this.activeCharacterId ? this.characters.get(this.activeCharacterId) || null : null;
  }

  // Get all characters
  getAllCharacters(): CharacterData[] {
    return Array.from(this.characters.values())
      .sort((a, b) => (a.tab_order || 0) - (b.tab_order || 0));
  }

  // Get character by ID
  getCharacter(characterId: number): CharacterData | null {
    return this.characters.get(characterId) || null;
  }

  // Update character training status
  async updateCharacterTrainingStatus(character: CharacterData): Promise<void> {
    try {
      if (!character.auth_data) return;

      // Temporarily set auth context for this character
      const currentAuth = await authService.getCharacterData();
      
      // This is a simplified version - would need proper multi-character auth handling
      const skillQueue = await esiService.getCharacterSkillQueue(character.character_id);
      
      if (skillQueue.length > 0) {
        const activeTraining = skillQueue.find(item => item.start_date && item.finish_date);
        
        if (activeTraining) {
          character.training_active = true;
          character.training_skill_id = activeTraining.skill_id;
          character.training_end_time = activeTraining.finish_date;
          character.queue_length = skillQueue.length;
          
          // Fetch skill name
          try {
            const skillTypes = await esiService.getSkillTypes([activeTraining.skill_id]);
            character.training_skill_name = skillTypes[activeTraining.skill_id]?.name || 'Unknown Skill';
          } catch (error) {
            character.training_skill_name = `Skill ${activeTraining.skill_id}`;
          }
        } else {
          character.training_active = false;
          character.queue_length = skillQueue.length;
        }
      } else {
        character.training_active = false;
        character.queue_length = 0;
      }

      character.last_updated = new Date().toISOString();
      this.saveCharacters();
    } catch (error) {
      console.error(`❌ Failed to update training status for ${character.character_name}:`, error);
    }
  }

  // Update all characters' training status
  async updateAllCharacterTrainingStatus(): Promise<void> {
    console.log('🔄 Updating training status for all characters...');
    
    const characters = Array.from(this.characters.values());
    const updatePromises = characters.map(character => 
      this.updateCharacterTrainingStatus(character)
    );

    try {
      await Promise.allSettled(updatePromises);
      console.log('✅ Training status update completed for all characters');
    } catch (error) {
      console.error('❌ Failed to update some character training statuses:', error);
    }
  }

  // Reorder character tabs
  reorderCharacters(characterIds: number[]): void {
    characterIds.forEach((characterId, index) => {
      const character = this.characters.get(characterId);
      if (character) {
        character.tab_order = index;
      }
    });
    
    this.saveCharacters();
  }

  // Reorder tabs after character removal
  private reorderTabs(): void {
    const characters = Array.from(this.characters.values())
      .sort((a, b) => (a.tab_order || 0) - (b.tab_order || 0));
    
    characters.forEach((character, index) => {
      character.tab_order = index;
    });
  }

  // This method is now handled by SkillQueueService
  // Keeping for backwards compatibility

  // Check for skill completions and send notifications
  async checkSkillCompletions(): Promise<void> {
    const now = new Date();
    
    for (const character of this.characters.values()) {
      if (character.training_active && character.training_end_time) {
        const endTime = new Date(character.training_end_time);
        
        // Check if skill completed since last check
        if (endTime <= now && character.last_updated) {
          const lastUpdate = new Date(character.last_updated);
          if (endTime > lastUpdate) {
            // Skill completed! Send notification
            console.log(`🎓 Skill training completed for ${character.character_name}: ${character.training_skill_name}`);
            
            // Update training status
            await this.updateCharacterTrainingStatus(character);
          }
        }
      }
    }
  }

  // Get characters with active training
  getTrainingCharacters(): CharacterData[] {
    return Array.from(this.characters.values())
      .filter(char => char.training_active)
      .sort((a, b) => {
        if (!a.training_end_time || !b.training_end_time) return 0;
        return new Date(a.training_end_time).getTime() - new Date(b.training_end_time).getTime();
      });
  }

  // Get character statistics
  getCharacterStats(): {
    total: number;
    active: number;
    training: number;
    lastUpdated: string | null;
  } {
    const characters = Array.from(this.characters.values());
    
    return {
      total: characters.length,
      active: this.activeCharacterId ? 1 : 0,
      training: characters.filter(char => char.training_active).length,
      lastUpdated: characters.length > 0 
        ? Math.max(...characters.map(char => new Date(char.last_updated || 0).getTime()))
          .toString()
        : null
    };
  }
}

// Singleton instance
export const characterService = new CharacterService();