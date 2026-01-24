/**
 * TitanDen - Titan Den Building System
 * 
 * The Titan Den is a special building that serves as the Titan's home.
 * Inspired by Black & White's creature pen, it provides:
 * - Rest and recovery facilities
 * - Feeding and hydration stations
 * - Training equipment
 * - Special features that unlock with upgrades
 * 
 * "Home is where the blockchain is. Also where your creature sleeps,
 * eats, and occasionally contemplates the nature of decentralization."
 * - Hitchhiker's Guide to Crypto City
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 8 for design documentation
 */

import type { TitanPet, TitanSkill } from '@/games/isocity/types/titan';
import type { Miracle } from './TitanMiracles';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum den level */
export const MAX_DEN_LEVEL = 5;

/** Minimum den level */
export const MIN_DEN_LEVEL = 1;

/** Base hunger restoration from feeding bowl */
const FEEDING_BOWL_HUNGER_RESTORE = 30;

/** Energy restoration rate multiplier at den (50% faster than normal) */
const SLEEPING_AREA_ENERGY_RESTORE = 5;

/** Strength XP gained from training dummy */
const TRAINING_DUMMY_XP = 10;

/** Miracle cooldown reduction percentage at altar */
const MIRACLE_ALTAR_COOLDOWN_REDUCTION = 0.2; // 20%

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Features available in a Titan Den.
 * Features unlock progressively as the den is upgraded.
 */
export interface TitanDenFeatures {
  /** Level 1+: Satisfies hunger need when Titan visits den */
  feedingBowl: boolean;
  /** Level 1+: Provides hydration */
  waterBowl: boolean;
  /** Level 1+: Provides 50% faster energy recovery during sleep */
  sleepingArea: boolean;
  /** Level 2+: Storage for toys and items */
  toyStorage: boolean;
  /** Level 2+: Grants strength XP when Titan practices */
  trainingDummy: boolean;
  /** Level 3+: Reduces miracle cooldowns by 20% */
  miracleAltar: boolean;
  /** Level 4+: Prevents belief decay while near den */
  memoryShrine: boolean;
  /** Level 5 only: Allows changing Titan species */
  evolutionChamber: boolean;
}

/**
 * The Titan Den building.
 * A special building that serves as the Titan's home base.
 */
export interface TitanDen {
  /** Which building variant this is (e.g., "titan-den-1") */
  buildingId: string;
  /** Current level (1-5) */
  level: number;
  /** Grid position */
  position: { x: number; y: number };
  /** Currently unlocked features */
  features: TitanDenFeatures;
  /** Timestamp when den was last used */
  lastUsed: number;
}

/**
 * Configuration for each den level.
 */
export interface DenLevelConfig {
  /** Building ID for this level */
  buildingId: string;
  /** Building footprint size [width, height] */
  footprint: [number, number];
  /** Features available at this level */
  features: TitanDenFeatures;
  /** Cost to upgrade to this level (undefined for level 1) */
  upgradeCost?: number;
  /** Skill requirement to unlock this level upgrade */
  unlockRequirement?: { skill: TitanSkill; level: number };
}

/**
 * Effect configuration for a den feature.
 */
export interface DenFeatureEffect {
  /** Description of what this feature does */
  description: string;
  /** Function to apply the effect to a Titan */
  effect: (titan: TitanPet) => void;
  /** Optional requirement description */
  requirement?: string;
}

// ============================================================================
// DEN LEVEL CONFIGURATION
// ============================================================================

/**
 * Configuration for all den levels.
 * Each level provides progressively more features.
 */
