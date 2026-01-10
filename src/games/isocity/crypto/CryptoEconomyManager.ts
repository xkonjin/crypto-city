/**
 * Crypto Economy Manager
 * 
 * Central manager for the crypto economy simulation in Crypto City.
 * Handles treasury, yield calculations, market sentiment, and building effects.
 * 
 * Now enhanced with real-world data integration:
 * - Blends real Fear & Greed index with simulated sentiment
 * - Adjusts yields based on real DeFi APYs
 * - Triggers events from real price movements and news
 * 
 * Adapted for IsoCity's architecture.
 */

import {
  CryptoEconomyState,
  PlacedCryptoBuilding,
  CryptoCategory,
  CryptoChain,
  CryptoTier,
  CRYPTO_TIER_MULTIPLIERS,
  MarketSentiment,
} from './types';
import { ALL_CRYPTO_BUILDINGS, getCryptoBuilding } from './buildings';
import type { 
  RealWorldCryptoData, 
  BlendedGameData,
  YieldAdjustment,
} from '../../../lib/crypto/types';

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

export const ECONOMY_CONFIG = {
  // Base values
  INITIAL_TREASURY: 50000,
  BASE_DAILY_YIELD: 100,
  
  // Sentiment thresholds (Fear & Greed Index style)
  SENTIMENT_THRESHOLDS: {
    extremeFear: 20,
    fear: 40,
    neutral: 60,
    greed: 80,
    // Above 80 = extreme greed
  },
  
  // Yield modifiers based on sentiment
  SENTIMENT_MULTIPLIERS: {
    extremeFear: 0.5,
    fear: 0.75,
    neutral: 1.0,
    greed: 1.25,
    extremeGreed: 1.5,
  },
  
  // TVL calculation
  TVL_PER_BUILDING_BASE: 1000000, // $1M per building base
  
  // Tick rate (ms)
  TICK_RATE: 5000,
} as const;

// =============================================================================
// ECONOMY STATE MANAGEMENT
// =============================================================================

/**
 * Create initial economy state
 */
export function createInitialEconomyState(): CryptoEconomyState {
  return {
    treasury: ECONOMY_CONFIG.INITIAL_TREASURY,
    dailyYield: 0,
    totalYield: 0,
    marketSentiment: 50,
    tvl: 0,
    buildingCount: 0,
    lastUpdate: Date.now(),
    tickCount: 0,
  };
}

// =============================================================================
// CRYPTO ECONOMY MANAGER CLASS
// =============================================================================

