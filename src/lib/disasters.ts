/**
 * Disaster and Event System for Crypto City
 * 
 * Implements variety of disasters and positive events beyond rug pulls.
 * Closes Issue #67.
 * 
 * Disasters:
 * - Market Crash (major): All yields halved for 3 game days, sentiment -20
 * - Regulatory Crackdown (major): 10-20% buildings shut down for 2 days, $10k fine
 * - Whale Dump (minor): Sentiment -30 for 1 day
 * - Exchange Hack (catastrophic): 20% treasury loss, random building rugged
 * - Gas Spike (minor): Building/maintenance costs +50% for 1 day
 * - Network Congestion (minor): Yields delayed, paid next day
 * 
 * Positive Events:
 * - Bull Run (major): All yields doubled for 2 days, sentiment +20
 * - Airdrop Season (minor): Random treasury bonus ($5k-$50k)
 * - Institutional Buy-In (major): Institution buildings +50% yield for 3 days, sentiment +15
 * - Halving Event (major): Yields -50% but prestige doubled for 5 days
 */

import type { CryptoTier } from '@/games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

export type DisasterSeverity = 'minor' | 'major' | 'catastrophic';

export interface DisasterEffect {
  /** Multiplier for all yields (0.5 = halve yields, 2.0 = double yields) */
  yieldMultiplier?: number;
  /** Flat treasury loss amount */
  treasuryDamage?: number;
  /** Percentage of treasury lost (0.2 = 20%) */
  treasuryDamagePercent?: number;
  /** Chance each building takes damage (0.1 = 10% per building) */
  buildingDamageChance?: number;
  /** Change to market sentiment (-30 to +30 typical) */
  sentimentImpact?: number;
  /** Percentage of buildings temporarily shut down (0.1 = 10%) */
  buildingShutdownPercent?: number;
  /** Multiplier for building costs (1.5 = +50%) */
  costMultiplier?: number;
  /** Whether yields are delayed to next day */
  delayYields?: boolean;
  /** Multiplier for prestige points (2.0 = double) */
  prestigeMultiplier?: number;
  /** Random treasury bonus range [min, max] */
  treasuryBonus?: [number, number];
  /** Yield boost for specific tier buildings */
  tierYieldBoost?: { tier: CryptoTier; multiplier: number };
  /** Whether to rug a random building */
  rugRandomBuilding?: boolean;
}

export interface Disaster {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description shown in notifications */
  description: string;
  /** Severity level */
  severity: DisasterSeverity;
  /** Duration in game days (1 day = 24 game ticks roughly) */
  duration: number;
  /** Effects applied during the disaster */
  effect: DisasterEffect;
  /** Probability per game day (0.02 = 2% chance per day) */
  probability: number;
  /** Minimum game days between occurrences */
  cooldown: number;
  /** Whether this is a positive event */
  isPositive?: boolean;
  /** Icon emoji for UI */
  icon: string;
  /** Cobie quote for this disaster */
  cobieQuote: string;
}

export interface ActiveDisaster {
  /** The disaster definition */
  disaster: Disaster;
  /** Game tick when disaster started */
  startTick: number;
  /** Game tick when disaster ends */
  endTick: number;
  /** Unique instance ID */
  instanceId: string;
  /** Accumulated yields during delay (for Network Congestion) */
  delayedYields?: number;
  /** Buildings shut down during this disaster */
  shutdownBuildings?: string[];
}

// =============================================================================
// DISASTER DEFINITIONS
// =============================================================================

