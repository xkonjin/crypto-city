import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Miracles System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Miracles are special abilities for high-level Titans.
 */

import type { TitanPet, TitanSkill, TitanNeeds } from "@/games/isocity/types/titan";
import {
  // Types
  Miracle,
  ALL_MIRACLES,
  MiracleConfig,
  MIRACLE_CONFIGS,
  MiracleCooldownState,
  MiracleResult,
  MiracleEffect,
  MIRACLE_MESSAGES,
  // Classes
  MiracleCooldownTracker,
  // Functions
  canUseMiracle,
  performMiracle,
  getAvailableMiracles,
  getUnlockedMiracles,
  isMiracleUnlocked,
} from "@/lib/titan/TitanMiracles";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a test Titan with configurable options
 */
function createTestTitan(overrides: Partial<TitanPet> = {}): TitanPet {
  const defaultSkills: Record<TitanSkill, { level: number; experience: number; aptitude: number }> = {
    strength: { level: 1, experience: 0, aptitude: 1.0 },
    speed: { level: 1, experience: 0, aptitude: 1.0 },
    endurance: { level: 1, experience: 0, aptitude: 1.0 },
    intelligence: { level: 1, experience: 0, aptitude: 1.0 },
    awareness: { level: 1, experience: 0, aptitude: 1.0 },
    memory: { level: 1, experience: 0, aptitude: 1.0 },
    charisma: { level: 1, experience: 0, aptitude: 1.0 },
    intimidation: { level: 1, experience: 0, aptitude: 1.0 },
    empathy: { level: 1, experience: 0, aptitude: 1.0 },
    miracles: { level: 1, experience: 0, aptitude: 1.0 },
    stealth: { level: 1, experience: 0, aptitude: 1.0 },
    gathering: { level: 1, experience: 0, aptitude: 1.0 },
  };

  const defaultNeeds: TitanNeeds = {
    hunger: { current: 80, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 1.2 },
    energy: { current: 80, max: 100, decayRate: 0.25, criticalThreshold: 20, weight: 1.0 },
    social: { current: 80, max: 100, decayRate: 0.3, criticalThreshold: 15, weight: 0.8 },
    fun: { current: 80, max: 100, decayRate: 0.35, criticalThreshold: 20, weight: 0.9 },
    wealth: { current: 80, max: 100, decayRate: 0.05, criticalThreshold: 10, weight: 0.6 },
    purpose: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 15, weight: 0.7 },
    attention: { current: 80, max: 100, decayRate: 0.6, criticalThreshold: 25, weight: 1.1 },
    growth: { current: 80, max: 100, decayRate: 0.2, criticalThreshold: 20, weight: 0.85 },
  };

  return {
    id: 'test-titan-1',
    species: 'doge',
    name: 'TestTitan',
    age: 10,
    alignment: 0,
    currentAppearance: 'neutral',
    gridX: 5,
    gridY: 5,
    direction: 'south',
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: 'idle',
    needs: { ...defaultNeeds },
    mood: {
      currentMood: 'neutral',
      moodIntensity: 0.5,
      thoughts: [],
      beliefs: [],
      desires: [],
      beliefsAboutPlayer: { trust: 0.5, fear: 0.0, affection: 0.5 },
    },
    bdi: {
      beliefs: {
        worldKnowledge: new Map(),
        actionBeliefs: new Map(),
        npcOpinions: new Map(),
        playerRelationship: { trust: 0.5, fear: 0.0, affection: 0.5 },
      },
      desires: [],
      intentions: null,
    },
    skills: { ...defaultSkills },
    personality: {
      bigFive: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 },
      cryptoPersonality: { riskTolerance: 0.5, fomo: 0.5, diamondHands: 0.5, alphaHunter: 0.5, degenLevel: 0.5 },
      quirks: [],
    },
    actionHistory: [],
    relationships: {},
    ...overrides,
  } as TitanPet;
}

// ============================================================================
// Test Suite: Miracle Type
// ============================================================================

test.describe("Miracle Type", () => {
  test("ALL_MIRACLES should contain all 8 miracle types", () => {
    expect(ALL_MIRACLES).toHaveLength(8);
    expect(ALL_MIRACLES).toContain('heal');
    expect(ALL_MIRACLES).toContain('bless');
    expect(ALL_MIRACLES).toContain('shield');
    expect(ALL_MIRACLES).toContain('curse');
    expect(ALL_MIRACLES).toContain('storm');
    expect(ALL_MIRACLES).toContain('fire');
    expect(ALL_MIRACLES).toContain('growth');
    expect(ALL_MIRACLES).toContain('food');
  });

  test("ALL_MIRACLES should be a typed array of Miracle", () => {
    const miracles: Miracle[] = ALL_MIRACLES;
    expect(miracles).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Miracle Configurations
// ============================================================================

test.describe("MIRACLE_CONFIGS", () => {
  test("should have configuration for all miracles", () => {
    for (const miracle of ALL_MIRACLES) {
      expect(MIRACLE_CONFIGS[miracle]).toBeDefined();
    }
  });

  test.describe("heal miracle config", () => {
    test("should have correct name and description", () => {
      expect(MIRACLE_CONFIGS.heal.name).toBe('Healing Touch');
      expect(MIRACLE_CONFIGS.heal.description).toContain('health');
    });

    test("should require good/neutral alignment (max: 0)", () => {
      expect(MIRACLE_CONFIGS.heal.alignmentRequired.max).toBe(0);
      expect(MIRACLE_CONFIGS.heal.alignmentRequired.min).toBeUndefined();
    });

    test("should require empathy skill level 5", () => {
      expect(MIRACLE_CONFIGS.heal.skillRequired.skill).toBe('empathy');
      expect(MIRACLE_CONFIGS.heal.skillRequired.level).toBe(5);
    });

    test("should have 60 second cooldown", () => {
      expect(MIRACLE_CONFIGS.heal.cooldown).toBe(60000);
    });

    test("should cost 20 energy", () => {
      expect(MIRACLE_CONFIGS.heal.energyCost).toBe(20);
    });

    test("should shift alignment toward good (-0.05)", () => {
      expect(MIRACLE_CONFIGS.heal.alignmentImpact).toBe(-0.05);
    });
  });

  test.describe("bless miracle config", () => {
    test("should require good alignment (max: -0.3)", () => {
      expect(MIRACLE_CONFIGS.bless.alignmentRequired.max).toBe(-0.3);
    });

    test("should require charisma skill level 7", () => {
      expect(MIRACLE_CONFIGS.bless.skillRequired.skill).toBe('charisma');
      expect(MIRACLE_CONFIGS.bless.skillRequired.level).toBe(7);
    });

    test("should have 5 minute duration", () => {
      expect(MIRACLE_CONFIGS.bless.duration).toBe(300000);
    });
  });

  test.describe("shield miracle config", () => {
    test("should require good/neutral alignment", () => {
      expect(MIRACLE_CONFIGS.shield.alignmentRequired.max).toBe(0);
    });

    test("should require miracles skill level 6", () => {
      expect(MIRACLE_CONFIGS.shield.skillRequired.skill).toBe('miracles');
      expect(MIRACLE_CONFIGS.shield.skillRequired.level).toBe(6);
    });

    test("should have radius of 5 tiles", () => {
      expect(MIRACLE_CONFIGS.shield.radius).toBe(5);
    });

    test("should have 10 minute duration", () => {
      expect(MIRACLE_CONFIGS.shield.duration).toBe(600000);
    });
  });

  test.describe("curse miracle config", () => {
    test("should require evil/neutral alignment (min: 0)", () => {
      expect(MIRACLE_CONFIGS.curse.alignmentRequired.min).toBe(0);
      expect(MIRACLE_CONFIGS.curse.alignmentRequired.max).toBeUndefined();
    });

    test("should require intimidation skill level 5", () => {
      expect(MIRACLE_CONFIGS.curse.skillRequired.skill).toBe('intimidation');
      expect(MIRACLE_CONFIGS.curse.skillRequired.level).toBe(5);
    });

    test("should shift alignment toward evil (+0.05)", () => {
      expect(MIRACLE_CONFIGS.curse.alignmentImpact).toBe(0.05);
    });
  });

  test.describe("storm miracle config", () => {
    test("should require evil alignment (min: 0.3)", () => {
      expect(MIRACLE_CONFIGS.storm.alignmentRequired.min).toBe(0.3);
    });

    test("should require miracles skill level 8", () => {
      expect(MIRACLE_CONFIGS.storm.skillRequired.skill).toBe('miracles');
      expect(MIRACLE_CONFIGS.storm.skillRequired.level).toBe(8);
    });

    test("should have radius of 3 tiles", () => {
      expect(MIRACLE_CONFIGS.storm.radius).toBe(3);
    });

    test("should shift alignment significantly toward evil (+0.1)", () => {
      expect(MIRACLE_CONFIGS.storm.alignmentImpact).toBe(0.1);
    });
  });

  test.describe("fire miracle config", () => {
    test("should require demonic alignment (min: 0.5)", () => {
      expect(MIRACLE_CONFIGS.fire.alignmentRequired.min).toBe(0.5);
    });

    test("should require miracles skill level 7", () => {
      expect(MIRACLE_CONFIGS.fire.skillRequired.skill).toBe('miracles');
      expect(MIRACLE_CONFIGS.fire.skillRequired.level).toBe(7);
    });

    test("should have radius of 2 tiles", () => {
      expect(MIRACLE_CONFIGS.fire.radius).toBe(2);
    });

    test("should have strongest alignment impact (+0.15)", () => {
      expect(MIRACLE_CONFIGS.fire.alignmentImpact).toBe(0.15);
    });
  });

  test.describe("growth miracle config", () => {
    test("should have no alignment requirement (any alignment)", () => {
      expect(MIRACLE_CONFIGS.growth.alignmentRequired.min).toBeUndefined();
      expect(MIRACLE_CONFIGS.growth.alignmentRequired.max).toBeUndefined();
    });

    test("should require gathering skill level 6", () => {
      expect(MIRACLE_CONFIGS.growth.skillRequired.skill).toBe('gathering');
      expect(MIRACLE_CONFIGS.growth.skillRequired.level).toBe(6);
    });

    test("should have no alignment impact", () => {
      expect(MIRACLE_CONFIGS.growth.alignmentImpact).toBe(0);
    });

    test("should have radius of 4 tiles", () => {
      expect(MIRACLE_CONFIGS.growth.radius).toBe(4);
    });
  });

  test.describe("food miracle config", () => {
    test("should have no alignment requirement", () => {
      expect(MIRACLE_CONFIGS.food.alignmentRequired.min).toBeUndefined();
      expect(MIRACLE_CONFIGS.food.alignmentRequired.max).toBeUndefined();
    });

    test("should require gathering skill level 5", () => {
      expect(MIRACLE_CONFIGS.food.skillRequired.skill).toBe('gathering');
      expect(MIRACLE_CONFIGS.food.skillRequired.level).toBe(5);
    });

    test("should have no alignment impact", () => {
      expect(MIRACLE_CONFIGS.food.alignmentImpact).toBe(0);
    });
  });

  test("all configs should have required base properties", () => {
    for (const miracle of ALL_MIRACLES) {
      const config = MIRACLE_CONFIGS[miracle];
      expect(config.name).toBeDefined();
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.description).toBeDefined();
      expect(config.description.length).toBeGreaterThan(0);
      expect(config.alignmentRequired).toBeDefined();
      expect(config.skillRequired).toBeDefined();
      expect(config.skillRequired.skill).toBeDefined();
      expect(config.skillRequired.level).toBeGreaterThanOrEqual(1);
      expect(config.skillRequired.level).toBeLessThanOrEqual(10);
      expect(config.cooldown).toBeGreaterThan(0);
      expect(config.energyCost).toBeGreaterThan(0);
      expect(typeof config.alignmentImpact).toBe('number');
    }
  });
});

// ============================================================================
// Test Suite: MiracleCooldownTracker
// ============================================================================

test.describe("MiracleCooldownTracker", () => {
  test.describe("constructor", () => {
    test("should create empty tracker by default", () => {
      const tracker = new MiracleCooldownTracker();
      
      for (const miracle of ALL_MIRACLES) {
        expect(tracker.isReady(miracle)).toBe(true);
        expect(tracker.getCooldownRemaining(miracle)).toBe(0);
      }
    });

    test("should accept initial state", () => {
      const now = Date.now();
      const initialState: Record<Miracle, number> = {
        heal: now - 30000, // 30 seconds ago
        bless: 0,
        shield: 0,
        curse: 0,
        storm: 0,
        fire: 0,
        growth: 0,
        food: 0,
      };
      
      const tracker = new MiracleCooldownTracker(initialState);
      
      // Heal was used 30s ago, cooldown is 60s, so 30s remaining
      const healRemaining = tracker.getCooldownRemaining('heal');
      expect(healRemaining).toBeGreaterThan(0);
      expect(healRemaining).toBeLessThanOrEqual(30000);
    });
  });

  test.describe("useMiracle", () => {
    test("should record miracle use timestamp", () => {
      const tracker = new MiracleCooldownTracker();
      
      expect(tracker.isReady('heal')).toBe(true);
      
      tracker.useMiracle('heal');
      
      expect(tracker.isReady('heal')).toBe(false);
    });

    test("should put miracle on cooldown", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      
      const remaining = tracker.getCooldownRemaining('heal');
      // Should be close to full cooldown (60000ms for heal)
      expect(remaining).toBeGreaterThan(59000);
      expect(remaining).toBeLessThanOrEqual(60000);
    });
  });

  test.describe("getCooldownRemaining", () => {
    test("should return 0 for ready miracles", () => {
      const tracker = new MiracleCooldownTracker();
      
      expect(tracker.getCooldownRemaining('heal')).toBe(0);
      expect(tracker.getCooldownRemaining('storm')).toBe(0);
    });

    test("should return remaining time for cooling miracles", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      
      const remaining = tracker.getCooldownRemaining('heal');
      expect(remaining).toBeGreaterThan(0);
    });

    test("should never return negative values", () => {
      // Create a tracker with a very old timestamp
      const veryOld = Date.now() - 1000000; // Over 16 minutes ago
      const initialState: Record<Miracle, number> = {
        heal: veryOld,
        bless: 0,
        shield: 0,
        curse: 0,
        storm: 0,
        fire: 0,
        growth: 0,
        food: 0,
      };
      
      const tracker = new MiracleCooldownTracker(initialState);
      
      expect(tracker.getCooldownRemaining('heal')).toBe(0);
    });
  });

  test.describe("isReady", () => {
    test("should return true for never-used miracles", () => {
      const tracker = new MiracleCooldownTracker();
      
      for (const miracle of ALL_MIRACLES) {
        expect(tracker.isReady(miracle)).toBe(true);
      }
    });

    test("should return false immediately after use", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('curse');
      
      expect(tracker.isReady('curse')).toBe(false);
    });

    test("should not affect other miracles", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      
      expect(tracker.isReady('heal')).toBe(false);
      expect(tracker.isReady('bless')).toBe(true);
      expect(tracker.isReady('shield')).toBe(true);
    });
  });

  test.describe("update", () => {
    test("should reduce cooldown over time", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      const initialRemaining = tracker.getCooldownRemaining('heal');
      
      // Simulate 30 seconds passing
      tracker.update(30000);
      
      const afterRemaining = tracker.getCooldownRemaining('heal');
      expect(afterRemaining).toBeLessThan(initialRemaining);
    });

    test("should make miracle ready after cooldown expires", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      expect(tracker.isReady('heal')).toBe(false);
      
      // Simulate full cooldown passing (60 seconds for heal)
      tracker.update(60000);
      
      expect(tracker.isReady('heal')).toBe(true);
    });
  });

  test.describe("getAllStates", () => {
    test("should return array of cooldown states", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      tracker.useMiracle('curse');
      
      const states = tracker.getAllStates();
      
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBe(ALL_MIRACLES.length);
      
      const healState = states.find(s => s.miracle === 'heal');
      expect(healState).toBeDefined();
      expect(healState!.cooldownRemaining).toBeGreaterThan(0);
      
      const blessState = states.find(s => s.miracle === 'bless');
      expect(blessState).toBeDefined();
      expect(blessState!.cooldownRemaining).toBe(0);
    });
  });

  test.describe("serialization", () => {
    test("toRecord should return serializable state", () => {
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      tracker.useMiracle('storm');
      
      const record = tracker.toRecord();
      
      expect(typeof record).toBe('object');
      expect(record.heal).toBeGreaterThan(0);
      expect(record.storm).toBeGreaterThan(0);
      expect(record.bless).toBe(0);
    });

    test("fromRecord should restore state", () => {
      const now = Date.now();
      const record: Record<Miracle, number> = {
        heal: now - 30000,
        bless: now - 60000,
        shield: 0,
        curse: now,
        storm: 0,
        fire: 0,
        growth: 0,
        food: 0,
      };
      
      const tracker = MiracleCooldownTracker.fromRecord(record);
      
      expect(tracker.isReady('shield')).toBe(true);
      expect(tracker.getCooldownRemaining('curse')).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Test Suite: canUseMiracle
// ============================================================================

test.describe("canUseMiracle", () => {
  test.describe("alignment requirements", () => {
    test("should allow heal for good alignment Titan", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(true);
    });

    test("should reject heal for evil alignment Titan", () => {
      const titan = createTestTitan({ alignment: 0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('alignment');
    });

    test("should allow curse for evil alignment Titan", () => {
      const titan = createTestTitan({ alignment: 0.5 });
      titan.skills.intimidation.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'curse', tracker);
      
      expect(result.canUse).toBe(true);
    });

    test("should reject curse for good alignment Titan", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.intimidation.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'curse', tracker);
      
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('alignment');
    });

    test("should allow storm only for very evil Titans (min 0.3)", () => {
      const titan = createTestTitan({ alignment: 0.4 });
      titan.skills.miracles.level = 8;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'storm', tracker);
      
      expect(result.canUse).toBe(true);
    });

    test("should reject storm for moderately evil Titan", () => {
      const titan = createTestTitan({ alignment: 0.2 });
      titan.skills.miracles.level = 8;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'storm', tracker);
      
      expect(result.canUse).toBe(false);
    });

    test("should allow growth for any alignment", () => {
      const goodTitan = createTestTitan({ alignment: -0.8 });
      goodTitan.skills.gathering.level = 6;
      const evilTitan = createTestTitan({ alignment: 0.8 });
      evilTitan.skills.gathering.level = 6;
      const neutralTitan = createTestTitan({ alignment: 0 });
      neutralTitan.skills.gathering.level = 6;
      const tracker = new MiracleCooldownTracker();
      
      expect(canUseMiracle(goodTitan, 'growth', tracker).canUse).toBe(true);
      expect(canUseMiracle(evilTitan, 'growth', tracker).canUse).toBe(true);
      expect(canUseMiracle(neutralTitan, 'growth', tracker).canUse).toBe(true);
    });
  });

  test.describe("skill requirements", () => {
    test("should reject if skill level too low", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 4; // Heal requires 5
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('level');
    });

    test("should allow if skill level exactly meets requirement", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(true);
    });

    test("should allow if skill level exceeds requirement", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 10;
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(true);
    });
  });

  test.describe("cooldown requirements", () => {
    test("should reject if miracle is on cooldown", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('cooldown');
    });

    test("should allow after cooldown expires", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      tracker.useMiracle('heal');
      tracker.update(60000); // Wait full cooldown
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(true);
    });
  });

  test.describe("energy requirements", () => {
    test("should reject if not enough energy", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      titan.needs.energy.current = 10; // Heal costs 20
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('energy');
    });

    test("should allow if exactly enough energy", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      titan.needs.energy.current = 20; // Heal costs 20
      const tracker = new MiracleCooldownTracker();
      
      const result = canUseMiracle(titan, 'heal', tracker);
      
      expect(result.canUse).toBe(true);
    });
  });
});

