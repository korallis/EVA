import { sdeService } from './sdeService';
import { dpsCalculator, AdvancedDPSCalculator, WeaponStats, TargetProfile, DPSModifiers, DPSResult, ModuleStackingInfo } from './dpsCalculator';

export interface FittingModule {
  typeID: number;
  typeName: string;
  slotType: 'high' | 'mid' | 'low' | 'rig' | 'subsystem' | 'service';
  groupID: number;
  groupName: string;
  online: boolean;
  attributes: { [attributeID: number]: number };
}

export interface ShipAttributes {
  typeID: number;
  typeName: string;
  capacitorCapacity: number;
  capacitorRecharge: number;
  signatureRadius: number;
  maxVelocity: number;
  mass: number;
  // Slot counts
  highSlots: number;
  midSlots: number;
  lowSlots: number;
  rigSlots: number;
  // Tank stats
  shieldHP: number;
  armorHP: number;
  hullHP: number;
  // Resistances
  shieldResistances: { em: number; thermal: number; kinetic: number; explosive: number };
  armorResistances: { em: number; thermal: number; kinetic: number; explosive: number };
  hullResistances: { em: number; thermal: number; kinetic: number; explosive: number };
  // Ship bonuses
  damageBonus: number;
  rateOfFireBonus: number;
  trackingBonus: number;
  optimalRangeBonus: number;
  falloffRangeBonus: number;
}

export interface FittingStats {
  // DPS calculations
  dps: DPSResult;
  
  // Tank calculations
  ehp: {
    total: number;
    shield: number;
    armor: number;
    hull: number;
  };
  
  // Resource usage
  cpu: {
    used: number;
    total: number;
    percentage: number;
  };
  
  powergrid: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // Capacitor
  capacitor: {
    capacity: number;
    recharge: number;
    usage: number;
    stable: boolean;
    timeUntilEmpty: number;
  };
  
  // Navigation
  maxVelocity: number;
  agility: number;
  alignTime: number;
  
  // Targeting
  maxTargets: number;
  maxTargetRange: number;
  scanResolution: number;
  sensorStrength: number;
  
  // Slot usage
  slotsUsed: {
    high: number;
    mid: number;
    low: number;
    rig: number;
  };
  
  slotsTotal: {
    high: number;
    mid: number;
    low: number;
    rig: number;
  };
}

export interface StackingGroup {
  groupID: number;
  modules: ModuleStackingInfo[];
  totalBonus: number;
  penalizedBonus: number;
}

export class FittingCalculator {
  
  // Common stacking groups (simplified)
  private static readonly STACKING_GROUPS = {
    // Damage modules
    DAMAGE_AMPLIFIER: 1,
    DAMAGE_CONTROL: 2,
    
    // Tank modules
    SHIELD_BOOSTER: 10,
    ARMOR_REPAIRER: 11,
    SHIELD_RESISTANCE: 12,
    ARMOR_RESISTANCE: 13,
    
    // Navigation
    AFTERBURNER: 20,
    MICROWARPDRIVE: 21,
    
    // Weapon upgrades
    TRACKING_ENHANCER: 30,
    GYROSTABILIZER: 31,
    HEAT_SINK: 32,
    MAGNETIC_FIELD_STABILIZER: 33,
    BALLISTIC_CONTROL: 34,
    
    // ECM/ECCM
    ECM: 40,
    ECCM: 41,
    
    // Sensor boosters
    SENSOR_BOOSTER: 50,
    TARGETING_COMPUTER: 51
  };

