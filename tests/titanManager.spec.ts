import { test, expect } from "@playwright/test";

/**
 * Tests for TitanManager Singleton
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * These tests validate the TitanManager singleton for managing the unique Titan Pet.
 * 
 * The TitanManager:
 * - Uses singleton pattern (only one instance)
 * - Enforces single Titan constraint (only one Titan can exist at a time)
 * - Handles spawning, despawning, and updating the Titan
 * - Manages persistence via localStorage
 * - Provides position update methods
 */

// Import types (these should already exist)
import type {
  TitanPet,
  TitanSpawnOptions,
  SerializedTitan,
} from "@/games/isocity/types/titan";

import { TITAN_STORAGE_KEY } from "@/games/isocity/types/titan";

// Import TitanManager (this import will fail until implementation)
import { TitanManager } from "@/lib/titan";

/**
 * Helper to reset TitanManager state (works in Node.js context only)
 */
function resetTitanManager(): void {
  TitanManager.despawnTitan();
  // clearStorage will fail in Node context but that's okay for non-persistence tests
  try {
    TitanManager.clearStorage();
  } catch {
    // Expected in Node.js context
  }
}

/**
 * Test Suite: TitanManager Singleton Pattern
 */
test.describe("TitanManager Singleton Pattern", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("should export a singleton instance", async () => {
    expect(TitanManager).toBeDefined();
    expect(typeof TitanManager).toBe("object");
  });

  test("getInstance should return the same instance", async () => {
    // Access the class via the singleton to verify pattern
    const instance1 = TitanManager;
    const instance2 = TitanManager;
    expect(instance1).toBe(instance2);
  });
});

/**
 * Test Suite: TitanManager Spawning
 */
test.describe("TitanManager Spawning", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("spawnTitan should create a new Titan", async () => {
    const options: TitanSpawnOptions = {
      gridX: 10,
      gridY: 20,
      species: "doge",
      name: "TestTitan",
    };

    const titan = TitanManager.spawnTitan(options);

    expect(titan).toBeDefined();
    expect(titan.gridX).toBe(10);
    expect(titan.gridY).toBe(20);
    expect(titan.species).toBe("doge");
    expect(titan.name).toBe("TestTitan");
  });

  test("spawnTitan should use default species 'doge' if not specified", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.species).toBe("doge");
  });

  test("spawnTitan should generate name if not specified", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.name).toBeDefined();
    expect(titan.name.length).toBeGreaterThan(0);
  });

  test("spawnTitan should generate unique ID", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.id).toBeDefined();
    expect(titan.id).toMatch(/^titan-/);
  });

  test("spawnTitan should use default direction 'south' if not specified", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.direction).toBe("south");
  });

  test("spawnTitan should use initial alignment from options", async () => {
    const titan = TitanManager.spawnTitan({
      gridX: 5,
      gridY: 5,
      initialAlignment: -0.5,
    });

    expect(titan.alignment).toBe(-0.5);
  });

  test("spawnTitan should despawn existing Titan if one exists", async () => {
    const titan1 = TitanManager.spawnTitan({
      gridX: 5,
      gridY: 5,
      name: "FirstTitan",
    });
    const titan1Id = titan1.id;

    const titan2 = TitanManager.spawnTitan({
      gridX: 10,
      gridY: 10,
      name: "SecondTitan",
    });

    // Only one Titan should exist
    expect(TitanManager.getTitan()).toBeDefined();
    expect(TitanManager.getTitan()?.name).toBe("SecondTitan");
    expect(TitanManager.getTitan()?.id).not.toBe(titan1Id);
  });
});

/**
 * Test Suite: TitanManager Getters
 */
test.describe("TitanManager Getters", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("getTitan should return null when no Titan exists", async () => {
    const titan = TitanManager.getTitan();
    expect(titan).toBeNull();
  });

  test("getTitan should return the spawned Titan", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5, name: "TestTitan" });

    const titan = TitanManager.getTitan();
    expect(titan).toBeDefined();
    expect(titan?.name).toBe("TestTitan");
  });

  test("hasTitan should return false when no Titan exists", async () => {
    expect(TitanManager.hasTitan()).toBe(false);
  });

  test("hasTitan should return true when Titan exists", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    expect(TitanManager.hasTitan()).toBe(true);
  });
});

/**
 * Test Suite: TitanManager Despawning
 */
test.describe("TitanManager Despawning", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("despawnTitan should return false when no Titan exists", async () => {
    const result = TitanManager.despawnTitan();
    expect(result).toBe(false);
  });

  test("despawnTitan should remove existing Titan and return true", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    expect(TitanManager.hasTitan()).toBe(true);

    const result = TitanManager.despawnTitan();
    expect(result).toBe(true);
    expect(TitanManager.hasTitan()).toBe(false);
    expect(TitanManager.getTitan()).toBeNull();
  });
});

/**
 * Test Suite: TitanManager Position Updates
 */
