import React, { useState, useEffect } from 'react';

interface ShipType {
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

const ShipBrowser: React.FC = () => {
  const [ships, setShips] = useState<ShipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRace, setSelectedRace] = useState<string>('All');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('typeName');

  useEffect(() => {
    loadShips();
  }, []);

  const loadShips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const shipData = await window.electronAPI.sde.getShips();
      console.log('Loaded ships:', shipData.length);
      
      setShips(shipData);
    } catch (err) {
      console.error('Failed to load ships:', err);
      setError('Failed to load ship data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique races and groups for filtering
  const uniqueRaces = ['All', ...new Set(ships.map(ship => ship.raceName).filter(Boolean))];
  const uniqueGroups = ['All', ...new Set(ships.map(ship => ship.groupName).filter(Boolean))];

  // Filter and sort ships
  const filteredShips = ships
    .filter(ship => {
      const matchesSearch = ship.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ship.groupName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRace = selectedRace === 'All' || ship.raceName === selectedRace;
      const matchesGroup = selectedGroup === 'All' || ship.groupName === selectedGroup;
      
      return matchesSearch && matchesRace && matchesGroup;
    })
    .sort((a, b) => {
      if (sortBy === 'typeName') return a.typeName.localeCompare(b.typeName);
      if (sortBy === 'groupName') return a.groupName.localeCompare(b.groupName);
      if (sortBy === 'raceName') return (a.raceName || '').localeCompare(b.raceName || '');
      if (sortBy === 'mass') return a.mass - b.mass;
      if (sortBy === 'volume') return a.volume - b.volume;
      if (sortBy === 'capacity') return a.capacity - b.capacity;
      return 0;
    });

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Ship Browser</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading ship database...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Ship Browser</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={loadShips}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
        <div className="browser-header">
          <h1 className="text-hero">Ship Browser</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Browse {ships.length} ships from across New Eden
          </p>

          {/* Search and Filter Controls */}
          <div className="browser-controls" style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 1fr', 
            gap: 'var(--space-md)', 
            marginBottom: 'var(--space-lg)',
            alignItems: 'center'
          }}>
            <div>
              <input
                type="text"
                placeholder="Search ships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <select
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              style={{
                padding: 'var(--space-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {uniqueRaces.map(race => (
                <option key={race} value={race} style={{ backgroundColor: '#1a1a1a' }}>
                  {race}
                </option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              style={{
                padding: 'var(--space-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {uniqueGroups.map(group => (
                <option key={group} value={group} style={{ backgroundColor: '#1a1a1a' }}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: 'var(--space-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <option value="typeName" style={{ backgroundColor: '#1a1a1a' }}>Sort by Name</option>
              <option value="groupName" style={{ backgroundColor: '#1a1a1a' }}>Sort by Class</option>
              <option value="raceName" style={{ backgroundColor: '#1a1a1a' }}>Sort by Race</option>
              <option value="mass" style={{ backgroundColor: '#1a1a1a' }}>Sort by Mass</option>
              <option value="volume" style={{ backgroundColor: '#1a1a1a' }}>Sort by Volume</option>
              <option value="capacity" style={{ backgroundColor: '#1a1a1a' }}>Sort by Capacity</option>
            </select>
          </div>

          <div className="results-info" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="text-small" style={{ opacity: 0.7 }}>
              Showing {filteredShips.length} of {ships.length} ships
            </p>
          </div>
        </div>

        {/* Ship Grid */}
        <div className="ship-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-md)',
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: 'var(--space-sm)'
        }}>
          {filteredShips.map(ship => (
            <div
              key={ship.typeID}
              className="ship-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: 'var(--space-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'var(--primary-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div className="ship-header" style={{ marginBottom: 'var(--space-sm)' }}>
                <h3 className="text-h3" style={{ 
                  margin: 0, 
                  marginBottom: 'var(--space-xs)',
                  color: 'var(--primary-cyan)'
                }}>
                  {ship.typeName}
                </h3>
                <div className="ship-meta" style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  <span className="text-small" style={{ 
                    backgroundColor: 'rgba(255, 122, 34, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {ship.groupName}
                  </span>
                  {ship.raceName && (
                    <span className="text-small" style={{ 
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      {ship.raceName}
                    </span>
                  )}
                </div>
              </div>

              <div className="ship-stats" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 'var(--space-xs)',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ opacity: 0.7 }}>Mass:</span>
                  <span style={{ float: 'right' }}>{(ship.mass / 1000000).toFixed(1)}M kg</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Volume:</span>
                  <span style={{ float: 'right' }}>{ship.volume.toLocaleString()} m³</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Capacity:</span>
                  <span style={{ float: 'right' }}>{ship.capacity.toLocaleString()} m³</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Type ID:</span>
                  <span style={{ float: 'right' }}>{ship.typeID}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredShips.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <p className="text-body" style={{ opacity: 0.7 }}>
              No ships found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipBrowser;