import { test, expect } from "@playwright/test";

/**
 * DialogueManager Tests (US-010/US-011)
 * 
 * TDD Phase 1: Tests for the central DialogueManager that:
 * - Imports all 8 archetype pools
 * - Tracks cooldowns per NPC
 * - Selects dialogue based on archetype, context, market condition, relationship
 * - Uses weighted random selection
 * - Filters by cooldown
 * - Provides methods for dialogue selection, usage tracking, repetition rate, cooldown clearing
 */

import type { CryptoNPC } from "@/games/isocity/types/npc";
import type { PersonalityArchetype } from "@/lib/npc/personality";
import {
  type DialogueContext,
  type DialogueSelection,
  type MarketCondition,
  type RelationshipLevel,
} from "@/lib/npc/dialogue/types";
import {
  DialogueManager,
  type DialogueOptions,
} from "@/lib/npc/dialogue/DialogueManager";

// ============================================================================
// TEST HELPER FACTORIES
// ============================================================================

/**
 * Creates a minimal mock NPC for testing dialogue selection
 */
function createMockNPC(
  archetype: PersonalityArchetype,
  overrides?: Partial<CryptoNPC>
): CryptoNPC {
  return {
    id: `test-npc-${archetype}-${Date.now()}`,
    name: `Test ${archetype}`,
    walletAddress: "0x1234567890abcdef",
    age: 30,
    occupation: "trader",
    residence: null,
    workplace: null,
    spriteType: "apple",
    direction: "south",
    gridX: 0,
    gridY: 0,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: null,
    personalityArchetype: archetype,
    needs: {
      hunger: 100,
      energy: 100,
      social: 100,
      fun: 100,
      wealth: 100,
      purpose: 100,
      lastUpdated: Date.now(),
    },
    memory: {
      episodic: [],
      semantic: [],
      procedural: [],
      working: {
        currentContext: [],
        recentInteractions: [],
        activeGoals: [],
        emotionalState: { valence: 0, arousal: 0 },
      },
    },
    movement: {
      currentPath: [],
      pathIndex: 0,
      isMoving: false,
      state: "idle",
      targetPosition: null,
      movementProgress: 0,
      animationFrame: 0,
    },
    personality: {
      bigFive: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      cryptoTraits: {
        riskTolerance: 0.5,
        technicalSavvy: 0.5,
        communityOrientation: 0.5,
        hodlMentality: 0.5,
        fudResistance: 0.5,
      },
      archetype,
    },
    relationships: {},
    ...overrides,
  } as CryptoNPC;
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe("DialogueManager Class Structure", () => {
  test("should be importable and constructable", async () => {
    const manager = new DialogueManager();
    expect(manager).toBeDefined();
    expect(manager).toBeInstanceOf(DialogueManager);
  });

  test("should have getDialogue method", async () => {
    const manager = new DialogueManager();
    expect(typeof manager.getDialogue).toBe("function");
  });

  test("should have recordDialogueUsed method", async () => {
    const manager = new DialogueManager();
    expect(typeof manager.recordDialogueUsed).toBe("function");
  });

  test("should have getRepetitionRate method", async () => {
    const manager = new DialogueManager();
    expect(typeof manager.getRepetitionRate).toBe("function");
  });

  test("should have clearCooldowns method", async () => {
    const manager = new DialogueManager();
    expect(typeof manager.clearCooldowns).toBe("function");
  });
});

test.describe("DialogueManager.getDialogue - Basic Selection", () => {
  test("should return DialogueSelection for bitcoin_maxi archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    expect(selection.text).toBeDefined();
    expect(typeof selection.text).toBe("string");
    expect(selection.text.length).toBeGreaterThan(0);
    expect(selection.sourcePool).toBe("bitcoin_maxi");
    expect(selection.context).toBe("greeting");
    expect(selection.cooldownUntil).toBeGreaterThan(Date.now());
  });

  test("should return DialogueSelection for eth_builder archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("eth_builder");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("eth_builder");
  });

  test("should return DialogueSelection for degen_trader archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("degen_trader");

    const selection = manager.getDialogue(npc, "market_commentary");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("degen_trader");
  });

  test("should return DialogueSelection for privacy_maxi archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("privacy_maxi");

    const selection = manager.getDialogue(npc, "idle_chatter");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("privacy_maxi");
  });

  test("should return DialogueSelection for normie_investor archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("normie_investor");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("normie_investor");
  });

  test("should return DialogueSelection for nft_flipper archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("nft_flipper");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("nft_flipper");
  });

  test("should return DialogueSelection for staking_grandma archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("staking_grandma");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("staking_grandma");
  });

  test("should return DialogueSelection for protocol_politician archetype", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("protocol_politician");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    expect(selection.sourcePool).toBe("protocol_politician");
  });

  test("should handle all 5 dialogue contexts", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");
    const contexts: DialogueContext[] = [
      "greeting",
      "market_commentary",
      "player_reaction",
      "idle_chatter",
      "relationship_level",
    ];

    for (const context of contexts) {
      manager.clearCooldowns(npc.id);
      const selection = manager.getDialogue(npc, context);
      expect(selection).toBeDefined();
      expect(selection.context).toBe(context);
    }
  });
});

