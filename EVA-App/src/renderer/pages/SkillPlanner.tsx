import React, { useState, useEffect } from 'react';
import { Activity, SkillPlan } from '../../services/activitySelectionService';
import { OptimizedSkillPlan, OptimizationGoal, OptimizationStrategy, OPTIMIZATION_STRATEGIES, SkillPlanComparison } from '../../services/skillPlanOptimizer';
import { ShipAnalysis } from '../../services/shipAnalysisService';

interface SkillPlannerState {
  step: 'goal_selection' | 'strategy_selection' | 'plan_generation' | 'plan_review' | 'comparison';
  selectedGoal?: OptimizationGoal;
  selectedStrategy?: OptimizationStrategy;
  generatedPlans: OptimizedSkillPlan[];
  planComparison?: SkillPlanComparison;
  loading: boolean;
  error?: string;
}

interface GoalSelectionProps {
  onGoalSelected: (goal: OptimizationGoal) => void;
}

interface StrategySelectionProps {
  goal: OptimizationGoal;
  onStrategySelected: (strategy: OptimizationStrategy) => void;
  onBack: () => void;
}

interface PlanReviewProps {
  plan: OptimizedSkillPlan;
  onBack: () => void;
  onCompareStrategies: () => void;
  onSavePlan: (plan: OptimizedSkillPlan) => void;
}

interface ComparisonViewProps {
  comparison: SkillPlanComparison;
  onBack: () => void;
  onSelectPlan: (plan: OptimizedSkillPlan) => void;
}