export const DISASTERS: Record<string, Disaster> = {
  // === NEGATIVE DISASTERS ===
  
  market_crash: {
    id: 'market_crash',
    name: 'Market Crash',
    description: 'Markets are crashing! All yields halved while panic spreads.',
    severity: 'major',
    duration: 3, // 3 game days
    effect: {
      yieldMultiplier: 0.5,
      sentimentImpact: -20,
    },
    probability: 0.015, // 1.5% per day
    cooldown: 7, // 7 days between crashes
    icon: '📉',
    cobieQuote: 'Blood in the streets. Time to be greedy.',
  },

  regulatory_crackdown: {
    id: 'regulatory_crackdown',
    name: 'Regulatory Crackdown',
    description: 'Regulators are investigating! Some buildings temporarily shut down.',
    severity: 'major',
    duration: 2,
    effect: {
      buildingShutdownPercent: 0.15, // 15% of buildings (10-20% random)
      treasuryDamage: 10000, // $10k fine
    },
    probability: 0.012,
    cooldown: 10,
    icon: '⚖️',
    cobieQuote: 'The suits are here. Act natural.',
  },

  whale_dump: {
    id: 'whale_dump',
    name: 'Whale Dump',
    description: 'A whale just market sold everything! Sentiment in freefall.',
    severity: 'minor',
    duration: 1,
    effect: {
      sentimentImpact: -30,
    },
    probability: 0.025, // 2.5% per day
    cooldown: 3,
    icon: '🐋',
    cobieQuote: 'Someone just market sold... a lot.',
  },

  exchange_hack: {
    id: 'exchange_hack',
    name: 'Exchange Hack',
    description: 'A major exchange has been hacked! Funds are not safu.',
    severity: 'catastrophic',
    duration: 1, // Immediate effect
    effect: {
      treasuryDamagePercent: 0.20, // 20% treasury loss
      rugRandomBuilding: true,
    },
    probability: 0.005, // 0.5% per day (rare)
    cooldown: 30,
    icon: '🔓',
    cobieQuote: 'Not your keys, not your coins. Classic.',
  },

  gas_spike: {
    id: 'gas_spike',
    name: 'Gas Spike',
    description: 'Network gas fees have spiked! Building costs increased.',
    severity: 'minor',
    duration: 1,
    effect: {
      costMultiplier: 1.5, // +50% costs
    },
    probability: 0.03, // 3% per day
    cooldown: 2,
    icon: '⛽',
    cobieQuote: 'Gas at 500 gwei. ETH users in shambles.',
  },

  network_congestion: {
    id: 'network_congestion',
    name: 'Network Congestion',
    description: 'Network congested! Yields will be delayed until tomorrow.',
    severity: 'minor',
    duration: 1,
    effect: {
      delayYields: true,
    },
    probability: 0.02, // 2% per day
    cooldown: 3,
    icon: '🚧',
    cobieQuote: 'Transactions pending... any decade now.',
  },

  // === POSITIVE EVENTS ===

  bull_run_event: {
    id: 'bull_run_event',
    name: 'Bull Run',
    description: 'Number go up! All yields doubled as markets surge.',
    severity: 'major',
    duration: 2,
    effect: {
      yieldMultiplier: 2.0,
      sentimentImpact: 20,
    },
    probability: 0.012, // 1.2% per day
    cooldown: 10,
    isPositive: true,
    icon: '🚀',
    cobieQuote: 'Number go up technology activated.',
  },

  airdrop_season_event: {
    id: 'airdrop_season_event',
    name: 'Airdrop Season',
    description: 'Free money raining from the sky! Treasury boosted.',
    severity: 'minor',
    duration: 1, // Instant bonus
    effect: {
      treasuryBonus: [5000, 50000], // $5k-$50k random
    },
    probability: 0.02, // 2% per day
    cooldown: 7,
    isPositive: true,
    icon: '🪂',
    cobieQuote: 'Free money? In this economy?',
  },

  institutional_buy_in: {
    id: 'institutional_buy_in',
    name: 'Institutional Buy-In',
    description: 'Institutions are aping in! Institution buildings boosted.',
    severity: 'major',
    duration: 3,
    effect: {
      tierYieldBoost: { tier: 'institution', multiplier: 1.5 },
      sentimentImpact: 15,
    },
    probability: 0.01, // 1% per day
    cooldown: 14,
    isPositive: true,
    icon: '🏦',
    cobieQuote: 'The suits are aping in. Bullish.',
  },

  halving_event: {
    id: 'halving_event',
    name: 'Halving Event',
    description: 'Halving in progress! Yields halved but prestige doubled.',
    severity: 'major',
    duration: 5,
    effect: {
      yieldMultiplier: 0.5,
      prestigeMultiplier: 2.0,
    },
    probability: 0.005, // 0.5% per day (rare)
    cooldown: 30,
    isPositive: true, // Net positive due to prestige
    icon: '⚡',
    cobieQuote: 'Halvening in progress. HODL.',
  },
};

// =============================================================================
// DISASTER MANAGER
// =============================================================================

export interface DisasterManagerState {
  /** Currently active disasters */
  activeDisasters: ActiveDisaster[];
  /** Last occurrence of each disaster type (game tick) */
  lastOccurrence: Record<string, number>;
  /** Total disasters triggered this session */
  totalDisasterCount: number;
  /** Total positive events this session */
  totalPositiveEventCount: number;
  /** Disaster log for notification center */
  disasterLog: DisasterLogEntry[];
}

