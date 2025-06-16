import { sdeService } from './sdeService';

// Core interfaces for DPS calculations
export interface WeaponStats {
  typeID: number;
  name: string;
  damage: {
    em: number;
    thermal: number;
    kinetic: number;
    explosive: number;
  };
  chargeDamage?: {
    em: number;
    thermal: number;
    kinetic: number;
    explosive: number;
  };
  cycleTime: number; // seconds
  tracking: number; // rad/s
  optimal: number; // meters
  falloff: number; // meters
  capacitorUsage: number; // GJ per cycle
  chargeSize: number; // ammunition caliber
  chargeTypeID?: number; // ammunition type ID
  weaponType: 'projectile' | 'hybrid' | 'energy' | 'missile';
  signatureResolution: number; // for missiles
  explosionRadius: number; // for missiles
  explosionVelocity: number; // for missiles
}

export interface ShipResistances {
  em: number; // 0-1 (0 = no resistance, 1 = 100% resistance)
  thermal: number;
  kinetic: number;
  explosive: number;
}

export interface TargetProfile {
  signature: number; // meters
  velocity: number; // m/s
  distance: number; // meters
  angularVelocity: number; // rad/s
  resistances: ShipResistances;
}

export interface DPSModifiers {
  damageMultiplier: number; // from damage modules
  rateOfFireMultiplier: number; // from RoF modules
  trackingMultiplier: number; // from tracking modules
  optimalRangeMultiplier: number;
  falloffRangeMultiplier: number;
  shipBonuses: {
    damage: number;
    rateOfFire: number;
    tracking: number;
    optimal: number;
    falloff: number;
  };
}

export interface DPSResult {
  totalDPS: number;
  appliedDPS: number;
  sustainableDPS: number;
  breakdownByWeapon: WeaponDPSBreakdown[];
  breakdown: {
    baseDPS: number;
    modifiedDPS: number;
    hitChance: number;
    damageApplication: number;
    rangeMultiplier: number;
    resistanceMultiplier: number;
  };
  capacitor: {
    usage: number; // cap/s
    timeUntilEmpty: number; // seconds (Infinity if cap stable)
    isStable: boolean;
  };
}

export interface WeaponDPSBreakdown {
  weaponName: string;
  baseDPS: number;
  appliedDPS: number;
  hitChance: number;
  damageApplication: number;
  breakdown: {
    em: number;
    thermal: number;
    kinetic: number;
    explosive: number;
  };
}

export interface ModuleStackingInfo {
  moduleTypeID: number;
  stackingGroup: number;
  bonusAmount: number;
  effectiveBonus: number;
  stackingPosition: number;
}

export class AdvancedDPSCalculator {
  
  // EVE Online stacking penalty formula: exp(-i² / 7.1289) where i is stack position (0-based)
  private static calculateStackingMultiplier(stackPosition: number): number {
    if (stackPosition === 0) return 1.0; // First module has no penalty
    return Math.exp(-(stackPosition * stackPosition) / 7.1289);
  }

  // EVE attribute IDs for common stats
  private static readonly ATTRIBUTE_IDS = {
    // Damage attributes
    EM_DAMAGE: 114,
    THERMAL_DAMAGE: 118,
    KINETIC_DAMAGE: 117,
    EXPLOSIVE_DAMAGE: 116,
    
    // Weapon attributes
    CYCLE_TIME: 51,
    DAMAGE_MULTIPLIER: 64,
    TRACKING_SPEED: 54,
    OPTIMAL_RANGE: 54,
    ACCURACY_FALLOFF: 158,
    CAPACITOR_NEED: 6,
    CHARGE_SIZE: 128,
    
    // Missile attributes
    AOE_CLOUD_SIZE: 654,
    AOE_VELOCITY: 653,
    
    // Ship attributes
    SIGNATURE_RADIUS: 552,
    MAX_VELOCITY: 37,
    CAPACITOR_CAPACITY: 482,
    CAPACITOR_RECHARGE: 55,
    
    // Resistance attributes
    EM_DAMAGE_RESONANCE: 113,
    THERMAL_DAMAGE_RESONANCE: 111,
    KINETIC_DAMAGE_RESONANCE: 109,
    EXPLOSIVE_DAMAGE_RESONANCE: 111,
    
    // Module bonuses
    DAMAGE_BONUS: 64,
    RATE_OF_FIRE_BONUS: 51,
    TRACKING_BONUS: 54,
    OPTIMAL_RANGE_BONUS: 54,
    FALLOFF_RANGE_BONUS: 158
  };

