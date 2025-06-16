import React, { useState } from 'react';
import './ShipFittingPanel.css';

interface Module {
  id: string;
  name: string;
  type: 'high' | 'medium' | 'low';
  icon?: string;
  meta?: number;
}

const ShipFittingPanel: React.FC = () => {
  const [selectedShip, setSelectedShip] = useState('Vexor');
  const [modules, setModules] = useState<Module[]>([
    { id: '1', name: 'Heavy Missile Launcher II', type: 'high', meta: 5 },
    { id: '2', name: 'Heavy Missile Launcher II', type: 'high', meta: 5 },
    { id: '3', name: 'Heavy Missile Launcher II', type: 'high', meta: 5 },
    { id: '4', name: 'Large Shield Extender II', type: 'medium', meta: 5 },
    { id: '5', name: '10MN Microwarpdrive II', type: 'medium', meta: 5 },
    { id: '6', name: 'Adaptive Invulnerability Field II', type: 'medium', meta: 5 },
    { id: '7', name: 'Damage Control II', type: 'low', meta: 5 },
    { id: '8', name: 'Ballistic Control System II', type: 'low', meta: 5 },
    { id: '9', name: 'Shield Power Relay II', type: 'low', meta: 5 },
  ]);

  const highSlots = modules.filter(m => m.type === 'high');
  const mediumSlots = modules.filter(m => m.type === 'medium');
  const lowSlots = modules.filter(m => m.type === 'low');

  return (
    <div className="ship-fitting-panel glass-panel">
      <div className="panel-header">
        <h2 className="panel-title">SHIP FITTING</h2>
      </div>

      <div className="panel-content">
        {/* Ship Model Area */}
        <div className="ship-model-container">
          <div className="ship-name">{selectedShip}</div>
          <div className="ship-model">
            <div className="ship-hologram">
              <div className="ship-wireframe">
                {/* Placeholder for 3D ship model */}
                <div className="ship-placeholder">
                  <span className="ship-icon">🚀</span>
                </div>
              </div>
              <div className="scanning-line"></div>
            </div>
          </div>
        </div>

        {/* Module Slots */}
        <div className="module-slots">
          {/* High Slots */}
          <div className="slot-group">
            <h3 className="slot-group-title">High Slots</h3>
            <div className="slots-list">
              {highSlots.map((module, index) => (
                <div key={module.id} className="module-item">
                  <div className="module-icon">⚡</div>
                  <div className="module-info">
                    <span className="module-name">{module.name}</span>
                    <span className="module-count">{highSlots.filter(m => m.name === module.name).length}x</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - highSlots.length }).map((_, i) => (
                <div key={`empty-high-${i}`} className="module-item empty">
                  <div className="module-icon">○</div>
                  <div className="module-info">
                    <span className="module-name">Empty Slot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medium Slots */}
          <div className="slot-group">
            <h3 className="slot-group-title">Medium Slots</h3>
            <div className="slots-list">
              {mediumSlots.map((module, index) => (
                <div key={module.id} className="module-item">
                  <div className="module-icon">🛡️</div>
                  <div className="module-info">
                    <span className="module-name">{module.name}</span>
                    <span className="module-count">1x</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: 1 - mediumSlots.length }).map((_, i) => (
                <div key={`empty-med-${i}`} className="module-item empty">
                  <div className="module-icon">○</div>
                  <div className="module-info">
                    <span className="module-name">Empty Slot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Slots */}
          <div className="slot-group">
            <h3 className="slot-group-title">Low Slots</h3>
            <div className="slots-list">
              {lowSlots.map((module, index) => (
                <div key={module.id} className="module-item">
                  <div className="module-icon">⚙️</div>
                  <div className="module-info">
                    <span className="module-name">{module.name}</span>
                    <span className="module-count">
                      {module.name.includes('Shield Power Relay') ? '3x' : 
                       module.name.includes('Ballistic Control') ? '2x' : '1x'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipFittingPanel;