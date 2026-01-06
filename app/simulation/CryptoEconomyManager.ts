// =============================================================================
// CRYPTO ECONOMY MANAGER
// =============================================================================
// Central manager for the crypto city economy simulation.
// Handles treasury, yield calculations, market sentiment, and building synergies.
//
// The economy runs on a tick-based system where each tick represents a game "day".
// Buildings generate yield based on their base rates, modified by:
// - Market sentiment (bull/bear market multipliers)
// - Zone bonuses from nearby buildings
// - Chain synergies (e.g., ETH buildings near Ethereum Foundation)
// - Category synergies (e.g., DeFi buildings near other DeFi buildings)
//
// Market sentiment cycles between fear (-100) and greed (+100) over time,
// affecting all yield generation and event probabilities.

import { 
  CryptoEconomyState, 
  CryptoTier, 
  ZoneEffect,
} from '../components/game/types';
import { 
  ALL_CRYPTO_BUILDINGS, 
  CryptoBuildingDefinition 
} from '../data/cryptoBuildings';

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================
// Tuneable parameters for economic balance

/**
 * Base multiplier applied to all yield generation
 * Adjust this to globally increase/decrease income
 */
const BASE_YIELD_MULTIPLIER = 1.0;

/**
 * How much market sentiment affects yield
 * At 1.0: sentiment of 100 gives 2x yield, -100 gives 0.5x yield
 */
const SENTIMENT_YIELD_IMPACT = 0.5;

/**
 * Rate at which market sentiment naturally decays toward 0
 * Higher values mean faster return to neutral
 */
const SENTIMENT_DECAY_RATE = 0.5;

/**
 * Random sentiment drift per tick (adds noise to cycles)
 */
const SENTIMENT_NOISE = 3.0;

/**
 * Period of the market cycle in ticks (days)
 * Full cycle is ~2x this value (peak to peak)
 */
const MARKET_CYCLE_PERIOD = 50;

/**
 * Amplitude of the base market cycle
 * Market naturally oscillates +/- this amount from center
 */
const MARKET_CYCLE_AMPLITUDE = 40;

/**
 * Synergy bonus when buildings share a chain
 */
const CHAIN_SYNERGY_BONUS = 0.15; // 15% bonus

/**
 * Synergy bonus when buildings share a category
 */
const CATEGORY_SYNERGY_BONUS = 0.10; // 10% bonus

/**
 * Maximum history entries to keep for graphs
 */
const MAX_HISTORY_LENGTH = 100;

// =============================================================================
// ECONOMY STATE FACTORY
// =============================================================================

/**
 * Creates a fresh economy state with default values
 * Call this when starting a new game
 */
export function createInitialEconomyState(): CryptoEconomyState {
  return {
    // Core balances
    treasury: 1000,  // Starting capital
    dailyYield: 0,
    totalTVL: 0,
    marketSentiment: 0,  // Neutral to start
    
    // Multipliers (calculated each tick)
    globalYieldMultiplier: 1.0,
    globalVolatilityMultiplier: 1.0,
    
    // Building tracking - initialized for all tier types
    cryptoBuildingCount: 0,
    buildingsByTier: {
      degen: 0,       // High risk, meme-tier buildings
      retail: 0,      // Entry level buildings
      whale: 0,       // High value buildings
      institution: 0, // Blue chip buildings
      shark: 0,       // Aggressive medium tier
      fish: 0,        // Small player buildings
    },
    buildingsByChain: {},
    
    // History for charts/graphs
    treasuryHistory: [1000],
    sentimentHistory: [0],
  };
}

// =============================================================================
// PLACED BUILDING TRACKING
// =============================================================================

/**
 * Represents a crypto building placed on the grid
 * Used for calculating synergies and zone effects
 */
export interface PlacedCryptoBuilding {
  buildingId: string;                    // ID from crypto buildings registry
  definition: CryptoBuildingDefinition;  // Full building definition
  gridX: number;                         // Grid position X (origin cell)
  gridY: number;                         // Grid position Y (origin cell)
  isActive: boolean;                     // False if rugged/hacked/disabled
  lastYield: number;                     // Yield generated last tick
  totalYieldGenerated: number;           // Lifetime yield
}

// =============================================================================
// CRYPTO ECONOMY MANAGER CLASS
// =============================================================================

export class CryptoEconomyManager {
  // Current economy state
  private state: CryptoEconomyState;
  
  // All placed crypto buildings in the city
  private placedBuildings: Map<string, PlacedCryptoBuilding> = new Map();
  
  // Active zone effects from buildings
  private activeZoneEffects: ZoneEffect[] = [];
  
