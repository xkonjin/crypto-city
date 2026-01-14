import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Persistence System (Issue #196)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Implements full NPC state persistence with:
 * - Serialization/deserialization
 * - Differential saves
 * - LZ-string compression
 * - IndexedDB storage
 * - Version migrations
 * - Corruption recovery
 */

// Import the types and functions we're going to implement
// These imports will fail initially - that's expected in TDD!
import type { CryptoNPC, SerializedNPC } from "@/games/isocity/types/npc";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory, createEpisodicMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";
import { createDefaultPersonality } from "@/lib/npc/personality";
import { createDefaultWallet, createDefaultFinances } from "@/lib/npc/economy";
import { createDefaultInternalWorld } from "@/lib/npc/mood";
import { createDefaultLearning } from "@/lib/npc/learning";
import { createDefaultPoliticalBeliefs } from "@/lib/npc/politicalBeliefs";
import {
  serializeNPC,
  deserializeNPC,
  serializeAllNPCs,
  deserializeAllNPCs,
  createDiff,
  applyDiff,
  saveToStorage,
  loadFromStorage,
  migrateState,
  validateState,
  recoverFromCorruption,
  CURRENT_STATE_VERSION,
  NPCPersistenceError,
  type NPCDiff,
  type PersistedState,
} from "@/lib/npc/NPCPersistence";

/**
 * Helper to create a complete mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: `npc_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
    currentActivity: "idle",
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    internalWorld: createDefaultInternalWorld(),
    wallet: createDefaultWallet(1000),
    finances: createDefaultFinances("trader"),
    factionId: null,
    politicalBeliefs: createDefaultPoliticalBeliefs(),
    learning: createDefaultLearning(),
    ...overrides,
  };
}

/**
 * Helper to create many mock NPCs
 */
function createManyNPCs(count: number): CryptoNPC[] {
  return Array.from({ length: count }, (_, i) =>
    createMockNPC({
      id: `npc_bulk_${i}`,
      name: `NPC_${i}`,
      gridX: i % 20,
      gridY: Math.floor(i / 20),
    })
  );
}

/**
 * Test Suite: serializeNPC
 * Tests converting NPC to storable format
 */
test.describe("serializeNPC", () => {
  test("should serialize all basic NPC properties", async () => {
    const npc = createMockNPC();
    const serialized = serializeNPC(npc);

    expect(serialized.id).toBe(npc.id);
    expect(serialized.name).toBe(npc.name);
    expect(serialized.walletAddress).toBe(npc.walletAddress);
    expect(serialized.age).toBe(npc.age);
    expect(serialized.occupation).toBe(npc.occupation);
    expect(serialized.residence).toBe(npc.residence);
    expect(serialized.workplace).toBe(npc.workplace);
    expect(serialized.spriteType).toBe(npc.spriteType);
    expect(serialized.direction).toBe(npc.direction);
    expect(serialized.gridX).toBe(npc.gridX);
    expect(serialized.gridY).toBe(npc.gridY);
  });

  test("should serialize needs system", async () => {
    const npc = createMockNPC();
    npc.needs.hunger.current = 42;
    npc.needs.energy.current = 88;

    const serialized = serializeNPC(npc);

    expect(serialized.needs.hunger.current).toBe(42);
    expect(serialized.needs.energy.current).toBe(88);
  });

  test("should serialize memory system including episodic memories", async () => {
    const npc = createMockNPC();
    npc.memory.episodic.push(
      createEpisodicMemory({
        timestamp: 1000,
        location: { x: 5, y: 10 },
        participants: ["npc_002"],
        event: "Had coffee",
        emotionalValence: 0.5,
        importance: 5,
      })
    );

    const serialized = serializeNPC(npc);

    expect(serialized.memory.episodic).toHaveLength(1);
    expect(serialized.memory.episodic[0].event).toBe("Had coffee");
  });

  test("should serialize movement state including walking path", async () => {
    const npc = createMockNPC();
    npc.movement.state = {
      type: "walking",
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      pathIndex: 1,
      progress: 0.5,
    };

    const serialized = serializeNPC(npc);

    expect(serialized.movement.state.type).toBe("walking");
    if (serialized.movement.state.type === "walking") {
      expect(serialized.movement.state.path).toHaveLength(3);
      expect(serialized.movement.state.pathIndex).toBe(1);
    }
  });

  test("should serialize personality traits", async () => {
    const npc = createMockNPC();
    npc.personality.bigFive.openness = 0.9;
    npc.personality.crypto.degenLevel = 0.95;

    const serialized = serializeNPC(npc);

    expect(serialized.personality.bigFive.openness).toBe(0.9);
    expect(serialized.personality.crypto.degenLevel).toBe(0.95);
  });

  test("should serialize relationships", async () => {
    const npc = createMockNPC();
    npc.relationships["npc_friend"] = {
      targetId: "npc_friend",
      trust: 75,
      respect: 50,
      familiarity: 80,
      attraction: 10,
      type: "friend",
      firstMet: 1000,
      lastInteraction: 2000,
      interactionCount: 15,
      owedFavors: 2,
    };

    const serialized = serializeNPC(npc);

    expect(serialized.relationships["npc_friend"]).toBeDefined();
    expect(serialized.relationships["npc_friend"].trust).toBe(75);
    expect(serialized.relationships["npc_friend"].type).toBe("friend");
  });

  test("should serialize internal world (mood)", async () => {
    const npc = createMockNPC();
    if (npc.internalWorld) {
      npc.internalWorld.currentMood = "happy";
      npc.internalWorld.moodIntensity = 0.8;
    }

    const serialized = serializeNPC(npc);

    expect(serialized.internalWorld?.currentMood).toBe("happy");
    expect(serialized.internalWorld?.moodIntensity).toBe(0.8);
  });

  test("should serialize wallet and finances", async () => {
    const npc = createMockNPC();
    if (npc.wallet) {
      npc.wallet.cash = 5000;
      npc.wallet.holdings["BTC"] = 0.5;
    }

    const serialized = serializeNPC(npc);

    expect(serialized.wallet?.cash).toBe(5000);
    expect(serialized.wallet?.holdings["BTC"]).toBe(0.5);
  });

  test("should serialize political beliefs", async () => {
    const npc = createMockNPC();
    if (npc.politicalBeliefs) {
      npc.politicalBeliefs.decentralizationPurity = 0.95;
    }

    const serialized = serializeNPC(npc);

    expect(serialized.politicalBeliefs?.decentralizationPurity).toBe(0.95);
  });

  test("should serialize learning state", async () => {
    const npc = createMockNPC();
    if (npc.learning) {
      npc.learning.skills.trading.level = 5;
      npc.learning.skills.trading.experience = 1500;
    }

    const serialized = serializeNPC(npc);

    expect(serialized.learning?.skills.trading.level).toBe(5);
    expect(serialized.learning?.skills.trading.experience).toBe(1500);
  });

  test("should handle optional fields gracefully", async () => {
    const minimalNpc: CryptoNPC = {
      id: "minimal_npc",
      name: "Minimal",
      walletAddress: "0x123",
      age: 25,
      occupation: "unemployed",
      residence: null,
      workplace: null,
      spriteType: "banana",
      direction: "north",
      gridX: 0,
      gridY: 0,
      isInsideBuilding: false,
      currentBuildingId: null,
      currentActivity: null,
      needs: createDefaultNeeds(),
      memory: createDefaultMemory(),
      movement: createInitialMovement(),
      personality: createDefaultPersonality(),
      relationships: {},
      // No optional fields
    };

    const serialized = serializeNPC(minimalNpc);

    expect(serialized.id).toBe("minimal_npc");
    expect(serialized.internalWorld).toBeUndefined();
    expect(serialized.wallet).toBeUndefined();
  });
});

/**
 * Test Suite: deserializeNPC
 * Tests restoring NPC from storage
 */
test.describe("deserializeNPC", () => {
  test("should restore NPC from serialized format", async () => {
    const original = createMockNPC();
    const serialized = serializeNPC(original);
    const restored = deserializeNPC(serialized);

    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.occupation).toBe(original.occupation);
  });

  test("should restore complex nested structures", async () => {
    const original = createMockNPC();
    original.memory.episodic.push(
      createEpisodicMemory({
        timestamp: 1000,
        location: { x: 5, y: 10 },
        participants: ["npc_002"],
        event: "Test event",
        emotionalValence: 0.5,
        importance: 7,
      })
    );

    const serialized = serializeNPC(original);
    const restored = deserializeNPC(serialized);

    expect(restored.memory.episodic).toHaveLength(1);
    expect(restored.memory.episodic[0].event).toBe("Test event");
  });

  test("should handle missing optional fields with defaults", async () => {
    const serialized: SerializedNPC = {
      id: "legacy_npc",
      name: "Legacy",
      walletAddress: "0xold",
      age: 40,
      occupation: "miner",
      residence: null,
      workplace: null,
      spriteType: "apple",
      direction: "south",
      gridX: 10,
      gridY: 10,
      isInsideBuilding: false,
      currentBuildingId: null,
      currentActivity: null,
      needs: createDefaultNeeds(),
      memory: createDefaultMemory(),
      movement: createInitialMovement(),
      personality: createDefaultPersonality(),
      relationships: {},
      // Missing: internalWorld, wallet, finances, etc.
    };

    const restored = deserializeNPC(serialized);

    expect(restored.id).toBe("legacy_npc");
    // Should provide defaults for missing optional fields
    expect(restored.internalWorld).toBeDefined();
    expect(restored.wallet).toBeDefined();
  });

  test("should preserve relationship data", async () => {
    const original = createMockNPC();
    original.relationships["ally"] = {
      targetId: "ally",
      trust: 90,
      respect: 85,
      familiarity: 100,
      attraction: 20,
      type: "best_friend",
      firstMet: 100,
      lastInteraction: 5000,
      interactionCount: 200,
      owedFavors: 5,
    };

    const serialized = serializeNPC(original);
    const restored = deserializeNPC(serialized);

    expect(restored.relationships["ally"].trust).toBe(90);
    expect(restored.relationships["ally"].type).toBe("best_friend");
  });

  test("roundtrip should preserve all data", async () => {
    const original = createMockNPC();
    // Set various values
    original.needs.hunger.current = 33;
    original.personality.crypto.riskTolerance = 0.85;
    if (original.wallet) original.wallet.cash = 9999;
    if (original.politicalBeliefs)
      original.politicalBeliefs.privacyImportance = 0.92;

    const serialized = serializeNPC(original);
    const restored = deserializeNPC(serialized);

    expect(restored.needs.hunger.current).toBe(33);
    expect(restored.personality.crypto.riskTolerance).toBe(0.85);
    expect(restored.wallet?.cash).toBe(9999);
    expect(restored.politicalBeliefs?.privacyImportance).toBe(0.92);
  });
});

