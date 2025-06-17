import React, { useState, useEffect } from 'react';
import { 
  ActivityRecommendationRequest, 
  ActivityRecommendationResult, 
  ShipRecommendation, 
  FittingVariation 
} from '../../services/activityBasedRecommendations';

interface FittingAssistantState {
  step: 'activity_selection' | 'ship_recommendations' | 'fitting_details' | 'comparison';
  selectedActivity?: string;
  selectedTier?: string;
  securitySpace?: string;
  budgetLimit?: number;
  recommendations?: ActivityRecommendationResult;
  selectedShip?: ShipRecommendation;
  selectedFitting?: FittingVariation;
  comparisonShips: ShipRecommendation[];
  loading: boolean;
  error?: string;
}

interface ActivitySelectionPanelProps {
  onActivitySelected: (request: ActivityRecommendationRequest) => void;
}

interface ShipRecommendationsPanelProps {
  recommendations: ActivityRecommendationResult;
  onShipSelected: (ship: ShipRecommendation) => void;
  onFittingSelected: (ship: ShipRecommendation, fitting: FittingVariation) => void;
  onBack: () => void;
}

interface FittingDetailsPanelProps {
  ship: ShipRecommendation;
  fitting: FittingVariation;
  onBack: () => void;
  onCompareShip: (ship: ShipRecommendation) => void;
}

interface ShipComparisonPanelProps {
  ships: ShipRecommendation[];
  onBack: () => void;
  onRemoveShip: (shipTypeId: number) => void;
}

