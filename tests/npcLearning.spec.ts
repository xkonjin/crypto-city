import { test, expect } from "@playwright/test";

/**
 * NPC Learning System Tests (#119, #120)
 * 
 * TDD Phase 1: Tests for the NPC learning system including:
 * - Skill types and progression
 * - XP thresholds and level calculations
 * - LearningManager class
 * - Social learning from observed behaviors
 * - Action preferences
 */

// Import types and classes directly for unit testing
import type {
  Skill,
  SkillProgression,
  ObservedBehavior,
  NPCLearning,
} from "@/lib/npc/learning";
import {
  ALL_SKILLS,
  LEVEL_THRESHOLDS,
  XP_GAINS,
  LEARNING_DESCRIPTIONS,
  createDefaultLearning,
  createDefaultSkillProgression,
  calculateLevel,
  getSkillModifier,
} from "@/lib/npc/learning";
import { LearningManager } from "@/lib/npc/LearningManager";

/**
 * Test Suite: Learning Types
 */
test.describe("Learning Types", () => {
  test("should define all 8 skills", async () => {
    expect(ALL_SKILLS.length).toBe(8);
    expect(ALL_SKILLS).toContain('trading');
    expect(ALL_SKILLS).toContain('coding');
    expect(ALL_SKILLS).toContain('combat');
    expect(ALL_SKILLS).toContain('social');
    expect(ALL_SKILLS).toContain('mining');
    expect(ALL_SKILLS).toContain('leadership');
    expect(ALL_SKILLS).toContain('persuasion');
    expect(ALL_SKILLS).toContain('analysis');
  });

  test("should define 10 level thresholds", async () => {
    expect(LEVEL_THRESHOLDS.length).toBe(10);
    expect(LEVEL_THRESHOLDS[0]).toBe(0);
    expect(LEVEL_THRESHOLDS[1]).toBe(100);
    expect(LEVEL_THRESHOLDS[2]).toBe(250);
    expect(LEVEL_THRESHOLDS[3]).toBe(500);
    expect(LEVEL_THRESHOLDS[4]).toBe(1000);
    expect(LEVEL_THRESHOLDS[5]).toBe(2000);
    expect(LEVEL_THRESHOLDS[6]).toBe(4000);
    expect(LEVEL_THRESHOLDS[7]).toBe(7000);
    expect(LEVEL_THRESHOLDS[8]).toBe(12000);
    expect(LEVEL_THRESHOLDS[9]).toBe(20000);
  });

  test("should define XP gains for activities", async () => {
    expect(XP_GAINS['successful_trade']).toEqual({ skill: 'trading', amount: 20 });
    expect(XP_GAINS['failed_trade']).toEqual({ skill: 'trading', amount: 5 });
    expect(XP_GAINS['write_code']).toEqual({ skill: 'coding', amount: 15 });
    expect(XP_GAINS['deploy_contract']).toEqual({ skill: 'coding', amount: 50 });
    expect(XP_GAINS['win_fight']).toEqual({ skill: 'combat', amount: 30 });
    expect(XP_GAINS['lose_fight']).toEqual({ skill: 'combat', amount: 10 });
    expect(XP_GAINS['successful_conversation']).toEqual({ skill: 'social', amount: 10 });
    expect(XP_GAINS['mine_block']).toEqual({ skill: 'mining', amount: 15 });
    expect(XP_GAINS['lead_meeting']).toEqual({ skill: 'leadership', amount: 25 });
    expect(XP_GAINS['convince_someone']).toEqual({ skill: 'persuasion', amount: 20 });
    expect(XP_GAINS['analyze_market']).toEqual({ skill: 'analysis', amount: 15 });
  });

  test("createDefaultSkillProgression should create progression at level 1", async () => {
    const progression = createDefaultSkillProgression('trading');
    
    expect(progression.skill).toBe('trading');
    expect(progression.level).toBe(1);
    expect(progression.experience).toBe(0);
    expect(typeof progression.lastPracticed).toBe('number');
  });

  test("createDefaultLearning should create full learning object", async () => {
    const learning = createDefaultLearning();
    
    expect(learning.skills).toBeDefined();
    expect(learning.observedBehaviors).toEqual([]);
    expect(learning.actionPreferences).toEqual({});
    
    // All skills should be initialized
    for (const skill of ALL_SKILLS) {
      expect(learning.skills[skill]).toBeDefined();
      expect(learning.skills[skill].level).toBe(1);
      expect(learning.skills[skill].experience).toBe(0);
    }
  });
});

/**
 * Test Suite: Level Calculation
 */
