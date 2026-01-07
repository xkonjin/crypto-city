import { test, expect } from '@playwright/test';

// Increase default timeout for game loading
test.setTimeout(60000);

test.describe('Crypto City Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the "Loading game..." text to disappear (dynamic import completion)
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading game...'),
      { timeout: 45000 }
    );
    
    // Now wait for canvas
    await page.waitForSelector('canvas', { timeout: 15000 });
  });

  test('should load the game page', async ({ page }) => {
    // Basic page load test - check that something renders
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check page title or any content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should render Phaser canvas', async ({ page }) => {
    // Check that the Phaser canvas is rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });
    
    // Canvas should have non-zero dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should display Save button', async ({ page }) => {
    // Look for save button by title attribute
    const saveButton = page.locator('button[title="Save Game"]');
    await expect(saveButton).toBeVisible({ timeout: 30000 });
  });

  test('should display Load button', async ({ page }) => {
    const loadButton = page.locator('button[title="Load Game"]');
    await expect(loadButton).toBeVisible({ timeout: 30000 });
  });

  test('should display zoom controls', async ({ page }) => {
    const zoomIn = page.locator('button[title="Zoom In"]');
    const zoomOut = page.locator('button[title="Zoom Out"]');
    
    await expect(zoomIn).toBeVisible({ timeout: 30000 });
    await expect(zoomOut).toBeVisible({ timeout: 30000 });
  });

  test('should display multiple toolbar buttons', async ({ page }) => {
    // Count buttons in the toolbar area (top-left of screen)
    // We expect at least 4 buttons: save, load, build, eraser
    const buttons = page.locator('button');
    
    // Wait for buttons to load
    await page.waitForTimeout(2000);
    
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(4);
  });

  test('should display crypto treasury panel', async ({ page }) => {
    // Look for treasury-related text in the header
    const treasuryText = page.getByText('TREASURY');
    await expect(treasuryText).toBeVisible({ timeout: 30000 });
  });

  test('should display yield information', async ({ page }) => {
    // Look for daily yield text
    const yieldText = page.getByText('DAILY YIELD');
    await expect(yieldText).toBeVisible({ timeout: 30000 });
  });

  test('should display sentiment indicator', async ({ page }) => {
    // Look for Neutral/Fear/Greed text (sentiment)
    const sentimentEl = page.getByText('Neutral');
    await expect(sentimentEl).toBeVisible({ timeout: 30000 });
  });

  test('should display TVL information', async ({ page }) => {
    // Look for TVL text
    const tvlText = page.getByText('TOTAL TVL');
    await expect(tvlText).toBeVisible({ timeout: 30000 });
  });

  test('should display buildings count', async ({ page }) => {
    // Look for buildings count text
    const buildingsText = page.getByText('BUILDINGS');
    await expect(buildingsText).toBeVisible({ timeout: 30000 });
  });

  test('should display news ticker', async ({ page }) => {
    // Wait for news ticker to animate
    await page.waitForTimeout(2000);
    
    // Look for crypto news content in the ticker
    const newsContent = page.locator('text=/degen|crypto|winning|moon|loading/i').first();
    await expect(newsContent).toBeVisible({ timeout: 30000 });
  });

  test('should not crash on canvas interaction', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });
    
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const box = await canvas.boundingBox();
    if (box) {
      // Click in the center of the canvas
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
      
      // Pan the view
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('net::ERR') &&
      !e.includes('asset')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should not have uncaught page errors', async ({ page }) => {
    const exceptions: Error[] = [];
    
    page.on('pageerror', exception => {
      exceptions.push(exception);
    });

    await page.goto('/');
    
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading game...'),
      { timeout: 45000 }
    );
    
    // Wait for game to stabilize
    await page.waitForTimeout(3000);
    
    // Filter out non-critical errors
    const criticalExceptions = exceptions.filter(e => 
      !e.message.includes('ResizeObserver') &&
      !e.message.includes('Script error')
    );
    
    expect(criticalExceptions.length).toBe(0);
  });
});

test.describe('Crypto City Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for canvas to appear
    await page.waitForSelector('canvas', { timeout: 45000 });
    
    const loadTime = Date.now() - startTime;
    
    // Game should load within 30 seconds
    expect(loadTime).toBeLessThan(30000);
  });
});