export const DEN_LEVEL_CONFIG: Record<number, DenLevelConfig> = {
  1: {
    buildingId: 'titan-den-1',
    footprint: [2, 2],
    features: {
      feedingBowl: true,
      waterBowl: true,
      sleepingArea: true,
      toyStorage: false,
      trainingDummy: false,
      miracleAltar: false,
      memoryShrine: false,
      evolutionChamber: false,
    },
  },
  2: {
    buildingId: 'titan-den-2',
    footprint: [2, 2],
    features: {
      feedingBowl: true,
      waterBowl: true,
      sleepingArea: true,
      toyStorage: true,
      trainingDummy: true,
      miracleAltar: false,
      memoryShrine: false,
      evolutionChamber: false,
    },
    upgradeCost: 5000,
  },
  3: {
    buildingId: 'titan-den-3',
    footprint: [3, 3],
    features: {
      feedingBowl: true,
      waterBowl: true,
      sleepingArea: true,
      toyStorage: true,
      trainingDummy: true,
      miracleAltar: true,
      memoryShrine: false,
      evolutionChamber: false,
    },
    upgradeCost: 10000,
    unlockRequirement: { skill: 'miracles', level: 3 },
  },
  4: {
    buildingId: 'titan-den-4',
    footprint: [3, 3],
    features: {
      feedingBowl: true,
      waterBowl: true,
      sleepingArea: true,
      toyStorage: true,
      trainingDummy: true,
      miracleAltar: true,
      memoryShrine: true,
      evolutionChamber: false,
    },
    upgradeCost: 20000,
    unlockRequirement: { skill: 'memory', level: 5 },
  },
  5: {
    buildingId: 'titan-den-5',
    footprint: [4, 4],
    features: {
      feedingBowl: true,
      waterBowl: true,
      sleepingArea: true,
      toyStorage: true,
      trainingDummy: true,
      miracleAltar: true,
      memoryShrine: true,
      evolutionChamber: true,
    },
    upgradeCost: 50000,
    unlockRequirement: { skill: 'intelligence', level: 8 },
  },
};

// ============================================================================
// DEN FEATURE EFFECTS
// ============================================================================

/**
 * Effects for each den feature.
 * Describes what each feature does and provides the effect function.
 */
export const DEN_FEATURE_EFFECTS: Record<keyof TitanDenFeatures, DenFeatureEffect> = {
  feedingBowl: {
    description: 'Satisfies hunger need when Titan visits den.',
    effect: (titan) => {
      titan.needs.hunger.current = Math.min(
        titan.needs.hunger.max,
        titan.needs.hunger.current + FEEDING_BOWL_HUNGER_RESTORE
      );
    },
  },
  waterBowl: {
    description: 'Provides hydration and slight energy boost.',
    effect: (titan) => {
      // Water provides a small energy boost
      titan.needs.energy.current = Math.min(
        titan.needs.energy.max,
        titan.needs.energy.current + 5
      );
    },
  },
  sleepingArea: {
    description: 'Provides 50% faster energy recovery during sleep.',
    effect: (titan) => {
      titan.needs.energy.current = Math.min(
        titan.needs.energy.max,
        titan.needs.energy.current + SLEEPING_AREA_ENERGY_RESTORE
      );
    },
  },
  toyStorage: {
    description: 'Stores toys for the Titan to play with, boosting fun.',
    effect: (titan) => {
      titan.needs.fun.current = Math.min(
        titan.needs.fun.max,
        titan.needs.fun.current + 10
      );
    },
  },
  trainingDummy: {
    description: 'Grants strength XP when Titan practices.',
    effect: () => {
      // XP is granted separately via useTrainingDummy function
    },
  },
  miracleAltar: {
    description: 'Reduces miracle cooldowns by 20%.',
    effect: () => {
      // Cooldown reduction is applied via useMiracleAltar function
    },
  },
  memoryShrine: {
    description: 'Prevents belief decay while near den.',
    effect: () => {
      // Belief decay prevention is handled in the simulation loop
    },
  },
  evolutionChamber: {
    description: 'Allows changing Titan species.',
    effect: () => {
      // Evolution is triggered via separate UI interaction
    },
  },
};

// ============================================================================
// DEN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Create a new Titan Den at the specified position.
 * 
 * @param level - The den level (1-5, clamped to valid range)
 * @param position - Grid position for the den
 * @returns The created TitanDen
 */
export function createTitanDen(
  level: number,
  position: { x: number; y: number }
): TitanDen {
  // Clamp level to valid range
  const clampedLevel = Math.max(MIN_DEN_LEVEL, Math.min(MAX_DEN_LEVEL, level));
  const config = DEN_LEVEL_CONFIG[clampedLevel];

  return {
    buildingId: config.buildingId,
    level: clampedLevel,
    position: { x: position.x, y: position.y },
    features: { ...config.features },
    lastUsed: Date.now(),
  };
}

