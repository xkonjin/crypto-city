/**
 * Titan-NPC Interaction System
 * 
 * Implements the full range of Titan-NPC interactions as defined in
 * specs/HERO_PET_SYSTEM.md Section 6.
 * 
 * The Titan can interact with NPCs in various ways, each with:
 * - Alignment impact (good/evil)
 * - Relationship effects (trust, respect, familiarity, fear)
 * - XP rewards for relevant skills
 * - Success probability based on multiple factors
 * 
 * "Your Titan's relationship with NPCs is like crypto trading:
 * mostly unpredictable, occasionally rewarding, and everyone has an opinion."
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 6 for full specification
 */

import type { TitanPet, TitanRelationship, TitanSkill } from '@/games/isocity/types/titan';
import type { CryptoNPC } from '@/games/isocity/types/npc';

// ============================================================================
// INTERACTION TYPES
// ============================================================================

/**
 * Types of interactions Titans can have with NPCs.
 * 
 * Good actions (decrease alignment toward good):
 * - help, protect, heal, teach, comfort
 * 
 * Evil actions (increase alignment toward evil):
 * - steal, scare, attack, intimidate
 * 
 * Neutral actions:
 * - greet, play, learn_from
 */
export type TitanInteractionType =
  | 'greet'         // Basic hello
  | 'help'          // Assist NPC with task (GOOD)
  | 'play'          // Play together
  | 'protect'       // Shield from danger (GOOD)
  | 'steal'         // Take from NPC (EVIL)
  | 'scare'         // Frighten NPC (EVIL)
  | 'attack'        // Harm NPC (EVIL)
  | 'heal'          // Restore NPC health (GOOD)
  | 'teach'         // Share knowledge (GOOD)
  | 'learn_from'    // Observe and learn
  | 'comfort'       // Console sad NPC (GOOD)
  | 'intimidate';   // Threaten NPC (EVIL)

/**
 * All Titan interaction types as an array for iteration/validation.
 */
export const ALL_TITAN_INTERACTIONS: TitanInteractionType[] = [
  'greet',
  'help',
  'play',
  'protect',
  'steal',
  'scare',
  'attack',
  'heal',
  'teach',
  'learn_from',
  'comfort',
  'intimidate',
];

// ============================================================================
// ALIGNMENT IMPACTS
// ============================================================================

/**
 * Alignment impact per interaction type.
 * Negative values = good (toward -1.0)
 * Positive values = evil (toward +1.0)
 * 
 * "Morality in Crypto City: where helping others makes you good,
 * and stealing their tokens makes you a blockchain pioneer."
 */
export const TITAN_INTERACTION_ALIGNMENT: Record<TitanInteractionType, number> = {
  greet: 0,           // Neutral
  help: -0.05,        // Good
  play: 0,            // Neutral
  protect: -0.1,      // Very good
  steal: 0.08,        // Evil
  scare: 0.05,        // Evil
  attack: 0.15,       // Very evil
  heal: -0.1,         // Very good
  teach: -0.05,       // Good
  learn_from: 0,      // Neutral
  comfort: -0.04,     // Good
  intimidate: 0.07,   // Evil
};

// ============================================================================
// INTERACTION EFFECTS
// ============================================================================

/**
 * Relationship effect ranges from a Titan interaction.
 * Each effect is a [min, max] range for random variation.
 * 
 * The 'fear' property is Titan-specific: how afraid is the NPC of the Titan?
 */
export interface TitanInteractionEffect {
  /** Trust change range [min, max] */
  trust: [number, number];
  /** Respect change range [min, max] */
  respect: [number, number];
  /** Familiarity change range [min, max] */
  familiarity: [number, number];
  /** Fear change range [min, max] - Titan-specific */
  fear: [number, number];
}

/**
 * Success and failure effects for each interaction type.
 */
export interface TitanInteractionEffectConfig {
  success: TitanInteractionEffect;
  failure: TitanInteractionEffect;
}

