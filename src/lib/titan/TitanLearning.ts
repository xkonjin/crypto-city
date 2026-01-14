/**
 * Titan Learning System
 * 
 * Implements the reinforcement learning system where Titan learns which
 * actions are good/bad through player praise/punishment.
 * 
 * Based on Black & White's creature learning:
 * - ActionBeliefMap: Tracks beliefs about actions with confidence and decay
 * - ActionHistoryTracker: Records action history for training windows
 * 
 * "Teaching a Titan is like training a dog, except the dog can eventually
 * learn to summon lightning and may develop opinions about market manipulation."
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 5.2 on Learning
 */

import type { ActionBelief, ActionHistoryEntry, TitanPet } from '@/games/isocity/types/titan';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default maximum number of beliefs to track.
 * Uses LRU eviction when exceeded.
 */
export const DEFAULT_MAX_BELIEFS = 100;

/**
 * Default maximum number of action history entries.
 */
export const DEFAULT_MAX_HISTORY = 500;

/**
 * Training window in milliseconds (3 seconds).
 * Player must praise/punish within this window for learning to occur.
 */
export const TRAINING_WINDOW_MS = 3000;

/**
 * Decay rate for beliefs per game minute.
 * Beliefs decay toward neutral (0) over time.
 */
export const BELIEF_DECAY_RATE = 0.001;

/**
 * Base learning rate for reinforcement.
 * This is modified by the number of previous reinforcements.
 */
const BASE_LEARNING_RATE = 0.3;

/**
 * Confidence increase per reinforcement.
 * Applied with diminishing returns formula.
 */
const CONFIDENCE_INCREASE = 0.1;

/**
 * Default maximum number of observations to track.
 */
export const DEFAULT_MAX_OBSERVATIONS = 50;

/**
 * Mimicry learning magnitude (weaker than direct training).
 */
export const MIMICRY_LEARNING_MAGNITUDE = 0.5;

// ============================================================================
// OBSERVATION TYPES
// ============================================================================

/**
 * Represents an observed NPC behavior that the Titan can learn from.
 * 
 * "Imitation is the sincerest form of flattery, and also how your Titan
 * learns to either save the city or burn it down."
 */
export interface ObservedBehavior {
  /** ID of the NPC who performed the action */
  actorId: string;
  /** What action was observed */
  action: string;
  /** Whether the action succeeded, failed, or is still pending */
  outcome: 'success' | 'failure' | 'pending';
  /** When the observation was made */
  observedAt: number;
  /** Whether the Titan attempted to mimic this action */
  mimicked: boolean;
}

// ============================================================================
// ACTION BELIEF MAP
// ============================================================================

/**
 * Manages the Titan's learned beliefs about actions.
 * 
 * Each action has a "goodness" value (-1 to +1) representing whether
 * the Titan believes it's good or bad, and a "confidence" value (0 to 1)
 * representing how certain the Titan is about that belief.
 * 
 * "The ActionBeliefMap is essentially a Titan's moral compass,
 * calibrated through a series of head pats and slaps."
 */
export class ActionBeliefMap {
  private beliefs: Map<string, ActionBelief>;
  private maxBeliefs: number;

  /**
   * Creates a new ActionBeliefMap.
   * 
   * @param initialBeliefs - Optional initial beliefs to populate
   * @param maxBeliefs - Maximum beliefs to track (default: 100, LRU eviction)
   */
  constructor(initialBeliefs?: Map<string, ActionBelief>, maxBeliefs?: number) {
    this.beliefs = initialBeliefs ? new Map(initialBeliefs) : new Map();
    this.maxBeliefs = maxBeliefs ?? DEFAULT_MAX_BELIEFS;
  }

  // --------------------------------------------------------------------------
  // Core Methods
  // --------------------------------------------------------------------------

  /**
   * Check if the Titan has a belief about an action.
   */
  hasActionBelief(action: string): boolean {
    return this.beliefs.has(action);
  }

  /**
   * Get the belief about an action, if it exists.
   */
  getActionBelief(action: string): ActionBelief | undefined {
    return this.beliefs.get(action);
  }

