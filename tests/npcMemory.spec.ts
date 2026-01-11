import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Memory System (Issue #102)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements Stanford Generative Agents-style memory system with episodic,
 * semantic, and procedural memory.
 */

// Import the types and functions we're going to implement
// These imports will fail initially - that's expected in TDD!
import type {
  EpisodicMemory,
  SemanticMemory,
  ProceduralMemory,
  WorkingMemory,
  NPCMemory,
} from "@/lib/npc/memory";
import {
  MEMORY_DESCRIPTIONS,
  createDefaultMemory,
  createEpisodicMemory,
  createSemanticMemory,
  createProceduralMemory,
} from "@/lib/npc/memory";
import { MemoryManager } from "@/lib/npc/MemoryManager";
import type { CryptoNPC } from "@/games/isocity/types/npc";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createInitialMovement } from "@/lib/npc/movement";
import { createDefaultPersonality } from "@/lib/npc/personality";

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: "npc_test_001",
    name: "TestNPC",
    walletAddress: "0x1234567890abcdef",
    age: 30,
    occupation: "trader",
    residence: "building_001",
    workplace: "building_002",
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
    personality: createDefaultPersonality(),
    ...overrides,
  };
}

/**
 * Test Suite: EpisodicMemory Interface
 * Tests specific event memories
 */
test.describe("EpisodicMemory Interface", () => {
  test("should have correct properties for event memory", async () => {
    const memory: EpisodicMemory = {
      id: "mem_001",
      timestamp: 1000,
      location: { x: 10, y: 20 },
      participants: ["npc_001", "npc_002"],
      event: "Had a conversation about Bitcoin with Alice at the DEX.",
      emotionalValence: 0.7,
      importance: 7,
      accessCount: 0,
      lastAccessed: 1000,
      strength: 1.0,
    };

    expect(memory.id).toBe("mem_001");
    expect(memory.timestamp).toBe(1000);
    expect(memory.location).toEqual({ x: 10, y: 20 });
    expect(memory.participants).toContain("npc_001");
    expect(memory.participants).toContain("npc_002");
    expect(memory.event).toContain("Bitcoin");
    expect(memory.emotionalValence).toBe(0.7);
    expect(memory.importance).toBe(7);
    expect(memory.accessCount).toBe(0);
    expect(memory.lastAccessed).toBe(1000);
    expect(memory.strength).toBe(1.0);
  });

  test("emotionalValence should be between -1 and 1", async () => {
    const positiveMemory: EpisodicMemory = {
      id: "mem_positive",
      timestamp: 1000,
      location: { x: 0, y: 0 },
      participants: [],
      event: "Made a great trade!",
      emotionalValence: 1.0,
      importance: 5,
      accessCount: 0,
      lastAccessed: 1000,
      strength: 1.0,
    };

    const negativeMemory: EpisodicMemory = {
      id: "mem_negative",
      timestamp: 1000,
      location: { x: 0, y: 0 },
      participants: [],
      event: "Got rugged...",
      emotionalValence: -1.0,
      importance: 8,
      accessCount: 0,
      lastAccessed: 1000,
      strength: 1.0,
    };

    expect(positiveMemory.emotionalValence).toBeLessThanOrEqual(1);
    expect(positiveMemory.emotionalValence).toBeGreaterThanOrEqual(-1);
    expect(negativeMemory.emotionalValence).toBeLessThanOrEqual(1);
    expect(negativeMemory.emotionalValence).toBeGreaterThanOrEqual(-1);
  });

  test("importance should be between 1 and 10", async () => {
    const lowImportance: EpisodicMemory = {
      id: "mem_low",
      timestamp: 1000,
      location: { x: 0, y: 0 },
      participants: [],
      event: "Walked past a building.",
      emotionalValence: 0,
      importance: 1,
      accessCount: 0,
      lastAccessed: 1000,
      strength: 1.0,
    };

    const highImportance: EpisodicMemory = {
      id: "mem_high",
      timestamp: 1000,
      location: { x: 0, y: 0 },
      participants: [],
      event: "Witnessed a major rug pull!",
      emotionalValence: -0.9,
      importance: 10,
      accessCount: 0,
      lastAccessed: 1000,
      strength: 1.0,
    };

    expect(lowImportance.importance).toBeGreaterThanOrEqual(1);
    expect(lowImportance.importance).toBeLessThanOrEqual(10);
    expect(highImportance.importance).toBeGreaterThanOrEqual(1);
    expect(highImportance.importance).toBeLessThanOrEqual(10);
  });

  test("createEpisodicMemory should generate ID and set defaults", async () => {
    const memory = createEpisodicMemory({
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: ["npc_001"],
      event: "Bought coffee",
      emotionalValence: 0.2,
      importance: 3,
    });

    expect(memory.id).toBeDefined();
    expect(memory.id).toMatch(/^mem_ep_/);
    expect(memory.accessCount).toBe(0);
    expect(memory.lastAccessed).toBe(1000);
    expect(memory.strength).toBe(1.0);
  });
});

/**
 * Test Suite: SemanticMemory Interface
 * Tests facts and knowledge about the world
 */
test.describe("SemanticMemory Interface", () => {
  test("should have correct properties for fact memory", async () => {
    const memory: SemanticMemory = {
      id: "sem_001",
      subject: "Bob",
      predicate: "works_at",
      object: "DEX_Exchange",
      confidence: 0.9,
      source: "observation",
      timestamp: 1000,
    };

    expect(memory.id).toBe("sem_001");
    expect(memory.subject).toBe("Bob");
    expect(memory.predicate).toBe("works_at");
    expect(memory.object).toBe("DEX_Exchange");
    expect(memory.confidence).toBe(0.9);
    expect(memory.source).toBe("observation");
    expect(memory.timestamp).toBe(1000);
  });

  test("source should be observation, told, or inference", async () => {
    const observedFact: SemanticMemory = {
      id: "sem_observed",
      subject: "Alice",
      predicate: "owns",
      object: "NFT_Gallery",
      confidence: 1.0,
      source: "observation",
      timestamp: 1000,
    };

    const toldFact: SemanticMemory = {
      id: "sem_told",
      subject: "Charlie",
      predicate: "likes",
      object: "Ethereum",
      confidence: 0.7,
      source: "told",
      timestamp: 1000,
    };

    const inferredFact: SemanticMemory = {
      id: "sem_inferred",
      subject: "Dave",
      predicate: "is_friends_with",
      object: "Eve",
      confidence: 0.5,
      source: "inference",
      timestamp: 1000,
    };

    expect(["observation", "told", "inference"]).toContain(observedFact.source);
    expect(["observation", "told", "inference"]).toContain(toldFact.source);
    expect(["observation", "told", "inference"]).toContain(inferredFact.source);
  });

  test("confidence should be between 0 and 1", async () => {
    const highConfidence: SemanticMemory = {
      id: "sem_high",
      subject: "Frank",
      predicate: "trades",
      object: "Bitcoin",
      confidence: 1.0,
      source: "observation",
      timestamp: 1000,
    };

    const lowConfidence: SemanticMemory = {
      id: "sem_low",
      subject: "Grace",
      predicate: "might_like",
      object: "Dogecoin",
      confidence: 0.2,
      source: "inference",
      timestamp: 1000,
    };

    expect(highConfidence.confidence).toBeGreaterThanOrEqual(0);
    expect(highConfidence.confidence).toBeLessThanOrEqual(1);
    expect(lowConfidence.confidence).toBeGreaterThanOrEqual(0);
    expect(lowConfidence.confidence).toBeLessThanOrEqual(1);
  });

  test("createSemanticMemory should generate ID and timestamp", async () => {
    const memory = createSemanticMemory({
      subject: "NPC_001",
      predicate: "works_at",
      object: "Mining_Facility",
      confidence: 0.95,
      source: "observation",
    });

    expect(memory.id).toBeDefined();
    expect(memory.id).toMatch(/^mem_sem_/);
    expect(memory.timestamp).toBeDefined();
    expect(memory.timestamp).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: ProceduralMemory Interface
 * Tests skills and learned behaviors
 */
test.describe("ProceduralMemory Interface", () => {
  test("should have correct properties for skill memory", async () => {
    const memory: ProceduralMemory = {
      skill: "chart_reading",
      proficiency: 0.7,
      lastPracticed: 1000,
    };

    expect(memory.skill).toBe("chart_reading");
    expect(memory.proficiency).toBe(0.7);
    expect(memory.lastPracticed).toBe(1000);
  });

  test("proficiency should be between 0 and 1", async () => {
    const novice: ProceduralMemory = {
      skill: "trading",
      proficiency: 0.1,
      lastPracticed: 1000,
    };

    const expert: ProceduralMemory = {
      skill: "mining",
      proficiency: 0.95,
      lastPracticed: 1000,
    };

    expect(novice.proficiency).toBeGreaterThanOrEqual(0);
    expect(novice.proficiency).toBeLessThanOrEqual(1);
    expect(expert.proficiency).toBeGreaterThanOrEqual(0);
    expect(expert.proficiency).toBeLessThanOrEqual(1);
  });

  test("createProceduralMemory should set defaults", async () => {
    const memory = createProceduralMemory({
      skill: "yield_farming",
    });

    expect(memory.skill).toBe("yield_farming");
    expect(memory.proficiency).toBe(0);
    expect(memory.lastPracticed).toBeDefined();
  });
});

/**
 * Test Suite: WorkingMemory Interface
 * Tests current context and short-term memory
 */
test.describe("WorkingMemory Interface", () => {
  test("should have correct properties", async () => {
    const workingMemory: WorkingMemory = {
      recentEvents: [
        "Entered the DEX building",
        "Started a trade",
        "Met Alice",
      ],
      currentGoal: "Complete a successful trade",
      currentContext: "Trading floor at the DEX",
    };

    expect(workingMemory.recentEvents).toHaveLength(3);
    expect(workingMemory.currentGoal).toBe("Complete a successful trade");
    expect(workingMemory.currentContext).toBe("Trading floor at the DEX");
  });

  test("recentEvents should be limited to 10 items", async () => {
    const workingMemory: WorkingMemory = {
      recentEvents: Array(10).fill("Event"),
      currentGoal: null,
      currentContext: "",
    };

    expect(workingMemory.recentEvents.length).toBeLessThanOrEqual(10);
  });

  test("currentGoal can be null", async () => {
    const workingMemory: WorkingMemory = {
      recentEvents: [],
      currentGoal: null,
      currentContext: "Idle in the park",
    };

    expect(workingMemory.currentGoal).toBeNull();
  });
});

/**
 * Test Suite: NPCMemory Structure
 * Tests the full memory system
 */
test.describe("NPCMemory Structure", () => {
  test("createDefaultMemory should return all memory types", async () => {
    const memory = createDefaultMemory();

    expect(memory.episodic).toBeDefined();
    expect(Array.isArray(memory.episodic)).toBe(true);
    expect(memory.semantic).toBeDefined();
    expect(Array.isArray(memory.semantic)).toBe(true);
    expect(memory.procedural).toBeDefined();
    expect(Array.isArray(memory.procedural)).toBe(true);
    expect(memory.working).toBeDefined();
  });

  test("createDefaultMemory should initialize with empty arrays", async () => {
    const memory = createDefaultMemory();

    expect(memory.episodic).toHaveLength(0);
    expect(memory.semantic).toHaveLength(0);
    expect(memory.procedural).toHaveLength(0);
    expect(memory.working.recentEvents).toHaveLength(0);
    expect(memory.working.currentGoal).toBeNull();
    expect(memory.working.currentContext).toBe("");
  });
});

/**
 * Test Suite: MemoryManager - addEpisodicMemory
 * Tests adding event memories
 */
test.describe("MemoryManager - addEpisodicMemory", () => {
  test("should add an episodic memory to the NPC", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: ["npc_002"],
      event: "Had lunch with Bob",
      emotionalValence: 0.5,
      importance: 5,
    });

    expect(npc.memory.episodic).toHaveLength(1);
    expect(npc.memory.episodic[0].event).toBe("Had lunch with Bob");
  });

  test("should auto-generate ID, accessCount, lastAccessed, and strength", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Walked to the park",
      emotionalValence: 0.1,
      importance: 2,
    });

    const memory = npc.memory.episodic[0];
    expect(memory.id).toBeDefined();
    expect(memory.id).toMatch(/^mem_ep_/);
    expect(memory.accessCount).toBe(0);
    expect(memory.lastAccessed).toBe(1000);
    expect(memory.strength).toBe(1.0);
  });

  test("should add multiple memories", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Event 1",
      emotionalValence: 0,
      importance: 3,
    });

    manager.addEpisodicMemory(npc, {
      timestamp: 1100,
      location: { x: 6, y: 11 },
      participants: [],
      event: "Event 2",
      emotionalValence: 0.2,
      importance: 4,
    });

    expect(npc.memory.episodic).toHaveLength(2);
  });
});

