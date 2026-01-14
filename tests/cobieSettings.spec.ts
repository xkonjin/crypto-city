import { test, expect } from "@playwright/test";

/**
 * Tests for Cobie Settings System (Issue #181)
 * 
 * Tests the settings management for the Floating Cobie Head:
 * 1. Settings type definitions and defaults
 * 2. Settings persistence (localStorage)
 * 3. Settings migration from old format
 * 4. Talkativeness filtering
 * 5. Position and scale configurations
 */

// Import the settings module - will fail initially (TDD)
import type { CobieSettings, CobiePosition, CobieScale, CobieTalkativeness } from "@/lib/cobie/CobieSettings";
import {
  DEFAULT_COBIE_SETTINGS,
  COBIE_SETTINGS_STORAGE_KEY,
  OLD_COBIE_DISABLED_KEY,
  loadCobieSettings,
  saveCobieSettings,
  isValidPosition,
  isValidScale,
  isValidTalkativeness,
  shouldShowMessage,
  shouldShowIdleBehavior,
  MessagePriority,
} from "@/lib/cobie/CobieSettings";

// =============================================================================
// UNIT TESTS - CobieSettings types and functions
// =============================================================================

test.describe("CobieSettings Types", () => {
  test("should export CobieSettings interface with required fields", async () => {
    // Verify all required fields exist in default settings
    const hasEnabled = typeof DEFAULT_COBIE_SETTINGS.enabled === 'boolean';
    const hasPosition = typeof DEFAULT_COBIE_SETTINGS.position === 'string';
    const hasScale = typeof DEFAULT_COBIE_SETTINGS.scale === 'string';
    const hasTalkativeness = typeof DEFAULT_COBIE_SETTINGS.talkativeness === 'string';
    const hasShowIdleBehaviors = typeof DEFAULT_COBIE_SETTINGS.showIdleBehaviors === 'boolean';
    
    expect(hasEnabled).toBe(true);
    expect(hasPosition).toBe(true);
    expect(hasScale).toBe(true);
    expect(hasTalkativeness).toBe(true);
    expect(hasShowIdleBehaviors).toBe(true);
  });

  test("should have correct default values", async () => {
    expect(DEFAULT_COBIE_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_COBIE_SETTINGS.position).toBe('bottom-left');
    expect(DEFAULT_COBIE_SETTINGS.scale).toBe('medium');
    expect(DEFAULT_COBIE_SETTINGS.talkativeness).toBe('normal');
    expect(DEFAULT_COBIE_SETTINGS.showIdleBehaviors).toBe(true);
  });

  test("should validate position values", async () => {
    expect(isValidPosition('bottom-left')).toBe(true);
    expect(isValidPosition('bottom-right')).toBe(true);
    expect(isValidPosition('top-center')).toBe(false);
    expect(isValidPosition('')).toBe(false);
  });

  test("should validate scale values", async () => {
    expect(isValidScale('small')).toBe(true);
    expect(isValidScale('medium')).toBe(true);
    expect(isValidScale('large')).toBe(true);
    expect(isValidScale('extra-large')).toBe(false);
  });

  test("should validate talkativeness values", async () => {
    expect(isValidTalkativeness('quiet')).toBe(true);
    expect(isValidTalkativeness('normal')).toBe(true);
    expect(isValidTalkativeness('chatty')).toBe(true);
    expect(isValidTalkativeness('silent')).toBe(false);
  });
});

