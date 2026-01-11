/**
 * LearningManager - Manages NPC skill learning and social observation
 *
 * This manager handles:
 * - Skill progression and XP gains
 * - Level calculation and modifiers
 * - Skill decay for unused skills
 * - Social learning from observed behaviors
 * - Action preference tracking
 */

import {
  Skill,
  NPCLearning,
  SkillProgression,
  ObservedBehavior,
  LEVEL_THRESHOLDS,
  XP_GAINS,
  calculateLevel,
  getSkillModifier as getSkillModifierUtil,
  createDefaultLearning,
} from './learning';

/** Result of gaining experience */
export interface ExperienceGainResult {
  /** Whether a level up occurred */
  leveled: boolean;
  /** The skill that gained XP (if any) */
  skill?: Skill;
  /** New level after leveling up (if leveled) */
  newLevel?: number;
}

/** Minimum interface for an NPC with learning */
interface LearningNPC {
  id: string;
  learning: NPCLearning;
  relationships: Record<string, { respect: number; trust?: number }>;
}

/** Decay rate per day of inactivity (percentage of XP) */
const DECAY_RATE_PER_DAY = 0.005; // 0.5% per day

/** Minimum days before decay starts */
const DECAY_GRACE_PERIOD_DAYS = 7;

/** Respect threshold required to learn from another NPC */
const RESPECT_THRESHOLD_FOR_LEARNING = 30;

/** Maximum stored observations */
const MAX_OBSERVATIONS = 50;

/** Success/failure adjustment amounts for preferences */
const SUCCESS_ADJUSTMENT = 0.1;
const FAILURE_ADJUSTMENT = 0.1;

/** Blend factor for social learning (how much observed success rates affect preferences) */
const SOCIAL_LEARNING_BLEND = 0.3;

/**
 * LearningManager handles all operations related to NPC skill learning.
 */
export class LearningManager {
  /**
   * Add experience for an activity and check for level up.
   *
   * @param npc - The NPC gaining experience
   * @param activity - The activity performed (must match XP_GAINS keys)
   * @returns Result indicating if leveling occurred
   */
  gainExperience(npc: LearningNPC, activity: string): ExperienceGainResult {
    const xpGain = XP_GAINS[activity];
    if (!xpGain) {
      return { leveled: false };
    }

    const { skill, amount } = xpGain;
    const progression = npc.learning.skills[skill];

    if (!progression) {
      return { leveled: false };
    }

    // Add experience
    progression.experience += amount;
    progression.lastPracticed = Date.now();

    // Check for level up
    const newLevel = calculateLevel(progression.experience);
    if (newLevel > progression.level) {
      progression.level = newLevel;
      return {
        leveled: true,
        skill,
        newLevel,
      };
    }

    return {
      leveled: false,
      skill,
    };
  }

  /**
   * Get the current level for a skill.
   *
   * @param npc - The NPC to check
   * @param skill - The skill to query
   * @returns The skill level (1-10)
   */
  getSkillLevel(npc: LearningNPC, skill: Skill): number {
    return npc.learning.skills[skill]?.level ?? 1;
  }

  /**
   * Get the skill modifier based on level (0.5 to 1.5).
   *
   * @param npc - The NPC to check
   * @param skill - The skill to query
   * @returns The modifier (0.5-1.5)
   */
  getSkillModifier(npc: LearningNPC, skill: Skill): number {
    const level = this.getSkillLevel(npc, skill);
    return getSkillModifierUtil(level);
  }

  /**
   * Decay skills that haven't been practiced recently.
   * Skills lose XP over time but won't drop below their current level threshold.
   *
   * @param npc - The NPC to decay skills for
   * @param daysSinceLastUpdate - Days since the last decay check
   */
  decayUnusedSkills(npc: LearningNPC, daysSinceLastUpdate: number): void {
    const now = Date.now();

    for (const skill of Object.keys(npc.learning.skills) as Skill[]) {
      const progression = npc.learning.skills[skill];
      if (!progression) continue;

      // Calculate days since last practice
      const daysSincePractice = (now - progression.lastPracticed) / (24 * 60 * 60 * 1000);

      // Skip if within grace period
      if (daysSincePractice <= DECAY_GRACE_PERIOD_DAYS) {
        continue;
      }

      // Calculate decay amount
      const effectiveDecayDays = Math.min(daysSincePractice - DECAY_GRACE_PERIOD_DAYS, daysSinceLastUpdate);
      const decayAmount = progression.experience * DECAY_RATE_PER_DAY * effectiveDecayDays;

      // Calculate minimum XP (threshold for current level)
      const minXP = LEVEL_THRESHOLDS[progression.level - 1];

      // Apply decay, but don't go below level threshold
      progression.experience = Math.max(minXP, progression.experience - decayAmount);
    }
  }

