/**
 * NPC Culture Types for Crypto City
 *
 * Cultural transmission system including norms, traditions, mentorship,
 * cultural drift, and innovation spread through NPC populations.
 */

/**
 * Types of cultural norms that can emerge and spread
 */
export type NormType =
  | 'greeting'
  | 'trading_practice'
  | 'work_ethic'
  | 'social_behavior'
  | 'celebration'
  | 'taboo';

/**
 * All norm types as an array for iteration/validation
 */
export const ALL_NORM_TYPES: NormType[] = [
  'greeting',
  'trading_practice',
  'work_ethic',
  'social_behavior',
  'celebration',
  'taboo',
];

/**
 * Frequency options for tradition observance
 */
export type TraditionFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Spread pattern for innovations
 */
export type SpreadPattern = 'viral' | 'gradual' | 'localized';

/**
 * A cultural norm that NPCs can adopt and spread
 */
export interface CulturalNorm {
  /** Unique identifier for this norm */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the norm */
  description: string;
  /** Type categorization */
  type: NormType;
  /** How prevalent this norm is (0-1, fraction of population) */
  prevalence: number;
  /** Faction that originated this norm (if any) */
  originFactionId?: string;
  /** Set of NPC IDs who have adopted this norm */
  adoptedBy: Set<string>;
  /** When the norm was created */
  createdAt: number;
}

/**
 * A faction tradition that is observed periodically
 */
export interface Tradition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the tradition */
  description: string;
  /** Faction that owns this tradition */
  factionId: string;
  /** How often the tradition is observed */
  frequency: TraditionFrequency;
  /** NPCs who participate in this tradition */
  participants: Set<string>;
  /** Timestamp of last observance (null if never observed) */
  lastObserved: number | null;
  /** When the tradition was created */
  createdAt: number;
}

/**
 * A mentor-mentee relationship for skill transfer
 */
export interface Mentorship {
  /** Unique identifier */
  id: string;
  /** NPC ID of the mentor */
  mentorId: string;
  /** NPC ID of the mentee */
  menteeId: string;
  /** Skill being taught */
  skill: string;
  /** When mentorship started */
  startedAt: number;
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether mentorship has been completed */
  completed: boolean;
}

/**
 * Tracks how a norm changes over time (random walk within bounds)
 */
export interface CulturalDrift {
  /** The norm this drift applies to */
  normId: string;
  /** Original value when tracking started */
  originalValue: number;
  /** Current drifted value */
  currentValue: number;
  /** Rate of drift per time unit */
  driftRate: number;
}

/**
 * A new behavior that emerges and may spread
 */
export interface Innovation {
  /** Unique identifier */
  id: string;
  /** NPC ID of the innovator */
  innovatorId: string;
  /** Type of behavior */
  type: NormType;
  /** Description of the innovation */
  description: string;
  /** Adoption rate (0-1) */
  adoptionRate: number;
  /** How the innovation spreads */
  spreadPattern: SpreadPattern;
  /** When the innovation was created */
  createdAt: number;
}

/**
 * Serialized form of CulturalNorm (Sets converted to arrays)
 */
export interface SerializedCulturalNorm {
  id: string;
  name: string;
  description: string;
  type: NormType;
  prevalence: number;
  originFactionId?: string;
  adoptedBy: string[];
  createdAt: number;
}

/**
 * Serialized form of Tradition (Sets converted to arrays)
 */
export interface SerializedTradition {
  id: string;
  name: string;
  description: string;
  factionId: string;
  frequency: TraditionFrequency;
  participants: string[];
  lastObserved: number | null;
  createdAt: number;
}

/**
 * Hitchhiker's Guide style descriptions for cultural events
 */
export const CULTURE_DESCRIPTIONS: Record<string, string> = {
  greeting: "How beings acknowledge each other's existence. In crypto, usually involves asking about bags.",
  trading_practice: "The rituals of buying high and selling low. An ancient tradition passed down through generations of diamond hands.",
  work_ethic: "The mysterious belief that effort correlates with reward. Largely debunked by memecoin millionaires.",
  social_behavior: "How NPCs interact when they could be staring at charts instead.",
  celebration: "Moments of collective joy, typically followed by rug pulls.",
  taboo: "Things we don't speak of. Paper hands. Selling the bottom. Trusting CEXes.",
  normAdoption: "When an NPC decides the group is onto something. Peer pressure with extra steps.",
  traditionObserved: "The sacred ritual has been performed. Vitalik would be proud. Maybe.",
  mentorshipComplete: "Knowledge transferred successfully. The mentee is now qualified to lose money independently.",
  innovation: "Someone had a new idea. In crypto, this usually means a new way to lose money.",
  culturalDrift: "Things change. Norms evolve. The only constant is that we're all going to make it. Eventually.",
};

/**
 * Create a default cultural norm
 *
 * @param name - Name of the norm
 * @param type - Type of norm
 * @param originFactionId - Optional faction origin
 * @returns A new CulturalNorm with default values
 */
export function createDefaultNorm(
  name: string,
  type: NormType,
  originFactionId?: string
): CulturalNorm {
  return {
    id: `norm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: '',
    type,
    prevalence: 0,
    originFactionId,
    adoptedBy: new Set(),
    createdAt: Date.now(),
  };
}

/**
 * Create a default tradition
 *
 * @param factionId - Faction that owns this tradition
 * @param name - Name of the tradition
 * @param frequency - How often it's observed
 * @returns A new Tradition with default values
 */
export function createDefaultTradition(
  factionId: string,
  name: string,
  frequency: TraditionFrequency
): Tradition {
  return {
    id: `tradition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: '',
    factionId,
    frequency,
    participants: new Set(),
    lastObserved: null,
    createdAt: Date.now(),
  };
}

/**
 * Create a default mentorship
 *
 * @param mentorId - NPC ID of the mentor
 * @param menteeId - NPC ID of the mentee
 * @param skill - Skill being taught
 * @returns A new Mentorship at 0 progress
 */
export function createDefaultMentorship(
  mentorId: string,
  menteeId: string,
  skill: string
): Mentorship {
  return {
    id: `mentorship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    mentorId,
    menteeId,
    skill,
    startedAt: Date.now(),
    progress: 0,
    completed: false,
  };
}

/**
 * Create a default innovation
 *
 * @param innovatorId - NPC ID of the innovator
 * @param type - Type of innovation
 * @param description - Description of the innovation
 * @returns A new Innovation with default values
 */
export function createDefaultInnovation(
  innovatorId: string,
  type: NormType,
  description: string
): Innovation {
  return {
    id: `innovation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    innovatorId,
    type,
    description,
    adoptionRate: 0,
    spreadPattern: 'gradual',
    createdAt: Date.now(),
  };
}

/**
 * Serialize a CulturalNorm for storage
 */
export function serializeNorm(norm: CulturalNorm): SerializedCulturalNorm {
  return {
    ...norm,
    adoptedBy: Array.from(norm.adoptedBy),
  };
}

/**
 * Deserialize a CulturalNorm from storage
 */
export function deserializeNorm(data: SerializedCulturalNorm): CulturalNorm {
  return {
    ...data,
    adoptedBy: new Set(data.adoptedBy),
  };
}

/**
 * Serialize a Tradition for storage
 */
export function serializeTradition(tradition: Tradition): SerializedTradition {
  return {
    ...tradition,
    participants: Array.from(tradition.participants),
  };
}

/**
 * Deserialize a Tradition from storage
 */
export function deserializeTradition(data: SerializedTradition): Tradition {
  return {
    ...data,
    participants: new Set(data.participants),
  };
}
