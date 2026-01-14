---
name: write-playwright-test
description: Generate Playwright tests matching project patterns. Use when adding test coverage for new features.
---

# Write Playwright Test

Complete workflow for writing Playwright tests for CryptoCity.

## Test Infrastructure

| Item | Value |
|------|-------|
| Framework | Playwright |
| Config | `playwright.config.ts` |
| Test Directory | `tests/` |
| Total Tests | 3,791+ |

## Project Test Patterns

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('FeatureName', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForSelector('canvas');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    const button = page.locator('[data-testid="my-button"]');
    
    // Act
    await button.click();
    
    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Using Window Test Hooks

Many game systems expose test hooks:

```typescript
test('NPC simulation state', async ({ page }) => {
  // Access test hooks exposed on window
  const npcCount = await page.evaluate(() => {
    return window.__TEST_HOOKS__?.getNPCSimulation()?.getAllNPCs().length ?? 0;
  });
  
  expect(npcCount).toBeGreaterThan(0);
});
```

Available test hooks:
- `window.__TEST_HOOKS__.getTitanManager()`
- `window.__TEST_HOOKS__.getNPCSimulation()`
- `window.__TEST_HOOKS__.getCryptoEconomy()`
- `window.__TEST_HOOKS__.getGameState()`

### Testing Panels

```typescript
test.describe('SettingsPanel', () => {
  test('opens when clicking settings button', async ({ page }) => {
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('closes when clicking overlay', async ({ page }) => {
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-state="open"][data-radix-dialog-overlay]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('saves changes', async ({ page }) => {
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="sound-toggle"]');
    await page.click('[data-testid="save-button"]');
    
    // Reload and verify persisted
    await page.reload();
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('[data-testid="sound-toggle"]')).toBeChecked();
  });
});
```

### Testing Canvas Interactions

```typescript
test.describe('Canvas Building Placement', () => {
  test('places building on click', async ({ page }) => {
    // Select building tool
    await page.click('[data-testid="residential-tool"]');
    
    // Click on canvas at specific position
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 400, y: 300 } });
    
    // Verify building placed via state
    const hasBuilding = await page.evaluate(() => {
      const state = window.__TEST_HOOKS__?.getGameState();
      return state?.grid.some(row => row.some(cell => cell.buildingId));
    });
    
    expect(hasBuilding).toBe(true);
  });
});
```

### Testing NPC System

```typescript
test.describe('NPC Simulation', () => {
  test('NPCs spawn with valid needs', async ({ page }) => {
    const npcs = await page.evaluate(() => {
      return window.__TEST_HOOKS__?.getNPCSimulation()?.getAllNPCs() ?? [];
    });
    
    for (const npc of npcs) {
      expect(npc.needs.hunger).toBeGreaterThanOrEqual(0);
      expect(npc.needs.hunger).toBeLessThanOrEqual(100);
      expect(npc.needs.energy).toBeGreaterThanOrEqual(0);
      expect(npc.needs.energy).toBeLessThanOrEqual(100);
    }
  });

  test('NPCs move toward destinations', async ({ page }) => {
    // Get initial positions
    const initialPositions = await page.evaluate(() => {
      return window.__TEST_HOOKS__?.getNPCSimulation()?.getAllNPCs()
        .map(n => ({ id: n.id, x: n.position.x, y: n.position.y })) ?? [];
    });
    
    // Wait for movement
    await page.waitForTimeout(2000);
    
    // Get new positions
    const newPositions = await page.evaluate(() => {
      return window.__TEST_HOOKS__?.getNPCSimulation()?.getAllNPCs()
        .map(n => ({ id: n.id, x: n.position.x, y: n.position.y })) ?? [];
    });
    
    // At least some NPCs should have moved
    const movedCount = initialPositions.filter((init, i) => {
      const curr = newPositions.find(n => n.id === init.id);
      return curr && (curr.x !== init.x || curr.y !== init.y);
    }).length;
    
    expect(movedCount).toBeGreaterThan(0);
  });
});
```

### Testing Crypto Economy

```typescript
test.describe('Crypto Economy', () => {
  test('buildings generate yield', async ({ page }) => {
    // Place a crypto building
    await page.evaluate(() => {
      window.__TEST_HOOKS__?.placeCryptoBuilding(10, 10, 'aave-lending-tower');
    });
    
    // Get initial yield
    const initialYield = await page.evaluate(() => {
      return window.__TEST_HOOKS__?.getCryptoEconomy()?.getTotalYield() ?? 0;
    });
    
    // Wait for tick
    await page.waitForTimeout(1000);
    
    // Verify yield increased
    const newYield = await page.evaluate(() => {
      return window.__TEST_HOOKS__?.getCryptoEconomy()?.getTotalYield() ?? 0;
    });
    
    expect(newYield).toBeGreaterThan(initialYield);
  });
});
```

## Test Categories

| File Pattern | Coverage Area |
|--------------|---------------|
| `game.spec.ts` | Core game mechanics |
| `npc*.spec.ts` | NPC simulation (20+ files) |
| `titan*.spec.ts` | Hero pet system (21 files) |
| `crypto*.spec.ts` | Crypto economy |
| `*Panel.spec.ts` | UI panels |

## Running Tests

```bash
# All tests
npm run test

# Single file
npx playwright test tests/myFeature.spec.ts

# By pattern
npx playwright test -g "should place building"

# Interactive UI
npm run test:ui

# Headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Success Criteria

- [ ] Test file created in `tests/` directory
- [ ] Uses project patterns (test.describe, beforeEach)
- [ ] Tests both happy path and edge cases
- [ ] Uses test hooks for state verification
- [ ] All tests pass
- [ ] Tests are not flaky (run 3x to verify)

## Common Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).not.toBeVisible();
await expect(element).toBeHidden();

// Content
await expect(element).toHaveText('Expected');
await expect(element).toContainText('partial');

// State
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();
await expect(element).toBeChecked();

// Count
await expect(element).toHaveCount(5);

// Attribute
await expect(element).toHaveAttribute('data-state', 'open');
```

## Debugging Tips

1. Use `--headed` to see what's happening
2. Add `await page.pause()` to stop and inspect
3. Use `test.only()` to run single test
4. Check console errors with `page.on('console', msg => console.log(msg.text()))`
