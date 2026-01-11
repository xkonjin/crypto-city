/**
 * NPC Dialogue Pool Type System
 * 
 * Defines the type foundation for NPC dialogue - because even in the 
 * crypto space, we need to know what we're saying before we say it.
 * 
 * This system enables personality-driven, context-aware dialogue 
 * selection with cooldowns to prevent NPCs from repeating themselves
 * like a broken record (or a Bitcoin maxi explaining why your 
 * altcoin is a scam for the 47th time).
 * 
 * @see PersonalityArchetype from personality.ts for NPC archetypes
 */

import type { PersonalityArchetype } from '@/lib/npc/personality';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Dialogue contexts define WHEN dialogue is triggered.
 * Think of it as the conversational situation - are we saying hello,
 * commenting on the market, or just making small talk?
 * 
 * - greeting: Initial encounter dialogue ("gm", "Have fun staying poor")
 * - market_commentary: Reactions to market conditions ("Number go up!", "This is fine")
 * - player_reaction: Responses to player actions ("Thanks for the tip, ser")
 * - idle_chatter: Background conversation when no specific event ("So anyway, I started buying...")
 * - relationship_level: Dialogue unlocked at specific relationship tiers
 */
export type DialogueContext =
  | 'greeting'
  | 'market_commentary'
  | 'player_reaction'
  | 'idle_chatter'
  | 'relationship_level';

/**
 * Array of all valid dialogue contexts for runtime validation and iteration.
 * Ordered roughly by frequency of use in typical gameplay.
 */
export const DIALOGUE_CONTEXTS: DialogueContext[] = [
  'greeting',
  'market_commentary',
  'player_reaction',
  'idle_chatter',
  'relationship_level',
];

// ============================================================================
// MARKET CONDITION TYPES
// ============================================================================

/**
 * Market conditions affect NPC mood and dialogue selection.
 * Because nothing says "dynamic conversation" like an NPC crying
 * about their portfolio or doing laser eyes at the moon.
 * 
 * - bull: Number go up (excitement, greed, laser eyes)
 * - bear: Number go down (despair, capitulation, "this time is different")
 * - crab: Sideways market (boredom, uncertainty, staking yields)
 * - volatile: Wild swings both ways (panic, excitement, leverage liquidations)
 */
export type MarketCondition = 'bull' | 'bear' | 'crab' | 'volatile';

/**
 * Array of all valid market conditions for runtime validation.
 */
