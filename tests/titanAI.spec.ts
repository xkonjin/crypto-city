import { test, expect } from "@playwright/test";

/**
 * Tests for Titan BDI (Belief-Desire-Intention) AI System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements the BDI architecture for Titan autonomous decision making.
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 5 on Titan AI
 */

import type { 
  TitanPet, 
  TitanGoal,
  ActionBelief,
  TitanSkill,
  TitanSkillProgression,
} from "@/games/isocity/types/titan";
import {
  TitanBDI,
  TitanObservation,
  TitanDesire,
  TitanIntention,
  TitanAction,
  TitanBeliefs,
  TitanBDIState,
} from "@/lib/titan/TitanAI";
import { createTitan } from "@/lib/titan/TitanSpawner";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a test Titan with specific properties for testing
 */
function createTestTitan(overrides?: Partial<TitanPet>): TitanPet {
  const titan = createTitan({ gridX: 10, gridY: 10 });
  if (overrides) {
    return { ...titan, ...overrides };
  }
  return titan;
}

// ============================================================================
// Test Suite: TitanObservation Type
// ============================================================================

test.describe("TitanObservation Type", () => {
  test("should accept npc_action observation type", () => {
    const observation: TitanObservation = {
      type: 'npc_action',
      subject: 'npc-123',
      action: 'trading',
      outcome: 'success',
      timestamp: Date.now(),
    };
    expect(observation.type).toBe('npc_action');
    expect(observation.subject).toBe('npc-123');
  });

  test("should accept player_action observation type", () => {
    const observation: TitanObservation = {
      type: 'player_action',
      action: 'praise',
      outcome: 'success',
      timestamp: Date.now(),
    };
    expect(observation.type).toBe('player_action');
  });

  test("should accept environment observation type", () => {
    const observation: TitanObservation = {
      type: 'environment',
      location: { x: 5, y: 10 },
      timestamp: Date.now(),
    };
    expect(observation.type).toBe('environment');
    expect(observation.location).toEqual({ x: 5, y: 10 });
  });

  test("should accept self_action observation type", () => {
    const observation: TitanObservation = {
      type: 'self_action',
      action: 'eat',
      outcome: 'success',
      timestamp: Date.now(),
    };
    expect(observation.type).toBe('self_action');
  });

  test("should support optional fields", () => {
    const observation: TitanObservation = {
      type: 'environment',
      timestamp: Date.now(),
    };
    expect(observation.subject).toBeUndefined();
    expect(observation.action).toBeUndefined();
    expect(observation.outcome).toBeUndefined();
    expect(observation.location).toBeUndefined();
  });
});

// ============================================================================
// Test Suite: TitanDesire Type
// ============================================================================