/**
 * Relationship effects for each interaction type.
 * 
 * Design philosophy:
 * - Good actions increase trust, decrease fear
 * - Evil actions decrease trust, increase fear
 * - Social actions increase familiarity
 * - Combat actions have extreme effects
 */
export const TITAN_INTERACTION_EFFECTS: Record<TitanInteractionType, TitanInteractionEffectConfig> = {
  greet: {
    success: { trust: [1, 3], respect: [0, 2], familiarity: [2, 5], fear: [0, 0] },
    failure: { trust: [-1, 0], respect: [-1, 0], familiarity: [1, 2], fear: [0, 0] },
  },
  help: {
    success: { trust: [5, 10], respect: [3, 7], familiarity: [5, 10], fear: [-5, -2] },
    failure: { trust: [-2, 0], respect: [-1, 1], familiarity: [2, 4], fear: [0, 2] },
  },
  play: {
    success: { trust: [2, 5], respect: [0, 2], familiarity: [5, 10], fear: [-2, 0] },
    failure: { trust: [-1, 0], respect: [-1, 0], familiarity: [2, 4], fear: [0, 1] },
  },
  protect: {
    success: { trust: [8, 15], respect: [5, 10], familiarity: [5, 10], fear: [-8, -3] },
    failure: { trust: [-3, 0], respect: [-2, 0], familiarity: [2, 5], fear: [0, 3] },
  },
  steal: {
    success: { trust: [-10, -5], respect: [-5, -2], familiarity: [3, 6], fear: [5, 10] },
    failure: { trust: [-5, -2], respect: [-3, 0], familiarity: [2, 4], fear: [2, 5] },
  },
  scare: {
    success: { trust: [-5, -2], respect: [-2, 2], familiarity: [3, 7], fear: [8, 15] },
    failure: { trust: [-2, 0], respect: [-3, 0], familiarity: [2, 4], fear: [2, 5] },
  },
  attack: {
    success: { trust: [-20, -10], respect: [-5, 5], familiarity: [5, 10], fear: [15, 30] },
    failure: { trust: [-10, -5], respect: [-5, 0], familiarity: [3, 6], fear: [5, 10] },
  },
  heal: {
    success: { trust: [8, 15], respect: [5, 10], familiarity: [5, 10], fear: [-5, -2] },
    failure: { trust: [-2, 0], respect: [-1, 1], familiarity: [2, 4], fear: [0, 2] },
  },
  teach: {
    success: { trust: [3, 7], respect: [5, 10], familiarity: [5, 10], fear: [-2, 0] },
    failure: { trust: [-1, 0], respect: [-2, 0], familiarity: [2, 4], fear: [0, 1] },
  },
  learn_from: {
    success: { trust: [2, 5], respect: [3, 6], familiarity: [5, 10], fear: [0, 0] },
    failure: { trust: [-1, 0], respect: [-1, 1], familiarity: [2, 4], fear: [0, 0] },
  },
  comfort: {
    success: { trust: [5, 10], respect: [2, 5], familiarity: [5, 10], fear: [-3, -1] },
    failure: { trust: [-1, 0], respect: [-1, 0], familiarity: [2, 4], fear: [0, 1] },
  },
  intimidate: {
    success: { trust: [-8, -3], respect: [0, 5], familiarity: [3, 7], fear: [10, 20] },
    failure: { trust: [-3, 0], respect: [-5, -2], familiarity: [2, 4], fear: [2, 5] },
  },
};

// ============================================================================
// XP REWARDS
// ============================================================================

/**
 * XP reward configuration for an interaction.
 */
export interface InteractionXPReward {
  /** Which skill gains XP */
  skill: TitanSkill;
  /** XP gained on success */
  success: number;
  /** XP gained on failure */
  failure: number;
}

/**
 * XP rewards for each interaction type.
 * 
 * "Experience points: the currency of self-improvement.
 * Unlike crypto, they only go up."
 */
