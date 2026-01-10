import { test, expect } from '@playwright/test';

test.describe('Achievement Share System (#39)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to initialize
    await page.waitForTimeout(2000);
    
    // Try to start a new game if we're on the main menu
    const newGameButton = page.locator('text=/new (city|game)/i').first();
    if (await newGameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newGameButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test.describe('Achievement Toast', () => {
    test('should appear when achievement is unlocked', async ({ page }) => {
      // Use browser console to simulate an achievement unlock
      // This will trigger the achievement toast system
      await page.evaluate(() => {
        // Dispatch a custom event that the achievement system listens for
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      // The toast should appear with achievement info
      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      // Should show achievement name (in the heading)
      await expect(toast.locator('h3:has-text("Small Town")')).toBeVisible();
      
      // Should show achievement description
      await expect(toast.locator('text=/100 citizens/i').first()).toBeVisible();
    });

    test('should auto-dismiss after 5 seconds', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      // Wait for auto-dismiss (5 seconds + buffer)
      await page.waitForTimeout(6000);
      await expect(toast).not.toBeVisible({ timeout: 2000 });
    });

    test('should show share button', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      // Should have a share button
      const shareButton = toast.locator('button', { hasText: /share/i });
      await expect(shareButton).toBeVisible();
    });

    test('should show Cobie quip', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      // Should show a Cobie comment (signature or attribution)
      await expect(toast.locator('text=/cobie/i')).toBeVisible();
    });
  });

  test.describe('Achievement Share Dialog', () => {
    test('should open when share button is clicked', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      // Click share button
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      // Dialog should open
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
    });

    test('should show share card preview', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      
      // Should show card preview (either canvas or image)
      const cardPreview = dialog.locator('[data-testid="achievement-card-preview"]');
      await expect(cardPreview).toBeVisible();
    });

    test('should have Twitter/X share button', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      
      // Should have Twitter/X share button
      const twitterButton = dialog.locator('button', { hasText: /share.*x|tweet|twitter/i });
      await expect(twitterButton).toBeVisible();
    });

    test('should have download button', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      
      // Should have download button
      const downloadButton = dialog.locator('button', { hasText: /download/i });
      await expect(downloadButton).toBeVisible();
    });
  });

  test.describe('Achievement Card Generation', () => {
    test('should generate card preview in share dialog', async ({ page }) => {
      // Trigger achievement unlock
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      // Open share dialog
      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      
      // Wait for card to be generated
      await page.waitForTimeout(1000);
      
      // Card preview should contain an image
      const cardPreview = dialog.locator('[data-testid="achievement-card-preview"]');
      const cardImage = cardPreview.locator('img');
      await expect(cardImage).toBeVisible({ timeout: 5000 });
      
      // Image should have a src (blob URL)
      const src = await cardImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src?.startsWith('blob:')).toBe(true);
    });

    test('should show share text with achievement name and emoji', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      
      // Share text preview should contain achievement info
      const shareTextPreview = dialog.locator('.whitespace-pre-wrap');
      const shareText = await shareTextPreview.textContent();
      
      // Should include achievement name
      expect(shareText).toContain('Small Town');
      
      // Should include emoji
      expect(shareText).toContain('🏆');
      
      // Should include game URL
      expect(shareText?.toLowerCase()).toContain('crypto-city');
    });

    test('should show Cobie quip in share text', async ({ page }) => {
      await page.evaluate(() => {
        const event = new CustomEvent('achievement-unlocked', {
          detail: {
            id: 'pop_100',
            name: 'Small Town',
            description: 'Reach 100 citizens',
            category: 'population',
            icon: 'planning',
          }
        });
        window.dispatchEvent(event);
      });

      const toast = page.locator('[data-testid="achievement-toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      
      const shareButton = toast.locator('button', { hasText: /share/i });
      await shareButton.click();
      
      const dialog = page.locator('[data-testid="achievement-share-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      
      // Share text should include Cobie attribution
      const shareTextPreview = dialog.locator('.whitespace-pre-wrap');
      const shareText = await shareTextPreview.textContent();
      
      // Should include Cobie attribution
      expect(shareText?.toLowerCase()).toContain('cobie');
    });
  });
});
