import React, { ReactNode, useContext } from 'react';
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
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '⚡' },
  { path: '/ships', label: 'Ships', icon: '🚀' },
  { path: '/modules', label: 'Modules', icon: '⚙️' },
  { path: '/fitting-recommendations', label: 'Fittings', icon: '🎯' },
  { path: '/skill-planner', label: 'Skills', icon: '📊' },
  { path: '/character', label: 'Character', icon: '👤' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);

  return (
    <div className="main-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <span className="logo-text">EVA</span>
          </div>
        </div>
        
        <div className="header-center">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search ships, modules, skills..." 
              className="search-input"
            />
          </div>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{activeCharacter?.character_name || 'No Pilot'}</span>
            <div className="user-avatar"></div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-body">
        {/* Left Navigation */}
        <nav className="app-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Center Content */}
        <main className="app-content">
          {children}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="app-footer">
        <div className="footer-left">
          <span className={`status-indicator ${isAuthenticated ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isAuthenticated ? 'Connected to Tranquility' : 'Not Connected'}</span>
        </div>
        
        <div className="footer-center">
          <span className="server-time">{new Date().toLocaleTimeString()}</span>
        </div>
        
        <div className="footer-right">
          <span className="version">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;