/**
 * Test Suite: serializeAllNPCs / deserializeAllNPCs
 * Tests batch serialization with compression
 */
test.describe("Batch Serialization with Compression", () => {
  test("should serialize multiple NPCs", async () => {
    const npcs = createManyNPCs(10);
    const compressed = serializeAllNPCs(npcs);

    expect(typeof compressed).toBe("string");
    expect(compressed.length).toBeGreaterThan(0);
  });

  test("should deserialize compressed data back to NPCs", async () => {
    const original = createManyNPCs(10);
    const compressed = serializeAllNPCs(original);
    const restored = deserializeAllNPCs(compressed);

    expect(restored).toHaveLength(10);
    expect(restored[0].id).toBe("npc_bulk_0");
    expect(restored[9].id).toBe("npc_bulk_9");
  });

  test("compression should reduce data size", async () => {
    const npcs = createManyNPCs(50);
    const uncompressedJson = JSON.stringify(npcs.map(serializeNPC));
    const compressed = serializeAllNPCs(npcs);

    expect(compressed.length).toBeLessThan(uncompressedJson.length);
  });

  test("should handle empty array", async () => {
    const compressed = serializeAllNPCs([]);
    const restored = deserializeAllNPCs(compressed);

    expect(restored).toHaveLength(0);
  });

  test("should handle 200 NPCs within 1 second", async () => {
    const npcs = createManyNPCs(200);

    const startSerialize = Date.now();
    const compressed = serializeAllNPCs(npcs);
    const serializeTime = Date.now() - startSerialize;

    const startDeserialize = Date.now();
    const restored = deserializeAllNPCs(compressed);
    const deserializeTime = Date.now() - startDeserialize;

    expect(serializeTime).toBeLessThan(1000);
    expect(deserializeTime).toBeLessThan(1000);
    expect(restored).toHaveLength(200);
  });
});