export const INTERACTION_XP_REWARDS: Record<TitanInteractionType, InteractionXPReward> = {
  greet: { skill: 'charisma', success: 5, failure: 2 },
  help: { skill: 'empathy', success: 15, failure: 5 },
  play: { skill: 'charisma', success: 10, failure: 3 },
  protect: { skill: 'strength', success: 20, failure: 8 },
  steal: { skill: 'stealth', success: 15, failure: 3 },
  scare: { skill: 'intimidation', success: 12, failure: 4 },
  attack: { skill: 'strength', success: 20, failure: 10 },
  heal: { skill: 'empathy', success: 18, failure: 6 },
  teach: { skill: 'intelligence', success: 15, failure: 5 },
  learn_from: { skill: 'intelligence', success: 12, failure: 8 },
  comfort: { skill: 'empathy', success: 12, failure: 4 },
  intimidate: { skill: 'intimidation', success: 15, failure: 5 },
};

// ============================================================================
// INTERACTION MESSAGES
// ============================================================================

/**
 * Message templates for each interaction type.
 * Use {titanName} and {npcName} as placeholders.
 */
export interface InteractionMessageConfig {
  success: string[];
  failure: string[];
}

/**
 * Interaction messages with placeholder tokens.
 * 
 * "Messages that sound profound until you realize
 * they're just describing a digital pet helping a digital trader."
 */
export const INTERACTION_MESSAGES: Record<TitanInteractionType, InteractionMessageConfig> = {
  greet: {
    success: [
      "{titanName} greets {npcName} with a friendly bark!",
      "{titanName} waves hello to {npcName}.",
      "{npcName} smiles as {titanName} approaches.",
    ],
    failure: [
      "{titanName}'s greeting is ignored by {npcName}.",
      "{npcName} walks past {titanName} without noticing.",
    ],
  },
  help: {
    success: [
      "{titanName} helps {npcName} carry heavy boxes!",
      "{titanName} assists {npcName} with their task.",
      "{npcName} thanks {titanName} for the help!",
      "{titanName} lends a paw to {npcName}.",
    ],
    failure: [
      "{titanName} tries to help but makes things worse.",
      "{npcName} doesn't want {titanName}'s help.",
      "{titanName}'s help isn't quite what {npcName} needed.",
    ],
  },
  play: {
    success: [
      "{titanName} and {npcName} play together!",
      "{titanName} initiates a fun game with {npcName}.",
      "{npcName} laughs as {titanName} does a silly dance.",
    ],
    failure: [
      "{npcName} isn't in the mood to play with {titanName}.",
      "{titanName}'s game idea doesn't interest {npcName}.",
    ],
  },
  protect: {
    success: [
      "{titanName} bravely shields {npcName} from danger!",
      "{titanName} stands guard, protecting {npcName}.",
      "{npcName} feels safe with {titanName} watching over them.",
    ],
    failure: [
      "{titanName} tries to protect {npcName} but stumbles.",
      "{titanName}'s protection isn't needed right now.",
    ],
  },
  steal: {
    success: [
      "{titanName} snatches something from {npcName}!",
      "{titanName} sneakily takes {npcName}'s belongings.",
      "{npcName} notices their wallet is missing after {titanName} leaves.",
    ],
    failure: [
      "{npcName} catches {titanName} trying to steal!",
      "{titanName}'s theft attempt fails miserably.",
    ],
  },
  scare: {
    success: [
      "{titanName} jumps out and scares {npcName}!",
      "{npcName} screams as {titanName} startles them.",
      "{titanName}'s menacing growl frightens {npcName}.",
    ],
    failure: [
      "{npcName} isn't scared of {titanName}'s attempt.",
      "{titanName}'s scare tactic falls flat.",
    ],
  },
  attack: {
    success: [
      "{titanName} attacks {npcName} viciously!",
      "{titanName} lunges at {npcName} aggressively.",
      "{npcName} cries out as {titanName} strikes!",
    ],
    failure: [
      "{npcName} dodges {titanName}'s attack!",
      "{titanName}'s attack misses {npcName}.",
    ],
  },
  heal: {
    success: [
      "{titanName} uses healing power on {npcName}!",
      "{npcName} feels better after {titanName}'s care.",
      "{titanName} tends to {npcName}'s wounds.",
    ],
    failure: [
      "{titanName}'s healing attempt doesn't work.",
      "{npcName} doesn't need {titanName}'s healing.",
    ],
  },
  teach: {
    success: [
      "{titanName} teaches {npcName} something new!",
      "{npcName} learns from {titanName}'s demonstration.",
      "{titanName} shares valuable knowledge with {npcName}.",
    ],
    failure: [
      "{npcName} doesn't understand {titanName}'s lesson.",
      "{titanName}'s teaching goes over {npcName}'s head.",
    ],
  },
  learn_from: {
    success: [
      "{titanName} carefully observes {npcName}'s techniques!",
      "{titanName} learns something new by watching {npcName}.",
      "{npcName} notices {titanName} studying their methods.",
    ],
    failure: [
      "{titanName} can't quite grasp what {npcName} is doing.",
      "{npcName} moves too fast for {titanName} to follow.",
    ],
  },
  comfort: {
    success: [
      "{titanName} comforts the sad {npcName}.",
      "{npcName} feels better after {titanName}'s support.",
      "{titanName} nuzzles {npcName} reassuringly.",
    ],
    failure: [
      "{npcName} isn't ready to be comforted by {titanName}.",
      "{titanName}'s comfort attempt feels awkward.",
    ],
  },
  intimidate: {
    success: [
      "{titanName} intimidates {npcName} with a fierce growl!",
      "{npcName} backs away from {titanName}'s threatening stance.",
      "{titanName} asserts dominance over {npcName}.",
    ],
    failure: [
      "{npcName} isn't intimidated by {titanName}.",
      "{titanName}'s intimidation attempt makes {npcName} laugh.",
    ],
  },
};

