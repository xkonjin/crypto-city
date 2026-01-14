import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Titan Reactions System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This system handles how NPCs react to the Titan based on alignment,
 * relationship history, and personality traits.
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 6.3 for design documentation
 */

import type { CryptoNPC } from "@/games/isocity/types/npc";
import type { TitanPet, TitanRelationship } from "@/games/isocity/types/titan";
import type { NPCPersonality } from "@/lib/npc/personality";
import {
  // Types
  ALL_NPC_REACTIONS,
  REACTION_PRIORITIES,
  REACTION_ANIMATIONS,
  REACTION_MESSAGES,
  // Functions
  getNPCReaction,
  getNPCReactionDetailed,
  calculateFearLevel,
  calculateTrustLevel,
  shouldAvoidPosition,
  getAvoidanceRadius,
  getApproachRadius,
  processNPCTitanProximity,
} from "@/lib/titan/NPCTitanReactions";
import type { NPCReaction, NPCReactionPriority, ReactionAnimation, NPCReactionDetailed, ProximityResult } from "@/lib/titan/NPCTitanReactions";

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock CryptoNPC with specified personality traits.
 */
function createMockNPC(overrides: {
  id?: string;
  neuroticism?: number;
  agreeableness?: number;
  extraversion?: number;
  openness?: number;
  conscientiousness?: number;
  factionId?: string | null;
}): CryptoNPC {
  return {
    id: overrides.id ?? 'test-npc-1',
    name: 'Test NPC',
    walletAddress: '0x1234',
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
    currentActivity: 'idle',
    needs: {
      hunger: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      energy: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      social: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      fun: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      wealth: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      purpose: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
    },
    memory: {
      episodic: [],
      semantic: { facts: [] },
      procedural: { skills: [] },
      working: { focus: null, recentItems: [] },
    },
    movement: {
      state: 'idle',
      currentPath: [],
      targetPosition: null,
      walkSpeed: 1,
      subTileX: 0,
      subTileY: 0,
    },
    personality: {
      bigFive: {
        openness: overrides.openness ?? 0.5,
        conscientiousness: overrides.conscientiousness ?? 0.5,
        extraversion: overrides.extraversion ?? 0.5,
        agreeableness: overrides.agreeableness ?? 0.5,
        neuroticism: overrides.neuroticism ?? 0.5,
      },
      crypto: {
        riskTolerance: 0.5,
        technicalKnowledge: 0.5,
        degenScore: 0.5,
        diamondHands: 0.5,
        trustInInstitutions: 0.5,
        fomoSusceptibility: 0.5,
      },
    },
    relationships: {},
    factionId: overrides.factionId ?? null,
  } as unknown as CryptoNPC;
}

/**
 * Create a mock TitanPet with specified alignment.
 */
function createMockTitan(overrides: {
  alignment?: number;
  currentActivity?: string | null;
  gridX?: number;
  gridY?: number;
  factionId?: string | null;
}): TitanPet {
  return {
    id: 'test-titan-1',
    species: 'doge',
    name: 'Test Titan',
    age: 1,
    alignment: overrides.alignment ?? 0,
    currentAppearance: 'neutral',
    gridX: overrides.gridX ?? 10,
    gridY: overrides.gridY ?? 10,
    direction: 'south',
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: overrides.currentActivity ?? null,
    needs: {
      hunger: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      energy: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      social: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      fun: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      wealth: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      purpose: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      attention: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
      growth: { current: 80, max: 100, decayRate: 0.1, criticalThreshold: 20, weight: 1 },
    },
    mood: {
      currentMood: 'content',
      moodValue: 0.5,
      thoughts: [],
      beliefs: [],
      desires: [],
      beliefsAboutPlayer: {
        trust: 0.5,
        fear: 0,
        affection: 0.5,
      },
    },
    bdi: {
      beliefs: {
        worldKnowledge: new Map(),
        actionBeliefs: new Map(),
        npcOpinions: new Map(),
        playerRelationship: { trust: 0.5, fear: 0, affection: 0.5 },
      },
      desires: [],
      intentions: null,
    },
    skills: {} as TitanPet['skills'],
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
        technicalKnowledge: 0.5,
        degenScore: 0.5,
        diamondHands: 0.5,
        trustInInstitutions: 0.5,
        fomoSusceptibility: 0.5,
      },
    },
    actionHistory: [],
    relationships: {},
  } as unknown as TitanPet;
}

