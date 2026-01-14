/**
 * Tutorial and Onboarding Coordination Tests (Issues #184, #185)
 * 
 * Issue #184: Tutorial shows simultaneously with TerminologyOnboarding
 * Issue #185: Tutorial restart button overlaps DailyRewards
 * 
 * TDD - These tests define expected behavior for the fixes.
 */

import { test, expect } from '@playwright/test';

test.describe('Tutorial and Onboarding Coordination', () => {
  
  test.describe('Issue #184: Tutorial waits for TerminologyOnboarding', () => {
    
    test('should NOT show Tutorial while TerminologyOnboarding is visible', async ({ page }) => {
      // Clear storage to simulate first-time player
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Start new game
      const newGameButton = page.locator('button:has-text("New Game")').first();
      if (await newGameButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newGameButton.click();
        await page.waitForTimeout(2000);
      }
      
      // TerminologyOnboarding dialog should be visible (asking about crypto familiarity)
      const onboardingDialog = page.locator('text="Are you familiar with crypto terminology?"');
      const hasOnboarding = await onboardingDialog.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasOnboarding) {
        // While onboarding is showing, Tutorial should NOT be visible
        const tutorialPanel = page.locator('text="Tutorial"').first();
        const tutorialVisible = await tutorialPanel.isVisible({ timeout: 1000 }).catch(() => false);
        
        // Tutorial should NOT show while terminology onboarding is active
        expect(tutorialVisible).toBeFalsy();
      }
    });
    
    test('should show Tutorial AFTER completing TerminologyOnboarding', async ({ page }) => {
      // Clear storage to simulate first-time player
      await page.goto('/');
      await page.evaluate(() => {
        // Clear all storage to ensure fresh state
        localStorage.clear();
        sessionStorage.clear();
      });
      // Reload with fresh state
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Start new game
      const newGameButton = page.locator('button:has-text("New Game")').first();
      if (await newGameButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newGameButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Complete terminology onboarding by clicking "Yes, I know crypto!"
      // Use exact button text as shown in the dialog
      const yesButton = page.getByRole('button', { name: /Yes, I know crypto/i });
      await expect(yesButton).toBeVisible({ timeout: 5000 });
      await yesButton.click();
      
      // Wait for the onboarding dialog to close
      await page.waitForTimeout(1000);
      
      // Verify onboarding is marked as complete
      const onboardingComplete = await page.evaluate(() => {
        return localStorage.getItem('cryptocity-terminology-onboarding-shown') === 'true';
      });
      expect(onboardingComplete).toBeTruthy();
      
      // Wait for the Tutorial to detect onboarding completion (polling interval is 500ms)
      await page.waitForTimeout(2000);
      
      // Now Tutorial SHOULD be visible - look for the Tutorial header in the panel
      const tutorialPanel = page.locator('.bg-blue-600:has-text("Tutorial")');
      await expect(tutorialPanel).toBeVisible({ timeout: 10000 });
    });
    
    test('should show Tutorial for returning players (onboarding already completed)', async ({ page }) => {
      await page.goto('/');
      
      // Set up as returning player - onboarding already completed
      await page.evaluate(() => {
        localStorage.setItem('cryptocity-terminology-mode', 'crypto');
        localStorage.setItem('cryptocity-terminology-onboarding-shown', 'true');
        // Clear tutorial dismissal so tutorial shows
        localStorage.removeItem('cryptocity-tutorial-dismissed');
      });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Start new game
      const newGameButton = page.locator('button:has-text("New Game")').first();
      if (await newGameButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newGameButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Tutorial should show immediately since onboarding is already done
      // Use same selector as other tests - look for the Tutorial panel header
      const tutorialPanel = page.locator('.bg-blue-600:has-text("Tutorial")');
      await expect(tutorialPanel).toBeVisible({ timeout: 10000 });
    });
    
  });
  
  test.describe('Issue #185: Tutorial restart button position', () => {
    
    test('restart button should have bottom-16 positioning (not bottom-4)', async ({ page }) => {
      await page.goto('/');
      
      // Set up player with completed tutorial
      await page.evaluate(() => {
        localStorage.setItem('cryptocity-terminology-mode', 'crypto');
        localStorage.setItem('cryptocity-terminology-onboarding-shown', 'true');
        localStorage.setItem('cryptocity-tutorial-dismissed', 'true');
      });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Start game
      const newGameButton = page.locator('button:has-text("New Game")').first();
      if (await newGameButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newGameButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Find the restart tutorial button (lightbulb icon button)
      const restartButton = page.locator('button[title="Restart Tutorial"], button:has(svg.lucide-lightbulb)').first();
      
      if (await restartButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check that button has bottom-16 class (not bottom-4)
        const hasCorrectPosition = await restartButton.evaluate((el) => {
          return el.classList.contains('bottom-16');
        });
        
        const hasWrongPosition = await restartButton.evaluate((el) => {
          return el.classList.contains('bottom-4');
        });
        
        expect(hasCorrectPosition).toBeTruthy();
        expect(hasWrongPosition).toBeFalsy();
      }
    });
    
    test('restart button should not overlap with DailyRewards button', async ({ page }) => {
      await page.goto('/');
      
      // Set up player with completed tutorial
      await page.evaluate(() => {
        localStorage.setItem('cryptocity-terminology-mode', 'crypto');
        localStorage.setItem('cryptocity-terminology-onboarding-shown', 'true');
        localStorage.setItem('cryptocity-tutorial-dismissed', 'true');
      });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Start game
      const newGameButton = page.locator('button:has-text("New Game")').first();
      if (await newGameButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newGameButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Find restart tutorial button and DailyRewards button
      const restartButton = page.locator('button[title="Restart Tutorial"], button:has(svg.lucide-lightbulb)').first();
      const dailyRewardsButton = page.locator('button:has-text("Daily"), [data-testid="daily-rewards"]').first();
      
      const restartVisible = await restartButton.isVisible({ timeout: 5000 }).catch(() => false);
      const dailyVisible = await dailyRewardsButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (restartVisible && dailyVisible) {
        // Get bounding boxes
        const restartBox = await restartButton.boundingBox();
        const dailyBox = await dailyRewardsButton.boundingBox();
        
        if (restartBox && dailyBox) {
          // Check for no overlap
          const overlapsX = restartBox.x < dailyBox.x + dailyBox.width && 
                           restartBox.x + restartBox.width > dailyBox.x;
          const overlapsY = restartBox.y < dailyBox.y + dailyBox.height && 
                           restartBox.y + restartBox.height > dailyBox.y;
          
          // Should NOT overlap
          const hasOverlap = overlapsX && overlapsY;
          expect(hasOverlap).toBeFalsy();
        }
      }
    });
    
  });
  
});
