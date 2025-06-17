/**
 * Ship Analysis Engine - Analyzes ships for activity optimization and skill-based recommendations
 * Integrates with SDE data and character skills to provide intelligent ship suggestions
 */

import { Activity, ActivityTier, RecommendedShip, SkillRequirement } from './activitySelectionService';

export interface ShipAnalysis {
  typeId: number;
  typeName: string;
  groupId: number;
  groupName: string;
  raceId?: number;
  raceName?: string;
  activityEffectiveness: ActivityEffectiveness;
  skillRequirements: DetailedSkillRequirement[];
  pilotCompatibility: PilotCompatibility;
  shipBonuses: ShipBonus[];
  fittingCapability: FittingCapability;
  activitySuitability: ActivitySuitability;
  costAnalysis: CostAnalysis;
  alternatives: AlternativeShip[];
}

export interface ActivityEffectiveness {
  activityId: string;
  tierId?: string;
  effectivenessScore: number; // 0-100
  performanceMetrics: PerformanceMetrics;
  roleEffectiveness: RoleEffectiveness;
  situationalModifiers: SituationalModifier[];
}

export interface PerformanceMetrics {
  estimatedDPS?: number;
  estimatedEHP?: number;
  estimatedSpeed?: number;
  estimatedRange?: number;
  capacitorStability?: number;
  miningYield?: number;
  haulingCapacity?: number;
  scanStrength?: number;
  repairOutput?: number;
}

export interface RoleEffectiveness {
  primary: number; // 0-100 effectiveness in primary role
  secondary?: number; // 0-100 effectiveness in secondary role
  versatility: number; // 0-100 how well it handles multiple situations
  specialization: number; // 0-100 how specialized vs generalist
}

export interface SituationalModifier {
  situation: string;
  modifier: number; // multiplier (1.0 = no change, 1.2 = 20% better)
  description: string;
}

export interface DetailedSkillRequirement extends SkillRequirement {
  currentLevel: number;
  skillPointsRequired: number;
  trainingTime: number; // milliseconds
  attributes: AttributeRequirement;
  prerequisites: PrerequisiteSkill[];
}

export interface AttributeRequirement {
  primary: 'intelligence' | 'perception' | 'charisma' | 'willpower' | 'memory';
  secondary: 'intelligence' | 'perception' | 'charisma' | 'willpower' | 'memory';
  trainingMultiplier: number;
}

export interface PrerequisiteSkill {
  skillId: number;
  skillName: string;
  requiredLevel: number;
  currentLevel: number;
  isMet: boolean;
}

export interface PilotCompatibility {
  overallScore: number; // 0-100
  canFly: boolean;
  skillsMetPercentage: number;
  missingSkills: MissingSkill[];
  timeToFly: number; // milliseconds
  timeToOptimal: number; // milliseconds
  recommendedTrainingPath: SkillTrainingStep[];
}

export interface MissingSkill {
  skillId: number;
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  blocksWhat: string[];
}

export interface SkillTrainingStep {
  skillId: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  trainingTime: number;
  order: number;
  reasoning: string;
}

export interface ShipBonus {
  bonusType: 'role' | 'racial' | 'skill';
  category: string;
  description: string;
  value: number;
  unit: string;
  perLevel?: boolean;
  affectedModules?: string[];
}

export interface FittingCapability {
  powerGrid: number;
  cpu: number;
  calibration: number;
  highSlots: number;
  medSlots: number;
  lowSlots: number;
  rigSlots: number;
  turretHardpoints: number;
  launcherHardpoints: number;
  upgradeSlots: number;
  fittingFlexibility: number; // 0-100 score
  commonFittingProfiles: FittingProfile[];
}

export interface FittingProfile {
  name: string;
  description: string;
  estimatedCost: number;
  powerUsage: number;
  cpuUsage: number;
  performance: PerformanceMetrics;
  requiredSkills: SkillRequirement[];
  modules: ModuleSelection[];
}

export interface ModuleSelection {
  slotType: 'high' | 'med' | 'low' | 'rig' | 'subsystem';
  moduleTypeId: number;
  moduleName: string;
  quantity: number;
  purpose: string;
}

