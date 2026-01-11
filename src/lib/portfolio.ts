/**
 * Portfolio Balancing System (Issue #62)
 *
 * Strategic portfolio management with hedging mechanics:
 * - Chain diversity tracking and bonuses
 * - Tier balance analysis
 * - Risk exposure calculation
 * - Hedging mechanics (options, insurance)
 * - Diversity bonuses for spreading across chains/tiers
 */

import type { PlacedCryptoBuilding, CryptoChain, CryptoTier } from '@/games/isocity/crypto/types';
import { getCryptoBuilding } from '@/games/isocity/crypto/buildings';

// =============================================================================
// PORTFOLIO INTERFACES
// =============================================================================

/**
 * Overall portfolio balance metrics
 */
export interface PortfolioBalance {
  /** How spread across chains (0-1, higher = more diverse) */
  chainDiversity: number;
  /** How balanced across tiers (0-1, higher = more balanced) */
  tierBalance: number;
  /** Overall portfolio risk (0-1, higher = riskier) */
  riskExposure: number;
  /** How well hedged (0-1, higher = better protected) */
  hedgeEfficiency: number;
}

/**
 * Distribution of buildings by chain
 */
export interface ChainDistribution {
  [chain: string]: {
    count: number;
    yield: number;
    risk: number;
  };
}

/**
 * Distribution of buildings by tier
 */
export interface TierDistribution {
  [tier: string]: {
    count: number;
    yield: number;
    risk: number;
  };
}

/**
 * Hedge position for portfolio protection
 */
export interface HedgePosition {
  id: string;
  type: 'put' | 'call' | 'insurance';
  coverage: number; // % of portfolio covered (0-1)
  cost: number; // Daily cost
  protection: number; // Payout multiplier if triggered
  expiresAt: number; // Game day
}

/**
 * Available hedge for purchase
 */
export interface AvailableHedge {
  id: string;
  name: string;
  description: string;
  type: 'put' | 'call' | 'insurance';
  coverage: number;
  dailyCost: number;
  upfrontCost: number;
  protection: number;
  duration: number; // Days until expiration
}

// =============================================================================
// DIVERSITY BONUSES
// =============================================================================

/**
 * Diversity bonus configuration
 */
export const DIVERSITY_BONUSES = {
  // Chain diversity (different blockchains)
  chains: [
    { threshold: 3, bonus: 0.05 }, // 5% yield bonus at 3+ chains
    { threshold: 5, bonus: 0.10 }, // 10% at 5+ chains
    { threshold: 8, bonus: 0.15 }, // 15% at 8+ chains (all major)
  ],

  // Tier diversity (different risk tiers)
  tiers: [
    { threshold: 3, bonus: 0.05 }, // Have 3+ tiers
    { threshold: 4, bonus: 0.10 }, // Have all 4 tiers
  ],

  // Balance bonus (no single chain > 40% of portfolio)
  balance: {
    threshold: 0.4, // Max 40% per chain
    bonus: 0.10, // +10% if balanced
  },
} as const;

/**
 * Available hedge types for purchase
 */
export const AVAILABLE_HEDGES: AvailableHedge[] = [
  {
    id: 'put_basic',
    name: 'Basic Put Option',
    description: 'Pays out when market sentiment drops below 30',
    type: 'put',
    coverage: 0.25,
    dailyCost: 100,
    upfrontCost: 2000,
    protection: 1.5,
    duration: 30,
  },
  {
    id: 'put_advanced',
    name: 'Advanced Put Option',
    description: 'Pays out when market sentiment drops below 40',
    type: 'put',
    coverage: 0.50,
    dailyCost: 250,
    upfrontCost: 5000,
    protection: 2.0,
    duration: 30,
  },
  {
    id: 'insurance_basic',
    name: 'Rug Pull Insurance',
    description: 'Covers 50% of rug pull losses',
    type: 'insurance',
    coverage: 0.50,
    dailyCost: 150,
    upfrontCost: 3000,
    protection: 0.5, // Recover 50% of loss
    duration: 60,
  },
  {
    id: 'insurance_premium',
    name: 'Premium Insurance',
    description: 'Covers 80% of rug pull losses',
    type: 'insurance',
    coverage: 0.80,
    dailyCost: 400,
    upfrontCost: 8000,
    protection: 0.8, // Recover 80% of loss
    duration: 60,
  },
  {
    id: 'call_basic',
    name: 'Basic Call Option',
    description: 'Bonus yields when sentiment exceeds 70',
    type: 'call',
    coverage: 0.25,
    dailyCost: 75,
    upfrontCost: 1500,
    protection: 1.25, // 25% bonus yield
    duration: 30,
  },
];

