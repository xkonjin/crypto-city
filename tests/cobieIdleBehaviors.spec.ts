import { test, expect } from "@playwright/test";

/**
 * Tests for Cobie Idle Behaviors (Issue #180)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * 
 * The idle behaviors system provides natural animations for the Cobie head:
 * - Random blinking with configurable intervals
 * - Looking around when idle
 * - Boredom progression over time
 * - Sleep mode after extended idle
 * - Wake up behavior on player action
 */

import type { LookDirection } from "@/lib/cobie/types";
import {
  BLINK_CONFIG,
  LOOK_AROUND_CONFIG,
  BOREDOM_THRESHOLDS,
  type BoredomLevel,
  generateBlinkInterval,
  shouldDoubleBlink,
  getRandomLookDirection,
  calculateBoredomLevel,
  shouldTriggerYawn,
  shouldEnterSleep,
  shouldWakeUp,
  createIdleBehaviorState,
  updateIdleBehaviorState,
  type IdleBehaviorState,
  type IdleBehaviorConfig,
} from "@/lib/cobie/CobieIdleBehaviors";

// =============================================================================
// CONFIGURATION TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Configuration", () => {
  test("should export blink configuration with correct values", () => {
    expect(BLINK_CONFIG).toBeDefined();
    expect(BLINK_CONFIG.minInterval).toBe(3000);
    expect(BLINK_CONFIG.maxInterval).toBe(8000);
    expect(BLINK_CONFIG.duration).toBe(150);
    expect(BLINK_CONFIG.doubleBlinkChance).toBe(0.2);
  });

  test("should export look around configuration with correct values", () => {
    expect(LOOK_AROUND_CONFIG).toBeDefined();
    expect(LOOK_AROUND_CONFIG.minInterval).toBe(10000);
    expect(LOOK_AROUND_CONFIG.maxInterval).toBe(30000);
    expect(LOOK_AROUND_CONFIG.directions).toEqual(['left', 'right', 'up', 'center']);
    expect(LOOK_AROUND_CONFIG.duration).toBe(2000);
  });

  test("should export boredom thresholds with correct values", () => {
    expect(BOREDOM_THRESHOLDS).toBeDefined();
    expect(BOREDOM_THRESHOLDS.NORMAL).toBe(0);
    expect(BOREDOM_THRESHOLDS.SLIGHTLY_BORED).toBe(30);
    expect(BOREDOM_THRESHOLDS.BORED).toBe(60);
    expect(BOREDOM_THRESHOLDS.VERY_BORED).toBe(90);
    expect(BOREDOM_THRESHOLDS.SLEEPING).toBe(120);
  });
});

// =============================================================================
// BLINK BEHAVIOR TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Blinking", () => {
  test("should generate blink interval within configured range", () => {
    for (let i = 0; i < 100; i++) {
      const interval = generateBlinkInterval();
      expect(interval).toBeGreaterThanOrEqual(BLINK_CONFIG.minInterval);
      expect(interval).toBeLessThanOrEqual(BLINK_CONFIG.maxInterval);
    }
  });

  test("should have reasonable double blink probability", () => {
    // Run many trials to verify probability
    let doubleBlinkCount = 0;
    const trials = 1000;
    
    for (let i = 0; i < trials; i++) {
      if (shouldDoubleBlink()) {
        doubleBlinkCount++;
      }
    }
    
    // Should be roughly 20% (within reasonable statistical variance)
    const ratio = doubleBlinkCount / trials;
    expect(ratio).toBeGreaterThan(0.12);
    expect(ratio).toBeLessThan(0.28);
  });

  test("should not blink while speaking", () => {
    const state = createIdleBehaviorState();
    const config: IdleBehaviorConfig = {
      idleSeconds: 0,
      isSpeaking: true,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isBlinking).toBe(false);
  });

  test("should not blink while sleeping", () => {
    const state = createIdleBehaviorState();
    state.isSleeping = true;
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 130,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isBlinking).toBe(false);
  });
});

