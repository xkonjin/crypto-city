/**
 * =============================================================================
 * CRYPTO DATA CACHE TYPES
 * =============================================================================
 * Type definitions for the IndexedDB cache layer that stores real-world crypto
 * data for offline-first gameplay.
 * 
 * The cache stores:
 * - Token prices from CoinGecko
 * - Protocol TVL and yields from DeFi Llama
 * - Fear & Greed index
 * - News items from Perplexity AI
 * - CT tweets from Twitter/X API
 * 
 * Each cache entry has a TTL (time-to-live) for automatic expiration.
 */

import { CryptoChain } from '../../../games/isocity/crypto/types';

// =============================================================================
// CACHE ENTRY METADATA
// =============================================================================

/**
 * Base interface for all cached data entries
 * Includes timestamps for TTL management and staleness detection
 */
export interface CacheEntryMeta {
  /** When this entry was last fetched from the API */
  fetchedAt: number;
  /** When this entry expires (fetchedAt + TTL) */
  expiresAt: number;
  /** Whether this entry is currently being refreshed */
  isRefreshing?: boolean;
}

/**
 * Wrapper for cached data with metadata
 */
export interface CacheEntry<T> extends CacheEntryMeta {
  /** The actual cached data */
  data: T;
}

// =============================================================================
// PRICE DATA
// =============================================================================

/**
 * Token price data from CoinGecko
 */
export interface TokenPrice {
  /** Token symbol (e.g., "BTC", "ETH") */
  symbol: string;
  /** CoinGecko ID (e.g., "bitcoin", "ethereum") */
  id: string;
  /** Current price in USD */
  priceUsd: number;
  /** 24-hour price change percentage */
  change24h: number;
  /** 7-day price change percentage */
  change7d: number;
  /** Market cap in USD */
  marketCap: number;
  /** 24-hour trading volume in USD */
  volume24h: number;
}

/**
 * Cached price data for all tracked tokens
 */
export interface PriceData {
  /** Map of token symbol to price data */
  tokens: Record<string, TokenPrice>;
  /** Bitcoin dominance percentage */
  btcDominance: number;
  /** Total crypto market cap */
  totalMarketCap: number;
}

// =============================================================================
// PROTOCOL DATA (DeFi Llama)
// =============================================================================

/**
 * Protocol TVL data from DeFi Llama
 */
export interface ProtocolTVL {
  /** Protocol name (e.g., "Uniswap", "Aave") */
  name: string;
  /** DeFi Llama slug */
  slug: string;
  /** Total Value Locked in USD */
  tvl: number;
  /** 24-hour TVL change percentage */
  change24h: number;
  /** 7-day TVL change percentage */
  change7d: number;
  /** Primary blockchain */
  chain: string;
  /** Protocol category (e.g., "DEX", "Lending") */
  category: string;
}

/**
 * Yield pool data from DeFi Llama
 */
export interface YieldPool {
  /** Unique pool identifier */
  pool: string;
  /** Protocol name */
  protocol: string;
  /** Blockchain */
  chain: string;
  /** Pool symbol (e.g., "ETH-USDC") */
  symbol: string;
  /** Annual Percentage Yield */
  apy: number;
  /** Base APY (without rewards) */
  apyBase: number;
  /** Reward APY */
  apyReward: number;
  /** Total Value Locked in USD */
  tvlUsd: number;
}

/**
 * Aggregated DeFi Llama data
 */
export interface DefiLlamaData {
  /** Top protocols by TVL */
  protocols: ProtocolTVL[];
  /** Top yield pools */
  yields: YieldPool[];
  /** Total DeFi TVL across all chains */
  totalTvl: number;
  /** TVL by chain */
  tvlByChain: Record<string, number>;
}

// =============================================================================
// MARKET SENTIMENT
// =============================================================================

/**
 * Fear & Greed Index data
 */
export interface FearGreedData {
  /** Current index value (0-100) */
  value: number;
  /** Classification (e.g., "Extreme Fear", "Greed") */
  classification: string;
  /** Previous day's value */
  previousValue: number;
  /** Timestamp of the reading */
  timestamp: number;
}

// =============================================================================
// NEWS DATA
// =============================================================================

/**
 * Sentiment classification for news items
 */
export type NewsSentiment = 'positive' | 'negative' | 'neutral';

/**
 * Individual news item from Perplexity AI
 */
export interface CryptoNewsItem {
  /** Unique identifier */
  id: string;
  /** News headline */
  headline: string;
  /** Brief summary */
  summary: string;
  /** Sentiment analysis */
  sentiment: NewsSentiment;
  /** Chains/tokens mentioned */
  relevantChains: CryptoChain[];
  /** Original source name */
  source: string;
  /** Original article URL (if available) */
  url?: string;
  /** When the news was published */
  publishedAt: number;
  /** When we fetched this news */
  fetchedAt: number;
  /** Impact level (1-5, higher = more important) */
  impactLevel: number;
}

/**
 * News data collection
 */
export interface NewsData {
  /** Recent news items, sorted by publishedAt descending */
  items: CryptoNewsItem[];
  /** Last news fetch timestamp */
  lastFetch: number;
}

// =============================================================================
// TWITTER/CT DATA
// =============================================================================

/**
 * Tweet sentiment for CT content
 */
export type TweetSentiment = 'bullish' | 'bearish' | 'neutral' | 'drama';

/**
 * Individual CT tweet
 */
export interface CTTweet {
  /** Tweet ID */
  id: string;
  /** Author display name */
  author: string;
  /** Twitter handle (without @) */
  handle: string;
  /** Tweet content */
  content: string;
  /** When the tweet was posted */
  createdAt: number;
  /** Likes count */
  likes: number;
  /** Retweet count */
  retweets: number;
  /** Quote tweet count */
  quotes: number;
  /** Combined engagement score */
  engagement: number;
  /** AI-analyzed sentiment */
  sentiment: TweetSentiment;
  /** Mentioned tokens/chains */
  mentions: string[];
  /** Whether this tweet has media */
  hasMedia: boolean;
}

/**
 * Twitter/CT data collection
 */
export interface TwitterData {
  /** Recent CT tweets, sorted by engagement */
  tweets: CTTweet[];
  /** Last Twitter fetch timestamp */
  lastFetch: number;
}

// =============================================================================
// AGGREGATED REAL-WORLD DATA
// =============================================================================

/**
 * Complete real-world crypto data structure
 * This is what gets passed to the Reality Blender
 */
export interface RealWorldCryptoData {
  /** Token price data */
  prices: CacheEntry<PriceData> | null;
  /** DeFi protocol data */
  defi: CacheEntry<DefiLlamaData> | null;
  /** Market sentiment */
  fearGreed: CacheEntry<FearGreedData> | null;
  /** Recent news */
  news: CacheEntry<NewsData> | null;
  /** CT tweets */
  twitter: CacheEntry<TwitterData> | null;
  /** Overall data freshness (oldest cache entry age in ms) */
  staleness: number;
  /** Whether all data sources are available */
  isComplete: boolean;
  /** Whether we're currently online */
  isOnline: boolean;
  /** Last successful sync timestamp */
  lastSync: number | null;
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/**
 * TTL values for different data types (in milliseconds)
 */
export const CACHE_TTL = {
  /** Price data refreshes every 1 minute */
  PRICES: 60 * 1000,
  /** DeFi data refreshes every 5 minutes */
  DEFI: 5 * 60 * 1000,
  /** Fear & Greed refreshes every 10 minutes */
  FEAR_GREED: 10 * 60 * 1000,
  /** News refreshes every 10 minutes */
  NEWS: 10 * 60 * 1000,
  /** Twitter refreshes every 5 minutes */
  TWITTER: 5 * 60 * 1000,
} as const;

/**
 * IndexedDB database schema version
 */
export const CACHE_DB_VERSION = 1;

/**
 * IndexedDB database name
 */
export const CACHE_DB_NAME = 'crypto-city-cache';

/**
 * Store names in IndexedDB
 */
export const CACHE_STORES = {
  PRICES: 'prices',
  DEFI: 'defi',
  FEAR_GREED: 'fearGreed',
  NEWS: 'news',
  TWITTER: 'twitter',
  META: 'meta',
} as const;

export type CacheStoreName = typeof CACHE_STORES[keyof typeof CACHE_STORES];

