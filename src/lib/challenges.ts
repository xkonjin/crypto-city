/**
 * Weekly Challenges System
 * 
 * Implements rotating weekly challenges with progress tracking and rewards.
 * Challenges reset every Monday at 00:00 UTC with deterministic selection
 * based on the week number.
 */

import type { GameState } from '@/types/game';
import type { CryptoEconomyState } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

export type ChallengeObjectiveType = 
  | 'tvl'           // Reach a specific TVL
  | 'survive_rugs'  // Survive a number of rug pulls
  | 'buildings'     // Build a number of DeFi buildings
  | 'population'    // Reach a specific population
  | 'no_rugs'       // Go days without rug pulls
  | 'happiness';    // Maintain happiness above threshold

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface ChallengeObjective {
  type: ChallengeObjectiveType;
  target: number;
  /** For happiness/no_rugs: number of days to maintain */
  durationDays?: number;
}

export interface ChallengeReward {
  treasury: number;
  achievement?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  objective: ChallengeObjective;
  reward: ChallengeReward;
  difficulty: ChallengeDifficulty;
  progress: number; // 0-100%
  completed: boolean;
  claimed: boolean;
}

export interface ChallengeState {
  weekNumber: number;
  challenges: Challenge[];
  lastUpdated: number;
  // Track daily metrics for duration-based challenges
  happinessAboveThresholdDays: number;
  daysSinceLastRug: number;
  rugPullsSurvived: number;
}

// =============================================================================
// CHALLENGE DEFINITIONS
// =============================================================================

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  objective: ChallengeObjective;
  reward: ChallengeReward;
  difficulty: ChallengeDifficulty;
}

// Pool of available challenges by difficulty
const CHALLENGE_POOL: Record<ChallengeDifficulty, ChallengeDefinition[]> = {
  easy: [
    {
      id: 'easy_tvl_100k',
      title: 'Getting Started',
      description: 'Reach $100k TVL in your city',
      objective: { type: 'tvl', target: 100000 },
      reward: { treasury: 2500 },
      difficulty: 'easy',
    },
    {
      id: 'easy_buildings_5',
      title: 'DeFi Developer',
      description: 'Build 5 DeFi buildings',
      objective: { type: 'buildings', target: 5 },
      reward: { treasury: 3000 },
      difficulty: 'easy',
    },
    {
      id: 'easy_population_1000',
      title: 'Growing Community',
      description: 'Reach 1,000 citizens',
      objective: { type: 'population', target: 1000 },
      reward: { treasury: 2000 },
      difficulty: 'easy',
    },
    {
      id: 'easy_happiness_70',
      title: 'Happy Citizens',
      description: 'Maintain 70%+ happiness for 1 day',
      objective: { type: 'happiness', target: 70, durationDays: 1 },
      reward: { treasury: 2500 },
      difficulty: 'easy',
    },
  ],
  medium: [
    {
      id: 'medium_tvl_500k',
      title: 'TVL Growth',
      description: 'Reach $500k TVL',
      objective: { type: 'tvl', target: 500000 },
      reward: { treasury: 7500 },
      difficulty: 'medium',
    },
    {
      id: 'medium_buildings_10',
      title: 'Protocol Architect',
      description: 'Build 10 DeFi buildings',
      objective: { type: 'buildings', target: 10 },
      reward: { treasury: 8000 },
      difficulty: 'medium',
    },
    {
      id: 'medium_population_5000',
      title: 'Thriving Metropolis',
      description: 'Reach 5,000 citizens',
      objective: { type: 'population', target: 5000 },
      reward: { treasury: 6000 },
      difficulty: 'medium',
    },
    {
      id: 'medium_survive_rugs_3',
      title: 'Rug Survivor',
      description: 'Survive 3 rug pulls this week',
      objective: { type: 'survive_rugs', target: 3 },
      reward: { treasury: 10000 },
      difficulty: 'medium',
    },
    {
      id: 'medium_happiness_80',
      title: 'Citizen Satisfaction',
      description: 'Maintain 80%+ happiness for 2 days',
      objective: { type: 'happiness', target: 80, durationDays: 2 },
      reward: { treasury: 7500 },
      difficulty: 'medium',
    },
  ],
  hard: [
    {
      id: 'hard_tvl_1m',
      title: 'DeFi Dominance',
      description: 'Reach $1M TVL',
      objective: { type: 'tvl', target: 1000000 },
      reward: { treasury: 20000, achievement: 'tvl_millionaire' },
      difficulty: 'hard',
    },
    {
      id: 'hard_no_rugs_7',
      title: 'Diamond Hands',
      description: 'Zero rug pulls for 7 days',
      objective: { type: 'no_rugs', target: 7, durationDays: 7 },
      reward: { treasury: 25000, achievement: 'diamond_hands' },
      difficulty: 'hard',
    },
    {
      id: 'hard_survive_rugs_5',
      title: 'Battle Hardened',
      description: 'Survive 5 rug pulls this week',
      objective: { type: 'survive_rugs', target: 5 },
      reward: { treasury: 15000 },
      difficulty: 'hard',
    },
    {
      id: 'hard_happiness_85',
      title: 'Utopia',
      description: 'Maintain 85%+ happiness for 3 days',
      objective: { type: 'happiness', target: 85, durationDays: 3 },
      reward: { treasury: 18000, achievement: 'utopia' },
      difficulty: 'hard',
    },
    {
      id: 'hard_population_10000',
      title: 'Crypto Megacity',
      description: 'Reach 10,000 citizens',
      objective: { type: 'population', target: 10000 },
      reward: { treasury: 15000 },
      difficulty: 'hard',
    },
  ],
};

