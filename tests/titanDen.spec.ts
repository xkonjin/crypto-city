import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Den Building System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * 
 * The Titan Den is a special building that serves as the Titan's home:
 * - Provides rest, feeding, and training facilities
 * - Upgradeable through 5 levels with increasing features
 * - Integrates with the building registry system
 */

// Import types and functions to be tested
import type { TitanPet } from "@/games/isocity/types/titan";
import {
  // Types
  TitanDen,
  TitanDenFeatures,
  DenLevelConfig,
  DenFeatureEffect,
  // Constants
  DEN_LEVEL_CONFIG,
  DEN_FEATURE_EFFECTS,
  MAX_DEN_LEVEL,
  MIN_DEN_LEVEL,
  // Functions
  createTitanDen,
  upgradeDen,
  canUpgradeDen,
  applyDenEffects,
  isTitanAtDen,
  getDenFeatures,
  useFeedingBowl,
  useSleepingArea,
  useTrainingDummy,
  useMiracleAltar,
  useWaterBowl,
} from "@/lib/titan/TitanDen";

import { TitanManager } from "@/lib/titan";

// Helper to create a test Titan
function createTestTitan(): TitanPet {
  TitanManager.despawnTitan();
  return TitanManager.spawnTitan({
    gridX: 10,
    gridY: 10,
    species: "doge",
    name: "TestDoge",
  });
}

// Helper to reset state
function resetState(): void {
  TitanManager.despawnTitan();
}

// ============================================================================
// TEST SUITE: TitanDen Interface Tests
// ============================================================================

test.describe("TitanDen Interface", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should export TitanDen type with required properties", async () => {
    const den = createTitanDen(1, { x: 5, y: 5 });

    expect(den).toBeDefined();
    expect(den.buildingId).toBeDefined();
    expect(typeof den.buildingId).toBe("string");
    expect(den.level).toBeDefined();
    expect(typeof den.level).toBe("number");
    expect(den.position).toBeDefined();
    expect(den.position.x).toBeDefined();
    expect(den.position.y).toBeDefined();
    expect(den.features).toBeDefined();
    expect(den.lastUsed).toBeDefined();
    expect(typeof den.lastUsed).toBe("number");
  });

  test("should export TitanDenFeatures with all feature flags", async () => {
    const den = createTitanDen(5, { x: 5, y: 5 }); // Level 5 has all features

    expect(den.features.feedingBowl).toBeDefined();
    expect(den.features.waterBowl).toBeDefined();
    expect(den.features.sleepingArea).toBeDefined();
    expect(den.features.toyStorage).toBeDefined();
    expect(den.features.trainingDummy).toBeDefined();
    expect(den.features.miracleAltar).toBeDefined();
    expect(den.features.memoryShrine).toBeDefined();
    expect(den.features.evolutionChamber).toBeDefined();
  });
});

// ============================================================================
// TEST SUITE: createTitanDen Function Tests
// ============================================================================