test.describe("Level Calculation", () => {
  test("calculateLevel should return 1 for 0 experience", async () => {
    expect(calculateLevel(0)).toBe(1);
  });

  test("calculateLevel should return correct level for exact thresholds", async () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(250)).toBe(3);
    expect(calculateLevel(500)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
    expect(calculateLevel(2000)).toBe(6);
    expect(calculateLevel(4000)).toBe(7);
    expect(calculateLevel(7000)).toBe(8);
    expect(calculateLevel(12000)).toBe(9);
    expect(calculateLevel(20000)).toBe(10);
  });

  test("calculateLevel should return correct level for intermediate experience", async () => {
    expect(calculateLevel(50)).toBe(1);  // Between 0 and 100
    expect(calculateLevel(150)).toBe(2); // Between 100 and 250
    expect(calculateLevel(3000)).toBe(6); // Between 2000 and 4000
    expect(calculateLevel(15000)).toBe(9); // Between 12000 and 20000
    expect(calculateLevel(99999)).toBe(10); // Beyond max threshold
  });

  test("getSkillModifier should return value between 0.5 and 1.5", async () => {
    for (let level = 1; level <= 10; level++) {
      const mod = getSkillModifier(level);
      expect(mod).toBeGreaterThanOrEqual(0.5);
      expect(mod).toBeLessThanOrEqual(1.5);
    }
  });

  test("getSkillModifier should scale linearly from 0.5 to 1.5", async () => {
    expect(getSkillModifier(1)).toBeCloseTo(0.5, 2);  // Min at level 1
    expect(getSkillModifier(5)).toBeCloseTo(0.944, 2);  // Mid-ish
    expect(getSkillModifier(10)).toBeCloseTo(1.5, 2);  // Max at level 10
  });
});

/**
 * Test Suite: Learning Descriptions
 */
test.describe("Learning Descriptions", () => {
  test("should have descriptions for all skills", async () => {
    for (const skill of ALL_SKILLS) {
      expect(LEARNING_DESCRIPTIONS[skill]).toBeDefined();
      expect(typeof LEARNING_DESCRIPTIONS[skill]).toBe('string');
      expect(LEARNING_DESCRIPTIONS[skill].length).toBeGreaterThan(0);
    }
  });

  test("should have special descriptions for levelUp and socialLearning", async () => {
    expect(LEARNING_DESCRIPTIONS['levelUp']).toBeDefined();
    expect(LEARNING_DESCRIPTIONS['socialLearning']).toBeDefined();
  });

  test("descriptions should match specifications", async () => {
    expect(LEARNING_DESCRIPTIONS['trading']).toBe("The art of predicting randomness. Results may vary wildly.");
    expect(LEARNING_DESCRIPTIONS['coding']).toBe("Speaking to machines in their native tongue. They rarely appreciate it.");
    expect(LEARNING_DESCRIPTIONS['mining']).toBe("Turning electricity into magic internet money. Environmentalists hate this one trick.");
    expect(LEARNING_DESCRIPTIONS['levelUp']).toBe("Achievement unlocked: Marginally better at something. Progress!");
    expect(LEARNING_DESCRIPTIONS['socialLearning']).toBe("Copying successful people. The original proof-of-stake.");
  });
});

/**
 * Test Suite: LearningManager - Skill Progression
 */
test.describe("LearningManager - Skill Progression", () => {
  // Helper to create a mock NPC with learning
  function createMockNPC() {
    return {
      id: 'test-npc',
      name: 'Test NPC',
      learning: createDefaultLearning(),
      relationships: {} as Record<string, { respect: number }>,
    };
  }

  test("gainExperience should add XP for valid activity", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    const result = manager.gainExperience(npc, 'successful_trade');
    
    expect(result.skill).toBe('trading');
    expect(npc.learning.skills.trading.experience).toBe(20);
    expect(result.leveled).toBe(false);
  });

  test("gainExperience should trigger level up when threshold reached", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    // Set XP just below threshold
    npc.learning.skills.trading.experience = 95;
    
    const result = manager.gainExperience(npc, 'successful_trade');
    
    expect(result.leveled).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(npc.learning.skills.trading.level).toBe(2);
  });

  test("gainExperience should update lastPracticed", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    const beforeTime = Date.now();
    
    manager.gainExperience(npc, 'write_code');
    
    expect(npc.learning.skills.coding.lastPracticed).toBeGreaterThanOrEqual(beforeTime);
  });

  test("gainExperience should return no change for unknown activity", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    const result = manager.gainExperience(npc, 'unknown_activity');
    
    expect(result.leveled).toBe(false);
    expect(result.skill).toBeUndefined();
  });

  test("getSkillLevel should return current level for skill", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    expect(manager.getSkillLevel(npc, 'trading')).toBe(1);
    
    npc.learning.skills.trading.level = 5;
    expect(manager.getSkillLevel(npc, 'trading')).toBe(5);
  });

  test("getSkillModifier should return modifier based on level", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    // Level 1 should have low modifier
    const lowMod = manager.getSkillModifier(npc, 'trading');
    expect(lowMod).toBeCloseTo(0.5, 2);
    
    // Level 10 should have high modifier
    npc.learning.skills.trading.level = 10;
    const highMod = manager.getSkillModifier(npc, 'trading');
    expect(highMod).toBeCloseTo(1.5, 2);
  });
});

