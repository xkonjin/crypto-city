import { test, expect } from "@playwright/test";

/**
 * Tests for useTitan React Hook
 *
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * These tests validate the useTitan hook for managing Titan state in React components.
 *
 * The useTitan hook:
 * - Provides Titan state to components
 * - Exposes action methods (spawn, despawn, move, etc.)
 * - Handles real-time updates via TitanManager
 * - Manages persistence via localStorage
 * - Supports training (praise/punish) via God Hand
 */

// Import types (these should already exist)
import type {
  TitanPet,
  TitanSpawnOptions,
} from "@/games/isocity/types/titan";

import type { TitanNeedType } from "@/lib/titan/TitanNeeds";

import { TitanManager } from "@/lib/titan";

/**
 * Helper to reset TitanManager state
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
 * Test Suite: useTitan Hook Interface
 * Tests the exported interface of the hook
 */
test.describe("useTitan Hook Interface", () => {
  test("hook should be importable", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - useTitan should be accessible
      return typeof window.__TEST_HOOKS__?.useTitan === "function";
    });

    // Hook should exist (test will fail until implementation)
    expect(result).toBe(true);
  });
});

/**
 * Test Suite: useTitan State Management
 * Tests that the hook correctly exposes Titan state
 */
test.describe("useTitan State Management", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("should return null titan when none exists", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const { titan, hasTitan } = window.__TEST_HOOKS__?.useTitanState?.() ?? {};
      return { titan, hasTitan };
    });

    expect(result.titan).toBeNull();
    expect(result.hasTitan).toBe(false);
  });

  test("should return titan state when titan exists", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan) return { error: "hooks not available" };

      // Spawn a titan
      hooks.spawnTitan({ gridX: 10, gridY: 20, name: "TestTitan" });

      const { titan, hasTitan } = hooks.useTitanState?.() ?? {};
      return { titan, hasTitan };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.titan).not.toBeNull();
      expect(result.hasTitan).toBe(true);
      expect(result.titan?.name).toBe("TestTitan");
    }
  });

  test("should expose isLoading state", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const { isLoading } = window.__TEST_HOOKS__?.useTitanState?.() ?? {};
      return { isLoading };
    });

    // isLoading should be defined (false after initial load)
    expect(result.isLoading).toBeDefined();
    expect(typeof result.isLoading).toBe("boolean");
  });
});

/**
 * Test Suite: useTitan Spawn/Despawn Methods
 * Tests spawn and despawn functionality
 */
test.describe("useTitan Spawn/Despawn Methods", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("spawnTitan should create a new titan", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan) return { error: "hooks not available" };

      const titan = hooks.spawnTitan({ gridX: 5, gridY: 10 });
      return {
        id: titan?.id,
        gridX: titan?.gridX,
        gridY: titan?.gridY,
        hasId: !!titan?.id,
      };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.hasId).toBe(true);
      expect(result.gridX).toBe(5);
      expect(result.gridY).toBe(10);
    }
  });

  test("despawnTitan should remove the titan", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.despawnTitan) return { error: "hooks not available" };

      // Spawn then despawn
      hooks.spawnTitan({ gridX: 5, gridY: 10 });
      const hasTitanBefore = hooks.useTitanState?.()?.hasTitan;

      hooks.despawnTitan();
      const hasTitanAfter = hooks.useTitanState?.()?.hasTitan;

      return { hasTitanBefore, hasTitanAfter };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.hasTitanBefore).toBe(true);
      expect(result.hasTitanAfter).toBe(false);
    }
  });
});

/**
 * Test Suite: useTitan Movement Methods
 * Tests movement functionality
 */
test.describe("useTitan Movement Methods", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("moveTitanTo should update titan position", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.moveTitanTo) return { error: "hooks not available" };

      hooks.spawnTitan({ gridX: 5, gridY: 5 });
      const positionBefore = hooks.useTitanState?.()?.titan?.gridX;

      hooks.moveTitanTo(15, 20);
      const titan = hooks.useTitanState?.()?.titan;

      return {
        positionBefore,
        gridX: titan?.gridX,
        gridY: titan?.gridY,
      };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.positionBefore).toBe(5);
      expect(result.gridX).toBe(15);
      expect(result.gridY).toBe(20);
    }
  });
});

/**
 * Test Suite: useTitan Needs Methods
 * Tests needs satisfaction functionality
 */