/**
 * Test Suite: Differential Saves
 * Tests createDiff and applyDiff
 */
test.describe("Differential Saves", () => {
  test("createDiff should detect changed fields", async () => {
    const previous = createMockNPC();
    // Deep clone to avoid shared references
    const current = JSON.parse(JSON.stringify(previous)) as CryptoNPC;
    current.needs.hunger.current = 20; // Changed
    current.gridX = 10; // Changed

    const diff = createDiff(previous, current);

    expect(diff).not.toBeNull();
    expect(diff!.id).toBe(previous.id);
    expect(diff!.changes).toContain("needs");
    expect(diff!.changes).toContain("gridX");
    expect(diff!.data.needs?.hunger?.current).toBe(20);
    expect(diff!.data.gridX).toBe(10);
  });

  test("createDiff should return null if nothing changed", async () => {
    const npc = createMockNPC();
    const diff = createDiff(npc, npc);

    expect(diff).toBeNull();
  });

  test("applyDiff should update base state", async () => {
    const base = createMockNPC();
    const diff = {
      id: base.id,
      changes: ["gridX", "gridY"],
      data: { gridX: 15, gridY: 20 },
      timestamp: Date.now(),
    };

    const updated = applyDiff(base, diff);

    expect(updated.gridX).toBe(15);
    expect(updated.gridY).toBe(20);
    expect(updated.name).toBe(base.name); // Unchanged
  });

  test("applyDiff should handle nested changes", async () => {
    const base = createMockNPC();
    // Create a modified needs object with one value changed
    const modifiedNeeds = JSON.parse(JSON.stringify(base.needs));
    modifiedNeeds.hunger.current = 10;

    const diff: NPCDiff = {
      id: base.id,
      changes: ["needs"],
      data: {
        needs: modifiedNeeds,
      },
      timestamp: Date.now(),
    };

    const updated = applyDiff(base, diff);

    expect(updated.needs.hunger.current).toBe(10);
    // Other needs should be unchanged
    expect(updated.needs.energy).toBeDefined();
  });

  test("createDiff should detect relationship changes", async () => {
    const previous = createMockNPC();
    const current = { ...createMockNPC(), id: previous.id };
    current.relationships["new_friend"] = {
      targetId: "new_friend",
      trust: 50,
      respect: 40,
      familiarity: 30,
      attraction: 0,
      type: "acquaintance",
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 1,
      owedFavors: 0,
    };

    const diff = createDiff(previous, current);

    expect(diff?.changes).toContain("relationships");
  });
});

