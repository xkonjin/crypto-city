import { test, expect } from "@playwright/test";

/**
 * NPC Relationship System Tests (#106)
 * 
 * TDD Phase 1: Tests for the NPC relationship tracking system including:
 * - Relationship types and metrics (trust, respect, familiarity, attraction)
 * - RelationshipManager class
 * - Relationship type derivation
 * - Hitchhiker's Guide style descriptions
 */

// Import types and classes directly for unit testing
import type { Relationship, RelationshipType } from "@/lib/npc/relationships";
import {
  RELATIONSHIP_DESCRIPTIONS,
  RELATIONSHIP_THRESHOLDS,
  ALL_RELATIONSHIP_TYPES,
  createDefaultRelationship,
  clampMetric,
} from "@/lib/npc/relationships";
import { RelationshipManager } from "@/lib/npc/RelationshipManager";
import type { CryptoNPC } from "@/games/isocity/types/npc";
import { createDefaultPersonality } from "@/lib/npc/personality";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";

/**
 * Helper function to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: overrides.id || 'test-npc-1',
    name: 'TestNPC',
    walletAddress: '0x1234567890',
    age: 30,
    occupation: 'trader',
    residence: null,
    workplace: null,
    spriteType: 'apple',
    direction: 'south',
    gridX: 5,
    gridY: 5,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: null,
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    ...overrides,
  };
}

/**
 * Test Suite: Relationship Types
 */
test.describe("Relationship Types", () => {
  test("should define Relationship interface with all required fields", async () => {
    const relationship = createDefaultRelationship('target-123');
    
    // Core metrics
    expect(typeof relationship.targetId).toBe('string');
    expect(typeof relationship.trust).toBe('number');
    expect(typeof relationship.respect).toBe('number');
    expect(typeof relationship.familiarity).toBe('number');
    expect(typeof relationship.attraction).toBe('number');
    
    // Derived type
    expect(typeof relationship.type).toBe('string');
    
    // History
    expect(typeof relationship.firstMet).toBe('number');
    expect(typeof relationship.lastInteraction).toBe('number');
    expect(typeof relationship.interactionCount).toBe('number');
    
    // Debts and favors
    expect(typeof relationship.owedFavors).toBe('number');
  });

  test("should create default relationship with stranger type", async () => {
    const relationship = createDefaultRelationship('target-456');
    
    expect(relationship.targetId).toBe('target-456');
    expect(relationship.trust).toBe(0);
    expect(relationship.respect).toBe(0);
    expect(relationship.familiarity).toBe(0);
    expect(relationship.attraction).toBe(0);
    expect(relationship.type).toBe('stranger');
    expect(relationship.interactionCount).toBe(0);
    expect(relationship.owedFavors).toBe(0);
  });

  test("should define all 13 relationship types", async () => {
    const expectedTypes: RelationshipType[] = [
      'stranger',
      'acquaintance',
      'friend',
      'close_friend',
      'best_friend',
      'rival',
      'enemy',
      'nemesis',
      'romantic_interest',
      'partner',
      'business_partner',
      'mentor',
      'mentee',
    ];
    
    expect(ALL_RELATIONSHIP_TYPES.length).toBe(13);
    for (const type of expectedTypes) {
      expect(ALL_RELATIONSHIP_TYPES).toContain(type);
    }
  });

  test("should clamp trust metric to -100 to +100 range", async () => {
    expect(clampMetric(150, 'trust')).toBe(100);
    expect(clampMetric(-150, 'trust')).toBe(-100);
    expect(clampMetric(50, 'trust')).toBe(50);
    expect(clampMetric(-50, 'trust')).toBe(-50);
  });

  test("should clamp familiarity metric to 0-100 range", async () => {
    expect(clampMetric(150, 'familiarity')).toBe(100);
    expect(clampMetric(-50, 'familiarity')).toBe(0);
    expect(clampMetric(50, 'familiarity')).toBe(50);
  });

  test("should clamp respect metric to -100 to +100 range", async () => {
    expect(clampMetric(150, 'respect')).toBe(100);
    expect(clampMetric(-150, 'respect')).toBe(-100);
  });

  test("should clamp attraction metric to -100 to +100 range", async () => {
    expect(clampMetric(150, 'attraction')).toBe(100);
    expect(clampMetric(-150, 'attraction')).toBe(-100);
  });
});