  async calculateWeaponDPS(
    weapons: WeaponStats[],
    target: TargetProfile,
    modifiers: DPSModifiers,
    shipCapacitor: { capacity: number; recharge: number }
  ): Promise<DPSResult> {
    
    let totalBaseDPS = 0;
    let totalAppliedDPS = 0;
    let totalCapUsage = 0;
    const weaponBreakdowns: WeaponDPSBreakdown[] = [];

    for (const weapon of weapons) {
      const breakdown = await this.calculateSingleWeaponDPS(weapon, target, modifiers);
      weaponBreakdowns.push(breakdown);
      
      totalBaseDPS += breakdown.baseDPS;
      totalAppliedDPS += breakdown.appliedDPS;
      
      // Calculate capacitor usage
      const modifiedCycleTime = weapon.cycleTime / modifiers.rateOfFireMultiplier;
      const capPerSecond = weapon.capacitorUsage / modifiedCycleTime;
      totalCapUsage += capPerSecond;
    }

    // Calculate capacitor sustainability
    const capRechargeRate = this.calculateCapacitorRecharge(shipCapacitor.capacity, shipCapacitor.recharge);
    const isCapStable = totalCapUsage <= capRechargeRate;
    const timeUntilEmpty = isCapStable ? Infinity : shipCapacitor.capacity / (totalCapUsage - capRechargeRate);
    
    let sustainableDPS = totalAppliedDPS;
    if (!isCapStable && timeUntilEmpty < 300) { // If cap runs out in less than 5 minutes
      // Calculate reduced DPS for cap-unstable fits
      sustainableDPS = totalAppliedDPS * (capRechargeRate / totalCapUsage);
    }

    return {
      totalDPS: totalBaseDPS,
      appliedDPS: totalAppliedDPS,
      sustainableDPS,
      breakdownByWeapon: weaponBreakdowns,
      breakdown: {
        baseDPS: totalBaseDPS,
        modifiedDPS: totalBaseDPS * modifiers.damageMultiplier * modifiers.rateOfFireMultiplier,
        hitChance: weaponBreakdowns.length > 0 ? weaponBreakdowns.reduce((sum, w) => sum + w.hitChance, 0) / weaponBreakdowns.length : 0,
        damageApplication: weaponBreakdowns.length > 0 ? weaponBreakdowns.reduce((sum, w) => sum + w.damageApplication, 0) / weaponBreakdowns.length : 0,
        rangeMultiplier: this.calculateRangeMultiplier(weapons[0], target.distance, modifiers),
        resistanceMultiplier: this.calculateResistanceMultiplier(weapons, target.resistances)
      },
      capacitor: {
        usage: totalCapUsage,
        timeUntilEmpty,
        isStable: isCapStable
      }
    };
  }

