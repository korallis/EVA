/**
 * Fitting Effectiveness Calculator - Advanced ship fitting analysis
 * Calculates comprehensive effectiveness metrics for different activities
 * Provides multi-dimensional analysis: DPS, Tank, Speed, Cost, Skill Requirements
 */

import { dogmaEngine, ComprehensiveFittingStats, ModuleFit, SkillSet } from './dogmaEngine';
import { stackingPenaltyEngine } from './stackingPenaltyEngine';
import { sdeService } from './sdeService';
import { EVALogger } from '../utils/logger';

const logger = EVALogger.getLogger('FittingEffectivenessCalculator');

export interface ActivityProfile {
  activityID: string;
  activityName: string;
  description: string;
  primaryMetrics: string[];
  secondaryMetrics: string[];
  weightings: EffectivenessWeighting;
  threatProfile: ThreatProfile;
  skillRequirements: SkillRequirement[];
}

export interface EffectivenessWeighting {
  dps: number;
  tank: number;
  speed: number;
  range: number;
  tracking: number;
  capacitor: number;
  cost: number;
  skillAccessibility: number;
}

export interface ThreatProfile {
  expectedDPS: number;
  primaryDamageType: 'em' | 'thermal' | 'kinetic' | 'explosive';
  secondaryDamageType: 'em' | 'thermal' | 'kinetic' | 'explosive';
  averageSignature: number;
  averageSpeed: number;
  engagementRange: number;
}

export interface SkillRequirement {
  skillID: number;
  skillName: string;
  requiredLevel: number;
  priority: 'critical' | 'important' | 'beneficial';
}

export interface FittingEffectiveness {
  overallScore: number;
  categoryScores: {
    damage: number;
    survivability: number;
    mobility: number;
    utility: number;
    cost: number;
    accessibility: number;
  };
  detailedMetrics: DetailedMetrics;
  skillGaps: SkillGap[];
  recommendations: string[];
  comparison: ComparisonMetrics;
}

export interface DetailedMetrics {
  // Combat effectiveness
  effectiveDPS: number;
  appliedDPS: number;
  burstDPS: number;
  sustainedDPS: number;
  
  // Survivability
  effectiveHP: number;
  sustainableTank: number;
  peakTank: number;
  ehpPerSecond: number;
  
  // Mobility
  alignTime: number;
  maxVelocity: number;
  agility: number;
  warpSpeed: number;
  
  // Utility
  cargoCapacity: number;
  scanResolution: number;
  maxTargets: number;
  droneCapacity: number;
  
  // Economics
  fittingCost: number;
  iskPerDPS: number;
  iskPerEHP: number;
  insuranceValue: number;
}

export interface SkillGap {
  skillID: number;
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  trainingTime: number;
  effectivenessGain: number;
  priority: number;
}

export interface ComparisonMetrics {
  percentileRank: number;
  betterThanPercent: number;
  topTierThreshold: number;
  competitiveRating: 'excellent' | 'good' | 'average' | 'poor';
}

export interface ActivityComparison {
  activityName: string;
  effectiveness: number;
  rank: number;
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  keyStrengths: string[];
  keyWeaknesses: string[];
}

/**
 * Advanced Fitting Effectiveness Calculator
 * Provides comprehensive analysis of ship fitting performance
 */
export class FittingEffectivenessCalculator {
  private activityProfiles: Map<string, ActivityProfile> = new Map();
  private initialized = false;

  constructor() {
    logger.info('📊 Initializing Fitting Effectiveness Calculator...');
  }

