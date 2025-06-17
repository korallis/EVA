import React, { ReactNode, useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CharacterContext } from '../App';
import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '⚡', description: 'Overview & Analytics' },
  { path: '/ships', label: 'Ship Browser', icon: '🚀', description: 'Browse Ships & Hulls' },
  { path: '/modules', label: 'Module Browser', icon: '⚙️', description: 'Equipment & Modules' },
  { path: '/fitting-recommendations', label: 'Fitting Assistant', icon: '🎯', description: 'Fit Optimization' },
  { path: '/skill-planner', label: 'Skill Planner', icon: '📊', description: 'Skill Development' },
  { path: '/character', label: 'Character', icon: '👤', description: 'Pilot Information' },
  { path: '/settings', label: 'Settings', icon: '⚙️', description: 'App Configuration' },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className="holographic-layout">
      {/* Particle Background Effect */}
      <div className="particles" id="particles-bg"></div>
      
      {/* Top Header Bar */}
      <header className="holo-header glass-panel-compact">
        <div className="header-section header-left">
          <button 
            className="sidebar-toggle btn-ghost" 
            onClick={toggleSidebar}
            aria-label="Toggle Navigation"
          >
            <span className="hamburger-icon">☰</span>
          </button>
          <div className="app-brand">
            <span className="brand-logo text-hero">EVA</span>
            <span className="brand-subtitle text-tiny">Virtual Assistant</span>
          </div>
        </div>
        
        <div className="header-section header-center">
          <div className="search-container">
            <div className="search-input">
              <input 
                type="text" 
                placeholder="Search across the galaxy..." 
                className="input search-field"
              />
            </div>
          </div>
        </div>
        
        <div className="header-section header-right">
          <div className="pilot-info">
            {isAuthenticated && activeCharacter ? (
              <>
                <div className="pilot-avatar">
                  <div className="avatar-frame">
                    <img 
                      src={`https://images.evetech.net/characters/${activeCharacter.character_id}/portrait?size=64`}
                      alt={activeCharacter.character_name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
                <div className="pilot-details">
                  <span className="pilot-name text-body">{activeCharacter.character_name}</span>
                  <span className="pilot-corp text-small">{activeCharacter.corporation_name || 'Unknown Corp'}</span>
                </div>
              </>
            ) : (
              <div className="pilot-details">
                <span className="pilot-name text-body">No Pilot Connected</span>
                <span className="pilot-corp text-small">Authenticate via ESI</span>
              </div>
            )}
          </div>
          
        </div>
      </header>

      {/* Main Application Body */}
      <div className="holo-body">
        {/* Sidebar Navigation */}
        <nav className={`holo-sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="sidebar-content">
            <div className="nav-section">
              <div className="nav-header text-h3">
                <span>Navigation</span>
              </div>
              
              <ul className="nav-items">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path} className="nav-item-container">
                      <Link 
                        to={item.path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setSidebarExpanded(true)}
                      >
                        <div className="nav-icon-container">
                          <span className="nav-icon">{item.icon}</span>
                          {isActive && <div className="active-indicator"></div>}
                        </div>
                        
                        <div className="nav-content">
                          <span className="nav-label text-body">{item.label}</span>
                          <span className="nav-description text-small">{item.description}</span>
                        </div>
                        
                        {isActive && <div className="scan-line"></div>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="holo-content">
          <div className="content-wrapper animate-material-in">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="holo-footer glass-panel-compact">
        <div className="footer-section footer-left">
          <div className="connection-status">
            <div className={`status-dot ${isAuthenticated ? 'connected' : 'disconnected'} animate-glow-pulse`}></div>
            <span className="status-text text-small">
              {isAuthenticated ? 'TRANQUILITY ONLINE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="footer-section footer-center">
          <div className="server-info">
            <span className="server-time text-body">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="server-date text-small">
              {currentTime.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
        
        <div className="footer-section footer-right">
          <div className="app-info">
            <span className="app-version text-tiny">EVA v1.0.0</span>
            <span className="build-info text-tiny">BUILD: {Date.now().toString().slice(-4)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;