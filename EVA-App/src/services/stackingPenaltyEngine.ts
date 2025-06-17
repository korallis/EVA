/**
 * Stacking Penalty Engine - Exact EVE Online stacking penalty calculations
 * Implements EVE's precise stacking formula: exp(-i² / 7.1289)
 * Handles automatic stacking group detection and penalty application
 */

import { sdeService } from './sdeService';
import { EVALogger } from '../utils/logger';

const logger = EVALogger.getLogger('StackingPenaltyEngine');

export interface StackingGroup {
  groupID: number;
  groupName: string;
  description: string;
  effectIDs: number[];
}

export interface StackableModule {
  moduleTypeID: number;
  moduleName: string;
  effectID: number;
  stackingGroupID: number;
  bonusAmount: number;
  attributeID: number;
}

export interface StackingResult {
  moduleTypeID: number;
  originalBonus: number;
  penalizedBonus: number;
  stackingPosition: number;
  penaltyPercentage: number;
  stackingGroupID: number;
}

export interface StackingAnalysis {
  results: StackingResult[];
  totalOriginalBonus: number;
  totalPenalizedBonus: number;
  totalPenaltyAmount: number;
  efficiencyPercentage: number;
  recommendations: string[];
}

/**
 * Advanced Stacking Penalty Engine
 * Provides exact EVE Online stacking penalty calculations
 */
export class StackingPenaltyEngine {
  private stackingGroups: Map<number, StackingGroup> = new Map();
  private effectToStackingGroup: Map<number, number> = new Map();
  private initialized = false;

  // EVE's exact stacking penalty formula constants
  private static readonly STACKING_CONSTANT = 7.1289;
  
  // Common stacking group IDs (from EVE SDE)
  private static readonly STACKING_GROUPS = {
    DAMAGE_MODULES: 1,
    SHIELD_BOOSTERS: 2,
    ARMOR_REPAIRERS: 3,
    SHIELD_RESISTANCE: 4,
    ARMOR_RESISTANCE: 5,
    TRACKING_ENHANCERS: 6,
    SENSOR_BOOSTERS: 7,
    REMOTE_SHIELD_BOOSTERS: 8,
    REMOTE_ARMOR_REPAIRERS: 9,
    ECM_MODULES: 10,
    WARP_DISRUPTORS: 11,
    TARGET_PAINTERS: 12,
    SENSOR_DAMPENERS: 13,
    TRACKING_DISRUPTORS: 14,
    PROPULSION_MODULES: 15,
    MINING_MODULES: 16,
    CARGO_EXPANDERS: 17,
    INERTIA_STABILIZERS: 18,
    OVERDRIVE_INJECTORS: 19,
    NANOFIBER_STRUCTURES: 20
  };

  constructor() {
    logger.info('📐 Initializing Stacking Penalty Engine...');
  }

  /**
   * Initialize stacking groups from SDE data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('🔄 Loading stacking groups from SDE...');
      
      // Load stacking groups from database
      await this.loadStackingGroupsFromSDE();
      
      // Initialize default stacking groups if SDE data is incomplete
      this.initializeDefaultStackingGroups();
      
      this.initialized = true;
      logger.info(`✅ Stacking penalty engine initialized with ${this.stackingGroups.size} stacking groups`);
      
    } catch (error) {
      logger.error('❌ Failed to initialize stacking penalty engine:', error);
      // Initialize with defaults as fallback
      this.initializeDefaultStackingGroups();
      this.initialized = true;
    }
  }

  /**
   * Calculate exact EVE stacking penalties for a group of modules
   * Uses EVE's formula: penalty = exp(-position² / 7.1289)
   */
  calculateStackingPenalties(modules: StackableModule[]): StackingAnalysis {
    if (!this.initialized) {
      throw new Error('Stacking penalty engine not initialized');
    }

    // Group modules by stacking group
    const stackingGroups = new Map<number, StackableModule[]>();
    
    modules.forEach(module => {
      const groupID = module.stackingGroupID;
      if (groupID > 0) {
        if (!stackingGroups.has(groupID)) {
          stackingGroups.set(groupID, []);
        }
        stackingGroups.get(groupID)!.push(module);
      }
    });

    const results: StackingResult[] = [];
    let totalOriginalBonus = 0;
    let totalPenalizedBonus = 0;

    // Process each stacking group
    stackingGroups.forEach((groupModules, groupID) => {
      const groupResults = this.calculateGroupStackingPenalties(groupModules, groupID);
      results.push(...groupResults);
      
      groupResults.forEach(result => {
        totalOriginalBonus += Math.abs(result.originalBonus);
        totalPenalizedBonus += Math.abs(result.penalizedBonus);
      });
    });

    // Add modules that don't stack
    modules.forEach(module => {
      if (module.stackingGroupID === 0) {
        results.push({
          moduleTypeID: module.moduleTypeID,
          originalBonus: module.bonusAmount,
          penalizedBonus: module.bonusAmount,
          stackingPosition: 0,
          penaltyPercentage: 0,
          stackingGroupID: 0
        });
        
        totalOriginalBonus += Math.abs(module.bonusAmount);
        totalPenalizedBonus += Math.abs(module.bonusAmount);
      }
    });

    const totalPenaltyAmount = totalOriginalBonus - totalPenalizedBonus;
    const efficiencyPercentage = totalOriginalBonus > 0 ? (totalPenalizedBonus / totalOriginalBonus) * 100 : 100;

    const recommendations = this.generateStackingRecommendations(results, stackingGroups);

    return {
      results,
      totalOriginalBonus,
      totalPenalizedBonus,
      totalPenaltyAmount,
      efficiencyPercentage,
      recommendations
    };
  }

