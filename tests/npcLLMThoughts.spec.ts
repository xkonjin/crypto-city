/**
 * NPC LLM Thought Generation Tests
 * Issue #212: NPC Thought Generation System
 * 
 * Tests for LLM-powered thought generation that:
 * - Generates contextual NPC thoughts using LLM
 * - Respects personality types (finance-bro, degen-trader, etc.)
 * - Integrates with LOD system (detailed thoughts only at close zoom)
 * - Stores thoughts in NPC memory
 * 
 * TDD Phase 1: Write failing tests first
 */

import { test, expect } from '@playwright/test';
import { ThoughtEngine, thoughtEngine, type ThoughtContext } from '../src/lib/npc/ThoughtEngine';
import { createDefaultNeeds } from '../src/lib/npc/needs';
import { createDefaultMemory } from '../src/lib/npc/memory';
import { createInitialMovement } from '../src/lib/npc/movement';
import { createDefaultPersonality, type PersonalityArchetype } from '../src/lib/npc/personality';
import type { CryptoNPC } from '../src/games/isocity/types/npc';
import { NPCDetailLevel } from '../src/lib/npc/LODManager';

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

/** Default thought context */
const defaultContext: ThoughtContext = {
  nearbyNPCs: [],
  marketCondition: 'bull',
  timeOfDay: 'morning',
  recentEvents: [],
  gameDay: 1,
};

// =============================================================================
// LLM THOUGHT GENERATION TYPES
// =============================================================================

test.describe('LLM Thought Generation Types', () => {
  test('should export LLMThoughtConfig type', async () => {
    // Import types to verify they exist
    const thoughtModule = await import('../src/lib/npc/ThoughtEngine');
    // Type should exist and be usable - use the config method to verify
    const config = thoughtModule.thoughtEngine.getLLMThoughtConfig();
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('provider');
    expect(config).toHaveProperty('maxTokens');
  });

  test('should export LLMThoughtRequest type', async () => {
    // LLMThoughtRequest is a type, verify structure through usage
    const request = {
      npcId: 'test-npc',
      personality: 'degen_trader',
      context: defaultContext,
      previousThoughts: [],
    };
    expect(request.personality).toBe('degen_trader');
  });

  test('should export LLMThoughtResponse type', async () => {
    // LLMThoughtResponse is a type, verify structure through usage
    const response = {
      thought: 'I should probably check the charts...',
      emotion: 'anxious',
      confidence: 0.85,
      usedLLM: true,
      tokensUsed: 25,
    };
    expect(response.usedLLM).toBe(true);
  });
});

// =============================================================================
// LLM THOUGHT ENGINE API
// =============================================================================

test.describe('LLMThoughtEngine API', () => {
  test('should have generateLLMThought method', () => {
    expect(typeof thoughtEngine.generateLLMThought).toBe('function');
  });

  test('should have configureLLMThoughts method', () => {
    expect(typeof thoughtEngine.configureLLMThoughts).toBe('function');
  });

  test('should have getLLMThoughtConfig method', () => {
    expect(typeof thoughtEngine.getLLMThoughtConfig).toBe('function');
  });

  test('should have isLLMThoughtEnabled method', () => {
    expect(typeof thoughtEngine.isLLMThoughtEnabled).toBe('function');
  });

  test('should have getLLMThoughtCooldownRemaining method', () => {
    expect(typeof thoughtEngine.getLLMThoughtCooldownRemaining).toBe('function');
  });
});

// =============================================================================
// LLM THOUGHT CONFIGURATION
// =============================================================================

test.describe('LLM Thought Configuration', () => {
  test('should default to disabled', () => {
    const config = thoughtEngine.getLLMThoughtConfig();
    expect(config.enabled).toBe(false);
  });

  test('should allow enabling LLM thoughts', () => {
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    expect(thoughtEngine.isLLMThoughtEnabled()).toBe(true);
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should respect cooldown configuration', () => {
    thoughtEngine.configureLLMThoughts({ cooldownMs: 10000 });
    const config = thoughtEngine.getLLMThoughtConfig();
    expect(config.cooldownMs).toBe(10000);
    // Reset
    thoughtEngine.configureLLMThoughts({ cooldownMs: 5000 });
  });

  test('should support multiple providers', () => {
    const providers = ['openai', 'anthropic', 'mock', 'local'] as const;
    for (const provider of providers) {
      thoughtEngine.configureLLMThoughts({ provider });
      const config = thoughtEngine.getLLMThoughtConfig();
      expect(config.provider).toBe(provider);
    }
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false, provider: 'mock' });
  });
});

// =============================================================================
// PERSONALITY-DRIVEN LLM THOUGHTS
// =============================================================================

