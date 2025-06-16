import { shell } from 'electron';
import { ESI_CONFIG } from '../../shared/constants';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const http = require('http');

export interface AuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  character_id: number;
  character_name: string;
  expires_on: string;
  scopes: string;
}

export class AuthService {
  private currentState: string | null = null;
  private authResolve: ((value: boolean) => void) | null = null;
  private authReject: ((reason?: any) => void) | null = null;
  private callbackServer: any = null;
  private currentAuthData: AuthData | null = null;

  constructor() {
    // Load existing auth data on startup
    this.loadAuthData().then(data => {
      this.currentAuthData = data;
    }).catch(error => {
      console.log('No existing auth data found:', error.message);
    });
  }

  // Generate random state for OAuth security
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Exchange authorization code for access token
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

  // Store auth data securely
  private async storeAuthData(authData: AuthData): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');
      
      // Store auth data (in production, this should be encrypted)
      fs.writeFileSync(authFilePath, JSON.stringify(authData, null, 2));
      
      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
      throw error;
    }
  }

  // Load stored auth data
  private async loadAuthData(): Promise<AuthData | null> {
    try {
      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');
      
      if (!fs.existsSync(authFilePath)) {
        return null;
      }
      
      const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
      
      // Check if token is expired
      const expiresOn = new Date(authData.expires_on);
      const now = new Date();
      
      if (expiresOn <= now) {
        console.log('🔄 Token expired, attempting refresh...');
        return await this.refreshToken(authData.refresh_token);
      }
      
      console.log('✅ Auth data loaded successfully');
      return authData;
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
      return null;
    }
  }

  // Refresh expired token
  private async refreshToken(refreshToken: string): Promise<AuthData | null> {
    try {
      const response = await fetch(ESI_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${ESI_CONFIG.CLIENT_ID}:${ESI_CONFIG.CLIENT_SECRET}`).toString('base64'),
          'User-Agent': ESI_CONFIG.USER_AGENT
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        console.error('❌ Token refresh failed:', response.status);
        return null;
      }

      const tokenData = await response.json();
      console.log('✅ Token refreshed successfully');
      
      // Decode the JWT to get character info
      const tokenParts = tokenData.access_token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      const authData: AuthData = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token || refreshToken, // Some responses don't include refresh token
        character_id: parseInt(payload.sub.split(':')[2]),
        character_name: payload.name,
        expires_on: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        scopes: tokenData.scope || ESI_CONFIG.SCOPES.join(' ')
      };

      await this.storeAuthData(authData);
      this.currentAuthData = authData;
      
      return authData;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return null;
    }
  }

  // Build EVE SSO authorization URL
  private buildAuthURL(): string {
    this.currentState = this.generateRandomState();
    
    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: ESI_CONFIG.CALLBACK_URL,
      client_id: ESI_CONFIG.CLIENT_ID,
      scope: ESI_CONFIG.SCOPES.join(' '),
      state: this.currentState
    });
    
    return `${ESI_CONFIG.LOGIN_URL}?${params.toString()}`;
  }

  // Start local callback server for OAuth
  private async startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.callbackServer = http.createServer(async (req: any, res: any) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        if (url.pathname === '/callback') {
          console.log('📞 Received OAuth callback:', url.search);
          
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');
          
          if (error) {
            console.error('❌ OAuth error:', error);
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #ff4444;">Authentication Failed</h2>
                  <p>Error: ${error}</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            
            if (this.authReject) {
              this.authReject(new Error(error));
            }
            return;
          }
          
          if (!code || !state || state !== this.currentState) {
            console.error('❌ Invalid callback parameters');
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #ff4444;">Authentication Failed</h2>
                  <p>Invalid callback parameters</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            
            if (this.authReject) {
              this.authReject(new Error('Invalid callback parameters'));
            }
            return;
          }
          
          try {
            // Exchange code for token
            const authData = await this.exchangeCodeForToken(code);
            
            if (authData) {
              await this.storeAuthData(authData);
              this.currentAuthData = authData;
              
              console.log('✅ Authentication successful for:', authData.character_name);
              
              // Add character to character service
              try {
                const { characterService } = await import('./CharacterService');
                await characterService.addCharacter(authData);
                console.log('✅ Character added to character service successfully');
              } catch (error) {
                console.warn('⚠️ Failed to add character to character service:', error);
              }
              
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: #ffffff;">
                    <h2 style="color: #00ff88;">Authentication Successful!</h2>
                    <div style="background: rgba(0, 255, 136, 0.1); border: 1px solid #00ff88; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 400px;">
                      <h3 style="margin-top: 0;">Welcome, ${authData.character_name}!</h3>
                      <p>Character ID: ${authData.character_id}</p>
                      <p>Corporation: Loading...</p>
                    </div>
                    <p style="color: #cccccc;">You can now close this window and return to EVA.</p>
                    <script>
                      setTimeout(() => {
                        window.close();
                      }, 3000);
                    </script>
                  </body>
                </html>
              `);
              
              if (this.authResolve) {
                this.authResolve(true);
              }
            } else {
              throw new Error('Failed to exchange code for token');
            }
          } catch (error) {
            console.error('❌ Token exchange failed:', error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #ff4444;">Authentication Failed</h2>
                  <p>Failed to exchange authorization code for access token</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            
            if (this.authReject) {
              this.authReject(error);
            }
          }
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.callbackServer.listen(5000, 'localhost', () => {
        console.log('🚀 Callback server started on http://localhost:5000');
        resolve();
      });
      
      this.callbackServer.on('error', (error: any) => {
        console.error('❌ Callback server error:', error);
        reject(error);
      });
    });
  }

  // Stop the callback server
  private stopCallbackServer(): void {
    if (this.callbackServer) {
      this.callbackServer.close();
      this.callbackServer = null;
      console.log('🛑 Callback server stopped');
    }
  }

  // Handle URL scheme callbacks (macOS/Windows)
  async handleAuthCallback(url: string): Promise<void> {
    console.log('📞 Received URL callback:', url);
    
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      const error = urlObj.searchParams.get('error');
      
      if (error) {
        console.error('❌ OAuth error:', error);
        if (this.authReject) {
          this.authReject(new Error(error));
        }
        return;
      }
      
      if (!code || !state || state !== this.currentState) {
        console.error('❌ Invalid callback parameters');
        if (this.authReject) {
          this.authReject(new Error('Invalid callback parameters'));
        }
        return;
      }
      
      // Exchange code for token
      const authData = await this.exchangeCodeForToken(code);
      
      if (authData) {
        await this.storeAuthData(authData);
        this.currentAuthData = authData;
        
        console.log('✅ Authentication successful for:', authData.character_name);
        
        // Add character to character service
        try {
          const { characterService } = await import('./CharacterService');
          await characterService.addCharacter(authData);
        } catch (error) {
          console.warn('⚠️ Failed to add character to character service:', error);
        }
        
        if (this.authResolve) {
          this.authResolve(true);
        }
      } else {
        throw new Error('Failed to exchange code for token');
      }
    } catch (error) {
      console.error('❌ Callback handling failed:', error);
      if (this.authReject) {
        this.authReject(error);
      }
    } finally {
      this.stopCallbackServer();
    }
  }

  // Public API methods

  async isAuthenticated(): Promise<boolean> {
    if (!this.currentAuthData) {
      const authData = await this.loadAuthData();
      this.currentAuthData = authData;
    }
    
    return this.currentAuthData !== null;
  }

  async startAuthentication(): Promise<boolean> {
    try {
      console.log('🔑 Starting EVE SSO authentication...');
      
      // Start callback server
      await this.startCallbackServer();
      
      // Create auth promise
      const authPromise = new Promise<boolean>((resolve, reject) => {
        this.authResolve = resolve;
        this.authReject = reject;
        
        // Timeout after 5 minutes
        setTimeout(() => {
          this.stopCallbackServer();
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
      
      // Build auth URL and open in browser
      const authUrl = this.buildAuthURL();
      console.log('🌐 Opening browser for authentication...');
      await shell.openExternal(authUrl);
      
      // Wait for authentication completion
      const success = await authPromise;
      this.stopCallbackServer();
      
      return success;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      this.stopCallbackServer();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.currentAuthData = null;
      
      // Delete stored auth data
      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');
      
      if (fs.existsSync(authFilePath)) {
        fs.unlinkSync(authFilePath);
      }
      
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  async getCharacterData(): Promise<AuthData | null> {
    if (!this.currentAuthData) {
      const authData = await this.loadAuthData();
      this.currentAuthData = authData;
    }
    
    return this.currentAuthData;
  }

  async getAccessToken(): Promise<string | null> {
    const authData = await this.getCharacterData();
    return authData ? authData.access_token : null;
  }
}

// Singleton instance
export const authService = new AuthService();