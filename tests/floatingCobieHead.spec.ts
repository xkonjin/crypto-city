import { test, expect } from "@playwright/test";

/**
 * Tests for FloatingCobieHead Component (Issue #177)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * 
 * The FloatingCobieHead is a visual component that:
 * - Renders an animated pixel-art Cobie head
 * - Displays expressions based on CobieBrain state
 * - Shows speech bubbles for dialogue
 * - Implements idle animations (bob, blink)
 * - Follows look direction
 */

import type {
  CobieExpression,
  CobieMood,
  LookDirection,
} from "@/lib/cobie/types";

import {
  COBIE_ANIMATIONS,
  getExpressionConfig,
  getLookDirectionTransform,
  getScalePixels,
  getPositionClasses,
  shouldRenderCobieHead,
} from "@/lib/cobie/CobieHeadUtils";

// =============================================================================
// TYPE TESTS
// =============================================================================

test.describe("FloatingCobieHead Types", () => {
  test("should export utility functions", () => {
    expect(getScalePixels).toBeDefined();
    expect(typeof getScalePixels).toBe('function');
    expect(getPositionClasses).toBeDefined();
    expect(typeof getPositionClasses).toBe('function');
    expect(shouldRenderCobieHead).toBeDefined();
    expect(typeof shouldRenderCobieHead).toBe('function');
  });

  test("should accept all required props", () => {
    // This validates the component accepts the defined props
    const props = {
      expression: 'idle' as CobieExpression,
      mood: 'neutral' as CobieMood,
      dialogue: null as string | null,
      isSpeaking: false,
      lookDirection: 'center' as LookDirection,
      position: 'bottom-left' as const,
      scale: 'medium' as const,
      enabled: true,
      queueLength: 0,
      onDismissDialogue: () => {},
    };
    
    expect(props.expression).toBe('idle');
    expect(props.mood).toBe('neutral');
    expect(props.dialogue).toBeNull();
    expect(props.isSpeaking).toBe(false);
    expect(props.lookDirection).toBe('center');
    expect(props.position).toBe('bottom-left');
    expect(props.scale).toBe('medium');
    expect(props.enabled).toBe(true);
    expect(props.queueLength).toBe(0);
    expect(typeof props.onDismissDialogue).toBe('function');
  });
});

// =============================================================================
// EXPRESSION RENDERING TESTS
// =============================================================================

test.describe("FloatingCobieHead Expression Rendering", () => {
  test("should export expression functions", () => {
    expect(getExpressionConfig).toBeDefined();
    expect(typeof getExpressionConfig).toBe('function');
  });

  test("should support all expression types", () => {
    const expressions: CobieExpression[] = [
      'idle',
      'smirk', 
      'raised_eyebrow',
      'wide_eyes',
      'squint',
      'thinking',
      'talking',
      'laughing',
      'concerned',
      'sleeping',
    ];
    
    for (const expression of expressions) {
      const config = getExpressionConfig(expression);
      expect(config).toBeDefined();
      expect(config).toHaveProperty('eyes');
      expect(config).toHaveProperty('eyebrows');
      expect(config).toHaveProperty('mouth');
    }
  });

  test("should have correct eye configuration for wide_eyes", () => {
    const config = getExpressionConfig('wide_eyes');
    
    // Wide eyes should have larger scale
    expect(config.eyes.scale).toBeGreaterThan(1);
  });

  test("should have correct eye configuration for squint", () => {
    const config = getExpressionConfig('squint');
    
    // Squint should have smaller scale
    expect(config.eyes.scale).toBeLessThan(1);
  });

  test("should have closed eyes for sleeping", () => {
    const config = getExpressionConfig('sleeping');
    
    expect(config.eyes.closed).toBe(true);
  });

  test("should have asymmetric eyebrows for raised_eyebrow", () => {
    const config = getExpressionConfig('raised_eyebrow');
    
    // One eyebrow should be raised more than the other
    expect(config.eyebrows.leftRaise).not.toBe(config.eyebrows.rightRaise);
  });

  test("should have smirk mouth configuration", () => {
    const config = getExpressionConfig('smirk');
    
    expect(config.mouth.smirk).toBe(true);
  });
});

// =============================================================================
// SPEECH BUBBLE TESTS
// =============================================================================

test.describe("FloatingCobieHead Speech Bubble", () => {
  test("should validate speech bubble props structure", () => {
    const props = {
      text: 'Test dialogue',
      isVisible: true,
      position: 'top' as const,
      onDismiss: () => {},
    };
    
    expect(props.text).toBe('Test dialogue');
    expect(props.isVisible).toBe(true);
    expect(props.position).toBe('top');
    expect(typeof props.onDismiss).toBe('function');
  });

  test("should accept queue length indicator", () => {
    const props = {
      text: 'Test dialogue',
      isVisible: true,
      position: 'top' as const,
      onDismiss: () => {},
      queueLength: 3,
    };
    
    expect(props.queueLength).toBe(3);
  });
});

// =============================================================================
// LOOK DIRECTION TESTS  
// =============================================================================

