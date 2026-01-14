import { test, expect } from "@playwright/test";

/**
 * Tests for Titan-NPC Interaction System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * These tests validate the Titan-NPC interaction system as specified in
 * specs/HERO_PET_SYSTEM.md Section 6.
 * 
 * The TitanInteractions module:
 * - Defines interaction types (greet, help, play, protect, steal, scare, attack, heal, teach, learn_from, comfort, intimidate)
 * - Calculates alignment impact per interaction
 * - Manages relationship effects (trust, respect, familiarity, fear)
 * - Handles XP rewards for skills
 * - Processes interaction success/failure with multiple factors
 */

import type { TitanPet, TitanSkill } from "@/games/isocity/types/titan";
import type { CryptoNPC } from "@/games/isocity/types/npc";

// Import from TitanInteractions (these imports will fail until implementation)
import {
  // Types
  type TitanInteractionType,
  type TitanInteractionEffect,
  type TitanInteractionRequest,
  type TitanInteractionResult,
  // Constants
  ALL_TITAN_INTERACTIONS,
  TITAN_INTERACTION_ALIGNMENT,
  TITAN_INTERACTION_EFFECTS,
  INTERACTION_XP_REWARDS,
  INTERACTION_MESSAGES,
  // Functions
  canInteract,
  calculateInteractionSuccess,
  processInteraction,
  applyInteractionEffects,
  selectInteractionType,
} from "@/lib/titan/TitanInteractions";

import { TitanManager } from "@/lib/titan";

// ============================================================================
// HELPER FUNCTIONS FOR TESTING
// ============================================================================

/**
 * Create a minimal mock Titan for testing
 */