const SkillPlanner: React.FC = () => {
  const [state, setState] = useState<SkillPlannerState>({
    step: 'goal_selection',
    generatedPlans: [],
    loading: false
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [characterSkills, setCharacterSkills] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Load ships data
      const shipsData = await window.electronAPI.sde.getShips();
      setShips(shipsData);

      // Load character skills if authenticated
      try {
        const skills = await window.electronAPI.esi.getCharacterSkills(undefined);
        setCharacterSkills(skills);
      } catch (error) {
        console.log('No character skills available - user may not be authenticated');
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
      setState(prev => ({ ...prev, error: 'Failed to load data. Please try again.' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleGoalSelected = (goal: OptimizationGoal) => {
    setState(prev => ({
      ...prev,
      selectedGoal: goal,
      step: 'strategy_selection'
    }));
  };

  const handleStrategySelected = async (strategy: OptimizationStrategy) => {
    if (!state.selectedGoal) return;

    setState(prev => ({ ...prev, selectedStrategy: strategy, loading: true, step: 'plan_generation' }));

    try {
      // Generate optimized skill plan (this would use the actual service)
      // For now, creating mock data
      const mockPlan: OptimizedSkillPlan = {
        id: `plan_${Date.now()}`,
        name: `${state.selectedGoal.type} - ${strategy.name}`,
        description: `Optimized training plan for ${state.selectedGoal.type}`,
        goal: state.selectedGoal,
        strategy,
        totalTrainingTime: 45 * 24 * 60 * 60 * 1000, // 45 days
        totalCost: 150000000, // 150M ISK
        skillSequence: [],
        milestones: [],
        alternativeRoutes: [],
        attributeRecommendations: [],
        implantRecommendations: [],
        costBreakdown: {
          skillBooks: 50000000,
          implants: 100000000,
          total: 150000000,
          costPerDay: 3333333
        },
        riskAssessment: {
          overallRisk: 'Low',
          riskFactors: [],
          mitigationStrategies: []
        },
        progressTracking: {
          currentStep: 0,
          completedSteps: [],
          nextMilestone: {
            name: 'First Milestone',
            description: 'Complete foundational skills',
            trainingTimeFromStart: 0,
            unlockedCapabilities: [],
            skillsCompleted: []
          },
          estimatedCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          actualProgress: []
        }
      };

      setState(prev => ({
        ...prev,
        generatedPlans: [mockPlan],
        loading: false,
        step: 'plan_review'
      }));

    } catch (error) {
      console.error('Failed to generate skill plan:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate skill plan. Please try again.',
        loading: false
      }));
    }
  };

  const handleCompareStrategies = async () => {
    if (!state.selectedGoal) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Generate plans for all strategies (mock data)
      const mockComparison: SkillPlanComparison = {
        plans: state.generatedPlans,
        comparisonMetrics: [
          {
            metric: 'Training Time',
            unit: 'days',
            values: [45, 38, 52, 41, 47],
            interpretation: 'Total time to complete all skills'
          },
          {
            metric: 'Total Cost',
            unit: 'ISK',
            values: [150000000, 75000000, 180000000, 120000000, 90000000],
            interpretation: 'Total ISK investment required'
          }
        ],
        recommendations: [
          'Fastest Completion strategy reduces training time by 15%',
          'Cost Efficient strategy saves 75M ISK',
          'Balanced Progression offers best overall value'
        ],
        bestForScenario: [
          {
            scenario: 'New Player with Limited ISK',
            recommendedPlanId: state.generatedPlans[0]?.id || '',
            reasoning: 'Minimizes upfront costs while maintaining steady progress'
          }
        ]
      };

      setState(prev => ({
        ...prev,
        planComparison: mockComparison,
        loading: false,
        step: 'comparison'
      }));

    } catch (error) {
      console.error('Failed to compare strategies:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to compare strategies. Please try again.',
        loading: false
      }));
    }
  };

  const handleBack = () => {
    setState(prev => {
      switch (prev.step) {
        case 'strategy_selection':
          return { ...prev, step: 'goal_selection', selectedGoal: undefined };
        case 'plan_generation':
        case 'plan_review':
          return { ...prev, step: 'strategy_selection', selectedStrategy: undefined, generatedPlans: [] };
        case 'comparison':
          return { ...prev, step: 'plan_review', planComparison: undefined };
        default:
          return prev;
      }
    });
  };

  const handleSavePlan = (plan: OptimizedSkillPlan) => {
    // Implement plan saving logic
    console.log('Saving plan:', plan.name);
    // Could save to localStorage, electron-store, or backend
  };

  const handleSelectPlan = (plan: OptimizedSkillPlan) => {
    setState(prev => ({
      ...prev,
      generatedPlans: [plan],
      step: 'plan_review'
    }));
  };

  if (state.loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Skill Planner</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              {state.step === 'plan_generation' ? 'Generating optimal skill plan...' : 'Loading skill planner...'}
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
          <h1 className="text-hero">Skill Planner</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {state.error}
            </p>
            <button className="btn btn-primary" onClick={() => setState(prev => ({ ...prev, error: undefined, step: 'goal_selection' }))}>
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
        <div className="skill-planner-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Skill Planner</h1>
          <p className="text-body" style={{ opacity: 0.8 }}>
            Create optimized training plans for your EVE character
          </p>
          
          {/* Progress Indicator */}
          <div className="progress-steps" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: 'var(--space-md)',
            gap: 'var(--space-md)'
          }}>
            {['Goal', 'Strategy', 'Generation', 'Review'].map((stepName, index) => {
              const stepKeys = ['goal_selection', 'strategy_selection', 'plan_generation', 'plan_review'];
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
          </div>
        </div>

        {/* Render current step */}
        {state.step === 'goal_selection' && (
          <GoalSelection onGoalSelected={handleGoalSelected} />
        )}
        
        {state.step === 'strategy_selection' && state.selectedGoal && (
          <StrategySelection 
            goal={state.selectedGoal} 
            onStrategySelected={handleStrategySelected}
            onBack={handleBack}
          />
        )}
        
        {state.step === 'plan_review' && state.generatedPlans[0] && (
          <PlanReview 
            plan={state.generatedPlans[0]}
            onBack={handleBack}
            onCompareStrategies={handleCompareStrategies}
            onSavePlan={handleSavePlan}
          />
        )}
        
        {state.step === 'comparison' && state.planComparison && (
          <ComparisonView 
            comparison={state.planComparison}
            onBack={handleBack}
            onSelectPlan={handleSelectPlan}
          />
        )}
      </div>
    </div>
  );
};

const GoalSelection: React.FC<GoalSelectionProps> = ({ onGoalSelected }) => {
  const [goalType, setGoalType] = useState<'activity' | 'ship' | 'custom'>('activity');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [customSkills, setCustomSkills] = useState<string>('');

  const activities = [
    { id: 'mission_running', name: 'Mission Running', description: 'PvE missions and complexes' },
    { id: 'mining', name: 'Mining & Industry', description: 'Resource extraction and manufacturing' },
    { id: 'pvp', name: 'PvP Combat', description: 'Player vs Player combat' },
    { id: 'exploration', name: 'Exploration', description: 'Scanning and site running' },
    { id: 'trading', name: 'Trading', description: 'Market trading and hauling' }
  ];

  const popularShips = [
    { typeId: 17738, name: 'Raven Navy Issue', group: 'Battleship' },
    { typeId: 17715, name: 'Dominix Navy Issue', group: 'Battleship' },
    { typeId: 17920, name: 'Ishtar', group: 'Heavy Assault Cruiser' },
    { typeId: 17922, name: 'Cerberus', group: 'Heavy Assault Cruiser' },
    { typeId: 17476, name: 'Drake', group: 'Battlecruiser' }
  ];

  const handleSubmit = () => {
    let goal: OptimizationGoal;

    switch (goalType) {
      case 'activity':
        if (!selectedActivity) return;
        goal = {
          type: 'activity',
          activityId: selectedActivity,
          priority: 'High'
        };
        break;
      case 'ship':
        if (!selectedShip) return;
        goal = {
          type: 'ship',
          shipTypeId: parseInt(selectedShip),
          priority: 'High'
        };
        break;
      case 'custom':
        if (!customSkills) return;
        goal = {
          type: 'custom',
          customDescription: customSkills,
          priority: 'Medium'
        };
        break;
      default:
        return;
    }

    onGoalSelected(goal);
  };

  return (
    <div className="goal-selection">
      <h2 className="text-h2" style={{ marginBottom: 'var(--space-lg)' }}>What do you want to train for?</h2>
      
      {/* Goal Type Selection */}
      <div className="goal-type-tabs" style={{ 
        display: 'flex', 
        gap: 'var(--space-md)', 
        marginBottom: 'var(--space-lg)' 
      }}>
        {[
          { id: 'activity', name: 'Activity', icon: '🎯' },
          { id: 'ship', name: 'Specific Ship', icon: '🚀' },
          { id: 'custom', name: 'Custom Goal', icon: '⚙️' }
        ].map(type => (
          <button
            key={type.id}
            className={`goal-type-tab ${goalType === type.id ? 'active' : ''}`}
            onClick={() => setGoalType(type.id as any)}
            style={{
              padding: 'var(--space-md)',
              backgroundColor: goalType === type.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: goalType === type.id ? 'black' : 'white',
              cursor: 'pointer',
              flex: 1,
              textAlign: 'center',
              fontSize: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-xs)' }}>{type.icon}</div>
            {type.name}
          </button>
        ))}
      </div>

      {/* Goal Specific Content */}
      {goalType === 'activity' && (
        <div className="activity-selection">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Select an Activity</h3>
          <div className="activity-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                  borderRadius: '8px',
                  color: selectedActivity === activity.id ? 'black' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{activity.name}</h4>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>{activity.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {goalType === 'ship' && (
        <div className="ship-selection">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Select a Ship</h3>
          <div className="ship-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)'
          }}>
            {popularShips.map(ship => (
              <button
                key={ship.typeId}
                className={`ship-card ${selectedShip === ship.typeId.toString() ? 'selected' : ''}`}
                onClick={() => setSelectedShip(ship.typeId.toString())}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: selectedShip === ship.typeId.toString() ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${selectedShip === ship.typeId.toString() ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: selectedShip === ship.typeId.toString() ? 'black' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{ship.name}</h4>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '12px' }}>{ship.group}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {goalType === 'custom' && (
        <div className="custom-selection">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Describe Your Goal</h3>
          <textarea
            value={customSkills}
            onChange={(e) => setCustomSkills(e.target.value)}
            placeholder="E.g., 'I want to optimize my mining yield' or 'Prepare for level 4 missions'"
            style={{
              width: '100%',
              height: '120px',
              padding: 'var(--space-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Continue Button */}
      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={
            (goalType === 'activity' && !selectedActivity) ||
            (goalType === 'ship' && !selectedShip) ||
            (goalType === 'custom' && !customSkills)
          }
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            fontSize: '18px',
            opacity: (goalType === 'activity' && !selectedActivity) ||
                    (goalType === 'ship' && !selectedShip) ||
                    (goalType === 'custom' && !customSkills) ? 0.5 : 1
          }}
        >
          Continue to Strategy Selection →
        </button>
      </div>
    </div>
  );
};

const StrategySelection: React.FC<StrategySelectionProps> = ({ goal, onStrategySelected, onBack }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy | null>(null);

  return (
    <div className="strategy-selection">
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
        <h2 className="text-h2">Choose Optimization Strategy</h2>
      </div>

      <div className="goal-summary" style={{
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        marginBottom: 'var(--space-lg)'
      }}>
        <h3 style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>Training Goal:</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>
          {goal.type === 'activity' ? `Activity: ${goal.activityId}` :
           goal.type === 'ship' ? `Ship: Type ID ${goal.shipTypeId}` :
           `Custom: ${goal.customDescription}`}
        </p>
      </div>

      <div className="strategy-grid" style={{
        display: 'grid',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        {OPTIMIZATION_STRATEGIES.map(strategy => (
          <button
            key={strategy.id}
            className={`strategy-card ${selectedStrategy?.id === strategy.id ? 'selected' : ''}`}
            onClick={() => setSelectedStrategy(strategy)}
            style={{
              padding: 'var(--space-lg)',
              backgroundColor: selectedStrategy?.id === strategy.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${selectedStrategy?.id === strategy.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '12px',
              color: selectedStrategy?.id === strategy.id ? 'black' : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 'var(--space-sm)' }}>{strategy.name}</h3>
            <p style={{ margin: 0, marginBottom: 'var(--space-md)', opacity: 0.8 }}>{strategy.description}</p>
            <div className="considerations">
              <h4 style={{ margin: 0, marginBottom: 'var(--space-xs)', fontSize: '14px' }}>Key Features:</h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
                {strategy.considerations.map((consideration, index) => (
                  <li key={index} style={{ fontSize: '13px', opacity: 0.7, marginBottom: '2px' }}>
                    {consideration}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => selectedStrategy && onStrategySelected(selectedStrategy)}
          disabled={!selectedStrategy}
          style={{
            padding: 'var(--space-md) var(--space-xl)',
            fontSize: '18px',
            opacity: !selectedStrategy ? 0.5 : 1
          }}
        >
          Generate Skill Plan →
        </button>
      </div>
    </div>
  );
};

const PlanReview: React.FC<PlanReviewProps> = ({ plan, onBack, onCompareStrategies, onSavePlan }) => {
  const formatTime = (milliseconds: number): string => {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}d ${hours}h`;
  };

  const formatISK = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ISK`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K ISK`;
    }
    return `${amount} ISK`;
  };

  return (
    <div className="plan-review">
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
          <h2 className="text-h2">{plan.name}</h2>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-secondary" onClick={onCompareStrategies}>
            Compare Strategies
          </button>
          <button className="btn btn-primary" onClick={() => onSavePlan(plan)}>
            Save Plan
          </button>
        </div>
      </div>

      <div className="plan-summary" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <div className="summary-card" style={{
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: 'var(--primary-cyan)' }}>Training Time</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {formatTime(plan.totalTrainingTime)}
          </p>
        </div>
        <div className="summary-card" style={{
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: 'var(--success-green)' }}>Total Cost</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {formatISK(plan.totalCost)}
          </p>
        </div>
        <div className="summary-card" style={{
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: 'var(--warning-orange)' }}>Risk Level</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {plan.riskAssessment.overallRisk}
          </p>
        </div>
        <div className="summary-card" style={{
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: 'var(--info-blue)' }}>Strategy</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {plan.strategy.name}
          </p>
        </div>
      </div>

      <div className="plan-details" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-lg)'
      }}>
        <div className="cost-breakdown">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Cost Breakdown</h3>
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span>Skill Books:</span>
              <span>{formatISK(plan.costBreakdown.skillBooks)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span>Implants:</span>
              <span>{formatISK(plan.costBreakdown.implants)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)', margin: 'var(--space-sm) 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>{formatISK(plan.costBreakdown.total)}</span>
            </div>
          </div>
        </div>

        <div className="milestones">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-md)' }}>Training Milestones</h3>
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            {plan.milestones.length > 0 ? (
              plan.milestones.map((milestone, index) => (
                <div key={index} style={{ marginBottom: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{milestone.name}</span>
                    <span style={{ fontSize: '14px', opacity: 0.7 }}>
                      {formatTime(milestone.trainingTimeFromStart)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
                    {milestone.description}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, opacity: 0.7 }}>No milestones defined for this plan.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
        <p style={{ opacity: 0.8, marginBottom: 'var(--space-md)' }}>
          This plan will help you achieve your training goals efficiently. 
          {plan.strategy.name === 'Fastest Completion' && ' Focus on training time optimization.'}
          {plan.strategy.name === 'Cost Efficient' && ' Minimize ISK investment while making progress.'}
          {plan.strategy.name === 'Balanced Progression' && ' Balance time, cost, and capability unlocks.'}
        </p>
      </div>
    </div>
  );
};

const ComparisonView: React.FC<ComparisonViewProps> = ({ comparison, onBack, onSelectPlan }) => {
  return (
    <div className="comparison-view">
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
        <h2 className="text-h2">Strategy Comparison</h2>
      </div>

      <div className="comparison-metrics" style={{ marginBottom: 'var(--space-lg)' }}>
        {comparison.comparisonMetrics.map((metric, index) => (
          <div key={index} className="metric-comparison" style={{
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            marginBottom: 'var(--space-md)'
          }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-sm)' }}>{metric.metric}</h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8, marginBottom: 'var(--space-sm)' }}>
              {metric.interpretation}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {metric.values.map((value, valueIndex) => (
                <div key={valueIndex} style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  textAlign: 'center',
                  flex: 1
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {typeof value === 'number' ? value.toLocaleString() : value} {metric.unit}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Strategy {valueIndex + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="recommendations" style={{
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        marginBottom: 'var(--space-lg)'
      }}>
        <h3 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>Recommendations</h3>
        <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
          {comparison.recommendations.map((rec, index) => (
            <li key={index} style={{ marginBottom: 'var(--space-xs)' }}>{rec}</li>
          ))}
        </ul>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ opacity: 0.8, marginBottom: 'var(--space-md)' }}>
          Choose the strategy that best fits your playstyle and goals.
        </p>
      </div>
    </div>
  );
};

export default SkillPlanner;