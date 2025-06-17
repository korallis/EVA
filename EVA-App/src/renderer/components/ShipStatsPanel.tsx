import React, { useState } from 'react';
import './ShipStatsPanel.css';

interface CurrentShip {
  name: string;
  type: string;
  id: number;
}

interface ShipStats {
  ehp: {
    shield: number;
    armor: number;
    hull: number;
    total: number;
  };
  dps: {
    total: number;
    optimal: number;
    falloff: number;
  };
  tank: {
    shieldRep: number;
    armorRep: number;
    passive: number;
  };
  capacitor: {
    stable: boolean;
    duration: number;
    recharge: number;
  };
  targeting: {
    maxTargets: number;
    range: number;
    scanRes: number;
    sigRadius: number;
  };
  propulsion: {
    maxVelocity: number;
    agility: number;
    warpSpeed: number;
    alignTime: number;
  };
}

interface ShipStatsPanelProps {
  currentShip: CurrentShip | null;
  fittingData: any;
}

const ShipStatsPanel: React.FC<ShipStatsPanelProps> = ({
  currentShip,
  fittingData,
}) => {
  const [shipStats] = useState<ShipStats>({
    ehp: {
      shield: 4250,
      armor: 3800,
      hull: 2150,
      total: 10200,
    },
    dps: {
      total: 385,
      optimal: 12500,
      falloff: 8000,
    },
    tank: {
      shieldRep: 0,
      armorRep: 125,
      passive: 85,
    },
    capacitor: {
      stable: true,
      duration: 0,
      recharge: 420,
    },
    targeting: {
      maxTargets: 7,
      range: 65000,
      scanRes: 185,
      sigRadius: 140,
    },
    propulsion: {
      maxVelocity: 245,
      agility: 3.2,
      warpSpeed: 3.0,
      alignTime: 8.5,
    },
  });

  const formatNumber = (value: number, decimals = 0): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(decimals)}k`;
    }
    return value.toFixed(decimals);
  };

  const getEhpBarColor = (type: string): string => {
    switch (type) {
      case 'shield': return 'var(--primary-electric-blue)';
      case 'armor': return 'var(--accent-orange)';
      case 'hull': return 'var(--text-light-gray)';
      default: return 'var(--primary-cyan)';
    }
  };

  const calculatePercentage = (value: number, total: number): number => {
    return (value / total) * 100;
  };

  return (
    <div className="ship-stats-panel glass-panel">
      <div className="panel-header">
        <h2 className="text-h1 panel-title">Ship Statistics</h2>
        <div className="stats-summary">
          <span className="text-small">
            {currentShip?.name || 'No Ship'} • Combat Analysis
          </span>
        </div>
        <div className="scan-line"></div>
      </div>

      <div className="panel-content">
        {/* Effective Hit Points */}
        <div className="stats-section">
          <h3 className="text-h3 section-title">Effective Hit Points</h3>
          
          <div className="ehp-breakdown">
            <div className="ehp-total">
              <span className="ehp-value text-h1">{formatNumber(shipStats.ehp.total)}</span>
              <span className="ehp-label text-small">Total EHP</span>
            </div>
            
            <div className="ehp-bars">
              <div className="ehp-bar">
                <div className="ehp-info">
                  <span className="text-body">Shield</span>
                  <span className="text-small">{formatNumber(shipStats.ehp.shield)}</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculatePercentage(shipStats.ehp.shield, shipStats.ehp.total)}%`,
                      backgroundColor: getEhpBarColor('shield')
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="ehp-bar">
                <div className="ehp-info">
                  <span className="text-body">Armor</span>
                  <span className="text-small">{formatNumber(shipStats.ehp.armor)}</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculatePercentage(shipStats.ehp.armor, shipStats.ehp.total)}%`,
                      backgroundColor: getEhpBarColor('armor')
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="ehp-bar">
                <div className="ehp-info">
                  <span className="text-body">Hull</span>
                  <span className="text-small">{formatNumber(shipStats.ehp.hull)}</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculatePercentage(shipStats.ehp.hull, shipStats.ehp.total)}%`,
                      backgroundColor: getEhpBarColor('hull')
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Damage Output */}
        <div className="stats-section">
          <h3 className="text-h3 section-title">Damage Output</h3>
          
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.dps.total)}</span>
              <span className="stat-label text-small">DPS</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.dps.optimal / 1000, 1)}km</span>
              <span className="stat-label text-small">Optimal</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.dps.falloff / 1000, 1)}km</span>
              <span className="stat-label text-small">Falloff</span>
            </div>
          </div>
        </div>

        {/* Tank & Repair */}
        <div className="stats-section">
          <h3 className="text-h3 section-title">Tank & Repair</h3>
          
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.tank.armorRep)}</span>
              <span className="stat-label text-small">Armor Rep/s</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.tank.shieldRep)}</span>
              <span className="stat-label text-small">Shield Rep/s</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.tank.passive)}</span>
              <span className="stat-label text-small">Passive Regen</span>
            </div>
          </div>
        </div>

        {/* Capacitor */}
        <div className="stats-section">
          <h3 className="text-h3 section-title">Capacitor</h3>
          
          <div className="capacitor-info">
            <div className="cap-status">
              <div className={`cap-indicator ${shipStats.capacitor.stable ? 'stable' : 'unstable'}`}>
                <span className="cap-icon">{shipStats.capacitor.stable ? '⚡' : '⚠️'}</span>
                <span className="cap-text text-body">
                  {shipStats.capacitor.stable ? 'Cap Stable' : `${shipStats.capacitor.duration}s`}
                </span>
              </div>
            </div>
            
            <div className="cap-stats">
              <div className="stat-item">
                <span className="stat-value text-h2">{formatNumber(shipStats.capacitor.recharge)}s</span>
                <span className="stat-label text-small">Recharge Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Targeting */}
        <div className="stats-section">
          <h3 className="text-h3 section-title">Targeting</h3>
          
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-value text-h2">{shipStats.targeting.maxTargets}</span>
              <span className="stat-label text-small">Max Targets</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.targeting.range / 1000, 1)}km</span>
              <span className="stat-label text-small">Range</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.targeting.scanRes)}</span>
              <span className="stat-label text-small">Scan Res</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.targeting.sigRadius)}m</span>
              <span className="stat-label text-small">Signature</span>
            </div>
          </div>
        </div>

        {/* Propulsion */}
        <div className="stats-section">
          <h3 className="text-h3 section-title">Propulsion</h3>
          
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-value text-h2">{formatNumber(shipStats.propulsion.maxVelocity)}m/s</span>
              <span className="stat-label text-small">Max Velocity</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{shipStats.propulsion.agility.toFixed(1)}s</span>
              <span className="stat-label text-small">Agility</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{shipStats.propulsion.warpSpeed.toFixed(1)}AU/s</span>
              <span className="stat-label text-small">Warp Speed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{shipStats.propulsion.alignTime.toFixed(1)}s</span>
              <span className="stat-label text-small">Align Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipStatsPanel;