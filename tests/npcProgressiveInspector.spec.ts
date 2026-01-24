/**
 * NPC Progressive Disclosure Inspector Tests
 * Issue #213: Progressive Disclosure NPC Inspector UI
 * 
 * Tests for the progressive disclosure NPC inspector that shows:
 * - Level 0: Name and emoji (visible on hover)
 * - Level 1: Name, personality, current action
 * - Level 2: Full profile, recent thoughts, transaction history
 * 
 * TDD Phase 1: Write failing tests first
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Progressive disclosure levels */
const DISCLOSURE_LEVELS = {
  LEVEL_0: 0, // Minimal: Name and emoji
  LEVEL_1: 1, // Basic: Name, personality, current action
  LEVEL_2: 2, // Full: Complete profile, thoughts, transactions
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function openNPCPanel(page: any) {
  // Navigate to the game
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Click on an NPC or open NPC panel if available
  const npcButton = page.locator('[data-testid="npc-inspector-button"]').first();
  if (await npcButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await npcButton.click();
    return true;
  }
  return false;
}

// =============================================================================
// COMPONENT EXISTENCE TESTS
// =============================================================================

test.describe('NPC Inspector Panel Structure', () => {
  test('should have NPCInspectorPanel component', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // The panel should be importable (component exists)
    // This test verifies the component file exists
    const response = await page.evaluate(async () => {
      try {
        // Dynamic import to check if component exists
        const mod = await import('../src/components/game/panels/NPCInspectorPanel');
        return { exists: !!mod.NPCInspectorPanel };
      } catch {
        return { exists: false };
      }
    });
    
    // This will fail initially since component doesn't exist
    expect(response.exists).toBe(true);
  });

  test('should have useNPCInspector hook', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const response = await page.evaluate(async () => {
      try {
        const mod = await import('../src/hooks/useNPCInspector');
        return { exists: !!mod.useNPCInspector };
      } catch {
        return { exists: false };
      }
    });
    
    expect(response.exists).toBe(true);
  });
});

// =============================================================================
// PROGRESSIVE DISCLOSURE LEVEL 0 TESTS
// =============================================================================

test.describe('Progressive Disclosure Level 0 - Minimal View', () => {
  test('should show NPC name on hover', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find an NPC element on the canvas
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Hover over NPC
      await npcElement.hover();
      
      // Should show name tooltip or label
      const nameLabel = page.locator('[data-testid="npc-name-label"]');
      await expect(nameLabel).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show mood emoji on hover', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.hover();
      
      // Should show mood emoji
      const moodEmoji = page.locator('[data-testid="npc-mood-emoji"]');
      await expect(moodEmoji).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show minimal info badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.hover();
      
      // Should have a minimal info badge
      const infoBadge = page.locator('[data-testid="npc-info-badge-minimal"]');
      await expect(infoBadge).toBeVisible({ timeout: 2000 });
    }
  });
});

// =============================================================================
// PROGRESSIVE DISCLOSURE LEVEL 1 TESTS
// =============================================================================

test.describe('Progressive Disclosure Level 1 - Basic View', () => {
  test('should expand to level 1 on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      // Level 1 card should appear
      const level1Card = page.locator('[data-testid="npc-inspector-level-1"]');
      await expect(level1Card).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show personality archetype at level 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      // Should show archetype
      const archetype = page.locator('[data-testid="npc-archetype"]');
      await expect(archetype).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show current action at level 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      // Should show current action
      const action = page.locator('[data-testid="npc-current-action"]');
      await expect(action).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show occupation at level 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      // Should show occupation
      const occupation = page.locator('[data-testid="npc-occupation"]');
      await expect(occupation).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have expand button to level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      // Should have expand button
      const expandBtn = page.locator('[data-testid="npc-expand-details"]');
      await expect(expandBtn).toBeVisible({ timeout: 2000 });
    }
  });
});

// =============================================================================
// PROGRESSIVE DISCLOSURE LEVEL 2 TESTS
// =============================================================================

test.describe('Progressive Disclosure Level 2 - Full View', () => {
  test('should expand to level 2 panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Level 2 panel should appear
      const level2Panel = page.locator('[data-testid="npc-inspector-level-2"]');
      await expect(level2Panel).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show current thought at level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Should show thought bubble
      const thought = page.locator('[data-testid="npc-current-thought"]');
      await expect(thought).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show personality traits at level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Should show traits section
      const traits = page.locator('[data-testid="npc-personality-traits"]');
      await expect(traits).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show recent thoughts history at level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Should show recent thoughts
      const recentThoughts = page.locator('[data-testid="npc-recent-thoughts"]');
      await expect(recentThoughts).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show X402 wallet section at level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Should show wallet section
      const wallet = page.locator('[data-testid="npc-x402-wallet"]');
      await expect(wallet).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show transaction history at level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Should show transactions
      const transactions = page.locator('[data-testid="npc-transactions"]');
      await expect(transactions).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show relationships at level 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      // Should show relationships
      const relationships = page.locator('[data-testid="npc-relationships"]');
      await expect(relationships).toBeVisible({ timeout: 2000 });
    }
  });
});

// =============================================================================
// INTERACTION TESTS
// =============================================================================

test.describe('NPC Inspector Interactions', () => {
  test('should close on X button click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      const closeBtn = page.locator('[data-testid="npc-inspector-close"]');
      await closeBtn.click();
      
      // Panel should be closed
      const panel = page.locator('[data-testid="npc-inspector-level-1"]');
      await expect(panel).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should have favorite toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      const favoriteBtn = page.locator('[data-testid="npc-favorite-toggle"]');
      await expect(favoriteBtn).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have talk action button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      const talkBtn = page.locator('[data-testid="npc-action-talk"]');
      await expect(talkBtn).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have follow action button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      const followBtn = page.locator('[data-testid="npc-action-follow"]');
      await expect(followBtn).toBeVisible({ timeout: 2000 });
    }
  });
});

// =============================================================================
// COLLAPSIBLE SECTIONS TESTS
// =============================================================================

test.describe('Collapsible Sections', () => {
  test('should have collapsible personality section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      const section = page.locator('[data-testid="npc-section-personality"]');
      await expect(section).toBeVisible({ timeout: 2000 });
      
      // Should be collapsible
      const toggle = section.locator('[data-testid="section-toggle"]');
      await expect(toggle).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have collapsible thoughts section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      const section = page.locator('[data-testid="npc-section-thoughts"]');
      await expect(section).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have collapsible wallet section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      const section = page.locator('[data-testid="npc-section-wallet"]');
      await expect(section).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have collapsible relationships section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      await page.locator('[data-testid="npc-expand-details"]').click();
      
      const section = page.locator('[data-testid="npc-section-relationships"]');
      await expect(section).toBeVisible({ timeout: 2000 });
    }
  });
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

test.describe('Accessibility', () => {
  test('should have proper aria labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await npcElement.click();
      
      // Panel should have aria-label or role
      const panel = page.locator('[data-testid="npc-inspector-level-1"]');
      const ariaLabel = await panel.getAttribute('aria-label');
      const role = await panel.getAttribute('role');
      
      expect(ariaLabel || role).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const npcElement = page.locator('[data-testid="npc-indicator"]').first();
    
    if (await npcElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Focus and enter to open
      await npcElement.focus();
      await page.keyboard.press('Enter');
      
      // Panel should be visible
      const panel = page.locator('[data-testid="npc-inspector-level-1"]');
      await expect(panel).toBeVisible({ timeout: 2000 });
      
      // Escape should close
      await page.keyboard.press('Escape');
      await expect(panel).not.toBeVisible({ timeout: 2000 });
    }
  });
});
