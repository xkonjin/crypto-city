import { test, expect } from "@playwright/test";

/**
 * NPC Political Beliefs System Tests (#190)
 * 
 * TDD Phase 1: Tests for the NPC political beliefs system including:
 * - PoliticalBeliefs interface with 6 belief dimensions
 * - BeliefInfluence tracking
 * - PoliticalBeliefManager class
 * - Belief initialization from personality
 * - Experience-based belief updates
 * - Social influence on beliefs
 * - Economic influence on beliefs
 * - Faction alignment calculations
 */

import type {
  PoliticalBeliefs,
  BeliefInfluence,
} from "@/lib/npc/politicalBeliefs";
import {
  createDefaultPoliticalBeliefs,
  createBeliefInfluence,
  BELIEF_DESCRIPTIONS,
  BeliefType,
  ALL_BELIEF_TYPES,
} from "@/lib/npc/politicalBeliefs";
import { PoliticalBeliefManager } from "@/lib/npc/PoliticalBeliefManager";
import { createDefaultPersonality, ARCHETYPE_PROFILES } from "@/lib/npc/personality";
import { FACTION_TEMPLATES } from "@/lib/npc/factions";
import type { CryptoNPC } from "@/lib/npc";
import type { EpisodicMemory } from "@/lib/npc/memory";
import type { Relationship } from "@/lib/npc/relationships";

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: overrides.id ?? 'test-npc-1',
    name: 'TestNPC',
    walletAddress: '0x123',
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
    needs: {
      hunger: 100,
      energy: 100,
      social: 100,
      fun: 100,
      wealth: 100,
      purpose: 100,
    },
    memory: {
      episodic: [],
      semantic: [],
      procedural: [],
      working: { recentEvents: [], currentGoal: null, currentContext: '' },
    },
    movement: {
      state: 'idle',
      path: [],
      pathIndex: 0,
      targetX: null,
      targetY: null,
      progress: 0,
      speed: 1,
    },
    personality: overrides.personality ?? createDefaultPersonality(),
    relationships: overrides.relationships ?? {},
    ...overrides,
  } as CryptoNPC;
}

/**
 * Test Suite: PoliticalBeliefs Types
 */
test.describe("PoliticalBeliefs Types", () => {
  test("should define PoliticalBeliefs interface with all 6 belief dimensions", async () => {
    const beliefs = createDefaultPoliticalBeliefs();

    expect(typeof beliefs.wealthRedistribution).toBe('number');
    expect(typeof beliefs.regulationSupport).toBe('number');
    expect(typeof beliefs.centralAuthority).toBe('number');
    expect(typeof beliefs.democraticParticipation).toBe('number');
    expect(typeof beliefs.decentralizationPurity).toBe('number');
    expect(typeof beliefs.privacyImportance).toBe('number');
  });

  test("all belief values should be between 0 and 1", async () => {
    const beliefs = createDefaultPoliticalBeliefs();

    expect(beliefs.wealthRedistribution).toBeGreaterThanOrEqual(0);
    expect(beliefs.wealthRedistribution).toBeLessThanOrEqual(1);
    expect(beliefs.regulationSupport).toBeGreaterThanOrEqual(0);
    expect(beliefs.regulationSupport).toBeLessThanOrEqual(1);
    expect(beliefs.centralAuthority).toBeGreaterThanOrEqual(0);
    expect(beliefs.centralAuthority).toBeLessThanOrEqual(1);
    expect(beliefs.democraticParticipation).toBeGreaterThanOrEqual(0);
    expect(beliefs.democraticParticipation).toBeLessThanOrEqual(1);
    expect(beliefs.decentralizationPurity).toBeGreaterThanOrEqual(0);
    expect(beliefs.decentralizationPurity).toBeLessThanOrEqual(1);
    expect(beliefs.privacyImportance).toBeGreaterThanOrEqual(0);
    expect(beliefs.privacyImportance).toBeLessThanOrEqual(1);
  });

  test("default beliefs should be neutral (0.5)", async () => {
    const beliefs = createDefaultPoliticalBeliefs();

    expect(beliefs.wealthRedistribution).toBe(0.5);
    expect(beliefs.regulationSupport).toBe(0.5);
    expect(beliefs.centralAuthority).toBe(0.5);
    expect(beliefs.democraticParticipation).toBe(0.5);
    expect(beliefs.decentralizationPurity).toBe(0.5);
    expect(beliefs.privacyImportance).toBe(0.5);
  });

  test("should allow overrides when creating default beliefs", async () => {
    const beliefs = createDefaultPoliticalBeliefs({
      wealthRedistribution: 0.8,
      privacyImportance: 0.9,
    });

    expect(beliefs.wealthRedistribution).toBe(0.8);
    expect(beliefs.privacyImportance).toBe(0.9);
    expect(beliefs.regulationSupport).toBe(0.5); // Default
  });

  test("should clamp belief values to 0-1 range", async () => {
    const beliefs = createDefaultPoliticalBeliefs({
      wealthRedistribution: 1.5,
      privacyImportance: -0.5,
    });

    expect(beliefs.wealthRedistribution).toBe(1);
    expect(beliefs.privacyImportance).toBe(0);
  });
});

