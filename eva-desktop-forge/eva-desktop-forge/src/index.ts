import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { ESI_CONFIG } from './shared/constants';
const http = require('http');
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Global variables for auth state
let currentState: string | null = null;
let authResolve: ((value: boolean) => void) | null = null;
let authReject: ((reason?: any) => void) | null = null;
let callbackServer: any = null;

// Storage for auth data
interface AuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  character_id: number;
  character_name: string;
  expires_on: string;
  scopes: string;
}

let currentAuthData: AuthData | null = null;

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    minHeight: 700,
    minWidth: 1200,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: require('path').join(__dirname, '../assets/icons/icon.png'), // Proper icon path
  });

  // and load the index.html of the app.
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
        mainWindow.webContents.send('startup:sdeComplete', { success: true });
      } else {
        console.warn('⚠️ SDE startup check completed with issues');
        mainWindow.webContents.send('startup:sdeComplete', { success: false });
      }
    } catch (error) {
      console.error('❌ SDE startup check failed:', error);
      mainWindow.webContents.send('startup:sdeComplete', { success: false, error: error.message });
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle URL scheme callbacks (macOS)
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('📞 Received URL callback:', url);
  handleHttpCallback(url);
});

// Handle URL scheme callbacks (Windows)
app.on('second-instance', (event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('eva://'));
  if (url) {
    console.log('📞 Received URL callback (Windows):', url);
    handleHttpCallback(url);
  }
});

// Helper functions
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

async function exchangeCodeForToken(code: string): Promise<AuthData | null> {
  try {
    const response = await fetch(ESI_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${ESI_CONFIG.CLIENT_ID}:${ESI_CONFIG.CLIENT_SECRET}`).toString('base64'),
        'User-Agent': ESI_CONFIG.USER_AGENT
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange failed:', response.status, errorText);
      return null;
    }

    const tokenData = await response.json();
    console.log('✅ Token exchange successful:', tokenData);
    
    // Decode the JWT to get character info
    const tokenParts = tokenData.access_token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      character_id: parseInt(payload.sub.split(':')[2]), // Extract character ID from sub claim
      character_name: payload.name,
      expires_on: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scope || ESI_CONFIG.SCOPES.join(' ')
    };
  } catch (error) {
    console.error('❌ Token exchange error:', error);
    return null;
  }
}

async function storeAuthData(authData: AuthData): Promise<void> {
  try {
    currentAuthData = authData;
    
    // Store in app data directory
    const userDataPath = app.getPath('userData');
    const authFilePath = path.join(userDataPath, 'auth.json');
    
    await fs.promises.writeFile(authFilePath, JSON.stringify(authData, null, 2));
    console.log('✅ Auth data stored successfully');
  } catch (error) {
    console.error('❌ Failed to store auth data:', error);
  }
}

async function loadAuthData(): Promise<AuthData | null> {
  try {
    const userDataPath = app.getPath('userData');
    const authFilePath = path.join(userDataPath, 'auth.json');
    
    if (!fs.existsSync(authFilePath)) {
      return null;
    }
    
    const authDataString = await fs.promises.readFile(authFilePath, 'utf8');
    const authData: AuthData = JSON.parse(authDataString);
    
    // Check if token is expired
    const expiresOn = new Date(authData.expires_on);
    if (expiresOn <= new Date()) {
      console.log('🔄 Token expired, removing stored data');
      await fs.promises.unlink(authFilePath);
      return null;
    }
    
    currentAuthData = authData;
    console.log('✅ Auth data loaded successfully');
    return authData;
  } catch (error) {
    console.error('❌ Failed to load auth data:', error);
    return null;
  }
}

function buildAuthURL(): string {
  const state = generateRandomState();
  currentState = state;
  
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: ESI_CONFIG.CALLBACK_URL,
    client_id: ESI_CONFIG.CLIENT_ID,
    scope: ESI_CONFIG.SCOPES.join(' '),
    state: state
  });
  
  return `${ESI_CONFIG.LOGIN_URL}?${params.toString()}`;
}

function startCallbackServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (callbackServer) {
      callbackServer.close();
    }

    callbackServer = http.createServer() as any;
    callbackServer.on('request', (req: any, res: any) => {
      if (req.url?.startsWith('/callback')) {
        const url = new URL(req.url, 'http://localhost:5000');
        
        // Send a success page response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>EVA Authentication</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: #fff;">
              <h1 style="color: #ff7722;">Authentication Successful!</h1>
              <p>You can now close this window and return to EVA.</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body>
          </html>
        `);
        
        // Handle the callback
        handleHttpCallback(url.toString());
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    callbackServer.listen(5000, 'localhost', () => {
      console.log('🌐 Callback server started on http://localhost:5000');
      resolve();
    });

    callbackServer.on('error', (error: Error) => {
      console.error('❌ Callback server error:', error);
      reject(error);
    });
  });
}