function createMockTitan(overrides: Partial<TitanPet> = {}): TitanPet {
  return {
    id: "titan-test-1",
    species: "doge",
    name: "TestTitan",
    age: 1,
    alignment: 0,
    currentAppearance: "neutral",
    gridX: 10,
    gridY: 10,
    direction: "south",
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: null,
    needs: {
      hunger: { current: 75, max: 100, decayRate: 0.5, criticalThreshold: 20, weight: 1.2 },
      energy: { current: 80, max: 100, decayRate: 0.3, criticalThreshold: 15, weight: 1.1 },
      social: { current: 60, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.9 },
      fun: { current: 70, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 0.8 },
      wealth: { current: 50, max: 100, decayRate: 0.1, criticalThreshold: 30, weight: 1.0 },
      purpose: { current: 65, max: 100, decayRate: 0.15, criticalThreshold: 25, weight: 0.9 },
      attention: { current: 40, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 1.0 },
      growth: { current: 55, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.8 },
    },
    mood: {
      currentMood: "neutral",
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
    skills: {
      strength: { skill: 'strength', level: 5, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      speed: { skill: 'speed', level: 3, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      endurance: { skill: 'endurance', level: 4, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      intelligence: { skill: 'intelligence', level: 5, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      awareness: { skill: 'awareness', level: 3, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      memory: { skill: 'memory', level: 4, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      charisma: { skill: 'charisma', level: 5, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      intimidation: { skill: 'intimidation', level: 3, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      empathy: { skill: 'empathy', level: 6, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      miracles: { skill: 'miracles', level: 2, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      stealth: { skill: 'stealth', level: 4, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      gathering: { skill: 'gathering', level: 3, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
    },
    personality: {
      bigFive: {
        openness: 0.6,
        conscientiousness: 0.5,
        extraversion: 0.7,
        agreeableness: 0.6,
        neuroticism: 0.4,
      },
      crypto: {
        riskTolerance: 0.5,
        fomo: 0.5,
        trustInInstitutions: 0.5,
        technicalKnowledge: 0.5,
        degenLevel: 0.5,
      },
    },
    actionHistory: [],
    relationships: {},
    ...overrides,
  } as TitanPet;
}

/**
 * Create a minimal mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: "npc-test-1",
    name: "TestNPC",
    walletAddress: "0x123",
    age: 30,
    occupation: "trader",
    residence: null,
    workplace: null,
    spriteType: "apple",
    direction: "south",
    gridX: 11,
    gridY: 10,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: null,
    needs: {
      hunger: { current: 75, max: 100, decayRate: 0.5, criticalThreshold: 20, weight: 1.2 },
      energy: { current: 80, max: 100, decayRate: 0.3, criticalThreshold: 15, weight: 1.1 },
      social: { current: 60, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.9 },
      fun: { current: 70, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 0.8 },
      wealth: { current: 50, max: 100, decayRate: 0.1, criticalThreshold: 30, weight: 1.0 },
      purpose: { current: 65, max: 100, decayRate: 0.15, criticalThreshold: 25, weight: 0.9 },
    },
    memory: {
      episodic: [],
      semantic: [],
      procedural: [],
      working: { recentContext: [], currentGoal: null },
    },
    movement: {
      state: "idle",
      path: null,
      currentPathIndex: 0,
      targetPosition: null,
      speed: 1,
      interpolation: { progress: 0, startX: 11, startY: 10, endX: 11, endY: 10 },
    },
    personality: {
      bigFive: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      crypto: {
        riskTolerance: 0.5,
        fomo: 0.5,
        trustInInstitutions: 0.5,
        technicalKnowledge: 0.5,
        degenLevel: 0.5,
      },
    },
    relationships: {},
    ...overrides,
  } as CryptoNPC;
}

// ============================================================================
// TEST SUITES
// ============================================================================

/**
 * Test Suite: Interaction Type Constants
 */
test.describe("TitanInteractionType Constants", () => {
  test("ALL_TITAN_INTERACTIONS should contain all 12 interaction types", () => {
    expect(ALL_TITAN_INTERACTIONS).toHaveLength(12);
    expect(ALL_TITAN_INTERACTIONS).toContain("greet");
    expect(ALL_TITAN_INTERACTIONS).toContain("help");
    expect(ALL_TITAN_INTERACTIONS).toContain("play");
    expect(ALL_TITAN_INTERACTIONS).toContain("protect");
    expect(ALL_TITAN_INTERACTIONS).toContain("steal");
    expect(ALL_TITAN_INTERACTIONS).toContain("scare");
    expect(ALL_TITAN_INTERACTIONS).toContain("attack");
    expect(ALL_TITAN_INTERACTIONS).toContain("heal");
    expect(ALL_TITAN_INTERACTIONS).toContain("teach");
    expect(ALL_TITAN_INTERACTIONS).toContain("learn_from");
    expect(ALL_TITAN_INTERACTIONS).toContain("comfort");
    expect(ALL_TITAN_INTERACTIONS).toContain("intimidate");
  });
});

/**
 * Test Suite: Alignment Impact Constants
 */
test.describe("TITAN_INTERACTION_ALIGNMENT", () => {
  test("should have alignment impact for all interaction types", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      expect(TITAN_INTERACTION_ALIGNMENT[type]).toBeDefined();
      expect(typeof TITAN_INTERACTION_ALIGNMENT[type]).toBe("number");
    }
  });

  test("greet should be neutral (0)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.greet).toBe(0);
  });

  test("help should be good (negative alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.help).toBe(-0.05);
  });

  test("protect should be very good (negative alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.protect).toBe(-0.1);
  });

  test("steal should be evil (positive alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.steal).toBe(0.08);
  });

  test("scare should be evil (positive alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.scare).toBe(0.05);
  });

  test("attack should be very evil (positive alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.attack).toBe(0.15);
  });

  test("heal should be very good (negative alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.heal).toBe(-0.1);
  });

  test("teach should be good (negative alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.teach).toBe(-0.05);
  });

  test("learn_from should be neutral (0)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.learn_from).toBe(0);
  });

  test("comfort should be good (negative alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.comfort).toBe(-0.04);
  });

  test("intimidate should be evil (positive alignment)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.intimidate).toBe(0.07);
  });

  test("play should be neutral (0)", () => {
    expect(TITAN_INTERACTION_ALIGNMENT.play).toBe(0);
  });
});

/**
 * Test Suite: Interaction Effects Constants
 */