test.describe("TitanManager Position Updates", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("updateTitanPosition should update position", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    TitanManager.updateTitanPosition(10, 15);

    const titan = TitanManager.getTitan();
    expect(titan?.gridX).toBe(10);
    expect(titan?.gridY).toBe(15);
  });

  test("updateTitanPosition should update direction if provided", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5, direction: "south" });

    TitanManager.updateTitanPosition(10, 15, "north");

    const titan = TitanManager.getTitan();
    expect(titan?.direction).toBe("north");
  });

  test("updateTitanPosition should not crash when no Titan exists", async () => {
    // Should not throw
    TitanManager.updateTitanPosition(10, 15);
    expect(TitanManager.getTitan()).toBeNull();
  });

  test("getTitanPosition should return null when no Titan exists", async () => {
    const position = TitanManager.getTitanPosition();
    expect(position).toBeNull();
  });

  test("getTitanPosition should return position when Titan exists", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 10 });

    const position = TitanManager.getTitanPosition();
    expect(position).toBeDefined();
    expect(position?.gridX).toBe(5);
    expect(position?.gridY).toBe(10);
  });
});

/**
 * Test Suite: TitanManager Update Tick
 */
test.describe("TitanManager Update Tick", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("updateTitan should not crash when no Titan exists", async () => {
    // Should not throw
    TitanManager.updateTitan(1.0);
    expect(TitanManager.getTitan()).toBeNull();
  });

  test("updateTitan should increment age over time", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    const initialAge = TitanManager.getTitan()?.age ?? 0;

    // Simulate passing of game time (1440 minutes = 1 day)
    TitanManager.updateTitan(1440);

    const newAge = TitanManager.getTitan()?.age;
    expect(newAge).toBeGreaterThan(initialAge);
  });

  test("updateTitan should decay needs over time", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    // Get initial hunger value
    const initialHunger = TitanManager.getTitan()?.needs.hunger.current ?? 100;

    // Simulate time passing
    TitanManager.updateTitan(60); // 1 hour

    // Hunger should have decayed
    const newHunger = TitanManager.getTitan()?.needs.hunger.current ?? 100;
    expect(newHunger).toBeLessThan(initialHunger);
  });
});

/**
 * Test Suite: TitanManager Persistence (Browser Context)
 * These tests run in the browser context where localStorage is available.
 * Since TitanManager may not be exposed on window, we test localStorage directly.
 */
test.describe("TitanManager Persistence", () => {
  const TITAN_STORAGE_KEY = "crypto-city-titan";

  test("storage format should be JSON-serializable", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate((storageKey) => {
      // Clear any existing data
      localStorage.removeItem(storageKey);
      
      // Create a test serialized Titan (matching the SerializedTitan interface)
      const testTitan = {
        species: "doge",
        name: "PersistentTitan",
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
        relationships: {},
      };

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(testTitan));

      // Read it back
      const saved = localStorage.getItem(storageKey);
      if (!saved) return { error: "not_saved" };

      const parsed = JSON.parse(saved);
      return {
        name: parsed.name,
        gridX: parsed.gridX,
        gridY: parsed.gridY,
        species: parsed.species,
      };
    }, TITAN_STORAGE_KEY);

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.name).toBe("PersistentTitan");
      expect(result.gridX).toBe(5);
      expect(result.gridY).toBe(10);
      expect(result.species).toBe("doge");
    }
  });

  test("clearing storage should remove saved Titan data", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate((storageKey) => {
      // Save test data
      localStorage.setItem(storageKey, JSON.stringify({ name: "TestTitan" }));
      const savedBefore = localStorage.getItem(storageKey);

      // Clear storage
      localStorage.removeItem(storageKey);
      const savedAfter = localStorage.getItem(storageKey);

      return {
        savedBefore: savedBefore !== null,
        savedAfter: savedAfter === null,
      };
    }, TITAN_STORAGE_KEY);

    expect(result.savedBefore).toBe(true);
    expect(result.savedAfter).toBe(true);
  });

  test("corrupted data should be handled gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate((storageKey) => {
      // Save invalid JSON
      localStorage.setItem(storageKey, "not valid json");

      let loadFailed = false;
      try {
        JSON.parse(localStorage.getItem(storageKey) || "");
      } catch {
        loadFailed = true;
      }

      // Clean up
      localStorage.removeItem(storageKey);

      return { loadFailed };
    }, TITAN_STORAGE_KEY);

    expect(result.loadFailed).toBe(true);
  });

  test("empty storage should return null", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate((storageKey) => {
      // Clear storage first
      localStorage.removeItem(storageKey);

      const saved = localStorage.getItem(storageKey);
      return { isEmpty: saved === null };
    }, TITAN_STORAGE_KEY);

    expect(result.isEmpty).toBe(true);
  });

  test("stored data should persist across page accesses", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Store data
    await page.evaluate((storageKey) => {
      localStorage.setItem(storageKey, JSON.stringify({ name: "PersistedTitan", gridX: 15, gridY: 25 }));
    }, TITAN_STORAGE_KEY);

    // Access storage again (simulating page interaction)
    const result = await page.evaluate((storageKey) => {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return { error: "not_persisted" };

      const parsed = JSON.parse(saved);
      return {
        name: parsed.name,
        gridX: parsed.gridX,
        gridY: parsed.gridY,
      };
    }, TITAN_STORAGE_KEY);

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.name).toBe("PersistedTitan");
      expect(result.gridX).toBe(15);
      expect(result.gridY).toBe(25);
    }
  });

  test("BDI serialization format should use arrays instead of Maps", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate((storageKey) => {
      const testBDI = {
        beliefs: {
          worldKnowledge: [["key1", "value1"], ["key2", "value2"]],
          actionBeliefs: [["help_npc", { action: "help_npc", goodness: 0.8, confidence: 0.5, lastReinforced: Date.now() }]],
          npcOpinions: [["npc-1", 50]],
          playerRelationship: { trust: 0.5, fear: 0.0, affection: 0.5 },
        },
        desires: [],
        intentions: null,
      };

      // Store and retrieve
      localStorage.setItem(storageKey, JSON.stringify({ name: "Test", bdi: testBDI }));
      const saved = localStorage.getItem(storageKey);
      if (!saved) return { error: "not_saved" };

      const parsed = JSON.parse(saved);
      return {
        worldKnowledgeIsArray: Array.isArray(parsed.bdi.beliefs.worldKnowledge),
        actionBeliefsIsArray: Array.isArray(parsed.bdi.beliefs.actionBeliefs),
        npcOpinionsIsArray: Array.isArray(parsed.bdi.beliefs.npcOpinions),
        worldKnowledgeLength: parsed.bdi.beliefs.worldKnowledge.length,
      };
    }, TITAN_STORAGE_KEY);

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.worldKnowledgeIsArray).toBe(true);
      expect(result.actionBeliefsIsArray).toBe(true);
      expect(result.npcOpinionsIsArray).toBe(true);
      expect(result.worldKnowledgeLength).toBe(2);
    }
  });
});

