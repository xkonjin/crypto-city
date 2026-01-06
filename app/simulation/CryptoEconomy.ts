// =============================================================================
// CRYPTO ECONOMY SIMULATION
// =============================================================================
// Manages the economic simulation for crypto city buildings.
// Handles yield generation, staking bonuses, market sentiment, and treasury.
//
// This module is called by the main game loop to update crypto economics
// each simulation tick. Pure functions for testability.

import {
  CryptoEconomyState,
  CryptoTier,
  GridCell,
} from '../components/game/types';
import { CryptoBuildingDefinition, ALL_CRYPTO_BUILDINGS } from '../data/cryptoBuildings';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default economy state for a new city
 */
export const DEFAULT_CRYPTO_ECONOMY: CryptoEconomyState = {
  treasury: 1000,                    // Starting tokens
  dailyYield: 0,                     // Calculated from buildings
  totalTVL: 0,                       // Combined building values
  marketSentiment: 50,               // Neutral (0 = fear, 100 = greed)
  globalYieldMultiplier: 1.0,        // Base multiplier
  globalVolatilityMultiplier: 1.0,   // Base volatility
  cryptoBuildingCount: 0,
  buildingsByTier: {
    degen: 0,
    retail: 0,
    whale: 0,
    institution: 0,
    shark: 0,       // Aggressive medium tier
    fish: 0,        // Small players tier
  },
  buildingsByChain: {},
  treasuryHistory: [1000],
  sentimentHistory: [50],
};

/**
 * Tier-based TVL values (how much "value" each tier represents)
 * Higher tiers represent larger total value locked
 */
const TIER_TVL_VALUES: Record<CryptoTier, number> = {
  fish: 50,          // Small players - minimal TVL
  degen: 100,        // High risk, low value
  retail: 500,       // Entry level
  shark: 1000,       // Aggressive medium players
  whale: 2000,       // High value
  institution: 10000, // Blue chip, massive TVL
};

/**
 * Sentiment thresholds for market conditions
 */
const SENTIMENT_THRESHOLDS = {
  EXTREME_FEAR: 20,
  FEAR: 35,
  NEUTRAL_LOW: 45,
  NEUTRAL_HIGH: 55,
  GREED: 65,
  EXTREME_GREED: 80,
};

// =============================================================================
// CORE ECONOMY FUNCTIONS
// =============================================================================

/**
 * Calculate the total daily yield from all crypto buildings
 * Takes into account building effects, staking bonuses, and market conditions
 *
 * @param buildings - Array of placed crypto buildings
 * @param state - Current economy state
 * @returns Total daily yield in tokens
 */
export function calculateDailyYield(
  buildings: CryptoBuildingDefinition[],
  state: CryptoEconomyState
): number {
  let totalYield = 0;
  
  for (const building of buildings) {
    const effects = building.crypto.effects;
    let buildingYield = effects.yieldRate || 0;
    
    // Add trading fees if applicable
    buildingYield += effects.tradingFees || 0;
    
    // Apply staking bonus from nearby buildings (simplified - could use zone system)
    const stakingBonus = calculateStakingBonus(building, buildings);
    buildingYield *= stakingBonus;
    
    // Apply global market multiplier
    buildingYield *= state.globalYieldMultiplier;
    
    // Apply sentiment modifier (-20% to +30% based on market conditions)
    const sentimentMod = getSentimentYieldModifier(state.marketSentiment);
    buildingYield *= sentimentMod;
    
    totalYield += buildingYield;
  }
  
  return Math.floor(totalYield);
}

/**
 * Calculate staking bonus from nearby synergistic buildings
 *
 * @param building - The building to calculate bonus for
 * @param allBuildings - All placed buildings
 * @returns Staking multiplier (1.0 = no bonus)
 */
function calculateStakingBonus(
  building: CryptoBuildingDefinition,
  allBuildings: CryptoBuildingDefinition[]
): number {
  let bonus = 1.0;
  const effects = building.crypto.effects;
  const synergies = effects.categorySynergy || [];
  const chainSynergies = effects.chainSynergy || [];
  
  // Count synergistic buildings
  let synergyCount = 0;
  for (const other of allBuildings) {
    if (other.id === building.id) continue;
    
    // Category synergy check
    if (synergies.includes(other.category)) {
      synergyCount++;
    }
    
    // Chain synergy check
    if (other.crypto.chain && chainSynergies.includes(other.crypto.chain)) {
      synergyCount++;
    }
  }
  
  // Each synergy provides diminishing bonus
  // 1st: +5%, 2nd: +4%, 3rd: +3%, etc.
  for (let i = 0; i < Math.min(synergyCount, 10); i++) {
    bonus += Math.max(0.01, 0.05 - (i * 0.01));
  }
  
  // Also apply building's own staking bonus to neighbors (reversed)
  if (effects.stakingBonus && effects.stakingBonus > 1) {
    // This building provides bonuses to others, not itself
  }
  
  return bonus;
}

/**
 * Get yield modifier based on market sentiment
 *
 * @param sentiment - Current sentiment (0-100)
 * @returns Yield multiplier (0.8 to 1.3)
 */
function getSentimentYieldModifier(sentiment: number): number {
  if (sentiment < SENTIMENT_THRESHOLDS.EXTREME_FEAR) {
    return 0.8;  // -20% during extreme fear
  } else if (sentiment < SENTIMENT_THRESHOLDS.FEAR) {
    return 0.9;  // -10% during fear
  } else if (sentiment < SENTIMENT_THRESHOLDS.NEUTRAL_LOW) {
    return 0.95; // -5% during mild fear
  } else if (sentiment <= SENTIMENT_THRESHOLDS.NEUTRAL_HIGH) {
    return 1.0;  // Normal during neutral
  } else if (sentiment <= SENTIMENT_THRESHOLDS.GREED) {
    return 1.1;  // +10% during greed
  } else if (sentiment <= SENTIMENT_THRESHOLDS.EXTREME_GREED) {
    return 1.2;  // +20% during high greed
  } else {
    return 1.3;  // +30% during extreme greed (bubble territory!)
  }
}

/**
 * Calculate total population boost from crypto buildings
 *
 * @param buildings - Array of placed crypto buildings
 * @returns Total population attracted by crypto buildings
 */
export function calculatePopulationBoost(buildings: CryptoBuildingDefinition[]): number {
  return buildings.reduce((total, building) => {
    return total + (building.crypto.effects.populationBoost || 0);
  }, 0);
}

/**
 * Calculate total happiness effect from crypto buildings
 *
 * @param buildings - Array of placed crypto buildings
 * @returns Net happiness effect (-100 to +100 range typical)
 */
export function calculateHappinessEffect(buildings: CryptoBuildingDefinition[]): number {
  return buildings.reduce((total, building) => {
    return total + (building.crypto.effects.happinessEffect || 0);
  }, 0);
}

/**
 * Calculate total prestige bonus from crypto buildings
 * Affects land value in surrounding areas
 *
 * @param buildings - Array of placed crypto buildings
 * @returns Total prestige points
 */
export function calculatePrestigeBonus(buildings: CryptoBuildingDefinition[]): number {
  return buildings.reduce((total, building) => {
    return total + (building.crypto.effects.prestigeBonus || 0);
  }, 0);
}

// =============================================================================
// MARKET SENTIMENT
// =============================================================================

/**
 * Update market sentiment based on various factors
 * Sentiment drifts toward 50 over time, but events can push it
 *
 * @param currentSentiment - Current sentiment value
 * @param events - Any active events affecting sentiment
 * @returns New sentiment value (clamped 0-100)
 */
export function updateMarketSentiment(
  currentSentiment: number,
  recentYieldChange: number,
  randomFactor: number = Math.random()
): number {
  let newSentiment = currentSentiment;
  
  // Natural drift toward neutral (50)
  const driftStrength = 0.02;
  if (currentSentiment > 50) {
    newSentiment -= (currentSentiment - 50) * driftStrength;
  } else if (currentSentiment < 50) {
    newSentiment += (50 - currentSentiment) * driftStrength;
  }
  
  // Yield change affects sentiment
  // Positive yields increase greed, negative increases fear
  newSentiment += recentYieldChange * 0.1;
  
  // Random market noise (-2 to +2)
  newSentiment += (randomFactor - 0.5) * 4;
  
  // Clamp to valid range
  return Math.max(0, Math.min(100, newSentiment));
}

/**
 * Get a human-readable sentiment label
 *
 * @param sentiment - Current sentiment value
 * @returns Label like "Extreme Fear", "Neutral", "Extreme Greed"
 */
export function getSentimentLabel(sentiment: number): string {
  if (sentiment < SENTIMENT_THRESHOLDS.EXTREME_FEAR) return 'Extreme Fear';
  if (sentiment < SENTIMENT_THRESHOLDS.FEAR) return 'Fear';
  if (sentiment < SENTIMENT_THRESHOLDS.NEUTRAL_LOW) return 'Mild Fear';
  if (sentiment <= SENTIMENT_THRESHOLDS.NEUTRAL_HIGH) return 'Neutral';
  if (sentiment <= SENTIMENT_THRESHOLDS.GREED) return 'Greed';
  if (sentiment <= SENTIMENT_THRESHOLDS.EXTREME_GREED) return 'High Greed';
  return 'Extreme Greed';
}

/**
 * Get sentiment color for UI display
 *
 * @param sentiment - Current sentiment value
 * @returns Hex color code
 */
export function getSentimentColor(sentiment: number): string {
  if (sentiment < SENTIMENT_THRESHOLDS.EXTREME_FEAR) return '#FF0000';  // Red
  if (sentiment < SENTIMENT_THRESHOLDS.FEAR) return '#FF6B35';          // Orange-red
  if (sentiment < SENTIMENT_THRESHOLDS.NEUTRAL_LOW) return '#FFA500';   // Orange
  if (sentiment <= SENTIMENT_THRESHOLDS.NEUTRAL_HIGH) return '#FFD700'; // Yellow
  if (sentiment <= SENTIMENT_THRESHOLDS.GREED) return '#9ACD32';        // Yellow-green
  if (sentiment <= SENTIMENT_THRESHOLDS.EXTREME_GREED) return '#00FF00'; // Green
  return '#00FF88';  // Neon green (bubble!)
}

// =============================================================================
// BUILDING ANALYSIS
// =============================================================================

/**
 * Analyze placed crypto buildings and return statistics
 *
 * @param grid - The game grid
 * @returns Building statistics
 */
export function analyzeCryptoBuildings(grid: GridCell[][]): {
  buildings: CryptoBuildingDefinition[];
  count: number;
  byTier: Record<CryptoTier, number>;
  byChain: Record<string, number>;
  byCategory: Record<string, number>;
  totalTVL: number;
} {
  const buildings: CryptoBuildingDefinition[] = [];
  // Initialize tier counts for all crypto tiers
  const byTier: Record<CryptoTier, number> = { 
    degen: 0, 
    retail: 0, 
    whale: 0, 
    institution: 0,
    shark: 0,
    fish: 0,
  };
  const byChain: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let totalTVL = 0;
  
  // Scan grid for crypto buildings
  for (const row of grid) {
    for (const cell of row) {
      if (cell.buildingId && cell.isOrigin) {
        const cryptoBuilding = ALL_CRYPTO_BUILDINGS[cell.buildingId];
        if (cryptoBuilding) {
          buildings.push(cryptoBuilding);
          
          // Count by tier
          byTier[cryptoBuilding.crypto.tier]++;
          
          // Count by chain
          const chain = cryptoBuilding.crypto.chain || 'unknown';
          byChain[chain] = (byChain[chain] || 0) + 1;
          
          // Count by category
          byCategory[cryptoBuilding.category] = (byCategory[cryptoBuilding.category] || 0) + 1;
          
          // Calculate TVL contribution
          totalTVL += TIER_TVL_VALUES[cryptoBuilding.crypto.tier];
        }
      }
    }
  }
  
  return {
    buildings,
    count: buildings.length,
    byTier,
    byChain,
    byCategory,
    totalTVL,
  };
}

// =============================================================================
// ECONOMY TICK
// =============================================================================

/**
 * Main economy tick function - called each simulation update
 * Updates treasury, calculates yields, adjusts sentiment
 *
 * @param state - Current economy state
 * @param grid - Game grid
 * @param deltaTime - Time since last tick (for hourly/daily calculations)
 * @returns New economy state
 */