/**
 * Test Suite: IndexedDB Storage
 * Tests saveToStorage and loadFromStorage
 * NOTE: These tests require IndexedDB which is only available in browser context.
 * In the Playwright test environment without a page, we test error handling.
 */
test.describe("IndexedDB Storage", () => {
  const testKey = "test_npcs_persistence";

  test("should throw NPCPersistenceError when IndexedDB unavailable", async () => {
    // In Node/Playwright test environment without browser context, IndexedDB is unavailable
    // This tests proper error handling
    const npcs = createManyNPCs(5);
    const compressed = serializeAllNPCs(npcs);

    await expect(saveToStorage(compressed, testKey)).rejects.toThrow(
      NPCPersistenceError
    );
  });

  test("should include proper error code for storage failures", async () => {
    const npcs = createManyNPCs(5);
    const compressed = serializeAllNPCs(npcs);

    try {
      await saveToStorage(compressed, testKey);
    } catch (e) {
      expect(e instanceof NPCPersistenceError).toBe(true);
      expect((e as NPCPersistenceError).code).toBe("STORAGE_FAILED");
    }
  });

  test("loadFromStorage should throw when IndexedDB unavailable", async () => {
    await expect(loadFromStorage("any_key")).rejects.toThrow(NPCPersistenceError);
  });

  test("should have consistent error handling for load operations", async () => {
    try {
      await loadFromStorage("non_existent_key_" + Date.now());
    } catch (e) {
      expect(e instanceof NPCPersistenceError).toBe(true);
      expect((e as NPCPersistenceError).code).toBe("STORAGE_FAILED");
    }
  });

  test("saveToStorage and loadFromStorage functions should be exported", async () => {
    // Verify the functions exist and are properly typed
    expect(typeof saveToStorage).toBe("function");
    expect(typeof loadFromStorage).toBe("function");
  });
});

/**
 * Test Suite: Version Migration
 * Tests state version tracking and migrations
 */
test.describe("Version Migration", () => {
  test("should have CURRENT_STATE_VERSION defined", async () => {
    expect(CURRENT_STATE_VERSION).toBeDefined();
    expect(typeof CURRENT_STATE_VERSION).toBe("number");
    expect(CURRENT_STATE_VERSION).toBeGreaterThanOrEqual(1);
  });

  test("should migrate from older version to current", async () => {
    // Test migration from v0 (hypothetical pre-v1 state) to v1
    // Create a properly typed old state with missing optional fields
    const npc = createMockNPC({ id: "old_npc", name: "OldNPC" });
    const serialized = serializeNPC(npc);
    // Remove optional fields to simulate old format
    delete (serialized as Partial<SerializedNPC>).internalWorld;
    delete (serialized as Partial<SerializedNPC>).wallet;
    delete (serialized as Partial<SerializedNPC>).learning;

    const oldState: PersistedState = {
      version: 0,
      npcs: [serialized],
    };

    const migrated = migrateState(oldState, 0, CURRENT_STATE_VERSION);

    expect(migrated.version).toBe(CURRENT_STATE_VERSION);
    // v0 to v1 migration adds these fields with defaults
    expect(migrated.npcs[0].internalWorld).toBeDefined();
    expect(migrated.npcs[0].wallet).toBeDefined();
    expect(migrated.npcs[0].learning).toBeDefined();
  });

  test("should not change data at current version", async () => {
    const currentState = {
      version: CURRENT_STATE_VERSION,
      npcs: createManyNPCs(3).map(serializeNPC),
    };

    const migrated = migrateState(
      currentState,
      CURRENT_STATE_VERSION,
      CURRENT_STATE_VERSION
    );

    expect(migrated).toEqual(currentState);
  });

  test("should apply migrations incrementally", async () => {
    const v1State = {
      version: 1,
      npcs: [serializeNPC(createMockNPC())],
    };

    // Migrate from 1 to current (assuming current > 1)
    const migrated = migrateState(v1State, 1, CURRENT_STATE_VERSION);

    expect(migrated.version).toBe(CURRENT_STATE_VERSION);
  });

  test("should throw error for invalid version", async () => {
    const badState = { version: -1, npcs: [] };

    expect(() => migrateState(badState, -1, CURRENT_STATE_VERSION)).toThrow();
  });
});

/**
 * Test Suite: State Validation
 * Tests validateState for corruption detection
 */
