/**
 * Notification Center Tests (Issue #65)
 * 
 * Tests for the notification system including:
 * - NotificationManager class
 * - NotificationBadge component
 * - NotificationCenter panel
 * - NotificationToast popup
 * - NotificationItem component
 * - Integration with disasters, milestones, and trades
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Start the game from home screen
 */
async function startGame(page: Page) {
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

/**
 * Dismiss tutorial and cobie popups
 */
async function dismissPopups(page: Page) {
  try {
    const gotItButton = page.getByRole('button', { name: /Got it/i });
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click({ force: true });
      await page.waitForTimeout(500);
    }
  } catch { /* ignore */ }
  
  try {
    const dismissButton = page.getByRole('button', { name: /Dismiss Tutorial/i });
    if (await dismissButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dismissButton.click({ force: true });
      await page.waitForTimeout(500);
    }
  } catch { /* ignore */ }
}

/**
 * Wait for game to be fully loaded
 */
async function waitForGameLoad(page: Page) {
  await page.goto('/');
  await startGame(page);
  await dismissPopups(page);
  // Give time for React to stabilize
  await page.waitForTimeout(2000);
}

/**
 * Trigger a test notification via console injection
 */
async function triggerTestNotification(page: Page, type: string = 'info', priority: string = 'medium') {
  await page.evaluate(({ type, priority }) => {
    // Access the notification manager from window for testing
    const notificationManager = (window as unknown as { notificationManager?: {
      add: (notification: {
        type: string;
        title: string;
        message: string;
        gameDay: number;
        isRead: boolean;
        priority: string;
      }) => void;
    } }).notificationManager;
    if (notificationManager) {
      notificationManager.add({
        type: type,
        title: `Test ${type} Notification`,
        message: `This is a test ${type} notification with ${priority} priority.`,
        gameDay: 1,
        isRead: false,
        priority: priority,
      });
    }
  }, { type, priority });
}

// ============================================================================
// NOTIFICATION BADGE TESTS
// ============================================================================

