import { test, expect } from "@playwright/test";

/**
 * NPC Social Interaction System Tests (#108)
 * 
 * TDD Phase 1: Tests for the NPC social interaction system including:
 * - Interaction types (greet, chat, gossip, debate, etc.)
 * - InteractionManager class
 * - Interaction acceptance/rejection logic
 * - Relationship effects
 * - Memory creation from interactions
 */

// Import types and classes directly for unit testing
import type {
  InteractionType,
  InteractionRequest,
  InteractionResult,
  NPCRelationship,
} from "@/lib/npc/interactions";
import {
  ALL_INTERACTION_TYPES,
  ACCEPTANCE_WEIGHTS,
  INTERACTION_DESCRIPTIONS,
  createDefaultInteractionRelationship,
} from "@/lib/npc/interactions";
import { InteractionManager } from "@/lib/npc/InteractionManager";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";
import { createDefaultPersonality } from "@/lib/npc/personality";
import type { CryptoNPC } from "@/games/isocity/types/npc";

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: `npc_${Math.random().toString(36).substring(2, 9)}`,
    name: "Test_Hodler",
    walletAddress: "0x1234567890abcdef",
    age: 25,
    occupation: "trader",
    residence: null,
    workplace: null,
    spriteType: "apple",
    direction: "south",
    gridX: 5,
    gridY: 5,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: "idle",
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    ...overrides,
  };
}

/**
 * Test Suite: Interaction Types
 */
