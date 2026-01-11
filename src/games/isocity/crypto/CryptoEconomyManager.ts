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
  ServiceFunding,
  DamagedBuilding,
  // Active Management types (Issue #55)
  HarvestMode,
  MarketTiming,
  TradeOpportunity,
  ActiveTrade,
  YieldBoost,
  ActiveYieldBoost,
  RepairMiniGame,
} from './types';
import { ALL_CRYPTO_BUILDINGS, getCryptoBuilding } from './buildings';
import type { 
  RealWorldCryptoData, 
  BlendedGameData,
  YieldAdjustment,
} from '../../../lib/crypto/types';
import { logger } from '../../../lib/logger';
import { 
  BALANCE_CONFIG, 
  isContagionImmune, 
  getComparativeRisk,
  formatComparativeRisk 
} from './balanceConfig';
import { 
  DisasterManager, 
  disasterManager as defaultDisasterManager,
  DISASTERS,
  type ActiveDisaster,
  type DisasterManagerState,
} from '../../../lib/disasters';

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
  
  // === MONEY SINKS (Issue #54) ===
  
  // Maintenance costs
  MAINTENANCE: {
    /** Base cost per building per day (1-3% of average building cost ~$10k = $100-300) */
    BASE_COST_PER_BUILDING: 150,
    /** Tier multipliers for maintenance costs */
    TIER_MULTIPLIERS: {
      retail: 0.5,     // Lower maintenance for small buildings
      degen: 1.0,      // Standard maintenance
      whale: 1.5,      // Higher maintenance for premium buildings
      institution: 2.0, // Highest maintenance for institutions
    } as Record<CryptoTier, number>,
    /** Extra cost per 10 buildings (0.5% scaling) */
    SCALING_PER_10_BUILDINGS: 0.005,
  },
  
  // Service funding
  SERVICES: {
    /** Base cost per service at 50% funding per day */
    BASE_COST_AT_50_PERCENT: 50,
    /** Maximum funding level */
    MAX_FUNDING: 100,
    /** Security: rug protection multiplier at 100% funding */
    SECURITY_MAX_RUG_REDUCTION: 0.3, // 30% rug risk reduction at 100%
    /** Marketing: yield multiplier at 100% funding */
    MARKETING_MAX_YIELD_BONUS: 0.2, // 20% yield bonus at 100%
    /** Research: airdrop chance multiplier at 100% funding */
    RESEARCH_MAX_AIRDROP_BONUS: 0.5, // 50% more airdrops at 100%
    /** Penalty for low funding (below 30%) */
    LOW_FUNDING_THRESHOLD: 30,
    LOW_FUNDING_PENALTY: 0.15, // 15% negative effect
  },
  
  // Emergency repairs
  REPAIRS: {
    /** Repair cost as percentage of original building cost */
    COST_PERCENTAGE: 0.25, // 25%
  },
  
  // Building upgrades
  UPGRADES: {
    /** Cost multipliers for each level (% of base cost) */
    LEVEL_COSTS: {
      2: 0.5,  // 50% of base cost to upgrade to level 2
      3: 1.0,  // 100% of base cost to upgrade to level 3
    } as Record<2 | 3, number>,
    /** Yield bonuses for each level */
    LEVEL_YIELD_BONUS: {
      1: 0,      // Base level, no bonus
      2: 0.25,   // +25% yield at level 2
      3: 0.50,   // +50% yield at level 3
    } as Record<1 | 2 | 3, number>,
  },
  
  // === ACTIVE MANAGEMENT (Issue #55) ===
  
  // Trade opportunities
  TRADES: {
    /** Maximum number of active trade opportunities */
    MAX_OPPORTUNITIES: 3,
    /** Ticks between generating new opportunities */
    GENERATION_INTERVAL: 20, // ~1.5 minutes
    /** How long opportunities last before expiring */
    OPPORTUNITY_DURATION: 100, // ~8 minutes
    /** Base trade examples */
    TEMPLATES: [
      { name: 'Early DEX listing', cost: 5000, potentialReturn: 3, risk: 0.4, duration: 30 },
      { name: 'NFT flip opportunity', cost: 2000, potentialReturn: 5, risk: 0.6, duration: 20 },
      { name: 'Staking pool entry', cost: 10000, potentialReturn: 1.5, risk: 0.1, duration: 50 },
      { name: 'Arbitrage play', cost: 3000, potentialReturn: 2, risk: 0.3, duration: 15 },
      { name: 'Presale allocation', cost: 8000, potentialReturn: 4, risk: 0.5, duration: 40 },
      { name: 'Liquidity mining', cost: 6000, potentialReturn: 2.5, risk: 0.35, duration: 35 },
    ],
  },
  
  // Yield boosts
  YIELD_BOOSTS: {
    /** Available boost types */
    TYPES: [
      { id: 'leverage-2x', name: '2x Leverage', description: 'Double yields, double risk', yieldMultiplier: 2.0, riskIncrease: 1.0, duration: 50, cost: 2000 },
      { id: 'leverage-3x', name: '3x Leverage', description: 'Triple yields, triple risk', yieldMultiplier: 3.0, riskIncrease: 2.0, duration: 30, cost: 5000 },
      { id: 'degen-mode', name: 'Degen Mode', description: 'Max risk, max reward', yieldMultiplier: 5.0, riskIncrease: 4.0, duration: 20, cost: 10000 },
    ] as YieldBoost[],
  },
  
  // Repair mini-game
  REPAIR_MINIGAME: {
    /** Duration in seconds */
    DURATION: 5,
    /** Progress per click */
    PROGRESS_PER_CLICK: 5,
    /** Target progress to succeed */
    TARGET_PROGRESS: 100,
    /** Discount on repair cost if successful */
    SUCCESS_DISCOUNT: 0.5, // 50% off
  },
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
    bankruptcyCounter: 0,
    isBankrupt: false,
    decayingBuildings: [],
    // Game objectives tracking
    gameDays: 0,
    lowHappinessCounter: 0,
    hadCryptoBuildings: false,
    // === MONEY SINKS (Issue #54) ===
    serviceFunding: {
      security: 50,   // Default 50% funding
      marketing: 50,
      research: 50,
    },
    dailyMaintenanceCost: 0,
    dailyServiceCost: 0,
    damagedBuildings: [],
    // === ACTIVE MANAGEMENT (Issue #55) ===
    marketTiming: {
      pendingYields: 0,
      lockedYields: 0,
      lockSentiment: null,
      harvestMode: 'auto',
    },
    tradeOpportunities: [],
    activeTrades: [],
    activeYieldBoosts: [],
    repairMiniGame: null,
    // === ORDINANCES SYSTEM (Issue #69) ===
    dailyOrdinanceCost: 0,
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
  // GAME SPEED INTEGRATION
  // ---------------------------------------------------------------------------
  
  /** Current game speed (0=paused, 1=normal, 2=fast, 3=very fast) */
  private gameSpeed: 0 | 1 | 2 | 3 = 1;
  
  /** Speed multipliers for economy calculations */
  private static readonly SPEED_MULTIPLIERS = {
    0: 0,     // Paused - no ticks
    1: 1,     // Normal
    2: 2,     // Fast - 2x yield
    3: 4,     // Very fast - 4x yield
  } as const;
  
  // ---------------------------------------------------------------------------
  // CITY INTEGRATION (Issue #44)
  // ---------------------------------------------------------------------------
  
  /** City population - affects crypto yields (more users = better yields) */
  private cityPopulation: number = 0;
  
  /** Whether crypto buildings have power - no power = 0 yield */
  private hasPower: boolean = true;
  
  /** Whether crypto buildings have water - no water = faster decay */
  private hasWater: boolean = true;
  
  /** City happiness (0-100) - affects crypto effectiveness */
  private cityHappiness: number = 50;
  
  /** Yield generated in the last tick (for tax calculation) */
  private lastTickYield: number = 0;
  
  // ---------------------------------------------------------------------------
  // PRESTIGE SYSTEM INTEGRATION (Issue #45)
  // ---------------------------------------------------------------------------
  
  /** Prestige yield multiplier - bonus from prestige purchases */
  private prestigeYieldMultiplier: number = 1.0;
  
  /** Prestige rug resistance - reduces rug pull losses */
  private prestigeRugResistance: number = 0;
  
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
  
  // ---------------------------------------------------------------------------
  // DISASTER SYSTEM INTEGRATION (Issue #67)
  // ---------------------------------------------------------------------------
  
  /** Disaster manager instance */
  private disasterManager: DisasterManager;
  
  /** Current game tick for disaster tracking */
  private currentGameTick: number = 0;
  
  /** Listeners for disaster events */
  private disasterListeners: Set<(disaster: ActiveDisaster, isStarting: boolean) => void> = new Set();
  
  // ---------------------------------------------------------------------------
  // ORDINANCES SYSTEM INTEGRATION (Issue #69)
  // ---------------------------------------------------------------------------
  
  /** Ordinance manager instance */
  private ordinanceManager: import('../../../lib/ordinances').OrdinanceManager | null = null;
  
  constructor(initialState?: Partial<CryptoEconomyState>, disasterMgr?: DisasterManager) {
    this.disasterManager = disasterMgr || defaultDisasterManager;
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
      logger.warn(`[CryptoEconomyManager] Unknown building: ${buildingId}`);
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
    let sentimentImmuneYieldRate = 0; // Issue #62: Stablecoin yields unaffected by sentiment
    let totalTVL = 0;
    let buildingCount = 0;
    
    // Calculate base yields from all buildings
    for (const placed of this.placedBuildings.values()) {
      const def = getCryptoBuilding(placed.buildingId);
      if (!def?.crypto?.effects) continue;
      
      buildingCount++;
      
      // Skip yield calculation for decaying buildings (bankruptcy effect)
      if (this.state.decayingBuildings.includes(placed.id)) {
        // Still count for TVL but no yield
        const tvlMultiplier = CRYPTO_TIER_MULTIPLIERS[def.crypto.tier];
        totalTVL += ECONOMY_CONFIG.TVL_PER_BUILDING_BASE * tvlMultiplier * 0.5; // Reduced TVL
        continue;
      }
      
      // ==== MONEY SINKS (Issue #54) ====
      // Skip yield calculation for damaged buildings (rug pull effect)
      if (placed.isDamaged) {
        // Damaged buildings produce 0 yield until repaired
        const tvlMultiplier = CRYPTO_TIER_MULTIPLIERS[def.crypto.tier];
        totalTVL += ECONOMY_CONFIG.TVL_PER_BUILDING_BASE * tvlMultiplier * 0.25; // Much reduced TVL
        continue;
      }
      // ==== END MONEY SINKS ====
      
      const effects = def.crypto.effects;
      const tierMultiplier = CRYPTO_TIER_MULTIPLIERS[def.crypto.tier];
      
      // Base yield from building
      let buildingYield = (effects.yieldRate || 0) * tierMultiplier;
      
      // ==== MONEY SINKS (Issue #54) ====
      // Apply upgrade bonus to yield
      const upgradeBonus = ECONOMY_CONFIG.UPGRADES.LEVEL_YIELD_BONUS[placed.upgradeLevel || 1];
      buildingYield *= (1 + upgradeBonus);
      // ==== END MONEY SINKS ====
      
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
      
      // ==== PORTFOLIO BALANCING (Issue #62) ====
      // Track sentiment-immune buildings (stablecoins) separately
      if (effects.sentimentImmune) {
        sentimentImmuneYieldRate += buildingYield;
      } else {
        totalYieldRate += buildingYield;
      }
      // ==== END PORTFOLIO BALANCING ====
      
      // TVL contribution based on tier
      const tvlMultiplier = CRYPTO_TIER_MULTIPLIERS[def.crypto.tier];
      totalTVL += ECONOMY_CONFIG.TVL_PER_BUILDING_BASE * tvlMultiplier;
    }
    
    // Apply sentiment modifier to yield (NOT to sentiment-immune buildings)
    const sentimentMultiplier = this.getSentimentMultiplier();
    // Sentiment-affected yield + sentiment-immune yield (no multiplier)
    let adjustedYield = (totalYieldRate * sentimentMultiplier) + sentimentImmuneYieldRate;
    
    // ==== GLOBAL REAL YIELD ADJUSTMENT ====
    // Apply global yield multiplier from real DeFi data
    if (this.realDataEnabled && this.blendedData?.yields.hasRealData) {
      adjustedYield *= this.blendedData.yields.globalMultiplier;
    }
    // ==== END GLOBAL REAL YIELD ADJUSTMENT ====
    
    // ==== CITY INTEGRATION (Issue #44) ====
    // Apply population bonus (more citizens = more users = better yields)
    const populationMultiplier = this.getPopulationMultiplier();
    adjustedYield *= populationMultiplier;
    
    // Apply service multiplier (power/happiness affect yields)
    const serviceMultiplier = this.getServiceMultiplier();
    adjustedYield *= serviceMultiplier;
    // ==== END CITY INTEGRATION ====
    
    // ==== PRESTIGE SYSTEM (Issue #45) ====
    // Apply prestige yield multiplier from purchased bonuses
    adjustedYield *= this.prestigeYieldMultiplier;
    // ==== END PRESTIGE SYSTEM ====
    
    // ==== INSTITUTION STABILITY BONUS (Issue #70) ====
    // Apply diversity bonus when player has 5+ institution buildings
    const institutionStabilityBonus = this.getInstitutionStabilityBonus();
    adjustedYield *= (1 + institutionStabilityBonus);
    // ==== END INSTITUTION STABILITY BONUS ====
    
    // ==== PORTFOLIO BALANCING (Issue #62) ====
    // Apply portfolio diversity bonus from spreading across chains/tiers
    const portfolioDiversityBonus = this.getPortfolioDiversityBonus();
    adjustedYield *= (1 + portfolioDiversityBonus);
    // ==== END PORTFOLIO BALANCING ====
    
    // ==== MONEY SINKS (Issue #54) ====
    // Apply marketing service funding bonus to yields
    const marketingBonus = this.getMarketingYieldBonus();
    adjustedYield *= (1 + marketingBonus);
    
    // ==== DISASTER SYSTEM (Issue #67) ====
    // Apply disaster yield multiplier (e.g., Market Crash = 0.5x, Bull Run = 2.0x)
    const disasterYieldMultiplier = this.disasterManager.getYieldMultiplier();
    adjustedYield *= disasterYieldMultiplier;
    
    // Apply disaster cost multiplier for maintenance
    const disasterCostMultiplier = this.disasterManager.getCostMultiplier();
    // ==== END DISASTER SYSTEM ====
    
    // ==== ORDINANCES SYSTEM (Issue #69) ====
    // Apply ordinance yield modifier
    const ordinanceYieldModifier = this.getOrdinanceYieldModifier();
    adjustedYield *= (1 + ordinanceYieldModifier);
    
    // Get ordinance maintenance modifier
    const ordinanceMaintenanceModifier = this.getOrdinanceMaintenanceModifier();
    // ==== END ORDINANCES SYSTEM ====
    
    // Calculate daily maintenance costs (apply ordinance modifier)
    const dailyMaintenanceCost = this.calculateMaintenanceCosts() * disasterCostMultiplier * (1 + ordinanceMaintenanceModifier);
    
    // Calculate daily service funding costs
    const dailyServiceCost = this.calculateServiceCosts();
    
    // ==== ORDINANCES SYSTEM (Issue #69) ====
    // Calculate daily ordinance costs
    const dailyOrdinanceCost = this.getOrdinanceDailyCost();
    // ==== END ORDINANCES SYSTEM ====
    // ==== END MONEY SINKS ====
    
    // Update state
    this.state = {
      ...this.state,
      dailyYield: adjustedYield,
      tvl: totalTVL,
      buildingCount,
      lastUpdate: Date.now(),
      dailyMaintenanceCost,
      dailyServiceCost,
      dailyOrdinanceCost,
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
   * Respects game speed setting: yields are scaled by speed multiplier
   */
  tick(): void {
    // Skip tick processing when game is paused
    const speedMultiplier = CryptoEconomyManager.SPEED_MULTIPLIERS[this.gameSpeed];
    if (speedMultiplier === 0) {
      // Still update lastUpdate to prevent time drift when unpaused
      this.state = { ...this.state, lastUpdate: Date.now() };
      return;
    }
    
    const now = Date.now();
    const elapsed = now - this.state.lastUpdate;
    // Clamp elapsed time to max 2x the tick rate to prevent time drift exploits
    // when browser tab is backgrounded for extended periods
    const maxElapsed = ECONOMY_CONFIG.TICK_RATE * 2;
    const clampedElapsed = Math.min(elapsed, maxElapsed);
    const tickFraction = clampedElapsed / ECONOMY_CONFIG.TICK_RATE;
    
    // Calculate yield earned this tick (yield is per-day, tick is 5 seconds)
    // Scale by game speed multiplier
    const ticksPerDay = (24 * 60 * 60 * 1000) / ECONOMY_CONFIG.TICK_RATE;
    const yieldThisTick = (this.state.dailyYield / ticksPerDay) * tickFraction * speedMultiplier;
    
    // ==== MONEY SINKS (Issue #54) ====
    // Calculate costs for this tick
    const maintenanceCostThisTick = (this.state.dailyMaintenanceCost / ticksPerDay) * tickFraction * speedMultiplier;
    const serviceCostThisTick = (this.state.dailyServiceCost / ticksPerDay) * tickFraction * speedMultiplier;
    
    // ==== ORDINANCES SYSTEM (Issue #69) ====
    // Calculate ordinance costs for this tick
    const ordinanceCostThisTick = (this.state.dailyOrdinanceCost / ticksPerDay) * tickFraction * speedMultiplier;
    // ==== END ORDINANCES SYSTEM ====
    
    const totalCostsThisTick = maintenanceCostThisTick + serviceCostThisTick + ordinanceCostThisTick;
    
    // Net change: yield - costs
    const netChangeThisTick = yieldThisTick - totalCostsThisTick;
    // ==== END MONEY SINKS ====
    
    // Track last tick yield for city tax calculation (Issue #44)
    this.lastTickYield = yieldThisTick;
    
    // ==== ACTIVE MANAGEMENT (Issue #55) ====
    // Handle yield based on harvest mode
    const harvestMode = this.state.marketTiming.harvestMode;
    let treasuryChange = 0;
    let pendingYieldsChange = 0;
    
    if (harvestMode === 'auto') {
      // Auto mode: yields go directly to treasury (existing behavior)
      treasuryChange = netChangeThisTick;
    } else {
      // Manual or locked mode: yields accumulate as pending, costs still apply
      pendingYieldsChange = yieldThisTick;
      treasuryChange = -totalCostsThisTick; // Still pay costs
    }
    // ==== END ACTIVE MANAGEMENT ====
    
    // Update treasury and accumulated yield
    this.state = {
      ...this.state,
      treasury: Math.max(0, this.state.treasury + treasuryChange),
      totalYield: this.state.totalYield + yieldThisTick,
      lastUpdate: now,
      tickCount: this.state.tickCount + 1,
      // Active management state update
      marketTiming: {
        ...this.state.marketTiming,
        pendingYields: this.state.marketTiming.pendingYields + pendingYieldsChange,
      },
    };
    
    // Accumulate yield per building (guard against division by zero)
    const buildingCount = this.placedBuildings.size;
    if (buildingCount > 0) {
      const yieldPerBuilding = yieldThisTick / buildingCount;
      for (const placed of this.placedBuildings.values()) {
        placed.yieldAccumulated += yieldPerBuilding;
      }
    }
    
    // Random sentiment fluctuation (also scaled by speed)
    this.fluctuateSentiment(speedMultiplier);
    
    // Check for bankruptcy conditions
    this.checkBankruptcy();
    
    // ==== DISASTER SYSTEM (Issue #67) ====
    // Process disaster tick and apply effects
    this.currentGameTick++;
    this.processDisasterTick();
    // ==== END DISASTER SYSTEM ====
    
    // ==== ACTIVE MANAGEMENT (Issue #55) ====
    // Process trade opportunities and yield boosts
    this.processTradeOpportunities();
    this.processYieldBoosts();
    // ==== END ACTIVE MANAGEMENT ====
    
    this.notifyListeners();
  }
  
  /**
   * Process disaster tick - check for new disasters and apply effects
   */
  private processDisasterTick(): void {
    const buildingIds = Array.from(this.placedBuildings.keys());
    
    const effects = this.disasterManager.tick(this.currentGameTick, buildingIds);
    
    // Apply treasury changes from disasters
    if (effects.treasuryChange !== 0) {
      this.state.treasury = Math.max(0, this.state.treasury + effects.treasuryChange);
    }
    
    // Apply percentage treasury damage from active disasters
    for (const active of this.disasterManager.getActiveDisasters()) {
      if (active.disaster.effect.treasuryDamagePercent && active.startTick === this.currentGameTick) {
        // Only apply on first tick of disaster
        const damage = Math.floor(this.state.treasury * active.disaster.effect.treasuryDamagePercent);
        this.state.treasury = Math.max(0, this.state.treasury - damage);
        logger.info(`[CryptoEconomy] Disaster treasury damage: -$${damage}`);
      }
    }
    
    // Rug buildings from disasters
    for (const buildingId of effects.buildingsToRug) {
      this.damageBuilding(buildingId);
      logger.info(`[CryptoEconomy] Building rugged by disaster: ${buildingId}`);
    }
    
    // Release delayed yields
    if (effects.delayedYieldsToRelease > 0) {
      this.state.treasury += effects.delayedYieldsToRelease;
      logger.info(`[CryptoEconomy] Delayed yields released: +$${effects.delayedYieldsToRelease}`);
    }
    
    // Apply sentiment impact from active disasters
    const sentimentImpact = this.disasterManager.getSentimentImpact();
    if (sentimentImpact !== 0) {
      // Apply gradual sentiment shift based on active disasters
      const targetSentiment = Math.max(0, Math.min(100, 50 + sentimentImpact));
      const currentSentiment = this.state.marketSentiment;
      // Move toward target by 10% per tick
      this.state.marketSentiment = currentSentiment + (targetSentiment - currentSentiment) * 0.1;
    }
  }
  
  /**
   * Check and handle bankruptcy conditions
   * Bankruptcy triggers when treasury is 0 for extended period
   * Buildings start decaying (producing 0 yield) until treasury recovers
   */
  private checkBankruptcy(): void {
    const BANKRUPTCY_THRESHOLD_TICKS = 50; // ~4 minutes at normal speed
    const DECAY_CHANCE_PER_TICK = 0.05; // 5% chance per tick to decay a building
    
    if (this.state.treasury <= 0) {
      // Increment bankruptcy counter
      this.state.bankruptcyCounter++;
      
      // Check if we've crossed into bankruptcy
      if (this.state.bankruptcyCounter >= BANKRUPTCY_THRESHOLD_TICKS && !this.state.isBankrupt) {
        this.state.isBankrupt = true;
        logger.info('[CryptoEconomy] Bankruptcy triggered! Buildings will start decaying.');
      }
      
      // If bankrupt, randomly decay buildings (they produce 0 yield)
      if (this.state.isBankrupt) {
        const nonDecayingBuildings = Array.from(this.placedBuildings.keys())
          .filter(id => !this.state.decayingBuildings.includes(id));
        
        if (nonDecayingBuildings.length > 0 && Math.random() < DECAY_CHANCE_PER_TICK) {
          // Randomly pick a building to start decaying
          const randomIndex = Math.floor(Math.random() * nonDecayingBuildings.length);
          const buildingToDecay = nonDecayingBuildings[randomIndex];
          this.state.decayingBuildings.push(buildingToDecay);
          logger.info(`[CryptoEconomy] Building ${buildingToDecay} is now decaying due to bankruptcy`);
        }
      }
    } else {
      // Treasury is positive - reset bankruptcy counter
      if (this.state.bankruptcyCounter > 0) {
        this.state.bankruptcyCounter = 0;
      }
      
      // If we were bankrupt but now have funds, start recovering
      if (this.state.isBankrupt && this.state.treasury > 10000) {
        this.state.isBankrupt = false;
        // Decaying buildings stay decayed until repaired
        logger.info('[CryptoEconomy] Bankruptcy ended. Repair buildings to restore yields.');
      }
    }
  }
  
  /**
   * Repair a decaying building (costs money)
   * @param buildingId - ID of building to repair
   * @returns true if repair successful
   */
  repairBuilding(buildingId: string): boolean {
    const REPAIR_COST = 5000; // $5k to repair
    
    if (!this.state.decayingBuildings.includes(buildingId)) {
      return false; // Not decaying
    }
    
    if (!this.canAfford(REPAIR_COST)) {
      return false; // Can't afford repair
    }
    
    // Deduct repair cost and remove from decaying list
    this.state.treasury -= REPAIR_COST;
    this.state.decayingBuildings = this.state.decayingBuildings.filter(id => id !== buildingId);
    this.recalculateEconomy();
    return true;
  }
  
  /**
   * Check if a building is currently decaying
   */
  isBuildingDecaying(buildingId: string): boolean {
    return this.state.decayingBuildings.includes(buildingId);
  }
  
  /**
   * Apply random sentiment fluctuation
   * When real data is enabled, we fluctuate the simulated base and blend
   * When disabled, we fluctuate the actual sentiment directly
   * @param speedMultiplier - Scale fluctuation intensity by game speed
   */
  private fluctuateSentiment(speedMultiplier: number = 1): void {
    // Small random walk with mean reversion to 50, scaled by game speed
    const current = this.realDataEnabled ? this.simulatedSentiment : this.state.marketSentiment;
    const meanReversion = (50 - current) * 0.01 * speedMultiplier;
    const randomWalk = (Math.random() - 0.5) * 4 * Math.sqrt(speedMultiplier);
    
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
  
  /**
   * Set game speed for economy simulation
   * The crypto economy respects the game's pause/speed settings
   * @param speed - 0 = paused, 1 = normal, 2 = fast, 3 = very fast
   */
  setGameSpeed(speed: 0 | 1 | 2 | 3): void {
    this.gameSpeed = speed;
  }
  
  /**
   * Get current game speed
   */
  getGameSpeed(): 0 | 1 | 2 | 3 {
    return this.gameSpeed;
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
        // Treasury boost from single airdrop (reduced from $10k to $5k for balance)
        this.state.treasury += 5000 * magnitude;
        break;
      case 'airdrop_season':
        // Larger treasury boost from multiple airdrops (reduced from $25k to $12k)
        this.state.treasury += 12000 * magnitude;
        this.state.marketSentiment = Math.min(100, this.state.marketSentiment + 10);
        break;
      case 'rug_pull':
        // Treasury and sentiment hit
        // Scale rug losses to 10% of treasury (minimum $5,000)
        // This makes late-game rug pulls actually meaningful
        // Apply prestige rug resistance to reduce losses (Issue #45)
        // Apply security service rug reduction (Issue #54)
        const securityReduction = this.getSecurityRugReduction();
        const totalRugResistance = Math.max(0, this.prestigeRugResistance + securityReduction);
        const rugResistanceMultiplier = 1 - totalRugResistance;
        const rugLoss = Math.max(5000, Math.floor(this.state.treasury * 0.10)) * magnitude * rugResistanceMultiplier;
        this.state.treasury = Math.max(0, this.state.treasury - rugLoss);
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 15);
        
        // ==== MONEY SINKS (Issue #54) ====
        // Damage a random building - it needs repair to produce yield again
        const healthyBuildings = Array.from(this.placedBuildings.values())
          .filter(b => !b.isDamaged);
        if (healthyBuildings.length > 0) {
          const randomIndex = Math.floor(Math.random() * healthyBuildings.length);
          this.damageBuilding(healthyBuildings[randomIndex].id);
        }
        // ==== END MONEY SINKS ====
        
        // Issue #70: Cascading failure mechanic - adjacent degen buildings may also rug
        if (BALANCE_CONFIG.CONTAGION_ENABLED) {
          this.applyContagion();
        }
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
        logger.warn(`[CryptoEconomyManager] Unknown event type: ${eventType}`);
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
  // CITY INTEGRATION (Issue #44)
  // ---------------------------------------------------------------------------
  
  /**
   * Set the city population for yield calculation
   * More citizens = more users = better yields (up to +50% at 50k pop)
   * @param population - Current city population
   */
  setPopulation(population: number): void {
    this.cityPopulation = Math.max(0, population);
    this.recalculateEconomy();
  }
  
  /**
   * Get the current city population
   */
  getPopulation(): number {
    return this.cityPopulation;
  }
  
  /**
   * Set whether power is available for crypto buildings
   * No power = crypto buildings produce 0 yield
   * @param hasPower - Whether power is available
   */
  setPowerAvailable(hasPower: boolean): void {
    this.hasPower = hasPower;
    this.recalculateEconomy();
  }
  
  /**
   * Check if power is available
   */
  isPowerAvailable(): boolean {
    return this.hasPower;
  }
  
  /**
   * Set whether water is available for crypto buildings
   * No water = crypto buildings decay faster
   * @param hasWater - Whether water is available
   */
  setWaterAvailable(hasWater: boolean): void {
    this.hasWater = hasWater;
    this.recalculateEconomy();
  }
  
  /**
   * Check if water is available
   */
  isWaterAvailable(): boolean {
    return this.hasWater;
  }
  
  /**
   * Set city happiness level (affects crypto effectiveness)
   * Low happiness = reduced crypto effectiveness
   * @param happiness - City happiness (0-100)
   */
  setHappiness(happiness: number): void {
    this.cityHappiness = Math.max(0, Math.min(100, happiness));
    this.recalculateEconomy();
  }
  
  /**
   * Get current city happiness
   */
  getHappiness(): number {
    return this.cityHappiness;
  }
  
  /**
   * Get the yield generated in the last tick
   * Used by the city simulation to calculate crypto tax revenue
   * @returns Yield amount from last tick
   */
  getLastTickYield(): number {
    return this.lastTickYield;
  }
  
  /**
   * Calculate population bonus multiplier for yields
   * More citizens = more users = better yields
   * @returns Multiplier (1.0 to 1.5)
   */
  getPopulationMultiplier(): number {
    // Up to +50% bonus at 50,000 population
    return 1 + Math.min(this.cityPopulation / 50000, 0.5);
  }
  
  /**
   * Calculate service penalty multiplier for yields
   * No power = 0 yield, low happiness = reduced effectiveness
   * @returns Multiplier (0 to 1.0)
   */
  getServiceMultiplier(): number {
    // No power = 0 yield
    if (!this.hasPower) {
      return 0;
    }
    
    // Happiness affects effectiveness (50-100 happiness = 0.75-1.0 multiplier)
    // Below 50 happiness: linear decrease from 0.75 to 0.5
    const happinessMultiplier = this.cityHappiness >= 50
      ? 0.75 + (this.cityHappiness - 50) / 200  // 50-100 → 0.75-1.0
      : 0.5 + this.cityHappiness / 200;          // 0-50 → 0.5-0.75
    
    return happinessMultiplier;
  }
  
  /**
   * Get all city integration stats for UI display
   */
  getCityIntegrationStats(): {
    population: number;
    populationBonus: number;
    hasPower: boolean;
    hasWater: boolean;
    happiness: number;
    serviceMultiplier: number;
    effectiveYieldMultiplier: number;
  } {
    const populationBonus = this.getPopulationMultiplier();
    const serviceMultiplier = this.getServiceMultiplier();
    
    return {
      population: this.cityPopulation,
      populationBonus,
      hasPower: this.hasPower,
      hasWater: this.hasWater,
      happiness: this.cityHappiness,
      serviceMultiplier,
      effectiveYieldMultiplier: populationBonus * serviceMultiplier,
    };
  }
  
  // ---------------------------------------------------------------------------
  // PRESTIGE SYSTEM (Issue #45)
  // ---------------------------------------------------------------------------
  
  /**
   * Set the prestige yield multiplier (from purchased bonuses)
   * @param multiplier - Yield multiplier (e.g., 1.05 for +5%)
   */
  setPrestigeYieldMultiplier(multiplier: number): void {
    this.prestigeYieldMultiplier = Math.max(1.0, multiplier);
    this.recalculateEconomy();
  }
  
  /**
   * Get current prestige yield multiplier
   */
  getPrestigeYieldMultiplier(): number {
    return this.prestigeYieldMultiplier;
  }
  
  /**
   * Set the prestige rug resistance (from purchased bonuses)
   * @param resistance - Resistance factor (0-0.5, e.g., 0.1 for -10% losses)
   */
  setPrestigeRugResistance(resistance: number): void {
    this.prestigeRugResistance = Math.max(0, Math.min(0.5, resistance));
  }
  
  /**
   * Get current prestige rug resistance
   */
  getPrestigeRugResistance(): number {
    return this.prestigeRugResistance;
  }
  
  // ---------------------------------------------------------------------------
  // ORDINANCES SYSTEM (Issue #69)
  // ---------------------------------------------------------------------------
  
  /**
   * Set the ordinance manager instance
   * @param manager - OrdinanceManager instance
   */
  setOrdinanceManager(manager: import('../../../lib/ordinances').OrdinanceManager): void {
    this.ordinanceManager = manager;
    this.recalculateEconomy();
  }
  
  /**
   * Get the ordinance manager instance
   */
  getOrdinanceManager(): import('../../../lib/ordinances').OrdinanceManager | null {
    return this.ordinanceManager;
  }
  
  /**
   * Get yield modifier from active ordinances
   * @returns Multiplier (e.g., 0.1 for +10%)
   */
  getOrdinanceYieldModifier(): number {
    if (!this.ordinanceManager) return 0;
    const effects = this.ordinanceManager.getActiveEffects();
    return effects.yieldModifier || 0;
  }
  
  /**
   * Get risk modifier from active ordinances
   * @returns Modifier (e.g., -0.15 for -15% rug risk)
   */
  getOrdinanceRiskModifier(): number {
    if (!this.ordinanceManager) return 0;
    const effects = this.ordinanceManager.getActiveEffects();
    return effects.riskModifier || 0;
  }
  
  /**
   * Get maintenance modifier from active ordinances
   * @returns Modifier (e.g., -0.3 for -30% maintenance)
   */
  getOrdinanceMaintenanceModifier(): number {
    if (!this.ordinanceManager) return 0;
    const effects = this.ordinanceManager.getActiveEffects();
    return effects.maintenanceModifier || 0;
  }
  
  /**
   * Get daily cost from active ordinances
   */
  getOrdinanceDailyCost(): number {
    if (!this.ordinanceManager) return 0;
    return this.ordinanceManager.getDailyCost();
  }
  
  /**
   * Check if buildings should be auto-insured (from ordinance)
   */
  shouldAutoInsureBuildings(): boolean {
    if (!this.ordinanceManager) return false;
    const effects = this.ordinanceManager.getActiveEffects();
    return effects.autoInsure === true;
  }
  
  /**
   * Check if degen buildings require approval (from ordinance)
   */
  requiresDegenApproval(): boolean {
    if (!this.ordinanceManager) return false;
    const effects = this.ordinanceManager.getActiveEffects();
    return effects.requireApproval === true;
  }
  
  /**
   * Get protection bonus from ordinances (for all buildings)
   */
  getOrdinanceProtectionBonus(): number {
    if (!this.ordinanceManager) return 0;
    const effects = this.ordinanceManager.getActiveEffects();
    return effects.protectionBonus || 0;
  }
  
  /**
   * Get combined effects from all active ordinances
   */
  getOrdinanceEffects(): import('../../../lib/ordinances').OrdinanceEffect {
    if (!this.ordinanceManager) {
      return {
        yieldModifier: 0,
        riskModifier: 0,
        happinessModifier: 0,
        costModifier: 0,
        maintenanceModifier: 0,
        populationGrowth: 0,
      };
    }
    return this.ordinanceManager.getActiveEffects();
  }
  
  // ---------------------------------------------------------------------------
  // DEGEN BALANCE (Issue #70)
  // ---------------------------------------------------------------------------
  
  /**
   * Apply cascading failure (contagion) to adjacent degen buildings
   * When a degen building rugs, there's a chance adjacent degen buildings also rug
   * Institution buildings are immune to contagion
   */
  private applyContagion(): void {
    if (!BALANCE_CONFIG.CONTAGION_ENABLED) return;
    
    const contagionTargets: PlacedCryptoBuilding[] = [];
    
    // Find all degen buildings that could be affected
    for (const building of this.placedBuildings.values()) {
      const def = getCryptoBuilding(building.buildingId);
      if (!def?.crypto?.tier) continue;
      
      // Skip buildings immune to contagion
      if (isContagionImmune(def.crypto.tier)) continue;
      
      // Only degen tier buildings can be affected by contagion
      if (def.crypto.tier !== 'degen') continue;
      
      // Check if this building is adjacent to another degen building
      // (within CONTAGION_RADIUS tiles)
      const hasDegenNeighbor = this.hasAdjacentDegenBuilding(building, BALANCE_CONFIG.CONTAGION_RADIUS);
      
      if (hasDegenNeighbor) {
        contagionTargets.push(building);
      }
    }
    
    // Roll for contagion on each target
    for (const target of contagionTargets) {
      if (Math.random() < BALANCE_CONFIG.CONTAGION_CHANCE) {
        // This building is affected by contagion!
        // Apply additional treasury loss scaled by the building's rug risk
        const def = getCryptoBuilding(target.buildingId);
        const rugRisk = def?.crypto?.effects?.rugRisk || 0.05;
        const contagionLoss = Math.floor(this.state.treasury * rugRisk * 0.5);
        
        this.state.treasury = Math.max(0, this.state.treasury - contagionLoss);
        this.state.marketSentiment = Math.max(0, this.state.marketSentiment - 5);
        
        logger.info(`[CryptoEconomy] Contagion hit ${target.buildingId}! Lost $${contagionLoss}`);
      }
    }
  }
  
  /**
   * Check if a building has an adjacent degen building within radius
   */
  private hasAdjacentDegenBuilding(building: PlacedCryptoBuilding, radius: number): boolean {
    for (const other of this.placedBuildings.values()) {
      if (other.id === building.id) continue;
      
      const otherDef = getCryptoBuilding(other.buildingId);
      if (!otherDef?.crypto?.tier || otherDef.crypto.tier !== 'degen') continue;
      
      // Calculate Chebyshev distance (diagonal = 1)
      const dx = Math.abs(other.gridX - building.gridX);
      const dy = Math.abs(other.gridY - building.gridY);
      const distance = Math.max(dx, dy);
      
      if (distance <= radius) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get the institution stability bonus (0 to DIVERSITY_BONUS)
   * Returns DIVERSITY_BONUS if player has >= INSTITUTION_STABILITY_THRESHOLD institution buildings
   * Otherwise returns 0
   */
  getInstitutionStabilityBonus(): number {
    let institutionCount = 0;
    
    for (const building of this.placedBuildings.values()) {
      const def = getCryptoBuilding(building.buildingId);
      if (def?.crypto?.tier === 'institution') {
        institutionCount++;
      }
    }
    
    if (institutionCount >= BALANCE_CONFIG.INSTITUTION_STABILITY_THRESHOLD) {
      return BALANCE_CONFIG.DIVERSITY_BONUS;
    }
    
    return 0;
  }
  
  /**
   * Get count of institution buildings
   */
  getInstitutionCount(): number {
    let count = 0;
    for (const building of this.placedBuildings.values()) {
      const def = getCryptoBuilding(building.buildingId);
      if (def?.crypto?.tier === 'institution') {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Check if player has the institution stability bonus active
   */
  hasStabilityBonus(): boolean {
    return this.getInstitutionCount() >= BALANCE_CONFIG.INSTITUTION_STABILITY_THRESHOLD;
  }
  
  // ---------------------------------------------------------------------------
  // PORTFOLIO BALANCING (Issue #62)
  // ---------------------------------------------------------------------------
  
  /**
   * Get the portfolio diversity bonus from spreading across chains/tiers
   * Uses the calculateDiversityBonus function from portfolio.ts
   */
  getPortfolioDiversityBonus(): number {
    const buildings = this.getPlacedBuildings();
    if (buildings.length === 0) return 0;
    
    // Use dynamic import pattern to avoid circular dependencies
    const portfolioModule = require('../../../lib/portfolio');
    const bonus = portfolioModule.calculateDiversityBonus(buildings);
    return bonus.totalBonus;
  }
  
  /**
   * Get full portfolio analysis for UI display
   */
  getPortfolioAnalysis(): {
    chainDiversity: number;
    tierBalance: number;
    riskExposure: number;
    diversityBonus: number;
    chainCount: number;
    tierCount: number;
    isBalanced: boolean;
  } {
    const buildings = this.getPlacedBuildings();
    if (buildings.length === 0) {
      return {
        chainDiversity: 0,
        tierBalance: 0,
        riskExposure: 0,
        diversityBonus: 0,
        chainCount: 0,
        tierCount: 0,
        isBalanced: true,
      };
    }
    
    // Use dynamic import pattern to avoid circular dependencies
    const portfolioModule = require('../../../lib/portfolio');
    const portfolio = portfolioModule.analyzePortfolio(buildings);
    const bonus = portfolioModule.calculateDiversityBonus(buildings);
    
    return {
      chainDiversity: portfolio.chainDiversity,
      tierBalance: portfolio.tierBalance,
      riskExposure: portfolio.riskExposure,
      diversityBonus: bonus.totalBonus,
      chainCount: bonus.chainCount,
      tierCount: bonus.tierCount,
      isBalanced: bonus.isBalanced,
    };
  }
  
  /**
   * Get comparative risk info for a building (for tooltip display)
   */
  getBuildingRiskInfo(buildingId: string): {
    rugRisk: number;
    comparativeRisk: number;
    riskLabel: string;
    hasContagionRisk: boolean;
  } | null {
    const def = getCryptoBuilding(buildingId);
    if (!def?.crypto?.effects) return null;
    
    const rugRisk = def.crypto.effects.rugRisk;
    const comparativeRisk = getComparativeRisk(rugRisk);
    const riskLabel = formatComparativeRisk(rugRisk);
    const hasContagionRisk = def.crypto.tier === 'degen' && BALANCE_CONFIG.CONTAGION_ENABLED;
    
    return {
      rugRisk,
      comparativeRisk,
      riskLabel,
      hasContagionRisk,
    };
  }
  
  // ---------------------------------------------------------------------------
  // GAME OBJECTIVES (Issues #29, #43)
  // ---------------------------------------------------------------------------
  
  /**
   * Low happiness threshold for lose condition
   */
  private static readonly LOW_HAPPINESS_THRESHOLD = 20;
  
  /**
   * Increment game days counter
   * Call this when a new game day starts
   */
  incrementGameDay(): void {
    this.state = {
      ...this.state,
      gameDays: this.state.gameDays + 1,
    };
    this.notifyListeners();
  }
  
  /**
   * Get current game days
   */
  getGameDays(): number {
    return this.state.gameDays;
  }
  
  /**
   * Update low happiness tracking
   * Call this every tick with the current city happiness
   * @param happiness - Current city happiness (0-100)
   */
  updateHappinessTracking(happiness: number): void {
    if (happiness < CryptoEconomyManager.LOW_HAPPINESS_THRESHOLD) {
      this.state = {
        ...this.state,
        lowHappinessCounter: this.state.lowHappinessCounter + 1,
      };
    } else {
      // Reset counter when happiness recovers
      if (this.state.lowHappinessCounter > 0) {
        this.state = {
          ...this.state,
          lowHappinessCounter: 0,
        };
      }
    }
  }
  
  /**
   * Get low happiness counter
   */
  getLowHappinessCounter(): number {
    return this.state.lowHappinessCounter;
  }
  
  /**
   * Update had crypto buildings tracking
   * Call when placing a building
   */
  updateHadCryptoBuildings(): void {
    if (!this.state.hadCryptoBuildings && this.state.buildingCount > 0) {
      this.state = {
        ...this.state,
        hadCryptoBuildings: true,
      };
    }
  }
  
  /**
   * Check if player had crypto buildings (for rugged out condition)
   */
  getHadCryptoBuildings(): boolean {
    return this.state.hadCryptoBuildings;
  }
  
  /**
   * Reset game objectives tracking (for new game)
   */
  resetObjectivesTracking(): void {
    this.state = {
      ...this.state,
      gameDays: 0,
      lowHappinessCounter: 0,
      hadCryptoBuildings: false,
    };
    this.notifyListeners();
  }
  
  // ---------------------------------------------------------------------------
  // MONEY SINKS (Issue #54)
  // ---------------------------------------------------------------------------
  
  /**
   * Calculate total daily maintenance costs for all buildings
   * Maintenance = baseCost * tierMultiplier * (1 + scalingFactor * buildingCount / 10)
   */
  calculateMaintenanceCosts(): number {
    let totalMaintenance = 0;
    const { BASE_COST_PER_BUILDING, TIER_MULTIPLIERS, SCALING_PER_10_BUILDINGS } = ECONOMY_CONFIG.MAINTENANCE;
    const buildingCount = this.placedBuildings.size;
    const scalingMultiplier = 1 + (SCALING_PER_10_BUILDINGS * buildingCount / 10);
    
    for (const placed of this.placedBuildings.values()) {
      // Skip damaged buildings - they don't cost maintenance but also don't produce
      if (placed.isDamaged) continue;
      
      const def = getCryptoBuilding(placed.buildingId);
      if (!def?.crypto?.tier) continue;
      
      const tierMultiplier = TIER_MULTIPLIERS[def.crypto.tier] || 1.0;
      const buildingMaintenance = BASE_COST_PER_BUILDING * tierMultiplier * scalingMultiplier;
      totalMaintenance += buildingMaintenance;
    }
    
    return totalMaintenance;
  }
  
  /**
   * Calculate total daily service funding costs
   * Each service costs (funding / 100) * BASE_COST_AT_50_PERCENT * 2 per day
   * At 50% funding = BASE_COST_AT_50_PERCENT, at 100% = 2x that
   */
  calculateServiceCosts(): number {
    const { BASE_COST_AT_50_PERCENT, MAX_FUNDING } = ECONOMY_CONFIG.SERVICES;
    const { security, marketing, research } = this.state.serviceFunding;
    
    // Cost scales linearly: at 0% = $0, at 50% = $50, at 100% = $100
    const securityCost = (security / MAX_FUNDING) * BASE_COST_AT_50_PERCENT * 2;
    const marketingCost = (marketing / MAX_FUNDING) * BASE_COST_AT_50_PERCENT * 2;
    const researchCost = (research / MAX_FUNDING) * BASE_COST_AT_50_PERCENT * 2;
    
    return securityCost + marketingCost + researchCost;
  }
  
  /**
   * Get marketing yield bonus based on funding level
   * Returns bonus multiplier (0 to MAX_YIELD_BONUS)
   */
  getMarketingYieldBonus(): number {
    const { MAX_FUNDING, MARKETING_MAX_YIELD_BONUS, LOW_FUNDING_THRESHOLD, LOW_FUNDING_PENALTY } = ECONOMY_CONFIG.SERVICES;
    const marketing = this.state.serviceFunding.marketing;
    
    if (marketing < LOW_FUNDING_THRESHOLD) {
      // Low funding = penalty (negative bonus)
      return -LOW_FUNDING_PENALTY * (1 - marketing / LOW_FUNDING_THRESHOLD);
    }
    
    // Linear bonus from 0 at 30% to max at 100%
    const effectiveFunding = (marketing - LOW_FUNDING_THRESHOLD) / (MAX_FUNDING - LOW_FUNDING_THRESHOLD);
    return MARKETING_MAX_YIELD_BONUS * effectiveFunding;
  }
  
  /**
   * Get security rug protection based on funding level
   * Returns reduction multiplier (0 to MAX_RUG_REDUCTION)
   */
  getSecurityRugReduction(): number {
    const { MAX_FUNDING, SECURITY_MAX_RUG_REDUCTION, LOW_FUNDING_THRESHOLD, LOW_FUNDING_PENALTY } = ECONOMY_CONFIG.SERVICES;
    const security = this.state.serviceFunding.security;
    
    if (security < LOW_FUNDING_THRESHOLD) {
      // Low funding = increased rug risk (return negative)
      return -LOW_FUNDING_PENALTY * (1 - security / LOW_FUNDING_THRESHOLD);
    }
    
    // Linear reduction from 0 at 30% to max at 100%
    const effectiveFunding = (security - LOW_FUNDING_THRESHOLD) / (MAX_FUNDING - LOW_FUNDING_THRESHOLD);
    return SECURITY_MAX_RUG_REDUCTION * effectiveFunding;
  }
  
  /**
   * Get research airdrop bonus based on funding level
   * Returns bonus multiplier (0 to MAX_AIRDROP_BONUS)
   */
  getResearchAirdropBonus(): number {
    const { MAX_FUNDING, RESEARCH_MAX_AIRDROP_BONUS, LOW_FUNDING_THRESHOLD, LOW_FUNDING_PENALTY } = ECONOMY_CONFIG.SERVICES;
    const research = this.state.serviceFunding.research;
    
    if (research < LOW_FUNDING_THRESHOLD) {
      // Low funding = reduced airdrops (negative bonus)
      return -LOW_FUNDING_PENALTY * (1 - research / LOW_FUNDING_THRESHOLD);
    }
    
    // Linear bonus from 0 at 30% to max at 100%
    const effectiveFunding = (research - LOW_FUNDING_THRESHOLD) / (MAX_FUNDING - LOW_FUNDING_THRESHOLD);
    return RESEARCH_MAX_AIRDROP_BONUS * effectiveFunding;
  }
  
  /**
   * Set service funding level
   * @param service - Which service to adjust
   * @param level - Funding level (0-100)
   */
  setServiceFunding(service: keyof ServiceFunding, level: number): void {
    const clampedLevel = Math.max(0, Math.min(100, level));
    this.state = {
      ...this.state,
      serviceFunding: {
        ...this.state.serviceFunding,
        [service]: clampedLevel,
      },
    };
    this.recalculateEconomy();
  }
  
  /**
   * Get current service funding levels
   */
  getServiceFunding(): ServiceFunding {
    return { ...this.state.serviceFunding };
  }
  
  /**
   * Get money sink stats for UI display
   */
  getMoneySinkStats(): {
    dailyMaintenance: number;
    dailyServiceCost: number;
    totalDailyCosts: number;
    netDailyYield: number;
    serviceFunding: ServiceFunding;
    marketingBonus: number;
    securityBonus: number;
    researchBonus: number;
    damagedBuildingsCount: number;
  } {
    const dailyMaintenance = this.state.dailyMaintenanceCost;
    const dailyServiceCost = this.state.dailyServiceCost;
    const totalDailyCosts = dailyMaintenance + dailyServiceCost;
    const netDailyYield = this.state.dailyYield - totalDailyCosts;
    
    return {
      dailyMaintenance,
      dailyServiceCost,
      totalDailyCosts,
      netDailyYield,
      serviceFunding: this.getServiceFunding(),
      marketingBonus: this.getMarketingYieldBonus(),
      securityBonus: this.getSecurityRugReduction(),
      researchBonus: this.getResearchAirdropBonus(),
      damagedBuildingsCount: this.state.damagedBuildings.length,
    };
  }
  
  // ---------------------------------------------------------------------------
  // EMERGENCY REPAIRS (Issue #54)
  // ---------------------------------------------------------------------------
  
  /**
   * Damage a building after a rug pull
   * Damaged buildings produce 0 yield until repaired
   * @param buildingId - Instance ID of building to damage
   */
  damageBuilding(buildingId: string): void {
    const building = this.placedBuildings.get(buildingId);
    if (!building || building.isDamaged) return;
    
    const def = getCryptoBuilding(building.buildingId);
    if (!def) return;
    
    // Mark building as damaged
    building.isDamaged = true;
    
    // Add to damaged buildings list
    const damagedEntry: DamagedBuilding = {
      id: building.id,
      buildingId: building.buildingId,
      originalCost: def.cost,
      damagedAt: Date.now(),
      gridX: building.gridX,
      gridY: building.gridY,
    };
    
    this.state = {
      ...this.state,
      damagedBuildings: [...this.state.damagedBuildings, damagedEntry],
    };
    
    this.recalculateEconomy();
    logger.info(`[CryptoEconomy] Building ${buildingId} damaged and needs repair`);
  }
  
  /**
   * Get repair cost for a damaged building
   * @param buildingId - Instance ID of damaged building
   * @returns Repair cost or 0 if not damaged
   */
  getRepairCost(buildingId: string): number {
    const damaged = this.state.damagedBuildings.find(d => d.id === buildingId);
    if (!damaged) return 0;
    
    return Math.floor(damaged.originalCost * ECONOMY_CONFIG.REPAIRS.COST_PERCENTAGE);
  }
  
  /**
   * Repair a damaged building
   * @param buildingId - Instance ID of building to repair
   * @returns true if repair successful
   */
  repairDamagedBuilding(buildingId: string): boolean {
    const building = this.placedBuildings.get(buildingId);
    if (!building || !building.isDamaged) return false;
    
    const repairCost = this.getRepairCost(buildingId);
    if (!this.canAfford(repairCost)) return false;
    
    // Deduct repair cost
    this.state.treasury -= repairCost;
    
    // Remove from damaged list
    this.state = {
      ...this.state,
      damagedBuildings: this.state.damagedBuildings.filter(d => d.id !== buildingId),
    };
    
    // Mark building as repaired
    building.isDamaged = false;
    
    this.recalculateEconomy();
    logger.info(`[CryptoEconomy] Building ${buildingId} repaired for $${repairCost}`);
    return true;
  }
  
  /**
   * Demolish a damaged building (free, removes building entirely)
   * @param buildingId - Instance ID of building to demolish
   * @returns true if demolition successful
   */
  demolishDamagedBuilding(buildingId: string): boolean {
    const building = this.placedBuildings.get(buildingId);
    if (!building || !building.isDamaged) return false;
    
    // Remove from damaged list
    this.state = {
      ...this.state,
      damagedBuildings: this.state.damagedBuildings.filter(d => d.id !== buildingId),
    };
    
    // Remove building
    this.placedBuildings.delete(buildingId);
    
    this.recalculateEconomy();
    logger.info(`[CryptoEconomy] Damaged building ${buildingId} demolished`);
    return true;
  }
  
  /**
   * Get list of damaged buildings
   */
  getDamagedBuildings(): DamagedBuilding[] {
    return [...this.state.damagedBuildings];
  }
  
  /**
   * Check if a building is damaged
   */
  isBuildingDamaged(buildingId: string): boolean {
    const building = this.placedBuildings.get(buildingId);
    return building?.isDamaged ?? false;
  }
  
  // ---------------------------------------------------------------------------
  // BUILDING UPGRADES (Issue #54)
  // ---------------------------------------------------------------------------
  
  /**
   * Get upgrade cost for a building to the next level
   * @param buildingId - Instance ID of building
   * @returns Upgrade cost or 0 if cannot upgrade
   */
  getUpgradeCost(buildingId: string): number {
    const building = this.placedBuildings.get(buildingId);
    if (!building) return 0;
    
    const currentLevel = building.upgradeLevel || 1;
    if (currentLevel >= 3) return 0; // Already max level
    
    const def = getCryptoBuilding(building.buildingId);
    if (!def) return 0;
    
    const nextLevel = (currentLevel + 1) as 2 | 3;
    const costMultiplier = ECONOMY_CONFIG.UPGRADES.LEVEL_COSTS[nextLevel];
    return Math.floor(def.cost * costMultiplier);
  }
  
  /**
   * Upgrade a building to the next level
   * @param buildingId - Instance ID of building to upgrade
   * @returns true if upgrade successful
   */
  upgradeBuilding(buildingId: string): boolean {
    const building = this.placedBuildings.get(buildingId);
    if (!building) return false;
    
    // Cannot upgrade damaged buildings
    if (building.isDamaged) return false;
    
    const currentLevel = building.upgradeLevel || 1;
    if (currentLevel >= 3) return false; // Already max level
    
    const upgradeCost = this.getUpgradeCost(buildingId);
    if (!this.canAfford(upgradeCost)) return false;
    
    // Deduct upgrade cost
    this.state.treasury -= upgradeCost;
    
    // Upgrade building
    building.upgradeLevel = (currentLevel + 1) as 1 | 2 | 3;
    
    this.recalculateEconomy();
    logger.info(`[CryptoEconomy] Building ${buildingId} upgraded to level ${building.upgradeLevel}`);
    return true;
  }
  
  /**
   * Get upgrade level of a building
   */
  getBuildingUpgradeLevel(buildingId: string): 1 | 2 | 3 {
    const building = this.placedBuildings.get(buildingId);
    return building?.upgradeLevel || 1;
  }
  
  /**
   * Get yield bonus for a building's upgrade level
   */
  getBuildingUpgradeBonus(buildingId: string): number {
    const level = this.getBuildingUpgradeLevel(buildingId);
    return ECONOMY_CONFIG.UPGRADES.LEVEL_YIELD_BONUS[level];
  }
  
  // ---------------------------------------------------------------------------
  // DISASTER SYSTEM PUBLIC API (Issue #67)
  // ---------------------------------------------------------------------------
  
  /**
   * Get the disaster manager instance
   */
  getDisasterManager(): DisasterManager {
    return this.disasterManager;
  }
  
  /**
   * Get all currently active disasters
   */
  getActiveDisasters(): ActiveDisaster[] {
    return this.disasterManager.getActiveDisasters();
  }
  
  /**
   * Check if a specific disaster is active
   */
  isDisasterActive(disasterId: string): boolean {
    return this.disasterManager.isDisasterActive(disasterId);
  }
  
  /**
   * Get the disaster log for UI display
   */
  getDisasterLog() {
    return this.disasterManager.getDisasterLog();
  }
  
  /**
   * Get combined yield multiplier from active disasters
   * @returns Multiplier (e.g., 0.5 for Market Crash, 2.0 for Bull Run)
   */
  getDisasterYieldMultiplier(): number {
    return this.disasterManager.getYieldMultiplier();
  }
  
  /**
   * Get yield multiplier for a specific building tier from active disasters
   * (e.g., Institutional Buy-In gives +50% to institution tier)
   */
  getDisasterTierYieldMultiplier(tier: CryptoTier): number {
    return this.disasterManager.getTierYieldMultiplier(tier);
  }
  
  /**
   * Get cost multiplier from active disasters
   * @returns Multiplier (e.g., 1.5 for Gas Spike)
   */
  getDisasterCostMultiplier(): number {
    return this.disasterManager.getCostMultiplier();
  }
  
  /**
   * Get prestige multiplier from active disasters
   * @returns Multiplier (e.g., 2.0 for Halving Event)
   */
  getDisasterPrestigeMultiplier(): number {
    return this.disasterManager.getPrestigeMultiplier();
  }
  
  /**
   * Check if yields are currently delayed (Network Congestion)
   */
  areYieldsDelayed(): boolean {
    return this.disasterManager.areYieldsDelayed();
  }
  
  /**
   * Get list of buildings currently shut down by disasters
   */
  getShutdownBuildings(): string[] {
    return this.disasterManager.getShutdownBuildings();
  }
  
  /**
   * Force trigger a disaster (for testing or scripted events)
   */
  forceDisaster(disasterId: string): ActiveDisaster | null {
    const buildingIds = Array.from(this.placedBuildings.keys());
    return this.disasterManager.forceDisaster(disasterId, buildingIds);
  }
  
  /**
   * Subscribe to disaster events
   * @param callback - Called when a disaster starts or ends
   * @returns Unsubscribe function
   */
  subscribeToDisasters(callback: (disaster: ActiveDisaster, isStarting: boolean) => void): () => void {
    this.disasterListeners.add(callback);
    // Also subscribe to the disaster manager
    const unsubscribe = this.disasterManager.subscribe(callback);
    return () => {
      this.disasterListeners.delete(callback);
      unsubscribe();
    };
  }
  
  /**
   * Get disaster system stats for UI display
   */
  getDisasterStats(): {
    activeDisasters: ActiveDisaster[];
    totalDisasterCount: number;
    totalPositiveEventCount: number;
    yieldMultiplier: number;
    costMultiplier: number;
    prestigeMultiplier: number;
    yieldsDelayed: boolean;
    shutdownBuildingsCount: number;
  } {
    const state = this.disasterManager.getState();
    return {
      activeDisasters: state.activeDisasters,
      totalDisasterCount: state.totalDisasterCount,
      totalPositiveEventCount: state.totalPositiveEventCount,
      yieldMultiplier: this.disasterManager.getYieldMultiplier(),
      costMultiplier: this.disasterManager.getCostMultiplier(),
      prestigeMultiplier: this.disasterManager.getPrestigeMultiplier(),
      yieldsDelayed: this.disasterManager.areYieldsDelayed(),
      shutdownBuildingsCount: this.disasterManager.getShutdownBuildings().length,
    };
  }
  
  /**
   * Set current game tick for disaster synchronization
   * Called by the game simulation to sync ticks
   */
  setCurrentGameTick(tick: number): void {
    this.currentGameTick = tick;
  }
  
  /**
   * Get current game tick
   */
  getCurrentGameTick(): number {
    return this.currentGameTick;
  }
  
  // ---------------------------------------------------------------------------
  // RUG PULL PROTECTION SYSTEM (Issue #57)
  // ---------------------------------------------------------------------------
  
  /**
   * Calculate protection bonus for a building from nearby auditors
   * @param building - The building to check protection for
   * @returns Protection bonus (0-1, e.g., 0.25 = 25% risk reduction)
   */
  getProtectionBonus(building: PlacedCryptoBuilding): number {
    let totalProtection = 0;
    
    for (const other of this.placedBuildings.values()) {
      if (other.id === building.id) continue;
      if (other.isDamaged) continue;
      
      const otherDef = getCryptoBuilding(other.buildingId);
      if (!otherDef?.crypto?.effects?.protectionRadius) continue;
      
      const protectionRadius = otherDef.crypto.effects.protectionRadius;
      const protectionBonus = otherDef.crypto.effects.protectionBonus || 0;
      
      // Calculate Chebyshev distance
      const dx = Math.abs(other.gridX - building.gridX);
      const dy = Math.abs(other.gridY - building.gridY);
      const distance = Math.max(dx, dy);
      
      if (distance <= protectionRadius) {
        // Closer = stronger protection (linear falloff)
        const effectiveness = 1 - (distance / (protectionRadius + 1));
        totalProtection += protectionBonus * effectiveness;
      }
    }
    
    // Cap at 75% protection (can never fully prevent rugs)
    return Math.min(totalProtection, 0.75);
  }
  
  /**
   * Check if a building has insurance coverage from nearby insurance buildings
   * @param building - The building to check insurance for
   * @returns Insurance info { covered: boolean, recoveryRate: number }
   */
  getInsuranceCoverage(building: PlacedCryptoBuilding): { covered: boolean; recoveryRate: number } {
    let maxRecovery = 0;
    
    for (const other of this.placedBuildings.values()) {
      if (other.id === building.id) continue;
      if (other.isDamaged) continue;
      
      const otherDef = getCryptoBuilding(other.buildingId);
      if (!otherDef?.crypto?.effects?.insuranceRadius) continue;
      
      const insuranceRadius = otherDef.crypto.effects.insuranceRadius;
      const insuranceRecovery = otherDef.crypto.effects.insuranceRecovery || 0;
      
      // Calculate Chebyshev distance
      const dx = Math.abs(other.gridX - building.gridX);
      const dy = Math.abs(other.gridY - building.gridY);
      const distance = Math.max(dx, dy);
      
      if (distance <= insuranceRadius) {
        maxRecovery = Math.max(maxRecovery, insuranceRecovery);
      }
    }
    
    return {
      covered: maxRecovery > 0,
      recoveryRate: maxRecovery,
    };
  }
  
  /**
   * Calculate effective rug risk for a building after protection
   * @param building - The building to check
   * @returns Effective rug risk (reduced by protection)
   */
  getEffectiveRugRisk(building: PlacedCryptoBuilding): number {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) return 0;
    
    const baseRisk = def.crypto.effects.rugRisk;
    const protectionBonus = this.getProtectionBonus(building);
    const securityReduction = this.getSecurityRugReduction();
    
    // Apply all protection layers
    const totalReduction = Math.min(protectionBonus + Math.max(0, securityReduction), 0.9);
    return baseRisk * (1 - totalReduction);
  }
  
  /**
   * Generate an audit report for a placed building
   * @param buildingId - Instance ID of the building
   * @returns AuditReport or null if building not found
   */
  getAuditReport(buildingId: string): {
    buildingId: string;
    buildingName: string;
    riskLevel: 'safe' | 'caution' | 'danger';
    factors: string[];
    recommendation: string;
    effectiveRugRisk: number;
    hasAuditorProtection: boolean;
    hasInsuranceCoverage: boolean;
  } | null {
    const building = this.placedBuildings.get(buildingId);
    if (!building) return null;
    
    const def = getCryptoBuilding(building.buildingId);
    if (!def) return null;
    
    const baseRisk = def.crypto?.effects?.rugRisk || 0;
    const protectionBonus = this.getProtectionBonus(building);
    const insurance = this.getInsuranceCoverage(building);
    const effectiveRisk = this.getEffectiveRugRisk(building);
    
    const factors: string[] = [];
    
    // Analyze risk factors
    if (baseRisk >= 0.1) {
      factors.push('Very high base rug risk');
    } else if (baseRisk >= 0.05) {
      factors.push('High base rug risk');
    } else if (baseRisk >= 0.02) {
      factors.push('Moderate base rug risk');
    } else if (baseRisk > 0) {
      factors.push('Low base rug risk');
    } else {
      factors.push('Zero base rug risk');
    }
    
    if (protectionBonus > 0) {
      factors.push(`Auditor protection: -${Math.round(protectionBonus * 100)}% risk`);
    } else {
      factors.push('No auditor nearby');
    }
    
    if (insurance.covered) {
      factors.push(`Insurance coverage: ${Math.round(insurance.recoveryRate * 100)}% recovery`);
    } else {
      factors.push('No insurance coverage');
    }
    
    if (def.crypto?.tier === 'degen') {
      factors.push('⚠️ Degen tier: contagion risk from nearby rugs');
    }
    
    // Determine risk level
    let riskLevel: 'safe' | 'caution' | 'danger';
    if (effectiveRisk < 0.01) {
      riskLevel = 'safe';
    } else if (effectiveRisk < 0.05) {
      riskLevel = 'caution';
    } else {
      riskLevel = 'danger';
    }
    
    // Generate recommendation
    let recommendation: string;
    if (riskLevel === 'safe') {
      recommendation = 'This building is well protected. Minimal intervention needed.';
    } else if (riskLevel === 'caution') {
      if (!protectionBonus) {
        recommendation = 'Consider placing a Security Auditor nearby to reduce risk.';
      } else if (!insurance.covered) {
        recommendation = 'Adding Crypto Insurance would protect your investment.';
      } else {
        recommendation = 'Risk is moderate. Monitor market conditions.';
      }
    } else {
      if (!protectionBonus && !insurance.covered) {
        recommendation = 'HIGH RISK! Place both Auditor and Insurance buildings nearby immediately.';
      } else if (!protectionBonus) {
        recommendation = 'DANGER! Security Auditor needed to reduce rug risk.';
      } else if (!insurance.covered) {
        recommendation = 'HIGH RISK! Insurance recommended to protect investment.';
      } else {
        recommendation = 'Maximum protection applied but risk remains high due to building type.';
      }
    }
    
    return {
      buildingId,
      buildingName: def.name,
      riskLevel,
      factors,
      recommendation,
      effectiveRugRisk: effectiveRisk,
      hasAuditorProtection: protectionBonus > 0,
      hasInsuranceCoverage: insurance.covered,
    };
  }
  
  /**
   * Process insurance payout when a building is rugged
   * @param building - The rugged building
   * @returns Payout amount (0 if not insured)
   */
  processInsurancePayout(building: PlacedCryptoBuilding): number {
    const def = getCryptoBuilding(building.buildingId);
    if (!def) return 0;
    
    const insurance = this.getInsuranceCoverage(building);
    if (!insurance.covered) return 0;
    
    const payout = Math.floor(def.cost * insurance.recoveryRate);
    this.state.treasury += payout;
    
    logger.info(`[CryptoEconomy] Insurance payout of $${payout} for ${def.name}`);
    return payout;
  }
  
  /**
   * Get all buildings with protection effects (auditors, insurance)
   * @returns Array of protection building info for visualization
   */
  getProtectionBuildings(): Array<{
    id: string;
    buildingId: string;
    gridX: number;
    gridY: number;
    protectionRadius?: number;
    insuranceRadius?: number;
    type: 'auditor' | 'insurance';
  }> {
    const protectionBuildings: Array<{
      id: string;
      buildingId: string;
      gridX: number;
      gridY: number;
      protectionRadius?: number;
      insuranceRadius?: number;
      type: 'auditor' | 'insurance';
    }> = [];
    
    for (const building of this.placedBuildings.values()) {
      if (building.isDamaged) continue;
      
      const def = getCryptoBuilding(building.buildingId);
      if (!def?.crypto?.effects) continue;
      
      const effects = def.crypto.effects;
      
      if (effects.protectionRadius) {
        protectionBuildings.push({
          id: building.id,
          buildingId: building.buildingId,
          gridX: building.gridX,
          gridY: building.gridY,
          protectionRadius: effects.protectionRadius,
          type: 'auditor',
        });
      }
      
      if (effects.insuranceRadius) {
        protectionBuildings.push({
          id: building.id,
          buildingId: building.buildingId,
          gridX: building.gridX,
          gridY: building.gridY,
          insuranceRadius: effects.insuranceRadius,
          type: 'insurance',
        });
      }
    }
    
    return protectionBuildings;
  }
  
  /**
   * Get protection stats summary for UI display
   */
  getProtectionStats(): {
    auditorCount: number;
    insuranceCount: number;
    protectedBuildingsCount: number;
    insuredBuildingsCount: number;
    avgProtectionBonus: number;
  } {
    let auditorCount = 0;
    let insuranceCount = 0;
    let protectedCount = 0;
    let insuredCount = 0;
    let totalProtection = 0;
    
    const protectionBuildings = this.getProtectionBuildings();
    for (const pb of protectionBuildings) {
      if (pb.type === 'auditor') auditorCount++;
      if (pb.type === 'insurance') insuranceCount++;
    }
    
    for (const building of this.placedBuildings.values()) {
      const protection = this.getProtectionBonus(building);
      const insurance = this.getInsuranceCoverage(building);
      
      if (protection > 0) {
        protectedCount++;
        totalProtection += protection;
      }
      if (insurance.covered) {
        insuredCount++;
      }
    }
    
    const buildingCount = this.placedBuildings.size;
    const avgProtection = buildingCount > 0 ? totalProtection / buildingCount : 0;
    
    return {
      auditorCount,
      insuranceCount,
      protectedBuildingsCount: protectedCount,
      insuredBuildingsCount: insuredCount,
      avgProtectionBonus: avgProtection,
    };
  }
  
  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  
  // ---------------------------------------------------------------------------
  // ACTIVE MANAGEMENT SYSTEM (Issue #55)
  // ---------------------------------------------------------------------------
  
  /**
   * Set the harvest mode for yield collection
   * @param mode - 'auto' (default), 'manual', or 'locked'
   */
  setHarvestMode(mode: HarvestMode): void {
    this.state = {
      ...this.state,
      marketTiming: {
        ...this.state.marketTiming,
        harvestMode: mode,
      },
    };
    
    // If switching to auto, collect any pending yields
    if (mode === 'auto') {
      this.collectYields();
    }
    
    this.notifyListeners();
  }
  
  /**
   * Get current harvest mode
   */
  getHarvestMode(): HarvestMode {
    return this.state.marketTiming.harvestMode;
  }
  
  /**
   * Lock current yields at the current sentiment
   * Player can release later to collect at the locked sentiment rate
   */
  lockYields(): void {
    const { pendingYields, harvestMode } = this.state.marketTiming;
    
    // Can only lock in manual mode
    if (harvestMode !== 'manual' && harvestMode !== 'locked') {
      return;
    }
    
    // Move pending yields to locked
    this.state = {
      ...this.state,
      marketTiming: {
        ...this.state.marketTiming,
        lockedYields: this.state.marketTiming.lockedYields + pendingYields,
        pendingYields: 0,
        lockSentiment: this.state.marketSentiment,
        harvestMode: 'locked',
      },
    };
    
    logger.info(`[CryptoEconomy] Locked ${pendingYields} yields at sentiment ${this.state.marketSentiment}`);
    this.notifyListeners();
  }
  
  /**
   * Release locked yields (applies locked sentiment multiplier)
   * @returns Amount released to treasury
   */
  releaseYields(): number {
    const { lockedYields, lockSentiment } = this.state.marketTiming;
    
    if (lockedYields <= 0 || lockSentiment === null) {
      return 0;
    }
    
    // Calculate the multiplier that was locked
    const lockedMultiplier = this.getSentimentMultiplierForValue(lockSentiment);
    const releaseAmount = lockedYields * lockedMultiplier;
    
    // Add to treasury
    this.state = {
      ...this.state,
      treasury: this.state.treasury + releaseAmount,
      marketTiming: {
        ...this.state.marketTiming,
        lockedYields: 0,
        lockSentiment: null,
        harvestMode: 'manual',
      },
    };
    
    logger.info(`[CryptoEconomy] Released ${releaseAmount} yields from locked sentiment ${lockSentiment}`);
    this.notifyListeners();
    return releaseAmount;
  }
  
  /**
   * Collect all pending yields at current sentiment
   * @returns Amount collected to treasury
   */
  collectYields(): number {
    const { pendingYields } = this.state.marketTiming;
    
    if (pendingYields <= 0) {
      return 0;
    }
    
    // Apply current sentiment multiplier
    const currentMultiplier = this.getSentimentMultiplier();
    const collectAmount = pendingYields * currentMultiplier;
    
    // Add to treasury and clear pending
    this.state = {
      ...this.state,
      treasury: this.state.treasury + collectAmount,
      marketTiming: {
        ...this.state.marketTiming,
        pendingYields: 0,
      },
    };
    
    logger.info(`[CryptoEconomy] Collected ${collectAmount} yields at sentiment ${this.state.marketSentiment}`);
    this.notifyListeners();
    return collectAmount;
  }
  
  /**
   * Get sentiment multiplier for a specific sentiment value
   */
  private getSentimentMultiplierForValue(sentiment: number): number {
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
   * Get market timing state for UI
   */
  getMarketTimingState(): MarketTiming {
    return { ...this.state.marketTiming };
  }
  
  // ---------------------------------------------------------------------------
  // TRADE OPPORTUNITIES (Issue #55)
  // ---------------------------------------------------------------------------
  
  /**
   * Generate a new trade opportunity
   */
  private generateTradeOpportunity(): TradeOpportunity {
    const templates = ECONOMY_CONFIG.TRADES.TEMPLATES;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const chains: CryptoChain[] = ['ethereum', 'solana', 'arbitrum', 'base', 'polygon'];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    
    // Add some variance to the template
    const variance = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
    
    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: `${template.name} on ${chain.charAt(0).toUpperCase() + chain.slice(1)}`,
      cost: Math.floor(template.cost * variance),
      potentialReturn: template.potentialReturn,
      risk: Math.min(0.9, Math.max(0.05, template.risk * variance)),
      duration: template.duration,
      chain,
      expiresAt: this.state.tickCount + ECONOMY_CONFIG.TRADES.OPPORTUNITY_DURATION,
    };
  }
  
  /**
   * Process trade opportunities each tick
   * - Generate new opportunities if needed
   * - Remove expired opportunities
   * - Resolve completed trades
   */
  private processTradeOpportunities(): void {
    const currentTick = this.state.tickCount;
    
    // Remove expired opportunities
    const validOpportunities = this.state.tradeOpportunities.filter(
      t => t.expiresAt > currentTick
    );
    
    // Generate new opportunities if below max
    const shouldGenerate = currentTick % ECONOMY_CONFIG.TRADES.GENERATION_INTERVAL === 0;
    if (shouldGenerate && validOpportunities.length < ECONOMY_CONFIG.TRADES.MAX_OPPORTUNITIES) {
      validOpportunities.push(this.generateTradeOpportunity());
    }
    
    // Resolve completed trades
    const pendingTrades: ActiveTrade[] = [];
    for (const trade of this.state.activeTrades) {
      if (trade.resolvesAt <= currentTick) {
        // Trade resolves!
        const success = Math.random() > trade.opportunity.risk;
        if (success) {
          const payout = trade.investedAmount * trade.opportunity.potentialReturn;
          this.state.treasury += payout;
          logger.info(`[CryptoEconomy] Trade SUCCESS: ${trade.opportunity.name} returned $${payout}`);
        } else {
          logger.info(`[CryptoEconomy] Trade FAILED: ${trade.opportunity.name} - lost $${trade.investedAmount}`);
        }
      } else {
        pendingTrades.push(trade);
      }
    }
    
    this.state = {
      ...this.state,
      tradeOpportunities: validOpportunities,
      activeTrades: pendingTrades,
    };
  }
  
  /**
   * Get available trade opportunities
   */
  getTradeOpportunities(): TradeOpportunity[] {
    return [...this.state.tradeOpportunities];
  }
  
  /**
   * Get active trades
   */
  getActiveTrades(): ActiveTrade[] {
    return [...this.state.activeTrades];
  }
  
  /**
   * Invest in a trade opportunity
   * @param opportunityId - ID of the opportunity to invest in
   * @returns true if investment successful
   */
  investInTrade(opportunityId: string): boolean {
    const opportunity = this.state.tradeOpportunities.find(t => t.id === opportunityId);
    if (!opportunity) {
      return false;
    }
    
    if (!this.canAfford(opportunity.cost)) {
      return false;
    }
    
    // Deduct cost
    this.state.treasury -= opportunity.cost;
    
    // Create active trade
    const activeTrade: ActiveTrade = {
      opportunity,
      investedAmount: opportunity.cost,
      startedAt: this.state.tickCount,
      resolvesAt: this.state.tickCount + opportunity.duration,
    };
    
    // Remove from opportunities, add to active trades
    this.state = {
      ...this.state,
      tradeOpportunities: this.state.tradeOpportunities.filter(t => t.id !== opportunityId),
      activeTrades: [...this.state.activeTrades, activeTrade],
    };
    
    logger.info(`[CryptoEconomy] Invested $${opportunity.cost} in ${opportunity.name}`);
    this.notifyListeners();
    return true;
  }
  
  // ---------------------------------------------------------------------------
  // YIELD BOOST SYSTEM (Issue #55)
  // ---------------------------------------------------------------------------
  
  /**
   * Get available yield boost types
   */
  getAvailableYieldBoosts(): YieldBoost[] {
    return [...ECONOMY_CONFIG.YIELD_BOOSTS.TYPES];
  }
  
  /**
   * Activate a yield boost on a building
   * @param buildingId - Instance ID of the building
   * @param boostId - ID of the boost type to apply
   * @returns true if boost activated successfully
   */
  activateYieldBoost(buildingId: string, boostId: string): boolean {
    const building = this.placedBuildings.get(buildingId);
    if (!building) {
      return false;
    }
    
    // Check if building already has an active boost
    const existingBoost = this.state.activeYieldBoosts.find(b => b.buildingId === buildingId);
    if (existingBoost) {
      return false; // Already boosted
    }
    
    // Find boost type
    const boost = ECONOMY_CONFIG.YIELD_BOOSTS.TYPES.find(b => b.id === boostId);
    if (!boost) {
      return false;
    }
    
    if (!this.canAfford(boost.cost)) {
      return false;
    }
    
    // Deduct cost
    this.state.treasury -= boost.cost;
    
    // Add active boost
    const activeBoost: ActiveYieldBoost = {
      buildingId,
      boost,
      activatedAt: this.state.tickCount,
      expiresAt: this.state.tickCount + boost.duration,
    };
    
    this.state = {
      ...this.state,
      activeYieldBoosts: [...this.state.activeYieldBoosts, activeBoost],
    };
    
    logger.info(`[CryptoEconomy] Activated ${boost.name} on building ${buildingId}`);
    this.notifyListeners();
    return true;
  }
  
  /**
   * Get yield boost multiplier for a building
   * @param buildingId - Instance ID of the building
   * @returns Yield multiplier from active boosts (1.0 if none)
   */
  getBuildingYieldBoostMultiplier(buildingId: string): number {
    const activeBoost = this.state.activeYieldBoosts.find(
      b => b.buildingId === buildingId && b.expiresAt > this.state.tickCount
    );
    return activeBoost ? activeBoost.boost.yieldMultiplier : 1.0;
  }
  
  /**
   * Get rug risk increase for a building from active boosts
   * @param buildingId - Instance ID of the building
   * @returns Risk increase from active boosts (0 if none)
   */
  getBuildingBoostRiskIncrease(buildingId: string): number {
    const activeBoost = this.state.activeYieldBoosts.find(
      b => b.buildingId === buildingId && b.expiresAt > this.state.tickCount
    );
    return activeBoost ? activeBoost.boost.riskIncrease : 0;
  }
  
  /**
   * Process yield boosts each tick - remove expired boosts
   */
  private processYieldBoosts(): void {
    const currentTick = this.state.tickCount;
    const activeBoosts = this.state.activeYieldBoosts.filter(
      b => b.expiresAt > currentTick
    );
    
    if (activeBoosts.length !== this.state.activeYieldBoosts.length) {
      this.state = {
        ...this.state,
        activeYieldBoosts: activeBoosts,
      };
    }
  }
  
  /**
   * Get active yield boosts for UI display
   */
  getActiveYieldBoosts(): ActiveYieldBoost[] {
    return this.state.activeYieldBoosts.filter(
      b => b.expiresAt > this.state.tickCount
    );
  }
  
  // ---------------------------------------------------------------------------
  // REPAIR MINI-GAME (Issue #55)
  // ---------------------------------------------------------------------------
  
  /**
   * Start the repair mini-game for a damaged building
   * @param buildingId - Instance ID of the building to repair
   * @returns true if mini-game started successfully
   */
  startRepairMiniGame(buildingId: string): boolean {
    const building = this.placedBuildings.get(buildingId);
    if (!building || !building.isDamaged) {
      return false;
    }
    
    // Can't start if already in a mini-game
    if (this.state.repairMiniGame?.isActive) {
      return false;
    }
    
    this.state = {
      ...this.state,
      repairMiniGame: {
        buildingId,
        progress: 0,
        timeRemaining: ECONOMY_CONFIG.REPAIR_MINIGAME.DURATION,
        isActive: true,
        targetProgress: ECONOMY_CONFIG.REPAIR_MINIGAME.TARGET_PROGRESS,
      },
    };
    
    logger.info(`[CryptoEconomy] Started repair mini-game for building ${buildingId}`);
    this.notifyListeners();
    return true;
  }
  
  /**
   * Click in the repair mini-game to add progress
   * @returns Updated progress value
   */
  clickRepairMiniGame(): number {
    if (!this.state.repairMiniGame?.isActive) {
      return 0;
    }
    
    const newProgress = Math.min(
      this.state.repairMiniGame.progress + ECONOMY_CONFIG.REPAIR_MINIGAME.PROGRESS_PER_CLICK,
      100
    );
    
    this.state = {
      ...this.state,
      repairMiniGame: {
        ...this.state.repairMiniGame,
        progress: newProgress,
      },
    };
    
    // Check if completed
    const currentMiniGame = this.state.repairMiniGame;
    if (currentMiniGame && newProgress >= currentMiniGame.targetProgress) {
      this.completeRepairMiniGame(true);
    }
    
    this.notifyListeners();
    return newProgress;
  }
  
  /**
   * Update mini-game timer (called each second by UI)
   * @returns Remaining time
   */
  updateRepairMiniGameTimer(): number {
    if (!this.state.repairMiniGame?.isActive) {
      return 0;
    }
    
    const newTimeRemaining = this.state.repairMiniGame.timeRemaining - 1;
    
    if (newTimeRemaining <= 0) {
      // Time's up - check if successful
      const success = this.state.repairMiniGame.progress >= this.state.repairMiniGame.targetProgress;
      this.completeRepairMiniGame(success);
      return 0;
    }
    
    this.state = {
      ...this.state,
      repairMiniGame: {
        ...this.state.repairMiniGame,
        timeRemaining: newTimeRemaining,
      },
    };
    
    return newTimeRemaining;
  }
  
  /**
   * Complete the repair mini-game
   * @param success - Whether the player succeeded
   */
  private completeRepairMiniGame(success: boolean): void {
    const miniGame = this.state.repairMiniGame;
    if (!miniGame) {
      return;
    }
    
    const buildingId = miniGame.buildingId;
    const repairCost = this.getRepairCost(buildingId);
    const discount = success ? ECONOMY_CONFIG.REPAIR_MINIGAME.SUCCESS_DISCOUNT : 0;
    const finalCost = Math.floor(repairCost * (1 - discount));
    
    // Clear mini-game state
    this.state = {
      ...this.state,
      repairMiniGame: null,
    };
    
    if (success) {
      // Apply discounted repair if player can afford it
      if (this.canAfford(finalCost)) {
        this.state.treasury -= finalCost;
        this.repairBuildingDirectly(buildingId);
        logger.info(`[CryptoEconomy] Mini-game SUCCESS! Repaired for $${finalCost} (50% off)`);
      } else {
        logger.info(`[CryptoEconomy] Mini-game success but can't afford repair cost $${finalCost}`);
      }
    } else {
      logger.info(`[CryptoEconomy] Mini-game FAILED - no discount applied`);
    }
    
    this.notifyListeners();
  }
  
  /**
   * Directly repair a building (internal use, bypasses cost check)
   */
  private repairBuildingDirectly(buildingId: string): void {
    const building = this.placedBuildings.get(buildingId);
    if (!building) return;
    
    building.isDamaged = false;
    this.state = {
      ...this.state,
      damagedBuildings: this.state.damagedBuildings.filter(d => d.id !== buildingId),
    };
    
    this.recalculateEconomy();
  }
  
  /**
   * Cancel the repair mini-game
   */
  cancelRepairMiniGame(): void {
    this.state = {
      ...this.state,
      repairMiniGame: null,
    };
    this.notifyListeners();
  }
  
  /**
   * Get current repair mini-game state
   */
  getRepairMiniGameState(): RepairMiniGame | null {
    return this.state.repairMiniGame;
  }
  
  // ---------------------------------------------------------------------------
  // ACTIVE MANAGEMENT STATS (Issue #55)
  // ---------------------------------------------------------------------------
  
  /**
   * Get comprehensive active management stats for UI display
   */
  getActiveManagementStats(): {
    harvestMode: HarvestMode;
    pendingYields: number;
    lockedYields: number;
    lockSentiment: number | null;
    tradeOpportunityCount: number;
    activeTradeCount: number;
    activeBoostedBuildingCount: number;
    isRepairMiniGameActive: boolean;
  } {
    return {
      harvestMode: this.state.marketTiming.harvestMode,
      pendingYields: this.state.marketTiming.pendingYields,
      lockedYields: this.state.marketTiming.lockedYields,
      lockSentiment: this.state.marketTiming.lockSentiment,
      tradeOpportunityCount: this.state.tradeOpportunities.length,
      activeTradeCount: this.state.activeTrades.length,
      activeBoostedBuildingCount: this.state.activeYieldBoosts.filter(
        b => b.expiresAt > this.state.tickCount
      ).length,
      isRepairMiniGameActive: this.state.repairMiniGame?.isActive ?? false,
    };
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