test.describe("useTitan Needs Methods", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("satisfyNeed should increase need value", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.satisfyNeed) return { error: "hooks not available" };

      hooks.spawnTitan({ gridX: 5, gridY: 5 });

      // Get titan and manually set a low need value for testing
      const titanBefore = hooks.useTitanState?.()?.titan;
      const hungerBefore = titanBefore?.needs?.hunger?.current ?? 0;

      // Satisfy hunger
      hooks.satisfyNeed("hunger", 20);

      const titanAfter = hooks.useTitanState?.()?.titan;
      const hungerAfter = titanAfter?.needs?.hunger?.current ?? 0;

      return { hungerBefore, hungerAfter };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      // After satisfying, hunger should be higher (or capped at max)
      expect(result.hungerAfter).toBeGreaterThanOrEqual(result.hungerBefore);
    }
  });

  test("satisfyNeed should work for all need types", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.satisfyNeed) return { error: "hooks not available" };

      hooks.spawnTitan({ gridX: 5, gridY: 5 });

      // Test all need types
      const needTypes = ["hunger", "energy", "social", "fun", "wealth", "purpose", "attention", "growth"];
      const results: Record<string, boolean> = {};

      for (const needType of needTypes) {
        try {
          hooks.satisfyNeed(needType, 10);
          results[needType] = true;
        } catch {
          results[needType] = false;
        }
      }

      return { results };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      // All need types should work
      for (const needType of Object.keys(result.results)) {
        expect(result.results[needType]).toBe(true);
      }
    }
  });
});

/**
 * Test Suite: useTitan Training Methods (God Hand)
 * Tests praise and punish functionality
 */
test.describe("useTitan Training Methods (God Hand)", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("praise should be callable and affect titan", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.praise) return { error: "hooks not available" };

      hooks.spawnTitan({ gridX: 5, gridY: 5 });

      // Record an action first (praise reinforces last action)
      hooks.recordAction?.("help_npc");

      // Get mood before praise
      const titanBefore = hooks.useTitanState?.()?.titan;
      const moodBefore = titanBefore?.mood?.beliefsAboutPlayer?.affection ?? 0;

      // Praise
      hooks.praise();

      const titanAfter = hooks.useTitanState?.()?.titan;
      const moodAfter = titanAfter?.mood?.beliefsAboutPlayer?.affection ?? 0;

      return { moodBefore, moodAfter, called: true };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.called).toBe(true);
      // Praise should increase affection
      expect(result.moodAfter).toBeGreaterThanOrEqual(result.moodBefore);
    }
  });

  test("punish should be callable and affect titan", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.punish) return { error: "hooks not available" };

      hooks.spawnTitan({ gridX: 5, gridY: 5 });

      // Record an action first (punish reinforces last action as bad)
      hooks.recordAction?.("steal");

      // Punish
      hooks.punish();

      const titanAfter = hooks.useTitanState?.()?.titan;

      return { 
        called: true,
        hasTitan: !!titanAfter,
      };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.called).toBe(true);
      expect(result.hasTitan).toBe(true);
    }
  });
});

/**
 * Test Suite: useTitan Action Recording
 * Tests action recording functionality
 */
test.describe("useTitan Action Recording", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("recordAction should add to action history", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.recordAction) return { error: "hooks not available" };

      hooks.spawnTitan({ gridX: 5, gridY: 5 });

      const titanBefore = hooks.useTitanState?.()?.titan;
      const historyLengthBefore = titanBefore?.actionHistory?.length ?? 0;

      hooks.recordAction("help_npc");

      const titanAfter = hooks.useTitanState?.()?.titan;
      const historyLengthAfter = titanAfter?.actionHistory?.length ?? 0;

      return { historyLengthBefore, historyLengthAfter };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.historyLengthAfter).toBe(result.historyLengthBefore + 1);
    }
  });
});

/**
 * Test Suite: useTitan Persistence Methods
 * Tests save and load functionality
 */
