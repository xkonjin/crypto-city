/**
 * NPC Titan Reactions System
 * 
 * Handles how NPCs react to the Titan based on alignment, relationship history,
 * and personality traits. NPCs can flee from evil Titans, worship angelic ones,
 * or challenge them based on their personality.
 * 
 * "NPCs have feelings too. Specifically, they feel fear when a demonic creature
 * with glowing red eyes approaches them. Can't imagine why."
 * - Hitchhiker's Guide to Crypto City
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 6.3 for design documentation
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { TitanPet, TitanRelationship } from '@/games/isocity/types/titan';

// ============================================================================
// NPC REACTION TYPES
// ============================================================================

/**
 * Possible reactions an NPC can have to the Titan.
 * 
 * "The range of NPC emotions spans from 'run away screaming' to
 * 'bow in reverent worship'. There is no 'slightly concerned'."
 */
export type NPCReaction =
  | 'flee'         // Run away from Titan
  | 'cower'        // Stay still, afraid
  | 'ignore'       // No special reaction
  | 'approach'     // Walk toward Titan
  | 'greet'        // Wave/acknowledge
  | 'worship'      // Bow/praise (angelic Titan)
  | 'challenge'    // Confront (brave NPCs to evil Titan)
  | 'offer_gift'   // Give something to Titan
  | 'seek_help';   // Ask Titan for assistance

/**
 * All possible NPC reactions as an array for iteration/validation.
 */
export const ALL_NPC_REACTIONS: NPCReaction[] = [
  'flee',
  'cower',
  'ignore',
  'approach',
  'greet',
  'worship',
  'challenge',
  'offer_gift',
  'seek_help',
];

// ============================================================================
// REACTION PRIORITY SYSTEM
// ============================================================================

/**
 * A priority rule that determines when an NPC should have a specific reaction.
 * Higher weight = higher priority when multiple conditions match.
 */
export interface NPCReactionPriority {
  /** The reaction this priority triggers */
  reaction: NPCReaction;
  /** Priority weight (higher = more likely to be chosen) */
  weight: number;
  /** Condition function that determines if this reaction applies */
  condition: (npc: CryptoNPC, titan: TitanPet, relationship: TitanRelationship | null) => boolean;
}

/**
 * Reaction priorities, evaluated in order. First matching condition
 * with highest weight wins.
 * 
 * "Priority systems are like crypto market orders - the one with the
 * highest number usually wins, unless something catastrophically fails."
 */
export const REACTION_PRIORITIES: NPCReactionPriority[] = [
  // Fear-based reactions (highest priority)
  {
    reaction: 'flee',
    weight: 100,
    condition: (npc, titan, rel) => {
      const fear = calculateFearLevel(npc, titan, rel);
      return fear > 60;
    },
  },
  {
    reaction: 'cower',
    weight: 90,
    condition: (npc, titan, rel) => {
      const fear = calculateFearLevel(npc, titan, rel);
      return fear > 40 && npc.personality.bigFive.neuroticism > 0.6;
    },
  },
  // Worship (angelic Titans)
  {
    reaction: 'worship',
    weight: 80,
    condition: (_npc, titan, rel) => {
      // Angelic alignment (< -0.6)
      if (titan.alignment < -0.6) return true;
      // Good alignment with high trust
      if (titan.alignment < -0.3 && rel && rel.trust > 50) return true;
      return false;
    },
  },
  // Challenge (brave NPCs confronting evil)
  {
    reaction: 'challenge',
    weight: 70,
    condition: (npc, titan, rel) => {
      // Only challenge evil Titans
      if (titan.alignment <= 0.4) return false;
      // Brave = low neuroticism, low agreeableness
      const isBrave = npc.personality.bigFive.neuroticism < 0.3;
      const isConfrontational = npc.personality.bigFive.agreeableness < 0.4;
      // Don't challenge if already scared
      const fear = calculateFearLevel(npc, titan, rel);
      return isBrave && isConfrontational && fear < 40;
    },
  },
  // Seek help (NPC in need + trusting Titan)
  {
    reaction: 'seek_help',
    weight: 60,
    condition: (npc, titan, rel) => {
      // Must trust the Titan somewhat
      const trust = calculateTrustLevel(npc, titan, rel);
      if (trust < 20) return false;
      // Must be in need (low hunger, energy, or other needs)
      const hasLowNeeds = 
        npc.needs.hunger.current < 30 ||
        npc.needs.energy.current < 20;
      return hasLowNeeds && titan.alignment < 0.2; // Not evil
    },
  },
  // Offer gift (friendly NPC + good Titan)
  {
    reaction: 'offer_gift',
    weight: 50,
    condition: (npc, titan, rel) => {
      // High agreeableness and familiarity
      if (npc.personality.bigFive.agreeableness < 0.7) return false;
      if (!rel || rel.familiarity < 40) return false;
      // Titan is good-aligned
      return titan.alignment < -0.2 && rel.trust > 30;
    },
  },
  // Approach (friendly reaction to trusted/good Titan)
  {
    reaction: 'approach',
    weight: 40,
    condition: (npc, titan, rel) => {
      const trust = calculateTrustLevel(npc, titan, rel);
      const fear = calculateFearLevel(npc, titan, rel);
      // Must trust and not fear
      return trust > 30 && fear < 20 && titan.alignment < 0.2;
    },
  },
  // Greet (casual acknowledgment)
  {
    reaction: 'greet',
    weight: 30,
    condition: (npc, titan, rel) => {
      // Only highly extroverted NPCs greet (> 0.6)
      if (npc.personality.bigFive.extraversion <= 0.6) return false;
      const fear = calculateFearLevel(npc, titan, rel);
      // Not afraid and Titan is at least somewhat good
      return fear < 30 && titan.alignment < -0.1;
    },
  },
  // Ignore (default fallback)
  {
    reaction: 'ignore',
    weight: 10,
    condition: () => true, // Always matches as fallback
  },
];

