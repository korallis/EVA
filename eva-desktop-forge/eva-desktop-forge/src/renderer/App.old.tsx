import React, { useState, useEffect } from 'react';
import './App.css';
import SkillsView from './components/SkillsView';
import TrainingQueue from './components/TrainingQueue';
import CharacterInfo from './components/CharacterInfo';
import ShipFitting from './components/ShipFitting';
import CharacterTabs from './components/CharacterTabs';
import ContextPanel from './components/ContextPanel';
import Character3DPortrait from './components/Character3DPortrait';
import StartupProgress from './components/StartupProgress';

export {};
declare global {
  interface Window {
    setActiveView?: (view: 'home' | 'skills' | 'training' | 'character' | 'fitting') => void;
  }
}

interface Character {
  character_id: number;
  character_name: string;
  corporation_id?: number;
  corporation_name?: string;
  training_active?: boolean;
  training_skill_name?: string;
  training_end_time?: string;
  last_updated?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'skills' | 'training' | 'character' | 'fitting'>('home');
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [showStartupProgress, setShowStartupProgress] = useState(true);
  const [startupComplete, setStartupComplete] = useState(false);

  useEffect(() => {
    console.log('🔄 Renderer: Setting up auth event listener and loading initial characters');
    loadCharacters();
    
    // Auto-dismiss startup screen after app is ready
    const startupTimer = setTimeout(() => {
      if (showStartupProgress) {
        console.log('🚀 Renderer: Auto-dismissing startup screen - app is ready');
        setShowStartupProgress(false);
      }
    }, 3000); // 3 seconds

    // Listen for authentication success
    window.electronAPI.auth.onSuccess(() => {
      console.log('🎉 Renderer: Authentication success event received! Reloading characters...');
      loadCharacters();
    });

    return () => clearTimeout(startupTimer);

    // Listen for startup completion
    window.electronAPI.startup.onSDEComplete((result) => {
      console.log('🚀 Startup SDE check completed:', result);
      setStartupComplete(true);
      
      // Keep startup screen for a bit longer if successful to show completion
      if (result.success) {
        setTimeout(() => {
          setShowStartupProgress(false);
        }, 2500);
      } else {
        // Hide immediately if failed (user might want to skip)
        setTimeout(() => {
          setShowStartupProgress(false);
        }, 1000);
      }
    });

    return () => {
      console.log('🔄 Renderer: Cleaning up event listeners');
      window.electronAPI.auth.removeAllListeners();
      window.electronAPI.startup.removeSDEListeners();
    };
  }, []);

  const handleStartupComplete = () => {
    console.log('👤 User dismissed startup progress');
    setShowStartupProgress(false);
  };

