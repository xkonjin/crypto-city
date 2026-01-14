import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Skills Progression System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements the skill leveling system for Titan creatures.
 * 
 * Based on NPC learning system but with Titan-specific adaptations:
 * - Species aptitudes that modify XP gain
 * - Skill decay for unused skills
 * - Skill modifiers that affect action success rate
 */

import type { TitanSkill, TitanSpecies, TitanSkillProgression } from "@/games/isocity/types/titan";
import {
  SKILL_LEVEL_THRESHOLDS,
  SPECIES_APTITUDES,
  SKILL_DECAY_RATE,
  TITAN_SKILL_DESCRIPTIONS,
  getSkillAptitude,
  initializeSkillProgressions,
  calculateSkillLevel,
  getXPForNextLevel,
  getXPProgress,
  grantSkillXP,
  getSkillModifier,
  decayUnusedSkills,
  markSkillUsed,
  getSkillSummary,
  getSkillsAboveLevel,
} from "@/lib/titan/TitanSkills";

// ============================================================================
// TEST SUITE: Constants
// ============================================================================

test.describe("TitanSkills Constants", () => {
  test("should have correct XP thresholds for levels 1-10", () => {
    expect(SKILL_LEVEL_THRESHOLDS).toEqual([0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000]);
  });

  test("should have exactly 10 level thresholds", () => {
    expect(SKILL_LEVEL_THRESHOLDS.length).toBe(10);
  });

  test("should have skill decay rate of 0.001 per day", () => {
    expect(SKILL_DECAY_RATE).toBe(0.001);
  });
});

// ============================================================================
// TEST SUITE: Species Aptitudes
// ============================================================================

test.describe("Species Aptitudes", () => {
  test("should have aptitudes defined for all species", () => {
    const species: TitanSpecies[] = ['doge', 'bull', 'bear', 'ape', 'whale', 'phoenix'];
    for (const s of species) {
      expect(SPECIES_APTITUDES[s]).toBeDefined();
    }
  });

  test("doge should have charisma 1.2 and empathy 1.1", () => {
    expect(SPECIES_APTITUDES.doge.charisma).toBe(1.2);
    expect(SPECIES_APTITUDES.doge.empathy).toBe(1.1);
  });

  test("bull should have strength 1.5, endurance 1.3, intimidation 1.2, speed 0.7, intelligence 0.8", () => {
    expect(SPECIES_APTITUDES.bull.strength).toBe(1.5);
    expect(SPECIES_APTITUDES.bull.endurance).toBe(1.3);
    expect(SPECIES_APTITUDES.bull.intimidation).toBe(1.2);
    expect(SPECIES_APTITUDES.bull.speed).toBe(0.7);
    expect(SPECIES_APTITUDES.bull.intelligence).toBe(0.8);
  });

  test("bear should have strength 1.3, endurance 1.5, awareness 1.2, speed 0.8, charisma 0.7", () => {
    expect(SPECIES_APTITUDES.bear.strength).toBe(1.3);
    expect(SPECIES_APTITUDES.bear.endurance).toBe(1.5);
    expect(SPECIES_APTITUDES.bear.awareness).toBe(1.2);
    expect(SPECIES_APTITUDES.bear.speed).toBe(0.8);
    expect(SPECIES_APTITUDES.bear.charisma).toBe(0.7);
  });

  test("ape should have intelligence 1.5, awareness 1.2, memory 1.3, strength 0.9, endurance 0.9", () => {
    expect(SPECIES_APTITUDES.ape.intelligence).toBe(1.5);
    expect(SPECIES_APTITUDES.ape.awareness).toBe(1.2);
    expect(SPECIES_APTITUDES.ape.memory).toBe(1.3);
    expect(SPECIES_APTITUDES.ape.strength).toBe(0.9);
    expect(SPECIES_APTITUDES.ape.endurance).toBe(0.9);
  });

  test("whale should have strength 1.8, endurance 2.0, miracles 1.3, speed 0.5", () => {
    expect(SPECIES_APTITUDES.whale.strength).toBe(1.8);
    expect(SPECIES_APTITUDES.whale.endurance).toBe(2.0);
    expect(SPECIES_APTITUDES.whale.miracles).toBe(1.3);
    expect(SPECIES_APTITUDES.whale.speed).toBe(0.5);
  });

  test("phoenix should have speed 1.5, miracles 1.4, charisma 1.3, endurance 0.7, strength 0.8", () => {
    expect(SPECIES_APTITUDES.phoenix.speed).toBe(1.5);
    expect(SPECIES_APTITUDES.phoenix.miracles).toBe(1.4);
    expect(SPECIES_APTITUDES.phoenix.charisma).toBe(1.3);
    expect(SPECIES_APTITUDES.phoenix.endurance).toBe(0.7);
    expect(SPECIES_APTITUDES.phoenix.strength).toBe(0.8);
  });
});