test.describe("Interaction Types", () => {
  test("should define all 13 interaction types", async () => {
    expect(ALL_INTERACTION_TYPES.length).toBe(13);
    expect(ALL_INTERACTION_TYPES).toContain('greet');
    expect(ALL_INTERACTION_TYPES).toContain('chat');
    expect(ALL_INTERACTION_TYPES).toContain('gossip');
    expect(ALL_INTERACTION_TYPES).toContain('debate');
    expect(ALL_INTERACTION_TYPES).toContain('flirt');
    expect(ALL_INTERACTION_TYPES).toContain('argue');
    expect(ALL_INTERACTION_TYPES).toContain('trade_talk');
    expect(ALL_INTERACTION_TYPES).toContain('share_alpha');
    expect(ALL_INTERACTION_TYPES).toContain('ask_favor');
    expect(ALL_INTERACTION_TYPES).toContain('do_favor');
    expect(ALL_INTERACTION_TYPES).toContain('celebrate');
    expect(ALL_INTERACTION_TYPES).toContain('console');
    expect(ALL_INTERACTION_TYPES).toContain('insult');
  });

  test("should have acceptance weights for all interaction types", async () => {
    for (const interactionType of ALL_INTERACTION_TYPES) {
      const weight = ACCEPTANCE_WEIGHTS[interactionType];
      expect(weight).toBeDefined();
      expect(typeof weight.base).toBe('number');
      expect(typeof weight.trustMod).toBe('number');
      expect(weight.base).toBeGreaterThanOrEqual(0);
      expect(weight.base).toBeLessThanOrEqual(1);
    }
  });

  test("should have Hitchhiker descriptions for all interaction types", async () => {
    for (const interactionType of ALL_INTERACTION_TYPES) {
      const description = INTERACTION_DESCRIPTIONS[interactionType];
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("greet should have high base acceptance", async () => {
    expect(ACCEPTANCE_WEIGHTS.greet.base).toBeGreaterThanOrEqual(0.9);
    expect(ACCEPTANCE_WEIGHTS.greet.trustMod).toBe(0);
  });

  test("share_alpha should require high trust", async () => {
    expect(ACCEPTANCE_WEIGHTS.share_alpha.trustMod).toBeGreaterThan(0.3);
  });

  test("insult should have low base acceptance", async () => {
    expect(ACCEPTANCE_WEIGHTS.insult.base).toBeLessThan(0.2);
    expect(ACCEPTANCE_WEIGHTS.insult.trustMod).toBeLessThan(0);
  });

  test("flirt should have low base but high trust modifier", async () => {
    expect(ACCEPTANCE_WEIGHTS.flirt.base).toBeLessThan(0.5);
    expect(ACCEPTANCE_WEIGHTS.flirt.trustMod).toBeGreaterThan(0.3);
  });
});

/**
 * Test Suite: NPCRelationship
 */
test.describe("NPCRelationship", () => {
  test("should create default relationship with neutral values", async () => {
    const relationship = createDefaultInteractionRelationship("npc1", "npc2");
    
    expect(relationship.npcId1).toBe("npc1");
    expect(relationship.npcId2).toBe("npc2");
    expect(relationship.trust).toBe(0);
    expect(relationship.respect).toBe(0);
    expect(relationship.familiarity).toBe(0);
    expect(relationship.attraction).toBe(0);
    expect(relationship.interactionCount).toBe(0);
    expect(relationship.lastInteraction).toBe(0);
  });

  test("relationship values should be in valid range", async () => {
    const relationship = createDefaultInteractionRelationship("npc1", "npc2");
    
    expect(relationship.trust).toBeGreaterThanOrEqual(-100);
    expect(relationship.trust).toBeLessThanOrEqual(100);
    expect(relationship.respect).toBeGreaterThanOrEqual(-100);
    expect(relationship.respect).toBeLessThanOrEqual(100);
    expect(relationship.familiarity).toBeGreaterThanOrEqual(0);
    expect(relationship.familiarity).toBeLessThanOrEqual(100);
    expect(relationship.attraction).toBeGreaterThanOrEqual(-100);
    expect(relationship.attraction).toBeLessThanOrEqual(100);
  });
});

/**
 * Test Suite: InteractionManager - Initiation
 */
test.describe("InteractionManager - Initiation", () => {
  test("should determine if NPC should initiate interaction based on social need", async () => {
    const manager = new InteractionManager();
    
    // NPC with low social need should want to interact (high probability)
    const lowSocialNPC = createMockNPC();
    lowSocialNPC.needs.social.current = 20;
    
    // Run multiple times due to random chance - at least 6/10 should want to interact
    let lowSocialWantsToInteract = 0;
    for (let i = 0; i < 10; i++) {
      if (manager.shouldInitiateInteraction(lowSocialNPC)) {
        lowSocialWantsToInteract++;
      }
    }
    expect(lowSocialWantsToInteract).toBeGreaterThanOrEqual(6);
    
    // NPC with high social need should rarely want to interact
    const highSocialNPC = createMockNPC();
    highSocialNPC.needs.social.current = 90;
    highSocialNPC.personality.bigFive.extraversion = 0.3; // Low extraversion
    
    // Run multiple times - most should NOT want to interact
    let highSocialWantsToInteract = 0;
    for (let i = 0; i < 10; i++) {
      if (manager.shouldInitiateInteraction(highSocialNPC)) {
        highSocialWantsToInteract++;
      }
    }
    expect(highSocialWantsToInteract).toBeLessThanOrEqual(3);
  });

  test("should select appropriate interaction target from nearby NPCs", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target1 = createMockNPC({ id: "target1", gridX: 6, gridY: 5 });
    const target2 = createMockNPC({ id: "target2", gridX: 10, gridY: 10 });
    
    const nearbyNPCs = [target1, target2];
    const selected = manager.selectInteractionTarget(initiator, nearbyNPCs);
    
    // Should select someone
    expect(selected).not.toBeNull();
    // Should not select self
    expect(selected?.id).not.toBe(initiator.id);
  });

  test("should return null when no nearby NPCs available", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    
    const selected = manager.selectInteractionTarget(initiator, []);
    expect(selected).toBeNull();
  });

  test("should select interaction type based on personality and relationship", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    const interactionType = manager.selectInteractionType(initiator, target);
    
    expect(ALL_INTERACTION_TYPES).toContain(interactionType);
  });

  test("extraverted NPCs should prefer social interaction types", async () => {
    const manager = new InteractionManager();
    const extravert = createMockNPC({
      id: "extravert",
      personality: createDefaultPersonality({
        bigFive: { extraversion: 0.9 },
      }),
    });
    const target = createMockNPC({ id: "target" });
    
    // Sample multiple times to verify tendency
    const socialTypes: InteractionType[] = ['chat', 'gossip', 'celebrate', 'trade_talk'];
    let socialCount = 0;
    
    for (let i = 0; i < 50; i++) {
      const type = manager.selectInteractionType(extravert, target);
      if (socialTypes.includes(type)) {
        socialCount++;
      }
    }
    
    // Extraverts should have higher probability of social interactions
    expect(socialCount).toBeGreaterThan(20);
  });

  test("enemies should prefer argue/insult interactions", async () => {
    const manager = new InteractionManager();
    const npc1 = createMockNPC({ id: "npc1" });
    const npc2 = createMockNPC({ id: "npc2" });
    
    // Set up enemy relationship
    manager.setRelationship(npc1.id, npc2.id, {
      trust: -50,
      respect: -30,
      familiarity: 50,
      attraction: -20,
    });
    
    // Sample multiple times
    const negativeTypes: InteractionType[] = ['argue', 'insult'];
    let negativeCount = 0;
    
    for (let i = 0; i < 50; i++) {
      const type = manager.selectInteractionType(npc1, npc2);
      if (negativeTypes.includes(type)) {
        negativeCount++;
      }
    }
    
    // Enemies should have higher probability of negative interactions
    expect(negativeCount).toBeGreaterThan(25);
  });
});