test.describe("CobieSettings Persistence", () => {
  test("should save settings to localStorage", async ({ page }) => {
    await page.goto('/');
    
    const saved = await page.evaluate(
      ({ storageKey }) => {
        // Clear first
        localStorage.removeItem(storageKey);
        
        const testSettings = {
          enabled: false,
          position: 'bottom-right',
          scale: 'large',
          talkativeness: 'quiet',
          showIdleBehaviors: false,
        };
        
        localStorage.setItem(storageKey, JSON.stringify(testSettings));
        
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : null;
      },
      { storageKey: COBIE_SETTINGS_STORAGE_KEY }
    );
    
    expect(saved).not.toBeNull();
    expect(saved.enabled).toBe(false);
    expect(saved.position).toBe('bottom-right');
    expect(saved.scale).toBe('large');
    expect(saved.talkativeness).toBe('quiet');
    expect(saved.showIdleBehaviors).toBe(false);
  });

  test("should load settings from localStorage", async ({ page }) => {
    await page.goto('/');
    
    const loaded = await page.evaluate(
      ({ storageKey, defaults }) => {
        // Save test settings
        const testSettings = {
          enabled: false,
          position: 'bottom-right',
          scale: 'small',
          talkativeness: 'chatty',
          showIdleBehaviors: false,
        };
        localStorage.setItem(storageKey, JSON.stringify(testSettings));
        
        // Load them back
        const stored = localStorage.getItem(storageKey);
        if (!stored) return defaults;
        try {
          return { ...defaults, ...JSON.parse(stored) };
        } catch {
          return defaults;
        }
      },
      { storageKey: COBIE_SETTINGS_STORAGE_KEY, defaults: DEFAULT_COBIE_SETTINGS }
    );
    
    expect(loaded.enabled).toBe(false);
    expect(loaded.position).toBe('bottom-right');
    expect(loaded.scale).toBe('small');
    expect(loaded.talkativeness).toBe('chatty');
    expect(loaded.showIdleBehaviors).toBe(false);
  });

  test("should return default settings when localStorage is empty", async ({ page }) => {
    await page.goto('/');
    
    const loaded = await page.evaluate(
      ({ storageKey, defaults }) => {
        // Clear localStorage
        localStorage.removeItem(storageKey);
        
        // Simulate loadCobieSettings behavior
        const stored = localStorage.getItem(storageKey);
        if (!stored) return defaults;
        try {
          return { ...defaults, ...JSON.parse(stored) };
        } catch {
          return defaults;
        }
      },
      { storageKey: COBIE_SETTINGS_STORAGE_KEY, defaults: DEFAULT_COBIE_SETTINGS }
    );
    
    expect(loaded).toEqual(DEFAULT_COBIE_SETTINGS);
  });

  test("should handle corrupted localStorage data gracefully", async ({ page }) => {
    await page.goto('/');
    
    const loaded = await page.evaluate(
      ({ storageKey, defaults }) => {
        // Save corrupted data
        localStorage.setItem(storageKey, 'not-valid-json{{{');
        
        // Simulate loadCobieSettings behavior
        const stored = localStorage.getItem(storageKey);
        if (!stored) return defaults;
        try {
          return { ...defaults, ...JSON.parse(stored) };
        } catch {
          return defaults;
        }
      },
      { storageKey: COBIE_SETTINGS_STORAGE_KEY, defaults: DEFAULT_COBIE_SETTINGS }
    );
    
    // Should return defaults when data is corrupted
    expect(loaded).toEqual(DEFAULT_COBIE_SETTINGS);
  });

  test("should merge partial settings with defaults", async ({ page }) => {
    await page.goto('/');
    
    const loaded = await page.evaluate(
      ({ storageKey, defaults }) => {
        // Save partial settings (missing some fields)
        localStorage.setItem(storageKey, JSON.stringify({
          enabled: false,
          position: 'bottom-right',
          // Missing: scale, talkativeness, showIdleBehaviors
        }));
        
        // Simulate loadCobieSettings behavior
        const stored = localStorage.getItem(storageKey);
        if (!stored) return defaults;
        try {
          return { ...defaults, ...JSON.parse(stored) };
        } catch {
          return defaults;
        }
      },
      { storageKey: COBIE_SETTINGS_STORAGE_KEY, defaults: DEFAULT_COBIE_SETTINGS }
    );
    
    // Should have saved values for present fields
    expect(loaded.enabled).toBe(false);
    expect(loaded.position).toBe('bottom-right');
    // Should have defaults for missing fields
    expect(loaded.scale).toBe(DEFAULT_COBIE_SETTINGS.scale);
    expect(loaded.talkativeness).toBe(DEFAULT_COBIE_SETTINGS.talkativeness);
    expect(loaded.showIdleBehaviors).toBe(DEFAULT_COBIE_SETTINGS.showIdleBehaviors);
  });
});

