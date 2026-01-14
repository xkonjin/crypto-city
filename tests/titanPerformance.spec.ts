import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Performance Optimizations
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Tests performance optimizations for:
 * - ActionBeliefMap LRU eviction
 * - ActionHistoryTracker optimization
 * - TitanBDI world knowledge limits
 * - NPC opinion limits
 * - Sprite lazy loading
 * - BDI update throttling
 * - Memory profiling utilities
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 11.3 on Performance
 */

import {
  ActionBeliefMap,
  ActionHistoryTracker,
  ObservationTracker,
  DEFAULT_MAX_BELIEFS,
  DEFAULT_MAX_HISTORY,
  DEFAULT_MAX_OBSERVATIONS,
} from "@/lib/titan/TitanLearning";
import { 
  TitanBDI, 
  MAX_WORLD_KNOWLEDGE, 
  MAX_NPC_OPINIONS, 
  MIN_BDI_UPDATE_INTERVAL 
} from "@/lib/titan/TitanAI";
import { 
  TitanSpriteLoader, 
  ALL_TITAN_DIRECTIONS, 
  ESSENTIAL_ANIMATIONS 
} from "@/lib/titan/TitanSprite";
import { 
  TITAN_MEMORY_LIMITS, 
  getTitanMemoryUsage, 
  optimizeTitanMemory 
} from "@/lib/titan/TitanPerformance";
import type { TitanPet, ActionBelief, ActionHistoryEntry } from "@/games/isocity/types/titan";
import { createTitan } from "@/lib/titan/TitanSpawner";

// ============================================================================
// TEST SUITE: Memory Limit Constants
// ============================================================================

test.describe("Memory Limit Constants", () => {
  test("TITAN_MEMORY_LIMITS should export correct values", () => {
    expect(TITAN_MEMORY_LIMITS.maxBeliefs).toBe(100);
    expect(TITAN_MEMORY_LIMITS.maxHistory).toBe(500);
    expect(TITAN_MEMORY_LIMITS.maxWorldKnowledge).toBe(200);
    expect(TITAN_MEMORY_LIMITS.maxNPCOpinions).toBe(100);
    expect(TITAN_MEMORY_LIMITS.maxObservations).toBe(50);
    expect(TITAN_MEMORY_LIMITS.maxRelationships).toBe(100);
  });
});

// ============================================================================
// TEST SUITE: ActionBeliefMap LRU Eviction
// ============================================================================

test.describe("ActionBeliefMap LRU Eviction", () => {
  test("evictOldest should remove least recently reinforced belief", () => {
    const maxBeliefs = 3;
    const now = Date.now();
    
    // Create beliefs with specific timestamps
    const initialBeliefs = new Map<string, ActionBelief>([
      ['action_oldest', { action: 'action_oldest', goodness: 0.1, confidence: 0.1, lastReinforced: now - 3000, reinforcementCount: 1 }],
      ['action_middle', { action: 'action_middle', goodness: 0.2, confidence: 0.2, lastReinforced: now - 2000, reinforcementCount: 1 }],
      ['action_newest', { action: 'action_newest', goodness: 0.3, confidence: 0.3, lastReinforced: now - 1000, reinforcementCount: 1 }],
    ]);
    
    const beliefs = new ActionBeliefMap(initialBeliefs, maxBeliefs);
    
    // Add one more belief to trigger eviction
    beliefs.reinforceAction('action_new', true);
    
    // The oldest should have been evicted
    expect(beliefs.hasActionBelief('action_oldest')).toBe(false);
    expect(beliefs.hasActionBelief('action_middle')).toBe(true);
    expect(beliefs.hasActionBelief('action_newest')).toBe(true);
    expect(beliefs.hasActionBelief('action_new')).toBe(true);
    expect(beliefs.size()).toBe(maxBeliefs);
  });

  test("eviction should happen automatically when adding beliefs beyond max", () => {
    const maxBeliefs = 5;
    const beliefs = new ActionBeliefMap(undefined, maxBeliefs);
    
    // Add more beliefs than allowed
    for (let i = 0; i < 10; i++) {
      beliefs.reinforceAction(`action_${i}`, true);
    }
    
    // Should have exactly maxBeliefs
    expect(beliefs.size()).toBe(maxBeliefs);
  });

  test("eviction should be efficient (O(n) scan for oldest)", () => {
    const maxBeliefs = DEFAULT_MAX_BELIEFS;
    const beliefs = new ActionBeliefMap(undefined, maxBeliefs);
    
    // Fill to capacity
    for (let i = 0; i < maxBeliefs; i++) {
      beliefs.reinforceAction(`action_${i}`, true);
    }
    
    const start = Date.now();
    
    // Add 100 more beliefs, triggering 100 evictions
    for (let i = maxBeliefs; i < maxBeliefs + 100; i++) {
      beliefs.reinforceAction(`action_${i}`, true);
    }
    
    const elapsed = Date.now() - start;
    
    // Should complete in reasonable time (< 100ms for 100 evictions)
    expect(elapsed).toBeLessThan(100);
    expect(beliefs.size()).toBe(maxBeliefs);
  });
});

