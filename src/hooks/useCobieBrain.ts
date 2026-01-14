'use client';

/**
 * useCobieBrain Hook - Issue #175
 * 
 * React hook for the CobieBrain AI decision engine.
 * Manages Cobie's mood, expression, look direction, and dialogue queue
 * based on game context updates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  CobieMood,
  CobieExpression,
  LookDirection,
  PrioritizedDialogue,
  CobieBrainState,
  CobieContext,
  Position,
  TreasuryTrend,
  HoveredBuildingInfo,
} from '@/lib/cobie/types';
import {
  createInitialBrainState,
  updateBrainState,
  calculateLookDirection,
  addToDialogueQueue,
  dequeueDialogue,
  getIdleState,
} from '@/lib/cobie/CobieBrain';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Minimum time between context updates (ms) */
const MIN_UPDATE_INTERVAL_MS = 100;

/** Time to wait before showing next dialogue (ms) */
const DIALOGUE_DISPLAY_DURATION_MS = 5000;

/** Time to track as idle before updating (ms) */
const IDLE_UPDATE_INTERVAL_MS = 1000;

// =============================================================================
// CONTEXT VALUE INTERFACE (from CobieContextProvider)
// =============================================================================

/**
 * Context value provided by CobieContextProvider
 * This interface defines what the hook expects from the context
 */