/**
 * Test Suite: MemoryManager - addSemanticMemory
 * Tests adding fact memories
 */
test.describe("MemoryManager - addSemanticMemory", () => {
  test("should add a semantic memory to the NPC", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addSemanticMemory(npc, {
      subject: "Alice",
      predicate: "works_at",
      object: "DEX_Exchange",
      confidence: 0.9,
      source: "observation",
    });

    expect(npc.memory.semantic).toHaveLength(1);
    expect(npc.memory.semantic[0].subject).toBe("Alice");
  });

  test("should auto-generate ID and timestamp", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addSemanticMemory(npc, {
      subject: "Bob",
      predicate: "likes",
      object: "Bitcoin",
      confidence: 0.8,
      source: "told",
    });

    const memory = npc.memory.semantic[0];
    expect(memory.id).toBeDefined();
    expect(memory.id).toMatch(/^mem_sem_/);
    expect(memory.timestamp).toBeDefined();
  });

  test("should update existing semantic memory with same subject-predicate", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addSemanticMemory(npc, {
      subject: "Charlie",
      predicate: "works_at",
      object: "Mining_Facility",
      confidence: 0.7,
      source: "told",
    });

    manager.addSemanticMemory(npc, {
      subject: "Charlie",
      predicate: "works_at",
      object: "NFT_Gallery",
      confidence: 0.9,
      source: "observation",
    });

    // Should update, not add duplicate
    expect(npc.memory.semantic).toHaveLength(1);
    expect(npc.memory.semantic[0].object).toBe("NFT_Gallery");
    expect(npc.memory.semantic[0].confidence).toBe(0.9);
  });
});

