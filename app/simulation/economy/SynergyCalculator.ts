// =============================================================================
// SYNERGY CALCULATOR
// =============================================================================
// Calculates synergy bonuses for buildings including:
// - Chain synergies (e.g., ETH ecosystem buildings)
// - Category synergies (e.g., DeFi buildings clustering)
// - Special building combinations

import { CryptoTier } from '../../components/game/types';
import { BuildingRegistry, PlacedBuilding } from './BuildingRegistry';
import { ZoneEffectsCache } from './ZoneEffectsCache';
import { SentimentEngine } from './SentimentEngine';
import { ECONOMY_CONFIG, BUILDING_CONFIG } from '../../config/gameConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface SynergyResult {
  chainBonus: number;
  categoryBonus: number;
  zoneBonus: number;
  sentimentMultiplier: number;
  totalMultiplier: number;
}

export interface YieldCalculation {
  baseYield: number;
  synergies: SynergyResult;
  finalYield: number;
}

// =============================================================================
// SYNERGY CALCULATOR CLASS
// =============================================================================

export class SynergyCalculator {
  private buildingRegistry: BuildingRegistry;
  private zoneEffectsCache: ZoneEffectsCache;
  private sentimentEngine: SentimentEngine;

  // Cached synergy counts (memoized per tick)
  private chainSynergyCache: Map<string, number> = new Map();
  private categorySynergyCache: Map<string, number> = new Map();
  private cacheValidTick: number = -1;

  constructor(
    buildingRegistry: BuildingRegistry,
    zoneEffectsCache: ZoneEffectsCache,
    sentimentEngine: SentimentEngine
  ) {
    this.buildingRegistry = buildingRegistry;
    this.zoneEffectsCache = zoneEffectsCache;
    this.sentimentEngine = sentimentEngine;
  }

  // ---------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Invalidate caches for a new tick
   */
  invalidateCaches(currentTick: number): void {
    if (this.cacheValidTick !== currentTick) {
      this.chainSynergyCache.clear();
      this.categorySynergyCache.clear();
      this.cacheValidTick = currentTick;
    }
  }

  // ---------------------------------------------------------------------------
  // CHAIN SYNERGY
  // ---------------------------------------------------------------------------

  /**
   * Calculate chain synergy bonus for a building
   * Buildings on the same chain get a bonus based on how many are present
   */
  calculateChainSynergy(building: PlacedBuilding): number {
    const chain = building.definition.crypto.chain;
    if (!chain) return 0;

    // Check cache first
    const cacheKey = `${building.id}:${chain}`;
    if (this.chainSynergyCache.has(cacheKey)) {
      return this.chainSynergyCache.get(cacheKey)!;
    }

    // Count buildings on same chain
    const chainCount = this.buildingRegistry.getCountByChain(chain);
    
    // Need at least 2 buildings for synergy
    if (chainCount < 2) {
      this.chainSynergyCache.set(cacheKey, 0);
      return 0;
    }

    // Diminishing returns: sqrt scaling to prevent too much stacking
    const bonus = ECONOMY_CONFIG.CHAIN_SYNERGY_BONUS * Math.sqrt(chainCount - 1);
    
    // Cap at 50% bonus
    const cappedBonus = Math.min(bonus, 0.5);
    
    this.chainSynergyCache.set(cacheKey, cappedBonus);
    return cappedBonus;
  }

  // ---------------------------------------------------------------------------
  // CATEGORY SYNERGY
  // ---------------------------------------------------------------------------

  /**
   * Calculate category synergy bonus for a building
   * Buildings in the same category cluster get bonuses
   */
  calculateCategorySynergy(building: PlacedBuilding): number {
    const category = building.definition.category;
    if (!category) return 0;

    // Check cache first
    const cacheKey = `${building.id}:${category}`;
    if (this.categorySynergyCache.has(cacheKey)) {
      return this.categorySynergyCache.get(cacheKey)!;
    }

    // Count nearby buildings of same category (within zone radius)
    const nearbyBuildings = this.buildingRegistry.getInRadius(
      building.gridX,
      building.gridY,
      BUILDING_CONFIG.DEFAULT_ZONE_RADIUS
    );

    const sameCategoryCount = nearbyBuildings.filter(
      (b) => b.id !== building.id && 
             b.definition.category === category &&
             b.isActive
    ).length;

    if (sameCategoryCount === 0) {
      this.categorySynergyCache.set(cacheKey, 0);
      return 0;
    }

    // Linear scaling with cap
    const bonus = ECONOMY_CONFIG.CATEGORY_SYNERGY_BONUS * sameCategoryCount;
    
    // Cap at 40% bonus
    const cappedBonus = Math.min(bonus, 0.4);
    
    this.categorySynergyCache.set(cacheKey, cappedBonus);
    return cappedBonus;
  }

  // ---------------------------------------------------------------------------
  // FULL SYNERGY CALCULATION
  // ---------------------------------------------------------------------------