test.describe("TITAN_INTERACTION_EFFECTS", () => {
  test("should have effects for all interaction types", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      expect(TITAN_INTERACTION_EFFECTS[type]).toBeDefined();
      expect(TITAN_INTERACTION_EFFECTS[type].success).toBeDefined();
      expect(TITAN_INTERACTION_EFFECTS[type].failure).toBeDefined();
    }
  });

  test("greet success should increase familiarity most", () => {
    const effect = TITAN_INTERACTION_EFFECTS.greet.success;
    expect(effect.familiarity[0]).toBeGreaterThanOrEqual(2);
    expect(effect.familiarity[1]).toBeGreaterThanOrEqual(3);
    // Fear should not increase on greet
    expect(effect.fear[0]).toBe(0);
    expect(effect.fear[1]).toBe(0);
  });

  test("help success should increase trust significantly", () => {
    const effect = TITAN_INTERACTION_EFFECTS.help.success;
    expect(effect.trust[0]).toBeGreaterThanOrEqual(5);
    expect(effect.trust[1]).toBeGreaterThanOrEqual(10);
    // Fear should decrease on help
    expect(effect.fear[0]).toBeLessThan(0);
  });

  test("attack success should increase fear dramatically", () => {
    const effect = TITAN_INTERACTION_EFFECTS.attack.success;
    expect(effect.fear[0]).toBeGreaterThan(10);
    expect(effect.fear[1]).toBeGreaterThan(20);
    // Trust should decrease significantly
    expect(effect.trust[0]).toBeLessThan(-10);
  });

  test("steal should increase fear and decrease trust", () => {
    const effect = TITAN_INTERACTION_EFFECTS.steal.success;
    expect(effect.fear[0]).toBeGreaterThan(0);
    expect(effect.trust[0]).toBeLessThan(0);
  });

  test("scare should increase fear significantly", () => {
    const effect = TITAN_INTERACTION_EFFECTS.scare.success;
    expect(effect.fear[0]).toBeGreaterThan(5);
    expect(effect.fear[1]).toBeGreaterThan(10);
  });

  test("comfort should increase trust and decrease fear", () => {
    const effect = TITAN_INTERACTION_EFFECTS.comfort.success;
    expect(effect.trust[0]).toBeGreaterThan(0);
    expect(effect.fear[0]).toBeLessThanOrEqual(0);
  });

  test("protect success should greatly increase trust and respect", () => {
    const effect = TITAN_INTERACTION_EFFECTS.protect.success;
    expect(effect.trust[0]).toBeGreaterThanOrEqual(8);
    expect(effect.respect[0]).toBeGreaterThanOrEqual(5);
    expect(effect.fear[0]).toBeLessThan(0);
  });

  test("all effects should have fear property (titan-specific)", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      const successEffect = TITAN_INTERACTION_EFFECTS[type].success;
      const failureEffect = TITAN_INTERACTION_EFFECTS[type].failure;
      
      expect(successEffect.fear).toBeDefined();
      expect(Array.isArray(successEffect.fear)).toBe(true);
      expect(successEffect.fear).toHaveLength(2);
      
      expect(failureEffect.fear).toBeDefined();
      expect(Array.isArray(failureEffect.fear)).toBe(true);
      expect(failureEffect.fear).toHaveLength(2);
    }
  });
});

/**
 * Test Suite: XP Rewards Constants
 */
test.describe("INTERACTION_XP_REWARDS", () => {
  test("should have XP rewards for all interaction types", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      expect(INTERACTION_XP_REWARDS[type]).toBeDefined();
      expect(INTERACTION_XP_REWARDS[type].skill).toBeDefined();
      expect(typeof INTERACTION_XP_REWARDS[type].success).toBe("number");
      expect(typeof INTERACTION_XP_REWARDS[type].failure).toBe("number");
    }
  });

  test("greet should reward charisma skill", () => {
    expect(INTERACTION_XP_REWARDS.greet.skill).toBe("charisma");
  });

  test("help should reward empathy skill", () => {
    expect(INTERACTION_XP_REWARDS.help.skill).toBe("empathy");
  });

  test("protect should reward strength skill", () => {
    expect(INTERACTION_XP_REWARDS.protect.skill).toBe("strength");
  });

  test("steal should reward stealth skill", () => {
    expect(INTERACTION_XP_REWARDS.steal.skill).toBe("stealth");
  });

  test("attack should reward strength skill", () => {
    expect(INTERACTION_XP_REWARDS.attack.skill).toBe("strength");
  });

  test("heal should reward empathy skill", () => {
    expect(INTERACTION_XP_REWARDS.heal.skill).toBe("empathy");
  });

  test("success XP should be greater than failure XP", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      expect(INTERACTION_XP_REWARDS[type].success).toBeGreaterThan(
        INTERACTION_XP_REWARDS[type].failure
      );
    }
  });

  test("combat actions (protect, attack) should give more XP", () => {
    expect(INTERACTION_XP_REWARDS.protect.success).toBeGreaterThanOrEqual(15);
    expect(INTERACTION_XP_REWARDS.attack.success).toBeGreaterThanOrEqual(15);
  });
});

/**
 * Test Suite: Interaction Messages Constants
 */