test.describe("createTitanDen Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should create a Level 1 den with basic features", async () => {
    const den = createTitanDen(1, { x: 10, y: 20 });

    expect(den.level).toBe(1);
    expect(den.buildingId).toBe("titan-den-1");
    expect(den.position.x).toBe(10);
    expect(den.position.y).toBe(20);
    expect(den.features.feedingBowl).toBe(true);
    expect(den.features.waterBowl).toBe(true);
    expect(den.features.sleepingArea).toBe(true);
    expect(den.features.toyStorage).toBe(false);
    expect(den.features.trainingDummy).toBe(false);
    expect(den.features.miracleAltar).toBe(false);
    expect(den.features.memoryShrine).toBe(false);
    expect(den.features.evolutionChamber).toBe(false);
  });

  test("should create a Level 2 den with toy storage and training dummy", async () => {
    const den = createTitanDen(2, { x: 5, y: 5 });

    expect(den.level).toBe(2);
    expect(den.buildingId).toBe("titan-den-2");
    expect(den.features.toyStorage).toBe(true);
    expect(den.features.trainingDummy).toBe(true);
    expect(den.features.miracleAltar).toBe(false);
  });

  test("should create a Level 3 den with miracle altar", async () => {
    const den = createTitanDen(3, { x: 5, y: 5 });

    expect(den.level).toBe(3);
    expect(den.buildingId).toBe("titan-den-3");
    expect(den.features.miracleAltar).toBe(true);
    expect(den.features.memoryShrine).toBe(false);
  });

  test("should create a Level 4 den with memory shrine", async () => {
    const den = createTitanDen(4, { x: 5, y: 5 });

    expect(den.level).toBe(4);
    expect(den.buildingId).toBe("titan-den-4");
    expect(den.features.memoryShrine).toBe(true);
    expect(den.features.evolutionChamber).toBe(false);
  });

  test("should create a Level 5 den with all features including evolution chamber", async () => {
    const den = createTitanDen(5, { x: 5, y: 5 });

    expect(den.level).toBe(5);
    expect(den.buildingId).toBe("titan-den-5");
    expect(den.features.feedingBowl).toBe(true);
    expect(den.features.waterBowl).toBe(true);
    expect(den.features.sleepingArea).toBe(true);
    expect(den.features.toyStorage).toBe(true);
    expect(den.features.trainingDummy).toBe(true);
    expect(den.features.miracleAltar).toBe(true);
    expect(den.features.memoryShrine).toBe(true);
    expect(den.features.evolutionChamber).toBe(true);
  });

  test("should clamp level to valid range (1-5)", async () => {
    const denTooLow = createTitanDen(0, { x: 5, y: 5 });
    expect(denTooLow.level).toBe(1);

    const denTooHigh = createTitanDen(10, { x: 5, y: 5 });
    expect(denTooHigh.level).toBe(5);
  });

  test("should set lastUsed to current timestamp", async () => {
    const before = Date.now();
    const den = createTitanDen(1, { x: 5, y: 5 });
    const after = Date.now();

    expect(den.lastUsed).toBeGreaterThanOrEqual(before);
    expect(den.lastUsed).toBeLessThanOrEqual(after);
  });
});

// ============================================================================
// TEST SUITE: Den Level Configuration Tests
// ============================================================================

test.describe("DEN_LEVEL_CONFIG", () => {
  test("should have configurations for all 5 levels", async () => {
    expect(DEN_LEVEL_CONFIG[1]).toBeDefined();
    expect(DEN_LEVEL_CONFIG[2]).toBeDefined();
    expect(DEN_LEVEL_CONFIG[3]).toBeDefined();
    expect(DEN_LEVEL_CONFIG[4]).toBeDefined();
    expect(DEN_LEVEL_CONFIG[5]).toBeDefined();
  });

  test("Level 1 config should have correct properties", async () => {
    const config = DEN_LEVEL_CONFIG[1];

    expect(config.buildingId).toBe("titan-den-1");
    expect(config.footprint).toEqual([2, 2]);
    expect(config.features.feedingBowl).toBe(true);
    expect(config.features.waterBowl).toBe(true);
    expect(config.features.sleepingArea).toBe(true);
    expect(config.upgradeCost).toBeUndefined(); // Level 1 has no upgrade cost
  });

  test("Level 2 config should include upgrade cost", async () => {
    const config = DEN_LEVEL_CONFIG[2];

    expect(config.buildingId).toBe("titan-den-2");
    expect(config.upgradeCost).toBeDefined();
    expect(config.upgradeCost).toBeGreaterThan(0);
  });

  test("Level 5 config should have largest footprint", async () => {
    const config = DEN_LEVEL_CONFIG[5];

    expect(config.buildingId).toBe("titan-den-5");
    expect(config.footprint[0]).toBeGreaterThanOrEqual(DEN_LEVEL_CONFIG[1].footprint[0]);
    expect(config.footprint[1]).toBeGreaterThanOrEqual(DEN_LEVEL_CONFIG[1].footprint[1]);
  });

  test("Upgrade costs should increase with level", async () => {
    const level2Cost = DEN_LEVEL_CONFIG[2].upgradeCost ?? 0;
    const level3Cost = DEN_LEVEL_CONFIG[3].upgradeCost ?? 0;
    const level4Cost = DEN_LEVEL_CONFIG[4].upgradeCost ?? 0;
    const level5Cost = DEN_LEVEL_CONFIG[5].upgradeCost ?? 0;

    expect(level3Cost).toBeGreaterThan(level2Cost);
    expect(level4Cost).toBeGreaterThan(level3Cost);
    expect(level5Cost).toBeGreaterThan(level4Cost);
  });
});

// ============================================================================
// TEST SUITE: Den Feature Effects Tests
// ============================================================================

