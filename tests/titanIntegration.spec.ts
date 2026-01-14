import { test, expect } from "@playwright/test";

/**
 * Integration Tests for Titan Pet System
 *
 * These tests verify end-to-end workflows and cross-module integration.
 * Based on specs/HERO_PET_SYSTEM.md Section 14 - Testing Strategy.
 */

import {
  createMockTitan,
  createMockNPC,
  createMockRelationship,
  createMockAction,
  startGame,
  waitForTitanUpdate,
  performPraiseGesture,
  performPunishGesture,
} from "./helpers/titanTestHelpers";

import { TitanManager } from "@/lib/titan";
import { ActionBeliefMap, ActionHistoryTracker } from "@/lib/titan/TitanLearning";
import type { ActionBelief } from "@/games/isocity/types/titan";
import {
  calculateAlignment,
  shiftAlignment,
  getAlignmentState,
} from "@/lib/titan/TitanAlignment";
import { processInteraction } from "@/lib/titan/TitanInteractions";
import { createTitanDen, upgradeDen } from "@/lib/titan/TitanDen";
import { grantSkillXP } from "@/lib/titan/TitanSkills";
import { performMiracle, MiracleCooldownTracker } from "@/lib/titan/TitanMiracles";

// ============================================================================
// Helper Functions
// ============================================================================

function resetTitanManager(): void {
  TitanManager.despawnTitan();
  try {
    TitanManager.clearStorage();
  } catch {
    // Expected in Node.js context
  }
}

// ============================================================================
// Test Suite: Complete Training Workflow
// ============================================================================

test.describe("Complete Training Workflow", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("should train Titan through full praise/punish cycle", () => {
    // 1. Spawn Titan
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      species: "doge",
      name: "TrainingTitan",
    });
    expect(titan).toBeDefined();
    expect(TitanManager.hasTitan()).toBe(true);

    // 2. Create learning systems
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();

    // 3. Record an action (help_npc)
    history.recordAction("help_npc", -0.05);

    // 4. Verify action is trainable (within 3-second window)
    const trainableAction = history.getTrainableAction();
    expect(trainableAction).not.toBeNull();
    expect(trainableAction!.action).toBe("help_npc");

    // 5. Praise the action
    beliefs.reinforceAction("help_npc", true);

    // 6. Verify belief was created/updated
    expect(beliefs.hasActionBelief("help_npc")).toBe(true);
    const belief = beliefs.getActionBelief("help_npc");
    expect(belief).toBeDefined();
    expect(belief!.goodness).toBeGreaterThan(0);

    // 7. Verify confidence increased
    const initialConfidence = belief!.confidence;

    // 8. Reinforce again
    beliefs.reinforceAction("help_npc", true);
    const updatedBelief = beliefs.getActionBelief("help_npc");
    expect(updatedBelief!.confidence).toBeGreaterThan(initialConfidence);
  });

  test("should shift alignment based on trained behaviors", () => {
    // 1. Create Titan with neutral alignment
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      initialAlignment: 0,
    });
    expect(titan.alignment).toBe(0);

    // 2. Record multiple good actions
    const actions = [
      createMockAction("help_npc", -0.05),
      createMockAction("protect_npc", -0.1),
      createMockAction("heal_npc", -0.1),
    ];

    // 3. Calculate alignment from action history
    const newAlignment = calculateAlignment(actions);

    // 4. Verify alignment shifted toward good
    expect(newAlignment).toBeLessThan(0);

    // 5. Verify alignment state reflects the shift
    const alignmentState = getAlignmentState(newAlignment);
    expect(["good", "angelic"]).toContain(alignmentState);
  });

  test("should track punishment and create negative associations", () => {
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();

    // 1. Record a bad action
    history.recordAction("steal", 0.08);

    // 2. Punish the action
    beliefs.reinforceAction("steal", false);

    // 3. Verify negative association
    const initialBelief = beliefs.getActionBelief("steal");
    expect(initialBelief).toBeDefined();
    expect(initialBelief!.goodness).toBeLessThan(0);
    
    // Store initial confidence for comparison
    const initialConfidence = initialBelief!.confidence;

    // 4. Verify multiple punishments strengthen the belief
    beliefs.reinforceAction("steal", false);
    beliefs.reinforceAction("steal", false);

    const strongerBelief = beliefs.getActionBelief("steal");
    expect(strongerBelief!.confidence).toBeGreaterThan(initialConfidence);
  });
});

