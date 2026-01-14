import { test, expect } from "@playwright/test";

/**
 * NPC Generations System Tests (#194)
 *
 * TDD Phase 1: Tests for the NPC generational system including:
 * - Family formation (partnerships, children)
 * - Trait inheritance from parents
 * - NPC aging and life events
 * - Death and inheritance distribution
 * - Dynasty tracking
 * - Generational wealth
 */

// Import types and classes directly for unit testing
import type {
  Family,
  FamilyRelation,
  Inheritance,
  Dynasty,
  TraitInheritance,
  LifeEvent,
  LifeEventRecord,
} from "@/lib/npc/generations";
import {
  FAMILY_RELATION_TYPES,
  LIFE_EVENT_TYPES,
  DYNASTY_WEALTH_THRESHOLD,
  DYNASTY_GENERATION_REQUIREMENT,
  GENERATION_DESCRIPTIONS,
} from "@/lib/npc/generations";
import { FamilyManager } from "@/lib/npc/FamilyManager";
import type { CryptoNPC } from "@/games/isocity/types/npc";
import { createDefaultPersonality, type NPCPersonality } from "@/lib/npc/personality";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";
import { createDefaultWallet, createDefaultFinances, type NPCWallet } from "@/lib/npc/economy";

/**
 * Helper function to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  const defaultWallet = createDefaultWallet(1000);
  return {
    id: overrides.id || `test-npc-${Math.random().toString(36).substr(2, 9)}`,
    name: overrides.name || "TestNPC",
    walletAddress: "0x1234567890",
    age: overrides.age ?? 30,
    occupation: "trader",
    residence: null,
    workplace: null,
    spriteType: "apple",
    direction: "south",
    gridX: 5,
    gridY: 5,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: null,
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: overrides.personality || createDefaultPersonality(),
    relationships: {},
    wallet: overrides.wallet || defaultWallet,
    finances: createDefaultFinances("trader"),
    ...overrides,
  };
}

/**
 * Test Suite: Generation Types
 */
test.describe("Generation Types", () => {
  test("should define Family interface with all required fields", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 25 });
    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);

    expect(typeof family.id).toBe("string");
    expect(typeof family.founderId).toBe("string");
    expect(family.partnerId === undefined || typeof family.partnerId === "string").toBe(true);
    expect(Array.isArray(family.childrenIds)).toBe(true);
    expect(typeof family.generationCount).toBe("number");
    expect(Array.isArray(family.wealthHistory)).toBe(true);
  });

  test("should define all 6 family relation types", async () => {
    const expectedTypes: FamilyRelation[] = [
      "parent",
      "child",
      "sibling",
      "partner",
      "grandparent",
      "grandchild",
    ];

    expect(FAMILY_RELATION_TYPES.length).toBe(6);
    for (const type of expectedTypes) {
      expect(FAMILY_RELATION_TYPES).toContain(type);
    }
  });

  test("should define all 6 life event types", async () => {
    const expectedTypes: LifeEvent[] = [
      "birth",
      "partnership",
      "separation",
      "death",
      "inheritance",
      "coming_of_age",
    ];

    expect(LIFE_EVENT_TYPES.length).toBe(6);
    for (const type of expectedTypes) {
      expect(LIFE_EVENT_TYPES).toContain(type);
    }
  });

  test("should define Inheritance interface structure", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({
      id: "npc-1",
      age: 70,
      wallet: createDefaultWallet(10000),
    });
    manager.registerNPC(npc1);

    const { inheritance } = manager.processNPCDeath(npc1.id, "old_age");

    if (inheritance) {
      expect(typeof inheritance.id).toBe("string");
      expect(typeof inheritance.deceasedId).toBe("string");
      expect(Array.isArray(inheritance.beneficiaryIds)).toBe(true);
      expect(typeof inheritance.assets).toBe("object");
      expect(typeof inheritance.assets.cash).toBe("number");
      expect(typeof inheritance.assets.tokens).toBe("object");
      expect(Array.isArray(inheritance.assets.property)).toBe(true);
      expect(typeof inheritance.distributedAt).toBe("number");
    }
  });

  test("should define Dynasty interface structure", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({
      id: "dynasty-founder",
      age: 30,
      wallet: createDefaultWallet(100000),
    });
    manager.registerNPC(npc1);

    // Create a family and track as dynasty manually
    const family = manager.createSoloFamily(npc1.id);
    
    // Simulate wealth over generations
    family.wealthHistory = [100000, 150000, 200000];
    family.generationCount = 3;

    const dynasty = manager.trackDynasty(family.id);

    if (dynasty) {
      expect(typeof dynasty.id).toBe("string");
      expect(typeof dynasty.founderName).toBe("string");
      expect(Array.isArray(dynasty.familyIds)).toBe(true);
      expect(typeof dynasty.totalWealth).toBe("number");
      expect(typeof dynasty.influenceScore).toBe("number");
      expect(typeof dynasty.foundedAt).toBe("number");
    }
  });

  test("should define TraitInheritance tracking", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({
      id: "parent-1",
      age: 30,
      personality: createDefaultPersonality({
        bigFive: { openness: 0.8 },
      }),
    });
    const parent2 = createMockNPC({
      id: "parent-2",
      age: 28,
      personality: createDefaultPersonality({
        bigFive: { openness: 0.4 },
      }),
    });

    manager.registerNPC(parent1);
    manager.registerNPC(parent2);

    const traitInheritance = manager.inheritTraits(parent1, parent2);

    expect(Array.isArray(traitInheritance)).toBe(true);
    if (traitInheritance.length > 0) {
      const trait = traitInheritance[0];
      expect(typeof trait.trait).toBe("string");
      expect(typeof trait.parentValue).toBe("number");
      expect(typeof trait.childValue).toBe("number");
      expect(typeof trait.mutationAmount).toBe("number");
    }
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Hitchhiker's Guide Descriptions", () => {
  test("should have descriptions for all life events", async () => {
    for (const eventType of LIFE_EVENT_TYPES) {
      const description = GENERATION_DESCRIPTIONS[eventType];
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(10);
    }
  });

  test("should have description for dynasty formation", async () => {
    expect(GENERATION_DESCRIPTIONS.dynasty).toBeDefined();
    expect(typeof GENERATION_DESCRIPTIONS.dynasty).toBe("string");
  });

  test("should have description for inheritance", async () => {
    expect(GENERATION_DESCRIPTIONS.inheritance).toBeDefined();
    expect(typeof GENERATION_DESCRIPTIONS.inheritance).toBe("string");
  });
});

/**
 * Test Suite: FamilyManager - Partnership Formation
 */
test.describe("FamilyManager - Partnership Formation", () => {
  test("should form partnership between two eligible NPCs", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 27 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);

    expect(family).toBeDefined();
    expect(family.founderId).toBe(npc1.id);
    expect(family.partnerId).toBe(npc2.id);
    expect(family.generationCount).toBe(1);
  });

  test("should reject partnership with underage NPC (< 18)", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 17 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    expect(() => manager.formPartnership(npc1.id, npc2.id)).toThrow();
  });

  test("should reject partnership if NPC already has partner", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 27 });
    const npc3 = createMockNPC({ id: "npc-3", age: 30 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);
    manager.registerNPC(npc3);

    manager.formPartnership(npc1.id, npc2.id);

    expect(() => manager.formPartnership(npc1.id, npc3.id)).toThrow();
  });

  test("should record partnership life event", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 27 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    manager.formPartnership(npc1.id, npc2.id);

    const events = manager.getLifeEvents(npc1.id);
    expect(events.some((e) => e.type === "partnership")).toBe(true);
  });

  test("should not allow self-partnership", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });

    manager.registerNPC(npc1);

    expect(() => manager.formPartnership(npc1.id, npc1.id)).toThrow();
  });
});

/**
 * Test Suite: FamilyManager - Partnership Dissolution
 */
test.describe("FamilyManager - Partnership Dissolution", () => {
  test("should dissolve existing partnership", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 27 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    manager.dissolvePartnership(family.id);

    const currentFamily = manager.getFamily(npc1.id);
    expect(currentFamily?.partnerId).toBeUndefined();
  });

  test("should record separation life event", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 27 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    manager.dissolvePartnership(family.id);

    const events = manager.getLifeEvents(npc1.id);
    expect(events.some((e) => e.type === "separation")).toBe(true);
  });

  test("should allow new partnership after dissolution", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 25 });
    const npc2 = createMockNPC({ id: "npc-2", age: 27 });
    const npc3 = createMockNPC({ id: "npc-3", age: 30 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);
    manager.registerNPC(npc3);

    const family1 = manager.formPartnership(npc1.id, npc2.id);
    manager.dissolvePartnership(family1.id);

    const family2 = manager.formPartnership(npc1.id, npc3.id);
    expect(family2.partnerId).toBe(npc3.id);
  });
});

