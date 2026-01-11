/**
 * NPC Needs System
 * 
 * Implements The Sims-style needs where NPCs have motives that decay over time.
 * Each need has a current value (0-100), decay rate, critical threshold, and weight.
 * 
 * When needs drop below their critical threshold, they become urgent and
 * significantly affect the NPC's behavior through the Utility AI scoring system.
 */

/**
 * Represents a single need (motive) for an NPC.
 * Based on The Sims needs architecture.
 */
export interface Need {
  /** Current value (0-100) */
  current: number;
  /** Maximum value (usually 100) */
  max: number;
  /** Points to decay per game minute */
  decayRate: number;
  /** Value below which this need becomes urgent */
  criticalThreshold: number;
  /** Priority multiplier for Utility AI scoring */
  weight: number;
}

/**
 * All needs for an NPC.
 * Crypto City adds wealth and purpose as crypto-specific needs.
 */
export interface NPCNeeds {
  /** Satisfied by: eating at restaurants/home */
  hunger: Need;
  /** Satisfied by: sleeping at home */
  energy: Need;
  /** Satisfied by: conversations */
  social: Need;
  /** Satisfied by: entertainment venues */
  fun: Need;
  /** Satisfied by: earning/trading (crypto-specific) */
  wealth: Need;
  /** Satisfied by: working */
  purpose: Need;
}

/** Type for need names */
export type NeedType = keyof NPCNeeds;

/**
 * Default decay rates per game minute.
 * 
 * Design rationale:
 * - hunger (0.5): Fastest decay - food is a constant need
 * - fun (0.4): Entertainment needs frequent refresh
 * - energy (0.3): Moderate - tied to sleep cycle
 * - social (0.2): Slower - social needs build gradually
 * - purpose (0.15): Slow - existential needs persist
 * - wealth (0.1): Slowest - accumulation is satisfying
 */
export const DECAY_RATES: Record<NeedType, number> = {
  hunger: 0.5,
  energy: 0.3,
  social: 0.2,
  fun: 0.4,
  wealth: 0.1,
  purpose: 0.15,
};

/**
 * Critical thresholds (below = urgent).
 * When a need drops below its threshold, the NPC prioritizes satisfying it.
 */
export const CRITICAL_THRESHOLDS: Record<NeedType, number> = {
  hunger: 20,
  energy: 15,
  social: 25,
  fun: 20,
  wealth: 30,
  purpose: 25,
};

/**
 * Default weights for Utility AI scoring.
 * Higher weight = higher priority when calculating action scores.
 */
export const DEFAULT_WEIGHTS: Record<NeedType, number> = {
  hunger: 1.2,    // Slightly higher - survival need
  energy: 1.1,    // Important for functioning
  social: 0.9,    // Can be delayed
  fun: 0.8,       // Quality of life
  wealth: 1.0,    // Core crypto mechanic
  purpose: 0.9,   // Personal fulfillment
};

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for each need.
 * Sardonic, educational, and crypto-native.
 */
export const NEED_DESCRIPTIONS: Record<NeedType, string> = {
  hunger: "The primal urge that reminds even crypto millionaires they can't eat Bitcoin. Yet.",
  energy: "What separates a functioning degen from one who fell asleep during the airdrop.",
  social: "The paradoxical need for human connection in a trustless, permissionless world.",
  fun: "That which keeps the existential dread at bay between pump and dump cycles.",
  wealth: "The number that must always go up. Always. No exceptions. WAGMI.",
  purpose: "The quest for meaning beyond number-go-up, though most haven't found it yet.",
};

/**
 * Activities that satisfy each need type.
 */
export const NEED_SATISFIERS: Record<NeedType, string[]> = {
  hunger: ['eating_restaurant', 'eating_home', 'snacking', 'coffee_shop'],
  energy: ['sleeping_home', 'napping', 'meditation', 'energy_drink'],
  social: ['conversation', 'party', 'discord_chat', 'dao_meeting', 'networking'],
  fun: ['entertainment_venue', 'gaming', 'club', 'browsing_memes', 'nft_gallery'],
  wealth: ['trading', 'earning', 'staking', 'yield_farming', 'airdrop_hunting'],
  purpose: ['working', 'building', 'contributing', 'mentoring', 'creating'],
};

/**
 * Create a Need with optional overrides.
 */
export function createNeed(
  overrides: Partial<Need> = {},
  needType?: NeedType
): Need {
  const type = needType || 'hunger';
  return {
    current: overrides.current ?? 75,
    max: overrides.max ?? 100,
    decayRate: overrides.decayRate ?? DECAY_RATES[type],
    criticalThreshold: overrides.criticalThreshold ?? CRITICAL_THRESHOLDS[type],
    weight: overrides.weight ?? DEFAULT_WEIGHTS[type],
  };
}

/**
 * Create default NPCNeeds with randomized initial values (50-100).
 * Called when spawning a new NPC.
 */
export function createDefaultNeeds(): NPCNeeds {
  const randomInitial = () => Math.floor(Math.random() * 51) + 50; // 50-100

  return {
    hunger: {
      current: randomInitial(),
      max: 100,
      decayRate: DECAY_RATES.hunger,
      criticalThreshold: CRITICAL_THRESHOLDS.hunger,
      weight: DEFAULT_WEIGHTS.hunger,
    },
    energy: {
      current: randomInitial(),
      max: 100,
      decayRate: DECAY_RATES.energy,
      criticalThreshold: CRITICAL_THRESHOLDS.energy,
      weight: DEFAULT_WEIGHTS.energy,
    },
    social: {
      current: randomInitial(),
      max: 100,
      decayRate: DECAY_RATES.social,
      criticalThreshold: CRITICAL_THRESHOLDS.social,
      weight: DEFAULT_WEIGHTS.social,
    },
    fun: {
      current: randomInitial(),
      max: 100,
      decayRate: DECAY_RATES.fun,
      criticalThreshold: CRITICAL_THRESHOLDS.fun,
      weight: DEFAULT_WEIGHTS.fun,
    },
    wealth: {
      current: randomInitial(),
      max: 100,
      decayRate: DECAY_RATES.wealth,
      criticalThreshold: CRITICAL_THRESHOLDS.wealth,
      weight: DEFAULT_WEIGHTS.wealth,
    },
    purpose: {
      current: randomInitial(),
      max: 100,
      decayRate: DECAY_RATES.purpose,
      criticalThreshold: CRITICAL_THRESHOLDS.purpose,
      weight: DEFAULT_WEIGHTS.purpose,
    },
  };
}
