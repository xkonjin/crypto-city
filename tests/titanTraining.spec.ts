import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Training System
 *
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements praise/punish training mechanics where player feedback
 * teaches the Titan what actions are good or bad.
 *
 * Based on Black & White's creature training system:
 * - Player praises/punishes Titan within 3 second window
 * - Actions get reinforced as good/bad in beliefs
 * - Alignment shifts based on training
 * - Attention needs are satisfied
 *
 * @see specs/HERO_PET_SYSTEM.md Section 3.3
 */

import type { TitanPet, ActionBelief, ActionHistoryEntry } from "@/games/isocity/types/titan";
import {
  ActionBeliefMap,
  ActionHistoryTracker,
  TRAINING_WINDOW_MS,
} from "@/lib/titan/TitanLearning";
import {
  praiseTitan,
  punishTitan,
  recordTitanAction,
  getTrainableAction,
  TitanTrainer,
  PRAISE_MESSAGES,
  PUNISH_MESSAGES,
  WINDOW_EXPIRED_MESSAGE,
  NO_ACTION_MESSAGE,
  type TrainingResult,
} from "@/lib/titan/TitanTraining";
import { createTitan } from "@/lib/titan/TitanSpawner";

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a test Titan with default values
 */
function createTestTitan(overrides?: Partial<TitanPet>): TitanPet {
  const titan = createTitan({
    gridX: 5,
    gridY: 5,
    species: "doge",
    name: "TestDoge",
  });
  return { ...titan, ...overrides };
}

/**
 * Create a history tracker with a recent action
 */
function createHistoryWithRecentAction(
  action: string,
  ageMs: number = 0
): ActionHistoryTracker {
  const now = Date.now();
  const history: ActionHistoryEntry[] = [
    {
      action,
      timestamp: now - ageMs,
      alignmentImpact: 0,
    },
  ];
  return new ActionHistoryTracker(history);
}

// ============================================================================
// TEST SUITE: TrainingResult Type
// ============================================================================

test.describe("TrainingResult Type", () => {
  test("praiseTitan should return a TrainingResult", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const result = praiseTitan(titan, beliefs, history);

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("withinWindow");
    expect(result).toHaveProperty("alignmentChange");
    expect(result).toHaveProperty("newGoodness");
    expect(result).toHaveProperty("newConfidence");
    expect(result).toHaveProperty("message");
  });

  test("TrainingResult type should be 'praise' for praiseTitan", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const result = praiseTitan(titan, beliefs, history);
    expect(result.type).toBe("praise");
  });

  test("TrainingResult type should be 'punish' for punishTitan", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    const result = punishTitan(titan, beliefs, history);
    expect(result.type).toBe("punish");
  });
});

// ============================================================================
// TEST SUITE: Training Window
// ============================================================================

test.describe("Training Window", () => {
  test("getTrainableAction should return action within 3 second window", () => {
    const history = createHistoryWithRecentAction("help_npc", 1000); // 1 second ago

    const trainable = getTrainableAction(history);
    expect(trainable).not.toBeNull();
    expect(trainable!.action).toBe("help_npc");
  });

  test("getTrainableAction should return null outside 3 second window", () => {
    const history = createHistoryWithRecentAction("help_npc", 4000); // 4 seconds ago

    const trainable = getTrainableAction(history);
    expect(trainable).toBeNull();
  });

  test("getTrainableAction should return null for empty history", () => {
    const history = new ActionHistoryTracker();

    const trainable = getTrainableAction(history);
    expect(trainable).toBeNull();
  });

  test("praiseTitan should fail if outside training window", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 4000); // 4 seconds ago

    const result = praiseTitan(titan, beliefs, history);

    expect(result.success).toBe(false);
    expect(result.withinWindow).toBe(false);
    expect(result.message).toBe(WINDOW_EXPIRED_MESSAGE);
  });

  test("punishTitan should fail if outside training window", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 4000); // 4 seconds ago

    const result = punishTitan(titan, beliefs, history);

    expect(result.success).toBe(false);
    expect(result.withinWindow).toBe(false);
    expect(result.message).toBe(WINDOW_EXPIRED_MESSAGE);
  });

  test("praiseTitan should fail if no recent action", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker(); // Empty

    const result = praiseTitan(titan, beliefs, history);

    expect(result.success).toBe(false);
    expect(result.action).toBeNull();
    expect(result.message).toBe(NO_ACTION_MESSAGE);
  });

  test("punishTitan should fail if no recent action", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker(); // Empty

    const result = punishTitan(titan, beliefs, history);

    expect(result.success).toBe(false);
    expect(result.action).toBeNull();
    expect(result.message).toBe(NO_ACTION_MESSAGE);
  });

  test("training window uses TRAINING_WINDOW_MS constant (3000ms)", () => {
    expect(TRAINING_WINDOW_MS).toBe(3000);
  });
});