  // Current tick (day) in the simulation
  private currentTick: number = 0;
  
  // Event callback for when treasury changes
  private onTreasuryChange?: (newBalance: number, delta: number) => void;
  
  // Event callback for when sentiment changes
  private onSentimentChange?: (newSentiment: number) => void;

  // ---------------------------------------------------------------------------
  // CONSTRUCTOR
  // ---------------------------------------------------------------------------
  
  constructor(initialState?: CryptoEconomyState) {
    // Use provided state or create fresh default state
    this.state = initialState || createInitialEconomyState();
  }

  // ---------------------------------------------------------------------------
  // STATE ACCESSORS
  // ---------------------------------------------------------------------------
  
  /**
   * Get current economy state (read-only snapshot)
   */
  getState(): Readonly<CryptoEconomyState> {
    return { ...this.state };
  }

  /**
   * Get current treasury balance
   */
  getTreasury(): number {
    return this.state.treasury;
  }

  /**
   * Get current market sentiment (-100 to 100)
   */
  getSentiment(): number {
    return this.state.marketSentiment;
  }

  /**
   * Get current daily yield rate
   */
  getDailyYield(): number {
    return this.state.dailyYield;
  }

  /**
   * Get all placed buildings
   */
  getPlacedBuildings(): PlacedCryptoBuilding[] {
    return Array.from(this.placedBuildings.values());
  }

  /**
   * Get the current tick number
   */
  getCurrentTick(): number {
    return this.currentTick;
  }

  // ---------------------------------------------------------------------------
  // EVENT CALLBACKS
  // ---------------------------------------------------------------------------

  /**
   * Register callback for treasury changes
   */
  onTreasuryChanged(callback: (newBalance: number, delta: number) => void): void {
    this.onTreasuryChange = callback;
  }

  /**
   * Register callback for sentiment changes
   */
  onSentimentChanged(callback: (newSentiment: number) => void): void {
    this.onSentimentChange = callback;
  }

  // ---------------------------------------------------------------------------
  // BUILDING MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Register a crypto building placed on the grid
   * Call this when a player places a crypto building
   * 
   * @param buildingId - The ID from the crypto buildings registry
   * @param gridX - Grid X position of the building origin
   * @param gridY - Grid Y position of the building origin
   * @returns The placed building object, or null if invalid building ID
   */
  registerBuilding(
    buildingId: string, 
    gridX: number, 
    gridY: number
  ): PlacedCryptoBuilding | null {
    // Look up building definition in registry
    const definition = ALL_CRYPTO_BUILDINGS[buildingId];
    if (!definition) {
      console.warn(`CryptoEconomyManager: Unknown building ID "${buildingId}"`);
      return null;
    }

    // Create unique key for this placed building (by position)
    const key = `${gridX},${gridY}`;

    // Create placed building record
    const placedBuilding: PlacedCryptoBuilding = {
      buildingId,
      definition,
      gridX,
      gridY,
      isActive: true,
      lastYield: 0,
      totalYieldGenerated: 0,
    };

    // Add to tracking map
    this.placedBuildings.set(key, placedBuilding);

    // Update building counts
    this.state.cryptoBuildingCount++;
    this.state.buildingsByTier[definition.crypto.tier]++;
    
    const chain = definition.crypto.chain || 'unknown';
    this.state.buildingsByChain[chain] = 
      (this.state.buildingsByChain[chain] || 0) + 1;

    // Recalculate zone effects
    this.recalculateZoneEffects();

    // Add to TVL based on tier
    const tvlContribution = this.getTVLContribution(definition.crypto.tier);
    this.state.totalTVL += tvlContribution;

    return placedBuilding;
  }

  /**
   * Unregister a crypto building (when demolished)
   * 
   * @param gridX - Grid X position of the building origin
   * @param gridY - Grid Y position of the building origin
   * @returns True if building was removed, false if not found
   */
  unregisterBuilding(gridX: number, gridY: number): boolean {
    const key = `${gridX},${gridY}`;
    const building = this.placedBuildings.get(key);
    
    if (!building) {
      return false;
    }

    // Update building counts
    this.state.cryptoBuildingCount--;
    this.state.buildingsByTier[building.definition.crypto.tier]--;
    
    const chain = building.definition.crypto.chain || 'unknown';
    this.state.buildingsByChain[chain] = 
      Math.max(0, (this.state.buildingsByChain[chain] || 0) - 1);

    // Remove from TVL
    const tvlContribution = this.getTVLContribution(building.definition.crypto.tier);
    this.state.totalTVL = Math.max(0, this.state.totalTVL - tvlContribution);

    // Remove from map
    this.placedBuildings.delete(key);

    // Recalculate zone effects
    this.recalculateZoneEffects();

    return true;
  }

