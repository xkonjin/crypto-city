// =============================================================================
// BUILDING REGISTRY
// =============================================================================
// Tracks all crypto buildings placed in the city including:
// - Building registration and unregistration
// - Building counts by tier and chain
// - Building enable/disable state (for rug pulls, hacks, etc.)
// - Building lookup by position

import { CryptoTier } from '../../components/game/types';
import { ALL_CRYPTO_BUILDINGS, CryptoBuildingDefinition } from '../../data/cryptoBuildings';
import { BUILDING_CONFIG } from '../../config/gameConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface PlacedBuilding {
  id: string;                          // Unique instance ID (based on position)
  buildingId: string;                  // Building type ID from registry
  definition: CryptoBuildingDefinition; // Full building definition
  gridX: number;                       // Grid position X
  gridY: number;                       // Grid position Y
  isActive: boolean;                   // False if rugged/hacked/disabled
  placedAt: number;                    // Tick when placed
  lastYield: number;                   // Yield generated last tick
  totalYieldGenerated: number;         // Lifetime yield
}

export interface BuildingRegistryState {
  totalCount: number;
  byTier: Record<CryptoTier, number>;
  byChain: Record<string, number>;
  byCategory: Record<string, number>;
  activeCount: number;
  disabledCount: number;
}

export type BuildingChangeCallback = (
  action: 'added' | 'removed' | 'enabled' | 'disabled',
  building: PlacedBuilding
) => void;

// =============================================================================
// BUILDING NOT FOUND ERROR
// =============================================================================

export class BuildingNotFoundException extends Error {
  constructor(public readonly positionKey: string) {
    super(`Building not found at position: ${positionKey}`);
    this.name = 'BuildingNotFoundException';
  }
}

// =============================================================================
// BUILDING REGISTRY CLASS
// =============================================================================

export class BuildingRegistry {
  private buildings: Map<string, PlacedBuilding> = new Map();
  private onChangeCallbacks: BuildingChangeCallback[] = [];
  private currentTick: number = 0;

  // Cached counts (updated on add/remove for O(1) access)
  private _totalCount: number = 0;
  private _byTier: Record<CryptoTier, number>;
  private _byChain: Record<string, number> = {};
  private _byCategory: Record<string, number> = {};
  private _activeCount: number = 0;

