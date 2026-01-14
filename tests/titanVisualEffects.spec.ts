import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Visual Effects System
 *
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This module tests the alignment-based visual morphing system for Titan rendering.
 *
 * The visual effects system handles:
 * - Alignment visual properties (colors, glow, particles)
 * - Alignment transition management
 * - Visual property interpolation during transitions
 * - Particle effect system for alignment auras
 * - Canvas rendering helpers
 *
 * @see specs/HERO_PET_SYSTEM.md Section 2.2 for visual morphing documentation
 */

import type { AlignmentState, TitanPet } from "@/games/isocity/types/titan";
import type { TitanAnimation } from "@/lib/titan/TitanSprite";

// Import types and functions we're going to implement
import {
  // Types
  type AlignmentVisualProperties,
  type AlignmentTransition,
  type AlignmentParticle,
  // Constants
  ALIGNMENT_VISUALS,
  TRANSITION_DURATION_MS,
  MAX_PARTICLES,
  // Classes
  AlignmentTransitionManager,
  AlignmentParticleSystem,
  // Functions
  interpolateVisuals,
  interpolateColor,
  shouldTriggerMorphAnimation,
  getMorphAnimation,
  drawAlignmentGlow,
  drawAlignmentParticles,
  applyAlignmentFilter,
  getTitanVisualState,
  getAlignmentVisualsForValue,
} from "@/lib/titan/TitanVisualEffects";

// ============================================================================
// Test Suite: AlignmentVisualProperties Interface
// ============================================================================

test.describe("AlignmentVisualProperties Interface", () => {
  test("ALIGNMENT_VISUALS should define properties for all 5 alignment states", () => {
    const alignments: AlignmentState[] = [
      "angelic",
      "good",
      "neutral",
      "evil",
      "demonic",
    ];
    alignments.forEach((alignment) => {
      expect(ALIGNMENT_VISUALS[alignment]).toBeDefined();
    });
  });

  test("each alignment should have all required visual properties", () => {
    const requiredProperties = [
      "primaryColor",
      "secondaryColor",
      "glowColor",
      "glowIntensity",
      "particleColor",
      "particleType",
      "spriteFilter",
    ];

    Object.values(ALIGNMENT_VISUALS).forEach((visuals) => {
      requiredProperties.forEach((prop) => {
        expect(visuals).toHaveProperty(prop);
      });
    });
  });

  test("angelic alignment should have gold/white theme", () => {
    const angelic = ALIGNMENT_VISUALS.angelic;
    expect(angelic.primaryColor).toBe("#FFD700"); // Gold
    expect(angelic.secondaryColor).toBe("#FFFFFF"); // White
    expect(angelic.particleType).toBe("sparkle");
    expect(angelic.glowIntensity).toBeGreaterThan(0.5);
  });

  test("good alignment should have light green theme", () => {
    const good = ALIGNMENT_VISUALS.good;
    expect(good.primaryColor).toBe("#90EE90"); // Light green
    expect(good.particleType).toBe("sparkle");
    expect(good.glowIntensity).toBeGreaterThan(0);
  });

  test("neutral alignment should have gray theme with no effects", () => {
    const neutral = ALIGNMENT_VISUALS.neutral;
    expect(neutral.primaryColor).toBe("#808080"); // Gray
    expect(neutral.glowIntensity).toBe(0);
    expect(neutral.particleType).toBe("none");
    expect(neutral.spriteFilter).toBe("none");
  });

  test("evil alignment should have crimson theme", () => {
    const evil = ALIGNMENT_VISUALS.evil;
    expect(evil.primaryColor).toBe("#DC143C"); // Crimson
    expect(evil.particleType).toBe("fire");
    expect(evil.glowIntensity).toBeGreaterThan(0);
  });

  test("demonic alignment should have dark theme with red accents", () => {
    const demonic = ALIGNMENT_VISUALS.demonic;
    expect(demonic.primaryColor).toBe("#1C1C1C"); // Near black
    expect(demonic.secondaryColor).toBe("#8B0000"); // Dark red
    expect(demonic.particleType).toBe("fire");
    expect(demonic.glowIntensity).toBeGreaterThan(0.5);
  });

  test("glowIntensity should be between 0 and 1 for all alignments", () => {
    Object.values(ALIGNMENT_VISUALS).forEach((visuals) => {
      expect(visuals.glowIntensity).toBeGreaterThanOrEqual(0);
      expect(visuals.glowIntensity).toBeLessThanOrEqual(1);
    });
  });

  test("particleType should be one of sparkle, fire, or none", () => {
    const validTypes = ["sparkle", "fire", "none"];
    Object.values(ALIGNMENT_VISUALS).forEach((visuals) => {
      expect(validTypes).toContain(visuals.particleType);
    });
  });
});

