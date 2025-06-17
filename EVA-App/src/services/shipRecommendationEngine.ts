/**
 * Ship Recommendation Engine - AI-powered ship selection for EVE Online
 * Analyzes player skills, activity requirements, and budget to recommend optimal ships
 * Provides intelligent ranking based on effectiveness, accessibility, and cost
 */

import { fittingEffectivenessCalculator, ActivityProfile } from './fittingEffectivenessCalculator';
import { dogmaEngine, SkillSet, ModuleFit } from './dogmaEngine';
import { sdeService } from './sdeService';
import { EVALogger } from '../utils/logger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../utils/errorHandler';

const logger = EVALogger.getLogger('ShipRecommendationEngine');

export interface ShipRecommendation {
  shipTypeID: number;
  shipName: string;
  shipGroup: string;
  shipCategory: string;
  effectiveness: ShipEffectiveness;
  accessibility: ShipAccessibility;
  economics: ShipEconomics;
  fittingVariants: FittingVariant[];
  overallScore: number;
  recommendationReason: string;
  pros: string[];
  cons: string[];
  skillPlan?: SkillPlanSummary;
}

export interface ShipEffectiveness {
  activityScore: number;
  combatRating: number;
  survivabilityRating: number;
  utilityRating: number;
  versatilityScore: number;
  metaLevel: 'excellent' | 'good' | 'average' | 'poor';
}

export interface ShipAccessibility {
  canFlyNow: boolean;
  skillGapDays: number;
  skillGapSP: number;
  criticalSkillsMissing: number;
  accessibilityScore: number;
  trainingComplexity: 'simple' | 'moderate' | 'complex';
}

export interface ShipEconomics {
  hullCost: number;
  averageFittingCost: number;
  totalInvestment: number;
  iskEfficiency: number;
  insuranceValue: number;
  lossRisk: 'low' | 'medium' | 'high';
}

export interface FittingVariant {
  variantID: string;
  variantName: string;
  description: string;
  modules: ModuleFit[];
  effectiveness: number;
  cost: number;
  skillRequirements: SkillSet;
  primaryRole: string;
  tags: string[];
}

export interface SkillPlanSummary {
  totalTrainingTime: number;
  criticalSkills: number;
  optionalSkills: number;
  priorityOrder: string[];
  milestones: TrainingMilestone[];
}

export interface TrainingMilestone {
  name: string;
  skillsRequired: string[];
  trainingTime: number;
  effectivenessGain: number;
  description: string;
}

export interface ShipRecommendationRequest {
  activityID: string;
  currentSkills: SkillSet;
  budget?: number;
  maxTrainingTime?: number;
  preferences?: ShipPreferences;
  excludeShips?: number[];
  includeShips?: number[];
}

export interface ShipPreferences {
  preferredRaces?: ('caldari' | 'gallente' | 'minmatar' | 'amarr')[];
  preferredSizes?: ('frigate' | 'destroyer' | 'cruiser' | 'battlecruiser' | 'battleship')[];
  preferredWeaponTypes?: ('hybrid' | 'projectile' | 'laser' | 'missile' | 'drone')[];
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  playstyle?: 'solo' | 'small_gang' | 'fleet' | 'pve' | 'pvp';
}

export interface ShipDatabase {
  ships: Map<number, ShipData>;
  shipsByGroup: Map<string, number[]>;
  shipsByActivity: Map<string, number[]>;
}

export interface ShipData {
  typeID: number;
  typeName: string;
  groupName: string;
  categoryName: string;
  raceID: number;
  basePrice: number;
  metaLevel: number;
  techLevel: number;
  attributes: Map<number, number>;
  requiredSkills: SkillSet;
  bonuses: ShipBonus[];
}

export interface ShipBonus {
  bonusType: string;
  attributeID: number;
  bonusAmount: number;
  skillID?: number;
  perLevel?: boolean;
}

/**
 * Advanced Ship Recommendation Engine
 * Provides intelligent ship selection based on comprehensive analysis
 */
export class ShipRecommendationEngine {
  private shipDatabase: ShipDatabase = {
    ships: new Map(),
    shipsByGroup: new Map(),
    shipsByActivity: new Map()
  };
  private initialized = false;

