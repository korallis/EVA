/**
 * Skill Plan Optimization Engine - Advanced algorithms for optimal EVE skill training
 * Generates intelligent training plans considering prerequisites, time efficiency, and effectiveness
 */

import { SkillRequirement, SkillPlan, SkillPlanItem, SkillMilestone, AlternativePath } from './activitySelectionService';
import { PilotSkills, CharacterSkill, CharacterAttributes } from './shipAnalysisService';

export interface OptimizationGoal {
  type: 'activity' | 'ship' | 'skill_set' | 'certificate' | 'custom';
  activityId?: string;
  tierId?: string;
  shipTypeId?: number;
  targetSkills?: SkillTarget[];
  certificateId?: number;
  customDescription?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  deadline?: Date;
}

export interface SkillTarget {
  skillId: number;
  skillName: string;
  targetLevel: number;
  reasoning: string;
  weight: number; // 0-1, importance weighting
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  priorityFunction: (skill: SkillPlanItem, context: OptimizationContext) => number;
  considerations: string[];
}

export interface OptimizationContext {
  currentSkills: CharacterSkill[];
  attributes: CharacterAttributes;
  implants: ImplantBonus[];
  timeConstraints?: TimeConstraint[];
  costConstraints?: CostConstraint[];
  availableRemaps: number;
  currentRemap?: AttributeRemap;
}

export interface ImplantBonus {
  implantId: number;
  implantName: string;
  attributeBonus: AttributeBonus[];
  skillBonuses: SkillBonus[];
}

export interface AttributeBonus {
  attribute: 'intelligence' | 'perception' | 'charisma' | 'willpower' | 'memory';
  bonus: number;
}

export interface SkillBonus {
  skillId: number;
  trainingTimeMultiplier: number;
}

export interface TimeConstraint {
  maxTrainingTime: number; // milliseconds
  description: string;
}

export interface CostConstraint {
  maxSkillBookCost: number;
  maxImplantCost: number;
  description: string;
}

export interface AttributeRemap {
  intelligence: number;
  perception: number;
  charisma: number;
  willpower: number;
  memory: number;
  appliedDate: Date;
}

export interface SkillDependency {
  skillId: number;
  requiredLevel: number;
  dependentSkillId: number;
  dependentLevel: number;
  dependencyType: 'prerequisite' | 'unlock' | 'efficiency' | 'bonus';
}

export interface TrainingTimeCalculation {
  baseSkillPoints: number;
  totalSkillPoints: number;
  primaryAttribute: number;
  secondaryAttribute: number;
  trainingTimeMultiplier: number;
  implantBonuses: number;
  trainingTime: number; // milliseconds
}

export interface SkillPriorityScore {
  skillId: number;
  level: number;
  priority: number; // 0-1000 scale
  reasoning: string[];
  blockers: SkillBlocker[];
  dependencies: SkillDependency[];
  effectiveness: EffectivenessGain[];
}