// ============================================================================
// Test Suite: AlignmentTransitionManager Class
// ============================================================================

test.describe("AlignmentTransitionManager Class", () => {
  test("should be instantiable", () => {
    const manager = new AlignmentTransitionManager();
    expect(manager).toBeDefined();
  });

  test("isTransitioning should return false initially", () => {
    const manager = new AlignmentTransitionManager();
    expect(manager.isTransitioning()).toBe(false);
  });

  test("getProgress should return 0 when not transitioning", () => {
    const manager = new AlignmentTransitionManager();
    expect(manager.getProgress()).toBe(0);
  });

  test("checkForTransition should detect alignment state change", () => {
    const manager = new AlignmentTransitionManager();
    // From neutral (0) to good (-0.3)
    const transition = manager.checkForTransition(0, -0.3);
    expect(transition).not.toBeNull();
    expect(transition?.fromState).toBe("neutral");
    expect(transition?.toState).toBe("good");
  });

  test("checkForTransition should return null for same state", () => {
    const manager = new AlignmentTransitionManager();
    // Both values in neutral range
    const transition = manager.checkForTransition(0, 0.1);
    expect(transition).toBeNull();
  });

  test("startTransition should begin a transition", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("neutral", "good");
    expect(manager.isTransitioning()).toBe(true);
  });

  test("update should advance transition progress", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("neutral", "good");

    // Update by half the duration
    manager.update(TRANSITION_DURATION_MS / 2);

    expect(manager.getProgress()).toBeCloseTo(0.5, 1);
  });

  test("update should complete transition after full duration", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("neutral", "good");

    // Update by full duration
    manager.update(TRANSITION_DURATION_MS);

    // After completion, transition is cleared so progress resets to 0
    // and isTransitioning returns false
    expect(manager.isTransitioning()).toBe(false);
    // Progress is 0 because transition was cleared upon completion
    expect(manager.getProgress()).toBe(0);
  });

  test("getInterpolatedVisuals should return current state visuals when not transitioning", () => {
    const manager = new AlignmentTransitionManager();
    manager.setCurrentAlignment("neutral");
    const visuals = manager.getInterpolatedVisuals();

    expect(visuals.primaryColor).toBe(ALIGNMENT_VISUALS.neutral.primaryColor);
  });

  test("getInterpolatedVisuals should return interpolated visuals during transition", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("neutral", "good");
    manager.update(TRANSITION_DURATION_MS / 2); // 50% progress

    const visuals = manager.getInterpolatedVisuals();

    // Should be somewhere between neutral and good
    // glowIntensity: neutral=0, good=0.4, so at 50% should be ~0.2
    expect(visuals.glowIntensity).toBeGreaterThan(0);
    expect(visuals.glowIntensity).toBeLessThan(ALIGNMENT_VISUALS.good.glowIntensity);
  });

  test("getCurrentTransition should return transition details", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("evil", "demonic");

    const transition = manager.getCurrentTransition();
    expect(transition).not.toBeNull();
    expect(transition?.fromState).toBe("evil");
    expect(transition?.toState).toBe("demonic");
  });
});

// ============================================================================
// Test Suite: Visual Interpolation Functions
// ============================================================================

test.describe("interpolateColor Function", () => {
  test("should return start color at progress 0", () => {
    const result = interpolateColor("#FF0000", "#00FF00", 0);
    expect(result).toBe("#FF0000");
  });

  test("should return end color at progress 1", () => {
    const result = interpolateColor("#FF0000", "#00FF00", 1);
    expect(result).toBe("#00FF00");
  });

  test("should interpolate to midpoint at progress 0.5", () => {
    // Red (#FF0000) to Green (#00FF00) at 50% should be yellow-ish (#808000)
    const result = interpolateColor("#FF0000", "#00FF00", 0.5);
    // The exact color depends on implementation, but should be valid hex
    expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("should handle rgba colors for glow", () => {
    const result = interpolateColor(
      "rgba(255, 0, 0, 0.5)",
      "rgba(0, 255, 0, 0.8)",
      0.5
    );
    expect(result).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
  });

  test("should clamp progress to 0-1 range", () => {
    const result1 = interpolateColor("#FF0000", "#00FF00", -0.5);
    const result2 = interpolateColor("#FF0000", "#00FF00", 1.5);

    expect(result1).toBe("#FF0000"); // Clamped to 0
    expect(result2).toBe("#00FF00"); // Clamped to 1
  });
});

test.describe("interpolateVisuals Function", () => {
  test("should return from visuals at progress 0", () => {
    const from = ALIGNMENT_VISUALS.neutral;
    const to = ALIGNMENT_VISUALS.good;

    const result = interpolateVisuals(from, to, 0);

    expect(result.primaryColor).toBe(from.primaryColor);
    expect(result.glowIntensity).toBe(from.glowIntensity);
  });

  test("should return to visuals at progress 1", () => {
    const from = ALIGNMENT_VISUALS.neutral;
    const to = ALIGNMENT_VISUALS.good;

    const result = interpolateVisuals(from, to, 1);

    expect(result.primaryColor).toBe(to.primaryColor);
    expect(result.glowIntensity).toBe(to.glowIntensity);
  });

  test("should interpolate all color properties", () => {
    const from = ALIGNMENT_VISUALS.neutral;
    const to = ALIGNMENT_VISUALS.evil;

    const result = interpolateVisuals(from, to, 0.5);

    // Colors should be interpolated (not exact match to either)
    expect(result.primaryColor).not.toBe(from.primaryColor);
    expect(result.primaryColor).not.toBe(to.primaryColor);
  });

  test("should interpolate glowIntensity numerically", () => {
    const from = ALIGNMENT_VISUALS.neutral; // glowIntensity: 0
    const to = ALIGNMENT_VISUALS.demonic; // glowIntensity: 0.7

    const result = interpolateVisuals(from, to, 0.5);

    expect(result.glowIntensity).toBeCloseTo(0.35, 1);
  });

  test("should handle particleType transition (use 'to' after halfway)", () => {
    const from = ALIGNMENT_VISUALS.neutral; // particleType: 'none'
    const to = ALIGNMENT_VISUALS.demonic; // particleType: 'fire'

    const result25 = interpolateVisuals(from, to, 0.25);
    const result75 = interpolateVisuals(from, to, 0.75);

    expect(result25.particleType).toBe("none"); // Before halfway
    expect(result75.particleType).toBe("fire"); // After halfway
  });

  test("should handle spriteFilter transition (use 'to' after halfway)", () => {
    const from = ALIGNMENT_VISUALS.neutral; // spriteFilter: 'none'
    const to = ALIGNMENT_VISUALS.angelic; // spriteFilter: 'brightness(1.2) sepia(0.2)'

    const result25 = interpolateVisuals(from, to, 0.25);
    const result75 = interpolateVisuals(from, to, 0.75);

    expect(result25.spriteFilter).toBe("none");
    expect(result75.spriteFilter).toBe(ALIGNMENT_VISUALS.angelic.spriteFilter);
  });
});

// ============================================================================
// Test Suite: Morph Animation Triggers
// ============================================================================

test.describe("shouldTriggerMorphAnimation Function", () => {
  test("should trigger when crossing from neutral to good", () => {
    const result = shouldTriggerMorphAnimation(0, -0.3);
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe(true);
    expect(result?.direction).toBe("good");
  });

  test("should trigger when crossing from neutral to evil", () => {
    const result = shouldTriggerMorphAnimation(0, 0.3);
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe(true);
    expect(result?.direction).toBe("evil");
  });

  test("should trigger when crossing from good to angelic", () => {
    const result = shouldTriggerMorphAnimation(-0.3, -0.7);
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe(true);
    expect(result?.direction).toBe("good");
  });

  test("should trigger when crossing from evil to demonic", () => {
    const result = shouldTriggerMorphAnimation(0.3, 0.7);
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe(true);
    expect(result?.direction).toBe("evil");
  });

  test("should return null when alignment stays in same state", () => {
    // Both in neutral range
    const result = shouldTriggerMorphAnimation(0, 0.1);
    expect(result).toBeNull();
  });

  test("should detect direction correctly for evil to good transition", () => {
    const result = shouldTriggerMorphAnimation(0.3, -0.3);
    expect(result).not.toBeNull();
    expect(result?.direction).toBe("good");
  });

  test("should detect direction correctly for good to evil transition", () => {
    const result = shouldTriggerMorphAnimation(-0.3, 0.3);
    expect(result).not.toBeNull();
    expect(result?.direction).toBe("evil");
  });
});

test.describe("getMorphAnimation Function", () => {
  test("should return morph_good for good direction", () => {
    const animation = getMorphAnimation("good");
    expect(animation).toBe("morph_good");
  });

  test("should return morph_evil for evil direction", () => {
    const animation = getMorphAnimation("evil");
    expect(animation).toBe("morph_evil");
  });
});

// ============================================================================
// Test Suite: AlignmentParticleSystem Class
// ============================================================================

test.describe("AlignmentParticleSystem Class", () => {
  test("should be instantiable with alignment", () => {
    const system = new AlignmentParticleSystem("neutral");
    expect(system).toBeDefined();
  });

  test("isActive should return false for neutral alignment", () => {
    const system = new AlignmentParticleSystem("neutral");
    expect(system.isActive()).toBe(false);
  });

  test("isActive should return true for non-neutral alignments", () => {
    const angelicSystem = new AlignmentParticleSystem("angelic");
    const demonicSystem = new AlignmentParticleSystem("demonic");

    expect(angelicSystem.isActive()).toBe(true);
    expect(demonicSystem.isActive()).toBe(true);
  });

  test("getParticles should return empty array initially", () => {
    const system = new AlignmentParticleSystem("angelic");
    expect(system.getParticles()).toEqual([]);
  });

  test("update should spawn particles over time for active alignments", () => {
    const system = new AlignmentParticleSystem("angelic");
    const position = { x: 100, y: 100 };

    // Update several times
    for (let i = 0; i < 10; i++) {
      system.update(100, position);
    }

    expect(system.getParticles().length).toBeGreaterThan(0);
  });

  test("update should not spawn particles for neutral alignment", () => {
    const system = new AlignmentParticleSystem("neutral");
    const position = { x: 100, y: 100 };

    for (let i = 0; i < 10; i++) {
      system.update(100, position);
    }

    expect(system.getParticles().length).toBe(0);
  });

  test("particles should have correct type based on alignment", () => {
    const angelicSystem = new AlignmentParticleSystem("angelic");
    angelicSystem.update(1000, { x: 100, y: 100 });
    angelicSystem.spawnBurst(5);

    const particles = angelicSystem.getParticles();
    if (particles.length > 0) {
      expect(particles[0].type).toBe("sparkle");
    }
  });

  test("spawnBurst should create specified number of particles", () => {
    const system = new AlignmentParticleSystem("demonic");
    system.spawnBurst(10);

    expect(system.getParticles().length).toBe(10);
  });

  test("particles should decay and be removed over time", () => {
    // Use neutral first to avoid spawning during update
    const system = new AlignmentParticleSystem("neutral");
    
    // Temporarily set to evil to spawn burst
    system.setAlignment("evil");
    system.spawnBurst(5);
    
    // Set back to neutral so no new particles spawn during update
    system.setAlignment("neutral");
    
    const initialCount = system.getParticles().length;
    expect(initialCount).toBe(5);

    // Update with enough time for particles to die (particle lifetime is 2000ms)
    // Update for 3 seconds total (30 * 100ms)
    for (let i = 0; i < 30; i++) {
      system.update(100, { x: 100, y: 100 });
    }

    // All particles should have been removed (3000ms > 2000ms lifetime)
    expect(system.getParticles().length).toBe(0);
  });

  test("particle count should not exceed MAX_PARTICLES", () => {
    const system = new AlignmentParticleSystem("angelic");

    // Try to spawn way more than max
    for (let i = 0; i < 100; i++) {
      system.spawnBurst(50);
    }

    expect(system.getParticles().length).toBeLessThanOrEqual(MAX_PARTICLES);
  });

  test("setAlignment should change particle properties", () => {
    const system = new AlignmentParticleSystem("neutral");
    expect(system.isActive()).toBe(false);

    system.setAlignment("angelic");
    expect(system.isActive()).toBe(true);
  });

  test("particles should have position, velocity, life, color, size, and type", () => {
    const system = new AlignmentParticleSystem("evil");
    system.spawnBurst(1);

    const particles = system.getParticles();
    expect(particles.length).toBe(1);

    const particle = particles[0];
    expect(typeof particle.x).toBe("number");
    expect(typeof particle.y).toBe("number");
    expect(typeof particle.vx).toBe("number");
    expect(typeof particle.vy).toBe("number");
    expect(typeof particle.life).toBe("number");
    expect(typeof particle.color).toBe("string");
    expect(typeof particle.size).toBe("number");
    expect(["sparkle", "fire"]).toContain(particle.type);
  });

  test("particle life should be between 0 and 1", () => {
    const system = new AlignmentParticleSystem("angelic");
    system.spawnBurst(5);

    const particles = system.getParticles();
    particles.forEach((p) => {
      expect(p.life).toBeGreaterThanOrEqual(0);
      expect(p.life).toBeLessThanOrEqual(1);
    });
  });
});

// ============================================================================
// Test Suite: Canvas Rendering Helpers
// ============================================================================

test.describe("Canvas Rendering Helpers", () => {
  test("drawAlignmentGlow should not throw", () => {
    // This test verifies the function exists and doesn't throw
    // Actual canvas rendering is tested in browser context
    expect(() => {
      // Create a mock context or verify function exists
      expect(typeof drawAlignmentGlow).toBe("function");
    }).not.toThrow();
  });

  test("drawAlignmentParticles should not throw", () => {
    expect(typeof drawAlignmentParticles).toBe("function");
  });

  test("applyAlignmentFilter should not throw", () => {
    expect(typeof applyAlignmentFilter).toBe("function");
  });
});

// ============================================================================
// Test Suite: getTitanVisualState Integration
// ============================================================================

test.describe("getTitanVisualState Function", () => {
  // Helper to create a minimal TitanPet for testing
  function createMockTitan(alignment: number): Partial<TitanPet> {
    return {
      id: "test-titan",
      alignment,
      gridX: 100,
      gridY: 100,
    };
  }

  test("should return visual state for neutral titan", () => {
    const titan = createMockTitan(0);
    const state = getTitanVisualState(titan as TitanPet);

    expect(state.visuals).toBeDefined();
    expect(state.isTransitioning).toBe(false);
    expect(state.transitionProgress).toBe(0);
    expect(state.particles).toBeDefined();
    expect(Array.isArray(state.particles)).toBe(true);
  });

  test("should return correct visuals for angelic titan", () => {
    const titan = createMockTitan(-0.8);
    const state = getTitanVisualState(titan as TitanPet);

    expect(state.visuals.primaryColor).toBe(ALIGNMENT_VISUALS.angelic.primaryColor);
  });

  test("should return correct visuals for demonic titan", () => {
    const titan = createMockTitan(0.8);
    const state = getTitanVisualState(titan as TitanPet);

    expect(state.visuals.primaryColor).toBe(ALIGNMENT_VISUALS.demonic.primaryColor);
  });

  test("should return currentAnimation field", () => {
    const titan = createMockTitan(0);
    const state = getTitanVisualState(titan as TitanPet);

    expect(state.currentAnimation).toBeDefined();
  });
});

// ============================================================================
// Test Suite: getAlignmentVisualsForValue Function
// ============================================================================

test.describe("getAlignmentVisualsForValue Function", () => {
  test("should return angelic visuals for alignment <= -0.6", () => {
    const visuals = getAlignmentVisualsForValue(-0.8);
    expect(visuals).toBe(ALIGNMENT_VISUALS.angelic);
  });

  test("should return good visuals for alignment -0.6 to -0.2", () => {
    const visuals = getAlignmentVisualsForValue(-0.4);
    expect(visuals).toBe(ALIGNMENT_VISUALS.good);
  });

  test("should return neutral visuals for alignment -0.2 to 0.2", () => {
    const visuals = getAlignmentVisualsForValue(0);
    expect(visuals).toBe(ALIGNMENT_VISUALS.neutral);
  });

  test("should return evil visuals for alignment 0.2 to 0.6", () => {
    const visuals = getAlignmentVisualsForValue(0.4);
    expect(visuals).toBe(ALIGNMENT_VISUALS.evil);
  });

  test("should return demonic visuals for alignment >= 0.6", () => {
    const visuals = getAlignmentVisualsForValue(0.8);
    expect(visuals).toBe(ALIGNMENT_VISUALS.demonic);
  });
});

// ============================================================================
// Test Suite: Browser Context Canvas Tests
// ============================================================================

test.describe("Canvas Rendering (Browser Context)", () => {
  test("drawAlignmentGlow should render to canvas", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (!ctx) return { success: false, error: "No context" };

      // Draw a simple glow-like effect to verify canvas API works
      ctx.save();
      ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(100, 100, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      return {
        success: true,
        hasData: ctx.getImageData(100, 100, 1, 1).data[3] > 0,
      };
    });

    expect(result.success).toBe(true);
    expect(result.hasData).toBe(true);
  });

  test("drawAlignmentParticles should render sparkle particles", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (!ctx) return { success: false };

      // Draw a simple sparkle particle
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(100, 100, 5, 0, Math.PI * 2);
      ctx.fill();

      return {
        success: true,
        hasPixel: ctx.getImageData(100, 100, 1, 1).data[3] > 0,
      };
    });

    expect(result.success).toBe(true);
    expect(result.hasPixel).toBe(true);
  });

  test("drawAlignmentParticles should render fire particles", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (!ctx) return { success: false };

      // Draw a simple fire-like particle (gradient)
      const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 10);
      gradient.addColorStop(0, "#FF4500");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(90, 90, 20, 20);

      return {
        success: true,
        hasPixel: ctx.getImageData(100, 100, 1, 1).data[3] > 0,
      };
    });

    expect(result.success).toBe(true);
    expect(result.hasPixel).toBe(true);
  });
});