test.describe("INTERACTION_MESSAGES", () => {
  test("should have messages for all interaction types", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      expect(INTERACTION_MESSAGES[type]).toBeDefined();
      expect(INTERACTION_MESSAGES[type].success).toBeDefined();
      expect(INTERACTION_MESSAGES[type].failure).toBeDefined();
      expect(Array.isArray(INTERACTION_MESSAGES[type].success)).toBe(true);
      expect(Array.isArray(INTERACTION_MESSAGES[type].failure)).toBe(true);
    }
  });

  test("help messages should contain placeholder tokens", () => {
    const helpMessages = INTERACTION_MESSAGES.help;
    expect(helpMessages.success.length).toBeGreaterThan(0);
    
    // At least one message should have titanName and npcName placeholders
    const hasPlaceholders = helpMessages.success.some(
      (msg) => msg.includes("{titanName}") && msg.includes("{npcName}")
    );
    expect(hasPlaceholders).toBe(true);
  });

  test("attack messages should contain placeholder tokens", () => {
    const attackMessages = INTERACTION_MESSAGES.attack;
    expect(attackMessages.success.length).toBeGreaterThan(0);
    
    const hasPlaceholders = attackMessages.success.some(
      (msg) => msg.includes("{titanName}") || msg.includes("{npcName}")
    );
    expect(hasPlaceholders).toBe(true);
  });

  test("each type should have at least 2 success and 2 failure messages", () => {
    for (const type of ALL_TITAN_INTERACTIONS) {
      expect(INTERACTION_MESSAGES[type].success.length).toBeGreaterThanOrEqual(2);
      expect(INTERACTION_MESSAGES[type].failure.length).toBeGreaterThanOrEqual(2);
    }
  });
});

/**
 * Test Suite: canInteract Function
 */
test.describe("canInteract", () => {
  test("should return true for valid interaction within range", () => {
    const titan = createMockTitan({ gridX: 10, gridY: 10 });
    const npc = createMockNPC({ gridX: 11, gridY: 10 }); // Adjacent

    const result = canInteract(titan, npc, "greet");
    expect(result.canInteract).toBe(true);
  });

  test("should return false when NPC is too far away", () => {
    const titan = createMockTitan({ gridX: 10, gridY: 10 });
    const npc = createMockNPC({ gridX: 50, gridY: 50 }); // Far away

    const result = canInteract(titan, npc, "greet");
    expect(result.canInteract).toBe(false);
    expect(result.reason).toBeDefined();
  });

  test("should return false when Titan is inside building and NPC is outside", () => {
    const titan = createMockTitan({ 
      gridX: 10, 
      gridY: 10, 
      isInsideBuilding: true, 
      currentBuildingId: "building-1" 
    });
    const npc = createMockNPC({ gridX: 11, gridY: 10, isInsideBuilding: false });

    const result = canInteract(titan, npc, "help");
    expect(result.canInteract).toBe(false);
    expect(result.reason).toContain("building");
  });

  test("should return true when both are in same building", () => {
    const titan = createMockTitan({ 
      gridX: 10, 
      gridY: 10, 
      isInsideBuilding: true, 
      currentBuildingId: "building-1" 
    });
    const npc = createMockNPC({ 
      gridX: 11, 
      gridY: 10, 
      isInsideBuilding: true, 
      currentBuildingId: "building-1" 
    });

    const result = canInteract(titan, npc, "help");
    expect(result.canInteract).toBe(true);
  });

  test("should check for specific interaction requirements", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();

    // heal should require NPC to have low health (we'll mock this by checking behavior)
    // For now, basic greet should always work if in range
    const result = canInteract(titan, npc, "greet");
    expect(result.canInteract).toBe(true);
  });
});

/**
 * Test Suite: calculateInteractionSuccess Function
 */
