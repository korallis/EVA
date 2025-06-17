import React, { useState, useEffect } from 'react';

interface ModuleType {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  categoryID: number;
  categoryName: string;
  description: string;
  mass: number;
  volume: number;
  published: boolean;
  metaLevel: number;
  techLevel: number;
}

const ModuleBrowser: React.FC = () => {
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedMetaLevel, setSelectedMetaLevel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('typeName');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const moduleData = await window.electronAPI.sde.getModules();
      console.log('Loaded modules:', moduleData.length);
      
      setModules(moduleData);
    } catch (err) {
      console.error('Failed to load modules:', err);
      setError('Failed to load module data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories, groups, and meta levels for filtering
  const uniqueCategories = ['All', ...new Set(modules.map(module => module.categoryName).filter(Boolean))];
  const uniqueGroups = ['All', ...new Set(modules.map(module => module.groupName).filter(Boolean))];
  const uniqueMetaLevels = ['All', ...new Set(modules.map(module => module.metaLevel).filter(Boolean))].sort();

  // Filter and sort modules
  const filteredModules = modules
    .filter(module => {
      const matchesSearch = module.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           module.groupName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || module.categoryName === selectedCategory;
      const matchesGroup = selectedGroup === 'All' || module.groupName === selectedGroup;
      const matchesMetaLevel = selectedMetaLevel === 'All' || module.metaLevel.toString() === selectedMetaLevel;
      
      return matchesSearch && matchesCategory && matchesGroup && matchesMetaLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'typeName') return a.typeName.localeCompare(b.typeName);
      if (sortBy === 'groupName') return a.groupName.localeCompare(b.groupName);
      if (sortBy === 'categoryName') return a.categoryName.localeCompare(b.categoryName);
      if (sortBy === 'metaLevel') return a.metaLevel - b.metaLevel;
      if (sortBy === 'techLevel') return a.techLevel - b.techLevel;
      if (sortBy === 'mass') return a.mass - b.mass;
      if (sortBy === 'volume') return a.volume - b.volume;
      return 0;
    });

  const getMetaLevelColor = (metaLevel: number): string => {
    switch (metaLevel) {
      case 0: return '#8C8C8C'; // T1 - Gray
      case 1: return '#1EFF00'; // Meta 1 - Green  
      case 2: return '#0099FF'; // Meta 2 - Blue
      case 3: return '#9966FF'; // Meta 3 - Purple
      case 4: return '#FF6600'; // Meta 4 - Orange
      case 5: return '#FFD700'; // T2 - Gold
      default: return '#FF0080'; // Special - Pink
    }
  };

  const getMetaLevelText = (metaLevel: number): string => {
    switch (metaLevel) {
      case 0: return 'T1';
      case 1: return 'Meta 1';
      case 2: return 'Meta 2';
      case 3: return 'Meta 3';
      case 4: return 'Meta 4';
      case 5: return 'T2';
      default: return `Meta ${metaLevel}`;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Module Browser</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading module database...
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
          <h1 className="text-hero">Module Browser</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={loadModules}>
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
          <h1 className="text-hero">Module Browser</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Explore {modules.length} modules, weapons, and equipment
          </p>

          {/* Search and Filter Controls */}
          <div className="browser-controls" style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', 
            gap: 'var(--space-md)', 
            marginBottom: 'var(--space-lg)',
            alignItems: 'center'
          }}>
            <div>
              <input
                type="text"
                placeholder="Search modules..."
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: 'var(--space-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {uniqueCategories.map(category => (
                <option key={category} value={category} style={{ backgroundColor: '#1a1a1a' }}>
                  {category}
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
              value={selectedMetaLevel}
              onChange={(e) => setSelectedMetaLevel(e.target.value)}
              style={{
                padding: 'var(--space-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {uniqueMetaLevels.map(level => (
                <option key={level} value={level} style={{ backgroundColor: '#1a1a1a' }}>
                  {level === 'All' ? 'All Meta' : getMetaLevelText(Number(level))}
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
              <option value="groupName" style={{ backgroundColor: '#1a1a1a' }}>Sort by Group</option>
              <option value="categoryName" style={{ backgroundColor: '#1a1a1a' }}>Sort by Category</option>
              <option value="metaLevel" style={{ backgroundColor: '#1a1a1a' }}>Sort by Meta Level</option>
              <option value="techLevel" style={{ backgroundColor: '#1a1a1a' }}>Sort by Tech Level</option>
              <option value="mass" style={{ backgroundColor: '#1a1a1a' }}>Sort by Mass</option>
              <option value="volume" style={{ backgroundColor: '#1a1a1a' }}>Sort by Volume</option>
            </select>
          </div>

          <div className="results-info" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="text-small" style={{ opacity: 0.7 }}>
              Showing {filteredModules.length} of {modules.length} modules
            </p>
          </div>
        </div>

        {/* Module Grid */}
        <div className="module-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-md)',
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: 'var(--space-sm)'
        }}>
          {filteredModules.map(module => (
            <div
              key={module.typeID}
              className="module-card"
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
              <div className="module-header" style={{ marginBottom: 'var(--space-sm)' }}>
                <h3 className="text-h3" style={{ 
                  margin: 0, 
                  marginBottom: 'var(--space-xs)',
                  color: 'var(--primary-cyan)',
                  fontSize: '16px',
                  lineHeight: '1.2'
                }}>
                  {module.typeName}
                </h3>
                <div className="module-meta" style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                  <span className="text-small" style={{ 
                    backgroundColor: 'rgba(255, 122, 34, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    {module.groupName}
                  </span>
                  <span className="text-small" style={{ 
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    {module.categoryName}
                  </span>
                  <span className="text-small" style={{ 
                    backgroundColor: getMetaLevelColor(module.metaLevel) + '40',
                    color: getMetaLevelColor(module.metaLevel),
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {getMetaLevelText(module.metaLevel)}
                  </span>
                </div>
              </div>

              <div className="module-stats" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 'var(--space-xs)',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ opacity: 0.7 }}>Mass:</span>
                  <span style={{ float: 'right' }}>{module.mass.toLocaleString()} kg</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Volume:</span>
                  <span style={{ float: 'right' }}>{module.volume.toLocaleString()} m³</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Tech Level:</span>
                  <span style={{ float: 'right' }}>T{module.techLevel}</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Type ID:</span>
                  <span style={{ float: 'right' }}>{module.typeID}</span>
                </div>
              </div>

              {module.description && (
                <div className="module-description" style={{ 
                  marginTop: 'var(--space-sm)',
                  padding: 'var(--space-xs)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  opacity: 0.8,
                  maxHeight: '40px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {module.description.length > 100 
                    ? module.description.substring(0, 100) + '...'
                    : module.description
                  }
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <p className="text-body" style={{ opacity: 0.7 }}>
              No modules found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleBrowser;