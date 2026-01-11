import { test, expect } from "@playwright/test";

/**
 * NPC Dialogue Types Tests (US-001)
 * 
 * TDD Phase 1: Tests for the dialogue pool type system including:
 * - DialogueContext type/enum
 * - MarketCondition type
 * - RelationshipLevel type
 * - WeightedDialogue interface
 * - DialogueRequirement interface
 * - DialoguePool interface
 * - DialogueSelection result type
 */

import type { PersonalityArchetype } from "@/lib/npc/personality";
import {
  DIALOGUE_CONTEXTS,
  MARKET_CONDITIONS,
  RELATIONSHIP_LEVELS,
  type DialogueContext,
  type MarketCondition,
  type RelationshipLevel,
  type WeightedDialogue,
  type DialogueRequirement,
  type DialoguePool,
  type DialogueSelection,
} from "@/lib/npc/dialogue/types";

/**
 * Test Suite: DialogueContext Type
 */
test.describe("DialogueContext Type", () => {
  test("should define all 5 dialogue contexts", async () => {
    expect(DIALOGUE_CONTEXTS.length).toBe(5);
    expect(DIALOGUE_CONTEXTS).toContain('greeting');
    expect(DIALOGUE_CONTEXTS).toContain('market_commentary');
    expect(DIALOGUE_CONTEXTS).toContain('player_reaction');
    expect(DIALOGUE_CONTEXTS).toContain('idle_chatter');
    expect(DIALOGUE_CONTEXTS).toContain('relationship_level');
  });

  test("should allow valid DialogueContext values", async () => {
    const contexts: DialogueContext[] = [
      'greeting',
      'market_commentary',
      'player_reaction',
      'idle_chatter',
      'relationship_level',
    ];
    
    expect(contexts.length).toBe(5);
    for (const context of contexts) {
      expect(DIALOGUE_CONTEXTS).toContain(context);
    }
  });
});

/**
 * Test Suite: MarketCondition Type
 */
test.describe("MarketCondition Type", () => {
  test("should define all 4 market conditions", async () => {
    expect(MARKET_CONDITIONS.length).toBe(4);
    expect(MARKET_CONDITIONS).toContain('bull');
    expect(MARKET_CONDITIONS).toContain('bear');
    expect(MARKET_CONDITIONS).toContain('crab');
    expect(MARKET_CONDITIONS).toContain('volatile');
  });

  test("should allow valid MarketCondition values", async () => {
    const conditions: MarketCondition[] = ['bull', 'bear', 'crab', 'volatile'];
    
    expect(conditions.length).toBe(4);
    for (const condition of conditions) {
      expect(MARKET_CONDITIONS).toContain(condition);
    }
  });
});

/**
 * Test Suite: RelationshipLevel Type
 */
test.describe("RelationshipLevel Type", () => {
  test("should define all 5 relationship levels", async () => {
    expect(RELATIONSHIP_LEVELS.length).toBe(5);
    expect(RELATIONSHIP_LEVELS).toContain('stranger');
    expect(RELATIONSHIP_LEVELS).toContain('acquaintance');
    expect(RELATIONSHIP_LEVELS).toContain('friend');
    expect(RELATIONSHIP_LEVELS).toContain('close_friend');
    expect(RELATIONSHIP_LEVELS).toContain('best_friend');
  });

  test("relationship levels should be ordered from coldest to warmest", async () => {
    expect(RELATIONSHIP_LEVELS[0]).toBe('stranger');
    expect(RELATIONSHIP_LEVELS[1]).toBe('acquaintance');
    expect(RELATIONSHIP_LEVELS[2]).toBe('friend');
    expect(RELATIONSHIP_LEVELS[3]).toBe('close_friend');
    expect(RELATIONSHIP_LEVELS[4]).toBe('best_friend');
  });

  test("should allow valid RelationshipLevel values", async () => {
    const levels: RelationshipLevel[] = [
      'stranger',
      'acquaintance',
      'friend',
      'close_friend',
      'best_friend',
    ];
    
    expect(levels.length).toBe(5);
    for (const level of levels) {
      expect(RELATIONSHIP_LEVELS).toContain(level);
    }
  });
});

/**
 * Test Suite: WeightedDialogue Interface
 */