// ============================================================================
// TEST SUITE: getSkillAptitude
// ============================================================================

test.describe("getSkillAptitude", () => {
  test("should return 1.0 for skills not defined in species aptitudes", () => {
    // Doge has no defined aptitude for strength
    expect(getSkillAptitude('doge', 'strength')).toBe(1.0);
  });

  test("should return the specific aptitude when defined", () => {
    expect(getSkillAptitude('doge', 'charisma')).toBe(1.2);
    expect(getSkillAptitude('bull', 'strength')).toBe(1.5);
    expect(getSkillAptitude('whale', 'speed')).toBe(0.5);
  });

  test("should work for all species", () => {
    const species: TitanSpecies[] = ['doge', 'bull', 'bear', 'ape', 'whale', 'phoenix'];
    for (const s of species) {
      const aptitude = getSkillAptitude(s, 'strength');
      expect(aptitude).toBeGreaterThanOrEqual(0.5);
      expect(aptitude).toBeLessThanOrEqual(2.0);
    }
  });
});

// ============================================================================
// TEST SUITE: Skill Descriptions
// ============================================================================

test.describe("Skill Descriptions", () => {
  test("should have descriptions for all skills", () => {
    const skills: TitanSkill[] = [
      'strength', 'speed', 'endurance',
      'intelligence', 'awareness', 'memory',
      'charisma', 'intimidation', 'empathy',
      'miracles', 'stealth', 'gathering',
    ];
    
    for (const skill of skills) {
      expect(TITAN_SKILL_DESCRIPTIONS[skill]).toBeDefined();
      expect(TITAN_SKILL_DESCRIPTIONS[skill].name).toBeDefined();
      expect(TITAN_SKILL_DESCRIPTIONS[skill].description).toBeDefined();
      expect(TITAN_SKILL_DESCRIPTIONS[skill].affects).toBeDefined();
      expect(Array.isArray(TITAN_SKILL_DESCRIPTIONS[skill].affects)).toBe(true);
    }
  });

  test("strength description should mention attack damage, carrying capacity, throw distance", () => {
    const desc = TITAN_SKILL_DESCRIPTIONS.strength;
    expect(desc.name).toBe('Strength');
    expect(desc.affects).toContain('attack damage');
    expect(desc.affects).toContain('carrying capacity');
    expect(desc.affects).toContain('throw distance');
  });

  test("speed description should mention movement speed, dodge chance, reaction time", () => {
    const desc = TITAN_SKILL_DESCRIPTIONS.speed;
    expect(desc.name).toBe('Speed');
    expect(desc.affects).toContain('movement speed');
    expect(desc.affects).toContain('dodge chance');
    expect(desc.affects).toContain('reaction time');
  });
});

// ============================================================================
// TEST SUITE: initializeSkillProgressions
// ============================================================================

test.describe("initializeSkillProgressions", () => {
  test("should initialize all 12 skills", () => {
    const progressions = initializeSkillProgressions('doge');
    const skills = Object.keys(progressions);
    expect(skills.length).toBe(12);
  });

  test("should initialize all skills at level 1", () => {
    const progressions = initializeSkillProgressions('doge');
    for (const skill of Object.values(progressions)) {
      expect(skill.level).toBe(1);
    }
  });

  test("should initialize all skills with 0 experience", () => {
    const progressions = initializeSkillProgressions('doge');
    for (const skill of Object.values(progressions)) {
      expect(skill.experience).toBe(0);
    }
  });

  test("should set aptitudes based on species", () => {
    const dogeProgressions = initializeSkillProgressions('doge');
    expect(dogeProgressions.charisma.aptitude).toBe(1.2);
    expect(dogeProgressions.empathy.aptitude).toBe(1.1);
    expect(dogeProgressions.strength.aptitude).toBe(1.0); // Default

    const bullProgressions = initializeSkillProgressions('bull');
    expect(bullProgressions.strength.aptitude).toBe(1.5);
    expect(bullProgressions.speed.aptitude).toBe(0.7);
  });

  test("should set lastUsed to current timestamp", () => {
    const beforeTime = Date.now();
    const progressions = initializeSkillProgressions('doge');
    const afterTime = Date.now();

    for (const skill of Object.values(progressions)) {
      expect(skill.lastUsed).toBeGreaterThanOrEqual(beforeTime);
      expect(skill.lastUsed).toBeLessThanOrEqual(afterTime);
    }
  });
});