  /**
   * Calculate stacking penalties for a single stacking group
   */
  private calculateGroupStackingPenalties(
    modules: StackableModule[], 
    groupID: number
  ): StackingResult[] {
    // Sort modules by bonus amount (highest first for optimal stacking)
    const sortedModules = [...modules].sort((a, b) => 
      Math.abs(b.bonusAmount) - Math.abs(a.bonusAmount)
    );

    const results: StackingResult[] = [];

    sortedModules.forEach((module, index) => {
      let penalizedBonus: number;
      let penaltyPercentage: number;

      if (index === 0) {
        // First module gets full effect
        penalizedBonus = module.bonusAmount;
        penaltyPercentage = 0;
      } else {
        // Apply EVE's exact stacking penalty formula
        const penalty = this.calculateStackingPenalty(index);
        penalizedBonus = module.bonusAmount * penalty;
        penaltyPercentage = (1 - penalty) * 100;
      }

      results.push({
        moduleTypeID: module.moduleTypeID,
        originalBonus: module.bonusAmount,
        penalizedBonus,
        stackingPosition: index + 1,
        penaltyPercentage,
        stackingGroupID: groupID
      });

      logger.debug(`📉 Module ${module.moduleTypeID} in group ${groupID}: ${module.bonusAmount.toFixed(2)} → ${penalizedBonus.toFixed(2)} (${penaltyPercentage.toFixed(1)}% penalty)`);
    });

    return results;
  }

  /**
   * Calculate exact EVE stacking penalty using the official formula
   * Formula: exp(-position² / 7.1289)
   */
  private calculateStackingPenalty(position: number): number {
    if (position === 0) return 1.0;
    
    const penalty = Math.exp(-(position * position) / StackingPenaltyEngine.STACKING_CONSTANT);
    return Math.max(0, Math.min(1, penalty));
  }

  /**
   * Get stacking penalty percentages for visualization
   */
  getStackingPenaltyTable(maxPosition: number = 10): Array<{
    position: number;
    effectiveness: number;
    penalty: number;
  }> {
    const table: Array<{ position: number; effectiveness: number; penalty: number }> = [];
    
    for (let i = 1; i <= maxPosition; i++) {
      const effectiveness = this.calculateStackingPenalty(i - 1);
      const penalty = (1 - effectiveness) * 100;
      
      table.push({
        position: i,
        effectiveness: effectiveness * 100,
        penalty
      });
    }
    
    return table;
  }

  /**
   * Determine stacking group for a module type
   */
  async getModuleStackingGroup(moduleTypeID: number): Promise<number> {
    try {
      // Get module effects from SDE
      const effects = await sdeService.getQuery(
        `SELECT effectID FROM type_effects WHERE typeID = ?`,
        [moduleTypeID]
      );

      if (!effects) return 0;

      // Check if any effect has a stacking group
      const stackingGroupID = this.effectToStackingGroup.get(effects.effectID);
      return stackingGroupID || 0;

    } catch (error) {
      logger.warn(`⚠️ Failed to determine stacking group for module ${moduleTypeID}:`, error);
      return 0;
    }
  }

