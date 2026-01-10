/**
 * Prestige System (Issue #45)
 * 
 * Implements a prestige/reset mechanic that allows players to restart
 * with permanent bonuses earned from previous runs.
 */

// =============================================================================
// TYPES
// =============================================================================

export type PrestigeEffectType = 
  | 'yield_multiplier'
  | 'starting_treasury'
  | 'rug_resistance'
  | 'unlock_building'
  | 'speed_boost';

export type PrestigeEffect = 
  | { type: 'yield_multiplier'; value: number }
  | { type: 'starting_treasury'; value: number }
  | { type: 'rug_resistance'; value: number }
  | { type: 'unlock_building'; buildingId: string }
  | { type: 'speed_boost'; value: number };

export interface PrestigeBonus {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: PrestigeEffect;
  purchased: boolean;
  icon: string;
}

export interface PrestigeState {
  level: number;
  totalResets: number;
  lifetimeEarnings: number;
  unlockedBonuses: PrestigeBonus[];
  prestigePoints: number;
  lastPrestigeAt: number | null;
  prestigeHistory: PrestigeHistoryEntry[];
}

export interface PrestigeHistoryEntry {
  timestamp: number;
  tvlAtReset: number;
  daysSurvived: number;
  pointsEarned: number;
}

// =============================================================================
// PRESTIGE BONUSES DEFINITIONS
// =============================================================================

export const PRESTIGE_BONUSES: Omit<PrestigeBonus, 'purchased'>[] = [
  {
    id: 'yield_boost_1',
    name: 'Yield Boost I',
    description: '+5% base yield on all crypto buildings',
    cost: 10,
    effect: { type: 'yield_multiplier', value: 1.05 },
    icon: '📈',
  },
  {
    id: 'yield_boost_2',
    name: 'Yield Boost II',
    description: '+10% base yield on all crypto buildings',
    cost: 25,
    effect: { type: 'yield_multiplier', value: 1.10 },
    icon: '📈',
  },
  {
    id: 'rich_start_1',
    name: 'Rich Start I',
    description: '+$10k starting treasury',
    cost: 15,
    effect: { type: 'starting_treasury', value: 10000 },
    icon: '💰',
  },
  {
    id: 'rich_start_2',
    name: 'Rich Start II',
    description: '+$25k starting treasury',
    cost: 35,
    effect: { type: 'starting_treasury', value: 25000 },
    icon: '💰',
  },
  {
    id: 'diamond_hands',
    name: 'Diamond Hands',
    description: '-10% rug pull losses',
    cost: 20,
    effect: { type: 'rug_resistance', value: 0.10 },
    icon: '💎',
  },
  {
    id: 'whale_status',
    name: 'Whale Status',
    description: 'Unlock special whale-tier buildings',
    cost: 50,
    effect: { type: 'unlock_building', buildingId: 'whale_tower' },
    icon: '🐋',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: '+10% max simulation speed',
    cost: 25,
    effect: { type: 'speed_boost', value: 1.10 },
    icon: '⚡',
  },
];

// =============================================================================
// PRESTIGE CONFIGURATION
// =============================================================================

export const PRESTIGE_CONFIG = {
  /** Minimum TVL required to prestige */
  MIN_TVL_TO_PRESTIGE: 100000,
  /** Divisor for TVL in points calculation: sqrt(TVL / divisor) */
  TVL_DIVISOR: 1000,
  /** Divisor for days in points calculation: days / divisor */
  DAYS_DIVISOR: 10,
} as const;

// =============================================================================
// PRESTIGE CALCULATIONS
// =============================================================================

/**
 * Calculate prestige points earned from a reset
 * Formula: sqrt(TVL_at_reset / 1000) + (days_survived / 10)
 */
export function calculatePrestigePoints(tvl: number, daysSurvived: number): number {
  const tvlComponent = Math.sqrt(tvl / PRESTIGE_CONFIG.TVL_DIVISOR);
  const daysComponent = daysSurvived / PRESTIGE_CONFIG.DAYS_DIVISOR;
  return Math.floor(tvlComponent + daysComponent);
}

/**
 * Check if player can prestige (meets minimum requirements)
 */
export function canPrestige(tvl: number): boolean {
  return tvl >= PRESTIGE_CONFIG.MIN_TVL_TO_PRESTIGE;
}

/**
 * Get potential points if player prestiges now
 */