export interface ActivitySuitability {
  primaryActivities: string[];
  secondaryActivities: string[];
  unsuitableActivities: string[];
  versatilityScore: number; // 0-100
  specializationFocus: string[];
  commonUses: string[];
}

export interface CostAnalysis {
  hullCost: number;
  fittingCost: number;
  totalCost: number;
  iskPerEffectiveness: number;
  budgetCategory: 'Budget' | 'Standard' | 'Premium' | 'Luxury';
  alternatives: CostAlternative[];
}

export interface CostAlternative {
  typeId: number;
  typeName: string;
  costDifference: number;
  effectivenessDifference: number;
  costEfficiencyRatio: number;
  recommendation: string;
}

export interface AlternativeShip {
  typeId: number;
  typeName: string;
  relationship: 'upgrade' | 'downgrade' | 'sidegrade' | 'specialization';
  costDifference: number;
  effectivenessDifference: number;
  skillRequirementDifference: number;
  recommendation: string;
  reasoning: string;
}

export interface ShipSearchCriteria {
  activityId?: string;
  tierId?: string;
  maxCost?: number;
  maxTrainingTime?: number;
  pilotSkills?: PilotSkills;
  securityRequirement?: 'Highsec' | 'Lowsec' | 'Nullsec' | 'Wormhole' | 'Any';
  preferredRace?: string;
  rolePreference?: 'Primary' | 'Alternative' | 'Budget' | 'Advanced';
  sortBy?: 'effectiveness' | 'cost' | 'training_time' | 'versatility';
}

export interface PilotSkills {
  characterId: number;
  skills: CharacterSkill[];
  totalSkillPoints: number;
  attributes: CharacterAttributes;
  implants?: number[];
}

export interface CharacterSkill {
  skillId: number;
  skillName: string;
  trainedLevel: number;
  activeSkillLevel: number;
  skillPointsInSkill: number;
}

export interface CharacterAttributes {
  intelligence: number;
  perception: number;
  charisma: number;
  willpower: number;
  memory: number;
}

export interface ShipRecommendationResult {
  query: ShipSearchCriteria;
  totalShipsAnalyzed: number;
  recommendedShips: ShipAnalysis[];
  alternativeCategories: AlternativeCategory[];
  trainingRecommendations: TrainingRecommendation[];
  summary: RecommendationSummary;
}

export interface AlternativeCategory {
  categoryName: string;
  description: string;
  ships: ShipAnalysis[];
  pros: string[];
  cons: string[];
}

export interface TrainingRecommendation {
  priority: 'Immediate' | 'Short-term' | 'Long-term';
  description: string;
  skills: SkillTrainingStep[];
  estimatedTime: number;
  impactDescription: string;
}

export interface RecommendationSummary {
  bestOverallShip: ShipAnalysis;
  bestBudgetShip: ShipAnalysis;
  fastestToTrain: ShipAnalysis;
  mostVersatile: ShipAnalysis;
  keyInsights: string[];
  warnings: string[];
}

/**
 * Ship Analysis Service - Main service class for ship analysis and recommendations
 */
export class ShipAnalysisService {
  private shipCache: Map<number, any> = new Map();
  private analysisCache: Map<string, ShipAnalysis> = new Map();