/**
 * Test Suite: FamilyManager - Child Creation
 */
test.describe("FamilyManager - Child Creation", () => {
  test("should create child NPC for family", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 30 });
    const npc2 = createMockNPC({ id: "parent-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    const child = manager.createChild(family.id);

    expect(child).toBeDefined();
    expect(child.age).toBe(0);
    expect(family.childrenIds).toContain(child.id);
  });

  test("should inherit traits from both parents", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({
      id: "parent-1",
      age: 30,
      personality: createDefaultPersonality({
        bigFive: { openness: 0.9, conscientiousness: 0.2 },
      }),
    });
    const parent2 = createMockNPC({
      id: "parent-2",
      age: 28,
      personality: createDefaultPersonality({
        bigFive: { openness: 0.3, conscientiousness: 0.8 },
      }),
    });

    manager.registerNPC(parent1);
    manager.registerNPC(parent2);

    const family = manager.formPartnership(parent1.id, parent2.id);
    const child = manager.createChild(family.id);

    // Child's openness should be between 0.5 and 0.7 (average ± mutation)
    // Average is 0.6, mutation is -0.1 to +0.1
    expect(child.personality.bigFive.openness).toBeGreaterThanOrEqual(0.4);
    expect(child.personality.bigFive.openness).toBeLessThanOrEqual(0.8);
  });

  test("should record birth life event", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 30 });
    const npc2 = createMockNPC({ id: "parent-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    const child = manager.createChild(family.id);

    const events = manager.getLifeEvents(child.id);
    expect(events.some((e) => e.type === "birth")).toBe(true);
  });

  test("should reject child creation if parent over 45", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 50 });
    const npc2 = createMockNPC({ id: "parent-2", age: 46 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    expect(() => manager.createChild(family.id)).toThrow();
  });

  test("should accept child creation if at least one parent is 18-45", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 50 });
    const npc2 = createMockNPC({ id: "parent-2", age: 35 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    const child = manager.createChild(family.id);

    expect(child).toBeDefined();
  });

  test("should allow naming the child", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 30 });
    const npc2 = createMockNPC({ id: "parent-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    const child = manager.createChild(family.id, "Baby_HODL_Jr");

    expect(child.name).toBe("Baby_HODL_Jr");
  });

  test("should generate name if not provided", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 30 });
    const npc2 = createMockNPC({ id: "parent-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    const child = manager.createChild(family.id);

    expect(child.name).toBeDefined();
    expect(child.name.length).toBeGreaterThan(0);
  });

  test("should increment generation count for child's family", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "parent-1", age: 30 });
    const npc2 = createMockNPC({ id: "parent-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const parentFamily = manager.formPartnership(npc1.id, npc2.id);
    const child = manager.createChild(parentFamily.id);

    // When child creates own family, it will be generation 2
    const childFamily = manager.createSoloFamily(child.id);
    expect(childFamily.generationCount).toBe(2);
  });
});

/**
 * Test Suite: FamilyManager - Trait Inheritance
 */
