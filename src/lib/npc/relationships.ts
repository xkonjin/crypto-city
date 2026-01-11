/**
 * NPC Relationship Types for Crypto City
 *
 * Inworld-style relationship system with trust, respect, familiarity, and attraction metrics.
 * Each NPC maintains relationships with other NPCs they interact with.
 */

/**
 * All possible relationship types between NPCs
 */
export type RelationshipType =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'best_friend'
  | 'rival'
  | 'enemy'
  | 'nemesis'
  | 'romantic_interest'
  | 'partner'
  | 'business_partner'
  | 'mentor'
  | 'mentee';

/**
 * All relationship types as an array for iteration/validation
 */
export const ALL_RELATIONSHIP_TYPES: RelationshipType[] = [
  'stranger',
  'acquaintance',
  'friend',
  'close_friend',
  'best_friend',
  'rival',
  'enemy',
  'nemesis',
  'romantic_interest',
  'partner',
  'business_partner',
  'mentor',
  'mentee',
];

/**
 * Core relationship interface representing one NPC's view of another
 */
export interface Relationship {
  /** NPC ID of the other party */
  targetId: string;

  // === Core metrics ===
  /** Reliability, keeping promises (-100 to +100) */
  trust: number;
  /** Admiration, competence recognition (-100 to +100) */
  respect: number;
  /** How well they know each other (0-100) */
  familiarity: number;
  /** Romantic/aesthetic interest (-100 to +100) */
  attraction: number;

  // === Derived type ===
  /** Current relationship type derived from metrics */
  type: RelationshipType;

  // === History ===
  /** Game timestamp when they first met */
  firstMet: number;
  /** Game timestamp of last interaction */
  lastInteraction: number;
  /** Total number of interactions */
  interactionCount: number;

  // === Debts and favors ===
  /** Positive = they owe us, Negative = we owe them */
  owedFavors: number;
}

/**
 * Threshold configuration for determining relationship types
 */
export interface RelationshipThreshold {
  trust?: number;
  respect?: number;
  familiarity?: number;
  attraction?: number;
}

/**
 * Thresholds for deriving relationship type from metrics
 *
 * When checking if a relationship matches a type, ALL specified thresholds must be met.
 */
export const RELATIONSHIP_THRESHOLDS: Record<Exclude<RelationshipType, 'stranger'>, RelationshipThreshold> = {
  acquaintance: { familiarity: 20 },
  friend: { trust: 40, familiarity: 30 },
  close_friend: { trust: 60, familiarity: 50 },
  best_friend: { trust: 80, familiarity: 70 },
  rival: { respect: 30, trust: -20 },
  enemy: { trust: -50 },
  nemesis: { trust: -80, respect: -40 },
  romantic_interest: { attraction: 50, familiarity: 30 },
  partner: { trust: 60, attraction: 60, familiarity: 70 },
  business_partner: { trust: 50, respect: 40, familiarity: 30 },
  mentor: { respect: 70 },
  mentee: { respect: -20, trust: 40 },
};

/**
 * Hitchhiker's Guide style descriptions for each relationship type
 */
export const RELATIONSHIP_DESCRIPTIONS: Record<RelationshipType, string> = {
  stranger: "Ships passing in the night. One might have rugged the other, who knows?",
  acquaintance: "Met at a conference once. Still pretends to remember the conversation.",
  friend: "Would share alpha with them. Probably.",
  close_friend: "Has their seed phrase backup location. Serious trust.",
  best_friend: "Would actually help them move. That's the highest honor.",
  rival: "Respects their hustle, hates their success. Classic crypto relationship.",
  enemy: "Definitely rugged them at some point. Or vice versa. Memory is fuzzy.",
  nemesis: "Would short their portfolio out of spite. Has created burner accounts to argue with them.",
  romantic_interest: "Thinks about them during bull markets. And bear markets. Market neutral.",
  partner: "Found someone who also checks charts at 3 AM. True love.",
  business_partner: "Trust, but verify. Also verify the verification.",
  mentor: "The wise elder who has seen many cycles. Still holds bags from 2017.",
  mentee: "Fresh meat. Full of hope. Hasn't been rugged yet. It's adorable.",
};

/**
 * Clamps a metric value to its valid range based on metric type
 *
 * @param value - The value to clamp
 * @param metric - The metric type (familiarity is 0-100, others are -100 to +100)
 * @returns The clamped value
 */
export function clampMetric(
  value: number,
  metric: 'trust' | 'respect' | 'familiarity' | 'attraction'
): number {
  if (metric === 'familiarity') {
    return Math.max(0, Math.min(100, value));
  }
  return Math.max(-100, Math.min(100, value));
}

/**
 * Creates a default relationship with a target
 *
 * @param targetId - The ID of the target NPC
 * @param timestamp - Optional timestamp for firstMet (defaults to Date.now())
 * @returns A new Relationship object with default values
 */
export function createDefaultRelationship(targetId: string, timestamp?: number): Relationship {
  const now = timestamp ?? Date.now();
  return {
    targetId,
    trust: 0,
    respect: 0,
    familiarity: 0,
    attraction: 0,
    type: 'stranger',
    firstMet: now,
    lastInteraction: now,
    interactionCount: 0,
    owedFavors: 0,
  };
}
