import { test, expect } from "@playwright/test";

/**
 * Tests for God Hand Cursor System (Hero Pet System - Task 2-4)
 *
 * The God Hand is a special cursor mode for divine interaction with the Titan,
 * inspired by Black & White's iconic floating hand.
 *
 * God Hand States:
 * - inactive: Normal cursor mode
 * - active: God Hand visible, hovering
 * - grasping: Holding something
 * - praising: Dragging down = positive
 * - punishing: Dragging up = negative
 */

// Import types from lib files (these work in Playwright context)
import {
  GOD_HAND_STATES,
  GOD_HAND_STATE_DESCRIPTIONS,
} from "@/components/titan/GodHandCursor";

// =============================================================================
// Helper Functions
// =============================================================================

async function startGame(page: import("@playwright/test").Page) {
  await page
    .waitForLoadState("networkidle", { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(2000);

  const startButton = page
    .locator("button")
    .filter({ hasText: /New Game|Continue/i })
    .first();

  try {
    await startButton.waitFor({ state: "visible", timeout: 20000 });
    await startButton.click({ force: true });
    await page
      .waitForSelector("canvas", { state: "visible", timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(4000);
  } catch {
    const loadExampleButton = page
      .locator("button")
      .filter({ hasText: /Load Example/i })
      .first();
    if (
      await loadExampleButton.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await loadExampleButton.click({ force: true });
      await page
        .waitForSelector("canvas", { state: "visible", timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(4000);
    }
  }
  
  // Wait for test hooks to be available (GodHandProvider needs to render)
  await page.waitForFunction(
    // @ts-expect-error - window.__TEST_HOOKS__ is set by GodHandProvider
    () => typeof window.__TEST_HOOKS__?.activateGodHand === "function",
    { timeout: 10000 }
  ).catch(() => {
    // Hooks may not be available in this environment
  });
}

// =============================================================================
// Test Suite: GodHandState Constants (Unit Tests - No Browser)
// =============================================================================

test.describe("GodHandState Constants", () => {
  test("should define all 5 states", async () => {
    expect(GOD_HAND_STATES).toHaveLength(5);
    expect(GOD_HAND_STATES).toContain("inactive");
    expect(GOD_HAND_STATES).toContain("active");
    expect(GOD_HAND_STATES).toContain("grasping");
    expect(GOD_HAND_STATES).toContain("praising");
    expect(GOD_HAND_STATES).toContain("punishing");
  });

  test("should have correct state descriptions", async () => {
    expect(GOD_HAND_STATE_DESCRIPTIONS.inactive).toBeDefined();
    expect(GOD_HAND_STATE_DESCRIPTIONS.active).toBeDefined();
    expect(GOD_HAND_STATE_DESCRIPTIONS.grasping).toBeDefined();
    expect(GOD_HAND_STATE_DESCRIPTIONS.praising).toBeDefined();
    expect(GOD_HAND_STATE_DESCRIPTIONS.punishing).toBeDefined();

    Object.values(GOD_HAND_STATE_DESCRIPTIONS).forEach((desc) => {
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(5);
    });
  });
});

// =============================================================================
// Test Suite: God Hand Integration (Browser Tests)
// =============================================================================

test.describe("God Hand Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("God Hand toggle button should be present", async ({ page }) => {
    const toggleButton = page.locator('[data-testid="god-hand-toggle"]');
    const isPresent = await toggleButton.count();
    expect(isPresent).toBeGreaterThan(0);
  });

  test("God Hand help text should be present", async ({ page }) => {
    const helpText = page.locator('[data-testid="god-hand-help"]');
    const isPresent = await helpText.count();
    expect(isPresent).toBeGreaterThan(0);
  });

  test("test hooks should be exposed", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      return {
        hasActivate: typeof hooks?.activateGodHand === "function",
        hasDeactivate: typeof hooks?.deactivateGodHand === "function",
        hasToggle: typeof hooks?.toggleGodHand === "function",
        hasStateGetter: typeof hooks?.useGodHandState === "function",
      };
    });

    expect(result.hasActivate).toBe(true);
    expect(result.hasDeactivate).toBe(true);
    expect(result.hasToggle).toBe(true);
    expect(result.hasStateGetter).toBe(true);
  });

  test("should start in inactive state", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState) return { error: "hooks not available" };
      return hooks.useGodHandState();
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.state).toBe("inactive");
      expect(result.isActive).toBe(false);
    }
  });

  test("activate should transition to active state", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState || !hooks?.activateGodHand) {
        return { error: "hooks not available" };
      }

      hooks.activateGodHand();
      return hooks.useGodHandState();
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.state).toBe("active");
      expect(result.isActive).toBe(true);
    }
  });

  test("deactivate should transition to inactive state", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState || !hooks?.activateGodHand || !hooks?.deactivateGodHand) {
        return { error: "hooks not available" };
      }

      hooks.activateGodHand();
      hooks.deactivateGodHand();
      return hooks.useGodHandState();
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.state).toBe("inactive");
      expect(result.isActive).toBe(false);
    }
  });

  test("toggle should switch between active and inactive", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState || !hooks?.toggleGodHand) {
        return { error: "hooks not available" };
      }

      const initial = hooks.useGodHandState().state;
      hooks.toggleGodHand();
      const afterFirst = hooks.useGodHandState().state;
      hooks.toggleGodHand();
      const afterSecond = hooks.useGodHandState().state;

      return { initial, afterFirst, afterSecond };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.initial).toBe("inactive");
      expect(result.afterFirst).toBe("active");
      expect(result.afterSecond).toBe("inactive");
    }
  });
});

