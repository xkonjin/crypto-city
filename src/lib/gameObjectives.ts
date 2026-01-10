/**
 * Game Objectives System
 * 
 * Defines win and lose conditions for Crypto City.
 * Closes GitHub issues #29 and #43.
 * 
 * Win Conditions (any triggers victory):
 * 1. Reach $1,000,000 TVL
 * 2. Survive 100 game days
 * 3. Reach 10,000 population
 * 4. Build 50 crypto buildings
 * 
 * Lose Conditions (triggers game over):
 * 1. Treasury at $0 for 100 consecutive ticks (bankruptcy)
 * 2. All crypto buildings destroyed (rugged out)
 * 3. City happiness below 20% for 50 consecutive ticks
 */

import type { GameState } from '@/types/game';
import type { CryptoEconomyState } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

export type GameMode = 'sandbox' | 'campaign' | 'survival';

export interface WinCondition {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetValue: number;
  check: (state: GameState, cryptoState: CryptoEconomyState, tracking: ObjectiveTracking) => boolean;
  progress: (state: GameState, cryptoState: CryptoEconomyState, tracking: ObjectiveTracking) => number;
}

export interface LoseCondition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (state: GameState, cryptoState: CryptoEconomyState, tracking: ObjectiveTracking) => boolean;
  progress: (state: GameState, cryptoState: CryptoEconomyState, tracking: ObjectiveTracking) => number;
}

export interface ObjectiveTracking {
  gameDays: number;
  bankruptcyTicks: number;
  lowHappinessTicks: number;
  peakTVL: number;
  peakPopulation: number;
  peakBuildingCount: number;
  hadCryptoBuildings: boolean;
}

export interface GameObjectives {
  mode: GameMode;
  isGameOver: boolean;
  isVictory: boolean;
  endReason?: string;
  endConditionId?: string;
  winConditions: WinCondition[];
  loseConditions: LoseCondition[];
  tracking: ObjectiveTracking;
}

