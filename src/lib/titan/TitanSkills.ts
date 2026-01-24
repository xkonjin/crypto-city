/**
 * TitanSkills - Skill Progression System for Titan Creatures
 * 
 * Implements the skill leveling system for Titan pets, based on the NPC
 * learning system but with Titan-specific adaptations:
 * - Species aptitudes that modify XP gain
 * - Skill decay for unused skills
 * - Skill modifiers that affect action success rate
 * 
 * "Skills are like tokens - everyone thinks theirs are undervalued.
 * The market will decide." - Hitchhiker's Guide to Crypto City
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 7 for full skill design
 */

import type {
  TitanSkill,
  TitanSpecies,
  TitanSkillProgression,
} from '@/games/isocity/types/titan';

import { ALL_TITAN_SKILLS } from '@/games/isocity/types/titan';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * XP thresholds for each level (1-10)
 * Index 0 = level 1 threshold, Index 9 = level 10 threshold
 * Same as NPC system for consistency.
 */
export const SKILL_LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];

/**
 * Skill decay rate per day for unused skills.
 * 0.001 = 0.1% XP loss per day.
 * 
 * "Use it or lose it. Much like your portfolio during a bear market."
 */
export const SKILL_DECAY_RATE = 0.001;

// ============================================================================
// SPECIES APTITUDES
// ============================================================================

/**
 * Species-specific skill aptitudes.
 * Values range from 0.5 (weak) to 2.0 (strong).
 * Undefined skills default to 1.0.
 * 
 * "Each species has its strengths. Whales are strong.
 * Dogs are charming. Bears are... cautious."
 */
export const SPECIES_APTITUDES: Record<TitanSpecies, Partial<Record<TitanSkill, number>>> = {
  doge: {
    charisma: 1.2,
    empathy: 1.1,
  },
  bull: {
    strength: 1.5,
    endurance: 1.3,
    intimidation: 1.2,
    speed: 0.7,
    intelligence: 0.8,
  },
  bear: {
    strength: 1.3,
    endurance: 1.5,
    awareness: 1.2,
    speed: 0.8,
    charisma: 0.7,
  },
  ape: {
    intelligence: 1.5,
    awareness: 1.2,
    memory: 1.3,
    strength: 0.9,
    endurance: 0.9,
  },
  whale: {
    strength: 1.8,
    endurance: 2.0,
    miracles: 1.3,
    speed: 0.5,
  },
  phoenix: {
    speed: 1.5,
    miracles: 1.4,
    charisma: 1.3,
    endurance: 0.7,
    strength: 0.8,
  },
};

// ============================================================================
// SKILL DESCRIPTIONS
// ============================================================================

/**
 * Detailed descriptions for each Titan skill.
 * Used for UI display and tooltips.
 */
export const TITAN_SKILL_DESCRIPTIONS: Record<TitanSkill, {
  name: string;
  description: string;
  affects: string[];
}> = {
  strength: {
    name: 'Strength',
    description: 'Raw physical power. Affects carrying, throwing, and combat damage.',
    affects: ['attack damage', 'carrying capacity', 'throw distance'],
  },
  speed: {
    name: 'Speed',
    description: 'Movement and reaction time. Makes Titan faster and more agile.',
    affects: ['movement speed', 'dodge chance', 'reaction time'],
  },
  endurance: {
    name: 'Endurance',
    description: 'Stamina and resilience. Reduces need decay and improves recovery.',
    affects: ['need decay rate', 'stamina', 'recovery speed'],
  },
  intelligence: {
    name: 'Intelligence',
    description: 'Learning speed and problem-solving. Accelerates skill growth.',
    affects: ['learning speed', 'puzzle solving', 'strategy'],
  },
  awareness: {
    name: 'Awareness',
    description: 'Observation range and attention to detail. Notices more around them.',
    affects: ['observation range', 'detail noticed', 'threat detection'],
  },
  memory: {
    name: 'Memory',
    description: 'How long beliefs and learned behaviors persist.',
    affects: ['belief persistence', 'skill retention', 'recall speed'],
  },
  charisma: {
    name: 'Charisma',
    description: 'Social magnetism. Improves NPC interactions and trust building.',
    affects: ['NPC trust gain', 'social success rate', 'influence'],
  },
  intimidation: {
    name: 'Intimidation',
    description: 'The ability to inspire fear. Effective but morally questionable.',
    affects: ['scare effectiveness', 'NPC fear gain', 'deterrence'],
  },
  empathy: {
    name: 'Empathy',
    description: 'Understanding NPC needs and emotions. Enables better helping.',
    affects: ['help effectiveness', 'mood reading', 'need detection'],
  },
  miracles: {
    name: 'Miracles',
    description: 'Special ability power. Required for divine interventions.',
    affects: ['miracle power', 'miracle range', 'miracle duration'],
  },
  stealth: {
    name: 'Stealth',
    description: 'The ability to go unnoticed. For... legitimate purposes.',
    affects: ['detection avoidance', 'sneak success', 'surveillance'],
  },
  gathering: {
    name: 'Gathering',
    description: 'Resource collection efficiency. Like yield farming but physical.',
    affects: ['resource yield', 'gathering speed', 'rare find chance'],
  },
};

