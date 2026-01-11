/**
 * SimulationContext - Simulation-related state management
 * 
 * Manages:
 * - Simulation speed
 * - Tick management
 * - Day/time tracking (hour, day, month, year)
 * - Pause/resume
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export interface SimulationState {
  speed: 0 | 1 | 2 | 3;
  hour: number;
  day: number;
  month: number;
  year: number;
  tick: number;
}

export interface SimulationContextValue {
  // State
  speed: 0 | 1 | 2 | 3;
  hour: number;
  day: number;
  month: number;
  year: number;
  tick: number;
  
  // Actions
  setSpeed: (speed: 0 | 1 | 2 | 3) => void;
  pause: () => void;
  resume: (prevSpeed?: 0 | 1 | 2 | 3) => void;
  
  // State update (used by GameContext orchestrator)
  updateSimulationState: (state: Partial<SimulationState>) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

const DEFAULT_SIMULATION_STATE: SimulationState = {
  speed: 1,
  hour: 12,
  day: 1,
  month: 1,
  year: 2024,
  tick: 0,
};

export function SimulationProvider({ 
  children,
  initialState = DEFAULT_SIMULATION_STATE 
}: { 
  children: React.ReactNode;
  initialState?: Partial<SimulationState>;
}) {
  const [state, setState] = useState<SimulationState>({
    ...DEFAULT_SIMULATION_STATE,
    ...initialState,
  });
  const [prevSpeed, setPrevSpeed] = useState<0 | 1 | 2 | 3>(1);

  const setSpeed = useCallback((speed: 0 | 1 | 2 | 3) => {
    setState((prev) => {
      if (prev.speed !== 0 && speed === 0) {
        // Pausing - store previous speed
        setPrevSpeed(prev.speed);
      }
      return { ...prev, speed };
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.speed !== 0) {
        setPrevSpeed(prev.speed);
      }
      return { ...prev, speed: 0 };
    });
  }, []);

  const resume = useCallback((speedOverride?: 0 | 1 | 2 | 3) => {
    setState((prev) => ({
      ...prev,
      speed: speedOverride !== undefined ? speedOverride : prevSpeed,
    }));
  }, [prevSpeed]);

  const updateSimulationState = useCallback((updates: Partial<SimulationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const value: SimulationContextValue = {
    speed: state.speed,
    hour: state.hour,
    day: state.day,
    month: state.month,
    year: state.year,
    tick: state.tick,
    setSpeed,
    pause,
    resume,
    updateSimulationState,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return ctx;
}

export { SimulationContext };
