/**
 * CobieHeadUtils - Pure utility functions for FloatingCobieHead
 * Issue #177
 * 
 * These functions are separated from React components for testability.
 */

import type { CobieExpression, CobieMood, LookDirection } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Position options for the floating head
 */
export type CobiePosition = 'bottom-left' | 'bottom-right';

/**
 * Scale options for the floating head
 */
export type CobieScale = 'small' | 'medium' | 'large';

/**
 * Eye configuration for expressions
 */
export interface EyeConfig {
  /** Scale factor for eye size (1 = normal) */
  scale: number;
  /** Whether eyes are closed */
  closed: boolean;
  /** Vertical squint amount (0 = none, 1 = full) */
  squintY?: number;
}

/**
 * Eyebrow configuration for expressions
 */
export interface EyebrowConfig {
  /** Left eyebrow raise amount (-1 to 1, negative = furrowed) */
  leftRaise: number;
  /** Right eyebrow raise amount (-1 to 1, negative = furrowed) */
  rightRaise: number;
}

/**
 * Mouth configuration for expressions
 */
export interface MouthConfig {
  /** Whether mouth is in smirk position */
  smirk: boolean;
  /** Mouth open amount (0-3 for talk frames) */
  openAmount: number;
  /** Whether mouth shows concern */
  concerned: boolean;
  /** Whether laughing */
  laughing: boolean;
}

/**
 * Full expression configuration
 */
export interface ExpressionConfig {
  eyes: EyeConfig;
  eyebrows: EyebrowConfig;
  mouth: MouthConfig;
}

/**
 * Look direction transform data
 */
export interface LookDirectionTransform {
  /** Horizontal eye offset in pixels */
  eyeOffsetX: number;
  /** Vertical eye offset in pixels */
  eyeOffsetY: number;
  /** Head rotation in degrees */
  headRotation: number;
}

// =============================================================================
// ANIMATION CLASSES
// =============================================================================

/**
 * CSS animation class names for Cobie head animations
 */
export const COBIE_ANIMATIONS = {
  /** Idle bobbing animation */
  bob: 'animate-cobie-bob',
  /** Eye blinking animation */
  blink: 'animate-cobie-blink',
  /** Mouth talking animation */
  talk: 'animate-cobie-talk',
  /** Sleeping ZZZ effect */
  sleep: 'animate-cobie-sleep',
} as const;

// =============================================================================
// EXPRESSION CONFIGURATIONS
// =============================================================================

const EXPRESSION_CONFIGS: Record<CobieExpression, ExpressionConfig> = {
  idle: {
    eyes: { scale: 1, closed: false },
    eyebrows: { leftRaise: 0, rightRaise: 0 },
    mouth: { smirk: false, openAmount: 0, concerned: false, laughing: false },
  },
  smirk: {
    eyes: { scale: 1, closed: false },
    eyebrows: { leftRaise: 0.2, rightRaise: 0 },
    mouth: { smirk: true, openAmount: 0, concerned: false, laughing: false },
  },
  raised_eyebrow: {
    eyes: { scale: 1, closed: false },
    eyebrows: { leftRaise: 0.5, rightRaise: -0.1 },
    mouth: { smirk: false, openAmount: 0, concerned: false, laughing: false },
  },
  wide_eyes: {
    eyes: { scale: 1.3, closed: false },
    eyebrows: { leftRaise: 0.4, rightRaise: 0.4 },
    mouth: { smirk: false, openAmount: 1, concerned: false, laughing: false },
  },
  squint: {
    eyes: { scale: 0.6, closed: false, squintY: 0.5 },
    eyebrows: { leftRaise: -0.2, rightRaise: -0.2 },
    mouth: { smirk: false, openAmount: 0, concerned: false, laughing: false },
  },
  thinking: {
    eyes: { scale: 1, closed: false },
    eyebrows: { leftRaise: 0.3, rightRaise: -0.1 },
    mouth: { smirk: false, openAmount: 0, concerned: false, laughing: false },
  },
  talking: {
    eyes: { scale: 1, closed: false },
    eyebrows: { leftRaise: 0.1, rightRaise: 0.1 },
    mouth: { smirk: false, openAmount: 2, concerned: false, laughing: false },
  },
  laughing: {
    eyes: { scale: 0.8, closed: false, squintY: 0.3 },
    eyebrows: { leftRaise: 0.3, rightRaise: 0.3 },
    mouth: { smirk: false, openAmount: 3, concerned: false, laughing: true },
  },
  concerned: {
    eyes: { scale: 1.1, closed: false },
    eyebrows: { leftRaise: 0.3, rightRaise: 0.3 },
    mouth: { smirk: false, openAmount: 0, concerned: true, laughing: false },
  },
  sleeping: {
    eyes: { scale: 1, closed: true },
    eyebrows: { leftRaise: -0.1, rightRaise: -0.1 },
    mouth: { smirk: false, openAmount: 0, concerned: false, laughing: false },
  },
};

// =============================================================================
// LOOK DIRECTION TRANSFORMS
// =============================================================================

const LOOK_DIRECTION_TRANSFORMS: Record<LookDirection, LookDirectionTransform> = {
  center: { eyeOffsetX: 0, eyeOffsetY: 0, headRotation: 0 },
  left: { eyeOffsetX: -2, eyeOffsetY: 0, headRotation: -5 },
  right: { eyeOffsetX: 2, eyeOffsetY: 0, headRotation: 5 },
  up: { eyeOffsetX: 0, eyeOffsetY: -2, headRotation: 0 },
  down: { eyeOffsetX: 0, eyeOffsetY: 2, headRotation: 0 },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get expression configuration for a given expression type
 */
export function getExpressionConfig(expression: CobieExpression): ExpressionConfig {
  return EXPRESSION_CONFIGS[expression] ?? EXPRESSION_CONFIGS.idle;
}

/**
 * Get look direction transform for a given direction
 */
export function getLookDirectionTransform(direction: LookDirection): LookDirectionTransform {
  return LOOK_DIRECTION_TRANSFORMS[direction] ?? LOOK_DIRECTION_TRANSFORMS.center;
}

/**
 * Get pixel size for a given scale
 */
export function getScalePixels(scale: CobieScale): number {
  switch (scale) {
    case 'small':
      return 64;
    case 'medium':
      return 96;
    case 'large':
      return 128;
    default:
      return 96;
  }
}

/**
 * Get position CSS classes for a given position
 */
export function getPositionClasses(position: CobiePosition): string {
  switch (position) {
    case 'bottom-left':
      return 'bottom-20 left-4 md:bottom-24 md:left-6';
    case 'bottom-right':
      return 'bottom-20 right-4 md:bottom-24 md:right-6';
    default:
      return 'bottom-20 left-4';
  }
}

/**
 * Determine if the component should render based on enabled state
 */
export function shouldRenderCobieHead(options: { enabled: boolean }): boolean {
  return options.enabled;
}
