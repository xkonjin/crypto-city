/**
 * NPC Diplomacy System Types for Crypto City
 *
 * Defines types for peace treaties, alliances, and diplomatic relations.
 * Factions can negotiate treaties, form alliances, and manage diplomatic stances.
 * Treaty violations damage reputation and affect future negotiations.
 */

// ============================================================================
// Treaty Types
// ============================================================================

/**
 * Types of treaties between factions
 */
export type TreatyType =
  | 'peace'           // End a war
  | 'alliance'        // Formal alliance agreement
  | 'trade'           // Trade agreement
  | 'non_aggression'  // Promise not to attack
  | 'mutual_defense'; // Defend each other if attacked

/**
 * All treaty types as an array for iteration/validation
 */
export const ALL_TREATY_TYPES: TreatyType[] = [
  'peace',
  'alliance',
  'trade',
  'non_aggression',
  'mutual_defense',
];

/**
 * Types of terms in treaties
 */
export type TermType =
  | 'reparations'        // Payment for damages
  | 'territory_exchange' // Transfer of buildings/territory
  | 'trade_access'       // Access to markets
  | 'military_support'   // Provide military aid
  | 'tribute';           // Regular payments

/**
 * All term types as an array for iteration/validation
 */
export const ALL_TERM_TYPES: TermType[] = [
  'reparations',
  'territory_exchange',
  'trade_access',
  'military_support',
  'tribute',
];

/**
 * A term within a treaty
 */
export interface TreatyTerm {
  /** Type of term */
  type: TermType;
  /** Human-readable description */
  description: string;
  /** Numeric value (for reparations, tribute amounts) */
  value?: number;
  /** Faction this term applies to (who pays, who gives territory) */
  factionId?: string;
}

/**
 * Status of a treaty
 */
export type TreatyStatus = 'active' | 'expired' | 'violated';

/**
 * A treaty between factions
 */
export interface Treaty {
  /** Unique identifier */
  id: string;
  /** Faction IDs involved in the treaty */
  parties: string[];
  /** Type of treaty */
  type: TreatyType;
  /** Terms of the treaty */
  terms: TreatyTerm[];
  /** When the treaty was signed */
  signedAt: number;
  /** When the treaty expires */
  expiresAt: number;
  /** Current status */
  status: TreatyStatus;
  /** ID of faction that violated the treaty (if violated) */
  violatorId?: string;
}

// ============================================================================
// Alliance Types
// ============================================================================

/**
 * Status of an alliance
 */
export type AllianceStatus = 'active' | 'dissolved';

/**
 * An alliance between multiple factions
 */
export interface Alliance {
  /** Unique identifier */
  id: string;
  /** Faction IDs in the alliance */
  memberFactionIds: string[];
  /** Faction ID of the alliance leader */
  leaderId: string;
  /** When the alliance was formed */
  foundedAt: number;
  /** Alliance strength (0-100) based on member count and reputation */
  strength: number;
  /** Current status */
  status: AllianceStatus;
}

// ============================================================================
// Diplomatic Stance Types
// ============================================================================

/**
 * Diplomatic stance between two factions
 */
export type DiplomaticStance = 'friendly' | 'neutral' | 'hostile' | 'war';

/**
 * All diplomatic stances as an array for iteration/validation
 */
export const ALL_DIPLOMATIC_STANCES: DiplomaticStance[] = [
  'friendly',
  'neutral',
  'hostile',
  'war',
];

// ============================================================================
// Negotiation Types
// ============================================================================

/**
 * Stages of negotiation
 */
export type NegotiationStage =
  | 'proposed'
  | 'counter_offered'
  | 'accepted'
  | 'rejected';

/**
 * A negotiation session between two factions
 */
export interface NegotiationSession {
  /** Unique identifier */
  id: string;
  /** Faction that initiated the negotiation */
  initiatorFactionId: string;
  /** Faction receiving the proposal */
  targetFactionId: string;
  /** Proposed treaty type */
  proposedType: TreatyType;
  /** Initially proposed terms */
  proposedTerms: TreatyTerm[];
  /** Counter-offered terms (null if no counter) */
  counterTerms: TreatyTerm[] | null;
  /** Current stage of negotiation */
  stage: NegotiationStage;
  /** Number of negotiation rounds */
  negotiationRounds: number;
  /** When the negotiation started */
  startedAt: number;
}

