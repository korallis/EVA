/**
 * Ship Recommendation Panel - Advanced ship recommendation interface
 * Displays AI-powered ship recommendations with comprehensive analysis
 * Features activity selection, budget filtering, and detailed comparisons
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { recommendationService } from '../../services/recommendationService';
import { 
  ComprehensiveRecommendation,
  UnifiedRecommendationRequest
} from '../../../services/recommendationOrchestrator';
import { ShipRecommendation } from '../../../services/shipRecommendationEngine';
import { SkillSet } from '../../../services/dogmaEngine';
import { EVALogger } from '../../../utils/logger';
import './ShipRecommendationPanel.css';

const logger = EVALogger.getLogger('ShipRecommendationPanel');

interface ShipRecommendationPanelProps {
  characterId: number;
  currentSkills: SkillSet;
  onShipSelected?: (shipTypeId: number) => void;
}

interface ActivityOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface BudgetTier {
  name: string;
  min: number;
  max: number;
  description: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: 'mission_running_l4',
    name: 'Level 4 Missions',
    description: 'High-level PvE missions with excellent rewards',
    icon: '🎯',
    category: 'PvE'
  },
  {
    id: 'mining_exhumer',
    name: 'Exhumer Mining',
    description: 'High-yield asteroid mining operations',
    icon: '⛏️',
    category: 'Industry'
  },
  {
    id: 'pvp_solo_frigate',
    name: 'Solo Frigate PvP',
    description: 'Fast-paced solo combat in frigates',
    icon: '⚔️',
    category: 'PvP'
  },
  {
    id: 'exploration_cov_ops',
    name: 'Covert Ops Exploration',
    description: 'Stealth exploration and data/relic sites',
    icon: '🔍',
    category: 'Exploration'
  },
  {
    id: 'hauling_freighter',
    name: 'Freighter Hauling',
    description: 'Large-scale cargo transportation',
    icon: '🚚',
    category: 'Logistics'
  }
];

const BUDGET_TIERS: BudgetTier[] = [
  { name: 'Budget', min: 0, max: 50000000, description: 'Cost-effective options' },
  { name: 'Standard', min: 50000000, max: 200000000, description: 'Balanced performance' },
  { name: 'Premium', min: 200000000, max: 500000000, description: 'High-performance fits' },
  { name: 'Elite', min: 500000000, max: 2000000000, description: 'Top-tier equipment' }
];

/**
 * Ship Recommendation Panel Component
 */