  /**
   * Initialize activity profiles and effectiveness metrics
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('🔄 Loading activity profiles...');
      
      await this.initializeActivityProfiles();
      
      this.initialized = true;
      logger.info(`✅ Effectiveness calculator initialized with ${this.activityProfiles.size} activity profiles`);
      
    } catch (error) {
      logger.error('❌ Failed to initialize effectiveness calculator:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive fitting effectiveness for a specific activity
   */
  async calculateFittingEffectiveness(
    shipTypeId: number,
    modules: ModuleFit[],
    skills: SkillSet,
    activityId: string,
    targetMetrics?: Partial<EffectivenessWeighting>
  ): Promise<FittingEffectiveness> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      logger.info(`🎯 Calculating fitting effectiveness for activity: ${activityId}`);
      
      // Get activity profile
      const activityProfile = this.activityProfiles.get(activityId);
      if (!activityProfile) {
        throw new Error(`Unknown activity: ${activityId}`);
      }

      // Calculate comprehensive fitting stats
      const fittingStats = await dogmaEngine.calculateFittingStats(
        shipTypeId,
        modules,
        skills
      );

      // Calculate detailed metrics
      const detailedMetrics = await this.calculateDetailedMetrics(
        fittingStats,
        modules,
        skills
      );

      // Calculate category scores
      const categoryScores = this.calculateCategoryScores(
        detailedMetrics,
        activityProfile,
        targetMetrics
      );

      // Calculate overall effectiveness score
      const overallScore = this.calculateOverallScore(categoryScores, activityProfile);

      // Analyze skill gaps
      const skillGaps = await this.analyzeSkillGaps(
        shipTypeId,
        modules,
        skills,
        activityProfile
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        fittingStats,
        detailedMetrics,
        categoryScores,
        skillGaps,
        activityProfile
      );

      // Calculate comparison metrics
      const comparison = await this.calculateComparisonMetrics(
        overallScore,
        activityId,
        shipTypeId
      );

      const result: FittingEffectiveness = {
        overallScore,
        categoryScores,
        detailedMetrics,
        skillGaps,
        recommendations,
        comparison
      };

