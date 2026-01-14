/**
 * Time Manager - Core time system for CryptoCity
 * 
 * Manages game time progression, speed controls, and time-based triggers.
 * Required for NPC schedules, market cycles, events, and day/night effects.
 * 
 * Issue #148: Add time system for schedules, events, and market cycles
 */

// =============================================================================
// TYPES
// =============================================================================

export type GameSpeed = 'paused' | 'normal' | 'fast' | 'ultra';

export interface GameTime {
  tick: number;         // Total ticks since game start
  hour: number;         // 0-23
  day: number;          // 1-31
  month: number;        // 1-12
  year: number;         // e.g., 2024
  dayOfWeek: number;    // 0-6 (Sunday = 0)
  speed: GameSpeed;
}

export type TimeOfDay = 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening' | 'dusk';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type MarketPhase = 'accumulation' | 'bull' | 'distribution' | 'bear';

export interface TimeEvent {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  callback: (time: GameTime) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Tick rates in milliseconds between simulation ticks
export const TICK_RATES: Record<GameSpeed, number> = {
  paused: Infinity,
  normal: 1000,    // 1 tick/sec - 1 tick = 1 game hour
  fast: 250,       // 4 ticks/sec
  ultra: 50,       // 20 ticks/sec
};

// Hours per game day
export const HOURS_PER_DAY = 24;

// Days per month (simplified, all months have 30 days)
export const DAYS_PER_MONTH = 30;

// Months per year
export const MONTHS_PER_YEAR = 12;

// Market cycle length in months (Bitcoin halving cycle)
export const MARKET_CYCLE_MONTHS = 48; // 4 years

// Starting time for new games
export const DEFAULT_START_TIME: GameTime = {
  tick: 0,
  hour: 8,        // Start at 8 AM
  day: 1,
  month: 3,       // March (start of bull run vibes)
  year: 2024,
  dayOfWeek: 1,   // Monday
  speed: 'normal',
};

// =============================================================================
// TIME UTILITIES
// =============================================================================

/**
 * Advance time by one tick (one hour)
 */
export function advanceTime(time: GameTime): GameTime {
  let { tick, hour, day, month, year, dayOfWeek, speed } = time;
  
  tick += 1;
  hour += 1;
  
  // Hour overflow -> new day
  if (hour >= HOURS_PER_DAY) {
    hour = 0;
    day += 1;
    dayOfWeek = (dayOfWeek + 1) % 7;
  }
  
  // Day overflow -> new month
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
  }
  
  // Month overflow -> new year
  if (month > MONTHS_PER_YEAR) {
    month = 1;
    year += 1;
  }
  
  return { tick, hour, day, month, year, dayOfWeek, speed };
}

/**
 * Get time of day category
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 0 && hour < 5) return 'night';
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 22) return 'dusk';
  return 'night';
}

/**
 * Get current season based on month
 */
export function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Get market phase based on 4-year cycle
 * Based on Bitcoin halving cycle theory
 */
export function getMarketPhase(year: number, month: number): MarketPhase {
  const totalMonths = year * 12 + month;
  const cyclePosition = totalMonths % MARKET_CYCLE_MONTHS;
  
  // Each phase is ~12 months
  if (cyclePosition < 12) return 'accumulation';  // Post-crash recovery
  if (cyclePosition < 24) return 'bull';          // The fun part
  if (cyclePosition < 36) return 'distribution';  // Top formation
  return 'bear';                                   // The not-fun part
}

/**
 * Get market phase multipliers for yields and growth
 */
export function getMarketMultipliers(phase: MarketPhase): { yield: number; growth: number; risk: number } {
  switch (phase) {
    case 'accumulation':
      return { yield: 0.5, growth: 0.8, risk: 0.7 };
    case 'bull':
      return { yield: 2.0, growth: 1.5, risk: 1.2 };
    case 'distribution':
      return { yield: 1.2, growth: 1.0, risk: 1.5 };
    case 'bear':
      return { yield: 0.3, growth: 0.5, risk: 2.0 };
  }
}

/**
 * Check if current time is rush hour
 */
export function isRushHour(hour: number): boolean {
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
}

/**
 * Check if current day is a weekend
 */
export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Get light level for day/night cycle (0 = dark, 1 = bright)
 */
export function getLightLevel(hour: number): number {
  // Smooth sine curve for natural day/night transition
  // Peak brightness at noon (hour 12), darkest at midnight (hour 0/24)
  const radians = ((hour - 6) / 24) * Math.PI * 2;
  const base = (Math.sin(radians) + 1) / 2;
  
  // Clamp and adjust for more natural feel
  return Math.max(0.15, Math.min(1, base * 1.2));
}