// ============================================================================
// REQUEST/RESULT TYPES
// ============================================================================

/**
 * Request to initiate a Titan-NPC interaction.
 */
export interface TitanInteractionRequest {
  /** ID of the Titan */
  titanId: string;
  /** ID of the target NPC */
  npcId: string;
  /** Type of interaction to perform */
  type: TitanInteractionType;
  /** Optional context for the interaction */
  context?: string;
}

/**
 * Result of processing a Titan-NPC interaction.
 */
export interface TitanInteractionResult {
  /** Whether the interaction succeeded */
  success: boolean;
  /** Type of interaction performed */
  type: TitanInteractionType;
  /** ID of the Titan */
  titanId: string;
  /** ID of the NPC */
  npcId: string;
  /** Alignment change to apply to Titan */
  alignmentChange: number;
  /** Relationship changes to apply */
  relationshipChanges: {
    trust?: number;
    respect?: number;
    familiarity?: number;
    fear?: number;
  };
  /** XP rewards for the Titan */
  titanXP: { skill: string; amount: number }[];
  /** Mood effect on the NPC (-1 to +1) */
  npcMoodEffect: number;
  /** Mood effect on the Titan (-1 to +1) */
  titanMoodEffect: number;
  /** Message describing the interaction */
  message: string;
}

// ============================================================================
// INTERACTION VALIDATION
// ============================================================================

/**
 * Result of checking if an interaction can occur.
 */
export interface CanInteractResult {
  canInteract: boolean;
  reason?: string;
}

/** Maximum interaction range in grid tiles */
const MAX_INTERACTION_RANGE = 5;

/**
 * Check if a Titan can interact with an NPC.
 * 
 * Validates:
 * - Distance between Titan and NPC
 * - Both must be in same building context (both outside or both in same building)
 * 
 * @param titan The Titan attempting interaction
 * @param npc The target NPC
 * @param type The type of interaction
 * @returns Whether the interaction can proceed and why not if it can't
 */
