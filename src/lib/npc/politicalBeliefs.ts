/**
 * NPC Political Beliefs System
 * 
 * Defines political beliefs that NPCs develop based on their personality,
 * experiences, and social network. These beliefs affect faction alignment,
 * voting behavior, and political dialogue.
 * 
 * Belief Dimensions (0-1 scale):
 * - wealthRedistribution: 0=laissez-faire, 1=full redistribution
 * - regulationSupport: 0=anarchy, 1=heavy regulation
 * - centralAuthority: 0=decentralized, 1=centralized
 * - democraticParticipation: 0=apathetic, 1=engaged
 * - decentralizationPurity: 0=pragmatist, 1=purist
 * - privacyImportance: 0=transparent, 1=privacy maximalist
 */

/**
 * All belief types for iteration
 */
export type BeliefType =
  | 'wealthRedistribution'
  | 'regulationSupport'
  | 'centralAuthority'
  | 'democraticParticipation'
  | 'decentralizationPurity'
  | 'privacyImportance';

/**
 * Array of all belief types for iteration
 */
export const ALL_BELIEF_TYPES: BeliefType[] = [
  'wealthRedistribution',
  'regulationSupport',
  'centralAuthority',
  'democraticParticipation',
  'decentralizationPurity',
  'privacyImportance',
];

/**
 * Political beliefs interface with 6 belief dimensions.
 * All values are 0-1 where 0.5 is neutral/centrist.
 */
export interface PoliticalBeliefs {
  /** 0=laissez-faire free market, 1=full wealth redistribution */
  wealthRedistribution: number;
  /** 0=complete anarchy/no rules, 1=heavy regulation */
  regulationSupport: number;
  /** 0=fully decentralized, 1=centralized authority */
  centralAuthority: number;
  /** 0=apathetic/non-voter, 1=highly engaged in governance */
  democraticParticipation: number;
  /** 0=pragmatist (whatever works), 1=purist (decentralization at all costs) */
  decentralizationPurity: number;
  /** 0=full transparency, 1=privacy maximalist */
  privacyImportance: number;
}

/**
 * Source types for belief influences
 */
export type InfluenceSource =
  | 'personality'  // Initial beliefs from personality traits
  | 'experience'   // Memories/events that shaped beliefs
  | 'social'       // Influence from friends/social network
  | 'economic'     // Wealth changes affecting beliefs
  | 'faction';     // Faction membership influence

/**
 * Tracks the source and magnitude of belief influences.
 * Used for understanding why an NPC holds certain beliefs.
 */
export interface BeliefInfluence {
  /** Unique identifier for this influence record */
  id: string;
  /** Type of influence source */
  source: InfluenceSource;
  /** ID of the source (memory ID, NPC ID, etc.) */
  sourceId: string;
  /** Which belief was affected */
  belief: BeliefType;
  /** Strength of influence: -1 (decreased) to +1 (increased) */
  strength: number;
  /** When this influence occurred */
  timestamp: number;
}

/**
 * Input type for creating belief influences
 */
export interface BeliefInfluenceInput {
  source: InfluenceSource;
  sourceId: string;
  belief: BeliefType;
  strength: number;
}

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for each belief dimension.
 * Sardonic, educational, and crypto-native.
 */
export const BELIEF_DESCRIPTIONS: Record<BeliefType, { low: string; high: string }> = {
  wealthRedistribution: {
    low: "Believes the free market is the only honest arbiter of value. Probably owns at least three hardware wallets.",
    high: "Thinks everyone should share equally, which is rich coming from someone who definitely hasn't shared their seed phrase.",
  },
  regulationSupport: {
    low: "Code is the only law that matters. Has strong opinions about permissionless systems.",
    high: "Actually reads the terms of service. Wants the government to protect them from their own poor decisions.",
  },
  centralAuthority: {
    low: "Would rather trust a smart contract written by an anonymous developer than any institution with a physical address.",
    high: "Prefers someone competent to be in charge. Has clearly never worked in corporate.",
  },
  democraticParticipation: {
    low: "Governance tokens are for voting? They're for speculation, obviously.",
    high: "Participates in every DAO vote including the ones about font choices. Democracy is beautiful.",
  },
  decentralizationPurity: {
    low: "Will use centralized solutions if they're convenient. Pragmatism over ideology.",
    high: "Runs their own node and judges you for using Infura. Probably has opinions about running validators.",
  },
  privacyImportance: {
    low: "Has nothing to hide and assumes the same of everyone else. Probably reuses credentials everywhere.",
    high: "Uses Tor to check the weather. Their threat model includes 'everyone'.",
  },
};

/**
 * Generate unique ID for belief influence
 */