test.describe("calculateInteractionSuccess", () => {
  test("should return a probability between 0 and 1", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();

    const probability = calculateInteractionSuccess(titan, npc, "greet");
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });

  test("higher charisma should increase social interaction success", () => {
    const lowCharismaTitan = createMockTitan({ 
      skills: {
        ...createMockTitan().skills,
        charisma: { skill: 'charisma', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      }
    });
    const highCharismaTitan = createMockTitan({
      skills: {
        ...createMockTitan().skills,
        charisma: { skill: 'charisma', level: 10, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      }
    });
    const npc = createMockNPC();

    const lowSuccess = calculateInteractionSuccess(lowCharismaTitan, npc, "greet");
    const highSuccess = calculateInteractionSuccess(highCharismaTitan, npc, "greet");

    expect(highSuccess).toBeGreaterThan(lowSuccess);
  });

  test("higher empathy should increase help interaction success", () => {
    const lowEmpathyTitan = createMockTitan({
      skills: {
        ...createMockTitan().skills,
        empathy: { skill: 'empathy', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      }
    });
    const highEmpathyTitan = createMockTitan({
      skills: {
        ...createMockTitan().skills,
        empathy: { skill: 'empathy', level: 10, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      }
    });
    const npc = createMockNPC();

    const lowSuccess = calculateInteractionSuccess(lowEmpathyTitan, npc, "help");
    const highSuccess = calculateInteractionSuccess(highEmpathyTitan, npc, "help");

    expect(highSuccess).toBeGreaterThan(lowSuccess);
  });

  test("good alignment should increase help success", () => {
    const goodTitan = createMockTitan({ alignment: -0.5 });
    const evilTitan = createMockTitan({ alignment: 0.5 });
    const npc = createMockNPC();

    const goodSuccess = calculateInteractionSuccess(goodTitan, npc, "help");
    const evilSuccess = calculateInteractionSuccess(evilTitan, npc, "help");

    expect(goodSuccess).toBeGreaterThan(evilSuccess);
  });

  test("evil alignment should increase attack success", () => {
    const goodTitan = createMockTitan({ alignment: -0.5 });
    const evilTitan = createMockTitan({ alignment: 0.5 });
    const npc = createMockNPC();

    const goodSuccess = calculateInteractionSuccess(goodTitan, npc, "attack");
    const evilSuccess = calculateInteractionSuccess(evilTitan, npc, "attack");

    expect(evilSuccess).toBeGreaterThan(goodSuccess);
  });

  test("higher trust relationship should increase success", () => {
    // Use lower skill levels so trust difference is measurable
    const lowSkillBase = {
      ...createMockTitan().skills,
      empathy: { skill: 'empathy' as const, level: 2, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
    };
    const titanWithTrust = createMockTitan({
      skills: lowSkillBase,
      relationships: {
        "npc-test-1": {
          npcId: "npc-test-1",
          trust: 80,
          respect: 50,
          familiarity: 50,
          fear: 0,
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 5,
        },
      },
    });
    const titanNoTrust = createMockTitan({
      skills: lowSkillBase,
      relationships: {
        "npc-test-1": {
          npcId: "npc-test-1",
          trust: 0,
          respect: 0,
          familiarity: 10,
          fear: 0,
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 1,
        },
      },
    });
    const npc = createMockNPC({ id: "npc-test-1" });

    const trustSuccess = calculateInteractionSuccess(titanWithTrust, npc, "help");
    const noTrustSuccess = calculateInteractionSuccess(titanNoTrust, npc, "help");

    expect(trustSuccess).toBeGreaterThan(noTrustSuccess);
  });
});

/**
 * Test Suite: processInteraction Function
 */
test.describe("processInteraction", () => {
  test("should return a TitanInteractionResult", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    const request: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "greet",
    };

    const result = processInteraction(request, titan, npc);

    expect(result).toBeDefined();
    expect(result.type).toBe("greet");
    expect(result.titanId).toBe(titan.id);
    expect(result.npcId).toBe(npc.id);
    expect(typeof result.success).toBe("boolean");
  });

  test("should calculate alignment change based on interaction type", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    
    const helpRequest: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "help",
    };

    const result = processInteraction(helpRequest, titan, npc);
    
    // Help should shift alignment toward good (negative)
    expect(result.alignmentChange).toBeLessThan(0);
  });

  test("should calculate alignment change for evil actions", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    
    const attackRequest: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "attack",
    };

    const result = processInteraction(attackRequest, titan, npc);
    
    // Attack should shift alignment toward evil (positive)
    expect(result.alignmentChange).toBeGreaterThan(0);
  });

  test("should return relationship changes on success", () => {
    const titan = createMockTitan({ 
      skills: { ...createMockTitan().skills, charisma: { skill: 'charisma', level: 10, experience: 0, aptitude: 1.0, lastUsed: Date.now() } } 
    });
    const npc = createMockNPC();
    
    // Run multiple times to get at least one success
    let successResult: TitanInteractionResult | null = null;
    for (let i = 0; i < 20 && !successResult; i++) {
      const request: TitanInteractionRequest = {
        titanId: titan.id,
        npcId: npc.id,
        type: "greet",
      };
      const result = processInteraction(request, titan, npc);
      if (result.success) {
        successResult = result;
      }
    }

    expect(successResult).not.toBeNull();
    expect(successResult!.relationshipChanges).toBeDefined();
    expect(typeof successResult!.relationshipChanges.trust).toBe("number");
    expect(typeof successResult!.relationshipChanges.familiarity).toBe("number");
  });

  test("should return XP rewards", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    const request: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "greet",
    };

    const result = processInteraction(request, titan, npc);

    expect(result.titanXP).toBeDefined();
    expect(Array.isArray(result.titanXP)).toBe(true);
    expect(result.titanXP.length).toBeGreaterThan(0);
    expect(result.titanXP[0].skill).toBe("charisma"); // greet rewards charisma
    expect(result.titanXP[0].amount).toBeGreaterThan(0);
  });

  test("should return mood effects", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    const request: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "help",
    };

    const result = processInteraction(request, titan, npc);

    expect(typeof result.npcMoodEffect).toBe("number");
    expect(typeof result.titanMoodEffect).toBe("number");
  });

  test("should return a message", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    const request: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "help",
    };

    const result = processInteraction(request, titan, npc);

    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
  });

  test("message should have titan and NPC names substituted", () => {
    const titan = createMockTitan({ name: "SuperDoge" });
    const npc = createMockNPC({ name: "CryptoTrader" });
    const request: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "help",
    };

    const result = processInteraction(request, titan, npc);

    // Message should contain the actual names, not placeholders
    expect(result.message).not.toContain("{titanName}");
    expect(result.message).not.toContain("{npcName}");
  });

  test("should support optional context in request", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    const request: TitanInteractionRequest = {
      titanId: titan.id,
      npcId: npc.id,
      type: "help",
      context: "carrying boxes",
    };

    const result = processInteraction(request, titan, npc);

    expect(result).toBeDefined();
  });
});