export function canInteract(
  titan: TitanPet,
  npc: CryptoNPC,
  type: TitanInteractionType
): CanInteractResult {
  // Check building context
  if (titan.isInsideBuilding !== npc.isInsideBuilding) {
    return {
      canInteract: false,
      reason: "Cannot interact: one is inside a building and one is outside.",
    };
  }

  if (titan.isInsideBuilding && npc.isInsideBuilding) {
    if (titan.currentBuildingId !== npc.currentBuildingId) {
      return {
        canInteract: false,
        reason: "Cannot interact: in different buildings.",
      };
    }
  }

  // Check distance
  const dx = Math.abs(titan.gridX - npc.gridX);
  const dy = Math.abs(titan.gridY - npc.gridY);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > MAX_INTERACTION_RANGE) {
    return {
      canInteract: false,
      reason: `Cannot interact: NPC is too far away (${distance.toFixed(1)} tiles, max ${MAX_INTERACTION_RANGE}).`,
    };
  }

  // All checks passed
  return { canInteract: true };
}

// ============================================================================
// SUCCESS CALCULATION
// ============================================================================

/**
 * Skill mapping for each interaction type.
 * Determines which skill affects success probability.
 */
const INTERACTION_SKILL_MAP: Record<TitanInteractionType, TitanSkill> = {
  greet: 'charisma',
  help: 'empathy',
  play: 'charisma',
  protect: 'strength',
  steal: 'stealth',
  scare: 'intimidation',
  attack: 'strength',
  heal: 'empathy',
  teach: 'intelligence',
  learn_from: 'intelligence',
  comfort: 'empathy',
  intimidate: 'intimidation',
};

/**
 * Actions that benefit from good alignment.
 */
const GOOD_ACTIONS: TitanInteractionType[] = ['help', 'protect', 'heal', 'teach', 'comfort'];

/**
 * Actions that benefit from evil alignment.
 */
const EVIL_ACTIONS: TitanInteractionType[] = ['steal', 'scare', 'attack', 'intimidate'];

/**
 * Calculate success probability for an interaction.
 * 
 * Factors:
 * - Base chance (50%)
 * - Titan's relevant skill level (+10% per level above 1)
 * - Existing relationship trust (+30% at max trust)
 * - Alignment match (good actions +20% for good alignment, vice versa)
 * - Random factor (±20%)
 * 
 * @param titan The Titan performing the interaction
 * @param npc The target NPC
 * @param type The type of interaction
 * @returns Probability between 0 and 1
 */
export function calculateInteractionSuccess(
  titan: TitanPet,
  npc: CryptoNPC,
  type: TitanInteractionType
): number {
  const baseChance = 0.5;

  // Skill bonus: +10% per level above 1
  const relevantSkill = INTERACTION_SKILL_MAP[type];
  const skillLevel = titan.skills[relevantSkill]?.level ?? 1;
  const skillBonus = (skillLevel - 1) * 0.1;

  // Trust bonus: up to +30% at 100 trust
  const relationship = titan.relationships[npc.id];
  const trust = relationship?.trust ?? 0;
  const trustBonus = (trust / 100) * 0.3;

  // Alignment bonus: good actions benefit from good alignment, evil from evil
  let alignmentBonus = 0;
  if (GOOD_ACTIONS.includes(type)) {
    // Good actions get bonus from good alignment (negative alignment values)
    alignmentBonus = titan.alignment < 0 ? Math.abs(titan.alignment) * 0.2 : -Math.abs(titan.alignment) * 0.1;
  } else if (EVIL_ACTIONS.includes(type)) {
    // Evil actions get bonus from evil alignment (positive alignment values)
    alignmentBonus = titan.alignment > 0 ? titan.alignment * 0.2 : -Math.abs(titan.alignment) * 0.1;
  }

  // Personality bonus for specific actions
  let personalityBonus = 0;
  if (type === 'help' || type === 'comfort') {
    personalityBonus = (titan.personality.bigFive.agreeableness - 0.5) * 0.1;
  }
  if (type === 'attack' || type === 'intimidate') {
    personalityBonus = (0.5 - titan.personality.bigFive.agreeableness) * 0.1;
  }

  // Calculate final probability
  const probability = baseChance + skillBonus + trustBonus + alignmentBonus + personalityBonus;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, probability));
}

// ============================================================================
// INTERACTION PROCESSING
// ============================================================================

/**
 * Get a random value within a range.
 */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Select a random message from an array and substitute placeholders.
 */