// ============================================================================
// TEST SUITE: recordTitanAction
// ============================================================================

test.describe("recordTitanAction", () => {
  test("should add action to history tracker", () => {
    const titan = createTestTitan();
    const history = new ActionHistoryTracker();

    recordTitanAction(titan, "help_npc", history);

    const lastAction = history.getLastAction();
    expect(lastAction).not.toBeNull();
    expect(lastAction!.action).toBe("help_npc");
  });

  test("should set timestamp to current time", () => {
    const titan = createTestTitan();
    const history = new ActionHistoryTracker();
    const beforeTime = Date.now();

    recordTitanAction(titan, "help_npc", history);

    const afterTime = Date.now();
    const lastAction = history.getLastAction();
    expect(lastAction!.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(lastAction!.timestamp).toBeLessThanOrEqual(afterTime);
  });

  test("should include alignment impact based on action type", () => {
    const titan = createTestTitan();
    const history = new ActionHistoryTracker();

    recordTitanAction(titan, "help_npc", history);

    const lastAction = history.getLastAction();
    // help_npc has alignment impact of -0.05 (good action)
    expect(lastAction!.alignmentImpact).toBe(-0.05);
  });

  test("should include positive alignment impact for evil actions", () => {
    const titan = createTestTitan();
    const history = new ActionHistoryTracker();

    recordTitanAction(titan, "steal", history);

    const lastAction = history.getLastAction();
    // steal has alignment impact of 0.08 (evil action)
    expect(lastAction!.alignmentImpact).toBe(0.08);
  });

  test("should include zero alignment impact for neutral actions", () => {
    const titan = createTestTitan();
    const history = new ActionHistoryTracker();

    recordTitanAction(titan, "eat", history);

    const lastAction = history.getLastAction();
    // eat has alignment impact of 0 (neutral action)
    expect(lastAction!.alignmentImpact).toBe(0);
  });
});

// ============================================================================
// TEST SUITE: praiseTitan - Belief Updates
// ============================================================================

test.describe("praiseTitan - Belief Updates", () => {
  test("should reinforce action as GOOD in beliefMap", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    const goodness = beliefs.getActionGoodness("help_npc");
    expect(goodness).toBeGreaterThan(0);
  });

  test("should increase confidence in beliefMap", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    const confidence = beliefs.getActionConfidence("help_npc");
    expect(confidence).toBeGreaterThan(0);
  });

  test("should return new goodness value in result", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const result = praiseTitan(titan, beliefs, history);

    expect(result.newGoodness).toBeGreaterThan(0);
    expect(result.newGoodness).toBe(beliefs.getActionGoodness("help_npc"));
  });

  test("should return new confidence value in result", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const result = praiseTitan(titan, beliefs, history);

    expect(result.newConfidence).toBeGreaterThan(0);
    expect(result.newConfidence).toBe(beliefs.getActionConfidence("help_npc"));
  });

  test("repeated praise should increase goodness further", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();

    // First praise
    const history1 = createHistoryWithRecentAction("help_npc", 100);
    praiseTitan(titan, beliefs, history1);
    const goodness1 = beliefs.getActionGoodness("help_npc");

    // Second praise
    const history2 = createHistoryWithRecentAction("help_npc", 100);
    praiseTitan(titan, beliefs, history2);
    const goodness2 = beliefs.getActionGoodness("help_npc");

    expect(goodness2).toBeGreaterThan(goodness1);
  });
});

// ============================================================================
// TEST SUITE: punishTitan - Belief Updates
// ============================================================================