// ============================================================================
// FEAR CALCULATION
// ============================================================================

/**
 * Calculate how afraid an NPC is of the Titan (0-100 scale).
 * 
 * Factors considered:
 * - Titan alignment (evil = more fear)
 * - Relationship fear value
 * - NPC neuroticism (high = more fearful)
 * - Titan's current action (attacking = scary)
 * 
 * "Fear is calculated using a complex algorithm involving alignment values,
 * personality traits, and whether the creature is currently on fire."
 * 
 * @param npc - The NPC being evaluated
 * @param titan - The Titan being reacted to
 * @param relationship - Optional existing relationship data
 * @returns Fear level from 0 (no fear) to 100 (maximum terror)
 */
export function calculateFearLevel(
  npc: CryptoNPC,
  titan: TitanPet,
  relationship?: TitanRelationship | null
): number {
  let fear = 0;

  // 1. Alignment fear: Evil Titans are scary (0-50 points)
  // Only positive alignment (evil) contributes to fear
  if (titan.alignment > 0) {
    fear += titan.alignment * 50;
  }

  // 2. Relationship fear: Past scary experiences (0-30 points)
  // fear tracks how afraid this NPC is of the Titan
  if (relationship?.fear) {
    fear += relationship.fear * 0.3;
  }

  // 3. Neuroticism modifier: Anxious NPCs fear more (0-25 points)
  fear += (npc.personality.bigFive.neuroticism - 0.5) * 50;

  // 4. Current action modifier: Attacking is terrifying (+30 points)
  const scaryActions = ['attack_npc', 'scare_npc', 'intimidate', 'destroy_property'];
  if (titan.currentActivity && scaryActions.includes(titan.currentActivity as string)) {
    fear += 30;
  }

  // 5. Good alignment provides safety (negative modifier)
  if (titan.alignment < -0.3) {
    fear -= Math.abs(titan.alignment) * 20;
  }

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, fear));
}

// ============================================================================
// TRUST CALCULATION
// ============================================================================

/**
 * Calculate how much an NPC trusts the Titan (-100 to +100 scale).
 * 
 * Factors considered:
 * - Relationship trust value
 * - Titan alignment (good = more trust)
 * - NPC agreeableness (high = more trusting baseline)
 * - Shared faction membership
 * 
 * "Trust is earned through good deeds. Or at least by not setting
 * anyone on fire recently. The bar is surprisingly low."
 * 
 * @param npc - The NPC being evaluated
 * @param titan - The Titan being reacted to  
 * @param relationship - Optional existing relationship data
 * @returns Trust level from -100 (complete distrust) to +100 (absolute faith)
 */
