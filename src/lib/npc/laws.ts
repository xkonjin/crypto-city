/**
 * NPC Laws System Types
 * 
 * Defines law types for faction governance including violations, penalties, and enforcement.
 * Laws allow factions to codify rules and enforce them on their members.
 * 
 * "In the crypto world, 'code is law' is just a fancy way of saying 
 * 'whoever controls the code controls everything.'" - Ancient DeFi Proverb
 */

/**
 * Types of laws that can be enacted by factions
 */
export type LawType =
  | 'trade_restriction'   // Limits on what can be traded (no shitcoins, BTC only, etc.)
  | 'tax_rate'            // Additional faction taxes on specific activities
  | 'curfew'              // Time-based restrictions on member activities
  | 'building_permit'     // Requirements for building/construction
  | 'membership_rule'     // Rules about who can join/stay in faction
  | 'conduct_code';       // General behavioral expectations

/**
 * Status of a law in its lifecycle
 */
export type LawStatus = 'proposed' | 'active' | 'expired' | 'repealed';

/**
 * Severity levels for laws and penalties
 */
export type Severity = 'minor' | 'moderate' | 'severe';

/**
 * Types of penalties that can be applied for violations
 */
export type PenaltyType = 'fine' | 'exile' | 'reputation_loss' | 'imprisonment';

/**
 * Penalty definition for law violations
 */
export interface Penalty {
  /** Type of penalty */
  type: PenaltyType;
  /** How severe is this penalty */
  severity: Severity;
  /** Amount for fines (in stablecoins) */
  amount?: number;
}

/**
 * A law enacted by a faction
 */
export interface Law {
  /** Unique identifier for this law */
  id: string;
  /** Faction that enacted this law */
  factionId: string;
  /** NPC who proposed the law */
  proposerId: string;
  /** Type of law */
  type: LawType;
  /** Display title */
  title: string;
  /** Full description of the law */
  description: string;
  /** Severity of the law */
  severity: Severity;
  /** Penalties for violating this law */
  penalties: Penalty[];
  /** When the law was enacted (0 if not yet active) */
  enactedAt: number;
  /** When the law expires (null for permanent laws) */
  expiresAt: number | null;
  /** Current status of the law */
  status: LawStatus;
  /** Whether witnesses are required for violations */
  requiresWitnesses: boolean;
}

/**
 * A recorded violation of a law
 */
export interface Violation {
  /** Unique identifier for this violation */
  id: string;
  /** ID of the law that was violated */
  lawId: string;
  /** NPC who committed the violation */
  violatorId: string;
  /** When the violation was detected */
  detectedAt: number;
  /** IDs of NPCs who witnessed the violation */
  witnessed: string[];
  /** Whether a penalty has been applied */
  penaltyApplied: boolean;
}

/**
 * An action an NPC can take that might violate laws
 */
export interface NPCAction {
  /** Type of action */
  type: string;
  /** Target of the action (e.g., token symbol for trades) */
  target?: string;
  /** Amount involved */
  amount?: number;
  /** Location for movement actions */
  location?: string;
  /** Time of day (0-23) for curfew checks */
  time?: number;
  /** Building type for construction */
  buildingType?: string;
  /** Whether action has required permit */
  hasPermit?: boolean;
  /** Risk level of the behavior (0-1) */
  riskLevel?: number;
  /** Whether the action was witnessed */
  witnessed?: boolean;
  /** List of witness IDs */
  witnesses?: string[];
}

/**
 * Serialized law for localStorage persistence
 */
export interface SerializedLaw {
  id: string;
  factionId: string;
  proposerId: string;
  type: LawType;
  title: string;
  description: string;
  severity: Severity;
  penalties: Penalty[];
  enactedAt: number;
  expiresAt: number | null;
  status: LawStatus;
  requiresWitnesses: boolean;
}

/**
 * Serialized violation for localStorage persistence
 */
export interface SerializedViolation {
  id: string;
  lawId: string;
  violatorId: string;
  detectedAt: number;
  witnessed: string[];
  penaltyApplied: boolean;
}

/**
 * Human-readable labels for law types
 */
export const LAW_TYPE_LABELS: Record<LawType, string> = {
  trade_restriction: 'Trade Restriction',
  tax_rate: 'Tax Rate',
  curfew: 'Curfew',
  building_permit: 'Building Permit',
  membership_rule: 'Membership Rule',
  conduct_code: 'Code of Conduct',
};

/**
 * Human-readable labels for penalty types
 */
export const PENALTY_TYPE_LABELS: Record<PenaltyType, string> = {
  fine: 'Fine',
  exile: 'Exile from Faction',
  reputation_loss: 'Reputation Penalty',
  imprisonment: 'Imprisonment',
};

/**
 * Human-readable labels for severity levels
 */
export const SEVERITY_LABELS: Record<Severity, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  severe: 'Severe',
};

/**
 * Hitchhiker's Guide to the Galaxy style law descriptions
 */
export const LAW_DESCRIPTIONS: Record<string, string> = {
  proposing: "Drafting rules that others must follow. Democracy, but make it blockchain.",
  enforcement: "Making sure everyone plays by the code. Decentralized policing, which is just as oxymoronic as it sounds.",
  penalties: "Consequences for rule-breakers. Usually involves losing tokens, which in crypto is worse than prison.",
  violations: "When someone decides rules are merely suggestions. Happens roughly every 12 seconds on average.",
  exile: "The ultimate punishment: being removed from the group chat. Social death in the digital age.",
};

/**
 * Create a default law with required fields and sensible defaults
 */
export function createDefaultLaw(
  params: {
    id: string;
    factionId: string;
    proposerId: string;
    type: LawType;
    title: string;
    description: string;
    severity: Severity;
    penalties: Penalty[];
    status?: LawStatus;
    enactedAt?: number;
    expiresAt?: number | null;
    requiresWitnesses?: boolean;
  }
): Law {
  return {
    id: params.id,
    factionId: params.factionId,
    proposerId: params.proposerId,
    type: params.type,
    title: params.title,
    description: params.description,
    severity: params.severity,
    penalties: params.penalties,
    status: params.status ?? 'proposed',
    enactedAt: params.enactedAt ?? 0,
    expiresAt: params.expiresAt ?? null,
    requiresWitnesses: params.requiresWitnesses ?? false,
  };
}

/**
 * Create a penalty with the given parameters
 */
export function createPenalty(
  type: PenaltyType,
  severity: Severity,
  amount?: number
): Penalty {
  return {
    type,
    severity,
    amount,
  };
}

/**
 * Serialize a law for JSON storage
 */
export function serializeLaw(law: Law): SerializedLaw {
  return { ...law };
}

/**
 * Deserialize a law from JSON storage
 */
export function deserializeLaw(data: SerializedLaw): Law {
  return { ...data };
}

/**
 * Serialize a violation for JSON storage
 */
export function serializeViolation(violation: Violation): SerializedViolation {
  return { ...violation };
}

/**
 * Deserialize a violation from JSON storage
 */
export function deserializeViolation(data: SerializedViolation): Violation {
  return { ...data };
}

/**
 * Default curfew hours (10 PM to 6 AM)
 */
export const DEFAULT_CURFEW_START = 22;
export const DEFAULT_CURFEW_END = 6;

/**
 * Tokens that are typically restricted in maxi factions
 */
export const RESTRICTED_TOKENS = [
  'SHIB', 'DOGE', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BRETT', 
  'MEME', 'BABYDOGE', 'ELON', 'SAFEMOON', 'SQUID'
];

/**
 * Tokens allowed in BTC maxi factions
 */
export const BTC_MAXI_ALLOWED = ['BTC', 'WBTC', 'SATS'];

/**
 * Check if a token is considered a "shitcoin" (memecoin)
 */
export function isRestrictedToken(token: string): boolean {
  return RESTRICTED_TOKENS.includes(token.toUpperCase());
}

/**
 * Check if a token is BTC-maxi approved
 */
export function isBTCMaxiApproved(token: string): boolean {
  return BTC_MAXI_ALLOWED.includes(token.toUpperCase());
}
