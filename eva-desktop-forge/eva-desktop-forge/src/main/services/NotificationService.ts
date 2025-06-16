import { Notification, shell } from 'electron';
import { settingsService } from './SettingsService';
import { SkillQueueItem } from './EsiService';
import * as path from 'path';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  actions?: Array<{
    type: string;
    text: string;
  }>;
  clickAction?: () => void;
}

export interface SkillNotification {
  characterId: number;
  characterName: string;
  skillName: string;
  skillLevel: number;
  completionTime: Date;
}

export interface QueueWarning {
  characterId: number;
  characterName: string;
  timeRemaining: number; // milliseconds
  queueEndTime: Date;
}

export class NotificationService {
  private activeNotifications = new Map<string, Notification>();
  private notificationQueue: NotificationOptions[] = [];
  private isProcessingQueue = false;

  constructor() {
    // Check notification permissions on startup
    this.checkPermissions();
  }

  // Check if notifications are supported and permitted
  private async checkPermissions(): Promise<boolean> {
    try {
      // Electron handles notification permissions automatically
      const isSupported = Notification.isSupported();
      
      if (!isSupported) {
        console.warn('⚠️ Desktop notifications are not supported on this platform');
        return false;
      }
      
      console.log('✅ Desktop notifications are supported');
      return true;
    } catch (error) {
      console.error('❌ Failed to check notification permissions:', error);
      return false;
    }
  }

  // Show a notification
  async showNotification(options: NotificationOptions): Promise<void> {
    const settings = settingsService.getNotificationSettings();
    
    // Check if notifications are enabled
    if (!settings.enabled) {
      console.log('🔕 Notifications disabled, skipping notification');
      return;
    }
    
    // Check if platform supports notifications
    if (!Notification.isSupported()) {
      console.warn('⚠️ Notifications not supported on this platform');
      return;
    }
    
    try {
      // Create notification
      const notification = new Notification({
        title: options.title,
        body: options.body,
        icon: options.icon || this.getDefaultIcon(),
        silent: options.silent || !settings.soundEnabled
      });
      
      // Handle click events
      if (options.clickAction) {
        notification.on('click', options.clickAction);
      }
      
      // Store notification for management
      const notificationId = `${Date.now()}-${Math.random()}`;
      this.activeNotifications.set(notificationId, notification);
      
      // Clean up when notification is closed
      notification.on('close', () => {
        this.activeNotifications.delete(notificationId);
      });
      
      // Show the notification
      notification.show();
      
      console.log('📢 Notification shown:', options.title);
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
    }
  }

  // Queue a notification for later processing
  queueNotification(options: NotificationOptions): void {
    this.notificationQueue.push(options);
    this.processQueue();
  }

  // Process the notification queue with rate limiting
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        await this.showNotification(notification);
        
        // Rate limit: wait 500ms between notifications
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Get default notification icon
  private getDefaultIcon(): string {
    // Return path to EVA icon
    return path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png');
  }

  // Skill training completion notification
  async notifySkillComplete(notification: SkillNotification): Promise<void> {
    const settings = settingsService.getNotificationSettings();
    
    if (!settings.skillCompletion) {
      return;
    }
    
    await this.showNotification({
      title: '🎓 Skill Training Complete',
      body: `${notification.characterName} has completed ${notification.skillName} ${notification.skillLevel}`,
      clickAction: () => {
        // Focus main window when clicked
        // This would be implemented by the main process
        console.log('Skill completion notification clicked');
      }
    });
  }