function formatMessage(
  messages: string[],
  titanName: string,
  npcName: string
): string {
  const template = messages[Math.floor(Math.random() * messages.length)];
  return template.replace(/{titanName}/g, titanName).replace(/{npcName}/g, npcName);
}

/**
 * Process a Titan-NPC interaction request.
 * 
 * This calculates:
 * - Whether the interaction succeeds (based on calculateInteractionSuccess)
 * - Alignment change
 * - Relationship effects
 * - XP rewards
 * - Mood effects
 * - Message
 * 
 * @param request The interaction request
 * @param titan The Titan performing the interaction
 * @param npc The target NPC
 * @returns The interaction result
 */
export function processInteraction(
  request: TitanInteractionRequest,
  titan: TitanPet,
  npc: CryptoNPC
): TitanInteractionResult {
  const { type } = request;

  // Calculate success
  const successProbability = calculateInteractionSuccess(titan, npc, type);
  const success = Math.random() < successProbability;

  // Get alignment change
  const alignmentChange = TITAN_INTERACTION_ALIGNMENT[type];

  // Get effects based on success/failure
  const effectConfig = TITAN_INTERACTION_EFFECTS[type];
  const effects = success ? effectConfig.success : effectConfig.failure;

  // Calculate relationship changes
  const relationshipChanges: TitanInteractionResult['relationshipChanges'] = {
    trust: Math.round(randomInRange(effects.trust[0], effects.trust[1])),
    respect: Math.round(randomInRange(effects.respect[0], effects.respect[1])),
    familiarity: Math.round(randomInRange(effects.familiarity[0], effects.familiarity[1])),
    fear: Math.round(randomInRange(effects.fear[0], effects.fear[1])),
  };

  // Get XP reward
  const xpConfig = INTERACTION_XP_REWARDS[type];
  const xpAmount = success ? xpConfig.success : xpConfig.failure;
  const titanXP = [{ skill: xpConfig.skill, amount: xpAmount }];

  // Calculate mood effects
  // Success generally improves mood for both, failure can hurt
  const npcMoodEffect = success
    ? randomInRange(0.1, 0.3)
    : randomInRange(-0.2, 0);
  
  // Titan mood based on success and interaction type
  let titanMoodEffect = success ? randomInRange(0.1, 0.2) : randomInRange(-0.1, 0);
  
  // Evil actions may boost evil Titan's mood
  if (EVIL_ACTIONS.includes(type) && titan.alignment > 0) {
    titanMoodEffect += 0.1;
  }
  // Good actions may boost good Titan's mood
  if (GOOD_ACTIONS.includes(type) && titan.alignment < 0) {
    titanMoodEffect += 0.1;
  }

  // Get message
  const messageConfig = INTERACTION_MESSAGES[type];
  const messages = success ? messageConfig.success : messageConfig.failure;
  const message = formatMessage(messages, titan.name, npc.name);

  return {
    success,
    type,
    titanId: titan.id,
    npcId: npc.id,
    alignmentChange,
    relationshipChanges,
    titanXP,
    npcMoodEffect,
    titanMoodEffect,
    message,
  };
}

// ============================================================================
// EFFECT APPLICATION
// ============================================================================

/**
 * Clamp a value to a range.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Apply the results of an interaction to the Titan and NPC.
 * 
 * Updates:
 * - Titan's alignment
 * - Titan's relationship with the NPC
 * - Titan's skill XP
 * - Titan's action history
 * 
 * @param result The interaction result to apply
 * @param titan The Titan (mutated)
 * @param npc The NPC (used for reference)
 */