/**
 * Test Suite: BeliefInfluence Types
 */
test.describe("BeliefInfluence Types", () => {
  test("should define BeliefInfluence interface with all required properties", async () => {
    const influence = createBeliefInfluence({
      source: 'experience',
      sourceId: 'memory-123',
      belief: 'wealthRedistribution',
      strength: 0.1,
    });

    expect(typeof influence.id).toBe('string');
    expect(typeof influence.source).toBe('string');
    expect(typeof influence.sourceId).toBe('string');
    expect(typeof influence.belief).toBe('string');
    expect(typeof influence.strength).toBe('number');
    expect(typeof influence.timestamp).toBe('number');
  });

  test("source should be valid type", async () => {
    const validSources = ['personality', 'experience', 'social', 'economic', 'faction'];
    
    const influence = createBeliefInfluence({
      source: 'experience',
      sourceId: 'test',
      belief: 'wealthRedistribution',
      strength: 0.1,
    });

    expect(validSources).toContain(influence.source);
  });

  test("strength should be between -1 and 1", async () => {
    const influence = createBeliefInfluence({
      source: 'social',
      sourceId: 'npc-123',
      belief: 'regulationSupport',
      strength: 0.5,
    });

    expect(influence.strength).toBeGreaterThanOrEqual(-1);
    expect(influence.strength).toBeLessThanOrEqual(1);
  });

  test("should clamp strength values", async () => {
    const influence = createBeliefInfluence({
      source: 'economic',
      sourceId: 'wealth-change',
      belief: 'wealthRedistribution',
      strength: 2.0,
    });

    expect(influence.strength).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: Belief Descriptions
 */
test.describe("Belief Descriptions", () => {
  test("should have Hitchhiker's Guide descriptions for all beliefs", async () => {
    expect(BELIEF_DESCRIPTIONS.wealthRedistribution).toBeDefined();
    expect(BELIEF_DESCRIPTIONS.regulationSupport).toBeDefined();
    expect(BELIEF_DESCRIPTIONS.centralAuthority).toBeDefined();
    expect(BELIEF_DESCRIPTIONS.democraticParticipation).toBeDefined();
    expect(BELIEF_DESCRIPTIONS.decentralizationPurity).toBeDefined();
    expect(BELIEF_DESCRIPTIONS.privacyImportance).toBeDefined();
  });

  test("descriptions should have low and high variants", async () => {
    for (const belief of ALL_BELIEF_TYPES) {
      const desc = BELIEF_DESCRIPTIONS[belief];
      expect(desc.low).toBeDefined();
      expect(desc.high).toBeDefined();
      expect(typeof desc.low).toBe('string');
      expect(typeof desc.high).toBe('string');
    }
  });

  test("ALL_BELIEF_TYPES should contain all 6 beliefs", async () => {
    expect(ALL_BELIEF_TYPES.length).toBe(6);
    expect(ALL_BELIEF_TYPES).toContain('wealthRedistribution');
    expect(ALL_BELIEF_TYPES).toContain('regulationSupport');
    expect(ALL_BELIEF_TYPES).toContain('centralAuthority');
    expect(ALL_BELIEF_TYPES).toContain('democraticParticipation');
    expect(ALL_BELIEF_TYPES).toContain('decentralizationPurity');
    expect(ALL_BELIEF_TYPES).toContain('privacyImportance');
  });
});

/**
 * Test Suite: PoliticalBeliefManager - Initialization
 */
test.describe("PoliticalBeliefManager - Initialization from Personality", () => {
  test("should initialize beliefs from Big Five + crypto traits", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { openness: 0.8, conscientiousness: 0.3 },
        crypto: { trustInInstitutions: 0.2, technicalKnowledge: 0.9 },
      }),
    });

    const beliefs = manager.initializeBeliefsFromPersonality(npc);

    expect(beliefs).toBeDefined();
    expect(typeof beliefs.wealthRedistribution).toBe('number');
  });

  test("high openness should increase decentralization purity", async () => {
    const manager = new PoliticalBeliefManager();
    
    const highOpennessNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { openness: 0.9 },
      }),
    });
    
    const lowOpennessNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { openness: 0.1 },
      }),
    });

    const highOpenBeliefs = manager.initializeBeliefsFromPersonality(highOpennessNPC);
    const lowOpenBeliefs = manager.initializeBeliefsFromPersonality(lowOpennessNPC);

    expect(highOpenBeliefs.decentralizationPurity).toBeGreaterThan(lowOpenBeliefs.decentralizationPurity);
  });

  test("low trust in institutions should increase decentralization purity", async () => {
    const manager = new PoliticalBeliefManager();
    
    const lowTrustNPC = createMockNPC({
      personality: createDefaultPersonality({
        crypto: { trustInInstitutions: 0.1 },
      }),
    });
    
    const highTrustNPC = createMockNPC({
      personality: createDefaultPersonality({
        crypto: { trustInInstitutions: 0.9 },
      }),
    });

    const lowTrustBeliefs = manager.initializeBeliefsFromPersonality(lowTrustNPC);
    const highTrustBeliefs = manager.initializeBeliefsFromPersonality(highTrustNPC);

    expect(lowTrustBeliefs.decentralizationPurity).toBeGreaterThan(highTrustBeliefs.decentralizationPurity);
  });

  test("low trust should increase privacy importance", async () => {
    const manager = new PoliticalBeliefManager();
    
    const lowTrustNPC = createMockNPC({
      personality: createDefaultPersonality({
        crypto: { trustInInstitutions: 0.1 },
      }),
    });
    
    const highTrustNPC = createMockNPC({
      personality: createDefaultPersonality({
        crypto: { trustInInstitutions: 0.9 },
      }),
    });

    const lowTrustBeliefs = manager.initializeBeliefsFromPersonality(lowTrustNPC);
    const highTrustBeliefs = manager.initializeBeliefsFromPersonality(highTrustNPC);

    expect(lowTrustBeliefs.privacyImportance).toBeGreaterThan(highTrustBeliefs.privacyImportance);
  });

  test("high extraversion should increase democratic participation", async () => {
    const manager = new PoliticalBeliefManager();
    
    const highExtraNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { extraversion: 0.9 },
      }),
    });
    
    const lowExtraNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { extraversion: 0.1 },
      }),
    });

    const highExtraBeliefs = manager.initializeBeliefsFromPersonality(highExtraNPC);
    const lowExtraBeliefs = manager.initializeBeliefsFromPersonality(lowExtraNPC);

    expect(highExtraBeliefs.democraticParticipation).toBeGreaterThan(lowExtraBeliefs.democraticParticipation);
  });

  test("high agreeableness should increase wealth redistribution support", async () => {
    const manager = new PoliticalBeliefManager();
    
    const highAgreeNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { agreeableness: 0.9 },
      }),
    });
    
    const lowAgreeNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { agreeableness: 0.1 },
      }),
    });

    const highAgreeBeliefs = manager.initializeBeliefsFromPersonality(highAgreeNPC);
    const lowAgreeBeliefs = manager.initializeBeliefsFromPersonality(lowAgreeNPC);

    expect(highAgreeBeliefs.wealthRedistribution).toBeGreaterThan(lowAgreeBeliefs.wealthRedistribution);
  });

  test("initialized beliefs should be clamped to 0-1", async () => {
    const manager = new PoliticalBeliefManager();
    
    // Extreme personality to potentially push beliefs out of range
    const extremeNPC = createMockNPC({
      personality: createDefaultPersonality({
        bigFive: { openness: 1.0, conscientiousness: 0, extraversion: 1.0, agreeableness: 1.0, neuroticism: 1.0 },
        crypto: { trustInInstitutions: 0, technicalKnowledge: 1.0, degenLevel: 1.0, riskTolerance: 1.0, fomo: 1.0 },
      }),
    });

    const beliefs = manager.initializeBeliefsFromPersonality(extremeNPC);

    for (const belief of ALL_BELIEF_TYPES) {
      expect(beliefs[belief]).toBeGreaterThanOrEqual(0);
      expect(beliefs[belief]).toBeLessThanOrEqual(1);
    }
  });
});