const FittingAssistant: React.FC = () => {
  const [state, setState] = useState<FittingAssistantState>({
    step: 'activity_selection',
    comparisonShips: [],
    loading: false
  });

  const [characterSkills, setCharacterSkills] = useState<any>(null);

  useEffect(() => {
    loadCharacterData();
  }, []);

  const loadCharacterData = async () => {
    try {
      const skills = await window.electronAPI.esi.getCharacterSkills(undefined);
      setCharacterSkills(skills);
    } catch (error) {
      console.log('No character skills available - user may not be authenticated');
    }
  };

  const handleActivitySelected = async (request: ActivityRecommendationRequest) => {
    setState(prev => ({ ...prev, loading: true, step: 'ship_recommendations' }));

    try {
      // Generate ship recommendations (mock data for now)
      const mockRecommendations: ActivityRecommendationResult = {
        request,
        activityDetails: {
          activityId: request.activityId,
          activityName: request.activityId.replace('_', ' ').toUpperCase(),
          description: `Optimized ship recommendations for ${request.activityId}`,
          keyRequirements: ['Combat skills', 'Proper fitting', 'Situational awareness'],
          commonChallenges: ['Enemy damage types', 'Range management', 'Resource management'],
          successMetrics: ['ISK per hour', 'Completion time', 'Survival rate']
        },
        recommendedShips: generateMockShipRecommendations(request.activityId),
        alternativeShips: [],
        skillGaps: {
          overallSkillLevel: 'Intermediate',
          criticalSkillGaps: [],
          trainingPriorities: [],
          quickWins: [],
          longTermGoals: []
        },
        optimizationSuggestions: [],
        summary: {
          topPickShip: 'Raven Navy Issue',
          topPickReasoning: 'Excellent balance of damage, tank, and pilot compatibility',
          budgetOption: 'Caracal Navy Issue',
          advancedOption: 'Golem',
          keyInsights: ['Focus on missile skills', 'Shield tanking preferred', 'Range management crucial'],
          immediateActions: ['Train Missile skills to IV', 'Acquire T2 modules', 'Practice target priorities'],
          trainingFocus: 'Heavy Missiles and Shield Operation',
          estimatedTimeToOptimal: 21 * 24 * 60 * 60 * 1000
        }
      };

      setState(prev => ({
        ...prev,
        selectedActivity: request.activityId,
        recommendations: mockRecommendations,
        loading: false
      }));

    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate ship recommendations. Please try again.',
        loading: false
      }));
    }
  };

  const handleShipSelected = (ship: ShipRecommendation) => {
    setState(prev => ({ ...prev, selectedShip: ship }));
  };

  const handleFittingSelected = (ship: ShipRecommendation, fitting: FittingVariation) => {
    setState(prev => ({
      ...prev,
      selectedShip: ship,
      selectedFitting: fitting,
      step: 'fitting_details'
    }));
  };

  const handleBack = () => {
    setState(prev => {
      switch (prev.step) {
        case 'ship_recommendations':
          return { ...prev, step: 'activity_selection', recommendations: undefined };
        case 'fitting_details':
          return { ...prev, step: 'ship_recommendations', selectedShip: undefined, selectedFitting: undefined };
        case 'comparison':
          return { ...prev, step: 'ship_recommendations' };
        default:
          return prev;
      }
    });
  };

  const handleCompareShip = (ship: ShipRecommendation) => {
    setState(prev => {
      const isAlreadyComparing = prev.comparisonShips.some(s => s.ship.typeId === ship.ship.typeId);
      if (isAlreadyComparing) return prev;

      const newComparisonShips = [...prev.comparisonShips, ship];
      return {
        ...prev,
        comparisonShips: newComparisonShips,
        step: newComparisonShips.length >= 2 ? 'comparison' : prev.step
      };
    });
  };

  const handleRemoveFromComparison = (shipTypeId: number) => {
    setState(prev => ({
      ...prev,
      comparisonShips: prev.comparisonShips.filter(ship => ship.ship.typeId !== shipTypeId)
    }));
  };

  if (state.loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Fitting Assistant</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Analyzing ships and generating optimal fittings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Fitting Assistant</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {state.error}
            </p>
            <button className="btn btn-primary" onClick={() => setState(prev => ({ ...prev, error: undefined, step: 'activity_selection' }))}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
        <div className="fitting-assistant-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Fitting Assistant</h1>
          <p className="text-body" style={{ opacity: 0.8 }}>
            Get optimal ship and fitting recommendations for any activity
          </p>

          {/* Progress Indicator */}
          <div className="progress-steps" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: 'var(--space-md)',
            gap: 'var(--space-md)'
          }}>
            {['Activity', 'Ships', 'Details'].map((stepName, index) => {
              const stepKeys = ['activity_selection', 'ship_recommendations', 'fitting_details'];
              const currentIndex = stepKeys.indexOf(state.step);
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;
              
              return (
                <div key={stepName} className="progress-step" style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: '4px',
                  backgroundColor: isActive ? 'var(--primary-cyan)' : isCompleted ? 'var(--success-green)' : 'rgba(255, 255, 255, 0.1)',
                  color: isActive || isCompleted ? 'black' : 'white',
                  fontSize: '14px',
                  fontWeight: isActive ? 'bold' : 'normal'
                }}>
                  {stepName}
                </div>
              );
            })}
            
            {state.comparisonShips.length > 0 && (
              <div 
                className="progress-step" 
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: '4px',
                  backgroundColor: state.step === 'comparison' ? 'var(--warning-orange)' : 'rgba(255, 122, 34, 0.3)',
                  color: 'black',
                  fontSize: '14px',
                  fontWeight: state.step === 'comparison' ? 'bold' : 'normal'
                }}
              >
                Compare ({state.comparisonShips.length})
              </div>
            )}
          </div>
        </div>

        {/* Render current step */}
        {state.step === 'activity_selection' && (
          <ActivitySelectionPanel onActivitySelected={handleActivitySelected} />
        )}

        {state.step === 'ship_recommendations' && state.recommendations && (
          <ShipRecommendationsPanel 
            recommendations={state.recommendations}
            onShipSelected={handleShipSelected}
            onFittingSelected={handleFittingSelected}
            onBack={handleBack}
          />
        )}

        {state.step === 'fitting_details' && state.selectedShip && state.selectedFitting && (
          <FittingDetailsPanel 
            ship={state.selectedShip}
            fitting={state.selectedFitting}
            onBack={handleBack}
            onCompareShip={handleCompareShip}
          />
        )}

        {state.step === 'comparison' && state.comparisonShips.length > 0 && (
          <ShipComparisonPanel 
            ships={state.comparisonShips}
            onBack={handleBack}
            onRemoveShip={handleRemoveFromComparison}
          />
        )}
      </div>
    </div>
  );
};

