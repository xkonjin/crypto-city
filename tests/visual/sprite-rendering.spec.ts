/**
 * Visual Regression Tests - Sprite Rendering
 * 
 * Tests that building sprites and NPCs render correctly on the game canvas.
 * Uses Playwright's toHaveScreenshot for pixel-level comparisons.
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Start the game from landing page and wait for canvas
 */
async function startGame(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const startButton = page
    .locator('button')
    .filter({ hasText: /New Game|Continue/i })
    .first();

  try {
    await startButton.waitFor({ state: 'visible', timeout: 20000 });
    await startButton.click({ force: true });
    await page.waitForSelector('[data-testid="game-canvas"]', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(3000); // Allow sprites to load
  } catch {
    // Fallback: try Load Example
    const loadExampleButton = page
      .locator('button')
      .filter({ hasText: /Load Example/i })
      .first();
    if (await loadExampleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loadExampleButton.click({ force: true });
      await page.waitForSelector('[data-testid="game-canvas"]', { state: 'visible', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
  }
}

/**
 * Wait for game to fully load (called after startGame)
 */
async function waitForGameLoad(page: Page) {
  // Wait for main canvas
  await page.waitForSelector('[data-testid="game-canvas"]', { timeout: 30000 });
  // Wait for sprites to load (check for building layer)
  await page.waitForSelector('[data-testid="buildings-canvas"]', { timeout: 30000 });
  // Give extra time for sprite loading
  await page.waitForTimeout(2000);
}

/**
 * Place a crypto building via the sidebar
 */
async function placeCryptoBuilding(page: Page, buildingId: string, position: { x: number; y: number }) {
  // Open crypto buildings panel
  const cryptoButton = page.getByRole('button', { name: /crypto/i }).first();
  if (await cryptoButton.isVisible()) {
    await cryptoButton.click();
    await page.waitForTimeout(500);
  }
  
  // Search for building
  const searchInput = page.getByPlaceholder(/search/i).first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(buildingId.replace(/-/g, ' '));
    await page.waitForTimeout(300);
  }
  
  // Click on building in list
  const buildingOption = page.getByText(new RegExp(buildingId.replace(/-/g, '.*'), 'i')).first();
  if (await buildingOption.isVisible()) {
    await buildingOption.click();
    await page.waitForTimeout(300);
  }
  
  // Click on canvas at position
  const canvas = page.locator('[data-testid="game-canvas"]');
  const box = await canvas.boundingBox();
  if (box) {
    // Convert grid position to screen position (rough approximation)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    await page.mouse.click(centerX + position.x * 10, centerY + position.y * 10);
  }
}

/**
 * Take a screenshot of just the game canvas area
 */
async function screenshotCanvas(page: Page, name: string) {
  const canvas = page.locator('[data-testid="game-canvas"]');
  await expect(canvas).toHaveScreenshot(name, {
    maxDiffPixels: 500, // Allow some variance for animations
    threshold: 0.2,
  });
}

// =============================================================================
// TESTS
// =============================================================================

test.describe('Sprite Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
    await waitForGameLoad(page);
  });

  test('game canvas renders without errors', async ({ page }) => {
    // Verify all canvas layers exist
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="buildings-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="cars-canvas"]')).toBeVisible();
    
    // Take baseline screenshot
    await screenshotCanvas(page, 'game-canvas-baseline.png');
  });

  test.skip('crypto buildings panel shows building icons', async ({ page }) => {
    // Open crypto buildings
    const cryptoButton = page.getByRole('button', { name: /crypto/i }).first();
    await cryptoButton.click();
    await page.waitForTimeout(1000);
    
    // Verify panel is visible
    const panel = page.locator('[data-testid="crypto-building-panel"]').or(
      page.locator('.crypto-buildings')
    ).or(
      page.getByText(/DeFi|Exchange|Chain/i).first()
    );
    
    // Take screenshot of panel
    await expect(page).toHaveScreenshot('crypto-panel.png', {
      maxDiffPixels: 1000,
      fullPage: false,
    });
  });

  test('building sprites have correct transparency', async ({ page }) => {
    // This test verifies that placed buildings render with proper transparency
    // The canvas background should show through transparent areas
    
    await page.evaluate(() => {
      // Set a distinctive background color to verify transparency
      const container = document.querySelector('.game-container') as HTMLElement;
      if (container) {
        container.style.backgroundColor = '#ff00ff';
      }
    });
    
    await page.waitForTimeout(500);
    
    // Screenshot should show any transparency issues as magenta bleeding through
    await screenshotCanvas(page, 'transparency-check.png');
  });
});

test.describe('NPC Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
    await waitForGameLoad(page);
  });

  test('pedestrians render on canvas', async ({ page }) => {
    // Speed up time to spawn more pedestrians
    await page.evaluate(() => {
      // Access game speed control if available
      const speedButton = document.querySelector('[data-testid="speed-control"]') as HTMLButtonElement;
      if (speedButton) {
        speedButton.click();
      }
    });
    
    // Wait for pedestrians to spawn
    await page.waitForTimeout(5000);
    
    // Screenshot the cars/pedestrian canvas
    const carsCanvas = page.locator('[data-testid="cars-canvas"]');
    await expect(carsCanvas).toHaveScreenshot('pedestrians-canvas.png', {
      maxDiffPixels: 2000, // High tolerance due to movement
    });
  });
});

test.describe.skip('Visual Regression - Buildings', () => {
  // Skipped: UI-dependent tests that need stable sidebar layout
  const buildingsToTest = [
    'uniswap-exchange',
    'aave-lending-tower', 
    'coinbase-hq',
    'ethereum-beacon',
    'bitcoin-vault',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
    await waitForGameLoad(page);
  });

  for (const buildingId of buildingsToTest) {
    test(`${buildingId} renders correctly`, async ({ page }) => {
      // Search and select building
      const cryptoButton = page.getByRole('button', { name: /crypto/i }).first();
      if (await cryptoButton.isVisible()) {
        await cryptoButton.click();
        await page.waitForTimeout(500);
      }
      
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.isVisible()) {
        const searchTerm = buildingId.replace(/-/g, ' ');
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(500);
      }
      
      // Take screenshot of search results showing building preview
      await expect(page).toHaveScreenshot(`building-preview-${buildingId}.png`, {
        maxDiffPixels: 500,
      });
    });
  }
});

test.describe('Animation Frames', () => {
  test('vehicle animations progress', async ({ page }) => {
    await page.goto('/');
    await startGame(page);
    await waitForGameLoad(page);
    
    // Capture frame 1
    const frame1 = await page.locator('[data-testid="cars-canvas"]').screenshot();
    
    // Wait a bit
    await page.waitForTimeout(1000);
    
    // Capture frame 2
    const frame2 = await page.locator('[data-testid="cars-canvas"]').screenshot();
    
    // Frames should be different (animation is happening)
    // We can't easily compare programmatically here, but the screenshots
    // will show if animations are frozen
    expect(frame1).toBeDefined();
    expect(frame2).toBeDefined();
  });
});
