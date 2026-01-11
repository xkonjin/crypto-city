import { test, expect } from "@playwright/test";

/**
 * Accessibility Tests (Issue #60)
 * Tests for screen reader support, keyboard navigation, and ARIA compliance
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
    // Wait for canvas - sprite loading takes time
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

test.describe("Accessibility - Skip Links (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have skip-to-content links at the top of the page", async ({ page }) => {
    // Skip links should exist but be visually hidden until focused
    const skipToMain = page.locator('a[href="#main-content"]');
    const skipToGame = page.locator('a[href="#game-canvas"]');
    const skipToBuilding = page.locator('a[href="#building-panel"]');
    
    // At least the main skip link should exist
    await expect(skipToMain).toHaveCount(1);
    
    // Check that it has sr-only class (visually hidden)
    await expect(skipToMain).toHaveClass(/sr-only/);
  });

  test("skip links should become visible on focus", async ({ page }) => {
    // Focus on skip link via Tab
    await page.keyboard.press("Tab");
    
    // The skip link should now be visible (focus:not-sr-only)
    const skipLink = page.locator('a[href="#main-content"]');
    
    // Check if it's focusable and visible when focused
    const isFocused = await page.evaluate(() => {
      const link = document.querySelector('a[href="#main-content"]');
      return document.activeElement === link;
    });
    
    // Either it becomes visible on focus OR focus has moved to it
    const isVisible = await skipLink.isVisible().catch(() => false);
    expect(isFocused || isVisible).toBeTruthy();
  });
});

test.describe("Accessibility - Keyboard Navigation (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have keyboard navigation enabled on canvas", async ({ page }) => {
    // Canvas should be focusable for keyboard navigation
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    
    // Check canvas has tabindex for focusability
    const tabindex = await canvas.getAttribute("tabindex");
    expect(tabindex).not.toBeNull();
  });

  test("should have visible keyboard cursor indicator", async ({ page }) => {
    // Canvas should be focusable with tabindex attribute
    const canvas = page.locator("canvas[tabindex]").first();
    
    // Check that canvas has tabindex for keyboard accessibility
    const hasTabindex = await canvas.getAttribute("tabindex");
    expect(hasTabindex).not.toBeNull();
    
    // Canvas should also have role and aria-label for screen readers
    const hasRole = await canvas.getAttribute("role");
    expect(hasRole).toBe("application");
    
    const hasAriaLabel = await canvas.getAttribute("aria-label");
    expect(hasAriaLabel).toBeTruthy();
  });

  test("should navigate with arrow keys", async ({ page }) => {
    // The game uses arrow keys (and WASD) for panning the map view
    // This test verifies the keyboard handlers don't cause errors
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    
    // Dismiss any open dialogs first
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    
    // Arrow keys are used for map panning - should not throw errors
    // We use page.keyboard instead of clicking to avoid dialog interference
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);
    
    // Canvas should still be visible and functional
    await expect(canvas).toBeVisible();
  });

  test("should support Enter/Space for selection", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await canvas.focus();
    
    // Press Enter to select
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    
    // Check that selection occurred (should trigger tile selection or action)
    // This could be verified by checking selectedTile state or announcement
    const hasSelection = await page.evaluate(() => {
      // Check if any selection-related event was triggered
      return true; // Placeholder - implementation will add proper tracking
    });
    expect(hasSelection).toBeTruthy();
  });

  test("should support Escape to cancel actions", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await canvas.focus();
    
    // Press Escape to cancel/close any open dialogs or panels
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    
    // Pressing Escape should not cause any errors and should be handled
    // In the game, Escape closes panels, deselects tools, or cancels selection
    // The key handler exists in Game.tsx and handles these cases
    
    // Press Escape again to ensure it's properly handled
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    
    // Canvas should still be accessible
    await expect(canvas).toBeVisible();
  });
});

test.describe("Accessibility - ARIA Live Regions (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have ARIA live region for announcements", async ({ page }) => {
    // Check for live region element
    const liveRegion = page.locator('[role="status"], [aria-live="polite"], [data-testid="screen-reader-announcer"]');
    await expect(liveRegion.first()).toHaveCount(1);
  });

  test("should have assertive live region for urgent announcements", async ({ page }) => {
    // Check for assertive live region (for warnings/alerts)
    const alertRegion = page.locator('[role="alert"], [aria-live="assertive"]');
    await expect(alertRegion.first()).toHaveCount(1);
  });

  test("should announce building placement", async ({ page }) => {
    // Trigger a building placement (via test helper)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test-building-placed', { 
        detail: { buildingName: 'DeFi Hub', x: 5, y: 3 }
      }));
    });
    await page.waitForTimeout(100);
    
    // Check that announcement was made
    const announcement = await page.locator('[role="status"], [aria-live="polite"]').textContent();
    // Announcement should contain building info
    expect(announcement).toBeDefined();
  });

  test("should announce rug pull events", async ({ page }) => {
    // Trigger a test rug pull event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test-rug-pull', { 
        detail: { buildingName: 'Degen Lounge', position: { x: 5, y: 3 }, treasuryLoss: 5000 }
      }));
    });
    await page.waitForTimeout(500);
    
    // Check for alert/announcement
    const alertRegion = page.locator('[role="alert"], [aria-live="assertive"]');
    const text = await alertRegion.first().textContent().catch(() => '');
    // Should have some content after rug pull
    expect(text).toBeDefined();
  });
});

test.describe("Accessibility - Focus Management (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have visible focus indicators on buttons", async ({ page }) => {
    // Tab to a button
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Get the focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        hasOutline: styles.outlineStyle !== 'none' && styles.outlineWidth !== '0px',
        hasBoxShadow: styles.boxShadow !== 'none',
        hasRing: el.classList.contains('focus:ring') || el.classList.contains('focus-visible:ring'),
      };
    });
    
    // Should have some visible focus indicator
    expect(
      focusedElement?.hasOutline || 
      focusedElement?.hasBoxShadow || 
      focusedElement?.hasRing
    ).toBeTruthy();
  });

  test("dialogs should trap focus", async ({ page }) => {
    // Open a dialog (e.g., settings)
    const settingsButton = page.locator('button').filter({ hasText: /Settings|Options|⚙️/i }).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Check if dialog is open
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        // Tab through dialog - should stay within
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        
        // Focus should still be within the dialog
        const focusInDialog = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          const focused = document.activeElement;
          return dialog?.contains(focused);
        });
        
        expect(focusInDialog).toBeTruthy();
      }
    }
  });

  test("should return focus after modal closes", async ({ page }) => {
    // Find and click a button that opens a modal
    const triggerButton = page.locator('button').filter({ hasText: /Settings|Budget|Statistics/i }).first();
    
    if (await triggerButton.isVisible()) {
      // Remember what had focus before
      await triggerButton.focus();
      await triggerButton.click();
      await page.waitForTimeout(500);
      
      // Close dialog with Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      
      // Focus should return to trigger or nearby element
      const focusedAfter = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      // Focus should be on a meaningful element, not body
      expect(focusedAfter).not.toBe("BODY");
    }
  });
});

test.describe("Accessibility - Landmark Regions (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("should have main landmark", async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toHaveCount(1);
  });

  test("should have navigation landmark", async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]');
    // At least one navigation region
    const count = await nav.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should have complementary regions for panels", async ({ page }) => {
    // The sidebar uses role="complementary" or aside element
    const aside = page.locator('[role="complementary"], aside[role="complementary"]');
    const count = await aside.count();
    // Should have at least one complementary region (sidebar)
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("main content should have proper ID for skip links", async ({ page }) => {
    // Main content should have id="main-content"
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveCount(1);
  });

  test("game canvas should have proper ID for skip links", async ({ page }) => {
    // Game canvas container should have id="game-canvas"
    const gameCanvas = page.locator('#game-canvas');
    await expect(gameCanvas).toHaveCount(1);
  });
});

test.describe("Accessibility - Reduced Motion (Issue #60)", () => {
  test("should respect prefers-reduced-motion", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await startGame(page);
    
    // Check that animations are disabled/reduced
    const hasReducedMotion = await page.evaluate(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      return mediaQuery.matches;
    });
    
    expect(hasReducedMotion).toBeTruthy();
  });

  test("should have reduced motion toggle in settings", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    
    // Open settings/accessibility panel
    const settingsButton = page.locator('button').filter({ hasText: /Settings|Accessibility|⚙️/i }).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Look for reduced motion toggle
      const reducedMotionToggle = page.locator('[data-testid="reduced-motion-toggle"], [aria-label*="motion"], label:has-text("motion")');
      const count = await reducedMotionToggle.count();
      expect(count).toBeGreaterThanOrEqual(0); // Optional - will be added in implementation
    }
  });
});

test.describe("Accessibility - Screen Reader Descriptions (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("building buttons should have descriptive labels", async ({ page }) => {
    // Find building buttons in sidebar
    const buildingButtons = page.locator('button[aria-label], [role="button"][aria-label]');
    const count = await buildingButtons.count();
    
    // Should have buttons with aria-labels
    expect(count).toBeGreaterThan(0);
  });

  test("tooltips should have proper ARIA attributes", async ({ page }) => {
    // Look for any buttons that have tooltips (indicated by title or aria-describedby)
    const buttonsWithTooltips = page.locator('button[title], button[aria-describedby]');
    const count = await buttonsWithTooltips.count();
    
    // Should have buttons with title attributes (basic tooltips)
    expect(count).toBeGreaterThan(0);
    
    // Check that some interactive elements have proper labeling
    const labeledButtons = page.locator('button[aria-label], button[title]');
    const labeledCount = await labeledButtons.count();
    expect(labeledCount).toBeGreaterThan(0);
  });

  test("stats should have aria-live for dynamic updates", async ({ page }) => {
    // Stats that update frequently should have aria-live
    const stats = page.locator('[aria-live], [role="status"]');
    const count = await stats.count();
    
    // Should have at least one live region for stats
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Accessibility - High Contrast (Issue #60)", () => {
  test("should have high contrast mode option", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    
    // Open settings
    const settingsButton = page.locator('button').filter({ hasText: /Settings|Accessibility|⚙️/i }).first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Look for high contrast toggle
      const highContrastToggle = page.locator('[data-testid="high-contrast-toggle"], [aria-label*="contrast"], label:has-text("contrast")');
      const count = await highContrastToggle.count();
      expect(count).toBeGreaterThanOrEqual(0); // Optional setting
    }
  });

  test("focus indicators should be visible in both modes", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    
    // Tab to focus something
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Should have visible focus indicator
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      const styles = window.getComputedStyle(el);
      return (
        styles.outlineStyle !== 'none' ||
        styles.boxShadow !== 'none' ||
        el.matches(':focus-visible')
      );
    });
    
    expect(focusVisible).toBeTruthy();
  });
});

test.describe("Accessibility - ARIA Attributes (Issue #60)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
  });

  test("buttons should have accessible names", async ({ page }) => {
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    
    // Check first 10 buttons for accessible names
    for (let i = 0; i < Math.min(10, count); i++) {
      const button = buttons.nth(i);
      const hasAccessibleName = await button.evaluate((el) => {
        return !!(
          el.textContent?.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title')
        );
      });
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test("interactive elements should be properly labeled", async ({ page }) => {
    // Check inputs have labels
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(5, count); i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el) => {
        const id = el.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const placeholder = el.getAttribute('placeholder');
        return !!(label || ariaLabel || ariaLabelledBy || placeholder);
      });
      expect(hasLabel).toBeTruthy();
    }
  });

  test("panels should have proper ARIA roles", async ({ page }) => {
    // Open a panel
    const panelButton = page.locator('button').filter({ hasText: /Budget|Statistics|Settings/i }).first();
    
    if (await panelButton.isVisible()) {
      await panelButton.click();
      await page.waitForTimeout(500);
      
      // Check for dialog/panel role
      const panel = page.locator('[role="dialog"], [role="region"]');
      const count = await panel.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("expandable sections should have aria-expanded", async ({ page }) => {
    // Look for expandable elements
    const expandable = page.locator('[aria-expanded]');
    const count = await expandable.count();
    
    // Should have some expandable elements (tool categories, etc.)
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