/**
 * Test Suite: applyInteractionEffects Function
 */
test.describe("applyInteractionEffects", () => {
  test("should update Titan alignment", () => {
    const titan = createMockTitan({ alignment: 0 });
    const npc = createMockNPC();
    const result: TitanInteractionResult = {
      success: true,
      type: "help",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: -0.05,
      relationshipChanges: { trust: 5, familiarity: 5 },
      titanXP: [{ skill: "empathy", amount: 15 }],
      npcMoodEffect: 0.2,
      titanMoodEffect: 0.1,
      message: "Test message",
    };

    const initialAlignment = titan.alignment;
    applyInteractionEffects(result, titan, npc);

    expect(titan.alignment).toBe(initialAlignment + result.alignmentChange);
  });

  test("should clamp alignment to valid range [-1, 1]", () => {
    const titan = createMockTitan({ alignment: -0.98 });
    const npc = createMockNPC();
    const result: TitanInteractionResult = {
      success: true,
      type: "heal",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: -0.1, // Would go to -1.08
      relationshipChanges: { trust: 5 },
      titanXP: [{ skill: "empathy", amount: 15 }],
      npcMoodEffect: 0.2,
      titanMoodEffect: 0.1,
      message: "Test message",
    };

    applyInteractionEffects(result, titan, npc);

    expect(titan.alignment).toBeGreaterThanOrEqual(-1);
    expect(titan.alignment).toBeLessThanOrEqual(1);
  });

  test("should update Titan relationship with NPC", () => {
    const titan = createMockTitan({
      relationships: {
        "npc-test-1": {
          npcId: "npc-test-1",
          trust: 20,
          respect: 0,
          familiarity: 10,
          fear: 0,
          firstMet: Date.now(),
          lastInteraction: 0,
          interactionCount: 1,
        },
      },
    });
    const npc = createMockNPC({ id: "npc-test-1" });
    const result: TitanInteractionResult = {
      success: true,
      type: "help",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: -0.05,
      relationshipChanges: { trust: 10, familiarity: 5, respect: 3, fear: -2 },
      titanXP: [{ skill: "empathy", amount: 15 }],
      npcMoodEffect: 0.2,
      titanMoodEffect: 0.1,
      message: "Test message",
    };

    applyInteractionEffects(result, titan, npc);

    expect(titan.relationships["npc-test-1"].trust).toBe(30);
    expect(titan.relationships["npc-test-1"].familiarity).toBe(15);
  });

  test("should create relationship if it does not exist", () => {
    const titan = createMockTitan({ relationships: {} });
    const npc = createMockNPC({ id: "new-npc" });
    const result: TitanInteractionResult = {
      success: true,
      type: "greet",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: 0,
      relationshipChanges: { trust: 2, familiarity: 5 },
      titanXP: [{ skill: "charisma", amount: 5 }],
      npcMoodEffect: 0.1,
      titanMoodEffect: 0.05,
      message: "Test message",
    };

    applyInteractionEffects(result, titan, npc);

    expect(titan.relationships["new-npc"]).toBeDefined();
    expect(titan.relationships["new-npc"].trust).toBe(2);
    expect(titan.relationships["new-npc"].familiarity).toBe(5);
  });

  test("should grant XP to Titan skills", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();
    const initialXP = titan.skills.empathy.experience;
    const result: TitanInteractionResult = {
      success: true,
      type: "help",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: -0.05,
      relationshipChanges: { trust: 5 },
      titanXP: [{ skill: "empathy", amount: 15 }],
      npcMoodEffect: 0.2,
      titanMoodEffect: 0.1,
      message: "Test message",
    };

    applyInteractionEffects(result, titan, npc);

    expect(titan.skills.empathy.experience).toBe(initialXP + 15);
  });

  test("should add action to Titan history", () => {
    const titan = createMockTitan({ actionHistory: [] });
    const npc = createMockNPC();
    const result: TitanInteractionResult = {
      success: true,
      type: "help",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: -0.05,
      relationshipChanges: { trust: 5 },
      titanXP: [{ skill: "empathy", amount: 15 }],
      npcMoodEffect: 0.2,
      titanMoodEffect: 0.1,
      message: "Test message",
    };

    applyInteractionEffects(result, titan, npc);

    expect(titan.actionHistory.length).toBeGreaterThan(0);
    const lastAction = titan.actionHistory[titan.actionHistory.length - 1];
    expect(lastAction.action).toContain("help");
    expect(lastAction.alignmentImpact).toBe(-0.05);
    expect(lastAction.relatedNpcId).toBe(npc.id);
  });
});