export function economyTick(
  state: CryptoEconomyState,
  grid: GridCell[][],
  ticksPerDay: number = 24
): CryptoEconomyState {
  // Analyze current buildings
  const analysis = analyzeCryptoBuildings(grid);
  
  // Calculate new daily yield
  const dailyYield = calculateDailyYield(analysis.buildings, state);
  
  // Calculate yield per tick
  const yieldPerTick = dailyYield / ticksPerDay;
  
  // Update treasury
  const newTreasury = state.treasury + yieldPerTick;
  
  // Calculate yield change for sentiment
  const yieldChange = dailyYield - state.dailyYield;
  
  // Update sentiment
  const newSentiment = updateMarketSentiment(state.marketSentiment, yieldChange);
  
  // Build new state
  const newState: CryptoEconomyState = {
    ...state,
    treasury: Math.floor(newTreasury),
    dailyYield,
    totalTVL: analysis.totalTVL,
    marketSentiment: newSentiment,
    cryptoBuildingCount: analysis.count,
    buildingsByTier: analysis.byTier,
    buildingsByChain: analysis.byChain,
    // Update history (keep last 100 entries)
    treasuryHistory: [...state.treasuryHistory.slice(-99), Math.floor(newTreasury)],
    sentimentHistory: [...state.sentimentHistory.slice(-99), newSentiment],
  };
  
  return newState;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format a token amount for display (e.g., 1000 -> "1K", 1000000 -> "1M")
 *
 * @param amount - Raw token amount
 * @returns Formatted string
 */
export function formatTokenAmount(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
}

/**
 * Calculate the risk level of the current building portfolio
 *
 * @param buildings - Array of placed crypto buildings
 * @returns Risk level 0-100 (higher = riskier)
 */
export function calculatePortfolioRisk(buildings: CryptoBuildingDefinition[]): number {
  if (buildings.length === 0) return 0;
  
  let totalRisk = 0;
  let totalWeight = 0;
  
  for (const building of buildings) {
    const effects = building.crypto.effects;
    const tier = building.crypto.tier;
    
    // Base risk by tier - higher values mean more risk
    const tierRisk: Record<CryptoTier, number> = {
      degen: 80,        // Highest risk - meme tier
      fish: 50,         // Small players, moderate-high risk
      retail: 40,       // Entry level, moderate risk
      shark: 35,        // Aggressive but calculated
      whale: 25,        // High value, lower risk
      institution: 10,  // Blue chip, lowest risk
    };
    
    let buildingRisk = tierRisk[tier];
    
    // Increase risk based on volatility
    buildingRisk += (effects.volatility || 0) * 50;
    
    // Increase risk based on rug/hack risk
    buildingRisk += (effects.rugRisk || 0) * 100;
    buildingRisk += (effects.hackRisk || 0) * 80;
    
    // Weight by TVL (bigger buildings matter more)
    const weight = TIER_TVL_VALUES[tier];
    totalRisk += buildingRisk * weight;
    totalWeight += weight;
  }
  
  return Math.min(100, totalRisk / totalWeight);
}

/**
 * Get building statistics for dashboard display
 *
 * @param state - Current economy state
 * @param buildings - Array of placed crypto buildings
 * @returns Dashboard stats object
 */
export function getDashboardStats(
  state: CryptoEconomyState,
  buildings: CryptoBuildingDefinition[]
): {
  treasury: string;
  dailyYield: string;
  tvl: string;
  sentiment: string;
  sentimentColor: string;
  buildingCount: number;
  riskLevel: number;
  topChain: string;
  populationBoost: number;
  happinessEffect: number;
} {
  const risk = calculatePortfolioRisk(buildings);
  const topChain = Object.entries(state.buildingsByChain)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';
  
  return {
    treasury: formatTokenAmount(state.treasury),
    dailyYield: `+${formatTokenAmount(state.dailyYield)}/day`,
    tvl: formatTokenAmount(state.totalTVL),
    sentiment: getSentimentLabel(state.marketSentiment),
    sentimentColor: getSentimentColor(state.marketSentiment),
    buildingCount: state.cryptoBuildingCount,
    riskLevel: Math.round(risk),
    topChain: topChain.charAt(0).toUpperCase() + topChain.slice(1),
    populationBoost: calculatePopulationBoost(buildings),
    happinessEffect: calculateHappinessEffect(buildings),
  };
}

