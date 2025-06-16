import React from 'react';
import './PageCommon.css';

const SkillPlanner: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-h1">Skill Planner</h1>
        <p className="text-small text-gray-400">Plan your skill training path with visual skill trees</p>
      </div>
      
      <div className="page-content">
        <div className="glass-panel coming-soon">
          <h2 className="text-h2">Coming Soon</h2>
          <p className="text-body">The skill planner feature is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default SkillPlanner;