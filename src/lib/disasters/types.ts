/**
 * Player-Triggered Disaster Types
 * 
 * "In the beginning the Universe was created. This has made a lot of people very
 * angry and been widely regarded as a bad move. The same could be said for letting
 * players trigger disasters with USDT₮ payments."
 * 
 * These disasters are distinct from the random natural disasters in ../disasters.ts.
 * Players can pay to unleash chaos upon their own (or others') cities.
 * 
 * @see ../disasters.ts for natural/random disaster system
 */

import type { CryptoChain, CryptoCategory } from '@/games/isocity/crypto/types';
import type { Address, Hex } from 'viem';

// =============================================================================
// DISASTER TYPE DEFINITIONS
// =============================================================================

/**
 * Types of damage a disaster can cause.
 * Each has different effects on buildings, NPCs, and economy.
 */
export type DisasterDamageType =
  | 'npc_panic'           // NPCs get panicked mood, flee behavior
  | 'building_destroy'    // Rug-pull style building destruction
  | 'spread_damage'       // Fire-like spreading to adjacent buildings
  | 'random_damage'       // Random buildings take damage
  | 'market_manipulation' // Affects yields and sentiment across all buildings
  | 'chain_offline'       // Buildings on specific chain go offline
  | 'exchange_raid';      // Exchange buildings shut down

/**
 * A player-triggerable disaster definition.
 * Unlike natural disasters, these require USDT₮ payment to trigger.
 */
export interface PlayerDisaster {
  /** Unique identifier */
  id: string;
  /** Display name (with appropriate crypto flair) */
  name: string;
  /** Hitchhiker's Guide-style description */
  description: string;
  /** Icon emoji for UI */
  icon: string;
  /** Base cost in USDT₮ (6 decimals in actual units) */
  baseCostUSDT: number;
  /** Type of damage this disaster causes */
  damageType: DisasterDamageType;
  /** Duration in game seconds */
  durationSeconds: number;
  /** Per-type cooldown in game seconds (same disaster can't be triggered twice rapidly) */
  cooldownSeconds: number;
  /** Affected chains (if applicable) */
  affectedChains?: CryptoChain[];
  /** Affected building categories (if applicable) */
  affectedCategories?: CryptoCategory[];
  /** Maximum percentage of buildings that can be affected (0.1 = 10%) */
  maxBuildingsAffected: number;
  /** Cobie quote for when this disaster triggers */
  cobieQuote: string;
}

/**
 * The canonical list of player-triggerable disasters.
 * 
 * "The major difference between a thing that might go wrong and a thing that
 * cannot possibly go wrong is that when a thing that cannot possibly go wrong
 * goes wrong it usually turns out to be impossible to get at or repair."
 */
