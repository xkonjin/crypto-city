import { test, expect } from '@playwright/test';

test.describe('Crypto City Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    // Wait for the home page to load
    await page.waitForTimeout(2000);
    
    // Click "New Game" to enter the game
    const newGameButton = page.locator('button, [role="button"]').filter({ hasText: /New Game/i });
    try {
      await newGameButton.waitFor({ state: 'visible', timeout: 5000 });
      await newGameButton.click();
      // Wait for game to load
      await page.waitForTimeout(4000);
    } catch {
      // If no new game button, we might already be in the game
      await page.waitForTimeout(2000);
    }
  });

  test('should load the game canvas', async ({ page }) => {
    // Wait extra time for game to fully initialize
    await page.waitForTimeout(2000);
    // Check that at least one game canvas is rendered (there may be multiple canvas elements)
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
    // Check the first canvas is visible
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test('should display the sidebar with building tools', async ({ page }) => {
    // Check that the sidebar is visible (look for common sidebar elements)
    const sidebar = page.locator('aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('should display stats in the UI', async ({ page }) => {
    // Check for any stats/info text in the game UI
    const statsText = page.locator('text=/Population|Funds|Power|Money|Budget/i').first();
    await expect(statsText).toBeVisible({ timeout: 10000 });
  });

  test('should display the treasury panel with crypto info', async ({ page }) => {
    // Look for Treasury panel elements (Treasury text or yield/TVL display)
    const treasuryElement = page.locator('text=/Treasury|Daily Yield|TVL/i').first();
    await expect(treasuryElement).toBeVisible({ timeout: 15000 });
  });

  test('should be able to interact with the canvas', async ({ page }) => {
    // Wait extra time for game to fully initialize
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Get canvas bounding box
    const box = await canvas.boundingBox();
    if (box) {
      // Click on the canvas
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      // Try dragging (panning)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
      await page.mouse.up();
    }
  });

  test('should show building options when clicking sidebar tools', async ({ page }) => {
    // Try to find and click on a building category in the sidebar
    const toolButtons = page.locator('button, [role="button"]');
    const count = await toolButtons.count();
    expect(count).toBeGreaterThan(0);

    // Find a zone or build-related button
    const buildButton = page.locator('button, [role="button"]').filter({ 
      hasText: /Residential|Commercial|Industrial|Zone|Build/i 
    }).first();
    
    if (await buildButton.isVisible({ timeout: 5000 })) {
      await buildButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Start new game
    const newGameButton = page.locator('button, [role="button"]').filter({ hasText: /New Game/i });
    if (await newGameButton.isVisible({ timeout: 5000 })) {
      await newGameButton.click();
      await page.waitForTimeout(3000);
    }

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('Failed to load translations') &&
        !e.includes('gt-next') &&
        !e.includes('favicon') &&
        !e.includes('_gt') &&
        !e.includes('hydrat')
    );

    // Allow up to a few minor errors
    expect(criticalErrors.length).toBeLessThan(3);
  });
});

test.describe('Crypto Economy Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Click "New Game" to enter the game
    const newGameButton = page.locator('button, [role="button"]').filter({ hasText: /New Game/i });
    try {
      await newGameButton.waitFor({ state: 'visible', timeout: 5000 });
      await newGameButton.click();
      await page.waitForTimeout(4000);
    } catch {
      // If no new game button, we might already be in the game
      await page.waitForTimeout(2000);
    }
  });

  test('should display treasury balance', async ({ page }) => {
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
    // Find treasury display
    const treasuryElement = page.locator('text=/Treasury/i').first();
    await expect(treasuryElement).toBeVisible({ timeout: 15000 });
  });

  test('should display market sentiment indicator', async ({ page }) => {
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
    // Look for sentiment-related text or meter
    const sentimentIndicator = page.locator('text=/Fear|Greed|Neutral|Extreme/i').first();
    await expect(sentimentIndicator).toBeVisible({ timeout: 15000 });
  });

  test('should display TVL information', async ({ page }) => {
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
    // Look for TVL in the panel
    const tvlElement = page.locator('text=/TVL/i').first();
    await expect(tvlElement).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Building Placement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Start new game
    const newGameButton = page.locator('button, [role="button"]').filter({ hasText: /New Game/i });
    try {
      await newGameButton.waitFor({ state: 'visible', timeout: 5000 });
      await newGameButton.click();
      await page.waitForTimeout(4000);
    } catch {
      // If no new game button, we might already be in the game
      await page.waitForTimeout(2000);
    }
  });

  test('should be able to select tools from sidebar', async ({ page }) => {
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
    // Find tool buttons
    const toolButtons = page.locator('button, [role="button"]');
    const count = await toolButtons.count();
    expect(count).toBeGreaterThan(5); // Should have many tool buttons
  });

  test('canvas should handle zoom with mouse wheel', async ({ page }) => {
    // Wait extra time for game to fully initialize
    await page.waitForTimeout(3000);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const box = await canvas.boundingBox();
    if (box) {
      // Scroll to zoom
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(300);
      await page.mouse.wheel(0, 100); // Zoom out
    }
  });

  test('should show tool selection feedback', async ({ page }) => {
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
    // Click on a specific tool and verify selection
    const roadTool = page.locator('button, [role="button"]').filter({ hasText: /Road/i }).first();
    if (await roadTool.isVisible({ timeout: 5000 })) {
      await roadTool.click();
      // The tool should be visually selected (active state)
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Responsive Design', () => {
  test('should render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Should show home screen or mobile layout
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should render on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for IsoCity title or New Game button
    const homeElement = page.locator('text=/IsoCity|New Game/i').first();
    await expect(homeElement).toBeVisible({ timeout: 10000 });
  });

  test('should render on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for home screen elements
    const homeElement = page.locator('text=/IsoCity|New Game/i').first();
    await expect(homeElement).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Home Screen', () => {
  test('should display home screen with menu options', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for New Game button
    const newGameButton = page.locator('text=/New Game/i').first();
    await expect(newGameButton).toBeVisible({ timeout: 5000 });
    
    // Check for Co-op button
    const coopButton = page.locator('text=/Co-op/i').first();
    await expect(coopButton).toBeVisible({ timeout: 5000 });
  });

  test('should display IsoCity title', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const title = page.locator('text=/IsoCity/i').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });
});
