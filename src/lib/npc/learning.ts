/**
 * NPC Learning Types for Crypto City
 *
 * Skill learning, progression, and social learning systems.
 * NPCs develop skills through practice and learn from observing others.
 */

/**
 * All available skills that NPCs can learn and improve
 */
export type Skill =
  | 'trading'
  | 'coding'
  | 'combat'
  | 'social'
  | 'mining'
  | 'leadership'
  | 'persuasion'
  | 'analysis';

/**
 * All skills as an array for iteration/validation
 */
export const ALL_SKILLS: Skill[] = [
  'trading',
  'coding',
  'combat',
  'social',
  'mining',
  'leadership',
  'persuasion',
  'analysis',
];

/**
 * XP thresholds for each level (1-10)
 * Index 0 = level 1 threshold, Index 9 = level 10 threshold
 */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];

/**
 * Skill progression tracking for a single skill
 */
export interface SkillProgression {
  /** The skill being tracked */
  skill: Skill;
  /** Current level (1-10) */
  level: number;
  /** Current experience points */
  experience: number;
  /** Timestamp of last practice */
  lastPracticed: number;
}

/**
 * An observed behavior from another NPC
 */
export interface ObservedBehavior {
  /** ID of the NPC who performed the action */
  actorId: string;
  /** The action that was observed */
  action: string;
  /** Whether the action succeeded or failed */
  outcome: 'success' | 'failure';
  /** Timestamp when the behavior was observed */
  observedAt: number;
}

/**
 * Complete learning state for an NPC
 */
export interface NPCLearning {
  /** Progression for each skill */
  skills: Record<Skill, SkillProgression>;
  /** Behaviors observed from other NPCs */
  observedBehaviors: ObservedBehavior[];
  /** Learned preferences for actions (action → preference weight 0-1) */
  actionPreferences: Record<string, number>;
}

/**
 * XP gains per activity
 */
export const XP_GAINS: Record<string, { skill: Skill; amount: number }> = {
  'successful_trade': { skill: 'trading', amount: 20 },
  'failed_trade': { skill: 'trading', amount: 5 },
  'write_code': { skill: 'coding', amount: 15 },
  'deploy_contract': { skill: 'coding', amount: 50 },
  'win_fight': { skill: 'combat', amount: 30 },
  'lose_fight': { skill: 'combat', amount: 10 },
  'successful_conversation': { skill: 'social', amount: 10 },
  'mine_block': { skill: 'mining', amount: 15 },
  'lead_meeting': { skill: 'leadership', amount: 25 },
  'convince_someone': { skill: 'persuasion', amount: 20 },
  'analyze_market': { skill: 'analysis', amount: 15 },
};

/**
 * Hitchhiker's Guide style descriptions for skills and learning events
 */
export const LEARNING_DESCRIPTIONS: Record<string, string> = {
  trading: "The art of predicting randomness. Results may vary wildly.",
  coding: "Speaking to machines in their native tongue. They rarely appreciate it.",
  combat: "Physical conflict resolution. Last resort for most, first choice for some.",
  social: "The mysterious skill of understanding other humans. Undervalued in crypto.",
  mining: "Turning electricity into magic internet money. Environmentalists hate this one trick.",
  leadership: "Convincing others to follow your bad ideas. Essential for founders.",
  persuasion: "Making people think your opinion was their idea all along.",
  analysis: "Reading charts until patterns appear. Or don't. It's all tea leaves.",
  levelUp: "Achievement unlocked: Marginally better at something. Progress!",
  socialLearning: "Copying successful people. The original proof-of-stake.",
};

/**
 * Calculate the level for a given amount of experience
 *
 * @param experience - The total experience points
 * @returns The level (1-10)
 */
export function calculateLevel(experience: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (experience >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get the skill modifier based on level (0.5 to 1.5)
 * Level 1 = 0.5, Level 10 = 1.5
 *
 * @param level - The skill level (1-10)
 * @returns The modifier (0.5-1.5)
 */
export function getSkillModifier(level: number): number {
  // Linear scaling from 0.5 at level 1 to 1.5 at level 10
  // modifier = 0.5 + (level - 1) * (1.0 / 9)
  return 0.5 + ((level - 1) / 9);
}

/**
 * Create a default skill progression for a skill
 *
 * @param skill - The skill to create progression for
 * @param timestamp - Optional timestamp for lastPracticed
 * @returns A new SkillProgression at level 1
 */
export function createDefaultSkillProgression(skill: Skill, timestamp?: number): SkillProgression {
  return {
    skill,
    level: 1,
    experience: 0,
    lastPracticed: timestamp ?? Date.now(),
  };
}

/**
 * Create a default learning state for an NPC
 *
 * @returns A new NPCLearning with all skills at level 1
 */
export function createDefaultLearning(): NPCLearning {
  const skills: Partial<Record<Skill, SkillProgression>> = {};
  const now = Date.now();

  for (const skill of ALL_SKILLS) {
    skills[skill] = createDefaultSkillProgression(skill, now);
  }

  return {
    skills: skills as Record<Skill, SkillProgression>,
    observedBehaviors: [],
    actionPreferences: {},
  };
}
