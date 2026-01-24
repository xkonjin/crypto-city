/**
 * Titan Needs System
 * 
 * Extends the NPC needs system with Titan-specific needs (attention, growth).
 * The Titan is a companion creature that has modified decay rates and
 * additional needs beyond regular NPCs.
 * 
 * "A Titan's needs are like a demanding crypto influencer - 
 * constantly craving attention, always wanting to grow, and never 
 * satisfied with the current state of their portfolio."
 * 
 * @see specs/HERO_PET_SYSTEM.md for full design documentation
 */

import type { Need } from '@/lib/npc/needs';
import type { TitanNeeds } from '@/games/isocity/types/titan';

// ============================================================================
// TITAN NEED TYPE
// ============================================================================

/**
 * All possible Titan need types.
 * Includes base NPC needs plus Titan-specific attention and growth.
 */
export type TitanNeedType = 
  | 'hunger' 
  | 'energy' 
  | 'social' 
  | 'fun' 
  | 'wealth' 
  | 'purpose' 
  | 'attention' 
  | 'growth';

/**
 * Array of all Titan need types for iteration.
 */
export const ALL_TITAN_NEED_TYPES: TitanNeedType[] = [
  'hunger',
  'energy',
  'social',
  'fun',
  'wealth',
  'purpose',
  'attention',
  'growth',
];

// ============================================================================
// TITAN DECAY RATES
// ============================================================================

/**
 * Decay rates per game minute for Titan needs.
 * Modified from NPC rates to reflect Titan's unique characteristics.
 * 
 * Design rationale:
 * - attention (0.6): Fastest - Titan craves player interaction constantly
 * - hunger (0.4): Moderate - Titan is larger, needs more food
 * - fun (0.35): Moderate - entertainment needs
 * - social (0.3): Moderate - social with NPCs but not as critical
 * - energy (0.25): Slow - Titan has more stamina than NPCs
 * - growth (0.2): Slow - learning is a gradual, ongoing need
 * - purpose (0.1): Slow - existential needs persist
 * - wealth (0.05): Very slow - Titan doesn't care much about money
 */
export const TITAN_DECAY_RATES: Record<TitanNeedType, number> = {
  attention: 0.6,  // Fast - Titan craves player attention
  hunger: 0.4,     // Moderate - Titan is larger, needs more food
  fun: 0.35,       // Moderate
  social: 0.3,     // Moderate - social with NPCs
  energy: 0.25,    // Slow - Titan has more stamina
  growth: 0.2,     // Slow - learning is a gradual need
  purpose: 0.1,    // Slow
  wealth: 0.05,    // Very slow - Titan doesn't care much about money
};

// ============================================================================
// TITAN CRITICAL THRESHOLDS
// ============================================================================

/**
 * Critical thresholds for Titan needs.
 * When a need drops below its threshold, it becomes urgent.
 */
export const TITAN_CRITICAL_THRESHOLDS: Record<TitanNeedType, number> = {
  hunger: 20,
  energy: 15,
  social: 25,
  fun: 20,
  wealth: 25,
  purpose: 20,
  attention: 25,  // Higher threshold - Titan needs attention more urgently
  growth: 15,     // Lower threshold - learning can wait
};

// ============================================================================
// TITAN DEFAULT WEIGHTS
// ============================================================================

/**
 * Priority weights for Utility AI scoring.
 * Higher weight = higher priority when calculating action scores.
 */
export const TITAN_DEFAULT_WEIGHTS: Record<TitanNeedType, number> = {
  attention: 1.3,  // High - player interaction is very important
  hunger: 1.2,     // High - survival need
  energy: 1.1,     // Important for functioning
  growth: 1.0,     // Core Titan mechanic
  purpose: 0.9,    // Personal fulfillment
  social: 0.85,    // Can be delayed
  fun: 0.8,        // Quality of life
  wealth: 0.5,     // Titan doesn't prioritize wealth
};

// ============================================================================
// TITAN NEED DESCRIPTIONS
// ============================================================================

/**
 * Hitchhiker's Guide to the Galaxy style descriptions for each Titan need.
 * Sardonic, educational, and crypto-native.
 */
export const TITAN_NEED_DESCRIPTIONS: Record<TitanNeedType, string> = {
  hunger: "A Titan's appetite is legendary. They eat like they're front-running a food airdrop and need to establish position before the normies arrive.",
  energy: "Even cosmic creatures need rest. A tired Titan is about as useful as a validator node running on a potato.",
  social: "Titans enjoy socializing with NPCs, though their definition of 'conversation' may include more growling than most etiquette guides recommend.",
  fun: "Entertainment for a Titan ranges from playfully chasing NPCs to accidentally demolishing market stalls. Both are equally amusing to them.",
  wealth: "Money holds little interest for a Titan. They've seen enough pump and dumps to know that true value lies elsewhere. Mostly in food.",
  purpose: "The existential drive to be more than just a large creature that eats things. A Titan's purpose is shaped by your guidance. No pressure.",
  attention: "The burning desire for their deity to notice them. Every moment without a head pat is a moment of cosmic neglect.",
  growth: "The insatiable hunger for knowledge and skill improvement. A Titan wants to learn, evolve, and eventually become an unstoppable force. In a good way.",
};

// ============================================================================
// TITAN NEED SATISFIERS
// ============================================================================

/**
 * Activities that satisfy each Titan need type.
 */
