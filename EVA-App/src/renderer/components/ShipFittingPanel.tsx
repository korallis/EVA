import React, { useState, useEffect } from 'react';
import './ShipFittingPanel.css';

interface CurrentShip {
  name: string;
  type: string;
  id: number;
}

interface SlotConfig {
  high: number;
  med: number;
  low: number;
  rig: number;
  subsystem?: number;
}

interface ShipFittingPanelProps {
  currentShip: CurrentShip | null;
  fittingData: any;
}

const ShipFittingPanel: React.FC<ShipFittingPanelProps> = ({
  currentShip,
  fittingData,
}) => {
  const [slotConfig, setSlotConfig] = useState<SlotConfig>({
    high: 5,
    med: 4,
    low: 6,
    rig: 3,
  });

  const [fittedModules, setFittedModules] = useState<{ [key: string]: any }>({
    high_0: { name: 'Heavy Pulse Laser II', type: 'high' },
    high_1: { name: 'Heavy Pulse Laser II', type: 'high' },
    med_0: { name: 'Tracking Computer II', type: 'med' },
    med_1: { name: 'Cap Recharger II', type: 'med' },
    low_0: { name: 'Heat Sink II', type: 'low' },
    low_1: { name: 'Armor Plate II', type: 'low' },
    rig_0: { name: 'Energy Locus Coordinator I', type: 'rig' },
  });

  const [scanAnimation, setScanAnimation] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanAnimation(true);
      setTimeout(() => setScanAnimation(false), 2000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const renderSlots = (slotType: string, count: number) => {
    const slots = [];
    for (let i = 0; i < count; i++) {
      const slotKey = `${slotType}_${i}`;
      const module = fittedModules[slotKey];
      const isEmpty = !module;

      slots.push(
        <div
          key={slotKey}
          className={`fitting-slot ${slotType}-slot ${isEmpty ? 'empty' : 'filled'}`}
          data-slot-type={slotType}
          data-slot-index={i}
        >
          {!isEmpty && (
            <div className="module-icon">
              <div className="module-glow"></div>
              <span className="module-symbol">
                {slotType === 'high' ? '⚡' : 
                 slotType === 'med' ? '🛡️' : 
                 slotType === 'low' ? '⚙️' : '🔧'}
              </span>
            </div>
          )}
          {isEmpty && (
            <div className="empty-slot-indicator">
              <span className="slot-number">{i + 1}</span>
            </div>
          )}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className="ship-fitting-panel glass-panel">
      <div className="panel-header">
        <h2 className="text-h1 panel-title">Ship Fitting</h2>
        <div className="ship-selector">
          <select className="input ship-dropdown">
            <option value="608">Vexor (Cruiser)</option>
            <option value="621">Rupture (Cruiser)</option>
            <option value="630">Stabber (Cruiser)</option>
          </select>
        </div>
        <div className="scan-line"></div>
      </div>

      <div className="panel-content">
        {/* 3D Ship Display Area */}
        <div className="ship-display-area">
          <div className={`holographic-ship ${scanAnimation ? 'scanning' : ''}`}>
            <div className="ship-wireframe">
              <div className="ship-hull">
                <div className="hull-outline"></div>
                <div className="hull-details"></div>
              </div>
              
              <div className="ship-grid">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="grid-line horizontal" style={{ top: `${i * 5}%` }}></div>
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="grid-line vertical" style={{ left: `${i * 5}%` }}></div>
                ))}
              </div>
              
              {scanAnimation && <div className="scan-beam"></div>}
            </div>
            
            <div className="ship-info">
              <h3 className="text-h2 ship-name">{currentShip?.name || 'No Ship Selected'}</h3>
              <p className="text-small ship-type">{currentShip?.type || 'Unknown Class'}</p>
            </div>
          </div>
        </div>

        {/* Fitting Slots Layout */}
        <div className="fitting-layout">
          {/* High Slots */}
          <div className="slot-group high-slots">
            <div className="slot-header">
              <span className="text-h3">High Power</span>
              <span className="slot-count text-small">{slotConfig.high} slots</span>
            </div>
            <div className="slots-container">
              {renderSlots('high', slotConfig.high)}
            </div>
          </div>

          {/* Med Slots */}
          <div className="slot-group med-slots">
            <div className="slot-header">
              <span className="text-h3">Medium Power</span>
              <span className="slot-count text-small">{slotConfig.med} slots</span>
            </div>
            <div className="slots-container">
              {renderSlots('med', slotConfig.med)}
            </div>
          </div>

          {/* Low Slots */}
          <div className="slot-group low-slots">
            <div className="slot-header">
              <span className="text-h3">Low Power</span>
              <span className="slot-count text-small">{slotConfig.low} slots</span>
            </div>
            <div className="slots-container">
              {renderSlots('low', slotConfig.low)}
            </div>
          </div>

          {/* Rig Slots */}
          <div className="slot-group rig-slots">
            <div className="slot-header">
              <span className="text-h3">Rigs</span>
              <span className="slot-count text-small">{slotConfig.rig} slots</span>
            </div>
            <div className="slots-container">
              {renderSlots('rig', slotConfig.rig)}
            </div>
          </div>
        </div>

        {/* Fitting Actions */}
        <div className="fitting-actions">
          <button className="btn btn-primary">
            Save Fitting
          </button>
          <button className="btn btn-secondary">
            Load Fitting
          </button>
          <button className="btn btn-ghost">
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipFittingPanel;