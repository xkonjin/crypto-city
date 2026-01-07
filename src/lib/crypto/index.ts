/**
 * =============================================================================
 * CRYPTO DATA LAYER - MAIN EXPORT
 * =============================================================================
 * Central export point for the real-world crypto data integration.
 * 
 * This module provides:
 * - API clients for fetching real-world data
 * - IndexedDB cache for offline-first support
 * - Reality Blender for translating data to game effects
 * - Configuration and types
 */

// =============================================================================
// CACHE
// =============================================================================

export { CryptoDataCache, cryptoCache } from './cache/cryptoDataCache';

// =============================================================================
// API CLIENTS
// =============================================================================

export {
  // Main fetch function
  fetchAllCryptoData,
  checkAllApiHealth,
  // DeFi Llama
  fetchDefiLlamaData,
  findProtocolByName,
  getAverageApyByChain,
  getProtocolsByCategory,
  // CoinGecko
  fetchCoinGeckoData,
  getTokenPrice,
  getBtcPrice,
  getEthPrice,
  getSignificantMovers,
  getAverageMarketChange,
  // Fear & Greed
  fetchFearGreedData,
  fearGreedToSentiment,
  sentimentToFearGreed,
  getClassification,
  getClassificationEmoji,
  getClassificationColor,
  getSentimentDescription,
  // Perplexity News
  fetchPerplexityNews,
  getNewsBySentiment,
  getNewsByChain,
  getHighImpactNews,
  getOverallNewsSentiment,
  formatNewsForDisplay,
  // Twitter
  fetchTwitterData,
  getTweetsBySentiment,
  getTopTweets,
  getTweetsByMention,
  getOverallCTSentiment,
  formatTweetForTicker,
  getCTAccountInfo,
} from './api';

// =============================================================================
// REALITY BLENDER
// =============================================================================

export {
  blendRealityData,
  blendSentiment,
  calculateYieldAdjustment,
  generateEventTriggers,
  generateTickerItems,
  markEventTriggered,
  resetBlenderState,
} from './realityBlender';

// =============================================================================
// CONFIGURATION
// =============================================================================

export {
  // API Keys & URLs
  PERPLEXITY_API_KEY,
  TWITTER_BEARER_TOKEN,
  COINGECKO_API_KEY,
  DEFILLAMA_API,
  COINGECKO_API,
  FEAR_GREED_API,
  PERPLEXITY_API,
  TWITTER_API,
  // Rate limits & intervals
  RATE_LIMITS,
  REFRESH_INTERVALS,
  // Tracked data
  TRACKED_TOKENS,
  TRACKED_TOKEN_IDS,
  CT_ACCOUNTS,
  CT_HANDLES,
  // Blender config
  BLENDER_CONFIG,
  // Features
  FEATURES,
  // Helpers
  checkApiKeysConfigured,
  getCoinGeckoBaseUrl,
  getCoinGeckoRateLimit,
} from './config';

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Cache types
  CacheEntry,
  CacheEntryMeta,
  TokenPrice,
  PriceData,
  ProtocolTVL,
  YieldPool,
  DefiLlamaData,
  FearGreedData,
  NewsSentiment,
  CryptoNewsItem,
  NewsData,
  TweetSentiment,
  CTTweet,
  TwitterData,
  RealWorldCryptoData,
  // Blender types
  BlendedSentiment,
  YieldAdjustment,
  EventTrigger,
  TickerItem,
  BlendedGameData,
} from './types';

export { CACHE_TTL, CACHE_DB_NAME, CACHE_STORES } from './cache/types';

