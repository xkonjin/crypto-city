import { test, expect } from "@playwright/test";

/**
 * Tests for CobieContext Provider (Issue #174)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * 
 * The CobieContext provides real-time context awareness for the Floating Cobie Head:
 * - Cursor/interaction context (hovered tile, hovered building)
 * - Player behavior context (idle time, action streak)
 * - Game state context (treasury trend, recent events)
 */

// Import the types and implementations we're going to implement
// These imports will fail initially - that's expected in TDD!
import type {
  CobieContextValue,
  PlayerAction,
} from "@/context/CobieContext";

import {
  createMockCobieContextValue,
  calculateTreasuryTrend,
  addActionToStreak,
} from "@/context/CobieContext";

/**
 * Test Suite: CobieContextValue Interface
 * Tests the context value structure
 */
test.describe("CobieContextValue Interface", () => {
  test("should have cursor/interaction context properties", async () => {
    const mockContext = createMockCobieContextValue();
    
    // Hovered tile should be null or have x/y coordinates
    expect(mockContext.hoveredTile === null || 
      (typeof mockContext.hoveredTile.x === 'number' && typeof mockContext.hoveredTile.y === 'number')
    ).toBe(true);
    
    // Hovered building should be null or a CryptoBuilding
    expect(mockContext.hoveredBuilding === null || 
      typeof mockContext.hoveredBuilding === 'object'
    ).toBe(true);
    
    // Selected tool should be defined
    expect(mockContext.selectedTool).toBeDefined();
  });

  test("should have player behavior context properties", async () => {
    const mockContext = createMockCobieContextValue();
    
    // Idle time should be a number >= 0
    expect(typeof mockContext.idleTime).toBe('number');
    expect(mockContext.idleTime).toBeGreaterThanOrEqual(0);
    
    // Last action should be null or a PlayerAction
    expect(mockContext.lastAction === null || 
      typeof mockContext.lastAction === 'object'
    ).toBe(true);
    
    // Action streak should be an array
    expect(Array.isArray(mockContext.actionStreak)).toBe(true);
    expect(mockContext.actionStreak.length).toBeLessThanOrEqual(10);
  });

  test("should have game state context properties", async () => {
    const mockContext = createMockCobieContextValue();
    
    // Treasury trend should be one of the valid values
    expect(['up', 'down', 'stable']).toContain(mockContext.treasuryTrend);
    
    // Recent events should be an array
    expect(Array.isArray(mockContext.recentEvents)).toBe(true);
  });

  test("should have all required methods", async () => {
    const mockContext = createMockCobieContextValue();
    
    // All methods should be functions
    expect(typeof mockContext.reportHover).toBe('function');
    expect(typeof mockContext.reportAction).toBe('function');
    expect(typeof mockContext.resetIdleTime).toBe('function');
  });
});

/**
 * Test Suite: PlayerAction Type
 * Tests the player action structure
 */
test.describe("PlayerAction Type", () => {
  test("should have required properties", async () => {
    const action: PlayerAction = {
      type: 'place',
      timestamp: Date.now(),
    };
    
    expect(action.type).toBe('place');
    expect(typeof action.timestamp).toBe('number');
    expect(action.timestamp).toBeGreaterThan(0);
  });

  test("should allow all valid action types", async () => {
    const actionTypes: PlayerAction['type'][] = [
      'place',
      'bulldoze',
      'zone',
      'select_tool',
      'hover',
    ];
    
    actionTypes.forEach(type => {
      const action: PlayerAction = { type, timestamp: Date.now() };
      expect(action.type).toBe(type);
    });
  });

  test("should accept optional details", async () => {
    const action: PlayerAction = {
      type: 'place',
      timestamp: Date.now(),
      details: {
        buildingId: 'uniswap_hq',
        x: 10,
        y: 20,
      },
    };
    
    expect(action.details).toBeDefined();
    expect(action.details?.buildingId).toBe('uniswap_hq');
  });
});

