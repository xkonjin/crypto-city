/**
 * NPC Social Interaction System
 * 
 * Defines interaction types for NPC-to-NPC social interactions.
 * NPCs can greet, chat, gossip, debate crypto, flirt, argue, share alpha, and more.
 * 
 * Each interaction type has:
 * - Base acceptance probability
 * - Trust modifier (how much trust affects acceptance)
 * - Effect ranges on relationships
 * - Hitchhiker's Guide style descriptions
 */

/**
 * Types of social interactions NPCs can have.
 */
export type InteractionType =
  | 'greet'           // Basic hello
  | 'chat'            // Small talk
  | 'gossip'          // Share information about others
  | 'debate'          // Argue about crypto (common!)
  | 'flirt'           // Romantic interest
  | 'argue'           // Heated disagreement
  | 'trade_talk'      // Discuss markets
  | 'share_alpha'     // Share trading tips
  | 'ask_favor'       // Request help
  | 'do_favor'        // Help someone
  | 'celebrate'       // Share good news
  | 'console'         // Comfort someone sad
  | 'insult';         // Negative interaction

/**
 * All valid interaction types as an array for iteration.
 */
export const ALL_INTERACTION_TYPES: InteractionType[] = [
  'greet',
  'chat',
  'gossip',
  'debate',
  'flirt',
  'argue',
  'trade_talk',
  'share_alpha',
  'ask_favor',
  'do_favor',
  'celebrate',
  'console',
  'insult',
];

/**
 * Request to initiate an interaction.
 */
export interface InteractionRequest {
  /** ID of the NPC initiating the interaction */
  initiatorId: string;
  /** ID of the target NPC */
  targetId: string;
  /** Type of interaction being requested */
  type: InteractionType;
  /** Context/location of the interaction */
  context: string;
}

/**
 * Result of a processed interaction.
 */
export interface InteractionResult {
  /** Whether the interaction was successful/positive */
  success: boolean;
  /** Type of interaction that occurred */
  type: InteractionType;
  /** IDs of both participants */
  participants: [string, string];
  /** Changes to apply to the relationship */
  relationshipChanges: {
    trust?: number;
    respect?: number;
    familiarity?: number;
    attraction?: number;
  };
  /** Descriptions of memories created from this interaction */
  memoriesCreated: string[];
  /** Effect on mood: -1 (negative) to +1 (positive) */
  moodEffect: number;
}

/**
 * Relationship state between two NPCs.
 */
export interface NPCRelationship {
  /** First NPC ID (alphabetically first for consistent ordering) */
  npcId1: string;
  /** Second NPC ID */
  npcId2: string;
  /** Trust level: -100 (enemy) to +100 (best friend) */
  trust: number;
  /** Respect level: -100 (disdain) to +100 (admiration) */
  respect: number;
  /** How well they know each other: 0 (strangers) to 100 (intimate) */
  familiarity: number;
  /** Romantic/physical attraction: -100 (repulsed) to +100 (infatuated) */
  attraction: number;
  /** Number of interactions they've had */
  interactionCount: number;
  /** Timestamp of last interaction */
  lastInteraction: number;
}

/**
 * Acceptance weight configuration for interaction types.
 */
export interface AcceptanceWeight {
  /** Base probability (0-1) of accepting this interaction */
  base: number;
  /** How much trust affects acceptance (-1 to +1) */
  trustMod: number;
}

/**
 * Probability weights for accepting interactions.
 * Base: probability for strangers
 * TrustMod: how much trust level affects acceptance (positive = trust helps)
 */
export const ACCEPTANCE_WEIGHTS: Record<InteractionType, AcceptanceWeight> = {
  greet: { base: 0.95, trustMod: 0.0 },
  chat: { base: 0.7, trustMod: 0.2 },
  gossip: { base: 0.6, trustMod: 0.3 },
  debate: { base: 0.5, trustMod: 0.1 },
  flirt: { base: 0.3, trustMod: 0.4 },
  argue: { base: 0.4, trustMod: -0.2 },
  trade_talk: { base: 0.6, trustMod: 0.2 },
  share_alpha: { base: 0.4, trustMod: 0.5 },  // Only with trusted
  ask_favor: { base: 0.3, trustMod: 0.4 },
  do_favor: { base: 0.5, trustMod: 0.3 },
  celebrate: { base: 0.8, trustMod: 0.1 },
  console: { base: 0.6, trustMod: 0.2 },
  insult: { base: 0.1, trustMod: -0.3 },  // Rare unless enemy
};

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for each interaction type.
 * Sardonic, educational, and crypto-native.
 */
