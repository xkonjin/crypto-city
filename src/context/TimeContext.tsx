/**
 * Time Context - React integration for game time system
 * 
 * Provides game time state and controls to React components.
 * Wraps the TimeManager singleton for React lifecycle management.
 * 
 * Issue #148: Add time system for schedules, events, and market cycles
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  GameTime,
  GameSpeed,
  TimeManager,
  getTimeManager,
  resetTimeManager,
  DEFAULT_START_TIME,
  getTimeOfDay,
  getSeason,
  getMarketPhase,
  getMarketMultipliers,
  isRushHour,
  isWeekend,
  getLightLevel,
  formatTime,
  formatDate,
  formatDateTime,
  TimeOfDay,
  Season,
  MarketPhase,
} from '@/lib/time/TimeManager';

// =============================================================================
// TYPES
// =============================================================================

interface TimeContextValue {
  // Current time state
  time: GameTime;
  
  // Derived values
  timeOfDay: TimeOfDay;
  season: Season;
  marketPhase: MarketPhase;
  marketMultipliers: { yield: number; growth: number; risk: number };
  isRushHour: boolean;
  isWeekend: boolean;
  lightLevel: number;
  
  // Formatted strings
  formattedTime: string;
  formattedDate: string;
  formattedDateTime: string;
  
  // Controls
  setSpeed: (speed: GameSpeed) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  
  // Event subscriptions
  onTick: (callback: () => void) => () => void;
  onHourly: (callback: () => void) => () => void;
  onDaily: (callback: () => void) => () => void;
  onWeekly: (callback: () => void) => () => void;
  onMonthly: (callback: () => void) => () => void;
  onYearly: (callback: () => void) => () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const TimeContext = createContext<TimeContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface TimeProviderProps {
  children: React.ReactNode;
  initialTime?: Partial<GameTime>;
  autoStart?: boolean;
}

export function TimeProvider({ 
  children, 
  initialTime,
  autoStart = true,
}: TimeProviderProps) {
  const [time, setTime] = useState<GameTime>(() => ({
    ...DEFAULT_START_TIME,
    ...initialTime,
  }));
  
  const managerRef = useRef<TimeManager | null>(null);
  const previousSpeedRef = useRef<GameSpeed>('normal');
  
  // Initialize TimeManager
  useEffect(() => {
    managerRef.current = getTimeManager(initialTime);
    
    // Subscribe to tick events
    const unsubscribe = managerRef.current.on('tick', (newTime) => {
      setTime({ ...newTime });
    });
    
    // Auto-start if configured
    if (autoStart) {
      managerRef.current.start();
    }
    
    // Cleanup
    return () => {
      unsubscribe();
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Speed control
  const setSpeed = useCallback((speed: GameSpeed) => {
    if (managerRef.current) {
      previousSpeedRef.current = speed === 'paused' ? previousSpeedRef.current : speed;
      managerRef.current.setSpeed(speed);
      setTime(prev => ({ ...prev, speed }));
    }
  }, []);
  
  const pause = useCallback(() => {
    setSpeed('paused');
  }, [setSpeed]);
  
  const resume = useCallback(() => {
    setSpeed(previousSpeedRef.current);
  }, [setSpeed]);
  
  const togglePause = useCallback(() => {
    if (time.speed === 'paused') {
      resume();
    } else {
      pause();
    }
  }, [time.speed, pause, resume]);
  
  // Event subscription helpers
  const createEventSubscriber = useCallback((event: 'tick' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    return (callback: () => void) => {
      if (managerRef.current) {
        return managerRef.current.on(event, callback);
      }
      return () => {};
    };
  }, []);
  
  // Compute derived values
  const timeOfDay = getTimeOfDay(time.hour);
  const season = getSeason(time.month);
  const marketPhase = getMarketPhase(time.year, time.month);
  const marketMultipliers = getMarketMultipliers(marketPhase);
  const rushHour = isRushHour(time.hour);
  const weekend = isWeekend(time.dayOfWeek);
  const lightLevel = getLightLevel(time.hour);
  
  const value: TimeContextValue = {
    time,
    timeOfDay,
    season,
    marketPhase,
    marketMultipliers,
    isRushHour: rushHour,
    isWeekend: weekend,
    lightLevel,
    formattedTime: formatTime(time),
    formattedDate: formatDate(time),
    formattedDateTime: formatDateTime(time),
    setSpeed,
    pause,
    resume,
    togglePause,
    onTick: createEventSubscriber('tick'),
    onHourly: createEventSubscriber('hourly'),
    onDaily: createEventSubscriber('daily'),
    onWeekly: createEventSubscriber('weekly'),
    onMonthly: createEventSubscriber('monthly'),
    onYearly: createEventSubscriber('yearly'),
  };
  
  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTime(): TimeContextValue {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook that triggers on hourly ticks
 */
export function useHourlyEffect(callback: () => void, deps: React.DependencyList = []) {
  const { onHourly } = useTime();
  
  useEffect(() => {
    return onHourly(callback);
  }, [onHourly, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook that triggers on daily ticks
 */
export function useDailyEffect(callback: () => void, deps: React.DependencyList = []) {
  const { onDaily } = useTime();
  
  useEffect(() => {
    return onDaily(callback);
  }, [onDaily, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook that triggers on weekly ticks
 */
export function useWeeklyEffect(callback: () => void, deps: React.DependencyList = []) {
  const { onWeekly } = useTime();
  
  useEffect(() => {
    return onWeekly(callback);
  }, [onWeekly, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook that triggers on monthly ticks
 */
export function useMonthlyEffect(callback: () => void, deps: React.DependencyList = []) {
  const { onMonthly } = useTime();
  
  useEffect(() => {
    return onMonthly(callback);
  }, [onMonthly, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook for market cycle awareness
 */
export function useMarketCycle() {
  const { marketPhase, marketMultipliers } = useTime();
  
  return {
    phase: marketPhase,
    multipliers: marketMultipliers,
    isBullish: marketPhase === 'bull',
    isBearish: marketPhase === 'bear',
    isAccumulating: marketPhase === 'accumulation',
    isDistributing: marketPhase === 'distribution',
  };
}

/**
 * Hook for day/night cycle
 */
export function useDayNightCycle() {
  const { timeOfDay, lightLevel, time } = useTime();
  
  return {
    timeOfDay,
    lightLevel,
    hour: time.hour,
    isNight: timeOfDay === 'night',
    isDawn: timeOfDay === 'dawn',
    isMorning: timeOfDay === 'morning',
    isAfternoon: timeOfDay === 'afternoon',
    isEvening: timeOfDay === 'evening',
    isDusk: timeOfDay === 'dusk',
    isDaytime: ['morning', 'afternoon'].includes(timeOfDay),
  };
}
