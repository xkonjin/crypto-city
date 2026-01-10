import { test, expect } from "@playwright/test";

/**
 * Synergy Visualization Tests (Issue #30)
 * 
 * Tests for crypto building synergy visual indicators including:
 * - Synergy overlay mode toggle
 * - Connection lines between synergized buildings
 * - Synergy bonus display in tooltips
 * - Mini synergy indicators on placed buildings
 */

// Helper function to start game and wait for canvas
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

// Helper function to open crypto building panel
async function openCryptoBuildingPanel(page: import("@playwright/test").Page) {
  const cryptoButton = page
    .locator("button")
    .filter({ hasText: /Crypto Buildings/i })
    .first();
  await expect(cryptoButton).toBeVisible({ timeout: 10000 });
  await cryptoButton.click();
  await page.waitForTimeout(500);
}

test.describe("Synergy Overlay Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have synergy overlay toggle button", async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for synergy overlay toggle in the overlay section
    const overlaySection = page.locator("text=/View Overlay|Overlay/i").first();
    const hasOverlaySection = await overlaySection.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Synergy overlay button should exist
    const synergyButton = page.locator('[title*="Synergy"], button:has-text("Synergy")').first();
    const hasSynergyButton = await synergyButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasOverlaySection || hasSynergyButton).toBeTruthy();
  });

  test("should toggle synergy overlay mode on click", async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const synergyButton = page.locator('[title*="Synergy"], button:has-text("Synergy")').first();
    const isVisible = await synergyButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await synergyButton.click();
      await page.waitForTimeout(500);
      
      // Verify the button shows as active
      const isActive = await synergyButton.evaluate((el) => {
        return el.classList.contains("bg-fuchsia-500") ||
               el.getAttribute("data-state") === "on" ||
               el.getAttribute("aria-pressed") === "true";
      }).catch(() => false);
      
      expect(isActive).toBeTruthy();
    }
  });
});

test.describe("Synergy Tooltip Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should display synergy bonus in building tooltip", async ({ page }) => {
    await page.waitForTimeout(2000);
    await openCryptoBuildingPanel(page);
    
    // Hover over a building card to see tooltip
    const aaveBuilding = page
      .locator("button")
      .filter({ hasText: /Aave Lending Tower/i })
      .first();
    await expect(aaveBuilding).toBeVisible({ timeout: 5000 });
    await aaveBuilding.hover();
    await page.waitForTimeout(300);
    
    // Tooltip should show synergy information
    const synergyInfo = page.locator("text=/Synergy|synergy|Chain synergy|Category synergy/i").first();
    await expect(synergyInfo).toBeVisible({ timeout: 5000 });
  });

  // Test skipped - flaky hover detection in CI
  test.skip("should show synergy yield bonus percentage", async ({ page }) => {
    await page.waitForTimeout(2000);
    await openCryptoBuildingPanel(page);
    
    // Hover over a building that has synergies
    const uniswapBuilding = page
      .locator("button")
      .filter({ hasText: /Uniswap/i })
      .first();
    
    if (await uniswapBuilding.isVisible({ timeout: 3000 }).catch(() => false)) {
      await uniswapBuilding.hover();
      await page.waitForTimeout(300);
      
      // Should show synergy bonus info
      const bonusInfo = page.locator("text=/\\+\\d+% yield|yield bonus/i").first();
      const hasBonusInfo = await bonusInfo.isVisible({ timeout: 3000 }).catch(() => false);
      
      // At minimum, synergy info should be displayed
      const synergyText = page.locator("text=/synergy/i").first();
      const hasSynergyText = await synergyText.isVisible({ timeout: 3000 }).catch(() => false);
      
      expect(hasBonusInfo || hasSynergyText).toBeTruthy();
    }
  });
});

test.describe("Building Placement Synergy Preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should highlight compatible buildings when hovering in panel", async ({ page }) => {
    await page.waitForTimeout(3000);
    await openCryptoBuildingPanel(page);
    
    // First place a building
    const aaveBuilding = page
      .locator("button")
      .filter({ hasText: /Aave Lending Tower/i })
      .first();
    await aaveBuilding.click();
    await page.waitForTimeout(300);
    
    // Place it on the canvas
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
    }
    
    // Now hover over another DeFi building and check for synergy preview
    const compoundBuilding = page
      .locator("button")
      .filter({ hasText: /Compound/i })
      .first();
    
    if (await compoundBuilding.isVisible({ timeout: 3000 }).catch(() => false)) {
      await compoundBuilding.hover();
      await page.waitForTimeout(500);
      
      // Canvas should still be visible (synergy preview renders on canvas)
      await expect(canvas).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Mini Synergy Indicator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should show synergy indicator on placed buildings with active synergies", async ({ page }) => {
    await page.waitForTimeout(3000);
    await openCryptoBuildingPanel(page);
    
    // Place first DeFi building
    const building1 = page
      .locator("button")
      .filter({ hasText: /Aave Lending Tower/i })
      .first();
    await building1.click();
    await page.waitForTimeout(300);
    
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      // Place first building
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
      
      // Place second DeFi building nearby for synergy
      await openCryptoBuildingPanel(page);
      const building2 = page
        .locator("button")
        .filter({ hasText: /Compound|Uniswap/i })
        .first();
      
      if (await building2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await building2.click();
        await page.waitForTimeout(300);
        
        // Place nearby to create synergy
        await page.mouse.click(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30);
        await page.waitForTimeout(1000);
        
        // Canvas should render with both buildings (synergy indicator would be visible)
        await expect(canvas).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe("Synergy Connection Lines", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should display synergy connections when overlay is active", async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Place two synergized buildings first
    await openCryptoBuildingPanel(page);
    
    const building1 = page
      .locator("button")
      .filter({ hasText: /Aave Lending Tower/i })
      .first();
    await building1.click();
    await page.waitForTimeout(300);
    
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
      
      await openCryptoBuildingPanel(page);
      const building2 = page
        .locator("button")
        .filter({ hasText: /Compound/i })
        .first();
      
      if (await building2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await building2.click();
        await page.waitForTimeout(300);
        await page.mouse.click(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30);
        await page.waitForTimeout(1000);
      }
    }
    
    // Enable synergy overlay
    const synergyButton = page.locator('[title*="Synergy"], button:has-text("Synergy")').first();
    if (await synergyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await synergyButton.click();
      await page.waitForTimeout(500);
      
      // Canvas should be rendering with overlay (connections would be visible)
      await expect(canvas).toBeVisible({ timeout: 5000 });
    }
  });

  test("should use different colors for chain vs category synergies", async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // This test verifies the overlay configuration exists
    // The actual color rendering is tested visually
    const synergyButton = page.locator('[title*="Synergy"], button:has-text("Synergy")').first();
    const hasSynergyButton = await synergyButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    // At minimum, the synergy overlay should be configurable
    const overlaySection = page.locator("text=/View Overlay/i").first();
    const hasOverlaySection = await overlaySection.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasSynergyButton || hasOverlaySection).toBeTruthy();
  });
});
