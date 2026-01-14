'use client';

/**
 * CobieContext Provider - Issue #174
 * 
 * Provides real-time context awareness for the Floating Cobie Head system.
 * Tracks cursor/interaction context, player behavior, and game state.
 * 
 * Architecture:
 * - Uses useRef for idle time tracking to avoid unnecessary re-renders
 * - Tracks treasury trend over 60-second window
 * - Limits actionStreak to 10 items (FIFO)
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { Tool } from '@/types/game';
import { CryptoEvent, CryptoBuildingDefinition } from '@/games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Player action type for tracking behavior patterns
 */
export type PlayerAction = {
  type: 'place' | 'bulldoze' | 'zone' | 'select_tool' | 'hover';
  timestamp: number;
  details?: Record<string, unknown>;
};

/**
 * Treasury history entry for trend calculation
 */
export interface TreasuryHistoryEntry {
  timestamp: number;
  treasury: number;
}

/**
 * Trend direction for treasury changes
 */
export type TreasuryTrend = 'up' | 'down' | 'stable';

/**
 * Main context value interface
 */
export interface CobieContextValue {
  // Cursor/interaction context
  hoveredTile: { x: number; y: number } | null;
  hoveredBuilding: CryptoBuildingDefinition | null;
  selectedTool: Tool;
  
  // Player behavior context
  idleTime: number; // Seconds since last action
  lastAction: PlayerAction | null;
  actionStreak: PlayerAction[]; // Last 10 actions
  
  // Game state context  
  treasuryTrend: TreasuryTrend;
  recentEvents: CryptoEvent[];
  