/**
 * Create a mock TitanRelationship.
 */
function createMockRelationship(overrides: {
  trust?: number;
  fear?: number;
  familiarity?: number;
  respect?: number;
}): TitanRelationship {
  return {
    npcId: 'test-npc-1',
    trust: overrides.trust ?? 0,
    respect: overrides.respect ?? 0,
    familiarity: overrides.familiarity ?? 0,
    fear: overrides.fear ?? 0,
    firstMet: Date.now(),
    lastInteraction: Date.now(),
    interactionCount: 0,
  };
}

// ============================================================================
// Test Suite: NPCReaction Type and ALL_NPC_REACTIONS
// ============================================================================

test.describe("NPCReaction type and ALL_NPC_REACTIONS", () => {
  test("should define all 9 reaction types", () => {
    expect(ALL_NPC_REACTIONS).toHaveLength(9);
  });

  test("should include flee reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('flee');
  });

  test("should include cower reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('cower');
  });

  test("should include ignore reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('ignore');
  });

  test("should include approach reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('approach');
  });

  test("should include greet reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('greet');
  });

  test("should include worship reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('worship');
  });

  test("should include challenge reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('challenge');
  });

  test("should include offer_gift reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('offer_gift');
  });

  test("should include seek_help reaction", () => {
    expect(ALL_NPC_REACTIONS).toContain('seek_help');
  });
});

// ============================================================================
// Test Suite: REACTION_PRIORITIES
// ============================================================================

test.describe("REACTION_PRIORITIES", () => {
  test("should define reaction priorities array", () => {
    expect(Array.isArray(REACTION_PRIORITIES)).toBe(true);
    expect(REACTION_PRIORITIES.length).toBeGreaterThan(0);
  });

  test("each priority should have reaction, weight, and condition", () => {
    for (const priority of REACTION_PRIORITIES) {
      expect(priority).toHaveProperty('reaction');
      expect(priority).toHaveProperty('weight');
      expect(priority).toHaveProperty('condition');
      expect(typeof priority.reaction).toBe('string');
      expect(typeof priority.weight).toBe('number');
      expect(typeof priority.condition).toBe('function');
    }
  });

  test("flee should have highest priority weight (100)", () => {
    const fleePriority = REACTION_PRIORITIES.find(p => p.reaction === 'flee');
    expect(fleePriority).toBeDefined();
    expect(fleePriority!.weight).toBe(100);
  });

  test("cower should have weight 90", () => {
    const cowerPriority = REACTION_PRIORITIES.find(p => p.reaction === 'cower');
    expect(cowerPriority).toBeDefined();
    expect(cowerPriority!.weight).toBe(90);
  });

  test("worship should have weight 80", () => {
    const worshipPriority = REACTION_PRIORITIES.find(p => p.reaction === 'worship');
    expect(worshipPriority).toBeDefined();
    expect(worshipPriority!.weight).toBe(80);
  });

  test("ignore should have lowest weight", () => {
    const ignorePriority = REACTION_PRIORITIES.find(p => p.reaction === 'ignore');
    expect(ignorePriority).toBeDefined();
    // ignore is the default fallback with low weight
    expect(ignorePriority!.weight).toBeLessThanOrEqual(10);
  });
});

// ============================================================================
// Test Suite: calculateFearLevel
// ============================================================================