/**
 * Test Suite: PoliticalBeliefManager - Experience Updates
 */
test.describe("PoliticalBeliefManager - Experience-based Updates", () => {
  test("should update beliefs based on memory experience", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs();

    const experience: EpisodicMemory = {
      id: 'mem-1',
      timestamp: Date.now(),
      location: { x: 5, y: 5 },
      participants: ['npc-1'],
      event: 'Got rugged by centralized exchange',
      emotionalValence: -0.8,
      importance: 8,
      accessCount: 0,
      lastAccessed: Date.now(),
      strength: 1.0,
    };

    const updated = manager.updateBeliefFromExperience(npc, experience);

    expect(updated).toBeDefined();
    // Negative experience with centralized entity should shift beliefs
  });

  test("negative experience with centralized entity should decrease central authority support", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ centralAuthority: 0.5 });

    const experience: EpisodicMemory = {
      id: 'mem-1',
      timestamp: Date.now(),
      location: { x: 5, y: 5 },
      participants: ['npc-1'],
      event: 'Lost funds when centralized exchange froze withdrawals',
      emotionalValence: -0.9,
      importance: 9,
      accessCount: 0,
      lastAccessed: Date.now(),
      strength: 1.0,
    };

    const before = npc.politicalBeliefs.centralAuthority;
    manager.updateBeliefFromExperience(npc, experience);
    
    expect(npc.politicalBeliefs.centralAuthority).toBeLessThan(before);
  });

  test("positive community experience should increase democratic participation", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ democraticParticipation: 0.5 });

    const experience: EpisodicMemory = {
      id: 'mem-1',
      timestamp: Date.now(),
      location: { x: 5, y: 5 },
      participants: ['npc-1', 'npc-2', 'npc-3'],
      event: 'Participated in successful DAO governance vote',
      emotionalValence: 0.8,
      importance: 7,
      accessCount: 0,
      lastAccessed: Date.now(),
      strength: 1.0,
    };

    const before = npc.politicalBeliefs.democraticParticipation;
    manager.updateBeliefFromExperience(npc, experience);
    
    expect(npc.politicalBeliefs.democraticParticipation).toBeGreaterThan(before);
  });

  test("experience importance should scale belief shift", async () => {
    const manager = new PoliticalBeliefManager();
    
    const npc1 = createMockNPC({ id: 'npc-1' });
    npc1.politicalBeliefs = createDefaultPoliticalBeliefs({ centralAuthority: 0.5 });
    
    const npc2 = createMockNPC({ id: 'npc-2' });
    npc2.politicalBeliefs = createDefaultPoliticalBeliefs({ centralAuthority: 0.5 });

    const lowImportance: EpisodicMemory = {
      id: 'mem-1',
      timestamp: Date.now(),
      location: { x: 5, y: 5 },
      participants: [],
      event: 'Minor inconvenience with exchange',
      emotionalValence: -0.5,
      importance: 2,
      accessCount: 0,
      lastAccessed: Date.now(),
      strength: 1.0,
    };

    const highImportance: EpisodicMemory = {
      id: 'mem-2',
      timestamp: Date.now(),
      location: { x: 5, y: 5 },
      participants: [],
      event: 'Major loss from exchange hack',
      emotionalValence: -0.5,
      importance: 9,
      accessCount: 0,
      lastAccessed: Date.now(),
      strength: 1.0,
    };

    manager.updateBeliefFromExperience(npc1, lowImportance);
    manager.updateBeliefFromExperience(npc2, highImportance);

    const shift1 = 0.5 - npc1.politicalBeliefs.centralAuthority;
    const shift2 = 0.5 - npc2.politicalBeliefs.centralAuthority;

    expect(Math.abs(shift2)).toBeGreaterThan(Math.abs(shift1));
  });
});

