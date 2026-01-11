/**
 * =============================================================================
 * CRYPTO DATA CACHE
 * =============================================================================
 * IndexedDB-based cache for real-world crypto data with offline-first support.
 * 
 * Features:
 * - Persistent storage using IndexedDB via 'idb' library
 * - TTL-based expiration for each data type
 * - Stale-while-revalidate pattern for seamless UX
 * - Automatic cleanup of expired entries
 * - Online/offline detection and graceful fallback
 * 
 * Usage:
 *   const cache = CryptoDataCache.getInstance();
 *   await cache.init();
 *   
 *   // Store data
 *   await cache.setPrices(priceData);
 *   
 *   // Get data (returns null if expired and not stale-ok)
 *   const prices = await cache.getPrices();
 *   
 *   // Get stale data (returns even if expired, for offline mode)
 *   const staleData = await cache.getPrices({ allowStale: true });
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  CacheEntry,
  PriceData,
  DefiLlamaData,
  FearGreedData,
  NewsData,
  TwitterData,
  RealWorldCryptoData,
  CACHE_TTL,
  CACHE_DB_VERSION,
  CACHE_DB_NAME,
  CACHE_STORES,
} from './types';
import { logger } from '../../logger';

// =============================================================================
// DATABASE SCHEMA
// =============================================================================

/**
 * IndexedDB schema definition for type-safe operations
 */
interface CryptoCacheSchema extends DBSchema {
  // Price data store
  [CACHE_STORES.PRICES]: {
    key: string;
    value: CacheEntry<PriceData>;
  };
  // DeFi Llama data store
  [CACHE_STORES.DEFI]: {
    key: string;
    value: CacheEntry<DefiLlamaData>;
  };
  // Fear & Greed data store
  [CACHE_STORES.FEAR_GREED]: {
    key: string;
    value: CacheEntry<FearGreedData>;
  };
  // News data store
  [CACHE_STORES.NEWS]: {
    key: string;
    value: CacheEntry<NewsData>;
  };
  // Twitter data store
  [CACHE_STORES.TWITTER]: {
    key: string;
    value: CacheEntry<TwitterData>;
  };
  // Metadata store (sync times, settings, etc.)
  [CACHE_STORES.META]: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: number;
    };
  };
}

// =============================================================================
// CACHE OPTIONS
// =============================================================================

interface GetCacheOptions {
  /** Return stale data if fresh data is unavailable (for offline mode) */
  allowStale?: boolean;
}

// =============================================================================
// CRYPTO DATA CACHE CLASS
// =============================================================================

/**
 * Singleton class for managing crypto data cache
 * Uses IndexedDB for persistent, offline-capable storage
 */
export class CryptoDataCache {
  // Singleton instance
  private static instance: CryptoDataCache | null = null;
  
  // IndexedDB database instance
  private db: IDBPDatabase<CryptoCacheSchema> | null = null;
  
  // Initialization state
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  
  // Online status tracking
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  
  // Cache key constants (single entry per store for simplicity)
  private readonly CACHE_KEY = 'current';

  // ---------------------------------------------------------------------------
  // SINGLETON PATTERN
  // ---------------------------------------------------------------------------

