import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Pet Core Types (Hero Pet System)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * These tests validate the core type definitions for the Titan Pet system,
 * inspired by Black & White's creature companion mechanics.
 */

// Import the types we're going to implement
// These imports will fail initially - that's expected in TDD!
import type {
  TitanSpecies,
  AlignmentState,
  TitanSkill,
  TitanGoal,
  ActionBelief,
  TitanNeeds,
  TitanMood,
  TitanBDI,
  TitanPet,
  SerializedTitan,
  TitanRelationship,
  TitanSpawnOptions,
} from "@/games/isocity/types/titan";

import {
  ALL_TITAN_SPECIES,
  ALL_TITAN_SKILLS,
  ALIGNMENT_STATES,
  TITAN_SPECIES_DESCRIPTIONS,
  TITAN_SKILL_DESCRIPTIONS,
} from "@/games/isocity/types/titan";

/**
 * Test Suite: TitanSpecies Type
 * Tests the available creature species
 */
test.describe("TitanSpecies Type", () => {
  test("should define all 6 species", async () => {
    expect(ALL_TITAN_SPECIES).toHaveLength(6);
    expect(ALL_TITAN_SPECIES).toContain('doge');
    expect(ALL_TITAN_SPECIES).toContain('bull');
    expect(ALL_TITAN_SPECIES).toContain('bear');
    expect(ALL_TITAN_SPECIES).toContain('ape');
    expect(ALL_TITAN_SPECIES).toContain('whale');
    expect(ALL_TITAN_SPECIES).toContain('phoenix');
  });

  test("should have Hitchhiker's Guide style descriptions for all species", async () => {
    expect(TITAN_SPECIES_DESCRIPTIONS.doge).toBeDefined();
    expect(TITAN_SPECIES_DESCRIPTIONS.bull).toBeDefined();
    expect(TITAN_SPECIES_DESCRIPTIONS.bear).toBeDefined();
    expect(TITAN_SPECIES_DESCRIPTIONS.ape).toBeDefined();
    expect(TITAN_SPECIES_DESCRIPTIONS.whale).toBeDefined();
    expect(TITAN_SPECIES_DESCRIPTIONS.phoenix).toBeDefined();
    
    // Each description should be a non-empty string
    Object.values(TITAN_SPECIES_DESCRIPTIONS).forEach(desc => {
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(10);
    });
  });
});

/**
 * Test Suite: AlignmentState Type
 * Tests the alignment system (-1.0 angelic to +1.0 demonic)
 */
test.describe("AlignmentState Type", () => {
  test("should define 5 alignment states", async () => {
    expect(ALIGNMENT_STATES).toHaveLength(5);
    expect(ALIGNMENT_STATES).toContain('angelic');
    expect(ALIGNMENT_STATES).toContain('good');
    expect(ALIGNMENT_STATES).toContain('neutral');
    expect(ALIGNMENT_STATES).toContain('evil');
    expect(ALIGNMENT_STATES).toContain('demonic');
  });

  test("alignment value type should accept number in range -1 to +1", async () => {
    // This tests that the type allows valid alignment values
    const validAlignments: number[] = [-1.0, -0.5, 0, 0.5, 1.0];
    validAlignments.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    });
  });
});

/**
 * Test Suite: TitanSkill Type
 * Tests the 12 skill categories
 */
test.describe("TitanSkill Type", () => {
  test("should define all 12 skills", async () => {
    expect(ALL_TITAN_SKILLS).toHaveLength(12);
    
    // Physical skills
    expect(ALL_TITAN_SKILLS).toContain('strength');
    expect(ALL_TITAN_SKILLS).toContain('speed');
    expect(ALL_TITAN_SKILLS).toContain('endurance');
    
    // Mental skills
    expect(ALL_TITAN_SKILLS).toContain('intelligence');
    expect(ALL_TITAN_SKILLS).toContain('awareness');
    expect(ALL_TITAN_SKILLS).toContain('memory');
    
    // Social skills
    expect(ALL_TITAN_SKILLS).toContain('charisma');
    expect(ALL_TITAN_SKILLS).toContain('intimidation');
    expect(ALL_TITAN_SKILLS).toContain('empathy');
    
    // Special skills
    expect(ALL_TITAN_SKILLS).toContain('miracles');
    expect(ALL_TITAN_SKILLS).toContain('stealth');
    expect(ALL_TITAN_SKILLS).toContain('gathering');
  });

  test("should have descriptions for all skills", async () => {
    ALL_TITAN_SKILLS.forEach((skill: TitanSkill) => {
      expect(TITAN_SKILL_DESCRIPTIONS[skill]).toBeDefined();
      expect(typeof TITAN_SKILL_DESCRIPTIONS[skill]).toBe('string');
    });
  });
});

