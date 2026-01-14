import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Relationship Tracking System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * These tests validate the TitanRelationshipManager class for tracking
 * relationships between the Titan and individual NPCs.
 * 
 * Reference: specs/HERO_PET_SYSTEM.md Section 6.2
 * 
 * The TitanRelationshipManager:
 * - Tracks relationships with individual NPCs
 * - Supports trust, respect, familiarity, and fear metrics
 * - Applies decay over time to relationships
 * - Detects milestone events (first meeting, friend, trusted, etc.)
 * - Serializes/deserializes for persistence
 */

// Import types (these should already exist)
import type { TitanRelationship } from "@/games/isocity/types/titan";

// Import from TitanRelationships (these imports will fail until implementation)
import {
  TitanRelationshipManager,
  createDefaultTitanRelationship,
  clampRelationshipValue,
  getRelationshipSentiment,
  decayRelationship,
  checkForRelationshipEvent,
  TITAN_RELATIONSHIP_DECAY_RATES,
  RELATIONSHIP_MILESTONES,
} from "@/lib/titan/TitanRelationships";
import type { RelationshipEvent } from "@/lib/titan/TitanRelationships";

// Import TitanManager for integration tests
import { TitanManager } from "@/lib/titan";

// ============================================================================
// HELPER FUNCTIONS FOR TESTING
// ============================================================================

/**
 * Reset TitanManager state for test isolation
 */
function resetTitanManager(): void {
  TitanManager.despawnTitan();
  try {
    TitanManager.clearStorage();
  } catch {
    // Expected in Node.js context
  }
}

/**
 * Create a mock relationship for testing
 */
function createMockRelationship(overrides: Partial<TitanRelationship> = {}): TitanRelationship {
  return {
    npcId: "npc-test-1",
    trust: 0,
    respect: 0,
    familiarity: 0,
    fear: 0,
    firstMet: Date.now(),
    lastInteraction: Date.now(),
    interactionCount: 0,
    ...overrides,
  };
}

// ============================================================================
// Test Suite: TitanRelationship Interface
// ============================================================================
test.describe("TitanRelationship Interface", () => {
  test("createDefaultTitanRelationship should create valid relationship", () => {
    const rel = createDefaultTitanRelationship("npc-123");

    expect(rel.npcId).toBe("npc-123");
    expect(rel.trust).toBe(0);
    expect(rel.respect).toBe(0);
    expect(rel.familiarity).toBe(0);
    expect(rel.fear).toBe(0);
    expect(rel.firstMet).toBeGreaterThan(0);
    expect(rel.lastInteraction).toBeGreaterThan(0);
    expect(rel.interactionCount).toBe(0);
  });

  test("clampRelationshipValue should clamp trust to valid range", () => {
    expect(clampRelationshipValue(150, "trust")).toBe(100);
    expect(clampRelationshipValue(-150, "trust")).toBe(-100);
    expect(clampRelationshipValue(50, "trust")).toBe(50);
    expect(clampRelationshipValue(-50, "trust")).toBe(-50);
  });

  test("clampRelationshipValue should clamp respect to valid range", () => {
    expect(clampRelationshipValue(150, "respect")).toBe(100);
    expect(clampRelationshipValue(-150, "respect")).toBe(-100);
    expect(clampRelationshipValue(50, "respect")).toBe(50);
  });

  test("clampRelationshipValue should clamp familiarity to 0-100", () => {
    expect(clampRelationshipValue(150, "familiarity")).toBe(100);
    expect(clampRelationshipValue(-50, "familiarity")).toBe(0);
    expect(clampRelationshipValue(50, "familiarity")).toBe(50);
  });

  test("clampRelationshipValue should clamp fear to 0-100", () => {
    expect(clampRelationshipValue(150, "fear")).toBe(100);
    expect(clampRelationshipValue(-50, "fear")).toBe(0);
    expect(clampRelationshipValue(50, "fear")).toBe(50);
  });
});

// ============================================================================
// Test Suite: TitanRelationshipManager Core Methods
// ============================================================================
test.describe("TitanRelationshipManager Core Methods", () => {
  test("constructor should initialize with empty relationships", () => {
    const manager = new TitanRelationshipManager();

    expect(manager.getAllRelationships()).toHaveLength(0);
  });

  test("constructor should accept initial relationships", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 50 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: -30 }),
    };

    const manager = new TitanRelationshipManager(initial);

    expect(manager.getAllRelationships()).toHaveLength(2);
    expect(manager.getRelationship("npc-1")?.trust).toBe(50);
    expect(manager.getRelationship("npc-2")?.trust).toBe(-30);
  });

  test("getRelationship should return null for unknown NPC", () => {
    const manager = new TitanRelationshipManager();

    expect(manager.getRelationship("unknown-npc")).toBeNull();
  });

  test("getRelationship should return relationship for known NPC", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 50, familiarity: 25 }),
    };
    const manager = new TitanRelationshipManager(initial);

    const rel = manager.getRelationship("npc-1");

    expect(rel).not.toBeNull();
    expect(rel?.trust).toBe(50);
    expect(rel?.familiarity).toBe(25);
  });

  test("updateRelationship should create new relationship if not exists", () => {
    const manager = new TitanRelationshipManager();

    const rel = manager.updateRelationship("npc-new", { trust: 20 });

    expect(rel.npcId).toBe("npc-new");
    expect(rel.trust).toBe(20);
    expect(rel.respect).toBe(0);
    expect(rel.familiarity).toBe(0);
    expect(rel.fear).toBe(0);
  });

  test("updateRelationship should update existing relationship", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 30, respect: 20 }),
    };
    const manager = new TitanRelationshipManager(initial);

    const rel = manager.updateRelationship("npc-1", { trust: 50, fear: 10 });

    expect(rel.trust).toBe(50);
    expect(rel.respect).toBe(20); // Unchanged
    expect(rel.fear).toBe(10);
  });

  test("updateRelationship should clamp values to valid ranges", () => {
    const manager = new TitanRelationshipManager();

    const rel = manager.updateRelationship("npc-1", {
      trust: 200,
      respect: -200,
      familiarity: -50,
      fear: 150,
    });

    expect(rel.trust).toBe(100);
    expect(rel.respect).toBe(-100);
    expect(rel.familiarity).toBe(0);
    expect(rel.fear).toBe(100);
  });

  test("recordInteraction should create relationship if not exists", () => {
    const manager = new TitanRelationshipManager();

    manager.recordInteraction("npc-new");

    const rel = manager.getRelationship("npc-new");
    expect(rel).not.toBeNull();
    expect(rel?.interactionCount).toBe(1);
  });

  test("recordInteraction should increment count and update timestamp", () => {
    const oldTimestamp = Date.now() - 10000;
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({
        npcId: "npc-1",
        interactionCount: 5,
        lastInteraction: oldTimestamp,
      }),
    };
    const manager = new TitanRelationshipManager(initial);

    manager.recordInteraction("npc-1");

    const rel = manager.getRelationship("npc-1");
    expect(rel?.interactionCount).toBe(6);
    expect(rel?.lastInteraction).toBeGreaterThan(oldTimestamp);
  });
});