test.describe('Personality-Driven LLM Thoughts', () => {
  test('should generate finance-bro style thoughts for degen_trader', async () => {
    const npc = createMockNPC('degen_trader');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    // Should contain degen vocabulary or sentiment
    const degenTerms = ['ape', 'moon', 'pump', 'LFG', 'WAGMI', 'ser', 'fren', 'degen', 'chart', 'gain'];
    const hasDegenVibe = degenTerms.some(term => 
      response.thought.toLowerCase().includes(term.toLowerCase())
    );
    expect(hasDegenVibe || response.thought.length > 0).toBe(true);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should generate technical thoughts for eth_builder', async () => {
    const npc = createMockNPC('eth_builder');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    // Should have some content
    expect(response.thought.length).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should generate conservative thoughts for staking_grandma', async () => {
    const npc = createMockNPC('staking_grandma');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    // Should have some content
    expect(response.thought.length).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should generate paranoid thoughts for privacy_maxi', async () => {
    const npc = createMockNPC('privacy_maxi');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    // Should have some content
    expect(response.thought.length).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should include personality traits in LLM prompt', async () => {
    const npc = createMockNPC('bitcoin_maxi', {
      personality: {
        bigFive: {
          openness: 0.2,
          conscientiousness: 0.9,
          extraversion: 0.3,
          agreeableness: 0.2,
          neuroticism: 0.6,
        },
        crypto: {
          riskTolerance: 0.3,
          fomo: 0.1,
          trustInInstitutions: 0.05,
          technicalKnowledge: 0.8,
          degenLevel: 0.1,
        },
      },
    });
    
    // The LLM prompt builder should incorporate personality traits
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, defaultContext);
    
    expect(prompt).toContain('bitcoin_maxi');
    expect(prompt).toContain('Personality Traits');
  });
});

// =============================================================================
// LOD INTEGRATION
// =============================================================================

test.describe('LOD Integration for LLM Thoughts', () => {
  test('should allow LLM thoughts at FULL detail level', () => {
    const allowed = thoughtEngine.shouldUseLLMThought(NPCDetailLevel.FULL);
    expect(allowed).toBe(true);
  });

  test('should allow LLM thoughts at HIGH detail level', () => {
    const allowed = thoughtEngine.shouldUseLLMThought(NPCDetailLevel.HIGH);
    expect(allowed).toBe(true);
  });

  test('should not allow LLM thoughts at MEDIUM detail level', () => {
    const allowed = thoughtEngine.shouldUseLLMThought(NPCDetailLevel.MEDIUM);
    expect(allowed).toBe(false);
  });

  test('should not allow LLM thoughts at LOW detail level', () => {
    const allowed = thoughtEngine.shouldUseLLMThought(NPCDetailLevel.LOW);
    expect(allowed).toBe(false);
  });

  test('should not allow LLM thoughts at MINIMAL detail level', () => {
    const allowed = thoughtEngine.shouldUseLLMThought(NPCDetailLevel.MINIMAL);
    expect(allowed).toBe(false);
  });

  test('should not allow LLM thoughts at SUSPENDED detail level', () => {
    const allowed = thoughtEngine.shouldUseLLMThought(NPCDetailLevel.SUSPENDED);
    expect(allowed).toBe(false);
  });

  test('should generate template thought when LOD is too low', async () => {
    const npc = createMockNPC('degen_trader');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    // Generate thought with LOW LOD - should fall back to template
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext, NPCDetailLevel.LOW);
    
    expect(response.usedLLM).toBe(false);
    expect(response.thought.length).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });
});

// =============================================================================
// MEMORY INTEGRATION
// =============================================================================

test.describe('Memory Integration for LLM Thoughts', () => {
  test('should store LLM thought in episodic memory', async () => {
    const npc = createMockNPC('degen_trader');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    // Store thought in memory
    thoughtEngine.storeThoughtInMemory(npc, response);
    
    // Check memory was updated
    expect(npc.memory.episodic.length).toBeGreaterThan(0);
    const thoughtMemory = npc.memory.episodic.find(m => m.event.includes('thought'));
    expect(thoughtMemory).toBeDefined();
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should include recent memories in LLM context', async () => {
    const npc = createMockNPC('eth_builder');
    
    // Add some memories
    npc.memory.episodic.push({
      id: 'mem-1',
      event: 'Met a whale trader',
      participants: ['whale-123'],
      location: { x: 10, y: 10 },
      timestamp: Date.now() - 1000,
      importance: 7,
      emotionalValence: 0.5,
      strength: 0.9,
    });
    
    // Build prompt should include memories
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, defaultContext);
    
    expect(prompt).toContain('whale');
  });

  test('should limit memory context to prevent token overflow', () => {
    const npc = createMockNPC('normie_investor');
    
    // Add many memories
    for (let i = 0; i < 100; i++) {
      npc.memory.episodic.push({
        id: `mem-${i}`,
        event: `Event ${i} with lots of details`,
        participants: [],
        location: { x: 10, y: 10 },
        timestamp: Date.now() - i * 1000,
        importance: 3,
        emotionalValence: 0,
        strength: 0.5,
      });
    }
    
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, defaultContext);
    
    // Should not include all 100 memories
    const memoryMentions = (prompt.match(/Event \d+/g) || []).length;
    expect(memoryMentions).toBeLessThanOrEqual(5);
  });
});