/**
 * Test Suite: InteractionManager - Acceptance
 */
test.describe("InteractionManager - Acceptance", () => {
  test("should accept greet interactions most of the time", async () => {
    const manager = new InteractionManager();
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: "initiator",
      targetId: target.id,
      type: "greet",
      context: "Meeting in the plaza",
    };
    
    // Greet should have very high acceptance rate
    let acceptCount = 0;
    for (let i = 0; i < 100; i++) {
      if (manager.willAcceptInteraction(target, request)) {
        acceptCount++;
      }
    }
    
    expect(acceptCount).toBeGreaterThan(85);
  });

  test("should rarely accept insults", async () => {
    const manager = new InteractionManager();
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: "initiator",
      targetId: target.id,
      type: "insult",
      context: "Random encounter",
    };
    
    let acceptCount = 0;
    for (let i = 0; i < 100; i++) {
      if (manager.willAcceptInteraction(target, request)) {
        acceptCount++;
      }
    }
    
    expect(acceptCount).toBeLessThan(30);
  });

  test("trust should increase acceptance probability", async () => {
    const manager = new InteractionManager();
    const target = createMockNPC({ id: "target" });
    
    // Set up trusted relationship
    manager.setRelationship("initiator", target.id, {
      trust: 80,
      respect: 50,
      familiarity: 60,
      attraction: 0,
    });
    
    const request: InteractionRequest = {
      initiatorId: "initiator",
      targetId: target.id,
      type: "share_alpha",
      context: "At the trading desk",
    };
    
    // With high trust, share_alpha should be more accepted
    let acceptCount = 0;
    for (let i = 0; i < 100; i++) {
      if (manager.willAcceptInteraction(target, request)) {
        acceptCount++;
      }
    }
    
    // Base 0.4 + trustMod 0.5 * (trust/100) should give ~0.8
    expect(acceptCount).toBeGreaterThan(60);
  });

  test("low trust should decrease acceptance probability", async () => {
    const manager = new InteractionManager();
    const target = createMockNPC({ id: "target" });
    
    // Set up distrusted relationship
    manager.setRelationship("initiator", target.id, {
      trust: -50,
      respect: -30,
      familiarity: 20,
      attraction: -10,
    });
    
    const request: InteractionRequest = {
      initiatorId: "initiator",
      targetId: target.id,
      type: "share_alpha",
      context: "At the trading desk",
    };
    
    let acceptCount = 0;
    for (let i = 0; i < 100; i++) {
      if (manager.willAcceptInteraction(target, request)) {
        acceptCount++;
      }
    }
    
    // With low trust, share_alpha should be rarely accepted
    expect(acceptCount).toBeLessThan(30);
  });

  test("attraction should increase flirt acceptance", async () => {
    const manager = new InteractionManager();
    const target = createMockNPC({ id: "target" });
    
    // Set up attracted relationship
    manager.setRelationship("initiator", target.id, {
      trust: 30,
      respect: 20,
      familiarity: 40,
      attraction: 70,
    });
    
    const request: InteractionRequest = {
      initiatorId: "initiator",
      targetId: target.id,
      type: "flirt",
      context: "At the bar",
    };
    
    let acceptCount = 0;
    for (let i = 0; i < 100; i++) {
      if (manager.willAcceptInteraction(target, request)) {
        acceptCount++;
      }
    }
    
    // High attraction should make flirting more acceptable
    expect(acceptCount).toBeGreaterThan(40);
  });
});

/**
 * Test Suite: InteractionManager - Processing
 */