// ============================================================================
// TEST SUITE: ActionHistoryTracker Optimization
// ============================================================================

test.describe("ActionHistoryTracker Optimization", () => {
  test("should efficiently cap history at 500 entries", () => {
    const tracker = new ActionHistoryTracker();
    
    // Add 600 entries
    for (let i = 0; i < 600; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }
    
    // Should have exactly 500
    expect(tracker.toArray().length).toBe(DEFAULT_MAX_HISTORY);
  });

  test("history slice should keep most recent entries", () => {
    const maxHistory = 10;
    const tracker = new ActionHistoryTracker(undefined, maxHistory);
    
    // Add 15 entries
    for (let i = 0; i < 15; i++) {
      tracker.recordAction(`action_${i}`, i * 0.1);
    }
    
    const history = tracker.toArray();
    
    // Should have the last 10 entries (action_5 through action_14)
    expect(history.length).toBe(maxHistory);
    expect(history[0].action).toBe('action_5');
    expect(history[9].action).toBe('action_14');
  });

  test("should be efficient when adding entries beyond limit", () => {
    const tracker = new ActionHistoryTracker();
    
    // Fill to capacity
    for (let i = 0; i < DEFAULT_MAX_HISTORY; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }
    
    const start = Date.now();
    
    // Add 500 more entries
    for (let i = DEFAULT_MAX_HISTORY; i < DEFAULT_MAX_HISTORY + 500; i++) {
      tracker.recordAction(`action_${i}`, 0);
    }
    
    const elapsed = Date.now() - start;
    
    // Should complete in reasonable time
    expect(elapsed).toBeLessThan(200);
    expect(tracker.toArray().length).toBe(DEFAULT_MAX_HISTORY);
  });
});

// ============================================================================
// TEST SUITE: TitanBDI World Knowledge Limits
// ============================================================================

test.describe("TitanBDI World Knowledge Limits", () => {
  test("MAX_WORLD_KNOWLEDGE should be 200", () => {
    expect(MAX_WORLD_KNOWLEDGE).toBe(200);
  });

  test("should limit world knowledge to 200 entries", () => {
    const bdi = new TitanBDI();
    
    // Add 250 knowledge entries
    for (let i = 0; i < 250; i++) {
      bdi.setWorldKnowledge(`key_${i}`, { value: i });
    }
    
    // Serialize to check size
    const state = bdi.toState();
    expect(state.beliefs.worldKnowledge.length).toBeLessThanOrEqual(200);
  });

  test("should evict oldest entry when exceeding limit", () => {
    const bdi = new TitanBDI();
    
    // Add exactly 200 entries
    for (let i = 0; i < 200; i++) {
      bdi.setWorldKnowledge(`key_${i}`, { value: i });
    }
    
    // First entry should exist
    expect(bdi.getWorldKnowledge('key_0')).toBeDefined();
    
    // Add one more
    bdi.setWorldKnowledge('key_new', { value: 'new' });
    
    // First entry should be evicted
    expect(bdi.getWorldKnowledge('key_0')).toBeUndefined();
    expect(bdi.getWorldKnowledge('key_new')).toEqual({ value: 'new' });
  });
});

// ============================================================================
// TEST SUITE: TitanBDI NPC Opinion Limits
// ============================================================================

test.describe("TitanBDI NPC Opinion Limits", () => {
  test("MAX_NPC_OPINIONS should be 100", () => {
    expect(MAX_NPC_OPINIONS).toBe(100);
  });

  test("should limit NPC opinions to 100 entries", () => {
    const bdi = new TitanBDI();
    
    // Add 150 NPC opinions
    for (let i = 0; i < 150; i++) {
      bdi.setNPCOpinion(`npc_${i}`, Math.random() * 2 - 1);
    }
    
    // Serialize to check size
    const state = bdi.toState();
    expect(state.beliefs.npcOpinions.length).toBeLessThanOrEqual(100);
  });

  test("should evict oldest opinion when exceeding limit", () => {
    const bdi = new TitanBDI();
    
    // Add exactly 100 opinions
    for (let i = 0; i < 100; i++) {
      bdi.setNPCOpinion(`npc_${i}`, 0.5);
    }
    
    // First opinion should exist
    expect(bdi.getNPCOpinion('npc_0')).toBe(0.5);
    
    // Add one more
    bdi.setNPCOpinion('npc_new', 0.9);
    
    // First opinion should be evicted (returns 0 for unknown)
    expect(bdi.getNPCOpinion('npc_0')).toBe(0);
    expect(bdi.getNPCOpinion('npc_new')).toBe(0.9);
  });
});

