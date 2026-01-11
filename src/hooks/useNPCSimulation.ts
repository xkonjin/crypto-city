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

  // Create simulation instance (memoized)
  const simulationRef = useRef<NPCSimulation | null>(null);

  // Initialize simulation on first render
  if (!simulationRef.current) {
    simulationRef.current = new NPCSimulation(config);
    simulationRef.current.setCameraPosition(initialCameraPosition);
  }

  // State for React reactivity
  const [state, setState] = useState<SimulationState>(() =>
    simulationRef.current!.getState()
  );
  const [npcs, setNPCs] = useState<CryptoNPC[]>([]);
  const [cameraPosition, setCameraPositionState] = useState(initialCameraPosition);

  // Set up event callbacks
  useEffect(() => {
    const simulation = simulationRef.current!;

    // Wrap tick callback to update React state
    simulation.onTick = (newState: SimulationState) => {
      setState({ ...newState });
      setNPCs(NPCManager.getAllNPCs());
      onTick?.(newState);
    };

    simulation.onDayChange = (day: number) => {
      onDayChange?.(day);
    };

    simulation.onNPCEvent = (event: NPCEvent) => {
      onNPCEvent?.(event);
    };

    // Initialize NPC list
    setNPCs(NPCManager.getAllNPCs());

    return () => {
      simulation.onTick = null;
      simulation.onDayChange = null;
      simulation.onNPCEvent = null;
    };
  }, [onTick, onDayChange, onNPCEvent]);

  // Auto-start on mount if enabled
  useEffect(() => {
    if (autoStart) {
      simulationRef.current!.start();
      setState(simulationRef.current!.getState());
    }

    return () => {
      // Stop simulation on unmount
      simulationRef.current?.stop();
    };
  }, [autoStart]);

  // Lifecycle methods
  const startSimulation = useCallback(() => {
    simulationRef.current!.start();
    setState(simulationRef.current!.getState());
  }, []);

  const stopSimulation = useCallback(() => {
    simulationRef.current!.stop();
    setState(simulationRef.current!.getState());
  }, []);

  const pauseSimulation = useCallback(() => {
    simulationRef.current!.pause();
    setState(simulationRef.current!.getState());
  }, []);

  const resumeSimulation = useCallback(() => {
    simulationRef.current!.resume();
    setState(simulationRef.current!.getState());
  }, []);

  // Camera position
  const setCameraPosition = useCallback((position: { x: number; y: number }) => {
    simulationRef.current!.setCameraPosition(position);
    setCameraPositionState(position);
  }, []);

  // Helper methods
  const getNearbyNPCs = useCallback((npc: CryptoNPC, maxDistance: number) => {
    return simulationRef.current!.getNearbyNPCs(npc, maxDistance);
  }, []);

  const calculateLOD = useCallback((npc: CryptoNPC) => {
    return simulationRef.current!.calculateLOD(npc, cameraPosition);
  }, [cameraPosition]);

  const setGameTime = useCallback((minutes: number) => {
    simulationRef.current!.setGameTime(minutes);
    setState(simulationRef.current!.getState());
  }, []);

  const getSimulation = useCallback(() => {
    return simulationRef.current!;
  }, []);

  // Computed values
  const simulation = simulationRef.current!;

  return {
    state,
    isRunning: state.isRunning,
    gameHour: simulation.getGameHour(),
    gameMinute: simulation.getGameMinute(),
    isWorkingHours: simulation.isWorkingHours(),
    isDaytime: simulation.isDaytime(),
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
  const [npc, setNPC] = useState<CryptoNPC | null>(null);

  useEffect(() => {
    if (!npcId) {
      setNPC(null);
      return;
    }

    // Initial fetch
    const fetchedNPC = NPCManager.getNPC(npcId);
    setNPC(fetchedNPC || null);

    // Poll for updates (simplified - in production use simulation events)
    const interval = setInterval(() => {
      const updated = NPCManager.getNPC(npcId);
      if (updated) {
        setNPC({ ...updated }); // Spread to trigger re-render
      }
    }, 100);

    return () => clearInterval(interval);
  }, [npcId]);

  return npc;
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
