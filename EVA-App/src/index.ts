import { app, BrowserWindow, shell, ipcMain, session } from 'electron';
import * as path from 'path';
import { startupSDEManager } from './services/startupSDEManager';
// Import the enhanced AuthService directly for URL scheme handling
import { authService } from './main/services/AuthService';

// Import all the comprehensive handlers from the main index
// This ensures we get all the tested functionality plus the security improvements
import './main/index';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Configure session-level CSP for Electron
  session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
    // Allow webpack dev server in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const csp = isDevelopment
      ? // Development CSP - allow webpack hot reloading
        "default-src 'self' data: ws: http://localhost:*; " +
        "script-src 'self' 'unsafe-eval' http://localhost:*; " +
        "style-src 'self' 'unsafe-inline' http://localhost:*; " +
        "img-src 'self' data: blob: https://images.evetech.net; " +
        "connect-src 'self' ws://localhost:* http://localhost:* https://esi.evetech.net https://login.eveonline.com; " +
        "font-src 'self' data:; " +
        "frame-src 'none'; " +
        "object-src 'none';"
      : // Production CSP - strict security
        "default-src 'self' data:; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https://images.evetech.net; " +
        "connect-src 'self' https://esi.evetech.net https://login.eveonline.com; " +
        "font-src 'self' data:; " +
        "frame-src 'none'; " +
        "object-src 'none';";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    minHeight: 700,
    minWidth: 1200,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, '../assets/icons/icon.png'),
  });

  // Load the index.html of the app
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Setup URL scheme handling for authentication
  app.setAsDefaultProtocolClient('eva');
  app.setAsDefaultProtocolClient('evaapp');

  // Initialize startup SDE manager
  startupSDEManager.setMainWindow(mainWindow);
  
  // Start SDE check once the window is ready
  mainWindow.webContents.once('did-finish-load', async () => {
    console.log('🚀 Starting automatic SDE check...');
    try {
      const sdeReady = await startupSDEManager.checkAndUpdateSDE();
      if (sdeReady) {
        console.log('✅ SDE startup check completed successfully');
        mainWindow!.webContents.send('startup:sdeComplete', { success: true });
      } else {
        console.warn('⚠️ SDE startup check completed with issues');
        mainWindow!.webContents.send('startup:sdeComplete', { success: false });
      }
    } catch (error) {
      console.error('❌ SDE startup check failed:', error);
      mainWindow!.webContents.send('startup:sdeComplete', { success: false, error: error.message });
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// IPC handlers are automatically initialized by importing './main/index'

// App event handlers
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle URL scheme callbacks (macOS)
app.on('open-url', (event, url) => {
  event.preventDefault();
  authService.handleUrlSchemeCallback(url);
});

// Handle URL scheme callbacks (Windows)
app.on('second-instance', (event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('eva://') || arg.startsWith('evaapp://'));
  if (url) {
    authService.handleUrlSchemeCallback(url);
  }
  
  // Focus the main window if it exists
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Export for use in other modules
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}