  const loadCharacters = async () => {
    try {
      console.log('🔄 Renderer: Starting loadCharacters...');
      
      // Check authentication status directly first
      const authStatus = await window.electronAPI.auth.check();
      console.log('🔍 Renderer: Direct auth check result:', authStatus);
      
      // Load all characters
      const allCharacters = await window.electronAPI.characters.getAll();
      console.log('👥 Renderer: Retrieved characters:', allCharacters);
      setCharacters(allCharacters);
      
      // Get active character
      const activeChar = await window.electronAPI.characters.getActive();
      console.log('👤 Renderer: Retrieved active character:', activeChar);
      setActiveCharacter(activeChar);
      
      // Set authentication status - prefer direct auth check over character count
      const newAuthState = authStatus || allCharacters.length > 0;
      console.log('🔐 Renderer: Setting authentication state to:', newAuthState);
      setIsAuthenticated(newAuthState);
      
      console.log(`📚 Renderer: Final state - ${allCharacters.length} characters, active: ${activeChar?.character_name || 'none'}, authenticated: ${newAuthState}`);
    } catch (error) {
      console.error('❌ Renderer: Failed to load characters:', error);
      setError('Failed to load character data');
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Renderer: Starting authentication...');
      const success = await window.electronAPI.auth.start();
      console.log('🔄 Renderer: Auth start returned:', success);
      
      if (success) {
        console.log('✅ Renderer: Authentication completed successfully');
        // Manually trigger loadCharacters as backup
        console.log('🔄 Renderer: Manually calling loadCharacters as backup');
        await loadCharacters();
      } else {
        console.log('❌ Renderer: Authentication failed');
        setError('Failed to start authentication');
      }
    } catch (error: any) {
      console.error('❌ Renderer: Authentication failed:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await window.electronAPI.auth.logout();
      setIsAuthenticated(false);
      setCharacters([]);
      setActiveCharacter(null);
      setError(null);
    } catch (error: any) {
      console.error('Failed to logout:', error);
      setError(error.message || 'Logout failed');
    }
  };

  // Character management functions
  const handleCharacterSelect = async (characterId: number) => {
    try {
      const success = await window.electronAPI.characters.setActive(characterId);
      if (success) {
        const activeChar = await window.electronAPI.characters.getActive();
        setActiveCharacter(activeChar);
        console.log(`✅ Switched to character: ${activeChar?.character_name}`);
      }
    } catch (error) {
      console.error('Failed to select character:', error);
      setError('Failed to switch character');
    }
  };

  const handleCharacterClose = async (characterId: number) => {
    try {
      const success = await window.electronAPI.characters.remove(characterId);
      if (success) {
        await loadCharacters(); // Refresh character list
        console.log(`🗑️ Character removed`);
      }
    } catch (error) {
      console.error('Failed to remove character:', error);
      setError('Failed to remove character');
    }
  };

  const handleAddCharacter = async () => {
    // This will trigger the login flow to add a new character
    await handleLogin();
  };

  // Context panel action handler
  const handleContextAction = async (action: string, data?: any) => {
    try {
      switch (action) {
        case 'view_skills':
          setActiveView('skills');
          break;
        case 'view_training':
          setActiveView('training');
          break;
        case 'view_fitting':
          setActiveView('fitting');
          break;
        case 'view_character':
          setActiveView('character');
          break;
        case 'add_character':
          await handleAddCharacter();
          break;
        case 'refresh_skills':
          if (activeCharacter) {
            await window.electronAPI.characters.updateTraining(activeCharacter.character_id);
            await loadCharacters();
          }
          break;
        case 'train_skill':
          console.log('Train skill:', data);
          // Would implement skill training logic
          break;
        case 'add_to_queue':
          console.log('Add to queue:', data);
          // Would implement queue addition logic
          break;
        default:
          console.log('Unhandled action:', action, data);
      }
    } catch (error) {
      console.error('Failed to execute context action:', error);
      setError(`Failed to execute action: ${action}`);
    }
  };

  const viewSkills = async () => {
    if (!activeCharacter) return;
    
    try {
      setIsLoading(true);
      console.log('🔍 Opening Skills view...');
      
      // Switch to skills view
      setActiveView('skills');
      setError(null);
    } catch (error: any) {
      console.error('❌ Failed to open skills view:', error);
      setError(error.message || 'Failed to open skills view');
    } finally {
      setIsLoading(false);
    }
  };

  // Expose setActiveView for automation (only in dev mode)
  if (process.env.NODE_ENV === 'development' || (window.location && window.location.href.includes('localhost'))) {
    window.setActiveView = (view: 'home' | 'skills' | 'training' | 'character' | 'fitting') => {
      setActiveView(view);
    };
  }

  return (
    <>
      {/* Startup Progress Overlay */}
      <StartupProgress 
        isVisible={showStartupProgress}
        onComplete={handleStartupComplete}
      />
      
      <div className="eve-launcher">
      {/* Top Navigation - Chrome-Style Character Tabs */}
      <div className="top-nav">
        <div className="nav-left">
          <CharacterTabs
            characters={characters}
            activeCharacterId={activeCharacter?.character_id || null}
            onCharacterSelect={handleCharacterSelect}
            onCharacterClose={handleCharacterClose}
            onAddCharacter={handleAddCharacter}
          />
        </div>
        <div className="nav-right">
          {/* Native window controls handled by Electron on macOS */}
        </div>
      </div>

      {/* Main Layout - Three Column */}
      <div className="main-layout">
        
        {/* Left Sidebar - Navigation */}
        <div className="left-sidebar">
          <div className="sidebar-menu">
            <div className="menu-icon">☰</div>
          </div>
          
          <div className="navigation-section">
            <div className="nav-items">
              <div 
                className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
                onClick={() => setActiveView('home')}
              >
                <div className="nav-icon">🏠</div>
                <span>Home</span>
              </div>
              <div 
                className={`nav-item ${activeView === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveView('skills')}
              >
                <div className="nav-icon">🎯</div>
                <span>Skills</span>
              </div>
              <div 
                className={`nav-item ${activeView === 'training' ? 'active' : ''}`}
                onClick={() => setActiveView('training')}
              >
                <div className="nav-icon">📚</div>
                <span>Training</span>
              </div>
              <div 
                className={`nav-item ${activeView === 'character' ? 'active' : ''}`}
                onClick={() => setActiveView('character')}
              >
                <div className="nav-icon">👤</div>
                <span>Character</span>
              </div>
              <div 
                className={`nav-item ${activeView === 'fitting' ? 'active' : ''}`}
                onClick={() => setActiveView('fitting')}
              >
                <div className="nav-icon">🚢</div>
                <span>Fitting</span>
              </div>
            </div>
          </div>

          <div className="eve-branding">
            <div className="eve-logo">EVA</div>
          </div>
        </div>

        {/* Central Content - Dynamic Views */}
        <div className="main-content">
          <div className="content-header">
            <div className="content-tabs">
              <div className={`content-tab ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>HOME</div>
              <div className={`content-tab ${activeView === 'skills' ? 'active' : ''}`} onClick={() => setActiveView('skills')}>SKILLS</div>
              <div className={`content-tab ${activeView === 'training' ? 'active' : ''}`} onClick={() => setActiveView('training')}>TRAINING</div>
              <div className={`content-tab ${activeView === 'character' ? 'active' : ''}`} onClick={() => setActiveView('character')}>CHARACTER</div>
              <div className={`content-tab ${activeView === 'fitting' ? 'active' : ''}`} onClick={() => setActiveView('fitting')}>FITTING</div>
            </div>
          </div>

          <div className="content-body">
            {activeView === 'skills' && isAuthenticated ? (
              <SkillsView />
            ) : activeView === 'training' && isAuthenticated ? (
              <TrainingQueue />
            ) : activeView === 'character' && isAuthenticated ? (
              <CharacterInfo />
            ) : activeView === 'fitting' ? (
              <ShipFitting />
            ) : (
              <div className="character-showcase">

              {/* Main Character Display */}
              <div className="character-main">
                {isAuthenticated && activeCharacter ? (
                  <div className="character-display">
                    <div className="character-portrait-large">
                      <Character3DPortrait 
                        characterId={activeCharacter.character_id}
                        characterName={activeCharacter.character_name}
                        size="large"
                        showHologram={false}
                      />
                    </div>
                    <div className="character-info">
                      <div className="character-details">
                        <div className="character-name">{activeCharacter.character_name}</div>
                        <div className="character-id">Pilot ID: {activeCharacter.character_id}</div>
                        {activeCharacter.corporation_name && (
                          <div className="character-corp">{activeCharacter.corporation_name}</div>
                        )}
                        {activeCharacter.training_active && activeCharacter.training_skill_name && (
                          <div className="character-training">
                            Training: {activeCharacter.training_skill_name}
                          </div>
                        )}
                      </div>
                      <div className="auth-status">
                        <div className="status-indicator online"></div>
                        <span>AUTHENTICATED</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-character">
                    <div className="placeholder-portrait">
                      <Character3DPortrait 
                        size="large"
                        showHologram={true}
                      />
                    </div>
                    <div className="placeholder-text">No character connected</div>
                    <div className="auth-status">
                      <div className="status-indicator offline"></div>
                      <span>NOT AUTHENTICATED</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Character Info Panel */}
              <div className="character-info-panel">
                <div className="section-header">
                  <h2>EVE Virtual Assistant</h2>
                  <p>Character skill management for New Eden</p>
                </div>

                {isAuthenticated && activeCharacter ? (
                  <div className="character-panel">
                    <h3>Pilot Status</h3>
                    <p>Connected to Tranquility server. Ready to access character data and manage skill queue.</p>
                    
                    <div className="action-buttons">
                      <button 
                        className="primary-action-btn"
                        onClick={viewSkills}
                        disabled={isLoading}
                      >
                        {isLoading ? 'LOADING...' : 'VIEW SKILLS'}
                      </button>
                      <button 
                        className="secondary-action-btn"
                        onClick={handleLogout}
                      >
                        DISCONNECT
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="auth-panel">
                    <h3>Connect to EVE Online</h3>
                    <p>Authenticate with your EVE Online account to access character information and manage your skill training.</p>
                    
                    <div className="action-buttons">
                      <button 
                        className="primary-action-btn"
                        onClick={handleLogin}
                        disabled={isLoading}
                      >
                        {isLoading ? 'CONNECTING...' : 'LOG IN TO EVE ONLINE'}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className={`status-message ${error.includes('successful') ? 'success' : 'error'}`}>
                    {error}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Right Panel - Context-Sensitive Panel */}
        <div className="right-panel">
          <ContextPanel
            activeCharacter={activeCharacter}
            selectedSkill={selectedSkill}
            selectedView={activeView}
            onAction={handleContextAction}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bottom-status">
        <div className="status-left">
          <div className="eve-logo-small">EVA</div>
          <div className="version">v1.0.0</div>
        </div>
        <div className="status-center">
          <div className="server-status">
            {isAuthenticated ? 'CONNECTED TO TRANQUILITY' : 'NOT CONNECTED'}
          </div>
        </div>
        <div className="status-right">
          <div className="time">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
    </>
  );
};

export default App;