export const INTERACTION_DESCRIPTIONS: Record<InteractionType, string> = {
  greet: "The ancient ritual of acknowledging another human exists. Revolutionary.",
  chat: "Making mouth noises about nothing in particular. Essential for social bonding.",
  gossip: "Sharing information about absent parties. The original decentralized network.",
  debate: "Two people explaining why the other person's favorite coin is a scam.",
  flirt: "Attempting to signal romantic interest without explicitly stating it. Very efficient.",
  argue: "Like debate, but with more personal attacks and less intellectual honesty.",
  trade_talk: "Discussing whether number will go up or down. Nobody actually knows.",
  share_alpha: "Revealing secret information that's probably already priced in.",
  ask_favor: "The beginning of a social debt that may or may not be repaid.",
  do_favor: "Building social credit. Works better than China's version.",
  celebrate: "Expressing joy about recent good fortune. Often premature.",
  console: "Attempting to provide emotional support. 'We're all gonna make it' optional.",
  insult: "Direct social attack. Often involving the term 'ngmi'.",
};

/**
 * Relationship effects for each interaction type.
 * Success effects are for accepted/successful interactions.
 * Failure effects are for rejected/failed interactions.
 */
export interface InteractionEffects {
  success: {
    trust: [number, number];      // [min, max] change
    respect: [number, number];
    familiarity: [number, number];
    attraction: [number, number];
    moodEffect: [number, number];
  };
  failure: {
    trust: [number, number];
    respect: [number, number];
    familiarity: [number, number];
    attraction: [number, number];
    moodEffect: [number, number];
  };
}

/**
 * Effects each interaction type has on relationships.
 */
export const INTERACTION_EFFECTS: Record<InteractionType, InteractionEffects> = {
  greet: {
    success: {
      trust: [0, 2],
      respect: [0, 1],
      familiarity: [1, 3],
      attraction: [0, 0],
      moodEffect: [0.05, 0.15],
    },
    failure: {
      trust: [-1, 0],
      respect: [-2, 0],
      familiarity: [0, 1],
      attraction: [0, 0],
      moodEffect: [-0.05, 0],
    },
  },
  chat: {
    success: {
      trust: [2, 5],
      respect: [1, 3],
      familiarity: [3, 8],
      attraction: [0, 2],
      moodEffect: [0.1, 0.3],
    },
    failure: {
      trust: [-2, 0],
      respect: [-3, -1],
      familiarity: [1, 3],
      attraction: [-1, 0],
      moodEffect: [-0.15, -0.05],
    },
  },
  gossip: {
    success: {
      trust: [1, 4],
      respect: [-1, 1],
      familiarity: [5, 10],
      attraction: [0, 1],
      moodEffect: [0.1, 0.25],
    },
    failure: {
      trust: [-5, -2],
      respect: [-3, -1],
      familiarity: [2, 5],
      attraction: [-2, 0],
      moodEffect: [-0.2, -0.05],
    },
  },
  debate: {
    success: {
      trust: [0, 3],
      respect: [3, 7],
      familiarity: [5, 10],
      attraction: [-1, 2],
      moodEffect: [0.05, 0.25],
    },
    failure: {
      trust: [-5, -1],
      respect: [-2, 2],
      familiarity: [3, 6],
      attraction: [-3, 0],
      moodEffect: [-0.3, -0.1],
    },
  },
  flirt: {
    success: {
      trust: [2, 5],
      respect: [0, 2],
      familiarity: [3, 7],
      attraction: [5, 15],
      moodEffect: [0.2, 0.5],
    },
    failure: {
      trust: [-3, 0],
      respect: [-5, -1],
      familiarity: [2, 5],
      attraction: [-5, -1],
      moodEffect: [-0.3, -0.1],
    },
  },
  argue: {
    success: {
      trust: [-3, 0],
      respect: [0, 3],
      familiarity: [5, 10],
      attraction: [-3, 0],
      moodEffect: [-0.2, 0.1],
    },
    failure: {
      trust: [-10, -3],
      respect: [-5, -1],
      familiarity: [3, 7],
      attraction: [-5, -1],
      moodEffect: [-0.5, -0.2],
    },
  },
  trade_talk: {
    success: {
      trust: [2, 5],
      respect: [2, 5],
      familiarity: [3, 7],
      attraction: [0, 1],
      moodEffect: [0.1, 0.3],
    },
    failure: {
      trust: [-2, 0],
      respect: [-3, 0],
      familiarity: [2, 4],
      attraction: [0, 0],
      moodEffect: [-0.1, 0],
    },
  },
  share_alpha: {
    success: {
      trust: [5, 12],
      respect: [5, 10],
      familiarity: [5, 10],
      attraction: [0, 3],
      moodEffect: [0.3, 0.6],
    },
    failure: {
      trust: [-5, -2],
      respect: [-5, -2],
      familiarity: [2, 5],
      attraction: [-2, 0],
      moodEffect: [-0.2, -0.05],
    },
  },
  ask_favor: {
    success: {
      trust: [3, 7],
      respect: [1, 3],
      familiarity: [5, 10],
      attraction: [0, 2],
      moodEffect: [0.1, 0.3],
    },
    failure: {
      trust: [-5, -2],
      respect: [-3, 0],
      familiarity: [2, 5],
      attraction: [-2, 0],
      moodEffect: [-0.3, -0.1],
    },
  },
  do_favor: {
    success: {
      trust: [5, 10],
      respect: [3, 7],
      familiarity: [5, 10],
      attraction: [1, 4],
      moodEffect: [0.2, 0.4],
    },
    failure: {
      trust: [-2, 0],
      respect: [-3, 0],
      familiarity: [1, 3],
      attraction: [-1, 0],
      moodEffect: [-0.1, 0],
    },
  },
  celebrate: {
    success: {
      trust: [3, 7],
      respect: [1, 4],
      familiarity: [5, 12],
      attraction: [1, 4],
      moodEffect: [0.4, 0.8],
    },
    failure: {
      trust: [-3, -1],
      respect: [-2, 0],
      familiarity: [2, 5],
      attraction: [-2, 0],
      moodEffect: [-0.2, -0.05],
    },
  },
  console: {
    success: {
      trust: [5, 10],
      respect: [2, 5],
      familiarity: [5, 10],
      attraction: [2, 5],
      moodEffect: [0.3, 0.5],
    },
    failure: {
      trust: [-2, 0],
      respect: [-2, 0],
      familiarity: [2, 4],
      attraction: [-1, 0],
      moodEffect: [-0.15, 0],
    },
  },
  insult: {
    success: {
      trust: [-10, -5],
      respect: [-5, 0],
      familiarity: [3, 8],
      attraction: [-8, -3],
      moodEffect: [-0.3, 0.1],  // Insulter might feel good
    },
    failure: {
      trust: [-15, -8],
      respect: [-10, -5],
      familiarity: [3, 6],
      attraction: [-10, -5],
      moodEffect: [-0.6, -0.3],
    },
  },
};