export interface SkillBlocker {
  skillId: number;
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  blocksWhat: string[];
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface EffectivenessGain {
  category: string;
  description: string;
  percentageGain: number;
  impactScope: string[];
}

export interface OptimizedSkillPlan {
  id: string;
  name: string;
  description: string;
  goal: OptimizationGoal;
  strategy: OptimizationStrategy;
  totalTrainingTime: number;
  totalCost: number;
  skillSequence: OptimizedSkillStep[];
  milestones: SkillMilestone[];
  alternativeRoutes: AlternativeRoute[];
  attributeRecommendations: AttributeRecommendation[];
  implantRecommendations: ImplantRecommendation[];
  costBreakdown: CostBreakdown;
  riskAssessment: RiskAssessment;
  progressTracking: ProgressTracker;
}

export interface OptimizedSkillStep {
  stepNumber: number;
  skillId: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  priority: number;
  trainingTime: number;
  cumulativeTime: number;
  reasoning: string[];
  prerequisites: number[];
  unlocks: string[];
  effectivenessGain: EffectivenessGain[];
  alternatives: SkillAlternative[];
}

export interface SkillAlternative {
  skillId: number;
  skillName: string;
  level: number;
  tradeoff: string;
  efficiencyDifference: number;
}

export interface AlternativeRoute {
  routeId: string;
  name: string;
  description: string;
  timeDifference: number;
  costDifference: number;
  tradeoffs: string[];
  steps: OptimizedSkillStep[];
}

export interface AttributeRecommendation {
  phase: string;
  recommended: AttributeRemap;
  current?: AttributeRemap;
  timeSavings: number;
  reasoning: string;
  optimalFor: string[];
}

export interface ImplantRecommendation {
  implantSlot: number;
  implantId: number;
  implantName: string;
  cost: number;
  timeSavings: number;
  roi: number; // Return on investment
  reasoning: string;
  alternatives: ImplantAlternative[];
}

export interface ImplantAlternative {
  implantId: number;
  implantName: string;
  cost: number;
  timeSavings: number;
  costEfficiency: number;
}

export interface CostBreakdown {
  skillBooks: number;
  implants: number;
  total: number;
  paybackTime?: number;
  costPerDay: number;
}

export interface RiskAssessment {
  overallRisk: 'Low' | 'Medium' | 'High';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  category: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
  probability: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

export interface ProgressTracker {
  currentStep: number;
  completedSteps: number[];
  nextMilestone: SkillMilestone;
  estimatedCompletion: Date;
  actualProgress: TrainingProgress[];
}

export interface TrainingProgress {
  skillId: number;
  targetLevel: number;
  currentProgress: number; // 0-1
  estimatedCompletion: Date;
  actualCompletion?: Date;
  variance: number; // How far off estimates were
}

export interface SkillPlanComparison {
  plans: OptimizedSkillPlan[];
  comparisonMetrics: ComparisonMetric[];
  recommendations: string[];
  bestForScenario: ScenarioRecommendation[];
}

export interface ComparisonMetric {
  metric: string;
  unit: string;
  values: number[];
  interpretation: string;
}

export interface ScenarioRecommendation {
  scenario: string;
  recommendedPlanId: string;
  reasoning: string;
}

/**
 * Core optimization strategies available for skill planning
 */
export const OPTIMIZATION_STRATEGIES: OptimizationStrategy[] = [
  {
    id: 'fastest_completion',
    name: 'Fastest Completion',
    description: 'Minimize total training time to achieve the goal',
    priorityFunction: (skill, context) => {
      // Prioritize by effectiveness gain per training time
      return skill.trainingTime > 0 ? (skill.priority * 100) / skill.trainingTime : 0;
    },
    considerations: [
      'Shortest total training time',
      'May require expensive implants',
      'Optimal attribute remapping',
      'Focus on critical path skills'
    ]
  },
  {
    id: 'cost_efficient',
    name: 'Cost Efficient',
    description: 'Minimize ISK investment while reaching the goal',
    priorityFunction: (skill, context) => {
      // Prioritize skills with highest impact per cost
      const skillBookCost = getSkillBookCost(skill.skillId);
      return skillBookCost > 0 ? (skill.priority * 100) / skillBookCost : skill.priority;
    },
    considerations: [
      'Minimize skill book costs',
      'Avoid expensive implant requirements',
      'Use basic attribute maps',
      'Focus on free prerequisite gains'
    ]
  },
  {
    id: 'balanced_progression',
    name: 'Balanced Progression',
    description: 'Balance training time, cost, and intermediate capabilities',
    priorityFunction: (skill, context) => {
      // Weighted combination of time efficiency and unlock value
      const timeScore = skill.trainingTime > 0 ? skill.priority / skill.trainingTime : 0;
      const unlockScore = 0; // TODO: Add unlocks property to SkillPlanItem interface
      return timeScore * 0.6 + unlockScore * 0.4;
    },
    considerations: [
      'Balanced time and cost',
      'Unlock capabilities incrementally',
      'Reasonable implant investments',
      'Flexible attribute mapping'
    ]
  },
  {
    id: 'milestone_focused',
    name: 'Milestone Focused',
    description: 'Prioritize achieving key milestones and certificates',
    priorityFunction: (skill, context) => {
      // Prioritize skills that unlock major capabilities
      const milestoneValue = skill.impact === 'Access' ? 100 : 
                            skill.impact === 'Performance' ? 60 : 
                            skill.impact === 'Efficiency' ? 40 : 20;
      return skill.priority + milestoneValue;
    },
    considerations: [
      'Unlock major capabilities first',
      'Focus on certificates and roles',
      'Build solid foundation skills',
      'Enable multiple ship options'
    ]
  },
  {
    id: 'skill_point_efficient',
    name: 'Skill Point Efficient',
    description: 'Maximize effectiveness gain per skill point invested',
    priorityFunction: (skill, context) => {
      const skillPoints = calculateSkillPoints(skill.fromLevel, skill.toLevel);
      return skillPoints > 0 ? (skill.priority * 100) / skillPoints : 0;
    },
    considerations: [
      'Maximize bang for skill point buck',
      'Focus on low-hanging fruit',
      'Efficient prerequisite chains',
      'Avoid skill point waste'
    ]
  }
];

/**
 * Skill Plan Optimizer - Main service class for skill plan optimization
 */
export class SkillPlanOptimizer {
  private skillDatabase: Map<number, any> = new Map();
  private dependencyGraph: Map<number, SkillDependency[]> = new Map();
  private optimizationCache: Map<string, OptimizedSkillPlan> = new Map();