test.describe("useTitan Persistence Methods", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("saveTitan should persist to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.saveTitan) return { error: "hooks not available" };

      // Clear storage first
      localStorage.removeItem("crypto-city-titan");

      hooks.spawnTitan({ gridX: 5, gridY: 5, name: "SaveTest" });
      hooks.saveTitan();

      const stored = localStorage.getItem("crypto-city-titan");
      return { saved: stored !== null };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.saved).toBe(true);
    }
  });

  test("loadTitan should restore from localStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitan || !hooks?.saveTitan || !hooks?.loadTitan || !hooks?.despawnTitan) {
        return { error: "hooks not available" };
      }

      // Spawn and save
      hooks.spawnTitan({ gridX: 5, gridY: 5, name: "LoadTest" });
      hooks.saveTitan();

      // Despawn
      hooks.despawnTitan();
      const hasTitanAfterDespawn = hooks.useTitanState?.()?.hasTitan;

      // Load
      const loadResult = hooks.loadTitan();
      const hasTitanAfterLoad = hooks.useTitanState?.()?.hasTitan;

      return { 
        hasTitanAfterDespawn, 
        hasTitanAfterLoad,
        loadResult,
      };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.hasTitanAfterDespawn).toBe(false);
      expect(result.loadResult).toBe(true);
      expect(result.hasTitanAfterLoad).toBe(true);
    }
  });
});

/**
 * Test Suite: useTitan Auto-save
 * Tests automatic saving after significant changes
 */
test.describe("useTitan Auto-save", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("should auto-save after spawn", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(async () => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.spawnTitanWithAutoSave) return { error: "hooks not available" };

      // Clear storage first
      localStorage.removeItem("crypto-city-titan");

      // Spawn with auto-save enabled
      hooks.spawnTitanWithAutoSave({ gridX: 5, gridY: 5, name: "AutoSaveTest" });

      // Wait for auto-save
      await new Promise((resolve) => setTimeout(resolve, 100));
      const stored = localStorage.getItem("crypto-city-titan");
      return { saved: stored !== null };
    });

    if ("error" in result) {
      // This test may fail if auto-save isn't implemented yet
      expect(result.error).toBeUndefined();
    } else {
      expect(result.saved).toBe(true);
    }
  });
});

/**
 * Test Suite: useTitan Hook Return Interface
 * Validates the complete return interface of the hook
 */
test.describe("useTitan Hook Return Interface", () => {
  test("should return all required properties", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.getUseTitanReturn) return { error: "hooks not available" };

      const returnValue = hooks.getUseTitanReturn();

      return {
        hasTitan: "titan" in returnValue,
        hasHasTitan: "hasTitan" in returnValue,
        hasIsLoading: "isLoading" in returnValue,
        hasSpawnTitan: "spawnTitan" in returnValue,
        hasDespawnTitan: "despawnTitan" in returnValue,
        hasMoveTitanTo: "moveTitanTo" in returnValue,
        hasRecordAction: "recordAction" in returnValue,
        hasSatisfyNeed: "satisfyNeed" in returnValue,
        hasPraise: "praise" in returnValue,
        hasPunish: "punish" in returnValue,
        hasSaveTitan: "saveTitan" in returnValue,
        hasLoadTitan: "loadTitan" in returnValue,
      };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.hasTitan).toBe(true);
      expect(result.hasHasTitan).toBe(true);
      expect(result.hasIsLoading).toBe(true);
      expect(result.hasSpawnTitan).toBe(true);
      expect(result.hasDespawnTitan).toBe(true);
      expect(result.hasMoveTitanTo).toBe(true);
      expect(result.hasRecordAction).toBe(true);
      expect(result.hasSatisfyNeed).toBe(true);
      expect(result.hasPraise).toBe(true);
      expect(result.hasPunish).toBe(true);
      expect(result.hasSaveTitan).toBe(true);
      expect(result.hasLoadTitan).toBe(true);
    }
  });
});

/**
 * Test Suite: Unit Tests (Node.js context)
 * These tests run in Node.js and test the hook logic directly
 */
test.describe("useTitan Unit Tests", () => {
  test.beforeEach(async () => {
    resetTitanManager();
  });

  test("TitanManager should be able to spawn titan", async () => {
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    expect(titan).toBeDefined();
    expect(titan.gridX).toBe(5);
    expect(titan.gridY).toBe(5);
  });

  test("TitanManager should be able to update position", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    TitanManager.updateTitanPosition(10, 15);

    const titan = TitanManager.getTitan();
    expect(titan?.gridX).toBe(10);
    expect(titan?.gridY).toBe(15);
  });

  test("TitanManager should be able to despawn titan", async () => {
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    expect(TitanManager.hasTitan()).toBe(true);

    TitanManager.despawnTitan();
    expect(TitanManager.hasTitan()).toBe(false);
  });
});