export const MARKET_CONDITIONS: MarketCondition[] = [
  'bull',
  'bear',
  'crab',
  'volatile',
];

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * Relationship levels unlock progressively more intimate dialogue.
 * From awkward strangers to besties who share their seed phrases
 * (please don't actually do this).
 * 
 * Ordered from coldest to warmest - like your portfolio during a crash.
 * 
 * - stranger: First meeting, generic dialogue
 * - acquaintance: Have met a few times, basic familiarity
 * - friend: Regular interaction, some personal details shared
 * - close_friend: Deep trust, personal stories unlocked
 * - best_friend: Maximum intimacy, secret alpha shared (jk, DYOR)
 */
export type RelationshipLevel =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'best_friend';

/**
 * Array of all relationship levels, ordered from coldest to warmest.
 * Index position can be used for comparison (higher = closer relationship).
 */
export const RELATIONSHIP_LEVELS: RelationshipLevel[] = [
  'stranger',
  'acquaintance',
  'friend',
  'close_friend',
  'best_friend',
];

// ============================================================================
// DIALOGUE REQUIREMENT TYPES
// ============================================================================

/**
 * Requirement types for conditional dialogue.
 * These conditions must be met for a dialogue line to be selectable.
 */
export type DialogueRequirementType =
  | 'market_condition'
  | 'relationship_level'
  | 'min_relationship'
  | 'time_of_day'
  | 'has_memory'
  | 'player_trait';

/**
 * Dialogue requirements define conditions that must be met
 * for a line to be shown. It's like a velvet rope for words.
 * 
 * Some lines only make sense in certain contexts - you wouldn't
 * say "WAGMI" during a bear market (well, some would...).
 * 
 * @property type - The type of requirement to check
 * @property value - The required value (depends on type)
 * 
 * @example
 * // Only show during bull markets
 * { type: 'market_condition', value: 'bull' }
 * 
 * @example
 * // Only show to friends or closer
 * { type: 'min_relationship', value: 'friend' }
 */
export interface DialogueRequirement {
  /** The type of requirement being checked */
  type: DialogueRequirementType;
  /** The value to compare against (type depends on requirement type) */
  value: string;
}

// ============================================================================
// WEIGHTED DIALOGUE TYPES
// ============================================================================

/**
 * A single dialogue line with selection weight and cooldown.
 * 
 * Weight determines selection probability relative to other lines
 * in the same pool. A weight of 1.0 is "normal priority" - higher
 * weights are more likely to be selected, lower weights less so.
 * 
 * Cooldown prevents the same line from being selected repeatedly,
 * because even the best jokes get old (except "have fun staying poor",
 * that one never gets old).
 * 
 * @property text - The actual dialogue text to display
 * @property weight - Selection weight (0-1, where 1 is highest priority)
 * @property cooldown - Milliseconds before this line can be used again
 * @property requirements - Optional conditions for this line to be available
 * 
 * @example
 * {
 *   text: "Few understand.",
 *   weight: 0.8,
 *   cooldown: 300000, // 5 minutes
 *   requirements: [{ type: 'market_condition', value: 'bear' }]
 * }
 */
export interface WeightedDialogue {
  /** The dialogue text to display */
  text: string;
  /** Selection weight (0-1): higher = more likely to be selected */
  weight: number;
  /** Cooldown in milliseconds before this line can be used again */
  cooldown: number;
  /** Optional conditions that must be met for this line to be available */
  requirements?: DialogueRequirement[];
}

// ============================================================================
// DIALOGUE POOL TYPES
// ============================================================================

/**
 * A pool of dialogue lines for a specific archetype and context.
 * 
 * DialoguePools group related lines together - all the greetings
 * for Bitcoin Maxis, all the market commentary for Degen Traders, etc.
 * 
 * Optional filters allow pools to be further scoped by relationship
 * level or market condition, enabling deeply contextual dialogue.
 * 
 * @property archetype - The PersonalityArchetype this pool belongs to
 * @property context - The DialogueContext these lines are for
 * @property relationshipLevel - Optional: only use at this relationship level
 * @property marketCondition - Optional: only use during this market condition
 * @property lines - The weighted dialogue lines in this pool
 * 
 * @example
 * {
 *   archetype: 'bitcoin_maxi',
 *   context: 'greeting',
 *   lines: [
 *     { text: "Have fun staying poor.", weight: 0.9, cooldown: 300000 },
 *     { text: "Few understand.", weight: 0.8, cooldown: 300000 },
 *   ]
 * }
 */
export interface DialoguePool {
  /** The NPC archetype this dialogue pool belongs to */
  archetype: PersonalityArchetype;
  /** The context in which this dialogue is used */
  context: DialogueContext;
  /** Optional: restrict to specific relationship level */
  relationshipLevel?: RelationshipLevel;
  /** Optional: restrict to specific market condition */
  marketCondition?: MarketCondition;
  /** The weighted dialogue lines available in this pool */
  lines: WeightedDialogue[];
}

// ============================================================================
// DIALOGUE SELECTION RESULT TYPES
// ============================================================================

/**
 * Result of selecting a dialogue line from a pool.
 * 
 * Contains the selected text plus metadata for tracking cooldowns
 * and understanding the selection context. Useful for debugging
 * why an NPC said something... questionable.
 * 
 * @property text - The selected dialogue text
 * @property sourcePool - The archetype whose pool the line came from
 * @property context - The dialogue context
 * @property cooldownUntil - Timestamp when this line can be used again
 * @property originalWeight - Optional: the line's weight for debugging
 * @property requirements - Optional: requirements that were satisfied
 * 
 * @example
 * {
 *   text: "Number go up technology.",
 *   sourcePool: 'bitcoin_maxi',
 *   context: 'market_commentary',
 *   cooldownUntil: 1704067500000,
 *   originalWeight: 0.85
 * }
 */
export interface DialogueSelection {
  /** The selected dialogue text */
  text: string;
  /** The archetype/pool the dialogue came from */
  sourcePool: PersonalityArchetype;
  /** The context of the selected dialogue */
  context: DialogueContext;
  /** Unix timestamp (ms) when this line's cooldown expires */
  cooldownUntil: number;
  /** Optional: the original weight of the selected line */
  originalWeight?: number;
  /** Optional: requirements that were satisfied for selection */
  requirements?: DialogueRequirement[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Time of day periods for time-based dialogue requirements.
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Map of relationship level to numeric value for comparison.
 * Higher numbers = closer relationship.
 */
export const RELATIONSHIP_LEVEL_VALUES: Record<RelationshipLevel, number> = {
  stranger: 0,
  acquaintance: 1,
  friend: 2,
  close_friend: 3,
  best_friend: 4,
};

/**
 * Check if a relationship level meets a minimum threshold.
 * 
 * @param current - The current relationship level
 * @param minimum - The minimum required level
 * @returns true if current >= minimum
 */
export function meetsRelationshipRequirement(
  current: RelationshipLevel,
  minimum: RelationshipLevel
): boolean {
  return RELATIONSHIP_LEVEL_VALUES[current] >= RELATIONSHIP_LEVEL_VALUES[minimum];
}
