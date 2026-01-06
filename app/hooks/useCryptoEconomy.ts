// =============================================================================
// USE CRYPTO ECONOMY HOOK
// =============================================================================
// React hook that manages the crypto economy simulation.
// Provides state, actions, and event handling for the crypto city economy.
//
// This hook:
// - Initializes the CryptoEconomyManager and CryptoEventManager
// - Runs the simulation tick loop
// - Provides economy state to components
// - Handles building registration/unregistration
// - Emits events for UI updates

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CryptoEconomyManager, 
  CryptoEventManager,
  createInitialEconomyState,
  PlacedCryptoBuilding,
} from '../simulation';
import { 
  CryptoEconomyState, 
  CryptoEvent, 
  CryptoEventType,
  GridCell,
  TileType,
} from '../components/game/types';
import { ALL_CRYPTO_BUILDINGS } from '../data/cryptoBuildings';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Return type of the useCryptoEconomy hook
 */
export interface UseCryptoEconomyReturn {
  // Economy state
  economyState: CryptoEconomyState;
  
  // Active events
  activeEvents: CryptoEvent[];
  eventHistory: CryptoEvent[];
  
  // Current tick
  currentTick: number;
  
  // Simulation control
  isPaused: boolean;
  tickSpeed: number;  // Ticks per second
  
  // Actions
  pause: () => void;
  resume: () => void;
  setTickSpeed: (speed: number) => void;
  manualTick: () => void;
  
  // Building management
  registerBuilding: (buildingId: string, gridX: number, gridY: number) => void;
  unregisterBuilding: (gridX: number, gridY: number) => void;
  syncBuildingsFromGrid: (grid: GridCell[][]) => void;
  
  // Event triggers (for testing/cheats)
  triggerEvent: (type: CryptoEventType) => void;
  