/**
 * Test Suite: PoliticalBeliefManager - Social Influence
 */
test.describe("PoliticalBeliefManager - Social Influence", () => {
  test("should apply social influence from friends", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    const friend = createMockNPC({ id: 'friend-1' });
    friend.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.9 });

    const relationship: Relationship = {
      targetId: 'friend-1',
      trust: 80,
      respect: 70,
      familiarity: 60,
      attraction: 0,
      type: 'friend',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 10,
      owedFavors: 0,
    };

    manager.applySocialInfluence(npc, [{ npc: friend, relationship }]);

    expect(npc.politicalBeliefs.wealthRedistribution).toBeGreaterThan(0.5);
  });

  test("influence should be weighted by trust", async () => {
    const manager = new PoliticalBeliefManager();
    
    const npc1 = createMockNPC({ id: 'npc-1' });
    npc1.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });
    
    const npc2 = createMockNPC({ id: 'npc-2' });
    npc2.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    const influencer = createMockNPC({ id: 'influencer' });
    influencer.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.9 });

    const highTrust: Relationship = {
      targetId: 'influencer',
      trust: 90,
      respect: 50,
      familiarity: 50,
      attraction: 0,
      type: 'friend',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 10,
      owedFavors: 0,
    };

    const lowTrust: Relationship = {
      targetId: 'influencer',
      trust: 10,
      respect: 50,
      familiarity: 50,
      attraction: 0,
      type: 'acquaintance',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 2,
      owedFavors: 0,
    };

    manager.applySocialInfluence(npc1, [{ npc: influencer, relationship: highTrust }]);
    manager.applySocialInfluence(npc2, [{ npc: influencer, relationship: lowTrust }]);

    const shift1 = npc1.politicalBeliefs.wealthRedistribution - 0.5;
    const shift2 = npc2.politicalBeliefs.wealthRedistribution - 0.5;

    expect(shift1).toBeGreaterThan(shift2);
  });

  test("influence should be weighted by respect", async () => {
    const manager = new PoliticalBeliefManager();
    
    const npc1 = createMockNPC({ id: 'npc-1' });
    npc1.politicalBeliefs = createDefaultPoliticalBeliefs({ regulationSupport: 0.5 });
    
    const npc2 = createMockNPC({ id: 'npc-2' });
    npc2.politicalBeliefs = createDefaultPoliticalBeliefs({ regulationSupport: 0.5 });

    const influencer = createMockNPC({ id: 'influencer' });
    influencer.politicalBeliefs = createDefaultPoliticalBeliefs({ regulationSupport: 0.9 });

    const highRespect: Relationship = {
      targetId: 'influencer',
      trust: 50,
      respect: 90,
      familiarity: 50,
      attraction: 0,
      type: 'mentor',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 10,
      owedFavors: 0,
    };

    const lowRespect: Relationship = {
      targetId: 'influencer',
      trust: 50,
      respect: 10,
      familiarity: 50,
      attraction: 0,
      type: 'acquaintance',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 2,
      owedFavors: 0,
    };

    manager.applySocialInfluence(npc1, [{ npc: influencer, relationship: highRespect }]);
    manager.applySocialInfluence(npc2, [{ npc: influencer, relationship: lowRespect }]);

    const shift1 = npc1.politicalBeliefs.regulationSupport - 0.5;
    const shift2 = npc2.politicalBeliefs.regulationSupport - 0.5;

    expect(shift1).toBeGreaterThan(shift2);
  });

  test("negative trust should reduce or reverse influence", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    const enemy = createMockNPC({ id: 'enemy-1' });
    enemy.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.9 });

    const relationship: Relationship = {
      targetId: 'enemy-1',
      trust: -50,
      respect: 30,
      familiarity: 60,
      attraction: 0,
      type: 'enemy',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 10,
      owedFavors: 0,
    };

    manager.applySocialInfluence(npc, [{ npc: enemy, relationship }]);

    // Enemy advocates for high redistribution, so NPC might resist or move opposite
    expect(npc.politicalBeliefs.wealthRedistribution).toBeLessThanOrEqual(0.5);
  });
});