// ============================================================================
// Reputation Types
// ============================================================================

/**
 * A reputation change entry
 */
export interface ReputationChange {
  /** When the change occurred */
  timestamp: number;
  /** Amount of change */
  delta: number;
  /** Reason for the change */
  reason: string;
}

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Serialized diplomacy state for persistence
 */
export interface SerializedDiplomacyState {
  treaties: Treaty[];
  alliances: Alliance[];
  sessions: NegotiationSession[];
  reputations: Record<string, number>;
  reputationHistories: Record<string, ReputationChange[]>;
  stances: Record<string, DiplomaticStance>;
}

// ============================================================================
// Hitchhiker's Guide Descriptions
// ============================================================================

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for diplomacy
 * Sardonic, educational, and crypto-native
 */
export const DIPLOMACY_DESCRIPTIONS: Record<string, string> = {
  // Treaty types
  peace: "An agreement to stop fighting. Usually lasts until someone forgets why they stopped.",
  alliance: "A formal promise to be friends. In crypto, 'formal' means 'until the bear market'.",
  trade: "Opening markets to each other. May the best liquidity provider win.",
  non_aggression: "A promise not to attack. Like a pinky swear, but with more lawyers.",
  mutual_defense: "An agreement to fight together. The 'we'll both get rekt' pact.",
  
  // Term types
  reparations: "Payment for damages caused. The blockchain remembers, and so does the treasury.",
  territory_exchange: "Trading land for peace. Real estate, but make it decentralized.",
  trade_access: "Access to someone else's market. Token gating, but diplomatic.",
  military_support: "Lending soldiers to allies. Mercenaries with extra steps.",
  tribute: "Regular payments to avoid trouble. Protection money, but make it a treaty.",
  
  // Other concepts
  negotiation: "Two parties pretending to compromise while trying to win everything.",
  reputation: "How much other factions trust you. Harder to rebuild than a rug-pulled protocol.",
  diplomacy: "The art of saying 'nice doge' while calculating if you can take their territory.",
  violation: "Breaking a treaty. Fast track to becoming everyone's enemy.",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Default treaty duration (30 days in milliseconds)
 */
export const DEFAULT_TREATY_DURATION = 30 * 24 * 60 * 60 * 1000;

/**
 * Create a default treaty with required fields
 */
export function createDefaultTreaty(
  overrides: Pick<Treaty, 'id' | 'parties' | 'type'> & Partial<Treaty>
): Treaty {
  const now = Date.now();
  return {
    id: overrides.id,
    parties: overrides.parties,
    type: overrides.type,
    terms: overrides.terms ?? [],
    signedAt: overrides.signedAt ?? now,
    expiresAt: overrides.expiresAt ?? now + DEFAULT_TREATY_DURATION,
    status: overrides.status ?? 'active',
    violatorId: overrides.violatorId,
  };
}

/**
 * Create a default alliance with required fields
 */
export function createDefaultAlliance(
  overrides: Pick<Alliance, 'id' | 'memberFactionIds' | 'leaderId'> & Partial<Alliance>
): Alliance {
  const memberCount = overrides.memberFactionIds.length;
  const baseStrength = Math.min(100, memberCount * 20);
  
  return {
    id: overrides.id,
    memberFactionIds: overrides.memberFactionIds,
    leaderId: overrides.leaderId,
    foundedAt: overrides.foundedAt ?? Date.now(),
    strength: overrides.strength ?? baseStrength,
    status: overrides.status ?? 'active',
  };
}

/**
 * Create a default negotiation session with required fields
 */
export function createDefaultNegotiationSession(
  overrides: Pick<NegotiationSession, 'id' | 'initiatorFactionId' | 'targetFactionId'> & 
    Partial<NegotiationSession>
): NegotiationSession {
  return {
    id: overrides.id,
    initiatorFactionId: overrides.initiatorFactionId,
    targetFactionId: overrides.targetFactionId,
    proposedType: overrides.proposedType ?? 'peace',
    proposedTerms: overrides.proposedTerms ?? [],
    counterTerms: overrides.counterTerms ?? null,
    stage: overrides.stage ?? 'proposed',
    negotiationRounds: overrides.negotiationRounds ?? 0,
    startedAt: overrides.startedAt ?? Date.now(),
  };
}
