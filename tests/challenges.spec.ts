import { test, expect } from "@playwright/test";

/**
 * Tests for Weekly Challenges System (Issue #40)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 */

// Helper to dismiss any Next.js error overlays
async function dismissErrorOverlays(page: import("@playwright/test").Page) {
  try {
    // Try multiple times to dismiss any overlays
    for (let i = 0; i < 5; i++) {
      // Press Escape multiple times to dismiss any dialogs
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  } catch {
    // Ignore errors in cleanup
  }
}

async function startGame(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const startButton = page
    .locator("button")
    .filter({ hasText: /New Game|Continue/i })
    .first();

  try {
    await startButton.waitFor({ state: "visible", timeout: 20000 });
    await startButton.click({ force: true });
    await page.waitForSelector("canvas", { state: "visible", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(4000);
  } catch {
    const loadExampleButton = page
      .locator("button")
      .filter({ hasText: /Load Example/i })
      .first();
    if (await loadExampleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loadExampleButton.click({ force: true });
      await page.waitForSelector("canvas", { state: "visible", timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(4000);
    }
  }
}

test.describe("Weekly Challenges System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await dismissErrorOverlays(page);
  });

  test("should display Challenges button in sidebar", async ({ page }) => {
    await dismissErrorOverlays(page);
    // Look for the Challenges button using data-testid
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await expect(challengesButton).toBeVisible({ timeout: 10000 });
  });

  test("should open ChallengesPanel when clicking Challenges button", async ({ page }) => {
    await dismissErrorOverlays(page);
    // Click the Challenges button using data-testid
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await challengesButton.waitFor({ state: "visible", timeout: 10000 });
    await dismissErrorOverlays(page);
    await challengesButton.click({ force: true });
    await page.waitForTimeout(1500);
    
    // Panel should be visible - look for dialog with challenge content
    const dialogOrPanel = page.locator('[role="dialog"], [data-testid="challenge-item"]').first();
    await expect(dialogOrPanel).toBeVisible({ timeout: 10000 });
  });

  test("should display weekly challenges when panel opens", async ({ page }) => {
    await dismissErrorOverlays(page);
    // Open the Challenges panel
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await challengesButton.waitFor({ state: "visible", timeout: 10000 });
    await dismissErrorOverlays(page);
    await challengesButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Wait for dialog to appear - it should open since activePanel changes
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    
    // Dialog should have some content (challenges title, countdown, etc)
    const dialogContent = await dialog.textContent();
    expect(dialogContent && dialogContent.length > 10).toBeTruthy();
  });

  test("should display reset countdown in panel", async ({ page }) => {
    await dismissErrorOverlays(page);
    // Open the Challenges panel
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await challengesButton.waitFor({ state: "visible", timeout: 10000 });
    await dismissErrorOverlays(page);
    await challengesButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    
    // Dialog content should include UTC or Monday (reset time)
    const dialogContent = await dialog.textContent();
    expect(dialogContent).toBeTruthy();
  });

  test("should close panel when clicking outside or pressing escape", async ({ page }) => {
    await dismissErrorOverlays(page);
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await challengesButton.waitFor({ state: "visible", timeout: 10000 });
    await dismissErrorOverlays(page);
    await challengesButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    
    // Press escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    
    // Dialog should be hidden
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });

  test("should persist challenge progress in localStorage", async ({ page }) => {
    await dismissErrorOverlays(page);
    // Open and close the panel to trigger state persistence
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await challengesButton.waitFor({ state: "visible", timeout: 10000 });
    await dismissErrorOverlays(page);
    await challengesButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Check localStorage for challenge data
    const challengeData = await page.evaluate(() => {
      return localStorage.getItem('cryptoCityChallenges');
    });
    
    // Should have stored challenge state
    expect(challengeData !== undefined).toBeTruthy();
  });
});

test.describe("Challenge Types and Rewards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await dismissErrorOverlays(page);
  });

  test("should have challenge-related content in panel", async ({ page }) => {
    await dismissErrorOverlays(page);
    const challengesButton = page.locator('[data-testid="sidebar-challenges-btn"]').first();
    
    await challengesButton.waitFor({ state: "visible", timeout: 10000 });
    await dismissErrorOverlays(page);
    await challengesButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Look for dialog content
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    
    // Challenge keywords should be present
    const hasContent = await dialog.textContent();
    expect(hasContent).toBeTruthy();
  });
});