/**
 * Upgrade a den to the next level.
 * 
 * @param den - The den to upgrade
 * @returns The upgraded den, or null if already at max level
 */
export function upgradeDen(den: TitanDen): TitanDen | null {
  if (den.level >= MAX_DEN_LEVEL) {
    return null;
  }

  const newLevel = den.level + 1;
  const config = DEN_LEVEL_CONFIG[newLevel];

  return {
    buildingId: config.buildingId,
    level: newLevel,
    position: { ...den.position },
    features: { ...config.features },
    lastUsed: Date.now(),
  };
}

/**
 * Check if a den can be upgraded.
 * 
 * @param den - The den to check
 * @param titan - The Titan (for skill requirement checks)
 * @returns Object with canUpgrade boolean and optional reason
 */
export function canUpgradeDen(
  den: TitanDen,
  titan: TitanPet
): { canUpgrade: boolean; reason?: string } {
  // Check max level
  if (den.level >= MAX_DEN_LEVEL) {
    return { canUpgrade: false, reason: 'Den is already at max level.' };
  }

  // Check next level's requirements
  const nextConfig = DEN_LEVEL_CONFIG[den.level + 1];
  
  // Check skill requirement if defined
  if (nextConfig.unlockRequirement) {
    const { skill, level } = nextConfig.unlockRequirement;
    const titanSkillLevel = titan.skills[skill]?.level ?? 1;
    
    if (titanSkillLevel < level) {
      return {
        canUpgrade: false,
        reason: `Requires ${skill} level ${level} (current: ${titanSkillLevel})`,
      };
    }
  }

  return { canUpgrade: true };
}

/**
 * Get the features available at a specific den level.
 * 
 * @param level - The den level to get features for
 * @returns The features available at that level
 */
export function getDenFeatures(level: number): TitanDenFeatures {
  const clampedLevel = Math.max(MIN_DEN_LEVEL, Math.min(MAX_DEN_LEVEL, level));
  return { ...DEN_LEVEL_CONFIG[clampedLevel].features };
}

/**
 * Check if a Titan is at (or near) a den.
 * Considers the den's footprint size.
 * 
 * @param titan - The Titan to check
 * @param den - The den to check against
 * @returns true if the Titan is at or near the den
 */
export function isTitanAtDen(titan: TitanPet, den: TitanDen): boolean {
  const config = DEN_LEVEL_CONFIG[den.level];
  const [width, height] = config.footprint;

  // Check if Titan is within the den's footprint
  const withinX = titan.gridX >= den.position.x && titan.gridX < den.position.x + width;
  const withinY = titan.gridY >= den.position.y && titan.gridY < den.position.y + height;

  return withinX && withinY;
}

/**
 * Apply den effects to a Titan.
 * Only applies effects for features the den has.
 * 
 * @param den - The den providing effects
 * @param titan - The Titan to apply effects to
 */
export function applyDenEffects(den: TitanDen, titan: TitanPet): void {
  // Apply basic needs effects
  if (den.features.feedingBowl) {
    DEN_FEATURE_EFFECTS.feedingBowl.effect(titan);
  }
  if (den.features.waterBowl) {
    DEN_FEATURE_EFFECTS.waterBowl.effect(titan);
  }
  if (den.features.sleepingArea) {
    DEN_FEATURE_EFFECTS.sleepingArea.effect(titan);
  }
  if (den.features.toyStorage) {
    DEN_FEATURE_EFFECTS.toyStorage.effect(titan);
  }

  // Update lastUsed timestamp
  den.lastUsed = Date.now();
}

// ============================================================================
// DEN INTERACTION FUNCTIONS
// ============================================================================

/**
 * Result of using a den feature.
 */
export interface DenUseResult {
  success: boolean;
  message: string;
}

/**
 * Result of using the training dummy.
 */
export interface TrainingDummyResult {
  success: boolean;
  xpGained: number;
}

/**
 * Result of using the miracle altar.
 */
export interface MiracleAltarResult {
  success: boolean;
  cooldownReduction: number;
}