function stopCallbackServer(): void {
  if (callbackServer) {
    callbackServer.close();
    callbackServer = null;
    console.log('🛑 Callback server stopped');
  }
}

async function handleHttpCallback(url: string): Promise<void> {
  try {
    console.log('📞 Processing HTTP auth callback:', url);
    
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const error = parsedUrl.searchParams.get('error');

    // Stop the callback server
    stopCallbackServer();

    if (error) {
      console.error('❌ OAuth error:', error);
      if (authReject) {
        authReject(new Error(`OAuth error: ${error}`));
        authReject = null;
        authResolve = null;
      }
      return;
    }

    if (!code || !state || state !== currentState) {
      console.error('❌ Invalid callback parameters');
      if (authReject) {
        authReject(new Error('Invalid callback parameters'));
        authReject = null;
        authResolve = null;
      }
      return;
    }

    console.log('✅ Auth callback received, exchanging code for token...');
    
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
    if (tokenData) {
      // Store tokens and character info
      await storeAuthData(tokenData);
      console.log('✅ Authentication completed successfully!');
    }
    
    if (authResolve) {
      authResolve(true);
      authResolve = null;
      authReject = null;
    }
    
    // Notify all windows about successful authentication
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('auth:success');
    });
  } catch (error) {
    console.error('❌ Error handling auth callback:', error);
    if (authReject) {
      authReject(error);
      authReject = null;
      authResolve = null;
    }
  }
}

// Keep the old function for URL scheme (future use)
async function handleAuthCallback(url: string): Promise<void> {
  return handleHttpCallback(url);
}

// Real IPC handlers with authentication
ipcMain.handle('auth:check', async () => {
  console.log('🔍 Checking authentication status');
  
  // Load auth data if not already loaded
  if (!currentAuthData) {
    await loadAuthData();
  }
  
  return currentAuthData !== null;
});

ipcMain.handle('auth:start', async () => {
  console.log('🚀 Starting authentication...');
  
  try {
    // Start the callback server first
    await startCallbackServer();
    
    const authUrl = buildAuthURL();
    console.log('🌐 Opening browser with auth URL');
    
    // Open the auth URL in the default browser
    shell.openExternal(authUrl);
    
    // Return a promise that resolves when the callback is received
    return new Promise<boolean>((resolve, reject) => {
      authResolve = resolve;
      authReject = reject;
      
      // Set a timeout for the auth process
      setTimeout(() => {
        if (authReject) {
          authReject(new Error('Authentication timeout'));
          authReject = null;
          authResolve = null;
          stopCallbackServer();
        }
      }, 300000); // 5 minute timeout
    });
  } catch (error) {
    console.error('❌ Auth start failed:', error);
    stopCallbackServer();
    throw error;
  }
});

ipcMain.handle('auth:logout', async () => {
  console.log('👋 Logging out');
  
  try {
    // Clear memory
    currentAuthData = null;
    
    // Remove stored file
    const userDataPath = app.getPath('userData');
    const authFilePath = path.join(userDataPath, 'auth.json');
    
    if (fs.existsSync(authFilePath)) {
      await fs.promises.unlink(authFilePath);
    }
    
    console.log('✅ Logout successful');
    return true;
  } catch (error) {
    console.error('❌ Logout failed:', error);
    return false;
  }
});

ipcMain.handle('auth:getCharacter', async () => {
  console.log('👤 Getting character info');
  
  // Load auth data if not already loaded
  if (!currentAuthData) {
    await loadAuthData();
  }
  
  if (!currentAuthData) {
    return null;
  }
  
  return {
    character_id: currentAuthData.character_id,
    character_name: currentAuthData.character_name,
    expires_on: currentAuthData.expires_on,
    scopes: currentAuthData.scopes,
    token_type: currentAuthData.token_type
  };
});

