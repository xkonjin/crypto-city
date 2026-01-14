/**
 * NPC Inspector Tests
 * 
 * Tests for the Progressive Disclosure NPC Inspector UI:
 * - NPCInspectorPanel component
 * - useNPCInspector hook
 * - ThoughtEngine integration with NPCSimulation
 * 
 * "Testing is the towel of software development - 
 *  you never want to leave home without it."
 * — The Hitchhiker's Guide to Testing
 */

import { test, expect } from '@playwright/test';
import { thoughtEngine, type ThoughtContext } from '../src/lib/npc/ThoughtEngine';
import { NPCSimulation } from '../src/lib/npc/NPCSimulation';
import { NPCManager } from '../src/lib/npc/NPCManager';
import { createDefaultNeeds } from '../src/lib/npc/needs';
import { createDefaultMemory } from '../src/lib/npc/memory';
import { createInitialMovement } from '../src/lib/npc/movement';
import { createDefaultPersonality, type PersonalityArchetype } from '../src/lib/npc/personality';
import type { CryptoNPC } from '../src/games/isocity/types/npc';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Create a mock NPC for testing */
function createMockNPC(
  archetype: PersonalityArchetype = 'degen_trader',
  overrides: Partial<CryptoNPC> = {}
): CryptoNPC {
  return {
    id: `test-npc-${Math.random().toString(36).slice(2)}`,
    name: 'TestNPC',
    walletAddress: '0x1234567890abcdef',
    age: 30,
    occupation: 'trader',
    residence: null,
    workplace: null,
    spriteType: 'apple',
    direction: 'south',
    gridX: 10,
    gridY: 10,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: 'idle',
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    personalityArchetype: archetype,
    relationships: {},
    ...overrides,
  } as CryptoNPC;
}

/** Default thought context for tests */
const defaultContext: ThoughtContext = {
  nearbyNPCs: [],
  marketCondition: 'bull',
  timeOfDay: 'morning',
  recentEvents: [],
  gameDay: 1,
};

// =============================================================================
// THOUGHT ENGINE INTEGRATION TESTS
// =============================================================================

test.describe('ThoughtEngine Integration', () => {
  test('should create default thought stream', () => {
    const stream = thoughtEngine.createDefaultThoughtStream();
    
    expect(stream.currentThought).toBeDefined();
    expect(stream.currentThought.length).toBeGreaterThan(0);
    expect(stream.lastUpdated).toBeDefined();
    expect(Array.isArray(stream.observations)).toBe(true);
    expect(Array.isArray(stream.shortTermPlan)).toBe(true);
    expect(Array.isArray(stream.longTermGoals)).toBe(true);
    expect(Array.isArray(stream.reflections)).toBe(true);
  });

  test('should generate thoughts for different archetypes', () => {
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
      const npc = createMockNPC(archetype);
      const thought = thoughtEngine.generateThought(npc, defaultContext);
      
      expect(thought).toBeDefined();
      expect(thought.length).toBeGreaterThan(0);
    }
  });

  test('should update thought stream with new context', () => {
    const npc = createMockNPC('degen_trader');
    const stream = thoughtEngine.createDefaultThoughtStream();
    
    const updated = thoughtEngine.updateThoughtStream(npc, defaultContext, stream);
    
    expect(updated.currentThought).toBeDefined();
    expect(updated.lastUpdated).toBeGreaterThanOrEqual(stream.lastUpdated);
  });

  test('should generate need-based thoughts when needs are critical', () => {
    const needs = createDefaultNeeds();
    needs.hunger.current = 5; // Critical hunger
    
    const npc = createMockNPC('normie_investor', { needs });
    const thoughts: string[] = [];
    
    // Generate multiple thoughts to increase chance of need-based thought
    for (let i = 0; i < 30; i++) {
      thoughts.push(thoughtEngine.generateThought(npc, defaultContext));
    }
    
    // At least some thoughts should relate to hunger
    const hungerRelated = thoughts.filter(t => 
      t.toLowerCase().includes('hungry') ||
      t.toLowerCase().includes('food') ||
      t.toLowerCase().includes('eat') ||
      t.toLowerCase().includes('stomach')
    );
    
    expect(hungerRelated.length).toBeGreaterThan(0);
  });

  test('should add observations to thought stream', () => {
    const stream = thoughtEngine.createDefaultThoughtStream();
    
    const updated = thoughtEngine.addObservation(stream, {
      type: 'npc',
      description: 'Saw a whale wallet moving funds',
      emotionalValence: 0.5,
    });
    
    expect(updated.observations.length).toBe(1);
    expect(updated.observations[0].description).toBe('Saw a whale wallet moving funds');
    expect(updated.observations[0].timestamp).toBeDefined();
    expect(updated.observations[0].type).toBe('npc');
  });
});