// ============================================================================
// Test Suite: TitanRelationshipManager Queries
// ============================================================================
test.describe("TitanRelationshipManager Queries", () => {
  test("getAllRelationships should return all relationships", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1" }),
      "npc-2": createMockRelationship({ npcId: "npc-2" }),
      "npc-3": createMockRelationship({ npcId: "npc-3" }),
    };
    const manager = new TitanRelationshipManager(initial);

    const all = manager.getAllRelationships();

    expect(all).toHaveLength(3);
  });

  test("getTopRelationships should return top N by familiarity", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", familiarity: 50 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", familiarity: 80 }),
      "npc-3": createMockRelationship({ npcId: "npc-3", familiarity: 30 }),
      "npc-4": createMockRelationship({ npcId: "npc-4", familiarity: 90 }),
    };
    const manager = new TitanRelationshipManager(initial);

    const top = manager.getTopRelationships(2);

    expect(top).toHaveLength(2);
    expect(top[0].npcId).toBe("npc-4");
    expect(top[1].npcId).toBe("npc-2");
  });

  test("getFriendlyNPCs should return NPCs with positive trust", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 60 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: 30 }),
      "npc-3": createMockRelationship({ npcId: "npc-3", trust: -20 }),
      "npc-4": createMockRelationship({ npcId: "npc-4", trust: 70 }),
    };
    const manager = new TitanRelationshipManager(initial);

    // Default threshold is 50
    const friendly = manager.getFriendlyNPCs();

    expect(friendly).toHaveLength(2);
    expect(friendly).toContain("npc-1");
    expect(friendly).toContain("npc-4");
  });

  test("getFriendlyNPCs should respect custom threshold", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 60 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: 30 }),
      "npc-3": createMockRelationship({ npcId: "npc-3", trust: -20 }),
    };
    const manager = new TitanRelationshipManager(initial);

    const friendly = manager.getFriendlyNPCs(25);

    expect(friendly).toHaveLength(2);
    expect(friendly).toContain("npc-1");
    expect(friendly).toContain("npc-2");
  });

  test("getHostileNPCs should return NPCs with negative trust", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 60 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: -30 }),
      "npc-3": createMockRelationship({ npcId: "npc-3", trust: -60 }),
      "npc-4": createMockRelationship({ npcId: "npc-4", trust: -80 }),
    };
    const manager = new TitanRelationshipManager(initial);

    // Default threshold is -50
    const hostile = manager.getHostileNPCs();

    expect(hostile).toHaveLength(2);
    expect(hostile).toContain("npc-3");
    expect(hostile).toContain("npc-4");
  });

  test("getFearedBy should return NPCs who fear the Titan", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", fear: 60 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", fear: 30 }),
      "npc-3": createMockRelationship({ npcId: "npc-3", fear: 80 }),
      "npc-4": createMockRelationship({ npcId: "npc-4", fear: 10 }),
    };
    const manager = new TitanRelationshipManager(initial);

    // Default threshold is 50
    const feared = manager.getFearedBy();

    expect(feared).toHaveLength(2);
    expect(feared).toContain("npc-1");
    expect(feared).toContain("npc-3");
  });
});

// ============================================================================
// Test Suite: Relationship Decay
// ============================================================================
test.describe("Relationship Decay", () => {
  test("TITAN_RELATIONSHIP_DECAY_RATES should have correct values", () => {
    expect(TITAN_RELATIONSHIP_DECAY_RATES.trust).toBe(0.5);
    expect(TITAN_RELATIONSHIP_DECAY_RATES.respect).toBe(0.3);
    expect(TITAN_RELATIONSHIP_DECAY_RATES.familiarity).toBe(0);
    expect(TITAN_RELATIONSHIP_DECAY_RATES.fear).toBe(1.0);
  });

  test("decayRelationship should decay trust toward zero", () => {
    const rel = createMockRelationship({ trust: 50 });

    const decayed = decayRelationship(rel, 10); // 10 days

    expect(decayed.trust).toBeLessThan(50);
    expect(decayed.trust).toBeGreaterThan(0);
  });

  test("decayRelationship should decay negative trust toward zero", () => {
    const rel = createMockRelationship({ trust: -50 });

    const decayed = decayRelationship(rel, 10);

    expect(decayed.trust).toBeGreaterThan(-50);
    expect(decayed.trust).toBeLessThan(0);
  });

  test("decayRelationship should decay fear faster than trust", () => {
    const rel = createMockRelationship({ trust: 50, fear: 50 });

    const decayed = decayRelationship(rel, 5);

    const trustDelta = Math.abs(rel.trust - decayed.trust);
    const fearDelta = Math.abs(rel.fear - decayed.fear);

    expect(fearDelta).toBeGreaterThan(trustDelta);
  });

  test("decayRelationship should not decay familiarity", () => {
    const rel = createMockRelationship({ familiarity: 80 });

    const decayed = decayRelationship(rel, 30);

    expect(decayed.familiarity).toBe(80);
  });

  test("decayRelationships on manager should decay all relationships", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 60, fear: 40 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: -40, fear: 60 }),
    };
    const manager = new TitanRelationshipManager(initial);

    manager.decayRelationships(10);

    const rel1 = manager.getRelationship("npc-1");
    const rel2 = manager.getRelationship("npc-2");

    expect(rel1?.trust).toBeLessThan(60);
    expect(rel1?.fear).toBeLessThan(40);
    expect(rel2?.trust).toBeGreaterThan(-40);
    expect(rel2?.fear).toBeLessThan(60);
  });
});