  // EVE attribute IDs
  private static readonly SHIP_ATTRIBUTES = {
    CAPACITOR_CAPACITY: 482,
    CAPACITOR_RECHARGE: 55,
    SIGNATURE_RADIUS: 552,
    MAX_VELOCITY: 37,
    MASS: 4,
    
    // Slots
    HIGH_SLOTS: 14,
    MID_SLOTS: 13,
    LOW_SLOTS: 12,
    RIG_SLOTS: 1137,
    
    // HP
    SHIELD_HP: 263,
    ARMOR_HP: 265,
    HULL_HP: 9,
    
    // Base resistances
    SHIELD_EM_RESIST: 271,
    SHIELD_THERMAL_RESIST: 272,
    SHIELD_KINETIC_RESIST: 273,
    SHIELD_EXPLOSIVE_RESIST: 274,
    
    ARMOR_EM_RESIST: 267,
    ARMOR_THERMAL_RESIST: 268,
    ARMOR_KINETIC_RESIST: 269,
    ARMOR_EXPLOSIVE_RESIST: 270,
    
    // CPU/Power
    CPU_OUTPUT: 48,
    POWERGRID_OUTPUT: 11,
    
    // Navigation
    AGILITY: 70,
    INERTIA_MODIFIER: 70,
    
    // Targeting
    MAX_TARGETS: 192,
    MAX_TARGET_RANGE: 76,
    SCAN_RESOLUTION: 564,
    SENSOR_STRENGTH_RADAR: 208,
    SENSOR_STRENGTH_LADAR: 209,
    SENSOR_STRENGTH_MAGNETOMETRIC: 210,
    SENSOR_STRENGTH_GRAVIMETRIC: 211
  };

  async calculateFittingStats(
    ship: ShipAttributes,
    modules: FittingModule[],
    targetProfile?: TargetProfile
  ): Promise<FittingStats> {
    
    // Calculate stacking penalties
    const stackedModules = this.calculateStackingPenalties(modules);
    
    // Calculate resource usage
    const cpuUsage = await this.calculateCPUUsage(modules);
    const powergridUsage = await this.calculatePowergridUsage(modules);
    
    // Calculate weapon stats and DPS
    const weapons = await this.extractWeapons(modules);
    const modifiers = await this.calculateModifiers(ship, stackedModules);
    
    const defaultTarget: TargetProfile = targetProfile || {
      signature: 40, // Small frigate
      velocity: 1000, // m/s
      distance: 5000, // 5km
      angularVelocity: 0.05, // rad/s
      resistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 }
    };
    
    const dpsResult = await dpsCalculator.calculateWeaponDPS(
      weapons,
      defaultTarget,
      modifiers,
      { capacity: ship.capacitorCapacity, recharge: ship.capacitorRecharge }
    );
    
    // Calculate tank stats
    const ehp = this.calculateEHP(ship, stackedModules);
    
    // Calculate navigation
    const navigation = this.calculateNavigation(ship, stackedModules);
    
    // Calculate targeting stats
    const targeting = this.calculateTargeting(ship, stackedModules);
    
    // Calculate capacitor with all modules
    const capacitor = this.calculateCapacitor(ship, modules, dpsResult.capacitor.usage);
    