  // Skill queue warning notification
  async notifyQueueWarning(warning: QueueWarning): Promise<void> {
    const settings = settingsService.getNotificationSettings();
    
    if (!settings.queueWarnings) {
      return;
    }
    
    const timeRemainingHours = Math.floor(warning.timeRemaining / (1000 * 60 * 60));
    const timeRemainingMinutes = Math.floor((warning.timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeString = '';
    if (timeRemainingHours > 0) {
      timeString = `${timeRemainingHours}h ${timeRemainingMinutes}m`;
    } else {
      timeString = `${timeRemainingMinutes}m`;
    }
    
    await this.showNotification({
      title: '⚠️ Skill Queue Warning',
      body: `${warning.characterName}'s skill queue will end in ${timeString}`,
      clickAction: () => {
        console.log('Queue warning notification clicked');
      }
    });
  }

  // Skill queue empty notification
  async notifyQueueEmpty(characterId: number, characterName: string): Promise<void> {
    const settings = settingsService.getNotificationSettings();
    
    if (!settings.queueWarnings) {
      return;
    }
    
    await this.showNotification({
      title: '🚨 Skill Queue Empty',
      body: `${characterName}'s skill queue is empty and training has stopped`,
      clickAction: () => {
        console.log('Empty queue notification clicked');
      }
    });
  }

  // Market opportunity notification
  async notifyMarketOpportunity(
    characterName: string, 
    skillName: string, 
    opportunityType: string
  ): Promise<void> {
    await this.showNotification({
      title: '💰 Market Opportunity',
      body: `${characterName} can now access ${opportunityType} with ${skillName}`,
      clickAction: () => {
        console.log('Market opportunity notification clicked');
      }
    });
  }

  // Corporation skill requirement notification
  async notifyCorporationRequirement(
    characterName: string,
    requirement: string,
    status: 'met' | 'unmet'
  ): Promise<void> {
    const icon = status === 'met' ? '✅' : '❌';
    const title = status === 'met' ? 'Requirement Met' : 'Requirement Not Met';
    
    await this.showNotification({
      title: `${icon} ${title}`,
      body: `${characterName}: ${requirement}`,
      clickAction: () => {
        console.log('Corporation requirement notification clicked');
      }
    });
  }

  // System notification (app updates, etc.)
  async notifySystem(title: string, message: string, urgent = false): Promise<void> {
    await this.showNotification({
      title: urgent ? `🚨 ${title}` : `ℹ️ ${title}`,
      body: message,
      silent: !urgent,
      clickAction: () => {
        console.log('System notification clicked');
      }
    });
  }

  // Test notification (for settings)
  async sendTestNotification(): Promise<void> {
    await this.showNotification({
      title: '🧪 EVA Test Notification',
      body: 'This is a test notification. If you can see this, notifications are working correctly.',
      clickAction: () => {
        console.log('Test notification clicked');
      }
    });
  }

  // Clear all active notifications
  clearAllNotifications(): void {
    this.activeNotifications.forEach(notification => {
      try {
        notification.close();
      } catch (error) {
        console.warn('Failed to close notification:', error);
      }
    });
    
    this.activeNotifications.clear();
    this.notificationQueue.length = 0;
    
    console.log('🧹 All notifications cleared');
  }

  // Get notification statistics
  getNotificationStats(): {
    active: number;
    queued: number;
    supported: boolean;
    enabled: boolean;
  } {
    const settings = settingsService.getNotificationSettings();
    
    return {
      active: this.activeNotifications.size,
      queued: this.notificationQueue.length,
      supported: Notification.isSupported(),
      enabled: settings.enabled
    };
  }

  // Batch notifications for skill completions
  async batchNotifySkillCompletions(notifications: SkillNotification[]): Promise<void> {
    if (notifications.length === 0) return;
    
    if (notifications.length === 1) {
      await this.notifySkillComplete(notifications[0]);
      return;
    }
    
    // Multiple skills completed
    const characterNames = [...new Set(notifications.map(n => n.characterName))];
    const skillCount = notifications.length;
    
    let title = '🎓 Multiple Skills Complete';
    let body = '';
    
    if (characterNames.length === 1) {
      body = `${characterNames[0]} completed ${skillCount} skills`;
    } else {
      body = `${skillCount} skills completed across ${characterNames.length} characters`;
    }
    
    await this.showNotification({
      title,
      body,
      clickAction: () => {
        console.log('Batch skill completion notification clicked');
      }
    });
  }

  // Calculate time until next skill completion
  getNextSkillCompletion(queue: SkillQueueItem[]): Date | null {
    if (queue.length === 0) return null;
    
    // Find the next item with a finish date
    const nextItem = queue
      .filter(item => item.finish_date)
      .sort((a, b) => new Date(a.finish_date!).getTime() - new Date(b.finish_date!).getTime())[0];
    
    return nextItem ? new Date(nextItem.finish_date!) : null;
  }
}

// Singleton instance
export const notificationService = new NotificationService();