  // Callbacks for effects
  onYield: (callback: (building: PlacedCryptoBuilding, amount: number) => void) => void;
  onAirdrop: (callback: (amount: number, buildingId?: string) => void) => void;
  onEventStart: (callback: (event: CryptoEvent) => void) => void;
  onEventEnd: (callback: (event: CryptoEvent) => void) => void;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Default ticks per second (game speed)
 */
const DEFAULT_TICK_SPEED = 1;

/**
 * Minimum tick interval in milliseconds
 */
const MIN_TICK_INTERVAL = 100;

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useCryptoEconomy(): UseCryptoEconomyReturn {
  // ---------------------------------------------------------------------------
  // REFS (to persist across renders)
  // ---------------------------------------------------------------------------
  
  // Economy and event managers
  const economyManagerRef = useRef<CryptoEconomyManager | null>(null);
  const eventManagerRef = useRef<CryptoEventManager | null>(null);
  
  // Tick interval reference
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Callbacks for effects
  const onYieldCallbackRef = useRef<((building: PlacedCryptoBuilding, amount: number) => void) | null>(null);
  const onAirdropCallbackRef = useRef<((amount: number, buildingId?: string) => void) | null>(null);
  const onEventStartCallbackRef = useRef<((event: CryptoEvent) => void) | null>(null);
  const onEventEndCallbackRef = useRef<((event: CryptoEvent) => void) | null>(null);

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [economyState, setEconomyState] = useState<CryptoEconomyState>(
    createInitialEconomyState()
  );
  const [activeEvents, setActiveEvents] = useState<CryptoEvent[]>([]);
  const [eventHistory, setEventHistory] = useState<CryptoEvent[]>([]);
  const [currentTick, setCurrentTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tickSpeed, setTickSpeedState] = useState(DEFAULT_TICK_SPEED);

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    // Initialize managers on mount
    const economyManager = new CryptoEconomyManager();
    const eventManager = new CryptoEventManager(economyManager);
    
    economyManagerRef.current = economyManager;
    eventManagerRef.current = eventManager;
    
    // Set up event manager callbacks
    eventManager.onEventStarted((event) => {
      setActiveEvents(eventManager.getActiveEvents());
      setEventHistory(eventManager.getEventHistory());
      onEventStartCallbackRef.current?.(event);
    });
    
    eventManager.onEventEnded((event) => {
      setActiveEvents(eventManager.getActiveEvents());
      onEventEndCallbackRef.current?.(event);
    });
    
    eventManager.onAirdropReceived((amount, buildingId) => {
      onAirdropCallbackRef.current?.(amount, buildingId);
    });
    
    // Set up economy manager callbacks
    economyManager.onTreasuryChanged((newBalance, delta) => {
      setEconomyState(economyManager.getState());
    });
    
    return () => {
      // Cleanup
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // TICK LOOP
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!economyManagerRef.current || !eventManagerRef.current) return;
    
    // Clear existing interval
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    
    if (isPaused) return;
    
    // Calculate interval (ms per tick)
    const intervalMs = Math.max(MIN_TICK_INTERVAL, 1000 / tickSpeed);
    
    // Start tick loop
    tickIntervalRef.current = setInterval(() => {
      if (!economyManagerRef.current || !eventManagerRef.current) return;
      
      // Run economy tick
      const tickResult = economyManagerRef.current.tick();
      
      // Run event tick
      const eventResult = eventManagerRef.current.tick();
      
      // Update state
      setEconomyState(economyManagerRef.current.getState());
      setCurrentTick(economyManagerRef.current.getCurrentTick());
      
      // Notify about yield generation
      if (tickResult.yieldGenerated > 0 && onYieldCallbackRef.current) {
        for (const building of economyManagerRef.current.getPlacedBuildings()) {
          if (building.lastYield > 0) {
            onYieldCallbackRef.current(building, building.lastYield);
          }
        }
      }
      
    }, intervalMs);
    
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [isPaused, tickSpeed]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);
  
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);
  
  const setTickSpeed = useCallback((speed: number) => {
    setTickSpeedState(Math.max(0.1, Math.min(10, speed)));
  }, []);
  
  const manualTick = useCallback(() => {
    if (!economyManagerRef.current || !eventManagerRef.current) return;
    
    const tickResult = economyManagerRef.current.tick();
    const eventResult = eventManagerRef.current.tick();
    
    setEconomyState(economyManagerRef.current.getState());
    setCurrentTick(economyManagerRef.current.getCurrentTick());
    setActiveEvents(eventManagerRef.current.getActiveEvents());
    setEventHistory(eventManagerRef.current.getEventHistory());
  }, []);

  // ---------------------------------------------------------------------------
  // BUILDING MANAGEMENT
  // ---------------------------------------------------------------------------
  
  const registerBuilding = useCallback((
    buildingId: string, 
    gridX: number, 
    gridY: number
  ) => {
    if (!economyManagerRef.current) return;
    
    // Only register if it's a crypto building
    if (!ALL_CRYPTO_BUILDINGS[buildingId]) return;
    
    economyManagerRef.current.registerBuilding(buildingId, gridX, gridY);
    setEconomyState(economyManagerRef.current.getState());
  }, []);
  
  const unregisterBuilding = useCallback((gridX: number, gridY: number) => {
    if (!economyManagerRef.current) return;
    
    economyManagerRef.current.unregisterBuilding(gridX, gridY);
    setEconomyState(economyManagerRef.current.getState());
  }, []);
  
  /**
   * Sync placed buildings from the game grid
   * Call this when loading a save or after major grid changes
   */
  const syncBuildingsFromGrid = useCallback((grid: GridCell[][]) => {
    if (!economyManagerRef.current) return;
    
    // Clear existing buildings
    for (const building of economyManagerRef.current.getPlacedBuildings()) {
      economyManagerRef.current.unregisterBuilding(building.gridX, building.gridY);
    }
    
    // Scan grid for crypto buildings
    const registered = new Set<string>();
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        
        if (cell.type === TileType.Building && 
            cell.buildingId && 
            cell.isOrigin &&
            ALL_CRYPTO_BUILDINGS[cell.buildingId]) {
          
          const key = `${x},${y}`;
          if (!registered.has(key)) {
            economyManagerRef.current.registerBuilding(cell.buildingId, x, y);
            registered.add(key);
          }
        }
      }
    }
    
    setEconomyState(economyManagerRef.current.getState());
  }, []);

  // ---------------------------------------------------------------------------
  // EVENT TRIGGERS
  // ---------------------------------------------------------------------------
  
  const triggerEvent = useCallback((type: CryptoEventType) => {
    if (!eventManagerRef.current) return;
    
    eventManagerRef.current.triggerEvent(type);
    setActiveEvents(eventManagerRef.current.getActiveEvents());
    setEventHistory(eventManagerRef.current.getEventHistory());
  }, []);

  // ---------------------------------------------------------------------------
  // CALLBACK REGISTRATION
  // ---------------------------------------------------------------------------
  
  const onYield = useCallback((
    callback: (building: PlacedCryptoBuilding, amount: number) => void
  ) => {
    onYieldCallbackRef.current = callback;
  }, []);
  
  const onAirdrop = useCallback((
    callback: (amount: number, buildingId?: string) => void
  ) => {
    onAirdropCallbackRef.current = callback;
  }, []);
  
  const onEventStart = useCallback((callback: (event: CryptoEvent) => void) => {
    onEventStartCallbackRef.current = callback;
  }, []);
  
  const onEventEnd = useCallback((callback: (event: CryptoEvent) => void) => {
    onEventEndCallbackRef.current = callback;
  }, []);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  
  return {
    economyState,
    activeEvents,
    eventHistory,
    currentTick,
    isPaused,
    tickSpeed,
    pause,
    resume,
    setTickSpeed,
    manualTick,
    registerBuilding,
    unregisterBuilding,
    syncBuildingsFromGrid,
    triggerEvent,
    onYield,
    onAirdrop,
    onEventStart,
    onEventEnd,
  };
}

export default useCryptoEconomy;