test.describe("State Validation", () => {
  test("should validate correct state", async () => {
    const state = {
      version: CURRENT_STATE_VERSION,
      npcs: createManyNPCs(3).map(serializeNPC),
    };

    const result = validateState(state);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should detect missing required fields", async () => {
    const invalidNpc = {
      // Missing id
      name: "NoId",
      walletAddress: "0x123",
    };

    const state = {
      version: CURRENT_STATE_VERSION,
      npcs: [invalidNpc],
    };

    const result = validateState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("id"))).toBe(true);
  });

  test("should detect type mismatches", async () => {
    const invalidNpc = {
      id: 12345, // Should be string
      name: "TypeMismatch",
      walletAddress: "0x123",
      age: "thirty", // Should be number
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
      personality: createDefaultPersonality(),
      relationships: {},
    };

    const state = {
      version: CURRENT_STATE_VERSION,
      npcs: [invalidNpc],
    };

    const result = validateState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("type"))).toBe(true);
  });

  test("should detect invalid JSON structure", async () => {
    const result = validateState(null);

    expect(result.valid).toBe(false);
  });

  test("should detect invalid occupation values", async () => {
    const npc = createMockNPC();
    const serialized = serializeNPC(npc);
    (serialized as unknown as Record<string, unknown>).occupation = "invalid_occupation";

    const state = {
      version: CURRENT_STATE_VERSION,
      npcs: [serialized],
    };

    const result = validateState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("occupation"))).toBe(true);
  });

  test("should detect out of range values", async () => {
    const npc = createMockNPC();
    const serialized = serializeNPC(npc);
    serialized.needs.hunger.current = 150; // Max is 100

    const state = {
      version: CURRENT_STATE_VERSION,
      npcs: [serialized],
    };

    const result = validateState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("range"))).toBe(true);
  });
});

/**
 * Test Suite: Corruption Recovery
 * Tests recoverFromCorruption best-effort recovery
 */