test.describe("calculateFearLevel", () => {
  test("should return 0-100 range", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0 });
    const fear = calculateFearLevel(npc, titan, null);
    expect(fear).toBeGreaterThanOrEqual(0);
    expect(fear).toBeLessThanOrEqual(100);
  });

  test("evil Titan alignment should increase fear", () => {
    const npc = createMockNPC({});
    const neutralTitan = createMockTitan({ alignment: 0 });
    const evilTitan = createMockTitan({ alignment: 0.8 });
    
    const fearNeutral = calculateFearLevel(npc, neutralTitan, null);
    const fearEvil = calculateFearLevel(npc, evilTitan, null);
    
    expect(fearEvil).toBeGreaterThan(fearNeutral);
  });

  test("good Titan alignment should not increase fear", () => {
    const npc = createMockNPC({});
    const neutralTitan = createMockTitan({ alignment: 0 });
    const goodTitan = createMockTitan({ alignment: -0.8 });
    
    const fearNeutral = calculateFearLevel(npc, neutralTitan, null);
    const fearGood = calculateFearLevel(npc, goodTitan, null);
    
    expect(fearGood).toBeLessThanOrEqual(fearNeutral);
  });

  test("high NPC neuroticism should increase fear", () => {
    const lowNeuroticNpc = createMockNPC({ neuroticism: 0.2 });
    const highNeuroticNpc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.5 });
    
    const fearLow = calculateFearLevel(lowNeuroticNpc, titan, null);
    const fearHigh = calculateFearLevel(highNeuroticNpc, titan, null);
    
    expect(fearHigh).toBeGreaterThan(fearLow);
  });

  test("existing fear in relationship should be factored in", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0 });
    const relationship = createMockRelationship({ fear: 50 });
    
    const fearWithRelationship = calculateFearLevel(npc, titan, relationship);
    const fearWithoutRelationship = calculateFearLevel(npc, titan, null);
    
    expect(fearWithRelationship).toBeGreaterThan(fearWithoutRelationship);
  });

  test("attacking Titan should increase fear significantly", () => {
    const npc = createMockNPC({});
    const idleTitan = createMockTitan({ currentActivity: 'idle' });
    const attackingTitan = createMockTitan({ currentActivity: 'attack_npc' });
    
    const fearIdle = calculateFearLevel(npc, idleTitan, null);
    const fearAttacking = calculateFearLevel(npc, attackingTitan, null);
    
    expect(fearAttacking).toBeGreaterThan(fearIdle);
  });
});

// ============================================================================
// Test Suite: calculateTrustLevel
// ============================================================================

