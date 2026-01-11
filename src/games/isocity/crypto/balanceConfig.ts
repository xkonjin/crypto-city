/**
 * Balance Configuration Constants
 * 
 * Centralized configuration for game balance parameters.
 * These values control the risk/reward ratios for different building tiers.
 * 
 * Issue #70: Rebalance degen buildings to reduce meta dominance
 */

/**
 * Balance configuration for crypto building economy
 */
export const BALANCE_CONFIG = {
  // Cost multipliers by tier
  DEGEN_COST_MULTIPLIER: 2.0,        // Degen buildings cost 2x base
  WHALE_COST_MULTIPLIER: 1.0,        // Whale buildings unchanged
  INSTITUTION_COST_MULTIPLIER: 1.0,  // Institution buildings unchanged
  RETAIL_COST_MULTIPLIER: 1.0,       // Retail buildings unchanged
  
  // Risk multipliers by tier
  DEGEN_RISK_MULTIPLIER: 1.5,        // Degen rug risk increased 50%
  
  // Cascading failure (contagion) settings
  CONTAGION_ENABLED: true,
  CONTAGION_CHANCE: 0.2,             // 20% chance adjacent degens also rug
  CONTAGION_RADIUS: 2,               // Affects buildings within 2 tiles
  CONTAGION_IMMUNE_TIERS: ['institution'] as const, // Institution immune
  
  // Institution stability bonus
  INSTITUTION_STABILITY_THRESHOLD: 5, // Need 5+ institution buildings
  DIVERSITY_BONUS: 0.1,               // +10% yield bonus when diversified
  INSTITUTION_RUG_REDUCTION: 0.5,     // Institutions have 50% less rug risk
  
  // Average rug risk for comparative display (calculated from base buildings)
  AVERAGE_RUG_RISK: 0.02,             // ~2% is considered average
  
  // Yield adjustment ranges by tier (for tooltip display)
  TIER_YIELD_RANGES: {
    institution: { min: 5, max: 15 },
    whale: { min: 10, max: 25 },
    degen: { min: 12, max: 32 },  // Reduced from 15-40 (20% reduction)
    retail: { min: 3, max: 10 },
  },
  
  // Risk ranges by tier (for tooltip display)
  TIER_RISK_RANGES: {
    institution: { min: 0.001, max: 0.005 },
    whale: { min: 0.005, max: 0.02 },
    degen: { min: 0.05, max: 0.15 },  // Increased from 0.02-0.1 (50% increase)
    retail: { min: 0.001, max: 0.01 },
  },
} as const;

/**
 * Calculate comparative risk multiplier (e.g., "3x riskier than average")
 */
export function getComparativeRisk(rugRisk: number): number {
  return rugRisk / BALANCE_CONFIG.AVERAGE_RUG_RISK;
}

/**
 * Format comparative risk for display
 */
export function formatComparativeRisk(rugRisk: number): string {
  const multiplier = getComparativeRisk(rugRisk);
  if (multiplier < 0.5) return 'Very Safe';
  if (multiplier < 1) return 'Below Average Risk';
  if (multiplier < 2) return 'Average Risk';
  if (multiplier < 4) return `${multiplier.toFixed(1)}x riskier`;
  return `${Math.round(multiplier)}x riskier than average`;
}

/**
 * Check if a tier is immune to contagion
 */
export function isContagionImmune(tier: string): boolean {
  return (BALANCE_CONFIG.CONTAGION_IMMUNE_TIERS as readonly string[]).includes(tier);
}

export default BALANCE_CONFIG;