/**
 * Test Suite: Relationship Thresholds
 */
test.describe("Relationship Thresholds", () => {
  test("should define thresholds for acquaintance", async () => {
    expect(RELATIONSHIP_THRESHOLDS.acquaintance).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.acquaintance.familiarity).toBe(20);
  });

  test("should define thresholds for friend", async () => {
    expect(RELATIONSHIP_THRESHOLDS.friend).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.friend.trust).toBe(40);
    expect(RELATIONSHIP_THRESHOLDS.friend.familiarity).toBe(30);
  });

  test("should define thresholds for close_friend", async () => {
    expect(RELATIONSHIP_THRESHOLDS.close_friend).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.close_friend.trust).toBe(60);
    expect(RELATIONSHIP_THRESHOLDS.close_friend.familiarity).toBe(50);
  });

  test("should define thresholds for best_friend", async () => {
    expect(RELATIONSHIP_THRESHOLDS.best_friend).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.best_friend.trust).toBe(80);
    expect(RELATIONSHIP_THRESHOLDS.best_friend.familiarity).toBe(70);
  });

  test("should define thresholds for rival", async () => {
    expect(RELATIONSHIP_THRESHOLDS.rival).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.rival.respect).toBe(30);
    expect(RELATIONSHIP_THRESHOLDS.rival.trust).toBe(-20);
  });

  test("should define thresholds for enemy", async () => {
    expect(RELATIONSHIP_THRESHOLDS.enemy).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.enemy.trust).toBe(-50);
  });

  test("should define thresholds for nemesis", async () => {
    expect(RELATIONSHIP_THRESHOLDS.nemesis).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.nemesis.trust).toBe(-80);
    expect(RELATIONSHIP_THRESHOLDS.nemesis.respect).toBe(-40);
  });

  test("should define thresholds for romantic_interest", async () => {
    expect(RELATIONSHIP_THRESHOLDS.romantic_interest).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.romantic_interest.attraction).toBe(50);
    expect(RELATIONSHIP_THRESHOLDS.romantic_interest.familiarity).toBe(30);
  });

  test("should define thresholds for partner", async () => {
    expect(RELATIONSHIP_THRESHOLDS.partner).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.partner.trust).toBe(60);
    expect(RELATIONSHIP_THRESHOLDS.partner.attraction).toBe(60);
    expect(RELATIONSHIP_THRESHOLDS.partner.familiarity).toBe(70);
  });

  test("should define thresholds for business_partner", async () => {
    expect(RELATIONSHIP_THRESHOLDS.business_partner).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.business_partner.trust).toBe(50);
    expect(RELATIONSHIP_THRESHOLDS.business_partner.respect).toBe(40);
    expect(RELATIONSHIP_THRESHOLDS.business_partner.familiarity).toBe(30);
  });

  test("should define thresholds for mentor", async () => {
    expect(RELATIONSHIP_THRESHOLDS.mentor).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.mentor.respect).toBe(70);
  });

  test("should define thresholds for mentee", async () => {
    expect(RELATIONSHIP_THRESHOLDS.mentee).toBeDefined();
    expect(RELATIONSHIP_THRESHOLDS.mentee.respect).toBe(-20);
    expect(RELATIONSHIP_THRESHOLDS.mentee.trust).toBe(40);
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Hitchhiker's Guide Descriptions", () => {
  test("should have descriptions for all relationship types", async () => {
    for (const type of ALL_RELATIONSHIP_TYPES) {
      const description = RELATIONSHIP_DESCRIPTIONS[type];
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(10);
    }
  });

  test("stranger description should mention ships passing", async () => {
    expect(RELATIONSHIP_DESCRIPTIONS.stranger.toLowerCase()).toContain('ships');
  });

  test("best_friend description should mention moving", async () => {
    expect(RELATIONSHIP_DESCRIPTIONS.best_friend.toLowerCase()).toContain('move');
  });

  test("rival description should mention crypto", async () => {
    expect(RELATIONSHIP_DESCRIPTIONS.rival.toLowerCase()).toContain('crypto');
  });

  test("nemesis description should mention burner accounts", async () => {
    expect(RELATIONSHIP_DESCRIPTIONS.nemesis.toLowerCase()).toContain('burner');
  });

  test("partner description should mention charts", async () => {
    expect(RELATIONSHIP_DESCRIPTIONS.partner.toLowerCase()).toContain('chart');
  });
});

