// =============================================================================
// CENTRALIZED GAME CONFIGURATION
// =============================================================================
// All magic numbers and configuration constants in one place.
// This makes tuning game balance and behavior easier and prevents
// scattered constants that are hard to find and maintain.

// =============================================================================
// SIMULATION CONFIG
// =============================================================================

export const SIMULATION_CONFIG = {
  /**
   * How often the simulation ticks (in milliseconds)
   * Each tick represents one "day" in the game economy
   */
  TICK_INTERVAL_MS: 2000,

  /**
   * Maximum number of ticks to store in history
   * Used for graphs and trend analysis
   */
  MAX_HISTORY_LENGTH: 100,

  /**
   * Initial treasury balance when starting a new game
   */
  STARTING_TREASURY: 1000,
} as const;

// =============================================================================
// ECONOMY CONFIG
// =============================================================================

export const ECONOMY_CONFIG = {
  /**
   * Base multiplier applied to all yield generation
   * Adjust this to globally increase/decrease income
   * 1.0 = normal, 2.0 = double yields, 0.5 = half yields
   */
  BASE_YIELD_MULTIPLIER: 1.0,

  /**
   * How much market sentiment affects yield
   * At 1.0: sentiment of 100 gives 2x yield, -100 gives 0.5x yield
   * At 0.5: sentiment of 100 gives 1.5x yield, -100 gives 0.75x yield
   */
  SENTIMENT_YIELD_IMPACT: 0.5,

  /**
   * Rate at which market sentiment naturally decays toward 0
   * Higher values = faster return to neutral
   */
  SENTIMENT_DECAY_RATE: 0.5,

  /**
   * Random sentiment drift per tick (adds noise to cycles)
   * Higher values = more unpredictable market
   */
  SENTIMENT_NOISE: 3.0,

  /**
   * Period of the market cycle in ticks (days)
   * Full cycle is ~2x this value (peak to peak)
   */
  MARKET_CYCLE_PERIOD: 50,

  /**
   * Amplitude of the base market cycle
   * Market naturally oscillates +/- this amount from center
   */
  MARKET_CYCLE_AMPLITUDE: 40,

  /**
   * Synergy bonus when buildings share a blockchain (e.g., ETH ecosystem)
   * 0.15 = 15% bonus
   */
  CHAIN_SYNERGY_BONUS: 0.15,

  /**
   * Synergy bonus when buildings share a category (e.g., DeFi cluster)
   * 0.10 = 10% bonus
   */
  CATEGORY_SYNERGY_BONUS: 0.10,

  /**
   * Minimum treasury balance (prevents going negative)
   */
  MIN_TREASURY: 0,

  /**
   * Maximum treasury balance (prevents overflow in UI)
   */
  MAX_TREASURY: 999_999_999_999,

  /**
   * Sentiment range limits
   */
  MIN_SENTIMENT: -100,
  MAX_SENTIMENT: 100,
} as const;

// =============================================================================
// EVENT CONFIG
// =============================================================================

export const EVENT_CONFIG = {
  /**
   * Maximum number of events that can be active simultaneously
   * Prevents event spam and maintains readability
   */
  MAX_SIMULTANEOUS_EVENTS: 5,

  /**
   * Maximum number of events to keep in history
   * Used for the news ticker and event log
   */
  MAX_EVENT_HISTORY: 50,

  /**
   * Cooldown in ticks before the same event type can trigger again
   */
  EVENT_COOLDOWN_TICKS: 3,

  /**
   * Global event trigger multiplier (affects all event chances)
   * 1.0 = normal, 2.0 = double frequency, 0.5 = half frequency
   */
  GLOBAL_TRIGGER_MULTIPLIER: 1.0,

  /**
   * Priority levels for event display (higher = shown first)
   */
  PRIORITY: {
    CRITICAL: 100,  // Rug pulls, hacks
    HIGH: 80,       // Bear markets, liquidations
    MEDIUM: 50,     // Bull runs, airdrops
    LOW: 20,        // CT drama, regular events
  },
} as const;

