import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import { characterService } from './CharacterService';
import { skillQueueService } from './SkillQueueService';
import { settingsService } from './SettingsService';
import * as path from 'path';

export class SystemTrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.createTray();
    this.startPeriodicUpdate();
    
    console.log('✅ System Tray Service initialized');
  }

  // Create system tray
  private createTray(): void {
    try {
      // Create tray icon
      const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'tray-icon.png');
      let trayIcon: Electron.NativeImage;
      
      try {
        trayIcon = nativeImage.createFromPath(iconPath);
      } catch (error) {
        // Fallback: create a simple icon programmatically
        trayIcon = nativeImage.createEmpty();
      }

      // Ensure icon is proper size for tray
      if (process.platform === 'darwin') {
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
        trayIcon.setTemplateImage(true);
      } else {
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
      }

      this.tray = new Tray(trayIcon);
      
      // Set tooltip
      this.updateTooltip();
      
      // Handle tray events
      this.setupTrayEvents();
      
      // Create context menu
      this.updateContextMenu();
      
      console.log('✅ System tray created');
    } catch (error) {
      console.error('❌ Failed to create system tray:', error);
    }
  }

  // Setup tray event handlers
  private setupTrayEvents(): void {
    if (!this.tray) return;

    // Click to show/hide main window
    this.tray.on('click', () => {
      this.toggleMainWindow();
    });

    // Double-click to show main window
    this.tray.on('double-click', () => {
      this.showMainWindow();
    });

    // Right-click for context menu (Windows/Linux)
    this.tray.on('right-click', () => {
      if (process.platform !== 'darwin') {
        this.tray?.popUpContextMenu();
      }
    });
  }

  // Update tooltip with current training status
  private updateTooltip(): void {
    if (!this.tray) return;

    try {
      const characters = characterService.getAllCharacters();
      const trainingCharacters = characters.filter(char => char.training_active);
      
      if (trainingCharacters.length === 0) {
        this.tray.setToolTip('EVA - No active training');
        return;
      }

      if (trainingCharacters.length === 1) {
        const char = trainingCharacters[0];
        const timeRemaining = this.getTimeRemaining(char.training_end_time);
        this.tray.setToolTip(
          `EVA - ${char.character_name}\n${char.training_skill_name} ${timeRemaining}`
        );
      } else {
        const nextCompletion = trainingCharacters
          .filter(char => char.training_end_time)
          .sort((a, b) => 
            new Date(a.training_end_time!).getTime() - new Date(b.training_end_time!).getTime()
          )[0];

        if (nextCompletion) {
          const timeRemaining = this.getTimeRemaining(nextCompletion.training_end_time);
          this.tray.setToolTip(
            `EVA - ${trainingCharacters.length} characters training\nNext: ${nextCompletion.character_name} ${timeRemaining}`
          );
        } else {
          this.tray.setToolTip(`EVA - ${trainingCharacters.length} characters training`);
        }
      }
    } catch (error) {
      console.warn('Failed to update tray tooltip:', error);
      this.tray.setToolTip('EVA - Character Skills');
    }
  }

  // Format time remaining
  private getTimeRemaining(endTime: string | undefined): string {
    if (!endTime) return '';

    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = Math.max(0, end - now);

    if (remaining === 0) return '(Complete)';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `(${days}d ${hours % 24}h)`;
    }

    return `(${hours}h ${minutes}m)`;
  }

  // Update context menu
  private updateContextMenu(): void {
    if (!this.tray) return;

    try {
      const characters = characterService.getAllCharacters();
      const trainingCharacters = characters.filter(char => char.training_active);
      const queueStats = skillQueueService.getQueueStats();

      const menuItems: any[] = [];

      // Main window controls
      menuItems.push(
        {
          label: 'Show EVA',
          click: () => this.showMainWindow()
        },
        {
          label: 'Hide EVA',
          click: () => this.hideMainWindow()
        },
        { type: 'separator' }
      );

      // Training status
      if (trainingCharacters.length > 0) {
        menuItems.push({
          label: `${trainingCharacters.length} Character${trainingCharacters.length > 1 ? 's' : ''} Training`,
          enabled: false
        });

        // Show individual training characters
        trainingCharacters.slice(0, 5).forEach(char => {
          const timeRemaining = this.getTimeRemaining(char.training_end_time);
          menuItems.push({
            label: `${char.character_name}: ${char.training_skill_name} ${timeRemaining}`,
            click: () => {
              characterService.setActiveCharacter(char.character_id);
              this.showMainWindow();
            }
          });
        });

        if (trainingCharacters.length > 5) {
          menuItems.push({
            label: `... and ${trainingCharacters.length - 5} more`,
            click: () => this.showMainWindow()
          });
        }
      } else {
        menuItems.push({
          label: 'No active training',
          enabled: false
        });
      }

      menuItems.push({ type: 'separator' });

      // Quick actions
      menuItems.push(
        {
          label: 'Check Queues Now',
          click: async () => {
            try {
              await skillQueueService.checkAllCharacterQueues();
              this.updateTooltip();
              this.updateContextMenu();
            } catch (error) {
              console.error('Failed to check queues:', error);
            }
          }
        },
        {
          label: 'Test Notification',
          click: async () => {
            try {
              const { notificationService } = await import('./NotificationService');
              await notificationService.sendTestNotification();
            } catch (error) {
              console.error('Failed to send test notification:', error);
            }
          }
        }
      );

      menuItems.push({ type: 'separator' });

      // Settings
      menuItems.push({
        label: 'Settings',
        click: () => {
          this.showMainWindow();
          // Could send event to open settings
        }
      });

      menuItems.push({ type: 'separator' });

      // Quit
      menuItems.push({
        label: 'Quit EVA',
        click: () => {
          app.quit();
        }
      });

      const contextMenu = Menu.buildFromTemplate(menuItems);
      this.tray.setContextMenu(contextMenu);
    } catch (error) {
      console.error('Failed to update context menu:', error);
    }
  }

  // Toggle main window visibility
  private toggleMainWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      if (this.mainWindow.isFocused()) {
        this.hideMainWindow();
      } else {
        this.showMainWindow();
      }
    } else {
      this.showMainWindow();
    }
  }

  // Show main window
  private showMainWindow(): void {
    if (!this.mainWindow) return;

    this.mainWindow.show();
    this.mainWindow.focus();

    // On macOS, also restore from dock
    if (process.platform === 'darwin') {
      app.dock?.show();
    }
  }

  // Hide main window
  private hideMainWindow(): void {
    if (!this.mainWindow) return;

    this.mainWindow.hide();

    // On macOS, hide from dock but keep in tray
    if (process.platform === 'darwin') {
      app.dock?.hide();
    }
  }

  // Start periodic updates
  private startPeriodicUpdate(): void {
    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateTooltip();
      this.updateContextMenu();
    }, 30 * 1000);
  }

  // Stop periodic updates
  private stopPeriodicUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Show notification via tray
  displayBalloon(title: string, content: string): void {
    if (!this.tray) return;

    try {
      this.tray.displayBalloon({
        title,
        content,
        iconType: 'info'
      });
    } catch (error) {
      console.warn('Failed to display tray balloon:', error);
    }
  }

  // Update tray icon to show training status
  updateIcon(trainingActive: boolean = false): void {
    if (!this.tray) return;

    try {
      // Could change icon color/style based on training status
      // This is a placeholder for icon updates
      const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 
        trainingActive ? 'tray-icon-active.png' : 'tray-icon.png');
      
      let trayIcon: Electron.NativeImage;
      try {
        trayIcon = nativeImage.createFromPath(iconPath);
      } catch (error) {
        // Keep existing icon if file not found
        return;
      }

      if (process.platform === 'darwin') {
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
        trayIcon.setTemplateImage(true);
      } else {
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
      }

      this.tray.setImage(trayIcon);
    } catch (error) {
      console.warn('Failed to update tray icon:', error);
    }
  }

  // Force update all tray elements
  forceUpdate(): void {
    this.updateTooltip();
    this.updateContextMenu();
    
    const characters = characterService.getAllCharacters();
    const hasTraining = characters.some(char => char.training_active);
    this.updateIcon(hasTraining);
  }

  // Destroy tray
  destroy(): void {
    this.stopPeriodicUpdate();
    
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    
    console.log('🗑️ System tray destroyed');
  }

  // Check if tray is supported
  static isSupported(): boolean {
    return process.platform !== 'linux' || !!process.env.XDG_CURRENT_DESKTOP;
  }
}