  /**
   * Get TVL contribution based on building tier
   * Higher tiers contribute more to the city's total value locked
   */
  private getTVLContribution(tier: CryptoTier): number {
    const tvlByTier: Record<CryptoTier, number> = {
      fish: 50000,        // $50K - small players
      degen: 100000,      // $100K - high risk
      retail: 500000,     // $500K - entry level
      shark: 2000000,     // $2M - aggressive medium
      whale: 5000000,     // $5M - high value
      institution: 50000000, // $50M - blue chip
    };
    return tvlByTier[tier];
  }

  /**
   * Disable a building (rugged, hacked, etc.)
   * Building stays on grid but doesn't generate yield
   */
  disableBuilding(gridX: number, gridY: number): boolean {
    const key = `${gridX},${gridY}`;
    const building = this.placedBuildings.get(key);
    
    if (building) {
      building.isActive = false;
      return true;
    }
    return false;
  }

  /**
   * Re-enable a disabled building
   */
  enableBuilding(gridX: number, gridY: number): boolean {
    const key = `${gridX},${gridY}`;
    const building = this.placedBuildings.get(key);
    
    if (building) {
      building.isActive = true;
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // ZONE EFFECT CALCULATIONS
  // ---------------------------------------------------------------------------

  /**
   * Recalculate all zone effects from placed buildings
   * Called when buildings are added/removed
   */
  private recalculateZoneEffects(): void {
    this.activeZoneEffects = [];

    for (const building of this.placedBuildings.values()) {
      if (!building.isActive) continue;

      const effects = building.definition.crypto.effects;
      const radius = effects.zoneRadius || 0;

      if (radius <= 0) continue;

      // Create zone effect for this building
      const zoneEffect: ZoneEffect = {
        sourceBuilding: building.buildingId,
        sourceTile: { x: building.gridX, y: building.gridY },
        radius,
        effects: {
          yieldMultiplier: effects.stakingBonus,
          happinessModifier: effects.happinessEffect,
          volatilityModifier: effects.volatility,
          chainBonus: building.definition.crypto.chain,
        },
      };

      this.activeZoneEffects.push(zoneEffect);
    }
  }

  /**
   * Get combined zone effects at a specific grid position
   */
  getZoneEffectsAt(gridX: number, gridY: number): {
    yieldMultiplier: number;
    happinessModifier: number;
    volatilityModifier: number;
    chainBonuses: string[];
  } {
    let yieldMultiplier = 1.0;
    let happinessModifier = 0;
    let volatilityModifier = 0;
    const chainBonuses: string[] = [];

    for (const zone of this.activeZoneEffects) {
      // Calculate distance from zone center
      const dx = gridX - zone.sourceTile.x;
      const dy = gridY - zone.sourceTile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if within zone radius
      if (distance <= zone.radius) {
        // Apply effects with falloff based on distance
        const falloff = 1 - (distance / zone.radius) * 0.5; // 50% falloff at edge

        if (zone.effects.yieldMultiplier) {
          yieldMultiplier *= 1 + (zone.effects.yieldMultiplier - 1) * falloff;
        }
        if (zone.effects.happinessModifier) {
          happinessModifier += zone.effects.happinessModifier * falloff;
        }
        if (zone.effects.volatilityModifier) {
          volatilityModifier += zone.effects.volatilityModifier * falloff;
        }
        if (zone.effects.chainBonus) {
          chainBonuses.push(zone.effects.chainBonus);
        }
      }
    }

    return {
      yieldMultiplier,
      happinessModifier,
      volatilityModifier,
      chainBonuses,
    };
  }

  // ---------------------------------------------------------------------------
  // SYNERGY CALCULATIONS
  // ---------------------------------------------------------------------------

  /**
   * Calculate chain synergy bonus for a building based on nearby chain buildings
   */
  private calculateChainSynergyBonus(building: PlacedCryptoBuilding): number {
    const buildingChain = building.definition.crypto.chain;
    const synergiesWithChains = building.definition.crypto.effects.chainSynergy || [];
    
    if (!buildingChain && synergiesWithChains.length === 0) {
      return 1.0; // No chain synergy possible
    }

    let bonus = 1.0;
    const relevantChains = new Set([buildingChain, ...synergiesWithChains].filter(Boolean));

    // Check nearby buildings for matching chains
    for (const other of this.placedBuildings.values()) {
      if (other === building || !other.isActive) continue;

      const otherChain = other.definition.crypto.chain;
      if (otherChain && relevantChains.has(otherChain)) {
        // Calculate distance
        const dx = building.gridX - other.gridX;
        const dy = building.gridY - other.gridY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Synergy applies within reasonable distance (e.g., 10 tiles)
        if (distance <= 10) {
          bonus += CHAIN_SYNERGY_BONUS * (1 - distance / 10);
        }
      }
    }

    return bonus;
  }

  /**
   * Calculate category synergy bonus for a building
   */
  private calculateCategorySynergyBonus(building: PlacedCryptoBuilding): number {
    const synergiesWithCategories = building.definition.crypto.effects.categorySynergy || [];
    
    if (synergiesWithCategories.length === 0) {
      return 1.0;
    }

    let bonus = 1.0;

    // Check nearby buildings for matching categories
    for (const other of this.placedBuildings.values()) {
      if (other === building || !other.isActive) continue;

      const otherCategory = other.definition.category;
      if (synergiesWithCategories.includes(otherCategory)) {
        // Calculate distance
        const dx = building.gridX - other.gridX;
        const dy = building.gridY - other.gridY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Synergy applies within reasonable distance
        if (distance <= 8) {
          bonus += CATEGORY_SYNERGY_BONUS * (1 - distance / 8);
        }
      }
    }

    return bonus;
  }

  // ---------------------------------------------------------------------------
  // YIELD CALCULATIONS
  // ---------------------------------------------------------------------------

  /**
   * Calculate yield for a single building this tick
   */
  private calculateBuildingYield(building: PlacedCryptoBuilding): number {
    if (!building.isActive) {
      return 0;
    }

    const effects = building.definition.crypto.effects;
    
    // Base yield from building definition
    let yieldAmount = effects.yieldRate || 0;
    
    // Add trading fees if applicable
    yieldAmount += effects.tradingFees || 0;

    // Apply global yield multiplier (from market sentiment)
    yieldAmount *= this.state.globalYieldMultiplier;

    // Apply zone effects from nearby buildings
    const zoneEffects = this.getZoneEffectsAt(building.gridX, building.gridY);
    yieldAmount *= zoneEffects.yieldMultiplier;

    // Apply chain synergy bonus
    yieldAmount *= this.calculateChainSynergyBonus(building);

    // Apply category synergy bonus
    yieldAmount *= this.calculateCategorySynergyBonus(building);

    // Apply base multiplier
    yieldAmount *= BASE_YIELD_MULTIPLIER;

    return Math.max(0, yieldAmount);
  }

  /**
   * Calculate total daily yield from all buildings
   */
  private calculateTotalDailyYield(): number {
    let totalYield = 0;

    for (const building of this.placedBuildings.values()) {
      const buildingYield = this.calculateBuildingYield(building);
      building.lastYield = buildingYield;
      building.totalYieldGenerated += buildingYield;
      totalYield += buildingYield;
    }

    return totalYield;
  }

  // ---------------------------------------------------------------------------
  // MARKET SENTIMENT
  // ---------------------------------------------------------------------------

  /**
   * Update market sentiment for this tick
   * Uses a combination of:
   * - Sinusoidal base cycle (natural market rhythm)
   * - Random noise (uncertainty)
   * - Decay toward neutral (mean reversion)
   */
  private updateMarketSentiment(): void {
    const previousSentiment = this.state.marketSentiment;

    // Base sinusoidal cycle
    const cyclePhase = (this.currentTick / MARKET_CYCLE_PERIOD) * Math.PI * 2;
    const baseCycle = Math.sin(cyclePhase) * MARKET_CYCLE_AMPLITUDE;

    // Random noise
    const noise = (Math.random() - 0.5) * 2 * SENTIMENT_NOISE;

    // Decay toward the cycle (not toward 0, toward the natural rhythm)
    const targetSentiment = baseCycle;
    const decayDelta = (targetSentiment - this.state.marketSentiment) * 
      (SENTIMENT_DECAY_RATE / 100);

    // Apply changes
    this.state.marketSentiment += decayDelta + noise;

    // Clamp to valid range
    this.state.marketSentiment = Math.max(-100, 
      Math.min(100, this.state.marketSentiment));

    // Update global yield multiplier based on sentiment
    // Sentiment of 100 = 1.5x yield, -100 = 0.5x yield, 0 = 1x yield
    this.state.globalYieldMultiplier = 1 + 
      (this.state.marketSentiment / 100) * SENTIMENT_YIELD_IMPACT;

    // Volatility increases at sentiment extremes
    const sentimentExtreme = Math.abs(this.state.marketSentiment) / 100;
    this.state.globalVolatilityMultiplier = 1 + sentimentExtreme * 0.5;

    // Notify listeners
    if (this.onSentimentChange && 
        Math.abs(this.state.marketSentiment - previousSentiment) > 0.1) {
      this.onSentimentChange(this.state.marketSentiment);
    }
  }

  /**
   * Force a sentiment shift (for events)
   */
  shiftSentiment(delta: number): void {
    this.state.marketSentiment = Math.max(-100, 
      Math.min(100, this.state.marketSentiment + delta));

    if (this.onSentimentChange) {
      this.onSentimentChange(this.state.marketSentiment);
    }
  }

  /**
   * Get market phase description based on sentiment
   */
  getMarketPhase(): 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed' {
    const s = this.state.marketSentiment;
    if (s <= -60) return 'extreme_fear';
    if (s <= -20) return 'fear';
    if (s <= 20) return 'neutral';
    if (s <= 60) return 'greed';
    return 'extreme_greed';
  }

  // ---------------------------------------------------------------------------
  // TREASURY MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Add tokens to treasury (from yield, airdrops, etc.)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addToTreasury(amount: number, _reason?: string): void {
    // _reason available for future logging/analytics
    this.state.treasury += amount;
    
    if (this.onTreasuryChange) {
      this.onTreasuryChange(this.state.treasury, amount);
    }
  }