export function getPrestigePointsPreview(tvl: number, daysSurvived: number): {
  canPrestige: boolean;
  pointsToEarn: number;
  tvlShortfall: number;
} {
  const meetsRequirement = canPrestige(tvl);
  const pointsToEarn = meetsRequirement ? calculatePrestigePoints(tvl, daysSurvived) : 0;
  const tvlShortfall = meetsRequirement ? 0 : PRESTIGE_CONFIG.MIN_TVL_TO_PRESTIGE - tvl;
  
  return {
    canPrestige: meetsRequirement,
    pointsToEarn,
    tvlShortfall,
  };
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Create initial prestige state
 */
export function createInitialPrestigeState(): PrestigeState {
  return {
    level: 0,
    totalResets: 0,
    lifetimeEarnings: 0,
    unlockedBonuses: PRESTIGE_BONUSES.map(b => ({ ...b, purchased: false })),
    prestigePoints: 0,
    lastPrestigeAt: null,
    prestigeHistory: [],
  };
}

/**
 * Execute a prestige reset
 * Returns new prestige state with earned points
 */
export function executePrestige(
  currentState: PrestigeState,
  tvl: number,
  daysSurvived: number
): PrestigeState {
  if (!canPrestige(tvl)) {
    return currentState;
  }
  
  const pointsEarned = calculatePrestigePoints(tvl, daysSurvived);
  
  const historyEntry: PrestigeHistoryEntry = {
    timestamp: Date.now(),
    tvlAtReset: tvl,
    daysSurvived,
    pointsEarned,
  };
  
  return {
    ...currentState,
    level: currentState.level + 1,
    totalResets: currentState.totalResets + 1,
    lifetimeEarnings: currentState.lifetimeEarnings + tvl,
    prestigePoints: currentState.prestigePoints + pointsEarned,
    lastPrestigeAt: Date.now(),
    prestigeHistory: [...currentState.prestigeHistory, historyEntry].slice(-10), // Keep last 10
  };
}

/**
 * Purchase a prestige bonus
 */
export function purchaseBonus(
  state: PrestigeState,
  bonusId: string
): { success: boolean; state: PrestigeState; error?: string } {
  const bonusIndex = state.unlockedBonuses.findIndex(b => b.id === bonusId);
  
  if (bonusIndex === -1) {
    return { success: false, state, error: 'Bonus not found' };
  }
  
  const bonus = state.unlockedBonuses[bonusIndex];
  
  if (bonus.purchased) {
    return { success: false, state, error: 'Already purchased' };
  }
  
  if (state.prestigePoints < bonus.cost) {
    return { success: false, state, error: 'Not enough points' };
  }
  
  // Create new bonuses array with updated purchase status
  const updatedBonuses = [...state.unlockedBonuses];
  updatedBonuses[bonusIndex] = { ...bonus, purchased: true };
  
  const newState: PrestigeState = {
    ...state,
    prestigePoints: state.prestigePoints - bonus.cost,
    unlockedBonuses: updatedBonuses,
  };
  
  return { success: true, state: newState };
}

/**
 * Get all active (purchased) bonuses
 */
export function getActiveBonuses(state: PrestigeState): PrestigeBonus[] {
  return state.unlockedBonuses.filter(b => b.purchased);
}

/**
 * Get total yield multiplier from all purchased bonuses
 */
export function getTotalYieldMultiplier(state: PrestigeState): number {
  const activeBonuses = getActiveBonuses(state);
  let multiplier = 1.0;
  
  for (const bonus of activeBonuses) {
    if (bonus.effect.type === 'yield_multiplier') {
      multiplier *= bonus.effect.value;
    }
  }
  
  return multiplier;
}

/**
 * Get total starting treasury bonus from all purchased bonuses
 */
export function getTotalStartingTreasuryBonus(state: PrestigeState): number {
  const activeBonuses = getActiveBonuses(state);
  let bonus = 0;
  
  for (const b of activeBonuses) {
    if (b.effect.type === 'starting_treasury') {
      bonus += b.effect.value;
    }
  }
  
  return bonus;
}

/**
 * Get total rug resistance from all purchased bonuses
 */
export function getTotalRugResistance(state: PrestigeState): number {
  const activeBonuses = getActiveBonuses(state);
  let resistance = 0;
  
  for (const bonus of activeBonuses) {
    if (bonus.effect.type === 'rug_resistance') {
      resistance += bonus.effect.value;
    }
  }
  
  // Cap at 50% resistance
  return Math.min(resistance, 0.5);
}

/**
 * Get speed boost multiplier from all purchased bonuses
 */
export function getSpeedBoostMultiplier(state: PrestigeState): number {
  const activeBonuses = getActiveBonuses(state);
  let multiplier = 1.0;
  
  for (const bonus of activeBonuses) {
    if (bonus.effect.type === 'speed_boost') {
      multiplier *= bonus.effect.value;
    }
  }
  
  return multiplier;
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

const STORAGE_KEY = 'cryptoCityPrestige';

/**
 * Load prestige state from localStorage
 */
export function loadPrestigeState(): PrestigeState {
  if (typeof window === 'undefined') {
    return createInitialPrestigeState();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PrestigeState;
      
      // Validate structure
      if (
        typeof parsed.level === 'number' &&
        typeof parsed.prestigePoints === 'number' &&
        Array.isArray(parsed.unlockedBonuses)
      ) {
        // Merge with current bonus definitions to handle new bonuses added in updates
        const mergedBonuses = PRESTIGE_BONUSES.map(def => {
          const saved = parsed.unlockedBonuses.find(b => b.id === def.id);
          return saved ? { ...def, purchased: saved.purchased } : { ...def, purchased: false };
        });
        
        return {
          ...parsed,
          unlockedBonuses: mergedBonuses,
        };
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  return createInitialPrestigeState();
}

/**
 * Save prestige state to localStorage
 */
export function savePrestigeState(state: PrestigeState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear prestige state (for testing or full reset)
 */
export function clearPrestigeState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
