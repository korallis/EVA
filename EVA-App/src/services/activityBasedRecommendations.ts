/**
 * Activity-Based Ship Recommendations - Core engine for ship and fitting recommendations
 * Analyzes activities, pilot skills, and generates optimal ship + fitting combinations
 */

import { Activity, ActivityTier } from './activitySelectionService';
import { ShipAnalysis, ShipSearchCriteria, PilotSkills } from './shipAnalysisService';

export interface ActivityRecommendationRequest {
  activityId: string;
  tierId?: string;
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  securitySpace?: 'Highsec' | 'Lowsec' | 'Nullsec' | 'Wormhole' | 'Any';
  budgetConstraint?: number; // Max ISK for ship + fitting
  pilotSkills?: PilotSkills;
  preferredRace?: string;
  customRequirements?: string[];
}

export interface ActivityRecommendationResult {
  request: ActivityRecommendationRequest;
  activityDetails: ActivityDetails;
  recommendedShips: ShipRecommendation[];
  alternativeShips: AlternativeShipRecommendation[];
  skillGaps: SkillGapAnalysis;
  optimizationSuggestions: OptimizationSuggestion[];
  summary: RecommendationSummary;
}

export interface ActivityDetails {
  activityId: string;
  activityName: string;
  description: string;
  tierDetails?: TierDetails;
  keyRequirements: string[];
  commonChallenges: string[];
  successMetrics: string[];
}

export interface TierDetails {
  tierId: string;
  tierName: string;
  description: string;
  difficultyRating: number; // 1-10
  typicalRewards: RewardInfo;
  recommendedPilotExperience: string;
}

export interface RewardInfo {
  iskPerHour: number;
  loyaltyPoints?: number;
  specialLoot?: string[];
  experienceGain: string;
}

export interface ShipRecommendation {
  rank: number; // 1-3 for top 3 recommendations
  ship: ShipInfo;
  overallScore: number; // 0-100
  pilotCompatibility: PilotCompatibilityScore;
  fittingVariations: FittingVariation[];
  pros: string[];
  cons: string[];
  skillRequirements: RequiredSkillSummary;
  costAnalysis: ShipCostAnalysis;
  alternativeUpgrades: UpgradePath[];
}

export interface ShipInfo {
  typeId: number;
  typeName: string;
  groupName: string;
  raceName?: string;
  hullBonuses: HullBonus[];
  baseStats: BaseShipStats;
  description: string;
}

export interface HullBonus {
  bonusType: 'role' | 'racial' | 'skill';
  description: string;
  value: number;
  unit: string;
  relevantToActivity: boolean;
}

export interface BaseShipStats {
  powerGrid: number;
  cpu: number;
  highSlots: number;
  medSlots: number;
  lowSlots: number;
  rigSlots: number;
  turretHardpoints: number;
  launcherHardpoints: number;
  droneCapacity: number;
  droneBandwidth: number;
  cargoCapacity: number;
  baseShield: number;
  baseArmor: number;
  baseHull: number;
  maxVelocity: number;
  agility: number;
  warpSpeed: number;
  mass: number;
}

export interface PilotCompatibilityScore {
  canFlyShip: boolean;
  canUseOptimalFit: boolean;
  skillsMetPercentage: number;
  missingCriticalSkills: number;
  trainingTimeToFly: number; // milliseconds
  trainingTimeToOptimal: number; // milliseconds
  overallCompatibility: number; // 0-100
}

export interface FittingVariation {
  variationType: 'max_dps' | 'max_tank' | 'speed_tank' | 'balanced' | 'budget';
  name: string;
  description: string;
  totalCost: number;
  fittingModules: FittingModule[];
  performanceMetrics: FittingPerformance;
  skillRequirements: SkillRequirement[];
  pilotCanUse: boolean;
  alternativeModules: AlternativeModule[];
  fittingNotes: string[];
}

export interface FittingModule {
  slotType: 'high' | 'med' | 'low' | 'rig' | 'subsystem' | 'drone';
  slotIndex: number;
  moduleTypeId: number;
  moduleName: string;
  quantity: number;
  metaLevel: number;
  techLevel: number;
  cost: number;
  purpose: string;
  requiredSkills: ModuleSkillRequirement[];
}