// ============================================================================
// TEST SUITE: calculateSkillLevel
// ============================================================================

test.describe("calculateSkillLevel", () => {
  test("should return level 1 for 0 XP", () => {
    expect(calculateSkillLevel(0)).toBe(1);
  });

  test("should return level 1 for 99 XP", () => {
    expect(calculateSkillLevel(99)).toBe(1);
  });

  test("should return level 2 for exactly 100 XP", () => {
    expect(calculateSkillLevel(100)).toBe(2);
  });

  test("should return level 2 for 249 XP", () => {
    expect(calculateSkillLevel(249)).toBe(2);
  });

  test("should return level 3 for 250 XP", () => {
    expect(calculateSkillLevel(250)).toBe(3);
  });

  test("should return level 10 for 20000 XP", () => {
    expect(calculateSkillLevel(20000)).toBe(10);
  });

  test("should return level 10 for any XP above 20000", () => {
    expect(calculateSkillLevel(50000)).toBe(10);
    expect(calculateSkillLevel(100000)).toBe(10);
  });

  test("should handle all level boundaries correctly", () => {
    // Level boundaries: [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000]
    expect(calculateSkillLevel(500)).toBe(4);
    expect(calculateSkillLevel(999)).toBe(4);
    expect(calculateSkillLevel(1000)).toBe(5);
    expect(calculateSkillLevel(2000)).toBe(6);
    expect(calculateSkillLevel(4000)).toBe(7);
    expect(calculateSkillLevel(7000)).toBe(8);
    expect(calculateSkillLevel(12000)).toBe(9);
  });
});

// ============================================================================
// TEST SUITE: getXPForNextLevel
// ============================================================================

test.describe("getXPForNextLevel", () => {
  test("should return 100 for level 1 (next level is 2)", () => {
    expect(getXPForNextLevel(1)).toBe(100);
  });

  test("should return 250 for level 2 (next level is 3)", () => {
    expect(getXPForNextLevel(2)).toBe(250);
  });

  test("should return 20000 for level 9 (next level is 10)", () => {
    expect(getXPForNextLevel(9)).toBe(20000);
  });

  test("should return Infinity for level 10 (max level)", () => {
    expect(getXPForNextLevel(10)).toBe(Infinity);
  });
});

// ============================================================================
// TEST SUITE: getXPProgress
// ============================================================================

test.describe("getXPProgress", () => {
  test("should return 0 for level 1 with 0 XP", () => {
    const progression: TitanSkillProgression = {
      skill: 'strength',
      level: 1,
      experience: 0,
      aptitude: 1.0,
      lastUsed: Date.now(),
    };
    expect(getXPProgress(progression)).toBe(0);
  });

  test("should return 50 for level 1 with 50 XP (halfway to level 2)", () => {
    const progression: TitanSkillProgression = {
      skill: 'strength',
      level: 1,
      experience: 50,
      aptitude: 1.0,
      lastUsed: Date.now(),
    };
    expect(getXPProgress(progression)).toBe(50);
  });

  test("should return 100 for level 1 with exactly 100 XP", () => {
    const progression: TitanSkillProgression = {
      skill: 'strength',
      level: 1,
      experience: 100,
      aptitude: 1.0,
      lastUsed: Date.now(),
    };
    // At 100 XP, level should be 2, so we test level 2
    expect(getXPProgress(progression)).toBe(100);
  });

  test("should calculate progress relative to current level threshold", () => {
    // Level 2 is 100-249 XP, level 3 is at 250
    // So at 175 XP, progress is (175-100)/(250-100) = 75/150 = 50%
    const progression: TitanSkillProgression = {
      skill: 'strength',
      level: 2,
      experience: 175,
      aptitude: 1.0,
      lastUsed: Date.now(),
    };
    expect(getXPProgress(progression)).toBe(50);
  });

  test("should return 100 for max level (level 10)", () => {
    const progression: TitanSkillProgression = {
      skill: 'strength',
      level: 10,
      experience: 25000,
      aptitude: 1.0,
      lastUsed: Date.now(),
    };
    expect(getXPProgress(progression)).toBe(100);
  });
});

