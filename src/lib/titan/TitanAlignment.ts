/**
 * Titan Alignment System
 * 
 * Tracks and manages the Titan's moral alignment on a scale from -1.0 (angelic/good)
 * to +1.0 (demonic/evil). The alignment affects the Titan's behavior, appearance,
 * and how NPCs react to it.
 * 
 * "Alignment in Crypto City is less about good and evil, and more about
 * how many people you've helped versus how many rugs you've pulled."
 * 
 * @see specs/HERO_PET_SYSTEM.md for full design documentation
 */

import type { AlignmentState, ActionHistoryEntry } from '@/games/isocity/types/titan';
import { ALIGNMENT_RANGES } from '@/games/isocity/types/titan';

// ============================================================================
// ALIGNMENT ACTION IMPACTS
// ============================================================================

/**
 * How different actions affect the Titan's alignment.
 * 
 * Negative values = toward angelic (good)
 * Positive values = toward demonic (evil)
 * Zero = neutral (no alignment impact)
 * 
 * "Every action has consequences. In this case, the consequence is
 * that your creature might sprout a halo or grow horns."
 */
export const ALIGNMENT_ACTION_IMPACTS: Record<string, number> = {
  // Good actions (negative = toward angelic)
  'help_npc': -0.05,
  'protect_npc': -0.1,
  'heal_npc': -0.1,
  'teach_npc': -0.05,
  'donate': -0.08,
  'share_alpha': -0.03,
  'comfort_npc': -0.04,
  'build_community': -0.06,
  
  // Evil actions (positive = toward demonic)
  'steal': 0.08,
  'scare_npc': 0.05,
  'attack_npc': 0.15,
  'destroy_property': 0.1,
  'hoard_resources': 0.04,
  'spread_fud': 0.06,
  'manipulate_market': 0.12,
  'intimidate': 0.07,
  
  // Neutral actions (no alignment impact)
  'eat': 0,
  'sleep': 0,
  'walk': 0,
  'observe': 0,
  'play': 0,
  'gather': 0,
};

// ============================================================================
// ACTION CATEGORY LISTS
// ============================================================================

/**
 * All good actions that shift alignment toward angelic.
 */
export const GOOD_ACTIONS: string[] = [
  'help_npc',
  'protect_npc',
  'heal_npc',
  'teach_npc',
  'donate',
  'share_alpha',
  'comfort_npc',
  'build_community',
];

/**
 * All evil actions that shift alignment toward demonic.
 */
export const EVIL_ACTIONS: string[] = [
  'steal',
  'scare_npc',
  'attack_npc',
  'destroy_property',
  'hoard_resources',
  'spread_fud',
  'manipulate_market',
  'intimidate',
];

/**
 * All neutral actions with no alignment impact.
 */
export const NEUTRAL_ACTIONS: string[] = [
  'eat',
  'sleep',
  'walk',
  'observe',
  'play',
  'gather',
];

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Alignment decay rate per game minute toward neutral (0).
 */
const ALIGNMENT_DECAY_RATE = 0.001;

/**
 * Maximum alignment decay per tick to ensure extreme alignments persist.
 */
const MAX_DECAY_PER_TICK = 0.01;

/**
 * Recency weights for calculating alignment from action history.
 * Recent actions have more influence than older actions.
 */
