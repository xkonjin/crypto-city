/**
 * NPC Conflict System Types for Crypto City
 *
 * Defines types for personal feuds and faction warfare.
 * NPCs can engage in conflicts ranging from arguments to full-scale vendettas.
 * Factions can declare war, form alliances, and fight battles.
 */

// ============================================================================
// Personal Conflict Types
// ============================================================================

/**
 * Types of personal conflicts between NPCs
 */
export type PersonalConflictType =
  | 'argument'   // Verbal disagreement
  | 'rivalry'    // Ongoing competition
  | 'grudge'     // Held resentment
  | 'feud'       // Active hostility
  | 'vendetta';  // Seeking revenge

/**
 * All personal conflict types as an array for iteration/validation
 */
export const ALL_PERSONAL_CONFLICT_TYPES: PersonalConflictType[] = [
  'argument',
  'rivalry',
  'grudge',
  'feud',
  'vendetta',
];

/**
 * Causes of conflict between NPCs
 */
export type ConflictCause =
  | 'insult'
  | 'theft'
  | 'betrayal'
  | 'romantic_rival'
  | 'business_dispute'
  | 'ideological'
  | 'unpaid_debt'
  | 'rug_pull';    // Crypto-specific!

/**
 * All conflict causes as an array for iteration/validation
 */
export const ALL_CONFLICT_CAUSES: ConflictCause[] = [
  'insult',
  'theft',
  'betrayal',
  'romantic_rival',
  'business_dispute',
  'ideological',
  'unpaid_debt',
  'rug_pull',
];

/**
 * An incident that escalates or de-escalates a conflict
 */
export interface ConflictIncident {
  /** When the incident occurred */
  timestamp: number;
  /** Description of what happened */
  description: string;
  /** ID of the NPC who initiated the incident */
  aggressorId: string;
  /** Effect on conflict intensity: positive = escalation, negative = de-escalation */
  effect: number;
}

/**
 * Personal conflict between two NPCs
 */
export interface PersonalConflict {
  /** Unique identifier for this conflict */
  id: string;
  /** The two NPCs involved [npcId1, npcId2] */
  participants: [string, string];
  /** Type of conflict */
  type: PersonalConflictType;
  /** What caused the conflict */
  cause: ConflictCause;
  /** Intensity level 0-100 */
  intensity: number;
  /** When the conflict started */
  startedAt: number;
  /** History of incidents */
  incidents: ConflictIncident[];
  /** Current status of the conflict */
  status: 'active' | 'cooled' | 'resolved';
}

// ============================================================================
// Faction War Types
// ============================================================================

/**
 * Causes for faction wars
 */
export type WarCause =
  | 'territory'
  | 'resources'
  | 'ideology'
  | 'revenge'
  | 'honor';

/**
 * All war causes as an array for iteration/validation
 */
export const ALL_WAR_CAUSES: WarCause[] = [
  'territory',
  'resources',
  'ideology',
  'revenge',
  'honor',
];

/**
 * Stages of war progression
 */
export type WarStage =
  | 'tensions'      // Building up
  | 'skirmishes'    // Small clashes
  | 'open_war'      // Full conflict
  | 'negotiations'  // Attempting peace
  | 'ceasefire';    // Temporary pause

/**
 * All war stages as an array for iteration/validation
 */
export const ALL_WAR_STAGES: WarStage[] = [
  'tensions',
  'skirmishes',
  'open_war',
  'negotiations',
  'ceasefire',
];

/**
 * Possible outcomes of a war
 */
export type WarOutcome =
  | 'aggressor_victory'
  | 'defender_victory'
  | 'white_peace'
  | 'mutual_destruction';

/**
 * All war outcomes as an array for iteration/validation
 */
export const ALL_WAR_OUTCOMES: WarOutcome[] = [
  'aggressor_victory',
  'defender_victory',
  'white_peace',
  'mutual_destruction',
];

/**
 * A combatant in a battle
 */
export interface Combatant {
  /** NPC ID */
  npcId: string;
  /** Current health (0-100) */
  health: number;
  /** Current morale (0-100) */
  morale: number;
  /** Combat skill level (0-1) */
  combatSkill: number;
  /** Equipment being used */
  equipment: string[];
}

/**
 * A battle in a faction war
 */
