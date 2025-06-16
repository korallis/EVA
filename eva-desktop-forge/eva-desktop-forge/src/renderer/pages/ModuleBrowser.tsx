import React from 'react';
import './PageCommon.css';

const ModuleBrowser: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-h1">Module Browser</h1>
        <p className="text-small text-gray-400">Search and filter modules by type, slot, and meta level</p>
      </div>
      
      <div className="page-content">
        <div className="glass-panel coming-soon">
          <h2 className="text-h2">Coming Soon</h2>
          <p className="text-body">The module browser feature is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default ModuleBrowser;