  constructor() {
    logger.info('🚀 Initializing Ship Recommendation Engine...');
  }

  /**
   * Initialize ship database and recommendation algorithms
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('🔄 Loading ship database from SDE...');
      
      await this.loadShipDatabase();
      await this.indexShipsByActivity();
      
      this.initialized = true;
      logger.info(`✅ Ship recommendation engine initialized with ${this.shipDatabase.ships.size} ships`);
      
    } catch (error) {
      logger.error('❌ Failed to initialize ship recommendation engine:', error);
      ErrorHandler.handleError(
        'ShipRecommendationEngine',
        'Failed to initialize ship recommendation engine',
        ErrorCategory.INITIALIZATION,
        ErrorSeverity.HIGH,
        error as Error,
        { component: 'ShipRecommendationEngine' }
      );
      throw error;
    }
  }

  /**
   * Get intelligent ship recommendations for a specific activity
   */
  async getShipRecommendations(
    request: ShipRecommendationRequest,
    maxRecommendations: number = 10
  ): Promise<ShipRecommendation[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      logger.info(`🎯 Generating ship recommendations for activity: ${request.activityID}`);
      
      // Get candidate ships for the activity
      const candidateShips = await this.getCandidateShips(request);
      logger.debug(`📋 Found ${candidateShips.length} candidate ships`);

      // Analyze each candidate ship
      const recommendations: ShipRecommendation[] = [];
      
      for (const shipData of candidateShips) {
        try {
          const recommendation = await this.analyzeShipCandidate(shipData, request);
          if (recommendation) {
            recommendations.push(recommendation);
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to analyze ship ${shipData.typeName}:`, error);
        }
      }

      // Sort by overall score and apply filters
      recommendations.sort((a, b) => b.overallScore - a.overallScore);
      
      // Apply budget and training time filters
      const filteredRecommendations = this.applyFilters(recommendations, request);
      
      // Return top recommendations
      const finalRecommendations = filteredRecommendations.slice(0, maxRecommendations);
      
      logger.info(`✅ Generated ${finalRecommendations.length} ship recommendations`);
      logger.info(`🏆 Top recommendation: ${finalRecommendations[0]?.shipName} (${finalRecommendations[0]?.overallScore.toFixed(1)})`);
      
      return finalRecommendations;

    } catch (error) {
      logger.error('❌ Ship recommendation generation failed:', error);
      ErrorHandler.handleError(
        'ShipRecommendationEngine',
        'Ship recommendation generation failed',
        ErrorCategory.CALCULATION,
        ErrorSeverity.HIGH,
        error as Error,
        { activityID: request.activityID }
      );
      throw error;
    }
  }

  /**
   * Get detailed comparison between multiple ships
   */
  async compareShips(
    shipTypeIDs: number[],
    activityID: string,
    skills: SkillSet
  ): Promise<ShipRecommendation[]> {
    const comparisons: ShipRecommendation[] = [];

    for (const shipTypeID of shipTypeIDs) {
      const shipData = this.shipDatabase.ships.get(shipTypeID);
      if (shipData) {
        const request: ShipRecommendationRequest = {
          activityID,
          currentSkills: skills
        };
        
        const recommendation = await this.analyzeShipCandidate(shipData, request);
        if (recommendation) {
          comparisons.push(recommendation);
        }
      }
    }

    return comparisons.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get ship recommendations by budget range
   */
  async getShipsByBudget(
    activityID: string,
    skills: SkillSet,
    budgetRanges: { min: number; max: number }[]
  ): Promise<Map<string, ShipRecommendation[]>> {
    const budgetRecommendations = new Map<string, ShipRecommendation[]>();

    for (const range of budgetRanges) {
      const rangeKey = `${range.min / 1000000}M-${range.max / 1000000}M`;
      
      const request: ShipRecommendationRequest = {
        activityID,
        currentSkills: skills,
        budget: range.max
      };

      const recommendations = await this.getShipRecommendations(request);
      const filteredRecs = recommendations.filter(rec => 
        rec.economics.totalInvestment >= range.min && 
        rec.economics.totalInvestment <= range.max
      );

      budgetRecommendations.set(rangeKey, filteredRecs.slice(0, 5));
    }

    return budgetRecommendations;
  }

  /**
   * Analyze a specific ship candidate
   */
  private async analyzeShipCandidate(
    shipData: ShipData,
    request: ShipRecommendationRequest
  ): Promise<ShipRecommendation | null> {
    try {
      // Calculate ship accessibility
      const accessibility = await this.calculateShipAccessibility(shipData, request.currentSkills);
      
      // Skip ships that require too much training if specified
      if (request.maxTrainingTime && accessibility.skillGapDays > request.maxTrainingTime) {
        return null;
      }

      // Generate fitting variants
      const fittingVariants = await this.generateFittingVariants(
        shipData.typeID,
        request.activityID,
        request.currentSkills
      );

      if (fittingVariants.length === 0) {
        logger.warn(`⚠️ No viable fittings found for ${shipData.typeName}`);
        return null;
      }

      // Calculate effectiveness using best fitting variant
      const bestFitting = fittingVariants[0];
      const effectiveness = await this.calculateShipEffectiveness(
        shipData,
        bestFitting,
        request.activityID,
        request.currentSkills
      );

      // Calculate economics
      const economics = await this.calculateShipEconomics(shipData, fittingVariants);

      // Skip ships over budget
      if (request.budget && economics.totalInvestment > request.budget) {
        return null;
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(effectiveness, accessibility, economics);

      // Generate skill plan if needed
      const skillPlan = !accessibility.canFlyNow 
        ? await this.generateSkillPlan(shipData, request.currentSkills)
        : undefined;

      // Generate recommendation reason and pros/cons
      const { reason, pros, cons } = this.generateRecommendationInsights(
        shipData,
        effectiveness,
        accessibility,
        economics
      );

      return {
        shipTypeID: shipData.typeID,
        shipName: shipData.typeName,
        shipGroup: shipData.groupName,
        shipCategory: shipData.categoryName,
        effectiveness,
        accessibility,
        economics,
        fittingVariants,
        overallScore,
        recommendationReason: reason,
        pros,
        cons,
        skillPlan
      };

    } catch (error) {
      logger.error(`❌ Failed to analyze ship candidate ${shipData.typeName}:`, error);
      return null;
    }
  }

  /**
   * Calculate ship accessibility based on current skills
   */
  private async calculateShipAccessibility(
    shipData: ShipData,
    currentSkills: SkillSet
  ): Promise<ShipAccessibility> {
    let canFlyNow = true;
    let skillGapDays = 0;
    let skillGapSP = 0;
    let criticalSkillsMissing = 0;

    // Check required skills
    for (const [skillID, requiredLevel] of Object.entries(shipData.requiredSkills)) {
      const currentLevel = currentSkills[Number(skillID)] || 0;
      
      if (currentLevel < requiredLevel) {
        canFlyNow = false;
        criticalSkillsMissing++;
        
        // Calculate training time (simplified)
        const trainingTime = this.calculateSkillTrainingTime(
          Number(skillID),
          currentLevel,
          requiredLevel
        );
        
        skillGapDays += trainingTime / (24 * 60); // Convert minutes to days
        skillGapSP += this.calculateSkillSP(Number(skillID), currentLevel, requiredLevel);
      }
    }

    const accessibilityScore = canFlyNow ? 100 : Math.max(0, 100 - (skillGapDays * 2));
    const trainingComplexity: ShipAccessibility['trainingComplexity'] = 
      criticalSkillsMissing <= 2 ? 'simple' :
      criticalSkillsMissing <= 5 ? 'moderate' : 'complex';

    return {
      canFlyNow,
      skillGapDays: Math.ceil(skillGapDays),
      skillGapSP,
      criticalSkillsMissing,
      accessibilityScore,
      trainingComplexity
    };
  }

  /**
   * Calculate ship effectiveness for specific activity
   */
  private async calculateShipEffectiveness(
    shipData: ShipData,
    bestFitting: FittingVariant,
    activityID: string,
    skills: SkillSet
  ): Promise<ShipEffectiveness> {
    // Use fitting effectiveness calculator
    const fittingEffectiveness = await fittingEffectivenessCalculator.calculateFittingEffectiveness(
      shipData.typeID,
      bestFitting.modules,
      skills,
      activityID
    );

    const activityScore = fittingEffectiveness.overallScore;
    const combatRating = fittingEffectiveness.categoryScores.damage;
    const survivabilityRating = fittingEffectiveness.categoryScores.survivability;
    const utilityRating = fittingEffectiveness.categoryScores.utility;
    
    // Calculate versatility by testing across multiple activities
    const versatilityScore = await this.calculateVersatilityScore(shipData.typeID, skills);
    
    const metaLevel: ShipEffectiveness['metaLevel'] = 
      activityScore >= 85 ? 'excellent' :
      activityScore >= 70 ? 'good' :
      activityScore >= 50 ? 'average' : 'poor';

    return {
      activityScore,
      combatRating,
      survivabilityRating,
      utilityRating,
      versatilityScore,
      metaLevel
    };
  }

  /**
   * Calculate ship economics including costs and efficiency
   */
  private async calculateShipEconomics(
    shipData: ShipData,
    fittingVariants: FittingVariant[]
  ): Promise<ShipEconomics> {
    const hullCost = shipData.basePrice || await this.getMarketPrice(shipData.typeID);
    const averageFittingCost = fittingVariants.reduce((sum, variant) => sum + variant.cost, 0) / fittingVariants.length;
    const totalInvestment = hullCost + averageFittingCost;
    
    // Calculate ISK efficiency (performance per ISK)
    const iskEfficiency = fittingVariants[0]?.effectiveness / (totalInvestment / 1000000) || 0;
    
    const insuranceValue = hullCost * 0.4; // Approximate insurance value
    
    const lossRisk: ShipEconomics['lossRisk'] = 
      totalInvestment > 500000000 ? 'high' :
      totalInvestment > 100000000 ? 'medium' : 'low';

    return {
      hullCost,
      averageFittingCost,
      totalInvestment,
      iskEfficiency,
      insuranceValue,
      lossRisk
    };
  }

  /**
   * Generate fitting variants for a ship
   */
  private async generateFittingVariants(
    shipTypeID: number,
    activityID: string,
    skills: SkillSet
  ): Promise<FittingVariant[]> {
    // This would generate different fitting variants
    // For now, returning a placeholder
    return [
      {
        variantID: 'max_dps',
        variantName: 'Maximum DPS',
        description: 'Optimized for highest damage output',
        modules: [], // Would contain actual modules
        effectiveness: 85,
        cost: 50000000,
        skillRequirements: {},
        primaryRole: 'damage',
        tags: ['dps', 'glass_cannon']
      }
    ];
  }

  /**
   * Calculate overall recommendation score
   */
  private calculateOverallScore(
    effectiveness: ShipEffectiveness,
    accessibility: ShipAccessibility,
    economics: ShipEconomics
  ): number {
    // Weighted scoring algorithm
    const effectivenessWeight = 0.4;
    const accessibilityWeight = 0.3;
    const economicsWeight = 0.3;

    const effectivenessScore = effectiveness.activityScore;
    const accessibilityScore = accessibility.accessibilityScore;
    const economicsScore = Math.min(100, economics.iskEfficiency * 10);

    return (
      effectivenessScore * effectivenessWeight +
      accessibilityScore * accessibilityWeight +
      economicsScore * economicsWeight
    );
  }

  // Helper methods
  private async getCandidateShips(request: ShipRecommendationRequest): Promise<ShipData[]> {
    const activityShips = this.shipDatabase.shipsByActivity.get(request.activityID) || [];
    const candidates: ShipData[] = [];

    for (const shipTypeID of activityShips) {
      const shipData = this.shipDatabase.ships.get(shipTypeID);
      if (shipData && this.matchesPreferences(shipData, request.preferences)) {
        candidates.push(shipData);
      }
    }

    return candidates;
  }

  private matchesPreferences(shipData: ShipData, preferences?: ShipPreferences): boolean {
    if (!preferences) return true;

    // Check race preferences
    if (preferences.preferredRaces && preferences.preferredRaces.length > 0) {
      const shipRace = this.getShipRace(shipData.raceID);
      if (!preferences.preferredRaces.includes(shipRace)) {
        return false;
      }
    }

    // Add more preference checks...
    return true;
  }

  private applyFilters(
    recommendations: ShipRecommendation[],
    request: ShipRecommendationRequest
  ): ShipRecommendation[] {
    let filtered = recommendations;

    // Budget filter
    if (request.budget) {
      filtered = filtered.filter(rec => rec.economics.totalInvestment <= request.budget);
    }

    // Training time filter
    if (request.maxTrainingTime) {
      filtered = filtered.filter(rec => rec.accessibility.skillGapDays <= request.maxTrainingTime);
    }

    // Exclude/include filters
    if (request.excludeShips) {
      filtered = filtered.filter(rec => !request.excludeShips!.includes(rec.shipTypeID));
    }

    if (request.includeShips) {
      filtered = filtered.filter(rec => request.includeShips!.includes(rec.shipTypeID));
    }

    return filtered;
  }

  private generateRecommendationInsights(
    shipData: ShipData,
    effectiveness: ShipEffectiveness,
    accessibility: ShipAccessibility,
    economics: ShipEconomics
  ): { reason: string; pros: string[]; cons: string[] } {
    const reason = `${shipData.typeName} offers ${effectiveness.metaLevel} performance for this activity with ${accessibility.trainingComplexity} skill requirements`;
    
    const pros: string[] = [];
    const cons: string[] = [];

    // Add pros based on strengths
    if (effectiveness.combatRating >= 80) pros.push('Excellent damage output');
    if (effectiveness.survivabilityRating >= 80) pros.push('Superior survivability');
    if (accessibility.canFlyNow) pros.push('Can fly immediately');
    if (economics.iskEfficiency >= 8) pros.push('Excellent ISK efficiency');

    // Add cons based on weaknesses
    if (effectiveness.combatRating < 50) cons.push('Limited damage potential');
    if (effectiveness.survivabilityRating < 50) cons.push('Poor survivability');
    if (!accessibility.canFlyNow) cons.push(`Requires ${accessibility.skillGapDays} days of training`);
    if (economics.lossRisk === 'high') cons.push('High investment risk');

    return { reason, pros, cons };
  }

  // Placeholder implementations
  private async loadShipDatabase(): Promise<void> {
    // Would load ships from SDE database
    logger.debug('📊 Loading ship database from SDE');
  }

  private async indexShipsByActivity(): Promise<void> {
    // Would index ships by activity suitability
    logger.debug('🗂️ Indexing ships by activity');
  }

  private calculateSkillTrainingTime(skillID: number, currentLevel: number, targetLevel: number): number {
    // Simplified skill training time calculation
    return (targetLevel - currentLevel) * 24 * 60; // 1 day per level
  }

  private calculateSkillSP(skillID: number, currentLevel: number, targetLevel: number): number {
    // Simplified SP calculation
    return (targetLevel - currentLevel) * 50000; // 50k SP per level
  }

  private async calculateVersatilityScore(shipTypeID: number, skills: SkillSet): Promise<number> {
    // Would test ship across multiple activities
    return 75; // Placeholder
  }

  private async getMarketPrice(typeID: number): Promise<number> {
    // Would query market prices
    return 50000000; // 50M ISK placeholder
  }

  private getShipRace(raceID: number): 'caldari' | 'gallente' | 'minmatar' | 'amarr' {
    const raceMap: { [key: number]: 'caldari' | 'gallente' | 'minmatar' | 'amarr' } = {
      1: 'caldari',
      2: 'minmatar',
      4: 'amarr',
      8: 'gallente'
    };
    return raceMap[raceID] || 'caldari';
  }

  private async generateSkillPlan(shipData: ShipData, currentSkills: SkillSet): Promise<SkillPlanSummary> {
    // Would generate detailed skill plan
    return {
      totalTrainingTime: 30,
      criticalSkills: 3,
      optionalSkills: 2,
      priorityOrder: ['Spaceship Command V', 'Racial Frigate V'],
      milestones: []
    };
  }
}

// Export singleton instance
export const shipRecommendationEngine = new ShipRecommendationEngine();