/**
 * Test Suite: TitanGoal Type
 * Tests goal type union
 */
test.describe("TitanGoal Type", () => {
  test("should allow all valid goal types", async () => {
    // Type validation - if this compiles, goals are correctly typed
    const goals: TitanGoal[] = [
      { type: 'seek_food' },
      { type: 'seek_attention' },
      { type: 'help_npc', npcId: 'npc-123' },
      { type: 'explore_area', area: { x: 10, y: 20 } },
      { type: 'learn_from', npcId: 'npc-456' },
      { type: 'rest' },
      { type: 'play' },
    ];
    
    expect(goals).toHaveLength(7);
    expect(goals[0].type).toBe('seek_food');
    expect(goals[2].type).toBe('help_npc');
    expect((goals[2] as { type: 'help_npc'; npcId: string }).npcId).toBe('npc-123');
  });
});

/**
 * Test Suite: ActionBelief Interface
 * Tests the action belief structure for reinforcement learning
 */
test.describe("ActionBelief Interface", () => {
  test("should have required properties", async () => {
    const belief: ActionBelief = {
      action: 'help_npc',
      goodness: 0.8,
      confidence: 0.6,
      lastReinforced: Date.now(),
      reinforcementCount: 5,
    };
    
    expect(belief.action).toBe('help_npc');
    expect(belief.goodness).toBeGreaterThanOrEqual(-1);
    expect(belief.goodness).toBeLessThanOrEqual(1);
    expect(belief.confidence).toBeGreaterThanOrEqual(0);
    expect(belief.confidence).toBeLessThanOrEqual(1);
    expect(belief.lastReinforced).toBeGreaterThan(0);
    expect(belief.reinforcementCount).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Suite: TitanNeeds Interface
 * Tests that TitanNeeds extends NPCNeeds with Titan-specific additions
 */
test.describe("TitanNeeds Interface", () => {
  test("should include base NPC needs", async () => {
    const needs: TitanNeeds = {
      hunger: { current: 75, max: 100, decayRate: 0.5, criticalThreshold: 20, weight: 1.2 },
      energy: { current: 80, max: 100, decayRate: 0.3, criticalThreshold: 15, weight: 1.1 },
      social: { current: 60, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.9 },
      fun: { current: 70, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 0.8 },
      wealth: { current: 50, max: 100, decayRate: 0.1, criticalThreshold: 30, weight: 1.0 },
      purpose: { current: 65, max: 100, decayRate: 0.15, criticalThreshold: 25, weight: 0.9 },
      attention: { current: 40, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 1.0 },
      growth: { current: 55, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.8 },
    };
    
    // Base needs
    expect(needs.hunger).toBeDefined();
    expect(needs.energy).toBeDefined();
    expect(needs.social).toBeDefined();
    expect(needs.fun).toBeDefined();
    expect(needs.wealth).toBeDefined();
    expect(needs.purpose).toBeDefined();
    
    // Titan-specific needs
    expect(needs.attention).toBeDefined();
    expect(needs.growth).toBeDefined();
  });
});

/**
 * Test Suite: TitanMood Interface
 * Tests that TitanMood extends InternalWorld with player beliefs
 */
test.describe("TitanMood Interface", () => {
  test("should include beliefsAboutPlayer", async () => {
    const mood: TitanMood = {
      currentMood: 'happy',
      moodIntensity: 0.7,
      thoughts: [],
      beliefs: [],
      desires: [],
      beliefsAboutPlayer: {
        trust: 0.8,
        fear: 0.1,
        affection: 0.9,
      },
    };
    
    expect(mood.beliefsAboutPlayer).toBeDefined();
    expect(mood.beliefsAboutPlayer.trust).toBe(0.8);
    expect(mood.beliefsAboutPlayer.fear).toBe(0.1);
    expect(mood.beliefsAboutPlayer.affection).toBe(0.9);
  });
});

/**
 * Test Suite: TitanBDI Interface
 * Tests the Belief-Desire-Intention architecture
 */
test.describe("TitanBDI Interface", () => {
  test("should have beliefs, desires, and intentions", async () => {
    const bdi: TitanBDI = {
      beliefs: {
        worldKnowledge: new Map(),
        actionBeliefs: new Map(),
        npcOpinions: new Map(),
        playerRelationship: {
          trust: 0.5,
          fear: 0.0,
          affection: 0.7,
        },
      },
      desires: [],
      intentions: null,
    };
    
    expect(bdi.beliefs).toBeDefined();
    expect(bdi.beliefs.worldKnowledge).toBeInstanceOf(Map);
    expect(bdi.beliefs.actionBeliefs).toBeInstanceOf(Map);
    expect(bdi.beliefs.npcOpinions).toBeInstanceOf(Map);
    expect(bdi.beliefs.playerRelationship).toBeDefined();
    expect(bdi.desires).toBeDefined();
    expect(bdi.intentions).toBeNull();
  });
});

/**
 * Test Suite: TitanPet Interface
 * Tests the main Titan entity structure
 */
test.describe("TitanPet Interface", () => {
  test("should have all required fields", async () => {
    // Create a minimal valid TitanPet object
    const titan: TitanPet = {
      id: 'titan-001',
      species: 'doge',
      name: 'Satoshi',
      age: 10,
      alignment: 0.0,
      currentAppearance: 'neutral',
      gridX: 5,
      gridY: 10,
      direction: 'south',
      isInsideBuilding: false,
      currentBuildingId: null,
      currentActivity: 'idle',
      needs: {
        hunger: { current: 75, max: 100, decayRate: 0.5, criticalThreshold: 20, weight: 1.2 },
        energy: { current: 80, max: 100, decayRate: 0.3, criticalThreshold: 15, weight: 1.1 },
        social: { current: 60, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.9 },
        fun: { current: 70, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 0.8 },
        wealth: { current: 50, max: 100, decayRate: 0.1, criticalThreshold: 30, weight: 1.0 },
        purpose: { current: 65, max: 100, decayRate: 0.15, criticalThreshold: 25, weight: 0.9 },
        attention: { current: 40, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 1.0 },
        growth: { current: 55, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.8 },
      },
      mood: {
        currentMood: 'happy',
        moodIntensity: 0.7,
        thoughts: [],
        beliefs: [],
        desires: [],
        beliefsAboutPlayer: { trust: 0.5, fear: 0.0, affection: 0.5 },
      },
      bdi: {
        beliefs: {
          worldKnowledge: new Map(),
          actionBeliefs: new Map(),
          npcOpinions: new Map(),
          playerRelationship: { trust: 0.5, fear: 0.0, affection: 0.5 },
        },
        desires: [],
        intentions: null,
      },
      skills: {
        strength: { skill: 'strength', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        speed: { skill: 'speed', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        endurance: { skill: 'endurance', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        intelligence: { skill: 'intelligence', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        awareness: { skill: 'awareness', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        memory: { skill: 'memory', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        charisma: { skill: 'charisma', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        intimidation: { skill: 'intimidation', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        empathy: { skill: 'empathy', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        miracles: { skill: 'miracles', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        stealth: { skill: 'stealth', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        gathering: { skill: 'gathering', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      },
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
          fomo: 0.5,
          trustInInstitutions: 0.5,
          technicalKnowledge: 0.5,
          degenLevel: 0.5,
        },
      },
      actionHistory: [],
      relationships: {},
    };
    
    expect(titan.id).toBe('titan-001');
    expect(titan.species).toBe('doge');
    expect(titan.name).toBe('Satoshi');
    expect(titan.alignment).toBe(0.0);
    expect(titan.currentAppearance).toBe('neutral');
  });
});

/**
 * Test Suite: SerializedTitan Interface
 * Tests the persistence format
 */
test.describe("SerializedTitan Interface", () => {
  test("should have all required serialization fields", async () => {
    const serialized: SerializedTitan = {
      species: 'doge',
      name: 'Satoshi',
      age: 10,
      gridX: 5,
      gridY: 10,
      direction: 'south',
      alignment: 0.0,
      skills: {
        strength: { skill: 'strength', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        speed: { skill: 'speed', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        endurance: { skill: 'endurance', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        intelligence: { skill: 'intelligence', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        awareness: { skill: 'awareness', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        memory: { skill: 'memory', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        charisma: { skill: 'charisma', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        intimidation: { skill: 'intimidation', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        empathy: { skill: 'empathy', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        miracles: { skill: 'miracles', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        stealth: { skill: 'stealth', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
        gathering: { skill: 'gathering', level: 1, experience: 0, aptitude: 1.0, lastUsed: Date.now() },
      },
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
          fomo: 0.5,
          trustInInstitutions: 0.5,
          technicalKnowledge: 0.5,
          degenLevel: 0.5,
        },
      },
      needs: {
        hunger: { current: 75, max: 100, decayRate: 0.5, criticalThreshold: 20, weight: 1.2 },
        energy: { current: 80, max: 100, decayRate: 0.3, criticalThreshold: 15, weight: 1.1 },
        social: { current: 60, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.9 },
        fun: { current: 70, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 0.8 },
        wealth: { current: 50, max: 100, decayRate: 0.1, criticalThreshold: 30, weight: 1.0 },
        purpose: { current: 65, max: 100, decayRate: 0.15, criticalThreshold: 25, weight: 0.9 },
        attention: { current: 40, max: 100, decayRate: 0.4, criticalThreshold: 20, weight: 1.0 },
        growth: { current: 55, max: 100, decayRate: 0.2, criticalThreshold: 25, weight: 0.8 },
      },
      mood: {
        currentMood: 'happy',
        moodIntensity: 0.7,
        thoughts: [],
        beliefs: [],
        desires: [],
        beliefsAboutPlayer: { trust: 0.5, fear: 0.0, affection: 0.5 },
      },
      bdi: {
        beliefs: {
          worldKnowledge: [],
          actionBeliefs: [],
          npcOpinions: [],
          playerRelationship: { trust: 0.5, fear: 0.0, affection: 0.5 },
        },
        desires: [],
        intentions: null,
      },
      actionHistory: [],
      relationships: {},
      currentAppearance: 'neutral',
    };
    
    expect(serialized.species).toBe('doge');
    expect(serialized.name).toBe('Satoshi');
    // Serialized BDI uses arrays instead of Maps for JSON compatibility
    expect(Array.isArray(serialized.bdi.beliefs.worldKnowledge)).toBe(true);
  });
});

/**
 * Test Suite: TitanRelationship Interface
 * Tests the relationship tracking with NPCs
 */
test.describe("TitanRelationship Interface", () => {
  test("should track relationship metrics", async () => {
    const relationship: TitanRelationship = {
      npcId: 'npc-123',
      trust: 50,
      respect: 20,
      familiarity: 30,
      fear: 0,
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 1,
    };
    
    expect(relationship.npcId).toBe('npc-123');
    expect(relationship.trust).toBe(50);
    expect(relationship.familiarity).toBe(30);
    expect(relationship.respect).toBe(20);
    expect(relationship.fear).toBe(0);
  });
});

/**
 * Test Suite: TitanSpawnOptions Interface
 * Tests the spawning configuration
 */
test.describe("TitanSpawnOptions Interface", () => {
  test("should accept spawn configuration", async () => {
    const options: TitanSpawnOptions = {
      gridX: 10,
      gridY: 20,
      species: 'doge',
      name: 'Satoshi',
      direction: 'south',
    };
    
    expect(options.gridX).toBe(10);
    expect(options.gridY).toBe(20);
    expect(options.species).toBe('doge');
  });

  test("should allow minimal options", async () => {
    const minimalOptions: TitanSpawnOptions = {
      gridX: 5,
      gridY: 15,
    };
    
    expect(minimalOptions.gridX).toBe(5);
    expect(minimalOptions.gridY).toBe(15);
    expect(minimalOptions.species).toBeUndefined();
  });
});