// =============================================================================
// WEEK NUMBER CALCULATION
// =============================================================================

/**
 * Get the current week number (weeks since Unix epoch, starting Monday)
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  // Get milliseconds since epoch
  const ms = now.getTime();
  // Convert to days since epoch
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  // Jan 1, 1970 was a Thursday (day 4), so we adjust to make Monday = 0
  // Thursday is day 3 in 0-indexed week starting Monday
  const adjustedDays = days + 3; // Now Monday is day 0
  // Get week number
  return Math.floor(adjustedDays / 7);
}

/**
 * Get time until next weekly reset (Monday 00:00 UTC)
 */
export function getTimeUntilReset(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  
  // Find next Monday 00:00 UTC
  const nextMonday = new Date(now);
  nextMonday.setUTCHours(0, 0, 0, 0);
  
  // Get current day of week (0 = Sunday, 1 = Monday, ...)
  const currentDay = now.getUTCDay();
  
  // Calculate days until Monday
  // If today is Monday and we haven't passed midnight, days = 0
  // If today is Sunday (0), days = 1
  // If today is Saturday (6), days = 2
  // etc.
  let daysUntilMonday = (8 - currentDay) % 7;
  if (daysUntilMonday === 0) {
    // It's Monday - check if we've passed midnight
    if (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0) {
      daysUntilMonday = 7; // Next Monday
    }
  }
  
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
  
  const diff = nextMonday.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    days: Math.floor(hours / 24),
    hours: hours % 24,
    minutes,
  };
}

/**
 * Format reset time for display
 */