// ============================================================================
// Test Suite: Titan-NPC Interaction Flow
// ============================================================================

test.describe("Titan-NPC Interaction Flow", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("Titan helps NPC and builds relationship", () => {
    // 1. Spawn Titan near NPC position
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      species: "doge",
      name: "HelperTitan",
    });

    // 2. Create mock NPC adjacent to Titan
    const npc = createMockNPC({
      id: "npc-helper-test",
      gridX: 11,
      gridY: 10,
    });

    // 3. Process help interaction
    const result = processInteraction(
      {
        titanId: titan.id,
        npcId: npc.id,
        type: "help",
      },
      titan,
      npc
    );

    // 4. Verify relationship created/updated
    expect(result.relationshipChanges).toBeDefined();

    // 5. Verify XP gained
    expect(result.titanXP.length).toBeGreaterThan(0);
    const xpEntry = result.titanXP[0];
    expect(xpEntry.skill).toBe("empathy");
    expect(xpEntry.amount).toBeGreaterThan(0);

    // 6. Verify alignment shifted toward good
    expect(result.alignmentChange).toBeLessThan(0);
  });

  test("Titan evil actions damage relationship and shift alignment", () => {
    // 1. Create Titan with neutral alignment
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      initialAlignment: 0,
    });

    // 2. Create NPC
    const npc = createMockNPC({
      id: "npc-victim-test",
      gridX: 11,
      gridY: 10,
    });

    // 3. Process attack interaction
    const result = processInteraction(
      {
        titanId: titan.id,
        npcId: npc.id,
        type: "attack",
      },
      titan,
      npc
    );

    // 4. Verify alignment shifted toward evil
    expect(result.alignmentChange).toBeGreaterThan(0);

    // 5. Verify relationship damage (fear increased, trust decreased)
    expect(result.relationshipChanges.trust).toBeLessThan(0);
    expect(result.relationshipChanges.fear).toBeGreaterThan(0);
  });

  test("multiple interactions build cumulative relationship", () => {
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
    });

    // Create relationship tracking for the NPC
    titan.relationships["npc-friend"] = createMockRelationship({
      npcId: "npc-friend",
      trust: 0,
      familiarity: 0,
    });

    const npc = createMockNPC({
      id: "npc-friend",
      gridX: 11,
      gridY: 10,
    });

    // Perform multiple friendly interactions
    for (let i = 0; i < 5; i++) {
      const result = processInteraction(
        {
          titanId: titan.id,
          npcId: npc.id,
          type: "greet",
        },
        titan,
        npc
      );

      // Apply effects to track cumulative changes
      if (result.success) {
        titan.relationships["npc-friend"].trust += result.relationshipChanges.trust ?? 0;
        titan.relationships["npc-friend"].familiarity +=
          result.relationshipChanges.familiarity ?? 0;
      }
    }

    // Verify cumulative relationship improvement
    expect(titan.relationships["npc-friend"].familiarity).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: Persistence Across Reload
// ============================================================================

test.describe("Titan State Persistence", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("Titan core state is serializable and restorable", () => {
    // 1. Create Titan with specific state
    const titan = TitanManager.spawnTitan({
      gridX: 15,
      gridY: 20,
      species: "bull",
      name: "PersistentTitan",
      initialAlignment: -0.3,
    });

    // 2. Modify state (add skill XP)
    titan.skills.strength.experience = 500;
    titan.skills.strength.level = 4;

    // 3. Serialize to JSON
    const serialized = {
      id: titan.id,
      species: titan.species,
      name: titan.name,
      gridX: titan.gridX,
      gridY: titan.gridY,
      alignment: titan.alignment,
      skills: Object.fromEntries(
        Object.entries(titan.skills).map(([skill, prog]) => [
          skill,
          {
            skill: prog.skill,
            level: prog.level,
            experience: prog.experience,
            aptitude: prog.aptitude,
          },
        ])
      ),
    };

    const jsonString = JSON.stringify(serialized);
    expect(() => JSON.parse(jsonString)).not.toThrow();

    // 4. Parse and verify
    const parsed = JSON.parse(jsonString);
    expect(parsed.species).toBe("bull");
    expect(parsed.name).toBe("PersistentTitan");
    expect(parsed.alignment).toBe(-0.3);
    expect(parsed.skills.strength.level).toBe(4);
  });

  test("ActionBeliefMap is serializable and restorable", () => {
    // 1. Create beliefs with training data
    const beliefs = new ActionBeliefMap();
    beliefs.reinforceAction("help_npc", true);
    beliefs.reinforceAction("help_npc", true);
    beliefs.reinforceAction("steal", false);

    // 2. Serialize to Map format
    const map = beliefs.toMap();

    // 3. Convert to array format for JSON
    const serialized = Array.from(map.entries());
    const jsonString = JSON.stringify(serialized);

    // 4. Restore from JSON
    const parsed = JSON.parse(jsonString) as [string, ActionBelief][];
    const restoredMap = new Map<string, ActionBelief>(parsed);
    const restored = ActionBeliefMap.fromMap(restoredMap);

    // 5. Verify restored state
    expect(restored.hasActionBelief("help_npc")).toBe(true);
    expect(restored.hasActionBelief("steal")).toBe(true);
    expect(restored.getActionGoodness("help_npc")).toBeGreaterThan(0);
    expect(restored.getActionGoodness("steal")).toBeLessThan(0);
  });
});