/**
 * Format time for display
 */
export function formatTime(time: GameTime): string {
  const hourStr = time.hour.toString().padStart(2, '0');
  return `${hourStr}:00`;
}

/**
 * Format date for display
 */
export function formatDate(time: GameTime): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[time.month - 1]} ${time.day}, ${time.year}`;
}

/**
 * Format full datetime for display
 */
export function formatDateTime(time: GameTime): string {
  return `${formatDate(time)} ${formatTime(time)}`;
}

/**
 * Get time-of-day greeting
 */
export function getGreeting(hour: number): string {
  const timeOfDay = getTimeOfDay(hour);
  switch (timeOfDay) {
    case 'night':
    case 'dawn':
      return 'Good night';
    case 'morning':
      return 'Good morning';
    case 'afternoon':
      return 'Good afternoon';
    case 'evening':
    case 'dusk':
      return 'Good evening';
  }
}

/**
 * Calculate hours until a target hour
 */
export function hoursUntil(currentHour: number, targetHour: number): number {
  if (targetHour > currentHour) {
    return targetHour - currentHour;
  }
  return HOURS_PER_DAY - currentHour + targetHour;
}

/**
 * Serialize time for storage
 */
export function serializeTime(time: GameTime): string {
  return JSON.stringify(time);
}

/**
 * Deserialize time from storage
 */
export function deserializeTime(data: string): GameTime {
  try {
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_START_TIME,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_START_TIME };
  }
}

// =============================================================================
// TIME MANAGER CLASS
// =============================================================================

type TimeCallback = (time: GameTime, event: string) => void;

export class TimeManager {
  private time: GameTime;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callbacks: Map<string, TimeCallback[]> = new Map();
  private lastHour = -1;
  private lastDay = -1;
  private lastMonth = -1;
  private lastYear = -1;

  constructor(initialTime?: Partial<GameTime>) {
    this.time = { ...DEFAULT_START_TIME, ...initialTime };
  }

  /**
   * Get current game time
   */
  getTime(): GameTime {
    return { ...this.time };
  }

  /**
   * Set game speed
   */
  setSpeed(speed: GameSpeed): void {
    this.time.speed = speed;
    this.restartInterval();
  }

  /**
   * Start the time loop
   */
  start(): void {
    if (this.intervalId) return;
    this.restartInterval();
  }

  /**
   * Stop the time loop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Advance time by one tick manually
   */
  tick(): GameTime {
    const prevTime = this.time;
    this.time = advanceTime(this.time);
    this.checkTriggers(prevTime);
    return this.time;
  }

  /**
   * Register a callback for time events
   */
  on(event: 'tick' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly', callback: TimeCallback): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Set time directly (for loading saves)
   */
  setTime(time: Partial<GameTime>): void {
    this.time = { ...this.time, ...time };
    this.lastHour = this.time.hour;
    this.lastDay = this.time.day;
    this.lastMonth = this.time.month;
    this.lastYear = this.time.year;
  }

  private restartInterval(): void {
    this.stop();
    
    const rate = TICK_RATES[this.time.speed];
    if (rate === Infinity) return; // Paused
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, rate);
  }

  private checkTriggers(prevTime: GameTime): void {
    // Always emit tick
    this.emit('tick');
    
    // Hour changed
    if (this.time.hour !== this.lastHour) {
      this.emit('hourly');
      this.lastHour = this.time.hour;
    }
    
    // Day changed
    if (this.time.day !== this.lastDay) {
      this.emit('daily');
      this.lastDay = this.time.day;
      
      // Check for weekly (Monday = 1)
      if (this.time.dayOfWeek === 1) {
        this.emit('weekly');
      }
    }
    
    // Month changed
    if (this.time.month !== this.lastMonth) {
      this.emit('monthly');
      this.lastMonth = this.time.month;
    }
    
    // Year changed
    if (this.time.year !== this.lastYear) {
      this.emit('yearly');
      this.lastYear = this.time.year;
    }
  }

  private emit(event: string): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(this.time, event);
        } catch (error) {
          console.error(`Time event '${event}' callback error:`, error);
        }
      }
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let timeManagerInstance: TimeManager | null = null;

export function getTimeManager(initialTime?: Partial<GameTime>): TimeManager {
  if (!timeManagerInstance) {
    timeManagerInstance = new TimeManager(initialTime);
  }
  return timeManagerInstance;
}

export function resetTimeManager(): void {
  if (timeManagerInstance) {
    timeManagerInstance.stop();
  }
  timeManagerInstance = null;
}
