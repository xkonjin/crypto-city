import { test, expect } from "@playwright/test";

/**
 * Staking Grandma Dialogue Pool Tests (US-008)
 * 
 * TDD Phase 1: Tests for the staking_grandma dialogue pool including:
 * - Minimum 50 unique dialogue lines
 * - All 5 dialogue contexts covered
 * - Multiple relationship levels covered
 * - Multiple market conditions covered
 * - Weighted distribution with cooldowns
 * - Distinctly Staking Grandma voice
 * 
 * Voice characteristics:
 * - Patient, long-term holder
 * - Loves passive income
 * - Uses: "yields", "compound interest", "patience pays"
 * - Wisdom about market cycles
 * - Grandmotherly but crypto-savvy
 * - "I've seen crashes before, dear"
 */

import type { DialoguePool, WeightedDialogue } from "@/lib/npc/dialogue/types";
import { 
  DIALOGUE_CONTEXTS, 
  MARKET_CONDITIONS, 
  RELATIONSHIP_LEVELS,
  type DialogueContext,
  type MarketCondition,
  type RelationshipLevel,
} from "@/lib/npc/dialogue/types";
import { STAKING_GRANDMA_POOLS } from "@/lib/npc/dialogue/pools/stakingGrandma";

/**
 * Test Suite: Staking Grandma Dialogue Pool Structure
 */
