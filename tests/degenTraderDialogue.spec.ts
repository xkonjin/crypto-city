import { test, expect } from "@playwright/test";

/**
 * Degen Trader Dialogue Pool Tests (US-004)
 * 
 * TDD Phase 1: Tests for the degen_trader dialogue pool including:
 * - Minimum 50 unique dialogue lines
 * - All 5 dialogue contexts covered
 * - Multiple relationship levels covered
 * - Multiple market conditions covered
 * - Weighted distribution with cooldowns
 * - Distinctly Degen Trader voice
 * 
 * Voice characteristics:
 * - Lives for the thrill of high-risk trades
 * - YOLO mentality, apes into everything
 * - Uses: "aping", "LFG", "to the moon", "rekt", "bags", "100x or nothing"
 * - Talks about leverage, liquidations, memecoins
 * - No regrets, even when losing everything
 * - Sardonic humor about their own gambling addiction
 * - References: PEPE, WIF, "I'm financially ruined", "sir this is a casino"
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
import { DEGEN_TRADER_POOLS } from "@/lib/npc/dialogue/pools/degenTrader";

/**
 * Test Suite: Degen Trader Dialogue Pool Structure
 */
test.describe("Degen Trader Dialogue Pool Structure", () => {
  test("should export DEGEN_TRADER_POOLS as an array of DialoguePool", async () => {
    expect(DEGEN_TRADER_POOLS).toBeDefined();
    expect(Array.isArray(DEGEN_TRADER_POOLS)).toBe(true);
    expect(DEGEN_TRADER_POOLS.length).toBeGreaterThan(0);
  });

  test("all pools should have archetype set to degen_trader", async () => {
    for (const pool of DEGEN_TRADER_POOLS) {
      expect(pool.archetype).toBe('degen_trader');
    }
  });

  test("all pools should have valid context values", async () => {
    for (const pool of DEGEN_TRADER_POOLS) {
      expect(DIALOGUE_CONTEXTS).toContain(pool.context);
    }
  });

  test("all pools should have non-empty lines array", async () => {
    for (const pool of DEGEN_TRADER_POOLS) {
      expect(pool.lines.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Test Suite: Minimum Line Count Requirements
 */
test.describe("Minimum Line Count", () => {
  test("should have at least 50 unique dialogue lines total", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
    const uniqueTexts = new Set(allLines.map(line => line.text));
    
    expect(uniqueTexts.size).toBeGreaterThanOrEqual(50);
  });

  test("should have no duplicate dialogue texts across all pools", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
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
    const greetingPools = DEGEN_TRADER_POOLS.filter(p => p.context === 'greeting');
    expect(greetingPools.length).toBeGreaterThan(0);
    
    const greetingLines = greetingPools.flatMap(p => p.lines);
    expect(greetingLines.length).toBeGreaterThanOrEqual(5);
  });

  test("should cover market_commentary context", async () => {
    const marketPools = DEGEN_TRADER_POOLS.filter(p => p.context === 'market_commentary');
    expect(marketPools.length).toBeGreaterThan(0);
    
    const marketLines = marketPools.flatMap(p => p.lines);
    expect(marketLines.length).toBeGreaterThanOrEqual(10);
  });

  test("should cover player_reaction context", async () => {
    const reactionPools = DEGEN_TRADER_POOLS.filter(p => p.context === 'player_reaction');
    expect(reactionPools.length).toBeGreaterThan(0);
    
    const reactionLines = reactionPools.flatMap(p => p.lines);
    expect(reactionLines.length).toBeGreaterThanOrEqual(8);
  });

  test("should cover idle_chatter context", async () => {
    const idlePools = DEGEN_TRADER_POOLS.filter(p => p.context === 'idle_chatter');
    expect(idlePools.length).toBeGreaterThan(0);
    
    const idleLines = idlePools.flatMap(p => p.lines);
    expect(idleLines.length).toBeGreaterThanOrEqual(15);
  });

  test("should cover relationship_level context", async () => {
    const relationshipPools = DEGEN_TRADER_POOLS.filter(p => p.context === 'relationship_level');
    expect(relationshipPools.length).toBeGreaterThan(0);
    
    const relationshipLines = relationshipPools.flatMap(p => p.lines);
    expect(relationshipLines.length).toBeGreaterThanOrEqual(10);
  });

  test("should cover all 5 dialogue contexts", async () => {
    const coveredContexts = new Set(DEGEN_TRADER_POOLS.map(p => p.context));
    
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
    const bullPools = DEGEN_TRADER_POOLS.filter(p => p.marketCondition === 'bull');
    expect(bullPools.length).toBeGreaterThan(0);
  });

  test("should have bear market dialogue", async () => {
    const bearPools = DEGEN_TRADER_POOLS.filter(p => p.marketCondition === 'bear');
    expect(bearPools.length).toBeGreaterThan(0);
  });

  test("should have crab market dialogue", async () => {
    const crabPools = DEGEN_TRADER_POOLS.filter(p => p.marketCondition === 'crab');
    expect(crabPools.length).toBeGreaterThan(0);
  });

  test("should have volatile market dialogue", async () => {
    const volatilePools = DEGEN_TRADER_POOLS.filter(p => p.marketCondition === 'volatile');
    expect(volatilePools.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Relationship Level Coverage
 */
test.describe("Relationship Level Coverage", () => {
  test("should have stranger level dialogue", async () => {
    const strangerPools = DEGEN_TRADER_POOLS.filter(p => p.relationshipLevel === 'stranger');
    expect(strangerPools.length).toBeGreaterThan(0);
  });

  test("should have friend level dialogue", async () => {
    const friendPools = DEGEN_TRADER_POOLS.filter(p => p.relationshipLevel === 'friend');
    expect(friendPools.length).toBeGreaterThan(0);
  });

  test("should have close_friend level dialogue", async () => {
    const closeFriendPools = DEGEN_TRADER_POOLS.filter(p => p.relationshipLevel === 'close_friend');
    expect(closeFriendPools.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: WeightedDialogue Properties
 */
test.describe("Weighted Dialogue Properties", () => {
  test("all lines should have valid weight (0-1)", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      expect(line.weight).toBeGreaterThanOrEqual(0);
      expect(line.weight).toBeLessThanOrEqual(1);
    }
  });

  test("all lines should have valid cooldown (positive number)", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      expect(line.cooldown).toBeGreaterThan(0);
      expect(typeof line.cooldown).toBe('number');
    }
  });

  test("all lines should have non-empty text", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
    
    for (const line of allLines) {
      expect(line.text.length).toBeGreaterThan(0);
      expect(line.text.trim()).not.toBe('');
    }
  });

  test("should have varied weight distribution (not all same weight)", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
    const uniqueWeights = new Set(allLines.map(line => line.weight));
    
    expect(uniqueWeights.size).toBeGreaterThan(2);
  });
});

/**
 * Test Suite: Degen Trader Voice Authenticity
 */
test.describe("Degen Trader Voice", () => {
  test("dialogue should contain Degen Trader vocabulary", async () => {
    const allText = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    // Check for characteristic Degen Trader terms
    const degenTerms = [
      'ape', 'lfg', 'moon', 'rekt', 'bags', '100x', 'yolo',
      'leverage', 'liquidat', 'memecoin', 'degen', 'pump', 'dump',
      'casino', 'gambl', 'bet', 'ruined', 'ngmi', 'wagmi', 'send it',
      'pepe', 'wif', 'shib', 'doge', 'diamond hands', 'paper hands',
      'fomo', 'rug', 'floor', 'ser', 'based', 'cope', 'hopium',
    ];
    
    let foundTerms = 0;
    for (const term of degenTerms) {
      if (allText.includes(term.toLowerCase())) {
        foundTerms++;
      }
    }
    
    // Should contain at least 8 characteristic terms
    expect(foundTerms).toBeGreaterThanOrEqual(8);
  });

  test("dialogue should reference high-risk trading behavior", async () => {
    const allText = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    // Degen traders talk about leverage, liquidations, risky bets
    const riskTerms = [
      'leverage', 'liquidat', '100x', '50x', '10x', 'margin', 'long', 'short',
      'all in', 'yolo', 'bet', 'gambl', 'risk', 'casino', 'ape',
    ];
    
    let foundRiskTerms = 0;
    for (const term of riskTerms) {
      if (allText.includes(term)) {
        foundRiskTerms++;
      }
    }
    
    expect(foundRiskTerms).toBeGreaterThanOrEqual(3);
  });

  test("dialogue should contain memecoin references", async () => {
    const allText = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    const memecoinTerms = [
      'pepe', 'wif', 'shib', 'doge', 'bonk', 'floki', 'memecoin',
      'dog coin', 'shitcoin', 'animal', 'pump', 'gem',
    ];
    
    let foundMemecoinTerms = 0;
    for (const term of memecoinTerms) {
      if (allText.includes(term)) {
        foundMemecoinTerms++;
      }
    }
    
    expect(foundMemecoinTerms).toBeGreaterThanOrEqual(2);
  });

  test("dialogue should reflect sardonic humor about losses", async () => {
    const allText = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines.map(l => l.text)).join(' ').toLowerCase();
    
    // Degens joke about their own losses
    const lossHumorTerms = [
      'rekt', 'ruined', 'loss', 'down', 'liquidat', 'this is fine',
      'broke', 'poor', 'dump', 'red', 'bag', 'hold', 'cope',
    ];
    
    let foundLossTerms = 0;
    for (const term of lossHumorTerms) {
      if (allText.includes(term)) {
        foundLossTerms++;
      }
    }
    
    expect(foundLossTerms).toBeGreaterThanOrEqual(3);
  });

  test("dialogue should be energetic (contains exclamation marks)", async () => {
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines.map(l => l.text));
    
    const linesWithExclamation = allLines.filter(text => text.includes('!'));
    
    // At least 30% of lines should have exclamation marks for energetic voice
    expect(linesWithExclamation.length / allLines.length).toBeGreaterThanOrEqual(0.3);
  });
});

/**
 * Test Suite: Pool Structure Validation
 */
test.describe("Pool Structure Validation", () => {
  test("all pools should be valid DialoguePool objects", async () => {
    for (const pool of DEGEN_TRADER_POOLS) {
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
    const allLines = DEGEN_TRADER_POOLS.flatMap(pool => pool.lines);
    
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