// =============================================================================
// PORTFOLIO ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze portfolio and return balance metrics
 */
export function analyzePortfolio(buildings: PlacedCryptoBuilding[]): PortfolioBalance {
  if (buildings.length === 0) {
    return {
      chainDiversity: 0,
      tierBalance: 0,
      riskExposure: 0,
      hedgeEfficiency: 0,
    };
  }

  const chainDist = getChainDistribution(buildings);
  const tierDist = getTierDistribution(buildings);

  // Calculate chain diversity (Simpson's diversity index)
  const chainDiversity = calculateDiversityIndex(chainDist);

  // Calculate tier balance (evenness)
  const tierBalance = calculateTierBalance(tierDist);

  // Calculate risk exposure
  const riskExposure = calculateRiskExposure(buildings);

  // Hedge efficiency is 0 by default (updated when hedges are active)
  const hedgeEfficiency = 0;

  return {
    chainDiversity,
    tierBalance,
    riskExposure,
    hedgeEfficiency,
  };
}

/**
 * Get distribution of buildings by chain
 */
export function getChainDistribution(buildings: PlacedCryptoBuilding[]): ChainDistribution {
  const distribution: ChainDistribution = {};

  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.chain) continue;

    const chain = def.crypto.chain;
    if (!distribution[chain]) {
      distribution[chain] = { count: 0, yield: 0, risk: 0 };
    }

    distribution[chain].count++;
    distribution[chain].yield += def.crypto.effects?.yieldRate || 0;
    distribution[chain].risk += def.crypto.effects?.rugRisk || 0;
  }

  return distribution;
}

/**
 * Get distribution of buildings by tier
 */
export function getTierDistribution(buildings: PlacedCryptoBuilding[]): TierDistribution {
  const distribution: TierDistribution = {};

  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.tier) continue;

    const tier = def.crypto.tier;
    if (!distribution[tier]) {
      distribution[tier] = { count: 0, yield: 0, risk: 0 };
    }

    distribution[tier].count++;
    distribution[tier].yield += def.crypto.effects?.yieldRate || 0;
    distribution[tier].risk += def.crypto.effects?.rugRisk || 0;
  }

  return distribution;
}

/**
 * Calculate Simpson's diversity index for chain distribution
 * Returns 0-1 where 1 is maximum diversity
 */
function calculateDiversityIndex(distribution: ChainDistribution): number {
  const chains = Object.values(distribution);
  if (chains.length === 0) return 0;

  const totalCount = chains.reduce((sum, c) => sum + c.count, 0);
  if (totalCount === 0) return 0;

  // Simpson's diversity index: 1 - sum((n/N)^2)
  let sumSquaredProportions = 0;
  for (const chain of chains) {
    const proportion = chain.count / totalCount;
    sumSquaredProportions += proportion * proportion;
  }

  return 1 - sumSquaredProportions;
}

/**
 * Calculate tier balance (how evenly distributed across tiers)
 * Returns 0-1 where 1 is perfectly balanced
 */
function calculateTierBalance(distribution: TierDistribution): number {
  const tiers = Object.values(distribution);
  if (tiers.length <= 1) return tiers.length > 0 ? 0.25 : 0;

  const totalCount = tiers.reduce((sum, t) => sum + t.count, 0);
  if (totalCount === 0) return 0;

  // Calculate coefficient of variation (CV)
  // Lower CV = more balanced
  const mean = totalCount / tiers.length;
  const variance =
    tiers.reduce((sum, t) => sum + Math.pow(t.count - mean, 2), 0) / tiers.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Convert CV to balance score (0-1, where 1 = perfectly balanced)
  // CV of 0 = perfectly balanced = score of 1
  // CV of 1+ = highly unbalanced = score approaches 0
  return Math.max(0, 1 - cv);
}