/**
 * Test Suite: RelationshipManager - Core Operations
 */
test.describe("RelationshipManager - Core Operations", () => {
  test("should get null for non-existent relationship", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const relationship = manager.getRelationship(npc, 'unknown-target');
    expect(relationship).toBeNull();
  });

  test("should create and return new relationship with getOrCreateRelationship", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const relationship = manager.getOrCreateRelationship(npc, 'target-123');
    
    expect(relationship).toBeDefined();
    expect(relationship.targetId).toBe('target-123');
    expect(relationship.type).toBe('stranger');
    expect(npc.relationships['target-123']).toBeDefined();
  });

  test("should return existing relationship if already exists", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel1 = manager.getOrCreateRelationship(npc, 'target-123');
    rel1.trust = 50;
    
    const rel2 = manager.getOrCreateRelationship(npc, 'target-123');
    
    expect(rel2.trust).toBe(50);
    expect(rel1).toBe(rel2);
  });

  test("should get relationship after it has been created", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship).toBeDefined();
    expect(relationship?.targetId).toBe('target-123');
  });
});

/**
 * Test Suite: RelationshipManager - Metric Updates
 */
test.describe("RelationshipManager - Metric Updates", () => {
  test("should update trust metric", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'trust', 25);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.trust).toBe(25);
  });

  test("should update respect metric", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'respect', 30);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.respect).toBe(30);
  });

  test("should update familiarity metric", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'familiarity', 15);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.familiarity).toBe(15);
  });

  test("should update attraction metric", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'attraction', 20);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.attraction).toBe(20);
  });

  test("should accumulate metric changes", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'trust', 20);
    manager.updateMetric(npc, 'target-123', 'trust', 15);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.trust).toBe(35);
  });

  test("should clamp metric to valid range on update", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'trust', 150);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.trust).toBe(100);
  });

  test("should handle negative metric changes", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'trust', -30);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.trust).toBe(-30);
  });

  test("should update relationship type after metric change", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    manager.updateMetric(npc, 'target-123', 'familiarity', 25);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.type).toBe('acquaintance');
  });
});

/**
 * Test Suite: RelationshipManager - Interaction Recording
 */
test.describe("RelationshipManager - Interaction Recording", () => {
  test("should record positive interaction", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    const beforeCount = npc.relationships['target-123'].interactionCount;
    
    manager.recordInteraction(npc, 'target-123', true);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.interactionCount).toBe(beforeCount + 1);
    expect(relationship?.familiarity).toBeGreaterThan(0);
  });

  test("should record negative interaction", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    
    manager.recordInteraction(npc, 'target-123', false);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.interactionCount).toBe(1);
    expect(relationship?.trust).toBeLessThan(0);
  });

  test("should update lastInteraction timestamp", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    const beforeTime = npc.relationships['target-123'].lastInteraction;
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    manager.recordInteraction(npc, 'target-123', true);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.lastInteraction).toBeGreaterThanOrEqual(beforeTime);
  });

  test("should increase familiarity with interactions", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    
    // Multiple interactions should increase familiarity
    for (let i = 0; i < 5; i++) {
      manager.recordInteraction(npc, 'target-123', true);
    }
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.familiarity).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: RelationshipManager - Type Derivation
 */
