/**
 * Daily Rewards System
 * 
 * Implements daily login rewards with streak multipliers to drive retention.
 * Based on research from successful games (Duolingo, Hamster Kombat).
 */

export interface DailyRewardState {
  lastClaimDate: string | null; // YYYY-MM-DD format
  currentStreak: number;
  totalClaims: number;
  highestStreak: number;
}

export interface DailyReward {
  baseAmount: number;
  streakBonus: number;
  totalAmount: number;
  cobieQuote: string;
  isStreakMilestone: boolean;
  milestoneReward?: string;
}

// Streak multipliers - longer streaks = better rewards
const STREAK_MULTIPLIERS: Record<number, number> = {
  1: 1.0,   // Day 1: base reward
  2: 1.1,   // Day 2: +10%
  3: 1.2,   // Day 3: +20%
  4: 1.3,   // Day 4: +30%
  5: 1.4,   // Day 5: +40%
  6: 1.5,   // Day 6: +50%
  7: 2.0,   // Week streak: 2x!
  14: 2.5,  // 2 weeks: 2.5x
  30: 3.0,  // Month: 3x
};

// Milestone rewards at specific streak counts
const STREAK_MILESTONES: Record<number, string> = {
  7: 'unlocked_building_gm_cafe',
  14: 'yield_boost_24h',
  30: 'unlocked_building_diamond_hands_monument',
};

// Cobie's daily alpha - rotating tips
const COBIE_DAILY_QUOTES = [
  "Stay the course. The metagame is patience.",
  "Markets can remain irrational longer than you can remain solvent.",
  "The best trade is often no trade at all.",
  "If you're not willing to hold it for 4 years, don't hold it for 4 minutes.",
  "Diversification is protection against ignorance. Concentrate if you know what you're doing.",
  "Everyone's a genius in a bull market.",
  "The probability of that happening was supposed to be near zero.",
  "Boring is underrated. Consistency compounds.",
  "Your edge isn't knowing more. It's doing less.",
  "The market doesn't care about your conviction.",
  "Risk management isn't optional, it's survival.",
  "Don't confuse luck with skill. They look identical in the short term.",
  "The best investors I know check prices the least.",
  "If you can't explain your thesis in one sentence, you don't have one.",
  "Time in market beats timing the market. Usually.",
  "The crowd is right until it isn't.",
  "Your portfolio should let you sleep at night.",
  "Never invest money you can't afford to lose. Really.",
  "The hardest part isn't buying. It's not selling.",
  "Zoom out. Then zoom out more.",
  "Everyone has a plan until they're down 50%.",
  "The market is a voting machine short-term, a weighing machine long-term.",
  "If it sounds too good to be true, it's probably about to rug.",
  "Diamond hands work until they don't.",
  "The best alpha is usually obvious in hindsight.",
  "Your biggest enemy is yourself, not the market.",
  "Conviction without flexibility is stubbornness.",
  "The only certainty is uncertainty.",
  "Don't catch falling knives. Let them hit the floor first.",
  "Size kills. Position size is risk management.",
];

const BASE_DAILY_REWARD = 1000; // $1,000 base

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
  
  // Set both to midnight UTC
  date1.setUTCHours(0, 0, 0, 0);
  date2.setUTCHours(0, 0, 0, 0);
  
  const diffMs = date2.getTime() - date1.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays === 1;
}

/**
 * Check if reward was already claimed today
 */
function isClaimedToday(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return false;
  return lastClaimDate === getTodayString();
}

/**
 * Get the streak multiplier for a given streak count
 */
function getStreakMultiplier(streak: number): number {
  // Find the highest applicable multiplier
  let multiplier = 1.0;
  for (const [threshold, mult] of Object.entries(STREAK_MULTIPLIERS)) {
    if (streak >= parseInt(threshold)) {
      multiplier = mult;
    }
  }
  return multiplier;
}

/**
 * Get a deterministic daily Cobie quote based on date
 */
function getDailyCobieQuote(): string {
  const today = getTodayString();
  // Simple hash of date string to pick quote
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % COBIE_DAILY_QUOTES.length;
  return COBIE_DAILY_QUOTES[index];
}

/**
 * Load daily reward state from localStorage
 */