export const PLAYER_DISASTERS: Record<string, PlayerDisaster> = {
  market_crash: {
    id: 'market_crash',
    name: 'Market Crash',
    description: 'Trigger a market-wide panic. NPCs will flee buildings, hide in homes, and generally act like someone just said "regulation" at a crypto conference.',
    icon: '📉',
    baseCostUSDT: 5,
    damageType: 'npc_panic',
    durationSeconds: 300, // 5 minutes
    cooldownSeconds: 1800, // 30 minutes per-type cooldown
    maxBuildingsAffected: 0.1,
    cobieQuote: 'Blood in the streets. Time to be greedy... or cause more blood.',
  },

  rug_pull: {
    id: 'rug_pull',
    name: 'Rug Pull',
    description: 'The classic exit scam. One random building gets absolutely devastated. Developers are working on a fix (they are not).',
    icon: '🧹',
    baseCostUSDT: 10,
    damageType: 'building_destroy',
    durationSeconds: 600, // 10 minutes (for repair period)
    cooldownSeconds: 1800,
    maxBuildingsAffected: 0.05, // Single building usually
    cobieQuote: 'Not your keys, not your coins. Not your building either, apparently.',
  },

  fire: {
    id: 'fire',
    name: 'Electrical Fire',
    description: 'Mining rigs finally achieved their destiny: catching fire. Spreads to nearby buildings if not contained. Totally not because someone overloaded the power grid.',
    icon: '🔥',
    baseCostUSDT: 5,
    damageType: 'spread_damage',
    durationSeconds: 300,
    cooldownSeconds: 900, // 15 min cooldown
    maxBuildingsAffected: 0.15, // Can spread to 15%
    cobieQuote: 'This is fine. Everything is fine.',
  },

  earthquake: {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'The ground shakes. Random buildings take damage. Some say it was caused by the collective weight of unfulfilled promises in the DeFi sector.',
    icon: '🌋',
    baseCostUSDT: 25,
    damageType: 'random_damage',
    durationSeconds: 1200, // 20 minutes
    cooldownSeconds: 3600, // 1 hour cooldown
    maxBuildingsAffected: 0.2, // Up to 20% affected
    cobieQuote: 'Shake out the weak hands. Literally.',
  },

  whale_dump: {
    id: 'whale_dump',
    name: 'Whale Dump',
    description: 'A mysterious whale has decided to market sell everything. Yields crash, sentiment plummets, and everyone pretends they saw it coming.',
    icon: '🐋',
    baseCostUSDT: 12,
    damageType: 'market_manipulation',
    durationSeconds: 450, // 7.5 minutes
    cooldownSeconds: 1200, // 20 min cooldown
    maxBuildingsAffected: 0.1,
    cobieQuote: 'Someone just market sold... a lot. Buy the dip?',
  },

  // === CHAIN-SPECIFIC DISASTERS ===
  
  fifty_one_attack: {
    id: 'fifty_one_attack',
    name: '51% Attack',
    description: 'Someone accumulated enough hash power to rewrite history. All buildings on a specific chain go offline while "consensus is reached."',
    icon: '⚔️',
    baseCostUSDT: 20,
    damageType: 'chain_offline',
    durationSeconds: 900, // 15 minutes
    cooldownSeconds: 2700, // 45 min cooldown
    affectedChains: ['ethereum', 'bitcoin', 'solana', 'arbitrum'], // Can target any chain
    maxBuildingsAffected: 0.25, // All buildings on that chain
    cobieQuote: 'Decentralization is a spectrum. Today it\'s at the bad end.',
  },

  sec_raid: {
    id: 'sec_raid',
    name: 'SEC Raid',
    description: 'The Securities and Exchange Commission has entered the chat. Exchange buildings are temporarily shut down while lawyers earn their fees.',
    icon: '🏛️',
    baseCostUSDT: 15,
    damageType: 'exchange_raid',
    durationSeconds: 600, // 10 minutes
    cooldownSeconds: 2400, // 40 min cooldown
    affectedCategories: ['exchange'],
    maxBuildingsAffected: 0.5, // Half of exchanges
    cobieQuote: 'The suits are here. Act natural. Actually, maybe don\'t act at all.',
  },
};

// =============================================================================
// BALANCE CONFIGURATION
// =============================================================================

/**
 * Balance mechanics to prevent griefing and ensure fair play.
 * 
 * "The Guide is definitive. Reality is frequently inaccurate."
 */
export interface DisasterBalanceConfig {
  /** Global cooldown between ANY disaster (seconds) */
  globalCooldownSeconds: number;
  /** Per-disaster-type cooldown (seconds) - stacks with global */
  perTypeCooldownSeconds: number;
  /** Base cost multiplier (adjusts all disaster costs) */
  baseCostMultiplier: number;
  /** Additional cost per city population (USDT₮ per 100 residents) */
  costPerHundredPopulation: number;
  /** Maximum percentage of buildings that can be affected by any disaster */
  maxBuildingsAffectedCap: number;
  /** NPCs always survive disasters (they panic but don't despawn) */
  npcRecoveryGuarantee: boolean;
  /** New player shield duration in seconds (24h default) */
  newPlayerShieldSeconds: number;
  /** Minimum seconds before same building can be targeted again */
  sameTargetCooldownSeconds: number;
  /** Minimum city age (in seconds) before disasters can be triggered */
  minimumCityAgeSeconds: number;
}

/**
 * Default balance configuration.
 * These values are tuned to prevent griefing while allowing strategic disaster use.
 */
export const DEFAULT_BALANCE_CONFIG: DisasterBalanceConfig = {
  globalCooldownSeconds: 300,         // 5 min between any disaster
  perTypeCooldownSeconds: 1800,       // 30 min for same type
  baseCostMultiplier: 1.0,            // Normal costs
  costPerHundredPopulation: 0.01,     // Scales with city size
  maxBuildingsAffectedCap: 0.1,       // 10% max damage cap
  npcRecoveryGuarantee: true,         // NPCs always survive
  newPlayerShieldSeconds: 86400,      // 24 hour protection
  sameTargetCooldownSeconds: 3600,    // 1 hour per building
  minimumCityAgeSeconds: 3600,        // Must play 1 hour before triggering
};

// =============================================================================
// ACTIVE DISASTER STATE
// =============================================================================