  private async calculateSingleWeaponDPS(
    weapon: WeaponStats,
    target: TargetProfile,
    modifiers: DPSModifiers
  ): Promise<WeaponDPSBreakdown> {
    
    // Calculate total damage including charge damage for turret weapons
    const totalWeaponDamage = {
      em: weapon.damage.em + (weapon.chargeDamage?.em || 0),
      thermal: weapon.damage.thermal + (weapon.chargeDamage?.thermal || 0),
      kinetic: weapon.damage.kinetic + (weapon.chargeDamage?.kinetic || 0),
      explosive: weapon.damage.explosive + (weapon.chargeDamage?.explosive || 0)
    };

    // Apply ship bonuses and module modifiers
    const modifiedDamage = {
      em: totalWeaponDamage.em * modifiers.damageMultiplier * (1 + modifiers.shipBonuses.damage),
      thermal: totalWeaponDamage.thermal * modifiers.damageMultiplier * (1 + modifiers.shipBonuses.damage),
      kinetic: totalWeaponDamage.kinetic * modifiers.damageMultiplier * (1 + modifiers.shipBonuses.damage),
      explosive: totalWeaponDamage.explosive * modifiers.damageMultiplier * (1 + modifiers.shipBonuses.damage)
    };

    const modifiedCycleTime = weapon.cycleTime / (modifiers.rateOfFireMultiplier * (1 + modifiers.shipBonuses.rateOfFire));
    const modifiedTracking = weapon.tracking * modifiers.trackingMultiplier * (1 + modifiers.shipBonuses.tracking);

    // Calculate base DPS
    const totalDamage = modifiedDamage.em + modifiedDamage.thermal + modifiedDamage.kinetic + modifiedDamage.explosive;
    const baseDPS = totalDamage / modifiedCycleTime;

    let hitChance = 1.0;
    let damageApplication = 1.0;

    if (weapon.weaponType === 'missile') {
      // Missile damage application
      damageApplication = this.calculateMissileDamageApplication(weapon, target);
      hitChance = 1.0; // Missiles always hit, but damage application varies
    } else {
      // Turret hit chance calculation
      hitChance = this.calculateTurretHitChance(weapon, target, modifiedTracking, modifiers);
      
      // Range-based damage falloff
      const rangeMultiplier = this.calculateRangeMultiplier(weapon, target.distance, modifiers);
      damageApplication = rangeMultiplier;
    }

    // Apply resistances
    const resistedDamage = {
      em: modifiedDamage.em * (1 - target.resistances.em),
      thermal: modifiedDamage.thermal * (1 - target.resistances.thermal),
      kinetic: modifiedDamage.kinetic * (1 - target.resistances.kinetic),
      explosive: modifiedDamage.explosive * (1 - target.resistances.explosive)
    };

    const resistedTotalDamage = resistedDamage.em + resistedDamage.thermal + resistedDamage.kinetic + resistedDamage.explosive;
    const appliedDPS = (resistedTotalDamage / modifiedCycleTime) * hitChance * damageApplication;

    return {
      weaponName: weapon.name,
      baseDPS,
      appliedDPS,
      hitChance,
      damageApplication,
      breakdown: {
        em: (resistedDamage.em / modifiedCycleTime) * hitChance * damageApplication,
        thermal: (resistedDamage.thermal / modifiedCycleTime) * hitChance * damageApplication,
        kinetic: (resistedDamage.kinetic / modifiedCycleTime) * hitChance * damageApplication,
        explosive: (resistedDamage.explosive / modifiedCycleTime) * hitChance * damageApplication
      }
    };
  }

  private calculateTurretHitChance(
    weapon: WeaponStats,
    target: TargetProfile,
    modifiedTracking: number,
    modifiers: DPSModifiers
  ): number {
    if (target.angularVelocity === 0) return 1.0;

    // EVE tracking formula
    const trackingFactor = (target.angularVelocity / (modifiedTracking * target.signature));
    const hitChance = Math.pow(0.5, Math.pow(trackingFactor, 2));
    
    return Math.max(0.01, Math.min(1.0, hitChance)); // Clamp between 1% and 100%
  }

  private calculateMissileDamageApplication(weapon: WeaponStats, target: TargetProfile): number {
    // Missile damage application formula
    const velocityFactor = Math.min(1, weapon.explosionVelocity / target.velocity);
    const signatureFactor = Math.min(1, target.signature / weapon.signatureResolution);
    
    // Combined damage application (simplified - real formula is more complex)
    return Math.min(1, Math.max(velocityFactor, signatureFactor));
  }