/**
 * Test Suite: PoliticalBeliefManager - Economic Influence
 */
test.describe("PoliticalBeliefManager - Economic Influence", () => {
  test("wealth gains should decrease redistribution support", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    const before = npc.politicalBeliefs.wealthRedistribution;
    manager.applyEconomicInfluence(npc, 1000); // Gained $1000

    expect(npc.politicalBeliefs.wealthRedistribution).toBeLessThan(before);
  });

  test("wealth losses should increase redistribution support", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    const before = npc.politicalBeliefs.wealthRedistribution;
    manager.applyEconomicInfluence(npc, -1000); // Lost $1000

    expect(npc.politicalBeliefs.wealthRedistribution).toBeGreaterThan(before);
  });

  test("larger wealth changes should have larger effect", async () => {
    const manager = new PoliticalBeliefManager();
    
    const npc1 = createMockNPC({ id: 'npc-1' });
    npc1.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });
    
    const npc2 = createMockNPC({ id: 'npc-2' });
    npc2.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    manager.applyEconomicInfluence(npc1, 10); // Small gain
    manager.applyEconomicInfluence(npc2, 100000); // Very large gain

    const shift1 = 0.5 - npc1.politicalBeliefs.wealthRedistribution;
    const shift2 = 0.5 - npc2.politicalBeliefs.wealthRedistribution;

    // Larger changes should have larger effect (or at least equal due to capping)
    expect(shift2).toBeGreaterThanOrEqual(shift1);
  });

  test("economic influence should be bounded", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    // Massive wealth gain
    manager.applyEconomicInfluence(npc, 1000000);

    expect(npc.politicalBeliefs.wealthRedistribution).toBeGreaterThanOrEqual(0);
    expect(npc.politicalBeliefs.wealthRedistribution).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: PoliticalBeliefManager - Belief Stability
 */
test.describe("PoliticalBeliefManager - Belief Stability", () => {
  test("high neuroticism should make beliefs more susceptible to change", async () => {
    const manager = new PoliticalBeliefManager();
    
    const highNeuroNPC = createMockNPC({
      id: 'high-neuro',
      personality: createDefaultPersonality({ bigFive: { neuroticism: 0.9 } }),
    });
    highNeuroNPC.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });
    
    const lowNeuroNPC = createMockNPC({
      id: 'low-neuro',
      personality: createDefaultPersonality({ bigFive: { neuroticism: 0.1 } }),
    });
    lowNeuroNPC.politicalBeliefs = createDefaultPoliticalBeliefs({ wealthRedistribution: 0.5 });

    // Same economic influence
    manager.applyEconomicInfluence(highNeuroNPC, -1000);
    manager.applyEconomicInfluence(lowNeuroNPC, -1000);

    const shiftHigh = highNeuroNPC.politicalBeliefs.wealthRedistribution - 0.5;
    const shiftLow = lowNeuroNPC.politicalBeliefs.wealthRedistribution - 0.5;

    expect(Math.abs(shiftHigh)).toBeGreaterThan(Math.abs(shiftLow));
  });

  test("high conscientiousness should make beliefs more stable", async () => {
    const manager = new PoliticalBeliefManager();
    
    const highConsNPC = createMockNPC({
      id: 'high-cons',
      personality: createDefaultPersonality({ bigFive: { conscientiousness: 0.9 } }),
    });
    highConsNPC.politicalBeliefs = createDefaultPoliticalBeliefs({ centralAuthority: 0.5 });
    
    const lowConsNPC = createMockNPC({
      id: 'low-cons',
      personality: createDefaultPersonality({ bigFive: { conscientiousness: 0.1 } }),
    });
    lowConsNPC.politicalBeliefs = createDefaultPoliticalBeliefs({ centralAuthority: 0.5 });

    // Same experience
    const experience: EpisodicMemory = {
      id: 'mem-1',
      timestamp: Date.now(),
      location: { x: 5, y: 5 },
      participants: [],
      event: 'Centralized platform crashed',
      emotionalValence: -0.7,
      importance: 7,
      accessCount: 0,
      lastAccessed: Date.now(),
      strength: 1.0,
    };

    manager.updateBeliefFromExperience(highConsNPC, experience);
    manager.updateBeliefFromExperience(lowConsNPC, experience);

    const shiftHigh = 0.5 - highConsNPC.politicalBeliefs.centralAuthority;
    const shiftLow = 0.5 - lowConsNPC.politicalBeliefs.centralAuthority;

    expect(Math.abs(shiftLow)).toBeGreaterThan(Math.abs(shiftHigh));
  });

  test("getBeliefStrength should return strength based on consistency", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ decentralizationPurity: 0.9 });

    // Add influence history showing consistent belief
    manager.addInfluenceToHistory(npc.id, createBeliefInfluence({
      source: 'personality',
      sourceId: 'init',
      belief: 'decentralizationPurity',
      strength: 0.4,
    }));

    const strength = manager.getBeliefStrength(npc, 'decentralizationPurity');

    expect(typeof strength).toBe('number');
    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: PoliticalBeliefManager - Faction Alignment
 */