  /**
   * Calculate all synergies for a building
   */
  calculateSynergies(building: PlacedBuilding): SynergyResult {
    if (!building.isActive) {
      return {
        chainBonus: 0,
        categoryBonus: 0,
        zoneBonus: 0,
        sentimentMultiplier: 1,
        totalMultiplier: 0, // Disabled buildings produce nothing
      };
    }

    const chainBonus = this.calculateChainSynergy(building);
    const categoryBonus = this.calculateCategorySynergy(building);
    const zoneBonus = this.zoneEffectsCache.calculateZoneMultiplier(building) - 1;
    const sentimentMultiplier = this.sentimentEngine.getYieldMultiplier();

    // Combine bonuses multiplicatively
    const combinedBonus = (1 + chainBonus) * (1 + categoryBonus) * (1 + zoneBonus);
    const totalMultiplier = combinedBonus * sentimentMultiplier;

    return {
      chainBonus,
      categoryBonus,
      zoneBonus,
      sentimentMultiplier,
      totalMultiplier,
    };
  }

  // ---------------------------------------------------------------------------
  // YIELD CALCULATION
  // ---------------------------------------------------------------------------

  /**
   * Calculate the yield for a single building
   */
  calculateBuildingYield(building: PlacedBuilding): YieldCalculation {
    if (!building.isActive) {
      return {
        baseYield: 0,
        synergies: {
          chainBonus: 0,
          categoryBonus: 0,
          zoneBonus: 0,
          sentimentMultiplier: 1,
          totalMultiplier: 0,
        },
        finalYield: 0,
      };
    }

    const baseYield = building.definition.crypto.effects?.yieldRate ?? 0;
    const synergies = this.calculateSynergies(building);
    const finalYield = baseYield * synergies.totalMultiplier * ECONOMY_CONFIG.BASE_YIELD_MULTIPLIER;

    return {
      baseYield,
      synergies,
      finalYield,
    };
  }

  /**
   * Calculate total daily yield from all buildings
   */
  calculateTotalDailyYield(): number {
    const buildings = this.buildingRegistry.getActive();
    let totalYield = 0;

    for (const building of buildings) {
      const calc = this.calculateBuildingYield(building);
      totalYield += calc.finalYield;
      
      // Record yield on building for stats
      this.buildingRegistry.recordYield(building.gridX, building.gridY, calc.finalYield);
    }

    return totalYield;
  }

  // ---------------------------------------------------------------------------
  // TIER-BASED CALCULATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get the TVL contribution for a tier
   */
  getTVLForTier(tier: CryptoTier): number {
    return BUILDING_CONFIG.TVL_BY_TIER[tier] ?? 0;
  }

  /**
   * Calculate risk factor based on building tiers
   * More degen buildings = higher risk
   */
  calculateRiskFactor(): number {
    const state = this.buildingRegistry.getState();
    const total = state.totalCount;
    
    if (total === 0) return 1;

    // Weight each tier by risk level
    const riskWeights: Record<CryptoTier, number> = {
      institution: 0.2,
      whale: 0.4,
      shark: 0.6,
      retail: 0.8,
      fish: 0.9,
      degen: 1.5,
    };

    let weightedRisk = 0;
    for (const [tier, count] of Object.entries(state.byTier)) {
      weightedRisk += (riskWeights[tier as CryptoTier] ?? 1) * count;
    }

    return weightedRisk / total;
  }

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  /**
   * Get synergy statistics for debugging/display
   */
  getSynergyStats(): {
    avgChainBonus: number;
    avgCategoryBonus: number;
    avgZoneBonus: number;
    avgTotalMultiplier: number;
  } {
    const buildings = this.buildingRegistry.getActive();
    
    if (buildings.length === 0) {
      return {
        avgChainBonus: 0,
        avgCategoryBonus: 0,
        avgZoneBonus: 0,
        avgTotalMultiplier: 1,
      };
    }

    let totalChain = 0;
    let totalCategory = 0;
    let totalZone = 0;
    let totalMultiplier = 0;

    for (const building of buildings) {
      const synergies = this.calculateSynergies(building);
      totalChain += synergies.chainBonus;
      totalCategory += synergies.categoryBonus;
      totalZone += synergies.zoneBonus;
      totalMultiplier += synergies.totalMultiplier;
    }

    const count = buildings.length;
    return {
      avgChainBonus: totalChain / count,
      avgCategoryBonus: totalCategory / count,
      avgZoneBonus: totalZone / count,
      avgTotalMultiplier: totalMultiplier / count,
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createSynergyCalculator(
  buildingRegistry: BuildingRegistry,
  zoneEffectsCache: ZoneEffectsCache,
  sentimentEngine: SentimentEngine
): SynergyCalculator {
  return new SynergyCalculator(buildingRegistry, zoneEffectsCache, sentimentEngine);
}