// ============================================================================
// Test Suite: useMiracle
// ============================================================================

test.describe("useMiracle", () => {
  test.describe("successful miracle cast", () => {
    test("should return success for valid cast", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(result.success).toBe(true);
      expect(result.miracle).toBe('heal');
    });

    test("should deduct energy cost", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      titan.needs.energy.current = 80;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(result.energyUsed).toBe(20);
      expect(titan.needs.energy.current).toBe(60);
    });

    test("should apply alignment impact", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(result.alignmentChange).toBe(-0.05);
      expect(titan.alignment).toBe(-0.55);
    });

    test("should put miracle on cooldown", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(tracker.isReady('heal')).toBe(false);
    });

    test("should return appropriate effects for heal", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(result.effects.length).toBeGreaterThan(0);
      const healEffect = result.effects.find((effect: MiracleEffect) => effect.type === 'heal');
      expect(healEffect).toBeDefined();
      expect(healEffect!.target).toBe('npc-123');
    });

    test("should return appropriate effects for damage miracles", () => {
      const titan = createTestTitan({ alignment: 0.6 });
      titan.skills.miracles.level = 8;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'storm', { x: 10, y: 10 }, tracker);
      
      expect(result.effects.length).toBeGreaterThan(0);
      const damageEffect = result.effects.find((effect: MiracleEffect) => effect.type === 'damage');
      expect(damageEffect).toBeDefined();
    });

    test("should accept position target", () => {
      const titan = createTestTitan({ alignment: 0 });
      titan.skills.gathering.level = 6;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'growth', { x: 5, y: 5 }, tracker);
      
      expect(result.success).toBe(true);
    });

    test("should include success message", () => {
      const titan = createTestTitan({ alignment: -0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  test.describe("failed miracle cast", () => {
    test("should fail if requirements not met", () => {
      const titan = createTestTitan({ alignment: 0.5 }); // Evil, can't heal
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      const result = performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(result.success).toBe(false);
      expect(result.energyUsed).toBe(0);
      expect(result.alignmentChange).toBe(0);
      expect(result.effects).toHaveLength(0);
    });

    test("should not modify Titan state on failure", () => {
      const titan = createTestTitan({ alignment: 0.5 });
      titan.skills.empathy.level = 5;
      titan.needs.energy.current = 80;
      const originalAlignment = titan.alignment;
      const originalEnergy = titan.needs.energy.current;
      const tracker = new MiracleCooldownTracker();
      
      performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(titan.alignment).toBe(originalAlignment);
      expect(titan.needs.energy.current).toBe(originalEnergy);
    });

    test("should not put miracle on cooldown on failure", () => {
      const titan = createTestTitan({ alignment: 0.5 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(tracker.isReady('heal')).toBe(true);
    });
  });

  test.describe("alignment boundary behavior", () => {
    test("should clamp alignment at -1.0", () => {
      const titan = createTestTitan({ alignment: -0.98 });
      titan.skills.empathy.level = 5;
      const tracker = new MiracleCooldownTracker();
      
      performMiracle(titan, 'heal', 'npc-123', tracker);
      
      expect(titan.alignment).toBeGreaterThanOrEqual(-1.0);
    });

    test("should clamp alignment at +1.0", () => {
      const titan = createTestTitan({ alignment: 0.95 });
      titan.skills.miracles.level = 7;
      const tracker = new MiracleCooldownTracker();
      
      performMiracle(titan, 'fire', { x: 5, y: 5 }, tracker);
      
      expect(titan.alignment).toBeLessThanOrEqual(1.0);
    });
  });
});

// ============================================================================
// Test Suite: Miracle Discovery Functions
// ============================================================================

test.describe("getAvailableMiracles", () => {
  test("should return miracles Titan can potentially learn based on alignment", () => {
    const goodTitan = createTestTitan({ alignment: -0.5 });
    
    const available = getAvailableMiracles(goodTitan);
    
    // Good titans should see good miracles available
    expect(available).toContain('heal');
    expect(available).toContain('bless');
    expect(available).toContain('shield');
    // Should not see evil-only miracles
    expect(available).not.toContain('storm');
    expect(available).not.toContain('fire');
    // Should see neutral miracles
    expect(available).toContain('growth');
    expect(available).toContain('food');
  });

  test("should return evil miracles for evil Titan", () => {
    const evilTitan = createTestTitan({ alignment: 0.6 });
    
    const available = getAvailableMiracles(evilTitan);
    
    expect(available).toContain('curse');
    expect(available).toContain('storm');
    expect(available).toContain('fire');
    expect(available).not.toContain('heal');
    expect(available).not.toContain('bless');
  });

  test("should return all miracles for extreme alignments", () => {
    const demonicTitan = createTestTitan({ alignment: 1.0 });
    
    const available = getAvailableMiracles(demonicTitan);
    
    expect(available).toContain('fire');
  });
});

test.describe("getUnlockedMiracles", () => {
  test("should return only miracles with sufficient skill", () => {
    const titan = createTestTitan({ alignment: -0.5 });
    titan.skills.empathy.level = 5;
    titan.skills.charisma.level = 3; // Not enough for bless (needs 7)
    titan.skills.miracles.level = 2; // Not enough for shield (needs 6)
    
    const unlocked = getUnlockedMiracles(titan);
    
    expect(unlocked).toContain('heal');
    expect(unlocked).not.toContain('bless');
    expect(unlocked).not.toContain('shield');
  });

  test("should respect both alignment and skill requirements", () => {
    const evilTitan = createTestTitan({ alignment: 0.5 });
    evilTitan.skills.empathy.level = 5; // Has skill but wrong alignment
    
    const unlocked = getUnlockedMiracles(evilTitan);
    
    expect(unlocked).not.toContain('heal');
  });

  test("should return empty array for low-level Titan", () => {
    const titan = createTestTitan();
    // All skills at level 1, nothing unlocked
    
    const unlocked = getUnlockedMiracles(titan);
    
    expect(unlocked).toHaveLength(0);
  });
});

test.describe("isMiracleUnlocked", () => {
  test("should return true for unlocked miracle", () => {
    const titan = createTestTitan({ alignment: -0.5 });
    titan.skills.empathy.level = 5;
    
    expect(isMiracleUnlocked(titan, 'heal')).toBe(true);
  });

  test("should return false for locked miracle due to skill", () => {
    const titan = createTestTitan({ alignment: -0.5 });
    titan.skills.empathy.level = 4;
    
    expect(isMiracleUnlocked(titan, 'heal')).toBe(false);
  });

  test("should return false for locked miracle due to alignment", () => {
    const titan = createTestTitan({ alignment: 0.5 });
    titan.skills.empathy.level = 5;
    
    expect(isMiracleUnlocked(titan, 'heal')).toBe(false);
  });
});

// ============================================================================
// Test Suite: MIRACLE_MESSAGES
// ============================================================================

test.describe("MIRACLE_MESSAGES", () => {
  test("should have messages for all miracles", () => {
    for (const miracle of ALL_MIRACLES) {
      expect(MIRACLE_MESSAGES[miracle]).toBeDefined();
    }
  });

  test("should have cast, success, and failure messages for each", () => {
    for (const miracle of ALL_MIRACLES) {
      const messages = MIRACLE_MESSAGES[miracle];
      expect(messages.cast).toBeDefined();
      expect(messages.cast.length).toBeGreaterThan(0);
      expect(messages.success).toBeDefined();
      expect(messages.success.length).toBeGreaterThan(0);
      expect(messages.failure).toBeDefined();
      expect(messages.failure.length).toBeGreaterThan(0);
    }
  });

  test("cast messages should contain placeholder", () => {
    for (const miracle of ALL_MIRACLES) {
      const hasTitanPlaceholder = MIRACLE_MESSAGES[miracle].cast.some(
        msg => msg.includes('{titanName}')
      );
      expect(hasTitanPlaceholder).toBe(true);
    }
  });
});