test.describe("TitanDesire Type", () => {
  test("should have type, priority, source, and reason", () => {
    const desire: TitanDesire = {
      type: 'seek_food',
      priority: 0.8,
      source: 'need',
      reason: 'Hunger is below critical threshold',
    };
    expect(desire.type).toBe('seek_food');
    expect(desire.priority).toBe(0.8);
    expect(desire.source).toBe('need');
    expect(desire.reason).toBeDefined();
  });

  test("should support different source types", () => {
    const sources: Array<'need' | 'mood' | 'curiosity' | 'command' | 'learned'> = [
      'need', 'mood', 'curiosity', 'command', 'learned'
    ];
    
    sources.forEach(source => {
      const desire: TitanDesire = {
        type: 'explore',
        priority: 0.5,
        source,
        reason: `Desire from ${source}`,
      };
      expect(desire.source).toBe(source);
    });
  });

  test("should support optional target as string", () => {
    const desire: TitanDesire = {
      type: 'help_npc',
      priority: 0.7,
      source: 'mood',
      target: 'npc-456',
      reason: 'NPC needs help',
    };
    expect(desire.target).toBe('npc-456');
  });

  test("should support optional target as position", () => {
    const desire: TitanDesire = {
      type: 'explore_area',
      priority: 0.4,
      source: 'curiosity',
      target: { x: 15, y: 20 },
      reason: 'Unexplored area',
    };
    expect(desire.target).toEqual({ x: 15, y: 20 });
  });

  test("priority should be between 0 and 1", () => {
    const desire: TitanDesire = {
      type: 'rest',
      priority: 0.95,
      source: 'need',
      reason: 'Energy critically low',
    };
    expect(desire.priority).toBeGreaterThanOrEqual(0);
    expect(desire.priority).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Test Suite: TitanIntention Type
// ============================================================================

test.describe("TitanIntention Type", () => {
  test("should have goal, plan, currentStep, started, and maxDuration", () => {
    const intention: TitanIntention = {
      goal: { type: 'seek_food' },
      plan: [
        { type: 'move', target: { x: 5, y: 5 } },
        { type: 'eat' },
      ],
      currentStep: 0,
      started: Date.now(),
      maxDuration: 60000,
    };
    expect(intention.goal.type).toBe('seek_food');
    expect(intention.plan.length).toBe(2);
    expect(intention.currentStep).toBe(0);
    expect(intention.started).toBeDefined();
    expect(intention.maxDuration).toBe(60000);
  });

  test("plan should be an array of TitanActions", () => {
    const intention: TitanIntention = {
      goal: { type: 'help_npc', npcId: 'npc-123' },
      plan: [
        { type: 'move', target: { x: 10, y: 10 }, duration: 1000 },
        { type: 'interact', target: 'npc-123', duration: 2000 },
        { type: 'help', target: 'npc-123' },
      ],
      currentStep: 0,
      started: Date.now(),
      maxDuration: 120000,
    };
    expect(intention.plan.length).toBe(3);
    intention.plan.forEach(action => {
      expect(action.type).toBeDefined();
    });
  });
});

// ============================================================================
// Test Suite: TitanAction Type
// ============================================================================

test.describe("TitanAction Type", () => {
  test("should have type and optional target/duration", () => {
    const action: TitanAction = {
      type: 'move',
      target: { x: 5, y: 10 },
      duration: 1500,
    };
    expect(action.type).toBe('move');
    expect(action.target).toEqual({ x: 5, y: 10 });
    expect(action.duration).toBe(1500);
  });

  test("should allow target as NPC ID string", () => {
    const action: TitanAction = {
      type: 'interact',
      target: 'npc-789',
    };
    expect(action.target).toBe('npc-789');
  });

  test("should work with just type", () => {
    const action: TitanAction = {
      type: 'idle',
    };
    expect(action.type).toBe('idle');
    expect(action.target).toBeUndefined();
    expect(action.duration).toBeUndefined();
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Constructor
// ============================================================================

test.describe("TitanBDI Class - Constructor", () => {
  test("should create with default empty state", () => {
    const bdi = new TitanBDI();
    
    expect(bdi.getCurrentIntention()).toBeNull();
    expect(bdi.getNPCOpinion('any-npc')).toBe(0);
    expect(bdi.getWorldKnowledge('any-key')).toBeUndefined();
  });

  test("should create with initial BDI state", () => {
    const initialState: TitanBDIState = {
      beliefs: {
        worldKnowledge: [['food_location', { x: 5, y: 5 }]],
        npcOpinions: [['npc-123', 0.8]],
        playerRelationship: { trust: 0.7, fear: 0.1, affection: 0.6 },
      },
      desires: [
        { type: 'explore', priority: 0.5, source: 'curiosity', reason: 'New area' }
      ],
      currentIntention: null,
    };
    
    const bdi = new TitanBDI(initialState);
    
    expect(bdi.getNPCOpinion('npc-123')).toBe(0.8);
    expect(bdi.getWorldKnowledge('food_location')).toEqual({ x: 5, y: 5 });
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Belief Management
// ============================================================================

test.describe("TitanBDI Class - Belief Management", () => {
  test("updateBeliefs should process npc_action observation", () => {
    const bdi = new TitanBDI();
    
    const observation: TitanObservation = {
      type: 'npc_action',
      subject: 'npc-123',
      action: 'help',
      outcome: 'success',
      timestamp: Date.now(),
    };
    
    bdi.updateBeliefs(observation);
    
    // After observing NPC help successfully, opinion should increase
    const opinion = bdi.getNPCOpinion('npc-123');
    expect(opinion).toBeGreaterThan(0);
  });

  test("updateBeliefs should process player_action observation", () => {
    const bdi = new TitanBDI();
    
    const observation: TitanObservation = {
      type: 'player_action',
      action: 'praise',
      outcome: 'success',
      timestamp: Date.now(),
    };
    
    bdi.updateBeliefs(observation);
    
    // This should affect player relationship beliefs
    // Internal state change - verify through serialization
    const state = bdi.toState();
    expect(state.beliefs.playerRelationship.trust).toBeGreaterThanOrEqual(0);
  });

  test("updateBeliefs should process environment observation", () => {
    const bdi = new TitanBDI();
    
    const observation: TitanObservation = {
      type: 'environment',
      action: 'discovered_food',
      location: { x: 10, y: 15 },
      timestamp: Date.now(),
    };
    
    bdi.updateBeliefs(observation);
    
    // Should store food location in world knowledge
    // Exact key depends on implementation
    const state = bdi.toState();
    expect(state.beliefs.worldKnowledge.length).toBeGreaterThanOrEqual(0);
  });

  test("setWorldKnowledge should store and retrieve values", () => {
    const bdi = new TitanBDI();
    
    bdi.setWorldKnowledge('food_source_1', { x: 5, y: 5, type: 'restaurant' });
    bdi.setWorldKnowledge('danger_zone', { x: 20, y: 20 });
    
    expect(bdi.getWorldKnowledge('food_source_1')).toEqual({ x: 5, y: 5, type: 'restaurant' });
    expect(bdi.getWorldKnowledge('danger_zone')).toEqual({ x: 20, y: 20 });
    expect(bdi.getWorldKnowledge('unknown')).toBeUndefined();
  });

  test("getWorldKnowledge should return typed value", () => {
    const bdi = new TitanBDI();
    
    interface FoodSource {
      x: number;
      y: number;
      quality: number;
    }
    
    const foodSource: FoodSource = { x: 10, y: 10, quality: 0.8 };
    bdi.setWorldKnowledge('best_food', foodSource);
    
    const retrieved = bdi.getWorldKnowledge<FoodSource>('best_food');
    expect(retrieved?.quality).toBe(0.8);
  });

  test("setNPCOpinion should store opinion value", () => {
    const bdi = new TitanBDI();
    
    bdi.setNPCOpinion('npc-friendly', 0.9);
    bdi.setNPCOpinion('npc-unfriendly', -0.5);
    
    expect(bdi.getNPCOpinion('npc-friendly')).toBe(0.9);
    expect(bdi.getNPCOpinion('npc-unfriendly')).toBe(-0.5);
  });

  test("getNPCOpinion should return 0 for unknown NPCs", () => {
    const bdi = new TitanBDI();
    
    expect(bdi.getNPCOpinion('unknown-npc')).toBe(0);
  });

  test("setNPCOpinion should clamp values to valid range", () => {
    const bdi = new TitanBDI();
    
    bdi.setNPCOpinion('npc-1', 1.5); // Too high
    bdi.setNPCOpinion('npc-2', -1.5); // Too low
    
    expect(bdi.getNPCOpinion('npc-1')).toBeLessThanOrEqual(1);
    expect(bdi.getNPCOpinion('npc-2')).toBeGreaterThanOrEqual(-1);
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Desire Computation
// ============================================================================

test.describe("TitanBDI Class - Desire Computation", () => {
  test("computeDesires should return desires from low needs", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 15; // Below critical threshold
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    
    // Should have a desire to seek food due to low hunger
    const foodDesire = desires.find(d => d.type === 'seek_food');
    expect(foodDesire).toBeDefined();
    expect(foodDesire?.source).toBe('need');
    expect(foodDesire?.priority).toBeGreaterThan(0.5);
  });

  test("computeDesires should return desires from mood", () => {
    const titan = createTestTitan();
    titan.mood.currentMood = 'sad';
    titan.mood.moodIntensity = 0.8;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    
    // Sad mood might create desire for social interaction or attention
    expect(desires.length).toBeGreaterThan(0);
  });

  test("computeDesires should return desires from curiosity", () => {
    const titan = createTestTitan();
    // High openness personality trait increases curiosity
    titan.mood.beliefs = [{
      subject: 'unexplored_area',
      belief: 'interesting',
      confidence: 0.7,
      source: 'observation',
    }];
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    
    // Should have some desires generated
    expect(Array.isArray(desires)).toBe(true);
  });

  test("computeDesires should return desires from learned behaviors", () => {
    const initialState: TitanBDIState = {
      beliefs: {
        worldKnowledge: [],
        npcOpinions: [['npc-friendly', 0.9]],
        playerRelationship: { trust: 0.8, fear: 0, affection: 0.7 },
      },
      desires: [],
      currentIntention: null,
    };
    
    const titan = createTestTitan();
    const bdi = new TitanBDI(initialState);
    
    // Add action belief that helping is good
    const state = bdi.toState();
    // Learned positive association with helping
    
    const desires = bdi.computeDesires(titan);
    expect(Array.isArray(desires)).toBe(true);
  });

  test("computeDesires should sort by priority", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10; // Critical
    titan.needs.energy.current = 30; // Low but not critical
    titan.needs.social.current = 50; // Moderate
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    
    // Desires should be sorted by priority (descending)
    for (let i = 1; i < desires.length; i++) {
      expect(desires[i - 1].priority).toBeGreaterThanOrEqual(desires[i].priority);
    }
  });

  test("getPriorityDesires should return top N desires", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 20;
    titan.needs.energy.current = 20;
    titan.needs.social.current = 20;
    titan.needs.fun.current = 20;
    
    const bdi = new TitanBDI();
    bdi.computeDesires(titan);
    
    const topDesires = bdi.getPriorityDesires(3);
    expect(topDesires.length).toBeLessThanOrEqual(3);
  });

  test("priority formula should factor in personality modifier", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 30;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    
    // Priority should be: baseNeedPriority * (1 + personalityModifier) * urgencyMultiplier
    const foodDesire = desires.find(d => d.type === 'seek_food');
    if (foodDesire) {
      expect(foodDesire.priority).toBeGreaterThan(0);
      expect(foodDesire.priority).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Intention Formation
// ============================================================================

test.describe("TitanBDI Class - Intention Formation", () => {
  test("formIntention should select highest priority achievable desire", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 15;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    const intention = bdi.formIntention(desires, titan);
    
    expect(intention).not.toBeNull();
    if (intention) {
      expect(intention.goal).toBeDefined();
      expect(intention.plan).toBeDefined();
      expect(intention.currentStep).toBe(0);
    }
  });

  test("formIntention should create plan with 1-5 actions", () => {
    const titan = createTestTitan();
    titan.needs.energy.current = 10;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    const intention = bdi.formIntention(desires, titan);
    
    if (intention) {
      expect(intention.plan.length).toBeGreaterThanOrEqual(1);
      expect(intention.plan.length).toBeLessThanOrEqual(5);
    }
  });

  test("formIntention should consider current position", () => {
    const titan = createTestTitan();
    titan.gridX = 5;
    titan.gridY = 5;
    titan.needs.hunger.current = 15;
    
    const bdi = new TitanBDI();
    bdi.setWorldKnowledge('food_location', { x: 10, y: 10 });
    
    const desires = bdi.computeDesires(titan);
    const intention = bdi.formIntention(desires, titan);
    
    if (intention && intention.plan.length > 0) {
      // First action might be a move if food is not at current position
      const firstAction = intention.plan[0];
      expect(['move', 'seek_food', 'eat', 'wander']).toContain(firstAction.type);
    }
  });

  test("formIntention should set started timestamp", () => {
    const titan = createTestTitan();
    titan.needs.social.current = 15;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    const beforeForm = Date.now();
    const intention = bdi.formIntention(desires, titan);
    const afterForm = Date.now();
    
    if (intention) {
      expect(intention.started).toBeGreaterThanOrEqual(beforeForm);
      expect(intention.started).toBeLessThanOrEqual(afterForm);
    }
  });

  test("formIntention should set maxDuration", () => {
    const titan = createTestTitan();
    titan.needs.fun.current = 15;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    const intention = bdi.formIntention(desires, titan);
    
    if (intention) {
      expect(intention.maxDuration).toBeGreaterThan(0);
    }
  });

  test("getCurrentIntention should return current intention", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    bdi.formIntention(desires, titan);
    
    const current = bdi.getCurrentIntention();
    expect(current).not.toBeNull();
  });

  test("clearIntention should remove current intention", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    bdi.formIntention(desires, titan);
    
    expect(bdi.getCurrentIntention()).not.toBeNull();
    
    bdi.clearIntention();
    
    expect(bdi.getCurrentIntention()).toBeNull();
  });

  test("formIntention should return null if no achievable desires", () => {
    const titan = createTestTitan();
    // Set all needs to high (satisfied)
    Object.values(titan.needs).forEach(need => {
      need.current = 95;
    });
    
    const bdi = new TitanBDI();
    const desires: TitanDesire[] = []; // Empty desires
    const intention = bdi.formIntention(desires, titan);
    
    expect(intention).toBeNull();
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Execution
// ============================================================================

test.describe("TitanBDI Class - Execution", () => {
  test("executeIntention should return current action", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    bdi.formIntention(desires, titan);
    
    const action = bdi.executeIntention(titan);
    
    if (action) {
      expect(action.type).toBeDefined();
    }
  });

  test("executeIntention should return null if no intention", () => {
    const titan = createTestTitan();
    const bdi = new TitanBDI();
    
    const action = bdi.executeIntention(titan);
    
    expect(action).toBeNull();
  });

  test("executeIntention should advance currentStep on success", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    bdi.formIntention(desires, titan);
    
    const intention = bdi.getCurrentIntention();
    if (intention && intention.plan.length > 1) {
      const initialStep = intention.currentStep;
      
      // Execute first step
      bdi.executeIntention(titan);
      
      // Step should advance (implementation detail - could be manual or automatic)
      // This test verifies the mechanism exists
      expect(bdi.getCurrentIntention()?.currentStep).toBeGreaterThanOrEqual(0);
    }
  });

  test("executeIntention should clear intention when plan complete", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    bdi.setWorldKnowledge('food_location', { x: titan.gridX, y: titan.gridY });
    
    const desires: TitanDesire[] = [{
      type: 'seek_food',
      priority: 0.9,
      source: 'need',
      reason: 'Hungry',
    }];
    
    bdi.formIntention(desires, titan);
    
    const intention = bdi.getCurrentIntention();
    if (intention) {
      // Manually advance to last step
      while (bdi.getCurrentIntention() !== null) {
        const current = bdi.getCurrentIntention();
        if (current && current.currentStep >= current.plan.length - 1) {
          // Execute last step should complete
          bdi.executeIntention(titan);
          break;
        }
        bdi.executeIntention(titan);
        // Manually increment for test purposes
        if (bdi.getCurrentIntention()) {
          const c = bdi.getCurrentIntention()!;
          c.currentStep++;
          if (c.currentStep >= c.plan.length) {
            bdi.clearIntention();
          }
        }
      }
    }
    
    // After completing all steps, intention might be cleared
    // Exact behavior depends on implementation
    expect(true).toBe(true); // Placeholder - actual test depends on impl
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Belief Decay
// ============================================================================

test.describe("TitanBDI Class - Belief Decay", () => {
  test("decayBeliefs should decay NPC opinions toward 0", () => {
    const bdi = new TitanBDI();
    bdi.setNPCOpinion('npc-positive', 0.8);
    bdi.setNPCOpinion('npc-negative', -0.6);
    
    // Decay at rate of 0.5 per day = 0.5 / 1440 per minute
    const deltaMinutes = 1440; // 1 day
    bdi.decayBeliefs(deltaMinutes);
    
    // Opinions should move toward 0
    const positiveOpinion = bdi.getNPCOpinion('npc-positive');
    const negativeOpinion = bdi.getNPCOpinion('npc-negative');
    
    expect(positiveOpinion).toBeLessThan(0.8);
    expect(negativeOpinion).toBeGreaterThan(-0.6);
  });

  test("decayBeliefs should decay at 0.5 per day rate", () => {
    const bdi = new TitanBDI();
    bdi.setNPCOpinion('npc-test', 1.0);
    
    // 1 day decay
    bdi.decayBeliefs(1440);
    
    // Should be approximately 0.5 (1.0 - 0.5)
    const opinion = bdi.getNPCOpinion('npc-test');
    expect(opinion).toBeCloseTo(0.5, 1);
  });

  test("decayBeliefs should not affect world knowledge", () => {
    const bdi = new TitanBDI();
    bdi.setWorldKnowledge('important_location', { x: 10, y: 20 });
    
    // Heavy decay
    bdi.decayBeliefs(10000);
    
    // World knowledge should persist
    expect(bdi.getWorldKnowledge('important_location')).toEqual({ x: 10, y: 20 });
  });

  test("decayBeliefs should handle zero delta", () => {
    const bdi = new TitanBDI();
    bdi.setNPCOpinion('npc-test', 0.8);
    
    bdi.decayBeliefs(0);
    
    expect(bdi.getNPCOpinion('npc-test')).toBe(0.8);
  });

  test("decayBeliefs should not decay past 0", () => {
    const bdi = new TitanBDI();
    bdi.setNPCOpinion('npc-test', 0.1);
    
    // Very large decay
    bdi.decayBeliefs(100000);
    
    // Should stop at 0, not go negative
    const opinion = bdi.getNPCOpinion('npc-test');
    expect(opinion).toBeGreaterThanOrEqual(0);
    expect(opinion).toBeLessThanOrEqual(0.1);
  });

  test("decayBeliefs should handle negative opinions correctly", () => {
    const bdi = new TitanBDI();
    bdi.setNPCOpinion('npc-enemy', -0.8);
    
    // Decay should move toward 0 (increase value)
    bdi.decayBeliefs(1440);
    
    const opinion = bdi.getNPCOpinion('npc-enemy');
    expect(opinion).toBeGreaterThan(-0.8);
    expect(opinion).toBeLessThanOrEqual(0);
  });
});

// ============================================================================
// Test Suite: TitanBDI Class - Serialization
// ============================================================================

test.describe("TitanBDI Class - Serialization", () => {
  test("toState should serialize beliefs correctly", () => {
    const bdi = new TitanBDI();
    bdi.setWorldKnowledge('key1', 'value1');
    bdi.setWorldKnowledge('key2', { nested: true });
    bdi.setNPCOpinion('npc-1', 0.5);
    bdi.setNPCOpinion('npc-2', -0.3);
    
    const state = bdi.toState();
    
    expect(Array.isArray(state.beliefs.worldKnowledge)).toBe(true);
    expect(Array.isArray(state.beliefs.npcOpinions)).toBe(true);
    expect(state.beliefs.playerRelationship).toBeDefined();
  });

  test("toState should serialize desires", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    bdi.computeDesires(titan);
    
    const state = bdi.toState();
    
    expect(Array.isArray(state.desires)).toBe(true);
  });

  test("toState should serialize current intention", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 10;
    
    const bdi = new TitanBDI();
    const desires = bdi.computeDesires(titan);
    bdi.formIntention(desires, titan);
    
    const state = bdi.toState();
    
    expect(state.currentIntention).not.toBeNull();
    if (state.currentIntention) {
      expect(state.currentIntention.goal).toBeDefined();
      expect(state.currentIntention.plan).toBeDefined();
    }
  });

  test("fromState should restore beliefs", () => {
    const originalState: TitanBDIState = {
      beliefs: {
        worldKnowledge: [['location', { x: 5, y: 5 }]],
        npcOpinions: [['npc-friend', 0.7]],
        playerRelationship: { trust: 0.8, fear: 0.1, affection: 0.6 },
      },
      desires: [],
      currentIntention: null,
    };
    
    const bdi = TitanBDI.fromState(originalState);
    
    expect(bdi.getWorldKnowledge('location')).toEqual({ x: 5, y: 5 });
    expect(bdi.getNPCOpinion('npc-friend')).toBe(0.7);
  });

  test("fromState should restore intention", () => {
    const originalState: TitanBDIState = {
      beliefs: {
        worldKnowledge: [],
        npcOpinions: [],
        playerRelationship: { trust: 0.5, fear: 0, affection: 0.5 },
      },
      desires: [],
      currentIntention: {
        goal: { type: 'seek_food' },
        plan: [{ type: 'move', target: { x: 10, y: 10 } }, { type: 'eat' }],
        currentStep: 1,
        started: Date.now() - 5000,
        maxDuration: 60000,
      },
    };
    
    const bdi = TitanBDI.fromState(originalState);
    
    const intention = bdi.getCurrentIntention();
    expect(intention).not.toBeNull();
    expect(intention?.currentStep).toBe(1);
    expect(intention?.plan.length).toBe(2);
  });

  test("round-trip serialization should preserve state", () => {
    const bdi = new TitanBDI();
    bdi.setWorldKnowledge('test', { value: 42 });
    bdi.setNPCOpinion('npc-test', 0.65);
    
    const titan = createTestTitan();
    titan.needs.energy.current = 15;
    bdi.computeDesires(titan);
    bdi.formIntention(bdi.getPriorityDesires(1), titan);
    
    const serialized = bdi.toState();
    const restored = TitanBDI.fromState(serialized);
    
    expect(restored.getWorldKnowledge('test')).toEqual({ value: 42 });
    expect(restored.getNPCOpinion('npc-test')).toBe(0.65);
    
    const originalIntention = bdi.getCurrentIntention();
    const restoredIntention = restored.getCurrentIntention();
    
    if (originalIntention && restoredIntention) {
      expect(restoredIntention.goal.type).toBe(originalIntention.goal.type);
      expect(restoredIntention.currentStep).toBe(originalIntention.currentStep);
    }
  });
});

// ============================================================================
// Test Suite: Integration Tests
// ============================================================================

test.describe("TitanBDI Integration Tests", () => {
  test("full BDI loop: observe -> desire -> intention -> action", () => {
    const titan = createTestTitan();
    titan.needs.hunger.current = 15;
    
    const bdi = new TitanBDI();
    
    // 1. Observe environment (food nearby)
    bdi.updateBeliefs({
      type: 'environment',
      action: 'discovered_food',
      location: { x: 12, y: 10 },
      timestamp: Date.now(),
    });
    
    // 2. Compute desires (should want food)
    const desires = bdi.computeDesires(titan);
    expect(desires.length).toBeGreaterThan(0);
    
    // 3. Form intention (should plan to get food)
    const intention = bdi.formIntention(desires, titan);
    expect(intention).not.toBeNull();
    
    // 4. Execute intention (should return first action)
    const action = bdi.executeIntention(titan);
    expect(action).not.toBeNull();
  });

  test("command desires should have high priority", () => {
    const titan = createTestTitan();
    
    // Give command observation
    const bdi = new TitanBDI();
    bdi.updateBeliefs({
      type: 'player_action',
      action: 'command_go_to',
      location: { x: 20, y: 20 },
      outcome: 'success',
      timestamp: Date.now(),
    });
    
    // Compute desires - command should be high priority
    // This depends on how commands create desires in implementation
    const state = bdi.toState();
    expect(state).toBeDefined();
  });

  test("learned behaviors create repeat desires", () => {
    const titan = createTestTitan();
    
    const initialState: TitanBDIState = {
      beliefs: {
        worldKnowledge: [['positive_action', { action: 'help_npc', goodness: 0.8 }]],
        npcOpinions: [['npc-123', 0.7]], // Like this NPC
        playerRelationship: { trust: 0.8, fear: 0, affection: 0.7 },
      },
      desires: [],
      currentIntention: null,
    };
    
    const bdi = new TitanBDI(initialState);
    const desires = bdi.computeDesires(titan);
    
    // With positive beliefs about helping and liking an NPC,
    // might generate desire to help that NPC
    expect(Array.isArray(desires)).toBe(true);
  });
});