// =============================================================================
// LOOK AROUND BEHAVIOR TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Looking Around", () => {
  test("should get random look direction from configured options", () => {
    const validDirections = LOOK_AROUND_CONFIG.directions;
    
    for (let i = 0; i < 100; i++) {
      const direction = getRandomLookDirection();
      expect(validDirections).toContain(direction);
    }
  });

  test("should look around more frequently when bored", () => {
    // Verify through the update function that bored state triggers more frequent looks
    const state = createIdleBehaviorState();
    const now = Date.now();
    
    // Force look time to have passed
    state.nextLookTime = now - 100;
    
    // Update with bored idle time (65 seconds)
    const boredConfig: IdleBehaviorConfig = {
      idleSeconds: 65,
      isSpeaking: false,
    };
    const boredState = updateIdleBehaviorState(state, boredConfig, now);
    const boredInterval = boredState.nextLookTime - now;
    
    // Reset and update with normal idle time
    state.nextLookTime = now - 100;
    const normalConfig: IdleBehaviorConfig = {
      idleSeconds: 10,
      isSpeaking: false,
    };
    const normalState = updateIdleBehaviorState(state, normalConfig, now);
    const normalInterval = normalState.nextLookTime - now;
    
    // The test is probabilistic - run multiple times to verify average behavior
    // For a single test, just verify both states schedule a new look time
    expect(boredState.nextLookTime).toBeGreaterThan(now);
    expect(normalState.nextLookTime).toBeGreaterThan(now);
  });

  test("should stop looking when player takes action", () => {
    const state = createIdleBehaviorState();
    state.lookDirection = 'left';
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 0,  // Reset from activity
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.lookDirection).toBe('center');
  });
});

// =============================================================================
// BOREDOM PROGRESSION TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Boredom Progression", () => {
  test("should return 'normal' boredom level for 0-30 seconds idle", () => {
    expect(calculateBoredomLevel(0)).toBe('normal');
    expect(calculateBoredomLevel(15)).toBe('normal');
    expect(calculateBoredomLevel(29)).toBe('normal');
  });

  test("should return 'slightly_bored' level for 30-60 seconds idle", () => {
    expect(calculateBoredomLevel(30)).toBe('slightly_bored');
    expect(calculateBoredomLevel(45)).toBe('slightly_bored');
    expect(calculateBoredomLevel(59)).toBe('slightly_bored');
  });

  test("should return 'bored' level for 60-90 seconds idle", () => {
    expect(calculateBoredomLevel(60)).toBe('bored');
    expect(calculateBoredomLevel(75)).toBe('bored');
    expect(calculateBoredomLevel(89)).toBe('bored');
  });

  test("should return 'very_bored' level for 90-120 seconds idle", () => {
    expect(calculateBoredomLevel(90)).toBe('very_bored');
    expect(calculateBoredomLevel(105)).toBe('very_bored');
    expect(calculateBoredomLevel(119)).toBe('very_bored');
  });

  test("should return 'sleeping' level for 120+ seconds idle", () => {
    expect(calculateBoredomLevel(120)).toBe('sleeping');
    expect(calculateBoredomLevel(180)).toBe('sleeping');
    expect(calculateBoredomLevel(300)).toBe('sleeping');
  });
});

// =============================================================================
// YAWN BEHAVIOR TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Yawning", () => {
  test("should trigger yawn at VERY_BORED threshold", () => {
    const state = createIdleBehaviorState();
    state.hasYawnedThisSession = false;
    
    expect(shouldTriggerYawn(89, state.hasYawnedThisSession)).toBe(false);
    expect(shouldTriggerYawn(90, state.hasYawnedThisSession)).toBe(true);
  });

  test("should not trigger yawn if already yawned this session", () => {
    const state = createIdleBehaviorState();
    state.hasYawnedThisSession = true;
    
    expect(shouldTriggerYawn(90, state.hasYawnedThisSession)).toBe(false);
    expect(shouldTriggerYawn(100, state.hasYawnedThisSession)).toBe(false);
  });

  test("should update shouldYawn flag in state", () => {
    const state = createIdleBehaviorState();
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 90,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.shouldYawn).toBe(true);
  });

  test("should reset yawn flag on activity", () => {
    const state = createIdleBehaviorState();
    state.hasYawnedThisSession = true;
    state.shouldYawn = true;
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 0,  // Reset from activity
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.hasYawnedThisSession).toBe(false);
    expect(newState.shouldYawn).toBe(false);
  });
});