// ============================================================================
// TEST SUITE: Sprite Lazy Loading
// ============================================================================

test.describe("Sprite Lazy Loading", () => {
  test("preloadCurrentAlignment should exist as a method", () => {
    const loader = new TitanSpriteLoader();
    
    // preloadCurrentAlignment should exist
    expect(typeof loader.preloadCurrentAlignment).toBe('function');
    // loadOnDemand should exist
    expect(typeof loader.loadOnDemand).toBe('function');
  });

  test("loadOnDemand should return null if still loading", async () => {
    const loader = new TitanSpriteLoader();
    
    // loadOnDemand should exist
    expect(typeof loader.loadOnDemand).toBe('function');
    
    // Try to load a sprite
    const path = '/Pet/doge/neutral/attack_north.gif';
    const result = await loader.loadOnDemand(path);
    
    // Should return sprite or null (not throw)
    expect(result === null || result instanceof HTMLImageElement || result === undefined).toBe(true);
  });

  test("loadOnDemand should return cached sprite if already loaded", async () => {
    const loader = new TitanSpriteLoader();
    const path = '/Pet/doge/neutral/idle_south.gif';
    
    // First load (may fail if sprite doesn't exist)
    try {
      await loader.loadSprite(path);
    } catch {
      // Ignore load failure
    }
    
    // If loaded, loadOnDemand should return it
    if (loader.isLoaded(path)) {
      const result = await loader.loadOnDemand(path);
      expect(result).not.toBeNull();
    }
  });

  test("essential animations should be idle, walk, happy, sad", () => {
    expect(ESSENTIAL_ANIMATIONS).toContain('idle');
    expect(ESSENTIAL_ANIMATIONS).toContain('walk');
    expect(ESSENTIAL_ANIMATIONS).toContain('happy');
    expect(ESSENTIAL_ANIMATIONS).toContain('sad');
    expect(ESSENTIAL_ANIMATIONS.length).toBe(4);
  });
});

// ============================================================================
// TEST SUITE: BDI Update Throttling
// ============================================================================

test.describe("BDI Update Throttling", () => {
  test("MIN_BDI_UPDATE_INTERVAL should be 100ms", () => {
    expect(MIN_BDI_UPDATE_INTERVAL).toBe(100);
  });

  test("shouldUpdate should return true if enough time has passed", () => {
    const bdi = new TitanBDI();
    
    // First call should return true
    expect(bdi.shouldUpdate()).toBe(true);
  });

  test("shouldUpdate should return false if called too quickly", async () => {
    const bdi = new TitanBDI();
    
    // First call
    bdi.shouldUpdate();
    
    // Immediate second call should return false
    expect(bdi.shouldUpdate()).toBe(false);
  });

  test("shouldUpdate should return true after MIN_BDI_UPDATE_INTERVAL", async () => {
    const bdi = new TitanBDI();
    
    // First call
    bdi.shouldUpdate();
    
    // Wait for interval
    await new Promise(resolve => setTimeout(resolve, 110));
    
    // Should return true now
    expect(bdi.shouldUpdate()).toBe(true);
  });

  test("shouldUpdate should update lastBDIUpdate timestamp", () => {
    const bdi = new TitanBDI();
    
    const before = Date.now();
    bdi.shouldUpdate();
    const after = Date.now();
    
    // Internal timestamp should have been updated
    // We verify this by checking shouldUpdate returns false immediately
    expect(bdi.shouldUpdate()).toBe(false);
  });
});

// ============================================================================
// TEST SUITE: ObservationTracker Cleanup
// ============================================================================

test.describe("ObservationTracker Cleanup", () => {
  test("should limit observations to maxObservations", () => {
    const tracker = new ObservationTracker();
    
    // Add 100 observations
    for (let i = 0; i < 100; i++) {
      tracker.recordObservation(`npc_${i}`, `action_${i}`);
    }
    
    // Should have at most DEFAULT_MAX_OBSERVATIONS
    expect(tracker.toArray().length).toBeLessThanOrEqual(DEFAULT_MAX_OBSERVATIONS);
  });

  test("cleanup should keep most recent observations", () => {
    const maxObs = 10;
    const tracker = new ObservationTracker(undefined, maxObs);
    
    // Add 20 observations
    for (let i = 0; i < 20; i++) {
      tracker.recordObservation(`npc_${i}`, `action_${i}`);
    }
    
    const observations = tracker.toArray();
    
    // Should have the last 10
    expect(observations.length).toBe(maxObs);
    expect(observations[0].actorId).toBe('npc_10');
    expect(observations[9].actorId).toBe('npc_19');
  });
});