/**
 * Test Suite: selectInteractionType Function
 */
test.describe("selectInteractionType", () => {
  test("should return a valid interaction type", () => {
    const titan = createMockTitan();
    const npc = createMockNPC();

    const selected = selectInteractionType(titan, npc);

    expect(ALL_TITAN_INTERACTIONS).toContain(selected);
  });

  test("good Titans should prefer good actions", () => {
    const goodTitan = createMockTitan({ alignment: -0.7 });
    const npc = createMockNPC();

    // Run multiple times to check statistical preference
    const selections: TitanInteractionType[] = [];
    for (let i = 0; i < 50; i++) {
      selections.push(selectInteractionType(goodTitan, npc));
    }

    const goodActions = selections.filter(
      (s) => ["help", "protect", "heal", "teach", "comfort"].includes(s)
    );
    const evilActions = selections.filter(
      (s) => ["steal", "scare", "attack", "intimidate"].includes(s)
    );

    // Good Titan should select more good actions than evil
    expect(goodActions.length).toBeGreaterThan(evilActions.length);
  });

  test("evil Titans should prefer evil actions", () => {
    const evilTitan = createMockTitan({ alignment: 0.7 });
    const npc = createMockNPC();

    // Run multiple times to check statistical preference
    const selections: TitanInteractionType[] = [];
    for (let i = 0; i < 50; i++) {
      selections.push(selectInteractionType(evilTitan, npc));
    }

    const goodActions = selections.filter(
      (s) => ["help", "protect", "heal", "teach", "comfort"].includes(s)
    );
    const evilActions = selections.filter(
      (s) => ["steal", "scare", "attack", "intimidate"].includes(s)
    );

    // Evil Titan should select more evil actions than good
    expect(evilActions.length).toBeGreaterThan(goodActions.length);
  });

  test("neutral Titans should have balanced selection", () => {
    const neutralTitan = createMockTitan({ alignment: 0 });
    const npc = createMockNPC();

    // Run multiple times
    const selections: TitanInteractionType[] = [];
    for (let i = 0; i < 100; i++) {
      selections.push(selectInteractionType(neutralTitan, npc));
    }

    // Should have variety of actions
    const uniqueSelections = new Set(selections);
    expect(uniqueSelections.size).toBeGreaterThanOrEqual(5);
  });

  test("personality should influence selection", () => {
    const aggressiveTitan = createMockTitan({
      alignment: 0,
      personality: {
        bigFive: {
          openness: 0.5,
          conscientiousness: 0.3,
          extraversion: 0.8,
          agreeableness: 0.2, // Low agreeableness
          neuroticism: 0.7,
        },
        crypto: {
          riskTolerance: 0.8,
          fomo: 0.5,
          trustInInstitutions: 0.3,
          technicalKnowledge: 0.5,
          degenLevel: 0.7,
        },
      },
    });
    const peacefulTitan = createMockTitan({
      alignment: 0,
      personality: {
        bigFive: {
          openness: 0.5,
          conscientiousness: 0.7,
          extraversion: 0.5,
          agreeableness: 0.9, // High agreeableness
          neuroticism: 0.2,
        },
        crypto: {
          riskTolerance: 0.3,
          fomo: 0.3,
          trustInInstitutions: 0.6,
          technicalKnowledge: 0.5,
          degenLevel: 0.2,
        },
      },
    });
    const npc = createMockNPC();

    // Run multiple times
    const aggressiveSelections: TitanInteractionType[] = [];
    const peacefulSelections: TitanInteractionType[] = [];
    
    for (let i = 0; i < 50; i++) {
      aggressiveSelections.push(selectInteractionType(aggressiveTitan, npc));
      peacefulSelections.push(selectInteractionType(peacefulTitan, npc));
    }

    const aggressiveNegative = aggressiveSelections.filter(
      (s) => ["attack", "intimidate", "scare"].includes(s)
    ).length;
    const peacefulNegative = peacefulSelections.filter(
      (s) => ["attack", "intimidate", "scare"].includes(s)
    ).length;

    // Aggressive Titan should have more negative selections
    expect(aggressiveNegative).toBeGreaterThanOrEqual(peacefulNegative);
  });
});