export interface DisasterLogEntry {
  disaster: Disaster;
  startTick: number;
  endTick?: number;
  resolved: boolean;
}

export type DisasterCallback = (disaster: ActiveDisaster, isStarting: boolean) => void;

/**
 * Disaster Manager
 * 
 * Manages the disaster system - tracks active disasters, applies effects,
 * checks for new disasters each tick, and respects cooldowns.
 */
export class DisasterManager {
  private state: DisasterManagerState;
  private listeners: Set<DisasterCallback> = new Set();
  private currentTick: number = 0;
  private ticksPerDay: number = 288; // 5 second ticks, 24 min = 1 game day

  constructor() {
    this.state = {
      activeDisasters: [],
      lastOccurrence: {},
      totalDisasterCount: 0,
      totalPositiveEventCount: 0,
      disasterLog: [],
    };
  }

  // ---------------------------------------------------------------------------
  // STATE ACCESS
  // ---------------------------------------------------------------------------

  /**
   * Get current state
   */
  getState(): DisasterManagerState {
    return { ...this.state };
  }

  /**
   * Get all active disasters
   */
  getActiveDisasters(): ActiveDisaster[] {
    return [...this.state.activeDisasters];
  }

  /**
   * Check if a specific disaster type is active
   */
  isDisasterActive(disasterId: string): boolean {
    return this.state.activeDisasters.some(d => d.disaster.id === disasterId);
  }

  /**
   * Get the disaster log for notification center
   */
  getDisasterLog(): DisasterLogEntry[] {
    return [...this.state.disasterLog].slice(-20); // Last 20 entries
  }

  // ---------------------------------------------------------------------------
  // EFFECT CALCULATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get combined yield multiplier from all active disasters
   */
  getYieldMultiplier(): number {
    let multiplier = 1.0;
    
    for (const active of this.state.activeDisasters) {
      if (active.disaster.effect.yieldMultiplier !== undefined) {
        multiplier *= active.disaster.effect.yieldMultiplier;
      }
      
      // Tier-specific boost
      if (active.disaster.effect.tierYieldBoost) {
        // This is handled separately per-building
      }
    }
    
    return multiplier;
  }

  /**
   * Get yield multiplier for a specific building tier
   */
  getTierYieldMultiplier(tier: CryptoTier): number {
    let multiplier = 1.0;
    
    for (const active of this.state.activeDisasters) {
      const tierBoost = active.disaster.effect.tierYieldBoost;
      if (tierBoost && tierBoost.tier === tier) {
        multiplier *= tierBoost.multiplier;
      }
    }
    
    return multiplier;
  }

  /**
   * Get combined sentiment impact from all active disasters
   */
  getSentimentImpact(): number {
    let impact = 0;
    
    for (const active of this.state.activeDisasters) {
      if (active.disaster.effect.sentimentImpact !== undefined) {
        impact += active.disaster.effect.sentimentImpact;
      }
    }
    
    return impact;
  }

  /**
   * Get cost multiplier from active disasters
   */
  getCostMultiplier(): number {
    let multiplier = 1.0;
    
    for (const active of this.state.activeDisasters) {
      if (active.disaster.effect.costMultiplier !== undefined) {
        multiplier *= active.disaster.effect.costMultiplier;
      }
    }
    
    return multiplier;
  }

  /**
   * Get prestige multiplier from active disasters
   */
  getPrestigeMultiplier(): number {
    let multiplier = 1.0;
    
    for (const active of this.state.activeDisasters) {
      if (active.disaster.effect.prestigeMultiplier !== undefined) {
        multiplier *= active.disaster.effect.prestigeMultiplier;
      }
    }
    
    return multiplier;
  }

  /**
   * Check if yields should be delayed
   */
  areYieldsDelayed(): boolean {
    return this.state.activeDisasters.some(d => d.disaster.effect.delayYields);
  }

  /**
   * Get accumulated delayed yields
   */
  getDelayedYields(): number {
    let total = 0;
    for (const active of this.state.activeDisasters) {
      if (active.delayedYields) {
        total += active.delayedYields;
      }
    }
    return total;
  }