  /**
   * Get the goodness value for an action.
   * Returns 0 (neutral) for unknown actions.
   */
  getActionGoodness(action: string): number {
    const belief = this.beliefs.get(action);
    return belief?.goodness ?? 0;
  }

  /**
   * Get the confidence value for an action.
   * Returns 0 for unknown actions.
   */
  getActionConfidence(action: string): number {
    const belief = this.beliefs.get(action);
    return belief?.confidence ?? 0;
  }

  /**
   * Get all beliefs as an array.
   */
  getAllBeliefs(): ActionBelief[] {
    return Array.from(this.beliefs.values());
  }

  /**
   * Get the number of beliefs tracked.
   */
  size(): number {
    return this.beliefs.size;
  }

  // --------------------------------------------------------------------------
  // Reinforcement
  // --------------------------------------------------------------------------

  /**
   * Reinforce an action as good or bad.
   * 
   * This is the core learning mechanism:
   * - Goodness shifts toward +1 (praise) or -1 (punish)
   * - Confidence increases with each reinforcement (diminishing returns)
   * - Learning rate decreases with more reinforcements (stability)
   * 
   * @param action - The action being reinforced
   * @param isGood - true for praise, false for punishment
   * @param magnitude - Optional magnitude (0-1, default 1.0)
   */
  reinforceAction(action: string, isGood: boolean, magnitude: number = 1.0): void {
    let belief = this.beliefs.get(action);

    if (!belief) {
      // Create new belief for unknown action
      belief = {
        action,
        goodness: 0,
        confidence: 0,
        lastReinforced: Date.now(),
        reinforcementCount: 0,
      };
    }

    // Calculate learning rate with diminishing returns
    // Formula: 0.3 / (1 + Math.log(1 + reinforcementCount))
    const learningRate = BASE_LEARNING_RATE / (1 + Math.log(1 + belief.reinforcementCount));

    // Update goodness
    const direction = isGood ? 1 : -1;
    belief.goodness = belief.goodness + learningRate * direction * magnitude;
    
    // Clamp goodness to [-1, 1]
    belief.goodness = Math.max(-1, Math.min(1, belief.goodness));

    // Update confidence with diminishing returns
    // Formula: confidence + 0.1 * (1 - confidence)
    belief.confidence = Math.min(1, belief.confidence + CONFIDENCE_INCREASE * (1 - belief.confidence));

    // Update tracking fields
    belief.reinforcementCount++;
    belief.lastReinforced = Date.now();

    // Store updated belief
    this.beliefs.set(action, belief);

    // Handle LRU eviction if needed
    if (this.beliefs.size > this.maxBeliefs) {
      this.evictOldest();
    }
  }

  // --------------------------------------------------------------------------
  // Decay
  // --------------------------------------------------------------------------

  /**
   * Decay all beliefs toward neutral (0) based on time elapsed.
   * 
   * Decay formula: goodness *= (1 - decayRate * deltaMinutes * (1 - confidence))
   * 
   * Low confidence beliefs decay faster because:
   * - (1 - confidence) is larger for low confidence
   * - This makes uncertain beliefs fade faster
   * 
   * @param deltaMinutes - Game minutes elapsed
   */
  decayBeliefs(deltaMinutes: number): void {
    if (deltaMinutes <= 0) return;

    for (const [action, belief] of this.beliefs.entries()) {
      // Calculate decay factor
      // Low confidence (closer to 0) means higher (1 - confidence), so faster decay
      const decayFactor = 1 - BELIEF_DECAY_RATE * deltaMinutes * (1 - belief.confidence);

      // Apply decay to goodness
      belief.goodness *= decayFactor;

      // Update the belief in map
      this.beliefs.set(action, belief);
    }
  }

  // --------------------------------------------------------------------------
  // LRU Eviction
  // --------------------------------------------------------------------------

  /**
   * Evict the oldest belief (least recently reinforced).
   * Called when beliefs exceed maxBeliefs.
   */
  private evictOldest(): void {
    let oldestAction: string | null = null;
    let oldestTime = Infinity;

    for (const [action, belief] of this.beliefs.entries()) {
      if (belief.lastReinforced < oldestTime) {
        oldestTime = belief.lastReinforced;
        oldestAction = action;
      }
    }

    if (oldestAction !== null) {
      this.beliefs.delete(oldestAction);
    }
  }

