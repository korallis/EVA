import React, { useState, useEffect } from 'react';
import './ShipFitting.css';

interface Ship {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  categoryID: number;
  categoryName: string;
  raceID?: number;
  raceName?: string;
  description: string;
  mass: number;
  volume: number;
  capacity: number;
  published: boolean;
}

interface Module {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  metaLevel: number;
  techLevel: number;
}

interface FittingSlot {
  slotType: 'high' | 'mid' | 'low' | 'rig' | 'subsystem' | 'service';
  index: number;
  moduleTypeID?: number;
  moduleName?: string;
  online: boolean;
}

interface ShipStats {
  typeID: number;
  name: string;
  cpu: number;
  powergrid: number;
  capacitor: number;
  highSlots: number;
  midSlots: number;
  lowSlots: number;
  rigSlots: number;
  shieldHP: number;
  armorHP: number;
  hullHP: number;
  mass: number;
  maxVelocity: number;
}

interface FittingStats {
  dps: number;
  ehp: {
    total: number;
    shield: number;
    armor: number;
    hull: number;
  };
  cpu: {
    used: number;
    total: number;
    percentage: number;
  };
  powergrid: {
    used: number;
    total: number;
    percentage: number;
  };
  capacitor: {
    current: number;
    total: number;
    recharge: number;
  };
}