export function calculateTrustLevel(
  npc: CryptoNPC,
  titan: TitanPet,
  relationship?: TitanRelationship | null
): number {
  let trust = 0;

  // 1. Alignment trust: Good Titans are trusted (+/-50 points)
  // Negative alignment = good = positive trust
  trust += titan.alignment * -50;

  // 2. Relationship trust: Past positive experiences (+/-40 points)
  if (relationship?.trust) {
    trust += relationship.trust * 0.4;
  }

  // 3. Agreeableness baseline: Trusting NPCs trust more easily (+/-25 points)
  trust += (npc.personality.bigFive.agreeableness - 0.5) * 50;

  // 4. Shared faction bonus (+15 points)
  // Check if NPC and Titan share a faction (via relationship or direct check)
  if (npc.factionId && relationship) {
    // Assume shared faction if high familiarity and positive respect
    if (relationship.familiarity > 50 && relationship.respect > 20) {
      trust += 15;
    }
  }

  // 5. Fear reduces trust
  const fear = calculateFearLevel(npc, titan, relationship);
  trust -= fear * 0.3;

  // Clamp to -100 to +100 range
  return Math.max(-100, Math.min(100, trust));
}

// ============================================================================
// CORE REACTION FUNCTIONS
// ============================================================================

/**
 * Get the NPC's reaction to the Titan.
 * Evaluates all priority conditions and returns the highest-weight match.
 * 
 * @param npc - The NPC reacting
 * @param titan - The Titan being reacted to
 * @param relationship - Optional relationship history
 * @returns The appropriate NPCReaction
 */
export function getNPCReaction(
  npc: CryptoNPC,
  titan: TitanPet,
  relationship?: TitanRelationship | null
): NPCReaction {
  // Sort priorities by weight (highest first)
  const sortedPriorities = [...REACTION_PRIORITIES].sort((a, b) => b.weight - a.weight);

  // Find first matching condition
  for (const priority of sortedPriorities) {
    if (priority.condition(npc, titan, relationship ?? null)) {
      return priority.reaction;
    }
  }

  // Fallback (should never reach due to 'ignore' always matching)
  return 'ignore';
}

/**
 * Detailed reaction result with additional context.
 */
export interface NPCReactionDetailed {
  /** The reaction type */
  reaction: NPCReaction;
  /** Human-readable explanation for the reaction */
  reason: string;
  /** How strongly the NPC reacts (0-1, higher = more intense) */
  intensity: number;
}

/**
 * Get the NPC's reaction with additional context about why.
 * 
 * @param npc - The NPC reacting
 * @param titan - The Titan being reacted to
 * @param relationship - Optional relationship history
 * @returns Detailed reaction info including reason and intensity
 */
export function getNPCReactionDetailed(
  npc: CryptoNPC,
  titan: TitanPet,
  relationship?: TitanRelationship | null
): NPCReactionDetailed {
  const reaction = getNPCReaction(npc, titan, relationship);
  const fear = calculateFearLevel(npc, titan, relationship);
  const trust = calculateTrustLevel(npc, titan, relationship);

  // Calculate intensity based on reaction type
  let intensity: number;
  let reason: string;

  switch (reaction) {
    case 'flee':
      intensity = Math.min(1, fear / 80);
      reason = `High fear level (${Math.round(fear)}) from ${titan.alignment > 0.5 ? 'demonic' : 'evil'} Titan`;
      break;
    case 'cower':
      intensity = Math.min(1, fear / 70);
      reason = `Paralyzed by fear (${Math.round(fear)}) due to high neuroticism`;
      break;
    case 'worship':
      intensity = Math.min(1, (Math.abs(titan.alignment) + 0.4) / 1.4);
      reason = `Reverence for angelic Titan (alignment: ${titan.alignment.toFixed(2)})`;
      break;
    case 'challenge':
      intensity = Math.min(1, (1 - npc.personality.bigFive.neuroticism) * 0.8);
      reason = `Brave NPC confronting evil (low neuroticism: ${npc.personality.bigFive.neuroticism.toFixed(2)})`;
      break;
    case 'seek_help':
      intensity = 0.5;
      reason = `NPC in need seeking assistance from trusted Titan`;
      break;
    case 'offer_gift':
      intensity = 0.6;
      reason = `Friendly NPC offering gift to good-aligned Titan`;
      break;
    case 'approach':
      intensity = Math.min(1, trust / 60);
      reason = `Trust (${Math.round(trust)}) leads to approach`;
      break;
    case 'greet':
      intensity = 0.4;
      reason = `Casual acknowledgment from extroverted NPC`;
      break;
    case 'ignore':
    default:
      intensity = 0.1;
      reason = `No strong feelings about neutral Titan`;
      break;
  }

  return { reaction, reason, intensity };
}

// ============================================================================
// PATHFINDING MODIFICATIONS
// ============================================================================