ipcMain.handle('esi:getCharacterSkills', async (event, characterId?: string) => {
  console.log('🎯 Getting character skills');
  
  if (!currentAuthData) {
    await loadAuthData();
  }
  
  if (!currentAuthData) {
    throw new Error('Not authenticated');
  }
  
  try {
    const charId = characterId || currentAuthData.character_id;
    const url = `${ESI_CONFIG.ESI_BASE_URL}/latest/characters/${charId}/skills/`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${currentAuthData.access_token}`,
        'User-Agent': ESI_CONFIG.USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }
    
    const skillsData = await response.json();
    console.log('✅ Skills data retrieved:', skillsData.skills?.length || 0, 'skills');
    return skillsData;
  } catch (error) {
    console.error('❌ Failed to get character skills:', error);
    throw error;
  }
});

ipcMain.handle('esi:getCharacterSkillQueue', async (event, characterId?: string) => {
  console.log('⏰ Getting skill queue');
  
  if (!currentAuthData) {
    await loadAuthData();
  }
  
  if (!currentAuthData) {
    throw new Error('Not authenticated');
  }
  
  try {
    const charId = characterId || currentAuthData.character_id;
    const url = `${ESI_CONFIG.ESI_BASE_URL}/latest/characters/${charId}/skillqueue/`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${currentAuthData.access_token}`,
        'User-Agent': ESI_CONFIG.USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`ESI API error: ${response.status} ${response.statusText}`);
    }
    
    const queueData = await response.json();
    console.log('✅ Skill queue data retrieved:', queueData.length || 0, 'items');
    return queueData;
  } catch (error) {
    console.error('❌ Failed to get skill queue:', error);
    throw error;
  }
});

// Cache for skill type information
const skillTypeCache: Map<number, any> = new Map();

ipcMain.handle('esi:getSkillTypes', async (event, skillIds: number[]) => {
  console.log('📚 Getting skill type information for', skillIds.length, 'skills');
  
  try {
    const results: Record<number, any> = {};
    const idsToFetch: number[] = [];
    
    // Check cache first
    for (const id of skillIds) {
      if (skillTypeCache.has(id)) {
        results[id] = skillTypeCache.get(id);
      } else {
        idsToFetch.push(id);
      }
    }
    
    // Fetch missing skill types
    for (const id of idsToFetch) {
      try {
        const url = `${ESI_CONFIG.ESI_BASE_URL}/latest/universe/types/${id}/`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': ESI_CONFIG.USER_AGENT
          }
        });
        
        if (response.ok) {
          const typeData = await response.json();
          skillTypeCache.set(id, typeData);
          results[id] = typeData;
        }
      } catch (error) {
        console.error(`Failed to fetch skill type ${id}:`, error);
      }
    }
    
    console.log('✅ Skill types retrieved:', Object.keys(results).length);
    return results;
  } catch (error) {
    console.error('❌ Failed to get skill types:', error);
    throw error;
  }
});

// Initialize SDE service
import { sdeService } from './services/sdeService';
import { FittingCalculator } from './services/fittingCalculator';
import { sdeImporter } from './services/sdeImporter';
import { sdeDownloader } from './services/sdeDownloader';
import { startupSDEManager, StartupSDEProgress } from './services/startupSDEManager';

// SDE and Fitting IPC handlers
ipcMain.handle('sde:initialize', async () => {
  console.log('🔄 Initializing SDE database...');
  try {
    await sdeService.initialize();
    console.log('✅ SDE database initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize SDE:', error);
    throw error;
  }
});

ipcMain.handle('sde:getShips', async () => {
  console.log('🚢 Getting ships data...');
  try {
    const ships = await sdeService.getShips();
    console.log('✅ Ships data retrieved:', ships.length, 'ships');
    return ships;
  } catch (error) {
    console.error('❌ Failed to get ships:', error);
    throw error;
  }
});

ipcMain.handle('sde:getModules', async () => {
  console.log('⚙️ Getting modules data...');
  try {
    const modules = await sdeService.getModules();
    console.log('✅ Modules data retrieved:', modules.length, 'modules');
    return modules;
  } catch (error) {
    console.error('❌ Failed to get modules:', error);
    throw error;
  }
});

ipcMain.handle('sde:getTypeAttributes', async (event, typeID: number) => {
  try {
    const attributes = await sdeService.getTypeAttributes(typeID);
    return attributes;
  } catch (error) {
    console.error('❌ Failed to get type attributes:', error);
    throw error;
  }
});

ipcMain.handle('sde:getSkillRequirements', async (event, typeID: number) => {
  try {
    const requirements = await sdeService.getSkillRequirements(typeID);
    return requirements;
  } catch (error) {
    console.error('❌ Failed to get skill requirements:', error);
    throw error;
  }
});

ipcMain.handle('fitting:calculate', async (event, shipData: any, modulesData: any[]) => {
  try {
    const { fittingCalculator } = await import('./services/fittingCalculator');
    const stats = await fittingCalculator.calculateFittingStats(shipData, modulesData);
    return stats;
  } catch (error) {
    console.error('❌ Failed to calculate fitting:', error);
    throw error;
  }
});