/**
 * Social need satisfaction amounts for successful interactions.
 */
export const SOCIAL_SATISFACTION: Record<InteractionType, number> = {
  greet: 5,
  chat: 15,
  gossip: 12,
  debate: 10,
  flirt: 18,
  argue: 5,
  trade_talk: 10,
  share_alpha: 15,
  ask_favor: 8,
  do_favor: 12,
  celebrate: 20,
  console: 15,
  insult: 3,  // Minimal social need satisfaction
};

/**
 * Create a default interaction relationship between two NPCs.
 * Uses alphabetical ordering of IDs for consistent key generation.
 */
export function createDefaultInteractionRelationship(
  npcId1: string,
  npcId2: string
): NPCRelationship {
  // Ensure consistent ordering
  const [id1, id2] = npcId1 < npcId2 ? [npcId1, npcId2] : [npcId2, npcId1];
  
  return {
    npcId1: id1,
    npcId2: id2,
    trust: 0,
    respect: 0,
    familiarity: 0,
    attraction: 0,
    interactionCount: 0,
    lastInteraction: 0,
  };
}

/**
 * Generate a relationship key for lookup.
 */
export function getRelationshipKey(npcId1: string, npcId2: string): string {
  const [id1, id2] = npcId1 < npcId2 ? [npcId1, npcId2] : [npcId2, npcId1];
  return `${id1}:${id2}`;
}

/**
 * Clamp a value to relationship bounds.
 * Trust, respect, attraction: -100 to 100
 * Familiarity: 0 to 100
 */
export function clampRelationshipValue(
  value: number,
  type: 'trust' | 'respect' | 'familiarity' | 'attraction'
): number {
  if (type === 'familiarity') {
    return Math.max(0, Math.min(100, value));
  }
  return Math.max(-100, Math.min(100, value));
}

/**
 * Get a random value within a range.
 */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
