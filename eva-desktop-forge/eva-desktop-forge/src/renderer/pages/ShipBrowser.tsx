import React from 'react';
import './PageCommon.css';

const ShipBrowser: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-h1">Ship Browser</h1>
        <p className="text-small text-gray-400">Browse and filter ships by faction, class, and capabilities</p>
      </div>
      
      <div className="page-content">
        <div className="glass-panel coming-soon">
          <h2 className="text-h2">Coming Soon</h2>
          <p className="text-body">The ship browser feature is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default ShipBrowser;