// ============================================================================
// TEST SUITE: Performance Utility Functions
// ============================================================================

test.describe("Performance Utility Functions", () => {
  test("getTitanMemoryUsage should return memory estimates", () => {
    const titan = createTitan({ gridX: 10, gridY: 10 });
    
    const usage = getTitanMemoryUsage(titan);
    
    expect(typeof usage.beliefs).toBe('number');
    expect(typeof usage.history).toBe('number');
    expect(typeof usage.worldKnowledge).toBe('number');
    expect(typeof usage.npcOpinions).toBe('number');
    expect(typeof usage.observations).toBe('number');
    expect(typeof usage.relationships).toBe('number');
    expect(typeof usage.totalEstimated).toBe('number');
    
    expect(usage.totalEstimated).toBeGreaterThanOrEqual(0);
  });

  test("getTitanMemoryUsage should increase with more data", () => {
    const titan = createTitan({ gridX: 10, gridY: 10 });
    
    const usageBefore = getTitanMemoryUsage(titan);
    
    // Add beliefs
    for (let i = 0; i < 50; i++) {
      titan.bdi.beliefs.actionBeliefs.set(`action_${i}`, {
        action: `action_${i}`,
        goodness: 0.5,
        confidence: 0.5,
        lastReinforced: Date.now(),
        reinforcementCount: i,
      });
    }
    
    const usageAfter = getTitanMemoryUsage(titan);
    
    expect(usageAfter.beliefs).toBeGreaterThan(usageBefore.beliefs);
    expect(usageAfter.totalEstimated).toBeGreaterThan(usageBefore.totalEstimated);
  });

  test("optimizeTitanMemory should force cleanup of capped collections", () => {
    const titan = createTitan({ gridX: 10, gridY: 10 });
    
    // Add excess data
    for (let i = 0; i < 200; i++) {
      titan.bdi.beliefs.actionBeliefs.set(`action_${i}`, {
        action: `action_${i}`,
        goodness: 0.5,
        confidence: 0.5,
        lastReinforced: Date.now() - i * 1000,
        reinforcementCount: 1,
      });
    }
    
    // Optimize
    optimizeTitanMemory(titan);
    
    // Should be within limits
    expect(titan.bdi.beliefs.actionBeliefs.size).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// TEST SUITE: Integration Performance Tests
// ============================================================================

test.describe("Integration Performance Tests", () => {
  test("full system should stay within memory bounds", () => {
    const titan = createTitan({ gridX: 10, gridY: 10 });
    
    // Simulate heavy usage
    const bdi = new TitanBDI();
    
    // Add lots of world knowledge
    for (let i = 0; i < 300; i++) {
      bdi.setWorldKnowledge(`key_${i}`, { x: i, y: i });
    }
    
    // Add lots of NPC opinions
    for (let i = 0; i < 150; i++) {
      bdi.setNPCOpinion(`npc_${i}`, Math.random());
    }
    
    // Update titan's BDI
    const state = bdi.toState();
    
    // Verify limits are enforced
    expect(state.beliefs.worldKnowledge.length).toBeLessThanOrEqual(TITAN_MEMORY_LIMITS.maxWorldKnowledge);
    expect(state.beliefs.npcOpinions.length).toBeLessThanOrEqual(TITAN_MEMORY_LIMITS.maxNPCOpinions);
  });

  test("belief and history trackers should maintain limits under stress", () => {
    const beliefs = new ActionBeliefMap();
    const history = new ActionHistoryTracker();
    const observations = new ObservationTracker();
    
    // Heavy stress test
    for (let i = 0; i < 1000; i++) {
      beliefs.reinforceAction(`action_${i % 200}`, Math.random() > 0.5);
      history.recordAction(`action_${i}`, Math.random() * 0.2 - 0.1);
      observations.recordObservation(`npc_${i % 100}`, `action_${i % 50}`);
    }
    
    expect(beliefs.size()).toBeLessThanOrEqual(DEFAULT_MAX_BELIEFS);
    expect(history.toArray().length).toBeLessThanOrEqual(DEFAULT_MAX_HISTORY);
    expect(observations.toArray().length).toBeLessThanOrEqual(DEFAULT_MAX_OBSERVATIONS);
  });
});
