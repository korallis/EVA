import React from 'react';
import './PageCommon.css';

const FittingRecommendations: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-h1">Fitting Recommendations</h1>
        <p className="text-small text-gray-400">AI-powered ship fitting suggestions based on your skills and goals</p>
      </div>
      
      <div className="page-content">
        <div className="glass-panel coming-soon">
          <h2 className="text-h2">Coming Soon</h2>
          <p className="text-body">The fitting recommendations feature is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default FittingRecommendations;