/**
 * Engagement Hooks System (Issue #59)
 * 
 * Implements "one more day" hooks like Civilization or RCT:
 * - End-of-day summary with stats comparison
 * - Daily goals with rewards
 * - Streak bonuses for consecutive play
 * - Cliffhanger events to tease tomorrow
 */

import type { GameState } from '@/types/game';

// ============================================
// TYPES
// ============================================

export interface DaySummary {
  day: number;
  treasuryChange: number;
  tvlChange: number;
  buildingsPlaced: number;
  buildingsLost: number;
  totalYield: number;
  achievements: string[];
  coinsEarned: number;  // For prestige system
}

export interface DailyGoal {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: number;       // Treasury bonus
  expiresAt: number;    // End of game day (timestamp)
  completed: boolean;
  icon: string;
}

export interface EngagementStreak {
  currentStreak: number;
  lastPlayDate: string;  // YYYY-MM-DD format
  highestStreak: number;
  streakBonus: number;   // Current bonus multiplier (0 to 0.25)
}

export interface CliffhangerEvent {
  type: CliffhangerType;
  message: string;
  scheduledDay: number;
  icon: string;
  resolved: boolean;
}

export type CliffhangerType = 
  | 'whale_incoming'
  | 'storm_clouds'
  | 'regulatory_whispers'
  | 'airdrop_rumor'
  | 'bull_run'
  | 'bear_trap';

// ============================================
// CONSTANTS
// ============================================

// Streak bonus thresholds (streak days -> yield multiplier bonus)
export const STREAK_BONUSES: Record<number, number> = {
  1: 0,       // Day 1: 0% bonus
  3: 0.05,    // Day 3: +5% to all yields
  7: 0.10,    // Day 7: +10% to all yields
  30: 0.25,   // Day 30: +25% to all yields
};

// Goal templates for daily goal generation
const GOAL_TEMPLATES: Array<{
  id: string;
  description: string;
  targetFn: (day: number) => number;
  reward: number;
  icon: string;
  category: 'building' | 'growth' | 'survival' | 'upgrade' | 'happiness';
}> = [
  {
    id: 'place-defi',
    description: 'Place {target} DeFi buildings today',
    targetFn: (day) => Math.min(3 + Math.floor(day / 10), 8),
    reward: 5000,
    icon: '🏦',
    category: 'building',
  },
  {
    id: 'tvl-growth',
    description: 'Reach {target}% TVL growth',
    targetFn: (day) => Math.min(5 + Math.floor(day / 5) * 5, 25),
    reward: 10000,
    icon: '📈',
    category: 'growth',
  },
  {
    id: 'no-rugpull',
    description: 'Survive without a rug pull',
    targetFn: () => 1,
    reward: 15000,
    icon: '🛡️',
    category: 'survival',
  },
  {
    id: 'upgrade-buildings',
    description: 'Upgrade {target} buildings',
    targetFn: (day) => Math.min(1 + Math.floor(day / 7), 5),
    reward: 3000,
    icon: '⬆️',
    category: 'upgrade',
  },
  {
    id: 'happiness',
    description: 'Achieve {target}% happiness',
    targetFn: (day) => Math.min(50 + Math.floor(day / 10) * 5, 80),
    reward: 5000,
    icon: '😊',
    category: 'happiness',
  },
  {
    id: 'earn-yield',
    description: 'Earn ${target} in yield',
    targetFn: (day) => (5000 + day * 1000),
    reward: 8000,
    icon: '💰',
    category: 'growth',
  },
  {
    id: 'place-any',
    description: 'Place {target} buildings of any type',
    targetFn: (day) => Math.min(5 + Math.floor(day / 5), 15),
    reward: 4000,
    icon: '🏗️',
    category: 'building',
  },
  {
    id: 'maintain-tvl',
    description: 'Maintain TVL above ${target}',
    targetFn: (day) => (50000 + day * 10000),
    reward: 7000,
    icon: '🔒',
    category: 'survival',
  },
];