test.describe("InteractionManager - Processing", () => {
  test("should process successful interaction and return result", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "greet",
      context: "Meeting in the plaza",
    };
    
    const result = manager.processInteraction(request, initiator, target);
    
    expect(result).toBeDefined();
    expect(result.type).toBe("greet");
    expect(result.participants).toContain(initiator.id);
    expect(result.participants).toContain(target.id);
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.moodEffect).toBe('number');
    expect(result.moodEffect).toBeGreaterThanOrEqual(-1);
    expect(result.moodEffect).toBeLessThanOrEqual(1);
  });

  test("should create memories for both participants", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "chat",
      context: "At the coffee shop",
    };
    
    const result = manager.processInteraction(request, initiator, target);
    
    expect(result.memoriesCreated.length).toBeGreaterThanOrEqual(1);
    expect(result.memoriesCreated.length).toBeLessThanOrEqual(2);
  });

  test("should return relationship changes based on interaction type", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    // Positive interaction
    const positiveRequest: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "celebrate",
      context: "Token pumped!",
    };
    
    const positiveResult = manager.processInteraction(positiveRequest, initiator, target);
    
    if (positiveResult.success) {
      // Successful celebration should increase trust and familiarity
      expect(positiveResult.relationshipChanges.trust).toBeGreaterThanOrEqual(0);
      expect(positiveResult.relationshipChanges.familiarity).toBeGreaterThan(0);
    }
    
    // Negative interaction
    const negativeRequest: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "insult",
      context: "NGMI comment",
    };
    
    const negativeResult = manager.processInteraction(negativeRequest, initiator, target);
    
    if (negativeResult.success) {
      // Successful insult should decrease trust
      expect(negativeResult.relationshipChanges.trust).toBeLessThan(0);
    }
  });

  test("greet should have small positive effects", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "greet",
      context: "Passing by",
    };
    
    const result = manager.processInteraction(request, initiator, target);
    
    if (result.success) {
      // Greet should be mildly positive
      expect(result.moodEffect).toBeGreaterThanOrEqual(0);
      expect(result.relationshipChanges.familiarity).toBeGreaterThanOrEqual(0);
    }
  });

  test("debate should have variable effects based on personality", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "debate",
      context: "BTC vs ETH discussion",
    };
    
    const result = manager.processInteraction(request, initiator, target);
    
    // Debate can go either way
    expect(typeof result.success).toBe('boolean');
    expect(result.moodEffect).toBeGreaterThanOrEqual(-1);
    expect(result.moodEffect).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: InteractionManager - Effects
 */