test.describe("FamilyManager - Trait Inheritance", () => {
  test("should calculate child traits as average of parents plus mutation", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({
      id: "p1",
      personality: createDefaultPersonality({
        bigFive: { openness: 0.8 },
      }),
    });
    const parent2 = createMockNPC({
      id: "p2",
      personality: createDefaultPersonality({
        bigFive: { openness: 0.4 },
      }),
    });

    const traitInheritance = manager.inheritTraits(parent1, parent2);
    const opennessInheritance = traitInheritance.find((t) => t.trait === "openness");

    expect(opennessInheritance).toBeDefined();
    if (opennessInheritance) {
      // Average is 0.6, mutation should be -0.1 to +0.1
      expect(opennessInheritance.parentValue).toBeCloseTo(0.6, 5);
      expect(opennessInheritance.childValue).toBeGreaterThanOrEqual(0.5);
      expect(opennessInheritance.childValue).toBeLessThanOrEqual(0.7);
      expect(Math.abs(opennessInheritance.mutationAmount)).toBeLessThanOrEqual(0.1);
    }
  });

  test("should inherit all Big Five traits", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({ id: "p1" });
    const parent2 = createMockNPC({ id: "p2" });

    const traitInheritance = manager.inheritTraits(parent1, parent2);
    const traitNames = traitInheritance.map((t) => t.trait);

    expect(traitNames).toContain("openness");
    expect(traitNames).toContain("conscientiousness");
    expect(traitNames).toContain("extraversion");
    expect(traitNames).toContain("agreeableness");
    expect(traitNames).toContain("neuroticism");
  });

  test("should inherit crypto traits", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({ id: "p1" });
    const parent2 = createMockNPC({ id: "p2" });

    const traitInheritance = manager.inheritTraits(parent1, parent2);
    const traitNames = traitInheritance.map((t) => t.trait);

    expect(traitNames).toContain("riskTolerance");
    expect(traitNames).toContain("fomo");
    expect(traitNames).toContain("trustInInstitutions");
    expect(traitNames).toContain("technicalKnowledge");
    expect(traitNames).toContain("degenLevel");
  });

  test("should clamp inherited traits to 0-1 range", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({
      id: "p1",
      personality: createDefaultPersonality({
        bigFive: { openness: 0.95 },
      }),
    });
    const parent2 = createMockNPC({
      id: "p2",
      personality: createDefaultPersonality({
        bigFive: { openness: 0.98 },
      }),
    });

    const traitInheritance = manager.inheritTraits(parent1, parent2);
    const opennessInheritance = traitInheritance.find((t) => t.trait === "openness");

    if (opennessInheritance) {
      expect(opennessInheritance.childValue).toBeLessThanOrEqual(1);
      expect(opennessInheritance.childValue).toBeGreaterThanOrEqual(0);
    }
  });
});

/**
 * Test Suite: FamilyManager - Aging System
 */
test.describe("FamilyManager - Aging System", () => {
  test("should age NPC by specified years", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 25 });
    manager.registerNPC(npc);

    manager.ageNPC(npc.id, 5);

    const aged = manager.getNPC(npc.id);
    expect(aged?.age).toBe(30);
  });

  test("should trigger coming_of_age event at 18", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 17 });
    manager.registerNPC(npc);

    manager.ageNPC(npc.id, 1);

    const events = manager.getLifeEvents(npc.id);
    expect(events.some((e) => e.type === "coming_of_age")).toBe(true);
  });

  test("should not trigger duplicate coming_of_age event", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 17 });
    manager.registerNPC(npc);

    manager.ageNPC(npc.id, 1);
    manager.ageNPC(npc.id, 1);

    const events = manager.getLifeEvents(npc.id);
    const comingOfAgeEvents = events.filter((e) => e.type === "coming_of_age");
    expect(comingOfAgeEvents.length).toBe(1);
  });

  test("should trigger death event at old age (80+)", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 79 });
    manager.registerNPC(npc);

    manager.ageNPC(npc.id, 1);

    const events = manager.getLifeEvents(npc.id);
    expect(events.some((e) => e.type === "death")).toBe(true);
  });
});

/**
 * Test Suite: FamilyManager - Death Processing
 */
test.describe("FamilyManager - Death Processing", () => {
  test("should process NPC death with cause", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({
      id: "npc-1",
      age: 70,
      wallet: createDefaultWallet(5000),
    });
    manager.registerNPC(npc);

    const result = manager.processNPCDeath(npc.id, "old_age");

    expect(result.success).toBe(true);
    expect(result.cause).toBe("old_age");
  });

  test("should record death life event", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 70 });
    manager.registerNPC(npc);

    manager.processNPCDeath(npc.id, "old_age");

    const events = manager.getLifeEvents(npc.id);
    expect(events.some((e) => e.type === "death")).toBe(true);
  });

  test("should handle conflict death", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 35 });
    manager.registerNPC(npc);

    const result = manager.processNPCDeath(npc.id, "conflict");

    expect(result.success).toBe(true);
    expect(result.cause).toBe("conflict");
  });

  test("should mark NPC as deceased", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 70 });
    manager.registerNPC(npc);

    manager.processNPCDeath(npc.id, "old_age");

    expect(manager.isDeceased(npc.id)).toBe(true);
  });
});

/**
 * Test Suite: FamilyManager - Inheritance Distribution
 */
