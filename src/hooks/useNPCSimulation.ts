/**
 * useNPCSimulation - React Hook for NPC Simulation
 *
 * Provides React integration for the NPC simulation engine.
 * Manages simulation lifecycle and provides state updates to components.
 *
 * Features:
 * - Automatic start/stop on component mount/unmount
 * - State updates via React state
 * - Camera position sync for LOD
 * - Event subscriptions
 *
 * Usage:
 *   const { state, isRunning, startSimulation, stopSimulation } = useNPCSimulation({
 *     autoStart: true,
 *     onTick: (state) => console.log('Tick:', state.tickCount),
 *   });
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  NPCSimulation,
  SimulationConfig,
  SimulationState,
  NPCEvent,
  NPCLODLevel,
  DEFAULT_SIMULATION_CONFIG,
} from '@/lib/npc/NPCSimulation';
import { NPCManager } from '@/lib/npc/NPCManager';
import type { CryptoNPC } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useNPCSimulation hook
 */
export interface UseNPCSimulationOptions {
  /** Partial config to override defaults */
  config?: Partial<SimulationConfig>;
  /** Whether to auto-start on mount */
  autoStart?: boolean;
  /** Callback for each tick */
  onTick?: (state: SimulationState) => void;
  /** Callback for day changes */
  onDayChange?: (day: number) => void;
  /** Callback for NPC events */
  onNPCEvent?: (event: NPCEvent) => void;
  /** Initial camera position for LOD calculations */
  initialCameraPosition?: { x: number; y: number };
}

/**
 * Return type for the useNPCSimulation hook
 */