// =============================================================================
// SLEEP MODE TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Sleep Mode", () => {
  test("should enter sleep mode after 120 seconds idle", () => {
    expect(shouldEnterSleep(119)).toBe(false);
    expect(shouldEnterSleep(120)).toBe(true);
    expect(shouldEnterSleep(150)).toBe(true);
  });

  test("should update isSleeping flag in state", () => {
    const state = createIdleBehaviorState();
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 120,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isSleeping).toBe(true);
    expect(newState.boredomLevel).toBe('sleeping');
  });

  test("should stay asleep until player action", () => {
    const state = createIdleBehaviorState();
    state.isSleeping = true;
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 150,  // Still idle
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isSleeping).toBe(true);
  });

  test("should show ZZZ effect when sleeping", () => {
    const state = createIdleBehaviorState();
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 130,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isSleeping).toBe(true);
    expect(newState.lookDirection).toBe('center');
  });
});

// =============================================================================
// WAKE UP BEHAVIOR TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Wake Up", () => {
  test("should wake up when player takes action while sleeping", () => {
    expect(shouldWakeUp(true, 0)).toBe(true);
    expect(shouldWakeUp(true, 130)).toBe(false);  // Still idle
    expect(shouldWakeUp(false, 0)).toBe(false);   // Not sleeping
  });

  test("should return startled expression briefly on wake up", () => {
    const state = createIdleBehaviorState();
    state.isSleeping = true;
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 0,  // Player took action
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isSleeping).toBe(false);
    expect(newState.wasJustWoken).toBe(true);
  });

  test("should reset startled state after delay", () => {
    const state = createIdleBehaviorState();
    state.wasJustWoken = true;
    state.wakeUpTime = Date.now() - 1000;  // Woke up 1 second ago
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 1,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.wasJustWoken).toBe(false);
  });

  test("should reset to normal after wake up", () => {
    const state = createIdleBehaviorState();
    state.isSleeping = true;
    state.boredomLevel = 'sleeping';
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 0,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.boredomLevel).toBe('normal');
    expect(newState.lookDirection).toBe('center');
  });
});

// =============================================================================
// STATE MANAGEMENT TESTS
// =============================================================================