test.describe("RelationshipManager - Type Derivation", () => {
  test("should derive stranger type for new relationship", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('stranger');
  });

  test("should derive acquaintance type with enough familiarity", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.familiarity = 25;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('acquaintance');
  });

  test("should derive friend type with trust and familiarity", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = 45;
    relationship.familiarity = 35;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('friend');
  });

  test("should derive close_friend type", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = 65;
    relationship.familiarity = 55;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('close_friend');
  });

  test("should derive best_friend type", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = 85;
    relationship.familiarity = 75;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('best_friend');
  });

  test("should derive rival type with respect but negative trust", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.respect = 35;
    relationship.trust = -25;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('rival');
  });

  test("should derive enemy type with very negative trust", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = -55;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('enemy');
  });

  test("should derive nemesis type with negative trust and respect", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = -85;
    relationship.respect = -45;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('nemesis');
  });

  test("should derive romantic_interest type", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.attraction = 55;
    relationship.familiarity = 35;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('romantic_interest');
  });

  test("should derive partner type", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = 65;
    relationship.attraction = 65;
    relationship.familiarity = 75;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('partner');
  });

  test("should derive business_partner type", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.trust = 55;
    relationship.respect = 45;
    relationship.familiarity = 35;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('business_partner');
  });

  test("should derive mentor type with high respect", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.respect = 75;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('mentor');
  });

  test("should derive mentee type", async () => {
    const manager = new RelationshipManager();
    const relationship = createDefaultRelationship('target-123');
    relationship.respect = -25;
    relationship.trust = 45;
    
    const type = manager.deriveRelationshipType(relationship);
    expect(type).toBe('mentee');
  });
});

/**
 * Test Suite: RelationshipManager - Queries
 */
test.describe("RelationshipManager - Queries", () => {
  test("should get friends list", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create a friend relationship
    const rel = manager.getOrCreateRelationship(npc, 'friend-1');
    rel.trust = 45;
    rel.familiarity = 35;
    rel.type = manager.deriveRelationshipType(rel);
    
    const friends = manager.getFriends(npc);
    expect(friends).toContain('friend-1');
  });

  test("should get empty friends list when no friends", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const friends = manager.getFriends(npc);
    expect(friends.length).toBe(0);
  });

  test("should get enemies list", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create an enemy relationship
    const rel = manager.getOrCreateRelationship(npc, 'enemy-1');
    rel.trust = -55;
    rel.type = manager.deriveRelationshipType(rel);
    
    const enemies = manager.getEnemies(npc);
    expect(enemies).toContain('enemy-1');
  });

  test("should get empty enemies list when no enemies", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const enemies = manager.getEnemies(npc);
    expect(enemies.length).toBe(0);
  });

  test("should get closest relationships sorted by familiarity", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create multiple relationships with different familiarity
    const rel1 = manager.getOrCreateRelationship(npc, 'person-1');
    rel1.familiarity = 30;
    
    const rel2 = manager.getOrCreateRelationship(npc, 'person-2');
    rel2.familiarity = 80;
    
    const rel3 = manager.getOrCreateRelationship(npc, 'person-3');
    rel3.familiarity = 50;
    
    const closest = manager.getClosestRelationships(npc);
    
    expect(closest.length).toBe(3);
    expect(closest[0].targetId).toBe('person-2');
    expect(closest[1].targetId).toBe('person-3');
    expect(closest[2].targetId).toBe('person-1');
  });

  test("should limit closest relationships", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create 5 relationships
    for (let i = 0; i < 5; i++) {
      const rel = manager.getOrCreateRelationship(npc, `person-${i}`);
      rel.familiarity = i * 10;
    }
    
    const closest = manager.getClosestRelationships(npc, 2);
    expect(closest.length).toBe(2);
  });

  test("should include close_friend and best_friend in friends list", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create close friend
    const closeFriend = manager.getOrCreateRelationship(npc, 'close-friend-1');
    closeFriend.trust = 65;
    closeFriend.familiarity = 55;
    closeFriend.type = manager.deriveRelationshipType(closeFriend);
    
    // Create best friend
    const bestFriend = manager.getOrCreateRelationship(npc, 'best-friend-1');
    bestFriend.trust = 85;
    bestFriend.familiarity = 75;
    bestFriend.type = manager.deriveRelationshipType(bestFriend);
    
    const friends = manager.getFriends(npc);
    expect(friends).toContain('close-friend-1');
    expect(friends).toContain('best-friend-1');
  });

  test("should include rival and nemesis in enemies list", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create rival
    const rival = manager.getOrCreateRelationship(npc, 'rival-1');
    rival.respect = 35;
    rival.trust = -25;
    rival.type = manager.deriveRelationshipType(rival);
    
    // Create nemesis
    const nemesis = manager.getOrCreateRelationship(npc, 'nemesis-1');
    nemesis.trust = -85;
    nemesis.respect = -45;
    nemesis.type = manager.deriveRelationshipType(nemesis);
    
    const enemies = manager.getEnemies(npc);
    expect(enemies).toContain('rival-1');
    expect(enemies).toContain('nemesis-1');
  });
});