    return {
      dps: dpsResult,
      ehp,
      cpu: {
        used: cpuUsage,
        total: ship.capacitorCapacity, // This should be CPU output from ship attributes
        percentage: (cpuUsage / ship.capacitorCapacity) * 100
      },
      powergrid: {
        used: powergridUsage,
        total: 1000, // This should come from ship attributes
        percentage: (powergridUsage / 1000) * 100
      },
      capacitor,
      maxVelocity: navigation.maxVelocity,
      agility: navigation.agility,
      alignTime: navigation.alignTime,
      maxTargets: targeting.maxTargets,
      maxTargetRange: targeting.maxTargetRange,
      scanResolution: targeting.scanResolution,
      sensorStrength: targeting.sensorStrength,
      slotsUsed: {
        high: modules.filter(m => m.slotType === 'high').length,
        mid: modules.filter(m => m.slotType === 'mid').length,
        low: modules.filter(m => m.slotType === 'low').length,
        rig: modules.filter(m => m.slotType === 'rig').length
      },
      slotsTotal: {
        high: ship.highSlots,
        mid: ship.midSlots,
        low: ship.lowSlots,
        rig: ship.rigSlots
      }
    };
  }

  private calculateStackingPenalties(modules: FittingModule[]): StackingGroup[] {
    const stackingInfo: ModuleStackingInfo[] = [];
    
    // Group modules by their effects and stacking groups
    modules.forEach(module => {
      const stackingGroup = this.getStackingGroup(module);
      if (stackingGroup > 0) {
        // Get the bonus amount for this module type
        const bonusAmount = this.getModuleBonusAmount(module);
        
        stackingInfo.push({
          moduleTypeID: module.typeID,
          stackingGroup,
          bonusAmount,
          effectiveBonus: bonusAmount, // Will be modified by stacking calculation
          stackingPosition: 0 // Will be set by stacking calculation
        });
      }
    });
    
    // Apply stacking penalties
    const stackedModules = AdvancedDPSCalculator.calculateStackingPenalties(stackingInfo);
    
    // Group results by stacking group
    const groups = new Map<number, StackingGroup>();
    
    stackedModules.forEach(module => {
      if (!groups.has(module.stackingGroup)) {
        groups.set(module.stackingGroup, {
          groupID: module.stackingGroup,
          modules: [],
          totalBonus: 0,
          penalizedBonus: 0
        });
      }
      
      const group = groups.get(module.stackingGroup)!;
      group.modules.push(module);
      group.totalBonus += module.bonusAmount;
      group.penalizedBonus += module.effectiveBonus;
    });
    
    return Array.from(groups.values());
  }

  private getStackingGroup(module: FittingModule): number {
    // Simplified stacking group determination
    const groupName = module.groupName.toLowerCase();
    
    if (groupName.includes('gyrostabilizer')) return FittingCalculator.STACKING_GROUPS.GYROSTABILIZER;
    if (groupName.includes('heat sink')) return FittingCalculator.STACKING_GROUPS.HEAT_SINK;
    if (groupName.includes('magnetic field')) return FittingCalculator.STACKING_GROUPS.MAGNETIC_FIELD_STABILIZER;
    if (groupName.includes('ballistic control')) return FittingCalculator.STACKING_GROUPS.BALLISTIC_CONTROL;
    if (groupName.includes('tracking enhancer')) return FittingCalculator.STACKING_GROUPS.TRACKING_ENHANCER;
    if (groupName.includes('damage control')) return FittingCalculator.STACKING_GROUPS.DAMAGE_CONTROL;
    
    return 0; // No stacking penalty
  }

  private getModuleBonusAmount(module: FittingModule): number {
    // This would normally come from module attributes
    // Simplified for now - would need to parse actual module bonuses
    const groupName = module.groupName.toLowerCase();
    
    if (groupName.includes('gyrostabilizer')) return 10.5; // 10.5% damage bonus
    if (groupName.includes('heat sink')) return 10.5;
    if (groupName.includes('magnetic field')) return 10.5;
    if (groupName.includes('ballistic control')) return 10.5;
    if (groupName.includes('tracking enhancer')) return 10.0;
    
    return 0;
  }

  private async extractWeapons(modules: FittingModule[]): Promise<WeaponStats[]> {
    const weapons: WeaponStats[] = [];
    
    const weaponModules = modules.filter(m => 
      m.slotType === 'high' && 
      m.online &&
      (m.groupName.toLowerCase().includes('weapon') ||
       m.groupName.toLowerCase().includes('launcher') ||
       m.groupName.toLowerCase().includes('cannon') ||
       m.groupName.toLowerCase().includes('blaster') ||
       m.groupName.toLowerCase().includes('laser'))
    );
    
    for (const weaponModule of weaponModules) {
      const weaponStats = await dpsCalculator.loadWeaponStats(weaponModule.typeID);
      if (weaponStats) {
        weapons.push(weaponStats);
      }
    }
    
    return weapons;
  }

  private async calculateModifiers(ship: ShipAttributes, stackingGroups: StackingGroup[]): Promise<DPSModifiers> {
    let damageMultiplier = 1.0;
    let rateOfFireMultiplier = 1.0;
    let trackingMultiplier = 1.0;
    let optimalRangeMultiplier = 1.0;
    let falloffRangeMultiplier = 1.0;
    
    // Apply stacking penalties
    stackingGroups.forEach(group => {
      switch (group.groupID) {
        case FittingCalculator.STACKING_GROUPS.GYROSTABILIZER:
        case FittingCalculator.STACKING_GROUPS.HEAT_SINK:
        case FittingCalculator.STACKING_GROUPS.MAGNETIC_FIELD_STABILIZER:
        case FittingCalculator.STACKING_GROUPS.BALLISTIC_CONTROL:
          damageMultiplier += group.penalizedBonus / 100;
          break;
        case FittingCalculator.STACKING_GROUPS.TRACKING_ENHANCER:
          trackingMultiplier += group.penalizedBonus / 100;
          break;
      }
    });
    
    return {
      damageMultiplier,
      rateOfFireMultiplier,
      trackingMultiplier,
      optimalRangeMultiplier,
      falloffRangeMultiplier,
      shipBonuses: {
        damage: ship.damageBonus,
        rateOfFire: ship.rateOfFireBonus,
        tracking: ship.trackingBonus,
        optimal: ship.optimalRangeBonus,
        falloff: ship.falloffRangeBonus
      }
    };
  }

  private calculateEHP(ship: ShipAttributes, stackingGroups: StackingGroup[]) {
    // Calculate effective HP with resistances
    const shieldEHP = ship.shieldHP / (
      (ship.shieldResistances.em + ship.shieldResistances.thermal + 
       ship.shieldResistances.kinetic + ship.shieldResistances.explosive) / 4
    );
    
    const armorEHP = ship.armorHP / (
      (ship.armorResistances.em + ship.armorResistances.thermal + 
       ship.armorResistances.kinetic + ship.armorResistances.explosive) / 4
    );
    
    const hullEHP = ship.hullHP / (
      (ship.hullResistances.em + ship.hullResistances.thermal + 
       ship.hullResistances.kinetic + ship.hullResistances.explosive) / 4
    );
    
    return {
      total: shieldEHP + armorEHP + hullEHP,
      shield: shieldEHP,
      armor: armorEHP,
      hull: hullEHP
    };
  }

  private calculateNavigation(ship: ShipAttributes, stackingGroups: StackingGroup[]) {
    // Simplified navigation calculations
    return {
      maxVelocity: ship.maxVelocity,
      agility: 1.0, // Would calculate from mass and inertia modifier
      alignTime: 10.0 // Simplified
    };
  }

  private calculateTargeting(ship: ShipAttributes, stackingGroups: StackingGroup[]) {
    // Simplified targeting calculations
    return {
      maxTargets: 5, // Would come from ship attributes
      maxTargetRange: 50000, // 50km default
      scanResolution: 400, // mm
      sensorStrength: 15 // Simplified
    };
  }

  private calculateCapacitor(ship: ShipAttributes, modules: FittingModule[], weaponCapUsage: number) {
    // Calculate total capacitor usage from all modules
    let totalUsage = weaponCapUsage;
    
    // Add other module usage (simplified)
    modules.forEach(module => {
      if (module.online) {
        // Would get actual cap usage from module attributes
        if (module.slotType === 'mid' && module.groupName.toLowerCase().includes('shield')) {
          totalUsage += 5; // Simplified shield module usage
        }
      }
    });
    
    const rechargeRate = (ship.capacitorCapacity / ship.capacitorRecharge) * 2.5; // Simplified cap recharge
    const isStable = totalUsage <= rechargeRate;
    const timeUntilEmpty = isStable ? Infinity : ship.capacitorCapacity / (totalUsage - rechargeRate);
    
    return {
      capacity: ship.capacitorCapacity,
      recharge: ship.capacitorRecharge,
      usage: totalUsage,
      stable: isStable,
      timeUntilEmpty
    };
  }

  private async calculateCPUUsage(modules: FittingModule[]): Promise<number> {
    let totalCPU = 0;
    
    for (const module of modules) {
      if (module.online) {
        // Get CPU usage from module attributes
        const cpuUsage = module.attributes[50] || 0; // Attribute ID 50 is CPU usage
        totalCPU += cpuUsage;
      }
    }
    
    return totalCPU;
  }

  private async calculatePowergridUsage(modules: FittingModule[]): Promise<number> {
    let totalPowergrid = 0;
    
    for (const module of modules) {
      if (module.online) {
        // Get powergrid usage from module attributes
        const powergridUsage = module.attributes[30] || 0; // Attribute ID 30 is powergrid usage
        totalPowergrid += powergridUsage;
      }
    }
    
    return totalPowergrid;
  }

  async loadShipAttributes(shipTypeID: number): Promise<ShipAttributes | null> {
    try {
      const attributes = await sdeService.getTypeAttributes(shipTypeID);
      const shipInfo = await sdeService.runQuery(
        'SELECT typeName FROM inv_types WHERE typeID = ?',
        [shipTypeID]
      );

      if (!shipInfo || attributes.length === 0) return null;

      // Build ship attributes from SDE data
      const shipAttribs: Partial<ShipAttributes> = {
        typeID: shipTypeID,
        typeName: shipInfo.typeName,
        // Set defaults
        shieldResistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        armorResistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        hullResistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 }
      };

      // Parse attributes
      attributes.forEach(attr => {
        switch (attr.attributeID) {
          case FittingCalculator.SHIP_ATTRIBUTES.CAPACITOR_CAPACITY:
            shipAttribs.capacitorCapacity = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.CAPACITOR_RECHARGE:
            shipAttribs.capacitorRecharge = attr.value / 1000; // Convert to seconds
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.SIGNATURE_RADIUS:
            shipAttribs.signatureRadius = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.MAX_VELOCITY:
            shipAttribs.maxVelocity = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.MASS:
            shipAttribs.mass = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.HIGH_SLOTS:
            shipAttribs.highSlots = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.MID_SLOTS:
            shipAttribs.midSlots = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.LOW_SLOTS:
            shipAttribs.lowSlots = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.RIG_SLOTS:
            shipAttribs.rigSlots = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.SHIELD_HP:
            shipAttribs.shieldHP = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.ARMOR_HP:
            shipAttribs.armorHP = attr.value;
            break;
          case FittingCalculator.SHIP_ATTRIBUTES.HULL_HP:
            shipAttribs.hullHP = attr.value;
            break;
          // Add more attribute parsing as needed
        }
      });

      // Set defaults for missing values
      return {
        typeID: shipTypeID,
        typeName: shipAttribs.typeName || 'Unknown Ship',
        capacitorCapacity: shipAttribs.capacitorCapacity || 1000,
        capacitorRecharge: shipAttribs.capacitorRecharge || 500,
        signatureRadius: shipAttribs.signatureRadius || 40,
        maxVelocity: shipAttribs.maxVelocity || 200,
        mass: shipAttribs.mass || 1000000,
        highSlots: shipAttribs.highSlots || 8,
        midSlots: shipAttribs.midSlots || 8,
        lowSlots: shipAttribs.lowSlots || 8,
        rigSlots: shipAttribs.rigSlots || 3,
        shieldHP: shipAttribs.shieldHP || 1000,
        armorHP: shipAttribs.armorHP || 1000,
        hullHP: shipAttribs.hullHP || 1000,
        shieldResistances: shipAttribs.shieldResistances || { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        armorResistances: shipAttribs.armorResistances || { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        hullResistances: shipAttribs.hullResistances || { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        damageBonus: 0,
        rateOfFireBonus: 0,
        trackingBonus: 0,
        optimalRangeBonus: 0,
        falloffRangeBonus: 0
      };

    } catch (error) {
      console.error('Failed to load ship attributes:', error);
      return null;
    }
  }
}

export const fittingCalculator = new FittingCalculator();