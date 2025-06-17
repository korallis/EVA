import React, { useState, useEffect, useContext } from 'react';
import { CharacterContext } from '../App';

interface PopularFitting {
  id: string;
  shipName: string;
  shipTypeId: number;
  fittingName: string;
  variationType: 'max_dps' | 'max_tank' | 'speed_tank' | 'balanced' | 'budget';
  activity: string;
  estimatedDPS: number;
  effectiveHP: number;
  estimatedCost: number;
  skillRequirements: string[];
  description: string;
  tags: string[];
}

interface ActivityCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fittings: PopularFitting[];
}

const FittingRecommendations: React.FC = () => {
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [selectedCategory, setSelectedCategory] = useState<string>('mission_running');
  const [selectedVariation, setSelectedVariation] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activityCategories, setActivityCategories] = useState<ActivityCategory[]>([]);

  useEffect(() => {
    loadPopularFittings();
  }, []);

  const loadPopularFittings = async () => {
    try {
      setLoading(true);
      
      // Mock popular fittings data - in production this would come from the recommendation service
      const categories: ActivityCategory[] = [
        {
          id: 'mission_running',
          name: 'Mission Running',
          description: 'Optimal PvE mission fits for L1-L4 missions',
          icon: '🎯',
          color: 'var(--primary-cyan)',
          fittings: [
            {
              id: 'raven_navy_l4_missiles',
              shipName: 'Raven Navy Issue',
              shipTypeId: 17738,
              fittingName: 'L4 Mission Missile Fit',
              variationType: 'balanced',
              activity: 'Level 4 Missions',
              estimatedDPS: 847,
              effectiveHP: 89000,
              estimatedCost: 350000000,
              skillRequirements: ['Heavy Missiles V', 'Shield Operation IV', 'Navigation III'],
              description: 'Balanced fit for L4 missions with excellent damage projection and tank',
              tags: ['Popular', 'Beginner Friendly', 'Cost Effective']
            },
            {
              id: 'dominix_navy_l4_drones',
              shipName: 'Dominix Navy Issue',
              shipTypeId: 17715,
              fittingName: 'L4 Mission Drone Boat',
              variationType: 'max_dps',
              activity: 'Level 4 Missions',
              estimatedDPS: 923,
              effectiveHP: 76000,
              estimatedCost: 280000000,
              skillRequirements: ['Heavy Drone Operation V', 'Armor Tanking IV', 'Drone Interfacing IV'],
              description: 'High DPS drone boat for experienced pilots',
              tags: ['High DPS', 'Drone Specialist']
            },
            {
              id: 'caracal_navy_l3_missiles',
              shipName: 'Caracal Navy Issue',
              shipTypeId: 17841,
              fittingName: 'L3 Mission Speed Fit',
              variationType: 'speed_tank',
              activity: 'Level 3 Missions',
              estimatedDPS: 456,
              effectiveHP: 34000,
              estimatedCost: 85000000,
              skillRequirements: ['Medium Missiles IV', 'Shield Operation III', 'Navigation IV'],
              description: 'Fast mission runner for quick L3 completion',
              tags: ['Speed Tank', 'Budget Friendly', 'ISK Efficient']
            }
          ]
        },
        {
          id: 'pvp_combat',
          name: 'PvP Combat',
          description: 'Proven combat fits for different PvP scenarios',
          icon: '⚔️',
          color: 'var(--danger-red)',
          fittings: [
            {
              id: 'ishtar_hac_pvp',
              shipName: 'Ishtar',
              shipTypeId: 17920,
              fittingName: 'Heavy Assault Cruiser PvP',
              variationType: 'balanced',
              activity: 'Fleet PvP',
              estimatedDPS: 634,
              effectiveHP: 67000,
              estimatedCost: 420000000,
              skillRequirements: ['Heavy Assault Cruisers V', 'Drone Interfacing V', 'Armor Tanking V'],
              description: 'Versatile HAC for fleet engagements and small gang PvP',
              tags: ['Fleet Doctrine', 'Versatile', 'Meta']
            },
            {
              id: 'rifter_frigate_pvp',
              shipName: 'Rifter',
              shipTypeId: 587,
              fittingName: 'Solo PvP Brawler',
              variationType: 'max_dps',
              activity: 'Solo PvP',
              estimatedDPS: 187,
              effectiveHP: 3200,
              estimatedCost: 15000000,
              skillRequirements: ['Small Projectile Turret IV', 'Armor Tanking III', 'Navigation IV'],
              description: 'Classic close-range brawler for learning PvP fundamentals',
              tags: ['Newbie Friendly', 'Solo PvP', 'Cheap']
            }
          ]
        },
        {
          id: 'mining',
          name: 'Mining & Industry',
          description: 'Efficient mining and hauling configurations',
          icon: '⛏️',
          color: 'var(--warning-orange)',
          fittings: [
            {
              id: 'retriever_highsec_mining',
              shipName: 'Retriever',
              shipTypeId: 17932,
              fittingName: 'Highsec Ore Mining',
              variationType: 'balanced',
              activity: 'Highsec Mining',
              estimatedDPS: 0,
              effectiveHP: 28000,
              estimatedCost: 45000000,
              skillRequirements: ['Mining Barge IV', 'Mining IV', 'Shield Operation III'],
              description: 'Balanced mining barge for safe highsec operations',
              tags: ['Safe', 'Efficient', 'AFK Friendly']
            },
            {
              id: 'hulk_max_yield',
              shipName: 'Hulk',
              shipTypeId: 22544,
              fittingName: 'Maximum Yield Mining',
              variationType: 'max_dps',
              activity: 'Boosted Mining',
              estimatedDPS: 0,
              effectiveHP: 18000,
              estimatedCost: 180000000,
              skillRequirements: ['Exhumers V', 'Mining V', 'Astrogeology V'],
              description: 'Ultimate mining yield for fleet operations with boosts',
              tags: ['Max Yield', 'Fleet Mining', 'Expensive']
            }
          ]
        },
        {
          id: 'exploration',
          name: 'Exploration',
          description: 'Specialized fits for scanning and site running',
          icon: '🔍',
          color: 'var(--info-blue)',
          fittings: [
            {
              id: 'helios_covert_scanner',
              shipName: 'Helios',
              shipTypeId: 11940,
              fittingName: 'Covert Data/Relic Scanner',
              variationType: 'speed_tank',
              activity: 'Nullsec Exploration',
              estimatedDPS: 0,
              effectiveHP: 2800,
              estimatedCost: 85000000,
              skillRequirements: ['Covert Ops IV', 'Archaeology IV', 'Hacking IV'],
              description: 'Cloaky explorer for dangerous space with nullsec capabilities',
              tags: ['Covert Ops', 'Nullsec', 'High Reward']
            },
            {
              id: 'astero_wormhole_explorer',
              shipName: 'Astero',
              shipTypeId: 33470,
              fittingName: 'Wormhole Explorer',
              variationType: 'balanced',
              activity: 'Wormhole Exploration',
              estimatedDPS: 156,
              effectiveHP: 4200,
              estimatedCost: 120000000,
              skillRequirements: ['Covert Ops III', 'Archaeology III', 'Light Drone Operation IV'],
              description: 'Versatile explorer with combat capability for wormhole space',
              tags: ['Wormhole', 'Combat Capable', 'Versatile']
            }
          ]
        }
      ];

      setActivityCategories(categories);
    } catch (error) {
      console.error('Failed to load popular fittings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatISK = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M ISK`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K ISK`;
    }
    return `${amount} ISK`;
  };

  const getVariationColor = (variation: string): string => {
    switch (variation) {
      case 'max_dps': return 'var(--danger-red)';
      case 'max_tank': return 'var(--info-blue)';
      case 'speed_tank': return 'var(--warning-orange)';
      case 'balanced': return 'var(--success-green)';
      case 'budget': return 'var(--primary-cyan)';
      default: return 'white';
    }
  };

  const getVariationLabel = (variation: string): string => {
    switch (variation) {
      case 'max_dps': return 'Max DPS';
      case 'max_tank': return 'Max Tank';
      case 'speed_tank': return 'Speed Tank';
      case 'balanced': return 'Balanced';
      case 'budget': return 'Budget';
      default: return variation;
    }
  };

  const selectedCategoryData = activityCategories.find(cat => cat.id === selectedCategory);
  const filteredFittings = selectedCategoryData?.fittings.filter(fitting => 
    selectedVariation === 'all' || fitting.variationType === selectedVariation
  ) || [];

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Fitting Recommendations</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading popular fittings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
        <div className="fitting-recommendations-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Fitting Recommendations</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Discover popular and optimized ship fittings for every activity in New Eden
          </p>

          {/* Activity Category Tabs */}
          <div className="category-tabs" style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            {activityCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: selectedCategory === category.id ? category.color : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${selectedCategory === category.id ? category.color : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  color: selectedCategory === category.id ? 'black' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}
              >
                <span style={{ fontSize: '20px' }}>{category.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{category.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {category.fittings.length} fittings
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Variation Filter */}
          <div className="variation-filter" style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setSelectedVariation('all')}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: selectedVariation === 'all' ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${selectedVariation === 'all' ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '4px',
                color: selectedVariation === 'all' ? 'black' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              All Types
            </button>
            {['max_dps', 'max_tank', 'speed_tank', 'balanced', 'budget'].map(variation => (
              <button
                key={variation}
                onClick={() => setSelectedVariation(variation)}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: selectedVariation === variation ? getVariationColor(variation) : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${getVariationColor(variation)}`,
                  borderRadius: '4px',
                  color: selectedVariation === variation ? 'black' : 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {getVariationLabel(variation)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Description */}
        {selectedCategoryData && (
          <div className="category-description" style={{
            padding: 'var(--space-md)',
            backgroundColor: `${selectedCategoryData.color}20`,
            borderRadius: '8px',
            marginBottom: 'var(--space-lg)',
            border: `1px solid ${selectedCategoryData.color}40`
          }}>
            <h3 style={{ 
              margin: 0, 
              marginBottom: 'var(--space-xs)', 
              color: selectedCategoryData.color,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <span style={{ fontSize: '24px' }}>{selectedCategoryData.icon}</span>
              {selectedCategoryData.name}
            </h3>
            <p style={{ margin: 0, opacity: 0.8 }}>{selectedCategoryData.description}</p>
          </div>
        )}

        {/* Fittings Grid */}
        <div className="fittings-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {filteredFittings.map(fitting => (
            <div
              key={fitting.id}
              className="fitting-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: 'var(--space-lg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = getVariationColor(fitting.variationType);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Fitting Header */}
              <div className="fitting-header" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      marginBottom: 'var(--space-xs)', 
                      color: 'var(--primary-cyan)',
                      fontSize: '18px'
                    }}>
                      {fitting.shipName}
                    </h3>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: getVariationColor(fitting.variationType)
                    }}>
                      {fitting.fittingName}
                    </p>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: getVariationColor(fitting.variationType),
                    color: 'black',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {getVariationLabel(fitting.variationType)}
                  </span>
                </div>
                
                <p style={{ 
                  margin: 0, 
                  marginTop: 'var(--space-sm)',
                  fontSize: '13px', 
                  opacity: 0.8 
                }}>
                  {fitting.description}
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="performance-metrics" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-md)'
              }}>
                {fitting.estimatedDPS > 0 && (
                  <div className="metric">
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>DPS</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--danger-red)' }}>
                      {fitting.estimatedDPS.toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="metric">
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>EHP</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--info-blue)' }}>
                    {(fitting.effectiveHP / 1000).toFixed(0)}k
                  </div>
                </div>
                <div className="metric">
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Cost</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning-orange)' }}>
                    {formatISK(fitting.estimatedCost)}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="fitting-tags" style={{
                display: 'flex',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-md)',
                flexWrap: 'wrap'
              }}>
                {fitting.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Skill Requirements */}
              <div className="skill-requirements" style={{ marginBottom: 'var(--space-md)' }}>
                <h4 style={{ 
                  margin: 0, 
                  marginBottom: 'var(--space-xs)', 
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  opacity: 0.7
                }}>
                  Key Skills Required:
                </h4>
                <div style={{ fontSize: '12px' }}>
                  {fitting.skillRequirements.slice(0, 3).map((skill, index) => (
                    <div key={index} style={{ opacity: 0.8 }}>• {skill}</div>
                  ))}
                  {fitting.skillRequirements.length > 3 && (
                    <div style={{ opacity: 0.6 }}>
                      +{fitting.skillRequirements.length - 3} more...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, fontSize: '12px', padding: 'var(--space-sm)' }}
                  onClick={() => {
                    // Navigate to fitting assistant with this ship pre-selected
                    window.location.hash = '/fitting-assistant';
                  }}
                >
                  Open in Fitting Assistant
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: 'var(--space-sm)' }}
                  onClick={() => {
                    // Copy fitting to clipboard or show export options
                    console.log('Export fitting:', fitting.id);
                  }}
                >
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredFittings.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <p className="text-body" style={{ opacity: 0.7 }}>
              No fittings found for the selected category and variation.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            These fittings are optimized for their specific activities. 
            {isAuthenticated ? ' Use the Fitting Assistant for personalized recommendations based on your skills.' : ' Log in to get personalized recommendations based your character skills.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FittingRecommendations;