test.describe("Corruption Recovery", () => {
  test("should recover partially valid NPCs", async () => {
    const validNpc = createMockNPC();
    const invalidNpc = { id: "broken", garbage: true }; // Missing most fields

    const corruptedState = {
      version: CURRENT_STATE_VERSION,
      npcs: [serializeNPC(validNpc), invalidNpc],
    };

    const recovered = recoverFromCorruption(corruptedState);

    expect(recovered.npcs.length).toBeGreaterThanOrEqual(1);
    expect(recovered.npcs[0].id).toBe(validNpc.id);
  });

  test("should provide default values for missing fields", async () => {
    const partialNpc = {
      id: "partial_npc",
      name: "Partial",
      walletAddress: "0x123",
      age: 25,
      occupation: "trader",
      // Missing many fields
    };

    const corruptedState = {
      version: CURRENT_STATE_VERSION,
      npcs: [partialNpc],
    };

    const recovered = recoverFromCorruption(corruptedState);

    expect(recovered.npcs[0].id).toBe("partial_npc");
    expect(recovered.npcs[0].needs).toBeDefined();
    expect(recovered.npcs[0].memory).toBeDefined();
  });

  test("should return empty state for completely invalid data", async () => {
    const recovered = recoverFromCorruption("not even json");

    expect(recovered.npcs).toHaveLength(0);
    expect(recovered.version).toBe(CURRENT_STATE_VERSION);
  });

  test("should fix invalid field types", async () => {
    const npcWithBadTypes = {
      id: "bad_types",
      name: 12345, // Should be string
      walletAddress: "0x123",
      age: "25", // Should be number
      occupation: "trader",
      gridX: "5", // Should be number
      gridY: 5,
    };

    const corruptedState = {
      version: CURRENT_STATE_VERSION,
      npcs: [npcWithBadTypes],
    };

    const recovered = recoverFromCorruption(corruptedState);

    expect(typeof recovered.npcs[0].name).toBe("string");
    expect(typeof recovered.npcs[0].age).toBe("number");
    expect(typeof recovered.npcs[0].gridX).toBe("number");
  });

  test("should clamp out of range values", async () => {
    const npc = createMockNPC();
    const serialized = serializeNPC(npc);
    serialized.needs.hunger.current = 200; // Over max
    serialized.personality.bigFive.openness = -0.5; // Below min

    const corruptedState = {
      version: CURRENT_STATE_VERSION,
      npcs: [serialized],
    };

    const recovered = recoverFromCorruption(corruptedState);

    expect(recovered.npcs[0].needs.hunger.current).toBeLessThanOrEqual(100);
    expect(recovered.npcs[0].personality.bigFive.openness).toBeGreaterThanOrEqual(0);
  });

  test("should report recovery statistics", async () => {
    const validNpc1 = serializeNPC(createMockNPC({ id: "valid_1" }));
    const validNpc2 = serializeNPC(createMockNPC({ id: "valid_2" }));
    const invalidNpc = { id: "invalid", broken: true };

    const corruptedState = {
      version: CURRENT_STATE_VERSION,
      npcs: [validNpc1, invalidNpc, validNpc2],
    };

    const result = recoverFromCorruption(corruptedState);

    expect(result.recoveryStats).toBeDefined();
    expect(result.recoveryStats.totalNPCs).toBe(3);
    expect(result.recoveryStats.recoveredNPCs).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Test Suite: Error Handling
 * Tests NPCPersistenceError
 */
test.describe("Error Handling", () => {
  test("NPCPersistenceError should be throwable", async () => {
    expect(() => {
      throw new NPCPersistenceError("Test error", "SERIALIZATION_FAILED");
    }).toThrow(NPCPersistenceError);
  });

  test("NPCPersistenceError should include error code", async () => {
    try {
      throw new NPCPersistenceError("Test", "STORAGE_FULL");
    } catch (e) {
      expect(e instanceof NPCPersistenceError).toBe(true);
      expect((e as NPCPersistenceError).code).toBe("STORAGE_FULL");
    }
  });

  test("deserializeAllNPCs should throw on invalid compressed data", async () => {
    expect(() => deserializeAllNPCs("not_valid_lz_string")).toThrow(
      NPCPersistenceError
    );
  });
});

/**
 * Test Suite: Integration - Full Save/Load Cycle
 * Tests the complete persistence workflow (in-memory, not IndexedDB)
 */
test.describe("Full Persistence Cycle Integration", () => {
  test("should complete full serialize/deserialize cycle", async () => {
    // Create NPCs with various states
    const npcs = createManyNPCs(10);
    npcs[0].needs.hunger.current = 15;
    npcs[0].relationships["friend"] = {
      targetId: "friend",
      trust: 80,
      respect: 70,
      familiarity: 90,
      attraction: 5,
      type: "close_friend",
      firstMet: 1000,
      lastInteraction: 5000,
      interactionCount: 50,
      owedFavors: 3,
    };

    // Serialize (compress) and deserialize (decompress)
    const compressed = serializeAllNPCs(npcs);
    const restored = deserializeAllNPCs(compressed);

    // Verify
    expect(restored).toHaveLength(10);
    expect(restored[0].needs.hunger.current).toBe(15);
    expect(restored[0].relationships["friend"].trust).toBe(80);
  });

  test("should handle incremental saves with diff", async () => {
    const npc = createMockNPC();
    // Deep clone to avoid shared references
    const previousState = JSON.parse(JSON.stringify(npc)) as CryptoNPC;

    // Simulate game tick changes
    npc.gridX = 10;
    npc.needs.energy.current = 50;

    // Create diff
    const diff = createDiff(previousState, npc);

    expect(diff).not.toBeNull();
    expect(diff!.changes).toContain("gridX");
    expect(diff!.changes).toContain("needs");

    // Apply diff to restore state
    const reconstructed = applyDiff(previousState, diff!);

    expect(reconstructed.gridX).toBe(10);
    expect(reconstructed.needs.energy.current).toBe(50);
  });

  test("should preserve complex state through full cycle", async () => {
    // Create an NPC with all optional fields populated
    const npc = createMockNPC();
    npc.wallet = createDefaultWallet(5000);
    npc.wallet.holdings["BTC"] = 0.5;
    npc.wallet.holdings["ETH"] = 2.0;
    npc.internalWorld = createDefaultInternalWorld();
    npc.internalWorld.currentMood = "happy";
    npc.politicalBeliefs = createDefaultPoliticalBeliefs({ privacyImportance: 0.9 });
    npc.learning = createDefaultLearning();

    // Full serialize/deserialize cycle
    const compressed = serializeAllNPCs([npc]);
    const [restored] = deserializeAllNPCs(compressed);

    // Verify all complex data preserved
    expect(restored.wallet?.cash).toBe(5000);
    expect(restored.wallet?.holdings["BTC"]).toBe(0.5);
    expect(restored.wallet?.holdings["ETH"]).toBe(2.0);
    expect(restored.internalWorld?.currentMood).toBe("happy");
    expect(restored.politicalBeliefs?.privacyImportance).toBe(0.9);
  });
});