test.describe('Notification Badge', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
  });

  test('should display notification badge in top bar', async ({ page }) => {
    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('should show unread count when notifications exist', async ({ page }) => {
    // Trigger some test notifications
    await triggerTestNotification(page, 'info', 'low');
    await triggerTestNotification(page, 'warning', 'medium');
    await page.waitForTimeout(500);
    
    const unreadCount = page.locator('[data-testid="notification-unread-count"]');
    await expect(unreadCount).toBeVisible({ timeout: 5000 });
    
    const countText = await unreadCount.textContent();
    expect(parseInt(countText || '0')).toBeGreaterThan(0);
  });

  test('should animate on new notification', async ({ page }) => {
    // Wait for badge to settle
    await page.waitForTimeout(1000);
    
    // Trigger a critical notification
    await triggerTestNotification(page, 'rug_pull', 'critical');
    
    // Badge should have animation class
    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).toHaveClass(/shake|animate/i, { timeout: 3000 });
  });

  test('should open notification center on click', async ({ page }) => {
    const badge = page.locator('[data-testid="notification-badge"]');
    await badge.click();
    
    const center = page.locator('[data-testid="notification-center"]');
    await expect(center).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// NOTIFICATION CENTER TESTS
// ============================================================================

test.describe('Notification Center', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
    
    // Open notification center
    const badge = page.locator('[data-testid="notification-badge"]');
    await badge.click();
    await page.waitForTimeout(500);
  });

  test('should display notification center panel', async ({ page }) => {
    const center = page.locator('[data-testid="notification-center"]');
    await expect(center).toBeVisible({ timeout: 5000 });
  });

  test('should show notification list', async ({ page }) => {
    const list = page.locator('[data-testid="notification-list"]');
    await expect(list).toBeVisible({ timeout: 5000 });
  });

  test('should display notifications grouped by day', async ({ page }) => {
    // Add some notifications first
    await triggerTestNotification(page, 'info', 'low');
    await triggerTestNotification(page, 'milestone', 'medium');
    await page.waitForTimeout(500);
    
    // Check for day grouping
    const dayGroups = page.locator('[data-testid="notification-day-group"]');
    await expect(dayGroups.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have filter controls', async ({ page }) => {
    const filterContainer = page.locator('[data-testid="notification-filters"]');
    await expect(filterContainer).toBeVisible({ timeout: 5000 });
  });

  test('should filter notifications by type', async ({ page }) => {
    // Add mixed notifications
    await triggerTestNotification(page, 'info', 'low');
    await triggerTestNotification(page, 'disaster', 'high');
    await triggerTestNotification(page, 'milestone', 'medium');
    await page.waitForTimeout(500);
    
    // Click on disaster filter
    const disasterFilter = page.locator('[data-testid="filter-disaster"]');
    await disasterFilter.click();
    await page.waitForTimeout(300);
    
    // Should only show disaster notifications
    const items = page.locator('[data-testid="notification-item"]');
    const count = await items.count();
    
    // Each visible item should be of type disaster
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const type = await item.getAttribute('data-notification-type');
      expect(type).toBe('disaster');
    }
  });

  test('should filter notifications by priority', async ({ page }) => {
    // Add notifications of different priorities
    await triggerTestNotification(page, 'info', 'low');
    await triggerTestNotification(page, 'warning', 'high');
    await triggerTestNotification(page, 'rug_pull', 'critical');
    await page.waitForTimeout(500);
    
    // Click on critical filter
    const criticalFilter = page.locator('[data-testid="filter-critical"]');
    await criticalFilter.click();
    await page.waitForTimeout(300);
    
    // Should only show critical notifications
    const items = page.locator('[data-testid="notification-item"]');
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const priority = await item.getAttribute('data-notification-priority');
      expect(priority).toBe('critical');
    }
  });

  test('should have mark all as read button', async ({ page }) => {
    const markAllBtn = page.locator('[data-testid="mark-all-read"]');
    await expect(markAllBtn).toBeVisible({ timeout: 5000 });
  });

  test('should mark all notifications as read when button clicked', async ({ page }) => {
    // Add some unread notifications
    await triggerTestNotification(page, 'info', 'low');
    await triggerTestNotification(page, 'warning', 'medium');
    await page.waitForTimeout(500);
    
    // Click mark all as read
    const markAllBtn = page.locator('[data-testid="mark-all-read"]');
    await markAllBtn.click();
    await page.waitForTimeout(300);
    
    // Unread count should be 0 or hidden
    const unreadCount = page.locator('[data-testid="notification-unread-count"]');
    const isVisible = await unreadCount.isVisible();
    if (isVisible) {
      const countText = await unreadCount.textContent();
      expect(parseInt(countText || '0')).toBe(0);
    }
  });

  test('should close when clicking X button', async ({ page }) => {
    const closeBtn = page.locator('[data-testid="notification-center-close"]');
    await closeBtn.click();
    
    const center = page.locator('[data-testid="notification-center"]');
    await expect(center).not.toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// NOTIFICATION ITEM TESTS
// ============================================================================

test.describe('Notification Item', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
    
    // Add a notification and open center
    await triggerTestNotification(page, 'info', 'medium');
    await page.waitForTimeout(500);
    
    const badge = page.locator('[data-testid="notification-badge"]');
    await badge.click();
    await page.waitForTimeout(500);
  });

  test('should display notification items with correct structure', async ({ page }) => {
    const item = page.locator('[data-testid="notification-item"]').first();
    await expect(item).toBeVisible({ timeout: 5000 });
    
    // Should have icon
    const icon = item.locator('[data-testid="notification-icon"]');
    await expect(icon).toBeVisible();
    
    // Should have title
    const title = item.locator('[data-testid="notification-title"]');
    await expect(title).toBeVisible();
    
    // Should have message
    const message = item.locator('[data-testid="notification-message"]');
    await expect(message).toBeVisible();
    
    // Should have timestamp
    const timestamp = item.locator('[data-testid="notification-timestamp"]');
    await expect(timestamp).toBeVisible();
  });

  test('should mark notification as read when clicked', async ({ page }) => {
    const item = page.locator('[data-testid="notification-item"]').first();
    
    // Check initial unread state
    await expect(item).toHaveAttribute('data-read', 'false', { timeout: 3000 });
    
    // Click item
    await item.click();
    await page.waitForTimeout(300);
    
    // Should now be read
    await expect(item).toHaveAttribute('data-read', 'true', { timeout: 3000 });
  });

  test('should show different styling for unread vs read notifications', async ({ page }) => {
    // Add an unread notification
    await triggerTestNotification(page, 'warning', 'high');
    await page.waitForTimeout(300);
    
    const unreadItem = page.locator('[data-testid="notification-item"][data-read="false"]').first();
    await expect(unreadItem).toBeVisible({ timeout: 3000 });
    
    // Unread should have distinct styling (e.g., background color or border)
    await expect(unreadItem).toHaveClass(/unread|bg-|border-/);
  });

  test('should display correct icon for each notification type', async ({ page }) => {
    // Add different types of notifications
    await triggerTestNotification(page, 'rug_pull', 'critical');
    await triggerTestNotification(page, 'milestone', 'medium');
    await triggerTestNotification(page, 'disaster', 'high');
    await page.waitForTimeout(500);
    
    // Each type should have appropriate icon
    const rugPullItem = page.locator('[data-testid="notification-item"][data-notification-type="rug_pull"]').first();
    if (await rugPullItem.isVisible()) {
      const rugPullIcon = rugPullItem.locator('[data-testid="notification-icon"]');
      await expect(rugPullIcon).toBeVisible();
    }
    
    const milestoneItem = page.locator('[data-testid="notification-item"][data-notification-type="milestone"]').first();
    if (await milestoneItem.isVisible()) {
      const milestoneIcon = milestoneItem.locator('[data-testid="notification-icon"]');
      await expect(milestoneIcon).toBeVisible();
    }
  });
});