/**
 * Calculate overall portfolio risk exposure
 * Returns 0-1 where 1 is maximum risk
 */
function calculateRiskExposure(buildings: PlacedCryptoBuilding[]): number {
  if (buildings.length === 0) return 0;

  let totalRisk = 0;
  let totalYield = 0;

  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const rugRisk = def.crypto.effects.rugRisk || 0;
    const yieldRate = def.crypto.effects.yieldRate || 0;

    totalRisk += rugRisk;
    totalYield += yieldRate;
  }

  // Risk exposure = weighted average risk, normalized to 0-1
  // Higher rug risk = higher exposure
  // Average rug risk across buildings, scaled to 0-1 range
  const avgRisk = totalRisk / buildings.length;

  // Normalize: typical rug risk ranges from 0.001 to 0.15
  // Scale so 0.075 (mid-range) = 0.5 exposure
  return Math.min(1, avgRisk / 0.15);
}

// =============================================================================
// DIVERSITY BONUS CALCULATION
// =============================================================================

/**
 * Calculate total diversity bonus for portfolio
 * Returns bonus multiplier (0-0.35)
 */
export function calculateDiversityBonus(buildings: PlacedCryptoBuilding[]): {
  chainBonus: number;
  tierBonus: number;
  balanceBonus: number;
  totalBonus: number;
  chainCount: number;
  tierCount: number;
  isBalanced: boolean;
} {
  const chainDist = getChainDistribution(buildings);
  const tierDist = getTierDistribution(buildings);

  const chainCount = Object.keys(chainDist).length;
  const tierCount = Object.keys(tierDist).length;

  // Calculate chain bonus
  let chainBonus = 0;
  for (const { threshold, bonus } of DIVERSITY_BONUSES.chains) {
    if (chainCount >= threshold) {
      chainBonus = bonus;
    }
  }

  // Calculate tier bonus
  let tierBonus = 0;
  for (const { threshold, bonus } of DIVERSITY_BONUSES.tiers) {
    if (tierCount >= threshold) {
      tierBonus = bonus;
    }
  }

  // Calculate balance bonus (no chain > 40%)
  const totalBuildings = buildings.length;
  let isBalanced = true;
  if (totalBuildings > 0) {
    for (const chain of Object.values(chainDist)) {
      if (chain.count / totalBuildings > DIVERSITY_BONUSES.balance.threshold) {
        isBalanced = false;
        break;
      }
    }
  }
  const balanceBonus = isBalanced && totalBuildings >= 5 ? DIVERSITY_BONUSES.balance.bonus : 0;

  const totalBonus = chainBonus + tierBonus + balanceBonus;

  return {
    chainBonus,
    tierBonus,
    balanceBonus,
    totalBonus,
    chainCount,
    tierCount,
    isBalanced,
  };
}

/**
 * Get progress toward next diversity bonus
 */
export function getDiversityProgress(buildings: PlacedCryptoBuilding[]): {
  chainProgress: { current: number; next: number; bonus: number } | null;
  tierProgress: { current: number; next: number; bonus: number } | null;
  balanceProgress: { needed: number; bonus: number } | null;
} {
  const chainDist = getChainDistribution(buildings);
  const tierDist = getTierDistribution(buildings);

  const chainCount = Object.keys(chainDist).length;
  const tierCount = Object.keys(tierDist).length;

  // Find next chain threshold
  let chainProgress = null;
  for (const { threshold, bonus } of DIVERSITY_BONUSES.chains) {
    if (chainCount < threshold) {
      chainProgress = { current: chainCount, next: threshold, bonus };
      break;
    }
  }

  // Find next tier threshold
  let tierProgress = null;
  for (const { threshold, bonus } of DIVERSITY_BONUSES.tiers) {
    if (tierCount < threshold) {
      tierProgress = { current: tierCount, next: threshold, bonus };
      break;
    }
  }

  // Balance progress
  const totalBuildings = buildings.length;
  const { isBalanced } = calculateDiversityBonus(buildings);
  let balanceProgress = null;
  if (!isBalanced && totalBuildings >= 5) {
    balanceProgress = {
      needed: Math.ceil(totalBuildings * DIVERSITY_BONUSES.balance.threshold),
      bonus: DIVERSITY_BONUSES.balance.bonus,
    };
  } else if (totalBuildings < 5) {
    balanceProgress = {
      needed: 5,
      bonus: DIVERSITY_BONUSES.balance.bonus,
    };
  }

  return { chainProgress, tierProgress, balanceProgress };
}

