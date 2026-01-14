import { test, expect } from "@playwright/test";

/**
 * Tests for CobieBrain Engine (Issue #175)
 * 
 * Tests the AI decision engine for the Floating Cobie Head system:
 * 1. Mood calculation from game context
 * 2. Expression selection based on mood and events
 * 3. Look direction calculation from cursor/tile position
 * 4. Idle progression (neutral → bored → sleeping)
 * 5. Dialogue queue management with priorities
 */

import type { 
  CobieMood, 
  CobieExpression, 
  LookDirection,
  IdleState,
  PrioritizedDialogue,
  CobieBrainState,
  CobieContext,
  Position,
} from "@/lib/cobie/types";
import {
  CobieMoods,
  CobieExpressions,
  LookDirections,
} from "@/lib/cobie/types";
import {
  calculateMoodFromContext,
  selectExpression,
  calculateLookDirection,
  getIdleState,
  createDialogueQueue,
  addToDialogueQueue,
  dequeueDialogue,
  createInitialBrainState,
  updateBrainState,
} from "@/lib/cobie/CobieBrain";

// =============================================================================
// UNIT TESTS - CobieBrain logic
// =============================================================================

test.describe("CobieBrain Types", () => {
  test("should export all mood types", () => {
    expect(CobieMoods).toContain('neutral');
    expect(CobieMoods).toContain('amused');
    expect(CobieMoods).toContain('concerned');
    expect(CobieMoods).toContain('excited');
    expect(CobieMoods).toContain('bored');
    expect(CobieMoods).toContain('sardonic');
    expect(CobieMoods).toContain('thinking');
  });

  test("should export all expression types", () => {
    expect(CobieExpressions).toContain('idle');
    expect(CobieExpressions).toContain('smirk');
    expect(CobieExpressions).toContain('raised_eyebrow');
    expect(CobieExpressions).toContain('wide_eyes');
    expect(CobieExpressions).toContain('squint');
    expect(CobieExpressions).toContain('thinking');
    expect(CobieExpressions).toContain('talking');
    expect(CobieExpressions).toContain('laughing');
    expect(CobieExpressions).toContain('concerned');
    expect(CobieExpressions).toContain('sleeping');
  });

  test("should export all look directions", () => {
    expect(LookDirections).toContain('center');
    expect(LookDirections).toContain('left');
    expect(LookDirections).toContain('right');
    expect(LookDirections).toContain('up');
    expect(LookDirections).toContain('down');
  });
});

test.describe("CobieBrain Mood Calculation", () => {
  test("should return 'concerned' when hovering high-risk building", () => {
    const context: CobieContext = {
      hoveredBuilding: { 
        crypto: { 
          effects: { rugRisk: 0.4 } // High risk (> 0.3)
        } 
      },
      treasuryTrend: 'stable',
      consecutiveIdleSeconds: 0,
    };
    
    const mood = calculateMoodFromContext(context);
    expect(mood).toBe('concerned');
  });

  test("should return 'excited' when hovering legend building", () => {
    const context: CobieContext = {
      hoveredBuilding: { 
        category: 'legends',
        crypto: { effects: { rugRisk: 0 } }
      },
      treasuryTrend: 'stable',
      consecutiveIdleSeconds: 0,
    };
    
    const mood = calculateMoodFromContext(context);
    expect(mood).toBe('excited');
  });

  test("should return 'concerned' when treasury dropping", () => {
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'down',
      consecutiveIdleSeconds: 0,
    };
    
    const mood = calculateMoodFromContext(context);
    expect(mood).toBe('concerned');
  });

  test("should return 'amused' when treasury rising", () => {
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'up',
      consecutiveIdleSeconds: 0,
    };
    
    const mood = calculateMoodFromContext(context);
    expect(mood).toBe('amused');
  });

  test("should return 'bored' when idle > 30 seconds", () => {
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'stable',
      consecutiveIdleSeconds: 35,
    };
    
    const mood = calculateMoodFromContext(context);
    expect(mood).toBe('bored');
  });

  test("should return 'neutral' when no special conditions", () => {
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'stable',
      consecutiveIdleSeconds: 10,
    };
    
    const mood = calculateMoodFromContext(context);
    expect(mood).toBe('neutral');
  });
});

