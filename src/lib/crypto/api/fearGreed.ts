/**
 * =============================================================================
 * FEAR & GREED INDEX API CLIENT
 * =============================================================================
 * Fetches the Crypto Fear & Greed Index from alternative.me.
 * 
 * The Fear & Greed Index is a popular metric that measures market sentiment
 * on a scale of 0 (Extreme Fear) to 100 (Extreme Greed).
 * 
 * It's calculated from:
 * - Volatility (25%)
 * - Market momentum/volume (25%)
 * - Social media sentiment (15%)
 * - Surveys (15%)
 * - Bitcoin dominance (10%)
 * - Google Trends (10%)
 * 
 * Free API, no rate limits specified (be reasonable).
 * Updates once per day.
 * 
 * API Docs: https://alternative.me/crypto/fear-and-greed-index/
 */

import { FEAR_GREED_API, FEATURES } from '../config';
import { FearGreedData } from '../cache/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Raw response from the Fear & Greed API
 */
interface RawFearGreedResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update?: string;
  }>;
  metadata: {
    error: string | null;
  };
}

/**
 * Fear & Greed classification levels
 */
type FearGreedClassification = 
  | 'Extreme Fear'
  | 'Fear'
  | 'Neutral'
  | 'Greed'
  | 'Extreme Greed';

// =============================================================================
// CLASSIFICATION HELPERS
// =============================================================================

/**
 * Get numeric value range for each classification
 * Used for validation and display
 */
export const CLASSIFICATION_RANGES: Record<FearGreedClassification, [number, number]> = {
  'Extreme Fear': [0, 24],
  'Fear': [25, 44],
  'Neutral': [45, 54],
  'Greed': [55, 74],
  'Extreme Greed': [75, 100],
};

/**
 * Get classification from numeric value
 */
export function getClassification(value: number): FearGreedClassification {
  if (value <= 24) return 'Extreme Fear';
  if (value <= 44) return 'Fear';
  if (value <= 54) return 'Neutral';
  if (value <= 74) return 'Greed';
  return 'Extreme Greed';
}

/**
 * Get emoji representation for classification
 */
export function getClassificationEmoji(classification: string): string {
  const emojiMap: Record<string, string> = {
    'Extreme Fear': '😱',
    'Fear': '😰',
    'Neutral': '😐',
    'Greed': '🤑',
    'Extreme Greed': '🚀',
  };
  return emojiMap[classification] || '📊';
}

/**
 * Get color for classification (for UI)
 */
export function getClassificationColor(classification: string): string {
  const colorMap: Record<string, string> = {
    'Extreme Fear': '#ea3943', // Red
    'Fear': '#ea8c00', // Orange
    'Neutral': '#c3c3c3', // Gray
    'Greed': '#16c784', // Light green
    'Extreme Greed': '#00ff88', // Bright green
  };
  return colorMap[classification] || '#c3c3c3';
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch current Fear & Greed Index
 * Also fetches previous day for comparison
 * 
 * @returns Current and previous Fear & Greed data
 */
async function fetchFearGreedIndex(): Promise<{
  current: { value: number; classification: string; timestamp: number };
  previous: { value: number; classification: string; timestamp: number } | null;
}> {
  // Fetch last 2 days of data for comparison
  const url = `${FEAR_GREED_API.BASE_URL}${FEAR_GREED_API.FNG}?limit=2`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fear & Greed API error: ${response.status}`);
    }

    const data: RawFearGreedResponse = await response.json();

    if (data.metadata?.error) {
      throw new Error(`Fear & Greed API error: ${data.metadata.error}`);
    }

    if (!data.data || data.data.length === 0) {
      throw new Error('No Fear & Greed data available');
    }

    // Parse current value
    const current = data.data[0];
    const currentValue = parseInt(current.value, 10);
    const currentTimestamp = parseInt(current.timestamp, 10) * 1000; // Convert to ms

    // Parse previous value if available
    let previous = null;
    if (data.data.length > 1) {
      const prev = data.data[1];
      previous = {
        value: parseInt(prev.value, 10),
        classification: prev.value_classification,
        timestamp: parseInt(prev.timestamp, 10) * 1000,
      };
    }

    return {
      current: {
        value: currentValue,
        classification: current.value_classification,
        timestamp: currentTimestamp,
      },
      previous,
    };
  } catch (error) {
    console.error('[FearGreed] Failed to fetch index:', error);
    throw error;
  }
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch Fear & Greed Index data
 * This is the main function called by the data sync layer
 * 
 * @returns Fear & Greed data for caching
 */
export async function fetchFearGreedData(): Promise<FearGreedData> {
  if (!FEATURES.ENABLE_FEAR_GREED) {
    throw new Error('Fear & Greed fetching is disabled');
  }

  console.log('[FearGreed] Fetching data...');
  const startTime = Date.now();

  const { current, previous } = await fetchFearGreedIndex();

  const elapsed = Date.now() - startTime;
  console.log(`[FearGreed] Fetched in ${elapsed}ms: ${current.value} (${current.classification})`);

  return {
    value: current.value,
    classification: current.classification,
    previousValue: previous?.value ?? current.value,
    timestamp: current.timestamp,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert Fear & Greed value to game sentiment
 * Game sentiment is centered at 0 (-100 to +100)
 * Fear & Greed is 0-100
 * 
 * @param fearGreedValue - Value from 0-100
 * @returns Sentiment value from -100 to +100
 */
export function fearGreedToSentiment(fearGreedValue: number): number {
  // Map 0-100 to -100 to +100
  // 0 (Extreme Fear) -> -100
  // 50 (Neutral) -> 0
  // 100 (Extreme Greed) -> +100
  return (fearGreedValue - 50) * 2;
}

/**
 * Convert game sentiment back to Fear & Greed scale
 * 
 * @param sentiment - Value from -100 to +100
 * @returns Fear & Greed value from 0-100
 */
export function sentimentToFearGreed(sentiment: number): number {
  // Map -100 to +100 to 0-100
  return (sentiment / 2) + 50;
}

/**
 * Get sentiment description based on Fear & Greed value
 */
export function getSentimentDescription(value: number): string {
  if (value <= 10) return 'Markets are in extreme panic mode';
  if (value <= 24) return 'Fear is dominating the market';
  if (value <= 34) return 'Investors are cautious';
  if (value <= 44) return 'Slight fear in the market';
  if (value <= 54) return 'Market sentiment is neutral';
  if (value <= 64) return 'Slight greed emerging';
  if (value <= 74) return 'Greed is taking over';
  if (value <= 84) return 'High greed levels detected';
  if (value <= 94) return 'Extreme greed - be careful';
  return 'Maximum greed - correction likely';
}

/**
 * Calculate sentiment change direction
 */
export function getSentimentDirection(
  current: number,
  previous: number
): 'improving' | 'worsening' | 'stable' {
  const diff = current - previous;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'worsening';
  return 'stable';
}

/**
 * Check if Fear & Greed API is accessible
 */
export async function checkFearGreedHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${FEAR_GREED_API.BASE_URL}${FEAR_GREED_API.FNG}?limit=1`);
    return response.ok;
  } catch {
    return false;
  }
}

