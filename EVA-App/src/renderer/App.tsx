import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/design-system.css';
import './App.css';
import './components/ui/ErrorBoundary.css';

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
  setActiveCharacter: () => {
    // Default implementation - overridden in component
  },
  loadCharacters: async () => {
    // Default implementation - overridden in component
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<any | null>(null);

  useEffect(() => {
    loadCharacters();

    // Listen for authentication success
    window.electronAPI.auth.onSuccess(() => {
      console.log('📥 Received auth:success event');
      loadCharacters();
    });
    
    // Listen for logout events
    const handleLogout = () => {
      console.log('📥 Received logout event');
      setIsAuthenticated(false);
      setCharacters([]);
      setActiveCharacter(null);
    };
    
    // Add logout listener if available
    if (window.electronAPI.auth.onLogout) {
      window.electronAPI.auth.onLogout(handleLogout);
    }

    return () => {
      window.electronAPI.auth.removeAllListeners();
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
      // On error, assume not authenticated
      setIsAuthenticated(false);
      setCharacters([]);
      setActiveCharacter(null);
    }
  };

  const contextValue = {
    activeCharacter,
    characters,
    isAuthenticated,
    setActiveCharacter,
    loadCharacters,
  };

  return (
    <ErrorBoundary>
      <CharacterContext.Provider value={contextValue}>
        <HashRouter>
          <MainLayout>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </MainLayout>
        </HashRouter>
      </CharacterContext.Provider>
    </ErrorBoundary>
  );
};

export default App;