export interface GameEndResult {
  isGameOver: boolean;
  isVictory: boolean;
  endReason?: string;
  endConditionId?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Win condition thresholds
export const WIN_THRESHOLDS = {
  TVL: 1_000_000,          // $1M TVL
  DAYS: 100,               // 100 game days
  POPULATION: 10_000,      // 10,000 population
  BUILDINGS: 50,           // 50 crypto buildings
} as const;

// Lose condition thresholds
export const LOSE_THRESHOLDS = {
  BANKRUPTCY_TICKS: 100,   // 100 consecutive ticks at $0
  LOW_HAPPINESS: 20,       // Below 20% happiness
  LOW_HAPPINESS_TICKS: 50, // For 50 consecutive ticks
} as const;

// =============================================================================
// WIN CONDITIONS
// =============================================================================

export const WIN_CONDITIONS: WinCondition[] = [
  {
    id: 'tvl_millionaire',
    name: 'TVL Millionaire',
    description: `Reach $${WIN_THRESHOLDS.TVL.toLocaleString()} Total Value Locked`,
    icon: '💰',
    targetValue: WIN_THRESHOLDS.TVL,
    check: (_state, cryptoState) => cryptoState.tvl >= WIN_THRESHOLDS.TVL,
    progress: (_state, cryptoState) => Math.min(100, (cryptoState.tvl / WIN_THRESHOLDS.TVL) * 100),
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: `Survive ${WIN_THRESHOLDS.DAYS} game days`,
    icon: '📅',
    targetValue: WIN_THRESHOLDS.DAYS,
    check: (_state, _cryptoState, tracking) => tracking.gameDays >= WIN_THRESHOLDS.DAYS,
    progress: (_state, _cryptoState, tracking) => Math.min(100, (tracking.gameDays / WIN_THRESHOLDS.DAYS) * 100),
  },
  {
    id: 'metropolis',
    name: 'Metropolis',
    description: `Reach ${WIN_THRESHOLDS.POPULATION.toLocaleString()} population`,
    icon: '🏙️',
    targetValue: WIN_THRESHOLDS.POPULATION,
    check: (state) => state.stats.population >= WIN_THRESHOLDS.POPULATION,
    progress: (state) => Math.min(100, (state.stats.population / WIN_THRESHOLDS.POPULATION) * 100),
  },
  {
    id: 'crypto_baron',
    name: 'Crypto Baron',
    description: `Build ${WIN_THRESHOLDS.BUILDINGS} crypto buildings`,
    icon: '🏗️',
    targetValue: WIN_THRESHOLDS.BUILDINGS,
    check: (_state, cryptoState) => cryptoState.buildingCount >= WIN_THRESHOLDS.BUILDINGS,
    progress: (_state, cryptoState) => Math.min(100, (cryptoState.buildingCount / WIN_THRESHOLDS.BUILDINGS) * 100),
  },
];

// =============================================================================
// LOSE CONDITIONS
// =============================================================================

export const LOSE_CONDITIONS: LoseCondition[] = [
  {
    id: 'bankruptcy',
    name: 'Bankruptcy',
    description: `Treasury at $0 for ${LOSE_THRESHOLDS.BANKRUPTCY_TICKS} consecutive ticks`,
    icon: '💸',
    check: (_state, _cryptoState, tracking) => tracking.bankruptcyTicks >= LOSE_THRESHOLDS.BANKRUPTCY_TICKS,
    progress: (_state, _cryptoState, tracking) => Math.min(100, (tracking.bankruptcyTicks / LOSE_THRESHOLDS.BANKRUPTCY_TICKS) * 100),
  },
  {
    id: 'rugged_out',
    name: 'Rugged Out',
    description: 'All crypto buildings destroyed',
    icon: '🔥',
    check: (_state, cryptoState, tracking) => {
      // Only lose if we had buildings and now have none
      return tracking.hadCryptoBuildings && cryptoState.buildingCount === 0;
    },
    progress: (_state, cryptoState, tracking) => {
      if (!tracking.hadCryptoBuildings) return 0;
      if (cryptoState.buildingCount === 0) return 100;
      // Show inverse - more buildings = less progress toward loss
      return Math.max(0, 100 - (cryptoState.buildingCount * 10));
    },
  },
  {
    id: 'unhappy_citizens',
    name: 'Civil Unrest',
    description: `City happiness below ${LOSE_THRESHOLDS.LOW_HAPPINESS}% for ${LOSE_THRESHOLDS.LOW_HAPPINESS_TICKS} consecutive ticks`,
    icon: '😢',
    check: (_state, _cryptoState, tracking) => tracking.lowHappinessTicks >= LOSE_THRESHOLDS.LOW_HAPPINESS_TICKS,
    progress: (_state, _cryptoState, tracking) => Math.min(100, (tracking.lowHappinessTicks / LOSE_THRESHOLDS.LOW_HAPPINESS_TICKS) * 100),
  },
];

// =============================================================================
// OBJECTIVE TRACKING
// =============================================================================

/**
 * Create initial objective tracking state
 */
export function createInitialTracking(): ObjectiveTracking {
  return {
    gameDays: 0,
    bankruptcyTicks: 0,
    lowHappinessTicks: 0,
    peakTVL: 0,
    peakPopulation: 0,
    peakBuildingCount: 0,
    hadCryptoBuildings: false,
  };
}

/**
 * Create initial game objectives state
 */
export function createGameObjectives(mode: GameMode = 'sandbox'): GameObjectives {
  return {
    mode,
    isGameOver: false,
    isVictory: false,
    winConditions: WIN_CONDITIONS,
    loseConditions: LOSE_CONDITIONS,
    tracking: createInitialTracking(),
  };
}

// =============================================================================
// OBJECTIVE CHECKING
// =============================================================================

/**
 * Update objective tracking based on current state
 * Call this every tick to maintain accurate tracking
 */
export function updateTracking(
  tracking: ObjectiveTracking,
  state: GameState,
  cryptoState: CryptoEconomyState,
  isNewDay: boolean,
): ObjectiveTracking {
  const updated = { ...tracking };
  
  // Track game days
  if (isNewDay) {
    updated.gameDays++;
  }
  
  // Track bankruptcy ticks (treasury <= 0)
  if (cryptoState.treasury <= 0) {
    updated.bankruptcyTicks++;
  } else {
    updated.bankruptcyTicks = 0; // Reset when treasury is positive
  }
  
  // Track low happiness ticks (happiness < 20%)
  if (state.stats.happiness < LOSE_THRESHOLDS.LOW_HAPPINESS) {
    updated.lowHappinessTicks++;
  } else {
    updated.lowHappinessTicks = 0; // Reset when happiness recovers
  }
  
  // Track peaks
  updated.peakTVL = Math.max(updated.peakTVL, cryptoState.tvl);
  updated.peakPopulation = Math.max(updated.peakPopulation, state.stats.population);
  updated.peakBuildingCount = Math.max(updated.peakBuildingCount, cryptoState.buildingCount);
  
  // Track if player has ever had crypto buildings
  if (cryptoState.buildingCount > 0) {
    updated.hadCryptoBuildings = true;
  }
  
  return updated;
}

/**
 * Check all win and lose conditions
 * Returns game end result if any condition is met
 */
export function checkGameEnd(
  objectives: GameObjectives,
  state: GameState,
  cryptoState: CryptoEconomyState,
): GameEndResult {
  // In sandbox mode, conditions are tracked but don't end the game
  if (objectives.mode === 'sandbox') {
    return { isGameOver: false, isVictory: false };
  }
  
  // Check win conditions first
  for (const condition of objectives.winConditions) {
    if (condition.check(state, cryptoState, objectives.tracking)) {
      return {
        isGameOver: true,
        isVictory: true,
        endReason: condition.name,
        endConditionId: condition.id,
      };
    }
  }
  
  // Check lose conditions
  for (const condition of objectives.loseConditions) {
    if (condition.check(state, cryptoState, objectives.tracking)) {
      return {
        isGameOver: true,
        isVictory: false,
        endReason: condition.name,
        endConditionId: condition.id,
      };
    }
  }
  
  return { isGameOver: false, isVictory: false };
}

/**
 * Get progress for all win conditions
 */
export function getWinProgress(
  objectives: GameObjectives,
  state: GameState,
  cryptoState: CryptoEconomyState,
): { id: string; name: string; progress: number; icon: string }[] {
  return objectives.winConditions.map(condition => ({
    id: condition.id,
    name: condition.name,
    progress: condition.progress(state, cryptoState, objectives.tracking),
    icon: condition.icon,
  }));
}

/**
 * Get progress for all lose conditions (danger level)
 */
export function getLoseProgress(
  objectives: GameObjectives,
  state: GameState,
  cryptoState: CryptoEconomyState,
): { id: string; name: string; progress: number; icon: string }[] {
  return objectives.loseConditions.map(condition => ({
    id: condition.id,
    name: condition.name,
    progress: condition.progress(state, cryptoState, objectives.tracking),
    icon: condition.icon,
  }));
}

// =============================================================================
// COBIE MESSAGES - Sardonic commentary for game end
// =============================================================================

export const COBIE_WIN_MESSAGES: Record<string, string[]> = {
  tvl_millionaire: [
    "Congratulations, you've made it to the big leagues. Now you can finally afford to lose it all in style.",
    "A million dollars in TVL? That's cute. Some guys lose that much before breakfast.",
    "Welcome to the millionaire club. The exit liquidity thanks you for your service.",
  ],
  survivor: [
    "100 days without blowing up? In crypto, that's basically a lifetime achievement.",
    "You survived longer than most crypto funds. Not saying much, but still.",
    "Most projects don't last 100 days. You're either smart or lucky. Probably lucky.",
  ],
  metropolis: [
    "10,000 people live in your crypto city now. They have no idea what they've signed up for.",
    "A city of 10,000 crypto enthusiasts. I'm sure nothing could go wrong.",
    "Congratulations on building a metropolis. Now everyone can watch each other get rugged together.",
  ],
  crypto_baron: [
    "50 crypto buildings? You've built more than most VCs have dumped on.",
    "That's a lot of buildings. I hope you kept track of which ones are actually solvent.",
    "50 buildings standing. For now. The rugs haven't started yet.",
  ],
};

export const COBIE_LOSE_MESSAGES: Record<string, string[]> = {
  bankruptcy: [
    "Zero treasury for too long. Classic crypto moment. At least you're not alone.",
    "Bankruptcy! You've officially experienced the full crypto experience.",
    "Ran out of money? Have you considered pivoting to a meme coin?",
  ],
  rugged_out: [
    "All buildings rugged. This is why we can't have nice things in crypto.",
    "Every single building gone. That's actually impressive. Most people only get half-rugged.",
    "Congratulations, you've been completely rugged. Welcome to the club.",
  ],
  unhappy_citizens: [
    "Your citizens are so unhappy they're probably starting their own competing chain.",
    "Civil unrest in a crypto city? Shocking. Truly unprecedented.",
    "The citizens revolted. Can't really blame them, to be honest.",
  ],
};

/**
 * Get a random Cobie message for the game end
 */
export function getCobieEndMessage(conditionId: string, isVictory: boolean): string {
  const messages = isVictory 
    ? COBIE_WIN_MESSAGES[conditionId] 
    : COBIE_LOSE_MESSAGES[conditionId];
  
  if (!messages || messages.length === 0) {
    return isVictory 
      ? "You won. Somehow. Don't let it go to your head."
      : "You lost. It happens. Usually more than once in crypto.";
  }
  
  return messages[Math.floor(Math.random() * messages.length)];
}

// =============================================================================
// GAME END STATS
// =============================================================================

export interface GameEndStats {
  daysSurvived: number;
  peakTVL: number;
  peakPopulation: number;
  peakBuildingCount: number;
  finalTreasury: number;
  finalTVL: number;
  finalPopulation: number;
  finalBuildingCount: number;
  totalYieldEarned: number;
}

/**
 * Calculate game end statistics
 */
export function calculateGameEndStats(
  state: GameState,
  cryptoState: CryptoEconomyState,
  tracking: ObjectiveTracking,
): GameEndStats {
  return {
    daysSurvived: tracking.gameDays,
    peakTVL: tracking.peakTVL,
    peakPopulation: tracking.peakPopulation,
    peakBuildingCount: tracking.peakBuildingCount,
    finalTreasury: cryptoState.treasury,
    finalTVL: cryptoState.tvl,
    finalPopulation: state.stats.population,
    finalBuildingCount: cryptoState.buildingCount,
    totalYieldEarned: cryptoState.totalYield,
  };
}