  /**
   * Add to delayed yields (during network congestion)
   */
  addDelayedYields(amount: number): void {
    for (const active of this.state.activeDisasters) {
      if (active.disaster.effect.delayYields) {
        active.delayedYields = (active.delayedYields || 0) + amount;
      }
    }
  }

  /**
   * Get list of shutdown building IDs
   */
  getShutdownBuildings(): string[] {
    const shutdowns: string[] = [];
    for (const active of this.state.activeDisasters) {
      if (active.shutdownBuildings) {
        shutdowns.push(...active.shutdownBuildings);
      }
    }
    return shutdowns;
  }

  // ---------------------------------------------------------------------------
  // DISASTER LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Process a game tick - check for new disasters and update active ones
   * @param currentTick - Current game tick
   * @param buildingIds - List of building instance IDs for shutdown selection
   * @returns Effects to apply this tick (treasury changes, buildings to rug)
   */
  tick(currentTick: number, buildingIds: string[] = []): {
    treasuryChange: number;
    buildingsToRug: string[];
    buildingsToShutdown: string[];
    delayedYieldsToRelease: number;
  } {
    this.currentTick = currentTick;
    
    const effects = {
      treasuryChange: 0,
      buildingsToRug: [] as string[],
      buildingsToShutdown: [] as string[],
      delayedYieldsToRelease: 0,
    };

    // Check for expired disasters first
    const expiredDisasters = this.state.activeDisasters.filter(
      d => currentTick >= d.endTick
    );

    for (const expired of expiredDisasters) {
      // Release delayed yields when network congestion ends
      if (expired.disaster.effect.delayYields && expired.delayedYields) {
        effects.delayedYieldsToRelease += expired.delayedYields;
      }
      
      // Notify listeners
      this.notifyListeners(expired, false);
      
      // Update disaster log
      const logEntry = this.state.disasterLog.find(
        e => e.startTick === expired.startTick && e.disaster.id === expired.disaster.id
      );
      if (logEntry) {
        logEntry.endTick = currentTick;
        logEntry.resolved = true;
      }
    }

    // Remove expired disasters
    this.state.activeDisasters = this.state.activeDisasters.filter(
      d => currentTick < d.endTick
    );

    // Check for new disasters (once per game day)
    if (this.isNewDay(currentTick)) {
      this.checkForNewDisasters(currentTick, buildingIds, effects);
    }

    return effects;
  }

  /**
   * Check if this tick starts a new game day
   */
  private isNewDay(currentTick: number): boolean {
    return currentTick % this.ticksPerDay === 0;
  }

  /**
   * Check and potentially trigger new disasters
   */
  private checkForNewDisasters(
    currentTick: number,
    buildingIds: string[],
    effects: {
      treasuryChange: number;
      buildingsToRug: string[];
      buildingsToShutdown: string[];
      delayedYieldsToRelease: number;
    }
  ): void {
    for (const disaster of Object.values(DISASTERS)) {
      // Skip if already active
      if (this.isDisasterActive(disaster.id)) {
        continue;
      }

      // Check cooldown
      const lastOccurrence = this.state.lastOccurrence[disaster.id] || 0;
      const ticksSinceLast = currentTick - lastOccurrence;
      const cooldownTicks = disaster.cooldown * this.ticksPerDay;
      
      if (ticksSinceLast < cooldownTicks) {
        continue;
      }

      // Roll for disaster
      if (Math.random() < disaster.probability) {
        this.triggerDisaster(disaster, currentTick, buildingIds, effects);
        
        // Only trigger one disaster per day
        break;
      }
    }
  }