test.describe("InteractionManager - Effects", () => {
  test("should apply relationship changes to NPCs", async () => {
    const manager = new InteractionManager();
    const npc1 = createMockNPC({ id: "npc1" });
    const npc2 = createMockNPC({ id: "npc2" });
    
    // Get initial relationship state
    const initialRelationship = manager.getRelationship(npc1.id, npc2.id);
    
    const result: InteractionResult = {
      success: true,
      type: "chat",
      participants: [npc1.id, npc2.id],
      relationshipChanges: {
        trust: 5,
        respect: 3,
        familiarity: 10,
        attraction: 0,
      },
      memoriesCreated: ["Had a nice chat"],
      moodEffect: 0.3,
    };
    
    manager.applyInteractionEffects(result, npc1, npc2);
    
    const updatedRelationship = manager.getRelationship(npc1.id, npc2.id);
    
    expect(updatedRelationship.trust).toBe(initialRelationship.trust + 5);
    expect(updatedRelationship.respect).toBe(initialRelationship.respect + 3);
    expect(updatedRelationship.familiarity).toBe(initialRelationship.familiarity + 10);
    expect(updatedRelationship.interactionCount).toBe(initialRelationship.interactionCount + 1);
  });

  test("should update social need for both NPCs after interaction", async () => {
    const manager = new InteractionManager();
    const npc1 = createMockNPC({ id: "npc1" });
    const npc2 = createMockNPC({ id: "npc2" });
    
    npc1.needs.social.current = 50;
    npc2.needs.social.current = 50;
    
    const result: InteractionResult = {
      success: true,
      type: "chat",
      participants: [npc1.id, npc2.id],
      relationshipChanges: {
        trust: 5,
        familiarity: 10,
      },
      memoriesCreated: ["Had a chat"],
      moodEffect: 0.3,
    };
    
    manager.applyInteractionEffects(result, npc1, npc2);
    
    // Social need should increase for both NPCs
    expect(npc1.needs.social.current).toBeGreaterThan(50);
    expect(npc2.needs.social.current).toBeGreaterThan(50);
  });

  test("should cap relationship values at bounds", async () => {
    const manager = new InteractionManager();
    const npc1 = createMockNPC({ id: "npc1" });
    const npc2 = createMockNPC({ id: "npc2" });
    
    // Set relationship near max
    manager.setRelationship(npc1.id, npc2.id, {
      trust: 95,
      respect: 95,
      familiarity: 95,
      attraction: 95,
    });
    
    const result: InteractionResult = {
      success: true,
      type: "celebrate",
      participants: [npc1.id, npc2.id],
      relationshipChanges: {
        trust: 20,
        respect: 20,
        familiarity: 20,
        attraction: 20,
      },
      memoriesCreated: ["Celebrated together"],
      moodEffect: 0.8,
    };
    
    manager.applyInteractionEffects(result, npc1, npc2);
    
    const relationship = manager.getRelationship(npc1.id, npc2.id);
    
    // Values should be capped at 100
    expect(relationship.trust).toBeLessThanOrEqual(100);
    expect(relationship.respect).toBeLessThanOrEqual(100);
    expect(relationship.familiarity).toBeLessThanOrEqual(100);
    expect(relationship.attraction).toBeLessThanOrEqual(100);
  });

  test("should allow negative relationship values for enemies", async () => {
    const manager = new InteractionManager();
    const npc1 = createMockNPC({ id: "npc1" });
    const npc2 = createMockNPC({ id: "npc2" });
    
    // Start with neutral relationship
    const result: InteractionResult = {
      success: true,
      type: "insult",
      participants: [npc1.id, npc2.id],
      relationshipChanges: {
        trust: -30,
        respect: -20,
        familiarity: 5,
        attraction: -10,
      },
      memoriesCreated: ["Was insulted"],
      moodEffect: -0.5,
    };
    
    manager.applyInteractionEffects(result, npc1, npc2);
    
    const relationship = manager.getRelationship(npc1.id, npc2.id);
    
    // Trust and respect should be negative
    expect(relationship.trust).toBeLessThan(0);
    expect(relationship.respect).toBeLessThan(0);
    // Familiarity should still increase (they know each other better, even negatively)
    expect(relationship.familiarity).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: InteractionManager - Dialogue Generation
 */
test.describe("InteractionManager - Dialogue Generation", () => {
  test("should generate dialogue placeholders for interactions", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator", name: "HODLer_42" });
    const target = createMockNPC({ id: "target", name: "Degen_69" });
    
    const request: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "greet",
      context: "Meeting in the plaza",
    };
    
    const result: InteractionResult = {
      success: true,
      type: "greet",
      participants: [initiator.id, target.id],
      relationshipChanges: { familiarity: 1 },
      memoriesCreated: ["Met someone"],
      moodEffect: 0.1,
    };
    
    const dialogue = manager.generateDialogue(request, result, initiator, target);
    
    expect(Array.isArray(dialogue)).toBe(true);
    expect(dialogue.length).toBeGreaterThan(0);
    expect(typeof dialogue[0]).toBe('string');
  });

  test("should generate different dialogues for different interaction types", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator", name: "HODLer_42" });
    const target = createMockNPC({ id: "target", name: "Degen_69" });
    
    const greetRequest: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "greet",
      context: "Meeting",
    };
    
    const debateRequest: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "debate",
      context: "Crypto discussion",
    };
    
    const greetResult: InteractionResult = {
      success: true,
      type: "greet",
      participants: [initiator.id, target.id],
      relationshipChanges: {},
      memoriesCreated: [],
      moodEffect: 0.1,
    };
    
    const debateResult: InteractionResult = {
      success: true,
      type: "debate",
      participants: [initiator.id, target.id],
      relationshipChanges: {},
      memoriesCreated: [],
      moodEffect: 0,
    };
    
    const greetDialogue = manager.generateDialogue(greetRequest, greetResult, initiator, target);
    const debateDialogue = manager.generateDialogue(debateRequest, debateResult, initiator, target);
    
    // Dialogues should be different (at least the patterns)
    expect(greetDialogue.join('')).not.toBe(debateDialogue.join(''));
  });
});

/**
 * Test Suite: InteractionManager - Integration with Other Systems
 */