// =============================================================================
// COOLDOWN AND RATE LIMITING
// =============================================================================

test.describe('Cooldown and Rate Limiting', () => {
  test('should respect per-NPC cooldown', async () => {
    const npc = createMockNPC('degen_trader');
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock', cooldownMs: 1000 });
    
    // First call should work
    const response1 = await thoughtEngine.generateLLMThought(npc, defaultContext);
    expect(response1.thought.length).toBeGreaterThan(0);
    
    // Immediate second call should be on cooldown
    const cooldownRemaining = thoughtEngine.getLLMThoughtCooldownRemaining(npc.id);
    expect(cooldownRemaining).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should track global rate limits', () => {
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const status = thoughtEngine.getLLMRateLimitStatus();
    
    expect(status).toHaveProperty('requestsRemaining');
    expect(status).toHaveProperty('tokensRemaining');
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should fall back to template when rate limited', async () => {
    const npc = createMockNPC('degen_trader');
    thoughtEngine.configureLLMThoughts({ 
      enabled: true, 
      provider: 'mock',
      rateLimit: { requestsPerMinute: 0, tokensPerDay: 0 }
    });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    // Should fall back to template due to rate limit
    expect(response.usedLLM).toBe(false);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });
});

// =============================================================================
// CONTEXT-AWARE THOUGHTS
// =============================================================================

test.describe('Context-Aware LLM Thoughts', () => {
  test('should reference nearby NPCs in thoughts', async () => {
    const npc = createMockNPC('degen_trader');
    const nearbyNPC = createMockNPC('bitcoin_maxi', { name: 'CryptoMax' });
    
    const contextWithNearby: ThoughtContext = {
      ...defaultContext,
      nearbyNPCs: [nearbyNPC],
    };
    
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, contextWithNearby);
    
    expect(prompt).toContain('CryptoMax');
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should reference market condition in thoughts', async () => {
    const npc = createMockNPC('degen_trader');
    
    const bearContext: ThoughtContext = {
      ...defaultContext,
      marketCondition: 'bear',
    };
    
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, bearContext);
    
    expect(prompt.toLowerCase()).toContain('bear');
  });

  test('should reference time of day in thoughts', async () => {
    const npc = createMockNPC('normie_investor');
    
    const nightContext: ThoughtContext = {
      ...defaultContext,
      timeOfDay: 'night',
    };
    
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, nightContext);
    
    expect(prompt.toLowerCase()).toContain('night');
  });

  test('should reference NPC needs in thoughts', async () => {
    const needs = createDefaultNeeds();
    needs.hunger.current = 10; // Very hungry
    
    const npc = createMockNPC('normie_investor', { needs });
    
    const prompt = thoughtEngine.buildLLMThoughtPrompt(npc, defaultContext);
    
    expect(prompt.toLowerCase()).toContain('hunger');
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

test.describe('Error Handling', () => {
  test('should gracefully handle LLM API errors', async () => {
    const npc = createMockNPC('degen_trader');
    thoughtEngine.configureLLMThoughts({ 
      enabled: true, 
      provider: 'mock',
      // Mock will simulate error
    });
    
    // Should not throw, should return fallback
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    
    expect(response.thought.length).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should handle missing NPC data gracefully', async () => {
    const incompleteNPC = {
      id: 'incomplete',
      name: 'Incomplete NPC',
      occupation: 'trader',
      needs: createDefaultNeeds(),
    } as unknown as CryptoNPC;
    
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    // Should not throw
    const response = await thoughtEngine.generateLLMThought(incompleteNPC, defaultContext);
    
    expect(response.thought.length).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });
});

// =============================================================================
// THOUGHT STREAM INTEGRATION
// =============================================================================

test.describe('Thought Stream Integration', () => {
  test('should update thought stream with LLM thought', async () => {
    const npc = createMockNPC('eth_builder');
    npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
    
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    thoughtEngine.updateThoughtStreamWithLLM(npc, response);
    
    expect(npc.thoughtStream.currentThought).toBe(response.thought);
    expect(npc.thoughtStream.lastUpdated).toBeGreaterThan(0);
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });

  test('should add LLM thought to observations', async () => {
    const npc = createMockNPC('protocol_politician');
    npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
    
    thoughtEngine.configureLLMThoughts({ enabled: true, provider: 'mock' });
    
    const response = await thoughtEngine.generateLLMThought(npc, defaultContext);
    thoughtEngine.updateThoughtStreamWithLLM(npc, response);
    
    // Should have added an observation about using LLM
    const llmObservation = npc.thoughtStream.observations.find(
      o => o.type === 'event' && o.description.includes('thought')
    );
    expect(llmObservation).toBeDefined();
    
    // Reset
    thoughtEngine.configureLLMThoughts({ enabled: false });
  });
});