/**
 * Test Suite: LearningManager - Skill Decay
 */
test.describe("LearningManager - Skill Decay", () => {
  function createMockNPC() {
    return {
      id: 'test-npc',
      name: 'Test NPC',
      learning: createDefaultLearning(),
      relationships: {} as Record<string, { respect: number }>,
    };
  }

  test("decayUnusedSkills should reduce XP for skills not practiced", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    // Give trading some XP above the level threshold and set lastPracticed to old time
    // Level 4 threshold is 500, so we need XP above that to see decay
    npc.learning.skills.trading.experience = 800;
    npc.learning.skills.trading.level = 4;
    npc.learning.skills.trading.lastPracticed = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    
    manager.decayUnusedSkills(npc, 30);
    
    // Should have lost some XP (but not below level 4 threshold of 500)
    expect(npc.learning.skills.trading.experience).toBeLessThan(800);
    expect(npc.learning.skills.trading.experience).toBeGreaterThanOrEqual(500);
  });

  test("decayUnusedSkills should not reduce XP below level threshold", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    npc.learning.skills.trading.experience = 110; // Just above level 2
    npc.learning.skills.trading.level = 2;
    npc.learning.skills.trading.lastPracticed = Date.now() - 100 * 24 * 60 * 60 * 1000;
    
    manager.decayUnusedSkills(npc, 100);
    
    // Should not drop below level 2 threshold (100 XP)
    expect(npc.learning.skills.trading.experience).toBeGreaterThanOrEqual(100);
    expect(npc.learning.skills.trading.level).toBe(2);
  });

  test("decayUnusedSkills should not affect recently practiced skills", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    npc.learning.skills.trading.experience = 500;
    npc.learning.skills.trading.lastPracticed = Date.now(); // Just practiced
    
    manager.decayUnusedSkills(npc, 30);
    
    // Should not have lost any XP
    expect(npc.learning.skills.trading.experience).toBe(500);
  });
});

/**
 * Test Suite: LearningManager - Social Learning
 */
test.describe("LearningManager - Social Learning", () => {
  function createMockNPC(id: string = 'npc-1') {
    return {
      id,
      name: `NPC ${id}`,
      learning: createDefaultLearning(),
      relationships: {} as Record<string, { respect: number; trust: number }>,
    };
  }

  test("observeBehavior should record behavior from respected NPCs", async () => {
    const manager = new LearningManager();
    const observer = createMockNPC('observer');
    const actor = createMockNPC('actor');
    
    // Set up respect relationship
    observer.relationships[actor.id] = { respect: 50, trust: 50 };
    
    manager.observeBehavior(observer, actor, 'trade_crypto', 'success');
    
    expect(observer.learning.observedBehaviors.length).toBe(1);
    expect(observer.learning.observedBehaviors[0].actorId).toBe(actor.id);
    expect(observer.learning.observedBehaviors[0].action).toBe('trade_crypto');
    expect(observer.learning.observedBehaviors[0].outcome).toBe('success');
  });

  test("observeBehavior should not record behavior from disrespected NPCs", async () => {
    const manager = new LearningManager();
    const observer = createMockNPC('observer');
    const actor = createMockNPC('actor');
    
    // Low respect relationship
    observer.relationships[actor.id] = { respect: 20, trust: 50 };
    
    manager.observeBehavior(observer, actor, 'trade_crypto', 'success');
    
    expect(observer.learning.observedBehaviors.length).toBe(0);
  });

  test("observeBehavior should not record behavior from strangers", async () => {
    const manager = new LearningManager();
    const observer = createMockNPC('observer');
    const actor = createMockNPC('actor');
    
    // No relationship
    manager.observeBehavior(observer, actor, 'trade_crypto', 'success');
    
    expect(observer.learning.observedBehaviors.length).toBe(0);
  });

  test("observeBehavior should limit stored observations to 50", async () => {
    const manager = new LearningManager();
    const observer = createMockNPC('observer');
    const actor = createMockNPC('actor');
    
    observer.relationships[actor.id] = { respect: 50, trust: 50 };
    
    // Add 60 observations
    for (let i = 0; i < 60; i++) {
      manager.observeBehavior(observer, actor, `action_${i}`, 'success');
    }
    
    expect(observer.learning.observedBehaviors.length).toBe(50);
    // First observations should be removed (FIFO)
    expect(observer.learning.observedBehaviors[0].action).toBe('action_10');
  });

  test("learnFromObservations should update action preferences", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    // Add observations with varying outcomes
    npc.learning.observedBehaviors = [
      { actorId: 'a', action: 'trade_crypto', outcome: 'success', observedAt: Date.now() },
      { actorId: 'a', action: 'trade_crypto', outcome: 'success', observedAt: Date.now() },
      { actorId: 'a', action: 'trade_crypto', outcome: 'failure', observedAt: Date.now() },
      { actorId: 'a', action: 'mine_block', outcome: 'success', observedAt: Date.now() },
    ];
    
    manager.learnFromObservations(npc);
    
    // trade_crypto: 2/3 success = 0.667 rate, blended with default 0.5
    // Result: 0.5 * 0.7 + 0.667 * 0.3 = 0.35 + 0.2 ≈ 0.55
    expect(npc.learning.actionPreferences['trade_crypto']).toBeGreaterThan(0.5);
    
    // mine_block: 1/1 success = 1.0 rate, blended with default 0.5
    // Result: 0.5 * 0.7 + 1.0 * 0.3 = 0.35 + 0.3 = 0.65
    expect(npc.learning.actionPreferences['mine_block']).toBeGreaterThan(0.6);
  });
});