export interface ModuleSkillRequirement {
  skillId: number;
  skillName: string;
  requiredLevel: number;
  currentLevel: number;
  canUse: boolean;
}

export interface FittingPerformance {
  estimatedDPS: number;
  volleyDamage: number;
  optimalRange: number;
  falloffRange: number;
  effectiveHP: number;
  shieldHP: number;
  armorHP: number;
  hullHP: number;
  shieldResists: DamageResists;
  armorResists: DamageResists;
  maxVelocity: number;
  agility: number;
  signatureRadius: number;
  capacitorStable: boolean;
  capacitorLastsTime?: number;
  scanResolution: number;
  lockRange: number;
  cargoCapacity: number;
  droneCapacity: number;
  specialMetrics?: SpecialMetrics;
}

export interface DamageResists {
  em: number;
  thermal: number;
  kinetic: number;
  explosive: number;
}

export interface SpecialMetrics {
  miningYield?: number;
  repairOutput?: number;
  jumpRange?: number;
  cloakStrength?: number;
  webStrength?: number;
  neut_nos_power?: number;
}

export interface AlternativeModule {
  originalModuleTypeId: number;
  alternativeModuleTypeId: number;
  alternativeModuleName: string;
  costDifference: number;
  performanceChange: string;
  reasoning: string;
}

export interface RequiredSkillSummary {
  totalSkillsRequired: number;
  totalSkillsMetByPilot: number;
  criticalMissingSkills: SkillRequirement[];
  recommendedTrainingOrder: SkillRequirement[];
  estimatedTrainingTime: number;
}

export interface ShipCostAnalysis {
  hullCost: number;
  fittingCostRange: {
    budget: number;
    balanced: number;
    optimal: number;
  };
  totalCostRange: {
    budget: number;
    balanced: number;
    optimal: number;
  };
  iskEfficiencyRating: number; // Performance per ISK
  budgetRecommendation: string;
}

export interface UpgradePath {
  upgradeType: 'ship' | 'modules' | 'skills';
  targetShipTypeId?: number;
  targetShipName?: string;
  costDifference: number;
  performanceGain: string;
  timeToAchieve: number;
  reasoning: string;
}

export interface AlternativeShipRecommendation {
  ship: ShipInfo;
  category: 'budget' | 'premium' | 'specialized' | 'beginner_friendly';
  score: number;
  oneLineSummary: string;
  bestFittingVariation: FittingVariation;
  whyConsider: string[];
}

export interface SkillGapAnalysis {
  overallSkillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  criticalSkillGaps: CriticalSkillGap[];
  trainingPriorities: TrainingPriority[];
  quickWins: QuickWin[];
  longTermGoals: LongTermGoal[];
}

export interface CriticalSkillGap {
  skillName: string;
  currentLevel: number;
  recommendedLevel: number;
  impact: string;
  trainingTime: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface TrainingPriority {
  rank: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  reasoning: string;
  trainingTime: number;
  unlocks: string[];
}

export interface QuickWin {
  skillName: string;
  fromLevel: number;
  toLevel: number;
  trainingTime: number;
  benefit: string;
}

export interface LongTermGoal {
  goalName: string;
  requiredSkills: SkillRequirement[];
  totalTrainingTime: number;
  benefits: string[];
}

export interface OptimizationSuggestion {
  category: 'fitting' | 'skills' | 'tactics' | 'economics';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedCost?: number;
  estimatedTime?: number;
}

export interface RecommendationSummary {
  topPickShip: string;
  topPickReasoning: string;
  budgetOption: string;
  advancedOption: string;
  keyInsights: string[];
  immediateActions: string[];
  trainingFocus: string;
  estimatedTimeToOptimal: number;
}

export interface SkillRequirement {
  skillId: number;
  skillName: string;
  requiredLevel: number;
  currentLevel: number;
  trainingTime: number;
}

/**
 * Activity-Based Recommendations Service - Main service class
 */
export class ActivityBasedRecommendationsService {
  private activityDatabase: Map<string, Activity> = new Map();
  private shipDatabase: Map<number, any> = new Map();
  private fittingTemplates: Map<string, FittingTemplate[]> = new Map();

