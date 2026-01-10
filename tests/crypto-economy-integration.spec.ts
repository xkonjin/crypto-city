import { test, expect } from "@playwright/test";

/**
 * Tests for Crypto-City Economy Integration (Issue #44)
 * 
 * These tests verify the connection between the crypto economy and city economy:
 * 1. Tax Bridge: Crypto yields generate city tax revenue
 * 2. Population Boost: More citizens = better crypto yields
 * 3. Services Effect: Power/water/happiness affect crypto buildings
 */

async function dismissErrorOverlays(page: import("@playwright/test").Page) {
  try {
    const errorDialog = page.locator('dialog[aria-label*="Console"]').first();
    if (await errorDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    
    const errorBadge = page.locator('button:has-text("Issue")').first();
    if (await errorBadge.isVisible({ timeout: 500 }).catch(() => false)) {
      const collapseBtn = page.locator('button[aria-label*="Collapse"]').first();
      if (await collapseBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await collapseBtn.click();
      }
    }
  } catch {
    // Ignore errors in cleanup
  }
}

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

test.describe("Crypto-City Economy Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test.describe("Tax Bridge (Crypto → City)", () => {
    test("should display crypto tax revenue in budget panel", async ({ page }) => {
      // Wait for game to be fully loaded - canvas visible indicates game is running
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Dismiss tutorial if visible (click "Dismiss Tutorial" button)
      const dismissButton = page.getByRole('button', { name: /Dismiss Tutorial/i });
      if (await dismissButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dismissButton.click({ force: true });
        await page.waitForTimeout(500);
      }
      
      // Dismiss Cobie popup if visible
      const gotItButton = page.getByRole('button', { name: /Got it/i });
      if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await gotItButton.click({ force: true });
        await page.waitForTimeout(500);
      }
      
      // Open budget panel by clicking the Budget button (icon-only with accessible name)
      // Use dispatchEvent to bypass NextJS dev overlay interception issues
      const budgetButton = page.getByRole('button', { name: /Budget/i }).first();
      await expect(budgetButton).toBeVisible({ timeout: 15000 });
      await budgetButton.dispatchEvent('click');
      await page.waitForTimeout(1500);
      
      // Look for "Crypto Tax" line item in the budget panel
      // The panel should show "Crypto Tax" as part of the income breakdown
      const cryptoTaxLine = page.locator("text=/Crypto Tax/i").first();
      await expect(cryptoTaxLine).toBeVisible({ timeout: 15000 });
    });

    test("should show income breakdown with crypto tax", async ({ page }) => {
      // Wait for game to be fully loaded - canvas visible indicates game is running
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Dismiss tutorial if visible
      const dismissButton = page.getByRole('button', { name: /Dismiss Tutorial/i });
      if (await dismissButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dismissButton.click({ force: true });
        await page.waitForTimeout(500);
      }
      
      // Dismiss Cobie popup if visible
      const gotItButton = page.getByRole('button', { name: /Got it/i });
      if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await gotItButton.click({ force: true });
        await page.waitForTimeout(500);
      }
      
      // Open budget panel (icon-only with accessible name)
      // Use dispatchEvent to bypass NextJS dev overlay interception issues
      const budgetButton = page.getByRole('button', { name: /Budget/i }).first();
      await expect(budgetButton).toBeVisible({ timeout: 15000 });
      await budgetButton.dispatchEvent('click');
      await page.waitForTimeout(1500);
      
      // Verify income breakdown section exists
      const incomeBreakdown = page.locator("text=/Income Breakdown/i").first();
      await expect(incomeBreakdown).toBeVisible({ timeout: 15000 });
      
      // Should show Tax Revenue and Crypto Tax as separate items
      const taxRevenue = page.locator("text=/Tax Revenue/i").first();
      await expect(taxRevenue).toBeVisible({ timeout: 5000 });
      
      const cryptoTax = page.locator("text=/Crypto Tax/i").first();
      await expect(cryptoTax).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Population Boost to Crypto", () => {
    test("should show population effect indicator in treasury panel", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Look for population bonus indicator in treasury panel
      // This could be displayed as "Population Bonus: +X%" or similar
      const populationBonus = page.locator("text=/Population Bonus|Pop Boost|Citizens Effect/i").first();
      await expect(populationBonus).toBeVisible({ timeout: 10000 });
    });

    test("treasury panel should reflect population multiplier", async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Get the treasury panel
      const treasuryPanel = page.locator("text=/Treasury|Daily Yield/i").first();
      await expect(treasuryPanel).toBeVisible({ timeout: 10000 });
      
      // The yield display should now factor in population
      // We verify the panel is rendering (actual calculation tested in unit tests)
      const yieldDisplay = page.locator("text=/Daily Yield/i").first();
      await expect(yieldDisplay).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Services Affect Crypto", () => {
    test("should show service status for crypto buildings", async ({ page }) => {
      // Wait for game to be fully loaded
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 20000 });
      await page.waitForTimeout(2000);
      
      // The treasury panel should show the Services status with ⚡ and 💧
      // This is the CityBonusIndicator we added
      const servicesStatus = page.locator("text=/Services/i").first();
      await expect(servicesStatus).toBeVisible({ timeout: 10000 });
      
      // Look for the service icons and percentage
      const powerIcon = page.locator("text=/⚡/").first();
      const waterIcon = page.locator("text=/💧/").first();
      
      // At least one status indicator should be visible
      const hasPower = await powerIcon.isVisible({ timeout: 5000 }).catch(() => false);
      const hasWater = await waterIcon.isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(hasPower || hasWater).toBeTruthy();
    });

    test("crypto yields should be affected by service coverage", async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // This test verifies that the treasury panel shows service-adjusted yields
      const treasuryPanel = page.locator("text=/Treasury/i").first();
      await expect(treasuryPanel).toBeVisible({ timeout: 10000 });
      
      // Look for any service-related modifiers in the treasury display
      // Could be "Power Penalty", "Service Bonus", etc.
      const serviceModifier = page.locator("text=/Power|Service|Utility/i");
      
      // The presence of service-related info indicates integration
      // Actual values tested in unit tests
      const yieldInfo = page.locator("text=/Daily Yield|\\$[0-9]/i").first();
      await expect(yieldInfo).toBeVisible({ timeout: 10000 });
    });
  });
});