test.describe("PoliticalBeliefManager - Faction Alignment", () => {
  test("should calculate faction alignment score", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({
      decentralizationPurity: 0.9,
      privacyImportance: 0.9,
      centralAuthority: 0.1,
    });

    const factionIdeology = FACTION_TEMPLATES['privacy_underground'].ideology!;
    const alignment = manager.calculateFactionAlignment(npc, factionIdeology);

    expect(typeof alignment).toBe('number');
    expect(alignment).toBeGreaterThanOrEqual(0);
    expect(alignment).toBeLessThanOrEqual(1);
  });

  test("privacy-focused NPC should align with Privacy Underground", async () => {
    const manager = new PoliticalBeliefManager();
    
    const privacyNPC = createMockNPC();
    privacyNPC.politicalBeliefs = createDefaultPoliticalBeliefs({
      privacyImportance: 0.95,
      centralAuthority: 0.1,
      decentralizationPurity: 0.9,
    });

    const privacyFaction = FACTION_TEMPLATES['privacy_underground'].ideology!;
    const tradfiFaction = FACTION_TEMPLATES['tradfi_heights'].ideology!;

    const privacyAlignment = manager.calculateFactionAlignment(privacyNPC, privacyFaction);
    const tradfiAlignment = manager.calculateFactionAlignment(privacyNPC, tradfiFaction);

    expect(privacyAlignment).toBeGreaterThan(tradfiAlignment);
  });

  test("BTC maxi beliefs should align with Bitcoin Citadel", async () => {
    const manager = new PoliticalBeliefManager();
    
    const btcMaxiNPC = createMockNPC();
    btcMaxiNPC.politicalBeliefs = createDefaultPoliticalBeliefs({
      decentralizationPurity: 0.9,
      centralAuthority: 0.1,
      regulationSupport: 0.2,
    });

    const btcFaction = FACTION_TEMPLATES['bitcoin_citadel'].ideology!;
    const degenFaction = FACTION_TEMPLATES['degen_republic'].ideology!;

    const btcAlignment = manager.calculateFactionAlignment(btcMaxiNPC, btcFaction);
    const degenAlignment = manager.calculateFactionAlignment(btcMaxiNPC, degenFaction);

    expect(btcAlignment).toBeGreaterThan(0.5);
  });

  test("suggestFactionFromBeliefs should return best matching faction", async () => {
    const manager = new PoliticalBeliefManager();
    
    const privacyNPC = createMockNPC();
    privacyNPC.politicalBeliefs = createDefaultPoliticalBeliefs({
      privacyImportance: 0.95,
      centralAuthority: 0.05,
      regulationSupport: 0.1,
    });

    const factions = Object.entries(FACTION_TEMPLATES).map(([id, template]) => ({
      id,
      ideology: template.ideology!,
    }));

    const suggested = manager.suggestFactionFromBeliefs(privacyNPC, factions);

    expect(suggested).toBeDefined();
    expect(typeof suggested!.id).toBe('string');
    expect(typeof suggested!.alignment).toBe('number');
  });

  test("should return null if no factions provided", async () => {
    const manager = new PoliticalBeliefManager();
    const npc = createMockNPC();
    npc.politicalBeliefs = createDefaultPoliticalBeliefs();

    const suggested = manager.suggestFactionFromBeliefs(npc, []);

    expect(suggested).toBeNull();
  });
});

/**
 * Test Suite: Serialization
 */
test.describe("PoliticalBeliefs Serialization", () => {
  test("beliefs should be serializable to JSON", async () => {
    const beliefs = createDefaultPoliticalBeliefs({
      wealthRedistribution: 0.3,
      privacyImportance: 0.8,
    });

    const json = JSON.stringify(beliefs);
    const parsed = JSON.parse(json);

    expect(parsed.wealthRedistribution).toBe(0.3);
    expect(parsed.privacyImportance).toBe(0.8);
  });

  test("influence history should be serializable", async () => {
    const manager = new PoliticalBeliefManager();
    
    manager.addInfluenceToHistory('npc-1', createBeliefInfluence({
      source: 'experience',
      sourceId: 'mem-1',
      belief: 'wealthRedistribution',
      strength: 0.2,
    }));

    const serialized = manager.serialize();
    
    const newManager = new PoliticalBeliefManager();
    newManager.deserialize(serialized);

    const history = newManager.getInfluenceHistory('npc-1');
    expect(history.length).toBe(1);
    expect(history[0].belief).toBe('wealthRedistribution');
  });
});