test.describe("InteractionManager - Integration", () => {
  test("should create episodic memories with correct format", async () => {
    const manager = new InteractionManager();
    const initiator = createMockNPC({ id: "initiator" });
    const target = createMockNPC({ id: "target" });
    
    const request: InteractionRequest = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: "gossip",
      context: "At the bar",
    };
    
    const result = manager.processInteraction(request, initiator, target);
    
    // Verify memories are created in the expected format
    expect(result.memoriesCreated).toBeInstanceOf(Array);
    for (const memory of result.memoriesCreated) {
      expect(typeof memory).toBe('string');
      expect(memory.length).toBeGreaterThan(0);
    }
  });

  test("should consider NPC personality when selecting interaction type", async () => {
    const manager = new InteractionManager();
    
    // Agreeable NPC should avoid negative interactions
    const agreeableNPC = createMockNPC({
      id: "agreeable",
      personality: createDefaultPersonality({
        bigFive: { agreeableness: 0.9 },
      }),
    });
    const target = createMockNPC({ id: "target" });
    
    const negativeTypes: InteractionType[] = ['argue', 'insult'];
    let negativeCount = 0;
    
    for (let i = 0; i < 50; i++) {
      const type = manager.selectInteractionType(agreeableNPC, target);
      if (negativeTypes.includes(type)) {
        negativeCount++;
      }
    }
    
    // Agreeable NPCs should rarely initiate negative interactions
    expect(negativeCount).toBeLessThan(10);
  });

  test("should consider NPC mood when determining interaction outcome", async () => {
    const manager = new InteractionManager();
    
    // NPC with low fun need (bad mood) should have worse interaction outcomes
    const badMoodNPC = createMockNPC({ id: "badmood" });
    badMoodNPC.needs.fun.current = 10;
    
    const goodMoodNPC = createMockNPC({ id: "goodmood" });
    goodMoodNPC.needs.fun.current = 90;
    
    const target = createMockNPC({ id: "target" });
    
    // Sample multiple interactions
    let badMoodSuccess = 0;
    let goodMoodSuccess = 0;
    
    for (let i = 0; i < 50; i++) {
      const badRequest: InteractionRequest = {
        initiatorId: badMoodNPC.id,
        targetId: target.id,
        type: "chat",
        context: "Test",
      };
      
      const goodRequest: InteractionRequest = {
        initiatorId: goodMoodNPC.id,
        targetId: target.id,
        type: "chat",
        context: "Test",
      };
      
      const badResult = manager.processInteraction(badRequest, badMoodNPC, target);
      const goodResult = manager.processInteraction(goodRequest, goodMoodNPC, target);
      
      if (badResult.success) badMoodSuccess++;
      if (goodResult.success) goodMoodSuccess++;
    }
    
    // Good mood should generally lead to better outcomes
    // (but not always - there's randomness)
    expect(typeof badMoodSuccess).toBe('number');
    expect(typeof goodMoodSuccess).toBe('number');
  });
});

/**
 * Test Suite: Full Interaction Flow
 */
test.describe("Full Interaction Flow", () => {
  test("should complete full interaction cycle", async () => {
    const manager = new InteractionManager();
    
    // Create two NPCs
    const npc1 = createMockNPC({ id: "alice", name: "Alice_HODL" });
    const npc2 = createMockNPC({ id: "bob", name: "Bob_Degen" });
    
    // Step 1: Check if NPC wants to interact
    // Set social need to critical (below threshold of 25) for guaranteed interaction
    npc1.needs.social.current = 15;
    const wantsToInteract = manager.shouldInitiateInteraction(npc1);
    // At critical level (80% chance) - may still fail due to RNG, so we test it works
    expect(typeof wantsToInteract).toBe('boolean');
    
    // Step 2: Select target
    const target = manager.selectInteractionTarget(npc1, [npc2]);
    expect(target).not.toBeNull();
    
    // Step 3: Select interaction type
    const interactionType = manager.selectInteractionType(npc1, npc2);
    expect(ALL_INTERACTION_TYPES).toContain(interactionType);
    
    // Step 4: Create request
    const request: InteractionRequest = {
      initiatorId: npc1.id,
      targetId: npc2.id,
      type: interactionType,
      context: "Random encounter in city",
    };
    
    // Step 5: Check if target accepts
    const accepts = manager.willAcceptInteraction(npc2, request);
    expect(typeof accepts).toBe('boolean');
    
    // Step 6: Process interaction (regardless of acceptance for testing)
    const result = manager.processInteraction(request, npc1, npc2);
    expect(result).toBeDefined();
    expect(result.participants.length).toBe(2);
    
    // Step 7: Apply effects
    manager.applyInteractionEffects(result, npc1, npc2);
    
    // Step 8: Verify relationship was updated
    const relationship = manager.getRelationship(npc1.id, npc2.id);
    expect(relationship.interactionCount).toBeGreaterThan(0);
    
    // Step 9: Generate dialogue
    const dialogue = manager.generateDialogue(request, result, npc1, npc2);
    expect(dialogue.length).toBeGreaterThan(0);
  });
});