export function loadDailyRewardState(): DailyRewardState {
  if (typeof window === 'undefined') {
    return { lastClaimDate: null, currentStreak: 0, totalClaims: 0, highestStreak: 0 };
  }
  
  try {
    const stored = localStorage.getItem('cryptoCityDailyRewards');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return { lastClaimDate: null, currentStreak: 0, totalClaims: 0, highestStreak: 0 };
}

/**
 * Save daily reward state to localStorage
 */
export function saveDailyRewardState(state: DailyRewardState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('cryptoCityDailyRewards', JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if daily reward can be claimed
 */
export function canClaimDailyReward(): boolean {
  const state = loadDailyRewardState();
  return !isClaimedToday(state.lastClaimDate);
}

/**
 * Get current streak without claiming
 */
export function getCurrentStreak(): number {
  const state = loadDailyRewardState();
  const today = getTodayString();
  
  // If last claim was today, return current streak
  if (state.lastClaimDate === today) {
    return state.currentStreak;
  }
  
  // If last claim was yesterday, streak continues
  if (isConsecutiveDay(state.lastClaimDate, today)) {
    return state.currentStreak + 1;
  }
  
  // Streak broken - would start at 1
  return 1;
}

/**
 * Preview what reward would be received (without claiming)
 */
export function previewDailyReward(): DailyReward {
  const streak = getCurrentStreak();
  const multiplier = getStreakMultiplier(streak);
  const baseAmount = BASE_DAILY_REWARD;
  const streakBonus = Math.floor(baseAmount * (multiplier - 1));
  const totalAmount = baseAmount + streakBonus;
  
  const isStreakMilestone = streak in STREAK_MILESTONES;
  const milestoneReward = isStreakMilestone ? STREAK_MILESTONES[streak] : undefined;
  
  return {
    baseAmount,
    streakBonus,
    totalAmount,
    cobieQuote: getDailyCobieQuote(),
    isStreakMilestone,
    milestoneReward,
  };
}

/**
 * Claim daily reward
 * Returns the reward details or null if already claimed
 */
export function claimDailyReward(): DailyReward | null {
  const state = loadDailyRewardState();
  const today = getTodayString();
  
  // Check if already claimed today
  if (isClaimedToday(state.lastClaimDate)) {
    return null;
  }
  
  // Calculate new streak
  let newStreak: number;
  if (isConsecutiveDay(state.lastClaimDate, today)) {
    // Consecutive day - increment streak
    newStreak = state.currentStreak + 1;
  } else {
    // Streak broken or first claim - start at 1
    newStreak = 1;
  }
  
  // Calculate reward
  const multiplier = getStreakMultiplier(newStreak);
  const baseAmount = BASE_DAILY_REWARD;
  const streakBonus = Math.floor(baseAmount * (multiplier - 1));
  const totalAmount = baseAmount + streakBonus;
  
  const isStreakMilestone = newStreak in STREAK_MILESTONES;
  const milestoneReward = isStreakMilestone ? STREAK_MILESTONES[newStreak] : undefined;
  
  // Update state
  const newState: DailyRewardState = {
    lastClaimDate: today,
    currentStreak: newStreak,
    totalClaims: state.totalClaims + 1,
    highestStreak: Math.max(state.highestStreak, newStreak),
  };
  saveDailyRewardState(newState);
  
  return {
    baseAmount,
    streakBonus,
    totalAmount,
    cobieQuote: getDailyCobieQuote(),
    isStreakMilestone,
    milestoneReward,
  };
}

/**
 * Get formatted streak text for display
 */
export function getStreakDisplayText(streak: number): string {
  if (streak <= 0) return 'No streak';
  if (streak === 1) return '1 day';
  if (streak < 7) return `${streak} days`;
  if (streak < 14) return `${streak} days 🔥`;
  if (streak < 30) return `${streak} days 🔥🔥`;
  return `${streak} days 💎🙌`;
}

/**
 * Get next milestone info
 */
export function getNextMilestone(currentStreak: number): { days: number; reward: string } | null {
  const milestones = Object.entries(STREAK_MILESTONES)
    .map(([days, reward]) => ({ days: parseInt(days), reward }))
    .sort((a, b) => a.days - b.days);
  
  for (const milestone of milestones) {
    if (milestone.days > currentStreak) {
      return milestone;
    }
  }
  
  return null; // All milestones achieved
}