// =============================================================================
// Test Suite: Keyboard Shortcuts
// =============================================================================

test.describe("God Hand Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("'G' key should toggle God Hand mode", async ({ page }) => {
    // Press 'G' to activate
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    const afterPress = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState) return { error: "hooks not available" };
      return hooks.useGodHandState();
    });

    if ("error" in afterPress) {
      expect(afterPress.error).toBeUndefined();
    } else {
      expect(afterPress.isActive).toBe(true);
    }

    // Press 'G' again to deactivate
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    const afterSecondPress = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState) return { error: "hooks not available" };
      return hooks.useGodHandState();
    });

    if ("error" in afterSecondPress) {
      expect(afterSecondPress.error).toBeUndefined();
    } else {
      expect(afterSecondPress.isActive).toBe(false);
    }
  });

  test("'P' key should trigger praise when active and over Titan", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.activateGodHand || !hooks?.setIsOverTitan || !hooks?.setOnPraise) {
        return { error: "hooks not available" };
      }

      hooks.activateGodHand();
      hooks.setIsOverTitan(true);

      return { ready: true };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      // Press 'P' for praise
      await page.keyboard.press("p");
      await page.waitForTimeout(200);

      const praiseResult = await page.evaluate(() => {
        // @ts-expect-error - access test hooks
        return window.__TEST_HOOKS__?.getPraiseTriggered?.() ?? false;
      });

      expect(praiseResult).toBe(true);
    }
  });

  test("'U' key should trigger punish when active and over Titan", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.activateGodHand || !hooks?.setIsOverTitan) {
        return { error: "hooks not available" };
      }

      hooks.activateGodHand();
      hooks.setIsOverTitan(true);

      return { ready: true };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      await page.keyboard.press("u");
      await page.waitForTimeout(200);

      const punishResult = await page.evaluate(() => {
        // @ts-expect-error - access test hooks
        return window.__TEST_HOOKS__?.getPunishTriggered?.() ?? false;
      });

      expect(punishResult).toBe(true);
    }
  });
});

// =============================================================================
// Test Suite: Visual Feedback
// =============================================================================

test.describe("God Hand Visual Feedback", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("cursor should be hidden when God Hand is active", async ({ page }) => {
    // Activate God Hand
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    // Check for custom cursor CSS
    const cursorStyle = await page.evaluate(() => {
      return document.body.style.cursor;
    });

    expect(cursorStyle).toBe("none");
  });

  test("God Hand cursor element should be visible when active", async ({ page }) => {
    // Check cursor is not visible initially
    let cursor = page.locator('[data-testid="god-hand-cursor"]');
    const initialVisibility = await cursor.isVisible().catch(() => false);
    expect(initialVisibility).toBe(false);

    // Activate God Hand
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    // Cursor should now be visible
    cursor = page.locator('[data-testid="god-hand-cursor"]');
    const activeVisibility = await cursor.isVisible();
    expect(activeVisibility).toBe(true);
  });

  test("should show hand emoji for active state", async ({ page }) => {
    // Activate God Hand
    await page.keyboard.press("g");
    await page.waitForTimeout(200);

    const cursorContent = await page.locator('[data-testid="god-hand-cursor"]').textContent();
    expect(cursorContent).toContain("🖐️");
  });
});

// =============================================================================
// Test Suite: Gesture State Tracking
// =============================================================================

test.describe("God Hand Gesture State", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should track gesture start position", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.activateGodHand || !hooks?.useGodHandState) {
        return { error: "hooks not available" };
      }

      hooks.activateGodHand();
      const state = hooks.useGodHandState();
      return { gestureStart: state.gestureStart };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.gestureStart).toBeNull();
    }
  });

  test("should expose target position tracking", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState || !hooks?.setTargetPosition) {
        return { error: "hooks not available" };
      }

      hooks.setTargetPosition({ x: 100, y: 200 });
      const state = hooks.useGodHandState();
      return { targetPosition: state.targetPosition };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(result.targetPosition).toEqual({ x: 100, y: 200 });
    }
  });

  test("should track isOverTitan state", async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (!hooks?.useGodHandState) {
        return { error: "hooks not available" };
      }

      const initialState = hooks.useGodHandState();
      const initial = initialState.isOverTitan;

      hooks.setIsOverTitan?.(true);
      const afterSet = hooks.useGodHandState().isOverTitan;

      return { initial, afterSet };
    });

    if ("error" in result) {
      expect(result.error).toBeUndefined();
    } else {
      expect(typeof result.initial).toBe("boolean");
      expect(result.afterSet).toBe(true);
    }
  });
});

// =============================================================================
// Test Suite: Accessibility
// =============================================================================

test.describe("God Hand Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have aria-live region for announcements", async ({ page }) => {
    const liveRegion = await page.locator('[aria-live="polite"]').count();
    expect(liveRegion).toBeGreaterThan(0);
  });

  test("help text should contain keyboard shortcuts", async ({ page }) => {
    const helpText = await page.locator('[data-testid="god-hand-help"]').textContent();
    expect(helpText).toContain("G");
    expect(helpText).toContain("P");
    expect(helpText).toContain("praise");
  });
});