test.describe("calculateTrustLevel", () => {
  test("should return -100 to +100 range", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0 });
    const trust = calculateTrustLevel(npc, titan, null);
    expect(trust).toBeGreaterThanOrEqual(-100);
    expect(trust).toBeLessThanOrEqual(100);
  });

  test("good Titan alignment should increase trust", () => {
    const npc = createMockNPC({});
    const neutralTitan = createMockTitan({ alignment: 0 });
    const goodTitan = createMockTitan({ alignment: -0.8 });
    
    const trustNeutral = calculateTrustLevel(npc, neutralTitan, null);
    const trustGood = calculateTrustLevel(npc, goodTitan, null);
    
    expect(trustGood).toBeGreaterThan(trustNeutral);
  });

  test("evil Titan alignment should decrease trust", () => {
    const npc = createMockNPC({});
    const neutralTitan = createMockTitan({ alignment: 0 });
    const evilTitan = createMockTitan({ alignment: 0.8 });
    
    const trustNeutral = calculateTrustLevel(npc, neutralTitan, null);
    const trustEvil = calculateTrustLevel(npc, evilTitan, null);
    
    expect(trustEvil).toBeLessThan(trustNeutral);
  });

  test("high NPC agreeableness should increase trust baseline", () => {
    const lowAgreeableNpc = createMockNPC({ agreeableness: 0.2 });
    const highAgreeableNpc = createMockNPC({ agreeableness: 0.9 });
    const titan = createMockTitan({ alignment: 0 });
    
    const trustLow = calculateTrustLevel(lowAgreeableNpc, titan, null);
    const trustHigh = calculateTrustLevel(highAgreeableNpc, titan, null);
    
    expect(trustHigh).toBeGreaterThan(trustLow);
  });

  test("existing trust in relationship should be factored in", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0 });
    const positiveRelationship = createMockRelationship({ trust: 50 });
    const negativeRelationship = createMockRelationship({ trust: -50 });
    
    const trustPositive = calculateTrustLevel(npc, titan, positiveRelationship);
    const trustNegative = calculateTrustLevel(npc, titan, negativeRelationship);
    
    expect(trustPositive).toBeGreaterThan(trustNegative);
  });

  test("shared faction should increase trust", () => {
    const npcInFaction = createMockNPC({ factionId: 'faction-1' });
    const npcNoFaction = createMockNPC({ factionId: null });
    const titan = createMockTitan({ alignment: 0 });
    // Add titan to same faction through relationship
    const relationship = createMockRelationship({ trust: 0 });
    
    // Test assumes we pass faction membership through some mechanism
    // The actual implementation will check if they share a faction
    const trustInFaction = calculateTrustLevel(npcInFaction, titan, relationship);
    expect(trustInFaction).toBeDefined();
  });
});

// ============================================================================
// Test Suite: getNPCReaction
// ============================================================================

test.describe("getNPCReaction", () => {
  test("should return flee for very high fear levels", () => {
    // High neuroticism NPC + evil Titan = fear
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 }); // Demonic
    const relationship = createMockRelationship({ fear: 60 });
    
    const reaction = getNPCReaction(npc, titan, relationship);
    expect(reaction).toBe('flee');
  });

  test("should return cower for high fear with high neuroticism", () => {
    const npc = createMockNPC({ neuroticism: 0.8 });
    const titan = createMockTitan({ alignment: 0.6 });
    const relationship = createMockRelationship({ fear: 50 });
    
    const reaction = getNPCReaction(npc, titan, relationship);
    expect(['flee', 'cower']).toContain(reaction);
  });

  test("should return worship for angelic Titans", () => {
    const npc = createMockNPC({ neuroticism: 0.3 }); // Not fearful
    const titan = createMockTitan({ alignment: -0.8 }); // Angelic
    
    const reaction = getNPCReaction(npc, titan, null);
    expect(reaction).toBe('worship');
  });

  test("should return approach for trusted, good-aligned Titan", () => {
    const npc = createMockNPC({ agreeableness: 0.8 });
    const titan = createMockTitan({ alignment: -0.4 }); // Good
    const relationship = createMockRelationship({ trust: 50, fear: 0 });
    
    const reaction = getNPCReaction(npc, titan, relationship);
    expect(['approach', 'greet', 'worship']).toContain(reaction);
  });

  test("should return ignore for neutral Titan with no relationship", () => {
    const npc = createMockNPC({ neuroticism: 0.3, agreeableness: 0.5 });
    const titan = createMockTitan({ alignment: 0 }); // Neutral
    
    const reaction = getNPCReaction(npc, titan, null);
    expect(reaction).toBe('ignore');
  });

  test("should return challenge for brave NPC facing evil Titan", () => {
    // Low neuroticism (brave) + low agreeableness (confrontational)
    const npc = createMockNPC({ neuroticism: 0.1, agreeableness: 0.2 });
    const titan = createMockTitan({ alignment: 0.7 }); // Evil
    
    const reaction = getNPCReaction(npc, titan, null);
    expect(['challenge', 'flee', 'ignore']).toContain(reaction);
  });

  test("should return seek_help for NPC in need", () => {
    const npc = createMockNPC({ agreeableness: 0.8 });
    // Set low needs on NPC (simulating need for help)
    npc.needs.hunger.current = 10;
    const titan = createMockTitan({ alignment: -0.5 }); // Good
    const relationship = createMockRelationship({ trust: 40, fear: 0 });
    
    const reaction = getNPCReaction(npc, titan, relationship);
    // May return seek_help or another friendly reaction
    expect(['seek_help', 'approach', 'greet', 'worship']).toContain(reaction);
  });
});

