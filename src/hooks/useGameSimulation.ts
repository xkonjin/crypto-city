/**
 * Game Simulation Hook
 * Issue #227: Refactor Monolithic Components
 * 
 * Extracted from GameContext.tsx to separate simulation logic
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export type GameSpeed = 0 | 1 | 2 | 3;

export interface SimulationState {
  speed: GameSpeed;
  isPaused: boolean;
  currentDay: number;
  currentTime: number;
  tickCount: number;
}

export function useGameSimulation(initialSpeed: GameSpeed = 1) {
  const [speed, setSpeed] = useState<GameSpeed>(initialSpeed);
  const [isPaused, setIsPaused] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  
  const animationFrameRef = useRef<number>();
  const lastTickRef = useRef<number>(Date.now());
  
  const pause = useCallback(() => {
    setIsPaused(true);
    setSpeed(0);
  }, []);
  
  const resume = useCallback(() => {
    setIsPaused(false);
    setSpeed(1);
  }, []);
  
  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);
  
  const advanceDay = useCallback(() => {
    setCurrentDay(prev => prev + 1);
    setCurrentTime(0);
  }, []);
  
  const advanceTime = useCallback((deltaMs: number) => {
    setCurrentTime(prev => {
      const newTime = prev + deltaMs;
      if (newTime >= 86400000) { // 24 hours in ms
        advanceDay();
        return newTime - 86400000;
      }
      return newTime;
    });
  }, [advanceDay]);
  
  const tick = useCallback(() => {
    if (speed === 0) return;
    
    const now = Date.now();
    const deltaMs = now - lastTickRef.current;
    lastTickRef.current = now;
    
    // Speed multipliers: 1x, 2x, 4x
    const speedMultiplier = speed === 1 ? 1 : speed === 2 ? 2 : 4;
    const adjustedDelta = deltaMs * speedMultiplier;
    
    advanceTime(adjustedDelta);
    setTickCount(prev => prev + 1);
  }, [speed, advanceTime]);
  
  // Simulation loop
  useEffect(() => {
    if (speed === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    
    const loop = () => {
      tick();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    
    animationFrameRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed, tick]);
  
  const reset = useCallback(() => {
    setSpeed(1);
    setIsPaused(false);
    setCurrentDay(1);
    setCurrentTime(0);
    setTickCount(0);
  }, []);
  
  return {
    speed,
    isPaused,
    currentDay,
    currentTime,
    tickCount,
    setSpeed,
    pause,
    resume,
    togglePause,
    advanceDay,
    reset,
  };
}