  /**
   * Generate an optimized skill plan for a specific goal
   */
  async optimizeSkillPlan(
    goal: OptimizationGoal,
    context: OptimizationContext,
    strategy: OptimizationStrategy = OPTIMIZATION_STRATEGIES[2] // Balanced by default
  ): Promise<OptimizedSkillPlan> {
    const cacheKey = this.generateCacheKey(goal, context, strategy);
    
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    console.log(`🎯 Optimizing skill plan for ${goal.type} with ${strategy.name} strategy`);

    // 1. Determine required skills for the goal
    const requiredSkills = await this.determineRequiredSkills(goal);
    
    // 2. Analyze current skill state and gaps
    const skillGaps = this.analyzeSkillGaps(requiredSkills, context.currentSkills);
    
    // 3. Build dependency graph
    const dependencies = await this.buildDependencyGraph(skillGaps);
    
    // 4. Calculate training times and priorities
    const prioritizedSkills = this.calculateSkillPriorities(skillGaps, dependencies, context, strategy);
    
    // 5. Optimize skill sequence
    const optimizedSequence = this.optimizeSkillSequence(prioritizedSkills, dependencies, context);
    
    // 6. Generate milestones and alternatives
    const milestones = this.generateMilestones(optimizedSequence, goal);
    const alternatives = await this.generateAlternativeRoutes(optimizedSequence, goal, context);
    
    // 7. Create attribute and implant recommendations
    const attributeRecs = this.generateAttributeRecommendations(optimizedSequence, context);
    const implantRecs = this.generateImplantRecommendations(optimizedSequence, context);
    
    // 8. Perform cost and risk analysis
    const costBreakdown = this.calculateCostBreakdown(optimizedSequence, implantRecs);
    const riskAssessment = this.assessRisks(optimizedSequence, goal, context);

    const plan: OptimizedSkillPlan = {
      id: this.generatePlanId(),
      name: this.generatePlanName(goal, strategy),
      description: this.generatePlanDescription(goal, strategy),
      goal,
      strategy,
      totalTrainingTime: optimizedSequence.reduce((total, step) => total + step.trainingTime, 0),
      totalCost: costBreakdown.total,
      skillSequence: optimizedSequence,
      milestones,
      alternativeRoutes: alternatives,
      attributeRecommendations: attributeRecs,
      implantRecommendations: implantRecs,
      costBreakdown,
      riskAssessment,
      progressTracking: this.initializeProgressTracker(optimizedSequence)
    };

    this.optimizationCache.set(cacheKey, plan);
    console.log(`✅ Generated ${optimizedSequence.length}-step skill plan: ${plan.name}`);
    
    return plan;
  }

  /**
   * Compare multiple optimization strategies for the same goal
   */
  async compareOptimizationStrategies(
    goal: OptimizationGoal,
    context: OptimizationContext,
    strategies: OptimizationStrategy[] = OPTIMIZATION_STRATEGIES
  ): Promise<SkillPlanComparison> {
    console.log(`⚖️ Comparing ${strategies.length} optimization strategies`);

    const plans: OptimizedSkillPlan[] = [];
    
    for (const strategy of strategies) {
      try {
        const plan = await this.optimizeSkillPlan(goal, context, strategy);
        plans.push(plan);
      } catch (error) {
        console.warn(`⚠️ Failed to generate plan with strategy ${strategy.name}:`, error);
      }
    }

    const comparisonMetrics = this.calculateComparisonMetrics(plans);
    const recommendations = this.generateComparisonRecommendations(plans);
    const scenarioRecs = this.generateScenarioRecommendations(plans);

    return {
      plans,
      comparisonMetrics,
      recommendations,
      bestForScenario: scenarioRecs
    };
  }

  /**
   * Update an existing skill plan based on character progress
   */
  async updateSkillPlan(
    planId: string,
    currentProgress: TrainingProgress[],
    context: OptimizationContext
  ): Promise<OptimizedSkillPlan> {
    console.log(`🔄 Updating skill plan ${planId} with current progress`);

    // Find the existing plan
    const existingPlan = Array.from(this.optimizationCache.values())
      .find(plan => plan.id === planId);
    
    if (!existingPlan) {
      throw new Error(`Skill plan ${planId} not found`);
    }

    // Update progress tracking
    const updatedProgress = this.updateProgressTracking(existingPlan.progressTracking, currentProgress);
    
    // Re-optimize remaining skills if significant deviation detected
    const needsReoptimization = this.shouldReoptimize(existingPlan, currentProgress);
    
    if (needsReoptimization) {
      console.log('📊 Significant deviation detected, re-optimizing plan');
      return this.optimizeSkillPlan(existingPlan.goal, context, existingPlan.strategy);
    }

    // Return updated plan
    return {
      ...existingPlan,
      progressTracking: updatedProgress
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private generateCacheKey(goal: OptimizationGoal, context: OptimizationContext, strategy: OptimizationStrategy): string {
    const goalKey = `${goal.type}-${goal.activityId || ''}-${goal.shipTypeId || ''}-${goal.priority}`;
    const contextKey = `${context.currentSkills.length}-${context.attributes.intelligence}-${context.implants.length}`;
    const strategyKey = strategy.id;
    return `${goalKey}:${contextKey}:${strategyKey}`;
  }

  private async determineRequiredSkills(goal: OptimizationGoal): Promise<SkillRequirement[]> {
    switch (goal.type) {
      case 'activity':
        return this.getActivityRequiredSkills(goal.activityId!, goal.tierId);
      case 'ship':
        return this.getShipRequiredSkills(goal.shipTypeId!);
      case 'skill_set':
        return this.convertTargetsToRequirements(goal.targetSkills!);
      case 'certificate':
        return this.getCertificateRequiredSkills(goal.certificateId!);
      default:
        return [];
    }
  }

  private async getActivityRequiredSkills(activityId: string, tierId?: string): Promise<SkillRequirement[]> {
    // This would query the activity selection service
    // For now, returning placeholder data
    return [];
  }

  private async getShipRequiredSkills(shipTypeId: number): Promise<SkillRequirement[]> {
    try {
      const requirements = await window.electronAPI.sde.getSkillRequirements(shipTypeId);
      return requirements.map(req => ({
        skillId: req.skillId,
        skillName: req.skillName,
        minimumLevel: req.requiredLevel,
        recommendedLevel: Math.min(5, req.requiredLevel + 1),
        priority: req.requiredLevel >= 4 ? 'High' : 'Medium',
        impact: 'Access',
        description: `Required to fly ship type ${shipTypeId}`
      }));
    } catch (error) {
      console.warn(`Failed to get skill requirements for ship ${shipTypeId}:`, error);
      return [];
    }
  }

  private convertTargetsToRequirements(targets: SkillTarget[]): SkillRequirement[] {
    return targets.map(target => ({
      skillId: target.skillId,
      skillName: target.skillName,
      minimumLevel: target.targetLevel,
      recommendedLevel: target.targetLevel,
      priority: 'High',
      impact: 'Performance',
      description: target.reasoning
    }));
  }

  private async getCertificateRequiredSkills(certificateId: number): Promise<SkillRequirement[]> {
    // This would query certificate requirements from SDE
    return [];
  }

  private analyzeSkillGaps(required: SkillRequirement[], current: CharacterSkill[]): SkillTarget[] {
    const gaps: SkillTarget[] = [];

    for (const req of required) {
      const currentSkill = current.find(s => s.skillId === req.skillId);
      const currentLevel = currentSkill?.trainedLevel || 0;

      if (currentLevel < req.recommendedLevel) {
        gaps.push({
          skillId: req.skillId,
          skillName: req.skillName,
          targetLevel: req.recommendedLevel,
          reasoning: req.description,
          weight: this.calculateSkillWeight(req)
        });
      }
    }

    return gaps;
  }

  private calculateSkillWeight(requirement: SkillRequirement): number {
    const priorityWeights = { 'Critical': 1.0, 'High': 0.8, 'Medium': 0.6, 'Low': 0.4 };
    const impactWeights = { 'Access': 1.0, 'Performance': 0.8, 'Efficiency': 0.6, 'Safety': 0.4 };
    
    return (priorityWeights[requirement.priority] || 0.5) * (impactWeights[requirement.impact] || 0.5);
  }

  private async buildDependencyGraph(skills: SkillTarget[]): Promise<Map<number, SkillDependency[]>> {
    const graph = new Map<number, SkillDependency[]>();

    for (const skill of skills) {
      try {
        const requirements = await window.electronAPI.sde.getSkillRequirements(skill.skillId);
        const dependencies: SkillDependency[] = requirements.map(req => ({
          skillId: req.skillId,
          requiredLevel: req.requiredLevel,
          dependentSkillId: skill.skillId,
          dependentLevel: skill.targetLevel,
          dependencyType: 'prerequisite'
        }));
        
        graph.set(skill.skillId, dependencies);
      } catch (error) {
        console.warn(`Failed to get dependencies for skill ${skill.skillId}:`, error);
        graph.set(skill.skillId, []);
      }
    }

    return graph;
  }

  private calculateSkillPriorities(
    skills: SkillTarget[],
    dependencies: Map<number, SkillDependency[]>,
    context: OptimizationContext,
    strategy: OptimizationStrategy
  ): SkillPriorityScore[] {
    return skills.map(skill => {
      const currentSkill = context.currentSkills.find(s => s.skillId === skill.skillId);
      const currentLevel = currentSkill?.trainedLevel || 0;
      
      const trainingTime = this.calculateTrainingTime(
        skill.skillId,
        currentLevel,
        skill.targetLevel,
        context.attributes,
        context.implants
      );

      const mockSkillItem: SkillPlanItem = {
        skillId: skill.skillId,
        skillName: skill.skillName,
        fromLevel: currentLevel,
        toLevel: skill.targetLevel,
        trainingTime: trainingTime.trainingTime,
        priority: skill.weight * 100,
        prerequisiteIds: [],
        impact: 'Performance',
        reasoning: skill.reasoning
      };

      const priority = strategy.priorityFunction(mockSkillItem, context);

      return {
        skillId: skill.skillId,
        level: skill.targetLevel,
        priority,
        reasoning: [skill.reasoning],
        blockers: [],
        dependencies: dependencies.get(skill.skillId) || [],
        effectiveness: []
      };
    });
  }

  private optimizeSkillSequence(
    prioritizedSkills: SkillPriorityScore[],
    dependencies: Map<number, SkillDependency[]>,
    context: OptimizationContext
  ): OptimizedSkillStep[] {
    const sequence: OptimizedSkillStep[] = [];
    const completed = new Set<string>();
    let cumulativeTime = 0;

    // Sort by priority
    const sortedSkills = [...prioritizedSkills].sort((a, b) => b.priority - a.priority);

    for (let i = 0; i < sortedSkills.length; i++) {
      const skill = sortedSkills[i];
      const currentSkill = context.currentSkills.find(s => s.skillId === skill.skillId);
      const currentLevel = currentSkill?.trainedLevel || 0;

      const trainingTime = this.calculateTrainingTime(
        skill.skillId,
        currentLevel,
        skill.level,
        context.attributes,
        context.implants
      );

      const step: OptimizedSkillStep = {
        stepNumber: i + 1,
        skillId: skill.skillId,
        skillName: this.getSkillName(skill.skillId),
        fromLevel: currentLevel,
        toLevel: skill.level,
        priority: skill.priority,
        trainingTime: trainingTime.trainingTime,
        cumulativeTime: cumulativeTime + trainingTime.trainingTime,
        reasoning: skill.reasoning,
        prerequisites: [],
        unlocks: [],
        effectivenessGain: skill.effectiveness,
        alternatives: []
      };

      sequence.push(step);
      cumulativeTime += trainingTime.trainingTime;
      completed.add(`${skill.skillId}-${skill.level}`);
    }

    return sequence;
  }

  private calculateTrainingTime(
    skillId: number,
    fromLevel: number,
    toLevel: number,
    attributes: CharacterAttributes,
    implants: ImplantBonus[]
  ): TrainingTimeCalculation {
    // Get skill training multiplier (simplified)
    const skillMultiplier = this.getSkillTrainingMultiplier(skillId);
    
    // Calculate total skill points needed
    const totalSP = this.calculateSkillPointsForRange(fromLevel, toLevel, skillMultiplier);
    
    // Get primary and secondary attributes (simplified)
    const primaryAttr = attributes.willpower;
    const secondaryAttr = attributes.perception;
    
    // Calculate implant bonuses
    const implantBonus = this.calculateImplantBonus(skillId, implants);
    
    // Training time formula: SP / (primaryAttr + secondaryAttr/2) per minute
    const baseTrainingRate = primaryAttr + (secondaryAttr / 2);
    const modifiedTrainingRate = baseTrainingRate * (1 + implantBonus);
    const trainingTimeMinutes = totalSP / modifiedTrainingRate;
    const trainingTime = trainingTimeMinutes * 60 * 1000; // Convert to milliseconds

    return {
      baseSkillPoints: totalSP,
      totalSkillPoints: totalSP,
      primaryAttribute: primaryAttr,
      secondaryAttribute: secondaryAttr,
      trainingTimeMultiplier: skillMultiplier,
      implantBonuses: implantBonus,
      trainingTime
    };
  }

  private getSkillTrainingMultiplier(skillId: number): number {
    // Most skills have a 2x multiplier, some have different values
    // This would be queried from SDE
    return 2.0;
  }

  private calculateSkillPointsForRange(fromLevel: number, toLevel: number, multiplier: number): number {
    const spForLevel = [0, 250, 1414, 8000, 45255, 256000];
    
    let totalSP = 0;
    for (let level = fromLevel + 1; level <= toLevel; level++) {
      if (level <= 5) {
        totalSP += spForLevel[level] * multiplier;
      }
    }
    
    return totalSP;
  }

  private calculateImplantBonus(skillId: number, implants: ImplantBonus[]): number {
    // Calculate training time bonus from relevant implants
    let bonus = 0;
    
    for (const implant of implants) {
      for (const skillBonus of implant.skillBonuses) {
        if (skillBonus.skillId === skillId) {
          bonus += (1 - skillBonus.trainingTimeMultiplier);
        }
      }
    }
    
    return bonus;
  }

  private getSkillName(skillId: number): string {
    // This would be queried from SDE
    return `Skill ${skillId}`;
  }

  private generateMilestones(sequence: OptimizedSkillStep[], goal: OptimizationGoal): SkillMilestone[] {
    const milestones: SkillMilestone[] = [];
    
    // Create milestones at 25%, 50%, 75%, and 100% completion
    const totalTime = sequence[sequence.length - 1]?.cumulativeTime || 0;
    const milestonePoints = [0.25, 0.5, 0.75, 1.0];
    
    for (const point of milestonePoints) {
      const targetTime = totalTime * point;
      const stepIndex = sequence.findIndex(step => step.cumulativeTime >= targetTime);
      
      if (stepIndex >= 0) {
        milestones.push({
          name: `${Math.round(point * 100)}% Complete`,
          description: `Completed ${stepIndex + 1} of ${sequence.length} skills`,
          trainingTimeFromStart: targetTime,
          unlockedCapabilities: [],
          skillsCompleted: sequence.slice(0, stepIndex + 1).map(step => step.skillId)
        });
      }
    }
    
    return milestones;
  }

  // Placeholder implementations for remaining methods
  private async generateAlternativeRoutes(sequence: OptimizedSkillStep[], goal: OptimizationGoal, context: OptimizationContext): Promise<AlternativeRoute[]> {
    return [];
  }

  private generateAttributeRecommendations(sequence: OptimizedSkillStep[], context: OptimizationContext): AttributeRecommendation[] {
    return [];
  }

  private generateImplantRecommendations(sequence: OptimizedSkillStep[], context: OptimizationContext): ImplantRecommendation[] {
    return [];
  }

  private calculateCostBreakdown(sequence: OptimizedSkillStep[], implants: ImplantRecommendation[]): CostBreakdown {
    return {
      skillBooks: 50000000,
      implants: 100000000,
      total: 150000000,
      costPerDay: 1000000
    };
  }

  private assessRisks(sequence: OptimizedSkillStep[], goal: OptimizationGoal, context: OptimizationContext): RiskAssessment {
    return {
      overallRisk: 'Low',
      riskFactors: [],
      mitigationStrategies: []
    };
  }

  private initializeProgressTracker(sequence: OptimizedSkillStep[]): ProgressTracker {
    return {
      currentStep: 0,
      completedSteps: [],
      nextMilestone: {
        name: 'First Milestone',
        description: 'Complete first set of skills',
        trainingTimeFromStart: 0,
        unlockedCapabilities: [],
        skillsCompleted: []
      },
      estimatedCompletion: new Date(),
      actualProgress: []
    };
  }

  private calculateComparisonMetrics(plans: OptimizedSkillPlan[]): ComparisonMetric[] {
    return [
      {
        metric: 'Training Time',
        unit: 'days',
        values: plans.map(p => p.totalTrainingTime / (24 * 60 * 60 * 1000)),
        interpretation: 'Total time to complete all skills'
      },
      {
        metric: 'Total Cost',
        unit: 'ISK',
        values: plans.map(p => p.totalCost),
        interpretation: 'Total ISK investment required'
      }
    ];
  }

  private generateComparisonRecommendations(plans: OptimizedSkillPlan[]): string[] {
    return [
      'Fastest plan reduces training time by 30%',
      'Cost-efficient plan saves 200M ISK',
      'Balanced plan offers best overall value'
    ];
  }

  private generateScenarioRecommendations(plans: OptimizedSkillPlan[]): ScenarioRecommendation[] {
    return [
      {
        scenario: 'New Player with Limited ISK',
        recommendedPlanId: plans[0]?.id || '',
        reasoning: 'Minimizes upfront costs while maintaining progress'
      }
    ];
  }

  private updateProgressTracking(existing: ProgressTracker, current: TrainingProgress[]): ProgressTracker {
    return existing; // Placeholder
  }

  private shouldReoptimize(plan: OptimizedSkillPlan, progress: TrainingProgress[]): boolean {
    return false; // Placeholder
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlanName(goal: OptimizationGoal, strategy: OptimizationStrategy): string {
    return `${goal.type} - ${strategy.name}`;
  }

  private generatePlanDescription(goal: OptimizationGoal, strategy: OptimizationStrategy): string {
    return `Optimized training plan for ${goal.type} using ${strategy.name} strategy`;
  }
}

// Helper functions
function getSkillBookCost(skillId: number): number {
  // This would be queried from market data or SDE
  return 5000000; // 5M ISK default
}

function calculateSkillPoints(fromLevel: number, toLevel: number): number {
  const spForLevel = [0, 250, 1414, 8000, 45255, 256000];
  let totalSP = 0;
  
  for (let level = fromLevel + 1; level <= toLevel; level++) {
    if (level <= 5) {
      totalSP += spForLevel[level] * 2; // Assume 2x multiplier
    }
  }
  
  return totalSP;
}

// Export service instance
export const skillPlanOptimizer = new SkillPlanOptimizer();