test.describe("DialogueManager.getDialogue - Market Condition Filtering", () => {
  test("should filter by bull market condition", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "market_commentary", {
      marketCondition: "bull",
    });

    expect(selection).toBeDefined();
    // The selection should come from pools that match bull market or neutral
    expect(selection.text.length).toBeGreaterThan(0);
  });

  test("should filter by bear market condition", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "market_commentary", {
      marketCondition: "bear",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });

  test("should filter by crab market condition", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "market_commentary", {
      marketCondition: "crab",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });

  test("should filter by volatile market condition", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "market_commentary", {
      marketCondition: "volatile",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });
});

test.describe("DialogueManager.getDialogue - Relationship Level Filtering", () => {
  test("should filter by stranger relationship level", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "relationship_level", {
      relationshipLevel: "stranger",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });

  test("should filter by friend relationship level", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "relationship_level", {
      relationshipLevel: "friend",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });

  test("should filter by close_friend relationship level", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "relationship_level", {
      relationshipLevel: "close_friend",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });
});

test.describe("DialogueManager - Cooldown System", () => {
  test("should not return the same line twice in rapid succession", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    // Get multiple selections and track usage
    const selectedTexts = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const selection = manager.getDialogue(npc, "greeting");
      if (selection) {
        // Record that we used this dialogue
        manager.recordDialogueUsed(npc.id, selection.text);
        // If we've seen this before during this run, that's repetition
        if (selectedTexts.has(selection.text)) {
          // There should be minimal immediate repetition
        }
        selectedTexts.add(selection.text);
      }
    }

    // We should have variety - not just the same line 10 times
    expect(selectedTexts.size).toBeGreaterThan(1);
  });

  test("recordDialogueUsed should track usage for cooldowns", async () => {
    const manager = new DialogueManager();
    const npcId = "test-npc-1";
    const text = "Have fun staying poor.";

    // Record usage
    manager.recordDialogueUsed(npcId, text);

    // The internal tracking should now have this recorded
    // (we verify via the repetition rate or by checking it won't select again)
    const rate = manager.getRepetitionRate(npcId);
    expect(rate).toBeDefined();
    expect(typeof rate).toBe("number");
  });

  test("clearCooldowns with npcId should clear only that NPC's cooldowns", async () => {
    const manager = new DialogueManager();
    const npc1 = createMockNPC("bitcoin_maxi", { id: "npc-1" });
    const npc2 = createMockNPC("eth_builder", { id: "npc-2" });

    // Use some dialogue for both NPCs
    const sel1 = manager.getDialogue(npc1, "greeting");
    const sel2 = manager.getDialogue(npc2, "greeting");
    if (sel1) manager.recordDialogueUsed(npc1.id, sel1.text);
    if (sel2) manager.recordDialogueUsed(npc2.id, sel2.text);

    // Clear only npc-1's cooldowns
    manager.clearCooldowns("npc-1");

    // npc-1 should be able to get the same line again
    // npc-2 should still have cooldowns
    const rate1 = manager.getRepetitionRate("npc-1");
    const rate2 = manager.getRepetitionRate("npc-2");

    // After clearing, npc-1 history should be empty
    expect(rate1).toBe(0);
    // npc-2 should still have some history
    expect(rate2).toBeGreaterThanOrEqual(0);
  });

  test("clearCooldowns without npcId should clear all cooldowns", async () => {
    const manager = new DialogueManager();
    const npc1 = createMockNPC("bitcoin_maxi", { id: "npc-1" });
    const npc2 = createMockNPC("eth_builder", { id: "npc-2" });

    // Use some dialogue for both NPCs
    const sel1 = manager.getDialogue(npc1, "greeting");
    const sel2 = manager.getDialogue(npc2, "greeting");
    if (sel1) manager.recordDialogueUsed(npc1.id, sel1.text);
    if (sel2) manager.recordDialogueUsed(npc2.id, sel2.text);

    // Clear all cooldowns
    manager.clearCooldowns();

    // Both should have no history now
    expect(manager.getRepetitionRate("npc-1")).toBe(0);
    expect(manager.getRepetitionRate("npc-2")).toBe(0);
  });
});