  private constructor() {
    // Set up online/offline listeners if in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        logger.debug('[CryptoCache] Online');
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        logger.debug('[CryptoCache] Offline');
      });
    }
  }

  /**
   * Get the singleton cache instance
   */
  static getInstance(): CryptoDataCache {
    if (!CryptoDataCache.instance) {
      CryptoDataCache.instance = new CryptoDataCache();
    }
    return CryptoDataCache.instance;
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Initialize the IndexedDB database
   * Must be called before any cache operations
   * Safe to call multiple times (idempotent)
   */
  async init(): Promise<void> {
    // Return existing init promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // Skip if already initialized
    if (this.initialized) {
      return;
    }
    
    this.initPromise = this.doInit();
    await this.initPromise;
  }

  /**
   * Internal initialization logic
   */
  private async doInit(): Promise<void> {
    try {
      // Open/create the IndexedDB database
      this.db = await openDB<CryptoCacheSchema>(CACHE_DB_NAME, CACHE_DB_VERSION, {
        upgrade(db) {
          // Create all object stores on first run or version upgrade
          if (!db.objectStoreNames.contains(CACHE_STORES.PRICES)) {
            db.createObjectStore(CACHE_STORES.PRICES);
          }
          if (!db.objectStoreNames.contains(CACHE_STORES.DEFI)) {
            db.createObjectStore(CACHE_STORES.DEFI);
          }
          if (!db.objectStoreNames.contains(CACHE_STORES.FEAR_GREED)) {
            db.createObjectStore(CACHE_STORES.FEAR_GREED);
          }
          if (!db.objectStoreNames.contains(CACHE_STORES.NEWS)) {
            db.createObjectStore(CACHE_STORES.NEWS);
          }
          if (!db.objectStoreNames.contains(CACHE_STORES.TWITTER)) {
            db.createObjectStore(CACHE_STORES.TWITTER);
          }
          if (!db.objectStoreNames.contains(CACHE_STORES.META)) {
            db.createObjectStore(CACHE_STORES.META);
          }
          logger.debug('[CryptoCache] Database upgraded to version', CACHE_DB_VERSION);
        },
      });
      
      this.initialized = true;
      logger.debug('[CryptoCache] Initialized');
    } catch (error) {
      logger.error('[CryptoCache] Initialization failed:', error);
      // Continue without cache in case of failure (degraded mode)
      this.initialized = true;
    }
  }

  /**
   * Check if cache is ready for operations
   */
  private ensureReady(): void {
    if (!this.initialized) {
      throw new Error('[CryptoCache] Not initialized. Call init() first.');
    }
  }

  // ---------------------------------------------------------------------------
  // PRICE DATA
  // ---------------------------------------------------------------------------

  /**
   * Store price data in cache
   */
  async setPrices(data: PriceData): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    const now = Date.now();
    const entry: CacheEntry<PriceData> = {
      data,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL.PRICES,
    };

    await this.db.put(CACHE_STORES.PRICES, entry, this.CACHE_KEY);
    logger.debug('[CryptoCache] Prices cached');
  }

  /**
   * Get price data from cache
   * Returns null if expired (unless allowStale is true)
   */
  async getPrices(options: GetCacheOptions = {}): Promise<CacheEntry<PriceData> | null> {
    this.ensureReady();
    if (!this.db) return null;

    const entry = await this.db.get(CACHE_STORES.PRICES, this.CACHE_KEY);
    if (!entry) return null;

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired && !options.allowStale) {
      return null;
    }

    return entry;
  }

  // ---------------------------------------------------------------------------
  // DEFI LLAMA DATA
  // ---------------------------------------------------------------------------

  /**
   * Store DeFi Llama data in cache
   */
  async setDefiData(data: DefiLlamaData): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    const now = Date.now();
    const entry: CacheEntry<DefiLlamaData> = {
      data,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL.DEFI,
    };

    await this.db.put(CACHE_STORES.DEFI, entry, this.CACHE_KEY);
    logger.debug('[CryptoCache] DeFi data cached');
  }

  /**
   * Get DeFi Llama data from cache
   */
  async getDefiData(options: GetCacheOptions = {}): Promise<CacheEntry<DefiLlamaData> | null> {
    this.ensureReady();
    if (!this.db) return null;

    const entry = await this.db.get(CACHE_STORES.DEFI, this.CACHE_KEY);
    if (!entry) return null;

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired && !options.allowStale) {
      return null;
    }

    return entry;
  }

  // ---------------------------------------------------------------------------
  // FEAR & GREED DATA
  // ---------------------------------------------------------------------------

  /**
   * Store Fear & Greed data in cache
   */
  async setFearGreed(data: FearGreedData): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    const now = Date.now();
    const entry: CacheEntry<FearGreedData> = {
      data,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL.FEAR_GREED,
    };

    await this.db.put(CACHE_STORES.FEAR_GREED, entry, this.CACHE_KEY);
    logger.debug('[CryptoCache] Fear & Greed cached');
  }

  /**
   * Get Fear & Greed data from cache
   */
  async getFearGreed(options: GetCacheOptions = {}): Promise<CacheEntry<FearGreedData> | null> {
    this.ensureReady();
    if (!this.db) return null;

    const entry = await this.db.get(CACHE_STORES.FEAR_GREED, this.CACHE_KEY);
    if (!entry) return null;

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired && !options.allowStale) {
      return null;
    }

    return entry;
  }

  // ---------------------------------------------------------------------------
  // NEWS DATA
  // ---------------------------------------------------------------------------

  /**
   * Store news data in cache
   */
  async setNews(data: NewsData): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    const now = Date.now();
    const entry: CacheEntry<NewsData> = {
      data,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL.NEWS,
    };

    await this.db.put(CACHE_STORES.NEWS, entry, this.CACHE_KEY);
    logger.debug('[CryptoCache] News cached');
  }

  /**
   * Get news data from cache
   */
  async getNews(options: GetCacheOptions = {}): Promise<CacheEntry<NewsData> | null> {
    this.ensureReady();
    if (!this.db) return null;

    const entry = await this.db.get(CACHE_STORES.NEWS, this.CACHE_KEY);
    if (!entry) return null;

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired && !options.allowStale) {
      return null;
    }

    return entry;
  }

  // ---------------------------------------------------------------------------
  // TWITTER DATA
  // ---------------------------------------------------------------------------

  /**
   * Store Twitter data in cache
   */
  async setTwitter(data: TwitterData): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    const now = Date.now();
    const entry: CacheEntry<TwitterData> = {
      data,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL.TWITTER,
    };

    await this.db.put(CACHE_STORES.TWITTER, entry, this.CACHE_KEY);
    logger.debug('[CryptoCache] Twitter data cached');
  }

  /**
   * Get Twitter data from cache
   */
  async getTwitter(options: GetCacheOptions = {}): Promise<CacheEntry<TwitterData> | null> {
    this.ensureReady();
    if (!this.db) return null;

    const entry = await this.db.get(CACHE_STORES.TWITTER, this.CACHE_KEY);
    if (!entry) return null;

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired && !options.allowStale) {
      return null;
    }

    return entry;
  }

  // ---------------------------------------------------------------------------
  // METADATA
  // ---------------------------------------------------------------------------

  /**
   * Store arbitrary metadata
   */
  async setMeta(key: string, value: unknown): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    await this.db.put(CACHE_STORES.META, {
      key,
      value,
      updatedAt: Date.now(),
    }, key);
  }

  /**
   * Get metadata by key
   */
  async getMeta<T = unknown>(key: string): Promise<T | null> {
    this.ensureReady();
    if (!this.db) return null;

    const entry = await this.db.get(CACHE_STORES.META, key);
    return entry ? (entry.value as T) : null;
  }

  // ---------------------------------------------------------------------------
  // AGGREGATED DATA ACCESS
  // ---------------------------------------------------------------------------

  /**
   * Get all cached data as a unified RealWorldCryptoData object
   * This is the main method used by the Reality Blender
   * 
   * @param allowStale - If true, return stale data for offline mode
   */
  async getAllData(allowStale = false): Promise<RealWorldCryptoData> {
    this.ensureReady();

    const options: GetCacheOptions = { allowStale };

    // Fetch all data in parallel
    const [prices, defi, fearGreed, news, twitter] = await Promise.all([
      this.getPrices(options),
      this.getDefiData(options),
      this.getFearGreed(options),
      this.getNews(options),
      this.getTwitter(options),
    ]);

    // Calculate staleness (how old is the oldest piece of data)
    const now = Date.now();
    const ages = [
      prices?.fetchedAt,
      defi?.fetchedAt,
      fearGreed?.fetchedAt,
      news?.fetchedAt,
      twitter?.fetchedAt,
    ].filter((t): t is number => t !== undefined);

    const oldestFetch = ages.length > 0 ? Math.min(...ages) : null;
    const staleness = oldestFetch ? now - oldestFetch : Infinity;

    // Get last successful sync timestamp
    const lastSync = await this.getMeta<number>('lastSync');

    return {
      prices,
      defi,
      fearGreed,
      news,
      twitter,
      staleness,
      isComplete: !!(prices && defi && fearGreed && news && twitter),
      isOnline: this.isOnline,
      lastSync,
    };
  }

  /**
   * Update the last sync timestamp
   */
  async updateLastSync(): Promise<void> {
    await this.setMeta('lastSync', Date.now());
  }

  // ---------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Clear all cached data
   * Useful for resetting state or debugging
   */
  async clearAll(): Promise<void> {
    this.ensureReady();
    if (!this.db) return;

    await Promise.all([
      this.db.clear(CACHE_STORES.PRICES),
      this.db.clear(CACHE_STORES.DEFI),
      this.db.clear(CACHE_STORES.FEAR_GREED),
      this.db.clear(CACHE_STORES.NEWS),
      this.db.clear(CACHE_STORES.TWITTER),
      this.db.clear(CACHE_STORES.META),
    ]);

    logger.debug('[CryptoCache] All data cleared');
  }

  /**
   * Get cache statistics for debugging/UI display
   */
  async getStats(): Promise<{
    prices: { fresh: boolean; age: number } | null;
    defi: { fresh: boolean; age: number } | null;
    fearGreed: { fresh: boolean; age: number } | null;
    news: { fresh: boolean; age: number } | null;
    twitter: { fresh: boolean; age: number } | null;
    isOnline: boolean;
    lastSync: number | null;
  }> {
    const now = Date.now();

    const getEntryStats = (entry: CacheEntry<unknown> | null) => {
      if (!entry) return null;
      return {
        fresh: now < entry.expiresAt,
        age: now - entry.fetchedAt,
      };
    };

    const [prices, defi, fearGreed, news, twitter] = await Promise.all([
      this.getPrices({ allowStale: true }),
      this.getDefiData({ allowStale: true }),
      this.getFearGreed({ allowStale: true }),
      this.getNews({ allowStale: true }),
      this.getTwitter({ allowStale: true }),
    ]);

    const lastSync = await this.getMeta<number>('lastSync');

    return {
      prices: getEntryStats(prices),
      defi: getEntryStats(defi),
      fearGreed: getEntryStats(fearGreed),
      news: getEntryStats(news),
      twitter: getEntryStats(twitter),
      isOnline: this.isOnline,
      lastSync,
    };
  }

  /**
   * Check if we're currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

/** 
 * Default cache instance for convenience
 * Use this for most operations, or call CryptoDataCache.getInstance()
 */
export const cryptoCache = CryptoDataCache.getInstance();

