import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Observation Learning System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements the system where Titan learns by observing NPC behaviors.
 * 
 * Based on Black & White's creature observation learning:
 * - ObservationTracker: Records and manages observed NPC behaviors
 * - Mimicry functions: Calculate and process mimicry decisions
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 5.2 on Learning
 */

import type { ActionBelief } from "@/games/isocity/types/titan";
import type { ObservedBehavior } from "@/lib/titan/TitanLearning";
import {
  ObservationTracker,
  calculateMimicryChance,
  shouldMimicAction,
  processObservation,
  learnFromMimicry,
  ActionBeliefMap,
} from "@/lib/titan/TitanLearning";
import { TitanBDI } from "@/lib/titan/TitanAI";
import { createTitan } from "@/lib/titan/TitanSpawner";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a test Titan with controllable settings
 */
function createTestTitan(overrides?: {
  openness?: number;
  npcOpinions?: Map<string, number>;
  actionBeliefs?: Map<string, ActionBelief>;
  desires?: Array<{ type: string; priority: number; source: 'need' | 'mood' | 'curiosity' | 'command'; }>;
}) {
  const titan = createTitan({ gridX: 10, gridY: 10, species: 'doge' });
  
  // Override personality openness if provided
  if (overrides?.openness !== undefined) {
    titan.personality = {
      bigFive: {
        openness: overrides.openness,
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
    };
  }
  
  // Override NPC opinions if provided
  if (overrides?.npcOpinions) {
    titan.bdi.beliefs.npcOpinions = overrides.npcOpinions;
  }
  
  // Override action beliefs if provided
  if (overrides?.actionBeliefs) {
    titan.bdi.beliefs.actionBeliefs = overrides.actionBeliefs;
  }
  
  // Override desires if provided
  if (overrides?.desires) {
    titan.bdi.desires = overrides.desires;
  }
  
  return titan;
}

// ============================================================================
// TEST SUITE: ObservedBehavior Type
// ============================================================================

test.describe("ObservedBehavior Interface", () => {
  test("should have required fields: actorId, action, outcome, observedAt, mimicked", () => {
    const observation: ObservedBehavior = {
      actorId: "npc-123",
      action: "help_other",
      outcome: "pending",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    expect(observation.actorId).toBe("npc-123");
    expect(observation.action).toBe("help_other");
    expect(observation.outcome).toBe("pending");
    expect(typeof observation.observedAt).toBe("number");
    expect(observation.mimicked).toBe(false);
  });
  
  test("outcome should be 'success', 'failure', or 'pending'", () => {
    const successObs: ObservedBehavior = {
      actorId: "npc-1",
      action: "action",
      outcome: "success",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    const failureObs: ObservedBehavior = {
      actorId: "npc-2",
      action: "action",
      outcome: "failure",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    const pendingObs: ObservedBehavior = {
      actorId: "npc-3",
      action: "action",
      outcome: "pending",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    expect(["success", "failure", "pending"]).toContain(successObs.outcome);
    expect(["success", "failure", "pending"]).toContain(failureObs.outcome);
    expect(["success", "failure", "pending"]).toContain(pendingObs.outcome);
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker Constructor
// ============================================================================

test.describe("ObservationTracker Constructor", () => {
  test("should create empty tracker when no initial observations provided", () => {
    const tracker = new ObservationTracker();
    expect(tracker.toArray().length).toBe(0);
  });
  
  test("should accept initial observations via array", () => {
    const initialObs: ObservedBehavior[] = [
      { actorId: "npc-1", action: "help", outcome: "success", observedAt: Date.now(), mimicked: false },
      { actorId: "npc-2", action: "steal", outcome: "failure", observedAt: Date.now(), mimicked: true },
    ];
    
    const tracker = new ObservationTracker(initialObs);
    expect(tracker.toArray().length).toBe(2);
  });
  
  test("should have default max observations of 50", () => {
    const tracker = new ObservationTracker();
    
    // Add 60 observations
    for (let i = 0; i < 60; i++) {
      tracker.recordObservation(`npc-${i}`, `action-${i}`);
    }
    
    expect(tracker.toArray().length).toBe(50);
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker.recordObservation
// ============================================================================

test.describe("ObservationTracker.recordObservation", () => {
  test("should add observation to tracker", () => {
    const tracker = new ObservationTracker();
    
    const obs = tracker.recordObservation("npc-123", "help_npc");
    
    expect(tracker.toArray().length).toBe(1);
    expect(obs.actorId).toBe("npc-123");
    expect(obs.action).toBe("help_npc");
  });
  
  test("should set outcome to 'pending' by default", () => {
    const tracker = new ObservationTracker();
    
    const obs = tracker.recordObservation("npc-123", "help_npc");
    
    expect(obs.outcome).toBe("pending");
  });
  
  test("should set mimicked to false by default", () => {
    const tracker = new ObservationTracker();
    
    const obs = tracker.recordObservation("npc-123", "help_npc");
    
    expect(obs.mimicked).toBe(false);
  });
  
  test("should set observedAt to current timestamp", () => {
    const tracker = new ObservationTracker();
    const beforeTime = Date.now();
    
    const obs = tracker.recordObservation("npc-123", "help_npc");
    
    const afterTime = Date.now();
    expect(obs.observedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(obs.observedAt).toBeLessThanOrEqual(afterTime);
  });
  
  test("should return the created observation", () => {
    const tracker = new ObservationTracker();
    
    const obs = tracker.recordObservation("npc-456", "trade");
    
    expect(obs).toBeDefined();
    expect(obs.actorId).toBe("npc-456");
    expect(obs.action).toBe("trade");
  });
  
  test("should enforce max observations limit (50)", () => {
    const tracker = new ObservationTracker();
    
    for (let i = 0; i < 60; i++) {
      tracker.recordObservation(`npc-${i}`, `action-${i}`);
    }
    
    const all = tracker.toArray();
    expect(all.length).toBe(50);
    // Should keep most recent (last 50)
    expect(all[0].actorId).toBe("npc-10");
    expect(all[49].actorId).toBe("npc-59");
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker.updateOutcome
// ============================================================================

test.describe("ObservationTracker.updateOutcome", () => {
  test("should update outcome of pending observation to success", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-123", "help_npc");
    
    tracker.updateOutcome("npc-123", "help_npc", "success");
    
    const obs = tracker.getObservationsOf("npc-123")[0];
    expect(obs.outcome).toBe("success");
  });
  
  test("should update outcome of pending observation to failure", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-123", "steal");
    
    tracker.updateOutcome("npc-123", "steal", "failure");
    
    const obs = tracker.getObservationsOf("npc-123")[0];
    expect(obs.outcome).toBe("failure");
  });
  
  test("should only update matching actorId and action", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action_a");
    tracker.recordObservation("npc-1", "action_b");
    tracker.recordObservation("npc-2", "action_a");
    
    tracker.updateOutcome("npc-1", "action_a", "success");
    
    const observations = tracker.toArray();
    const npc1ActionA = observations.find(o => o.actorId === "npc-1" && o.action === "action_a");
    const npc1ActionB = observations.find(o => o.actorId === "npc-1" && o.action === "action_b");
    const npc2ActionA = observations.find(o => o.actorId === "npc-2" && o.action === "action_a");
    
    expect(npc1ActionA?.outcome).toBe("success");
    expect(npc1ActionB?.outcome).toBe("pending");
    expect(npc2ActionA?.outcome).toBe("pending");
  });
  
  test("should update most recent matching observation when multiple exist", () => {
    const tracker = new ObservationTracker();
    
    // Record same action twice from same NPC
    tracker.recordObservation("npc-1", "help");
    tracker.recordObservation("npc-1", "help");
    
    tracker.updateOutcome("npc-1", "help", "success");
    
    const observations = tracker.getObservationsOf("npc-1");
    // Most recent (last one) should be updated
    expect(observations[1].outcome).toBe("success");
    // First one should remain pending
    expect(observations[0].outcome).toBe("pending");
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker.markMimicked
// ============================================================================

test.describe("ObservationTracker.markMimicked", () => {
  test("should mark matching observation as mimicked", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-123", "help_npc");
    
    tracker.markMimicked("npc-123", "help_npc");
    
    const obs = tracker.getObservationsOf("npc-123")[0];
    expect(obs.mimicked).toBe(true);
  });
  
  test("should only mark matching actorId and action", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action_a");
    tracker.recordObservation("npc-2", "action_a");
    
    tracker.markMimicked("npc-1", "action_a");
    
    const obs1 = tracker.getObservationsOf("npc-1")[0];
    const obs2 = tracker.getObservationsOf("npc-2")[0];
    
    expect(obs1.mimicked).toBe(true);
    expect(obs2.mimicked).toBe(false);
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker Query Methods
// ============================================================================

test.describe("ObservationTracker.getRecentObservations", () => {
  test("should return last N observations", () => {
    const tracker = new ObservationTracker();
    
    for (let i = 0; i < 10; i++) {
      tracker.recordObservation(`npc-${i}`, `action-${i}`);
    }
    
    const recent = tracker.getRecentObservations(3);
    expect(recent.length).toBe(3);
    expect(recent[0].actorId).toBe("npc-7");
    expect(recent[1].actorId).toBe("npc-8");
    expect(recent[2].actorId).toBe("npc-9");
  });
  
  test("should return all if fewer than requested", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-1");
    tracker.recordObservation("npc-2", "action-2");
    
    const recent = tracker.getRecentObservations(10);
    expect(recent.length).toBe(2);
  });
  
  test("should return empty array if no observations", () => {
    const tracker = new ObservationTracker();
    
    const recent = tracker.getRecentObservations(5);
    expect(recent.length).toBe(0);
  });
});

test.describe("ObservationTracker.getObservationsOf", () => {
  test("should return all observations for a specific NPC", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-a");
    tracker.recordObservation("npc-2", "action-b");
    tracker.recordObservation("npc-1", "action-c");
    tracker.recordObservation("npc-3", "action-d");
    
    const npc1Obs = tracker.getObservationsOf("npc-1");
    
    expect(npc1Obs.length).toBe(2);
    expect(npc1Obs.every(o => o.actorId === "npc-1")).toBe(true);
  });
  
  test("should return empty array for unknown NPC", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-a");
    
    const unknownObs = tracker.getObservationsOf("npc-unknown");
    expect(unknownObs.length).toBe(0);
  });
});

test.describe("ObservationTracker.getPendingObservations", () => {
  test("should return only observations with pending outcome", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-a");
    tracker.recordObservation("npc-2", "action-b");
    tracker.recordObservation("npc-3", "action-c");
    
    tracker.updateOutcome("npc-1", "action-a", "success");
    tracker.updateOutcome("npc-2", "action-b", "failure");
    
    const pending = tracker.getPendingObservations();
    
    expect(pending.length).toBe(1);
    expect(pending[0].actorId).toBe("npc-3");
  });
  
  test("should return empty array if no pending observations", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-a");
    tracker.updateOutcome("npc-1", "action-a", "success");
    
    const pending = tracker.getPendingObservations();
    expect(pending.length).toBe(0);
  });
});

test.describe("ObservationTracker.getSuccessfulObservations", () => {
  test("should return only observations with success outcome", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-a");
    tracker.recordObservation("npc-2", "action-b");
    tracker.recordObservation("npc-3", "action-c");
    
    tracker.updateOutcome("npc-1", "action-a", "success");
    tracker.updateOutcome("npc-2", "action-b", "failure");
    
    const successful = tracker.getSuccessfulObservations();
    
    expect(successful.length).toBe(1);
    expect(successful[0].actorId).toBe("npc-1");
  });
  
  test("should return empty array if no successful observations", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-a");
    
    const successful = tracker.getSuccessfulObservations();
    expect(successful.length).toBe(0);
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker Serialization
// ============================================================================

test.describe("ObservationTracker Serialization", () => {
  test("toArray should return a copy of observations", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-1");
    
    const arr = tracker.toArray();
    arr.push({ actorId: "fake", action: "fake", outcome: "pending", observedAt: 0, mimicked: false });
    
    expect(tracker.toArray().length).toBe(1);
  });
  
  test("fromArray should create ObservationTracker from array", () => {
    const arr: ObservedBehavior[] = [
      { actorId: "npc-1", action: "help", outcome: "success", observedAt: Date.now(), mimicked: true },
      { actorId: "npc-2", action: "steal", outcome: "failure", observedAt: Date.now(), mimicked: false },
    ];
    
    const tracker = ObservationTracker.fromArray(arr);
    
    expect(tracker.toArray().length).toBe(2);
    expect(tracker.getSuccessfulObservations().length).toBe(1);
  });
  
  test("toArray + fromArray should create equivalent tracker", () => {
    const tracker = new ObservationTracker();
    tracker.recordObservation("npc-1", "action-1");
    tracker.recordObservation("npc-2", "action-2");
    tracker.updateOutcome("npc-1", "action-1", "success");
    tracker.markMimicked("npc-1", "action-1");
    
    const arr = tracker.toArray();
    const restored = ObservationTracker.fromArray(arr);
    
    expect(restored.toArray().length).toBe(2);
    expect(restored.getSuccessfulObservations().length).toBe(1);
    expect(restored.getSuccessfulObservations()[0].mimicked).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: calculateMimicryChance
// ============================================================================

test.describe("calculateMimicryChance", () => {
  test("should return higher chance for high openness Titan", () => {
    const highOpenness = createTestTitan({ openness: 0.9 });
    const lowOpenness = createTestTitan({ openness: 0.1 });
    
    const highChance = calculateMimicryChance(highOpenness, "npc-1", "help");
    const lowChance = calculateMimicryChance(lowOpenness, "npc-1", "help");
    
    expect(highChance).toBeGreaterThan(lowChance);
  });
  
  test("should increase chance based on positive NPC opinion", () => {
    const titanWithOpinion = createTestTitan({
      openness: 0.5,
      npcOpinions: new Map([["npc-liked", 80]]),
    });
    const titanNoOpinion = createTestTitan({
      openness: 0.5,
      npcOpinions: new Map(),
    });
    
    const chanceWithOpinion = calculateMimicryChance(titanWithOpinion, "npc-liked", "help");
    const chanceNoOpinion = calculateMimicryChance(titanNoOpinion, "npc-liked", "help");
    
    expect(chanceWithOpinion).toBeGreaterThan(chanceNoOpinion);
  });
  
  test("should decrease chance for actions with high confidence belief", () => {
    const titanWithBelief = createTestTitan({
      openness: 0.5,
      actionBeliefs: new Map([
        ["known_action", { action: "known_action", goodness: 0.5, confidence: 0.8, lastReinforced: Date.now(), reinforcementCount: 10 }],
      ]),
    });
    const titanNoBelief = createTestTitan({
      openness: 0.5,
      actionBeliefs: new Map(),
    });
    
    const chanceWithBelief = calculateMimicryChance(titanWithBelief, "npc-1", "known_action");
    const chanceNoBelief = calculateMimicryChance(titanNoBelief, "npc-1", "known_action");
    
    expect(chanceWithBelief).toBeLessThan(chanceNoBelief);
  });
  
  test("should add curiosity bonus when Titan has curiosity desire", () => {
    const titanCurious = createTestTitan({
      openness: 0.5,
      desires: [{ type: "explore", priority: 0.5, source: "curiosity" }],
    });
    const titanNotCurious = createTestTitan({
      openness: 0.5,
      desires: [{ type: "eat", priority: 0.5, source: "need" }],
    });
    
    const chanceCurious = calculateMimicryChance(titanCurious, "npc-1", "action");
    const chanceNotCurious = calculateMimicryChance(titanNotCurious, "npc-1", "action");
    
    expect(chanceCurious).toBeGreaterThan(chanceNotCurious);
  });
  
  test("should clamp result between 5% and 60%", () => {
    // Very low settings
    const lowTitan = createTestTitan({
      openness: 0.0,
      npcOpinions: new Map([["npc-1", -100]]),
    });
    const lowChance = calculateMimicryChance(lowTitan, "npc-1", "action");
    expect(lowChance).toBeGreaterThanOrEqual(0.05);
    
    // Very high settings
    const highTitan = createTestTitan({
      openness: 1.0,
      npcOpinions: new Map([["npc-1", 100]]),
      desires: [{ type: "explore", priority: 0.9, source: "curiosity" }],
    });
    const highChance = calculateMimicryChance(highTitan, "npc-1", "action");
    expect(highChance).toBeLessThanOrEqual(0.6);
  });
  
  test("should return approximately 0.3 * openness as base chance", () => {
    const titan = createTestTitan({ openness: 0.5 });
    
    // With no other modifiers, base chance should be roughly 0.5 * 0.3 = 0.15
    const chance = calculateMimicryChance(titan, "npc-unknown", "new_action");
    
    // Allow some tolerance for other factors
    expect(chance).toBeGreaterThanOrEqual(0.1);
    expect(chance).toBeLessThanOrEqual(0.25);
  });
});

// ============================================================================
// TEST SUITE: shouldMimicAction
// ============================================================================

test.describe("shouldMimicAction", () => {
  test("should return boolean value", () => {
    const titan = createTestTitan({ openness: 0.5 });
    const observation: ObservedBehavior = {
      actorId: "npc-1",
      action: "help",
      outcome: "success",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    const result = shouldMimicAction(titan, observation);
    expect(typeof result).toBe("boolean");
  });
  
  test("should never mimic already mimicked observations", () => {
    const titan = createTestTitan({ openness: 1.0 }); // Max mimicry chance
    const observation: ObservedBehavior = {
      actorId: "npc-1",
      action: "help",
      outcome: "success",
      observedAt: Date.now(),
      mimicked: true, // Already mimicked
    };
    
    // Should always return false for already mimicked
    const result = shouldMimicAction(titan, observation);
    expect(result).toBe(false);
  });
  
  test("should use calculateMimicryChance internally", () => {
    // High openness Titan should have higher chance to mimic
    const highOpenness = createTestTitan({ openness: 1.0 });
    const observation: ObservedBehavior = {
      actorId: "npc-1",
      action: "help",
      outcome: "pending",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    // Run multiple times and count mimics
    let mimicCount = 0;
    for (let i = 0; i < 100; i++) {
      // Reset mimicked flag for each test
      const testObs = { ...observation, mimicked: false };
      if (shouldMimicAction(highOpenness, testObs)) {
        mimicCount++;
      }
    }
    
    // With max mimicry (60%), we expect roughly 30-70 mimics
    // Using >= 20 to account for random variance (rare but possible edge case)
    expect(mimicCount).toBeGreaterThanOrEqual(20); // At least some mimics
  });
});

// ============================================================================
// TEST SUITE: processObservation
// ============================================================================

test.describe("processObservation", () => {
  test("should record observation in tracker", () => {
    const titan = createTestTitan({ openness: 0.5 });
    const tracker = new ObservationTracker();
    
    processObservation(titan, "npc-123", "help_npc", tracker);
    
    expect(tracker.toArray().length).toBe(1);
    expect(tracker.toArray()[0].actorId).toBe("npc-123");
    expect(tracker.toArray()[0].action).toBe("help_npc");
  });
  
  test("should return observation object", () => {
    const titan = createTestTitan({ openness: 0.5 });
    const tracker = new ObservationTracker();
    
    const result = processObservation(titan, "npc-123", "help_npc", tracker);
    
    expect(result.observation).toBeDefined();
    expect(result.observation.actorId).toBe("npc-123");
    expect(result.observation.action).toBe("help_npc");
  });
  
  test("should return shouldMimic boolean", () => {
    const titan = createTestTitan({ openness: 0.5 });
    const tracker = new ObservationTracker();
    
    const result = processObservation(titan, "npc-123", "help_npc", tracker);
    
    expect(typeof result.shouldMimic).toBe("boolean");
  });
  
  test("should mark observation as mimicked when shouldMimic is true", () => {
    // Create highly mimicry-prone titan
    const titan = createTestTitan({
      openness: 1.0,
      npcOpinions: new Map([["npc-1", 100]]),
      desires: [{ type: "explore", priority: 0.9, source: "curiosity" }],
    });
    const tracker = new ObservationTracker();
    
    // Process many times to get at least one mimic
    let foundMimic = false;
    for (let i = 0; i < 50; i++) {
      const newTracker = new ObservationTracker();
      const result = processObservation(titan, "npc-1", "help", newTracker);
      if (result.shouldMimic) {
        foundMimic = true;
        expect(result.observation.mimicked).toBe(true);
        break;
      }
    }
    
    expect(foundMimic).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: learnFromMimicry
// ============================================================================

test.describe("learnFromMimicry", () => {
  test("should increase goodness for successful mimicry", () => {
    const beliefMap = new ActionBeliefMap();
    
    learnFromMimicry(beliefMap, "helped_npc", "success");
    
    const goodness = beliefMap.getActionGoodness("helped_npc");
    expect(goodness).toBeGreaterThan(0);
  });
  
  test("should decrease goodness for failed mimicry", () => {
    const beliefMap = new ActionBeliefMap();
    
    learnFromMimicry(beliefMap, "bad_action", "failure");
    
    const goodness = beliefMap.getActionGoodness("bad_action");
    expect(goodness).toBeLessThan(0);
  });
  
  test("should use magnitude of 0.5 (less than direct training)", () => {
    const mimicryBeliefs = new ActionBeliefMap();
    const directBeliefs = new ActionBeliefMap();
    
    // Learn from mimicry
    learnFromMimicry(mimicryBeliefs, "action", "success");
    
    // Learn from direct training (full magnitude)
    directBeliefs.reinforceAction("action", true, 1.0);
    
    // Mimicry learning should be weaker
    expect(mimicryBeliefs.getActionGoodness("action")).toBeLessThan(
      directBeliefs.getActionGoodness("action")
    );
  });
  
  test("should create belief if none exists", () => {
    const beliefMap = new ActionBeliefMap();
    
    expect(beliefMap.hasActionBelief("new_action")).toBe(false);
    
    learnFromMimicry(beliefMap, "new_action", "success");
    
    expect(beliefMap.hasActionBelief("new_action")).toBe(true);
  });
  
  test("should update existing belief", () => {
    const beliefMap = new ActionBeliefMap();
    
    // Establish initial belief
    beliefMap.reinforceAction("action", true, 1.0);
    const initialGoodness = beliefMap.getActionGoodness("action");
    
    // Learn from mimicry failure
    learnFromMimicry(beliefMap, "action", "failure");
    
    // Goodness should decrease
    expect(beliefMap.getActionGoodness("action")).toBeLessThan(initialGoodness);
  });
});

// ============================================================================
// TEST SUITE: TitanBDI.processNPCObservation Integration
// ============================================================================

test.describe("TitanBDI.processNPCObservation", () => {
  test("should exist as a method on TitanBDI", () => {
    const bdi = new TitanBDI();
    
    expect(typeof bdi.processNPCObservation).toBe("function");
  });
  
  test("should accept npcId, action, and optional outcome", () => {
    const bdi = new TitanBDI();
    
    // Should not throw
    expect(() => {
      bdi.processNPCObservation("npc-1", "help");
    }).not.toThrow();
    
    expect(() => {
      bdi.processNPCObservation("npc-1", "help", "success");
    }).not.toThrow();
  });
  
  test("should update NPC opinion based on observation", () => {
    const bdi = new TitanBDI();
    
    const initialOpinion = bdi.getNPCOpinion("npc-1");
    
    // Observe successful action
    bdi.processNPCObservation("npc-1", "help", "success");
    
    const newOpinion = bdi.getNPCOpinion("npc-1");
    expect(newOpinion).toBeGreaterThan(initialOpinion);
  });
});

// ============================================================================
// TEST SUITE: Integration Tests
// ============================================================================

test.describe("Observation Learning Integration", () => {
  test("full observation-to-mimicry-to-learning flow", () => {
    const titan = createTestTitan({
      openness: 0.8,
      npcOpinions: new Map([["npc-mentor", 80]]),
    });
    const tracker = new ObservationTracker();
    const beliefMap = new ActionBeliefMap();
    
    // Step 1: Titan observes NPC action
    const { shouldMimic, observation } = processObservation(
      titan,
      "npc-mentor",
      "help_other_npc",
      tracker
    );
    
    expect(observation).toBeDefined();
    expect(observation.outcome).toBe("pending");
    
    // Step 2: If Titan mimics, track it
    if (shouldMimic) {
      expect(observation.mimicked).toBe(true);
      
      // Step 3: Mimicked action succeeds
      tracker.updateOutcome("npc-mentor", "help_other_npc", "success");
      
      // Step 4: Learn from the outcome
      learnFromMimicry(beliefMap, "help_other_npc", "success");
      
      // Belief should now be positive
      expect(beliefMap.getActionGoodness("help_other_npc")).toBeGreaterThan(0);
    }
  });
  
  test("personality affects mimicry likelihood over multiple trials", () => {
    const openTitan = createTestTitan({ openness: 0.9 });
    const closedTitan = createTestTitan({ openness: 0.1 });
    
    let openMimicCount = 0;
    let closedMimicCount = 0;
    
    const observation: ObservedBehavior = {
      actorId: "npc-1",
      action: "new_action",
      outcome: "pending",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    // Run 100 trials for each
    for (let i = 0; i < 100; i++) {
      const openObs = { ...observation, mimicked: false };
      const closedObs = { ...observation, mimicked: false };
      
      if (shouldMimicAction(openTitan, openObs)) openMimicCount++;
      if (shouldMimicAction(closedTitan, closedObs)) closedMimicCount++;
    }
    
    // Open Titan should mimic more often
    expect(openMimicCount).toBeGreaterThan(closedMimicCount);
  });
  
  test("high confidence beliefs reduce mimicry of known actions", () => {
    const titanWithKnowledge = createTestTitan({
      openness: 0.8,
      actionBeliefs: new Map([
        ["known_action", { action: "known_action", goodness: 0.8, confidence: 0.9, lastReinforced: Date.now(), reinforcementCount: 20 }],
      ]),
    });
    const titanWithoutKnowledge = createTestTitan({
      openness: 0.8,
      actionBeliefs: new Map(),
    });
    
    let knowledgeMimicCount = 0;
    let noKnowledgeMimicCount = 0;
    
    const observation: ObservedBehavior = {
      actorId: "npc-1",
      action: "known_action",
      outcome: "pending",
      observedAt: Date.now(),
      mimicked: false,
    };
    
    // Run 100 trials
    for (let i = 0; i < 100; i++) {
      const knownObs = { ...observation, mimicked: false };
      const unknownObs = { ...observation, mimicked: false };
      
      if (shouldMimicAction(titanWithKnowledge, knownObs)) knowledgeMimicCount++;
      if (shouldMimicAction(titanWithoutKnowledge, unknownObs)) noKnowledgeMimicCount++;
    }
    
    // Titan with knowledge should mimic less
    expect(knowledgeMimicCount).toBeLessThan(noKnowledgeMimicCount);
  });
});