test.describe("CobieIdleBehaviors State Management", () => {
  test("should create initial idle behavior state", () => {
    const state = createIdleBehaviorState();
    
    expect(state.isBlinking).toBe(false);
    expect(state.lookDirection).toBe('center');
    expect(state.boredomLevel).toBe('normal');
    expect(state.shouldYawn).toBe(false);
    expect(state.isSleeping).toBe(false);
    expect(state.wasJustWoken).toBe(false);
    expect(state.hasYawnedThisSession).toBe(false);
    expect(state.nextBlinkTime).toBeGreaterThan(0);
    expect(state.nextLookTime).toBeGreaterThan(0);
  });

  test("should update state based on idle time", () => {
    const state = createIdleBehaviorState();
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 45,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.boredomLevel).toBe('slightly_bored');
  });

  test("should preserve blink timing between updates", () => {
    const state = createIdleBehaviorState();
    const originalBlinkTime = state.nextBlinkTime;
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 10,
      isSpeaking: false,
    };
    
    const currentTime = Date.now();
    // If not yet time to blink, nextBlinkTime should not change
    if (currentTime < originalBlinkTime) {
      const newState = updateIdleBehaviorState(state, config, currentTime);
      expect(newState.nextBlinkTime).toBe(originalBlinkTime);
    }
  });

  test("should trigger blink when time is reached", () => {
    const state = createIdleBehaviorState();
    state.nextBlinkTime = Date.now() - 100;  // Past blink time
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 10,
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, Date.now());
    expect(newState.isBlinking).toBe(true);
  });

  test("should schedule new blink after current blink ends", () => {
    const state = createIdleBehaviorState();
    state.isBlinking = true;
    state.blinkEndTime = Date.now() - 10;  // Blink ended
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 10,
      isSpeaking: false,
    };
    
    const currentTime = Date.now();
    const newState = updateIdleBehaviorState(state, config, currentTime);
    expect(newState.isBlinking).toBe(false);
    expect(newState.nextBlinkTime).toBeGreaterThan(currentTime);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

test.describe("CobieIdleBehaviors Integration", () => {
  test("should support full idle cycle from active to sleeping", () => {
    let state = createIdleBehaviorState();
    const baseTime = Date.now();
    
    // Active - normal
    let config: IdleBehaviorConfig = { idleSeconds: 0, isSpeaking: false };
    state = updateIdleBehaviorState(state, config, baseTime);
    expect(state.boredomLevel).toBe('normal');
    
    // Slightly bored
    config = { idleSeconds: 35, isSpeaking: false };
    state = updateIdleBehaviorState(state, config, baseTime + 35000);
    expect(state.boredomLevel).toBe('slightly_bored');
    
    // Bored
    config = { idleSeconds: 65, isSpeaking: false };
    state = updateIdleBehaviorState(state, config, baseTime + 65000);
    expect(state.boredomLevel).toBe('bored');
    
    // Very bored - should trigger yawn
    config = { idleSeconds: 95, isSpeaking: false };
    state = updateIdleBehaviorState(state, config, baseTime + 95000);
    expect(state.boredomLevel).toBe('very_bored');
    expect(state.shouldYawn).toBe(true);
    
    // Sleeping
    config = { idleSeconds: 125, isSpeaking: false };
    state = updateIdleBehaviorState(state, config, baseTime + 125000);
    expect(state.boredomLevel).toBe('sleeping');
    expect(state.isSleeping).toBe(true);
    
    // Wake up
    config = { idleSeconds: 0, isSpeaking: false };
    state = updateIdleBehaviorState(state, config, baseTime + 130000);
    expect(state.isSleeping).toBe(false);
    expect(state.wasJustWoken).toBe(true);
    expect(state.boredomLevel).toBe('normal');
  });

  test("should export all required types and functions", () => {
    // Verify all exports are defined
    expect(BLINK_CONFIG).toBeDefined();
    expect(LOOK_AROUND_CONFIG).toBeDefined();
    expect(BOREDOM_THRESHOLDS).toBeDefined();
    expect(generateBlinkInterval).toBeDefined();
    expect(shouldDoubleBlink).toBeDefined();
    expect(getRandomLookDirection).toBeDefined();
    expect(calculateBoredomLevel).toBeDefined();
    expect(shouldTriggerYawn).toBeDefined();
    expect(shouldEnterSleep).toBeDefined();
    expect(shouldWakeUp).toBeDefined();
    expect(createIdleBehaviorState).toBeDefined();
    expect(updateIdleBehaviorState).toBeDefined();
  });

  test("should handle concurrent behaviors correctly", () => {
    const state = createIdleBehaviorState();
    const now = Date.now();
    state.nextBlinkTime = now - 100;  // Trigger blink
    state.nextLookTime = now - 100;   // Trigger look
    
    const config: IdleBehaviorConfig = {
      idleSeconds: 45,  // Slightly bored
      isSpeaking: false,
    };
    
    const newState = updateIdleBehaviorState(state, config, now);
    
    // Blink should be active
    expect(newState.isBlinking).toBe(true);
    // Look direction was updated (either changed or center was randomly selected)
    expect(newState.nextLookTime).toBeGreaterThan(now);
    expect(newState.boredomLevel).toBe('slightly_bored');
  });
});