test.describe("DEN_FEATURE_EFFECTS", () => {
  test("should have effects for all features", async () => {
    expect(DEN_FEATURE_EFFECTS.feedingBowl).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.waterBowl).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.sleepingArea).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.toyStorage).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.trainingDummy).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.miracleAltar).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.memoryShrine).toBeDefined();
    expect(DEN_FEATURE_EFFECTS.evolutionChamber).toBeDefined();
  });

  test("each effect should have description and effect function", async () => {
    for (const key of Object.keys(DEN_FEATURE_EFFECTS)) {
      const effect = DEN_FEATURE_EFFECTS[key as keyof typeof DEN_FEATURE_EFFECTS];
      expect(effect.description).toBeDefined();
      expect(typeof effect.description).toBe("string");
      expect(effect.description.length).toBeGreaterThan(0);
      expect(effect.effect).toBeDefined();
      expect(typeof effect.effect).toBe("function");
    }
  });
});

// ============================================================================
// TEST SUITE: upgradeDen Function Tests
// ============================================================================

test.describe("upgradeDen Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should upgrade den from level 1 to level 2", async () => {
    const den = createTitanDen(1, { x: 5, y: 5 });
    const upgraded = upgradeDen(den);

    expect(upgraded).not.toBeNull();
    expect(upgraded?.level).toBe(2);
    expect(upgraded?.buildingId).toBe("titan-den-2");
    expect(upgraded?.features.toyStorage).toBe(true);
    expect(upgraded?.features.trainingDummy).toBe(true);
  });

  test("should preserve position when upgrading", async () => {
    const den = createTitanDen(1, { x: 15, y: 25 });
    const upgraded = upgradeDen(den);

    expect(upgraded?.position.x).toBe(15);
    expect(upgraded?.position.y).toBe(25);
  });

  test("should return null when trying to upgrade level 5 den", async () => {
    const den = createTitanDen(5, { x: 5, y: 5 });
    const upgraded = upgradeDen(den);

    expect(upgraded).toBeNull();
  });

  test("should progressively upgrade through all levels", async () => {
    let den = createTitanDen(1, { x: 5, y: 5 });

    for (let expectedLevel = 2; expectedLevel <= 5; expectedLevel++) {
      const upgraded = upgradeDen(den);
      expect(upgraded).not.toBeNull();
      expect(upgraded?.level).toBe(expectedLevel);
      den = upgraded!;
    }

    // After level 5, should return null
    expect(upgradeDen(den)).toBeNull();
  });
});

// ============================================================================
// TEST SUITE: canUpgradeDen Function Tests
// ============================================================================

test.describe("canUpgradeDen Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should return canUpgrade: true for level 1 den (no skill requirements)", async () => {
    const titan = createTestTitan();

    // Level 1->2 has no skill requirement
    const den = createTitanDen(1, { x: 5, y: 5 });
    const result = canUpgradeDen(den, titan);

    expect(result.canUpgrade).toBe(true);
  });

  test("should return canUpgrade: false for level 2-4 dens with unmet skill requirements", async () => {
    const titan = createTestTitan();
    // Fresh Titan has level 1 skills, which don't meet the requirements

    for (let level = 2; level <= 4; level++) {
      const den = createTitanDen(level, { x: 5, y: 5 });
      const result = canUpgradeDen(den, titan);

      // Level 2->3 requires miracles level 3
      // Level 3->4 requires memory level 5 
      // Level 4->5 requires intelligence level 8
      // Fresh Titan has level 1 skills, so should fail
      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toBeDefined();
    }
  });

  test("should return canUpgrade: false for level 5 den with reason", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(5, { x: 5, y: 5 });
    const result = canUpgradeDen(den, titan);

    expect(result.canUpgrade).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason).toContain("max");
  });

  test("should check unlock requirements if defined", async () => {
    const titan = createTestTitan();
    // Ensure titan has low skill levels initially
    const den = createTitanDen(4, { x: 5, y: 5 }); // Level 4->5 might have skill requirements

    const result = canUpgradeDen(den, titan);

    // Should return result with reason if skill requirement not met
    expect(result).toBeDefined();
    expect(typeof result.canUpgrade).toBe("boolean");
  });
});

// ============================================================================
// TEST SUITE: getDenFeatures Function Tests
// ============================================================================