// =============================================================================
// UI CONFIG
// =============================================================================

export const UI_CONFIG = {
  /**
   * Available zoom levels for the game camera
   */
  ZOOM_LEVELS: [0.25, 0.5, 1, 2, 4] as const,

  /**
   * Default zoom level index (1 = 100%)
   */
  DEFAULT_ZOOM_INDEX: 2,

  /**
   * Small screen breakpoint (for mobile detection)
   */
  MOBILE_BREAKPOINT: 768,

  /**
   * News ticker scroll speed (pixels per second)
   */
  NEWS_TICKER_SPEED: 50,

  /**
   * How long to show floating text effects (milliseconds)
   */
  FLOATING_TEXT_DURATION: 2000,

  /**
   * Treasury animation duration for counting up/down (milliseconds)
   */
  TREASURY_ANIMATION_DURATION: 500,
} as const;

// =============================================================================
// SAVE/LOAD CONFIG
// =============================================================================

export const SAVE_CONFIG = {
  /**
   * Current save file format version
   * Increment when making breaking changes to save structure
   */
  CURRENT_VERSION: 2,

  /**
   * Minimum supported version for migration
   * Saves older than this cannot be loaded
   */
  MIN_SUPPORTED_VERSION: 1,

  /**
   * LocalStorage key prefix
   */
  STORAGE_KEY_PREFIX: 'cryptoCity_',

  /**
   * Maximum number of save slots
   */
  MAX_SAVE_SLOTS: 10,

  /**
   * Auto-save interval in ticks (0 = disabled)
   */
  AUTO_SAVE_INTERVAL_TICKS: 0,
} as const;

// =============================================================================
// BUILDING CONFIG
// =============================================================================

export const BUILDING_CONFIG = {
  /**
   * TVL contribution by tier (in "millions" for display)
   */
  TVL_BY_TIER: {
    degen: 0.5,
    fish: 1,
    retail: 5,
    shark: 25,
    whale: 100,
    institution: 500,
  } as const,

  /**
   * Zone effect default radius (in tiles)
   */
  DEFAULT_ZONE_RADIUS: 3,

  /**
   * Maximum zone effect radius (to limit computation)
   */
  MAX_ZONE_RADIUS: 6,
} as const;

// =============================================================================
// PERFORMANCE CONFIG
// =============================================================================

export const PERFORMANCE_CONFIG = {
  /**
   * Maximum buildings before showing performance warning
   */
  BUILDING_WARNING_THRESHOLD: 200,

  /**
   * Maximum entities (characters + cars) before throttling
   */
  ENTITY_WARNING_THRESHOLD: 100,

  /**
   * Zone effect recalculation debounce (milliseconds)
   */
  ZONE_RECALC_DEBOUNCE_MS: 100,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SimulationConfig = typeof SIMULATION_CONFIG;
export type EconomyConfig = typeof ECONOMY_CONFIG;
export type EventConfig = typeof EVENT_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type SaveConfig = typeof SAVE_CONFIG;
export type BuildingConfig = typeof BUILDING_CONFIG;
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Clamp a value within the allowed treasury range
 */
export function clampTreasury(value: number): number {
  return Math.max(ECONOMY_CONFIG.MIN_TREASURY, Math.min(ECONOMY_CONFIG.MAX_TREASURY, value));
}

/**
 * Clamp a value within the allowed sentiment range
 */
export function clampSentiment(value: number): number {
  return Math.max(ECONOMY_CONFIG.MIN_SENTIMENT, Math.min(ECONOMY_CONFIG.MAX_SENTIMENT, value));
}

/**
 * Get TVL contribution for a given tier
 */
export function getTVLForTier(tier: keyof typeof BUILDING_CONFIG.TVL_BY_TIER): number {
  return BUILDING_CONFIG.TVL_BY_TIER[tier] ?? 0;
}

