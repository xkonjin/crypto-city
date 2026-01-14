/**
 * CobieBrain Engine - Issue #175
 * 
 * AI decision engine for the Floating Cobie Head system.
 * Decides current mood, expression, look direction, and when to speak.
 */

import type {
  CobieMood,
  CobieExpression,
  LookDirection,
  IdleState,
  PrioritizedDialogue,
  CobieBrainState,
  CobieContext,
  ExpressionOptions,
  Position,
  HoveredBuildingInfo,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** High rug risk threshold (above this triggers 'concerned' mood) */
const HIGH_RUG_RISK_THRESHOLD = 0.3;

/** Idle thresholds in seconds for state progression */
const IDLE_THRESHOLDS = {
  BORED: 30,        // 30 seconds → bored
  VERY_BORED: 60,   // 60 seconds → very bored
  SLEEPING: 120,    // 120 seconds → sleeping
  LOOK_RESET: 5,    // 5 seconds idle → look center
} as const;

// =============================================================================
// MOOD CALCULATION
// =============================================================================

/**
 * Calculate Cobie's mood based on game context
 * 
 * Priority order:
 * 1. High risk building hovered → 'concerned'
 * 2. Legend building hovered → 'excited'
 * 3. Treasury dropping → 'concerned'
 * 4. Treasury rising → 'amused'
 * 5. Idle > 30s → 'bored'
 * 6. Default → 'neutral'
 */
export function calculateMoodFromContext(context: CobieContext): CobieMood {
  const { hoveredBuilding, treasuryTrend, consecutiveIdleSeconds = 0 } = context;

  // Check building hover first (highest priority)
  if (hoveredBuilding) {
    // High risk building → concerned
    const rugRisk = hoveredBuilding.crypto?.effects?.rugRisk ?? 0;
    if (rugRisk > HIGH_RUG_RISK_THRESHOLD) {
      return 'concerned';
    }

    // Legend building → excited
    if (hoveredBuilding.category === 'legends') {
      return 'excited';
    }
  }

  // Check treasury trend
  if (treasuryTrend === 'down') {
    return 'concerned';
  }
  if (treasuryTrend === 'up') {
    return 'amused';
  }

  // Check idle state
  if (consecutiveIdleSeconds >= IDLE_THRESHOLDS.BORED) {
    return 'bored';
  }

  return 'neutral';
}

// =============================================================================
// EXPRESSION SELECTION
// =============================================================================

/**
 * Select the appropriate expression based on mood and events
 * 
 * Rules:
 * - Speaking always shows 'talking' (highest priority)
 * - Idle > 120s shows 'sleeping'
 * - concerned + hover → 'raised_eyebrow'
 * - excited + milestone → 'wide_eyes'
 * - bored → 'squint'
 * - amused → 'smirk'
 * - thinking → 'thinking'
 * - sardonic → 'concerned' (sardonic smirk)
 * - Default → 'idle'
 */
export function selectExpression(
  mood: CobieMood,
  options: ExpressionOptions
): CobieExpression {
  const { isHovering, isMilestone, isSpeaking, consecutiveIdleSeconds = 0 } = options;

  // Speaking takes priority
  if (isSpeaking) {
    return 'talking';
  }

  // Sleeping from extreme idle
  if (consecutiveIdleSeconds >= IDLE_THRESHOLDS.SLEEPING) {
    return 'sleeping';
  }

  // Mood-based expressions
  switch (mood) {
    case 'concerned':
      return isHovering ? 'raised_eyebrow' : 'concerned';
    
    case 'excited':
      return isMilestone ? 'wide_eyes' : 'wide_eyes';
    
    case 'bored':
      return 'squint';
    
    case 'amused':
      return 'smirk';
    
    case 'thinking':
      return 'thinking';
    
    case 'sardonic':
      return 'concerned'; // Sardonic uses concerned expression with different dialogue
    
    case 'neutral':
    default:
      return 'idle';
  }
}

// =============================================================================
// LOOK DIRECTION
// =============================================================================

/**
 * Calculate which direction Cobie should look based on cursor/tile position
 * 
 * @param cobiePosition - Position of Cobie on screen
 * @param hoveredTile - Position of hovered tile (null if none)
 * @param idleSeconds - Seconds since last activity (returns center if > 5s)
 * @returns Direction to look
 */
export function calculateLookDirection(
  cobiePosition: Position,
  hoveredTile: Position | null,
  idleSeconds: number = 0
): LookDirection {
  // Return to center if idle too long
  if (idleSeconds > IDLE_THRESHOLDS.LOOK_RESET) {
    return 'center';
  }

  // No tile hovered → center
  if (!hoveredTile) {
    return 'center';
  }

  const dx = hoveredTile.x - cobiePosition.x;
  const dy = hoveredTile.y - cobiePosition.y;

  // Determine primary direction based on larger delta
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Threshold to prevent jittery switching near center
  const threshold = 50;

  if (absDx < threshold && absDy < threshold) {
    return 'center';
  }

  // Horizontal takes precedence if significantly larger
  if (absDx > absDy) {
    return dx < 0 ? 'left' : 'right';
  }

  // Vertical direction
  return dy < 0 ? 'up' : 'down';
}

// =============================================================================
// IDLE PROGRESSION
// =============================================================================

/**
 * Get the idle state based on consecutive idle seconds
 * 
 * - 0-30s: neutral
 * - 30-60s: bored (looking around)
 * - 60-120s: very_bored (yawning)
 * - 120s+: sleeping
 */
export function getIdleState(idleSeconds: number): IdleState {
  if (idleSeconds >= IDLE_THRESHOLDS.SLEEPING) {
    return 'sleeping';
  }
  if (idleSeconds >= IDLE_THRESHOLDS.VERY_BORED) {
    return 'very_bored';
  }
  if (idleSeconds >= IDLE_THRESHOLDS.BORED) {
    return 'bored';
  }
  return 'neutral';
}

// =============================================================================
// DIALOGUE QUEUE MANAGEMENT
// =============================================================================

/**
 * Create an empty dialogue queue
 */
export function createDialogueQueue(): PrioritizedDialogue[] {
  return [];
}

/**
 * Add a dialogue entry to the queue, maintaining priority order
 * Lower priority numbers appear first (higher priority)
 */
export function addToDialogueQueue(
  queue: PrioritizedDialogue[],
  dialogue: PrioritizedDialogue
): PrioritizedDialogue[] {
  const newQueue = [...queue, dialogue];
  // Sort by priority (ascending - lower number = higher priority)
  newQueue.sort((a, b) => a.priority - b.priority);
  return newQueue;
}

/**
 * Dequeue the highest priority dialogue
 * Returns [dialogue, remainingQueue] or [null, []] if empty
 */
export function dequeueDialogue(
  queue: PrioritizedDialogue[]
): [PrioritizedDialogue | null, PrioritizedDialogue[]] {
  if (queue.length === 0) {
    return [null, []];
  }
  const [first, ...rest] = queue;
  return [first, rest];
}

// =============================================================================
// BRAIN STATE MANAGEMENT
// =============================================================================

/**
 * Create the initial brain state
 */
export function createInitialBrainState(): CobieBrainState {
  return {
    currentMood: 'neutral',
    currentExpression: 'idle',
    isSpeaking: false,
    currentDialogue: null,
    dialogueQueue: [],
    lastContextUpdate: 0,
    consecutiveIdleSeconds: 0,
    hasReactedToCurrentHover: false,
    lookDirection: 'center',
  };
}

/**
 * Update the brain state based on new context
 */
export function updateBrainState(
  state: CobieBrainState,
  context: CobieContext
): CobieBrainState {
  const now = context.timestamp ?? Date.now();
  const timeDelta = state.lastContextUpdate > 0 
    ? Math.floor((now - state.lastContextUpdate) / 1000)
    : 0;

  // Calculate new idle time
  let newIdleSeconds = state.consecutiveIdleSeconds;
  if (context.hasActivity) {
    newIdleSeconds = 0;
  } else if (timeDelta > 0) {
    newIdleSeconds = state.consecutiveIdleSeconds + timeDelta;
  }

  // Create context with idle time for mood calculation
  const contextWithIdle: CobieContext = {
    ...context,
    consecutiveIdleSeconds: newIdleSeconds,
  };

  // Calculate new mood
  const newMood = calculateMoodFromContext(contextWithIdle);

  // Determine if hover state changed
  const wasHovering = state.hasReactedToCurrentHover;
  const isNowHovering = context.hoveredBuilding !== null;
  const hoverChanged = wasHovering && !isNowHovering;

  // Calculate new expression
  const newExpression = selectExpression(newMood, {
    isHovering: isNowHovering,
    isSpeaking: state.isSpeaking,
    consecutiveIdleSeconds: newIdleSeconds,
  });

  return {
    ...state,
    currentMood: newMood,
    currentExpression: newExpression,
    lastContextUpdate: now,
    consecutiveIdleSeconds: newIdleSeconds,
    hasReactedToCurrentHover: hoverChanged ? false : (isNowHovering || wasHovering),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  CobieMood,
  CobieExpression,
  LookDirection,
  IdleState,
  PrioritizedDialogue,
  CobieBrainState,
  CobieContext,
  ExpressionOptions,
  Position,
};