// =============================================================================
// HEDGING FUNCTIONS
// =============================================================================

/**
 * Create a new hedge position
 */
export function createHedgePosition(
  hedge: AvailableHedge,
  currentGameDay: number
): HedgePosition {
  return {
    id: `${hedge.id}_${Date.now()}`,
    type: hedge.type,
    coverage: hedge.coverage,
    cost: hedge.dailyCost,
    protection: hedge.protection,
    expiresAt: currentGameDay + hedge.duration,
  };
}

/**
 * Calculate total hedge efficiency from active positions
 */
export function calculateHedgeEfficiency(hedges: HedgePosition[]): number {
  if (hedges.length === 0) return 0;

  // Weighted average of coverage by protection
  let totalWeightedCoverage = 0;
  let totalWeight = 0;

  for (const hedge of hedges) {
    const weight = hedge.protection;
    totalWeightedCoverage += hedge.coverage * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  // Cap at 1.0
  return Math.min(1, totalWeightedCoverage / totalWeight);
}

/**
 * Calculate hedge payout when triggered
 */
export function calculateHedgePayout(
  hedges: HedgePosition[],
  lossAmount: number,
  triggerType: 'sentiment_drop' | 'rug_pull' | 'sentiment_rise'
): number {
  let totalPayout = 0;

  for (const hedge of hedges) {
    // Check if hedge type matches trigger
    const matches =
      (triggerType === 'sentiment_drop' && hedge.type === 'put') ||
      (triggerType === 'rug_pull' && hedge.type === 'insurance') ||
      (triggerType === 'sentiment_rise' && hedge.type === 'call');

    if (matches) {
      const coveredLoss = lossAmount * hedge.coverage;
      const payout = coveredLoss * hedge.protection;
      totalPayout += payout;
    }
  }

  return totalPayout;
}

/**
 * Get daily hedge cost total
 */
export function getDailyHedgeCost(hedges: HedgePosition[]): number {
  return hedges.reduce((sum, h) => sum + h.cost, 0);
}

/**
 * Filter expired hedges
 */
export function filterExpiredHedges(
  hedges: HedgePosition[],
  currentGameDay: number
): { active: HedgePosition[]; expired: HedgePosition[] } {
  const active: HedgePosition[] = [];
  const expired: HedgePosition[] = [];

  for (const hedge of hedges) {
    if (hedge.expiresAt > currentGameDay) {
      active.push(hedge);
    } else {
      expired.push(hedge);
    }
  }

  return { active, expired };
}

// =============================================================================
// STABLECOIN IMMUNITY CHECK
// =============================================================================

/**
 * Check if a building is sentiment immune (stablecoin)
 */
export function isSentimentImmune(buildingId: string): boolean {
  const def = getCryptoBuilding(buildingId);
  if (!def?.crypto?.effects) return false;

  // Check for sentimentImmune flag (typed in CryptoEffects interface)
  return def.crypto.effects.sentimentImmune === true;
}

/**
 * Calculate portfolio value protected from sentiment swings
 * (percentage of portfolio in sentiment-immune buildings)
 */
export function getSentimentProtectedRatio(buildings: PlacedCryptoBuilding[]): number {
  if (buildings.length === 0) return 0;

  let immuneCount = 0;
  for (const building of buildings) {
    if (isSentimentImmune(building.buildingId)) {
      immuneCount++;
    }
  }

  return immuneCount / buildings.length;
}