test.describe("Staking Grandma Dialogue Pool Structure", () => {
  test("should export STAKING_GRANDMA_POOLS as an array of DialoguePool", async () => {
    expect(STAKING_GRANDMA_POOLS).toBeDefined();
    expect(Array.isArray(STAKING_GRANDMA_POOLS)).toBe(true);
    expect(STAKING_GRANDMA_POOLS.length).toBeGreaterThan(0);
  });

  test("all pools should have archetype set to staking_grandma", async () => {
    for (const pool of STAKING_GRANDMA_POOLS) {
      expect(pool.archetype).toBe('staking_grandma');
    }
  });

  test("all pools should have valid context values", async () => {
    for (const pool of STAKING_GRANDMA_POOLS) {
      expect(DIALOGUE_CONTEXTS).toContain(pool.context);
    }
  });

  test("all pools should have non-empty lines array", async () => {
    for (const pool of STAKING_GRANDMA_POOLS) {
      expect(pool.lines.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Test Suite: Minimum Line Count Requirements
 */
test.describe("Minimum Line Count", () => {
  test("should have at least 50 unique dialogue lines total", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    const uniqueTexts = new Set(allLines.map(line => line.text));
    
    expect(uniqueTexts.size).toBeGreaterThanOrEqual(50);
  });

  test("should have no duplicate dialogue texts across all pools", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    const texts = allLines.map(line => line.text);
    const uniqueTexts = new Set(texts);
    
    expect(uniqueTexts.size).toBe(texts.length);
  });
});

/**
 * Test Suite: Context Coverage
 */
test.describe("Dialogue Context Coverage", () => {
  test("should cover greeting context", async () => {
    const greetingPools = STAKING_GRANDMA_POOLS.filter(p => p.context === 'greeting');
    expect(greetingPools.length).toBeGreaterThan(0);
    
    const greetingLines = greetingPools.flatMap(p => p.lines);
    expect(greetingLines.length).toBeGreaterThanOrEqual(5);
  });

  test("should cover market_commentary context", async () => {
    const marketPools = STAKING_GRANDMA_POOLS.filter(p => p.context === 'market_commentary');
    expect(marketPools.length).toBeGreaterThan(0);
    
    const marketLines = marketPools.flatMap(p => p.lines);
    expect(marketLines.length).toBeGreaterThanOrEqual(10);
  });

  test("should cover player_reaction context", async () => {
    const reactionPools = STAKING_GRANDMA_POOLS.filter(p => p.context === 'player_reaction');
    expect(reactionPools.length).toBeGreaterThan(0);
    
    const reactionLines = reactionPools.flatMap(p => p.lines);
    expect(reactionLines.length).toBeGreaterThanOrEqual(8);
  });

  test("should cover idle_chatter context", async () => {
    const idlePools = STAKING_GRANDMA_POOLS.filter(p => p.context === 'idle_chatter');
    expect(idlePools.length).toBeGreaterThan(0);
    
    const idleLines = idlePools.flatMap(p => p.lines);
    expect(idleLines.length).toBeGreaterThanOrEqual(15);
  });

  test("should cover relationship_level context", async () => {
    const relationshipPools = STAKING_GRANDMA_POOLS.filter(p => p.context === 'relationship_level');
    expect(relationshipPools.length).toBeGreaterThan(0);
    
    const relationshipLines = relationshipPools.flatMap(p => p.lines);
    expect(relationshipLines.length).toBeGreaterThanOrEqual(10);
  });

  test("should cover all 5 dialogue contexts", async () => {
    const coveredContexts = new Set(STAKING_GRANDMA_POOLS.map(p => p.context));
    
    for (const context of DIALOGUE_CONTEXTS) {
      expect(coveredContexts.has(context)).toBe(true);
    }
  });
});

/**
 * Test Suite: Market Condition Coverage
 */
test.describe("Market Condition Coverage", () => {
  test("should have bull market dialogue", async () => {
    const bullPools = STAKING_GRANDMA_POOLS.filter(p => p.marketCondition === 'bull');
    expect(bullPools.length).toBeGreaterThan(0);
  });

  test("should have bear market dialogue", async () => {
    const bearPools = STAKING_GRANDMA_POOLS.filter(p => p.marketCondition === 'bear');
    expect(bearPools.length).toBeGreaterThan(0);
  });

  test("should have crab market dialogue", async () => {
    const crabPools = STAKING_GRANDMA_POOLS.filter(p => p.marketCondition === 'crab');
    expect(crabPools.length).toBeGreaterThan(0);
  });

  test("should have volatile market dialogue", async () => {
    const volatilePools = STAKING_GRANDMA_POOLS.filter(p => p.marketCondition === 'volatile');
    expect(volatilePools.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Relationship Level Coverage
 */
test.describe("Relationship Level Coverage", () => {
  test("should have stranger level dialogue", async () => {
    const strangerPools = STAKING_GRANDMA_POOLS.filter(p => p.relationshipLevel === 'stranger');
    expect(strangerPools.length).toBeGreaterThan(0);
  });

  test("should have friend level dialogue", async () => {
    const friendPools = STAKING_GRANDMA_POOLS.filter(p => p.relationshipLevel === 'friend');
    expect(friendPools.length).toBeGreaterThan(0);
  });

  test("should have close_friend level dialogue", async () => {
    const closeFriendPools = STAKING_GRANDMA_POOLS.filter(p => p.relationshipLevel === 'close_friend');
    expect(closeFriendPools.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: WeightedDialogue Properties
 */
test.describe("Weighted Dialogue Properties", () => {
  test("all lines should have valid weight (0-1)", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      expect(line.weight).toBeGreaterThanOrEqual(0);
      expect(line.weight).toBeLessThanOrEqual(1);
    }
  });

  test("all lines should have valid cooldown (positive number)", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      expect(line.cooldown).toBeGreaterThan(0);
      expect(typeof line.cooldown).toBe('number');
    }
  });

  test("all lines should have non-empty text", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      expect(line.text.length).toBeGreaterThan(0);
      expect(line.text.trim()).not.toBe('');
    }
  });

  test("should have varied weight distribution (not all same weight)", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    const uniqueWeights = new Set(allLines.map(line => line.weight));
    
    expect(uniqueWeights.size).toBeGreaterThan(2);
  });
});

/**
 * Test Suite: Staking Grandma Voice Authenticity
 */
test.describe("Staking Grandma Voice", () => {
  test("dialogue should contain Staking Grandma vocabulary", async () => {
    const allText = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    // Check for characteristic Staking Grandma terms
    const stakingGrandmaTerms = [
      'yield', 'stake', 'compound', 'patience', 'dear', 'crash',
      'cycle', 'long-term', 'passive', 'income', 'interest',
      'seen', 'before', 'time', 'slow', 'steady', 'rewards',
      'apr', 'apy', 'validator', 'hodl',
    ];
    
    let foundTerms = 0;
    for (const term of stakingGrandmaTerms) {
      if (allText.includes(term.toLowerCase())) {
        foundTerms++;
      }
    }
    
    // Should contain at least 8 characteristic terms
    expect(foundTerms).toBeGreaterThanOrEqual(8);
  });

  test("dialogue should reflect patient, long-term mentality", async () => {
    const allText = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    // Should mention patience or long-term thinking
    const patienceTerms = ['patience', 'time', 'years', 'long', 'wait', 'steady', 'slow', 'compound', 'eventual'];
    
    let foundPatience = 0;
    for (const term of patienceTerms) {
      if (allText.includes(term)) {
        foundPatience++;
      }
    }
    
    expect(foundPatience).toBeGreaterThanOrEqual(3);
  });

  test("dialogue should have grandmotherly warmth", async () => {
    const allText = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    // Should have warm, grandmotherly language
    const warmTerms = ['dear', 'sweetie', 'honey', 'child', 'young', 'bless', 'remember', 'wisdom', 'cookie'];
    
    let foundWarm = 0;
    for (const term of warmTerms) {
      if (allText.includes(term)) {
        foundWarm++;
      }
    }
    
    expect(foundWarm).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Test Suite: Pool Structure Validation
 */
test.describe("Pool Structure Validation", () => {
  test("all pools should be valid DialoguePool objects", async () => {
    for (const pool of STAKING_GRANDMA_POOLS) {
      // Required fields
      expect(typeof pool.archetype).toBe('string');
      expect(typeof pool.context).toBe('string');
      expect(Array.isArray(pool.lines)).toBe(true);
      
      // Optional fields should be correct type if present
      if (pool.relationshipLevel !== undefined) {
        expect(RELATIONSHIP_LEVELS).toContain(pool.relationshipLevel);
      }
      if (pool.marketCondition !== undefined) {
        expect(MARKET_CONDITIONS).toContain(pool.marketCondition);
      }
    }
  });

  test("requirements in lines should be valid if present", async () => {
    const allLines = STAKING_GRANDMA_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      if (line.requirements) {
        expect(Array.isArray(line.requirements)).toBe(true);
        for (const req of line.requirements) {
          expect(typeof req.type).toBe('string');
          expect(typeof req.value).toBe('string');
        }
      }
    }
  });
});