  /**
   * Remove tokens from treasury (from events, purchases, etc.)
   * Returns false if insufficient funds
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeFromTreasury(amount: number, _reason?: string): boolean {
    if (this.state.treasury < amount) {
      return false;
    }

    this.state.treasury -= amount;
    
    if (this.onTreasuryChange) {
      this.onTreasuryChange(this.state.treasury, -amount);
    }
    
    return true;
  }

  // ---------------------------------------------------------------------------
  // SIMULATION TICK
  // ---------------------------------------------------------------------------

  /**
   * Run one simulation tick (one game "day")
   * This is the main update loop called by the game
   * 
   * @returns Object with tick results for UI/effects
   */
  tick(): {
    yieldGenerated: number;
    sentimentChange: number;
    newTreasury: number;
  } {
    const previousSentiment = this.state.marketSentiment;

    // Increment tick counter
    this.currentTick++;

    // Update market sentiment
    this.updateMarketSentiment();

    // Calculate and collect yield
    const totalYield = this.calculateTotalDailyYield();
    this.state.dailyYield = totalYield;
    this.addToTreasury(totalYield, 'Daily yield');

    // Update history (for graphs)
    this.state.treasuryHistory.push(this.state.treasury);
    this.state.sentimentHistory.push(this.state.marketSentiment);

    // Trim history to max length
    if (this.state.treasuryHistory.length > MAX_HISTORY_LENGTH) {
      this.state.treasuryHistory.shift();
    }
    if (this.state.sentimentHistory.length > MAX_HISTORY_LENGTH) {
      this.state.sentimentHistory.shift();
    }

    return {
      yieldGenerated: totalYield,
      sentimentChange: this.state.marketSentiment - previousSentiment,
      newTreasury: this.state.treasury,
    };
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Export state for saving
   */
  exportState(): {
    economyState: CryptoEconomyState;
    placedBuildings: Array<{
      buildingId: string;
      gridX: number;
      gridY: number;
      isActive: boolean;
      totalYieldGenerated: number;
    }>;
    currentTick: number;
  } {
    return {
      economyState: { ...this.state },
      placedBuildings: Array.from(this.placedBuildings.values()).map(b => ({
        buildingId: b.buildingId,
        gridX: b.gridX,
        gridY: b.gridY,
        isActive: b.isActive,
        totalYieldGenerated: b.totalYieldGenerated,
      })),
      currentTick: this.currentTick,
    };
  }

  /**
   * Import state from save
   */
  importState(data: ReturnType<typeof this.exportState>): void {
    this.state = data.economyState;
    this.currentTick = data.currentTick;
    
    // Rebuild placed buildings
    this.placedBuildings.clear();
    for (const saved of data.placedBuildings) {
      const definition = ALL_CRYPTO_BUILDINGS[saved.buildingId];
      if (definition) {
        const key = `${saved.gridX},${saved.gridY}`;
        this.placedBuildings.set(key, {
          buildingId: saved.buildingId,
          definition,
          gridX: saved.gridX,
          gridY: saved.gridY,
          isActive: saved.isActive,
          lastYield: 0,
          totalYieldGenerated: saved.totalYieldGenerated,
        });
      }
    }

    // Recalculate zone effects
    this.recalculateZoneEffects();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
// Export a default instance for easy access across the app

export const cryptoEconomy = new CryptoEconomyManager();

