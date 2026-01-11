/**
 * NPC Memory System
 * 
 * Implements Stanford Generative Agents-style memory system with episodic,
 * semantic, and procedural memory. NPCs form, store, and retrieve memories
 * that influence their behavior and interactions.
 * 
 * Memory Types:
 * - Episodic: Specific events and experiences
 * - Semantic: Facts and knowledge about the world
 * - Procedural: Skills and learned behaviors
 * - Working: Current context and short-term memory
 */

/**
 * Episodic Memory - specific events and experiences.
 * "That time I got rugged at 3am watching charts."
 */
export interface EpisodicMemory {
  /** Unique identifier for this memory */
  id: string;
  /** Game time when this event occurred */
  timestamp: number;
  /** Location where the event occurred */
  location: { x: number; y: number };
  /** NPC IDs involved in this event */
  participants: string[];
  /** Natural language description of the event */
  event: string;
  /** Emotional tone: -1 (negative) to +1 (positive) */
  emotionalValence: number;
  /** Importance rating: 1-10 */
  importance: number;
  /** Number of times this memory has been accessed */
  accessCount: number;
  /** Last time this memory was accessed */
  lastAccessed: number;
  /** Memory strength (decays over time): 0-1 */
  strength: number;
}

/**
 * Semantic Memory - facts and knowledge about the world.
 * "Bob works at the DEX. Charlie likes Ethereum."
 */
export interface SemanticMemory {
  /** Unique identifier for this fact */
  id: string;
  /** The subject of the fact (e.g., "Bob") */
  subject: string;
  /** The relationship (e.g., "works_at") */
  predicate: string;
  /** The object of the fact (e.g., "DEX_Exchange") */
  object: string;
  /** Confidence in this fact: 0-1 */
  confidence: number;
  /** How this fact was learned */
  source: 'observation' | 'told' | 'inference';
  /** When this fact was learned */
  timestamp: number;
}

/**
 * Procedural Memory - skills and learned behaviors.
 * "I know how to read charts. I know how to trade."
 */
export interface ProceduralMemory {
  /** Name of the skill */
  skill: string;
  /** Skill level: 0-1 */
  proficiency: number;
  /** When this skill was last practiced */
  lastPracticed: number;
}

/**
 * Working Memory - current context and short-term memory.
 * "What was I doing? Oh right, checking prices."
 */
export interface WorkingMemory {
  /** Last 5-10 events (rolling buffer) */
  recentEvents: string[];
  /** Current active goal, if any */
  currentGoal: string | null;
  /** Current situational context */
  currentContext: string;
}

/**
 * Complete memory system for an NPC
 */
export interface NPCMemory {
  /** Personal experiences and events */
  episodic: EpisodicMemory[];
  /** Facts and knowledge */
  semantic: SemanticMemory[];
  /** Skills and abilities */
  procedural: ProceduralMemory[];
  /** Short-term context */
  working: WorkingMemory;
}

/**
 * Input type for creating episodic memories (without auto-generated fields)
 */
export type EpisodicMemoryInput = Omit<
  EpisodicMemory,
  'id' | 'accessCount' | 'lastAccessed' | 'strength'
>;

/**
 * Input type for creating semantic memories (without auto-generated fields)
 */
export type SemanticMemoryInput = Omit<SemanticMemory, 'id' | 'timestamp'>;

/**
 * Input type for creating procedural memories
 */
export type ProceduralMemoryInput = Pick<ProceduralMemory, 'skill'> &
  Partial<Pick<ProceduralMemory, 'proficiency' | 'lastPracticed'>>;

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for memory types.
 * Sardonic, educational, and crypto-native.
 */
export const MEMORY_DESCRIPTIONS: Record<string, string> = {
  episodic:
    "The chaotic filing cabinet of personal experiences, organized by 'vibes'.",
  semantic:
    "Cold, hard facts. As reliable as anything in crypto, which is to say, not very.",
  procedural:
    "Skills acquired through repetition. Like chart reading, or coping.",
  working:
    "The mental Post-it notes of consciousness. Easy to lose.",
};

/**
 * Memory decay configuration
 */
export const MEMORY_DECAY_CONFIG = {
  /** Base decay rate per game day */
  baseDecayRate: 0.1,
  /** Minimum strength before memory is forgotten */
  forgetThreshold: 0.1,
  /** Importance multiplier for decay resistance */
  importanceDecayResistance: 0.08,
  /** Emotional valence multiplier for decay resistance */
  emotionalDecayResistance: 0.05,
  /** Access count bonus for decay resistance */
  accessCountBonus: 0.02,
};

/**
 * Generate unique ID for episodic memory
 */
function generateEpisodicId(): string {
  return `mem_ep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique ID for semantic memory
 */
function generateSemanticId(): string {
  return `mem_sem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create an episodic memory with auto-generated fields
 */
export function createEpisodicMemory(
  input: EpisodicMemoryInput
): EpisodicMemory {
  return {
    id: generateEpisodicId(),
    timestamp: input.timestamp,
    location: input.location,
    participants: input.participants,
    event: input.event,
    emotionalValence: Math.max(-1, Math.min(1, input.emotionalValence)),
    importance: Math.max(1, Math.min(10, input.importance)),
    accessCount: 0,
    lastAccessed: input.timestamp,
    strength: 1.0,
  };
}

/**
 * Create a semantic memory with auto-generated fields
 */
export function createSemanticMemory(input: SemanticMemoryInput): SemanticMemory {
  return {
    id: generateSemanticId(),
    subject: input.subject,
    predicate: input.predicate,
    object: input.object,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    source: input.source,
    timestamp: Date.now(),
  };
}

/**
 * Create a procedural memory with defaults
 */
export function createProceduralMemory(
  input: ProceduralMemoryInput
): ProceduralMemory {
  return {
    skill: input.skill,
    proficiency: input.proficiency ?? 0,
    lastPracticed: input.lastPracticed ?? Date.now(),
  };
}

/**
 * Create default empty memory structure for a new NPC
 */
export function createDefaultMemory(): NPCMemory {
  return {
    episodic: [],
    semantic: [],
    procedural: [],
    working: {
      recentEvents: [],
      currentGoal: null,
      currentContext: '',
    },
  };
}