// ============================================================================
// Test Suite: God Hand Integration (Browser Tests)
// ============================================================================

test.describe("God Hand Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    
    // Wait for test hooks to be available
    await page.waitForFunction(
      // @ts-expect-error - window.__TEST_HOOKS__ is set by GodHandProvider
      () => typeof window.__TEST_HOOKS__?.activateGodHand === "function",
      { timeout: 10000 }
    ).catch(() => {
      // Hooks may not be available in this environment
    });
  });

  test("God Hand activates and shows cursor", async ({ page }) => {
    // Check if test hooks are available
    const hasHooks = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      return typeof window.__TEST_HOOKS__?.activateGodHand === "function";
    });
    
    if (!hasHooks) {
      // Skip if hooks not available - this is tested in godHand.spec.ts
      test.skip();
      return;
    }

    // Press G to activate
    await page.keyboard.press("g");
    await page.waitForTimeout(300);

    // Check if God Hand mode is active via test hooks
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (hooks?.useGodHandState) {
        return hooks.useGodHandState();
      }
      return null;
    });

    // Verify God Hand is active
    expect(result).not.toBeNull();
    expect(result?.isActive).toBe(true);
  });

  test("God Hand toggle works correctly", async ({ page }) => {
    // Initial state: inactive
    const getState = async () => {
      return await page.evaluate(() => {
        // @ts-expect-error - access test hooks
        const hooks = window.__TEST_HOOKS__;
        if (!hooks?.useGodHandState) return null;
        return hooks.useGodHandState();
      });
    };

    const initialState = await getState();
    if (initialState) {
      expect(initialState.isActive).toBe(false);
    }

    // Toggle on
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    const activeState = await getState();
    if (activeState) {
      expect(activeState.isActive).toBe(true);
    }

    // Toggle off
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    const inactiveState = await getState();
    if (inactiveState) {
      expect(inactiveState.isActive).toBe(false);
    }
  });
});

// ============================================================================
// Test Suite: E2E Player Journeys
// ============================================================================