test.describe("CobieBrain Expression Selection", () => {
  test("should return 'raised_eyebrow' for concerned mood with hover", () => {
    const expression = selectExpression('concerned', { isHovering: true, isSpeaking: false });
    expect(expression).toBe('raised_eyebrow');
  });

  test("should return 'wide_eyes' for excited mood with milestone", () => {
    const expression = selectExpression('excited', { isMilestone: true, isSpeaking: false });
    expect(expression).toBe('wide_eyes');
  });

  test("should return 'squint' for bored mood", () => {
    const expression = selectExpression('bored', { isSpeaking: false });
    expect(expression).toBe('squint');
  });

  test("should return 'talking' when speaking", () => {
    const expression = selectExpression('neutral', { isSpeaking: true });
    expect(expression).toBe('talking');
  });

  test("should return 'sleeping' when idle > 120 seconds", () => {
    const expression = selectExpression('bored', { consecutiveIdleSeconds: 125, isSpeaking: false });
    expect(expression).toBe('sleeping');
  });

  test("should return 'smirk' for amused mood", () => {
    const expression = selectExpression('amused', { isSpeaking: false });
    expect(expression).toBe('smirk');
  });

  test("should return 'thinking' for thinking mood", () => {
    const expression = selectExpression('thinking', { isSpeaking: false });
    expect(expression).toBe('thinking');
  });

  test("should return 'concerned' for sardonic mood", () => {
    const expression = selectExpression('sardonic', { isSpeaking: false });
    expect(expression).toBe('concerned');
  });
});

test.describe("CobieBrain Look Direction", () => {
  test("should return 'left' when tile is to the left of Cobie", () => {
    const cobiePosition: Position = { x: 500, y: 400 }; // Bottom-right area
    const hoveredTile: Position = { x: 100, y: 400 }; // Far left
    
    const direction = calculateLookDirection(cobiePosition, hoveredTile);
    expect(direction).toBe('left');
  });

  test("should return 'right' when tile is to the right of Cobie", () => {
    const cobiePosition: Position = { x: 100, y: 400 }; // Bottom-left area
    const hoveredTile: Position = { x: 500, y: 400 }; // Far right
    
    const direction = calculateLookDirection(cobiePosition, hoveredTile);
    expect(direction).toBe('right');
  });

  test("should return 'up' when tile is above Cobie", () => {
    const cobiePosition: Position = { x: 300, y: 500 }; // Bottom area
    const hoveredTile: Position = { x: 300, y: 100 }; // Top
    
    const direction = calculateLookDirection(cobiePosition, hoveredTile);
    expect(direction).toBe('up');
  });

  test("should return 'down' when tile is below Cobie", () => {
    const cobiePosition: Position = { x: 300, y: 100 }; // Top area
    const hoveredTile: Position = { x: 300, y: 500 }; // Bottom
    
    const direction = calculateLookDirection(cobiePosition, hoveredTile);
    expect(direction).toBe('down');
  });

  test("should return 'center' when no tile is hovered", () => {
    const cobiePosition: Position = { x: 300, y: 400 };
    const hoveredTile = null;
    
    const direction = calculateLookDirection(cobiePosition, hoveredTile);
    expect(direction).toBe('center');
  });

  test("should return 'center' when idle > 5 seconds", () => {
    const cobiePosition: Position = { x: 300, y: 400 };
    const hoveredTile: Position = { x: 100, y: 400 }; // Would normally be 'left'
    const idleSeconds = 6;
    
    const direction = calculateLookDirection(cobiePosition, hoveredTile, idleSeconds);
    expect(direction).toBe('center');
  });
});

test.describe("CobieBrain Idle Progression", () => {
  test("should return 'neutral' for 0-30 seconds idle", () => {
    expect(getIdleState(0)).toBe('neutral');
    expect(getIdleState(15)).toBe('neutral');
    expect(getIdleState(29)).toBe('neutral');
  });

  test("should return 'bored' for 30-60 seconds idle", () => {
    expect(getIdleState(30)).toBe('bored');
    expect(getIdleState(45)).toBe('bored');
    expect(getIdleState(59)).toBe('bored');
  });

  test("should return 'very_bored' for 60-120 seconds idle", () => {
    expect(getIdleState(60)).toBe('very_bored');
    expect(getIdleState(90)).toBe('very_bored');
    expect(getIdleState(119)).toBe('very_bored');
  });

  test("should return 'sleeping' for 120+ seconds idle", () => {
    expect(getIdleState(120)).toBe('sleeping');
    expect(getIdleState(180)).toBe('sleeping');
    expect(getIdleState(300)).toBe('sleeping');
  });
});

