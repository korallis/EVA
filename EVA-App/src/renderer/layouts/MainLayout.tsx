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
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: '⚡', description: 'Overview & Analytics' },
      { path: '/character', label: 'Character', icon: '👤', description: 'Pilot Information' },
      { path: '/communication-hub', label: 'Communications', icon: '💬', description: 'Mail & Contacts', badge: 'NEW' },
    ]
  },
  {
    title: 'AI Assistant',
    items: [
      { path: '/skill-planner', label: 'Skill Planner', icon: '🧠', description: 'AI Skill Recommendations', badge: 'NEW' },
      { path: '/fitting-assistant', label: 'Fitting Assistant', icon: '🎯', description: 'Ship & Fit Recommendations', badge: 'NEW' },
    ]
  },
  {
    title: 'Analytics & Management',
    items: [
      { path: '/market-analytics', label: 'Market Analytics', icon: '📈', description: 'Trading Performance', badge: 'NEW' },
      { path: '/industry-management', label: 'Industry Suite', icon: '🏭', description: 'Manufacturing & Mining', badge: 'NEW' },
      { path: '/combat-analytics', label: 'Combat Analytics', icon: '⚔️', description: 'PvP Performance', badge: 'NEW' },
    ]
  },
  {
    title: 'Browse & Tools',
    items: [
      { path: '/ships', label: 'Ship Browser', icon: '🚀', description: 'Browse Ships & Hulls' },
      { path: '/modules', label: 'Module Browser', icon: '⚙️', description: 'Equipment & Modules' },
      { path: '/fitting-recommendations', label: 'Fitting Database', icon: '📋', description: 'Popular Ship Fittings' },
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: '⚙️', description: 'App Configuration' },
    ]
  }
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
          <div className="quick-actions" style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)', 
            alignItems: 'center' 
          }}>
            <Link 
              to="/skill-planner" 
              className="quick-action-btn"
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '6px',
                color: 'var(--primary-cyan)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.2)';
                e.currentTarget.style.borderColor = 'var(--primary-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
              }}
            >
              <span>🧠</span>
              <span>Plan Skills</span>
            </Link>
            
            <Link 
              to="/fitting-assistant" 
              className="quick-action-btn"
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'rgba(255, 122, 34, 0.1)',
                border: '1px solid rgba(255, 122, 34, 0.3)',
                borderRadius: '6px',
                color: 'var(--warning-orange)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 122, 34, 0.2)';
                e.currentTarget.style.borderColor = 'var(--warning-orange)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 122, 34, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 122, 34, 0.3)';
              }}
            >
              <span>🎯</span>
              <span>Find Ships</span>
            </Link>

            <Link 
              to="/market-analytics" 
              className="quick-action-btn"
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '6px',
                color: 'var(--success-green)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                e.currentTarget.style.borderColor = 'var(--success-green)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.3)';
              }}
            >
              <span>📈</span>
              <span>Trading</span>
            </Link>
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
            {navSections.map((section, sectionIndex) => (
              <div key={section.title} className="nav-section" style={{ marginBottom: 'var(--space-md)' }}>
                <div className="nav-header text-h3">
                  <span>{section.title}</span>
                </div>
                
                <ul className="nav-items">
                  {section.items.map((item) => {
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                              <span className="nav-label text-body">{item.label}</span>
                              {item.badge && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  backgroundColor: 'var(--primary-cyan)',
                                  color: 'black',
                                  borderRadius: '3px',
                                  fontWeight: 'bold'
                                }}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className="nav-description text-small">{item.description}</span>
                          </div>
                          
                          {isActive && <div className="scan-line"></div>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
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
          <div className="feature-status" style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)', 
            alignItems: 'center',
            marginRight: 'var(--space-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--success-green)', fontSize: '10px' }}>●</span>
              <span className="text-tiny">AI Assistant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--primary-cyan)', fontSize: '10px' }}>●</span>
              <span className="text-tiny">Analytics Suite</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--warning-orange)', fontSize: '10px' }}>●</span>
              <span className="text-tiny">Management</span>
            </div>
          </div>
          <div className="app-info">
            <span className="app-version text-tiny">EVA v2.0.0</span>
            <span className="build-info text-tiny">AI ENHANCED</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;