/**
 * State of an actively occurring disaster.
 */
export interface ActivePlayerDisaster {
  /** Unique instance ID */
  instanceId: string;
  /** The disaster definition */
  disaster: PlayerDisaster;
  /** Address of who triggered this disaster */
  triggeredBy: Address;
  /** USDT₮ amount paid (in atomic units, 6 decimals) */
  paidAmount: bigint;
  /** Transaction hash for the payment */
  paymentTxHash?: Hex;
  /** Timestamp when disaster started */
  startedAt: number;
  /** Timestamp when disaster ends */
  endsAt: number;
  /** Building IDs affected by this disaster */
  affectedBuildingIds: string[];
  /** NPC IDs affected (for mood updates) */
  affectedNpcIds: string[];
  /** Whether disaster is still active */
  isActive: boolean;
  /** Accumulated damage value (for repair calculations) */
  totalDamage: number;
  /** Specific chain affected (for chain_offline type) */
  targetChain?: CryptoChain;
}

/**
 * A building damaged by a disaster, awaiting repair.
 */
export interface DamagedBuildingFromDisaster {
  /** Building instance ID */
  buildingId: string;
  /** Building definition ID */
  buildingDefId: string;
  /** Building name for display */
  buildingName: string;
  /** Grid position X */
  gridX: number;
  /** Grid position Y */
  gridY: number;
  /** Which disaster caused the damage */
  disasterId: string;
  /** Disaster instance ID */
  disasterInstanceId: string;
  /** When the damage occurred */
  damagedAt: number;
  /** Original building cost (repair = 25% of this) */
  originalCost: number;
  /** Repair cost in USDT₮ */
  repairCostUSDT: number;
  /** Damage severity (0-1, affects repair cost) */
  severity: number;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

/**
 * Request to trigger a disaster.
 */
export interface TriggerDisasterRequest {
  /** Which disaster to trigger */
  disasterId: string;
  /** Who is paying for the disaster */
  triggerAddress: Address;
  /** Target chain (for chain_offline disasters) */
  targetChain?: CryptoChain;
  /** Specific building to target (optional, for rug_pull) */
  targetBuildingId?: string;
}

/**
 * Result of triggering a disaster.
 */
export interface TriggerDisasterResult {
  success: boolean;
  /** Active disaster instance if successful */
  disaster?: ActivePlayerDisaster;
  /** Error message if failed */
  error?: string;
  /** Cost that was charged (in atomic USDT₮ units) */
  costCharged?: bigint;
  /** Transaction hash */
  txHash?: Hex;
}

/**
 * Request to repair a building.
 */
export interface RepairBuildingRequest {
  /** Building instance ID to repair */
  buildingId: string;
  /** Who is paying for repairs */
  payerAddress: Address;
}

/**
 * Result of repairing a building.
 */
export interface RepairBuildingResult {
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Cost that was charged (in atomic USDT₮ units) */
  costCharged?: bigint;
  /** Transaction hash */
  txHash?: Hex;
}

// =============================================================================
// STATE TYPES
// =============================================================================

/**
 * Full state of the player disaster system.
 */
export interface PlayerDisasterSystemState {
  /** Currently active disasters */
  activeDisasters: ActivePlayerDisaster[];
  /** Buildings damaged and awaiting repair */
  damagedBuildings: DamagedBuildingFromDisaster[];
  /** Last global disaster trigger timestamp */
  lastGlobalDisasterTime: number;
  /** Last trigger time for each disaster type */
  lastDisasterTimeByType: Record<string, number>;
  /** Building IDs and when they were last targeted */
  lastTargetTimeByBuilding: Record<string, number>;
  /** Total USDT₮ spent on disasters (atomic units) */
  totalDisasterSpend: bigint;
  /** Total USDT₮ spent on repairs (atomic units) */
  totalRepairSpend: bigint;
  /** City creation timestamp (for new player shield) */
  cityCreatedAt: number;
  /** Balance configuration (can be adjusted for events) */
  balanceConfig: DisasterBalanceConfig;
}

/**
 * Initial state for a new city.
 */
export function createInitialDisasterState(): PlayerDisasterSystemState {
  return {
    activeDisasters: [],
    damagedBuildings: [],
    lastGlobalDisasterTime: 0,
    lastDisasterTimeByType: {},
    lastTargetTimeByBuilding: {},
    totalDisasterSpend: BigInt(0),
    totalRepairSpend: BigInt(0),
    cityCreatedAt: Date.now(),
    balanceConfig: { ...DEFAULT_BALANCE_CONFIG },
  };
}