export interface UseNPCSimulationReturn {
  /** Current simulation state */
  state: SimulationState;
  /** Whether simulation is running */
  isRunning: boolean;
  /** Current game hour (0-23) */
  gameHour: number;
  /** Current game minute (0-59) */
  gameMinute: number;
  /** Whether it's working hours */
  isWorkingHours: boolean;
  /** Whether it's daytime */
  isDaytime: boolean;
  /** All NPCs in the simulation */
  npcs: CryptoNPC[];
  /** NPC count */
  npcCount: number;
  /** Start the simulation */
  startSimulation: () => void;
  /** Stop the simulation */
  stopSimulation: () => void;
  /** Pause the simulation */
  pauseSimulation: () => void;
  /** Resume a paused simulation */
  resumeSimulation: () => void;
  /** Update camera position for LOD */
  setCameraPosition: (position: { x: number; y: number }) => void;
  /** Get nearby NPCs to a position */
  getNearbyNPCs: (npc: CryptoNPC, maxDistance: number) => CryptoNPC[];
  /** Calculate LOD for an NPC */
  calculateLOD: (npc: CryptoNPC) => NPCLODLevel;
  /** Set game time (for debugging) */
  setGameTime: (minutes: number) => void;
  /** Get the simulation instance (for advanced usage) */
  getSimulation: () => NPCSimulation;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for managing the NPC simulation
 */
// Helper to get initial state without accessing ref during render
function getInitialSimulationState(config: Partial<SimulationConfig>): SimulationState {
  // Create a temporary simulation just to get initial state structure
  const temp = new NPCSimulation(config);
  return temp.getState();
}

export function useNPCSimulation(
  options: UseNPCSimulationOptions = {}
): UseNPCSimulationReturn {
  const {
    config = {},
    autoStart = false,
    onTick,
    onDayChange,
    onNPCEvent,
    initialCameraPosition = { x: 0, y: 0 },
  } = options;

  // State for React reactivity - initialize with default state
  const [state, setState] = useState<SimulationState>(() => getInitialSimulationState(config));
  const [npcs, setNPCs] = useState<CryptoNPC[]>([]);
  const [cameraPosition, setCameraPositionState] = useState(initialCameraPosition);
  
  // Use ref for simulation instance since it's mutable and shouldn't trigger re-renders
  const simulationRef = useRef<NPCSimulation | null>(null);
  
  // Initialize simulation lazily on first access (only in effects/callbacks, not during render)
  const getOrCreateSimulation = useCallback(() => {
    if (!simulationRef.current) {
      simulationRef.current = new NPCSimulation(config);
      simulationRef.current.setCameraPosition(initialCameraPosition);
    }
    return simulationRef.current;
  }, [config, initialCameraPosition]);

  // Convenience getter for use in returned object
  // This is a lazy singleton pattern - simulation is only created once and reused
  // eslint-disable-next-line react-hooks/refs
  const simulation = getOrCreateSimulation();

  // Set up event callbacks
  useEffect(() => {
    const sim = getOrCreateSimulation();
    
    // Wrap tick callback to update React state
    sim.onTick = (newState: SimulationState) => {
      setState({ ...newState });
      setNPCs(NPCManager.getAllNPCs());
      onTick?.(newState);
    };

    sim.onDayChange = (day: number) => {
      onDayChange?.(day);
    };

    sim.onNPCEvent = (event: NPCEvent) => {
      onNPCEvent?.(event);
    };

    // Initialize NPC list
    setNPCs(NPCManager.getAllNPCs());

    return () => {
      sim.onTick = null;
      sim.onDayChange = null;
      sim.onNPCEvent = null;
    };
  }, [getOrCreateSimulation, onTick, onDayChange, onNPCEvent]);

  // Auto-start on mount if enabled
  useEffect(() => {
    if (autoStart) {
      simulation.start();
      setState(simulation.getState());
    }

    return () => {
      // Stop simulation on unmount
      simulation.stop();
    };
  }, [simulation, autoStart]);

  // Lifecycle methods
  const startSimulation = useCallback(() => {
    simulation.start();
    setState(simulation.getState());
  }, [simulation]);

  const stopSimulation = useCallback(() => {
    simulation.stop();
    setState(simulation.getState());
  }, [simulation]);

  const pauseSimulation = useCallback(() => {
    simulation.pause();
    setState(simulation.getState());
  }, [simulation]);

  const resumeSimulation = useCallback(() => {
    simulation.resume();
    setState(simulation.getState());
  }, [simulation]);

  // Camera position
  const setCameraPosition = useCallback((position: { x: number; y: number }) => {
    simulation.setCameraPosition(position);
    setCameraPositionState(position);
  }, [simulation]);

  // Helper methods
  const getNearbyNPCs = useCallback((npc: CryptoNPC, maxDistance: number) => {
    return simulation.getNearbyNPCs(npc, maxDistance);
  }, [simulation]);

  const calculateLOD = useCallback((npc: CryptoNPC) => {
    return simulation.calculateLOD(npc, cameraPosition);
  }, [simulation, cameraPosition]);

  const setGameTime = useCallback((minutes: number) => {
    simulation.setGameTime(minutes);
    setState(simulation.getState());
  }, [simulation]);

  const getSimulation = useCallback(() => {
    return simulation;
  }, [simulation]);

  // Computed values derived from state (not from ref during render)
  const gameHour = Math.floor(state.currentGameTime / 60) % 24;
  const gameMinute = state.currentGameTime % 60;
  const isWorkingHours = gameHour >= 9 && gameHour < 17;
  const isDaytime = gameHour >= 6 && gameHour < 20;

  return {
    state,
    isRunning: state.isRunning,
    gameHour,
    gameMinute,
    isWorkingHours,
    isDaytime,
    npcs,
    npcCount: npcs.length,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    setCameraPosition,
    getNearbyNPCs,
    calculateLOD,
    setGameTime,
    getSimulation,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Hook to get just the simulation time
 */
export function useSimulationTime() {
  const { gameHour, gameMinute, isWorkingHours, isDaytime } = useNPCSimulation();

  return {
    gameHour,
    gameMinute,
    isWorkingHours,
    isDaytime,
    formattedTime: `${gameHour.toString().padStart(2, '0')}:${gameMinute.toString().padStart(2, '0')}`,
  };
}

/**
 * Hook to track a specific NPC
 */
export function useNPCTracking(npcId: string | null) {
  // Initialize state with callback to avoid render-time side effects
  const [npc, setNPC] = useState<CryptoNPC | null>(() => {
    if (!npcId) return null;
    return NPCManager.getNPC(npcId) || null;
  });

  // Use effect for polling updates
  useEffect(() => {
    if (!npcId) {
      return;
    }

    // Poll for updates (simplified - in production use simulation events)
    // Initial value is set via useState initializer
    const interval = setInterval(() => {
      const updated = NPCManager.getNPC(npcId);
      setNPC(updated || null);
    }, 100);

    return () => clearInterval(interval);
  }, [npcId]);

  // Return null if npcId is null, otherwise return current npc state
  return npcId ? npc : null;
}

/**
 * Hook for NPC list with filtering
 */
export function useNPCList(filter?: {
  occupation?: string;
  activity?: string;
  nearPosition?: { x: number; y: number; maxDistance: number };
}) {
  const { npcs } = useNPCSimulation();

  let filtered = npcs;

  if (filter?.occupation) {
    filtered = filtered.filter((npc) => npc.occupation === filter.occupation);
  }

  if (filter?.activity) {
    filtered = filtered.filter((npc) => npc.currentActivity === filter.activity);
  }

  if (filter?.nearPosition) {
    const { x, y, maxDistance } = filter.nearPosition;
    filtered = filtered.filter((npc) => {
      const distance = Math.sqrt(
        Math.pow(npc.gridX - x, 2) + Math.pow(npc.gridY - y, 2)
      );
      return distance <= maxDistance;
    });
  }

  return filtered;
}

export default useNPCSimulation;