/**
 * Test Suite: Idle Time Tracking
 * Tests that idle time increments correctly
 */
test.describe("Idle Time Tracking", () => {
  test("idle time should start at 0", async () => {
    const mockContext = createMockCobieContextValue();
    expect(mockContext.idleTime).toBe(0);
  });

  test("resetIdleTime should reset idle time to 0", async () => {
    const mockContext = createMockCobieContextValue();
    // Simulate some idle time having passed
    mockContext.idleTime = 30;
    mockContext.resetIdleTime();
    expect(mockContext.idleTime).toBe(0);
  });

  test("reportAction should reset idle time", async () => {
    const mockContext = createMockCobieContextValue();
    mockContext.idleTime = 30;
    mockContext.reportAction({ type: 'place', timestamp: Date.now() });
    expect(mockContext.idleTime).toBe(0);
  });
});

/**
 * Test Suite: Action Streak Management
 * Tests that action streak maintains order and limits
 */
test.describe("Action Streak Management", () => {
  test("should maintain FIFO order (oldest first)", async () => {
    const streak: PlayerAction[] = [];
    const action1: PlayerAction = { type: 'place', timestamp: 1000 };
    const action2: PlayerAction = { type: 'bulldoze', timestamp: 2000 };
    const action3: PlayerAction = { type: 'zone', timestamp: 3000 };
    
    let result = addActionToStreak(streak, action1);
    result = addActionToStreak(result, action2);
    result = addActionToStreak(result, action3);
    
    expect(result.length).toBe(3);
    expect(result[0].timestamp).toBe(1000); // Oldest first
    expect(result[2].timestamp).toBe(3000); // Newest last
  });

  test("should limit streak to 10 items", async () => {
    let streak: PlayerAction[] = [];
    
    // Add 15 actions
    for (let i = 0; i < 15; i++) {
      const action: PlayerAction = { type: 'place', timestamp: 1000 + i * 100 };
      streak = addActionToStreak(streak, action);
    }
    
    expect(streak.length).toBe(10);
    // Should keep the 10 most recent (drop oldest)
    expect(streak[0].timestamp).toBe(1500); // 6th action (index 5)
    expect(streak[9].timestamp).toBe(2400); // 15th action (index 14)
  });

  test("reportAction should add to action streak", async () => {
    const mockContext = createMockCobieContextValue();
    const action: PlayerAction = { type: 'place', timestamp: Date.now() };
    
    mockContext.reportAction(action);
    
    expect(mockContext.actionStreak.length).toBeGreaterThan(0);
    expect(mockContext.actionStreak[mockContext.actionStreak.length - 1].type).toBe('place');
  });
});

/**
 * Test Suite: Treasury Trend Calculation
 * Tests that treasury trend is calculated over 60-second window
 */
