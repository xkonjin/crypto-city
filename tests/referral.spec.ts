import { test, expect } from "@playwright/test";

/**
 * Referral System Tests
 * Tests for the referral system implementation (Issue #38)
 */

/**
 * Helper to dismiss error overlays that might appear
 */
async function dismissErrorOverlays(page: import("@playwright/test").Page) {
  try {
    const errorDialog = page.locator('dialog[aria-label*="Console"]').first();
    if (await errorDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } catch {
    // Ignore errors in cleanup
  }
}

/**
 * Helper to start the game
 */
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
}

/**
 * Helper to dismiss Cobie dialog and tutorial if visible
 */
async function dismissDialogs(page: import("@playwright/test").Page) {
  // Press Escape multiple times to dismiss any dialogs
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  
  // Also try clicking "Got it" for Cobie if visible
  try {
    const cobieGotIt = page.locator("button").filter({ hasText: /Got it/i }).first();
    if (await cobieGotIt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cobieGotIt.click({ force: true });
      await page.waitForTimeout(300);
    }
  } catch {
    // Ignore
  }
  
  // Press Escape again to dismiss tutorial
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

test.describe("Referral System", () => {
  test.beforeEach(async ({ page }) => {
    // Clear referral state before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("cryptoCityReferral");
    });
    await startGame(page);
    await dismissErrorOverlays(page);
    await dismissDialogs(page);
  });

  test("should display Referral button in sidebar", async ({ page }) => {
    // Look for the Referral button by its title attribute (icon-only button)
    const referralButton = page.locator('button[title="Referral"]').first();
    
    await expect(referralButton).toBeVisible({ timeout: 10000 });
  });

  test("should open Referral panel when button clicked", async ({ page }) => {    
    // Click the Referral button (icon-only, identified by title)
    const referralButton = page.locator('button[title="Referral"]').first();
    await expect(referralButton).toBeVisible({ timeout: 10000 });
    
    // Dispatch click event directly via JS to bypass any overlay issues
    await referralButton.evaluate((btn) => {
      btn.click();
    });
    
    // Wait for the dialog to appear
    await page.waitForTimeout(1000);
    
    // Check that the Referral panel opens (dialog with "Referral Program" title)
    const referralPanel = page.locator('[role="dialog"]').filter({ hasText: /Referral Program/i }).first();
    await expect(referralPanel).toBeVisible({ timeout: 10000 });
  });

  test("should display player's referral code", async ({ page }) => {
    // Open the Referral panel
    const referralButton = page.locator('button[title="Referral"]').first();
    await expect(referralButton).toBeVisible({ timeout: 10000 });
    await referralButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);
    
    // Check that a 6-character referral code is displayed
    // The code should be alphanumeric and 6 characters long
    const codeElement = page.locator('text=/Your Code:/i').first();
    await expect(codeElement).toBeVisible({ timeout: 5000 });
    
    // Find the code display element (should contain a 6-char code)
    const codeText = page.locator('[data-testid="referral-code"]').first();
    await expect(codeText).toBeVisible({ timeout: 5000 });
    const code = await codeText.textContent();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  test("should show copy button for referral code", async ({ page }) => {
    // Open the Referral panel
    const referralButton = page.locator('button[title="Referral"]').first();
    await expect(referralButton).toBeVisible({ timeout: 10000 });
    await referralButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);
    
    // Look for copy button
    const copyButton = page.locator('button[title*="Copy"]').first();
    await expect(copyButton).toBeVisible({ timeout: 5000 });
  });

  test("should display referral count and tier", async ({ page }) => {
    // Open the Referral panel
    const referralButton = page.locator('button[title="Referral"]').first();
    await expect(referralButton).toBeVisible({ timeout: 10000 });
    await referralButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);
    
    // Check for referral count display
    const countText = page.locator('text=/Referrals:/i').first();
    await expect(countText).toBeVisible({ timeout: 5000 });
    
    // Check for tier display (Bronze by default for 0 referrals)
    const tierText = page.locator('text=/Bronze|Silver|Gold|Whale/i').first();
    await expect(tierText).toBeVisible({ timeout: 5000 });
  });

  test("should show input field for entering referral code", async ({ page }) => {
    // Open the Referral panel
    const referralButton = page.locator('button[title="Referral"]').first();
    await expect(referralButton).toBeVisible({ timeout: 10000 });
    await referralButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);
    
    // Look for input field to enter a referral code
    const inputField = page.locator('input[placeholder*="Enter code"]').first();
    await expect(inputField).toBeVisible({ timeout: 5000 });
  });

  test("should display shareable link", async ({ page }) => {
    // Open the Referral panel
    const referralButton = page.locator('button[title="Referral"]').first();
    await expect(referralButton).toBeVisible({ timeout: 10000 });
    await referralButton.evaluate((btn) => btn.click());
    await page.waitForTimeout(500);
    
    // Check for shareable link text containing the referral URL pattern
    const linkText = page.locator('text=/crypto-city.game.*ref=/i').first();
    await expect(linkText).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Referral URL Parameter", () => {
  test("should store referral code from URL parameter", async ({ page }) => {
    // Clear localStorage first
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Navigate with a referral code in the URL
    await page.goto("/?ref=TEST12");
    await page.waitForTimeout(2000);
    
    // Check that the referral code was stored
    const storedCode = await page.evaluate(() => {
      const state = localStorage.getItem("cryptoCityReferral");
      if (state) {
        const parsed = JSON.parse(state);
        return parsed.pendingReferralCode;
      }
      return null;
    });
    
    expect(storedCode).toBe("TEST12");
  });

  test("should apply bonus when starting new game with referral code", async ({ page }) => {
    // Clear localStorage first
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Navigate with a referral code
    await page.goto("/?ref=TEST12");
    await page.waitForTimeout(2000);
    
    // Start a new game
    const newGameButton = page
      .locator("button")
      .filter({ hasText: /New Game/i })
      .first();
    
    try {
      await newGameButton.waitFor({ state: "visible", timeout: 10000 });
      await newGameButton.click({ force: true });
      await page
        .waitForSelector("canvas", { state: "visible", timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(4000);
    } catch {
      // Game might auto-start
    }
    
    // Check that the referred status was set (bonus was applied)
    const referralState = await page.evaluate(() => {
      const state = localStorage.getItem("cryptoCityReferral");
      if (state) {
        return JSON.parse(state);
      }
      return null;
    });
    
    expect(referralState?.referredBy).toBe("TEST12");
  });
});