  // --------------------------------------------------------------------------
  // Serialization
  // --------------------------------------------------------------------------

  /**
   * Convert beliefs to a Map for serialization.
   * Returns a copy to prevent external modification.
   */
  toMap(): Map<string, ActionBelief> {
    return new Map(this.beliefs);
  }

  /**
   * Create an ActionBeliefMap from a Map.
   * Used for deserializing saved data.
   */
  static fromMap(map: Map<string, ActionBelief>): ActionBeliefMap {
    return new ActionBeliefMap(map);
  }
}

// ============================================================================
// ACTION HISTORY TRACKER
// ============================================================================

/**
 * Tracks the Titan's action history for training and alignment calculation.
 * 
 * Key features:
 * - Maintains a rolling history of actions with timestamps
 * - Provides training window detection (3 second window)
 * - Supports alignment impact tracking
 * 
 * "Every action the Titan takes is recorded here, like a blockchain
 * but for moral decisions. Immutable until we hit the history limit."
 */
export class ActionHistoryTracker {
  private history: ActionHistoryEntry[];
  private maxHistory: number;

  /**
   * Creates a new ActionHistoryTracker.
   * 
   * @param initialHistory - Optional initial history to populate
   * @param maxHistory - Maximum entries to track (default: 500)
   */
  constructor(initialHistory?: ActionHistoryEntry[], maxHistory?: number) {
    this.history = initialHistory ? [...initialHistory] : [];
    this.maxHistory = maxHistory ?? DEFAULT_MAX_HISTORY;
  }

  // --------------------------------------------------------------------------
  // Core Methods
  // --------------------------------------------------------------------------

  /**
   * Record a new action in history.
   * 
   * @param action - The action performed
   * @param alignmentImpact - How this action affects alignment (-1 to +1)
   */
  recordAction(action: string, alignmentImpact: number): void {
    const entry: ActionHistoryEntry = {
      action,
      timestamp: Date.now(),
      alignmentImpact,
    };

    this.history.push(entry);

    // Enforce history limit
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * Get the most recent action, or null if history is empty.
   */
  getLastAction(): ActionHistoryEntry | null {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1];
  }

  /**
   * Get the N most recent actions.
   * 
   * @param count - Number of actions to retrieve
   */
  getRecentActions(count: number): ActionHistoryEntry[] {
    if (count >= this.history.length) {
      return [...this.history];
    }
    return this.history.slice(-count);
  }

  /**
   * Get all actions within a time window from now.
   * 
   * @param milliseconds - Time window in milliseconds
   */
  getActionsWithinTime(milliseconds: number): ActionHistoryEntry[] {
    const cutoff = Date.now() - milliseconds;
    return this.history.filter(entry => entry.timestamp > cutoff);
  }

  // --------------------------------------------------------------------------
  // Training Window
  // --------------------------------------------------------------------------