// ============================================================================
// Test Suite: Relationship Sentiment
// ============================================================================
test.describe("Relationship Sentiment", () => {
  test("getRelationshipSentiment should return 'hostile' for very negative trust", () => {
    const rel = createMockRelationship({ trust: -80 });

    expect(getRelationshipSentiment(rel)).toBe("hostile");
  });

  test("getRelationshipSentiment should return 'negative' for moderately negative trust", () => {
    const rel = createMockRelationship({ trust: -30 });

    expect(getRelationshipSentiment(rel)).toBe("negative");
  });

  test("getRelationshipSentiment should return 'neutral' for low trust", () => {
    const rel = createMockRelationship({ trust: 10 });

    expect(getRelationshipSentiment(rel)).toBe("neutral");
  });

  test("getRelationshipSentiment should return 'positive' for moderate trust", () => {
    const rel = createMockRelationship({ trust: 40 });

    expect(getRelationshipSentiment(rel)).toBe("positive");
  });

  test("getRelationshipSentiment should return 'friendly' for high trust", () => {
    const rel = createMockRelationship({ trust: 70 });

    expect(getRelationshipSentiment(rel)).toBe("friendly");
  });
});

// ============================================================================
// Test Suite: Relationship Events and Milestones
// ============================================================================
test.describe("Relationship Events and Milestones", () => {
  test("RELATIONSHIP_MILESTONES should have correct values", () => {
    expect(RELATIONSHIP_MILESTONES.first_meeting).toBe(0);
    expect(RELATIONSHIP_MILESTONES.acquaintance).toBe(20);
    expect(RELATIONSHIP_MILESTONES.familiar).toBe(40);
    expect(RELATIONSHIP_MILESTONES.friend).toBe(60);
    expect(RELATIONSHIP_MILESTONES.close_friend).toBe(80);
    expect(RELATIONSHIP_MILESTONES.best_friend).toBe(95);
    expect(RELATIONSHIP_MILESTONES.trusted).toBe(50);
    expect(RELATIONSHIP_MILESTONES.highly_trusted).toBe(80);
    expect(RELATIONSHIP_MILESTONES.feared).toBe(50);
    expect(RELATIONSHIP_MILESTONES.terrified).toBe(80);
  });

  test("checkForRelationshipEvent should detect improved trust", () => {
    const oldRel = createMockRelationship({ npcId: "npc-1", trust: 40 });
    const newRel = createMockRelationship({ npcId: "npc-1", trust: 55 });

    const event = checkForRelationshipEvent(oldRel, newRel);

    expect(event).not.toBeNull();
    expect(event?.type).toBe("milestone");
    expect(event?.metric).toBe("trust");
  });

  test("checkForRelationshipEvent should detect worsened relationship", () => {
    const oldRel = createMockRelationship({ npcId: "npc-1", trust: 30 });
    const newRel = createMockRelationship({ npcId: "npc-1", trust: -20 });

    const event = checkForRelationshipEvent(oldRel, newRel);

    expect(event).not.toBeNull();
    expect(event?.type).toBe("worsened");
    expect(event?.metric).toBe("trust");
  });

  test("checkForRelationshipEvent should detect familiarity milestone", () => {
    const oldRel = createMockRelationship({ npcId: "npc-1", familiarity: 15 });
    const newRel = createMockRelationship({ npcId: "npc-1", familiarity: 25 });

    const event = checkForRelationshipEvent(oldRel, newRel);

    expect(event).not.toBeNull();
    expect(event?.type).toBe("milestone");
    expect(event?.metric).toBe("familiarity");
  });

  test("checkForRelationshipEvent should detect fear milestone", () => {
    const oldRel = createMockRelationship({ npcId: "npc-1", fear: 40 });
    const newRel = createMockRelationship({ npcId: "npc-1", fear: 55 });

    const event = checkForRelationshipEvent(oldRel, newRel);

    expect(event).not.toBeNull();
    expect(event?.type).toBe("milestone");
    expect(event?.metric).toBe("fear");
  });

  test("checkForRelationshipEvent should return null for minor changes", () => {
    const oldRel = createMockRelationship({ npcId: "npc-1", trust: 30 });
    const newRel = createMockRelationship({ npcId: "npc-1", trust: 32 });

    const event = checkForRelationshipEvent(oldRel, newRel);

    expect(event).toBeNull();
  });
});

