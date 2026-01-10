/**
 * =============================================================================
 * USE SENTIMENT VISUALS HOOK
 * =============================================================================
 * React hook that calculates visual effects based on market sentiment.
 * 
 * The Fear & Greed Index (0-100) drives visual changes:
 * - CSS filters for saturation/brightness
 * - Weather overlay effects
 * - NPC speed multipliers
 * - Crypto building glow intensity
 * 
 * Sentiment Ranges:
 * - Extreme Fear (0-20): Desaturated, dark, rain, dim glow
 * - Fear (20-40): Muted colors, cloudy, reduced glow
 * - Neutral (40-60): Normal appearance
 * - Greed (60-80): Vibrant, sunny, bright glow
 * - Extreme Greed (80-100): Saturated, golden, perfect day, pulsing gold glow
 */

'use client';

import { useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Weather effect types based on sentiment
 */
export type WeatherEffect = 'rain' | 'cloudy' | 'sunny' | 'perfect' | null;

/**
 * Sentiment visual effects returned by the hook
 */
export interface SentimentVisuals {
  /** CSS filter for saturation/brightness (e.g., "saturate(0.6) brightness(0.85)") */
  filter: string;
  /** Weather overlay effect type */
  weatherEffect: WeatherEffect;
  /** NPC movement speed multiplier (0.7 to 1.3) */
  npcSpeedMultiplier: number;
  /** Glow intensity for crypto buildings (0 to 1.5) */
  glowIntensity: number;
  /** Whether glow should pulse (extreme greed) */
  glowPulsing: boolean;
  /** Glow color for crypto buildings */
  glowColor: string;
  /** Sentiment classification name */
  classification: string;
  /** Overlay tint color (for weather effects) */
  overlayTint: string;
  /** Overlay opacity (0 to 0.3) */
  overlayOpacity: number;
}

/**
 * Sentiment classification levels
 */
export type SentimentClassification = 
  | 'Extreme Fear'
  | 'Fear'
  | 'Neutral'
  | 'Greed'
  | 'Extreme Greed';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default visuals for neutral sentiment (fallback)
 */
const DEFAULT_VISUALS: SentimentVisuals = {
  filter: 'none',
  weatherEffect: null,
  npcSpeedMultiplier: 1.0,
  glowIntensity: 0.5,
  glowPulsing: false,
  glowColor: 'rgba(59, 130, 246, 0.5)', // Blue
  classification: 'Neutral',
  overlayTint: 'transparent',
  overlayOpacity: 0,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sentiment classification from numeric value
 */
function getClassification(sentiment: number): SentimentClassification {
  if (sentiment < 20) return 'Extreme Fear';
  if (sentiment < 40) return 'Fear';
  if (sentiment < 60) return 'Neutral';
  if (sentiment < 80) return 'Greed';
  return 'Extreme Greed';
}

/**
 * Calculate CSS filter based on sentiment
 * - Extreme Fear: Desaturated (0.6), darker (0.85)
 * - Fear: Slightly muted (0.8), slightly dark (0.92)
 * - Neutral: No filter
 * - Greed: Vibrant (1.1), warm (brightness 1.02)
 * - Extreme Greed: Saturated (1.2), golden warm (sepia 0.1, brightness 1.05)
 */
function calculateFilter(sentiment: number): string {
  if (sentiment < 20) {
    // Extreme Fear: Desaturated, darker
    return 'saturate(0.6) brightness(0.85)';
  }
  if (sentiment < 40) {
    // Fear: Slightly muted colors
    const intensity = (40 - sentiment) / 20; // 0-1 scale
    const saturation = 0.8 + (0.2 * (1 - intensity));
    const brightness = 0.92 + (0.08 * (1 - intensity));
    return `saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
  }
  if (sentiment < 60) {
    // Neutral: No filter
    return 'none';
  }
  if (sentiment < 80) {
    // Greed: Vibrant, warm colors
    const intensity = (sentiment - 60) / 20; // 0-1 scale
    const saturation = 1.0 + (0.1 * intensity);
    const brightness = 1.0 + (0.02 * intensity);
    return `saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
  }
  // Extreme Greed: Saturated, golden tints
  return 'saturate(1.2) brightness(1.05) sepia(0.1)';
}

/**
 * Calculate weather effect based on sentiment
 */
function calculateWeatherEffect(sentiment: number): WeatherEffect {
  if (sentiment < 20) return 'rain';
  if (sentiment < 40) return 'cloudy';
  if (sentiment < 60) return null; // Neutral = clear/normal
  if (sentiment < 80) return 'sunny';
  return 'perfect'; // Extreme Greed = perfect sunny day
}

/**
 * Calculate NPC speed multiplier
 * - Extreme Fear: Slower (0.7) - NPCs are hesitant
 * - Fear: Slightly slower (0.85)
 * - Neutral: Normal (1.0)
 * - Greed: Slightly faster (1.15) - NPCs are excited
 * - Extreme Greed: Faster (1.3) - NPCs are rushing
 */
function calculateNpcSpeed(sentiment: number): number {
  if (sentiment < 20) return 0.7;
  if (sentiment < 40) return 0.85;
  if (sentiment < 60) return 1.0;
  if (sentiment < 80) return 1.15;
  return 1.3;
}

/**
 * Calculate glow intensity for crypto buildings
 * - Extreme Fear: Dim/flickering (0.2)
 * - Fear: Reduced (0.4)
 * - Neutral: Normal (0.6)
 * - Greed: Bright (0.9)
 * - Extreme Greed: Very bright (1.2)
 */
function calculateGlowIntensity(sentiment: number): number {
  if (sentiment < 20) return 0.2;
  if (sentiment < 40) return 0.4;
  if (sentiment < 60) return 0.6;
  if (sentiment < 80) return 0.9;
  return 1.2;
}

/**
 * Get glow color based on sentiment
 * - Extreme Fear: Red
 * - Fear: Orange
 * - Neutral: Blue
 * - Greed: Green
 * - Extreme Greed: Gold
 */
function calculateGlowColor(sentiment: number): string {
  if (sentiment < 20) return 'rgba(239, 68, 68, 0.6)'; // Red
  if (sentiment < 40) return 'rgba(249, 115, 22, 0.5)'; // Orange
  if (sentiment < 60) return 'rgba(59, 130, 246, 0.5)'; // Blue
  if (sentiment < 80) return 'rgba(34, 197, 94, 0.6)'; // Green
  return 'rgba(251, 191, 36, 0.7)'; // Gold
}

/**
 * Calculate overlay tint for weather effects
 */
function calculateOverlayTint(sentiment: number): string {
  if (sentiment < 20) return 'rgba(31, 41, 55, 0.3)'; // Dark gray for rain
  if (sentiment < 40) return 'rgba(107, 114, 128, 0.2)'; // Gray for clouds
  if (sentiment < 60) return 'transparent';
  if (sentiment < 80) return 'rgba(253, 224, 71, 0.08)'; // Light yellow for sunny
  return 'rgba(251, 191, 36, 0.1)'; // Gold tint for perfect
}

/**
 * Calculate overlay opacity
 */
function calculateOverlayOpacity(sentiment: number): number {
  if (sentiment < 20) return 0.25;
  if (sentiment < 40) return 0.15;
  if (sentiment < 60) return 0;
  if (sentiment < 80) return 0.08;
  return 0.12;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * React hook that calculates visual effects based on market sentiment
 * 
 * @param sentiment - Fear & Greed Index value (0-100)
 * @returns SentimentVisuals object with all calculated visual effects
 * 
 * @example
 * ```tsx
 * const { filter, weatherEffect, glowIntensity } = useSentimentVisuals(marketSentiment);
 * 
 * return (
 *   <div style={{ filter }}>
 *     {weatherEffect === 'rain' && <RainOverlay />}
 *     <Canvas glowIntensity={glowIntensity} />
 *   </div>
 * );
 * ```
 */
export function useSentimentVisuals(sentiment: number): SentimentVisuals {
  return useMemo(() => {
    // Clamp sentiment to valid range
    const clampedSentiment = Math.max(0, Math.min(100, sentiment));
    
    // Handle NaN/undefined
    if (isNaN(clampedSentiment)) {
      return DEFAULT_VISUALS;
    }
    
    return {
      filter: calculateFilter(clampedSentiment),
      weatherEffect: calculateWeatherEffect(clampedSentiment),
      npcSpeedMultiplier: calculateNpcSpeed(clampedSentiment),
      glowIntensity: calculateGlowIntensity(clampedSentiment),
      glowPulsing: clampedSentiment >= 80, // Pulse during extreme greed
      glowColor: calculateGlowColor(clampedSentiment),
      classification: getClassification(clampedSentiment),
      overlayTint: calculateOverlayTint(clampedSentiment),
      overlayOpacity: calculateOverlayOpacity(clampedSentiment),
    };
  }, [sentiment]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useSentimentVisuals;
export { getClassification, DEFAULT_VISUALS };