      logger.info(`✅ Effectiveness calculation complete - Score: ${overallScore.toFixed(1)}/100`);
      return result;

    } catch (error) {
      logger.error('❌ Fitting effectiveness calculation failed:', error);
      throw error;
    }
  }

  /**
   * Compare fitting effectiveness across multiple activities
   */
  async compareFittingAcrossActivities(
    shipTypeId: number,
    modules: ModuleFit[],
    skills: SkillSet,
    activities: string[] = []
  ): Promise<ActivityComparison[]> {
    const activitiesToTest = activities.length > 0 
      ? activities 
      : Array.from(this.activityProfiles.keys());

    const comparisons: ActivityComparison[] = [];

    for (const activityId of activitiesToTest) {
      try {
        const effectiveness = await this.calculateFittingEffectiveness(
          shipTypeId,
          modules,
          skills,
          activityId
        );

        const activityProfile = this.activityProfiles.get(activityId)!;
        
        comparisons.push({
          activityName: activityProfile.activityName,
          effectiveness: effectiveness.overallScore,
          rank: 0, // Will be set after sorting
          suitability: this.getSuitabilityRating(effectiveness.overallScore),
          keyStrengths: this.identifyKeyStrengths(effectiveness.categoryScores),
          keyWeaknesses: this.identifyKeyWeaknesses(effectiveness.categoryScores)
        });

      } catch (error) {
        logger.warn(`⚠️ Failed to calculate effectiveness for activity ${activityId}:`, error);
      }
    }

    // Sort by effectiveness and assign ranks
    comparisons.sort((a, b) => b.effectiveness - a.effectiveness);
    comparisons.forEach((comparison, index) => {
      comparison.rank = index + 1;
    });

    logger.info(`📈 Activity comparison complete - Best: ${comparisons[0]?.activityName} (${comparisons[0]?.effectiveness.toFixed(1)})`);
    return comparisons;
  }

  /**
   * Calculate detailed performance metrics
   */
  private async calculateDetailedMetrics(
    fittingStats: ComprehensiveFittingStats,
    modules: ModuleFit[],
    skills: SkillSet
  ): Promise<DetailedMetrics> {
    // Calculate fitting cost
    const fittingCost = await this.calculateFittingCost(modules);
    
    // Calculate applied DPS based on typical engagement scenarios
    const appliedDPS = this.calculateAppliedDPS(fittingStats.weapons);
    
    // Calculate sustainable tank
    const sustainableTank = this.calculateSustainableTank(fittingStats.tank, fittingStats.capacitor);
    
    return {
      // Combat effectiveness
      effectiveDPS: fittingStats.weapons.totalDPS,
      appliedDPS,
      burstDPS: fittingStats.weapons.volleyDamage * 4, // Assuming 4 volleys per burst
      sustainedDPS: fittingStats.weapons.totalDPS * 0.85, // Account for reload/capacitor
      
      // Survivability
      effectiveHP: fittingStats.tank.effectiveHP,
      sustainableTank,
      peakTank: fittingStats.tank.repairRate,
      ehpPerSecond: sustainableTank > 0 ? fittingStats.tank.effectiveHP / sustainableTank : 0,
      
      // Mobility
      alignTime: fittingStats.navigation.alignTime,
      maxVelocity: fittingStats.navigation.maxVelocity,
      agility: fittingStats.navigation.agility,
      warpSpeed: 3.0, // Default warp speed
      
      // Utility
      cargoCapacity: 0, // Would calculate from ship + modules
      scanResolution: fittingStats.targeting.scanResolution,
      maxTargets: fittingStats.targeting.maxTargets,
      droneCapacity: fittingStats.drones.droneCapacity,
      
      // Economics
      fittingCost,
      iskPerDPS: fittingCost / Math.max(fittingStats.weapons.totalDPS, 1),
      iskPerEHP: fittingCost / Math.max(fittingStats.tank.effectiveHP, 1),
      insuranceValue: fittingCost * 0.4 // Approximate insurance value
    };
  }

  /**
   * Calculate category scores based on activity profile
   */
  private calculateCategoryScores(
    metrics: DetailedMetrics,
    profile: ActivityProfile,
    targetMetrics?: Partial<EffectivenessWeighting>
  ): FittingEffectiveness['categoryScores'] {
    const weights = { ...profile.weightings, ...targetMetrics };
    
    // Normalize metrics to 0-100 scale
    const damageScore = Math.min(100, (metrics.effectiveDPS / 1000) * 100);
    const survivabilityScore = Math.min(100, (metrics.effectiveHP / 100000) * 100);
    const mobilityScore = Math.min(100, (metrics.maxVelocity / 2000) * 100);
    const utilityScore = Math.min(100, (metrics.scanResolution / 1000) * 100);
    const costScore = Math.max(0, 100 - (metrics.fittingCost / 1000000) * 10);
    const accessibilityScore = 85; // Would calculate from skill requirements
    
    return {
      damage: damageScore,
      survivability: survivabilityScore,
      mobility: mobilityScore,
      utility: utilityScore,
      cost: costScore,
      accessibility: accessibilityScore
    };
  }

  /**
   * Calculate overall effectiveness score
   */
  private calculateOverallScore(
    categoryScores: FittingEffectiveness['categoryScores'],
    profile: ActivityProfile
  ): number {
    const weights = profile.weightings;
    
    const weightedScore = 
      (categoryScores.damage * weights.dps) +
      (categoryScores.survivability * weights.tank) +
      (categoryScores.mobility * weights.speed) +
      (categoryScores.utility * weights.range) +
      (categoryScores.cost * weights.cost) +
      (categoryScores.accessibility * weights.skillAccessibility);
    
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    return Math.min(100, Math.max(0, weightedScore / totalWeight));
  }

  /**
   * Analyze skill gaps for optimal performance
   */
  private async analyzeSkillGaps(
    shipTypeId: number,
    modules: ModuleFit[],
    currentSkills: SkillSet,
    profile: ActivityProfile
  ): Promise<SkillGap[]> {
    const skillGaps: SkillGap[] = [];
    
    // Analyze required skills from activity profile
    for (const requirement of profile.skillRequirements) {
      const currentLevel = currentSkills[requirement.skillID] || 0;
      
      if (currentLevel < requirement.requiredLevel) {
        // Calculate training time (simplified)
        const trainingTime = this.calculateSkillTrainingTime(
          requirement.skillID,
          currentLevel,
          requirement.requiredLevel
        );
        
        // Estimate effectiveness gain
        const effectivenessGain = this.estimateSkillEffectivenessGain(
          requirement,
          currentLevel
        );
        
        skillGaps.push({
          skillID: requirement.skillID,
          skillName: requirement.skillName,
          currentLevel,
          requiredLevel: requirement.requiredLevel,
          trainingTime,
          effectivenessGain,
          priority: requirement.priority === 'critical' ? 10 : 
                   requirement.priority === 'important' ? 7 : 4
        });
      }
    }
    
    // Sort by priority and effectiveness gain
    skillGaps.sort((a, b) => 
      (b.priority * b.effectivenessGain) - (a.priority * a.effectivenessGain)
    );
    
    return skillGaps;
  }

  /**
   * Generate intelligent recommendations
   */
  private generateRecommendations(
    fittingStats: ComprehensiveFittingStats,
    metrics: DetailedMetrics,
    categoryScores: FittingEffectiveness['categoryScores'],
    skillGaps: SkillGap[],
    profile: ActivityProfile
  ): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (categoryScores.damage < 60) {
      recommendations.push('Consider upgrading weapons or damage modules for better DPS');
    }
    
    if (categoryScores.survivability < 50) {
      recommendations.push('Tank appears insufficient for this activity - consider defensive upgrades');
    }
    
    if (fittingStats.fitting.cpu.percentage > 95) {
      recommendations.push('CPU usage is very high - consider CPU upgrades or efficiency modules');
    }
    
    if (fittingStats.fitting.powergrid.percentage > 95) {
      recommendations.push('Power grid usage is critical - consider PG upgrades or efficiency');
    }
    
    // Skill recommendations
    if (skillGaps.length > 0) {
      const topSkill = skillGaps[0];
      recommendations.push(
        `Training ${topSkill.skillName} to level ${topSkill.requiredLevel} would provide ${topSkill.effectivenessGain.toFixed(1)}% effectiveness gain`
      );
    }
    
    // Activity-specific recommendations
    if (profile.activityID === 'mission_running_l4' && metrics.appliedDPS < 400) {
      recommendations.push('Applied DPS may be insufficient for efficient L4 missions');
    }
    
    return recommendations;
  }

  /**
   * Calculate comparison metrics against similar fittings
   */
  private async calculateComparisonMetrics(
    overallScore: number,
    activityId: string,
    shipTypeId: number
  ): Promise<ComparisonMetrics> {
    // This would query a database of fitting scores for comparison
    // For now, providing estimated metrics
    
    const percentileRank = Math.min(99, Math.max(1, overallScore));
    const betterThanPercent = percentileRank;
    const topTierThreshold = 85;
    
    const competitiveRating: ComparisonMetrics['competitiveRating'] = 
      overallScore >= 85 ? 'excellent' :
      overallScore >= 70 ? 'good' :
      overallScore >= 50 ? 'average' : 'poor';
    
    return {
      percentileRank,
      betterThanPercent,
      topTierThreshold,
      competitiveRating
    };
  }

  // Helper methods
  private async calculateFittingCost(modules: ModuleFit[]): Promise<number> {
    let totalCost = 0;
    
    for (const module of modules) {
      try {
        // This would query market prices or use base prices
        // For now, using placeholder values
        totalCost += 1000000; // 1M ISK per module
      } catch (error) {
        logger.warn(`⚠️ Failed to get price for module ${module.typeID}`);
      }
    }
    
    return totalCost;
  }

  private calculateAppliedDPS(weapons: any): number {
    // Simplified applied DPS calculation
    // Would consider target signature, speed, range, etc.
    return weapons.totalDPS * 0.75; // 75% application
  }

  private calculateSustainableTank(tank: any, capacitor: any): number {
    // Calculate how long tank can be sustained
    if (!capacitor.stable) {
      return capacitor.timeUntilEmpty;
    }
    return Infinity;
  }

  private calculateSkillTrainingTime(
    skillId: number,
    currentLevel: number,
    targetLevel: number
  ): number {
    // Simplified skill training time calculation
    const baseTime = 1000; // Base training time in minutes
    let totalTime = 0;
    
    for (let level = currentLevel + 1; level <= targetLevel; level++) {
      totalTime += baseTime * Math.pow(level, 2.5);
    }
    
    return totalTime;
  }

  private estimateSkillEffectivenessGain(
    requirement: SkillRequirement,
    currentLevel: number
  ): number {
    // Estimate effectiveness gain from skill training
    const levelDifference = requirement.requiredLevel - currentLevel;
    const baseBonusPerLevel = 5; // 5% per level
    
    return levelDifference * baseBonusPerLevel;
  }

  private getSuitabilityRating(score: number): ActivityComparison['suitability'] {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'poor';
  }

  private identifyKeyStrengths(categoryScores: FittingEffectiveness['categoryScores']): string[] {
    const strengths: string[] = [];
    
    if (categoryScores.damage >= 80) strengths.push('High damage output');
    if (categoryScores.survivability >= 80) strengths.push('Excellent survivability');
    if (categoryScores.mobility >= 80) strengths.push('Superior mobility');
    if (categoryScores.cost >= 80) strengths.push('Cost effective');
    
    return strengths;
  }

  private identifyKeyWeaknesses(categoryScores: FittingEffectiveness['categoryScores']): string[] {
    const weaknesses: string[] = [];
    
    if (categoryScores.damage < 40) weaknesses.push('Low damage output');
    if (categoryScores.survivability < 40) weaknesses.push('Poor survivability');
    if (categoryScores.mobility < 40) weaknesses.push('Limited mobility');
    if (categoryScores.cost < 40) weaknesses.push('Expensive fitting');
    
    return weaknesses;
  }

  /**
   * Initialize activity profiles with weightings and requirements
   */
  private async initializeActivityProfiles(): Promise<void> {
    const profiles: ActivityProfile[] = [
      {
        activityID: 'mission_running_l4',
        activityName: 'Level 4 Mission Running',
        description: 'High-level PvE missions requiring balanced performance',
        primaryMetrics: ['dps', 'tank', 'range'],
        secondaryMetrics: ['capacitor', 'speed'],
        weightings: {
          dps: 0.35,
          tank: 0.30,
          speed: 0.10,
          range: 0.15,
          tracking: 0.05,
          capacitor: 0.15,
          cost: 0.05,
          skillAccessibility: 0.10
        },
        threatProfile: {
          expectedDPS: 800,
          primaryDamageType: 'kinetic',
          secondaryDamageType: 'thermal',
          averageSignature: 400,
          averageSpeed: 500,
          engagementRange: 50000
        },
        skillRequirements: [
          { skillID: 3300, skillName: 'Gunnery', requiredLevel: 5, priority: 'critical' },
          { skillID: 3301, skillName: 'Small Projectile Turret', requiredLevel: 5, priority: 'critical' }
        ]
      },
      // Add more activity profiles...
    ];

    profiles.forEach(profile => {
      this.activityProfiles.set(profile.activityID, profile);
    });

    logger.debug(`📋 Initialized ${profiles.length} activity profiles`);
  }
}

// Export singleton instance
export const fittingEffectivenessCalculator = new FittingEffectivenessCalculator();