test.describe("FamilyManager - Inheritance Distribution", () => {
  test("should distribute inheritance to partner (50%)", async () => {
    const manager = new FamilyManager();
    const deceased = createMockNPC({
      id: "deceased",
      age: 70,
      wallet: createDefaultWallet(10000),
    });
    const partner = createMockNPC({
      id: "partner",
      age: 68,
      wallet: createDefaultWallet(1000),
    });

    manager.registerNPC(deceased);
    manager.registerNPC(partner);

    const family = manager.formPartnership(deceased.id, partner.id);
    const result = manager.processNPCDeath(deceased.id, "old_age");
    manager.distributeInheritance(deceased.id);

    const partnerNPC = manager.getNPC(partner.id);
    // Partner should get 50% of 10000 = 5000
    expect(partnerNPC?.wallet?.cash).toBeGreaterThanOrEqual(5000);
  });

  test("should distribute remainder to children equally", async () => {
    const manager = new FamilyManager();
    const deceased = createMockNPC({
      id: "deceased",
      age: 70,
      wallet: createDefaultWallet(10000),
    });
    const partner = createMockNPC({
      id: "partner",
      age: 68,
      wallet: createDefaultWallet(0),
    });
    const child1 = createMockNPC({
      id: "child1",
      age: 40,
      wallet: createDefaultWallet(0),
    });
    const child2 = createMockNPC({
      id: "child2",
      age: 38,
      wallet: createDefaultWallet(0),
    });

    manager.registerNPC(deceased);
    manager.registerNPC(partner);
    manager.registerNPC(child1);
    manager.registerNPC(child2);

    const family = manager.formPartnership(deceased.id, partner.id);
    family.childrenIds.push(child1.id, child2.id);

    manager.processNPCDeath(deceased.id, "old_age");
    manager.distributeInheritance(deceased.id);

    const child1NPC = manager.getNPC(child1.id);
    const child2NPC = manager.getNPC(child2.id);

    // Children split remaining 50% = 2500 each
    expect(child1NPC?.wallet?.cash).toBeGreaterThanOrEqual(2500);
    expect(child2NPC?.wallet?.cash).toBeGreaterThanOrEqual(2500);
  });

  test("should give all to children if no partner", async () => {
    const manager = new FamilyManager();
    const deceased = createMockNPC({
      id: "deceased",
      age: 70,
      wallet: createDefaultWallet(10000),
    });
    const child = createMockNPC({
      id: "child",
      age: 40,
      wallet: createDefaultWallet(0),
    });

    manager.registerNPC(deceased);
    manager.registerNPC(child);

    const family = manager.createSoloFamily(deceased.id);
    family.childrenIds.push(child.id);

    manager.processNPCDeath(deceased.id, "old_age");
    manager.distributeInheritance(deceased.id);

    const childNPC = manager.getNPC(child.id);
    expect(childNPC?.wallet?.cash).toBe(10000);
  });

  test("should record inheritance life event", async () => {
    const manager = new FamilyManager();
    const deceased = createMockNPC({
      id: "deceased",
      age: 70,
      wallet: createDefaultWallet(10000),
    });
    const child = createMockNPC({
      id: "child",
      age: 40,
      wallet: createDefaultWallet(0),
    });

    manager.registerNPC(deceased);
    manager.registerNPC(child);

    const family = manager.createSoloFamily(deceased.id);
    family.childrenIds.push(child.id);

    manager.processNPCDeath(deceased.id, "old_age");
    manager.distributeInheritance(deceased.id);

    const events = manager.getLifeEvents(child.id);
    expect(events.some((e) => e.type === "inheritance")).toBe(true);
  });

  test("should include token holdings in inheritance", async () => {
    const manager = new FamilyManager();
    const deceasedWallet = createDefaultWallet(1000);
    deceasedWallet.holdings = { BTC: 1.5, ETH: 10 };

    const deceased = createMockNPC({
      id: "deceased",
      age: 70,
      wallet: deceasedWallet,
    });
    const child = createMockNPC({
      id: "child",
      age: 40,
      wallet: createDefaultWallet(0),
    });

    manager.registerNPC(deceased);
    manager.registerNPC(child);

    const family = manager.createSoloFamily(deceased.id);
    family.childrenIds.push(child.id);

    manager.processNPCDeath(deceased.id, "old_age");
    manager.distributeInheritance(deceased.id);

    const childNPC = manager.getNPC(child.id);
    expect(childNPC?.wallet?.holdings?.BTC).toBe(1.5);
    expect(childNPC?.wallet?.holdings?.ETH).toBe(10);
  });
});

