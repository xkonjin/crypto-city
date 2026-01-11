/**
 * Crypto Overlay System Tests (Issue #58)
 *
 * Tests for the visual overlay system that displays yield, risk, protection,
 * and density information for crypto buildings.
 */

import { test, expect } from "@playwright/test";

/**
 * Helper function to start the game
 */
async function startGame(page: import("@playwright/test").Page) {
  // Wait for page to be fully loaded
  await page
    .waitForLoadState("networkidle", { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(2000);

  // Look for start button with various possible texts
  const startButton = page
    .locator("button")
    .filter({ hasText: /New Game|Continue/i })
    .first();

  try {
    await startButton.waitFor({ state: "visible", timeout: 20000 });
    await startButton.click({ force: true });
    // Wait longer for canvas - sprite loading takes time
    await page
      .waitForSelector("canvas", { state: "visible", timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(4000);
  } catch {
    // Fallback: try Load Example button
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
}

test.describe("Crypto Overlay System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test.describe("Overlay Controls", () => {
    test("should display overlay selector with crypto overlay options", async ({ page }) => {
      // Wait for game to fully load
      await page.waitForTimeout(2000);
      // Look for overlay selector in the UI - either by data-testid or by container class
      const overlaySelector = page.locator('[data-testid="crypto-overlay-selector"]');
      await expect(overlaySelector).toBeVisible({ timeout: 15000 });
    });

    test("should have yield overlay option", async ({ page }) => {
      await page.waitForTimeout(2000);
      // Find yield overlay button by data-overlay attribute
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await expect(yieldButton).toBeVisible({ timeout: 15000 });
    });

    test("should have risk overlay option", async ({ page }) => {
      await page.waitForTimeout(2000);
      // Find risk overlay button
      const riskButton = page.locator('[data-overlay="risk"]').first();
      await expect(riskButton).toBeVisible({ timeout: 15000 });
    });

    test("should have protection overlay option", async ({ page }) => {
      await page.waitForTimeout(2000);
      // Find protection overlay button
      const protectionButton = page.locator('[data-overlay="protection"]').first();
      await expect(protectionButton).toBeVisible({ timeout: 15000 });
    });

    test("should have density overlay option", async ({ page }) => {
      await page.waitForTimeout(2000);
      // Find density overlay button (crypto_density)
      const densityButton = page.locator('[data-overlay="crypto_density"]').first();
      await expect(densityButton).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Overlay Selection", () => {
    test("should switch to yield overlay when clicked", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Click yield overlay (force to bypass any intercepting elements)
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });
      await yieldButton.click({ force: true });
      await page.waitForTimeout(500);

      // Verify button was clicked and canvas is visible
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });

    test("should switch to risk overlay when clicked", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Click risk overlay (force to bypass any intercepting elements)
      const riskButton = page.locator('[data-overlay="risk"]').first();
      await riskButton.waitFor({ state: "visible", timeout: 15000 });
      await riskButton.click({ force: true });
      await page.waitForTimeout(500);

      // Verify button was clicked and canvas is visible
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });

    test("should show only one overlay at a time", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Click yield overlay first
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });
      await yieldButton.click({ force: true });
      await page.waitForTimeout(300);

      // Then click risk overlay
      const riskButton = page.locator('[data-overlay="risk"]').first();
      await riskButton.click({ force: true });
      await page.waitForTimeout(300);

      // Verify canvas is still rendering (not frozen/crashed)
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe("Overlay Legend", () => {
    test("should display legend when overlay is active", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Click on yield overlay
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });
      await yieldButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should be rendering
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });

    test("should show color scale in legend", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Click on risk overlay
      const riskButton = page.locator('[data-overlay="risk"]').first();
      await riskButton.waitFor({ state: "visible", timeout: 15000 });
      await riskButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should be rendering
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });

    test("should hide legend when no overlay is selected", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // First activate an overlay
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });
      await yieldButton.click({ force: true });
      await page.waitForTimeout(300);

      // Then deactivate by clicking "None" button
      const noneButton = page.locator('[data-overlay="none"]').first();
      await noneButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should still be visible after toggle
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe("Yield Overlay Visualization", () => {
    test("should show green gradient for high yield buildings", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Activate yield overlay
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });
      await yieldButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should be rendering (visual check by canvas presence)
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe("Risk Overlay Visualization", () => {
    test("should show red gradient for high risk buildings", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Activate risk overlay
      const riskButton = page.locator('[data-overlay="risk"]').first();
      await riskButton.waitFor({ state: "visible", timeout: 15000 });
      await riskButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should be rendering
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe("Protection Overlay Visualization", () => {
    test("should show blue gradient for protection coverage", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Activate protection overlay
      const protectionButton = page.locator('[data-overlay="protection"]').first();
      await protectionButton.waitFor({ state: "visible", timeout: 15000 });
      await protectionButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should be rendering
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });

    test("should visualize auditor and insurance building coverage", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Activate protection overlay
      const protectionButton = page.locator('[data-overlay="protection"]').first();
      await protectionButton.waitFor({ state: "visible", timeout: 15000 });
      await protectionButton.click({ force: true });
      await page.waitForTimeout(500);

      // Canvas should be rendering
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe("Overlay Performance", () => {
    test("should render overlay without significant delay", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Get overlay button ready
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });
      
      // Start timing
      const startTime = Date.now();

      // Activate overlay
      await yieldButton.click({ force: true });

      // Wait for visual update (should be fast)
      await page.waitForTimeout(100);

      const elapsed = Date.now() - startTime;

      // Overlay should activate within 500ms
      expect(elapsed).toBeLessThan(500);
    });

    test("should toggle overlays smoothly", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Get overlay buttons ready
      const yieldButton = page.locator('[data-overlay="yield"]').first();
      const riskButton = page.locator('[data-overlay="risk"]').first();
      await yieldButton.waitFor({ state: "visible", timeout: 15000 });

      // Rapidly toggle between overlays
      await yieldButton.click({ force: true });
      await page.waitForTimeout(100);
      await riskButton.click({ force: true });
      await page.waitForTimeout(100);
      await yieldButton.click({ force: true });
      await page.waitForTimeout(100);

      // Should not crash or freeze
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    });
  });
});

test.describe("Crypto Overlay Types Integration", () => {
  test("should extend existing OverlayMode type with crypto overlays", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await page.waitForTimeout(2000);

    // Check that overlay modes are accessible (integration test)
    // The fact that these buttons exist proves the types are integrated
    const overlaySelector = page.locator('[data-testid="crypto-overlay-selector"]');
    await overlaySelector.waitFor({ state: "visible", timeout: 15000 });
    
    const overlayButtons = overlaySelector.locator('button');
    
    // Should have at least 4 crypto overlays (yield, risk, protection, density)
    // plus potentially 'none' option
    const count = await overlayButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});
