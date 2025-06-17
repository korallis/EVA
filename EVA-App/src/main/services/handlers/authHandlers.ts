import { ipcMain, shell, BrowserWindow, app } from 'electron';
import { ESI_CONFIG } from '../../../shared/constants';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { URL } from 'url';

// Auth data interface
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

// Auth service state
class AuthService {
  private currentAuthData: AuthData | null = null;
  private currentState: string | null = null;
  private authResolve: ((value: boolean) => void) | null = null;
  private authReject: ((reason?: any) => void) | null = null;
  private callbackServer: any = null;

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    ipcMain.handle('auth:check', async () => {
      console.log('🔍 Checking authentication status');
      
      // Load auth data if not already loaded
      if (!this.currentAuthData) {
        await this.loadAuthData();
      }
      
      return this.currentAuthData !== null;
    });

    ipcMain.handle('auth:start', async () => {
      console.log('🚀 Starting authentication...');
      
      try {
        // Start the callback server first
        await this.startCallbackServer();
        
        const authUrl = this.buildAuthURL();
        console.log('🌐 Opening browser with auth URL');
        
        // Open the auth URL in the default browser
        shell.openExternal(authUrl);
        
        // Return a promise that resolves when the callback is received
        return new Promise<boolean>((resolve, reject) => {
          this.authResolve = resolve;
          this.authReject = reject;
          
          // Set a timeout for the auth process
          setTimeout(() => {
            if (this.authResolve) {
              this.stopCallbackServer();
              reject(new Error('Authentication timeout'));
              this.authResolve = null;
              this.authReject = null;
            }
          }, 300000); // 5 minute timeout
        });
      } catch (error) {
        console.error('❌ Authentication start failed:', error);
        throw error;
      }
    });

    ipcMain.handle('auth:logout', async () => {
      console.log('🚪 Logging out...');
      
      try {
        this.currentAuthData = null;
        
        // Remove stored auth data
        const userDataPath = app.getPath('userData');
        const authFilePath = path.join(userDataPath, 'auth.json');
        
        if (fs.existsSync(authFilePath)) {
          await fs.promises.unlink(authFilePath);
          console.log('✅ Auth data removed');
        }
        
        // Notify all windows about logout
        BrowserWindow.getAllWindows().forEach(window => {
          window.webContents.send('auth:logout');
        });
        
        return true;
      } catch (error) {
        console.error('❌ Logout failed:', error);
        throw error;
      }
    });

    ipcMain.handle('auth:getCharacter', async () => {
      console.log('👤 Getting character info...');
      
      if (!this.currentAuthData) {
        await this.loadAuthData();
      }
      
      if (!this.currentAuthData) {
        throw new Error('Not authenticated');
      }
      
      return {
        character_id: this.currentAuthData.character_id,
        character_name: this.currentAuthData.character_name,
        scopes: this.currentAuthData.scopes.split(' ')
      };
    });
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private buildAuthURL(): string {
    const state = this.generateRandomState();
    this.currentState = state;
    
    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: ESI_CONFIG.CALLBACK_URL,
      client_id: ESI_CONFIG.CLIENT_ID,
      scope: ESI_CONFIG.SCOPES.join(' '),
      state: state
    });
    
    return `${ESI_CONFIG.LOGIN_URL}?${params.toString()}`;
  }

  private async exchangeCodeForToken(code: string): Promise<AuthData | null> {
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

  private async storeAuthData(authData: AuthData): Promise<void> {
    try {
      this.currentAuthData = authData;
      
      // Store in app data directory
      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');
      
      await fs.promises.writeFile(authFilePath, JSON.stringify(authData, null, 2));
      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
    }
  }

  private async loadAuthData(): Promise<AuthData | null> {
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
      
      this.currentAuthData = authData;
      console.log('✅ Auth data loaded successfully');
      return authData;
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
      return null;
    }
  }

  private startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.callbackServer) {
        this.callbackServer.close();
      }

      this.callbackServer = http.createServer((req: any, res: any) => {
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
          this.handleHttpCallback(url.toString());
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      this.callbackServer.listen(5000, 'localhost', () => {
        console.log('🌐 Callback server started on http://localhost:5000');
        resolve();
      });

      this.callbackServer.on('error', (error: Error) => {
        console.error('❌ Callback server error:', error);
        reject(error);
      });
    });
  }

  private stopCallbackServer(): void {
    if (this.callbackServer) {
      this.callbackServer.close();
      this.callbackServer = null;
      console.log('🛑 Callback server stopped');
    }
  }

  async handleHttpCallback(url: string): Promise<void> {
    console.log('🔐 Processing HTTP callback:', url);
    
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      // Stop the callback server once we've received the callback
      this.stopCallbackServer();
      
      if (!code || !state) {
        throw new Error('Missing code or state in callback');
      }
      
      if (state !== this.currentState) {
        throw new Error('State mismatch in callback');
      }
      
      console.log('✅ State verified, exchanging code for token...');
      
      const authData = await this.exchangeCodeForToken(code);
      if (!authData) {
        throw new Error('Failed to exchange code for token');
      }
      
      // Store the auth data
      await this.storeAuthData(authData);
      
      console.log('✅ Authentication successful!');
      
      // Resolve the promise
      if (this.authResolve) {
        this.authResolve(true);
        this.authResolve = null;
        this.authReject = null;
      }
      
      // Notify all windows about successful authentication
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('auth:success');
      });
    } catch (error) {
      console.error('❌ Error handling auth callback:', error);
      if (this.authReject) {
        this.authReject(error);
        this.authReject = null;
        this.authResolve = null;
      }
    }
  }

  // Handle URL scheme callbacks (for both macOS and Windows)
  handleUrlSchemeCallback(url: string) {
    if (url.startsWith('eva://') || url.startsWith('evaapp://')) {
      console.log('📞 Received URL callback:', url);
      this.handleHttpCallback(url);
    }
  }

  getAuthData(): AuthData | null {
    return this.currentAuthData;
  }
}

export const authService = new AuthService();