export interface Battle {
  /** Unique identifier */
  id: string;
  /** Location of the battle */
  location: { x: number; y: number };
  /** When the battle occurred */
  timestamp: number;
  /** Attacking combatants */
  attackers: Combatant[];
  /** Defending combatants */
  defenders: Combatant[];
  /** Battle result */
  result: 'attacker_win' | 'defender_win' | 'draw';
  /** Casualties from the battle */
  casualties: { attackers: number; defenders: number };
}

/**
 * A faction war
 */
export interface FactionWar {
  /** Unique identifier */
  id: string;
  /** Faction that started the war */
  aggressorId: string;
  /** Faction being attacked */
  defenderId: string;
  /** Allied factions and which side they're on */
  allies: Record<string, 'aggressor' | 'defender'>;
  /** Why the war started */
  cause: WarCause;
  /** Current stage of the war */
  stage: WarStage;
  /** When the war started */
  startedAt: number;
  /** Battles that have occurred */
  battles: Battle[];
  /** Total casualties */
  casualties: { aggressor: number; defender: number };
  /** Current war status */
  status: 'active' | 'ceasefire' | 'ended';
  /** Final outcome (if ended) */
  outcome?: WarOutcome;
}

// ============================================================================
// Hitchhiker's Guide Descriptions
// ============================================================================

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for conflicts
 * Sardonic, educational, and crypto-native
 */
export const CONFLICT_DESCRIPTIONS: Record<string, string> = {
  argument: "Two parties loudly disagreeing about who is more wrong.",
  rivalry: "Like friendship, but with more spite and portfolio comparisons.",
  grudge: "Storing resentment for future use. Crypto's favorite investment strategy.",
  feud: "When 'agree to disagree' escalates to 'never speaking again'.",
  vendetta: "Revenge, served cold, like your portfolio in a bear market.",
  rug_pull: "The ultimate betrayal. Trust deleted. Lawyers contacted.",
  war: "When governance proposals fail and things get physical.",
  ceasefire: "Temporarily not fighting. Usually to accumulate more weapons.",
  battle: "The kinetic resolution of ideological differences. Messy but effective.",
  // Causes
  insult: "Someone said something mean. This will not stand.",
  theft: "Someone took something that wasn't theirs. Classic.",
  betrayal: "The oldest story in crypto: trust, followed by regret.",
  romantic_rival: "Two people wanting the same person. Ancient problem, modern drama.",
  business_dispute: "Money makes enemies of partners. Always has, always will.",
  ideological: "Disagreeing about abstract concepts with real-world violence.",
  unpaid_debt: "Promises were made. Promises were broken. Now it's personal.",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a default combatant from an NPC ID
 *
 * @param npcId - The NPC's ID
 * @param combatSkill - Optional combat skill (defaults to random 0.3-0.7)
 * @returns A new Combatant object
 */
export function createDefaultCombatant(
  npcId: string,
  combatSkill?: number
): Combatant {
  return {
    npcId,
    health: 100,
    morale: 100,
    combatSkill: combatSkill ?? 0.3 + Math.random() * 0.4,
    equipment: [],
  };
}

/**
 * Intensity thresholds for conflict type escalation
 */
export const CONFLICT_TYPE_THRESHOLDS: Record<PersonalConflictType, number> = {
  argument: 0,
  rivalry: 25,
  grudge: 45,
  feud: 65,
  vendetta: 85,
};

/**
 * Starting intensity by cause (some causes start more severe)
 */
export const CAUSE_STARTING_INTENSITY: Record<ConflictCause, number> = {
  insult: 15,
  theft: 35,
  betrayal: 55,
  romantic_rival: 30,
  business_dispute: 25,
  ideological: 20,
  unpaid_debt: 40,
  rug_pull: 70, // Rug pulls are serious!
};

/**
 * Get the conflict type based on intensity
 */
export function getConflictTypeFromIntensity(intensity: number): PersonalConflictType {
  if (intensity >= CONFLICT_TYPE_THRESHOLDS.vendetta) return 'vendetta';
  if (intensity >= CONFLICT_TYPE_THRESHOLDS.feud) return 'feud';
  if (intensity >= CONFLICT_TYPE_THRESHOLDS.grudge) return 'grudge';
  if (intensity >= CONFLICT_TYPE_THRESHOLDS.rivalry) return 'rivalry';
  return 'argument';
}