function generateInfluenceId(): string {
  return `inf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clamp a value to the 0-1 range
 */
function clampBelief(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Clamp influence strength to -1 to 1 range
 */
function clampInfluenceStrength(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/**
 * Create a default political beliefs object with neutral values.
 * All beliefs default to 0.5 (centrist/neutral).
 * 
 * @param overrides - Optional overrides for specific beliefs
 * @returns PoliticalBeliefs with defaults and overrides applied
 */
export function createDefaultPoliticalBeliefs(
  overrides: Partial<PoliticalBeliefs> = {}
): PoliticalBeliefs {
  return {
    wealthRedistribution: clampBelief(overrides.wealthRedistribution ?? 0.5),
    regulationSupport: clampBelief(overrides.regulationSupport ?? 0.5),
    centralAuthority: clampBelief(overrides.centralAuthority ?? 0.5),
    democraticParticipation: clampBelief(overrides.democraticParticipation ?? 0.5),
    decentralizationPurity: clampBelief(overrides.decentralizationPurity ?? 0.5),
    privacyImportance: clampBelief(overrides.privacyImportance ?? 0.5),
  };
}

/**
 * Create a belief influence record with auto-generated fields.
 * 
 * @param input - The influence input data
 * @returns Complete BeliefInfluence with generated ID and timestamp
 */
export function createBeliefInfluence(input: BeliefInfluenceInput): BeliefInfluence {
  return {
    id: generateInfluenceId(),
    source: input.source,
    sourceId: input.sourceId,
    belief: input.belief,
    strength: clampInfluenceStrength(input.strength),
    timestamp: Date.now(),
  };
}

/**
 * Get a natural language description of a belief value.
 * 
 * @param belief - The belief type to describe
 * @param value - The belief value (0-1)
 * @returns A Hitchhiker's Guide style description
 */
export function describeBeliefValue(belief: BeliefType, value: number): string {
  const desc = BELIEF_DESCRIPTIONS[belief];
  if (value < 0.4) {
    return desc.low;
  } else if (value > 0.6) {
    return desc.high;
  }
  return `Holds moderate views on ${belief}. Hasn't picked a side yet, which is suspicious in itself.`;
}

/**
 * Calculate the distance between two belief sets.
 * Lower values mean more similar beliefs.
 * 
 * @param a - First belief set
 * @param b - Second belief set
 * @returns Euclidean distance between the beliefs (0 = identical)
 */
export function calculateBeliefDistance(a: PoliticalBeliefs, b: PoliticalBeliefs): number {
  let sumSquares = 0;
  for (const belief of ALL_BELIEF_TYPES) {
    sumSquares += Math.pow(a[belief] - b[belief], 2);
  }
  return Math.sqrt(sumSquares);
}

/**
 * Calculate belief similarity as a 0-1 score.
 * 1 = identical, 0 = maximally different.
 * 
 * @param a - First belief set
 * @param b - Second belief set
 * @returns Similarity score (0-1)
 */
export function calculateBeliefSimilarity(a: PoliticalBeliefs, b: PoliticalBeliefs): number {
  // Maximum possible distance is sqrt(6) ≈ 2.449 (all beliefs at opposite extremes)
  const maxDistance = Math.sqrt(ALL_BELIEF_TYPES.length);
  const distance = calculateBeliefDistance(a, b);
  return 1 - (distance / maxDistance);
}

/**
 * Check if two NPCs have compatible political beliefs.
 * Used for determining if they would get along politically.
 * 
 * @param a - First belief set
 * @param b - Second belief set
 * @param threshold - Minimum similarity to be considered compatible (default 0.7)
 * @returns True if beliefs are compatible
 */
export function areBeliefsCompatible(
  a: PoliticalBeliefs,
  b: PoliticalBeliefs,
  threshold: number = 0.7
): boolean {
  return calculateBeliefSimilarity(a, b) >= threshold;
}

/**
 * Get the most extreme belief (furthest from 0.5).
 * Useful for determining what an NPC is most passionate about.
 * 
 * @param beliefs - The belief set to analyze
 * @returns The belief type and value that is most extreme
 */
export function getMostExtremebelief(beliefs: PoliticalBeliefs): { belief: BeliefType; value: number; extremity: number } {
  let mostExtreme: BeliefType = 'wealthRedistribution';
  let maxExtremity = 0;

  for (const belief of ALL_BELIEF_TYPES) {
    const extremity = Math.abs(beliefs[belief] - 0.5);
    if (extremity > maxExtremity) {
      maxExtremity = extremity;
      mostExtreme = belief;
    }
  }

  return {
    belief: mostExtreme,
    value: beliefs[mostExtreme],
    extremity: maxExtremity,
  };
}