const ActivitySelectionPanel: React.FC<ActivitySelectionPanelProps> = ({ onActivitySelected }) => {
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [securitySpace, setSecuritySpace] = useState<string>('Any');
  const [budgetLimit, setBudgetLimit] = useState<number>(500000000); // 500M ISK default

  const activities = [
    { 
      id: 'mission_running', 
      name: 'Mission Running', 
      description: 'PvE missions and complexes',
      icon: '🎯',
      tiers: [
        { id: 'level_1', name: 'Level 1 Missions', description: 'Frigate-sized enemies' },
        { id: 'level_2', name: 'Level 2 Missions', description: 'Destroyer-sized enemies' },
        { id: 'level_3', name: 'Level 3 Missions', description: 'Cruiser-sized enemies' },
        { id: 'level_4', name: 'Level 4 Missions', description: 'Battleship-sized enemies' },
        { id: 'level_5', name: 'Level 5 Missions', description: 'Capital-sized enemies' }
      ]
    },
    { 
      id: 'mining', 
      name: 'Mining & Industry', 
      description: 'Resource extraction and processing',
      icon: '⛏️',
      tiers: [
        { id: 'highsec_mining', name: 'Highsec Mining', description: 'Safe belt mining' },
        { id: 'lowsec_mining', name: 'Lowsec Mining', description: 'Higher yield, more risk' },
        { id: 'nullsec_mining', name: 'Nullsec Mining', description: 'Best ores, highest risk' },
        { id: 'ice_mining', name: 'Ice Mining', description: 'Specialized ice harvesting' }
      ]
    },
    { 
      id: 'pvp', 
      name: 'PvP Combat', 
      description: 'Player vs Player combat',
      icon: '⚔️',
      tiers: [
        { id: 'solo_pvp', name: 'Solo PvP', description: '1v1 combat' },
        { id: 'small_gang', name: 'Small Gang', description: '2-10 pilots' },
        { id: 'fleet_pvp', name: 'Fleet PvP', description: '10+ pilot fleets' },
        { id: 'faction_warfare', name: 'Faction Warfare', description: 'Organized warfare' }
      ]
    },
    { 
      id: 'exploration', 
      name: 'Exploration', 
      description: 'Scanning and site running',
      icon: '🔍',
      tiers: [
        { id: 'data_sites', name: 'Data Sites', description: 'Hacking mini-game sites' },
        { id: 'relic_sites', name: 'Relic Sites', description: 'Archaeology sites' },
        { id: 'combat_sites', name: 'Combat Sites', description: 'DED complexes and escalations' },
        { id: 'wormholes', name: 'Wormhole Sites', description: 'J-space exploration' }
      ]
    }
  ];

  const securityOptions = [
    { value: 'Highsec', label: 'High Security (1.0 - 0.5)', color: 'var(--success-green)' },
    { value: 'Lowsec', label: 'Low Security (0.4 - 0.1)', color: 'var(--warning-orange)' },
    { value: 'Nullsec', label: 'Null Security (0.0)', color: 'var(--danger-red)' },
    { value: 'Wormhole', label: 'Wormhole Space', color: 'var(--info-blue)' },
    { value: 'Any', label: 'Any Security Level', color: 'white' }
  ];

  const currentActivity = activities.find(a => a.id === selectedActivity);

  const handleSubmit = () => {
    if (!selectedActivity) return;

    const request: ActivityRecommendationRequest = {
      activityId: selectedActivity,
      tierId: selectedTier || undefined,
      securitySpace: securitySpace as any,
      budgetConstraint: budgetLimit,
      // pilotSkills would be passed from character data
    };

    onActivitySelected(request);
  };

  return (
    <div className="activity-selection-panel">
      <h2 className="text-h2" style={{ marginBottom: 'var(--space-lg)' }}>Select Activity & Requirements</h2>

      {/* Activity Selection */}
      <div className="activity-selection" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Choose Activity</h3>
        <div className="activity-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {activities.map(activity => (
            <button
              key={activity.id}
              className={`activity-card ${selectedActivity === activity.id ? 'selected' : ''}`}
              onClick={() => setSelectedActivity(activity.id)}
              style={{
                padding: 'var(--space-md)',
                backgroundColor: selectedActivity === activity.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${selectedActivity === activity.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                color: selectedActivity === activity.id ? 'black' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: '24px', marginRight: 'var(--space-sm)' }}>{activity.icon}</span>
                <h4 style={{ margin: 0 }}>{activity.name}</h4>
              </div>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>{activity.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tier Selection */}
      {currentActivity && (
        <div className="tier-selection" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>
            Select {currentActivity.name} Tier
          </h3>
          <div className="tier-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-sm)'
          }}>
            {currentActivity.tiers.map(tier => (
              <button
                key={tier.id}
                className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                onClick={() => setSelectedTier(tier.id)}
                style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: selectedTier === tier.id ? 'var(--warning-orange)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedTier === tier.id ? 'var(--warning-orange)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '6px',
                  color: selectedTier === tier.id ? 'black' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                  {tier.name}
                </div>
                <div style={{ opacity: 0.8, fontSize: '12px' }}>
                  {tier.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Security Space & Budget */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 'var(--space-lg)', 
        marginBottom: 'var(--space-xl)' 
      }}>
        <div className="security-selection">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Security Space</h3>
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            {securityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSecuritySpace(option.value)}
                style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: securitySpace === option.value ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${securitySpace === option.value ? option.color : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '4px',
                  color: securitySpace === option.value ? option.color : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="budget-selection">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Budget Limit</h3>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <input
              type="range"
              min="50000000"
              max="2000000000"
              step="50000000"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(parseInt(e.target.value))}
              style={{
                width: '100%',
                marginBottom: 'var(--space-sm)'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '14px',
              opacity: 0.8 
            }}>
              <span>50M ISK</span>
              <span style={{ fontWeight: 'bold' }}>
                {budgetLimit >= 1000000000 ? 
                  `${(budgetLimit / 1000000000).toFixed(1)}B ISK` : 
                  `${(budgetLimit / 1000000).toFixed(0)}M ISK`
                }
              </span>
              <span>2B ISK</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Total budget for ship hull + fitting
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!selectedActivity}
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            fontSize: '18px',
            opacity: !selectedActivity ? 0.5 : 1
          }}
        >
          Get Ship Recommendations →
        </button>
      </div>
    </div>
  );
};

