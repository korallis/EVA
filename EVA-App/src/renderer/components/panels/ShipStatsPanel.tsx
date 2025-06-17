import React from 'react';
import './ShipStatsPanel.css';

interface ShipStat {
  label: string;
  value: string | number;
  unit?: string;
  percentage?: number;
}

const ShipStatsPanel: React.FC = () => {
  const defenseStats: ShipStat[] = [
    { label: 'Shield HP', value: '3,475', percentage: 85 },
    { label: 'Armor HP', value: '2,150', percentage: 65 },
    { label: 'Hull HP', value: '1,875', percentage: 45 },
  ];

  const offenseStats: ShipStat[] = [
    { label: 'DPS', value: '425.5', unit: 'HP/s' },
    { label: 'Alpha', value: '1,875', unit: 'HP' },
    { label: 'Range', value: '45.2', unit: 'km' },
  ];

  const capacitorStats: ShipStat[] = [
    { label: 'Capacity', value: '1,150', unit: 'GJ' },
    { label: 'Recharge', value: '225.5', unit: 's' },
    { label: 'Peak Rate', value: '5.2', unit: 'GJ/s' },
  ];

  const navigationStats: ShipStat[] = [
    { label: 'Max Velocity', value: '225', unit: 'm/s' },
    { label: 'Align Time', value: '8.5', unit: 's' },
    { label: 'Warp Speed', value: '3.0', unit: 'AU/s' },
  ];

  const renderStatBar = (stat: ShipStat) => (
    <div className="stat-item" key={stat.label}>
      <div className="stat-header">
        <span className="stat-label">{stat.label}</span>
        <span className="stat-value">
          {stat.value}
          {stat.unit && <span className="stat-unit"> {stat.unit}</span>}
        </span>
      </div>
      {stat.percentage !== undefined && (
        <div className="stat-bar">
          <div 
            className="stat-bar-fill"
            style={{ width: `${stat.percentage}%` }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="ship-stats-panel glass-panel">
      <div className="panel-header">
        <h2 className="panel-title">SHIP STATISTICS</h2>
      </div>

      <div className="panel-content">
        {/* Defense Stats */}
        <div className="stats-section">
          <h3 className="section-title">Defense</h3>
          <div className="stats-list">
            {defenseStats.map(renderStatBar)}
          </div>
        </div>

        {/* Offense Stats */}
        <div className="stats-section">
          <h3 className="section-title">Offense</h3>
          <div className="stats-list">
            {offenseStats.map(stat => (
              <div className="stat-item simple" key={stat.label}>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">
                  {stat.value}
                  {stat.unit && <span className="stat-unit"> {stat.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Capacitor Stats */}
        <div className="stats-section">
          <h3 className="section-title">Capacitor</h3>
          <div className="stats-list">
            {capacitorStats.map(stat => (
              <div className="stat-item simple" key={stat.label}>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">
                  {stat.value}
                  {stat.unit && <span className="stat-unit"> {stat.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Stats */}
        <div className="stats-section">
          <h3 className="section-title">Navigation</h3>
          <div className="stats-list">
            {navigationStats.map(stat => (
              <div className="stat-item simple" key={stat.label}>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">
                  {stat.value}
                  {stat.unit && <span className="stat-unit"> {stat.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ship Class Info */}
        <div className="ship-class-info">
          <div className="class-item">
            <span className="class-label">Class</span>
            <span className="class-value">Cruiser</span>
          </div>
          <div className="class-item">
            <span className="class-label">Tech</span>
            <span className="class-value">T2</span>
          </div>
          <div className="class-item">
            <span className="class-label">Role</span>
            <span className="class-value">Combat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipStatsPanel;