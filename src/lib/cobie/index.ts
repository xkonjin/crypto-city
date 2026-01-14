/**
 * Cobie Module Index - Issue #175
 * 
 * Re-exports all types and functions from the CobieBrain system.
 */

// Types
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
  TreasuryTrend,
  HoveredBuildingInfo,
} from './types';

// Type arrays for runtime validation
export {
  CobieMoods,
  CobieExpressions,
  LookDirections,
} from './types';

// Brain functions
export {
  calculateMoodFromContext,
  selectExpression,
  calculateLookDirection,
  getIdleState,
  createDialogueQueue,
  addToDialogueQueue,
  dequeueDialogue,
  createInitialBrainState,
  updateBrainState,
} from './CobieBrain';

// Idle Behaviors (Issue #180)
export type {
  BoredomLevel,
  IdleBehaviorState,
  IdleBehaviorConfig,
} from './CobieIdleBehaviors';

export {
  BLINK_CONFIG,
  LOOK_AROUND_CONFIG,
  BOREDOM_THRESHOLDS,
  generateBlinkInterval,
  shouldDoubleBlink,
  getRandomLookDirection,
  calculateBoredomLevel,
  shouldTriggerYawn,
  shouldEnterSleep,
  shouldWakeUp,
  createIdleBehaviorState,
  updateIdleBehaviorState,
} from './CobieIdleBehaviors';

// Settings (Issue #181)
export type {
  CobieSettings,
  CobiePosition as CobieSettingsPosition,
  CobieScale as CobieSettingsScale,
  CobieTalkativeness,
  MessagePriorityValue,
} from './CobieSettings';

export {
  DEFAULT_COBIE_SETTINGS,
  COBIE_SETTINGS_STORAGE_KEY,
  OLD_COBIE_DISABLED_KEY,
  MessagePriority,
  loadCobieSettings,
  saveCobieSettings,
  isValidPosition,
  isValidScale,
  isValidTalkativeness,
  shouldShowMessage,
  shouldShowIdleBehavior,
} from './CobieSettings';