// ============================================================================
// NOTIFICATION TOAST TESTS
// ============================================================================

test.describe('Notification Toast', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
  });

  test('should display toast for critical notifications', async ({ page }) => {
    // Trigger a critical notification
    await triggerTestNotification(page, 'rug_pull', 'critical');
    
    // Toast should appear
    const toast = page.locator('[data-testid="notification-toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('should auto-dismiss toast after delay', async ({ page }) => {
    await triggerTestNotification(page, 'rug_pull', 'critical');
    
    const toast = page.locator('[data-testid="notification-toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Wait for auto-dismiss (5 seconds + buffer)
    await page.waitForTimeout(6000);
    
    await expect(toast).not.toBeVisible({ timeout: 3000 });
  });

  test('should dismiss toast on click', async ({ page }) => {
    await triggerTestNotification(page, 'disaster', 'critical');
    
    const toast = page.locator('[data-testid="notification-toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    const closeBtn = toast.locator('[data-testid="toast-close"]');
    await closeBtn.click();
    
    await expect(toast).not.toBeVisible({ timeout: 3000 });
  });

  test('should open notification center when toast clicked', async ({ page }) => {
    await triggerTestNotification(page, 'milestone', 'critical');
    
    const toast = page.locator('[data-testid="notification-toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Click on toast body (not close button)
    const toastBody = toast.locator('[data-testid="toast-body"]');
    await toastBody.click();
    
    const center = page.locator('[data-testid="notification-center"]');
    await expect(center).toBeVisible({ timeout: 5000 });
  });

  test('should not show toast for low priority notifications', async ({ page }) => {
    await triggerTestNotification(page, 'info', 'low');
    
    // Toast should NOT appear for low priority
    const toast = page.locator('[data-testid="notification-toast"]');
    await expect(toast).not.toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// INTEGRATION TESTS - DISASTERS
// ============================================================================

test.describe('Notification Integration - Disasters', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
  });

  test('should create notification when disaster starts', async ({ page }) => {
    // Trigger disaster via console
    await page.evaluate(() => {
      const disasterManager = (window as unknown as { disasterManager?: {
        forceDisaster: (id: string) => unknown;
      } }).disasterManager;
      if (disasterManager) {
        disasterManager.forceDisaster('market_crash');
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Open notification center
    const badge = page.locator('[data-testid="notification-badge"]');
    await badge.click();
    await page.waitForTimeout(500);
    
    // Should have disaster notification
    const disasterNotif = page.locator('[data-testid="notification-item"][data-notification-type="disaster"]');
    await expect(disasterNotif.first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// INTEGRATION TESTS - MILESTONES
// ============================================================================

test.describe('Notification Integration - Milestones', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
  });

  test('should create notification when milestone completed', async ({ page }) => {
    // Trigger milestone completion via console
    await page.evaluate(() => {
      const notificationManager = (window as unknown as { notificationManager?: {
        add: (notification: {
          type: string;
          title: string;
          message: string;
          gameDay: number;
          isRead: boolean;
          priority: string;
        }) => void;
      } }).notificationManager;
      if (notificationManager) {
        notificationManager.add({
          type: 'milestone',
          title: 'Milestone Complete!',
          message: 'You completed the First Yields milestone!',
          gameDay: 1,
          isRead: false,
          priority: 'high',
        });
      }
    });
    
    await page.waitForTimeout(500);
    
    // Open notification center
    const badge = page.locator('[data-testid="notification-badge"]');
    await badge.click();
    await page.waitForTimeout(500);
    
    // Should have milestone notification
    const milestoneNotif = page.locator('[data-testid="notification-item"][data-notification-type="milestone"]');
    await expect(milestoneNotif.first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// PERSISTENCE TESTS
// ============================================================================

test.describe('Notification Persistence', () => {
  test('should persist notifications to localStorage', async ({ page }) => {
    await waitForGameLoad(page);
    
    // Add some notifications
    await triggerTestNotification(page, 'info', 'low');
    await triggerTestNotification(page, 'warning', 'medium');
    await page.waitForTimeout(500);
    
    // Check localStorage
    const stored = await page.evaluate(() => {
      return localStorage.getItem('cryptoCityNotifications');
    });
    
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored || '[]');
    expect(parsed.length).toBeGreaterThan(0);
  });

  test('should restore notifications on page reload', async ({ page }) => {
    await waitForGameLoad(page);
    
    // Add notifications
    await triggerTestNotification(page, 'milestone', 'high');
    await page.waitForTimeout(500);
    
    // Get count
    const badge = page.locator('[data-testid="notification-badge"]');
    await badge.click();
    await page.waitForTimeout(500);
    
    const countBefore = await page.locator('[data-testid="notification-item"]').count();
    expect(countBefore).toBeGreaterThan(0);
    
    // Reload page
    await page.reload();
    await waitForGameLoad(page);
    
    // Open center again
    await badge.click();
    await page.waitForTimeout(500);
    
    // Count should be preserved
    const countAfter = await page.locator('[data-testid="notification-item"]').count();
    expect(countAfter).toBe(countBefore);
  });

  test('should limit notifications to 100', async ({ page }) => {
    await waitForGameLoad(page);
    
    // Add more than 100 notifications via console
    await page.evaluate(() => {
      const notificationManager = (window as unknown as { notificationManager?: {
        add: (notification: {
          type: string;
          title: string;
          message: string;
          gameDay: number;
          isRead: boolean;
          priority: string;
        }) => void;
        getFiltered: (filter: Record<string, unknown>) => unknown[];
      } }).notificationManager;
      if (notificationManager) {
        for (let i = 0; i < 120; i++) {
          notificationManager.add({
            type: 'info',
            title: `Test Notification ${i}`,
            message: `This is test notification number ${i}`,
            gameDay: 1,
            isRead: false,
            priority: 'low',
          });
        }
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check that only 100 are stored
    const count = await page.evaluate(() => {
      const notificationManager = (window as unknown as { notificationManager?: {
        getFiltered: (filter: Record<string, unknown>) => unknown[];
      } }).notificationManager;
      if (notificationManager) {
        return notificationManager.getFiltered({}).length;
      }
      return 0;
    });
    
    expect(count).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// NOTIFICATION PREFERENCES TESTS
// ============================================================================

test.describe('Notification Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await waitForGameLoad(page);
    
    // Open settings panel
    const settingsBtn = page.locator('[data-testid="settings-button"], [aria-label="Settings"]');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have notification settings section', async ({ page }) => {
    const notifSettings = page.locator('[data-testid="notification-settings"]');
    // This may be in a tab or expandable section
    const isVisible = await notifSettings.isVisible().catch(() => false);
    
    // If not immediately visible, try to find in tabs
    if (!isVisible) {
      const notifTab = page.locator('text=/notification/i');
      if (await notifTab.isVisible()) {
        await notifTab.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Should have toggle for toasts
    const toastToggle = page.locator('[data-testid="notification-toast-toggle"]');
    await expect(toastToggle).toBeVisible({ timeout: 5000 });
  });

  test('should disable toasts when preference is off', async ({ page }) => {
    // Turn off toasts
    const toastToggle = page.locator('[data-testid="notification-toast-toggle"]');
    if (await toastToggle.isVisible()) {
      await toastToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Close settings
    const closeBtn = page.locator('[data-testid="settings-close"], [aria-label="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
    
    // Trigger a critical notification
    await triggerTestNotification(page, 'rug_pull', 'critical');
    await page.waitForTimeout(1000);
    
    // Toast should NOT appear
    const toast = page.locator('[data-testid="notification-toast"]');
    await expect(toast).not.toBeVisible({ timeout: 2000 });
  });
});