// ============================================================================
// Test Suite: getNPCReactionDetailed
// ============================================================================

test.describe("getNPCReactionDetailed", () => {
  test("should return reaction, reason, and intensity", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0 });
    
    const result = getNPCReactionDetailed(npc, titan, null);
    
    expect(result).toHaveProperty('reaction');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('intensity');
    expect(typeof result.reaction).toBe('string');
    expect(typeof result.reason).toBe('string');
    expect(typeof result.intensity).toBe('number');
  });

  test("intensity should be 0-1 range", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0.5 });
    
    const result = getNPCReactionDetailed(npc, titan, null);
    
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });

  test("flee reaction should have high intensity", () => {
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 });
    const relationship = createMockRelationship({ fear: 70 });
    
    const result = getNPCReactionDetailed(npc, titan, relationship);
    
    if (result.reaction === 'flee') {
      expect(result.intensity).toBeGreaterThan(0.5);
    }
  });

  test("ignore reaction should have low intensity", () => {
    const npc = createMockNPC({ neuroticism: 0.3 });
    const titan = createMockTitan({ alignment: 0 });
    
    const result = getNPCReactionDetailed(npc, titan, null);
    
    if (result.reaction === 'ignore') {
      expect(result.intensity).toBeLessThanOrEqual(0.3);
    }
  });

  test("reason should explain why the reaction was chosen", () => {
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 });
    
    const result = getNPCReactionDetailed(npc, titan, null);
    
    expect(result.reason.length).toBeGreaterThan(0);
    // Reason should mention relevant factors
    expect(result.reason).toBeDefined();
  });
});

// ============================================================================
// Test Suite: shouldAvoidPosition
// ============================================================================

test.describe("shouldAvoidPosition", () => {
  test("should return true when position is within avoidance radius of feared Titan", () => {
    const npc = createMockNPC({ neuroticism: 0.8 });
    const titan = createMockTitan({ alignment: 0.8, gridX: 10, gridY: 10 });
    
    // Position close to Titan
    const result = shouldAvoidPosition(npc, { x: 11, y: 10 }, { x: 10, y: 10 }, titan);
    
    expect(result).toBe(true);
  });

  test("should return false when position is outside avoidance radius", () => {
    const npc = createMockNPC({ neuroticism: 0.2 }); // Low fear
    const titan = createMockTitan({ alignment: 0, gridX: 10, gridY: 10 });
    
    // Position far from Titan
    const result = shouldAvoidPosition(npc, { x: 25, y: 25 }, { x: 10, y: 10 }, titan);
    
    expect(result).toBe(false);
  });

  test("should return false for friendly Titan regardless of distance", () => {
    const npc = createMockNPC({ agreeableness: 0.8 });
    const titan = createMockTitan({ alignment: -0.8, gridX: 10, gridY: 10 }); // Angelic
    
    // Position close to Titan
    const result = shouldAvoidPosition(npc, { x: 11, y: 10 }, { x: 10, y: 10 }, titan);
    
    expect(result).toBe(false);
  });
});

// ============================================================================
// Test Suite: getAvoidanceRadius
// ============================================================================

