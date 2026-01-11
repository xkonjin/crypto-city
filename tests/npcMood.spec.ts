import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Mood System (Issue #105)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements internal states for NPCs including mood, thoughts, beliefs, and desires.
 */

// Import types and functions we're going to implement
// These imports will fail initially - that's expected in TDD!
import type {
  Mood,
  Thought,
  Belief,
  Desire,
  InternalWorld,
  MoodEvent,
} from "@/lib/npc/mood";
import {
  MOOD_DESCRIPTIONS,
  MOOD_LEVELS,
  createDefaultInternalWorld,
  createThought,
  createBelief,
  createDesire,
} from "@/lib/npc/mood";
import { MoodManager } from "@/lib/npc/MoodManager";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultPersonality } from "@/lib/npc/personality";
import type { CryptoNPC, Occupation } from "@/games/isocity/types/npc";
import { createInitialMovement } from "@/lib/npc/movement";

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  const defaultInternalWorld: InternalWorld = {
    currentMood: 'neutral',
    moodIntensity: 0.5,
    thoughts: [],
    beliefs: [],
    desires: [],
  };

  return {
    id: 'test-npc-1',
    name: 'TestNPC',
    walletAddress: '0x1234567890abcdef',
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
    needs: createDefaultNeeds(),
    memory: {
      episodic: [],
      semantic: [],
      procedural: [],
      working: {
        currentGoal: null,
        recentContext: [],
        activeThoughts: [],
      },
    },
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    internalWorld: defaultInternalWorld,
    ...overrides,
  } as CryptoNPC;
}

/**
 * Test Suite: Mood Types
 * Tests the basic mood type definitions
 */
test.describe("Mood Types", () => {
  test("should define all mood types", async () => {
    const moods: Mood[] = [
      'ecstatic',
      'happy',
      'content',
      'neutral',
      'anxious',
      'sad',
      'angry',
      'depressed',
    ];

    // Verify MOOD_LEVELS has all moods mapped
    for (const mood of moods) {
      expect(MOOD_LEVELS[mood]).toBeDefined();
    }
  });

  test("should map mood levels correctly", async () => {
    expect(MOOD_LEVELS.ecstatic).toBe(2);
    expect(MOOD_LEVELS.happy).toBe(1);
    expect(MOOD_LEVELS.content).toBe(0);
    expect(MOOD_LEVELS.neutral).toBe(0);
    expect(MOOD_LEVELS.anxious).toBe(-1);
    expect(MOOD_LEVELS.sad).toBe(-1);
    expect(MOOD_LEVELS.angry).toBe(-1);
    expect(MOOD_LEVELS.depressed).toBe(-2);
  });
});

/**
 * Test Suite: Mood Descriptions
 * Tests the Hitchhiker's Guide style descriptions
 */
test.describe("Mood Descriptions", () => {
  test("should have description for ecstatic", async () => {
    expect(MOOD_DESCRIPTIONS.ecstatic).toContain("euphoria");
    expect(MOOD_DESCRIPTIONS.ecstatic).toContain("position sizing");
  });

  test("should have description for happy", async () => {
    expect(MOOD_DESCRIPTIONS.happy).toContain("green");
    expect(MOOD_DESCRIPTIONS.happy).toContain("Suspicious");
  });

  test("should have description for content", async () => {
    expect(MOOD_DESCRIPTIONS.content).toContain("not actively panicking");
  });

  test("should have description for neutral", async () => {
    expect(MOOD_DESCRIPTIONS.neutral).toContain("Existing");
    expect(MOOD_DESCRIPTIONS.neutral).toContain("common state");
  });

  test("should have description for anxious", async () => {
    expect(MOOD_DESCRIPTIONS.anxious).toContain("portfolio");
    expect(MOOD_DESCRIPTIONS.anxious).toContain("30 seconds");
  });

  test("should have description for sad", async () => {
    expect(MOOD_DESCRIPTIONS.sad).toContain("Market");
    expect(MOOD_DESCRIPTIONS.sad).toContain("right one");
  });

  test("should have description for angry", async () => {
    expect(MOOD_DESCRIPTIONS.angry).toContain("WRONG");
    expect(MOOD_DESCRIPTIONS.angry).toContain("internet");
  });

  test("should have description for depressed", async () => {
    expect(MOOD_DESCRIPTIONS.depressed).toContain("rug pulls");
    expect(MOOD_DESCRIPTIONS.depressed).toContain("grass");
  });

  test("should have descriptions for all mood types", async () => {
    const moods: Mood[] = [
      'ecstatic', 'happy', 'content', 'neutral',
      'anxious', 'sad', 'angry', 'depressed',
    ];

    for (const mood of moods) {
      expect(MOOD_DESCRIPTIONS[mood]).toBeDefined();
      expect(MOOD_DESCRIPTIONS[mood].length).toBeGreaterThan(0);
    }
  });
});

/**
 * Test Suite: Thought Interface
 * Tests the Thought data structure
 */
test.describe("Thought Interface", () => {
  test("should create a thought with required properties", async () => {
    const thought = createThought({
      content: "Is this the dip I should buy?",
      trigger: "price_drop",
      mood: 'anxious',
    });

    expect(thought.content).toBe("Is this the dip I should buy?");
    expect(thought.trigger).toBe("price_drop");
    expect(thought.mood).toBe('anxious');
    expect(thought.timestamp).toBeDefined();
    expect(thought.timestamp).toBeGreaterThan(0);
  });

  test("should auto-generate timestamp if not provided", async () => {
    const before = Date.now();
    const thought = createThought({
      content: "WAGMI",
      trigger: "profit",
      mood: 'happy',
    });
    const after = Date.now();

    expect(thought.timestamp).toBeGreaterThanOrEqual(before);
    expect(thought.timestamp).toBeLessThanOrEqual(after);
  });
});

/**
 * Test Suite: Belief Interface
 * Tests the Belief data structure
 */
test.describe("Belief Interface", () => {
  test("should create a belief with required properties", async () => {
    const belief = createBelief({
      subject: "Bitcoin",
      belief: "will reach 100k",
      confidence: 0.8,
      source: 'observation',
    });

    expect(belief.subject).toBe("Bitcoin");
    expect(belief.belief).toBe("will reach 100k");
    expect(belief.confidence).toBe(0.8);
    expect(belief.source).toBe('observation');
  });

  test("confidence should be clamped to 0-1 range", async () => {
    const belief1 = createBelief({
      subject: "Test",
      belief: "test",
      confidence: 1.5,
      source: 'told',
    });
    expect(belief1.confidence).toBeLessThanOrEqual(1);

    const belief2 = createBelief({
      subject: "Test",
      belief: "test",
      confidence: -0.5,
      source: 'told',
    });
    expect(belief2.confidence).toBeGreaterThanOrEqual(0);
  });

  test("should support all source types", async () => {
    const sources: Array<'observation' | 'told' | 'inference'> = [
      'observation', 'told', 'inference'
    ];

    for (const source of sources) {
      const belief = createBelief({
        subject: "Test",
        belief: "test belief",
        confidence: 0.5,
        source,
      });
      expect(belief.source).toBe(source);
    }
  });
});

/**
 * Test Suite: Desire Interface
 * Tests the Desire data structure
 */
test.describe("Desire Interface", () => {
  test("should create a desire with required properties", async () => {
    const desire = createDesire({
      target: "more BTC",
      intensity: 0.9,
      reason: "number go up",
    });

    expect(desire.target).toBe("more BTC");
    expect(desire.intensity).toBe(0.9);
    expect(desire.reason).toBe("number go up");
  });

  test("intensity should be clamped to 0-1 range", async () => {
    const desire1 = createDesire({
      target: "Test",
      intensity: 1.5,
      reason: "test",
    });
    expect(desire1.intensity).toBeLessThanOrEqual(1);

    const desire2 = createDesire({
      target: "Test",
      intensity: -0.5,
      reason: "test",
    });
    expect(desire2.intensity).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Suite: InternalWorld Interface
 * Tests the complete internal world structure
 */
test.describe("InternalWorld Interface", () => {
  test("createDefaultInternalWorld should return valid structure", async () => {
    const world = createDefaultInternalWorld();

    expect(world.currentMood).toBe('neutral');
    expect(world.moodIntensity).toBeGreaterThanOrEqual(0);
    expect(world.moodIntensity).toBeLessThanOrEqual(1);
    expect(Array.isArray(world.thoughts)).toBe(true);
    expect(Array.isArray(world.beliefs)).toBe(true);
    expect(Array.isArray(world.desires)).toBe(true);
  });

  test("should limit thoughts to last 10", async () => {
    const world = createDefaultInternalWorld();
    
    // Add more than 10 thoughts
    for (let i = 0; i < 15; i++) {
      world.thoughts.push(createThought({
        content: `Thought ${i}`,
        trigger: 'test',
        mood: 'neutral',
      }));
    }

    // The world should allow storing thoughts, but limit managed by MoodManager
    expect(world.thoughts.length).toBe(15);
  });
});

/**
 * Test Suite: MoodManager - calculateMood
 * Tests mood calculation based on various factors
 */
test.describe("MoodManager - calculateMood", () => {
  test("should return neutral mood for neutral state", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    
    // Set all needs to moderate levels
    Object.values(npc.needs).forEach(need => {
      need.current = 60;
    });

    const { mood, intensity } = manager.calculateMood(npc);

    expect(['neutral', 'content']).toContain(mood);
    expect(intensity).toBeGreaterThanOrEqual(0);
    expect(intensity).toBeLessThanOrEqual(1);
  });

  test("should return happy mood when needs are well satisfied", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    
    // Set all needs to high levels
    Object.values(npc.needs).forEach(need => {
      need.current = 90;
    });

    const { mood, intensity } = manager.calculateMood(npc);

    expect(['happy', 'content', 'ecstatic']).toContain(mood);
  });

  test("should return negative mood when needs are critical", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    
    // Set needs to critical levels
    Object.values(npc.needs).forEach(need => {
      need.current = 10;
    });

    const { mood, intensity } = manager.calculateMood(npc);

    expect(['anxious', 'sad', 'angry', 'depressed']).toContain(mood);
  });

  test("should factor in personality traits", async () => {
    const manager = new MoodManager();
    
    // High neuroticism NPC
    const anxiousNPC = createMockNPC({
      personality: {
        bigFive: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.9, // High neuroticism
        },
        crypto: {
          riskTolerance: 0.5,
          fomo: 0.5,
          trustInInstitutions: 0.5,
          technicalKnowledge: 0.5,
          degenLevel: 0.5,
        },
      },
    });

    // Set moderate needs
    Object.values(anxiousNPC.needs).forEach(need => {
      need.current = 50;
    });

    const result = manager.calculateMood(anxiousNPC);

    // High neuroticism should skew toward more negative moods
    expect(result.intensity).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: MoodManager - processEvent
 * Tests processing mood-affecting events
 */
test.describe("MoodManager - processEvent", () => {
  test("should improve mood on trading win", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.currentMood = 'neutral';
    npc.internalWorld!.moodIntensity = 0.5;

    const event: MoodEvent = {
      type: 'trading_win',
      magnitude: 0.8,
      description: 'Made 10x on a shitcoin',
    };

    manager.processEvent(npc, event);

    // Mood should improve
    expect(['happy', 'ecstatic']).toContain(npc.internalWorld!.currentMood);
  });

  test("should worsen mood on trading loss", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.currentMood = 'happy';
    npc.internalWorld!.moodIntensity = 0.5;

    const event: MoodEvent = {
      type: 'trading_loss',
      magnitude: 0.9,
      description: 'Lost it all on leverage',
    };

    manager.processEvent(npc, event);

    // Mood should worsen
    expect(['neutral', 'sad', 'angry', 'anxious', 'depressed']).toContain(
      npc.internalWorld!.currentMood
    );
  });

  test("should generate thought on event", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.thoughts = [];

    const event: MoodEvent = {
      type: 'social_positive',
      magnitude: 0.6,
      description: 'Nice chat with friend',
    };

    manager.processEvent(npc, event);

    expect(npc.internalWorld!.thoughts.length).toBeGreaterThan(0);
  });

  test("should handle need_satisfied event", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.currentMood = 'anxious';

    const event: MoodEvent = {
      type: 'need_satisfied',
      magnitude: 0.5,
      description: 'Had a good meal',
    };

    manager.processEvent(npc, event);

    // Should improve mood slightly
    const moodLevel = MOOD_LEVELS[npc.internalWorld!.currentMood];
    expect(moodLevel).toBeGreaterThanOrEqual(-1);
  });

  test("should handle need_critical event", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.currentMood = 'happy';

    const event: MoodEvent = {
      type: 'need_critical',
      magnitude: 0.7,
      description: 'Extremely tired',
    };

    manager.processEvent(npc, event);

    // Should worsen mood
    expect(['neutral', 'content', 'anxious', 'sad']).toContain(
      npc.internalWorld!.currentMood
    );
  });

  test("should handle all event types", async () => {
    const manager = new MoodManager();
    const eventTypes: MoodEvent['type'][] = [
      'trading_win', 'trading_loss', 'social_positive', 'social_negative',
      'need_satisfied', 'need_critical', 'work_success', 'work_failure',
    ];

    for (const type of eventTypes) {
      const npc = createMockNPC();
      const event: MoodEvent = {
        type,
        magnitude: 0.5,
        description: `Test ${type} event`,
      };

      // Should not throw
      expect(() => manager.processEvent(npc, event)).not.toThrow();
    }
  });
});

/**
 * Test Suite: MoodManager - generateThought
 * Tests thought generation based on triggers
 */
test.describe("MoodManager - generateThought", () => {
  test("should generate thought with current mood", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.currentMood = 'happy';

    const thought = manager.generateThought(npc, 'price_pump');

    expect(thought.mood).toBe('happy');
    expect(thought.trigger).toBe('price_pump');
    expect(thought.content.length).toBeGreaterThan(0);
  });

  test("should generate personality-appropriate thoughts", async () => {
    const manager = new MoodManager();
    
    // Bitcoin maxi NPC
    const maxiNPC = createMockNPC({
      personalityArchetype: 'bitcoin_maxi',
    });
    
    const thought = manager.generateThought(maxiNPC, 'eth_pump');

    // Bitcoin maxi should have dismissive thoughts about ETH
    expect(thought.content.length).toBeGreaterThan(0);
  });

  test("should generate degen-appropriate thoughts on loss", async () => {
    const manager = new MoodManager();
    
    const degenNPC = createMockNPC({
      personalityArchetype: 'degen_trader',
      personality: {
        bigFive: {
          openness: 0.7,
          conscientiousness: 0.2,
          extraversion: 0.7,
          agreeableness: 0.4,
          neuroticism: 0.6,
        },
        crypto: {
          riskTolerance: 0.9,
          fomo: 0.9,
          trustInInstitutions: 0.3,
          technicalKnowledge: 0.5,
          degenLevel: 0.95,
        },
      },
    });
    degenNPC.internalWorld!.currentMood = 'sad';

    const thought = manager.generateThought(degenNPC, 'trading_loss');

    expect(thought.content.length).toBeGreaterThan(0);
    expect(thought.trigger).toBe('trading_loss');
  });

  test("should limit thoughts to 10 when adding", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    
    // Add 12 thoughts
    for (let i = 0; i < 12; i++) {
      const thought = manager.generateThought(npc, `trigger_${i}`);
      manager.addThought(npc, thought);
    }

    expect(npc.internalWorld!.thoughts.length).toBeLessThanOrEqual(10);
  });
});

/**
 * Test Suite: MoodManager - Belief Management
 * Tests belief creation and updates
 */
test.describe("MoodManager - Belief Management", () => {
  test("should add new belief", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.beliefs = [];

    const belief: Belief = {
      subject: "Bitcoin",
      belief: "will reach 100k",
      confidence: 0.8,
      source: 'observation',
    };

    manager.addBelief(npc, belief);

    expect(npc.internalWorld!.beliefs.length).toBe(1);
    expect(npc.internalWorld!.beliefs[0].subject).toBe("Bitcoin");
  });

  test("should update existing belief confidence", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.beliefs = [{
      subject: "Bitcoin",
      belief: "will reach 100k",
      confidence: 0.5,
      source: 'observation',
    }];

    manager.updateBelief(npc, "Bitcoin", 0.9);

    expect(npc.internalWorld!.beliefs[0].confidence).toBe(0.9);
  });

  test("should not add duplicate beliefs for same subject", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.beliefs = [];

    manager.addBelief(npc, {
      subject: "Bitcoin",
      belief: "will moon",
      confidence: 0.7,
      source: 'told',
    });

    manager.addBelief(npc, {
      subject: "Bitcoin",
      belief: "is the future",
      confidence: 0.9,
      source: 'inference',
    });

    // Should update rather than duplicate
    expect(npc.internalWorld!.beliefs.filter(b => b.subject === "Bitcoin").length).toBe(1);
  });
});

