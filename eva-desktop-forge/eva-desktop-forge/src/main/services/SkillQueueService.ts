import { characterService } from './CharacterService';
import { notificationService } from './NotificationService';
import { settingsService } from './SettingsService';
import { esiService } from './EsiService';

export interface SkillCompletion {
  characterId: number;
  characterName: string;
  skillId: number;
  skillName: string;
  skillLevel: number;
  completionTime: Date;
}

export interface QueueWarning {
  characterId: number;
  characterName: string;
  timeRemaining: number; // milliseconds
  queueEndTime: Date;
  type: 'queue_gap' | 'queue_empty' | 'queue_ending';
}

export class SkillQueueService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: number = 0;
  private completedSkills = new Set<string>(); // Track completed skills to avoid duplicate notifications
  private queueWarnings = new Map<number, Date>(); // Track when warnings were last sent

  constructor() {
    this.startMonitoring();
    console.log('✅ Skill Queue Service initialized');
  }

  // Start background monitoring
  startMonitoring(): void {
    // Get monitoring interval from settings (default 5 minutes)
    const settings = settingsService.getSkillQueueSettings();
    const intervalMs = settings.refreshInterval * 60 * 1000;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllCharacterQueues();
    }, intervalMs);

    console.log(`🔄 Skill queue monitoring started (${settings.refreshInterval}min intervals)`);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Skill queue monitoring stopped');
    }
  }

  // Restart monitoring with new settings
  restartMonitoring(): void {
    this.stopMonitoring();
    this.startMonitoring();
  }

  // Check all character queues for completions and warnings
  async checkAllCharacterQueues(): Promise<void> {
    try {
      const characters = characterService.getAllCharacters();
      
      if (characters.length === 0) {
        return;
      }

      console.log(`🔍 Checking skill queues for ${characters.length} characters...`);

      const checkPromises = characters.map(character => 
        this.checkCharacterQueue(character)
      );

      await Promise.allSettled(checkPromises);
      
      this.lastCheckTime = Date.now();
      console.log('✅ Skill queue check completed');
    } catch (error) {
      console.error('❌ Failed to check skill queues:', error);
    }
  }

  // Check individual character queue
  private async checkCharacterQueue(character: any): Promise<void> {
    try {
      if (!character.auth_data) return;

      // Get current skill queue
      const skillQueue = await esiService.getCharacterSkillQueue(character.character_id);
      
      // Check for skill completions
      await this.checkSkillCompletions(character, skillQueue);
      
      // Check for queue warnings
      await this.checkQueueWarnings(character, skillQueue);
      
      // Update character training status
      await characterService.updateCharacterTrainingStatus(character);
      
    } catch (error) {
      console.warn(`⚠️ Failed to check queue for ${character.character_name}:`, error);
    }
  }

  // Check for skill completions since last check
  private async checkSkillCompletions(character: any, skillQueue: any[]): Promise<void> {
    const now = new Date();
    const lastCheck = new Date(this.lastCheckTime || 0);

    for (const queueItem of skillQueue) {
      if (!queueItem.finish_date) continue;

      const finishTime = new Date(queueItem.finish_date);
      
      // Check if skill completed between last check and now
      if (finishTime > lastCheck && finishTime <= now) {
        const completionKey = `${character.character_id}-${queueItem.skill_id}-${queueItem.finished_level}-${finishTime.getTime()}`;
        
        // Avoid duplicate notifications
        if (this.completedSkills.has(completionKey)) continue;
        
        this.completedSkills.add(completionKey);
        
        // Get skill name
        let skillName = `Skill ${queueItem.skill_id}`;
        try {
          const skillTypes = await esiService.getSkillTypes([queueItem.skill_id]);
          skillName = skillTypes[queueItem.skill_id]?.name || skillName;
        } catch (error) {
          console.warn('Failed to get skill name:', error);
        }

        // Send completion notification
        await notificationService.notifySkillComplete({
          characterId: character.character_id,
          characterName: character.character_name,
          skillName: skillName,
          skillLevel: queueItem.finished_level,
          completionTime: finishTime
        });

        console.log(`🎓 Skill completed: ${character.character_name} - ${skillName} ${queueItem.finished_level}`);
      }
    }
  }

  // Check for queue warnings (ending soon, gaps, empty)
  private async checkQueueWarnings(character: any, skillQueue: any[]): Promise<void> {
    const settings = settingsService.getSkillQueueSettings();
    const warningHours = settings.warningHours;
    const now = new Date();
    const warningThreshold = now.getTime() + (warningHours * 60 * 60 * 1000);

    // Check if queue is empty
    if (skillQueue.length === 0) {
      await this.sendQueueWarning(character, {
        type: 'queue_empty',
        timeRemaining: 0,
        queueEndTime: now
      });
      return;
    }

    // Find the last skill in queue
    const activeSkills = skillQueue.filter(item => item.finish_date);
    if (activeSkills.length === 0) {
      return; // No active training
    }

    // Sort by finish date
    activeSkills.sort((a, b) => 
      new Date(a.finish_date!).getTime() - new Date(b.finish_date!).getTime()
    );

    const lastSkill = activeSkills[activeSkills.length - 1];
    const queueEndTime = new Date(lastSkill.finish_date!);
    const timeRemaining = queueEndTime.getTime() - now.getTime();

    // Check if queue ends within warning period
    if (queueEndTime.getTime() <= warningThreshold) {
      await this.sendQueueWarning(character, {
        type: 'queue_ending',
        timeRemaining,
        queueEndTime
      });
    }

    // Check for gaps in queue (simplified - would need more complex logic for real gaps)
    if (skillQueue.length < 10) { // Arbitrary threshold for "low queue"
      await this.sendQueueWarning(character, {
        type: 'queue_gap',
        timeRemaining,
        queueEndTime
      });
    }
  }

  // Send queue warning notification
  private async sendQueueWarning(character: any, warning: Omit<QueueWarning, 'characterId' | 'characterName'>): Promise<void> {
    const lastWarning = this.queueWarnings.get(character.character_id);
    const now = new Date();
    
    // Don't spam warnings - only send once per day for same type
    if (lastWarning && (now.getTime() - lastWarning.getTime()) < 24 * 60 * 60 * 1000) {
      return;
    }

    const fullWarning: QueueWarning = {
      characterId: character.character_id,
      characterName: character.character_name,
      ...warning
    };

    switch (warning.type) {
      case 'queue_empty':
        await notificationService.notifyQueueEmpty(character.character_id, character.character_name);
        break;
      case 'queue_ending':
      case 'queue_gap':
        await notificationService.notifyQueueWarning(fullWarning);
        break;
    }

    this.queueWarnings.set(character.character_id, now);
    console.log(`⚠️ Queue warning sent: ${character.character_name} - ${warning.type}`);
  }

  // Manual check for specific character
  async checkCharacterNow(characterId: number): Promise<void> {
    const character = characterService.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    await this.checkCharacterQueue(character);
  }

  // Get queue statistics
  getQueueStats(): {
    totalCharacters: number;
    activeTraining: number;
    completionsSinceStart: number;
    warningsSinceStart: number;
    lastCheckTime: Date | null;
    nextCheckTime: Date | null;
  } {
    const characters = characterService.getAllCharacters();
    const activeTraining = characters.filter(char => char.training_active).length;
    
    const settings = settingsService.getSkillQueueSettings();
    const intervalMs = settings.refreshInterval * 60 * 1000;
    const nextCheckTime = this.lastCheckTime 
      ? new Date(this.lastCheckTime + intervalMs)
      : null;

    return {
      totalCharacters: characters.length,
      activeTraining,
      completionsSinceStart: this.completedSkills.size,
      warningsSinceStart: this.queueWarnings.size,
      lastCheckTime: this.lastCheckTime ? new Date(this.lastCheckTime) : null,
      nextCheckTime
    };
  }

  // Clear completed skills cache (for testing or reset)
  clearCompletedSkillsCache(): void {
    this.completedSkills.clear();
    this.queueWarnings.clear();
    console.log('🧹 Skill completion cache cleared');
  }

  // Get upcoming skill completions
  async getUpcomingCompletions(hoursAhead: number = 24): Promise<SkillCompletion[]> {
    const characters = characterService.getAllCharacters();
    const completions: SkillCompletion[] = [];
    const now = new Date();
    const endTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    for (const character of characters) {
      try {
        if (!character.auth_data) continue;

        const skillQueue = await esiService.getCharacterSkillQueue(character.character_id);
        
        for (const queueItem of skillQueue) {
          if (!queueItem.finish_date) continue;
          
          const finishTime = new Date(queueItem.finish_date);
          
          if (finishTime > now && finishTime <= endTime) {
            // Get skill name
            let skillName = `Skill ${queueItem.skill_id}`;
            try {
              const skillTypes = await esiService.getSkillTypes([queueItem.skill_id]);
              skillName = skillTypes[queueItem.skill_id]?.name || skillName;
            } catch (error) {
              // Use fallback name
            }

            completions.push({
              characterId: character.character_id,
              characterName: character.character_name,
              skillId: queueItem.skill_id,
              skillName,
              skillLevel: queueItem.finished_level,
              completionTime: finishTime
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to get upcoming completions for ${character.character_name}:`, error);
      }
    }

    // Sort by completion time
    completions.sort((a, b) => a.completionTime.getTime() - b.completionTime.getTime());
    
    return completions;
  }

  // Enable/disable monitoring based on settings
  updateMonitoringFromSettings(): void {
    const settings = settingsService.getSkillQueueSettings();
    
    if (settings.autoRefresh) {
      if (!this.monitoringInterval) {
        this.startMonitoring();
      } else {
        this.restartMonitoring();
      }
    } else {
      this.stopMonitoring();
    }
  }
}

// Singleton instance
export const skillQueueService = new SkillQueueService();