// ============================================================================
// TEST SUITE: grantSkillXP
// ============================================================================

test.describe("grantSkillXP", () => {
  test("should increase experience for the specified skill", () => {
    const progressions = initializeSkillProgressions('doge');
    const result = grantSkillXP(progressions, 'strength', 50);

    expect(result.progressions.strength.experience).toBe(50);
  });

  test("should apply aptitude modifier to XP gained", () => {
    const progressions = initializeSkillProgressions('doge');
    // Doge has charisma aptitude of 1.2
    const result = grantSkillXP(progressions, 'charisma', 100);

    // 100 * 1.2 = 120 XP
    expect(result.xpGained).toBe(120);
    expect(result.progressions.charisma.experience).toBe(120);
  });

  test("should return leveledUp=true when leveling up", () => {
    const progressions = initializeSkillProgressions('doge');
    const result = grantSkillXP(progressions, 'strength', 100);

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  test("should return leveledUp=false when not leveling up", () => {
    const progressions = initializeSkillProgressions('doge');
    const result = grantSkillXP(progressions, 'strength', 50);

    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(1);
  });

  test("should handle multiple level ups at once", () => {
    const progressions = initializeSkillProgressions('doge');
    // Grant enough XP to go from level 1 to level 4 (500 XP threshold)
    const result = grantSkillXP(progressions, 'strength', 600);

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(4);
    expect(result.progressions.strength.level).toBe(4);
  });

  test("should not exceed level 10", () => {
    const progressions = initializeSkillProgressions('doge');
    const result = grantSkillXP(progressions, 'strength', 100000);

    expect(result.progressions.strength.level).toBe(10);
    expect(result.newLevel).toBe(10);
  });

  test("should update lastUsed timestamp", () => {
    const progressions = initializeSkillProgressions('doge');
    const beforeTime = Date.now();
    
    const result = grantSkillXP(progressions, 'strength', 50);
    
    const afterTime = Date.now();
    expect(result.progressions.strength.lastUsed).toBeGreaterThanOrEqual(beforeTime);
    expect(result.progressions.strength.lastUsed).toBeLessThanOrEqual(afterTime);
  });

  test("should return new progressions object (immutable)", () => {
    const progressions = initializeSkillProgressions('doge');
    const originalStrength = progressions.strength;
    
    const result = grantSkillXP(progressions, 'strength', 50);
    
    expect(result.progressions).not.toBe(progressions);
    expect(result.progressions.strength).not.toBe(originalStrength);
  });

  test("should handle low aptitude (less than 1.0)", () => {
    const progressions = initializeSkillProgressions('bull');
    // Bull has speed aptitude of 0.7
    const result = grantSkillXP(progressions, 'speed', 100);

    // 100 * 0.7 = 70 XP
    expect(result.xpGained).toBe(70);
    expect(result.progressions.speed.experience).toBe(70);
  });
});

// ============================================================================
// TEST SUITE: getSkillModifier
// ============================================================================

test.describe("getSkillModifier", () => {
  test("should return 0.5 for level 1", () => {
    expect(getSkillModifier(1)).toBeCloseTo(0.5, 6);
  });

  test("should return 1.5 for level 10", () => {
    expect(getSkillModifier(10)).toBeCloseTo(1.5, 6);
  });

  test("should return 1.0 for level 5.5 (middle)", () => {
    // Linear interpolation: 0.5 + (5.5-1) * (1.0/9) = 0.5 + 4.5/9 = 0.5 + 0.5 = 1.0
    expect(getSkillModifier(5.5)).toBeCloseTo(1.0, 6);
  });

  test("should scale linearly between levels", () => {
    // Level 1 = 0.5, Level 10 = 1.5
    // Each level adds (1.0 / 9) ≈ 0.111
    const level1 = getSkillModifier(1);
    const level2 = getSkillModifier(2);
    const level3 = getSkillModifier(3);

    const diff1 = level2 - level1;
    const diff2 = level3 - level2;

    expect(diff1).toBeCloseTo(diff2, 6);
  });
});

// ============================================================================
// TEST SUITE: decayUnusedSkills
// ============================================================================

test.describe("decayUnusedSkills", () => {
  test("should not decay skills that are in skillsUsed array", () => {
    const progressions = initializeSkillProgressions('doge');
    // Grant some XP first
    progressions.strength.experience = 500;
    progressions.strength.level = 4;

    const result = decayUnusedSkills(progressions, 10, ['strength']);

    expect(result.strength.experience).toBe(500);
  });

  test("should decay skills that are NOT in skillsUsed array", () => {
    const progressions = initializeSkillProgressions('doge');
    // Grant some XP first
    progressions.strength.experience = 500;
    progressions.strength.level = 4;

    const result = decayUnusedSkills(progressions, 10, ['charisma']); // strength not used

    expect(result.strength.experience).toBeLessThan(500);
  });

  test("should decay XP by 0.1% per day (SKILL_DECAY_RATE = 0.001)", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 1000;
    progressions.strength.level = 5;

    // 1 day passed, 0.1% decay = 1 XP lost
    const result = decayUnusedSkills(progressions, 1, []);

    // 1000 * (1 - 0.001) = 999
    expect(result.strength.experience).toBe(999);
  });

  test("should handle multiple days of decay", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 1000;
    progressions.strength.level = 5;

    // 10 days passed
    const result = decayUnusedSkills(progressions, 10, []);

    // 1000 * (1 - 0.001)^10 ≈ 990.04
    expect(result.strength.experience).toBeCloseTo(990.04, 0);
  });

  test("should not reduce XP below level 1 threshold (0)", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 10;
    progressions.strength.level = 1;

    const result = decayUnusedSkills(progressions, 1000, []);

    expect(result.strength.experience).toBeGreaterThanOrEqual(0);
  });

  test("should not reduce level below 1", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 100;
    progressions.strength.level = 2;

    const result = decayUnusedSkills(progressions, 10000, []);

    expect(result.strength.level).toBeGreaterThanOrEqual(1);
  });

  test("should update level if XP drops below threshold", () => {
    const progressions = initializeSkillProgressions('doge');
    // Level 2 requires 100 XP
    progressions.strength.experience = 105;
    progressions.strength.level = 2;

    // Decay enough to drop below 100 XP
    const result = decayUnusedSkills(progressions, 100, []);

    expect(result.strength.experience).toBeLessThan(100);
    expect(result.strength.level).toBe(1);
  });

  test("should return new progressions object (immutable)", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 500;

    const result = decayUnusedSkills(progressions, 10, []);

    expect(result).not.toBe(progressions);
    expect(result.strength).not.toBe(progressions.strength);
  });

  test("should handle empty skillsUsed array (decay all skills)", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 500;
    progressions.charisma.experience = 500;
    progressions.speed.experience = 500;

    const result = decayUnusedSkills(progressions, 1, []);

    // All skills should decay
    expect(result.strength.experience).toBeLessThan(500);
    expect(result.charisma.experience).toBeLessThan(500);
    expect(result.speed.experience).toBeLessThan(500);
  });
});