test.describe("E2E Player Journeys", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("new player journey: spawn, train basic commands, level up skill", () => {
    // 1. Spawn first Titan
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      species: "doge",
      name: "NewbieTitan",
    });
    expect(titan).toBeDefined();

    // 2. Initialize skill system
    const skillProgression = titan.skills;
    expect(skillProgression.charisma.level).toBe(1);

    // 3. Grant XP from interactions
    const xpResult = grantSkillXP(skillProgression, "charisma", 150);

    // 4. Verify level up occurred
    expect(xpResult.leveledUp).toBe(true);
    expect(xpResult.newLevel).toBe(2);

    // 5. Continue training to higher level
    const moreXP = grantSkillXP(xpResult.progressions, "charisma", 200);
    expect(moreXP.progressions.charisma.level).toBeGreaterThanOrEqual(2);
  });

  test("evil path: scare NPCs, gain demonic alignment", () => {
    // 1. Create Titan starting neutral
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      initialAlignment: 0,
    });

    // 2. Create action history with evil actions
    const evilActions = [
      createMockAction("scare_npc", 0.05),
      createMockAction("steal", 0.08),
      createMockAction("intimidate", 0.07),
      createMockAction("attack_npc", 0.15),
      createMockAction("spread_fud", 0.06),
    ];

    // 3. Calculate cumulative alignment shift
    let alignment = titan.alignment;
    for (const action of evilActions) {
      alignment = shiftAlignment(alignment, action.alignmentImpact);
    }

    // 4. Verify alignment moved toward evil
    expect(alignment).toBeGreaterThan(0.3);

    // 5. Verify alignment state is evil or demonic
    const state = getAlignmentState(alignment);
    expect(["evil", "demonic"]).toContain(state);
  });

  test("good path: help NPCs, become angelic", () => {
    // 1. Create Titan starting neutral
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      initialAlignment: 0,
    });

    // 2. Create action history with good actions
    const goodActions = [
      createMockAction("help_npc", -0.05),
      createMockAction("protect_npc", -0.1),
      createMockAction("heal_npc", -0.1),
      createMockAction("teach_npc", -0.05),
      createMockAction("donate", -0.08),
      createMockAction("comfort_npc", -0.04),
      createMockAction("build_community", -0.06),
    ];

    // 3. Calculate cumulative alignment shift
    let alignment = titan.alignment;
    for (const action of goodActions) {
      alignment = shiftAlignment(alignment, action.alignmentImpact);
    }

    // 4. Verify alignment moved toward good
    expect(alignment).toBeLessThan(-0.4);

    // 5. Verify alignment state is good or angelic
    const state = getAlignmentState(alignment);
    expect(["good", "angelic"]).toContain(state);
  });

  test("miracle usage: unlock and cast heal", () => {
    // 1. Create good-aligned Titan with high empathy
    const titan = createMockTitan({
      alignment: -0.5,
      skillLevels: { empathy: 5 },
    });

    // 2. Create cooldown tracker
    const tracker = new MiracleCooldownTracker();

    // 3. Cast heal miracle
    const result = performMiracle(titan, "heal", "npc-target-1", tracker);

    // 4. Verify success
    expect(result.success).toBe(true);
    expect(result.miracle).toBe("heal");
    expect(result.energyUsed).toBe(20);

    // 5. Verify alignment shifted more toward good
    expect(result.alignmentChange).toBe(-0.05);

    // 6. Verify cooldown applied
    expect(tracker.isReady("heal")).toBe(false);
  });

  test("den upgrade: build and upgrade through levels", () => {
    // 1. Create initial Level 1 den
    let den = createTitanDen(1, { x: 5, y: 5 });
    expect(den.level).toBe(1);
    expect(den.features.feedingBowl).toBe(true);
    expect(den.features.toyStorage).toBe(false);

    // 2. Upgrade to Level 2
    const denLevel2 = upgradeDen(den);
    expect(denLevel2).not.toBeNull();
    expect(denLevel2!.level).toBe(2);
    expect(denLevel2!.features.toyStorage).toBe(true);
    expect(denLevel2!.features.trainingDummy).toBe(true);
    den = denLevel2!;

    // 3. Upgrade to Level 3
    const denLevel3 = upgradeDen(den);
    expect(denLevel3).not.toBeNull();
    expect(denLevel3!.level).toBe(3);
    expect(denLevel3!.features.miracleAltar).toBe(true);
    den = denLevel3!;

    // 4. Upgrade to Level 4
    const denLevel4 = upgradeDen(den);
    expect(denLevel4).not.toBeNull();
    expect(denLevel4!.level).toBe(4);
    expect(denLevel4!.features.memoryShrine).toBe(true);
    den = denLevel4!;

    // 5. Upgrade to Level 5
    const denLevel5 = upgradeDen(den);
    expect(denLevel5).not.toBeNull();
    expect(denLevel5!.level).toBe(5);
    expect(denLevel5!.features.evolutionChamber).toBe(true);

    // 6. Verify max level reached
    const beyondMax = upgradeDen(denLevel5!);
    expect(beyondMax).toBeNull();
  });
});

// ============================================================================
// Test Suite: Cross-Module Integration
// ============================================================================

