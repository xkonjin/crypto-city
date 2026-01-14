/**
 * CobieIdleBehaviors - Idle behavior system for the Floating Cobie Head
 * Issue #180
 * 
 * Provides natural idle behaviors:
 * - Random blinking with configurable intervals
 * - Looking around when idle
 * - Boredom progression over time
 * - Sleep mode after extended idle
 * - Wake up behavior on player action
 */

import type { LookDirection } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration for blink behavior
 */
export const BLINK_CONFIG = {
  /** Minimum time between blinks in milliseconds */
  minInterval: 3000,
  /** Maximum time between blinks in milliseconds */
  maxInterval: 8000,
  /** Duration of blink animation in milliseconds */
  duration: 150,
  /** Chance of doing a double blink (0-1) */
  doubleBlinkChance: 0.2,
} as const;

/**
 * Configuration for looking around behavior
 */
export const LOOK_AROUND_CONFIG = {
  /** Minimum time between look changes in milliseconds */
  minInterval: 10000,
  /** Maximum time between look changes in milliseconds */
  maxInterval: 30000,
  /** Possible directions to look */
  directions: ['left', 'right', 'up', 'center'] as LookDirection[],
  /** How long to hold a look direction in milliseconds */
  duration: 2000,
} as const;

/**
 * Idle time thresholds in seconds for boredom progression
 */
export const BOREDOM_THRESHOLDS = {
  /** Normal state - active */
  NORMAL: 0,
  /** Slightly bored - occasional sighs */
  SLIGHTLY_BORED: 30,
  /** Bored - more looking around */
  BORED: 60,
  /** Very bored - yawning */
  VERY_BORED: 90,
  /** Sleeping - ZZZ mode */
  SLEEPING: 120,
} as const;

/** Delay in ms before resetting wasJustWoken flag */
const WAKE_UP_DELAY = 500;

/** Factor to reduce look interval when bored */
const BORED_LOOK_FACTOR = 0.5;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Boredom level based on idle time
 */
export type BoredomLevel = 
  | 'normal'
  | 'slightly_bored'
  | 'bored'
  | 'very_bored'
  | 'sleeping';

/**
 * State for idle behavior system
 */
export interface IdleBehaviorState {
  /** Whether currently in a blink animation */
  isBlinking: boolean;
  /** Current look direction */
  lookDirection: LookDirection;
  /** Current boredom level */
  boredomLevel: BoredomLevel;
  /** Whether a yawn should be triggered */
  shouldYawn: boolean;
  /** Whether currently in sleep mode */
  isSleeping: boolean;
  /** Whether just woken up (for startled expression) */
  wasJustWoken: boolean;
  /** Whether already yawned this idle session */
  hasYawnedThisSession: boolean;
  /** Timestamp for next scheduled blink */
  nextBlinkTime: number;
  /** Timestamp when current blink ends */
  blinkEndTime: number;
  /** Timestamp for next scheduled look change */
  nextLookTime: number;
  /** Timestamp when woke up (for resetting wasJustWoken) */
  wakeUpTime: number;
}

/**
 * Configuration input for updating idle behavior state
 */
export interface IdleBehaviorConfig {
  /** Seconds since last player activity */
  idleSeconds: number;
  /** Whether Cobie is currently speaking */
  isSpeaking: boolean;
}

// =============================================================================
// BLINK FUNCTIONS
// =============================================================================

/**
 * Generate a random blink interval within configured range
 */
export function generateBlinkInterval(): number {
  const range = BLINK_CONFIG.maxInterval - BLINK_CONFIG.minInterval;
  return BLINK_CONFIG.minInterval + Math.random() * range;
}

/**
 * Determine if a double blink should occur
 */
export function shouldDoubleBlink(): boolean {
  return Math.random() < BLINK_CONFIG.doubleBlinkChance;
}

// =============================================================================
// LOOK AROUND FUNCTIONS
// =============================================================================

/**
 * Get a random look direction from configured options
 */
export function getRandomLookDirection(): LookDirection {
  const directions = LOOK_AROUND_CONFIG.directions;
  const index = Math.floor(Math.random() * directions.length);
  return directions[index];
}

/**
 * Generate a random look interval, reduced when bored
 */
function generateLookInterval(boredomLevel: BoredomLevel): number {
  const range = LOOK_AROUND_CONFIG.maxInterval - LOOK_AROUND_CONFIG.minInterval;
  let interval = LOOK_AROUND_CONFIG.minInterval + Math.random() * range;
  
  // Look around more frequently when bored
  if (boredomLevel === 'bored' || boredomLevel === 'very_bored') {
    interval *= BORED_LOOK_FACTOR;
  }
  
  return interval;
}

// =============================================================================
// BOREDOM FUNCTIONS
// =============================================================================

