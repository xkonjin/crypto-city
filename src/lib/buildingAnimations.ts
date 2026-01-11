/**
 * Building Animations System (Issue #27)
 * 
 * Provides animation configurations for crypto buildings based on their state.
 * Includes yield pulse, sentiment glow, crypto particles, and rug warning effects.
 */

// =============================================================================
// TYPES
// =============================================================================

export type AnimationType = 'pulse' | 'glow' | 'particles' | 'float';

export interface BuildingAnimation {
  type: AnimationType;
  intensity: number; // 0-1
  color: string;
  duration: number; // ms
}

export interface ParticleConfig {
  type: 'coin' | 'sparkle' | 'smoke' | 'warning';
  color: string;
  count: number;
  speed: number; // pixels per second
  lifetime: number; // ms
  size: number; // pixels
}

export interface AnimationState {
  buildingId: string;
  animation: BuildingAnimation | null;
  particles: ParticleConfig | null;
  isRugged: boolean;
  lastUpdate: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Base animation durations (ms)
const BASE_PULSE_DURATION = 1500;
const BASE_GLOW_DURATION = 2000;
const BASE_PARTICLE_LIFETIME = 1500;
const BASE_FLOAT_DURATION = 3000;

// Yield thresholds
const HIGH_YIELD_THRESHOLD = 15;
const VERY_HIGH_YIELD_THRESHOLD = 20;

// Rug risk threshold for warning animation
const RUG_RISK_WARNING_THRESHOLD = 0.3;

// Particle limits for performance
export const MAX_PARTICLES_PER_BUILDING = 50;
export const MAX_TOTAL_PARTICLES = 200;

// Sentiment color stops
const SENTIMENT_COLORS = {
  extremeFear: '#ef4444', // red-500
  fear: '#f97316', // orange-500
  neutral: '#f59e0b', // amber-500
  greed: '#84cc16', // lime-500
  extremeGreed: '#22c55e', // green-500
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Interpolate between two colors based on a factor (0-1)
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  // Parse hex colors
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get glow color based on market sentiment (0-100)
 */
export function getSentimentGlowColor(sentiment: number): string {
  if (sentiment <= 20) {
    return SENTIMENT_COLORS.extremeFear;
  } else if (sentiment <= 40) {
    // Interpolate between extreme fear and fear
    const factor = (sentiment - 20) / 20;
    return interpolateColor(SENTIMENT_COLORS.extremeFear, SENTIMENT_COLORS.fear, factor);
  } else if (sentiment <= 50) {
    // Interpolate between fear and neutral
    const factor = (sentiment - 40) / 10;
    return interpolateColor(SENTIMENT_COLORS.fear, SENTIMENT_COLORS.neutral, factor);
  } else if (sentiment <= 60) {
    // Interpolate between neutral and greed
    const factor = (sentiment - 50) / 10;
    return interpolateColor(SENTIMENT_COLORS.neutral, SENTIMENT_COLORS.greed, factor);
  } else if (sentiment <= 80) {
    // Interpolate between greed and extreme greed
    const factor = (sentiment - 60) / 20;
    return interpolateColor(SENTIMENT_COLORS.greed, SENTIMENT_COLORS.extremeGreed, factor);
  } else {
    return SENTIMENT_COLORS.extremeGreed;
  }
}

/**
 * Calculate pulse animation duration based on yield rate
 * Higher yield = faster pulse (shorter duration)
 */
export function calculatePulseDuration(yieldRate: number): number {
  // Base duration scales down with yield rate
  // yieldRate of 0 = base duration
  // yieldRate of 20 = half the base duration
  const speedFactor = 1 + yieldRate * 0.025;
  return Math.max(500, Math.round(BASE_PULSE_DURATION / speedFactor));
}

/**
 * Calculate glow intensity based on yield and sentiment
 */
export function calculateGlowIntensity(yieldRate: number, sentiment: number): number {
  // Base intensity from yield rate (0-0.5)
  const yieldIntensity = Math.min(0.5, yieldRate / 40);
  
  // Sentiment modifier (more extreme = higher intensity)
  const sentimentDeviation = Math.abs(sentiment - 50) / 50;
  const sentimentIntensity = sentimentDeviation * 0.5;
  
  return Math.min(1, yieldIntensity + sentimentIntensity);
}

// =============================================================================
// MAIN ANIMATION FUNCTION
// =============================================================================

/**
 * Get animation configuration for a building based on its state
 * 
 * @param buildingId - The crypto building ID (e.g., 'aave-tower', 'uniswap-exchange')
 * @param yieldRate - The building's yield rate per tick
 * @param isRugged - Whether the building has been rugged
 * @param sentiment - Current market sentiment (0-100)
 * @returns BuildingAnimation config or null for non-crypto buildings
 */
export function getBuildingAnimation(
  buildingId: string,
  yieldRate: number,
  isRugged: boolean,
  sentiment: number
): BuildingAnimation | null {
  // Don't animate if no building ID or invalid yield rate
  if (!buildingId || yieldRate === undefined) {
    return null;
  }
  
  // Skip non-crypto buildings (check for common crypto prefixes/patterns)
  const cryptoPatterns = [
    /^aave/i, /^uniswap/i, /^compound/i, /^curve/i, /^maker/i,
    /^lido/i, /^pendle/i, /^eigenlayer/i, /^balancer/i, /^yearn/i,
    /^convex/i, /^frax/i, /^morpho/i, /^maple/i, /^spark/i,
    /^ondo/i, /^sky/i, /^jupiter/i, /^raydium/i, /^orca/i,
    /^kamino/i, /^hyperliquid/i, /^binance/i, /^coinbase/i,
    /^kraken/i, /^okx/i, /^bybit/i, /^kucoin/i, /^gemini/i,
    /^ethereum/i, /^solana/i, /^bitcoin/i, /^arbitrum/i,
    /^optimism/i, /^polygon/i, /^base/i, /^avalanche/i,
    /^zksync/i, /^scroll/i, /^linea/i, /^blast/i, /^mantle/i,
    /^pepe/i, /^doge/i, /^shiba/i, /^wojak/i, /^ape/i,
    /^moon/i, /^lambo/i, /^diamond/i, /^fomo/i, /^hodl/i,
    /^wagmi/i, /^ngmi/i, /^wif/i, /^bonk/i, /^popcat/i,
    /^brett/i, /^floki/i, /^mog/i, /^plasma/i, /^crypto/i,
    /^defi/i, /^degen/i, /^whale/i, /^ct-/i, /^vc-/i,
    /^alpha/i, /^podcast/i, /^nft/i, /^dao/i, /^anon/i,
  ];
  
  const isCryptoBuilding = cryptoPatterns.some(pattern => pattern.test(buildingId));
  
  if (!isCryptoBuilding) {
    return null;
  }
  
  // Priority 1: Rugged buildings get warning animation
  if (isRugged) {
    return {
      type: 'pulse',
      intensity: 1,
      color: SENTIMENT_COLORS.extremeFear,
      duration: 300, // Fast flicker
    };
  }
  
  // Priority 2: Very high yield buildings get particles + float
  if (yieldRate >= VERY_HIGH_YIELD_THRESHOLD) {
    return {
      type: 'float',
      intensity: Math.min(1, yieldRate / 30),
      color: getSentimentGlowColor(sentiment),
      duration: BASE_FLOAT_DURATION,
    };
  }
  
  // Priority 3: High yield buildings get pulse
  if (yieldRate >= HIGH_YIELD_THRESHOLD) {
    return {
      type: 'pulse',
      intensity: calculateGlowIntensity(yieldRate, sentiment),
      color: getSentimentGlowColor(sentiment),
      duration: calculatePulseDuration(yieldRate),
    };
  }
  
  // Priority 4: All crypto buildings get sentiment glow
  return {
    type: 'glow',
    intensity: calculateGlowIntensity(yieldRate, sentiment),
    color: getSentimentGlowColor(sentiment),
    duration: BASE_GLOW_DURATION,
  };
}

/**
 * Get particle configuration for a building
 * Returns null if building shouldn't have particles
 */
export function getBuildingParticles(
  buildingId: string,
  yieldRate: number,
  isRugged: boolean,
  sentiment: number
): ParticleConfig | null {
  // Don't spawn particles if no building or invalid yield
  if (!buildingId || yieldRate === undefined) {
    return null;
  }
  
  // Rugged buildings get smoke particles
  if (isRugged) {
    return {
      type: 'smoke',
      color: '#374151', // gray-700
      count: 10,
      speed: 20,
      lifetime: 2000,
      size: 8,
    };
  }
  
  // High yield buildings get coin particles
  if (yieldRate >= HIGH_YIELD_THRESHOLD) {
    const particleCount = Math.min(
      MAX_PARTICLES_PER_BUILDING,
      Math.floor(5 + (yieldRate - HIGH_YIELD_THRESHOLD) * 2)
    );
    
    return {
      type: 'coin',
      color: sentiment > 50 ? '#fbbf24' : '#f97316', // amber-400 or orange-500
      count: particleCount,
      speed: 30 + yieldRate,
      lifetime: BASE_PARTICLE_LIFETIME,
      size: 4,
    };
  }
  
  return null;
}

// =============================================================================
// ANIMATION TRIGGER EVENTS
// =============================================================================

export type AnimationTrigger = 'yield-collect' | 'rug-pull' | 'achievement' | 'airdrop';

export interface TriggerEvent {
  trigger: AnimationTrigger;
  position: { x: number; y: number };
  buildingId?: string;
  amount?: number;
}

/**
 * Get burst particle config for an animation trigger
 */
export function getTriggerParticles(event: TriggerEvent): ParticleConfig | null {
  switch (event.trigger) {
    case 'yield-collect':
      return {
        type: 'coin',
        color: '#fbbf24', // amber-400
        count: Math.min(20, 5 + Math.floor((event.amount || 0) / 50)),
        speed: 60,
        lifetime: 1000,
        size: 6,
      };
      
    case 'rug-pull':
      return {
        type: 'warning',
        color: '#ef4444', // red-500
        count: 30,
        speed: 80,
        lifetime: 1500,
        size: 5,
      };
      
    case 'achievement':
      return {
        type: 'sparkle',
        color: '#fcd34d', // amber-300
        count: 25,
        speed: 50,
        lifetime: 1200,
        size: 4,
      };
      
    case 'airdrop':
      return {
        type: 'coin',
        color: '#22c55e', // green-500
        count: 40,
        speed: 40,
        lifetime: 2000,
        size: 5,
      };
      
    default:
      return null;
  }
}

// =============================================================================
// CSS CLASS HELPERS
// =============================================================================

/**
 * Get CSS class for a building animation
 */
export function getAnimationClass(animation: BuildingAnimation | null): string {
  if (!animation) return '';
  
  switch (animation.type) {
    case 'pulse':
      return 'crypto-pulse';
    case 'glow':
      return 'crypto-glow';
    case 'particles':
      return 'crypto-particles';
    case 'float':
      return 'crypto-float';
    default:
      return '';
  }
}

/**
 * Get inline CSS variables for animation customization
 */
export function getAnimationStyles(animation: BuildingAnimation | null): Record<string, string> {
  if (!animation) return {};
  
  return {
    '--crypto-anim-color': animation.color,
    '--crypto-anim-duration': `${animation.duration}ms`,
    '--crypto-anim-intensity': animation.intensity.toString(),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getBuildingAnimation,
  getBuildingParticles,
  getTriggerParticles,
  getSentimentGlowColor,
  calculatePulseDuration,
  calculateGlowIntensity,
  getAnimationClass,
  getAnimationStyles,
  MAX_PARTICLES_PER_BUILDING,
  MAX_TOTAL_PARTICLES,
};