test.describe("punishTitan - Belief Updates", () => {
  test("should reinforce action as BAD in beliefMap", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    const goodness = beliefs.getActionGoodness("steal");
    expect(goodness).toBeLessThan(0);
  });

  test("should increase confidence in beliefMap", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    const confidence = beliefs.getActionConfidence("steal");
    expect(confidence).toBeGreaterThan(0);
  });

  test("should return new goodness value in result", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    const result = punishTitan(titan, beliefs, history);

    expect(result.newGoodness).toBeLessThan(0);
    expect(result.newGoodness).toBe(beliefs.getActionGoodness("steal"));
  });

  test("should return new confidence value in result", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    const result = punishTitan(titan, beliefs, history);

    expect(result.newConfidence).toBeGreaterThan(0);
    expect(result.newConfidence).toBe(beliefs.getActionConfidence("steal"));
  });

  test("repeated punishment should decrease goodness further", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();

    // First punish
    const history1 = createHistoryWithRecentAction("steal", 100);
    punishTitan(titan, beliefs, history1);
    const goodness1 = beliefs.getActionGoodness("steal");

    // Second punish
    const history2 = createHistoryWithRecentAction("steal", 100);
    punishTitan(titan, beliefs, history2);
    const goodness2 = beliefs.getActionGoodness("steal");

    expect(goodness2).toBeLessThan(goodness1);
  });
});

// ============================================================================
// TEST SUITE: praiseTitan - Alignment Effects
// ============================================================================

test.describe("praiseTitan - Alignment Effects", () => {
  test("should shift alignment toward good (negative)", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const initialAlignment = titan.alignment;
    praiseTitan(titan, beliefs, history);

    expect(titan.alignment).toBeLessThan(initialAlignment);
  });

  test("should return alignment change in result", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const initialAlignment = titan.alignment;
    const result = praiseTitan(titan, beliefs, history);

    expect(result.alignmentChange).toBeLessThan(0);
    expect(titan.alignment).toBe(initialAlignment + result.alignmentChange);
  });

  test("praising good actions should shift toward good", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.alignment).toBeLessThan(0); // More good
  });

  test("praising evil actions creates 'approved evil' - still shifts toward good but less", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    praiseTitan(titan, beliefs, history);

    // Even praising evil actions shifts slightly toward good
    // (player is giving positive attention)
    expect(titan.alignment).toBeLessThan(0);
  });

  test("alignment should not go below -1.0", () => {
    const titan = createTestTitan({ alignment: -0.99 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.alignment).toBeGreaterThanOrEqual(-1.0);
  });
});

// ============================================================================
// TEST SUITE: punishTitan - Alignment Effects
// ============================================================================

test.describe("punishTitan - Alignment Effects", () => {
  test("should shift alignment toward evil (positive)", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    const initialAlignment = titan.alignment;
    punishTitan(titan, beliefs, history);

    // Punishing makes YOU more evil
    expect(titan.alignment).toBeGreaterThan(initialAlignment);
  });

  test("should return alignment change in result", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    const initialAlignment = titan.alignment;
    const result = punishTitan(titan, beliefs, history);

    expect(result.alignmentChange).toBeGreaterThan(0);
    expect(titan.alignment).toBe(initialAlignment + result.alignmentChange);
  });

  test("punishing should make Titan more evil", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    punishTitan(titan, beliefs, history);

    expect(titan.alignment).toBeGreaterThan(0); // More evil
  });

  test("alignment should not go above +1.0", () => {
    const titan = createTestTitan({ alignment: 0.99 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    expect(titan.alignment).toBeLessThanOrEqual(1.0);
  });
});

// ============================================================================
// TEST SUITE: Needs Satisfaction
// ============================================================================

test.describe("Needs Satisfaction", () => {
  test("praiseTitan should satisfy attention need by +10", () => {
    const titan = createTestTitan();
    titan.needs.attention.current = 50;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.needs.attention.current).toBe(60);
  });

  test("punishTitan should satisfy attention need by +5", () => {
    const titan = createTestTitan();
    titan.needs.attention.current = 50;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    expect(titan.needs.attention.current).toBe(55);
  });

  test("attention need should not exceed 100", () => {
    const titan = createTestTitan();
    titan.needs.attention.current = 95;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.needs.attention.current).toBe(100);
  });
});

// ============================================================================
// TEST SUITE: Mood Effects
// ============================================================================