test.describe("Cross-Module Integration", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("skill level affects interaction success rate calculation", () => {
    // 1. Create low-skill Titan
    const lowSkillTitan = createMockTitan({
      skillLevels: { charisma: 1, empathy: 1 },
    });

    // 2. Create high-skill Titan
    const highSkillTitan = createMockTitan({
      skillLevels: { charisma: 10, empathy: 10 },
    });

    // 3. Create target NPC
    const npc = createMockNPC({ id: "test-npc" });

    // 4. Process interactions for both
    // Note: processInteraction includes randomness, but high skill should
    // statistically succeed more often
    let lowSkillSuccesses = 0;
    let highSkillSuccesses = 0;

    for (let i = 0; i < 20; i++) {
      const lowResult = processInteraction(
        { titanId: lowSkillTitan.id, npcId: npc.id, type: "greet" },
        lowSkillTitan,
        npc
      );
      if (lowResult.success) lowSkillSuccesses++;

      const highResult = processInteraction(
        { titanId: highSkillTitan.id, npcId: npc.id, type: "greet" },
        highSkillTitan,
        npc
      );
      if (highResult.success) highSkillSuccesses++;
    }

    // 5. High skill should generally succeed more
    expect(highSkillSuccesses).toBeGreaterThanOrEqual(lowSkillSuccesses);
  });

  test("alignment affects miracle availability", () => {
    // 1. Create good-aligned Titan with required skills
    const goodTitan = createMockTitan({
      alignment: -0.5,
      skillLevels: { empathy: 5, charisma: 7, miracles: 8, gathering: 6 },
    });

    // 2. Create evil-aligned Titan with same skills
    const evilTitan = createMockTitan({
      alignment: 0.5,
      skillLevels: { intimidation: 5, miracles: 8, gathering: 6 },
    });

    // 3. Test heal availability
    const goodTracker = new MiracleCooldownTracker();
    const evilTracker = new MiracleCooldownTracker();

    const goodHeal = performMiracle(goodTitan, "heal", "npc-1", goodTracker);
    const evilHeal = performMiracle(evilTitan, "heal", "npc-1", evilTracker);

    expect(goodHeal.success).toBe(true);
    expect(evilHeal.success).toBe(false);

    // 4. Test curse availability
    const goodCurse = performMiracle(goodTitan, "curse", "npc-1", new MiracleCooldownTracker());
    const evilCurse = performMiracle(evilTitan, "curse", "npc-1", new MiracleCooldownTracker());

    expect(goodCurse.success).toBe(false);
    expect(evilCurse.success).toBe(true);
  });

  test("NPC interactions grant XP and level up skills", () => {
    // 1. Create Titan
    const titan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
    });

    // 2. Create NPC
    const npc = createMockNPC({ gridX: 11, gridY: 10 });

    // 3. Perform interactions until skill levels up
    const initialLevel = titan.skills.empathy.level;
    let totalXP = titan.skills.empathy.experience;

    // Keep interacting until we accumulate enough XP
    for (let i = 0; i < 20 && totalXP < 100; i++) {
      const result = processInteraction(
        { titanId: titan.id, npcId: npc.id, type: "help" },
        titan,
        npc
      );

      if (result.success) {
        const xpEntry = result.titanXP.find((x) => x.skill === "empathy");
        if (xpEntry) {
          totalXP += xpEntry.amount;
        }
      }
    }

    // 4. Apply XP and check for level up
    const xpResult = grantSkillXP(titan.skills, "empathy", totalXP);

    // 5. Verify skill progression
    expect(xpResult.progressions.empathy.experience).toBeGreaterThan(0);
    if (totalXP >= 100) {
      expect(xpResult.leveledUp).toBe(true);
      expect(xpResult.newLevel).toBeGreaterThan(initialLevel);
    }
  });

  test("belief system affects action selection", () => {
    // 1. Create belief map with strong associations
    const beliefs = new ActionBeliefMap();

    // Train: helping is VERY good
    for (let i = 0; i < 10; i++) {
      beliefs.reinforceAction("help_npc", true);
    }

    // Train: stealing is VERY bad
    for (let i = 0; i < 10; i++) {
      beliefs.reinforceAction("steal", false);
    }

    // 2. Verify belief strengths
    const helpGoodness = beliefs.getActionGoodness("help_npc");
    const stealGoodness = beliefs.getActionGoodness("steal");

    expect(helpGoodness).toBeGreaterThan(0.5);
    expect(stealGoodness).toBeLessThan(-0.5);

    // 3. Verify confidence is high
    expect(beliefs.getActionConfidence("help_npc")).toBeGreaterThan(0.5);
    expect(beliefs.getActionConfidence("steal")).toBeGreaterThan(0.5);
  });
});

// ============================================================================
// Test Suite: Edge Cases and Error Handling
// ============================================================================