export function formatResetTime(): string {
  const { days, hours, minutes } = getTimeUntilReset();
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// =============================================================================
// CHALLENGE SELECTION (Deterministic)
// =============================================================================

/**
 * Simple seeded random number generator for deterministic challenge selection
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Get this week's challenges (deterministic based on week number)
 * Returns exactly 3 challenges: 1 easy, 1 medium, 1 hard
 */
export function getWeeklyChallenges(): Challenge[] {
  const weekNumber = getCurrentWeekNumber();
  const random = seededRandom(weekNumber);
  
  // Select one challenge from each difficulty pool
  const easyIndex = Math.floor(random() * CHALLENGE_POOL.easy.length);
  const mediumIndex = Math.floor(random() * CHALLENGE_POOL.medium.length);
  const hardIndex = Math.floor(random() * CHALLENGE_POOL.hard.length);
  
  const selectedDefinitions = [
    CHALLENGE_POOL.easy[easyIndex],
    CHALLENGE_POOL.medium[mediumIndex],
    CHALLENGE_POOL.hard[hardIndex],
  ];
  
  // Convert definitions to challenges with initial progress
  return selectedDefinitions.map(def => ({
    ...def,
    progress: 0,
    completed: false,
    claimed: false,
  }));
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

/**
 * Check progress for a single challenge
 * Returns progress as percentage (0-100)
 */
export function checkChallengeProgress(
  challenge: Challenge,
  state: GameState,
  crypto: CryptoEconomyState,
  challengeState: ChallengeState
): number {
  const { objective } = challenge;
  
  switch (objective.type) {
    case 'tvl':
      return Math.min(100, Math.floor((crypto.tvl / objective.target) * 100));
      
    case 'buildings':
      return Math.min(100, Math.floor((crypto.buildingCount / objective.target) * 100));
      
    case 'population':
      return Math.min(100, Math.floor((state.stats.population / objective.target) * 100));
      
    case 'survive_rugs':
      return Math.min(100, Math.floor((challengeState.rugPullsSurvived / objective.target) * 100));
      
    case 'no_rugs': {
      const durationDays = objective.durationDays || objective.target;
      return Math.min(100, Math.floor((challengeState.daysSinceLastRug / durationDays) * 100));
    }
      
    case 'happiness': {
      const durationDays = objective.durationDays || 1;
      // Check if current happiness meets threshold
      const currentHappiness = state.stats.happiness;
      if (currentHappiness < objective.target) {
        // Not currently meeting threshold - show partial progress from accumulated days
        return Math.min(100, Math.floor((challengeState.happinessAboveThresholdDays / durationDays) * 100));
      }
      // Meeting threshold - show accumulated progress
      return Math.min(100, Math.floor((challengeState.happinessAboveThresholdDays / durationDays) * 100));
    }
      
    default:
      return 0;
  }
}

/**
 * Update all challenge progress
 */
export function updateChallengesProgress(
  challenges: Challenge[],
  state: GameState,
  crypto: CryptoEconomyState,
  challengeState: ChallengeState
): Challenge[] {
  return challenges.map(challenge => {
    if (challenge.claimed) {
      return challenge; // Don't update claimed challenges
    }
    
    const progress = checkChallengeProgress(challenge, state, crypto, challengeState);
    const completed = progress >= 100;
    
    return {
      ...challenge,
      progress,
      completed,
    };
  });
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

const STORAGE_KEY = 'cryptoCityChallenges';

/**
 * Create initial challenge state
 */
export function createInitialChallengeState(): ChallengeState {
  const weekNumber = getCurrentWeekNumber();
  return {
    weekNumber,
    challenges: getWeeklyChallenges(),
    lastUpdated: Date.now(),
    happinessAboveThresholdDays: 0,
    daysSinceLastRug: 0,
    rugPullsSurvived: 0,
  };
}

/**
 * Load challenge state from localStorage
 */
export function loadChallengeState(): ChallengeState {
  if (typeof window === 'undefined') {
    return createInitialChallengeState();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChallengeState;
      
      // Check if week has changed - reset if so
      const currentWeek = getCurrentWeekNumber();
      if (parsed.weekNumber !== currentWeek) {
        // New week - reset challenges but keep some history
        const newState = createInitialChallengeState();
        return newState;
      }
      
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  
  return createInitialChallengeState();
}

/**
 * Save challenge state to localStorage
 */
export function saveChallengeState(state: ChallengeState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Claim a completed challenge reward
 * Returns the treasury amount to add, or 0 if already claimed/not completed
 */
export function claimChallengeReward(
  challengeState: ChallengeState,
  challengeId: string
): { treasuryReward: number; achievement?: string; updatedState: ChallengeState } {
  const challengeIndex = challengeState.challenges.findIndex(c => c.id === challengeId);
  
  if (challengeIndex === -1) {
    return { treasuryReward: 0, updatedState: challengeState };
  }
  
  const challenge = challengeState.challenges[challengeIndex];
  
  if (!challenge.completed || challenge.claimed) {
    return { treasuryReward: 0, updatedState: challengeState };
  }
  
  // Mark as claimed
  const updatedChallenges = [...challengeState.challenges];
  updatedChallenges[challengeIndex] = {
    ...challenge,
    claimed: true,
  };
  
  const updatedState: ChallengeState = {
    ...challengeState,
    challenges: updatedChallenges,
    lastUpdated: Date.now(),
  };
  
  // Save immediately
  saveChallengeState(updatedState);
  
  return {
    treasuryReward: challenge.reward.treasury,
    achievement: challenge.reward.achievement,
    updatedState,
  };
}

/**
 * Record a rug pull event
 */
export function recordRugPull(state: ChallengeState): ChallengeState {
  const updated: ChallengeState = {
    ...state,
    daysSinceLastRug: 0,
    rugPullsSurvived: state.rugPullsSurvived + 1,
    lastUpdated: Date.now(),
  };
  saveChallengeState(updated);
  return updated;
}

/**
 * Record a new game day passing
 */
export function recordNewDay(
  state: ChallengeState,
  currentHappiness: number,
  happinessThreshold: number = 70
): ChallengeState {
  const meetsHappinessThreshold = currentHappiness >= happinessThreshold;
  
  const updated: ChallengeState = {
    ...state,
    daysSinceLastRug: state.daysSinceLastRug + 1,
    happinessAboveThresholdDays: meetsHappinessThreshold 
      ? state.happinessAboveThresholdDays + 1 
      : 0, // Reset if threshold not met
    lastUpdated: Date.now(),
  };
  saveChallengeState(updated);
  return updated;
}

/**
 * Get count of unclaimed completed challenges
 */
export function getUnclaimedCount(state: ChallengeState): number {
  return state.challenges.filter(c => c.completed && !c.claimed).length;
}
