// =============================================================================
// ECONOMY MODULE - PUBLIC API
// =============================================================================
// This file serves as the public facade for the economy simulation system.
// It re-exports the refactored modules while maintaining backward compatibility
// with the original CryptoEconomyManager API.

// =============================================================================
// CORE EXPORTS
// =============================================================================

export { TreasuryManager, createTreasuryManager } from './TreasuryManager';
export type { TreasuryState, TreasuryChangeCallback } from './TreasuryManager';

export { SentimentEngine, createSentimentEngine, getPhaseLabel, getPhaseEmoji } from './SentimentEngine';
export type { SentimentState, SentimentChangeCallback, MarketPhase } from './SentimentEngine';

export { BuildingRegistry, createBuildingRegistry, BuildingNotFoundException } from './BuildingRegistry';
export type { PlacedBuilding, BuildingRegistryState, BuildingChangeCallback } from './BuildingRegistry';

export { SpatialIndex, createSpatialIndex } from './SpatialIndex';
export type { SpatialEntry } from './SpatialIndex';

export { ZoneEffectsCache, createZoneEffectsCache } from './ZoneEffectsCache';
export type { CachedZoneEffect } from './ZoneEffectsCache';

export { SynergyCalculator, createSynergyCalculator } from './SynergyCalculator';
export type { SynergyResult, YieldCalculation } from './SynergyCalculator';

// =============================================================================
// UNIFIED ECONOMY MANAGER (Facade)
// =============================================================================
// This class provides the same API as the original CryptoEconomyManager
// but delegates to the refactored modules internally.

import { CryptoEconomyState, CryptoTier, ZoneEffect } from '../../components/game/types';
import { TreasuryManager } from './TreasuryManager';
import { SentimentEngine } from './SentimentEngine';
import { BuildingRegistry, PlacedBuilding } from './BuildingRegistry';
import { ZoneEffectsCache } from './ZoneEffectsCache';
import { SynergyCalculator } from './SynergyCalculator';
import { SIMULATION_CONFIG } from '../../config/gameConfig';

/**
 * Unified Economy Manager
 * Facade that maintains API compatibility while using refactored modules
 */
export class UnifiedEconomyManager {
  // Refactored subsystems
  public readonly treasury: TreasuryManager;
  public readonly sentiment: SentimentEngine;
  public readonly buildings: BuildingRegistry;
  public readonly zoneEffects: ZoneEffectsCache;
  public readonly synergies: SynergyCalculator;

  private currentTick: number = 0;
  private onTreasuryChangeCallback?: (newBalance: number, delta: number) => void;
  private onSentimentChangeCallback?: (newSentiment: number) => void;

  constructor(initialState?: CryptoEconomyState) {
    // Initialize subsystems
    this.treasury = new TreasuryManager(initialState?.treasury ?? SIMULATION_CONFIG.STARTING_TREASURY);
    this.sentiment = new SentimentEngine(initialState?.marketSentiment ?? 0);
    this.buildings = new BuildingRegistry();
    this.zoneEffects = new ZoneEffectsCache(this.buildings);
    this.synergies = new SynergyCalculator(this.buildings, this.zoneEffects, this.sentiment);

    // Set up callbacks to forward to legacy handlers
    this.treasury.onChanged((balance, delta) => {
      this.onTreasuryChangeCallback?.(balance, delta);
    });

    this.sentiment.onChanged((value) => {
      this.onSentimentChangeCallback?.(value);
    });
  }

  // ---------------------------------------------------------------------------
  // LEGACY API COMPATIBILITY
  // ---------------------------------------------------------------------------

  /**
   * Get current economy state (for UI display)
   */
  getState(): CryptoEconomyState {
    const buildingState = this.buildings.getState();

    return {
      treasury: this.treasury.getBalance(),
      dailyYield: this.synergies.calculateTotalDailyYield(),
      totalTVL: this.buildings.getTotalTVL(),
      marketSentiment: this.sentiment.getValue(),
      globalYieldMultiplier: this.sentiment.getYieldMultiplier(),
      globalVolatilityMultiplier: this.sentiment.getVolatilityMultiplier(),
      cryptoBuildingCount: buildingState.totalCount,
      buildingsByTier: buildingState.byTier as Record<CryptoTier, number>,
      buildingsByChain: buildingState.byChain,
      treasuryHistory: [...this.treasury.getHistory()],
      sentimentHistory: [...this.sentiment.getHistory()],
    };
  }

  /**
   * Get current tick
   */
  getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Get treasury balance
   */
  getTreasury(): number {
    return this.treasury.getBalance();
  }

  /**
   * Get market sentiment
   */
  getSentiment(): number {
    return this.sentiment.getValue();
  }

  /**
   * Get daily yield
   */
  getDailyYield(): number {
    return this.synergies.calculateTotalDailyYield();
  }