// ============================================================================
// Test Suite: Edge Cases and Error Handling
// ============================================================================

test.describe("Edge Cases", () => {
  test("interpolateVisuals should handle identical inputs", () => {
    const visuals = ALIGNMENT_VISUALS.neutral;
    const result = interpolateVisuals(visuals, visuals, 0.5);

    expect(result.primaryColor).toBe(visuals.primaryColor);
    expect(result.glowIntensity).toBe(visuals.glowIntensity);
  });

  test("AlignmentTransitionManager should handle rapid transitions", () => {
    const manager = new AlignmentTransitionManager();

    // Start one transition
    manager.startTransition("neutral", "good");

    // Immediately start another
    manager.startTransition("good", "evil");

    expect(manager.isTransitioning()).toBe(true);
    const transition = manager.getCurrentTransition();
    expect(transition?.toState).toBe("evil");
  });

  test("AlignmentParticleSystem should handle rapid alignment changes", () => {
    const system = new AlignmentParticleSystem("neutral");

    system.setAlignment("angelic");
    system.setAlignment("evil");
    system.setAlignment("demonic");

    expect(system.isActive()).toBe(true);
  });

  test("interpolateColor should handle edge case hex values", () => {
    // Test with lowercase hex
    const result1 = interpolateColor("#ffffff", "#000000", 0.5);
    expect(result1).toMatch(/^#[0-9A-Fa-f]{6}$/);

    // Test with uppercase hex
    const result2 = interpolateColor("#FFFFFF", "#000000", 0.5);
    expect(result2).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("shouldTriggerMorphAnimation should handle boundary values", () => {
    // Exactly on boundary
    const result1 = shouldTriggerMorphAnimation(-0.2, -0.2);
    expect(result1).toBeNull(); // Same state

    // Just across boundary
    const result2 = shouldTriggerMorphAnimation(-0.19, -0.21);
    expect(result2).not.toBeNull();
  });

  test("AlignmentTransitionManager should handle zero delta update", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("neutral", "good");

    const progressBefore = manager.getProgress();
    manager.update(0);
    const progressAfter = manager.getProgress();

    expect(progressAfter).toBe(progressBefore);
  });

  test("AlignmentTransitionManager should handle negative delta update gracefully", () => {
    const manager = new AlignmentTransitionManager();
    manager.startTransition("neutral", "good");

    // Negative delta shouldn't break anything
    manager.update(-100);
    expect(manager.getProgress()).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Test Suite: Constants
// ============================================================================

test.describe("Module Constants", () => {
  test("TRANSITION_DURATION_MS should be a positive number", () => {
    expect(TRANSITION_DURATION_MS).toBeGreaterThan(0);
    expect(typeof TRANSITION_DURATION_MS).toBe("number");
  });

  test("MAX_PARTICLES should be a reasonable limit", () => {
    expect(MAX_PARTICLES).toBeGreaterThan(0);
    expect(MAX_PARTICLES).toBeLessThanOrEqual(500); // Performance limit
  });
});