  /**
   * Get comprehensive ship analysis for a specific ship and activity
   */
  async analyzeShip(
    shipTypeId: number, 
    activityId: string, 
    tierId?: string,
    pilotSkills?: PilotSkills
  ): Promise<ShipAnalysis> {
    const cacheKey = `${shipTypeId}-${activityId}-${tierId || 'all'}-${pilotSkills?.characterId || 'no-pilot'}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    console.log(`🔍 Analyzing ship ${shipTypeId} for activity ${activityId}${tierId ? ` (tier: ${tierId})` : ''}`);

    // Get ship data from SDE
    const shipData = await this.getShipData(shipTypeId);
    if (!shipData) {
      throw new Error(`Ship with type ID ${shipTypeId} not found`);
    }

    // Perform comprehensive analysis
    const analysis: ShipAnalysis = {
      typeId: shipTypeId,
      typeName: shipData.typeName,
      groupId: shipData.groupID,
      groupName: shipData.groupName,
      raceId: shipData.raceID,
      raceName: shipData.raceName,
      activityEffectiveness: await this.calculateActivityEffectiveness(shipData, activityId, tierId),
      skillRequirements: await this.analyzeSkillRequirements(shipData, pilotSkills),
      pilotCompatibility: await this.calculatePilotCompatibility(shipData, pilotSkills),
      shipBonuses: await this.extractShipBonuses(shipData),
      fittingCapability: await this.analyzeFittingCapability(shipData),
      activitySuitability: await this.assessActivitySuitability(shipData),
      costAnalysis: await this.performCostAnalysis(shipData, activityId),
      alternatives: await this.findAlternativeShips(shipData, activityId)
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Find optimal ships for a specific activity with filtering and sorting
   */
  async findOptimalShips(criteria: ShipSearchCriteria): Promise<ShipRecommendationResult> {
    console.log('🚀 Finding optimal ships with criteria:', criteria);

    // Get all ships from SDE
    const allShips = await this.getAllShips();
    
    // Filter ships based on criteria
    let candidateShips = this.filterShipsByCriteria(allShips, criteria);
    
    console.log(`📊 Analyzing ${candidateShips.length} candidate ships...`);

    // Analyze each candidate ship
    const analyzedShips: ShipAnalysis[] = [];
    for (const ship of candidateShips) {
      try {
        const analysis = await this.analyzeShip(
          ship.typeID, 
          criteria.activityId!, 
          criteria.tierId,
          criteria.pilotSkills
        );
        analyzedShips.push(analysis);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ship ${ship.typeName}:`, error);
      }
    }

    // Sort by criteria
    const sortedShips = this.sortShipsByCriteria(analyzedShips, criteria);

    // Generate recommendations
    const result: ShipRecommendationResult = {
      query: criteria,
      totalShipsAnalyzed: analyzedShips.length,
      recommendedShips: sortedShips.slice(0, 10), // Top 10 recommendations
      alternativeCategories: this.categorizeAlternatives(sortedShips),
      trainingRecommendations: this.generateTrainingRecommendations(sortedShips, criteria.pilotSkills),
      summary: this.generateRecommendationSummary(sortedShips, criteria)
    };

    console.log(`✅ Analysis complete. Top recommendation: ${result.summary.bestOverallShip.typeName}`);
    return result;
  }

  /**
   * Get detailed fitting recommendations for a ship and activity
   */
  async getFittingRecommendations(
    shipTypeId: number,
    activityId: string,
    fittingType: 'max_dps' | 'max_tank' | 'speed_tank' | 'balanced' | 'budget',
    pilotSkills?: PilotSkills
  ): Promise<FittingProfile[]> {
    console.log(`🔧 Generating ${fittingType} fittings for ship ${shipTypeId} and activity ${activityId}`);

    const shipData = await this.getShipData(shipTypeId);
    if (!shipData) {
      throw new Error(`Ship with type ID ${shipTypeId} not found`);
    }

    // Generate fitting profiles based on type and activity
    return this.generateFittingProfiles(shipData, activityId, fittingType, pilotSkills);
  }

  /**
   * Compare multiple ships for an activity
   */
  async compareShips(
    shipTypeIds: number[],
    activityId: string,
    tierId?: string,
    pilotSkills?: PilotSkills
  ): Promise<ShipAnalysis[]> {
    console.log(`⚖️ Comparing ${shipTypeIds.length} ships for activity ${activityId}`);

    const comparisons: ShipAnalysis[] = [];
    for (const typeId of shipTypeIds) {
      try {
        const analysis = await this.analyzeShip(typeId, activityId, tierId, pilotSkills);
        comparisons.push(analysis);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ship ${typeId}:`, error);
      }
    }

    // Sort by effectiveness
    return comparisons.sort((a, b) => 
      b.activityEffectiveness.effectivenessScore - a.activityEffectiveness.effectivenessScore
    );
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private async getShipData(typeId: number): Promise<any> {
    if (this.shipCache.has(typeId)) {
      return this.shipCache.get(typeId);
    }

    try {
      // Get all ships and find the one we want
      const ships = await window.electronAPI.sde.getShips();
      const ship = ships.find(s => s.typeID === typeId);
      
      if (ship) {
        this.shipCache.set(typeId, ship);
      }
      
      return ship;
    } catch (error) {
      console.error(`Failed to get ship data for ${typeId}:`, error);
      return null;
    }
  }

  private async getAllShips(): Promise<any[]> {
    try {
      return await window.electronAPI.sde.getShips();
    } catch (error) {
      console.error('Failed to get all ships:', error);
      return [];
    }
  }

  private filterShipsByCriteria(ships: any[], criteria: ShipSearchCriteria): any[] {
    return ships.filter(ship => {
      // Filter by race preference
      if (criteria.preferredRace && criteria.preferredRace !== 'All' && ship.raceName !== criteria.preferredRace) {
        return false;
      }

      // Filter by ship categories suitable for the activity
      if (criteria.activityId) {
        const suitableGroups = this.getSuitableShipGroups(criteria.activityId);
        if (suitableGroups.length > 0 && !suitableGroups.includes(ship.groupName)) {
          return false;
        }
      }

      // Filter by published status
      if (!ship.published) {
        return false;
      }

      return true;
    });
  }

  private getSuitableShipGroups(activityId: string): string[] {
    const activityGroups: Record<string, string[]> = {
      'mission_running': [
        'Frigate', 'Destroyer', 'Cruiser', 'Battlecruiser', 'Battleship',
        'Assault Frigate', 'Heavy Assault Cruiser', 'Marauder',
        'Stealth Bomber', 'Strategic Cruiser'
      ],
      'mining': [
        'Mining Barge', 'Exhumer', 'Industrial',
        'Expedition Frigate', 'Venture'
      ],
      'pvp': [
        'Frigate', 'Destroyer', 'Cruiser', 'Battlecruiser', 'Battleship',
        'Assault Frigate', 'Heavy Assault Cruiser', 'Interceptor',
        'Covert Ops', 'Recon Ship', 'Electronic Attack Ship',
        'Command Ship', 'Strategic Cruiser', 'Stealth Bomber'
      ],
      'exploration': [
        'Frigate', 'Covert Ops', 'Strategic Cruiser',
        'Expedition Frigate'
      ],
      'hauling': [
        'Industrial', 'Transport Ship', 'Freighter',
        'Jump Freighter', 'Blockade Runner', 'Deep Space Transport'
      ]
    };

    return activityGroups[activityId] || [];
  }

  private sortShipsByCriteria(ships: ShipAnalysis[], criteria: ShipSearchCriteria): ShipAnalysis[] {
    const sortBy = criteria.sortBy || 'effectiveness';

    return ships.sort((a, b) => {
      switch (sortBy) {
        case 'effectiveness':
          return b.activityEffectiveness.effectivenessScore - a.activityEffectiveness.effectivenessScore;
        case 'cost':
          return a.costAnalysis.totalCost - b.costAnalysis.totalCost;
        case 'training_time':
          return a.pilotCompatibility.timeToFly - b.pilotCompatibility.timeToFly;
        case 'versatility':
          return b.activitySuitability.versatilityScore - a.activitySuitability.versatilityScore;
        default:
          return b.activityEffectiveness.effectivenessScore - a.activityEffectiveness.effectivenessScore;
      }
    });
  }

  private async calculateActivityEffectiveness(shipData: any, activityId: string, tierId?: string): Promise<ActivityEffectiveness> {
    // This would be a complex calculation based on ship bonuses, fitting capability, and activity requirements
    // For now, returning a simplified calculation
    
    const baseEffectiveness = this.calculateBaseEffectiveness(shipData, activityId);
    const performanceMetrics = await this.calculatePerformanceMetrics(shipData, activityId);
    
    return {
      activityId,
      tierId,
      effectivenessScore: baseEffectiveness,
      performanceMetrics,
      roleEffectiveness: {
        primary: baseEffectiveness,
        versatility: this.calculateVersatility(shipData),
        specialization: this.calculateSpecialization(shipData, activityId)
      },
      situationalModifiers: []
    };
  }

  private calculateBaseEffectiveness(shipData: any, activityId: string): number {
    // Simplified effectiveness calculation based on ship group and activity
    const groupEffectiveness: Record<string, Record<string, number>> = {
      'mission_running': {
        'Frigate': 60,
        'Destroyer': 65,
        'Cruiser': 75,
        'Battlecruiser': 85,
        'Battleship': 90,
        'Assault Frigate': 70,
        'Heavy Assault Cruiser': 85,
        'Marauder': 95
      },
      'mining': {
        'Venture': 70,
        'Mining Barge': 85,
        'Exhumer': 95,
        'Industrial': 60
      },
      'pvp': {
        'Frigate': 75,
        'Interceptor': 90,
        'Assault Frigate': 85,
        'Destroyer': 70,
        'Cruiser': 80,
        'Heavy Assault Cruiser': 90,
        'Battleship': 85
      }
    };

    return groupEffectiveness[activityId]?.[shipData.groupName] || 50;
  }

  private async calculatePerformanceMetrics(shipData: any, activityId: string): Promise<PerformanceMetrics> {
    // Get ship attributes for performance calculations
    const attributes = await this.getShipAttributes(shipData.typeID);
    
    return {
      estimatedDPS: this.estimateDPS(attributes, activityId),
      estimatedEHP: this.estimateEHP(attributes),
      estimatedSpeed: this.estimateSpeed(attributes),
      estimatedRange: this.estimateRange(attributes, activityId),
      capacitorStability: this.estimateCapacitorStability(attributes)
    };
  }

  private async getShipAttributes(typeId: number): Promise<any> {
    try {
      return await window.electronAPI.sde.getTypeAttributes(typeId);
    } catch (error) {
      console.warn(`Failed to get attributes for ship ${typeId}:`, error);
      return {};
    }
  }

  // Simplified performance estimation methods
  private estimateDPS(attributes: any, activityId: string): number {
    // Simplified DPS estimation based on turret/launcher hardpoints and ship bonuses
    const turretHardpoints = attributes?.turretHardpoints || 0;
    const launcherHardpoints = attributes?.launcherHardpoints || 0;
    
    // Base DPS per hardpoint (simplified)
    const baseDpsPerTurret = 100;
    const baseDpsPerLauncher = 120;
    
    return (turretHardpoints * baseDpsPerTurret) + (launcherHardpoints * baseDpsPerLauncher);
  }

  private estimateEHP(attributes: any): number {
    // Simplified EHP calculation
    const baseHP = (attributes?.hp?.hull || 1000) + (attributes?.hp?.shield || 500) + (attributes?.hp?.armor || 500);
    return baseHP * 1.5; // Assume some basic tank fitting
  }

  private estimateSpeed(attributes: any): number {
    return attributes?.maxVelocity || 200;
  }

  private estimateRange(attributes: any, activityId: string): number {
    // Simplified range estimation
    return activityId === 'mission_running' ? 50000 : 20000;
  }

  private estimateCapacitorStability(attributes: any): number {
    return 0.8; // 80% cap stable as default estimate
  }

  private calculateVersatility(shipData: any): number {
    // Ships with more slot flexibility are more versatile
    const slotCount = (shipData.highSlots || 0) + (shipData.medSlots || 0) + (shipData.lowSlots || 0);
    return Math.min(100, slotCount * 5);
  }

  private calculateSpecialization(shipData: any, activityId: string): number {
    // Ships designed for specific activities are more specialized
    const specializationMap: Record<string, string[]> = {
      'Marauder': ['mission_running'],
      'Mining Barge': ['mining'],
      'Exhumer': ['mining'],
      'Interceptor': ['pvp'],
      'Covert Ops': ['exploration']
    };

    const shipSpecializations = specializationMap[shipData.groupName] || [];
    return shipSpecializations.includes(activityId) ? 90 : 40;
  }

  private async analyzeSkillRequirements(shipData: any, pilotSkills?: PilotSkills): Promise<DetailedSkillRequirement[]> {
    try {
      const requirements = await window.electronAPI.sde.getSkillRequirements(shipData.typeID);
      
      return requirements.map(req => ({
        skillId: req.skillId,
        skillName: req.skillName,
        minimumLevel: req.requiredLevel,
        recommendedLevel: Math.min(5, req.requiredLevel + 1),
        priority: req.requiredLevel >= 4 ? 'High' : 'Medium',
        impact: 'Access',
        description: `Required to fly ${shipData.typeName}`,
        currentLevel: pilotSkills?.skills.find(s => s.skillId === req.skillId)?.trainedLevel || 0,
        skillPointsRequired: this.calculateSkillPoints(req.requiredLevel),
        trainingTime: this.calculateTrainingTime(req.requiredLevel),
        attributes: {
          primary: 'willpower',
          secondary: 'perception',
          trainingMultiplier: 2.0
        },
        prerequisites: []
      }));
    } catch (error) {
      console.warn(`Failed to get skill requirements for ${shipData.typeName}:`, error);
      return [];
    }
  }

  private calculateSkillPoints(level: number): number {
    // Simplified skill point calculation
    const multipliers = [0, 250, 1414, 8000, 45255, 256000];
    return multipliers[level] || 0;
  }

  private calculateTrainingTime(level: number): number {
    // Simplified training time (in milliseconds)
    const times = [0, 30 * 60 * 1000, 2 * 60 * 60 * 1000, 8 * 60 * 60 * 1000, 2 * 24 * 60 * 60 * 1000, 8 * 24 * 60 * 60 * 1000];
    return times[level] || 0;
  }

  private async calculatePilotCompatibility(shipData: any, pilotSkills?: PilotSkills): Promise<PilotCompatibility> {
    if (!pilotSkills) {
      return {
        overallScore: 0,
        canFly: false,
        skillsMetPercentage: 0,
        missingSkills: [],
        timeToFly: 0,
        timeToOptimal: 0,
        recommendedTrainingPath: []
      };
    }

    const requirements = await this.analyzeSkillRequirements(shipData, pilotSkills);
    const metRequirements = requirements.filter(req => req.currentLevel >= req.minimumLevel);
    
    return {
      overallScore: (metRequirements.length / requirements.length) * 100,
      canFly: metRequirements.length === requirements.length,
      skillsMetPercentage: (metRequirements.length / requirements.length) * 100,
      missingSkills: [],
      timeToFly: 0,
      timeToOptimal: 0,
      recommendedTrainingPath: []
    };
  }

  // Placeholder implementations for remaining private methods
  private async extractShipBonuses(shipData: any): Promise<ShipBonus[]> {
    return [];
  }

  private async analyzeFittingCapability(shipData: any): Promise<FittingCapability> {
    return {
      powerGrid: shipData.powerGrid || 0,
      cpu: shipData.cpu || 0,
      calibration: shipData.calibration || 400,
      highSlots: shipData.highSlots || 0,
      medSlots: shipData.medSlots || 0,
      lowSlots: shipData.lowSlots || 0,
      rigSlots: shipData.rigSlots || 3,
      turretHardpoints: shipData.turretHardpoints || 0,
      launcherHardpoints: shipData.launcherHardpoints || 0,
      upgradeSlots: shipData.upgradeSlots || 0,
      fittingFlexibility: 75,
      commonFittingProfiles: []
    };
  }

  private async assessActivitySuitability(shipData: any): Promise<ActivitySuitability> {
    return {
      primaryActivities: [],
      secondaryActivities: [],
      unsuitableActivities: [],
      versatilityScore: this.calculateVersatility(shipData),
      specializationFocus: [],
      commonUses: []
    };
  }

  private async performCostAnalysis(shipData: any, activityId: string): Promise<CostAnalysis> {
    return {
      hullCost: 50000000, // Placeholder
      fittingCost: 25000000,
      totalCost: 75000000,
      iskPerEffectiveness: 1000000,
      budgetCategory: 'Standard',
      alternatives: []
    };
  }

  private async findAlternativeShips(shipData: any, activityId: string): Promise<AlternativeShip[]> {
    return [];
  }

  private categorizeAlternatives(ships: ShipAnalysis[]): AlternativeCategory[] {
    return [];
  }

  private generateTrainingRecommendations(ships: ShipAnalysis[], pilotSkills?: PilotSkills): TrainingRecommendation[] {
    return [];
  }

  private generateRecommendationSummary(ships: ShipAnalysis[], criteria: ShipSearchCriteria): RecommendationSummary {
    const best = ships[0];
    return {
      bestOverallShip: best,
      bestBudgetShip: best,
      fastestToTrain: best,
      mostVersatile: best,
      keyInsights: [],
      warnings: []
    };
  }

  private async generateFittingProfiles(
    shipData: any,
    activityId: string,
    fittingType: string,
    pilotSkills?: PilotSkills
  ): Promise<FittingProfile[]> {
    return [];
  }
}

// Export service instance
export const shipAnalysisService = new ShipAnalysisService();