export class CryptoEconomyManager {
  private state: CryptoEconomyState;
  private placedBuildings: Map<string, PlacedCryptoBuilding> = new Map();
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: CryptoEconomyState) => void> = new Set();
  
  // ---------------------------------------------------------------------------
  // REAL WORLD DATA INTEGRATION
  // ---------------------------------------------------------------------------
  
  /** Current real-world crypto data (null if not yet loaded) */
  private realWorldData: RealWorldCryptoData | null = null;
  
  /** Current blended game data (sentiment, yields, events) */
  private blendedData: BlendedGameData | null = null;
  
  /** Whether real data integration is enabled */
  private realDataEnabled: boolean = true;
  
  /** Base simulated sentiment (before blending) */
  private simulatedSentiment: number = 50;
  
  constructor(initialState?: Partial<CryptoEconomyState>) {
    this.state = {
      ...createInitialEconomyState(),
      ...initialState,
    };
  }
  
  // ---------------------------------------------------------------------------
  // STATE ACCESS
  // ---------------------------------------------------------------------------
  
  /**
   * Get the current economy state (read-only copy)
   */
  getState(): CryptoEconomyState {
    return { ...this.state };
  }
  
  /**
   * Get all placed crypto buildings
   */
  getPlacedBuildings(): PlacedCryptoBuilding[] {
    return Array.from(this.placedBuildings.values());
  }
  
  /**
   * Get building count by category
   */
  getBuildingCountByCategory(): Record<CryptoCategory, number> {
    const counts: Record<CryptoCategory, number> = {
      defi: 0,
      exchange: 0,
      chain: 0,
      ct: 0,
      meme: 0,
      plasma: 0,
      stablecoin: 0,
      infrastructure: 0,
      legends: 0,
    };
    
    for (const building of this.placedBuildings.values()) {
      const def = getCryptoBuilding(building.buildingId);
      if (def) {
        counts[def.category]++;
      }
    }
    
    return counts;
  }
  
  /**
   * Get building count by chain
   * Returns a Partial record - not all chains may have buildings
   */
  getBuildingCountByChain(): Partial<Record<CryptoChain, number>> {
    const counts: Partial<Record<CryptoChain, number>> = {};
    
    for (const building of this.placedBuildings.values()) {
      const def = getCryptoBuilding(building.buildingId);
      if (def?.crypto?.chain) {
        const chain = def.crypto.chain;
        counts[chain] = (counts[chain] || 0) + 1;
      }
    }
    
    return counts;
  }
  
  /**
   * Get building count for a specific chain (returns 0 if no buildings)
   */
  getBuildingCountForChain(chain: CryptoChain): number {
    return this.getBuildingCountByChain()[chain] || 0;
  }
  
  // ---------------------------------------------------------------------------
  // REAL WORLD DATA INTEGRATION
  // ---------------------------------------------------------------------------
  
  /**
   * Set real-world crypto data from the data sync layer
   * This data will be blended with simulated values
   * 
   * @param data - Real-world data from APIs
   * @param blended - Blended game data from Reality Blender
   */
  setRealWorldData(data: RealWorldCryptoData, blended: BlendedGameData): void {
    this.realWorldData = data;
    this.blendedData = blended;
    
    // If blending is enabled and we have sentiment data, update market sentiment
    if (this.realDataEnabled && blended.sentiment.hasRealData) {
      // Convert from -100/+100 scale to 0-100 scale
      const blendedSentiment = (blended.sentiment.value + 100) / 2;
      this.state.marketSentiment = blendedSentiment;
    }
    
    // Recalculate economy with new real data
    this.recalculateEconomy();
    this.notifyListeners();
  }
  
  /**
   * Get current real-world data (null if not available)
   */
  getRealWorldData(): RealWorldCryptoData | null {
    return this.realWorldData;
  }
  
  /**
   * Get current blended game data (null if not available)
   */
  getBlendedData(): BlendedGameData | null {
    return this.blendedData;
  }
  
  /**
   * Check if real data is available and fresh
   */
  hasRealData(): boolean {
    return !!(this.realWorldData && this.blendedData?.dataStatus.hasAnyData);
  }
  
  /**
   * Check if we're currently online
   */
  isOnline(): boolean {
    return this.realWorldData?.isOnline ?? true;
  }
  
  /**
   * Enable or disable real data integration
   */
  setRealDataEnabled(enabled: boolean): void {
    this.realDataEnabled = enabled;
    this.recalculateEconomy();
  }
  
  /**
   * Check if real data integration is enabled
   */
  isRealDataEnabled(): boolean {
    return this.realDataEnabled;
  }
  
  /**
   * Get real yield adjustment for a specific chain
   * Returns multiplier (1.0 = no adjustment)
   */
  getRealYieldMultiplier(chain?: CryptoChain): number {
    if (!this.realDataEnabled || !this.blendedData?.yields.hasRealData) {
      return 1.0;
    }
    
    const yields = this.blendedData.yields;
    
    // If specific chain requested, check for chain-specific multiplier
    if (chain && yields.chainMultipliers[chain]) {
      return yields.chainMultipliers[chain]!;
    }
    
    // Otherwise return global multiplier
    return yields.globalMultiplier;
  }
  
  /**
   * Get real yield adjustment for a specific protocol
   * Returns multiplier (1.0 = no adjustment)
   */
  getProtocolYieldMultiplier(protocolName: string): number {
    if (!this.realDataEnabled || !this.blendedData?.yields.hasRealData) {
      return 1.0;
    }
    
    const lowerName = protocolName.toLowerCase();
    return this.blendedData.yields.protocolMultipliers[lowerName] ?? 1.0;
  }
  
  /**
   * Get data freshness status for UI display
   */
  getDataStatus(): {
    isOnline: boolean;
    lastSync: number | null;
    staleness: number;
    hasAnyData: boolean;
    sentimentSource: 'real' | 'simulated' | 'blended';
  } {
    if (!this.blendedData) {
      return {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        lastSync: null,
        staleness: Infinity,
        hasAnyData: false,
        sentimentSource: 'simulated',
      };
    }
    
    return {
      ...this.blendedData.dataStatus,
      sentimentSource: this.realDataEnabled && this.blendedData.sentiment.hasRealData 
        ? 'blended' 
        : 'simulated',
    };
  }
  
  // ---------------------------------------------------------------------------
  // BUILDING MANAGEMENT
  // ---------------------------------------------------------------------------
  
  /**
   * Register a placed crypto building
   */
  placeBuilding(
    buildingId: string,
    gridX: number,
    gridY: number,
    instanceId?: string
  ): PlacedCryptoBuilding | null {
    const definition = getCryptoBuilding(buildingId);
    if (!definition) {
      console.warn(`[CryptoEconomyManager] Unknown building: ${buildingId}`);
      return null;
    }
    
    const id = instanceId || `${buildingId}_${gridX}_${gridY}_${Date.now()}`;
    
    const placedBuilding: PlacedCryptoBuilding = {
      id,
      buildingId,
      gridX,
      gridY,
      placedAt: Date.now(),
      yieldAccumulated: 0,
    };
    
    this.placedBuildings.set(id, placedBuilding);
    this.recalculateEconomy();
    
    return placedBuilding;
  }
  
  /**
   * Remove a placed crypto building
   */
  removeBuilding(id: string): boolean {
    const removed = this.placedBuildings.delete(id);
    if (removed) {
      this.recalculateEconomy();
    }
    return removed;
  }
  
  /**
   * Remove building at specific grid position
   */
  removeBuildingAt(gridX: number, gridY: number): boolean {
    for (const [id, building] of this.placedBuildings) {
      if (building.gridX === gridX && building.gridY === gridY) {
        return this.removeBuilding(id);
      }
    }
    return false;
  }
  
  /**
   * Clear all buildings
   */
  clearAllBuildings(): void {
    this.placedBuildings.clear();
    this.recalculateEconomy();
  }
  
  // ---------------------------------------------------------------------------
  // ECONOMY CALCULATIONS
  // ---------------------------------------------------------------------------
  
  /**
   * Recalculate all economy values based on placed buildings
   * Now includes real-world data adjustments when available
   */
  private recalculateEconomy(): void {
    let totalYieldRate = 0;
    let totalTVL = 0;
    let buildingCount = 0;
    
    // Calculate base yields from all buildings
    for (const placed of this.placedBuildings.values()) {
      const def = getCryptoBuilding(placed.buildingId);
      if (!def?.crypto?.effects) continue;
      
      buildingCount++;
      
      const effects = def.crypto.effects;
      const tierMultiplier = CRYPTO_TIER_MULTIPLIERS[def.crypto.tier];
      
      // Base yield from building
      let buildingYield = (effects.yieldRate || 0) * tierMultiplier;
      
      // Apply staking bonus if applicable
      if (effects.stakingBonus && effects.stakingBonus > 1) {
        buildingYield *= effects.stakingBonus;
      }
      
      // Calculate synergies
      const synergyBonus = this.calculateSynergyBonus(placed, def);
      buildingYield *= (1 + synergyBonus);
      
      // ==== REAL WORLD DATA ADJUSTMENT ====
      // Apply real-world yield multipliers if available
      if (this.realDataEnabled && this.blendedData?.yields.hasRealData) {
        // Try protocol-specific multiplier first (e.g., "Uniswap", "Aave")
        const protocol = def.crypto.protocol;
        if (protocol) {
          const protocolMultiplier = this.getProtocolYieldMultiplier(protocol);
          buildingYield *= protocolMultiplier;
        } else {
          // Fall back to chain multiplier
          const chain = def.crypto.chain;
          const chainMultiplier = this.getRealYieldMultiplier(chain);
          buildingYield *= chainMultiplier;
        }
      }
      // ==== END REAL WORLD DATA ADJUSTMENT ====
      
      totalYieldRate += buildingYield;
      
      // TVL contribution based on tier
      const tvlMultiplier = CRYPTO_TIER_MULTIPLIERS[def.crypto.tier];
      totalTVL += ECONOMY_CONFIG.TVL_PER_BUILDING_BASE * tvlMultiplier;
    }
    
    // Apply sentiment modifier to yield
    const sentimentMultiplier = this.getSentimentMultiplier();
    let adjustedYield = totalYieldRate * sentimentMultiplier;
    
    // ==== GLOBAL REAL YIELD ADJUSTMENT ====
    // Apply global yield multiplier from real DeFi data
    if (this.realDataEnabled && this.blendedData?.yields.hasRealData) {
      adjustedYield *= this.blendedData.yields.globalMultiplier;
    }
    // ==== END GLOBAL REAL YIELD ADJUSTMENT ====
    
    // Update state
    this.state = {
      ...this.state,
      dailyYield: adjustedYield,
      tvl: totalTVL,
      buildingCount,
      lastUpdate: Date.now(),
    };
    
    this.notifyListeners();
  }
  
  /**
   * Calculate synergy bonus for a building based on nearby buildings
   */
  private calculateSynergyBonus(
    placed: PlacedCryptoBuilding,
    def: ReturnType<typeof getCryptoBuilding>
  ): number {
    if (!def?.crypto?.effects) return 0;
    
    const effects = def.crypto.effects;
    let synergyBonus = 0;
    
    const chainSynergies = effects.chainSynergy || [];
    const categorySynergies = effects.categorySynergy || [];
    const radius = effects.zoneRadius || 5;
    
    // Check all other buildings for synergy
    for (const other of this.placedBuildings.values()) {
      if (other.id === placed.id) continue;
      
      // Calculate distance
      const dx = Math.abs(other.gridX - placed.gridX);
      const dy = Math.abs(other.gridY - placed.gridY);
      const distance = Math.max(dx, dy); // Chebyshev distance
      
      if (distance > radius) continue;
      
      const otherDef = getCryptoBuilding(other.buildingId);
      if (!otherDef?.crypto) continue;
      
      // Chain synergy
      if (otherDef.crypto.chain && chainSynergies.includes(otherDef.crypto.chain)) {
        synergyBonus += 0.05 * (1 - distance / radius); // Closer = stronger
      }
      
      // Category synergy
      if (categorySynergies.includes(otherDef.category)) {
        synergyBonus += 0.03 * (1 - distance / radius);
      }
    }
    
    return Math.min(synergyBonus, 0.5); // Cap at 50% bonus
  }
  
  /**
   * Get sentiment multiplier based on current market sentiment
   */
  private getSentimentMultiplier(): number {
    const sentiment = this.state.marketSentiment;
    const thresholds = ECONOMY_CONFIG.SENTIMENT_THRESHOLDS;
    const multipliers = ECONOMY_CONFIG.SENTIMENT_MULTIPLIERS;
    
    if (sentiment < thresholds.extremeFear) {
      return multipliers.extremeFear;
    } else if (sentiment < thresholds.fear) {
      return multipliers.fear;
    } else if (sentiment < thresholds.neutral) {
      return multipliers.neutral;
    } else if (sentiment < thresholds.greed) {
      return multipliers.greed;
    } else {
      return multipliers.extremeGreed;
    }
  }
  
  /**
   * Get sentiment label from value
   */
  getSentimentLabel(): MarketSentiment {
    const sentiment = this.state.marketSentiment;
    const thresholds = ECONOMY_CONFIG.SENTIMENT_THRESHOLDS;
    
    if (sentiment < thresholds.extremeFear) {
      return 'extreme_fear';
    } else if (sentiment < thresholds.fear) {
      return 'fear';
    } else if (sentiment < thresholds.neutral) {
      return 'neutral';
    } else if (sentiment < thresholds.greed) {
      return 'greed';
    } else {
      return 'extreme_greed';
    }
  }
  
  // ---------------------------------------------------------------------------
  // SIMULATION TICK
  // ---------------------------------------------------------------------------
  
  /**
   * Process one simulation tick
   * Clamps elapsed time to prevent time drift exploits when tab is backgrounded
   */
  tick(): void {
    const now = Date.now();
    const elapsed = now - this.state.lastUpdate;
    // Clamp elapsed time to max 2x the tick rate to prevent time drift exploits
    // when browser tab is backgrounded for extended periods
    const maxElapsed = ECONOMY_CONFIG.TICK_RATE * 2;
    const clampedElapsed = Math.min(elapsed, maxElapsed);
    const tickFraction = clampedElapsed / ECONOMY_CONFIG.TICK_RATE;
    
    // Calculate yield earned this tick (yield is per-day, tick is 5 seconds)
    const ticksPerDay = (24 * 60 * 60 * 1000) / ECONOMY_CONFIG.TICK_RATE;
    const yieldThisTick = (this.state.dailyYield / ticksPerDay) * tickFraction;
    
    // Update treasury and accumulated yield
    this.state = {
      ...this.state,
      treasury: this.state.treasury + yieldThisTick,
      totalYield: this.state.totalYield + yieldThisTick,
      lastUpdate: now,
      tickCount: this.state.tickCount + 1,
    };
    
    // Accumulate yield per building (guard against division by zero)
    const buildingCount = this.placedBuildings.size;
    if (buildingCount > 0) {
      const yieldPerBuilding = yieldThisTick / buildingCount;
      for (const placed of this.placedBuildings.values()) {
        placed.yieldAccumulated += yieldPerBuilding;
      }
    }
    
    // Random sentiment fluctuation
    this.fluctuateSentiment();
    
    this.notifyListeners();
  }
  
  /**
   * Apply random sentiment fluctuation
   * When real data is enabled, we fluctuate the simulated base and blend
   * When disabled, we fluctuate the actual sentiment directly
   */
  private fluctuateSentiment(): void {
    // Small random walk with mean reversion to 50
    const current = this.realDataEnabled ? this.simulatedSentiment : this.state.marketSentiment;
    const meanReversion = (50 - current) * 0.01;
    const randomWalk = (Math.random() - 0.5) * 4;
    
    const newSimulatedSentiment = Math.max(0, Math.min(100, current + meanReversion + randomWalk));
    
    // Update simulated base
    this.simulatedSentiment = newSimulatedSentiment;
    
    // If real data is available and enabled, the sentiment is set by setRealWorldData
    // Otherwise, use the simulated value directly
    if (!this.realDataEnabled || !this.blendedData?.sentiment.hasRealData) {
      this.state.marketSentiment = newSimulatedSentiment;
    }
    // When real data is enabled, sentiment is updated in setRealWorldData()
  }
  
  /**
   * Get the current simulated sentiment (before blending)
   * Useful for the Reality Blender
   */
  getSimulatedSentiment(): number {
    return this.simulatedSentiment;
  }
  
  /**
   * Start automatic simulation ticks
   */
  startSimulation(): void {
    if (this.tickInterval) return;
    
    this.tickInterval = setInterval(() => {
      this.tick();
    }, ECONOMY_CONFIG.TICK_RATE);
  }
  
  /**
   * Stop automatic simulation ticks
   */
  stopSimulation(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  
  // ---------------------------------------------------------------------------
  // EVENT HANDLING
  // ---------------------------------------------------------------------------
  
  /**
   * Apply a market event effect
   * Handles all CryptoEventType values with appropriate economy effects
   */
  applyEvent(eventType: string, magnitude: number = 1.0): void {
    switch (eventType) {
      case 'bull_run':
        // Strong positive sentiment boost
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 20 * magnitude);
        break;
      case 'bear_market':
        // Strong negative sentiment impact
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 25 * magnitude);
        break;
      case 'airdrop':
        // Treasury boost from single airdrop
        this.state.treasury += 10000 * magnitude;
        break;
      case 'airdrop_season':
        // Larger treasury boost from multiple airdrops
        this.state.treasury += 25000 * magnitude;
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 15);
        break;
      case 'rug_pull':
        // Treasury and sentiment hit
        this.state.treasury = Math.max(0, this.state.treasury - 5000 * magnitude);
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 15);
        break;
      case 'hack':
        // Percentage-based treasury loss, big sentiment hit
        this.state.treasury = Math.max(0, this.state.treasury * (1 - 0.1 * magnitude));
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 20);
        break;
      case 'protocol_upgrade':
        // Moderate positive sentiment
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 10);
        break;
      case 'whale_entry':
        // Treasury and sentiment boost
        this.state.treasury += 5000 * magnitude;
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 8);
        break;
      case 'ct_drama':
        // CT drama causes volatility and slight negative sentiment
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 5 * magnitude);
        break;
      case 'liquidation_cascade':
        // Treasury loss and significant sentiment drop
        this.state.treasury = Math.max(0, this.state.treasury - 3000 * magnitude);
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 20);
        break;
      case 'merge':
        // Historic event with strong positive effects
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 35 * magnitude);
        break;
      case 'halving':
        // Bitcoin halving - bullish signal
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 30);
        break;
      case 'regulatory_fud':
        // Regulatory concerns hurt sentiment
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 18 * magnitude);
        break;
      default:
        // Unknown event type - log warning but don't crash
        console.warn(`[CryptoEconomyManager] Unknown event type: ${eventType}`);
    }
    
    this.recalculateEconomy();
  }
  
  // ---------------------------------------------------------------------------
  // TREASURY OPERATIONS
  // ---------------------------------------------------------------------------
  
  /**
   * Spend from treasury (returns true if successful)
   */
  spend(amount: number): boolean {
    if (amount <= 0 || amount > this.state.treasury) {
      return false;
    }
    
    this.state.treasury -= amount;
    this.notifyListeners();
    return true;
  }
  
  /**
   * Add to treasury
   */
  deposit(amount: number): void {
    if (amount <= 0) return;
    
    this.state.treasury += amount;
    this.notifyListeners();
  }
  
  /**
   * Check if can afford a purchase
   */
  canAfford(amount: number): boolean {
    return this.state.treasury >= amount;
  }
  
  // ---------------------------------------------------------------------------
  // STATE PERSISTENCE
  // ---------------------------------------------------------------------------
  
  /**
   * Export state for saving
   */
  exportState(): {
    economyState: CryptoEconomyState;
    buildings: PlacedCryptoBuilding[];
  } {
    return {
      economyState: this.getState(),
      buildings: this.getPlacedBuildings(),
    };
  }
  
  /**
   * Import state from save
   */
  importState(data: {
    economyState?: Partial<CryptoEconomyState>;
    buildings?: PlacedCryptoBuilding[];
  }): void {
    if (data.economyState) {
      this.state = {
        ...createInitialEconomyState(),
        ...data.economyState,
        lastUpdate: Date.now(),
      };
    }
    
    if (data.buildings) {
      this.placedBuildings.clear();
      for (const building of data.buildings) {
        this.placedBuildings.set(building.id, building);
      }
    }
    
    this.recalculateEconomy();
  }
  
  // ---------------------------------------------------------------------------
  // LISTENER MANAGEMENT
  // ---------------------------------------------------------------------------
  
  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: CryptoEconomyState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
  
  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  
  /**
   * Cleanup and destroy the manager
   */
  destroy(): void {
    this.stopSimulation();
    this.listeners.clear();
    this.placedBuildings.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const cryptoEconomy = new CryptoEconomyManager();

export default CryptoEconomyManager;