// Cliffhanger event definitions
const CLIFFHANGER_DEFINITIONS: Record<CliffhangerType, { message: string; icon: string; positive: boolean }> = {
  whale_incoming: {
    message: 'A whale is circling your city...',
    icon: '🐋',
    positive: true,
  },
  storm_clouds: {
    message: 'Storm clouds gathering...',
    icon: '⛈️',
    positive: false,
  },
  regulatory_whispers: {
    message: 'Regulatory whispers...',
    icon: '📜',
    positive: false,
  },
  airdrop_rumor: {
    message: 'Rumor of an airdrop...',
    icon: '🎁',
    positive: true,
  },
  bull_run: {
    message: 'Bulls spotted on the horizon...',
    icon: '🐂',
    positive: true,
  },
  bear_trap: {
    message: 'Bears lurking in the shadows...',
    icon: '🐻',
    positive: false,
  },
};

// Storage keys
const STORAGE_KEYS = {
  streak: 'cryptoCityEngagementStreak',
  dailyGoals: 'cryptoCityDailyGoals',
  daySummary: 'cryptoCityDaySummary',
  cliffhanger: 'cryptoCityCliffhanger',
  previousDayStats: 'cryptoCityPreviousDayStats',
};

// ============================================
// STREAK FUNCTIONS
// ============================================

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if two date strings are consecutive days
 */
function isConsecutiveDay(dateStr1: string | null, dateStr2: string): boolean {
  if (!dateStr1) return false;
  
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  
  date1.setUTCHours(0, 0, 0, 0);
  date2.setUTCHours(0, 0, 0, 0);
  
  const diffMs = date2.getTime() - date1.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays === 1;
}

/**
 * Load streak state from localStorage
 */
export function loadStreakState(): EngagementStreak {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, lastPlayDate: '', highestStreak: 0, streakBonus: 0 };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.streak);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return { currentStreak: 0, lastPlayDate: '', highestStreak: 0, streakBonus: 0 };
}

/**
 * Save streak state to localStorage
 */
export function saveStreakState(state: EngagementStreak): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Calculate streak bonus multiplier based on current streak
 */
export function getStreakBonus(streak: number): number {
  let bonus = 0;
  for (const [threshold, value] of Object.entries(STREAK_BONUSES)) {
    if (streak >= parseInt(threshold)) {
      bonus = value;
    }
  }
  return bonus;
}

/**
 * Update streak on game session start
 * Returns the updated streak state
 */
export function updateStreak(): EngagementStreak {
  const state = loadStreakState();
  const today = getTodayString();
  
  // Already played today
  if (state.lastPlayDate === today) {
    return state;
  }
  
  let newStreak: number;
  if (isConsecutiveDay(state.lastPlayDate, today)) {
    // Consecutive day - increment streak
    newStreak = state.currentStreak + 1;
  } else if (state.lastPlayDate === '') {
    // First play ever
    newStreak = 1;
  } else {
    // Streak broken - start at 1
    newStreak = 1;
  }
  
  const newState: EngagementStreak = {
    currentStreak: newStreak,
    lastPlayDate: today,
    highestStreak: Math.max(state.highestStreak, newStreak),
    streakBonus: getStreakBonus(newStreak),
  };
  
  saveStreakState(newState);
  return newState;
}

/**
 * Get streak display text with emoji
 */
export function getStreakDisplayText(streak: number): string {
  if (streak <= 0) return 'No streak';
  if (streak === 1) return '1 day';
  if (streak < 7) return `${streak} days 🔥`;
  if (streak < 30) return `${streak} days 🔥🔥`;
  return `${streak} days 💎🔥🔥`;
}

// ============================================
// DAILY GOALS FUNCTIONS
// ============================================

/**
 * Load daily goals from localStorage
 */
export function loadDailyGoals(): DailyGoal[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.dailyGoals);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return [];
}

/**
 * Save daily goals to localStorage
 */