// ============================================================================
// TEST SUITE: markSkillUsed
// ============================================================================

test.describe("markSkillUsed", () => {
  test("should update lastUsed timestamp", () => {
    const progressions = initializeSkillProgressions('doge');
    // Set lastUsed to an old timestamp
    progressions.strength.lastUsed = Date.now() - 100000;
    const oldTimestamp = progressions.strength.lastUsed;

    const beforeTime = Date.now();
    const result = markSkillUsed(progressions, 'strength');
    const afterTime = Date.now();

    expect(result.strength.lastUsed).toBeGreaterThan(oldTimestamp);
    expect(result.strength.lastUsed).toBeGreaterThanOrEqual(beforeTime);
    expect(result.strength.lastUsed).toBeLessThanOrEqual(afterTime);
  });

  test("should not modify other skills", () => {
    const progressions = initializeSkillProgressions('doge');
    const charismaLastUsed = progressions.charisma.lastUsed;

    const result = markSkillUsed(progressions, 'strength');

    expect(result.charisma.lastUsed).toBe(charismaLastUsed);
  });

  test("should return new progressions object (immutable)", () => {
    const progressions = initializeSkillProgressions('doge');
    const result = markSkillUsed(progressions, 'strength');

    expect(result).not.toBe(progressions);
    expect(result.strength).not.toBe(progressions.strength);
  });
});

// ============================================================================
// TEST SUITE: getSkillSummary
// ============================================================================