/**
 * Test Suite: MemoryManager - decayMemories
 * Tests memory decay over time
 */
test.describe("MemoryManager - decayMemories", () => {
  test("should decay episodic memory strength over time", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Old memory",
      emotionalValence: 0,
      importance: 5,
    });

    const initialStrength = npc.memory.episodic[0].strength;

    manager.decayMemories(npc, 1); // 1 game day passed

    expect(npc.memory.episodic[0].strength).toBeLessThan(initialStrength);
  });

  test("should decay more with more time passed", async () => {
    const manager = new MemoryManager();
    const npc1 = createMockNPC({ id: "npc_1" });
    const npc2 = createMockNPC({ id: "npc_2" });

    const memoryData = {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [] as string[],
      event: "Test memory",
      emotionalValence: 0,
      importance: 5,
    };

    manager.addEpisodicMemory(npc1, memoryData);
    manager.addEpisodicMemory(npc2, memoryData);

    manager.decayMemories(npc1, 1); // 1 day
    manager.decayMemories(npc2, 7); // 7 days

    expect(npc2.memory.episodic[0].strength).toBeLessThan(
      npc1.memory.episodic[0].strength
    );
  });

  test("should not decay below 0", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Very old memory",
      emotionalValence: 0,
      importance: 1,
    });

    manager.decayMemories(npc, 365); // 1 year

    expect(npc.memory.episodic[0].strength).toBeGreaterThanOrEqual(0);
  });

  test("important memories should decay slower", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Unimportant event",
      emotionalValence: 0,
      importance: 1,
    });

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Important event",
      emotionalValence: 0,
      importance: 10,
    });

    manager.decayMemories(npc, 7);

    const unimportantMemory = npc.memory.episodic[0];
    const importantMemory = npc.memory.episodic[1];

    expect(importantMemory.strength).toBeGreaterThan(unimportantMemory.strength);
  });

  test("emotional memories should decay slower", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Neutral event",
      emotionalValence: 0,
      importance: 5,
    });

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Emotional event",
      emotionalValence: 0.9,
      importance: 5,
    });

    manager.decayMemories(npc, 7);

    const neutralMemory = npc.memory.episodic[0];
    const emotionalMemory = npc.memory.episodic[1];

    expect(emotionalMemory.strength).toBeGreaterThan(neutralMemory.strength);
  });
});