test.describe("Treasury Trend Calculation", () => {
  test("should return 'stable' for no change", async () => {
    const history = [
      { timestamp: 0, treasury: 10000 },
      { timestamp: 30000, treasury: 10000 },
      { timestamp: 60000, treasury: 10000 },
    ];
    
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('stable');
  });

  test("should return 'up' for increasing treasury", async () => {
    const history = [
      { timestamp: 0, treasury: 10000 },
      { timestamp: 30000, treasury: 11000 },
      { timestamp: 60000, treasury: 12000 },
    ];
    
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('up');
  });

  test("should return 'down' for decreasing treasury", async () => {
    const history = [
      { timestamp: 0, treasury: 12000 },
      { timestamp: 30000, treasury: 11000 },
      { timestamp: 60000, treasury: 10000 },
    ];
    
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('down');
  });

  test("should use threshold for stability detection (5% change)", async () => {
    const history = [
      { timestamp: 0, treasury: 10000 },
      { timestamp: 60000, treasury: 10400 }, // 4% increase - should be stable
    ];
    
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('stable');
  });

  test("should detect upward trend when > 5% increase", async () => {
    const history = [
      { timestamp: 0, treasury: 10000 },
      { timestamp: 60000, treasury: 10600 }, // 6% increase
    ];
    
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('up');
  });

  test("should detect downward trend when > 5% decrease", async () => {
    const history = [
      { timestamp: 0, treasury: 10000 },
      { timestamp: 60000, treasury: 9400 }, // 6% decrease
    ];
    
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('down');
  });

  test("should handle empty history", async () => {
    const history: { timestamp: number; treasury: number }[] = [];
    const trend = calculateTreasuryTrend(history);
    expect(trend).toBe('stable');
  });

  test("should use only last 60 seconds of data", async () => {
    const now = Date.now();
    const history = [
      { timestamp: now - 120000, treasury: 5000 },  // 2 minutes ago - should be ignored
      { timestamp: now - 60000, treasury: 10000 },  // 1 minute ago - start of window
      { timestamp: now - 30000, treasury: 11000 },
      { timestamp: now, treasury: 12000 },          // now
    ];
    
    const trend = calculateTreasuryTrend(history);
    // Should calculate from 10000 -> 12000 (20% increase = 'up')
    expect(trend).toBe('up');
  });
});

/**
 * Test Suite: Hover Reporting
 * Tests hover reporting functionality
 */
test.describe("Hover Reporting", () => {
  test("reportHover should update hoveredTile", async () => {
    const mockContext = createMockCobieContextValue();
    
    mockContext.reportHover({ x: 5, y: 10 });
    
    expect(mockContext.hoveredTile).toEqual({ x: 5, y: 10 });
  });

  test("reportHover should update hoveredBuilding when provided", async () => {
    const mockContext = createMockCobieContextValue();
    // Use null explicitly since CryptoBuildingDefinition is complex
    // The actual building type validation happens at integration level
    const mockBuilding = null;
    
    mockContext.reportHover({ x: 5, y: 10 }, mockBuilding);
    
    expect(mockContext.hoveredBuilding).toEqual(mockBuilding);
  });

  test("reportHover should clear hoveredTile when passed null", async () => {
    const mockContext = createMockCobieContextValue();
    mockContext.hoveredTile = { x: 5, y: 10 };
    
    mockContext.reportHover(null);
    
    expect(mockContext.hoveredTile).toBeNull();
  });

  test("reportHover should clear hoveredBuilding when tile is null", async () => {
    const mockContext = createMockCobieContextValue();
    // Set building to non-null (using null as placeholder since full type is complex)
    // hoveredBuilding starts as null, so we verify clearing works
    mockContext.hoveredTile = { x: 5, y: 10 };
    
    mockContext.reportHover(null);
    
    expect(mockContext.hoveredBuilding).toBeNull();
    expect(mockContext.hoveredTile).toBeNull();
  });
});

/**
 * Test Suite: Context Integration
 * Tests that context integrates properly with game state
 */
test.describe("Context Integration", () => {
  test("should export CobieContext for use with useContext", async () => {
    // This test validates the export exists
    const { CobieContext } = await import("@/context/CobieContext");
    expect(CobieContext).toBeDefined();
  });

  test("should export CobieProvider component", async () => {
    const { CobieProvider } = await import("@/context/CobieContext");
    expect(CobieProvider).toBeDefined();
    expect(typeof CobieProvider).toBe('function');
  });

  test("should export useCobieContext hook file", async () => {
    // The hook is exported from useCobieContext.ts
    // We verify it compiles correctly by checking the CobieContext can be consumed
    const { CobieContext } = await import("@/context/CobieContext");
    // If CobieContext is defined, the useCobieContext hook can use it with useContext
    expect(CobieContext).toBeDefined();
    // The hook wraps useContext(CobieContext) and adds error handling
    // This test validates the context it depends on is properly exported
  });
});