/**
 * Test Suite: FamilyManager - Family Queries
 */
test.describe("FamilyManager - Family Queries", () => {
  test("should get family for NPC", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 30 });
    const npc2 = createMockNPC({ id: "npc-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    manager.formPartnership(npc1.id, npc2.id);

    const family = manager.getFamily(npc1.id);
    expect(family).toBeDefined();
    expect(family?.founderId).toBe(npc1.id);
  });

  test("should return null for NPC without family", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 30 });
    manager.registerNPC(npc);

    const family = manager.getFamily(npc.id);
    expect(family).toBeNull();
  });

  test("should get family tree for multiple generations", async () => {
    const manager = new FamilyManager();

    // Generation 1
    const grandparent1 = createMockNPC({ id: "gp1", age: 70 });
    const grandparent2 = createMockNPC({ id: "gp2", age: 68 });
    manager.registerNPC(grandparent1);
    manager.registerNPC(grandparent2);
    const gpFamily = manager.formPartnership(grandparent1.id, grandparent2.id);

    // Generation 2 (create manually as children are already adults)
    const parent = createMockNPC({ id: "p1", age: 40 });
    manager.registerNPC(parent);
    gpFamily.childrenIds.push(parent.id);
    manager.setParentFamily(parent.id, gpFamily.id);

    const tree = manager.getFamilyTree(parent.id, 2);

    expect(tree).toBeDefined();
    expect(tree.ancestors.length).toBeGreaterThan(0);
  });

  test("should get siblings", async () => {
    const manager = new FamilyManager();

    const parent1 = createMockNPC({ id: "p1", age: 45 });
    const parent2 = createMockNPC({ id: "p2", age: 43 });
    manager.registerNPC(parent1);
    manager.registerNPC(parent2);

    const family = manager.formPartnership(parent1.id, parent2.id);

    // Create siblings
    const child1 = createMockNPC({ id: "c1", age: 20 });
    const child2 = createMockNPC({ id: "c2", age: 18 });
    manager.registerNPC(child1);
    manager.registerNPC(child2);
    family.childrenIds.push(child1.id, child2.id);
    manager.setParentFamily(child1.id, family.id);
    manager.setParentFamily(child2.id, family.id);

    const siblings = manager.getSiblings(child1.id);
    expect(siblings).toContain(child2.id);
    expect(siblings).not.toContain(child1.id);
  });

  test("should get relation type between NPCs", async () => {
    const manager = new FamilyManager();

    const parent = createMockNPC({ id: "parent", age: 45 });
    const child = createMockNPC({ id: "child", age: 20 });
    manager.registerNPC(parent);
    manager.registerNPC(child);

    const family = manager.createSoloFamily(parent.id);
    family.childrenIds.push(child.id);
    manager.setParentFamily(child.id, family.id);

    expect(manager.getRelation(parent.id, child.id)).toBe("parent");
    expect(manager.getRelation(child.id, parent.id)).toBe("child");
  });
});

/**
 * Test Suite: FamilyManager - Dynasty Tracking
 */