test.describe("WeightedDialogue Interface", () => {
  test("should have required text property", async () => {
    const dialogue: WeightedDialogue = {
      text: "Have fun staying poor.",
      weight: 1.0,
      cooldown: 300000, // 5 minutes in ms
    };
    
    expect(dialogue.text).toBe("Have fun staying poor.");
    expect(typeof dialogue.text).toBe('string');
  });

  test("should have required weight property (0-1)", async () => {
    const dialogue: WeightedDialogue = {
      text: "WAGMI, fren.",
      weight: 0.8,
      cooldown: 180000,
    };
    
    expect(dialogue.weight).toBe(0.8);
    expect(dialogue.weight).toBeGreaterThanOrEqual(0);
    expect(dialogue.weight).toBeLessThanOrEqual(1);
  });

  test("should have required cooldown property in milliseconds", async () => {
    const dialogue: WeightedDialogue = {
      text: "Sir, this is a Wendy's.",
      weight: 0.5,
      cooldown: 600000, // 10 minutes
    };
    
    expect(dialogue.cooldown).toBe(600000);
    expect(typeof dialogue.cooldown).toBe('number');
  });

  test("should support optional requirements array", async () => {
    const requirement: DialogueRequirement = {
      type: 'market_condition',
      value: 'bull',
    };
    
    const dialogue: WeightedDialogue = {
      text: "Number go up! This is definitely sustainable.",
      weight: 0.7,
      cooldown: 300000,
      requirements: [requirement],
    };
    
    expect(dialogue.requirements).toBeDefined();
    expect(dialogue.requirements?.length).toBe(1);
    expect(dialogue.requirements?.[0].type).toBe('market_condition');
  });

  test("should work without optional requirements", async () => {
    const dialogue: WeightedDialogue = {
      text: "gm",
      weight: 1.0,
      cooldown: 60000,
    };
    
    expect(dialogue.requirements).toBeUndefined();
  });
});

/**
 * Test Suite: DialogueRequirement Interface
 */
test.describe("DialogueRequirement Interface", () => {
  test("should support market_condition requirement type", async () => {
    const requirement: DialogueRequirement = {
      type: 'market_condition',
      value: 'bear',
    };
    
    expect(requirement.type).toBe('market_condition');
    expect(requirement.value).toBe('bear');
  });

  test("should support relationship_level requirement type", async () => {
    const requirement: DialogueRequirement = {
      type: 'relationship_level',
      value: 'friend',
    };
    
    expect(requirement.type).toBe('relationship_level');
    expect(requirement.value).toBe('friend');
  });

  test("should support min_relationship requirement type", async () => {
    const requirement: DialogueRequirement = {
      type: 'min_relationship',
      value: 'acquaintance',
    };
    
    expect(requirement.type).toBe('min_relationship');
    expect(requirement.value).toBe('acquaintance');
  });

  test("should support time_of_day requirement type", async () => {
    const requirement: DialogueRequirement = {
      type: 'time_of_day',
      value: 'morning',
    };
    
    expect(requirement.type).toBe('time_of_day');
    expect(requirement.value).toBe('morning');
  });
});

/**
 * Test Suite: DialoguePool Interface
 */
test.describe("DialoguePool Interface", () => {
  test("should require archetype property", async () => {
    const pool: DialoguePool = {
      archetype: 'bitcoin_maxi',
      context: 'greeting',
      lines: [],
    };
    
    expect(pool.archetype).toBe('bitcoin_maxi');
  });

  test("should require context property", async () => {
    const pool: DialoguePool = {
      archetype: 'degen_trader',
      context: 'market_commentary',
      lines: [],
    };
    
    expect(pool.context).toBe('market_commentary');
  });

  test("should require lines array", async () => {
    const lines: WeightedDialogue[] = [
      { text: "Line 1", weight: 1.0, cooldown: 300000 },
      { text: "Line 2", weight: 0.8, cooldown: 300000 },
    ];
    
    const pool: DialoguePool = {
      archetype: 'eth_builder',
      context: 'idle_chatter',
      lines,
    };
    
    expect(pool.lines.length).toBe(2);
    expect(pool.lines[0].text).toBe("Line 1");
  });

  test("should support optional relationshipLevel filter", async () => {
    const pool: DialoguePool = {
      archetype: 'staking_grandma',
      context: 'relationship_level',
      relationshipLevel: 'friend',
      lines: [],
    };
    
    expect(pool.relationshipLevel).toBe('friend');
  });

  test("should support optional marketCondition filter", async () => {
    const pool: DialoguePool = {
      archetype: 'degen_trader',
      context: 'market_commentary',
      marketCondition: 'bull',
      lines: [],
    };
    
    expect(pool.marketCondition).toBe('bull');
  });

  test("should work with all optional fields", async () => {
    const pool: DialoguePool = {
      archetype: 'privacy_maxi',
      context: 'player_reaction',
      relationshipLevel: 'acquaintance',
      marketCondition: 'bear',
      lines: [
        {
          text: "They're watching. They're always watching.",
          weight: 0.9,
          cooldown: 300000,
          requirements: [{ type: 'min_relationship', value: 'stranger' }],
        },
      ],
    };
    
    expect(pool.archetype).toBe('privacy_maxi');
    expect(pool.context).toBe('player_reaction');
    expect(pool.relationshipLevel).toBe('acquaintance');
    expect(pool.marketCondition).toBe('bear');
    expect(pool.lines.length).toBe(1);
  });
});