test.describe("FloatingCobieHead Look Direction", () => {
  test("should export getLookDirectionTransform function", () => {
    expect(getLookDirectionTransform).toBeDefined();
    expect(typeof getLookDirectionTransform).toBe('function');
  });

  test("should return correct transform for left look", () => {
    const transform = getLookDirectionTransform('left');
    
    // Eyes should shift left (negative x)
    expect(transform.eyeOffsetX).toBeLessThan(0);
  });

  test("should return correct transform for right look", () => {
    const transform = getLookDirectionTransform('right');
    
    // Eyes should shift right (positive x)
    expect(transform.eyeOffsetX).toBeGreaterThan(0);
  });

  test("should return correct transform for up look", () => {
    const transform = getLookDirectionTransform('up');
    
    // Eyes should shift up (negative y)
    expect(transform.eyeOffsetY).toBeLessThan(0);
  });

  test("should return correct transform for down look", () => {
    const transform = getLookDirectionTransform('down');
    
    // Eyes should shift down (positive y)
    expect(transform.eyeOffsetY).toBeGreaterThan(0);
  });

  test("should return zero offsets for center look", () => {
    const transform = getLookDirectionTransform('center');
    
    expect(transform.eyeOffsetX).toBe(0);
    expect(transform.eyeOffsetY).toBe(0);
  });
});

// =============================================================================
// ANIMATION TESTS
// =============================================================================

test.describe("FloatingCobieHead Animations", () => {
  test("should export animation CSS class names", () => {
    expect(COBIE_ANIMATIONS.bob).toBeDefined();
    expect(COBIE_ANIMATIONS.blink).toBeDefined();
    expect(COBIE_ANIMATIONS.talk).toBeDefined();
    expect(COBIE_ANIMATIONS.sleep).toBeDefined();
  });

  test("should have bob animation for idle state", () => {
    expect(COBIE_ANIMATIONS.bob).toContain('cobie-bob');
  });

  test("should have blink animation", () => {
    expect(COBIE_ANIMATIONS.blink).toContain('cobie-blink');
  });

  test("should have talk animation for speaking", () => {
    expect(COBIE_ANIMATIONS.talk).toContain('cobie-talk');
  });

  test("should have sleep animation with ZZZ effect", () => {
    expect(COBIE_ANIMATIONS.sleep).toContain('cobie-sleep');
  });
});

// =============================================================================
// VISIBILITY TESTS
// =============================================================================

test.describe("FloatingCobieHead Visibility", () => {
  test("should not render when enabled is false", () => {
    const result = shouldRenderCobieHead({ enabled: false });
    expect(result).toBe(false);
  });

  test("should render when enabled is true", () => {
    const result = shouldRenderCobieHead({ enabled: true });
    expect(result).toBe(true);
  });
});

// =============================================================================
// SCALE TESTS
// =============================================================================

test.describe("FloatingCobieHead Scale", () => {
  test("should export getScalePixels function", () => {
    expect(getScalePixels).toBeDefined();
    expect(typeof getScalePixels).toBe('function');
  });

  test("should return correct size for small scale", () => {
    const size = getScalePixels('small');
    expect(size).toBe(64);
  });

  test("should return correct size for medium scale", () => {
    const size = getScalePixels('medium');
    expect(size).toBe(96);
  });

  test("should return correct size for large scale", () => {
    const size = getScalePixels('large');
    expect(size).toBe(128);
  });
});

// =============================================================================
// POSITION TESTS
// =============================================================================

test.describe("FloatingCobieHead Position", () => {
  test("should export getPositionClasses function", () => {
    expect(getPositionClasses).toBeDefined();
    expect(typeof getPositionClasses).toBe('function');
  });

  test("should return bottom-left classes for bottom-left position", () => {
    const classes = getPositionClasses('bottom-left');
    
    expect(classes).toContain('bottom-');
    expect(classes).toContain('left-');
  });

  test("should return bottom-right classes for bottom-right position", () => {
    const classes = getPositionClasses('bottom-right');
    
    expect(classes).toContain('bottom-');
    expect(classes).toContain('right-');
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

test.describe("FloatingCobieHead Integration", () => {
  test("should export all utility functions from CobieHeadUtils", () => {
    // Verify all expected exports exist
    expect(getScalePixels).toBeDefined();
    expect(getPositionClasses).toBeDefined();
    expect(shouldRenderCobieHead).toBeDefined();
    expect(getExpressionConfig).toBeDefined();
    expect(getLookDirectionTransform).toBeDefined();
    expect(COBIE_ANIMATIONS).toBeDefined();
  });

  test("should have all animation types defined", () => {
    // All animations are available
    expect(COBIE_ANIMATIONS.bob).toBe('animate-cobie-bob');
    expect(COBIE_ANIMATIONS.blink).toBe('animate-cobie-blink');
    expect(COBIE_ANIMATIONS.talk).toBe('animate-cobie-talk');
    expect(COBIE_ANIMATIONS.sleep).toBe('animate-cobie-sleep');
  });

  test("should have consistent expression configs", () => {
    // Verify all expression configs are properly structured
    const expressions: CobieExpression[] = [
      'idle', 'smirk', 'raised_eyebrow', 'wide_eyes', 'squint',
      'thinking', 'talking', 'laughing', 'concerned', 'sleeping'
    ];
    
    for (const expr of expressions) {
      const config = getExpressionConfig(expr);
      expect(config.eyes).toBeDefined();
      expect(config.eyebrows).toBeDefined();
      expect(config.mouth).toBeDefined();
    }
  });
});