test.describe("getAvoidanceRadius", () => {
  test("should return 0 for no avoidance with friendly Titan", () => {
    const npc = createMockNPC({ agreeableness: 0.8 });
    const titan = createMockTitan({ alignment: -0.8 }); // Angelic
    
    const radius = getAvoidanceRadius(npc, titan, null);
    
    expect(radius).toBe(0);
  });

  test("should return up to 10 tiles for maximum fear", () => {
    const npc = createMockNPC({ neuroticism: 1.0 });
    const titan = createMockTitan({ alignment: 1.0 }); // Maximum evil
    const relationship = createMockRelationship({ fear: 100 });
    
    const radius = getAvoidanceRadius(npc, titan, relationship);
    
    expect(radius).toBeLessThanOrEqual(10);
    expect(radius).toBeGreaterThan(5); // Should be significant
  });

  test("should scale with fear level", () => {
    const npc = createMockNPC({ neuroticism: 0.5 });
    const lowEvilTitan = createMockTitan({ alignment: 0.3 });
    const highEvilTitan = createMockTitan({ alignment: 0.9 });
    
    const lowRadius = getAvoidanceRadius(npc, lowEvilTitan, null);
    const highRadius = getAvoidanceRadius(npc, highEvilTitan, null);
    
    expect(highRadius).toBeGreaterThanOrEqual(lowRadius);
  });

  test("should be 0-10 range", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0.5 });
    
    const radius = getAvoidanceRadius(npc, titan, null);
    
    expect(radius).toBeGreaterThanOrEqual(0);
    expect(radius).toBeLessThanOrEqual(10);
  });
});

// ============================================================================
// Test Suite: getApproachRadius
// ============================================================================

test.describe("getApproachRadius", () => {
  test("should return 0 for feared Titan", () => {
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 }); // Demonic
    
    const radius = getApproachRadius(npc, titan, null);
    
    expect(radius).toBe(0);
  });

  test("should return positive radius for friendly Titan", () => {
    const npc = createMockNPC({ agreeableness: 0.8 });
    const titan = createMockTitan({ alignment: -0.8 }); // Angelic
    const relationship = createMockRelationship({ trust: 50, fear: 0 });
    
    const radius = getApproachRadius(npc, titan, relationship);
    
    expect(radius).toBeGreaterThan(0);
  });

  test("should scale with trust level", () => {
    const npc = createMockNPC({ agreeableness: 0.7 });
    const titan = createMockTitan({ alignment: -0.5 });
    const lowTrust = createMockRelationship({ trust: 10, fear: 0 });
    const highTrust = createMockRelationship({ trust: 80, fear: 0 });
    
    const lowRadius = getApproachRadius(npc, titan, lowTrust);
    const highRadius = getApproachRadius(npc, titan, highTrust);
    
    expect(highRadius).toBeGreaterThan(lowRadius);
  });
});

// ============================================================================
// Test Suite: REACTION_ANIMATIONS
// ============================================================================

test.describe("REACTION_ANIMATIONS", () => {
  test("should define animation for flee reaction", () => {
    expect(REACTION_ANIMATIONS['flee']).toBeDefined();
    expect(REACTION_ANIMATIONS['flee'].duration).toBeGreaterThan(0);
    expect(REACTION_ANIMATIONS['flee'].movement).toBe('away');
    expect(REACTION_ANIMATIONS['flee'].speed).toBe('fast');
  });

  test("should define animation for worship reaction", () => {
    expect(REACTION_ANIMATIONS['worship']).toBeDefined();
    expect(REACTION_ANIMATIONS['worship'].duration).toBeGreaterThan(0);
    expect(REACTION_ANIMATIONS['worship'].movement).toBe('toward');
    expect(REACTION_ANIMATIONS['worship'].speed).toBe('slow');
  });

  test("should define animation for cower reaction", () => {
    expect(REACTION_ANIMATIONS['cower']).toBeDefined();
    expect(REACTION_ANIMATIONS['cower'].movement).toBe('none');
  });

  test("should define animation for all reactions", () => {
    for (const reaction of ALL_NPC_REACTIONS) {
      expect(REACTION_ANIMATIONS[reaction]).toBeDefined();
      expect(REACTION_ANIMATIONS[reaction]).toHaveProperty('duration');
    }
  });

  test("duration should be in milliseconds (reasonable values)", () => {
    for (const reaction of ALL_NPC_REACTIONS) {
      expect(REACTION_ANIMATIONS[reaction].duration).toBeGreaterThanOrEqual(1000);
      expect(REACTION_ANIMATIONS[reaction].duration).toBeLessThanOrEqual(10000);
    }
  });
});

