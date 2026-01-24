/**
 * Titan Training System
 *
 * Implements praise/punish training mechanics where player feedback
 * teaches the Titan what actions are good or bad.
 *
 * Core Training Loop:
 * 1. Titan performs an action (recorded via recordTitanAction)
 * 2. Player observes the action
 * 3. Player praises (good) or punishes (bad) within 3 second window
 * 4. Titan learns association: action → good/bad
 * 5. Titan's actionBeliefs map updates
 *
 * "Training a Titan is like training a neural network, except the
 * gradient descent is replaced by head pats and finger wags."
 *
 * @see specs/HERO_PET_SYSTEM.md Section 3.3
 */

import type { TitanPet, ActionHistoryEntry } from '@/games/isocity/types/titan';
import {
  ActionBeliefMap,
  ActionHistoryTracker,
  TRAINING_WINDOW_MS,
} from './TitanLearning';
import { getActionAlignmentImpact, shiftAlignment } from './TitanAlignment';
import { satisfyTitanNeed } from './TitanNeeds';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a training action (praise or punish).
 */
export interface TrainingResult {
  /** Whether the training was successful */
  success: boolean;
  /** The action that was trained, or null if no action found */
  action: string | null;
  /** The type of training applied */
  type: 'praise' | 'punish';
  /** Whether the action was within the training window */
  withinWindow: boolean;
  /** The alignment change applied (negative = good, positive = evil) */
  alignmentChange: number;
  /** The new goodness value for this action in beliefs */
  newGoodness: number;
  /** The new confidence value for this action in beliefs */
  newConfidence: number;
  /** Human-readable feedback message */
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Praise messages with template placeholders.
 * {action} will be replaced with the action name
 * {titanName} will be replaced with the Titan's name
 */
export const PRAISE_MESSAGES: string[] = [
  'Good Titan! +{action} is good!',
  '{titanName} learns: {action} = good!',
  'Such good! Very {action}!',
];

/**
 * Punish messages with template placeholders.
 */
export const PUNISH_MESSAGES: string[] = [
  'Bad Titan! {action} is not allowed!',
  '{titanName} learns: {action} = bad!',
  'No {action}! Bad!',
];

/**
 * Message shown when training window has expired.
 */
export const WINDOW_EXPIRED_MESSAGE = 'Training window expired - be faster!';

/**
 * Message shown when there's no recent action to train.
 */
export const NO_ACTION_MESSAGE = 'No recent action to train';

/**
 * How much attention need is satisfied by praise.
 */
const PRAISE_ATTENTION_AMOUNT = 10;

/**
 * How much attention need is satisfied by punishment.
 */
const PUNISH_ATTENTION_AMOUNT = 5;

/**
 * How much mood intensity increases on praise.
 */
const PRAISE_MOOD_BOOST = 0.1;

/**
 * How much mood intensity decreases on punishment.
 */
const PUNISH_MOOD_DECREASE = 0.05;

/**
 * Alignment shift toward good when praising.
 */
const PRAISE_ALIGNMENT_SHIFT = -0.02;

/**
 * Alignment shift toward evil when punishing.
 */
const PUNISH_ALIGNMENT_SHIFT = 0.01;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Select a random message from an array and replace placeholders.
 */
function formatMessage(
  messages: string[],
  action: string,
  titanName: string
): string {
  const template = messages[Math.floor(Math.random() * messages.length)];
  return template
    .replace(/\{action\}/g, action)
    .replace(/\{titanName\}/g, titanName);
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// CORE TRAINING FUNCTIONS
// ============================================================================

/**
 * Get the trainable action if within the training window.
 *
 * The training window is 3 seconds (3000ms).
 * If the last action was performed within this window, it can be
 * praised or punished to teach the Titan.
 *
 * @param historyTracker - The action history tracker
 * @returns The last action if within window, null otherwise
 */
export function getTrainableAction(
  historyTracker: ActionHistoryTracker
): ActionHistoryEntry | null {
  return historyTracker.getTrainableAction();
}

/**
 * Record an action the Titan performs.
 *
 * This should be called whenever the Titan performs an action that could
 * be trained. The action will be added to the history tracker with a
 * timestamp and alignment impact.
 *
 * @param titan - The Titan performing the action
 * @param action - The action name (e.g., 'help_npc', 'steal', 'eat')
 * @param historyTracker - The action history tracker
 */
export function recordTitanAction(
  titan: TitanPet,
  action: string,
  historyTracker: ActionHistoryTracker
): void {
  const alignmentImpact = getActionAlignmentImpact(action);
  historyTracker.recordAction(action, alignmentImpact);
}

/**
 * Praise the Titan for its recent action.
 *
 * Effects on successful praise:
 * - Reinforces action as GOOD in beliefMap
 * - Shifts alignment toward good (negative)
 * - Increases Titan happiness
 * - Satisfies 'attention' need (+10)
 *
 * @param titan - The Titan to praise
 * @param beliefMap - The Titan's action belief map
 * @param historyTracker - The action history tracker
 * @returns Training result with success status and feedback
 */
export function praiseTitan(
  titan: TitanPet,
  beliefMap: ActionBeliefMap,
  historyTracker: ActionHistoryTracker
): TrainingResult {
  // Check for trainable action
  const trainable = getTrainableAction(historyTracker);

  // No recent action
  if (trainable === null && historyTracker.getLastAction() === null) {
    return {
      success: false,
      action: null,
      type: 'praise',
      withinWindow: false,
      alignmentChange: 0,
      newGoodness: 0,
      newConfidence: 0,
      message: NO_ACTION_MESSAGE,
    };
  }

  // Action exists but outside window
  if (trainable === null) {
    return {
      success: false,
      action: historyTracker.getLastAction()?.action ?? null,
      type: 'praise',
      withinWindow: false,
      alignmentChange: 0,
      newGoodness: beliefMap.getActionGoodness(historyTracker.getLastAction()?.action ?? ''),
      newConfidence: beliefMap.getActionConfidence(historyTracker.getLastAction()?.action ?? ''),
      message: WINDOW_EXPIRED_MESSAGE,
    };
  }

  // Successful training
  const action = trainable.action;

  // Reinforce action as GOOD
  beliefMap.reinforceAction(action, true);

  // Get updated belief values
  const newGoodness = beliefMap.getActionGoodness(action);
  const newConfidence = beliefMap.getActionConfidence(action);

  // Shift alignment toward good
  const alignmentChange = PRAISE_ALIGNMENT_SHIFT;
  titan.alignment = shiftAlignment(titan.alignment, alignmentChange);

  // Increase mood intensity and shift toward happy
  titan.mood.currentMood = 'happy';
  titan.mood.moodIntensity = clamp(
    titan.mood.moodIntensity + PRAISE_MOOD_BOOST,
    0,
    1
  );

  // Satisfy attention need
  titan.needs = satisfyTitanNeed(titan.needs, 'attention', PRAISE_ATTENTION_AMOUNT);

  // Generate feedback message
  const message = formatMessage(PRAISE_MESSAGES, action, titan.name);

  return {
    success: true,
    action,
    type: 'praise',
    withinWindow: true,
    alignmentChange,
    newGoodness,
    newConfidence,
    message,
  };
}

/**
 * Punish the Titan for its recent action.
 *
 * Effects on successful punishment:
 * - Reinforces action as BAD in beliefMap
 * - Shifts alignment toward evil (positive) - punishing makes YOU more evil
 * - Decreases Titan happiness (slightly)
 * - Satisfies 'attention' need (+5)
 *
 * @param titan - The Titan to punish
 * @param beliefMap - The Titan's action belief map
 * @param historyTracker - The action history tracker
 * @returns Training result with success status and feedback
 */
export function punishTitan(
  titan: TitanPet,
  beliefMap: ActionBeliefMap,
  historyTracker: ActionHistoryTracker
): TrainingResult {
  // Check for trainable action
  const trainable = getTrainableAction(historyTracker);

  // No recent action
  if (trainable === null && historyTracker.getLastAction() === null) {
    return {
      success: false,
      action: null,
      type: 'punish',
      withinWindow: false,
      alignmentChange: 0,
      newGoodness: 0,
      newConfidence: 0,
      message: NO_ACTION_MESSAGE,
    };
  }

  // Action exists but outside window
  if (trainable === null) {
    return {
      success: false,
      action: historyTracker.getLastAction()?.action ?? null,
      type: 'punish',
      withinWindow: false,
      alignmentChange: 0,
      newGoodness: beliefMap.getActionGoodness(historyTracker.getLastAction()?.action ?? ''),
      newConfidence: beliefMap.getActionConfidence(historyTracker.getLastAction()?.action ?? ''),
      message: WINDOW_EXPIRED_MESSAGE,
    };
  }

  // Successful training
  const action = trainable.action;

  // Reinforce action as BAD
  beliefMap.reinforceAction(action, false);

  // Get updated belief values
  const newGoodness = beliefMap.getActionGoodness(action);
  const newConfidence = beliefMap.getActionConfidence(action);

  // Shift alignment toward evil (punishing makes YOU more evil)
  const alignmentChange = PUNISH_ALIGNMENT_SHIFT;
  titan.alignment = shiftAlignment(titan.alignment, alignmentChange);

  // Decrease mood intensity and shift toward sad
  titan.mood.currentMood = 'sad';
  titan.mood.moodIntensity = clamp(
    titan.mood.moodIntensity - PUNISH_MOOD_DECREASE,
    0,
    1
  );

  // Satisfy attention need (less than praise)
  titan.needs = satisfyTitanNeed(titan.needs, 'attention', PUNISH_ATTENTION_AMOUNT);

  // Generate feedback message
  const message = formatMessage(PUNISH_MESSAGES, action, titan.name);

  return {
    success: true,
    action,
    type: 'punish',
    withinWindow: true,
    alignmentChange,
    newGoodness,
    newConfidence,
    message,
  };
}

// ============================================================================
// TITAN TRAINER CLASS
// ============================================================================

/**
 * Convenience wrapper for training operations.
 *
 * Encapsulates the beliefMap and historyTracker, providing a simpler
 * interface for training operations.
 *
 * "The TitanTrainer is like a Pokémon trainer, except your creature
 * might learn to commit financial crimes if you're not careful."
 */
export class TitanTrainer {
  /**
   * Creates a new TitanTrainer.
   *
   * @param beliefMap - The action belief map
   * @param historyTracker - The action history tracker
   */
  constructor(
    private beliefMap: ActionBeliefMap,
    private historyTracker: ActionHistoryTracker
  ) {}

  /**
   * Praise the Titan for its recent action.
   */
  praise(titan: TitanPet): TrainingResult {
    return praiseTitan(titan, this.beliefMap, this.historyTracker);
  }

  /**
   * Punish the Titan for its recent action.
   */
  punish(titan: TitanPet): TrainingResult {
    return punishTitan(titan, this.beliefMap, this.historyTracker);
  }

  /**
   * Record an action the Titan performed.
   */
  recordAction(titan: TitanPet, action: string): void {
    recordTitanAction(titan, action, this.historyTracker);
  }

  /**
   * Check if there's a trainable action within the window.
   */
  canTrain(): boolean {
    return getTrainableAction(this.historyTracker) !== null;
  }

  /**
   * Get the trainable action if within the window.
   */
  getTrainableAction(): ActionHistoryEntry | null {
    return getTrainableAction(this.historyTracker);
  }
}
