import React, { useContext } from 'react';
import { CharacterContext } from '../App';
import SkillAnalysisPanel from '../components/panels/SkillAnalysisPanel';
import ShipFittingPanel from '../components/panels/ShipFittingPanel';
import ShipStatsPanel from '../components/panels/ShipStatsPanel';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { activeCharacter } = useContext(CharacterContext);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="text-h1">Pilot Dashboard</h1>
        {activeCharacter && (
          <div className="character-info">
            <span className="character-name">{activeCharacter.character_name}</span>
            <span className="character-corp">{activeCharacter.corporation_name}</span>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-panels">
          {/* Left Panel - Skill Analysis */}
          <div className="panel-container">
            <SkillAnalysisPanel characterId={activeCharacter?.character_id} />
          </div>

          {/* Center Panel - Ship Fitting */}
          <div className="panel-container panel-large">
            <ShipFittingPanel />
          </div>

          {/* Right Panel - Ship Stats */}
          <div className="panel-container">
            <ShipStatsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;