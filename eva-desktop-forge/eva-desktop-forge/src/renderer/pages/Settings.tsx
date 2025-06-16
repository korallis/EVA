import React from 'react';
import './PageCommon.css';

const Settings: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-h1">Settings</h1>
        <p className="text-small text-gray-400">Configure EVA preferences and account settings</p>
      </div>
      
      <div className="page-content">
        <div className="glass-panel coming-soon">
          <h2 className="text-h2">Coming Soon</h2>
          <p className="text-body">The settings page is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;