/**
 * Check if an NPC should avoid a position due to Titan proximity.
 * 
 * @param npc - The NPC checking the position
 * @param position - The position being evaluated
 * @param titanPosition - The Titan's current position
 * @param titan - The Titan entity
 * @returns True if the position should be avoided
 */
export function shouldAvoidPosition(
  npc: CryptoNPC,
  position: { x: number; y: number },
  titanPosition: { x: number; y: number },
  titan: TitanPet
): boolean {
  // Good/angelic Titans are not avoided
  if (titan.alignment < 0) {
    return false;
  }

  const avoidRadius = getAvoidanceRadius(npc, titan, null);
  if (avoidRadius === 0) {
    return false;
  }

  // Calculate distance between position and Titan
  const dx = position.x - titanPosition.x;
  const dy = position.y - titanPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < avoidRadius;
}

/**
 * Get the radius within which an NPC will avoid the Titan (0-10 tiles).
 * 
 * @param npc - The NPC being evaluated
 * @param titan - The Titan to avoid
 * @param relationship - Optional relationship data
 * @returns Avoidance radius in tiles (0 = no avoidance, up to 10)
 */
export function getAvoidanceRadius(
  npc: CryptoNPC,
  titan: TitanPet,
  relationship?: TitanRelationship | null
): number {
  // No avoidance for good Titans
  if (titan.alignment <= 0) {
    return 0;
  }

  const fear = calculateFearLevel(npc, titan, relationship);
  
  // No avoidance if not afraid
  if (fear < 20) {
    return 0;
  }

  // Scale radius with fear (fear 20-100 maps to radius 1-10)
  const scaledRadius = ((fear - 20) / 80) * 9 + 1;
  
  return Math.min(10, Math.round(scaledRadius));
}

/**
 * Get how close an NPC will voluntarily approach the Titan.
 * 
 * @param npc - The NPC being evaluated
 * @param titan - The Titan to approach
 * @param relationship - Optional relationship data
 * @returns Approach radius in tiles (how close they'll get)
 */
export function getApproachRadius(
  npc: CryptoNPC,
  titan: TitanPet,
  relationship?: TitanRelationship | null
): number {
  const fear = calculateFearLevel(npc, titan, relationship);
  const trust = calculateTrustLevel(npc, titan, relationship);

  // Won't approach if afraid
  if (fear > 30) {
    return 0;
  }

  // Won't approach if distrusting
  if (trust < 0) {
    return 0;
  }

  // Scale approach radius with trust (trust 0-100 maps to radius 1-5)
  const scaledRadius = (trust / 100) * 4 + 1;
  
  return Math.round(scaledRadius);
}

// ============================================================================
// REACTION ANIMATIONS
// ============================================================================

/**
 * Animation data for a reaction.
 */
export interface ReactionAnimation {
  /** NPC animation to play (optional, uses default if not specified) */
  npcAnimation?: string;
  /** How long the reaction lasts in milliseconds */
  duration: number;
  /** Direction of movement during reaction */
  movement?: 'away' | 'toward' | 'none';
  /** Speed of movement during reaction */
  speed?: 'fast' | 'normal' | 'slow';
}

/**
 * Animation configurations for each reaction type.
 * 
 * "Animations are like blockchain transactions - they take time,
 * they're irreversible once started, and watching them is oddly satisfying."
 */
export const REACTION_ANIMATIONS: Record<NPCReaction, ReactionAnimation> = {
  flee: {
    npcAnimation: 'running',
    duration: 5000,
    movement: 'away',
    speed: 'fast',
  },
  cower: {
    npcAnimation: 'cowering',
    duration: 3000,
    movement: 'none',
    speed: 'normal',
  },
  ignore: {
    duration: 1000,
    movement: 'none',
    speed: 'normal',
  },
  approach: {
    npcAnimation: 'walking',
    duration: 2000,
    movement: 'toward',
    speed: 'normal',
  },
  greet: {
    npcAnimation: 'waving',
    duration: 1500,
    movement: 'none',
    speed: 'normal',
  },
  worship: {
    npcAnimation: 'bowing',
    duration: 3000,
    movement: 'toward',
    speed: 'slow',
  },
  challenge: {
    npcAnimation: 'confronting',
    duration: 2500,
    movement: 'toward',
    speed: 'normal',
  },
  offer_gift: {
    npcAnimation: 'offering',
    duration: 2000,
    movement: 'toward',
    speed: 'slow',
  },
  seek_help: {
    npcAnimation: 'pleading',
    duration: 2500,
    movement: 'toward',
    speed: 'slow',
  },
};

// ============================================================================
// REACTION MESSAGES
// ============================================================================

