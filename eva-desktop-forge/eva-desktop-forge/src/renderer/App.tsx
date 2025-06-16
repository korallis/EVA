import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import StartupProgress from './components/StartupProgress';
import './styles/design-system.css';
import './App.css';

// Character context for sharing state
export const CharacterContext = React.createContext<{
  activeCharacter: any | null;
  characters: any[];
  isAuthenticated: boolean;
  setActiveCharacter: (char: any) => void;
  loadCharacters: () => Promise<void>;
}>({
  activeCharacter: null,
  characters: [],
  isAuthenticated: false,
  setActiveCharacter: () => {},
  loadCharacters: async () => {},
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<any | null>(null);
  const [showStartupProgress, setShowStartupProgress] = useState(true);

  useEffect(() => {
    loadCharacters();
    
    // Auto-dismiss startup screen after app is ready
    const startupTimer = setTimeout(() => {
      if (showStartupProgress) {
        setShowStartupProgress(false);
      }
    }, 3000);

    // Listen for authentication success
    window.electronAPI.auth.onSuccess(() => {
      loadCharacters();
    });

    // Listen for startup completion
    window.electronAPI.startup.onSDEComplete((result) => {
      setTimeout(() => {
        setShowStartupProgress(false);
      }, result.success ? 2500 : 1000);
    });

    return () => {
      clearTimeout(startupTimer);
      window.electronAPI.auth.removeAllListeners();
      window.electronAPI.startup.removeSDEListeners();
    };
  }, []);

  const loadCharacters = async () => {
    try {
      const authStatus = await window.electronAPI.auth.check();
      const allCharacters = await window.electronAPI.characters.getAll();
      const activeChar = await window.electronAPI.characters.getActive();
      
      setCharacters(allCharacters);
      setActiveCharacter(activeChar);
      setIsAuthenticated(authStatus || allCharacters.length > 0);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };

  const handleStartupComplete = () => {
    setShowStartupProgress(false);
  };

  const contextValue = {
    activeCharacter,
    characters,
    isAuthenticated,
    setActiveCharacter,
    loadCharacters,
  };

  return (
    <>
      {/* Startup Progress Overlay */}
      <StartupProgress 
        isVisible={showStartupProgress}
        onComplete={handleStartupComplete}
      />
      
      <CharacterContext.Provider value={contextValue}>
        <HashRouter>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </HashRouter>
      </CharacterContext.Provider>
    </>
  );
};

export default App;