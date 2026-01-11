/**
 * NPC Faction System Types
 * 
 * Defines faction types where NPCs join groups with shared ideologies and goals.
 * Each faction has its own crypto philosophy, governance structure, and territory.
 * 
 * Factions add tribal dynamics to the city, creating alliances, rivalries,
 * and political intrigue among the crypto-native citizens.
 */

/**
 * Economic ideology spectrum for faction governance
 */
export type EconomicIdeology = 'communist' | 'socialist' | 'mixed' | 'capitalist' | 'ancap';

/**
 * Governance structure for faction leadership
 */
export type GovernanceType = 'autocracy' | 'oligarchy' | 'democracy' | 'dao' | 'anarchy';

/**
 * Crypto philosophy that defines faction identity
 */
export type CryptoPhilosophy = 'btc_maxi' | 'eth_aligned' | 'multi_chain' | 'tradfi_hybrid' | 'privacy_first';

/**
 * Faction ideology defining economic, governance, and crypto philosophy
 */
export interface FactionIdeology {
  /** Economic policy preference */
  economic: EconomicIdeology;
  /** How the faction is governed */
  governance: GovernanceType;
  /** Core crypto belief system */
  cryptoPhilosophy: CryptoPhilosophy;
}

/**
 * Relation status between two factions
 */
export type RelationStatus = 'allied' | 'friendly' | 'neutral' | 'hostile' | 'war';

/**
 * Relationship between two factions
 */
export interface FactionRelation {
  /** The faction this relation is with */
  targetFactionId: string;
  /** Standing score from -100 to +100 */
  standing: number;
  /** Derived status based on standing */
  status: RelationStatus;
}

/**
 * Core Faction entity
 */
export interface Faction {
  /** Unique identifier for this faction */
  id: string;
  /** Display name */
  name: string;
  /** Description of the faction */
  description: string;
  /** The faction's ideology */
  ideology: FactionIdeology;
  
  // Leadership
  /** NPC ID of the faction leader, null if leaderless */
  leaderId: string | null;
  /** NPC IDs of council members */
  councilIds: string[];
  
  // Members
  /** Set of all member NPC IDs */
  memberIds: Set<string>;
  
  // Territory
  /** Building ID of headquarters, null if none */
  headquartersBuilding: string | null;
  /** Building IDs under faction control */
  controlledBuildings: string[];
  
  // Resources
  /** Faction treasury balance */
  treasury: number;
  
  // Relations
  /** Relations with other factions */
  relations: Record<string, FactionRelation>;
  
  // Rules
  /** Tax rate on member income (0-1) */
  taxRate: number;
  
  // Culture
  /** Faction motto */
  motto: string;
  /** Timestamp when faction was founded */
  foundedAt: number;
}

/**
 * Serialized faction for localStorage persistence.
 * Converts Set to Array for JSON compatibility.
 */
export interface SerializedFaction {
  id: string;
  name: string;
  description: string;
  ideology: FactionIdeology;
  leaderId: string | null;
  councilIds: string[];
  memberIds: string[];
  headquartersBuilding: string | null;
  controlledBuildings: string[];
  treasury: number;
  relations: Record<string, FactionRelation>;
  taxRate: number;
  motto: string;
  foundedAt: number;
}

/**
 * Predefined faction templates
 */
export const FACTION_TEMPLATES: Record<string, Partial<Faction>> = {
  bitcoin_citadel: {
    name: "The Bitcoin Citadel",
    description: "Believers in the one true cryptocurrency. Orange-pilled and proud.",
    ideology: { economic: 'capitalist', governance: 'oligarchy', cryptoPhilosophy: 'btc_maxi' },
    motto: "There is no second best.",
  },
  ethereum_collective: {
    name: "The Ethereum Collective",
    description: "Building the world computer, one smart contract at a time.",
    ideology: { economic: 'mixed', governance: 'dao', cryptoPhilosophy: 'eth_aligned' },
    motto: "Code is law.",
  },
  degen_republic: {
    name: "Degen Republic",
    description: "If you're not gambling, are you even living?",
    ideology: { economic: 'ancap', governance: 'anarchy', cryptoPhilosophy: 'multi_chain' },
    motto: "YOLO or go home.",
  },
  privacy_underground: {
    name: "The Privacy Underground",
    description: "Your transactions are your business. And only your business.",
    ideology: { economic: 'capitalist', governance: 'anarchy', cryptoPhilosophy: 'privacy_first' },
    motto: "If they can see it, they can seize it.",
  },
  tradfi_heights: {
    name: "TradFi Heights",
    description: "Bridging the old world and the new. Very responsibly.",
    ideology: { economic: 'capitalist', governance: 'democracy', cryptoPhilosophy: 'tradfi_hybrid' },
    motto: "Regulation is our friend.",
  },
};

/**
 * Hitchhiker's Guide to the Galaxy style faction descriptions
 */
export const FACTION_DESCRIPTIONS: Record<string, string> = {
  joining: "Pledging allegiance to a group of like-minded individuals. Tribalism, but make it decentralized.",
  leadership: "Someone has to make decisions. Usually the person with the most tokens.",
  treasury: "Pooled resources for collective goals. Also known as 'the honeypot'.",
  taxes: "Contributing to the collective. Marx would be confused but intrigued.",
  relations: "How factions feel about each other. Mostly 'we're right, they're wrong'.",
};

/**
 * Create a default faction ideology with optional overrides
 */
export function createFactionIdeology(overrides: Partial<FactionIdeology> = {}): FactionIdeology {
  return {
    economic: overrides.economic ?? 'mixed',
    governance: overrides.governance ?? 'democracy',
    cryptoPhilosophy: overrides.cryptoPhilosophy ?? 'multi_chain',
  };
}

/**
 * Create a default faction with optional overrides
 */
export function createDefaultFaction(overrides: Partial<Faction> & { id: string; name: string; leaderId: string }): Faction {
  return {
    id: overrides.id,
    name: overrides.name,
    description: overrides.description ?? '',
    ideology: overrides.ideology ?? createFactionIdeology(),
    leaderId: overrides.leaderId,
    councilIds: overrides.councilIds ?? [],
    memberIds: overrides.memberIds ?? new Set<string>(),
    headquartersBuilding: overrides.headquartersBuilding ?? null,
    controlledBuildings: overrides.controlledBuildings ?? [],
    treasury: overrides.treasury ?? 0,
    relations: overrides.relations ?? {},
    taxRate: overrides.taxRate ?? 0.1,
    motto: overrides.motto ?? '',
    foundedAt: overrides.foundedAt ?? Date.now(),
  };
}

/**
 * Serialize a faction for JSON storage
 */
export function serializeFaction(faction: Faction): SerializedFaction {
  return {
    ...faction,
    memberIds: Array.from(faction.memberIds),
  };
}

/**
 * Deserialize a faction from JSON storage
 */
export function deserializeFaction(data: SerializedFaction): Faction {
  return {
    ...data,
    memberIds: new Set(data.memberIds),
  };
}