const ShipRecommendationsPanel: React.FC<ShipRecommendationsPanelProps> = ({ 
  recommendations, 
  onShipSelected, 
  onFittingSelected, 
  onBack 
}) => {
  const [selectedShipIndex, setSelectedShipIndex] = useState<number>(0);
  const [selectedFittingType, setSelectedFittingType] = useState<string>('balanced');

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

  const fittingTypeLabels: Record<string, string> = {
    'max_dps': 'Max DPS',
    'max_tank': 'Max Tank',
    'speed_tank': 'Speed Tank', 
    'balanced': 'Balanced',
    'budget': 'Budget'
  };

  const fittingTypeColors: Record<string, string> = {
    'max_dps': 'var(--danger-red)',
    'max_tank': 'var(--info-blue)',
    'speed_tank': 'var(--warning-orange)',
    'balanced': 'var(--success-green)',
    'budget': 'var(--primary-cyan)'
  };

  const selectedShip = recommendations.recommendedShips[selectedShipIndex];
  const selectedFitting = selectedShip?.fittingVariations.find(f => f.variationType === selectedFittingType);

  return (
    <div className="ship-recommendations-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary-cyan)', 
            cursor: 'pointer',
            fontSize: '18px',
            marginRight: 'var(--space-md)'
          }}>
            ← Back
          </button>
          <h2 className="text-h2">Ship Recommendations: {recommendations.activityDetails.activityName}</h2>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="activity-summary" style={{
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-sm)' }}>Top Recommendation</h3>
            <p style={{ margin: 0, color: 'var(--primary-cyan)', fontSize: '18px', fontWeight: 'bold' }}>
              {recommendations.summary.topPickShip}
            </p>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
              {recommendations.summary.topPickReasoning}
            </p>
          </div>
          <div>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-sm)' }}>Key Insights</h3>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
              {recommendations.summary.keyInsights.slice(0, 3).map((insight, index) => (
                <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Ship Selection Tabs */}
      <div className="ship-tabs" style={{ 
        display: 'flex', 
        gap: 'var(--space-sm)', 
        marginBottom: 'var(--space-lg)' 
      }}>
        {recommendations.recommendedShips.map((ship, index) => (
          <button
            key={ship.ship.typeId}
            onClick={() => setSelectedShipIndex(index)}
            style={{
              padding: 'var(--space-md)',
              backgroundColor: selectedShipIndex === index ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${selectedShipIndex === index ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '8px',
              color: selectedShipIndex === index ? 'black' : 'white',
              cursor: 'pointer',
              flex: 1,
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-xs)' }}>
              #{ship.rank} {ship.ship.typeName}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Score: {ship.overallScore}/100
            </div>
          </button>
        ))}
      </div>

      {selectedShip && (
        <div className="ship-details" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr', 
          gap: 'var(--space-lg)' 
        }}>
          {/* Ship Info */}
          <div className="ship-info">
            <div className="ship-card" style={{
              padding: 'var(--space-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              marginBottom: 'var(--space-md)'
            }}>
              <h3 style={{ margin: 0, marginBottom: 'var(--space-md)', color: 'var(--primary-cyan)' }}>
                {selectedShip.ship.typeName}
              </h3>
              
              <div className="ship-stats" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '14px' }}>
                  <div>High Slots: {selectedShip.ship.baseStats.highSlots}</div>
                  <div>Med Slots: {selectedShip.ship.baseStats.medSlots}</div>
                  <div>Low Slots: {selectedShip.ship.baseStats.lowSlots}</div>
                  <div>Rig Slots: {selectedShip.ship.baseStats.rigSlots}</div>
                  <div>CPU: {selectedShip.ship.baseStats.cpu.toLocaleString()}</div>
                  <div>PWG: {selectedShip.ship.baseStats.powerGrid.toLocaleString()}</div>
                </div>
              </div>

              <div className="pros-cons" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--success-green)' }}>Pros:</h4>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-md)', fontSize: '13px' }}>
                    {selectedShip.pros.map((pro, index) => (
                      <li key={index}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--danger-red)' }}>Cons:</h4>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-md)', fontSize: '13px' }}>
                    {selectedShip.cons.map((con, index) => (
                      <li key={index}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="cost-info">
                <h4 style={{ margin: 0, fontSize: '14px', marginBottom: 'var(--space-xs)' }}>Cost Range:</h4>
                <div style={{ fontSize: '13px' }}>
                  <div>Budget: {formatISK(selectedShip.costAnalysis.totalCostRange.budget)}</div>
                  <div>Balanced: {formatISK(selectedShip.costAnalysis.totalCostRange.balanced)}</div>
                  <div>Optimal: {formatISK(selectedShip.costAnalysis.totalCostRange.optimal)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fitting Variations */}
          <div className="fitting-variations">
            {/* Fitting Type Selector */}
            <div className="fitting-type-tabs" style={{ 
              display: 'flex', 
              gap: 'var(--space-xs)', 
              marginBottom: 'var(--space-md)' 
            }}>
              {selectedShip.fittingVariations.map(fitting => (
                <button
                  key={fitting.variationType}
                  onClick={() => setSelectedFittingType(fitting.variationType)}
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: selectedFittingType === fitting.variationType ? 
                      fittingTypeColors[fitting.variationType] : 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${fittingTypeColors[fitting.variationType]}`,
                    borderRadius: '4px',
                    color: selectedFittingType === fitting.variationType ? 'black' : 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: selectedFittingType === fitting.variationType ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {fittingTypeLabels[fitting.variationType]}
                </button>
              ))}
            </div>

            {selectedFitting && (
              <div className="fitting-details" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <h3 style={{ margin: 0, color: fittingTypeColors[selectedFitting.variationType] }}>
                    {selectedFitting.name}
                  </h3>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {formatISK(selectedFitting.totalCost)}
                  </div>
                </div>

                <p style={{ margin: 0, marginBottom: 'var(--space-md)', opacity: 0.8, fontSize: '14px' }}>
                  {selectedFitting.description}
                </p>

                {/* Performance Metrics */}
                <div className="performance-metrics" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <div className="metric">
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>DPS</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {selectedFitting.performanceMetrics.estimatedDPS.toLocaleString()}
                    </div>
                  </div>
                  <div className="metric">
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>EHP</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(selectedFitting.performanceMetrics.effectiveHP / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="metric">
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Speed</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {selectedFitting.performanceMetrics.maxVelocity.toLocaleString()} m/s
                    </div>
                  </div>
                  <div className="metric">
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Range</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(selectedFitting.performanceMetrics.optimalRange / 1000).toFixed(0)}km
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => onFittingSelected(selectedShip, selectedFitting)}
                    style={{ flex: 1 }}
                  >
                    View Full Details
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => onShipSelected(selectedShip)}
                  >
                    Compare Ships
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FittingDetailsPanel: React.FC<FittingDetailsPanelProps> = ({ ship, fitting, onBack, onCompareShip }) => {
  const formatISK = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M ISK`;
    }
    return `${(amount / 1000).toFixed(0)}K ISK`;
  };

  const slotTypes = ['high', 'med', 'low', 'rig'] as const;
  const slotLabels = { high: 'High Slots', med: 'Med Slots', low: 'Low Slots', rig: 'Rig Slots' };

  return (
    <div className="fitting-details-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary-cyan)', 
            cursor: 'pointer',
            fontSize: '18px',
            marginRight: 'var(--space-md)'
          }}>
            ← Back
          </button>
          <h2 className="text-h2">{ship.ship.typeName} - {fitting.name}</h2>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-secondary" onClick={() => onCompareShip(ship)}>
            Add to Comparison
          </button>
          <button className="btn btn-primary">
            Export Fitting
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Left Column - Fitting Modules */}
        <div className="fitting-modules">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Fitting Layout</h3>
          
          {slotTypes.map(slotType => {
            const slotsForType = fitting.fittingModules.filter(m => m.slotType === slotType);
            if (slotsForType.length === 0) return null;

            return (
              <div key={slotType} className="slot-section" style={{ marginBottom: 'var(--space-md)' }}>
                <h4 style={{ 
                  margin: 0, 
                  marginBottom: 'var(--space-sm)', 
                  fontSize: '16px',
                  color: 'var(--primary-cyan)'
                }}>
                  {slotLabels[slotType]}
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  {slotsForType.map((module, index) => (
                    <div 
                      key={`${module.moduleTypeId}-${index}`}
                      className="module-item"
                      style={{
                        padding: 'var(--space-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {module.moduleName}
                          {module.quantity > 1 && ` x${module.quantity}`}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {module.purpose}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                          {formatISK(module.cost * module.quantity)}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>
                          T{module.techLevel} Meta {module.metaLevel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Fitting Notes */}
          {fitting.fittingNotes.length > 0 && (
            <div className="fitting-notes" style={{
              padding: 'var(--space-md)',
              backgroundColor: 'rgba(255, 122, 34, 0.1)',
              borderRadius: '8px',
              marginTop: 'var(--space-md)'
            }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontSize: '14px' }}>
                Fitting Notes:
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
                {fitting.fittingNotes.map((note, index) => (
                  <li key={index} style={{ fontSize: '13px', marginBottom: '2px' }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column - Performance & Skills */}
        <div className="performance-and-skills">
          {/* Performance Metrics */}
          <div className="performance-section" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Performance Metrics</h3>
            
            <div className="metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-md)'
            }}>
              <div className="metric-card" style={{
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger-red)' }}>
                  {fitting.performanceMetrics.estimatedDPS.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>DPS</div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--info-blue)' }}>
                  {(fitting.performanceMetrics.effectiveHP / 1000).toFixed(0)}k
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Effective HP</div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning-orange)' }}>
                  {fitting.performanceMetrics.maxVelocity}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Max Velocity (m/s)</div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-cyan)' }}>
                  {(fitting.performanceMetrics.optimalRange / 1000).toFixed(0)}km
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Optimal Range</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="detailed-stats" style={{
              padding: 'var(--space-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontSize: '14px' }}>
                Detailed Statistics:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '13px' }}>
                <div>Volley Damage: {fitting.performanceMetrics.volleyDamage.toLocaleString()}</div>
                <div>Falloff Range: {(fitting.performanceMetrics.falloffRange / 1000).toFixed(0)}km</div>
                <div>Shield HP: {fitting.performanceMetrics.shieldHP.toLocaleString()}</div>
                <div>Armor HP: {fitting.performanceMetrics.armorHP.toLocaleString()}</div>
                <div>Signature: {fitting.performanceMetrics.signatureRadius}m</div>
                <div>Agility: {fitting.performanceMetrics.agility.toFixed(2)}s</div>
                <div>Scan Res: {fitting.performanceMetrics.scanResolution}</div>
                <div>Lock Range: {(fitting.performanceMetrics.lockRange / 1000).toFixed(0)}km</div>
              </div>
            </div>
          </div>

          {/* Skill Requirements */}
          <div className="skill-requirements">
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Skill Requirements</h3>
            
            <div className="pilot-compatibility" style={{
              padding: 'var(--space-md)',
              backgroundColor: fitting.pilotCanUse ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
              borderRadius: '8px',
              marginBottom: 'var(--space-md)'
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: fitting.pilotCanUse ? 'var(--success-green)' : 'var(--danger-red)'
              }}>
                {fitting.pilotCanUse ? '✅ You can use this fitting' : '❌ Missing required skills'}
              </div>
            </div>

            {fitting.skillRequirements.length > 0 && (
              <div className="skills-list" style={{
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}>
                <h4 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontSize: '14px' }}>
                  Required Skills:
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  {fitting.skillRequirements.map((skill, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-xs)',
                        backgroundColor: skill.currentLevel >= skill.requiredLevel ? 
                          'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      <span>{skill.skillName}</span>
                      <span>
                        {skill.currentLevel}/{skill.requiredLevel}
                        {skill.currentLevel < skill.requiredLevel && (
                          <span style={{ color: 'var(--danger-red)', marginLeft: 'var(--space-xs)' }}>
                            (Need Level {skill.requiredLevel})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShipComparisonPanel: React.FC<ShipComparisonPanelProps> = ({ ships, onBack, onRemoveShip }) => {
  const formatISK = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M`;
    }
    return `${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="ship-comparison-panel">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <button onClick={onBack} style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--primary-cyan)', 
          cursor: 'pointer',
          fontSize: '18px',
          marginRight: 'var(--space-md)'
        }}>
          ← Back
        </button>
        <h2 className="text-h2">Ship Comparison ({ships.length} ships)</h2>
      </div>

      <div className="comparison-table" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: 'var(--space-lg)',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-sm)', color: 'var(--primary-cyan)' }}>
                Ship
              </th>
              {ships.map(ship => (
                <th key={ship.ship.typeId} style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-sm)',
                  minWidth: '150px',
                  position: 'relative'
                }}>
                  <div style={{ marginBottom: 'var(--space-xs)' }}>
                    {ship.ship.typeName}
                  </div>
                  <button
                    onClick={() => onRemoveShip(ship.ship.typeId)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'var(--danger-red)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Score: {ship.overallScore}/100
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Basic Stats */}
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>Class</td>
              {ships.map(ship => (
                <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                  {ship.ship.groupName}
                </td>
              ))}
            </tr>
            
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>High/Med/Low</td>
              {ships.map(ship => (
                <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                  {ship.ship.baseStats.highSlots}/{ship.ship.baseStats.medSlots}/{ship.ship.baseStats.lowSlots}
                </td>
              ))}
            </tr>

            {/* Performance Metrics (from balanced fitting) */}
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>DPS</td>
              {ships.map(ship => {
                const balancedFit = ship.fittingVariations.find(f => f.variationType === 'balanced');
                return (
                  <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                    {balancedFit?.performanceMetrics.estimatedDPS.toLocaleString() || 'N/A'}
                  </td>
                );
              })}
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>EHP</td>
              {ships.map(ship => {
                const balancedFit = ship.fittingVariations.find(f => f.variationType === 'balanced');
                return (
                  <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                    {balancedFit ? `${(balancedFit.performanceMetrics.effectiveHP / 1000).toFixed(0)}k` : 'N/A'}
                  </td>
                );
              })}
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>Speed</td>
              {ships.map(ship => {
                const balancedFit = ship.fittingVariations.find(f => f.variationType === 'balanced');
                return (
                  <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                    {balancedFit?.performanceMetrics.maxVelocity || 'N/A'} m/s
                  </td>
                );
              })}
            </tr>

            {/* Cost Analysis */}
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>Budget Cost</td>
              {ships.map(ship => (
                <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                  {formatISK(ship.costAnalysis.totalCostRange.budget)}
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>Optimal Cost</td>
              {ships.map(ship => (
                <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                  {formatISK(ship.costAnalysis.totalCostRange.optimal)}
                </td>
              ))}
            </tr>

            {/* Pilot Compatibility */}
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>Can Fly</td>
              {ships.map(ship => (
                <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                  <span style={{ 
                    color: ship.pilotCompatibility.canFlyShip ? 'var(--success-green)' : 'var(--danger-red)'
                  }}>
                    {ship.pilotCompatibility.canFlyShip ? '✅' : '❌'}
                  </span>
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>Compatibility</td>
              {ships.map(ship => (
                <td key={ship.ship.typeId} style={{ textAlign: 'center', padding: 'var(--space-sm)' }}>
                  {ship.pilotCompatibility.overallCompatibility}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
        <p style={{ opacity: 0.8 }}>
          Compare ship stats, costs, and compatibility to make the best choice for your needs.
        </p>
      </div>
    </div>
  );
};

// Helper function to generate mock ship recommendations
function generateMockShipRecommendations(activityId: string): ShipRecommendation[] {
  const mockShips = [
    {
      typeId: 17738,
      typeName: 'Raven Navy Issue',
      groupName: 'Battleship',
      raceName: 'Caldari'
    },
    {
      typeId: 17715,
      typeName: 'Dominix Navy Issue', 
      groupName: 'Battleship',
      raceName: 'Gallente'
    },
    {
      typeId: 17920,
      typeName: 'Ishtar',
      groupName: 'Heavy Assault Cruiser',
      raceName: 'Gallente'
    }
  ];

  return mockShips.map((ship, index) => ({
    rank: index + 1,
    ship: {
      typeId: ship.typeId,
      typeName: ship.typeName,
      groupName: ship.groupName,
      raceName: ship.raceName,
      hullBonuses: [],
      baseStats: {
        powerGrid: 18750,
        cpu: 950,
        highSlots: 8,
        medSlots: 6,
        lowSlots: 5,
        rigSlots: 3,
        turretHardpoints: 0,
        launcherHardpoints: 6,
        droneCapacity: 125,
        droneBandwidth: 50,
        cargoCapacity: 465,
        baseShield: 8200,
        baseArmor: 6500,
        baseHull: 9000,
        maxVelocity: 95,
        agility: 0.11,
        warpSpeed: 2.2,
        mass: 108000000
      },
      description: `${ship.typeName} description`
    },
    overallScore: 95 - (index * 5),
    pilotCompatibility: {
      canFlyShip: true,
      canUseOptimalFit: index === 0,
      skillsMetPercentage: 85 - (index * 10),
      missingCriticalSkills: index,
      trainingTimeToFly: 0,
      trainingTimeToOptimal: index * 7 * 24 * 60 * 60 * 1000,
      overallCompatibility: 85 - (index * 10)
    },
    fittingVariations: generateMockFittingVariations(),
    pros: [`Excellent ${activityId} performance`, 'Great slot layout', 'Strong hull bonuses'],
    cons: ['High skill requirements', 'Expensive to fit', 'Slow and less agile'],
    skillRequirements: {
      totalSkillsRequired: 8,
      totalSkillsMetByPilot: 6 - index,
      criticalMissingSkills: [],
      recommendedTrainingOrder: [],
      estimatedTrainingTime: index * 5 * 24 * 60 * 60 * 1000
    },
    costAnalysis: {
      hullCost: 300000000 + (index * 50000000),
      fittingCostRange: {
        budget: 50000000,
        balanced: 100000000,
        optimal: 200000000
      },
      totalCostRange: {
        budget: 350000000 + (index * 50000000),
        balanced: 400000000 + (index * 50000000),
        optimal: 500000000 + (index * 50000000)
      },
      iskEfficiencyRating: 8.5 - (index * 0.5),
      budgetRecommendation: 'Balanced fit recommended for best value'
    },
    alternativeUpgrades: []
  }));
}

function generateMockFittingVariations(): FittingVariation[] {
  const variations: Array<'max_dps' | 'max_tank' | 'speed_tank' | 'balanced' | 'budget'> = 
    ['max_dps', 'max_tank', 'speed_tank', 'balanced', 'budget'];

  return variations.map(type => ({
    variationType: type,
    name: type.replace('_', ' ').toUpperCase(),
    description: `${type} focused fitting`,
    totalCost: type === 'budget' ? 50000000 : type === 'max_dps' ? 200000000 : 100000000,
    fittingModules: [],
    performanceMetrics: {
      estimatedDPS: type === 'max_dps' ? 850 : type === 'balanced' ? 650 : 450,
      volleyDamage: 3200,
      optimalRange: 65000,
      falloffRange: 15000,
      effectiveHP: type === 'max_tank' ? 150000 : type === 'balanced' ? 95000 : 65000,
      shieldHP: 18000,
      armorHP: 12000,
      hullHP: 9000,
      shieldResists: { em: 0.25, thermal: 0.40, kinetic: 0.60, explosive: 0.50 },
      armorResists: { em: 0.60, thermal: 0.35, kinetic: 0.25, explosive: 0.10 },
      maxVelocity: type === 'speed_tank' ? 180 : 125,
      agility: 0.52,
      signatureRadius: 340,
      capacitorStable: true,
      scanResolution: 105,
      lockRange: 87500,
      cargoCapacity: 450,
      droneCapacity: 125
    },
    skillRequirements: [],
    pilotCanUse: true,
    alternativeModules: [],
    fittingNotes: [`Optimized for ${type.replace('_', ' ')}`]
  }));
}

export default FittingAssistant;