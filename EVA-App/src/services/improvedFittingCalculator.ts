import { TypeAttribute, FittingSlot } from './sdeService';

// Enhanced damage profile with per-type calculations
export interface DamageProfile {
  em: number;
  thermal: number;
  kinetic: number;
  explosive: number;
}

export interface WeaponStats {
  // Volley damage (single shot)
  volley: DamageProfile;
  // Cycle time in milliseconds
  cycleTime: number;
  // DPS (calculated from volley/cycle)
  dps: DamageProfile;
  // Weapon characteristics
  optimalRange: number;
  falloffRange: number;
  tracking: number;
  // Charge information for turrets
  chargeSize?: number;
  chargeType?: string;
}

export interface TargetProfile {
  signature: number;
  velocity: number;
  resistances: DamageProfile;
  distance: number;
}

export class ImprovedFittingCalculator {
  
  // Correct EVE stacking penalty formula
  private static calculateStackingPenalty(index: number): number {
    if (index === 0) return 1.0; // First module at full strength
    return Math.exp(-(index ** 2) / 7.1289);
  }

  // Apply stacking penalties to a list of bonuses
  private static applyStackingPenalties(bonuses: number[]): number {
    // Sort by effectiveness (distance from 1.0)
    const sortedBonuses = bonuses.sort((a, b) => Math.abs(b - 1) - Math.abs(a - 1));
    
    let result = 1.0;
    sortedBonuses.forEach((bonus, index) => {
      const penalty = this.calculateStackingPenalty(index);
      const effectiveBonus = 1 + (bonus - 1) * penalty;
      result *= effectiveBonus;
    });
    
    return result;
  }

  // Calculate volley damage for a weapon module
  static calculateWeaponVolley(
    weaponAttributes: Map<number, number>,
    chargeAttributes?: Map<number, number>,
    shipBonuses?: Map<string, number>,
    skillBonuses?: Map<string, number>
  ): WeaponStats {
    
    // Base damage from weapon
    const weaponDmgMult = weaponAttributes.get(64) || 1; // Damage Multiplier
    
    let baseDamage: DamageProfile = {
      em: (weaponAttributes.get(114) || 0) * weaponDmgMult,
      thermal: (weaponAttributes.get(116) || 0) * weaponDmgMult,
      kinetic: (weaponAttributes.get(117) || 0) * weaponDmgMult,
      explosive: (weaponAttributes.get(118) || 0) * weaponDmgMult
    };

    // Add charge damage for turret weapons
    if (chargeAttributes) {
      const chargeDmgMult = chargeAttributes.get(64) || 1;
      baseDamage.em += (chargeAttributes.get(114) || 0) * chargeDmgMult;
      baseDamage.thermal += (chargeAttributes.get(116) || 0) * chargeDmgMult;
      baseDamage.kinetic += (chargeAttributes.get(117) || 0) * chargeDmgMult;
      baseDamage.explosive += (chargeAttributes.get(118) || 0) * chargeDmgMult;
    }

    // Apply damage bonuses (simplified - would need full attribute system)
    const damageBonus = 1.0; // Would calculate from ship/skill bonuses

    const volley: DamageProfile = {
      em: baseDamage.em * damageBonus,
      thermal: baseDamage.thermal * damageBonus,
      kinetic: baseDamage.kinetic * damageBonus,
      explosive: baseDamage.explosive * damageBonus
    };

    // Get cycle time (rate of fire)
    const cycleTime = weaponAttributes.get(51) || 1000; // milliseconds

    // Calculate DPS
    const cycleTimeSeconds = cycleTime / 1000;
    const dps: DamageProfile = {
      em: volley.em / cycleTimeSeconds,
      thermal: volley.thermal / cycleTimeSeconds,
      kinetic: volley.kinetic / cycleTimeSeconds,
      explosive: volley.explosive / cycleTimeSeconds
    };

    return {
      volley,
      cycleTime,
      dps,
      optimalRange: weaponAttributes.get(54) || 0,
      falloffRange: weaponAttributes.get(158) || 0,
      tracking: weaponAttributes.get(160) || 0
    };
  }

  // Calculate damage application based on range for turrets
  static calculateTurretDamageApplication(
    weaponStats: WeaponStats,
    targetProfile: TargetProfile
  ): DamageProfile {
    
    // Range-based damage calculation
    let rangeFactor = 1.0;
    if (targetProfile.distance > weaponStats.optimalRange) {
      const falloffDistance = targetProfile.distance - weaponStats.optimalRange;
      const falloffFactor = falloffDistance / weaponStats.falloffRange;
      rangeFactor = Math.pow(0.5, falloffFactor * falloffFactor);
    }

    // Tracking-based hit chance (simplified)
    const angularVelocity = targetProfile.velocity / targetProfile.distance;
    const trackingFactor = Math.min(1.0, weaponStats.tracking / angularVelocity);
    
    // Signature resolution (simplified)
    const signatureFactor = Math.min(1.0, targetProfile.signature / 40); // 40m base for small weapons

    // Combined application factor
    const applicationFactor = rangeFactor * trackingFactor * signatureFactor;

    // Apply to damage
    return {
      em: weaponStats.dps.em * applicationFactor,
      thermal: weaponStats.dps.thermal * applicationFactor,
      kinetic: weaponStats.dps.kinetic * applicationFactor,
      explosive: weaponStats.dps.explosive * applicationFactor
    };
  }