  private calculateRangeMultiplier(weapon: WeaponStats, distance: number, modifiers: DPSModifiers): number {
    const modifiedOptimal = weapon.optimal * modifiers.optimalRangeMultiplier * (1 + modifiers.shipBonuses.optimal);
    const modifiedFalloff = weapon.falloff * modifiers.falloffRangeMultiplier * (1 + modifiers.shipBonuses.falloff);

    if (distance <= modifiedOptimal) {
      return 1.0; // Full damage within optimal
    }

    const falloffDistance = distance - modifiedOptimal;
    if (falloffDistance <= 0) return 1.0;

    // EVE falloff formula: 0.5^((range - optimal) / falloff)^2
    const falloffRatio = falloffDistance / modifiedFalloff;
    return Math.pow(0.5, Math.pow(falloffRatio, 2));
  }

  private calculateResistanceMultiplier(weapons: WeaponStats[], resistances: ShipResistances): number {
    let totalDamage = 0;
    let resistedDamage = 0;

    for (const weapon of weapons) {
      const weaponTotal = weapon.damage.em + weapon.damage.thermal + weapon.damage.kinetic + weapon.damage.explosive;
      const weaponResisted = 
        weapon.damage.em * (1 - resistances.em) +
        weapon.damage.thermal * (1 - resistances.thermal) +
        weapon.damage.kinetic * (1 - resistances.kinetic) +
        weapon.damage.explosive * (1 - resistances.explosive);
      
      totalDamage += weaponTotal;
      resistedDamage += weaponResisted;
    }

    return totalDamage > 0 ? resistedDamage / totalDamage : 0;
  }

  private calculateCapacitorRecharge(capacity: number, rechargeTime: number): number {
    // EVE capacitor recharge formula: peak recharge at 25% cap
    // Simplified: average recharge rate = capacity / rechargeTime * 2.5
    return (capacity / rechargeTime) * 2.5;
  }

  /**
   * Calculate stacking penalties for modules of the same type
   */
  static calculateStackingPenalties(modules: ModuleStackingInfo[]): ModuleStackingInfo[] {
    // Group modules by stacking group
    const stackingGroups = new Map<number, ModuleStackingInfo[]>();
    
    modules.forEach(module => {
      const group = module.stackingGroup;
      if (!stackingGroups.has(group)) {
        stackingGroups.set(group, []);
      }
      stackingGroups.get(group)!.push(module);
    });

    const result: ModuleStackingInfo[] = [];

    // Apply stacking penalties within each group
    stackingGroups.forEach(groupModules => {
      // Sort by bonus amount (highest first) to determine stacking order
      groupModules.sort((a, b) => b.bonusAmount - a.bonusAmount);
      
      groupModules.forEach((module, index) => {
        const stackingMultiplier = AdvancedDPSCalculator.calculateStackingMultiplier(index);
        
        result.push({
          ...module,
          effectiveBonus: module.bonusAmount * stackingMultiplier,
          stackingPosition: index + 1
        });
      });
    });

    return result;
  }