/**
 * Test Suite: LearningManager - Action Preferences
 */
test.describe("LearningManager - Action Preferences", () => {
  function createMockNPC() {
    return {
      id: 'test-npc',
      name: 'Test NPC',
      learning: createDefaultLearning(),
      relationships: {} as Record<string, { respect: number }>,
    };
  }

  test("updateActionPreference should increase preference on success", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    // Set initial preference
    npc.learning.actionPreferences['trade_crypto'] = 0.5;
    
    manager.updateActionPreference(npc, 'trade_crypto', 'success');
    
    expect(npc.learning.actionPreferences['trade_crypto']).toBeGreaterThan(0.5);
  });

  test("updateActionPreference should decrease preference on failure", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    npc.learning.actionPreferences['trade_crypto'] = 0.5;
    
    manager.updateActionPreference(npc, 'trade_crypto', 'failure');
    
    expect(npc.learning.actionPreferences['trade_crypto']).toBeLessThan(0.5);
  });

  test("updateActionPreference should create preference if not exists", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    expect(npc.learning.actionPreferences['new_action']).toBeUndefined();
    
    manager.updateActionPreference(npc, 'new_action', 'success');
    
    expect(npc.learning.actionPreferences['new_action']).toBeDefined();
    expect(npc.learning.actionPreferences['new_action']).toBeGreaterThan(0.5);
  });

  test("getActionPreference should return stored preference", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    npc.learning.actionPreferences['trade_crypto'] = 0.8;
    
    expect(manager.getActionPreference(npc, 'trade_crypto')).toBe(0.8);
  });

  test("getActionPreference should return default 0.5 if not stored", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    expect(manager.getActionPreference(npc, 'unknown_action')).toBe(0.5);
  });

  test("action preferences should be bounded between 0 and 1", async () => {
    const manager = new LearningManager();
    const npc = createMockNPC();
    
    // Try to push preference beyond bounds
    npc.learning.actionPreferences['trade_crypto'] = 0.99;
    for (let i = 0; i < 100; i++) {
      manager.updateActionPreference(npc, 'trade_crypto', 'success');
    }
    expect(npc.learning.actionPreferences['trade_crypto']).toBeLessThanOrEqual(1);
    
    npc.learning.actionPreferences['bad_action'] = 0.01;
    for (let i = 0; i < 100; i++) {
      manager.updateActionPreference(npc, 'bad_action', 'failure');
    }
    expect(npc.learning.actionPreferences['bad_action']).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Suite: Integration with CryptoNPC
 */
test.describe("Integration", () => {
  test("NPCLearning should integrate with CryptoNPC type", async () => {
    // This test verifies that the learning type can be used with CryptoNPC
    const learning = createDefaultLearning();
    
    expect(learning.skills).toBeDefined();
    expect(learning.observedBehaviors).toBeDefined();
    expect(learning.actionPreferences).toBeDefined();
    
    // All skills should exist
    expect(Object.keys(learning.skills).length).toBe(8);
  });
});