/**
 * Test Suite: MemoryManager - retrieveMemories
 * Tests memory retrieval with relevance scoring
 */
test.describe("MemoryManager - retrieveMemories", () => {
  test("should retrieve memories matching a query", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: ["Alice"],
      event: "Had coffee with Alice at the cafe",
      emotionalValence: 0.3,
      importance: 4,
    });

    manager.addEpisodicMemory(npc, {
      timestamp: 1100,
      location: { x: 10, y: 20 },
      participants: ["Bob"],
      event: "Traded Bitcoin with Bob at the DEX",
      emotionalValence: 0.5,
      importance: 6,
    });

    const coffeeMemories = manager.retrieveMemories(npc, "coffee");

    expect(coffeeMemories).toHaveLength(1);
    expect(coffeeMemories[0].event).toContain("coffee");
  });

  test("should return memories sorted by relevance", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    // Add multiple memories about Alice
    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: ["Alice"],
      event: "Met Alice briefly",
      emotionalValence: 0.1,
      importance: 2,
    });

    manager.addEpisodicMemory(npc, {
      timestamp: 1100,
      location: { x: 10, y: 20 },
      participants: ["Alice"],
      event: "Had an amazing conversation with Alice about crypto",
      emotionalValence: 0.8,
      importance: 8,
    });

    const memories = manager.retrieveMemories(npc, "Alice");

    // More important/emotional memory should come first
    expect(memories[0].importance).toBeGreaterThanOrEqual(memories[1].importance);
  });

  test("should respect limit parameter", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    // Add 5 memories
    for (let i = 0; i < 5; i++) {
      manager.addEpisodicMemory(npc, {
        timestamp: 1000 + i * 100,
        location: { x: 5, y: 10 },
        participants: [],
        event: `Event ${i} about trading`,
        emotionalValence: 0,
        importance: 5,
      });
    }

    const memories = manager.retrieveMemories(npc, "trading", 3);

    expect(memories).toHaveLength(3);
  });

  test("should increase accessCount when retrieving", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Unique event about NFTs",
      emotionalValence: 0,
      importance: 5,
    });

    expect(npc.memory.episodic[0].accessCount).toBe(0);

    manager.retrieveMemories(npc, "NFTs");

    expect(npc.memory.episodic[0].accessCount).toBe(1);
  });

  test("should return empty array if no matches", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Something about Bitcoin",
      emotionalValence: 0,
      importance: 5,
    });

    const memories = manager.retrieveMemories(npc, "Ethereum");

    expect(memories).toHaveLength(0);
  });
});