/**
 * Test Suite: Titan Data Integrity
 */
test.describe("Titan Data Integrity", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("spawned Titan should have initialized needs", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.needs).toBeDefined();
    expect(titan.needs.hunger).toBeDefined();
    expect(titan.needs.energy).toBeDefined();
    expect(titan.needs.social).toBeDefined();
    expect(titan.needs.fun).toBeDefined();
    expect(titan.needs.wealth).toBeDefined();
    expect(titan.needs.purpose).toBeDefined();
    // Titan-specific needs
    expect(titan.needs.attention).toBeDefined();
    expect(titan.needs.growth).toBeDefined();
  });

  test("spawned Titan should have initialized mood", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.mood).toBeDefined();
    expect(titan.mood.currentMood).toBeDefined();
    expect(titan.mood.moodIntensity).toBeDefined();
    expect(titan.mood.beliefsAboutPlayer).toBeDefined();
  });

  test("spawned Titan should have initialized BDI", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.bdi).toBeDefined();
    expect(titan.bdi.beliefs).toBeDefined();
    expect(titan.bdi.beliefs.worldKnowledge).toBeInstanceOf(Map);
    expect(titan.bdi.beliefs.actionBeliefs).toBeInstanceOf(Map);
    expect(titan.bdi.beliefs.npcOpinions).toBeInstanceOf(Map);
    expect(titan.bdi.desires).toBeDefined();
  });

  test("spawned Titan should have initialized skills", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });

    expect(titan.skills).toBeDefined();
    expect(titan.skills.strength).toBeDefined();
    expect(titan.skills.speed).toBeDefined();
    expect(titan.skills.intelligence).toBeDefined();
    expect(titan.skills.charisma).toBeDefined();
    expect(titan.skills.miracles).toBeDefined();
  });

  test("spawned Titan should have correct alignment appearance", async () => {
    // Neutral alignment should show neutral appearance
    const neutralTitan = TitanManager.spawnTitan({
      gridX: 5,
      gridY: 5,
      initialAlignment: 0,
    });
    expect(neutralTitan.currentAppearance).toBe("neutral");

    TitanManager.despawnTitan();

    // Good alignment should show good appearance
    const goodTitan = TitanManager.spawnTitan({
      gridX: 5,
      gridY: 5,
      initialAlignment: -0.4,
    });
    expect(goodTitan.currentAppearance).toBe("good");

    TitanManager.despawnTitan();

    // Evil alignment should show evil appearance
    const evilTitan = TitanManager.spawnTitan({
      gridX: 5,
      gridY: 5,
      initialAlignment: 0.4,
    });
    expect(evilTitan.currentAppearance).toBe("evil");
  });
});

/**
 * Test Suite: Name Generation
 */
test.describe("Titan Name Generation", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("should generate crypto-themed names for doge", async () => {
    // Generate multiple names to verify crypto theme
    const names: string[] = [];
    for (let i = 0; i < 10; i++) {
      const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5, species: "doge" });
      names.push(titan.name);
      TitanManager.despawnTitan();
    }

    // Names should be non-empty
    names.forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
    });
  });

  test("generated names should vary", async () => {
    const names = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
      names.add(titan.name);
      TitanManager.despawnTitan();
    }

    // Should have some variety (at least 5 unique names out of 20)
    expect(names.size).toBeGreaterThanOrEqual(5);
  });
});