const RECENCY_WEIGHTS = {
  LAST_10: 1.0,      // Actions 0-9 (most recent 10)
  ACTIONS_11_30: 0.7, // Actions 10-29
  ACTIONS_31_60: 0.4, // Actions 30-59
  ACTIONS_61_100: 0.2, // Actions 60-99
  OLDER: 0.1,         // Actions 100+
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get the alignment impact for an action.
 * Returns 0 for unknown actions.
 * 
 * @param action - The action name to look up
 * @returns The alignment impact value (-1.0 to +1.0), or 0 if unknown
 */
export function getActionAlignmentImpact(action: string): number {
  return ALIGNMENT_ACTION_IMPACTS[action] ?? 0;
}

/**
 * Shift alignment by a delta value, clamped to valid range [-1.0, +1.0].
 * 
 * @param currentAlignment - Current alignment value
 * @param delta - Amount to shift (positive = evil, negative = good)
 * @returns New alignment value, clamped to [-1.0, +1.0]
 */
export function shiftAlignment(currentAlignment: number, delta: number): number {
  const newAlignment = currentAlignment + delta;
  return Math.max(-1.0, Math.min(1.0, newAlignment));
}

/**
 * Get the alignment state category from a numeric alignment value.
 * 
 * Alignment ranges:
 * - angelic: -1.0 to -0.6 (inclusive)
 * - good: -0.6 (exclusive) to -0.2 (inclusive)
 * - neutral: -0.2 (exclusive) to +0.2 (inclusive)
 * - evil: +0.2 (exclusive) to +0.6 (inclusive)
 * - demonic: +0.6 (exclusive) to +1.0
 * 
 * @param alignment - Numeric alignment value
 * @returns The alignment state category
 */
export function getAlignmentState(alignment: number): AlignmentState {
  // Clamp to valid range first
  const clampedAlignment = Math.max(-1.0, Math.min(1.0, alignment));
  
  // Check ranges in order from most negative to most positive
  if (clampedAlignment <= ALIGNMENT_RANGES.angelic.max) {
    return 'angelic';
  }
  if (clampedAlignment <= ALIGNMENT_RANGES.good.max) {
    return 'good';
  }
  if (clampedAlignment <= ALIGNMENT_RANGES.neutral.max) {
    return 'neutral';
  }
  if (clampedAlignment <= ALIGNMENT_RANGES.evil.max) {
    return 'evil';
  }
  return 'demonic';
}

/**
 * Decay alignment toward neutral (0) over time.
 * 
 * Decay rate: 0.001 per game minute
 * Maximum decay per tick: 0.01 (to ensure extreme alignments persist)
 * 
 * @param currentAlignment - Current alignment value
 * @param deltaMinutes - Game minutes elapsed
 * @returns New alignment value after decay
 */
export function decayAlignment(currentAlignment: number, deltaMinutes: number): number {
  // No decay needed if already neutral
  if (currentAlignment === 0) {
    return 0;
  }
  
  // No decay for zero time
  if (deltaMinutes <= 0) {
    return currentAlignment;
  }
  
  // Calculate raw decay, but cap at maximum per tick
  const rawDecay = ALIGNMENT_DECAY_RATE * deltaMinutes;
  const cappedDecay = Math.min(rawDecay, MAX_DECAY_PER_TICK);
  
  // Decay toward zero (reduce absolute value)
  if (currentAlignment > 0) {
    const newAlignment = currentAlignment - cappedDecay;
    return Math.max(0, newAlignment); // Don't go past zero
  } else {
    const newAlignment = currentAlignment + cappedDecay;
    return Math.min(0, newAlignment); // Don't go past zero
  }
}

/**
 * Get recency weight for an action based on its position in history.
 * 
 * Weighting scheme:
 * - Last 10 actions (index 0-9 from end): weight 1.0
 * - Actions 11-30 (index 10-29 from end): weight 0.7
 * - Actions 31-60 (index 30-59 from end): weight 0.4
 * - Actions 61-100 (index 60-99 from end): weight 0.2
 * - Older actions (index 100+): weight 0.1
 * 
 * @param indexFromEnd - Position from the end of the array (0 = most recent)
 * @returns Weight multiplier for this action
 */
function getRecencyWeight(indexFromEnd: number): number {
  if (indexFromEnd < 10) {
    return RECENCY_WEIGHTS.LAST_10;
  }
  if (indexFromEnd < 30) {
    return RECENCY_WEIGHTS.ACTIONS_11_30;
  }
  if (indexFromEnd < 60) {
    return RECENCY_WEIGHTS.ACTIONS_31_60;
  }
  if (indexFromEnd < 100) {
    return RECENCY_WEIGHTS.ACTIONS_61_100;
  }
  return RECENCY_WEIGHTS.OLDER;
}

/**
 * Calculate alignment from action history, weighted by recency.
 * 
 * Recent actions have more influence on the final alignment:
 * - Last 10 actions: weight 1.0
 * - Actions 11-30: weight 0.7
 * - Actions 31-60: weight 0.4
 * - Actions 61-100: weight 0.2
 * - Older actions: weight 0.1
 * 
 * @param actionHistory - Array of action history entries
 * @returns Calculated alignment value, clamped to [-1.0, +1.0]
 */
export function calculateAlignment(actionHistory: ActionHistoryEntry[]): number {
  if (actionHistory.length === 0) {
    return 0;
  }
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  // Process actions from most recent to oldest
  const historyLength = actionHistory.length;
  
  for (let i = 0; i < historyLength; i++) {
    // Index from end (0 = most recent)
    const indexFromEnd = historyLength - 1 - i;
    const entry = actionHistory[i];
    const weight = getRecencyWeight(indexFromEnd);
    
    weightedSum += entry.alignmentImpact * weight;
    totalWeight += weight;
  }
  
  // Normalize by total weight to get average weighted impact
  // Then scale appropriately
  const rawAlignment = totalWeight > 0 ? weightedSum : 0;
  
  // Clamp to valid range
  return Math.max(-1.0, Math.min(1.0, rawAlignment));
}