  /**
   * Trigger a specific disaster
   */
  triggerDisaster(
    disaster: Disaster,
    currentTick: number,
    buildingIds: string[],
    effects: {
      treasuryChange: number;
      buildingsToRug: string[];
      buildingsToShutdown: string[];
      delayedYieldsToRelease: number;
    }
  ): ActiveDisaster {
    const durationTicks = disaster.duration * this.ticksPerDay;
    
    const activeDisaster: ActiveDisaster = {
      disaster,
      startTick: currentTick,
      endTick: currentTick + durationTicks,
      instanceId: `${disaster.id}_${currentTick}`,
    };

    // Apply immediate effects
    if (disaster.effect.treasuryDamage) {
      effects.treasuryChange -= disaster.effect.treasuryDamage;
    }

    if (disaster.effect.treasuryBonus) {
      const [min, max] = disaster.effect.treasuryBonus;
      const bonus = Math.floor(Math.random() * (max - min + 1)) + min;
      effects.treasuryChange += bonus;
    }

    if (disaster.effect.rugRandomBuilding && buildingIds.length > 0) {
      const randomIdx = Math.floor(Math.random() * buildingIds.length);
      effects.buildingsToRug.push(buildingIds[randomIdx]);
    }

    if (disaster.effect.buildingShutdownPercent && buildingIds.length > 0) {
      // Randomly shut down 10-20% of buildings
      const minPercent = disaster.effect.buildingShutdownPercent - 0.05;
      const maxPercent = disaster.effect.buildingShutdownPercent + 0.05;
      const shutdownPercent = minPercent + Math.random() * (maxPercent - minPercent);
      const shutdownCount = Math.ceil(buildingIds.length * shutdownPercent);
      
      // Randomly select buildings
      const shuffled = [...buildingIds].sort(() => Math.random() - 0.5);
      activeDisaster.shutdownBuildings = shuffled.slice(0, shutdownCount);
      effects.buildingsToShutdown.push(...activeDisaster.shutdownBuildings);
    }

    // Track state
    this.state.activeDisasters.push(activeDisaster);
    this.state.lastOccurrence[disaster.id] = currentTick;
    
    if (disaster.isPositive) {
      this.state.totalPositiveEventCount++;
    } else {
      this.state.totalDisasterCount++;
    }

    // Add to log
    this.state.disasterLog.push({
      disaster,
      startTick: currentTick,
      resolved: false,
    });

    // Keep log size reasonable
    if (this.state.disasterLog.length > 50) {
      this.state.disasterLog = this.state.disasterLog.slice(-50);
    }

    // Notify listeners
    this.notifyListeners(activeDisaster, true);

    return activeDisaster;
  }

  /**
   * Manually trigger a disaster (for testing or scripted events)
   */
  forceDisaster(disasterId: string, buildingIds: string[] = []): ActiveDisaster | null {
    const disaster = DISASTERS[disasterId];
    if (!disaster) return null;

    const effects = {
      treasuryChange: 0,
      buildingsToRug: [] as string[],
      buildingsToShutdown: [] as string[],
      delayedYieldsToRelease: 0,
    };

    return this.triggerDisaster(disaster, this.currentTick, buildingIds, effects);
  }

  // ---------------------------------------------------------------------------
  // LISTENERS
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to disaster events
   */
  subscribe(callback: DisasterCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(disaster: ActiveDisaster, isStarting: boolean): void {
    for (const listener of this.listeners) {
      listener(disaster, isStarting);
    }
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  /**
   * Export state for saving
   */
  exportState(): DisasterManagerState {
    return {
      ...this.state,
      activeDisasters: this.state.activeDisasters.map(d => ({
        ...d,
        disaster: { ...d.disaster },
      })),
      disasterLog: this.state.disasterLog.map(e => ({
        ...e,
        disaster: { ...e.disaster },
      })),
    };
  }

  /**
   * Import state from save
   */
  importState(data: Partial<DisasterManagerState>, currentTick: number): void {
    this.currentTick = currentTick;
    
    if (data.activeDisasters) {
      // Restore active disasters, filtering out expired ones
      this.state.activeDisasters = data.activeDisasters
        .filter(d => currentTick < d.endTick)
        .map(d => ({
          ...d,
          disaster: DISASTERS[d.disaster.id] || d.disaster,
        }));
    }

    if (data.lastOccurrence) {
      this.state.lastOccurrence = { ...data.lastOccurrence };
    }

    if (data.totalDisasterCount !== undefined) {
      this.state.totalDisasterCount = data.totalDisasterCount;
    }

    if (data.totalPositiveEventCount !== undefined) {
      this.state.totalPositiveEventCount = data.totalPositiveEventCount;
    }

    if (data.disasterLog) {
      this.state.disasterLog = data.disasterLog.map(e => ({
        ...e,
        disaster: DISASTERS[e.disaster.id] || e.disaster,
      }));
    }
  }

  /**
   * Reset state (for new game)
   */
  reset(): void {
    this.state = {
      activeDisasters: [],
      lastOccurrence: {},
      totalDisasterCount: 0,
      totalPositiveEventCount: 0,
      disasterLog: [],
    };
    this.currentTick = 0;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const disasterManager = new DisasterManager();

export default DisasterManager;