  // Methods
  reportHover: (tile: { x: number; y: number } | null, building?: CryptoBuildingDefinition | null) => void;
  reportAction: (action: PlayerAction) => void;
  resetIdleTime: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_ACTION_STREAK = 10;
const TREASURY_TREND_WINDOW_MS = 60000; // 60 seconds
const TREASURY_TREND_THRESHOLD = 0.05; // 5% change for up/down
const IDLE_INCREMENT_INTERVAL_MS = 1000; // 1 second

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Adds an action to the streak, maintaining FIFO order and max limit
 */
export function addActionToStreak(
  streak: PlayerAction[],
  action: PlayerAction
): PlayerAction[] {
  const newStreak = [...streak, action];
  // Keep only the most recent MAX_ACTION_STREAK items
  if (newStreak.length > MAX_ACTION_STREAK) {
    return newStreak.slice(newStreak.length - MAX_ACTION_STREAK);
  }
  return newStreak;
}

/**
 * Calculates treasury trend based on history over the last 60 seconds
 */
export function calculateTreasuryTrend(
  history: TreasuryHistoryEntry[]
): TreasuryTrend {
  if (history.length < 2) {
    return 'stable';
  }

  const now = Date.now();
  const windowStart = now - TREASURY_TREND_WINDOW_MS;
  
  // Filter to only include entries within the time window
  const recentHistory = history.filter(entry => entry.timestamp >= windowStart);
  
  if (recentHistory.length < 2) {
    // Not enough data in window, use first and last of available history
    const oldest = history[0];
    const newest = history[history.length - 1];
    
    if (oldest.treasury === 0) return 'stable';
    
    const percentChange = (newest.treasury - oldest.treasury) / oldest.treasury;
    
    if (percentChange > TREASURY_TREND_THRESHOLD) return 'up';
    if (percentChange < -TREASURY_TREND_THRESHOLD) return 'down';
    return 'stable';
  }
  
  // Calculate trend from oldest to newest in window
  const oldest = recentHistory[0];
  const newest = recentHistory[recentHistory.length - 1];
  
  if (oldest.treasury === 0) return 'stable';
  
  const percentChange = (newest.treasury - oldest.treasury) / oldest.treasury;
  
  if (percentChange > TREASURY_TREND_THRESHOLD) return 'up';
  if (percentChange < -TREASURY_TREND_THRESHOLD) return 'down';
  return 'stable';
}

/**
 * Creates a mock context value for testing
 */
export function createMockCobieContextValue(): CobieContextValue & { 
  // Allow direct mutation for tests
  idleTime: number;
  hoveredTile: { x: number; y: number } | null;
  hoveredBuilding: CryptoBuildingDefinition | null;
  actionStreak: PlayerAction[];
} {
  const state = {
    hoveredTile: null as { x: number; y: number } | null,
    hoveredBuilding: null as CryptoBuildingDefinition | null,
    selectedTool: 'select' as Tool,
    idleTime: 0,
    lastAction: null as PlayerAction | null,
    actionStreak: [] as PlayerAction[],
    treasuryTrend: 'stable' as TreasuryTrend,
    recentEvents: [] as CryptoEvent[],
  };

  return {
    ...state,
    reportHover: (tile, building) => {
      state.hoveredTile = tile;
      state.hoveredBuilding = building ?? null;
    },
    reportAction: (action) => {
      state.actionStreak = addActionToStreak(state.actionStreak, action);
      state.lastAction = action;
      state.idleTime = 0;
    },
    resetIdleTime: () => {
      state.idleTime = 0;
    },
    // Expose state for tests
    get hoveredTile() { return state.hoveredTile; },
    set hoveredTile(value) { state.hoveredTile = value; },
    get hoveredBuilding() { return state.hoveredBuilding; },
    set hoveredBuilding(value) { state.hoveredBuilding = value; },
    get idleTime() { return state.idleTime; },
    set idleTime(value) { state.idleTime = value; },
    get actionStreak() { return state.actionStreak; },
    set actionStreak(value) { state.actionStreak = value; },
    get lastAction() { return state.lastAction; },
    get treasuryTrend() { return state.treasuryTrend; },
    get recentEvents() { return state.recentEvents; },
    get selectedTool() { return state.selectedTool; },
  };
}

// =============================================================================
// CONTEXT
// =============================================================================

const CobieContext = createContext<CobieContextValue | null>(null);

// =============================================================================
// PROVIDER PROPS
// =============================================================================

interface CobieProviderProps {
  children: ReactNode;
  /** Current selected tool from game context */
  selectedTool?: Tool;
  /** Current treasury value for trend tracking */
  treasury?: number;
  /** Recent crypto events */
  recentEvents?: CryptoEvent[];
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function CobieProvider({
  children,
  selectedTool = 'select',
  treasury = 0,
  recentEvents = [],
}: CobieProviderProps) {
  // State for hover tracking
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<CryptoBuildingDefinition | null>(null);
  
  // State for player behavior
  const [idleTime, setIdleTime] = useState(0);
  const [lastAction, setLastAction] = useState<PlayerAction | null>(null);
  const [actionStreak, setActionStreak] = useState<PlayerAction[]>([]);
  
  // Ref for idle time interval to avoid re-renders
  const idleTimeRef = useRef(0);
  
  // Treasury history for trend calculation
  const treasuryHistoryRef = useRef<TreasuryHistoryEntry[]>([]);
  const [treasuryTrend, setTreasuryTrend] = useState<TreasuryTrend>('stable');
  
  // Update treasury history and calculate trend
  useEffect(() => {
    const now = Date.now();
    
    // Add current treasury to history
    treasuryHistoryRef.current = [
      ...treasuryHistoryRef.current,
      { timestamp: now, treasury },
    ];
    
    // Clean up old entries (older than 2 minutes)
    const cutoff = now - 120000;
    treasuryHistoryRef.current = treasuryHistoryRef.current.filter(
      entry => entry.timestamp >= cutoff
    );
    
    // Calculate and update trend
    const trend = calculateTreasuryTrend(treasuryHistoryRef.current);
    setTreasuryTrend(trend);
  }, [treasury]);
  
  // Idle time increment interval
  useEffect(() => {
    const interval = setInterval(() => {
      idleTimeRef.current += 1;
      setIdleTime(idleTimeRef.current);
    }, IDLE_INCREMENT_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, []);
  
  // Report hover callback
  const reportHover = useCallback((
    tile: { x: number; y: number } | null,
    building?: CryptoBuildingDefinition | null
  ) => {
    setHoveredTile(tile);
    setHoveredBuilding(building ?? null);
  }, []);
  
  // Report action callback
  const reportAction = useCallback((action: PlayerAction) => {
    setActionStreak(prev => addActionToStreak(prev, action));
    setLastAction(action);
    
    // Reset idle time
    idleTimeRef.current = 0;
    setIdleTime(0);
  }, []);
  
  // Reset idle time callback
  const resetIdleTime = useCallback(() => {
    idleTimeRef.current = 0;
    setIdleTime(0);
  }, []);
  
  // Memoized context value
  const contextValue = useMemo<CobieContextValue>(() => ({
    hoveredTile,
    hoveredBuilding,
    selectedTool,
    idleTime,
    lastAction,
    actionStreak,
    treasuryTrend,
    recentEvents,
    reportHover,
    reportAction,
    resetIdleTime,
  }), [
    hoveredTile,
    hoveredBuilding,
    selectedTool,
    idleTime,
    lastAction,
    actionStreak,
    treasuryTrend,
    recentEvents,
    reportHover,
    reportAction,
    resetIdleTime,
  ]);
  
  return (
    <CobieContext.Provider value={contextValue}>
      {children}
    </CobieContext.Provider>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { CobieContext };