/**
 * Use the feeding bowl in the den.
 * 
 * @param titan - The Titan using the bowl
 * @param den - The den with the feeding bowl
 * @returns Result of the action
 */
export function useFeedingBowl(titan: TitanPet, den: TitanDen): DenUseResult {
  if (!den.features.feedingBowl) {
    return { success: false, message: 'This den does not have a feeding bowl.' };
  }

  const previousHunger = titan.needs.hunger.current;
  DEN_FEATURE_EFFECTS.feedingBowl.effect(titan);
  const hungerGained = titan.needs.hunger.current - previousHunger;

  return {
    success: true,
    message: `${titan.name} ate from the feeding bowl (+${hungerGained} hunger).`,
  };
}

/**
 * Use the water bowl in the den.
 * 
 * @param titan - The Titan using the bowl
 * @param den - The den with the water bowl
 * @returns Result of the action
 */
export function useWaterBowl(titan: TitanPet, den: TitanDen): DenUseResult {
  if (!den.features.waterBowl) {
    return { success: false, message: 'This den does not have a water bowl.' };
  }

  DEN_FEATURE_EFFECTS.waterBowl.effect(titan);

  return {
    success: true,
    message: `${titan.name} drank from the water bowl. Refreshing!`,
  };
}

/**
 * Use the sleeping area in the den.
 * 
 * @param titan - The Titan using the sleeping area
 * @param den - The den with the sleeping area
 * @returns Result of the action
 */
export function useSleepingArea(titan: TitanPet, den: TitanDen): DenUseResult {
  if (!den.features.sleepingArea) {
    return { success: false, message: 'This den does not have a sleeping area.' };
  }

  const previousEnergy = titan.needs.energy.current;
  DEN_FEATURE_EFFECTS.sleepingArea.effect(titan);
  const energyGained = titan.needs.energy.current - previousEnergy;

  return {
    success: true,
    message: `${titan.name} rested in the sleeping area (+${energyGained} energy).`,
  };
}

/**
 * Use the training dummy in the den.
 * 
 * @param titan - The Titan using the training dummy
 * @param den - The den with the training dummy
 * @returns Result including XP gained
 */
export function useTrainingDummy(titan: TitanPet, den: TitanDen): TrainingDummyResult {
  if (!den.features.trainingDummy) {
    return { success: false, xpGained: 0 };
  }

  // Grant strength XP
  const xpGained = TRAINING_DUMMY_XP;
  
  // Update Titan's strength skill
  titan.skills.strength.experience += xpGained;
  
  // Check for level up (simplified - proper level up handling in TitanSkills)
  const xpThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];
  const currentLevel = titan.skills.strength.level;
  const nextThreshold = xpThresholds[currentLevel] ?? Infinity;
  
  if (titan.skills.strength.experience >= nextThreshold && currentLevel < 10) {
    titan.skills.strength.level++;
  }

  return { success: true, xpGained };
}

/**
 * Use the miracle altar in the den.
 * 
 * @param titan - The Titan using the altar
 * @param den - The den with the miracle altar
 * @param miracle - The miracle to reduce cooldown for
 * @returns Result including cooldown reduction
 */
export function useMiracleAltar(
  titan: TitanPet,
  den: TitanDen,
  miracle: Miracle
): MiracleAltarResult {
  if (!den.features.miracleAltar) {
    return { success: false, cooldownReduction: 0 };
  }

  // Calculate cooldown reduction (20% of base cooldown)
  // The actual cooldown management is handled by MiracleCooldownTracker
  const cooldownReduction = MIRACLE_ALTAR_COOLDOWN_REDUCTION;

  return { success: true, cooldownReduction };
}

/**
 * Check if the memory shrine effect should prevent belief decay.
 * 
 * @param den - The den to check
 * @returns true if belief decay should be prevented
 */
export function shouldPreventBeliefDecay(den: TitanDen): boolean {
  return den.features.memoryShrine;
}

/**
 * Check if the evolution chamber is available.
 * 
 * @param den - The den to check
 * @returns true if species evolution is available
 */
export function hasEvolutionChamber(den: TitanDen): boolean {
  return den.features.evolutionChamber;
}