  /**
   * Get comprehensive ship and fitting recommendations for an activity
   */
  async getActivityRecommendations(request: ActivityRecommendationRequest): Promise<ActivityRecommendationResult> {
    console.log(`🎯 Generating recommendations for activity: ${request.activityId}`);

    // 1. Load activity details
    const activityDetails = await this.getActivityDetails(request.activityId, request.tierId);
    
    // 2. Find suitable ships for this activity
    const suitableShips = await this.findSuitableShips(request);
    
    // 3. Analyze each ship and generate fitting variations
    const shipRecommendations = await this.generateShipRecommendations(suitableShips, request);
    
    // 4. Find alternative ships
    const alternativeShips = await this.findAlternativeShips(suitableShips, request);
    
    // 5. Analyze skill gaps
    const skillGaps = await this.analyzeSkillGaps(shipRecommendations, request.pilotSkills);
    
    // 6. Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(shipRecommendations, request);
    
    // 7. Create summary
    const summary = this.generateRecommendationSummary(shipRecommendations, request);

    const result: ActivityRecommendationResult = {
      request,
      activityDetails,
      recommendedShips: shipRecommendations.slice(0, 3), // Top 3 ships
      alternativeShips,
      skillGaps,
      optimizationSuggestions,
      summary
    };

    console.log(`✅ Generated ${result.recommendedShips.length} ship recommendations with ${result.recommendedShips.reduce((total, ship) => total + ship.fittingVariations.length, 0)} total fitting variations`);
    
    return result;
  }

  /**
   * Get fitting variations for a specific ship and activity
   */
  async getFittingVariationsForShip(
    shipTypeId: number, 
    activityId: string, 
    pilotSkills?: PilotSkills
  ): Promise<FittingVariation[]> {
    console.log(`🔧 Generating fitting variations for ship ${shipTypeId} and activity ${activityId}`);

    const ship = await this.getShipData(shipTypeId);
    if (!ship) {
      throw new Error(`Ship with type ID ${shipTypeId} not found`);
    }

    const variations: FittingVariation[] = [];

    // Generate each type of fitting variation
    const variationTypes: Array<'max_dps' | 'max_tank' | 'speed_tank' | 'balanced' | 'budget'> = 
      ['max_dps', 'max_tank', 'speed_tank', 'balanced', 'budget'];

    for (const variationType of variationTypes) {
      try {
        const variation = await this.generateFittingVariation(ship, activityId, variationType, pilotSkills);
        variations.push(variation);
      } catch (error) {
        console.warn(`⚠️ Failed to generate ${variationType} fitting for ${ship.typeName}:`, error);
      }
    }

    return variations;
  }