// ============================================================================
// APTITUDE FUNCTIONS
// ============================================================================

/**
 * Get the skill aptitude for a specific species and skill.
 * Returns 1.0 if no specific aptitude is defined.
 * 
 * @param species - The Titan's species
 * @param skill - The skill to get aptitude for
 * @returns Aptitude modifier (0.5-2.0)
 */
export function getSkillAptitude(species: TitanSpecies, skill: TitanSkill): number {
  const speciesAptitudes = SPECIES_APTITUDES[species];
  return speciesAptitudes[skill] ?? 1.0;
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize skill progressions for a new Titan of the given species.
 * All skills start at level 1 with 0 XP, but aptitudes vary by species.
 * 
 * @param species - The Titan's species
 * @returns Record of all skill progressions
 */
export function initializeSkillProgressions(
  species: TitanSpecies
): Record<TitanSkill, TitanSkillProgression> {
  const now = Date.now();
  const progressions = {} as Record<TitanSkill, TitanSkillProgression>;

  for (const skill of ALL_TITAN_SKILLS) {
    progressions[skill] = {
      skill,
      level: 1,
      experience: 0,
      aptitude: getSkillAptitude(species, skill),
      lastUsed: now,
    };
  }

  return progressions;
}

// ============================================================================
// LEVEL CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the level for a given amount of experience.
 * 
 * @param experience - The total experience points
 * @returns The level (1-10)
 */
export function calculateSkillLevel(experience: number): number {
  for (let i = SKILL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (experience >= SKILL_LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get the XP threshold needed to reach the next level.
 * Returns Infinity for max level (10).
 * 
 * @param currentLevel - The current skill level (1-10)
 * @returns XP threshold for next level, or Infinity if at max
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= 10) {
    return Infinity;
  }
  return SKILL_LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Calculate the XP progress percentage toward the next level.
 * 
 * @param progression - The skill progression to check
 * @returns Progress percentage (0-100)
 */
export function getXPProgress(progression: TitanSkillProgression): number {
  const { level, experience } = progression;

  // Max level
  if (level >= 10) {
    return 100;
  }

  const currentThreshold = SKILL_LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = SKILL_LEVEL_THRESHOLDS[level];
  const xpInCurrentLevel = experience - currentThreshold;
  const xpNeededForNextLevel = nextThreshold - currentThreshold;

  return Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
}

// ============================================================================
// XP GRANTING FUNCTIONS
// ============================================================================

/**
 * Result of granting XP to a skill.
 */
export interface GrantSkillXPResult {
  /** Updated progressions (new object) */
  progressions: Record<TitanSkill, TitanSkillProgression>;
  /** Whether the skill leveled up */
  leveledUp: boolean;
  /** New level after XP gain */
  newLevel: number;
  /** Actual XP gained (after aptitude modifier) */
  xpGained: number;
}

/**
 * Grant XP to a skill, applying the aptitude modifier.
 * Returns a new progressions object (immutable).
 * 
 * @param progressions - Current skill progressions
 * @param skill - The skill to grant XP to
 * @param baseAmount - Base XP amount (before aptitude modifier)
 * @returns Result with updated progressions and level-up info
 */
export function grantSkillXP(
  progressions: Record<TitanSkill, TitanSkillProgression>,
  skill: TitanSkill,
  baseAmount: number
): GrantSkillXPResult {
  const oldProgression = progressions[skill];
  const oldLevel = oldProgression.level;

  // Apply aptitude modifier
  const xpGained = Math.round(baseAmount * oldProgression.aptitude);
  const newExperience = oldProgression.experience + xpGained;
  const newLevel = Math.min(10, calculateSkillLevel(newExperience));

  // Create new progression object
  const newProgression: TitanSkillProgression = {
    ...oldProgression,
    experience: newExperience,
    level: newLevel,
    lastUsed: Date.now(),
  };

  // Create new progressions object (immutable)
  const newProgressions = {
    ...progressions,
    [skill]: newProgression,
  };

  return {
    progressions: newProgressions,
    leveledUp: newLevel > oldLevel,
    newLevel,
    xpGained,
  };
}

// ============================================================================
// SKILL MODIFIER FUNCTIONS
// ============================================================================

/**
 * Get the skill modifier based on level.
 * Level 1 = 0.5, Level 10 = 1.5
 * Scales linearly between.
 * 
 * This modifier affects action success rate - higher skills = better outcomes.
 * 
 * @param level - The skill level (1-10)
 * @returns The modifier (0.5-1.5)
 */
export function getSkillModifier(level: number): number {
  // Linear scaling: 0.5 + (level - 1) * (1.0 / 9)
  return 0.5 + ((level - 1) / 9);
}

// ============================================================================
// SKILL DECAY FUNCTIONS
// ============================================================================

/**
 * Decay XP for skills not used recently.
 * Skills in the skillsUsed array are exempt from decay.
 * Returns a new progressions object (immutable).
 * 
 * Formula: newXP = oldXP * (1 - SKILL_DECAY_RATE)^daysPassed
 * 
 * @param progressions - Current skill progressions
 * @param daysPassed - Number of days since last decay check
 * @param skillsUsed - Array of skills that were used (exempt from decay)
 * @returns Updated progressions with decayed XP
 */
export function decayUnusedSkills(
  progressions: Record<TitanSkill, TitanSkillProgression>,
  daysPassed: number,
  skillsUsed: TitanSkill[]
): Record<TitanSkill, TitanSkillProgression> {
  const skillsUsedSet = new Set(skillsUsed);
  const newProgressions = { ...progressions };

  for (const skill of ALL_TITAN_SKILLS) {
    // Skip skills that were used
    if (skillsUsedSet.has(skill)) {
      continue;
    }

    const oldProgression = progressions[skill];
    
    // Calculate decay: XP * (1 - rate)^days
    const decayFactor = Math.pow(1 - SKILL_DECAY_RATE, daysPassed);
    let newExperience = oldProgression.experience * decayFactor;
    
    // Don't go below 0
    newExperience = Math.max(0, newExperience);

    // Recalculate level based on new XP
    const newLevel = Math.max(1, calculateSkillLevel(newExperience));

    // Create new progression object
    newProgressions[skill] = {
      ...oldProgression,
      experience: newExperience,
      level: newLevel,
    };
  }

  return newProgressions;
}

/**
 * Mark a skill as used (updates lastUsed timestamp).
 * Returns a new progressions object (immutable).
 * 
 * @param progressions - Current skill progressions
 * @param skill - The skill to mark as used
 * @returns Updated progressions with new lastUsed timestamp
 */
export function markSkillUsed(
  progressions: Record<TitanSkill, TitanSkillProgression>,
  skill: TitanSkill
): Record<TitanSkill, TitanSkillProgression> {
  const oldProgression = progressions[skill];

  return {
    ...progressions,
    [skill]: {
      ...oldProgression,
      lastUsed: Date.now(),
    },
  };
}

// ============================================================================
// SKILL SUMMARY FUNCTIONS
// ============================================================================

/**
 * Skill summary information.
 */
export interface SkillSummary {
  /** Average level across all skills */
  averageLevel: number;
  /** Highest skilled skill */
  highestSkill: { skill: TitanSkill; level: number };
  /** Lowest skilled skill */
  lowestSkill: { skill: TitanSkill; level: number };
  /** Total XP across all skills */
  totalXP: number;
}

/**
 * Get an overall summary of skill progressions.
 * 
 * @param progressions - Skill progressions to summarize
 * @returns Summary with averages, highest/lowest, and totals
 */
export function getSkillSummary(
  progressions: Record<TitanSkill, TitanSkillProgression>
): SkillSummary {
  let totalLevel = 0;
  let totalXP = 0;
  let highestSkill: TitanSkill = ALL_TITAN_SKILLS[0];
  let highestLevel = 0;
  let lowestSkill: TitanSkill = ALL_TITAN_SKILLS[0];
  let lowestLevel = Infinity;

  for (const skill of ALL_TITAN_SKILLS) {
    const progression = progressions[skill];
    totalLevel += progression.level;
    totalXP += progression.experience;

    if (progression.level > highestLevel) {
      highestLevel = progression.level;
      highestSkill = skill;
    }

    if (progression.level < lowestLevel) {
      lowestLevel = progression.level;
      lowestSkill = skill;
    }
  }

  const averageLevel = totalLevel / ALL_TITAN_SKILLS.length;

  return {
    averageLevel,
    highestSkill: { skill: highestSkill, level: highestLevel },
    lowestSkill: { skill: lowestSkill, level: lowestLevel },
    totalXP,
  };
}

/**
 * Get all skills above a certain level threshold.
 * 
 * @param progressions - Skill progressions to check
 * @param level - Level threshold (exclusive - must be ABOVE this level)
 * @returns Array of skills above the threshold
 */
export function getSkillsAboveLevel(
  progressions: Record<TitanSkill, TitanSkillProgression>,
  level: number
): TitanSkill[] {
  const result: TitanSkill[] = [];

  for (const skill of ALL_TITAN_SKILLS) {
    if (progressions[skill].level > level) {
      result.push(skill);
    }
  }

  return result;
}