  constructor() {
    this._byTier = {
      degen: 0,
      retail: 0,
      whale: 0,
      institution: 0,
      shark: 0,
      fish: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // POSITION KEY HELPERS
  // ---------------------------------------------------------------------------

  private makeKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private parseKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION
  // ---------------------------------------------------------------------------

  /**
   * Register a new building at the given position
   * Returns the created PlacedBuilding or null if building type not found
   */
  register(buildingId: string, gridX: number, gridY: number): PlacedBuilding | null {
    const definition = ALL_CRYPTO_BUILDINGS[buildingId];
    if (!definition) {
      console.warn(`[BuildingRegistry] Unknown building ID: ${buildingId}`);
      return null;
    }

    const key = this.makeKey(gridX, gridY);

    // Check if already registered
    if (this.buildings.has(key)) {
      console.warn(`[BuildingRegistry] Building already exists at (${gridX}, ${gridY})`);
      return this.buildings.get(key)!;
    }

    const building: PlacedBuilding = {
      id: key,
      buildingId,
      definition,
      gridX,
      gridY,
      isActive: true,
      placedAt: this.currentTick,
      lastYield: 0,
      totalYieldGenerated: 0,
    };

    this.buildings.set(key, building);
    this.updateCountsOnAdd(building);
    this.notifyChange('added', building);

    return building;
  }

  /**
   * Unregister a building at the given position
   * Returns the removed building or null if not found
   */
  unregister(gridX: number, gridY: number): PlacedBuilding | null {
    const key = this.makeKey(gridX, gridY);
    const building = this.buildings.get(key);

    if (!building) {
      return null;
    }

    this.buildings.delete(key);
    this.updateCountsOnRemove(building);
    this.notifyChange('removed', building);

    return building;
  }

  // ---------------------------------------------------------------------------
  // LOOKUPS
  // ---------------------------------------------------------------------------

  /**
   * Get a building at the given position
   */
  getAt(gridX: number, gridY: number): PlacedBuilding | null {
    return this.buildings.get(this.makeKey(gridX, gridY)) ?? null;
  }

  /**
   * Check if a building exists at the given position
   */
  hasAt(gridX: number, gridY: number): boolean {
    return this.buildings.has(this.makeKey(gridX, gridY));
  }

  /**
   * Get all buildings
   */
  getAll(): PlacedBuilding[] {
    return Array.from(this.buildings.values());
  }

  /**
   * Get all active buildings
   */
  getActive(): PlacedBuilding[] {
    return this.getAll().filter((b) => b.isActive);
  }

  /**
   * Get buildings by tier
   */
  getByTier(tier: CryptoTier): PlacedBuilding[] {
    return this.getAll().filter((b) => b.definition.crypto.tier === tier);
  }

  /**
   * Get buildings by chain
   */
  getByChain(chain: string): PlacedBuilding[] {
    return this.getAll().filter((b) => b.definition.crypto.chain === chain);
  }

  /**
   * Get buildings by category
   */
  getByCategory(category: string): PlacedBuilding[] {
    return this.getAll().filter((b) => b.definition.category === category);
  }

  /**
   * Get buildings within a radius of a position
   */
  getInRadius(centerX: number, centerY: number, radius: number): PlacedBuilding[] {
    return this.getAll().filter((b) => {
      const dx = b.gridX - centerX;
      const dy = b.gridY - centerY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }

  // ---------------------------------------------------------------------------
  // ENABLE/DISABLE
  // ---------------------------------------------------------------------------

  /**
   * Disable a building (e.g., from rug pull or hack)
   */
  disable(gridX: number, gridY: number): boolean {
    const building = this.getAt(gridX, gridY);
    if (!building || !building.isActive) return false;

    building.isActive = false;
    this._activeCount--;
    this.notifyChange('disabled', building);

    return true;
  }

  /**
   * Enable a previously disabled building
   */
  enable(gridX: number, gridY: number): boolean {
    const building = this.getAt(gridX, gridY);
    if (!building || building.isActive) return false;

    building.isActive = true;
    this._activeCount++;
    this.notifyChange('enabled', building);

    return true;
  }

  /**
   * Check if a building is active
   */
  isActive(gridX: number, gridY: number): boolean {
    return this.getAt(gridX, gridY)?.isActive ?? false;
  }

  // ---------------------------------------------------------------------------
  // YIELD TRACKING
  // ---------------------------------------------------------------------------

  /**
   * Record yield for a building
   */
  recordYield(gridX: number, gridY: number, amount: number): void {
    const building = this.getAt(gridX, gridY);
    if (building) {
      building.lastYield = amount;
      building.totalYieldGenerated += amount;
    }
  }

  /**
   * Get total yield generated by all buildings
   */
  getTotalYieldGenerated(): number {
    return this.getAll().reduce((sum, b) => sum + b.totalYieldGenerated, 0);
  }

  // ---------------------------------------------------------------------------
  // STATS
  // ---------------------------------------------------------------------------

  /**
   * Get current state snapshot
   */
  getState(): BuildingRegistryState {
    return {
      totalCount: this._totalCount,
      byTier: { ...this._byTier },
      byChain: { ...this._byChain },
      byCategory: { ...this._byCategory },
      activeCount: this._activeCount,
      disabledCount: this._totalCount - this._activeCount,
    };
  }

  /**
   * Get total count
   */
  getTotalCount(): number {
    return this._totalCount;
  }

  /**
   * Get count by tier
   */
  getCountByTier(tier: CryptoTier): number {
    return this._byTier[tier] ?? 0;
  }

  /**
   * Get count by chain
   */
  getCountByChain(chain: string): number {
    return this._byChain[chain] ?? 0;
  }

  /**
   * Calculate total TVL based on building tiers
   */
  getTotalTVL(): number {
    let tvl = 0;
    const tvlByTier = BUILDING_CONFIG.TVL_BY_TIER;

    for (const [tier, count] of Object.entries(this._byTier)) {
      tvl += (tvlByTier[tier as CryptoTier] ?? 0) * count;
    }

    return tvl;
  }

  // ---------------------------------------------------------------------------
  // COUNT UPDATES (O(1) cached counts)
  // ---------------------------------------------------------------------------

  private updateCountsOnAdd(building: PlacedBuilding): void {
    this._totalCount++;
    if (building.isActive) this._activeCount++;

    const tier = building.definition.crypto.tier;
    this._byTier[tier] = (this._byTier[tier] ?? 0) + 1;

    const chain = building.definition.crypto.chain;
    if (chain) {
      this._byChain[chain] = (this._byChain[chain] ?? 0) + 1;
    }

    const category = building.definition.category;
    this._byCategory[category] = (this._byCategory[category] ?? 0) + 1;
  }

  private updateCountsOnRemove(building: PlacedBuilding): void {
    this._totalCount--;
    if (building.isActive) this._activeCount--;

    const tier = building.definition.crypto.tier;
    this._byTier[tier] = Math.max(0, (this._byTier[tier] ?? 0) - 1);

    const chain = building.definition.crypto.chain;
    if (chain) {
      this._byChain[chain] = Math.max(0, (this._byChain[chain] ?? 0) - 1);
    }

    const category = building.definition.category;
    this._byCategory[category] = Math.max(0, (this._byCategory[category] ?? 0) - 1);
  }

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------

  onChanged(callback: BuildingChangeCallback): () => void {
    this.onChangeCallbacks.push(callback);

    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onChangeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyChange(
    action: 'added' | 'removed' | 'enabled' | 'disabled',
    building: PlacedBuilding
  ): void {
    for (const callback of this.onChangeCallbacks) {
      try {
        callback(action, building);
      } catch (error) {
        console.error('[BuildingRegistry] Callback error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TICK MANAGEMENT
  // ---------------------------------------------------------------------------

  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  export(): PlacedBuilding[] {
    return this.getAll();
  }

  import(buildings: PlacedBuilding[]): void {
    this.clear();

    for (const building of buildings) {
      // Re-fetch definition in case it's been updated
      const definition = ALL_CRYPTO_BUILDINGS[building.buildingId];
      if (!definition) {
        console.warn(`[BuildingRegistry] Unknown building during import: ${building.buildingId}`);
        continue;
      }

      const key = this.makeKey(building.gridX, building.gridY);
      const restored: PlacedBuilding = {
        ...building,
        definition,
        id: key,
      };

      this.buildings.set(key, restored);
      this.updateCountsOnAdd(restored);
    }
  }

  /**
   * Clear all buildings
   */
  clear(): void {
    this.buildings.clear();
    this._totalCount = 0;
    this._activeCount = 0;
    this._byTier = {
      degen: 0,
      retail: 0,
      whale: 0,
      institution: 0,
      shark: 0,
      fish: 0,
    };
    this._byChain = {};
    this._byCategory = {};
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createBuildingRegistry(): BuildingRegistry {
  return new BuildingRegistry();
}

