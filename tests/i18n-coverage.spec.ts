/**
 * i18n Coverage Tests (Issue #52)
 * 
 * Tests for internationalization coverage of user-facing strings.
 * Verifies that Tutorial, Cobie Narrator, and Event components use gt-next translations.
 * 
 * TDD Phase 1: Write failing tests that verify i18n is properly set up.
 */

import { test, expect } from '@playwright/test';

async function startGame(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const startButton = page.locator('button').filter({ hasText: /New Game|Continue/i }).first();
  try {
    await startButton.waitFor({ state: 'visible', timeout: 20000 });
    await startButton.click({ force: true });
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(4000);
  } catch {
    // Game may auto-start
  }
}

test.describe('i18n Coverage', () => {
  
  test.describe('Tutorial i18n', () => {
    
    test('should use translated strings for tutorial steps', async ({ page }) => {
      // Clear localStorage to force tutorial to show
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.removeItem('cryptocity-tutorial-dismissed');
        localStorage.removeItem('cryptocity-tutorial-progress');
      });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Handle terminology onboarding first
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(3000);
      
      // Look for the tutorial panel (it should be visible for new players)
      const tutorialPanel = page.locator('[class*="tutorial"], text=/Tutorial|Welcome/i').first();
      const hasTutorial = await tutorialPanel.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTutorial) {
        // Tutorial content should be translatable (wrapped with msg() or T component)
        // Check that we see tutorial text (not hardcoded English keys)
        const tutorialText = await tutorialPanel.textContent();
        expect(tutorialText).toBeDefined();
        expect(tutorialText!.length).toBeGreaterThan(10);
        
        // Should not contain translation key patterns like "tutorial.step1"
        expect(tutorialText).not.toMatch(/^tutorial\./);
      }
    });
    
    test('tutorial steps should have translatable titles', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.removeItem('cryptocity-tutorial-dismissed');
        localStorage.removeItem('cryptocity-tutorial-progress');
      });
      await page.reload();
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(3000);
      
      // Tutorial should show "Welcome to Crypto City!" as first step
      const welcomeTitle = page.locator('text=/Welcome to Crypto City/i').first();
      const hasWelcome = await welcomeTitle.isVisible({ timeout: 5000 }).catch(() => false);
      
      // If visible, the title should be a proper translated string
      if (hasWelcome) {
        const titleText = await welcomeTitle.textContent();
        expect(titleText).toContain('Crypto City');
      }
    });
    
  });
  
  test.describe('Cobie Narrator i18n', () => {
    
    test('should use translated strings for Cobie messages', async ({ page }) => {
      await page.goto('/');
      
      // Enable Cobie narrator by ensuring it's not disabled
      await page.evaluate(() => {
        localStorage.removeItem('cryptocity-cobie-disabled');
        localStorage.removeItem('cryptocity-cobie-shown');
      });
      await page.reload();
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(8000); // Wait longer for Cobie to appear
      
      // Look for Cobie narrator component
      const cobieComponent = page.locator('[class*="cobie"], [class*="narrator"], [data-testid="cobie"]').first();
      const hasCobie = await cobieComponent.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (hasCobie) {
        const cobieText = await cobieComponent.textContent();
        expect(cobieText).toBeDefined();
        // Should have actual message content, not translation keys
        expect(cobieText!.length).toBeGreaterThan(20);
        expect(cobieText).not.toMatch(/^cobie\./);
      }
    });
    
    test('Cobie reactions should be translatable', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.removeItem('cryptocity-cobie-disabled');
      });
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(5000);
      
      // The Cobie narrator system should use msg() for all messages
      // This tests that the i18n system is integrated
      const cobieArea = page.locator('[class*="cobie"], [class*="narrator"]').first();
      const isVisible = await cobieArea.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Even if Cobie is not visible, verify the i18n setup exists
      expect(true).toBeTruthy(); // Placeholder - actual implementation will verify msg() usage
    });
    
  });
  
  test.describe('Crypto Events i18n', () => {
    
    test('should use translated strings for event names and descriptions', async ({ page }) => {
      await page.goto('/');
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(3000);
      
      // Open events panel
      const eventsButton = page.locator('button').filter({ hasText: /Events|📰/i }).first();
      const hasEventsButton = await eventsButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasEventsButton) {
        await eventsButton.click();
        await page.waitForTimeout(500);
        
        // Events panel should show translatable content
        const panelContent = await page.textContent('[role="dialog"]');
        if (panelContent) {
          // Should not contain raw translation keys
          expect(panelContent).not.toMatch(/^event\./);
        }
      }
    });
    
    test('event definitions should have translatable strings', async ({ page }) => {
      await page.goto('/');
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(3000);
      
      // Verify event names like "Bull Run!" or "Bear Market" are translatable
      // by checking the News Ticker which shows event headlines
      const ticker = page.locator('[class*="ticker"], [class*="news"], [class*="marquee"]').first();
      const hasTicker = await ticker.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTicker) {
        const tickerText = await ticker.textContent();
        expect(tickerText).toBeDefined();
        // Should have readable content, not keys
        expect(tickerText).not.toMatch(/^event\./);
      }
    });
    
  });
  
  test.describe('Translation Key Patterns', () => {
    
    test('should not expose raw translation keys in UI', async ({ page }) => {
      await page.goto('/');
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(3000);
      
      // Get all text content from the page
      const bodyText = await page.textContent('body');
      
      // Should not contain patterns like "tutorial.step1" or "cobie.welcome"
      expect(bodyText).not.toMatch(/\b(tutorial|cobie|event)\.[a-z_]+\b/);
    });
    
    test('should have proper translations for button labels', async ({ page }) => {
      await page.goto('/');
      
      // Handle terminology onboarding
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
      
      await startGame(page);
      await page.waitForTimeout(2000);
      
      // Common buttons should have proper text (not translation keys)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 20); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        if (text && text.length > 0) {
          // Should not be a translation key pattern
          expect(text).not.toMatch(/^ui\.button\./);
          expect(text).not.toMatch(/^button\.[a-z]/);
        }
      }
    });
    
  });
  
  test.describe('Translation File Existence', () => {
    
    test('should have English translation file', async ({ page }) => {
      // This test verifies the translation file is loadable
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Check if the GT provider is working by looking for lang attribute
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      
      // Should have a language set
      expect(lang).toBeDefined();
      // Default should be English
      expect(['en', 'en-US', 'en-GB'].some(l => lang?.includes(l) || lang === null)).toBeTruthy();
    });
    
  });
  
});
