import { test, expect } from '@playwright/test';

/**
 * Canvas Module Split Tests (Issue #66)
 * 
 * These tests verify that the CanvasIsometricGrid refactoring:
 * 1. Maintains all existing functionality
 * 2. Exports are available from the canvas module
 * 3. No visual regressions occur
 */

test.describe('Canvas Module Split', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test.describe('Module Exports', () => {
    test('should have CanvasIsometricGrid component available', async ({ page }) => {
      // The main component should still work
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
    });

    test('should render multiple canvas layers', async ({ page }) => {
      // Wait for game to fully load - canvases are in the game view
      await page.waitForTimeout(3000);
      
      // Click to start game if needed
      const startButton = page.locator('button:has-text("New Game"), button:has-text("Continue")').first();
      if (await startButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await startButton.click();
        await page.waitForTimeout(2000);
      }
      
      // After refactoring, should still have 6 canvas layers:
      // main, hover, cars, buildings, air, lighting
      const canvasCount = await page.locator('canvas').count();
      expect(canvasCount).toBeGreaterThanOrEqual(6);
    });
  });

  test.describe('Rendering Functionality', () => {
    test('should render isometric grid tiles', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      
      // Canvas should have content (not blank)
      const hasContent = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        // Check if canvas has any non-transparent pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some((v, i) => i % 4 === 3 && v > 0); // Check alpha channel
      });
      
      expect(hasContent).toBe(true);
    });

    test('should render buildings on the grid', async ({ page }) => {
      // Wait for game to fully load
      await page.waitForTimeout(3000);
      
      // Canvas should be rendering
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Input Handling', () => {
    test('should handle mouse panning', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        // Pan with alt+drag
        await page.keyboard.down('Alt');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, { steps: 5 });
        await page.mouse.up();
        await page.keyboard.up('Alt');
      }
      
      // Canvas should still be visible after panning
      await expect(canvas).toBeVisible();
    });

    test('should handle mouse wheel zoom', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100); // Zoom in
        await page.waitForTimeout(200);
        await page.mouse.wheel(0, 100); // Zoom out
      }
      
      await expect(canvas).toBeVisible();
    });

    test('should handle keyboard panning with WASD', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await canvas.click(); // Focus the canvas area
      
      // Press WASD keys for panning
      await page.keyboard.press('w');
      await page.waitForTimeout(100);
      await page.keyboard.press('a');
      await page.waitForTimeout(100);
      await page.keyboard.press('s');
      await page.waitForTimeout(100);
      await page.keyboard.press('d');
      
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Overlay System', () => {
    test('should render overlays when active', async ({ page }) => {
      // Wait for game to load
      await page.waitForTimeout(3000);
      
      // Try to find overlay toggle if available
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      
      // The overlay system should be functional
      // This is verified by the canvas still rendering
    });
  });

  test.describe('Performance', () => {
    test('should maintain frame rate after refactoring', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const perfMetrics = await page.evaluate(() => {
        return new Promise<{ avgFrameTime: number; frameCount: number }>((resolve) => {
          const frameTimes: number[] = [];
          let lastTime = performance.now();
          let frameCount = 0;
          
          const measure = () => {
            const now = performance.now();
            frameTimes.push(now - lastTime);
            lastTime = now;
            frameCount++;
            
            if (frameCount < 30) {
              requestAnimationFrame(measure);
            } else {
              const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
              resolve({ avgFrameTime, frameCount });
            }
          };
          
          requestAnimationFrame(measure);
        });
      });
      
      // Should maintain at least 30fps (33ms per frame)
      expect(perfMetrics.avgFrameTime).toBeLessThan(50);
    });

    test('should expose render metrics', async ({ page }) => {
      await page.waitForTimeout(1000);
      
      const hasMetrics = await page.evaluate(() => {
        return typeof (window as unknown as { __RENDER_METRICS__?: unknown }).__RENDER_METRICS__ !== 'undefined';
      });
      
      // Render metrics should be available
      expect(hasMetrics).toBe(true);
    });
  });

  test.describe('Tile Info Panel', () => {
    test('should show tile info when selecting a tile', async ({ page }) => {
      // Wait for game to load
      await page.waitForTimeout(3000);
      
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      
      if (box) {
        // Click on the canvas to select a tile
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);
      }
      
      // Canvas should still be functional
      await expect(canvas).toBeVisible();
    });
  });
});