test.describe("FamilyManager - Dynasty Tracking", () => {
  test("should not form dynasty with insufficient wealth", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({
      id: "npc-1",
      wallet: createDefaultWallet(1000),
    });
    manager.registerNPC(npc);

    const family = manager.createSoloFamily(npc.id);
    family.generationCount = 3;
    family.wealthHistory = [1000, 1000, 1000];

    const dynasty = manager.trackDynasty(family.id);
    expect(dynasty).toBeNull();
  });

  test("should not form dynasty with insufficient generations", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({
      id: "npc-1",
      wallet: createDefaultWallet(100000),
    });
    manager.registerNPC(npc);

    const family = manager.createSoloFamily(npc.id);
    family.generationCount = 2;
    family.wealthHistory = [100000, 100000];

    const dynasty = manager.trackDynasty(family.id);
    expect(dynasty).toBeNull();
  });

  test("should form dynasty with wealth threshold met for 3+ generations", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({
      id: "npc-1",
      name: "Dynasty_Founder",
      wallet: createDefaultWallet(100000),
    });
    manager.registerNPC(npc);

    const family = manager.createSoloFamily(npc.id);
    family.generationCount = 3;
    family.wealthHistory = [100000, 150000, 200000];

    const dynasty = manager.trackDynasty(family.id);
    expect(dynasty).toBeDefined();
    expect(dynasty?.founderName).toBe("Dynasty_Founder");
  });

  test("should calculate dynasty influence score", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({
      id: "npc-1",
      wallet: createDefaultWallet(100000),
    });
    manager.registerNPC(npc);

    const family = manager.createSoloFamily(npc.id);
    family.generationCount = 3;
    family.wealthHistory = [100000, 150000, 200000];

    const dynasty = manager.trackDynasty(family.id);
    expect(dynasty?.influenceScore).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: FamilyManager - Generational Wealth
 */
test.describe("FamilyManager - Generational Wealth", () => {
  test("should track wealth history over generations", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({
      id: "npc-1",
      wallet: createDefaultWallet(10000),
    });
    manager.registerNPC(npc);

    const family = manager.createSoloFamily(npc.id);
    manager.recordGenerationalWealth(family.id);

    expect(family.wealthHistory.length).toBe(1);
    expect(family.wealthHistory[0]).toBe(10000);
  });

  test("should calculate total generational wealth for family", async () => {
    const manager = new FamilyManager();
    const founder = createMockNPC({
      id: "founder",
      wallet: createDefaultWallet(5000),
    });
    const partner = createMockNPC({
      id: "partner",
      wallet: createDefaultWallet(3000),
    });
    const child = createMockNPC({
      id: "child",
      wallet: createDefaultWallet(2000),
    });

    manager.registerNPC(founder);
    manager.registerNPC(partner);
    manager.registerNPC(child);

    const family = manager.formPartnership(founder.id, partner.id);
    family.childrenIds.push(child.id);

    const totalWealth = manager.getGenerationalWealth(family.id);
    expect(totalWealth).toBe(10000);
  });

  test("should return 0 wealth for unknown family", async () => {
    const manager = new FamilyManager();
    const totalWealth = manager.getGenerationalWealth("unknown-family");
    expect(totalWealth).toBe(0);
  });
});

/**
 * Test Suite: Edge Cases
 */
test.describe("Edge Cases", () => {
  test("should handle orphan NPC (no parents)", async () => {
    const manager = new FamilyManager();
    const orphan = createMockNPC({ id: "orphan", age: 20 });
    manager.registerNPC(orphan);

    const parents = manager.getParents(orphan.id);
    expect(parents.length).toBe(0);
  });

  test("should handle NPC with deceased partner", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 70 });
    const npc2 = createMockNPC({ id: "npc-2", age: 70 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);

    const family = manager.formPartnership(npc1.id, npc2.id);
    manager.processNPCDeath(npc2.id, "old_age");

    // Should be able to form new partnership
    const npc3 = createMockNPC({ id: "npc-3", age: 65 });
    manager.registerNPC(npc3);

    const newFamily = manager.formPartnership(npc1.id, npc3.id);
    expect(newFamily.partnerId).toBe(npc3.id);
  });

  test("should handle multiple children with same parents", async () => {
    const manager = new FamilyManager();
    const parent1 = createMockNPC({ id: "p1", age: 30 });
    const parent2 = createMockNPC({ id: "p2", age: 28 });

    manager.registerNPC(parent1);
    manager.registerNPC(parent2);

    const family = manager.formPartnership(parent1.id, parent2.id);

    const child1 = manager.createChild(family.id, "Child_1");
    const child2 = manager.createChild(family.id, "Child_2");
    const child3 = manager.createChild(family.id, "Child_3");

    expect(family.childrenIds.length).toBe(3);
    expect(family.childrenIds).toContain(child1.id);
    expect(family.childrenIds).toContain(child2.id);
    expect(family.childrenIds).toContain(child3.id);
  });

  test("should not allow registering same NPC twice", async () => {
    const manager = new FamilyManager();
    const npc = createMockNPC({ id: "npc-1", age: 30 });

    manager.registerNPC(npc);
    expect(() => manager.registerNPC(npc)).toThrow();
  });

  test("should clear all family data on reset", async () => {
    const manager = new FamilyManager();
    const npc1 = createMockNPC({ id: "npc-1", age: 30 });
    const npc2 = createMockNPC({ id: "npc-2", age: 28 });

    manager.registerNPC(npc1);
    manager.registerNPC(npc2);
    manager.formPartnership(npc1.id, npc2.id);

    manager.clear();

    expect(manager.getFamily(npc1.id)).toBeNull();
    expect(manager.getAllFamilies().length).toBe(0);
  });
});