export function saveDailyGoals(goals: DailyGoal[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.dailyGoals, JSON.stringify(goals));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generate 3 daily goals for the current game day
 * Goals are selected to provide variety (different categories)
 */
export function generateDailyGoals(gameDay: number, _gameState?: GameState): DailyGoal[] {
  const now = Date.now();
  const endOfDay = now + (24 * 60 * 60 * 1000); // 24 hours from now
  
  // Shuffle templates and pick 3 from different categories
  const shuffled = [...GOAL_TEMPLATES].sort(() => Math.random() - 0.5);
  const selectedGoals: DailyGoal[] = [];
  const usedCategories = new Set<string>();
  
  for (const template of shuffled) {
    if (selectedGoals.length >= 3) break;
    
    // Try to get goals from different categories
    if (usedCategories.has(template.category) && selectedGoals.length < 2) {
      continue;
    }
    
    const target = template.targetFn(gameDay);
    const description = template.description.replace('{target}', target.toLocaleString());
    
    selectedGoals.push({
      id: `${template.id}-day${gameDay}`,
      description,
      target,
      current: 0,
      reward: template.reward,
      expiresAt: endOfDay,
      completed: false,
      icon: template.icon,
    });
    
    usedCategories.add(template.category);
  }
  
  // If we didn't get 3 goals, fill with any remaining
  for (const template of shuffled) {
    if (selectedGoals.length >= 3) break;
    if (selectedGoals.some(g => g.id.startsWith(template.id))) continue;
    
    const target = template.targetFn(gameDay);
    const description = template.description.replace('{target}', target.toLocaleString());
    
    selectedGoals.push({
      id: `${template.id}-day${gameDay}`,
      description,
      target,
      current: 0,
      reward: template.reward,
      expiresAt: endOfDay,
      completed: false,
      icon: template.icon,
    });
  }
  
  saveDailyGoals(selectedGoals);
  return selectedGoals;
}

/**
 * Update progress for a specific goal
 */
export function updateGoalProgress(goalId: string, progress: number): DailyGoal | null {
  const goals = loadDailyGoals();
  const goal = goals.find(g => g.id.startsWith(goalId.split('-day')[0]));
  
  if (!goal) return null;
  
  goal.current = Math.min(progress, goal.target);
  if (goal.current >= goal.target && !goal.completed) {
    goal.completed = true;
  }
  
  saveDailyGoals(goals);
  return goal;
}

/**
 * Check and update all goals based on current game state
 */
export function checkGoals(
  gameState: GameState,
  buildingsPlacedToday: number,
  tvlGrowthPercent: number,
  rugPullsToday: number,
  upgradesThisDay: number,
  yieldEarnedToday: number,
): { completed: DailyGoal[]; totalReward: number } {
  const goals = loadDailyGoals();
  const completed: DailyGoal[] = [];
  let totalReward = 0;
  
  for (const goal of goals) {
    if (goal.completed) continue;
    
    // Update progress based on goal type
    if (goal.id.includes('place-defi')) {
      goal.current = buildingsPlacedToday; // Simplified - would need DeFi-specific tracking
    } else if (goal.id.includes('tvl-growth')) {
      goal.current = Math.floor(tvlGrowthPercent);
    } else if (goal.id.includes('no-rugpull')) {
      goal.current = rugPullsToday === 0 ? 1 : 0;
    } else if (goal.id.includes('upgrade-buildings')) {
      goal.current = upgradesThisDay;
    } else if (goal.id.includes('happiness')) {
      goal.current = gameState.stats.happiness;
    } else if (goal.id.includes('earn-yield')) {
      goal.current = yieldEarnedToday;
    } else if (goal.id.includes('place-any')) {
      goal.current = buildingsPlacedToday;
    } else if (goal.id.includes('maintain-tvl')) {
      // Check if TVL is above target - would need actual TVL value
      goal.current = goal.target; // Simplified
    }
    
    // Check completion
    if (goal.current >= goal.target && !goal.completed) {
      goal.completed = true;
      completed.push(goal);
      totalReward += goal.reward;
    }
  }
  
  saveDailyGoals(goals);
  return { completed, totalReward };
}

// ============================================
// DAY SUMMARY FUNCTIONS
// ============================================

interface PreviousDayStats {
  treasury: number;
  tvl: number;
  buildingCount: number;
}

/**
 * Load previous day stats for comparison
 */
export function loadPreviousDayStats(): PreviousDayStats | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.previousDayStats);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Save current stats as previous day stats
 */
export function savePreviousDayStats(stats: PreviousDayStats): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.previousDayStats, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load day summary from localStorage
 */
export function loadDaySummary(): DaySummary | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.daySummary);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Save day summary to localStorage
 */
export function saveDaySummary(summary: DaySummary): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.daySummary, JSON.stringify(summary));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generate end-of-day summary
 */
