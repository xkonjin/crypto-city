// =============================================================================
// SENTIMENT ENGINE
// =============================================================================
// Manages market sentiment simulation including:
// - Sentiment value tracking (-100 to +100)
// - Natural market cycles (sine wave base)
// - Random noise for unpredictability
// - External sentiment shifts (from events)

import { ECONOMY_CONFIG, clampSentiment } from '../../config/gameConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface SentimentState {
  value: number;
  history: number[];
}

export type SentimentChangeCallback = (newValue: number, delta: number) => void;

export type MarketPhase = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';

// =============================================================================
// SENTIMENT ENGINE CLASS
// =============================================================================

export class SentimentEngine {
  private sentiment: number;
  private history: number[];
  private maxHistoryLength: number;
  private onChangeCallbacks: SentimentChangeCallback[] = [];

  // Market cycle parameters (from config)
  private readonly cycleAmplitude: number;
  private readonly cyclePeriod: number;
  private readonly decayRate: number;
  private readonly noise: number;

  constructor(initialSentiment: number = 0) {
    this.sentiment = clampSentiment(initialSentiment);
    this.history = [this.sentiment];
    this.maxHistoryLength = 100;

    // Load from config
    this.cycleAmplitude = ECONOMY_CONFIG.MARKET_CYCLE_AMPLITUDE;
    this.cyclePeriod = ECONOMY_CONFIG.MARKET_CYCLE_PERIOD;
    this.decayRate = ECONOMY_CONFIG.SENTIMENT_DECAY_RATE;
    this.noise = ECONOMY_CONFIG.SENTIMENT_NOISE;
  }

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------

  /**
   * Get current sentiment value (-100 to +100)
   */
  getValue(): number {
    return this.sentiment;
  }

  /**
   * Get sentiment as a normalized value (0 to 1)
   */
  getNormalized(): number {
    return (this.sentiment + 100) / 200;
  }

  /**
   * Get the current market phase
   */
  getPhase(): MarketPhase {
    if (this.sentiment <= -60) return 'extreme_fear';
    if (this.sentiment <= -20) return 'fear';
    if (this.sentiment <= 20) return 'neutral';
    if (this.sentiment <= 60) return 'greed';
    return 'extreme_greed';
  }

  /**
   * Get sentiment history for charts
   */
  getHistory(): readonly number[] {
    return this.history;
  }

  /**
   * Get the current state
   */
  getState(): SentimentState {
    return {
      value: this.sentiment,
      history: [...this.history],
    };
  }

  // ---------------------------------------------------------------------------
  // SENTIMENT MODIFIERS
  // ---------------------------------------------------------------------------

  /**
   * Apply a sentiment shift (from events, etc.)
   * Positive values increase sentiment (bullish)
   * Negative values decrease sentiment (bearish)
   */
  shift(amount: number): number {
    const oldSentiment = this.sentiment;
    this.sentiment = clampSentiment(this.sentiment + amount);
    const delta = this.sentiment - oldSentiment;

    if (delta !== 0) {
      this.notifyChange(delta);
    }

    return this.sentiment;
  }

  /**
   * Set sentiment to a specific value
   */
  set(value: number): number {
    const oldSentiment = this.sentiment;
    this.sentiment = clampSentiment(value);
    const delta = this.sentiment - oldSentiment;

    if (delta !== 0) {
      this.notifyChange(delta);
    }

    return this.sentiment;
  }

  // ---------------------------------------------------------------------------
  // MARKET CYCLE SIMULATION
  // ---------------------------------------------------------------------------

  /**
   * Update sentiment for a new tick
   * Combines natural cycle, decay, and random noise
   */
  tick(currentTick: number): number {
    const oldSentiment = this.sentiment;

    // Calculate base cycle position (sine wave)
    const cyclePosition = Math.sin((currentTick / this.cyclePeriod) * Math.PI * 2);
    const targetSentiment = cyclePosition * this.cycleAmplitude;

    // Apply decay toward target (smooth transition)
    const decayFactor = this.decayRate * 0.1; // Scale decay for reasonable speed
    this.sentiment += (targetSentiment - this.sentiment) * decayFactor;

    // Add random noise
    const noiseAmount = (Math.random() - 0.5) * this.noise;
    this.sentiment += noiseAmount;

    // Clamp to valid range
    this.sentiment = clampSentiment(this.sentiment);

    // Notify if changed significantly
    const delta = this.sentiment - oldSentiment;
    if (Math.abs(delta) > 0.1) {
      this.notifyChange(delta);
    }

    return this.sentiment;
  }

  /**
   * Record current sentiment in history
   */
  recordToHistory(): void {
    this.history.push(Math.round(this.sentiment));

    // Trim history if too long
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }
  }

  // ---------------------------------------------------------------------------
  // YIELD CALCULATION HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Get the yield multiplier based on current sentiment
   * At sentiment 100: returns 1 + SENTIMENT_YIELD_IMPACT (e.g., 1.5)
   * At sentiment -100: returns 1 - SENTIMENT_YIELD_IMPACT (e.g., 0.5)
   * At sentiment 0: returns 1.0
   */
  getYieldMultiplier(): number {
    const impact = ECONOMY_CONFIG.SENTIMENT_YIELD_IMPACT;
    return 1 + (this.sentiment / 100) * impact;
  }

  /**
   * Get the volatility multiplier based on sentiment extremity
   * Higher at extreme sentiment values (both positive and negative)
   */
  getVolatilityMultiplier(): number {
    // Volatility increases at extremes
    const extremity = Math.abs(this.sentiment) / 100;
    return 1 + extremity * 0.5;
  }

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------

  /**
   * Register a callback for sentiment changes
   */
  onChanged(callback: SentimentChangeCallback): () => void {
    this.onChangeCallbacks.push(callback);

    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onChangeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyChange(delta: number): void {
    for (const callback of this.onChangeCallbacks) {
      try {
        callback(this.sentiment, delta);
      } catch (error) {
        console.error('[SentimentEngine] Callback error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Export state for saving
   */
  export(): SentimentState {
    return {
      value: this.sentiment,
      history: [...this.history],
    };
  }

  /**
   * Import state from save
   */
  import(state: SentimentState): void {
    this.sentiment = clampSentiment(state.value);
    this.history = state.history?.slice(-this.maxHistoryLength) ?? [this.sentiment];
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.sentiment = 0;
    this.history = [0];
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createSentimentEngine(initialValue?: number): SentimentEngine {
  return new SentimentEngine(initialValue);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a human-readable label for a market phase
 */
export function getPhaseLabel(phase: MarketPhase): string {
  const labels: Record<MarketPhase, string> = {
    extreme_fear: 'Extreme Fear',
    fear: 'Fear',
    neutral: 'Neutral',
    greed: 'Greed',
    extreme_greed: 'Extreme Greed',
  };
  return labels[phase];
}

/**
 * Get emoji for a market phase
 */
export function getPhaseEmoji(phase: MarketPhase): string {
  const emojis: Record<MarketPhase, string> = {
    extreme_fear: '😱',
    fear: '😰',
    neutral: '😐',
    greed: '😊',
    extreme_greed: '🤑',
  };
  return emojis[phase];
}