test.describe("getSkillSummary", () => {
  test("should return correct averageLevel", () => {
    const progressions = initializeSkillProgressions('doge');
    // All skills start at level 1
    const summary = getSkillSummary(progressions);

    expect(summary.averageLevel).toBe(1);
  });

  test("should return correct averageLevel with mixed levels", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.level = 5;
    progressions.charisma.level = 3;
    // Other 10 skills are level 1
    // Average = (5 + 3 + 10*1) / 12 = 18/12 = 1.5

    const summary = getSkillSummary(progressions);

    expect(summary.averageLevel).toBeCloseTo(1.5, 6);
  });

  test("should return correct highestSkill", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.level = 7;
    progressions.charisma.level = 3;

    const summary = getSkillSummary(progressions);

    expect(summary.highestSkill.skill).toBe('strength');
    expect(summary.highestSkill.level).toBe(7);
  });

  test("should return correct lowestSkill", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.level = 7;
    progressions.charisma.level = 3;
    // All other skills are level 1, so lowest should be one of them

    const summary = getSkillSummary(progressions);

    expect(summary.lowestSkill.level).toBe(1);
  });

  test("should return correct totalXP", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 500;
    progressions.charisma.experience = 300;
    // Other skills have 0 XP

    const summary = getSkillSummary(progressions);

    expect(summary.totalXP).toBe(800);
  });
});

// ============================================================================
// TEST SUITE: getSkillsAboveLevel
// ============================================================================

test.describe("getSkillsAboveLevel", () => {
  test("should return empty array when no skills are above threshold", () => {
    const progressions = initializeSkillProgressions('doge');
    // All skills at level 1

    const skills = getSkillsAboveLevel(progressions, 5);

    expect(skills.length).toBe(0);
  });

  test("should return skills above the threshold", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.level = 7;
    progressions.charisma.level = 5;
    progressions.speed.level = 3;

    const skills = getSkillsAboveLevel(progressions, 4);

    expect(skills).toContain('strength');
    expect(skills).toContain('charisma');
    expect(skills).not.toContain('speed');
    expect(skills.length).toBe(2);
  });

  test("should not include skills exactly at the threshold", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.level = 5;

    const skills = getSkillsAboveLevel(progressions, 5);

    expect(skills).not.toContain('strength');
  });

  test("should return all skills when threshold is 0", () => {
    const progressions = initializeSkillProgressions('doge');
    // All skills at level 1

    const skills = getSkillsAboveLevel(progressions, 0);

    expect(skills.length).toBe(12);
  });
});

// ============================================================================
// TEST SUITE: Integration Tests
// ============================================================================

test.describe("TitanSkills Integration", () => {
  test("full skill progression workflow", () => {
    // 1. Initialize skills for a species
    let progressions = initializeSkillProgressions('bull');
    expect(progressions.strength.aptitude).toBe(1.5);
    expect(progressions.strength.level).toBe(1);

    // 2. Grant XP with aptitude modifier
    const result = grantSkillXP(progressions, 'strength', 100);
    progressions = result.progressions;
    
    // Bull has 1.5x strength aptitude, so 150 XP
    expect(result.xpGained).toBe(150);
    expect(result.leveledUp).toBe(true);
    expect(progressions.strength.level).toBe(2);

    // 3. Check skill modifier
    const modifier = getSkillModifier(progressions.strength.level);
    expect(modifier).toBeGreaterThan(0.5);

    // 4. Decay unused skills
    progressions.charisma.experience = 200;
    progressions.charisma.level = 2;
    progressions = decayUnusedSkills(progressions, 10, ['strength']);
    
    // Charisma should decay, strength should not
    expect(progressions.charisma.experience).toBeLessThan(200);

    // 5. Get summary
    const summary = getSkillSummary(progressions);
    expect(summary.highestSkill.skill).toBe('strength');
  });

  test("species aptitudes significantly affect progression", () => {
    // Compare whale vs phoenix for strength
    const whaleProgressions = initializeSkillProgressions('whale');
    const phoenixProgressions = initializeSkillProgressions('phoenix');

    // Grant same base XP
    const whaleResult = grantSkillXP(whaleProgressions, 'strength', 100);
    const phoenixResult = grantSkillXP(phoenixProgressions, 'strength', 100);

    // Whale has 1.8x strength, phoenix has 0.8x
    expect(whaleResult.xpGained).toBe(180);
    expect(phoenixResult.xpGained).toBe(80);
  });

  test("skill decay can cause level loss", () => {
    const progressions = initializeSkillProgressions('doge');
    progressions.strength.experience = 105; // Just above level 2 threshold
    progressions.strength.level = 2;

    // Decay for many days
    const decayed = decayUnusedSkills(progressions, 200, []);

    // Should have dropped below 100 XP and lost a level
    expect(decayed.strength.experience).toBeLessThan(100);
    expect(decayed.strength.level).toBe(1);
  });
});
