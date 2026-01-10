/**
 * =============================================================================
 * CRYPTO API CLIENT FACTORY
 * =============================================================================
 * Central export point for all API clients.
 * Provides a unified interface for fetching real-world crypto data.
 * 
 * Available APIs:
 * - DeFi Llama: Protocol TVL and yield data (free)
 * - CoinGecko: Token prices and market data (free tier available)
 * - Fear & Greed: Market sentiment index (free)
 * - Perplexity: AI-powered news (paid)
 * - Twitter: CT tweets (paid)
 */

// =============================================================================
// API CLIENT EXPORTS
// =============================================================================

// DeFi Llama - Protocol TVL and yields
export {
  fetchDefiLlamaData,
  findProtocolByName,
  getAverageApyByChain,
  getProtocolsByCategory,
  checkDefiLlamaHealth,
} from './defiLlama';

// CoinGecko - Token prices
export {
  fetchCoinGeckoData,
  getTokenPrice,
  getBtcPrice,
  getEthPrice,
  calculatePortfolioValue,
  getSignificantMovers,
  getAverageMarketChange,
  checkCoinGeckoHealth,
} from './coinGecko';

// Fear & Greed Index
export {
  fetchFearGreedData,
  fearGreedToSentiment,
  sentimentToFearGreed,
  getClassification,
  getClassificationEmoji,
  getClassificationColor,
  getSentimentDescription,
  getSentimentDirection,
  checkFearGreedHealth,
  CLASSIFICATION_RANGES,
} from './fearGreed';

// Perplexity AI News
export {
  fetchCryptoNews,
  syncNewsToGameEvents,
} from './perplexityNews';
export { default as perplexityNews } from './perplexityNews';

// Twitter/CT
export {
  fetchTwitterData,
  getTweetsBySentiment,
  getTopTweets,
  getTweetsByMention,
  getOverallCTSentiment,
  formatTweetForTicker,
  getCTAccountInfo,
  checkTwitterHealth,
} from './twitter';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Re-export cache types for convenience
export type {
  PriceData,
  TokenPrice,
  DefiLlamaData,
  ProtocolTVL,
  YieldPool,
  FearGreedData,
  NewsData,
  CryptoNewsItem,
  NewsSentiment,
  TwitterData,
  CTTweet,
  TweetSentiment,
  RealWorldCryptoData,
  CacheEntry,
} from '../cache/types';

// =============================================================================
// UNIFIED FETCH FUNCTION
// =============================================================================

import { cryptoCache } from '../cache/cryptoDataCache';
import { FEATURES } from '../config';
import { RealWorldCryptoData } from '../cache/types';
import { fetchDefiLlamaData } from './defiLlama';
import { fetchCoinGeckoData } from './coinGecko';
import { fetchFearGreedData } from './fearGreed';
import { fetchCryptoNews } from './perplexityNews';
import { fetchTwitterData } from './twitter';

/**
 * Fetch all real-world crypto data from enabled sources
 * Updates the cache and returns the complete data object
 * 
 * This is the main function used by the data sync layer
 * 
 * @param forceRefresh - If true, fetch even if cache is fresh
 * @returns Complete real-world data object
 */