test.describe("DialogueManager - Weighted Selection", () => {
  test("weighted selection should produce varied results", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    // Make many selections to test variety
    const selectedTexts = new Map<string, number>();
    for (let i = 0; i < 50; i++) {
      manager.clearCooldowns(npc.id);
      const selection = manager.getDialogue(npc, "idle_chatter");
      if (selection) {
        const count = selectedTexts.get(selection.text) || 0;
        selectedTexts.set(selection.text, count + 1);
      }
    }

    // Should have selected multiple different lines
    expect(selectedTexts.size).toBeGreaterThan(1);
  });

  test("should include originalWeight in selection result when available", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "greeting");

    expect(selection).toBeDefined();
    // originalWeight is optional but should be present if the pool line had one
    if (selection.originalWeight !== undefined) {
      expect(selection.originalWeight).toBeGreaterThan(0);
      expect(selection.originalWeight).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("DialogueManager - Repetition Rate", () => {
  test("getRepetitionRate should return 0 for new NPC with no history", async () => {
    const manager = new DialogueManager();

    const rate = manager.getRepetitionRate("brand-new-npc");

    expect(rate).toBe(0);
  });

  test("getRepetitionRate should increase with repeated usage", async () => {
    const manager = new DialogueManager();
    const npcId = "test-npc-repetition";

    // Record the same text multiple times
    manager.recordDialogueUsed(npcId, "Test line 1");
    manager.recordDialogueUsed(npcId, "Test line 1");
    manager.recordDialogueUsed(npcId, "Test line 2");

    const rate = manager.getRepetitionRate(npcId);

    // 3 total usages, 1 repeat => rate should be > 0
    expect(rate).toBeGreaterThan(0);
  });

  test("repetition rate should stay below 5% over 50 selections", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    // Make 50 selections across all contexts (without market filtering to maximize pool access)
    // With 60+ unique lines available and strong cooldowns, repetition should be minimal
    const contexts: DialogueContext[] = [
      "greeting",
      "market_commentary",
      "idle_chatter",
      "player_reaction",
      "relationship_level",
    ];

    for (let i = 0; i < 50; i++) {
      const context = contexts[i % contexts.length];
      // Don't specify market condition to access ALL pools for each context
      const selection = manager.getDialogue(npc, context);
      if (selection) {
        manager.recordDialogueUsed(npc.id, selection.text);
      }
    }

    const rate = manager.getRepetitionRate(npc.id);

    // Repetition rate should be below 5%
    // With 60+ unique lines available across all contexts (without market filtering),
    // and with cooldown system preventing immediate re-selection,
    // 50 selections should have minimal repetition
    expect(rate).toBeLessThan(0.05);
  });
});

test.describe("DialogueManager - Graceful Fallback", () => {
  test("should fall back gracefully when no matching pool found", async () => {
    const manager = new DialogueManager();
    // Create NPC with archetype but no specific pool match might occur
    const npc = createMockNPC("bitcoin_maxi");

    // Even if all cooldowns are active, should still try to return something
    // or return null gracefully
    const selection = manager.getDialogue(npc, "greeting");

    // Either we get a valid selection OR it returns null (not throw)
    if (selection !== null) {
      expect(selection.text).toBeDefined();
    }
  });

  test("should handle NPC without personalityArchetype by falling back", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");
    // Remove the archetype to test fallback
    delete (npc as unknown as Record<string, unknown>).personalityArchetype;

    // Should not throw, should fall back to default archetype
    const selection = manager.getDialogue(npc, "greeting");

    // Should still work with fallback to bitcoin_maxi
    expect(selection).toBeDefined();
  });
});

test.describe("DialogueManager - All 8 Archetypes Integration", () => {
  const archetypes: PersonalityArchetype[] = [
    "bitcoin_maxi",
    "eth_builder",
    "degen_trader",
    "privacy_maxi",
    "normie_investor",
    "nft_flipper",
    "staking_grandma",
    "protocol_politician",
  ];

  for (const archetype of archetypes) {
    test(`should have dialogue pool for ${archetype}`, async () => {
      const manager = new DialogueManager();
      const npc = createMockNPC(archetype);

      const selection = manager.getDialogue(npc, "greeting");

      expect(selection).toBeDefined();
      expect(selection.sourcePool).toBe(archetype);
      expect(selection.text.length).toBeGreaterThan(0);
    });
  }
});

test.describe("DialogueManager - Combined Options", () => {
  test("should handle both marketCondition and relationshipLevel options", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "market_commentary", {
      marketCondition: "bull",
      relationshipLevel: "friend",
    });

    expect(selection).toBeDefined();
    expect(selection.text.length).toBeGreaterThan(0);
  });

  test("should handle targetNpcId option for social context", async () => {
    const manager = new DialogueManager();
    const npc = createMockNPC("bitcoin_maxi");

    const selection = manager.getDialogue(npc, "greeting", {
      targetNpcId: "target-npc-123",
    });

    expect(selection).toBeDefined();
    // The targetNpcId doesn't necessarily change the selection
    // but shouldn't break anything
    expect(selection.text.length).toBeGreaterThan(0);
  });
});
