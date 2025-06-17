import React from 'react';
import './PageCommon.css';

const CharacterInfo: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-h1">Character Information</h1>
        <p className="text-small text-gray-400">View detailed character statistics and attributes</p>
      </div>
      
      <div className="page-content">
        <div className="glass-panel coming-soon">
          <h2 className="text-h2">Coming Soon</h2>
          <p className="text-body">The character information page is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterInfo;