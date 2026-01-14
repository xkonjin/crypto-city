/**
 * Titan Pet Types for Crypto City
 * 
 * Core type definitions for the Hero Pet (Titan) system, inspired by
 * Lionhead Studios' Black & White (2001) creature companion mechanics.
 * 
 * The Titan is a trainable companion creature that:
 * - Lives in the city and interacts with NPCs
 * - Can be trained via praise/punishment (God Hand interface)
 * - Morphs visually between good/evil alignments
 * - Learns from observation and player feedback
 * - Has needs, moods, and relationships with NPCs
 * 
 * "In the beginning, there was nothing. Then someone said 'let there be Doge.'
 * And there was Doge. And it was good. Mostly." - Hitchhiker's Guide to Crypto City
 * 
 * @see specs/HERO_PET_SYSTEM.md for full design documentation
 */

import type { Need, NPCNeeds } from '@/lib/npc/needs';
import type { InternalWorld, Mood, Thought, Belief, Desire } from '@/lib/npc/mood';
import type { Relationship } from '@/lib/npc/relationships';
import type { NPCDirection, NPCActivity } from '@/games/isocity/types/npc';

// ============================================================================
// TITAN SPECIES
// ============================================================================

/**
 * Available Titan creature species.
 * Each has unique base stats and crypto-themed personality.
 * 
 * "Choosing your creature is like choosing your favorite blockchain.
 * Everyone has an opinion, everyone is wrong, and Doge wins anyway."
 */
export type TitanSpecies = 'doge' | 'bull' | 'bear' | 'ape' | 'whale' | 'phoenix';

/**
 * All available Titan species as an array for iteration/validation.
 */
export const ALL_TITAN_SPECIES: TitanSpecies[] = [
  'doge',
  'bull',
  'bear',
  'ape',
  'whale',
  'phoenix',
];

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for each species.
 * Sardonic, educational, and crypto-native.
 */
export const TITAN_SPECIES_DESCRIPTIONS: Record<TitanSpecies, string> = {
  doge: "Such companion, very loyal, wow. The default starter creature that has somehow become more valuable than most national currencies.",
  bull: "Charges headfirst into any situation with the unshakeable confidence of someone who bought at the bottom exactly once.",
  bear: "Cautious, defensive, and will remind you of every market crash at every opportunity. 'I told you so' personified.",
  ape: "Strong together, strong alone, strong in ways that defy conventional financial wisdom. Diamond hands optional but encouraged.",
  whale: "Massive, slow-moving, and capable of single-handedly crashing markets with one sneeze. Handle with extreme caution.",
  phoenix: "Has died and risen more times than a memecoin's market cap. Surprisingly optimistic given the trauma.",
};

// ============================================================================
// ALIGNMENT SYSTEM
// ============================================================================

/**
 * Alignment states representing the Titan's moral position.
 * Ranges from -1.0 (angelic) to +1.0 (demonic).
 * 
 * "Alignment in Crypto City is less about good and evil, and more about
 * how many people you've helped versus how many rugs you've pulled."
 */
export type AlignmentState = 'angelic' | 'good' | 'neutral' | 'evil' | 'demonic';

/**
 * All alignment states as an array for iteration/validation.
 */
export const ALIGNMENT_STATES: AlignmentState[] = [
  'angelic',
  'good',
  'neutral',
  'evil',
  'demonic',
];

/**
 * Alignment value ranges for each state.
 * 
 * | State    | Range           |
 * |----------|-----------------|
 * | Angelic  | -1.0 to -0.6    |
 * | Good     | -0.6 to -0.2    |
 * | Neutral  | -0.2 to +0.2    |
 * | Evil     | +0.2 to +0.6    |
 * | Demonic  | +0.6 to +1.0    |
 */
export const ALIGNMENT_RANGES: Record<AlignmentState, { min: number; max: number }> = {
  angelic: { min: -1.0, max: -0.6 },
  good: { min: -0.6, max: -0.2 },
  neutral: { min: -0.2, max: 0.2 },
  evil: { min: 0.2, max: 0.6 },
  demonic: { min: 0.6, max: 1.0 },
};

/**
 * Hitchhiker's Guide descriptions for alignment states.
 */
export const ALIGNMENT_DESCRIPTIONS: Record<AlignmentState, string> = {
  angelic: "Radiates pure benevolence. Probably donates to charity and tips well. Suspicious.",
  good: "Generally helpful and trustworthy. The kind of creature who'd return your lost wallet.",
  neutral: "Neither good nor evil. Just vibing. The Switzerland of moral alignment.",
  evil: "Has questionable ethics but excellent returns. Would definitely front-run you.",
  demonic: "Full rug-pull energy. Leaves a trail of devastation and somehow still has supporters.",
};

// ============================================================================
// TITAN SKILLS
// ============================================================================

/**
 * Titan skill types grouped by category.
 * 
 * Physical: strength, speed, endurance
 * Mental: intelligence, awareness, memory
 * Social: charisma, intimidation, empathy
 * Special: miracles, stealth, gathering
 * 
 * "Skills are like tokens - everyone thinks theirs are undervalued."
 */
export type TitanSkill =
  // Physical
  | 'strength'     // Carrying, throwing, combat damage
  | 'speed'        // Movement, reaction time
  | 'endurance'    // Need decay rate, stamina
  // Mental
  | 'intelligence' // Learning speed, puzzle solving
  | 'awareness'    // Observation range, detail noticed
  | 'memory'       // How long beliefs persist
  // Social
  | 'charisma'     // NPC interaction success
  | 'intimidation' // Scare effectiveness
  | 'empathy'      // Understanding NPC needs
  // Special
  | 'miracles'     // Special ability power
  | 'stealth'      // Unnoticed actions
  | 'gathering';   // Resource collection

/**
 * All Titan skills as an array for iteration/validation.
 */
export const ALL_TITAN_SKILLS: TitanSkill[] = [
  'strength',
  'speed',
  'endurance',
  'intelligence',
  'awareness',
  'memory',
  'charisma',
  'intimidation',
  'empathy',
  'miracles',
  'stealth',
  'gathering',
];

/**
 * Hitchhiker's Guide style descriptions for each skill.
 */
export const TITAN_SKILL_DESCRIPTIONS: Record<TitanSkill, string> = {
  strength: "The ability to lift heavy things and look impressive while doing it. Also useful for throwing annoying NPCs.",
  speed: "How fast your creature moves. Inversely proportional to how carefully it considers decisions.",
  endurance: "Staying power. The difference between a sprint and a marathon. Literally affects how often they need to rest.",
  intelligence: "Problem-solving ability. Higher values mean fewer 'why is my creature stuck in a corner' moments.",
  awareness: "How much your creature notices about its surroundings. Low values lead to amusing surprise animations.",
  memory: "How long your creature remembers what you taught it. Critical for not having to re-train everything weekly.",
  charisma: "The art of making NPCs like you without any logical reason. Basically crypto influencer energy.",
  intimidation: "The ability to make others uncomfortable just by existing. Useful but morally questionable.",
  empathy: "Understanding what others need. Surprisingly rare in crypto spaces. Your creature might be special.",
  miracles: "The power to bend reality through sheer will. Results may vary. Side effects may include hubris.",
  stealth: "The ability to go unnoticed. Perfect for... legitimate purposes only, obviously.",
  gathering: "Finding and collecting resources. Like yield farming but with actual physical effort.",
};

/**
 * Skill progression data for a single skill.
 */
export interface TitanSkillProgression {
  /** The skill this progression tracks */
  skill: TitanSkill;
  /** Current skill level (1-10) */
  level: number;
  /** Current experience points */
  experience: number;
  /** Species modifier affecting progression (0.5-2.0) */
  aptitude: number;
  /** Timestamp of last skill use (for decay calculations) */
  lastUsed: number;
}

// ============================================================================
// TITAN GOALS
// ============================================================================

/**
 * Union type of all possible Titan goals.
 * Goals drive autonomous behavior when not receiving player commands.
 * 
 * "A creature without goals is just a very expensive screensaver."
 */
export type TitanGoal =
  | { type: 'seek_food' }
  | { type: 'seek_attention' }
  | { type: 'help_npc'; npcId: string }
  | { type: 'explore_area'; area: { x: number; y: number } }
  | { type: 'learn_from'; npcId: string }
  | { type: 'rest' }
  | { type: 'play' };

// ============================================================================
// ACTION BELIEFS (Reinforcement Learning)
// ============================================================================

/**
 * Represents the Titan's learned belief about whether an action is good or bad.
 * Updated through praise/punishment from the player.
 * 
 * "Your creature learns by watching you judge its every action.
 * This is either pet ownership or performance review. Perhaps both."
 */
export interface ActionBelief {
  /** The action this belief relates to (e.g., 'help_npc', 'steal', 'eat') */
  action: string;
  /** How good or bad the Titan thinks this action is (-1.0 to +1.0) */
  goodness: number;
  /** How confident the Titan is in this belief (0-1) */
  confidence: number;
  /** Timestamp of last reinforcement (for decay calculations) */
  lastReinforced: number;
  /** Total number of times this action has been reinforced */
  reinforcementCount: number;
}

// ============================================================================
// TITAN NEEDS (Extended from NPCNeeds)
// ============================================================================

/**
 * Titan-specific needs that extend the base NPC needs system.
 * Adds attention (player interaction) and growth (learning) needs.
 * 
 * "Just like NPCs, Titans have needs. Unlike NPCs, they will judge you
 * silently if you don't meet them. The judgment is palpable."
 */
export interface TitanNeeds extends NPCNeeds {
  /** 
   * Need for player interaction via God Hand.
   * Decays when player ignores the Titan.
   */
  attention: Need;
  /** 
   * Need to learn new things and level up skills.
   * Satisfied by new experiences and skill progression.
   */
  growth: Need;
}

// ============================================================================
// TITAN MOOD (Extended from InternalWorld)
// ============================================================================

/**
 * Player belief structure tracking the Titan's feelings about the player.
 */
export interface PlayerBelief {
  /** Does the Titan trust the player? (-1.0 to +1.0) */
  trust: number;
  /** Is the Titan afraid of the player? (0 to 1.0) */
  fear: number;
  /** Does the Titan feel affection for the player? (-1.0 to +1.0) */
  affection: number;
}

/**
 * Titan-specific mood system extending the NPC internal world.
 * Adds beliefs about the player specifically.
 * 
 * "The Titan's mood is a complex interplay of needs, experiences, and
 * whether you've been a good deity lately. Hint: you probably haven't."
 */
export interface TitanMood extends InternalWorld {
  /** The Titan's feelings and beliefs about the player */
  beliefsAboutPlayer: PlayerBelief;
}

// ============================================================================
// TITAN BDI (Belief-Desire-Intention Architecture)
// ============================================================================

/**
 * Titan desire representing something the Titan wants.
 */
export interface TitanDesire {
  /** What the Titan wants */
  type: string;
  /** How urgently the Titan wants it (higher = more urgent) */
  priority: number;
  /** Where this desire originated */
  source: 'need' | 'mood' | 'curiosity' | 'command';
}

/**
 * Titan intention representing the current plan to achieve a desire.
 */
export interface TitanIntention {
  /** The goal this intention aims to achieve */
  goal: TitanGoal;
  /** Sequence of actions to reach the goal */
  plan: string[];
  /** Current step in the plan (0-indexed) */
  currentStep: number;
}

/**
 * Belief-Desire-Intention (BDI) architecture for Titan AI.
 * Based on Black & White's creature AI design.
 * 
 * "BDI is just a fancy way of saying 'the creature has thoughts and
 * sometimes acts on them.' Revolutionary stuff, really."
 */
export interface TitanBDI {
  /** What the Titan knows and believes about the world */
  beliefs: {
    /** General facts about the city (Map<string, unknown>) */
    worldKnowledge: Map<string, unknown>;
    /** Learned beliefs about actions (good/bad) */
    actionBeliefs: Map<string, ActionBelief>;
    /** Opinions about specific NPCs (Map<npcId, opinion score>) */
    npcOpinions: Map<string, number>;
    /** Feelings about the player */
    playerRelationship: PlayerBelief;
  };
  /** What the Titan currently wants (sorted by priority) */
  desires: TitanDesire[];
  /** Current plan being executed, or null if idle */
  intentions: TitanIntention | null;
}

// ============================================================================
// TITAN RELATIONSHIPS
// ============================================================================

/**
 * Titan's relationship with a specific NPC.
 * Extended from the NPC relationship system with Titan-specific metrics.
 * 
 * "Tracking who your creature likes and who it wants to eat.
 * Sometimes the same NPC. Relationships are complicated."
 * 
 * Key metrics:
 * - trust: How reliable the NPC is to the Titan (-100 to +100)
 * - respect: Admiration for the NPC (-100 to +100)
 * - familiarity: How well the Titan knows this NPC (0 to 100, never decays)
 * - fear: How afraid this NPC is of the Titan (0 to 100, Titan-specific)
 */
export interface TitanRelationship {
  /** NPC ID this relationship tracks */
  npcId: string;
  /** How much the Titan trusts this NPC (-100 to +100) */
  trust: number;
  /** How much respect the Titan has for this NPC (-100 to +100) */
  respect: number;
  /** How well the Titan knows this NPC (0 to 100, never decays) */
  familiarity: number;
  /** How afraid this NPC is of the Titan (0 to 100, Titan-specific) */
  fear: number;
  /** Timestamp when the Titan first met this NPC */
  firstMet: number;
  /** Timestamp of last interaction */
  lastInteraction: number;
  /** Total number of interactions */
  interactionCount: number;
}

// ============================================================================
// ACTION HISTORY
// ============================================================================

/**
 * Record of an action the Titan performed.
 * Used for alignment calculation and learning analysis.
 */
export interface ActionHistoryEntry {
  /** What action was performed */
  action: string;
  /** When it was performed */
  timestamp: number;
  /** How this action affected alignment (-1.0 to +1.0) */
  alignmentImpact: number;
  /** Whether player praised/punished this action */
  playerResponse?: 'praised' | 'punished' | 'ignored';
  /** Related NPC if any */
  relatedNpcId?: string;
}

// ============================================================================
// MAIN TITAN PET INTERFACE
// ============================================================================

/**
 * The complete Titan Pet entity.
 * A singular companion creature that lives in the city and can be trained.
 * 
 * "Your Titan is like a Tamagotchi if Tamagotchis could influence markets,
 * learn moral philosophy from your actions, and occasionally set things on fire."
 */
export interface TitanPet {
  // === IDENTITY ===
  /** Unique identifier for this Titan */
  id: string;
  /** Which creature species this Titan is */
  species: TitanSpecies;
  /** Player-assigned name */
  name: string;
  /** Age in game days since creation */
  age: number;

  // === ALIGNMENT ===
  /** 
   * Current moral alignment value.
   * -1.0 (angelic/good) to +1.0 (demonic/evil)
   */
  alignment: number;
  /** Current visual appearance state based on alignment */
  currentAppearance: AlignmentState;

  // === POSITION ===
  /** Grid X coordinate */
  gridX: number;
  /** Grid Y coordinate */
  gridY: number;
  /** Which direction the Titan is facing */
  direction: NPCDirection;
  /** Whether inside a building */
  isInsideBuilding: boolean;
  /** ID of current building, null if outside */
  currentBuildingId: string | null;

  // === STATE ===
  /** Current activity (similar to NPC activities) */
  currentActivity: NPCActivity | null;

  // === SYSTEMS ===
  /** Titan's needs (extended from NPC needs with attention/growth) */
  needs: TitanNeeds;
  /** Titan's mood and internal world (extended with player beliefs) */
  mood: TitanMood;
  /** Belief-Desire-Intention AI architecture */
  bdi: TitanBDI;
  /** All skill progressions */
  skills: Record<TitanSkill, TitanSkillProgression>;
  /** Titan's personality traits (Big Five + Crypto) */
  personality: import('@/lib/npc/personality').NPCPersonality;
  
  // === HISTORY ===
  /** Record of recent actions for alignment/learning */
  actionHistory: ActionHistoryEntry[];

  // === RELATIONSHIPS ===
  /** Relationships with NPCs (keyed by NPC ID) */
  relationships: Record<string, TitanRelationship>;
}

// ============================================================================
// SERIALIZATION (for localStorage persistence)
// ============================================================================

/**
 * Serialized BDI beliefs using arrays instead of Maps for JSON compatibility.
 */
export interface SerializedTitanBDIBeliefs {
  /** Serialized world knowledge as array of [key, value] tuples */
  worldKnowledge: Array<[string, unknown]>;
  /** Serialized action beliefs as array of [action, belief] tuples */
  actionBeliefs: Array<[string, ActionBelief]>;
  /** Serialized NPC opinions as array of [npcId, opinion] tuples */
  npcOpinions: Array<[string, number]>;
  /** Player relationship data */
  playerRelationship: PlayerBelief;
}

/**
 * Serialized BDI structure for JSON compatibility.
 */
export interface SerializedTitanBDI {
  /** Serialized beliefs */
  beliefs: SerializedTitanBDIBeliefs;
  /** Desires (already JSON-compatible) */
  desires: TitanDesire[];
  /** Current intention or null */
  intentions: TitanIntention | null;
}

/**
 * Serialized Titan data for localStorage persistence.
 * Uses JSON-compatible types instead of Maps.
 * 
 * "Saving your creature is like saving your game progress.
 * Except the creature remembers everything you did. Everything."
 */
export interface SerializedTitan {
  // === IDENTITY ===
  /** Which creature species */
  species: TitanSpecies;
  /** Player-assigned name */
  name: string;
  /** Age in game days */
  age: number;

  // === POSITION ===
  /** Grid X coordinate */
  gridX: number;
  /** Grid Y coordinate */
  gridY: number;
  /** Facing direction */
  direction: NPCDirection;

  // === ALIGNMENT ===
  /** Current alignment value (-1.0 to +1.0) */
  alignment: number;
  /** Current visual state */
  currentAppearance: AlignmentState;

  // === STATS ===
  /** All skill progressions */
  skills: Record<TitanSkill, TitanSkillProgression>;
  /** Titan's personality traits */
  personality: import('@/lib/npc/personality').NPCPersonality;

  // === SYSTEMS ===
  /** Serialized needs */
  needs: TitanNeeds;
  /** Serialized mood */
  mood: TitanMood;
  /** Serialized BDI (with arrays instead of Maps) */
  bdi: SerializedTitanBDI;

  // === HISTORY ===
  /** Action history entries */
  actionHistory: ActionHistoryEntry[];

  // === RELATIONSHIPS ===
  /** Relationships with NPCs */
  relationships: Record<string, TitanRelationship>;
}

// ============================================================================
// SPAWN OPTIONS
// ============================================================================

/**
 * Options for spawning a new Titan.
 * Most fields are optional with sensible defaults.
 * 
 * "Spawning a Titan is like adopting a pet.
 * Except this pet might eventually learn to summon lightning."
 */
export interface TitanSpawnOptions {
  /** Required: Grid X position to spawn at */
  gridX: number;
  /** Required: Grid Y position to spawn at */
  gridY: number;
  /** Optional: Species (defaults to 'doge') */
  species?: TitanSpecies;
  /** Optional: Name (defaults to generated name) */
  name?: string;
  /** Optional: Starting direction (defaults to 'south') */
  direction?: NPCDirection;
  /** Optional: Starting alignment (defaults to 0.0) */
  initialAlignment?: number;
}

// ============================================================================
// STORAGE KEY
// ============================================================================

/**
 * localStorage key for Titan persistence.
 * Stored separately from NPCs for quick access.
 */
export const TITAN_STORAGE_KEY = 'crypto-city-titan';