  // ---------------------------------------------------------------------------
  // BUILDING MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Register a building when placed
   */
  registerBuilding(buildingId: string, gridX: number, gridY: number): PlacedBuilding | null {
    return this.buildings.register(buildingId, gridX, gridY);
  }

  /**
   * Unregister a building when removed
   */
  unregisterBuilding(gridX: number, gridY: number): PlacedBuilding | null {
    return this.buildings.unregister(gridX, gridY);
  }

  /**
   * Get building at position
   */
  getBuilding(gridX: number, gridY: number): PlacedBuilding | null {
    return this.buildings.getAt(gridX, gridY);
  }

  /**
   * Get all placed buildings
   */
  getPlacedBuildings(): PlacedBuilding[] {
    return this.buildings.getAll();
  }

  /**
   * Disable a building (rug pull, hack, etc.)
   */
  disableBuilding(gridX: number, gridY: number): boolean {
    return this.buildings.disable(gridX, gridY);
  }

  /**
   * Enable a building
   */
  enableBuilding(gridX: number, gridY: number): boolean {
    return this.buildings.enable(gridX, gridY);
  }

  // ---------------------------------------------------------------------------
  // ZONE EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Get zone effects at a position
   */
  getZoneEffectsAt(gridX: number, gridY: number): ZoneEffect[] {
    const cached = this.zoneEffects.getEffectsAt(gridX, gridY);
    return cached.map((c) => c.effect);
  }

  // ---------------------------------------------------------------------------
  // TREASURY OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Add to treasury
   */
  addToTreasury(amount: number): void {
    this.treasury.add(amount);
  }

  /**
   * Remove from treasury
   */
  removeFromTreasury(amount: number): boolean {
    return this.treasury.tryRemove(amount);
  }

  // ---------------------------------------------------------------------------
  // SENTIMENT OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Shift market sentiment
   */
  shiftSentiment(amount: number): void {
    this.sentiment.shift(amount);
  }

  // ---------------------------------------------------------------------------
  // SIMULATION TICK
  // ---------------------------------------------------------------------------

  /**
   * Process one tick of the simulation
   */
  tick(): void {
    this.currentTick++;
    this.buildings.setCurrentTick(this.currentTick);
    this.synergies.invalidateCaches(this.currentTick);

    // Update sentiment (market cycle)
    this.sentiment.tick(this.currentTick);

    // Recalculate zone effects if needed
    if (this.zoneEffects.needsRecalculation()) {
      this.zoneEffects.recalculate();
    }

    // Calculate and add yield
    const dailyYield = this.synergies.calculateTotalDailyYield();
    this.treasury.add(dailyYield);

    // Record history
    this.treasury.recordToHistory();
    this.sentiment.recordToHistory();
  }

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------

  /**
   * Register callback for treasury changes
   */
  onTreasuryChanged(callback: (newBalance: number, delta: number) => void): void {
    this.onTreasuryChangeCallback = callback;
  }

  /**
   * Register callback for sentiment changes
   */
  onSentimentChanged(callback: (newSentiment: number) => void): void {
    this.onSentimentChangeCallback = callback;
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Export state for saving
   */
  exportState(): {
    treasury: { balance: number; history: number[] };
    sentiment: { value: number; history: number[] };
    buildings: PlacedBuilding[];
    currentTick: number;
  } {
    return {
      treasury: this.treasury.export(),
      sentiment: this.sentiment.export(),
      buildings: this.buildings.export(),
      currentTick: this.currentTick,
    };
  }

  /**
   * Import state from save
   */
  importState(state: {
    treasury?: { balance: number; history: number[] };
    sentiment?: { value: number; history: number[] };
    buildings?: PlacedBuilding[];
    currentTick?: number;
  }): void {
    if (state.treasury) {
      this.treasury.import(state.treasury);
    }
    if (state.sentiment) {
      this.sentiment.import(state.sentiment);
    }
    if (state.buildings) {
      this.buildings.import(state.buildings);
    }
    if (state.currentTick !== undefined) {
      this.currentTick = state.currentTick;
    }

    // Force zone effects recalculation
    this.zoneEffects.invalidate();
    this.zoneEffects.recalculate();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.treasury.reset();
    this.sentiment.reset();
    this.buildings.clear();
    this.zoneEffects.clear();
    this.currentTick = 0;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createUnifiedEconomyManager(initialState?: CryptoEconomyState): UnifiedEconomyManager {
  return new UnifiedEconomyManager(initialState);
}

// =============================================================================
// LEGACY COMPATIBILITY ALIAS
// =============================================================================
// This allows existing code to continue using CryptoEconomyManager name

export { UnifiedEconomyManager as RefactoredCryptoEconomyManager };