test.describe("getDenFeatures Function", () => {
  test("should return correct features for each level", async () => {
    // Level 1: Basic features only
    const level1Features = getDenFeatures(1);
    expect(level1Features.feedingBowl).toBe(true);
    expect(level1Features.waterBowl).toBe(true);
    expect(level1Features.sleepingArea).toBe(true);
    expect(level1Features.toyStorage).toBe(false);

    // Level 2: Adds toy storage and training dummy
    const level2Features = getDenFeatures(2);
    expect(level2Features.toyStorage).toBe(true);
    expect(level2Features.trainingDummy).toBe(true);

    // Level 3: Adds miracle altar
    const level3Features = getDenFeatures(3);
    expect(level3Features.miracleAltar).toBe(true);

    // Level 4: Adds memory shrine
    const level4Features = getDenFeatures(4);
    expect(level4Features.memoryShrine).toBe(true);

    // Level 5: Adds evolution chamber
    const level5Features = getDenFeatures(5);
    expect(level5Features.evolutionChamber).toBe(true);
  });

  test("should clamp invalid levels", async () => {
    const tooLow = getDenFeatures(0);
    expect(tooLow.feedingBowl).toBe(true); // Should act like level 1

    const tooHigh = getDenFeatures(100);
    expect(tooHigh.evolutionChamber).toBe(true); // Should act like level 5
  });
});

// ============================================================================
// TEST SUITE: isTitanAtDen Function Tests
// ============================================================================

test.describe("isTitanAtDen Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should return true when Titan is at den position", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 }); // Same as Titan's position

    const result = isTitanAtDen(titan, den);
    expect(result).toBe(true);
  });

  test("should return false when Titan is away from den", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 50, y: 50 }); // Different from Titan's position

    const result = isTitanAtDen(titan, den);
    expect(result).toBe(false);
  });

  test("should consider den footprint size for proximity", async () => {
    const titan = createTestTitan();
    // Titan at 10,10 - Den at 9,9 with 2x2 footprint should be "at" den
    const den = createTitanDen(1, { x: 9, y: 9 });

    const result = isTitanAtDen(titan, den);
    expect(result).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: applyDenEffects Function Tests
// ============================================================================

test.describe("applyDenEffects Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should apply effects when Titan is at den", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });

    // Reduce titan needs first
    titan.needs.hunger.current = 50;
    titan.needs.energy.current = 50;

    applyDenEffects(den, titan);

    // Effects should have been applied (hunger and energy increased)
    expect(titan.needs.hunger.current).toBeGreaterThan(50);
    expect(titan.needs.energy.current).toBeGreaterThan(50);
  });

  test("should update lastUsed timestamp", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });
    const originalLastUsed = den.lastUsed;

    // Wait a tiny bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    applyDenEffects(den, titan);

    expect(den.lastUsed).toBeGreaterThan(originalLastUsed);
  });
});

// ============================================================================
// TEST SUITE: Den Interaction Functions Tests
// ============================================================================

test.describe("useFeedingBowl Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should satisfy hunger when used", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });
    titan.needs.hunger.current = 50;

    const result = useFeedingBowl(titan, den);

    expect(result.success).toBe(true);
    expect(titan.needs.hunger.current).toBeGreaterThan(50);
    expect(result.message).toBeDefined();
  });

  test("should fail if den doesn't have feeding bowl", async () => {
    const titan = createTestTitan();
    // Create a mock den without feeding bowl feature
    const den = createTitanDen(1, { x: 10, y: 10 });
    den.features.feedingBowl = false;

    const result = useFeedingBowl(titan, den);

    expect(result.success).toBe(false);
  });

  test("should cap hunger at max value", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });
    titan.needs.hunger.current = 95;

    useFeedingBowl(titan, den);

    expect(titan.needs.hunger.current).toBeLessThanOrEqual(100);
  });
});

test.describe("useWaterBowl Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should provide hydration benefit", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });
    
    const result = useWaterBowl(titan, den);

    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });
});

test.describe("useSleepingArea Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should restore energy when used", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });
    titan.needs.energy.current = 30;

    const result = useSleepingArea(titan, den);

    expect(result.success).toBe(true);
    expect(titan.needs.energy.current).toBeGreaterThan(30);
    expect(result.message).toBeDefined();
  });

  test("should fail if den doesn't have sleeping area", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 });
    den.features.sleepingArea = false;

    const result = useSleepingArea(titan, den);

    expect(result.success).toBe(false);
  });
});

test.describe("useTrainingDummy Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should grant strength XP when used", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(2, { x: 10, y: 10 }); // Level 2+ has training dummy

    const result = useTrainingDummy(titan, den);

    expect(result.success).toBe(true);
    expect(result.xpGained).toBeGreaterThan(0);
  });

  test("should fail if den doesn't have training dummy", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(1, { x: 10, y: 10 }); // Level 1 doesn't have training dummy

    const result = useTrainingDummy(titan, den);

    expect(result.success).toBe(false);
    expect(result.xpGained).toBe(0);
  });
});