export async function fetchAllCryptoData(forceRefresh = false): Promise<RealWorldCryptoData> {
  console.log('[CryptoAPI] Starting data sync...');
  const startTime = Date.now();

  // Initialize cache if needed
  await cryptoCache.init();

  // Check what needs updating
  const cached = await cryptoCache.getAllData(true); // Get stale data
  const now = Date.now();

  // Track fetch promises for parallel execution
  const fetchPromises: Promise<void>[] = [];

  // Fetch prices if enabled and stale
  if (FEATURES.ENABLE_PRICES) {
    const priceStale = !cached.prices || now > cached.prices.expiresAt;
    if (forceRefresh || priceStale) {
      fetchPromises.push(
        fetchCoinGeckoData()
          .then(data => cryptoCache.setPrices(data))
          .catch(err => console.error('[CryptoAPI] Price fetch failed:', err))
      );
    }
  }

  // Fetch DeFi data if enabled and stale
  if (FEATURES.ENABLE_DEFI) {
    const defiStale = !cached.defi || now > cached.defi.expiresAt;
    if (forceRefresh || defiStale) {
      fetchPromises.push(
        fetchDefiLlamaData()
          .then(data => cryptoCache.setDefiData(data))
          .catch(err => console.error('[CryptoAPI] DeFi fetch failed:', err))
      );
    }
  }

  // Fetch Fear & Greed if enabled and stale
  if (FEATURES.ENABLE_FEAR_GREED) {
    const fgStale = !cached.fearGreed || now > cached.fearGreed.expiresAt;
    if (forceRefresh || fgStale) {
      fetchPromises.push(
        fetchFearGreedData()
          .then(data => cryptoCache.setFearGreed(data))
          .catch(err => console.error('[CryptoAPI] Fear & Greed fetch failed:', err))
      );
    }
  }

  // Fetch news if enabled and stale
  if (FEATURES.ENABLE_NEWS) {
    const newsStale = !cached.news || now > cached.news.expiresAt;
    if (forceRefresh || newsStale) {
      fetchPromises.push(
        fetchCryptoNews()
          .then(data => {
            // Map Perplexity response to NewsData format
            const now = Date.now();
            const newsData = {
              items: data.tickerItems.map((item, idx) => ({
                id: `news-${now}-${idx}`,
                headline: item.text,
                summary: item.text,
                sentiment: item.sentiment,
                relevantChains: [],
                source: item.source || 'Perplexity',
                publishedAt: now,
                fetchedAt: now,
                impactLevel: 3,
              })),
              lastFetch: now,
            };
            return cryptoCache.setNews(newsData);
          })
          .catch(err => console.error('[CryptoAPI] News fetch failed:', err))
      );
    }
  }

  // Fetch Twitter if enabled and stale
  if (FEATURES.ENABLE_TWITTER) {
    const twitterStale = !cached.twitter || now > cached.twitter.expiresAt;
    if (forceRefresh || twitterStale) {
      fetchPromises.push(
        fetchTwitterData()
          .then(data => cryptoCache.setTwitter(data))
          .catch(err => console.error('[CryptoAPI] Twitter fetch failed:', err))
      );
    }
  }

  // Wait for all fetches to complete
  if (fetchPromises.length > 0) {
    await Promise.allSettled(fetchPromises);
    await cryptoCache.updateLastSync();
  }

  // Get fresh data from cache
  const result = await cryptoCache.getAllData(true);

  const elapsed = Date.now() - startTime;
  console.log(`[CryptoAPI] Sync completed in ${elapsed}ms`);

  return result;
}

/**
 * Check health of all API endpoints
 * Useful for debugging and status display
 */
export async function checkAllApiHealth(): Promise<{
  defiLlama: boolean;
  coinGecko: boolean;
  fearGreed: boolean;
  perplexity: boolean;
  twitter: boolean;
  overall: boolean;
}> {
  const { checkDefiLlamaHealth } = await import('./defiLlama');
  const { checkCoinGeckoHealth } = await import('./coinGecko');
  const { checkFearGreedHealth } = await import('./fearGreed');
  const { checkPerplexityHealth } = await import('./perplexityNews');
  const { checkTwitterHealth } = await import('./twitter');
  
  const [defiLlama, coinGecko, fearGreed, perplexity, twitter] = await Promise.all([
    checkDefiLlamaHealth(),
    checkCoinGeckoHealth(),
    checkFearGreedHealth(),
    checkPerplexityHealth(),
    checkTwitterHealth(),
  ]);

  // Core APIs must be available for "overall" health
  const overall = defiLlama && coinGecko && fearGreed;

  return {
    defiLlama,
    coinGecko,
    fearGreed,
    perplexity,
    twitter,
    overall,
  };
}