  // Calculate missile damage application
  static calculateMissileDamageApplication(
    baseDamage: DamageProfile,
    missileAttributes: Map<number, number>,
    targetProfile: TargetProfile
  ): DamageProfile {
    
    const explosionRadius = missileAttributes.get(114) || 100; // Explosion radius
    const explosionVelocity = missileAttributes.get(115) || 100; // Explosion velocity
    
    // Signature factor
    const sigFactor = Math.min(1.0, targetProfile.signature / explosionRadius);
    
    // Velocity factor  
    const velFactor = Math.min(1.0, explosionVelocity / targetProfile.velocity);
    
    // Combined application (EVE's missile damage formula)
    const damageFactor = sigFactor * (sigFactor + velFactor * (1 - sigFactor));
    
    return {
      em: baseDamage.em * damageFactor,
      thermal: baseDamage.thermal * damageFactor,
      kinetic: baseDamage.kinetic * damageFactor,
      explosive: baseDamage.explosive * damageFactor
    };
  }

  // Calculate effective DPS against target resistances
  static calculateEffectiveDPS(
    weaponDamage: DamageProfile,
    targetResistances: DamageProfile
  ): number {
    const emDps = weaponDamage.em * (1 - targetResistances.em / 100);
    const thermalDps = weaponDamage.thermal * (1 - targetResistances.thermal / 100);
    const kineticDps = weaponDamage.kinetic * (1 - targetResistances.kinetic / 100);
    const explosiveDps = weaponDamage.explosive * (1 - targetResistances.explosive / 100);
    
    return emDps + thermalDps + kineticDps + explosiveDps;
  }

  // Enhanced fitting calculation with proper weapon handling
  static calculateAdvancedFittingStats(
    ship: any,
    weapons: Array<{attributes: Map<number, number>, charges?: Map<number, number>}>,
    targetProfile?: TargetProfile
  ) {
    
    let totalVolley: DamageProfile = { em: 0, thermal: 0, kinetic: 0, explosive: 0 };
    let totalDps: DamageProfile = { em: 0, thermal: 0, kinetic: 0, explosive: 0 };
    let avgOptimal = 0;
    let avgFalloff = 0;

    weapons.forEach(weapon => {
      const weaponStats = this.calculateWeaponVolley(
        weapon.attributes,
        weapon.charges
      );

      // Apply damage application if target provided
      let appliedDps = weaponStats.dps;
      if (targetProfile) {
        // Determine weapon type and apply appropriate damage application
        const isProjectile = weapon.attributes.has(55); // Projectile weapon group
        const isMissile = weapon.attributes.has(507); // Missile launcher group
        
        if (isMissile) {
          appliedDps = this.calculateMissileDamageApplication(
            weaponStats.dps,
            weapon.attributes,
            targetProfile
          );
        } else {
          appliedDps = this.calculateTurretDamageApplication(
            weaponStats,
            targetProfile
          );
        }
      }

      // Accumulate totals
      totalVolley.em += weaponStats.volley.em;
      totalVolley.thermal += weaponStats.volley.thermal;
      totalVolley.kinetic += weaponStats.volley.kinetic;
      totalVolley.explosive += weaponStats.volley.explosive;

      totalDps.em += appliedDps.em;
      totalDps.thermal += appliedDps.thermal;
      totalDps.kinetic += appliedDps.kinetic;
      totalDps.explosive += appliedDps.explosive;

      avgOptimal += weaponStats.optimalRange;
      avgFalloff += weaponStats.falloffRange;
    });

    if (weapons.length > 0) {
      avgOptimal /= weapons.length;
      avgFalloff /= weapons.length;
    }

    const totalDpsValue = totalDps.em + totalDps.thermal + totalDps.kinetic + totalDps.explosive;
    const totalAlpha = totalVolley.em + totalVolley.thermal + totalVolley.kinetic + totalVolley.explosive;

    return {
      totalDps: totalDpsValue,
      totalAlpha,
      damageProfile: totalDps,
      volleyProfile: totalVolley,
      avgOptimal,
      avgFalloff,
      // Apply target resistances if provided
      effectiveDps: targetProfile ? 
        this.calculateEffectiveDPS(totalDps, targetProfile.resistances) : 
        totalDpsValue
    };
  }
}