  /**
   * Compare ships for a specific activity
   */
  async compareShipsForActivity(
    shipTypeIds: number[], 
    activityId: string, 
    pilotSkills?: PilotSkills
  ): Promise<ShipRecommendation[]> {
    console.log(`⚖️ Comparing ${shipTypeIds.length} ships for activity ${activityId}`);

    const comparisons: ShipRecommendation[] = [];

    for (let i = 0; i < shipTypeIds.length; i++) {
      const shipTypeId = shipTypeIds[i];
      try {
        const ship = await this.getShipData(shipTypeId);
        if (!ship) continue;

        const fittingVariations = await this.getFittingVariationsForShip(shipTypeId, activityId, pilotSkills);
        const compatibility = await this.calculatePilotCompatibility(ship, pilotSkills);
        const costAnalysis = await this.calculateShipCostAnalysis(ship, fittingVariations);
        
        const recommendation: ShipRecommendation = {
          rank: i + 1,
          ship: await this.convertToShipInfo(ship),
          overallScore: this.calculateOverallShipScore(ship, activityId, compatibility),
          pilotCompatibility: compatibility,
          fittingVariations,
          pros: this.generateShipPros(ship, activityId),
          cons: this.generateShipCons(ship, activityId),
          skillRequirements: await this.generateRequiredSkillSummary(ship, pilotSkills),
          costAnalysis,
          alternativeUpgrades: await this.generateUpgradePaths(ship, activityId)
        };

        comparisons.push(recommendation);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ship ${shipTypeId}:`, error);
      }
    }

    // Sort by overall score
    return comparisons.sort((a, b) => b.overallScore - a.overallScore);
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private async getActivityDetails(activityId: string, tierId?: string): Promise<ActivityDetails> {
    // This would query the activity selection service
    const activityMap: Record<string, ActivityDetails> = {
      'mission_running': {
        activityId: 'mission_running',
        activityName: 'Mission Running',
        description: 'PvE missions and complexes for ISK and loyalty points',
        keyRequirements: ['Combat skills', 'Tank fitting', 'DPS optimization'],
        commonChallenges: ['NPC damage types', 'Range management', 'Capacitor stability'],
        successMetrics: ['ISK per hour', 'Mission completion time', 'Survival rate']
      },
      'mining': {
        activityId: 'mining',
        activityName: 'Mining & Industry',
        description: 'Resource extraction and ore processing',
        keyRequirements: ['Mining yield', 'Cargo capacity', 'Defense against ganks'],
        commonChallenges: ['Ore prices', 'Ganker threats', 'Market competition'],
        successMetrics: ['Ore yield per hour', 'ISK per hour', 'Efficiency ratio']
      },
      'pvp': {
        activityId: 'pvp',
        activityName: 'PvP Combat',
        description: 'Player vs Player combat in various forms',
        keyRequirements: ['Damage output', 'Survivability', 'Mobility'],
        commonChallenges: ['Target selection', 'Range control', 'Fleet coordination'],
        successMetrics: ['Kill efficiency', 'Damage dealt', 'Survival rate']
      }
    };

    return activityMap[activityId] || {
      activityId,
      activityName: 'Unknown Activity',
      description: 'Custom activity',
      keyRequirements: [],
      commonChallenges: [],
      successMetrics: []
    };
  }

  private async findSuitableShips(request: ActivityRecommendationRequest): Promise<any[]> {
    try {
      const allShips = await window.electronAPI.sde.getShips();
      
      // Filter ships based on activity
      const suitableGroups = this.getSuitableShipGroups(request.activityId);
      
      return allShips.filter(ship => {
        // Filter by ship group
        if (suitableGroups.length > 0 && !suitableGroups.includes(ship.groupName)) {
          return false;
        }

        // Filter by race preference
        if (request.preferredRace && request.preferredRace !== 'All' && ship.raceName !== request.preferredRace) {
          return false;
        }

        // Filter by published status
        if (!ship.published) {
          return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Failed to find suitable ships:', error);
      return [];
    }
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
        'Expedition Frigate'
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

  private async generateShipRecommendations(
    ships: any[], 
    request: ActivityRecommendationRequest
  ): Promise<ShipRecommendation[]> {
    const recommendations: ShipRecommendation[] = [];

    for (let i = 0; i < Math.min(ships.length, 10); i++) { // Analyze top 10 ships
      const ship = ships[i];
      try {
        const fittingVariations = await this.getFittingVariationsForShip(ship.typeID, request.activityId, request.pilotSkills);
        const compatibility = await this.calculatePilotCompatibility(ship, request.pilotSkills);
        const costAnalysis = await this.calculateShipCostAnalysis(ship, fittingVariations);
        
        const recommendation: ShipRecommendation = {
          rank: i + 1,
          ship: await this.convertToShipInfo(ship),
          overallScore: this.calculateOverallShipScore(ship, request.activityId, compatibility),
          pilotCompatibility: compatibility,
          fittingVariations,
          pros: this.generateShipPros(ship, request.activityId),
          cons: this.generateShipCons(ship, request.activityId),
          skillRequirements: await this.generateRequiredSkillSummary(ship, request.pilotSkills),
          costAnalysis,
          alternativeUpgrades: await this.generateUpgradePaths(ship, request.activityId)
        };

        recommendations.push(recommendation);
      } catch (error) {
        console.warn(`⚠️ Failed to generate recommendation for ship ${ship.typeName}:`, error);
      }
    }

    // Sort by overall score and return top recommendations
    return recommendations.sort((a, b) => b.overallScore - a.overallScore);
  }

  private async generateFittingVariation(
    ship: any, 
    activityId: string, 
    variationType: 'max_dps' | 'max_tank' | 'speed_tank' | 'balanced' | 'budget',
    pilotSkills?: PilotSkills
  ): Promise<FittingVariation> {
    // Generate fitting based on variation type and activity
    const fittingModules = await this.generateFittingModules(ship, activityId, variationType);
    const performance = await this.calculateFittingPerformance(ship, fittingModules);
    const skillRequirements = await this.calculateFittingSkillRequirements(fittingModules, pilotSkills);
    
    const variation: FittingVariation = {
      variationType,
      name: this.getFittingVariationName(variationType, activityId),
      description: this.getFittingVariationDescription(variationType, activityId),
      totalCost: fittingModules.reduce((total, module) => total + (module.cost * module.quantity), 0),
      fittingModules,
      performanceMetrics: performance,
      skillRequirements,
      pilotCanUse: pilotSkills ? this.canPilotUseFitting(skillRequirements, pilotSkills) : true,
      alternativeModules: [],
      fittingNotes: this.generateFittingNotes(variationType, activityId, ship)
    };

    return variation;
  }

  private getFittingVariationName(variationType: string, activityId: string): string {
    const names: Record<string, string> = {
      'max_dps': 'Maximum DPS',
      'max_tank': 'Maximum Tank',
      'speed_tank': 'Speed Tank',
      'balanced': 'Balanced',
      'budget': 'Budget Friendly'
    };
    return names[variationType] || variationType;
  }

  private getFittingVariationDescription(variationType: string, activityId: string): string {
    const descriptions: Record<string, string> = {
      'max_dps': 'Maximizes damage output at the expense of tank',
      'max_tank': 'Prioritizes survivability and damage mitigation',
      'speed_tank': 'Uses speed and agility to avoid damage',
      'balanced': 'Balanced approach to damage, tank, and utility',
      'budget': 'Cost-effective fitting for new players'
    };
    return descriptions[variationType] || 'Custom fitting variation';
  }

  private async generateFittingModules(
    ship: any, 
    activityId: string, 
    variationType: string
  ): Promise<FittingModule[]> {
    // This would generate actual fitting modules based on the ship, activity, and variation type
    // For now, returning mock data
    const modules: FittingModule[] = [];

    // High slots (weapons)
    for (let i = 0; i < (ship.highSlots || 6); i++) {
      modules.push({
        slotType: 'high',
        slotIndex: i,
        moduleTypeId: 2969, // Heavy Assault Missile Launcher II
        moduleName: 'Heavy Assault Missile Launcher II',
        quantity: 1,
        metaLevel: 5,
        techLevel: 2,
        cost: 2000000,
        purpose: 'Primary weapon system',
        requiredSkills: [
          {
            skillId: 20312,
            skillName: 'Heavy Assault Missiles',
            requiredLevel: 1,
            currentLevel: 0,
            canUse: false
          }
        ]
      });
    }

    // Med slots (tank/utility)
    for (let i = 0; i < Math.min(ship.medSlots || 4, 4); i++) {
      modules.push({
        slotType: 'med',
        slotIndex: i,
        moduleTypeId: 5443, // Large Shield Extender II
        moduleName: 'Large Shield Extender II',
        quantity: 1,
        metaLevel: 5,
        techLevel: 2,
        cost: 1500000,
        purpose: 'Shield tank',
        requiredSkills: []
      });
    }

    // Low slots (damage mods/utility)
    for (let i = 0; i < Math.min(ship.lowSlots || 5, 3); i++) {
      modules.push({
        slotType: 'low',
        slotIndex: i,
        moduleTypeId: 19739, // Ballistic Control System II
        moduleName: 'Ballistic Control System II',
        quantity: 1,
        metaLevel: 5,
        techLevel: 2,
        cost: 3000000,
        purpose: 'Damage enhancement',
        requiredSkills: []
      });
    }

    return modules;
  }

  private async calculateFittingPerformance(ship: any, modules: FittingModule[]): Promise<FittingPerformance> {
    // Calculate fitting performance based on ship stats and modules
    // This would use the EVE Dogma engine for accurate calculations
    
    return {
      estimatedDPS: 450,
      volleyDamage: 2250,
      optimalRange: 50000,
      falloffRange: 15000,
      effectiveHP: 85000,
      shieldHP: 12000,
      armorHP: 3500,
      hullHP: 5500,
      shieldResists: { em: 0.25, thermal: 0.40, kinetic: 0.60, explosive: 0.50 },
      armorResists: { em: 0.60, thermal: 0.35, kinetic: 0.25, explosive: 0.10 },
      maxVelocity: 125,
      agility: 0.52,
      signatureRadius: 340,
      capacitorStable: true,
      scanResolution: 105,
      lockRange: 87500,
      cargoCapacity: 450,
      droneCapacity: 125
    };
  }

  private async calculateFittingSkillRequirements(
    modules: FittingModule[], 
    pilotSkills?: PilotSkills
  ): Promise<SkillRequirement[]> {
    const allSkills = new Map<number, SkillRequirement>();

    for (const module of modules) {
      for (const skill of module.requiredSkills) {
        if (!allSkills.has(skill.skillId)) {
          allSkills.set(skill.skillId, {
            skillId: skill.skillId,
            skillName: skill.skillName,
            requiredLevel: skill.requiredLevel,
            currentLevel: pilotSkills?.skills.find(s => s.skillId === skill.skillId)?.trainedLevel || 0,
            trainingTime: this.calculateTrainingTime(skill.requiredLevel)
          });
        } else {
          // Update to highest required level
          const existing = allSkills.get(skill.skillId)!;
          if (skill.requiredLevel > existing.requiredLevel) {
            existing.requiredLevel = skill.requiredLevel;
          }
        }
      }
    }

    return Array.from(allSkills.values());
  }

  private calculateTrainingTime(level: number): number {
    // Simplified training time calculation (in milliseconds)
    const times = [0, 30 * 60 * 1000, 2 * 60 * 60 * 1000, 8 * 60 * 60 * 1000, 2 * 24 * 60 * 60 * 1000, 8 * 24 * 60 * 60 * 1000];
    return times[level] || 0;
  }

  private canPilotUseFitting(skillRequirements: SkillRequirement[], pilotSkills: PilotSkills): boolean {
    return skillRequirements.every(req => req.currentLevel >= req.requiredLevel);
  }

  private generateFittingNotes(variationType: string, activityId: string, ship: any): string[] {
    const notes: string[] = [];

    switch (variationType) {
      case 'max_dps':
        notes.push('Prioritizes damage output over survivability');
        notes.push('Requires good piloting skills and situational awareness');
        break;
      case 'max_tank':
        notes.push('Excellent survivability for challenging content');
        notes.push('Lower damage output but very forgiving');
        break;
      case 'speed_tank':
        notes.push('Uses speed and agility to avoid damage');
        notes.push('Requires active piloting and good range control');
        break;
      case 'balanced':
        notes.push('Good balance of damage, tank, and utility');
        notes.push('Versatile fitting suitable for most situations');
        break;
      case 'budget':
        notes.push('Cost-effective option for new players');
        notes.push('Performance may be lower but manageable costs');
        break;
    }

    return notes;
  }

  private async getShipData(typeId: number): Promise<any> {
    try {
      const ships = await window.electronAPI.sde.getShips();
      return ships.find(s => s.typeID === typeId);
    } catch (error) {
      console.error(`Failed to get ship data for ${typeId}:`, error);
      return null;
    }
  }

  private async calculatePilotCompatibility(ship: any, pilotSkills?: PilotSkills): Promise<PilotCompatibilityScore> {
    if (!pilotSkills) {
      return {
        canFlyShip: false,
        canUseOptimalFit: false,
        skillsMetPercentage: 0,
        missingCriticalSkills: 0,
        trainingTimeToFly: 0,
        trainingTimeToOptimal: 0,
        overallCompatibility: 0
      };
    }

    // This would analyze actual ship requirements vs pilot skills
    return {
      canFlyShip: true,
      canUseOptimalFit: true,
      skillsMetPercentage: 85,
      missingCriticalSkills: 2,
      trainingTimeToFly: 0,
      trainingTimeToOptimal: 5 * 24 * 60 * 60 * 1000, // 5 days
      overallCompatibility: 85
    };
  }

  private async calculateShipCostAnalysis(ship: any, fittingVariations: FittingVariation[]): Promise<ShipCostAnalysis> {
    const hullCost = 75000000; // Mock hull cost
    
    const fittingCosts = {
      budget: fittingVariations.find(f => f.variationType === 'budget')?.totalCost || 25000000,
      balanced: fittingVariations.find(f => f.variationType === 'balanced')?.totalCost || 50000000,
      optimal: fittingVariations.find(f => f.variationType === 'max_dps')?.totalCost || 100000000
    };

    return {
      hullCost,
      fittingCostRange: fittingCosts,
      totalCostRange: {
        budget: hullCost + fittingCosts.budget,
        balanced: hullCost + fittingCosts.balanced,
        optimal: hullCost + fittingCosts.optimal
      },
      iskEfficiencyRating: 7.5,
      budgetRecommendation: 'Balanced fit offers best value for money'
    };
  }

  private calculateOverallShipScore(ship: any, activityId: string, compatibility: PilotCompatibilityScore): number {
    let score = 70; // Base score

    // Adjust based on activity suitability
    const activitySuitability = this.getShipActivitySuitability(ship.groupName, activityId);
    score += activitySuitability;

    // Adjust based on pilot compatibility
    score += compatibility.overallCompatibility * 0.3;

    return Math.min(100, Math.max(0, score));
  }

  private getShipActivitySuitability(shipGroup: string, activityId: string): number {
    const suitabilityScores: Record<string, Record<string, number>> = {
      'mission_running': {
        'Marauder': 30,
        'Battleship': 25,
        'Heavy Assault Cruiser': 20,
        'Battlecruiser': 15,
        'Cruiser': 10,
        'Frigate': 5
      },
      'mining': {
        'Exhumer': 30,
        'Mining Barge': 25,
        'Industrial': 10,
        'Venture': 15
      },
      'pvp': {
        'Interceptor': 25,
        'Assault Frigate': 20,
        'Heavy Assault Cruiser': 20,
        'Cruiser': 15,
        'Frigate': 15
      }
    };

    return suitabilityScores[activityId]?.[shipGroup] || 0;
  }

  private async convertToShipInfo(ship: any): Promise<ShipInfo> {
    return {
      typeId: ship.typeID,
      typeName: ship.typeName,
      groupName: ship.groupName,
      raceName: ship.raceName,
      hullBonuses: [], // Would be populated from ship attributes
      baseStats: {
        powerGrid: ship.powerGrid || 0,
        cpu: ship.cpu || 0,
        highSlots: ship.highSlots || 0,
        medSlots: ship.medSlots || 0,
        lowSlots: ship.lowSlots || 0,
        rigSlots: ship.rigSlots || 3,
        turretHardpoints: ship.turretHardpoints || 0,
        launcherHardpoints: ship.launcherHardpoints || 0,
        droneCapacity: ship.droneCapacity || 0,
        droneBandwidth: ship.droneBandwidth || 0,
        cargoCapacity: ship.capacity || 0,
        baseShield: ship.shieldHP || 0,
        baseArmor: ship.armorHP || 0,
        baseHull: ship.hullHP || 0,
        maxVelocity: ship.maxVelocity || 0,
        agility: ship.agility || 0,
        warpSpeed: ship.warpSpeed || 0,
        mass: ship.mass || 0
      },
      description: ship.description || ''
    };
  }

  private generateShipPros(ship: any, activityId: string): string[] {
    // Generate pros based on ship characteristics and activity
    const pros: string[] = [];
    
    if (ship.groupName === 'Battleship') {
      pros.push('High damage potential');
      pros.push('Excellent tank capabilities');
      pros.push('Good slot layout flexibility');
    }
    
    if (ship.raceName === 'Caldari') {
      pros.push('Strong shield tank');
      pros.push('Long range missile systems');
    }

    return pros;
  }

  private generateShipCons(ship: any, activityId: string): string[] {
    // Generate cons based on ship characteristics and activity
    const cons: string[] = [];
    
    if (ship.groupName === 'Battleship') {
      cons.push('Slow and less agile');
      cons.push('High skill requirements');
      cons.push('Expensive to fit properly');
    }

    return cons;
  }

  private async generateRequiredSkillSummary(ship: any, pilotSkills?: PilotSkills): Promise<RequiredSkillSummary> {
    try {
      const requirements = await window.electronAPI.sde.getSkillRequirements(ship.typeID);
      
      return {
        totalSkillsRequired: requirements.length,
        totalSkillsMetByPilot: pilotSkills?.skills.filter(s => 
          requirements.some(req => req.skillId === s.skillId && s.trainedLevel >= req.requiredLevel)
        ).length || 0,
        criticalMissingSkills: [],
        recommendedTrainingOrder: [],
        estimatedTrainingTime: 3 * 24 * 60 * 60 * 1000 // 3 days
      };
    } catch (error) {
      return {
        totalSkillsRequired: 0,
        totalSkillsMetByPilot: 0,
        criticalMissingSkills: [],
        recommendedTrainingOrder: [],
        estimatedTrainingTime: 0
      };
    }
  }

  private async generateUpgradePaths(ship: any, activityId: string): Promise<UpgradePath[]> {
    // Generate upgrade paths for better ships or fittings
    return [
      {
        upgradeType: 'ship',
        targetShipName: 'Raven Navy Issue',
        costDifference: 200000000,
        performanceGain: '25% more DPS, 15% better tank',
        timeToAchieve: 14 * 24 * 60 * 60 * 1000, // 14 days
        reasoning: 'Superior hull bonuses and fitting capacity'
      }
    ];
  }

  private async findAlternativeShips(mainShips: any[], request: ActivityRecommendationRequest): Promise<AlternativeShipRecommendation[]> {
    // Find alternative ships in different categories
    return [];
  }

  private async analyzeSkillGaps(recommendations: ShipRecommendation[], pilotSkills?: PilotSkills): Promise<SkillGapAnalysis> {
    return {
      overallSkillLevel: 'Intermediate',
      criticalSkillGaps: [],
      trainingPriorities: [],
      quickWins: [],
      longTermGoals: []
    };
  }

  private generateOptimizationSuggestions(recommendations: ShipRecommendation[], request: ActivityRecommendationRequest): OptimizationSuggestion[] {
    return [
      {
        category: 'fitting',
        title: 'Upgrade to Tech 2 weapons',
        description: 'Tech 2 weapons provide significantly better damage and fitting flexibility',
        impact: 'High',
        difficulty: 'Medium',
        estimatedCost: 50000000,
        estimatedTime: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    ];
  }

  private generateRecommendationSummary(recommendations: ShipRecommendation[], request: ActivityRecommendationRequest): RecommendationSummary {
    const topShip = recommendations[0];
    
    return {
      topPickShip: topShip?.ship.typeName || 'No suitable ships found',
      topPickReasoning: 'Best balance of performance, cost, and pilot compatibility',
      budgetOption: recommendations.find(r => r.costAnalysis.iskEfficiencyRating > 8)?.ship.typeName || 'See budget fits',
      advancedOption: recommendations.find(r => r.overallScore > 90)?.ship.typeName || 'See advanced fits',
      keyInsights: [
        'Focus on shield tank for this activity',
        'Missile systems provide good range and damage',
        'Consider training support skills for better performance'
      ],
      immediateActions: [
        'Train core fitting skills to level 4',
        'Acquire budget fitting modules',
        'Practice with cheaper ships first'
      ],
      trainingFocus: 'Missile and shield skills',
      estimatedTimeToOptimal: 21 * 24 * 60 * 60 * 1000 // 21 days
    };
  }
}

interface FittingTemplate {
  variationType: string;
  activityId: string;
  shipGroup: string;
  modules: FittingModule[];
}

// Export service instance
export const activityBasedRecommendationsService = new ActivityBasedRecommendationsService();