const ShipRecommendationPanel: React.FC<ShipRecommendationPanelProps> = ({
  characterId,
  currentSkills,
  onShipSelected
}) => {
  // State management
  const [selectedActivity, setSelectedActivity] = useState<string>('mission_running_l4');
  const [selectedBudget, setSelectedBudget] = useState<BudgetTier>(BUDGET_TIERS[1]);
  const [maxTrainingTime, setMaxTrainingTime] = useState<number>(30);
  const [recommendations, setRecommendations] = useState<ComprehensiveRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<ShipRecommendation | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState<'quick' | 'standard' | 'comprehensive'>('standard');

  /**
   * Generate recommendations based on current parameters
   */
  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info(`🎯 Generating recommendations for activity: ${selectedActivity}`);
      
      const request: UnifiedRecommendationRequest = {
        characterID: characterId,
        activityID: selectedActivity,
        currentSkills,
        preferences: {
          budget: selectedBudget.max,
          maxTrainingTime,
          riskTolerance: 'moderate'
        },
        analysisDepth
      };

      const result = await recommendationService.getComprehensiveRecommendations(request);
      setRecommendations(result);
      setSelectedShip(result.shipRecommendations[0] || null);
      
      logger.info(`✅ Generated ${result.shipRecommendations.length} recommendations`);
      
    } catch (err) {
      logger.error('❌ Failed to generate recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  }, [characterId, selectedActivity, selectedBudget, maxTrainingTime, currentSkills, analysisDepth]);

  /**
   * Initialize recommendations on component mount
   */
  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  /**
   * Memoized activity options by category
   */
  const activityCategories = useMemo(() => {
    const categories = new Map<string, ActivityOption[]>();
    ACTIVITY_OPTIONS.forEach(activity => {
      if (!categories.has(activity.category)) {
        categories.set(activity.category, []);
      }
      categories.get(activity.category)!.push(activity);
    });
    return categories;
  }, []);

  /**
   * Format ISK values for display
   */
  const formatISK = useCallback((value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B ISK`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ISK`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K ISK`;
    }
    return `${value.toFixed(0)} ISK`;
  }, []);

  /**
   * Format training time for display
   */
  const formatTrainingTime = useCallback((days: number): string => {
    if (days === 0) return 'Can fly now';
    if (days < 1) return 'Less than 1 day';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  }, []);

  /**
   * Get effectiveness color based on score
   */
  const getEffectivenessColor = useCallback((score: number): string => {
    if (score >= 85) return '#00ff88';
    if (score >= 70) return '#88ff00';
    if (score >= 50) return '#ffaa00';
    return '#ff4444';
  }, []);

  /**
   * Handle ship selection
   */
  const handleShipSelect = useCallback((ship: ShipRecommendation) => {
    setSelectedShip(ship);
    onShipSelected?.(ship.shipTypeID);
    logger.debug(`🚀 Selected ship: ${ship.shipName}`);
  }, [onShipSelected]);

  /**
   * Render activity selector
   */
  const renderActivitySelector = () => (
    <div className="activity-selector">
      <h3>🎯 Select Activity</h3>
      <div className="activity-categories">
        {Array.from(activityCategories.entries()).map(([category, activities]) => (
          <div key={category} className="activity-category">
            <h4>{category}</h4>
            <div className="activity-options">
              {activities.map(activity => (
                <button
                  key={activity.id}
                  className={`activity-option ${selectedActivity === activity.id ? 'selected' : ''}`}
                  onClick={() => setSelectedActivity(activity.id)}
                  title={activity.description}
                >
                  <span className="activity-icon">{activity.icon}</span>
                  <span className="activity-name">{activity.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * Render budget and constraints selector
   */
  const renderConstraintsSelector = () => (
    <div className="constraints-selector">
      <h3>⚙️ Constraints</h3>
      
      <div className="constraint-group">
        <label>Budget Tier</label>
        <div className="budget-tiers">
          {BUDGET_TIERS.map(tier => (
            <button
              key={tier.name}
              className={`budget-tier ${selectedBudget.name === tier.name ? 'selected' : ''}`}
              onClick={() => setSelectedBudget(tier)}
              title={tier.description}
            >
              <div className="tier-name">{tier.name}</div>
              <div className="tier-range">{formatISK(tier.min)} - {formatISK(tier.max)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="constraint-group">
        <label>Max Training Time: {maxTrainingTime} days</label>
        <input
          type="range"
          min="0"
          max="180"
          value={maxTrainingTime}
          onChange={(e) => setMaxTrainingTime(Number(e.target.value))}
          className="training-time-slider"
        />
      </div>

      <div className="constraint-group">
        <label>Analysis Depth</label>
        <select
          value={analysisDepth}
          onChange={(e) => setAnalysisDepth(e.target.value as any)}
          className="analysis-depth-select"
        >
          <option value="quick">Quick (Fast results)</option>
          <option value="standard">Standard (Balanced)</option>
          <option value="comprehensive">Comprehensive (Detailed)</option>
        </select>
      </div>

      <button
        onClick={generateRecommendations}
        disabled={loading}
        className="generate-button"
      >
        {loading ? '🔄 Generating...' : '🚀 Generate Recommendations'}
      </button>
    </div>
  );

  /**
   * Render recommendation summary
   */
  const renderSummary = () => {
    if (!recommendations) return null;

    const { summary } = recommendations;
    
    return (
      <div className="recommendation-summary">
        <h3>📊 Summary</h3>
        
        <div className="top-recommendation">
          <div className="ship-header">
            <h4>🏆 Top Recommendation: {summary.topRecommendation.shipName}</h4>
            <div 
              className="overall-score"
              style={{ color: getEffectivenessColor(summary.topRecommendation.overallScore) }}
            >
              {summary.topRecommendation.overallScore.toFixed(1)}/100
            </div>
          </div>
          
          <div className="ship-stats">
            <div className="stat">
              <span className="label">Training Time:</span>
              <span className="value">{formatTrainingTime(summary.topRecommendation.accessibility.skillGapDays)}</span>
            </div>
            <div className="stat">
              <span className="label">Total Cost:</span>
              <span className="value">{formatISK(summary.topRecommendation.economics.totalInvestment)}</span>
            </div>
            <div className="stat">
              <span className="label">Effectiveness:</span>
              <span className="value">{summary.topRecommendation.effectiveness.metaLevel}</span>
            </div>
          </div>
        </div>

        <div className="key-insights">
          <h4>💡 Key Insights</h4>
          <ul>
            {summary.keyInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>

        <div className="immediate-actions">
          <h4>⚡ Immediate Actions</h4>
          <ul>
            {summary.immediateActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  /**
   * Render ship recommendations list
   */
  const renderRecommendations = () => {
    if (!recommendations?.shipRecommendations.length) return null;

    return (
      <div className="ship-recommendations">
        <h3>🚀 Ship Recommendations</h3>
        
        <div className="recommendations-list">
          {recommendations.shipRecommendations.map((ship, index) => (
            <div
              key={ship.shipTypeID}
              className={`recommendation-card ${selectedShip?.shipTypeID === ship.shipTypeID ? 'selected' : ''}`}
              onClick={() => handleShipSelect(ship)}
            >
              <div className="card-header">
                <div className="ship-info">
                  <div className="rank">#{index + 1}</div>
                  <div className="ship-name">{ship.shipName}</div>
                  <div className="ship-group">{ship.shipGroup}</div>
                </div>
                <div 
                  className="effectiveness-score"
                  style={{ color: getEffectivenessColor(ship.overallScore) }}
                >
                  {ship.overallScore.toFixed(1)}
                </div>
              </div>

              <div className="card-content">
                <div className="recommendation-reason">
                  {ship.recommendationReason}
                </div>

                <div className="ship-metrics">
                  <div className="metric">
                    <span className="metric-label">Combat:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${ship.effectiveness.combatRating}%`,
                          backgroundColor: getEffectivenessColor(ship.effectiveness.combatRating)
                        }}
                      />
                    </div>
                    <span className="metric-value">{ship.effectiveness.combatRating.toFixed(0)}</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Survival:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${ship.effectiveness.survivabilityRating}%`,
                          backgroundColor: getEffectivenessColor(ship.effectiveness.survivabilityRating)
                        }}
                      />
                    </div>
                    <span className="metric-value">{ship.effectiveness.survivabilityRating.toFixed(0)}</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Utility:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${ship.effectiveness.utilityRating}%`,
                          backgroundColor: getEffectivenessColor(ship.effectiveness.utilityRating)
                        }}
                      />
                    </div>
                    <span className="metric-value">{ship.effectiveness.utilityRating.toFixed(0)}</span>
                  </div>
                </div>

                <div className="ship-details">
                  <div className="detail">
                    <span className="detail-label">Training:</span>
                    <span className="detail-value">{formatTrainingTime(ship.accessibility.skillGapDays)}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Cost:</span>
                    <span className="detail-value">{formatISK(ship.economics.totalInvestment)}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Risk:</span>
                    <span className="detail-value">{ship.economics.lossRisk}</span>
                  </div>
                </div>

                <div className="pros-cons">
                  {ship.pros.length > 0 && (
                    <div className="pros">
                      <strong>Pros:</strong> {ship.pros.join(', ')}
                    </div>
                  )}
                  {ship.cons.length > 0 && (
                    <div className="cons">
                      <strong>Cons:</strong> {ship.cons.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render performance metrics
   */
  const renderPerformanceMetrics = () => {
    if (!recommendations?.performance) return null;

    const { performance } = recommendations;
    
    return (
      <div className="performance-metrics">
        <h4>⚡ Performance</h4>
        <div className="metrics-grid">
          <div className="metric">
            <span className="label">Calculation Time:</span>
            <span className="value">{performance.calculationTime}ms</span>
          </div>
          <div className="metric">
            <span className="label">Ships Analyzed:</span>
            <span className="value">{performance.shipsAnalyzed}</span>
          </div>
          <div className="metric">
            <span className="label">Fittings Generated:</span>
            <span className="value">{performance.fittingsGenerated}</span>
          </div>
          <div className="metric">
            <span className="label">Cache Hit Rate:</span>
            <span className="value">{performance.cacheHitRate}%</span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Main render
   */
  return (
    <div className="ship-recommendation-panel">
      <div className="panel-header">
        <h2>🚀 Ship Recommendations</h2>
        <p>AI-powered ship selection based on your skills and preferences</p>
      </div>

      <div className="panel-content">
        <div className="controls-section">
          {renderActivitySelector()}
          {renderConstraintsSelector()}
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="loading-message">
            <div className="loading-spinner">🔄</div>
            <p>Analyzing ships and generating recommendations...</p>
          </div>
        )}

        {recommendations && !loading && (
          <div className="results-section">
            {renderSummary()}
            {renderRecommendations()}
            {renderPerformanceMetrics()}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ShipRecommendationPanel);