/**
 * Message templates for each reaction type.
 * Use {npcName} and {titanName} as placeholders.
 * 
 * "Every reaction deserves a dramatic announcement.
 * NPCs are nothing if not theatrical."
 */
export const REACTION_MESSAGES: Record<NPCReaction, string[]> = {
  flee: [
    "{npcName} runs away in terror!",
    "{npcName} flees from the demon!",
    "{npcName} screams and runs!",
    "A panicked {npcName} escapes!",
  ],
  cower: [
    "{npcName} cowers in fear!",
    "{npcName} freezes, trembling!",
    "{npcName} is paralyzed with fear!",
    "{npcName} can't move from terror!",
  ],
  ignore: [
    "{npcName} continues on their way.",
    "{npcName} doesn't seem to notice.",
    "{npcName} is too busy to care.",
  ],
  approach: [
    "{npcName} approaches {titanName}.",
    "{npcName} walks toward {titanName} curiously.",
    "{npcName} moves closer to {titanName}.",
  ],
  greet: [
    "{npcName} waves at {titanName}!",
    "{npcName} greets {titanName} warmly.",
    "{npcName} acknowledges {titanName}.",
  ],
  worship: [
    "{npcName} bows before the angelic Titan!",
    "{npcName} offers prayers to {titanName}.",
    "{npcName} kneels in reverence!",
    "{npcName} is in awe of {titanName}'s radiance!",
  ],
  challenge: [
    "{npcName} confronts {titanName} boldly!",
    "{npcName} stands up to the evil Titan!",
    "{npcName} refuses to back down!",
    "{npcName} challenges {titanName}!",
  ],
  offer_gift: [
    "{npcName} offers a gift to {titanName}!",
    "{npcName} presents something to {titanName}.",
    "{npcName} wants to give {titanName} a token of gratitude.",
  ],
  seek_help: [
    "{npcName} asks {titanName} for help!",
    "{npcName} pleads with {titanName} for assistance.",
    "{npcName} seeks {titanName}'s aid!",
  ],
};

// ============================================================================
// PROXIMITY PROCESSING
// ============================================================================

/**
 * Result of processing NPC-Titan proximity.
 */
export interface ProximityResult {
  /** The reaction the NPC should have */
  reaction: NPCReaction;
  /** Optional path modification instructions */
  pathModification?: { avoidRadius: number } | { approachTarget: { x: number; y: number } };
  /** Optional animation to play */
  animation?: string;
  /** Optional message to display */
  message?: string;
}

/**
 * Process an NPC's proximity to the Titan and determine appropriate reaction.
 * This is the main hook for NPCSimulation to call.
 * 
 * @param npc - The NPC being processed
 * @param titan - The Titan nearby
 * @param distance - Current distance in tiles
 * @param relationship - Optional relationship data
 * @returns Proximity result with reaction details, or null if no special reaction
 */
export function processNPCTitanProximity(
  npc: CryptoNPC,
  titan: TitanPet,
  distance: number,
  relationship?: TitanRelationship | null
): ProximityResult | null {
  // No reaction if too far away (beyond perception range)
  const perceptionRange = 15;
  if (distance > perceptionRange) {
    return null;
  }

  // Get the reaction
  const reaction = getNPCReaction(npc, titan, relationship);
  
  // Ignore reaction at long distance means truly no reaction
  if (reaction === 'ignore' && distance > 5) {
    return null;
  }

  // Build result
  const result: ProximityResult = {
    reaction,
  };

  // Add path modification based on reaction
  if (reaction === 'flee' || reaction === 'cower') {
    const avoidRadius = getAvoidanceRadius(npc, titan, relationship);
    if (avoidRadius > 0) {
      result.pathModification = { avoidRadius };
    }
  } else if (['approach', 'worship', 'greet', 'seek_help', 'offer_gift'].includes(reaction)) {
    const approachRadius = getApproachRadius(npc, titan, relationship);
    if (approachRadius > 0) {
      result.pathModification = { 
        approachTarget: { x: titan.gridX, y: titan.gridY } 
      };
    }
  }

  // Add animation
  const animationData = REACTION_ANIMATIONS[reaction];
  if (animationData.npcAnimation) {
    result.animation = animationData.npcAnimation;
  }

  // Add message (skip for ignore)
  if (reaction !== 'ignore') {
    const messages = REACTION_MESSAGES[reaction];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    result.message = randomMessage
      .replace('{npcName}', npc.name)
      .replace('{titanName}', titan.name);
  }

  return result;
}