test.describe("Mood Effects", () => {
  test("praiseTitan should set mood to happy", () => {
    const titan = createTestTitan();
    titan.mood.currentMood = 'neutral';
    titan.mood.moodIntensity = 0.5;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.mood.currentMood).toBe('happy');
  });

  test("praiseTitan should increase mood intensity", () => {
    const titan = createTestTitan();
    titan.mood.moodIntensity = 0.5;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.mood.moodIntensity).toBeGreaterThan(0.5);
  });

  test("punishTitan should set mood to sad", () => {
    const titan = createTestTitan();
    titan.mood.currentMood = 'neutral';
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    expect(titan.mood.currentMood).toBe('sad');
  });

  test("punishTitan should decrease mood intensity", () => {
    const titan = createTestTitan();
    titan.mood.moodIntensity = 0.5;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    expect(titan.mood.moodIntensity).toBeLessThan(0.5);
  });

  test("mood intensity should not exceed 1.0", () => {
    const titan = createTestTitan();
    titan.mood.moodIntensity = 0.98;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    praiseTitan(titan, beliefs, history);

    expect(titan.mood.moodIntensity).toBeLessThanOrEqual(1.0);
  });

  test("mood intensity should not go below 0.0", () => {
    const titan = createTestTitan();
    titan.mood.moodIntensity = 0.02;
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    punishTitan(titan, beliefs, history);

    expect(titan.mood.moodIntensity).toBeGreaterThanOrEqual(0.0);
  });
});

// ============================================================================
// TEST SUITE: Feedback Messages
// ============================================================================

test.describe("Feedback Messages", () => {
  test("successful praise should return a praise message", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);

    const result = praiseTitan(titan, beliefs, history);

    // Message should be one of the PRAISE_MESSAGES patterns
    expect(result.success).toBe(true);
    expect(result.message.length).toBeGreaterThan(0);
    // Check it contains either the action or titan name
    const hasRelevantContent =
      result.message.includes("help_npc") ||
      result.message.includes("Good") ||
      result.message.includes("good") ||
      result.message.includes(titan.name);
    expect(hasRelevantContent).toBe(true);
  });

  test("successful punish should return a punish message", () => {
    const titan = createTestTitan();
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);

    const result = punishTitan(titan, beliefs, history);

    expect(result.success).toBe(true);
    expect(result.message.length).toBeGreaterThan(0);
    // Check it contains either the action or "bad"
    const hasRelevantContent =
      result.message.includes("steal") ||
      result.message.includes("Bad") ||
      result.message.includes("bad") ||
      result.message.includes(titan.name);
    expect(hasRelevantContent).toBe(true);
  });

  test("PRAISE_MESSAGES should have template placeholders", () => {
    expect(PRAISE_MESSAGES.length).toBeGreaterThan(0);
    // At least one message should contain {action} or {titanName}
    const hasPlaceholders = PRAISE_MESSAGES.some(
      (msg) => msg.includes("{action}") || msg.includes("{titanName}")
    );
    expect(hasPlaceholders).toBe(true);
  });

  test("PUNISH_MESSAGES should have template placeholders", () => {
    expect(PUNISH_MESSAGES.length).toBeGreaterThan(0);
    const hasPlaceholders = PUNISH_MESSAGES.some(
      (msg) => msg.includes("{action}") || msg.includes("{titanName}")
    );
    expect(hasPlaceholders).toBe(true);
  });

  test("window expired should show WINDOW_EXPIRED_MESSAGE", () => {
    expect(WINDOW_EXPIRED_MESSAGE).toBe("Training window expired - be faster!");
  });

  test("no action should show NO_ACTION_MESSAGE", () => {
    expect(NO_ACTION_MESSAGE).toBe("No recent action to train");
  });
});

// ============================================================================
// TEST SUITE: TitanTrainer Class
// ============================================================================