/**
 * Calculate boredom level from idle seconds
 */
export function calculateBoredomLevel(idleSeconds: number): BoredomLevel {
  if (idleSeconds >= BOREDOM_THRESHOLDS.SLEEPING) {
    return 'sleeping';
  }
  if (idleSeconds >= BOREDOM_THRESHOLDS.VERY_BORED) {
    return 'very_bored';
  }
  if (idleSeconds >= BOREDOM_THRESHOLDS.BORED) {
    return 'bored';
  }
  if (idleSeconds >= BOREDOM_THRESHOLDS.SLIGHTLY_BORED) {
    return 'slightly_bored';
  }
  return 'normal';
}

/**
 * Determine if a yawn should be triggered
 */
export function shouldTriggerYawn(idleSeconds: number, hasYawnedThisSession: boolean): boolean {
  if (hasYawnedThisSession) {
    return false;
  }
  return idleSeconds >= BOREDOM_THRESHOLDS.VERY_BORED;
}

// =============================================================================
// SLEEP FUNCTIONS
// =============================================================================

/**
 * Determine if sleep mode should be entered
 */
export function shouldEnterSleep(idleSeconds: number): boolean {
  return idleSeconds >= BOREDOM_THRESHOLDS.SLEEPING;
}

/**
 * Determine if Cobie should wake up
 */
export function shouldWakeUp(isSleeping: boolean, idleSeconds: number): boolean {
  return isSleeping && idleSeconds < BOREDOM_THRESHOLDS.SLEEPING;
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Create initial idle behavior state
 */
export function createIdleBehaviorState(): IdleBehaviorState {
  const now = Date.now();
  return {
    isBlinking: false,
    lookDirection: 'center',
    boredomLevel: 'normal',
    shouldYawn: false,
    isSleeping: false,
    wasJustWoken: false,
    hasYawnedThisSession: false,
    nextBlinkTime: now + generateBlinkInterval(),
    blinkEndTime: 0,
    nextLookTime: now + generateLookInterval('normal'),
    wakeUpTime: 0,
  };
}

/**
 * Update idle behavior state based on current conditions
 */
export function updateIdleBehaviorState(
  state: IdleBehaviorState,
  config: IdleBehaviorConfig,
  currentTime: number
): IdleBehaviorState {
  const { idleSeconds, isSpeaking } = config;
  
  // Create new state starting from current
  const newState: IdleBehaviorState = { ...state };
  
  // Handle wake up from activity
  if (state.isSleeping && idleSeconds < BOREDOM_THRESHOLDS.SLEEPING) {
    newState.isSleeping = false;
    newState.wasJustWoken = true;
    newState.wakeUpTime = currentTime;
    newState.boredomLevel = 'normal';
    newState.lookDirection = 'center';
    newState.shouldYawn = false;
    newState.hasYawnedThisSession = false;
    return newState;
  }
  
  // Handle reset from activity (not sleeping)
  if (idleSeconds === 0) {
    newState.lookDirection = 'center';
    newState.shouldYawn = false;
    newState.hasYawnedThisSession = false;
    newState.boredomLevel = 'normal';
  }
  
  // Reset wasJustWoken after delay
  if (state.wasJustWoken && currentTime - state.wakeUpTime > WAKE_UP_DELAY) {
    newState.wasJustWoken = false;
  }
  
  // Calculate boredom level
  newState.boredomLevel = calculateBoredomLevel(idleSeconds);
  
  // Handle sleep mode
  if (shouldEnterSleep(idleSeconds)) {
    newState.isSleeping = true;
    newState.isBlinking = false;
    newState.lookDirection = 'center';
    return newState;
  }
  
  // Handle blinking (don't blink while speaking or sleeping)
  if (!isSpeaking && !state.isSleeping) {
    // Check if current blink should end
    if (state.isBlinking && currentTime >= state.blinkEndTime) {
      newState.isBlinking = false;
      newState.nextBlinkTime = currentTime + generateBlinkInterval();
    }
    // Check if new blink should start
    else if (!state.isBlinking && currentTime >= state.nextBlinkTime) {
      newState.isBlinking = true;
      newState.blinkEndTime = currentTime + BLINK_CONFIG.duration;
    }
  } else {
    newState.isBlinking = false;
  }
  
  // Handle looking around (not while sleeping)
  if (!state.isSleeping && idleSeconds > 0) {
    if (currentTime >= state.nextLookTime) {
      newState.lookDirection = getRandomLookDirection();
      newState.nextLookTime = currentTime + generateLookInterval(newState.boredomLevel);
    }
  }
  
  // Handle yawning
  if (shouldTriggerYawn(idleSeconds, state.hasYawnedThisSession)) {
    newState.shouldYawn = true;
    newState.hasYawnedThisSession = true;
  }
  
  return newState;
}
