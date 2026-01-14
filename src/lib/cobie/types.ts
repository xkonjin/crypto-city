/**
 * CobieBrain Types - Issue #175
 * 
 * Type definitions for the Floating Cobie Head AI decision engine.
 * Defines moods, expressions, look directions, and brain state.
 */

import type { CryptoBuildingDefinition, CryptoCategory } from '@/games/isocity/crypto/types';

// =============================================================================
// MOOD TYPES
// =============================================================================

/**
 * Cobie's emotional state based on game context
 */
export type CobieMood = 
  | 'neutral'      // Default state
  | 'amused'       // Player did something funny / treasury rising
  | 'concerned'    // Risk detected / treasury dropping
  | 'excited'      // Big gains / milestones / legend buildings
  | 'bored'        // Player idle too long
  | 'sardonic'     // Classic Cobie mode
  | 'thinking';    // Processing something

/** Array of all mood values for runtime validation */
export const CobieMoods: CobieMood[] = [
  'neutral',
  'amused',
  'concerned',
  'excited',
  'bored',
  'sardonic',
  'thinking',
];

// =============================================================================
// EXPRESSION TYPES
// =============================================================================

/**
 * Visual expressions for the Cobie sprite
 */
export type CobieExpression =
  | 'idle'
  | 'smirk'
  | 'raised_eyebrow'
  | 'wide_eyes'
  | 'squint'
  | 'thinking'
  | 'talking'
  | 'laughing'
  | 'concerned'
  | 'sleeping';

/** Array of all expression values for runtime validation */
export const CobieExpressions: CobieExpression[] = [
  'idle',
  'smirk',
  'raised_eyebrow',
  'wide_eyes',
  'squint',
  'thinking',
  'talking',
  'laughing',
  'concerned',
  'sleeping',
];

// =============================================================================
// LOOK DIRECTION TYPES
// =============================================================================

/**
 * Direction Cobie's head/eyes are looking
 */
export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down';

/** Array of all look direction values for runtime validation */
export const LookDirections: LookDirection[] = [
  'center',
  'left',
  'right',
  'up',
  'down',
];

// =============================================================================
// IDLE STATE TYPES
// =============================================================================

/**
 * Idle progression states
 * - neutral: 0-30 seconds idle
 * - bored: 30-60 seconds idle (looking around)
 * - very_bored: 60-120 seconds idle (yawning)
 * - sleeping: 120+ seconds idle
 */
export type IdleState = 'neutral' | 'bored' | 'very_bored' | 'sleeping';

// =============================================================================
// DIALOGUE TYPES
// =============================================================================

/**
 * A prioritized dialogue entry for the speech queue
 */
export interface PrioritizedDialogue {
  /** The text to speak */
  text: string;
  /** Priority level (lower number = higher priority) */
  priority: number;
  /** Optional expression to show while speaking */
  expression?: CobieExpression;
  /** Optional mood to set while speaking */
  mood?: CobieMood;
}

// =============================================================================
// TREASURY TREND TYPE
// =============================================================================

export type TreasuryTrend = 'up' | 'down' | 'stable';

// =============================================================================
// BRAIN STATE
// =============================================================================

/**
 * The complete state of the CobieBrain AI engine
 */
export interface CobieBrainState {
  /** Current emotional state */
  currentMood: CobieMood;
  /** Current visual expression */
  currentExpression: CobieExpression;
  /** Whether Cobie is currently speaking */
  isSpeaking: boolean;
  /** Current dialogue text (null if not speaking) */
  currentDialogue: string | null;
  /** Queue of pending dialogue to speak */
  dialogueQueue: PrioritizedDialogue[];
  /** Timestamp of last context update */
  lastContextUpdate: number;
  /** Seconds since last player activity */
  consecutiveIdleSeconds: number;
  /** Whether we've reacted to the current hovered building */
  hasReactedToCurrentHover: boolean;
  /** Direction Cobie is looking */
  lookDirection: LookDirection;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Simplified building info for mood calculation
 */
export interface HoveredBuildingInfo {
  category?: CryptoCategory;
  crypto?: {
    effects?: {
      rugRisk?: number;
    };
  };
}

/**
 * Context information used to calculate Cobie's state
 */
export interface CobieContext {
  /** Currently hovered building (null if none) */
  hoveredBuilding: HoveredBuildingInfo | null;
  /** Treasury trend direction */
  treasuryTrend: TreasuryTrend;
  /** Seconds of consecutive idle time */
  consecutiveIdleSeconds?: number;
  /** Current timestamp */
  timestamp?: number;
  /** Whether there was recent activity */
  hasActivity?: boolean;
}

/**
 * Options for expression selection
 */
export interface ExpressionOptions {
  /** Whether player is hovering a building */
  isHovering?: boolean;
  /** Whether this is a milestone event */
  isMilestone?: boolean;
  /** Whether Cobie is currently speaking */
  isSpeaking: boolean;
  /** Consecutive idle seconds */
  consecutiveIdleSeconds?: number;
}

/**
 * Position coordinate
 */
export interface Position {
  x: number;
  y: number;
}