  /**
   * Get the trainable action if within the training window.
   * 
   * The training window is 3 seconds (3000ms).
   * If the last action was performed within this window, it can be
   * praised or punished to teach the Titan.
   * 
   * @returns The last action if within window, null otherwise
   */
  getTrainableAction(): ActionHistoryEntry | null {
    const lastAction = this.getLastAction();
    if (!lastAction) return null;

    const now = Date.now();
    const elapsed = now - lastAction.timestamp;

    // Training window is exclusive at the boundary
    if (elapsed < TRAINING_WINDOW_MS) {
      return lastAction;
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // Serialization
  // --------------------------------------------------------------------------

  /**
   * Convert history to an array for serialization.
   * Returns a copy to prevent external modification.
   */
  toArray(): ActionHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Create an ActionHistoryTracker from an array.
   * Used for deserializing saved data.
   */
  static fromArray(array: ActionHistoryEntry[]): ActionHistoryTracker {
    return new ActionHistoryTracker(array);
  }
}

// ============================================================================
// OBSERVATION TRACKER
// ============================================================================

/**
 * Tracks observed NPC behaviors for the Titan to learn from.
 * 
 * Key features:
 * - Records observations of NPC actions
 * - Tracks outcomes (success/failure) and mimicry attempts
 * - Limited to recent observations (default: 50)
 * 
 * "The Titan watches. The Titan learns. The Titan probably judges
 * everyone's life choices too, but that's unconfirmed."
 */
export class ObservationTracker {
  private observations: ObservedBehavior[];
  private maxObservations: number;

  /**
   * Creates a new ObservationTracker.
   * 
   * @param initialObservations - Optional initial observations to populate
   * @param maxObservations - Maximum observations to track (default: 50)
   */
  constructor(initialObservations?: ObservedBehavior[], maxObservations?: number) {
    this.observations = initialObservations ? [...initialObservations] : [];
    this.maxObservations = maxObservations ?? DEFAULT_MAX_OBSERVATIONS;
  }

  // --------------------------------------------------------------------------
  // Recording Observations
  // --------------------------------------------------------------------------

  /**
   * Record an observation of an NPC performing an action.
   * 
   * @param actorId - The ID of the NPC performing the action
   * @param action - The action being performed
   * @returns The created observation
   */
  recordObservation(actorId: string, action: string): ObservedBehavior {
    const observation: ObservedBehavior = {
      actorId,
      action,
      outcome: 'pending',
      observedAt: Date.now(),
      mimicked: false,
    };

    this.observations.push(observation);

    // Enforce observation limit
    if (this.observations.length > this.maxObservations) {
      this.observations = this.observations.slice(-this.maxObservations);
    }

    return observation;
  }

  // --------------------------------------------------------------------------
  // Updating Observations
  // --------------------------------------------------------------------------

  /**
   * Update the outcome of a pending observation.
   * Updates the most recent matching observation.
   * 
   * @param actorId - The NPC who performed the action
   * @param action - The action that was performed
   * @param outcome - The outcome ('success' or 'failure')
   */
  updateOutcome(actorId: string, action: string, outcome: 'success' | 'failure'): void {
    // Find the most recent matching observation (search from end)
    for (let i = this.observations.length - 1; i >= 0; i--) {
      const obs = this.observations[i];
      if (obs.actorId === actorId && obs.action === action && obs.outcome === 'pending') {
        obs.outcome = outcome;
        return;
      }
    }
  }

  /**
   * Mark an observation as having been mimicked.
   * Updates the most recent matching observation.
   * 
   * @param actorId - The NPC who performed the action
   * @param action - The action that was mimicked
   */
  markMimicked(actorId: string, action: string): void {
    // Find the most recent matching observation (search from end)
    for (let i = this.observations.length - 1; i >= 0; i--) {
      const obs = this.observations[i];
      if (obs.actorId === actorId && obs.action === action) {
        obs.mimicked = true;
        return;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Query Methods
  // --------------------------------------------------------------------------

  /**
   * Get the N most recent observations.
   * 
   * @param count - Number of observations to retrieve
   * @returns Array of recent observations (oldest first)
   */
  getRecentObservations(count: number): ObservedBehavior[] {
    if (count >= this.observations.length) {
      return [...this.observations];
    }
    return this.observations.slice(-count);
  }

  /**
   * Get all observations of a specific NPC.
   * 
   * @param actorId - The NPC to filter by
   * @returns Array of observations for that NPC
   */
  getObservationsOf(actorId: string): ObservedBehavior[] {
    return this.observations.filter(obs => obs.actorId === actorId);
  }

  /**
   * Get all observations with pending outcome.
   * 
   * @returns Array of pending observations
   */
  getPendingObservations(): ObservedBehavior[] {
    return this.observations.filter(obs => obs.outcome === 'pending');
  }

  /**
   * Get all successful observations.
   * 
   * @returns Array of successful observations
   */
  getSuccessfulObservations(): ObservedBehavior[] {
    return this.observations.filter(obs => obs.outcome === 'success');
  }

  // --------------------------------------------------------------------------
  // Serialization
  // --------------------------------------------------------------------------

  /**
   * Convert observations to an array for serialization.
   * Returns a copy to prevent external modification.
   */
  toArray(): ObservedBehavior[] {
    return [...this.observations];
  }

  /**
   * Create an ObservationTracker from an array.
   * Used for deserializing saved data.
   */
  static fromArray(arr: ObservedBehavior[]): ObservationTracker {
    return new ObservationTracker(arr);
  }
}

// ============================================================================
// MIMICRY FUNCTIONS
// ============================================================================

/**
 * Check if the Titan has a curiosity-driven desire.
 * Curiosity desires have source 'curiosity'.
 * 
 * @param titan - The Titan pet
 * @returns True if the Titan has a curiosity desire
 */
function hasCuriosityDesire(titan: TitanPet): boolean {
  return titan.bdi.desires.some(d => d.source === 'curiosity');
}

/**
 * Calculate the chance of the Titan mimicking an observed action.
 * 
 * The formula considers:
 * - Base chance from openness personality trait (0.3 * openness)
 * - NPC opinion modifier (0 to 0.2 based on opinion)
 * - Action belief modifier (reduces chance for known actions)
 * - Curiosity bonus (adds 0.1 if Titan has curiosity desire)
 * 
 * Result is clamped between 5% and 60%.
 * 
 * @param titan - The Titan pet
 * @param npcId - The ID of the NPC being observed
 * @param action - The action being observed
 * @returns Mimicry chance (0.05 to 0.6)
 */
export function calculateMimicryChance(
  titan: TitanPet,
  npcId: string,
  action: string
): number {
  // Base chance from openness (0 to 0.3)
  let chance = titan.personality.bigFive.openness * 0.3;

  // Modifier from NPC opinion (0 to 0.2)
  // Opinion is stored as -100 to 100, so normalize to 0-1 range for positive opinions
  const opinion = titan.bdi.beliefs.npcOpinions.get(npcId) ?? 0;
  chance += Math.max(0, opinion / 100) * 0.2;

  // Modifier from action belief (high confidence reduces mimicry)
  const belief = titan.bdi.beliefs.actionBeliefs.get(action);
  if (belief && belief.confidence > 0.5) {
    chance *= 0.5; // Less likely to mimic actions we already know about
  }

  // Curiosity bonus
  if (hasCuriosityDesire(titan)) {
    chance += 0.1;
  }

  // Clamp to 5%-60%
  return Math.min(0.6, Math.max(0.05, chance));
}

/**
 * Decide if the Titan should try to mimic an observed action.
 * 
 * @param titan - The Titan pet
 * @param observation - The observed behavior
 * @returns True if the Titan should attempt to mimic
 */
export function shouldMimicAction(
  titan: TitanPet,
  observation: ObservedBehavior
): boolean {
  // Never mimic already mimicked observations
  if (observation.mimicked) {
    return false;
  }

  const chance = calculateMimicryChance(titan, observation.actorId, observation.action);
  return Math.random() < chance;
}

/**
 * Process an observation and potentially trigger mimicry.
 * 
 * This is the main entry point for observation learning:
 * 1. Records the observation in the tracker
 * 2. Calculates whether to mimic
 * 3. Marks the observation as mimicked if decided
 * 
 * @param titan - The Titan pet
 * @param actorNpcId - The ID of the NPC performing the action
 * @param action - The action being observed
 * @param tracker - The observation tracker
 * @returns Object containing shouldMimic decision and the observation
 */
export function processObservation(
  titan: TitanPet,
  actorNpcId: string,
  action: string,
  tracker: ObservationTracker
): { shouldMimic: boolean; observation: ObservedBehavior } {
  // Record the observation
  const observation = tracker.recordObservation(actorNpcId, action);

  // Decide whether to mimic
  const shouldMimic = shouldMimicAction(titan, observation);

  // Mark as mimicked if decided
  if (shouldMimic) {
    observation.mimicked = true;
  }

  return { shouldMimic, observation };
}

/**
 * Learn from the outcome of a mimicked action.
 * 
 * This provides weaker learning than direct player training:
 * - Uses magnitude of 0.5 (half of direct training)
 * - Success reinforces action as good
 * - Failure reinforces action as bad
 * 
 * @param beliefMap - The action belief map to update
 * @param action - The action that was mimicked
 * @param outcome - The outcome of the mimicked action
 */
export function learnFromMimicry(
  beliefMap: ActionBeliefMap,
  action: string,
  outcome: 'success' | 'failure'
): void {
  const isGood = outcome === 'success';
  beliefMap.reinforceAction(action, isGood, MIMICRY_LEARNING_MAGNITUDE);
}