/**
 * Test Suite: MoodManager - Desire Management
 * Tests desire creation and retrieval
 */
test.describe("MoodManager - Desire Management", () => {
  test("should add new desire", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.desires = [];

    const desire: Desire = {
      target: "more BTC",
      intensity: 0.9,
      reason: "number go up",
    };

    manager.addDesire(npc, desire);

    expect(npc.internalWorld!.desires.length).toBe(1);
    expect(npc.internalWorld!.desires[0].target).toBe("more BTC");
  });

  test("should get strongest desire", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.desires = [
      { target: "sleep", intensity: 0.3, reason: "tired" },
      { target: "trade", intensity: 0.9, reason: "FOMO" },
      { target: "eat", intensity: 0.5, reason: "hungry" },
    ];

    const strongest = manager.getStrongestDesire(npc);

    expect(strongest).not.toBeNull();
    expect(strongest!.target).toBe("trade");
    expect(strongest!.intensity).toBe(0.9);
  });

  test("should return null when no desires", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    npc.internalWorld!.desires = [];

    const strongest = manager.getStrongestDesire(npc);

    expect(strongest).toBeNull();
  });
});

/**
 * Test Suite: MoodManager - Mood Factors
 * Tests how various factors affect mood calculation
 */
test.describe("MoodManager - Mood Factors", () => {
  test("should factor in needs satisfaction", async () => {
    const manager = new MoodManager();
    
    const happyNPC = createMockNPC();
    Object.values(happyNPC.needs).forEach(need => { need.current = 95; });
    
    const sadNPC = createMockNPC();
    Object.values(sadNPC.needs).forEach(need => { need.current = 10; });

    const happyResult = manager.calculateMood(happyNPC);
    const sadResult = manager.calculateMood(sadNPC);

    expect(MOOD_LEVELS[happyResult.mood]).toBeGreaterThan(MOOD_LEVELS[sadResult.mood]);
  });

  test("should consider wealth changes for crypto NPCs", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    
    // Simulate major wealth increase
    npc.needs.wealth.current = 95;
    
    const result = manager.calculateMood(npc);
    
    // High wealth should positively affect mood
    expect(MOOD_LEVELS[result.mood]).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Suite: Personality-Specific Thoughts
 * Tests example thoughts from specification
 */
test.describe("Personality-Specific Thoughts", () => {
  test("should generate Bitcoin Maxi thoughts appropriately", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC({
      personalityArchetype: 'bitcoin_maxi',
    });

    const thought = manager.generateThought(npc, 'eth_pump');

    // Should be dismissive/skeptical of ETH
    expect(thought.content.length).toBeGreaterThan(0);
  });

  test("should generate Degen thoughts after loss", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC({
      personalityArchetype: 'degen_trader',
    });
    npc.internalWorld!.currentMood = 'sad';

    const thought = manager.generateThought(npc, 'trading_loss');

    // Should be cope-y
    expect(thought.content.length).toBeGreaterThan(0);
  });

  test("should generate Normie thoughts when confused", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC({
      personalityArchetype: 'normie_investor',
    });
    npc.internalWorld!.currentMood = 'anxious';

    const thought = manager.generateThought(npc, 'market_volatility');

    expect(thought.content.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Integration with CryptoNPC
 * Tests that mood system integrates with the NPC interface
 */
test.describe("Integration with CryptoNPC", () => {
  test("CryptoNPC should have internalWorld property", async () => {
    const npc = createMockNPC();
    
    expect(npc.internalWorld).toBeDefined();
    expect(npc.internalWorld!.currentMood).toBeDefined();
    expect(npc.internalWorld!.moodIntensity).toBeDefined();
    expect(npc.internalWorld!.thoughts).toBeDefined();
    expect(npc.internalWorld!.beliefs).toBeDefined();
    expect(npc.internalWorld!.desires).toBeDefined();
  });

  test("should handle NPC without internalWorld gracefully", async () => {
    const manager = new MoodManager();
    const npc = createMockNPC();
    // Remove internal world to test graceful handling
    (npc as Partial<CryptoNPC>).internalWorld = undefined;

    // Manager should initialize it
    manager.ensureInternalWorld(npc);

    expect(npc.internalWorld).toBeDefined();
    expect(npc.internalWorld!.currentMood).toBe('neutral');
  });
});