// ============================================================================
// Test Suite: Serialization
// ============================================================================
test.describe("TitanRelationshipManager Serialization", () => {
  test("toRecord should export all relationships", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 50 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: -30 }),
    };
    const manager = new TitanRelationshipManager(initial);

    const record = manager.toRecord();

    expect(Object.keys(record)).toHaveLength(2);
    expect(record["npc-1"].trust).toBe(50);
    expect(record["npc-2"].trust).toBe(-30);
  });

  test("fromRecord should create manager from record", () => {
    const record: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({ npcId: "npc-1", trust: 50 }),
      "npc-2": createMockRelationship({ npcId: "npc-2", trust: -30 }),
    };

    const manager = TitanRelationshipManager.fromRecord(record);

    expect(manager.getAllRelationships()).toHaveLength(2);
    expect(manager.getRelationship("npc-1")?.trust).toBe(50);
  });

  test("round-trip serialization should preserve data", () => {
    const initial: Record<string, TitanRelationship> = {
      "npc-1": createMockRelationship({
        npcId: "npc-1",
        trust: 50,
        respect: 30,
        familiarity: 60,
        fear: 10,
        interactionCount: 15,
      }),
    };
    const manager = new TitanRelationshipManager(initial);

    const record = manager.toRecord();
    const restored = TitanRelationshipManager.fromRecord(record);

    const rel = restored.getRelationship("npc-1");
    expect(rel?.trust).toBe(50);
    expect(rel?.respect).toBe(30);
    expect(rel?.familiarity).toBe(60);
    expect(rel?.fear).toBe(10);
    expect(rel?.interactionCount).toBe(15);
  });
});