test.describe("CobieBrain Dialogue Queue", () => {
  test("should create empty dialogue queue", () => {
    const queue = createDialogueQueue();
    expect(queue).toEqual([]);
  });

  test("should add dialogue to queue with priority", () => {
    const queue = createDialogueQueue();
    const dialogue: PrioritizedDialogue = { text: 'Test message', priority: 5 };
    
    const newQueue = addToDialogueQueue(queue, dialogue);
    expect(newQueue).toHaveLength(1);
    expect(newQueue[0].text).toBe('Test message');
    expect(newQueue[0].priority).toBe(5);
  });

  test("should sort dialogue by priority (lower = higher priority)", () => {
    let queue = createDialogueQueue();
    queue = addToDialogueQueue(queue, { text: 'Low priority', priority: 10 });
    queue = addToDialogueQueue(queue, { text: 'High priority', priority: 1 });
    queue = addToDialogueQueue(queue, { text: 'Medium priority', priority: 5 });
    
    expect(queue[0].text).toBe('High priority');
    expect(queue[1].text).toBe('Medium priority');
    expect(queue[2].text).toBe('Low priority');
  });

  test("should dequeue highest priority dialogue", () => {
    let queue = createDialogueQueue();
    queue = addToDialogueQueue(queue, { text: 'First', priority: 5 });
    queue = addToDialogueQueue(queue, { text: 'Second', priority: 1 });
    
    const [dialogue, remainingQueue] = dequeueDialogue(queue);
    
    expect(dialogue?.text).toBe('Second');
    expect(remainingQueue).toHaveLength(1);
    expect(remainingQueue[0].text).toBe('First');
  });

  test("should return null when dequeuing empty queue", () => {
    const queue = createDialogueQueue();
    const [dialogue, remainingQueue] = dequeueDialogue(queue);
    
    expect(dialogue).toBeNull();
    expect(remainingQueue).toEqual([]);
  });

  test("should support optional expression and mood in dialogue", () => {
    const queue = createDialogueQueue();
    const dialogue: PrioritizedDialogue = { 
      text: 'Test', 
      priority: 1, 
      expression: 'wide_eyes',
      mood: 'excited'
    };
    
    const newQueue = addToDialogueQueue(queue, dialogue);
    expect(newQueue[0].expression).toBe('wide_eyes');
    expect(newQueue[0].mood).toBe('excited');
  });
});

test.describe("CobieBrain State Management", () => {
  test("should create initial brain state", () => {
    const state = createInitialBrainState();
    
    expect(state.currentMood).toBe('neutral');
    expect(state.currentExpression).toBe('idle');
    expect(state.isSpeaking).toBe(false);
    expect(state.currentDialogue).toBeNull();
    expect(state.dialogueQueue).toEqual([]);
    expect(state.lastContextUpdate).toBe(0);
    expect(state.consecutiveIdleSeconds).toBe(0);
    expect(state.hasReactedToCurrentHover).toBe(false);
    expect(state.lookDirection).toBe('center');
  });

  test("should update brain state on context change", () => {
    const initialState = createInitialBrainState();
    const context: CobieContext = {
      hoveredBuilding: { category: 'legends', crypto: { effects: { rugRisk: 0 } } },
      treasuryTrend: 'stable',
      timestamp: Date.now(),
    };
    
    const newState = updateBrainState(initialState, context);
    
    expect(newState.currentMood).toBe('excited');
    expect(newState.lastContextUpdate).toBeGreaterThan(0);
  });

  test("should track hover reaction state", () => {
    const initialState = createInitialBrainState();
    const context: CobieContext = {
      hoveredBuilding: { category: 'defi', crypto: { effects: { rugRisk: 0.1 } } },
      treasuryTrend: 'stable',
      timestamp: Date.now(),
    };
    
    const newState = updateBrainState(initialState, context);
    expect(newState.hasReactedToCurrentHover).toBe(true);
  });

  test("should reset hover reaction when building changes", () => {
    const initialState = createInitialBrainState();
    initialState.hasReactedToCurrentHover = true;
    
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'stable',
      timestamp: Date.now(),
    };
    
    const newState = updateBrainState(initialState, context);
    expect(newState.hasReactedToCurrentHover).toBe(false);
  });

  test("should increment idle seconds when no activity", () => {
    const initialState = createInitialBrainState();
    initialState.lastContextUpdate = Date.now() - 5000; // 5 seconds ago
    
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'stable',
      timestamp: Date.now(),
      hasActivity: false,
    };
    
    const newState = updateBrainState(initialState, context);
    expect(newState.consecutiveIdleSeconds).toBeGreaterThanOrEqual(5);
  });

  test("should reset idle seconds on activity", () => {
    const initialState = createInitialBrainState();
    initialState.consecutiveIdleSeconds = 45;
    
    const context: CobieContext = {
      hoveredBuilding: null,
      treasuryTrend: 'stable',
      timestamp: Date.now(),
      hasActivity: true,
    };
    
    const newState = updateBrainState(initialState, context);
    expect(newState.consecutiveIdleSeconds).toBe(0);
  });
});