export const TITAN_NEED_SATISFIERS: Record<TitanNeedType, string[]> = {
  hunger: ['eating_den', 'eating_from_city', 'fed_by_player', 'foraging'],
  energy: ['sleeping_den', 'napping', 'resting'],
  social: ['npc_interaction', 'helping_npc', 'playing_with_npc', 'observing_npcs'],
  fun: ['exploring', 'playing', 'chasing', 'discovering_area', 'performing_tricks'],
  wealth: ['finding_treasure', 'gift_from_npc', 'reward_for_helping'],
  purpose: ['helping_city', 'protecting_npcs', 'completing_tasks', 'serving_deity'],
  attention: ['god_hand_pet', 'god_hand_praise', 'player_command', 'being_held', 'being_talked_to'],
  growth: ['learn_skill', 'level_up', 'mimic_npc', 'practice_ability', 'observation_learning'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a single Need with Titan-specific values.
 */
function createTitanNeed(needType: TitanNeedType, initialValue?: number): Need {
  const current = initialValue ?? Math.floor(Math.random() * 41) + 60; // 60-100
  return {
    current,
    max: 100,
    decayRate: TITAN_DECAY_RATES[needType],
    criticalThreshold: TITAN_CRITICAL_THRESHOLDS[needType],
    weight: TITAN_DEFAULT_WEIGHTS[needType],
  };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Create default Titan needs with randomized starting values (60-100).
 * Called when spawning a new Titan.
 * 
 * @returns TitanNeeds object with all eight needs initialized
 */
export function createDefaultTitanNeeds(): TitanNeeds {
  return {
    hunger: createTitanNeed('hunger'),
    energy: createTitanNeed('energy'),
    social: createTitanNeed('social'),
    fun: createTitanNeed('fun'),
    wealth: createTitanNeed('wealth'),
    purpose: createTitanNeed('purpose'),
    attention: createTitanNeed('attention'),
    growth: createTitanNeed('growth'),
  };
}

/**
 * Update Titan needs by applying decay over time.
 * Pure function - returns a new needs object.
 * 
 * @param needs - Current Titan needs
 * @param deltaMinutes - Game minutes elapsed
 * @returns New TitanNeeds object with decayed values
 */
export function updateTitanNeeds(needs: TitanNeeds, deltaMinutes: number): TitanNeeds {
  const result: TitanNeeds = {
    hunger: { ...needs.hunger },
    energy: { ...needs.energy },
    social: { ...needs.social },
    fun: { ...needs.fun },
    wealth: { ...needs.wealth },
    purpose: { ...needs.purpose },
    attention: { ...needs.attention },
    growth: { ...needs.growth },
  };

  // Apply decay to each need
  for (const needType of ALL_TITAN_NEED_TYPES) {
    const need = result[needType];
    const decayAmount = need.decayRate * deltaMinutes;
    need.current = Math.max(0, need.current - decayAmount);
  }

  return result;
}

/**
 * Satisfy a specific Titan need by a given amount.
 * Pure function - returns a new needs object.
 * 
 * @param needs - Current Titan needs
 * @param needType - Which need to satisfy
 * @param amount - How much to increase the need
 * @returns New TitanNeeds object with updated need value
 */
export function satisfyTitanNeed(
  needs: TitanNeeds, 
  needType: TitanNeedType, 
  amount: number
): TitanNeeds {
  const result: TitanNeeds = {
    hunger: { ...needs.hunger },
    energy: { ...needs.energy },
    social: { ...needs.social },
    fun: { ...needs.fun },
    wealth: { ...needs.wealth },
    purpose: { ...needs.purpose },
    attention: { ...needs.attention },
    growth: { ...needs.growth },
  };

  const need = result[needType];
  need.current = Math.min(need.max, need.current + amount);

  return result;
}

/**
 * Find the most urgent Titan need based on current value and weight.
 * 
 * Urgency is calculated as: weight * (1 - current/max)
 * Needs below critical threshold get a priority boost.
 * 
 * @param needs - Current Titan needs
 * @returns The most urgent need with its type, or null if all are satisfied
 */
export function getMostUrgentTitanNeed(
  needs: TitanNeeds
): { name: TitanNeedType; need: Need } | null {
  let mostUrgent: { name: TitanNeedType; need: Need } | null = null;
  let highestUrgency = 0;

  for (const needType of ALL_TITAN_NEED_TYPES) {
    const need = needs[needType];
    
    // If need is at max, skip it
    if (need.current >= need.max) {
      continue;
    }

    // Calculate urgency score
    let urgency = need.weight * (1 - need.current / need.max);

    // Boost urgency if below critical threshold
    if (need.current <= need.criticalThreshold) {
      urgency *= 2;
    }

    if (urgency > highestUrgency) {
      highestUrgency = urgency;
      mostUrgent = { name: needType, need };
    }
  }

  return mostUrgent;
}

/**
 * Get the overall status of Titan needs.
 * 
 * Status levels:
 * - 'critical': Any need is below critical threshold
 * - 'low': Lowest need is between critical and 40
 * - 'moderate': Lowest need is between 40 and 70
 * - 'satisfied': All needs are above 70
 * 
 * @param needs - Current Titan needs
 * @returns Overall need status
 */
export function getTitanNeedStatus(
  needs: TitanNeeds
): 'critical' | 'low' | 'moderate' | 'satisfied' {
  let lowestCurrent = 100;
  let hasCritical = false;

  for (const needType of ALL_TITAN_NEED_TYPES) {
    const need = needs[needType];
    
    if (need.current <= need.criticalThreshold) {
      hasCritical = true;
    }
    
    if (need.current < lowestCurrent) {
      lowestCurrent = need.current;
    }
  }

  if (hasCritical) {
    return 'critical';
  }
  
  if (lowestCurrent < 40) {
    return 'low';
  }
  
  if (lowestCurrent < 70) {
    return 'moderate';
  }
  
  return 'satisfied';
}
