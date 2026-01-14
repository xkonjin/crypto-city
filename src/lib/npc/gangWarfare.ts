/**
 * Gang Warfare Types for Crypto City NPCs
 *
 * Defines types for territory control, turf wars, raids, protection rackets, and ambushes.
 * Factions can fight for territory, conduct raids, and run protection schemes.
 */

// ============================================================================
// Grid and Territory Types
// ============================================================================

/**
 * Defines the rectangular bounds of a territory on the game grid
 */
export interface GridBounds {
  /** Minimum X coordinate (inclusive) */
  minX: number;
  /** Minimum Y coordinate (inclusive) */
  minY: number;
  /** Maximum X coordinate (inclusive) */
  maxX: number;
  /** Maximum Y coordinate (inclusive) */
  maxY: number;
}

/**
 * A territory that can be controlled by a faction
 */
export interface Territory {
  /** Unique identifier for this territory */
  id: string;
  /** The grid boundaries of this territory */
  gridBounds: GridBounds;
  /** Faction ID that controls this territory, or null if unclaimed */
  controlledBy: string | null;
  /** Faction IDs currently contesting this territory */
  contestedBy: string[];
  /** Bonus income generated from controlling this territory */
  incomeBonus: number;
  /** Bonus influence from controlling this territory */
  influenceBonus: number;
}

// ============================================================================
// Turf War Types
// ============================================================================

/**
 * Stages of a turf war progression
 */
export type TurfWarStage =
  | 'intimidation'   // Initial threats and posturing
  | 'skirmishes'     // Small clashes
  | 'all_out_war'    // Full-scale fighting
  | 'conquest'       // Final push to take territory
  | 'resolved';      // War is over

/**
 * All turf war stages as an array for iteration/validation
 */
export const ALL_TURF_WAR_STAGES: TurfWarStage[] = [
  'intimidation',
  'skirmishes',
  'all_out_war',
  'conquest',
  'resolved',
];

/**
 * A small clash during a turf war
 */
export interface Skirmish {
  /** Unique identifier */
  id: string;
  /** NPC IDs on the attacking side */
  attackerIds: string[];
  /** NPC IDs on the defending side */
  defenderIds: string[];
  /** When the skirmish occurred */
  timestamp: number;
  /** Which side won */
  winner: 'attacker' | 'defender' | 'draw';
  /** Casualties on each side */
  casualties: { attackers: number; defenders: number };
}

/**
 * A turf war between two factions over territory
 */
export interface TurfWar {
  /** Unique identifier for this turf war */
  id: string;
  /** Faction ID of the attacker */
  attackerFactionId: string;
  /** Faction ID of the defender */
  defenderFactionId: string;
  /** Territory being fought over */
  territoryId: string;
  /** Current stage of the war */
  stage: TurfWarStage;
  /** When the war started */
  startedAt: number;
  /** Record of skirmishes during the war */
  skirmishes: Skirmish[];
}

// ============================================================================
// Raid Types
// ============================================================================

/**
 * Possible outcomes of a raid
 */
export type RaidOutcome = 'pending' | 'success' | 'failure' | 'partial';

/**
 * A raid on a building
 */
export interface Raid {
  /** Unique identifier */
  id: string;
  /** NPC IDs participating in the raid */
  attackerIds: string[];
  /** Building being targeted */
  targetBuildingId: string;
  /** When the raid was initiated */
  timestamp: number;
  /** Result of the raid */
  outcome: RaidOutcome;
  /** Value of loot obtained (if successful) */
  lootValue: number;
}

// ============================================================================
// Protection Racket Types
// ============================================================================

/**
 * A protection racket run by a faction
 */
export interface ProtectionRacket {
  /** Unique identifier */
  id: string;
  /** Faction running the racket */
  factionId: string;
  /** Buildings under protection */
  buildingIds: string[];
  /** Percentage of income taken as protection fee (0-1) */
  feePercentage: number;
  /** NPC IDs assigned as enforcers */
  enforcerIds: string[];
}

// ============================================================================
// Ambush Types
// ============================================================================

/**
 * A location on the grid
 */
export interface GridLocation {
  x: number;
  y: number;
}

/**
 * An ambush attack
 */
export interface Ambush {
  /** Unique identifier */
  id: string;
  /** NPC IDs participating in the ambush */
  attackerIds: string[];
  /** NPC being targeted */
  targetId: string;
  /** Where the ambush occurred */
  location: GridLocation;
  /** Whether the ambush was successful */
  success: boolean;
  /** Number of casualties (attackers if failed, can include target) */
  casualties: number;
}

// ============================================================================
// Hitchhiker's Guide Descriptions
// ============================================================================

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for gang warfare
 * Sardonic, educational, and crypto-native
 */
export const GANG_WARFARE_DESCRIPTIONS: Record<string, string> = {
  // Stages
  intimidation: "The art of looking scary without actually doing anything. Like posting bear market memes.",
  skirmishes: "Small fights that nobody wins but everyone talks about. The crypto equivalent of Twitter beef.",
  all_out_war: "When keyboard warriors finally touch grass and it touches back. Violently.",
  conquest: "The final boss battle, except the boss is real estate and the reward is taxes.",
  resolved: "It's over. Someone won. Nobody remembers why it started. Classic crypto.",

  // Concepts
  territory: "Digital real estate that people fight over. Just like the metaverse, but with actual consequences.",
  raid: "Breaking and entering, but make it decentralized. The OG flash loan attack.",
  protection_racket: "Pay us or bad things happen. The original smart contract, enforced by muscle.",
  ambush: "Surprise! Your exit liquidity just became entrance liquidity. For someone else.",
  turf_war: "When HODLing territory becomes a contact sport.",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a default territory with the given parameters
 *
 * @param params - Required and optional parameters for the territory
 * @returns A new Territory object
 */
export function createDefaultTerritory(params: {
  id: string;
  gridBounds: GridBounds;
  controlledBy?: string | null;
  contestedBy?: string[];
  incomeBonus?: number;
  influenceBonus?: number;
}): Territory {
  return {
    id: params.id,
    gridBounds: params.gridBounds,
    controlledBy: params.controlledBy ?? null,
    contestedBy: params.contestedBy ?? [],
    incomeBonus: params.incomeBonus ?? 0,
    influenceBonus: params.influenceBonus ?? 0,
  };
}

/**
 * Calculate the size of a territory in grid cells
 *
 * @param bounds - The grid bounds
 * @returns Number of grid cells in the territory
 */
export function calculateTerritorySize(bounds: GridBounds): number {
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  return width * height;
}

/**
 * Generate a unique ID for gang warfare entities
 */
export function generateGangWarfareId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
