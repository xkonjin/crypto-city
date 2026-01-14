import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Learning System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements the system where Titan learns which actions are good/bad through reinforcement.
 * 
 * Based on Black & White's creature learning system:
 * - ActionBeliefMap: Tracks beliefs about actions (good/bad)
 * - ActionHistoryTracker: Records actions for training windows
 */

import type { ActionBelief, ActionHistoryEntry } from "@/games/isocity/types/titan";
import {
  ActionBeliefMap,
  ActionHistoryTracker,
  DEFAULT_MAX_BELIEFS,
  DEFAULT_MAX_HISTORY,
  TRAINING_WINDOW_MS,
  BELIEF_DECAY_RATE,
} from "@/lib/titan/TitanLearning";

// ============================================================================
// TEST SUITE: ActionBeliefMap Constants
// ============================================================================

test.describe("ActionBeliefMap Constants", () => {
  test("should have max beliefs default of 100", () => {
    expect(DEFAULT_MAX_BELIEFS).toBe(100);
  });

  test("should have belief decay rate of 0.001 per game minute", () => {
    expect(BELIEF_DECAY_RATE).toBe(0.001);
  });

  test("should have training window of 3000ms (3 seconds)", () => {
    expect(TRAINING_WINDOW_MS).toBe(3000);
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap Constructor
// ============================================================================

test.describe("ActionBeliefMap Constructor", () => {
  test("should create empty map when no initial beliefs provided", () => {
    const beliefs = new ActionBeliefMap();
    expect(beliefs.size()).toBe(0);
  });

  test("should accept initial beliefs via Map", () => {
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.3, lastReinforced: Date.now(), reinforcementCount: 3 }],
      ['steal', { action: 'steal', goodness: -0.5, confidence: 0.4, lastReinforced: Date.now(), reinforcementCount: 4 }],
    ]);

    const beliefs = new ActionBeliefMap(initialBeliefs);
    expect(beliefs.size()).toBe(2);
  });

  test("should accept custom maxBeliefs", () => {
    const beliefs = new ActionBeliefMap(undefined, 50);
    // Size should still be 0, but the limit is 50
    expect(beliefs.size()).toBe(0);
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap Core Methods
// ============================================================================

test.describe("ActionBeliefMap Core Methods", () => {
  test("hasActionBelief should return false for unknown actions", () => {
    const beliefs = new ActionBeliefMap();
    expect(beliefs.hasActionBelief('unknown_action')).toBe(false);
  });

  test("hasActionBelief should return true for known actions", () => {
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.3, lastReinforced: Date.now(), reinforcementCount: 1 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    expect(beliefs.hasActionBelief('help_npc')).toBe(true);
  });

  test("getActionBelief should return undefined for unknown actions", () => {
    const beliefs = new ActionBeliefMap();
    expect(beliefs.getActionBelief('unknown_action')).toBeUndefined();
  });

  test("getActionBelief should return the belief for known actions", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.3, lastReinforced: now, reinforcementCount: 2 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    const belief = beliefs.getActionBelief('help_npc');
    expect(belief).toBeDefined();
    expect(belief!.action).toBe('help_npc');
    expect(belief!.goodness).toBe(0.5);
    expect(belief!.confidence).toBe(0.3);
  });

  test("getActionGoodness should return 0 for unknown actions", () => {
    const beliefs = new ActionBeliefMap();
    expect(beliefs.getActionGoodness('unknown_action')).toBe(0);
  });

  test("getActionGoodness should return the goodness value for known actions", () => {
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.7, confidence: 0.5, lastReinforced: Date.now(), reinforcementCount: 5 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    expect(beliefs.getActionGoodness('help_npc')).toBe(0.7);
  });

  test("getActionConfidence should return 0 for unknown actions", () => {
    const beliefs = new ActionBeliefMap();
    expect(beliefs.getActionConfidence('unknown_action')).toBe(0);
  });

  test("getActionConfidence should return the confidence value for known actions", () => {
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.8, lastReinforced: Date.now(), reinforcementCount: 10 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    expect(beliefs.getActionConfidence('help_npc')).toBe(0.8);
  });

  test("getAllBeliefs should return all beliefs as an array", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.3, lastReinforced: now, reinforcementCount: 1 }],
      ['steal', { action: 'steal', goodness: -0.5, confidence: 0.4, lastReinforced: now, reinforcementCount: 2 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    const all = beliefs.getAllBeliefs();
    expect(all.length).toBe(2);
    expect(all.map(b => b.action).sort()).toEqual(['help_npc', 'steal']);
  });

  test("toMap should return a copy of the internal map", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.3, lastReinforced: now, reinforcementCount: 1 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    const map = beliefs.toMap();
    expect(map.size).toBe(1);
    expect(map.get('help_npc')).toBeDefined();
    
    // Should be a copy, not the same reference
    map.set('new_action', { action: 'new_action', goodness: 0, confidence: 0, lastReinforced: now, reinforcementCount: 0 });
    expect(beliefs.size()).toBe(1); // Original unchanged
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap Reinforcement
// ============================================================================

test.describe("ActionBeliefMap Reinforcement", () => {
  test("should create new belief when reinforcing unknown action", () => {
    const beliefs = new ActionBeliefMap();
    beliefs.reinforceAction('help_npc', true);
    
    expect(beliefs.hasActionBelief('help_npc')).toBe(true);
    const belief = beliefs.getActionBelief('help_npc');
    expect(belief).toBeDefined();
  });

  test("reinforcing with isGood=true should increase goodness", () => {
    const beliefs = new ActionBeliefMap();
    beliefs.reinforceAction('help_npc', true);
    
    const goodness = beliefs.getActionGoodness('help_npc');
    expect(goodness).toBeGreaterThan(0);
  });

  test("reinforcing with isGood=false should decrease goodness", () => {
    const beliefs = new ActionBeliefMap();
    beliefs.reinforceAction('steal', false);
    
    const goodness = beliefs.getActionGoodness('steal');
    expect(goodness).toBeLessThan(0);
  });

  test("repeated reinforcement should increase confidence", () => {
    const beliefs = new ActionBeliefMap();
    
    beliefs.reinforceAction('help_npc', true);
    const conf1 = beliefs.getActionConfidence('help_npc');
    
    beliefs.reinforceAction('help_npc', true);
    const conf2 = beliefs.getActionConfidence('help_npc');
    
    beliefs.reinforceAction('help_npc', true);
    const conf3 = beliefs.getActionConfidence('help_npc');
    
    expect(conf2).toBeGreaterThan(conf1);
    expect(conf3).toBeGreaterThan(conf2);
  });

  test("confidence should have diminishing returns", () => {
    const beliefs = new ActionBeliefMap();
    
    beliefs.reinforceAction('help_npc', true);
    const conf1 = beliefs.getActionConfidence('help_npc');
    
    beliefs.reinforceAction('help_npc', true);
    const conf2 = beliefs.getActionConfidence('help_npc');
    const increase1 = conf2 - conf1;
    
    beliefs.reinforceAction('help_npc', true);
    const conf3 = beliefs.getActionConfidence('help_npc');
    const increase2 = conf3 - conf2;
    
    // Second increase should be smaller than first (diminishing returns)
    expect(increase2).toBeLessThan(increase1);
  });

  test("confidence should never exceed 1", () => {
    const beliefs = new ActionBeliefMap();
    
    // Reinforce many times
    for (let i = 0; i < 100; i++) {
      beliefs.reinforceAction('help_npc', true);
    }
    
    expect(beliefs.getActionConfidence('help_npc')).toBeLessThanOrEqual(1);
  });

  test("goodness should never exceed 1", () => {
    const beliefs = new ActionBeliefMap();
    
    for (let i = 0; i < 100; i++) {
      beliefs.reinforceAction('help_npc', true);
    }
    
    expect(beliefs.getActionGoodness('help_npc')).toBeLessThanOrEqual(1);
  });

  test("goodness should never go below -1", () => {
    const beliefs = new ActionBeliefMap();
    
    for (let i = 0; i < 100; i++) {
      beliefs.reinforceAction('steal', false);
    }
    
    expect(beliefs.getActionGoodness('steal')).toBeGreaterThanOrEqual(-1);
  });

  test("learning rate should decrease with more reinforcements", () => {
    const beliefs = new ActionBeliefMap();
    
    // First reinforcement
    beliefs.reinforceAction('action1', true);
    const goodness1 = beliefs.getActionGoodness('action1');
    
    // Create new action to compare
    const beliefs2 = new ActionBeliefMap();
    
    // Reinforce same action many times first
    for (let i = 0; i < 10; i++) {
      beliefs2.reinforceAction('action2', true);
    }
    // Store goodness before this final reinforcement
    const before = beliefs2.getActionGoodness('action2');
    beliefs2.reinforceAction('action2', true);
    const after = beliefs2.getActionGoodness('action2');
    const change = after - before;
    
    // First action got a bigger initial change than the 11th reinforcement change
    expect(goodness1).toBeGreaterThan(change);
  });

  test("reinforcement should update lastReinforced timestamp", () => {
    const beliefs = new ActionBeliefMap();
    const beforeTime = Date.now();
    
    beliefs.reinforceAction('help_npc', true);
    
    const afterTime = Date.now();
    const belief = beliefs.getActionBelief('help_npc');
    
    expect(belief!.lastReinforced).toBeGreaterThanOrEqual(beforeTime);
    expect(belief!.lastReinforced).toBeLessThanOrEqual(afterTime);
  });

  test("reinforcement should increment reinforcementCount", () => {
    const beliefs = new ActionBeliefMap();
    
    beliefs.reinforceAction('help_npc', true);
    expect(beliefs.getActionBelief('help_npc')!.reinforcementCount).toBe(1);
    
    beliefs.reinforceAction('help_npc', true);
    expect(beliefs.getActionBelief('help_npc')!.reinforcementCount).toBe(2);
    
    beliefs.reinforceAction('help_npc', false);
    expect(beliefs.getActionBelief('help_npc')!.reinforcementCount).toBe(3);
  });

  test("magnitude parameter should affect the change amount", () => {
    const beliefs1 = new ActionBeliefMap();
    const beliefs2 = new ActionBeliefMap();
    
    beliefs1.reinforceAction('action1', true, 1.0);
    beliefs2.reinforceAction('action2', true, 0.5);
    
    const goodness1 = beliefs1.getActionGoodness('action1');
    const goodness2 = beliefs2.getActionGoodness('action2');
    
    // Full magnitude should cause bigger change
    expect(goodness1).toBeGreaterThan(goodness2);
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap Decay
// ============================================================================

test.describe("ActionBeliefMap Decay", () => {
  test("beliefs should decay toward neutral (0) over time", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.8, confidence: 0.5, lastReinforced: now, reinforcementCount: 5 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    beliefs.decayBeliefs(100); // 100 game minutes
    
    const goodness = beliefs.getActionGoodness('help_npc');
    expect(goodness).toBeLessThan(0.8);
    expect(goodness).toBeGreaterThan(0);
  });

  test("negative goodness should decay toward 0", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['steal', { action: 'steal', goodness: -0.8, confidence: 0.5, lastReinforced: now, reinforcementCount: 5 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    beliefs.decayBeliefs(100);
    
    const goodness = beliefs.getActionGoodness('steal');
    expect(goodness).toBeGreaterThan(-0.8);
    expect(goodness).toBeLessThan(0);
  });

  test("low confidence beliefs should decay faster", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['action1', { action: 'action1', goodness: 0.8, confidence: 0.2, lastReinforced: now, reinforcementCount: 2 }],
      ['action2', { action: 'action2', goodness: 0.8, confidence: 0.9, lastReinforced: now, reinforcementCount: 10 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    beliefs.decayBeliefs(100);
    
    const goodness1 = beliefs.getActionGoodness('action1');
    const goodness2 = beliefs.getActionGoodness('action2');
    
    // Low confidence (action1) should have decayed more
    expect(goodness1).toBeLessThan(goodness2);
  });

  test("zero deltaMinutes should cause no decay", () => {
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.8, confidence: 0.5, lastReinforced: now, reinforcementCount: 5 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    beliefs.decayBeliefs(0);
    
    expect(beliefs.getActionGoodness('help_npc')).toBe(0.8);
  });

  test("decay formula should be goodness *= (1 - decayRate * (1 - confidence))", () => {
    const now = Date.now();
    const confidence = 0.4;
    const initialGoodness = 0.8;
    const initialBeliefs = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: initialGoodness, confidence, lastReinforced: now, reinforcementCount: 5 }],
    ]);
    const beliefs = new ActionBeliefMap(initialBeliefs);
    
    const deltaMinutes = 10;
    beliefs.decayBeliefs(deltaMinutes);
    
    // Expected: goodness *= (1 - 0.001 * deltaMinutes * (1 - confidence))
    const expectedFactor = 1 - BELIEF_DECAY_RATE * deltaMinutes * (1 - confidence);
    const expectedGoodness = initialGoodness * expectedFactor;
    
    expect(beliefs.getActionGoodness('help_npc')).toBeCloseTo(expectedGoodness, 6);
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap LRU Eviction
// ============================================================================

test.describe("ActionBeliefMap LRU Eviction", () => {
  test("should evict oldest beliefs when exceeding maxBeliefs", () => {
    const maxBeliefs = 5;
    const beliefs = new ActionBeliefMap(undefined, maxBeliefs);
    
    // Add beliefs with staggered timestamps
    const baseTime = Date.now();
    for (let i = 0; i < 10; i++) {
      const action = `action_${i}`;
      // Manually set belief with specific timestamp
      beliefs.reinforceAction(action, true);
    }
    
    // Should have only 5 beliefs
    expect(beliefs.size()).toBe(maxBeliefs);
  });

  test("should keep most recently reinforced beliefs", () => {
    const maxBeliefs = 3;
    const beliefs = new ActionBeliefMap(undefined, maxBeliefs);
    
    // Add first action
    beliefs.reinforceAction('old_action', true);
    
    // Add more actions
    beliefs.reinforceAction('action_1', true);
    beliefs.reinforceAction('action_2', true);
    beliefs.reinforceAction('action_3', true);
    
    // old_action should be evicted
    expect(beliefs.hasActionBelief('old_action')).toBe(false);
    expect(beliefs.hasActionBelief('action_3')).toBe(true);
  });

  test("reinforcing existing action should update its LRU position", () => {
    const maxBeliefs = 3;
    
    // Use pre-set timestamps to control LRU order deterministically
    const now = Date.now();
    const initialBeliefs = new Map<string, ActionBelief>([
      ['action_1', { action: 'action_1', goodness: 0.3, confidence: 0.1, lastReinforced: now - 3000, reinforcementCount: 1 }],
      ['action_2', { action: 'action_2', goodness: 0.3, confidence: 0.1, lastReinforced: now - 2000, reinforcementCount: 1 }],
      ['action_3', { action: 'action_3', goodness: 0.3, confidence: 0.1, lastReinforced: now - 1000, reinforcementCount: 1 }],
    ]);
    
    const beliefs = new ActionBeliefMap(initialBeliefs, maxBeliefs);
    
    // Re-reinforce action_1 (should move to most recent)
    beliefs.reinforceAction('action_1', true);
    
    // Add a new action - should evict action_2 (oldest now)
    beliefs.reinforceAction('action_4', true);
    
    expect(beliefs.hasActionBelief('action_1')).toBe(true);
    expect(beliefs.hasActionBelief('action_2')).toBe(false);
    expect(beliefs.hasActionBelief('action_3')).toBe(true);
    expect(beliefs.hasActionBelief('action_4')).toBe(true);
  });

  test("should use default maxBeliefs of 100", () => {
    const beliefs = new ActionBeliefMap();
    
    // Add 110 beliefs
    for (let i = 0; i < 110; i++) {
      beliefs.reinforceAction(`action_${i}`, true);
    }
    
    // Should have only 100
    expect(beliefs.size()).toBe(DEFAULT_MAX_BELIEFS);
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap Serialization
// ============================================================================

test.describe("ActionBeliefMap Serialization", () => {
  test("fromMap should create ActionBeliefMap from Map", () => {
    const now = Date.now();
    const map = new Map<string, ActionBelief>([
      ['help_npc', { action: 'help_npc', goodness: 0.5, confidence: 0.3, lastReinforced: now, reinforcementCount: 3 }],
      ['steal', { action: 'steal', goodness: -0.5, confidence: 0.4, lastReinforced: now, reinforcementCount: 4 }],
    ]);
    
    const beliefs = ActionBeliefMap.fromMap(map);
    
    expect(beliefs.size()).toBe(2);
    expect(beliefs.getActionGoodness('help_npc')).toBe(0.5);
    expect(beliefs.getActionGoodness('steal')).toBe(-0.5);
  });

  test("toMap + fromMap should create equivalent ActionBeliefMap", () => {
    const beliefs = new ActionBeliefMap();
    beliefs.reinforceAction('help_npc', true);
    beliefs.reinforceAction('steal', false);
    
    const map = beliefs.toMap();
    const restored = ActionBeliefMap.fromMap(map);
    
    expect(restored.size()).toBe(beliefs.size());
    expect(restored.getActionGoodness('help_npc')).toBeCloseTo(beliefs.getActionGoodness('help_npc'), 6);
    expect(restored.getActionGoodness('steal')).toBeCloseTo(beliefs.getActionGoodness('steal'), 6);
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker Constants
// ============================================================================

test.describe("ActionHistoryTracker Constants", () => {
  test("should have max history default of 500", () => {
    expect(DEFAULT_MAX_HISTORY).toBe(500);
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker Constructor
// ============================================================================

test.describe("ActionHistoryTracker Constructor", () => {
  test("should create empty history when no initial history provided", () => {
    const tracker = new ActionHistoryTracker();
    expect(tracker.toArray().length).toBe(0);
  });

  test("should accept initial history via array", () => {
    const initialHistory: ActionHistoryEntry[] = [
      { action: 'help_npc', timestamp: Date.now() - 1000, alignmentImpact: -0.05 },
      { action: 'steal', timestamp: Date.now(), alignmentImpact: 0.1 },
    ];
    
    const tracker = new ActionHistoryTracker(initialHistory);
    expect(tracker.toArray().length).toBe(2);
  });

  test("should accept custom maxHistory", () => {
    const tracker = new ActionHistoryTracker(undefined, 50);
    expect(tracker.toArray().length).toBe(0);
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker Core Methods
// ============================================================================

test.describe("ActionHistoryTracker Core Methods", () => {
  test("recordAction should add action to history", () => {
    const tracker = new ActionHistoryTracker();
    
    tracker.recordAction('help_npc', -0.05);
    
    expect(tracker.toArray().length).toBe(1);
    expect(tracker.toArray()[0].action).toBe('help_npc');
  });

  test("recordAction should set timestamp to current time", () => {
    const tracker = new ActionHistoryTracker();
    const beforeTime = Date.now();
    
    tracker.recordAction('help_npc', -0.05);
    
    const afterTime = Date.now();
    const entry = tracker.toArray()[0];
    
    expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
  });

  test("recordAction should store alignmentImpact", () => {
    const tracker = new ActionHistoryTracker();
    
    tracker.recordAction('help_npc', -0.05);
    tracker.recordAction('steal', 0.1);
    
    const history = tracker.toArray();
    expect(history[0].alignmentImpact).toBe(-0.05);
    expect(history[1].alignmentImpact).toBe(0.1);
  });

  test("getLastAction should return null for empty history", () => {
    const tracker = new ActionHistoryTracker();
    expect(tracker.getLastAction()).toBeNull();
  });

  test("getLastAction should return most recent action", () => {
    const tracker = new ActionHistoryTracker();
    
    tracker.recordAction('action_1', 0);
    tracker.recordAction('action_2', 0);
    tracker.recordAction('action_3', 0);
    
    expect(tracker.getLastAction()!.action).toBe('action_3');
  });

  test("getRecentActions should return last N actions", () => {
    const tracker = new ActionHistoryTracker();
    
    tracker.recordAction('action_1', 0);
    tracker.recordAction('action_2', 0);
    tracker.recordAction('action_3', 0);
    tracker.recordAction('action_4', 0);
    tracker.recordAction('action_5', 0);
    
    const recent = tracker.getRecentActions(3);
    expect(recent.length).toBe(3);
    expect(recent.map(e => e.action)).toEqual(['action_3', 'action_4', 'action_5']);
  });

  test("getRecentActions should return all if fewer than requested", () => {
    const tracker = new ActionHistoryTracker();
    
    tracker.recordAction('action_1', 0);
    tracker.recordAction('action_2', 0);
    
    const recent = tracker.getRecentActions(10);
    expect(recent.length).toBe(2);
  });

  test("getActionsWithinTime should return actions within time window", () => {
    const tracker = new ActionHistoryTracker();
    const now = Date.now();
    
    // Add some old actions via constructor (with manual timestamps)
    const initialHistory: ActionHistoryEntry[] = [
      { action: 'old_action', timestamp: now - 10000, alignmentImpact: 0 },
      { action: 'recent_action_1', timestamp: now - 2000, alignmentImpact: 0 },
      { action: 'recent_action_2', timestamp: now - 1000, alignmentImpact: 0 },
    ];
    
    const trackerWithHistory = new ActionHistoryTracker(initialHistory);
    
    const withinWindow = trackerWithHistory.getActionsWithinTime(5000);
    expect(withinWindow.length).toBe(2);
    expect(withinWindow.map(e => e.action)).toContain('recent_action_1');
    expect(withinWindow.map(e => e.action)).toContain('recent_action_2');
  });

  test("toArray should return a copy of history", () => {
    const tracker = new ActionHistoryTracker();
    tracker.recordAction('action_1', 0);
    
    const arr = tracker.toArray();
    arr.push({ action: 'fake', timestamp: 0, alignmentImpact: 0 });
    
    expect(tracker.toArray().length).toBe(1); // Original unchanged
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker Training Window
// ============================================================================

test.describe("ActionHistoryTracker Training Window", () => {
  test("getTrainableAction should return null for empty history", () => {
    const tracker = new ActionHistoryTracker();
    expect(tracker.getTrainableAction()).toBeNull();
  });

  test("getTrainableAction should return last action if within 3 seconds", () => {
    const tracker = new ActionHistoryTracker();
    tracker.recordAction('help_npc', -0.05);
    
    // Immediately after recording, should be trainable
    const trainable = tracker.getTrainableAction();
    expect(trainable).not.toBeNull();
    expect(trainable!.action).toBe('help_npc');
  });

  test("getTrainableAction should return null if last action is older than 3 seconds", () => {
    const now = Date.now();
    const initialHistory: ActionHistoryEntry[] = [
      { action: 'old_action', timestamp: now - 5000, alignmentImpact: 0 },
    ];
    
    const tracker = new ActionHistoryTracker(initialHistory);
    expect(tracker.getTrainableAction()).toBeNull();
  });

  test("training window is exactly 3000ms", () => {
    const now = Date.now();
    
    // Action exactly at the boundary (3000ms ago)
    const initialHistory1: ActionHistoryEntry[] = [
      { action: 'boundary_action', timestamp: now - 3000, alignmentImpact: 0 },
    ];
    const tracker1 = new ActionHistoryTracker(initialHistory1);
    
    // Action clearly inside the window (2500ms ago - safe margin)
    const initialHistory2: ActionHistoryEntry[] = [
      { action: 'inside_action', timestamp: now - 2500, alignmentImpact: 0 },
    ];
    const tracker2 = new ActionHistoryTracker(initialHistory2);
    
    // Action clearly outside the window (3500ms ago - safe margin)
    const initialHistory3: ActionHistoryEntry[] = [
      { action: 'outside_action', timestamp: now - 3500, alignmentImpact: 0 },
    ];
    const tracker3 = new ActionHistoryTracker(initialHistory3);
    
    // Boundary should NOT be trainable (elapsed >= 3000ms)
    expect(tracker1.getTrainableAction()).toBeNull();
    // Inside should be trainable
    expect(tracker2.getTrainableAction()).not.toBeNull();
    // Outside should NOT be trainable
    expect(tracker3.getTrainableAction()).toBeNull();
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker History Limit
// ============================================================================

test.describe("ActionHistoryTracker History Limit", () => {
  test("should limit history to maxHistory entries", () => {
    const maxHistory = 10;
    const tracker = new ActionHistoryTracker(undefined, maxHistory);
    
    for (let i = 0; i < 20; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }
    
    expect(tracker.toArray().length).toBe(maxHistory);
  });

  test("should keep most recent entries when limit is exceeded", () => {
    const maxHistory = 5;
    const tracker = new ActionHistoryTracker(undefined, maxHistory);
    
    for (let i = 0; i < 10; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }
    
    const history = tracker.toArray();
    expect(history[0].action).toBe('action_5'); // Oldest kept
    expect(history[4].action).toBe('action_9'); // Most recent
  });

  test("should use default maxHistory of 500", () => {
    const tracker = new ActionHistoryTracker();
    
    for (let i = 0; i < 600; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }
    
    expect(tracker.toArray().length).toBe(DEFAULT_MAX_HISTORY);
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker Serialization
// ============================================================================

test.describe("ActionHistoryTracker Serialization", () => {
  test("fromArray should create ActionHistoryTracker from array", () => {
    const arr: ActionHistoryEntry[] = [
      { action: 'help_npc', timestamp: Date.now() - 1000, alignmentImpact: -0.05 },
      { action: 'steal', timestamp: Date.now(), alignmentImpact: 0.1 },
    ];
    
    const tracker = ActionHistoryTracker.fromArray(arr);
    
    expect(tracker.toArray().length).toBe(2);
    expect(tracker.getLastAction()!.action).toBe('steal');
  });

  test("toArray + fromArray should create equivalent tracker", () => {
    const tracker = new ActionHistoryTracker();
    tracker.recordAction('action_1', -0.05);
    tracker.recordAction('action_2', 0.1);
    
    const arr = tracker.toArray();
    const restored = ActionHistoryTracker.fromArray(arr);
    
    expect(restored.toArray().length).toBe(tracker.toArray().length);
    expect(restored.getLastAction()!.action).toBe(tracker.getLastAction()!.action);
  });
});

// ============================================================================
// TEST SUITE: Integration Tests
// ============================================================================

test.describe("TitanLearning Integration", () => {
  test("training flow: action -> trainable -> reinforce", () => {
    const history = new ActionHistoryTracker();
    const beliefs = new ActionBeliefMap();
    
    // Titan performs an action
    history.recordAction('help_npc', -0.05);
    
    // Check if trainable (within 3 seconds)
    const trainable = history.getTrainableAction();
    expect(trainable).not.toBeNull();
    
    // Player praises the action
    beliefs.reinforceAction(trainable!.action, true);
    
    // Belief should now be positive
    expect(beliefs.getActionGoodness('help_npc')).toBeGreaterThan(0);
  });

  test("beliefs and history work together for alignment calculation", () => {
    const history = new ActionHistoryTracker();
    const beliefs = new ActionBeliefMap();
    
    // Train some beliefs
    beliefs.reinforceAction('help_npc', true);
    beliefs.reinforceAction('steal', false);
    
    // Record actions
    history.recordAction('help_npc', -0.05);
    history.recordAction('steal', 0.1);
    
    // Get recent actions
    const recent = history.getRecentActions(10);
    
    // Calculate total alignment impact weighted by belief
    let totalImpact = 0;
    for (const entry of recent) {
      const goodness = beliefs.getActionGoodness(entry.action);
      totalImpact += entry.alignmentImpact * (1 + goodness);
    }
    
    // Impact should be non-zero
    expect(totalImpact).not.toBe(0);
  });
});