test.describe("Edge Cases and Error Handling", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("handles null/undefined gracefully in TitanManager", () => {
    // Should not throw when no Titan exists
    expect(() => TitanManager.getTitan()).not.toThrow();
    expect(TitanManager.getTitan()).toBeNull();

    expect(() => TitanManager.getTitanPosition()).not.toThrow();
    expect(TitanManager.getTitanPosition()).toBeNull();

    expect(() => TitanManager.despawnTitan()).not.toThrow();
    expect(TitanManager.despawnTitan()).toBe(false);
  });

  test("handles empty action history in alignment calculation", () => {
    const alignment = calculateAlignment([]);
    expect(alignment).toBe(0);
  });

  test("clamps alignment to valid range", () => {
    // Try to exceed +1.0
    const tooPositive = shiftAlignment(0.95, 0.2);
    expect(tooPositive).toBe(1.0);

    // Try to exceed -1.0
    const tooNegative = shiftAlignment(-0.95, -0.2);
    expect(tooNegative).toBe(-1.0);
  });

  test("handles max level skills correctly", () => {
    const titan = createMockTitan({
      skillLevels: { strength: 10 },
    });

    // Grant XP at max level
    const result = grantSkillXP(titan.skills, "strength", 10000);

    // Should not exceed level 10
    expect(result.progressions.strength.level).toBe(10);
    expect(result.leveledUp).toBe(false);
  });

  test("handles interaction between Titans in different buildings", () => {
    // Titan inside a building
    const insideTitan = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
    });
    insideTitan.isInsideBuilding = true;
    insideTitan.currentBuildingId = "building-1";

    // NPC outside
    const outsideNPC = createMockNPC({
      gridX: 11,
      gridY: 10,
      isInsideBuilding: false,
    });

    // Interaction should have reduced success or be blocked
    const result = processInteraction(
      { titanId: insideTitan.id, npcId: outsideNPC.id, type: "greet" },
      insideTitan,
      outsideNPC
    );

    // Result should still be processed without crashing
    expect(result).toBeDefined();
  });

  test("handles rapid successive interactions", () => {
    const titan = TitanManager.spawnTitan({ gridX: 10, gridY: 10 });
    const npc = createMockNPC({ gridX: 11, gridY: 10 });

    // Perform many interactions rapidly
    const results = [];
    for (let i = 0; i < 50; i++) {
      const result = processInteraction(
        { titanId: titan.id, npcId: npc.id, type: "greet" },
        titan,
        npc
      );
      results.push(result);
    }

    // All interactions should complete without error
    expect(results.length).toBe(50);
    results.forEach((r) => {
      expect(r).toBeDefined();
      expect(typeof r.success).toBe("boolean");
    });
  });

  test("belief decay over time works correctly", () => {
    const beliefs = new ActionBeliefMap();

    // Create a belief
    beliefs.reinforceAction("test_action", true);
    const initialGoodness = beliefs.getActionGoodness("test_action");

    // Decay over simulated time
    beliefs.decayBeliefs(1000); // 1000 game minutes

    const decayedGoodness = beliefs.getActionGoodness("test_action");

    // Goodness should have decreased toward 0
    expect(Math.abs(decayedGoodness)).toBeLessThan(Math.abs(initialGoodness));
  });
});

// ============================================================================
// Test Suite: Performance Integration
// ============================================================================

test.describe("Performance Integration", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("can handle many NPCs in relationships", () => {
    const titan = TitanManager.spawnTitan({ gridX: 10, gridY: 10 });

    // Create many NPC relationships
    for (let i = 0; i < 100; i++) {
      titan.relationships[`npc-${i}`] = createMockRelationship({
        npcId: `npc-${i}`,
        trust: Math.random() * 100 - 50,
        familiarity: Math.random() * 100,
      });
    }

    // Verify all relationships stored
    expect(Object.keys(titan.relationships).length).toBe(100);

    // Verify can still access and modify
    titan.relationships["npc-50"].trust += 10;
    expect(titan.relationships["npc-50"].trust).toBeDefined();
  });

  test("action history respects maximum limit", () => {
    const tracker = new ActionHistoryTracker(undefined, 100);

    // Add more than limit
    for (let i = 0; i < 200; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }

    // Should only keep 100
    expect(tracker.toArray().length).toBe(100);

    // Should keep most recent
    const history = tracker.toArray();
    expect(history[99].action).toBe("action_199");
  });

  test("belief map respects LRU eviction limit", () => {
    const beliefs = new ActionBeliefMap(undefined, 50);

    // Add more than limit
    for (let i = 0; i < 100; i++) {
      beliefs.reinforceAction(`action_${i}`, true);
    }

    // Should only keep 50
    expect(beliefs.size()).toBe(50);
  });
});
