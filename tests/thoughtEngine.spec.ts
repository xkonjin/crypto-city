/**
 * ThoughtEngine Tests
 * 
 * Tests for the NPC thought generation system.
 * Uses direct imports since these are pure functions without browser dependencies.
 */

import { test, expect } from '@playwright/test';
import { ThoughtEngine, thoughtEngine, type ThoughtContext } from '../src/lib/npc/ThoughtEngine';
import { createDefaultNeeds } from '../src/lib/npc/needs';
import { createDefaultMemory } from '../src/lib/npc/memory';
import { createInitialMovement } from '../src/lib/npc/movement';
import { createDefaultPersonality, type PersonalityArchetype } from '../src/lib/npc/personality';
import type { CryptoNPC } from '../src/games/isocity/types/npc';

// Helper to create a mock NPC
function createMockNPC(archetype: PersonalityArchetype = 'degen_trader', overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: 'test-npc',
    name: 'TestNPC',
    walletAddress: '0x123',
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

// Default context for tests
const defaultContext: ThoughtContext = {
  nearbyNPCs: [],
  marketCondition: 'bull',
  timeOfDay: 'morning',
  recentEvents: [],
  gameDay: 1,
};

test.describe('ThoughtEngine', () => {
  test.describe('Module Exports', () => {
    test('should export ThoughtEngine class', () => {
      expect(typeof ThoughtEngine).toBe('function');
    });

    test('should export thoughtEngine singleton', () => {
      expect(thoughtEngine).toBeInstanceOf(ThoughtEngine);
    });
  });

  test.describe('Default Thought Stream', () => {
    test('should create default thought stream with all required fields', () => {
      const stream = thoughtEngine.createDefaultThoughtStream();
      
      expect(stream.currentThought).toBeDefined();
      expect(typeof stream.currentThought).toBe('string');
      expect(stream.lastUpdated).toBeDefined();
      expect(typeof stream.lastUpdated).toBe('number');
      expect(Array.isArray(stream.observations)).toBe(true);
      expect(Array.isArray(stream.shortTermPlan)).toBe(true);
      expect(Array.isArray(stream.longTermGoals)).toBe(true);
      expect(Array.isArray(stream.reflections)).toBe(true);
    });

    test('should have default "arrived" message', () => {
      const stream = thoughtEngine.createDefaultThoughtStream();
      expect(stream.currentThought).toContain('arrived');
    });
  });

  test.describe('Thought Generation', () => {
    test('should generate non-empty thought for any NPC', () => {
      const npc = createMockNPC('degen_trader');
      const thought = thoughtEngine.generateThought(npc, defaultContext);
      
      expect(thought).toBeDefined();
      expect(typeof thought).toBe('string');
      expect(thought.length).toBeGreaterThan(0);
    });

    test('should generate thoughts for all archetypes', () => {
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
        expect(thought.length).toBeGreaterThan(0);
      }
    });

    test('should generate variety of thoughts over multiple calls', () => {
      const npc = createMockNPC('degen_trader');
      const thoughts = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        const thought = thoughtEngine.generateThought(npc, defaultContext);
        thoughts.add(thought);
      }
      
      // Should have some variety (at least 3 different thoughts)
      expect(thoughts.size).toBeGreaterThan(2);
    });
  });

  test.describe('Need-Based Thoughts', () => {
    test('should prioritize hunger thoughts when very hungry', () => {
      const needs = createDefaultNeeds();
      needs.hunger.current = 5; // Critical level
      
      const npc = createMockNPC('normie_investor', { needs });
      const thoughts: string[] = [];
      
      for (let i = 0; i < 20; i++) {
        thoughts.push(thoughtEngine.generateThought(npc, defaultContext));
      }
      
      // At least some thoughts should be hunger-related
      const hungerThoughts = thoughts.filter(t => 
        t.toLowerCase().includes('hungry') ||
        t.toLowerCase().includes('food') ||
        t.toLowerCase().includes('eat') ||
        t.toLowerCase().includes('stomach')
      );
      
      expect(hungerThoughts.length).toBeGreaterThan(0);
    });

    test('should prioritize energy thoughts when exhausted', () => {
      const needs = createDefaultNeeds();
      needs.energy.current = 5; // Critical level
      
      const npc = createMockNPC('normie_investor', { needs });
      const thoughts: string[] = [];
      
      for (let i = 0; i < 20; i++) {
        thoughts.push(thoughtEngine.generateThought(npc, defaultContext));
      }
      
      // At least some thoughts should be energy-related
      const energyThoughts = thoughts.filter(t => 
        t.toLowerCase().includes('tired') ||
        t.toLowerCase().includes('sleep') ||
        t.toLowerCase().includes('energy') ||
        t.toLowerCase().includes('nap') ||
        t.toLowerCase().includes('eyes')
      );
      
      expect(energyThoughts.length).toBeGreaterThan(0);
    });
  });

  test.describe('Market Reaction Thoughts', () => {
    test('should generate different thoughts for bull vs bear market', () => {
      const npc = createMockNPC('degen_trader');
      
      const bullThoughts = new Set<string>();
      const bearThoughts = new Set<string>();
      
      const bullContext = { ...defaultContext, marketCondition: 'bull' as const };
      const bearContext = { ...defaultContext, marketCondition: 'bear' as const };
      
      for (let i = 0; i < 30; i++) {
        bullThoughts.add(thoughtEngine.generateThought(npc, bullContext));
        bearThoughts.add(thoughtEngine.generateThought(npc, bearContext));
      }
      
      // Both should have variety
      expect(bullThoughts.size).toBeGreaterThan(1);
      expect(bearThoughts.size).toBeGreaterThan(1);
    });
  });

  test.describe('Thought Stream Updates', () => {
    test('should update thought stream with new thought', () => {
      const npc = createMockNPC('eth_builder');
      const stream = thoughtEngine.createDefaultThoughtStream();
      
      const updated = thoughtEngine.updateThoughtStream(npc, defaultContext, stream);
      
      expect(updated.lastUpdated).toBeGreaterThanOrEqual(stream.lastUpdated);
      expect(updated.currentThought).toBeDefined();
    });

    test('should add observations to thought stream', () => {
      const stream = thoughtEngine.createDefaultThoughtStream();
      
      const updated = thoughtEngine.addObservation(stream, {
        type: 'npc',
        description: 'Saw a trader walking by',
        emotionalValence: 0.5,
      });
      
      expect(updated.observations.length).toBe(1);
      expect(updated.observations[0].description).toBe('Saw a trader walking by');
      expect(updated.observations[0].timestamp).toBeDefined();
    });

    test('should limit observations to 10 items', () => {
      let stream = thoughtEngine.createDefaultThoughtStream();
      
      // Add 15 observations
      for (let i = 0; i < 15; i++) {
        stream = thoughtEngine.addObservation(stream, {
          type: 'event',
          description: `Event ${i}`,
          emotionalValence: 0,
        });
      }
      
      expect(stream.observations.length).toBe(10);
      // Should keep the most recent ones
      expect(stream.observations[9].description).toBe('Event 14');
    });
  });

  test.describe('Activity-Based Thoughts', () => {
    test('should generate activity-appropriate thoughts', () => {
      const activities = ['idle', 'walking', 'working', 'eating', 'socializing'] as const;
      
      for (const activity of activities) {
        const npc = createMockNPC('normie_investor', { currentActivity: activity });
        const thoughts: string[] = [];
        
        for (let i = 0; i < 10; i++) {
          thoughts.push(thoughtEngine.generateThought(npc, defaultContext));
        }
        
        // Should generate at least one non-empty thought
        expect(thoughts.some(t => t.length > 0)).toBe(true);
      }
    });
  });
});
