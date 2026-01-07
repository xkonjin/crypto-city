/**
 * =============================================================================
 * USE REAL CRYPTO DATA HOOK
 * =============================================================================
 * React hook that manages the lifecycle of real-world crypto data.
 * 
 * Features:
 * - Fetches data from all configured APIs on mount
 * - Polls at configured intervals
 * - Handles offline/online transitions gracefully
 * - Blends real data with game simulation via Reality Blender
 * - Updates game managers (Economy, Events) with blended data
 * 
 * Usage:
 *   const { data, isLoading, error, lastSync, isOnline, refetch } = useRealCryptoData({
 *     economyManager,
 *     eventManager,
 *     enabled: true,
 *   });
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { 
  fetchAllCryptoData, 
  blendRealityData,
  cryptoCache,
  REFRESH_INTERVALS,
  FEATURES,
} from '../lib/crypto';
import type { 
  RealWorldCryptoData, 
  BlendedGameData,
} from '../lib/crypto/types';
import type { CryptoEconomyManager } from '../games/isocity/crypto/CryptoEconomyManager';
import type { CryptoEventManager } from '../games/isocity/crypto/CryptoEventManager';

// =============================================================================
// TYPES
// =============================================================================

interface UseRealCryptoDataOptions {
  /** Reference to the economy manager (for updating sentiment/yields) */
  economyManager?: CryptoEconomyManager | null;
  /** Reference to the event manager (for triggering events from news) */
  eventManager?: CryptoEventManager | null;
  /** Whether real data integration is enabled */
  enabled?: boolean;
  /** Override refresh interval (ms) */
  refreshInterval?: number;
}

interface UseRealCryptoDataReturn {
  /** Raw real-world data from APIs */
  data: RealWorldCryptoData | null;
  /** Blended game data (sentiment, yields, events) */
  blendedData: BlendedGameData | null;
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
  /** Last error (if any) */
  error: Error | null;
  /** Timestamp of last successful sync */
  lastSync: number | null;
  /** Whether we're currently online */
  isOnline: boolean;
  /** Whether any data is available (including stale) */
  hasData: boolean;
  /** Manually trigger a refresh */
  refetch: () => Promise<void>;
  /** Clear all cached data */
  clearCache: () => Promise<void>;
}

// =============================================================================
// SWR FETCHER
// =============================================================================

/**
 * SWR fetcher function for crypto data
 * Returns cached stale data immediately, then fetches fresh data
 */
async function cryptoDataFetcher(): Promise<RealWorldCryptoData> {
  await cryptoCache.init();
  return fetchAllCryptoData(false); // Don't force refresh
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for managing real-world crypto data lifecycle
 */
export function useRealCryptoData(
  options: UseRealCryptoDataOptions = {}
): UseRealCryptoDataReturn {
  const {
    economyManager,
    eventManager,
    enabled = true,
    refreshInterval = REFRESH_INTERVALS.PRICES, // Default to price refresh (1 min)
  } = options;

  // Local state for blended data
  const [blendedData, setBlendedData] = useState<BlendedGameData | null>(null);
  
  // Track if we've done initial load (using state since we read during render)
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Online status tracking
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Set up online/offline listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // SWR for data fetching with stale-while-revalidate
  const {
    data,
    error,
    isLoading,
    isValidating: isRefreshing,
    mutate,
  } = useSWR(
    // Key - null disables fetching
    enabled && FEATURES.ENABLE_BLENDING ? 'crypto-data' : null,
    cryptoDataFetcher,
    {
      // Refresh at specified interval
      refreshInterval: enabled ? refreshInterval : 0,
      // Revalidate on focus (when user returns to tab)
      revalidateOnFocus: true,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
      // Keep stale data while revalidating
      keepPreviousData: true,
      // Dedupe requests within 2 seconds
      dedupingInterval: 2000,
      // Error retry with backoff
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // Use stale data on error
      fallbackData: undefined,
      onSuccess: () => {
        setInitialLoadDone(true);
      },
    }
  );

  // Blend real data with game simulation
  useEffect(() => {
    if (!data || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync derived state when data changes
      setBlendedData(null);
      return;
    }

    // Get simulated sentiment from economy manager
    const simulatedSentiment = economyManager?.getSimulatedSentiment?.() ?? 50;
    
    // Convert from 0-100 to -100/+100 for blender
    const normalizedSimulatedSentiment = (simulatedSentiment - 50) * 2;

    // Blend real data with simulation
    const blended = blendRealityData(data, normalizedSimulatedSentiment);
    setBlendedData(blended);

    // Update economy manager with blended data
    if (economyManager) {
      economyManager.setRealWorldData(data, blended);
    }

    // Update event manager with triggers and ticker items
    if (eventManager) {
      eventManager.setRealEventTriggers(blended.eventTriggers);
      eventManager.setRealTickerItems(blended.tickerItems);
    }
  }, [data, enabled, economyManager, eventManager]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    try {
      await cryptoCache.init();
      const freshData = await fetchAllCryptoData(true); // Force refresh
      await mutate(freshData, { revalidate: false });
    } catch (err) {
      console.error('[useRealCryptoData] Refetch failed:', err);
    }
  }, [enabled, mutate]);

  // Clear cache function
  const clearCache = useCallback(async () => {
    await cryptoCache.init();
    await cryptoCache.clearAll();
    await mutate(undefined, { revalidate: true });
  }, [mutate]);

  // Calculate last sync time
  const lastSync = data?.lastSync ?? null;
  
  // Check if we have any data
  const hasData = !!(data && (data.prices || data.fearGreed || data.defi));

  return {
    data: data ?? null,
    blendedData,
    isLoading: isLoading && !initialLoadDone,
    isRefreshing,
    error: error ?? null,
    lastSync,
    isOnline,
    hasData,
    refetch,
    clearCache,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get just the online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof cryptoCache.getStats>> | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      await cryptoCache.init();
      const cacheStats = await cryptoCache.getStats();
      if (mounted) {
        setStats(cacheStats);
      }
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return stats;
}

export default useRealCryptoData;