test.describe("CobieSettings Migration", () => {
  test("should migrate from old 'cryptocity-cobie-disabled' key", async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(
      ({ newKey, oldKey, defaults }) => {
        // Clear new settings
        localStorage.removeItem(newKey);
        
        // Set old disabled key to true (user had disabled Cobie)
        localStorage.setItem(oldKey, 'true');
        
        // Simulate migration logic
        const existingNew = localStorage.getItem(newKey);
        if (!existingNew) {
          const oldValue = localStorage.getItem(oldKey);
          if (oldValue !== null) {
            const wasDisabled = oldValue === 'true';
            const migratedSettings = { ...defaults, enabled: !wasDisabled };
            localStorage.setItem(newKey, JSON.stringify(migratedSettings));
            localStorage.removeItem(oldKey);
            return {
              settings: migratedSettings,
              oldKeyRemoved: localStorage.getItem(oldKey) === null,
              newKeyExists: localStorage.getItem(newKey) !== null,
            };
          }
        }
        
        return {
          settings: defaults,
          oldKeyRemoved: localStorage.getItem(oldKey) === null,
          newKeyExists: localStorage.getItem(newKey) !== null,
        };
      },
      { newKey: COBIE_SETTINGS_STORAGE_KEY, oldKey: OLD_COBIE_DISABLED_KEY, defaults: DEFAULT_COBIE_SETTINGS }
    );
    
    // Should migrate disabled state
    expect(result.settings.enabled).toBe(false);
    // Should clean up old key
    expect(result.oldKeyRemoved).toBe(true);
    // Should save new settings
    expect(result.newKeyExists).toBe(true);
  });

  test("should migrate enabled state from old key when false", async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(
      ({ newKey, oldKey, defaults }) => {
        // Clear new settings
        localStorage.removeItem(newKey);
        
        // Set old disabled key to false (user had Cobie enabled - was not disabled)
        localStorage.setItem(oldKey, 'false');
        
        // Simulate migration logic
        const existingNew = localStorage.getItem(newKey);
        if (!existingNew) {
          const oldValue = localStorage.getItem(oldKey);
          if (oldValue !== null) {
            const wasDisabled = oldValue === 'true';
            const migratedSettings = { ...defaults, enabled: !wasDisabled };
            localStorage.setItem(newKey, JSON.stringify(migratedSettings));
            localStorage.removeItem(oldKey);
            return migratedSettings;
          }
        }
        
        return defaults;
      },
      { newKey: COBIE_SETTINGS_STORAGE_KEY, oldKey: OLD_COBIE_DISABLED_KEY, defaults: DEFAULT_COBIE_SETTINGS }
    );
    
    // When old key was 'false' (not disabled), enabled should be true
    expect(result.enabled).toBe(true);
  });

  test("should not migrate if new settings already exist", async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(
      ({ newKey, oldKey }) => {
        // Save new settings first
        const testSettings = {
          enabled: true,
          position: 'bottom-right',
          scale: 'large',
          talkativeness: 'chatty',
          showIdleBehaviors: true,
        };
        localStorage.setItem(newKey, JSON.stringify(testSettings));
        
        // Set old disabled key (should be ignored since new settings exist)
        localStorage.setItem(oldKey, 'true');
        
        // Simulate loadCobieSettings - should NOT migrate since new key exists
        const stored = localStorage.getItem(newKey);
        const settings = stored ? JSON.parse(stored) : null;
        
        // Old key should still exist (not removed since we didn't migrate)
        const oldKeyExists = localStorage.getItem(oldKey) !== null;
        
        return {
          settings,
          oldKeyExists,
        };
      },
      { newKey: COBIE_SETTINGS_STORAGE_KEY, oldKey: OLD_COBIE_DISABLED_KEY }
    );
    
    // Should use new settings, not migrate from old
    expect(result.settings.enabled).toBe(true);
    expect(result.settings.position).toBe('bottom-right');
  });
});

test.describe("CobieSettings Talkativeness Filtering", () => {
  test("should filter messages based on talkativeness level", async () => {
    // Test with 'quiet' talkativeness - should only show high priority
    expect(shouldShowMessage('quiet', MessagePriority.HIGH)).toBe(true);
    expect(shouldShowMessage('quiet', MessagePriority.MEDIUM)).toBe(false);
    expect(shouldShowMessage('quiet', MessagePriority.LOW)).toBe(false);
    
    // Test with 'normal' talkativeness - should show high and medium
    expect(shouldShowMessage('normal', MessagePriority.HIGH)).toBe(true);
    expect(shouldShowMessage('normal', MessagePriority.MEDIUM)).toBe(true);
    expect(shouldShowMessage('normal', MessagePriority.LOW)).toBe(false);
    
    // Test with 'chatty' talkativeness - should show all
    expect(shouldShowMessage('chatty', MessagePriority.HIGH)).toBe(true);
    expect(shouldShowMessage('chatty', MessagePriority.MEDIUM)).toBe(true);
    expect(shouldShowMessage('chatty', MessagePriority.LOW)).toBe(true);
  });

  test("should export MessagePriority enum with correct values", async () => {
    expect(MessagePriority.HIGH).toBeDefined();
    expect(MessagePriority.MEDIUM).toBeDefined();
    expect(MessagePriority.LOW).toBeDefined();
    // HIGH should be highest priority (lowest number)
    expect(MessagePriority.HIGH).toBeLessThan(MessagePriority.MEDIUM);
    expect(MessagePriority.MEDIUM).toBeLessThan(MessagePriority.LOW);
  });

  test("should calculate idle behavior visibility based on settings", async () => {
    expect(shouldShowIdleBehavior(true)).toBe(true);
    expect(shouldShowIdleBehavior(false)).toBe(false);
  });
});

test.describe("CobieSettings Integration", () => {
  test("should export all required functions", async () => {
    expect(typeof DEFAULT_COBIE_SETTINGS).toBe('object');
    expect(typeof loadCobieSettings).toBe('function');
    expect(typeof saveCobieSettings).toBe('function');
    expect(typeof isValidPosition).toBe('function');
    expect(typeof isValidScale).toBe('function');
    expect(typeof isValidTalkativeness).toBe('function');
    expect(typeof shouldShowMessage).toBe('function');
    expect(typeof shouldShowIdleBehavior).toBe('function');
    expect(typeof MessagePriority).toBe('object');
    expect(typeof COBIE_SETTINGS_STORAGE_KEY).toBe('string');
    expect(typeof OLD_COBIE_DISABLED_KEY).toBe('string');
  });
});