ipcMain.handle('fitting:validate', async (event, shipData: any, modulesData: any[]) => {
  try {
    // For now, return a simple validation - this would be implemented later
    return { valid: true, warnings: [], errors: [] };
  } catch (error) {
    console.error('❌ Failed to validate fitting:', error);
    throw error;
  }
});

ipcMain.handle('fitting:save', async (event, fitting: any) => {
  console.log('💾 Saving fitting...');
  try {
    const fittingId = await sdeService.saveFitting(fitting);
    console.log('✅ Fitting saved with ID:', fittingId);
    return fittingId;
  } catch (error) {
    console.error('❌ Failed to save fitting:', error);
    throw error;
  }
});

ipcMain.handle('fitting:getFittings', async () => {
  console.log('📋 Getting saved fittings...');
  try {
    const fittings = await sdeService.getFittings();
    console.log('✅ Fittings retrieved:', fittings.length, 'fittings');
    return fittings;
  } catch (error) {
    console.error('❌ Failed to get fittings:', error);
    throw error;
  }
});

// SDE Import handler
ipcMain.handle('sde:import', async () => {
  console.log('🚀 Starting SDE import...');
  try {
    await sdeImporter.importFullSDE();
    console.log('✅ SDE import completed');
    return { success: true, message: 'SDE data imported successfully' };
  } catch (error) {
    console.error('❌ SDE import failed:', error);
    return { success: false, error: error.message };
  }
});

// SDE Downloader handlers
ipcMain.handle('sde:checkVersion', async () => {
  console.log('🔍 Checking latest SDE version...');
  try {
    const versionInfo = await sdeDownloader.checkLatestVersion();
    console.log('✅ SDE version checked:', versionInfo?.version || 'Unknown');
    return versionInfo;
  } catch (error) {
    console.error('❌ Failed to check SDE version:', error);
    throw error;
  }
});

ipcMain.handle('sde:getInstalledVersion', async () => {
  console.log('📋 Getting installed SDE version...');
  try {
    const versionInfo = await sdeDownloader.getInstalledVersion();
    console.log('✅ Installed SDE version:', versionInfo?.version || 'None');
    return versionInfo;
  } catch (error) {
    console.error('❌ Failed to get installed SDE version:', error);
    throw error;
  }
});

ipcMain.handle('sde:download', async (event) => {
  console.log('📦 Starting SDE download...');
  try {
    const success = await sdeDownloader.downloadAndInstallSDE((progress) => {
      // Send progress updates to renderer
      event.sender.send('sde:downloadProgress', progress);
    });
    console.log('✅ SDE download completed:', success);
    return { success, message: success ? 'SDE downloaded successfully' : 'SDE download failed' };
  } catch (error) {
    console.error('❌ SDE download failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sde:parse', async () => {
  console.log('🔄 Parsing SDE data...');
  try {
    const stats = await sdeDownloader.parseSDE();
    console.log('✅ SDE parsing completed:', stats);
    return stats;
  } catch (error) {
    console.error('❌ SDE parsing failed:', error);
    throw error;
  }
});

ipcMain.handle('sde:clearDatabase', async () => {
  console.log('🗑️ Clearing SDE database...');
  try {
    await sdeService.clearDatabase();
    console.log('✅ SDE database cleared');
    return { success: true, message: 'SDE database cleared successfully' };
  } catch (error) {
    console.error('❌ Failed to clear SDE database:', error);
    return { success: false, error: error.message };
  }
});

// Startup SDE Management handlers
ipcMain.handle('startup:checkSDE', async () => {
  console.log('🔍 Manual SDE check requested...');
  try {
    const sdeReady = await startupSDEManager.checkAndUpdateSDE();
    return { success: sdeReady };
  } catch (error) {
    console.error('❌ Manual SDE check failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('startup:forceSDERefresh', async () => {
  console.log('🔄 Force SDE refresh requested...');
  try {
    const sdeReady = await startupSDEManager.forceSDERefresh();
    return { success: sdeReady };
  } catch (error) {
    console.error('❌ Force SDE refresh failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('startup:getSDEStatus', async () => {
  console.log('📊 SDE status requested...');
  try {
    const status = await startupSDEManager.getSDEStatus();
    return status;
  } catch (error) {
    console.error('❌ Failed to get SDE status:', error);
    return {
      hasData: false,
      version: 'Error',
      shipCount: 0,
      moduleCount: 0
    };
  }
});

console.log('✅ EVA Main Process Started Successfully with Real Auth');