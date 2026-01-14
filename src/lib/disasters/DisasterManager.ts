/**
 * Player Disaster Manager
 * 
 * "It is a mistake to think you can solve any major problems just with potatoes.
 * Similarly, it is a mistake to think you can solve any major problems by paying
 * USDT₮ to trigger disasters. But it sure is fun to try."
 * 
 * Manages player-triggered disasters with USDT₮ payments via Plasma.
 * Handles cooldowns, damage calculation, building repairs, and NPC panic.
 */

import type { Address, Hex } from 'viem';
import type { CryptoChain } from '@/games/isocity/crypto/types';
import type { PlacedCryptoBuilding } from '@/games/isocity/crypto/types';
import {
  PLAYER_DISASTERS,
  DEFAULT_BALANCE_CONFIG,
  createInitialDisasterState,
  type PlayerDisaster,
  type ActivePlayerDisaster,
  type DamagedBuildingFromDisaster,
  type TriggerDisasterRequest,
  type TriggerDisasterResult,
  type RepairBuildingRequest,
  type RepairBuildingResult,
  type PlayerDisasterSystemState,
  type DisasterBalanceConfig,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** USDT₮ has 6 decimal places */
const USDT_DECIMALS = 6;
const USDT_MULTIPLIER = BigInt(10 ** USDT_DECIMALS);

/** Repair cost as percentage of building original cost */
const REPAIR_COST_PERCENTAGE = 0.25;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert USDT amount to atomic units (6 decimals)
 */
function toAtomicUnits(usdtAmount: number): bigint {
  return BigInt(Math.floor(usdtAmount * Number(USDT_MULTIPLIER)));
}

/**
 * Convert atomic units to USDT display value
 */
function fromAtomicUnits(atomicAmount: bigint): number {
  return Number(atomicAmount) / Number(USDT_MULTIPLIER);
}

/**
 * Generate a unique instance ID for disasters
 */
function generateInstanceId(): string {
  return `disaster_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// DISASTER MANAGER CLASS
// =============================================================================

export type DisasterCallback = (disaster: ActivePlayerDisaster, isStarting: boolean) => void;

/**
 * Manages player-triggered disasters with USDT₮ payments.
 * 
 * Unlike natural disasters, these are intentionally triggered by players
 * who pay for the privilege of causing chaos.
 */
export class PlayerDisasterManager {
  private state: PlayerDisasterSystemState;
  private listeners: Set<DisasterCallback> = new Set();
  
  // External dependencies (injected)
  private getBuildingsFunc: (() => PlacedCryptoBuilding[]) | null = null;
  private getBuildingDefFunc: ((id: string) => { name: string; cost: number; crypto: { chain: CryptoChain } } | null) | null = null;
  private getCityPopulationFunc: (() => number) | null = null;

  constructor(initialState?: Partial<PlayerDisasterSystemState>) {
    this.state = {
      ...createInitialDisasterState(),
      ...initialState,
    };
  }

  // ===========================================================================
  // DEPENDENCY INJECTION
  // ===========================================================================

  /**
   * Set function to get current buildings (for targeting)
   */
  setGetBuildings(fn: () => PlacedCryptoBuilding[]): void {
    this.getBuildingsFunc = fn;
  }

  /**
   * Set function to get building definition (for damage calculation)
   */
  setGetBuildingDef(fn: (id: string) => { name: string; cost: number; crypto: { chain: CryptoChain } } | null): void {
    this.getBuildingDefFunc = fn;
  }

  /**
   * Set function to get city population (for cost scaling)
   */
  setGetCityPopulation(fn: () => number): void {
    this.getCityPopulationFunc = fn;
  }

  // ===========================================================================
  // STATE ACCESS
  // ===========================================================================

  /**
   * Get current state (immutable copy)
   */
  getState(): PlayerDisasterSystemState {
    return {
      ...this.state,
      activeDisasters: [...this.state.activeDisasters],
      damagedBuildings: [...this.state.damagedBuildings],
      lastDisasterTimeByType: { ...this.state.lastDisasterTimeByType },
      lastTargetTimeByBuilding: { ...this.state.lastTargetTimeByBuilding },
      balanceConfig: { ...this.state.balanceConfig },
    };
  }

  /**
   * Get all active disasters
   */
  getActiveDisasters(): ActivePlayerDisaster[] {
    return [...this.state.activeDisasters];
  }

  /**
   * Get all damaged buildings awaiting repair
   */
  getDamagedBuildings(): DamagedBuildingFromDisaster[] {
    return [...this.state.damagedBuildings];
  }

  /**
   * Check if a specific disaster type is currently active
   */
  isDisasterActive(disasterId: string): boolean {
    return this.state.activeDisasters.some(d => d.disaster.id === disasterId && d.isActive);
  }

  /**
   * Check if city has new player shield active
   */
  hasNewPlayerShield(): boolean {
    const now = Date.now();
    const shieldDuration = this.state.balanceConfig.newPlayerShieldSeconds * 1000;
    return (now - this.state.cityCreatedAt) < shieldDuration;
  }

  // ===========================================================================
  // COST CALCULATION
  // ===========================================================================

  /**
   * Calculate the cost to trigger a disaster (in atomic USDT₮ units)
   */
  calculateDisasterCost(disasterId: string): bigint {
    const disaster = PLAYER_DISASTERS[disasterId];
    if (!disaster) return BigInt(0);

    const config = this.state.balanceConfig;
    let cost = disaster.baseCostUSDT * config.baseCostMultiplier;

    // Scale with city population
    if (this.getCityPopulationFunc) {
      const population = this.getCityPopulationFunc();
      const populationBonus = (population / 100) * config.costPerHundredPopulation;
      cost += populationBonus;
    }

    return toAtomicUnits(cost);
  }

  /**
   * Calculate repair cost for a damaged building (in atomic USDT₮ units)
   */
  calculateRepairCost(buildingId: string): bigint {
    const damaged = this.state.damagedBuildings.find(b => b.buildingId === buildingId);
    if (!damaged) return BigInt(0);

    return toAtomicUnits(damaged.repairCostUSDT);
  }

  /**
   * Get cost for a disaster as a display string
   */
  getDisasterCostDisplay(disasterId: string): string {
    const cost = this.calculateDisasterCost(disasterId);
    return `${fromAtomicUnits(cost).toFixed(2)} USDT₮`;
  }

  // ===========================================================================
  // COOLDOWN CHECKS
  // ===========================================================================

  /**
   * Check if a disaster can be triggered (respects all cooldowns)
   */
  canTriggerDisaster(disasterId: string): { canTrigger: boolean; reason?: string; cooldownRemaining?: number } {
    const now = Date.now();
    const config = this.state.balanceConfig;
    const disaster = PLAYER_DISASTERS[disasterId];

    if (!disaster) {
      return { canTrigger: false, reason: 'Unknown disaster type' };
    }

    // Check new player shield
    if (this.hasNewPlayerShield()) {
      const shieldRemaining = Math.ceil(
        (this.state.cityCreatedAt + config.newPlayerShieldSeconds * 1000 - now) / 1000
      );
      return {
        canTrigger: false,
        reason: 'New player shield is active',
        cooldownRemaining: shieldRemaining,
      };
    }

    // Check city minimum age
    const cityAge = (now - this.state.cityCreatedAt) / 1000;
    if (cityAge < config.minimumCityAgeSeconds) {
      return {
        canTrigger: false,
        reason: 'City is too new to trigger disasters',
        cooldownRemaining: Math.ceil(config.minimumCityAgeSeconds - cityAge),
      };
    }

    // Check global cooldown
    const timeSinceLastGlobal = (now - this.state.lastGlobalDisasterTime) / 1000;
    if (timeSinceLastGlobal < config.globalCooldownSeconds) {
      return {
        canTrigger: false,
        reason: 'Global cooldown active',
        cooldownRemaining: Math.ceil(config.globalCooldownSeconds - timeSinceLastGlobal),
      };
    }

    // Check per-type cooldown
    const lastTypeTime = this.state.lastDisasterTimeByType[disasterId] || 0;
    const timeSinceLastType = (now - lastTypeTime) / 1000;
    if (timeSinceLastType < disaster.cooldownSeconds) {
      return {
        canTrigger: false,
        reason: `${disaster.name} is on cooldown`,
        cooldownRemaining: Math.ceil(disaster.cooldownSeconds - timeSinceLastType),
      };
    }

    // Check if disaster of same type is already active
    if (this.isDisasterActive(disasterId)) {
      return { canTrigger: false, reason: `${disaster.name} is already active` };
    }

    return { canTrigger: true };
  }

  // ===========================================================================
  // DISASTER TRIGGERING
  // ===========================================================================

  /**
   * Trigger a disaster (main entry point)
   * 
   * Note: This doesn't actually process payments - that should be done
   * by the calling code using Plasma/X402 infrastructure. This method
   * assumes payment has been verified.
   */
  triggerDisaster(
    request: TriggerDisasterRequest,
    paymentTxHash?: Hex
  ): TriggerDisasterResult {
    const { disasterId, triggerAddress, targetChain, targetBuildingId } = request;

    // Validate disaster type
    const disaster = PLAYER_DISASTERS[disasterId];
    if (!disaster) {
      return { success: false, error: 'Unknown disaster type' };
    }

    // Check cooldowns
    const cooldownCheck = this.canTriggerDisaster(disasterId);
    if (!cooldownCheck.canTrigger) {
      return { success: false, error: cooldownCheck.reason };
    }

    // Calculate cost
    const cost = this.calculateDisasterCost(disasterId);

    // Select affected buildings
    const affectedBuildings = this.selectAffectedBuildings(disaster, targetChain, targetBuildingId);
    
    if (affectedBuildings.length === 0 && disaster.damageType !== 'npc_panic') {
      return { success: false, error: 'No valid targets for this disaster' };
    }

    // Create active disaster
    const now = Date.now();
    const activeDisaster: ActivePlayerDisaster = {
      instanceId: generateInstanceId(),
      disaster,
      triggeredBy: triggerAddress,
      paidAmount: cost,
      paymentTxHash,
      startedAt: now,
      endsAt: now + disaster.durationSeconds * 1000,
      affectedBuildingIds: affectedBuildings.map(b => b.buildingId),
      affectedNpcIds: [], // Will be populated by NPC reactions system
      isActive: true,
      totalDamage: 0,
      targetChain,
    };

    // Apply initial damage to buildings
    for (const building of affectedBuildings) {
      this.damageBuilding(building, activeDisaster);
    }

    // Update state
    this.state.activeDisasters.push(activeDisaster);
    this.state.lastGlobalDisasterTime = now;
    this.state.lastDisasterTimeByType[disasterId] = now;
    this.state.totalDisasterSpend += cost;

    // Update per-building cooldowns
    for (const building of affectedBuildings) {
      this.state.lastTargetTimeByBuilding[building.buildingId] = now;
    }

    // Notify listeners
    this.notifyListeners(activeDisaster, true);

    return {
      success: true,
      disaster: activeDisaster,
      costCharged: cost,
      txHash: paymentTxHash,
    };
  }

  /**
   * Select buildings to be affected by a disaster
   */
  private selectAffectedBuildings(
    disaster: PlayerDisaster,
    targetChain?: CryptoChain,
    targetBuildingId?: string
  ): { buildingId: string; gridX: number; gridY: number; name: string; cost: number }[] {
    if (!this.getBuildingsFunc || !this.getBuildingDefFunc) {
      return [];
    }

    const buildings = this.getBuildingsFunc();
    const config = this.state.balanceConfig;
    const now = Date.now();

    // Filter to eligible buildings (not on cooldown, match disaster criteria)
    let eligible = buildings.filter(b => {
      // Check per-building cooldown
      const lastTargeted = this.state.lastTargetTimeByBuilding[b.id] || 0;
      const timeSinceTarget = (now - lastTargeted) / 1000;
      if (timeSinceTarget < config.sameTargetCooldownSeconds) {
        return false;
      }

      // Check if already damaged
      if (this.state.damagedBuildings.some(d => d.buildingId === b.id)) {
        return false;
      }

      const def = this.getBuildingDefFunc!(b.buildingId);
      if (!def) return false;

      // Chain-specific filtering
      if (disaster.damageType === 'chain_offline' && targetChain) {
        return def.crypto.chain === targetChain;
      }

      // Category filtering
      if (disaster.affectedCategories && disaster.affectedCategories.length > 0) {
        // Note: Would need category info from building def
        // For now, allow all buildings
      }

      return true;
    });

    // If specific target requested
    if (targetBuildingId) {
      const target = eligible.find(b => b.id === targetBuildingId);
      if (target) {
        const def = this.getBuildingDefFunc(target.buildingId);
        if (def) {
          return [{
            buildingId: target.id,
            gridX: target.gridX,
            gridY: target.gridY,
            name: def.name,
            cost: def.cost,
          }];
        }
      }
      return [];
    }

    // Calculate max affected count
    const maxAffected = Math.max(
      1,
      Math.floor(buildings.length * Math.min(disaster.maxBuildingsAffected, config.maxBuildingsAffectedCap))
    );

    // Randomly select buildings
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, maxAffected);

    return selected.map(b => {
      const def = this.getBuildingDefFunc!(b.buildingId)!;
      return {
        buildingId: b.id,
        gridX: b.gridX,
        gridY: b.gridY,
        name: def.name,
        cost: def.cost,
      };
    });
  }

  /**
   * Apply damage to a building
   */
  private damageBuilding(
    building: { buildingId: string; gridX: number; gridY: number; name: string; cost: number },
    disaster: ActivePlayerDisaster
  ): void {
    // Calculate severity based on disaster type
    let severity = 0.5; // Default 50% damage
    switch (disaster.disaster.damageType) {
      case 'building_destroy':
        severity = 1.0; // Full destruction
        break;
      case 'spread_damage':
        severity = 0.4 + Math.random() * 0.3; // 40-70%
        break;
      case 'random_damage':
        severity = 0.2 + Math.random() * 0.5; // 20-70%
        break;
      case 'npc_panic':
        severity = 0.1; // Minimal structural damage
        break;
      case 'market_manipulation':
        severity = 0.3; // Moderate
        break;
      default:
        severity = 0.5;
    }

    const repairCost = building.cost * REPAIR_COST_PERCENTAGE * severity;

    const damagedBuilding: DamagedBuildingFromDisaster = {
      buildingId: building.buildingId,
      buildingDefId: building.buildingId, // Would need actual def ID
      buildingName: building.name,
      gridX: building.gridX,
      gridY: building.gridY,
      disasterId: disaster.disaster.id,
      disasterInstanceId: disaster.instanceId,
      damagedAt: Date.now(),
      originalCost: building.cost,
      repairCostUSDT: repairCost,
      severity,
    };

    this.state.damagedBuildings.push(damagedBuilding);
    disaster.totalDamage += repairCost;
  }

  // ===========================================================================
  // REPAIR SYSTEM
  // ===========================================================================

  /**
   * Repair a damaged building
   * 
   * Note: Like triggerDisaster, this assumes payment has been verified externally.
   */
  repairBuilding(request: RepairBuildingRequest, paymentTxHash?: Hex): RepairBuildingResult {
    const { buildingId, payerAddress } = request;

    // Find damaged building
    const damagedIndex = this.state.damagedBuildings.findIndex(b => b.buildingId === buildingId);
    if (damagedIndex === -1) {
      return { success: false, error: 'Building is not damaged' };
    }

    const damaged = this.state.damagedBuildings[damagedIndex];
    const cost = toAtomicUnits(damaged.repairCostUSDT);

    // Remove from damaged list
    this.state.damagedBuildings.splice(damagedIndex, 1);
    this.state.totalRepairSpend += cost;

    return {
      success: true,
      costCharged: cost,
      txHash: paymentTxHash,
    };
  }

  /**
   * Check if a building is damaged
   */
  isBuildingDamaged(buildingId: string): boolean {
    return this.state.damagedBuildings.some(b => b.buildingId === buildingId);
  }

  // ===========================================================================
  // TICK UPDATE
  // ===========================================================================

  /**
   * Update disasters each game tick
   * Called from the main game loop
   */
  tick(): { expiredDisasters: ActivePlayerDisaster[]; spreadDamage: string[] } {
    const now = Date.now();
    const expiredDisasters: ActivePlayerDisaster[] = [];
    const spreadDamage: string[] = [];

    for (const disaster of this.state.activeDisasters) {
      if (!disaster.isActive) continue;

      // Check if disaster has ended
      if (now >= disaster.endsAt) {
        disaster.isActive = false;
        expiredDisasters.push(disaster);
        this.notifyListeners(disaster, false);
        continue;
      }

      // Process spread damage for fire-type disasters
      if (disaster.disaster.damageType === 'spread_damage' && this.getBuildingsFunc && this.getBuildingDefFunc) {
        // 10% chance per tick to spread
        if (Math.random() < 0.1) {
          const newSpread = this.processSpreadDamage(disaster);
          spreadDamage.push(...newSpread);
        }
      }
    }

    // Remove expired disasters from active list
    this.state.activeDisasters = this.state.activeDisasters.filter(d => d.isActive);

    return { expiredDisasters, spreadDamage };
  }

  /**
   * Process fire spread damage
   */
  private processSpreadDamage(disaster: ActivePlayerDisaster): string[] {
    if (!this.getBuildingsFunc || !this.getBuildingDefFunc) return [];

    const buildings = this.getBuildingsFunc();
    const config = this.state.balanceConfig;
    const now = Date.now();
    const newDamaged: string[] = [];

    // Check each affected building for spread
    for (const affectedId of disaster.affectedBuildingIds) {
      const sourceBuilding = buildings.find(b => b.id === affectedId);
      if (!sourceBuilding) continue;

      // Check adjacent buildings
      const adjacent = buildings.filter(b => {
        if (b.id === affectedId) return false;
        if (disaster.affectedBuildingIds.includes(b.id)) return false;
        if (this.state.damagedBuildings.some(d => d.buildingId === b.id)) return false;

        const distance = Math.sqrt(
          Math.pow(b.gridX - sourceBuilding.gridX, 2) +
          Math.pow(b.gridY - sourceBuilding.gridY, 2)
        );
        return distance <= 2; // Adjacent within 2 tiles
      });

      // 20% chance per adjacent building to catch fire
      for (const adjBuilding of adjacent) {
        if (Math.random() < 0.2) {
          // Check if max affected reached
          if (disaster.affectedBuildingIds.length >= buildings.length * config.maxBuildingsAffectedCap) {
            break;
          }

          const def = this.getBuildingDefFunc(adjBuilding.buildingId);
          if (!def) continue;

          this.damageBuilding({
            buildingId: adjBuilding.id,
            gridX: adjBuilding.gridX,
            gridY: adjBuilding.gridY,
            name: def.name,
            cost: def.cost,
          }, disaster);

          disaster.affectedBuildingIds.push(adjBuilding.id);
          this.state.lastTargetTimeByBuilding[adjBuilding.id] = now;
          newDamaged.push(adjBuilding.id);
        }
      }
    }

    return newDamaged;
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================

  /**
   * Subscribe to disaster events
   */
  subscribe(callback: DisasterCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of a disaster event
   */
  private notifyListeners(disaster: ActivePlayerDisaster, isStarting: boolean): void {
    for (const listener of this.listeners) {
      try {
        listener(disaster, isStarting);
      } catch (e) {
        console.error('Disaster listener error:', e);
      }
    }
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Export state for saving
   */
  exportState(): PlayerDisasterSystemState {
    return this.getState();
  }

  /**
   * Import state from save
   */
  importState(data: Partial<PlayerDisasterSystemState>): void {
    const now = Date.now();

    // Restore basic state
    if (data.cityCreatedAt !== undefined) {
      this.state.cityCreatedAt = data.cityCreatedAt;
    }

    if (data.totalDisasterSpend !== undefined) {
      this.state.totalDisasterSpend = BigInt(data.totalDisasterSpend.toString());
    }

    if (data.totalRepairSpend !== undefined) {
      this.state.totalRepairSpend = BigInt(data.totalRepairSpend.toString());
    }

    if (data.lastGlobalDisasterTime !== undefined) {
      this.state.lastGlobalDisasterTime = data.lastGlobalDisasterTime;
    }

    if (data.lastDisasterTimeByType) {
      this.state.lastDisasterTimeByType = { ...data.lastDisasterTimeByType };
    }

    if (data.lastTargetTimeByBuilding) {
      this.state.lastTargetTimeByBuilding = { ...data.lastTargetTimeByBuilding };
    }

    if (data.balanceConfig) {
      this.state.balanceConfig = { ...DEFAULT_BALANCE_CONFIG, ...data.balanceConfig };
    }

    // Restore damaged buildings
    if (data.damagedBuildings) {
      this.state.damagedBuildings = [...data.damagedBuildings];
    }

    // Restore active disasters (filter out expired ones)
    if (data.activeDisasters) {
      this.state.activeDisasters = data.activeDisasters
        .filter(d => d.endsAt > now)
        .map(d => ({
          ...d,
          disaster: PLAYER_DISASTERS[d.disaster.id] || d.disaster,
          paidAmount: BigInt(d.paidAmount.toString()),
        }));
    }
  }

  /**
   * Reset state (for new game)
   */
  reset(): void {
    this.state = createInitialDisasterState();
  }

  /**
   * Update balance configuration
   */
  updateBalanceConfig(config: Partial<DisasterBalanceConfig>): void {
    this.state.balanceConfig = { ...this.state.balanceConfig, ...config };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const playerDisasterManager = new PlayerDisasterManager();

export default PlayerDisasterManager;