/**
 * Test Suite: MemoryManager - getFactsAbout
 * Tests semantic memory retrieval
 */
test.describe("MemoryManager - getFactsAbout", () => {
  test("should retrieve facts about a subject", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addSemanticMemory(npc, {
      subject: "Alice",
      predicate: "works_at",
      object: "DEX_Exchange",
      confidence: 0.9,
      source: "observation",
    });

    manager.addSemanticMemory(npc, {
      subject: "Alice",
      predicate: "likes",
      object: "Ethereum",
      confidence: 0.7,
      source: "told",
    });

    manager.addSemanticMemory(npc, {
      subject: "Bob",
      predicate: "works_at",
      object: "Mining_Facility",
      confidence: 0.8,
      source: "observation",
    });

    const aliceFacts = manager.getFactsAbout(npc, "Alice");

    expect(aliceFacts).toHaveLength(2);
    expect(aliceFacts.every((f) => f.subject === "Alice")).toBe(true);
  });

  test("should return empty array if no facts about subject", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addSemanticMemory(npc, {
      subject: "Alice",
      predicate: "works_at",
      object: "DEX_Exchange",
      confidence: 0.9,
      source: "observation",
    });

    const facts = manager.getFactsAbout(npc, "Charlie");

    expect(facts).toHaveLength(0);
  });

  test("should return facts sorted by confidence", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addSemanticMemory(npc, {
      subject: "Dave",
      predicate: "might_like",
      object: "Bitcoin",
      confidence: 0.3,
      source: "inference",
    });

    manager.addSemanticMemory(npc, {
      subject: "Dave",
      predicate: "owns",
      object: "NFT_Collection",
      confidence: 0.95,
      source: "observation",
    });

    const facts = manager.getFactsAbout(npc, "Dave");

    expect(facts[0].confidence).toBeGreaterThan(facts[1].confidence);
  });
});

/**
 * Test Suite: MemoryManager - consolidateMemories
 * Tests memory consolidation (strengthening important memories)
 */
test.describe("MemoryManager - consolidateMemories", () => {
  test("should strengthen frequently accessed memories", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Frequently recalled event about trading",
      emotionalValence: 0,
      importance: 5,
    });

    // Simulate multiple accesses
    for (let i = 0; i < 5; i++) {
      manager.retrieveMemories(npc, "trading");
    }

    // Decay the memories first
    manager.decayMemories(npc, 3);

    const strengthBefore = npc.memory.episodic[0].strength;

    manager.consolidateMemories(npc);

    expect(npc.memory.episodic[0].strength).toBeGreaterThanOrEqual(
      strengthBefore
    );
  });

  test("should remove memories with very low strength", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    // Add a weak, unimportant memory
    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Forgettable event",
      emotionalValence: 0,
      importance: 1,
    });

    // Force the strength to be very low
    npc.memory.episodic[0].strength = 0.05;

    manager.consolidateMemories(npc);

    // Memory should be removed
    expect(npc.memory.episodic).toHaveLength(0);
  });

  test("should not remove important memories even with low strength", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Very important event",
      emotionalValence: 0.9,
      importance: 10,
    });

    npc.memory.episodic[0].strength = 0.05;

    manager.consolidateMemories(npc);

    // Should still exist due to importance
    expect(npc.memory.episodic).toHaveLength(1);
  });
});

/**
 * Test Suite: Memory Importance Scoring
 * Tests automatic importance calculation
 */