/**
 * Test Suite: DialogueSelection Result Type
 */
test.describe("DialogueSelection Interface", () => {
  test("should contain selected text", async () => {
    const selection: DialogueSelection = {
      text: "Few understand.",
      sourcePool: 'bitcoin_maxi',
      context: 'idle_chatter',
      cooldownUntil: Date.now() + 300000,
    };
    
    expect(selection.text).toBe("Few understand.");
    expect(typeof selection.text).toBe('string');
  });

  test("should contain sourcePool (archetype that dialogue came from)", async () => {
    const selection: DialogueSelection = {
      text: "Up only, ser.",
      sourcePool: 'degen_trader',
      context: 'market_commentary',
      cooldownUntil: Date.now() + 300000,
    };
    
    expect(selection.sourcePool).toBe('degen_trader');
  });

  test("should contain context of selected dialogue", async () => {
    const selection: DialogueSelection = {
      text: "gm gm gm",
      sourcePool: 'nft_flipper',
      context: 'greeting',
      cooldownUntil: Date.now() + 60000,
    };
    
    expect(selection.context).toBe('greeting');
  });

  test("should contain cooldownUntil timestamp", async () => {
    const now = Date.now();
    const cooldownMs = 300000;
    
    const selection: DialogueSelection = {
      text: "DYOR, NFA.",
      sourcePool: 'normie_investor',
      context: 'player_reaction',
      cooldownUntil: now + cooldownMs,
    };
    
    expect(selection.cooldownUntil).toBeGreaterThan(now);
    expect(typeof selection.cooldownUntil).toBe('number');
  });

  test("should support optional originalWeight property", async () => {
    const selection: DialogueSelection = {
      text: "Have you considered using Monero?",
      sourcePool: 'privacy_maxi',
      context: 'idle_chatter',
      cooldownUntil: Date.now() + 300000,
      originalWeight: 0.7,
    };
    
    expect(selection.originalWeight).toBe(0.7);
  });

  test("should support optional requirements property", async () => {
    const selection: DialogueSelection = {
      text: "Bull markets make me nervous. Where's the catch?",
      sourcePool: 'privacy_maxi',
      context: 'market_commentary',
      cooldownUntil: Date.now() + 300000,
      requirements: [{ type: 'market_condition', value: 'bull' }],
    };
    
    expect(selection.requirements?.length).toBe(1);
    expect(selection.requirements?.[0].type).toBe('market_condition');
  });
});

/**
 * Test Suite: Type Integration with PersonalityArchetype
 */
test.describe("Integration with PersonalityArchetype", () => {
  test("DialoguePool archetype should be valid PersonalityArchetype", async () => {
    // This test verifies the type imports work correctly
    const archetypes: PersonalityArchetype[] = [
      'bitcoin_maxi',
      'eth_builder',
      'degen_trader',
      'privacy_maxi',
      'normie_investor',
      'nft_flipper',
      'staking_grandma',
      'protocol_politician',
    ];

    for (const archetype of archetypes) {
      const pool: DialoguePool = {
        archetype,
        context: 'greeting',
        lines: [],
      };
      expect(pool.archetype).toBe(archetype);
    }
  });
});