const ShipFitting: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [ships, setShips] = useState<Ship[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [shipStats, setShipStats] = useState<ShipStats | null>(null);
  const [fitting, setFitting] = useState<FittingSlot[]>([]);
  const [fittingStats, setFittingStats] = useState<FittingStats | null>(null);
  const [draggedModule, setDraggedModule] = useState<Module | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'hulls' | 'hardware'>('hulls');
  const [moduleTab, setModuleTab] = useState<'modules' | 'charges'>('modules');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [shipCategories, setShipCategories] = useState<string[]>([]);
  const [moduleCategories, setModuleCategories] = useState<string[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<string>('All');
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);

  useEffect(() => {
    initializeFitting();
  }, []);

  useEffect(() => {
    if (selectedShip) {
      loadShipStatsAndInitialize();
    }
  }, [selectedShip]);

  const initializeFitting = async () => {
    setLoading(true);
    try {
      console.log('Initializing SDE service...');
      await window.electronAPI.sde.initialize();
      console.log('SDE service initialized, fetching data...');
      
      const [shipsData, modulesData] = await Promise.all([
        window.electronAPI.sde.getShips(),
        window.electronAPI.sde.getModules()
      ]);
      
      console.log('Loaded ships:', shipsData.length);
      console.log('Sample ships:', shipsData.slice(0, 5));
      
      if (!shipsData || shipsData.length === 0) {
        console.warn('No ships data received!');
        return;
      }
      
      if (!modulesData || modulesData.length === 0) {
        console.warn('No modules data received!');
      }
      
      setShips(shipsData);
      setModules(modulesData);
      
      // Dynamically generate ship categories from actual data
      const uniqueShipCategories = [...new Set(shipsData.map(ship => ship.groupName))]
        .filter(category => category && category.trim()) // Remove any null/undefined/empty
        .sort(); // Sort alphabetically
      
      console.log('Available ship categories:', uniqueShipCategories);
      setShipCategories(uniqueShipCategories);
      
      // Generate faction list with improved mapping
      const factionMap = new Map<string, string>();
      
      shipsData.forEach(ship => {
        if (ship.raceName && ship.raceName.trim() && ship.raceName !== 'Unknown') {
          factionMap.set(ship.raceName, ship.raceName);
        }
        
        // Add special handling for pirate factions based on ship names or groups
        const shipName = ship.typeName.toLowerCase();
        const groupName = ship.groupName?.toLowerCase() || '';
        
        if (shipName.includes('angel') || groupName.includes('angel')) {
          factionMap.set('Angel Cartel', 'Angel Cartel');
        } else if (shipName.includes('blood') || groupName.includes('blood')) {
          factionMap.set('Blood Raiders', 'Blood Raiders');
        } else if (shipName.includes('guristas') || groupName.includes('guristas')) {
          factionMap.set('Guristas Pirates', 'Guristas Pirates');
        } else if (shipName.includes('sansha') || groupName.includes('sansha')) {
          factionMap.set("Sansha's Nation", "Sansha's Nation");
        } else if (shipName.includes('serpentis') || groupName.includes('serpentis')) {
          factionMap.set('Serpentis Corporation', 'Serpentis Corporation');
        } else if (shipName.includes('mordu') || groupName.includes('mordu')) {
          factionMap.set("Mordu's Legion", "Mordu's Legion");
        } else if (shipName.includes('society') || groupName.includes('society')) {
          factionMap.set('Society of Conscious Thought', 'Society of Conscious Thought');
        } else if (shipName.includes('concord') || groupName.includes('concord')) {
          factionMap.set('CONCORD', 'CONCORD');
        } else if (shipName.includes('jove') || groupName.includes('jove')) {
          factionMap.set('Jove Empire', 'Jove Empire');
        } else if (shipName.includes('triglavian') || groupName.includes('triglavian')) {
          factionMap.set('Triglavian Collective', 'Triglavian Collective');
        } else if (shipName.includes('edencom') || groupName.includes('edencom')) {
          factionMap.set('EDENCOM', 'EDENCOM');
        }
      });
      
      const factions = ['All', ...Array.from(factionMap.values()).sort()];
      setAvailableFactions(factions);
      console.log('Available factions:', factions);
      
      // Dynamically generate module categories from actual data
      const uniqueModuleCategories = [...new Set(modulesData.map(module => module.groupName))]
        .filter(category => category && category.trim()) // Remove any null/undefined/empty
        .sort(); // Sort alphabetically
      
      console.log('Available module categories:', uniqueModuleCategories);
      setModuleCategories(uniqueModuleCategories);
    } catch (error: any) {
      console.error('Failed to initialize fitting:', error);
      console.error('Error details:', error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  const loadShipStatsAndInitialize = async () => {
    if (!selectedShip) return;
    
    try {
      const attributes = await window.electronAPI.sde.getTypeAttributes(selectedShip.typeID);
      
      // Convert attributes array to a more usable stats object
      const stats: ShipStats = {
        typeID: selectedShip.typeID,
        name: selectedShip.typeName,
        cpu: getAttributeValue(attributes, 48) || 0, // CPU output
        powergrid: getAttributeValue(attributes, 11) || 0, // Power output  
        capacitor: getAttributeValue(attributes, 482) || 0, // Capacitor capacity
        highSlots: getAttributeValue(attributes, 14) || 0, // High power slots
        midSlots: getAttributeValue(attributes, 13) || 0, // Medium power slots
        lowSlots: getAttributeValue(attributes, 12) || 0, // Low power slots
        rigSlots: getAttributeValue(attributes, 1137) || 0, // Rig slots
        shieldHP: getAttributeValue(attributes, 263) || 0, // Shield capacity
        armorHP: getAttributeValue(attributes, 265) || 0, // Armor hit points
        hullHP: getAttributeValue(attributes, 9) || 0, // Structure hit points
        mass: getAttributeValue(attributes, 4) || 0, // Mass
        maxVelocity: getAttributeValue(attributes, 37) || 0 // Max velocity
      };
      
      setShipStats(stats);
      
      const slots: FittingSlot[] = [];
      for (let i = 0; i < stats.highSlots; i++) {
        slots.push({ slotType: 'high', index: i, online: true });
      }
      for (let i = 0; i < stats.midSlots; i++) {
        slots.push({ slotType: 'mid', index: i, online: true });
      }
      for (let i = 0; i < stats.lowSlots; i++) {
        slots.push({ slotType: 'low', index: i, online: true });
      }
      for (let i = 0; i < stats.rigSlots; i++) {
        slots.push({ slotType: 'rig', index: i, online: true });
      }
      setFitting(slots);
      calculateFittingStats();
    } catch (error) {
      console.error('Failed to load ship stats:', error);
    }
  };

  // Helper function to get attribute value by attributeID
  const getAttributeValue = (attributes: any[], attributeID: number): number => {
    const attr = attributes.find(a => a.attributeID === attributeID);
    return attr ? (attr.valueFloat || attr.valueInt || 0) : 0;
  };

  const calculateFittingStats = async () => {
    // Implementation for stats calculation
    if (!selectedShip || !shipStats) return;
    
    const stats: FittingStats = {
      dps: 0,
      ehp: { total: 0, shield: 0, armor: 0, hull: 0 },
      cpu: { used: 0, total: shipStats.cpu, percentage: 0 },
      powergrid: { used: 0, total: shipStats.powergrid, percentage: 0 },
      capacitor: { current: 0, total: shipStats.capacitor, recharge: 0 }
    };
    
    setFittingStats(stats);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getShipsByCategory = (category: string) => {
    console.log('Getting ships for category:', category, 'with faction filter:', selectedFaction);
    
    if (!ships || ships.length === 0) {
      console.warn('No ships available to filter');
      return [];
    }
    
    let categoryShips = ships.filter(ship => {
      const hasGroupName = ship.groupName && ship.groupName.trim();
      return hasGroupName && ship.groupName === category;
    });
    
    // Apply faction filter
    if (selectedFaction !== 'All') {
      categoryShips = categoryShips.filter(ship => {
        // First check the ship's raceName
        if (ship.raceName === selectedFaction) {
          return true;
        }
        
        // Then check for pirate factions based on ship name patterns
        const shipName = ship.typeName.toLowerCase();
        const groupName = ship.groupName?.toLowerCase() || '';
        
        switch (selectedFaction) {
          case 'Angel Cartel':
            return shipName.includes('angel') || groupName.includes('angel');
          case 'Blood Raiders':
            return shipName.includes('blood') || groupName.includes('blood');
          case 'Guristas Pirates':
            return shipName.includes('guristas') || groupName.includes('guristas');
          case "Sansha's Nation":
            return shipName.includes('sansha') || groupName.includes('sansha');
          case 'Serpentis Corporation':
            return shipName.includes('serpentis') || groupName.includes('serpentis');
          case "Mordu's Legion":
            return shipName.includes('mordu') || groupName.includes('mordu');
          case 'Society of Conscious Thought':
            return shipName.includes('society') || groupName.includes('society');
          case 'CONCORD':
            return shipName.includes('concord') || groupName.includes('concord');
          case 'Jove Empire':
            return shipName.includes('jove') || groupName.includes('jove');
          case 'Triglavian Collective':
            return shipName.includes('triglavian') || groupName.includes('triglavian');
          case 'EDENCOM':
            return shipName.includes('edencom') || groupName.includes('edencom');
          default:
            return false;
        }
      });
    }
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      categoryShips = categoryShips.filter(ship => 
        ship.typeName.toLowerCase().includes(searchLower)
      );
    }
    
    console.log(`Found ${categoryShips.length} ships for category ${category} with filters`);
    return categoryShips;
  };

  const getShipsByRace = (ships: Ship[], race: string) => {
    console.log('Getting ships for race:', race, 'from', ships.length, 'ships');
    
    // Debug: let's see what race-related fields exist
    if (ships.length > 0) {
      console.log('Sample ship data:', ships[0]);
    }
    
    // Let's simplify for now - just return all ships if any race is selected
    // This will help us test if the ship list rendering works at all
    return ships;
  };

  const getModulesByCategory = (category: string) => {
    return modules.filter(module => module.groupName === category);
  };

  const renderSlot = (slotType: string, index: number, angle: number) => {
    const slot = fitting.find(s => s.slotType === slotType && s.index === index);
    if (!slot) return null;

    const radius = slotType === 'rig' ? 140 : slotType === 'high' ? 120 : slotType === 'mid' ? 110 : 100;
    const x = 250 + radius * Math.cos(angle * Math.PI / 180);
    const y = 250 + radius * Math.sin(angle * Math.PI / 180);

    return (
      <div
        key={`${slotType}-${index}`}
        className={`fitting-slot ${slotType}-slot ${slot.moduleTypeID ? 'fitted' : 'empty'}`}
        style={{
          position: 'absolute',
          left: x - 15,
          top: y - 15,
          width: 30,
          height: 30
        }}
        title={slot.moduleTypeID ? slot.moduleName : `Empty ${slotType} slot`}
      >
        {slot.moduleTypeID ? (
          <div className="slot-filled"></div>
        ) : (
          <div className="slot-empty"></div>
        )}
      </div>
    );
  };

  const renderFittingArea = () => {
    if (!selectedShip || !shipStats) {
      return (
        <div className="fitting-placeholder">
          <div className="placeholder-text">To start, select a hull on the left.</div>
        </div>
      );
    }

    const highSlots = fitting.filter(slot => slot.slotType === 'high');
    const midSlots = fitting.filter(slot => slot.slotType === 'mid');
    const lowSlots = fitting.filter(slot => slot.slotType === 'low');
    const rigSlots = fitting.filter(slot => slot.slotType === 'rig');

    return (
      <div className="fitting-area">
        <svg className="fitting-circle" viewBox="0 0 500 500">
          {/* Outer ring with tick marks (exactly like eveship.fit) */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = i * 5;
            const isLargeTick = i % 6 === 0;
            const radius1 = isLargeTick ? 240 : 245;
            const radius2 = 250;
            const x1 = 250 + radius1 * Math.cos(angle * Math.PI / 180);
            const y1 = 250 + radius1 * Math.sin(angle * Math.PI / 180);
            const x2 = 250 + radius2 * Math.cos(angle * Math.PI / 180);
            const y2 = 250 + radius2 * Math.sin(angle * Math.PI / 180);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#444"
                strokeWidth={isLargeTick ? 2 : 1}
              />
            );
          })}
          
          {/* Inner circles */}
          <circle cx="250" cy="250" r="180" fill="none" stroke="#333" strokeWidth="1" opacity="0.5" />
          <circle cx="250" cy="250" r="120" fill="none" stroke="#333" strokeWidth="1" opacity="0.3" />
          <circle cx="250" cy="250" r="60" fill="none" stroke="#333" strokeWidth="1" opacity="0.2" />
        </svg>

        {/* High slots - top arc */}
        {highSlots.map((slot, index) => {
          const totalSlots = highSlots.length;
          const angle = -90 + (index - (totalSlots - 1) / 2) * (60 / Math.max(totalSlots - 1, 1));
          return renderSlot('high', slot.index, angle);
        })}

        {/* Mid slots - right side */}
        {midSlots.map((slot, index) => {
          const totalSlots = midSlots.length;
          const angle = -30 + (index * 60 / Math.max(totalSlots - 1, 1));
          return renderSlot('mid', slot.index, angle);
        })}

        {/* Low slots - bottom arc */}
        {lowSlots.map((slot, index) => {
          const totalSlots = lowSlots.length;
          const angle = 90 + (index - (totalSlots - 1) / 2) * (60 / Math.max(totalSlots - 1, 1));
          return renderSlot('low', slot.index, angle);
        })}

        {/* Rig slots - outer positions */}
        {rigSlots.map((slot, index) => {
          const angle = 180 + (index * 120 / Math.max(rigSlots.length - 1, 1));
          return renderSlot('rig', slot.index, angle);
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ship-fitting">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading ship fitting system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ship-fitting">
      {/* Left Sidebar - Hull & Fits / Hardware */}
      <div className="left-sidebar">
        <div className="sidebar-tabs">
          <button 
            className={`tab ${activeTab === 'hulls' ? 'active' : ''}`}
            onClick={() => setActiveTab('hulls')}
          >
            Hull & Fits
          </button>
          <button 
            className={`tab ${activeTab === 'hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('hardware')}
          >
            Hardware
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search ships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {activeTab === 'hulls' && (
          <div className="faction-filter">
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="faction-select"
            >
              {availableFactions.map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))}
            </select>
          </div>
        )}

        <div className="sidebar-controls">
          <button className="control-btn">📋</button>
          <button className="control-btn">👤</button>
          <button className="control-btn">⬇</button>
          <button className="control-btn">⭐</button>
          <button className="control-btn">📊</button>
        </div>

        <div className="category-tree">
          {activeTab === 'hulls' ? (
            shipCategories.map(category => {
              const categoryShips = getShipsByCategory(category);
              const isExpanded = expandedCategories.has(category);
              
              // Only show categories that have ships after filtering
              if (categoryShips.length === 0) return null;
              
              return (
                <div key={category} className="category-item">
                  <div 
                    className="category-header"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="category-name">{category} ({categoryShips.length})</span>
                  </div>
                  
                  {isExpanded && (
                    <div className="category-content">
                      <div className="ship-list">
                        {categoryShips.map(ship => (
                          <div
                            key={ship.typeID}
                            className={`ship-item ${selectedShip?.typeID === ship.typeID ? 'selected' : ''}`}
                            onClick={() => setSelectedShip(ship)}
                          >
                            <span className="ship-name">{ship.typeName}</span>
                            <span className="ship-faction">{ship.raceName || 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="hardware-tab">
              <div className="hardware-subtabs">
                <button 
                  className={`subtab ${moduleTab === 'modules' ? 'active' : ''}`}
                  onClick={() => setModuleTab('modules')}
                >
                  Modules
                </button>
                <button 
                  className={`subtab ${moduleTab === 'charges' ? 'active' : ''}`}
                  onClick={() => setModuleTab('charges')}
                >
                  Charges
                </button>
              </div>
              
              {moduleCategories.map(category => {
                const categoryModules = getModulesByCategory(category);
                if (categoryModules.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="category-item">
                    <div 
                      className="category-header"
                      onClick={() => toggleCategory(category)}
                    >
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <span className="category-icon">🔧</span>
                      <span className="category-name">{category}</span>
                    </div>
                    
                    {isExpanded && (
                      <div className="module-list">
                        {categoryModules.slice(0, 20).map(module => (
                          <div
                            key={module.typeID}
                            className="module-item"
                            draggable
                            onDragStart={(e) => setDraggedModule(module)}
                          >
                            <span className="module-name">{module.typeName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center Area - Ship Fitting */}
      <div className="center-area">
        <div className="fitting-header">
          <span className="fitting-name">Name</span>
        </div>
        
        {renderFittingArea()}
        
        {/* Bottom stats */}
        <div className="bottom-stats">
          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <span className="stat-value">0.0</span>
            <span className="stat-unit">/ 0.0 m3</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⚙️</span>
            <span className="stat-value">0.0</span>
            <span className="stat-unit">/ 0.0 m3</span>
          </div>
        </div>
        
        <div className="simulation-history">
          <span>Simulation History</span>
          <div className="history-controls">
            <button>◀</button>
            <button>▶</button>
          </div>
        </div>

        {/* Action Bar integrated into center area */}
        <div className="action-bar">
          <button className="action-btn">Save</button>
          <button className="action-btn">Clipboard</button>
          <button className="action-btn">Share Link</button>
          <button className="action-btn">Rename</button>
        </div>
      </div>

      {/* Right Sidebar - Stats */}
      <div className="right-sidebar">
        <div className="character-info">
          <span>Default character - All Skills V</span>
        </div>
        
        <div className="stats-sections">
          <div className="stats-section">
            <h4>Capacitor</h4>
            <div className="stat-line">
              <span>0.0 GJ / 0.00 s</span>
            </div>
            <div className="stat-line">
              <span>Δ 0.0 GJ/s (0.0%)</span>
            </div>
          </div>
          
          <div className="stats-section">
            <h4>Offense</h4>
            <div className="stat-line">
              <span>🚀 0.0 dps (0.0 dps)</span>
            </div>
          </div>
          
          <div className="stats-section">
            <h4>Defense</h4>
            <div className="stat-line">
              <span>🛡️ No Module</span>
              <span className="percentage">100 %</span>
            </div>
            <div className="stat-line">
              <span>🛡️ 0 hp</span>
              <span className="percentage">100 %</span>
            </div>
            <div className="stat-line">
              <span>🛡️ 0 hp</span>
              <span className="percentage">100 %</span>
            </div>
          </div>
          
          <div className="stats-section">
            <h4>Targeting</h4>
            <div className="stat-line">
              <span>🎯 0.00 points</span>
            </div>
            <div className="stat-line">
              <span>🎯 0 m</span>
            </div>
          </div>
          
          <div className="stats-section">
            <h4>Navigation</h4>
            <div className="stat-line">
              <span>⚖️ 0.00 t</span>
            </div>
            <div className="stat-line">
              <span>➡️ 0.00 AU/s</span>
            </div>
          </div>
          
          <div className="stats-section">
            <h4>Drones</h4>
            <div className="stat-line">
              <span>🤖 0/0 Mbit/sec</span>
            </div>
            <div className="stat-line">
              <span>0 Active</span>
            </div>
          </div>
        </div>
        
        <div className="fitting-resources">
          <div className="resource-item">
            <span className="resource-label">CPU</span>
            <span className="resource-value">0.0/0.0</span>
          </div>
          <div className="resource-item">
            <span className="resource-label">Power Grid</span>
            <span className="resource-value">0.0/0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipFitting;