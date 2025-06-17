/**
 * Recommendation Orchestrator - Central hub for all EVA recommendation systems
 * Coordinates ship recommendations, fitting optimization, and skill planning
 * Provides unified API for recommendation features across the application
 */

import { shipRecommendationEngine, ShipRecommendation, ShipRecommendationRequest } from './shipRecommendationEngine';
import { fittingEffectivenessCalculator, FittingEffectiveness } from './fittingEffectivenessCalculator';
import { dogmaEngine, SkillSet, ModuleFit } from './dogmaEngine';
import { stackingPenaltyEngine, StackingAnalysis } from './stackingPenaltyEngine';
import { sdeService } from './sdeService';
import { recommendationCache, RecommendationCache, CacheInvalidation } from './recommendationCache';
import { EVALogger } from '../utils/logger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../utils/errorHandler';

const logger = EVALogger.getLogger('RecommendationOrchestrator');

export interface UnifiedRecommendationRequest {
  characterID: number;
  activityID: string;
  currentSkills: SkillSet;
  preferences?: RecommendationPreferences;
  constraints?: RecommendationConstraints;
  analysisDepth?: 'quick' | 'standard' | 'comprehensive';
}

export interface RecommendationPreferences {
  budget?: number;
  maxTrainingTime?: number;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  playstyle?: 'solo' | 'small_gang' | 'fleet';
  preferredRaces?: string[];
  preferredShipSizes?: string[];
}

export interface RecommendationConstraints {
  excludeShips?: number[];
  includeShips?: number[];
  maxShipCost?: number;
  maxFittingCost?: number;
  requiredFeatures?: string[];
}

export interface ComprehensiveRecommendation {
  summary: RecommendationSummary;
  shipRecommendations: ShipRecommendation[];
  fittingAnalysis: FittingAnalysisResult[];
  skillPlan: SkillPlanRecommendation;
  marketInsights: MarketInsights;
  performance: PerformanceMetrics;
  alternatives: AlternativeRecommendations;
}

export interface RecommendationSummary {
  topRecommendation: ShipRecommendation;
  keyInsights: string[];
  immediateActions: string[];
  longTermGoals: string[];
  estimatedTimeToOptimal: number;
  estimatedCost: number;
}

export interface FittingAnalysisResult {
  shipTypeID: number;
  shipName: string;
  fittingVariants: FittingVariantAnalysis[];
  stackingAnalysis: StackingAnalysis;
  optimizationSuggestions: string[];
}

export interface FittingVariantAnalysis {
  variantName: string;
  modules: ModuleFit[];
  effectiveness: FittingEffectiveness;
  cost: number;
  skillRequirements: SkillSet;
  pros: string[];
  cons: string[];
}

export interface SkillPlanRecommendation {
  immediate: SkillPlanPhase;
  shortTerm: SkillPlanPhase;
  longTerm: SkillPlanPhase;
  alternatives: SkillPlanAlternative[];
  totalInvestment: SkillInvestment;
}

export interface SkillPlanPhase {
  name: string;
  description: string;
  skills: SkillTrainingItem[];
  duration: number;
  effectivenessGain: number;
  milestones: string[];
}

export interface SkillTrainingItem {
  skillID: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  trainingTime: number;
  skillPoints: number;
  priority: number;
  reasoning: string;
}

export interface SkillPlanAlternative {
  name: string;
  description: string;
  tradeoffs: string[];
  duration: number;
  effectiveness: number;
}

export interface SkillInvestment {
  totalTrainingTime: number;
  totalSkillPoints: number;
  phases: number;
  criticalSkills: number;
  optionalSkills: number;
}

export interface MarketInsights {
  costAnalysis: CostAnalysis;
  priceAlerts: PriceAlert[];
  budgetOptimization: BudgetOptimization[];
  investmentRisk: InvestmentRisk;
}

export interface CostAnalysis {
  shipCosts: { [shipTypeID: number]: number };
  fittingCosts: { [variantName: string]: number };
  totalInvestmentRange: { min: number; max: number };
  costEfficiencyRanking: Array<{ shipTypeID: number; efficiency: number }>;
}

export interface PriceAlert {
  itemTypeID: number;
  itemName: string;
  currentPrice: number;
  recommendedPrice: number;
  savings: number;
  alertType: 'buy_now' | 'wait' | 'alternative_available';
}

export interface BudgetOptimization {
  budgetTier: string;
  recommendedShips: number[];
  costSavings: number;
  performanceImpact: number;
  description: string;
}

export interface InvestmentRisk {
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  mitigation: string[];
  insuranceRecommendation: boolean;
}

export interface AlternativeRecommendations {
  budgetAlternatives: ShipRecommendation[];
  skillAlternatives: ShipRecommendation[];
  playstyleAlternatives: ShipRecommendation[];
  futureUpgrades: ShipRecommendation[];
}

export interface PerformanceMetrics {
  calculationTime: number;
  shipsAnalyzed: number;
  fittingsGenerated: number;
  cacheHitRate: number;
  accuracy: number;
}

/**
 * Central Recommendation Orchestrator
 * Coordinates all recommendation systems for unified analysis
 */
export class RecommendationOrchestrator {
  private initialized = false;
  private cache = recommendationCache;
  private performanceMetrics: PerformanceMetrics = {
    calculationTime: 0,
    shipsAnalyzed: 0,
    fittingsGenerated: 0,
    cacheHitRate: 0,
    accuracy: 0
  };

  constructor() {
    logger.info('🎭 Initializing Recommendation Orchestrator...');
  }

  /**
   * Initialize all recommendation subsystems
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('🔄 Initializing recommendation subsystems...');
      
      const startTime = Date.now();
      
      // Initialize all subsystems in parallel
      await Promise.all([
        shipRecommendationEngine.initialize(),
        fittingEffectivenessCalculator.initialize(),
        stackingPenaltyEngine.initialize()
      ]);
      
      const initTime = Date.now() - startTime;
      logger.info(`✅ Recommendation orchestrator initialized in ${initTime}ms`);
      
      this.initialized = true;
      
    } catch (error) {
      logger.error('❌ Failed to initialize recommendation orchestrator:', error);
      ErrorHandler.handleError(
        'RecommendationOrchestrator',
        'Failed to initialize recommendation orchestrator',
        ErrorCategory.INITIALIZATION,
        ErrorSeverity.CRITICAL,
        error as Error,
        { component: 'RecommendationOrchestrator' }
      );
      throw error;
    }
  }

  /**
   * Generate comprehensive recommendations for an activity
   * Main entry point for all recommendation features
   */
  async generateComprehensiveRecommendations(
    request: UnifiedRecommendationRequest
  ): Promise<ComprehensiveRecommendation> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      logger.info(`🎯 Generating comprehensive recommendations for character ${request.characterID}, activity: ${request.activityID}`);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get<ComprehensiveRecommendation>(cacheKey);
      if (cached) {
        logger.debug('📋 Returning cached recommendation');
        this.performanceMetrics.cacheHitRate++;
        return cached;
      }

      // Generate ship recommendations
      logger.debug('🚀 Generating ship recommendations...');
      const shipRequest: ShipRecommendationRequest = {
        activityID: request.activityID,
        currentSkills: request.currentSkills,
        budget: request.preferences?.budget,
        maxTrainingTime: request.preferences?.maxTrainingTime,
        excludeShips: request.constraints?.excludeShips,
        includeShips: request.constraints?.includeShips
      };
      
      const shipRecommendations = await shipRecommendationEngine.getShipRecommendations(shipRequest, 10);
      this.performanceMetrics.shipsAnalyzed += shipRecommendations.length;

      // Generate fitting analysis for top ships
      logger.debug('⚙️ Analyzing fittings...');
      const fittingAnalysis = await this.generateFittingAnalysis(
        shipRecommendations.slice(0, 5), // Analyze top 5 ships
        request
      );

      // Generate skill plan recommendations
      logger.debug('🎓 Generating skill plan...');
      const skillPlan = await this.generateSkillPlanRecommendation(
        shipRecommendations,
        request.currentSkills,
        request.activityID
      );

      // Generate market insights
      logger.debug('💰 Analyzing market data...');
      const marketInsights = await this.generateMarketInsights(
        shipRecommendations,
        request.preferences?.budget
      );

      // Generate alternatives
      logger.debug('🔄 Finding alternatives...');
      const alternatives = await this.generateAlternativeRecommendations(
        shipRecommendations,
        request
      );

      // Create summary
      const summary = this.createRecommendationSummary(
        shipRecommendations,
        skillPlan,
        marketInsights
      );

      // Calculate performance metrics
      const calculationTime = Date.now() - startTime;
      this.performanceMetrics.calculationTime = calculationTime;

      const result: ComprehensiveRecommendation = {
        summary,
        shipRecommendations,
        fittingAnalysis,
        skillPlan,
        marketInsights,
        performance: { ...this.performanceMetrics, calculationTime },
        alternatives
      };

      // Cache the result
      this.cache.set(cacheKey, result, undefined, ['recommendations', 'ships', 'skills']);
      
      logger.info(`✅ Comprehensive recommendations generated in ${calculationTime}ms`);
      logger.info(`🏆 Top recommendation: ${summary.topRecommendation.shipName} (${summary.topRecommendation.overallScore.toFixed(1)})`);
      
      return result;

    } catch (error) {
      logger.error('❌ Comprehensive recommendation generation failed:', error);
      ErrorHandler.handleError(
        'RecommendationOrchestrator',
        'Comprehensive recommendation generation failed',
        ErrorCategory.CALCULATION,
        ErrorSeverity.HIGH,
        error as Error,
        { 
          characterID: request.characterID,
          activityID: request.activityID,
          calculationTime: Date.now() - startTime
        }
      );
      throw error;
    }
  }

  /**
   * Quick ship recommendations for immediate decisions
   */
  async getQuickShipRecommendations(
    activityID: string,
    skills: SkillSet,
    budget?: number
  ): Promise<ShipRecommendation[]> {
    logger.info(`⚡ Generating quick ship recommendations for ${activityID}`);
    
    const request: ShipRecommendationRequest = {
      activityID,
      currentSkills: skills,
      budget
    };

    return await shipRecommendationEngine.getShipRecommendations(request, 5);
  }

  /**
   * Analyze specific fitting for optimization
   */
  async analyzeFitting(
    shipTypeID: number,
    modules: ModuleFit[],
    skills: SkillSet,
    activityID: string
  ): Promise<{
    effectiveness: FittingEffectiveness;
    stackingAnalysis: StackingAnalysis;
    recommendations: string[];
  }> {
    logger.info(`🔍 Analyzing fitting for ship ${shipTypeID}`);

    // Calculate effectiveness
    const effectiveness = await fittingEffectivenessCalculator.calculateFittingEffectiveness(
      shipTypeID,
      modules,
      skills,
      activityID
    );

    // Analyze stacking penalties
    const stackableModules = modules.map(module => ({
      moduleTypeID: module.typeID,
      moduleName: `Module ${module.typeID}`,
      effectID: 1, // Simplified
      stackingGroupID: 1, // Simplified
      bonusAmount: 10, // Simplified
      attributeID: 64 // Simplified
    }));

    const stackingAnalysis = stackingPenaltyEngine.calculateStackingPenalties(stackableModules);

    // Generate recommendations
    const recommendations = [
      ...effectiveness.recommendations,
      ...stackingAnalysis.recommendations
    ];

    return {
      effectiveness,
      stackingAnalysis,
      recommendations
    };
  }

  /**
   * Compare multiple ships for an activity
   */
  async compareShipsForActivity(
    shipTypeIDs: number[],
    activityID: string,
    skills: SkillSet
  ): Promise<ShipRecommendation[]> {
    logger.info(`⚖️ Comparing ${shipTypeIDs.length} ships for ${activityID}`);
    
    return await shipRecommendationEngine.compareShips(shipTypeIDs, activityID, skills);
  }

  /**
   * Get recommendations by budget tiers
   */
  async getRecommendationsByBudget(
    activityID: string,
    skills: SkillSet,
    budgetTiers: number[]
  ): Promise<Map<string, ShipRecommendation[]>> {
    logger.info(`💰 Generating budget-tiered recommendations for ${activityID}`);
    
    const budgetRanges = budgetTiers.map((budget, index) => ({
      min: index === 0 ? 0 : budgetTiers[index - 1],
      max: budget
    }));

    return await shipRecommendationEngine.getShipsByBudget(activityID, skills, budgetRanges);
  }

  // Private helper methods
  private generateCacheKey(request: UnifiedRecommendationRequest): string {
    const skillsHash = RecommendationCache.hashSkills(request.currentSkills);
    return RecommendationCache.generateRecommendationKey(
      request.activityID,
      skillsHash,
      request.preferences?.budget,
      request.preferences
    );
  }

  private async generateFittingAnalysis(
    shipRecommendations: ShipRecommendation[],
    request: UnifiedRecommendationRequest
  ): Promise<FittingAnalysisResult[]> {
    const analysis: FittingAnalysisResult[] = [];

    for (const ship of shipRecommendations) {
      try {
        const variants: FittingVariantAnalysis[] = [];
        
        for (const variant of ship.fittingVariants) {
          const effectiveness = await fittingEffectivenessCalculator.calculateFittingEffectiveness(
            ship.shipTypeID,
            variant.modules,
            request.currentSkills,
            request.activityID
          );

          variants.push({
            variantName: variant.variantName,
            modules: variant.modules,
            effectiveness,
            cost: variant.cost,
            skillRequirements: variant.skillRequirements,
            pros: variant.tags,
            cons: []
          });
        }

        // Analyze stacking for the best variant
        const bestVariant = variants[0];
        const stackableModules = bestVariant?.modules.map(module => ({
          moduleTypeID: module.typeID,
          moduleName: `Module ${module.typeID}`,
          effectID: 1,
          stackingGroupID: 1,
          bonusAmount: 10,
          attributeID: 64
        })) || [];

        const stackingAnalysis = stackingPenaltyEngine.calculateStackingPenalties(stackableModules);

        analysis.push({
          shipTypeID: ship.shipTypeID,
          shipName: ship.shipName,
          fittingVariants: variants,
          stackingAnalysis,
          optimizationSuggestions: stackingAnalysis.recommendations
        });

        this.performanceMetrics.fittingsGenerated += variants.length;

      } catch (error) {
        logger.warn(`⚠️ Failed to analyze fittings for ${ship.shipName}:`, error);
      }
    }

    return analysis;
  }

  private async generateSkillPlanRecommendation(
    shipRecommendations: ShipRecommendation[],
    currentSkills: SkillSet,
    activityID: string
  ): Promise<SkillPlanRecommendation> {
    // Analyze skill requirements from top recommendations
    const topShip = shipRecommendations[0];
    
    // Generate immediate skills (can fly the ship)
    const immediate: SkillPlanPhase = {
      name: 'Immediate Access',
      description: `Skills needed to fly ${topShip?.shipName}`,
      skills: [],
      duration: topShip?.accessibility.skillGapDays || 0,
      effectivenessGain: 50,
      milestones: [`Unlock ${topShip?.shipName}`]
    };

    // Generate short-term skills (optimal performance)
    const shortTerm: SkillPlanPhase = {
      name: 'Optimal Performance',
      description: 'Skills for optimal ship performance',
      skills: [],
      duration: 30,
      effectivenessGain: 25,
      milestones: ['Achieve 90% effectiveness']
    };

    // Generate long-term skills (mastery)
    const longTerm: SkillPlanPhase = {
      name: 'Mastery',
      description: 'Advanced skills for maximum performance',
      skills: [],
      duration: 90,
      effectivenessGain: 15,
      milestones: ['Achieve perfect effectiveness']
    };

    const totalInvestment: SkillInvestment = {
      totalTrainingTime: immediate.duration + shortTerm.duration + longTerm.duration,
      totalSkillPoints: 5000000,
      phases: 3,
      criticalSkills: 5,
      optionalSkills: 10
    };

    return {
      immediate,
      shortTerm,
      longTerm,
      alternatives: [],
      totalInvestment
    };
  }

  private async generateMarketInsights(
    shipRecommendations: ShipRecommendation[],
    budget?: number
  ): Promise<MarketInsights> {
    const shipCosts: { [shipTypeID: number]: number } = {};
    const fittingCosts: { [variantName: string]: number } = {};
    
    shipRecommendations.forEach(ship => {
      shipCosts[ship.shipTypeID] = ship.economics.hullCost;
      ship.fittingVariants.forEach(variant => {
        fittingCosts[variant.variantName] = variant.cost;
      });
    });

    const totalInvestmentRange = {
      min: Math.min(...shipRecommendations.map(s => s.economics.totalInvestment)),
      max: Math.max(...shipRecommendations.map(s => s.economics.totalInvestment))
    };

    const costEfficiencyRanking = shipRecommendations
      .map(ship => ({
        shipTypeID: ship.shipTypeID,
        efficiency: ship.economics.iskEfficiency
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    return {
      costAnalysis: {
        shipCosts,
        fittingCosts,
        totalInvestmentRange,
        costEfficiencyRanking
      },
      priceAlerts: [],
      budgetOptimization: [],
      investmentRisk: {
        riskLevel: 'medium',
        factors: ['Market volatility', 'Ship loss potential'],
        mitigation: ['Insurance', 'Budget management'],
        insuranceRecommendation: true
      }
    };
  }

  private async generateAlternativeRecommendations(
    shipRecommendations: ShipRecommendation[],
    request: UnifiedRecommendationRequest
  ): Promise<AlternativeRecommendations> {
    // Budget alternatives (cheaper options)
    const budgetAlternatives = shipRecommendations
      .filter(ship => ship.economics.totalInvestment < (request.preferences?.budget || Infinity) * 0.5)
      .slice(0, 3);

    // Skill alternatives (easier to train)
    const skillAlternatives = shipRecommendations
      .filter(ship => ship.accessibility.canFlyNow || ship.accessibility.skillGapDays <= 7)
      .slice(0, 3);

    // Playstyle alternatives
    const playstyleAlternatives = shipRecommendations.slice(3, 6);

    // Future upgrades
    const futureUpgrades = shipRecommendations
      .filter(ship => ship.accessibility.skillGapDays > 30)
      .slice(0, 3);

    return {
      budgetAlternatives,
      skillAlternatives,
      playstyleAlternatives,
      futureUpgrades
    };
  }

  private createRecommendationSummary(
    shipRecommendations: ShipRecommendation[],
    skillPlan: SkillPlanRecommendation,
    marketInsights: MarketInsights
  ): RecommendationSummary {
    const topRecommendation = shipRecommendations[0];
    
    const keyInsights = [
      `${topRecommendation.shipName} offers ${topRecommendation.effectiveness.metaLevel} performance`,
      `Training time: ${topRecommendation.accessibility.skillGapDays} days`,
      `Total investment: ${(topRecommendation.economics.totalInvestment / 1000000).toFixed(1)}M ISK`
    ];

    const immediateActions = [
      topRecommendation.accessibility.canFlyNow 
        ? `You can fly ${topRecommendation.shipName} now!`
        : `Start training for ${topRecommendation.shipName}`,
      'Purchase recommended fitting modules',
      'Review skill plan priorities'
    ];

    const longTermGoals = [
      'Achieve optimal ship mastery',
      'Expand to alternative ship options',
      'Optimize fitting costs'
    ];

    return {
      topRecommendation,
      keyInsights,
      immediateActions,
      longTermGoals,
      estimatedTimeToOptimal: skillPlan.totalInvestment.totalTrainingTime,
      estimatedCost: topRecommendation.economics.totalInvestment
    };
  }

  /**
   * Clear recommendation cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('🗑️ Recommendation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}

// Export singleton instance
export const recommendationOrchestrator = new RecommendationOrchestrator();