test.describe("TitanTrainer Class", () => {
  test("should be constructable with beliefMap and historyTracker", () => {
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();

    const trainer = new TitanTrainer(beliefs, history);

    expect(trainer).toBeDefined();
  });

  test("praise() should delegate to praiseTitan", () => {
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);
    const trainer = new TitanTrainer(beliefs, history);
    const titan = createTestTitan();

    const result = trainer.praise(titan);

    expect(result.success).toBe(true);
    expect(result.type).toBe("praise");
    expect(beliefs.getActionGoodness("help_npc")).toBeGreaterThan(0);
  });

  test("punish() should delegate to punishTitan", () => {
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("steal", 100);
    const trainer = new TitanTrainer(beliefs, history);
    const titan = createTestTitan();

    const result = trainer.punish(titan);

    expect(result.success).toBe(true);
    expect(result.type).toBe("punish");
    expect(beliefs.getActionGoodness("steal")).toBeLessThan(0);
  });

  test("recordAction() should delegate to recordTitanAction", () => {
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();
    const trainer = new TitanTrainer(beliefs, history);
    const titan = createTestTitan();

    trainer.recordAction(titan, "help_npc");

    expect(history.getLastAction()!.action).toBe("help_npc");
  });

  test("canTrain() should return true when action is within window", () => {
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);
    const trainer = new TitanTrainer(beliefs, history);

    expect(trainer.canTrain()).toBe(true);
  });

  test("canTrain() should return false when no trainable action", () => {
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();
    const trainer = new TitanTrainer(beliefs, history);

    expect(trainer.canTrain()).toBe(false);
  });

  test("canTrain() should return false when action is outside window", () => {
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 4000);
    const trainer = new TitanTrainer(beliefs, history);

    expect(trainer.canTrain()).toBe(false);
  });

  test("getTrainableAction() should return the trainable action", () => {
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 100);
    const trainer = new TitanTrainer(beliefs, history);

    const action = trainer.getTrainableAction();

    expect(action).not.toBeNull();
    expect(action!.action).toBe("help_npc");
  });
});

// ============================================================================
// TEST SUITE: Integration Tests
// ============================================================================

test.describe("TitanTraining Integration", () => {
  test("full training flow: record action → praise within window", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();
    const trainer = new TitanTrainer(beliefs, history);

    // Titan performs an action
    trainer.recordAction(titan, "help_npc");

    // Verify can train
    expect(trainer.canTrain()).toBe(true);

    // Player praises
    const result = trainer.praise(titan);

    // Verify success
    expect(result.success).toBe(true);
    expect(result.withinWindow).toBe(true);
    expect(result.action).toBe("help_npc");

    // Verify belief updated
    expect(beliefs.getActionGoodness("help_npc")).toBeGreaterThan(0);

    // Verify alignment shifted toward good
    expect(titan.alignment).toBeLessThan(0);
  });

  test("full training flow: record action → punish within window", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();
    const trainer = new TitanTrainer(beliefs, history);

    // Titan performs an evil action
    trainer.recordAction(titan, "steal");

    // Verify can train
    expect(trainer.canTrain()).toBe(true);

    // Player punishes
    const result = trainer.punish(titan);

    // Verify success
    expect(result.success).toBe(true);
    expect(result.withinWindow).toBe(true);
    expect(result.action).toBe("steal");

    // Verify belief updated
    expect(beliefs.getActionGoodness("steal")).toBeLessThan(0);

    // Verify alignment shifted toward evil (punishment makes you evil)
    expect(titan.alignment).toBeGreaterThan(0);
  });

  test("training multiple actions builds consistent beliefs", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();
    const trainer = new TitanTrainer(beliefs, history);

    // Train help_npc as good multiple times
    for (let i = 0; i < 3; i++) {
      trainer.recordAction(titan, "help_npc");
      trainer.praise(titan);
    }

    // Train steal as bad multiple times
    for (let i = 0; i < 3; i++) {
      trainer.recordAction(titan, "steal");
      trainer.punish(titan);
    }

    // Verify beliefs
    expect(beliefs.getActionGoodness("help_npc")).toBeGreaterThan(0.5);
    expect(beliefs.getActionConfidence("help_npc")).toBeGreaterThan(0.2);
    expect(beliefs.getActionGoodness("steal")).toBeLessThan(-0.5);
    expect(beliefs.getActionConfidence("steal")).toBeGreaterThan(0.2);
  });

  test("failed training should not modify beliefs or alignment", () => {
    const titan = createTestTitan({ alignment: 0 });
    const beliefs = new ActionBeliefMap();
    const history = createHistoryWithRecentAction("help_npc", 5000); // Outside window
    const trainer = new TitanTrainer(beliefs, history);

    const initialAlignment = titan.alignment;

    const result = trainer.praise(titan);

    expect(result.success).toBe(false);
    expect(beliefs.hasActionBelief("help_npc")).toBe(false);
    expect(titan.alignment).toBe(initialAlignment);
  });
});