export function generateDaySummary(
  gameDay: number,
  currentTreasury: number,
  currentTvl: number,
  buildingsPlaced: number,
  buildingsLost: number,
  totalYield: number,
  achievements: string[],
  coinsEarned: number,
): DaySummary {
  const prevStats = loadPreviousDayStats();
  
  const summary: DaySummary = {
    day: gameDay,
    treasuryChange: prevStats ? currentTreasury - prevStats.treasury : currentTreasury,
    tvlChange: prevStats ? currentTvl - prevStats.tvl : currentTvl,
    buildingsPlaced,
    buildingsLost,
    totalYield,
    achievements,
    coinsEarned,
  };
  
  // Save current stats for next day comparison
  savePreviousDayStats({
    treasury: currentTreasury,
    tvl: currentTvl,
    buildingCount: buildingsPlaced,
  });
  
  saveDaySummary(summary);
  return summary;
}

/**
 * Clear day summary (after it's been shown)
 */
export function clearDaySummary(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.daySummary);
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// CLIFFHANGER FUNCTIONS
// ============================================

/**
 * Load cliffhanger event from localStorage
 */
export function loadCliffhanger(): CliffhangerEvent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cliffhanger);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Save cliffhanger event to localStorage
 */
export function saveCliffhanger(event: CliffhangerEvent): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.cliffhanger, JSON.stringify(event));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear cliffhanger event (after it resolves)
 */
export function clearCliffhanger(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.cliffhanger);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generate a random cliffhanger event for the next day
 */
export function generateCliffhanger(nextDay: number): CliffhangerEvent {
  const types = Object.keys(CLIFFHANGER_DEFINITIONS) as CliffhangerType[];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const definition = CLIFFHANGER_DEFINITIONS[randomType];
  
  const event: CliffhangerEvent = {
    type: randomType,
    message: definition.message,
    scheduledDay: nextDay,
    icon: definition.icon,
    resolved: false,
  };
  
  saveCliffhanger(event);
  return event;
}

/**
 * Check if cliffhanger should trigger on given day
 */
export function shouldTriggerCliffhanger(currentDay: number): CliffhangerEvent | null {
  const cliffhanger = loadCliffhanger();
  
  if (cliffhanger && cliffhanger.scheduledDay === currentDay && !cliffhanger.resolved) {
    return cliffhanger;
  }
  
  return null;
}

/**
 * Mark cliffhanger as resolved
 */
export function resolveCliffhanger(): void {
  const cliffhanger = loadCliffhanger();
  if (cliffhanger) {
    cliffhanger.resolved = true;
    saveCliffhanger(cliffhanger);
  }
}

/**
 * Get cliffhanger effect based on type
 * Returns modifiers to apply to game state
 */
export function getCliffhangerEffect(type: CliffhangerType): {
  treasuryChange: number;
  tvlChange: number;
  happinessChange: number;
  message: string;
} {
  switch (type) {
    case 'whale_incoming':
      return {
        treasuryChange: 50000,
        tvlChange: 100000,
        happinessChange: 5,
        message: '🐋 A whale deposited a massive amount into your city!',
      };
    case 'storm_clouds':
      return {
        treasuryChange: -10000,
        tvlChange: -25000,
        happinessChange: -10,
        message: '⛈️ Market crash! Temporary downturn affecting your city.',
      };
    case 'regulatory_whispers':
      return {
        treasuryChange: -5000,
        tvlChange: -15000,
        happinessChange: -5,
        message: '📜 Regulatory concerns slowed down some investments.',
      };
    case 'airdrop_rumor':
      return {
        treasuryChange: 25000,
        tvlChange: 50000,
        happinessChange: 10,
        message: '🎁 Surprise airdrop! Free tokens distributed to your city!',
      };
    case 'bull_run':
      return {
        treasuryChange: 30000,
        tvlChange: 75000,
        happinessChange: 8,
        message: '🐂 Bull market! Everything is pumping!',
      };
    case 'bear_trap':
      return {
        treasuryChange: -20000,
        tvlChange: -40000,
        happinessChange: -8,
        message: '🐻 Bear trap sprung! Markets took a hit.',
      };
    default:
      return {
        treasuryChange: 0,
        tvlChange: 0,
        happinessChange: 0,
        message: '',
      };
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  STORAGE_KEYS,
  CLIFFHANGER_DEFINITIONS,
  GOAL_TEMPLATES,
};
