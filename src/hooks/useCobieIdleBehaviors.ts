/**
 * useCobieIdleBehaviors - React hook for Cobie idle behaviors
 * Issue #180
 * 
 * Provides natural idle behaviors for the Floating Cobie Head:
 * - Random blinking
 * - Looking around
 * - Boredom progression
 * - Sleep mode
 * - Wake up behavior
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { LookDirection } from '@/lib/cobie/types';
import type { BoredomLevel, IdleBehaviorState } from '@/lib/cobie/CobieIdleBehaviors';
import {
  BLINK_CONFIG,
  createIdleBehaviorState,
  updateIdleBehaviorState,
} from '@/lib/cobie/CobieIdleBehaviors';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Public interface for idle behavior state
 */
export interface IdleBehaviorOutput {
  /** Whether currently in a blink animation */
  isBlinking: boolean;
  /** Current look direction */
  lookDirection: LookDirection;
  /** Current boredom level */
  boredomLevel: BoredomLevel;
  /** Whether a yawn should be triggered */
  shouldYawn: boolean;
  /** Whether currently in sleep mode */
  isSleeping: boolean;
  /** Whether just woken up (for startled expression) */
  wasJustWoken: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Update interval in milliseconds */
const UPDATE_INTERVAL = 100;

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing Cobie idle behaviors
 * 
 * @param idleSeconds - Seconds since last player activity
 * @param isSpeaking - Whether Cobie is currently speaking
 * @returns Current idle behavior state
 */
export function useCobieIdleBehaviors(
  idleSeconds: number,
  isSpeaking: boolean
): IdleBehaviorOutput {
  // Internal state
  const [state, setState] = useState<IdleBehaviorState>(createIdleBehaviorState);
  
  // Track previous idle seconds to detect activity reset
  const prevIdleSecondsRef = useRef(idleSeconds);
  
  // Memoize config to detect changes
  const config = useMemo(() => ({ idleSeconds, isSpeaking }), [idleSeconds, isSpeaking]);
  
  // Periodic update for animations - handles both interval updates and activity detection
  useEffect(() => {
    // Update function for interval callback
    const performUpdate = () => {
      const currentTime = Date.now();
      setState((prevState) => 
        updateIdleBehaviorState(prevState, config, currentTime)
      );
    };
    
    // Check for activity reset (when idleSeconds drops)
    // This is done at the start of the effect, before setting up the interval
    const activityDetected = config.idleSeconds < prevIdleSecondsRef.current;
    prevIdleSecondsRef.current = config.idleSeconds;
    
    // Perform initial update when config changes or activity detected
    if (activityDetected) {
      performUpdate();
    }
    
    // Set up periodic update interval
    const intervalId = setInterval(performUpdate, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [config]);
  
  // Return public interface
  return {
    isBlinking: state.isBlinking,
    lookDirection: state.lookDirection,
    boredomLevel: state.boredomLevel,
    shouldYawn: state.shouldYawn,
    isSleeping: state.isSleeping,
    wasJustWoken: state.wasJustWoken,
  };
}

/**
 * Get CSS class for blink animation
 */
export function getBlinkAnimationClass(isBlinking: boolean): string {
  return isBlinking ? 'animate-cobie-blink' : '';
}

/**
 * Get blink duration for CSS transitions
 */
export function getBlinkDuration(): number {
  return BLINK_CONFIG.duration;
}