// ============================================================================
// Test Suite: TitanManager Integration
// ============================================================================
test.describe("TitanManager Integration", () => {
  test.beforeEach(() => {
    resetTitanManager();
  });

  test("TitanManager should have getRelationshipManager method", () => {
    expect(typeof TitanManager.getRelationshipManager).toBe("function");
  });

  test("getRelationshipManager should return null when no Titan exists", () => {
    const manager = TitanManager.getRelationshipManager();

    expect(manager).toBeNull();
  });

  test("getRelationshipManager should return manager when Titan exists", () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    const manager = TitanManager.getRelationshipManager();

    expect(manager).not.toBeNull();
    expect(manager).toBeInstanceOf(TitanRelationshipManager);
  });

  test("updateTitanRelationship should update relationship via TitanManager", () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    const rel = TitanManager.updateTitanRelationship("npc-1", { trust: 30 });

    expect(rel).not.toBeNull();
    expect(rel?.trust).toBe(30);
  });

  test("getTitanRelationship should get relationship via TitanManager", () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    TitanManager.updateTitanRelationship("npc-1", { trust: 40, familiarity: 25 });

    const rel = TitanManager.getTitanRelationship("npc-1");

    expect(rel).not.toBeNull();
    expect(rel?.trust).toBe(40);
    expect(rel?.familiarity).toBe(25);
  });

  test("relationships should persist in Titan data", () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    TitanManager.updateTitanRelationship("npc-1", { trust: 50 });
    TitanManager.updateTitanRelationship("npc-2", { trust: -20, fear: 30 });

    const titan = TitanManager.getTitan();

    expect(titan?.relationships).toBeDefined();
    expect(titan?.relationships["npc-1"]).toBeDefined();
    expect(titan?.relationships["npc-1"].trust).toBe(50);
    expect(titan?.relationships["npc-2"].fear).toBe(30);
  });
});

// ============================================================================
// Test Suite: Browser Persistence (requires page context)
// ============================================================================
test.describe("TitanRelationships Browser Persistence", () => {
  const TITAN_STORAGE_KEY = "crypto-city-titan";

  test("relationships should persist to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate((storageKey) => {
      // Create test data with relationships
      const testTitan = {
        species: "doge",
        name: "RelationshipTitan",
        age: 5,
        gridX: 5,
        gridY: 10,
        direction: "south",
        alignment: 0.0,
        currentAppearance: "neutral",
        skills: {
          strength: { level: 1, experience: 0, aptitude: 1.0 },
          speed: { level: 1, experience: 0, aptitude: 1.0 },
          endurance: { level: 1, experience: 0, aptitude: 1.0 },
          intelligence: { level: 1, experience: 0, aptitude: 1.0 },
          awareness: { level: 1, experience: 0, aptitude: 1.0 },
          memory: { level: 1, experience: 0, aptitude: 1.0 },
          charisma: { level: 1, experience: 0, aptitude: 1.0 },
          intimidation: { level: 1, experience: 0, aptitude: 1.0 },
          empathy: { level: 1, experience: 0, aptitude: 1.0 },
          miracles: { level: 1, experience: 0, aptitude: 1.0 },
          stealth: { level: 1, experience: 0, aptitude: 1.0 },
          gathering: { level: 1, experience: 0, aptitude: 1.0 },
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
          currentMood: "neutral",
          moodIntensity: 0.5,
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
        relationships: {
          "npc-friend": {
            npcId: "npc-friend",
            trust: 75,
            respect: 60,
            familiarity: 80,
            fear: 0,
            firstMet: Date.now() - 86400000,
            lastInteraction: Date.now(),
            interactionCount: 20,
          },
          "npc-enemy": {
            npcId: "npc-enemy",
            trust: -50,
            respect: -20,
            familiarity: 40,
            fear: 60,
            firstMet: Date.now() - 172800000,
            lastInteraction: Date.now() - 3600000,
            interactionCount: 5,
          },
        },
      };

      localStorage.setItem(storageKey, JSON.stringify(testTitan));
      const saved = localStorage.getItem(storageKey);
      if (!saved) return { error: "not_saved" };

      const parsed = JSON.parse(saved);
      return {
        hasRelationships: "relationships" in parsed,
        friendTrust: parsed.relationships?.["npc-friend"]?.trust,
        enemyTrust: parsed.relationships?.["npc-enemy"]?.trust,
        friendFamiliarity: parsed.relationships?.["npc-friend"]?.familiarity,
        enemyFear: parsed.relationships?.["npc-enemy"]?.fear,
      };
    }, TITAN_STORAGE_KEY);

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.hasRelationships).toBe(true);
      expect(result.friendTrust).toBe(75);
      expect(result.enemyTrust).toBe(-50);
      expect(result.friendFamiliarity).toBe(80);
      expect(result.enemyFear).toBe(60);
    }
  });
});