export function applyInteractionEffects(
  result: TitanInteractionResult,
  titan: TitanPet,
  npc: CryptoNPC
): void {
  // Update alignment (clamped to [-1, 1])
  titan.alignment = clamp(titan.alignment + result.alignmentChange, -1, 1);

  // Update or create relationship
  if (!titan.relationships[npc.id]) {
    titan.relationships[npc.id] = {
      npcId: npc.id,
      trust: 0,
      respect: 0,
      familiarity: 0,
      fear: 0,
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 0,
    };
  }

  const relationship = titan.relationships[npc.id];
  
  // Apply relationship changes (clamped to valid ranges)
  if (result.relationshipChanges.trust !== undefined) {
    relationship.trust = clamp(relationship.trust + result.relationshipChanges.trust, -100, 100);
  }
  if (result.relationshipChanges.familiarity !== undefined) {
    relationship.familiarity = clamp(relationship.familiarity + result.relationshipChanges.familiarity, 0, 100);
  }
  if (result.relationshipChanges.respect !== undefined) {
    relationship.respect = clamp(relationship.respect + result.relationshipChanges.respect, -100, 100);
  }
  if (result.relationshipChanges.fear !== undefined) {
    relationship.fear = clamp(relationship.fear + result.relationshipChanges.fear, 0, 100);
  }
  
  relationship.lastInteraction = Date.now();
  relationship.interactionCount++;

  // Grant XP to skills
  for (const xp of result.titanXP) {
    const skill = xp.skill as TitanSkill;
    if (titan.skills[skill]) {
      titan.skills[skill].experience += xp.amount;
    }
  }

  // Add to action history
  titan.actionHistory.push({
    action: `interact_${result.type}`,
    timestamp: Date.now(),
    alignmentImpact: result.alignmentChange,
    relatedNpcId: npc.id,
  });
}

// ============================================================================
// INTERACTION SELECTION
// ============================================================================

/**
 * Interaction weights by category.
 */
const INTERACTION_WEIGHTS = {
  neutral: ['greet', 'play', 'learn_from'] as TitanInteractionType[],
  good: ['help', 'protect', 'heal', 'teach', 'comfort'] as TitanInteractionType[],
  evil: ['steal', 'scare', 'attack', 'intimidate'] as TitanInteractionType[],
};

/**
 * Select the best interaction type based on Titan's personality and alignment.
 * 
 * Selection weights:
 * - Good Titans prefer good actions
 * - Evil Titans prefer evil actions
 * - Neutral Titans have balanced selection
 * - Personality (agreeableness) influences weight
 * 
 * @param titan The Titan selecting an interaction
 * @param npc The target NPC
 * @returns The selected interaction type
 */
export function selectInteractionType(
  titan: TitanPet,
  npc: CryptoNPC
): TitanInteractionType {
  // Calculate weights for each category
  const alignment = titan.alignment;
  const agreeableness = titan.personality.bigFive.agreeableness;
  
  // Base weights
  let neutralWeight = 0.3;
  let goodWeight = 0.35;
  let evilWeight = 0.35;

  // Adjust based on alignment
  if (alignment < -0.3) {
    // Good alignment: prefer good actions
    goodWeight += Math.abs(alignment) * 0.4;
    evilWeight -= Math.abs(alignment) * 0.3;
  } else if (alignment > 0.3) {
    // Evil alignment: prefer evil actions
    evilWeight += alignment * 0.4;
    goodWeight -= alignment * 0.3;
  }

  // Adjust based on personality
  if (agreeableness > 0.6) {
    goodWeight += (agreeableness - 0.5) * 0.3;
    evilWeight -= (agreeableness - 0.5) * 0.2;
  } else if (agreeableness < 0.4) {
    evilWeight += (0.5 - agreeableness) * 0.3;
    goodWeight -= (0.5 - agreeableness) * 0.2;
  }

  // Normalize weights
  const total = neutralWeight + goodWeight + evilWeight;
  neutralWeight /= total;
  goodWeight /= total;
  evilWeight /= total;

  // Random selection based on weights
  const roll = Math.random();
  
  let category: 'neutral' | 'good' | 'evil';
  if (roll < neutralWeight) {
    category = 'neutral';
  } else if (roll < neutralWeight + goodWeight) {
    category = 'good';
  } else {
    category = 'evil';
  }

  // Select random action from category
  const actions = INTERACTION_WEIGHTS[category];
  return actions[Math.floor(Math.random() * actions.length)];
}