export interface CobieContextValue {
  /** Currently hovered tile position */
  hoveredTile: { x: number; y: number } | null;
  /** Currently hovered building info */
  hoveredBuilding: HoveredBuildingInfo | null;
  /** Current treasury balance */
  treasury: number;
  /** Previous treasury balance (for trend calculation) */
  previousTreasury?: number;
  /** Market sentiment (0-100) */
  marketSentiment: number;
  /** Game speed multiplier */
  gameSpeed: number;
  /** Current in-game hour */
  currentHour: number;
  /** Last player action timestamp */
  lastActionTimestamp?: number;
}

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseCobieBrainReturn {
  /** Current brain state */
  state: CobieBrainState;
  /** Update context and recalculate brain state */
  updateContext: (context: CobieContextValue) => void;
  /** Queue a dialogue entry */
  queueDialogue: (dialogue: PrioritizedDialogue) => void;
  /** Dismiss current dialogue and show next */
  dismissDialogue: () => void;
  /** Start speaking (shows current dialogue) */
  startSpeaking: () => void;
  /** Stop speaking */
  stopSpeaking: () => void;
  /** Set Cobie's position for look direction calculation */
  setCobiePosition: (position: Position) => void;
  /** Reset brain state */
  reset: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate treasury trend from current and previous values
 */
function calculateTreasuryTrend(
  current: number,
  previous: number | undefined
): TreasuryTrend {
  if (previous === undefined) return 'stable';
  const diff = current - previous;
  const threshold = Math.max(100, previous * 0.01); // 1% or $100 minimum
  
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useCobieBrain(
  initialContext?: CobieContextValue
): UseCobieBrainReturn {
  // Brain state
  const [state, setState] = useState<CobieBrainState>(createInitialBrainState);
  
  // Cobie's screen position for look direction
  const cobiePositionRef = useRef<Position>({ x: 0, y: 0 });
  
  // Last update timestamp for rate limiting
  const lastUpdateRef = useRef<number>(0);
  
  // Dialogue display timer
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Idle tracking timer
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Last activity timestamp
  const lastActivityRef = useRef<number>(Date.now());

  // Set Cobie's position for look direction calculation
  const setCobiePosition = useCallback((position: Position) => {
    cobiePositionRef.current = position;
  }, []);

  // Update context and recalculate brain state
  const updateContext = useCallback((contextValue: CobieContextValue) => {
    const now = Date.now();
    
    // Rate limit updates
    if (now - lastUpdateRef.current < MIN_UPDATE_INTERVAL_MS) {
      return;
    }
    lastUpdateRef.current = now;

    // Check for activity
    const hasActivity = contextValue.lastActionTimestamp !== undefined &&
      contextValue.lastActionTimestamp > lastActivityRef.current;
    
    if (hasActivity && contextValue.lastActionTimestamp) {
      lastActivityRef.current = contextValue.lastActionTimestamp;
    }

    // Build context for brain update
    const context: CobieContext = {
      hoveredBuilding: contextValue.hoveredBuilding,
      treasuryTrend: calculateTreasuryTrend(
        contextValue.treasury,
        contextValue.previousTreasury
      ),
      timestamp: now,
      hasActivity,
    };

    // Calculate look direction
    const lookDirection = calculateLookDirection(
      cobiePositionRef.current,
      contextValue.hoveredTile,
      state.consecutiveIdleSeconds
    );

    // Update brain state
    setState(prevState => {
      const newState = updateBrainState(prevState, context);
      return {
        ...newState,
        lookDirection,
      };
    });
  }, [state.consecutiveIdleSeconds]);

  // Queue a dialogue entry
  const queueDialogue = useCallback((dialogue: PrioritizedDialogue) => {
    setState(prevState => ({
      ...prevState,
      dialogueQueue: addToDialogueQueue(prevState.dialogueQueue, dialogue),
    }));
  }, []);

  // Dismiss current dialogue and show next
  const dismissDialogue = useCallback(() => {
    setState(prevState => {
      const [nextDialogue, remainingQueue] = dequeueDialogue(prevState.dialogueQueue);
      
      if (nextDialogue) {
        return {
          ...prevState,
          currentDialogue: nextDialogue.text,
          dialogueQueue: remainingQueue,
          isSpeaking: true,
          currentMood: nextDialogue.mood ?? prevState.currentMood,
          currentExpression: nextDialogue.expression ?? 'talking',
        };
      }
      
      return {
        ...prevState,
        currentDialogue: null,
        dialogueQueue: remainingQueue,
        isSpeaking: false,
      };
    });
  }, []);

  // Start speaking (dequeue and show dialogue)
  const startSpeaking = useCallback(() => {
    setState(prevState => {
      if (prevState.dialogueQueue.length === 0) {
        return prevState;
      }
      
      const [dialogue, remainingQueue] = dequeueDialogue(prevState.dialogueQueue);
      
      if (!dialogue) return prevState;
      
      return {
        ...prevState,
        currentDialogue: dialogue.text,
        dialogueQueue: remainingQueue,
        isSpeaking: true,
        currentMood: dialogue.mood ?? prevState.currentMood,
        currentExpression: dialogue.expression ?? 'talking',
      };
    });
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isSpeaking: false,
      currentDialogue: null,
      currentExpression: prevState.currentMood === 'bored' ? 'squint' : 'idle',
    }));
  }, []);

  // Reset brain state
  const reset = useCallback(() => {
    setState(createInitialBrainState());
    lastActivityRef.current = Date.now();
  }, []);

  // Auto-dismiss dialogue after duration
  useEffect(() => {
    if (state.isSpeaking && state.currentDialogue) {
      dialogueTimerRef.current = setTimeout(() => {
        dismissDialogue();
      }, DIALOGUE_DISPLAY_DURATION_MS);
      
      return () => {
        if (dialogueTimerRef.current) {
          clearTimeout(dialogueTimerRef.current);
        }
      };
    }
  }, [state.isSpeaking, state.currentDialogue, dismissDialogue]);

  // Track idle time
  useEffect(() => {
    idleTimerRef.current = setInterval(() => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;
      const idleSeconds = Math.floor(idleMs / 1000);
      
      setState(prevState => {
        if (prevState.consecutiveIdleSeconds !== idleSeconds) {
          const idleState = getIdleState(idleSeconds);
          let newMood = prevState.currentMood;
          let newExpression = prevState.currentExpression;
          
          // Update mood and expression based on idle state
          if (!prevState.isSpeaking) {
            if (idleState === 'sleeping') {
              newMood = 'bored';
              newExpression = 'sleeping';
            } else if (idleState === 'very_bored') {
              newMood = 'bored';
              newExpression = 'squint';
            } else if (idleState === 'bored') {
              newMood = 'bored';
              newExpression = 'squint';
            }
          }
          
          return {
            ...prevState,
            consecutiveIdleSeconds: idleSeconds,
            currentMood: newMood,
            currentExpression: newExpression,
          };
        }
        return prevState;
      });
    }, IDLE_UPDATE_INTERVAL_MS);
    
    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, []);

  // Initialize with context if provided
  useEffect(() => {
    if (initialContext) {
      updateContext(initialContext);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    updateContext,
    queueDialogue,
    dismissDialogue,
    startSpeaking,
    stopSpeaking,
    setCobiePosition,
    reset,
  };
}

export default useCobieBrain;
