/**
 * AI Controller Hook
 * 
 * Enables autonomous control of the city with:
 * - City AI for building/zoning decisions
 * - NPC simulation with thoughts and economy
 * - Disaster management
 * - Real-time statistics
 */

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { getCityAIManager } from '@/lib/cityAI';
import { playerDisasterManager } from '@/lib/disasters/DisasterManager';

interface AIControllerState {
  isActive: boolean;
  cityAIEnabled: boolean;
  simulationSpeed: 0 | 1 | 2 | 3;
  tickCount: number;
  npcCount: number;
  activeDisasters: number;
  lastAction: string | null;
  stats: {
    population: number;
    jobs: number;
    money: number;
    happiness: number;
  };
}

interface AIControllerActions {
  enableAI: () => void;
  disableAI: () => void;
  setSpeed: (speed: 0 | 1 | 2 | 3) => void;
  triggerDisaster: (type: string) => void;
  loadOptimalCity: () => void;
  getStatus: () => AIControllerState;
}

export function useAIController(): [AIControllerState, AIControllerActions] {
  const { 
    state, 
    setSpeed, 
    toggleCityAI, 
    cityAIEnabled,
    loadState,
  } = useGame();
  
  const [controllerState, setControllerState] = useState<AIControllerState>({
    isActive: false,
    cityAIEnabled: false,
    simulationSpeed: 1,
    tickCount: 0,
    npcCount: 0,
    activeDisasters: 0,
    lastAction: null,
    stats: {
      population: 0,
      jobs: 0,
      money: 0,
      happiness: 0,
    },
  });
  
  const tickCountRef = useRef(0);
  
  // Update state from game using useMemo for derived state
  const derivedState = useMemo(() => ({
    cityAIEnabled,
    simulationSpeed: state.speed,
    tickCount: state.tick,
    activeDisasters: playerDisasterManager.getActiveDisasters().length,
    stats: {
      population: state.stats.population,
      jobs: state.stats.jobs,
      money: state.stats.money,
      happiness: state.stats.happiness,
    },
  }), [state, cityAIEnabled]);
  
  // Sync derived state to controller state
  useEffect(() => {
    tickCountRef.current = derivedState.tickCount;
  }, [derivedState.tickCount]);
  
  const enableAI = useCallback(() => {
    if (!cityAIEnabled) {
      toggleCityAI();
    }
    setControllerState(prev => ({
      ...prev,
      isActive: true,
      lastAction: 'AI enabled',
    }));
  }, [cityAIEnabled, toggleCityAI]);
  
  const disableAI = useCallback(() => {
    if (cityAIEnabled) {
      toggleCityAI();
    }
    setControllerState(prev => ({
      ...prev,
      isActive: false,
      lastAction: 'AI disabled',
    }));
  }, [cityAIEnabled, toggleCityAI]);
  
  const handleSetSpeed = useCallback((speed: 0 | 1 | 2 | 3) => {
    setSpeed(speed);
    setControllerState(prev => ({
      ...prev,
      simulationSpeed: speed,
      lastAction: `Speed set to ${speed}`,
    }));
  }, [setSpeed]);
  
  const triggerDisaster = useCallback((type: string) => {
    try {
      playerDisasterManager.triggerDisaster({
        disasterId: type as 'market_crash' | 'rug_pull' | 'fire' | 'earthquake' | 'whale_dump' | 'fifty_one_attack' | 'sec_raid',
        triggerAddress: '0x0' as `0x${string}`,
      });
      setControllerState(prev => ({
        ...prev,
        lastAction: `Triggered disaster: ${type}`,
      }));
    } catch (error) {
      console.error('Failed to trigger disaster:', error);
    }
  }, []);
  
  const loadOptimalCity = useCallback(async () => {
    try {
      const response = await fetch('/optimal-city-save.json');
      const cityData = await response.json();
      const success = loadState(JSON.stringify(cityData));
      
      if (success) {
        setControllerState(prev => ({
          ...prev,
          lastAction: 'Loaded optimal city',
        }));
      }
    } catch (error) {
      console.error('Failed to load optimal city:', error);
    }
  }, [loadState]);
  
  const getStatus = useCallback(() => ({
    ...controllerState,
    ...derivedState,
  }), [controllerState, derivedState]);
  
  // Create final state combining static and derived
  const finalState = useMemo(() => ({
    ...controllerState,
    ...derivedState,
  }), [controllerState, derivedState]);
  
  return [
    finalState,
    {
      enableAI,
      disableAI,
      setSpeed: handleSetSpeed,
      triggerDisaster,
      loadOptimalCity,
      getStatus,
    },
  ];
}

// Expose controller globally for browser console access
if (typeof window !== 'undefined') {
  (window as unknown as { cryptoCityAI?: unknown }).cryptoCityAI = {
    help: () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║           CRYPTO CITY AI CONTROLLER - HELP                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Available commands (run in browser console):                 ║
║                                                               ║
║  cryptoCityAI.status()           - Get current city status    ║
║  cryptoCityAI.enableAI()         - Enable City AI             ║
║  cryptoCityAI.disableAI()        - Disable City AI            ║
║  cryptoCityAI.setSpeed(n)        - Set speed (0-3)            ║
║  cryptoCityAI.disaster(type)     - Trigger disaster           ║
║  cryptoCityAI.loadCity()         - Load optimal city          ║
║                                                               ║
║  Disaster types:                                              ║
║    market_crash, rug_pull, fire, earthquake,                  ║
║    whale_dump, fifty_one_attack, sec_raid                     ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
      `);
    },
  };
}