/**
 * Test Suite: RelationshipManager - Decay
 */
test.describe("RelationshipManager - Decay", () => {
  test("should decay relationships over time", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.trust = 50;
    rel.familiarity = 60;
    
    manager.decayRelationships(npc, 10); // 10 days passed
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.familiarity).toBeLessThan(60);
  });

  test("should not decay familiarity below 0", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.familiarity = 5;
    
    manager.decayRelationships(npc, 100); // Many days passed
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.familiarity).toBeGreaterThanOrEqual(0);
  });

  test("should decay trust towards neutral", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.trust = 80;
    
    manager.decayRelationships(npc, 30); // 30 days passed
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.trust).toBeLessThan(80);
    expect(relationship?.trust).toBeGreaterThan(0); // Not negative
  });

  test("should update relationship type after decay", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    // Create a friend that will decay to acquaintance
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.trust = 42; // Just above friend threshold
    rel.familiarity = 32;
    rel.type = manager.deriveRelationshipType(rel);
    expect(rel.type).toBe('friend');
    
    // Decay enough to drop below thresholds
    manager.decayRelationships(npc, 50);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    // Type should be updated (maybe acquaintance or stranger now)
    expect(['stranger', 'acquaintance']).toContain(relationship?.type);
  });

  test("should not decay negative trust further negative", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.trust = -50;
    
    manager.decayRelationships(npc, 30);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    // Should move toward 0, not away
    expect(relationship?.trust).toBeGreaterThan(-50);
  });
});

/**
 * Test Suite: RelationshipManager - Favor Tracking
 */
test.describe("RelationshipManager - Favor Tracking", () => {
  test("should track owed favors", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    
    manager.addFavor(npc, 'target-123', 1);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.owedFavors).toBe(1);
  });

  test("should subtract owed favors when favor is returned", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.owedFavors = 3;
    
    manager.addFavor(npc, 'target-123', -1);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.owedFavors).toBe(2);
  });

  test("should handle negative favors (NPC owes the target)", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-123');
    
    manager.addFavor(npc, 'target-123', -2);
    
    const relationship = manager.getRelationship(npc, 'target-123');
    expect(relationship?.owedFavors).toBe(-2);
  });
});

/**
 * Test Suite: CryptoNPC Integration
 */
test.describe("CryptoNPC Integration", () => {
  test("CryptoNPC should have relationships property", async () => {
    const npc = createMockNPC();
    expect(npc.relationships).toBeDefined();
    expect(typeof npc.relationships).toBe('object');
  });

  test("should store multiple relationships on NPC", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    manager.getOrCreateRelationship(npc, 'target-1');
    manager.getOrCreateRelationship(npc, 'target-2');
    manager.getOrCreateRelationship(npc, 'target-3');
    
    expect(Object.keys(npc.relationships).length).toBe(3);
  });

  test("relationships should be serializable to JSON", async () => {
    const manager = new RelationshipManager();
    const npc = createMockNPC();
    
    const rel = manager.getOrCreateRelationship(npc, 'target-123');
    rel.trust = 50;
    rel.familiarity = 30;
    
    const json = JSON.stringify(npc.relationships);
    const parsed = JSON.parse(json);
    
    expect(parsed['target-123']).toBeDefined();
    expect(parsed['target-123'].trust).toBe(50);
    expect(parsed['target-123'].familiarity).toBe(30);
  });
});