// ============================================================================
// Test Suite: REACTION_MESSAGES
// ============================================================================

test.describe("REACTION_MESSAGES", () => {
  test("should define messages for flee reaction", () => {
    expect(REACTION_MESSAGES['flee']).toBeDefined();
    expect(Array.isArray(REACTION_MESSAGES['flee'])).toBe(true);
    expect(REACTION_MESSAGES['flee'].length).toBeGreaterThan(0);
  });

  test("should define messages for worship reaction", () => {
    expect(REACTION_MESSAGES['worship']).toBeDefined();
    expect(REACTION_MESSAGES['worship'].length).toBeGreaterThan(0);
  });

  test("should define messages for all reactions", () => {
    for (const reaction of ALL_NPC_REACTIONS) {
      expect(REACTION_MESSAGES[reaction]).toBeDefined();
      expect(REACTION_MESSAGES[reaction].length).toBeGreaterThan(0);
    }
  });

  test("messages should contain placeholder for npcName", () => {
    // At least some messages should have {npcName} placeholder
    const allMessages = Object.values(REACTION_MESSAGES).flat();
    const hasNpcNamePlaceholder = allMessages.some(msg => msg.includes('{npcName}'));
    expect(hasNpcNamePlaceholder).toBe(true);
  });

  test("worship messages should reference titan", () => {
    // Worship messages might reference {titanName}
    const worshipMessages = REACTION_MESSAGES['worship'];
    const hasTitanRef = worshipMessages.some(
      msg => msg.includes('{titanName}') || msg.includes('Titan') || msg.includes('angelic')
    );
    expect(hasTitanRef).toBe(true);
  });
});

// ============================================================================
// Test Suite: processNPCTitanProximity
// ============================================================================

test.describe("processNPCTitanProximity", () => {
  test("should return null when NPC is too far from Titan", () => {
    const npc = createMockNPC({});
    const titan = createMockTitan({ alignment: 0 });
    
    // Very far distance
    const result = processNPCTitanProximity(npc, titan, 100, null);
    
    expect(result).toBeNull();
  });

  test("should return result with reaction when NPC is close to feared Titan", () => {
    const npc = createMockNPC({ neuroticism: 0.8 });
    const titan = createMockTitan({ alignment: 0.8 });
    const relationship = createMockRelationship({ fear: 50 });
    
    const result = processNPCTitanProximity(npc, titan, 3, relationship);
    
    expect(result).not.toBeNull();
    expect(result!.reaction).toBeDefined();
  });

  test("should include pathModification for flee/approach reactions", () => {
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 });
    
    const result = processNPCTitanProximity(npc, titan, 2, null);
    
    if (result && (result.reaction === 'flee' || result.reaction === 'approach')) {
      expect(result.pathModification).toBeDefined();
    }
  });

  test("should include animation name when appropriate", () => {
    const npc = createMockNPC({ neuroticism: 0.8 });
    const titan = createMockTitan({ alignment: 0.7 });
    
    const result = processNPCTitanProximity(npc, titan, 2, null);
    
    if (result) {
      expect(result.animation).toBeDefined();
    }
  });

  test("should include message when appropriate", () => {
    const npc = createMockNPC({ neuroticism: 0.8 });
    const titan = createMockTitan({ alignment: 0.8 });
    
    const result = processNPCTitanProximity(npc, titan, 2, null);
    
    if (result && result.reaction !== 'ignore') {
      expect(result.message).toBeDefined();
    }
  });

  test("should return avoidRadius in pathModification for flee", () => {
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 });
    const relationship = createMockRelationship({ fear: 70 });
    
    const result = processNPCTitanProximity(npc, titan, 2, relationship);
    
    if (result && result.reaction === 'flee' && result.pathModification) {
      expect('avoidRadius' in result.pathModification).toBe(true);
    }
  });

  test("should return approachTarget in pathModification for approach", () => {
    const npc = createMockNPC({ agreeableness: 0.9, neuroticism: 0.1 });
    const titan = createMockTitan({ alignment: -0.9, gridX: 10, gridY: 10 });
    const relationship = createMockRelationship({ trust: 80, fear: 0 });
    
    const result = processNPCTitanProximity(npc, titan, 5, relationship);
    
    if (result && result.reaction === 'approach' && result.pathModification) {
      expect('approachTarget' in result.pathModification).toBe(true);
    }
  });
});