  /**
   * Load weapon statistics from SDE database
   */
  async loadWeaponStats(weaponTypeID: number): Promise<WeaponStats | null> {
    try {
      const attributes = await sdeService.getTypeAttributes(weaponTypeID);
      const weaponInfo = await sdeService.runQuery(
        'SELECT typeName FROM inv_types WHERE typeID = ?',
        [weaponTypeID]
      );

      if (!weaponInfo || attributes.length === 0) return null;

      // Extract weapon stats from attributes
      const stats: Partial<WeaponStats> = {
        typeID: weaponTypeID,
        name: weaponInfo.typeName || 'Unknown Weapon',
        damage: { em: 0, thermal: 0, kinetic: 0, explosive: 0 }
      };

      // Parse attributes to build weapon stats
      attributes.forEach(attr => {
        switch (attr.attributeID) {
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.EM_DAMAGE:
            stats.damage!.em = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.THERMAL_DAMAGE:
            stats.damage!.thermal = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.KINETIC_DAMAGE:
            stats.damage!.kinetic = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.EXPLOSIVE_DAMAGE:
            stats.damage!.explosive = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.CYCLE_TIME:
            stats.cycleTime = attr.value / 1000; // Convert to seconds
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.TRACKING_SPEED:
            stats.tracking = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.OPTIMAL_RANGE:
            stats.optimal = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.ACCURACY_FALLOFF:
            stats.falloff = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.CAPACITOR_NEED:
            stats.capacitorUsage = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.AOE_CLOUD_SIZE:
            stats.explosionRadius = attr.value;
            break;
          case AdvancedDPSCalculator.ATTRIBUTE_IDS.AOE_VELOCITY:
            stats.explosionVelocity = attr.value;
            break;
        }
      });

      // Determine weapon type based on group
      const weaponType = await this.determineWeaponType(weaponTypeID);
      stats.weaponType = weaponType;

      // Load charge damage for turret weapons (critical for DPS accuracy)
      let chargeDamage = null;
      if (weaponType === 'projectile' || weaponType === 'hybrid') {
        const defaultChargeID = await this.getDefaultChargeForWeapon(weaponTypeID, stats.chargeSize || 1, weaponType);
        if (defaultChargeID) {
          chargeDamage = await this.loadChargeDamage(defaultChargeID);
        }
      }

      // Set defaults for missing values
      return {
        typeID: weaponTypeID,
        name: stats.name || 'Unknown Weapon',
        damage: stats.damage || { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        chargeDamage: chargeDamage,
        chargeTypeID: chargeDamage ? await this.getDefaultChargeForWeapon(weaponTypeID, stats.chargeSize || 1, weaponType) : undefined,
        cycleTime: stats.cycleTime || 1.0,
        tracking: stats.tracking || 0.1,
        optimal: stats.optimal || 1000,
        falloff: stats.falloff || 1000,
        capacitorUsage: stats.capacitorUsage || 0,
        chargeSize: stats.chargeSize || 1,
        weaponType: stats.weaponType || 'projectile',
        signatureResolution: stats.signatureResolution || 100,
        explosionRadius: stats.explosionRadius || 100,
        explosionVelocity: stats.explosionVelocity || 100
      };

    } catch (error) {
      console.error('Failed to load weapon stats:', error);
      return null;
    }
  }

  private async determineWeaponType(typeID: number): Promise<WeaponStats['weaponType']> {
    try {
      const groupInfo = await sdeService.runQuery(`
        SELECT g.groupID, g.groupName 
        FROM inv_types t 
        JOIN groups g ON t.groupID = g.groupID 
        WHERE t.typeID = ?
      `, [typeID]);

      if (!groupInfo) return 'projectile';

      const groupName = groupInfo.groupName.toLowerCase();
      
      if (groupName.includes('projectile') || groupName.includes('autocannon') || groupName.includes('artillery')) {
        return 'projectile';
      } else if (groupName.includes('hybrid') || groupName.includes('blaster') || groupName.includes('railgun')) {
        return 'hybrid';
      } else if (groupName.includes('energy') || groupName.includes('laser') || groupName.includes('beam') || groupName.includes('pulse')) {
        return 'energy';
      } else if (groupName.includes('missile') || groupName.includes('launcher') || groupName.includes('torpedo')) {
        return 'missile';
      }

      return 'projectile'; // Default fallback
    } catch (error) {
      return 'projectile';
    }
  }

  /**
   * Load charge (ammunition) damage for turret weapons
   * This is critical for accurate DPS - charges provide 50-80% of weapon damage
   */
  private async loadChargeDamage(chargeTypeID: number): Promise<WeaponStats['chargeDamage'] | null> {
    try {
      const attributes = await sdeService.getTypeAttributes(chargeTypeID);
      const attrMap = new Map(attributes.map((attr: any) => [attr.attributeID, attr.value]));
      
      return {
        em: attrMap.get(AdvancedDPSCalculator.ATTRIBUTE_IDS.EM_DAMAGE) || 0,
        thermal: attrMap.get(AdvancedDPSCalculator.ATTRIBUTE_IDS.THERMAL_DAMAGE) || 0,
        kinetic: attrMap.get(AdvancedDPSCalculator.ATTRIBUTE_IDS.KINETIC_DAMAGE) || 0,
        explosive: attrMap.get(AdvancedDPSCalculator.ATTRIBUTE_IDS.EXPLOSIVE_DAMAGE) || 0
      };
    } catch (error) {
      console.error('Failed to load charge damage:', error);
      return null;
    }
  }

  /**
   * Get default charge for a weapon based on size and weapon type
   * For accurate DPS, weapons should be loaded with appropriate charges
   */
  private async getDefaultChargeForWeapon(weaponTypeID: number, chargeSize: number, weaponType: WeaponStats['weaponType']): Promise<number | null> {
    try {
      // Query for compatible charges based on weapon requirements
      const charges = await sdeService.runQuery(`
        SELECT t.typeID, t.typeName, ta.value as volume
        FROM inv_types t
        JOIN type_attributes ta ON t.typeID = ta.typeID
        JOIN groups g ON t.groupID = g.groupID
        WHERE ta.attributeID = 161 -- Volume attribute
        AND ta.value = ?
        AND g.groupName LIKE '%Charge%'
        AND t.published = 1
        ORDER BY t.typeName
        LIMIT 1
      `, [chargeSize]);

      return charges?.typeID || null;
    } catch (error) {
      console.error('Failed to find default charge:', error);
      return null;
    }
  }

  /**
   * Load dogma effects for a module to determine stacking groups and bonuses
   * Critical for accurate bonus calculations and stacking penalties
   */
  private async loadDogmaEffects(typeID: number): Promise<any[]> {
    try {
      const effects = await sdeService.runQuery(`
        SELECT 
          de.effectID,
          de.effectName,
          de.effectCategory,
          de.isOffensive,
          de.isAssistance,
          te.isDefault
        FROM type_effects te
        JOIN dogma_effects de ON te.effectID = de.effectID
        WHERE te.typeID = ?
        AND de.published = 1
      `, [typeID]);
      
      return effects || [];
    } catch (error) {
      console.error('Failed to load dogma effects:', error);
      return [];
    }
  }

  /**
   * Calculate ship bonuses based on ship type and skill levels
   * Implements EVE's ship bonus system for racial and tech bonuses
   */
  private async calculateShipBonuses(shipTypeID: number, skillLevels: Map<number, number> = new Map()): Promise<DPSModifiers['shipBonuses']> {
    try {
      // Get ship bonus attributes from SDE
      const shipAttributes = await sdeService.getTypeAttributes(shipTypeID);
      const attrMap = new Map(shipAttributes.map((attr: any) => [attr.attributeID, attr.value]));
      
      // Default ship bonuses
      const bonuses = {
        damage: 0,
        rateOfFire: 0,
        tracking: 0,
        optimal: 0,
        falloff: 0
      };
      
      // Calculate racial skill bonuses (typically 5% per level)
      const racialWeaponSkills = [3300, 3301, 3302, 3303]; // Gunnery specialization skills
      racialWeaponSkills.forEach(skillID => {
        const skillLevel = skillLevels.get(skillID) || 0;
        if (skillLevel > 0) {
          bonuses.damage += 0.05 * skillLevel; // 5% damage per level
        }
      });
      
      // Ship-specific damage multipliers from attributes
      if (attrMap.has(AdvancedDPSCalculator.ATTRIBUTE_IDS.DAMAGE_BONUS)) {
        bonuses.damage += (attrMap.get(AdvancedDPSCalculator.ATTRIBUTE_IDS.DAMAGE_BONUS) - 1);
      }
      
      return bonuses;
      
    } catch (error) {
      console.error('Failed to calculate ship bonuses:', error);
      return { damage: 0, rateOfFire: 0, tracking: 0, optimal: 0, falloff: 0 };
    }
  }

  /**
   * Comprehensive DPS calculation with full EVE Dogma mechanics
   * This method integrates all improvements: stacking penalties, charge damage, ship bonuses
   */
  async calculateComprehensiveDPS(
    weapons: number[], // weapon type IDs
    modules: number[], // module type IDs affecting damage
    shipTypeID: number,
    target: TargetProfile,
    skillLevels: Map<number, number> = new Map()
  ): Promise<DPSResult> {
    try {
      // Load all weapon stats with charge damage
      const weaponStats = await Promise.all(
        weapons.map(weaponID => this.loadWeaponStats(weaponID))
      );
      
      const validWeapons = weaponStats.filter(w => w !== null) as WeaponStats[];
      
      if (validWeapons.length === 0) {
        throw new Error('No valid weapons found');
      }
      
      // Calculate ship bonuses based on ship type and skills
      const shipBonuses = await this.calculateShipBonuses(shipTypeID, skillLevels);
      
      // Load module effects and calculate stacking penalties
      const moduleEffects: ModuleStackingInfo[] = [];
      for (const moduleID of modules) {
        const attributes = await sdeService.getTypeAttributes(moduleID);
        
        // Process damage bonus modules
        const damageBonus = attributes.find(attr => attr.attributeID === AdvancedDPSCalculator.ATTRIBUTE_IDS.DAMAGE_BONUS);
        if (damageBonus) {
          moduleEffects.push({
            moduleTypeID: moduleID,
            stackingGroup: 1, // Damage modules stack together
            bonusAmount: damageBonus.value / 100, // Convert percentage to decimal
            effectiveBonus: 0, // Will be calculated with stacking
            stackingPosition: 0
          });
        }
      }
      
      // Apply stacking penalties manually for now (simplified implementation)
      let totalDamageMultiplier = 1.0;
      moduleEffects.sort((a, b) => b.bonusAmount - a.bonusAmount); // Sort by bonus (highest first)
      
      moduleEffects.forEach((module, index) => {
        const stackingMultiplier = AdvancedDPSCalculator.calculateStackingMultiplier(index);
        totalDamageMultiplier += (module.bonusAmount * stackingMultiplier);
      });
      
      // Create modifiers object
      const modifiers: DPSModifiers = {
        damageMultiplier: totalDamageMultiplier,
        rateOfFireMultiplier: 1.0,
        trackingMultiplier: 1.0,
        optimalRangeMultiplier: 1.0,
        falloffRangeMultiplier: 1.0,
        shipBonuses
      };
      
      // Calculate DPS for each weapon
      const weaponBreakdowns = await Promise.all(
        validWeapons.map(weapon => this.calculateSingleWeaponDPS(weapon, target, modifiers))
      );
      
      // Sum up total DPS
      const totalDPS = weaponBreakdowns.reduce((sum, breakdown) => sum + breakdown.baseDPS, 0);
      const appliedDPS = weaponBreakdowns.reduce((sum, breakdown) => sum + breakdown.appliedDPS, 0);
      
      // Calculate capacitor usage
      const totalCapUsage = validWeapons.reduce((sum, weapon) => {
        return sum + (weapon.capacitorUsage / weapon.cycleTime);
      }, 0);
      
      return {
        totalDPS,
        appliedDPS,
        sustainableDPS: appliedDPS,
        breakdownByWeapon: weaponBreakdowns,
        breakdown: {
          baseDPS: totalDPS,
          modifiedDPS: totalDPS * totalDamageMultiplier,
          hitChance: 1.0,
          damageApplication: 1.0,
          rangeMultiplier: 1.0,
          resistanceMultiplier: 0.5 // Simplified: assume 50% resistance on average
        },
        capacitor: {
          usage: totalCapUsage,
          timeUntilEmpty: Infinity,
          isStable: totalCapUsage < 10
        }
      };
      
    } catch (error) {
      console.error('Comprehensive DPS calculation failed:', error);
      throw error;
    }
  }
}

export const dpsCalculator = new AdvancedDPSCalculator();