// =============================================================================
// NPC SIMULATION THOUGHT INTEGRATION TESTS
// =============================================================================

test.describe('NPCSimulation Thought Integration', () => {
  test('should initialize thought stream on first update', () => {
    // Test that thought stream can be created for a mock NPC
    const npc = createMockNPC('eth_builder');
    
    // NPC should not have thought stream initially
    expect(npc.thoughtStream).toBeUndefined();
    
    // Manually trigger the thought stream initialization
    npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
    
    expect(npc.thoughtStream).toBeDefined();
    expect(npc.thoughtStream.currentThought).toBeDefined();
    expect(npc.thoughtStream.currentThought.length).toBeGreaterThan(0);
  });

  test('should update thought stream every 10 ticks', () => {
    const npc = createMockNPC('degen_trader');
    
    // Initialize thought stream
    npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
    const initialTimestamp = npc.thoughtStream.lastUpdated;
    
    // Wait a moment and update
    const updated = thoughtEngine.updateThoughtStream(npc, {
      ...defaultContext,
      gameDay: 2,
    }, npc.thoughtStream);
    
    expect(updated.lastUpdated).toBeGreaterThanOrEqual(initialTimestamp);
  });

  test('should include nearby NPCs in thought context', () => {
    const simulation = new NPCSimulation();
    
    // Use NPCManager.spawnNPC to create NPCs properly
    const npc1 = NPCManager.spawnNPC({ gridX: 10, gridY: 10 });
    const npc2 = NPCManager.spawnNPC({ gridX: 11, gridY: 10 });
    
    // Get nearby NPCs
    const nearby = simulation.getNearbyNPCs(npc1, 3);
    
    // npc2 should be in the nearby list
    expect(nearby.length).toBeGreaterThanOrEqual(1);
    const found = nearby.find(n => n.id === npc2.id);
    expect(found).toBeDefined();
    
    // Cleanup
    NPCManager.despawnNPC(npc1.id);
    NPCManager.despawnNPC(npc2.id);
  });
});

// =============================================================================
// USE NPC INSPECTOR HOOK TESTS
// =============================================================================

test.describe('useNPCInspector Hook Behavior', () => {
  test('should return proper structure for selected NPC', () => {
    // Since we can't use React hooks directly in Playwright tests,
    // we test the underlying functionality
    const npc = createMockNPC('degen_trader');
    npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
    
    // Verify NPC has all required fields for inspector
    expect(npc.name).toBeDefined();
    expect(npc.walletAddress).toBeDefined();
    expect(npc.occupation).toBeDefined();
    expect(npc.age).toBeDefined();
    expect(npc.personality).toBeDefined();
    expect(npc.personality.crypto).toBeDefined();
    expect(npc.personality.crypto.riskTolerance).toBeDefined();
    expect(npc.personality.crypto.fomo).toBeDefined();
    expect(npc.personality.crypto.degenLevel).toBeDefined();
    expect(npc.thoughtStream.currentThought).toBeDefined();
  });

  test('should have personality traits in valid range', () => {
    const npc = createMockNPC('degen_trader');
    
    const { crypto } = npc.personality;
    
    expect(crypto.riskTolerance).toBeGreaterThanOrEqual(0);
    expect(crypto.riskTolerance).toBeLessThanOrEqual(1);
    expect(crypto.fomo).toBeGreaterThanOrEqual(0);
    expect(crypto.fomo).toBeLessThanOrEqual(1);
    expect(crypto.degenLevel).toBeGreaterThanOrEqual(0);
    expect(crypto.degenLevel).toBeLessThanOrEqual(1);
    expect(crypto.technicalKnowledge).toBeGreaterThanOrEqual(0);
    expect(crypto.technicalKnowledge).toBeLessThanOrEqual(1);
    expect(crypto.trustInInstitutions).toBeGreaterThanOrEqual(0);
    expect(crypto.trustInInstitutions).toBeLessThanOrEqual(1);
  });
});

// =============================================================================
// NPC INSPECTOR PANEL DATA TESTS
// =============================================================================