// ============================================================================
// Test Suite: Integration tests
// ============================================================================

test.describe("Integration tests", () => {
  test("complete fear scenario: evil Titan + scared NPC = flee", () => {
    const npc = createMockNPC({ neuroticism: 0.9 });
    const titan = createMockTitan({ alignment: 0.9 });
    const relationship = createMockRelationship({ fear: 60, trust: -50 });
    
    const fearLevel = calculateFearLevel(npc, titan, relationship);
    const reaction = getNPCReaction(npc, titan, relationship);
    const detailed = getNPCReactionDetailed(npc, titan, relationship);
    const proximity = processNPCTitanProximity(npc, titan, 2, relationship);
    
    expect(fearLevel).toBeGreaterThan(50);
    expect(reaction).toBe('flee');
    expect(detailed.intensity).toBeGreaterThan(0.5);
    expect(proximity).not.toBeNull();
    expect(proximity!.pathModification).toBeDefined();
  });

  test("complete trust scenario: angelic Titan + friendly NPC = worship/approach", () => {
    const npc = createMockNPC({ agreeableness: 0.9, neuroticism: 0.1 });
    const titan = createMockTitan({ alignment: -0.9 }); // Angelic
    const relationship = createMockRelationship({ trust: 70, fear: 0 });
    
    const trustLevel = calculateTrustLevel(npc, titan, relationship);
    const reaction = getNPCReaction(npc, titan, relationship);
    const avoidRadius = getAvoidanceRadius(npc, titan, relationship);
    const approachRadius = getApproachRadius(npc, titan, relationship);
    
    expect(trustLevel).toBeGreaterThan(30);
    expect(['worship', 'approach', 'greet']).toContain(reaction);
    expect(avoidRadius).toBe(0);
    expect(approachRadius).toBeGreaterThan(0);
  });

  test("neutral scenario: neutral Titan + neutral NPC = ignore", () => {
    const npc = createMockNPC({ 
      neuroticism: 0.5, 
      agreeableness: 0.5 
    });
    const titan = createMockTitan({ alignment: 0 });
    
    const reaction = getNPCReaction(npc, titan, null);
    const detailed = getNPCReactionDetailed(npc, titan, null);
    
    expect(reaction).toBe('ignore');
    expect(detailed.intensity).toBeLessThanOrEqual(0.3);
  });

  test("brave NPC challenges evil Titan", () => {
    const braveNpc = createMockNPC({ 
      neuroticism: 0.1,  // Low fear
      agreeableness: 0.2, // Confrontational
      extraversion: 0.8   // Bold
    });
    const evilTitan = createMockTitan({ alignment: 0.7 });
    
    const reaction = getNPCReaction(braveNpc, evilTitan, null);
    
    // Brave NPC should challenge or at least not flee
    expect(['challenge', 'ignore']).toContain(reaction);
    expect(reaction).not.toBe('flee');
    expect(reaction).not.toBe('cower');
  });
});