test.describe("Memory Importance Scoring", () => {
  test("events involving NPC directly should have high importance", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC({ id: "npc_self" });

    // Add memory where NPC is a participant
    manager.addEpisodicMemory(npc, {
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: ["npc_self", "npc_other"],
      event: "I had a conversation with someone",
      emotionalValence: 0,
      importance: 5, // Base importance
    });

    const importance = manager.calculateImportance({
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: ["npc_self", "npc_other"],
      event: "I had a conversation with someone",
      emotionalValence: 0,
      importance: 5,
    }, npc.id);

    expect(importance).toBeGreaterThan(5);
  });

  test("events with emotional content should have higher importance", async () => {
    const manager = new MemoryManager();

    const neutralImportance = manager.calculateImportance({
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Saw a building",
      emotionalValence: 0,
      importance: 5,
    }, "npc_001");

    const emotionalImportance = manager.calculateImportance({
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Witnessed something amazing!",
      emotionalValence: 0.9,
      importance: 5,
    }, "npc_001");

    expect(emotionalImportance).toBeGreaterThan(neutralImportance);
  });

  test("routine events should have low importance", async () => {
    const manager = new MemoryManager();

    const importance = manager.calculateImportance({
      timestamp: 1000,
      location: { x: 5, y: 10 },
      participants: [],
      event: "Walked to work",
      emotionalValence: 0,
      importance: 2,
    }, "npc_001");

    expect(importance).toBeLessThanOrEqual(3);
  });
});

/**
 * Test Suite: Working Memory Management
 */
test.describe("Working Memory Management", () => {
  test("should update recent events", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.addToWorkingMemory(npc, "Entered the building");

    expect(npc.memory.working.recentEvents).toContain("Entered the building");
  });

  test("should maintain max 10 recent events", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    for (let i = 0; i < 15; i++) {
      manager.addToWorkingMemory(npc, `Event ${i}`);
    }

    expect(npc.memory.working.recentEvents.length).toBeLessThanOrEqual(10);
    expect(npc.memory.working.recentEvents).toContain("Event 14");
    expect(npc.memory.working.recentEvents).not.toContain("Event 0");
  });

  test("should update current goal", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.setCurrentGoal(npc, "Find food");

    expect(npc.memory.working.currentGoal).toBe("Find food");
  });

  test("should update current context", async () => {
    const manager = new MemoryManager();
    const npc = createMockNPC();

    manager.setCurrentContext(npc, "At the DEX trading floor");

    expect(npc.memory.working.currentContext).toBe("At the DEX trading floor");
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 * Tests the sardonic descriptions for memory types
 */
test.describe("Hitchhiker's Guide Memory Descriptions", () => {
  test("should have description for episodic memory", async () => {
    expect(MEMORY_DESCRIPTIONS.episodic).toContain("filing cabinet");
    expect(MEMORY_DESCRIPTIONS.episodic).toContain("vibes");
  });

  test("should have description for semantic memory", async () => {
    expect(MEMORY_DESCRIPTIONS.semantic).toContain("facts");
    expect(MEMORY_DESCRIPTIONS.semantic).toContain("crypto");
  });

  test("should have description for procedural memory", async () => {
    expect(MEMORY_DESCRIPTIONS.procedural).toContain("Skills");
  });

  test("should have description for working memory", async () => {
    expect(MEMORY_DESCRIPTIONS.working).toContain("Post-it");
  });

  test("should have descriptions for all memory types", async () => {
    expect(MEMORY_DESCRIPTIONS.episodic).toBeDefined();
    expect(MEMORY_DESCRIPTIONS.semantic).toBeDefined();
    expect(MEMORY_DESCRIPTIONS.procedural).toBeDefined();
    expect(MEMORY_DESCRIPTIONS.working).toBeDefined();
  });
});

/**
 * Test Suite: Memory Integration with NPC
 */
test.describe("Memory Integration with NPC", () => {
  test("CryptoNPC should have memory field", async () => {
    const npc = createMockNPC();

    expect(npc.memory).toBeDefined();
    expect(npc.memory.episodic).toBeDefined();
    expect(npc.memory.semantic).toBeDefined();
    expect(npc.memory.procedural).toBeDefined();
    expect(npc.memory.working).toBeDefined();
  });
});