/**
 * Test Suite: Edge Cases and Boundary Conditions
 */
test.describe("Edge Cases", () => {
  test("should handle Titan with maximum alignment (1.0)", () => {
    const evilTitan = createMockTitan({ alignment: 1.0 });
    const npc = createMockNPC();

    const result = processInteraction(
      { titanId: evilTitan.id, npcId: npc.id, type: "attack" },
      evilTitan,
      npc
    );

    expect(result).toBeDefined();
  });

  test("should handle Titan with minimum alignment (-1.0)", () => {
    const goodTitan = createMockTitan({ alignment: -1.0 });
    const npc = createMockNPC();

    const result = processInteraction(
      { titanId: goodTitan.id, npcId: npc.id, type: "help" },
      goodTitan,
      npc
    );

    expect(result).toBeDefined();
  });

  test("should handle Titan with no existing relationships", () => {
    const titan = createMockTitan({ relationships: {} });
    const npc = createMockNPC();

    const result = processInteraction(
      { titanId: titan.id, npcId: npc.id, type: "greet" },
      titan,
      npc
    );

    expect(result).toBeDefined();
    expect(result.relationshipChanges).toBeDefined();
  });

  test("should handle skills at level 1", () => {
    const weakTitan = createMockTitan({
      skills: Object.fromEntries(
        Object.keys(createMockTitan().skills).map((skill) => [
          skill,
          { skill, level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        ])
      ) as TitanPet["skills"],
    });
    const npc = createMockNPC();

    const probability = calculateInteractionSuccess(weakTitan, npc, "help");
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });

  test("should handle skills at level 10", () => {
    const strongTitan = createMockTitan({
      skills: Object.fromEntries(
        Object.keys(createMockTitan().skills).map((skill) => [
          skill,
          { skill, level: 10, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        ])
      ) as TitanPet["skills"],
    });
    const npc = createMockNPC();

    const probability = calculateInteractionSuccess(strongTitan, npc, "help");
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });

  test("relationship values should be clamped to valid ranges", () => {
    const titan = createMockTitan({
      relationships: {
        "npc-test-1": {
          npcId: "npc-test-1",
          trust: 95,
          respect: 90,
          familiarity: 98,
          fear: 5,
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 10,
        },
      },
    });
    const npc = createMockNPC({ id: "npc-test-1" });
    const result: TitanInteractionResult = {
      success: true,
      type: "help",
      titanId: titan.id,
      npcId: npc.id,
      alignmentChange: -0.05,
      relationshipChanges: { trust: 20, familiarity: 10 }, // Would exceed 100
      titanXP: [{ skill: "empathy", amount: 15 }],
      npcMoodEffect: 0.2,
      titanMoodEffect: 0.1,
      message: "Test message",
    };

    applyInteractionEffects(result, titan, npc);

    // Values should be clamped
    expect(titan.relationships["npc-test-1"].trust).toBeLessThanOrEqual(100);
    expect(titan.relationships["npc-test-1"].familiarity).toBeLessThanOrEqual(100);
  });
});