test.describe("useMiracleAltar Function", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("should reduce miracle cooldown when used", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(3, { x: 10, y: 10 }); // Level 3+ has miracle altar

    // Using 'heal' miracle for testing - Miracle is a string union type
    const result = useMiracleAltar(titan, den, "heal");

    expect(result.success).toBe(true);
    expect(result.cooldownReduction).toBeGreaterThan(0);
  });

  test("should fail if den doesn't have miracle altar", async () => {
    const titan = createTestTitan();
    const den = createTitanDen(2, { x: 10, y: 10 }); // Level 2 doesn't have miracle altar

    const result = useMiracleAltar(titan, den, "heal");

    expect(result.success).toBe(false);
    expect(result.cooldownReduction).toBe(0);
  });
});

// ============================================================================
// TEST SUITE: Constants Tests
// ============================================================================

test.describe("Constants", () => {
  test("MAX_DEN_LEVEL should be 5", async () => {
    expect(MAX_DEN_LEVEL).toBe(5);
  });

  test("MIN_DEN_LEVEL should be 1", async () => {
    expect(MIN_DEN_LEVEL).toBe(1);
  });
});

// ============================================================================
// TEST SUITE: TitanManager Integration Tests
// ============================================================================

test.describe("TitanManager Den Integration", () => {
  test.beforeEach(async () => {
    resetState();
  });

  test("TitanManager should have getTitanDen method", async () => {
    expect(TitanManager.getTitanDen).toBeDefined();
    expect(typeof TitanManager.getTitanDen).toBe("function");
  });

  test("TitanManager should have setTitanDen method", async () => {
    expect(TitanManager.setTitanDen).toBeDefined();
    expect(typeof TitanManager.setTitanDen).toBe("function");
  });

  test("TitanManager should have removeTitanDen method", async () => {
    expect(TitanManager.removeTitanDen).toBeDefined();
    expect(typeof TitanManager.removeTitanDen).toBe("function");
  });

  test("TitanManager should have canUpgradeTitanDen method", async () => {
    expect(TitanManager.canUpgradeTitanDen).toBeDefined();
    expect(typeof TitanManager.canUpgradeTitanDen).toBe("function");
  });

  test("TitanManager should have upgradeTitanDen method", async () => {
    expect(TitanManager.upgradeTitanDen).toBeDefined();
    expect(typeof TitanManager.upgradeTitanDen).toBe("function");
  });

  test("getTitanDen should return null when no den is set", async () => {
    createTestTitan();
    expect(TitanManager.getTitanDen()).toBeNull();
  });

  test("setTitanDen should store the den", async () => {
    createTestTitan();
    const den = createTitanDen(1, { x: 5, y: 5 });

    TitanManager.setTitanDen(den);

    expect(TitanManager.getTitanDen()).toBeDefined();
    expect(TitanManager.getTitanDen()?.level).toBe(1);
  });

  test("removeTitanDen should clear the stored den", async () => {
    createTestTitan();
    const den = createTitanDen(1, { x: 5, y: 5 });
    TitanManager.setTitanDen(den);

    TitanManager.removeTitanDen();

    expect(TitanManager.getTitanDen()).toBeNull();
  });

  test("upgradeTitanDen should upgrade the stored den", async () => {
    createTestTitan();
    const den = createTitanDen(1, { x: 5, y: 5 });
    TitanManager.setTitanDen(den);

    const result = TitanManager.upgradeTitanDen();

    expect(result).toBe(true);
    expect(TitanManager.getTitanDen()?.level).toBe(2);
  });

  test("upgradeTitanDen should return false when no den exists", async () => {
    createTestTitan();
    const result = TitanManager.upgradeTitanDen();

    expect(result).toBe(false);
  });
});

// ============================================================================
// TEST SUITE: Serialization Tests
// ============================================================================

test.describe("Titan Den Serialization", () => {
  test("should be JSON serializable", async () => {
    const den = createTitanDen(3, { x: 15, y: 25 });

    const serialized = JSON.stringify(den);
    const deserialized = JSON.parse(serialized) as TitanDen;

    expect(deserialized.level).toBe(3);
    expect(deserialized.buildingId).toBe("titan-den-3");
    expect(deserialized.position.x).toBe(15);
    expect(deserialized.position.y).toBe(25);
    expect(deserialized.features.miracleAltar).toBe(true);
  });
});