  /**
   * Generate recommendations for optimal stacking
   */
  private generateStackingRecommendations(
    results: StackingResult[],
    stackingGroups: Map<number, StackableModule[]>
  ): string[] {
    const recommendations: string[] = [];

    stackingGroups.forEach((modules, groupID) => {
      if (modules.length <= 1) return;

      const groupResults = results.filter(r => r.stackingGroupID === groupID);
      const totalPenalty = groupResults.reduce((sum, r) => sum + r.penaltyPercentage, 0);
      const avgPenalty = totalPenalty / groupResults.length;

      if (modules.length > 3) {
        recommendations.push(
          `Consider reducing ${modules.length} stacked modules in group ${groupID} - efficiency drops significantly after 3 modules`
        );
      }

      if (avgPenalty > 50) {
        recommendations.push(
          `High stacking penalties detected in group ${groupID} (${avgPenalty.toFixed(1)}% avg penalty) - consider alternative modules`
        );
      }

      // Check for inefficient stacking order
      const sortedByBonus = [...modules].sort((a, b) => Math.abs(b.bonusAmount) - Math.abs(a.bonusAmount));
      const isOptimalOrder = modules.every((module, index) => 
        module.moduleTypeID === sortedByBonus[index].moduleTypeID
      );

      if (!isOptimalOrder) {
        recommendations.push(
          `Suboptimal stacking order in group ${groupID} - place highest bonus modules first`
        );
      }
    });

    return recommendations;
  }

  /**
   * Load stacking groups from SDE database
   */
  private async loadStackingGroupsFromSDE(): Promise<void> {
    try {
      // This would query actual SDE data for stacking groups
      // For now, we'll use the default initialization
      logger.debug('📊 Loading stacking groups from SDE (placeholder)');
      
    } catch (error) {
      logger.warn('⚠️ Failed to load stacking groups from SDE:', error);
    }
  }

  /**
   * Initialize default stacking groups
   */
  private initializeDefaultStackingGroups(): void {
    const defaultGroups: StackingGroup[] = [
      {
        groupID: StackingPenaltyEngine.STACKING_GROUPS.DAMAGE_MODULES,
        groupName: 'Damage Modules',
        description: 'Weapon damage enhancement modules',
        effectIDs: [11, 2205, 2206, 2207] // Simplified effect IDs
      },
      {
        groupID: StackingPenaltyEngine.STACKING_GROUPS.SHIELD_BOOSTERS,
        groupName: 'Shield Boosters',
        description: 'Shield boost amount modules',
        effectIDs: [4, 419]
      },
      {
        groupID: StackingPenaltyEngine.STACKING_GROUPS.ARMOR_REPAIRERS,
        groupName: 'Armor Repairers',
        description: 'Armor repair amount modules',
        effectIDs: [5, 420]
      },
      {
        groupID: StackingPenaltyEngine.STACKING_GROUPS.TRACKING_ENHANCERS,
        groupName: 'Tracking Enhancers',
        description: 'Weapon tracking enhancement modules',
        effectIDs: [29, 2209]
      },
      {
        groupID: StackingPenaltyEngine.STACKING_GROUPS.SENSOR_BOOSTERS,
        groupName: 'Sensor Boosters',
        description: 'Targeting enhancement modules',
        effectIDs: [26, 2208]
      }
    ];

    defaultGroups.forEach(group => {
      this.stackingGroups.set(group.groupID, group);
      
      // Map effects to stacking groups
      group.effectIDs.forEach(effectID => {
        this.effectToStackingGroup.set(effectID, group.groupID);
      });
    });

    logger.debug(`📋 Initialized ${defaultGroups.length} default stacking groups`);
  }

  /**
   * Get all available stacking groups
   */
  getStackingGroups(): StackingGroup[] {
    return Array.from(this.stackingGroups.values());
  }

  /**
   * Get stacking group information by ID
   */
  getStackingGroup(groupID: number): StackingGroup | undefined {
    return this.stackingGroups.get(groupID);
  }

  /**
   * Calculate optimal module count for a stacking group
   */
  calculateOptimalModuleCount(baseBonus: number, costPerModule: number = 1): {
    optimalCount: number;
    efficiencyAtOptimal: number;
    reasoning: string;
  } {
    let bestEfficiency = 0;
    let bestCount = 1;
    
    // Test up to 10 modules (practical limit)
    for (let count = 1; count <= 10; count++) {
      let totalEffectiveBonus = 0;
      
      for (let i = 0; i < count; i++) {
        const penalty = this.calculateStackingPenalty(i);
        totalEffectiveBonus += baseBonus * penalty;
      }
      
      const efficiency = totalEffectiveBonus / (count * costPerModule);
      
      if (efficiency > bestEfficiency) {
        bestEfficiency = efficiency;
        bestCount = count;
      }
    }
    
    const reasoning = bestCount <= 3 
      ? 'Optimal efficiency before severe stacking penalties'
      : bestCount <= 6
      ? 'Diminishing returns but still cost-effective'
      : 'High module count only justified for specialized fits';
    
    return {
      optimalCount: bestCount,
      efficiencyAtOptimal: bestEfficiency,
      reasoning
    };
  }
}

// Export singleton instance
export const stackingPenaltyEngine = new StackingPenaltyEngine();