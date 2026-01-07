// =============================================================================
// ZONE EFFECTS CACHE
// =============================================================================
// Manages zone effects from buildings with efficient spatial caching.
// Zone effects are bonuses/penalties that buildings apply to nearby tiles.

import { ZoneEffect, CryptoEffects } from '../../components/game/types';
import { SpatialIndex } from './SpatialIndex';
import { BuildingRegistry, PlacedBuilding } from './BuildingRegistry';
import { BUILDING_CONFIG } from '../../config/gameConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface CachedZoneEffect {
  buildingId: string;
  effect: ZoneEffect;
  sourceX: number;
  sourceY: number;
}

// =============================================================================
// ZONE EFFECTS CACHE CLASS
// =============================================================================

export class ZoneEffectsCache {
  private spatialIndex: SpatialIndex;
  private buildingRegistry: BuildingRegistry;
  
  // Cache of computed effects per building
  private effectsByBuilding: Map<string, ZoneEffect> = new Map();
  
  // Dirty flag to know when to recalculate
  private isDirty: boolean = false;

  constructor(buildingRegistry: BuildingRegistry) {
    this.spatialIndex = new SpatialIndex();
    this.buildingRegistry = buildingRegistry;
    
    // Listen for building changes to invalidate cache
    buildingRegistry.onChanged((action, building) => {
      if (action === 'added') {
        this.onBuildingAdded(building);
      } else if (action === 'removed') {
        this.onBuildingRemoved(building);
      } else if (action === 'disabled' || action === 'enabled') {
        this.markDirty();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // BUILDING CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onBuildingAdded(building: PlacedBuilding): void {
    const effect = this.createZoneEffectForBuilding(building);
    if (effect) {
      const radius = effect.radius ?? BUILDING_CONFIG.DEFAULT_ZONE_RADIUS;
      this.spatialIndex.addBuilding(building.id, building.gridX, building.gridY, radius);
      this.effectsByBuilding.set(building.id, effect);
    }
    this.markDirty();
  }

  private onBuildingRemoved(building: PlacedBuilding): void {
    this.spatialIndex.removeBuilding(building.id);
    this.effectsByBuilding.delete(building.id);
    this.markDirty();
  }

  private markDirty(): void {
    this.isDirty = true;
  }

  // ---------------------------------------------------------------------------
  // ZONE EFFECT CREATION
  // ---------------------------------------------------------------------------

  /**
   * Create a zone effect for a building based on its crypto effects
   */
  private createZoneEffectForBuilding(building: PlacedBuilding): ZoneEffect | null {
    const crypto = building.definition.crypto;
    if (!crypto.effects?.zoneRadius) {
      return null; // Building has no zone effect
    }

    const effects = crypto.effects;
    
    return {
      sourceBuilding: building.buildingId,
      radius: effects.zoneRadius ?? BUILDING_CONFIG.DEFAULT_ZONE_RADIUS,
      yieldBonus: effects.yieldRate ? effects.yieldRate / 100 : 0,
      happinessBonus: effects.happinessEffect ?? 0,
      volatilityModifier: effects.volatility ?? 0,
    };
  }

  // ---------------------------------------------------------------------------
  // QUERIES (O(1) with spatial index)
  // ---------------------------------------------------------------------------

  /**
   * Get all zone effects affecting a specific tile
   */
  getEffectsAt(gridX: number, gridY: number): CachedZoneEffect[] {
    const buildingIds = this.spatialIndex.getBuildingsAt(gridX, gridY);
    const effects: CachedZoneEffect[] = [];

    for (const id of buildingIds) {
      const effect = this.effectsByBuilding.get(id);
      if (effect) {
        const pos = this.spatialIndex.getBuildingPosition(id);
        if (pos) {
          // Check if source building is active
          const building = this.buildingRegistry.getAt(pos.x, pos.y);
          if (building?.isActive) {
            effects.push({
              buildingId: id,
              effect,
              sourceX: pos.x,
              sourceY: pos.y,
            });
          }
        }
      }
    }

    return effects;
  }

  /**
   * Get combined yield bonus at a position
   */
  getYieldBonusAt(gridX: number, gridY: number): number {
    const effects = this.getEffectsAt(gridX, gridY);
    return effects.reduce((sum, e) => sum + e.effect.yieldBonus, 0);
  }

  /**
   * Get combined happiness bonus at a position
   */
  getHappinessBonusAt(gridX: number, gridY: number): number {
    const effects = this.getEffectsAt(gridX, gridY);
    return effects.reduce((sum, e) => sum + e.effect.happinessBonus, 0);
  }

  /**
   * Get combined volatility modifier at a position
   */
  getVolatilityAt(gridX: number, gridY: number): number {
    const effects = this.getEffectsAt(gridX, gridY);
    return effects.reduce((sum, e) => sum + e.effect.volatilityModifier, 0);
  }

  /**
   * Check if a position has any zone effects
   */
  hasEffectsAt(gridX: number, gridY: number): boolean {
    return this.spatialIndex.hasEffectsAt(gridX, gridY);
  }

  /**
   * Get count of zone effects at a position
   */
  getEffectCountAt(gridX: number, gridY: number): number {
    return this.spatialIndex.getEffectCountAt(gridX, gridY);
  }

  // ---------------------------------------------------------------------------
  // YIELD CALCULATION HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Calculate zone effect multiplier for a building at its position
   */
  calculateZoneMultiplier(building: PlacedBuilding): number {
    // Get effects at this building's position (from other buildings)
    const effects = this.getEffectsAt(building.gridX, building.gridY);
    
    // Filter out effects from this building itself
    const externalEffects = effects.filter((e) => e.buildingId !== building.id);
    
    // Sum up yield bonuses
    const totalBonus = externalEffects.reduce((sum, e) => sum + e.effect.yieldBonus, 0);
    
    // Return multiplier (1 + bonus)
    return 1 + totalBonus;
  }

  // ---------------------------------------------------------------------------
  // RECALCULATION
  // ---------------------------------------------------------------------------

  /**
   * Recalculate all zone effects (call if isDirty)
   */
  recalculate(): void {
    if (!this.isDirty) return;

    // Clear and rebuild
    this.spatialIndex.clear();
    this.effectsByBuilding.clear();

    const buildings = this.buildingRegistry.getActive();
    for (const building of buildings) {
      const effect = this.createZoneEffectForBuilding(building);
      if (effect) {
        const radius = effect.radius ?? BUILDING_CONFIG.DEFAULT_ZONE_RADIUS;
        this.spatialIndex.addBuilding(building.id, building.gridX, building.gridY, radius);
        this.effectsByBuilding.set(building.id, effect);
      }
    }

    this.isDirty = false;
  }

  /**
   * Force mark as needing recalculation
   */
  invalidate(): void {
    this.markDirty();
  }

  /**
   * Check if recalculation is needed
   */
  needsRecalculation(): boolean {
    return this.isDirty;
  }

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  getStats(): {
    effectCount: number;
    cellsWithEffects: number;
    avgEffectsPerCell: number;
  } {
    const indexStats = this.spatialIndex.getStats();
    
    return {
      effectCount: this.effectsByBuilding.size,
      cellsWithEffects: indexStats.cellCount,
      avgEffectsPerCell: indexStats.avgBuildingsPerCell,
    };
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  clear(): void {
    this.spatialIndex.clear();
    this.effectsByBuilding.clear();
    this.isDirty = false;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createZoneEffectsCache(buildingRegistry: BuildingRegistry): ZoneEffectsCache {
  return new ZoneEffectsCache(buildingRegistry);
}