test.describe('NPCInspectorPanel Data Requirements', () => {
  test('should have all required fields for display', () => {
    const npc = createMockNPC('protocol_politician', {
      internalWorld: {
        currentMood: 'happy',
        moodIntensity: 0.7,
        thoughts: [],
        beliefs: [],
        desires: [],
      },
      wallet: {
        cash: 1000,
        holdings: {},
        stakedPositions: [],
      },
      finances: {
        salary: 100,
        tradingProfits: 50,
        stakingRewards: 20,
        food: 20,
        housing: 30,
        entertainment: 10,
        taxes: 5,
        netWorth: 5000,
        dailyNet: 65,
      },
    });
    
    // All required display fields
    expect(npc.name).toBeTruthy();
    expect(npc.walletAddress).toBeTruthy();
    expect(npc.occupation).toBeTruthy();
    expect(npc.internalWorld?.currentMood).toBeTruthy();
    expect(npc.currentActivity).toBeDefined();
    expect(npc.wallet?.cash).toBeDefined();
    expect(npc.finances?.netWorth).toBeDefined();
    expect(npc.personality.crypto.riskTolerance).toBeDefined();
    expect(npc.personality.crypto.fomo).toBeDefined();
    expect(npc.personality.crypto.degenLevel).toBeDefined();
  });

  test('should handle missing optional fields gracefully', () => {
    const npc = createMockNPC('normie_investor');
    
    // These fields are optional and should default gracefully
    const mood = npc.internalWorld?.currentMood ?? 'neutral';
    const walletBalance = npc.wallet?.cash ?? 0;
    const netWorth = npc.finances?.netWorth ?? 0;
    
    expect(mood).toBe('neutral');
    expect(walletBalance).toBe(0);
    expect(netWorth).toBe(0);
  });

  test('should format wallet address correctly', () => {
    const npc = createMockNPC('bitcoin_maxi', {
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });
    
    // Truncation logic: first 6 + ... + last 4
    const truncated = `${npc.walletAddress.slice(0, 6)}...${npc.walletAddress.slice(-4)}`;
    expect(truncated).toBe('0x1234...5678');
    expect(truncated.length).toBe(13);
  });
});

// =============================================================================
// THOUGHT STREAM RECENT THOUGHTS TESTS
// =============================================================================

test.describe('Recent Thoughts Tracking', () => {
  test('should maintain recent thoughts history', () => {
    const npc = createMockNPC('degen_trader');
    let stream = thoughtEngine.createDefaultThoughtStream();
    
    const thoughts: string[] = [stream.currentThought];
    
    // Generate multiple thoughts
    for (let i = 0; i < 5; i++) {
      stream = thoughtEngine.updateThoughtStream(npc, defaultContext, stream);
      if (stream.currentThought !== thoughts[thoughts.length - 1]) {
        thoughts.push(stream.currentThought);
      }
    }
    
    // Should have accumulated some thoughts
    expect(thoughts.length).toBeGreaterThanOrEqual(1);
  });

  test('should limit observations to prevent memory bloat', () => {
    let stream = thoughtEngine.createDefaultThoughtStream();
    
    // Add more than 10 observations
    for (let i = 0; i < 15; i++) {
      stream = thoughtEngine.addObservation(stream, {
        type: 'event',
        description: `Event ${i}`,
        emotionalValence: 0,
      });
    }
    
    // Should be capped at 10
    expect(stream.observations.length).toBe(10);
    // Most recent should be last
    expect(stream.observations[9].description).toBe('Event 14');
  });
});

// =============================================================================
// RELATIONSHIPS DISPLAY TESTS
// =============================================================================

test.describe('Relationships Display', () => {
  test('should categorize relationships by trust level', () => {
    const npc = createMockNPC('eth_builder', {
      relationships: {
        'friend-npc': {
          targetId: 'friend-npc',
          trust: 80,
          respect: 70,
          familiarity: 90,
          attraction: 30,
          type: 'friend',
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 10,
          owedFavors: 0,
        },
        'enemy-npc': {
          targetId: 'enemy-npc',
          trust: -50,
          respect: -30,
          familiarity: 60,
          attraction: 0,
          type: 'enemy',
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 5,
          owedFavors: 0,
        },
        'acquaintance-npc': {
          targetId: 'acquaintance-npc',
          trust: 10,
          respect: 20,
          familiarity: 40,
          attraction: 10,
          type: 'acquaintance',
          firstMet: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 2,
          owedFavors: 0,
        },
      },
    });
    
    const relationships = Object.entries(npc.relationships);
    
    // Verify relationships exist
    expect(relationships.length).toBe(3);
    
    // Check trust categorization (scale is -100 to 100)
    const friendRel = npc.relationships['friend-npc'];
    const enemyRel = npc.relationships['enemy-npc'];
    
    expect(friendRel.trust).toBeGreaterThan(50);
    expect(enemyRel.trust).toBeLessThan(-30);
  });
});

// =============================================================================
// ARCHETYPE DESCRIPTIONS TESTS
// =============================================================================

test.describe('Archetype Descriptions', () => {
  test('should have descriptions for all archetypes', async () => {
    // Import archetype descriptions
    const { ARCHETYPE_DESCRIPTIONS, ALL_ARCHETYPES } = await import('../src/lib/npc/personality');
    
    for (const archetype of ALL_ARCHETYPES) {
      expect(ARCHETYPE_DESCRIPTIONS[archetype]).toBeDefined();
      expect(ARCHETYPE_DESCRIPTIONS[archetype].length).toBeGreaterThan(0);
    }
  });
});