  /**
   * Record an observed behavior from another NPC.
   * Only records if the observer has sufficient respect for the actor.
   *
   * @param observer - The NPC observing the behavior
   * @param actor - The NPC performing the action
   * @param action - The action being performed
   * @param outcome - Whether the action succeeded or failed
   */
  observeBehavior(
    observer: LearningNPC,
    actor: LearningNPC,
    action: string,
    outcome: 'success' | 'failure'
  ): void {
    // Check if observer has a relationship with actor
    const relationship = observer.relationships[actor.id];
    if (!relationship || relationship.respect < RESPECT_THRESHOLD_FOR_LEARNING) {
      return;
    }

    // Record the observation
    const observation: ObservedBehavior = {
      actorId: actor.id,
      action,
      outcome,
      observedAt: Date.now(),
    };

    observer.learning.observedBehaviors.push(observation);

    // Limit stored observations (FIFO)
    while (observer.learning.observedBehaviors.length > MAX_OBSERVATIONS) {
      observer.learning.observedBehaviors.shift();
    }
  }

  /**
   * Process observed behaviors to update action preferences.
   * Analyzes success rates of observed actions and blends with current preferences.
   *
   * @param npc - The NPC to update preferences for
   */
  learnFromObservations(npc: LearningNPC): void {
    const observations = npc.learning.observedBehaviors;
    if (observations.length === 0) return;

    // Count success rates per action
    const actionStats: Record<string, { success: number; total: number }> = {};

    for (const obs of observations) {
      if (!actionStats[obs.action]) {
        actionStats[obs.action] = { success: 0, total: 0 };
      }
      actionStats[obs.action].total++;
      if (obs.outcome === 'success') {
        actionStats[obs.action].success++;
      }
    }

    // Update preferences based on observed success rates
    for (const [action, stats] of Object.entries(actionStats)) {
      const successRate = stats.success / stats.total;
      const currentPreference = npc.learning.actionPreferences[action] ?? 0.5;

      // Blend current preference with observed success rate
      npc.learning.actionPreferences[action] =
        currentPreference * (1 - SOCIAL_LEARNING_BLEND) + successRate * SOCIAL_LEARNING_BLEND;
    }
  }

  /**
   * Update action preference based on outcome of performing the action.
   *
   * @param npc - The NPC whose preference to update
   * @param action - The action performed
   * @param outcome - Whether the action succeeded or failed
   */
  updateActionPreference(npc: LearningNPC, action: string, outcome: 'success' | 'failure'): void {
    const currentPreference = npc.learning.actionPreferences[action] ?? 0.5;

    let newPreference: number;
    if (outcome === 'success') {
      newPreference = currentPreference + SUCCESS_ADJUSTMENT * (1 - currentPreference);
    } else {
      newPreference = currentPreference - FAILURE_ADJUSTMENT * currentPreference;
    }

    // Clamp between 0 and 1
    npc.learning.actionPreferences[action] = Math.max(0, Math.min(1, newPreference));
  }

  /**
   * Get the preference weight for an action.
   *
   * @param npc - The NPC to check
   * @param action - The action to query
   * @returns Preference weight (0-1), defaults to 0.5
   */
  getActionPreference(npc: LearningNPC, action: string): number {
    return npc.learning.actionPreferences[action] ?? 0.5;
  }

  /**
   * Create a default learning state for a new NPC.
   *
   * @returns A new NPCLearning object
   */
  createDefaultLearning(): NPCLearning {
    return createDefaultLearning();
  }
}
